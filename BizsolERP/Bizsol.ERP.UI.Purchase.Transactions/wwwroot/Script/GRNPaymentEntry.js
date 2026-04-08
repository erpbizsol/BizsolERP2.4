
import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { GRNService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_GRNService.js';
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
/** Cached from GetVendor — used for print voucher party lookup. */
let gpaVendorListCache = [];
/** Cached from GetBankPayment — used for print voucher payment mode label. */
let gpaBankPaymentListCache = [];
/** Cached from GRN GetProjectList — bill row project dropdowns. */
let gpaProjectListCache = [];
/** Cached from GetMarketingManMaster — employee dropdown. */
let gpaEmployeeListCache = [];
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
    const empRaw = item.Employee ?? item.employee ?? item.MarketingManMaster ?? item.marketingManMaster
        ?? item.MarketingManName ?? item.marketingManName ?? '';
    const employee = empRaw !== undefined && empRaw !== null ? String(empRaw).trim() : '';
    const rawAmt = item.Amount ?? item.amount ?? item.HeaderAmount ?? item.headerAmount;
    const amt = rawAmt !== undefined && rawAmt !== null && rawAmt !== '' ? Number(rawAmt) : '';
    const ref = item.RefNo ?? item.refNo ?? '';
    const label = String(entryNo || code || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const rawEdStr = ed ? String(ed).substring(0, 10) : '';
    const enNum = parseInt(entryNo, 10) || 0;
    const btns =
        '<button type="button" class="im-btn-print-preview" title="Print Preview" onclick="PrintGRNPaymentVoucher(' + code + ',\'preview\')">' +
        '<i class="fa fa-search-plus"></i></button>' +
        '<button type="button" class="im-btn-print" title="Print" onclick="PrintGRNPaymentVoucher(' + code + ',\'print\')">' +
        '<i class="fa fa-print"></i></button>' +
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
        Employee: employee,
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
    const hiddenColumns = ['Code', 'StatusCode'];
    const ColumnAlignment = { Action: 'center;width:268px;' };

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
    await Promise.all([loadVendorList(), loadBankPaymentList(), loadEmployeeList(), loadGpaProjectListForGrid()]);
    syncGpaPartyEmployeeUI();
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
        const result = await GRNService.GetProjectList();
        gpaProjectListCache = Array.isArray(result) ? result : normalizeApiRows(result);
    } catch (e) {
        console.error('loadGpaProjectListForGrid', e);
        gpaProjectListCache = [];
    }
}

function isGpaPartyMode() {
    const chk = document.getElementById('chkGpaPayToParty');
    return chk ? chk.checked : true;
}

/** Edit load: employee payment vs vendor — API may send MarketingManMaster / Employee / *_Code. */
function gpaMasterIsEmployeePayment(master) {
    if (!master || typeof master !== 'object') return false;
    const name = master.MarketingManMaster ?? master.marketingManMaster ?? master.Employee ?? master.employee ?? '';
    if (String(name).trim() !== '') return true;
    const mc = master.MarketingManMaster_Code ?? master.marketingManMaster_Code
        ?? master.F_MarketingManMaster_Code ?? master.f_MarketingManMaster_Code;
    const n = parseInt(String(mc ?? '0'), 10);
    return Number.isFinite(n) && n > 0;
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
        if (tr) await applyBillDetailRow(tr, r);
    }
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
    <td><input type="text" class="form-control form-control-sm inp-deduction" readonly tabindex="-1" placeholder="—" style="background:#f1f5f9;border-color:#cbd5e1;min-width:72px;"></td>
    <td><select class="form-control form-control-sm inp-project-ddl" style="min-width:140px;"><option value="">-- Project --</option></select></td>
    <td><select class="form-control form-control-sm inp-subproject-ddl" style="min-width:140px;"><option value="">-- Sub project --</option></select></td>
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
        const tr = tbody.querySelector('tr.bill-row:last-child');
        if (tr) {
            initBillRowProjectSelects(tr);
            gpaRefreshRowPayableEditable(tr);
        }
    }
}

function initBillRowProjectSelects(tr) {
    const pj = tr.querySelector('.inp-project-ddl');
    const sp = tr.querySelector('.inp-subproject-ddl');
    if (!pj || !sp) return;
    pj.innerHTML = '<option value="">-- Project --</option>';
    (gpaProjectListCache || []).forEach(p => {
        const opt = document.createElement('option');
        const code = p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code ?? '';
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
    if (!projectCode) return;
    try {
        const subResult = await GRNService.GetSubProjectList(projectCode);
        const subs = Array.isArray(subResult) ? subResult : normalizeApiRows(subResult);
        subs.forEach(s => {
            const opt = document.createElement('option');
            const code = s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? s.code ?? '';
            opt.value = code !== undefined && code !== null ? String(code) : '';
            opt.text = s.SubProjectName ?? s.subProjectName ?? s.Name ?? s.SubProjectDesp ?? opt.value;
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
        const payExplicit = r.PaymentAmount ?? r.paymentAmount;
        if (payExplicit !== undefined && payExplicit !== null && payExplicit !== '') {
            pm.value = String(payExplicit);
        }
    }
    const ded = tr.querySelector('.inp-deduction');
    if (ded) {
        const dv = r.Dedution ?? r.dedution ?? r.Deduction ?? r.deduction;
        ded.value = dv !== undefined && dv !== null && `${dv}`.trim() !== '' ? String(dv) : '';
    }
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
            const result = await GRNPaymentApprovalService.GetBillDetails(cp);
            const billRows = normalizeApiRows(result);
            await fillBillGridFromDetailRows(billRows);
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
        if (cp) addBillRows(DEFAULT_BILL_ROW_COUNT);
        else showGpaPartyHint();
    }
    recalcFooter();
}

function clearGpaAddBillModalBillFields() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('gpaAddBillModalMrn', '');
    set('gpaAddBillModalBillNo', '');
    set('gpaAddBillModalProject', '');
    set('gpaAddBillModalSubProject', '');
    set('gpaAddBillModalBillDate', '');
    set('gpaAddBillModalBillAmt', '');
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
    set('gpaAddBillModalBillDate', '');
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
        const code = p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? p.code ?? '';
        opt.value = code !== undefined && code !== null ? String(code) : '';
        opt.text = p.ProjectName ?? p.projectName ?? p.Name ?? p.ProjectDesp ?? p.projectDesp ?? opt.value;
        pSel.appendChild(opt);
    });
    sSel.innerHTML = '<option value="">-- Sub project --</option>';
}

async function fillGpaAddBillModalSubProjects(projectCode) {
    const sSel = document.getElementById('gpaAddBillModalSubProject');
    if (!sSel) return;
    const prev = sSel.value;
    sSel.innerHTML = '<option value="">-- Sub project --</option>';
    if (!projectCode) return;
    try {
        const subResult = await GRNService.GetSubProjectList(projectCode);
        const subs = Array.isArray(subResult) ? subResult : normalizeApiRows(subResult);
        subs.forEach(s => {
            const opt = document.createElement('option');
            const code = s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? s.code ?? '';
            opt.value = code !== undefined && code !== null ? String(code) : '';
            opt.text = s.SubProjectName ?? s.subProjectName ?? s.Name ?? s.SubProjectDesp ?? opt.value;
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
            applyBillApiRowToModalInputs(billRows[0]);
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
    await populateGpaAddBillModalProjectSubDropdowns();
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
        const payExplicit = r.PaymentAmount ?? r.paymentAmount;
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
        await fillBillGridFromDetailRows(billRows);
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
        await fillBillGridFromDetailRows(billRows);
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
    showGpaPartyHint();
    recalcFooter();
}

function collectPayload() {
    const masterCode = parseInt(document.getElementById('hdnGRNPaymentMasterCode')?.value ?? '0', 10) || 0;
    const entryNoRaw = document.getElementById('txtEntryNo')?.value?.trim() ?? '';
    const entryNo = parseInt(entryNoRaw, 10) || 0;
    const entryDateStr = document.getElementById('dtPaymentDate')?.value ?? '';
    const bankType = parseInt(document.getElementById('ddlPaymentMode')?.value ?? '0', 10) || 0;

    /* TY_GRNPaymentMaster — must match API (no VendorMaster / F_Marketing / string MarketingMan / master Project). */
    const GRNPaymentMaster = [{
        Code: masterCode,
        EntryNo: entryNo,
        RefNo: document.getElementById('txtRefNo')?.value?.trim() ?? '',
        EntryDate: entryDateStr ? entryDateStr : null,
        AccountMaster_Code: gpaNumOrZero(gpaTyGrnPaymentMasterAccountMasterCode()),
        F_BankPaymentTypeMaster_Code: gpaNumOrZero(bankType),
        Amount: gpaNumOrZero(parseNum(document.getElementById('txtHeaderAmount'))),
        AdvanceAmount: gpaNumOrZero(parseNum(document.getElementById('txtFooterAdvance'))),
        Narration: document.getElementById('txtNarration')?.value?.trim() ?? '',
        MarketingManMaster_Code: gpaNumOrZero(gpaTyGrnPaymentMasterMarketingManMasterCode()),
    }];

    const GRNPaymentDetails = [];
    const employeeMode = !isGpaPartyMode();
    document.querySelectorAll('#billTbody tr.bill-row').forEach(tr => {
        const mrn = parseInt(tr.querySelector('.inp-mrn-code')?.value ?? '0', 10) || 0;
        const dCode = parseInt(tr.querySelector('.inp-detail-code')?.value ?? '0', 10) || 0;
        const projText = gpaSelectedOptionText(tr.querySelector('.inp-project-ddl'));
        const subText = gpaSelectedOptionText(tr.querySelector('.inp-subproject-ddl'));
        const eff = gpaLineEffectivePayment(tr);
        const pushDetail = (mrnCode, amt) => {
            GRNPaymentDetails.push({
                Code: dCode,
                GRNPaymentMaster_Code: masterCode,
                MRNMaster_Code: mrnCode,
                PaymentAmount: gpaNumOrZero(amt),
                ProjectMaster: projText,
                SubProjectMaster: subText,
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
        await loadVendorList();
        await loadEmployeeList();
        await loadBankPaymentList();
        await loadGpaProjectListForGrid();
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

        const counterpartyForBills = isEmpPayment
            ? (document.getElementById('ddlEmployeeName')?.value?.trim() ?? '')
            : (document.getElementById('ddlPartyName')?.value?.trim() ?? '');
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
        syncGpaPartyEmployeeUI();
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

function gpaPickPoFromMergedRows(rows) {
    let poNo = '';
    let poDate = '';
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const p = r.PONo ?? r.pONo ?? r.PO_No ?? r.poNo ?? r.PurchaseOrderNo ?? r.purchaseOrderNo ?? '';
        const d = r.PODate ?? r.pODate ?? r.PO_Date ?? r.poDate ?? r.PurchaseOrderDate ?? '';
        if (p || d) {
            poNo = p ? String(p) : '';
            poDate = d ? String(d) : '';
            break;
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
        vendorType: r.VendorType ?? r.vendorType ?? r.PartyType ?? '',
        contact: r.ContactNo ?? r.contactNo ?? r.Mobile ?? r.mobile ?? r.Phone ?? r.phone ?? '',
    };
}

function PrintGRNPaymentVoucher(code, mode) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid payment entry.');
        return;
    }
    GRNPaymentApprovalService.GetGRNPaymentApprovalByCode(codeNum).then(async function (res) {
        const root = peelGrnPaymentApiRoot(res);
        const master = firstMasterFromApi(root);
        let details = extractGRNPaymentDetailsArray(root, master);
        if (!master) {
            if (typeof toastr !== 'undefined') toastr.error('Payment entry not found.');
            return;
        }

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

        const mergedDetails = (details || []).map(function (d) {
            return mergeEditDetailWithBillLookup(d, billLookup);
        });

        const { companyName, companyAddr, companyGST, companyTag } = gpaSessionCompanyInfo();
        let creditTo = gpaLookupVendorName(master);
        if (!creditTo && Array.isArray(gpaListFullRows)) {
            const hit = gpaListFullRows.find(function (r) { return r.Code == codeNum; });
            if (hit && hit['Party Name']) creditTo = String(hit['Party Name']);
        }
        creditTo = creditTo || '';

        const refNo = master.RefNo ?? master.refNo ?? '';
        const entryDateRaw = master.EntryDate ?? master.entryDate ?? master.PaymentDate ?? master.paymentDate;
        const voucherDate = formatGpaListDate(entryDateRaw);

        const bankCode = master.F_BankPaymentTypeMaster_Code ?? master.f_BankPaymentTypeMaster_Code;
        const payModeLabel = gpaLookupBankPaymentLabel(bankCode) || '—';

        const amt = parseFloat(master.Amount ?? master.amount ?? 0) || 0;
        const narration = master.Narration ?? master.narration ?? '';
        const advance = parseFloat(master.AdvanceAmount ?? master.advanceAmount ?? 0) || 0;

        const poPair = gpaPickPoFromMergedRows(mergedDetails);
        const poDateDisp = poPair.poDate ? formatGpaListDate(poPair.poDate) : '';
        const site0 = mergedDetails.length ? gpaPickSiteBundleFromRow(mergedDetails[0]) : gpaPickSiteBundleFromRow({});

        let detailsLines = '';
        mergedDetails.forEach(function (row, idx) {
            const sb = gpaPickSiteBundleFromRow(row);
            const billNo = row.BillNo ?? row.billNo ?? row.Name ?? row.name ?? '';
            const pay = row.PaymentAmount ?? row.paymentAmount ?? '';
            detailsLines += '<div style="margin-bottom:6px;">'
                + '<b>Line ' + (idx + 1) + '</b>'
                + (billNo ? ' &mdash; Bill: ' + gpaEscapeHtml(String(billNo)) : '')
                + (pay !== '' && pay != null ? ' &mdash; Paid: &#8377;' + gpaFormatIndianCurrency(pay) : '')
                + (sb.project ? '<br><span>Project: ' + gpaEscapeHtml(String(sb.project)) + '</span>' : '')
                + (sb.site ? '<br><span>Site: ' + gpaEscapeHtml(String(sb.site)) + '</span>' : '')
                + '</div>';
        });
        const detailsBlock = ''
            + (narration ? '<div style="margin-bottom:8px;"><b>Narration:</b><br>' + gpaEscapeHtml(String(narration)) + '</div>' : '')
            + (detailsLines || '<span style="color:#666;">—</span>')
            + '<div style="margin-top:10px;font-weight:700;">Amount (figures): &#8377; ' + gpaFormatIndianCurrency(amt)
            + '</div><div style="margin-top:4px;font-size:9pt;">Amount (words): ' + gpaNumberToWords(Math.round(amt)) + '</div>'
            + (advance > 0.005 ? '<div style="margin-top:4px;">Advance / adjustment: &#8377; ' + gpaFormatIndianCurrency(advance) + '</div>' : '');

        const css = '@page{size:A4 portrait;margin:10mm 12mm 14mm 12mm;}'
            + '*{box-sizing:border-box;margin:0;padding:0;}'
            + 'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;background:#fff;}'
            + '.no-print{margin-bottom:5mm;}'
            + '@media print{.no-print{display:none!important;}}'
            + '.pv-wrap{max-width:780px;margin:0 auto;border:2px solid #000;padding:12px 14px;}'
            + '.pv-co{text-align:center;font-size:14pt;font-weight:800;margin-bottom:2px;}'
            + '.pv-tag{text-align:center;font-size:8.5pt;margin-bottom:4px;color:#222;}'
            + '.pv-addr{text-align:center;font-size:9pt;margin-bottom:3px;line-height:1.35;}'
            + '.pv-gst{text-align:center;font-size:9pt;margin-bottom:10px;}'
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
            + '<div class="pv-co">' + gpaEscapeHtml(companyName || 'Company Name') + '</div>'
            + (companyTag ? '<div class="pv-tag">' + gpaEscapeHtml(companyTag) + '</div>' : '')
            + (companyAddr ? '<div class="pv-addr">Address: ' + gpaEscapeHtml(companyAddr) + '</div>' : '')
            + '<div class="pv-gst">GSTIN: ' + gpaEscapeHtml(companyGST || '') + '</div>'
            + '<div class="pv-title">Payment Voucher</div>'
            + '<table class="pv-t" role="presentation">'
            + '<tr><td class="lbl">Reference No</td><td>' + gpaEscapeHtml(String(refNo || '')) + '</td>'
            + '<td class="lbl" style="width:18%;">Voucher Date</td><td style="width:22%;">' + gpaEscapeHtml(voucherDate) + '</td></tr>'
            + '<tr><td class="lbl">PO No</td><td>' + gpaEscapeHtml(poPair.poNo) + '</td>'
            + '<td class="lbl">PO Date</td><td>' + gpaEscapeHtml(poDateDisp) + '</td></tr>'
            + '<tr><td class="lbl">NEFT / Cheque / RTGS</td><td colspan="3">' + gpaEscapeHtml(payModeLabel) + '</td></tr>'
            + '<tr><td class="lbl">Credit to</td><td colspan="3">' + gpaEscapeHtml(creditTo) + '</td></tr>'
            + '<tr><td class="lbl">Project Name</td><td colspan="3">' + gpaEscapeHtml(String(site0.project || '')) + '</td></tr>'
            + '<tr><td class="lbl">Site Name</td><td colspan="3">' + gpaEscapeHtml(String(site0.site || '')) + '</td></tr>'
            + '<tr><td class="lbl">Site Type</td><td colspan="3">' + gpaEscapeHtml(String(site0.siteType || '')) + '</td></tr>'
            + '<tr><td class="lbl">Vendor Type</td><td colspan="3">' + gpaEscapeHtml(String(site0.vendorType || '')) + '</td></tr>'
            + '<tr><td class="lbl">Contact No</td><td colspan="3">' + gpaEscapeHtml(String(site0.contact || '')) + '</td></tr>'
            + '<tr><td class="lbl">Payment for</td><td colspan="3">GRN / Bill payment against pending invoices</td></tr>'
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
        if (mode === 'print') {
            setTimeout(function () { win.focus(); win.print(); }, 600);
        }
    }).catch(function (err) {
        if (typeof toastr !== 'undefined') toastr.error('Error loading payment entry for print.');
        console.error(err);
    });
}

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
window.PrintGRNPaymentVoucher = PrintGRNPaymentVoucher;
