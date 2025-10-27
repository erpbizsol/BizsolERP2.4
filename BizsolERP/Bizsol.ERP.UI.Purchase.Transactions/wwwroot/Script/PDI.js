import { PDIService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PDIService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_today = '';
let G_PDIOrderData = []; // Store the complete order data
let G_IsUpdating = false; // Flag to prevent infinite loop

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("PDI");
    }
    setCurrentDate();
    GetPDIOrderList();
    
    // Event handlers for dropdowns
    $('#ddlOrderNo').on('change', onOrderNoChange);
    $('#ddlTruckNo').on('change', onTruckNoChange);
    
    $('#btnSave').on('click', savePDI);
    $('#btnClear').on('click', clearPDIForm);
});


function setCurrentDate() {
    G_today = new Date().toISOString().split('T')[0];
    $('#txtDate').val(G_today);
}
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
        return;
    }
    
    // Find the matching record by Code
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        // Set flag to prevent infinite loop
        G_IsUpdating = true;
        
        // Auto-select the corresponding Truck No and Qty (all have same Code)
        $('#ddlTruckNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord.Code).trigger('change.select2');
        
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
        return;
    }
    
    // Find the matching record by Code
    var selectedRecord = G_PDIOrderData.find(item => item.Code == selectedCode);
    
    if (selectedRecord) {
        // Set flag to prevent infinite loop
        G_IsUpdating = true;
        
        // Auto-select the corresponding Order No and Qty (all have same Code)
        $('#ddlOrderNo').val(selectedRecord.Code).trigger('change.select2');
        $('#ddlQty').val(selectedRecord.Code).trigger('change.select2');
        
        // Reset flag after a short delay
        setTimeout(function() {
            G_IsUpdating = false;
        }, 100);
    }
}

function validatePDIInputs() {
    if (!$('#txtDate').val()) { toastr.error('Date is required'); return false; }
    if (!$('#ddlOrderNo').val() || $('#ddlOrderNo').val() === '0') { toastr.error('Order No is required'); return false; }
    if (!$('#ddlTruckNo').val() || $('#ddlTruckNo').val() === '0') { toastr.error('Truck No is required'); return false; }
    if (!$('#ddlQty').val() || $('#ddlQty').val() === '0') { toastr.error('Quantity is required'); return false; }
    // Note: PDI Report attachment is optional or validated through attachment control
    return true;
}

function savePDI() {
    if (!validatePDIInputs()) { return; }

    // Prepare payload data
    var PayloadPDIData = {
        Code: $('#ddlOrderNo').val(), 
        PDIRemark: $('#txtRemark').val() || ''
    };

    Showloader();
    PDIService.SavePDIData(PayloadPDIData).then(function (response) {
        HideLoader();
        if (response.Status === 'Y') {
            toastr.success(response.Message || 'PDI saved successfully');
            clearPDIForm();
        } else {
            toastr.error(response.Message || 'Save failed');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && error.Message) || 'Error saving data');
    });
}
function ViewAttachment() {
    var DespatchAdviceMaster_Code = $("#ddlOrderNo").val();
    
    // Check if an Order No is selected
    if (DespatchAdviceMaster_Code && DespatchAdviceMaster_Code !== '0' && parseFloat(DespatchAdviceMaster_Code) > 0) {
        InitAttachmentControl('DespatchAdviceMaster', 0, 'DespatchAdviceMaster', DespatchAdviceMaster_Code, 0, '', "all");
    } else {
        toastr.warning('Please select an Order No first');
    }
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#DespatchAdviceMaster_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}

function clearPDIForm() {
    setCurrentDate();
    $('#ddlOrderNo').val('0').trigger('change');
    $('#ddlTruckNo').val('0').trigger('change');
    $('#ddlQty').val('0').trigger('change');
    $('#txtRemark').val('');
}
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

window.ViewAttachment = ViewAttachment;