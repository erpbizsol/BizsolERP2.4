import { BuyingCapacityService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BuyingCapacityService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_BuyingCapacityRows = [];
// When true, programmatic value binding is in progress and onchange-triggered saves are ignored
let G_SuppressSave = false;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");


    //var ObjUserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
    //var SalesPersonNameSave = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
    
    //if (SalesPersonNameSave) {
    //    $('#ddlMarketingMan').val(SalesPersonNameSave);
    //}
    GetNestedMarketingManList();
    //GetBuyingCapacityList();
    //FillBuyingFrequency();
    $("#btnShow").click(function () {
        var MarketingMan_Name = $("#ddlMarketingMan").val();
        
        if (MarketingMan_Name == undefined || MarketingMan_Name == '') {
            toastr.error('Please select Sales Person');
            return false;
        }
        FillBuyingFrequency();
        GetBuyingCapacityList();
    });
});
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function GetNestedMarketingManList() {
    BuyingCapacityService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            let matchedPersonName = null;
            let marketingList = [];
            let userMaster_Code = null;

            try {
                var authKeyStr = sessionStorage.getItem('authKey');
                if (authKeyStr) {
                    var authKey = JSON.parse(authKeyStr);
                    userMaster_Code = authKey ? authKey.UserMaster_Code : null;
                }
            } catch (e) {
                console.error('Error parsing authKey:', e);
                userMaster_Code = null;
            }

            for (let i = 0; i < response.length; i++) {
                const person = response[i];
                if (person && person.PersonName) {
                    if (userMaster_Code && person.Usermaster_Code == userMaster_Code) {
                        matchedPersonName = person.PersonName;
                    }
                    marketingList.push({
                        Code: person.PersonName,
                        Desp: person.PersonName
                    });
                }
            }

            var $ddl = $('#ddlMarketingMan');
            BindSelectList1($ddl[0], marketingList);
            $ddl.find('option[value="0"]').val("ALL");

            // Determine which value should be selected
            var urlParams = getUrlVars();
            var urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
            var targetValue;
            if (urlMarketingMan === '') {
                targetValue = matchedPersonName ? matchedPersonName : "ALL";
            } else {
                targetValue = urlMarketingMan;
            }

            // (Re)initialize select2 so options and selection stay in sync
            try {
                if ($ddl.hasClass('select2-hidden-accessible')) {
                    $ddl.select2('destroy');
                }
            } catch (e) { }
            try {
                if (typeof $ddl.select2 === 'function') {
                    $ddl.select2({ width: '-webkit-fill-available' });
                }
            } catch (e) { }

            // Set the value AFTER select2 init and trigger change so the UI reflects it
            $ddl.val(targetValue);
            try {
                $ddl.trigger('change.select2');
            } catch (e) {
                $ddl.trigger('change');
            }

        } else {
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        console.error('Error loading marketing person list:', error);
        toastr.error('Error loading sales person list');
    });
}
async function GetBuyingCapacityList() {
    var MarketingPersonName = $("#ddlMarketingMan").val();
    // Procedure expects 'All' (not 'ALL') when showing all marketing persons
    if (MarketingPersonName === 'ALL' || MarketingPersonName === '0') {
        MarketingPersonName = 'All';
    }

    try {
        const response = await BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName);
        $('#BuyingCapacity').show();
        if (response && response.length > 0) {
            G_BuyingCapacityRows = response.map(function(item, index) {
                return {
                    ...item,
                    __RowIndex: index
                };
            });
            const StringFilterColumn = ["Party Name", "Marketing Person","Country", "City", "State","PinCode"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "__RowIndex"];
            const ColumnAlignment = {};
            const updatedResponse = G_BuyingCapacityRows.map((item) => {
                const rowIndex = item.__RowIndex;
                let BuyingFrequencyInputHTML = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillBuyingFrequency_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${item.Code}')"></select>`;
                let MonthlyRequiredQtyInputHTML = `<input type="text" class="form-control form-control-sm box_border text-end" id="txtMonthlyRequired_${rowIndex}" oninput="validateDecimalRateInput(this)" onblur="SaveBuyingCapacity(${rowIndex},'${item.Code}')" style="width:120px" autocomplete="off"/>`;
                let CustomerRatingInputHTML = `<input type="text" class="form-control form-control-sm box_border" id="txtCustomerRating_${rowIndex}" maxlength="100" onblur="SaveBuyingCapacity(${rowIndex},'${item.Code}')" style="width:150px" placeholder="Customer Rating" autocomplete="off"/>`;
                let GPRollingInputHTML = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillGPRolling_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${item.Code}')"></select>`;

                return {
                    ...item,
                    'Buying Frequency': BuyingFrequencyInputHTML,
                    'Monthly Required(Qty)': MonthlyRequiredQtyInputHTML,
                    'Customer Rating': CustomerRatingInputHTML,
                    'GP Rolling': GPRollingInputHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BuyingCapacity", "table-body-BuyingCapacity", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);

            // Ensure dropdown options are populated first
            await FillBuyingFrequency();
            await FillBuyingGPRolling();

            // Bind initial values from response to each row controls
            G_SuppressSave = true;
            try {
                for (var i = 0; i < G_BuyingCapacityRows.length; i++) {
                    var row = G_BuyingCapacityRows[i] || {};
                    var domIndex = typeof row.__RowIndex === 'number' ? row.__RowIndex : i;
                    var baseRow = G_BuyingCapacityRows[domIndex] || {};
                    // Prefer the display text present in the response
                    var bfText = baseRow.BuyingFrequency || baseRow['Buying Frequency'] || '';
                    // Map code to display text if needed
                    try {
                        var codeMap = { 'M': 'Monthly', 'O': 'Occasionally', 'W': 'Weekly' };
                        if (bfText && codeMap[bfText]) { bfText = codeMap[bfText]; }
                    } catch(eMap) { }
                    var qty = baseRow.MonthlyRequiredQty != null ? baseRow.MonthlyRequiredQty : (baseRow['Monthly Required(Qty)'] != null ? baseRow['Monthly Required(Qty)'] : '');
                    var customerRating = baseRow['Customer Rating'] != null ? baseRow['Customer Rating'] : (baseRow.CustomerRating != null ? baseRow.CustomerRating : (baseRow.Ratings != null ? baseRow.Ratings : ''));
                    var gpRolling = baseRow.GPRolling != null ? baseRow.GPRolling : (baseRow['GP Rolling'] != null ? baseRow['GP Rolling'] : '');

                    // Bind Buying Frequency by text using helper (matches option display text)
                    try {
                        if (bfText && typeof BizSolHelperFunction !== 'undefined' && BizSolHelperFunction.SelectOptionByText) {
                            BizSolHelperFunction.SelectOptionByText(`ddlFillBuyingFrequency_${domIndex}`, bfText);
                        } else {
                            var $bfSel = $(`#ddlFillBuyingFrequency_${domIndex}`);
                            if ($bfSel && $bfSel.length) {
                                $bfSel.find('option').filter(function(){ return $(this).text() === bfText; }).prop('selected', true);
                                try { if ($bfSel.select2) { $bfSel.trigger('change.select2'); } else { $bfSel.trigger('change'); } } catch(e2) { $bfSel.trigger('change'); }
                            }
                        }
                    } catch(e1) { }

                    // Bind Monthly Required Qty
                    var $qtyInp = $(`#txtMonthlyRequired_${domIndex}`);
                    if ($qtyInp && $qtyInp.length) {
                        if (qty !== '' && !isNaN(qty)) { $qtyInp.val(parseFloat(qty).toFixed(3)); } else { $qtyInp.val(''); }
                    }
                    // Bind Customer Rating
                    var $ratingInp = $(`#txtCustomerRating_${domIndex}`);
                    if ($ratingInp && $ratingInp.length) {
                        $ratingInp.val(customerRating || '');
                    }

                    // Bind GP Rolling by value or text
                    try {
                        SelectGPRollingOption(`ddlFillGPRolling_${domIndex}`, gpRolling);
                    } catch(e3) { }
                }
            } catch(e) { }
            finally {
                // Re-enable saving after any select2 change events settle
                setTimeout(function () { G_SuppressSave = false; }, 0);
            }
        }
        else {
            $('#BuyingCapacity').hide();
            toastr.error('No Data Found');
        }
    } catch (error) {
        HideLoader();
        $('#BuyingCapacity').hide();
        toastr.error('Error loading buying capacity data');
    }
}

function SaveBuyingCapacity(index,Code) {
    try {
        // Ignore saves fired by programmatic value binding (e.g. after clicking Show / filtering)
        if (G_SuppressSave) {
            return;
        }
        var baseItem = (G_BuyingCapacityRows && G_BuyingCapacityRows.length > index) ? G_BuyingCapacityRows[index] : null;
        if (!baseItem) {
            toastr.error('Row context not found');
            return;
        }
        var buyingFrequency = $('#ddlFillBuyingFrequency_' + index).val();
        var monthlyQtyStr = ($('#txtMonthlyRequired_' + index).val() || '').trim();
        var monthlyQty = monthlyQtyStr !== '' ? parseFloat(monthlyQtyStr) : null;
        var customerRatingVal = $('#txtCustomerRating_' + index).val();
        var customerRating = (customerRatingVal != null && typeof customerRatingVal === 'string') ? String(customerRatingVal).trim().substring(0, 100) : '';
        var gpRollingVal = $('#ddlFillGPRolling_' + index).val();
        var gpRolling = (gpRollingVal && gpRollingVal !== '0') ? gpRollingVal : '';

        if (!buyingFrequency || buyingFrequency === '0') {
            return;
        }
        if (monthlyQty !== null && (isNaN(monthlyQty) || monthlyQty < 0)) {
            toastr.error('Enter a valid Monthly Required Qty');
            return;
        }

        // Payload - allow filling one column at a time; CustomerRating optional (empty string for null)
        var payload = {
            Code: 0,
            AccountMaster_Code: parseInt(Code, 10) || 0,
            BuyingFrequency: buyingFrequency,
            MonthlyRequiredQty: monthlyQty,
            CustomerRating: customerRating === '' ? '' : customerRating,
            GPRolling: gpRolling
        };

        Showloader();
        BuyingCapacityService.SaveBuyingCapacity(JSON.stringify(payload)).then(function (response) {
            HideLoader();
            if (response) {
                var msg = response.Message || response.Msg || '';
                if (response.Status === 'Y') {
                    toastr.success(msg || 'Saved successfully');
                } else if (response.Status === 'N') {
                    toastr.error(msg || 'Save failed');
                } else {
                    toastr.info(msg || 'Updated successfully');
                }
            } else {
                toastr.error('No response received');
            }
        }).catch(function (error) {
            HideLoader();
            toastr.error('Error saving row');
        });
    } catch (e) {
        toastr.error('Unexpected error while saving');
    }
}

function ExportExcel() {
    var MarketingPersonName = $("#ddlMarketingMan").val();
    if (MarketingPersonName == undefined || MarketingPersonName === '') {
        toastr.error('Please select Sales Person');
        return;
    }
    // Procedure expects 'All' (not 'ALL') when exporting all marketing persons
    if (MarketingPersonName === 'ALL' || MarketingPersonName === '0') {
        MarketingPersonName = 'All';
    }

    Showloader();
    BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            var hiddenFields = ["Code", "__RowIndex"];
            ExportToExcelControl.ExportToExcel(response, hiddenFields, "BuyingCapacity");
            toastr.success('Export completed successfully.');
        } else {
            toastr.info('No data to export.');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && (error.Msg || error.message)) || 'Error during export.');
    });
}

async function FillBuyingFrequency(selectId) {
    try {
        const response = await BuyingCapacityService.GetBuyingFrequency();
        if (response && response.length > 0) {
            var list = response.map(function (item) {
                return { Code: item.ShortDesp, Desp: item.Value };
            });

            function bindOptions($select) {
                if (!$select || $select.length === 0) { return; }
                var option = '<option value="0">Select</option>';
                for (var i = 0; i < list.length; i++) {
                    option += '<option value="' + list[i].Code + '">' + list[i].Desp + '</option>';
                }
                $select.html(option);
                try {
                    if ($select.select2) {
                        $select.select2({ width: '-webkit-fill-available' });
                    }
                } catch(e) { }
            }

            if (selectId && typeof selectId === 'string') {
                bindOptions($('#' + selectId));
            } else {
                $('[id^=ddlFillBuyingFrequency_]').each(function () {
                    bindOptions($(this));
                });
            }
        } else {
            toastr.error('No data received or empty response');
        }
    } catch (error) {
        toastr.error('Error fetching buying frequency');
    }
}
async function FillBuyingGPRolling(selectId) {
    try {
        const response = await BuyingCapacityService.GetBuyingGPRollingCategory();
        if (response && response.length > 0) {
            var list = response.map(function (item) {
                // Store the descriptive string in RollingGPCategory: use Description as both value and text
                var text = (item.Description != null ? item.Description : (item.Desp != null ? item.Desp : item.Value));
                return { Code: text, Desp: text };
            });

            function bindOptions($select) {
                if (!$select || $select.length === 0) { return; }
                var option = '<option value="0">Select</option>';
                for (var i = 0; i < list.length; i++) {
                    option += '<option value="' + list[i].Code + '">' + list[i].Desp + '</option>';
                }
                $select.html(option);
                try {
                    if ($select.select2) {
                        $select.select2({ width: '-webkit-fill-available' });
                    }
                } catch(e) { }
            }

            if (selectId && typeof selectId === 'string') {
                bindOptions($('#' + selectId));
            } else {
                $('[id^=ddlFillGPRolling_]').each(function () {
                    bindOptions($(this));
                });
            }
        } else {
            toastr.error('No data received or empty response');
        }
    } catch (error) {
        toastr.error('Error fetching GP rolling category');
    }
}
function SelectGPRollingOption(selectId, gpValue) {
    var $sel = $('#' + selectId);
    if (!$sel || $sel.length === 0) { return; }
    if (gpValue == null || gpValue === '') { return; }
    var target = String(gpValue).trim();
    var matched = false;
    // Try match by option value first
    $sel.find('option').each(function () {
        if (!matched && String($(this).val()).trim() === target) {
            $(this).prop('selected', true);
            matched = true;
        }
    });
    // Fallback: match by option text
    if (!matched) {
        $sel.find('option').each(function () {
            if (!matched && String($(this).text()).trim() === target) {
                $(this).prop('selected', true);
                matched = true;
            }
        });
    }
    if (matched) {
        try {
            if ($sel.select2) { $sel.trigger('change.select2'); } else { $sel.trigger('change'); }
        } catch (e) { $sel.trigger('change'); }
    }
}
function validateDecimalRateInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 3) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}
function BindSelectList1(element, list) {
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function BindSelectList2(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    // Skip totals row for Pipe Stock tab
    //if ($('#pipe-stock-tab').hasClass('active')) {
    //    return;
    //}
    setTimeout(function () {
        var filteredRows = window['filteredData_BuyingCapacity'] || [];
        refreshBuyingCapacityRowControls(filteredRows);
    }, 300);
});
function refreshBuyingCapacityRowControls(rows) {
    if (!rows || rows.length === 0) {
        adjustFilterDropdownPosition();
        return;
    }

    Promise.all([FillBuyingFrequency(), FillBuyingGPRolling()]).then(function () {
        G_SuppressSave = true;
        try {
            var codeMap = { 'M': 'Monthly', 'O': 'Occasionally', 'W': 'Weekly' };

            for (var i = 0; i < rows.length; i++) {
                var row = rows[i] || {};
                var domIndex = typeof row.__RowIndex === 'number' ? row.__RowIndex : i;
                var baseRow = (G_BuyingCapacityRows && G_BuyingCapacityRows.length > domIndex) ? G_BuyingCapacityRows[domIndex] : {};
                var bfText = '';
                if (baseRow.BuyingFrequency) {
                    bfText = baseRow.BuyingFrequency;
                } else if (baseRow['Buying Frequency']) {
                    bfText = baseRow['Buying Frequency'];
                }

                if (bfText && codeMap[bfText]) {
                    bfText = codeMap[bfText];
                }

                var qty = '';
                if (baseRow.MonthlyRequiredQty !== undefined && baseRow.MonthlyRequiredQty !== null) {
                    qty = baseRow.MonthlyRequiredQty;
                } else if (baseRow['Monthly Required(Qty)'] !== undefined && baseRow['Monthly Required(Qty)'] !== null) {
                    qty = baseRow['Monthly Required(Qty)'];
                }

                var customerRating = '';
                if (baseRow['Customer Rating'] !== undefined && baseRow['Customer Rating'] !== null) {
                    customerRating = baseRow['Customer Rating'];
                } else if (baseRow.CustomerRating !== undefined && baseRow.CustomerRating !== null) {
                    customerRating = baseRow.CustomerRating;
                } else if (baseRow.Ratings !== undefined && baseRow.Ratings !== null) {
                    customerRating = baseRow.Ratings;
                }

                var gpRolling = '';
                if (baseRow.GPRolling !== undefined && baseRow.GPRolling !== null) {
                    gpRolling = baseRow.GPRolling;
                } else if (baseRow['GP Rolling'] !== undefined && baseRow['GP Rolling'] !== null) {
                    gpRolling = baseRow['GP Rolling'];
                }

                var selectId = 'ddlFillBuyingFrequency_' + domIndex;
                var $bfSel = $('#' + selectId);

                try {
                    if (bfText && typeof BizSolHelperFunction !== 'undefined' && BizSolHelperFunction.SelectOptionByText) {
                        BizSolHelperFunction.SelectOptionByText(selectId, bfText);
                    } else if ($bfSel && $bfSel.length) {
                        $bfSel.find('option').filter(function () {
                            return $(this).text() === bfText;
                        }).prop('selected', true);
                        try {
                            if ($bfSel.select2) {
                                $bfSel.trigger('change.select2');
                            } else {
                                $bfSel.trigger('change');
                            }
                        } catch (e2) {
                            $bfSel.trigger('change');
                        }
                    }
                } catch (e1) { }

                var $qtyInp = $('#txtMonthlyRequired_' + domIndex);
                if ($qtyInp && $qtyInp.length) {
                    if (qty !== '' && !isNaN(qty)) {
                        $qtyInp.val(parseFloat(qty).toFixed(3));
                    } else {
                        $qtyInp.val('');
                    }
                }

                var $ratingInp = $('#txtCustomerRating_' + domIndex);
                if ($ratingInp && $ratingInp.length) {
                    $ratingInp.val(customerRating || '');
                }

                try {
                    SelectGPRollingOption('ddlFillGPRolling_' + domIndex, gpRolling);
                } catch (e3) { }
            }
        } catch (error) {
            console.error('Error rebinding buying capacity controls:', error);
        } finally {
            setTimeout(function () { G_SuppressSave = false; }, 0);
            adjustFilterDropdownPosition();
        }
    }).catch(function (error) {
        console.error('Error refreshing buying frequency after filtering:', error);
        G_SuppressSave = false;
        adjustFilterDropdownPosition();
    });
}
function adjustFilterDropdownPosition() {
    // Add CSS to position filter dropdowns for last 5 columns to the left
    const style = document.createElement('style');
    style.id = 'filter-dropdown-position-fix';

    // Remove existing style if present
    const existingStyle = document.getElementById('filter-dropdown-position-fix');
    if (existingStyle) {
        existingStyle.remove();
    }

    style.innerHTML = `
        #table-head th:nth-last-child(-n+5) .filter-dropdown,
        #table-head th:nth-last-child(-n+5) .dropdown-menu,
        #table-head th:nth-last-child(-n+5) [class*="filter"],
        #table-head th:nth-last-child(-n+5) [class*="dropdown"] {
            right: 0 !important;
            left: auto !important;
        }
        
        /* Ensure filter content is visible and not cut off */
        .table-wrapper {
            overflow-x: auto;
            overflow-y: visible;
        }
        
        #BuyingCapacity {
            position: relative;
        }
        
        /* Adjust any filter popups/dropdowns in last 5 columns */
        #table-head th:last-child .filter-popup,
        #table-head th:last-child .filter-container,
        #table-head th:nth-last-child(2) .filter-popup,
        #table-head th:nth-last-child(2) .filter-container,
        #table-head th:nth-last-child(3) .filter-popup,
        #table-head th:nth-last-child(3) .filter-container,
        #table-head th:nth-last-child(4) .filter-popup,
        #table-head th:nth-last-child(4) .filter-container,
        #table-head th:nth-last-child(5) .filter-popup,
        #table-head th:nth-last-child(5) .filter-container {
            right: 0 !important;
            left: auto !important;
            transform: translateX(0) !important;
        }
    `;

    document.head.appendChild(style);

    // Also dynamically adjust filter elements if they exist
    setTimeout(() => {
        const tableHead = document.getElementById('table-head');
        if (tableHead) {
            const headerCells = tableHead.querySelectorAll('th');
            const totalCells = headerCells.length;

            // Apply to last 5 columns
            headerCells.forEach((cell, index) => {
                if (index >= totalCells - 5) {
                    cell.style.position = 'relative';

                    // Find any filter-related elements and adjust their positioning
                    const filterElements = cell.querySelectorAll('[class*="filter"], [class*="dropdown"]');
                    filterElements.forEach(elem => {
                        elem.style.right = '0';
                        elem.style.left = 'auto';
                    });
                }
            });
        }
    }, 100);
}


window.GetBuyingCapacityList = GetBuyingCapacityList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
window.getUrlVars = getUrlVars;
window.FillBuyingFrequency = FillBuyingFrequency;
window.FillBuyingGPRolling = FillBuyingGPRolling;
window.SelectGPRollingOption = SelectGPRollingOption;
window.validateDecimalRateInput = validateDecimalRateInput;
window.SaveBuyingCapacity = SaveBuyingCapacity;
window.ExportExcel = ExportExcel;
