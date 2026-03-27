import { InvoiceGSTService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/InvoiceGSTService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_InvoiceGSTDataList = [];
let G_InvoiceItemMasterList = [];
let G_InvoiceGSTTableInitialized = false;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetInvoiceGSTConsigneeList();
    bindSaleTypeDropdown();
    bindSubSaleTypeDropdown();
    GetInvoiceGSTCurrentList();

    if ($('#btnSave').length) $('#btnSave').on('click', saveInvoiceGST);
    if ($('#btnClear').length) $('#btnClear').on('click', clearInvoiceGSTForm);
    $('#btnInvoiceGSTShow').on('click', GetInvoiceGSTCurrentList);
    if ($('#btnUpdate').length) $('#btnUpdate').on('click', UpdateInvoiceGST);
});
function GetInvoiceGSTConsigneeList() {
    Showloader();
    InvoiceGSTService.GetInvoiceGSTConsigneeList().then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            const consigneeList = response.map((item) => ({
                Code: item.ConsigneeCode ?? item.Code ?? 0,
                Desp: item.AccountDesp ?? ''
            }));

            const indentorBuyerList = response.map((item) => ({
                Code: item.IndentorBuyerCode ?? item.Code ?? 0,
                Desp: item.AccountDesp ?? ''
            }));

            const accountList = response.map((item) => ({
                Code: item.AccountCode ?? item.Code ?? 0,
                Desp: item.AccountDesp ?? ''
            }));

            bindSelectList($('#ddlConsignee')[0], consigneeList);
            bindSelectList($('#ddlIndentorBuyer')[0], indentorBuyerList);
            bindSelectList($('#ddlAccount')[0], accountList);

            if ($.fn.select2) {
                $('#ddlConsignee, #ddlIndentorBuyer, #ddlAccount').select2({
                    placeholder: 'Please select...',
                    allowClear: true,
                    width: '100%'
                });
            }
        } else {
            toastr.error('No InvoiceGST consignee data available');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error('Error fetching InvoiceGST consignee data: ' + error);
    });
}
function bindSaleTypeDropdown() {
    InvoiceGSTService.GETDropdownSaleType().then(function (response) {
        if (response && response.length > 0) {
            const saleTypeList = response.map((item) => ({
                Code: item.SaleTypeCode ?? item.Code ?? 0,
                Desp: item.InvoiceType ?? ''
            }));

            bindSelectList($('#ddlSaleType')[0], saleTypeList);

            if ($.fn.select2) {
                $('#ddlSaleType').select2({
                    placeholder: 'Please select sale type...',
                    allowClear: true,
                    width: '100%'
                });
            }
        } else {
            // No data is not an error here; just leave dropdown empty
        }
    }).catch(function (error) {
        toastr.error('Error fetching Sale Type: ' + error);
    });
}
function bindSubSaleTypeDropdown() {
    InvoiceGSTService.GETDropdownSubSaleType().then(function (response) {
        if (response && response.length > 0) {
            const subSaleTypeList = response.map((item) => ({
                Code: item.SubSaleTypeCode ?? item.Code ?? 0,
                Desp: item.SubSaleTypeName ?? item.SubSaleType ?? item.Desp ?? item.Name ?? item.DESCRIPTION ?? ''
            }));

            bindSelectList($('#ddlSubSaleType')[0], subSaleTypeList);

            if ($.fn.select2) {
                $('#ddlSubSaleType').select2({
                    placeholder: 'Please select sub sale type...',
                    allowClear: true,
                    width: '100%'
                });
            }
        } else {
            // No data is not an error here; just leave dropdown empty
        }
    }).catch(function (error) {
        toastr.error('Error fetching Sub Sale Type: ' + error);
    });
}
//function saveInvoiceGST() {
//    var PayloadInvoiceGSTData = {
//        Code: $('#ddlOrderNo').val(), 
//        InvoiceGSTWeight: $('#ddlQty').val(), 
//        InvoiceGSTRemark: $('#txtRemark').val() || '',
//    };

//    Showloader();
//    InvoiceGSTService.SaveInvoiceGSTData(PayloadInvoiceGSTData).then(function (response) {
//        HideLoader();
//        if (response.Status === 'Y') {
//            toastr.success(response.Message || 'InvoiceGST saved successfully');
//            clearInvoiceGSTForm();
//            GetInvoiceGSTCurrentList();
//        } else {
//            toastr.error(response.Message || 'Save failed');
//        }
//    }).catch(function (error) {
//        HideLoader();
//        toastr.error((error && error.Message) || 'Error saving data');
//    });
//}
//function UpdateInvoiceGST() {
//    var PayloadInvoiceGSTData = {
//        Code: $('#txtOrderNo_Code').val(), 
//        InvoiceGSTWeight: $('#txtQty').val(), 
//        InvoiceGSTRemark: $('#txtEditRemark').val() || '',
//    };

//    Showloader();
//    InvoiceGSTService.SaveInvoiceGSTData(PayloadInvoiceGSTData).then(function (response) {
//        HideLoader();
//        if (response.Status === 'Y') {
//            toastr.success(response.Message || 'InvoiceGST Update successfully');
//            clearInvoiceGSTForm();
//            $('#LocateInvoiceGST').show();
//            $('#createInvoiceGST').hide();
//            $('#EditInvoiceGST').hide();
//            GetInvoiceGSTCurrentList();
//        } else {
//            toastr.error(response.Message || 'Update failed');
//        }
//    }).catch(function (error) {
//        HideLoader();
//        toastr.error((error && error.Message) || 'Error Update data');
//    });
//}
function clearInvoiceGSTForm() {
    $('#ddlOrderNo').val('0').trigger('change');
    $('#ddlDespatchNo').val('0').trigger('change');
    $('#ddlTruckNo').val('0').trigger('change');
    $('#ddlQty').val('0');
    $('#txtRemark').val('');
    $('#txtOrderNo_Code').val(0);
    $('#txtOrderNo').val('0').trigger('change');
    $('#txtDespatchNo').val('0').trigger('change');
    $('#txtTruckNo').val('0').trigger('change');
    $('#txtQty').val('');
    $('#txtEditRemark').val('');
}
function CreateNew() {
    var ModuleName = "Invoice GST",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#LocateInvoiceGST').hide();
            $('#EditInvoiceGST').hide();
            $('#createInvoiceGST').show();
        }
    });
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}   
function Back() {
    clearInvoiceGSTForm();
    $('#LocateInvoiceGST').show();
    $('#createInvoiceGST').hide();
    $('#EditInvoiceGST').hide();
}
function GetInvoiceGSTCurrentList() {
    Showloader();
    InvoiceGSTService.GetInvoiceGSTCurrentList().then(function (response) {
        HideLoader();
        $('#tblInvoiceGST').show();
        var tableList = [];
        var itemMasterList = [];
        if (response && Array.isArray(response)) {
            tableList = response;
            itemMasterList = response;
        } else if (response && typeof response === 'object') {
            tableList = response.TableData || response.data || response.list || response.Data || response.List || [];
            itemMasterList = response.ItemMaster || response.ItemMasterList || tableList;
            if (!Array.isArray(tableList)) tableList = [];
            if (!Array.isArray(itemMasterList)) itemMasterList = tableList;
        }
        G_InvoiceGSTDataList = tableList;
        G_InvoiceItemMasterList = itemMasterList;
        fillInvoiceGSTTableWithData(G_InvoiceGSTDataList);
    }).catch(function (error) {
        HideLoader();
        $('#tblInvoiceGST').show();
        G_InvoiceGSTDataList = [];
        G_InvoiceItemMasterList = [];
        fillInvoiceGSTTableWithData([]);
        toastr.error(error && (error.message || error.Message) || 'Error loading list');
    });
}
function getInvoiceGSTItemOptions() {
    var list = G_InvoiceItemMasterList;
    if (!list || !Array.isArray(list) || list.length === 0) {
        return { itemName: [], itemCode: [], displayName: [] };
    }
    var seenName = {}, seenCode = {}, seenDisp = {};
    var itemName = [], itemCode = [], displayName = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item) continue;
        var n = (item.ItemName != null ? item.ItemName : item.itemName);
        var c = (item.ItemCode != null ? item.ItemCode : item.itemCode);
        var d = (item.DisplayName != null ? item.DisplayName : (item.ItemDisplayName != null ? item.ItemDisplayName : item.displayName));
        if (n != null && n !== '' && !seenName[n]) {
            seenName[n] = true;
            itemName.push({ Code: String(n), Desp: String(n) });
        }
        if (c != null && c !== '' && !seenCode[c]) {
            seenCode[c] = true;
            itemCode.push({ Code: String(c), Desp: String(c) });
        }
        if (d != null && d !== '' && !seenDisp[d]) {
            seenDisp[d] = true;
            displayName.push({ Code: String(d), Desp: String(d) });
        }
    }
    return { itemName: itemName, itemCode: itemCode, displayName: displayName };
}
function ensureInvoiceGSTTableStructure() {
    if (G_InvoiceGSTTableInitialized) return;
    var cols = G_InvoiceGSTTableColumns;
    if (!cols || !cols.length) return;
    var $table = $('#tblInvoiceGST');
    if (!$table.length) return;
    var theadHtml = '<tr class="table-primary">';
    for (var i = 0; i < cols.length; i++) {
        theadHtml += '<th style="min-width:100px">' + (cols[i].label || cols[i].key) + '</th>';
    }
    theadHtml += '</tr>';
    var $thead = $table.find('#InvoiceTableheader');
    if ($thead.length) $thead.html(theadHtml);
    G_InvoiceGSTTableInitialized = true;
}
function bindSelectList(element, list) {
    let option = '<option value="0">Please select...</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function fillInvoiceGSTTableWithData(data) {
    ensureInvoiceGSTTableStructure();
    var tbody = $('#InvoiceTablebody');
    if (!tbody.length) return;
    tbody.empty();

    var opts = getInvoiceGSTItemOptions();

    if (data && data.length > 0) {
        data.forEach(function (item, index) {
            var rowId = 'row' + (index + 1);
            var itemNameVal = (item.ItemName != null ? item.ItemName : item.itemName) || '';
            var itemCodeVal = (item.ItemCode != null ? item.ItemCode : item.itemCode) || '';
            var displayNameVal = (item.DisplayName != null ? item.DisplayName : (item.ItemDisplayName != null ? item.ItemDisplayName : item.displayName)) || '';

            var rowHtml = '<tr id="' + rowId + '" data-detail-code="' + (item.SNo || item.Code || '') + '" data-master-code="' + (item.Code || 0) + '">' +
                '<td><select id="ddlItemName_' + rowId + '" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>' +
                '<td><select id="ddlItemCode_' + rowId + '" class="box_border form-control form-control-sm ddlItemCodeRow" required></select></td>' +
                '<td><select id="ddlDisplayName_' + rowId + '" class="box_border form-control form-control-sm ddlDisplayNameRow" required></select></td>' +
                '<td>' +
                '<button type="button" class="btn btn-success btn-height me-1" title="Edit" onclick="SaveInvoiceGSTRow(\'' + rowId + '\', this)"><i class="fas fa-pencil"></i></button>' +
                '<button type="button" class="btn btn-danger btn-height" title="Delete" onclick="DeleteInvoiceGSTRow(\'' + rowId + '\', this)"><i class="fas fa-trash"></i></button>' +
                '</td></tr>';
            tbody.append(rowHtml);

            var $row = $('#' + rowId);
            bindSelectList($row.find('select.ddlItemNameRow')[0], opts.itemName || []);
            bindSelectList($row.find('select.ddlItemCodeRow')[0], opts.itemCode || []);
            bindSelectList($row.find('select.ddlDisplayNameRow')[0], opts.displayName || []);
            try {
                BizSolHelperFunction.SelectOptionByText('ddlItemName_' + rowId, String(itemNameVal || ''));
                BizSolHelperFunction.SelectOptionByText('ddlItemCode_' + rowId, String(itemCodeVal || ''));
                BizSolHelperFunction.SelectOptionByText('ddlDisplayName_' + rowId, String(displayNameVal || ''));
            } catch (e) { }
        });
    }

    enableInvoiceGSTNewRowAddition();
    initInvoiceGSTSelect2();
}
function enableInvoiceGSTNewRowAddition() {
    var tbody = $('#InvoiceTablebody');
    if (!tbody.length) return;
    tbody.find('tr#0, tr[data-new-row="1"]').remove();
    var rowId = '0';

    var newRowHtml = '<tr id="' + rowId + '" data-new-row="1" data-detail-code="0" data-master-code="0">' +
        '<td><select id="ddlItemName_0" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>' +
        '<td><select id="ddlItemCode_0" class="box_border form-control form-control-sm ddlItemCodeRow" required></select></td>' +
        '<td><select id="ddlDisplayName_0" class="box_border form-control form-control-sm ddlDisplayNameRow" required></select></td>' +
        '<td><button type="button" class="btn btn-success btn-height" title="Save" onclick="SaveInvoiceGSTRow(\'0\', this)"><i class="fas fa-save"></i></button></td>' +
        '</tr>';
    tbody.append(newRowHtml);

    var opts = getInvoiceGSTItemOptions();
    var $row = $('#' + rowId);
    var elItemName = $row.find('select.ddlItemNameRow')[0];
    var elItemCode = $row.find('select.ddlItemCodeRow')[0];
    var elDisplayName = $row.find('select.ddlDisplayNameRow')[0];
    if (elItemName) bindSelectList(elItemName, opts.itemName || []);
    if (elItemCode) bindSelectList(elItemCode, opts.itemCode || []);
    if (elDisplayName) bindSelectList(elDisplayName, opts.displayName || []);
    initInvoiceGSTSelect2($row);
}
function initInvoiceGSTSelect2($container) {
    if (!$.fn.select2) return;
    var $scope = $container && $container.length ? $container : $(document);
    $scope.find('.ddlItemNameRow').each(function () {
        var $el = $(this);
        if (!$el.data('select2')) $el.select2({ width: '100%', placeholder: 'Select Item Name' });
    });
    $scope.find('.ddlItemCodeRow').each(function () {
        var $el = $(this);
        if (!$el.data('select2')) $el.select2({ width: '100%', placeholder: 'Select Item Code' });
    });
    $scope.find('.ddlDisplayNameRow').each(function () {
        var $el = $(this);
        if (!$el.data('select2')) $el.select2({ width: '100%', placeholder: 'Select Display Name' });
    });
}
function SaveInvoiceGSTRow(rowId, btn) {
    var $row = $(btn).closest('tr');
    var itemName = $row.find('.ddlItemNameRow').val();
    var itemCode = $row.find('.ddlItemCodeRow').val();
    var displayName = $row.find('.ddlDisplayNameRow').val();

    if (!itemName || itemName === '0') {
        toastr.error('Please select Item Name.');
        return;
    }
    if (!itemCode || itemCode === '0') {
        toastr.error('Please select Item Code.');
        return;
    }

    if (rowId === '0' || rowId === 0) {
        var itemNameText = (itemName != null && itemName !== '') ? itemName : '';
        var itemCodeText = (itemCode != null && itemCode !== '') ? itemCode : '';
        var displayText = (displayName != null && displayName !== '') ? displayName : '';
        if ($.fn.select2) {
            try {
                var d1 = $row.find('.ddlItemNameRow').select2('data');
                if (Array.isArray(d1) && d1[0] && typeof d1[0].text === 'string') itemNameText = d1[0].text;
            } catch (e1) { }
            try {
                var d2 = $row.find('.ddlItemCodeRow').select2('data');
                if (Array.isArray(d2) && d2[0] && typeof d2[0].text === 'string') itemCodeText = d2[0].text;
            } catch (e2) { }
            try {
                var d3 = $row.find('.ddlDisplayNameRow').select2('data');
                if (Array.isArray(d3) && d3[0] && typeof d3[0].text === 'string') displayText = d3[0].text;
            } catch (e3) { }
        }
        $row.remove();
        var newId = 'row' + Date.now();
        var opts = getInvoiceGSTItemOptions();

        var newRowHtml = '<tr id="' + newId + '" data-detail-code="0" data-master-code="0">' +
            '<td><select id="ddlItemName_' + newId + '" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>' +
            '<td><select id="ddlItemCode_' + newId + '" class="box_border form-control form-control-sm ddlItemCodeRow" required></select></td>' +
            '<td><select id="ddlDisplayName_' + newId + '" class="box_border form-control form-control-sm ddlDisplayNameRow" required></select></td>' +
            '<td><button type="button" class="btn btn-success btn-height me-1" title="Edit" onclick="SaveInvoiceGSTRow(\'' + newId + '\', this)"><i class="fas fa-pencil"></i></button>' +
            '<button type="button" class="btn btn-danger btn-height" title="Delete" onclick="DeleteInvoiceGSTRow(\'' + newId + '\', this)"><i class="fas fa-trash"></i></button></td></tr>';
        $('#InvoiceTablebody').append(newRowHtml);
        var $newRow = $('#' + newId);
        bindSelectList($newRow.find('select.ddlItemNameRow')[0], opts.itemName || []);
        bindSelectList($newRow.find('select.ddlItemCodeRow')[0], opts.itemCode || []);
        bindSelectList($newRow.find('select.ddlDisplayNameRow')[0], opts.displayName || []);
        $newRow.find('.ddlItemNameRow').val(itemName || '');
        $newRow.find('.ddlItemCodeRow').val(itemCode || '');
        $newRow.find('.ddlDisplayNameRow').val(displayName || '');
        initInvoiceGSTSelect2($newRow);
        enableInvoiceGSTNewRowAddition();
        toastr.success('Row saved.');
    } else {
        toastr.success('Row updated.');
    }
}

function DeleteInvoiceGSTRow(rowId, btn) {
    $(btn).closest('tr').remove();
    toastr.success('Row removed.');
}
function Download() {
    const hiddenFields = [
        "Code"
    ];
    ExportToExcelControl.ExportToExcel(G_InvoiceGSTDataList, hiddenFields, "InvoiceGSTReport");
}
function EditInvoiceGST(Code) {
    var ModuleName = "Invoice GST",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#LocateInvoiceGST').hide();
            $('#createInvoiceGST').hide();
            $('#EditInvoiceGST').show();
            GetInvoiceGSTEditList(Code);
        }
    });
}
function GetInvoiceGSTEditList(Code) {
    InvoiceGSTService.GetInvoiceGSTEditList(Code).then(function (response) {
        if (response.length > 0) {
            $('#txtOrderNo_Code').val(response[0].Code);
            $('#txtOrderNo').val(response[0].OrderNo);
            $('#txtDespatchNo').val(response[0].DespatchAdviceNo);
            $('#txtTruckNo').val(response[0].TruckNo);
            $('#txtQty').val(response[0]?.['Qty MT']);
            $('#txtEditRemark').val(response[0].InvoiceGSTRemark);
        }
    });
}

window.CreateNew = CreateNew;
window.Back = Back;
window.Download = Download;
window.EditInvoiceGST = EditInvoiceGST;
window.SaveInvoiceGSTRow = SaveInvoiceGSTRow;
window.DeleteInvoiceGSTRow = DeleteInvoiceGSTRow;