import { VisitorEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitorEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

let G_CheckInDate = '';
let G_CheckOutDate = '';
let G_CheckInTime = '';
let selectedDates = [];
let files = [];
let fileName = '';
let imageBase64Data = [];

$(document).ready(function () {
    $("#ERPHeading").text("Visitor Entry");
    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#checkInDate').val(`${day}/${month}/${year}`);
    $('#checkOutDate').val(`${day}/${month}/${year}`);
    setupDateInputFormatting();
    highlightSelectedDates();
    G_CheckInDate = convertDateFormat($('#checkInDate').val());
    setCurrentTimeVisitorCheckIn();
    GetPersonToMeetDropDown();
});
function checkIn() {
    $('#checkInSection').show();
    $('#checkOutSection').hide();
    GetPersonToMeetDropDown();
}
function checkOut() {
    $('#checkInSection').hide();
    $('#checkOutSection').show();
    G_CheckOutDate = convertDateFormat($('#checkOutDate').val());

}
function setupDateInputFormatting() {
    $('#checkOutDate').on('input', function () {
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
            $('#checkOutDate').val('');

        }
    } else {
        $('#checkOutDate').val('');

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

    $('#checkInDate').val(`${day}/${month}/${year}`);
    $('#checkOutDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        beforeShowDay: function (date) {
            const formattedDate = date.toDateString();
            if (highlightedDates[formattedDate]) {
                return { classes: 'highlighted-date', tooltip: 'Data Available' };
            }
            return { classes: '', tooltip: '' };
        }
    }).on('change', function () {
        var selectedDate = $(this).val();
        var parts = selectedDate.split('/');
        let formattedSelectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
        formattedSelectedDate = convertDateFormat($('#checkOutDate').val());
        //GetPackedPalletDateAndOrderWise(formattedSelectedDate, BuyerPOMaster_Code);
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

function submit_VisitorEntry() {
    let DriverMobile = $('#checkInMobileNo').val();
    let valid = true;
    //let CheckInPersonToMeet = $('#checkInPersonToMeet').val();
    let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;

    let CheckVisitorEntryPayLoad = [{
        
        Code: 0,
        inDate: convertDateFormat($('#checkInDate').val()),
        inTime: $('#checkInTime').val(),
        outDate: convertDateFormat($('#checkOutDate').val()),
        outTime: $('#checkInTime').val(),
        visitorName: $('#checkInVisitorName').val(),
        mobileNo: $('#checkInMobileNo').val(),
        address: $('#checkInAddress').val(),
        purpose: $('#checkInPurpose').val(),
        personToMeet: $('#checkInPersonToMeet').val(),
        vehicleNo: $('#checkInVehicleNo').val(),
        remarks: $('#checkInRemarks').val(),
        checkInDatetime: convertDateFormat($('#checkInDate').val()),
        checkInby: userCode,
        checkOutDatetime: convertDateFormat($('#checkOutDate').val()),
        checkOutby: userCode,
        imgPerson: imageBase64Data,
        imgVisitingCard: imageBase64Data
    
    }];
    //if (typeof DriverMobile === 'undefined' || DriverMobile === '' || DriverMobile === null) {
    //    valid = false;
    //    toastr.error('Please Check! Driver No. can not be blank');
    //    $('#checkInMobileNo').focus();
    //    return;
    //}
    if (BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
        valid = false;
        toastr.warning('Please enter valid mobile number.');
        $('#checkInMobileNo').focus();
        return;

    }
    VisitorEntryService.SaveVisitorEntry(JSON.stringify(CheckVisitorEntryPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            ClearFormData();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearFormData() {
    //let checkInTimeInputValue = $('#checkInTime').val('');
    let MobileInputValue = $('#checkInMobileNo').val('');
    let VisitorNameInputValue = $('#checkInVisitorName').val('');
    let AddressInputValue = $('#checkInAddress').val('');
    let PurposeInputValue = $('#checkInPurpose').val('');
    let PersonToMeetInputValue = $('#checkInPersonToMeet').val('');
    let VehicleNoInputValue = $('#checkInVehicleNo').val('');
    let RemarksInputValue = $('#checkInRemarks').val('');
    let VisitingCardPhotoInputValue = $('#checkInVisitingCardPhoto').val('');
    let PersonPhotoInputValue = $('#checkInPersonPhoto').val('');
}
function setCurrentTimeVisitorCheckIn() {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0'); 
    const minutes = currentTime.getMinutes().toString().padStart(2, '0'); 
    const time = `${hours}:${minutes}`; 
    document.getElementById('checkInTime').value = time;
}
function GetPersonToMeetDropDown() {
    VisitorEntryService.GetPersonToMeet().then(function (response) {
    if (response && response.length > 0) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#checkInPersonToMeet'), $('#checkInPersonToMeetList'), response.map((item) => ({ Desp: item.PersonToMeet })), 'StartWith');
    } else {
        $('#checkInPersonToMeetList').empty();
    }
})
        .catch (function (error) {
    console.error("Error fetching Person To Meet:", error);
});
}

function triggerFileInputVisitingCardPhotoClick() {
    document.getElementById('checkInVisitingCardPhoto').click();
}
function triggerFileInputPersonPhotoClick() {
    document.getElementById('checkInPersonPhoto').click();
}
function FileUploadChangeVisitor(event) {
    const target = event.target;
    files = target.files;
    fileName = files?.[0]?.name;

    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target?.result;
            const byteArray = new Uint8Array(arrayBuffer);
            imageBase64Data = Array.from(byteArray);
        };
        reader.readAsArrayBuffer(file);
    }
}
function VisitorMasterShowDataButton() {
    const selectedValue = $('input[name="filterType"]:checked').val();

    if (selectedValue === 'pendingWise') {
        Showloader();
        VisitorEntryService.VisitorMasterShowData().then(function (response) {
            if (response && response.length > 0) {
                HideLoader();
                $("#tblVisitorMaster").show();
                const stringFilterColumn = [];
                const numericFilterColumn = [];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = [];
                const columnAlignment = {};

                BizsolCustomFilterGrid.CreateDataTable("table-header-VisitorMaster", "table-body-VisitorMaster", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            } else {
                HideLoader();
                $("#tblVisitorMaster").hide();
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error during Visitor Entry');
            $("#tblVisitorMaster").hide();
        });
    } else if (selectedValue === 'allWise') {
        Showloader();
        VisitorEntryService.VisitorMasterShowAll().then(function (response) {
            if (response && response.length > 0) {
                HideLoader();
                $("#tblVisitorMaster").show();
                const stringFilterColumn = [];
                const numericFilterColumn = [];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = [];
                const columnAlignment = {};

                BizsolCustomFilterGrid.CreateDataTable("table-header-tblVisitorMaster", "table-body-tblVisitorMaster", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            } else {
                HideLoader();
                $("#tblVisitorMaster").hide();
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error during Visitor Entry');
            $("#tblVisitorMaster").hide();
        });
    }
}

//function Close_BackButton() {
//    $('#checkInSection').show();
//    $('#checkOutSection').hide();
//}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
window.checkIn = checkIn;
window.checkOut = checkOut;
window.VisitorMasterShowDataButton = VisitorMasterShowDataButton;
window.triggerFileInputVisitingCardPhotoClick = triggerFileInputVisitingCardPhotoClick;
window.triggerFileInputPersonPhotoClick = triggerFileInputPersonPhotoClick;
window.FileUploadChangeVisitor = FileUploadChangeVisitor;
window.submit_VisitorEntry = submit_VisitorEntry;