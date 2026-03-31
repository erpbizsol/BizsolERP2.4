
import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    window.AttachmentControl_onQueueChange = function (count) {
        const badge = document.getElementById('gpaTempAttachBadge');
        if (!badge) return;
        badge.textContent = String(count);
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    };
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
/** Active list tab: 'U' | 'P' | 'R' */
let gpaListActiveStatusTab = 'U';

// ══════════════════════════════════════════════════════════════════════════════
// LIST VIEW (GetGRNPaymentApprovalList → BizsolCustomFilterGrid, same as GRNService)
// ══════════════════════════════════════════════════════════════════════════════
/** Map API row to status code U / P / R (same semantics as status DDL from SQL). */
function normalizeGpaListStatusCode(item) {
    if (!item || typeof item !== 'object') return 'U';
    const rej = item.IsRejected ?? item.isRejected ?? item.Rejected ?? item.rejected;
    if (rej === true || rej === 1 || rej === 'Y' || rej === 'y' || String(rej).toLowerCase() === 'true') return 'R';
    const v =
        item.Status ?? item.status ?? item.ApprovalStatus ?? item.approvalStatus
        ?? item.EntryStatus ?? item.entryStatus ?? item.RecordStatus ?? item.recordStatus
        ?? item.PaymentStatus ?? item.paymentStatus ?? item.Flag ?? item.flag
        ?? item.CodeStatus ?? item.codeStatus;
    if (v === undefined || v === null || v === '') return 'U';
    const s = String(v).trim().toUpperCase();
    if (s === 'P' || s === 'APPROVED' || s === 'APPROVE') return 'P';
    if (s === 'R' || s === 'REJECTED' || s === 'REJECT') return 'R';
    if (s === 'U' || s === 'PENDING' || s === 'UNAPPROVED' || s === 'N' || s === 'NO') return 'U';
    const boolOk = item.IsApproved ?? item.isApproved ?? item.Approved ?? item.approved;
    if (boolOk === true || boolOk === 1 || boolOk === 'Y' || boolOk === 'y') return 'P';
    return 'U';
}

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

function mapGpaListRow(item) {
    const code = item.Code ?? item.code ?? 0;
    const entryNo = item.EntryNo ?? item.entryNo ?? '';
    const ed = item.EntryDate ?? item.entryDate ?? item.PaymentDate ?? item.paymentDate;
    const party = item.PartyName ?? item.VendorName ?? item.AccountName ?? item.partyName ?? item.Party ?? '';
    const rawAmt = item.Amount ?? item.amount ?? item.HeaderAmount ?? item.headerAmount;
    const amt = rawAmt !== undefined && rawAmt !== null && rawAmt !== '' ? Number(rawAmt) : '';
    const ref = item.RefNo ?? item.refNo ?? '';
    const label = String(entryNo || code || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const rawEdStr = ed ? String(ed).substring(0, 10) : '';
    const enNum = parseInt(entryNo, 10) || 0;
    const btns =
        '<button type="button" class="im-btn-edit" title="Edit" onclick="editGRNPaymentApproval(' + code + ')">' +
        '<i class="fas fa-pen"></i></button>' +
        '<button type="button" class="im-btn-attach" title="Attachment" onclick="openGpaListAttachmentControl(' + code + ',' + enNum + ',\'' + rawEdStr + '\')">' +
        '<i class="fas fa-paperclip"></i></button>' +
        '<button type="button" class="im-btn-delete" title="Delete" onclick="confirmDeleteGRNPaymentApproval(' + code + ', \'' + label + '\')">' +
        '<i class="fas fa-trash-can"></i></button>';
    return {
        'Entry No': entryNo,
        'Entry Date': formatGpaListDate(ed),
        'Party Name': party,
        'Amount': amt,
        'Ref No': ref,
        Action: btns,
        Code: code,
        StatusCode: normalizeGpaListStatusCode(item),
    };
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
}

function gpaListEmptyTabPlaceholderRow() {
    return {
        'Entry No': '',
        'Entry Date': '',
        'Party Name': 'No payment entries in this status.',
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
    document.querySelectorAll('.gpa-status-tab').forEach((btn) => {
        const st = btn.getAttribute('data-gpa-status');
        const on = st === gpaListActiveStatusTab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

function renderGpaListGridForActiveTab() {
    const StringFilterColumn = ['Party Name', 'Ref No'];
    const NumericFilterColumn = ['Entry No', 'Amount'];
    const DateFilterColumn = ['Entry Date'];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ['Code', 'StatusCode'];
    const ColumnAlignment = { Action: 'center;width:172px;' };

    updateGpaStatusTabStrip();

    if (gpaListFullRows.length === 0) {
        $('#gpaListTable').hide();
        $('#paginator-gpaListTable').html('');
        return;
    }

    const tab = gpaListActiveStatusTab || 'U';
    let filtered = gpaListFullRows.filter((r) => (r.StatusCode || 'U') === tab);
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
    renderGpaListGridForActiveTab();
}

function loadGRNPaymentApprovalList() {
    return GRNPaymentApprovalService.GetGRNPaymentApprovalList()
        .then(function (response) {
            gpaListFullRows = normalizeApiRows(response).map(mapGpaListRow);
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
    await Promise.all([loadVendorList(), loadBankPaymentList()]);
    setTodayDates();
    await loadGRNPaymentApprovalList();
    showListView();

    initBillGrid();

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
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.Data)) return result.Data;
    const nested = result?.Items ?? result?.items ?? result?.Details ?? result?.details ?? result?.Lines ?? result?.lines;
    if (Array.isArray(nested)) return nested;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        const billish = result.BillNo != null || result.billNo != null || result.BillAmount != null || result.billAmount != null;
        const payLine =
            result.PaymentAmount != null || result.paymentAmount != null
            || result.MRNMaster_Code != null || result.mRNMaster_Code != null || result.mrnMaster_Code != null
            || result.GRNPaymentMaster_Code != null || result.gRNPaymentMaster_Code != null
            || result.GRNPaymentDetail_Code != null || result.GRNPaymentDetails_Code != null
            || result.DetailCode != null || result.detailCode != null
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

/**
 * Detail lines for edit: sibling array, nested on master, or under VW_* (Pascal + camelCase).
 */
function extractGRNPaymentDetailsArray(root, master) {
    if (!root && !master) return [];
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
        root?.details
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

async function loadVendorList() {
    const ddl = document.getElementById('ddlPartyName');
    if (!ddl) return;
    try {
        const result = await GRNPaymentApprovalService.GetVendor();
        const rows = normalizeApiRows(result);
        ddl.innerHTML = '<option value="">-- Select Party --</option>';
        rows.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? '';
            opt.text = v.VendorName ?? v.vendorName ?? v.Name ?? '';
            const acc = v.AccountMaster_Code ?? v.accountMaster_Code;
            if (acc !== undefined && acc !== null && `${acc}`.trim() !== '') {
                opt.dataset.accountCode = String(acc);
            }
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load vendors:', e);
    }
}

function fillBillGridFromDetailRows(rows) {
    const tbody = document.getElementById('billTbody');
    if (!tbody) return;
    clearBillRows();
    if (!rows || rows.length === 0) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        return;
    }
    rows.forEach(r => {
        tbody.insertAdjacentHTML('beforeend', billRowTemplate());
        const tr = tbody.querySelector('tr.bill-row:last-child');
        if (tr) applyBillDetailRow(tr, r);
    });
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

function getSelectedAccountMasterCode() {
    const ddl = document.getElementById('ddlPartyName');
    const opt = ddl?.selectedOptions?.[0];
    const acc = opt?.dataset?.accountCode;
    if (acc !== undefined && acc !== null && String(acc).trim() !== '') {
        return parseInt(acc, 10) || 0;
    }
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
    <td><input type="text" class="form-control form-control-sm inp-deduction" readonly tabindex="-1" placeholder="—" style="background:#f1f5f9;border-color:#cbd5e1;min-width:72px;"></td>
    <td><input type="text" class="form-control form-control-sm inp-project" readonly tabindex="-1" placeholder="—" style="background:#f1f5f9;border-color:#cbd5e1;min-width:120px;"></td>
    <td><input type="text" class="form-control form-control-sm inp-subproject" readonly tabindex="-1" placeholder="—" style="background:#f1f5f9;border-color:#cbd5e1;min-width:120px;"></td>
    <td><input type="date" class="form-control form-control-sm inp-bill-date" autocomplete="off"></td>
    <td><input type="number" class="form-control form-control-sm inp-bill-amt" min="0" step="0.01" placeholder="0" onkeydown="blockNonNumeric(event)" oninput="stripNonNumeric(this)"></td>
    <td><input type="number" class="form-control form-control-sm inp-payable" min="0" step="0.01" placeholder="0" readonly style="background:#ede9fe;border-color:#c4b5fd;"></td>
    <td><input type="number" class="form-control form-control-sm inp-payment" min="0" step="0.01" placeholder="0" onkeydown="blockNonNumeric(event)" oninput="stripNonNumeric(this)"></td>
    <td style="text-align:center;vertical-align:middle;">
        <button type="button" class="del-row-btn" onclick="removeGpaBillRow(this)" title="Remove row"><i class="fa fa-trash"></i></button>
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
    }
}

function wireBillTableDelegation() {
    const tbody = document.getElementById('billTbody');
    if (!tbody || tbody.dataset.delegationWired === '1') return;
    tbody.dataset.delegationWired = '1';
    tbody.addEventListener('input', e => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        if (t.classList.contains('inp-bill-amt')) {
            const tr = t.closest('tr');
            const pay = tr && tr.querySelector('.inp-payable');
            if (pay) pay.value = t.value;
            const payInp = tr && tr.querySelector('.inp-payment');
            if (payInp) clampGpaPaymentToPayable(payInp);
        }
        if (t.classList.contains('inp-payment')) {
            clampGpaPaymentToPayable(t);
        }
        if (t.classList.contains('inp-bill-amt') || t.classList.contains('inp-payment')) {
            recalcFooter();
        }
    });
    tbody.addEventListener('focusout', e => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement) || !t.classList.contains('inp-bill-no')) return;
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
    tbody.insertAdjacentHTML('beforeend', `
<tr id="trGpaPartyHint" class="gpa-party-hint-row">
    <td colspan="9" style="text-align:center;padding:18px 12px;background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(99,102,241,0.05));border-top:1px dashed #c4b5fd;">
        <div style="display:inline-flex;align-items:center;gap:10px;max-width:520px;">
            <i class="fa fa-info-circle" style="color:#667eea;font-size:1.1rem;"></i>
            <span style="font-size:0.82rem;color:#475569;">
                Select <strong style="color:#4f46e5;">Party Name</strong> first (section 1). Then turn on <strong style="color:#4f46e5;">Fill Grid</strong> to load pending bills from the server, or use <strong style="color:#4f46e5;">Add row</strong> to enter a bill manually.
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

function formatMoney(n) {
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function sumGpaGridPaymentAmounts() {
    let sum = 0;
    document.querySelectorAll('#billTbody .inp-payment').forEach(inp => {
        sum += parseNum(inp);
    });
    return sum;
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
    const party = document.getElementById('ddlPartyName')?.value?.trim() ?? '';
    if (isGpaFillGridChecked() && !party) {
        showToast('Please select Party Name first (same as GRN: pick Party before loading the grid).', 'warning');
        const chk = document.getElementById('chkGpaFillGrid');
        if (chk) chk.checked = false;
        recalcFooter();
        return;
    }
    if (isGpaFillGridChecked() && party) {
        try {
            const result = await GRNPaymentApprovalService.GetBillDetails(party);
            const billRows = normalizeApiRows(result);
            fillBillGridFromDetailRows(billRows);
            if (billRows.length === 0) {
                showToast('No pending bills for this party.', 'info');
            }
        } catch (e) {
            console.error('onGpaFillGridChange', e);
            clearBillRows();
            showGpaPartyHint();
            showToast('Could not load bill details for party.', 'error');
        }
    } else if (!isGpaFillGridChecked()) {
        clearBillRows();
        if (party) addBillRows(DEFAULT_BILL_ROW_COUNT);
        else showGpaPartyHint();
    }
    recalcFooter();
}

function clearGpaAddBillModalBillFields() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalMrn', '');
    set('gpaAddBillModalBillNo', '');
    set('gpaAddBillModalBillDate', '');
    set('gpaAddBillModalBillAmt', '');
    set('gpaAddBillModalPayable', '');
    set('gpaAddBillModalPayment', '');
}

function populateGpaAddBillModalPartySelect() {
    const main = document.getElementById('ddlPartyName');
    const modalP = document.getElementById('gpaAddBillModalParty');
    if (!modalP || !main) return;
    modalP.innerHTML = '';
    for (let i = 0; i < main.options.length; i++) {
        const o = main.options[i];
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.text = o.text;
        const acc = o.dataset?.accountCode;
        if (acc !== undefined && acc !== null && String(acc).trim() !== '') {
            opt.dataset.accountCode = String(acc);
        }
        modalP.appendChild(opt);
    }
}

function resetGpaAddBillModalForm() {
    const partySel = document.getElementById('gpaAddBillModalParty');
    if (partySel) partySel.value = '';
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

function applyBillApiRowToModalInputs(r) {
    if (!r) return;
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
    set('gpaAddBillModalBillDate', formatDateInput(bdt));
    set('gpaAddBillModalBillAmt', bAmt !== undefined && bAmt !== null && bAmt !== '' ? String(bAmt) : '');
    const payStr = pAmt !== undefined && pAmt !== null && pAmt !== '' ? String(pAmt) : '';
    set('gpaAddBillModalPayable', payStr);
    set('gpaAddBillModalPayment', '');
}

function onGpaAddBillModalBillChange() {
    const sel = document.getElementById('gpaAddBillModalBill');
    const v = sel?.value ?? '';
    if (v === '') {
        clearGpaAddBillModalBillFields();
        return;
    }
    const idx = parseInt(v, 10);
    const r = gpaAddBillModalBillRowsCache[idx];
    if (r) applyBillApiRowToModalInputs(r);
}

/** Modal party → sync header party (no onPartyChange, avoids wiping grid) + load bills into modal. */
async function onGpaAddBillModalPartyChange() {
    const party = document.getElementById('gpaAddBillModalParty')?.value ?? '';
    const mainDdl = document.getElementById('ddlPartyName');
    if (mainDdl && party) {
        mainDdl.value = party;
    }

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
            if (hintText) hintText.textContent = 'Select Party Name to load bill details below.';
        }
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
        console.error('onGpaAddBillModalPartyChange', e);
        showToast('Could not load bills for this party.', 'error');
    }
}

function onGpaAddBillModalBillAmtInput() {
    const ba = document.getElementById('gpaAddBillModalBillAmt');
    const py = document.getElementById('gpaAddBillModalPayable');
    if (py && ba) py.value = ba.value;
}

async function onAddBillRowClick() {
    removeGpaPartyHint();
    if (!document.querySelector('#billTbody tr.bill-row')) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
    }
    resetGpaAddBillModalForm();
    populateGpaAddBillModalPartySelect();
    const mainParty = document.getElementById('ddlPartyName')?.value ?? '';
    const modalParty = document.getElementById('gpaAddBillModalParty');
    if (modalParty && mainParty) {
        modalParty.value = mainParty;
        await onGpaAddBillModalPartyChange();
    } else {
        const hint = document.getElementById('gpaAddBillModalHint');
        const hintText = document.getElementById('gpaAddBillModalHintText');
        if (hint) hint.style.display = 'block';
        if (hintText) {
            hintText.textContent = 'Select Party Name to load bill details into the form below.';
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
    const payable = parseFloat(String(document.getElementById('gpaAddBillModalPayable')?.value ?? '').replace(/,/g, ''));
    const billNo = document.getElementById('gpaAddBillModalBillNo')?.value?.trim() ?? '';

    const modalParty = document.getElementById('gpaAddBillModalParty')?.value?.trim() ?? '';
    if (!modalParty) {
        showToast('Please select Party Name in the add bill window.', 'warning');
        return;
    }
    if (mrn <= 0 && pay <= 0) {
        showToast('Enter payment amount or load a bill by selecting party / bill.', 'warning');
        return;
    }
    if (Number.isFinite(payable) && pay > payable) {
        showToast('Payment amount cannot be greater than Payable amount.', 'warning');
        return;
    }

    document.getElementById('billTbody')?.insertAdjacentHTML('beforeend', billRowTemplate());
    const tbody = document.getElementById('billTbody');
    const tr = tbody?.querySelector('tr.bill-row:last-child');
    if (!tr) return;

    let rowObj = {
        MRNMaster_Code: mrn > 0 ? mrn : undefined,
        BillNo: billNo,
        BillDate: document.getElementById('gpaAddBillModalBillDate')?.value ?? '',
        BillAmount: document.getElementById('gpaAddBillModalBillAmt')?.value ?? '',
        PayableAmount: document.getElementById('gpaAddBillModalPayable')?.value ?? '',
        PaymentAmount: document.getElementById('gpaAddBillModalPayment')?.value ?? '',
    };
    if (mrn > 0 && Array.isArray(gpaAddBillModalBillRowsCache) && gpaAddBillModalBillRowsCache.length) {
        const hit = gpaAddBillModalBillRowsCache.find(x => resolveMrnFromRow(x) === mrn);
        if (hit) rowObj = { ...hit, ...rowObj };
    }
    applyBillDetailRow(tr, rowObj);
    const dc = tr.querySelector('.inp-detail-code');
    if (dc) dc.value = '0';

    recalcFooter();

    const modalEl = document.getElementById('gpaAddBillModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const inst = bootstrap.Modal.getInstance(modalEl) ?? bootstrap.Modal.getOrCreateInstance(modalEl);
        inst.hide();
    }
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
        const payExplicit = r.PaymentAmount ?? r.paymentAmount;
        if (payExplicit !== undefined && payExplicit !== null && payExplicit !== '') {
            pm.value = String(payExplicit);
        } else {
            pm.value = '';
        }
    }
    const ded = tr.querySelector('.inp-deduction');
    const pj = tr.querySelector('.inp-project');
    const sp = tr.querySelector('.inp-subproject');
    if (ded) {
        const dv = r.Dedution ?? r.dedution ?? r.Deduction ?? r.deduction;
        ded.value = dv !== undefined && dv !== null && `${dv}`.trim() !== '' ? String(dv) : '';
    }
    if (pj) {
        const pv = r.ProjectDesp ?? r.projectDesp ?? r.Project ?? r.project ?? '';
        pj.value = pv !== undefined && pv !== null ? String(pv) : '';
    }
    if (sp) {
        const sv = r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProject ?? r.subProject ?? '';
        sp.value = sv !== undefined && sv !== null ? String(sv) : '';
    }
}

function rowMrnFromBillApi(r) {
    return resolveMrnFromRow(r) ?? 0;
}

/** Edit (GRNService-style): merge saved detail line with pending bill row by MRN, then bind once to #billTbody — never the Add bill modal. */
function mergeEditDetailWithBillLookup(d, billRows) {
    const mrn = rowMrnFromBillApi(d);
    if (!mrn || !billRows?.length) return d;
    const br = billRows.find(row => rowMrnFromBillApi(row) === mrn);
    return br ? { ...br, ...d } : d;
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
        showGpaPartyHint();
        recalcFooter();
        return;
    }
    if (!isGpaFillGridChecked()) {
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        recalcFooter();
        return;
    }
    try {
        const result = await GRNPaymentApprovalService.GetBillDetails(code);
        const billRows = normalizeApiRows(result);
        fillBillGridFromDetailRows(billRows);
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

function collectPayload() {
    const masterCode = parseInt(document.getElementById('hdnGRNPaymentMasterCode')?.value ?? '0', 10) || 0;
    const entryNoRaw = document.getElementById('txtEntryNo')?.value?.trim() ?? '';
    const entryNo = parseInt(entryNoRaw, 10) || 0;
    const entryDateStr = document.getElementById('dtPaymentDate')?.value ?? '';
    const bankType = parseInt(document.getElementById('ddlPaymentMode')?.value ?? '0', 10) || 0;

    const GRNPaymentMaster = [{
        Code: masterCode,
        EntryNo: entryNo,
        RefNo: document.getElementById('txtRefNo')?.value?.trim() ?? '',
        EntryDate: entryDateStr ? entryDateStr : null,
        AccountMaster_Code: getSelectedAccountMasterCode(),
        F_BankPaymentTypeMaster_Code: bankType,
        Amount: parseNum(document.getElementById('txtHeaderAmount')),
        AdvanceAmount: parseNum(document.getElementById('txtFooterAdvance')),
        Narration: document.getElementById('txtNarration')?.value?.trim() ?? '',
    }];

    const GRNPaymentDetails = [];
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        const dCode = parseInt(tr.querySelector('.inp-detail-code')?.value ?? '0', 10) || 0;
        const pay = parseNum(tr.querySelector('.inp-payment'));
        if (mrn <= 0) return;
        GRNPaymentDetails.push({
            Code: dCode,
            GRNPaymentMaster_Code: masterCode,
            MRNMaster_Code: mrn,
            PaymentAmount: pay,
        });
    });

    /* VM_GRNPaymentMaster: GRNPaymentMaster[] (TY_GRNPaymentMaster) + GRNPaymentDetails[] (TY_GRNPaymentDetails) — matches SaveGRNPaymentApproval SP SAVE TVPs */
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
        await loadVendorList();
        await loadBankPaymentList();
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

        const bank = master?.F_BankPaymentTypeMaster_Code ?? master?.f_BankPaymentTypeMaster_Code;
        const ddlBank = document.getElementById('ddlPaymentMode');
        if (ddlBank && bank !== undefined && bank !== null) ddlBank.value = String(bank);
        syncRefNoRequiredUI();

        const ref = document.getElementById('txtRefNo');
        if (ref) ref.value = master?.RefNo ?? master?.refNo ?? '';

        const ha = document.getElementById('txtHeaderAmount');
        if (ha) {
            const amt = master?.Amount ?? master?.amount;
            ha.value = amt !== undefined && amt !== null ? String(amt) : '';
        }

        const nar = document.getElementById('txtNarration');
        if (nar) nar.value = master?.Narration ?? master?.narration ?? '';

        hideGpaAddBillModalAndReset();

        const partyVendorForBills = document.getElementById('ddlPartyName')?.value?.trim() ?? '';
        const pendingBillRows = partyVendorForBills ? await fetchPartyPendingBillRows(partyVendorForBills) : [];

        clearBillRows();
        const tbody = document.getElementById('billTbody');
        if (details.length && tbody) {
            details.forEach(d => {
                const merged = mergeEditDetailWithBillLookup(d, pendingBillRows);
                tbody.insertAdjacentHTML('beforeend', billRowTemplate());
                const tr = tbody.querySelector('tr.bill-row:last-child');
                if (tr) applyBillDetailRow(tr, merged);
            });
        } else {
            addBillRows(DEFAULT_BILL_ROW_COUNT);
        }
        recalcFooter();
        const advEl = document.getElementById('txtFooterAdvance');
        if (advEl && master) {
            const advRaw = master.AdvanceAmount ?? master.advanceAmount;
            if (advRaw !== undefined && advRaw !== null && `${advRaw}`.trim() !== '') {
                advEl.value = formatMoney(Number(advRaw));
                advEl.dataset.advanceManual = '1';
            } else {
                delete advEl.dataset.advanceManual;
            }
        }
        gpaShowFillGridCheckbox(false);
    } catch (e) {
        showToast('Failed to load Payment Entry.', 'error');
    }
}

function validateGRNPaymentApproval() {
    const party = document.getElementById('ddlPartyName')?.value;
    if (!party) {
        showToast('Please select Party Name (Vendor).', 'warning');
        return false;
    }
    if (!document.getElementById('dtPaymentDate')?.value) {
        showToast('Please enter Date.', 'warning');
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
    let hasMrnLine = false;
    billRows.forEach(tr => {
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        if (mrn > 0) hasMrnLine = true;
    });
    if (!hasMrnLine) {
        showToast('Bill allocation: fill at least one row with a valid bill (MRN). Use Fill Grid or Add row to load bills for the party.', 'warning');
        return false;
    }
    let badMrn = false;
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        const pay = parseNum(tr.querySelector('.inp-payment'));
        if (pay > 0 && mrn <= 0) badMrn = true;
    });
    if (badMrn) {
        showToast('Payment amount is set but MRN is missing. Use Fill Grid or Add row so the bill line loads MRN from the server.', 'warning');
        return false;
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
    const headerAmt = parseNum(document.getElementById('txtHeaderAmount'));
    const sumPay = sumGpaGridPaymentAmounts();
    const adv = parseNum(document.getElementById('txtFooterAdvance'));
    const allocated = sumPay + adv;
    const EPS = 0.005;
    // When Advance is auto (Amount − total payment), allocated always equals Amount, so the
    // check below never fires; block over-allocation and negative Advance explicitly.
    if (sumPay > headerAmt + EPS || adv < -EPS) {
        showToast(
            `Total payment (${formatMoney(sumPay)}) cannot exceed Amount (${formatMoney(headerAmt)}). Advance / On account cannot be negative.`,
            'warning'
        );
        return false;
    }
    if (allocated > headerAmt + EPS) {
        showToast(
            `Total payment (${formatMoney(sumPay)}) + Advance / On account (${formatMoney(adv)}) must not exceed Amount (${formatMoney(headerAmt)}). Current total: ${formatMoney(allocated)}.`,
            'warning'
        );
        return false;
    }
    const p = collectPayload();
    if (!p.GRNPaymentDetails.length) {
        showToast('Add at least one bill line with a valid MRN (and payment if required).', 'warning');
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
                editMode = false;
                setTimeout(async () => {
                    await loadGRNPaymentApprovalList();
                    showListView();
                }, 1200);
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
    const h = document.getElementById('hdnGRNPaymentMasterCode');
    if (h) h.value = '0';
    editMode = false;
    const txtEn = document.getElementById('txtEntryNo');
    if (txtEn) txtEn.value = '';
    updateFloatBarEntryNo();
    const ddl = document.getElementById('ddlPartyName');
    if (ddl) ddl.value = '';
    const mode = document.getElementById('ddlPaymentMode');
    if (mode) {
        mode.selectedIndex = 0;
        loadBankPaymentList();
    } else {
        syncRefNoRequiredUI();
    }
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
    const d1 = document.getElementById('dtPaymentDate');
    if (d1) d1.value = '';
    setTodayDates();
    clearBillRows();
    showGpaPartyHint();
    recalcFooter();
    hideGpaAddBillModalAndReset();
    if (typeof window.ClearPendingAttachments_AttachmentControl === 'function') {
        window.ClearPendingAttachments_AttachmentControl();
    }
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

window.InitAttachmentControl = InitAttachmentControl;
window.openGpaAttachmentControl = openGpaAttachmentControl;
window.openGpaListAttachmentControl = openGpaListAttachmentControl;
window.blockNonNumeric = blockNonNumeric;
window.stripNonNumeric = stripNonNumeric;
window.markFooterAdvanceManual = markFooterAdvanceManual;
window.onPartyChange = onPartyChange;
window.syncRefNoRequiredUI = syncRefNoRequiredUI;
window.onGpaFillGridChange = onGpaFillGridChange;
window.onAddBillRowClick = onAddBillRowClick;
window.removeGpaBillRow = removeGpaBillRow;
window.onGpaAddBillModalPartyChange = onGpaAddBillModalPartyChange;
window.onGpaAddBillModalBillChange = onGpaAddBillModalBillChange;
window.onGpaAddBillModalBillAmtInput = onGpaAddBillModalBillAmtInput;
window.saveGpaAddBillModalToGrid = saveGpaAddBillModalToGrid;
window.saveGRNPaymentApproval = saveGRNPaymentApproval;
window.resetGRNPaymentApprovalForm = resetGRNPaymentApprovalForm;
window.newGRNPaymentApproval = newGRNPaymentApproval;
window.cancelGRNPaymentApproval = cancelGRNPaymentApproval;
window.editGRNPaymentApproval = editGRNPaymentApproval;
window.confirmDeleteGRNPaymentApproval = confirmDeleteGRNPaymentApproval;
window.onGpaListStatusTabClick = onGpaListStatusTabClick;
