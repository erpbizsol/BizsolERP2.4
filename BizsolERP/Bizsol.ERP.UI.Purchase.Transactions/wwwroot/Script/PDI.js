import { PDIService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PDIService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let files = [];
let fileName = '';
let imageBase64Data = [];
let G_PDIOrderData = []; // Store the complete order data
let G_IsUpdating = false; // Flag to prevent infinite loop
let G_PDIImageData = null; // Store the fetched PDI image data
let G_PDIImageSrc = '';

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("PDI");
    }
   
    GetPDIOrderList();
    
    // Event handlers for dropdowns
    $('#ddlOrderNo').on('change', onOrderNoChange);
    $('#ddlDespatchNo').on('change', onAdviceNoChange);
    $('#ddlTruckNo').on('change', onTruckNoChange);
    
    $('#btnSave').on('click', savePDI);
    $('#btnClear').on('click', clearPDIForm);
});
function GetPDIOrderList() {
    Showloader();
    PDIService.GetPDIOrderList().then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            // Store the complete data globally for reference
            G_PDIOrderData = response;
            
            // Bind Order No dropdown with OrderNo as display text
            BindSelectList($('#ddlOrderNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item.OrderNo 
            })));

            BindSelectList($('#ddlDespatchNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item.DespatchAdviceNo 
            })));

            // Bind Truck No dropdown with "Vehical No" (note the spelling from API) as display text
            BindSelectList($('#ddlTruckNo')[0], response.map((item) => ({ 
                Code: item.Code, 
                Desp: item["Vehical No"] || item.VehicalNo || item.TruckNo || '' 
            })));

            // Bind Qty dropdown with "Qty MT" as display text (formatted to 3 decimal places)
            BindSelectList($('#ddlQty')[0], response.map((item) => {
                var qtyValue = item["Qty MT"] || item.QtyMT || '0';
                var formattedQty = parseFloat(qtyValue).toFixed(3);
                return { 
                    Code: item.Code, 
                    Desp: formattedQty 
                };
            }));

            // Initialize Select2 for all dropdowns
            $('#ddlOrderNo').select2({
                placeholder: 'Select Order No',
                allowClear: true,
                width: '100%'
            });

            $('#ddlDespatchNo').select2({
                placeholder: 'Select Advice No',
                allowClear: true,
                width: '100%'
            });
            
            $('#ddlTruckNo').select2({
                placeholder: 'Select Truck No',
                allowClear: true,
                width: '100%'
            });

            $('#ddlQty').select2({
                placeholder: 'Select Qty MT',
                allowClear: true,
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
// Auto-complete Truck No and Qty when Order No is selected
function onOrderNoChange() {
    // Prevent infinite loop
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlOrderNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    // Find the matching record by Code
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        // Set flag to prevent infinite loop
        G_IsUpdating = true;
        
        // Auto-select the corresponding Truck No and Qty (all have same Code)
        $('#ddlDespatchNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlTruckNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord.Code).trigger('change.select2');
        
        // Check PDI upload status and show image if available
        checkPDIUploadStatus(selectedRecord);
        
        // Reset flag after a short delay
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}
function onAdviceNoChange() {
    // Prevent infinite loop
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlDespatchNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    // Find the matching record by Code
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        // Set flag to prevent infinite loop
        G_IsUpdating = true;
        
        // Auto-select the corresponding Truck No and Qty (all have same Code)
        $('#ddlOrderNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlTruckNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord.Code).trigger('change.select2');
        
        // Check PDI upload status and show image if available
        checkPDIUploadStatus(selectedRecord);
        
        // Reset flag after a short delay
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}

// Auto-complete Order No and Qty when Truck No is selected
function onTruckNoChange() {
    // Prevent infinite loop
    if (G_IsUpdating) {
        return;
    }
    
    var selectedCode = $('#ddlTruckNo').val();
    
    if (!selectedCode || selectedCode === '0') {
        hideImageCheck();
        return;
    }
    
    // Find the matching record by Code
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        // Set flag to prevent infinite loop
        G_IsUpdating = true;
        
        // Auto-select the corresponding Order No and Qty (all have same Code)
        $('#ddlOrderNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlDespatchNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord.Code).trigger('change.select2');
        
        // Check PDI upload status and show image if available
        checkPDIUploadStatus(selectedRecord);
        
        // Reset flag after a short delay
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
    fileName = files?.[0]?.name;
    if (files && files.length > 0) {
        console.log('File selected:', fileName);
        OptimizeImage.reduceFileSize(files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {
            console.log('Image optimized, size:', blob.size);
            ConvertFileToByteArry(blob).then(function (ByteArray) {
                imageBase64Data = ByteArray;
                console.log('Image converted to byte array, length:', ByteArray.length);
            }).catch(function(error) {
                console.error('Error converting file to byte array:', error);
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
function validatePDIInputs() {
    if (!$('#ddlOrderNo').val() || $('#ddlOrderNo').val() === '0') { toastr.error('Order No is required'); return false; }
    if (!$('#ddlTruckNo').val() || $('#ddlTruckNo').val() === '0') { toastr.error('Truck No is required'); return false; }
    if (!$('#ddlQty').val() || $('#ddlQty').val() === '0') { toastr.error('Quantity is required'); return false; }
    if (!imageBase64Data || imageBase64Data.length === 0) { toastr.error('Please select an image file'); return false; }
    if (!fileName || fileName === '') { toastr.error('File name is missing'); return false; }
    return true;
}

function savePDI() {
    if (!validatePDIInputs()) { return; }

    // Prepare payload data
    var PayloadPDIData = {
        Code: $('#ddlOrderNo').val(), 
        PDIRemark: $('#txtRemark').val() || '',
        attachFileName: fileName,
        attachData: imageBase64Data,
    };

    console.log('Saving PDI data:', {
        Code: PayloadPDIData.Code,
        PDIRemark: PayloadPDIData.PDIRemark,
        attachFileName: PayloadPDIData.attachFileName,
        attachDataLength: PayloadPDIData.attachData.length
    });

    Showloader();
    PDIService.SavePDIData(PayloadPDIData).then(function (response) {
        HideLoader();
        console.log('Save response:', response);
        if (response.Status === 'Y') {
            toastr.success(response.Message || 'PDI saved successfully');
            clearPDIForm();
        } else {
            toastr.error(response.Message || 'Save failed');
        }
    }).catch(function (error) {
        HideLoader();
        console.error('Save error:', error);
        toastr.error((error && error.Message) || 'Error saving data');
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
    // Clear form fields
    $('#ddlOrderNo').val('0').trigger('change');
    $('#ddlDespatchNo').val('0').trigger('change');
    $('#ddlTruckNo').val('0').trigger('change');
    $('#ddlQty').val('0').trigger('change');
    $('#txtRemark').val('');
    
    // Clear image data
    imageBase64Data = [];
    fileName = '';
    files = [];
    
    // Clear file input
    $('#fileInput').val('');
    
    // Hide image check div
    hideImageCheck();
    
    console.log('Form cleared');
}

// Function to check PDI upload status and display image
function checkPDIUploadStatus(selectedRecord) {
    console.log('Checking PDI upload status for record:', selectedRecord);
    
    if (selectedRecord.PDIUploaded === 'Y') {
        showImageCheck();
        // Fetch and store the PDI image data
        fetchPDIImage(selectedRecord.Code);
    } else {
        hideImageCheck();
    }
}

// Function to show image check div
function showImageCheck() {
    $('#divImageCheck').show();
}

// Function to hide image check div
function hideImageCheck() {
    $('#divImageCheck').hide();
    G_PDIImageData = null;
    G_PDIImageSrc = '';
    $('#txtImageCheck').hide();
}

// Function to fetch PDI image
function fetchPDIImage(despatchAdviceCode) {
    console.log('Fetching PDI image for code:', despatchAdviceCode);
    $('#txtImageCheck').hide();
    G_PDIImageSrc = '';
    // Use PDIService to fetch PDI image
    PDIService.GetPDIImage(despatchAdviceCode).then(function(data) {
        console.log('PDI image response:', data);
        
        var base64FromApi = null;

        // Case 1: API returns { Status: 'Y', ImageDataBase64: '...' }
        if (data && data.Status === 'Y' && typeof data.ImageDataBase64 === 'string' && data.ImageDataBase64.length > 0) {
            base64FromApi = data.ImageDataBase64;
        }

        // Case 2: API returns { Status: 'Y', ImageData: byte[] as array of numbers }
        if (!base64FromApi && data && data.Status === 'Y' && data.ImageData && Array.isArray(data.ImageData)) {
            try {
                var byteArray = data.ImageData;
                var binaryString = String.fromCharCode.apply(null, byteArray);
                base64FromApi = btoa(binaryString);
            } catch (e1) {
                console.error('Error converting ImageData array to base64:', e1);
            }
        }

        // Case 3: API returns an array of rows: [{ DocumentContent: base64String }]
        if (!base64FromApi && Array.isArray(data) && data.length > 0 && typeof data[0].DocumentContent === 'string') {
            base64FromApi = data[0].DocumentContent;
        }
        if (!base64FromApi && Array.isArray(data) && data.length > 0 && Array.isArray(data[0].DocumentContent)) {
            try {
                var bytes = data[0].DocumentContent;
                var bin = String.fromCharCode.apply(null, bytes);
                base64FromApi = btoa(bin);
            } catch (e2) {
                console.error('Error converting DocumentContent array to base64:', e2);
            }
        }

        if (base64FromApi && base64FromApi.length > 0) {
            G_PDIImageSrc = 'data:image/jpeg;base64,' + base64FromApi;
            $('#txtImageCheck').show();
        } else {
            $('#txtImageCheck').hide();
        }
    }).catch(function(error) {
        console.error('Error fetching PDI image:', error);
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

    // Reset any previous sizing
    $dialog.css({ maxWidth: '', width: '' });
    $body.css({ maxHeight: '', overflowY: '' });
    $img.css({ maxWidth: '100%', height: 'auto' });

    // Bind load to size modal according to image natural size
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

    // Set src last so load triggers after handlers are attached
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

// No modal behavior; link opens image in new tab
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

//window.ViewAttachment = ViewAttachment;
window.FileUploadChange = FileUploadChange;
window.triggerFileInputClick = triggerFileInputClick;
window.ShowPDIImage = ShowPDIImage;
window.CloseModal = CloseModal;
window.DeleteModal = DeleteModal;