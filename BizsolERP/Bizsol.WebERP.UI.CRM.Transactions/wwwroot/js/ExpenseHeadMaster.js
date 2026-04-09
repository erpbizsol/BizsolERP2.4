import { ExpenseHeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseHeadMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_Date = '';
let G_ExpenseHeadMaster = 0;
let G_Code = 0;
let G_ExpenseHeadMaster_Mode = 'E';
let G_EHM_DeleteCode = 0;

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}
$(document).ready(function () {
    $("#ERPHeading").text("Expense Head Master");
    
    GetExpenseHeadMasterTable();
 });
function GetExpenseHeadMasterTable(){
    ExpenseHeadMasterService.GetExpenseHeadMasterList().then(function (response) {
        var $tableCard = $("#cardExpenseHeadMaster");
        if (response && response.length > 0) {
            $tableCard.show();
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

            const updatedResponse = response.map(item => {
                let buttonsHTML =
                    `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditData('${item.Code}','${item?.["Expense Description"]}','E')"><i class="fa fa-pencil"></i></button>&nbsp;` +
                    `<button class="btn btn-info icon-height mb-1" title="View" onclick="EditData('${item.Code}','${item?.["Expense Description"]}','V')"><i class="fa-regular fa-eye"></i></button>&nbsp;` +
                    `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="OpenDeleteExpenseHead(${item.Code})"><i class="fa fa-trash-alt"></i></button>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-ExpenseHeadMaster", "table-body-ExpenseHeadMaster", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            $("#paginator-ExpenseHeadMaster").show();
        } else {
            $tableCard.hide();
            toastr.info('No expense heads found. Click "Create New" to add one.');
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
    G_ExpenseHeadMaster_Mode = Mode || 'E';
    if (Mode === 'V') {
        CreateNew_ExpenseHeadMaster();
        $('#txtExpenseDescription').val(desp);
        $('#newCreateForm input').prop('disabled', true);
        $('#newCreateFormExpenseHeadLimit').hide();
        GetExpenseHeadMasterByCode(G_ExpenseHeadMaster, Mode);
        $('.EditButtonLimitData').prop('disabled', true);
    }
     else {
        CreateNew_ExpenseHeadMaster();
        $('#newCreateForm input').prop('disabled', false);
        $('#txtExpenseDescription').val(desp);
        GetExpenseHeadMasterByCode(G_ExpenseHeadMaster, Mode);
    }
}
function GetExpenseHeadMasterByCode(G_ExpenseHeadMaster, Mode) {
    if (G_ExpenseHeadMaster == 0) {
        return false;
    }
    ExpenseHeadMasterService.GetExpenseHeadMasterByCode(G_ExpenseHeadMaster).then(function (response) {
        var $limitRow = $("#rowExpenseHeadLimitDetails");
        var $limitCard = $("#cardExpenseHeadLimitDetails");
        if (response && response.length > 0) {
            $limitRow.show();
            $limitCard.show();
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
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1 EditButtonLimitData" title="Edit Limit" onclick="EditLimitData('${item?.["Expense Category"]}','${item?.["Effective From"]}','${item?.["Per Day Limit"]}')"><i class="fa fa-pencil"></i></button>&nbsp`;
                
                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-ExpenseHeadLimitDetails", "table-body-ExpenseHeadLimitDetails", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            $("#paginator-ExpenseHeadLimitDetails").show();
            //if (data.DesignationName) {
            //    BizSolHelperFunction.SelectOptionByText('txtDesignation', data.DesignationName);
            //}

            //if (data.EffectiveFrom) {
            //    $('#txtEffectiveDate').val(data.EffectiveFrom);
            //}

            //if (data.PerDayLimit !== undefined && data.PerDayLimit !== null) {
            //    $('#txtPerDayLimit').val(data.PerDayLimit);
            //}
            if (Mode === 'V') {
                $('.EditButtonLimitData').prop('disabled', true);
            }
        } else {
            $limitRow.hide();
            $limitCard.hide();
        }
    });
}
function EditLimitData(desp,effectiveDate,parDayLimit) {
    BizSolHelperFunction.SelectOptionByText('txtDesignation', desp);
    const parts = effectiveDate.split('-');
    if (parts.length === 3) {
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        $('#txtEffectiveDate').val(formattedDate);
    } else {
        $('#txtEffectiveDate').val(''); 
    }
    $('#txtPerDayLimit').val(parDayLimit);
}
function CreateNew_ExpenseHeadMaster() {
    G_ExpenseHeadMaster_Mode = 'E';
    $('#locateExpenseHeadMaster').hide();
    $('#newCreateForm').show();
    $('#newCreateFormExpenseHeadLimit').show();
    $('#newCreateForm input').prop('disabled', false);
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
    $("#rowExpenseHeadLimitDetails").hide();
    $('#txtExpenseDescription').val('');
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

    if (G_Date == '') {
        toastr.warning('Please Fill The Expense EffectiveDate.');
        return;
    }
    if (!ExpenseDescription) {
        toastr.warning('Please Fill The Expense Description.');
        return;
    }
    if (!PerDayLimit) {
        toastr.warning('Please Fill The PerDayLimit.');
        return;
    }

    let objExpenseHeadLimitDetails = [];
    if (designationCode && parseInt(designationCode) !== 0 && G_Date && G_Date.trim() !== '' && PerDayLimit && parseFloat(PerDayLimit) !== 0) {
        objExpenseHeadLimitDetails.push({
            marketingManExpenseEntryCategory_Code: parseInt(designationCode),
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

    ExpenseHeadMasterService.SaveExpenseHeadMaster(payLoadData)
        .then(function (response) {
            if (response && response.Status === 'Y') {
                ShowExpenseHeadMasterSuccessModal("Saved Successfully!", response.Msg || "Expense head has been saved.", "fa-circle-check");
                GetExpenseHeadMasterByCode(G_ExpenseHeadMaster, G_ExpenseHeadMaster_Mode);
                ClearFormData();
            } else if (response && response.Status === 'N') {
                toastr.warning(response.Msg);
            }
        });
}
/** Opens the delete confirmation modal after checking user rights. */
function OpenDeleteExpenseHead(code) {
    MenuService.CheckModuleOptionRight('Expense Head Master', 'Delete', 'Y', getFinancialYear())
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                toastr.error((response && response.Msg) || 'You do not have permission to delete.');
                return;
            }
            G_EHM_DeleteCode = code;
            $('#ehmReasonForDeleteInput').val('');
            $('#ehmDeleteBackdrop').addClass('show');
            setTimeout(function () { $('#ehmReasonForDeleteInput').focus(); }, 150);
        })
        .catch(function () {
            toastr.error('Permission check failed. Please try again.');
        });
}

function CloseDeleteEHMModal() {
    $('#ehmDeleteBackdrop').removeClass('show');
    G_EHM_DeleteCode = 0;
}

function ConfirmDeleteExpenseHead() {
    var reason = ($('#ehmReasonForDeleteInput').val() || '').trim();
    if (!reason) {
        toastr.warning('Please provide a reason for deletion.');
        $('#ehmReasonForDeleteInput').focus();
        return;
    }
    if (!G_EHM_DeleteCode) {
        CloseDeleteEHMModal();
        return;
    }
    ExpenseHeadMasterService.DeleteExpenseHeadMaster(G_EHM_DeleteCode, reason)
        .then(function (response) {
            if (response && response.Status === 'Y') {
                CloseDeleteEHMModal();
                toastr.success((response && response.Msg) || 'Expense head deleted successfully.');
                GetExpenseHeadMasterTable();
            } else {
                toastr.error((response && response.Msg) || 'Delete failed. Please try again.');
            }
        })
        .catch(function () {
            toastr.error('Delete request failed. Please try again.');
        });
}

$('#btnExpenseEntryListDetails').click(function (e) {
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
});

function ShowExpenseHeadMasterSuccessModal(title, text, iconClass) {
    $('#eeSuccessModalTitle').text(title || "Done!");
    $('#eeSuccessModalText').text(text || "Operation completed successfully.");
    $('#eeSuccessModalIcon').removeClass().addClass('fas ' + (iconClass || 'fa-circle-check'));
    $('#eeSuccessBackdrop').addClass('show');
}

function CloseExpenseHeadMasterSuccessModal() {
    $('#eeSuccessBackdrop').removeClass('show');
}

window.GetExpenseHeadMasterTable = GetExpenseHeadMasterTable;
window.EditData = EditData;
window.CreateNew_ExpenseHeadMaster = CreateNew_ExpenseHeadMaster;
window.ExpenseHeadMaster_Back = ExpenseHeadMaster_Back;
window.validateDecimalInput = validateDecimalInput;
window.submit_ExpenseHeadMaster = submit_ExpenseHeadMaster;
window.EditLimitData = EditLimitData;
window.CloseExpenseHeadMasterSuccessModal = CloseExpenseHeadMasterSuccessModal;
window.OpenDeleteExpenseHead = OpenDeleteExpenseHead;
window.CloseDeleteEHMModal = CloseDeleteEHMModal;
window.ConfirmDeleteExpenseHead = ConfirmDeleteExpenseHead;