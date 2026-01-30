import { PDIService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PDIService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let files = [];
let fileName = '';
let imageBase64Data = [];
let G_PDIOrderData = []; // Store the complete order data
let G_IsUpdating = false; // Flag to prevent infinite loop
let G_PDIImageData = null; // Store the fetched PDI image data
let G_PDIImageSrc = '';
let G_PDIDataList = [];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetPDIOrderList();
    setCurrentDate();
    GetPDICurrentList();
    $('#ddlOrderNo').on('change', onOrderNoChange);
    $('#ddlDespatchNo').on('change', onAdviceNoChange);
    $('#ddlTruckNo').on('change', onTruckNoChange);
    
    $('#btnSave').on('click', savePDI);
    $('#btnClear').on('click', clearPDIForm);
    $('#btnPDIShow').on('click', GetPDICurrentList);
    $('#btnUpdate').on('click', UpdatePDI);
});
function setCurrentDate() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
        $('#txtFromDatePDI').val(formatDate(firstOfMonth));
        $('#txtToDatePDI').val(formatDate(today));
}
function GetPDIOrderList() {
    Showloader();
    PDIService.GetPDIOrderList().then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            G_PDIOrderData = response;
            
            BindSelectList($('#ddlOrderNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item.OrderNo 
            })));

            BindSelectList($('#ddlDespatchNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item.DespatchAdviceNo 
            })));

            BindSelectList($('#ddlTruckNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item["Vehical No"] || item.VehicalNo || item.TruckNo || '' 
            })));

            $('#ddlOrderNo').select2({
                placeholder: 'Select Order No',
                allowClear: false,
                width: '100%'
            });

            $('#ddlDespatchNo').select2({
                placeholder: 'Select Advice No',
                allowClear: false,
                width: '100%'
            });
            
            $('#ddlTruckNo').select2({
                placeholder: 'Select Truck No',
                allowClear: false,
                width: '100%'
            });

        } else {
            toastr.error('No PDI orders available');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error('Error fetching PDI order list: ' + error);
    });
}
function onOrderNoChange() {
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlOrderNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        G_IsUpdating = true;
        
        $('#ddlDespatchNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlTruckNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord?.["Qty MT"]);
        
        checkPDIUploadStatus(selectedRecord);
        
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}
function onAdviceNoChange() {
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlDespatchNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        G_IsUpdating = true;
        
        $('#ddlOrderNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlTruckNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord?.["Qty MT"]);
        
        checkPDIUploadStatus(selectedRecord);
        
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}
function onTruckNoChange() {
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlTruckNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        G_IsUpdating = true;
        
        $('#ddlOrderNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlDespatchNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord?.["Qty MT"]);
        
        checkPDIUploadStatus(selectedRecord);
        
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}
function triggerFileInputClick() {
    document.getElementById('fileInput').click();
}
function FileUploadChange(event) {
    const target = event.target;
    files = target.files;
    var originalFileName = files?.[0]?.name || '';
    if (files && files.length > 0) {
        var fileExtension = '';
        var lastDotIndex = originalFileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < originalFileName.length - 1) {
            fileExtension = originalFileName.substring(lastDotIndex);
        }
        fileName = 'PDI' + fileExtension;
        OptimizeImage.reduceFileSize(files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {
            ConvertFileToByteArry(blob).then(function (ByteArray) {
                imageBase64Data = ByteArray;
            }).catch(function(error) {
                toastr.error('Error processing image file');
            });
        });
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
function validateNumericInput(input) {
    var value = input.value;
    value = value.replace(/[^0-9.]/g, '');
    
    var parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].substring(0, 3);
    }
    
    input.value = value;
}
function validatePDIInputs() {
    if (!$('#ddlDespatchNo').val() || $('#ddlDespatchNo').val() === '0') { toastr.error('Despatch Advice No is required'); return false; }
    if (!$('#ddlOrderNo').val() || $('#ddlOrderNo').val() === '0') { toastr.error('Order No is required'); return false; }
    if (!$('#ddlTruckNo').val() || $('#ddlTruckNo').val() === '0') { toastr.error('Truck No is required'); return false; }
    var qtyValue = $('#ddlQty').val();
    if (!qtyValue || qtyValue.trim() === '' || parseFloat(qtyValue) <= 0) { toastr.error('Quantity is required and must be greater than 0'); return false; }
    if (!/^\d+(\.\d{1,3})?$/.test(qtyValue)) { toastr.error('Quantity must be a valid number with maximum 3 decimal places'); return false; }
    if (!imageBase64Data || imageBase64Data.length === 0) { toastr.error('Please select an image file'); return false; }
    if (!fileName || fileName === '') { toastr.error('File name is missing'); return false; }
    return true;
}
function validatePDIInputsEdit() {
    if (!$('#txtDespatchNo').val() || $('#txtDespatchNo').val() === '0') { toastr.error('Despatch Advice No is required'); return false; }
    if (!$('#txtOrderNo').val() || $('#txtOrderNo').val() === '0') { toastr.error('Order No is required'); return false; }
    if (!$('#txtTruckNo').val() || $('#txtTruckNo').val() === '0') { toastr.error('Truck No is required'); return false; }
    var qtyValue = $('#txtQty').val();
    if (!qtyValue || qtyValue.trim() === '' || parseFloat(qtyValue) <= 0) { toastr.error('Quantity is required and must be greater than 0'); return false; }
    if (!/^\d+(\.\d{1,3})?$/.test(qtyValue)) { toastr.error('Quantity must be a valid number with maximum 3 decimal places'); return false; }
    return true;
}
function savePDI() {
    if (!validatePDIInputs()) { return; }

    var PayloadPDIData = {
        Code: $('#ddlOrderNo').val(), 
        PDIWeight: $('#ddlQty').val(), 
        PDIRemark: $('#txtRemark').val() || '',
        attachFileName: fileName,
        attachData: imageBase64Data,
    };

    Showloader();
    PDIService.SavePDIData(PayloadPDIData).then(function (response) {
        HideLoader();
        if (response.Status === 'Y') {
            toastr.success(response.Message || 'PDI saved successfully');
            clearPDIForm();
            GetPDICurrentList();
        } else {
            toastr.error(response.Message || 'Save failed');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && error.Message) || 'Error saving data');
    });
}
function UpdatePDI() {
    if (!validatePDIInputsEdit()) { return; }

    var PayloadPDIData = {
        Code: $('#txtOrderNo_Code').val(), 
        PDIWeight: $('#txtQty').val(), 
        PDIRemark: $('#txtEditRemark').val() || '',
        attachFileName: fileName,
        attachData: imageBase64Data,
    };

    Showloader();
    PDIService.SavePDIData(PayloadPDIData).then(function (response) {
        HideLoader();
        if (response.Status === 'Y') {
            toastr.success(response.Message || 'PDI Update successfully');
            clearPDIForm();
            $('#LocatePDI').show();
            $('#createPDI').hide();
            $('#EditPDI').hide();
            GetPDICurrentList();
        } else {
            toastr.error(response.Message || 'Update failed');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && error.Message) || 'Error Update data');
    });
}
//function ViewAttachment() {
//    var DespatchAdviceMaster_Code = $("#ddlOrderNo").val();
    
//    // Check if an Order No is selected
//    if (DespatchAdviceMaster_Code && DespatchAdviceMaster_Code !== '0' && parseFloat(DespatchAdviceMaster_Code) > 0) {
//        InitAttachmentControl('DespatchAdviceMaster', 0, 'DespatchAdviceMaster', DespatchAdviceMaster_Code, 0, '', "all");
//    } else {
//        toastr.warning('Please select an Order No first');
//    }
//}
//function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
//    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
//    $('#DespatchAdviceMaster_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
//}

function clearPDIForm() {
    $('#ddlOrderNo').val('0').trigger('change');
    $('#ddlDespatchNo').val('0').trigger('change');
    $('#ddlTruckNo').val('0').trigger('change');
    $('#ddlQty').val('0');
    $('#txtRemark').val('');
    $('#txtOrderNo_Code').val(0);
    $('#txtOrderNo').val('0').trigger('change');
    $('#txtDespatchNo').val('0').trigger('change');
    $('#txtTruckNo').val('0').trigger('change');
    $('#txtQty').val('');
    $('#txtEditRemark').val('');
    
    imageBase64Data = [];
    fileName = '';
    files = [];
    
    $('#fileInput').val('');
    $('#fileInputEdit').val('');
    
    hideImageCheck();
}
function checkPDIUploadStatus(selectedRecord) {
    if (selectedRecord.PDIUploaded === 'Y') {
        showImageCheck();
        fetchPDIImage(selectedRecord.Code);
    } else {
        hideImageCheck();
    }
}
function showImageCheck() {
    $('#txtImageCheck').show();
}
function hideImageCheck() {
    G_PDIImageData = null;
    G_PDIImageSrc = '';
    $('#txtImageCheck').hide();
}
function fetchPDIImage(despatchAdviceCode) {
    $('#txtImageCheck').hide();
    G_PDIImageSrc = '';
    PDIService.GetPDIImage(despatchAdviceCode).then(function(data) {
        
        var base64FromApi = null;

        if (data && data.Status === 'Y' && typeof data.ImageDataBase64 === 'string' && data.ImageDataBase64.length > 0) {
            base64FromApi = data.ImageDataBase64;
        }

        if (!base64FromApi && data && data.Status === 'Y' && data.ImageData && Array.isArray(data.ImageData)) {
            try {
                var byteArray = data.ImageData;
                var binaryString = String.fromCharCode.apply(null, byteArray);
                base64FromApi = btoa(binaryString);
            } catch (e1) {
            }
        }

        if (!base64FromApi && Array.isArray(data) && data.length > 0 && typeof data[0].DocumentContent === 'string') {
            base64FromApi = data[0].DocumentContent;
        }
        if (!base64FromApi && Array.isArray(data) && data.length > 0 && Array.isArray(data[0].DocumentContent)) {
            try {
                var bytes = data[0].DocumentContent;
                var bin = String.fromCharCode.apply(null, bytes);
                base64FromApi = btoa(bin);
            } catch (e2) {
            }
        }

        if (base64FromApi && base64FromApi.length > 0) {
            G_PDIImageSrc = 'data:image/jpeg;base64,' + base64FromApi;
            $('#txtImageCheck').show();
        } else {
            $('#txtImageCheck').hide();
        }
    }).catch(function(error) {
        G_PDIImageData = null;
        G_PDIImageSrc = '';
        $('#txtImageCheck').hide();
    });
}
function ShowPDIImage() {
    if (!G_PDIImageSrc || G_PDIImageSrc === '') {
        toastr.warning('No image to display');
        return;
    }
    var $img = $('#myModalImageTag');
    var $dialog = $('#myModalImageShow .modal-dialog');
    var $body = $('#myModalImageShow .modal-body');

    $dialog.css({ maxWidth: '', width: '' });
    $body.css({ maxHeight: '', overflowY: '' });
    $img.css({ maxWidth: '100%', height: 'auto' });

    $img.off('load').on('load', function () {
        var naturalW = this.naturalWidth || 0;
        var naturalH = this.naturalHeight || 0;

        var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        var maxW = Math.floor(vw * 0.9); // 90% viewport width
        var maxH = Math.floor(vh * 0.85); // 85% viewport height

        var modalW = naturalW > 0 ? Math.min(naturalW, maxW) : maxW;
        var modalH = naturalH > 0 ? Math.min(naturalH, maxH) : maxH;

        $dialog.css({ maxWidth: modalW + 'px' });
        $body.css({ maxHeight: modalH + 'px', overflowY: naturalH > modalH ? 'auto' : 'visible' });
    });

    $img.attr('src', G_PDIImageSrc);
    try {
        var modalElement = document.getElementById('myModalImageShow');
        var modal = window.bootstrap && window.bootstrap.Modal ? new bootstrap.Modal(modalElement) : null;
        if (modal) {
            modal.show();
        } else {
            $('#myModalImageShow').modal('show');
        }
    } catch (e) {
        $('#myModalImageShow').modal('show');
    }
}
function CloseModal() {
    try {
        var modalElement = document.getElementById('myModalImageShow');
        var instance = window.bootstrap && window.bootstrap.Modal ? bootstrap.Modal.getInstance(modalElement) : null;
        if (instance) {
            instance.hide();
        } else {
            $('#myModalImageShow').modal('hide');
        }
    } catch (e) {
        $('#myModalImageShow').modal('hide');
    }
}
function DeleteModal() {
    CloseModal();
}
function BindSelectList(element, list) {
    let option = '<option value="0">Please select...</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function CreateNew() {
    var ModuleName = "PDI",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#LocatePDI').hide();
            $('#EditPDI').hide();
            $('#createPDI').show();
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
function Back() {
    clearPDIForm();
    $('#LocatePDI').show();
    $('#createPDI').hide();
    $('#EditPDI').hide();
}
function GetPDICurrentList() {
    let Fromdate = $('#txtFromDatePDI').val();
    let Todate = $('#txtToDatePDI').val();
    Showloader();
    PDIService.GetPDICurrentList(Fromdate, Todate).then(function (response) {
        if (response && response.length > 0) {
            $('#tblPDI').show();
            $('#paginator-tblPDI').show();
            G_PDIDataList = response;
            HideLoader();
            const stringFilterColumn = ["Order No","Vehical No"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const columnAlignment = {
                'S.No.': "center", 'Date': "center",'Qty MT':"right"
            };
            const updatedResponse = (response).map(function (item) {
                let imageURLHtml = '<a href="javascript:void(0);" class="text-decoration-underline icon-height" title="Image PDI" onclick="ViewAttachment_PDI(' + item.Code + ')">View Image</a>';
                let actionHtml = '<button class="btn btn-primary icon-height mb-1" title="Edit PDI" onclick="EditPDI(' + item.Code + ')"><i class="fa fa-pencil"></i></button>';

                return {
                    ...item,
                    'PDI Uploaded': imageURLHtml,
                    'Action': actionHtml,
                };
            });
            const TotalColumns = ["Qty MT"];
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false, TotalColumns);
        } else {
            $('#tblPDI').hide();
            $('#paginator-tblPDI').hide();
            toastr.error('No Data Found');
            HideLoader();
        }

    }).catch(function (error) {
        $('#tblPDI').hide();
        $('#paginator-tblPDI').hide();
        toastr.error(error);
        HideLoader();
    });
}
function Download() {
    const hiddenFields = [
        "Code","PDI Uploaded"
    ];
    ExportToExcelControl.ExportToExcel(G_PDIDataList, hiddenFields, "PDIReport");
}
function ViewAttachment_PDI(Code, sourceDownloadFileName) {
    InitAttachmentControl('DespatchAdviceMaster', Code, '', 0, 0, '', "View", sourceDownloadFileName);

}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#PDI_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode, SourceDownloadFileName: sourceDownloadFileName });
}
function EditPDI(Code) {
    var ModuleName = "PDI",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#LocatePDI').hide();
            $('#createPDI').hide();
            $('#EditPDI').show();
            GetPDIEditList(Code);
        }
    });
}
function GetPDIEditList(Code) {
    PDIService.GetPDIEditList(Code).then(function (response) {
        if (response.length > 0) {
            $('#txtOrderNo_Code').val(response[0].Code);
            $('#txtOrderNo').val(response[0].OrderNo);
            $('#txtDespatchNo').val(response[0].DespatchAdviceNo);
            $('#txtTruckNo').val(response[0].TruckNo);
            $('#txtQty').val(response[0]?.['Qty MT']);
            $('#txtEditRemark').val(response[0].PDIRemark);
        }
    });
}

window.ViewAttachment_PDI = ViewAttachment_PDI;
window.FileUploadChange = FileUploadChange;
window.triggerFileInputClick = triggerFileInputClick;
window.ShowPDIImage = ShowPDIImage;
window.CloseModal = CloseModal;
window.DeleteModal = DeleteModal;
window.CreateNew = CreateNew;
window.Back = Back;
window.Download = Download;
window.validateNumericInput = validateNumericInput;
window.EditPDI = EditPDI;