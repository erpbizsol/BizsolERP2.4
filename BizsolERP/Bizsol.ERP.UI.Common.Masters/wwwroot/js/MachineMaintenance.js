import { MachineMaintenanceService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MachineMaintenanceService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
var G_UserName = UserDetails[0].UserName;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    $("#txtPreparedBy").val(G_UserName);
    GetMachineMaintenanceList();
    GetReasonMaster();
    GetDepartmentMasterList();
    GetMachineMasterList();

});
function CreateNew() {
    $("#txtPreparedBy").val(G_UserName);
    $("#dvGrid").hide();
    $("#dvFromNEW").show();
    ClearData();
}
function GetDepartmentMasterList() {

    MachineMaintenanceService.GetDepartmentMasterList().then(function (resObj) {
        BindSelectList($('#txtddlComplaintDepartment')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.DepartmentName })));
        $('#txtddlComplaintDepartment').select2({
            width: '-webkit-fill-available'
        });
    });
}
function GetReasonMaster() {
    MachineMaintenanceService.GetReasonMaster().then(function (resObj) {
        BindSelectList($('#txtddlComplaintReason')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.ReasonName })));
        $('#txtddlComplaintReason').select2({
            width: '-webkit-fill-available'
        });
    });
}
function GetMachineMasterList() {
    MachineMaintenanceService.GetMachineMasterList().then(function (resObj) {
        BindSelectList($('#txtddlMachineNo')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.MachineNo })));
        $('#txtddlMachineNo').select2({
            width: '-webkit-fill-available'
        });
    });
}
function BindSelectList(element, list) {
    let option = '<option value="">select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function SelectOptionByText(Id, FindText) {
    var dd = document.getElementById(Id);
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === FindText) {
            dd.selectedIndex = i;
            break;
        }
    }
    $('#' + Id).select2({
        width: '-webkit-fill-available'
    })
}
function formatDateForInput(dateStr) {
    if (!dateStr) return '';

    var parts = dateStr.split('-'); // dd-mm-yyyy
    return parts[2] + '-' + parts[1] + '-' + parts[0]; // yyyy-mm-dd
}
function GetMachineMaintenanceList() {

    MachineMaintenanceService.GetMachineMaintenanceList().then(function (response) {
        $("#tblMachineMaintenance").show();
        if (response.length > 0) {

            const StringFilterColumn = [""];
            const NumericFilterColumn = [""];
            const DateFilterColumn = [""];
            const Button = false;
            const showButtons = [""];
            const StringdoubleFilterColumn = [""];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                Action: ";width:100px;"
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="Edit(${item.Code})"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete(${item.Code})" ><i class="fa fa-times"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="Done"  onclick="Done(${item.Code})"><i class="fa fa-pencil"></i></button>
                `;
                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblMachineMaintenance").hide();
        }

    });
}

function BackMaster() {
    $("#dvGrid").show();
    $("#dvFromNEW").hide();
    $("#dvFromEDIT").hide();
    ClearData();
    GetMachineMaintenanceList();
}
function ClearData() {
    $('#hftxtCode').val('0');
    $('#txtEntryNo').val('');
    $('#txtEntryDate').val(getTodayDateForInput());
    $('#txtRequestDate').val(getTodayDateForInput());
    $('#txtStatus').val('Under Maintenance');
    $('#txtMCFailedDate').val(getTodayDateForInput());
    $('#txtMCFailedTime').val('');
    $('#txtJobAssignedTo').val('');
    SelectOptionByText('txtddlMachineNo', "select");
    SelectOptionByText('txtddlComplaintDepartment', "select");
    SelectOptionByText('txtddlComplaintReason', "select");
    $("#txtRemark").val("");
    $("#txtSectionInchargeSignature").val("");
}
function getTodayDateForInput() {
    var today = new Date();
    var month = (today.getMonth() + 1).toString().padStart(2, '0');
    var day = today.getDate().toString().padStart(2, '0');
    return today.getFullYear() + '-' + month + '-' + day;   // yyyy-MM-dd
}
function SaveMachineMaintenance() {
    var workStartDate = $("#txtMachineStartDate").val().trim();
    if (workStartDate === "") {
        workStartDate = null;
    }

    var workStartTime = $("#txtMachineStartTime").val().trim();
    if (workStartTime === "") {
        workStartTime = null;
    }

    let payload = [{
        Code: $("#hftxtCode").val() || 0,
        EntryNo: $("#txtEntryNo").val() || 0,
        EntryDate: $("#txtEntryDate").val().trim(),
        RequestDate: $("#txtRequestDate").val().trim(),
        MachineMaster_Code: $("#txtddlMachineNo").val().trim(),
        DepartmentMaster_Code: $("#txtddlComplaintDepartment").val().trim(),
        Status: $("#txtStatus").val() || "",
        MachineFailedDate: $("#txtMCFailedDate").val() || "",
        MachineFailedTime: $("#txtMCFailedTime").val() || "",
        JobAssignedTo: $("#txtJobAssignedTo").val() || "",
        ReasonMaster_Code: $("#txtddlComplaintReason").val() || "",
        FailedRemark: $("#txtRemark").val() || "",
        WorkStartDate: workStartDate,
        WorkStartTime: workStartTime,
        DescriptionofWorkDone: $("#txtDescriptionWorkDone").val() || "",
        StartRemark: $("#txtERemark").val() || "",
        sectionInchargeSignature: $("#txtSectionInchargeSignature").val() || "",
        
    }];
    MachineMaintenanceService.SaveMachineMaintenance(payload).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg || "Contact person details saved successfully.");
            GetMachineMaintenanceList();
            ClearData();
        } else {
            toastr.error(response.Msg || "Save failed for contact person details.");
        }
    }).catch(function (error) {
        toastr.error(error.Msg || "An error occurred while saving contact person details.");
    });
}

function Edit(Code) {
    $("#txtPreparedBy").val(G_UserName);
    $("#dvGrid").hide();
    $("#dvFromNEW").show();
    MachineMaintenanceService.GetMachineMaintenanceByCode(Code).then(function (response) {
        var data = response[0];
        if (data) {
            $('#hftxtCode').val(data.Code);
            $('#txtEntryNo').val(data.EntryNo);
            $('#txtEntryDate').val(formatDateForInput(data.EntryDate));
            $('#txtRequestDate').val(formatDateForInput(data.RequestDate));
            $('#txtddlComplaintDepartment').val(data.DepartmentName);
            SelectOptionByText('txtddlMachineNo', data.MachineNo);
            SelectOptionByText('txtddlComplaintDepartment', data.DepartmentName);
            $('#txtStatus').val(data.Status);
            $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate));
            $('#txtMCFailedTime').val(data.MachineFailedTime);
            $('#txtJobAssignedTo').val(data.JobAssignedTo);
            SelectOptionByText('txtddlComplaintReason', data.ReasonName);
            $('#txtRemark').val(data.FailedRemark);
            //$('#txtSectionInchargeSignature').val(data.sectionInchargeSignature);
        } else {
            toastr.error("Save failed for contact person details.");
        }
    }).catch(function (error) {
        toastr.error(error.Msg || "An error occurred while saving contact person details.");
    });
}

function Done(Code) {
    $("#txtPreparedBy").val(G_UserName);
    $("#dvGrid").hide();
    $("#txtRemark").hide();
    $("#dvFromNEW").show();
    $("#txthideMachineStartDate").show();
    $("#txthideMachineStartTime").show();
    $("#txthideRemark").show();
    $("#txthideDescriptionWorkDone").show();
    MachineMaintenanceService.GetMachineMaintenanceByCode(Code).then(function (response) {
        var data = response[0];
        if (data) {
            $('#hftxtCode').val(data.Code);
            $('#txtEntryNo').val(data.EntryNo).prop('readonly', true);
            $('#txtEntryDate').val(formatDateForInput(data.EntryDate)).prop('readonly', true);
            $('#txtRequestDate').val(formatDateForInput(data.RequestDate)).prop('readonly', true);
            $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate)).prop('readonly', true);
            $('#txtMCFailedTime').val(data.MachineFailedTime).prop('readonly', true);
            $('#txtJobAssignedTo').val(data.JobAssignedTo).prop('readonly', true);
            $('#txtJobAssignedTo').val(data.JobAssignedTo).prop('readonly', true);
            $('#txtddlMachineNo').prop('disabled', true);
            $('#txtddlComplaintDepartment').prop('disabled', true);
            $('#txtddlComplaintReason').prop('disabled', true);
            SelectOptionByText('txtddlMachineNo', data.MachineNo);
            SelectOptionByText('txtddlComplaintDepartment', data.DepartmentName);
            SelectOptionByText('txtddlComplaintReason', data.ReasonName);
            //$('#txtSectionInchargeSignature').val(data.sectionInchargeSignature);
            $('#txtStatus').val(data.Status);
            $('#txtERemark').val(),
            $("#txtMachineStartDate").val(),
            $("#txtMachineStartTime").val(),
            $('#txtDescriptionWorkDone').val()
            
        } else {
            toastr.error("Save failed for contact person details.");
        }
    }).catch(function (error) {
        toastr.error(error.Msg || "An error occurred while saving contact person details.");
    });
}
function CloseModalDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModalDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        $('#reasonForDeleteInput').focus();
        return;
    }

    MachineMaintenanceService.DeleteMachineMaintenance(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModalDelete();
            GetMachineMaintenanceList();
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during QCGroup delete');
    });
}
function Delete(Code) {
    if (!Code) {
        return;
    }
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#myModal').data('code', Code);
            $('#myModal').modal({
                backdrop: 'static',
            });

            $('#myModal').modal('show');
        }
    });
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}

window.CreateNew = CreateNew;
window.BackMaster = BackMaster;
window.SaveMachineMaintenance = SaveMachineMaintenance;
window.Edit = Edit;
window.Done = Done;
window.Delete = Delete;
window.CloseModalDelete = CloseModalDelete;
window.SaveModalDelete = SaveModalDelete;
window.formatDateForInput = formatDateForInput;