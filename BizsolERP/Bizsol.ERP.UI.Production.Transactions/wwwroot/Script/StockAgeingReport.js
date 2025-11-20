import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    setCurrentDate();
    GetCategoryList();
    GetItemTypeList();
    GetWarehouseList();
    $("#btnStockAgeingReportShow").click(function () {
        GetStockAgeingReportList();
    });
});
function setCurrentDate() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var date = today.getDate();

    var fromDate = new Date(year, month, date);

    $('#txtAsOnDate').val(formatDateYYYYMMDD(fromDate));
}
function formatDateYYYYMMDD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}
function GetCategoryList() {
    StockAgeingReportService.GetCategoryList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlCategory')[0], response.map((item) => ({ Code: item.Category, Desp: item.Category })));

            $('#ddlCategory').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching category list');
    });
}
function GetItemTypeList() {
    StockAgeingReportService.GetItemTypeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemName')[0], response.map((item) => ({ Code: item.ItemType, Desp: item.ItemType })));

            $('#ddlItemName').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching item type list');
    });
}
function GetWarehouseList() {
    StockAgeingReportService.GetWarehouseList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlWarehouse')[0], response.map((item) => ({ Code: item.Warehouse, Desp: item.Warehouse })));

            $('#ddlWarehouse').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching warehouse list');
    });
}
function GetStockAgeingReportList() {
    let CategoryName = $('#ddlCategory').val();
    let ItemTypeName = $('#ddlItemName').val();
    let WarehouseName = $('#ddlWarehouse').val();
    let AsOnDate = $('#txtAsOnDate').val();
    Showloader();
    StockAgeingReportService.GetStockAgeingReportList(CategoryName, ItemTypeName, WarehouseName, AsOnDate).then(function (response) {
        HideLoader();
        $('#StockAgeingReport').show();
        if (response && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = { "0-90 D": 'right', "91-120 D": 'right', "121-180 D": 'right', "> 180 D": 'right',"Total":'right'};

            BizsolCustomFilterGrid.CreateDataTable("table-head-StockAgeingReport", "table-body-StockAgeingReport", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

        } else {
            HideLoader();
            $('#StockAgeingReport').hide();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        $('#StockAgeingReport').hide();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function ExportExcel() {
    const hiddenFields = [];
    let CategoryName = $('#ddlCategory').val();
    let ItemTypeName = $('#ddlItemName').val();
    let WarehouseName = $('#ddlWarehouse').val();
    let AsOnDate = $('#txtAsOnDate').val();
    StockAgeingReportService.GetStockAgeingReportList(CategoryName, ItemTypeName, WarehouseName, AsOnDate).then(function (response) {
        if (response && response.length > 0) {
            ExportToExcelControl.ExportToExcel(response, hiddenFields, "StockAgeingReport");
        } else {
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Export Stock Ageing Report Data');
    });
}
function BindSelectList1(element, list) {
    let option = '<option value="All">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.ExportExcel = ExportExcel;

