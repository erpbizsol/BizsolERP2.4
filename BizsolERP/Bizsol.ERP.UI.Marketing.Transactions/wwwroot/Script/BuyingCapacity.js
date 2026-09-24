import { BuyingCapacityService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BuyingCapacityService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_BuyingCapacityRows = [];
// When true, programmatic value binding is in progress and onchange-triggered saves are ignored
let G_SuppressSave = false;
let G_SalesPersonBound = false;
let G_SalesPersonLoadPromise = null;

const BC_SALES_PERSON_MAX_RETRIES = 4;
const BC_SALES_PERSON_RETRY_DELAY_MS = 350;

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function normalizeApiList(response) {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && Array.isArray(response.Data)) {
        return response.Data;
    }
    if (response && Array.isArray(response.data)) {
        return response.data;
    }
    return [];
}

function escapeHtmlAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function waitForElement(selector, maxAttempts, intervalMs) {
    maxAttempts = maxAttempts || 80;
    intervalMs = intervalMs || 50;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
        var $el = $(selector);
        if ($el.length) {
            return $el;
        }
        await delay(intervalMs);
    }
    return null;
}

function initSalesPersonSelect2($ddl) {
    if (!$ddl || !$ddl.length) {
        return;
    }
    try {
        if ($ddl.hasClass('select2-hidden-accessible')) {
            $ddl.select2('destroy');
        }
    } catch (e) { }
    if (typeof $ddl.select2 === 'function') {
        $ddl.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }
}

async function waitForAuthKey(maxAttempts, intervalMs) {
    maxAttempts = maxAttempts || 50;
    intervalMs = intervalMs || 100;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            var authRaw = sessionStorage.getItem('authKey');
            if (authRaw) {
                var authKey = JSON.parse(authRaw);
                if (authKey && authKey.UserMaster_Code !== undefined && authKey.UserMaster_Code !== null && authKey.UserMaster_Code !== '') {
                    return authKey;
                }
            }
        } catch (e) { }
        await delay(intervalMs);
    }
    return null;
}

function resetBuyingCapacityTableScroll() {
    var wrap = document.querySelector('#BuyingCapacityPage .table-wrapper');
    if (wrap) {
        wrap.scrollLeft = 0;
    }
}

function pickField(item, keys, fallback) {
    if (!item || !keys) {
        return fallback !== undefined ? fallback : '';
    }
    for (var i = 0; i < keys.length; i++) {
        var val = item[keys[i]];
        if (val !== undefined && val !== null && val !== '') {
            return val;
        }
    }
    return fallback !== undefined ? fallback : '';
}

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    $("#btnShow").click(function () {
        if (!G_SalesPersonBound) {
            toastr.error('Please wait, sales person list is loading');
            return false;
        }
        var MarketingMan_Name = $("#ddlMarketingMan").val();

        if (MarketingMan_Name == undefined || MarketingMan_Name == '') {
            toastr.error('Please select Sales Person');
            return false;
        }
        GetBuyingCapacityList();
    });

    try {
        await initBuyingCapacityPage();
    } catch (err) {
        console.error('Buying Capacity page init failed:', err);
    }
});

async function initBuyingCapacityPage() {
    var bound = await GetNestedMarketingManList();
    if (bound) {
        await GetBuyingCapacityList();
    }
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
function applySalesPersonDropdownBinding(response) {
    var rows = normalizeApiList(response);
    if (!rows.length) {
        return false;
    }

    var matchedPersonName = null;
    var marketingList = [];
    var personNames = [];
    var userMaster_Code = null;

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

    for (var i = 0; i < rows.length; i++) {
        var person = rows[i];
        if (person && person.PersonName) {
            var personName = String(person.PersonName).trim();
            if (!personName) {
                continue;
            }
            var userCode = person.Usermaster_Code != null ? person.Usermaster_Code : person.UserMaster_Code;
            if (userMaster_Code != null && userCode == userMaster_Code) {
                matchedPersonName = personName;
            }
            personNames.push(personName);
            marketingList.push({
                Code: personName,
                Desp: personName
            });
        }
    }

    if (marketingList.length === 0) {
        return false;
    }

    var $ddl = $('#ddlMarketingMan');
    if (!$ddl.length) {
        return false;
    }

    BindSelectList1($ddl[0], marketingList);

    var urlParams = getUrlVars();
    var urlMarketingMan = decodeURIComponent((urlParams['MarketingMan_Name'] || '').replace(/\+/g, ' ')).trim();
    var targetValue;
    if (urlMarketingMan === '') {
        targetValue = matchedPersonName ? matchedPersonName : 'ALL';
    } else {
        targetValue = urlMarketingMan;
    }

    if (personNames.indexOf(targetValue) < 0 && targetValue !== 'ALL') {
        targetValue = matchedPersonName ? matchedPersonName : 'ALL';
    }

    initSalesPersonSelect2($ddl);
    $ddl.val(targetValue);
    if (!$ddl.val()) {
        $ddl.val('ALL');
    }
    try {
        $ddl.trigger('change.select2');
    } catch (e) {
        $ddl.trigger('change');
    }

    G_SalesPersonBound = true;
    $ddl.prop('disabled', false);
    $('#btnShow, #btnExportExcel').prop('disabled', false);
    return true;
}

async function GetNestedMarketingManList() {
    if (G_SalesPersonLoadPromise) {
        return G_SalesPersonLoadPromise;
    }

    G_SalesPersonLoadPromise = (async function () {
        G_SalesPersonBound = false;
        var $ddl = await waitForElement('#ddlMarketingMan');
        if (!$ddl || !$ddl.length) {
            toastr.error('Page not ready. Please refresh the page.');
            return false;
        }

        $ddl.prop('disabled', true).empty();
        $('#btnShow, #btnExportExcel').prop('disabled', true);
        if (typeof Showloader === 'function') {
            Showloader();
        }

        try {
            var authKey = await waitForAuthKey(80, 100);
            if (!authKey) {
                toastr.error('Session not ready. Please refresh the page.');
                return false;
            }

            var lastError = null;
            for (var attempt = 0; attempt < BC_SALES_PERSON_MAX_RETRIES; attempt++) {
                try {
                    var response = await BuyingCapacityService.GetNestedMarketingManList();
                    lastError = null;
                    if (applySalesPersonDropdownBinding(response)) {
                        return true;
                    }
                } catch (err) {
                    lastError = err;
                }

                if (attempt < BC_SALES_PERSON_MAX_RETRIES - 1) {
                    await delay(BC_SALES_PERSON_RETRY_DELAY_MS);
                    await waitForAuthKey(10, 100);
                }
            }

            if (lastError) {
                throw lastError;
            }

            toastr.error('No Data Found');
            $ddl.prop('disabled', false);
            return false;
        } catch (error) {
            console.error('Error loading marketing person list:', error);
            toastr.error('Error loading sales person list');
            $('#ddlMarketingMan').prop('disabled', false);
            return false;
        } finally {
            if (typeof HideLoader === 'function') {
                HideLoader();
            }
        }
    })();

    try {
        return await G_SalesPersonLoadPromise;
    } finally {
        G_SalesPersonLoadPromise = null;
    }
}
async function GetBuyingCapacityList() {
    if (!G_SalesPersonBound) {
        toastr.error('Please wait, sales person list is loading');
        return;
    }
    var MarketingPersonName = $("#ddlMarketingMan").val();
    // Procedure expects 'All' (not 'ALL') when showing all marketing persons
    if (MarketingPersonName === 'ALL' || MarketingPersonName === '0') {
        MarketingPersonName = 'All';
    }

    try {
        Showloader();
        const response = await BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName);
        $('#BuyingCapacity').show();
        if (response && response.length > 0) {
            G_BuyingCapacityRows = response.map(function(item, index) {
                return {
                    ...item,
                    __RowIndex: index
                };
            });
            const StringFilterColumn = ["Party Name", "Mkt Person", "Country", "City", "State", "PinCode"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "__RowIndex"];
            const ColumnAlignment = {
                "S.No.": "right",
                "PinCode": "right",
                "Monthly Req(Qty)": "right"
            };
            const updatedResponse = G_BuyingCapacityRows.map((item) => {
                const rowIndex = item.__RowIndex;
                let BuyingFrequencyInputHTML = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillBuyingFrequency_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${item.Code}')"></select>`;
                let MonthlyRequiredQtyInputHTML = `<input type="text" class="form-control form-control-sm box_border text-end" id="txtMonthlyRequired_${rowIndex}" oninput="validateDecimalRateInput(this)" onblur="SaveBuyingCapacity(${rowIndex},'${item.Code}')" autocomplete="off"/>`;
                let CustomerRatingInputHTML = `<input type="text" class="form-control form-control-sm box_border" id="txtCustomerRating_${rowIndex}" maxlength="100" onblur="SaveBuyingCapacity(${rowIndex},'${item.Code}')" placeholder="Customer Rating" autocomplete="off"/>`;
                let GPRollingInputHTML = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillGPRolling_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${item.Code}')"></select>`;

                return {
                    'S.No.': pickField(item, ['S.No.', 'S.No', 'SNo', 'SrNo', 'Sr No'], rowIndex + 1),
                    'Party Name': pickField(item, ['Party Name', 'PartyName']),
                    'Mkt Person': pickField(item, ['Marketing Person', 'Mkt Person', 'PersonName']),
                    'Country': pickField(item, ['Country']),
                    'State': pickField(item, ['State']),
                    'City': pickField(item, ['City']),
                    'PinCode': pickField(item, ['PinCode']),
                    'Buying Frequency': BuyingFrequencyInputHTML,
                    'Monthly Req(Qty)': MonthlyRequiredQtyInputHTML,
                    'Customer Rating': CustomerRatingInputHTML,
                    'GP Rolling': GPRollingInputHTML,
                    Code: item.Code,
                    __RowIndex: rowIndex
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
                    var qty = pickField(baseRow, ['MonthlyRequiredQty', 'Monthly Req(Qty)', 'Monthly Required(Qty)']);
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
                setTimeout(function () { G_SuppressSave = false; }, 0);
            }
        }
        else {
            $('#BuyingCapacity').hide();
            toastr.error('No Data Found');
        }
    } catch (error) {
        $('#BuyingCapacity').hide();
        toastr.error('Error loading buying capacity data');
    } finally {
        resetBuyingCapacityTableScroll();
        HideLoader();
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

function readSelectDisplay(id, fallback) {
    var el = document.getElementById(id);
    if (!el) {
        return fallback;
    }
    if (el.selectedIndex >= 0 && el.options[el.selectedIndex]) {
        var text = String(el.options[el.selectedIndex].text || '').trim();
        if (text && text.toLowerCase() !== 'select' && text !== '0') {
            return text;
        }
    }
    return el.value || fallback;
}

function mapBuyingCapacityExportRow(item, index) {
    var rowIndex = typeof item.__RowIndex === 'number' ? item.__RowIndex : index;
    var qtyEl = document.getElementById('txtMonthlyRequired_' + rowIndex);
    var ratingEl = document.getElementById('txtCustomerRating_' + rowIndex);
    return {
        'S.No.': pickField(item, ['S.No.', 'S.No', 'SNo', 'SrNo', 'Sr No'], rowIndex + 1),
        'Party Name': pickField(item, ['Party Name', 'PartyName']),
        'Mkt Person': pickField(item, ['Marketing Person', 'Mkt Person', 'PersonName']),
        'Country': pickField(item, ['Country']),
        'State': pickField(item, ['State']),
        'City': pickField(item, ['City']),
        'PinCode': pickField(item, ['PinCode']),
        'Buying Frequency': readSelectDisplay('ddlFillBuyingFrequency_' + rowIndex, pickField(item, ['Buying Frequency', 'BuyingFrequency'])),
        'Monthly Req(Qty)': (qtyEl && qtyEl.value !== '') ? qtyEl.value : pickField(item, ['MonthlyRequiredQty', 'Monthly Req(Qty)', 'Monthly Required(Qty)']),
        'Customer Rating': (ratingEl && ratingEl.value !== '') ? ratingEl.value : pickField(item, ['Customer Rating', 'CustomerRating', 'Ratings']),
        'GP Rolling': readSelectDisplay('ddlFillGPRolling_' + rowIndex, pickField(item, ['GP Rolling', 'GPRolling']))
    };
}

function ExportExcel() {
    if (!G_SalesPersonBound) {
        toastr.error('Please wait, sales person list is loading');
        return;
    }
    var MarketingPersonName = $("#ddlMarketingMan").val();
    if (MarketingPersonName == undefined || MarketingPersonName === '') {
        toastr.error('Please select Sales Person');
        return;
    }
    var hiddenFields = ["Code", "__RowIndex", "Marketing Person", "PersonName", "MonthlyRequiredQty", "Monthly Required(Qty)"];

    // Use already-loaded grid data so iOS still has the user tap for Share.
    if (G_BuyingCapacityRows && G_BuyingCapacityRows.length > 0) {
        var exportRows = G_BuyingCapacityRows.map(mapBuyingCapacityExportRow);
        var result = ExportToExcelControl.ExportToExcel(exportRows, hiddenFields, "BuyingCapacity");
        if (result === true) {
            toastr.success('Export completed successfully.');
        }
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
            G_BuyingCapacityRows = response.map(function (item, index) {
                return Object.assign({}, item, { __RowIndex: index });
            });
            var fetchedRows = G_BuyingCapacityRows.map(mapBuyingCapacityExportRow);
            var fetchedResult = ExportToExcelControl.ExportToExcel(fetchedRows, hiddenFields, "BuyingCapacity");
            if (fetchedResult === true) {
                toastr.success('Export completed successfully.');
            }
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
                        $select.select2({ width: '132px', dropdownParent: $(document.body) });
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
                        $select.select2({ width: '132px', dropdownParent: $(document.body) });
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
    let option = '<option value="ALL">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + escapeHtmlAttr(val.Code) + '">' + escapeHtmlAttr(val.Desp) + '</option>';
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

                var qty = pickField(baseRow, ['MonthlyRequiredQty', 'Monthly Req(Qty)', 'Monthly Required(Qty)']);

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
            setTimeout(function () {
                G_SuppressSave = false;
                resetBuyingCapacityTableScroll();
                adjustFilterDropdownPosition();
            }, 0);
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
        @media (min-width: 1200px) {
            #BuyingCapacityPage .table-wrapper {
                overflow-x: hidden;
                overflow-y: auto;
            }
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
