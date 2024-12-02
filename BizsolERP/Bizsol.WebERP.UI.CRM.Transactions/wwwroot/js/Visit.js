//import { VisitOrderEntryService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
let selectedDates = [];
var baseUrl = `${window.location.protocol}//${window.location.host}`;
$(document).ready(function () {
    $("#ERPHeading").text("Visit");
    GetNestedMarketingManList();
    setupDateInputFormatting();
    GetVisitMasterListForDate();
    GetActualLocation();
    $('#btnShow').on('click', function () {
        var FromDate = $('#txtFromDate').val();
        var ToDate = $('#txtToDate').val();
        var SalesPerson = $('#ddlSalesPerson').val();
        if (typeof $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null) {
            $('#txtFromDate').focus();
        }
        if (typeof $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null) {
            $('#txtToDate').focus();
        }
        if ($('#ddlSalesPerson').val() === '') {
            $('#ddlSalesPerson').focus();
        }
        else {
            GetVisitMasterList(FromDate, ToDate, SalesPerson);
        }
    });
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlSalesPerson").focus();
        }
    });
    $('#ddlSalesPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
    
});
function GetNestedMarketingManList() {
    VisitOrderEntryService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {
            $('#ddlSalesPersonList option').remove();

            var option = '<option text="0" value="All" selected >All</option>';

            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].PersonName + '" >' + response[i].PersonName + '</option>';
            }

            $('#ddlSalesPersonList')[0].innerHTML = option;
        } else {
            $('#ErrorMsg').removeClass('invisible');
            $('#ErrorMsg').addClass('visible');
            return false;
        }
    });
}
const getButtonHTML = (label = "", className = "", onClick = "", icon, tooltip, disabled = false) => `
    <button class="${className} icon-height" onclick="${onClick}" data-toggle="tooltip" data-placement="top" title="${tooltip}" ${disabled ? 'disabled' : ''}>
        <i class="${icon}" style="color:white;"></i> ${label}
    </button>
`;

const getButtonSet = (status, Code,date, VisitMaster_Code, Verified, Closed, CheckOut) => {
    let buttons = "";
    if (VisitMaster_Code > 0) {
        if (Verified === "Y" && Closed !== "Y") {
            if (CheckOut === "--:--") {
                buttons += getButtonHTML("", "btn btn-success btn-height", "", "fa-solid fa-sign-out", "Checked-in", true, "Already checked in");
                buttons += getButtonHTML("", "btn btn-primary icon-height", `EditData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-pencil", "Edit");
                buttons += getButtonHTML("", "btn btn-primary icon-height", `ViewData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-eye", "View");
            } else {
                buttons += getButtonHTML("", "btn btn-danger btn-height", "", "fa-solid fa-sign-out", "Checked Out", true, "Already checked out");
                buttons += getButtonHTML("", "btn btn-primary icon-height", `EditData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-pencil", "Edit", true, "Edit");
                buttons += getButtonHTML("", "btn btn-primary icon-height", `ViewData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-eye", "View");
            }
        } else if (Closed === "Y") {
            buttons += getButtonHTML("Closed", "btn btn-primary btn-height", "", "", "Closed", true, "Cannot modify closed records");
        } else {
            buttons += getButtonHTML("Verify", "btn btn-primary btn-height", `Verify(${Code}, ${VisitMaster_Code})`, "", "Verify");
        }
    } else {
        if (Closed === 'Y') {
            buttons += getButtonHTML("", "btn btn-primary icon-height", `IsCheckIn(${Code}, this)`, "fa-solid fa-sign-in", true, "Check-In");
            buttons += getButtonHTML("", "btn btn-danger icon-height", "", "fa-solid fa-pencil", "Edit", true, "Edit disabled for unregistered visits");
            buttons += getButtonHTML("", "btn btn-danger icon-height", "", "fa-solid fa-eye", "View", true, "View disabled for unregistered visits");
        } else {
            buttons += getButtonHTML("", "btn btn-primary icon-height", `IsCheckIn(${Code}, '${date}')`, "fa-solid fa-sign-in", "Check-In");
            buttons += getButtonHTML("", "btn btn-danger icon-height", "", "fa-solid fa-pencil", "Edit", true, "Edit disabled for unregistered visits");
            buttons += getButtonHTML("", "btn btn-danger icon-height", "", "fa-solid fa-eye", "View", true, "View disabled for unregistered visits");
        }
        

    }
    return buttons;
};
function GetVisitMasterList(FromDate, ToDate, SalesPerson) {
    var fromDate = convertDateFormat(FromDate);
    var toDate = convertDateFormat(ToDate);
    VisitOrderEntryService.GetVisitMasterList(fromDate, toDate, SalesPerson).then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Created By", "Visit Type", ];
            const NumericFilterColumn = ["Total Amount","Total Order Qty"];
            const DateFilterColumn = ["Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = ["Dealer Name", "City","State"];
            const hiddenColumns = ["Code", "VisitMaster_Code", "ButtonStatus", "Verified", "Closed", "CheckIn", "CheckOut"];
            const ColumnAlignment = { 
                "Total Amount": 'right',
                "Total Order Qty": 'right',
                "Date" : 'center',
                "Verified" : 'center',
                "Closed": 'center',
            };
            const updatedResponse = response.map(item => {
                const buttonsHTML = getButtonSet(item.Status, item.Code, item.Date, item.VisitMaster_Code, item.Verified, item.Closed, item.CheckOut);
                let statusButtonHTML;
                if (item.Status === 'Closed') {
                    statusButtonHTML = `<button class="btn btn-danger waves-effect waves-light btn-sm btn-height" style="cursor: not-allowed">${item.Status}</button>`;
                } else if  (item.Status === 'Checked Out') {
                    statusButtonHTML = `<button class="btn btn-danger waves-effect waves-light btn-sm btn-height disabled" style="cursor: not-allowed">${item.Status}</button>`;
                }
                else {
                        statusButtonHTML = item.Status === "Not Visited"
                            ? `<button class="btn btn-primary waves-effect waves-light btn-sm btn-height" onclick="IsNotVisited('${item.Code}')">Not-Visited</button>`
                            : `<button class="btn btn-success waves-effect waves-light btn-sm btn-height" style="cursor: not-allowed">${item.Status}</button>`;
                }

                return {
                    ...item,
                    Action: buttonsHTML,
                    Status: statusButtonHTML
                };
                }); 

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
           
        }
        else {
            toastr.error('No Data Found')
        }
    });
}
function GetVisitMasterListForDate() {
    VisitOrderEntryService.GetRoutePlanList().then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.Date) {
                    selectedDates.push(item.Date);
                }
            });
            highlightSelectedDates();
        }
        else {
            toastr.error('No Data Found')
        }
    });

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
         selectedDates.forEach(date => {
             var parts = date.split('/');
             var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]).toDateString();
             highlightedDates[formattedDate] = true;
         });

         var today = new Date();
         var day = ('0' + today.getDate()).slice(-2);  
         var month = ('0' + (today.getMonth() + 1)).slice(-2);  
         var year = today.getFullYear(); 

         $('#txtFromDate, #txtToDate').val(`${day}/${month}/${year}`);
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
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function GetActualLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showLocation, error);
    } else {
        toastr.error("Geolocation is not supported by this browser.");
    }
}
function error(err) {
    toastr.error(`ERROR(${err.code}): ${err.message}`);
}
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    $("#txtLocation").val("Latitude: " + latitude + " Longitude: " + longitude)
    $.ajax({
        url: `/GetLocation?latlng=${latitude},${longitude}`,
        type: 'POST',
        dataType: 'json',
        success: function (response) {
            var address = response.results[0].formatted_address;
            $("#txtAddress").val(address)
        },
        error: function (xhr) {
            toastr.error("Error fetching location:", xhr);
        }
    });
}
function EditData(code, VisitMaster_Code) {
    const codes = window.btoa(code);
    const VisitMaster_Codes = window.btoa(VisitMaster_Code);
    window.location = baseUrl +"/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=" + codes + "&Visit&VistMaster_Code=" + VisitMaster_Codes + "&VistMode=Edit";
}
function ViewData(code, VisitMaster_Code) {
    if (typeof VisitMaster_Code === 'undefined') {
        toastr.error('You cannot view this plan! The plan is not CheckIn.');
        return;
    }
    const codes = window.btoa(code);
    const VisitMaster_Codes = window.btoa(VisitMaster_Code);
    window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=" + codes +"Visit&VistMaster_Code=" + VisitMaster_Codes + "&VistMode=View";
}
function IsNotVisited(code) {
    const alertCls = confirm("Are you sure you want to close this visit?");
    if (alertCls) {
        CloseVisit(code);
    }
}
function CloseVisit(Code) {
    $('#ReasonModal').modal('show');
    $('#ReasonModal').modal({
        backdrop: 'static',
    });
    $("#txtCode").val(Code);
}
function SaveNotVisited() {
    var reason = $("#txtReason").val();
    var code = $("#txtCode").val();
    if (reason == "") {
            alert('Please enter a reason before proceeding.');
            toastr.error(response.Msg);
            return;
    } else {
        VisitOrderEntryService.NotVisitedRoutePlan(code, reason).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#ReasonModal').modal('hide');
                document.getElementById('txtReason').value = '';
                document.getElementById('txtCode').value = '0';
                var FromDate = $('#txtFromDate').val();
                var ToDate = $('#txtToDate').val();
                var SalesPerson = $('#ddlSalesPerson').val();
                GetVisitMasterList(FromDate, ToDate, SalesPerson);

            } else {
                toastr.error(response.Msg);
            }
        });
    }
}
function Close() {
    $('#ReasonModal').modal('hide');
}
function IsCheckIn(RoutePlanMaster_Code, date) {
    const currentDateOnly = new Date(new Date().setHours(0, 0, 0, 0));
    const visitDate = new Date(date);
    const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
    if (visitDateOnly < currentDateOnly) {
        alert('Check-In is not allowed because the visit date is earlier than the current date.');
        return false;
    }
    GetActualLocation();
    const location = $('#txtLocation').val();
    const checkedInAddress = $('#txtAddress').val();
    if (!checkedInAddress || checkedInAddress.trim() === "") {
        toastr.error("Please enable your location !");
        return false;
    }
    const checkInTime = GetCurrentTime();
    VisitOrderEntryService.CheckInVisit(RoutePlanMaster_Code, checkInTime, location, checkedInAddress).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            const encodedRoutePlanCode = window.btoa(RoutePlanMaster_Code);
            const encodedVisitMasterCode = window.btoa(response.Code);
            window.location = `${baseUrl}/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=${encodedRoutePlanCode}&Visit&VistMaster_Code=${encodedVisitMasterCode}&VistMode=New`;
            alert("Check-In successful! You can view and edit the selected plan details.");
        } else {
            toastr.error(response.Msg);
        }
    }).catch(function (error) {
        toastr.error('An error occurred during the Check-In process. Please try again.');
    });

    return true;
}
function GetCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

window.ViewData = ViewData;
window.IsNotVisited = IsNotVisited;
window.EditData = EditData;
window.SaveNotVisited = SaveNotVisited;
window.Close = Close;
window.IsCheckIn = IsCheckIn;