import { QCPropertyItemConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyItemConfigurationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_ItemMasterList = [];
let G_QCGroupMasterList = [];
let G_QCPropertyMasterList = [];
let G_QCPropertyItemConfigurationList = [];
let G_IsProperty = 'Y';
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
    //handleValueTypeChange();
    
    $('#txtValueType').on('change', function() {
        handleValueTypeChange();
        attachMinMaxValidation();
    });
    $('#chkIsProperty').on('change', function () {
        G_IsProperty = this.checked ? 'Y' : 'N';
        getQCPropertyItemConfigurationList();
    });
    $('#txtItemName').on('change', function () {
        let ItemMaster_Code = $(this).val();
        getQCPropertyItemConfigurationByCode(ItemMaster_Code);
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
    $("#dvIsProperty").show();
    getQCPropertyItemConfigurationList();
}
function HideGrid() {
    $("#dvGrid").hide();
    $("#dvFrom").show();
    $("#dvIsProperty").hide();
    // Initialize empty editable table
    buildEmptyEditableTable();
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
    const $name = $('#txtItemName');

    let nameOptions = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const Code = item.Code || '';

        const itemName = item.ItemName || '';

        nameOptions += `<option value="${Code}">${itemName}</option>`;
    });

    $name.html(nameOptions);

    try {
        if ($.fn.select2) {
            $name.select2({ 
                width: '100%',
                dropdownParent: $(document.body)
            });
            
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($name);
            } else {
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
        const sortOrderValue = parseFloat(sortOrder);
        if (!isNaN(sortOrderValue)) {
            $('#txtSortOrder').val(sortOrderValue.toFixed(1));
        } else {
            $('#txtSortOrder').val(sortOrder);
        }
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
        const minValueNum = parseFloat(minValue);
        if (!isNaN(minValueNum)) {
            $('#txtMinValue').val(minValueNum.toFixed(2));
        } else {
            $('#txtMinValue').val(minValue);
        }
    }
    
    // Max Value
    const maxValue = QCPropertyMaster['Max Value'] || QCPropertyMaster.MaxValue || QCPropertyMaster['MaxValue'] || '';
    if (maxValue !== undefined && maxValue !== null && maxValue !== '') {
        const maxValueNum = parseFloat(maxValue);
        if (!isNaN(maxValueNum)) {
            $('#txtMaxValue').val(maxValueNum.toFixed(2));
        } else {
            $('#txtMaxValue').val(maxValue);
        }
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
        
        if (finalValue !== '' && finalValue !== null && finalValue !== undefined) {
            const numValue = parseFloat(finalValue);
            if (!isNaN(numValue)) {
                finalValue = numValue.toFixed(1);
            }
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
        //if (valueType === 'Numeric') {
        //    if (eventType === 'keypress') {
        //        // Allow: backspace, delete, tab, escape, enter, and arrow keys
        //        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        //            (e.keyCode === 65 && e.ctrlKey === true) ||
        //            (e.keyCode === 67 && e.ctrlKey === true) ||
        //            (e.keyCode === 86 && e.ctrlKey === true) ||
        //            (e.keyCode === 88 && e.ctrlKey === true)) {
        //            return true;
        //        }
                
        //        // Allow only digits (0-9), no decimal point
        //        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
        //            return true;
        //        }
                
        //        // Block decimal point and all other characters
        //        e.preventDefault();
        //        return false;
        //    } else if (eventType === 'input') {
        //        // Remove decimal point and all non-numeric characters
        //        let value = currentValue.replace(/[^0-9]/g, '');
        //        if (value !== currentValue) {
        //            $field.val(value);
        //        }
        //    } else if (eventType === 'paste') {
        //        const pastedData = (e.originalEvent || e).clipboardData.getData('text');
        //        // Only allow integers
        //        if (!/^-?\d+$/.test(pastedData)) {
        //            e.preventDefault();
        //            return false;
        //        }
        //    }
        //}
        // For Numeric and Decimal: allow decimal with max 2 decimal places
        if (valueType === 'Numeric' || valueType === 'Decimal') {
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
            let cleaned = value.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                cleaned = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            if (cleaned !== '' && cleaned !== null && cleaned !== undefined) {
                const numValue = parseFloat(cleaned);
                if (!isNaN(numValue)) {
                    cleaned = numValue.toFixed(2);
                }
            }
            
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
            
            if (cleaned !== '' && cleaned !== null && cleaned !== undefined) {
                const numValue = parseFloat(cleaned);
                if (!isNaN(numValue)) {
                    cleaned = numValue.toFixed(2);
                }
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
            let cleaned = value.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                cleaned = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            if (cleaned !== '' && cleaned !== null && cleaned !== undefined) {
                const numValue = parseFloat(cleaned);
                if (!isNaN(numValue)) {
                    cleaned = numValue;
                }
            }
            
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
            
            if (cleaned !== '' && cleaned !== null && cleaned !== undefined) {
                const numValue = parseFloat(cleaned);
                if (!isNaN(numValue)) {
                    cleaned = numValue.toFixed(2);
                }
            }
            
            if (cleaned !== value) {
                $(this).val(cleaned);
            }
        }
    });
}
function saveQCPropertyItemConfiguration() {
    // Build payload from editable table rows
    const itemName = $('#txtItemName').val();
    if (!itemName || itemName === '0') {
        toastr.error('Please select Item Name.');
        $('#txtItemName').focus();
        return;
    }

    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        toastr.error('Editable table not found.');
        return;
    }

    const $rows = $tbody.find('tr');
    if ($rows.length === 0) {
        toastr.error('Please add at least one row before saving.');
        return;
    }

    // Validate all rows first
    const validation = validateAllEditableTableRows();
    if (!validation.isValid) {
        toastr.warning(validation.message);
        if (validation.$field) {
            setTimeout(function () {
                if (validation.$field.is('select')) {
                    if (validation.$field.data('select2')) {
                        validation.$field.select2('open');
                    } else {
                        validation.$field.focus();
                    }
                } else {
                    validation.$field.focus();
                }
                validation.$field.addClass('is-invalid');
                setTimeout(function () {
                    validation.$field.removeClass('is-invalid');
                }, 3000);
            }, 100);
        }
        return;
    }

    // Build payload array from each row
    const data = [];
    $rows.each(function () {
        const $row = $(this);

        const code = $row.data('code') || 0;
        const itemMasterCode = $row.data('item-master-code') || itemName;

        const $propertyGroup = $row.find('.editable-property-group-select');
        const $propertyName = $row.find('.editable-property-name-select');
        const $sortOrder = $row.find('.editable-sort-order');
        const $valueType = $row.find('.editable-value-type-select');
        const $minValue = $row.find('.editable-min-value');
        const $maxValue = $row.find('.editable-max-value');
        const $defaultValue = $row.find('.editable-default-value');
        const $lovValues = $row.find('.editable-lov-values');

        const valueType = ($valueType.val() || '').trim();

        const payloadItem = {
            Code: code,
            ItemMaster_Code: parseInt(itemMasterCode),
            QCPropertyMaster_Code: parseInt($propertyName.val() || 0),
            SortOrder: parseFloat($sortOrder.val() || 0) || 0,
            ValueType: valueType,
            MinValue: 0,
            MaxValue: 0,
            DefaultValue: '',
            LovValues: ''
        };

        if (valueType === 'Numeric' || valueType === 'Decimal') {
            payloadItem.MinValue = $minValue.val() === '' ? 0 : $minValue.val();
            payloadItem.MaxValue = $maxValue.val() === '' ? 0 : $maxValue.val();
        } else if (valueType === 'Text') {
            payloadItem.DefaultValue = $defaultValue.val() || '';
        } else if (valueType === 'Lov') {
            payloadItem.LovValues = $lovValues.val() || '';
        }

        data.push(payloadItem);
    });

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
    if (!code || code === '0') {
        buildEmptyEditableTable();
        return;
    }
    $("#txtCode").val(code);
    const $itemName = $('#txtItemName');
    $itemName.val(code);   

    if ($itemName.data('select2')) {
        $itemName.trigger('change.select2');
    } else {
        $itemName.trigger('change');
    }
    Showloader();
    QCPropertyItemConfigurationService.GetQCPropertyItemConfigurationByCode(code)
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response) && response.length > 0) {
                buildEditableTable(response, code);
            } else {
                buildEmptyEditableTable(code);
                addNewEditableRow(code, $('#table-bodyEditable'));
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error loading data. Please try again.');
            buildEmptyEditableTable(code);
        });
}
function buildEditableTable(data, itemMasterCode) {
    const $thead = $('#table-headerEditable');
    const $tbody = $('#table-bodyEditable');
    
    if (!$thead.length || !$tbody.length) {
        toastr.error('Editable table structure not found.');
        return;
    }
    
    if (!G_QCGroupMasterList || G_QCGroupMasterList.length === 0) {
        QCGroupMasterlist();
    }
    
    $thead.empty();
    $tbody.empty();
    let headerRow = '<tr>' +
        '<th class="text-center" style="width: 40px;">SNo</th>' +
        '<th class="text-left" style="width: 90px;">Item Code</th>' +
        '<th class="text-left" style="width: 160px;">Item Name</th>' +
        '<th class="text-left" style="width: 150px;">Property Group</th>' +
        '<th class="text-left" style="width: 150px;">Property Name</th>' +
        '<th class="text-center" style="width: 90px;">Sort Order</th>' +
        '<th class="text-left" style="width: 100px;">Value Type</th>' +
        '<th class="text-right" style="width: 80px;">Min Value</th>' +
        '<th class="text-right" style="width: 80px;">Max Value</th>' +
        '<th class="text-left" style="width: 100px;">Default Value</th>' +
        '<th class="text-left" style="width: 150px;">LOV Values</th>' +
        '<th class="text-center" style="width: 80px;">Action</th>' +
        '</tr>';
    
    $thead.html(headerRow);
    
    const $tableWrapper = $tbody.closest('.table-wrapper');
    if ($tableWrapper.length) {
        // Remove any existing external "Add New Row" button if present
        $tableWrapper.find('.btn-add-row').remove();
    }
    
    let propertyGroupOptions = '<option value="0">Please select..</option>';
    (G_QCGroupMasterList || []).forEach(function (groupItem) {
        const groupCode = groupItem['Code'] || 0;
        const groupName = groupItem['QC Group Name'] || '';
        propertyGroupOptions += `<option value="${groupCode}">${groupName}</option>`;
    });
    
    data.forEach(function (item, index) {
        const serialNumber = index + 1;
        const itemCode = item['Item Code'] || item.ItemCode || '';
        const itemName = item['Item Name'] || item.ItemName || '';
        const propertyGroupCode = item['QCPropertyGroupMaster_Code'] || item.QCPropertyGroupMaster_Code || 0;
        const propertyGroup = item['Property Group'] || item.PropertyGroup || '';
        const propertyNameCode = item['QCPropertyMaster_Code'] || item.QCPropertyMaster_Code || 0;
        const propertyName = item['Property Name'] || item.PropertyName || '';
        const sortOrder = item['Sort Order'] || item.SortOrder || '';
        const valueType = item['Value Type'] || item.ValueType || 'Numeric';
        const minValue = item['Min Value'] || item.MinValue || '';
        const maxValue = item['Max Value'] || item.MaxValue || '';
        const defaultValue = item['Default Value'] || item.DefaultValue || '';
        const lovValues = item['LOV Values'] || item.LovValues || '';
        const code = item.Code || 0;
        
        let propertyNameOptions = '<option value="0">Please select..</option>';
        
        const valueTypeOptions = [
            { value: 'Numeric', text: 'Numeric', selected: valueType === 'Numeric' },
            { value: 'Text', text: 'Text', selected: valueType === 'Text' },
            { value: 'Lov', text: 'Lov', selected: valueType === 'Lov' }
        ];
        let valueTypeSelect = '<select class="form-control form-control-sm editable-value-type-select" data-code="' + code + '" data-row-index="' + index + '" autocomplete="off">';
        valueTypeOptions.forEach(function(opt) {
            valueTypeSelect += `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.text}</option>`;
        });
        valueTypeSelect += '</select>';
        
        const showMinMax = (valueType === 'Numeric' || valueType === 'Decimal');
        const showDefault = (valueType === 'Text');
        const showLov = (valueType === 'Lov');
        
        let row = '<tr data-code="' + code + '" data-item-master-code="' + itemMasterCode + '" data-property-group-code="' + propertyGroupCode + '" data-property-name-code="' + propertyNameCode + '">' +
            '<td class="text-center" style="width: 40px;">' + serialNumber + '</td>' +
            '<td class="text-left" style="width: 90px;">' +
                '<input type="text" ' +
                'class="form-control form-control-sm" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + itemCode + '" ' +
                'disabled ' +
                'readonly ' +
                'style="background-color: #e9ecef; cursor: not-allowed; width: 100%;">' +
            '</td>' +
            '<td class="text-left" style="width: 160px;">' +
                '<input type="text" ' +
                'class="form-control form-control-sm" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + itemName + '" ' +
                'disabled ' +
                'readonly ' +
                'style="background-color: #e9ecef; cursor: not-allowed; width: 100%;">' +
            '</td>' +
            '<td class="text-left" style="width: 150px;">' +
                '<select class="form-control form-control-sm editable-property-group-select" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'autocomplete="off" required style="width: 100%;">' +
                (propertyGroupCode && propertyGroupCode !== '0' 
                    ? propertyGroupOptions.replace('value="' + propertyGroupCode + '"', 'value="' + propertyGroupCode + '" selected')
                    : propertyGroupOptions) +
                '</select>' +
            '</td>' +
            '<td class="text-left" style="width: 150px;">' +
                '<select class="form-control form-control-sm editable-property-name-select" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'data-property-group-code="' + propertyGroupCode + '" ' +
                'autocomplete="off" required style="width: 100%;">' +
                propertyNameOptions +
                '</select>' +
            '</td>' +
            '<td class="text-center" style="width: 90px;">' +
                '<input type="text" class="form-control form-control-sm editable-sort-order" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + sortOrder + '" ' +
                'placeholder="Sort Order" ' +
                'style="text-align: right; width: 100%;" maxlength="5" required />' +
            '</td>' +
            '<td class="text-left" style="width: 100px;">' + valueTypeSelect.replace('<select', '<select required style="width: 100%;"') + '</td>' +
            '<td class="text-right" style="width: 80px;">' +
                '<input type="text" class="form-control form-control-sm editable-min-value numeric-input" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + minValue + '" ' +
                'placeholder="Min Value" ' +
                'style="text-align: right; width: 100%;' + (showMinMax ? '' : 'display:none;') + '" ' +
                'maxlength="8" />' +
            '</td>' +
            '<td class="text-right" style="width: 80px;">' +
                '<input type="text" class="form-control form-control-sm editable-max-value numeric-input" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + maxValue + '" ' +
                'placeholder="Max Value" ' +
                'style="text-align: right; width: 100%;' + (showMinMax ? '' : 'display:none;') + '" ' +
                'maxlength="8" />' +
            '</td>' +
            '<td class="text-left" style="width: 100px;">' +
                '<input type="text" class="form-control form-control-sm editable-default-value" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + defaultValue + '" ' +
                'placeholder="Default Value" ' +
                'style="width: 100%;' + (showDefault ? '' : 'display:none;') + '" ' +
                'maxlength="100" />' +
            '</td>' +
            '<td class="text-left" style="width: 150px;">' +
                '<input type="text" class="form-control form-control-sm editable-lov-values" ' +
                'data-code="' + code + '" ' +
                'data-row-index="' + index + '" ' +
                'value="' + lovValues + '" ' +
                'placeholder="LOV Values" ' +
                'style="width: 100%;' + (showLov ? '' : 'display:none;') + '" ' +
                'maxlength="1000" />' +
            '</td>' +
            '<td class="text-center" style="width: 80px;">' +
                '<button type="button" class="btn btn-danger icon-height mb-1 btn-delete-row-inline" title="Delete Row">' +
                    '<i class="fa fa-trash"></i>' +
                '</button>&nbsp;' +
                '<button type="button" class="btn btn-success icon-height mb-1 btn-add-row-inline" title="Add New Row">' +
                    '<i class="fa fa-plus"></i>' +
                '</button>' +
            '</td>' +
            '</tr>';
        
        $tbody.append(row);
    });
    
    $tbody.find('tr').each(function() {
        const $row = $(this);
        const propertyGroupCode = $row.data('property-group-code') || 0;
        if (propertyGroupCode && propertyGroupCode !== 0) {
            loadPropertyNameOptionsForRow($row, propertyGroupCode);
        }
    });
    
    $tbody.find('select').each(function() {
        const $select = $(this);
        if ($.fn.select2) {
            $select.select2({
                width: '100%',
                dropdownParent: $(document.body)
            });
        }
    });
    
    attachEditableTablePropertyGroupChange();
    attachEditableTableValueTypeChange();
    attachEditableTableNumericValidation();
    attachEditableTableSortOrderValidation();
    attachEditableTableFieldChangeValidation();
    attachEditableTableActionButtons();
}
function validateEditableTableRow($row) {
    if (!$row || !$row.length) {
        return { isValid: false, message: 'Row not found', $field: null };
    }
    
    const $propertyGroup = $row.find('.editable-property-group-select');
    const propertyGroupValue = $propertyGroup.val();
    if (!propertyGroupValue || propertyGroupValue === '0') {
        return { isValid: false, message: 'Please select Property Group', $field: $propertyGroup };
    }
    const $propertyName = $row.find('.editable-property-name-select');
    const propertyNameValue = $propertyName.val();
    if (!propertyNameValue || propertyNameValue === '0') {
        return { isValid: false, message: 'Please select Property Name', $field: $propertyName };
    }
    
    const $sortOrder = $row.find('.editable-sort-order');
    const sortOrderValue = $sortOrder.val();
    if (!sortOrderValue || sortOrderValue.trim() === '') {
        return { isValid: false, message: 'Please enter Sort Order', $field: $sortOrder };
    }
    
    const $valueType = $row.find('.editable-value-type-select');
    const valueTypeValue = $valueType.val();
    if (!valueTypeValue || valueTypeValue.trim() === '') {
        return { isValid: false, message: 'Please select Value Type', $field: $valueType };
    }
    
    if (valueTypeValue === 'Numeric' || valueTypeValue === 'Decimal') {
        const $minValue = $row.find('.editable-min-value');
        const minValue = $minValue.val();
        if (!minValue || minValue.trim() === '') {
            return { isValid: false, message: 'Please enter Min Value', $field: $minValue };
        }
        
        const $maxValue = $row.find('.editable-max-value');
        const maxValue = $maxValue.val();
        if (!maxValue || maxValue.trim() === '') {
            return { isValid: false, message: 'Please enter Max Value', $field: $maxValue };
        }
        
        const minNum = parseFloat(minValue);
        const maxNum = parseFloat(maxValue);
        if (!isNaN(minNum) && !isNaN(maxNum) && minNum >= maxNum) {
            return { isValid: false, message: 'Min Value must be less than Max Value', $field: $minValue };
        }
    } else if (valueTypeValue === 'Text') {
        const $defaultValue = $row.find('.editable-default-value');
        const defaultValue = $defaultValue.val();
        if (!defaultValue || defaultValue.trim() === '') {
            return { isValid: false, message: 'Please enter Default Value', $field: $defaultValue };
        }
    } else if (valueTypeValue === 'Lov') {
        const $lovValues = $row.find('.editable-lov-values');
        const lovValues = $lovValues.val();
        if (!lovValues || lovValues.trim() === '') {
            return { isValid: false, message: 'Please enter LOV Values', $field: $lovValues };
        }
    }
    
    return { isValid: true, message: '', $field: null };
}
function validateAllEditableTableRows() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return { isValid: true, message: '', $field: null };
    }
    
    const $rows = $tbody.find('tr');
    if ($rows.length === 0) {
        return { isValid: true, message: '', $field: null };
    }
    
    let firstInvalidRow = null;
    $rows.each(function() {
        const $row = $(this);
        const validation = validateEditableTableRow($row);
        if (!validation.isValid && !firstInvalidRow) {
            firstInvalidRow = validation;
        }
    });
    
    return firstInvalidRow || { isValid: true, message: '', $field: null };
}
function addNewEditableRow(itemMasterCode, $tbody) {
    if (!$tbody.length) {
        $tbody = $('#table-bodyEditable');
    }
    
    if (!$tbody.length) {
        toastr.error('Table body not found.');
        return;
    }
    
    // Validate all existing rows before adding a new one
    const validation = validateAllEditableTableRows();
    if (!validation.isValid) {
        toastr.warning(validation.message);
        if (validation.$field) {
            // Focus on the field
            setTimeout(function() {
                if (validation.$field.is('select')) {
                    if (validation.$field.data('select2')) {
                        validation.$field.select2('open');
                    } else {
                        validation.$field.focus();
                    }
                } else {
                    validation.$field.focus();
                }
                // Highlight the field
                validation.$field.addClass('is-invalid');
                setTimeout(function() {
                    validation.$field.removeClass('is-invalid');
                }, 3000);
            }, 100);
        }
        return;
    }
    
    // Check if item is selected
    if (!itemMasterCode || itemMasterCode === '0') {
        toastr.warning('Please select an Item Name first.');
        return;
    }
    
    // Get item details
    let itemCodeValue = '';
    let itemNameValue = '';
    if (itemMasterCode && itemMasterCode !== '0') {
        const selectedItem = (G_ItemMasterList || []).find(function(item) {
            const itemCode = item.Code || '';
            return parseInt(itemCode) === parseInt(itemMasterCode) || String(itemCode) === String(itemMasterCode);
        });
        if (selectedItem) {
            itemCodeValue = selectedItem.ItemCode || selectedItem['Item Code'] || selectedItem.Code || '';
            itemNameValue = selectedItem.ItemName || selectedItem['Item Name'] || '';
        }
    }
    
    // Get current row count for serial number
    const currentRowCount = $tbody.find('tr').length;
    const serialNumber = currentRowCount + 1;
    const newRowIndex = currentRowCount;
    const newCode = 0; // New row has code 0
    
    // Build Property Group dropdown options
    let propertyGroupOptions = '<option value="0">Please select..</option>';
    (G_QCGroupMasterList || []).forEach(function (groupItem) {
        const groupCode = groupItem['Code'] || 0;
        const groupName = groupItem['QC Group Name'] || '';
        propertyGroupOptions += `<option value="${groupCode}">${groupName}</option>`;
    });
    
    // Value Type dropdown options (default to Numeric)
    const valueType = 'Numeric';
    const valueTypeOptions = [
        { value: 'Numeric', text: 'Numeric', selected: true },
        { value: 'Text', text: 'Text', selected: false },
        { value: 'Lov', text: 'Lov', selected: false }
    ];
    let valueTypeSelect = '<select class="form-control form-control-sm editable-value-type-select" data-code="' + newCode + '" data-row-index="' + newRowIndex + '" autocomplete="off" required>';
    valueTypeOptions.forEach(function(opt) {
        valueTypeSelect += `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.text}</option>`;
    });
    valueTypeSelect += '</select>';
    
    // Determine which fields to show based on Value Type (Numeric by default)
    const showMinMax = true; // Numeric shows Min/Max
    const showDefault = false;
    const showLov = false;
    
    // Build the new row
    let row = '<tr data-code="' + newCode + '" data-item-master-code="' + itemMasterCode + '" data-property-group-code="0" data-property-name-code="0">' +
        '<td class="text-center" style="width: 40px;">' + serialNumber + '</td>' +
        '<td class="text-left" style="width: 90px;">' +
            '<input type="text" ' +
            'class="form-control form-control-sm" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="' + itemCodeValue + '" ' +
            'disabled ' +
            'readonly ' +
            'style="background-color: #e9ecef; cursor: not-allowed; width: 100%;">' +
        '</td>' +
        '<td class="text-left" style="width: 160px;">' +
            '<input type="text" ' +
            'class="form-control form-control-sm" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="' + itemNameValue + '" ' +
            'disabled ' +
            'readonly ' +
            'style="background-color: #e9ecef; cursor: not-allowed; width: 100%;">' +
        '</td>' +
        '<td class="text-left" style="width: 150px;">' +
            '<select class="form-control form-control-sm editable-property-group-select" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'autocomplete="off" required style="width: 100%;">' +
            propertyGroupOptions +
            '</select>' +
        '</td>' +
        '<td class="text-left" style="width: 150px;">' +
            '<select class="form-control form-control-sm editable-property-name-select" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'data-property-group-code="0" ' +
            'autocomplete="off" required style="width: 100%;">' +
            '<option value="0">Please select..</option>' +
            '</select>' +
        '</td>' +
        '<td class="text-center" style="width: 90px;">' +
            '<input type="text" class="form-control form-control-sm editable-sort-order" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="" ' +
            'placeholder="Sort Order" ' +
            'style="text-align: right; width: 100%;" maxlength="5" required />' +
        '</td>' +
        '<td class="text-left" style="width: 100px;">' + valueTypeSelect.replace('<select', '<select style="width: 100%;"') + '</td>' +
        '<td class="text-right" style="width: 80px;">' +
            '<input type="text" class="form-control form-control-sm editable-min-value numeric-input" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="" ' +
            'placeholder="Min Value" ' +
            'style="text-align: right; width: 100%;' + (showMinMax ? '' : 'display:none;') + '" ' +
            'maxlength="8" />' +
        '</td>' +
        '<td class="text-right" style="width: 80px;">' +
            '<input type="text" class="form-control form-control-sm editable-max-value numeric-input" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="" ' +
            'placeholder="Max Value" ' +
            'style="text-align: right; width: 100%;' + (showMinMax ? '' : 'display:none;') + '" ' +
            'maxlength="8" />' +
        '</td>' +
        '<td class="text-left" style="width: 100px;">' +
            '<input type="text" class="form-control form-control-sm editable-default-value" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="" ' +
            'placeholder="Default Value" ' +
            'style="width: 100%;' + (showDefault ? '' : 'display:none;') + '" ' +
            'maxlength="100" />' +
        '</td>' +
        '<td class="text-left" style="width: 150px;">' +
            '<input type="text" class="form-control form-control-sm editable-lov-values" ' +
            'data-code="' + newCode + '" ' +
            'data-row-index="' + newRowIndex + '" ' +
            'value="" ' +
            'placeholder="LOV Values" ' +
            'style="width: 100%;' + (showLov ? '' : 'display:none;') + '" ' +
            'maxlength="1000" />' +
        '</td>' +
        '<td class="text-center" style="width: 80px;">' +
            '<button type="button" class="btn btn-danger icon-height mb-1 btn-delete-row-inline" title="Delete Row">' +
                '<i class="fa fa-trash"></i>' +
            '</button>&nbsp;' +
            '<button type="button" class="btn btn-success icon-height mb-1 btn-add-row-inline" title="Add New Row">' +
                '<i class="fa fa-plus"></i>' +
            '</button>' +
        '</td>' +
        '</tr>';
    
    // Append the new row
    $tbody.append(row);
    
    // Initialize select2 for dropdowns in the new row
    const $newRow = $tbody.find('tr').last();
    $newRow.find('select').each(function() {
        const $select = $(this);
        if ($.fn.select2) {
            $select.select2({
                width: '100%',
                dropdownParent: $(document.body)
            });
        }
    });
    
    // Attach event handlers to the new row (they use event delegation, so they should work automatically)
    // But we need to make sure the handlers are attached
    attachEditableTablePropertyGroupChange();
    attachEditableTableValueTypeChange();
    attachEditableTableNumericValidation();
    attachEditableTableSortOrderValidation();
    attachEditableTableFieldChangeValidation();
    attachEditableTableActionButtons();
}
function buildEmptyEditableTable(itemMasterCode) {
    const $thead = $('#table-headerEditable');
    const $tbody = $('#table-bodyEditable');
    
    if (!$thead.length || !$tbody.length) {
        toastr.error('Editable table structure not found.');
        return;
    }
    
    // Clear existing content
    $thead.empty();
    $tbody.empty();
    
    // Build table header
    let headerRow = '<tr>' +
        '<th class="text-center" style="width: 40px;">SNo</th>' +
        '<th class="text-left" style="width: 90px;">Item Code</th>' +
        '<th class="text-left" style="width: 160px;">Item Name</th>' +
        '<th class="text-left" style="width: 150px;">Property Group</th>' +
        '<th class="text-left" style="width: 150px;">Property Name</th>' +
        '<th class="text-center" style="width: 90px;">Sort Order</th>' +
        '<th class="text-left" style="width: 100px;">Value Type</th>' +
        '<th class="text-right" style="width: 80px;">Min Value</th>' +
        '<th class="text-right" style="width: 80px;">Max Value</th>' +
        '<th class="text-left" style="width: 100px;">Default Value</th>' +
        '<th class="text-left" style="width: 150px;">LOV Values</th>' +
        '<th class="text-center" style="width: 80px;">Action</th>' +
        '</tr>';
    
    $thead.html(headerRow);
    
    // Remove any external "Add New Row" button (we now use per-row Action column)
    const $tableWrapper = $tbody.closest('.table-wrapper');
    if ($tableWrapper.length) {
        $tableWrapper.find('.btn-add-row').remove();
    }
}
function attachEditableTableItemDropdownSyncEvents() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    $tbody.off('change', '.editable-item-code-select');
    $tbody.off('change', '.editable-item-name-select');
    
    let isSyncing = false;
    
    $tbody.on('change', '.editable-item-code-select', function() {
        if (isSyncing) return;
        isSyncing = true;
        
        const selectedCode = $(this).val();
        const $row = $(this).closest('tr');
        const $itemNameSelect = $row.find('.editable-item-name-select');
        
        if (!selectedCode || selectedCode === '0') {
            $itemNameSelect.val('0');
        } else {
            $itemNameSelect.val(selectedCode);
        }
        
        if ($itemNameSelect.data('select2')) {
            $itemNameSelect.trigger('change.select2');
        } else {
            $itemNameSelect.trigger('change');
        }
        
        isSyncing = false;
    });
    
    $tbody.on('change', '.editable-item-name-select', function() {
        if (isSyncing) return;
        isSyncing = true;
        
        const selectedCode = $(this).val();
        const $row = $(this).closest('tr');
        const $itemCodeSelect = $row.find('.editable-item-code-select');
        
        if (!selectedCode || selectedCode === '0') {
            $itemCodeSelect.val('0');
        } else {
            $itemCodeSelect.val(selectedCode);
        }
        
        if ($itemCodeSelect.data('select2')) {
            $itemCodeSelect.trigger('change.select2');
        } else {
            $itemCodeSelect.trigger('change');
        }
        
        isSyncing = false;
    });
}
function loadPropertyNameOptionsForRow($row, propertyGroupCode) {
    const $propertyNameSelect = $row.find('.editable-property-name-select');
    if (!$propertyNameSelect.length) {
        return;
    }
    
    Showloader();
    QCPropertyItemConfigurationService.GetQCPropertyMasterForDropdown(propertyGroupCode)
        .then(function (response) {
            HideLoader();
            let options = '<option value="0">Please select..</option>';
            if (response && Array.isArray(response)) {
                const currentValue = $row.data('property-name-code') || $propertyNameSelect.data('property-name-code') || 0;
                response.forEach(function (item) {
                    const Code = item['Code'] || 0;
                    const PropertyName = item['PropertyName'] || '';
                    const selected = (parseInt(Code) === parseInt(currentValue) || Code === currentValue) ? 'selected' : '';
                    options += `<option value="${Code}" ${selected}>${PropertyName}</option>`;
                });
            }
            $propertyNameSelect.html(options);
            if ($propertyNameSelect.data('select2')) {
                $propertyNameSelect.trigger('change.select2');
            }
        })
        .catch(function (error) {
            HideLoader();
            console.error('Error loading property name list:', error);
        });
}
function attachEditableTablePropertyGroupChange() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    $tbody.off('change', '.editable-property-group-select');
    $tbody.on('change', '.editable-property-group-select', function() {
        const $row = $(this).closest('tr');
        const propertyGroupCode = $(this).val();
        $row.data('property-group-code', propertyGroupCode);
        const $propertyNameSelect = $row.find('.editable-property-name-select');
        $propertyNameSelect.data('property-group-code', propertyGroupCode);
        $propertyNameSelect.data('property-name-code', '0'); // Reset property name
        
        if (propertyGroupCode && propertyGroupCode !== '0') {
            loadPropertyNameOptionsForRow($row, propertyGroupCode);
        } else {
            $propertyNameSelect.html('<option value="0">Please select..</option>');
            if ($propertyNameSelect.data('select2')) {
                $propertyNameSelect.trigger('change.select2');
            }
        }
    });
    
    // Track property name changes and prevent duplicate properties for same item
    $tbody.off('change', '.editable-property-name-select');
    $tbody.on('change', '.editable-property-name-select', function() {
        const $currentSelect = $(this);
        const $row = $currentSelect.closest('tr');
        const propertyNameCode = $currentSelect.val();

        // If nothing selected, just clear stored value
        if (!propertyNameCode || propertyNameCode === '0') {
            $row.data('property-name-code', '0');
            $currentSelect.data('property-name-code', '0');
            return;
        }

        // Determine item code for this row (from row data or main Item Name control)
        const currentItemCode = $row.data('item-master-code') || $('#txtItemName').val() || '0';

        let isDuplicate = false;
        $tbody.find('tr').each(function() {
            const $otherRow = $(this);
            if ($otherRow[0] === $row[0]) {
                return; // skip current row
            }

            const otherItemCode = $otherRow.data('item-master-code') || $('#txtItemName').val() || '0';
            const otherPropertyCode = $otherRow.find('.editable-property-name-select').val();

            if (otherItemCode && String(otherItemCode) === String(currentItemCode) &&
                otherPropertyCode && String(otherPropertyCode) === String(propertyNameCode)) {
                isDuplicate = true;
                return false; // break loop
            }
        });

        if (isDuplicate) {
            toastr.warning('This property is already selected for the selected item.');

            // Reset selection back to "Please select.."
            $currentSelect.val('0');
            $row.data('property-name-code', '0');
            $currentSelect.data('property-name-code', '0');

            if ($currentSelect.data('select2')) {
                $currentSelect.trigger('change.select2');
            } else {
                $currentSelect.trigger('change');
            }
            return;
        }

        // Store selected property code on row and element
        $row.data('property-name-code', propertyNameCode);
        $currentSelect.data('property-name-code', propertyNameCode);
    });
}
function attachEditableTableValueTypeChange() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    $tbody.off('change', '.editable-value-type-select');
    $tbody.on('change', '.editable-value-type-select', function() {
        const $row = $(this).closest('tr');
        const valueType = $(this).val();
        const $minValue = $row.find('.editable-min-value');
        const $maxValue = $row.find('.editable-max-value');
        const $defaultValue = $row.find('.editable-default-value');
        const $lovValues = $row.find('.editable-lov-values');
        
        // Hide all fields first
        $minValue.hide();
        $maxValue.hide();
        $defaultValue.hide();
        $lovValues.hide();
        
        // Show relevant fields based on value type
        if (valueType === 'Numeric' || valueType === 'Decimal') {
            $minValue.show();
            $maxValue.show();
            $defaultValue.val('');
            $lovValues.val('');
        } else if (valueType === 'Text') {
            $defaultValue.show();
            $minValue.val('');
            $maxValue.val('');
            $lovValues.val('');
        } else if (valueType === 'Lov') {
            $lovValues.show();
            $minValue.val('');
            $maxValue.val('');
            $defaultValue.val('');
        }
    });
}
function attachEditableTableNumericValidation() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    // Apply numeric validation to Min Value and Max Value fields
    $tbody.find('.editable-min-value, .editable-max-value').on('input', function() {
        let value = $(this).val();
        const originalValue = value;
        
        // Remove all non-numeric characters except decimal point
        value = value.replace(/[^0-9.]/g, '');
        
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
        }
        
        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        if (value !== originalValue) {
            $(this).val(value);
        }
    });
    
    $tbody.find('.editable-min-value, .editable-max-value').on('blur', function() {
        let value = $(this).val();
        if (value && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                $(this).val(numValue.toFixed(2));
            }
        }
    });
}
function attachEditableTableSortOrderValidation() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    $tbody.find('.editable-sort-order').on('input', function() {
        let value = $(this).val();
        const originalValue = value;
        
        // Remove all non-numeric characters except decimal point
        value = value.replace(/[^0-9.]/g, '');
        
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
        }
        
        // Limit to 1 decimal place
        if (parts.length === 2 && parts[1].length > 1) {
            value = parts[0] + '.' + parts[1].substring(0, 1);
        }
        
        if (value !== originalValue) {
            $(this).val(value);
        }
    });
    
    $tbody.find('.editable-sort-order').on('blur', function() {
        let value = $(this).val();
        if (value && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                $(this).val(numValue.toFixed(1));
            }
        }
    });
}
function attachEditableTableFieldChangeValidation() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }
    
    $tbody.on('change input', '.editable-property-group-select, .editable-property-name-select, .editable-sort-order, .editable-value-type-select, .editable-min-value, .editable-max-value, .editable-default-value, .editable-lov-values', function() {
        $(this).removeClass('is-invalid');
    });
}
function updateEditableTableActionButtons() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }

    const $rows = $tbody.find('tr');
    $rows.find('.btn-add-row-inline').hide();

    if ($rows.length > 0) {
        $rows.last().find('.btn-add-row-inline').show();
    }
}
function deleteEditableTableRowFromDatabase(code, $row, $tbody) {
    if (!code || code <= 0) {
        return;
    }

    Showloader();
    QCPropertyItemConfigurationService.DeleteQCPropertyItemConfigurationByCode(code, '')
        .then(function (response) {
            HideLoader();
            if (response && response.Status === 'Y') {
                toastr.success(response.Msg || 'Row deleted successfully.');
                $row.remove();
                renumberEditableTableRows($tbody);
                updateEditableTableActionButtons();
            } else {
                toastr.error(response?.Msg || 'Error deleting row from database.');
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error deleting row. Please try again.');
            console.error('Delete error:', error);
        });
}
function renumberEditableTableRows($tbody) {
    $tbody.find('tr').each(function (index) {
        const $currentRow = $(this);
        $currentRow.find('td:first').text(index + 1);
        $currentRow.attr('data-row-index', index);
        $currentRow.find('[data-row-index]').attr('data-row-index', index);
    });
}
function attachEditableTableActionButtons() {
    const $tbody = $('#table-bodyEditable');
    if (!$tbody.length) {
        return;
    }

    updateEditableTableActionButtons();

    $tbody.off('click', '.btn-delete-row-inline');
    $tbody.on('click', '.btn-delete-row-inline', function () {
        const $row = $(this).closest('tr');
        const $tbodyLocal = $row.closest('tbody');
        const rowCount = $tbodyLocal.find('tr').length;

        if (rowCount <= 1) {
            toastr.warning('At least one row is required and cannot be deleted.');
            return;
        }

        const rowCode = parseInt($row.data('code')) || 0;
        const propertyName = $row.find('.editable-property-name-select option:selected').text() || 'this row';

        if (!confirm('Are you sure you want to delete ' + propertyName + '?')) {
            return;
        }

        if (rowCode > 0) {
            deleteEditableTableRowFromDatabase(rowCode, $row, $tbodyLocal);
        } else {
            $row.remove();
            renumberEditableTableRows($tbodyLocal);
            updateEditableTableActionButtons();
        }
    });

    $tbody.off('click', '.btn-add-row-inline');
    $tbody.on('click', '.btn-add-row-inline', function () {
        const $row = $(this).closest('tr');
        const $tbodyLocal = $row.closest('tbody');

        const itemMasterCode = $row.data('item-master-code') || $('#txtItemName').val();
        addNewEditableRow(itemMasterCode, $tbodyLocal);
        updateEditableTableActionButtons();
    });
}
function getQCPropertyItemConfigurationList() {
    Showloader();
    QCPropertyItemConfigurationService.GetQCPropertyItemConfigurationList(G_IsProperty)
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
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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
        const sortOrderValue = parseFloat(data.SortOrder);
        if (!isNaN(sortOrderValue)) {
            $('#txtSortOrder').val(sortOrderValue.toFixed(1));
        } else {
            $('#txtSortOrder').val(data.SortOrder);
        }
    }
    if (data.ValueType) {
        $('#txtValueType').val(data.ValueType);
    }
    handleValueTypeChange();
    attachMinMaxValidation();
    if (data.MinValue !== undefined && data.MinValue !== null && data.MinValue !== '') {
        const minValue = parseFloat(data.MinValue);
        if (!isNaN(minValue)) {
            $('#txtMinValue').val(minValue.toFixed(2));
        } else {
            $('#txtMinValue').val(data.MinValue);
        }
    }
    if (data.MaxValue !== undefined && data.MaxValue !== null && data.MaxValue !== '') {
        const maxValue = parseFloat(data.MaxValue);
        if (!isNaN(maxValue)) {
            $('#txtMaxValue').val(maxValue.toFixed(2));
        } else {
            $('#txtMaxValue').val(data.MaxValue);
        }
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
function buildQCPropertyItemConfigurationTable(data) {
    const $thead = $('#table-header');
    const $tbody = $('#table-body');

    if (!$thead.length || !$tbody.length) {
        toastr.error('Table structure not found.');
        return;
    }

    $thead.empty();
    $tbody.empty();

    let headerRow = '<tr>' +
        '<th class="text-center" style="width: 40px;">SNo</th>' +
        '<th class="text-left" style="min-width: 80px;">Item Code</th>' +
        '<th class="text-left" style="min-width: 160px;">Item Name</th>' +
        '<th class="text-left" style="min-width: 150px;">Property Group</th>' +
        '<th class="text-left" style="min-width: 150px;">Property Name</th>' +
        '<th class="text-center" style="min-width: 50px;">Sort Order</th>' +
        '<th class="text-left" style="min-width: 100px;">Value Type</th>' +
        '<th class="text-right" style="min-width: 50px;">Min Value</th>' +
        '<th class="text-right" style="min-width: 50px;">Max Value</th>' +
        '<th class="text-left" style="min-width: 100px;">Default Value</th>' +
        '<th class="text-left" style="min-width: 150px;">LOV Values</th>' +
        '<th class="text-center" style="min-width: 80px;">Action</th>' +
        '</tr>';

    $thead.html(headerRow);

    data.forEach(function (item, index) {
        const serialNumber = index + 1;
        const itemCode = item['Item Code'] || item.ItemCode || item.ItemMaster_Code || '';
        const itemName = item['Item Name'] || item.ItemName || '';
        const propertyGroup = item['Property Group'] || item.PropertyGroup || '';
        const propertyName = item['Property Name'] || item.PropertyName || '';
        const sortOrder = item['Sort Order'] || item.SortOrder || '';
        const valueType = item['Value Type'] || item.ValueType || '';
        const minValue = item['Min Value'] || item.MinValue || '';
        const maxValue = item['Max Value'] || item.MaxValue || '';
        const defaultValue = item['Default Value'] || item.DefaultValue || '';
        const lovValues = item['LOV Values'] || item.LovValues || '';
        const code = item.Code || 0;

        let itemCodeOptions = '<option value="0">Please select..</option>';
        (G_ItemMasterList || []).forEach(function (masterItem) {
            const masterCode = masterItem.Code || '';
            const masterItemName = masterItem.ItemName || '';
            const selected = (masterCode === itemCode || masterCode === String(itemCode)) ? 'selected' : '';
            itemCodeOptions += `<option value="${masterCode}" ${selected}>${masterItemName}</option>`;
        });

        let itemNameOptions = '<option value="0">Please select..</option>';
        (G_ItemMasterList || []).forEach(function (masterItem) {
            const masterCode = masterItem.Code || '';
            const masterItemName = masterItem.ItemName || '';
            const selected = (masterCode === itemCode || masterCode === String(itemCode)) ? 'selected' : '';
            itemNameOptions += `<option value="${masterCode}" ${selected}>${masterItemName}</option>`;
        });

        let row = '<tr data-code="' + code + '">' +
            '<td class="text-center">' + serialNumber + '</td>' +
            '<td class="text-left">' +
            '<select class="form-control form-control-sm item-code-select" ' +
            'data-code="' + code + '" ' +
            'data-row-index="' + index + '" ' +
            'autocomplete="off">' +
            itemCodeOptions +
            '</select>' +
            '</td>' +
            '<td class="text-left">' +
            '<select class="form-control form-control-sm item-name-select" ' +
            'data-code="' + code + '" ' +
            'data-row-index="' + index + '" ' +
            'autocomplete="off">' +
            itemNameOptions +
            '</select>' +
            '</td>' +
            '<td class="text-left">' + (propertyGroup || '-') + '</td>' +
            '<td class="text-left">' + (propertyName || '-') + '</td>' +
            '<td class="text-center">' + (sortOrder || '-') + '</td>' +
            '<td class="text-left">' + (valueType || '-') + '</td>' +
            '<td class="text-right">' + (minValue || '-') + '</td>' +
            '<td class="text-right">' + (maxValue || '-') + '</td>' +
            '<td class="text-left">' + (defaultValue || '-') + '</td>' +
            '<td class="text-left">' + (lovValues || '-') + '</td>' +
            '<td class="text-center">' +
            '<button class="btn btn-warning icon-height mb-1" title="Edit" onclick="Edit(' + code + ')">' +
            '<i class="fa fa-pencil"></i></button>&nbsp;' +
            '<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete(' + code + ')">' +
            '<i class="fa fa-trash"></i></button>' +
            '</td>' +
            '</tr>';

        $tbody.append(row);
    });

    $tbody.find('.item-code-select, .item-name-select').each(function () {
        const $select = $(this);
        if ($.fn.select2) {
            $select.select2({
                width: '100%',
                dropdownParent: $(document.body)
            });
        }
    });

    attachTableItemDropdownSyncEvents();
}
function buildEmptyQCPropertyItemConfigurationTable() {
    const $thead = $('#table-header');
    const $tbody = $('#table-body');

    if (!$thead.length || !$tbody.length) {
        toastr.error('Table structure not found.');
        return;
    }

    $thead.empty();
    $tbody.empty();

    let headerRow = '<tr>' +
        '<th class="text-center" style="width: 40px;">SNo</th>' +
        '<th class="text-left" style="min-width: 90px;">Item Code</th>' +
        '<th class="text-left" style="min-width: 160px;">Item Name</th>' +
        '<th class="text-left" style="min-width: 150px;">Property Group</th>' +
        '<th class="text-left" style="min-width: 150px;">Property Name</th>' +
        '<th class="text-center" style="min-width:90px;">Sort Order</th>' +
        '<th class="text-left" style="min-width: 100px;">Value Type</th>' +
        '<th class="text-right" style="min-width: 80px;">Min Value</th>' +
        '<th class="text-right" style="min-width: 80px;">Max Value</th>' +
        '<th class="text-left" style="min-width: 100px;">Default Value</th>' +
        '<th class="text-left" style="min-width: 150px;">LOV Values</th>' +
        '<th class="text-center" style="min-width: 80px;">Action</th>' +
        '</tr>';

    $thead.html(headerRow);
    let row = '<tr data-code="0">' +
        '<td class="text-center">1</td>' +
        '<td class="text-left">' +
        '<input type="text" ' +
        'class="form-control form-control-sm" ' +
        'id="txtItemCode_0" ' +
        'value="" ' +
        'placeholder="Item Code" ' +
        'disabled ' +
        'readonly ' +
        'style="background-color: #e9ecef; cursor: not-allowed;">' +
        '</td>' +
        '<td class="text-left">' +
        '<input type="text" ' +
        'class="form-control form-control-sm" ' +
        'id="txtItemName_0" ' +
        'value="" ' +
        'placeholder="Item Name" ' +
        'disabled ' +
        'readonly ' +
        'style="background-color: #e9ecef; cursor: not-allowed;">' +
        '</td>' +
        '<td class="text-left">-</td>' +
        '<td class="text-left">-</td>' +
        '<td class="text-center">-</td>' +
        '<td class="text-left">-</td>' +
        '<td class="text-right">-</td>' +
        '<td class="text-right">-</td>' +
        '<td class="text-left">-</td>' +
        '<td class="text-left">-</td>' +
        '<td class="text-center">-</td>' +
        '</tr>';

    $tbody.append(row);
}

window.Edit = Edit;
window.SaveData = SaveData;
window.Back = Back;
window.Delete = Delete;
window.CloseModal = CloseModal;
window.CreateNew = CreateNew;
window.Download = Download;
window.DeleteItemConfiguration = DeleteItemConfiguration;