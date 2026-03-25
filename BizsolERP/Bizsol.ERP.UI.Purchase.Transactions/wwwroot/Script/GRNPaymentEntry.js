import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

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

// ══════════════════════════════════════════════════════════════════════════════
// LIST VIEW (GetGRNPaymentApprovalList → BizsolCustomFilterGrid, same as GRNService)
// ══════════════════════════════════════════════════════════════════════════════
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

function normalizeGpaListResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.Data)) return response.Data;
    if (Array.isArray(response?.Items)) return response.Items;
    return [];
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
    const btns =
        '<button type="button" class="im-btn-edit" title="Edit" onclick="editGRNPaymentApproval(' + code + ')">' +
        '<i class="fas fa-pen"></i></button>' +
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
}

function loadGRNPaymentApprovalList() {
    return GRNPaymentApprovalService.GetGRNPaymentApprovalList()
        .then(function (response) {
            const rows = normalizeGpaListResponse(response).map(mapGpaListRow);
            if (rows.length > 0) {
                $('#gpaListTable').show();
                const StringFilterColumn = ['Party Name', 'Ref No'];
                const NumericFilterColumn = ['Entry No', 'Amount'];
                const DateFilterColumn = ['Entry Date'];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ['Code'];
                const ColumnAlignment = { Action: 'center;width:118px;' };
                BizsolCustomFilterGrid.CreateDataTable(
                    'gpaListTable-hader',
                    'gpaListTbody-body',
                    rows,
                    Button,
                    showButtons,
                    StringFilterColumn,
                    NumericFilterColumn,
                    DateFilterColumn,
                    StringdoubleFilterColumn,
                    hiddenColumns,
                    ColumnAlignment
                );
            } else {
                if (typeof toastr !== 'undefined') toastr.warning('No payment entries found.');
                $('#gpaListTable').hide();
            }
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Failed to load payment list.');
            $('#gpaListTable').hide();
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

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
});

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
    if (result && typeof result === 'object' && (result.BillNo != null || result.billNo != null || result.BillAmount != null || result.billAmount != null)) {
        return [result];
    }
    return [];
}

/** Mode BANKPAYMENTTYPE — bind F_BankPaymentTypeMaster_Code + display name. */
async function loadBankPaymentList() {
    const ddl = document.getElementById('ddlPaymentMode');
    if (!ddl) return;
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
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load bank payment types:', e);
    }
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
    <td><input type="date" class="form-control form-control-sm inp-bill-date" autocomplete="off"></td>
    <td><input type="number" class="form-control form-control-sm inp-bill-amt" min="0" step="0.01" placeholder="0" onkeydown="blockNonNumeric(event)" oninput="stripNonNumeric(this)"></td>
    <td><input type="number" class="form-control form-control-sm inp-payable" min="0" step="0.01" placeholder="0" readonly style="background:#ede9fe;border-color:#c4b5fd;"></td>
    <td><input type="number" class="form-control form-control-sm inp-payment" min="0" step="0.01" placeholder="0" onkeydown="blockNonNumeric(event)" oninput="stripNonNumeric(this)"></td>
</tr>`;
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
        }
        if (t.classList.contains('inp-bill-amt') || t.classList.contains('inp-payment')) {
            recalcFooter();
        }
    });
}

function clearBillRows() {
    const tbody = document.getElementById('billTbody');
    if (tbody) tbody.innerHTML = '';
}

function initBillGrid() {
    addBillRows(DEFAULT_BILL_ROW_COUNT);
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

function recalcFooter() {
    let sum = 0;
    document.querySelectorAll('#billTbody .inp-payment').forEach(inp => {
        sum += parseNum(inp);
    });
    const headerAmt = parseNum(document.getElementById('txtHeaderAmount'));
    const elTotal = document.getElementById('txtFooterTotal');
    const elAdv = document.getElementById('txtFooterAdvance');
    if (elTotal) elTotal.value = formatMoney(sum);
    if (elAdv) elAdv.value = formatMoney(headerAmt - sum);
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

function applyBillDetailRow(tr, r) {
    const mrnHidden = tr.querySelector('.inp-mrn-code');
    const dCode = tr.querySelector('.inp-detail-code');
    const mrnVal = r.MRNMaster_Code ?? r.mRNMaster_Code ?? r.MRN_Code ?? r.mrn_Code
        ?? r.Code ?? r.code;
    if (mrnHidden) mrnHidden.value = mrnVal !== undefined && mrnVal !== null ? String(mrnVal) : '';
    if (dCode) {
        const lc = r.GRNPaymentDetail_Code ?? r.GRNPaymentDetails_Code ?? r.DetailCode ?? r.LineCode ?? r.lineCode;
        if (lc !== undefined && lc !== null && `${lc}`.trim() !== '') dCode.value = String(lc);
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
            pm.value = payExplicit;
        } else {
            pm.value = pAmt !== undefined && pAmt !== null && pAmt !== '' ? pAmt : '';
        }
    }
}

async function onPartyChange() {
    const code = document.getElementById('ddlPartyName')?.value;
    clearBillRows();
    if (!code) {
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
        addBillRows(DEFAULT_BILL_ROW_COUNT);
        showToast('Could not load bill details for party.', 'error');
    }
    recalcFooter();
}

/** Extra blank row (same idea as GRN “add row” to grid). */
function addBillRowFromBar() {
    addBillRows(1);
    recalcFooter();
}

// ══════════════════════════════════════════════════════════════════════════════
// SAVE — Menu rights check (same pattern as GRNService.saveGRN)
// ══════════════════════════════════════════════════════════════════════════════
/**
 * Save / edit payload aligned with TY_GRNPaymentMaster + TY_GRNPaymentDetails[].
 * New: master Code = 0, detail Code = 0. Edit: set Code from hdn + detail line codes.
 */
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
        if (mrn <= 0 && pay <= 0) return;
        GRNPaymentDetails.push({
            Code: dCode,
            GRNPaymentMaster_Code: masterCode,
            MRNMaster_Code: mrn,
            PaymentAmount: pay,
        });
    });

    return { GRNPaymentMaster, GRNPaymentDetails };
}

/**
 * Load existing voucher for edit (call when opening by Code / from list).
 * Expects API shape: master fields + detail array (names flexible).
 */
function firstMasterFromApi(root) {
    const vw = root?.VW_GRNPaymentMaster ?? root;
    const list = vw?.GRNPaymentMaster ?? root?.GRNPaymentMaster;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    if (root && typeof root === 'object' && (root.Code !== undefined || root.EntryNo !== undefined || root.AccountMaster_Code !== undefined)
        && !root.GRNPaymentDetails && !root.GRNPaymentMaster) {
        return root;
    }
    return null;
}

async function loadGRNPaymentApprovalByCode(Code) {
    const codeNum = parseInt(Code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    try {
        await loadBankPaymentList();
        const res = await GRNPaymentApprovalService.GetGRNPaymentApprovalByCode(codeNum);
        const root = res?.Data ?? res?.data ?? res;
        const master = firstMasterFromApi(root);
        const details = normalizeApiRows(
            root?.VW_GRNPaymentMaster?.GRNPaymentDetails ?? root?.GRNPaymentDetails
            ?? root?.TY_GRNPaymentDetails ?? root?.GRNPaymentDetail
            ?? root?.Details ?? root?.details
        );

        if (!master && details.length === 0) {
            showToast('Record not found.', 'warning');
            return;
        }

        const h = document.getElementById('hdnGRNPaymentMasterCode');
        if (h) {
            h.value = String(master?.Code ?? master?.code ?? codeNum);
            editMode = true;
        }

        const en = master?.EntryNo ?? master?.entryNo;
        const txtEn = document.getElementById('txtEntryNo');
        if (txtEn) txtEn.value = en !== undefined && en !== null ? String(en) : '';
        updateFloatBarEntryNo();

        const ed = master?.EntryDate ?? master?.entryDate ?? master?.PaymentDate;
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

        const ref = document.getElementById('txtRefNo');
        if (ref) ref.value = master?.RefNo ?? master?.refNo ?? '';

        const ha = document.getElementById('txtHeaderAmount');
        if (ha) {
            const amt = master?.Amount ?? master?.amount;
            ha.value = amt !== undefined && amt !== null ? String(amt) : '';
        }

        const nar = document.getElementById('txtNarration');
        if (nar) nar.value = master?.Narration ?? master?.narration ?? '';

        clearBillRows();
        const tbody = document.getElementById('billTbody');
        if (details.length && tbody) {
            details.forEach(d => {
                tbody.insertAdjacentHTML('beforeend', billRowTemplate());
                const tr = tbody.querySelector('tr.bill-row:last-child');
                if (!tr) return;
                const dc = tr.querySelector('.inp-detail-code');
                const lineCode = d.Code ?? d.code;
                if (dc && lineCode !== undefined && lineCode !== null) dc.value = String(lineCode);
                const mrnH = tr.querySelector('.inp-mrn-code');
                const mrn = d.MRNMaster_Code ?? d.mRNMaster_Code;
                if (mrnH && mrn !== undefined && mrn !== null) mrnH.value = String(mrn);
                const pm = tr.querySelector('.inp-payment');
                const pAmt = d.PaymentAmount ?? d.paymentAmount;
                if (pm) pm.value = pAmt !== undefined && pAmt !== null ? String(pAmt) : '';
            });
        } else {
            addBillRows(DEFAULT_BILL_ROW_COUNT);
        }
        recalcFooter();
    } catch (e) {
        showToast('Failed to load GRN Payment Approval.', 'error');
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
    const p = collectPayload();
    if (!p.GRNPaymentDetails.length) {
        showToast('Add at least one bill line with MRN / payment amount.', 'warning');
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
        } else {
            if (!validateGRNPaymentApproval()) return;
            const payload = collectPayload();
            try {
                const data = await GRNPaymentApprovalService.SaveGRNPaymentApproval(payload);
                if (data && (data.Status === 'N' || data.success === false || data.Success === false)) {
                    showToast(data.Msg ?? data.message ?? 'Save failed.', 'error');
                    return;
                }
                applyEntryNoFromResponse(data);
                showToast('Saved successfully.', 'success');
                await loadGRNPaymentApprovalList();
                showListView();
            } catch (e) {
                showToast('Save failed. Ensure API GRNPaymentApproval/SaveGRNPaymentApproval is available.', 'error');
            }
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
    }
    const ref = document.getElementById('txtRefNo');
    if (ref) ref.value = '';
    const ha = document.getElementById('txtHeaderAmount');
    if (ha) ha.value = '';
    const nar = document.getElementById('txtNarration');
    if (nar) nar.value = '';
    const d1 = document.getElementById('dtPaymentDate');
    if (d1) d1.value = '';
    setTodayDates();
    clearBillRows();
    addBillRows(DEFAULT_BILL_ROW_COUNT);
    recalcFooter();

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

// ══════════════════════════════════════════════════════════════════════════════
// EXPOSE TO GLOBAL SCOPE (required for inline onXxx handlers)
// ══════════════════════════════════════════════════════════════════════════════
function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}

window.blockNonNumeric = blockNonNumeric;
window.stripNonNumeric = stripNonNumeric;
window.onPartyChange = onPartyChange;
window.addBillRowFromBar = addBillRowFromBar;
window.loadGRNPaymentApprovalByCode = loadGRNPaymentApprovalByCode;
window.recalcFooter = recalcFooter;
window.saveGRNPaymentApproval = saveGRNPaymentApproval;
window.resetGRNPaymentApprovalForm = resetGRNPaymentApprovalForm;
window.loadGRNPaymentApprovalList = loadGRNPaymentApprovalList;
window.showListView = showListView;
window.showFormView = showFormView;
window.newGRNPaymentApproval = newGRNPaymentApproval;
window.cancelGRNPaymentApproval = cancelGRNPaymentApproval;
window.editGRNPaymentApproval = editGRNPaymentApproval;
window.confirmDeleteGRNPaymentApproval = confirmDeleteGRNPaymentApproval;
