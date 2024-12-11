import { RoutePlanMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RoutePlanService.js';
import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';

let MultiRoutePlanCodes = [];
let selectedDates = [];
let User_Id = "";
$(document).ready(function () {
    $("#ERPHeading").text("Route Plan Verify");
    GetUserdetails();
    GetVisitMasterListForDate();
    $("#btnShow").click(function () {
        var FromDate = $('#txtFromDate').val();
        var ToDate = $('#txtToDate').val();
        if (typeof $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null) {
            $('#txtFromDate').focus();
        }
        if (typeof $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null) {
            $('#txtToDate').focus();
        } else {
            GetUserWiseRoutePlanDetails(FromDate, ToDate);
        }
    });
    
});

function GetUserWiseRoutePlanDetails(FromDate, ToDate) {
    RoutePlanMasterService.GetUserWiseRoutePlanDetails(convertDateFormat(FromDate), convertDateFormat(ToDate)).then(function (response) {
      
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = ["User Name", "Visit Type", "City Name", "State Name", "Description","Dealer Name","Status"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "VisitTypeMaster_Code", "DealerMaster_Code", "CityMaster_Code", "StateMaster_Code","UserMaster_Code"];
            const ColumnAlignment = {
                "Date": 'center',
                "Status": 'center',
            };
            const pendingRows = response.filter(item => item.Status === 'Pending');
            MultiRoutePlanCodes = pendingRows.map(item => item.Code);
            const updatedResponse = response.map(item => ({
                ...item,
                Action: `<button class="btn btn-success icon-height mb-1" title="Verify" ${item.Status !== 'Pending' ? 'disabled' : ''} onclick="Verify('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Reject" ${item.Status !== 'Pending' ? 'disabled' : ''} onclick="Reject('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
               
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function Verify(Code) {
    RoutePlanMasterService.VerifyRoutePlan(Code).then(function (result) {
            toastr.success(result.Msg);
            GetUserWiseRoutePlanDetails();
    });
}
function Reject(Code) {
        $('#myModal').modal('show');
        $('#myModal').modal({
            backdrop: 'static',

        });
        $("#txtcode").val(Code); 
}
function SaveModal() {
    var reason = $("#rejectReason").val();
    var code = $("#txtcode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    } else {
        RoutePlanMasterService.RejectRoutePlan(code, reason).then(function (response) {
            if (response.Msg) {
                toastr.success(response.Msg);
                $('#rejectReason').val('');
                $('#txtCode').val('');
                GetUserWiseRoutePlanDetails();
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
   
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function VerifyAll() {
    RoutePlanMasterService.VerifyAllRoutePlan(MultiRoutePlanCodes).then(function (res) {
        toastr.success(res.Msg);
        GetUserWiseRoutePlanDetails();
    });
}
function RejectAll() {
    $('#myAllDeleteModal').modal('show');
    $('#myAllDeleteModal').modal({
        backdrop: 'static',
    });
    
}
function SaveAllModal() {
    var reasonAll = $("#rejectAllReason").val();
    RoutePlanMasterService.RejectAllRoutePlan(MultiRoutePlanCodes, reasonAll).then(function (results) {
        if (reasonAll == "") {
            alert('Please enter a reason before proceeding.');
            toastr.error(results.Msg);
            return;
        }
        else {
            toastr.success(results.Msg);
            $('#myAllDeleteModal').modal('hide');
            $('#rejectAllReason').val('');
            GetUserWiseRoutePlanDetails();
        }
    });
}
function CloseAllModal() {
    $('#myAllDeleteModal').modal('hide');
}
function GetUserdetails() {
    VisitOrderEntryService.GetUserDetails().then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.UserID) {
                    User_Id = item.UserID;
                }
            });
        }
        else {
            toastr.error('No Data Found')
        }
    });
}
function GetVisitMasterListForDate() {
    VisitOrderEntryService.GetRoutePlanList('RoutePlan').then(function (response) {
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
    var FromDate = $('#txtFromDate').val();
    var ToDate = $('#txtToDate').val();
    GetUserWiseRoutePlanDetails(FromDate, ToDate);
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

window.GetUserWiseRoutePlanDetails = GetUserWiseRoutePlanDetails;
window.Verify = Verify;
window.Reject = Reject;
window.CloseModal = CloseModal;
window.SaveModal = SaveModal;
window.VerifyAll = VerifyAll;
window.RejectAll = RejectAll;
window.SaveAllModal = SaveAllModal;
window.CloseAllModal = CloseAllModal;
