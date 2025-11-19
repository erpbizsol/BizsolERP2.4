import { PendingOrderService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PendingOrderService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
var arrayList_MarketingMan = [];
$(document).ready(function () {
    $("#ERPHeading").text("Pending Order");
    GetCRMFixedParameterConfig();
    DatePicker();
    $("#tblPendingOrderList").hide();
    $('#btnDownload').click(function () {
        ExportMultipleTables();
    });
    $('#btnShow').on('click', function () {
        GetPendingOrderList();
    });
});

function GetCRMFixedParameterConfig() {

    PendingOrderService.GetCRMOrderEntryConfig().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('CRMOrderEntryConfig', JSON.stringify(response[0]));
            PendingOrderService.GetFixedParameterQtyConfig().then(function (response) {
                if (response.length > 0) {
                    sessionStorage.setItem('QtyConfig', JSON.stringify(response[0]));
                    GetNestedMarketingManList();
                }
            });
        }
    });
}

function BindSelect2FromDataList(element, arrayList, FirstItem, ddlwidth) {
    element.empty();

    if (FirstItem == 'FirstItemAll') {

        element.append(new Option("All", "All"));
    } else if (FirstItem == 'FirstItemZero') {

        element.append(new Option("", "0"));
    } else {

    }


    // Get the options from the datalist and append them to Select2
    $.each(arrayList, function (index, item) {
        // Append new option elements (key as value and value as text)
        element.append(new Option(item.value, item.key));
    });

    // Trigger a change event to update Select2 UI
    // element.trigger('change');

    element.select2({
        //// allowClear: true,
        width: 'resolve',
        matcher: function (params, data) {
            // If there's no search term, return all data
            if ($.trim(params.term) === '') {
                return data;
            }

            // Match items that start with the search term
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                return data;
            }

            // Return null if no match
            return null;
        }
    });
}


function GetNestedMarketingManList() {
    PendingOrderService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {

            var arrayList_MarketingMan = [];
            response = response.map((item) => ({
                key: item.Code, value: item.PersonName
            }));
            arrayList_MarketingMan = response;

            BindSelect2FromDataList($('#ddlSalesPersonList'), arrayList_MarketingMan, "FirstItemAll", "100%");
            GetPendingOrderList();
        }
    });
}

function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtFromDate, #txtToDate').val(`${day}/${month}/${year}`);
    $('#txtFromDate, #txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}
function setupDateInputFormatting() {
    $('#txtToDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDateFrom(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDateFrom(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtFromDate').val('');

        }
    } else {
        $('#txtFromDate').val('');

    }
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtToDate').val('');

        }
    } else {
        $('#txtToDate').val('');

    }
}

function SetGridWidth(TemplateName) {
    var $table = $('#PendingOrderList');
    var colCount = $table.find('thead tr th').length;

    // Set base width per column (e.g., 150px)
    var widthPerColumn = 150; // You can adjust this

    // Calculate total width
    var totalWidth = colCount * widthPerColumn;

    // Apply to table
    if (TemplateName == 'DETAIL_VIEW') {
        $table.css('width', totalWidth + 'px !important');
    }
    
}
function GetPendingOrderList() {
    var SalesPersonName = $('#ddlSalesPersonList option:selected').text();
    var TemplateName = $('#listTemplate option:selected').val();
    var FromDate = $('#txtFromDate').val() == '' ? '' : convertDateFormat($('#txtFromDate').val());
    var ToDate = $('#txtToDate').val() == '' ? '' : convertDateFormat($('#txtToDate').val());

    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

   // S.No	Booking No	Party Name	Order Date	Delivery Date	Payment Term	Item Desp	Size	BalQtyMT	BalQtyPC	BalQtyMTRS	Discount Type	Discount	Rate	Remark
    PendingOrderService.GetPendingOrderSummary(FromDate, ToDate, SalesPersonName, TemplateName,'').then(function (response) {
        if (response.PendingOrder && Array.isArray(response.PendingOrder) && response.PendingOrder.length > 0) {
            $("#tblPendingOrderList").show();
            const stringFilterColumn = ["Booking No", "Party Name", "Payment Term", "Item Desp", "Size"];
            const numericFilterColumn = ["BalQtyMT", "BalQtyPC", "BalQtyMTRS","Discount"];
            const dateFilterColumn = ["Order Date","Delivery Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "BalQtyMT": 'right',
                "BalQtyPC": 'right',
                "BalQtyMTRS": 'right',
                "Order Date": 'center',
                "Delivery Date": 'center',
                "Discount": 'right',
                "Rate": 'right',
                
            };
            if (QtyMTRHeader !== '') {
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BalQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMTRS') {
                                reorderedItem['Pending Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                   
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BookedQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BookedQtyMTRS') {
                                reorderedItem['Order Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('DispatchQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyMTRS') {
                                reorderedItem['Dispatch Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('CancelQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'CancelQtyMTRS') {
                                reorderedItem['Cancelled Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push('Pending Qty ' + QtyMTRHeader);
                numericFilterColumn.push('Order Qty ' + QtyMTRHeader);
                numericFilterColumn.push('Dispatch Qty ' + QtyMTRHeader);
                numericFilterColumn.push('Cancelled Qty ' + QtyMTRHeader);
            } else {
                hiddenColumns.push('Pending Qty ' + QtyMTRHeader);
                hiddenColumns.push('Order Qty ' + QtyMTRHeader);
                hiddenColumns.push('Dispatch Qty ' + QtyMTRHeader);
                hiddenColumns.push('Cancelled Qty ' + QtyMTRHeader);
            }
            if (QtyMTHeader !== '') {
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BalQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMT') {
                                reorderedItem['Pending Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BookedQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BookedQtyMT') {
                                reorderedItem['Order Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('DispatchQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyMT') {
                                reorderedItem['Dispatch Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('CancelQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'CancelQtyMT') {
                                reorderedItem['Cancelled Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push('Pending Qty ' + QtyMTHeader);
                numericFilterColumn.push('Order Qty ' + QtyMTHeader);
                numericFilterColumn.push('Dispatch Qty ' + QtyMTHeader);
                numericFilterColumn.push('Cancelled Qty ' + QtyMTHeader);
            } else {
                hiddenColumns.push('Pending Qty ' + QtyMTHeader);
                hiddenColumns.push('Order Qty ' + QtyMTHeader);
                hiddenColumns.push('Dispatch Qty ' + QtyMTHeader);
                hiddenColumns.push('Cancelled Qty ' + QtyMTHeader);
            }
            if (QtyPCHeader !== '') {
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BalQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyPC') {
                                reorderedItem['Pending Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('BookedQtyPc')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BookedQtyPc') {
                                reorderedItem['Order Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('DispatchQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyPC') {
                                reorderedItem['Dispatch Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response.PendingOrder = response.PendingOrder.map(item => {
                    if (item.hasOwnProperty('CancelQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'CancelQtyPC') {
                                reorderedItem['Cancelled Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push('Pending Qty ' + QtyPCHeader);
                numericFilterColumn.push('Order Qty ' + QtyPCHeader);
                numericFilterColumn.push('Dispatch Qty ' + QtyPCHeader);
                numericFilterColumn.push('Cancelled Qty ' + QtyPCHeader);
            } else {
                hiddenColumns.push('Pending Qty ' + QtyPCHeader);
                hiddenColumns.push('Order Qty ' + QtyPCHeader);
                hiddenColumns.push('Dispatch Qty ' + QtyPCHeader);
                hiddenColumns.push('Cancelled Qty ' + QtyPCHeader);
            }
     

            ColumnAlignment['Pending Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyPCHeader] = 'right';
            ColumnAlignment['Order Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Order Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Order Qty ' + QtyPCHeader] = 'right';
            ColumnAlignment['Dispatch Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Dispatch Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Dispatch Qty ' + QtyPCHeader] = 'right';
            ColumnAlignment['Cancelled Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Cancelled Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Cancelled Qty ' + QtyPCHeader] = 'right';

            BizsolCustomFilterGrid.CreateDataTable("PendingOrderList-header", "PendingOrderList-body", response.PendingOrder, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
      
            PopulateTableForPrint(response.PendingOrder);
            SetGridWidth(TemplateName);
        }
        else {
            //toastr.error('No Data Found');
            $("#tblPendingOrderList").hide();
        }
        if (response.PendingOrderSalesPersonWise && Array.isArray(response.PendingOrderSalesPersonWise) && response.PendingOrderSalesPersonWise.length > 0) {
            $("#tblSalesManSummary").show();
            const stringFilterColumn = ["SalesPerson"];
            const numericFilterColumn = ["BalQtyMT", "BalQtyPC", "BalQtyMTRS"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "BalQtyMT": 'right',
                "BalQtyPC": 'right',
                "BalQtyMTRS": 'right',
               
            };
            if (QtyMTRHeader !== '') {
                response.PendingOrderSalesPersonWise = response.PendingOrderSalesPersonWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMTRS') {
                                reorderedItem['Pending Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTRHeader);
            } else {
                hiddenColumns.push("BalQtyMTRS");
            }
            if (QtyMTHeader !== '') {
                response.PendingOrderSalesPersonWise = response.PendingOrderSalesPersonWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMT') {
                                reorderedItem['Pending Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTHeader);
            } else {
                hiddenColumns.push("BalQtyMT");
            }
            if (QtyPCHeader !== '') {
                response.PendingOrderSalesPersonWise = response.PendingOrderSalesPersonWise.map(item => {
                    if (item.hasOwnProperty('BalQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyPC') {
                                reorderedItem['Pending Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyPCHeader);
            } else {
                hiddenColumns.push("BalQtyPC");
            }


            ColumnAlignment['Pending Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyPCHeader] = 'right';
            BizsolCustomFilterGrid.CreateDataTable("SalesManSummary-header", "SalesManSummary-body", response.PendingOrderSalesPersonWise, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
            PopulateTableForPrintSubReport1(response.PendingOrderSalesPersonWise);
        }
        else {
            //toastr.error('No Data Found');
            $("#tblSalesManSummary").hide();
        }
        if (response.PendingOrderZoneWise && Array.isArray(response.PendingOrderZoneWise) && response.PendingOrderZoneWise.length > 0) {
            $("#tblZoneWiseSummary").show();
            const stringFilterColumn = ["ZoneName"];
            const numericFilterColumn = ["BalQtyMT", "BalQtyPC", "BalQtyMTRS"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "BalQtyMT": 'right',
                "BalQtyPC": 'right',
                "BalQtyMTRS": 'right',

            };
            if (QtyMTRHeader !== '') {
                response.PendingOrderZoneWise = response.PendingOrderZoneWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMTRS') {
                                reorderedItem['Pending Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTRHeader);
            } else {
                hiddenColumns.push("BalQtyMTRS");
            }
            if (QtyMTHeader !== '') {
                response.PendingOrderZoneWise = response.PendingOrderZoneWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMT') {
                                reorderedItem['Pending Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTHeader);
            } else {
                hiddenColumns.push("BalQtyMT");
            }
            if (QtyPCHeader !== '') {
                response.PendingOrderZoneWise = response.PendingOrderZoneWise.map(item => {
                    if (item.hasOwnProperty('BalQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyPC') {
                                reorderedItem['Pending Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyPCHeader);
            } else {
                hiddenColumns.push("BalQtyPC");
            }


            ColumnAlignment['Pending Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyPCHeader] = 'right';
            BizsolCustomFilterGrid.CreateDataTable("ZoneWiseSummary-header", "ZoneWiseSummary-body", response.PendingOrderZoneWise, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
            PopulateTableForPrintSubReport2(response.PendingOrderZoneWise);
        }
        else {
            //toastr.error('No Data Found');
            $("#tblZoneWiseSummary").hide();
        }
        if (response.PendingOrderItemWise && Array.isArray(response.PendingOrderItemWise) && response.PendingOrderItemWise.length > 0) {
            $("#tblItemWiseSummary").show();
            const stringFilterColumn = ["ItemName"];
            const numericFilterColumn = ["BalQtyMT", "BalQtyPC", "BalQtyMTRS"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "BalQtyMT": 'right',
                "BalQtyPC": 'right',
                "BalQtyMTRS": 'right',

            };
            if (QtyMTRHeader !== '') {
                response.PendingOrderItemWise = response.PendingOrderItemWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMTRS') {
                                reorderedItem['Pending Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTRHeader);
            } else {
                hiddenColumns.push("BalQtyMTRS");
            }
            if (QtyMTHeader !== '') {
                response.PendingOrderItemWise = response.PendingOrderItemWise.map(item => {
                    if (item.hasOwnProperty('BalQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMT') {
                                reorderedItem['Pending Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTHeader);
            } else {
                hiddenColumns.push("BalQtyMT");
            }
            if (QtyPCHeader !== '') {
                response.PendingOrderItemWise = response.PendingOrderItemWise.map(item => {
                    if (item.hasOwnProperty('BalQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyPC') {
                                reorderedItem['Pending Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyPCHeader);
            } else {
                hiddenColumns.push("BalQtyPC");
            }


            ColumnAlignment['Pending Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Pending Qty ' + QtyPCHeader] = 'right';
            BizsolCustomFilterGrid.CreateDataTable("ItemWiseSummary-header", "ItemWiseSummary-body", response.PendingOrderItemWise, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
            PopulateTableForPrintSubReport3(response.PendingOrderItemWise);
        }
        else {
            //toastr.error('No Data Found');
            $("#tblItemWiseSummary").hide();
        }
    }).catch(error => {
        toastr.error(error.Msg);
       // $("#tblPendingOrderList").hide();
    });
}
function PopulateTableForPrint(data) {
    let tableBody = document.querySelector('#tblReport tbody');
    let tableHeader = document.querySelector('#tblReport thead tr');

    $('#tblReport  thead tr').empty();
    $('#tblReport tbody').empty();

    // Get the keys from the first object to generate the header dynamically
    let headers = Object.keys(data[0]);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        let row = document.createElement('tr');

        headers.forEach(header => {
            let td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function PopulateTableForPrintSubReport1(data) {
    let tableBody = document.querySelector('#tblSubReport1 tbody');
    let tableHeader = document.querySelector('#tblSubReport1 thead tr');

    $('#tblSubReport1  thead tr').empty();
    $('#tblSubReport1 tbody').empty();

    // Get the keys from the first object to generate the header dynamically
    let headers = Object.keys(data[0]);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblSubReport1 th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        let row = document.createElement('tr');

        headers.forEach(header => {
            let td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function PopulateTableForPrintSubReport2(data) {
    let tableBody = document.querySelector('#tblSubReport2 tbody');
    let tableHeader = document.querySelector('#tblSubReport2 thead tr');

    $('#tblSubReport2  thead tr').empty();
    $('#tblSubReport2 tbody').empty();

    // Get the keys from the first object to generate the header dynamically
    let headers = Object.keys(data[0]);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblSubReport2 th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        let row = document.createElement('tr');

        headers.forEach(header => {
            let td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function PopulateTableForPrintSubReport3(data) {
    let tableBody = document.querySelector('#tblSubReport3 tbody');
    let tableHeader = document.querySelector('#tblSubReport3 thead tr');

    $('#tblSubReport3  thead tr').empty();
    $('#tblSubReport3 tbody').empty();

    // Get the keys from the first object to generate the header dynamically
    let headers = Object.keys(data[0]);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblSubReport3 th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        let row = document.createElement('tr');

        headers.forEach(header => {
            let td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    var ReportType = "PendingOrder";
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReport").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });
}
function ExportMultipleTables() {
    var wb = XLSX.utils.book_new();
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    // Convert each table to a worksheet
    var ws1 = XLSX.utils.table_to_sheet(document.getElementById('tblReport'));
    var ws2 = XLSX.utils.table_to_sheet(document.getElementById('tblSubReport1'));
    var ws3 = XLSX.utils.table_to_sheet(document.getElementById('tblSubReport2'));
    var ws4 = XLSX.utils.table_to_sheet(document.getElementById('tblSubReport3'));

    // Append each sheet to the workbook with a name
    XLSX.utils.book_append_sheet(wb, ws1, "Pending Order");
    XLSX.utils.book_append_sheet(wb, ws2, "Sales Person Wise");
    XLSX.utils.book_append_sheet(wb, ws3, "Zone Wise");
    XLSX.utils.book_append_sheet(wb, ws4, "Item Wise");

    // Write the file and trigger download
    XLSX.writeFile(wb, "PendingOrder_" + dateString+".xlsx");
}
window.Export = Export;
window.GetPendingOrderList = GetPendingOrderList;
window.ExportMultipleTables = ExportMultipleTables;;