import { VisitorEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitorEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

let G_CheckInDate = '';
let G_CheckOutDate = '';
let G_CheckInTime = '';
let selectedDates = [];
let files = [];
let fileName = '';
let imageBase64Data = [];
let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;

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

    $('#checkInMobileNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInVisitorName").focus();
        }
    });
    $('#checkInVisitorName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInAddress").focus();
        }
    });
    $('#checkInAddress').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInPurpose").focus();
        }
    });
    $('#checkInPurpose').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInPersonToMeet").focus();
        }
    });
    $('#checkInPersonToMeet').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInVehicleNo").focus();
        }
    });
    $('#checkInVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInRemarks").focus();
        }
    });
    $('#checkInRemarks').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInVisitingCardPhoto").focus();
        }
    });
    $('#checkInVisitingCardPhoto').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#checkInPersonPhoto").focus();
        }
    });
});
function checkIn() {
    $('#checkInSection').show();
    $('#checkOutSection').hide();
    GetPersonToMeetDropDown();
    $("#tblVisitorMaster").hide();
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
    let PersonPhoto = $('#checkInPersonPhoto').val();
    let valid = true;

    let CheckVisitorEntryPayLoad = [{
        
        Code: 0,
        inDate: convertDateFormat($('#checkInDate').val()),
        inTime: $('#checkInTime').val(),
        outDate: convertDateFormat($('#checkOutDate').val()),
        outTime: "",
        visitorName: $('#checkInVisitorName').val(),
        mobileNo: $('#checkInMobileNo').val(),
        address: $('#checkInAddress').val(),
        purpose: $('#checkInPurpose').val(),
        personToMeet: $('#checkInPersonToMeet').val(),
        vehicleNo: $('#checkInVehicleNo').val(),
        remarks: $('#checkInRemarks').val(),
        checkInDatetime: convertDateFormat($('#checkInDate').val()),
        checkInby: userCode,
        checkOutDatetime: convertDateFormat($('#checkInDate').val()),
        checkOutby: 0,
        imgPerson: imageBase64Data,
        imgVisitingCard: imageBase64Data
    
    }];
    
    if (BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
        valid = false;
        toastr.warning('Please enter valid mobile number.');
        $('#checkInMobileNo').focus();
        return;

    }
    if (!PersonPhoto || PersonPhoto === '0' || PersonPhoto === undefined) {
        toastr.warning("Please Fill The Person Photo.");
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
    let MobileInputValue = $('#checkInMobileNo').val('');
    let VisitorNameInputValue = $('#checkInVisitorName').val('');
    let AddressInputValue = $('#checkInAddress').val('');
    let PurposeInputValue = $('#checkInPurpose').val('');
    let PersonToMeetInputValue = $('#checkInPersonToMeet').val('');
    let VehicleNoInputValue = $('#checkInVehicleNo').val('');
    let RemarksInputValue = $('#checkInRemarks').val('');
    let VisitingCardPhotoInputValue = $('#checkInVisitingCardPhoto').val('');
    let PersonPhotoInputValue = $('#checkInPersonPhoto').val('');
    setCurrentTimeVisitorCheckIn();
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
    let CheckOutDate = convertDateFormat($('#checkOutDate').val());
    if (selectedValue === 'pendingWise') {
        Showloader();
        VisitorEntryService.VisitorMasterShowCheckOut(CheckOutDate).then(function (response) {
            if (response && response.length > 0) {
                HideLoader();
                $("#tblVisitorMaster").show();
                const stringFilterColumn = [];
                const numericFilterColumn = [];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = ["Code","Status"];
                const columnAlignment = {};
                const updatedResponse = response.map(item => {
                    let inputCheckOutTime = `<input type="date" id="tblCheckOutDate" class="box_border form-control form-control-sm" style="width:100px;text-align:right" autocomplete="off"/> <input type="time" id="tblCheckOutTime" class="box_border form-control form-control-sm" style="width:100px;text-align:right" autocomplete="off" />`;
                    let buttonsHTMLRemove = `<button class="btn btn-primary icon-height mb-1" onclick="CheckOutButton('${item.Code}',this)" title="Check Out">CHECK OUT</button> &nbsp;<button class="btn btn-primary icon-height mb-1" onclick="VisitorEntry_Print('${item.Code}',this)" title="Print">PRINT</button>`
                    return {
                        ...item,
                        OutTime: inputCheckOutTime,
                        Action: buttonsHTMLRemove,

                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header-VisitorMaster", "table-body-VisitorMaster", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            } else {
                HideLoader();
                toastr.error("Data Not Found");
                $("#tblVisitorMaster").hide();
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error during Visitor Entry');
            $("#tblVisitorMaster").hide();
        });
    } else if (selectedValue === 'allWise') {
        Showloader();
        VisitorEntryService.VisitorMasterShowAll(CheckOutDate).then(function (response) {
            if (response && response.length > 0) {
                //console.log(response);
                HideLoader();
                $("#tblVisitorMaster").show();
                const stringFilterColumn = [];
                const numericFilterColumn = [];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = ["Code","Status"];
                const columnAlignment = {};
                
                const updatedResponse = response.map(item => {
                    let inputCheckOutTime = '';
                    let buttonsHTML = '';

                    if (item.Status === 'P') {
                        inputCheckOutTime = `<input type="date" id="tblCheckOutDate" class="box_border form-control form-control-sm" style="width:100px;text-align:right" autocomplete="off"/> <input type="time" id="tblCheckOutTime" class="box_border form-control form-control-sm" style="width:100px;text-align:right" autocomplete="off" />`;
                        buttonsHTML = `<button class="btn btn-primary icon-height mb-1" data-item='${JSON.stringify(item)}' onclick="CheckOutButton('${item.Code}',this)" title="Check Out">CHECK OUT</button> &nbsp;<button class="btn btn-primary icon-height mb-1" data-item='${JSON.stringify(item)}' onclick="VisitorEntry_Print('${item.Code}',this)" title="Print">PRINT</button>`;
                    } else if (item.Status === 'C') {
                        inputCheckOutTime = item.OutTime;
                        buttonsHTML = `<button class="btn btn-primary icon-height mb-1" data-item='${JSON.stringify(item)}' onclick="VisitorEntry_Print('${item.Code}',this)" title="Print">PRINT</button>`;
                    }

                    return {
                        ...item,
                        OutTime: inputCheckOutTime,
                        Action: buttonsHTML,
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header-VisitorMaster", "table-body-VisitorMaster", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            } else {
                HideLoader();
                toastr.error("Data Not Found");
                $("#tblVisitorMaster").hide();
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error during Visitor Entry');
            $("#tblVisitorMaster").hide();
        });
    }
}
function CheckOutButton(Code, buttonElement) {
    const item = JSON.parse(buttonElement.getAttribute('data-item'));
    const row = $(buttonElement).closest('tr'); 
    let CheckOutDateInput = row.find('#tblCheckOutDate').val(); 
    let CheckOutTimeInput = row.find('#tblCheckOutTime').val();

    if (!CheckOutDateInput || CheckOutDateInput === '0' || CheckOutDateInput === undefined) {
        toastr.warning("Please Fill the CheckOut Date.");
        return; 
    }

    if (!CheckOutTimeInput || CheckOutTimeInput === '0' || CheckOutTimeInput === undefined) {
        toastr.warning("Please Fill the CheckOut Time.");
        return;  
    }
    let CheckOutVisitorEntryPayLoad = [{
        Code: Code,
        outDate: CheckOutDateInput,
        outTime: CheckOutTimeInput,
        checkInDatetime: convertDateFormat($('#checkInDate').val()),
        checkInby: userCode,
        checkOutDatetime: convertDateFormat($('#checkOutDate').val()),
        checkOutby: userCode,

    }];
    
    VisitorEntryService.SaveVisitorEntry(JSON.stringify(CheckOutVisitorEntryPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            VisitorMasterShowDataButton();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function VisitorEntry_Print(Code, buttonElement) {
    VisitorEntryService.PrintRPT(Code).then(function (response) {
            let url = response.Url;
            const a = document.createElement('a');
            a.style.display = 'none';
            a.target = '_blank';
            a.href = url;
            document.body.appendChild(a);
            a.click();
        }).catch(function (error) {
            console.error("Error in printing report:", error);
        });
}

window.checkIn = checkIn;
window.checkOut = checkOut;
window.VisitorMasterShowDataButton = VisitorMasterShowDataButton;
window.triggerFileInputVisitingCardPhotoClick = triggerFileInputVisitingCardPhotoClick;
window.triggerFileInputPersonPhotoClick = triggerFileInputPersonPhotoClick;
window.FileUploadChangeVisitor = FileUploadChangeVisitor;
window.submit_VisitorEntry = submit_VisitorEntry;
window.CheckOutButton = CheckOutButton;
window.VisitorEntry_Print = VisitorEntry_Print;