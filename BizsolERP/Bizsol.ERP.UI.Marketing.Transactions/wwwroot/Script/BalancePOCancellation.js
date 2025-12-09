import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ClosePendingOrderService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ClosePendingOrderService.js';

let G_FromDateValue = '';
let G_ToDateValue = '';
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    setCurrentDateBalancePOCancellation();
    InitializeUnitDropdowns();
    InitializeBalanceQtyOperator();
    GetFilterForCancelPendingOrder();
    InitializePartyNameDropdown();
    InitializeOrderNoDropdown();
    InitializeOrderTypeDropdown();
    InitializeItemNameDropdown();
    InitializeBuyerPONoDropdown();

    $("#btnShow").click(function () {
        GetBalancePOCancellationList();
    });

    $("#btnSelectAll").click(function () {
        SelectAllRows();
    });

    $("#btnSaveBalance").click(function () {
        SaveBalancePOCancellation();
    });

    $("#ddlBalanceQtyOperator").change(function () {
        ToggleBalanceQtyToField();
    });

    $("#ddlDispatchQtyOperator").change(function () {
        ToggleDispatchQtyToField();
    });
    $('#chkOrderQty').on("click", function () {
        GetBalancePOCancellationList();
    });
    $('#chkShowDispatchQty').on("click", function () {
        GetBalancePOCancellationList();
    });
    $('#DeliveryDetailCheck').on("click", function () {
        GetBalancePOCancellationList();
    });
});
function setCurrentDateBalancePOCancellation() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    $('#txtBalanceFromDate').val(formatDate(firstOfMonth));
    $('#txtBalanceToDate').val(formatDate(today));
    G_FromDateValue = $('#txtBalanceFromDate').val();
    G_ToDateValue = $('#txtBalanceToDate').val();
}

function InitializeUnitDropdowns() {
    var unitList = [
        { Code: 'MT', Desp: 'MT' },
        { Code: 'PC', Desp: 'PC' },
        { Code: 'MTRS', Desp: 'MTRS' }
    ];
    
    if ($('#ddlBalanceQtyUnit').length > 0) {
        BindSelectList1($('#ddlBalanceQtyUnit')[0], unitList);
        $('#ddlBalanceQtyUnit').val('');
        $('#ddlBalanceQtyUnit').select2({
            width: '-webkit-fill-available'
        });
    }
    
    if ($('#ddlDispatchQtyUnit').length > 0) {
        BindSelectList1($('#ddlDispatchQtyUnit')[0], unitList);
        $('#ddlDispatchQtyUnit').val('');
        $('#ddlDispatchQtyUnit').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeBalanceQtyOperator() {
    if ($('#ddlBalanceQtyOperator').length > 0) {
        $('#ddlBalanceQtyOperator').val('>');
    }
    if ($('#txtBalanceQtyFrom').length > 0) {
        $('#txtBalanceQtyFrom').val('0.000');
    }
    if ($('#txtBalanceQtyTo').length > 0) {
        $('#txtBalanceQtyTo').val('0.000');
    }
    if ($('#txtDispatchQtyFrom').length > 0) {
        $('#txtDispatchQtyFrom').val('0.000');
    }
    if ($('#txtDispatchQtyTo').length > 0) {
        $('#txtDispatchQtyTo').val('0.000');
    }
    ToggleBalanceQtyToField();
    ToggleDispatchQtyToField();
}

function ToggleBalanceQtyToField() {
    if ($('#ddlBalanceQtyOperator').length > 0 && $('#txtBalanceQtyTo').length > 0) {
        var operator = $('#ddlBalanceQtyOperator').val();
        if (operator === 'between') {
            $('#txtBalanceQtyTo').show();
        } else {
            $('#txtBalanceQtyTo').hide();
            $('#txtBalanceQtyTo').val('');
        }
    }
}

function ToggleDispatchQtyToField() {
    if ($('#ddlDispatchQtyOperator').length > 0 && $('#txtDispatchQtyTo').length > 0) {
        var operator = $('#ddlDispatchQtyOperator').val();
        if (operator === 'between') {
            $('#txtDispatchQtyTo').show();
        } else {
            $('#txtDispatchQtyTo').hide();
            $('#txtDispatchQtyTo').val('');
        }
    }
}

function InitializePartyNameDropdown() {
    if ($('#ddlPartyName').length > 0) {
        BindSelectList1($('#ddlPartyName')[0], []);
        $('#ddlPartyName').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeOrderNoDropdown() {
    if ($('#ddlOrderNo').length > 0) {
        BindSelectList1($('#ddlOrderNo')[0], []);
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeOrderTypeDropdown() {
    if ($('#ddlOrderType').length > 0) {
        BindSelectList1($('#ddlOrderType')[0], []);
        $('#ddlOrderType').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeItemNameDropdown() {
    if ($('#ddlItemName').length > 0) {
        BindSelectList1($('#ddlItemName')[0], []);
        $('#ddlItemName').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeBuyerPONoDropdown() {
    if ($('#ddlBuyerPONo').length > 0) {
        BindSelectList1($('#ddlBuyerPONo')[0], []);
        $('#ddlBuyerPONo').select2({
            width: '-webkit-fill-available'
        });
    }
}

function SelectAllRows() {
    var table = $('#BalancePOCancellation');
    var checkboxes = table.find('tbody input[type="checkbox"]');
    var allChecked = checkboxes.length > 0 && checkboxes.filter(':checked').length === checkboxes.length;
    
    checkboxes.prop('checked', !allChecked);
}
function GetFilterForCancelPendingOrder() {
    ClosePendingOrderService.GetFilterForCancelPendingOrder()
        .then(function (response) {
            if (response && response.SalesPerson && response.SalesPerson.length > 0 && $('#ddlMarketingMan').length > 0) {
                var marketingList = [];
                for (var i = 0; i < response.SalesPerson.length; i++) {
                    var sp = response.SalesPerson[i].SalesPerson;
                    marketingList.push({ Code: sp, Desp: sp });
                }

                BindSelectList1($('#ddlMarketingMan')[0], marketingList);
                $('#ddlMarketingMan option[value="0"]').val('ALL').text('All');

                $('#ddlMarketingMan').select2({
                    width: '-webkit-fill-available'
                });
            }

            if (response && response.PartyName && response.PartyName.length > 0 && $('#ddlPartyName').length > 0) {
                var partyList = [];
                for (var j = 0; j < response.PartyName.length; j++) {
                    var party = response.PartyName[j].Party;
                    partyList.push({ Code: party, Desp: party });
                }

                BindSelectList1($('#ddlPartyName')[0], partyList);
                $('#ddlPartyName option[value="0"]').val('ALL').text('All');

                $('#ddlPartyName').select2({
                    width: '-webkit-fill-available'
                });
            }
            if (response && response.SubSaleType && response.SubSaleType.length > 0 && $('#ddlOrderType').length > 0) {
                var OrderTypeList = [];
                for (var j = 0; j < response.SubSaleType.length; j++) {
                    var subSaleType = response.SubSaleType[j].SubSaleType;
                    OrderTypeList.push({ Code: subSaleType, Desp: subSaleType });
                }

                BindSelectList1($('#ddlOrderType')[0], OrderTypeList);
                $('#ddlOrderType option[value="0"]').val('ALL').text('All');

                $('#ddlOrderType').select2({
                    width: '-webkit-fill-available'
                });
            }
            if (response && response.ItemName && response.ItemName.length > 0 && $('#ddlItemName').length > 0) {
                var ItemNameList = [];
                for (var j = 0; j < response.ItemName.length; j++) {
                    var itemName = response.ItemName[j].ItemName;
                    ItemNameList.push({ Code: itemName, Desp: itemName });
                }

                BindSelectList1($('#ddlItemName')[0], ItemNameList);
                $('#ddlItemName option[value="0"]').val('ALL').text('All');

                $('#ddlItemName').select2({
                    width: '-webkit-fill-available'
                });
            }
            if (response && response.BuyerPONo && response.BuyerPONo.length > 0 && $('#ddlBuyerPONo').length > 0) {
                var BuyerPONoList = [];
                for (var j = 0; j < response.BuyerPONo.length; j++) {
                    var buyerPONo = response.BuyerPONo[j].BuyerPONo;
                    BuyerPONoList.push({ Code: buyerPONo, Desp: buyerPONo });
                }

                BindSelectList1($('#ddlBuyerPONo')[0], BuyerPONoList);
                $('#ddlBuyerPONo option[value="0"]').val('ALL').text('All');

                $('#ddlBuyerPONo').select2({
                    width: '-webkit-fill-available'
                });
            }
            if (response && response.OrderNo && response.OrderNo.length > 0 && $('#ddlOrderNo').length > 0) {
                var OrderNoList = [];
                for (var j = 0; j < response.OrderNo.length; j++) {
                    var orderNo = response.OrderNo[j].OrderNo;
                    OrderNoList.push({ Code: orderNo, Desp: orderNo });
                }

                BindSelectList1($('#ddlOrderNo')[0], OrderNoList);
                $('#ddlOrderNo option[value="0"]').val('ALL').text('All');

                $('#ddlOrderNo').select2({
                    width: '-webkit-fill-available'
                });
            }
        })
        .catch(function (error) {
            console.error('Error fetching data:', error);
            if ($('#ddlMarketingMan').length > 0) {
                $('#ddlMarketingMan').empty();
            }
            if ($('#ddlPartyName').length > 0) {
                $('#ddlPartyName').empty();
            }
        });
}
function GetBalancePOCancellationList() {
    var MarketingPersonName = $("#ddlMarketingMan").val();
    if (MarketingPersonName == null || MarketingPersonName === 'ALL') {
        MarketingPersonName = '';
    }

    var isPeriodWise = $("#chkPeriodWise").is(':checked');
        G_FromDateValue = $("#txtBalanceFromDate").val();
        G_ToDateValue = $("#txtBalanceToDate").val();
    

    var partyName = $("#ddlPartyName").val();
    if (partyName == null || partyName === 'ALL') {
        partyName = '';
    }
    var orderNo = $("#ddlOrderNo").val() || 'ALL';
    if (orderNo === 'ALL') {
        orderNo = '';
    }
    var orderType = $("#ddlOrderType").val() || 'ALL';
    if (orderType === 'ALL') {
        orderType = '';
    }
    var itemName = $("#ddlItemName").val() || 'ALL';
    if (itemName === 'ALL') {
        itemName = '';
    }
    var buyerPONo = $("#ddlBuyerPONo").val() || 'ALL';
    if (buyerPONo === 'ALL') {
        buyerPONo = '';
    }
    var balanceQtyUnit = $("#ddlBalanceQtyUnit").val() || '';
    var balanceQtyOperator = $("#ddlBalanceQtyOperator").val() || '';
    var balanceQtyFrom = $("#txtBalanceQtyFrom").val() || '0.000';
    var balanceQtyTo = $("#txtBalanceQtyTo").val() || '0.000';
    var dispatchQtyUnit = $("#ddlDispatchQtyUnit").val() || '';
    var dispatchQtyFrom = $("#txtDispatchQtyFrom").val() || '0.000';
    var dispatchQtyTo = $("#txtDispatchQtyTo").val() || '0.000';
    var dispatchQtyOperator = $("#ddlDispatchQtyOperator").val() || '';
   
    var periodWise = isPeriodWise ? 'Y' : 'N';
    
    Showloader();
    ClosePendingOrderService.GetCancelPendingOrderList(periodWise, G_FromDateValue, G_ToDateValue, MarketingPersonName, partyName, orderType, buyerPONo, itemName, orderNo).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#BalancePOCancellation').show();
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            var hiddenColumns = ["Code", "BuyerPODetail_Code", "BuyerPOMaster_Code"];
            
            var showOrderQty = $("#chkOrderQty").is(':checked');
            if (!showOrderQty) {
                var orderQtyColumns = ["Qty MT","Qty PC", "Qty MR"];
                hiddenColumns = hiddenColumns.concat(orderQtyColumns);
            }
            var showDispatchQty = $("#chkShowDispatchQty").is(':checked');
            if (!showDispatchQty) {
                var dispatchQtyColumns = ["Dis MT","Dis PC","Dis MR"];
                hiddenColumns = hiddenColumns.concat(dispatchQtyColumns);
            }
            var showDeliveryDetail = $("#DeliveryDetailCheck").is(':checked');
            if (!showDeliveryDetail) {
                var DeliveryDetailColumns = ["Consignee Address"];
                hiddenColumns = hiddenColumns.concat(DeliveryDetailColumns);
            } else {
                var ConsigneeNameColumns = ["Consignee Name"];
                hiddenColumns = hiddenColumns.concat(ConsigneeNameColumns);
            }
            
            var ColumnAlignment = {"Order Date": 'center'};
            
            if (response.length > 0) {
                var firstRow = response[0];
                var excludedColumns = ["Select", "Code", "BuyerPODetail_Code", "BuyerPOMaster_Code"];
                var numericColumnPatterns = ["Qty", "Dis", "Bal", "MT", "PC", "MR", "Thk", "Thickness"];
                
                for (var columnName in firstRow) {
                    if (excludedColumns.indexOf(columnName) === -1) {
                        var isNumericColumn = false;
                        var columnNameUpper = columnName.toUpperCase();
                        
                        for (var i = 0; i < numericColumnPatterns.length; i++) {
                            if (columnNameUpper.indexOf(numericColumnPatterns[i].toUpperCase()) !== -1) {
                                isNumericColumn = true;
                                break;
                            }
                        }
                        
                        if (!isNumericColumn) {
                            var hasNumericValue = false;
                            for (var j = 0; j < Math.min(5, response.length); j++) {
                                var value = response[j][columnName];
                                if (value !== null && value !== undefined && value !== '') {
                                    if (!isNaN(parseFloat(value)) && isFinite(value)) {
                                        hasNumericValue = true;
                                        break;
                                    }
                                }
                            }
                            if (hasNumericValue) {
                                isNumericColumn = true;
                            }
                        }
                        
                        if (isNumericColumn) {
                            ColumnAlignment[columnName] = 'right';
                        }
                    }
                }
            }
            
            response.forEach((item, index) => {
                item.Select = `<input type="checkbox" class="select-checkbox" data-index="${index}">`;
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BalancePOCancellation", "table-body-BalancePOCancellation", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        } else {
            HideLoader();
            $('#BalancePOCancellation').hide();
            toastr.error('No Data Found');
        }
        
    }).catch(function (error) {
        HideLoader();
        $('#BalancePOCancellation').hide();
        toastr.error('Error loading Balance PO Cancellation data');
    });
}
function BindSelectList1(element, list) {
    if (!element) {
        console.error('BindSelectList1: element is undefined');
        return;
    }
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function GetSelectedBalancePOCancellationRows() {
    var tableId = 'BalancePOCancellation';
    var selectedRows = [];

    try {
        var filteredData = window['filteredData_' + tableId] || [];
        var paginatorEnabled = window['Paginator_' + tableId];
        var currentPage = window['currentPage_' + tableId] || 1;
        var itemsPerPage = 10;

        if ($('#pageSize-' + tableId).length > 0) {
            var pageSizeValue = parseInt($('#pageSize-' + tableId).val());
            if (!isNaN(pageSizeValue) && pageSizeValue > 0) {
                itemsPerPage = pageSizeValue;
            }
        }

        $('#' + tableId + ' tbody tr').each(function () {
            var $row = $(this);
            var $checkbox = $row.find('input.select-checkbox');

            if ($checkbox.length > 0 && $checkbox.is(':checked')) {
                var rowIndex = parseInt($row.attr('data-index'));
                if (isNaN(rowIndex)) {
                    return;
                }

                var globalIndex = rowIndex;
                if (paginatorEnabled) {
                    globalIndex = (currentPage - 1) * itemsPerPage + rowIndex;
                }

                if (globalIndex >= 0 && globalIndex < filteredData.length) {
                    selectedRows.push(filteredData[globalIndex]);
                }
            }
        });
    } catch (e) {
        console.error('Error while getting selected rows:', e);
    }

    return selectedRows;
}

function SaveBalancePOCancellation() {
    var selectedRows = GetSelectedBalancePOCancellationRows();
    if (!selectedRows || selectedRows.length === 0) {
        toastr.error('Please select at least one order to cancel.');
        return;
    }
    if ($('#txtReason').length > 0) {
        var reason = $('#txtReason').val();
        if (reason == null || reason.trim() == '') {
            toastr.error('Reason is required.');
            $('#txtReason').focus();
            return;
        }
    }

    var reasonText = $('#txtReason').val();
    var details = [];

    function getColumnValue(row, patterns) {
        for (var key in row) {
            if (row.hasOwnProperty(key)) {
                var keyUpper = key.toUpperCase();
                for (var p = 0; p < patterns.length; p++) {
                    var patternUpper = patterns[p].toUpperCase();
                    if (keyUpper.indexOf(patternUpper) !== -1) {
                        var value = row[key];
                        if (value != null && value !== '') {
                            var numValue = parseFloat(value);
                            if (!isNaN(numValue) && isFinite(numValue)) {
                                return numValue;
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }

    function findColumnByName(row, columnName) {
        for (var key in row) {
            if (row.hasOwnProperty(key)) {
                if (key.toUpperCase() === columnName.toUpperCase()) {
                    var value = row[key];
                    if (value != null && value !== '') {
                        var numValue = parseFloat(value);
                        if (!isNaN(numValue) && isFinite(numValue)) {
                            return numValue;
                        }
                    }
                }
            }
        }
        return null;
    }

    function getDynamicQtyColumn(row, unitType) {
        var columnNames = [];
        for (var key in row) {
            if (row.hasOwnProperty(key)) {
                var keyUpper = key.toUpperCase();
                if (keyUpper.indexOf("QTY") !== -1 || keyUpper.indexOf("BAL") !== -1) {
                    columnNames.push(key);
                }
            }
        }

        var qtyMTColumn = null;
        var qtyPCColumn = null;
        var qtyMTRSColumn = null;

        for (var i = 0; i < columnNames.length; i++) {
            var colName = columnNames[i];
            var colNameUpper = colName.toUpperCase();
            
            if (colNameUpper.indexOf("MT") !== -1 && colNameUpper.indexOf("MTRS") === -1 && colNameUpper.indexOf("MTR") === -1) {
                if (qtyMTColumn == null) {
                    qtyMTColumn = colName;
                }
            } else if (colNameUpper.indexOf("PC") !== -1) {
                if (qtyPCColumn == null) {
                    qtyPCColumn = colName;
                }
            } else if (colNameUpper.indexOf("MTRS") !== -1 || colNameUpper.indexOf("MTR") !== -1 || colNameUpper.indexOf("MR") !== -1 || colNameUpper.indexOf("NOS") !== -1) {
                if (qtyMTRSColumn == null) {
                    qtyMTRSColumn = colName;
                }
            }
        }

        return {
            qtyMTColumn: qtyMTColumn,
            qtyPCColumn: qtyPCColumn,
            qtyMTRSColumn: qtyMTRSColumn
        };
    }

    for (var i = 0; i < selectedRows.length; i++) {
        var r = selectedRows[i] || {};

        var buyerPODetail_Code = 0;
        if (r.BuyerPODetail_Code != null && r.BuyerPODetail_Code !== '') {
            buyerPODetail_Code = parseInt(r.BuyerPODetail_Code) || 0;
        }

        var qtyMT = 0;
        var qtyPC = 0;
        var qtyMTRS = 0;

        var dynamicColumns = getDynamicQtyColumn(r);

        if (r.qtyMT != null && r.qtyMT !== '') {
            qtyMT = parseFloat(r.qtyMT) || 0;
        } else if (r.QtyMT != null && r.QtyMT !== '') {
            qtyMT = parseFloat(r.QtyMT) || 0;
        } else if (dynamicColumns.qtyMTColumn != null) {
            var mtValue = findColumnByName(r, dynamicColumns.qtyMTColumn);
            if (mtValue != null) {
                qtyMT = mtValue;
            } else {
                qtyMT = getColumnValue(r, ["Qty MT", "QtyMT", "qtyMT"]);
            }
        } else {
            qtyMT = getColumnValue(r, ["Qty MT", "QtyMT", "qtyMT"]);
        }

        if (r.qtyPC != null && r.qtyPC !== '') {
            qtyPC = parseFloat(r.qtyPC) || 0;
        } else if (r.QtyPC != null && r.QtyPC !== '') {
            qtyPC = parseFloat(r.QtyPC) || 0;
        } else if (dynamicColumns.qtyPCColumn != null) {
            var pcValue = findColumnByName(r, dynamicColumns.qtyPCColumn);
            if (pcValue != null) {
                qtyPC = pcValue;
            } else {
                var qtyPCValue = getColumnValue(r, ["Qty PC", "QtyPC", "qtyPC"]);
                if (qtyPCValue === 0) {
                    qtyPCValue = getColumnValue(r, ["Bal PC", "BalPC", "balPC"]);
                }
                qtyPC = qtyPCValue;
            }
        } else {
            var qtyPCValue = getColumnValue(r, ["Qty PC", "QtyPC", "qtyPC"]);
            if (qtyPCValue === 0) {
                qtyPCValue = getColumnValue(r, ["Bal PC", "BalPC", "balPC"]);
            }
            qtyPC = qtyPCValue;
        }

        if (r.qtyMTRS != null && r.qtyMTRS !== '') {
            qtyMTRS = parseFloat(r.qtyMTRS) || 0;
        } else if (r.QtyMTRS != null && r.QtyMTRS !== '') {
            qtyMTRS = parseFloat(r.QtyMTRS) || 0;
        } else if (dynamicColumns.qtyMTRSColumn != null) {
            var mtrsValue = findColumnByName(r, dynamicColumns.qtyMTRSColumn);
            if (mtrsValue != null) {
                qtyMTRS = mtrsValue;
            } else {
                qtyMTRS = getColumnValue(r, ["Qty MTRS", "Qty MTR", "QtyMTRS", "qtyMTRS", "Qty MR", "Qty NOS"]);
            }
        } else {
            qtyMTRS = getColumnValue(r, ["Qty MTRS", "Qty MTR", "QtyMTRS", "qtyMTRS", "Qty MR", "Qty NOS"]);
        }

        details.push({
            buyerPODetail_Code: buyerPODetail_Code,
            qtyMT: qtyMT,
            qtyPC: qtyPC,
            qtyMTRS: qtyMTRS,
            remark: reasonText
        });
    }

    Showloader();
    ClosePendingOrderService.SaveCancelPendingOrder(details).then(function (response) {
        HideLoader();
        var responseObj = null;
        
        if (response) {
            if (Array.isArray(response) && response.length > 0) {
                responseObj = response[0];
            } else if (typeof response === 'object' && response.Status) {
                responseObj = response;
            }
        }
        
        if (responseObj && responseObj.Status === 'Y') {
            toastr.success(responseObj.Msg || 'Record saved successfully.');
            GetBalancePOCancellationList();
            $('#txtReason').val('');
        } else if (responseObj) {
            toastr.error(responseObj.Msg || 'Error while saving record.');
        } else {
            toastr.error('Error while saving record.');
        }
    }).catch(function (error) {
        HideLoader();
        if (error && error.Msg) {
            toastr.error(error.Msg);
        } else {
            toastr.error('Error while saving record.');
        }
    });
}

window.GetBalancePOCancellationList = GetBalancePOCancellationList;
