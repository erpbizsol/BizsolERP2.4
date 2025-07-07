//import { VisitOrderEntryService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
let selectedDates = [];
let User_Id ="";
//var baseUrl = `${window.location.protocol}//${window.location.host}`;
var baseUrl = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Visit");
    GetUserdetails();
    GetNestedMarketingManList();
    setupDateInputFormatting();
    GetActualLocation();
    /*GetVisitMasterListForDate();*/

    $('#btnShow').on('click', function () {
        var FromDate = $('#txtFromDate').val();
        var ToDate = $('#txtToDate').val();
        //var SalesPerson = $('#ddlSalesPerson').val();
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
            var SalesPerson = $('#ddlSalesPersonlist option:selected').text();
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
    $('#ddlSalesPerson').on('focus', function (e) {
        $("#ddlSalesPerson").val('');
    });
});
function GetUserdetails() {
    //VisitOrderEntryService.GetUserDetails().then(function (response) {
    //    if (response && response.length > 0) {
    //        response.forEach(item => {
    //            if (item.UserID) {
    //                User_Id = item.UserID;
    //            }
    //        });
    //    }
    //    else {
    //        toastr.error('No Data Found')
    //    }
    //});

    var UserDetailsData = JSON.parse(sessionStorage.getItem('UserDetails'));
    var UserMaster_Code = UserDetailsData[0].Code;
    User_Id = UserDetailsData[0].UserID;
}

function BindSelectList(element, list, FirstItem) {
    let option = '';

    if (FirstItem == 'FirstItemAll') {
        option = '<option value="All">All</option>';
    } else if (FirstItem == 'FirstItemSelected') {
        option = '';
    } else {
        option = '<option value="0"></option>';
    }

    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function GetNestedMarketingManList() {
    VisitOrderEntryService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {
            $('#ddlSalesPersonList option').remove();

            //var option = '<option text="0" value="All" selected >All</option>';

            //for (var i = 0; i < response.length; i++) {
            //    option += '<option text="' + response[i].Code + '" value="' + response[i].PersonName + '" >' + response[i].PersonName + '</option>';
            //}

            //$('#ddlSalesPersonList')[0].innerHTML = option;

            BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })), 'FirstItemAll');
            $('#ddlSalesPersonlist').select2({
                // allowClear: true,
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

            GetVisitMasterListForDate();

        } else {
            toastr.error('No Data Found')
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
                buttons += getButtonHTML("", "btn btn-success btn-height mb-1", "", "fa-solid fa-sign-in", "Checked-in", true, "Already checked in");
                buttons += getButtonHTML("", "btn btn-danger btn-height mb-1", `CheckOutVisit(${VisitMaster_Code})`, "fa-solid fa-sign-out", "Check-Out");
                buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `EditData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-pencil", "Edit");
                buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `ViewData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-eye", "View");
            } else {
                buttons += getButtonHTML("", "btn btn-success btn-height mb-1", "", "fa-solid fa-sign-in", "Checked-In", true, "");
                buttons += getButtonHTML("", "btn btn-danger btn-height mb-1", `CheckOutVisit(${VisitMaster_Code})`, "fa-solid fa-sign-out", "Check-Out", true);
                buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `EditData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-pencil", "Edit", true, "Edit");
                buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `ViewData(${Code}, ${VisitMaster_Code})`, "fa-solid fa-eye", "View");
            }
        } else if (Closed === "Y") {
            buttons += getButtonHTML("Closed", "btn btn-primary btn-height mb-1", "", "", "Closed", true, "Cannot modify closed records");
        } else {
            buttons += getButtonHTML("Verify", "btn btn-primary btn-height mb-1", `Verify(${Code}, ${VisitMaster_Code})`, "", "Verify");
        }
    } else {
        if (Closed === 'Y') {
            buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `IsCheckIn(${Code}, this)`, "fa-solid fa-sign-in", true, "Check-In");
            buttons += getButtonHTML("", "btn btn-danger btn-height mb-1", `CheckOutVisit(${VisitMaster_Code})`, "fa-solid fa-sign-out", "Check-Out", true);
            buttons += getButtonHTML("", "btn btn-danger icon-height mb-1", "", "fa-solid fa-pencil", "Edit", true, "Edit disabled for unregistered visits");
            buttons += getButtonHTML("", "btn btn-danger icon-height mb-1", "", "fa-solid fa-eye", "View", true, "View disabled for unregistered visits");
        } else {
            buttons += getButtonHTML("", "btn btn-primary icon-height mb-1", `IsCheckIn(${Code}, '${date}',this)`, "fa-solid fa-sign-in", "Check-In");
            buttons += getButtonHTML("", "btn btn-danger btn-height mb-1", `CheckOutVisit(${VisitMaster_Code})`, "fa-solid fa-sign-out", "Check-Out", true);
            buttons += getButtonHTML("", "btn btn-danger icon-height mb-1", "", "fa-solid fa-pencil", "Edit", true, "Edit disabled for unregistered visits");
            buttons += getButtonHTML("", "btn btn-danger icon-height mb-1", "", "fa-solid fa-eye", "View", true, "View disabled for unregistered visits");
        }
        

    }
    return buttons;
};
function GetVisitMasterList(FromDate, ToDate, SalesPerson) {
    var UserDetailsData = JSON.parse(sessionStorage.getItem('UserDetails'));
    var UserMaster_Code = UserDetailsData[0].Code;
    User_Id = UserDetailsData[0].UserID;
    var fromDate = convertDateFormat(FromDate);
    var toDate = convertDateFormat(ToDate);
    VisitOrderEntryService.GetVisitMasterList(fromDate, toDate, SalesPerson, User_Id).then(function (response) {
        if (response.length > 0) {
            $("#txtTable").show();
            const StringFilterColumn = ["Created By", "Visit Type", "Status" ];
            const NumericFilterColumn = ["Total Amount"];
            const DateFilterColumn = ["Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = ["Dealer Name", "City","State"];
            const hiddenColumns = ["Code", "VisitMaster_Code", "Button", "Verified", "Closed", "CheckIn", "CheckOut"];
            const ColumnAlignment = { 
                "Total Amount": 'right',
                "Date" : 'center',
                "Verified" : 'center',
                "Closed": 'center',
            };
            response = response.map(item => {
                if (item.hasOwnProperty('ButtonStatus')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'ButtonStatus') {
                            reorderedItem['Button'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });
            const updatedResponse = response.map(item => {
                const buttonsHTML = getButtonSet(item.Status, item.Code, item.Date, item.VisitMaster_Code, item.Verified, item.Closed, item.CheckOut);
                let statusButtonHTML;
                if (item.Status === 'Closed') {
                    statusButtonHTML = `<button class="btn btn-danger  btn-height" style="cursor: not-allowed">${item.Status}</button>`;
                } else if  (item.Status === 'Checked Out') {
                    statusButtonHTML = `<button class="btn btn-danger  btn-height btn-width disabled" style="cursor: not-allowed">${item.Status}</button>`;
                }
                else {
                        statusButtonHTML = item.Status === "Not Visited"
                            ? `<button class="btn btn-primary  btn-height btn-width" onclick="IsNotVisited('${item.Code}')">Not-Visited</button>`
                            : `<button class="btn btn-success  btn-height btn-width" style="cursor: not-allowed">${item.Status}</button>`;
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
            $("#txtTable").hide();
        }
    });
}
function GetVisitMasterListForDate() {
    VisitOrderEntryService.GetRoutePlanList('Visit').then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.Date) {
                    selectedDates.push(item.Date);
                }
            });
            highlightSelectedDates();

            // By default show data
            var FromDate = $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null?'': $('#txtFromDate').val();
            var ToDate = $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null?'': $('#txtToDate').val();
            //var SalesPerson = $('#ddlSalesPerson').val() === undefined ? '': $('#ddlSalesPerson').val();
            var SalesPerson = $('#ddlSalesPersonlist option:selected').text();
            
                GetVisitMasterList(FromDate, ToDate, SalesPerson);
            
        }
        else {
            toastr.error('No Data Found')
            highlightSelectedDates();
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
        url: `${baseUrl}/GetLocation?latlng=${latitude},${longitude}`,
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
    //window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=" + codes + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=Edit";
    window.location = baseUrl + "/CRMTransactions/Visit/DirectOrderEntry?RoutePlanCode=" + codes + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=Edit";
}
function ViewData(code, VisitMaster_Code) {
    if (typeof VisitMaster_Code === 'undefined') {
        toastr.error('You cannot view this plan! The plan is not CheckIn.');
        return;
    }
    const codes = window.btoa(code);
    const VisitMaster_Codes = window.btoa(VisitMaster_Code);
    //window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=" + codes + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=View";
    window.location = baseUrl + "/CRMTransactions/Visit/DirectOrderEntry?RoutePlanCode=" + codes + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=View";
}
function IsNotVisited(code) {
    const alertCls = confirm("Are you sure you want to close this?");
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
        toastr.error('Please enter a reason before procceding.');
        $("#txtReason").focus();
    } else {
        VisitOrderEntryService.NotVisitedRoutePlan(code, reason).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#ReasonModal').modal('hide');
                document.getElementById('txtReason').value = '';
                document.getElementById('txtCode').value = '0';
                var FromDate = $('#txtFromDate').val();
                var ToDate = $('#txtToDate').val();
                //var SalesPerson = $('#ddlSalesPerson').val();
                var SalesPerson = $('#ddlSalesPersonlist option:selected').text();
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
function IsCheckIn(RoutePlanMaster_Code, date,e) {
    const currentDateOnly = new Date(new Date().setHours(0, 0, 0, 0));
    const visitDate = new Date(date);
    const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
    if (visitDateOnly < currentDateOnly) {
        toastr.error('Check-In is not allowed because the visit date is earlier than the current date.');
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
    $(e).prop('disabled', true);
    VisitOrderEntryService.CheckInVisit(RoutePlanMaster_Code, checkInTime, location, checkedInAddress).then(function (response) {
        if (response.Status === 'Y') {
            //toastr.success(response.Msg);
            const encodedRoutePlanCode = window.btoa(RoutePlanMaster_Code);
            const encodedVisitMasterCode = window.btoa(response.Code);
            toastr.success("Check-In successful! You can view and edit the selected plan details.");
            setTimeout(function () {
                //window.location = `${baseUrl}/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=${encodedRoutePlanCode}&VisitMaster_Code=${encodedVisitMasterCode}&VisitMode=Edit`;
                window.location = `${baseUrl}/CRMTransactions/Visit/DirectOrderEntry?RoutePlanCode=${encodedRoutePlanCode}&VisitMaster_Code=${encodedVisitMasterCode}&VisitMode=Edit`;
            }, 2000); // 2 seconds delay before redirect
            
        } else {
            toastr.error(response.Msg);
        }
    }).catch(function (error) {
        toastr.error('An error occurred during the Check-In process. Please try again.');
    });

    return true;
}
function CheckOutVisit(VisitMaster_Code) {
    var visitMasterData = [];
    var visitMasterRow = {};
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    GetActualLocation();
    const location = $('#txtLocation').val();
    const checkedInAddress = $('#txtAddress').val();
    visitMasterRow["code"] = VisitMaster_Code;
    visitMasterRow["date"] = new Date().toISOString().split("T")[0];
    visitMasterRow["visitType"] = 0;
    visitMasterRow["accountDesp"] ='';
    visitMasterRow["photo"] = '';
    visitMasterRow["location"] = location !== null ? location : '';
    visitMasterRow["checkIn"] = '';
    visitMasterRow["checkOut"] = formattedTime;
    visitMasterRow["remarks"] = '';
    visitMasterRow["routePlanMaster_code"] = 0;
    visitMasterRow["nextVisitDate"] = '';
    visitMasterRow["verified"] = 'N';
    visitMasterRow["paymentTermsMasterCode"] = 0;
    visitMasterRow["deliveryDays"] =  0;
    visitMasterRow["freightCondition"] = '';
    visitMasterRow["orderDealerName"] = '';
    visitMasterRow["userMasterCode"] = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    visitMasterRow["checkInLocation"] = '';
    visitMasterRow["checkOutLocation"] = checkedInAddress !== null ? checkedInAddress : '';
    visitMasterRow["mRateUnit"] = '';
    visitMasterRow["creditDays"] = 0;
    visitMasterRow["freight"] = '';
    visitMasterRow["dispatchFrom"] = '';
    visitMasterRow["buyerPONo"] = 0;
    visitMasterRow["buyerPODate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["zoneName"] = '';
    visitMasterData.push(visitMasterRow);
    VisitOrderEntryService.CheckOut(visitMasterData).then(function (response) {
        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {
                toastr.success(response.Msg);
                var FromDate = $('#txtFromDate').val();
                var ToDate = $('#txtToDate').val();
                // var SalesPerson = $('#ddlSalesPerson').val();
                var SalesPerson = $('#ddlSalesPersonlist option:selected').text();
                GetVisitMasterList(FromDate, ToDate, SalesPerson);
            }
        }

    });
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
window.CheckOutVisit = CheckOutVisit;