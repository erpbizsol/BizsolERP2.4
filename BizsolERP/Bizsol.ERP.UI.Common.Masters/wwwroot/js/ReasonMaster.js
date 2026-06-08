import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ReasonMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ReasonMasterService.js';
var G_REASON_SourceRows = [];
var G_REASON_ApiColumnKeys = null;
var G_REASON_DetailMode = 'list';
var G_REASON_ShowReasonCode = false;
var G_REASON_ShowLeadFollowUp = false;

var REASON_GRID_HIDDEN_COLUMNS = [
    'Code',
    'ReasonTypeMaster_Code',
    'UserID',
    'UserName',
    'CreateDate',
    'UpdateDate',
    'DataBaseLocation_Code',
    'EmployeeMaster_Code',
    'F_CommonValues_Code_Category',
    'DoNotShowInFollowUp',
    'ReasonCode',
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
function reasonTypeLabel(row) {
    if (!row || typeof row !== 'object') return '';
    return (
        row.Desp ||
        row.desp ||
        row.ReasonType ||
        row.ReasonTypeName ||
        row.ReasonTypeDesp ||
        ''
    )
        .toString()
        .trim();
}
function isBreakDownReasonTypeLabel(label) {
    return (label || '').toString().trim().toLowerCase() === 'break down reason';
}
function isBreakDownReasonTypeSelected() {
    var $sel = $('#ddlReasonTypeMaster');
    var label = '';
    try {
        if ($sel.data('select2')) {
            var data = $sel.select2('data');
            if (data && data.length && data[0].text) {
                label = data[0].text;
            }
        }
    } catch (e) {}
    if (!label) {
        label = ($sel.find('option:selected').text() || '').trim();
    }
    return isBreakDownReasonTypeLabel(label);
}
function clearBreakDownFieldValues() {
    clearFieldError('ddlReasonCategory');
    clearFieldError('ddlEmployeeResponsible');
    try {
        if ($('#ddlReasonCategory').data('select2')) {
            $('#ddlReasonCategory').val('').trigger('change.select2');
        } else {
            $('#ddlReasonCategory').val('');
        }
    } catch (e) {
        $('#ddlReasonCategory').val('');
    }
    try {
        if ($('#ddlEmployeeResponsible').data('select2')) {
            $('#ddlEmployeeResponsible').val('').trigger('change.select2');
        } else {
            $('#ddlEmployeeResponsible').val('');
        }
    } catch (e) {
        $('#ddlEmployeeResponsible').val('');
    }
}
function toggleBreakDownReasonFields() {
    var show = isBreakDownReasonTypeSelected();
    $('.reason-breakdown-field').toggle(show);
    if (!show) {
        clearBreakDownFieldValues();
    }
}
function isConfigFlagYes(val) {
    return (val || '').toString().trim().toUpperCase() === 'Y';
}
function toggleReasonCodeField() {
    $('#reasonCodeCol').toggle(G_REASON_ShowReasonCode);
    if (!G_REASON_ShowReasonCode) {
        $('#txtReasonCode').val('');
        clearFieldError('txtReasonCode');
    }
}
function toggleLeadFollowUpField() {
    $('#reasonLeadFollowUpCol').toggle(G_REASON_ShowLeadFollowUp);
    if (!G_REASON_ShowLeadFollowUp) {
        $('#chkLeadFollowUp').prop('checked', false);
        $('#hfReason_DoNotShowInFollowUp').val('N');
    }
}
function syncLeadFollowUpHidden() {
    if (!G_REASON_ShowLeadFollowUp) {
        $('#hfReason_DoNotShowInFollowUp').val('N');
        return;
    }
    $('#hfReason_DoNotShowInFollowUp').val($('#chkLeadFollowUp').is(':checked') ? 'N' : 'Y');
}
function loadReasonMasterConfig() {
    return ReasonMasterService.GetReasonMasterConfig()
        .then(function (res) {
            var rec = firstRecord(res);
            G_REASON_ShowReasonCode = isConfigFlagYes(rec && rec.ShowBreakDownShortCodeInResionMaster);
            G_REASON_ShowLeadFollowUp = isConfigFlagYes(rec && rec.LeadFollowUpApplicable);
            toggleReasonCodeField();
            toggleLeadFollowUpField();
            return rec;
        })
        .catch(function () {
            G_REASON_ShowReasonCode = false;
            G_REASON_ShowLeadFollowUp = false;
            toggleReasonCodeField();
            toggleLeadFollowUpField();
            return null;
        });
}
function destroySelect2IfAny($sel) {
    try {
        if ($sel.data('select2')) {
            $sel.select2('destroy');
        }
    } catch (e) {}
}
function bindDetailReasonTypeDropdown(types, selectedCode) {
    var $sel = $('#ddlReasonTypeMaster');
    $sel.empty();
    $sel.append(new Option('-- Select Reason Type --', ''));
    $.each(types || [], function (_, item) {
        var code = item.Code != null ? String(item.Code) : '';
        if (!code || code === '0') return;
        var label = reasonTypeLabel(item);
        if (!label) label = 'Type ' + code;
        $sel.append(new Option(label, code));
    });
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Search or select reason type…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
    toggleBreakDownReasonFields();
}
function bindReasonCategoryDropdown(rows, selectedCode) {
    var $sel = $('#ddlReasonCategory');
    $sel.empty();
    $sel.append(new Option('-- Select Category --', ''));
    $.each(rows || [], function (_, item) {
        var code = item.Code != null ? String(item.Code) : '';
        if (!code || code === '0') return;
        var label = (
            item.Desp ||
            item.Name ||
            item.CommonValueDesp ||
            item.value ||
            item.Value ||
            ''
        )
            .toString()
            .trim();
        if (!label) label = 'Category ' + code;
        $sel.append(new Option(label, code));
    });
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Search or select category…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function bindEmployeeResponsibleDropdown(rows, selectedCode) {
    var $sel = $('#ddlEmployeeResponsible');
    $sel.empty();
    $sel.append(new Option('-- Select Responsible Person --', ''));
    $.each(rows || [], function (_, item) {
        var code = item.Code != null ? String(item.Code) : '';
        if (!code || code === '0') return;
        var label = (item.Desp || '').toString().trim() || 'Employee ' + code;
        $sel.append(new Option(label, code));
    });
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Search or select employee…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}
function loadReasonTypes(selectedCode) {
    return ReasonMasterService.GetReasonTypeMasterList()
        .then(function (res) {
            var rows = firstArray(res);
            bindDetailReasonTypeDropdown(rows, selectedCode);
            return rows;
        })
        .catch(function () {
            bindDetailReasonTypeDropdown([], selectedCode);
            return [];
        });
}
function loadReasonCategories(selectedCode) {
    return ReasonMasterService.GetReasonCategoryList()
        .then(function (res) {
            var rows = firstArray(res).map(function (c) {
                return {
                    Code: c.Code,
                    Desp: (
                        c.Desp ||
                        c.Name ||
                        c.CommonValueDesp ||
                        c.value ||
                        c.Value ||
                        ''
                    )
                        .toString()
                        .trim(),
                };
            });
            bindReasonCategoryDropdown(rows, selectedCode);
            return rows;
        })
        .catch(function () {
            bindReasonCategoryDropdown([], selectedCode);
            return [];
        });
}
function loadEmployeesForReason(selectedCode) {
    return ReasonMasterService.GetEmployeeMasterDropdownList()
        .then(function (res) {
            var rows = firstArray(res).map(function (r) {
                return {
                    Code: r.Code,
                    Desp: (r.Desp || r.EmployeeName || '').toString().trim(),
                };
            });
            bindEmployeeResponsibleDropdown(rows, selectedCode);
            return rows;
        })
        .catch(function () {
            bindEmployeeResponsibleDropdown([], selectedCode);
            return [];
        });
}
/** @param {Object} sel - optional keys: ReasonTypeMaster_Code, F_CommonValues_Code_Category, EmployeeMaster_Code */
function loadAllReasonDetailDropdowns(sel) {
    sel = sel || {};
    return Promise.all([
        loadReasonTypes(sel.ReasonTypeMaster_Code),
        loadReasonCategories(sel.F_CommonValues_Code_Category),
        loadEmployeesForReason(sel.EmployeeMaster_Code),
    ]);
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('reason-input-error');
    var $wrap = $field.closest('.reason-fg');
    $wrap.find('.reason-field-error').remove();
    $wrap.append(
        '<div class="reason-field-error">' +
            '<i class="fas fa-circle-exclamation"></i> <span>' +
            message +
            '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('reason-input-error');
    $('#' + fieldId).closest('.reason-fg').find('.reason-field-error').remove();
}
function clearAllFieldErrors() {
    $('#reasonDetailPanel .reason-input-error').removeClass('reason-input-error');
    $('#reasonDetailPanel .reason-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    $('#hfReasonMaster_Code').val('0');
    $('#hfReason_DataBaseLocation_Code').val('0');
    $('#txtReasonCode').val('');
    $('#chkLeadFollowUp').prop('checked', false);
    $('#hfReason_DoNotShowInFollowUp').val('N');
    $('#txtReasonName').val('');
    $('#txtReasonDesp').val('');
    $('#ddlReasonTypeMaster').val('').trigger('change');
    try {
        if ($('#ddlReasonTypeMaster').data('select2')) {
            $('#ddlReasonTypeMaster').val('').trigger('change.select2');
        }
    } catch (e) {}
    try {
        if ($('#ddlReasonCategory').data('select2')) {
            $('#ddlReasonCategory').val('').trigger('change.select2');
        } else {
            $('#ddlReasonCategory').val('');
        }
    } catch (e) {}
    try {
        if ($('#ddlEmployeeResponsible').data('select2')) {
            $('#ddlEmployeeResponsible').val('').trigger('change.select2');
        } else {
            $('#ddlEmployeeResponsible').val('');
        }
    } catch (e) {}
    toggleBreakDownReasonFields();
}
function setDetailFormMode(mode) {
    G_REASON_DetailMode = mode;
    var ro = mode === 'view';
    $('#reasonDetailPanel').toggleClass('reason-readonly', ro);
    $('#txtReasonName, #txtReasonDesp, #txtReasonCode').prop('disabled', ro);
    $('#chkLeadFollowUp').prop('disabled', ro);
    $('#ddlReasonTypeMaster, #ddlReasonCategory, #ddlEmployeeResponsible').prop('disabled', ro);
    try {
        if ($('#ddlReasonTypeMaster').data('select2')) $('#ddlReasonTypeMaster').prop('disabled', ro);
        if ($('#ddlReasonCategory').data('select2')) $('#ddlReasonCategory').prop('disabled', ro);
        if ($('#ddlEmployeeResponsible').data('select2')) $('#ddlEmployeeResponsible').prop('disabled', ro);
    } catch (e) {}
    if (!ro) {
        $('#btnSaveReason, #btnClearReason').show();
    } else {
        $('#btnSaveReason, #btnClearReason').hide();
    }
}
function showListPanel() {
    $('#reasonListPanel').show();
    $('#reasonDetailPanel').hide();
    G_REASON_DetailMode = 'list';
    refreshReasonGrid();
}
function showDetailPanel(mode) {
    $('#reasonListPanel').hide();
    $('#reasonDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="Reason_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="Reason_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="Reason_OpenDelete(' +
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
function applyReasonSearch(rows) {
    var q = ($('#reasonSearch').val() || '').toLowerCase().trim();
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
function bindReasonGridData(filteredRows) {
    var rows = filteredRows || [];

    if (!rows.length) {
        $('#table-header-ReasonMaster').empty();
        var colspan =
            G_REASON_ApiColumnKeys && G_REASON_ApiColumnKeys.length
                ? Math.max(6, G_REASON_ApiColumnKeys.length + 2)
                : 10;
        $('#table-body-ReasonMaster').html(
            '<tr><td colspan="' +
                colspan +
                '" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-ReasonMaster').empty();
        return;
    }

    var apiKeys =
        G_REASON_ApiColumnKeys && G_REASON_ApiColumnKeys.length
            ? G_REASON_ApiColumnKeys
            : mergeColumnKeysFromRows(rows);
    var sampleForFilters =
        G_REASON_SourceRows && G_REASON_SourceRows.length ? G_REASON_SourceRows : rows;
    var dataKeys = apiKeys.filter(function (k) {
        return k !== 'Code';
    });
    var hiddenColumns = REASON_GRID_HIDDEN_COLUMNS.slice();
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
        'table-header-ReasonMaster',
        'table-body-ReasonMaster',
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
function refreshReasonGrid() {
    ReasonMasterService.GetReasonMasterList()
        .then(function (res) {
            G_REASON_SourceRows = firstArray(res);
            G_REASON_ApiColumnKeys = mergeColumnKeysFromRows(G_REASON_SourceRows);
            bindReasonGridData(applyReasonSearch(G_REASON_SourceRows));
        })
        .catch(function () {
            G_REASON_SourceRows = [];
            G_REASON_ApiColumnKeys = null;
            bindReasonGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load reason list.');
        });
}
function loadEditRecord(code, mode) {
    return ReasonMasterService.GetReasonMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            $('#hfReasonMaster_Code').val(rec.Code != null ? rec.Code : 0);
            $('#txtReasonName').val(rec.ReasonName != null ? String(rec.ReasonName).trim() : '');
            $('#txtReasonDesp').val(rec.ReasonDesp != null ? String(rec.ReasonDesp).trim() : '');
            var dblNum = rec.DataBaseLocation_Code != null ? Number(rec.DataBaseLocation_Code) : 0;
            $('#hfReason_DataBaseLocation_Code').val(isFinite(dblNum) && dblNum > 0 ? String(dblNum) : '0');
            $('#txtReasonCode').val(rec.ReasonCode != null ? String(rec.ReasonCode).trim() : '');
            var dns =
                rec.DoNotShowInFollowUp != null
                    ? String(rec.DoNotShowInFollowUp).trim().toUpperCase()
                    : 'N';
            $('#hfReason_DoNotShowInFollowUp').val(dns === 'Y' ? 'Y' : 'N');
            $('#chkLeadFollowUp').prop('checked', dns !== 'Y');
            var rtc = rec.ReasonTypeMaster_Code != null ? rec.ReasonTypeMaster_Code : '';
            var cat = rec.F_CommonValues_Code_Category != null ? rec.F_CommonValues_Code_Category : '';
            var emp = rec.EmployeeMaster_Code != null ? rec.EmployeeMaster_Code : '';
            return loadAllReasonDetailDropdowns({
                ReasonTypeMaster_Code: rtc,
                F_CommonValues_Code_Category: cat,
                EmployeeMaster_Code: emp,
            }).then(function () {
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    syncLeadFollowUpHidden();
    var dns = (($('#hfReason_DoNotShowInFollowUp').val() || '') + '').trim().toUpperCase();
    return {
        Code: parseInt($('#hfReasonMaster_Code').val() || '0', 10) || 0,
        ReasonName: ($('#txtReasonName').val() || '').trim(),
        ReasonDesp: ($('#txtReasonDesp').val() || '').trim(),
        ReasonTypeMaster_Code: parseInt($('#ddlReasonTypeMaster').val() || '0', 10) || 0,
        DataBaseLocation_Code: parseInt($('#hfReason_DataBaseLocation_Code').val() || '0', 10) || 0,
        DoNotShowInFollowUp: dns === 'Y' ? 'Y' : 'N',
        F_CommonValues_Code_Category: parseInt($('#ddlReasonCategory').val() || '0', 10) || 0,
        ReasonCode: G_REASON_ShowReasonCode ? ($('#txtReasonCode').val() || '').trim() : '',
        EmployeeMaster_Code: parseInt($('#ddlEmployeeResponsible').val() || '0', 10) || 0,
    };
}
function saveReason() {
    var currentCode = parseInt($('#hfReasonMaster_Code').val() || '0', 10) || 0;
    var ModuleName = 'Reason Master';
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var rt = parseInt($('#ddlReasonTypeMaster').val() || '0', 10) || 0;
        if (!rt) {
            if (typeof toastr !== 'undefined') toastr.warning('Please select a reason type.');
            try {
                if ($('#ddlReasonTypeMaster').data('select2')) $('#ddlReasonTypeMaster').select2('open');
                else $('#ddlReasonTypeMaster').focus();
            } catch (e) {
                $('#ddlReasonTypeMaster').focus();
            }
            return;
        }

        var reasonName = ($('#txtReasonName').val() || '').trim();
        if (!reasonName) {
            showFieldError('txtReasonName', 'Reason Name is required.');
            $('#txtReasonName').focus();
            return;
        }

        var desp = ($('#txtReasonDesp').val() || '').trim();
        if (!desp) {
            showFieldError('txtReasonDesp', 'Reason Description is required.');
            $('#txtReasonDesp').focus();
            return;
        }

        ReasonMasterService.SaveReasonMaster(buildSavePayload())
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
function Reason_OpenView(code) {
    MenuService.CheckModuleOptionRight('Reason Master', 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function Reason_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('Reason Master', 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function Reason_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('Reason Master', 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfReasonDeleteCode').val(code);
        $('#txtReasonDeleteRemark').val('');
        showModal('dvReasonDeleteModal');
        setTimeout(function () {
            $('#txtReasonDeleteRemark').focus();
        }, 300);
    });
}
function confirmReasonDelete() {
    var code = parseInt($('#hfReasonDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#txtReasonDeleteRemark').val() || '').trim();
    if (!code) {
        hideModal('dvReasonDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#txtReasonDeleteRemark').focus();
        return;
    }
    ReasonMasterService.DeleteReasonMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvReasonDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshReasonGrid();
            } else {
                if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.message)) || 'Delete failed.');
            }
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Delete request failed.');
        });
}
function initReasonMasterPage() {
    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    if (isFinite(codeFromUrl) && codeFromUrl > 0) {
        showDetailPanel('edit');
        clearForm();
        $('#hfReasonMaster_Code').val(String(codeFromUrl));
        loadEditRecord(codeFromUrl, 'edit');
    } else {
        refreshReasonGrid();
    }
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('Reason Master');
    }

    loadReasonMasterConfig().then(function () {
        initReasonMasterPage();
    });

    $('#btnCreateReason').on('click', function () {
        MenuService.CheckModuleOptionRight('Reason Master', 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            loadAllReasonDetailDropdowns({}).then(function () {
                clearForm();
                showDetailPanel('new');
            });
        });
    });

    $('#btnBackToReasonList').on('click', function () {
        showListPanel();
    });
    $('#btnClearReason').on('click', function () {
        clearForm();
    });
    $('#btnSaveReason').on('click', function () {
        saveReason();
    });
    $('#ddlReasonTypeMaster').on('change', function () {
        toggleBreakDownReasonFields();
    });
    $('#chkLeadFollowUp').on('change', function () {
        syncLeadFollowUpHidden();
    });
    $('#btnReasonConfirmDelete').on('click', function () {
        confirmReasonDelete();
    });

    $('#txtReasonName')
        .on('blur', function () {
            clearFieldError('txtReasonName');
            if (!$(this).val().trim()) showFieldError('txtReasonName', 'Reason Name is required.');
        })
        .on('input', function () {
            if ($(this).val().trim()) clearFieldError('txtReasonName');
        });

    $('#txtReasonDesp')
        .on('blur', function () {
            clearFieldError('txtReasonDesp');
            if (!$(this).val().trim()) showFieldError('txtReasonDesp', 'Reason Description is required.');
        })
        .on('input', function () {
            if ($(this).val().trim()) clearFieldError('txtReasonDesp');
        });

    var searchTimer;
    $('#reasonSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindReasonGridData(applyReasonSearch(G_REASON_SourceRows));
        }, 200);
    });

});

window.Reason_OpenView = Reason_OpenView;
window.Reason_OpenEdit = Reason_OpenEdit;
window.Reason_OpenDelete = Reason_OpenDelete;
