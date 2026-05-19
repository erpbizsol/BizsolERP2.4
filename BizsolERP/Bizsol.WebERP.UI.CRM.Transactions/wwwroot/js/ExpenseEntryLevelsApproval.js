import { ExpenseEntryLevelsApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryLevelsApprovalService.js';
import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

function CheckRight(optionName) {
    const FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight('Expense Entry', optionName, 'Y', FinYear);
}

let G_EntryList = [];
let G_CurrentEntry = null;

/** Detail row keys seen from approval / SHOWDATA APIs for AllowAmount column. */
const EEA_APPROVED_AMOUNT_KEYS = ['Approved', 'Approved Amount', 'AllowAmount', 'ApprovedAmount'];

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

function InitDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromEl = document.getElementById('eeaFromDate');
    const toEl = document.getElementById('eeaToDate');
    if (fromEl && !fromEl.value) fromEl.value = FmtDateInput(firstDay);
    if (toEl && !toEl.value) toEl.value = FmtDateInput(today);
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

/** Editable in modal while approval is pending (saved with Approve via ExpenseEntryApprovalHistory). */
function isEeaApprovedAmountEditable() {
    return !!G_CurrentEntry && getApprovalStatus(G_CurrentEntry).toLowerCase() === 'pending';
}

function eeaNumFromRow(row, keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const v = row[arr[i]];
        if (v != null && v !== '') {
            const n = parseFloat(v);
            if (!isNaN(n)) return n;
        }
    }
    return 0;
}

function eeaIntFromRow(row, keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const v = row[arr[i]];
        if (v != null && v !== '') {
            const n = parseInt(v, 10);
            if (!isNaN(n)) return n;
        }
    }
    return 0;
}

/** ExpenseEntryDetail.Code — not ExpenseEntryMaster.Code (both can appear as "Code"). */
function eeaDetailLineCodeFromRow(row, masterCode) {
    if (!row || typeof row !== 'object') return 0;
    const mc = parseInt(masterCode, 10) || 0;
    const keys = [
        'ExpenseEntryDetail_Code', 'ExpenseEntryDetailCode', 'ExpenseEntryDetailCode',
        'Detail Line Code', 'Detail_Line_Code',
        'Detail_Code', 'DetailCode', 'detailCode', 'ExpenseDetail_Code', 'Line_Code', 'LineCode'
    ];
    for (let i = 0; i < keys.length; i++) {
        const n = parseInt(row[keys[i]], 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    const code = parseInt(row.Code ?? row.code, 10);
    if (Number.isFinite(code) && code > 0 && code !== mc) return code;
    return 0;
}

function normalizeEeaDetailLines(lines, masterCode) {
    return (lines || []).map(function (row) {
        const r = Object.assign({}, row);
        const dc = eeaDetailLineCodeFromRow(r, masterCode);
        if (dc > 0) {
            r.ExpenseEntryDetail_Code = dc;
            if (!r.Code || parseInt(r.Code, 10) === parseInt(masterCode, 10)) r.Code = dc;
        }
        return r;
    });
}

function eeaMatchDetailLineForEnrich(line, apiLine) {
    const headA = String(line['Expense Head'] ?? line.ExpenseHead ?? line.ExpenseDesp ?? '').trim().toLowerCase();
    const headB = String(apiLine['Expense Head'] ?? apiLine.ExpenseDesp ?? '').trim().toLowerCase();
    if (headA && headB && headA !== headB) return false;
    const pmA = parseInt(line.ProjectMaster_Code, 10) || 0;
    const pmB = parseInt(apiLine.ProjectMaster_Code, 10) || 0;
    if (pmA && pmB && pmA !== pmB) return false;
    const spA = parseInt(line.SubProjectMaster_Code, 10) || 0;
    const spB = parseInt(apiLine.SubProjectMaster_Code, 10) || 0;
    if (spA && spB && spA !== spB) return false;
    const expA = eeaNumFromRow(line, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
    const expB = eeaNumFromRow(apiLine, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
    if (expA > 0 && expB > 0 && Math.abs(expA - expB) > 0.01) return false;
    return true;
}

/** Fill ExpenseEntryDetail_Code from GetExpenseEntryDetails when approval API omits line codes. */
function ensureEeaDetailLinesWithCodes(masterCode, lines) {
    let normalized = normalizeEeaDetailLines(lines, masterCode);
    const allHaveCode = normalized.length > 0 && normalized.every(function (l) {
        return eeaDetailLineCodeFromRow(l, masterCode) > 0;
    });
    if (allHaveCode) return Promise.resolve(normalized);

    const person = G_CurrentEntry ? getPersonName(G_CurrentEntry) : '';
    if (!person || person === '—') return Promise.resolve(normalized);

    return ExpenseEntryService.GetExpenseEntryDetails(person, masterCode).then(function (resp) {
        const apiLines = (resp && resp.ExpenseEntryDetail) ? resp.ExpenseEntryDetail : [];
        if (!apiLines.length) return normalized;

        const used = new Set();
        return normalized.map(function (line) {
            if (eeaDetailLineCodeFromRow(line, masterCode) > 0) return line;
            let matchIdx = -1;
            for (let i = 0; i < apiLines.length; i++) {
                if (used.has(i)) continue;
                if (!eeaMatchDetailLineForEnrich(line, apiLines[i])) continue;
                if (eeaDetailLineCodeFromRow(apiLines[i], masterCode) <= 0) continue;
                matchIdx = i;
                break;
            }
            if (matchIdx < 0) return line;
            used.add(matchIdx);
            const dc = eeaDetailLineCodeFromRow(apiLines[matchIdx], masterCode);
            const r = Object.assign({}, line);
            r.ExpenseEntryDetail_Code = dc;
            r.Code = dc;
            return r;
        });
    }).catch(function () {
        return normalized;
    });
}

/** Build TVP rows for ExpenseEntryApprovalHistory (changed approved amounts only). */
function buildEeaApprovalHistoryRows(lines, masterCode, levelCode) {
    const history = [];
    const mc = parseInt(masterCode, 10) || 0;
    const lc = parseInt(levelCode, 10) || 0;

    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const $in = $('#eeaModalItemsBody .eea-line-approved[data-detail-idx="' + idx + '"]');
        if (!$in.length) continue;

        const approvedVal = parseFloat(String($in.val()).replace(/,/g, ''));
        if (isNaN(approvedVal) || approvedVal < 0) {
            return { error: 'Please enter a valid approved amount on line ' + (idx + 1) + '.', history: [] };
        }
        const expended = eeaNumFromRow(line, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
        if (approvedVal > expended) {
            return { error: 'Approved amount cannot exceed expended amount on line ' + (idx + 1) + '.', history: [] };
        }

        const oldVal = eeaNumFromRow(line, EEA_APPROVED_AMOUNT_KEYS);
        if (Math.abs(approvedVal - oldVal) < 0.0001) continue;

        const detailCode = parseInt($in.attr('data-detail-code'), 10)
            || eeaDetailLineCodeFromRow(line, masterCode);
        if (!detailCode) {
            return { error: 'Expense line ' + (idx + 1) + ' has no detail code; reload the entry and try again.', history: [] };
        }

        history.push({
            ExpenseEntryApprovalConfiguration_Code: lc,
            ExpenseEntryMaster_Code: mc,
            ExpenseEntryDetail_Code: detailCode,
            OldApprovedAmount: oldVal,
            NewApprovedAmount: approvedVal
        });
    }
    return { error: '', history: history };
}

function EscHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeListResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.Data)) return data.Data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

function getExpenseMasterCode(p) {
    const c = p.Code ?? p.ExpenseEntryMaster_Code ?? p.code;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function getEntryNo(p) {
    return p['Entry No'] ?? p.EntryNo ?? p.Entry_No ?? p['PO No'] ?? '—';
}

function getPersonName(p) {
    return p['Person Name'] ?? p.PersonName ?? p['Party Name'] ?? p.PartyName ?? '—';
}

function getEntryDate(p) {
    return p['Entry Date'] ?? p.EntryDate ?? p['PO Date'] ?? '';
}

function eeaEscapeForSingleQuotedJs(s) {
    return String(s)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n');
}

function eeaHasAttachmentYes(entry) {
    if (!entry) return false;
    const v = entry.HasAttach != null ? entry.HasAttach
        : entry.hasAttach != null ? entry.hasAttach
        : entry.HasAttachment != null ? entry.HasAttachment
        : entry['Has Attachment'];
    return String(v || '').trim().toUpperCase() === 'Y';
}

function eeaRawEntryNoForAttach(entry) {
    if (!entry) return '';
    const n = getEntryNo(entry);
    return n === '—' ? '' : String(n);
}

function eeaRawEntryDateForAttach(entry) {
    const d = getEntryDate(entry);
    if (!d) return '';
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return FmtDateInput(dt);
    return s.length >= 10 ? s.substring(0, 10) : '';
}

/** Attachment control expects ISO date (same as ExpenseEntryDetail). */
function eeaEntryDateParamForAttachmentControl(entry) {
    const raw = eeaRawEntryDateForAttach(entry);
    if (!raw) return '';
    const dt = new Date(raw);
    return !isNaN(dt.getTime()) ? dt.toISOString() : '';
}

/** Same as PO Level Approval / PO Store: full upload UI (drag-drop, browse, save). */
function eeaGetAttachmentControlMode() {
    return 'all';
}

/** Normalize API result so attachment grid never receives null / non-array (page-scoped patch). */
function eeaPatchAttachmentServiceForPage() {
    if (AttachmentControlService._eeaGetFilesPatched) return;
    const origGet = AttachmentControlService.GetAttachmentUploadFiles;
    AttachmentControlService.GetAttachmentUploadFiles = function (masterTableName, masterTableCode, detailTableName, detailTableCode) {
        return Promise.resolve(origGet.call(AttachmentControlService, masterTableName, masterTableCode, detailTableName, detailTableCode))
            .then(function (response) {
                if (Array.isArray(response)) return response;
                if (response && Array.isArray(response.Data)) return response.Data;
                if (response && Array.isArray(response.data)) return response.data;
                return [];
            });
    };
    AttachmentControlService._eeaGetFilesPatched = true;
}

function InitEeaAttachmentControl(masterCode, entryNo, entryDate, mode) {
    eeaPatchAttachmentServiceForPage();
    const url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#ExpenseEntryLevelsApproval_AttachmentControlmodal').load(url, {
        MasterTableName: 'ExpenseEntryMaster',
        MasterTableCode: parseInt(masterCode, 10) || 0,
        DetailTableName: '',
        DetailTableCode: 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: mode || 'all'
    });
}

function OpenEeaApprovalAttachment(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid record. Cannot open attachments.');
        return;
    }
    const entry = G_EntryList.find(function (p) { return getExpenseMasterCode(p) === masterCode; })
        || (G_CurrentEntry && getExpenseMasterCode(G_CurrentEntry) === masterCode ? G_CurrentEntry : null);
    const en = entryNo != null && String(entryNo) !== '' ? entryNo : (entry ? eeaRawEntryNoForAttach(entry) : '');
    const ed = entryDate != null && String(entryDate) !== ''
        ? entryDate
        : (entry ? eeaEntryDateParamForAttachmentControl(entry) : '');
    InitEeaAttachmentControl(masterCode, en, ed, eeaGetAttachmentControlMode());
}

function OpenEeaApprovalAttachmentFromModal() {
    const code = parseInt($('#hfEeaEntryCode').val() || '0', 10);
    const entryNo = $('#hfEeaAttachEntryNo').val() || '';
    const entryDate = $('#hfEeaAttachEntryDate').val() || '';
    OpenEeaApprovalAttachment(code, entryNo, entryDate);
}

function syncEeaModalAttachmentButton(entry) {
    if (!entry) return;
    $('#hfEeaAttachEntryNo').val(String(eeaRawEntryNoForAttach(entry) || ''));
    $('#hfEeaAttachEntryDate').val(eeaEntryDateParamForAttachmentControl(entry) || '');
    $('#btnEeaModalAttachment').toggleClass('eea-attach-has-files', eeaHasAttachmentYes(entry));
}

function getTotalAmount(p) {
    const v = p['Total Expended Amount'] ?? p['Total Amount'] ?? p.TotalAmount ?? p.Amount ?? 0;
    return v;
}

function getTotalAllowedAmount(p) {
    const v = p['Total Allowed Amount'] ?? p.TotalAllowedAmount ?? p.AllowedAmount ?? 0;
    return v;
}

function getApprovalStatus(p) {
    const raw = (p.ApprovalStatus ?? p.Status ?? p.Approval_Status ?? 'Pending').toString().trim();
    if (raw === 'N' || raw.toLowerCase() === 'pending') return 'Pending';
    if (raw === 'Y' || raw.toLowerCase() === 'approved') return 'Approved';
    if (raw === 'R' || raw.toLowerCase() === 'rejected') return 'Rejected';
    return raw || 'Pending';
}

function getLevelCode(p) {
    const c = p.LevelCode ?? p.Level_Code ?? p.ApprovalLevel_Code ?? 0;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

/** Same idea as GRN Payment Approval: API may send LevelDetails as JSON string or array. */
function parseLevelDetailsToArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return [];
        try {
            const j = JSON.parse(t);
            if (Array.isArray(j)) return j;
            if (j && Array.isArray(j.Data)) return j.Data;
            if (j && Array.isArray(j.data)) return j.data;
            if (j && Array.isArray(j.Levels)) return j.Levels;
            if (j && Array.isArray(j.levels)) return j.levels;
            return [];
        } catch (e) {
            return [];
        }
    }
    if (typeof v === 'object' && Array.isArray(v.LevelDetails)) return v.LevelDetails;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (Array.isArray(v.Data)) return v.Data;
        if (Array.isArray(v.data)) return v.data;
        if (Array.isArray(v.Levels)) return v.Levels;
        if (Array.isArray(v.levels)) return v.levels;
    }
    return [];
}

function getLevelRowRemarks(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const r = lvlInfo.Remarks ?? lvlInfo.Remark ?? lvlInfo.ApprovalRemarks ?? lvlInfo.LevelRemarks
        ?? lvlInfo.Comments ?? lvlInfo.RejectionRemarks;
    const s = r != null ? String(r).trim() : '';
    return s;
}

/** API / config may use Description, LevelDesc, LevelDesp, or LevelName for the same label (GRN pattern). */
function pickLevelRowTitleText(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const c = lvlInfo.Description ?? lvlInfo.description
        ?? lvlInfo.LevelDesc ?? lvlInfo.LevelDesp
        ?? lvlInfo.levelDesc ?? lvlInfo.levelDesp
        ?? lvlInfo.LevelName ?? lvlInfo.levelName
        ?? lvlInfo.LevelDescription ?? lvlInfo.levelDescription;
    const s = c != null ? String(c).trim() : '';
    return s;
}

function getLevelRowDisplayTitle(lvlInfo, levelNo) {
    const t = pickLevelRowTitleText(lvlInfo);
    if (t) return t;
    return 'Level ' + levelNo;
}

function levelNoFromRow(r) {
    if (!r || typeof r !== 'object') return 0;
    const keys = ['LevelNo', 'Level', 'LevelOrder', 'ApprovalLevelNo', 'Level_No', 'LevelIndex',
        'SrNo', 'SNo', 'Sequence', 'OrderNo', 'RowNo', 'LineNo'];
    for (let i = 0; i < keys.length; i++) {
        const v = r[keys[i]];
        if (v == null || v === '') continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

/** Match level row to step 1..n: by LevelNo first, else array order (same as GRN Payment Approval). */
function getLevelRowByStep(levels, stepIndex) {
    const arr = Array.isArray(levels) ? levels : [];
    const hit = arr.find(function (l) { return levelNoFromRow(l) === stepIndex; });
    if (hit) return hit;
    if (stepIndex >= 1 && stepIndex <= arr.length) return arr[stepIndex - 1];
    return null;
}

function getCurrentLevelRowForEea(p) {
    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    return getLevelRowByStep(parseLevelDetailsToArray(p.LevelDetails), cur);
}

/**
 * After GetExpenseEntryApprovalDetail, master may overwrite list LevelDetails with [] or lose Description.
 * Merge list row with API row by LevelNo (same as GRN Payment Approval).
 */
function mergeLevelDetailsLists(fromList, fromApi) {
    const a = Array.isArray(fromList) ? fromList : [];
    const b = Array.isArray(fromApi) ? fromApi : [];
    if (!b.length) return a.slice();
    if (!a.length) return b.slice();

    const map = new Map();
    a.forEach(function (row, idx) {
        let n = levelNoFromRow(row);
        if (n < 1) n = idx + 1;
        map.set(n, { ...row });
    });
    b.forEach(function (row, idx) {
        let n = levelNoFromRow(row);
        if (n < 1) n = idx + 1;
        const prev = map.get(n) || {};
        const next = { ...prev, ...row };
        next.LevelDesc = pickLevelRowTitleText(row) || pickLevelRowTitleText(prev)
            || row.LevelDesc || prev.LevelDesc || row.LevelName || prev.LevelName || '';
        next.Remarks = getLevelRowRemarks(row) || getLevelRowRemarks(prev) || '';

        const hasApprover = function (x) { return x && String(x.ApproverName ?? x.UserName ?? '').trim() !== ''; };
        if (!hasApprover(row) && hasApprover(prev)) {
            next.ApproverName = prev.ApproverName;
            next.UserName = prev.UserName;
        }
        const hasDate = function (x) { return x && String(x.ApprovedOn ?? '').trim() !== ''; };
        if (!hasDate(row) && hasDate(prev)) {
            next.ApprovedOn = prev.ApprovedOn;
        }

        map.set(n, next);
    });
    return [...map.keys()].sort(function (x, y) { return x - y; }).map(function (k) { return map.get(k); });
}

function NormalizeEntryList(list) {
    return (list || []).map(function (row) {
        const p = { ...row };
        p.LevelDetails = parseLevelDetailsToArray(p.LevelDetails);
        if (!p.TotalLevels && p.LevelDetails.length > 0) {
            p.TotalLevels = p.LevelDetails.length;
        }
        return p;
    });
}

function LoadEntryList() {
    const fromDate = document.getElementById('eeaFromDate')?.value || '';
    const toDate = document.getElementById('eeaToDate')?.value || '';
    const status = document.getElementById('eeaDdlStatus')?.value || 'A';

    ShowEeaLoading(true);
    ShowEeaEmpty(false);
    const container = document.getElementById('eeaPendingList');
    if (container) container.innerHTML = '';

    ExpenseEntryLevelsApprovalService.GetPendingExpenseEntryList(fromDate, toDate, status)
        .then(function (data) {
            ShowEeaLoading(false);
            G_EntryList = NormalizeEntryList(normalizeListResponse(data));
            UpdateEeaStatChips();
            RenderEntryCards(G_EntryList);
        })
        .catch(function (err) {
            console.error('LoadEntryList', err);
            ShowEeaLoading(false);
            G_EntryList = [];
            if (container) container.innerHTML = '';
            ShowEeaEmpty(true);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error loading expense entry approval list.');
            }
        });
}

function UpdateEeaStatChips() {
    const pending = G_EntryList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'pending';
    }).length;
    const approved = G_EntryList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'approved';
    }).length;
    const elP = document.getElementById('eeaStatPending');
    const elO = document.getElementById('eeaStatApproved');
    if (elP) elP.textContent = pending > 0 ? String(pending) : (G_EntryList.length ? '0' : '—');
    if (elO) elO.textContent = approved > 0 ? String(approved) : (G_EntryList.length ? '0' : '—');
}

function RenderEntryCards(list) {
    const container = document.getElementById('eeaPendingList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowEeaEmpty(true);
        return;
    }
    ShowEeaEmpty(false);
    container.innerHTML = list.map(function (p) { return BuildEntryCard(p); }).join('');
}

/**
 * Pending only: current level remarks, else prior level (carry-forward for chip / flow when L2 row empty).
 */
function getEeaListCardRemarkFromLevels(p) {
    const levels = parseLevelDetailsToArray(p.LevelDetails);
    if (!levels.length) return '';
    if (getApprovalStatus(p).toLowerCase() !== 'pending') return '';

    const row = getCurrentLevelRowForEea(p);
    const r = row ? getLevelRowRemarks(row) : '';
    if (r && String(r).trim()) return String(r).trim();

    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    if (cur > 1) {
        const prevRow = getLevelRowByStep(levels, cur - 1);
        const pr = prevRow ? getLevelRowRemarks(prevRow) : '';
        if (pr && String(pr).trim()) return String(pr).trim();
    }
    return '';
}

/**
 * Fully approved → layer chip shows “Approved”; pending → prior/current remarks then level desc (GRN-style).
 */
function getEeaCardLevelChipLabel(p) {
    const status = getApprovalStatus(p);
    const st = status.toLowerCase();
    if (st === 'approved') return 'Approved';
    if (st === 'rejected') return 'Rejected';
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 1, 10) || 1;
    let cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    if (cur < 1) cur = 1;
    if (totalLvl > 0 && cur > totalLvl) return 'Approved';

    const rmk = getEeaListCardRemarkFromLevels(p);
    if (rmk) return rmk;

    const masterDesc = String(p.CurrentLevelDesc ?? '').trim();
    if (masterDesc) return masterDesc;

    const row = getCurrentLevelRowForEea(p);
    const rowDesc = row ? pickLevelRowTitleText(row) : '';
    if (rowDesc) return rowDesc;

    return 'L' + cur;
}

function BuildEntryCard(p) {
    const code = getExpenseMasterCode(p);
    const entryPlain = String(getEntryNo(p));
    const personPlain = String(getPersonName(p));
    const entryNo = EscHtml(entryPlain);
    const person = EscHtml(personPlain);
    const entryDate = FmtDateDisplay(getEntryDate(p));
    const expendedAmt = FmtCurrency(getTotalAmount(p));
    const allowedAmt = FmtCurrency(getTotalAllowedAmount(p));
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 3, 10) || 1;
    const curLvlNo = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const lvlDesc = EscHtml(getEeaCardLevelChipLabel(p));
    const status = getApprovalStatus(p);

    let statusClr, statusBg;
    if (status.toLowerCase() === 'approved') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (status.toLowerCase() === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildEeaCardStepper(curLvlNo, totalLvl, status);
    const isPending = status.toLowerCase() === 'pending';
    const actionBtn = isPending
        ? `<button type="button" class="btn-gpa-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button type="button" class="btn-gpa-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const searchKey = (personPlain + ' ' + entryPlain).toLowerCase();

    const rawEntryNoAtt = eeaRawEntryNoForAttach(p);
    const rawEntryDateAtt = eeaEntryDateParamForAttachmentControl(p);
    const escNo = eeaEscapeForSingleQuotedJs(rawEntryNoAtt);
    const escDt = eeaEscapeForSingleQuotedJs(rawEntryDateAtt);
    const attachBg = eeaHasAttachmentYes(p)
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const attachBtns =
        `<div class="eea-card-attach-btns">
            <button type="button" class="btn-eea-attach-icon" title="Attachments"
                    style="background:${attachBg};box-shadow:0 2px 8px rgba(14,165,233,0.35);"
                    onclick="OpenEeaApprovalAttachment(${code}, '${escNo}', '${escDt}')">
                <i class="fa fa-paperclip"></i>
            </button>
        </div>`;

    return `
    <div class="gpa-pay-card section-entry-animation" data-code="${code}" data-search="${EscHtml(searchKey)}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">Entry</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${entryNo}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-user me-1" style="color:#667eea;font-size:0.72rem;"></i>${person}
                </div>
                <div class="gpa-pay-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${entryDate || '—'}</span>
                    <span class="gpa-pay-level-chip">
                        <i class="fa fa-layer-group me-1"></i><span class="eea-card-level-text" data-eea-code="${code}">${lvlDesc}</span>
                    </span>
                </div>
            </div>
            <div class="gpa-pay-card-right">
                <div class="gpa-pay-amount">${expendedAmt}</div>
                <div style="font-size:0.72rem;color:#059669;font-weight:600;">Allowed: ${allowedAmt}</div>
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
            ${attachBtns}
            ${actionBtn}
        </div>
    </div>`;
}

function BuildEeaCardStepper(currentLevel, totalLevels, status) {
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

function FilterEeaCards(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.gpa-pay-card');
    let visible = 0;
    cards.forEach(function (card) {
        const match = !q || (card.dataset.search || '').includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowEeaEmpty(visible === 0 && G_EntryList.length > 0);
}

function mergeDetailIntoEntry(root, baseEntry) {
    const p = { ...baseEntry };
    const fromList = parseLevelDetailsToArray(baseEntry.LevelDetails);

    if (Array.isArray(root)) {
        p._detailLines = root;
        p.LevelDetails = fromList.length ? fromList.slice() : [];
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
        return p;
    }

    const master = data.ExpenseEntryMaster?.[0]
        ?? data.ExpenseEntryMaster
        ?? data.Master
        ?? data;

    if (master && typeof master === 'object') {
        Object.assign(p, master);
    }

    const fromApi = parseLevelDetailsToArray(
        (data && data.LevelDetails != null) ? data.LevelDetails : p.LevelDetails
    );
    p.LevelDetails = mergeLevelDetailsLists(fromList, fromApi);

    const lines = data.ExpenseEntryDetails ?? data.ExpenseEntryDetail ?? data.Details ?? data.Items ?? data.Lines;
    if (Array.isArray(lines)) p._detailLines = lines;

    return p;
}

function extractDetailLines(root) {
    let lines = [];
    if (Array.isArray(root)) {
        lines = root;
    } else {
        const data = root?.Data ?? root?.data ?? root;
        if (!data) return [];
        if (Array.isArray(data)) {
            lines = data;
        } else if (typeof data === 'object') {
            const raw = data.ExpenseEntryDetails ?? data.ExpenseEntryDetail ?? data.Details ?? data.Items ?? data.Lines;
            lines = Array.isArray(raw) ? raw : [];
            if (!lines.length && Array.isArray(data.ExpenseEntryMaster)) {
                lines = data.ExpenseEntryMaster;
            }
        }
    }
    return lines.filter(function (row) {
        if (!row || typeof row !== 'object') return false;
        const hasHead = !!(row['Expense Head'] ?? row.ExpenseHead ?? row.ExpenseDesp);
        const exp = row['Expense Amount'] ?? row.ExpendedAmount ?? row['Expended Amount'];
        return hasHead || (exp != null && exp !== '' && parseFloat(exp) > 0);
    });
}

/** API may nest result under Data / Result repeatedly; unwrap a few hops to reach { Status, Msg }. */
function unwrapEeaActionResponse(res) {
    if (!res || typeof res !== 'object') return res;
    let cur = res;
    for (let i = 0; i < 5 && cur && typeof cur === 'object'; i++) {
        const next = cur.Data ?? cur.data ?? cur.Result ?? cur.result ?? cur.Output ?? cur.output;
        if (next == null || next === cur) break;
        cur = next;
    }
    return cur;
}

function eeaNormalizeStatus(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    if (/^true$/i.test(s)) return 'Y';
    if (/^false$/i.test(s)) return 'N';
    return s.toUpperCase();
}

/** Stored proc success: Status 'Y'; HTTP wrappers may send Success=true / status SUCCESS. */
function eeaIsSpSuccessPayload(payload) {
    if (payload == null) return false;
    if (typeof payload === 'boolean') return payload;
    if (typeof payload === 'string') return /^Y|SUCCESS$/i.test(eeaNormalizeStatus(payload));
    const st = eeaNormalizeStatus(payload.Status ?? payload.status);
    if (st === 'Y' || st === 'SUCCESS') return true;
    if (st === 'N' || st === 'FAIL' || st === 'FAILED') return false;
    if (payload.Success === true || payload.success === true) return true;
    if (payload.Success === false || payload.success === false) return false;
    return false;
}

function OpenDetailModal(entryCode) {
    const code = parseInt(entryCode, 10);
    if (!Number.isFinite(code) || code <= 0) return;

    G_CurrentEntry = G_EntryList.find(function (p) { return getExpenseMasterCode(p) === code; }) || null;
    if (!G_CurrentEntry) {
        G_CurrentEntry = { Code: code, ExpenseEntryMaster_Code: code };
    }

    const entryNo = getEntryNo(G_CurrentEntry);
    const person = getPersonName(G_CurrentEntry);

    $('#eeaModalEntryTitle').text('Entry# ' + entryNo);
    $('#eeaModalParty').text(person);
    $('#hfEeaEntryCode').val(String(code));
    $('#hfEeaLevelCode').val(String(getLevelCode(G_CurrentEntry)));
    $('#eeaFrmRemarks').val('');
    syncEeaModalAttachmentButton(G_CurrentEntry);

    paintModalFromEntry(G_CurrentEntry);

    $('#eeaModalItemsBody').html(
        '<tr><td colspan="7" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading\u2026</td></tr>'
    );

    $('#eeaBtnApproveAction').toggle(getApprovalStatus(G_CurrentEntry).toLowerCase() === 'pending');
    $('#eeaBtnRejectAction').toggle(getApprovalStatus(G_CurrentEntry).toLowerCase() === 'pending');

    $('#modalEeaDetail').modal({ backdrop: 'static' });
    $('#modalEeaDetail').modal('show');

    ExpenseEntryLevelsApprovalService.GetExpenseEntryApprovalDetail(code)
        .then(function (res) {
            G_CurrentEntry = mergeDetailIntoEntry(res, G_CurrentEntry);
            $('#hfEeaLevelCode').val(String(getLevelCode(G_CurrentEntry)));
            syncEeaModalAttachmentButton(G_CurrentEntry);
            paintModalFromEntry(G_CurrentEntry);
            const rawLines = extractDetailLines(res);
            return ensureEeaDetailLinesWithCodes(code, rawLines).then(function (lines) {
                G_CurrentEntry._detailLines = lines;
                RenderEeaModalItems(lines);
                const st = getApprovalStatus(G_CurrentEntry);
                const pend = st.toLowerCase() === 'pending';
                $('#eeaBtnApproveAction').toggle(pend);
                $('#eeaBtnRejectAction').toggle(pend);
            });
        })
        .catch(function (err) {
            console.error('GetExpenseEntryApprovalDetail', err);
            $('#eeaModalItemsBody').html(
                '<tr><td colspan="7" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                '<i class="fa fa-exclamation-triangle me-1"></i>Error loading expense lines.</td></tr>'
            );
        });
}

function paintModalFromEntry(entry) {
    const entryNo = EscHtml(getEntryNo(entry));
    const person = EscHtml(getPersonName(entry));
    const entryDate = EscHtml(FmtDateDisplay(getEntryDate(entry)) || '—');
    const expendedAmt = FmtCurrency(getTotalAmount(entry));
    const allowedAmt = FmtCurrency(getTotalAllowedAmount(entry));
    const curLvlNo = parseInt(entry.CurrentLevelNo ?? entry.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(entry.TotalLevels ?? entry.MaxLevel ?? 3, 10) || 1;
    const status = EscHtml(getApprovalStatus(entry));

    $('#eeaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildEeaInfoItem('Entry Number', entryNo, 'fa-file-invoice') +
            BuildEeaInfoItem('Person', person, 'fa-user') +
            BuildEeaInfoItem('Entry Date', entryDate, 'fa-calendar-alt') +
            BuildEeaInfoItem('Expended Amount', expendedAmt, 'fa-rupee-sign', '#667eea') +
            BuildEeaInfoItem('Allowed Amount', allowedAmt, 'fa-rupee-sign', '#059669') +
            BuildEeaInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
            BuildEeaInfoItem('Status', status, 'fa-info-circle') +
        '</div>'
    );

    $('#eeaModalApprovalStepper').html(BuildEeaDetailStepper(entry));
    syncEeaRemarksToActiveStep();
}

/**
 * List card layer chip for the row whose modal is open — prefer hfEeaEntryCode + .gpa-pay-card[data-code]
 * (mergeDetailIntoEntry can change master Code so getExpenseMasterCode alone may miss).
 */
function getEeaListCardLevelChipEl() {
    const fromHf = parseInt($('#hfEeaEntryCode').val() || '0', 10);
    if (fromHf > 0) {
        const byCard = document.querySelector('.gpa-pay-card[data-code="' + fromHf + '"] .eea-card-level-text');
        if (byCard) return byCard;
        const byAttr = document.querySelector('.eea-card-level-text[data-eea-code="' + fromHf + '"]');
        if (byAttr) return byAttr;
    }
    if (G_CurrentEntry) {
        const c = getExpenseMasterCode(G_CurrentEntry);
        if (c > 0) {
            return document.querySelector('.gpa-pay-card[data-code="' + c + '"] .eea-card-level-text')
                || document.querySelector('.eea-card-level-text[data-eea-code="' + c + '"]');
        }
    }
    return null;
}

/**
 * Active Pending step: bubble = bottom textarea only (no other level / API fill).
 * List + modal chips: typed || getEeaCardLevelChipLabel (chip logic unchanged — prior remark still on chip only).
 */
function syncEeaRemarksToActiveStep() {
    const typed = ($('#eeaFrmRemarks').val() || '').trim();

    const el = document.getElementById('eeaActiveStepComposeRemarks');
    if (el) {
        if (typed) {
            el.style.display = '';
            el.innerHTML = '<i class="fa fa-comment me-1"></i>' + EscHtml(typed);
        } else {
            el.style.display = 'none';
            el.innerHTML = '';
        }
    }

    if (!G_CurrentEntry) return;

    const pend = getApprovalStatus(G_CurrentEntry).toLowerCase() === 'pending';
    const base = getEeaCardLevelChipLabel(G_CurrentEntry);
    const headerListLabel = pend ? (typed || base) : base;

    const chipWrap = document.getElementById('eeaModalLevelChip');
    const chipTxt = document.getElementById('eeaModalLevelChipText');
    if (chipWrap && chipTxt) {
        chipTxt.textContent = headerListLabel;
        chipWrap.style.display = headerListLabel ? 'inline-flex' : 'none';
    }

    if (!pend) return;
    const listChip = getEeaListCardLevelChipEl();
    if (listChip) {
        listChip.textContent = headerListLabel;
    }
}

function BuildEeaInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="gpa-info-item">' +
        '<span class="gpa-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
        '<span class="gpa-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildEeaDetailStepper(entry) {
    const curLvlNo = parseInt(entry.CurrentLevelNo ?? entry.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(entry.TotalLevels ?? entry.MaxLevel ?? 3, 10) || 1;
    const status = getApprovalStatus(entry);
    const st = status.toLowerCase();
    const levels = parseLevelDetailsToArray(entry.LevelDetails);

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = getLevelRowByStep(levels, i) || {};

        let stepState;
        if (st === 'approved' || i < curLvlNo) stepState = 'done';
        else if (i === curLvlNo) stepState = st === 'rejected' ? 'rejected' : 'active';
        else stepState = 'pending';

        let lvlNameRaw = getLevelRowDisplayTitle(lvlInfo, i);
        if (!lvlNameRaw && i === curLvlNo) {
            lvlNameRaw = String(entry.CurrentLevelDesc ?? '').trim();
        }
        if (!lvlNameRaw) {
            lvlNameRaw = i === curLvlNo ? (String(entry.CurrentLevelDesc ?? '').trim() || 'Level ' + i) : 'Level ' + i;
        }
        const lvlTitleHtml = '<div class="gpa-dstep-title">' + EscHtml(lvlNameRaw) + '</div>';
        const approver = EscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtDateDisplay(lvlInfo.ApprovedOn) : '';
        const lvlRemarksRaw = getLevelRowRemarks(lvlInfo);
        let remarksHtml = '';
        let composeRemarksSlot = '';
        if (stepState === 'active' && st === 'pending') {
            composeRemarksSlot = '<div class="gpa-dstep-remarks" id="eeaActiveStepComposeRemarks" style="display:none;"></div>';
        } else if (lvlRemarksRaw && (stepState === 'done' || stepState === 'rejected')) {
            remarksHtml = '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + EscHtml(lvlRemarksRaw) + '</div>';
        }

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
            lvlTitleHtml +
            approverHtml +
            remarksHtml +
            composeRemarksSlot +
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

function RenderEeaModalItems(items) {
    const $body = $('#eeaModalItemsBody');
    if (!items || items.length === 0) {
        $body.html(
            '<tr><td colspan="7" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No expense lines found.</td></tr>'
        );
        return;
    }
    const editableApproved = isEeaApprovedAmountEditable();
    let html = '';
    const masterCode = getExpenseMasterCode(G_CurrentEntry);
    items.forEach(function (row, idx) {
        const head = EscHtml(row['Expense Head'] ?? row.ExpenseHead ?? row.ExpenseDesp ?? '—');
        const expAmt = FmtCurrency(row['Expense Amount'] ?? row.ExpendedAmount ?? row['Expended Amount'] ?? 0);
        const apprRaw = eeaNumFromRow(row, EEA_APPROVED_AMOUNT_KEYS);
        const rem = EscHtml(row.Remarks ?? row['Remarks'] ?? row.Description ?? row.LineDescription ?? row.LineDesp ?? '');
        const proj = EscHtml(row['Project Name'] ?? row.ProjectName ?? row.ProjectDesp ?? '');
        const subp = EscHtml(row['Sub Project Name'] ?? row.SubProjectName ?? row.SubProjectDesp ?? '');
        const detailCode = eeaDetailLineCodeFromRow(row, masterCode);
        let apprCell;
        if (editableApproved) {
            const v = Number.isFinite(apprRaw) ? apprRaw : 0;
            apprCell = '<input type="number" class="form-control form-control-sm text-end eea-line-approved" ' +
                'data-detail-idx="' + idx + '" data-detail-code="' + detailCode + '" min="0" step="0.01" value="' + EscHtml(String(v)) + '" ' +
                'title="Adjust approved amount (saved when you Approve)" />';
        } else {
            apprCell = '<span class="eea-line-approved-readonly" style="font-weight:700;color:#667eea;">' + FmtCurrency(apprRaw) + '</span>';
        }
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + head + '</td>' +
            '<td>' + proj + '</td>' +
            '<td>' + subp + '</td>' +
            '<td class="text-end">' + expAmt + '</td>' +
            '<td class="text-end">' + apprCell + '</td>' +
            '<td style="max-width:180px;">' + rem + '</td>' +
            '</tr>';
    });
    $body.html(html);

    if (editableApproved) {
        $body.off('input.eeaApproved', '.eea-line-approved').on('input.eeaApproved', '.eea-line-approved', function () {
            syncEeaModalApprovedTotalsFromLines();
        });
        syncEeaModalApprovedTotalsFromLines();
    }
}

/** Refresh header Allowed Amount from editable line inputs. */
function syncEeaModalApprovedTotalsFromLines() {
    if (!isEeaApprovedAmountEditable()) return;
    let total = 0;
    $('#eeaModalItemsBody .eea-line-approved').each(function () {
        const v = parseFloat(String($(this).val()).replace(/,/g, ''));
        if (!isNaN(v)) total += v;
    });
    $('#eeaModalHeader .gpa-info-item').each(function () {
        const $lbl = $(this).find('.gpa-info-lbl');
        if ($lbl.length && ($lbl.text().indexOf('Allowed Amount') >= 0)) {
            $(this).find('.gpa-info-val').html(FmtCurrency(total));
        }
    });
}

function SubmitApproval(action) {
    CheckRight('Verify').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error(respCheck.Msg);
            return;
        }
        _DoSubmitApproval(action);
    });
}

function _DoSubmitApproval(action) {
    const entryCode = parseInt($('#hfEeaEntryCode').val() || '0', 10);
    const levelCode = parseInt($('#hfEeaLevelCode').val() || '0', 10);
    const remarks = ($('#eeaFrmRemarks').val() || '').trim();

    if (!entryCode) {
        if (typeof toastr !== 'undefined') toastr.warning('No expense entry selected.');
        return;
    }
    if (action === 'Reject' && !remarks) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter remarks before rejecting.');
        $('#eeaFrmRemarks').trigger('focus');
        return;
    }

    const entryLabel = G_CurrentEntry ? String(getEntryNo(G_CurrentEntry)) : '';
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

    $('#eeaConfirmTitle').text(isAppr ? 'Confirm Approval' : 'Confirm Rejection');
    $('#eeaConfirmModalHeader').attr('style', 'padding:12px 16px;border:none;' + hdrBg);
    $('#eeaConfirmMessage').html(msg);
    $('#eeaBtnConfirmAction')
        .attr('class', btnCls)
        .html(btnTxt)
        .off('click')
        .on('click', function () { ExecuteEeaApproval(entryCode, levelCode, remarks, action); });

    $('#modalEeaConfirm').modal('show');
}

function ExecuteEeaApproval(entryCode, levelCode, remarks, action) {
    CloseConfirmModal();

    if (typeof Showloader === 'function') Showloader();

    const runAction = function (approvalHistory) {
        const serviceCall = action === 'Approve'
            ? ExpenseEntryLevelsApprovalService.ApproveExpenseEntry(entryCode, levelCode, remarks, approvalHistory)
            : ExpenseEntryLevelsApprovalService.RejectExpenseEntry(entryCode, levelCode, remarks);

        serviceCall
            .then(function (response) {
                if (typeof HideLoader === 'function') HideLoader();
                const payload = unwrapEeaActionResponse(response) || response;
                const ok = eeaIsSpSuccessPayload(payload) || response === true;
                if (ok) {
                    const serverMsg = (payload.Msg || payload.Message || payload.message || '').trim();
                    if (typeof toastr !== 'undefined') {
                        toastr.success(serverMsg || ('Expense entry ' + (action === 'Approve' ? 'approved' : 'rejected') + ' successfully.'));
                    }
                    CloseDetailModal();
                    LoadEntryList();
                } else {
                    const msg = (payload && (payload.Msg || payload.Message || payload.message)) ||
                        ('Failed to ' + action.toLowerCase() + ' expense entry.');
                    if (typeof toastr !== 'undefined') toastr.error(msg);
                }
            })
            .catch(function () {
                if (typeof HideLoader === 'function') HideLoader();
                if (typeof toastr !== 'undefined') {
                    toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' expense entry.');
                }
            });
    };

    if (action === 'Approve') {
        let approvalHistory = [];
        if (isEeaApprovedAmountEditable()) {
            const lines = G_CurrentEntry && Array.isArray(G_CurrentEntry._detailLines) ? G_CurrentEntry._detailLines : [];
            const built = buildEeaApprovalHistoryRows(lines, entryCode, levelCode);
            if (built.error) {
                if (typeof HideLoader === 'function') HideLoader();
                if (typeof toastr !== 'undefined') toastr.warning(built.error);
                return;
            }
            approvalHistory = built.history;
        }
        runAction(approvalHistory);
        return;
    }

    runAction([]);
}

function CloseDetailModal() {
    if (G_CurrentEntry) {
        const chip = getEeaListCardLevelChipEl();
        if (chip && getApprovalStatus(G_CurrentEntry).toLowerCase() === 'pending') {
            chip.textContent = getEeaCardLevelChipLabel(G_CurrentEntry);
        }
    }
    $('#modalEeaDetail').modal('hide');
    G_CurrentEntry = null;
}

function CloseConfirmModal() {
    $('#modalEeaConfirm').modal('hide');
}

function ShowEeaLoading(show) {
    const loadEl = document.getElementById('eeaPendingLoading');
    const listEl = document.getElementById('eeaPendingList');
    if (loadEl) loadEl.style.display = show ? '' : 'none';
    if (listEl) listEl.style.display = show ? 'none' : '';
}

function ShowEeaEmpty(show) {
    const el = document.getElementById('eeaPendingEmpty');
    if (el) el.style.display = show ? '' : 'none';
}

function NavigateToExpenseEntryList() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    window.location.href = appBase + 'CRMTransactions/ExpenseEntry/ExpenseEntryList';
}

document.addEventListener('DOMContentLoaded', function () {
    eeaPatchAttachmentServiceForPage();
    InitDates();
    LoadEntryList();

    const searchEl = document.getElementById('eeaLstSearch');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            FilterEeaCards(this.value);
        });
    }

    const remarksEl = document.getElementById('eeaFrmRemarks');
    if (remarksEl) {
        remarksEl.addEventListener('input', syncEeaRemarksToActiveStep);
    }

    window.AttachmentControl_onQueueChange = function (count) {
        const n = parseInt(count, 10) || 0;
        const $b = $('#btnEeaModalAttachment');
        if (n > 0) {
            $b.addClass('eea-attach-has-files');
        } else if (!eeaHasAttachmentYes(G_CurrentEntry)) {
            $b.removeClass('eea-attach-has-files');
        }
    };
});

window.LoadEntryList = LoadEntryList;
window.OpenDetailModal = OpenDetailModal;
window.SubmitApproval = SubmitApproval;
window.CloseDetailModal = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.NavigateToExpenseEntryList = NavigateToExpenseEntryList;
window.OpenEeaApprovalAttachment = OpenEeaApprovalAttachment;
window.OpenEeaApprovalAttachmentFromModal = OpenEeaApprovalAttachmentFromModal;
