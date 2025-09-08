import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    Code: 0,
    PersonName: 1,
    EntryNo: 2,
    MarketingManMaster_Code: 3,
    EntryDate: 4,
    FromDate: 5,
    ToDate: 6,
    ApprovedBy: 7,
    ApprovedOn: 8,
    VerifyStatus: 9,
    Status: 10
}

$(document).ready(function () {
    //$('#tblRoutePlan').DataTable();
    $("#ERPHeading").text("Expense Entry");
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${dd}-${mm}-${yyyy}`;
    $('#txtFromDate, #txtToDate').val(currentDate);

    var ObjUserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
    if (ObjUserDetails !== undefined && ObjUserDetails[0].UserType == 'A') {
        $('#btnExpenseEntryConfig').prop('hidden', false);
    } else {
        $('#btnExpenseEntryConfig').prop('hidden', true);
    }

     GetNestedMarketingManList();
    DatePicker();

    var urlParams = getUrlVars();

    var SalesPersonNameSave = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
    var FromDateSave = decodeURIComponent(urlParams['FromDate'] || "");
    var ToDateSave = decodeURIComponent(urlParams['ToDate'] || "");

    if (SalesPersonNameSave) {
        $('#ddlMarketingMan').val(SalesPersonNameSave);
    }

    if (FromDateSave) {
        $('#txtFromDate').val(FromDateSave);
    }

    if (ToDateSave) {
        $('#txtToDate').val(ToDateSave);
    }

   $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlMarketingMan").focus();
        }
    });

      $("#btnShow").click(function () {
          var MarketingMan_Name=$("#ddlMarketingMan").val();
          var fromDate= $("#txtFromDate").val();
          var toDate= $("#txtToDate").val();

          if(fromDate==undefined|| fromDate==''){
              toastr.error('Please select valid From Date');
                return false;
          }
          if(toDate==undefined|| toDate==''){
              toastr.error('Please select valid To Date');
                return false;
          }
          if(MarketingMan_Name==undefined|| MarketingMan_Name==''){
              toastr.error('Please select Sales Person');
                return false;
          }
          

        GetExpenseEntryList();
    });
     $("#btnAddExpenseEntry").click(function () {
        CreateNew(0);
    });
    
    $('#btnExpenseEntryConfig').click(function (e) {

        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseHeadMaster";

    });
 });
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function GetNestedMarketingManList() {
    ExpenseEntryService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            $('#ddlSalesPersonList').empty();

            let options = '<option value="ALL" selected>ALL</option>';
            let matchedPersonName = null;

            for (let i = 0; i < response.length; i++) {
                const person = response[i];
                let userMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
                // Check if UserMaster_Code matches
                if (person.Usermaster_Code == userMaster_Code) {
                    matchedPersonName = person.PersonName;
                }

                options += `<option value="${person.PersonName}">${person.PersonName}</option>`;
            }

            $('#ddlSalesPersonList').html(options);

            // Set the marketing man input or dropdown value
            var urlParams = getUrlVars();
            if (decodeURIComponent(urlParams['MarketingMan_Name'] || "") == '') {
                if (matchedPersonName) {
                    $('#ddlMarketingMan').val(matchedPersonName);
                } else {
                    $('#ddlMarketingMan').val("ALL");
                }
            }

        } else {
            toastr.error('No Data Found');
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

function GetExpenseEntryList(){
   var fromDate= convertDateFormat($("#txtFromDate").val());
   var toDate= convertDateFormat($("#txtToDate").val());
   var MarketingPersonName=$("#ddlMarketingMan").val();

    ExpenseEntryService.GetExpenseEntryList(fromDate,toDate,MarketingPersonName).then(function (response) {
        $("#tblExpenseEntryList").show();
        if (response.length > 0) {
            const StringFilterColumn = ["Person Name"];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date","From Date","To Date","Approved On"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code","MarketingManMaster_Code","VerifyStatus"];
            const ColumnAlignment = {
                "Entry No": "right",
                "Entry Date": "center",
                "From Date": "center",
                "To Date": "center",
                "Approved On": "center"
            };

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" ${item.Status !== 'Unverified' ? 'disabled' : ''} onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" ${item.Status !== 'Unverified' ? 'disabled' : ''} onclick="DeleteData('${item.Code}',this)"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>`;

                var td_StatusBtn = '';
                if (item.Status == 'Unverified') {
                    td_StatusBtn = `<button type="button" class="btn btn-secondary btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Verified') {
                    td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Rejected') {
                    td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light  btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else {
                    td_StatusBtn = `<button type="button" class="btn btn-success  btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                }
                return {
                    ...item,
                    Action: buttonsHTML,
                    Status: td_StatusBtn,
                   
                };
                
            });

            BizsolCustomFilterGrid.CreateDataTable("ExpenseEntryList-header", "ExpenseEntryList-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblExpenseEntryList").hide();
        }
    });
}

function EditData(Code,x){
    const codes = window.btoa(Code);
    var ObjCurrRow = $(x).closest('tr');

    var Name = ObjCurrRow.find('td:eq(' + Indx_Tbl.PersonName + ')')[0].innerHTML.trim();

    var MarketingPersonName = window.btoa(Name);
    var Mode = window.btoa("Edit");
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode +"&MarketingMan_Name=" + MarketingPersonName;
}
function ViewData(Code,x){
    const codes = window.btoa(Code);
    var ObjCurrRow = $(x).closest('tr');

    var Name = ObjCurrRow.find('td:eq(' + Indx_Tbl.PersonName + ')')[0].innerHTML.trim();

    var MarketingPersonName = window.btoa(Name);
    var Mode = window.btoa("View");
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode +"&MarketingMan_Name=" + MarketingPersonName;
}
function CreateNew(Code) {
    if ($("#ddlMarketingMan").val() == 'undefined' || $("#ddlMarketingMan").val() == "" || $("#ddlMarketingMan").val() == "ALL") {
        toastr.error('Please select a sales person name.');
        return false;
    }

    const codes = window.btoa(Code);
    var MarketingPersonName = window.btoa($("#ddlMarketingMan").val());
    var Mode = window.btoa("New");
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode +"&MarketingMan_Name=" + MarketingPersonName;
}

function DeleteData(Code) {
    if (confirm("Are you sure you want to delete this record?")) {
    ExpenseEntryService.DeleteExpenseEntryMaster(Code).then(function (response) {

        if (response != '') {
            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                GetExpenseEntryList();
            } else {
                toastr.error(response.Msg);
            }

        }
    });
    } else {
        toastr.info('Deletion cancelled by user.');
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
    });
  
}
window.GetExpenseEntryList=GetExpenseEntryList;
window.EditData = EditData;
window.ViewData = ViewData;
window.DeleteData = DeleteData;