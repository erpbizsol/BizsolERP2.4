import { WeightConfirmationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/WeightConfirmationService.js';
import { WeighmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/WeighmentService.js';

let baseUrl = sessionStorage.getItem('AppBaseURL') || '';
let enableManualWeightByConveyor = 'Y';
let defaultMachineName = '';
let isAutoProcessing = false;

$(document).ready(async function () {
    $("#ERPHeading").text("Weight Confirmation");
    await Promise.all([LoadProcessList(), LoadFixedParameters()]);
});

// ─────────────────────────────────────────────
// Load Process Dropdown + Select2
// ─────────────────────────────────────────────
async function LoadFixedParameters() {
    try {
        let response = await WeightConfirmationService.GetFixedParaMeter();
        if (response && response.length > 0) {
            const param = response.find(x => x.PeramaterName === 'EnableManualWeightByConveyor');
            if (param && param.PeramaterValue) {
                enableManualWeightByConveyor = param.PeramaterValue.toString().trim().toUpperCase();
            }
        }
    } catch (err) {
        enableManualWeightByConveyor = 'Y';
    }
    ApplyActualWeightReadonly();
    if (enableManualWeightByConveyor === 'N') {
        await LoadDefaultMachine();
    }
}

async function LoadDefaultMachine() {
    try {
        let response = await WeighmentService.GetMachinesList();
        if (response && response.length > 0) {
            defaultMachineName = response.length === 1
                ? response[0].MachineNo
                : (response[0].MachineNo || '');
        }
    } catch (err) {
        defaultMachineName = '';
    }
}

function ApplyActualWeightReadonly() {
    const isReadonly = enableManualWeightByConveyor === 'N';
    $('#txtActualWeight').prop('readonly', isReadonly);
}

async function LoadProcessList() {
    try {
        let response = await WeightConfirmationService.GetProcessList();
        let select = $('#ddlProcess');
        select.empty();
        select.append('<option value="0">-- Select Process --</option>');
        if (response && response.length > 0) {
            $.each(response, function (i, item) {
                let code = item.Code ?? item.code ?? item.ProcessMaster_Code ?? item.processMaster_Code ?? item.Value ?? item.value ?? '0';
                let name = item.Name ?? item.Desp ?? item.ProcessName ?? item.Text ?? item.name ?? item.desp ?? code;
                select.append(`<option value="${code}">${name}</option>`);
            });
        }
        select.select2({ width: '-webkit-fill-available' });
    } catch (err) {
        toastr.error(err.Msg || 'Failed to load process list.');
    }
}

// ─────────────────────────────────────────────
// Scan QR Button  (same pattern as PhysicalStockTaking)
// ─────────────────────────────────────────────
function InitScanQRCodeByCameraControl(outputQRTextElementID, callBackFunctionName) {
    let url = baseUrl + '/CustomControl/ScanQRCodeByCameraControl';
    $('#DivScanQRCodeByCameraControlModal').load(url, {
        OutputQRTextElementID: outputQRTextElementID,
        CallBackFunctionName: callBackFunctionName
    });
}

function WeightConfirmation_btnScanQR() {
    InitScanQRCodeByCameraControl('txtIdentificationNo', 'WeightConfirmation_CallbackScanQRCode');
}

function WeightConfirmation_CallbackScanQRCode() {
    WeightConfirmation_onIdentificationComplete();
}

function WeightConfirmation_onIdentificationComplete() {
    let identNo = $('#txtIdentificationNo').val().trim();
    if (identNo === '') return;

    if (enableManualWeightByConveyor === 'N') {
        WeightConfirmation_AutoGetWeightAndUpdate();
        return;
    }

    $('#txtActualWeight').focus();
}

async function WeightConfirmation_AutoGetWeightAndUpdate() {
    if (isAutoProcessing) return;

    let selectedProcessValue = ($('#ddlProcess').val() || '').toString().trim();
    let identificationNo = $('#txtIdentificationNo').val().trim();

    if (selectedProcessValue === '' || selectedProcessValue === '0') {
        toastr.warning('Please select a Process.');
        $('#ddlProcess').focus();
        return;
    }
    if (identificationNo === '') {
        toastr.warning('Please enter or scan an Identification No.');
        $('#txtIdentificationNo').focus();
        return;
    }
    if (!defaultMachineName) {
        toastr.error('No weighment machine configured. Please contact administrator.');
        return;
    }

    isAutoProcessing = true;
    Showloader();
    try {
        let weightResponse = await WeighmentService.GetMachineWeight(defaultMachineName);
        if (!weightResponse || weightResponse.Status !== 'Y') {
            HideLoader();
            toastr.error((weightResponse && weightResponse.Msg) || 'Failed to get weight from scale.');
            $('#txtIdentificationNo').focus().select();
            return;
        }

        let actualWeight = parseFloat(weightResponse.Msg) || 0;
        if (actualWeight <= 0) {
            HideLoader();
            toastr.warning('Invalid weight received from scale.'+actualWeight);
            $('#txtIdentificationNo').focus().select();
            return;
        }

        $('#txtActualWeight').val(actualWeight);
        await WeightConfirmation_UpdateWeight(true);
    } catch (err) {
        HideLoader();
        toastr.error(err.Msg || 'Error getting weight from scale.');
        $('#txtIdentificationNo').focus().select();
    } finally {
        isAutoProcessing = false;
    }
}

// ─────────────────────────────────────────────
// Enter key on Identification text box
// ─────────────────────────────────────────────
function WeightConfirmation_onIdentificationKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        let identNo = $('#txtIdentificationNo').val().trim();
        if (identNo === '') {
            toastr.warning('Please enter an Identification No.');
            return;
        }
        WeightConfirmation_onIdentificationComplete();
    }
}

// ─────────────────────────────────────────────
// Enter key on Weight text box  → call API
// ─────────────────────────────────────────────
function WeightConfirmation_onWeightKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        WeightConfirmation_UpdateWeight();
    }
}

// ─────────────────────────────────────────────
// Open Scale Weight Modal
// ─────────────────────────────────────────────
function WeightConfirmation_openScaleWeightModal() {
    let url = baseUrl + '/CustomControl/SelectMachineToGetWeightControl';
    $('#WC_DivSelectMachineToGetWeightControl').load(url, { OutputTextElementID: 'txtActualWeight' });
}

// ─────────────────────────────────────────────
// Call UpdateWeight API and build grid
// ─────────────────────────────────────────────
async function WeightConfirmation_UpdateWeight(isAutoMode = false) {
    let selectedProcessValue = ($('#ddlProcess').val() || '').toString().trim();
    let processMaster_Code = selectedProcessValue;
    let identificationNo = $('#txtIdentificationNo').val().trim();
    let actualWeight = parseFloat($('#txtActualWeight').val()) || 0;

    if (selectedProcessValue === '' || selectedProcessValue === '0') {
        toastr.warning('Please select a Process.');
        return false;
    }
    if (identificationNo === '') {
        toastr.warning('Please enter or scan an Identification No.');
        $('#txtIdentificationNo').focus();
        return false;
    }
    if (actualWeight <= 0) {
        toastr.warning('Please enter a valid Actual Weight.');
        if (!isAutoMode) {
            $('#txtActualWeight').focus();
        }
        return false;
    }

    let authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    let userMaster_Code = authKey.UserMaster_Code || 0;

    if (!isAutoMode) {
        Showloader();
    }
    try {
        let response = await WeightConfirmationService.UpdateWeight(
            0,
            identificationNo,
            processMaster_Code,
            userMaster_Code,
            actualWeight
        );
        HideLoader();

        if (response && response.length > 0) {
            BuildWeightConfirmationGrid(response);

            if (isAutoMode || enableManualWeightByConveyor === 'N') {
                $('#txtIdentificationNo').val('');
                $('#txtActualWeight').val('0.000');
                $('#txtIdentificationNo').focus();
            }
            return true;
        }

        toastr.info('No data returned.');
        ClearWeightConfirmationGrid();
        return false;
    } catch (err) {
        HideLoader();
        toastr.error(err.Msg || 'Error updating weight.');
        if (isAutoMode || enableManualWeightByConveyor === 'N') {
            $('#txtIdentificationNo').focus().select();
        }
        return false;
    }
}

// ─────────────────────────────────────────────
// Build Grid using filter.js (no pagination)
// Status Y → Msg green, Status N → Msg red
// ─────────────────────────────────────────────
function BuildWeightConfirmationGrid(data) {
    if (!Array.isArray(data) || data.length === 0) {
        ClearWeightConfirmationGrid();
        return;
    }

    const statusRow = data.find(item => {
        const desp = (item.Desp ?? item.desp ?? item.Key ?? item.key ?? '').toString().trim().toLowerCase();
        return desp === 'status';
    });

    let statusVal = '';
    if (statusRow) {
        statusVal = (statusRow.Value ?? statusRow.value ?? '').toString().trim().toUpperCase();
    } else {
        // Flat object shape: [{ Status, Msg, ... }]
        statusVal = (data[0].Status ?? data[0].status ?? '').toString().trim().toUpperCase();
    }

    const isSuccess = statusVal === 'Y';
    const isFail = statusVal === 'N';
    const msgClass = isSuccess ? 'wc-msg-success' : (isFail ? 'wc-msg-error' : '');

    const updatedData = data.map(item => {
        const desp = (item.Desp ?? item.desp ?? item.Key ?? item.key ?? '').toString().trim().toLowerCase();
        const row = { ...item };

        // Desp/Value shape — color the Msg Value cell
        if (desp === 'msg' && msgClass) {
            const msgText = (item.Value ?? item.value ?? '').toString();
            row.Value = `<span class="${msgClass}">${msgText}</span>`;
            if (row.value !== undefined) {
                row.value = row.Value;
            }
        }

        // Flat shape — color Msg column
        if ((item.Msg !== undefined || item.msg !== undefined || item.Message !== undefined) && msgClass) {
            const msgText = (item.Msg ?? item.msg ?? item.Message ?? '').toString();
            if (item.Msg !== undefined) row.Msg = `<span class="${msgClass}">${msgText}</span>`;
            if (item.msg !== undefined) row.msg = `<span class="${msgClass}">${msgText}</span>`;
            if (item.Message !== undefined) row.Message = `<span class="${msgClass}">${msgText}</span>`;
        }

        return row;
    });

    BizsolCustomFilterGrid.CreateDataTable(
        "table-header-WeightConfirmation",
        "table-body-WeightConfirmation",
        updatedData,
        false, [], [], [], [], [], [], {}, false
    );

    setTimeout(function () {
        $('#table-body-WeightConfirmation tr').each(function () {
            if ($(this).find('span.wc-msg-error').length > 0) {
                $(this).addClass('wc-error-row');
            } else if ($(this).find('span.wc-msg-success').length > 0) {
                $(this).addClass('wc-success-row');
            }
        });
    }, 100);
}

function ClearWeightConfirmationGrid() {
    $('#table-header-WeightConfirmation').empty();
    $('#table-body-WeightConfirmation').empty();
}

// Expose to global scope
window.WeightConfirmation_btnScanQR = WeightConfirmation_btnScanQR;
window.WeightConfirmation_CallbackScanQRCode = WeightConfirmation_CallbackScanQRCode;
window.WeightConfirmation_onIdentificationKeyDown = WeightConfirmation_onIdentificationKeyDown;
window.WeightConfirmation_onWeightKeyDown = WeightConfirmation_onWeightKeyDown;
window.WeightConfirmation_openScaleWeightModal = WeightConfirmation_openScaleWeightModal;
window.WeightConfirmation_UpdateWeight = WeightConfirmation_UpdateWeight;
