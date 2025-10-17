import { PDIService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PDIService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';

let G_today = '';

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("PDI");
    }
    setCurrentDate();
    $('#btnSave').on('click', savePDI);
    $('#btnClear').on('click', clearPDIForm);
});


function setCurrentDate() {
    G_today = new Date().toISOString().split('T')[0];
    $('#txtDate').val(G_today);
}

function validatePDIInputs() {
    if (!$('#txtEmail').val()) { toastr.error('Email is required'); return false; }
    if (!$('#txtDate').val()) { toastr.error('Date is required'); return false; }
    if (!$('#txtOrderNo').val()) { toastr.error('Order No is required'); return false; }
    if (!$('#txtTruckNo').val()) { toastr.error('Truck No is required'); return false; }
    if (!$('#txtQty').val()) { toastr.error('Quantity is required'); return false; }
    if (!$('#filePDIReport')[0].files.length) { toastr.error('PDI Report is required'); return false; }
    return true;
}

function savePDI() {
    if (!validatePDIInputs()) { return; }

    var formData = new FormData();
    formData.append('Email', $('#txtEmail').val());
    formData.append('RecordEmail', $('#chkRecordEmail').is(':checked'));
    formData.append('Date', $('#txtDate').val());
    formData.append('OrderNo', $('#txtOrderNo').val());
    formData.append('TruckNo', $('#txtTruckNo').val());
    formData.append('QuantityInMT', $('#txtQty').val());
    formData.append('Remark', $('#txtRemark').val());
    formData.append('PDIReport', $('#filePDIReport')[0].files[0]);

    
}

function clearPDIForm() {
    $('#txtEmail').val('');
    $('#chkRecordEmail').prop('checked', false);
    setCurrentDate();
    $('#txtOrderNo').val('');
    $('#txtTruckNo').val('');
    $('#txtQty').val('');
    $('#filePDIReport').val('');
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