import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AreaMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AreaMasterService.js';
import { CityMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CityMasterService.js';

var G_AREA_SourceRows = [];
var G_AREA_ApiColumnKeys = null;
var G_AREA_DetailMode = 'list';

/** Default country for city list (same pattern as dispatch / city screens). */
var G_AREA_CityListCountry = 'India';

var AREA_GRID_HIDDEN_COLUMNS = [
    'Code',
    'CityMaster_Code',
    'CreatedBy',
    'UpdatedBy',
    'CreateDate',
    'UpdateDate',
];

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
function destroySelect2IfAny($sel) {
    try {
        if ($sel.data('select2')) {
            $sel.select2('destroy');
        }
    } catch (e) {}
}
function bindCityDropdown(rows, selectedCode) {
    var $sel = $('#ddlCityMaster');
    $sel.empty();
    $sel.append(new Option('-- Select City --', ''));
    $.each(rows || [], function (_, item) {
        var code = item.Code != null ? String(item.Code) : '';
        if (!code || code === '0') return;
        var label = (item.CityName || item.Desp || item.desp || '').toString().trim();
        if (!label) label = 'City ' + code;
        $sel.append(new Option(label, code));
    });
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Select city…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function loadCitiesForArea(selectedCode) {
    return CityMasterService.GetCityList(G_AREA_CityListCountry, 'ALL')
        .then(function (res) {
            var rows = firstArray(res);
            bindCityDropdown(rows, selectedCode);
            return rows;
        })
        .catch(function () {
            bindCityDropdown([], selectedCode);
            return [];
        });
}
function clearForm() {
    $('#hfAreaMaster_Code').val('0');
    $('#txtAreaName').val('');
    $('#txtAreaPIN').val('');
    try {
        if ($('#ddlCityMaster').data('select2')) {
            $('#ddlCityMaster').val('').trigger('change.select2');
        } else {
            $('#ddlCityMaster').val('');
        }
    } catch (e) {
        $('#ddlCityMaster').val('');
    }
}
function setDetailFormMode(mode) {
    G_AREA_DetailMode = mode;
    var ro = mode === 'view';
    $('#areaDetailPanel').toggleClass('area-readonly', ro);
    $('#txtAreaName, #txtAreaPIN').prop('disabled', ro);
    $('#ddlCityMaster').prop('disabled', ro);
    try {
        if ($('#ddlCityMaster').data('select2')) $('#ddlCityMaster').prop('disabled', ro);
    } catch (e) {}
    $('#btnSaveArea, #btnClearArea').toggle(!ro);
}
function showListPanel() {
    $('#areaListPanel').show();
    $('#areaDetailPanel').hide();
    G_AREA_DetailMode = 'list';
    refreshAreaGrid();
}
function showDetailPanel(mode) {
    $('#areaListPanel').hide();
    $('#areaDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="Area_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="Area_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="Area_OpenDelete(' +
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
function applyAreaSearch(rows) {
    var q = ($('#areaSearch').val() || '').toLowerCase().trim();
    var list = rows || [];
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
function bindAreaGridData(filteredRows) {
    var rows = filteredRows || [];

    if (!rows.length) {
        $('#table-header-AreaMaster').empty();
        var colspan =
            G_AREA_ApiColumnKeys && G_AREA_ApiColumnKeys.length
                ? Math.max(6, G_AREA_ApiColumnKeys.length + 2)
                : 10;
        $('#table-body-AreaMaster').html(
            '<tr><td colspan="' +
                colspan +
                '" style="text-align:center;padding:40px;color:#64748b;">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-AreaMaster').empty();
        return;
    }

    var apiKeys =
        G_AREA_ApiColumnKeys && G_AREA_ApiColumnKeys.length
            ? G_AREA_ApiColumnKeys
            : mergeColumnKeysFromRows(rows);
    var sampleForFilters = G_AREA_SourceRows && G_AREA_SourceRows.length ? G_AREA_SourceRows : rows;
    var dataKeys = apiKeys.filter(function (k) {
        return k !== 'Code';
    });
    var hiddenColumns = AREA_GRID_HIDDEN_COLUMNS.slice();
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
        'table-header-AreaMaster',
        'table-body-AreaMaster',
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
function refreshAreaGrid() {
    AreaMasterService.GetAreaMasterList()
        .then(function (res) {
            G_AREA_SourceRows = firstArray(res);
            G_AREA_ApiColumnKeys = mergeColumnKeysFromRows(G_AREA_SourceRows);
            bindAreaGridData(applyAreaSearch(G_AREA_SourceRows));
        })
        .catch(function () {
            G_AREA_SourceRows = [];
            G_AREA_ApiColumnKeys = null;
            bindAreaGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load area list.');
        });
}
function loadEditRecord(code, mode) {
    return AreaMasterService.GetAreaMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            $('#hfAreaMaster_Code').val(rec.Code != null ? rec.Code : 0);
            $('#txtAreaName').val(rec.AreaName != null ? String(rec.AreaName).trim() : '');
            var pin = rec.AreaPIN != null ? String(rec.AreaPIN).trim() : '';
            $('#txtAreaPIN').val(pin);
            var city = rec.CityMaster_Code != null ? rec.CityMaster_Code : '';
            return loadCitiesForArea(city).then(function () {
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    return {
        Code: parseInt($('#hfAreaMaster_Code').val() || '0', 10) || 0,
        AreaName: ($('#txtAreaName').val() || '').trim(),
        AreaPIN: ($('#txtAreaPIN').val() || '').trim(),
        CityMaster_Code: parseInt($('#ddlCityMaster').val() || '0', 10) || 0,
    };
}
function saveArea() {
    var currentCode = parseInt($('#hfAreaMaster_Code').val() || '0', 10) || 0;
    var ModuleName = 'Area Master';
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var city = parseInt($('#ddlCityMaster').val() || '0', 10) || 0;
        if (!city) {
            if (typeof toastr !== 'undefined') toastr.warning('Please select a city.');
            try {
                if ($('#ddlCityMaster').data('select2')) $('#ddlCityMaster').select2('open');
                else $('#ddlCityMaster').focus();
            } catch (e) {
                $('#ddlCityMaster').focus();
            }
            return;
        }

        var areaName = ($('#txtAreaName').val() || '').trim();
        if (!areaName) {
            if (typeof toastr !== 'undefined') toastr.warning('Area Name is required.');
            $('#txtAreaName').focus();
            return;
        }

        var pin = ($('#txtAreaPIN').val() || '').trim();
        if (pin.length > 6) {
            if (typeof toastr !== 'undefined') toastr.warning('Area PIN must be at most 6 characters.');
            $('#txtAreaPIN').focus();
            return;
        }

        AreaMasterService.SaveAreaMaster(buildSavePayload())
            .then(function (res) {
                var ok = res && (res.Status === 'Y' || res.status === 'Y');
                if (ok) {
                    if (typeof toastr !== 'undefined') toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
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
function Area_OpenView(code) {
    MenuService.CheckModuleOptionRight('Area Master', 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function Area_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('Area Master', 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function Area_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('Area Master', 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfAreaDeleteCode').val(code);
        $('#txtAreaDeleteRemark').val('');
        showModal('dvAreaDeleteModal');
        setTimeout(function () {
            $('#txtAreaDeleteRemark').focus();
        }, 300);
    });
}
function confirmAreaDelete() {
    var code = parseInt($('#hfAreaDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#txtAreaDeleteRemark').val() || '').trim();
    if (!code) {
        hideModal('dvAreaDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#txtAreaDeleteRemark').focus();
        return;
    }
    AreaMasterService.DeleteAreaMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvAreaDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshAreaGrid();
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
        $('#ERPHeading').text('Area Master');
    }

    $('#btnCreateArea').on('click', function () {
        MenuService.CheckModuleOptionRight('Area Master', 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            loadCitiesForArea('').then(function () {
                clearForm();
                showDetailPanel('new');
            });
        });
    });

    $('#btnBackToAreaList').on('click', function () {
        showListPanel();
    });
    $('#btnClearArea').on('click', function () {
        clearForm();
    });
    $('#btnSaveArea').on('click', function () {
        saveArea();
    });
    $('#btnAreaConfirmDelete').on('click', function () {
        confirmAreaDelete();
    });

    $('#txtAreaPIN').on('input', function () {
        var v = ($(this).val() || '').replace(/\D/g, '');
        if (v.length > 6) v = v.slice(0, 6);
        $(this).val(v);
    });

    var searchTimer;
    $('#areaSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindAreaGridData(applyAreaSearch(G_AREA_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    if (isFinite(codeFromUrl) && codeFromUrl > 0) {
        showDetailPanel('edit');
        clearForm();
        $('#hfAreaMaster_Code').val(String(codeFromUrl));
        loadEditRecord(codeFromUrl, 'edit');
    } else {
        refreshAreaGrid();
    }
});

window.Area_OpenView = Area_OpenView;
window.Area_OpenEdit = Area_OpenEdit;
window.Area_OpenDelete = Area_OpenDelete;
