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
            $('#ddlSalesPersonList').empty();

            let options = '<option value="ALL" selected>ALL</option>';
            let matchedPersonName = null;

            for (let i = 0; i < response.length; i++) {
                const person = response[i];
                let userMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
                // Check if UserMaster_Code matches
                if (person.Usermaster_Code == userMaster_Code) {
                    matchedPersonName = person.PersonName;
                }

                options += `<option value="${person.PersonName}">${person.PersonName}</option>`;
            }

            $('#ddlSalesPersonList').html(options);

            // Set the marketing man input or dropdown value
            var urlParams = getUrlVars();
            if (decodeURIComponent(urlParams['MarketingMan_Name'] || "") == '') {
                if (matchedPersonName) {
                    $('#ddlMarketingMan').val(matchedPersonName);
                } else {
                    $('#ddlMarketingMan').val("ALL");
                }
            }

        } else {
            toastr.error('No Data Found');
        }
    });
}
async function GetBuyingCapacityList() {
    var MarketingPersonName = $("#ddlMarketingMan").val();

    try {
        const response = await BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName);
        $('#BuyingCapacity').show();
        if (response && response.length > 0) {
            G_BuyingCapacityRows = response;
            const StringFilterColumn = ["Person Name"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};
            const updatedResponse = response.map((item, index) => {
                let BuyingFrequencyInputHTML = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillBuyingFrequency_${index}" onchange="SaveBuyingCapacity(${index},'${item.Code}')"></select>`;
                let MonthlyRequiredQtyInputHTML = `<input type="text" class="form-control form-control-sm box_border text-end" id="txtMonthlyRequired_${index}" oninput="validateDecimalRateInput(this)" onblur="SaveBuyingCapacity(${index},'${item.Code}')" style="width:120px"/>`;

                return {
                    ...item,
                    'Buying Frequency': BuyingFrequencyInputHTML,
                    'Monthly Required(Qty)': MonthlyRequiredQtyInputHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BuyingCapacity", "table-body-BuyingCapacity", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);

            // Ensure dropdown options are populated first
            await FillBuyingFrequency();

            // Bind initial values from response to each row controls
            try {
                for (var i = 0; i < response.length; i++) {
                    var row = response[i] || {};
                    // Prefer the display text present in the response
                    var bfText = row['Buying Frequency'] || row.BuyingFrequency || '';
                    // Map code to display text if needed
                    try {
                        var codeMap = { 'M': 'Monthly', 'O': 'Occasionally', 'W': 'Weekly' };
                        if (bfText && codeMap[bfText]) { bfText = codeMap[bfText]; }
                    } catch(eMap) { }
                    var qty = row.MonthlyRequiredQty != null ? row.MonthlyRequiredQty : (row['Monthly Required(Qty)'] != null ? row['Monthly Required(Qty)'] : '');

                    // Bind Buying Frequency by text using helper (matches option display text)
                    try {
                        if (bfText && typeof BizSolHelperFunction !== 'undefined' && BizSolHelperFunction.SelectOptionByText) {
                            BizSolHelperFunction.SelectOptionByText(`ddlFillBuyingFrequency_${i}`, bfText);
                        } else {
                            var $bfSel = $(`#ddlFillBuyingFrequency_${i}`);
                            if ($bfSel && $bfSel.length) {
                                $bfSel.find('option').filter(function(){ return $(this).text() === bfText; }).prop('selected', true);
                                try { if ($bfSel.select2) { $bfSel.trigger('change.select2'); } else { $bfSel.trigger('change'); } } catch(e2) { $bfSel.trigger('change'); }
                            }
                        }
                    } catch(e1) { }

                    // Bind Monthly Required Qty
                    var $qtyInp = $(`#txtMonthlyRequired_${i}`);
                    if ($qtyInp && $qtyInp.length) {
                        if (qty !== '' && !isNaN(qty)) { $qtyInp.val(parseFloat(qty).toFixed(3)); } else { $qtyInp.val(''); }
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
        var monthlyQtyStr = $('#txtMonthlyRequired_' + index).val();
        var monthlyQty = monthlyQtyStr !== undefined && monthlyQtyStr !== '' ? parseFloat(monthlyQtyStr) : 0;

        if (!buyingFrequency || buyingFrequency === '0') {
            return;
        }
        if (isNaN(monthlyQty) || monthlyQty < 0) {
            toastr.error('Enter a valid Monthly Required Qty');
            return;
        }

        var payload = {
            ...baseItem,
            AccountMaster_Code:Code,
            BuyingFrequency: buyingFrequency,
            MonthlyRequiredQty: monthlyQty
        };

        Showloader();
        BuyingCapacityService.SaveBuyingCapacity(JSON.stringify(payload)).then(function (response) {
            HideLoader();
            if (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Message || 'Saved successfully');
                } else if (response.Status === 'U' || (response.Message && response.Message.toLowerCase().indexOf('update') >= 0)) {
                    toastr.info(response.Message || 'Updated successfully');
                } else {
                    toastr.error(response.Message || 'Save failed');
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
function BindSelectList2(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.GetBuyingCapacityList = GetBuyingCapacityList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
window.getUrlVars = getUrlVars;
window.FillBuyingFrequency = FillBuyingFrequency;
window.validateDecimalRateInput = validateDecimalRateInput;
window.SaveBuyingCapacity = SaveBuyingCapacity;
