import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { CountryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CountryMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_COUNTRY_SourceRows = [];
var G_COUNTRY_ApiColumnKeys = null;
var G_COUNTRY_DetailMode = 'list';
var COUNTRY_GRID_HIDDEN_COLUMNS = ['Code', 'UserName', 'CreateDate', 'UpdateDate', 'Remarks'];

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
function formatDate(val) {
    if (val == null || val === '') return '';
    try {
        var d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN');
    } catch (e) {
        return String(val);
    }
}
function mergeColumnKeysFromRows(rows) {
    if (!rows || !rows.length) return [];
    var seen = {};
    var ordered = [];
    function addKey(k) {
        if (k === undefined || k === null) return;
        var s = String(k);
        if (seen[s]) return;
        seen[s] = true;
        ordered.push(s);
    }
    Object.keys(rows[0]).forEach(addKey);
    for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || typeof r !== 'object') continue;
        Object.keys(r).forEach(addKey);
    }
    return ordered;
}
function formatGridCellValue(key, val) {
    if (val == null || val === '') return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return formatDate(val);
    return String(val);
}
function isLikelyDateColumn(key, sampleRows) {
    if (/date$/i.test(key) || /timestamp$/i.test(key)) return true;
    for (var i = 0; i < sampleRows.length && i < 100; i++) {
        var v = sampleRows[i][key];
        if (v == null || v === '') continue;
        var s = typeof v === 'string' ? v : String(v);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true;
    }
    return false;
}
function isLikelyNumericColumn(key, sampleRows) {
    if (isLikelyDateColumn(key, sampleRows)) return false;
    var checked = 0;
    for (var i = 0; i < sampleRows.length && i < 100; i++) {
        var v = sampleRows[i][key];
        if (v == null || v === '') continue;
        checked++;
        var s = String(v).trim();
        if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
    }
    return checked > 0;
}
function buildFilterCategories(apiKeys, sampleRows, hiddenKeys) {
    var hide = hiddenKeys && hiddenKeys.length ? hiddenKeys : [];
    function isHiddenCol(k) {
        return hide.indexOf(k) >= 0;
    }
    var StringFilterColumn = [];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    apiKeys.forEach(function (key) {
        if (key === 'Code' || isHiddenCol(key)) return;
        if (isLikelyNumericColumn(key, sampleRows)) NumericFilterColumn.push(key);
        else StringFilterColumn.push(key);
    });
    return { StringFilterColumn: StringFilterColumn, NumericFilterColumn: NumericFilterColumn, DateFilterColumn: DateFilterColumn };
}
function mapApiRowToGridRow(item, idx, apiKeysOrdered) {
    var code = item.Code != null ? Number(item.Code) : 0;
    var row = {};
    row.Code = isFinite(code) ? code : 0;
    row['S.No.'] = idx + 1;
    apiKeysOrdered.forEach(function (key) {
        if (key === 'Code') return;
        row[key] = formatGridCellValue(key, item[key]);
    });
    row.Action = buildActionHtml(row.Code);
    return row;
}
function buildColumnAlignment(apiKeysOrdered) {
    var al = {
        'S.No.': 'center;min-width:52px;white-space:nowrap;',
        Action: 'center;min-width:128px;white-space:nowrap;',
    };
    apiKeysOrdered.forEach(function (key) {
        if (key === 'Code') return;
        if (/code$/i.test(key)) al[key] = 'center;min-width:72px;';
    });
    return al;
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="Country_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="Country_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="Country_OpenDelete(' +
        code +
        ')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>'
    );
}
function applyCountrySearch(rows) {
    var q = ($('#countrySearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        for (var k in r) {
            if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
            var v = r[k];
            if (v != null && String(v).toLowerCase().indexOf(q) >= 0) return true;
        }
        return false;
    });
}
function bindCountryGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-CountryMaster').empty();
        var colspan =
            G_COUNTRY_ApiColumnKeys && G_COUNTRY_ApiColumnKeys.length
                ? Math.max(6, G_COUNTRY_ApiColumnKeys.length + 2)
                : 10;
        $('#table-body-CountryMaster').html(
            '<tr><td colspan="' +
                colspan +
                '" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-CountryMaster').empty();
        return;
    }
    var apiKeys =
        G_COUNTRY_ApiColumnKeys && G_COUNTRY_ApiColumnKeys.length
            ? G_COUNTRY_ApiColumnKeys
            : mergeColumnKeysFromRows(rows);
    var sampleForFilters =
        G_COUNTRY_SourceRows && G_COUNTRY_SourceRows.length ? G_COUNTRY_SourceRows : rows;
    var dataKeys = apiKeys.filter(function (k) {
        return k !== 'Code';
    });
    var hiddenColumns = COUNTRY_GRID_HIDDEN_COLUMNS.slice();
    var fc = buildFilterCategories(dataKeys, sampleForFilters, hiddenColumns);
    var mapped = rows.map(function (item, idx) {
        return mapApiRowToGridRow(item, idx, apiKeys);
    });
    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-CountryMaster',
        'table-body-CountryMaster',
        mapped,
        false,
        [],
        fc.StringFilterColumn,
        fc.NumericFilterColumn,
        fc.DateFilterColumn,
        [],
        hiddenColumns,
        buildColumnAlignment(apiKeys),
        true,
        null,
        null
    );
}
function refreshCountryGrid() {
    CountryMasterService.GetCountryMasterList()
        .then(function (res) {
            G_COUNTRY_SourceRows = firstArray(res);
            G_COUNTRY_ApiColumnKeys = mergeColumnKeysFromRows(G_COUNTRY_SourceRows);
            bindCountryGridData(applyCountrySearch(G_COUNTRY_SourceRows));
        })
        .catch(function () {
            G_COUNTRY_SourceRows = [];
            G_COUNTRY_ApiColumnKeys = null;
            bindCountryGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load country list.');
        });
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('country-input-error');
    var $wrap = $field.closest('.country-fg');
    $wrap.find('.country-field-error').remove();
    $wrap.append(
        '<div class="country-field-error"><i class="fas fa-circle-exclamation"></i> <span>' + message + '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('country-input-error');
    $('#' + fieldId).closest('.country-fg').find('.country-field-error').remove();
}
function clearAllFieldErrors() {
    $('#countryDetailPanel .country-input-error').removeClass('country-input-error');
    $('#countryDetailPanel .country-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    $('#hfCountryMaster_Code').val('0');
    $('#txtCountryName').val('');
    $('#txtCountryCode').val('');
}
function setDetailFormMode(mode) {
    G_COUNTRY_DetailMode = mode;
    var ro = mode === 'view';
    $('#countryDetailPanel').toggleClass('country-readonly', ro);
    $('#txtCountryName, #txtCountryCode').prop('disabled', ro);
    if (!ro) {
        $('#btnSaveCountry, #btnClearCountry').show();
    } else {
        $('#btnSaveCountry, #btnClearCountry').hide();
    }
}
function showListPanel() {
    $('#countryListPanel').show();
    $('#countryDetailPanel').hide();
    G_COUNTRY_DetailMode = 'list';
    refreshCountryGrid();
}
function showDetailPanel(mode) {
    $('#countryListPanel').hide();
    $('#countryDetailPanel').show();
    setDetailFormMode(mode);
}
function loadEditRecord(code, mode) {
    return CountryMasterService.GetCountryMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            $('#hfCountryMaster_Code').val(rec.Code != null ? rec.Code : 0);
            $('#txtCountryName').val(rec.CountryName != null ? String(rec.CountryName).trim() : '');
            $('#txtCountryCode').val(rec.CountryCode != null ? String(rec.CountryCode).trim() : '');
            setDetailFormMode(mode || 'edit');
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    return {
        Code: parseInt($('#hfCountryMaster_Code').val() || '0', 10) || 0,
        CountryName: ($('#txtCountryName').val() || '').trim(),
        CountryCode: ($('#txtCountryCode').val() || '').trim(),
        UserMaster_Code: G_UserMasterCode,
    };
}
function saveCountry() {
    var currentCode = parseInt($('#hfCountryMaster_Code').val() || '0', 10) || 0;
    MenuService.CheckModuleOptionRight('Country Master', currentCode > 0 ? 'Edit' : 'New', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        var nm = ($('#txtCountryName').val() || '').trim();
        if (!nm) {
            showFieldError('txtCountryName', 'Country Name is required.');
            $('#txtCountryName').focus();
            return;
        }
        var cc = ($('#txtCountryCode').val() || '').trim();
        if (!cc) {
            showFieldError('txtCountryCode', 'Country Code is required.');
            $('#txtCountryCode').focus();
            return;
        }
        CountryMasterService.SaveCountryMaster(buildSavePayload())
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
                if (typeof toastr !== 'undefined') toastr.error('Save request failed.');
            });
    });
}
function Country_OpenView(code) {
    MenuService.CheckModuleOptionRight('Country Master', 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function Country_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('Country Master', 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function Country_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('Country Master', 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfCountryDeleteCode').val(code);
        $('#countryReasonForDelete').val('');
        showModal('dvCountryDeleteModal');
        setTimeout(function () {
            $('#countryReasonForDelete').focus();
        }, 300);
    });
}
function confirmCountryDelete() {
    var code = parseInt($('#hfCountryDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#countryReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvCountryDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#countryReasonForDelete').focus();
        return;
    }
    CountryMasterService.DeleteCountryMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvCountryDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshCountryGrid();
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
        $('#ERPHeading').text('Country Master');
    }
    $('#btnCreateCountry').on('click', function () {
        MenuService.CheckModuleOptionRight('Country Master', 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            clearForm();
            showDetailPanel('new');
        });
    });
    $('#btnBackToCountryList').on('click', function () {
        showListPanel();
    });
    $('#btnClearCountry').on('click', function () {
        clearForm();
    });
    $('#btnSaveCountry').on('click', function () {
        saveCountry();
    });
    $('#btnCountryConfirmDelete').on('click', function () {
        confirmCountryDelete();
    });
    var searchTimer;
    $('#countrySearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindCountryGridData(applyCountrySearch(G_COUNTRY_SourceRows));
        }, 200);
    });
    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);
    if (isFinite(codeFromUrl) && codeFromUrl > 0) {
        showDetailPanel('edit');
        clearForm();
        $('#hfCountryMaster_Code').val(String(codeFromUrl));
        loadEditRecord(codeFromUrl, 'edit');
    } else {
        refreshCountryGrid();
    }
});

window.Country_OpenView = Country_OpenView;
window.Country_OpenEdit = Country_OpenEdit;
window.Country_OpenDelete = Country_OpenDelete;
