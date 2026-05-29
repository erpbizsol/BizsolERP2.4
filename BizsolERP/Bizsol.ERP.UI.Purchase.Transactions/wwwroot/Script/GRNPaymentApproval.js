import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentApprovalService.js';
import { GRNPaymentApprovalService as GRNPaymentEntryDataService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';

let G_PaymentList = [];
let G_CurrentPayment = null;
/** When true, card list shows only entries pending approval on the current user (see paymentIsPendingOnMe). */
let G_OnlyPendingOnMe = false;

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

function InitDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromEl = document.getElementById('gpaFromDate');
    const toEl = document.getElementById('gpaToDate');
    if (toEl && !toEl.value) toEl.value = FmtDateInput(today);

    if (!fromEl || fromEl.value) {
        return Promise.resolve();
    }

    return GRNPaymentApprovalService.GetFirstPendingEntryDate()
        .then(function (result) {
            let dateVal = null;
            if (Array.isArray(result) && result.length > 0) {
                const row = result[0];
                dateVal = row.FirstPendingEntryDate ?? row.firstPendingEntryDate ?? row.Data ?? row.data ?? null;
            } else if (result && result.FirstPendingEntryDate) dateVal = result.FirstPendingEntryDate;
            else if (result && result.Data) dateVal = result.Data;
            else if (result && result.data) dateVal = result.data;
            else if (typeof result === 'string' || result instanceof Date) dateVal = result;

            if (dateVal) {
                const parsed = new Date(dateVal);
                if (!isNaN(parsed.getTime())) {
                    fromEl.value = FmtDateInput(parsed);
                    return;
                }
            }
            fromEl.value = FmtDateInput(firstDay);
        })
        .catch(function () {
            fromEl.value = FmtDateInput(firstDay);
        });
}

function FmtDateInput(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return String(dt.getDate()).padStart(2, '0') + '/' +
        String(dt.getMonth() + 1).padStart(2, '0') + '/' +
        dt.getFullYear();
}

function FmtCurrency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EscHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function GpaEscapeForJs(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        .replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
}

function GpaHasAttachmentYes(p) {
    if (!p) return false;
    const v = p.HasAttach != null ? p.HasAttach
        : p.hasAttach != null ? p.hasAttach
        : p.HasAttachment != null ? p.HasAttachment
        : p['Has Attachment'];
    return String(v || '').trim().toUpperCase() === 'Y';
}

function normalizeListResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.Data)) return data.Data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

function getPaymentMasterCode(p) {
    const c = p.GRNPaymentMaster_Code ?? p.Code ?? p.code ?? p.PaymentMaster_Code;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function getEntryNo(p) {
    return p.EntryNo ?? p['PO No'] ?? p.PONo ?? p['Entry No'] ?? p.Entry_No ?? p.DocNo ?? p.MRNNo ?? '—';
}

function getPartyName(p) {
    return p['Party Name'] ?? p.PartyName ?? p.VendorName ?? p.AccountName ?? p.Vendor ?? '—';
}

function gpaFindApprovalListRow(codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    let row = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === n; });
    if (!row && G_CurrentPayment && getPaymentMasterCode(G_CurrentPayment) === n) {
        row = G_CurrentPayment;
    }
    return row || null;
}

function getEntryDate(p) {
    return p.EntryDate ?? p['PO Date'] ?? p['Entry Date'] ?? p.PaymentDate ?? p.DocDate ?? '';
}

function getTotalAmount(p) {
    const v = p.Amount ?? p['Total Amount'] ?? p.TotalAmount ?? p.NetPayable ?? p.PaymentAmount ?? p['Total Bill Amount'] ?? 0;
    return v;
}

function gpaProjectLabelFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.ProjectDesp ?? r.projectDesp ?? r.ProjectName ?? r.projectName ?? r.Project ?? r.project ?? '';
    if (v === undefined || v === null || `${v}`.trim() === '') {
        const pm = r.ProjectMaster ?? r.projectMaster;
        if (pm !== undefined && pm !== null) {
            if (typeof pm === 'object') {
                v = pm.Name ?? pm.name ?? pm.ProjectDesp ?? pm.projectDesp ?? pm.ProjectName ?? pm.projectName ?? '';
            } else {
                const ps = String(pm).trim();
                if (ps && !/^\d+$/.test(ps)) v = pm;
            }
        }
    }
    return v !== undefined && v !== null ? String(v).trim() : '';
}

function gpaSubProjectLabelFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProjectName ?? r.subProjectName ?? r.SubProject ?? r.subProject ?? '';
    if (v === undefined || v === null || `${v}`.trim() === '') {
        const sm = r.SubProjectMaster ?? r.subProjectMaster;
        if (sm !== undefined && sm !== null) {
            if (typeof sm === 'object') {
                v = sm.Name ?? sm.name ?? sm.SubProjectDesp ?? sm.subProjectDesp ?? sm.SubProjectName ?? sm.subProjectName ?? '';
            } else {
                const ss = String(sm).trim();
                if (ss && !/^\d+$/.test(ss)) v = sm;
            }
        }
    }
    return v !== undefined && v !== null ? String(v).trim() : '';
}

function gpaProjectLabelFromPayment(p) {
    if (!p || typeof p !== 'object') return '';
    let v = p.Project ?? p.ProjectDesp ?? p.projectDesp ?? p.ProjectName ?? p.projectName ?? '';
    if (!`${v}`.trim()) {
        const pm = p.ProjectMaster ?? p.projectMaster;
        if (pm && typeof pm === 'object') {
            v = pm.Name ?? pm.name ?? pm.ProjectDesp ?? pm.projectDesp ?? pm.ProjectName ?? pm.projectName ?? '';
        } else if (pm != null && `${pm}`.trim() !== '' && !/^\d+$/.test(String(pm).trim())) {
            v = pm;
        }
    }
    return `${v ?? ''}`.trim();
}

function gpaSubProjectLabelFromPayment(p) {
    if (!p || typeof p !== 'object') return '';
    let v = p.SubProject ?? p.SubProjectDesp ?? p.subProjectDesp ?? p.SubProjectName ?? p.subProjectName ?? '';
    if (!`${v}`.trim()) {
        const sm = p.SubProjectMaster ?? p.subProjectMaster;
        if (sm && typeof sm === 'object') {
            v = sm.Name ?? sm.name ?? sm.SubProjectDesp ?? sm.subProjectDesp ?? sm.SubProjectName ?? sm.subProjectName ?? '';
        } else if (sm != null && `${sm}`.trim() !== '' && !/^\d+$/.test(String(sm).trim())) {
            v = sm;
        }
    }
    return `${v ?? ''}`.trim();
}

function firstGpaDetailLineFromPayment(p) {
    if (!p) return null;
    const arrs = [p._modalBillLines, p._entryDetailLines, p._detailLines];
    for (let i = 0; i < arrs.length; i++) {
        const arr = arrs[i];
        if (Array.isArray(arr) && arr.length && arr[0] && typeof arr[0] === 'object') return arr[0];
    }
    return null;
}

function getProject(p) {
    if (!p) return '';
    let v = gpaProjectLabelFromPayment(p);
    if (!v) {
        const d = firstGpaDetailLineFromPayment(p);
        if (d) v = gpaProjectLabelFromRow(d);
    }
    return v;
}

function getSubProject(p) {
    if (!p) return '';
    let v = gpaSubProjectLabelFromPayment(p);
    if (!v) {
        const d = firstGpaDetailLineFromPayment(p);
        if (d) v = gpaSubProjectLabelFromRow(d);
    }
    return v;
}

/** Copy Project / Sub Project from merged bill lines onto payment for modal header. */
function enrichPaymentHeaderFromBillLines(payment, lines) {
    if (!payment) return payment;
    if (Array.isArray(lines) && lines.length) {
        payment._modalBillLines = lines;
        const d0 = lines[0];
        const proj = gpaProjectLabelFromRow(d0);
        const sub = gpaSubProjectLabelFromRow(d0);
        if (proj) payment.Project = proj;
        if (sub) payment.SubProject = sub;
    }
    return payment;
}

function getPaymentForDisplay(p) {
    if (!p) return '—';
    const v = p.PaymentFor ?? p.paymentFor ?? p.PaymentForName ?? p.paymentForName ?? '';
    const s = String(v ?? '').trim();
    return s || '—';
}

function peelEntryPaymentApiRoot(res) {
    let root = res?.Data ?? res?.data ?? res;
    if (!root || typeof root !== 'object') return root;
    if (!root.GRNPaymentMaster && !root.grnPaymentMaster && !root.VW_GRNPaymentMaster) {
        const inner = root.Data ?? root.data;
        if (inner && typeof inner === 'object') root = inner;
    }
    return root;
}

function firstEntryPaymentMasterFromRoot(root) {
    if (!root || typeof root !== 'object') return null;
    const vw = root.VW_GRNPaymentMaster ?? root.vw_GRNPaymentMaster;
    const list = root.GRNPaymentMaster ?? root.grnPaymentMaster
        ?? vw?.GRNPaymentMaster ?? vw?.grnPaymentMaster;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    if (vw && typeof vw === 'object' && (vw.EntryNo != null || vw.PaymentFor != null || vw.paymentFor != null)) {
        return vw;
    }
    if (root.EntryNo != null || root.PaymentFor != null || root.paymentFor != null) return root;
    return null;
}

function gpaRowPaymentAmount(r) {
    if (!r || typeof r !== 'object') return null;
    const v = r.PaymentAmount ?? r.paymentAmount ?? r['Payment Amount'] ?? r.PayAmount ?? r.payAmount;
    return v !== undefined && v !== null && `${v}`.trim() !== '' ? v : null;
}

/** Payment Entry GetByCode — same detail extraction as GRNPaymentEntry.js when loaded. */
function normalizeEntryDetailLinesFromApi(entryRes) {
    if (!entryRes) return [];
    if (typeof window.gpaExtractGRNPaymentDetails === 'function') {
        const root = typeof window.gpaPeelGrnPaymentApiRoot === 'function'
            ? window.gpaPeelGrnPaymentApiRoot(entryRes)
            : peelEntryPaymentApiRoot(entryRes);
        const master = typeof window.gpaFirstMasterFromApi === 'function'
            ? window.gpaFirstMasterFromApi(root)
            : firstEntryPaymentMasterFromRoot(root);
        const rows = window.gpaExtractGRNPaymentDetails(root, master);
        if (rows.length) return rows;
    }
    if (Array.isArray(entryRes) && entryRes.length) return entryRes;
    const root = entryRes?.Data ?? entryRes?.data ?? entryRes;
    if (Array.isArray(root) && root.length) return root;
    const peeled = peelEntryPaymentApiRoot(entryRes);
    if (Array.isArray(peeled) && peeled.length) return peeled;
    const scanned = gpaScanPaymentDetailArraysInObject(peeled || root);
    if (scanned.length) return scanned;
    return extractDetailLines(entryRes);
}

/** Merge approval + entry lines; match by detail Code / MRN; entry text fields win. */
function mergeModalDetailLines(approvalLines, entryLines) {
    const a = approvalLines || [];
    const e = entryLines || [];
    if (!a.length && !e.length) return [];
    if (!a.length) return e.slice();
    if (!e.length) return a.slice();

    const usedEntry = new Set();
    const out = [];

    function detailCode(r) {
        const c = parseInt(r?.Code ?? r?.code ?? r?.GRNPaymentDetail_Code ?? r?.GRNPaymentDetails_Code ?? 0, 10);
        return Number.isFinite(c) && c > 0 ? c : 0;
    }

    function mergePair(al, el) {
        const merged = Object.assign({}, al || {}, el || {});
        const pay = gpaRowPaymentAmount(al) ?? gpaRowPaymentAmount(el);
        if (pay != null) merged.PaymentAmount = pay;
        return merged;
    }

    for (let i = 0; i < a.length; i++) {
        const al = a[i];
        const aCode = detailCode(al);
        const aMrn = gpaMrnFromDetailRow(al);
        let matchIdx = -1;
        for (let j = 0; j < e.length; j++) {
            if (usedEntry.has(j)) continue;
            const el = e[j];
            const eCode = detailCode(el);
            const eMrn = gpaMrnFromDetailRow(el);
            if (aCode > 0 && aCode === eCode) { matchIdx = j; break; }
            if (aMrn > 0 && aMrn === eMrn) { matchIdx = j; break; }
        }
        if (matchIdx < 0 && i < e.length && !usedEntry.has(i)) matchIdx = i;
        if (matchIdx >= 0) {
            usedEntry.add(matchIdx);
            out.push(mergePair(al, e[matchIdx]));
        } else {
            out.push(Object.assign({}, al));
        }
    }
    for (let j = 0; j < e.length; j++) {
        if (!usedEntry.has(j)) out.push(Object.assign({}, e[j]));
    }
    return out;
}

function normalizeGpaModalApiRows(result) {
    if (Array.isArray(result)) return result;
    const datum = result?.Data ?? result?.data;
    if (Array.isArray(datum)) return datum;
    if (datum && typeof datum === 'object') {
        const inner = normalizeGpaModalApiRows(datum);
        if (inner.length) return inner;
    }
    if (Array.isArray(result?.Table)) return result.Table;
    if (Array.isArray(result?.List)) return result.List;
    if (Array.isArray(result?.value)) return result.value;
    return [];
}

function gpaMrnFromDetailRow(r) {
    const v = r?.MRNMaster_Code ?? r?.mRNMaster_Code ?? r?.mrnMaster_Code ?? r?.MRN_Code ?? r?.mrn_Code;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function gpaCounterpartyCodeFromPayment(payment) {
    if (!payment || typeof payment !== 'object') return '';
    const emp = payment.MarketingManMaster_Code ?? payment.marketingManMaster_Code
        ?? payment.F_MarketingManMaster_Code ?? payment.f_MarketingManMaster_Code;
    if (emp != null && `${emp}`.trim() !== '' && `${emp}` !== '0') return String(emp).trim();
    const acc = payment.AccountMaster_Code ?? payment.accountMaster_Code;
    if (acc != null && `${acc}`.trim() !== '' && `${acc}` !== '0') return String(acc).trim();
    const vend = payment.VendorMaster_Code ?? payment.vendorMaster_Code;
    if (vend != null && `${vend}`.trim() !== '' && `${vend}` !== '0') return String(vend).trim();
    return '';
}

function gpaModalMergeDetailWithBillLookup(d, billRows) {
    if (!d || typeof d !== 'object') return d;
    const mrn = gpaMrnFromDetailRow(d);
    if (!mrn || !billRows?.length) return d;
    const br = billRows.find(function (row) { return gpaMrnFromDetailRow(row) === mrn; });
    if (!br) return d;
    return Object.assign({}, br, d, {
        BillNo: d.BillNo ?? d.billNo ?? br.BillNo ?? br.billNo,
        BillDate: d.BillDate ?? d.billDate ?? br.BillDate ?? br.billDate,
        BillAmount: d.BillAmount ?? d.billAmount ?? br.BillAmount ?? br.billAmount,
        Dedution: d.Dedution ?? d.dedution ?? d.Deduction ?? d.deduction ?? br.Dedution ?? br.dedution ?? br.Deduction ?? br.deduction,
        PayableAmount: d.PayableAmount ?? d.payableAmount ?? d.NetPayable ?? d.netPayable
            ?? br.PayableAmount ?? br.payableAmount ?? br.NetPayable ?? br.netPayable,
        PONo: gpaPoNoFromRecord(d) || gpaPoNoFromRecord(br),
        CategoryName: gpaCategoryNameFromRecord(d) || gpaCategoryNameFromRecord(br),
    });
}

function gpaModalProjectLabelFromCode(code, projectCache) {
    const cs = code !== undefined && code !== null ? String(code).trim() : '';
    if (!cs) return '';
    const list = projectCache || [];
    for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const pc = String(p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code ?? '').trim();
        if (pc === cs) {
            return String(p.ProjectName ?? p.projectName ?? p.ProjectDesp ?? p.projectDesp ?? p.Name ?? p.name ?? '').trim();
        }
    }
    return '';
}

function gpaModalEnrichLineProjectLabels(row, projectCache) {
    if (!row || typeof row !== 'object') return row;
    const out = Object.assign({}, row);
    let proj = gpaProjectLabelFromRow(out);
    if (!proj) {
        const pc = out.ProjectMaster_Code ?? out.projectMaster_Code ?? out.Project_Code ?? out.project_Code;
        proj = gpaModalProjectLabelFromCode(pc, projectCache);
        if (proj) out.ProjectName = proj;
    }
    let sub = gpaSubProjectLabelFromRow(out);
    if (!sub) {
        const sc = out.SubProjectMaster_Code ?? out.subProjectMaster_Code ?? out.SubProject_Code ?? out.subProject_Code;
        if (sc != null && `${sc}`.trim() !== '' && !/^\d+$/.test(String(sc).trim())) {
            sub = String(sc).trim();
        }
    }
    if (sub) out.SubProjectName = sub;
    return out;
}

async function gpaModalEnrichBillLines(lines, payment, projectCache) {
    let rows = (lines || []).slice();
    const partyCode = gpaCounterpartyCodeFromPayment(payment);
    let billRows = [];
    if (partyCode) {
        try {
            const br = await GRNPaymentEntryDataService.GetBillDetails(partyCode);
            billRows = normalizeGpaModalApiRows(br);
        } catch (e) {
            console.warn('gpaModalEnrichBillLines GetBillDetails', e);
        }
    }
    if (typeof window.gpaLoadPoListForPartyCode === 'function' && partyCode) {
        try { await window.gpaLoadPoListForPartyCode(partyCode); } catch (e) { /* optional */ }
    }
    rows = rows.map(function (row) {
        let r = gpaModalMergeDetailWithBillLookup(row, billRows);
        if (typeof window.gpaEnrichDetailRowPoCategory === 'function') {
            r = window.gpaEnrichDetailRowPoCategory(r);
        }
        r = gpaModalEnrichLineProjectLabels(r, projectCache);
        return r;
    });
    return rows;
}

function resolveModalBillLines(approvalRes, entryRes, payment) {
    const approvalLines = extractDetailLines(approvalRes);
    const fromMerged = Array.isArray(payment?._detailLines) && payment._detailLines.length
        ? payment._detailLines
        : [];
    const baseApproval = approvalLines.length ? approvalLines : fromMerged;
    const entryLines = payment?._entryDetailLines || normalizeEntryDetailLinesFromApi(entryRes);
    return mergeModalDetailLines(baseApproval, entryLines);
}

/** Payment Entry GetByCode — fills PaymentFor, PONo, CategoryName missing on approval detail API. */
function mergeEntryPaymentIntoApproval(payment, entryRes) {
    if (!entryRes) return payment;
    const root = peelEntryPaymentApiRoot(entryRes);
    const p = { ...payment };
    let master = null;
    if (root && typeof root === 'object' && !Array.isArray(root)) {
        master = firstEntryPaymentMasterFromRoot(root);
        if (master && typeof master === 'object') {
            Object.assign(p, master);
            const mProj = gpaProjectLabelFromPayment(master);
            const mSub = gpaSubProjectLabelFromPayment(master);
            if (mProj) p.Project = mProj;
            if (mSub) p.SubProject = mSub;
        }
    }
    const entryLines = normalizeEntryDetailLinesFromApi(entryRes);
    if (entryLines.length) {
        p._entryDetailLines = entryLines;
        const d0 = entryLines[0];
        if (d0) {
            const proj = gpaProjectLabelFromRow(d0);
            const sub = gpaSubProjectLabelFromRow(d0);
            if (proj) p.Project = proj;
            if (sub) p.SubProject = sub;
        }
    }
    return p;
}

function isRealApprovalDate(val) {
    if (val == null) return false;
    const s = String(val).trim();
    if (!s || s === '0' || s === 'null' || s === 'undefined') return false;
    // Reject .NET default DateTime values (0001-01-01, 1900-01-01, 01/01/0001, etc.)
    if (s.startsWith('0001-') || s.startsWith('1900-01-01') || s.startsWith('01/01/0001')) return false;
    // Must parse to a real date after year 1900
    const dt = new Date(s);
    return !isNaN(dt.getTime()) && dt.getFullYear() > 1900;
}

function levelRowIsApproved(lvl) {
    if (!lvl || typeof lvl !== 'object') return false;
    const on = lvl.ApprovedOn ?? lvl.Approved_Date ?? lvl.ApprovedDate ?? lvl.ApprovedOnDate;
    if (isRealApprovalDate(on)) return true;
    const st = (lvl.Status ?? lvl.ApprovalStatus ?? lvl.IsApproved ?? '').toString().trim().toLowerCase();
    return st === 'y' || st === 'approved' || st === '1' || st === 'true';
}

/** When master Status lags the API, infer from per-level rows (all levels 1..TotalLevels approved). */
function allLevelsApprovedFromDetails(p) {
    const total = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (total < 1) return false;
    const levels = parseLevelDetailsToArray(p.LevelDetails);
    if (!levels.length) return false;
    for (let i = 1; i <= total; i++) {
        const lvl = levels.find(function (l) {
            const n = parseInt(l.LevelNo ?? l.Level ?? l.LevelOrder ?? 0, 10);
            return n === i;
        });
        if (!levelRowIsApproved(lvl)) return false;
    }
    return true;
}

function getApprovalStatus(p) {
    const raw = (p.ApprovalStatus ?? p.Status ?? p.Approval_Status ?? '').toString().trim();
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();

    // Matches SQL: CASE WHEN pom.Status = 'P' THEN 'Approved' WHEN pom.Status = 'R' THEN 'Rejected' ELSE 'Pending'
    if (upper === 'R' || lower === 'rejected') return 'Rejected';
    if (upper === 'P' || raw === 'Y' || lower === 'approved') return 'Approved';

    if (allLevelsApprovedFromDetails(p)) return 'Approved';

    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 0, 10) || 0;
    const tot = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (tot > 0 && cur > tot) return 'Approved';

    if (raw === '' || raw === 'N' || upper === 'U' || lower === 'pending') return 'Pending';
    if (
        lower === 'complete' || lower === 'completed' ||
        lower.indexOf('fully approved') >= 0 ||
        lower.indexOf('final approved') >= 0 ||
        lower.indexOf('all approved') >= 0 ||
        (lower.indexOf('all levels') >= 0 && lower.indexOf('approved') >= 0)
    ) {
        return 'Approved';
    }

    return raw || 'Pending';
}

/**
 * Pill next to the date on list cards — CurrentLevelDesc / matching LevelDetails.LevelDesc while pending,
 * else Approved / Rejected. Falls back to Ln only if no description is present.
 */
function getGpaCardLevelChipLabel(p) {
    const status = getApprovalStatus(p);
    const st = status.toLowerCase();
    if (st === 'approved') return 'Approved';
    if (st === 'rejected') return 'Rejected';
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 1, 10) || 1;
    let cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    if (cur < 1) cur = 1;
    if (totalLvl > 0 && cur > totalLvl) return 'Approved';

    const masterDesc = String(p.CurrentLevelDesc ?? '').trim();
    if (masterDesc) return masterDesc;

    const row = getCurrentLevelRowForGpa(p);
    const rowDesc = row ? pickLevelRowTitleText(row) : '';
    if (rowDesc) return rowDesc;

    return 'L' + cur;
}

function getLevelCode(p) {
    const c = p.LevelCode ?? p.Level_Code ?? p.ApprovalLevel_Code ?? p.GRNPaymentLevel_Code ?? 0;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function getSessionUserMasterCodeGpa() {
    try {
        const a = JSON.parse(sessionStorage.getItem('authKey'));
        return parseInt(a && a.UserMaster_Code, 10) || 0;
    } catch (e) {
        return 0;
    }
}

function getSessionGroupMasterCodeGpa() {
    try {
        const d = JSON.parse(sessionStorage.getItem('UserDetails'));
        if (Array.isArray(d) && d[0] != null) {
            return parseInt(d[0].GroupMaster_Code, 10) || 0;
        }
    } catch (e) { /* ignore */ }
    return 0;
}

function pickFirstPositiveInt(obj, keys) {
    if (!obj || typeof obj !== 'object') return 0;
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v == null || v === '') continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

/** Level row matching the payment's current approval step (for approver user/group). */
function getCurrentLevelRowForGpa(p) {
    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const levels = parseLevelDetailsToArray(p.LevelDetails);
    const row = levels.find(function (l) {
        return levelNoFromRow(l) === cur;
    });
    if (row) return row;
    if (levels.length && cur >= 1 && cur <= levels.length) return levels[cur - 1];
    return null;
}

function truthyFlagGpa(v) {
    if (v === true || v === 1) return true;
    const s = (v != null ? String(v) : '').trim().toLowerCase();
    return s === 'y' || s === '1' || s === 'true';
}

/**
 * True when this entry is in Pending workflow and the current user/group is assigned to act
 * at the current level (or API explicitly flags the row). If assignee fields are absent, treats
 * as pending-on-me when the list is not explicitly assigned to someone else (common when API
 * already scopes the list to the user).
 */
function paymentIsPendingOnMe(p) {
    if (getApprovalStatus(p).toLowerCase() !== 'pending') return false;

    if (truthyFlagGpa(p.IsPendingForMe) || truthyFlagGpa(p.PendingForMe) || truthyFlagGpa(p.CanApproveNow)
        || truthyFlagGpa(p.IsMyApproval) || truthyFlagGpa(p.PendingOnMe)) {
        return true;
    }

    const me = getSessionUserMasterCodeGpa();
    const myG = getSessionGroupMasterCodeGpa();

    const lvl = getCurrentLevelRowForGpa(p);
    const ru = pickFirstPositiveInt(lvl, [
        'UserMaster_Code', 'userMaster_Code', 'ApproverUserMaster_Code', 'ApproverUser_Code',
        'AssignedUserMaster_Code', 'ApprovalUserMaster_Code', 'Approver_Code'
    ]);
    const rg = pickFirstPositiveInt(lvl, [
        'GroupMaster_Code', 'groupMaster_Code', 'ApproverGroupMaster_Code',
        'AssignedGroupMaster_Code', 'ApprovalGroupMaster_Code'
    ]);

    if (me > 0 && ru > 0 && ru === me) return true;
    if (myG > 0 && rg > 0 && rg === myG) return true;

    const mu = pickFirstPositiveInt(p, [
        'CurrentApproverUserMaster_Code', 'ApproverUserMaster_Code', 'NextApproverUserMaster_Code',
        'PendingApproverUserMaster_Code'
    ]);
    const mg = pickFirstPositiveInt(p, [
        'CurrentApproverGroupMaster_Code', 'ApproverGroupMaster_Code', 'NextApproverGroupMaster_Code',
        'PendingApproverGroupMaster_Code'
    ]);
    if (me > 0 && mu > 0 && mu === me) return true;
    if (myG > 0 && mg > 0 && mg === myG) return true;

    const hasAssignee = (ru + rg + mu + mg) > 0;
    if (!hasAssignee) {
        return true;
    }
    return false;
}

function getFilteredPaymentListForRender() {
    if (!G_OnlyPendingOnMe) return G_PaymentList;
    return G_PaymentList.filter(paymentIsPendingOnMe);
}

function syncGpaPendingOnMeChipActive() {
    const chip = document.getElementById('gpaStatChipPendingOnMe');
    if (chip) {
        chip.classList.toggle('gpa-stat-chip--onme-active', !!G_OnlyPendingOnMe);
    }
}

function getLevelRowRemarks(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const r = lvlInfo.Remarks ?? lvlInfo.Remark ?? lvlInfo.ApprovalRemarks ?? lvlInfo.LevelRemarks
        ?? lvlInfo.Comments ?? lvlInfo.RejectionRemarks;
    const s = r != null ? String(r).trim() : '';
    return s;
}

/** API / config may use Description, LevelDesc, LevelDesp, or LevelName for the same label. */
function pickLevelRowTitleText(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const c = lvlInfo.Description ?? lvlInfo.description
        ?? lvlInfo.LevelDesc ?? lvlInfo.LevelDesp
        ?? lvlInfo.LevelName ?? lvlInfo.levelName;
    const s = c != null ? String(c).trim() : '';
    return s;
}

function getLevelRowDisplayTitle(lvlInfo, levelNo) {
    const t = pickLevelRowTitleText(lvlInfo);
    if (t) return t;
    return 'Level ' + levelNo;
}

/** Same idea as PO list: API may send LevelDetails as JSON string or array. */
function parseLevelDetailsToArray(v) {
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

/**
 * After GetGRNPaymentDetail, master often overwrites list LevelDetails with [] or empty strings
 * and remarks from the pending list are lost. Merge API row with list row by LevelNo (PO pattern).
 */
function levelNoFromRow(r) {
    const n = parseInt(r.LevelNo ?? r.Level ?? r.LevelOrder ?? 0, 10);
    return Number.isFinite(n) ? n : 0;
}

function mergeLevelDetailsLists(fromList, fromApi) {
    const a = Array.isArray(fromList) ? fromList : [];
    const b = Array.isArray(fromApi) ? fromApi : [];
    if (!b.length) return a.slice();
    if (!a.length) return b.slice();

    const map = new Map();
    a.forEach(function (row) {
        const n = levelNoFromRow(row);
        if (n > 0) map.set(n, { ...row });
    });
    b.forEach(function (row) {
        const n = levelNoFromRow(row);
        if (n < 1) return;
        const prev = map.get(n) || {};
        const next = { ...prev, ...row };
        next.LevelDesc = pickLevelRowTitleText(row) || pickLevelRowTitleText(prev)
            || row.LevelDesc || prev.LevelDesc || row.LevelName || prev.LevelName || '';
        next.Remarks = getLevelRowRemarks(row) || getLevelRowRemarks(prev) || '';

        const hasApprover = (x) => x && String(x.ApproverName ?? x.UserName ?? '').trim() !== '';
        if (!hasApprover(row) && hasApprover(prev)) {
            next.ApproverName = prev.ApproverName;
            next.UserName = prev.UserName;
        }
        const hasDate = (x) => x && String(x.ApprovedOn ?? '').trim() !== '';
        if (!hasDate(row) && hasDate(prev)) {
            next.ApprovedOn = prev.ApprovedOn;
        }

        map.set(n, next);
    });
    return [...map.keys()].sort(function (x, y) { return x - y; }).map(function (k) { return map.get(k); });
}

function NormalizePaymentList(list) {
    return (list || []).map(function (row) {
        const p = { ...row };
        p.LevelDetails = parseLevelDetailsToArray(p.LevelDetails);
        if (!p.TotalLevels && p.LevelDetails.length > 0) {
            p.TotalLevels = p.LevelDetails.length;
        }
        return p;
    });
}

function LoadPaymentList() {
    const fromDate = document.getElementById('gpaFromDate')?.value || '';
    const toDate = document.getElementById('gpaToDate')?.value || '';
    const statusVal = document.getElementById('gpaDdlStatus')?.value || 'A';

    G_OnlyPendingOnMe = false;
    syncGpaPendingOnMeChipActive();

    ShowGpaLoading(true);
    ShowGpaEmpty(false);
    const container = document.getElementById('gpaPendingList');
    if (container) container.innerHTML = '';

    // Always fetch ALL records from the API (Status='A') and apply status filtering
    // entirely on the client side using getApprovalStatus(). This avoids any
    // mismatch between the dropdown labels ('P'=Pending, 'Y'=Approved) and the
    // underlying DB values ('P'=Approved/Posted, 'R'=Rejected, ''=Pending).
    GRNPaymentApprovalService.GetPendingGRNPaymentList(fromDate, toDate, 'A')
        .then(function (data) {
            ShowGpaLoading(false);
            let list = NormalizePaymentList(normalizeListResponse(data));

            // Client-side status filter based on selected dropdown value
            if (statusVal === 'P') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'pending'; });
            } else if (statusVal === 'Y') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'approved'; });
            } else if (statusVal === 'R') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'rejected'; });
            }
            // 'A' (All Status) — no filter, keep full list

            G_PaymentList = list;
            UpdateGpaStatChips();
            RenderPaymentCards();
            const searchEl = document.getElementById('gpaLstSearch');
            FilterGpaCards(searchEl ? searchEl.value : '');
        })
        .catch(function (err) {
            console.error('LoadPaymentList', err);
            ShowGpaLoading(false);
            G_PaymentList = [];
            if (container) container.innerHTML = '';
            ShowGpaEmpty(true);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error loading GRN payment approval list.');
            }
        });
}

function UpdateGpaStatChips() {
    const pending = G_PaymentList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() !== 'approved';
    }).length;
    const other = G_PaymentList.length - pending;
    const elP = document.getElementById('gpaStatPending');
    const elO = document.getElementById('gpaStatProcessed');
    if (elP) elP.textContent = pending > 0 ? String(pending) : (G_PaymentList.length ? '0' : '—');
    if (elO) elO.textContent = other > 0 ? String(other) : '—';

    const onMe = G_PaymentList.filter(paymentIsPendingOnMe).length;
    const elOnMe = document.getElementById('gpaStatPendingOnMe');
    if (elOnMe) {
        elOnMe.textContent = G_PaymentList.length === 0 ? '—' : String(onMe);
    }
}

function RenderPaymentCards() {
    const list = getFilteredPaymentListForRender();
    const container = document.getElementById('gpaPendingList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowGpaEmpty(true);
        return;
    }
    ShowGpaEmpty(false);
    container.innerHTML = list.map(function (p) { return BuildPaymentCard(p); }).join('');
}

function ToggleGpaPendingOnMeFilter() {
    G_OnlyPendingOnMe = !G_OnlyPendingOnMe;
    syncGpaPendingOnMeChipActive();
    RenderPaymentCards();
    const searchEl = document.getElementById('gpaLstSearch');
    FilterGpaCards(searchEl ? searchEl.value : '');
}

function BuildPaymentCard(p) {
    const code = getPaymentMasterCode(p);
    const entryPlain = String(getEntryNo(p));
    const vendorPlain = String(getPartyName(p));
    const entryNo = EscHtml(entryPlain);
    const vendor = EscHtml(vendorPlain);
    const entryDate = FmtDateDisplay(getEntryDate(p));
    const amount = FmtCurrency(getTotalAmount(p));
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 3, 10) || 1;
    const curLvlNo = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const levelChip = EscHtml(getGpaCardLevelChipLabel(p));
    const status = getApprovalStatus(p);

    let statusClr, statusBg;
    if (status.toLowerCase() === 'approved') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (status.toLowerCase() === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildGpaCardStepper(curLvlNo, totalLvl, status);
    const isPending = status.toLowerCase() === 'pending';
    const actionBtn = isPending
        ? `<button type="button" class="btn-gpa-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button type="button" class="btn-gpa-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const hasAttach = GpaHasAttachmentYes(p);
    const attachBg = hasAttach
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const attachShadow = hasAttach ? 'rgba(22,163,74,0.35)' : 'rgba(14,165,233,0.35)';

    const printBtns = `<div class="gpa-pay-card-print-btns">
        <button type="button" class="btn-gpa-print-icon btn-gpa-print-prev" title="Print Preview"
                onclick="PrintGRNPaymentFromApproval(${code},'preview')">
            <i class="fa fa-search-plus"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon btn-gpa-print-go" title="Print"
                onclick="PrintGRNPaymentFromApproval(${code},'print')">
            <i class="fa fa-print"></i>
        </button>
        <button type="button" class="btn-gpa-print-icon"
                style="background:${attachBg};color:#fff;box-shadow:0 2px 8px ${attachShadow};"
                title="Attachments" onclick="OpenGRNPaymentApprovalAttachment(${code})">
            <i class="fa fa-paperclip"></i>
        </button>
    </div>`;

    const projName = EscHtml(getProject(p) || '');
    const subProjName = EscHtml(getSubProject(p) || '');
    const projLine = projName
        ? `<div style="font-size:0.7rem;color:#64748b;margin-top:4px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
               <i class="fa fa-diagram-project me-1" style="color:#667eea;font-size:0.68rem;"></i>${projName}${subProjName ? ' <span style="color:#94a3b8;">·</span> ' + subProjName : ''}
           </div>`
        : '';

    const searchKey = (vendorPlain + ' ' + entryPlain).toLowerCase();

    return `
    <div class="gpa-pay-card section-entry-animation" data-code="${code}" data-search="${EscHtml(searchKey)}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">Entry</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${entryNo}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${vendor}
                </div>
                <div class="gpa-pay-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${entryDate || '—'}</span>
                    <span class="gpa-pay-level-chip">
                        <i class="fa fa-layer-group me-1"></i>${levelChip}
                    </span>
                </div>
                ${projLine}
            </div>
            <div class="gpa-pay-card-right">
                <div class="gpa-pay-amount">${amount}</div>
                <div class="gpa-pay-status-badge" style="color:${statusClr};background:${statusBg};">${EscHtml(status)}</div>
            </div>
        </div>
        <div class="gpa-pay-card-levels">
            <div class="gpa-pay-level-label">
                <i class="fa fa-code-branch me-1" style="color:#667eea;"></i>
                Approval Progress
            </div>
            ${stepperHtml}
        </div>
        <div class="gpa-pay-card-footer">
            ${printBtns}
            ${actionBtn}
        </div>
    </div>`;
}

function BuildGpaCardStepper(currentLevel, totalLevels, status) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    const st = status.toLowerCase();
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

function FilterGpaCards(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.gpa-pay-card');
    let visible = 0;
    cards.forEach(function (card) {
        const match = !q || (card.dataset.search || '').includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowGpaEmpty(visible === 0 && G_PaymentList.length > 0);
}

function mergeDetailIntoPayment(root, basePayment) {
    const p = { ...basePayment };
    const fromList = parseLevelDetailsToArray(basePayment.LevelDetails);

    if (Array.isArray(root)) {
        p._detailLines = root;
        p.LevelDetails = fromList.length ? fromList.slice() : [];
        enrichPaymentHeaderFromBillLines(p, root);
        return p;
    }
    const data = root?.Data ?? root?.data ?? root;
    if (!data || typeof data !== 'object') {
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        return p;
    }
    if (Array.isArray(data)) {
        p._detailLines = data;
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        enrichPaymentHeaderFromBillLines(p, data);
        return p;
    }

    const master = data.VW_GRNPaymentMaster?.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster
        ?? data.Master
        ?? data;

    if (master && typeof master === 'object') {
        Object.assign(p, master);
        const mProj = gpaProjectLabelFromPayment(master);
        const mSub = gpaSubProjectLabelFromPayment(master);
        if (mProj) p.Project = mProj;
        if (mSub) p.SubProject = mSub;
    }

    const fromApi = parseLevelDetailsToArray(
        (data && data.LevelDetails != null) ? data.LevelDetails : p.LevelDetails
    );
    p.LevelDetails = mergeLevelDetailsLists(fromList, fromApi);

    let lines = data.GRNPaymentDetails ?? data.grnPaymentDetails
        ?? data.Details ?? data.details ?? data.BillLines ?? data.Items ?? data.Lines
        ?? data.Table ?? data.table;
    if (!Array.isArray(lines) || !lines.length) lines = gpaScanPaymentDetailArraysInObject(data);
    if (Array.isArray(lines) && lines.length) {
        p._detailLines = lines;
        enrichPaymentHeaderFromBillLines(p, lines);
    }

    return p;
}

function extractDetailLines(root) {
    if (typeof window.gpaExtractGRNPaymentDetails === 'function') {
        const peeled = typeof window.gpaPeelGrnPaymentApiRoot === 'function'
            ? window.gpaPeelGrnPaymentApiRoot(root)
            : (root?.Data ?? root?.data ?? root);
        const master = typeof window.gpaFirstMasterFromApi === 'function'
            ? window.gpaFirstMasterFromApi(peeled)
            : null;
        const rows = window.gpaExtractGRNPaymentDetails(peeled, master);
        if (rows.length) return rows;
    }
    if (Array.isArray(root)) {
        return root.length && gpaIsPaymentDetailRow(root[0]) ? root : [];
    }
    const data = root?.Data ?? root?.data ?? root;
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.length && gpaIsPaymentDetailRow(data[0]) ? data : [];
    }
    const lines = data.GRNPaymentDetails ?? data.grnPaymentDetails
        ?? data.Details ?? data.details ?? data.BillLines ?? data.Items ?? data.Lines
        ?? data.Table ?? data.table;
    if (Array.isArray(lines) && lines.length) return lines;
    return gpaScanPaymentDetailArraysInObject(data);
}

/** API may return { Status, Msg } or wrap in Data/Result. */
function unwrapGpaActionResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return res.Data ?? res.data ?? res.Result ?? res.result ?? res;
}
function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}
function isGpaPaymentEntryListPage() {
    return !!document.getElementById('divGPAList');
}

function applyGpaModalActionButtons(showApproveReject) {
    if (isGpaPaymentEntryListPage()) {
        $('#gpaBtnApproveAction').hide();
        $('#gpaBtnRejectAction').hide();
        $('.gpa-remarks-wrap').hide();
        return;
    }
    $('.gpa-remarks-wrap').show();
    $('#gpaBtnApproveAction').toggle(!!showApproveReject);
    $('#gpaBtnRejectAction').toggle(!!showApproveReject);
}

function OpenDetailModal(paymentCode) {
    //var ModuleName = 'Payment Entry',
    //    OptionName = 'Verify',
    //    ShowMsg = 'Y',
    //    FinYear = getFinancialYear();

    //MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
    //    if (response.CheckModuleOptionRight === 'N') {
    //        toastr.error(response.Msg);
    //        return;
    //    } else {
            const code = parseInt(paymentCode, 10);
            if (!Number.isFinite(code) || code <= 0) return;

            G_CurrentPayment = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === code; }) || null;
            if (!G_CurrentPayment && typeof window.gpaGetListRowRawByCode === 'function') {
                const raw = window.gpaGetListRowRawByCode(code);
                if (raw) G_CurrentPayment = Object.assign({}, raw);
            }
            if (!G_CurrentPayment) {
                G_CurrentPayment = { Code: code, GRNPaymentMaster_Code: code };
            }

            const entryNo = getEntryNo(G_CurrentPayment);
            const vendor = getPartyName(G_CurrentPayment);

            $('#gpaModalEntryTitle').text('Entry# ' + entryNo);
            $('#gpaModalParty').text(vendor);
            $('#hfGpaPaymentCode').val(String(code));
            $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
            $('#gpaFrmRemarks').val('');
            $('#gpaBtnModalAttachment').toggleClass('gpa-attach-has-files', GpaHasAttachmentYes(G_CurrentPayment));

            paintModalFromPayment(G_CurrentPayment);

            $('#gpaModalItemsBody').html(
                '<tr><td colspan="11" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
                '<i class="fa fa-spinner fa-spin me-1"></i>Loading\u2026</td></tr>'
            );

            applyGpaModalActionButtons(getApprovalStatus(G_CurrentPayment).toLowerCase() === 'pending');

            $('#modalGpaDetail').modal({ backdrop: 'static' });
            $('#modalGpaDetail').modal('show');

            LoadGpaAttachmentsInline(code);

            (async function loadGpaModalData() {
                try {
                    const results = await Promise.all([
                        GRNPaymentApprovalService.GetGRNPaymentDetail(code),
                        GRNPaymentEntryDataService.GetGRNPaymentApprovalByCode(code).catch(function () { return null; }),
                        GRNPaymentEntryDataService.GetProjectMasterList().catch(function () { return null; }),
                    ]);
                    const res = results[0];
                    const entryRes = results[1];
                    const projectCache = normalizeGpaModalApiRows(results[2]);

                    G_CurrentPayment = mergeDetailIntoPayment(res, G_CurrentPayment);
                    G_CurrentPayment = mergeEntryPaymentIntoApproval(G_CurrentPayment, entryRes);
                    let lines = resolveModalBillLines(res, entryRes, G_CurrentPayment);
                    lines = await gpaModalEnrichBillLines(lines, G_CurrentPayment, projectCache);
                    G_CurrentPayment._modalBillLines = lines;
                    G_CurrentPayment = enrichPaymentHeaderFromBillLines(G_CurrentPayment, lines);
                    $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
                    paintModalFromPayment(G_CurrentPayment);
                    RenderGpaModalItems(lines);
                    applyGpaModalActionButtons(getApprovalStatus(G_CurrentPayment).toLowerCase() === 'pending');
                } catch (err) {
                    console.error('GetGRNPaymentDetail', err);
                    $('#gpaModalItemsBody').html(
                        '<tr><td colspan="11" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                        '<i class="fa fa-exclamation-triangle me-1"></i>Error loading bill lines.</td></tr>'
                    );
                }
            })();
    //    }
    //});
   
}

function paintModalFromPayment(po) {
    const entryNo = EscHtml(getEntryNo(po));
    const vendor = EscHtml(getPartyName(po));
    const entryDate = EscHtml(FmtDateDisplay(getEntryDate(po)) || '—');
    const amount = FmtCurrency(getTotalAmount(po));
    const curLvlNo = parseInt(po.CurrentLevelNo ?? po.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(po.TotalLevels ?? po.MaxLevel ?? 3, 10) || 1;
    const status = EscHtml(getApprovalStatus(po));

    const project = EscHtml(getProject(po) || '—');
    const subProject = EscHtml(getSubProject(po) || '—');
    const paymentFor = EscHtml(getPaymentForDisplay(po));

    $('#gpaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildGpaInfoItem('Entry Number', entryNo, 'fa-file-invoice') +
            BuildGpaInfoItem('Party', vendor, 'fa-building') +
            BuildGpaInfoItem('Entry Date', entryDate, 'fa-calendar-alt') +
            BuildGpaInfoItem('Amount', amount, 'fa-rupee-sign', '#667eea') +
            BuildGpaInfoItem('Payment for', paymentFor, 'fa-tags') +
            BuildGpaInfoItem('Project', project, 'fa-project-diagram') +
            BuildGpaInfoItem('Sub Project', subProject, 'fa-sitemap') +
            BuildGpaInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
            BuildGpaInfoItem('Status', status, 'fa-info-circle') +
        '</div>'
    );

    $('#gpaModalApprovalStepper').html(BuildGpaDetailStepper(po));
}

function BuildGpaInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="gpa-info-item">' +
        '<span class="gpa-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
        '<span class="gpa-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildGpaDetailStepper(po) {
    const curLvlNo = parseInt(po.CurrentLevelNo ?? po.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(po.TotalLevels ?? po.MaxLevel ?? 3, 10) || 1;
    const status = getApprovalStatus(po);
    const st = status.toLowerCase();
    const levels = parseLevelDetailsToArray(po.LevelDetails);

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = levels.find(function (l) {
            return (l.LevelNo ?? l.Level ?? l.LevelOrder) == i;
        }) || {};
        const lvlName = EscHtml(getLevelRowDisplayTitle(lvlInfo, i));
        const approver = EscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtDateDisplay(lvlInfo.ApprovedOn) : '';
        const lvlRemarksRaw = getLevelRowRemarks(lvlInfo);
        const remarksHtml = lvlRemarksRaw
            ? '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + EscHtml(lvlRemarksRaw) + '</div>'
            : '';

        let stepState;
        if (st === 'approved' || i < curLvlNo) stepState = 'done';
        else if (i === curLvlNo) stepState = st === 'rejected' ? 'rejected' : 'active';
        else stepState = 'pending';

        const iconHtml = stepState === 'done' ? '<i class="fa fa-check"></i>'
            : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                : stepState === 'active' ? '<i class="fa fa-hourglass-half"></i>'
                    : i;

        const badgeLabel = stepState === 'done' ? 'Approved'
            : stepState === 'rejected' ? 'Rejected'
                : stepState === 'active' ? 'Pending'
                    : 'Waiting';

        const approverHtml = approver
            ? '<div class="gpa-dstep-sub"><i class="fa fa-user me-1"></i>' + approver +
            (approvedOn ? ' &mdash; ' + approvedOn : '') + '</div>'
            : '';

        const lineClass = (stepState === 'done') ? 'gpa-dstep-line-done' : 'gpa-dstep-line-pending';

        html += '<div class="gpa-dstep-item gpa-dstep-' + stepState + '">' +
            '<div class="gpa-dstep-circle">' + iconHtml + '</div>' +
            '<div class="gpa-dstep-body">' +
            '<div class="gpa-dstep-title">' + lvlName + '</div>' +
            approverHtml +
            remarksHtml +
            '<div class="gpa-dstep-badge gpa-dstep-badge-' + stepState + '">' + badgeLabel + '</div>' +
            '</div>' +
            '</div>';

        if (i < totalLvl) {
            html += '<div class="gpa-dstep-line ' + lineClass + '"></div>';
        }
    }
    html += '</div>';
    return html;
}

function gpaPoNoFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const flat = r.PONo ?? r.pONo ?? r.PoNO ?? r.PO_No ?? r.poNo ?? '';
    if (flat !== undefined && flat !== null && `${flat}`.trim() !== '') return String(flat).trim();
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    if (pom && typeof pom === 'object') {
        const v = pom.PONo ?? pom.pONo ?? pom.PoNO ?? pom.PO_No ?? pom.poNo ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function gpaCategoryNameFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const flat = r.CategoryName ?? r.categoryName ?? '';
    if (flat !== undefined && flat !== null && String(flat).trim() !== '') return String(flat).trim();
    const cm = r.CategoryMaster ?? r.categoryMaster;
    if (cm && typeof cm === 'object') {
        const v = cm.CategoryName ?? cm.categoryName ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function gpaIsPaymentDetailRow(r) {
    if (!r || typeof r !== 'object') return false;
    return gpaRowPaymentAmount(r) != null
        || r.PONo != null || r.pONo != null
        || r.CategoryName != null || r.categoryName != null
        || r.PurchaseOrderMaster_Code != null || r.purchaseOrderMaster_Code != null
        || r.ProjectCategory_Code != null || r.projectCategory_Code != null
        || r.ProjectMaster_Code != null || r.projectMaster_Code != null;
}

function gpaScanPaymentDetailArraysInObject(obj) {
    if (!obj || typeof obj !== 'object') return [];
    if (Array.isArray(obj)) return obj.length && gpaIsPaymentDetailRow(obj[0]) ? obj : [];
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const arr = obj[keys[i]];
        if (Array.isArray(arr) && arr.length && gpaIsPaymentDetailRow(arr[0])) return arr;
    }
    return [];
}

function RenderGpaModalItems(items) {
    const $body = $('#gpaModalItemsBody');
    if (!items || items.length === 0) {
        $body.html(
            '<tr><td colspan="11" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No bill lines found.</td></tr>'
        );
        return;
    }
    let html = '';
    items.forEach(function (row, idx) {
        const enriched = typeof window.gpaEnrichDetailRowPoCategory === 'function'
            ? window.gpaEnrichDetailRowPoCategory(row)
            : row;
        const billNoRaw = enriched.BillNo ?? enriched.billNo ?? enriched.MRNNo ?? enriched.Name ?? enriched.name ?? '';
        const billNo = EscHtml(billNoRaw !== null && `${billNoRaw}`.trim() !== '' ? billNoRaw : '—');
        const poNoRaw = typeof window.gpaResolvePoNoTextFromRow === 'function'
            ? window.gpaResolvePoNoTextFromRow(enriched)
            : gpaPoNoFromRecord(enriched);
        const poNo = EscHtml(poNoRaw !== '' ? poNoRaw : '—');
        const catRaw = gpaCategoryNameFromRecord(enriched);
        const category = EscHtml(catRaw !== '' ? catRaw : '—');
        const bdt = FmtDateDisplay(enriched.BillDate ?? enriched['Bill Date'] ?? enriched.billDate ?? enriched.ReceiveDate ?? enriched.receiveDate ?? '');
        const totalBill = FmtCurrency(
            enriched.BillAmount ?? enriched.billAmount ?? enriched.TotalBillAmountManual ?? enriched.totalBillAmountManual ?? enriched.Amount ?? 0
        );
        const dedRaw = enriched.Dedution ?? enriched.dedution ?? enriched.Deduction ?? enriched.deduction;
        const deduction = EscHtml(dedRaw !== undefined && dedRaw !== null && `${dedRaw}`.trim() !== '' ? String(dedRaw) : '—');
        const netNum = parseFloat(
            enriched.NetPayable ?? enriched.netPayable ?? enriched.PayableAmount ?? enriched.payableAmount
            ?? enriched.BillAmount ?? enriched.billAmount ?? enriched.TotalBillAmountManual ?? 0
        );
        const payRaw = gpaRowPaymentAmount(enriched);
        const payNum = payRaw != null ? parseFloat(payRaw) : (isNaN(netNum) ? 0 : netNum);
        const netPay = FmtCurrency(isNaN(netNum) ? 0 : netNum);
        const payAmt = FmtCurrency(isNaN(payNum) ? 0 : payNum);
        const projRaw = gpaProjectLabelFromRow(enriched);
        const subRaw = gpaSubProjectLabelFromRow(enriched);
        const proj = EscHtml(projRaw !== '' ? projRaw : '—');
        const subProj = EscHtml(subRaw !== '' ? subRaw : '—');
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td>' + poNo + '</td>' +
            '<td>' + category + '</td>' +
            '<td>' + proj + '</td>' +
            '<td>' + subProj + '</td>' +
            '<td class="text-center">' + EscHtml(bdt || '—') + '</td>' +
            '<td class="text-end">' + totalBill + '</td>' +
            '<td class="text-end">' + deduction + '</td>' +
            '<td class="text-end">' + netPay + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#667eea;">' + payAmt + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function SubmitApproval(action) {
    const poCode = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    const levelCode = parseInt($('#hfGpaLevelCode').val() || '0', 10);
    const remarks = ($('#gpaFrmRemarks').val() || '').trim();

    if (!poCode) {
        if (typeof toastr !== 'undefined') toastr.warning('No payment entry selected.');
        return;
    }
    if (action === 'Reject' && !remarks) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter remarks before rejecting.');
        $('#gpaFrmRemarks').trigger('focus');
        return;
    }

    const entryLabel = G_CurrentPayment ? String(getEntryNo(G_CurrentPayment)) : '';
    const isAppr = action === 'Approve';
    const hdrBg = isAppr
        ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
        : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
    const btnCls = isAppr ? 'btn-gpa-confirm-approve' : 'btn-gpa-confirm-reject';
    const btnTxt = isAppr
        ? '<i class="fa fa-check me-1"></i>Yes, Approve'
        : '<i class="fa fa-times me-1"></i>Yes, Reject';
    const msg = isAppr
        ? 'Are you sure you want to <strong>approve</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?'
        : 'Are you sure you want to <strong>reject</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?';

    $('#gpaConfirmTitle').text(isAppr ? 'Confirm Approval' : 'Confirm Rejection');
    $('#gpaConfirmModalHeader').attr('style', 'padding:12px 16px;border:none;' + hdrBg);
    $('#gpaConfirmMessage').html(msg);
    $('#gpaBtnConfirmAction')
        .attr('class', btnCls)
        .html(btnTxt)
        .off('click')
        .on('click', function () { ExecuteGpaApproval(poCode, levelCode, remarks, action); });

    $('#modalGpaConfirm').modal('show');
}

function ExecuteGpaApproval(paymentCode, levelCode, remarks, action) {
    CloseConfirmModal();

    if (typeof Showloader === 'function') Showloader();

    const serviceCall = action === 'Approve'
        ? GRNPaymentApprovalService.ApproveGRNPayment(paymentCode, levelCode, remarks)
        : GRNPaymentApprovalService.RejectGRNPayment(paymentCode, levelCode, remarks);

    serviceCall
        .then(function (response) {
            if (typeof HideLoader === 'function') HideLoader();
            const payload = unwrapGpaActionResponse(response) || response;
            const st = payload && (payload.Status ?? payload.status);
            const ok = payload && (
                st === 'Y' || st === 'Success' || st === 'success' ||
                payload.Success === true || payload.success === true || response === true
            );
            if (ok) {
                const serverMsg = (payload.Msg || payload.Message || payload.message || '').trim();
                if (typeof toastr !== 'undefined') {
                    toastr.success(serverMsg || ('Payment entry ' + (action === 'Approve' ? 'approved' : 'rejected') + ' successfully.'));
                }
                CloseDetailModal();
                LoadPaymentList();
            } else {
                const msg = (payload && (payload.Msg || payload.Message || payload.message)) ||
                    ('Failed to ' + action.toLowerCase() + ' payment entry.');
                if (typeof toastr !== 'undefined') toastr.error(msg);
            }
        })
        .catch(function () {
            if (typeof HideLoader === 'function') HideLoader();
            if (typeof toastr !== 'undefined') {
                toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' payment entry.');
            }
        });
}

function LoadGpaAttachmentsInline(masterCode) {
    const wrap = document.getElementById('gpaModalAttachList');
    if (!wrap) return;
    if (!masterCode || masterCode <= 0) {
        wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-paperclip me-1"></i>No attachments.</span>';
        return;
    }
    wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-spinner fa-spin me-1"></i>Loading attachments\u2026</span>';
    AttachmentControlService.GetAttachmentUploadFiles('GRNPaymentMaster', masterCode, '', 0)
        .then(function (response) {
            const rows = Array.isArray(response) ? response : [];
            if (rows.length === 0) {
                wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-paperclip me-1"></i>No attachments.</span>';
                return;
            }
            $('#gpaBtnModalAttachment').addClass('gpa-attach-has-files');
            let html = '<div style="display:flex;flex-direction:column;gap:6px;">';
            rows.forEach(function (item) {
                const name = EscHtml(item.DocumentName ?? item.documentName ?? '—');
                const particulars = EscHtml(item.DocumentParticulars ?? item.documentParticulars ?? '');
                const code = item.Code ?? item.code ?? 0;
                const ext = String(item.DocumentName ?? '').split('.').pop().toLowerCase();
                const iconMap = {
                    pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
                    xls: 'fa-file-excel', xlsx: 'fa-file-excel',
                    png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image',
                    zip: 'fa-file-archive', rar: 'fa-file-archive', txt: 'fa-file-alt'
                };
                const icon = iconMap[ext] || 'fa-file';
                html += '<div style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;">' +
                    '<i class="fa ' + icon + '" style="color:#667eea;font-size:1rem;flex-shrink:0;"></i>' +
                    '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:0.8rem;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>' +
                    (particulars ? '<div style="font-size:0.72rem;color:#64748b;">' + particulars + '</div>' : '') +
                    '</div>' +
                    '<a href="#" onclick="GpaDownloadAttachment(' + code + ',\'' + name + '\'); return false;" ' +
                    'style="flex-shrink:0;font-size:0.75rem;color:#667eea;font-weight:600;text-decoration:none;" title="Download">' +
                    '<i class="fa fa-download me-1"></i>Download</a>' +
                    '</div>';
            });
            html += '</div>';
            wrap.innerHTML = html;
        })
        .catch(function () {
            wrap.innerHTML = '<span style="font-size:0.78rem;color:#ef4444;"><i class="fa fa-exclamation-triangle me-1"></i>Could not load attachments.</span>';
        });
}

function GpaDownloadAttachment(code, fileName) {
    if (!code) return;
    if (typeof Showloader === 'function') Showloader();
    AttachmentControlService.DownloadAttachment(code)
        .then(function (blob) {
            if (typeof HideLoader === 'function') HideLoader();
            const ext = String(fileName).split('.').pop().toLowerCase();
            const viewable = ['txt', 'png', 'gif', 'jpeg', 'jpg', 'pdf'].includes(ext);
            const url = window.URL.createObjectURL(blob);
            if (viewable) {
                window.open(url, '_blank');
            } else {
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            window.URL.revokeObjectURL(url);
        })
        .catch(function () {
            if (typeof HideLoader === 'function') HideLoader();
            if (typeof toastr !== 'undefined') toastr.error('Failed to download attachment.');
        });
}

// ── Print helpers (self-contained, no dependency on GRNPaymentEntry.js) ──────
function gpaEscH(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gpaFmtIndian(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    return (remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree) + '.' + parts[1];
}

function gpaNumToWords(amount) {
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
    if (n >= 100000)   { w += twoD(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000)     { w += twoD(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100)      { w += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n > 0)         { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

function gpaGetSessionCo() {
    let companyName = '', companyAddr = '', companyTag = '';
    try {
        const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (ud && ud[0]) {
            companyName = ud[0].CompanyName || ud[0].CompanyNameForShow || '';
            companyAddr = ud[0].CompanyAddress || '';
            companyTag  = ud[0].BranchName || ud[0].CompanyTagLine || ud[0].TagLine || '';
        }
    } catch (e) { /* ignore */ }
    return { companyName, companyAddr, companyTag };
}

function PrintGPAVoucher(code, mode) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid payment entry.');
        return;
    }
    const base = gpaFindApprovalListRow(codeNum);

    const preloadEmp = typeof window.gpaPreloadEmployeeListForPrint === 'function'
        ? window.gpaPreloadEmployeeListForPrint()
        : Promise.resolve();

    Promise.all([
        preloadEmp,
        GRNPaymentEntryDataService.GetGRNPaymentApprovalByCode(codeNum).catch(function () { return null; }),
        GRNPaymentApprovalService.GetGRNPaymentDetail(codeNum).catch(function () { return null; }),
    ]).then(function (bundle) {
            const entryRes = bundle[1];
            const res = bundle[2];
            let master = null;
            let details = [];

            if (entryRes && typeof window.gpaPeelGrnPaymentApiRoot === 'function' && typeof window.gpaFirstMasterFromApi === 'function') {
                const entryRoot = window.gpaPeelGrnPaymentApiRoot(entryRes);
                master = window.gpaFirstMasterFromApi(entryRoot);
                if (typeof window.gpaExtractGRNPaymentDetails === 'function') {
                    details = window.gpaExtractGRNPaymentDetails(entryRoot, master) || [];
                }
            }

            const root = res?.Data ?? res?.data ?? res;
            if (!master) {
                if (Array.isArray(root)) {
                    details = root;
                    master = base;
                } else if (root && typeof root === 'object') {
                    const masterSrc = root.Master ?? root.master;
                    master = Array.isArray(masterSrc) ? masterSrc[0] : (masterSrc || null);
                    const detSrc = root.Detail ?? root.detail ?? root.Details ?? root.details;
                    if (Array.isArray(detSrc) && detSrc.length) details = detSrc;
                }
            }
            if (!master && base) master = Object.assign({}, base);
            if (!master) master = {};
            if (base && typeof window.gpaOverlayMasterFromListRow === 'function') {
                master = window.gpaOverlayMasterFromListRow(master, base);
            } else if (base) {
                master = Object.assign({}, master, base);
            }

            const co = gpaGetSessionCo();
            const { companyName, companyAddr, companyTag } = co;

            let creditTo = '';
            let vendorTypePrint = '';
            if (typeof window.gpaResolvePrintCreditAndVendorType === 'function') {
                const printParty = window.gpaResolvePrintCreditAndVendorType(master, base, null);
                creditTo = printParty.creditTo || '';
                vendorTypePrint = printParty.vendorType || '';
            } else {
                const isEmp = typeof window.gpaMasterIsEmployeePayment === 'function'
                    && (window.gpaMasterIsEmployeePayment(master) || window.gpaMasterIsEmployeePayment(base));
                if (isEmp) {
                    vendorTypePrint = 'Employee';
                    if (typeof window.gpaLookupEmployeeNameForPrint === 'function') {
                        creditTo = window.gpaLookupEmployeeNameForPrint(master, base) || '';
                    }
                    if (!creditTo) {
                        creditTo = String(
                            master.EmployeeName ?? master.employeeName
                            ?? master.Employee ?? master.employee
                            ?? master.MarketingManMaster ?? master.marketingManMaster
                            ?? base?.EmployeeName ?? base?.employeeName
                            ?? base?.Employee ?? base?.employee
                            ?? base?.MarketingManMaster ?? base?.marketingManMaster
                            ?? base?.['Party Name'] ?? base?.PartyName ?? ''
                        ).trim();
                    }
                } else {
                    vendorTypePrint = 'Party';
                    const partyRaw = getPartyName(master) !== '—' ? getPartyName(master) : (base ? getPartyName(base) : '');
                    creditTo = String(partyRaw || '');
                }
            }
            const voucherNo = String(master.EntryNo ?? master.entryNo ?? getEntryNo(master) ?? '');
            const refNo = String(master.RefNo ?? master.refNo ?? '');
            const voucherDate = FmtDateDisplay(getEntryDate(master) || (base ? getEntryDate(base) : ''));
            const amt = parseFloat(String(getTotalAmount(master) || (base ? getTotalAmount(base) : 0)).replace(/,/g, '')) || 0;
            const narration = String(master.Narration ?? master.narration ?? '');
            const bankName = String(master.BankName ?? master.bankName ?? '');
            const paymentFor = String(
                master.PaymentFor ?? master.paymentFor ?? master.PaymentForName ?? master.paymentForName
                ?? master.ProjectCategory ?? master.projectCategory ?? ''
            );

            let detailsLines = '';
            (details || []).forEach(function (row, idx) {
                const billNo = row.BillNo ?? row.billNo ?? row.Name ?? row.name ?? '';
                const pay = row.PaymentAmount ?? row.paymentAmount ?? '';
                const poNo = gpaPoNoFromRecord(row);
                const category = gpaCategoryNameFromRecord(row);
                const proj = row.ProjectName ?? row.projectName ?? row.Project ?? row.project ?? '';
                const site = row.SiteName ?? row.siteName ?? row.Site ?? row.site ?? '';
                detailsLines += '<div style="margin-bottom:6px;">'
                    + '<b>Line ' + (idx + 1) + '</b>'
                    + (billNo ? ' &mdash; Bill: ' + gpaEscH(String(billNo)) : '')
                    + (poNo ? ' &mdash; PO: ' + gpaEscH(String(poNo)) : '')
                    + (category ? ' &mdash; Category: ' + gpaEscH(String(category)) : '')
                    + (pay !== '' && pay != null ? ' &mdash; Paid: &#8377;' + gpaFmtIndian(pay) : '')
                    + (proj ? '<br><span>Project: ' + gpaEscH(String(proj)) + '</span>' : '')
                    + (site ? '<br><span>Site: ' + gpaEscH(String(site)) + '</span>' : '')
                    + '</div>';
            });
            const detailsBlock =
                (narration ? '<div style="margin-bottom:8px;"><b>Narration:</b><br>' + gpaEscH(narration) + '</div>' : '')
                + (detailsLines || '<span style="color:#666;">—</span>')
                + '<div style="margin-top:10px;font-weight:700;">Amount (figures): &#8377; ' + gpaFmtIndian(amt) + '</div>'
                + '<div style="margin-top:4px;font-size:9pt;">Amount (words): ' + gpaNumToWords(Math.round(amt)) + '</div>';

            const css = '@page{size:A4 portrait;margin:10mm 12mm 14mm 12mm;}'
                + '*{box-sizing:border-box;margin:0;padding:0;}'
                + 'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;background:#fff;}'
                + '.no-print{margin-bottom:5mm;}'
                + '@media print{.no-print{display:none!important;}}'
                + '.pv-wrap{max-width:780px;margin:0 auto;border:2px solid #000;padding:12px 14px;}'
                + '.pv-co{text-align:center;font-size:14pt;font-weight:800;margin-bottom:2px;}'
                + '.pv-tag{text-align:center;font-size:8.5pt;margin-bottom:4px;color:#222;}'
                + '.pv-addr{text-align:center;font-size:9pt;margin-bottom:10px;line-height:1.35;}'
                + '.pv-title{text-align:center;font-weight:800;font-size:11pt;border:1px solid #000;padding:5px;margin:10px 0 12px;letter-spacing:0.04em;}'
                + 'table.pv-t{width:100%;border-collapse:collapse;margin-bottom:0;}'
                + 'table.pv-t td{border:1px solid #000;padding:6px 8px;font-size:9.5pt;vertical-align:top;}'
                + 'table.pv-t td.lbl{font-weight:700;width:22%;background:#fafafa;}'
                + '.pv-details{min-height:120px;border:1px solid #000;border-top:none;padding:8px;font-size:9.5pt;}'
                + '.pv-sig{display:flex;margin-top:14px;gap:8px;}'
                + '.pv-sig > div{flex:1;border:1px solid #000;min-height:72px;padding:6px;text-align:center;font-weight:700;font-size:9pt;}';

            const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment Voucher</title><style>' + css + '</style></head><body>'
                + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 8px;">'
                + '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
                + '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
                + '</div>'
                + '<div class="pv-wrap">'
                + '<div class="pv-co">' + gpaEscH(companyName || 'Company Name') + '</div>'
                + (companyTag  ? '<div class="pv-tag">'  + gpaEscH(companyTag)  + '</div>' : '')
                + (companyAddr ? '<div class="pv-addr">Address: ' + gpaEscH(companyAddr) + '</div>' : '')
                + '<div class="pv-title">Payment Voucher</div>'
                + '<table class="pv-t" role="presentation">'
                + '<tr><td class="lbl">Voucher No</td><td>' + gpaEscH(voucherNo) + '</td>'
                + '<td class="lbl" style="width:18%;">Voucher Date</td><td style="width:22%;">' + gpaEscH(voucherDate) + '</td></tr>'
                + '<tr><td class="lbl">Reference No</td><td colspan="3">' + gpaEscH(refNo) + '</td></tr>'
                + (bankName ? '<tr><td class="lbl">Bank Name</td><td colspan="3">' + gpaEscH(bankName) + '</td></tr>' : '')
                + '<tr><td class="lbl">Credit to</td><td colspan="3">' + gpaEscH(creditTo) + '</td></tr>'
                + (vendorTypePrint ? '<tr><td class="lbl">Vendor Type</td><td colspan="3">' + gpaEscH(vendorTypePrint) + '</td></tr>' : '')
                + '<tr><td class="lbl">Payment for</td><td colspan="3">' + gpaEscH(paymentFor || '—') + '</td></tr>'
                + '</table>'
                + '<div style="border:1px solid #000;border-top:none;padding:4px 8px;font-weight:700;font-size:9.5pt;">Details</div>'
                + '<div class="pv-details">' + detailsBlock + '</div>'
                + '<div class="pv-sig"><div>Made By</div><div>Approved By</div></div>'
                + '</div></body></html>';

            const win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
            if (!win) {
                if (typeof toastr !== 'undefined') toastr.warning('Please allow popups for this site to use the print feature.');
                return;
            }
            win.document.write(html);
            win.document.close();
            if (mode === 'print') setTimeout(function () { win.focus(); win.print(); }, 600);
        })
        .catch(function (err) {
            console.error('PrintGPAVoucher', err);
            if (typeof toastr !== 'undefined') toastr.error('Error loading payment entry for print.');
        });
}

/** Same print preview as Payment Entry (full voucher: PO, Payment for, project/site, advance, etc.). */
function PrintGRNPaymentFromApproval(code, mode) {
    const codeNum = parseInt(code, 10) || 0;
    if (!codeNum) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid payment entry.');
        return;
    }
    const approvalRow = gpaFindApprovalListRow(codeNum);
    if (typeof window.PrintGRNPaymentVoucher === 'function') {
        window.PrintGRNPaymentVoucher(codeNum, mode || 'preview', approvalRow);
        return;
    }
    PrintGPAVoucher(codeNum, mode || 'preview');
}

function PrintGPAFromDetail(mode) {
    const code = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    if (!code) {
        if (typeof toastr !== 'undefined') toastr.warning('No payment entry selected.');
        return;
    }
    PrintGRNPaymentFromApproval(code, mode || 'preview');
}

function InitGRNPaymentAttachmentControl(code, entryNo, entryDate) {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    const url = appBase + 'CustomControl/AttachmentControl';
    $('#GRNPaymentApproval_AttachmentControlmodal').load(url, {
        MasterTableName: 'GRNPaymentMaster',
        MasterTableCode: code,
        DetailTableName: '',
        DetailTableCode: 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: 'all'
    });
}

function OpenGRNPaymentApprovalAttachment(code) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    const payment = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === codeNum; });
    const entryNo = payment ? (getEntryNo(payment) || 0) : 0;
    const entryDate = payment ? (getEntryDate(payment) || '') : '';
    const rawDate = entryDate ? String(entryDate).substring(0, 10) : '';
    InitGRNPaymentAttachmentControl(codeNum, entryNo, rawDate);
}

function OpenGRNPaymentApprovalAttachmentFromModal() {
    const code = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    if (!code) return;
    const payment = G_CurrentPayment || G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === code; });
    const entryNo = payment ? (getEntryNo(payment) || 0) : 0;
    const entryDate = payment ? (getEntryDate(payment) || '') : '';
    const rawDate = entryDate ? String(entryDate).substring(0, 10) : '';
    InitGRNPaymentAttachmentControl(code, entryNo, rawDate);
}

function CloseDetailModal() {
    $('#modalGpaDetail').modal('hide');
    const wrap = document.getElementById('gpaModalAttachList');
    if (wrap) wrap.innerHTML = '';
    G_CurrentPayment = null;
}

function CloseConfirmModal() {
    $('#modalGpaConfirm').modal('hide');
}

function ShowGpaLoading(show) {
    const loadEl = document.getElementById('gpaPendingLoading');
    const listEl = document.getElementById('gpaPendingList');
    if (loadEl) loadEl.style.display = show ? '' : 'none';
    if (listEl) listEl.style.display = show ? 'none' : '';
}

function ShowGpaEmpty(show) {
    const el = document.getElementById('gpaPendingEmpty');
    if (el) el.style.display = show ? '' : 'none';
}

function NavigateToGRNService() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/GRNPaymentApproval/GRNPaymentApproval?ModuleDesp=Payment%20Entry';
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.gpaPreloadEmployeeListForPrint === 'function') {
        window.gpaPreloadEmployeeListForPrint().catch(function (e) {
            console.warn('gpaPreloadEmployeeListForPrint', e);
        });
    }
    const isApprovalListPage = !!document.getElementById('gpaFromDate');
    if (!isApprovalListPage) return;

    InitDates()
        .then(function () {
            LoadPaymentList();
        })
        .catch(function (err) {
            console.error('InitDates failed', err);
            LoadPaymentList();
        });

    const searchEl = document.getElementById('gpaLstSearch');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            FilterGpaCards(this.value);
        });
    }
});

window.LoadPaymentList = LoadPaymentList;
window.OpenDetailModal = OpenDetailModal;
window.SubmitApproval = SubmitApproval;
window.CloseDetailModal = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.NavigateToGRNService = NavigateToGRNService;
window.ToggleGpaPendingOnMeFilter = ToggleGpaPendingOnMeFilter;
window.GpaDownloadAttachment = GpaDownloadAttachment;
window.PrintGPAVoucher = PrintGPAVoucher;
window.PrintGRNPaymentFromApproval = PrintGRNPaymentFromApproval;
window.PrintGPAFromDetail = PrintGPAFromDetail;
window.OpenGRNPaymentApprovalAttachment = OpenGRNPaymentApprovalAttachment;
window.OpenGRNPaymentApprovalAttachmentFromModal = OpenGRNPaymentApprovalAttachmentFromModal;
