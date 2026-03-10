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
let G_MobileItemEditRowId = null;

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// ─── FLOAT BAR MARGIN — tracks sidebar collapsed state ───────────────────────
function SyncFloatBarMargin() {
    const bar = document.getElementById('poFloatBar');
    if (!bar) return;
    if (window.innerWidth <= 768) {
        bar.style.marginLeft = '0';
        return;
    }
    const sidebar = document.getElementById('modern-sidebar');
    bar.style.marginLeft = (sidebar && sidebar.classList.contains('collapsed')) ? '70px' : '280px';
}

$(document).ready(function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#lstTxtFromDate').val(FormatDateInput(firstDay));
    $('#lstTxtToDate').val(FormatDateInput(today));
    InitDropdowns();

    // Watch sidebar class changes (collapse/expand) and sync float bar
    const sidebarEl = document.getElementById('modern-sidebar');
    if (sidebarEl) {
        new MutationObserver(SyncFloatBarMargin)
            .observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', SyncFloatBarMargin);
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

function IsMobile() {
    return window.innerWidth <= 768;
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
    LoadWorkTypeDropdown();
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

function LoadWorkTypeDropdown() {
    PurchaseOrderStoreService.GetWorkTypeList().then(function (data) {
        let html = '<option value="">-- Select Work Type --</option>';
        if (data && data.length > 0) {
            data.forEach(w => { html += `<option value="${w.Code}">${w.Name}</option>`; });
        }
        $('#frmDdlWorkType').html(html);
    }).catch(() => { $('#frmDdlWorkType').html('<option value="">-- Select Work Type --</option>'); });
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
        $('#divProjectFields').slideDown(220);
        if (G_ProjectList.length === 0) LoadProjectDropdown();
    } else {
        $('#divProjectFields').slideUp(220);
        G_ProjectList = [];
        G_SubProjectList = [];
        $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    }
};

function LoadProjectDropdown(selectedCode) {
    PurchaseOrderStoreService.GetProjectList().then(function (data) {
        G_ProjectList = data || [];
        let html = '<option value="">-- Select Project --</option>';
        G_ProjectList.forEach(p => {
            const sel = selectedCode && p.Code == selectedCode ? 'selected' : '';
            html += `<option value="${p.Code}" ${sel}>${p.Name}</option>`;
        });
        $('#frmDdlProject').html(html);
    }).catch(() => { $('#frmDdlProject').html('<option value="">-- Select Project --</option>'); });
}

window.LoadSubProjects = function (selectedCode) {
    const projectCode = $('#frmDdlProject').val();
    if (!projectCode) {
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
        return;
    }
    PurchaseOrderStoreService.GetSubProjectList(projectCode).then(function (data) {
        G_SubProjectList = data || [];
        let html = '<option value="">-- Select Sub Project --</option>';
        G_SubProjectList.forEach(s => {
            const sel = selectedCode && s.Code == selectedCode ? 'selected' : '';
            html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
        });
        $('#frmDdlSubProject').html(html);
    }).catch(() => { $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>'); });
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
        $('#statTotalPO').text(G_POStoreList.length);
        if (G_POStoreList.length === 0) {
            $('#tblPOListHeader').html('');
            $('#tblPOListBody').html('<tr><td colspan="10" class="text-center text-muted py-4"><i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>No records found for the selected period.</td></tr>');
            $('#paginator-tblPOList').html('');
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
            'Total Amount': parseFloat(item.TotalPOAmount || item.Total_Amount || 0).toFixed(2),
            'Status': item.Status || '',
            'Action': `<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewPO('${item.Code}')"><i class="fa fa-eye"></i></button>
                       <button class="btn btn-warning icon-height mb-1 ms-1" title="Edit" onclick="OpenPOForm('Edit','${item.Code}')"><i class="fa fa-edit"></i></button>
                       <button class="btn btn-danger icon-height mb-1 ms-1" title="Delete" onclick="InitDeletePO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-trash"></i></button>`
        }));
        BizsolCustomFilterGrid.CreateDataTable('tblPOListHeader', 'tblPOListBody', displayData, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, [], hiddenColumns, columnAlignment);
    }).catch(err => {
        toastr.error('Error loading PO list.');
        console.error(err);
    });
};

// ─── OPEN / CLOSE FORM ───────────────────────────────────────────────────────

window.OpenPOForm = function (mode, code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const OptionName = mode;
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        G_POStoreEditMode = mode;
        ResetPOForm();
        $('#divPOList').hide();
        $('#divPOForm').show();
        // Show floating save bar
        $('#poFloatBar').css('display', 'flex');
        SyncFloatBarMargin();
        // Update floating bar labels
        $('#floatPONo').text(mode === 'New' ? 'New PO' : 'Loading…');
        if (mode === 'Edit') {
            $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');
        } else {
            $('#floatModeBadge').text('NEW').removeClass('bg-warning text-dark').addClass('bg-success');
        }
        if (mode === 'Edit' && code) {
            LoadPOForEdit(code);
        } else {
            $('#frmTxtPODate').val(FormatDateInput(new Date()));
            G_ItemRowCount = 0;
            if (IsMobile()) {
                RenderMobileItemCards();
            } else {
                AddItemRow();
            }
        }
    });
};

window.ClosePOForm = function () {
    $('#divPOForm').hide();
    $('#poFloatBar').hide();
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
    G_ProjectList = [];
    G_SubProjectList = [];
    $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
    $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    $('#frmDdlWorkType').val('');
    $('#frmTxtOtherCharges1').val(0);
    $('#frmTxtOtherCharges2').val(0);
    $('#frmChkRoundOff').prop('checked', false);
    $('#tblPOItemsBody').html('');
    G_ItemRowCount = 0;
    UpdateSummary(0, 0, 0, 0, 0);
}

// ─── ADD / DELETE ITEM ROWS ──────────────────────────────────────────────────

window.AddItemRow = function (silent) {
    if (IsMobile() && !silent) {
        OpenMobileItemModal(null);
        return;
    }
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
        <td class="text-center">
            <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
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
    if (IsMobile()) RenderMobileItemCards();
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

    const masterCode = parseInt($('#frmHfCode').val()) || 0;
    const agaistProject = $('#frmChkAgainstProject').is(':checked') ? 'Y' : 'N';
    const projectCode = agaistProject === 'Y' ? (parseInt($('#frmDdlProject').val()) || 0) : 0;
    const taxable = parseFloat($('#sumTaxableAmount').text()) || 0;
    const totalGST = parseFloat($('#sumTotalGST').text()) || 0;
    const totalPO = parseFloat($('#sumTotalPOAmount').text()) || 0;
    const freightAmt = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    const otherChargesAmt = parseFloat($('#frmTxtOtherCharges1').val()) || 0;

    const transactions = [];
    let itemValid = true;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const detailCode = parseInt($(`#frmHfDetailCode_${rowId}`).val()) || 0;
        const itemCode = parseInt($(`#frmDdlItem_${rowId}`).val()) || 0;
        const qty = parseFloat($(`#frmTxtQty_${rowId}`).val()) || 0;
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        const amount = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;

        if (!itemCode) { toastr.warning('Please select item in all rows.'); itemValid = false; return false; }
        if (qty <= 0) { toastr.warning('Qty must be greater than 0 for all items.'); itemValid = false; return false; }

        transactions.push({
            code: detailCode,
            purchaseOrderMaster_Code: masterCode,
            itemMaster_Code: itemCode,
            itemSizeMaster_Code: 0,
            uomMaster_Code: parseInt($(`#frmDdlUOM_${rowId}`).val()) || 0,
            qtyMT: qty,
            qtyPC: 0,
            qtyMTRS: 0,
            rateUnit: '',
            rate: rate,
            amount: amount,
            status: '',
            gstRate: gstRate,
            gstAmount: parseFloat((amount * gstRate / 100).toFixed(2)),
            remark: '',
            projectMaster_Code: projectCode
        });
    });

    if (!itemValid || transactions.length === 0) {
        if (transactions.length === 0) toastr.warning('Please add at least one item.');
        return;
    }

    const payload = {
        code: masterCode,
        master: [{
            code: masterCode,
            poNo: 0,
            poDate: poDate,
            vendorMaster_Code: parseInt(vendorCode) || 0,
            refNo: $('#frmTxtRefNo').val(),
            refDate: $('#frmTxtRefDate').val() || null,
            paymentTermsMaster_Code: parseInt($('#frmDdlPaymentTerms').val()) || 0,
            totalAssValue: taxable,
            dutyRate: 0,
            dutyAmount: 0,
            cessRate: 0,
            cessAmount: 0,
            shCessRate: 0,
            shCessAmount: 0,
            taxRate: 0,
            taxAmount: totalGST,
            entryTaxRate: 0,
            entryTaxAmount: 0,
            freightAmount: freightAmt,
            otherChargesDesp: $('#frmTxtOtherChargesLbl1').val(),
            otherChargesAmount: otherChargesAmt,
            totalPOAmount: totalPO,
            remarks: $('#frmTxtRemarks').val(),
            poType: 'S',
            finYear: '',
            remarks1: '',
            isPOAgainstProject: agaistProject,
            projectMaster_Code: projectCode,
            subProjectMaster_Code: agaistProject === 'Y' ? (parseInt($('#frmDdlSubProject').val()) || 0) : 0
        }],
        transactions: transactions
    };

    PurchaseOrderStoreService.SavePurchaseOrderStore(JSON.stringify(payload)).then(function (res) {
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

        const header = res[0][0];
        const details = res[1] || [];

        $('#frmHfCode').val(header.Code);
        $('#frmTxtPONo').val(header.PONo || '');
        $('#frmTxtPODate').val(FormatDateInput(new Date(header.PODate)));
        $('#frmDdlVendor').val(header.VendorMaster_Code);
        $('#frmTxtRefNo').val(header.RefNo || '');
        if (header.RefDate) $('#frmTxtRefDate').val(FormatDateInput(new Date(header.RefDate)));
        $('#frmDdlPaymentTerms').val(header.PaymentTermsMaster_Code || '');
        $('#frmTxtRemarks').val(header.Remarks || '');

        const againstProject = (header.IsPOAgainstProject === 'Y');
        $('#frmChkAgainstProject').prop('checked', againstProject);
        $('#frmDdlWorkType').val(header.WorkTypeMaster_Code || '');
        if (againstProject) {
            $('#divProjectFields').show();
            LoadProjectDropdown(header.ProjectMaster_Code);
            PurchaseOrderStoreService.GetSubProjectList(header.ProjectMaster_Code).then(function (data) {
                G_SubProjectList = data || [];
                let html = '<option value="">-- Select Sub Project --</option>';
                G_SubProjectList.forEach(s => {
                    const sel = s.Code == header.SubProjectMaster_Code ? 'selected' : '';
                    html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
                });
                $('#frmDdlSubProject').html(html);
            }).catch(() => {
                $('#frmDdlSubProject').html(`<option value="${header.SubProjectMaster_Code}" selected></option>`);
            });
        } else {
            $('#divProjectFields').hide();
        }
        // Update floating PO number
        $('#floatPONo').text(header.PONo || 'PO');
        $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');

        $('#frmTxtOtherChargesLbl1').val(header.OtherChargesDesp || 'Other Charges');
        $('#frmTxtOtherCharges1').val(header.OtherChargesAmount || 0);
        $('#frmTxtOtherChargesLbl2').val('Freight');
        $('#frmTxtOtherCharges2').val(header.FreightAmount || 0);
        $('#frmChkRoundOff').prop('checked', header.IsRoundOff === 'Y');

        $('#tblPOItemsBody').html('');
        G_ItemRowCount = 0;

        details.forEach(function (det) {
            G_ItemRowCount++;
            const rowId = G_ItemRowCount;
            const itemSelect = BuildItemSelect(rowId, det.ItemMaster_Code);
            const uomSelect = BuildUOMSelect(rowId, det.UOMMaster_Code);
            const row = `<tr id="itemRow_${rowId}">
                <td class="text-center fw-bold">${rowId}</td>
                <td>${itemSelect}</td>
                <td>${uomSelect}</td>
                <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${det.GSTRate || 0}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${det.QtyMT || 0}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${det.Rate || 0}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${det.Amount || 0}" readonly /></td>
                <td class="text-center">
                    <input type="hidden" id="frmHfDetailCode_${rowId}" value="${det.Code || 0}" />
                    <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
                </td>
            </tr>`;
            $('#tblPOItemsBody').append(row);
        });

        if (details.length === 0) AddItemRow(true);
        if (IsMobile()) RenderMobileItemCards();
        CalcTotals();
    }).catch(err => {
        toastr.error('Error loading PO details.');
        console.error(err);
    });
}

// ─── VIEW PO ──────────────────────────────────────────────────────────────────

window.ViewPO = function (code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'View', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
            if (!res) { toastr.error('PO not found.'); return; }
        const header = res[0][0];
        const details = res[1] || [];

        const vendorName = (G_VendorList.find(v => v.Code == header.VendorMaster_Code) || {}).Name || '';
        const paymentTermsName = (G_PaymentTermsList.find(p => p.Code == header.PaymentTermsMaster_Code) || {}).Name || '';
        const againstProject = header.IsPOAgainstProject === 'Y';

        let detailRows = '';
        details.forEach((det, idx) => {
            const itemName = (G_ItemMasterList.find(i => i.Code == det.ItemMaster_Code) || {}).Name || '';
            const uomName = (G_UOMMasterList.find(u => u.Code == det.UOMMaster_Code) || {}).Name || '';
            detailRows += `<tr>
                <td class="text-center">${idx + 1}</td>
                <td>${itemName}</td>
                <td class="text-center">${uomName}</td>
                <td class="text-center">${det.GSTRate || 0}%</td>
                <td class="text-end">${det.QtyMT || 0}</td>
                <td class="text-end">${parseFloat(det.Rate || 0).toFixed(2)}</td>
                <td class="text-end">${parseFloat(det.Amount || 0).toFixed(2)}</td>
            </tr>`;
        });

        $('#modalViewPOBody').html(`
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">PO Number</td><td>${header.PONo || ''}</td></tr>
                        <tr><td class="fw-bold">PO Date</td><td>${FormatDateDisplay(header.PODate)}</td></tr>
                        <tr><td class="fw-bold">Vendor</td><td>${vendorName}</td></tr>
                        <tr><td class="fw-bold">Ref No</td><td>${header.RefNo || '-'}</td></tr>
                        <tr><td class="fw-bold">Ref Date</td><td>${header.RefDate ? FormatDateDisplay(header.RefDate) : '-'}</td></tr>
                        <tr><td class="fw-bold">Payment Terms</td><td>${paymentTermsName || '-'}</td></tr>
                        <tr><td class="fw-bold">Remarks</td><td>${header.Remarks || '-'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">Against Project</td><td>${againstProject ? 'Yes' : 'No'}</td></tr>
                        ${againstProject ? `<tr><td class="fw-bold">Project</td><td>${header.ProjectMaster_Code || '-'}</td></tr>
                        <tr><td class="fw-bold">Sub Project</td><td>${header.SubProjectMaster_Code || '-'}</td></tr>` : ''}
                        <tr><td class="fw-bold">Taxable Amount</td><td class="text-end">${parseFloat(header.TotalAssValue || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">${header.OtherChargesDesp || 'Other Charges'}</td><td class="text-end">${parseFloat(header.OtherChargesAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Freight</td><td class="text-end">${parseFloat(header.FreightAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Total GST</td><td class="text-end">${parseFloat(header.TaxAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Round Off</td><td class="text-end">${parseFloat(header.RoundOff || 0).toFixed(2)}</td></tr>
                        <tr style="background:#667eea;color:#fff;border-radius:6px;"><td class="fw-bold">Total PO Amount</td><td class="text-end fw-bold">${parseFloat(header.TotalPOAmount || 0).toFixed(2)}</td></tr>
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

    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'Delete', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

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
    });
};

// ─── MOBILE ITEM ENTRY MODAL ─────────────────────────────────────────────────

function OpenMobileItemModal(rowId) {
    G_MobileItemEditRowId = rowId;

    // Populate item dropdown
    let itemHtml = '<option value="">-- Select Item --</option>';
    G_ItemMasterList.forEach(i => { itemHtml += `<option value="${i.Code}">${i.Name}</option>`; });
    $('#mobileItemDdlItem').html(itemHtml);

    // Populate UOM dropdown
    let uomHtml = '<option value="">UOM</option>';
    G_UOMMasterList.forEach(u => { uomHtml += `<option value="${u.Code}">${u.Name}</option>`; });
    $('#mobileItemDdlUOM').html(uomHtml);

    // Auto-fill UOM and GST when item changes
    $('#mobileItemDdlItem').off('change').on('change', function () {
        const code = $(this).val();
        const item = G_ItemMasterList.find(i => String(i.Code) === String(code));
        if (item && item.UOM_Code) $('#mobileItemDdlUOM').val(item.UOM_Code);
        if (item && item.GSTRate !== undefined) $('#mobileItemTxtGST').val(item.GSTRate || 0);
        MobileCalcValue();
    });

    if (rowId === null) {
        // New item
        $('#mobileItemModalTitle').text('Add Item');
        $('#mobileItemModalBtnTxt').text('Add Item');
        $('#mobileItemDdlItem').val('');
        $('#mobileItemDdlUOM').val('');
        $('#mobileItemTxtGST').val(0);
        $('#mobileItemTxtQty').val(0);
        $('#mobileItemTxtRate').val(0);
        $('#mobileItemCalcValue').text('0.00');
    } else {
        // Edit existing row
        $('#mobileItemModalTitle').text('Edit Item');
        $('#mobileItemModalBtnTxt').text('Update Item');
        $('#mobileItemDdlItem').val($(`#frmDdlItem_${rowId}`).val());
        $('#mobileItemDdlUOM').val($(`#frmDdlUOM_${rowId}`).val());
        $('#mobileItemTxtGST').val($(`#frmTxtGSTRate_${rowId}`).val());
        $('#mobileItemTxtQty').val($(`#frmTxtQty_${rowId}`).val());
        $('#mobileItemTxtRate').val($(`#frmTxtRate_${rowId}`).val());
        MobileCalcValue();
    }

    $('#modalMobileItemEntry').modal('show');
}

function MobileCalcValue() {
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    $('#mobileItemCalcValue').text((qty * rate).toFixed(2));
}

function MobileItemModalConfirm() {
    const itemCode = $('#mobileItemDdlItem').val();
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;

    if (!itemCode) { toastr.warning('Please select an item.'); return; }
    if (qty <= 0) { toastr.warning('Qty must be greater than 0.'); return; }

    const uomCode = $('#mobileItemDdlUOM').val();
    const gst = parseFloat($('#mobileItemTxtGST').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    const value = (qty * rate).toFixed(2);

    if (G_MobileItemEditRowId === null) {
        // Add new row to the hidden table
        G_ItemRowCount++;
        const rowId = G_ItemRowCount;
        const itemSelect = BuildItemSelect(rowId, itemCode);
        const uomSelect = BuildUOMSelect(rowId, uomCode);
        const row = `<tr id="itemRow_${rowId}">
            <td class="text-center fw-bold">${rowId}</td>
            <td>${itemSelect}</td>
            <td>${uomSelect}</td>
            <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${gst}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${qty}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${value}" readonly /></td>
            <td class="text-center">
                <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
                <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
            </td>
        </tr>`;
        $('#tblPOItemsBody').append(row);
        RenumberRows();
    } else {
        // Update existing row in the hidden table
        const rowId = G_MobileItemEditRowId;
        $(`#frmDdlItem_${rowId}`).val(itemCode);
        $(`#frmDdlUOM_${rowId}`).val(uomCode);
        $(`#frmTxtGSTRate_${rowId}`).val(gst);
        $(`#frmTxtQty_${rowId}`).val(qty);
        $(`#frmTxtRate_${rowId}`).val(rate);
        $(`#frmTxtValue_${rowId}`).val(value);
    }

    CalcTotals();
    RenderMobileItemCards();
    $('#modalMobileItemEntry').modal('hide');
}

function RenderMobileItemCards() {
    const container = $('#mobileItemCards');
    container.empty();

    const rows = $('#tblPOItemsBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-item-empty"><i class="fa fa-box-open fa-2x d-block mb-2"></i>No items added yet.<br>Tap "+ Add Item" to start.</div>');
        return;
    }

    rows.each(function (index) {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const itemName = $(`#frmDdlItem_${rowId} option:selected`).text();
        const uomName = $(`#frmDdlUOM_${rowId} option:selected`).text();
        const gst = $(`#frmTxtGSTRate_${rowId}`).val();
        const qty = $(`#frmTxtQty_${rowId}`).val();
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val() || 0).toFixed(2);
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val() || 0).toFixed(2);

        container.append(`
            <div class="mobile-item-card">
                <div class="item-card-header">
                    <span class="item-card-num">${index + 1}</span>
                    <span class="item-card-name">${itemName}</span>
                    <div class="item-card-actions">
                        <button type="button" class="item-card-edit-btn" onclick="OpenMobileItemModal(${rowId})" title="Edit"><i class="fa fa-pencil-alt"></i></button>
                        <button type="button" class="item-card-del-btn" onclick="DeleteItemRow(${rowId})" title="Delete"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
                <div class="item-card-details">
                    <span class="item-card-detail"><i class="fa fa-ruler me-1"></i>${uomName}</span>
                    <span class="item-card-detail"><i class="fa fa-percent me-1"></i>GST: ${gst}%</span>
                    <span class="item-card-detail"><i class="fa fa-sort-amount-up me-1"></i>Qty: ${qty}</span>
                    <span class="item-card-detail"><i class="fa fa-tag me-1"></i>Rate: ${rate}</span>
                    <span class="item-card-detail item-card-value"><i class="fa fa-coins me-1"></i>Value: ${value}</span>
                </div>
            </div>`);
    });
}

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
window.OpenMobileItemModal = OpenMobileItemModal;
window.MobileCalcValue = MobileCalcValue;
window.MobileItemModalConfirm = MobileItemModalConfirm;

