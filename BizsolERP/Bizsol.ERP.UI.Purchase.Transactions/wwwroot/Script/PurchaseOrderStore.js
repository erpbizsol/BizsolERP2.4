import { PurchaseOrderStoreService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseOrderStoreServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_POStoreList = [];
let G_POStoreItemList = [];
let G_POStoreEditMode = 'New';
let G_ItemMasterList = [];
let G_UOMMasterList = [];
let G_VendorList = [];
let G_PaymentTermsList = [];
let G_ProjectList = [];
let G_SubProjectList = [];
let G_ItemRowCount = 0;

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

$(document).ready(function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#lstTxtFromDate').val(FormatDateInput(firstDay));
    $('#lstTxtToDate').val(FormatDateInput(today));
    InitDropdowns();
});

function FormatDateInput(d) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
}

function FormatDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const dy = String(dt.getDate()).padStart(2, '0');
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const yr = dt.getFullYear();
    return `${dy}/${mo}/${yr}`;
}

function GetUserCode() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return authKey ? authKey.UserMaster_Code : 0;
    } catch { return 0; }
}

// ─── INIT DROPDOWNS ─────────────────────────────────────────────────────────

function InitDropdowns() {
    LoadStatusDropdown();
    LoadVendorDropdown();
    LoadItemDropdown();
    LoadUOMDropdown();
    LoadPaymentTermsDropdown();
}

function LoadStatusDropdown() {
    PurchaseOrderStoreService.GetPOStoreStatusList().then(function (data) {
        let html = '<option value="">-- All Status --</option>';
        if (data && data.length > 0) {
            data.forEach(s => { html += `<option value="${s.Code}">${s.Name}</option>`; });
        }
        $('#lstDdlStatus').html(html);
    }).catch(() => { $('#lstDdlStatus').html('<option value="">-- All Status --</option>'); });
}

function LoadVendorDropdown() {
    PurchaseOrderStoreService.GetVendorList().then(function (data) {
        G_VendorList = data || [];
        let html = '<option value="">-- Select Vendor --</option>';
        G_VendorList.forEach(v => { html += `<option value="${v.Code}">${v.Name}</option>`; });
        $('#frmDdlVendor').html(html);
    }).catch(() => { $('#frmDdlVendor').html('<option value="">-- Select Vendor --</option>'); });
}

function LoadItemDropdown() {
    PurchaseOrderStoreService.GetItemList().then(function (data) {
        G_ItemMasterList = data || [];
    }).catch(() => { G_ItemMasterList = []; });
}

function LoadUOMDropdown() {
    PurchaseOrderStoreService.GetUOMList().then(function (data) {
        G_UOMMasterList = data || [];
    }).catch(() => { G_UOMMasterList = []; });
}

function LoadPaymentTermsDropdown() {
    PurchaseOrderStoreService.GetPaymentTermsList().then(function (data) {
        G_PaymentTermsList = data || [];
        let html = '<option value="">-- Select Payment Terms --</option>';
        G_PaymentTermsList.forEach(p => { html += `<option value="${p.Code}">${p.Name}</option>`; });
        $('#frmDdlPaymentTerms').html(html);
    }).catch(() => { $('#frmDdlPaymentTerms').html('<option value="">-- Select Payment Terms --</option>'); });
}

// ─── ITEM SELECT HTML ────────────────────────────────────────────────────────

function BuildItemSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlItem_${rowId}" class="form-control form-control-sm" onchange="OnItemChange(${rowId})">
        <option value="">-- Select Item --</option>`;
    G_ItemMasterList.forEach(i => {
        const sel = selectedCode && i.Code == selectedCode ? 'selected' : '';
        html += `<option value="${i.Code}" ${sel}>${i.Name}</option>`;
    });
    html += '</select>';
    return html;
}

function BuildUOMSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlUOM_${rowId}" class="form-control form-control-sm">
        <option value="">UOM</option>`;
    G_UOMMasterList.forEach(u => {
        const sel = selectedCode && u.Code == selectedCode ? 'selected' : '';
        html += `<option value="${u.Code}" ${sel}>${u.Name}</option>`;
    });
    html += '</select>';
    return html;
}

// ─── TOGGLE PROJECT FIELDS ───────────────────────────────────────────────────

window.ToggleProjectFields = function () {
    const checked = $('#frmChkAgainstProject').is(':checked');
    if (checked) {
        $('#divProjectFields').slideDown(200);
        if (G_ProjectList.length === 0) LoadProjectDropdown();
    } else {
        $('#divProjectFields').slideUp(200);
        $('#frmDdlProject, #frmDdlSubProject').html('');
        $('#frmTxtWorkType').val('');
    }
};

function LoadProjectDropdown() {
    let html = '<option value="">-- Select Project --</option>';
    $('#frmDdlProject').html(html);
    // Projects loaded via dropdown API if available
    // Placeholder: extend when project API service is connected
}

window.LoadSubProjects = function () {
    $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
};

// ─── PO LIST GRID ────────────────────────────────────────────────────────────

window.ShowPOListGrid = function () {
    const fromDate = $('#lstTxtFromDate').val();
    const toDate = $('#lstTxtToDate').val();
    const status = $('#lstDdlStatus').val();

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    PurchaseOrderStoreService.GetPurchaseOrderStoreList(status, fromDate, toDate).then(function (data) {
        G_POStoreList = data || [];
        if (G_POStoreList.length === 0) {
            $('#table-header-POList').html('');
            $('#table-body-POList').html('<tr><td colspan="10" class="text-center text-muted">No records found.</td></tr>');
            $('#paginator-POList').html('');
            return;
        }
        const stringFilterColumn = ['PO No', 'Vendor', 'Status'];
        const numericFilterColumn = ['Total Amount'];
        const dateFilterColumn = ['PO Date'];
        const button = false;
        const showButtons = [];
        const hiddenColumns = ['Code'];
        const columnAlignment = { 'Total Amount': 'right', 'PO Date': 'center', 'PO No': 'center' };

        const displayData = G_POStoreList.map(item => ({
            'Code': item.Code,
            'PO No': item.PONo || item.PO_No || '',
            'PO Date': FormatDateDisplay(item.PODate || item.PO_Date),
            'Vendor': item.VendorName || item.Vendor || '',
            'Ref No': item.RefNo || '',
            'Total Amount': parseFloat(item.TotalAmount || item.Total_Amount || 0).toFixed(2),
            'Status': item.Status || '',
            'Action': `<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewPO('${item.Code}')"><i class="fa fa-eye"></i></button>
                       <button class="btn btn-warning icon-height mb-1 ms-1" title="Edit" onclick="OpenPOForm('Edit','${item.Code}')"><i class="fa fa-edit"></i></button>
                       <button class="btn btn-danger icon-height mb-1 ms-1" title="Delete" onclick="InitDeletePO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-trash"></i></button>`
        }));
        BizsolCustomFilterGrid.CreateDataTable('table-header-POList', 'table-body-POList', displayData, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, [], hiddenColumns, columnAlignment);
    }).catch(err => {
        toastr.error('Error loading PO list.');
        console.error(err);
    });
};

// ─── OPEN / CLOSE FORM ───────────────────────────────────────────────────────

window.OpenPOForm = function (mode, code) {
    G_POStoreEditMode = mode;
    ResetPOForm();
    $('#divPOList').hide();
    $('#divPOForm').show();

    if (mode === 'Edit' && code) {
        LoadPOForEdit(code);
    } else {
        $('#frmTxtPODate').val(FormatDateInput(new Date()));
        G_ItemRowCount = 0;
        AddItemRow();
    }
};

window.ClosePOForm = function () {
    $('#divPOForm').hide();
    $('#divPOList').show();
};

function ResetPOForm() {
    $('#frmHfCode').val('');
    $('#frmTxtPONo').val('');
    $('#frmTxtPODate').val('');
    $('#frmDdlVendor').val('');
    $('#frmTxtRefNo').val('');
    $('#frmTxtRefDate').val('');
    $('#frmDdlPaymentTerms').val('');
    $('#frmTxtRemarks').val('');
    $('#frmChkAgainstProject').prop('checked', false);
    $('#divProjectFields').hide();
    $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
    $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    $('#frmTxtWorkType').val('');
    $('#frmTxtOtherCharges1').val(0);
    $('#frmTxtOtherCharges2').val(0);
    $('#frmChkRoundOff').prop('checked', false);
    $('#tblPOItemsBody').html('');
    G_ItemRowCount = 0;
    UpdateSummary(0, 0, 0, 0, 0);
}

// ─── ADD / DELETE ITEM ROWS ──────────────────────────────────────────────────

window.AddItemRow = function () {
    G_ItemRowCount++;
    const rowId = G_ItemRowCount;
    const itemSelect = BuildItemSelect(rowId, null);
    const uomSelect = BuildUOMSelect(rowId, null);
    const row = `<tr id="itemRow_${rowId}">
        <td class="text-center fw-bold">${rowId}</td>
        <td>${itemSelect}</td>
        <td>${uomSelect}</td>
        <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="0" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="0" readonly /></td>
        <td class="text-center"><button type="button" class="delete-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button></td>
    </tr>`;
    $('#tblPOItemsBody').append(row);
    RenumberRows();
};

window.DeleteItemRow = function (rowId) {
    if ($('#tblPOItemsBody tr').length <= 1) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $(`#itemRow_${rowId}`).remove();
    RenumberRows();
    CalcTotals();
};

function RenumberRows() {
    $('#tblPOItemsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

window.OnItemChange = function (rowId) {
    const selectedCode = $(`#frmDdlItem_${rowId}`).val();
    const item = G_ItemMasterList.find(i => String(i.Code) === String(selectedCode));
    if (item && item.UOM_Code) {
        $(`#frmDdlUOM_${rowId}`).val(item.UOM_Code);
    }
    if (item && item.GSTRate !== undefined) {
        $(`#frmTxtGSTRate_${rowId}`).val(item.GSTRate || 0);
    }
    CalcRowValue(rowId);
};

window.CalcRowValue = function (rowId) {
    const qty = parseFloat($(`#frmTxtQty_${rowId}`).val()) || 0;
    const rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;
    const value = qty * rate;
    $(`#frmTxtValue_${rowId}`).val(value.toFixed(2));
    CalcTotals();
};

// ─── CALCULATE TOTALS ────────────────────────────────────────────────────────

window.CalcTotals = function () {
    let taxableAmount = 0;
    let totalGST = 0;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        taxableAmount += value;
        totalGST += value * gstRate / 100;
    });

    const otherCharges1 = parseFloat($('#frmTxtOtherCharges1').val()) || 0;
    const otherCharges2 = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    let totalPO = taxableAmount + totalGST + otherCharges1 + otherCharges2;

    let roundOff = 0;
    if ($('#frmChkRoundOff').is(':checked')) {
        const rounded = Math.round(totalPO);
        roundOff = rounded - totalPO;
        totalPO = rounded;
    }

    UpdateSummary(taxableAmount, totalGST, otherCharges1, otherCharges2, totalPO, roundOff);
};

function UpdateSummary(taxable, gst, other1, other2, total, roundOff) {
    $('#sumTaxableAmount').text(parseFloat(taxable || 0).toFixed(2));
    $('#sumTotalGST').text(parseFloat(gst || 0).toFixed(2));
    $('#sumRoundOff').text(parseFloat(roundOff || 0).toFixed(2));
    $('#sumTotalPOAmount').text(parseFloat(total || 0).toFixed(2));
}

// ─── SAVE PO ─────────────────────────────────────────────────────────────────

window.SavePO = function () {
    const poDate = $('#frmTxtPODate').val();
    const vendorCode = $('#frmDdlVendor').val();

    if (!poDate) { toastr.warning('Please select PO Date.'); return; }
    if (!vendorCode) { toastr.warning('Please select Vendor.'); return; }

    const itemRows = [];
    let itemValid = true;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const itemCode = $(`#frmDdlItem_${rowId}`).val();
        const qty = parseFloat($(`#frmTxtQty_${rowId}`).val()) || 0;
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;

        if (!itemCode) { toastr.warning('Please select item in all rows.'); itemValid = false; return false; }
        if (qty <= 0) { toastr.warning('Qty must be greater than 0 for all items.'); itemValid = false; return false; }

        itemRows.push({
            ItemMaster_Code: itemCode,
            UOM_Code: $(`#frmDdlUOM_${rowId}`).val(),
            GSTRate: parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0,
            Qty: qty,
            Rate: rate,
            Value: parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0
        });
    });

    if (!itemValid || itemRows.length === 0) {
        if (itemRows.length === 0) toastr.warning('Please add at least one item.');
        return;
    }

    const agaistProject = $('#frmChkAgainstProject').is(':checked') ? 'Y' : 'N';
    const taxable = parseFloat($('#sumTaxableAmount').text()) || 0;
    const totalGST = parseFloat($('#sumTotalGST').text()) || 0;
    const roundOff = parseFloat($('#sumRoundOff').text()) || 0;
    const totalPO = parseFloat($('#sumTotalPOAmount').text()) || 0;

    const payload = {
        Code: $('#frmHfCode').val() || 0,
        PODate: poDate,
        VendorMaster_Code: vendorCode,
        RefNo: $('#frmTxtRefNo').val(),
        RefDate: $('#frmTxtRefDate').val() || null,
        AgainstProject: agaistProject,
        Project_Code: agaistProject === 'Y' ? ($('#frmDdlProject').val() || null) : null,
        SubProject_Code: agaistProject === 'Y' ? ($('#frmDdlSubProject').val() || null) : null,
        WorkType: agaistProject === 'Y' ? $('#frmTxtWorkType').val() : '',
        PaymentTerms_Code: $('#frmDdlPaymentTerms').val() || null,
        Remarks: $('#frmTxtRemarks').val(),
        OtherChargesLabel1: $('#frmTxtOtherChargesLbl1').val(),
        OtherCharges1: parseFloat($('#frmTxtOtherCharges1').val()) || 0,
        OtherChargesLabel2: $('#frmTxtOtherChargesLbl2').val(),
        OtherCharges2: parseFloat($('#frmTxtOtherCharges2').val()) || 0,
        IsRoundOff: $('#frmChkRoundOff').is(':checked') ? 'Y' : 'N',
        RoundOff: roundOff,
        TaxableAmount: taxable,
        TotalGST: totalGST,
        TotalAmount: totalPO,
        UserMaster_Code: GetUserCode(),
        PODetail: itemRows
    };

    PurchaseOrderStoreService.SavePurchaseOrderStore(payload, G_POStoreEditMode).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'PO saved successfully.');
            ClosePOForm();
            ShowPOListGrid();
        } else {
            toastr.error(res ? res.Msg : 'Failed to save PO.');
        }
    }).catch(err => {
        toastr.error('Error saving PO.');
        console.error(err);
    });
};

// ─── EDIT PO ──────────────────────────────────────────────────────────────────

function LoadPOForEdit(code) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); ClosePOForm(); return; }

        const header = res.Header || res;
        const details = res.Detail || res.PODetail || [];

        $('#frmHfCode').val(header.Code);
        $('#frmTxtPONo').val(header.PONo || header.PO_No || '');
        $('#frmTxtPODate').val(FormatDateInput(new Date(header.PODate || header.PO_Date)));
        $('#frmDdlVendor').val(header.VendorMaster_Code);
        $('#frmTxtRefNo').val(header.RefNo || '');
        if (header.RefDate) $('#frmTxtRefDate').val(FormatDateInput(new Date(header.RefDate)));
        $('#frmDdlPaymentTerms').val(header.PaymentTerms_Code || '');
        $('#frmTxtRemarks').val(header.Remarks || '');

        const agaistProject = (header.AgainstProject === 'Y');
        $('#frmChkAgainstProject').prop('checked', agaistProject);
        if (agaistProject) {
            $('#divProjectFields').show();
            $('#frmDdlProject').html(`<option value="${header.Project_Code}">${header.ProjectName || ''}</option>`).val(header.Project_Code);
            $('#frmDdlSubProject').html(`<option value="${header.SubProject_Code}">${header.SubProjectName || ''}</option>`).val(header.SubProject_Code);
            $('#frmTxtWorkType').val(header.WorkType || '');
        }

        $('#frmTxtOtherChargesLbl1').val(header.OtherChargesLabel1 || 'Other Charges');
        $('#frmTxtOtherCharges1').val(header.OtherCharges1 || 0);
        $('#frmTxtOtherChargesLbl2').val(header.OtherChargesLabel2 || 'Freight');
        $('#frmTxtOtherCharges2').val(header.OtherCharges2 || 0);
        $('#frmChkRoundOff').prop('checked', header.IsRoundOff === 'Y');

        $('#tblPOItemsBody').html('');
        G_ItemRowCount = 0;

        details.forEach(function (det) {
            G_ItemRowCount++;
            const rowId = G_ItemRowCount;
            const itemSelect = BuildItemSelect(rowId, det.ItemMaster_Code);
            const uomSelect = BuildUOMSelect(rowId, det.UOM_Code);
            const row = `<tr id="itemRow_${rowId}">
                <td class="text-center fw-bold">${rowId}</td>
                <td>${itemSelect}</td>
                <td>${uomSelect}</td>
                <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${det.GSTRate || 0}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${det.Qty || 0}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${det.Rate || 0}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${det.Value || 0}" readonly /></td>
                <td class="text-center"><button type="button" class="delete-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button></td>
            </tr>`;
            $('#tblPOItemsBody').append(row);
        });

        if (details.length === 0) AddItemRow();
        CalcTotals();
    }).catch(err => {
        toastr.error('Error loading PO details.');
        console.error(err);
    });
}

// ─── VIEW PO ──────────────────────────────────────────────────────────────────

window.ViewPO = function (code) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); return; }
        const header = res.Header || res;
        const details = res.Detail || res.PODetail || [];

        let detailRows = '';
        details.forEach((det, idx) => {
            detailRows += `<tr>
                <td class="text-center">${idx + 1}</td>
                <td>${det.ItemName || ''}</td>
                <td class="text-center">${det.UOMName || ''}</td>
                <td class="text-center">${det.GSTRate || 0}%</td>
                <td class="text-end">${det.Qty || 0}</td>
                <td class="text-end">${parseFloat(det.Rate || 0).toFixed(2)}</td>
                <td class="text-end">${parseFloat(det.Value || 0).toFixed(2)}</td>
            </tr>`;
        });

        const agaistProject = header.AgainstProject === 'Y';
        $('#modalViewPOBody').html(`
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">PO Number</td><td>${header.PONo || header.PO_No || ''}</td></tr>
                        <tr><td class="fw-bold">PO Date</td><td>${FormatDateDisplay(header.PODate || header.PO_Date)}</td></tr>
                        <tr><td class="fw-bold">Vendor</td><td>${header.VendorName || ''}</td></tr>
                        <tr><td class="fw-bold">Ref No</td><td>${header.RefNo || '-'}</td></tr>
                        <tr><td class="fw-bold">Ref Date</td><td>${header.RefDate ? FormatDateDisplay(header.RefDate) : '-'}</td></tr>
                        <tr><td class="fw-bold">Payment Terms</td><td>${header.PaymentTermsName || '-'}</td></tr>
                        <tr><td class="fw-bold">Remarks</td><td>${header.Remarks || '-'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">Against Project</td><td>${agaistProject ? 'Yes' : 'No'}</td></tr>
                        ${agaistProject ? `<tr><td class="fw-bold">Project</td><td>${header.ProjectName || '-'}</td></tr>
                        <tr><td class="fw-bold">Sub Project</td><td>${header.SubProjectName || '-'}</td></tr>
                        <tr><td class="fw-bold">Work Type</td><td>${header.WorkType || '-'}</td></tr>` : ''}
                        <tr><td class="fw-bold">Taxable Amount</td><td class="text-end">${parseFloat(header.TaxableAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">${header.OtherChargesLabel1 || 'Other Charges 1'}</td><td class="text-end">${parseFloat(header.OtherCharges1 || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">${header.OtherChargesLabel2 || 'Other Charges 2'}</td><td class="text-end">${parseFloat(header.OtherCharges2 || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Total GST</td><td class="text-end">${parseFloat(header.TotalGST || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Round Off</td><td class="text-end">${parseFloat(header.RoundOff || 0).toFixed(2)}</td></tr>
                        <tr style="background:#667eea;color:#fff;border-radius:6px;"><td class="fw-bold">Total PO Amount</td><td class="text-end fw-bold">${parseFloat(header.TotalAmount || 0).toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;">
                        <tr>
                            <th class="text-center">#</th>
                            <th>Item Name</th>
                            <th class="text-center">UOM</th>
                            <th class="text-center">GST Rate</th>
                            <th class="text-end">Qty</th>
                            <th class="text-end">Rate</th>
                            <th class="text-end">Value</th>
                        </tr>
                    </thead>
                    <tbody>${detailRows}</tbody>
                </table>
            </div>
        `);
        $('#modalViewPO').modal('show');
    }).catch(err => {
        toastr.error('Error loading PO details.');
        console.error(err);
    });
};

// ─── DELETE PO ────────────────────────────────────────────────────────────────

window.InitDeletePO = function (code, poNo) {
    $('#modalHfDeleteCode').val(code);
    $('#modalDeletePONo').text(poNo);
    $('#modalTxtDeleteReason').val('');
    $('#modalDeletePO').modal('show');
};

window.ConfirmDeletePO = function () {
    const code = $('#modalHfDeleteCode').val();
    const reason = $('#modalTxtDeleteReason').val().trim();
    if (!reason) { toastr.warning('Please enter reason for delete.'); return; }

    PurchaseOrderStoreService.DeletePurchaseOrderStore(code, GetUserCode(), reason).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'PO deleted successfully.');
            $('#modalDeletePO').modal('hide');
            ShowPOListGrid();
        } else {
            toastr.error(res ? res.Msg : 'Failed to delete PO.');
        }
    }).catch(err => {
        toastr.error('Error deleting PO.');
        console.error(err);
    });
};

// ─── EXPOSE GLOBALS ───────────────────────────────────────────────────────────

window.ShowPOListGrid = ShowPOListGrid;
window.OpenPOForm = OpenPOForm;
window.ClosePOForm = ClosePOForm;
window.AddItemRow = AddItemRow;
window.DeleteItemRow = DeleteItemRow;
window.OnItemChange = OnItemChange;
window.CalcRowValue = CalcRowValue;
window.CalcTotals = CalcTotals;
window.SavePO = SavePO;
window.ViewPO = ViewPO;
window.InitDeletePO = InitDeletePO;
window.ConfirmDeletePO = ConfirmDeletePO;
window.LoadSubProjects = LoadSubProjects;
window.ToggleProjectFields = ToggleProjectFields;

