
import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    window.AttachmentControl_onQueueChange = function (count) {
        const badge = document.getElementById('gpaTempAttachBadge');
        if (badge) {
            badge.textContent = String(count);
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        syncGpaFooterAttachmentButtonState(count);
    };

    document.addEventListener('bizsol:attachmentcontrol:changed', function (ev) {
        const d = ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== 'GRNPaymentMaster') return;
        if (document.getElementById('divGPAList') && typeof loadGRNPaymentApprovalList === 'function') {
            loadGRNPaymentApprovalList();
        }
    });
});


// ── Numeric input helpers ────────────────────────────────────────────────────
// Block e, E, +, - keys that browsers allow in type="number"
function blockNonNumeric(e) {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
}
// Strip any remaining non-numeric characters (paste, autofill, etc.)
function stripNonNumeric(el) {
    const val = el.value;
    const cleaned = val.replace(/[^0-9.]/g, '')   // keep digits and one dot
        .replace(/(\..*)\./g, '$1');  // allow only one decimal point
    if (val !== cleaned) el.value = cleaned;
}

// ── App-level state ─────────────────────────────────────────────────────────
const DEFAULT_BILL_ROW_COUNT = 1;
/** Edit: master PK from server (hdnGRNPaymentMasterCode mirrors this). */
let editMode = false;
/** Pending bills for Add Bill modal (GetBillDetails rows). */
let gpaAddBillModalBillRowsCache = [];
/** Full list rows (all statuses); tabs filter client-side. Matches DDL: U Pending, P Approved, R Rejected. */
let gpaListFullRows = [];
/** Raw API rows (same order as list load); used when GetByCode omits HasAttachment. */
let gpaListSourceRows = [];
/** Edit/New form: master has attachment(s) or files on server — footer Attachment button green. */
let gpaFormHasAttachmentYes = false;
/** Cached from GetVendor — used for print voucher party lookup. */
let gpaVendorListCache = [];
/** Cached from GetBankPayment — used for print voucher payment mode label. */
let gpaBankPaymentListCache = [];
/** Cached from GRN Payment Entry GetProjectMaster — bill row project dropdowns. */
let gpaProjectListCache = [];
/** Cached from GetPOList — bill row PO dropdowns (party / employee code keyed). */
let gpaPoListCache = [];
let gpaPoListPartyCodeCache = '';
/** Cached from GetProjectCategory — header Payment for + bill row Category. */
let gpaProjectCategoryCache = [];
/** Cached from GetMarketingManMaster — employee dropdown. */
let gpaEmployeeListCache = [];
/** Active list tab: 'U' | 'P' | 'R' */
let gpaListActiveStatusTab = 'U';
/** When true, list grid shows only entries pending approval on the current user (same rules as GRN Payment Approval). */
let gpaListOnlyPendingOnMe = false;

const BS_EMBED_STORAGE_KEY = 'BizsolBankStmtGrnEmbed';

/** When opening Payment Entry from bank statement embed, bank + amount are fixed for save/reconcile. */
let gpaBsEmbedLockedBankCode = 0;
let gpaBsEmbedLockedBankName = '';
let gpaBsEmbedLockedAmount = null;

function gpaClearBizsolBankStmtEmbedLocks() {
    gpaBsEmbedLockedBankCode = 0;
    gpaBsEmbedLockedBankName = '';
    gpaBsEmbedLockedAmount = null;
    const ddlB = document.getElementById('ddlBankName');
    if (ddlB) {
        ddlB.disabled = false;
        ddlB.classList.remove('gpa-bs-embed-locked');
        ddlB.removeAttribute('title');
    }
    const ha = document.getElementById('txtHeaderAmount');
    if (ha) {
        ha.readOnly = false;
        ha.disabled = false;
        ha.classList.remove('gpa-bs-embed-locked');
        ha.removeAttribute('title');
    }
}

function gpaEnsureBankDdlHasOption(ddl, bankCode, bankName) {
    const c = String(bankCode || '').trim();
    if (!ddl || !c || c === '0') return false;
    const has = [...ddl.options].some(o => o.value === c);
    if (!has) {
        const label = String(bankName || '').trim() || ('Bank #' + c);
        ddl.add(new Option(label, c));
    }
    ddl.value = c;
    return true;
}

function gpaIsBankStatementEmbed() {
    try {
        const v = String(new URLSearchParams(window.location.search).get('embedded') || '').trim().toLowerCase();
        return v === '1' || v === 'true' || v === 'yes';
    } catch (e) {
        return false;
    }
}

function gpaGetEmbedBankStatementCode() {
    try {
        const qs = new URLSearchParams(window.location.search);
        const keys = ['bankStatementCode', 'BankStatementCode', 'statementCode', 'StatementCode', 'bsCode', 'BsCode'];
        for (let i = 0; i < keys.length; i++) {
            const raw = qs.get(keys[i]);
            if (raw == null || String(raw).trim() === '') continue;
            const n = parseInt(String(raw).trim(), 10);
            if (Number.isFinite(n) && n > 0) return n;
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

/** Normalize GetBankStatementByCode (or similar) payload to one row object. */
function gpaFirstBankStatementRowFromApi(data) {
    if (data == null) return null;
    if (Array.isArray(data)) return data.length ? data[0] : null;
    if (typeof data !== 'object') return null;
    const datum = data.Data ?? data.data ?? data.Result ?? data.result;
    if (datum != null && typeof datum === 'object' && !Array.isArray(datum)) {
        const inner = datum.BankStatement ?? datum.bankStatement ?? datum;
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
            if (inner.Code != null || inner.code != null || inner.BankMaster_Code != null || inner.bankMaster_Code != null
                || inner.WithdrawalAmt != null || inner.withdrawalAmt != null) {
                return inner;
            }
        }
        if (datum.Code != null || datum.code != null || datum.BankMaster_Code != null || datum.bankMaster_Code != null
            || datum.WithdrawalAmt != null || datum.withdrawalAmt != null) {
            return datum;
        }
    }
    const inner = data.Table ?? data.table ?? data.Value ?? data.value ?? data.Item ?? data.item;
    if (Array.isArray(inner)) return inner.length ? inner[0] : null;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        if (inner.Code != null || inner.code != null || inner.BankMaster_Code != null || inner.bankMaster_Code != null
            || inner.WithdrawalAmt != null || inner.withdrawalAmt != null) {
            return inner;
        }
    }
    if (data.Code != null || data.code != null || data.BankMaster_Code != null || data.bankMaster_Code != null) {
        return data;
    }
    return null;
}

function gpaParseStmtTxnDateToInputValue(txn) {
    const s = String(txn || '').trim();
    const m = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
    if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    const m2 = s.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);
    if (m2) return `${m2[1]}-${String(m2[2]).padStart(2, '0')}-${String(m2[3]).padStart(2, '0')}`;
    return '';
}

/** Pick vendor whose name appears in bank narration (longest match wins). */
function gpaSelectPartyFromBankNarration(narration) {
    const raw = String(narration || '').trim();
    if (!raw) return false;
    const n = raw.toLowerCase();
    const ddl = document.getElementById('ddlPartyName');
    if (!ddl || !gpaVendorListCache || !gpaVendorListCache.length) return false;
    let bestCode = '';
    let bestLen = 0;
    for (let i = 0; i < gpaVendorListCache.length; i++) {
        const v = gpaVendorListCache[i];
        const name = String(v.VendorName ?? v.vendorName ?? '').trim();
        if (name.length < 2) continue;
        const nl = name.toLowerCase();
        if (n.includes(nl) && nl.length > bestLen) {
            bestLen = nl.length;
            bestCode = String(v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? '');
        }
    }
    if (bestCode && [...ddl.options].some(o => o.value === bestCode)) {
        ddl.value = bestCode;
        return true;
    }
    return false;
}

function gpaGetEmbedBankParamsFromQuery() {
    let bankMasterCode = 0;
    let bankName = '';
    let withdrawal = 0;
    try {
        const qs = new URLSearchParams(window.location.search);
        bankMasterCode = parseInt(String(qs.get('embedBankMasterCode') || '').trim(), 10) || 0;
        const enc = qs.get('embedBankName');
        if (enc) {
            try {
                bankName = decodeURIComponent(enc.replace(/\+/g, '%20'));
            } catch (eD) {
                bankName = enc;
            }
        }
        const wRaw = String(qs.get('embedWithdrawal') || '').replace(/,/g, '');
        const w = parseFloat(wRaw);
        withdrawal = Number.isFinite(w) && w > 0 ? w : 0;
    } catch (e) { /* ignore */ }
    return { bankMasterCode, bankName, withdrawal };
}

/**
 * Bank Statement list stores JSON in sessionStorage before opening iframe.
 * Prefills Amount, Ref, Date, Narration; matches Party from narration text.
 * Also reads embedBankMasterCode / embedBankName / embedWithdrawal from URL (parent passes these for iframe reliability).
 * If the grid row had no BankMaster_Code, loads SHOWDATA for bankStatementCode to resolve bank + withdrawal.
 */
async function tryApplyBankStatementEmbedPrefill(openedNewForm) {
    if (!gpaIsBankStatementEmbed() || !openedNewForm) return;

    const q = gpaGetEmbedBankParamsFromQuery();
    const bsCode = gpaGetEmbedBankStatementCode();

    let raw = null;
    try {
        raw = sessionStorage.getItem(BS_EMBED_STORAGE_KEY);
    } catch (e) { /* ignore */ }

    if (!raw && !(q.bankMasterCode > 0) && !(q.withdrawal > 0) && !(bsCode > 0)) return;

    let ctx = {};
    if (raw) {
        try {
            ctx = JSON.parse(raw);
        } catch (e) {
            ctx = {};
        }
        try {
            sessionStorage.removeItem(BS_EMBED_STORAGE_KEY);
        } catch (e2) { /* ignore */ }
    }

    let wFromCtx = parseFloat(String(ctx.withdrawal ?? ctx.withdrawalAmt ?? '0').replace(/,/g, ''));
    let w = (Number.isFinite(wFromCtx) && wFromCtx > 0) ? wFromCtx : q.withdrawal;

    const narration = String(ctx.narration ?? '');
    const ref = String(ctx.chequeRef ?? ctx.chequeRefNo ?? '').trim();
    const txn = String(ctx.txnDate ?? ctx.txn ?? '').trim();

    let bankFromCtx = parseInt(String(ctx.bankMaster_Code ?? ctx.BankMaster_Code ?? '0'), 10) || 0;
    let bankMc = bankFromCtx > 0 ? bankFromCtx : q.bankMasterCode;
    let bankNameFromCtx = String(ctx.bankName ?? ctx.BankName ?? '').trim();
    let bankName = bankNameFromCtx || String(q.bankName || '').trim();

    if (bsCode > 0 && (bankMc <= 0 || !(w > 0) || !narration.trim())) {
        try {
            const res = await BankStatementService.GetBankStatementByCode(bsCode);
            const row = gpaFirstBankStatementRowFromApi(res);
            if (row) {
                if (bankMc <= 0) {
                    const bc = parseInt(String(row.BankMaster_Code ?? row.bankMaster_Code ?? 0), 10) || 0;
                    if (bc > 0) {
                        bankMc = bc;
                        if (!bankName) bankName = String(row.BankName ?? row.bankName ?? '').trim();
                    }
                }
                if (!(w > 0)) {
                    const wa = parseFloat(String(row.WithdrawalAmt ?? row.withdrawalAmt ?? '0').replace(/,/g, ''));
                    if (Number.isFinite(wa) && wa > 0) w = wa;
                }
                if (!narration.trim()) {
                    const n = String(row.Narration ?? row.narration ?? '').trim();
                    if (n) ctx = { ...ctx, narration: n };
                }
            }
        } catch (eFetch) { /* ignore — keep ctx/url values */ }
    }

    const narrationFinal = String(ctx.narration ?? narration ?? '');

    const ha = document.getElementById('txtHeaderAmount');
    if (ha && Number.isFinite(w) && w > 0) {
        ha.value = w.toFixed(2);
        gpaBsEmbedLockedAmount = w;
        ha.readOnly = true;
        ha.disabled = true;
        ha.classList.add('gpa-bs-embed-locked');
        ha.title = 'Amount from bank statement — cannot change here.';
    }

    const ddlB = document.getElementById('ddlBankName');
    if (ddlB && bankMc > 0) {
        gpaBsEmbedLockedBankCode = bankMc;
        gpaBsEmbedLockedBankName = bankName;
        gpaEnsureBankDdlHasOption(ddlB, bankMc, bankName);
        ddlB.disabled = true;
        ddlB.classList.add('gpa-bs-embed-locked');
        ddlB.title = 'Bank from bank statement — cannot change here.';
    }

    const refEl = document.getElementById('txtRefNo');
    if (refEl && ref) refEl.value = ref;

    const dtEl = document.getElementById('dtPaymentDate');
    const iso = gpaParseStmtTxnDateToInputValue(txn);
    if (dtEl && iso) dtEl.value = iso;

    const nar = document.getElementById('txtNarration');
    if (nar && narrationFinal) nar.value = narrationFinal;

    gpaSelectPartyFromBankNarration(narrationFinal);
    if (getGpaCounterpartyKey()) {
        await onPartyChange();
    } else {
        const chk = document.getElementById('chkGpaFillGrid');
        if (chk && chk.checked) {
            const cp = getGpaCounterpartyKey();
            if (cp) await onGpaFillGridChange();
        }
    }

    recalcFooter();
}

// ══════════════════════════════════════════════════════════════════════════════
// LIST VIEW (GetGRNPaymentApprovalList → BizsolCustomFilterGrid, same as GRNService)
// ══════════════════════════════════════════════════════════════════════════════
/** Per-level row approved — same rules as GRNPaymentApproval.js levelRowIsApproved. */
function gpaListLevelRowIsApproved(lvl) {
    if (!lvl || typeof lvl !== 'object') return false;
    const on = lvl.ApprovedOn ?? lvl.Approved_Date ?? lvl.ApprovedDate ?? lvl.ApprovedOnDate;
    if (on != null && String(on).trim() !== '') return true;
    const st = (lvl.Status ?? lvl.ApprovalStatus ?? lvl.IsApproved ?? '').toString().trim().toLowerCase();
    return st === 'y' || st === 'approved' || st === '1' || st === 'true' || st === 'p';
}

/** Per-level row rejected — list API often leaves master Status as U but sets level row. */
function gpaListLevelRowIsRejected(lvl) {
    if (!lvl || typeof lvl !== 'object') return false;
    const rej = lvl.IsRejected ?? lvl.isRejected ?? lvl.Rejected ?? lvl.rejected;
    if (rej === true || rej === 1 || rej === 'Y' || rej === 'y' || String(rej).toLowerCase() === 'true') return true;
    const raw = (lvl.Status ?? lvl.ApprovalStatus ?? lvl.LevelStatus ?? lvl.IsApproved ?? '').toString().trim();
    const u = raw.toUpperCase();
    const low = raw.toLowerCase();
    if (u === 'R' || u === 'REJECT' || u === 'REJECTED' || low === 'rejected' || low === 'reject') return true;
    const rejOn = lvl.RejectedOn ?? lvl.Rejected_Date ?? lvl.RejectionDate ?? lvl.RejectDate;
    if (rejOn != null && String(rejOn).trim() !== '') return true;
    return false;
}

function gpaListAnyLevelRejected(p) {
    const levels = gpaListParseLevelDetailsToArray(p.LevelDetails);
    for (let i = 0; i < levels.length; i++) {
        if (gpaListLevelRowIsRejected(levels[i])) return true;
    }
    return false;
}

/** When master Status lags API, infer approved from levels (GRNPaymentApproval allLevelsApprovedFromDetails). */
function gpaListAllLevelsApprovedFromDetails(p) {
    const total = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (total < 1) return false;
    const levels = gpaListParseLevelDetailsToArray(p.LevelDetails);
    if (!levels.length) return false;
    for (let i = 1; i <= total; i++) {
        const lvl = levels.find(function (l) {
            return gpaListLevelNoFromRow(l) === i;
        });
        if (!gpaListLevelRowIsApproved(lvl)) return false;
    }
    return true;
}

/** Map API row to status code U / P / R — aligned with GRNPaymentApproval getApprovalStatus + list quirks. */
function normalizeGpaListStatusCode(item) {
    if (!item || typeof item !== 'object') return 'U';

    const rejMaster = item.IsRejected ?? item.isRejected ?? item.Rejected ?? item.rejected
        ?? item.Reject_IND ?? item.RejectInd ?? item.RejectedYN;
    if (rejMaster === true || rejMaster === 1 || rejMaster === 'Y' || rejMaster === 'y' || String(rejMaster).toLowerCase() === 'true') {
        return 'R';
    }
    if (gpaListAnyLevelRejected(item)) return 'R';

    const v =
        item.Status ?? item.status ?? item.ApprovalStatus ?? item.approvalStatus ?? item.Approval_Status
        ?? item.EntryStatus ?? item.entryStatus ?? item.RecordStatus ?? item.recordStatus
        ?? item.PaymentStatus ?? item.paymentStatus ?? item.Flag ?? item.flag
        ?? item.CodeStatus ?? item.codeStatus ?? item.MasterStatus ?? item.masterStatus;
    const rawStr = v !== undefined && v !== null ? String(v).trim() : '';
    const s = rawStr.toUpperCase();
    const slow = rawStr.toLowerCase();

    if (s === 'R' || s === 'REJECTED' || s === 'REJECT' || slow === 'rejected'
        || s === 'RECT' || s.indexOf('RECTIF') === 0) {
        return 'R';
    }
    if (s === 'P' || s === 'APPROVED' || s === 'APPROVE' || rawStr === 'Y' || slow === 'approved'
        || slow === 'complete' || slow === 'completed') return 'P';

    if (gpaListAllLevelsApprovedFromDetails(item)) return 'P';

    const cur = parseInt(item.CurrentLevelNo ?? item.CurrentLevel ?? 0, 10) || 0;
    const tot = parseInt(item.TotalLevels ?? item.MaxLevel ?? 0, 10) || 0;
    if (tot > 0 && cur > tot) return 'P';

    const boolOk = item.IsApproved ?? item.isApproved ?? item.Approved ?? item.approved;
    if (boolOk === true || boolOk === 1 || boolOk === 'Y' || boolOk === 'y') return 'P';

    if (rawStr === '' || rawStr === 'N' || s === 'U' || slow === 'pending' || s === 'UNAPPROVED' || s === 'NO') return 'U';

    if (
        slow === 'complete' || slow === 'completed'
        || slow.indexOf('fully approved') >= 0 || slow.indexOf('final approved') >= 0
        || slow.indexOf('all approved') >= 0
        || (slow.indexOf('all levels') >= 0 && slow.indexOf('approved') >= 0)
    ) {
        return 'P';
    }

    return 'U';
}

/** Same as GRNPaymentApproval.js — LevelDetails may be JSON string or array. */
function gpaListParseLevelDetailsToArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return [];
        try {
            const j = JSON.parse(t);
            return Array.isArray(j) ? j : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

function gpaListLevelNoFromRow(r) {
    const n = parseInt(r.LevelNo ?? r.Level ?? r.LevelOrder ?? 0, 10);
    return Number.isFinite(n) ? n : 0;
}

function gpaListGetCurrentLevelRow(p) {
    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const levels = gpaListParseLevelDetailsToArray(p.LevelDetails);
    const row = levels.find(function (l) {
        return gpaListLevelNoFromRow(l) === cur;
    });
    if (row) return row;
    if (levels.length && cur >= 1 && cur <= levels.length) return levels[cur - 1];
    return null;
}

function gpaListTruthyFlag(v) {
    if (v === true || v === 1) return true;
    const s = (v != null ? String(v) : '').trim().toLowerCase();
    return s === 'y' || s === '1' || s === 'true';
}

function gpaListSessionUserMasterCode() {
    try {
        const a = JSON.parse(sessionStorage.getItem('authKey'));
        return parseInt(a && a.UserMaster_Code, 10) || 0;
    } catch (e) {
        return 0;
    }
}

function gpaListSessionGroupMasterCode() {
    try {
        const d = JSON.parse(sessionStorage.getItem('UserDetails'));
        if (Array.isArray(d) && d[0] != null) {
            return parseInt(d[0].GroupMaster_Code, 10) || 0;
        }
    } catch (e) { /* ignore */ }
    return 0;
}

function gpaListPickFirstPositiveInt(obj, keys) {
    if (!obj || typeof obj !== 'object') return 0;
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v == null || v === '') continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

/**
 * True when list row is pending (U) and current user/group should act (aligned with GRNPaymentApproval.js paymentIsPendingOnMe).
 */
function gpaListEntryIsPendingOnMeFromRaw(p) {
    if (!p || typeof p !== 'object') return false;
    if (normalizeGpaListStatusCode(p) !== 'U') return false;

    if (gpaListTruthyFlag(p.IsPendingForMe) || gpaListTruthyFlag(p.PendingForMe) || gpaListTruthyFlag(p.CanApproveNow)
        || gpaListTruthyFlag(p.IsMyApproval) || gpaListTruthyFlag(p.PendingOnMe)) {
        return true;
    }

    const me = gpaListSessionUserMasterCode();
    const myG = gpaListSessionGroupMasterCode();

    const lvl = gpaListGetCurrentLevelRow(p);
    const ru = gpaListPickFirstPositiveInt(lvl, [
        'UserMaster_Code', 'userMaster_Code', 'ApproverUserMaster_Code', 'ApproverUser_Code',
        'AssignedUserMaster_Code', 'ApprovalUserMaster_Code', 'Approver_Code',
    ]);
    const rg = gpaListPickFirstPositiveInt(lvl, [
        'GroupMaster_Code', 'groupMaster_Code', 'ApproverGroupMaster_Code',
        'AssignedGroupMaster_Code', 'ApprovalGroupMaster_Code',
    ]);

    if (me > 0 && ru > 0 && ru === me) return true;
    if (myG > 0 && rg > 0 && rg === myG) return true;

    const mu = gpaListPickFirstPositiveInt(p, [
        'CurrentApproverUserMaster_Code', 'ApproverUserMaster_Code', 'NextApproverUserMaster_Code',
        'PendingApproverUserMaster_Code',
    ]);
    const mg = gpaListPickFirstPositiveInt(p, [
        'CurrentApproverGroupMaster_Code', 'ApproverGroupMaster_Code', 'NextApproverGroupMaster_Code',
        'PendingApproverGroupMaster_Code',
    ]);
    if (me > 0 && mu > 0 && mu === me) return true;
    if (myG > 0 && mg > 0 && mg === myG) return true;

    const hasAssignee = (ru + rg + mu + mg) > 0;
    if (!hasAssignee) {
        return true;
    }
    return false;
}

function gpaListEntryIsPendingOnMe(row) {
    const raw = row && row._gpaRaw;
    return gpaListEntryIsPendingOnMeFromRaw(raw || {});
}

function syncGpaListPendingOnMeChipActive() {
    const chip = document.getElementById('gpaListChipPendingOnMe');
    if (chip) {
        chip.classList.toggle('gpa-list-chip-onme--active', !!gpaListOnlyPendingOnMe);
    }
}

function updateGpaListPendingOnMeCount() {
    const el = document.getElementById('gpaListCountPendingOnMe');
    if (!el) return;
    if (!gpaListFullRows.length) {
        el.textContent = '—';
        return;
    }
    let n = 0;
    for (let i = 0; i < gpaListFullRows.length; i++) {
        if (gpaListEntryIsPendingOnMe(gpaListFullRows[i])) n++;
    }
    el.textContent = String(n);
}

function toggleGpaListPendingOnMeFilter() {
    gpaListOnlyPendingOnMe = !gpaListOnlyPendingOnMe;
    syncGpaListPendingOnMeChipActive();
    renderGpaListGridForActiveTab();
}
window.toggleGpaListPendingOnMeFilter = toggleGpaListPendingOnMeFilter;

function applyGpaListPendingOnMeFilter() {
    const a = document.getElementById('gpaListChipPendingOnMe');
    if (a && a.href) window.location.href = a.href;
}
window.applyGpaListPendingOnMeFilter = applyGpaListPendingOnMeFilter;

function formatGpaListDate(val) {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s.substring(0, 10) + 'T12:00:00');
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return s;
}

function gpaBizsolMetaKey(k) {
    return typeof k === 'string' && k.indexOf('__bizsol') === 0;
}

function gpaAttachmentYesFromRaw(raw) {
    if (raw === undefined || raw === null) return false;
    const s = String(raw).trim().toLowerCase();
    return s === 'yes' || s === 'y' || s === 'true' || s === '1';
}

function gpaFindHasAttachmentColumnKey(item) {
    if (!item || typeof item !== 'object') return null;
    const direct = [
        'HASATTACHMENT',
        'HasAttachment',
        'hasAttachment',
        'HAS_ATTACH',
        'Has_Attachment',
        'Has Attachment',
    ];
    let i;
    for (i = 0; i < direct.length; i++) {
        if (Object.prototype.hasOwnProperty.call(item, direct[i])) return direct[i];
    }
    for (const k in item) {
        if (!Object.prototype.hasOwnProperty.call(item, k) || gpaBizsolMetaKey(k)) continue;
        const kn = String(k).replace(/\s+/g, '');
        if (/hasattachment/i.test(kn)) return k;
    }
    return null;
}

function gpaItemHasAttachmentYes(item) {
    if (!item || typeof item !== 'object') return false;
    const k = gpaFindHasAttachmentColumnKey(item);
    return k ? gpaAttachmentYesFromRaw(item[k]) : false;
}

function gpaResolveHasAttachmentYesFromList(masterCode) {
    const c = parseInt(String(masterCode != null ? masterCode : 0), 10) || 0;
    if (!c) return false;
    const rows = gpaListSourceRows;
    if (!Array.isArray(rows)) return false;
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r || typeof r !== 'object') continue;
        const rc = parseInt(String(r.Code != null ? r.Code : r.code != null ? r.code : 0), 10) || 0;
        if (rc !== c) continue;
        return gpaItemHasAttachmentYes(r);
    }
    return false;
}

function syncGpaFooterAttachmentButtonState(pendingQueueCount) {
    const btn = document.getElementById('btnGpaFooterAttach');
    if (!btn) return;
    let pending = pendingQueueCount;
    if (pending === undefined || pending === null) {
        const badge = document.getElementById('gpaTempAttachBadge');
        pending = badge ? parseInt(String(badge.textContent || '0').trim(), 10) || 0 : 0;
    } else {
        pending = parseInt(String(pendingQueueCount), 10) || 0;
    }
    const yes = !!gpaFormHasAttachmentYes || pending > 0;
    btn.classList.toggle('btn-gpa-footer-attach--yes', yes);
}

function gpaNormalizeAttachmentApiRows(resp) {
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== 'object') return [];
    if (Array.isArray(resp.Data)) return resp.Data;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.Table)) return resp.Table;
    return [];
}

/** Edit form: HasAttachment from master/list + GetAttachmentUploadFiles (same source as Attachment control). */
async function gpaSyncFooterAttachmentFromApis(master, masterCode) {
    const c = parseInt(String(masterCode != null ? masterCode : 0), 10) || 0;
    gpaFormHasAttachmentYes =
        gpaItemHasAttachmentYes(master || {}) || gpaResolveHasAttachmentYesFromList(c);
    if (c > 0) {
        try {
            const resp = await AttachmentControlService.GetAttachmentUploadFiles('GRNPaymentMaster', c, '', 0);
            const rows = gpaNormalizeAttachmentApiRows(resp);
            if (rows.length > 0) gpaFormHasAttachmentYes = true;
        } catch (err) {
            console.warn('gpaSyncFooterAttachmentFromApis:', err);
        }
    }
    syncGpaFooterAttachmentButtonState();
}

function gpaGetListRowRawByCode(codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    for (let i = 0; i < (gpaListFullRows || []).length; i++) {
        const row = gpaListFullRows[i];
        const raw = row?._gpaRaw || row;
        const c = parseInt(String(raw?.Code ?? raw?.code ?? row?.Code ?? 0), 10);
        if (c === n) return raw;
    }
    for (let j = 0; j < (gpaListSourceRows || []).length; j++) {
        const raw = gpaListSourceRows[j];
        const c = parseInt(String(raw?.Code ?? raw?.code ?? 0), 10);
        if (c === n) return raw;
    }
    return null;
}

function viewGRNPaymentEntry(code) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    if (typeof window.OpenDetailModal === 'function') {
        window.OpenDetailModal(codeNum);
        return;
    }
    editGRNPaymentApproval(codeNum);
}

function mapGpaListRow(item) {
    const code = item.Code ?? item.code ?? 0;
    const entryNo = item.EntryNo ?? item.entryNo ?? '';
    const ed = item.EntryDate ?? item.entryDate ?? item.PaymentDate ?? item.paymentDate;
    const party = item.PartyName ?? item.VendorName ?? item.AccountName ?? item.partyName ?? item.Party ?? '';
    const empRaw = item.Employee ?? item.employee ?? item.MarketingManMaster ?? item.marketingManMaster
        ?? item.MarketingManName ?? item.marketingManName ?? '';
    const employee = empRaw !== undefined && empRaw !== null ? String(empRaw).trim() : '';
    const rawAmt = item.Amount ?? item.amount ?? item.HeaderAmount ?? item.headerAmount;
    const amt = rawAmt !== undefined && rawAmt !== null && rawAmt !== '' ? Number(rawAmt) : '';
    const ref = item.RefNo ?? item.refNo ?? '';
    const label = String(entryNo || code || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const rawEdStr = ed ? String(ed).substring(0, 10) : '';
    const enNum = parseInt(entryNo, 10) || 0;
    const hasAttachmentYes = gpaItemHasAttachmentYes(item);
    const attachBtnClass = hasAttachmentYes ? 'im-btn-attach im-btn-attach--has-attachment' : 'im-btn-attach';
    const btns =
        '<button type="button" class="im-btn-view" title="View" onclick="window.viewGRNPaymentEntry(' + code + ')">' +
        '<i class="fa fa-eye"></i></button>' +
        '<button type="button" class="im-btn-print-preview" title="Print Preview" onclick="window.PrintGRNPaymentFromList(' + code + ',\'preview\')">' +
        '<i class="fa fa-search-plus"></i></button>' +
        '<button type="button" class="im-btn-print" title="Print" onclick="window.PrintGRNPaymentFromList(' + code + ',\'print\')">' +
        '<i class="fa fa-print"></i></button>' +
        '<button type="button" class="im-btn-edit" title="Edit" onclick="window.editGRNPaymentApproval(' + code + ')">' +
        '<i class="fas fa-pen"></i></button>' +
        '<button type="button" class="' + attachBtnClass + '" title="Attachment" onclick="window.openGpaListAttachmentControl(' + code + ',' + enNum + ',\'' + rawEdStr + '\')">' +
        '<i class="fas fa-paperclip"></i></button>' +
        '<button type="button" class="im-btn-delete" title="Delete" onclick="window.confirmDeleteGRNPaymentApproval(' + code + ', \'' + label + '\')">' +
        '<i class="fas fa-trash-can"></i></button>';
    const row = {
        'Entry No': entryNo,
        'Entry Date': formatGpaListDate(ed),
        'Party Name': party,
        Employee: employee,
        'Amount': amt,
        'Ref No': ref,
        Action: btns,
        Code: code,
        StatusCode: normalizeGpaListStatusCode(item),
        _gpaRaw: item,
    };
    return row;
}

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY LIST — CARD VIEW (approval-progress cards, same design as GRNPaymentApproval.js)
// ══════════════════════════════════════════════════════════════════════════════

function gpeEscHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gpeFmtDateDisplay(d) {
    if (!d) return '';
    const s = String(d).substring(0, 10);
    if (s.length < 10) return s;
    const [y, m, dd] = s.split('-');
    return `${dd}/${m}/${y}`;
}

function gpeFmtCurrency(v) {
    const n = parseFloat(String(v == null ? '' : v).replace(/,/g, ''));
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function gpeItemHasAttachmentYes(item) {
    if (!item || typeof item !== 'object') return false;
    const v = item.HasAttachment ?? item.hasAttachment ?? item.IsAttachment
        ?? item.AttachmentYN ?? item.HasFile ?? item.HasFiles ?? item.Attachment;
    if (v === true || v === 1) return true;
    return ['y', '1', 'true', 'yes'].includes(String(v ?? '').trim().toLowerCase());
}

function BuildGpeCardStepper(currentLevel, totalLevels, statusLabel) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    const st = statusLabel.toLowerCase();
    let html = '<div class="gpa-stepper">';
    for (let i = 1; i <= totalLevels; i++) {
        let stepClass;
        if (st === 'approved') stepClass = 'gpa-step-done';
        else if (i < currentLevel) stepClass = 'gpa-step-done';
        else if (i === currentLevel) stepClass = st === 'rejected' ? 'gpa-step-rejected' : 'gpa-step-active';
        else stepClass = 'gpa-step-pending';

        const lineClass = (i < currentLevel || st === 'approved')
            ? 'gpa-step-line-done' : 'gpa-step-line-pending';

        const iconHtml = stepClass === 'gpa-step-done'
            ? '<i class="fa fa-check" style="font-size:0.6rem;"></i>'
            : stepClass === 'gpa-step-rejected'
                ? '<i class="fa fa-times" style="font-size:0.6rem;"></i>'
                : i;

        html += `<div class="gpa-step-item">
                    <div class="gpa-step-circle ${stepClass}">${iconHtml}</div>
                    <div class="gpa-step-lbl">L${i}</div>
                 </div>`;
        if (i < totalLevels) {
            html += `<div class="gpa-step-connector ${lineClass}"></div>`;
        }
    }
    html += '</div>';
    return html;
}

function BuildGpeEntryCard(rawItem) {
    const code   = parseInt(rawItem.Code ?? rawItem.code ?? 0, 10) || 0;
    const entryPlain = String(rawItem.EntryNo ?? rawItem.entryNo ?? code);
    const vendorPlain = String(
        rawItem.PartyName ?? rawItem.VendorName ?? rawItem.AccountName
        ?? rawItem.partyName ?? rawItem.vendorName ?? ''
    );
    const edRaw = rawItem.EntryDate ?? rawItem.entryDate ?? rawItem.PaymentDate ?? rawItem.paymentDate ?? '';
    const rawEdStr = edRaw ? String(edRaw).substring(0, 10) : '';
    const entryDate = gpeFmtDateDisplay(edRaw);
    const amount = gpeFmtCurrency(rawItem.Amount ?? rawItem.amount ?? rawItem.HeaderAmount ?? rawItem.headerAmount ?? '');
    const totalLvl = parseInt(rawItem.TotalLevels ?? rawItem.MaxLevel ?? 0, 10) || 0;
    const curLvlNo = parseInt(rawItem.CurrentLevelNo ?? rawItem.CurrentLevel ?? 1, 10) || 1;
    const enNum = parseInt(entryPlain, 10) || 0;

    const statusCode = normalizeGpaListStatusCode(rawItem);
    const statusLabel = statusCode === 'P' ? 'Approved' : statusCode === 'R' ? 'Rejected' : 'Pending';
    let statusClr, statusBg;
    if (statusCode === 'P') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (statusCode === 'R') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = totalLvl > 0 ? BuildGpeCardStepper(curLvlNo, totalLvl, statusLabel) : '';
    const levelChipLabel = totalLvl > 0 ? `L${curLvlNo} / L${totalLvl}` : '';

    const hasAttach = gpeItemHasAttachmentYes(rawItem);
    const attachBg = hasAttach ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const attachShadow = hasAttach ? 'rgba(22,163,74,0.35)' : 'rgba(14,165,233,0.35)';

    const safeEntry = gpeEscHtml(entryPlain).replace(/'/g, '\\&#39;');

    const printBtns = `<div class="gpa-pay-card-print-btns">
        <button type="button" class="btn-gpa-print-icon btn-gpa-print-prev" title="Print Preview"
                onclick="window.PrintGRNPaymentFromList(${code},'preview')">
            <i class="fa fa-search-plus"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon btn-gpa-print-go" title="Print"
                onclick="window.PrintGRNPaymentFromList(${code},'print')">
            <i class="fa fa-print"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon" title="Edit"
                style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 2px 8px rgba(59,130,246,0.35);"
                onclick="window.editGRNPaymentApproval(${code})">
            <i class="fas fa-pen"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon" title="Attachments"
                style="background:${attachBg};color:#fff;box-shadow:0 2px 8px ${attachShadow};"
                onclick="window.openGpaListAttachmentControl(${code},${enNum},'${rawEdStr}')">
            <i class="fas fa-paperclip"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon" title="Delete"
                style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 2px 8px rgba(239,68,68,0.35);"
                onclick="window.confirmDeleteGRNPaymentApproval(${code},'${safeEntry}')">
            <i class="fas fa-trash-can"></i>
        </button>
    </div>`;

    const projName = gpeEscHtml(
        rawItem.ProjectName ?? rawItem.projectName ?? rawItem.Project ?? rawItem.project ?? ''
    );
    const subProjName = gpeEscHtml(
        rawItem.SubProjectName ?? rawItem.subProjectName ?? rawItem.SubProject ?? rawItem.subProject ?? ''
    );
    const projLine = projName
        ? `<div style="font-size:0.7rem;color:#64748b;margin-top:4px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
               <i class="fa fa-diagram-project me-1" style="color:#667eea;font-size:0.68rem;"></i>${projName}${subProjName ? ' <span style="color:#94a3b8;">&middot;</span> ' + subProjName : ''}
           </div>`
        : '';

    const searchKey = gpeEscHtml((vendorPlain + ' ' + entryPlain).toLowerCase());

    return `<div class="gpa-pay-card section-entry-animation" data-code="${code}" data-gpe-search="${searchKey}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">Entry</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${gpeEscHtml(entryPlain)}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${gpeEscHtml(vendorPlain)}
                </div>
                <div class="gpa-pay-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${entryDate || '—'}</span>
                    ${levelChipLabel ? `<span class="gpa-pay-level-chip"><i class="fa fa-layer-group me-1"></i>${levelChipLabel}</span>` : ''}
                </div>
                ${projLine}
            </div>
            <div class="gpa-pay-card-right">
                <div class="gpa-pay-amount">${amount}</div>
                <div class="gpa-pay-status-badge" style="color:${statusClr};background:${statusBg};">${statusLabel}</div>
            </div>
        </div>
        ${totalLvl > 0 ? `<div class="gpa-pay-card-levels">
            <div class="gpa-pay-level-label"><i class="fa fa-code-branch me-1" style="color:#667eea;"></i>Approval Progress</div>
            ${stepperHtml}
        </div>` : ''}
        <div class="gpa-pay-card-footer">${printBtns}</div>
    </div>`;
}

function RenderGpeEntryListAsCards(filteredRaw) {
    const container = document.getElementById('gpaEntryCardsContainer');
    if (!container) return;
    if (!filteredRaw || !filteredRaw.length) {
        container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px 16px;font-size:0.85rem;"><i class="fa fa-inbox me-2"></i>No payment entries in this status.</div>';
        container.style.display = 'block';
        return;
    }
    container.innerHTML = filteredRaw.map(BuildGpeEntryCard).join('');
    container.style.display = 'block';
}

function showListView() {
    const list = document.getElementById('divGPAList');
    const form = document.getElementById('divGPAForm');
    const bar = document.getElementById('floatBar');
    if (list) list.style.display = 'block';
    if (form) form.style.display = 'none';
    if (bar) bar.style.display = 'none';
}

function showFormView() {
    const list = document.getElementById('divGPAList');
    const form = document.getElementById('divGPAForm');
    const bar = document.getElementById('floatBar');
    if (list) list.style.display = 'none';
    if (form) form.style.display = 'block';
    if (bar) bar.style.display = 'flex';
    syncFloatBarMargin();
    gpaShowFillGridCheckbox(!editMode);
    updateGpaFloatModeBadge(editMode ? 'edit' : undefined);
}

function gpaListEmptyTabPlaceholderRow() {
    return {
        'Entry No': '',
        'Entry Date': '',
        'Party Name': 'No payment entries in this status.',
        Employee: '',
        'Amount': '',
        'Ref No': '',
        Action: '',
        Code: '__gpa_empty__',
        StatusCode: gpaListActiveStatusTab,
    };
}

function updateGpaStatusTabStrip() {
    const counts = { U: 0, P: 0, R: 0 };
    for (let i = 0; i < gpaListFullRows.length; i++) {
        const c = gpaListFullRows[i].StatusCode || 'U';
        if (counts[c] !== undefined) counts[c]++;
    }
    const elU = document.getElementById('gpaTabCountU');
    const elP = document.getElementById('gpaTabCountP');
    const elR = document.getElementById('gpaTabCountR');
    if (elU) elU.textContent = String(counts.U);
    if (elP) elP.textContent = String(counts.P);
    if (elR) elR.textContent = String(counts.R);
    updateGpaListPendingOnMeCount();
    document.querySelectorAll('.gpa-status-tab').forEach((btn) => {
        const st = btn.getAttribute('data-gpa-status');
        const on = st === gpaListActiveStatusTab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

function renderGpaListGridForActiveTab() {
    const StringFilterColumn = ['Party Name', 'Employee', 'Ref No'];
    const NumericFilterColumn = ['Entry No', 'Amount'];
    const DateFilterColumn = ['Entry Date'];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ['Code', 'StatusCode', '__bizsolRowClass', '_gpaRaw'];
    const ColumnAlignment = { Action: 'center;width:308px;' };

    updateGpaStatusTabStrip();

    if (gpaListFullRows.length === 0) {
        $('#gpaListTable').hide();
        $('#paginator-gpaListTable').html('');
        return;
    }

    const tab = gpaListActiveStatusTab || 'U';
    let filtered = gpaListFullRows.filter((r) => (r.StatusCode || 'U') === tab);
    if (gpaListOnlyPendingOnMe) {
        filtered = filtered.filter((r) => gpaListEntryIsPendingOnMe(r));
    }
    if (filtered.length === 0) filtered = [gpaListEmptyTabPlaceholderRow()];

    $('#gpaListTable').show();
    BizsolCustomFilterGrid.CreateDataTable(
        'gpaListTable-hader',
        'gpaListTbody-body',
        filtered,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
}

function onGpaListStatusTabClick(code) {
    const c = code === 'P' || code === 'R' ? code : 'U';
    gpaListActiveStatusTab = c;
    gpaListOnlyPendingOnMe = false;
    syncGpaListPendingOnMeChipActive();
    renderGpaListGridForActiveTab();
}
window.onGpaListStatusTabClick = onGpaListStatusTabClick;

function loadGRNPaymentApprovalList() {
    gpaListOnlyPendingOnMe = false;
    syncGpaListPendingOnMeChipActive();
    return GRNPaymentApprovalService.GetGRNPaymentApprovalList()
        .then(function (response) {
            const raw = normalizeApiRows(response);
            gpaListSourceRows = raw;
            gpaListFullRows = raw.map(mapGpaListRow);
            if (gpaListFullRows.length === 0) {
                if (typeof toastr !== 'undefined') toastr.warning('No payment entries found.');
                $('#gpaListTable').hide();
                $('#paginator-gpaListTable').html('');
                updateGpaStatusTabStrip();
            } else {
                renderGpaListGridForActiveTab();
            }
        })
        .catch(function () {
            gpaListFullRows = [];
            gpaListSourceRows = [];
            gpaListOnlyPendingOnMe = false;
            syncGpaListPendingOnMeChipActive();
            if (typeof toastr !== 'undefined') toastr.error('Failed to load payment list.');
            $('#gpaListTable').hide();
            updateGpaStatusTabStrip();
        });
}

function newGRNPaymentApproval() {
    resetGRNPaymentApprovalForm();
    showFormView();
}

function cancelGRNPaymentApproval() {
    resetGRNPaymentApprovalForm();
    loadGRNPaymentApprovalList();
    showListView();
}

async function editGRNPaymentApproval(code) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    var ModuleName = 'Payment Entry',
        OptionName = 'Edit',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        showToast('Loading...', 'info');
        try {
            await loadGRNPaymentApprovalByCode(codeNum);
            showFormView();
            showToast('Payment entry loaded for editing.', 'success');
        } catch (e) {
            showToast('Failed to open record.', 'error');
        }
    });
}

function confirmDeleteGRNPaymentApproval(code, entryLabel) {
    if (!code) return;
    const el = document.getElementById('gpaDeleteEntryLabel');
    if (el) el.textContent = entryLabel || code;
    const ta = document.getElementById('gpaTxtDeleteReason');
    if (ta) ta.value = '';
    const btn = document.getElementById('gpaBtnConfirmDelete');
    if (btn) {
        btn.onclick = () => doDeleteGRNPaymentApproval(code);
    }
    const modalEl = document.getElementById('gpaDeleteConfirmModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function doDeleteGRNPaymentApproval(code) {
    var ModuleName = 'Payment Entry',
        OptionName = 'Delete',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        const reason = document.getElementById('gpaTxtDeleteReason')?.value?.trim();
        if (!reason) {
            showToast('Please enter reason for delete.', 'warning');
            return;
        }
        try {
            const result = await GRNPaymentApprovalService.DeleteGRNPaymentApproval(code, reason, '', '');
            const isSuccess = result && (
                result.Status === 'Y' ||
                result.Status === 'y' ||
                result.Status === 'success' ||
                result.success === true ||
                result.Success === true
            );
            if (isSuccess) {
                const modalEl = document.getElementById('gpaDeleteConfirmModal');
                if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    bootstrap.Modal.getInstance(modalEl)?.hide();
                }
                showToast(result.Msg ?? result.msg ?? 'Deleted successfully.', 'success');
                const delPk = parseInt(String(code), 10) || 0;
                if (delPk > 0) {
                    AttachmentControlService.DeleteAllAttachment('GRNPaymentMaster', delPk, '', 0).catch(function (e) {
                        console.warn('Delete all attachments after payment entry delete', e);
                    });
                }
                editMode = false;
                await loadGRNPaymentApprovalList();
                showListView();
            } else {
                showToast(result?.Msg ?? result?.msg ?? 'Delete failed.', 'error');
            }
        } catch (e) {
            console.error('doDeleteGRNPaymentApproval', e);
            showToast('Delete failed.', 'error');
        }
    });
}

// ── DOM ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const isEntryPage = !!document.getElementById('billTbody');
    if (!isEntryPage) {
        // Loaded on a non-entry page (e.g. GRN Payment Approval) — only warm caches for PrintGRNPaymentVoucher
        try {
            await Promise.all([
                loadVendorList(),
                loadBankPaymentList(),
                loadGpaProjectCategoryLists(),
            ]);
        } catch (e) { /* ignore */ }
        return;
    }
    await Promise.all([
        loadVendorList(),
        loadBankPaymentList(),
        loadGpaBankMasterList(),
        loadEmployeeList(),
        loadGpaProjectListForGrid(),
        loadGpaProjectCategoryLists(),
    ]);
    syncGpaPartyEmployeeUI();
    setTodayDates();
    await loadGRNPaymentApprovalList();
    let gpaOpenNew = false;
    try {
        const gpaOpen = new URLSearchParams(window.location.search).get('openNew');
        gpaOpenNew = gpaOpen === '1' || gpaOpen === 'true';
    } catch (e) { /* ignore */ }
    if (gpaOpenNew) {
        newGRNPaymentApproval();
    } else {
        showListView();
    }

    initBillGrid();

    if (gpaIsBankStatementEmbed() && gpaOpenNew) {
        await tryApplyBankStatementEmbedPrefill(true);
    }

    // Allow only positive numbers with decimals in amount fields (same pattern as GRN txtTotalBillAmountManual)
    const headerAmt = document.getElementById('txtHeaderAmount');
    if (headerAmt) {
        headerAmt.addEventListener('keypress', e => {
            const char = String.fromCharCode(e.which);
            if (!/[\d.]/.test(char)) { e.preventDefault(); return; }
            if (char === '.' && headerAmt.value.includes('.')) e.preventDefault();
        });
        headerAmt.addEventListener('input', () => {
            headerAmt.value = headerAmt.value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
            const elAdv = document.getElementById('txtFooterAdvance');
            if (elAdv) delete elAdv.dataset.advanceManual;
            recalcFooter();
        });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// DATE DEFAULTS
// ══════════════════════════════════════════════════════════════════════════════
function setTodayDates() {
    const today = new Date().toISOString().split('T')[0];
    ['dtPaymentDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = today;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// VENDOR (same as GRNService.loadVendorList)
// ══════════════════════════════════════════════════════════════════════════════
function normalizeApiRows(result) {
    if (Array.isArray(result)) return result;
    // Nested envelope: { Data: { SubProjectList: [...] } } or { Data: { value: [...] } }
    const datum = result?.Data ?? result?.data;
    if (datum != null && typeof datum === 'object' && !Array.isArray(datum)) {
        const inner = normalizeApiRows(datum);
        if (inner.length) return inner;
    }
    // Generic DDL payloads (e.g. DDL_SUBPROJECTLIST → { SubProjectList: [{ Code, Name }] })
    if (Array.isArray(result?.SubProjectList)) return result.SubProjectList;
    if (Array.isArray(result?.subProjectList)) return result.subProjectList;
    if (Array.isArray(result?.ProjectList)) return result.ProjectList;
    if (Array.isArray(result?.projectList)) return result.projectList;
    if (Array.isArray(result?.Table)) return result.Table;
    if (Array.isArray(result?.table)) return result.table;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.Data)) return result.Data;
    if (Array.isArray(result?.Result)) return result.Result;
    if (Array.isArray(result?.result)) return result.result;
    if (Array.isArray(result?.value)) return result.value; // OData / default Web API paging
    if (Array.isArray(result?.Value)) return result.Value;
    if (Array.isArray(result?.List)) return result.List;
    if (Array.isArray(result?.list)) return result.list;
    if (Array.isArray(result?.POList)) return result.POList;
    if (Array.isArray(result?.poList)) return result.poList;
    if (Array.isArray(result?.PoList)) return result.PoList;
    if (Array.isArray(result?.PurchaseOrderList)) return result.PurchaseOrderList;
    if (Array.isArray(result?.purchaseOrderList)) return result.purchaseOrderList;
    const nested = result?.Items ?? result?.items ?? result?.Details ?? result?.details ?? result?.Lines ?? result?.lines;
    if (Array.isArray(nested)) return nested;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        const billish = result.BillNo != null || result.billNo != null || result.BillAmount != null || result.billAmount != null;
        const payLine =
            result.PaymentAmount != null || result.paymentAmount != null || result['Payment Amount'] != null
            || result.MRNMaster_Code != null || result.mRNMaster_Code != null || result.mrnMaster_Code != null
            || result.GRNPaymentMaster_Code != null || result.gRNPaymentMaster_Code != null
            || result.GRNPaymentDetail_Code != null || result.GRNPaymentDetails_Code != null
            || result.DetailCode != null || result.detailCode != null
            || result.PONo != null || result.pONo != null
            || result.CategoryName != null || result.categoryName != null
            || result.PurchaseOrderMaster_Code != null || result.purchaseOrderMaster_Code != null
            || result.ProjectCategory_Code != null || result.projectCategory_Code != null
            || (result.Code !== undefined && result.Code !== null && (result.GRNPaymentMaster_Code != null || result.gRNPaymentMaster_Code != null)
                && (result.MRNMaster_Code != null || result.mRNMaster_Code != null || result.mrnMaster_Code != null));
        const ddlBillNoListRow =
            (result.Code !== undefined && result.Code !== null)
            && (result.BillDate != null || result.billDate != null
                || result.TotalBillAmountManual != null || result.totalBillAmountManual != null
                || result.NetPayable != null || result.netPayable != null
                || result.Name != null || result.name != null);
        if (billish || payLine || ddlBillNoListRow) return [result];
    }
    // Same idea as UserMaster.normalizeSubProjectMasterListResponse: API may wrap rows in an arbitrary key
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        const keys = Object.keys(result);
        for (let i = 0; i < keys.length; i++) {
            const arr = result[keys[i]];
            if (!Array.isArray(arr) || !arr.length) continue;
            const first = arr[0];
            if (!first || typeof first !== 'object') continue;
            if (first.BillNo != null || first.billNo != null || first.BillAmount != null || first.billAmount != null) continue;
            if (
                ('Code' in first) || ('code' in first)
                || ('ProjectMaster_Code' in first) || ('projectMaster_Code' in first)
                || ('SubProjectMaster_Code' in first) || ('subProjectMaster_Code' in first)
                || ('SubProjectDesp' in first) || ('subProjectDesp' in first)
                || ('ProjectDesp' in first) || ('projectDesp' in first)
                || ('VendorMaster_Code' in first) || ('vendorMaster_Code' in first)
                || ('PurchaseOrderMaster_Code' in first) || ('purchaseOrderMaster_Code' in first)
                || ('PONo' in first) || ('pONo' in first) || ('poNo' in first) || ('PO_No' in first)
            ) {
                return arr;
            }
        }
    }
    return [];
}

function peelGrnPaymentApiRoot(res) {
    let root = res?.Data ?? res?.data ?? res;
    if (!root || typeof root !== 'object') return root;
    const hasMaster =
        root.GRNPaymentMaster ?? root.grnPaymentMaster
        ?? root.VW_GRNPaymentMaster ?? root.vw_GRNPaymentMaster;
    const hasDetails =
        root.GRNPaymentDetails ?? root.grnPaymentDetails
        ?? root.TY_GRNPaymentDetails ?? root.ty_GRNPaymentDetails;
    if (!hasMaster && !hasDetails) {
        const inner = root.Data ?? root.data;
        if (inner && typeof inner === 'object') root = inner;
        const inner2 = root.Data ?? root.data;
        if ((!root.GRNPaymentMaster && !root.grnPaymentMaster && !root.GRNPaymentDetails && !root.grnPaymentDetails)
            && inner2 && typeof inner2 === 'object') {
            root = inner2;
        }
    }
    return root;
}

/**
 * First candidate that normalizes to a non-empty row list.
 * Important: `a ?? b` skips `b` when `a` is [] (empty array is not nullish), so APIs that send
 * VW_GRNPaymentMaster.GRNPaymentDetails: [] alongside root GRNPaymentDetails: [...] must be scanned in order.
 */
function coalesceNonEmptyDetailRows(...candidates) {
    for (let i = 0; i < candidates.length; i++) {
        const v = candidates[i];
        if (v === undefined || v === null) continue;
        const rows = normalizeApiRows(v);
        if (rows.length) return rows;
    }
    return [];
}

/** Detail line row (flat PONo / CategoryName from USP, or nested masters). */
function gpaIsPaymentDetailRow(r) {
    if (!r || typeof r !== 'object') return false;
    if (r.PaymentAmount != null || r.paymentAmount != null || r['Payment Amount'] != null) return true;
    if (r.PONo != null || r.pONo != null) return true;
    if (r.CategoryName != null || r.categoryName != null) return true;
    if (r.PurchaseOrderMaster_Code != null || r.purchaseOrderMaster_Code != null) return true;
    if (r.ProjectCategory_Code != null || r.projectCategory_Code != null) return true;
    if (r.MRNMaster_Code != null || r.mRNMaster_Code != null) return true;
    if (r.BillNo != null || r.billNo != null) return true;
    return false;
}

function gpaRowHasEmbeddedDetailFields(r) {
    if (!r || typeof r !== 'object') return false;
    if (r.PaymentAmount != null || r.paymentAmount != null || r['Payment Amount'] != null) return true;
    if (r.PONo != null || r.pONo != null || r.PODate != null || r.pODate != null) return true;
    if (r.CategoryName != null || r.categoryName != null) return true;
    if (r.PurchaseOrderMaster_Code != null || r.purchaseOrderMaster_Code != null) return true;
    if (r.ProjectCategory_Code != null || r.projectCategory_Code != null) return true;
    if (r.ProjectMaster_Code != null || r.mRNMaster_Code != null) return true;
    return false;
}

/** Build detail DTO from master+detail flat join row (single result set). */
function gpaDetailRowFromCombinedRecord(row) {
    if (!row || typeof row !== 'object' || !gpaRowHasEmbeddedDetailFields(row)) return null;
    return {
        Code: row.GRNPaymentDetails_Code ?? row.GRNPaymentDetail_Code ?? row.DetailCode ?? row.detailCode ?? 0,
        GRNPaymentMaster_Code: row.GRNPaymentMaster_Code ?? row.gRNPaymentMaster_Code ?? row.Code ?? row.code,
        MRNMaster_Code: row.MRNMaster_Code ?? row.mRNMaster_Code ?? row.mrnMaster_Code ?? 0,
        PaymentAmount: row.PaymentAmount ?? row.paymentAmount ?? row['Payment Amount'],
        PONo: row.PONo ?? row.pONo ?? row.PoNO ?? row.PO_No ?? row.poNo,
        PODate: row.PODate ?? row.pODate ?? row.PO_Date ?? row.poDate ?? row.PurchaseOrderDate ?? row.purchaseOrderDate,
        CategoryName: row.CategoryName ?? row.categoryName,
        PurchaseOrderMaster_Code: row.PurchaseOrderMaster_Code ?? row.purchaseOrderMaster_Code,
        ProjectCategory_Code: row.ProjectCategory_Code ?? row.projectCategory_Code,
        ProjectMaster_Code: row.ProjectMaster_Code ?? row.projectMaster_Code,
        SubProjectMaster_Code: row.SubProjectMaster_Code ?? row.subProjectMaster_Code,
        Project: row.Project ?? row.project,
        SubProject: row.SubProject ?? row.subProject,
        ProjectDesp: row.ProjectDesp ?? row.projectDesp ?? row.Project ?? row.project,
        SubProjectDesp: row.SubProjectDesp ?? row.subProjectDesp ?? row.SubProject ?? row.subProject,
        BillNo: row.BillNo ?? row.billNo ?? row.Name ?? row.name,
        BillDate: row.BillDate ?? row.billDate,
        BillAmount: row.BillAmount ?? row.billAmount,
        PayableAmount: row.PayableAmount ?? row.payableAmount ?? row.NetPayable ?? row.netPayable,
        Dedution: row.Dedution ?? row.dedution ?? row.Deduction ?? row.deduction,
    };
}

/** Scan API root for any array that looks like GRN payment detail lines. */
function gpaScanPaymentDetailArraysInObject(obj) {
    if (!obj || typeof obj !== 'object') return [];
    if (Array.isArray(obj)) {
        return obj.length && gpaIsPaymentDetailRow(obj[0]) ? obj : [];
    }
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const arr = obj[keys[i]];
        if (!Array.isArray(arr) || !arr.length) continue;
        if (gpaIsPaymentDetailRow(arr[0])) return arr;
    }
    return [];
}

/**
 * Detail lines for edit: sibling array, nested on master, or under VW_* (Pascal + camelCase).
 */
function extractGRNPaymentDetailsArray(root, master) {
    if (!root && !master) return [];
    if (Array.isArray(root) && root.length && gpaIsPaymentDetailRow(root[0])) return root;
    let rows = coalesceNonEmptyDetailRows(
        root?.VW_GRNPaymentMaster?.GRNPaymentDetails,
        root?.VW_GRNPaymentMaster?.grnPaymentDetails,
        root?.GRNPaymentDetails,
        root?.grnPaymentDetails,
        root?.TY_GRNPaymentDetails,
        root?.ty_GRNPaymentDetails,
        root?.TY_GRNPaymentDetail,
        root?.ty_GRNPaymentDetail,
        root?.GRNPaymentDetail,
        root?.grnPaymentDetail,
        root?.ListTY_GRNPaymentDetails,
        root?.listTY_GRNPaymentDetails,
        root?.lstTY_GRNPaymentDetails,
        root?.LstTY_GRNPaymentDetails,
        root?.PaymentDetails,
        root?.paymentDetails,
        root?.DetailList,
        root?.detailList,
        root?.BillAllocationList,
        root?.billAllocationList,
        root?.Details,
        root?.details,
        root?.Table,
        root?.table
    );
    if (rows.length) return rows;
    if (master) {
        rows = coalesceNonEmptyDetailRows(
            master.GRNPaymentDetails,
            master.grnPaymentDetails,
            master.TY_GRNPaymentDetails,
            master.ty_GRNPaymentDetails,
            master.TY_GRNPaymentDetail,
            master.ty_GRNPaymentDetail,
            master.ListTY_GRNPaymentDetails,
            master.listTY_GRNPaymentDetails,
            master.Details,
            master.details
        );
    }
    if (rows.length) return rows;
    const gm0 = root?.GRNPaymentMaster?.[0] ?? root?.grnPaymentMaster?.[0];
    if (gm0 && typeof gm0 === 'object') {
        rows = coalesceNonEmptyDetailRows(
            gm0.GRNPaymentDetails,
            gm0.grnPaymentDetails,
            gm0.TY_GRNPaymentDetails,
            gm0.ty_GRNPaymentDetails,
            gm0.Details,
            gm0.details
        );
    }
    if (!rows.length) rows = gpaScanPaymentDetailArraysInObject(root);
    if (!rows.length && master) rows = gpaScanPaymentDetailArraysInObject(master);
    if (!rows.length) {
        const fromRoot = gpaDetailRowFromCombinedRecord(root);
        if (fromRoot) rows = [fromRoot];
    }
    if (!rows.length && master) {
        const fromMaster = gpaDetailRowFromCombinedRecord(master);
        if (fromMaster) rows = [fromMaster];
    }
    return rows;
}

/** True when a non-empty payment mode is selected and it is not CASH (Ref No then required). */
function refNoIsRequiredForCurrentMode() {
    const ddl = document.getElementById('ddlPaymentMode');
    if (!ddl || !ddl.value) return false;
    const opt = ddl.selectedOptions?.[0];
    if (!opt || opt.dataset.isCash === '1') return false;
    return true;
}

/** Toggle Ref No * and HTML required based on payment mode (CASH = optional). */
function syncRefNoRequiredUI() {
    const mark = document.getElementById('refNoReqMark');
    const inp = document.getElementById('txtRefNo');
    const req = refNoIsRequiredForCurrentMode();
    if (mark) {
        mark.style.display = req ? '' : 'none';
        mark.setAttribute('aria-hidden', req ? 'false' : 'true');
    }
    if (inp) {
        if (req) inp.setAttribute('required', 'required');
        else inp.removeAttribute('required');
    }
}

/** Mode BANKPAYMENTTYPE — bind F_BankPaymentTypeMaster_Code + display name. */
async function loadBankPaymentList() {
    const ddl = document.getElementById('ddlPaymentMode');
    if (!ddl) return;
    const prev = ddl.value;
    try {
        const result = await GRNPaymentApprovalService.GetBankPayment();
        const rows = normalizeApiRows(result);
        gpaBankPaymentListCache = rows;
        ddl.innerHTML = '<option value="">-- Select --</option>';
        rows.forEach(row => {
            const opt = document.createElement('option');
            const code = row.F_BankPaymentTypeMaster_Code ?? row.f_BankPaymentTypeMaster_Code
                ?? row.Code ?? row.code ?? '';
            opt.value = code !== undefined && code !== null ? String(code) : '';
            opt.text = row.BankPaymentTypeName ?? row.bankPaymentTypeName
                ?? row.BankPaymentType ?? row.bankPaymentType
                ?? row.Description ?? row.description
                ?? row.Name ?? row.name
                ?? (opt.value ? `Type ${opt.value}` : '');
            const label = String(opt.text || '').trim();
            if (/^cash$/i.test(label)) opt.dataset.isCash = '1';
            ddl.appendChild(opt);
        });
        if (prev && [...ddl.options].some(o => o.value === prev)) ddl.value = prev;
    } catch (e) {
        console.error('Failed to load bank payment types:', e);
    }
    syncRefNoRequiredUI();
}

/** GetBankList — same row shape as GRNService.normalizeGrnBankListRows. */
function normalizeGpaBankListRows(result) {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.Data)) return result.Data;
    if (Array.isArray(result.data)) return result.data;
    return [];
}

async function loadGpaBankMasterList() {
    const ddl = document.getElementById('ddlBankName');
    if (!ddl) return;
    const prev = ddl.value;
    try {
        const result = await GRNPaymentApprovalService.GetBankList();
        const rows = normalizeGpaBankListRows(result);
        ddl.innerHTML = '<option value="">-- Select Bank --</option>';
        rows.forEach(b => {
            const opt = document.createElement('option');
            const code = b.Code ?? b.BankMaster_Code ?? b.code ?? b.bankMaster_Code ?? '';
            opt.value = code !== '' && code !== null && code !== undefined ? String(code) : '';
            opt.text = String((b.BankName ?? b.bankName ?? b.Name ?? '').trim() || opt.value || '');
            ddl.appendChild(opt);
        });
        if (prev && [...ddl.options].some(o => o.value === prev)) ddl.value = prev;
    } catch (e) {
        console.error('loadGpaBankMasterList', e);
    }
}

function gpaGetSelectedBankNameForSave() {
    const ddl = document.getElementById('ddlBankName');
    if (!ddl || ddl.selectedIndex < 0) return '';
    const opt = ddl.options[ddl.selectedIndex];
    const v = (ddl.value || '').trim();
    if (!v) return '';
    return ((opt && opt.text) ? opt.text : '').trim();
}

async function loadVendorList() {
    const ddl = document.getElementById('ddlPartyName');
    if (!ddl) return;
    try {
        const result = await GRNPaymentApprovalService.GetVendor();
        const rows = normalizeApiRows(result);
        gpaVendorListCache = rows;
        ddl.innerHTML = '<option value="">-- Select Party --</option>';
        rows.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? '';
            opt.text = v.VendorName ?? v.vendorName ?? v.Name ?? '';
            const acc = v.AccountMaster_Code ?? v.accountMaster_Code;
            if (acc !== undefined && acc !== null && `${acc}`.trim() !== '') {
                opt.dataset.accountCode = String(acc);
            }
            const partyMc = v.PartyMaster_Code ?? v.partyMaster_Code;
            if (partyMc !== undefined && partyMc !== null && `${partyMc}`.trim() !== '') {
                opt.dataset.partyMasterCode = String(partyMc);
            }
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load vendors:', e);
    }
}

async function loadEmployeeList() {
    const ddl = document.getElementById('ddlEmployeeName');
    if (!ddl) return;
    try {
        const result = await GRNPaymentApprovalService.GetMarketingManMaster();
        const rows = normalizeApiRows(result);
        gpaEmployeeListCache = rows;
        ddl.innerHTML = '<option value="">-- Select Employee --</option>';
        rows.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.MarketingManMaster_Code ?? v.marketingManMaster_Code ?? v.Code ?? v.code ?? '';
            opt.text = v.Name ?? v.name ?? v.MarketingManName ?? v.marketingManName ?? v.EmployeeName ?? v.employeeName ?? '';
            const acc = v.AccountMaster_Code ?? v.accountMaster_Code;
            if (acc !== undefined && acc !== null && `${acc}`.trim() !== '') {
                opt.dataset.accountCode = String(acc);
            }
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load employees:', e);
    }
}

async function loadGpaProjectListForGrid() {
    try {
        const result = await GRNPaymentApprovalService.GetProjectMasterList();
        gpaProjectListCache = Array.isArray(result) ? result : normalizeApiRows(result);
    } catch (e) {
        console.error('loadGpaProjectListForGrid', e);
        gpaProjectListCache = [];
    }
}

/** PO display text — flat PONo (USP) then PurchaseOrderMaster.PONo */
function gpaPoNoFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const flat = r.PONo ?? r.pONo ?? r.PoNO ?? r.PoNo ?? r.PO_No ?? r.poNo ?? r.PO_NO ?? r.PO_NO_
        ?? r.PONumber ?? r.poNumber ?? r.PurchaseOrderNo ?? r.purchaseOrderNo
        ?? r.PurchaseOrderNO ?? r.purchaseOrderNO ?? '';
    if (flat !== undefined && flat !== null && String(flat).trim() !== '') return String(flat).trim();
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    if (pom && typeof pom === 'object') {
        const v = pom.PONo ?? pom.pONo ?? pom.PoNO ?? pom.PO_No ?? pom.poNo ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    const text = r.Name ?? r.name ?? r.Text ?? r.text ?? r.Label ?? r.label ?? '';
    if (text !== undefined && text !== null && String(text).trim() !== '') return String(text).trim();
    return '';
}

/** Normalize GetPOList API payload to dropdown rows. */
function normalizePoListApiRows(result) {
    let rows = normalizeApiRows(result);
    if ((!rows || !rows.length) && result && typeof result === 'object') {
        const datum = result.Data ?? result.data ?? result.Result ?? result.result ?? null;
        const sources = [result, datum].filter(Boolean);
        const keys = ['POList', 'poList', 'PoList', 'PurchaseOrderList', 'purchaseOrderList', 'List', 'list', 'Table', 'table', 'Tables', 'tables', 'value', 'Value'];
        for (let s = 0; s < sources.length && !rows.length; s++) {
            const src = sources[s];
            for (let k = 0; k < keys.length; k++) {
                const arr = src[keys[k]];
                if (Array.isArray(arr) && arr.length) {
                    rows = arr;
                    break;
                }
            }
            if (!rows.length && Array.isArray(src?.Tables) && src.Tables.length) {
                rows = src.Tables[0];
            }
            if (!rows.length && Array.isArray(src?.tables) && src.tables.length) {
                rows = src.tables[0];
            }
        }
    }
    if (!Array.isArray(rows)) rows = [];
    return rows.map(function (r) {
        if (typeof r === 'string' || typeof r === 'number') return { PONo: String(r).trim() };
        return r;
    }).filter(function (r) {
        return r && typeof r === 'object';
    });
}

/** Party / employee code for GetPOList — same as GetBillDetails (VendorMaster_Code / MarketingManMaster_Code). */
function gpaGetPartyCodeForPoListApi() {
    return getGpaCounterpartyKey()?.trim() ?? '';
}

function gpaGetSelectedVendorRecord(ddlVal) {
    const val = ddlVal !== undefined && ddlVal !== null ? String(ddlVal).trim() : '';
    if (!val) return null;
    for (let i = 0; i < (gpaVendorListCache || []).length; i++) {
        const v = gpaVendorListCache[i];
        const vc = String(v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? v.code ?? '');
        const ac = String(v.AccountMaster_Code ?? v.accountMaster_Code ?? '');
        const pm = String(v.PartyMaster_Code ?? v.partyMaster_Code ?? '');
        if (vc === val || ac === val || (pm && pm === val)) return v;
    }
    return null;
}

/** All plausible party codes to try for GetPOList (party master first, then vendor / account). */
function gpaPartyCodesForPoListApi(explicitCode) {
    const codes = [];
    const add = (v) => {
        const s = v !== undefined && v !== null ? String(v).trim() : '';
        if (s && s !== '0' && !codes.includes(s)) codes.push(s);
    };
    if (isGpaPartyMode()) {
        const ddl = document.getElementById('ddlPartyName');
        const ddlVal = explicitCode !== undefined && explicitCode !== null
            ? String(explicitCode).trim()
            : (ddl?.value ?? '').trim();
        const selOpt = ddl?.selectedOptions?.[0];
        add(selOpt?.dataset?.partyMasterCode);
        const vendor = gpaGetSelectedVendorRecord(ddlVal);
        if (vendor) {
            add(vendor.PartyMaster_Code ?? vendor.partyMaster_Code);
            add(vendor.VendorMaster_Code ?? vendor.vendorMaster_Code ?? vendor.Code ?? vendor.code);
            add(vendor.AccountMaster_Code ?? vendor.accountMaster_Code);
        }
        add(explicitCode);
        add(ddlVal);
        add(selOpt?.dataset?.accountCode);
    } else {
        const ddl = document.getElementById('ddlEmployeeName');
        add(explicitCode);
        add(ddl?.value);
        add(ddl?.selectedOptions?.[0]?.dataset?.accountCode);
    }
    return codes;
}

function gpaExtractPoListFromBillRows(billRows) {
    const map = new Map();
    (billRows || []).forEach(function (r) {
        const poNo = gpaPoNoFromRecord(r);
        if (!poNo) return;
        if (!map.has(poNo)) {
            map.set(poNo, {
                PONo: poNo,
                PurchaseOrderMaster_Code: gpaPoCodeFromRecord(r) || undefined,
            });
        }
    });
    return [...map.values()];
}

function gpaMergePoListRows(primary, extra) {
    const map = new Map();
    (primary || []).forEach(function (po) {
        const poNo = gpaPoNoFromRecord(po);
        if (poNo) map.set(poNo, po);
    });
    (extra || []).forEach(function (po) {
        const poNo = gpaPoNoFromRecord(po);
        if (poNo && !map.has(poNo)) map.set(poNo, po);
    });
    return [...map.values()];
}

async function fetchGpaPoListFromApi(codes) {
    const tried = new Set();
    for (let i = 0; i < codes.length; i++) {
        const c = String(codes[i] ?? '').trim();
        if (!c || c === '0' || tried.has(c)) continue;
        tried.add(c);
        try {
            const result = await GRNPaymentApprovalService.GetPOList(c);
            const rows = normalizePoListApiRows(result);
            if (rows.length) return rows;
        } catch (e) {
            console.warn('fetchGpaPoListFromApi', c, e);
        }
    }
    return [];
}

async function fetchGpaPoListFallbackFromBills(partyCode) {
    const code = partyCode !== undefined && partyCode !== null ? String(partyCode).trim() : '';
    if (!code) return [];
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(code);
        return gpaExtractPoListFromBillRows(normalizeApiRows(result));
    } catch (e) {
        console.warn('fetchGpaPoListFallbackFromBills', e);
        return [];
    }
}

function gpaApplyPoListToAllDropdowns(resetSelection) {
    gpaRefreshAllBillRowPoDropdowns(resetSelection === true ? false : true);
    gpaRefreshAddBillModalPoDropdown(resetSelection === true ? false : true);
}

/** Category display — flat CategoryName (USP) then CategoryMaster.CategoryName */
function gpaCategoryNameFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const flat = r.CategoryName ?? r.categoryName ?? '';
    if (flat !== undefined && flat !== null && String(flat).trim() !== '') return String(flat).trim();
    const cm = r.CategoryMaster ?? r.categoryMaster;
    if (cm && typeof cm === 'object') {
        const v = cm.CategoryName ?? cm.categoryName ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    const tail = r.ProjectCategoryName ?? r.projectCategoryName
        ?? r.ProjectCategory ?? r.projectCategory ?? r.Category ?? r.category ?? '';
    return tail !== undefined && tail !== null ? String(tail).trim() : '';
}

function gpaPoCodeFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    if (pom && typeof pom === 'object') {
        const v = pom.Code ?? pom.code ?? pom.PurchaseOrderMaster_Code ?? pom.purchaseOrderMaster_Code ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    const v = r.PurchaseOrderMaster_Code ?? r.purchaseOrderMaster_Code
        ?? r.PO_Code ?? r.po_Code ?? r.PurchaseOrder_Code ?? r.purchaseOrder_Code;
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    return '';
}

function gpaCategoryCodeFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const cm = r.CategoryMaster ?? r.categoryMaster;
    if (cm && typeof cm === 'object') {
        const v = cm.Code ?? cm.code ?? cm.CategoryMaster_Code ?? cm.categoryMaster_Code
            ?? cm.ProjectCategory_Code ?? cm.projectCategory_Code ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    const v = r.CategoryMaster_Code ?? r.categoryMaster_Code
        ?? r.ProjectCategory_Code ?? r.projectCategory_Code
        ?? r.Category_Code ?? r.category_Code ?? r.F_ProjectCategory_Code ?? r.f_ProjectCategory_Code;
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    return '';
}

function gpaResolvePoCodeFromRow(r) {
    return gpaPoCodeFromRecord(r);
}

function gpaResolvePoNoTextFromRow(r) {
    let poNo = gpaPoNoFromRecord(r);
    if (!poNo) {
        const c = gpaResolvePoCodeFromRow(r);
        if (c) poNo = gpaLookupPoNoLabel(c);
    }
    return poNo;
}

/** Resolve PONo / CategoryName on API rows that only send *_Code (print + edit). */
function gpaEnrichDetailRowPoCategory(r) {
    if (!r || typeof r !== 'object') return r;
    const out = Object.assign({}, r);
    const poNo = gpaResolvePoNoTextFromRow(out);
    if (poNo) out.PONo = poNo;
    const catName = gpaResolveCategoryNameFromRow(out);
    if (catName) out.CategoryName = catName;
    return out;
}

function gpaResolveCategoryCodeFromRow(r) {
    return gpaCategoryCodeFromRecord(r);
}

function gpaResolveCategoryNameFromRow(r) {
    return gpaCategoryNameFromRecord(r);
}

function gpaResolvePaymentForFromMaster(master) {
    if (!master || typeof master !== 'object') return '';
    const v = master.PaymentFor ?? master.paymentFor ?? master.PaymentForName ?? master.paymentForName ?? '';
    return v !== undefined && v !== null ? String(v).trim().substring(0, 100) : '';
}

function gpaDdlCodeFromCacheItem(item, codeKeys, textKeys) {
    if (!item || typeof item !== 'object') return '';
    for (let i = 0; i < codeKeys.length; i++) {
        const v = item[codeKeys[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function gpaDdlTextFromCacheItem(item, textKeys) {
    if (!item || typeof item !== 'object') return '';
    for (let i = 0; i < textKeys.length; i++) {
        const v = item[textKeys[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

const GPA_PO_CODE_KEYS = ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code', 'PO_Code', 'po_Code', 'Code', 'code'];
const GPA_PO_TEXT_KEYS = ['PONo', 'pONo', 'PoNO', 'PoNo', 'PO_No', 'poNo', 'PONumber', 'poNumber', 'PurchaseOrderNo', 'purchaseOrderNo', 'Name', 'name'];
const GPA_CAT_CODE_KEYS = ['ProjectCategory_Code', 'projectCategory_Code', 'Category_Code', 'category_Code', 'Code', 'code'];
const GPA_CAT_TEXT_KEYS = ['CategoryName', 'categoryName', 'ProjectCategoryName', 'projectCategoryName', 'Name', 'name'];

function gpaFillPoSelectOptions(sel, selectedPoNo) {
    if (!sel) return;
    const savedPoNo = selectedPoNo !== undefined && selectedPoNo !== null ? String(selectedPoNo).trim() : '';
    sel.innerHTML = '<option value="">-- PO No --</option>';
    (gpaPoListCache || []).forEach(po => {
        const opt = document.createElement('option');
        const code = gpaPoCodeFromRecord(po) || gpaDdlCodeFromCacheItem(po, GPA_PO_CODE_KEYS, GPA_PO_TEXT_KEYS);
        let poNo = gpaPoNoFromRecord(po);
        if (!poNo && code) poNo = String(code);
        if (!poNo) return;
        opt.value = poNo;
        opt.text = poNo;
        if (code) opt.dataset.poCode = code;
        sel.appendChild(opt);
    });
    if (savedPoNo && ![...sel.options].some(o => o.value === savedPoNo)) {
        sel.add(new Option(savedPoNo, savedPoNo));
    }
    if (savedPoNo) sel.value = savedPoNo;
}

function gpaFillCategorySelectOptions(sel, selectedCategoryName) {
    if (!sel) return;
    const savedName = selectedCategoryName !== undefined && selectedCategoryName !== null
        ? String(selectedCategoryName).trim() : '';
    sel.innerHTML = '<option value="">-- Category --</option>';
    (gpaProjectCategoryCache || []).forEach(cat => {
        const opt = document.createElement('option');
        const code = gpaCategoryCodeFromRecord(cat) || gpaDdlCodeFromCacheItem(cat, GPA_CAT_CODE_KEYS, GPA_CAT_TEXT_KEYS);
        let catName = gpaCategoryNameFromRecord(cat);
        if (!catName && code) catName = gpaLookupCategoryLabel(code) || String(code);
        if (!catName) return;
        opt.value = catName;
        opt.text = catName;
        if (code) opt.dataset.catCode = code;
        sel.appendChild(opt);
    });
    if (savedName && ![...sel.options].some(o => o.value === savedName)) {
        sel.add(new Option(savedName, savedName));
    }
    if (savedName) sel.value = savedName;
}

function initBillRowPoCategorySelects(tr) {
    const po = tr.querySelector('.inp-po-ddl');
    const cat = tr.querySelector('.inp-category-ddl');
    gpaFillPoSelectOptions(po, '', '');
    gpaFillCategorySelectOptions(cat, '', '');
}

function gpaBindPoCategoryOnRow(tr, r, preserveCategory) {
    if (!tr || !r) return;
    const po = tr.querySelector('.inp-po-ddl');
    const cat = tr.querySelector('.inp-category-ddl');
    let poNo = gpaResolvePoNoTextFromRow(r);
    if (!poNo) {
        const c = gpaResolvePoCodeFromRow(r);
        if (c) poNo = gpaLookupPoNoLabel(c);
    }
    let catName = gpaResolveCategoryNameFromRow(r);
    if (!catName) {
        const c = gpaResolveCategoryCodeFromRow(r);
        if (c) catName = gpaLookupCategoryLabel(c);
    }
    if (preserveCategory && cat) {
        const existing = gpaCategoryNameFromSelect(cat);
        if (existing) catName = existing;
    }
    gpaFillPoSelectOptions(po, poNo);
    gpaFillCategorySelectOptions(cat, catName);
}

function gpaBindPaymentForOnMaster(master) {
    const el = document.getElementById('txtPaymentFor');
    if (!el) return;
    el.value = gpaResolvePaymentForFromMaster(master || {});
}

function gpaPaymentForForSave() {
    const el = document.getElementById('txtPaymentFor');
    if (!el) return '';
    return String(el.value ?? '').trim().substring(0, 100);
}

function gpaPoNoFromSelect(sel) {
    if (!sel) return '';
    return String(sel.value ?? '').trim();
}

function gpaCategoryNameFromSelect(sel) {
    if (!sel) return '';
    return String(sel.value ?? '').trim();
}

function gpaPoCodeFromPoNo(poNo) {
    const text = String(poNo ?? '').trim();
    if (!text) return 0;
    for (let i = 0; i < (gpaPoListCache || []).length; i++) {
        const po = gpaPoListCache[i];
        const pNo = gpaPoNoFromRecord(po);
        if (pNo === text) {
            const c = gpaPoCodeFromRecord(po) || gpaDdlCodeFromCacheItem(po, GPA_PO_CODE_KEYS, GPA_PO_TEXT_KEYS);
            return parseInt(c, 10) || 0;
        }
    }
    return 0;
}

function gpaCatCodeFromCategoryName(catName) {
    const text = String(catName ?? '').trim();
    if (!text) return 0;
    for (let i = 0; i < (gpaProjectCategoryCache || []).length; i++) {
        const cat = gpaProjectCategoryCache[i];
        const name = gpaCategoryNameFromRecord(cat);
        if (name === text) {
            const c = gpaCategoryCodeFromRecord(cat) || gpaDdlCodeFromCacheItem(cat, GPA_CAT_CODE_KEYS, GPA_CAT_TEXT_KEYS);
            return parseInt(c, 10) || 0;
        }
    }
    return 0;
}

function gpaPoCodeFromSelect(sel) {
    if (!sel) return 0;
    const opt = sel.selectedOptions?.[0];
    const fromDs = opt?.dataset?.poCode;
    if (fromDs !== undefined && fromDs !== null && `${fromDs}`.trim() !== '') {
        return parseInt(fromDs, 10) || 0;
    }
    return gpaPoCodeFromPoNo(gpaPoNoFromSelect(sel));
}

function gpaCatCodeFromSelect(sel) {
    if (!sel) return 0;
    const opt = sel.selectedOptions?.[0];
    const fromDs = opt?.dataset?.catCode;
    if (fromDs !== undefined && fromDs !== null && `${fromDs}`.trim() !== '') {
        return parseInt(fromDs, 10) || 0;
    }
    return gpaCatCodeFromCategoryName(gpaCategoryNameFromSelect(sel));
}

function gpaLookupPoNoLabel(code) {
    if (code === undefined || code === null || `${code}`.trim() === '') return '';
    const cs = String(code).trim();
    for (let i = 0; i < (gpaPoListCache || []).length; i++) {
        const po = gpaPoListCache[i];
        const c = gpaPoCodeFromRecord(po) || gpaDdlCodeFromCacheItem(po, GPA_PO_CODE_KEYS, GPA_PO_TEXT_KEYS);
        if (`${c}` === cs) return gpaPoNoFromRecord(po) || cs;
    }
    return cs;
}

function gpaLookupCategoryLabel(code) {
    if (code === undefined || code === null || `${code}`.trim() === '') return '';
    const cs = String(code).trim();
    for (let i = 0; i < (gpaProjectCategoryCache || []).length; i++) {
        const cat = gpaProjectCategoryCache[i];
        const c = gpaCategoryCodeFromRecord(cat) || gpaDdlCodeFromCacheItem(cat, GPA_CAT_CODE_KEYS, GPA_CAT_TEXT_KEYS);
        if (`${c}` === cs) return gpaCategoryNameFromRecord(cat) || cs;
    }
    return cs;
}

async function loadGpaPoListForGrid(partyCode) {
    const code = partyCode !== undefined && partyCode !== null ? String(partyCode).trim() : '';
    if (!code) {
        gpaPoListCache = [];
        gpaPoListPartyCodeCache = '';
        return;
    }
    try {
        const codes = gpaPartyCodesForPoListApi(code);
        let rows = await fetchGpaPoListFromApi(codes);
        const billPoRows = await fetchGpaPoListFallbackFromBills(code);
        rows = gpaMergePoListRows(rows, billPoRows);
        gpaPoListCache = rows;
        gpaPoListPartyCodeCache = code;
    } catch (e) {
        console.error('loadGpaPoListForGrid', e);
        gpaPoListCache = [];
        gpaPoListPartyCodeCache = '';
    }
}

function gpaRefreshAllBillRowPoDropdowns(keepSaved) {
    document.querySelectorAll('#billTbody tr.bill-row').forEach(function (tr) {
        const po = tr.querySelector('.inp-po-ddl');
        if (!po) return;
        const saved = keepSaved === false ? '' : gpaPoNoFromSelect(po);
        gpaFillPoSelectOptions(po, saved);
    });
}

function gpaRefreshAddBillModalPoDropdown(keepSaved) {
    const poSel = document.getElementById('gpaAddBillModalPo');
    if (!poSel) return;
    const saved = keepSaved === false ? '' : gpaPoNoFromSelect(poSel);
    gpaFillPoSelectOptions(poSel, saved);
}

/** Load GetPOList(partyCode) and refresh grid + modal PO dropdowns. */
async function reloadGpaPoListForCurrentParty(resetSelection, partyCode) {
    const code = partyCode !== undefined && partyCode !== null
        ? String(partyCode).trim()
        : (gpaGetPartyCodeForPoListApi());
    await loadGpaPoListForGrid(code);
    gpaApplyPoListToAllDropdowns(resetSelection === true);
}

async function loadGpaProjectCategoryLists() {
    try {
        const result = await GRNPaymentApprovalService.GetProjectCategory();
        gpaProjectCategoryCache = normalizeApiRows(result);
    } catch (e) {
        console.error('loadGpaProjectCategoryLists', e);
        gpaProjectCategoryCache = [];
    }
}

function isGpaPartyMode() {
    const chk = document.getElementById('chkGpaPayToParty');
    return chk ? chk.checked : true;
}

/** Edit load: employee payment vs vendor — API may send MarketingManMaster / Employee / *_Code. */
function gpaMasterIsEmployeePayment(master) {
    if (!master || typeof master !== 'object') return false;
    const partyName = String(
        master.PartyName ?? master.VendorName ?? master.partyName ?? master.vendorName
        ?? master['Party Name'] ?? master.AccountName ?? master.accountName ?? ''
    ).trim();
    const empName = String(
        master.Employee ?? master.employee
        ?? master.EmployeeName ?? master.employeeName
        ?? master.MarketingManMaster ?? master.marketingManMaster
        ?? master.MarketingManName ?? master.marketingManName ?? ''
    ).trim();
    if (partyName && !empName) return false;
    if (empName) return true;
    const mc = master.MarketingManMaster_Code ?? master.marketingManMaster_Code
        ?? master.F_MarketingManMaster_Code ?? master.f_MarketingManMaster_Code
        ?? master.MarketingMan_Code ?? master.marketingMan_Code;
    const n = parseInt(String(mc ?? '0'), 10);
    if (Number.isFinite(n) && n > 0 && !partyName) return true;
    const payToParty = master.PayToParty ?? master.payToParty ?? master.IsPayToParty ?? master.isPayToParty;
    if ((payToParty === 'N' || payToParty === 'n' || payToParty === false || payToParty === 0) && !partyName) return true;
    return false;
}

function getGpaCounterpartyKey() {
    if (isGpaPartyMode()) {
        return document.getElementById('ddlPartyName')?.value?.trim() ?? '';
    }
    return document.getElementById('ddlEmployeeName')?.value?.trim() ?? '';
}

function syncGpaPartyEmployeeUI() {
    const partyWrap = document.getElementById('wrapGpaPartyName');
    const empWrap = document.getElementById('wrapGpaEmployeeName');
    const showParty = isGpaPartyMode();
    if (partyWrap) partyWrap.style.display = showParty ? '' : 'none';
    if (empWrap) empWrap.style.display = showParty ? 'none' : '';
    const payAmtMark = document.getElementById('gpaPayAmtReqMark');
    if (payAmtMark) {
        payAmtMark.style.display = 'inline';
        payAmtMark.setAttribute('aria-hidden', 'false');
    }
    gpaRefreshAllBillRowsPayableEditable();
}

async function fillBillGridFromDetailRows(rows) {
    const tbody = document.getElementById('billTbody');
    if (!tbody) return;
    clearBillRows();
    if (!rows || rows.length === 0) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        return;
    }
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        tbody.insertAdjacentHTML('beforeend', billRowTemplate());
        const tr = tbody.querySelector('tr.bill-row:last-child');
        if (tr) {
            initBillRowPoCategorySelects(tr);
            await applyBillDetailRow(tr, r);
        }
    }
    gpaRefreshAllBillRowPoDropdowns(true);
}

// ══════════════════════════════════════════════════════════════════════════════
// FLOAT BAR — sidebar margin (same logic as GRNService.syncFloatBarMargin)
// ══════════════════════════════════════════════════════════════════════════════
function syncFloatBarMargin() {
    const sidebar = document.getElementById('modern-sidebar');
    const bar = document.getElementById('floatBar');
    if (!sidebar || !bar || window.innerWidth <= 768) {
        if (bar) bar.style.marginLeft = '';
        return;
    }
    bar.style.marginLeft = sidebar.classList.contains('collapsed') ? '70px' : '280px';
}

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY NO (same idea as GRNService txtGRNNo — Auto Generate, fill after save)
// ══════════════════════════════════════════════════════════════════════════════
function normalizeEntryNoValue(data) {
    if (data === null || data === undefined) return null;
    if (typeof data === 'number') return String(data);
    if (typeof data === 'string') {
        const s = data.trim();
        return s === '' ? null : s;
    }
    const no = data.EntryNo ?? data.entryNo ?? data.NextNo ?? data.NextEntryNo
        ?? data.MRNNo ?? data.grnNo ?? data.GRNNo;
    if (no !== undefined && no !== null && `${no}`.trim() !== '') return String(no);
    return null;
}

function updateFloatBarEntryNo() {
    const el = document.getElementById('txtEntryNo');
    const flo = document.getElementById('floatEntryNo');
    if (!flo) return;
    const v = el?.value?.trim();
    flo.textContent = v ? v : 'New';
}

/** Float bar mode pill — mirrors GRNService `floatModeBadge` (NEW / EDIT / SAVED / UPDATED). */
function updateGpaFloatModeBadge(mode) {
    const el = document.getElementById('gpaFloatModeBadge');
    if (!el) return;
    if (mode === 'edit') {
        el.textContent = 'EDIT';
        el.className = 'po-mode-badge badge bg-warning text-dark';
        return;
    }
    if (mode === 'saved') {
        el.textContent = 'SAVED';
        el.className = 'po-mode-badge badge bg-primary';
        return;
    }
    if (mode === 'updated') {
        el.textContent = 'UPDATED';
        el.className = 'po-mode-badge badge bg-primary';
        return;
    }
    el.textContent = 'NEW';
    el.className = 'po-mode-badge badge bg-success';
}

function applyMasterCodeFromResponse(data) {
    if (!data) return;
    let code = data.Code ?? data.code;
    if (code === undefined && data.Data) code = data.Data.Code ?? data.Data.code;
    if (code === undefined && data.data) code = data.data.Code ?? data.data.code;
    if (code === undefined || code === null || `${code}`.trim() === '') return;
    const h = document.getElementById('hdnGRNPaymentMasterCode');
    if (h) {
        h.value = String(code);
        editMode = parseInt(h.value, 10) > 0;
    }
}

function applyEntryNoFromResponse(data) {
    if (!data) return;
    applyMasterCodeFromResponse(data);
    let v = normalizeEntryNoValue(data);
    if (v === null && data.Data) v = normalizeEntryNoValue(data.Data);
    if (v === null && data.data) v = normalizeEntryNoValue(data.data);
    if (v === null) return;
    const el = document.getElementById('txtEntryNo');
    if (el) el.value = v;
    updateFloatBarEntryNo();
}

/**
 * TY_GRNPaymentMaster.AccountMaster_Code: party = vendor/ledger (option accountCode or party value);
 * employee payment = ledger AccountMaster_Code from option only — employee PK is MarketingManMaster_Code.
 */
function gpaTyGrnPaymentMasterAccountMasterCode() {
    const ddl = isGpaPartyMode()
        ? document.getElementById('ddlPartyName')
        : document.getElementById('ddlEmployeeName');
    const opt = ddl?.selectedOptions?.[0];
    const acc = opt?.dataset?.accountCode;
    if (acc !== undefined && acc !== null && String(acc).trim() !== '') {
        return parseInt(acc, 10) || 0;
    }
    if (isGpaPartyMode()) {
        return parseInt(ddl?.value || '0', 10) || 0;
    }
    return 0;
}

/** TY_GRNPaymentMaster.MarketingManMaster_Code — employee dropdown PK; 0 when Pay to party. */
function gpaTyGrnPaymentMasterMarketingManMasterCode() {
    if (isGpaPartyMode()) return 0;
    const ddl = document.getElementById('ddlEmployeeName');
    return parseInt(ddl?.value || '0', 10) || 0;
}

// ══════════════════════════════════════════════════════════════════════════════
// BILL GRID
// ══════════════════════════════════════════════════════════════════════════════
function billRowTemplate() {
    return `
<tr class="bill-row">
    <td>
        <input type="hidden" class="inp-detail-code" value="0">
        <input type="hidden" class="inp-mrn-code" value="">
        <input type="text" class="form-control form-control-sm inp-bill-no" maxlength="64" autocomplete="off" placeholder="Bill no">
    </td>
    <td><select class="form-control form-control-sm inp-po-ddl" style="min-width:100px;"><option value="">-- PO No --</option></select></td>
    <td><select class="form-control form-control-sm inp-category-ddl" style="min-width:100px;"><option value="">-- Category --</option></select></td>
    <td><select class="form-control form-control-sm inp-project-ddl" style="min-width:140px;"><option value="">-- Project --</option></select></td>
    <td><select class="form-control form-control-sm inp-subproject-ddl" style="min-width:140px;"><option value="">-- Sub project --</option></select></td>
    <td><input type="date" class="form-control form-control-sm inp-bill-date" autocomplete="off"></td>
    <td><input type="number" class="form-control form-control-sm inp-bill-amt" min="0" step="0.01" placeholder="0" onkeydown="window.blockNonNumeric(event)" oninput="window.stripNonNumeric(this)"></td>
    <td><input type="text" class="form-control form-control-sm inp-deduction" readonly tabindex="-1" placeholder="—" style="background:#f1f5f9;border-color:#cbd5e1;min-width:72px;"></td>
    <td><input type="number" class="form-control form-control-sm inp-payable" min="0" step="0.01" placeholder="0" readonly style="background:#ede9fe;border-color:#c4b5fd;"></td>
    <td><input type="number" class="form-control form-control-sm inp-payment" min="0" step="0.01" placeholder="0" onkeydown="window.blockNonNumeric(event)" oninput="window.stripNonNumeric(this)"></td>
    <td style="text-align:center;vertical-align:middle;">
        <button type="button" class="del-row-btn" onclick="window.removeGpaBillRow(this)" title="Remove row"><i class="fa fa-trash"></i></button>
    </td>
</tr>`;
}

function removeGpaBillRow(btn) {
    const tr = btn?.closest?.('tr');
    if (!tr || !tr.classList.contains('bill-row')) return;
    tr.remove();
    const tbody = document.getElementById('billTbody');
    if (tbody && !tbody.querySelector('tr.bill-row')) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
    }
    recalcFooter();
}

function addBillRows(count) {
    const tbody = document.getElementById('billTbody');
    if (!tbody) return;
    for (let i = 0; i < count; i++) {
        tbody.insertAdjacentHTML('beforeend', billRowTemplate());
        const tr = tbody.querySelector('tr.bill-row:last-child');
        if (tr) {
            initBillRowProjectSelects(tr);
            initBillRowPoCategorySelects(tr);
            gpaRefreshRowPayableEditable(tr);
        }
    }
    gpaRefreshAllBillRowPoDropdowns(true);
}

function initBillRowProjectSelects(tr) {
    const pj = tr.querySelector('.inp-project-ddl');
    const sp = tr.querySelector('.inp-subproject-ddl');
    if (!pj || !sp) return;
    pj.innerHTML = '<option value="">-- Project --</option>';
    (gpaProjectListCache || []).forEach(p => {
        const opt = document.createElement('option');
        const code = p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code
            ?? p.Project_Code ?? p.project_Code ?? p.F_ProjectMaster_Code ?? p.f_ProjectMaster_Code ?? '';
        opt.value = code !== undefined && code !== null ? String(code) : '';
        opt.text = p.ProjectName ?? p.projectName ?? p.Name ?? p.ProjectDesp ?? p.projectDesp ?? opt.value;
        pj.appendChild(opt);
    });
    sp.innerHTML = '<option value="">-- Sub project --</option>';
}

async function fillSubProjectOptionsForRow(tr, projectCode) {
    const sp = tr.querySelector('.inp-subproject-ddl');
    if (!sp) return;
    const prev = sp.value;
    sp.innerHTML = '<option value="">-- Sub project --</option>';
    const pc = projectCode !== undefined && projectCode !== null ? String(projectCode).trim() : '';
    if (!pc) return;
    try {
        const subResult = await GRNPaymentApprovalService.GetSubProjectMasterList(pc);
        const subs = Array.isArray(subResult) ? subResult : normalizeApiRows(subResult);
        subs.forEach(s => {
            const opt = document.createElement('option');
            const code = s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? s.code
                ?? s.SubProject_Code ?? s.subProject_Code ?? s.F_SubProjectMaster_Code ?? s.f_SubProjectMaster_Code ?? '';
            opt.value = code !== undefined && code !== null ? String(code) : '';
            opt.text = s.SubProjectName ?? s.subProjectName ?? s.SubProjectDesp ?? s.subProjectDesp ?? s.Name ?? s.name ?? opt.value;
            sp.appendChild(opt);
        });
        if (prev && [...sp.options].some(o => o.value === prev)) sp.value = prev;
    } catch (e) {
        console.error('fillSubProjectOptionsForRow', e);
    }
}

/** Query params for GetBillDetails: blank / missing → 0 on server. */
function gpaToBillDetailQueryCode(v) {
    if (v === undefined || v === null) return 0;
    const s = String(v).trim();
    if (s === '') return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
}

function resolveProjectMasterCodeFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    const v = r.ProjectMaster_Code ?? r.projectMaster_Code
        ?? r.F_ProjectMaster_Code ?? r.f_ProjectMaster_Code
        ?? r.F_Project_Code ?? r.f_Project_Code
        ?? r.Project_Code ?? r.project_Code
        ?? r.ProjectMasterCode ?? r.projectMasterCode;
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    const pm = r.ProjectMaster ?? r.projectMaster;
    if (pm !== undefined && pm !== null) {
        const s = String(pm).trim();
        if (/^\d+$/.test(s)) return s;
    }
    return '';
}

function resolveSubProjectMasterCodeFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    const v = r.SubProjectMaster_Code ?? r.subProjectMaster_Code
        ?? r.F_SubProjectMaster_Code ?? r.f_SubProjectMaster_Code
        ?? r.F_SubProject_Code ?? r.f_SubProject_Code
        ?? r.SubProject_Code ?? r.subProject_Code
        ?? r.SubProjectMasterCode ?? r.subProjectMasterCode;
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    const sm = r.SubProjectMaster ?? r.subProjectMaster;
    if (sm !== undefined && sm !== null) {
        const s = String(sm).trim();
        if (/^\d+$/.test(s)) return s;
    }
    return '';
}

/** Display text for project — TY_GRNPaymentDetails often uses ProjectMaster (string); SQL joins use ProjectDesp. */
function resolveProjectDespFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.ProjectDesp ?? r.projectDesp ?? r.ProjectName ?? r.projectName ?? r.Project ?? r.project ?? '';
    if (v === undefined || v === null || String(v).trim() === '') {
        const pm = r.ProjectMaster ?? r.projectMaster;
        if (pm !== undefined && pm !== null) {
            const ps = String(pm).trim();
            if (ps && !/^\d+$/.test(ps)) v = pm;
        }
    }
    return v !== undefined && v !== null ? String(v) : '';
}

/** Display text for sub-project — TY uses SubProjectMaster (string); joins use SubProjectDesp. */
function resolveSubProjectDespFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProjectName ?? r.subProjectName ?? r.SubProject ?? r.subProject ?? '';
    if (v === undefined || v === null || String(v).trim() === '') {
        const sm = r.SubProjectMaster ?? r.subProjectMaster;
        if (sm !== undefined && sm !== null) {
            const ss = String(sm).trim();
            if (ss && !/^\d+$/.test(ss)) v = sm;
        }
    }
    return v !== undefined && v !== null ? String(v) : '';
}

/** Bill / MRN / amounts only — used when project+sub filters a bill from API without overwriting user project picks incorrectly. */
function applyBillApiFieldsOnly(tr, r) {
    if (!tr || !r) return;
    const mrnHidden = tr.querySelector('.inp-mrn-code');
    const dCode = tr.querySelector('.inp-detail-code');
    const mrnNum = resolveMrnFromRow(r);
    if (mrnHidden) mrnHidden.value = mrnNum != null ? String(mrnNum) : '';
    if (dCode) {
        const explicit = r.GRNPaymentDetail_Code ?? r.GRNPaymentDetails_Code
            ?? r.DetailCode ?? r.detailCode ?? r.LineCode ?? r.lineCode;
        if (explicit !== undefined && explicit !== null && `${explicit}`.trim() !== '') {
            dCode.value = String(explicit);
        } else if (isGrnPaymentSavedDetailRow(r)) {
            const c = r.Code ?? r.code;
            if (c !== undefined && c !== null && `${c}`.trim() !== '') dCode.value = String(c);
        } else {
            dCode.value = '0';
        }
    }
    const no = tr.querySelector('.inp-bill-no');
    const bd = tr.querySelector('.inp-bill-date');
    const ba = tr.querySelector('.inp-bill-amt');
    const py = tr.querySelector('.inp-payable');
    const pm = tr.querySelector('.inp-payment');
    if (no) {
        no.value = r.BillNo ?? r.billNo ?? r.Name ?? r.name ?? r.BillName ?? r.billName ?? '';
    }
    const bdt = r.BillDate ?? r.billDate ?? r.ReceiveDate ?? r.receiveDate;
    if (bd) bd.value = formatDateInput(bdt);
    const bAmt = r.BillAmount ?? r.billAmount ?? r.Amount ?? r.amount
        ?? r.TotalBillAmountManual ?? r.totalBillAmountManual;
    const pAmt = r.PayableAmount ?? r.payableAmount ?? r.NetPayable ?? r.netPayable ?? bAmt;
    if (ba) ba.value = bAmt !== undefined && bAmt !== null && bAmt !== '' ? bAmt : '';
    if (py) py.value = pAmt !== undefined && pAmt !== null && pAmt !== '' ? pAmt : '';
    if (pm) {
        const payExplicit = r.PaymentAmount ?? r.paymentAmount ?? r['Payment Amount'];
        if (payExplicit !== undefined && payExplicit !== null && payExplicit !== '') {
            pm.value = String(payExplicit);
        }
    }
    const ded = tr.querySelector('.inp-deduction');
    if (ded) {
        const dv = r.Dedution ?? r.dedution ?? r.Deduction ?? r.deduction;
        ded.value = dv !== undefined && dv !== null && `${dv}`.trim() !== '' ? String(dv) : '';
    }
    gpaBindPoCategoryOnRow(tr, r, true);
}

function bindBillRowProjectSubAsync(tr, r) {
    if (!tr || !r) return Promise.resolve();
    return (async () => {
        const pj = tr.querySelector('.inp-project-ddl');
        const sp = tr.querySelector('.inp-subproject-ddl');
        if (!pj || !sp) return;
        initBillRowProjectSelects(tr);
        const pCode = resolveProjectMasterCodeFromRow(r);
        const sCode = resolveSubProjectMasterCodeFromRow(r);
        const pv = resolveProjectDespFromRow(r);
        const sv = resolveSubProjectDespFromRow(r);

        if (pCode !== '' && ![...pj.options].some(o => o.value === String(pCode))) {
            const o = document.createElement('option');
            o.value = String(pCode);
            o.text = pv.trim() ? pv.trim() : String(pCode);
            pj.appendChild(o);
        }
        if (pCode !== '') {
            pj.value = String(pCode);
        } else if (pv.trim()) {
            const opt = [...pj.options].find(o => String(o.text).trim() === pv.trim());
            if (opt) pj.value = opt.value;
        }

        await fillSubProjectOptionsForRow(tr, pj.value);

        if (sCode !== '' && ![...sp.options].some(o => o.value === String(sCode))) {
            const o = document.createElement('option');
            o.value = String(sCode);
            o.text = sv.trim() ? sv.trim() : String(sCode);
            sp.appendChild(o);
        }
        if (sCode !== '') {
            sp.value = String(sCode);
        } else if (sv.trim()) {
            const opt = [...sp.options].find(o => String(o.text).trim() === sv.trim());
            if (opt) sp.value = opt.value;
        }
    })();
}

async function onBillRowProjectSubChange(tr) {
    if (!tr || editMode) return;
    const partyKey = getGpaCounterpartyKey();
    const pj = tr.querySelector('.inp-project-ddl');
    const sp = tr.querySelector('.inp-subproject-ddl');
    const proj = pj?.value?.trim() ?? '';
    const sub = sp?.value?.trim() ?? '';
    if (!partyKey) return;
    if (!proj && !sub) return;
    const prevPay = tr.querySelector('.inp-payment')?.value ?? '';
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(
            partyKey,
            gpaToBillDetailQueryCode(proj),
            gpaToBillDetailQueryCode(sub)
        );
        const rows = normalizeApiRows(result);
        if (!rows.length) {
            // Employee (non-vendor): allow manual allocation with Project + Sub project + Amount only (no MRN from server).
            if (!isGpaPartyMode()) {
                const mrnHidden = tr.querySelector('.inp-mrn-code');
                if (mrnHidden) mrnHidden.value = '';
                const pyEl = tr.querySelector('.inp-payable');
                if (pyEl && !(parseNum(pyEl) > 0)) {
                    pyEl.value = '';
                }
                return;
            }
            showToast('No matching bill for this project/sub-project.', 'info');
            return;
        }
        applyBillApiFieldsOnly(tr, rows[0]);
        const pm = tr.querySelector('.inp-payment');
        if (pm && prevPay !== undefined && prevPay !== null && String(prevPay).trim() !== '') {
            pm.value = prevPay;
        }
        recalcFooter();
    } catch (e) {
        console.error('onBillRowProjectSubChange', e);
        showToast('Could not load bill for selected project/sub-project.', 'error');
    } finally {
        gpaRefreshRowPayableEditable(tr);
    }
}

function wireBillTableDelegation() {
    const tbody = document.getElementById('billTbody');
    if (!tbody || tbody.dataset.delegationWired === '1') return;
    tbody.dataset.delegationWired = '1';
    tbody.addEventListener('change', e => {
        const t = e.target;
        if (t.classList.contains('inp-project-ddl')) {
            const tr = t.closest('tr');
            if (tr) {
                fillSubProjectOptionsForRow(tr, t.value).then(() => onBillRowProjectSubChange(tr));
            }
        } else if (t.classList.contains('inp-subproject-ddl')) {
            const tr = t.closest('tr');
            if (tr) void onBillRowProjectSubChange(tr);
        }
    });
    tbody.addEventListener('input', e => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        if (t.classList.contains('inp-bill-amt')) {
            const tr = t.closest('tr');
            const pay = tr && tr.querySelector('.inp-payable');
            if (pay && pay.readOnly) pay.value = t.value;
            const payInp = tr && tr.querySelector('.inp-payment');
            if (payInp) clampGpaPaymentToPayable(payInp);
        }
        if (t.classList.contains('inp-payable')) {
            const tr = t.closest('tr');
            const payInp = tr && tr.querySelector('.inp-payment');
            if (payInp) clampGpaPaymentToPayable(payInp);
        }
        if (t.classList.contains('inp-payment')) {
            clampGpaPaymentToPayable(t);
        }
        if (t.classList.contains('inp-bill-amt') || t.classList.contains('inp-payment') || t.classList.contains('inp-payable')) {
            recalcFooter();
        }
    });
    tbody.addEventListener('focusout', e => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement) || !t.classList.contains('inp-bill-no')) return;
        const tr = t.closest('tr');
        if (tr) gpaRefreshRowPayableEditable(tr);
        const issue = findDuplicateBillAllocationIssue();
        if (issue) showGpaDuplicateBillToast(issue);
    });
}

function clearBillRows() {
    const tbody = document.getElementById('billTbody');
    if (tbody) tbody.innerHTML = '';
}

/** GRN-style: bill grid needs Party (like Project + SubProject + Party on GRN) before Fill Grid can load DDL_BILLNOLIST. */
function removeGpaPartyHint() {
    document.getElementById('trGpaPartyHint')?.remove();
}

function showGpaPartyHint() {
    const tbody = document.getElementById('billTbody');
    if (!tbody || editMode) return;
    removeGpaPartyHint();
    const who = isGpaPartyMode() ? 'Party Name' : 'Employee';
    tbody.insertAdjacentHTML('beforeend', `
<tr id="trGpaPartyHint" class="gpa-party-hint-row">
    <td colspan="9" style="text-align:center;padding:18px 12px;background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(99,102,241,0.05));border-top:1px dashed #c4b5fd;">
        <div style="display:inline-flex;align-items:center;gap:10px;max-width:520px;">
            <i class="fa fa-info-circle" style="color:#667eea;font-size:1.1rem;"></i>
            <span style="font-size:0.82rem;color:#475569;">
                Select <strong style="color:#4f46e5;">${who}</strong> first (section 1). Then turn on <strong style="color:#4f46e5;">Fill Grid</strong> to load pending bills from the server, or use <strong style="color:#4f46e5;">Add row</strong> to enter a bill manually.
            </span>
        </div>
    </td>
</tr>`);
}

function initBillGrid() {
    clearBillRows();
    showGpaPartyHint();
    wireBillTableDelegation();
    recalcFooter();
}

// ══════════════════════════════════════════════════════════════════════════════
// AMOUNT HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function parseNum(el) {
    if (!el) return 0;
    const v = parseFloat(String(el.value || '').replace(/,/g, ''));
    return Number.isFinite(v) ? v : 0;
}

/** Selected option label text for TY_GRNPayment* string fields (skips placeholder options). */
function gpaSelectedOptionText(selectEl) {
    if (!selectEl || selectEl.selectedIndex <= 0) return '';
    const opt = selectEl.selectedOptions?.[0];
    if (!opt) return '';
    const t = String(opt.textContent ?? opt.text ?? '').trim();
    if (!t || /^--\s/.test(t)) return '';
    return t;
}

/** Dropdown option value → int for API (TY_GRNPaymentDetails.ProjectMaster_Code / SubProjectMaster_Code). */
function gpaDdlIntCode(selectEl) {
    if (!selectEl) return 0;
    const raw = String(selectEl.value ?? '').trim();
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
}

function formatMoney(n) {
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

/** Unspecified numeric fields default to 0 for API payloads. */
function gpaNumOrZero(v) {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/**
 * Allocated amount per row for totals and save:
 * Case 1 (MRN line): Payment amount only.
 * Case 2 (Party, no bill no): Payment if set, else Payable.
 * Case 3 (Employee): Payment if set, else Payable.
 * Party with bill no text but no MRN: Payment only.
 */
function gpaLineEffectivePayment(tr) {
    if (!tr) return 0;
    const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
    const pay = parseNum(tr.querySelector('.inp-payment'));
    const payable = parseNum(tr.querySelector('.inp-payable'));
    if (mrn > 0) return pay;
    if (!isGpaPartyMode()) return pay > 0 ? pay : payable;
    const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
    if (!billNo) return pay > 0 ? pay : payable;
    return pay;
}

function sumGpaGridPaymentAmounts() {
    let sum = 0;
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        if (isGpaPartyMode() && !gpaPartyLineIsIncludedInAllocation(tr)) return;
        sum += gpaLineEffectivePayment(tr);
    });
    return sum;
}

/** Party + no MRN + empty bill no + Project + Sub + (Payable > 0 or Payment > 0) (Case 2). */
function gpaIsPartyCase2Line(tr) {
    if (!tr || !isGpaPartyMode()) return false;
    const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
    if (mrn > 0) return false;
    const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
    if (billNo) return false;
    // Must match collectPayload / TY_GRNPaymentDetails: use selected option text, not .value (codes can be blank until DDL binds).
    const pj = gpaSelectedOptionText(tr.querySelector('.inp-project-ddl'));
    const sp = gpaSelectedOptionText(tr.querySelector('.inp-subproject-ddl'));
    if (!pj || !sp) return false;
    const payable = parseNum(tr.querySelector('.inp-payable'));
    const pay = parseNum(tr.querySelector('.inp-payment'));
    return payable > 0 || pay > 0;
}

/** Party + no MRN + empty bill no + no Project/Sub + Payment > 0 (Case 3: on-account / payment only). */
function gpaIsPartyCase3PaymentOnlyLine(tr) {
    if (!tr || !isGpaPartyMode()) return false;
    const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
    if (mrn > 0) return false;
    const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
    if (billNo) return false;
    const pj = gpaSelectedOptionText(tr.querySelector('.inp-project-ddl'));
    const sp = gpaSelectedOptionText(tr.querySelector('.inp-subproject-ddl'));
    if (pj || sp) return false;
    return parseNum(tr.querySelector('.inp-payment')) > 0;
}

/**
 * Party mode: row counts toward footer total and save only if it is complete enough to post.
 * - MRN line, Bill no line, Case 2 (project+sub+amount), or Case 3 (payment only, no bill/project).
 */
function gpaPartyLineIsIncludedInAllocation(tr) {
    if (!tr || !isGpaPartyMode()) return true;
    const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
    if (mrn > 0) return true;
    const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
    if (billNo) return true;
    if (gpaIsPartyCase3PaymentOnlyLine(tr)) return true;
    return gpaIsPartyCase2Line(tr);
}

/** Payable column: editable for Employee (Case 3) and Party without bill no (Case 2); readonly when MRN loaded (Case 1). */
function gpaRefreshRowPayableEditable(tr) {
    if (!tr) return;
    const py = tr.querySelector('.inp-payable');
    if (!py) return;
    const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
    const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
    let ro = true;
    if (mrn > 0) ro = true;
    else if (!isGpaPartyMode()) ro = false;
    else if (!billNo) ro = false;
    else ro = true;
    py.readOnly = ro;
    py.style.background = ro ? '#ede9fe' : '#fff';
    py.style.borderColor = ro ? '#c4b5fd' : '';
}

function gpaRefreshAllBillRowsPayableEditable() {
    document.querySelectorAll('#billTbody tr.bill-row').forEach(gpaRefreshRowPayableEditable);
}

/** When payable > 0, payment cannot exceed it (row-level). */
function rowPaymentExceedsPayable(tr) {
    if (!tr) return false;
    const pay = parseNum(tr.querySelector('.inp-payment'));
    const maxP = parseNum(tr.querySelector('.inp-payable'));
    return maxP > 0 && pay > maxP + 0.005;
}

/** Cap .inp-payment to .inp-payable in the same row; toast if reduced. */
function clampGpaPaymentToPayable(payInput) {
    if (!payInput?.classList?.contains('inp-payment')) return;
    const tr = payInput.closest('tr');
    const payEl = tr?.querySelector('.inp-payable');
    if (!payEl) return;
    const maxPayable = parseNum(payEl);
    if (!(maxPayable > 0)) return;
    const pay = parseNum(payInput);
    if (pay > maxPayable + 0.0001) {
        payInput.value = formatMoney(maxPayable);
        showToast(`Payment amount cannot exceed payable amount (${formatMoney(maxPayable)}).`, 'warning');
    }
}

/** Same bill no on two rows, or same MRN on two rows (case-insensitive bill no). */
function findDuplicateBillAllocationIssue() {
    const rows = document.querySelectorAll('#billTbody tr.bill-row');
    const seenBill = new Map();
    const seenMrn = new Set();
    for (const tr of rows) {
        const billRaw = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
        const normBill = billRaw.toLowerCase();
        if (normBill) {
            if (seenBill.has(normBill)) {
                return { reason: 'billNo', display: billRaw || seenBill.get(normBill) };
            }
            seenBill.set(normBill, billRaw);
        }
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        if (mrn > 0) {
            if (seenMrn.has(mrn)) return { reason: 'mrn', display: String(mrn) };
            seenMrn.add(mrn);
        }
    }
    return null;
}

function showGpaDuplicateBillToast(issue) {
    if (!issue) return;
    if (issue.reason === 'billNo') {
        showToast(`Duplicate bill number "${issue.display}" is not allowed. Remove or change one of the lines.`, 'warning');
    } else {
        showToast(`The same bill (MRN ${issue.display}) is on more than one line. Keep only one line per bill.`, 'warning');
    }
}

function markFooterAdvanceManual() {
    const el = document.getElementById('txtFooterAdvance');
    if (el) el.dataset.advanceManual = '1';
}

function recalcFooter() {
    const sum = sumGpaGridPaymentAmounts();
    const headerAmt = parseNum(document.getElementById('txtHeaderAmount'));
    const elTotal = document.getElementById('txtFooterTotal');
    const elAdv = document.getElementById('txtFooterAdvance');
    if (elTotal) elTotal.value = formatMoney(sum);
    if (elAdv && !elAdv.dataset.advanceManual) {
        elAdv.value = formatMoney(headerAmt - sum);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTY / BILL — GetBillDetails(PartyMaster_Code) only (no GetBillNo)
// ══════════════════════════════════════════════════════════════════════════════
function formatDateInput(val) {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return '';
}

/** Saved TY_GRNPaymentDetails row: Code is detail line PK, not MRN (master code must be > 0). */
function isGrnPaymentSavedDetailRow(r) {
    if (!r || typeof r !== 'object') return false;
    const g = r.GRNPaymentMaster_Code ?? r.gRNPaymentMaster_Code;
    if (g === undefined || g === null || `${g}`.trim() === '') return false;
    const n = parseInt(String(g), 10);
    return Number.isFinite(n) && n > 0;
}

/**
 * MRN from API / grid row. USP DDL_BILLNOLIST returns MRN as Code (not MRNMaster_Code); also supports MRNMaster_Code / MRN_Code.
 */
function resolveMrnFromRow(r) {
    if (!r || typeof r !== 'object') return null;
    const asPosInt = (x) => {
        if (x === undefined || x === null || `${x}`.trim() === '') return null;
        const n = parseInt(String(x), 10);
        return Number.isFinite(n) && n > 0 ? n : null;
    };
    let v = asPosInt(
        r.MRNMaster_Code ?? r.mRNMaster_Code ?? r.mrnMaster_Code ?? r.MRNMASTER_CODE ?? r.mrnmaster_code
        ?? r.MRN_Code ?? r.mrn_Code ?? r.MRNCode ?? r.mrnCode
        ?? r.MRNMasterCode ?? r.mrnMasterCode
    );
    if (v != null) return v;
    if (!isGrnPaymentSavedDetailRow(r)) {
        v = asPosInt(r.Code ?? r.code ?? r.MRNNo ?? r.mrnNo);
    }
    return v;
}

function isGpaFillGridChecked() {
    if (editMode) return false;
    const chk = document.getElementById('chkGpaFillGrid');
    return chk ? chk.checked : true;
}

/** Fill Grid: New mode only — never show in Edit (same as GRNService showFillGridCheckbox + !important). */
function gpaShowFillGridCheckbox(show) {
    const div = document.getElementById('divGpaFillGridCheck');
    if (!div) return;
    const visible = !!show && !editMode;
    if (visible) {
        div.removeAttribute('hidden');
        div.style.setProperty('display', 'flex', 'important');
    } else {
        div.setAttribute('hidden', 'hidden');
        div.style.setProperty('display', 'none', 'important');
    }
}

async function onGpaFillGridChange() {
    if (editMode) return;
    const cp = getGpaCounterpartyKey();
    if (isGpaFillGridChecked() && !cp) {
        showToast(
            isGpaPartyMode()
                ? 'Please select Party Name first (same as GRN: pick Party before loading the grid).'
                : 'Please select Employee first before loading the grid.',
            'warning'
        );
        const chk = document.getElementById('chkGpaFillGrid');
        if (chk) chk.checked = false;
        recalcFooter();
        return;
    }
    if (isGpaFillGridChecked() && cp) {
        try {
            await reloadGpaPoListForCurrentParty(true, cp);
            const result = await GRNPaymentApprovalService.GetBillDetails(cp);
            const billRows = normalizeApiRows(result);
            gpaPoListCache = gpaMergePoListRows(gpaPoListCache, gpaExtractPoListFromBillRows(billRows));
            await fillBillGridFromDetailRows(billRows);
            gpaApplyPoListToAllDropdowns(false);
            if (billRows.length === 0) {
                showToast(isGpaPartyMode() ? 'No pending bills for this party.' : 'No pending bills for this employee.', 'info');
            }
        } catch (e) {
            console.error('onGpaFillGridChange', e);
            clearBillRows();
            showGpaPartyHint();
            showToast('Could not load bill details.', 'error');
        }
    } else if (!isGpaFillGridChecked()) {
        clearBillRows();
        if (cp) {
            await reloadGpaPoListForCurrentParty(true, cp);
            addBillRows(DEFAULT_BILL_ROW_COUNT);
            gpaApplyPoListToAllDropdowns(true);
        } else showGpaPartyHint();
    }
    recalcFooter();
}

function clearGpaAddBillModalBillFields() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalMrn', '');
    set('gpaAddBillModalBillNo', '');
    set('gpaAddBillModalPo', '');
    set('gpaAddBillModalCategory', '');
    set('gpaAddBillModalProject', '');
    set('gpaAddBillModalSubProject', '');
    set('gpaAddBillModalBillDate', '');
    set('gpaAddBillModalBillAmt', '');
    set('gpaAddBillModalDeduction', '');
    set('gpaAddBillModalPayable', '');
    set('gpaAddBillModalPayment', '');
    gpaRefreshAddBillModalPayableEditable();
}

/** Bill / Payable / Payment — numeric fields reset to 0 (e.g. when Project changes). */
function gpaZeroAddBillModalAmountFields() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalBillAmt', '0');
    set('gpaAddBillModalPayable', '0');
    set('gpaAddBillModalPayment', '0');
    gpaRefreshAddBillModalPayableEditable();
}

function clearGpaAddBillModalBillOnlyFields() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalMrn', '');
    set('gpaAddBillModalBillNo', '');
    set('gpaAddBillModalPo', '');
    set('gpaAddBillModalBillDate', '');
    set('gpaAddBillModalDeduction', '');
    gpaZeroAddBillModalAmountFields();
}

/** Project / Sub project change: clear bill no, MRN, date, amounts + bill dropdown (manual Project+Sub+Payment path). */
function gpaResetAddBillModalForProjectAndSubChange() {
    gpaAddBillModalBillRowsCache = [];
    const billWrap = document.getElementById('gpaAddBillModalBillWrap');
    const billSel = document.getElementById('gpaAddBillModalBill');
    if (billWrap) billWrap.style.display = 'none';
    if (billSel) billSel.innerHTML = '<option value="">-- Select bill --</option>';
    clearGpaAddBillModalBillOnlyFields();
}

async function populateGpaAddBillModalProjectSubDropdowns() {
    const pSel = document.getElementById('gpaAddBillModalProject');
    const sSel = document.getElementById('gpaAddBillModalSubProject');
    if (!pSel || !sSel) return;
    pSel.innerHTML = '<option value="">-- Project --</option>';
    (gpaProjectListCache || []).forEach(p => {
        const opt = document.createElement('option');
        const code = p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code
            ?? p.Project_Code ?? p.project_Code ?? p.F_ProjectMaster_Code ?? p.f_ProjectMaster_Code ?? '';
        opt.value = code !== undefined && code !== null ? String(code) : '';
        opt.text = p.ProjectName ?? p.projectName ?? p.Name ?? p.ProjectDesp ?? p.projectDesp ?? opt.value;
        pSel.appendChild(opt);
    });
    sSel.innerHTML = '<option value="">-- Sub project --</option>';
}

function populateGpaAddBillModalPoCategoryDropdowns() {
    const poSel = document.getElementById('gpaAddBillModalPo');
    const catSel = document.getElementById('gpaAddBillModalCategory');
    gpaFillPoSelectOptions(poSel, '');
    gpaFillCategorySelectOptions(catSel, '');
}

function gpaBindPoCategoryOnModal(r, preserveCategory) {
    if (!r) return;
    const poSel = document.getElementById('gpaAddBillModalPo');
    const catSel = document.getElementById('gpaAddBillModalCategory');
    let poNo = gpaResolvePoNoTextFromRow(r);
    if (!poNo) {
        const c = gpaResolvePoCodeFromRow(r);
        if (c) poNo = gpaLookupPoNoLabel(c);
    }
    let catName = gpaResolveCategoryNameFromRow(r);
    if (!catName) {
        const c = gpaResolveCategoryCodeFromRow(r);
        if (c) catName = gpaLookupCategoryLabel(c);
    }
    if (preserveCategory && catSel) {
        const existing = gpaCategoryNameFromSelect(catSel);
        if (existing) catName = existing;
    }
    gpaFillPoSelectOptions(poSel, poNo);
    gpaFillCategorySelectOptions(catSel, catName);
}

async function fillGpaAddBillModalSubProjects(projectCode) {
    const sSel = document.getElementById('gpaAddBillModalSubProject');
    if (!sSel) return;
    const prev = sSel.value;
    sSel.innerHTML = '<option value="">-- Sub project --</option>';
    const pc = projectCode !== undefined && projectCode !== null ? String(projectCode).trim() : '';
    if (!pc) return;
    try {
        const subResult = await GRNPaymentApprovalService.GetSubProjectMasterList(pc);
        const subs = Array.isArray(subResult) ? subResult : normalizeApiRows(subResult);
        subs.forEach(s => {
            const opt = document.createElement('option');
            const code = s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? s.code
                ?? s.SubProject_Code ?? s.subProject_Code ?? s.F_SubProjectMaster_Code ?? s.f_SubProjectMaster_Code ?? '';
            opt.value = code !== undefined && code !== null ? String(code) : '';
            opt.text = s.SubProjectName ?? s.subProjectName ?? s.SubProjectDesp ?? s.subProjectDesp ?? s.Name ?? s.name ?? opt.value;
            sSel.appendChild(opt);
        });
        if (prev && [...sSel.options].some(o => o.value === prev)) sSel.value = prev;
    } catch (e) {
        console.error('fillGpaAddBillModalSubProjects', e);
    }
}

function resetGpaAddBillModalForm() {
    const billWrap = document.getElementById('gpaAddBillModalBillWrap');
    if (billWrap) billWrap.style.display = 'none';
    const sel = document.getElementById('gpaAddBillModalBill');
    if (sel) sel.innerHTML = '<option value="">-- Select bill --</option>';
    gpaAddBillModalBillRowsCache = [];
    clearGpaAddBillModalBillFields();
    const hint = document.getElementById('gpaAddBillModalHint');
    const form = document.getElementById('gpaAddBillModalForm');
    if (hint) hint.style.display = 'none';
    if (form) form.style.display = 'block';
    gpaRefreshAddBillModalPayableEditable();
}

/** Payable in Add bill modal: editable when no MRN (manual Project/Sub/Payable, Bill no cleared). */
function gpaRefreshAddBillModalPayableEditable() {
    const mrnEl = document.getElementById('gpaAddBillModalMrn');
    const py = document.getElementById('gpaAddBillModalPayable');
    const ba = document.getElementById('gpaAddBillModalBillAmt');
    if (!py) return;
    const mrn = parseInt(mrnEl?.value ?? '0', 10) || 0;
    if (mrn > 0) {
        py.readOnly = true;
        py.style.background = '#ede9fe';
        py.style.borderColor = '#c4b5fd';
        if (ba) py.value = ba.value;
    } else {
        py.readOnly = false;
        py.style.background = '#fff';
        py.style.borderColor = '';
    }
}

function gpaOnAddBillModalBillNoInput() {
    const billNo = document.getElementById('gpaAddBillModalBillNo')?.value?.trim() ?? '';
    if (!billNo) {
        const mrnEl = document.getElementById('gpaAddBillModalMrn');
        if (mrnEl) mrnEl.value = '';
    }
    gpaRefreshAddBillModalPayableEditable();
}

/** Close Add bill modal and clear fields (edit / reset must not leave modal looking like the loaded voucher). */
function hideGpaAddBillModalAndReset() {
    resetGpaAddBillModalForm();
    const modalEl = document.getElementById('gpaAddBillModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
    }
}

function applyBillApiRowToModalInputs(r, opts) {
    if (!r) return;
    opts = opts || {};
    const preserveCategory = opts.preserveCategory === true;
    const mrnNum = resolveMrnFromRow(r);
    const mrnEl = document.getElementById('gpaAddBillModalMrn');
    if (mrnEl) mrnEl.value = mrnNum != null ? String(mrnNum) : '';

    const no = r.BillNo ?? r.billNo ?? r.Name ?? r.name ?? r.BillName ?? r.billName ?? '';
    const bdt = r.BillDate ?? r.billDate ?? r.ReceiveDate ?? r.receiveDate;
    const bAmt = r.BillAmount ?? r.billAmount ?? r.Amount ?? r.amount
        ?? r.TotalBillAmountManual ?? r.totalBillAmountManual;
    const pAmt = r.PayableAmount ?? r.payableAmount ?? r.NetPayable ?? r.netPayable ?? bAmt;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalBillNo', no);
    const pSel = document.getElementById('gpaAddBillModalProject');
    const sSel = document.getElementById('gpaAddBillModalSubProject');
    const pCode = r.ProjectMaster_Code ?? r.projectMaster_Code ?? '';
    const sCode = r.SubProjectMaster_Code ?? r.subProjectMaster_Code ?? '';
    if (pSel) {
        if (pCode && [...pSel.options].some(o => o.value === String(pCode))) {
            pSel.value = String(pCode);
        } else {
            const pv = r.ProjectDesp ?? r.projectDesp ?? r.Project ?? r.project ?? '';
            if (pv) {
                const opt = [...pSel.options].find(o => String(o.text).trim() === String(pv).trim());
                if (opt) pSel.value = opt.value;
            }
        }
    }
    void fillGpaAddBillModalSubProjects(pSel?.value ?? '').then(() => {
        if (sSel) {
            if (sCode && [...sSel.options].some(o => o.value === String(sCode))) {
                sSel.value = String(sCode);
            } else {
                const sv = r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProject ?? r.subProject ?? '';
                if (sv) {
                    const opt = [...sSel.options].find(o => String(o.text).trim() === String(sv).trim());
                    if (opt) sSel.value = opt.value;
                }
            }
        }
        gpaRefreshAddBillModalPayableEditable();
    });
    set('gpaAddBillModalBillDate', formatDateInput(bdt));
    set('gpaAddBillModalBillAmt', bAmt !== undefined && bAmt !== null && bAmt !== '' ? String(bAmt) : '');
    const payStr = pAmt !== undefined && pAmt !== null && pAmt !== '' ? String(pAmt) : '';
    set('gpaAddBillModalPayable', payStr);
    set('gpaAddBillModalPayment', '');
    const dedEl = document.getElementById('gpaAddBillModalDeduction');
    if (dedEl) {
        const dv = r.Dedution ?? r.dedution ?? r.Deduction ?? r.deduction;
        dedEl.value = dv !== undefined && dv !== null && `${dv}`.trim() !== '' ? String(dv) : '';
    }
    gpaBindPoCategoryOnModal(r, preserveCategory);
    gpaRefreshAddBillModalPayableEditable();
}

function onGpaAddBillModalBillChange() {
    const sel = document.getElementById('gpaAddBillModalBill');
    const v = sel?.value ?? '';
    if (v === '') {
        clearGpaAddBillModalBillFields();
        gpaRefreshAddBillModalPayableEditable();
        return;
    }
    const idx = parseInt(v, 10);
    const r = gpaAddBillModalBillRowsCache[idx];
    if (r) applyBillApiRowToModalInputs(r);
    else gpaRefreshAddBillModalPayableEditable();
}

/** Load bills into Add bill modal using Party / Employee selected in Payment Entry (step 1). */
async function loadGpaAddBillModalBillsForMainParty() {
    const party = getGpaCounterpartyKey();

    const billWrap = document.getElementById('gpaAddBillModalBillWrap');
    const billSel = document.getElementById('gpaAddBillModalBill');
    const hint = document.getElementById('gpaAddBillModalHint');
    const hintText = document.getElementById('gpaAddBillModalHintText');

    clearGpaAddBillModalBillFields();
    gpaAddBillModalBillRowsCache = [];
    if (billSel) billSel.innerHTML = '<option value="">-- Select bill --</option>';
    if (billWrap) billWrap.style.display = 'none';

    if (!party) {
        if (hint) {
            hint.style.display = 'block';
            if (hintText) {
                hintText.textContent = isGpaPartyMode()
                    ? 'Select Party Name in Payment Entry (step 1) to load bill details below.'
                    : 'Select Employee in Payment Entry (step 1) to load bill details below.';
            }
        }
        gpaRefreshAddBillModalPayableEditable();
        return;
    }
    if (hint) hint.style.display = 'none';

    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(party);
        const billRows = normalizeApiRows(result);
        gpaAddBillModalBillRowsCache = billRows;

        if (billRows.length === 0) {
            showToast('No bills found for this party. Enter details manually.', 'info');
            return;
        }
        if (billRows.length === 1) {
            applyBillApiRowToModalInputs(billRows[0]);
            return;
        }
        if (billWrap) billWrap.style.display = 'block';
        if (billSel) {
            billRows.forEach((row, i) => {
                const no = row.BillNo ?? row.billNo ?? row.Name ?? row.name ?? `Bill ${i + 1}`;
                billSel.appendChild(new Option(String(no), String(i)));
            });
        }
    } catch (e) {
        console.error('loadGpaAddBillModalBillsForMainParty', e);
        showToast('Could not load bills for this party.', 'error');
    } finally {
        gpaRefreshAddBillModalPayableEditable();
    }
}

/** @deprecated Modal party dropdown removed; use loadGpaAddBillModalBillsForMainParty */
async function onGpaAddBillModalPartyChange() {
    return loadGpaAddBillModalBillsForMainParty();
}

async function reloadGpaAddBillModalBillsFromFilters() {
    const party = getGpaCounterpartyKey()?.trim() ?? '';
    if (!party) return;
    const pSel = document.getElementById('gpaAddBillModalProject');
    const sSel = document.getElementById('gpaAddBillModalSubProject');
    const pc = pSel?.value?.trim() ?? '';
    const sc = sSel?.value?.trim() ?? '';
    if (!pc && !sc) return;
    const billWrap = document.getElementById('gpaAddBillModalBillWrap');
    const billSel = document.getElementById('gpaAddBillModalBill');
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(
            party,
            gpaToBillDetailQueryCode(pc),
            gpaToBillDetailQueryCode(sc)
        );
        const billRows = normalizeApiRows(result);
        gpaAddBillModalBillRowsCache = billRows;
        clearGpaAddBillModalBillOnlyFields();
        if (billRows.length === 0) {
            if (billWrap) billWrap.style.display = 'none';
            if (billSel) billSel.innerHTML = '<option value="">-- Select bill --</option>';
            showToast('No bills for this project/sub-project.', 'info');
            return;
        }
        if (billRows.length === 1) {
            if (billWrap) billWrap.style.display = 'none';
            applyBillApiRowToModalInputs(billRows[0], { preserveCategory: true });
            return;
        }
        if (billWrap) billWrap.style.display = 'block';
        if (billSel) {
            billSel.innerHTML = '<option value="">-- Select bill --</option>';
            billRows.forEach((row, i) => {
                const no = row.BillNo ?? row.billNo ?? row.Name ?? row.name ?? `Bill ${i + 1}`;
                billSel.appendChild(new Option(String(no), String(i)));
            });
        }
    } catch (e) {
        console.error('reloadGpaAddBillModalBillsFromFilters', e);
        showToast('Could not load bills for this filter.', 'error');
    } finally {
        gpaRefreshAddBillModalPayableEditable();
    }
}

async function onGpaAddBillModalProjectPick() {
    gpaResetAddBillModalForProjectAndSubChange();
    const pSel = document.getElementById('gpaAddBillModalProject');
    await fillGpaAddBillModalSubProjects(pSel?.value ?? '');
    await reloadGpaAddBillModalBillsFromFilters();
}

async function onGpaAddBillModalSubPick() {
    gpaResetAddBillModalForProjectAndSubChange();
    await reloadGpaAddBillModalBillsFromFilters();
}

function onGpaAddBillModalBillAmtInput() {
    const ba = document.getElementById('gpaAddBillModalBillAmt');
    const py = document.getElementById('gpaAddBillModalPayable');
    if (py && ba && py.readOnly) py.value = ba.value;
}

async function onAddBillRowClick() {
    removeGpaPartyHint();
    if (!document.querySelector('#billTbody tr.bill-row')) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
    }
    resetGpaAddBillModalForm();
    await reloadGpaPoListForCurrentParty();
    await populateGpaAddBillModalProjectSubDropdowns();
    populateGpaAddBillModalPoCategoryDropdowns();
    const mainParty = getGpaCounterpartyKey();
    if (mainParty) {
        await loadGpaAddBillModalBillsForMainParty();
    } else {
        const hint = document.getElementById('gpaAddBillModalHint');
        const hintText = document.getElementById('gpaAddBillModalHintText');
        if (hint) hint.style.display = 'block';
        if (hintText) {
            hintText.textContent = isGpaPartyMode()
                ? 'Select Party Name in Payment Entry (step 1) to load bills, or enter Project/Sub project and Payment amount, or only Payment amount.'
                : 'Select Employee in Payment Entry (step 1) to load bills, or enter details below.';
        }
    }

    const modalEl = document.getElementById('gpaAddBillModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

function saveGpaAddBillModalToGrid() {
    const mrn = parseInt(document.getElementById('gpaAddBillModalMrn')?.value ?? '0', 10) || 0;
    const pay = parseFloat(String(document.getElementById('gpaAddBillModalPayment')?.value ?? '').replace(/,/g, '')) || 0;
    const payableRaw = document.getElementById('gpaAddBillModalPayable')?.value ?? '';
    const payable = parseFloat(String(payableRaw).replace(/,/g, ''));
    const payableNum = Number.isFinite(payable) ? payable : 0;
    const billNo = document.getElementById('gpaAddBillModalBillNo')?.value?.trim() ?? '';
    const modalProj = document.getElementById('gpaAddBillModalProject')?.value?.trim() ?? '';
    const modalSub = document.getElementById('gpaAddBillModalSubProject')?.value?.trim() ?? '';
    const modalPoSel = document.getElementById('gpaAddBillModalPo');
    const modalCatSel = document.getElementById('gpaAddBillModalCategory');
    const modalPoNo = gpaPoNoFromSelect(modalPoSel);
    const modalCatName = gpaCategoryNameFromSelect(modalCatSel);
    const modalDeduction = document.getElementById('gpaAddBillModalDeduction')?.value?.trim() ?? '';

    const mainParty = getGpaCounterpartyKey()?.trim() ?? '';
    if (!mainParty) {
        showToast(
            isGpaPartyMode()
                ? 'Please select Party Name in Payment Entry (step 1) before adding a bill row.'
                : 'Please select Employee in Payment Entry (step 1) before adding a bill row.',
            'warning'
        );
        return;
    }

    const hasBill = mrn > 0 || billNo.length > 0;
    const hasProjSub = Boolean(modalProj && modalSub);
    const partialProj = Boolean(modalProj || modalSub) && !hasProjSub;
    if (partialProj) {
        showToast('Select both Project and Sub project, or clear both to use Bill no or only Payment amount.', 'warning');
        return;
    }

    /** Party mode: (1) Bill no / loaded bill + Payment (2) Project + Sub + Payment (3) only Payment */
    const scenarioBill = hasBill && pay > 0;
    const scenarioProjPay = !hasBill && hasProjSub && pay > 0;
    const scenarioPayOnly = !hasBill && !hasProjSub && pay > 0;
    const employeePayableOnly = !isGpaPartyMode() && mrn <= 0 && payableNum > 0 && pay <= 0;

    if (isGpaPartyMode()) {
        if (!scenarioBill && !scenarioProjPay && !scenarioPayOnly) {
            showToast(
                'Use one of: (1) Bill no (or pick bill) with Payment amount — (2) Project, Sub project and Payment amount — (3) only Payment amount.',
                'warning'
            );
            return;
        }
    } else if (!scenarioBill && !scenarioProjPay && !scenarioPayOnly && !employeePayableOnly) {
        showToast(
            'Enter Payment or Payable amount, or load a bill (with Payment), or Project + Sub project + Payment.',
            'warning'
        );
        return;
    }
    if (Number.isFinite(payable) && payableNum > 0 && pay > payableNum + 0.0001) {
        showToast('Payment amount cannot be greater than Payable amount.', 'warning');
        return;
    }

    document.getElementById('billTbody')?.insertAdjacentHTML('beforeend', billRowTemplate());
    const tbody = document.getElementById('billTbody');
    const tr = tbody?.querySelector('tr.bill-row:last-child');
    if (!tr) return;

    const payStr = pay > 0 ? String(pay) : '';
    const payAmtStr = payableNum > 0 ? String(payableNum) : '';

    let rowObj = {
        MRNMaster_Code: mrn > 0 ? mrn : undefined,
        BillNo: billNo,
        BillDate: document.getElementById('gpaAddBillModalBillDate')?.value ?? '',
        BillAmount: document.getElementById('gpaAddBillModalBillAmt')?.value ?? '',
        PayableAmount: payAmtStr,
        PaymentAmount: payStr,
        ProjectMaster_Code: modalProj || undefined,
        SubProjectMaster_Code: modalSub || undefined,
        PONo: modalPoNo || undefined,
        CategoryName: modalCatName || undefined,
        PurchaseOrderMaster_Code: gpaPoCodeFromSelect(modalPoSel) || undefined,
        ProjectCategory_Code: gpaCatCodeFromSelect(modalCatSel) || undefined,
        Dedution: modalDeduction || undefined,
        Deduction: modalDeduction || undefined,
    };
    if (mrn > 0 && Array.isArray(gpaAddBillModalBillRowsCache) && gpaAddBillModalBillRowsCache.length) {
        const hit = gpaAddBillModalBillRowsCache.find(x => resolveMrnFromRow(x) === mrn);
        if (hit) rowObj = { ...hit, ...rowObj };
    }
    void applyBillDetailRow(tr, rowObj).then(() => {
        const dc = tr.querySelector('.inp-detail-code');
        if (dc) dc.value = '0';
        recalcFooter();
        const modalEl = document.getElementById('gpaAddBillModal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const inst = bootstrap.Modal.getInstance(modalEl) ?? bootstrap.Modal.getOrCreateInstance(modalEl);
            inst.hide();
        }
    });
}

function applyBillDetailRow(tr, r) {
    const mrnHidden = tr.querySelector('.inp-mrn-code');
    const dCode = tr.querySelector('.inp-detail-code');
    const mrnNum = resolveMrnFromRow(r);
    if (mrnHidden) mrnHidden.value = mrnNum != null ? String(mrnNum) : '';
    if (dCode) {
        const explicit = r.GRNPaymentDetail_Code ?? r.GRNPaymentDetails_Code
            ?? r.DetailCode ?? r.detailCode ?? r.LineCode ?? r.lineCode;
        if (explicit !== undefined && explicit !== null && `${explicit}`.trim() !== '') {
            dCode.value = String(explicit);
        } else if (isGrnPaymentSavedDetailRow(r)) {
            const c = r.Code ?? r.code;
            if (c !== undefined && c !== null && `${c}`.trim() !== '') dCode.value = String(c);
        } else {
            dCode.value = '0';
        }
    }
    const no = tr.querySelector('.inp-bill-no');
    const bd = tr.querySelector('.inp-bill-date');
    const ba = tr.querySelector('.inp-bill-amt');
    const py = tr.querySelector('.inp-payable');
    const pm = tr.querySelector('.inp-payment');
    if (no) {
        no.value = r.BillNo ?? r.billNo ?? r.Name ?? r.name ?? r.BillName ?? r.billName ?? '';
    }
    const bdt = r.BillDate ?? r.billDate ?? r.ReceiveDate ?? r.receiveDate;
    if (bd) bd.value = formatDateInput(bdt);
    const bAmt = r.BillAmount ?? r.billAmount ?? r.Amount ?? r.amount
        ?? r.TotalBillAmountManual ?? r.totalBillAmountManual;
    const pAmt = r.PayableAmount ?? r.payableAmount ?? r.NetPayable ?? r.netPayable ?? bAmt;
    if (ba) ba.value = bAmt !== undefined && bAmt !== null && bAmt !== '' ? bAmt : '';
    if (py) py.value = pAmt !== undefined && pAmt !== null && pAmt !== '' ? pAmt : '';
    if (pm) {
        const payExplicit = r.PaymentAmount ?? r.paymentAmount ?? r['Payment Amount'];
        if (payExplicit !== undefined && payExplicit !== null && payExplicit !== '') {
            pm.value = String(payExplicit);
        } else {
            pm.value = '';
        }
    }
    const ded = tr.querySelector('.inp-deduction');
    if (ded) {
        const dv = r.Dedution ?? r.dedution ?? r.Deduction ?? r.deduction;
        ded.value = dv !== undefined && dv !== null && `${dv}`.trim() !== '' ? String(dv) : '';
    }
    gpaBindPoCategoryOnRow(tr, r);
    return bindBillRowProjectSubAsync(tr, r).then(() => {
        gpaRefreshRowPayableEditable(tr);
    });
}

function rowMrnFromBillApi(r) {
    return resolveMrnFromRow(r) ?? 0;
}

/** Edit (GRNService-style): merge saved detail line with pending bill row by MRN, then bind once to #billTbody — never the Add bill modal. */
function mergeEditDetailWithBillLookup(d, billRows) {
    const mrn = rowMrnFromBillApi(d);
    if (!mrn || !billRows?.length) return d;
    const br = billRows.find(row => rowMrnFromBillApi(row) === mrn);
    if (!br) return d;
    return {
        ...br,
        ...d,
        PONo: gpaPoNoFromRecord(d) || gpaPoNoFromRecord(br),
        CategoryName: gpaCategoryNameFromRecord(d) || gpaCategoryNameFromRecord(br),
        PurchaseOrderMaster_Code: gpaPoCodeFromRecord(d) || gpaPoCodeFromRecord(br),
        ProjectCategory_Code: gpaCategoryCodeFromRecord(d) || gpaCategoryCodeFromRecord(br),
    };
}

async function fetchPartyPendingBillRows(partyVendorCode) {
    if (!partyVendorCode) return [];
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(partyVendorCode);
        return normalizeApiRows(result);
    } catch (e) {
        console.warn('fetchPartyPendingBillRows', e);
        return [];
    }
}

async function onPartyChange() {
    if (editMode) {
        recalcFooter();
        return;
    }
    removeGpaPartyHint();
    const code = document.getElementById('ddlPartyName')?.value?.trim() ?? '';
    clearBillRows();
    if (!code) {
        gpaPoListCache = [];
        gpaPoListPartyCodeCache = '';
        gpaApplyPoListToAllDropdowns(true);
        showGpaPartyHint();
        recalcFooter();
        return;
    }
    await loadGpaPoListForGrid(code);
    if (!isGpaFillGridChecked()) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        gpaApplyPoListToAllDropdowns(true);
        recalcFooter();
        return;
    }
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(code);
        const billRows = normalizeApiRows(result);
        gpaPoListCache = gpaMergePoListRows(gpaPoListCache, gpaExtractPoListFromBillRows(billRows));
        await fillBillGridFromDetailRows(billRows);
        gpaApplyPoListToAllDropdowns(false);
        if (billRows.length === 0) {
            showToast('No pending bills for this party.', 'info');
        }
    } catch (e) {
        console.error('Failed to load bill details for party:', e);
        showGpaPartyHint();
        showToast('Could not load bill details for party.', 'error');
    }
    recalcFooter();
}

async function onGpaEmployeeChange() {
    if (editMode) {
        recalcFooter();
        return;
    }
    removeGpaPartyHint();
    const code = document.getElementById('ddlEmployeeName')?.value?.trim() ?? '';
    clearBillRows();
    if (!code) {
        gpaPoListCache = [];
        gpaPoListPartyCodeCache = '';
        gpaApplyPoListToAllDropdowns(true);
        showGpaPartyHint();
        recalcFooter();
        return;
    }
    await loadGpaPoListForGrid(code);
    if (!isGpaFillGridChecked()) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        gpaApplyPoListToAllDropdowns(true);
        recalcFooter();
        return;
    }
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(code);
        const billRows = normalizeApiRows(result);
        gpaPoListCache = gpaMergePoListRows(gpaPoListCache, gpaExtractPoListFromBillRows(billRows));
        await fillBillGridFromDetailRows(billRows);
        gpaApplyPoListToAllDropdowns(false);
        if (billRows.length === 0) {
            showToast('No pending bills for this employee.', 'info');
        }
    } catch (e) {
        console.error('Failed to load bill details for employee:', e);
        showGpaPartyHint();
        showToast('Could not load bill details for employee.', 'error');
    }
    recalcFooter();
}

function onGpaPartyEmployeeModeChange() {
    syncGpaPartyEmployeeUI();
    if (editMode) {
        recalcFooter();
        return;
    }
    clearBillRows();
    gpaPoListCache = [];
    gpaPoListPartyCodeCache = '';
    gpaRefreshAllBillRowPoDropdowns(false);
    gpaRefreshAddBillModalPoDropdown(false);
    showGpaPartyHint();
    recalcFooter();
}

function collectPayload() {
    const masterCode = parseInt(document.getElementById('hdnGRNPaymentMasterCode')?.value ?? '0', 10) || 0;
    const entryNoRaw = document.getElementById('txtEntryNo')?.value?.trim() ?? '';
    const entryNo = parseInt(entryNoRaw, 10) || 0;
    const entryDateStr = document.getElementById('dtPaymentDate')?.value ?? '';
    const bankType = parseInt(document.getElementById('ddlPaymentMode')?.value ?? '0', 10) || 0;

    const bankMasterCode = gpaBsEmbedLockedBankCode > 0
        ? gpaBsEmbedLockedBankCode
        : (parseInt(document.getElementById('ddlBankName')?.value ?? '0', 10) || 0);
    let headerAmountNum = gpaNumOrZero(parseNum(document.getElementById('txtHeaderAmount')));
    if (gpaBsEmbedLockedAmount != null && gpaBsEmbedLockedAmount > 0) {
        headerAmountNum = gpaNumOrZero(gpaBsEmbedLockedAmount);
    }
    const bankNameForSave = (gpaBsEmbedLockedBankCode > 0 && gpaBsEmbedLockedBankName)
        ? gpaBsEmbedLockedBankName.trim()
        : gpaGetSelectedBankNameForSave();
    /* TY_GRNPaymentMaster — must match API (no VendorMaster / F_Marketing / string MarketingMan / master Project). */
    const GRNPaymentMaster = [{
        Code: masterCode,
        EntryNo: entryNo,
        RefNo: document.getElementById('txtRefNo')?.value?.trim() ?? '',
        EntryDate: entryDateStr ? entryDateStr : null,
        AccountMaster_Code: gpaNumOrZero(gpaTyGrnPaymentMasterAccountMasterCode()),
        F_BankPaymentTypeMaster_Code: gpaNumOrZero(bankType),
        BankMaster_Code: gpaNumOrZero(bankMasterCode),
        BankName: bankNameForSave,
        Amount: headerAmountNum,
        AdvanceAmount: gpaNumOrZero(parseNum(document.getElementById('txtFooterAdvance'))),
        Narration: document.getElementById('txtNarration')?.value?.trim() ?? '',
        MarketingManMaster_Code: gpaNumOrZero(gpaTyGrnPaymentMasterMarketingManMasterCode()),
        PaymentFor: gpaPaymentForForSave(),
    }];

    const GRNPaymentDetails = [];
    const employeeMode = !isGpaPartyMode();
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        const dCode = parseInt(tr.querySelector('.inp-detail-code')?.value ?? '0', 10) || 0;
        const projCode = gpaDdlIntCode(tr.querySelector('.inp-project-ddl'));
        const subCode = gpaDdlIntCode(tr.querySelector('.inp-subproject-ddl'));
        const eff = gpaLineEffectivePayment(tr);
        const poSel = tr.querySelector('.inp-po-ddl');
        const catSel = tr.querySelector('.inp-category-ddl');
        const poNo = gpaPoNoFromSelect(poSel);
        const poCode = gpaPoCodeFromSelect(poSel);
        const catName = gpaCategoryNameFromSelect(catSel);
        const catCode = gpaCatCodeFromSelect(catSel);
        const pushDetail = (mrnCode, amt) => {
            GRNPaymentDetails.push({
                Code: dCode,
                GRNPaymentMaster_Code: masterCode,
                MRNMaster_Code: mrnCode,
                PaymentAmount: gpaNumOrZero(amt),
                ProjectMaster_Code: projCode,
                SubProjectMaster_Code: subCode,
                PONo: poNo,
                CategoryName: catName,
                PurchaseOrderMaster_Code: poCode,
                ProjectCategory_Code: catCode,
            });
        };
        if (mrn > 0) {
            pushDetail(mrn, parseNum(tr.querySelector('.inp-payment')));
            return;
        }
        if (eff <= 0) return;
        if (employeeMode) {
            pushDetail(0, eff);
            return;
        }
        const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
        if (billNo) {
            pushDetail(0, eff);
            return;
        }
        if (gpaIsPartyCase2Line(tr) || gpaIsPartyCase3PaymentOnlyLine(tr)) {
            pushDetail(0, eff);
        }
    });

    /* TY_GRNPaymentMaster[] + TY_GRNPaymentDetails[] — Project/SubProject on details only. */
    return { GRNPaymentMaster, GRNPaymentDetails };
}

function firstMasterFromApi(root) {
    if (!root || typeof root !== 'object') return null;
    const vw = root.VW_GRNPaymentMaster ?? root.vw_GRNPaymentMaster ?? root;
    const list = vw?.GRNPaymentMaster ?? vw?.grnPaymentMaster
        ?? root?.GRNPaymentMaster ?? root?.grnPaymentMaster;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    // Flat master object on VW (no inner GRNPaymentMaster array)
    if (vw !== root && (vw.Code !== undefined || vw.code !== undefined || vw.EntryNo !== undefined || vw.entryNo !== undefined
        || vw.AccountMaster_Code !== undefined || vw.accountMaster_Code !== undefined)) {
        return vw;
    }
    const hasSiblingDetails =
        root.GRNPaymentDetails ?? root.grnPaymentDetails
        ?? root.GRNPaymentMaster ?? root.grnPaymentMaster;
    if ((root.Code !== undefined || root.code !== undefined || root.EntryNo !== undefined || root.entryNo !== undefined
        || root.AccountMaster_Code !== undefined || root.accountMaster_Code !== undefined)
        && !hasSiblingDetails) {
        return root;
    }
    return null;
}

async function loadGRNPaymentApprovalByCode(Code) {
    const codeNum = parseInt(Code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    try {
        gpaClearBizsolBankStmtEmbedLocks();
        await loadVendorList();
        await loadEmployeeList();
        await loadBankPaymentList();
        await loadGpaBankMasterList();
        await Promise.all([loadGpaProjectListForGrid(), loadGpaProjectCategoryLists()]);
        const res = await GRNPaymentApprovalService.GetGRNPaymentApprovalByCode(codeNum);
        const root = peelGrnPaymentApiRoot(res);
        const master = firstMasterFromApi(root);
        const details = extractGRNPaymentDetailsArray(root, master);

        if (!master && details.length === 0) {
            showToast('Record not found.', 'warning');
            return;
        }

        editMode = true;
        const h = document.getElementById('hdnGRNPaymentMasterCode');
        if (h) h.value = String(master?.Code ?? master?.code ?? codeNum);
        const fgChk = document.getElementById('chkGpaFillGrid');
        if (fgChk) fgChk.checked = false;

        const en = master?.EntryNo ?? master?.entryNo;
        const txtEn = document.getElementById('txtEntryNo');
        if (txtEn) txtEn.value = en !== undefined && en !== null ? String(en) : '';
        updateFloatBarEntryNo();

        const ed = master?.EntryDate ?? master?.entryDate ?? master?.PaymentDate ?? master?.paymentDate;
        const dt = document.getElementById('dtPaymentDate');
        if (dt) dt.value = ed ? formatDateInput(ed) : '';

        const isEmpPayment = gpaMasterIsEmployeePayment(master);
        const chkPayToParty = document.getElementById('chkGpaPayToParty');
        if (chkPayToParty) chkPayToParty.checked = !isEmpPayment;
        syncGpaPartyEmployeeUI();

        if (isEmpPayment) {
            const ddlParty = document.getElementById('ddlPartyName');
            if (ddlParty) ddlParty.value = '';
            const ddlEmp = document.getElementById('ddlEmployeeName');
            const empCode = master?.MarketingManMaster_Code ?? master?.marketingManMaster_Code
                ?? master?.F_MarketingManMaster_Code ?? master?.f_MarketingManMaster_Code;
            const empName = String(
                master?.MarketingManMaster ?? master?.marketingManMaster ?? master?.Employee ?? master?.employee ?? ''
            ).trim();
            if (ddlEmp) {
                let matched = false;
                const codeStr = empCode !== undefined && empCode !== null && `${empCode}`.trim() !== ''
                    ? String(empCode).trim()
                    : '';
                if (codeStr) {
                    for (let i = 0; i < ddlEmp.options.length; i++) {
                        const opt = ddlEmp.options[i];
                        if (opt.value === codeStr) {
                            ddlEmp.value = codeStr;
                            matched = true;
                            break;
                        }
                    }
                }
                if (!matched && empName) {
                    const hit = [...ddlEmp.options].find(o => String(o.text).trim() === empName);
                    if (hit) {
                        ddlEmp.value = hit.value;
                        matched = true;
                    }
                }
            }
        } else {
            const party = master?.AccountMaster_Code ?? master?.accountMaster_Code
                ?? master?.VendorMaster_Code ?? master?.vendorMaster_Code;
            const ddlParty = document.getElementById('ddlPartyName');
            if (ddlParty && party !== undefined && party !== null) {
                const pv = String(party);
                let matched = false;
                for (let i = 0; i < ddlParty.options.length; i++) {
                    const opt = ddlParty.options[i];
                    if (opt.value === pv) {
                        ddlParty.value = pv;
                        matched = true;
                        break;
                    }
                    if (opt.dataset.accountCode === pv) {
                        ddlParty.value = opt.value;
                        matched = true;
                        break;
                    }
                }
                if (!matched) ddlParty.value = pv;
            }
            const ddlEmp = document.getElementById('ddlEmployeeName');
            if (ddlEmp) ddlEmp.value = '';
        }

        const bank = master?.F_BankPaymentTypeMaster_Code ?? master?.f_BankPaymentTypeMaster_Code;
        const ddlBank = document.getElementById('ddlPaymentMode');
        if (ddlBank && bank !== undefined && bank !== null) ddlBank.value = String(bank);
        syncRefNoRequiredUI();

        const ddlBankName = document.getElementById('ddlBankName');
        if (ddlBankName) {
            const bcRaw = master.BankMaster_Code ?? master.bankMaster_Code ?? master.Bank_Code ?? master.bank_Code ?? '';
            const bcStr = bcRaw !== '' && bcRaw !== null && bcRaw !== undefined ? String(bcRaw).trim() : '';
            const bName = String(master.BankName ?? master.bankName ?? '').trim();
            if (bcStr) {
                let hasOpt = false;
                for (let i = 0; i < ddlBankName.options.length; i++) {
                    if (ddlBankName.options[i].value === bcStr) { hasOpt = true; break; }
                }
                if (!hasOpt) ddlBankName.add(new Option(bName || ('Bank #' + bcStr), bcStr));
            }
            ddlBankName.value = bcStr || '';
        }

        const ref = document.getElementById('txtRefNo');
        if (ref) ref.value = master?.RefNo ?? master?.refNo ?? '';

        const ha = document.getElementById('txtHeaderAmount');
        if (ha) {
            const amt = master?.Amount ?? master?.amount;
            ha.value = amt !== undefined && amt !== null ? String(amt) : '';
        }

        const nar = document.getElementById('txtNarration');
        if (nar) nar.value = master?.Narration ?? master?.narration ?? '';
        gpaBindPaymentForOnMaster(master);

        hideGpaAddBillModalAndReset();

        const counterpartyForBills = isEmpPayment
            ? (document.getElementById('ddlEmployeeName')?.value?.trim() ?? '')
            : (document.getElementById('ddlPartyName')?.value?.trim() ?? '');
        await loadGpaPoListForGrid(counterpartyForBills);
        const pendingBillRows = counterpartyForBills ? await fetchPartyPendingBillRows(counterpartyForBills) : [];

        clearBillRows();
        const tbody = document.getElementById('billTbody');
        if (details.length && tbody) {
            for (let i = 0; i < details.length; i++) {
                const d = details[i];
                const merged = mergeEditDetailWithBillLookup(d, pendingBillRows);
                tbody.insertAdjacentHTML('beforeend', billRowTemplate());
                const tr = tbody.querySelector('tr.bill-row:last-child');
                if (tr) await applyBillDetailRow(tr, merged);
            }
        } else {
            addBillRows(DEFAULT_BILL_ROW_COUNT);
        }
        gpaApplyPoListToAllDropdowns(false);
        const advEl = document.getElementById('txtFooterAdvance');
        if (advEl) delete advEl.dataset.advanceManual;
        recalcFooter();
        gpaShowFillGridCheckbox(false);
        syncGpaPartyEmployeeUI();
        await gpaSyncFooterAttachmentFromApis(master, codeNum);
        updateGpaFloatModeBadge('edit');
    } catch (e) {
        showToast('Failed to load Payment Entry.', 'error');
    }
}

function validateGRNPaymentApproval() {
    if (isGpaPartyMode()) {
        const party = document.getElementById('ddlPartyName')?.value;
        if (!party) {
            showToast('Please select Party Name (Vendor).', 'warning');
            return false;
        }
    } else {
        const emp = document.getElementById('ddlEmployeeName')?.value;
        if (!emp) {
            showToast('Please select Employee.', 'warning');
            return false;
        }
    }
    if (!document.getElementById('dtPaymentDate')?.value) {
        showToast('Please enter Date.', 'warning');
        return false;
    }
    const bankMasterCode = gpaBsEmbedLockedBankCode > 0
        ? gpaBsEmbedLockedBankCode
        : (parseInt(document.getElementById('ddlBankName')?.value ?? '0', 10) || 0);
    if (!(bankMasterCode > 0)) {
        showToast('Please select Bank name.', 'warning');
        document.getElementById('ddlBankName')?.focus();
        return false;
    }
    const headerAmtRequired = parseNum(document.getElementById('txtHeaderAmount'));
    if (!(headerAmtRequired > 0)) {
        showToast('Please enter Amount.', 'warning');
        return false;
    }
    if (refNoIsRequiredForCurrentMode()) {
        const ref = document.getElementById('txtRefNo')?.value?.trim() ?? '';
        if (!ref) {
            showToast('Please enter Ref No / CH No for the selected payment mode.', 'warning');
            return false;
        }
    }
    const billRows = document.querySelectorAll('#billTbody tr.bill-row');
    if (!billRows.length) {
        showToast('Bill allocation: add at least one row and fill bill details before save.', 'warning');
        return false;
    }
    recalcFooter();

    if (isGpaPartyMode()) {
        let hasMrnLine = false;
        billRows.forEach(tr => {
            const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
            if (mrn > 0) hasMrnLine = true;
        });

        if (hasMrnLine) {
            let badMrnNoPayParty = false;
            document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
                const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
                const pay = parseNum(tr.querySelector('.inp-payment'));
                if (mrn > 0 && !(pay > 0)) badMrnNoPayParty = true;
            });
            if (badMrnNoPayParty) {
                showToast('Enter Payment amount on each line that has a loaded bill (MRN).', 'warning');
                return false;
            }
        } else {
            let hasPartyBillLine = false;
            document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
                const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
                const billNo = tr.querySelector('.inp-bill-no')?.value?.trim() ?? '';
                if (mrn <= 0 && billNo) hasPartyBillLine = true;
            });
            let hasPartyAlloc = false;
            document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
                if (gpaPartyLineIsIncludedInAllocation(tr) && gpaLineEffectivePayment(tr) > 0) hasPartyAlloc = true;
            });
            if (!hasPartyAlloc && !hasPartyBillLine) {
                showToast(
                    'Bill allocation: load a bill (MRN), or Bill no + payment, or Project + Sub project + amount, or Payment only (no bill/project). Incomplete rows are ignored.',
                    'warning'
                );
                return false;
            }
            if (!hasPartyAlloc) {
                showToast('Enter Payment amount on each line that has Bill no.', 'warning');
                return false;
            }
        }

        const sumPayParty = sumGpaGridPaymentAmounts();
        if (!(sumPayParty > 0)) {
            showToast('Please enter Payment or Payable amount so the grid total is greater than zero.', 'warning');
            return false;
        }
    } else {
        const sumPayEmp = sumGpaGridPaymentAmounts();
        if (!(sumPayEmp > 0)) {
            showToast('Please enter Payable amount or Payment amount in Bill allocation (total must be greater than zero).', 'warning');
            return false;
        }
        let incompleteEmployeeLine = false;
        document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
            const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
            const pj = tr.querySelector('.inp-project-ddl')?.value?.trim() ?? '';
            const sp = tr.querySelector('.inp-subproject-ddl')?.value?.trim() ?? '';
            if (mrn > 0) return;
            if ((pj && !sp) || (!pj && sp)) incompleteEmployeeLine = true;
        });
        if (incompleteEmployeeLine) {
            showToast('Select both Project and Sub project, or clear both.', 'warning');
            return false;
        }
        let badMrnNoPayEmp = false;
        document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
            const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
            const pay = parseNum(tr.querySelector('.inp-payment'));
            if (mrn > 0 && !(pay > 0)) badMrnNoPayEmp = true;
        });
        if (badMrnNoPayEmp) {
            showToast('Enter Payment amount on each line that has a loaded bill (MRN).', 'warning');
            return false;
        }
    }
    let badPayVsPayable = false;
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        if (rowPaymentExceedsPayable(tr)) badPayVsPayable = true;
    });
    if (badPayVsPayable) {
        showToast('Payment amount cannot be greater than payable amount on any line.', 'warning');
        return false;
    }
    const dupIssue = findDuplicateBillAllocationIssue();
    if (dupIssue) {
        showGpaDuplicateBillToast(dupIssue);
        return false;
    }
    const headerAmt = headerAmtRequired;
    const sumPay = sumGpaGridPaymentAmounts();
    const adv = parseNum(document.getElementById('txtFooterAdvance'));
    const allocated = sumPay + adv;
    const EPS = 0.01;
    // Total (grid) + Advance / On account must equal Amount — not more, not less.
    if (sumPay > headerAmt + EPS || adv < -EPS) {
        showToast(
            `Total (${formatMoney(sumPay)}) cannot exceed Amount (${formatMoney(headerAmt)}). Advance / On account cannot be negative.`,
            'warning'
        );
        return false;
    }
    if (allocated > headerAmt + EPS) {
        showToast(
            `Total (${formatMoney(sumPay)}) + Advance / On account (${formatMoney(adv)}) = ${formatMoney(allocated)} must not exceed Amount (${formatMoney(headerAmt)}).`,
            'warning'
        );
        return false;
    }
    if (allocated < headerAmt - EPS) {
        showToast(
            `Total (${formatMoney(sumPay)}) + Advance / On account (${formatMoney(adv)}) = ${formatMoney(allocated)} must equal Amount (${formatMoney(headerAmt)}). Short by ${formatMoney(headerAmt - allocated)}.`,
            'warning'
        );
        return false;
    }
    const p = collectPayload();
    if (!p.GRNPaymentDetails.length) {
        showToast(
            isGpaPartyMode()
                ? 'Add at least one bill line with a valid MRN (and payment if required).'
                : 'Add at least one line with Payment amount (or a bill with MRN).',
            'warning'
        );
        return false;
    }
    return true;
}

function saveGRNPaymentApproval() {
    var ModuleName = "Payment Entry",
        OptionName = editMode ? "Edit" : "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        if (!validateGRNPaymentApproval()) return;
        const payload = collectPayload();
        try {
            const data = await GRNPaymentApprovalService.SaveGRNPaymentApproval(payload);
            const ok = data && (
                data.Status === 'Y' ||
                data.Status === 'y' ||
                data.Status === 'success' ||
                data.success === true ||
                data.Success === true ||
                (parseInt(data.Code ?? data.code ?? 0, 10) || 0) > 0
            );
            if (ok) {
                applyEntryNoFromResponse(data);
                const newMasterCode = parseInt(data.Code ?? data.code ?? 0, 10) || 0;
                const entryDate = document.getElementById('dtPaymentDate')?.value ?? '';
                const entryNo = parseInt(document.getElementById('txtEntryNo')?.value?.trim() ?? '0', 10) || 0;
                if (newMasterCode > 0 && typeof window.FlushPendingAttachments === 'function') {
                    const flush = await window.FlushPendingAttachments(newMasterCode, 'GRNPaymentMaster', entryNo, entryDate);
                    if (flush && flush.failed > 0) {
                        showToast(flush.uploaded + ' attachment(s) uploaded, ' + flush.failed + ' failed.', 'warning');
                    } else if (flush && flush.uploaded > 0) {
                        showToast(flush.uploaded + ' pending attachment(s) uploaded.', 'success');
                    }
                }
                showToast(editMode ? 'Payment entry updated successfully.' : 'Payment entry saved successfully.', 'success');
                const savedWasEdit = editMode;
                updateGpaFloatModeBadge(savedWasEdit ? 'updated' : 'saved');
                editMode = false;
                const bsEmbCode = gpaGetEmbedBankStatementCode();
                if (bsEmbCode > 0 && gpaIsBankStatementEmbed()) {
                    try {
                        window.parent.postMessage({
                            type: 'bizsol:bankStmtGrnSaved',
                            bankStatementCode: bsEmbCode,
                            grnPaymentMasterCode: newMasterCode
                        }, window.location.origin);
                    } catch (pmErr) { /* ignore */ }
                    setTimeout(async () => {
                        await loadGRNPaymentApprovalList();
                        showFormView();
                    }, 500);
                } else {
                    setTimeout(async () => {
                        await loadGRNPaymentApprovalList();
                        showListView();
                    }, 1200);
                }
            } else {
                showToast(data?.Msg ?? data?.msg ?? data?.message ?? 'Save failed.', 'error');
            }
        } catch (e) {
            console.error('saveGRNPaymentApproval', e);
            showToast('Network error. Please try again.', 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════════════════════════════════════
function resetGRNPaymentApprovalForm() {
    gpaClearBizsolBankStmtEmbedLocks();
    const h = document.getElementById('hdnGRNPaymentMasterCode');
    if (h) h.value = '0';
    editMode = false;
    const txtEn = document.getElementById('txtEntryNo');
    if (txtEn) txtEn.value = '';
    updateFloatBarEntryNo();
    const ddl = document.getElementById('ddlPartyName');
    if (ddl) ddl.value = '';
    const emp = document.getElementById('ddlEmployeeName');
    if (emp) emp.value = '';
    const chkParty = document.getElementById('chkGpaPayToParty');
    if (chkParty) chkParty.checked = true;
    syncGpaPartyEmployeeUI();
    const mode = document.getElementById('ddlPaymentMode');
    if (mode) {
        mode.selectedIndex = 0;
        loadBankPaymentList();
    } else {
        syncRefNoRequiredUI();
    }
    const ddlBankName = document.getElementById('ddlBankName');
    if (ddlBankName) ddlBankName.value = '';
    const fg = document.getElementById('chkGpaFillGrid');
    if (fg) fg.checked = true;
    const ref = document.getElementById('txtRefNo');
    if (ref) ref.value = '';
    const ha = document.getElementById('txtHeaderAmount');
    if (ha) ha.value = '';
    const fa = document.getElementById('txtFooterAdvance');
    if (fa) {
        delete fa.dataset.advanceManual;
        fa.value = '0.00';
    }
    const nar = document.getElementById('txtNarration');
    if (nar) nar.value = '';
    const txtPf = document.getElementById('txtPaymentFor');
    if (txtPf) txtPf.value = '';
    const d1 = document.getElementById('dtPaymentDate');
    if (d1) d1.value = '';
    setTodayDates();
    clearBillRows();
    showGpaPartyHint();
    gpaPoListCache = [];
    gpaPoListPartyCodeCache = '';
    recalcFooter();
    hideGpaAddBillModalAndReset();
    if (typeof window.ClearPendingAttachments_AttachmentControl === 'function') {
        window.ClearPendingAttachments_AttachmentControl();
    }
    gpaFormHasAttachmentYes = false;
    syncGpaFooterAttachmentButtonState(0);
    updateGpaFloatModeBadge();
}

// ══════════════════════════════════════════════════════════════════════════════
// ATTACHMENT CONTROL
// ══════════════════════════════════════════════════════════════════════════════
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#GRNPaymentEntry_AttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: masterTableCode,
        DetailTableName: detailTableName,
        DetailTableCode: detailTableCode,
        EntryNo: entryNo,
        EntryDate: entryDate,
        Mode: mode,
        SourceDownloadFileName: sourceDownloadFileName || ''
    });
}

function openGpaAttachmentControl() {
    const masterCode = parseInt(document.getElementById('hdnGRNPaymentMasterCode')?.value ?? '0', 10) || 0;
    const entryNo = parseInt(document.getElementById('txtEntryNo')?.value?.trim() ?? '0', 10) || 0;
    const entryDate = document.getElementById('dtPaymentDate')?.value ?? '';
    // masterCode=0 → temp mode handled generically inside the shared control
    InitAttachmentControl('GRNPaymentMaster', masterCode, '', 0, entryNo, entryDate, 'all', '');
}

function openGpaListAttachmentControl(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        showToast('Invalid record. Cannot open attachments.', 'warning');
        return;
    }
    InitAttachmentControl('GRNPaymentMaster', masterCode, '', 0, parseInt(entryNo, 10) || 0, entryDate || '', 'all', '');
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION (same as GRNService.showToast)
// ══════════════════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const palette = {
        success: { bg: '#10b981', icon: 'fa-check-circle' },
        warning: { bg: '#f59e0b', icon: 'fa-exclamation-triangle' },
        error: { bg: '#ef4444', icon: 'fa-times-circle' },
        info: { bg: '#667eea', icon: 'fa-info-circle' },
    };
    const { bg, icon } = palette[type] || palette.info;
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;top:20px;right:20px;z-index:9999;
        background:${bg};color:#fff;padding:10px 18px;
        border-radius:10px;font-size:0.85rem;font-weight:600;
        box-shadow:0 4px 16px rgba(0,0,0,0.22);
        display:flex;align-items:center;gap:8px;
        animation:fadeSlideIn 0.3s ease both;`;
    toast.innerHTML = `<i class="fa ${icon}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR SYNC (float bar margin)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
    const sidebar = document.getElementById('modern-sidebar');
    const bar = document.getElementById('floatBar');
    if (!sidebar || !bar) return;
    syncFloatBarMargin();
    new MutationObserver(syncFloatBarMargin)
        .observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', syncFloatBarMargin);
})();


function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}

// ─── PAYMENT VOUCHER PRINT (same flow as PurchaseOrderStore PrintPO) ───────────

function gpaEscapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function gpaSessionCompanyInfo() {
    let companyName = '';
    let companyAddr = '';
    let companyGST = '';
    let companyTag = '';
    try {
        const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (ud && ud[0]) {
            companyName = ud[0].CompanyName || ud[0].CompanyNameForShow || '';
            companyAddr = ud[0].CompanyAddress || '';
            companyGST = ud[0].GSTIN || ud[0].CompanyGSTIN || '';
            companyTag = ud[0].BranchName || ud[0].CompanyTagLine || ud[0].TagLine || '';
        }
    } catch (e) { /* optional */ }
    return { companyName, companyAddr, companyGST, companyTag };
}

/** Header block for print: {@link GRNPaymentApprovalService.GetCompany} (fallback session). */
function gpaCompanyFromGetCompanyApi(resp) {
    if (resp == null) {
        return { companyName: '', companyAddr: '', companyGST: '', companyTag: '' };
    }
    let row = null;
    const rows = normalizeApiRows(resp);
    if (rows.length && rows[0]) row = rows[0];
    if (!row) {
        const o = resp.Data ?? resp.data ?? resp;
        if (o && typeof o === 'object' && !Array.isArray(o)) {
            if (o.CompanyName != null || o.companyName != null
                || o.CompanyInfo != null || o.Name != null || o.name != null
                || o.OfficeAddress1 != null || o.officeAddress1 != null
                || o.GSTNo != null || o.gSTNo != null) {
                row = o;
            }
        }
    }
    row = row || {};
    const phone = String(row.OfficePhones1 ?? row.officePhones1 ?? '').trim();
    const web = String(row.WebSite ?? row.webSite ?? row.Website ?? row.website ?? '').trim();
    let tagFromApi = '';
    if (phone && web) tagFromApi = phone + ' · ' + web;
    else tagFromApi = phone || web;
    const branchTag = String(row.BranchName ?? row.branchName ?? row.CompanyTagLine ?? row.TagLine ?? row.tagLine ?? '').trim();
    return {
        companyName: String(row.CompanyName ?? row.companyName ?? row.CompanyInfo ?? row.Name ?? row.name ?? '').trim(),
        companyAddr: String(
            row.OfficeAddress1 ?? row.officeAddress1
            ?? row.CompanyAddress ?? row.companyAddress ?? row.Address ?? row.address ?? ''
        ).trim(),
        companyGST: String(
            row.GSTNo ?? row.gstNo
            ?? row.GSTIN ?? row.gstin ?? row.CompanyGSTIN ?? row.companyGSTIN ?? ''
        ).trim(),
        companyTag: (tagFromApi && branchTag) ? (tagFromApi + ' · ' + branchTag) : (tagFromApi || branchTag),
    };
}

function gpaMergePrintCompanyInfo(sessionCo, apiCo) {
    const a = apiCo || {};
    const s = sessionCo || {};
    return {
        companyName: (a.companyName || s.companyName || '').trim(),
        companyAddr: (a.companyAddr || s.companyAddr || '').trim(),
        companyGST: (a.companyGST || s.companyGST || '').trim(),
        companyTag: (a.companyTag || s.companyTag || '').trim(),
    };
}

function gpaPreferNonEmptyListRow(base, prefer) {
    if (!base && !prefer) return null;
    if (!base) return prefer;
    if (!prefer) return base;
    const out = Object.assign({}, base);
    Object.keys(prefer).forEach(function (k) {
        const v = prefer[k];
        if (v === undefined || v === null) return;
        if (typeof v === 'string' && v.trim() === '') return;
        out[k] = v;
    });
    return out;
}

/** Match DDL_LIST row: Code / GRNPaymentMaster_Code, else EntryNo (backend list may omit Code). */
function gpaListRowPkForPrint(r) {
    const c = r.Code ?? r.code ?? r.GRNPaymentMaster_Code ?? r.gRNPaymentMaster_Code
        ?? r.grnPaymentMaster_Code;
    if (c === undefined || c === null || String(c).trim() === '') return NaN;
    return parseInt(String(c), 10);
}

function gpaFindAllListRowsForPrint(listResp, codeNum, master) {
    const rows = normalizeApiRows(listResp);
    if (!rows.length) return [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
        if (gpaListRowPkForPrint(rows[i]) === codeNum) out.push(rows[i]);
    }
    if (!out.length && master) {
        const enMaster = master.EntryNo ?? master.entryNo;
        if (enMaster !== undefined && enMaster !== null && String(enMaster).trim() !== '') {
            const enStr = String(enMaster).trim();
            for (let j = 0; j < rows.length; j++) {
                const en = rows[j].EntryNo ?? rows[j].entryNo;
                if (en !== undefined && en !== null && String(en).trim() === enStr) out.push(rows[j]);
            }
        }
    }
    return out;
}

function gpaFindListRowForPrint(listResp, codeNum, master) {
    const all = gpaFindAllListRowsForPrint(listResp, codeNum, master);
    return all.length ? all[0] : null;
}

/** Prefer non-empty scalar fields from {@link GRNPaymentApprovalService.GetGRNPaymentApprovalList} row over GetByCode master. */
function gpaOverlayMasterFromListRow(master, listRow) {
    if (!master || !listRow) return master;
    const m = Object.assign({}, master);
    const isEmp = gpaMasterIsEmployeePayment(m) || gpaMasterIsEmployeePayment(listRow);
    function setIf(targetKey, altKeys) {
        for (let i = 0; i < altKeys.length; i++) {
            const v = listRow[altKeys[i]];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                m[targetKey] = v;
                return;
            }
        }
    }
    setIf('MarketingManMaster', ['Employee', 'employee', 'EmployeeName', 'employeeName', 'MarketingManMaster', 'marketingManMaster', 'MarketingManName', 'marketingManName']);
    setIf('MarketingManMaster_Code', ['MarketingManMaster_Code', 'marketingManMaster_Code', 'F_MarketingManMaster_Code', 'f_MarketingManMaster_Code', 'MarketingMan_Code', 'marketingMan_Code']);
    setIf('Employee', ['Employee', 'employee', 'EmployeeName', 'employeeName', 'MarketingManMaster', 'marketingManMaster']);
    setIf('EmployeeName', ['EmployeeName', 'employeeName', 'Employee', 'employee', 'MarketingManMaster', 'marketingManMaster']);
    if (!isEmp) {
        setIf('VendorName', ['PartyName', 'VendorName', 'partyName', 'AccountName', 'party', 'Party', 'Party Name']);
    }
    setIf('RefNo', ['RefNo', 'refNo']);
    setIf('EntryNo', ['EntryNo', 'entryNo']);
    setIf('EntryDate', ['EntryDate', 'entryDate', 'PaymentDate', 'paymentDate']);
    setIf('Amount', ['Amount', 'amount', 'HeaderAmount', 'headerAmount', 'PaymentAmount', 'paymentAmount']);
    setIf('PaymentAmount', ['PaymentAmount', 'paymentAmount', 'Payment Amount']);
    setIf('BankName', ['BankName', 'bankName']);
    setIf('Narration', ['Narration', 'narration']);
    setIf('AdvanceAmount', ['AdvanceAmount', 'advanceAmount']);
    setIf('F_BankPaymentTypeMaster_Code', ['F_BankPaymentTypeMaster_Code', 'f_BankPaymentTypeMaster_Code']);
    setIf('AccountMaster_Code', ['AccountMaster_Code', 'accountMaster_Code']);
    setIf('VendorMaster_Code', ['VendorMaster_Code', 'vendorMaster_Code']);
    setIf('PONo', ['PONo', 'pONo', 'PoNO', 'PO_No', 'poNo', 'PurchaseOrderNo', 'purchaseOrderNo']);
    setIf('PODate', ['PODate', 'pODate', 'PO_Date', 'poDate', 'PurchaseOrderDate', 'purchaseOrderDate']);
    setIf('PurchaseOrderMaster_Code', ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code', 'PO_Code', 'po_Code']);
    setIf('CategoryName', ['CategoryName', 'categoryName', 'ProjectCategoryName', 'projectCategoryName']);
    setIf('ProjectCategory_Code', ['ProjectCategory_Code', 'projectCategory_Code', 'Category_Code', 'category_Code']);
    setIf('Status', ['Status', 'status', 'ApprovalStatus', 'approvalStatus', 'Approval_Status']);
    setIf('LevelDetails', ['LevelDetails', 'levelDetails']);
    setIf('TotalLevels', ['TotalLevels', 'totalLevels', 'MaxLevel', 'maxLevel']);
    setIf('CurrentLevelNo', ['CurrentLevelNo', 'currentLevelNo', 'CurrentLevel', 'currentLevel']);
    if (listRow && normalizeGpaListStatusCode(listRow) === 'P' && normalizeGpaListStatusCode(m) !== 'P') {
        m.Status = listRow.Status ?? listRow.status ?? listRow.ApprovalStatus ?? listRow.approvalStatus ?? 'Completed';
    }
    return m;
}

/** Employee name for print preview — master, list row, or MarketingManMaster cache. */
function gpaLookupEmployeeNameForPrint(master, listRow) {
    function pickName(obj) {
        if (!obj || typeof obj !== 'object') return '';
        return String(
            obj.EmployeeName ?? obj.employeeName
            ?? obj.MarketingManMaster ?? obj.marketingManMaster
            ?? obj.Employee ?? obj.employee
            ?? obj.MarketingManName ?? obj.marketingManName
            ?? obj['Party Name'] ?? obj.PartyName ?? obj.Party ?? ''
        ).trim();
    }
    let name = pickName(master);
    if (name) return name;
    name = pickName(listRow);
    if (name) return name;
    const mc = master?.MarketingManMaster_Code ?? master?.marketingManMaster_Code
        ?? master?.F_MarketingManMaster_Code ?? master?.f_MarketingManMaster_Code
        ?? listRow?.MarketingManMaster_Code ?? listRow?.marketingManMaster_Code;
    const list = gpaEmployeeListCache || [];
    for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const c = e.MarketingManMaster_Code ?? e.marketingManMaster_Code ?? e.Code ?? e.code;
        if (mc != null && `${c}` === `${mc}`) {
            return String(
                e.Name ?? e.name ?? e.MarketingManName ?? e.marketingManName
                ?? e.EmployeeName ?? e.employeeName ?? ''
            ).trim();
        }
    }
    return '';
}

/** Party payment vs employee payment — drives Credit to / Vendor Type on voucher print. */
function gpaResolvePrintCreditAndVendorType(master, listRow, siteBundle) {
    const isEmp = gpaMasterIsEmployeePayment(master) || gpaMasterIsEmployeePayment(listRow);
    let vendorType = String(siteBundle?.vendorType || '').trim();
    if (isEmp) {
        let creditTo = gpaLookupEmployeeNameForPrint(master, listRow);
        if (!creditTo && listRow) {
            creditTo = String(
                listRow.EmployeeName ?? listRow.employeeName
                ?? listRow.Employee ?? listRow.employee
                ?? listRow.MarketingManMaster ?? listRow.marketingManMaster
                ?? listRow['Party Name'] ?? listRow.PartyName ?? listRow.Party ?? ''
            ).trim();
        }
        return { creditTo: creditTo || '', vendorType: 'Employee' };
    }
    let creditTo = String(master?.VendorName ?? master?.vendorName ?? '').trim();
    if (!creditTo) creditTo = gpaLookupVendorName(master);
    if (!creditTo && listRow) {
        const p = listRow.PartyName ?? listRow.VendorName ?? listRow.AccountName
            ?? listRow.partyName ?? listRow.Party ?? '';
        if (p) creditTo = String(p).trim();
    }
    if (!creditTo && Array.isArray(gpaListFullRows)) {
        const codeNum = parseInt(master?.Code ?? master?.code ?? 0, 10);
        const hit = gpaListFullRows.find(function (r) { return r.Code == codeNum; });
        if (hit && hit['Party Name']) creditTo = String(hit['Party Name']).trim();
    }
    /* Party-wise payment: Vendor Type = Party (not bill/industry type from site bundle). */
    return { creditTo: creditTo || '', vendorType: 'Party' };
}

function gpaNumberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoD(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeD(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
        return twoD(n);
    }
    let n = Math.floor(Math.abs(amount));
    if (n === 0) return 'Zero Rupees Only';
    let w = '';
    if (n >= 10000000) { w += threeD(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000) { w += twoD(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000) { w += twoD(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100) { w += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n > 0) { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

function gpaFormatIndianCurrency(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return formatted + '.' + decPart;
}

function gpaLookupVendorName(master) {
    const vCode = master?.VendorMaster_Code ?? master?.vendorMaster_Code;
    const accCode = master?.AccountMaster_Code ?? master?.accountMaster_Code;
    const list = gpaVendorListCache || [];
    for (let i = 0; i < list.length; i++) {
        const v = list[i];
        const vc = v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code;
        const ac = v.AccountMaster_Code ?? v.accountMaster_Code;
        if (vCode != null && `${vc}` === `${vCode}`) {
            return v.VendorName ?? v.vendorName ?? v.Name ?? '';
        }
        if (accCode != null && ac != null && `${ac}` === `${accCode}`) {
            return v.VendorName ?? v.vendorName ?? v.Name ?? '';
        }
    }
    return '';
}

function gpaLookupBankPaymentLabel(code) {
    if (code === undefined || code === null || `${code}`.trim() === '') return '';
    const list = gpaBankPaymentListCache || [];
    for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const c = row.F_BankPaymentTypeMaster_Code ?? row.f_BankPaymentTypeMaster_Code
            ?? row.Code ?? row.code;
        if (`${c}` === `${code}`) {
            return row.BankPaymentTypeName ?? row.bankPaymentTypeName
                ?? row.BankPaymentType ?? row.bankPaymentType
                ?? row.Description ?? row.description
                ?? row.Name ?? row.name ?? '';
        }
    }
    return '';
}

function gpaPickPoDateFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    const d = (pom && typeof pom === 'object'
        ? (pom.PODate ?? pom.pODate ?? pom.PO_Date ?? pom.poDate ?? pom.PurchaseOrderDate ?? '')
        : '')
        || (r.PODate ?? r.pODate ?? r.PO_Date ?? r.poDate ?? r.PurchaseOrderDate ?? r.purchaseOrderDate ?? '');
    return d !== undefined && d !== null && `${d}`.trim() !== '' ? String(d).trim() : '';
}

function gpaFindCachedListRowForPrint(codeNum) {
    const all = gpaFindAllCachedListRowsForPrint(codeNum);
    return all.length ? all[0] : null;
}

function gpaFindAllCachedListRowsForPrint(codeNum) {
    if (!Number.isFinite(codeNum) || codeNum <= 0) return [];
    const out = [];
    if (Array.isArray(gpaListSourceRows)) {
        for (let i = 0; i < gpaListSourceRows.length; i++) {
            const r = gpaListSourceRows[i];
            if (gpaListRowPkForPrint(r) === codeNum) out.push(r);
        }
    }
    if (!out.length && Array.isArray(gpaListFullRows)) {
        for (let j = 0; j < gpaListFullRows.length; j++) {
            const row = gpaListFullRows[j];
            if (parseInt(row.Code, 10) === codeNum && row._gpaRaw) out.push(row._gpaRaw);
        }
    }
    return out;
}

function gpaBuildPrintDetailsFromListRows(listRows) {
    if (!Array.isArray(listRows) || !listRows.length) return [];
    const out = [];
    for (let i = 0; i < listRows.length; i++) {
        const synth = gpaDetailRowFromCombinedRecord(listRows[i]);
        if (synth) out.push(gpaEnrichDetailRowPoCategory(synth));
    }
    return out;
}

function gpaLookupPaymentModeTextFromRow(row) {
    if (!row || typeof row !== 'object') return '';
    const raw = String(
        row.PaymentMode ?? row.paymentMode ?? row.PaymentModeName ?? row.paymentModeName ?? ''
    ).trim();
    if (!raw) return '';
    const u = raw.toUpperCase();
    if (u === 'CH' || u === 'CHEQUE') return 'Cheque';
    if (u === 'DD') return 'DD';
    if (u === 'CASH') return 'Cash';
    if (u === 'NEFT') return 'NEFT';
    if (u === 'RTGS') return 'RTGS';
    return raw;
}

function gpaPickPoFromMergedRows(rows, master, listRow) {
    let poNo = '';
    let poDate = '';
    const sources = [];
    if (Array.isArray(rows)) sources.push.apply(sources, rows);
    if (listRow && typeof listRow === 'object') sources.push(listRow);
    if (master && typeof master === 'object') sources.push(master);
    for (let i = 0; i < sources.length; i++) {
        const r = gpaEnrichDetailRowPoCategory(sources[i]);
        const p = gpaResolvePoNoTextFromRow(r);
        const d = gpaPickPoDateFromRecord(r);
        if (p || d) {
            poNo = p ? String(p) : poNo;
            poDate = d ? String(d) : poDate;
            if (poNo && poDate) break;
        }
    }
    return { poNo, poDate };
}

function gpaPickSiteBundleFromRow(r) {
    if (!r || typeof r !== 'object') {
        return { project: '', site: '', siteType: '', vendorType: '', contact: '' };
    }
    return {
        project: r.ProjectDesp ?? r.projectDesp ?? r.ProjectName ?? r.projectName ?? r.Project ?? '',
        site: r.SiteName ?? r.siteName ?? r.SiteDesp ?? r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProject ?? '',
        siteType: r.SiteType ?? r.siteType ?? r.SiteTypeName ?? '',
        vendorType: r.VendorType ?? r.vendorType ?? r.PartyType
            ?? r.IndustryType ?? r.industryType ?? '',
        contact: r.ContactNo ?? r.contactNo ?? r.Mobile ?? r.mobile ?? r.Phone ?? r.phone
            ?? r.PhoneNo ?? r.phoneNo ?? '',
    };
}

/** Prefer detail-row site fields; fill blanks from DDL_LIST row (ProjectDesp, SubProjectDesp, etc.). */
function gpaMergeSiteBundlesForPrint(fromDetails, fromList) {
    const a = fromDetails || { project: '', site: '', siteType: '', vendorType: '', contact: '' };
    const b = fromList || { project: '', site: '', siteType: '', vendorType: '', contact: '' };
    return {
        project: a.project || b.project || '',
        site: a.site || b.site || '',
        siteType: a.siteType || b.siteType || '',
        vendorType: a.vendorType || b.vendorType || '',
        contact: a.contact || b.contact || '',
    };
}

function gpaPrintAssetBaseUrl() {
    return (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
}

/** Fixed PPPL stamps — 260500110152_03 (Made By), 260500110152_02 (Approved By); Completed only. */
function gpaPrintFixedStampUrls() {
    const base = gpaPrintAssetBaseUrl();
    return {
        madeBy: base + 'assets/images/260500110152_03.jpeg',
        approvedBy: base + 'assets/images/260500110152_02.jpeg',
        madeByFallback: base + 'assets/images/PPPL_Stamp_Finance.jpeg',
        approvedByFallback: base + 'assets/images/PPPL_Stamp_HOD.jpeg',
    };
}

function gpaPrintStampImgHtml(src, fallback, alt) {
    const s = String(src || '');
    const f = String(fallback || '');
    let tag = '<img class="pv-sig-stamp" src="' + s + '" alt="' + gpaEscapeHtml(alt) + '"';
    if (f) tag += ' data-fallback="' + f + '"';
    return tag + '>';
}

function gpaPrintStampFallbackScript() {
    return '<script>'
        + 'document.querySelectorAll(".pv-sig-stamp[data-fallback]").forEach(function(img){'
        + 'img.addEventListener("error",function(){'
        + 'var fb=img.getAttribute("data-fallback");'
        + 'if(fb&&img.src!==fb){img.src=fb;img.removeAttribute("data-fallback");}'
        + 'else{img.style.display="none";}'
        + '});'
        + '});'
        + '<\/script>';
}

/** Approved / complete — PO, payment amount and signature stamps below header only then. */
function gpaIsPrintVoucherComplete(master, listRow, listRows) {
    function rowIsComplete(row) {
        return !!(row && typeof row === 'object' && normalizeGpaListStatusCode(row) === 'P');
    }
    if (rowIsComplete(listRow)) return true;
    if (rowIsComplete(master)) return true;
    if (Array.isArray(listRows)) {
        for (let i = 0; i < listRows.length; i++) {
            if (rowIsComplete(listRows[i])) return true;
        }
    }

    const codeNum = parseInt(
        (listRow && (listRow.Code ?? listRow.code))
        ?? (master && (master.Code ?? master.code))
        ?? 0,
        10,
    );
    if (Number.isFinite(codeNum) && codeNum > 0 && Array.isArray(gpaListFullRows)) {
        for (let i = 0; i < gpaListFullRows.length; i++) {
            const cached = gpaListFullRows[i];
            if (parseInt(cached.Code, 10) === codeNum && cached.StatusCode === 'P') return true;
        }
    }

    if (typeof window.getApprovalStatus === 'function') {
        const sources = [listRow, master].concat(Array.isArray(listRows) ? listRows : []);
        for (let j = 0; j < sources.length; j++) {
            const st = String(window.getApprovalStatus(sources[j] || {})).toLowerCase();
            if (st === 'approved' || st === 'completed' || st === 'complete') return true;
        }
    }

    return false;
}

/** PPPL company logo — always on voucher header (Pending + Completed). */
function gpaPrintShowPpplLogo(companyName) {
    const n = String(companyName || '').trim().toUpperCase();
    return n === 'PURSHOTAM PROFILES PVT.LTD.' || n.indexOf('PURSHOTAM PROFILES') === 0;
}

function PrintGRNPaymentFromList(code, mode) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid payment entry.');
        return;
    }
    const listRaw = gpaFindCachedListRowForPrint(codeNum);
    PrintGRNPaymentVoucher(codeNum, mode || 'preview', listRaw);
}

function PrintGRNPaymentVoucher(code, mode, approvalListRow) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid payment entry.');
        return;
    }
    const approvalCtx = approvalListRow && typeof approvalListRow === 'object' ? approvalListRow : null;
    Promise.all([
        GRNPaymentApprovalService.GetGRNPaymentApprovalByCode(codeNum),
        GRNPaymentApprovalService.GetCompany().catch(function () { return null; }),
        GRNPaymentApprovalService.GetGRNPaymentApprovalList().catch(function () { return null; }),
    ]).then(async function (results) {
        const res = results[0];
        const companyApi = results[1];
        const listApi = results[2];
        const root = peelGrnPaymentApiRoot(res);
        let master = firstMasterFromApi(root);
        let details = extractGRNPaymentDetailsArray(root, master);
        if (!master && approvalCtx) {
            master = Object.assign({}, approvalCtx);
        }
        if (!master) {
            if (typeof toastr !== 'undefined') toastr.error('Payment entry not found.');
            return;
        }

        let listRows = listApi ? gpaFindAllListRowsForPrint(listApi, codeNum, master) : [];
        if (!listRows.length) listRows = gpaFindAllCachedListRowsForPrint(codeNum);
        let listRow = listRows.length ? listRows[0] : null;
        if (approvalCtx) {
            if (listRow) {
                listRow = gpaPreferNonEmptyListRow(approvalCtx, listRow);
                listRows[0] = listRow;
            } else {
                listRow = approvalCtx;
                listRows = [approvalCtx];
            }
        }
        if (approvalCtx) master = gpaOverlayMasterFromListRow(master, approvalCtx);
        if (listRow) master = gpaOverlayMasterFromListRow(master, listRow);

        const partyKey = master.AccountMaster_Code ?? master.accountMaster_Code
            ?? master.VendorMaster_Code ?? master.vendorMaster_Code ?? '';
        let billLookup = [];
        if (partyKey !== undefined && partyKey !== null && `${partyKey}`.trim() !== '') {
            try {
                const br = await GRNPaymentApprovalService.GetBillDetails(String(partyKey));
                billLookup = normalizeApiRows(br);
            } catch (e) {
                console.warn('PrintGRNPaymentVoucher bill lookup', e);
            }
        }

        try {
            await Promise.all([
                loadGpaPoListForGrid(partyKey ? String(partyKey) : ''),
                loadGpaProjectCategoryLists(),
            ]);
        } catch (e) {
            console.warn('PrintGRNPaymentVoucher PO/category lists', e);
        }

        let mergedDetails = (details || []).map(function (d) {
            return gpaEnrichDetailRowPoCategory(mergeEditDetailWithBillLookup(d, billLookup));
        });
        if (!mergedDetails.length && listRows.length) {
            mergedDetails = gpaBuildPrintDetailsFromListRows(listRows);
        }
        if (!mergedDetails.length) {
            const synth = gpaDetailRowFromCombinedRecord(listRow) || gpaDetailRowFromCombinedRecord(master);
            if (synth) mergedDetails = [gpaEnrichDetailRowPoCategory(synth)];
        }

        const sessionCo = gpaSessionCompanyInfo();
        const apiCo = companyApi ? gpaCompanyFromGetCompanyApi(companyApi) : null;
        const { companyName, companyAddr, companyTag } = gpaMergePrintCompanyInfo(sessionCo, apiCo);

        const voucherNo = String(master.EntryNo ?? master.entryNo ?? '').trim();
        const refNo = String(master.RefNo ?? master.refNo ?? '').trim();
        const entryDateRaw = master.EntryDate ?? master.entryDate ?? master.PaymentDate ?? master.paymentDate;
        const voucherDate = formatGpaListDate(entryDateRaw);

        const bankCode = master.F_BankPaymentTypeMaster_Code ?? master.f_BankPaymentTypeMaster_Code;
        let payModeLabel = gpaLookupBankPaymentLabel(bankCode);
        if (!payModeLabel && listRow) payModeLabel = gpaLookupPaymentModeTextFromRow(listRow);
        if (!payModeLabel) payModeLabel = '—';
        const bankNameDisp = String(master.BankName ?? master.bankName ?? '').trim();

        let amt = parseFloat(
            master.Amount ?? master.amount ?? master.PaymentAmount ?? master.paymentAmount ?? 0
        ) || 0;
        if (!amt && listRows.length) {
            let sumPay = 0;
            listRows.forEach(function (lr) {
                sumPay += parseFloat(lr.PaymentAmount ?? lr.paymentAmount ?? lr.Amount ?? lr.amount ?? 0) || 0;
            });
            if (sumPay > 0) amt = sumPay;
        }
        if (!amt && listRow) {
            amt = parseFloat(listRow.PaymentAmount ?? listRow.paymentAmount ?? listRow.Amount ?? listRow.amount ?? 0) || 0;
        }
        const narration = master.Narration ?? master.narration ?? '';
        const advance = parseFloat(master.AdvanceAmount ?? master.advanceAmount ?? 0) || 0;
        const paymentForDisp = gpaResolvePaymentForFromMaster(master);

        const isComplete = gpaIsPrintVoucherComplete(master, listRow, listRows);
        const poPair = gpaPickPoFromMergedRows(mergedDetails, master, listRow);
        const poNoRaw = String(poPair.poNo || '').trim();
        const poNoDisp = poNoRaw === '0' ? '' : poNoRaw;
        const poDateDisp = poPair.poDate ? formatGpaListDate(poPair.poDate) : '';
        const site0 = gpaMergeSiteBundlesForPrint(
            mergedDetails.length ? gpaPickSiteBundleFromRow(mergedDetails[0]) : null,
            listRow ? gpaPickSiteBundleFromRow(listRow) : null,
        );

        const isEmpPrint = gpaMasterIsEmployeePayment(master) || gpaMasterIsEmployeePayment(listRow);
        if (isEmpPrint) {
            try {
                await loadEmployeeList();
            } catch (e) {
                console.warn('PrintGRNPaymentVoucher employee list', e);
            }
        }
        const printParty = gpaResolvePrintCreditAndVendorType(master, listRow, site0);
        const creditTo = printParty.creditTo;
        if (printParty.vendorType) site0.vendorType = printParty.vendorType;

        let detailsLines = '';
        mergedDetails.forEach(function (row, idx) {
            const sb = gpaPickSiteBundleFromRow(row);
            const billNo = row.BillNo ?? row.billNo ?? row.Name ?? row.name ?? '';
            const pay = row.PaymentAmount ?? row.paymentAmount ?? row['Payment Amount'] ?? '';
            const poLine = gpaResolvePoNoTextFromRow(gpaEnrichDetailRowPoCategory(row));
            const catLine = gpaResolveCategoryNameFromRow(row);
            detailsLines += '<div style="margin-bottom:6px;">'
                + '<b>Line ' + (idx + 1) + '</b>'
                + (billNo ? ' &mdash; Bill: ' + gpaEscapeHtml(String(billNo)) : '')
                + (poLine ? ' &mdash; PO: ' + gpaEscapeHtml(String(poLine)) : '')
                + (catLine ? ' &mdash; Category: ' + gpaEscapeHtml(String(catLine)) : '')
                + (pay !== '' && pay != null ? ' &mdash; Paid: &#8377;' + gpaFormatIndianCurrency(pay) : '')
                + (sb.project ? '<br><span>Project: ' + gpaEscapeHtml(String(sb.project)) + '</span>' : '')
                + (sb.site ? '<br><span>Site: ' + gpaEscapeHtml(String(sb.site)) + '</span>' : '')
                + '</div>';
        });
        const amountFiguresBlock = amt > 0.005
            ? ('<div style="margin-top:10px;font-weight:700;">Amount (figures): &#8377; ' + gpaFormatIndianCurrency(amt) + '</div>'
                + '<div style="margin-top:4px;font-size:9pt;">Amount (words): ' + gpaNumberToWords(Math.round(amt)) + '</div>')
            : '';
        const detailsBlock = ''
            + (narration ? '<div style="margin-bottom:8px;"><b>Narration:</b><br>' + gpaEscapeHtml(String(narration)) + '</div>' : '')
            + (detailsLines || '<span style="color:#666;">—</span>')
            + amountFiguresBlock
            + (advance > 0.005 ? '<div style="margin-top:4px;">Advance / adjustment: &#8377; ' + gpaFormatIndianCurrency(advance) + '</div>' : '');

        const _base = gpaPrintAssetBaseUrl();
        const logoUrl = _base + 'assets/images/pppllog.jpeg';
        const stampUrls = gpaPrintFixedStampUrls();
        const showLogo = gpaPrintShowPpplLogo(companyName);

        const css = '@page{size:A4 portrait;margin:10mm 12mm 14mm 12mm;}'
            + '*{box-sizing:border-box;margin:0;padding:0;}'
            + 'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;background:#fff;}'
            + '.no-print{margin-bottom:5mm;}'
            + '@media print{.no-print{display:none!important;}}'
            + '.pv-wrap{max-width:780px;margin:0 auto;border:2px solid #000;padding:12px 14px;}'
            + '.pv-hdr{display:flex;align-items:flex-start;margin-bottom:6px;}'
            + '.pv-hdr-left{display:flex;align-items:center;flex:1;}'
            + '.pv-logo{width:62px;height:62px;object-fit:contain;margin-right:12px;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
            + '.pv-hdr-body{flex:1;text-align:center;}'
            + '.pv-co{text-align:center;font-size:14pt;font-weight:800;margin-bottom:2px;}'
            + '.pv-tag{text-align:center;font-size:8.5pt;margin-bottom:4px;color:#222;}'
            + '.pv-addr{text-align:center;font-size:9pt;margin-bottom:10px;line-height:1.35;}'
            + '.pv-title{text-align:center;font-weight:800;font-size:11pt;border:1px solid #000;padding:5px;margin:10px 0 12px;letter-spacing:0.04em;}'
            + 'table.pv-t{width:100%;border-collapse:collapse;margin-bottom:0;}'
            + 'table.pv-t td{border:1px solid #000;padding:6px 8px;font-size:9.5pt;vertical-align:top;}'
            + 'table.pv-t td.lbl{font-weight:700;width:22%;background:#fafafa;}'
            + '.pv-details{min-height:120px;border:1px solid #000;border-top:none;padding:8px;font-size:9.5pt;}'
            + '.pv-sig{display:flex;margin-top:14px;gap:8px;}'
            + '.pv-sig > div{flex:1;border:1px solid #000;min-height:100px;padding:6px;text-align:center;font-weight:700;font-size:9pt;display:flex;flex-direction:column;justify-content:flex-end;}'
            + '.pv-sig-stamp{width:100px;height:100px;object-fit:contain;display:block;margin:0 auto 4px;opacity:0.88;-webkit-print-color-adjust:exact;print-color-adjust:exact;}';

        const headerBlock = showLogo
            ? ('<div class="pv-hdr"><div class="pv-hdr-left">'
                + '<img class="pv-logo" src="' + logoUrl + '" alt="Logo">'
                + '<div class="pv-hdr-body">'
                + '<div class="pv-co">' + gpaEscapeHtml(companyName || 'Company Name') + '</div>'
                + (companyTag ? '<div class="pv-tag">' + gpaEscapeHtml(companyTag) + '</div>' : '')
                + (companyAddr ? '<div class="pv-addr">Address: ' + gpaEscapeHtml(companyAddr) + '</div>' : '')
                + '</div></div></div>')
            : ('<div class="pv-co">' + gpaEscapeHtml(companyName || 'Company Name') + '</div>'
                + (companyTag ? '<div class="pv-tag">' + gpaEscapeHtml(companyTag) + '</div>' : '')
                + (companyAddr ? '<div class="pv-addr">Address: ' + gpaEscapeHtml(companyAddr) + '</div>' : ''));

        const sigMadeBy = isComplete
            ? (gpaPrintStampImgHtml(stampUrls.madeBy, stampUrls.madeByFallback, 'Made By') + 'Made By')
            : 'Made By';
        const sigApproved = isComplete
            ? (gpaPrintStampImgHtml(stampUrls.approvedBy, stampUrls.approvedByFallback, 'Approved By') + 'Approved By')
            : 'Approved By';

        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment Voucher</title><style>' + css + '</style></head><body>'
            + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 8px;">'
            + '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
            + '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
            + '</div>'
            + '<div class="pv-wrap">'
            + headerBlock
            + '<div class="pv-title">Payment Voucher</div>'
            + '<table class="pv-t" role="presentation">'
            + '<tr><td class="lbl">Voucher No</td><td>' + gpaEscapeHtml(voucherNo) + '</td>'
            + '<td class="lbl" style="width:18%;">Voucher Date</td><td style="width:22%;">' + gpaEscapeHtml(voucherDate) + '</td></tr>'
            + '<tr><td class="lbl">Reference No</td><td colspan="3">' + gpaEscapeHtml(refNo) + '</td></tr>'
            + '<tr><td class="lbl">PO No</td><td>' + gpaEscapeHtml(poNoDisp) + '</td>'
            + '<td class="lbl">PO Date</td><td>' + gpaEscapeHtml(poDateDisp) + '</td></tr>'
            + '<tr><td class="lbl">NEFT / Cheque / RTGS</td><td colspan="3">' + gpaEscapeHtml(payModeLabel) + '</td></tr>'
            + (bankNameDisp ? '<tr><td class="lbl">Bank name</td><td colspan="3">' + gpaEscapeHtml(bankNameDisp) + '</td></tr>' : '')
            + '<tr><td class="lbl">Credit to</td><td colspan="3">' + gpaEscapeHtml(creditTo) + '</td></tr>'
            + '<tr><td class="lbl">Project Name</td><td colspan="3">' + gpaEscapeHtml(String(site0.project || '')) + '</td></tr>'
            + '<tr><td class="lbl">Site Name</td><td colspan="3">' + gpaEscapeHtml(String(site0.site || '')) + '</td></tr>'
            + '<tr><td class="lbl">Site Type</td><td colspan="3">' + gpaEscapeHtml(String(site0.siteType || '')) + '</td></tr>'
            + '<tr><td class="lbl">Vendor Type</td><td colspan="3">' + gpaEscapeHtml(String(site0.vendorType || '')) + '</td></tr>'
            + '<tr><td class="lbl">Contact No</td><td colspan="3">' + gpaEscapeHtml(String(site0.contact || '')) + '</td></tr>'
            + '<tr><td class="lbl">Payment for</td><td colspan="3">' + gpaEscapeHtml(paymentForDisp || '—') + '</td></tr>'
            + '</table>'
            + '<div style="border:1px solid #000;border-top:none;padding:4px 8px;font-weight:700;font-size:9.5pt;">Details</div>'
            + '<div class="pv-details">' + detailsBlock + '</div>'
            + '<div class="pv-sig"><div>' + sigMadeBy + '</div><div>' + sigApproved + '</div></div>'
            + gpaPrintStampFallbackScript()
            + '</div></body></html>';

        const win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
        if (!win) {
            if (typeof toastr !== 'undefined') toastr.warning('Please allow popups for this site to use the print feature.');
            return;
        }
        win.document.write(html);
        win.document.close();
        if (mode === 'print') {
            setTimeout(function () { win.focus(); win.print(); }, 600);
        }
    }).catch(function (err) {
        if (typeof toastr !== 'undefined') toastr.error('Error loading payment entry for print.');
        console.error(err);
    });
}

window.viewGRNPaymentEntry = viewGRNPaymentEntry;
window.gpaGetListRowRawByCode = gpaGetListRowRawByCode;
window.InitAttachmentControl = InitAttachmentControl;
window.openGpaAttachmentControl = openGpaAttachmentControl;
window.openGpaListAttachmentControl = openGpaListAttachmentControl;
window.blockNonNumeric = blockNonNumeric;
window.stripNonNumeric = stripNonNumeric;
window.markFooterAdvanceManual = markFooterAdvanceManual;
window.onPartyChange = onPartyChange;
window.onGpaEmployeeChange = onGpaEmployeeChange;
window.onGpaPartyEmployeeModeChange = onGpaPartyEmployeeModeChange;
window.onGpaAddBillModalProjectPick = onGpaAddBillModalProjectPick;
window.onGpaAddBillModalSubPick = onGpaAddBillModalSubPick;
window.syncRefNoRequiredUI = syncRefNoRequiredUI;
window.onGpaFillGridChange = onGpaFillGridChange;
window.onAddBillRowClick = onAddBillRowClick;
window.removeGpaBillRow = removeGpaBillRow;
window.onGpaAddBillModalPartyChange = onGpaAddBillModalPartyChange;
window.onGpaAddBillModalBillChange = onGpaAddBillModalBillChange;
window.onGpaAddBillModalBillAmtInput = onGpaAddBillModalBillAmtInput;
window.saveGpaAddBillModalToGrid = saveGpaAddBillModalToGrid;
window.gpaOnAddBillModalBillNoInput = gpaOnAddBillModalBillNoInput;
window.saveGRNPaymentApproval = saveGRNPaymentApproval;
window.resetGRNPaymentApprovalForm = resetGRNPaymentApprovalForm;
window.newGRNPaymentApproval = newGRNPaymentApproval;
window.cancelGRNPaymentApproval = cancelGRNPaymentApproval;
window.editGRNPaymentApproval = editGRNPaymentApproval;
window.confirmDeleteGRNPaymentApproval = confirmDeleteGRNPaymentApproval;
window.onGpaListStatusTabClick = onGpaListStatusTabClick;
window.toggleGpaListPendingOnMeFilter = toggleGpaListPendingOnMeFilter;
window.applyGpaListPendingOnMeFilter = applyGpaListPendingOnMeFilter;
window.PrintGRNPaymentFromList = PrintGRNPaymentFromList;
window.PrintGRNPaymentVoucher = PrintGRNPaymentVoucher;
window.gpaMasterIsEmployeePayment = gpaMasterIsEmployeePayment;
window.gpaLookupEmployeeNameForPrint = gpaLookupEmployeeNameForPrint;
window.gpaResolvePrintCreditAndVendorType = gpaResolvePrintCreditAndVendorType;
window.gpaPreloadEmployeeListForPrint = async function gpaPreloadEmployeeListForPrint() {
    if (!gpaEmployeeListCache || !gpaEmployeeListCache.length) {
        await loadEmployeeList();
    }
};
window.gpaPeelGrnPaymentApiRoot = peelGrnPaymentApiRoot;
window.gpaFirstMasterFromApi = firstMasterFromApi;
window.gpaExtractGRNPaymentDetails = extractGRNPaymentDetailsArray;
window.gpaOverlayMasterFromListRow = gpaOverlayMasterFromListRow;
window.gpaResolvePoNoTextFromRow = gpaResolvePoNoTextFromRow;
window.gpaEnrichDetailRowPoCategory = gpaEnrichDetailRowPoCategory;
window.gpaPickPoFromMergedRows = gpaPickPoFromMergedRows;
window.gpaFindCachedListRowForPrint = gpaFindCachedListRowForPrint;
window.gpaFindAllCachedListRowsForPrint = gpaFindAllCachedListRowsForPrint;
window.gpaFindAllListRowsForPrint = gpaFindAllListRowsForPrint;
window.gpaIsPrintVoucherComplete = gpaIsPrintVoucherComplete;
window.gpaPrintFixedStampUrls = gpaPrintFixedStampUrls;
window.gpaPrintShowPpplLogo = gpaPrintShowPpplLogo;
window.syncGpaFooterAttachmentButtonState = syncGpaFooterAttachmentButtonState;
window.gpaSyncFooterAttachmentFromApis = gpaSyncFooterAttachmentFromApis;
