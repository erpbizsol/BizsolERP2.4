import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BankMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankMasterService.js';
import { CityMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CityMasterService.js';
import { CountryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CountryMasterService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';

(function enableBankPageScroll() {
    if (document.getElementById('bank-page-scroll-style')) {
        return;
    }
    var style = document.createElement('style');
    style.id = 'bank-page-scroll-style';
    style.textContent = '#BankMasterPage{height:auto!important;min-height:0!important;overflow:visible!important;}#bankListPanel{height:calc(100vh - 174px);overflow:hidden;}#bankDetailPanel{flex:none!important;overflow:visible!important;height:auto!important;padding-bottom:16px;}';
    document.head.appendChild(style);
})();

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_BANK_SourceRows = [];
var G_BANK_DetailMode = 'list';
var G_BANK_ListCountry = 'India';
var G_BANK_CityRows = [];
var G_BANK_StateRows = [];
var G_BANK_NationRows = [];
var G_BANK_CurrencyRows = [];
var G_BANK_ECMSRows = [];
var G_BANK_AccountRows = [];
var G_BANK_SavedDatabaseLocationCode = 0;
/** When true, skip auto-fill of State / Nation / Pin from City (e.g. edit load). */
var G_BANK_SuppressCityAddressFill = false;

var G_BANK_ModuleName = 'Bank';
/** Y from api/Bank/GetFixedParameterFinance → AskProjectOpenningInBankMaster */
var G_BANK_AskProjectOpening = false;
var G_BANK_OpeningRows = [];
var G_BANK_ProjectRows = [];
var G_BANK_SubProjectRows = [];
var G_BANK_OpeningMastersLoaded = false;
var G_BANK_OpeningBinding = false;

/** tblBankMaster column lengths (varchar char max / int bounds). */
var BANK_FIELD_MAX = {
    BankName: 50,
    AliasName: 250,
    Address: 80,
    City: 30,
    PinCode: 6,
    State: 20,
    Nation: 20,
    EMail: 40,
    PhoneNo: 15,
    FaxNo: 15,
    ServiceTaxNo: 50,
    PANNo: 50,
    AccountNo: 25,
    IFSC_Code: 25,
    SwiftCode: 15,
    MICRCode: 50,
    VartualAccountPrefix: 10,
    VartualAccountLengthMax: 2147483647,
};

function bankTrimField(val, maxLen) {
    if (val == null || maxLen == null) return '';
    return String(val).trim().slice(0, maxLen);
}
function bankClampInt(val, min, max) {
    var n = parseInt(String(val).replace(/\D/g, ''), 10);
    if (isNaN(n)) return min;
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}
function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.Data && Array.isArray(payload.Data)) return payload.Data;
    if (payload.value && Array.isArray(payload.value)) return payload.value;
    if (payload.Value && Array.isArray(payload.Value)) return payload.Value;
    return [];
}
function firstRecord(payload) {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload.length ? payload[0] : null;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values.length ? payload.$values[0] : null;
    if (payload.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
    if (payload.Data != null && typeof payload.Data === 'object' && !Array.isArray(payload.Data)) return payload.Data;
    if (typeof payload === 'object') return payload;
    return null;
}
function dropdownText(item, fieldName) {
    if (!item || typeof item !== 'object') return '';
    if (item[fieldName] != null) return String(item[fieldName]).trim();
    var lower = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    if (item[lower] != null) return String(item[lower]).trim();
    if (item.Value != null) return String(item.Value).trim();
    if (item.value != null) return String(item.value).trim();
    if (item.Text != null) return String(item.Text).trim();
    if (item.text != null) return String(item.text).trim();
    return '';
}
function bankPickFirst(obj, keys) {
    if (!obj) return undefined;
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
    }
    return undefined;
}
function bankNormalizeCityApiResponse(res) {
    if (!res) return null;
    if (Array.isArray(res)) return res.length ? res[0] : null;
    return firstRecord(res);
}
function bankFindCityRowByName(cityName) {
    var name = (cityName || '').toString().trim().toLowerCase();
    if (!name) return null;
    for (var i = 0; i < G_BANK_CityRows.length; i++) {
        var r = G_BANK_CityRows[i];
        if (dropdownText(r, 'CityName').toLowerCase() === name) return r;
    }
    return null;
}
function bankEnsureSelectOption($sel, text) {
    if (!$sel.length || text == null) return;
    var t = String(text).trim();
    if (!t) return;
    if ($sel.find('option').filter(function () { return $(this).val() === t; }).length) return;
    $sel.append(new Option(t, t));
}
/** City response: no pin / empty / 0 → "0"; otherwise digits from API (max 6). */
function bankNormalizePinFromCity(pin) {
    if (pin === undefined || pin === null) return '0';
    var raw = String(pin).trim();
    if (raw === '' || raw === '0') return '0';
    var digits = raw.replace(/\D/g, '').slice(0, 6);
    if (!digits || /^0+$/.test(digits)) return '0';
    return digits;
}
function bankSetStateNationPin(stateName, nationName, pin) {
    if (stateName) {
        var st = String(stateName).trim();
        bankEnsureSelectOption($('#ddlState'), st);
        $('#ddlState').val(st).trigger('change');
    }
    if (nationName) {
        var nat = String(nationName).trim();
        bankEnsureSelectOption($('#ddlNation'), nat);
        $('#ddlNation').val(nat).trigger('change');
    }
    $('#txtPin').val(bankNormalizePinFromCity(pin));
    try {
        $('#ddlState, #ddlNation').each(function () {
            if ($(this).data('select2')) $(this).trigger('change.select2');
        });
    } catch (e) {}
}
function bankApplyAddressFromCity(cityName) {
    if (G_BANK_SuppressCityAddressFill) return;
    var name = (cityName || '').toString().trim();
    if (!name) return;

    var row = bankFindCityRowByName(name);
    var stateName = row ? bankPickFirst(row, ['StateName', 'stateName']) : undefined;
    var nationName = row ? bankPickFirst(row, ['CountryName', 'countryName', 'NationName', 'Nation']) : undefined;
    var pin = row ? bankPickFirst(row, ['Pin', 'pin', 'PinCode', 'Pincode']) : undefined;

    function applyAll() {
        bankSetStateNationPin(stateName, nationName, pin);
    }

    if (row && stateName && nationName) {
        applyAll();
        return;
    }

    CityMasterService.GetCityMasterByName(name, 'CityMasterByName')
        .then(function (res) {
            if (G_BANK_SuppressCityAddressFill) return;
            var apiRow = bankNormalizeCityApiResponse(res);
            if (apiRow) {
                if (!stateName) stateName = bankPickFirst(apiRow, ['StateName', 'stateName']);
                if (!nationName) nationName = bankPickFirst(apiRow, ['CountryName', 'countryName', 'NationName', 'Nation']);
                if (pin === undefined || pin === null) {
                    pin = bankPickFirst(apiRow, ['Pin', 'pin', 'PinCode', 'Pincode']);
                }
            }
            applyAll();
        })
        .catch(function () {
            applyAll();
        });
}
function showModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $('#' + id).modal('show');
        }
    } catch (e) {
        $('#' + id).modal('show');
    }
}
function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            const m = window.bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) {
        $('#' + id).modal('hide');
    }
}
function bindSelect2($sel, placeholder) {
    if (!$sel.length) return;
    if ($sel.data('select2')) $sel.select2('destroy');
    $sel.select2({
        width: '100%',
        placeholder: placeholder || 'Search…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
}
function bindSimpleDropdown($sel, rows, valueField, textField, placeholder) {
    if (!$sel.length) return;
    var selected = ($sel.val() || '').toString();
    $sel.empty();
    $sel.append(new Option(placeholder || '-- Select --', ''));
    var seen = {};
    $.each(rows || [], function (_, item) {
        var text = dropdownText(item, textField);
        if (!text || seen[text]) return;
        seen[text] = true;
        $sel.append(new Option(text, text));
    });
    if (selected) $sel.val(selected);
    bindSelect2($sel, placeholder);
    if (selected) {
        $sel.val(selected);
        if ($sel.data('select2')) $sel.trigger('change.select2');
    }
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('bank-input-error');
    var $wrap = $field.closest('.bank-fg');
    $wrap.find('.bank-field-error').remove();
    $wrap.append(
        '<div class="bank-field-error"><i class="fas fa-circle-exclamation"></i> <span>' + message + '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('bank-input-error');
    $('#' + fieldId).closest('.bank-fg').find('.bank-field-error').remove();
}
function clearAllFieldErrors() {
    $('#bankDetailPanel .bank-input-error').removeClass('bank-input-error');
    $('#bankDetailPanel .bank-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    G_BANK_SavedDatabaseLocationCode = 0;
    G_BANK_OpeningRows = [];
    $('#hfBankMaster_Code').val('0');
    $('#txtBankName, #txtAliasName, #txtAccountNo, #txtIFSCCode, #txtSwiftCode, #txtAddress').val('');
    $('#txtPin, #txtPhoneNo, #txtFaxNo, #txtServiceTaxNo, #txtPANNo, #txtEMail').val('');
    $('#txtMICRCode, #txtVartualAccountPrefix, #txtVartualAccountLength').val('');
    $('#chkIsDefault, #chkECMSApplicable, #chkVartualAccountAutoGenerate').prop('checked', false);
    $('#ddlCurrency, #ddlCity, #ddlState, #ddlNation, #ddlECMSBank, #ddlECMSDebitAccount').val('').trigger('change');
    toggleECMSPanel(false);
    applyBankOpeningUi();
}
function toggleECMSPanel(show) {
    if (show) {
        $('#bankECMSPanel').slideDown(180);
    } else {
        $('#bankECMSPanel').hide();
    }
}
function setDetailFormMode(mode) {
    G_BANK_DetailMode = mode;
    var ro = mode === 'view';
    $('#bankDetailPanel').toggleClass('bank-readonly', ro);
    $('#bankDetailPanel input[type="text"], #bankDetailPanel input[type="email"], #bankDetailPanel select').prop('disabled', ro);
    $('#chkIsDefault, #chkECMSApplicable, #chkVartualAccountAutoGenerate').prop('disabled', ro);
    try {
        $('#bankDetailPanel select').each(function () {
            if ($(this).data('select2')) $(this).prop('disabled', ro);
        });
    } catch (e) {}
    if (!ro) {
        $('#btnSaveBank, #btnClearBank').show();
    } else {
        $('#btnSaveBank, #btnClearBank').hide();
    }
    applyBankOpeningUi();
}
function showListPanel() {
    $('#bankListPanel').show();
    $('#bankDetailPanel').hide();
    G_BANK_DetailMode = 'list';
    refreshBankGrid();
}
function showDetailPanel(mode) {
    $('#bankListPanel').hide();
    $('#bankDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="Bank_OpenView(' + code + ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="Bank_OpenEdit(' + code + ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="Bank_OpenDelete(' + code + ')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>'
    );
}
function formatDate(val) {
    if (val == null || val === '') return '';
    try {
        var d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN');
    } catch (e) {
        return String(val);
    }
}
function ynDisplay(val) {
    if (val === true || val === 1 || val === '1') return 'Yes';
    var s = val != null ? String(val).trim().toUpperCase() : '';
    return s === 'Y' || s === 'T' ? 'Yes' : 'No';
}
function mapRowForGrid(item, idx) {
    var code = item.Code != null ? Number(item.Code) : 0;
    return {
        Code: code,
        'S.No.': idx + 1,
        'Bank Name': item.BankName != null ? String(item.BankName).trim() : '',
        'Alias Name': item.AliasName != null ? String(item.AliasName).trim() : '',
        'Account No': item.AccountNo != null ? String(item.AccountNo).trim() : '',
        'IFSC Code': item.IFSC_Code != null ? String(item.IFSC_Code).trim() : '',
        City: item.City != null ? String(item.City).trim() : '',
        State: item.State != null ? String(item.State).trim() : '',
        Default: ynDisplay(item.IsDefault),
        Action: buildActionHtml(code),
    };
}
function applyBankSearch(rows) {
    var q = ($('#bankSearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        return (
            String(r.BankName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.AliasName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.AccountNo || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.IFSC_Code || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.City || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.State || '').toLowerCase().indexOf(q) >= 0
        );
    });
}
function bindBankGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-BankMaster').empty();
        $('#table-body-BankMaster').html(
            '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-BankMaster').empty();
        return;
    }
    var mapped = rows.map(function (item, idx) {
        return mapRowForGrid(item, idx);
    });
    var StringFilterColumn = ['Bank Name', 'Alias Name', 'Account No', 'IFSC Code', 'City', 'State', 'Default'];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code'];
    var ColumnAlignment = {
        'S.No.': 'center;min-width:52px;white-space:nowrap;',
        Default: 'center;min-width:72px;',
        Action: 'center;min-width:128px;white-space:nowrap;',
    };
    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-BankMaster',
        'table-body-BankMaster',
        mapped,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        true,
        null,
        null
    );
}
function refreshBankGrid() {
    BankMasterService.GetBankMasterList()
        .then(function (res) {
            G_BANK_SourceRows = firstArray(res);
            bindBankGridData(applyBankSearch(G_BANK_SourceRows));
        })
        .catch(function () {
            G_BANK_SourceRows = [];
            bindBankGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load bank list.');
        });
}
function loadMasterDropdowns() {
    return Promise.all([
        CountryMasterService.GetCountryMasterList()
            .then(function (res) {
                G_BANK_NationRows = firstArray(res);
                return G_BANK_NationRows;
            })
            .catch(function () {
                G_BANK_NationRows = [];
                return [];
            }),
        CityMasterService.GetStateList('ALL')
            .then(function (res) {
                G_BANK_StateRows = firstArray(res);
                return G_BANK_StateRows;
            })
            .catch(function () {
                G_BANK_StateRows = [];
                return [];
            }),
        CityMasterService.GetCityList(G_BANK_ListCountry, 'ALL')
            .then(function (res) {
                G_BANK_CityRows = firstArray(res);
                return G_BANK_CityRows;
            })
            .catch(function () {
                G_BANK_CityRows = [];
                return [];
            }),
        BankMasterService.GetCurrencyList()
            .then(function (res) {
                G_BANK_CurrencyRows = firstArray(res);
                return G_BANK_CurrencyRows;
            })
            .catch(function () {
                G_BANK_CurrencyRows = [];
                return [];
            }),
        BankMasterService.GetECMSBankList()
            .then(function (res) {
                G_BANK_ECMSRows = firstArray(res);
                return G_BANK_ECMSRows;
            })
            .catch(function () {
                G_BANK_ECMSRows = [];
                return [];
            }),
        BankMasterService.GetAccountList()
            .then(function (res) {
                G_BANK_AccountRows = firstArray(res);
                return G_BANK_AccountRows;
            })
            .catch(function () {
                G_BANK_AccountRows = [];
                return [];
            }),
    ]).then(function () {
        bindSimpleDropdown($('#ddlNation'), G_BANK_NationRows, 'CountryName', 'CountryName', '-- Select Nation --');
        bindSimpleDropdown($('#ddlState'), G_BANK_StateRows, 'StateName', 'StateName', '-- Select State --');
        bindSimpleDropdown(
            $('#ddlCity'),
            G_BANK_CityRows,
            'CityName',
            'CityName',
            '-- Select City --'
        );
        bindSimpleDropdown($('#ddlCurrency'), G_BANK_CurrencyRows, 'Description', 'Description', '-- Select Currency --');
        bindSimpleDropdown($('#ddlECMSBank'), G_BANK_ECMSRows, 'eCMSBANK', 'eCMSBANK', '-- Select e-CMS Bank --');
        bindSimpleDropdown(
            $('#ddlECMSDebitAccount'),
            G_BANK_AccountRows,
            'AccountDesp',
            'AccountDesp',
            '-- Select Debit Account --'
        );
    });
}
function setCheckboxFromBit($el, val) {
    $el.prop('checked', val === true || val === 1 || val === '1' || String(val).toUpperCase() === 'Y');
}
function populateForm(rec) {
    G_BANK_SavedDatabaseLocationCode =
        rec.DatabaseLocation_Code != null ? parseInt(String(rec.DatabaseLocation_Code), 10) || 0 : 0;
    $('#hfBankMaster_Code').val(rec.Code != null ? rec.Code : 0);
    $('#txtBankName').val(bankTrimField(rec.BankName, BANK_FIELD_MAX.BankName));
    $('#txtAliasName').val(bankTrimField(rec.AliasName, BANK_FIELD_MAX.AliasName));
    $('#txtAccountNo').val(bankTrimField(rec.AccountNo, BANK_FIELD_MAX.AccountNo));
    $('#txtIFSCCode').val(bankTrimField(rec.IFSC_Code, BANK_FIELD_MAX.IFSC_Code));
    $('#txtSwiftCode').val(bankTrimField(rec.SwiftCode, BANK_FIELD_MAX.SwiftCode));
    $('#txtAddress').val(bankTrimField(rec.Address, BANK_FIELD_MAX.Address));
    $('#txtPin').val(
        rec.PinCode != null && String(rec.PinCode).trim() !== ''
            ? bankTrimField(String(rec.PinCode).trim(), BANK_FIELD_MAX.PinCode)
            : ''
    );
    $('#txtPhoneNo').val(bankTrimField(rec.PhoneNo, BANK_FIELD_MAX.PhoneNo));
    $('#txtFaxNo').val(bankTrimField(rec.FaxNo, BANK_FIELD_MAX.FaxNo));
    $('#txtServiceTaxNo').val(bankTrimField(rec.ServiceTaxNo, BANK_FIELD_MAX.ServiceTaxNo));
    $('#txtPANNo').val(bankTrimField(rec.PANNo, BANK_FIELD_MAX.PANNo));
    $('#txtEMail').val(bankTrimField(rec.EMail, BANK_FIELD_MAX.EMail));
    $('#txtMICRCode').val(bankTrimField(rec.MICRCode, BANK_FIELD_MAX.MICRCode));
    $('#txtVartualAccountPrefix').val(bankTrimField(rec.VartualAccountPrefix, BANK_FIELD_MAX.VartualAccountPrefix));
    $('#txtVartualAccountLength').val(
        rec.VartualAccountLength != null && rec.VartualAccountLength !== 0 ? String(rec.VartualAccountLength).trim() : ''
    );
    setCheckboxFromBit($('#chkIsDefault'), rec.IsDefault);
    setCheckboxFromBit($('#chkVartualAccountAutoGenerate'), rec.VartualAccountAutoGenerate);

    var hasECMS =
        (rec.ECMSBank != null && String(rec.ECMSBank).trim() !== '') ||
        (rec.eCMSBank != null && String(rec.eCMSBank).trim() !== '') ||
        (rec.F_eCMSMaster_Code != null && parseInt(String(rec.F_eCMSMaster_Code), 10) > 0);
    $('#chkECMSApplicable').prop('checked', hasECMS);
    toggleECMSPanel(hasECMS);

    var currency = rec.CurrencyName != null ? String(rec.CurrencyName).trim() : '';
    var city = bankTrimField(rec.City, BANK_FIELD_MAX.City);
    var state = bankTrimField(rec.State, BANK_FIELD_MAX.State);
    var nation = bankTrimField(rec.Nation, BANK_FIELD_MAX.Nation);
    var ecmsBank = rec.ECMSBank != null ? String(rec.ECMSBank).trim() : rec.eCMSBank != null ? String(rec.eCMSBank).trim() : '';
    var debitAccount =
        rec.eCMSDebitAccountName != null
            ? String(rec.eCMSDebitAccountName).trim()
            : rec.eCMSDebitAccount != null
              ? String(rec.eCMSDebitAccount).trim()
              : '';

    G_BANK_SuppressCityAddressFill = true;
    $('#ddlCurrency').val(currency).trigger('change');
    $('#ddlCity').val(city).trigger('change');
    $('#ddlState').val(state).trigger('change');
    $('#ddlNation').val(nation).trigger('change');
    $('#ddlECMSBank').val(ecmsBank).trigger('change');
    $('#ddlECMSDebitAccount').val(debitAccount).trigger('change');
    try {
        $('#bankDetailPanel select').each(function () {
            if ($(this).data('select2')) $(this).trigger('change.select2');
        });
    } catch (e) {}
    G_BANK_SuppressCityAddressFill = false;
}
function loadEditRecord(code, mode) {
    return BankMasterService.GetBankMasterByCode(code)
        .then(function (res) {
            var unpacked = unwrapBankGet(res);
            var rec = unpacked.bank;
            if (!rec || typeof rec !== 'object' || (!rec.BankName && !rec.bankName && !rec.Code && !rec.code)) {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                G_BANK_OpeningRows = [];
                setDetailFormMode(mode || 'edit');
                return;
            }
            return loadMasterDropdowns().then(function () {
                G_BANK_OpeningRows = (unpacked.details || []).map(mapOpeningDetail).filter(function (r) {
                    return r && (r.projectMaster_Code || r.subProjectMaster_Code || r.amount);
                });
                populateForm(rec);
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function ynFromCheckbox($el) {
    return $el.length && $el.prop('checked') ? 'Y' : 'N';
}
/** Single row — matches BizSol.WebERP.Models.Common.Models.tblBankMaster */
function buildBankMasterRow(code) {
    var pinRaw = ($('#txtPin').val() || '').trim();
    var pinStr = pinRaw !== '' ? bankTrimField(pinRaw.replace(/\D/g, ''), BANK_FIELD_MAX.PinCode) : '';
    var vaLenRaw = ($('#txtVartualAccountLength').val() || '').trim();
    var vaLen = vaLenRaw !== '' ? bankClampInt(vaLenRaw, 0, BANK_FIELD_MAX.VartualAccountLengthMax) : 0;
    var ecmsOn = $('#chkECMSApplicable').prop('checked');
    return {
        Code: code,
        BankName: bankTrimField($('#txtBankName').val(), BANK_FIELD_MAX.BankName),
        Address: bankTrimField($('#txtAddress').val(), BANK_FIELD_MAX.Address),
        City: bankTrimField($('#ddlCity').val(), BANK_FIELD_MAX.City),
        PinCode: pinStr,
        State: bankTrimField($('#ddlState').val(), BANK_FIELD_MAX.State),
        Nation: bankTrimField($('#ddlNation').val(), BANK_FIELD_MAX.Nation),
        EMail: bankTrimField($('#txtEMail').val(), BANK_FIELD_MAX.EMail),
        PhoneNo: bankTrimField($('#txtPhoneNo').val(), BANK_FIELD_MAX.PhoneNo),
        FaxNo: bankTrimField($('#txtFaxNo').val(), BANK_FIELD_MAX.FaxNo),
        ServiceTaxNo: bankTrimField($('#txtServiceTaxNo').val(), BANK_FIELD_MAX.ServiceTaxNo),
        PANNo: bankTrimField($('#txtPANNo').val(), BANK_FIELD_MAX.PANNo),
        DatabaseLocation_Code: G_BANK_SavedDatabaseLocationCode || 0,
        AccountNo: bankTrimField($('#txtAccountNo').val(), BANK_FIELD_MAX.AccountNo),
        IFSC_Code: bankTrimField($('#txtIFSCCode').val(), BANK_FIELD_MAX.IFSC_Code),
        IsDefault: ynFromCheckbox($('#chkIsDefault')),
        MICRCode: bankTrimField($('#txtMICRCode').val(), BANK_FIELD_MAX.MICRCode),
        AliasName: bankTrimField($('#txtAliasName').val(), BANK_FIELD_MAX.AliasName),
        SwiftCode: bankTrimField($('#txtSwiftCode').val(), BANK_FIELD_MAX.SwiftCode),
        CurrencyName: ($('#ddlCurrency').val() || '').toString().trim(),
        ECMSBank: ecmsOn ? ($('#ddlECMSBank').val() || '').toString().trim() : '',
        VartualAccountPrefix: ecmsOn ? bankTrimField($('#txtVartualAccountPrefix').val(), BANK_FIELD_MAX.VartualAccountPrefix) : '',
        VartualAccountLength: ecmsOn ? vaLen : 0,
        VartualAccountAutoGenerate: ecmsOn ? ynFromCheckbox($('#chkVartualAccountAutoGenerate')) : 'N',
        eCMSDebitAccountName: ecmsOn ? ($('#ddlECMSDebitAccount').val() || '').toString().trim() : '',
        UserMaster_Code: G_UserMasterCode,
        GSTNo: '',
    };
}
function toBankApiRow(row) {
    return {
        code: row.Code || 0,
        bankName: row.BankName || '',
        address: row.Address || '',
        city: row.City || '',
        pinCode: row.PinCode || '',
        state: row.State || '',
        nation: row.Nation || '',
        eMail: row.EMail || '',
        phoneNo: row.PhoneNo || '',
        faxNo: row.FaxNo || '',
        serviceTaxNo: row.ServiceTaxNo || '',
        panNo: row.PANNo || '',
        databaseLocation_Code: row.DatabaseLocation_Code || 0,
        accountNo: row.AccountNo || '',
        ifsC_Code: row.IFSC_Code || '',
        isDefault: row.IsDefault || 'N',
        micrCode: row.MICRCode || '',
        aliasName: row.AliasName || '',
        swiftCode: row.SwiftCode || '',
        currencyName: row.CurrencyName || '',
        ecmsBank: row.ECMSBank || '',
        vartualAccountPrefix: row.VartualAccountPrefix || '',
        vartualAccountLength: row.VartualAccountLength || 0,
        vartualAccountAutoGenerate: row.VartualAccountAutoGenerate || 'N',
        eCMSDebitAccountName: row.eCMSDebitAccountName || '',
        userMaster_Code: row.UserMaster_Code || 0,
        gstNo: row.GSTNo || '',
    };
}
function buildSavePayload() {
    var code = parseInt($('#hfBankMaster_Code').val() || '0', 10) || 0;
    var row = buildBankMasterRow(code);
    var details = [];
    if (G_BANK_AskProjectOpening) {
        details = (G_BANK_OpeningRows || []).map(function (r) {
            return {
                code: r.code || 0,
                bankMaster_Code: code,
                projectMaster_Code: r.projectMaster_Code || 0,
                subProjectMaster_Code: r.subProjectMaster_Code || 0,
                amount: r.amount || 0,
            };
        });
    }
    return {
        bankMaster: [toBankApiRow(row)],
        projectWiseOpenningDetail: details,
    };
}
function saveBank() {
    var currentCode = parseInt($('#hfBankMaster_Code').val() || '0', 10) || 0;
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var bankName = ($('#txtBankName').val() || '').trim();
        if (!bankName) {
            showFieldError('txtBankName', 'Bank Name is required.');
            $('#txtBankName').focus();
            return;
        }

        BankMasterService.SaveBankMaster(buildSavePayload())
            .then(function (res) {
                var ok = res && (res.Status === 'Y' || res.status === 'Y');
                if (ok) {
                    if (typeof toastr !== 'undefined') toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
                    clearAllFieldErrors();
                    setTimeout(function () {
                        showListPanel();
                    }, 900);
                } else {
                    if (typeof toastr !== 'undefined')
                        toastr.error((res && (res.Msg || res.Message || res.message)) || 'Save failed.');
                }
            })
            .catch(function () {
                if (typeof toastr !== 'undefined') toastr.error('Save request failed. Please verify Bank API endpoints.');
            });
    });
}
function Bank_OpenView(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function Bank_OpenEdit(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function Bank_OpenDelete(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfBankDeleteCode').val(code);
        $('#bankReasonForDelete').val('');
        showModal('dvBankDeleteModal');
        setTimeout(function () {
            $('#bankReasonForDelete').focus();
        }, 300);
    });
}
function bankFlagIsY(val) {
    if (val === true || val === 1) return true;
    var s = val == null ? '' : String(val).trim().toUpperCase();
    return s === 'Y' || s === 'YES' || s === '1' || s === 'TRUE';
}
function bankReadAskProjectOpening(res) {
    var name = 'askprojectopenninginbankmaster';
    function fromObj(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
        var keys = Object.keys(obj);
        var i;
        for (i = 0; i < keys.length; i++) {
            if (keys[i].replace(/[^a-z0-9]/gi, '').toLowerCase() === name) return obj[keys[i]];
        }
        var label = obj.ParameterName || obj.parameterName || obj.ParaName || obj.paraName || obj.FieldName || obj.fieldName || obj.Name || obj.name;
        if (label && String(label).replace(/[^a-z0-9]/gi, '').toLowerCase() === name) {
            if (obj.ParameterValue != null) return obj.ParameterValue;
            if (obj.parameterValue != null) return obj.parameterValue;
            if (obj.ParaValue != null) return obj.ParaValue;
            if (obj.Value != null) return obj.Value;
            if (obj.value != null) return obj.value;
        }
        return null;
    }
    function walk(node, depth) {
        if (node == null || depth > 4) return null;
        if (typeof node !== 'object') return null;
        if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                var hit = walk(node[i], depth + 1);
                if (hit != null) return hit;
            }
            return null;
        }
        var direct = fromObj(node);
        if (direct != null) return direct;
        var keys = Object.keys(node);
        for (var k = 0; k < keys.length; k++) {
            var child = node[keys[k]];
            if (child && typeof child === 'object') {
                var nested = walk(child, depth + 1);
                if (nested != null) return nested;
            }
        }
        return null;
    }
    return bankFlagIsY(walk(res, 0));
}
function bankCopyIfMissing(rec, pascal, camel) {
    if (rec[pascal] == null || rec[pascal] === '') {
        if (rec[camel] != null && rec[camel] !== '') rec[pascal] = rec[camel];
    }
}
function normalizeBankRecord(rec) {
    if (!rec || typeof rec !== 'object') return rec;
    bankCopyIfMissing(rec, 'Code', 'code');
    bankCopyIfMissing(rec, 'BankName', 'bankName');
    bankCopyIfMissing(rec, 'AliasName', 'aliasName');
    bankCopyIfMissing(rec, 'Address', 'address');
    bankCopyIfMissing(rec, 'City', 'city');
    bankCopyIfMissing(rec, 'PinCode', 'pinCode');
    bankCopyIfMissing(rec, 'State', 'state');
    bankCopyIfMissing(rec, 'Nation', 'nation');
    bankCopyIfMissing(rec, 'EMail', 'eMail');
    bankCopyIfMissing(rec, 'PhoneNo', 'phoneNo');
    bankCopyIfMissing(rec, 'FaxNo', 'faxNo');
    bankCopyIfMissing(rec, 'ServiceTaxNo', 'serviceTaxNo');
    bankCopyIfMissing(rec, 'PANNo', 'panNo');
    bankCopyIfMissing(rec, 'DatabaseLocation_Code', 'databaseLocation_Code');
    bankCopyIfMissing(rec, 'AccountNo', 'accountNo');
    bankCopyIfMissing(rec, 'IFSC_Code', 'ifsC_Code');
    bankCopyIfMissing(rec, 'IFSC_Code', 'iFSC_Code');
    bankCopyIfMissing(rec, 'IsDefault', 'isDefault');
    bankCopyIfMissing(rec, 'MICRCode', 'micrCode');
    bankCopyIfMissing(rec, 'SwiftCode', 'swiftCode');
    bankCopyIfMissing(rec, 'CurrencyName', 'currencyName');
    bankCopyIfMissing(rec, 'ECMSBank', 'ecmsBank');
    bankCopyIfMissing(rec, 'VartualAccountPrefix', 'vartualAccountPrefix');
    bankCopyIfMissing(rec, 'VartualAccountLength', 'vartualAccountLength');
    bankCopyIfMissing(rec, 'VartualAccountAutoGenerate', 'vartualAccountAutoGenerate');
    bankCopyIfMissing(rec, 'eCMSDebitAccountName', 'eCMSDebitAccountName');
    bankCopyIfMissing(rec, 'GSTNo', 'gstNo');
    return rec;
}
function pickOpeningDetailNode(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var keys = ['projectWiseOpenningDetail', 'ProjectWiseOpenningDetail', 'projectWiseOpeningDetail', 'ProjectWiseOpeningDetail'];
    for (var i = 0; i < keys.length; i++) {
        if (obj[keys[i]] != null) return obj[keys[i]];
    }
    return null;
}
function unwrapBankGet(res) {
    var root = res;
    if (root && root.data && typeof root.data === 'object' && !Array.isArray(root.data)) root = root.data;
    else if (root && root.Data && typeof root.Data === 'object' && !Array.isArray(root.Data)) root = root.Data;
    var bankNode = null;
    var detailNode = null;
    if (Array.isArray(root) && root.length && Array.isArray(root[0])) {
        bankNode = root[0];
        detailNode = root.length > 1 ? root[1] : [];
    } else if (root && typeof root === 'object' && !Array.isArray(root)) {
        bankNode = root.bankMaster || root.BankMaster || null;
        detailNode = pickOpeningDetailNode(root);
    }
    var bank = bankNode ? firstRecord(bankNode) : firstRecord(root);
    var details = detailNode != null ? firstArray(detailNode) : [];
    if (!details.length && bank && typeof bank === 'object') {
        var nested = pickOpeningDetailNode(bank);
        if (nested) details = firstArray(nested);
    }
    return { bank: normalizeBankRecord(bank), details: details };
}
function mapOpeningDetail(item) {
    if (!item || typeof item !== 'object') return null;
    var amount = parseFloat(item.amount != null ? item.amount : item.Amount);
    if (isNaN(amount)) amount = 0;
    return {
        code: parseInt(item.code != null ? item.code : item.Code, 10) || 0,
        bankMaster_Code: parseInt(item.bankMaster_Code != null ? item.bankMaster_Code : item.BankMaster_Code, 10) || 0,
        projectMaster_Code: parseInt(item.projectMaster_Code != null ? item.projectMaster_Code : item.ProjectMaster_Code, 10) || 0,
        subProjectMaster_Code: parseInt(item.subProjectMaster_Code != null ? item.subProjectMaster_Code : item.SubProjectMaster_Code, 10) || 0,
        amount: Math.round(amount * 100) / 100,
    };
}
function bankFormatAmount(n) {
    var x = Math.round((Number(n) || 0) * 100) / 100;
    if (!isFinite(x)) x = 0;
    return x.toFixed(2);
}
/** Digits only: up to 10 before the decimal and 2 after. */
function bankLimitAmountText(value) {
    var s = String(value == null ? '' : value).replace(/,/g, '');
    var out = '';
    var dot = false;
    var whole = 0;
    var frac = 0;
    for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (ch >= '0' && ch <= '9') {
            if (!dot) {
                if (whole >= 10) continue;
                whole++;
                out += ch;
            } else {
                if (frac >= 2) continue;
                frac++;
                out += ch;
            }
        } else if (ch === '.' && !dot) {
            dot = true;
            out += ch;
        }
    }
    return out;
}
function bankParseAmount(val) {
    var s = bankLimitAmountText(val).trim();
    if (!s || s === '.') return 0;
    var n = parseFloat(s);
    if (isNaN(n) || !isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}
function bankSumOpening(rows) {
    var total = 0;
    (rows || []).forEach(function (r) {
        total += Number(r.amount) || 0;
    });
    return Math.round(total * 100) / 100;
}
function bankEscHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function applyBankOpeningUi() {
    var on = !!G_BANK_AskProjectOpening;
    $('#lblServiceTaxNo').text(on ? 'Openning' : 'Service Tax No');
    if (on) $('#btnBankOpening').css('display', 'inline-flex');
    else $('#btnBankOpening').hide();
    var view = G_BANK_DetailMode === 'view';
    if (on) {
        $('#txtServiceTaxNo').prop('readonly', true);
        if (G_BANK_OpeningRows && G_BANK_OpeningRows.length) {
            $('#txtServiceTaxNo').val(bankFormatAmount(bankSumOpening(G_BANK_OpeningRows)));
        }
    } else if (!view) {
        $('#txtServiceTaxNo').prop('readonly', false);
    }
}
function loadFinanceOpeningParameter() {
    return BankMasterService.GetFixedParameterFinance()
        .then(function (res) {
            G_BANK_AskProjectOpening = bankReadAskProjectOpening(res);
            applyBankOpeningUi();
            if (G_BANK_AskProjectOpening) return loadOpeningMasters();
        })
        .catch(function () {
            G_BANK_AskProjectOpening = false;
            applyBankOpeningUi();
        });
}
function loadOpeningMasters() {
    if (G_BANK_OpeningMastersLoaded) return Promise.resolve();
    return Promise.all([
        ProjectMasterService.GetProjectList()
            .then(function (res) { return firstArray(res); })
            .catch(function () { return []; }),
        SubProjectMasterService.GetSubProjectList()
            .then(function (res) { return firstArray(res); })
            .catch(function () { return []; }),
    ]).then(function (pair) {
        G_BANK_ProjectRows = pair[0] || [];
        G_BANK_SubProjectRows = pair[1] || [];
        G_BANK_OpeningMastersLoaded = G_BANK_ProjectRows.length > 0 || G_BANK_SubProjectRows.length > 0;
    });
}
function bankProjectText(p) {
    return String(p.ProjectDesp || p.projectDesp || p.ProjectName || p.projectName || p.ProjectCode || p.projectCode || '').trim();
}
function bankSubText(s) {
    return String(s.SubProjectDesp || s.subProjectDesp || s.SubProjectName || s.subProjectName || '').trim();
}
function bankSubParentCode(s) {
    var v = s.ProjectMaster_Code != null ? s.ProjectMaster_Code
        : s.projectMaster_Code != null ? s.projectMaster_Code
        : s.MasterProjectCode != null ? s.MasterProjectCode
        : s.masterProjectCode;
    return v == null ? '' : String(v);
}
function bankDestroySelect($sel) {
    if ($sel && $sel.length && $sel.data('select2')) $sel.select2('destroy');
}
function bankInitOpeningSelect($sel, placeholder) {
    if (!$sel || !$sel.length) return;
    bankDestroySelect($sel);
    $sel.select2({
        width: '100%',
        placeholder: placeholder || 'Search…',
        allowClear: true,
        dropdownParent: $('#dvBankOpeningModal'),
        dropdownCssClass: 'bank-op-dd',
        minimumResultsForSearch: 0,
    });
    $sel.off('select2:open.bankop').on('select2:open.bankop', function () {
        $('.select2-container--open, .select2-dropdown').css('z-index', 20050);
    });
}
function bankFillProjectSelect($sel, selected) {
    var current = selected != null && String(selected) !== '0' ? String(selected) : '';
    bankDestroySelect($sel);
    $sel.empty();
    $sel.append(new Option('-- Select Project --', ''));
    var seen = {};
    (G_BANK_ProjectRows || []).forEach(function (p) {
        var code = p.Code != null ? p.Code : p.code;
        if (code == null || String(code) === '0') return;
        var id = String(code);
        if (seen[id]) return;
        seen[id] = true;
        var text = bankProjectText(p) || id;
        $sel.append(new Option(text, id));
    });
    if (current && !$sel.find('option').filter(function () { return this.value === current; }).length) {
        $sel.append(new Option(current, current));
    }
    if (current) $sel.val(current);
}
function bankOpeningPairUsed(projectId, subId, exceptTr) {
    var pc = String(projectId || '');
    var sc = String(subId || '');
    if (!pc || pc === '0' || !sc || sc === '0') return false;
    var used = false;
    $('#bankOpeningBody tr.bank-op-row').each(function () {
        if (exceptTr && this === exceptTr) return;
        var p = String($(this).find('.bank-op-project').val() || '');
        var s = String($(this).find('.bank-op-sub').val() || '');
        if (p === pc && s === sc) used = true;
    });
    return used;
}
function bankFillSubSelect($sel, projectCode, selected) {
    var pc = projectCode != null && String(projectCode) !== '0' ? String(projectCode) : '';
    var current = selected != null && String(selected) !== '0' ? String(selected) : '';
    $sel.attr('data-project', pc);
    bankDestroySelect($sel);
    $sel.empty();
    $sel.append(new Option('-- Select Sub Project --', ''));
    if (!pc) return;
    var seen = {};
    (G_BANK_SubProjectRows || []).forEach(function (s) {
        if (bankSubParentCode(s) !== pc) return;
        var code = s.Code != null ? s.Code : s.code;
        if (code == null || String(code) === '0') return;
        var id = String(code);
        if (seen[id]) return;
        if (bankOpeningPairUsed(pc, id, $sel.closest('tr')[0]) && id !== current) return;
        seen[id] = true;
        var text = bankSubText(s) || id;
        $sel.append(new Option(text, id));
    });
    if (current && !$sel.find('option').filter(function () { return this.value === current; }).length) {
        $sel.append(new Option(current, current));
    }
    if (current) $sel.val(current);
}
function bankDestroyOpeningSelects() {
    $('#bankOpeningBody select').each(function () {
        bankDestroySelect($(this));
    });
}
function bankAddOpeningRow(row) {
    var bindingHere = !G_BANK_OpeningBinding;
    if (bindingHere) G_BANK_OpeningBinding = true;
    row = row || { code: 0, projectMaster_Code: 0, subProjectMaster_Code: 0, amount: '' };
    var view = G_BANK_DetailMode === 'view';
    var amt = row.amount === '' || row.amount == null ? '' : bankFormatAmount(row.amount);
    var dis = view ? ' disabled' : '';
    var del = view
        ? ''
        : '<button type="button" class="btn-bank-op-del" title="Remove"><i class="fas fa-times"></i></button>';
    $('#bankOpeningBody').append(
        '<tr class="bank-op-row" data-code="' + (parseInt(row.code, 10) || 0) + '">' +
            '<td class="bank-op-col-project"><select class="bank-op-project"' + dis + '></select></td>' +
            '<td class="bank-op-col-sub"><select class="bank-op-sub"' + dis + '></select></td>' +
            '<td class="bank-op-col-amt"><input type="text" class="bank-op-amt" inputmode="decimal" autocomplete="off" maxlength="13" placeholder="0.00"' + dis + ' value="' + bankEscHtml(amt) + '" /></td>' +
            '<td class="bank-op-col-act">' + del + '</td>' +
        '</tr>'
    );
    var $tr = $('#bankOpeningBody tr.bank-op-row').last();
    bankFillProjectSelect($tr.find('.bank-op-project'), row.projectMaster_Code);
    bankFillSubSelect($tr.find('.bank-op-sub'), row.projectMaster_Code, row.subProjectMaster_Code);
    bankInitOpeningSelect($tr.find('.bank-op-project'), 'Search project…');
    bankInitOpeningSelect($tr.find('.bank-op-sub'), 'Search sub project…');
    if (bindingHere) G_BANK_OpeningBinding = false;
}
function bankRenderOpeningRows(rows) {
    bankDestroyOpeningSelects();
    $('#bankOpeningBody').empty();
    var list = (rows || []).slice();
    if (!list.length && G_BANK_DetailMode !== 'view') list = [null];
    if (!list.length) {
        $('#bankOpeningBody').html('<tr><td colspan="4" style="text-align:center;padding:18px;color:#64748b;">No opening rows.</td></tr>');
        $('#bankOpeningTotal').text('0.00');
        return;
    }
    G_BANK_OpeningBinding = true;
    list.forEach(function (r) { bankAddOpeningRow(r); });
    G_BANK_OpeningBinding = false;
    bankRefreshOpeningModalTotal();
}
function bankRefreshOpeningModalTotal() {
    var total = 0;
    $('#bankOpeningBody .bank-op-amt').each(function () {
        var raw = ($(this).val() || '').trim();
        if (!raw || raw === '-' || raw === '.') return;
        total += bankParseAmount(raw);
    });
    $('#bankOpeningTotal').text(bankFormatAmount(total));
}
function bankCollectOpeningRows() {
    var rows = [];
    var error = '';
    var seen = {};
    $('#bankOpeningBody tr.bank-op-row').each(function () {
        if (error) return;
        var $tr = $(this);
        var project = parseInt($tr.find('.bank-op-project').val() || '0', 10) || 0;
        var sub = parseInt($tr.find('.bank-op-sub').val() || '0', 10) || 0;
        var amtRaw = bankLimitAmountText($tr.find('.bank-op-amt').val()).trim().replace(/\.$/, '');
        if (amtRaw.charAt(0) === '.') amtRaw = '0' + amtRaw;
        if (!project) { error = 'Project is required.'; return; }
        if (!sub) { error = 'Sub Project is required.'; return; }
        if (amtRaw === '' || !/^\d{1,10}(\.\d{1,2})?$/.test(amtRaw)) { error = 'Amount is required.'; return; }
        var amount = bankParseAmount(amtRaw);
        if (!(amount > 0)) { error = 'Amount must be greater than 0.'; return; }
        var key = project + ':' + sub;
        if (seen[key]) { error = 'This Project and Sub Project combination is already added.'; return; }
        seen[key] = true;
        rows.push({
            code: parseInt($tr.attr('data-code') || '0', 10) || 0,
            bankMaster_Code: parseInt($('#hfBankMaster_Code').val() || '0', 10) || 0,
            projectMaster_Code: project,
            subProjectMaster_Code: sub,
            amount: amount,
        });
    });
    return { rows: rows, error: error };
}
function openBankOpeningModal() {
    var go = function () {
        var view = G_BANK_DetailMode === 'view';
        $('#btnBankOpeningAdd, #btnBankOpeningSave').toggle(!view);
        var rendered = false;
        function renderOnce() {
            if (rendered) return;
            rendered = true;
            bankRenderOpeningRows(G_BANK_OpeningRows);
        }
        $('#dvBankOpeningModal').off('shown.bs.modal.bankop').one('shown.bs.modal.bankop', renderOnce);
        showModal('dvBankOpeningModal');
        setTimeout(function () {
            if (!rendered) renderOnce();
        }, 400);
    };
    loadOpeningMasters().then(go).catch(function () {
        if (typeof toastr !== 'undefined') toastr.error('Could not load projects.');
    });
}
function commitBankOpeningModal() {
    var collected = bankCollectOpeningRows();
    if (collected.error) {
        if (typeof toastr !== 'undefined') toastr.warning(collected.error);
        return;
    }
    G_BANK_OpeningRows = collected.rows;
    $('#txtServiceTaxNo').val(bankFormatAmount(bankSumOpening(collected.rows)));
    hideModal('dvBankOpeningModal');
}
function confirmBankDelete() {
    var code = parseInt($('#hfBankDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#bankReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvBankDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#bankReasonForDelete').focus();
        return;
    }
    BankMasterService.DeleteBankMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvBankDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshBankGrid();
            } else {
                if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.message)) || 'Delete failed.');
            }
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Delete request failed.');
        });
}
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('Bank Master');
    }

    $('#btnCreateBank').on('click', function () {
        MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            clearForm();
            loadMasterDropdowns().then(function () {
                showDetailPanel('new');
            });
        });
    });

    $('#btnBackToBankList').on('click', function () {
        showListPanel();
    });
    $('#btnClearBank').on('click', function () {
        clearForm();
    });
    $('#btnSaveBank').on('click', function () {
        saveBank();
    });
    $('#btnBankConfirmDelete').on('click', function () {
        confirmBankDelete();
    });

    $('#chkECMSApplicable').on('change', function () {
        toggleECMSPanel($(this).prop('checked'));
    });

    $('#ddlCity').on('change', function () {
        bankApplyAddressFromCity($(this).val());
    });

    $('#btnBankOpening').on('click', function () {
        openBankOpeningModal();
    });
    $('#btnBankOpeningAdd').on('click', function () {
        if (G_BANK_DetailMode === 'view') return;
        $('#bankOpeningBody tr').not('.bank-op-row').remove();
        bankAddOpeningRow(null);
        bankRefreshOpeningModalTotal();
    });
    $('#btnBankOpeningSave').on('click', function () {
        commitBankOpeningModal();
    });
    $('#bankOpeningBody').on('change', '.bank-op-project', function () {
        if (G_BANK_OpeningBinding) return;
        var $tr = $(this).closest('tr');
        var pc = String($(this).val() || '');
        var $sub = $tr.find('.bank-op-sub');
        if (String($sub.attr('data-project') || '') === pc) return;
        bankFillSubSelect($sub, pc, '');
        bankInitOpeningSelect($sub, 'Search sub project…');
    });
    $('#bankOpeningBody').on('select2:selecting', '.bank-op-sub', function (e) {
        if (G_BANK_OpeningBinding) return;
        var data = e.params && e.params.args && e.params.args.data;
        var subId = data ? String(data.id || '') : '';
        if (!subId) return;
        var $tr = $(this).closest('tr');
        var projectId = String($tr.find('.bank-op-project').val() || '');
        if (bankOpeningPairUsed(projectId, subId, $tr[0])) {
            e.preventDefault();
            if (typeof toastr !== 'undefined') toastr.warning('This Project and Sub Project combination is already added.');
        }
    });
    $('#bankOpeningBody').on('change', '.bank-op-sub', function () {
        if (G_BANK_OpeningBinding) return;
        var $sel = $(this);
        var $tr = $sel.closest('tr');
        var projectId = String($tr.find('.bank-op-project').val() || '');
        var subId = String($sel.val() || '');
        if (!bankOpeningPairUsed(projectId, subId, $tr[0])) return;
        G_BANK_OpeningBinding = true;
        $sel.val('').trigger('change.select2');
        G_BANK_OpeningBinding = false;
        if (typeof toastr !== 'undefined') toastr.warning('This Project and Sub Project combination is already added.');
    });
    $('#bankOpeningBody').on('input', '.bank-op-amt', function () {
        var el = this;
        var before = el.value;
        var next = bankLimitAmountText(before);
        if (next !== before) {
            var start = el.selectionStart || 0;
            el.value = next;
            var pos = Math.max(0, start - (before.length - next.length));
            try { el.setSelectionRange(pos, pos); } catch (e) {}
        }
        bankRefreshOpeningModalTotal();
    });
    $('#bankOpeningBody').on('click', '.btn-bank-op-del', function () {
        if (G_BANK_DetailMode === 'view') return;
        var $tr = $(this).closest('tr');
        $tr.find('select').each(function () {
            bankDestroySelect($(this));
        });
        $tr.remove();
        if (!$('#bankOpeningBody tr.bank-op-row').length) bankAddOpeningRow(null);
        bankRefreshOpeningModalTotal();
    });
    $('#dvBankOpeningModal').on('hidden.bs.modal', function () {
        bankDestroyOpeningSelects();
        $('#bankOpeningBody').empty();
    });

    $('#txtBankName').on('blur', function () {
        clearFieldError('txtBankName');
        if (!$(this).val().trim()) showFieldError('txtBankName', 'Bank Name is required.');
    }).on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtBankName');
    });

    var searchTimer;
    $('#bankSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindBankGridData(applyBankSearch(G_BANK_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    loadFinanceOpeningParameter();
    loadMasterDropdowns().then(function () {
        if (isFinite(codeFromUrl) && codeFromUrl > 0) {
            showDetailPanel('edit');
            clearForm();
            $('#hfBankMaster_Code').val(String(codeFromUrl));
            return loadEditRecord(codeFromUrl, 'edit');
        }
        refreshBankGrid();
    });
});

window.Bank_OpenView = Bank_OpenView;
window.Bank_OpenEdit = Bank_OpenEdit;
window.Bank_OpenDelete = Bank_OpenDelete;
