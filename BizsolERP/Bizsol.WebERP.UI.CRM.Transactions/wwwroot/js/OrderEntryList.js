import { OrderEntryListService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Order Entry List");
    GetOrderStatusList();
    GetUserNameList();

    highlightSelectedDates();
});
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

function GetRouteDataFromOrderEntry() {
    let FromDate = convertDateFormat($('#txtFromDate').val());
    let ToDate = convertDateFormat($('#txtToDate').val());
    let UserName = $('#ddlUserName').val();
    let OrderStatus = $('#ddlOrderStatus').val();
    OrderEntryListService.GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus).then(function (response) {

        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = ["UserName", "VisitType", "CityName", "StateName", "Description", "AccountDesp", "IsVerify"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];

            const updatedResponse = response.map(item => ({
                ...item,
                Action: `<button class="btn btn-success btn-sm" title="Edit" onclick="Edit('${item.Code}')">Edit</button>
                <button class="btn btn-info btn-sm" title="View" onclick="View('${item.Code}')">View</button>
                <button class="btn btn-success btn-sm" title="Delete" onclick="Delete('${item.Code}')">Delete</button>
                <button class="btn btn-info btn-sm" title="Verified" onclick="Verify('${item.Code}')">Verified</button>`

            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);
        } else {
            console.error("No valid data found:", response);
            alert("No data available.");
        }
    }).catch(error => {
        console.error("Error in fetching data:", error);
        alert("Failed to load data.");
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

window.validateDate = validateDate;
window.highlightSelectedDates = highlightSelectedDates;
window.GetRouteDataFromOrderEntry = GetRouteDataFromOrderEntry;
window.GetOrderStatusList = GetOrderStatusList;
window.GetUserNameList=GetUserNameList;

