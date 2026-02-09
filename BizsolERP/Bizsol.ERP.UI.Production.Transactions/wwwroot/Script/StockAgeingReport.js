import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { createSizeFilterControlModal, initializeSizeFilterControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CommonSizeFilterControl.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
let G_ItemSizeMaster_Codes = '';

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
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Category...'
            });
            
            // Set default value to "All"
            $('#ddlCategory').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlCategory').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
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
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Item Type...'
            });
            
            // Set default value to "All"
            $('#ddlItemName').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlItemName').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
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
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Warehouse...'
            });
            
            // Set default value to "All"
            $('#ddlWarehouse').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlWarehouse').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
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
            $('#ddlReportOption').select2({ width: '-webkit-fill-available' });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching warehouse list');
    });
}

function Bind_ddlItemMaster() {
    let Category = $('#ddlCategory').val() || [];
    let ItemType = $('#ddlItemName').val() || [];
    
    if (!Array.isArray(Category)) {
        Category = Category ? [Category] : [];
    }
    if (!Array.isArray(ItemType)) {
        ItemType = ItemType ? [ItemType] : [];
    }
    
    // Check if Category and ItemType are selected
    if (!Category || Category.length === 0 || !ItemType || ItemType.length === 0) {
        // Clear the Item Name filter if Category or ItemType is not selected
        $('#ddlItemNameFilter').empty();
        $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
        return;
    }
    
    // Convert to SQL IN-clause format with quotes for text fields
    const CategoryCsv = Category.join("','");   // "Cat1','Cat2"
    const ItemTypeCsv = ItemType.join("','");   // "Type1','Type2"

    StockAgeingReportService.GetItemNameList(CategoryCsv, ItemTypeCsv).then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemNameFilter')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
            $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
        }
        else {
            $('#ddlItemNameFilter').empty();
            $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
            toastr.warning('No items found for the selected Category and Item Type');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while fetching item name list');
    });
}

export function GetStockAgeingReportList() {
    let CategoryName = $('#ddlCategory').val() || [];
    let ItemTypeName = $('#ddlItemName').val() || [];
    let WarehouseName = $('#ddlWarehouse').val() || [];
    let ItemName = $('#ddlItemNameFilter').val();
    let AsOnDate = $('#txtAsOnDate').val();

    const isEmptyMulti = (val) => !val || (Array.isArray(val) && val.length === 0);

    if (isEmptyMulti(CategoryName)){ 
        toastr.error('Please select category.');
        return;
    }
    if (isEmptyMulti(ItemTypeName)) {
        toastr.error('Please select item type.');
        return;
    }
    if (isEmptyMulti(WarehouseName)) {
        toastr.error('Please select warehouse .');
        return;
    }
    if (ItemName == null || ItemName == undefined || ItemName == '') {
        toastr.error('Please select item name.');
        return;
    }
    if (!txtAsOnDate) {
        toastr.error('Please select as on date.');
        return;
    }
    if (!Array.isArray(CategoryName)) {
        CategoryName = CategoryName ? [CategoryName] : [];
    }
    if (!Array.isArray(ItemTypeName)) {
        ItemTypeName = ItemTypeName ? [ItemTypeName] : [];
    }
    if (!Array.isArray(WarehouseName)) {
        WarehouseName = WarehouseName ? [WarehouseName] : [];
    }

    CategoryName = CategoryName.join("','"); 
    ItemTypeName = ItemTypeName.join("','");  
    WarehouseName = WarehouseName.join("','");

    if (Array.isArray(ItemName)) {
        if (ItemName.includes('All')) {
            ItemName = 0;
        } else {
            ItemName = ItemName.join(',');
        }
    } else if (ItemName === 'All') {
        ItemName = 0;
    }

    const Payload = {
        category: CategoryName,
        itemType: ItemTypeName,
        warehouse: WarehouseName,
        itemMaster_Code: ItemName,
        asOnDate: AsOnDate,
        itemSizeMaster_Codes: G_ItemSizeMaster_Codes
    }
    
    Showloader();
    StockAgeingReportService.GetStockAgeingReportList(Payload).then(function (response) {
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
        $('#StockAgegingReport').hide();
        clearStockAgeingFooter();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}

function ExportExcel() {
    const hiddenFields = [];
    let CategoryName = $('#ddlCategory').val() || [];
    let ItemTypeName = $('#ddlItemName').val() || [];
    let WarehouseName = $('#ddlWarehouse').val() || [];
    let ItemName = $('#ddlItemNameFilter').val();
    let AsOnDate = $('#txtAsOnDate').val();

    const isEmptyMulti = (val) => !val || (Array.isArray(val) && val.length === 0);

    if (isEmptyMulti(CategoryName)) {
        toastr.error('Please select category.');
        return;
    }
    if (isEmptyMulti(ItemTypeName)) {
        toastr.error('Please select item type.');
        return;
    }
    if (isEmptyMulti(WarehouseName)) {
        toastr.error('Please select warehouse .');
        return;
    }
    if (ItemName == null || ItemName == undefined || ItemName == '') {
        toastr.error('Please select item name.');
        return;
    }
    if (!txtAsOnDate) {
        toastr.error('Please select as on date.');
        return;
    }
    if (!Array.isArray(CategoryName)) {
        CategoryName = CategoryName ? [CategoryName] : [];
    }
    if (!Array.isArray(ItemTypeName)) {
        ItemTypeName = ItemTypeName ? [ItemTypeName] : [];
    }
    if (!Array.isArray(WarehouseName)) {
        WarehouseName = WarehouseName ? [WarehouseName] : [];
    }

    CategoryName = CategoryName.join("','");
    ItemTypeName = ItemTypeName.join("','");
    WarehouseName = WarehouseName.join("','");

    if (Array.isArray(ItemName)) {
        if (ItemName.includes('All')) {
            ItemName = 0;
        } else {
            ItemName = ItemName.join(',');
        }
    } else if (ItemName === 'All') {
        ItemName = 0;
    }

    const Payload = {
        category: CategoryName,
        itemType: ItemTypeName,
        warehouse: WarehouseName,
        itemMaster_Code: ItemName,
        asOnDate: AsOnDate,
        itemSizeMaster_Codes: G_ItemSizeMaster_Codes
    }
    
    StockAgeingReportService.GetStockAgeingReportList(Payload).then(function (response) {
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

function ShowSizeControlModal() {
    var itemMasterCode = $("#ddlItemNameFilter").val();
   
    if (!itemMasterCode || itemMasterCode === 'All' || itemMasterCode === '0') {
        itemMasterCode = "0";
    }
    
    const options = {
        ModalId: 'DivSizeControlmodal',
        ItemMaster_Code: itemMasterCode,
        CallBackFunctionName_btnDone: 'onSizeFilterApplied'
    };
   
    initializeSizeFilterControl(options);
}

window.onSizeFilterApplied = function (response) {
    if (response && response.length > 0) {
        G_ItemSizeMaster_Codes = response.map(x => x.Code).join(',');
    } else {
        G_ItemSizeMaster_Codes = '';
    }
};

$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    setTimeout(() => {
        const filteredData = window['filteredData_StockAgeingReport'] || [];
        setStockAgeingFooterTotals(filteredData);
    }, 300);
});

window.ExportExcel = ExportExcel;
window.Bind_ddlItemMaster = Bind_ddlItemMaster;
window.GetStockAgeingReportList = GetStockAgeingReportList;
window.ShowSizeControlModal = ShowSizeControlModal;


