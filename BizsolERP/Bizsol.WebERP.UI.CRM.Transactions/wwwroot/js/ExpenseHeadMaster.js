import { ExpenseHeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseHeadMasterService.js';
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
    $("#ERPHeading").text("Expense Head Master");
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${dd}-${mm}-${yyyy}`;
    $('#txtFromDate, #txtToDate').val(currentDate);

     GetNestedMarketingManList();
      
     $("#btnAddExpenseEntry").click(function () {
        CreateNew(0);
    });
    
 });
function GetExpenseHeadMaster(){
   var fromDate= convertDateFormat($("#txtFromDate").val());
   var toDate= convertDateFormat($("#txtToDate").val());
   var MarketingPersonName=$("#ddlMarketingMan").val();

    ExpenseEntryService.GetExpenseHeadMaster(fromDate,toDate,MarketingPersonName).then(function (response) {
        $("#tblExpenseHeadMaster").show();
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
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>`;
                
                return {
                    ...item,
                    Action: buttonsHTML,
                };
                
            });

            BizsolCustomFilterGrid.CreateDataTable("ExpenseHeadMaster-header", "ExpenseHeadMaster-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblExpenseHeadMaster").hide();
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
function CreateNew(Code) {
    if ($("#ddlMarketingMan").val() == 'undefined' || $("#ddlMarketingMan").val() == "" || $("#ddlMarketingMan").val() == "All") {
        toastr.error('Please select a sales person name.');
        return false;
    }

    const codes = window.btoa(Code);
    var MarketingPersonName = window.btoa($("#ddlMarketingMan").val());
    var Mode = window.btoa("New");
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode +"&MarketingMan_Name=" + MarketingPersonName;
}


window.GetExpenseHeadMaster=GetExpenseHeadMaster;
window.EditData = EditData;
