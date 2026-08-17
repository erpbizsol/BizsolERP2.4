import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentApprovalService.js';
import { GRNPaymentApprovalService as GRNPaymentEntryDataService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';

let G_PaymentList = [];
/** Full API list before status dropdown filter — used for header stat chips. */
let G_PaymentListFull = [];
let G_CurrentPayment = null;
let G_GpaHistoryState = null;
let G_GpaBudgetState = null;
let G_GpaBudgetViewMode = 'party';
let G_GpaBudgetActiveRequest = { party: 0, employee: 0 };
let G_GpaBudgetCache = { party: null, employee: null, filterKey: '' };
let G_GpaBudgetBindingFilters = false;
let G_GpaBudgetFilterCombos = [];
let G_GpaBudgetProjectCache = null;
let G_GpaWorkTypeList = [];
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

function FmtApprovedOnDisplay(d) {
    if (!d && d !== 0) return '';
    const s = String(d).trim();
    if (s === '') return '';
    // The approval procedure already returns a pre-formatted 'dd/MM/yyyy HH:mm'
    // string. Showing it as-is keeps the time and avoids ambiguous client-side
    // date parsing that silently drops the time when the day is <= 12.
    if (s.indexOf('/') !== -1) return s;
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return s;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear() +
        ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
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

function gpaFindApprovalListRow(codeNum, forPrint) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    const listRow = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === n; });
    if (listRow) return listRow;
    if (forPrint) return null;
    if (G_CurrentPayment && getPaymentMasterCode(G_CurrentPayment) === n) {
        return G_CurrentPayment;
    }
    return null;
}

function getEntryDate(p) {
    return p.EntryDate ?? p.entryDate ?? p['Entry Date'] ?? p.PaymentDate ?? p.paymentDate
        ?? p['PO Date'] ?? p.DocDate ?? '';
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

function gpaWorkTypeCodeFromRow(row) {
    const raw = row?.WorkTypeMaster_Code ?? row?.workTypeMaster_Code
        ?? row?.WorkTypeMasterCode ?? row?.workTypeMasterCode
        ?? row?.WorkType_Code ?? row?.workType_Code ?? row?.Code ?? row?.code;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function gpaWorkTypeNameFromRow(row) {
    if (!row || typeof row !== 'object') return '';
    const v = row.WorkTypeDesp ?? row.workTypeDesp ?? row.WorkTypDesp ?? row.workTypDesp
        ?? row.WorkTypeName ?? row.workTypeName
        ?? row.WorkType ?? row.workType ?? row.Name ?? row.name ?? row['Work Type'] ?? '';
    return String(v ?? '').trim();
}

function gpaWorkTypeNameFromCode(code) {
    const n = parseInt(code, 10);
    if (!Number.isFinite(n) || n <= 0) return '';
    const hit = (G_GpaWorkTypeList || []).find(function (row) {
        return gpaWorkTypeCodeFromRow(row) === n;
    });
    return gpaWorkTypeNameFromRow(hit);
}

function gpaNormalizeWorkTypeRows(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.WorkTypeList)) return res.WorkTypeList;
    if (Array.isArray(res?.workTypeList)) return res.workTypeList;
    const data = res?.Data ?? res?.data;
    if (data && typeof data === 'object') return gpaNormalizeWorkTypeRows(data);
    return normalizeGpaModalApiRows(res);
}

function getWorkTypeDisplay(p) {
    if (!p) return '—';
    const v = p['Work Type'] ?? p.WorkType ?? p.workType
        ?? p.WorkTypeName ?? p.workTypeName ?? p.WorkTypeDesp ?? p.workTypeDesp ?? '';
    const s = String(v ?? '').trim();
    if (s && !/^\d+$/.test(s)) return s;
    const code = p.WorkTypeMaster_Code ?? p.workTypeMaster_Code
        ?? p.WorkTypeMasterCode ?? p.workTypeMasterCode
        ?? p.WorkType_Code ?? p.workType_Code ?? (s && /^\d+$/.test(s) ? s : '');
    return gpaWorkTypeNameFromCode(code) || '—';
}

function loadGpaApprovalWorkTypes() {
    if (G_GpaWorkTypeList.length) return Promise.resolve(G_GpaWorkTypeList);
    return GRNPaymentEntryDataService.GetWorkType()
        .then(function (res) {
            G_GpaWorkTypeList = gpaNormalizeWorkTypeRows(res);
            return G_GpaWorkTypeList;
        })
        .catch(function (err) {
            console.warn('GetWorkType', err);
            return [];
        });
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
    const levels = gpaNormalizeLevelDetailsRows(p.LevelDetails);
    if (!levels.length) return false;
    for (let i = 1; i <= total; i++) {
        const lvl = gpaFindLevelRowForStep(levels, i);
        if (!levelRowIsApproved(lvl)) return false;
    }
    return true;
}

function getApprovalStatus(p) {
    const raw = (p.ApprovalStatus ?? p.Status ?? p.Approval_Status ?? '').toString().trim();
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();

    // Matches SQL: P=Approved, R=Rejected, H=Hold, else Pending
    if (upper === 'R' || lower === 'rejected') return 'Rejected';
    if (upper === 'H' || lower === 'hold') return 'Hold';
    if (upper === 'P' || raw === 'Y' || lower === 'approved') return 'Approved';

    const levels = parseLevelDetailsToArray(p?.LevelDetails);
    for (let i = 0; i < levels.length; i++) {
        if (gpaLevelRowIsOnHold(levels[i])) return 'Hold';
    }

    if (allLevelsApprovedFromDetails(p)) return 'Approved';

    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 0, 10) || 0;
    const tot = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10)
        || parseLevelDetailsToArray(p?.LevelDetails).length;
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

function gpaNormStatus(status) {
    return String(status || 'Pending').trim().toLowerCase();
}

function gpaIsHoldStatus(status) {
    return gpaNormStatus(status) === 'hold';
}

function gpaNeedsApprovalAction(status) {
    const s = gpaNormStatus(status);
    return s === 'pending' || s === 'hold';
}

/** View-only modal — approved/rejected, or pending/hold but not assigned to current user. */
function gpaModalIsViewOnly(payment) {
    const p = payment || G_CurrentPayment;
    if (!p) return true;
    const st = getApprovalStatus(p).toLowerCase();
    if (st === 'approved' || st === 'rejected') return true;
    if (!gpaNeedsApprovalAction(st)) return true;
    return !paymentIsPendingOnMe(p);
}

function gpaCanActOnPayment(payment) {
    const p = payment || G_CurrentPayment;
    if (!p) return false;
    return gpaNeedsApprovalAction(getApprovalStatus(p)) && paymentIsPendingOnMe(p);
}

function gpaLevelIsOnHold(lvlInfo, paymentStatus) {
    if (!lvlInfo) return false;
    if (String(lvlInfo.IsOnHold || lvlInfo.isOnHold || '').trim().toUpperCase() === 'Y') return true;
    return gpaIsHoldStatus(paymentStatus);
}

function gpaLevelRowIsOnHold(lvlInfo) {
    if (!lvlInfo) return false;
    return String(lvlInfo.IsOnHold ?? lvlInfo.isOnHold ?? '').trim().toUpperCase() === 'Y';
}

/** True when entry is on hold or any approval level is marked On Hold — Hold action not allowed again. */
function gpaPaymentHasAnyLevelOnHold(payment) {
    if (!payment) return false;
    if (gpaIsHoldStatus(getApprovalStatus(payment))) return true;
    const levels = parseLevelDetailsToArray(payment.LevelDetails);
    for (let i = 0; i < levels.length; i++) {
        if (gpaLevelRowIsOnHold(levels[i])) return true;
    }
    return false;
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
    if (st === 'hold') return 'On Hold';
    const totalLvl = gpaResolveTotalLevels(p);
    let cur = gpaResolveCurrentLevelNo(p);
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
    const cur = gpaResolveCurrentLevelNo(p);
    const levels = gpaNormalizeLevelDetailsRows(p.LevelDetails);
    const row = gpaFindLevelRowForStep(levels, cur);
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
    const st = getApprovalStatus(p).toLowerCase();
    if (st !== 'pending' && st !== 'hold') return false;

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

/** Assign LevelNo 1..N when API sends array without LevelNo — keeps all steps bindable. */
function gpaNormalizeLevelDetailsRows(levels) {
    const arr = parseLevelDetailsToArray(levels);
    return arr.map(function (row, idx) {
        const out = Object.assign({}, row);
        let n = levelNoFromRow(out);
        if (n < 1) {
            n = idx + 1;
            out.LevelNo = n;
            if (out.Level == null && out.LevelOrder == null) out.Level = n;
        }
        return out;
    });
}

function gpaFindLevelRowForStep(levels, stepNo) {
    const arr = gpaNormalizeLevelDetailsRows(levels);
    const n = parseInt(stepNo, 10) || 0;
    if (n < 1 || !arr.length) return null;
    const hit = arr.find(function (l) { return levelNoFromRow(l) === n; });
    if (hit) return hit;
    if (n <= arr.length) return arr[n - 1];
    return null;
}

/** Total approval steps — list often has 6 levels while detail API returns 3. */
function gpaResolveTotalLevels(p) {
    if (!p || typeof p !== 'object') return 1;
    const fromFields = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    const fromDetails = parseLevelDetailsToArray(p.LevelDetails).length;
    return Math.max(fromFields, fromDetails, 1);
}

/** Current step from master + LevelDetails (hold / first pending / next after approved). */
function gpaInferCurrentLevelFromDetails(p) {
    const levels = gpaNormalizeLevelDetailsRows(p?.LevelDetails);
    if (!levels.length) return 0;

    let holdAt = 0;
    for (let i = 0; i < levels.length; i++) {
        if (gpaLevelRowIsOnHold(levels[i])) {
            const n = levelNoFromRow(levels[i]);
            if (n > 0) holdAt = Math.max(holdAt, n);
        }
    }
    if (holdAt > 0) return holdAt;

    const total = gpaResolveTotalLevels(p);
    for (let j = 1; j <= total; j++) {
        const lvl = gpaFindLevelRowForStep(levels, j);
        if (!levelRowIsApproved(lvl)) return j;
    }
    return total;
}

function gpaResolveCurrentLevelNo(p) {
    if (!p || typeof p !== 'object') return 1;
    let cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 0, 10) || 0;
    const inferred = gpaInferCurrentLevelFromDetails(p);
    if (inferred > cur) cur = inferred;
    if (cur < 1) cur = 1;
    const total = gpaResolveTotalLevels(p);
    if (total > 0 && cur > total) cur = total;
    return cur;
}

/** Pending list row is source of truth when detail/GetByCode APIs lag (level, hold, counts). */
function gpaReconcileApprovalMetaFromList(merged, listRow) {
    if (!merged || !listRow) return merged;
    const out = merged;
    const listLevels = gpaNormalizeLevelDetailsRows(listRow.LevelDetails);
    const mergedLevels = gpaNormalizeLevelDetailsRows(out.LevelDetails);

    const bestTot = Math.max(
        gpaResolveTotalLevels(listRow),
        gpaResolveTotalLevels(out),
        listLevels.length,
        mergedLevels.length
    );
    out.TotalLevels = bestTot;
    out.MaxLevel = bestTot;

    const listCur = gpaResolveCurrentLevelNo(listRow);
    const mergedCur = gpaResolveCurrentLevelNo(out);
    const bestCur = Math.max(listCur, mergedCur);
    out.CurrentLevelNo = bestCur;
    out.CurrentLevel = bestCur;

    const listSt = getApprovalStatus(listRow).toLowerCase();
    const mergedSt = getApprovalStatus(out).toLowerCase();
    if (listSt === 'hold' && mergedSt === 'pending') {
        out.Status = listRow.Status ?? listRow.ApprovalStatus ?? 'H';
        out.ApprovalStatus = out.Status;
    } else if (listSt === 'rejected' && mergedSt === 'pending') {
        out.Status = listRow.Status ?? listRow.ApprovalStatus ?? 'R';
        out.ApprovalStatus = out.Status;
    } else if (listSt === 'approved' && mergedSt === 'pending') {
        out.Status = listRow.Status ?? listRow.ApprovalStatus ?? 'P';
        out.ApprovalStatus = out.Status;
    }

    if (!String(out.CurrentLevelDesc ?? '').trim() && String(listRow.CurrentLevelDesc ?? '').trim()) {
        out.CurrentLevelDesc = listRow.CurrentLevelDesc;
    }

    const listLvlCode = getLevelCode(listRow);
    if (listCur >= mergedCur && listLvlCode > 0) {
        out.LevelCode = listRow.LevelCode ?? listRow.Level_Code ?? listRow.ApprovalLevel_Code ?? out.LevelCode;
        out.Level_Code = out.LevelCode;
    }

    out.LevelDetails = gpaNormalizeLevelDetailsRows(
        mergeLevelDetailsLists(listLevels, mergedLevels)
    );

    return out;
}

/** Normalize level counts + LevelDetails before card/modal paint (same bind as view screenshot). */
function gpaPreparePaymentForDisplay(p) {
    if (!p || typeof p !== 'object') return p;
    const out = Object.assign({}, p);
    out.LevelDetails = gpaNormalizeLevelDetailsRows(out.LevelDetails);
    out.TotalLevels = gpaResolveTotalLevels(out);
    out.MaxLevel = out.TotalLevels;
    out.CurrentLevelNo = gpaResolveCurrentLevelNo(out);
    out.CurrentLevel = out.CurrentLevelNo;
    return out;
}

function gpaFindPendingListRowFromApi(apiResp, codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0 || !apiResp) return null;
    const rows = NormalizePaymentList(normalizeListResponse(apiResp));
    for (let i = 0; i < rows.length; i++) {
        if (getPaymentMasterCode(rows[i]) === n) {
            return gpaPreparePaymentForDisplay(rows[i]);
        }
    }
    return null;
}

function gpaBestListTruthForModal(codeNum, snapshot, pendingRow) {
    let truth = snapshot ? gpaPreparePaymentForDisplay(snapshot) : null;
    if (pendingRow) {
        truth = truth
            ? gpaReconcileApprovalMetaFromList(gpaPreparePaymentForDisplay(pendingRow), truth)
            : gpaPreparePaymentForDisplay(pendingRow);
    }
    return truth;
}

/** GetGRNPaymentlevelsapproval response for this entry — correct source for the modal's Approval Flow stepper. */
function gpaLevelsApprovalRowFromApi(apiResp, codeNum) {
    if (!apiResp) return null;
    const rows = NormalizePaymentList(normalizeListResponse(apiResp));
    if (rows.length) {
        const n = parseInt(codeNum, 10);
        const match = rows.find(function (r) { return getPaymentMasterCode(r) === n; }) || rows[0];
        return match ? gpaPreparePaymentForDisplay(match) : null;
    }
    const data = apiResp?.Data ?? apiResp?.data ?? apiResp;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        return gpaPreparePaymentForDisplay(data);
    }
    return null;
}

function gpaClonePaymentForApprovalMerge(p) {
    if (!p || typeof p !== 'object') return null;
    return Object.assign({}, p, {
        LevelDetails: gpaNormalizeLevelDetailsRows(p.LevelDetails).slice(),
    });
}

function mergeLevelDetailsLists(fromList, fromApi) {
    const a = gpaNormalizeLevelDetailsRows(fromList);
    const b = gpaNormalizeLevelDetailsRows(fromApi);
    if (!b.length) return a.slice();
    if (!a.length) return b.slice();

    const map = new Map();
    a.forEach(function (row) {
        const n = levelNoFromRow(row);
        if (n > 0) map.set(n, { ...row });
    });
    b.forEach(function (row) {
        let n = levelNoFromRow(row);
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
        p.LevelDetails = gpaNormalizeLevelDetailsRows(p.LevelDetails);
        const totField = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
        p.TotalLevels = Math.max(totField, p.LevelDetails.length, 1);
        p.MaxLevel = p.TotalLevels;
        return p;
    });
}

function filterGpaPaymentListByStatus(list, statusVal) {
    const st = String(statusVal || 'U').trim().toUpperCase();
    if (st === 'A' || st === '0') return list;
    if (st === 'U') {
        return list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'pending'; });
    }
    if (st === 'P' || st === 'Y') {
        return list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'approved'; });
    }
    if (st === 'R') {
        return list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'rejected'; });
    }
    if (st === 'H') {
        return list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'hold'; });
    }
    return list;
}

function LoadPaymentList() {
    const fromDate = document.getElementById('gpaFromDate')?.value || '';
    const toDate = document.getElementById('gpaToDate')?.value || '';
    const statusVal = document.getElementById('gpaDdlStatus')?.value || 'U';

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
            if (typeof window !== 'undefined') {
                window.G_PaymentPendingListRaw = list.map(function (r) { return Object.assign({}, r); });
            }

            G_PaymentListFull = NormalizePaymentList(list).map(gpaPreparePaymentForDisplay);
            list = filterGpaPaymentListByStatus(G_PaymentListFull, statusVal);

            G_PaymentList = list;
            if (typeof window !== 'undefined') window.G_PaymentList = G_PaymentList;
            UpdateGpaStatChips();
            RenderPaymentCards();
            const searchEl = document.getElementById('gpaLstSearch');
            FilterGpaCards(searchEl ? searchEl.value : '');
        })
        .catch(function (err) {
            console.error('LoadPaymentList', err);
            ShowGpaLoading(false);
            G_PaymentList = [];
            G_PaymentListFull = [];
            if (container) container.innerHTML = '';
            ShowGpaEmpty(true);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error loading GRN payment approval list.');
            }
        });
}

function UpdateGpaStatChips() {
    const source = G_PaymentListFull.length ? G_PaymentListFull : G_PaymentList;
    const pending = source.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'pending';
    }).length;
    const approved = source.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'approved';
    }).length;
    const elP = document.getElementById('gpaStatPending');
    const elO = document.getElementById('gpaStatProcessed');
    if (elP) elP.textContent = pending > 0 ? String(pending) : (source.length ? '0' : '—');
    if (elO) elO.textContent = approved > 0 ? String(approved) : (source.length ? '0' : '—');

    const onMe = source.filter(paymentIsPendingOnMe).length;
    const elOnMe = document.getElementById('gpaStatPendingOnMe');
    if (elOnMe) {
        elOnMe.textContent = source.length === 0 ? '—' : String(onMe);
    }
    try {
        sessionStorage.setItem('bizsol_gpaApprovalPendingOnMeCount', String(pending));
    } catch (e) {
        /* ignore */
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
    const pDisp = gpaPreparePaymentForDisplay(p);
    const code = getPaymentMasterCode(pDisp);
    const entryPlain = String(getEntryNo(pDisp));
    const vendorPlain = String(getPartyName(pDisp));
    const entryNo = EscHtml(entryPlain);
    const vendor = EscHtml(vendorPlain);
    const entryDate = FmtDateDisplay(getEntryDate(pDisp));
    const amount = FmtCurrency(getTotalAmount(pDisp));
    const totalLvl = gpaResolveTotalLevels(pDisp);
    const curLvlNo = gpaResolveCurrentLevelNo(pDisp);
    const levelChip = EscHtml(getGpaCardLevelChipLabel(pDisp));
    const status = getApprovalStatus(pDisp);

    let statusClr, statusBg;
    if (status.toLowerCase() === 'approved') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (status.toLowerCase() === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else if (gpaIsHoldStatus(status)) { statusClr = '#ea580c'; statusBg = '#ffedd5'; }
    else { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildGpaCardStepper(curLvlNo, totalLvl, status, pDisp);
    const canAct = gpaCanActOnPayment(pDisp);
    const actionBtn = canAct
        ? `<button type="button" class="btn-gpa-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button type="button" class="btn-gpa-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const hasAttach = GpaHasAttachmentYes(pDisp);
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

    const projName = EscHtml(getProject(pDisp) || '');
    const subProjName = EscHtml(getSubProject(pDisp) || '');
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

function BuildGpaCardStepper(currentLevel, totalLevels, status, payment) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    const st = status.toLowerCase();
    const levels = payment ? gpaNormalizeLevelDetailsRows(payment.LevelDetails) : [];
    let html = '<div class="gpa-stepper">';
    for (let i = 1; i <= totalLevels; i++) {
        let stepClass;
        if (st === 'approved') stepClass = 'gpa-step-done';
        else if (i < currentLevel) stepClass = 'gpa-step-done';
        else if (i === currentLevel) {
            stepClass = st === 'rejected' ? 'gpa-step-rejected'
                : st === 'hold' ? 'gpa-step-hold'
                : 'gpa-step-active';
        }
        else stepClass = 'gpa-step-pending';

        const lineClass = (i < currentLevel || st === 'approved')
            ? 'gpa-step-line-done' : 'gpa-step-line-pending';

        const iconHtml = stepClass === 'gpa-step-done'
            ? '<i class="fa fa-check" style="font-size:0.6rem;"></i>'
            : stepClass === 'gpa-step-rejected'
                ? '<i class="fa fa-times" style="font-size:0.6rem;"></i>'
                : stepClass === 'gpa-step-hold'
                    ? '<i class="fa fa-pause" style="font-size:0.6rem;"></i>'
                    : i;

        const lvlInfo = gpaFindLevelRowForStep(levels, i);
        const lblRaw = pickLevelRowTitleText(lvlInfo) || ('L' + i);
        const lbl = EscHtml(lblRaw.length > 10 ? lblRaw.substring(0, 9) + '…' : lblRaw);

        html += `<div class="gpa-step-item">
                    <div class="gpa-step-circle ${stepClass}">${iconHtml}</div>
                    <div class="gpa-step-lbl" title="${EscHtml(lblRaw)}">${lbl}</div>
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
        return gpaReconcileApprovalMetaFromList(p, basePayment);
    }
    const data = root?.Data ?? root?.data ?? root;
    if (!data || typeof data !== 'object') {
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        return gpaReconcileApprovalMetaFromList(p, basePayment);
    }
    if (Array.isArray(data)) {
        p._detailLines = data;
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        enrichPaymentHeaderFromBillLines(p, data);
        return gpaReconcileApprovalMetaFromList(p, basePayment);
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
    p.LevelDetails = gpaNormalizeLevelDetailsRows(p.LevelDetails);
    if (gpaResolveTotalLevels(p) > (parseInt(p.TotalLevels ?? 0, 10) || 0)) {
        p.TotalLevels = gpaResolveTotalLevels(p);
        p.MaxLevel = p.TotalLevels;
    }

    let lines = data.GRNPaymentDetails ?? data.grnPaymentDetails
        ?? data.Details ?? data.details ?? data.BillLines ?? data.Items ?? data.Lines
        ?? data.Table ?? data.table;
    if (!Array.isArray(lines) || !lines.length) lines = gpaScanPaymentDetailArraysInObject(data);
    if (Array.isArray(lines) && lines.length) {
        p._detailLines = lines;
        enrichPaymentHeaderFromBillLines(p, lines);
    }

    return gpaReconcileApprovalMetaFromList(p, basePayment);
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

function applyGpaModalActionButtons(showApproveRejectHold, payment) {
    const po = payment || G_CurrentPayment;
    const viewOnly = gpaModalIsViewOnly(po);
    const showActions = !!showApproveRejectHold && !viewOnly;
    const holdBlocked = gpaPaymentHasAnyLevelOnHold(po);

    if (isGpaPaymentEntryListPage()) {
        $('#gpaBtnApproveAction').hide();
        $('#gpaBtnRejectAction').hide();
        $('#gpaBtnHoldAction').hide();
        $('.gpa-remarks-wrap').hide();
        $('.btn-gpa-modal-preview, .btn-gpa-modal-print').hide();
        $('#gpaBtnModalAttachment, .btn-gpa-modal-attach').hide();
        $('#gpaBtnHistoryAction').hide();
        $('#gpaBtnBudgetBalanceAction').hide();
        return;
    }

    $('.gpa-remarks-wrap').toggle(!!showActions);
    $('#gpaFrmRemarks').prop('readonly', viewOnly).prop('disabled', viewOnly);
    $('#gpaBtnApproveAction').toggle(!!showActions);
    $('#gpaBtnRejectAction').toggle(!!showActions);
    $('#gpaBtnHoldAction').toggle(!!showActions);
    $('#gpaBtnHoldAction')
        .prop('disabled', holdBlocked || viewOnly)
        .toggleClass('gpa-btn-hold-disabled', holdBlocked)
        .attr('title', holdBlocked ? 'This entry is already on hold at an approval level.' : 'Put on hold');
    $('.btn-gpa-modal-preview, .btn-gpa-modal-print').toggle(!viewOnly);
    $('#gpaBtnModalAttachment, .btn-gpa-modal-attach').toggle(!viewOnly);
    $('#gpaBtnHistoryAction').toggle(!viewOnly);
    $('#gpaBtnBudgetBalanceAction').toggle(!viewOnly);
    const $modal = $('#modalGpaDetail');
    if ($modal.length) $modal.toggleClass('gpa-modal-view-only', !!viewOnly);
}

function gpaSyncPaymentLevelMetaToList(payment, codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0 || !payment) return;
    const idx = G_PaymentList.findIndex(function (p) { return getPaymentMasterCode(p) === n; });
    if (idx < 0) return;
    G_PaymentList[idx] = Object.assign({}, G_PaymentList[idx], {
        LevelDetails: payment.LevelDetails,
        TotalLevels: payment.TotalLevels,
        MaxLevel: payment.MaxLevel,
        CurrentLevelNo: payment.CurrentLevelNo,
        CurrentLevel: payment.CurrentLevel,
        CurrentLevelDesc: payment.CurrentLevelDesc,
        Status: payment.Status,
        ApprovalStatus: payment.ApprovalStatus,
        LevelCode: payment.LevelCode,
        Level_Code: payment.Level_Code,
    });
    const cardEl = document.querySelector('.gpa-pay-card[data-code="' + n + '"]');
    if (!cardEl) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = BuildPaymentCard(G_PaymentList[idx]).trim();
    const fresh = wrap.firstElementChild;
    if (fresh) cardEl.replaceWith(fresh);
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
            G_CurrentPayment = gpaPreparePaymentForDisplay(G_CurrentPayment);

            const entryNo = getEntryNo(G_CurrentPayment);
            const vendor = getPartyName(G_CurrentPayment);

            $('#gpaModalEntryTitle').text((gpaModalIsViewOnly(G_CurrentPayment) ? 'View — Entry# ' : 'Entry# ') + entryNo);
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

            applyGpaModalActionButtons(gpaCanActOnPayment(G_CurrentPayment), G_CurrentPayment);

            $('#modalGpaDetail').modal({ backdrop: 'static' });
            $('#modalGpaDetail').modal('show');

            LoadGpaAttachmentsInline(code);

            const gpaListSnapshot = gpaClonePaymentForApprovalMerge(G_CurrentPayment);

            (async function loadGpaModalData() {
                try {
                    const results = await Promise.all([
                        GRNPaymentApprovalService.GetGRNPaymentDetail(code),
                        GRNPaymentEntryDataService.GetGRNPaymentApprovalByCode(code).catch(function () { return null; }),
                        GRNPaymentEntryDataService.GetProjectMasterList().catch(function () { return null; }),
                        GRNPaymentEntryDataService.GetGRNPaymentlevelsapproval(code).catch(function () { return null; }),
                        loadGpaApprovalWorkTypes(),
                    ]);
                    const res = results[0];
                    const entryRes = results[1];
                    const projectCache = normalizeGpaModalApiRows(results[2]);
                    const levelsApprovalRow = gpaLevelsApprovalRowFromApi(results[3], code);
                    const listTruth = gpaBestListTruthForModal(code, gpaListSnapshot, levelsApprovalRow);

                    G_CurrentPayment = mergeDetailIntoPayment(res, G_CurrentPayment);
                    G_CurrentPayment = mergeEntryPaymentIntoApproval(G_CurrentPayment, entryRes);
                    if (listTruth) {
                        G_CurrentPayment = gpaReconcileApprovalMetaFromList(G_CurrentPayment, listTruth);
                    } else if (gpaListSnapshot) {
                        G_CurrentPayment = gpaReconcileApprovalMetaFromList(G_CurrentPayment, gpaListSnapshot);
                    }
                    G_CurrentPayment = gpaPreparePaymentForDisplay(G_CurrentPayment);
                    let lines = resolveModalBillLines(res, entryRes, G_CurrentPayment);
                    lines = await gpaModalEnrichBillLines(lines, G_CurrentPayment, projectCache);
                    G_CurrentPayment._modalBillLines = lines;
                    G_CurrentPayment = enrichPaymentHeaderFromBillLines(G_CurrentPayment, lines);
                    $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
                    paintModalFromPayment(G_CurrentPayment);
                    RenderGpaModalItems(lines);
                    $('#gpaModalEntryTitle').text(
                        (gpaModalIsViewOnly(G_CurrentPayment) ? 'View — Entry# ' : 'Entry# ') + getEntryNo(G_CurrentPayment)
                    );
                    applyGpaModalActionButtons(gpaCanActOnPayment(G_CurrentPayment), G_CurrentPayment);
                    gpaSyncPaymentLevelMetaToList(G_CurrentPayment, code);
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
    const prepared = gpaPreparePaymentForDisplay(po);
    const entryNo = EscHtml(getEntryNo(prepared));
    const vendor = EscHtml(getPartyName(prepared));
    const entryDate = EscHtml(FmtDateDisplay(getEntryDate(prepared)) || '—');
    const amount = FmtCurrency(getTotalAmount(prepared));
    const curLvlNo = gpaResolveCurrentLevelNo(prepared);
    const totalLvl = gpaResolveTotalLevels(prepared);
    const status = EscHtml(getApprovalStatus(prepared));

    const paymentFor = EscHtml(getPaymentForDisplay(prepared));
    const workType = EscHtml(getWorkTypeDisplay(prepared));

    $('#gpaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildGpaInfoItem('Entry Number', entryNo, 'fa-file-invoice') +
            BuildGpaInfoItem('Party', vendor, 'fa-building') +
            BuildGpaInfoItem('Entry Date', entryDate, 'fa-calendar-alt') +
            BuildGpaInfoItem('Amount', amount, 'fa-rupee-sign', '#667eea') +
            BuildGpaInfoItem('Payment for', paymentFor, 'fa-tags') +
            BuildGpaInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
            BuildGpaInfoItem('Status', status, 'fa-info-circle') +
            BuildGpaInfoItem('Work Type', workType, 'fa-briefcase') +
        '</div>'
    );

    $('#gpaModalApprovalStepper').html(BuildGpaDetailStepper(prepared));
}

function BuildGpaInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="gpa-info-item">' +
        '<span class="gpa-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
        '<span class="gpa-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildGpaDetailStepper(po) {
    const curLvlNo = gpaResolveCurrentLevelNo(po);
    const totalLvl = gpaResolveTotalLevels(po);
    const status = getApprovalStatus(po);
    const st = status.toLowerCase();
    const levels = gpaNormalizeLevelDetailsRows(po.LevelDetails);

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = gpaFindLevelRowForStep(levels, i) || {};
        const lvlName = EscHtml(getLevelRowDisplayTitle(lvlInfo, i));
        const approver = EscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtApprovedOnDisplay(lvlInfo.ApprovedOn) : '';
        const lvlRemarksRaw = getLevelRowRemarks(lvlInfo);
        const remarksHtml = lvlRemarksRaw
            ? '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + EscHtml(lvlRemarksRaw) + '</div>'
            : '';

        let stepState;
        const lvlApproved = levelRowIsApproved(lvlInfo);
        const lvlHold = gpaLevelRowIsOnHold(lvlInfo);
        if (st === 'approved' || lvlApproved || i < curLvlNo) stepState = 'done';
        else if (lvlHold || (i === curLvlNo && gpaIsHoldStatus(status))) stepState = 'hold';
        else if (i === curLvlNo && st === 'rejected') stepState = 'rejected';
        else if (i === curLvlNo) stepState = 'active';
        else stepState = 'pending';

        const iconHtml = stepState === 'done' ? '<i class="fa fa-check"></i>'
            : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                : stepState === 'hold' ? '<i class="fa fa-pause"></i>'
                : stepState === 'active' ? '<i class="fa fa-hourglass-half"></i>'
                    : i;

        const badgeLabel = stepState === 'done' ? 'Approved'
            : stepState === 'rejected' ? 'Rejected'
                : stepState === 'hold' ? 'On Hold'
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
    const flat = r.CategoryDesc ?? r.categoryDesc
        ?? r.CategoryName ?? r.categoryName ?? '';
    if (flat !== undefined && flat !== null && String(flat).trim() !== '') return String(flat).trim();
    const cm = r.CategoryMaster ?? r.categoryMaster;
    if (cm && typeof cm === 'object') {
        const v = cm.CategoryDesc ?? cm.categoryDesc ?? cm.CategoryName ?? cm.categoryName ?? '';
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
        const catRaw = gpaCategoryNameFromRecord(enriched);
        const projRaw = gpaProjectLabelFromRow(enriched);
        const subRaw = gpaSubProjectLabelFromRow(enriched);
        const cat = EscHtml(catRaw !== '' ? catRaw : '—');
        const proj = EscHtml(projRaw !== '' ? projRaw : '—');
        const subProj = EscHtml(subRaw !== '' ? subRaw : '—');
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td>' + poNo + '</td>' +
            '<td>' + cat + '</td>' +
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
    if (action === 'Hold' && gpaPaymentHasAnyLevelOnHold(G_CurrentPayment)) {
        if (typeof toastr !== 'undefined') toastr.warning('This entry is already on hold at an approval level.');
        return;
    }
    if ((action === 'Reject' || action === 'Hold') && !remarks) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Please enter remarks before ' + action.toLowerCase() + 'ing.');
        }
        $('#gpaFrmRemarks').trigger('focus');
        return;
    }

    const entryLabel = G_CurrentPayment ? String(getEntryNo(G_CurrentPayment)) : '';
    const isAppr = action === 'Approve';
    const isHold = action === 'Hold';
    const hdrBg = isAppr
        ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
        : isHold
            ? 'background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;'
            : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
    const btnCls = isAppr ? 'btn-gpa-confirm-approve' : (isHold ? 'btn-gpa-confirm-hold' : 'btn-gpa-confirm-reject');
    const btnTxt = isAppr
        ? '<i class="fa fa-check me-1"></i>Yes, Approve'
        : isHold
            ? '<i class="fa fa-pause me-1"></i>Yes, Hold'
            : '<i class="fa fa-times me-1"></i>Yes, Reject';
    const msg = isAppr
        ? 'Are you sure you want to <strong>approve</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?'
        : isHold
            ? 'Are you sure you want to put entry# <strong>' + EscHtml(entryLabel) + '</strong> on <strong>hold</strong>?'
            : 'Are you sure you want to <strong>reject</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?';

    $('#gpaConfirmTitle').text(isAppr ? 'Confirm Approval' : (isHold ? 'Confirm Hold' : 'Confirm Rejection'));
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
        : action === 'Hold'
            ? GRNPaymentApprovalService.HoldGRNPayment(paymentCode, levelCode, remarks)
            : GRNPaymentApprovalService.RejectGRNPayment(paymentCode, levelCode, remarks);

    const successVerb = action === 'Approve' ? 'approved' : (action === 'Hold' ? 'put on hold' : 'rejected');
    const failVerb = action === 'Approve' ? 'approving' : (action === 'Hold' ? 'holding' : 'rejecting');

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
                    toastr.success(serverMsg || ('Payment entry ' + successVerb + ' successfully.'));
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
                toastr.error('Error while ' + failVerb + ' payment entry.');
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
    const base = gpaFindApprovalListRow(codeNum, true);

    const preloadEmp = typeof window.gpaPreloadEmployeeListForPrint === 'function'
        ? window.gpaPreloadEmployeeListForPrint()
        : Promise.resolve();

    Promise.all([
        preloadEmp,
        GRNPaymentEntryDataService.GetGRNPaymentApprovalByCode(codeNum).catch(function () { return null; }),
        GRNPaymentApprovalService.GetGRNPaymentDetail(codeNum).catch(function () { return null; }),
        loadGpaApprovalWorkTypes(),
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

            let printListRows = [];
            if (typeof window.gpaFindAllCachedListRowsForPrint === 'function') {
                printListRows = window.gpaFindAllCachedListRowsForPrint(codeNum) || [];
            }
            let printBase = base;
            if (printListRows.length) {
                printBase = base ? Object.assign({}, base, printListRows[0]) : Object.assign({}, printListRows[0]);
                if (typeof window.gpaOverlayMasterFromListRow === 'function') {
                    for (let pi = 0; pi < printListRows.length; pi++) {
                        master = window.gpaOverlayMasterFromListRow(master, printListRows[pi]);
                    }
                }
            }

            const co = gpaGetSessionCo();
            const { companyName, companyAddr, companyTag } = co;

            let creditTo = '';
            let vendorTypePrint = '';
            if (typeof window.gpaResolvePrintCreditAndVendorType === 'function') {
                const printParty = window.gpaResolvePrintCreditAndVendorType(master, printBase, null, printListRows);
                creditTo = printParty.creditTo || '';
                vendorTypePrint = printParty.vendorType || '';
            } else {
                const isEmp = typeof window.gpaMasterIsEmployeePayment === 'function'
                    && (window.gpaMasterIsEmployeePayment(master) || window.gpaMasterIsEmployeePayment(base));
                if (isEmp) {
                    vendorTypePrint = typeof window.gpaPickEmployeeeForPrint === 'function'
                        ? window.gpaPickEmployeeeForPrint(master, printBase, printListRows)
                        : String(
                            printBase?.Employeee ?? printBase?.employeee
                            ?? base?.Employeee ?? base?.employeee
                            ?? master?.Employeee ?? master?.employeee ?? ''
                        ).trim();
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
            const isEmpPrintEntry = typeof window.gpaMasterIsEmployeePayment === 'function'
                && (window.gpaMasterIsEmployeePayment(master) || window.gpaMasterIsEmployeePayment(printBase));
            if (!isEmpPrintEntry) {
                if (typeof window.gpaPickIndustryTypeForPrint === 'function') {
                    const indHdr = window.gpaPickIndustryTypeForPrint(master, printBase, printListRows, null);
                    if (indHdr) vendorTypePrint = indHdr;
                } else {
                    const indHdr = String(
                        printBase?.IndustryType ?? printBase?.industryType
                        ?? base?.IndustryType ?? base?.industryType
                        ?? master?.IndustryType ?? master?.industryType ?? ''
                    ).trim();
                    if (indHdr && indHdr.toLowerCase() !== 'null') vendorTypePrint = indHdr;
                }
            }
            if (!vendorTypePrint) vendorTypePrint = 'Party';
            const voucherNo = String(master.EntryNo ?? master.entryNo ?? getEntryNo(master) ?? '');
            const refNo = String(master.RefNo ?? master.refNo ?? '');
            const voucherDate = FmtDateDisplay(getEntryDate(master) || (base ? getEntryDate(base) : ''));
            const amt = parseFloat(String(getTotalAmount(master) || (base ? getTotalAmount(base) : 0)).replace(/,/g, '')) || 0;
            const advanceAmt = parseFloat(String(
                master.AdvanceAmount ?? master.advanceAmount
                ?? base?.AdvanceAmount ?? base?.advanceAmount ?? 0
            ).replace(/,/g, '')) || 0;
            const printAmt = advanceAmt > 0 ? advanceAmt : amt;
         const narration = typeof window.gpaResolvePrintNarration === 'function'
            ? window.gpaResolvePrintNarration(master, base ? [base] : [])
            : String(master.Narration ?? master.narration ?? '').trim();
         const ContactNo = String(master.PhoneNo ?? master.PhoneNo ?? '');
            const bankName = String(master.BankName ?? master.bankName ?? '');
            const paymentFor = String(
                master.PaymentFor ?? master.paymentFor ?? master.PaymentForName ?? master.paymentForName
                ?? master.ProjectCategory ?? master.projectCategory ?? ''
            );
            const workType = getWorkTypeDisplay(master);

            let detailsLines = '';
            (details || []).forEach(function (row, idx) {
                const poNoRaw = typeof window.gpaResolvePoNoTextFromRow === 'function'
                    ? window.gpaResolvePoNoTextFromRow(row)
                    : gpaPoNoFromRecord(row);
                const hasPo = poNoRaw && String(poNoRaw).trim() !== '' && String(poNoRaw).trim() !== '0';
                const pay = hasPo && typeof window.gpaResolvePrintPoAmountFromRow === 'function'
                    ? window.gpaResolvePrintPoAmountFromRow(row, base)
                    : (hasPo ? (row.TotalPOAmount ?? row.totalPOAmount ?? '') : '');
                const category = gpaCategoryNameFromRecord(row);
                const proj = row.ProjectDesp ?? row.projectDesp ?? row.ProjectName ?? row.projectName ?? row.Project ?? row.project ?? '';
                const site = row.SubProjectDesp ?? row.subProjectDesp ?? row.SiteName ?? row.siteName ?? row.Site ?? row.site ?? '';
                let poPart = '';
                if (hasPo) {
                    poPart += ' &mdash; PO: ' + gpaEscH(String(poNoRaw));
                    if (pay !== '' && pay != null) poPart += ' &mdash; PO Amount: &#8377;' + gpaFmtIndian(pay);
                }
                detailsLines += '<div class="pv-detail-line">'
                    + '<b>Line ' + (idx + 1) + '</b>'
                    + poPart
                    + (category ? ' &mdash; Category: ' + gpaEscH(String(category)) : '')
                    + (proj ? ' &mdash; Project: ' + gpaEscH(String(proj)) : '')
                    + (site ? ' &mdash; Sub Project: ' + gpaEscH(String(site)) : '')
                    + '</div>';
            });
            const detailsBlock = typeof window.gpaBuildPrintDetailsBlock === 'function'
                ? window.gpaBuildPrintDetailsBlock(narration, detailsLines, printAmt, 0)
                : ((narration
                    ? ('<div class="pv-narration-box">' + gpaEscH(narration) + '</div>')
                    : (detailsLines || '<span style="color:#666;">—</span>'))
                + '<div class="pv-amount-block" style="margin-top:10px;font-weight:700;">Amount (figures): &#8377; ' + gpaFmtIndian(printAmt) + '</div>'
                + '<div style="margin-top:4px;font-size:9pt;">Amount (words): ' + gpaNumToWords(Math.round(printAmt)) + '</div>');

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
                + '.pv-detail-line{margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #000;}'
                + '.pv-detail-line:last-of-type{margin-bottom:0;}'
                + '.pv-narration-box{border:none;border-bottom:1px solid #000;padding:8px 10px;margin:0 -8px;min-height:44px;white-space:pre-wrap;line-height:1.45;font-size:9.5pt;background:#fff;}'
                + '.pv-narration-after-lines{border-top:1px solid #000;margin-top:8px;padding-top:8px;}'
                + '.pv-amount-block{padding-top:2px;}'
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
                + '<tr><td class="lbl">Industry Type</td><td colspan="3">' + gpaEscH(vendorTypePrint || 'Party') + '</td></tr>'
                + '<tr><td class="lbl">Payment for</td><td colspan="3">' + gpaEscH(paymentFor || '—') + '</td></tr>'
                + '<tr><td class="lbl">Work Type</td><td colspan="3">' + gpaEscH(workType || '—') + '</td></tr>'
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
    let approvalRow = gpaFindApprovalListRow(codeNum, true);
    if (typeof window.gpaGetListRowRawByCode === 'function') {
        const glRaw = window.gpaGetListRowRawByCode(
            codeNum,
            approvalRow?.EntryNo ?? approvalRow?.entryNo
        );
        if (glRaw) {
            approvalRow = approvalRow ? Object.assign({}, approvalRow, glRaw) : Object.assign({}, glRaw);
        }
    }
    if (approvalRow) {
        const phone = typeof window.gpaExtractListRowPhoneNo === 'function'
            ? window.gpaExtractListRowPhoneNo(approvalRow) : '';
        const cat = typeof window.gpaPickCategoryDescKey === 'function'
            ? window.gpaPickCategoryDescKey(approvalRow) : '';
        approvalRow = Object.assign({}, approvalRow);
        if (phone) {
            approvalRow.PhoneNo = phone;
            approvalRow.PhoneNo = phone;
        }
        if (cat) {
            approvalRow.CategoryDesc = cat;
            approvalRow.CategoryName = cat;
        }
    }
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
        Mode: 'view'
    });
}

function gpaAttachmentEntryDateForControl(code, payment) {
    if (typeof window.gpaResolveAttachmentEntryDate === 'function') {
        return window.gpaResolveAttachmentEntryDate(payment || code, payment ? getEntryDate(payment) : '') || '';
    }
    const entryDate = payment ? (getEntryDate(payment) || '') : '';
    return entryDate ? String(entryDate).substring(0, 10) : '';
}

function OpenGRNPaymentApprovalAttachment(code) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    const payment = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === codeNum; });
    const entryNo = payment ? (getEntryNo(payment) || 0) : 0;
    InitGRNPaymentAttachmentControl(codeNum, entryNo, gpaAttachmentEntryDateForControl(codeNum, payment));
}

function OpenGRNPaymentApprovalAttachmentFromModal() {
    const code = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    if (!code) return;
    const payment = G_CurrentPayment || G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === code; });
    const entryNo = payment ? (getEntryNo(payment) || 0) : 0;
    InitGRNPaymentAttachmentControl(code, entryNo, gpaAttachmentEntryDateForControl(code, payment));
}

function CloseDetailModal() {
    $('#modalGpaDetail').modal('hide');
    const wrap = document.getElementById('gpaModalAttachList');
    if (wrap) wrap.innerHTML = '';
    G_CurrentPayment = null;
}

function gpaResolveHistoryPartyContext(payment) {
    const p = payment || G_CurrentPayment;

    let accountMasterCode = parseInt(p?.AccountMaster_Code ?? p?.accountMaster_Code ?? 0, 10) || 0;
    let marketingManCode = parseInt(p?.MarketingManMaster_Code ?? p?.marketingManMaster_Code ?? 0, 10) || 0;

    if (!accountMasterCode && !marketingManCode) {
        const cp = gpaCounterpartyCodeFromPayment(p);
        const n = parseInt(cp, 10) || 0;
        if (p?.MarketingManMaster_Code || p?.marketingManMaster_Code || p?.F_MarketingManMaster_Code) {
            marketingManCode = n;
        } else {
            accountMasterCode = n;
        }
    }

    return {
        paymentMasterCode: getPaymentMasterCode(p),
        accountMasterCode: accountMasterCode || marketingManCode,
        partyName: getPartyName(p),
        lineCombos: gpaCollectHistoryLineCombos(p),
    };
}

function gpaProjectCodeFromRow(r) {
    if (!r || typeof r !== 'object') return 0;
    const v = r.ProjectMaster_Code ?? r.projectMaster_Code
        ?? r.F_ProjectMaster_Code ?? r.f_ProjectMaster_Code
        ?? r.Project_Code ?? r.project_Code ?? r.ProjectMasterCode ?? r.projectMasterCode;
    const n = parseInt(String(v ?? '0'), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function gpaSubProjectCodeFromRow(r) {
    if (!r || typeof r !== 'object') return 0;
    const v = r.SubProjectMaster_Code ?? r.subProjectMaster_Code
        ?? r.F_SubProjectMaster_Code ?? r.f_SubProjectMaster_Code
        ?? r.SubProject_Code ?? r.subProject_Code ?? r.SubProjectMasterCode ?? r.subProjectMasterCode;
    const n = parseInt(String(v ?? '0'), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function gpaResolveProjectCodeByName(name, projectCache) {
    const q = String(name || '').trim().toLowerCase();
    if (!q || !Array.isArray(projectCache)) return 0;
    for (let i = 0; i < projectCache.length; i += 1) {
        const p = projectCache[i];
        const label = String(
            p.ProjectName ?? p.projectName ?? p.ProjectDesp ?? p.projectDesp ?? p.Name ?? p.name ?? ''
        ).trim().toLowerCase();
        if (label && label === q) {
            const code = parseInt(String(p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code ?? 0), 10);
            if (Number.isFinite(code) && code > 0) return code;
        }
    }
    return 0;
}

function gpaComboRowLabel(r) {
    const projectName = gpaProjectLabelFromRow(r)
        || String(gpaBudgetPickRowVal(r, 'Project') ?? r.Project ?? r.project ?? '').trim();
    const subProjectName = gpaBudgetSubProjectRowName(r);
    return { projectName: projectName, subProjectName: subProjectName };
}

function gpaCollectCombosFromRows(rows, projectCache) {
    const map = new Map();
    const list = Array.isArray(rows) ? rows : [];

    list.forEach(function (r) {
        if (!r || typeof r !== 'object') return;
        if (typeof gpaBudgetIsTotalRow === 'function' && gpaBudgetIsTotalRow(r)) return;
        if (typeof gpaBudgetIsEmployeeTotalRow === 'function' && gpaBudgetIsEmployeeTotalRow(r)) return;

        const labels = gpaComboRowLabel(r);
        let pc = gpaProjectCodeFromRow(r);
        let sc = gpaSubProjectCodeFromRow(r);
        if (!pc && labels.projectName) {
            pc = gpaResolveProjectCodeByName(labels.projectName, projectCache);
        }
        if (!pc && !sc && !labels.projectName && !labels.subProjectName) return;
        if (!labels.subProjectName || labels.subProjectName.toLowerCase() === 'all sub projects') return;

        const key = String(pc || 0) + '|'
            + labels.projectName.toLowerCase().trim() + '|'
            + labels.subProjectName.toLowerCase().trim();
        if (map.has(key)) {
            const existing = map.get(key);
            if (!existing.subProjectMasterCode && sc) {
                existing.subProjectMasterCode = sc;
            }
            if (!existing.projectMasterCode && pc) {
                existing.projectMasterCode = pc;
            }
            return;
        }
        map.set(key, {
            projectMasterCode: pc,
            subProjectMasterCode: sc,
            projectName: labels.projectName || ('Project ' + (pc || '?')),
            subProjectName: labels.subProjectName || ('Sub Project ' + (sc || '?')),
        });
    });

    return Array.from(map.values());
}

function gpaMergeFilterCombos(base, extra) {
    const map = new Map();
    function comboMergeKey(c) {
        return String(c.projectMasterCode || 0) + '|'
            + String(c.projectName || '').trim().toLowerCase() + '|'
            + String(c.subProjectName || '').trim().toLowerCase();
    }
    function upsert(c) {
        if (!c) return;
        const name = String(c.subProjectName || '').trim();
        if (!name || name.toLowerCase() === 'all sub projects') return;
        const key = comboMergeKey(c);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, {
                projectMasterCode: c.projectMasterCode || 0,
                subProjectMasterCode: c.subProjectMasterCode || 0,
                projectName: c.projectName || '',
                subProjectName: name,
            });
            return;
        }
        map.set(key, {
            projectMasterCode: existing.projectMasterCode || c.projectMasterCode || 0,
            subProjectMasterCode: existing.subProjectMasterCode || c.subProjectMasterCode || 0,
            projectName: existing.projectName || c.projectName || '',
            subProjectName: existing.subProjectName || name,
        });
    }
    (Array.isArray(base) ? base : []).forEach(upsert);
    (Array.isArray(extra) ? extra : []).forEach(upsert);
    return Array.from(map.values());
}

function gpaCollectHistoryLineCombos(payment) {
    const lines = payment?._modalBillLines || payment?._entryDetailLines || payment?._detailLines || [];
    return gpaCollectCombosFromRows(lines, G_GpaBudgetProjectCache);
}

function gpaBindHistoryFilterDropdowns(combos) {
    const $proj = $('#gpaHistDdlProject');
    const $sub = $('#gpaHistDdlSubProject');
    const list = Array.isArray(combos) ? combos : [];

    $proj.html('<option value="0">All Projects (This Entry)</option>');
    const seenProj = new Set();
    list.forEach(function (c) {
        if (!c.projectMasterCode || seenProj.has(c.projectMasterCode)) return;
        seenProj.add(c.projectMasterCode);
        $proj.append(
            '<option value="' + c.projectMasterCode + '">' + EscHtml(c.projectName) + '</option>'
        );
    });

    function refillSubProject() {
        const pc = parseInt($proj.val(), 10) || 0;
        $sub.html('<option value="0">All Sub Projects (This Entry)</option>');
        if (pc <= 0) {
            $sub.prop('disabled', true);
            return;
        }
        $sub.prop('disabled', false);
        const seenSub = new Set();
        list.filter(function (c) { return c.projectMasterCode === pc; }).forEach(function (c) {
            if (!c.subProjectMasterCode || seenSub.has(c.subProjectMasterCode)) return;
            seenSub.add(c.subProjectMasterCode);
            $sub.append(
                '<option value="' + c.subProjectMasterCode + '">' + EscHtml(c.subProjectName) + '</option>'
            );
        });
    }

    $proj.off('change.gpaHist').on('change.gpaHist', function () {
        refillSubProject();
        loadGpaApprovalHistoryData();
    });
    $sub.off('change.gpaHist').on('change.gpaHist', function () {
        loadGpaApprovalHistoryData();
    });

    $proj.val('0');
    refillSubProject();
}

function gpaSelectedHistoryFilterLabels() {
    const projVal = parseInt($('#gpaHistDdlProject').val(), 10) || 0;
    const subVal = parseInt($('#gpaHistDdlSubProject').val(), 10) || 0;
    let projectName = 'All Projects';
    let subProjectName = 'All Sub Projects';
    if (projVal > 0) {
        projectName = $('#gpaHistDdlProject option:selected').text() || projectName;
    }
    if (subVal > 0) {
        subProjectName = $('#gpaHistDdlSubProject option:selected').text() || subProjectName;
    }
    return { projectMasterCode: projVal, subProjectMasterCode: subVal, projectName, subProjectName };
}

function loadGpaApprovalHistoryData() {
    const state = G_GpaHistoryState;
    if (!state || !state.accountMasterCode) return;

    const filters = gpaSelectedHistoryFilterLabels();
    $('#gpaHistorySummary').html('');
    $('#gpaHistoryTableBody').html('');
    $('#gpaHistoryTableWrap').hide();
    $('#gpaHistoryEmpty').hide();
    $('#gpaHistoryLoading').show();

    GRNPaymentApprovalService.GetGRNPaymentApprovalHistory(
        state.paymentMasterCode,
        state.accountMasterCode,
        filters.projectMasterCode,
        filters.subProjectMasterCode
    )
        .then(function (response) {
            $('#gpaHistoryLoading').hide();
            const payload = normalizeGpaHistoryResponse(response);
            const ctx = Object.assign({}, state, filters);
            if (!payload.summary && (!payload.details || !payload.details.length)) {
                renderGpaApprovalHistorySummary(null, ctx);
                $('#gpaHistoryEmpty').show();
                return;
            }
            renderGpaApprovalHistorySummary(payload.summary, ctx);
            renderGpaApprovalHistoryDetails(payload.details);
        })
        .catch(function (err) {
            console.error('GetGRNPaymentApprovalHistory', err);
            $('#gpaHistoryLoading').hide();
            $('#gpaHistoryEmpty').show();
            if (typeof toastr !== 'undefined') toastr.error('Failed to load approval history.');
        });
}

function gpaResolveHistoryContext(payment) {
    const partyCtx = gpaResolveHistoryPartyContext(payment);
    const filters = gpaSelectedHistoryFilterLabels();
    return Object.assign({}, partyCtx, filters);
}

function normalizeGpaHistoryResponse(res) {
    const pickArray = function (v) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === 'object') return [v];
        return [];
    };

    const pickSummary = function (v) {
        if (!v || typeof v !== 'object') return null;
        if (Array.isArray(v)) return v[0] || null;
        return v;
    };

    const pickDetails = function (root) {
        if (!root || typeof root !== 'object') return [];
        const raw = root.History ?? root.history
            ?? root.Details ?? root.details
            ?? root.HistoryDetails ?? root.historyDetails;
        return Array.isArray(raw) ? raw : [];
    };

    let summary = null;
    let details = [];

    if (!res) return { summary, details };

    if (Array.isArray(res)) {
        if (res.length >= 2 && Array.isArray(res[0])) {
            summary = res[0][0] || res[0];
            details = Array.isArray(res[1]) ? res[1] : pickArray(res[1]);
        } else if (res.length >= 2 && typeof res[0] === 'object') {
            summary = pickSummary(res[0]);
            details = Array.isArray(res[1]) ? res[1] : pickDetails({ History: res[1] });
        } else if (res.length === 1 && res[0] && typeof res[0] === 'object') {
            const row = res[0];
            if (row.Summary || row.summary || row.History || row.history
                || row.Details || row.details) {
                summary = pickSummary(row.Summary ?? row.summary);
                details = pickDetails(row);
            } else if (row.TotalPOAmount != null || row.totalPOAmount != null || row['Party Name']) {
                summary = row;
            } else {
                details = res;
            }
        } else {
            details = res;
        }
        return { summary, details };
    }

    const root = res.Data ?? res.data ?? res;
    if (root && typeof root === 'object') {
        if (Array.isArray(root)) return normalizeGpaHistoryResponse(root);
        if (root.Summary || root.summary || root.History || root.history
            || root.Details || root.details) {
            summary = pickSummary(root.Summary ?? root.summary);
            details = pickDetails(root);
        } else if (root.Table || root.table) {
            summary = pickSummary(root.Table ?? root.table);
            details = pickArray(root.Table1 ?? root.table1);
        } else if (root.TotalPOAmount != null || root.totalPOAmount != null || root['Party Name']) {
            summary = root;
            details = pickDetails(root);
        }
    }

    return { summary, details };
}

function gpaHistoryDocTypeBadge(docType) {
    const t = String(docType || '').trim().toLowerCase();
    if (t === 'po') return '<span class="gpa-history-type gpa-history-type-po">PO</span>';
    if (t === 'grn' || t === 'mrn') return '<span class="gpa-history-type gpa-history-type-grn">GRN</span>';
    return '<span class="gpa-history-type gpa-history-type-payment">Payment</span>';
}

function gpaHistoryAmt(val) {
    return '&#8377; ' + gpaFmtIndian(val);
}

/** Balance: no minus sign — negative = Dr, positive = Cr */
function gpaHistoryBalanceDisplay(val) {
    const n = parseFloat(val || 0);
    if (isNaN(n)) return '&#8377; 0.00';
    const absAmt = gpaFmtIndian(Math.abs(n));
    if (n < 0) return '&#8377; ' + absAmt + ' Dr';
    if (n > 0) return '&#8377; ' + absAmt + ' Cr';
    return '&#8377; ' + absAmt;
}

function renderGpaApprovalHistorySummary(summary, ctx) {
    const s = summary || {};
    const party = s['Party Name'] ?? s.PartyName ?? s.partyName ?? ctx.partyName ?? '—';
    const totalPo = s.TotalPOAmount ?? s.totalPOAmount ?? 0;
    const totalGrn = s.TotalGRNAmount ?? s.totalGRNAmount ?? 0;
    const totalPay = s.TotalPaymentAmount ?? s.totalPaymentAmount ?? 0;
    const balance = s.BalanceAmount ?? s.balanceAmount ?? (parseFloat(totalPo || 0) - parseFloat(totalPay || 0));

    $('#gpaHistoryPartyName').text(party);

    $('#gpaHistorySummary').html(
        '<div class="gpa-history-card gpa-history-card--po"><div class="gpa-history-card-lbl">Total PO</div>'
        + '<div class="gpa-history-card-val">' + gpaHistoryAmt(totalPo) + '</div></div>'
        + '<div class="gpa-history-card gpa-history-card--grn"><div class="gpa-history-card-lbl">Total GRN</div>'
        + '<div class="gpa-history-card-val">' + gpaHistoryAmt(totalGrn) + '</div></div>'
        + '<div class="gpa-history-card gpa-history-card--payment"><div class="gpa-history-card-lbl">Total Payment</div>'
        + '<div class="gpa-history-card-val">' + gpaHistoryAmt(totalPay) + '</div></div>'
        + '<div class="gpa-history-card gpa-history-card--balance"><div class="gpa-history-card-lbl">Balance</div>'
        + '<div class="gpa-history-card-val">' + gpaHistoryBalanceDisplay(balance) + '</div></div>'
    );
}

function renderGpaApprovalHistoryDetails(details, targets) {
    const t = targets || {};
    const rows = Array.isArray(details) ? details : [];
    const bodyId = t.bodyId || 'gpaHistoryTableBody';
    const wrapSel = t.wrapSel || '#gpaHistoryTableWrap';
    const emptySel = t.emptySel || '#gpaHistoryEmpty';
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;

    if (!rows.length) {
        $(wrapSel).hide();
        $(emptySel).show();
        tbody.innerHTML = '';
        return;
    }

    let html = '';
    rows.forEach(function (r) {
        html += '<tr>'
            + '<td class="text-center">' + gpaHistoryDocTypeBadge(r.DocType ?? r.docType) + '</td>'
            + '<td class="text-center">' + EscHtml(r.DocNo ?? r.docNo ?? '—') + '</td>'
            + '<td class="text-center">' + EscHtml(r.DocDate ?? r.docDate ?? '—') + '</td>'
            + '<td class="text-center">' + EscHtml(r.BillNo ?? r.billNo ?? '—') + '</td>'
            + '<td class="text-center">' + EscHtml(r.PONo ?? r.poNo ?? '—') + '</td>'
            + '<td>' + EscHtml(r.Project ?? r.project ?? '—') + '</td>'
            + '<td>' + EscHtml(r['Sub Project'] ?? r.SubProject ?? r.subProject ?? '—') + '</td>'
            + '<td class="text-end">' + gpaHistoryAmt(r.Amount ?? r.amount ?? 0) + '</td>'
            + '<td class="text-center">' + EscHtml(r.Status ?? r.status ?? '—') + '</td>'
            + '</tr>';
    });

    tbody.innerHTML = html;
    $(emptySel).hide();
    $(wrapSel).show();
}

function OpenGpaApprovalHistory() {
    const ctx = gpaResolveHistoryPartyContext(G_CurrentPayment);
    if (!ctx.accountMasterCode) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Party is required to load approval history.');
        }
        return;
    }

    G_GpaHistoryState = ctx;
    $('#gpaHistoryPartyName').text(ctx.partyName || '—');
    gpaBindHistoryFilterDropdowns(ctx.lineCombos);

    $('#gpaHistorySummary').html('');
    $('#gpaHistoryTableBody').html('');
    $('#gpaHistoryTableWrap').hide();
    $('#gpaHistoryEmpty').hide();
    $('#gpaHistoryLoading').show();
    $('#modalGpaHistory').modal('show');

    loadGpaApprovalHistoryData();
}

function CloseGpaApprovalHistoryModal() {
    G_GpaHistoryState = null;
    if (typeof window !== 'undefined') window.__gpaPoHistoryState = null;
    $('#modalGpaHistory').modal('hide');
}

const GPA_BUDGET_PARTY_AMOUNT_COLUMNS = [
    { key: 'TotalPOAmountWithGST', label: 'Total PO (GST)' },
    { key: 'TotalGRNBillAmountWithGST', label: 'Total GRN Bill (GST)' },
    { key: 'Deduction', label: 'Deduction' },
    { key: 'NetGRNAmountWithGST', label: 'Net GRN (GST)' },
    { key: 'TDSDeduction', label: 'TDS Deduction' },
    { key: 'PaidAmountFromBank', label: 'Paid From Bank' },
    { key: 'NetPaymentWithTDS', label: 'Net Payment (TDS)' },
    { key: 'GRNLessPayment', label: 'GRN Less Payment' },
    { key: 'POGRNNetBalance', label: 'PO - GRN Balance', altKeys: ['POGRNNNetBalance'] },
];

const GPA_BUDGET_PARTY_TILES = [
    { key: 'TotalPOAmountWithGST', label: 'Total PO (GST)', card: 'po', altKeys: [] },
    { key: 'TotalGRNBillAmountWithGST', label: 'Total GRN Bill (GST)', card: 'grn', altKeys: [] },
    { key: 'Deduction', label: 'Deduction', card: 'budget', altKeys: [] },
    { key: 'NetGRNAmountWithGST', label: 'Net GRN (GST)', card: 'budget', altKeys: [] },
    { key: 'TDSDeduction', label: 'TDS Deduction', card: 'budget', altKeys: [] },
    { key: 'PaidAmountFromBank', label: 'Paid From Bank', card: 'payment', altKeys: [] },
    { key: 'NetPaymentWithTDS', label: 'Net Payment (TDS)', card: 'payment', altKeys: [] },
    { key: 'GRNLessPayment', label: 'GRN Less Payment', card: 'balance', altKeys: [] },
    { key: 'POGRNNetBalance', label: 'PO - GRN Balance', card: 'balance', altKeys: ['POGRNNNetBalance'] },
];

const GPA_BUDGET_PARTY_SUMMARY_HEADERS = [
    { key: 'TotalPOAmountWithGST', label: 'Total Po amount with GST' },
    { key: 'TotalGRNBillAmountWithGST', label: 'Total bill amount of grn with gst' },
    { key: 'Deduction', label: 'Deduction' },
    { key: 'NetGRNAmountWithGST', label: 'Net GRN Amt with gst (B-C)' },
    { key: 'TDSDeduction', label: 'TDS deduction' },
    { key: 'PaidAmountFromBank', label: 'Paid Amount From Bank' },
    { key: 'NetPaymentWithTDS', label: 'Net Payment With TDS (E+F)' },
    { key: 'GRNLessPayment', label: 'GRN Less Payment (D-G)' },
    { key: 'POGRNNetBalance', label: 'po - grn amount net balance (A-D)', altKeys: ['POGRNNNetBalance'] },
];

const GPA_BUDGET_PARTY_SUMMARY_COLUMNS = [
    { key: 'Project', label: 'Project' },
    { key: 'SubProject', label: 'Sub Project' },
].concat(GPA_BUDGET_PARTY_AMOUNT_COLUMNS);

const GPA_BUDGET_PARTY_HISTORY_COLUMNS = [
    { key: 'DocType', label: 'Type', isType: true, altKeys: ['docType', 'Type', 'type'] },
    { key: 'DocNo', label: 'Doc No', isCenter: true, altKeys: ['docNo'] },
    { key: 'DocDate', label: 'Date', isCenter: true, altKeys: ['docDate'] },
    { key: 'BillNo', label: 'Bill No', isCenter: true, altKeys: ['billNo'] },
    { key: 'PONo', label: 'PO No', isCenter: true, altKeys: ['poNo'] },
    { key: 'Project', label: 'Project' },
    { key: 'SubProject', label: 'Sub Project' },
    { key: 'Amount', label: 'Amount' },
];

const GPA_BUDGET_EMPLOYEE_COLUMNS = [
    { key: 'Employee', label: 'Employee', altKeys: ['employee'] },
    { key: 'Project', label: 'Project' },
    { key: 'SubProject', label: 'Sub Project' },
    { key: 'OpeningBalance', label: 'Opening', altKeys: ['Opening', 'opening', 'openingBalance'] },
    { key: 'TotalExpense', label: 'Total Expense', altKeys: ['totalExpense'] },
    { key: 'TotalPaidAmount', label: 'Total Paid', altKeys: ['totalPaidAmount'] },
    { key: 'Balance', label: 'Balance', altKeys: ['balance'] },
];

const GPA_BUDGET_EMPLOYEE_TILES = [
    { key: 'OpeningBalance', label: 'Opening', card: 'po', altKeys: ['Opening', 'opening', 'openingBalance'] },
    { key: 'TotalExpense', label: 'Total Expense', card: 'grn', altKeys: ['totalExpense'] },
    { key: 'TotalPaidAmount', label: 'Total Paid', card: 'payment', altKeys: ['totalPaidAmount'] },
    { key: 'Balance', label: 'Balance', card: 'balance', altKeys: ['balance'] },
];

function gpaBudgetAmtCell(val) {
    return '<td class="text-end">' + gpaHistoryAmt(val ?? 0) + '</td>';
}

function gpaBudgetTextCell(val) {
    return '<td>' + EscHtml(val ?? '—') + '</td>';
}

function gpaBudgetPickRowVal(row, key, altKeys) {
    if (!row || typeof row !== 'object') return null;
    const keys = [key].concat(altKeys || []);
    for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        const camel = k.charAt(0).toLowerCase() + k.slice(1);
        const val = row[k] ?? row[camel] ?? row[k.replace(/([A-Z])/g, '_$1').replace(/^_/, '')];
        if (val != null && val !== '') return val;
    }
    return null;
}

function gpaBudgetIsEmployeeTotalRow(row) {
    if (!row || typeof row !== 'object') return false;
    const emp = String(gpaBudgetPickRowVal(row, 'Employee', ['employee']) ?? '').trim().toUpperCase();
    if (emp === 'GRAND TOTAL') return true;
    return emp.endsWith(' TOTAL') && emp !== 'GRAND TOTAL';
}

function gpaBudgetIsTotalRow(row) {
    if (!row || typeof row !== 'object') return false;
    if (gpaBudgetIsEmployeeTotalRow(row)) return true;
    const proj = String(gpaBudgetPickRowVal(row, 'Project') ?? '').trim().toUpperCase();
    const sub = String(gpaBudgetPickRowVal(row, 'SubProject') ?? row['Sub Project'] ?? '').trim().toUpperCase();
    return proj === 'TOTAL' || sub === 'TOTAL';
}

function gpaBudgetFindEmployeeTileRow(rows, preferGrand) {
    const list = Array.isArray(rows) ? rows : [];
    if (preferGrand) {
        for (let i = list.length - 1; i >= 0; i -= 1) {
            const emp = String(gpaBudgetPickRowVal(list[i], 'Employee', ['employee']) ?? '').trim().toUpperCase();
            if (emp === 'GRAND TOTAL') return list[i];
        }
    }
    for (let i = list.length - 1; i >= 0; i -= 1) {
        if (gpaBudgetIsEmployeeTotalRow(list[i])
            && String(gpaBudgetPickRowVal(list[i], 'Employee', ['employee']) ?? '').trim().toUpperCase() !== 'GRAND TOTAL') {
            return list[i];
        }
    }
    return gpaBudgetFindTotalRow(list);
}

function gpaBudgetFindTotalRow(rows) {
    const list = Array.isArray(rows) ? rows : [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
        if (gpaBudgetIsTotalRow(list[i])) return list[i];
    }
    return null;
}

function gpaSumBudgetEmployeeRows(rows, key) {
    const list = Array.isArray(rows) ? rows : [];
    return list.reduce(function (sum, row) {
        const val = parseFloat(gpaBudgetPickRowVal(row, key) || 0);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);
}

function gpaBuildEmployeeTotalFromRows(rows) {
    return {
        OpeningBalance: gpaSumBudgetEmployeeRows(rows, 'OpeningBalance')
            || gpaSumBudgetEmployeeRows(rows, 'Opening'),
        TotalExpense: gpaSumBudgetEmployeeRows(rows, 'TotalExpense'),
        TotalPaidAmount: gpaSumBudgetEmployeeRows(rows, 'TotalPaidAmount'),
        Balance: gpaSumBudgetEmployeeRows(rows, 'Balance'),
    };
}

function gpaBuildPartyTotalFromRows(rows) {
    const list = Array.isArray(rows) ? rows.filter(function (r) { return !gpaBudgetIsTotalRow(r); }) : [];
    if (!list.length) return null;
    const sumKey = function (key) {
        return list.reduce(function (sum, row) {
            const val = parseFloat(gpaBudgetPickRowVal(row, key) || 0);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };
    return gpaApplyPartyBudgetFormulas({
        Project: 'TOTAL',
        SubProject: '',
        TotalPOAmountWithGST: sumKey('TotalPOAmountWithGST'),
        TotalGRNBillAmountWithGST: sumKey('TotalGRNBillAmountWithGST'),
        Deduction: sumKey('Deduction'),
        TDSDeduction: sumKey('TDSDeduction'),
        PaidAmountFromBank: sumKey('PaidAmountFromBank'),
    });
}

function gpaBuildPartyTotalFromHistoryRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return null;
    let totalPo = 0;
    let grnBill = 0;
    let deduction = 0;
    let tds = 0;
    let paidFromBank = 0;
    list.forEach(function (row) {
        const type = gpaBudgetDocTypeFromRow(row);
        const amt = parseFloat(gpaBudgetPickRowVal(row, 'Amount') || 0) || 0;
        const totalPoAmt = parseFloat(gpaBudgetPickRowVal(row, 'TotalPO', ['TotalPOAmount', 'totalPOAmount']) || 0) || 0;
        const totalGrnAmt = parseFloat(gpaBudgetPickRowVal(row, 'TotalGRN', ['totalGRN']) || 0) || 0;
        const totalPayAmt = parseFloat(gpaBudgetPickRowVal(row, 'TotalPayment', ['totalPayment']) || 0) || 0;
        if (type === 'po') {
            totalPo += totalPoAmt || amt;
        } else if (type === 'grn') {
            grnBill += totalGrnAmt || amt;
            deduction += parseFloat(gpaBudgetPickRowVal(row, 'Deduction') || 0) || 0;
            tds += parseFloat(gpaBudgetPickRowVal(row, 'TDSDeduction') || 0) || 0;
        } else if (type === 'payment') {
            paidFromBank += totalPayAmt || amt;
            tds += parseFloat(gpaBudgetPickRowVal(row, 'TDSDeduction') || 0) || 0;
        }
    });
    if (!totalPo && !grnBill && !paidFromBank && !deduction && !tds) return null;
    return gpaApplyPartyBudgetFormulas({
        TotalPOAmountWithGST: totalPo,
        TotalGRNBillAmountWithGST: grnBill,
        Deduction: deduction,
        TDSDeduction: tds,
        PaidAmountFromBank: paidFromBank,
    });
}

function gpaSplitBudgetRows(rows, mode) {
    const list = Array.isArray(rows) ? rows.slice() : (rows ? [rows] : []);
    if (!list.length) return { total: null, details: [] };

    if (mode === 'employee') {
        const details = list.filter(function (r) {
            return !gpaBudgetIsEmployeeTotalRow(r) && !gpaBudgetIsTotalRow(r);
        });
        const totalRow = gpaBudgetFindEmployeeTileRow(list, false)
            || gpaBudgetFindTotalRow(list)
            || (details.length ? gpaBuildEmployeeTotalFromRows(details) : null);
        return { total: totalRow, details: details, allRows: list };
    }

    const totalRow = gpaBudgetFindTotalRow(list);
    const details = totalRow ? list.filter(function (r) { return !gpaBudgetIsTotalRow(r); }) : list.slice();
    const total = totalRow || gpaBuildPartyTotalFromRows(details);
    return { total: total, details: details };
}

function gpaBudgetTileCardClass(cardType) {
    if (cardType === 'po') return 'gpa-history-card gpa-history-card--po';
    if (cardType === 'grn') return 'gpa-history-card gpa-history-card--grn';
    if (cardType === 'payment') return 'gpa-history-card gpa-history-card--payment';
    if (cardType === 'balance') return 'gpa-history-card gpa-history-card--balance';
    return 'gpa-budget-card';
}

function gpaBudgetTileValue(key, val) {
    if (key === 'Balance' || key === 'POGRNNetBalance' || key === 'GRNLessPayment') {
        return gpaHistoryBalanceDisplay(val ?? 0);
    }
    return gpaHistoryAmt(val ?? 0);
}

function gpaBudgetSummaryCard(label, valHtml, cardType) {
    return '<div class="' + gpaBudgetTileCardClass(cardType) + '">'
        + '<div class="gpa-history-card-lbl">' + EscHtml(label) + '</div>'
        + '<div class="gpa-history-card-val">' + valHtml + '</div></div>';
}

function gpaBudgetAmountCellHtml(key, val) {
    if (key === 'Balance' || key === 'POGRNNetBalance' || key === 'GRNLessPayment') {
        return '<td class="text-end">' + gpaHistoryBalanceDisplay(val ?? 0) + '</td>';
    }
    return gpaBudgetAmtCell(val);
}

function gpaPaymentBudgetViewMode(payment) {
    const p = payment || G_CurrentPayment;
    if (typeof window.gpaMasterIsEmployeePayment === 'function' && window.gpaMasterIsEmployeePayment(p)) {
        return 'employee';
    }
    const empCode = p?.MarketingManMaster_Code ?? p?.marketingManMaster_Code
        ?? p?.F_MarketingManMaster_Code ?? p?.f_MarketingManMaster_Code;
    const empN = parseInt(String(empCode ?? '0'), 10);
    const accCode = p?.AccountMaster_Code ?? p?.accountMaster_Code;
    const accN = parseInt(String(accCode ?? '0'), 10);
    if (Number.isFinite(empN) && empN > 0 && (!Number.isFinite(accN) || accN <= 0)) {
        return 'employee';
    }
    return 'party';
}

function gpaBudgetCounterpartyDisplayName(payment, mode) {
    const p = payment || G_CurrentPayment;
    if (mode === 'employee') {
        const emp = String(
            p?.Employee ?? p?.employee
            ?? p?.EmployeeName ?? p?.employeeName
            ?? p?.MarketingManMaster ?? p?.marketingManMaster
            ?? p?.MarketingManName ?? p?.marketingManName ?? ''
        ).trim();
        if (emp) return emp;
    }
    return getPartyName(p);
}

function gpaApplyBudgetViewChrome(mode) {
    const isEmployee = mode === 'employee';
    $('#gpaBudgetCounterpartyLbl').text(isEmployee ? 'Employee' : 'Party');
    $('#gpaBudgetBtnPartyWise').toggle(!isEmployee).toggleClass('active', !isEmployee);
    $('#gpaBudgetBtnEmployeeWise').toggle(isEmployee).toggleClass('active', isEmployee);
    $('#gpaBudgetTypeFilterWrap').toggle(!isEmployee);
    $('.gpa-budget-view-toggle').toggle(true);
}

function gpaBudgetNormalizeDocType(docType) {
    const t = String(docType || '').trim().toLowerCase();
    if (t === 'po') return 'po';
    if (t === 'grn' || t === 'mrn') return 'grn';
    if (t === 'payment' || t === 'pay') return 'payment';
    return t || 'payment';
}

function gpaBudgetDocTypeFromRow(row) {
    const raw = gpaBudgetPickRowVal(row, 'DocType', ['docType', 'Type', 'type']);
    return gpaBudgetNormalizeDocType(raw);
}

function gpaBudgetDocTypeLabel(code) {
    if (code === 'po') return 'PO';
    if (code === 'grn') return 'GRN';
    if (code === 'payment') return 'Payment';
    return String(code || '').toUpperCase();
}

function gpaCollectBudgetHistoryDocTypes(rows) {
    const order = ['po', 'grn', 'payment'];
    const found = new Set();
    (Array.isArray(rows) ? rows : []).forEach(function (r) {
        const code = gpaBudgetDocTypeFromRow(r);
        if (code) found.add(code);
    });
    return order.filter(function (c) { return found.has(c); });
}

function gpaFilterBudgetHistoryByType(rows, typeVal) {
    const list = Array.isArray(rows) ? rows : [];
    const filter = gpaBudgetNormalizeDocType(typeVal);
    if (!filter) return list.slice();
    return list.filter(function (r) {
        return gpaBudgetDocTypeFromRow(r) === filter;
    });
}

function gpaBudgetSubProjectNormName(name) {
    return String(name || '').trim().toLowerCase();
}

function gpaBudgetSubProjectOptionValue(entry) {
    const sc = parseInt(String(entry?.subProjectMasterCode || 0), 10) || 0;
    if (sc > 0) return String(sc);
    const norm = gpaBudgetSubProjectNormName(entry?.subProjectName);
    return norm ? ('0:' + norm) : '0';
}

function gpaBudgetSubProjectRowName(row) {
    if (!row || typeof row !== 'object') return '';
    return String(
        gpaSubProjectLabelFromRow(row)
        || gpaBudgetPickRowVal(row, 'SubProject', [
            'Sub Project', 'subProject', 'SubProjectDesp', 'subProjectDesp',
            'SubProjectName', 'subProjectName', 'SiteName', 'siteName', 'Site', 'site',
        ])
        || row['Sub Project']
        || ''
    ).trim();
}

function gpaBudgetProjectRowName(row) {
    if (!row || typeof row !== 'object') return '';
    return String(
        gpaProjectLabelFromRow(row)
        || gpaBudgetPickRowVal(row, 'Project')
        || row.Project
        || row.project
        || ''
    ).trim();
}

function gpaFilterBudgetHistoryBySubProject(rows, filters) {
    const list = Array.isArray(rows) ? rows : [];
    if (!filters || filters.subProjectMasterCode > 0) return list.slice();
    const nameFilter = gpaBudgetSubProjectNormName(filters.subProjectName);
    if (!nameFilter) return list.slice();
    return list.filter(function (r) {
        return gpaBudgetSubProjectNormName(gpaBudgetSubProjectRowName(r)) === nameFilter;
    });
}

function gpaBindBudgetTypeFilter(historyRows, options) {
    const opts = options || {};
    const $type = $('#gpaBudgetDdlType');
    const prev = opts.preserve ? String($type.val() || '') : '';
    const types = gpaCollectBudgetHistoryDocTypes(historyRows);

    $type.html('<option value="">All Types</option>');
    types.forEach(function (code) {
        $type.append(
            '<option value="' + EscHtml(code) + '">' + EscHtml(gpaBudgetDocTypeLabel(code)) + '</option>'
        );
    });

    if (opts.preserve && prev && $type.find('option').filter(function () {
        return String(this.value) === prev;
    }).length) {
        $type.val(prev);
    } else {
        $type.val('');
    }
    $type.prop('disabled', !types.length);
}

function gpaBudgetPanel(mode) {
    const isEmployee = mode === 'employee';
    const cap = isEmployee ? 'Employee' : 'Party';
    return {
        panel: '#gpaBudget' + cap + 'Panel',
        summary: '#gpaBudget' + cap + 'Summary',
        loading: '#gpaBudget' + cap + 'Loading',
        empty: '#gpaBudget' + cap + 'Empty',
        tableWrap: '#gpaBudget' + cap + 'TableWrap',
        tableHead: 'gpaBudget' + cap + 'TableHead',
        tableBody: 'gpaBudget' + cap + 'TableBody',
    };
}

function gpaToggleBudgetPanels(mode) {
    const isEmployee = mode === 'employee';

    $('#gpaBudgetPartyPanel').toggleClass('is-active', !isEmployee);
    $('#gpaBudgetEmployeePanel').toggleClass('is-active', isEmployee);
    gpaApplyBudgetViewChrome(mode);
}

function gpaEnsureBudgetPartySummaryShell() {
    const summary = document.getElementById('gpaBudgetPartySummary');
    if (!summary) return;

    if (!summary.classList.contains('gpa-history-summary')) {
        summary.classList.add('gpa-history-summary', 'gpa-budget-summary', 'gpa-budget-summary--party');
    }

    let wrap = document.getElementById('gpaBudgetPartySummaryTableWrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'gpaBudgetPartySummaryTableWrap';
        wrap.className = 'gpa-budget-party-summary-section';
        wrap.style.display = 'none';
        summary.insertAdjacentElement('afterend', wrap);
    }

    if (!document.getElementById('gpaBudgetPartySummaryTableHead')
        || !document.getElementById('gpaBudgetPartySummaryTableBody')) {
        wrap.innerHTML = ''
            + '<div class="gpa-budget-table-scroll-wrap gpa-budget-party-summary-scroll">'
            + '<table class="gpa-budget-table gpa-budget-party-summary-table">'
            + '<thead id="gpaBudgetPartySummaryTableHead"></thead>'
            + '<tbody id="gpaBudgetPartySummaryTableBody"></tbody>'
            + '</table></div>';
    }
}

function gpaResetBudgetPartySummaryTable() {
    gpaEnsureBudgetPartySummaryShell();
    const head = document.getElementById('gpaBudgetPartySummaryTableHead');
    const tbody = document.getElementById('gpaBudgetPartySummaryTableBody');
    if (head) head.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
}

function gpaApplyPartyBudgetFormulas(row) {
    if (!row || typeof row !== 'object') return {};
    const out = Object.assign({}, row);
    const num = function (key, altKeys) {
        const v = parseFloat(gpaBudgetPickRowVal(out, key, altKeys) || 0);
        return isNaN(v) ? 0 : v;
    };
    const totalPo = num('TotalPOAmountWithGST');
    const grnBill = num('TotalGRNBillAmountWithGST');
    const deduction = num('Deduction');
    const tds = num('TDSDeduction');
    const paidFromBank = num('PaidAmountFromBank');
    const netGrn = grnBill - deduction;
    const netPayment = tds + paidFromBank;
    out.NetGRNAmountWithGST = netGrn;
    out.NetPaymentWithTDS = netPayment;
    out.GRNLessPayment = netGrn - netPayment;
    out.POGRNNetBalance = totalPo - netGrn;
    return out;
}

function gpaRenderBudgetPartySummaryTable(totalRow) {
    const head = document.getElementById('gpaBudgetPartySummaryTableHead');
    const tbody = document.getElementById('gpaBudgetPartySummaryTableBody');
    if (!head || !tbody) return;

    const row = gpaApplyPartyBudgetFormulas(totalRow || {});
    let headHtml = '<tr class="gpa-budget-party-group-row">'
        + '<th class="text-center">as per party</th>'
        + '<th colspan="8" class="text-center">GRN part</th>'
        + '</tr><tr class="gpa-budget-party-label-row">';
    GPA_BUDGET_PARTY_SUMMARY_HEADERS.forEach(function (t) {
        headHtml += '<th class="text-end">' + EscHtml(t.label) + '</th>';
    });
    headHtml += '</tr>';
    head.innerHTML = headHtml;

    let bodyHtml = '<tr class="gpa-budget-party-summary-row">';
    GPA_BUDGET_PARTY_SUMMARY_HEADERS.forEach(function (t) {
        const val = gpaBudgetPickRowVal(row, t.key, t.altKeys);
        bodyHtml += gpaBudgetAmountCellHtml(t.key, val);
    });
    bodyHtml += '</tr>';
    tbody.innerHTML = bodyHtml;
}

function gpaClearBudgetSummary(mode) {
    const viewMode = mode === 'employee' ? 'employee' : 'party';
    if (viewMode === 'party') {
        gpaEnsureBudgetPartySummaryShell();
        $(gpaBudgetPanel(viewMode).summary).html('');
        gpaResetBudgetPartySummaryTable();
        $('#gpaBudgetPartySummaryTableWrap').hide();
        return;
    }
    $(gpaBudgetPanel(viewMode).summary).html('');
}

function renderGpaBudgetTotalTiles(totalRow, mode) {
    const row = gpaApplyPartyBudgetFormulas(totalRow || {});
    if (mode === 'party') {
        gpaEnsureBudgetPartySummaryShell();
        const p = gpaBudgetPanel(mode);
        let cardHtml = '';
        GPA_BUDGET_PARTY_TILES.forEach(function (t) {
            const val = gpaBudgetPickRowVal(row, t.key, t.altKeys);
            cardHtml += gpaBudgetSummaryCard(t.label, gpaBudgetTileValue(t.key, val), t.card);
        });
        $(p.summary).html(cardHtml);
        gpaRenderBudgetPartySummaryTable(row);
        $('#gpaBudgetPartySummaryTableWrap').show();
        return;
    }
    const p = gpaBudgetPanel(mode);
    let html = '';
    GPA_BUDGET_EMPLOYEE_TILES.forEach(function (t) {
        const val = gpaBudgetPickRowVal(row, t.key, t.altKeys);
        html += gpaBudgetSummaryCard(t.label, gpaBudgetTileValue(t.key, val), t.card);
    });
    $(p.summary).html(html);
}

function gpaBudgetRowIsHistoryRow(row) {
    if (!row || typeof row !== 'object') return false;
    const docType = gpaBudgetPickRowVal(row, 'DocType', ['docType', 'Type', 'type']);
    const docNo = gpaBudgetPickRowVal(row, 'DocNo', ['docNo']);
    return !!(String(docType || '').trim() || String(docNo || '').trim());
}

function gpaBudgetPayloadHasData(payload) {
    if (!payload) return false;
    if (Array.isArray(payload)) return payload.length > 0;
    if (payload.summaryRow && typeof payload.summaryRow === 'object') return true;
    return (payload.budgetRows && payload.budgetRows.length > 0)
        || (payload.historyRows && payload.historyRows.length > 0);
}

function gpaBudgetPayloadSummaryRow(payload) {
    if (!payload || Array.isArray(payload)) return null;
    if (payload.summaryRow && typeof payload.summaryRow === 'object') return payload.summaryRow;
    return null;
}

function gpaBudgetPayloadBudgetRows(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload.filter(function (r) { return !gpaBudgetRowIsHistoryRow(r); });
    if (Array.isArray(payload.budgetRows) && payload.budgetRows.length) {
        return payload.budgetRows;
    }
    if (payload.summaryRow) return [payload.summaryRow];
    return [];
}

function gpaBudgetPayloadHistoryRows(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload.filter(gpaBudgetRowIsHistoryRow);
    return Array.isArray(payload.historyRows) ? payload.historyRows : [];
}

function gpaParseJsonIfString(v) {
    if (typeof v !== 'string') return v;
    const s = v.trim();
    if (!s || (s[0] !== '{' && s[0] !== '[')) return v;
    try {
        return JSON.parse(s);
    } catch (e) {
        return v;
    }
}

function gpaUnwrapApiRoot(res) {
    let v = gpaParseJsonIfString(res);
    if (v == null) return v;
    for (let i = 0; i < 4; i += 1) {
        if (Array.isArray(v)) return v;
        if (!v || typeof v !== 'object') return v;
        const next = v.Data ?? v.data ?? v.Result ?? v.result ?? v.Value ?? v.value;
        if (next === undefined || next === null) return v;
        v = gpaParseJsonIfString(next);
    }
    return v;
}

function gpaRowLooksLikePartyBudgetRow(row) {
    if (!row || typeof row !== 'object') return false;
    if (gpaBudgetRowIsHistoryRow(row)) return false;
    return row.TotalPOAmountWithGST != null || row.totalPOAmountWithGST != null
        || row.TotalGRNBillAmountWithGST != null || row.totalGRNBillAmountWithGST != null
        || row.NetGRNAmountWithGST != null || row.netGRNAmountWithGST != null
        || row.PaidAmountFromBank != null || row.paidAmountFromBank != null
        || row.POGRNNetBalance != null || row.pOGRNNetBalance != null
        || (row.Project != null && row.SubProject != null);
}

function gpaExtractSummaryHistoryPayload(root) {
    if (!root || typeof root !== 'object' || Array.isArray(root)) return null;

    const summaryRaw = root.Summary ?? root.summary;
    const historyRaw = root.History ?? root.history ?? root.HistoryRows ?? root.historyRows;
    const historyRows = Array.isArray(historyRaw) ? historyRaw : [];

    if (Array.isArray(summaryRaw) && summaryRaw.length) {
        const budgetRows = summaryRaw.filter(function (r) {
            return gpaRowLooksLikePartyBudgetRow(r) || gpaBudgetIsTotalRow(r);
        });
        const rows = budgetRows.length ? budgetRows : summaryRaw.slice();
        const totalRow = gpaBudgetFindTotalRow(rows);
        return {
            budgetRows: rows,
            historyRows: historyRows,
            summaryRow: totalRow || null,
        };
    }

    const summary = summaryRaw && typeof summaryRaw === 'object' && !Array.isArray(summaryRaw)
        ? summaryRaw
        : null;

    const hasSummary = !!(summary && (
        gpaRowLooksLikePartyBudgetRow(summary)
        || gpaBudgetIsTotalRow(summary)
        || summary.TotalPOAmountWithGST != null
        || summary.totalPOAmountWithGST != null
    ));

    if (!hasSummary && !historyRows.length) return null;

    return {
        budgetRows: hasSummary ? [summary] : [],
        historyRows: historyRows,
        summaryRow: hasSummary ? summary : null,
    };
}

function gpaExtractPartyBudgetTables(root) {
    const pickArray = function (v) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === 'object') return [v];
        return [];
    };
    if (!root || typeof root !== 'object') {
        return { budgetRows: [], historyRows: [], summaryRow: null };
    }
    const budgetRows = pickArray(
        root.PartyRows ?? root.partyRows ?? root.Party ?? root.party
        ?? root.BudgetRows ?? root.budgetRows ?? root.PartyBudget ?? root.partyBudget
        ?? root.Table ?? root.table ?? root.Table0 ?? root.table0
    );
    const historyRows = pickArray(
        root.HistoryRows ?? root.historyRows ?? root.BudgetHistory ?? root.budgetHistory
        ?? root.History ?? root.history ?? root.Table1 ?? root.table1 ?? root.Table2 ?? root.table2
    );
    return { budgetRows: budgetRows, historyRows: historyRows, summaryRow: null };
}

function gpaSplitMixedPartyBudgetRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const historyRows = list.filter(gpaBudgetRowIsHistoryRow);
    const budgetRows = list.filter(function (r) {
        if (gpaBudgetRowIsHistoryRow(r)) return false;
        return gpaRowLooksLikePartyBudgetRow(r) || gpaBudgetIsTotalRow(r);
    });
    if (budgetRows.length) {
        return { budgetRows: budgetRows, historyRows: historyRows, summaryRow: null };
    }
    return {
        budgetRows: list.filter(function (r) { return !gpaBudgetRowIsHistoryRow(r); }),
        historyRows: historyRows,
        summaryRow: null,
    };
}

function normalizeGpaPartyBudgetResponse(res) {
    const empty = { budgetRows: [], historyRows: [], summaryRow: null };
    if (res == null) return empty;

    const root = gpaUnwrapApiRoot(res);

    if (Array.isArray(root)) {
        if (root.length >= 2 && Array.isArray(root[0])) {
            return {
                budgetRows: root[0] || [],
                historyRows: root[1] || [],
                summaryRow: null,
            };
        }
        if (root.length && (gpaBudgetRowsLookLikeParty(root) || gpaBudgetIsTotalRow(root[root.length - 1]))) {
            return gpaSplitMixedPartyBudgetRows(root);
        }
        if (root.length && gpaBudgetRowIsHistoryRow(root[0])) {
            return { budgetRows: [], historyRows: root, summaryRow: null };
        }
        return gpaSplitMixedPartyBudgetRows(root);
    }

    if (root && typeof root === 'object') {
        const tables = gpaExtractPartyBudgetTables(root);
        const hasTableData = tables.budgetRows.length || tables.historyRows.length;

        if (hasTableData) {
            const summaryPayload = gpaExtractSummaryHistoryPayload(root);
            const budgetRows = tables.budgetRows.length
                ? tables.budgetRows
                : (summaryPayload && summaryPayload.budgetRows.length ? summaryPayload.budgetRows : []);
            return {
                budgetRows: budgetRows,
                historyRows: tables.historyRows.length
                    ? tables.historyRows
                    : (summaryPayload ? summaryPayload.historyRows : []),
                summaryRow: summaryPayload ? summaryPayload.summaryRow : null,
            };
        }

        const summaryPayload = gpaExtractSummaryHistoryPayload(root);
        if (summaryPayload) return summaryPayload;
    }

    const flat = normalizeGpaModalApiRows(res);
    if (flat.length) {
        return gpaSplitMixedPartyBudgetRows(flat);
    }

    return empty;
}

function gpaRenderBudgetTableHead(mode, tableKind) {
    const cols = mode === 'employee'
        ? GPA_BUDGET_EMPLOYEE_COLUMNS
        : (tableKind === 'history' ? GPA_BUDGET_PARTY_HISTORY_COLUMNS : GPA_BUDGET_PARTY_SUMMARY_COLUMNS);
    const headId = mode === 'employee'
        ? gpaBudgetPanel(mode).tableHead
        : (tableKind === 'history' ? 'gpaBudgetPartyHistoryTableHead' : gpaBudgetPanel(mode).tableHead);
    const head = document.getElementById(headId);
    if (!head) return;
    let html = '<tr>';
    cols.forEach(function (c) {
        const isText = c.key === 'Employee' || c.key === 'Project' || c.key === 'SubProject' || c.isType || c.isCenter;
        let align = '';
        if (c.isType || c.isCenter) align = ' text-center';
        else if (!isText) align = ' text-end';
        html += '<th class="' + align.trim() + '">' + EscHtml(c.label) + '</th>';
    });
    html += '</tr>';
    head.innerHTML = html;
}

function gpaBudgetTypeCell(row) {
    const docType = gpaBudgetPickRowVal(row, 'DocType', ['docType', 'Type', 'type']);
    if (docType) {
        return '<td class="text-center">' + gpaHistoryDocTypeBadge(docType) + '</td>';
    }
    return '<td class="text-center">—</td>';
}

function gpaRenderBudgetTableBody(rows, mode, tableKind) {
    const cols = mode === 'employee'
        ? GPA_BUDGET_EMPLOYEE_COLUMNS
        : (tableKind === 'history' ? GPA_BUDGET_PARTY_HISTORY_COLUMNS : GPA_BUDGET_PARTY_SUMMARY_COLUMNS);
    const p = gpaBudgetPanel(mode);
    const tbodyId = mode === 'employee'
        ? p.tableBody
        : (tableKind === 'history' ? 'gpaBudgetPartyHistoryTableBody' : p.tableBody);
    const wrapSel = tableKind === 'history' ? '#gpaBudgetPartyHistoryTableWrap' : p.tableWrap;
    const emptySel = tableKind === 'history' ? '#gpaBudgetPartyHistoryEmpty' : p.empty;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    if (!list.length) {
        tbody.innerHTML = '';
        $(wrapSel).hide();
        if (tableKind !== 'history') {
            $(p.empty).show();
        } else {
            $(emptySel).show();
        }
        return;
    }

    let html = '';
    list.forEach(function (row) {
        const isTotal = tableKind === 'summary' && gpaBudgetIsTotalRow(row);
        html += '<tr' + (isTotal ? ' class="gpa-budget-total-row"' : '') + '>';
        cols.forEach(function (c) {
            const val = gpaBudgetPickRowVal(row, c.key, c.altKeys);
            if (c.isType) {
                html += gpaBudgetTypeCell(row);
            } else if (c.isCenter) {
                html += '<td class="text-center">' + EscHtml(val ?? '—') + '</td>';
            } else if (c.key === 'SubProject') {
                html += gpaBudgetTextCell(gpaBudgetSubProjectRowName(row) || val || row['Sub Project']);
            } else if (c.key === 'Project' || c.key === 'Employee') {
                html += gpaBudgetTextCell(val);
            } else if (tableKind === 'history' && (c.key === 'Amount' || c.key === 'TotalPO' || c.key === 'TotalGRN' || c.key === 'TotalPayment')) {
                html += gpaBudgetAmtCell(val);
            } else {
                html += gpaBudgetAmountCellHtml(c.key, val);
            }
        });
        html += '</tr>';
    });

    tbody.innerHTML = html;
    $(emptySel).hide();
    $(wrapSel).show();
    if (tableKind !== 'history') {
        $(p.empty).hide();
    }
}

function gpaBudgetFindPartyTileRow(budgetRows, summaryRow, split, historyRows) {
    const total = (split && split.total) || gpaBudgetFindTotalRow(budgetRows) || summaryRow;
    if (total) return total;
    const list = Array.isArray(budgetRows)
        ? budgetRows.filter(function (r) { return !gpaBudgetIsTotalRow(r); })
        : [];
    if (list.length === 1 && gpaRowLooksLikePartyBudgetRow(list[0])) return list[0];
    const built = gpaBuildPartyTotalFromRows(list);
    if (built) return built;
    return gpaBuildPartyTotalFromHistoryRows(historyRows);
}

function gpaResetBudgetHistoryShell() {
    const head = document.getElementById('gpaBudgetPartyHistoryTableHead');
    const tbody = document.getElementById('gpaBudgetPartyHistoryTableBody');
    if (head) head.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    $('#gpaBudgetPartyHistoryTableWrap').hide();
    $('#gpaBudgetPartyHistoryEmpty').hide();
    $('#gpaBudgetPartyHistorySection').hide();
}

function gpaResetBudgetPanelShell(mode) {
    const viewMode = mode === 'employee' ? 'employee' : 'party';
    const p = gpaBudgetPanel(viewMode);
    gpaClearBudgetSummary(viewMode);
    if (viewMode === 'employee') {
        const head = document.getElementById(p.tableHead);
        const tbody = document.getElementById(p.tableBody);
        if (head) head.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
        $(p.tableWrap).hide();
    }
    $(p.empty).hide();
    $(p.loading).hide();
    if (viewMode === 'party') {
        gpaResetBudgetHistoryShell();
    }
}

function gpaResetBudgetViewShell(mode) {
    gpaToggleBudgetPanels(mode);
    gpaResetBudgetPanelShell('party');
    gpaResetBudgetPanelShell('employee');
}

function gpaCancelBudgetPendingRequests() {
    G_GpaBudgetActiveRequest.party += 1;
    G_GpaBudgetActiveRequest.employee += 1;
}

function gpaApplyBudgetRowsToGrid(payload, mode) {
    const viewMode = mode === 'employee' ? 'employee' : 'party';
    if (viewMode !== G_GpaBudgetViewMode) return;

    const p = gpaBudgetPanel(viewMode);
    gpaResetBudgetPanelShell(viewMode);

    const budgetRows = gpaBudgetPayloadBudgetRows(payload);
    const allHistoryRows = viewMode === 'party' ? gpaBudgetPayloadHistoryRows(payload) : [];
    const filters = gpaSelectedBudgetFilterLabels();
    let historyRows = viewMode === 'party'
        ? gpaFilterBudgetHistoryByType(allHistoryRows, filters.docTypeFilter)
        : [];
    if (viewMode === 'party') {
        historyRows = gpaFilterBudgetHistoryBySubProject(historyRows, filters);
    }
    const summaryRow = gpaBudgetPayloadSummaryRow(payload);
    const split = gpaSplitBudgetRows(budgetRows, viewMode);
    const preferGrandTotal = !filters.projectMasterCode
        && !filters.subProjectMasterCode
        && !gpaBudgetSubProjectNormName(filters.subProjectName);

    const tileRow = viewMode === 'employee'
        ? (gpaBudgetFindEmployeeTileRow(budgetRows, preferGrandTotal) || split.total || summaryRow)
        : gpaBudgetFindPartyTileRow(budgetRows, summaryRow, split, allHistoryRows);
    if (tileRow || (viewMode === 'party' && (allHistoryRows.length || summaryRow || budgetRows.length))) {
        renderGpaBudgetTotalTiles(tileRow || {}, viewMode);
    }

    let summaryRows = [];
    let employeeComboRows = [];
    if (viewMode === 'employee') {
        gpaRenderBudgetTableHead(viewMode, 'summary');
        employeeComboRows = split.details.length
            ? split.details.slice()
            : (summaryRow && !gpaBudgetIsEmployeeTotalRow(summaryRow) && !gpaBudgetIsTotalRow(summaryRow)
                ? [summaryRow] : []);
        summaryRows = gpaFilterBudgetHistoryBySubProject(employeeComboRows, filters);
        gpaRenderBudgetTableBody(summaryRows, viewMode, 'summary');
    }

    if (viewMode === 'party') {
        gpaBindBudgetTypeFilter(allHistoryRows, { preserve: true });
        if (allHistoryRows.length) {
            $('#gpaBudgetPartyHistorySection').show();
            gpaRenderBudgetTableHead(viewMode, 'history');
            gpaRenderBudgetTableBody(historyRows, viewMode, 'history');
        } else {
            gpaResetBudgetHistoryShell();
        }
    }

    const isEmpty = viewMode === 'party'
        ? (!tileRow && !allHistoryRows.length)
        : (!summaryRows.length && !tileRow);
    if (isEmpty) {
        $(p.empty).show();
        if (viewMode === 'employee') {
            $(p.tableWrap).hide();
        }
    }

    $(p.loading).hide();
    const comboRows = viewMode === 'employee'
        ? employeeComboRows
        : budgetRows.concat(allHistoryRows, summaryRow ? [summaryRow] : []);
    gpaSyncBudgetFilterCombos(comboRows, { replace: viewMode === 'employee' });
}

function gpaReapplyBudgetPartyFromCache() {
    if (G_GpaBudgetViewMode !== 'party') return;
    const cached = G_GpaBudgetCache.party;
    if (!gpaBudgetPayloadHasData(cached)) return;
    gpaApplyBudgetRowsToGrid(cached, 'party');
}

function gpaBudgetRowsLookLikeEmployee(rows) {
    const r = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!r || typeof r !== 'object') return false;
    return r.OpeningBalance != null || r.openingBalance != null
        || r.Opening != null || r.opening != null
        || r.TotalExpense != null || r.totalExpense != null
        || r.TotalPaidAmount != null || r.totalPaidAmount != null
        || r.Balance != null || r.balance != null;
}

function gpaBudgetRowsLookLikeParty(rows) {
    const r = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!r || typeof r !== 'object') return false;
    return r.TotalPOAmountWithGST != null || r.totalPOAmountWithGST != null
        || r.TotalGRNBillAmountWithGST != null || r.totalGRNBillAmountWithGST != null
        || r.NetGRNAmountWithGST != null || r.netGRNAmountWithGST != null;
}

function gpaRowLooksLikeEmployeeBudgetRow(row) {
    if (!row || typeof row !== 'object') return false;
    if (gpaBudgetRowIsHistoryRow(row)) return false;
    return row.OpeningBalance != null || row.openingBalance != null
        || row.Opening != null || row.opening != null
        || row.TotalExpense != null || row.totalExpense != null
        || row.TotalPaidAmount != null || row.totalPaidAmount != null
        || row.Balance != null || row.balance != null;
}

function gpaNormalizeEmployeeBudgetRow(row) {
    if (!row || typeof row !== 'object') return row;
    const out = Object.assign({}, row);
    if (out.OpeningBalance == null && out.openingBalance == null
        && (out.Opening != null || out.opening != null)) {
        out.OpeningBalance = out.Opening ?? out.opening;
    }
    return out;
}

function gpaExtractEmployeeSummaryHistoryPayload(root) {
    if (!root || typeof root !== 'object' || Array.isArray(root)) return null;

    const summaryRaw = root.Summary ?? root.summary;
    const historyRaw = root.History ?? root.history ?? root.HistoryRows ?? root.historyRows;
    const historyRows = Array.isArray(historyRaw) ? historyRaw : [];

    if (Array.isArray(summaryRaw) && summaryRaw.length) {
        const budgetRows = summaryRaw.map(gpaNormalizeEmployeeBudgetRow).filter(function (r) {
            return gpaRowLooksLikeEmployeeBudgetRow(r)
                || gpaBudgetIsTotalRow(r)
                || gpaBudgetIsEmployeeTotalRow(r)
                || gpaBudgetPickRowVal(r, 'Employee', ['employee'])
                || gpaBudgetPickRowVal(r, 'Project');
        });
        if (budgetRows.length) {
            return { budgetRows: budgetRows, historyRows: historyRows, summaryRow: null };
        }
    }

    const summary = summaryRaw && typeof summaryRaw === 'object' && !Array.isArray(summaryRaw)
        ? gpaNormalizeEmployeeBudgetRow(summaryRaw)
        : null;

    const hasSummary = !!(summary && (
        gpaRowLooksLikeEmployeeBudgetRow(summary)
        || gpaBudgetIsTotalRow(summary)
        || gpaBudgetIsEmployeeTotalRow(summary)
    ));

    if (!hasSummary && !historyRows.length) return null;

    return {
        budgetRows: hasSummary ? [summary] : [],
        historyRows: historyRows,
        summaryRow: hasSummary ? summary : null,
    };
}

function gpaExtractEmployeeBudgetTables(root) {
    const pickArray = function (v) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === 'object') return [v];
        return [];
    };
    if (!root || typeof root !== 'object') {
        return { budgetRows: [], historyRows: [], summaryRow: null };
    }
    const budgetRows = pickArray(
        root.Rows ?? root.rows
        ?? root.EmployeeRows ?? root.employeeRows ?? root.EmployeeBudget ?? root.employeeBudget
        ?? root.BudgetRows ?? root.budgetRows
        ?? root.Table ?? root.table ?? root.Table0 ?? root.table0
    ).map(gpaNormalizeEmployeeBudgetRow);
    const historyRows = pickArray(
        root.HistoryRows ?? root.historyRows ?? root.BudgetHistory ?? root.budgetHistory
        ?? root.History ?? root.history ?? root.Table1 ?? root.table1 ?? root.Table2 ?? root.table2
    );
    return { budgetRows: budgetRows, historyRows: historyRows, summaryRow: null };
}

function normalizeGpaEmployeeBudgetResponse(res) {
    const empty = { budgetRows: [], historyRows: [], summaryRow: null };
    if (res == null) return empty;

    const root = gpaUnwrapApiRoot(res);

    if (Array.isArray(root)) {
        if (root.length >= 2 && Array.isArray(root[0])) {
            return {
                budgetRows: (root[0] || []).map(gpaNormalizeEmployeeBudgetRow),
                historyRows: root[1] || [],
                summaryRow: null,
            };
        }
        const rows = root.map(gpaNormalizeEmployeeBudgetRow).filter(function (r) {
            return gpaRowLooksLikeEmployeeBudgetRow(r)
                || gpaBudgetIsTotalRow(r)
                || gpaBudgetIsEmployeeTotalRow(r);
        });
        if (rows.length) {
            return { budgetRows: rows, historyRows: [], summaryRow: null };
        }
        return empty;
    }

    if (root && typeof root === 'object') {
        const tables = gpaExtractEmployeeBudgetTables(root);
        const hasTableData = tables.budgetRows.length || tables.historyRows.length;

        if (hasTableData) {
            const summaryPayload = gpaExtractEmployeeSummaryHistoryPayload(root);
            return {
                budgetRows: tables.budgetRows,
                historyRows: tables.historyRows.length
                    ? tables.historyRows
                    : (summaryPayload ? summaryPayload.historyRows : []),
                summaryRow: summaryPayload ? summaryPayload.summaryRow : null,
            };
        }

        const summaryPayload = gpaExtractEmployeeSummaryHistoryPayload(root);
        if (summaryPayload) return summaryPayload;
    }

    return empty;
}

function normalizeGpaBudgetBalanceResponse(res, mode) {
    if (mode === 'party') {
        return normalizeGpaPartyBudgetResponse(res);
    }
    return normalizeGpaEmployeeBudgetResponse(res);
}

function gpaEnsureBudgetProjectCache() {
    if (Array.isArray(G_GpaBudgetProjectCache)) return Promise.resolve(G_GpaBudgetProjectCache);
    return GRNPaymentEntryDataService.GetProjectMasterList()
        .then(function (res) {
            G_GpaBudgetProjectCache = normalizeGpaModalApiRows(res);
            return G_GpaBudgetProjectCache;
        })
        .catch(function () {
            G_GpaBudgetProjectCache = [];
            return G_GpaBudgetProjectCache;
        });
}

function gpaSyncBudgetFilterCombos(rows, options) {
    const opts = options || {};
    return gpaEnsureBudgetProjectCache().then(function (cache) {
        const base = opts.replace
            ? []
            : (G_GpaBudgetFilterCombos.length
                ? G_GpaBudgetFilterCombos
                : (G_GpaBudgetState?.lineCombos || []));
        const fromBudget = gpaCollectCombosFromRows(rows, cache);
        const merged = gpaMergeFilterCombos(base, fromBudget);
        if (G_GpaBudgetState) G_GpaBudgetState.lineCombos = merged;
        G_GpaBudgetBindingFilters = true;
        gpaBindBudgetFilterDropdowns(merged, { preserve: true });
        G_GpaBudgetBindingFilters = false;
        return merged;
    });
}

function gpaBindBudgetFilterDropdowns(combos, options) {
    const opts = options || {};
    const $proj = $('#gpaBudgetDdlProject');
    const $sub = $('#gpaBudgetDdlSubProject');
    const list = Array.isArray(combos) ? combos : [];
    G_GpaBudgetFilterCombos = list.slice();

    const prevProj = opts.preserve ? (parseInt($proj.val(), 10) || 0) : 0;
    const prevSub = opts.preserve ? String($sub.val() || '0') : '0';

    $proj.html('<option value="0">All Projects</option>');
    const seenProj = new Map();
    list.forEach(function (c) {
        const pc = c.projectMasterCode || 0;
        const name = c.projectName || ('Project ' + pc);
        const key = pc > 0 ? String(pc) : ('name:' + name.toLowerCase());
        if (seenProj.has(key)) return;
        seenProj.set(key, true);
        $proj.append(
            '<option value="' + (pc || 0) + '">' + EscHtml(name) + '</option>'
        );
    });

    function refillSubProject() {
        const pc = parseInt($proj.val(), 10) || 0;
        const projName = pc > 0
            ? gpaBudgetSubProjectNormName($proj.find('option:selected').text())
            : '';
        $sub.html('<option value="0">All Sub Projects</option>');
        const filtered = pc > 0
            ? list.filter(function (c) {
                if (c.projectMasterCode === pc) return true;
                return projName
                    && gpaBudgetSubProjectNormName(c.projectName) === projName;
            })
            : list;

        const byName = new Map();
        filtered.forEach(function (c) {
            const name = String(c.subProjectName || '').trim();
            if (!name || name.toLowerCase() === 'all sub projects') return;
            const norm = name.toLowerCase();
            const sc = parseInt(String(c.subProjectMasterCode || 0), 10) || 0;
            const prev = byName.get(norm);
            if (!prev || (!prev.subProjectMasterCode && sc)) {
                byName.set(norm, { subProjectMasterCode: sc, subProjectName: name });
            }
        });

        let optionCount = 0;
        Array.from(byName.values())
            .sort(function (a, b) { return a.subProjectName.localeCompare(b.subProjectName); })
            .forEach(function (entry) {
                const val = gpaBudgetSubProjectOptionValue(entry);
                if (val === '0') return;
                optionCount += 1;
                $sub.append(
                    '<option value="' + EscHtml(val) + '">' + EscHtml(entry.subProjectName) + '</option>'
                );
            });
        $sub.prop('disabled', optionCount === 0);
    }

    $proj.off('change.gpaBudget').on('change.gpaBudget', function () {
        if (G_GpaBudgetBindingFilters) return;
        refillSubProject();
        gpaClearBudgetCache();
        loadGpaBudgetBalanceForActiveMode();
    });
    $sub.off('change.gpaBudget').on('change.gpaBudget', function () {
        if (G_GpaBudgetBindingFilters) return;
        gpaClearBudgetCache();
        loadGpaBudgetBalanceForActiveMode();
    });

    $('#gpaBudgetDdlType').off('change.gpaBudget').on('change.gpaBudget', function () {
        if (G_GpaBudgetBindingFilters) return;
        gpaReapplyBudgetPartyFromCache();
    });

    if (opts.preserve && prevProj > 0 && $proj.find('option[value="' + prevProj + '"]').length) {
        $proj.val(String(prevProj));
    } else {
        $proj.val('0');
    }
    refillSubProject();
    if (opts.preserve && prevSub !== '0' && $sub.find('option').filter(function () {
        return String(this.value) === prevSub;
    }).length) {
        $sub.val(prevSub);
    }
}

function gpaSelectedBudgetFilterLabels() {
    const projVal = parseInt($('#gpaBudgetDdlProject').val(), 10) || 0;
    const subRaw = String($('#gpaBudgetDdlSubProject').val() || '0');
    const subVal = parseInt(subRaw, 10) || 0;
    const docTypeFilter = String($('#gpaBudgetDdlType').val() || '').trim();
    let subProjectName = '';
    if (subRaw.indexOf('0:') === 0) {
        subProjectName = subRaw.slice(2);
    } else if (subVal > 0) {
        subProjectName = String($('#gpaBudgetDdlSubProject option:selected').text() || '').trim();
    }
    return {
        projectMasterCode: projVal,
        subProjectMasterCode: subVal,
        subProjectName: subProjectName,
        docTypeFilter: docTypeFilter,
    };
}

function gpaBudgetFilterCacheKey() {
    const state = G_GpaBudgetState;
    const filters = gpaSelectedBudgetFilterLabels();
    return [
        state?.paymentMasterCode || 0,
        state?.accountMasterCode || 0,
        filters.projectMasterCode,
        filters.subProjectMasterCode,
        gpaBudgetSubProjectNormName(filters.subProjectName),
    ].join('|');
}

function gpaClearBudgetCache() {
    G_GpaBudgetCache = { party: null, employee: null, filterKey: '' };
}

function gpaShowBudgetGridLoading(show, mode) {
    const viewMode = mode === 'employee' ? 'employee' : (mode === 'party' ? 'party' : G_GpaBudgetViewMode);
    const p = gpaBudgetPanel(viewMode);
    $(p.loading).toggle(!!show);
    if (show) {
        if (viewMode === 'employee') {
            $(p.tableWrap).hide();
        }
        $(p.empty).hide();
        gpaClearBudgetSummary(viewMode);
        if (viewMode === 'party') {
            gpaResetBudgetHistoryShell();
        }
    }
}

function gpaStoreBudgetCache(viewMode, cacheKey, rows) {
    if (G_GpaBudgetCache.filterKey === cacheKey || !G_GpaBudgetCache.filterKey) {
        G_GpaBudgetCache[viewMode] = rows;
        G_GpaBudgetCache.filterKey = cacheKey;
        return;
    }
    G_GpaBudgetCache = { party: null, employee: null, filterKey: cacheKey };
    G_GpaBudgetCache[viewMode] = rows;
}

function loadGpaBudgetBalanceData(options) {
    const opts = options || {};
    const viewMode = opts.mode === 'employee' ? 'employee' : (opts.mode === 'party' ? 'party' : G_GpaBudgetViewMode);
    const state = G_GpaBudgetState;
    if (!state || !state.accountMasterCode) return Promise.resolve();

    const filters = gpaSelectedBudgetFilterLabels();
    const apiMode = viewMode === 'employee' ? 'E' : 'P';
    const cacheKey = gpaBudgetFilterCacheKey();
    const reqId = ++G_GpaBudgetActiveRequest[viewMode];
    const isActiveView = viewMode === G_GpaBudgetViewMode;

    if (isActiveView) {
        gpaShowBudgetGridLoading(true, viewMode);
    }

    return GRNPaymentApprovalService.GetGRNPaymentBudgetBalance(
        state.paymentMasterCode,
        state.accountMasterCode,
        filters.projectMasterCode,
        filters.subProjectMasterCode,
        apiMode
    )
        .then(function (response) {
            if (reqId !== G_GpaBudgetActiveRequest[viewMode]) return;
            if (viewMode !== G_GpaBudgetViewMode) return;

            const payload = normalizeGpaBudgetBalanceResponse(response, viewMode);
            gpaStoreBudgetCache(viewMode, cacheKey, payload);

            if (viewMode === G_GpaBudgetViewMode) {
                gpaShowBudgetGridLoading(false, viewMode);
                gpaApplyBudgetRowsToGrid(payload, viewMode);
            }
        })
        .catch(function (err) {
            if (reqId !== G_GpaBudgetActiveRequest[viewMode]) return;
            if (viewMode !== G_GpaBudgetViewMode) return;
            console.error('GetGRNPaymentBudgetBalance', err);
            gpaShowBudgetGridLoading(false, viewMode);
            $(gpaBudgetPanel(viewMode).empty).show();
            if (typeof toastr !== 'undefined') toastr.error('Failed to load budget balance.');
        });
}

function loadGpaBudgetBalanceForActiveMode() {
    if (!G_GpaBudgetState) return;
    loadGpaBudgetBalanceData({ mode: G_GpaBudgetViewMode });
}

function SetGpaBudgetViewMode(mode) {
    const entryMode = gpaPaymentBudgetViewMode(G_CurrentPayment);
    const requested = String(mode || '').toLowerCase() === 'employee' ? 'employee' : 'party';
    if (requested !== entryMode) return;
    G_GpaBudgetViewMode = entryMode;

    gpaToggleBudgetPanels(entryMode);

    if (!G_GpaBudgetState) {
        return;
    }

    gpaCancelBudgetPendingRequests();
    gpaResetBudgetPanelShell(entryMode);
    gpaShowBudgetGridLoading(true, entryMode);

    const cacheKey = gpaBudgetFilterCacheKey();
    const cachedPayload = G_GpaBudgetCache[entryMode];
    if (gpaBudgetPayloadHasData(cachedPayload) && G_GpaBudgetCache.filterKey === cacheKey) {
        gpaShowBudgetGridLoading(false, entryMode);
        gpaApplyBudgetRowsToGrid(cachedPayload, entryMode);
        return;
    }

    loadGpaBudgetBalanceData({ mode: entryMode });
}

function OpenGpaBudgetBalance() {
    const ctx = gpaResolveHistoryPartyContext(G_CurrentPayment);
    if (!ctx.accountMasterCode) {
        const viewMode = gpaPaymentBudgetViewMode(G_CurrentPayment);
        const msg = viewMode === 'employee'
            ? 'Employee is required to load budget balance.'
            : 'Party is required to load budget balance.';
        if (typeof toastr !== 'undefined') toastr.warning(msg);
        return;
    }

    const viewMode = gpaPaymentBudgetViewMode(G_CurrentPayment);
    G_GpaBudgetState = ctx;
    G_GpaBudgetViewMode = viewMode;
    G_GpaBudgetFilterCombos = [];
    gpaClearBudgetCache();
    gpaCancelBudgetPendingRequests();
    gpaApplyBudgetViewChrome(viewMode);
    $('#gpaBudgetPartyName').text(gpaBudgetCounterpartyDisplayName(G_CurrentPayment, viewMode) || '—');

    gpaEnsureBudgetProjectCache().then(function () {
        const combos = gpaCollectHistoryLineCombos(G_CurrentPayment);
        G_GpaBudgetBindingFilters = true;
        gpaBindBudgetFilterDropdowns(combos);
        gpaBindBudgetTypeFilter([], { preserve: false });
        G_GpaBudgetBindingFilters = false;

        gpaResetBudgetViewShell(viewMode);
        gpaShowBudgetGridLoading(true, viewMode);
        $('#modalGpaBudgetBalance').modal('show');
        loadGpaBudgetBalanceForActiveMode();
    });
}

function CloseGpaBudgetBalanceModal() {
    G_GpaBudgetState = null;
    G_GpaBudgetFilterCombos = [];
    gpaClearBudgetCache();
    gpaCancelBudgetPendingRequests();
    gpaResetBudgetViewShell('party');
    $('#gpaBudgetCounterpartyLbl').text('Party');
    $('#gpaBudgetBtnPartyWise').show().addClass('active');
    $('#gpaBudgetBtnEmployeeWise').show().removeClass('active');
    gpaBindBudgetTypeFilter([], { preserve: false });
    $('#modalGpaBudgetBalance').modal('hide');
}

$(document).on('click', '#gpaBudgetBtnPartyWise', function (e) {
    e.preventDefault();
    SetGpaBudgetViewMode('party');
});
$(document).on('click', '#gpaBudgetBtnEmployeeWise', function (e) {
    e.preventDefault();
    SetGpaBudgetViewMode('employee');
});

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

    const statusEl = document.getElementById('gpaDdlStatus');
    if (statusEl && (!statusEl.value || statusEl.value === 'A')) {
        statusEl.value = 'U';
    }

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

    const budgetBtn = document.getElementById('gpaBtnBudgetBalanceAction');
    if (budgetBtn) {
        budgetBtn.addEventListener('click', function (e) {
            e.preventDefault();
            OpenGpaBudgetBalance();
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
window.OpenGpaApprovalHistory = OpenGpaApprovalHistory;
window.CloseGpaApprovalHistoryModal = CloseGpaApprovalHistoryModal;
window.OpenGpaBudgetBalance = OpenGpaBudgetBalance;
window.OpenGpoBudgetBalance = OpenGpaBudgetBalance; /* typo alias */
window.CloseGpaBudgetBalanceModal = CloseGpaBudgetBalanceModal;
window.SetGpaBudgetViewMode = SetGpaBudgetViewMode;
window.gpaCanActOnPayment = gpaCanActOnPayment;
window.gpaModalIsViewOnly = gpaModalIsViewOnly;
