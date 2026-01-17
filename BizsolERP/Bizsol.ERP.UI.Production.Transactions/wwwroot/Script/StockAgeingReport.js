import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    setCurrentDate();
    GetCategoryList();
    GetItemTypeList();
    GetWarehouseList();
    GetReportOptionList();
    Bind_ddlItemMaster();
    $('#StockAgeingReportTableCard').hide();
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
function GetReportOptionList() {
    StockAgeingReportService.GetReportOptionList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlReportOption')[0], response.map((item) => ({ Code: item.Code, Desp: item.DisplayName })));

            $('#ddlReportOption').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching warehouse list');
    });
}
function Bind_ddlItemMaster() {
    let Category = $('#ddlCategory').val() || 'All';
    let ItemType = $('#ddlItemName').val() || 'All';
    
    // Check if Category and ItemType are selected
    if (!Category || Category.length === 0 || !ItemType || ItemType.length === 0) {
        // Clear the Item Name filter if Category or ItemType is not selected
        $('#ddlItemNameFilter').empty();
        $('#ddlItemNameFilter').select2({
            width: '-webkit-fill-available'
        });
        return;
    }
    
    StockAgeingReportService.GetItemNameList(Category, ItemType).then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemNameFilter')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
            $('#ddlItemNameFilter').select2({
                width: '-webkit-fill-available'
            });
        }
        else {
            $('#ddlItemNameFilter').empty();
            $('#ddlItemNameFilter').select2({
                width: '-webkit-fill-available'
            });
            toastr.warning('No items found for the selected Category and Item Type');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while fetching item name list');
    });
}
function GetStockAgeingReportList() {
    let CategoryName = $('#ddlCategory').val();
    let ItemTypeName = $('#ddlItemName').val();
    let WarehouseName = $('#ddlWarehouse').val();
    let ItemName = $('#ddlItemNameFilter').val();
    // If ItemName is "All", bind 0 instead
    if (ItemName === 'All' || (Array.isArray(ItemName) && ItemName.includes('All'))) {
        ItemName = 0;
    }
    let AsOnDate = $('#txtAsOnDate').val();
    Showloader();
    StockAgeingReportService.GetStockAgeingReportList(CategoryName, ItemTypeName, WarehouseName, ItemName, AsOnDate).then(function (response) {
        HideLoader();
        $('#StockAgeingReportTableCard').show();
        $('#StockAgeingReport').show();
        if (response && response.length > 0) {
            response = response.map(item => {
                if (item["0-90 D"] !== undefined && item["0-90 D"] !== null && !isNaN(item["0-90 D"])) {
                    item["0-90 D"] = parseFloat(item["0-90 D"]).toFixed(3);
                }
                if (item["91-120 D "] !== undefined && item["91-120 D "] !== null && !isNaN(item["91-120 D "])) {
                    item["91-120 D "] = parseFloat(item["91-120 D "]).toFixed(3);
                }
                if (item["121-180 D "] !== undefined && item["121-180 D "] !== null && !isNaN(item["121-180 D "])) {
                    item["121-180 D "] = parseFloat(item["121-180 D "]).toFixed(3);
                }
                if (item["> 180 D"] !== undefined && item["> 180 D"] !== null && !isNaN(item["> 180 D"])) {
                    item["> 180 D"] = parseFloat(item["> 180 D"]).toFixed(3);
                }
                if (item["Total"] !== undefined && item["Total"] !== null && !isNaN(item["Total"])) {
                    item["Total"] = parseFloat(item["Total"]).toFixed(3);
                }
                return item;
            });
            const stringFilterColumn = ["Item Name","SizeDesp"];
            const numericFilterColumn = ["0-90 D", "91-120 D ", "121-180 D ", "> 180 D"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = { "0-90 D": 'right', "91-120 D ": 'right', "121-180 D ": 'right', "> 180 D": 'right',"Total":'right'};

            BizsolCustomFilterGrid.CreateDataTable("table-head-StockAgeingReport", "table-body-StockAgeingReport", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            setStockAgeingFooterTotals(response);

        } else {
            HideLoader();
            $('#StockAgeingReportTableCard').hide();
            $('#StockAgeingReport').hide();
            clearStockAgeingFooter();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        $('#StockAgeingReportTableCard').hide();
        $('#StockAgeingReport').hide();
        clearStockAgeingFooter();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function ExportExcel() {
    const hiddenFields = [];
    let CategoryName = $('#ddlCategory').val();
    let ItemTypeName = $('#ddlItemName').val();
    let WarehouseName = $('#ddlWarehouse').val();
    let ItemName = $('#ddlItemNameFilter').val();
    // If ItemName is "All", bind 0 instead
    if (ItemName === 'All' || (Array.isArray(ItemName) && ItemName.includes('All'))) {
        ItemName = 0;
    }
    let AsOnDate = $('#txtAsOnDate').val();
    StockAgeingReportService.GetStockAgeingReportList(CategoryName, ItemTypeName, WarehouseName, ItemName, AsOnDate).then(function (response) {
        if (response && response.length > 0) {
            ExportToExcelControl.ExportToExcel(response, hiddenFields, "StockAgeingReport");
        } else {
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Export Stock Ageing Report Data');
    });
}
function setStockAgeingFooterTotals(data) {
    const footerId = '#table-foot-StockAgeingReport';
    if (!Array.isArray(data) || data.length === 0) {
        clearStockAgeingFooter();
        return;
    }
    const totalColumns = ["0-90 D", "91-120 D ", "121-180 D ", "> 180 D", "Total"];
    const totals = {};
    totalColumns.forEach(function (column) {
        totals[column] = 0;
    });
    data.forEach(function (item) {
        totalColumns.forEach(function (column) {
            const value = parseFloat(item[column]);
            if (!isNaN(value)) {
                totals[column] = totals[column] + value;
            }
        });
    });
    totalColumns.forEach(function (column) {
        if (!isNaN(totals[column])) {
            totals[column] = totals[column].toFixed(3);
        } else {
            totals[column] = '';
        }
    });
    const columns = Object.keys(data[0]);
    let footerRow = '<tr>';
    columns.forEach(function (column, index) {
        if (index === 0) {
            footerRow = footerRow + '<th style="text-align:left">Grand Total</th>';
        } else if (totalColumns.includes(column)) {
            footerRow = footerRow + '<th style="text-align:right">' + totals[column] + '</th>';
        } else {
            footerRow = footerRow + '<th></th>';
        }
    });
    footerRow = footerRow + '</tr>';
    $(footerId).html(footerRow);
}
function clearStockAgeingFooter() {
    $('#table-foot-StockAgeingReport').empty();
}
function BindSelectList1(element, list) {
    let option = '<option value="All">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    
        setTimeout(() => {
            const filteredData = window['filteredData_StockAgeingReport'] || [];
            setStockAgeingFooterTotals(filteredData);
        }, 300);
});
window.ExportExcel = ExportExcel;
window.Bind_ddlItemMaster = Bind_ddlItemMaster;

