import { ExpenseHeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseHeadMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_Date = '';
let G_ExpenseHeadMaster = 0;
let G_Code = 0;
$(document).ready(function () {
    $("#ERPHeading").text("Expense Head Master");
    
    GetExpenseHeadMasterTable();
 });
function GetExpenseHeadMasterTable(){
    ExpenseHeadMasterService.GetExpenseHeadMasterList().then(function (response) {
        $("#tblExpenseHeadMaster").show();
        if (response.length > 0) {
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditData('${item.Code}','${item?.["Expense Description"]}','E')"><i class="fa fa-pencil"></i></button>&nbsp;
                <button class="btn btn-info icon-height mb-1" title="View" onclick="EditData('${item.Code}','${item?.["Expense Description"]}','V')"><i class="fa-regular fa-eye"></i></button>`;
                
                return {
                    ...item,
                    Action: buttonsHTML,
                };
                
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-ExpenseHeadMaster", "table-body-ExpenseHeadMaster", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblExpenseHeadMaster").hide();
        }
    });
}
function validateDecimalInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 9) {
        value = value.slice(0, 9);
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    input.value = value;
}
function EditData(Code, desp, Mode) {
    G_ExpenseHeadMaster = Code;
    if (Mode === 'V') {
        CreateNew_ExpenseHeadMaster();
        $('#txtExpenseDescription').val(desp);
        $('#newCreateForm input').prop('disabled', true);
        $('#newCreateFormExpenseHeadLimit input').prop('disabled', true);
        $('#newCreateFormExpenseHeadLimit select').prop('disabled', true);
        $('#saveExpenseHeadMasterButton').prop('disabled', true);
        GetExpenseHeadMasterByCode(G_ExpenseHeadMaster);
    }
     else {
        CreateNew_ExpenseHeadMaster();
        $('#txtExpenseDescription').val(desp);
        $('#newCreateForm input').prop('disabled', false);
        $('#newCreateFormExpenseHeadLimit input').prop('disabled', false);
        $('#newCreateFormExpenseHeadLimit select').prop('disabled', false);
        $('#saveExpenseHeadMasterButton').prop('disabled', false);
        GetExpenseHeadMasterByCode(G_ExpenseHeadMaster);
    }
}
function GetExpenseHeadMasterByCode(G_ExpenseHeadMaster) {
    ExpenseHeadMasterService.GetExpenseHeadMasterByCode(G_ExpenseHeadMaster).then(function (response) {
        $("#tblExpenseHeadLimitDetails").show();
        if (response.length > 0) {
            const data = response; 
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "Per Day Limit": 'right',
                "Effective From": 'center',
            };

            BizsolCustomFilterGrid.CreateDataTable("table-header-ExpenseHeadLimitDetails", "table-body-ExpenseHeadLimitDetails", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            if (data.DesignationName) {
                BizSolHelperFunction.SelectOptionByText('txtDesignation', data.DesignationName);
            }

            if (data.EffectiveFrom) {
                $('#txtEffectiveDate').val(data.EffectiveFrom);
            }

            if (data.PerDayLimit !== undefined && data.PerDayLimit !== null) {
                $('#txtPerDayLimit').val(data.PerDayLimit);
            }
        }
        else {
            toastr.error('No Data Found');
            $("#tblExpenseHeadLimitDetails").hide();
        }
    });
}
function CreateNew_ExpenseHeadMaster() {
    $('#locateExpenseHeadMaster').hide();
    $('#newCreateForm').show();
    $('#newCreateFormExpenseHeadLimit').show();
    GetDESIGNATIONAMEList();
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    G_Date = `${yyyy}-${mm}-${dd}`;
    $('#txtEffectiveDate').val(G_Date);
}
function ExpenseHeadMaster_Back() {
    G_ExpenseHeadMaster = 0;
    $('#locateExpenseHeadMaster').show();
    $('#newCreateForm').hide();
    $('#newCreateFormExpenseHeadLimit').hide();
    ClearFormData();
    GetExpenseHeadMasterTable();
    $("#tblExpenseHeadLimitDetails").hide();
}
function GetDESIGNATIONAMEList() {
    ExpenseHeadMasterService.GetDESIGNATIONAMEList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtDesignation')[0], response.map((item) => ({ Code: item.Code, Desp: item.DesignationName })));

            $('#txtDesignation').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function ClearFormData() {
    //$('#txtExpenseDescription').val('');
    $('#txtPerDayLimit').val('');
}
function submit_ExpenseHeadMaster() {
    let code = G_ExpenseHeadMaster;
    let ExpenseDescription = $('#txtExpenseDescription').val();
    let designationCode = $('#txtDesignation').val();
    let G_Date = $('#txtEffectiveDate').val();
    let PerDayLimit = $('#txtPerDayLimit').val();

    if (!ExpenseDescription) {
        toastr.warning('Please Fill The Expense Description.');
        return;
    }

    let objExpenseHeadLimitDetails = [];
    if (designationCode && parseInt(designationCode) !== 0 && G_Date && G_Date.trim() !== '' && PerDayLimit && parseFloat(PerDayLimit) !== 0) {
        objExpenseHeadLimitDetails.push({
            designationMaster_Code: parseInt(designationCode),
            effectiveFrom: G_Date,
            perDayLimit: parseFloat(PerDayLimit)
        })
        
    }

    let payLoadData = {
        expenseHeadMaster: [
            {
                code: parseInt(code),
                expenseDesp: ExpenseDescription
            }
        ],
        expenseHeadLimitDetails: objExpenseHeadLimitDetails 
    };

    ExpenseHeadMasterService.SaveExpenseHeadMaster(payLoadData )
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
               GetExpenseHeadMasterByCode(G_ExpenseHeadMaster);

                ClearFormData();
            }
            else if (response.Status === 'N') {
                toastr.warning(response.Msg);
            }
        });
}
$('#btnExpenseEntryListDetails').click(function (e) {

    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";

});

window.GetExpenseHeadMasterTable = GetExpenseHeadMasterTable;
window.EditData = EditData;
window.CreateNew_ExpenseHeadMaster = CreateNew_ExpenseHeadMaster;
window.ExpenseHeadMaster_Back = ExpenseHeadMaster_Back;
window.validateDecimalInput = validateDecimalInput;
window.submit_ExpenseHeadMaster = submit_ExpenseHeadMaster;