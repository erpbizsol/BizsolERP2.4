import { SizeFilterControlService } from '../JSServices/_SizeFilterControlService.js';

let arraySizeControlDllID = [];
let SizeControl_NewSizeMaster_Code = 0;
let SizeControl_NewSizeDesp = '';
let lastItemMasterCode = null; 
let savedFilterState = {}; 

function createSizeFilterControlModal(id) {
    const modalId = id || 'SizeControlmodal';
    const modalHTML = `
        <div class="modal fade bs-example-modal-center" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Size Filter</h5>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-9">
                                <input type="hidden" id="ddlItemSizeMaster" class="form-control form-control-sm" />
                            </div>
                        </div>

                        <table class="table mt-1" style="width:100%">
                            <thead>
                                <tr>
                                    <th rowspan="2">Parameter</th>
                                    <th rowspan="2" style="width:40%">Value</th>
                                    <th colspan="2" style="width:40%; text-align:center;">Range</th>
                                </tr>
                                <tr>
                                    <th>From</th>
                                    <th>To</th>
                                </tr>
                            </thead>
                            <tbody id="tbSizeParameter">

                            </tbody>
                        </table>

                        <div class="text-end mt-1">
                            <button class="btn btn-warning btn-height" onclick="onSizeControl_ClearFilter();">
                                Clear Filter
                            </button>&nbsp;
                            <button class="btn btn-primary btn-height" onclick="onSizeControl_ApplyFilter();">
                                Filter
                            </button>
                            &nbsp;
                            <a class="btn btn-danger btn-height" data-bs-dismiss="modal" aria-label="Close">Close</a>
                            <input type="hidden" value="" id="hfItemMaster_Code" />
                            <input type="hidden" value="" id="hfItemSizeMaster_Code" />
                            <input type="hidden" value="" id="hfCallBackFunctionName_btnDone" />
                            <input type="hidden" value="" id="hfRow_Id" />
                            <input type="hidden" value="" id="hfProcessMaster_Code" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    const containerDiv = document.getElementById('DivSizeControlmodal');
    
    if (containerDiv && containerDiv.innerHTML.trim() === '') {
        containerDiv.outerHTML = modalHTML;
    } else if (!document.getElementById(modalId)) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    if (!document.getElementById('SizeFilterControlStyles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'SizeFilterControlStyles';
        styleElement.textContent = getSizeFilterControlStyles();
        document.head.appendChild(styleElement);
    }
    
    return modalId; 
}
/**
 * Returns the CSS styles for the Size Filter Control
 * @returns {string} CSS styles
 */
function getSizeFilterControlStyles() {
    return `
        .custom-dropdown {
            position: relative;
            width: 100%;
            margin-bottom: 0;
        }

        .dropdown-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: #fff;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
        }

        .dropdown-header:hover {
            border-color: #aaa;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dropdown-header.active {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        .dropdown-toggle {
            font-size: 12px;
            transition: transform 0.2s ease;
        }

        .dropdown-header.active .dropdown-toggle {
            transform: rotate(180deg);
        }

        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #fff;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 4px 4px;
            max-height: 350px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .dropdown-search-container {
            padding: 8px;
            border-bottom: 1px solid #e0e0e0;
            position: sticky;
            top: 0;
            background-color: #fff;
            z-index: 1001;
        }

        .dropdown-search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .dropdown-search-input:focus {
            outline: none;
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        .dropdown-search-input::placeholder {
            color: #999;
        }

        .dropdown-options-container {
            max-height: 250px;
            overflow-y: auto;
        }

        .dropdown-option {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.2s ease;
            border-bottom: 1px solid #f0f0f0;
        }

        .dropdown-option:hover {
            background-color: #f5f5f5;
        }

        .dropdown-option:last-child {
            border-bottom: none;
        }

        .dropdown-checkbox {
            margin-right: 8px;
            cursor: pointer;
            width: 16px;
            height: 16px;
            accent-color: #0d6efd;
        }

        .dropdown-option span {
            flex: 1;
        }

        .dropdown-option input:checked + span {
            font-weight: 600;
            color: #0d6efd;
        }

        .dropdown-option input:checked {
            accent-color: #0d6efd;
        }

        .dropdown-menu::-webkit-scrollbar {
            width: 8px;
        }

        .dropdown-menu::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .dropdown-menu::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }

        .dropdown-menu::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        .dropdown-options-container::-webkit-scrollbar {
            width: 8px;
        }

        .dropdown-options-container::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .dropdown-options-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }

        .dropdown-options-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        /* Validation styling */
        .size-range-from.is-invalid,
        .size-range-to.is-invalid {
            border-color: #dc3545 !important;
            background-color: #fff5f5 !important;
        }

        .size-range-from.is-invalid:focus,
        .size-range-to.is-invalid:focus {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }
    `;
}
function getItemParameterList() {
    const currentItemMasterCode = $('#hfItemMaster_Code').val();
    const itemMasterCodeChanged = lastItemMasterCode !== null && 
                                  lastItemMasterCode !== currentItemMasterCode &&
                                  currentItemMasterCode !== '';
    if (itemMasterCodeChanged && lastItemMasterCode) {
        saveCurrentFilterState(lastItemMasterCode);
    }
    if (itemMasterCodeChanged) {
        clearAllCheckboxes();
    }
    if (currentItemMasterCode && currentItemMasterCode !== '') {
        lastItemMasterCode = currentItemMasterCode;
    }
    
    SizeFilterControlService.GetParameterMasterFilter(currentItemMasterCode).then(function (response) {
        arraySizeControlDllID = response.map((item) => ({
            ItemParameterMaster_Code: item.ItemParameterMaster_Code,
            ParameterDesp: item.ParameterDesp,
            ISNUMERIC: item.ISNUMERIC,
            SortOrder: item.SortOrder,
            SizeControlDllID: item.ParameterDesp.replace(/[^a-zA-Z0-9]/g, '_')
        }));

        let tbRow = '';
        $.each(response, function (key, val) {
            let selectId = val.ParameterDesp.replace(/[^a-zA-Z0-9]/g, '_');
            let fromId = selectId + '_From';
            let toId = selectId + '_To';
            let isNumeric = val.ISNUMERIC === 'Y';
            
            // Add data attribute to identify numeric/alphanumeric fields
            let dataAttribute = isNumeric ? 'data-numeric="true"' : 'data-numeric="false"';
            let inputMode = isNumeric ? 'inputmode="decimal"' : '';
            let pattern = isNumeric ? 'pattern="[0-9]*(\.[0-9]{1,2})?"' : '';

            tbRow += '<tr>' +
                '<td style="vertical-align:middle;">' + val.ParameterDesp + '</td>' +
                '<td><select id="' + selectId + '" class="form-control form-control-sm size-param-select" style="width:100%;"></select></td>' +
                '<td><input type="text" id="' + fromId + '" autocomplete="off" class="form-control form-control-sm size-range-from" placeholder="Min Value" maxlength="8" ' + dataAttribute + ' ' + inputMode + ' ' + pattern + ' /></td>' +
                '<td><input type="text" id="' + toId + '" autocomplete="off" class="form-control form-control-sm size-range-to" placeholder="Max Value" maxlength="8" ' + dataAttribute + ' ' + inputMode + ' ' + pattern + ' /></td>' +
                '</tr>';

            GetSizeDll(selectId, val.ItemParameterMaster_Code);
        });

        $('#tbSizeParameter').html(tbRow);
        
        attachNumericValidation();
        
        setTimeout(function() {
            restoreSavedFilterState(currentItemMasterCode);
        }, 500);
        
    }).catch(function (error) {
        alert('Error loading parameters: ' + (error.Msg || 'Unknown error'));
    });
}

/**
 * Saves the current filter state for a specific ItemMaster_Code
 * @param {string} itemMasterCode 
 */
function saveCurrentFilterState(itemMasterCode) {
    if (!itemMasterCode || itemMasterCode === '') {
        return;
    }
    
    const filterState = {};
    
    arraySizeControlDllID.forEach((paramItem) => {
        const paramId = paramItem.SizeControlDllID;
        const fromId = paramId + '_From';
        const toId = paramId + '_To';
        const dropdownId = paramId + '_dropdown';
        const selectedValues = [];
        $('#' + dropdownId).find('.dropdown-checkbox:checked').each(function () {
            selectedValues.push($(this).val());
        });
        
        const fromValue = $('#' + fromId).val();
        const toValue = $('#' + toId).val();
        
        if (selectedValues.length > 0 || fromValue || toValue) {
            filterState[paramId] = {
                selectedValues: selectedValues,
                fromValue: fromValue || '',
                toValue: toValue || ''
            };
        }
    });
    
    if (Object.keys(filterState).length > 0) {
        savedFilterState[itemMasterCode] = filterState;
    } else {
        console.log('ℹ️ No filter selections to save for ItemMaster_Code:', itemMasterCode);
    }
}

/**
 * Restores the saved filter state for a specific ItemMaster_Code
 * @param {string} itemMasterCode - The ItemMaster_Code to restore state for
 */
function restoreSavedFilterState(itemMasterCode) {
    if (!itemMasterCode || itemMasterCode === '') {
        return;
    }
    
    const filterState = savedFilterState[itemMasterCode];
    
    if (!filterState) {
        return;
    }
    
    let restoredCount = 0;
    
    arraySizeControlDllID.forEach((paramItem) => {
        const paramId = paramItem.SizeControlDllID;
        const state = filterState[paramId];
        
        if (!state) return;
        
        const fromId = paramId + '_From';
        const toId = paramId + '_To';
        const dropdownId = paramId + '_dropdown';
        
        if (state.selectedValues && state.selectedValues.length > 0) {
            state.selectedValues.forEach(function(value) {
                const checkbox = $('#' + dropdownId).find('.dropdown-checkbox[value="' + value + '"]');
                if (checkbox.length > 0) {
                    checkbox.prop('checked', true);
                    restoredCount++;
                }
            });
            updateDropdownDisplay(paramId, dropdownId);
            updateHiddenSelectValues(paramId, dropdownId);
        }
        
        if (state.fromValue) {
            $('#' + fromId).val(state.fromValue);
            restoredCount++;
        }
        if (state.toValue) {
            $('#' + toId).val(state.toValue);
            restoredCount++;
        }
    });
    
}

function clearAllCheckboxes() {
    arraySizeControlDllID.forEach((paramItem) => {
        var paramId = paramItem.SizeControlDllID;
        var fromId = paramId + '_From';
        var toId = paramId + '_To';
        var dropdownId = paramId + '_dropdown';
        
        $('#' + dropdownId).find('.dropdown-checkbox').prop('checked', false);
        
        $('#' + fromId).val('');
        $('#' + toId).val('');
        updateDropdownDisplay(paramId, dropdownId);
    });
}
function attachNumericValidation() {
    $(document).on('input', '.size-range-from, .size-range-to', function () {
        let value = $(this).val();
        let isNumeric = $(this).data('numeric') === true;
        
        // Clear validation error when user starts typing
        $(this).removeClass('is-invalid');
        
        if (isNumeric) {
            // Numeric validation: Allow only numbers and decimal point
            let sanitized = value.replace(/[^0-9.]/g, '');
            
            let parts = sanitized.split('.');
            if (parts.length > 2) {
                sanitized = parts[0] + '.' + parts[1];
            }
            if (parts.length === 2 && parts[1].length > 2) {
                sanitized = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            if (sanitized.includes('.')) {
                let [integer, decimal] = sanitized.split('.');
                integer = integer.replace(/^0+(?=.)/, '') || '0';
                sanitized = integer + '.' + decimal;
            } else if (sanitized.length > 1 && sanitized[0] === '0') {
                sanitized = sanitized.replace(/^0+(?=.)/, '') || '0';
            }
            
            $(this).val(sanitized);
        } else {
            // Alphanumeric validation: Allow letters, numbers, spaces, and common special characters
            // Remove only truly invalid characters (if any restrictions needed)
            let sanitized = value.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
            $(this).val(sanitized);
        }
    });
}

/**
 * Gets the size DLL options and creates a custom dropdown
 * @param {string} ddlElementId - The dropdown element ID
 * @param {number} itemParameterMasterId - The item parameter master ID
 */
function GetSizeDll(ddlElementId, itemParameterMasterId) {
    SizeFilterControlService.GetItemParameterValueMasterFilter(itemParameterMasterId).then(function (response) {
        var dropdownId = ddlElementId + '_dropdown';
        var $dropdown = $('<div class="custom-dropdown"></div>');
        $dropdown.attr('id', dropdownId);
        var $header = $('<div class="dropdown-header">' +
            '<span class="dropdown-text">-- Select Multiple --</span>' +
            '<span class="dropdown-toggle">▼</span>' +
            '</div>');
        var $menu = $('<div class="dropdown-menu" style="display:none;"></div>');
        var $searchContainer = $('<div class="dropdown-search-container"></div>');
        var $searchInput = $('<input type="text" class="dropdown-search-input" placeholder="Search..." />');
        $searchContainer.append($searchInput);
        $menu.append($searchContainer);
        var $optionsContainer = $('<div class="dropdown-options-container"></div>');
        
        response.forEach(function (item) {
            var $option = $('<label class="dropdown-option">' +
                '<input type="checkbox" class="dropdown-checkbox" value="' + item.Code + '" data-text="' + item.Desp + '" /> ' +
                '<span>' + item.Desp + '</span>' +
                '</label>');
            $optionsContainer.append($option);
        });
        
        $menu.append($optionsContainer);
        
        $('#' + ddlElementId).hide();
        
        $('#' + dropdownId).remove();
        
        $('#' + ddlElementId).after($dropdown.append($header).append($menu));
        
        $dropdown.on('click', '.dropdown-header', function (e) {
            e.stopPropagation();
            $menu.slideToggle(150);
            if ($menu.is(':visible')) {
                $searchInput.focus();
            }
        });
        
        $dropdown.on('keyup', '.dropdown-search-input', function () {
            var searchTerm = $(this).val().toLowerCase();
            $optionsContainer.find('.dropdown-option').each(function () {
                var optionText = $(this).find('span').text().toLowerCase();
                if (optionText.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });
        
        $dropdown.on('change', '.dropdown-checkbox', function () {
            updateDropdownDisplay(ddlElementId, dropdownId);
            updateHiddenSelectValues(ddlElementId, dropdownId);
        });
        
        $(document).on('click', function (e) {
            if (!$(e.target).closest('#' + dropdownId).length) {
                $menu.slideUp(150);
                $searchInput.val('');
                $optionsContainer.find('.dropdown-option').show(); 
            }
        });
        
    }).catch(function (error) {
        console.error('Error loading dropdown for parameter ' + itemParameterMasterId + ':', error);
    });
}

/**
 * Updates the hidden select values with selected checkboxes
 * @param {string} selectId - The select element ID
 * @param {string} dropdownId - The dropdown element ID
 */
function updateHiddenSelectValues(selectId, dropdownId) {
    var $dropdown = $('#' + dropdownId);
    var selectedValues = [];
    $dropdown.find('.dropdown-checkbox:checked').each(function () {
        selectedValues.push($(this).val());
    });
    $('#' + selectId).val(selectedValues);
}

/**
 * Updates the dropdown display text based on selected items
 * @param {string} selectId - The select element ID
 * @param {string} dropdownId - The dropdown element ID
 */
function updateDropdownDisplay(selectId, dropdownId) {
    var $dropdown = $('#' + dropdownId);
    var checkedCount = $dropdown.find('.dropdown-checkbox:checked').length;
    var $headerText = $dropdown.find('.dropdown-text');
    
    if (checkedCount === 0) {
        $headerText.text('-- Select Multiple --');
    } else if (checkedCount === 1) {
        var selectedText = $dropdown.find('.dropdown-checkbox:checked').data('text');
        $headerText.text(selectedText);
    } else {
        $headerText.text(checkedCount + ' selected');
    }
}

/**
 * Binds data to a select list element
 * @param {HTMLElement} element - The select element
 * @param {Array} list - The list of options
 */
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

/**
 * Handles the change event of the item size master dropdown
 */
function onSizeControl_ddlItemSizeMasterChange() {
    $('#hfItemSizeMaster_Code').val($('#ddlItemSizeMaster').val());
    getItemParameterList();
}

/**
 * Builds the filter payload from current selections
 * @returns {Array} The filter payload object
 */
function buildFilterPayload() {
    var filterPayload = [];
    var validationErrors = [];
    var hasAnySelection = false; // Track if any filter is applied

    arraySizeControlDllID.forEach((paramItem) => {
        var paramId = paramItem.SizeControlDllID;
        var fromId = paramId + '_From';
        var toId = paramId + '_To';
        var dropdownId = paramId + '_dropdown';
        
        var selectedValues = [];
        $('#' + dropdownId).find('.dropdown-checkbox:checked').each(function () {
            selectedValues.push($(this).val());
        });
        
        var selectedValuesString = selectedValues.length > 0 ? selectedValues.join(',') : '';
        
        var fromValue = $('#' + fromId).val();
        var toValue = $('#' + toId).val();
        
        // Validation: If From is entered, To must also be entered
        if (fromValue && fromValue != 0 && (!toValue || toValue == 0)) {
            validationErrors.push('Please enter "To" value for ' + paramItem.ParameterDesp);
            $('#' + toId).addClass('is-invalid');
        } else {
            $('#' + toId).removeClass('is-invalid');
        }
        
        var paramObject = {
            ItemParameterMaster_Code: paramItem.ItemParameterMaster_Code,
            ParameterDesp: paramItem.ParameterDesp,
            SelectedValues: selectedValuesString,
            RangeFrom: fromValue || 0,
            RangeTo: toValue || 0,
            IsNumeric: paramItem.ISNUMERIC === 'Y' ? 'Y' : 'N'
        };
        
        var hasSelectedValues = selectedValuesString !== '';
        var hasRangeFrom = fromValue && fromValue != 0;
        var hasRangeTo = toValue && toValue != 0;
        
        // Check if this parameter has any selection
        if (hasSelectedValues || (hasRangeFrom && hasRangeTo)) {
            filterPayload.push(paramObject);
            hasAnySelection = true; // Mark that at least one filter is applied
        }
    });

    // Show validation errors if any
    if (validationErrors.length > 0) {
        toastr.error(validationErrors.join('<br/>'));
        return null;
    }

    // Check if at least one filter is applied
    if (!hasAnySelection) {
        toastr.warning('Please select at least one filter value or enter range values');
        return null;
    }

    return filterPayload;
}
function onSizeControl_ApplyFilter() {
    try {
        var filterPayload = buildFilterPayload();
        var callbackFunctionName = $('#hfCallBackFunctionName_btnDone').val();

        
        // Check if validation failed
        if (filterPayload === null) {
            if (callbackFunctionName && typeof window[callbackFunctionName] === 'function') {
                window[callbackFunctionName]([]);
            }
            return;
        }
        
        window.SizeControl_FilterPayload = filterPayload;
        
        SizeFilterControlService.GetItemSizeMasterCodes(filterPayload).then(function (response) {
            
            window.SizeControl_FilterResponse = response;
            SizeControl_NewSizeMaster_Code = response;
            
            const currentItemMasterCode = $('#hfItemMaster_Code').val();
            if (currentItemMasterCode && currentItemMasterCode !== '') {
                saveCurrentFilterState(currentItemMasterCode);
            }
            
            if (callbackFunctionName && typeof window[callbackFunctionName] === 'function') {
                window[callbackFunctionName](response);
            }
            
            const activeModal = document.querySelector('.modal.show');
            if (activeModal) {
                $(activeModal).modal('hide');
            } else {
                $("#SizeControlmodal").modal('hide');
            }
        }).catch(function (error) {
            console.error('Error applying filter:', error);
            SizeControl_NewSizeMaster_Code = '';
            alert('Error applying filter: ' + (error.Msg || error.message || 'Unknown error'));
        });
    } catch (error) {
        console.error('Error in filter function:', error);
        alert('Error: ' + error.message);
    }
}

function onSizeControl_ClearFilter() {
    try {
        const currentItemMasterCode = $('#hfItemMaster_Code').val();
        
        let hasSelections = false;
        arraySizeControlDllID.forEach((paramItem) => {
            var paramId = paramItem.SizeControlDllID;
            var fromId = paramId + '_From';
            var toId = paramId + '_To';
            var dropdownId = paramId + '_dropdown';
            
            const checkedCount = $('#' + dropdownId).find('.dropdown-checkbox:checked').length;
            const fromValue = $('#' + fromId).val();
            const toValue = $('#' + toId).val();
            
            if (checkedCount > 0 || fromValue || toValue) {
                hasSelections = true;
            }
        });
        
        if (!hasSelections) {
            toastr.info('Filter is already cleared');
            return;
        }
        arraySizeControlDllID.forEach((paramItem) => {
            var paramId = paramItem.SizeControlDllID;
            var fromId = paramId + '_From';
            var toId = paramId + '_To';
            $('#' + paramId).val([]);
            $('#' + fromId).val('');
            $('#' + toId).val('');
            var dropdownId = paramId + '_dropdown';
            $('#' + dropdownId).find('.dropdown-checkbox').prop('checked', false);
            updateDropdownDisplay(paramId, dropdownId);
        });
        
        if (currentItemMasterCode && savedFilterState[currentItemMasterCode]) {
            delete savedFilterState[currentItemMasterCode];
        }
        var callbackFunctionName = $('#hfCallBackFunctionName_btnDone').val();

        if (callbackFunctionName && typeof window[callbackFunctionName] === 'function') {
            window[callbackFunctionName]([]);
        }
        toastr.success('Filter has been cleared');
    } catch (error) {
        toastr.error('Error clearing filter: ' + error.message);
    }
}

/**
 * Initializes the Size Filter Control modal on page load
 * @param {Object} options - Configuration options with ViewBag properties
 */
function initializeSizeFilterControl(options = {}) {

    const modalId = createSizeFilterControlModal(options.ModalId || 'SizeControlmodal');
    
    if (options.ItemMaster_Code) {
        $('#hfItemMaster_Code').val(options.ItemMaster_Code);
    }
    if (options.CallBackFunctionName_btnDone) {
        $('#hfCallBackFunctionName_btnDone').val(options.CallBackFunctionName_btnDone);
    }
    
    getItemParameterList();
    
    setTimeout(function() {
        $(`#${modalId}`).modal({
            backdrop: 'static',
            keyboard: false
        });
        $(`#${modalId}`).modal('show');
        
        // Save state when modal is closed
        $(`#${modalId}`).off('hidden.bs.modal').on('hidden.bs.modal', function () {
            const currentItemMasterCode = $('#hfItemMaster_Code').val();
            if (currentItemMasterCode && currentItemMasterCode !== '') {
                saveCurrentFilterState(currentItemMasterCode);
            }
        });
    }, 100);
}

window.onSizeControl_ApplyFilter = onSizeControl_ApplyFilter;
window.onSizeControl_ClearFilter = onSizeControl_ClearFilter;
window.onSizeControl_ddlItemSizeMasterChange = onSizeControl_ddlItemSizeMasterChange;
window.initializeSizeFilterControl = initializeSizeFilterControl;
window.createSizeFilterControlModal = createSizeFilterControlModal;

export {
    createSizeFilterControlModal,
    getSizeFilterControlStyles,
    getItemParameterList,
    clearAllCheckboxes,
    attachNumericValidation,
    GetSizeDll,
    updateHiddenSelectValues,
    updateDropdownDisplay,
    BindSelectList,
    onSizeControl_ddlItemSizeMasterChange,
    buildFilterPayload,
    onSizeControl_ApplyFilter,
    onSizeControl_ClearFilter,
    initializeSizeFilterControl
};
