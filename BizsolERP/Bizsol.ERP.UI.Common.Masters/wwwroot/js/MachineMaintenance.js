import { MachineMaintenanceService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MachineMaintenanceService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
let files = [];

let fileName = '';
let imageBase64Data = [];
let existingImageData = []; // Store existing image data during edit
let existingFileName = ''; // Store existing file name during edit

var baseUrl = sessionStorage.getItem('AppBaseURL');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
var G_UserName = UserDetails[0].UserName;
var G_Status = 'SAVE';
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    $("#txtPreparedBy").val(G_UserName);
    GetMachineMaintenanceList();
    GetReasonMaster();
    GetDepartmentMasterList();
    GetMachineMasterList();
    GetStatusMasterList();
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
function GetStatusMasterList() {

    MachineMaintenanceService.GetStatusMaster().then(function (resObj) {
        BindSelectList($('#ddlStatus')[0], resObj.map((item) => ({ Code: item.Value, Desp: item.Value })));
        $('#ddlStatus').select2({
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
            const StringFilterColumn = ["Status", "Reason", "Department", "Machine No"];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "Job Assigned", "Request Date", "Work Start Date", "Machine Failed Date", "Failed Remark", "Start Remark", "Description"];
            const ColumnAlignment = {
                "Entry No": "right;;width:15px;",
                "Action": ";width:50px;",
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="Edit(${item.Code})"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete(${item.Code})" ><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="Updated Status"  onclick="Done(${item.Code})">Updated Status</button>
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
    $('#txtEntryNo').val('').prop('readonly', true);
    $('#txtEntryDate').val(getTodayDateForInput()).prop('readonly', true);
    $('#txtRequestDate').val(getTodayDateForInput()).prop('readonly', false);
    $('#ddlStatus').prop('readonly', false);
    $('#txtMCFailedDate').val(getTodayDateForInput()).prop('readonly', false);
    $('#txtMCFailedTime').val('').prop('readonly', false);
    $('#txtJobAssignedTo').val('').prop('readonly', false);

    $('#txtddlMachineNo').prop('disabled', false);
    $('#txtddlComplaintDepartment').prop('disabled', false);
    $('#txtddlComplaintReason').prop('disabled', false);
    SelectOptionByText('txtddlMachineNo', "select");
    SelectOptionByText('txtddlComplaintDepartment', "select");
    SelectOptionByText('txtddlComplaintReason', "select");
    SelectOptionByText('ddlStatus', "select");
    $("#txtRemark").val("");
    $("#txtDescriptionWorkDone").val("");
    $("#txtERemark").val("");
    $('#txtMachineStartDate').val(getTodayDateForInput());
    $('#txtMachineStartTime').val('');

    $("#txthideMachineStartDate").hide();
    $("#txthideMachineStartTime").hide();
    $("#txthideRemark").hide();
    $("#txthideDescriptionWorkDone").hide();
    $("#txtdRemark").show();
    $("#txtSectionInchargeSignature").val('');

    files = [];
    fileName = '';
    imageBase64Data = [];
    existingImageData = [];
    existingFileName = '';
    $('#imgPreview').attr('src', '');
    $('#imgPreviewContainer').hide();
    $('#viewImageBtn').attr('style', 'cursor: pointer; height: 28px; display: none !important;').hide();
}
function getTodayDateForInput() {
    var today = new Date();
    var month = (today.getMonth() + 1).toString().padStart(2, '0');
    var day = today.getDate().toString().padStart(2, '0');
    return today.getFullYear() + '-' + month + '-' + day;
}
function SaveMachineMaintenance() {
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
            var workStartDate = $("#txtMachineStartDate").val().trim();
            if (workStartDate === "") {
                workStartDate = null;
            }

            var workStartTime = $("#txtMachineStartTime").val().trim();
            if (workStartTime === "") {
                workStartTime = null;
            }

            var finalFileName = fileName || existingFileName;
            var finalImageData = (imageBase64Data && imageBase64Data.length > 0) ? imageBase64Data : existingImageData;

            let payload = [{
                Code: $("#hftxtCode").val() || 0,
                EntryNo: $("#txtEntryNo").val() || 0,
                EntryDate: $("#txtEntryDate").val().trim(),
                RequestDate: $("#txtRequestDate").val().trim(),
                MachineMaster_Code: $("#txtddlMachineNo").val().trim(),
                DepartmentMaster_Code: $("#txtddlComplaintDepartment").val().trim(),
                Status: $("#ddlStatus").val().trim() || "",
                MachineFailedDate: $("#txtMCFailedDate").val() || "",
                MachineFailedTime: $("#txtMCFailedTime").val() || "",
                JobAssignedTo: $("#txtJobAssignedTo").val() || "",
                ReasonMaster_Code: $("#txtddlComplaintReason").val() || "",
                FailedRemark: $("#txtRemark").val() || "",
                WorkStartDate: workStartDate,
                WorkStartTime: workStartTime,
                DescriptionofWorkDone: $("#txtDescriptionWorkDone").val() || "",
                StartRemark: $("#txtERemark").val() || "",
                attachFileName: finalFileName,
                attachData: finalImageData,
                companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
                UserMaster_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,

            }];

            var isDoneModeForSave = $('#txtEntryNo').prop('readonly') === true && $("#txthideMachineStartDate").is(':visible');
            if (isDoneModeForSave) {
                var startRemarkVal = $("#txtERemark").val().trim();
                var startDateVal = $("#txtMachineStartDate").val().trim();
                var startTimeVal = $("#txtMachineStartTime").val().trim();

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
    });
}

function Edit(Code) {
 
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
           
            $("#dvGrid").hide();
            $("#dvFromNEW").show();
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
                    $('#txtJobAssignedTo').val(data.JobAssignedTo);
                    SelectOptionByText('txtddlComplaintReason', data.ReasonName);
                    $('#txtRemark').val(data.FailedRemark);
                    $("#txtPreparedBy").val(data.CreatedByName);
                   
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
function Done(Code) {
    var ModuleName = "Machine Maintenance Request",
        OptionName = "Edit",
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
                    $('#txtRemark').val(data.FailedRemark);
                    $("#txtPreparedBy").val(data.CreatedByName);
                    SelectOptionByText('ddlStatus',data.Status);
                    $('#txtERemark').val('');
                    $("#txtMachineStartDate").val('');
                    $("#txtMachineStartTime").val('');
                    $('#txtDescriptionWorkDone').val(data.DescriptionofWorkDone || '');

                    LoadExistingImage(data);
                    
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