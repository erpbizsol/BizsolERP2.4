import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    ExpenseHead: 0,
    Designation: 1,
    EffectiveFrom: 2,
    PerDayLimit: 3,
    AllowedAmount: 4,
    ExpenseAmount: 5,
    ApprovedAmount: 6,
    Remarks: 7,
    Attachment: 8,
    ExpenseEntryDetail_Code: 9,
    ExpenseHeadMaster_Code: 10
}
var MarketingPersonName = param_MarketingMan_Name;

$(document).ready(function () {
    $("#ERPHeading").text("Expense Entry Details");

    
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${dd}-${mm}-${yyyy}`;
    
    $('#txtEntryDate').val(currentDate);
    DatePicker();


    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {

        }
    });
    PopulateExpenseHeadDetails(param_ExpenseEntryMaster_Code);

    $('#btnBack').click(function (e) {
        $('#ddlMarketingMan').val(MarketingPersonName);
        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
    });

    $('#btnSubmit').click(function (e) {
        SaveData();
    });
    $('#btnVerify').click(function (e) {
        VerifyExpenseEntryMaster();
    });

    DisableControls();
    ValidateMarketingPersonSenior();
});

function DisableControls() {
    if (param_Mode == 'View' && param_ExpenseEntryMaster_Code > 0) {
        $('input, textarea').prop('disabled', true);
        $('a').addClass('disabled');
        $("#btnBack").prop("disabled", false);

    }
    if (param_ExpenseEntryMaster_Code > 0) {
        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
    } else {

        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
    }
}
function PopulateExpenseHeadDetails(Code) {

    ExpenseEntryService.GetExpenseEntryDetails(MarketingPersonName, Code).then(function (response) {
        if (response.ExpenseEntryDetail.length > 0) {
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Designation Name", "Per Day Limit", "VerifyStatus", "ExpenseEntryDetail_Code", "ExpenseHeadMaster_Code", "Attachment","Effective From"];
            const ColumnAlignment = {
                "Allowed Amount": "center",
                "Approved Amount": "center",
                "Effective From": "center",
                "Expense Amount": "center",
                "Remarks" : "center"
            };
            response.ExpenseEntryDetail.forEach((item, index) => {
                item["Per Day Limit"] = `<input type="number" id="txtPerDay" data-index="${index}" value="${item["Per Day Limit"] || 0}" class="bal-mt-input" readonly="readonly" autocomplete="off">`;
                item["Allowed Amount"] = `<input type="number" id="txtAllowedAmount" data-index="${index}" value="${item["Allowed Amount"] || 0}" class="bal-mt-input" readonly="readonly" autocomplete="off" style="text-align: right;">`;
                item["Expense Amount"] = `<input type="number" id="txtExpendedAmount" data-index="${index}" value="${item["Expense Amount"] || 0}" class="bal-mt-input" onfocusout="CalculateApprovedAmount(this);" autocomplete="off" style="text-align: right;">`;
                item["Approved Amount"] = `<input type="number" id="txtApprovedAmount" data-index="${index}" value="${item["Approved Amount"] || 0}" class="bal-pc-input" readonly="readonly" autocomplete="off" style="text-align: right;">`;
                item["Remarks"] = `<input type="text" id="txtRemarks" data-index="${index}" value="${item["Remarks"]}" class="bal-mtrs-input" autocomplete="off">`;
                item["Attachment"] = `<a id="btnAttachment" class="btn btn-success icon-height mb-1" title="Attachment" onclick="ViewAttachment(this)"><i class="fa fa-paperclip" aria-hidden="true"></i></a>`;
            });
            BizsolCustomFilterGrid.CreateDataTable("ExpenseEntryDetails-header", "ExpenseEntryDetails-body", response.ExpenseEntryDetail, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        if (response.ExpenseEntryMaster.length > 0) {
            $('#txtEntryNo').val(response.ExpenseEntryMaster[0].EntryNo);
            $('#txtEntryDate').val(response.ExpenseEntryMaster[0].EntryDate);
            $('#txtFromDate').val(response.ExpenseEntryMaster[0].FromDate);
            $('#txtToDate').val(response.ExpenseEntryMaster[0].ToDate);
            //$('#txtTotalDays').val(1);
            CalculateTotalDays();

        }

        else {
            toastr.error('No Data Found')
        }
        DisableControls();
    });

}

function ViewAttachment(x) {
    var ObjCurrRow = $(x).closest('tr');
    var ExpenseEntryDetail_Code = ObjCurrRow.find('td:eq(' + Indx_Tbl.ExpenseEntryDetail_Code + ')')[0].innerHTML.trim();
    InitAttachmentControl('ExpenseEntryMaster',param_ExpenseEntryMaster_Code , 'ExpenseEntryDetail', ExpenseEntryDetail_Code, 0, '', "all");
}

function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#ExpenseEntryDetail_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}

function CalculateApprovedAmount(x) {
    var ApprovedAmount = 0;
    var ObjCurrRow = $(x).closest('tr');
    var AllowedAmount = ObjCurrRow.find('#txtAllowedAmount').val();
    var ExpendedAmount = ObjCurrRow.find('#txtExpendedAmount').val();
    var ApprovedAmount = ExpendedAmount;
    if (parseFloat(AllowedAmount) < parseFloat(ExpendedAmount)) {
        ApprovedAmount = AllowedAmount;
    }
    ObjCurrRow.find('#txtApprovedAmount').val(ApprovedAmount);

    if (parseFloat(AllowedAmount) < parseFloat(ExpendedAmount)) {
        let ExpendedAmountGreater = confirm("The amount exceeds the allowed amount! Do you want to proceed with this !");
        if (ExpendedAmountGreater) {
            if (parseFloat(AllowedAmount) < parseFloat(ExpendedAmount)) {
                ApprovedAmount = AllowedAmount;
            }
            ObjCurrRow.find('#txtApprovedAmount').val(ApprovedAmount);
        }
        else {
            ObjCurrRow.find('#txtApprovedAmount').val(0);
        }
    }
    
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
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtToDate, #txtFromDate').val(`${day}-${month}-${year}`);
    $('#txtToDate, #txtFromDate').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
    }).on('change', function () {
        CalculateTotalDays();

    });

}
function parseDate(dateStr) {
    var parts = dateStr.split('-');
    // Ensure the date is in dd-mm-yyyy format and create a new Date object
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
function CalculateTotalDays() {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();

    // Check if both dates are entered
    if (fromDate && toDate) {
        // Convert the date strings into Date objects
        var fromDateObj = parseDate(fromDate);
        var toDateObj = parseDate(toDate);

        // Calculate the difference in time (milliseconds)
        var timeDiff = toDateObj - fromDateObj;

        // Calculate the total days by dividing the time difference by the number of milliseconds in a day
        var totalDays = (timeDiff / (1000 * 3600 * 24)) + 1;

        // Show the total days (if the result is positive)
        if (totalDays >= 0) {
            $('#txtTotalDays').val(totalDays);
            $('#ExpenseEntryDetails tbody tr').each(function () {
                var value = parseFloat($(this).find('#txtPerDay').val()) * totalDays;
                $(this).find('#txtAllowedAmount').val(value);

            });
        } else {
            toastr.error("Please select a valid range of dates.");
        }
    } else {
        toastr.error("Please select both dates.");
    }
}

function VerifyExpenseEntryMaster() {
    if (ValidateVerifyData() == false) {
        return false;
    }
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response != '') {
            MarketingManMaster_Code = response.Code;

        }


        var allTablesData = {};
        var ExpenseEntryMasterData = [];
        var ExpenseEntryDetailsData = [];

        var ExpenseEntryMasterRow = {};
        ExpenseEntryMasterRow["Code"] = param_ExpenseEntryMaster_Code;
        ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
        ExpenseEntryMasterRow["MarketingManMaster_Code"] = MarketingManMaster_Code;
        ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
        ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

        ExpenseEntryMasterData.push(ExpenseEntryMasterRow);
        $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
            var ExpenseHead = 0;
            var Designation = '';
            var EffectiveFrom = '';
            var PerDayLimit = 0;
            var AllowedAmount = 0;
            var ExpenseAmount = 0;
            var ApprovedAmount = 0;
            var Remarks = '';
            var Attachment = '';
            var ExpenseEntryDetail_Code = 0;
            var ExpenseHeadMaster_Code = 0;


            ExpenseHead = $(this).find('td:eq(' + Indx_Tbl.ExpenseHead + ')')[0].innerHTML.trim();
            Designation = $(this).find('td:eq(' + Indx_Tbl.Designation + ')')[0].innerHTML.trim();
            EffectiveFrom = $(this).find('td:eq(' + Indx_Tbl.EffectiveFrom + ')')[0].innerHTML.trim();
            PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
            AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
            ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
            ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
            Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
            Attachment = '';// $(this).find('td:eq(' + Indx_Tbl.Attachment + ')')[0].getElementsByTagName('input')[0].value;
            ExpenseEntryDetail_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseEntryDetail_Code + ')')[0].innerHTML.trim();
            ExpenseHeadMaster_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseHeadMaster_Code + ')')[0].innerHTML.trim();

            var rowData = {};

            rowData["Code"] = ExpenseEntryDetail_Code;
            rowData["ExpenseEntryMaster_Code"] = param_ExpenseEntryMaster_Code;
            rowData["ExpenseHeadMaster_Code"] = ExpenseHeadMaster_Code;
            rowData["AllowLimit"] = PerDayLimit;
            rowData["AllowAmount"] = ApprovedAmount;
            rowData["ExpendedAmount"] = ExpenseAmount;
            rowData["Remarks"] = Remarks;
            rowData["voucherMaster_Code"] = 0;
            rowData["finYear"] = '';
            rowData["createdBy"] = UserMaster_Code;
            rowData["createDate"] = new Date().toISOString().split("T")[0];
            rowData["updatedBy"] = UserMaster_Code;
            rowData["updateDate"] = new Date().toISOString().split("T")[0];
            rowData["TotalDays"] = $('#txtTotalDays').val();
            rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
            rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
            rowData["verifyStatus"] = "Y";
            rowData["verifyRejectedBy"] = UserMaster_Code;
            rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
            rowData["location"] = '';
            rowData["expendedThrough"] = 0;
            rowData["expendedOnBehalf"] = 0;
            rowData["amountToRecover"] = 0;

            ExpenseEntryDetailsData.push(rowData);
        });

        allTablesData["ExpenseEntryMaster"] = ExpenseEntryMasterData;
        allTablesData["ExpenseEntryDetail"] = ExpenseEntryDetailsData;

        var Data = JSON.stringify(allTablesData);

        ExpenseEntryService.VerifyExpenseEntryMaster(allTablesData).then(function (response) {

            if (response != '') {
                if (response.Status == 'N') {
                    toastr.error(response.Msg);
                } else {

                    toastr.success(response.Msg);
                    setTimeout(function () {
                        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
                    }, 2000); // 2 seconds delay before redirect
                }

            }

        });

    });

    


}

function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response!='') {
            MarketingManMaster_Code = response.Code;


            var allTablesData = {};
            var ExpenseEntryMasterData = [];
            var ExpenseEntryDetailsData = [];

            var ExpenseEntryMasterRow = {};

            var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
            var UserMaster_Code = authKeyData.UserMaster_Code;

            ExpenseEntryMasterRow["Code"] = param_ExpenseEntryMaster_Code;
            ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
            ExpenseEntryMasterRow["MarketingManMaster_Code"] = MarketingManMaster_Code;
            ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
            ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

            ExpenseEntryMasterData.push(ExpenseEntryMasterRow);
            $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
                var ExpenseHead = 0;
                var Designation = '';
                var EffectiveFrom = '';
                var PerDayLimit = 0;
                var AllowedAmount = 0;
                var ExpenseAmount = 0;
                var ApprovedAmount = 0;
                var Remarks = '';
                var Attachment = '';
                var ExpenseEntryDetail_Code = 0;
                var ExpenseHeadMaster_Code = 0;


                ExpenseHead = $(this).find('td:eq(' + Indx_Tbl.ExpenseHead + ')')[0].innerHTML.trim();
                Designation = $(this).find('td:eq(' + Indx_Tbl.Designation + ')')[0].innerHTML.trim();
                EffectiveFrom = $(this).find('td:eq(' + Indx_Tbl.EffectiveFrom + ')')[0].innerHTML.trim();
                PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
                AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
                ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
                Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
                Attachment = '';// $(this).find('td:eq(' + Indx_Tbl.Attachment + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseEntryDetail_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseEntryDetail_Code + ')')[0].innerHTML.trim();
                ExpenseHeadMaster_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseHeadMaster_Code + ')')[0].innerHTML.trim();


                var rowData = {};

                rowData["Code"] = ExpenseEntryDetail_Code;
                rowData["ExpenseEntryMaster_Code"] = param_ExpenseEntryMaster_Code;
                rowData["ExpenseHeadMaster_Code"] = ExpenseHeadMaster_Code;
                rowData["AllowLimit"] = PerDayLimit;
                rowData["AllowAmount"] = ApprovedAmount;
                rowData["ExpendedAmount"] = ExpenseAmount;
                rowData["Remarks"] = Remarks;
                rowData["voucherMaster_Code"] = 0;
                rowData["finYear"] = '';
                rowData["createdBy"] = UserMaster_Code;
                rowData["createDate"] = new Date().toISOString().split("T")[0];
                rowData["updatedBy"] = UserMaster_Code;
                rowData["updateDate"] = new Date().toISOString().split("T")[0];
                rowData["TotalDays"] = $('#txtTotalDays').val();
                rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
                rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
                rowData["verifyStatus"] = "N";
                rowData["verifyRejectedBy"] = 0;
                rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
                rowData["location"] = '';
                rowData["expendedThrough"] = 0;
                rowData["expendedOnBehalf"] = 0;
                rowData["amountToRecover"] = 0;


                ExpenseEntryDetailsData.push(rowData);
            });

            allTablesData["ExpenseEntryMaster"] = ExpenseEntryMasterData;
            allTablesData["ExpenseEntryDetail"] = ExpenseEntryDetailsData;

            //var Data = JSON.stringify(allTablesData);

            ExpenseEntryService.SaveExpenseEntryMaster(allTablesData).then(function (response) {

                if (response != '') {
                    if (response.Status == 'N') {
                        toastr.error(response.Msg);
                    } else {
                        var Code = response.Code == undefined || response.Code=='' ? 0 : response.Code;
                        toastr.success(response.Msg);
                        setTimeout(function () {
                            //window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
                            const codes = window.btoa(Code);
                            var MarketingPersonName = window.btoa(param_MarketingMan_Name);
                            var Mode = window.btoa("Edit");
                            window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
                        }, 2000); // 2 seconds delay before redirect
                       
                    }

                }

            });



        }

    });

   

}
function ValidateData() {
    var TotalDays = $('#txtTotalDays').val();
    var TotalAllowed = 0;
    var TotalApproved = 0;
    var TotalExp = 0;

    if (TotalDays < 0) {
        toastr.error("Please select a valid range of dates.");
        return false;
    }
    
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        var AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
        var ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
        var ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;

        TotalAllowed += parseFloat(AllowedAmount);
        TotalExp += parseFloat(ExpenseAmount);
        TotalApproved += parseFloat(ApprovedAmount);

    });
    if (TotalAllowed < 0) {
        toastr.error("Invalid Allowed Amount.");
        return false;
    }
    if (TotalExp < 0) {
        toastr.error("Invalid Expense Amount.");
        return false;
    }
    if (TotalApproved > TotalExp) {
        toastr.warning("Approved amount can not greater then expended amount");
        return false;
    }
    return true;
}

function ValidateVerifyData() {
    if (ValidateData() == false) {
        return false;
    }
    var TotalApprovedAmount = 0;
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        var ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
        TotalApprovedAmount += parseFloat(ApprovedAmount);
    });

    if (TotalApprovedAmount <= 0) {
        toastr.error("Invalid Approved Amount.");
        return false;
    }
    return true;
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${monthAbbreviation}-${day}`;
}
function ValidateMarketingPersonSenior() {
    ExpenseEntryService.ExpenseEntry_ValidateMarketingPersonSenior(param_MarketingMan_Name).then(function (response) {

        if (response != '') {
            if (response[0].Valid == true && param_Mode != 'View') {
                $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
                    var txtApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0];
                    $(txtApprovedAmount).prop('disabled', false);
                });
                $('#btnVerify').prop('disabled', false);
            } else {
                $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
                    var txtApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0];
                    $(txtApprovedAmount).prop('disabled', true);
                });
                $('#btnVerify').prop('disabled', true);
            }

        }

    });
}

window.ViewAttachment = ViewAttachment;
window.CalculateApprovedAmount = CalculateApprovedAmount;
window.SaveData = SaveData;
window.VerifyExpenseEntryMaster = VerifyExpenseEntryMaster;