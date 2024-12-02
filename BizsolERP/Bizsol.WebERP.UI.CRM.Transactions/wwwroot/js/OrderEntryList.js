import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Order Entry List");
    GetOrderStatusList();
    GetUserNameList();
    highlightSelectedDates();

    const order = {
        VisitMaster_Code: '',
        Code: '',
        ButtonStatus: 'UnVerified'
    };
    manageEditButton(order);
    $('#editButton').on('click', function () {
        openEditVisitMaster(order.VisitMaster_Code, order.Code);
    });

    $('#btnShow').on('click', function () {
        var FromDate = $('#txtFromDate').val();
        var ToDate = $('#txtToDate').val();
        var UserName = $('#ddlUserName').val();
        var OrderStatus = $('#ddlOrderStatus').val();
        if (typeof $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null) {
            $('#txtFromDate').focus();
        }
        if (typeof $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null) {
            $('#txtToDate').focus();
        }
        if ($('#ddlUserName').val() === '') {
            $('#ddlUserName').focus();
        }
        if ($('#ddlOrderStatus').val() === '') {
            $('#ddlOrderStatus').focus();
        }
        else {
            GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus);
        }
    });
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlUserName").focus();
        }
    });
    $('#ddlUserName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlOrderStatus").focus();
        }
    });
    $('#ddlOrderStatus').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
});
function manageEditButton(order) {
    const isEnabled = order.ButtonStatus === 'UnVerified';
    $('#editButton').prop('disabled', !isEnabled);

}
function setupDateInputFormatting() {
    $('#txtFromDate').on('input', function () {
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
            $('#txtFromDate').val('');

        }
    } else {
        $('#txtFromDate').val('');

    }
}
function highlightSelectedDates() {
    var highlightedDates = {};
    var selectedDates = ['01/10/2024', '05/10/2024', '11/11/2024'];
    selectedDates.forEach(date => {
        var parts = date.split('/');
        var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]).toDateString();
        highlightedDates[formattedDate] = true;
    });

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtFromDate, #txtToDate').val(`${ day }/${ month }/${ year }`);
    $('#txtFromDate,#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        beforeShowDay: function (date) {
            const formattedDate = date.toDateString();
            if (highlightedDates[formattedDate]) {
                return { classes: 'highlighted-date', tooltip: 'Data Available' };
            }
            return { classes: '', tooltip: '' };
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day} - ${monthAbbreviation} - ${year}`;
}

function GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus) {
    OrderEntryListService.GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = ["Verified By", "Visit Type", "City Name", "State Name", "Remarks", "Dealer Name", "IsVerify"];
            const numericFilterColumn = ["Total Order Qty MR", "Basic Rate", "Final Amount", "Final Rate"];
            const dateFilterColumn = ["Date", "Verified On"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "VisitMaster_Code", "CheckIn", "UserName", "Verified", "Closed", "OtherCharges", "ButtonStatus", "EditAllow", "DeleteAllow", "RejectedBy", "RejectedOn", "Reason", "VerifiedOn", "Order Type", "Total Amount", "Total Order Qty","Total Order Qty PC"];
            const ColumnAlignment = {
                "Basic Rate": 'right',
                "Total Order Qty MR": 'right',
                "Final Amount": 'right',
                "Final Rate": 'right',
                "Date": 'center',
                "Verified": 'center',
                "Closed": 'center',
            };
            const updatedResponse = response.map(item =>
            {
                let buttonsHTML = `<button class="btn btn-primary icon-height" title="Edit" ${item.ButtonStatus !== 'UnVerified' ? 'disabled' : ''} onclick="openEditVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-solid fa-pencil"></i></button>
        <button class="btn btn-info icon-height" title="View" onclick="openViewVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-regular fa-eye"></i></button>
        <button class="btn btn-danger icon-height" title="Delete" 
                ${item.ButtonStatus !== 'UnVerified' ? 'disabled' : ''} onclick="Delete('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>
        <button class="btn btn-success icon-height" title="Verified" onclick="Verify('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            //const updatedResponse = response.map(item => ({
            //    ...item,

            //    Action: `<button class="btn btn-primary icon-height" title="Edit" [disabled]="order.ButtonStatus !== 'UnVerified'" onclick="openEditVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-solid fa-pencil"></i></button>
            //    <button class="btn btn-info icon-height" title="View" onclick="openViewVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-regular fa-eye"></i></button>
            //    <button class="btn btn-danger icon-height" title="Delete" [disabled]="order.ButtonStatus !== 'UnVerified'" onclick="Delete('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>
            //    <button class="btn btn-success icon-height" title="Verified" onclick="Verify('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>`

            });

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error('No Data Found');
        }
    }).catch(error => {
        toastr.error(error.Msg);
    });
}
function GetOrderStatusList() {
    OrderEntryListService.GetOrderStatusList().then(function (response) {
        if (response && response.length > 0) {
            const datalist = $('#ddlOrderStatusList');
            datalist.empty();

            response.forEach(function (item) {
                const option = $('<option>').val(item.VerifyStatus);
                datalist.append(option);
            });
        } else {
            console.error('No data received or empty response');
        }
    }).catch(function (error) {
        console.error('Error fetching order status list:', error);
    });
}
function GetUserNameList() {
    OrderEntryListService.GetUserNameList().then(function (result) {
        if (result && result.length > 0) {
            const datalist = $('#ddlUserNameList');
            datalist.empty();

            result.forEach(function (item) {
                const option = $('<option>').val(item.UserName);
                datalist.append(option);
            });
        } else {
            console.error('No data received or empty response');
        }
    }).catch(function (error) {
        console.error('Error fetching order status list:', error);
    });
}
function openEditVisitMaster(VisitMaster_Code, Code) {
    const visitMasterCode = window.btoa(VisitMaster_Code);
    const routePlanMasterCode = window.btoa(Code);
    window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?VisitMaster_Code=" + visitMasterCode + "&Code=" + routePlanMasterCode + "&EditMode=Edit";
}
function openViewVisitMaster(VisitMaster_Code, Code) {
    const visitMasterCode = window.btoa(VisitMaster_Code);
    const routePlanMasterCode = window.btoa(Code);
    window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?VisitMaster_Code=" + visitMasterCode + "&Code=" + routePlanMasterCode + "&readOnly=View";
}
function encodeHash(value) {
    return btoa(value); 
}
function Delete(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static', 
    });
    $("#txtcode").val(Code);
}
function DeleteModal() {
    var reason = $("#deleteReason").val();
    var code = $("#txtcode").val();
    if (reason == "") {
        alert('Please enter a reason before proceeding.');
        toastr.error(response.Msg);
        return;
    }
    OrderEntryListService.DeleteVisit(code, reason).then(function (response) {
            if (response.Msg) {
                toastr.success(response.Msg);
                $('#deleteReason').val('');
                $('#txtCode').val('');
                var FromDate = $('#txtFromDate').val();
                var ToDate = $('#txtToDate').val();
                var UserName = $('#ddlUserName').val();
                var OrderStatus = $('#ddlOrderStatus').val();
                GetUserWiseRoutePlanDetails(FromDate, ToDate, UserName, OrderStatus);
                $('#myModal').modal('hide');
            } else {
                toastr.error('An error occurred. Please try again.');
            }
        })
        .catch(function (error) {
            toastr.error('An unexpected error occurred.');
            console.error(error);
        });
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function isViewButtonEnabled(order) {
    return order.ButtonStatus !== 'Verified';
}
function GetFixedParameterConfiguration() {
    OrderEntryListService.GetFixedParameterConfiguration().then(function () {

    });
}
window.validateDate = validateDate;
window.highlightSelectedDates = highlightSelectedDates;
window.GetRouteDataFromOrderEntry = GetRouteDataFromOrderEntry;
window.GetOrderStatusList = GetOrderStatusList;
window.GetUserNameList = GetUserNameList;
window.openEditVisitMaster = openEditVisitMaster;
window.openViewVisitMaster = openViewVisitMaster;
window.Delete = Delete;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;