import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { CityMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CityMasterService.js';
import { CountryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CountryMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_CITY_SourceRows = [];
var G_CITY_CountryRows = [];
var G_CITY_DetailMode = 'list';
var G_CITY_ListState = 'ALL';
var G_CITY_ListCountry = 'India';

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
function stateRowsFromResponse(res) {
    return firstArray(res);
}
function bindListCountryToolbar(countries, selectedCountry) {
    var $sel = $('#ddlListCountryFilter');
    if (!$sel.length) return;
    $sel.empty();
    var seen = {};
    $.each(countries, function (_, item) {
        var cn = (item.CountryName || item.countryName || '').toString().trim();
        if (!cn || seen[cn]) return;
        seen[cn] = true;
        $sel.append(new Option(cn, cn));
    });
    var v = (selectedCountry || G_CITY_ListCountry || 'India').toString();
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }
    $sel.select2({
        width: '100%',
        placeholder: 'Search country…',
        minimumResultsForSearch: 0,
    });
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function bindListStateFilter(states) {
    var $sel = $('#ddlListStateFilter');
    $sel.empty();
    $sel.append(new Option('All states', 'ALL'));
    var seen = {};
    $.each(states, function (_, item) {
        var sn = (item.StateName || item.stateName || '').toString().trim();
        if (!sn || seen[sn]) return;
        seen[sn] = true;
        $sel.append(new Option(sn, sn));
    });
    $sel.val(G_CITY_ListState || 'ALL');
}
function bindDetailCountryDropdown(countries, selectedCountryName) {
    var $sel = $('#ddlDetailCountry');
    if (!$sel.length) return;
    $sel.empty();
    $sel.append(new Option('-- Select Country --', ''));
    $.each(countries, function (_, item) {
        var cn = (item.CountryName || item.countryName || '').toString().trim();
        if (!cn) return;
        $sel.append(new Option(cn, cn));
    });
    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }
    $sel.select2({
        width: '100%',
        placeholder: 'Search country…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = (selectedCountryName || '').toString().trim();
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function bindDetailStateDropdown(states, selectedStateName) {
    var $sel = $('#ddlStateName');
    $sel.empty();
    $sel.append(new Option('-- Select State --', ''));
    $.each(states, function (_, item) {
        var sn = (item.StateName || item.stateName || '').toString().trim();
        if (!sn) return;
        $sel.append(new Option(sn, sn));
    });
    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }
    $sel.select2({
        width: '100%',
        placeholder: 'Search or select state…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = (selectedStateName || '').toString().trim();
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function loadCountriesCache() {
    if (G_CITY_CountryRows && G_CITY_CountryRows.length) {
        return Promise.resolve(G_CITY_CountryRows);
    }
    return CountryMasterService.GetCountryMasterList()
        .then(function (res) {
            G_CITY_CountryRows = firstArray(res);
            return G_CITY_CountryRows;
        })
        .catch(function () {
            G_CITY_CountryRows = [];
            return [];
        });
}
function fetchStateRowsForCountry(countryName) {
    var c =
        countryName != null && String(countryName).trim() !== ''
            ? String(countryName).trim()
            : $('#ddlListCountryFilter').length
              ? ($('#ddlListCountryFilter').val() || 'ALL').toString()
              : 'ALL';
    return CityMasterService.GetStateList(c)
        .then(function (res) {
            return stateRowsFromResponse(res);
        })
        .catch(function () {
            return [];
        });
}
/** Refreshes list-toolbar state dropdown only. */
function loadStates(countryName) {
    return fetchStateRowsForCountry(countryName).then(function (rows) {
        bindListStateFilter(rows);
        return rows;
    });
}
/** Loads states for the detail panel without changing list filters. */
function loadStatesForDetail(countryName) {
    return fetchStateRowsForCountry(countryName).then(function (rows) {
        return rows;
    });
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('city-input-error');
    var $wrap = $field.closest('.city-fg');
    $wrap.find('.city-field-error').remove();
    $wrap.append(
        '<div class="city-field-error">' +
            '<i class="fas fa-circle-exclamation"></i> <span>' +
            message +
            '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('city-input-error');
    $('#' + fieldId).closest('.city-fg').find('.city-field-error').remove();
}
function clearAllFieldErrors() {
    $('#cityDetailPanel .city-input-error').removeClass('city-input-error');
    $('#cityDetailPanel .city-field-error').remove();
}
/** Digits only, max length 6 (India PIN / common numeric postal cap in this form). */
function sanitizePinDigits(raw) {
    return (raw || '').toString().replace(/\D/g, '').slice(0, 6);
}
/** India PIN cannot start with 0 — strip leading zeros after digit extract. */
function normalizePinInputDisplay(raw) {
    var v = sanitizePinDigits(raw).replace(/^0+/, '');
    return v.slice(0, 6);
}
/**
 * India Postal Index Number (PIN): exactly 6 digits; first digit is 1–9 (cannot be 0).
 * Empty field is allowed (stored as 0). Extend this if you add country-specific rules.
 */
function isValidIndiaPostPin(val) {
    return /^[1-9]\d{5}$/.test((val || '').toString());
}
/** Optional field: blank is valid; if user typed anything, it must be a complete valid India PIN. */
function isPinEmptyOrValidIndia(val) {
    var v = normalizePinInputDisplay(val);
    return v === '' || isValidIndiaPostPin(v);
}
function clearForm() {
    clearAllFieldErrors();
    $('#hfCityMaster_Code').val('0');
    $('#txtCityName').val('');
    $('#txtPin').val('');
    $('#txtSTDCode').val('0');
    $('#ddlDetailCountry').val('').trigger('change');
    try {
        if ($('#ddlDetailCountry').data('select2')) {
            $('#ddlDetailCountry').val('').trigger('change.select2');
        }
    } catch (e) {}
    $('#ddlStateName').val('').trigger('change');
    try {
        if ($('#ddlStateName').data('select2')) {
            $('#ddlStateName').val('').trigger('change.select2');
        }
    } catch (e) {}
}
function setDetailFormMode(mode) {
    G_CITY_DetailMode = mode;
    var ro = mode === 'view';
    $('#cityDetailPanel').toggleClass('city-readonly', ro);
    $('#txtCityName, #txtPin, #txtSTDCode').prop('disabled', ro);
    $('#ddlDetailCountry, #ddlStateName').prop('disabled', ro);
    try {
        if ($('#ddlDetailCountry').data('select2')) $('#ddlDetailCountry').prop('disabled', ro);
        if ($('#ddlStateName').data('select2')) $('#ddlStateName').prop('disabled', ro);
    } catch (e) {}
    if (!ro) {
        $('#btnSaveCity, #btnClearCity').show();
    } else {
        $('#btnSaveCity, #btnClearCity').hide();
    }
}
function showListPanel() {
    $('#cityListPanel').show();
    $('#cityDetailPanel').hide();
    G_CITY_DetailMode = 'list';
    refreshCityGrid();
}
function showDetailPanel(mode) {
    $('#cityListPanel').hide();
    $('#cityDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="City_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="City_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="City_OpenDelete(' +
        code +
        ')"><i class="fas fa-trash-alt"></i></button>' +
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
function mapRowForGrid(item, idx) {
    var code = item.Code != null ? Number(item.Code) : 0;
    return {
        Code: code,
        'S.No.': idx + 1,
        Country: item.CountryName != null ? String(item.CountryName).trim() : '',
        State: item.StateName != null ? String(item.StateName).trim() : '',
        City: item.CityName != null ? String(item.CityName).trim() : '',
        Pin: item.Pin != null ? Number(item.Pin) : 0,
        'STD Code': item.STDCode != null ? String(item.STDCode).trim() : '',
        'Activity By': item.UserName != null ? String(item.UserName).trim() : '',
        'Create Date': formatDate(item.CreateDate),
        'Update Date': formatDate(item.UpdateDate),
        Action: buildActionHtml(code),
    };
}
function applyCitySearch(rows) {
    var q = ($('#citySearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        return (
            String(r.CityName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.StateName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.Pin != null ? r.Pin : '').indexOf(q) >= 0 ||
            String(r.STDCode || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.CountryName || '').toLowerCase().indexOf(q) >= 0
        );
    });
}
function bindCityGridData(filteredRows) {
    var rows = filteredRows || [];

    if (!rows.length) {
        $('#table-header-CityMaster').empty();
        $('#table-body-CityMaster').html(
            '<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-CityMaster').empty();
        return;
    }

    var mapped = rows.map(function (item, idx) {
        return mapRowForGrid(item, idx);
    });

    var StringFilterColumn = ['Country', 'State', 'City', 'STD Code'];
    var NumericFilterColumn = ['Pin'];
    var DateFilterColumn = [];
    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code', 'Activity By', 'Create Date', 'Update Date'];
    var ColumnAlignment = {
        'S.No.': 'center;min-width:52px;white-space:nowrap;',
        Pin: 'center;min-width:72px;',
        'STD Code': 'center;min-width:88px;',
        Action: 'center;min-width:128px;white-space:nowrap;',
    };

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-CityMaster',
        'table-body-CityMaster',
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
function refreshCityGrid() {
    G_CITY_ListCountry = ($('#ddlListCountryFilter').val() || 'India').toString();
    G_CITY_ListState = ($('#ddlListStateFilter').val() || 'ALL').toString();
    CityMasterService.GetCityList(G_CITY_ListCountry, G_CITY_ListState)
        .then(function (res) {
            G_CITY_SourceRows = firstArray(res);
            bindCityGridData(applyCitySearch(G_CITY_SourceRows));
        })
        .catch(function () {
            G_CITY_SourceRows = [];
            bindCityGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load city list.');
        });
}
function loadEditRecord(code, mode) {
    return CityMasterService.GetCityMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            $('#hfCityMaster_Code').val(rec.Code != null ? rec.Code : 0);
            $('#txtCityName').val(rec.CityName != null ? String(rec.CityName).trim() : '');
            var pinDb = rec.Pin != null ? parseInt(String(rec.Pin).replace(/\D/g, ''), 10) : 0;
            if (!pinDb || isNaN(pinDb) || pinDb === 0) {
                $('#txtPin').val('');
            } else {
                $('#txtPin').val(normalizePinInputDisplay(String(rec.Pin)));
            }
            $('#txtSTDCode').val(rec.STDCode != null ? String(rec.STDCode).trim() : '');
            return loadCountriesCache().then(function (countryRows) {
                bindDetailCountryDropdown(countryRows, G_CITY_ListCountry || 'India');
                return loadStatesForDetail('ALL').then(function (stateRows) {
                    bindDetailStateDropdown(stateRows, rec.StateName != null ? String(rec.StateName).trim() : '');
                    setDetailFormMode(mode || 'edit');
                });
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    var pinRaw = normalizePinInputDisplay($('#txtPin').val());
    var pinNum = 0;
    if (pinRaw !== '' && isValidIndiaPostPin(pinRaw)) {
        pinNum = parseInt(pinRaw, 10);
        if (isNaN(pinNum)) pinNum = 0;
    }
    return {
        Code: parseInt($('#hfCityMaster_Code').val() || '0', 10) || 0,
        StateName: ($('#ddlStateName').val() || '').toString().trim(),
        CityName: ($('#txtCityName').val() || '').trim(),
        Pin: pinNum,
        STDCode: ($('#txtSTDCode').val() || '').trim(),
        UserMaster_Code: G_UserMasterCode,
    };
}
function saveCity() {
    var currentCode = parseInt($('#hfCityMaster_Code').val() || '0', 10) || 0;
    var ModuleName = 'City Master';
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var city = ($('#txtCityName').val() || '').trim();
        if (!city) {
            showFieldError('txtCityName', 'City Name is required.');
            $('#txtCityName').focus();
            return;
        }

        var st = ($('#ddlStateName').val() || '').toString().trim();
        if (!st) {
            if (typeof toastr !== 'undefined') toastr.warning('Please select a state.');
            try {
                if ($('#ddlStateName').data('select2')) $('#ddlStateName').select2('open');
                else $('#ddlStateName').focus();
            } catch (e) {
                $('#ddlStateName').focus();
            }
            return;
        }

        var pinVal = normalizePinInputDisplay($('#txtPin').val());
        $('#txtPin').val(pinVal);
        if (!isPinEmptyOrValidIndia(pinVal)) {
            showFieldError(
                'txtPin',
                'Pin is optional. If entered: use 6 digits (India PIN), first digit 1–9, cannot start with 0. Leave blank to save as 0.'
            );
            $('#txtPin').focus();
            return;
        }

        CityMasterService.SaveCityMaster(buildSavePayload())
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
                if (typeof toastr !== 'undefined') toastr.error('Save request failed. Please verify City API endpoints.');
            });
    });
}
function City_OpenView(code) {
    MenuService.CheckModuleOptionRight('City Master', 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function City_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('City Master', 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function City_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('City Master', 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfCityDeleteCode').val(code);
        $('#cityReasonForDelete').val('');
        showModal('dvCityDeleteModal');
        setTimeout(function () {
            $('#cityReasonForDelete').focus();
        }, 300);
    });
}
function confirmCityDelete() {
    var code = parseInt($('#hfCityDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#cityReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvCityDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#cityReasonForDelete').focus();
        return;
    }
    CityMasterService.DeleteCityMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvCityDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshCityGrid();
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
        $('#ERPHeading').text('City Master');
    }

    $('#btnCreateCity').on('click', function () {
        MenuService.CheckModuleOptionRight('City Master', 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            var listCountry = ($('#ddlListCountryFilter').val() || G_CITY_ListCountry || 'India').toString();
            loadCountriesCache().then(function (crows) {
                clearForm();
                bindDetailCountryDropdown(crows, listCountry);
                return loadStatesForDetail(listCountry).then(function (srows) {
                    bindDetailStateDropdown(srows, '');
                    showDetailPanel('new');
                });
            });
        });
    });

    $('#btnBackToCityList').on('click', function () {
        showListPanel();
    });
    $('#btnClearCity').on('click', function () {
        clearForm();
    });
    $('#btnSaveCity').on('click', function () {
        saveCity();
    });
    $('#btnCityConfirmDelete').on('click', function () {
        confirmCityDelete();
    });

    $('#ddlListCountryFilter').on('change', function () {
        G_CITY_ListCountry = ($(this).val() || 'India').toString();
        G_CITY_ListState = 'ALL';
        loadStates(G_CITY_ListCountry).then(function () {
            $('#ddlListStateFilter').val('ALL');
            refreshCityGrid();
        });
    });
    $('#ddlListStateFilter').on('change', function () {
        G_CITY_ListState = ($(this).val() || 'ALL').toString();
        refreshCityGrid();
    });
    $(document).on('change', '#ddlDetailCountry', function () {
        if (!$('#cityDetailPanel').is(':visible')) return;
        var c = ($(this).val() || '').toString().trim() || 'ALL';
        loadStatesForDetail(c).then(function (rows) {
            bindDetailStateDropdown(rows, '');
        });
    });

    $('#txtCityName').on('blur', function () {
        clearFieldError('txtCityName');
        if (!$(this).val().trim()) showFieldError('txtCityName', 'City Name is required.');
    }).on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtCityName');
    });

    $('#txtPin')
        .on('keypress', function (e) {
            var ch = String.fromCharCode(e.which);
            if (e.which === 13) return;
            if (!/[0-9]/.test(ch)) {
                e.preventDefault();
                return;
            }
            var el = this;
            var cur = sanitizePinDigits($(el).val());
            var selLen = Math.abs((el.selectionEnd || 0) - (el.selectionStart || 0));
            if (selLen === 0 && cur.length === 0 && ch === '0') {
                e.preventDefault();
                return;
            }
            if (cur.length >= 6 && selLen === 0) {
                e.preventDefault();
            }
        })
        .on('input', function () {
            var v = normalizePinInputDisplay($(this).val());
            $(this).val(v);
            if (isPinEmptyOrValidIndia(v)) clearFieldError('txtPin');
        })
        .on('paste', function (e) {
            var ev = e.originalEvent || e;
            var text = (ev.clipboardData || window.clipboardData).getData('text');
            e.preventDefault();
            var merged = normalizePinInputDisplay(sanitizePinDigits($(this).val()) + (text || ''));
            $(this).val(merged);
            $(this).trigger('input');
        })
        .on('blur', function () {
            var v = normalizePinInputDisplay($(this).val());
            $(this).val(v);
            clearFieldError('txtPin');
            if (v !== '' && !isValidIndiaPostPin(v)) {
                showFieldError(
                    'txtPin',
                    'Optional. India PIN: exactly 6 digits, first digit 1–9 (not 0). Leave blank to save as 0.'
                );
            }
        });

    var searchTimer;
    $('#citySearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindCityGridData(applyCitySearch(G_CITY_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    loadCountriesCache()
        .then(function (crows) {
            G_CITY_ListCountry = 'India';
            bindListCountryToolbar(crows, G_CITY_ListCountry);
            return loadStates(G_CITY_ListCountry);
        })
        .then(function () {
            $('#ddlListStateFilter').val('ALL');
            G_CITY_ListState = 'ALL';
            if (isFinite(codeFromUrl) && codeFromUrl > 0) {
                showDetailPanel('edit');
                clearForm();
                $('#hfCityMaster_Code').val(String(codeFromUrl));
                return loadEditRecord(codeFromUrl, 'edit');
            }
            refreshCityGrid();
        });
});

window.City_OpenView = City_OpenView;
window.City_OpenEdit = City_OpenEdit;
window.City_OpenDelete = City_OpenDelete;
