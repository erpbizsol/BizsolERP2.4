import { MRNUpdationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MRNUpdationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_MRNDetailRows = [];
let G_SelectedMRNMasterCode = 0;
let G_BaseUrl = sessionStorage.getItem('AppBaseURL') || '';

function getRowActualWeight(row) {
    if (!row) {
        return null;
    }
    if (row.ActualWeight != null && row.ActualWeight !== '') {
        return row.ActualWeight;
    }
    if (row['Actual Weight'] != null && row['Actual Weight'] !== '') {
        return row['Actual Weight'];
    }
    return null;
}

function formatActualWeightDisplay(weight) {
    if (weight == null || weight === '') {
        return '';
    }
    const num = parseFloat(weight);
    return isNaN(num) ? '' : num.toFixed(3);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    LoadUnverifiedMrnList();
    bindMrnDropdownChange();
    bindWeightScaleListener();
});

function bindMrnDropdownChange() {
    $('#ddlMRNNo').on('change', function () {
        const mrnMasterCode = parseInt($(this).val(), 10) || 0;
        G_SelectedMRNMasterCode = mrnMasterCode;
        if (mrnMasterCode > 0) {
            LoadMRNDetailGrid(mrnMasterCode);
        } else {
            clearMrnGrid();
        }
    });
}

function LoadUnverifiedMrnList() {
    MRNUpdationService.GetUnverifiedMrnList().then(function (response) {
        if (response && response.length > 0) {
            const mrnList = response.map(function (item) {
                return {
                    Code: item.Code,
                    Desp: item.MRNNumber || item.MRNNo || ''
                };
            });
            BindSelectList2($('#ddlMRNNo')[0], mrnList);
            $('#ddlMRNNo').select2({
                width: '-webkit-fill-available',
                placeholder: 'Select MRN No',
                allowClear: true
            });
        } else {
            BindSelectList2($('#ddlMRNNo')[0], []);
            $('#ddlMRNNo').select2({
                width: '-webkit-fill-available',
                placeholder: 'Select MRN No',
                allowClear: true
            });
            toastr.error('No unverified MRN found');
        }
    }).catch(function () {
        toastr.error('Error loading MRN list');
    });
}

async function LoadMRNDetailGrid(mrnMasterCode) {
    try {
        Showloader();
        const response = await MRNUpdationService.GetMRNDetail(mrnMasterCode);
        HideLoader();

        if (!response || response.length === 0) {
            clearMrnGrid();
            toastr.error('No MRN detail found');
            return;
        }

        G_MRNDetailRows = response.map(function (item, index) {
            return {
                ...item,
                __RowIndex: index
            };
        });

        renderMrnDetailGrid();
    } catch (error) {
        HideLoader();
        clearMrnGrid();
        toastr.error('Error loading MRN details');
    }
}

function renderMrnDetailGrid() {
    const StringFilterColumn = ['Item Name', 'Size Desp', 'Supplier ID No'];
    const NumericFilterColumn = ['QtyMT', 'QtyPC', 'QTYMTRS'];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ['Code', 'MRNMaster_Code', '__RowIndex'];
    const ColumnAlignment = {
        'ActualWeight': 'right',
        'QtyMT': 'right',
        'QtyPC': 'right',
        'QTYMTRS': 'right'
    };

    const updatedResponse = G_MRNDetailRows.map(function (item) {
        const rowIndex = item.__RowIndex;
        const inputId = 'txtActualWeight_' + rowIndex;
        const actualWeightVal = formatActualWeightDisplay(getRowActualWeight(item));

        const actualWeightHtml =
            '<div class="actual-weight-cell">' +
            '<input type="text" class="form-control form-control-sm box_border text-end" ' +
            'id="' + inputId + '" ' +
            'value="' + actualWeightVal + '" ' +
            'oninput="validateActualWeightInput(this)" ' +
            'onblur="UpdateActualWeightOnBlur(' + rowIndex + ')" ' +
            'autocomplete="off" />' +
            '<a class="btn btn-dark btn-sm btn-scale-weight" title="Scale Weight" ' +
            'onclick="MRNUpdation_InitSelectMachineToGetWeightControl(\'' + inputId + '\')">' +
            '<i class="fa-solid fa-scale-unbalanced"></i></a>' +
            '</div>';

        return {
            ...item,
            'Update Actual Weight': actualWeightHtml
        };
    });

    $('#MRNUpdation').show();
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-MRNUpdation',
        'table-body-MRNUpdation',
        updatedResponse,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        false
    );
}

function clearMrnGrid() {
    G_MRNDetailRows = [];
    $('#table-header-MRNUpdation').empty();
    $('#table-body-MRNUpdation').empty();
    $('#MRNUpdation').hide();
}

function validateActualWeightInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}

function validateActualWeightValue(weightStr) {
    const trimmed = (weightStr || '').trim();
    if (trimmed === '') {
        return { valid: false, message: 'Actual Weight cannot be blank' };
    }
    const weight = parseFloat(trimmed);
    if (isNaN(weight) || weight <= 0) {
        return { valid: false, message: 'Actual Weight must be greater than zero' };
    }
    return { valid: true, value: weight };
}

function UpdateActualWeightOnBlur(rowIndex) {
    const row = G_MRNDetailRows[rowIndex];
    if (!row) {
        return;
    }

    const $input = $('#txtActualWeight_' + rowIndex);
    const validation = validateActualWeightValue($input.val());
    if (!validation.valid) {
        toastr.error(validation.message);
        const prevWeight = getRowActualWeight(row);
        $input.val(formatActualWeightDisplay(prevWeight));
        return;
    }

    $input.val(validation.value.toFixed(3));
    saveActualWeight(rowIndex, validation.value);
}

function saveActualWeight(rowIndex, actualWeight) {
    const row = G_MRNDetailRows[rowIndex];
    if (!row) {
        toastr.error('Row context not found');
        return;
    }

    const code = parseInt(row.Code, 10) || 0;
    const mrnMasterCode = parseInt(row.MRNMaster_Code || G_SelectedMRNMasterCode, 10) || 0;
    if (code <= 0 || mrnMasterCode <= 0) {
        toastr.error('Invalid row data');
        return;
    }

    const prevWeight = getRowActualWeight(row);
    if (prevWeight != null && parseFloat(prevWeight) === parseFloat(actualWeight)) {
        return;
    }

    Showloader();
    MRNUpdationService.UpdateActualWeight(code, mrnMasterCode, actualWeight).then(function (response) {
        HideLoader();
        const status = response ? (response.Status || response.status || '') : '';
        const msg = response ? (response.Msg || response.Message || response.msg || '') : '';

        if (status === 'Y') {
            row.ActualWeight = actualWeight;
            toastr.success(msg || 'Actual Weight updated successfully');
        } else {
            toastr.error(msg || 'Failed to update Actual Weight');
            $('#txtActualWeight_' + rowIndex).val(formatActualWeightDisplay(prevWeight));
        }
    }).catch(function () {
        HideLoader();
        toastr.error('Error updating Actual Weight');
        $('#txtActualWeight_' + rowIndex).val(formatActualWeightDisplay(prevWeight));
    });
}

function MRNUpdation_InitSelectMachineToGetWeightControl(outputTextElementID) {
    const url = G_BaseUrl + '/CustomControl/SelectMachineToGetWeightControl';
    $('#MRNUpdation_DivSelectMachineToGetWeightControl').load(url, { OutputTextElementID: outputTextElementID });
}

function bindWeightScaleListener() {
    document.addEventListener('weightScaleDataReceived', function (e) {
        const d = e.detail;
        if (!d || !d.outputTextElementID) {
            return;
        }

        if (d.outputTextElementID.indexOf('txtActualWeight_') !== 0) {
            return;
        }

        const rowIndexStr = d.outputTextElementID.replace('txtActualWeight_', '');
        const rowIndex = parseInt(rowIndexStr, 10);
        if (isNaN(rowIndex)) {
            return;
        }

        const validation = validateActualWeightValue(d.weight);
        if (!validation.valid) {
            toastr.error(validation.message);
            return;
        }

        $('#' + d.outputTextElementID).val(validation.value.toFixed(3));
        saveActualWeight(rowIndex, validation.value);
    });
}

function BindSelectList2(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    setTimeout(function () {
        refreshMrnDetailRowControls(window['filteredData_MRNUpdation'] || G_MRNDetailRows);
    }, 300);
});

function refreshMrnDetailRowControls(rows) {
    if (!rows || rows.length === 0) {
        return;
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || {};
        const domIndex = typeof row.__RowIndex === 'number' ? row.__RowIndex : i;
        const baseRow = G_MRNDetailRows[domIndex] || row;
        const actualWeight = formatActualWeightDisplay(getRowActualWeight(baseRow));
        const $input = $('#txtActualWeight_' + domIndex);
        if ($input.length) {
            $input.val(actualWeight);
        }
    }
}

window.validateActualWeightInput = validateActualWeightInput;
window.UpdateActualWeightOnBlur = UpdateActualWeightOnBlur;
window.MRNUpdation_InitSelectMachineToGetWeightControl = MRNUpdation_InitSelectMachineToGetWeightControl;
