import { BuyingCapacityService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BuyingCapacityService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_BuyingCapacityRows = [];

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

            BindSelectList1($('#ddlMarketingMan')[0], marketingList);
            $('#ddlMarketingMan option[value="0"]').val("ALL");
            if ($('#ddlMarketingMan').select2) {
                $('#ddlMarketingMan').select2({
                    width: '-webkit-fill-available'
                });
            }

            // Set the marketing man input or dropdown value
            var urlParams = getUrlVars();
            var urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
            if (urlMarketingMan == '') {
                if (matchedPersonName) {
                    $('#ddlMarketingMan').val(matchedPersonName);
                } else {
                    $('#ddlMarketingMan').val("ALL");
                }
            } else {
                $('#ddlMarketingMan').val(urlMarketingMan);
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
            const StringFilterColumn = ["Party Name", "Marketing Person","Country", "City", "State","PinCode","Customer Rating"];
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

                return {
                    ...item,
                    'Buying Frequency': BuyingFrequencyInputHTML,
                    'Monthly Required(Qty)': MonthlyRequiredQtyInputHTML,
                    'Customer Rating': CustomerRatingInputHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BuyingCapacity", "table-body-BuyingCapacity", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);

            // Ensure dropdown options are populated first
            await FillBuyingFrequency();

            // Bind initial values from response to each row controls
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
                }
            } catch(e) { }
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
            CustomerRating: customerRating === '' ? '' : customerRating
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

    FillBuyingFrequency().then(function () {
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
            }
        } catch (error) {
            console.error('Error rebinding buying capacity controls:', error);
        } finally {
            adjustFilterDropdownPosition();
        }
    }).catch(function (error) {
        console.error('Error refreshing buying frequency after filtering:', error);
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
window.validateDecimalRateInput = validateDecimalRateInput;
window.SaveBuyingCapacity = SaveBuyingCapacity;
