import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { StateMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StateMasterService.js';
import { CountryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CountryMasterService.js';

var G_STATE_SourceRows = [];
var G_STATE_ApiColumnKeys = null;
var G_STATE_DetailMode = 'list';
var G_STATE_ListCountry = 'ALL';
/** Hidden in grid (th/td display:none). Must not appear in String/Numeric/Date filter lists — see Filter.js renderTableHeader order. */
var STATE_GRID_HIDDEN_COLUMNS = ['Code', 'StateShortName', 'UserName', 'CreateDate', 'UpdateDate'];

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
function countryRowsFromResponse(res) {
    return firstArray(res);
}
function bindListCountryFilter(countries) {
    var $sel = $('#ddlListCountryFilter');
    $sel.empty();
    $sel.append(new Option('All countries', 'ALL'));
    var seen = {};
    $.each(countries, function (_, item) {
        var cn = (item.CountryName || item.countryName || '').toString().trim();
        if (!cn || seen[cn]) return;
        seen[cn] = true;
        $sel.append(new Option(cn, cn));
    });
    $sel.val(G_STATE_ListCountry || 'ALL');
    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }
    $sel.select2({
        width: '100%',
        placeholder: 'Search or select country…',
        allowClear: false,
        minimumResultsForSearch: 0,
    });
}
function bindDetailCountryDropdown(countries, selectedCountryName) {
    var $sel = $('#ddlCountry');
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
        placeholder: 'Search or select country…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = (selectedCountryName || '').toString().trim();
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function loadCountries() {
    return CountryMasterService.GetCountryMasterList()
        .then(function (res) {
            var rows = countryRowsFromResponse(res);
            bindListCountryFilter(rows);
            return rows;
        })
        .catch(function () {
            bindListCountryFilter([]);
            return [];
        });
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('state-input-error');
    var $wrap = $field.closest('.state-fg');
    $wrap.find('.state-field-error').remove();
    $wrap.append(
        '<div class="state-field-error">' +
            '<i class="fas fa-circle-exclamation"></i> <span>' +
            message +
            '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('state-input-error');
    $('#' + fieldId).closest('.state-fg').find('.state-field-error').remove();
}
function clearAllFieldErrors() {
    $('#stateDetailPanel .state-input-error').removeClass('state-input-error');
    $('#stateDetailPanel .state-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    $('#hfStateMaster_Code').val('0');
    $('#txtState').val('');
    $('#txtStateInitial').val('');
    $('#txtStateCode').val('');
    $('#ddlCountry').val('').trigger('change');
    try {
        if ($('#ddlCountry').data('select2')) {
            $('#ddlCountry').val('').trigger('change.select2');
        }
    } catch (e) {}
}
function setDetailFormMode(mode) {
    G_STATE_DetailMode = mode;
    var ro = mode === 'view';
    $('#stateDetailPanel').toggleClass('state-readonly', ro);
    $('#txtState, #txtStateInitial, #txtStateCode').prop('disabled', ro);
    $('#ddlCountry').prop('disabled', ro);
    try {
        if ($('#ddlCountry').data('select2')) $('#ddlCountry').prop('disabled', ro);
    } catch (e) {}
    if (!ro) {
        $('#btnSaveState, #btnClearState').show();
    } else {
        $('#btnSaveState, #btnClearState').hide();
    }
}
function showListPanel() {
    $('#stateListPanel').show();
    $('#stateDetailPanel').hide();
    G_STATE_DetailMode = 'list';
    refreshStateGrid();
}
function showDetailPanel(mode) {
    $('#stateListPanel').hide();
    $('#stateDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="State_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="State_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="State_OpenDelete(' +
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
/** Preserve API key order from first row; append keys seen only on later rows. */
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
    var numeric = 0;
    for (var i = 0; i < sampleRows.length && i < 100; i++) {
        var v = sampleRows[i][key];
        if (v == null || v === '') continue;
        checked++;
        var s = String(v).trim();
        if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
        numeric++;
    }
    return checked > 0 && numeric === checked;
}
/**
 * Derive filter types from API keys.
 * Date-like columns use string filters (cells show locale-formatted dates; BizsolCustomFilterGrid date UI expects raw ISO).
 * Never mark a column as both hidden and string-filter (that misaligns header vs body in Filter.js).
 */
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
function applyStateSearchAndCountry(rows) {
    var q = ($('#stateSearch').val() || '').toLowerCase().trim();
    var country = (G_STATE_ListCountry || 'ALL').toString();
    var list = rows || [];
    if (country && country !== 'ALL') {
        list = list.filter(function (r) {
            return String(r.CountryName || '')
                .trim()
                .toLowerCase() === country.toLowerCase();
        });
    }
    if (!q) return list.slice();
    return list.filter(function (r) {
        for (var k in r) {
            if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
            var v = r[k];
            if (v != null && String(v).toLowerCase().indexOf(q) >= 0) return true;
        }
        return false;
    });
}
function bindStateGridData(filteredRows) {
    var rows = filteredRows || [];

    if (!rows.length) {
        $('#table-header-StateMaster').empty();
        var colspan =
            G_STATE_ApiColumnKeys && G_STATE_ApiColumnKeys.length
                ? Math.max(6, G_STATE_ApiColumnKeys.length + 2)
                : 10;
        $('#table-body-StateMaster').html(
            '<tr><td colspan="' +
                colspan +
                '" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-StateMaster').empty();
        return;
    }

    var apiKeys =
        G_STATE_ApiColumnKeys && G_STATE_ApiColumnKeys.length
            ? G_STATE_ApiColumnKeys
            : mergeColumnKeysFromRows(rows);
    var sampleForFilters =
        G_STATE_SourceRows && G_STATE_SourceRows.length ? G_STATE_SourceRows : rows;
    var dataKeys = apiKeys.filter(function (k) {
        return k !== 'Code';
    });
    var hiddenColumns = STATE_GRID_HIDDEN_COLUMNS.slice();
    var fc = buildFilterCategories(dataKeys, sampleForFilters, hiddenColumns);

    var mapped = rows.map(function (item, idx) {
        return mapApiRowToGridRow(item, idx, apiKeys);
    });

    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var ColumnAlignment = buildColumnAlignment(apiKeys);

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-StateMaster',
        'table-body-StateMaster',
        mapped,
        Button,
        showButtons,
        fc.StringFilterColumn,
        fc.NumericFilterColumn,
        fc.DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        true,
        null,
        null
    );
}
function refreshStateGrid() {
    G_STATE_ListCountry = ($('#ddlListCountryFilter').val() || 'ALL').toString();
    var countryParam = G_STATE_ListCountry === 'ALL' ? 'ALL' : G_STATE_ListCountry;
    StateMasterService.GetStateMasterList(countryParam)
        .then(function (res) {
            G_STATE_SourceRows = firstArray(res);
            G_STATE_ApiColumnKeys = mergeColumnKeysFromRows(G_STATE_SourceRows);
            bindStateGridData(applyStateSearchAndCountry(G_STATE_SourceRows));
        })
        .catch(function () {
            G_STATE_SourceRows = [];
            G_STATE_ApiColumnKeys = null;
            bindStateGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load state list.');
        });
}
function loadEditRecord(code, mode) {
    return StateMasterService.GetStateMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            $('#hfStateMaster_Code').val(rec.Code != null ? rec.Code : 0);
            $('#txtState').val(rec.StateName != null ? String(rec.StateName).trim() : '');
            $('#txtStateInitial').val(rec.StateShortName != null ? String(rec.StateShortName).trim() : '');
            $('#txtStateCode').val(rec.StateCode != null ? String(rec.StateCode).trim() : '');
            return loadCountries().then(function (countryRows) {
                bindDetailCountryDropdown(countryRows, rec.CountryName != null ? String(rec.CountryName).trim() : '');
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    return {
        Code: parseInt($('#hfStateMaster_Code').val() || '0', 10) || 0,
        CountryName: ($('#ddlCountry').val() || '').toString().trim(),
        StateName: ($('#txtState').val() || '').trim(),
        StateShortName: ($('#txtStateInitial').val() || '').trim(),
        StateCode: ($('#txtStateCode').val() || '').trim(),
    };
}
function saveState() {
    var currentCode = parseInt($('#hfStateMaster_Code').val() || '0', 10) || 0;
    var ModuleName = 'State Master';
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var country = ($('#ddlCountry').val() || '').toString().trim();
        if (!country) {
            if (typeof toastr !== 'undefined') toastr.warning('Please select a country.');
            try {
                if ($('#ddlCountry').data('select2')) $('#ddlCountry').select2('open');
                else $('#ddlCountry').focus();
            } catch (e) {
                $('#ddlCountry').focus();
            }
            return;
        }

        var stateName = ($('#txtState').val() || '').trim();
        if (!stateName) {
            showFieldError('txtState', 'State Name is required.');
            $('#txtState').focus();
            return;
        }

        var sc = ($('#txtStateCode').val() || '').trim();
        if (!/^\d{1,2}$/.test(sc)) {
            showFieldError('txtStateCode', 'State Code must be 1–2 digits.');
            $('#txtStateCode').focus();
            return;
        }

        StateMasterService.SaveStateMaster(buildSavePayload())
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
function State_OpenView(code) {
    MenuService.CheckModuleOptionRight('State Master', 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function State_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('State Master', 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function State_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('State Master', 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfStateDeleteCode').val(code);
        $('#stateReasonForDelete').val('');
        showModal('dvStateDeleteModal');
        setTimeout(function () {
            $('#stateReasonForDelete').focus();
        }, 300);
    });
}
function confirmStateDelete() {
    var code = parseInt($('#hfStateDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#stateReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvStateDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#stateReasonForDelete').focus();
        return;
    }
    StateMasterService.DeleteStateMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvStateDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshStateGrid();
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
        $('#ERPHeading').text('State Master');
    }

    $('#btnCreateState').on('click', function () {
        MenuService.CheckModuleOptionRight('State Master', 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            loadCountries().then(function (rows) {
                clearForm();
                bindDetailCountryDropdown(rows, '');
                showDetailPanel('new');
            });
        });
    });

    $('#btnBackToStateList').on('click', function () {
        showListPanel();
    });
    $('#btnClearState').on('click', function () {
        clearForm();
    });
    $('#btnSaveState').on('click', function () {
        saveState();
    });
    $('#btnStateConfirmDelete').on('click', function () {
        confirmStateDelete();
    });

    $('#ddlListCountryFilter').on('change', function () {
        G_STATE_ListCountry = ($(this).val() || 'ALL').toString();
        refreshStateGrid();
    });

    $('#txtState').on('blur', function () {
        clearFieldError('txtState');
        if (!$(this).val().trim()) showFieldError('txtState', 'State Name is required.');
    }).on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtState');
    });

    $('#txtStateInitial').on('input', function () {
        var v = ($(this).val() || '').toString().toUpperCase().replace(/[^A-Za-z]/g, '').slice(0, 10);
        $(this).val(v);
        clearFieldError('txtStateInitial');
    });

    $('#txtStateCode')
        .on('keypress', function (e) {
            var ch = String.fromCharCode(e.which);
            if (e.which === 13) return;
            if (!/[0-9]/.test(ch)) {
                e.preventDefault();
                return;
            }
            var cur = ($(this).val() || '').replace(/\D/g, '');
            var el = this;
            var selLen = Math.abs((el.selectionEnd || 0) - (el.selectionStart || 0));
            if (selLen === 0 && cur.length >= 2) e.preventDefault();
        })
        .on('input', function () {
            var v = ($(this).val() || '').replace(/\D/g, '').slice(0, 2);
            $(this).val(v);
            clearFieldError('txtStateCode');
        })
        .on('blur', function () {
            var v = ($(this).val() || '').trim();
            if (v && !/^\d{1,2}$/.test(v)) showFieldError('txtStateCode', 'State Code must be 1–2 digits.');
        });

    var searchTimer;
    $('#stateSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindStateGridData(applyStateSearchAndCountry(G_STATE_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    loadCountries()
        .then(function () {
            $('#ddlListCountryFilter').val('ALL');
            try {
                if ($('#ddlListCountryFilter').data('select2')) {
                    $('#ddlListCountryFilter').val('ALL').trigger('change.select2');
                }
            } catch (e) {}
            G_STATE_ListCountry = 'ALL';
        })
        .then(function () {
            if (isFinite(codeFromUrl) && codeFromUrl > 0) {
                showDetailPanel('edit');
                clearForm();
                $('#hfStateMaster_Code').val(String(codeFromUrl));
                return loadEditRecord(codeFromUrl, 'edit');
            }
            return refreshStateGrid();
        });
});

window.State_OpenView = State_OpenView;
window.State_OpenEdit = State_OpenEdit;
window.State_OpenDelete = State_OpenDelete;
