import { QCPropertyItemConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyItemConfigurationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_ItemMasterList = [];
let G_QCGroupMasterList = [];
let G_QCPropertyMasterList = [];
let G_QCPropertyItemConfigurationList = [];

$(document).ready(function () {
    const urlParams = BizSolHelperFunction.getUrlVars
        ? BizSolHelperFunction.getUrlVars()
        : {};

    const menuValue = decodeURI(urlParams['ModuleDesp'] || '');
    if (menuValue && menuValue !== 'undefined') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('QC Property Item Configuration');
    }
    getItemMasterlist();
    QCGroupMasterlist();
    QCPropertyMasterlist(0);
    handleValueTypeChange();
    
    $('#txtValueType').on('change', function() {
        handleValueTypeChange();
        attachMinMaxValidation();
    });
    attachSortOrderValidation();
    attachMinMaxValidation();
    attachEnterKeyNavigation();
    getQCPropertyItemConfigurationList();
});

function CreateNew() {
    HideGrid();
}
function ShowGrid() {
    $("#dvGrid").show();
    $("#dvFrom").hide();
    getQCPropertyItemConfigurationList();
}
function HideGrid() {
    $("#dvGrid").hide();
    $("#dvFrom").show();
    // Focus first field after form is shown
    
}
function getItemMasterlist() {
    QCPropertyItemConfigurationService.GetItemMasterList()
        .then(function (response) {
            G_ItemMasterList = Array.isArray(response) ? response : [];
            bindItemDropdowns(G_ItemMasterList);
        })
        .catch(function (error) {
            console.error('Error loading item master list:', error);
            G_ItemMasterList = [];
        });
}
function bindItemDropdowns(list) {
    const $code = $('#txtItemCode');
    const $name = $('#txtItemName');

    if (!$code.length || !$name.length) {
        return;
    }

    let codeOptions = '<option value="0">Please select..</option>';
    let nameOptions = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const Code = item.Code || '';
        const itemCode = item.ItemCode || '';
        const itemName = item.ItemName || '';
        codeOptions += `<option value="${Code}">${itemCode}</option>`;
        nameOptions += `<option value="${Code}">${itemName}</option>`;
    });

    $code.html(codeOptions);
    $name.html(nameOptions);

    try {
        if ($.fn.select2) {
            // Initialize select2 with dropdownParent and scroll prevention
            $code.select2({ 
                width: '100%',
                dropdownParent: $(document.body)
            });
            $name.select2({ 
                width: '100%',
                dropdownParent: $(document.body)
            });
            
            // Attach scroll prevention using common function or inline
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($code);
                attachSelect2ScrollPrevention($name);
            } else {
                // Inline fallback if common function not available
                function preventScroll() {
                    const scrollY = window.scrollY || window.pageYOffset;
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.width = '100%';
                    document.body.setAttribute('data-scroll-y', scrollY);
                }
                
                function restoreScroll() {
                    const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, parseInt(scrollY));
                    document.body.removeAttribute('data-scroll-y');
                }
                
                $code.on('select2:open', preventScroll);
                $code.on('select2:close', restoreScroll);
                $name.on('select2:open', preventScroll);
                $name.on('select2:close', restoreScroll);
            }
        }
    } catch (e) {
    }

    attachItemDropdownSyncEvents();
}
function attachItemDropdownSyncEvents() {
    const $code = $('#txtItemCode');
    const $name = $('#txtItemName');

    if (!$code.length || !$name.length) {
        return;
    }

    let isSyncing = false;

    $code.on('change select2:select', function () {
        if (isSyncing) return;
        isSyncing = true;

        const selectedCode = $(this).val();
        if (!selectedCode) {
            $name.val(null);
        } else {
            const match = (G_ItemMasterList || []).find(function (x) {
                return (x.Code || '') === parseInt(selectedCode);
            });

            const targetName = match && match.Code ? match.Code : '';
            $name.val(targetName);
        }

        if ($name.data('select2')) {
            $name.trigger('change.select2');
        } else {
            $name.trigger('change');
        }

        isSyncing = false;
    });

    $name.on('change select2:select', function () {
        if (isSyncing) return;
        isSyncing = true;

        const selectedName = $(this).val();
        if (!selectedName) {
            $code.val(null);
        } else {
            const match = (G_ItemMasterList || []).find(function (x) {
                return (x.Code || '') === parseInt(selectedName);
            });

            const targetCode = match && match.Code ? match.Code : '';
            $code.val(targetCode);
        }

        if ($code.data('select2')) {
            $code.trigger('change.select2');
        } else {
            $code.trigger('change');
        }

        isSyncing = false;
    });
}
function QCGroupMasterlist() {
    QCPropertyItemConfigurationService.GetQCPropertyGroupMasterList()
        .then(function (response) {
            G_QCGroupMasterList = Array.isArray(response) ? response : [];
            getQCGroupMasterlist(G_QCGroupMasterList);
        })
        .catch(function (error) {
            console.error('Error loading QC Group master list:', error);
            G_QCGroupMasterList = [];
        });
}
function getQCGroupMasterlist(list) {
    const $code = $('#txtPropertyGroup');
    if (!$code.length) {
        return;
    }

    let codeOptions = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const Code = item['Code'] || 0;
        const GroupName = item['QC Group Name'] || '';
        codeOptions += `<option value="${Code}">${GroupName}</option>`;
    });

    $code.html(codeOptions);

    try {
        if ($.fn.select2) {
            $code.select2({ 
                width: '100%',
                dropdownParent: $(document.body)
            });
            
            // Attach scroll prevention
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($code);
            } else {
                // Inline fallback
                function preventScroll() {
                    const scrollY = window.scrollY || window.pageYOffset;
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.width = '100%';
                    document.body.setAttribute('data-scroll-y', scrollY);
                }
                
                function restoreScroll() {
                    const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, parseInt(scrollY));
                    document.body.removeAttribute('data-scroll-y');
                }
                
                $code.on('select2:open', preventScroll);
                $code.on('select2:close', restoreScroll);
            }
        }
    } catch (e) {
    }
}
function QCPropertyMasterlist(QCPropertyGroupMaster_Code) {
    QCPropertyItemConfigurationService.GetQCPropertyMasterForDropdown(QCPropertyGroupMaster_Code)
        .then(function (response) {
            G_QCPropertyMasterList = Array.isArray(response) ? response : [];
            getQCPropertyMasterlist(G_QCPropertyMasterList);
        })
        .catch(function (error) {
            console.error('Error loading QC Property master list:', error);
            G_QCPropertyMasterList = [];
        });
}
function getQCPropertyMasterlist(list) {
    const $code = $('#txtPropertyName');
    if (!$code.length) {
        return;
    }

    let codeOptions = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const Code = item['Code'] || 0;
        const PropertyName = item['PropertyName'] || '';
        codeOptions += `<option value="${Code}">${PropertyName}</option>`;
    });

    $code.html(codeOptions);

    try {
        if ($.fn.select2) {
            $code.select2({ 
                width: '100%',
                dropdownParent: $(document.body)
            });
            
            // Attach scroll prevention
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($code);
            } else {
                // Inline fallback
                function preventScroll() {
                    const scrollY = window.scrollY || window.pageYOffset;
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.width = '100%';
                    document.body.setAttribute('data-scroll-y', scrollY);
                }
                
                function restoreScroll() {
                    const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, parseInt(scrollY));
                    document.body.removeAttribute('data-scroll-y');
                }
                
                $code.on('select2:open', preventScroll);
                $code.on('select2:close', restoreScroll);
            }
        }
    } catch (e) {
    }
}

$("#txtPropertyGroup").change(function () {
    var Code = $(this).val();
    QCPropertyMasterlist(Code);
});

$("#txtPropertyName").change(function () {
    var Code = $(this).val();
    if (!Code || Code === '0') {
        return;
    }
    
    // Find the property master by Code
    const QCPropertyMaster = (G_QCPropertyMasterList || []).find(function (x) {
        const propertyCode = x['Code'] || x.Code || 0;
        return parseInt(propertyCode) === parseInt(Code);
    });
    
    if (!QCPropertyMaster) {
        return;
    }
    
    // Set Property Group first
    const targetGroupCode = QCPropertyMaster['QCPropertyGroupMaster_Code'] || QCPropertyMaster.QCPropertyGroupMaster_Code || '';
    
    if (targetGroupCode) {
        $("#txtPropertyGroup").val(targetGroupCode);
        
        if ($("#txtPropertyGroup").data('select2')) {
            $("#txtPropertyGroup").trigger('change.select2');
        } else {
            $("#txtPropertyGroup").trigger('change');
        }
    }
    
    // Populate all form fields from the property master row
    // Sort Order
    const sortOrder = QCPropertyMaster['Sort Order'] || QCPropertyMaster.SortOrder || QCPropertyMaster['SortOrder'] || '';
    if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
        $('#txtSortOrder').val(sortOrder);
    }
    
    // Value Type
    const valueType = QCPropertyMaster['Value Type'] || QCPropertyMaster.ValueType || QCPropertyMaster['ValueType'] || '';
    if (valueType) {
        $('#txtValueType').val(valueType);
        handleValueTypeChange();
    }
    
    // Min Value
    const minValue = QCPropertyMaster['Min Value'] || QCPropertyMaster.MinValue || QCPropertyMaster['MinValue'] || '';
    if (minValue !== undefined && minValue !== null && minValue !== '') {
        $('#txtMinValue').val(minValue);
    }
    
    // Max Value
    const maxValue = QCPropertyMaster['Max Value'] || QCPropertyMaster.MaxValue || QCPropertyMaster['MaxValue'] || '';
    if (maxValue !== undefined && maxValue !== null && maxValue !== '') {
        $('#txtMaxValue').val(maxValue);
    }
    
    // Default Value
    const defaultValue = QCPropertyMaster['Default Value'] || QCPropertyMaster.DefaultValue || QCPropertyMaster['DefaultValue'] || '';
    if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
        $('#txtDefaultValue').val(defaultValue);
    }
    
    // LOV Values
    const lovValues = QCPropertyMaster['LOV Values'] || QCPropertyMaster.LovValues || QCPropertyMaster['LovValues'] || QCPropertyMaster['LOVValues'] || '';
    if (lovValues !== undefined && lovValues !== null && lovValues !== '') {
        $('#txtLovValues').val(lovValues);
    }
    
    // Re-attach validations after populating values
    attachSortOrderValidation();
    attachMinMaxValidation();
});
function handleValueTypeChange() {
    const valueType = $('#txtValueType').val() || '';
    const $minValue = $('#txtMinValue').parent();
    const $maxValue = $('#txtMaxValue').parent();
    const $defaultValue = $('#txtDefaultValue').parent();
    const $lovValues = $('#txtLovValues').parent();
    
    $minValue.hide();
    $maxValue.hide();
    $defaultValue.hide();
    $lovValues.hide();
    
    if (valueType === 'Numeric' || valueType === 'Decimal') {
        $minValue.show();
        $maxValue.show();
    } else if (valueType === 'Text') {
        $defaultValue.show();
    } else if (valueType === 'Lov') {
        $lovValues.show();
    }
    
      $('#txtMinValue').val('');
      $('#txtMaxValue').val('');
      $('#txtDefaultValue').val('');
      $('#txtLovValues').val('');
}
function attachSortOrderValidation() {
    const $field = $('#txtSortOrder');
    
    $field.on('keypress', function(e) {
        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return true;
        }
        
        const currentValue = $(this).val();
        const char = String.fromCharCode(e.which || e.keyCode);
        
        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
            const decimalIndex = currentValue.indexOf('.');
            if (decimalIndex !== -1) {
                const afterDecimal = currentValue.substring(decimalIndex + 1);
                if (afterDecimal.length >= 1) {
                    e.preventDefault();
                    return false;
                }
            }
            return true;
        }
        
        if ((e.keyCode === 46 || e.keyCode === 190) && currentValue.indexOf('.') === -1) {
            return true;
        }
        
        e.preventDefault();
        return false;
    });
    
    $field.on('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey || 
            [8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].indexOf(e.keyCode) !== -1) {
            return true;
        }
        
        if (e.keyCode >= 112 && e.keyCode <= 123) {
            e.preventDefault();
            return false;
        }
    });
    
    $field.on('input', function() {
        let value = $(this).val();
        const originalValue = value;
        
        value = value.replace(/[^0-9.]/g, '');
        
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
        }
        
        if (parts.length === 2 && parts[1].length > 1) {
            value = parts[0] + '.' + parts[1].substring(0, 1);
        }
        
        if (value !== originalValue) {
            $(this).val(value);
        }
    });
    
    $field.on('paste', function(e) {
        const pastedData = (e.originalEvent || e).clipboardData.getData('text');
        
        let cleanedData = pastedData.replace(/[^0-9.]/g, '');
        
        const parts = cleanedData.split('.');
        if (parts.length > 2) {
            cleanedData = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
        }
        
        if (parts.length === 2 && parts[1].length > 1) {
            cleanedData = parts[0] + '.' + parts[1].substring(0, 1);
        }
        
        if (cleanedData !== pastedData) {
            e.preventDefault();
            const currentValue = $(this).val();
            const selectionStart = this.selectionStart || 0;
            const selectionEnd = this.selectionEnd || 0;
            const newValue = currentValue.substring(0, selectionStart) + cleanedData + currentValue.substring(selectionEnd);
            
            let finalValue = newValue.replace(/[^0-9.]/g, '');
            const finalParts = finalValue.split('.');
            if (finalParts.length > 2) {
                finalValue = finalParts[0] + '.' + finalParts.slice(1).join('').replace(/\./g, '');
            }
            if (finalParts.length === 2 && finalParts[1].length > 1) {
                finalValue = finalParts[0] + '.' + finalParts[1].substring(0, 1);
            }
            
            $(this).val(finalValue);
            return false;
        }
    });
    
    $field.on('blur', function() {
        let value = $(this).val();
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        let finalValue = cleaned;
        
        if (parts.length > 2) {
            finalValue = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
        }
        if (parts.length === 2 && parts[1].length > 1) {
            finalValue = parts[0] + '.' + parts[1].substring(0, 1);
        }
        
        if (finalValue !== value) {
            $(this).val(finalValue);
        }
    });
}
function attachMinMaxValidation() {
    const $minField = $('#txtMinValue');
    const $maxField = $('#txtMaxValue');
    const valueType = $('#txtValueType').val() || '';
    
    // Remove existing event handlers to avoid duplicates
    $minField.off('keypress keydown input paste blur');
    $maxField.off('keypress keydown input paste blur');
    
    // Function to validate based on value type
    function validateField($field, e, eventType) {
        const currentValue = $field.val();
        
        // For Numeric: only integers (no decimal)
        if (valueType === 'Numeric') {
            if (eventType === 'keypress') {
                // Allow: backspace, delete, tab, escape, enter, and arrow keys
                if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true)) {
                    return true;
                }
                
                // Allow only digits (0-9), no decimal point
                if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                    return true;
                }
                
                // Block decimal point and all other characters
                e.preventDefault();
                return false;
            } else if (eventType === 'input') {
                // Remove decimal point and all non-numeric characters
                let value = currentValue.replace(/[^0-9]/g, '');
                if (value !== currentValue) {
                    $field.val(value);
                }
            } else if (eventType === 'paste') {
                const pastedData = (e.originalEvent || e).clipboardData.getData('text');
                // Only allow integers
                if (!/^-?\d+$/.test(pastedData)) {
                    e.preventDefault();
                    return false;
                }
            }
        }
        // For Decimal: allow decimal with max 2 decimal places
        else if (valueType === 'Decimal') {
            if (eventType === 'keypress') {
                // Allow: backspace, delete, tab, escape, enter, and arrow keys
                if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true)) {
                    return true;
                }
                
                // Allow digits (0-9)
                if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                    const decimalIndex = currentValue.indexOf('.');
                    if (decimalIndex !== -1) {
                        const afterDecimal = currentValue.substring(decimalIndex + 1);
                        // Limit to 2 decimal places
                        if (afterDecimal.length >= 2) {
                            e.preventDefault();
                            return false;
                        }
                    }
                    return true;
                }
                
                // Allow decimal point only once
                if ((e.keyCode === 46 || e.keyCode === 190) && currentValue.indexOf('.') === -1) {
                    return true;
                }
                
                // Block all other characters
                e.preventDefault();
                return false;
            } else if (eventType === 'input') {
                // Remove all non-numeric characters except decimal point
                let value = currentValue.replace(/[^0-9.]/g, '');
                
                // Ensure only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
                }
                
                // Limit to 2 decimal places
                if (parts.length === 2 && parts[1].length > 2) {
                    value = parts[0] + '.' + parts[1].substring(0, 2);
                }
                
                if (value !== currentValue) {
                    $field.val(value);
                }
            } else if (eventType === 'paste') {
                const pastedData = (e.originalEvent || e).clipboardData.getData('text');
                // Allow decimal with max 2 decimal places
                if (!/^-?\d+(\.\d{1,2})?$/.test(pastedData)) {
                    e.preventDefault();
                    return false;
                }
                const parts = pastedData.split('.');
                if (parts.length === 2 && parts[1].length > 2) {
                    e.preventDefault();
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Apply validation to Min Value field
    $minField.on('keypress', function(e) {
        return validateField($(this), e, 'keypress');
    }).on('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey ||
            [8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].indexOf(e.keyCode) !== -1) {
            return true;
        }
        if (e.keyCode >= 112 && e.keyCode <= 123) {
            e.preventDefault();
            return false;
        }
    }).on('input', function() {
        validateField($(this), null, 'input');
    }).on('paste', function(e) {
        return validateField($(this), e, 'paste');
    }).on('blur', function() {
        let value = $(this).val();
        if (valueType === 'Numeric') {
            const cleaned = value.replace(/[^0-9]/g, '');
            if (cleaned !== value) {
                $(this).val(cleaned);
            }
        } else if (valueType === 'Decimal') {
            let cleaned = value.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                cleaned = parts[0] + '.' + parts[1].substring(0, 2);
            }
            if (cleaned !== value) {
                $(this).val(cleaned);
            }
        }
    });
    
    // Apply validation to Max Value field
    $maxField.on('keypress', function(e) {
        return validateField($(this), e, 'keypress');
    }).on('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey ||
            [8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].indexOf(e.keyCode) !== -1) {
            return true;
        }
        if (e.keyCode >= 112 && e.keyCode <= 123) {
            e.preventDefault();
            return false;
        }
    }).on('input', function() {
        validateField($(this), null, 'input');
    }).on('paste', function(e) {
        return validateField($(this), e, 'paste');
    }).on('blur', function() {
        let value = $(this).val();
        if (valueType === 'Numeric') {
            const cleaned = value.replace(/[^0-9]/g, '');
            if (cleaned !== value) {
                $(this).val(cleaned);
            }
        } else if (valueType === 'Decimal') {
            let cleaned = value.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                cleaned = parts[0] + '.' + parts[1].substring(0, 2);
            }
            if (cleaned !== value) {
                $(this).val(cleaned);
            }
        }
    });
}
function saveQCPropertyItemConfiguration() {
    const itemCode = $('#txtItemCode').val();
    const itemName = $('#txtItemName').val();
    const propertyGroup = $('#txtPropertyGroup').val();
    const propertyName = $('#txtPropertyName').val();
    const sortOrder = $('#txtSortOrder').val();
    const valueType = $('#txtValueType').val();
    
    if (!itemCode || itemCode === '0') {
        toastr.error('Please select Item Code.');
        $('#txtItemCode').focus();
        return;
    }
    
    if (!itemName || itemName === '0') {
        toastr.error('Please select Item Name.');
        $('#txtItemName').focus();
        return;
    }
    
    if (!propertyGroup || propertyGroup === '0') {
        toastr.error('Please select Property Group.');
        $('#txtPropertyGroup').focus();
        return;
    }
    
    if (!propertyName || propertyName === '0') {
        toastr.error('Please select Property Name.');
        $('#txtPropertyName').focus();
        return;
    }
    
    if (!sortOrder || sortOrder.trim() === '') {
        toastr.error('Please enter Sort Order.');
        $('#txtSortOrder').focus();
        return;
    }
    
    if (!valueType || valueType === '') {
        toastr.error('Please select Value Type.');
        $('#txtValueType').focus();
        return;
    }
    
    if (valueType === 'Numeric' || valueType === 'Decimal') {
        const minValue = $('#txtMinValue').val();
        const maxValue = $('#txtMaxValue').val();
        
        if (!minValue || minValue.trim() === '') {
            toastr.error('Please enter Min Value.');
            $('#txtMinValue').focus();
            return;
        }
        
        if (!maxValue || maxValue.trim() === '') {
            toastr.error('Please enter Max Value.');
            $('#txtMaxValue').focus();
            return;
        }
        
        
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);
        if (min >= max) {
            toastr.error('Min Value must be less than Max Value.');
            $('#txtMinValue').focus();
            return;
        }
       
    } else if (valueType === 'Text') {
        const defaultValue = $('#txtDefaultValue').val();
        if (!defaultValue || defaultValue.trim() === '') {
            toastr.error('Please enter Default Value.');
            $('#txtDefaultValue').focus();
            return;
        }
    } else if (valueType === 'Lov') {
        const lovValues = $('#txtLovValues').val();
        if (!lovValues || lovValues.trim() === '') {
            toastr.error('Please enter LOV Values.');
            $('#txtLovValues').focus();
            return;
        }
    }
    
    const data = [{
        Code: $("#txtCode").val(),
        ItemMaster_Code: parseInt(itemCode),
        QCPropertyMaster_Code: parseInt(propertyName),
        SortOrder: parseFloat($('#txtSortOrder').val()) || 0,
        ValueType: valueType,
        MinValue: $('#txtMinValue').val() == '' ? 0 : $('#txtMinValue').val(),
        MaxValue: $('#txtMaxValue').val() == '' ? 0 : $('#txtMaxValue').val(),
        DefaultValue: $('#txtDefaultValue').val(),
        LovValues: $('#txtLovValues').val()
    }];
    
    if (valueType === 'Numeric' || valueType === 'Decimal') {
        data.MinValue = $('#txtMinValue').val() || 0;
        data.MaxValue = $('#txtMaxValue').val() || 0;
        data.DefaultValue = $('#txtDefaultValue').val() || '';
    } else if (valueType === 'Text') {
        data.DefaultValue = $('#txtDefaultValue').val() || '';
    } else if (valueType === 'Lov') {
        data.LovValues = $('#txtLovValues').val() || '';
    }
    Showloader();
    QCPropertyItemConfigurationService.SaveQCPropertyItemConfiguration(data)
        .then(function (response) {
            HideLoader();
            if (response && response.Status === 'Y') {
                toastr.success(response.Msg);
                getQCPropertyItemConfigurationList()
                Back();
            } else {
                toastr.error(response?.Msg || 'Error saving data.');
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error saving data. Please try again.');
        });
}
function Edit(Code) {
    var ModuleName = "QC Property Item Configuration",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            HideGrid();
            getQCPropertyItemConfigurationByCode(Code);
        }
    });
}
function getQCPropertyItemConfigurationByCode(code) {
    if (!code) {
        return;
    }
    $("#txtCode").val(code);
    QCPropertyItemConfigurationService.GetQCPropertyItemConfigurationByCode(code)
        .then(function (response) {
            if (response && Array.isArray(response) && response.length > 0) {
                const data = response[0];
                populateForm(data);
            } else {
                toastr.warning('No data found for the given code.');
            }
        })
        .catch(function (error) {
            toastr.error('Error loading data. Please try again.');
        });
}
function getQCPropertyItemConfigurationList() {
    Showloader();
    QCPropertyItemConfigurationService.GetQCPropertyItemConfigurationList()
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response)) {
                G_QCPropertyItemConfigurationList = response;
                const StringFilterColumn = ["Item Code", "Item Name", "Property Group","Property Name",	"Value Type"	,"Lov Values","Default Value"];
                const NumericFilterColumn = ["Sort Order", "Min Value","Max Value"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    SNo : 'center;width:10px',
                    "Sort Order" : 'right;width:20px',
                    "Min Value": 'right;width:20px',
                    "Max Value": 'right;width:20px'
                };
                const updatedResponse = response.map((item) => {
                    let InputHTML = `<button class="btn btn-warning icon-height mb-1" title="Edit" onclick="Edit(${item.Code})"><i class="fa fa-pencil"></i></button>&nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete(${item.Code})"><i class="fa fa-trash"></i></button>`;
                    return {
                        ...item,
                        'Action': InputHTML,
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
            } else {
                toastr.error('No data found');
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error loading list. Please try again.');
        });
}
function populateForm(data) {
    if (!data) return;
    if (data.ItemMaster_Code) {
        $('#txtItemCode').val(data.ItemMaster_Code).trigger('change.select2');
    }
    if (data.ItemMaster_Code) {
        $('#txtItemName').val(data.ItemMaster_Code).trigger('change.select2');
    }
    if (data.QCPropertyGroupMaster_Code) {
        $('#txtPropertyGroup').val(data.QCPropertyGroupMaster_Code).trigger('change.select2');
        setTimeout(function() {
            if (data.QCPropertyMaster_Code) {
                $('#txtPropertyName').val(data.QCPropertyMaster_Code).trigger('change.select2');
            }
        }, 500);
    }
    if (data.SortOrder !== undefined && data.SortOrder !== null) {
        $('#txtSortOrder').val(data.SortOrder);
    }
    if (data.ValueType) {
        $('#txtValueType').val(data.ValueType);
    }
    handleValueTypeChange();
    attachMinMaxValidation();
    if (data.MinValue) {
        $('#txtMinValue').val(data.MinValue);
    }
    if (data.MaxValue) {
        $('#txtMaxValue').val(data.MaxValue);
    }
    if (data.DefaultValue) {
        $('#txtDefaultValue').val(data.DefaultValue);
    }
    if (data.LovValues) {
        $('#txtLovValues').val(data.LovValues);
    }
}
function clearForm() {
    $('#txtItemCode').val('0').trigger('change.select2');
    $('#txtItemName').val('0').trigger('change.select2');
    $('#txtPropertyGroup').val('0').trigger('change.select2');
    $('#txtPropertyName').val('0').trigger('change.select2');
    $('#txtSortOrder').val('');
    $('#txtValueType').val('Numeric').trigger('change');
    $('#txtMinValue').val('');
    $('#txtMaxValue').val('');
    $('#txtDefaultValue').val('');
    $('#txtLovValues').val('');
    $("#txtCode").val(0);
    
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
function SaveData() {
    var ModuleName = "QC Property Item Configuration",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            saveQCPropertyItemConfiguration();
        }
    });
}
function Delete(Code) {
    var ModuleName = "QC Property Item Configuration",
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModal(Code);
        }
    });
}
function OpenModal(Code) {
    $('#hfCode').val(Code);
    $('#dvRemark').modal({ backdrop: 'static' });
    $('#dvRemark').modal('show');
    $("#txtRemark").val("");
}
function CloseModal() {
    $('#dvRemark').modal('hide');
    $("#txtRemark").val("");
}
function DeleteItemConfiguration() {
    var code = $("#hfCode").val();
    var Remark = $("#txtRemark").val();
    QCPropertyItemConfigurationService.DeleteQCPropertyItemConfiguration(code, Remark)
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                CloseModal();
                Back();
            } else {
                toastr.error(response.Msg);
            }
        })
        .catch(function (error) {
            toastr.error('Error loading data. Please try again.');
        });
}
function Back() {
    ShowGrid();
    clearForm();
}
function attachEnterKeyNavigation() {
    const fieldSequence = [
        '#txtItemCode',
        '#txtItemName',
        '#txtPropertyGroup',
        '#txtPropertyName',
        '#txtSortOrder',
        '#txtValueType',
        '#txtMinValue',
        '#txtMaxValue',
        '#txtDefaultValue',
        '#txtLovValues'
    ];
    function isFieldVisible($field) {
        if (!$field.length || !$field.is(':visible')) {
            return false;
        }
        // Check if parent with 'hide' class is visible
        const $hiddenParent = $field.closest('.hide');
        if ($hiddenParent.length > 0 && !$hiddenParent.is(':visible')) {
            return false;
        }
        return true;
    }
    function getNextVisibleField(currentIndex) {
        for (let i = currentIndex + 1; i < fieldSequence.length; i++) {
            const $field = $(fieldSequence[i]);
            if (isFieldVisible($field)) {
                return $field;
            }
        }
        return null;
    }
    function focusNextField($currentField) {
        const currentIndex = fieldSequence.findIndex(selector => $currentField.is(selector));
        if (currentIndex === -1) return;
        
        const $nextField = getNextVisibleField(currentIndex);
        if ($nextField && $nextField.length) {
            setTimeout(function() {
                if ($nextField.hasClass('select2-hidden-accessible') || $nextField.data('select2')) {
                    $nextField.select2('open');
                } else {
                    $nextField.focus();
                    if ($nextField.is('input[type="text"]')) {
                        $nextField.select();
                    }
                }
            }, 50);
        } else {
            setTimeout(function() {
                $('#btnSave').focus();
            }, 50);
        }
    }

    fieldSequence.forEach(function(selector) {
        const $field = $(selector);
        if ($field.length) {
            if ($field.is('select')) {
                $field.on('keydown', function(e) {
                    if (e.keyCode === 13) {
                        const $select2 = $(this);
                        const select2Instance = $select2.data('select2');
                        if (select2Instance && select2Instance.isOpen()) {
                            return true;
                        }
                        e.preventDefault();
                        focusNextField($select2);
                    }
                });
            } else {
                $field.on('keydown', function(e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        focusNextField($(this));
                    }
                });
            }
        }
    });
}

function Download() {
    const hiddenFields = [
        "Code"
    ];
    ExportToExcelControl.ExportToExcel(G_QCPropertyItemConfigurationList, hiddenFields, "QCPropertyItemConfiguration");
}

window.Edit = Edit;
window.SaveData = SaveData;
window.Back = Back;
window.Delete = Delete;
window.CloseModal = CloseModal;
window.CreateNew = CreateNew;
window.Download = Download;
window.DeleteItemConfiguration = DeleteItemConfiguration;