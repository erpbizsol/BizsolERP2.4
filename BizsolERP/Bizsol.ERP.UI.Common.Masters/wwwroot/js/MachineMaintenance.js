import { MachineMaintenanceService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MachineMaintenanceService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
let files = [];
let fileName = '';
let imageBase64Data = [];
let existingImageData = []; 
let existingFileName = ''; 
var baseUrl = sessionStorage.getItem('AppBaseURL');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
var G_UserName = UserDetails[0].UserName;
var G_Status = 'SAVE';
var G_AemployeeMasterList = [];
var G_CemployeeMasterList = [];
var ScreenMode = '';
var G_AccessRights = [];
var G_ShowButton = [];

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $("#txtPreparedBy").val(G_UserName);
    GetEmployeeMasterList();
    GetEmployeeMasterListBrackDown();
    GetReasonMaster();
    GetDepartmentMasterList();
    GetMachineMasterList();
    GetStatusMasterList();
    await ApplyButtonPermissions(); 
    GetMachineMaintenanceList();
    $('#ddlPriority').on('change', function () {
        const priority = $(this).val();
        const $reqTime = $('#txtRequestTime');

        if (priority === 'High') {
            setCurrentRequestTime();
            $reqTime.prop('readonly', true);
        } else {
            $reqTime.val('').prop('readonly', false);

        }
    });
}); 
function GetMachineMaintenanceList() {
    var statusFilter = [...new Set(G_AccessRights)].join(',');
    MachineMaintenanceService.GetMachineMaintenanceList(statusFilter).then(function (response) {
        $("#tblMachineMaintenance").show();
        if (response.length > 0) {
            const StringFilterColumn = ["Status", "Reason", "Department", "Machine No"];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["CurrentStatus", "MaintenanceType", "Priority", "NatureofBreakdown", "DescriptionofBreakdown", "SpareConsumed", "JobAssignedTo", "MobileNo", "RequestTime", "ConcernedPerson", "ConcenedPersonMobileNo", "Code", "Job Assigned", "Request Date", "Work Start Date", "Machine Failed Date", "Failed Remark", "Start Remark", "Description"];
            const ColumnAlignment = {
                "Entry No": "right;;width:15px;",
                "Action": ";width:50px;",
            };
            const updatedResponse = response.map(item => {
                const Closed = (item["Request Status"] || '').toLowerCase() === 'closed';
                const status = (item.CurrentStatus || item["CurrentStatus"] || '').toUpperCase().trim();
                const rights = new Set(G_ShowButton || []);

                let editButton = `<button class="btn btn-primary icon-height mb-2 me-1" id="txtEdit" title="Edit" onclick="Edit(${item.Code})" ${Closed ? 'disabled="disabled"' : ''}><i class="fa fa-pencil"></i></button>`;
                let deleteButton = `<button class="btn btn-danger icon-height mb-2 me-1" title="Delete" id="txtDelete" onclick="Delete(${item.Code})"><i class="fa fa-times"></i></button>`;
                let assignButton = `<button class="btn btn-success icon-height mb-2 me-1" title="Request Assign" id="txtAssign" onclick="Assign(${item.Code})">Request Assign</button>`;
                let updateStatusButton = `<button class="btn btn-info icon-height mb-2 me-1" title="Update Status" id="txtDone" onclick="Done(${item.Code})">Update Status</button>`;
                let closeButton = `<button class="btn btn-info icon-height mb-2" title="Ticket Close" id="txtClose" onclick="Close(${item.Code})">Ticket Close</button>`;

                let buttonsHTML = '';

                // New/Edit/Delete/Assign rights (N)
                if (rights.has('N')) {
                    buttonsHTML += `${editButton}${deleteButton}`;   
                   
                }
                if (status === 'N' && rights.has('A')) {
                    buttonsHTML += assignButton;
                }
                // Update Status rights (A for status A, U for status U/C)
                if (status === 'A' && rights.has('U')) {
                    buttonsHTML += updateStatusButton;
                }
                // Close rights (C for status U/C)
                if ((status === 'U' || status === 'C') && rights.has('C')) {
                    buttonsHTML += closeButton;
                }

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
function CheckPermission(OptionName, Id) {
    var ModuleName = "Machine Maintenance Request",
        OptionName = OptionName,
        ShowMsg = "N",
        FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            return false;
           
        }
        else {
           
            if (OptionName == "New") {
                G_AccessRights.push('N');
                G_ShowButton.push('N');
                $("#txtCreateNewbutton").show();
            }
            if (OptionName == "Edit") {
                G_AccessRights.push('N');
                G_ShowButton.push('N');
               
            }
            if (OptionName == "Delete") {
                G_AccessRights.push('N');
                G_ShowButton.push('N');
               
            }
            if (OptionName == "Assign") {
                G_AccessRights.push('N');
                G_ShowButton.push('A');
             
            }
            if (OptionName == "Update Status") {
                G_AccessRights.push('A');
                G_ShowButton.push('U');
                
            }
            if (OptionName == "Close") {
                G_AccessRights.push('U', 'C');
                G_ShowButton.push('N');
                G_ShowButton.push('C');
                
            }
        }
    });
}

async function ApplyButtonPermissions() {
    G_AccessRights = [];
    G_ShowButton = [];
    $("#txtCreateNewbutton").hide();
    await Promise.all([
        CheckPermission("New", "txtCreateNewbutton"),
        CheckPermission("Edit", "txtEdit"),
        CheckPermission("Delete", "txtDelete"),
        CheckPermission("Assign", "txtAssign"),
        CheckPermission("Update Status", "txtDone"),
        CheckPermission("Close", "txtClose")
    ]);
}

document.addEventListener('dblclick', function () {
    if (document.activeElement?.type === 'time') {
        document.activeElement.blur();
    }
});
function CreateNew() {
    ScreenMode = 'NEW';
    $("#txtPreparedBy").val(G_UserName);
    $("#dvGrid").hide();
    $("#dvFromNEW").show();
    $("#hideConcernedPerson").show();
    $("#hideConcenedPersonMobileNo").show();
    $("#txthideRequestTime").show();
    $("#hidetxtPreparedBy").show();
    $("#hideviewImageBtn").show();
    $("#hideUpdateStatus").hide();
    $("#hideRequestStatus").hide();
    $("#hideSpareConsumed").hide();
    $("#hideMaintenanceType").show();
    $("#hidePriority").show();
    $("#hideNatureofBreakdown").show();
    $("#hideDescriptionofBreakdown").show();
    ClearData();
    setCurrentRequestTime();
}
function ClearData() {
    $('#hftxtCode').val('0');
    $('#txtEntryNo').val('').prop('readonly', true);
    $('#txtEntryDate').val(getTodayDateForInput()).prop('readonly', true);
    $('#txtRequestDate').val(getTodayDateForInput()).prop('readonly', false);
    $('#ddlStatus').prop('disabled', false);
    $('#txtMCFailedDate').val(getTodayDateForInput()).prop('readonly', false);
    $('#txtMCFailedTime').val('').prop('readonly', false);
    SelectOptionByText("txtJobAssignedTo", "select");
    $('#txtAssignedMobileNo').val('').prop('readonly', false);
    $('#txtddlMachineNo').prop('disabled', false);
    $('#txtddlComplaintDepartment').prop('disabled', false);
    $('#txtddlComplaintReason').prop('disabled', false);
    SelectOptionByText('txtddlMachineNo', "select");
    SelectOptionByText('txtddlComplaintDepartment', "select");
    SelectOptionByText('txtddlComplaintReason', "select");
    SelectOptionByText('ddlStatus', "select");
    $("#txtRemark").val("").prop('disabled', false);
    $("#txtDescriptionWorkDone").val("").prop('disabled', false);
    $("#txtERemark").val("").prop('disabled', false);
    $('#txtMachineStartDate').val(getTodayDateForInput()).prop('readonly', false);
    $('#txtMachineStartTime').val('').prop('readonly', false);
    $("#txthideMachineStartDate").hide();
    $("#txthideMachineStartTime").hide();
    $("#txthideRemark").hide();
    $("#txthideDescriptionWorkDone").hide();
    $("#txtdRemark").show();
    $("#txtSectionInchargeSignature").val('');
    SelectOptionByText("txtConcernedPerson", "select");
    $("#ddlNatureofBreakdown").val("");
    $("#ddlPriority").val("");
    $("#ddlMaintenanceType").val("");
    $("#ddlRequestStatus").val("");
    $("#txtDescriptionofBreakdown").val('');
    $("#ddlUpdateStatus").val("").prop('disabled', false);
    $("#txtSpareConsumed").val("").prop('disabled', false);
    $("#txtConcenedPersonMobileNo").val("").prop('readonly', false);
    $("#txtRequestTime").val("").prop('readonly', false);
    $("#ddlMaintenanceType").val("").prop('disabled', false);
    $("#ddlPriority").val("").prop('disabled', false);
    $("#ddlNatureofBreakdown").val("").prop('disabled', false);
    $("#txtDescriptionofBreakdown").val("").prop('disabled', false);
   
    files = [];
    fileName = '';
    imageBase64Data = [];
    existingImageData = [];
    existingFileName = '';
    $('#imgPreview').attr('src', '');
    $('#imgPreviewContainer').hide();
    $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: none !important;').hide();

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
function GetStatusMasterList() {

    MachineMaintenanceService.GetStatusMaster().then(function (resObj) {
        BindSelectList($('#ddlStatus')[0], resObj.map((item) => ({ Code: item.Value, Desp: item.Value })));
        $('#ddlStatus').select2({
            width: '-webkit-fill-available'
        });
    });
}
function GetEmployeeMasterList() {

    MachineMaintenanceService.GetEmployeeMasterList().then(function (resObj) {
        G_CemployeeMasterList = resObj || [];  
        BindSelectList($('#txtConcernedPerson')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.EmployeeName })));
        $('#txtConcernedPerson').select2({
            width: '-webkit-fill-available'
        });
    });
} 

$('#txtConcernedPerson').on('change', function () {
    var selectedCode = $(this).val();
    if (!selectedCode) {
        $('#txtConcenedPersonMobileNo').val('');
        return;
    }
    var employee = G_CemployeeMasterList.find(function (item) { return item.Code == selectedCode; });
    var mobileNo = employee ? (employee.MobileNo || employee.MobileNo || '') : '';
   
    $('#txtConcenedPersonMobileNo').val(mobileNo);
});
function GetEmployeeMasterListBrackDown() {

    MachineMaintenanceService.GetEmployeeMasterListBrackDown().then(function (resObj) {
        G_AemployeeMasterList = resObj || [];
        BindSelectList($('#txtJobAssignedTo')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.EmployeeName })));
        $('#txtJobAssignedTo').select2({
            width: '-webkit-fill-available'
        });
    });
}

$('#txtJobAssignedTo').on('change', function () {
    var selectedCode = $(this).val();
    if (!selectedCode) {
        $('#txtAssignedMobileNo').val('');
        return;
    }
    var employee = G_AemployeeMasterList.find(function (item) { return item.Code == selectedCode; });
    var mobileNo1 = employee ? (employee.MobileNo || employee.MobileNo || '') : '';
    $('#txtAssignedMobileNo').val(mobileNo1);
});
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
function BackMaster() {
    $("#dvGrid").show();
    $("#dvFromNEW").hide();
    $("#dvFromEDIT").hide();
    $("#hideJobAssignedTo").hide();
    $("#hideAssignedToMobileNo").hide();
    $("#txthideRequestTime").show();
    $("#hidetxtPreparedBy").show();
    $("#hideviewImageBtn").show();
    $("#hideUpdateStatus").hide();
    $("#hideUpdateStatus").hide();
    $("#hideSpareConsumed").hide();
    $("#hideMaintenanceType").show();
    $("#hidePriority").show();
    $("#hideNatureofBreakdown").show();
    $("#hideDescriptionofBreakdown").show();

    ClearData();
    GetMachineMaintenanceList();
}
function getTodayDateForInput() {
    var today = new Date();
    var month = (today.getMonth() + 1).toString().padStart(2, '0');
    var day = today.getDate().toString().padStart(2, '0');
    return today.getFullYear() + '-' + month + '-' + day;
}
function SaveMachineMaintenance() {
    G_Status = 'SAVE';
    var ModuleName = "Machine Maintenance Request",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        }
        else {
            var code = $("#hftxtCode").val() || 0;
            var finalFileName = fileName || existingFileName;
            var finalImageData = (imageBase64Data && imageBase64Data.length > 0) ? imageBase64Data : existingImageData;

            if (ScreenMode === 'ASSIGN') {
                let JobAssignedTo = $("#txtJobAssignedTo").val();
                if (JobAssignedTo === "0" || JobAssignedTo === "" || JobAssignedTo == null) {
                    JobAssignedTo = 0;
                }
                var AssignedMobileNo = $("#txtAssignedMobileNo").val().trim();
                if (AssignedMobileNo === "") {
                    AssignedMobileNo = "";
                }
                if (!JobAssignedTo) {
                    toastr.error("Please select job assigned to.");
                    $("#txtJobAssignedTo").focus();
                    return;
                }
                if (!AssignedMobileNo) {
                    toastr.error("Please enter assigned to mobile no.");
                    $("#txtAssignedMobileNo").focus();
                    return;
                }

                let assignPayload = [{
                    Code: code,
                    JobAssignedTo: JobAssignedTo,
                    MobileNo: AssignedMobileNo,
                    attachFileName: "",
                    attachData: [],
                }];

                MachineMaintenanceService.GetJobAssignedTo(assignPayload).then(function (response) {
                    if (response.Status === 'Y') {
                        toastr.success(response.Msg);
                        BackMaster();
                    } else {
                        toastr.error(response.Msg);
                    }
                }).catch(function (error) {
                    toastr.error(error.Msg || "An error occurred while assigning job.");
                });

                return;
            }

            if (ScreenMode === 'DONE') {
                var workStartDate = $("#txtMachineStartDate").val().trim();
                if (workStartDate === "") {
                    workStartDate = null;
                }
                var workStartTime = $("#txtMachineStartTime").val().trim();
                if (workStartTime === "") {
                    workStartTime = null;
                }
                let Donepayload = [{
                    Code: code,
                    WorkStartDate: workStartDate,
                    WorkStartTime: workStartTime,
                    DescriptionofWorkDone: $("#txtDescriptionWorkDone").val() || "",
                    StartRemark: $("#txtERemark").val() || "",
                    MachineStatus: $("#ddlUpdateStatus").val() || "",
                    SpareConsumed: $("#txtSpareConsumed").val() || "",
                    attachFileName: finalFileName,
                    attachData: finalImageData,
                   
                }];
                var isDoneModeForSave = $('#txtEntryNo').prop('readonly') === true && $("#txthideMachineStartDate").is(':visible');
                if (isDoneModeForSave) {
                    var startRemarkVal = $("#txtERemark").val().trim();
                    var startDateVal = $("#txtMachineStartDate").val().trim();
                    var startTimeVal = $("#txtMachineStartTime").val().trim();
                    var UpdateStatus = $("#ddlUpdateStatus").val().trim();
                    if (!UpdateStatus) {
                        toastr.error("Please select update status.");
                        $("#ddlUpdateStatus").focus();
                        return;
                    } 
                    if (!startDateVal) {
                        toastr.error("Please select machine start date.");
                        $("#txtMachineStartDate").focus();
                        return;
                    }
                    if (!startTimeVal) {
                        toastr.error("Please select machine start time.");
                        $("#txtMachineStartTime").focus();
                        return;
                    }
                    if (!startRemarkVal) {
                        toastr.error("Please enter start remark.");
                        $("#txtERemark").focus();
                        return;
                    }
                    
                }
                MachineMaintenanceService.GetUpdateStatus(Donepayload).then(function (response) {
                    if (response.Status === 'Y') {
                        toastr.success(response.Msg);
                        BackMaster();
                    } else {
                        toastr.error(response.Msg);
                    }
                }).catch(function (error) {
                    toastr.error(error.Msg);
                });
            }

            if (ScreenMode === 'CLOSE') {
                let Closepayload = [{
                    Code: code,
                    RequestStatus: $("#ddlRequestStatus").val(),
                    attachFileName: finalFileName,
                    attachData: finalImageData,

                }];
                if (!Closepayload[0].RequestStatus) {
                    toastr.error("Please select request status.");
                    $("#ddlRequestStatus").focus();
                    return;
                }
                MachineMaintenanceService.GetCloseStatus(Closepayload).then(function (response) {
                    if (response.Status === 'Y') {
                        toastr.success(response.Msg);
                        BackMaster();
                    } else {
                        toastr.error(response.Msg);
                    }
                }).catch(function (error) {
                    toastr.error(error.Msg);
                });
            }

            if (ScreenMode === 'NEW' || ScreenMode==='EDIT') {

                let payload = [{
                    Code: code,
                    EntryNo: $("#txtEntryNo").val() || 0,
                    EntryDate: $("#txtEntryDate").val().trim(),
                    RequestDate: $("#txtRequestDate").val().trim(),
                    MachineMaster_Code: $("#txtddlMachineNo").val().trim(),
                    DepartmentMaster_Code: $("#txtddlComplaintDepartment").val().trim(),
                    Status: $("#ddlStatus").val().trim() || "",
                    MachineFailedDate: $("#txtMCFailedDate").val() || "",
                    MachineFailedTime: $("#txtMCFailedTime").val() || "",
                    ReasonMaster_Code: $("#txtddlComplaintReason").val() || "",
                    FailedRemark: $("#txtRemark").val() || "",
                    DescriptionofWorkDone: $("#txtDescriptionWorkDone").val() || "",
                    StartRemark: $("#txtERemark").val() || "",
                    attachFileName: finalFileName,
                    attachData: finalImageData,
                    companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
                    UserMaster_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,
                    ConcernedPerson: $("#txtConcernedPerson").val() || 0,
                    ConcernedPersonMobileNo: $("#txtConcenedPersonMobileNo").val() || "",
                    RequestTime: $("#txtRequestTime").val(),
                    MaintenanceType: $("#ddlMaintenanceType").val(),
                    Priority: $("#ddlPriority").val(),
                    NatureofBreakDown: $("#ddlNatureofBreakdown").val(),
                    DescriptionofBreakDown: $("#txtDescriptionofBreakdown").val().trim(),

                }];
                if (!payload[0].EntryDate) {
                    toastr.error("Please select entry date.");
                    $("#txtEntryDate").focus();
                    return;
                }
                if (!payload[0].RequestDate) {
                    toastr.error("Please select request date.");
                    $("#txtRequestDate").focus();
                    return;
                }
                if (!payload[0].MachineMaster_Code) {
                    toastr.error("Please select machine no.");
                    $("#txtddlMachineNo").focus();
                    return;
                }
                if (!payload[0].DepartmentMaster_Code) {
                    toastr.error("Please select department.");
                    $("#txtddlComplaintDepartment").focus();
                    return;
                }
                if (!payload[0].Status) {
                    toastr.error("Please select designation.");
                    $("#ddlStatus").focus();
                    return;
                }
                if (!payload[0].MachineFailedDate) {
                    toastr.error("Please select Machin failed date.");
                    $("#txtMCFailedDate").focus();
                    return;
                }
                var failedDate = payload[0].MachineFailedDate;
                var todayStr = getTodayDateForInput();
                var d = new Date();
                d.setDate(d.getDate() - 1);
                var mm = String(d.getMonth() + 1).padStart(2, '0');
                var dd = String(d.getDate()).padStart(2, '0');
                var yesterdayStr = d.getFullYear() + '-' + mm + '-' + dd;
                if (failedDate < yesterdayStr || failedDate > todayStr) {
                    toastr.error("Machine failed date can be selected one working day before the raise date or the same date.");
                    $("#txtMCFailedDate").focus();
                    return;
                }
                if (!payload[0].MachineFailedTime) {
                    toastr.error("Please select machine failed time.");
                    $("#txtMCFailedTime").focus();
                    return;
                }
                if (!payload[0].ReasonMaster_Code) {
                    toastr.error("Please select reason.");
                    $("#txtddlComplaintReason").focus();
                    return;
                } 
                if (!payload[0].DescriptionofBreakDown) {
                    toastr.error("Please enter description of breakdown.");
                    $("#txtDescriptionofBreakdown").focus();
                    return;
                }
                if (!payload[0].ConcernedPerson) {
                    toastr.error("Please select concerned person.");
                    $("#txtConcernedPerson").focus();
                    return;
                }
                if (!payload[0].ConcernedPersonMobileNo) {
                    toastr.error("Please select concened person mobile no.");
                    $("#txtConcenedPersonMobileNo").focus();
                    return;
                }
                MachineMaintenanceService.SaveMachineMaintenance(payload).then(function (response) {
                    if (response.Status === 'Y') {
                        toastr.success(response.Msg || "Contact person details saved successfully.");
                        BackMaster();
                    } else {
                        toastr.error(response.Msg || "Save failed for contact person details.");
                    }
                }).catch(function (error) {
                    toastr.error(error.Msg || "An error occurred while saving contact person details.");
                });
            }
           
            
        }
           
    });
}
function Edit(Code) {
    ScreenMode = 'EDIT';
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#txthideRequestTime").show();
            $("#dvGrid").hide();
            $("#dvFromNEW").show();
            $("#hideConcernedPerson").show();
            $("#hideConcenedPersonMobileNo").show();
            $("#hidetxtPreparedBy").show();
            $("#hideviewImageBtn").show();
            $("#hideUpdateStatus").hide();
            $("#hideRequestStatus").hide();
            $("#hideSpareConsumed").hide();
            $("#hideMaintenanceType").show();
            $("#hidePriority").show();
            $("#hideNatureofBreakdown").show();
            $("#hideDescriptionofBreakdown").show();
            G_Status = 'SAVE';
            setTimeout(function () {
                var eyeIcon = $('#viewImageBtn');
                if (eyeIcon.length) {
                    eyeIcon.removeAttr('style');
                    eyeIcon.css({
                        'cursor': 'pointer',
                        'height': '28px',
                        'display': 'flex !important'
                    }).show();
                }
            }, 50);
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
                    SelectOptionByText('ddlStatus',data.Status);
                    $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate));
                    $('#txtMCFailedTime').val(data.MachineFailedTime);
                    SelectOptionByText('txtddlComplaintReason', data.ReasonName);
                    SelectOptionByText('txtConcernedPerson', data.ConcernedPerson);
                    $('#txtRemark').val(data.FailedRemark);
                    $("#txtPreparedBy").val(data.CreatedByName);
                    $("#txtConcenedPersonMobileNo").val(data.ConcenedPersonMobileNo);
                    $("#txtRequestTime").val(data.RequestTime);
                    $("#ddlMaintenanceType").val(data.MaintenanceType);
                    $("#ddlPriority").val(data.Priority);
                    $("#ddlNatureofBreakdown").val(data.NatureofBreakdown);
                    $("#txtDescriptionofBreakdown").val(data.DescriptionofBreakdown);
                   
                    setTimeout(function () {
                        var eyeIcon = $('#viewImageBtn');
                        if (eyeIcon.length) {
                            eyeIcon.css({
                                'cursor': 'pointer',
                                'height': '28px',
                                'display': 'flex !important'
                            }).show();

                        }
                    }, 100);

                    LoadExistingImage(data);

                    GetMachineMaintenanceList();
                } else {
                    toastr.error("Save failed for contact person details.");
                    $('#viewImageBtn').css('display', 'none !important').hide();
                }
            }).catch(function (error) {
                toastr.error(error.Msg || "An error occurred while saving contact person details.");
                $('#viewImageBtn').css('display', 'none !important').hide();
            });
        }
    });
}
function Assign(Code) {
    ScreenMode = 'ASSIGN';
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Assign",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#txthideRequestTime").show();
            $("#dvGrid").hide();
            $("#dvFromNEW").show();
            $("#hideConcernedPerson").hide();
            $("#hideConcenedPersonMobileNo").hide();
            $("#hidetxtPreparedBy").show();
            $("#hideviewImageBtn").show();
            $('#hideJobAssignedTo').show();
            $('#hideAssignedToMobileNo').show();
            $("#hideUpdateStatus").hide();
            $("#hideRequestStatus").hide();
            $("#hideSpareConsumed").hide();
            $("#hideMaintenanceType").show();
            $("#hidePriority").show();
            $("#hideNatureofBreakdown").show();
            $("#hideDescriptionofBreakdown").show();
            G_Status = 'SAVE';
            setTimeout(function () {
                var eyeIcon = $('#viewImageBtn');
                if (eyeIcon.length) {
                    eyeIcon.removeAttr('style');
                    eyeIcon.css({
                        'cursor': 'pointer',
                        'height': '28px',
                        'display': 'flex !important'
                    }).show();
                }
            }, 50);
            MachineMaintenanceService.GetMachineMaintenanceByCode(Code).then(function (response) {
                var data = response[0];
                if (data) {
                    $('#hftxtCode').val(data.Code);
                    $('#txtEntryNo').val(data.EntryNo).prop('readonly', true);
                    $('#txtEntryDate').val(formatDateForInput(data.EntryDate)).prop('readonly', true);
                    $('#txtRequestDate').val(formatDateForInput(data.RequestDate)).prop('readonly', true);
                    $('#txtddlMachineNo').val(data.MachineNo).prop('disabled', true);
                    $('#txtddlComplaintDepartment').val(data.DepartmentName).prop('disabled', true);
                    $('#ddlStatus').val(data.Status).prop('disabled', true);
                    $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate)).prop('readonly', true);
                    $('#txtMCFailedTime').val(data.MachineFailedTime).prop('readonly', true);
                    $("#txtRequestTime").val(data.RequestTime).prop('readonly', true);
                    $("#txtddlComplaintReason").val(data.ReasonName).prop('disabled', true);
                    $('#txtRemark').val(data.FailedRemark).prop('disabled', true);
                    $("#txtRequestTime").val(data.RequestTime).prop('readonly', true);
                    $("#ddlMaintenanceType").val(data.MaintenanceType).prop('disabled', true);
                    $("#ddlPriority").val(data.Priority).prop('disabled', true);
                    $("#ddlNatureofBreakdown").val(data.NatureofBreakdown).prop('disabled', true);
                    $("#txtDescriptionofBreakdown").val(data.DescriptionofBreakdown).prop('disabled', true);
                    SelectOptionByText('txtddlMachineNo', data.MachineNo);
                    SelectOptionByText('txtddlComplaintDepartment', data.DepartmentName);
                    SelectOptionByText('ddlStatus', data.Status);
                    SelectOptionByText('txtddlComplaintReason', data.ReasonName);
                    SelectOptionByText('txtJobAssignedTo', data.JobAssignedTo);
                    $('#txtAssignedMobileNo').val(data.MobileNo);
                    setTimeout(function () {
                        var eyeIcon = $('#viewImageBtn');
                        if (eyeIcon.length) {
                            eyeIcon.css({
                                'cursor': 'pointer',
                                'height': '28px',
                                'display': 'flex !important'
                            }).show();

                        }
                    }, 100);
                    LoadExistingImage(data);
                    GetMachineMaintenanceList();
                
                } else {
                    toastr.error("Save failed for contact person details.");
                }
            }).catch(function (error) {
                toastr.error(error.Msg || "An error occurred while saving contact person details.");
            });
        }
    });

}
function Done(Code) {
    ScreenMode = 'DONE';
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Update Status",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        }
        else {
            G_Status = 'UPDATESTATUS';
            $("#dvGrid").hide();
            $("#txtdRemark").hide();
            $("#dvFromNEW").show();
            $("#txthideMachineStartDate").show();
            $("#txthideMachineStartTime").show();
            $("#txthideRemark").show();
            $("#txthideDescriptionWorkDone").show();
            $("#hideJobAssignedTo").hide();
            $("#hideAssignedToMobileNo").hide();
            $("#hideConcernedPerson").hide();
            $("#hideConcenedPersonMobileNo").hide();
            $("#txthideRequestTime").show();
            $("#hideviewImageBtn").show();
            $("#hideUpdateStatus").show();
            $("#hideMaintenanceType").show();
            $("#hidePriority").show();
            $("#hideNatureofBreakdown").show();
            $("#hideDescriptionofBreakdown").show();
            $("#hideRequestStatus").hide();
            $("#hideSpareConsumed").show();
            $("#hidetxtPreparedBy").show();
           
            MachineMaintenanceService.GetMachineMaintenanceByCode(Code).then(function (response) {
                var data = response[0];
                if (data) {
                    $('#hftxtCode').val(data.Code);
                    $('#txtEntryNo').val(data.EntryNo).prop('readonly', true);
                    $('#txtEntryDate').val(formatDateForInput(data.EntryDate)).prop('readonly', true);
                    $('#txtRequestDate').val(formatDateForInput(data.RequestDate)).prop('readonly', true);
                    $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate)).prop('readonly', true);
                    $('#txtMCFailedTime').val(data.MachineFailedTime).prop('readonly', true);
                    $('#txtddlMachineNo').prop('disabled', true);
                    $('#txtddlComplaintDepartment').prop('disabled', true);
                    $('#txtddlComplaintReason').prop('disabled', true);
                    SelectOptionByText('txtddlMachineNo', data.MachineNo);
                    SelectOptionByText('txtddlComplaintDepartment', data.DepartmentName);
                    SelectOptionByText('txtddlComplaintReason', data.ReasonName);
                    $('#txtRemark').val(data.FailedRemark);
                    $("#txtPreparedBy").val(data.CreatedByName);
                    SelectOptionByText('ddlStatus', data.Status);
                    $('#ddlStatus').prop('disabled', true);
                    //
                    $("#txtRequestTime").val(data.RequestTime).prop('readonly', true);
                    $("#ddlMaintenanceType").val(data.MaintenanceType).prop('disabled', true);
                    $("#ddlPriority").val(data.Priority).prop('disabled', true);
                    $("#ddlNatureofBreakdown").val(data.NatureofBreakdown).prop('disabled', true);
                    $("#txtDescriptionofBreakdown").val(data.DescriptionofBreakdown).prop('disabled', true);

                    setTimeout(function () {
                        var eyeIcon = $('#viewImageBtn');
                        if (eyeIcon.length) {
                            eyeIcon.removeAttr('style');
                            eyeIcon.css({
                                'cursor': 'pointer',
                                'height': '28px',
                                'display': 'flex !important'
                            }).show();
                        }
                    }, 150);
                    LoadExistingImage(data);
                    GetMachineMaintenanceList();
                   
                } else {
                    toastr.error("Save failed for contact person details.");
                }
            }).catch(function (error) {
                toastr.error(error.Msg || "An error occurred while saving contact person details.");
            });
        }
    });
}
function Close(Code) {
    ScreenMode = 'CLOSE';
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Close",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        }
        else {
            G_Status = 'UPDATESTATUS';
            $("#dvGrid").hide();
            $("#txtdRemark").hide();
            $("#dvFromNEW").show();
            $("#txthideMachineStartDate").show();
            $("#txthideMachineStartTime").show();
            $("#txthideRemark").show();
            $("#txthideDescriptionWorkDone").show();
            $("#hideJobAssignedTo").hide();
            $("#hideAssignedToMobileNo").hide();
            $("#hideConcernedPerson").hide();
            $("#hideConcenedPersonMobileNo").hide();
            $("#txthideRequestTime").hide();
            $("#hideviewImageBtn").show();
            $("#hideRequestStatus").show();
            $("#hideUpdateStatus").show();
            $("#hideSpareConsumed").show();
            $("#hidetxtPreparedBy").show();
            $("#hideMaintenanceType").show();
            $("#hidePriority").show();
            $("#hideNatureofBreakdown").show();
            $("#hideDescriptionofBreakdown").show();
            MachineMaintenanceService.GetMachineMaintenanceByCode(Code).then(function (response) {
                var data = response[0];
                if (data) {
                    $('#hftxtCode').val(data.Code);
                    $('#txtEntryNo').val(data.EntryNo).prop('readonly', true);
                    $('#txtEntryDate').val(formatDateForInput(data.EntryDate)).prop('readonly', true);
                    $('#txtRequestDate').val(formatDateForInput(data.RequestDate)).prop('readonly', true);
                    $('#txtMCFailedDate').val(formatDateForInput(data.MachineFailedDate)).prop('readonly', true);
                    $('#txtMCFailedTime').val(data.MachineFailedTime).prop('readonly', true);
                    $('#txtddlMachineNo').prop('disabled', true);
                    $('#txtddlComplaintDepartment').prop('disabled', true);
                    $('#txtddlComplaintReason').prop('disabled', true);
                    SelectOptionByText('txtddlMachineNo', data.MachineNo);
                    SelectOptionByText('txtddlComplaintDepartment', data.DepartmentName);
                    SelectOptionByText('txtddlComplaintReason', data.ReasonName);
                    $('#txtRemark').val(data.FailedRemark).prop('disabled', true);
                    $("#txtPreparedBy").val(data.CreatedByName);
                    SelectOptionByText('ddlStatus', data.Status);
                    $('#ddlStatus').prop('disabled', true);
                    $('#txtERemark').val(data.StartRemark).prop('disabled', true);
                    $("#txtMachineStartDate").val(formatDateForInput(data.WorkStartDate)).prop('readonly', true);
                    $("#txtMachineStartTime").val(data.WorkStartTime).prop('readonly', true);
                    $('#txtDescriptionWorkDone').val(data.DescriptionofWorkDone || '').prop('disabled', true);
                    $("#ddlUpdateStatus").val(data.MachineStatus || '').prop('disabled', true);
                    $("#txtSpareConsumed").val(data.SpareConsumed || '').prop('disabled', true);
                    $("#ddlRequestStatus").val();
                    $("#txtRequestTime").val(data.RequestTime).prop('readonly', true);
                    $("#ddlMaintenanceType").val(data.MaintenanceType).prop('disabled', true);
                    $("#ddlPriority").val(data.Priority).prop('disabled', true);
                    $("#ddlNatureofBreakdown").val(data.NatureofBreakdown).prop('disabled', true);
                    $("#txtDescriptionofBreakdown").val(data.DescriptionofBreakdown).prop('disabled', true);
                    setTimeout(function () {
                        var eyeIcon = $('#viewImageBtn');
                        if (eyeIcon.length) {
                            eyeIcon.removeAttr('style');
                            eyeIcon.css({
                                'cursor': 'pointer',
                                'height': '28px',
                                'display': 'flex !important'
                            }).show();
                        }
                    }, 150);
                    LoadExistingImage(data);

                    GetMachineMaintenanceList();

                } else {
                    toastr.error("Save failed for contact person details.");
                }
            }).catch(function (error) {
                toastr.error(error.Msg || "An error occurred while saving contact person details.");
            });
        }
    });
}
function CloseModalDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');
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
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}
function triggerFileInputClick() {
    document.getElementById('txtSectionInchargeSignature').click();
}
function FileUploadChange(event) {
    const target = event.target;
    files = target.files;
    fileName = files?.[0]?.name;
    var code = $('#hftxtCode').val();
    var isEditMode = code && code !== '0' && code !== 0;
    var isDoneMode = $('#txtEntryNo').prop('readonly') === true && code && code !== '0' && code !== 0;

    if (files && files.length > 0) {
        OptimizeImage.reduceFileSize(files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {
            ConvertFileToByteArry(blob).then(function (ByteArray) {
                imageBase64Data = ByteArray;
                if (isEditMode || isDoneMode) {
                    $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: flex !important;').show();
                } else {
                    $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: none !important;').hide();
                }
            })
        });
        $('#imgPreview').attr('src', '');
        $('#imgPreviewContainer').hide();
    } else {
        if ((isEditMode || isDoneMode) && existingImageData && existingImageData.length > 0) {
            DisplayImageFromByteArray(existingImageData);
            $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: flex !important;').show();
        } else {
            $('#imgPreview').attr('src', '');
            $('#imgPreviewContainer').hide();
            if (!isEditMode && !isDoneMode) {
                $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: none !important;').hide();
            }
        }
    }
}
function ConvertFileToByteArry(File) {
    return new Promise(function (resolve, reject) {
        var fileByteArray = [];
        var reader = new FileReader();

        reader.readAsArrayBuffer(File);
        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) {
                var arrayBuffer = evt.target.result,
                    array = new Uint8Array(arrayBuffer);
                for (var i = 0; i < array.length; i++) {
                    fileByteArray.push(array[i]);
                }
                resolve(fileByteArray);
            }
        }
    });
}
function LoadExistingImage(data) {
    existingImageData = [];
    existingFileName = '';
    imageBase64Data = [];
    fileName = '';

    var imageData = null;
    var imageFileName = '';

    if (data.DocumentContent && Array.isArray(data.DocumentContent) && data.DocumentContent.length > 0) {
        imageData = data.DocumentContent;
        imageFileName = data.DocumentName || data.attachFileName || '';
    }
    else if (data.attachData && Array.isArray(data.attachData) && data.attachData.length > 0) {
        imageData = data.attachData;
        imageFileName = data.attachFileName || data.DocumentName || '';
    }
    else if (data.ImageData && Array.isArray(data.ImageData) && data.ImageData.length > 0) {
        imageData = data.ImageData;
        imageFileName = data.ImageFileName || data.FileName || '';
    }

    if (!imageData && data.ImageDataBase64 && typeof data.ImageDataBase64 === 'string' && data.ImageDataBase64.length > 0) {
        try {
            var binaryString = atob(data.ImageDataBase64);
            imageData = [];
            for (var i = 0; i < binaryString.length; i++) {
                imageData.push(binaryString.charCodeAt(i));
            }
            imageFileName = data.DocumentName || data.attachFileName || '';
        } catch (e) {
            console.error('Error converting base64 to byte array:', e);
        }
    }

    if (imageData && imageData.length > 0) {
        existingImageData = imageData;
        existingFileName = imageFileName;

        DisplayImageFromByteArray(imageData);
    } else {
        $('#imgPreview').attr('src', '');
        $('#imgPreviewContainer').hide();
        $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: none !important;').hide();
    }
}
function DisplayImageFromByteArray(byteArray) {
    try {
        if (!byteArray || byteArray.length === 0) {
            $('#imgPreview').hide().attr('src', '');
            return;
        }

        var binaryString = '';
        var chunkSize = 8192;
        for (var i = 0; i < byteArray.length; i += chunkSize) {
            var chunk = byteArray.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, chunk);
        }
        var base64String = btoa(binaryString);
        var imageSrc = 'data:image/jpeg;base64,' + base64String;

        var code = $('#hftxtCode').val();
        var isDoneMode = $('#txtEntryNo').prop('readonly') === true && code && code !== '0' && code !== 0;

        if (!isDoneMode) {
            $('#imgPreview').attr('src', imageSrc);
            $('#imgPreviewContainer').show();
        } else {
            $('#imgPreview').attr('src', '');
            $('#imgPreviewContainer').hide();
        }

        setTimeout(function () {
            var eyeIcon = $('#viewImageBtn');
            if (eyeIcon.length) {
                eyeIcon.removeAttr('style');
                eyeIcon.css({
                    'cursor': 'pointer',
                    'height': '28px',
                    'display': 'flex !important'
                }).show();
            }
        }, 50);
    } catch (e) {
        console.error('Error displaying image from byte array:', e);
        $('#imgPreview').attr('src', '');
        $('#imgPreviewContainer').hide();
        $('#viewImageBtn').css('display', 'none !important').hide();
    }
}
function ConvertByteArrayToImageSrc(byteArray, imageType) {
    try {
        if (!byteArray || byteArray.length === 0) {
            return null;
        }

        if (!imageType) {
            imageType = 'image/jpeg';
        }

        var binaryString = '';
        var chunkSize = 8192; // Process in chunks to avoid stack overflow
        for (var i = 0; i < byteArray.length; i += chunkSize) {
            var chunk = byteArray.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, chunk);
        }
        var base64String = btoa(binaryString);
        return 'data:' + imageType + ';base64,' + base64String;
    } catch (e) {
        console.error('Error converting byte array to image:', e);
        return null;
    }
}
function GetImageTypeFromFileName(fileName) {
    if (!fileName) {
        return 'image/jpeg';
    }

    var extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        default:
            return 'image/jpeg'; // Default fallback
    }
}
function CloseImageModal() {
    $('#imgModal').modal('hide');
    $('#imgModalImage').attr('src', '').hide();
    $('#imgModalLoading').show();
}
function ViewAttachedImage() {
    var code = $('#hftxtCode').val();
    var imgTitle = 'Attached Image';
    if (existingFileName) {
        imgTitle = existingFileName;
    } else if (fileName) {
        imgTitle = fileName;
    } else if ($('#txtEntryNo').val()) {
        imgTitle = 'Image - Entry No: ' + $('#txtEntryNo').val();
    }

    var hasExisting = existingImageData && existingImageData.length > 0;
    var previewSrc = $('#imgPreview').attr('src');
    var hasPreview = previewSrc && previewSrc !== '' && previewSrc !== '#';
    var hasNewFile = imageBase64Data && imageBase64Data.length > 0;
    var hasCode = code && code !== '0' && code !== 0;

    if (!hasExisting && !hasPreview && !hasNewFile && !hasCode) {
        toastr.warning("No image attached to view.");
        return;
    }

    if (hasExisting) {
        console.log('Using existingImageData');
        try {
            var imageSrc = ConvertByteArrayToImageSrc(existingImageData, 'image/jpeg');
            $('#imgModalLoading').show();
            $('#imgModalImage').hide();
            $('#imgModal').modal('show');
            setTimeout(function () {
                $('#imgModalLoading').hide();
                $('#imgModalImage').attr('src', imageSrc).show();
                $('#imgModalTitle').text(imgTitle);
            }, 300);
            return;
        } catch (e) {
            console.error('Error converting existing image data:', e);
        }
    }

    if (hasPreview) {
        console.log('Using preview image');
        $('#imgModalLoading').show();
        $('#imgModalImage').hide();
        $('#imgModal').modal('show');
        setTimeout(function () {
            $('#imgModalLoading').hide();
            $('#imgModalImage').attr('src', previewSrc).show();
            $('#imgModalTitle').text(imgTitle);
        }, 300);
        return;
    }

    if (hasNewFile) {
        console.log('Using imageBase64Data (newly selected file)');
        try {
            var imageSrcNew = ConvertByteArrayToImageSrc(imageBase64Data, 'image/jpeg');
            $('#imgModalLoading').show();
            $('#imgModalImage').hide();
            $('#imgModal').modal('show');
            setTimeout(function () {
                $('#imgModalLoading').hide();
                $('#imgModalImage').attr('src', imageSrcNew).show();
                $('#imgModalTitle').text(imgTitle);
            }, 300);
            return;
        } catch (e) {
            console.error('Error converting imageBase64Data:', e);
        }
    }

    if (hasCode) {
        console.log('Fetching from backend with code:', code);
        MachineMaintenanceService.GetMachineMaintenanceImageByCode(code, G_Status).then(function (response) {
            console.log('Backend response:', response);

            if (!response || response.length === 0) {
                console.log('No response or empty response');
                var imgSrcFallback = $('#imgPreview').attr('src');
                if (imgSrcFallback && imgSrcFallback !== '' && imgSrcFallback !== '#') {
                    $('#imgModalLoading').show();
                    $('#imgModalImage').hide();
                    $('#imgModal').modal('show');
                    $('#imgModalLoading').hide();
                    $('#imgModalImage').attr('src', imgSrcFallback).show();
                    $('#imgModalTitle').text(imgTitle);
                    return;
                }
                if (existingImageData && existingImageData.length > 0) {
                    try {
                        var imageSrcFallbackExisting = ConvertByteArrayToImageSrc(existingImageData, 'image/jpeg');
                        $('#imgModalLoading').show();
                        $('#imgModalImage').hide();
                        $('#imgModal').modal('show');
                        $('#imgModalLoading').hide();
                        $('#imgModalImage').attr('src', imageSrcFallbackExisting).show();
                        $('#imgModalTitle').text(imgTitle);
                        return;
                    } catch (e) {
                        console.error('Error converting existing image data:', e);
                    }
                }
                toastr.warning("No image found for this record.");
                return;
            }

            var data = response[0] || response;
            console.log('Response data:', data);
            console.log('Data keys:', Object.keys(data || {}));

            var imageSrc = null;
            var imageType = 'image/jpeg';

            if (data.DocumentName) {
                imageType = GetImageTypeFromFileName(data.DocumentName);
                if (!existingFileName || existingFileName === '') {
                    imgTitle = data.DocumentName;
                }
            }

            if (data.DocumentContent) {
                console.log('Found DocumentContent, type:', typeof data.DocumentContent, 'isArray:', Array.isArray(data.DocumentContent));
                if (Array.isArray(data.DocumentContent) && data.DocumentContent.length > 0) {
                    imageSrc = ConvertByteArrayToImageSrc(data.DocumentContent, imageType);
                    console.log('Converted DocumentContent to imageSrc');
                } else if (typeof data.DocumentContent === 'string' && data.DocumentContent.length > 0) {
                    if (data.DocumentContent.startsWith('data:')) {
                        imageSrc = data.DocumentContent;
                    } else {
                        imageSrc = 'data:' + imageType + ';base64,' + data.DocumentContent;
                    }
                    console.log('Using DocumentContent as base64 string');
                }
            }
            else if (data.attachData) {
                console.log('Found attachData, type:', typeof data.attachData, 'isArray:', Array.isArray(data.attachData));
                if (Array.isArray(data.attachData) && data.attachData.length > 0) {
                    imageSrc = ConvertByteArrayToImageSrc(data.attachData, imageType);
                    console.log('Converted attachData to imageSrc');
                }
            }
            else if (data.ImageData) {
                console.log('Found ImageData, type:', typeof data.ImageData, 'isArray:', Array.isArray(data.ImageData));
                if (Array.isArray(data.ImageData) && data.ImageData.length > 0) {
                    imageSrc = ConvertByteArrayToImageSrc(data.ImageData, imageType);
                    console.log('Converted ImageData to imageSrc');
                }
            }
            else if (data.ImageDataBase64 && typeof data.ImageDataBase64 === 'string' && data.ImageDataBase64.length > 0) {
                console.log('Found ImageDataBase64');
                imageSrc = 'data:' + imageType + ';base64,' + data.ImageDataBase64;
            }

            console.log('Final imageSrc:', imageSrc ? 'Found' : 'Not found');

            if (imageSrc) {
                $('#imgModalLoading').show();
                $('#imgModalImage').hide();
                $('#imgModal').modal('show');
                $('#imgModalLoading').hide();
                $('#imgModalImage').attr('src', imageSrc).show();
                $('#imgModalTitle').text(imgTitle);
                console.log('Image displayed successfully');
            } else {
                var imgSrc2 = $('#imgPreview').attr('src');
                if (imgSrc2 && imgSrc2 !== '' && imgSrc2 !== '#') {
                    $('#imgModalLoading').show();
                    $('#imgModalImage').hide();
                    $('#imgModal').modal('show');
                    $('#imgModalLoading').hide();
                    $('#imgModalImage').attr('src', imgSrc2).show();
                    $('#imgModalTitle').text(imgTitle);
                } else if (existingImageData && existingImageData.length > 0) {
                    try {
                        var fallbackSrc = ConvertByteArrayToImageSrc(existingImageData, 'image/jpeg');
                        $('#imgModalLoading').show();
                        $('#imgModalImage').hide();
                        $('#imgModal').modal('show');
                        $('#imgModalLoading').hide();
                        $('#imgModalImage').attr('src', fallbackSrc).show();
                        $('#imgModalTitle').text(imgTitle);
                    } catch (e) {
                        console.error('Error converting existing image data:', e);
                        toastr.warning("No image found for this record.");
                    }
                } else {
                    toastr.warning("No image found for this record.");
                }
            }
        }).catch(function (error) {
            console.error('Error fetching image from backend:', error);
            $('#imgModalLoading').hide();

            if (existingImageData && existingImageData.length > 0) {
                console.log('Using existingImageData as fallback');
                try {
                    var fallbackSrc2 = ConvertByteArrayToImageSrc(existingImageData, 'image/jpeg');
                    $('#imgModalLoading').show();
                    $('#imgModalImage').hide();
                    $('#imgModal').modal('show');
                    $('#imgModalLoading').hide();
                    $('#imgModalImage').attr('src', fallbackSrc2).show();
                    $('#imgModalTitle').text(imgTitle);
                    return;
                } catch (e) {
                    console.error('Error converting existing image data:', e);
                }
            }

            var imgSrc3 = $('#imgPreview').attr('src');
            if (imgSrc3 && imgSrc3 !== '' && imgSrc3 !== '#') {
                console.log('Using preview as fallback');
                $('#imgModalLoading').show();
                $('#imgModalImage').hide();
                $('#imgModal').modal('show');
                $('#imgModalLoading').hide();
                $('#imgModalImage').attr('src', imgSrc3).show();
                $('#imgModalTitle').text(imgTitle);
            } else {
                toastr.error(error.Msg || "Error fetching image from backend.");
            }
        });
    }
}
function setCurrentRequestTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = hours + ':' + minutes;

    const input = document.getElementById('txtRequestTime');
    const container = document.getElementById('txthideRequestTime');
    if (container) {
        container.style.display = '';
    }
    if (input) {
        input.value = timeString;
    }
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
window.triggerFileInputClick = triggerFileInputClick;
window.FileUploadChange = FileUploadChange;
window.CloseImageModal = CloseImageModal;
window.ViewAttachedImage = ViewAttachedImage;
window.GetStatusMasterList = GetStatusMasterList;
window.Assign = Assign;
window.Close = Close;
window.CheckPermission = CheckPermission;
window.setCurrentRequestTime = setCurrentRequestTime;
window.GetEmployeeMasterList = GetEmployeeMasterList;
window.GetEmployeeMasterListBrackDown = GetEmployeeMasterListBrackDown;



