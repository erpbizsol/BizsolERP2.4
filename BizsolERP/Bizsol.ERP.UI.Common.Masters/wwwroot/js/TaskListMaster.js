import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { TaskListMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';

var G_TLM_SourceRows = [];
var G_TLM_ApiColumnKeys = null;
var G_TLM_DetailMode = 'list';
var G_TLM_TaskRows = [];
var G_TLM_UserList = [];
var G_TLM_FreqList = [];

var TLM_MODULE_NAME = 'Task List Master';
var TLM_STATUS_OPTIONS = [
    { value: 'Y', label: 'Active' },
    { value: 'N', label: 'Inactive' },
];

var TLM_GRID_HIDDEN_COLUMNS = [
    'Code',
    'UserMaster_Code',
    'FrequencyMaster_Code',
    'UserId',
    'CreatedBy',
    'UpdatedBy',
    'CreateDate',
    'UpdateDate',
];

function authUserCode() {
    try {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}

function getTodayIso() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
}

function unwrapApiList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) {
        if (payload.length > 0 && Array.isArray(payload[0])) return payload[0];
        return payload;
    }
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    var nested = payload.Data || payload.data;
    if (nested && nested.$values && Array.isArray(nested.$values)) return nested.$values;
    var keys = ['Data', 'data', 'Result', 'result', 'value', 'Value', 'Table', 'table', 'Tasks', 'tasks', 'Rows', 'rows'];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (payload[k] && Array.isArray(payload[k])) return payload[k];
    }
    if (typeof payload === 'object') {
        var objKeys = Object.keys(payload);
        for (var j = 0; j < objKeys.length; j++) {
            var arr = payload[objKeys[j]];
            if (!Array.isArray(arr) || !arr.length) continue;
            var first = arr[0];
            if (first && typeof first === 'object' && !Array.isArray(first)) {
                if (
                    'Code' in first ||
                    'code' in first ||
                    'UserName' in first ||
                    'userName' in first ||
                    'Frequency' in first ||
                    'frequency' in first ||
                    'FinYear' in first ||
                    'finYear' in first ||
                    'Task' in first
                ) {
                    return arr;
                }
            }
        }
    }
    return [];
}

function firstArray(payload) {
    return unwrapApiList(payload);
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
        if ($sel.data('select2')) $sel.select2('destroy');
    } catch (e) {}
}

function normalizeUserRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.UserMaster_Code != null ? r.UserMaster_Code : r.code;
        var text =
            r.Desp ||
            r.EmployeeName ||
            r.UserName ||
            r.DisplayName ||
            r.PersonName ||
            r.Name ||
            r.LoginName ||
            r.UserID ||
            '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function normalizeFreqRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.FrequencyMaster_Code != null ? r.FrequencyMaster_Code : r.code;
        var text = r.Desp || r.Frequency || r.Freq || r.Name || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function getFreqDesp(freqCode) {
    var match = (G_TLM_FreqList || []).find(function (f) {
        return String(f.Code) === String(freqCode);
    });
    return match ? match.Desp : '';
}

function resolveFreqCode(data) {
    if (data.FrequencyMaster_Code != null && data.FrequencyMaster_Code !== '') {
        return data.FrequencyMaster_Code;
    }
    if (data.FreqCode != null && data.FreqCode !== '') {
        return data.FreqCode;
    }
    var freqText = data.Freq != null ? String(data.Freq).trim() : data.Frequency != null ? String(data.Frequency).trim() : '';
    if (freqText) {
        var byText = (G_TLM_FreqList || []).find(function (f) {
            return String(f.Desp).trim().toLowerCase() === freqText.toLowerCase();
        });
        if (byText) return byText.Code;
    }
    return G_TLM_FreqList.length ? G_TLM_FreqList[0].Code : '';
}

function loadFreqList() {
    return TaskListMasterService.GetTaskListFreq()
        .then(function (res) {
            G_TLM_FreqList = normalizeFreqRows(firstArray(res));
            if (!G_TLM_FreqList.length && typeof toastr !== 'undefined') {
                toastr.warning('Frequency list is empty. Check API mode DDL_FREQUENCYMASTER on server.');
            }
            return G_TLM_FreqList;
        })
        .catch(function () {
            G_TLM_FreqList = [];
            if (typeof toastr !== 'undefined') toastr.error('Could not load frequency list.');
            return [];
        });
}

function buildFinYearOptions(currentFinYear, count) {
    var list = [];
    var parts = String(currentFinYear || getFinancialYear()).split('-');
    var start = parseInt(parts[0], 10);
    if (!isFinite(start)) start = new Date().getFullYear();
    var n = count || 10;
    for (var i = 0; i < n; i++) {
        var y = start - i;
        list.push(y + '-' + (y + 1));
    }
    return list;
}

function bindEmployeeDropdown(rows, selectedCode) {
    var $sel = $('#ddlEmployee');
    $sel.empty();
    $sel.append(new Option('-- Select Employee --', ''));
    $.each(rows || [], function (_, item) {
        var code = item.Code != null ? String(item.Code) : '';
        if (!code || code === '0') return;
        var label = (item.Desp || item.UserName || '').toString().trim();
        if (!label) label = 'User ' + code;
        $sel.append(new Option(label, code));
    });
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Select employee…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) $sel.trigger('change.select2');
}

function loadUserList(selectedCode) {
    return TaskListMasterService.GetTaskListEmployee()
        .then(function (res) {
            G_TLM_UserList = normalizeUserRows(firstArray(res));
            if (!G_TLM_UserList.length && typeof toastr !== 'undefined') {
                toastr.warning('Employee list is empty. Check API mode DDL_USERMASTER on server.');
            }
            bindEmployeeDropdown(G_TLM_UserList, selectedCode);
            return G_TLM_UserList;
        })
        .catch(function () {
            G_TLM_UserList = [];
            bindEmployeeDropdown([], selectedCode);
            if (typeof toastr !== 'undefined') toastr.error('Could not load employee list.');
            return [];
        });
}

function loadFinYearField() {
    var fallback = getFinancialYear();
    function applyFinYear(rows) {
        var rec = rows.length ? rows[0] : null;
        var fy = finYearOptionValue(rec);
        $('#txtFinYear').val(fy || fallback);
    }
    if (typeof TaskListMasterService.GetCurrentFinYear === 'function') {
        return TaskListMasterService.GetCurrentFinYear()
            .then(function (res) {
                var rows = firstArray(res);
                if (rows.length) {
                    applyFinYear(rows);
                    return;
                }
                return TaskListMasterService.GetFinyearList().then(function (res2) {
                    applyFinYear(firstArray(res2));
                });
            })
            .catch(function () {
                $('#txtFinYear').val(fallback);
            });
    }
    return TaskListMasterService.GetFinyearList()
        .then(function (res) {
            applyFinYear(firstArray(res));
        })
        .catch(function () {
            $('#txtFinYear').val(fallback);
        });
}

function initDetailLookups(selectedEmployeeCode, options) {
    var opts = options || {};
    var jobs = [loadFreqList(), loadUserList(selectedEmployeeCode || '')];
    if (!opts.skipFinYear) jobs.push(loadFinYearField());
    return Promise.all(jobs);
}

function finYearOptionValue(row) {
    if (row == null) return '';
    if (typeof row === 'string' || typeof row === 'number') return String(row).trim();
    return String(row.FinYear || row.Desp || row.Value || row.Name || '').trim();
}

function bindCopyFinYearDropdown() {
    var $sel = $('#ddlCopySourceFinYear');
    var current = ($('#txtFinYear').val() || getFinancialYear()).trim();
    $sel.empty();
    $sel.append(new Option('-- Select Fin Year --', ''));

    TaskListMasterService.GetFinyearList()
        .then(function (res) {
            var rows = firstArray(res);
            if (rows.length) {
                rows.forEach(function (row) {
                    var fy = finYearOptionValue(row);
                    if (!fy || fy === current) return;
                    $sel.append(new Option(fy, fy));
                });
                return;
            }
            buildFinYearOptions(current, 12).forEach(function (fy) {
                if (fy === current) return;
                $sel.append(new Option(fy, fy));
            });
        })
        .catch(function () {
            buildFinYearOptions(current, 12).forEach(function (fy) {
                if (fy === current) return;
                $sel.append(new Option(fy, fy));
            });
        });
}

function normalizeActiveFlag(val) {
    if (val == null || val === '') return 'Y';
    var s = String(val).trim().toUpperCase();
    if (s === 'N' || s === 'INACTIVE' || s === '0' || s === 'FALSE') return 'N';
    return 'Y';
}

function newTaskRow(data) {
    var d = data || {};
    var freqCode = resolveFreqCode(d);
    if ((freqCode == null || freqCode === '') && G_TLM_FreqList.length) {
        freqCode = G_TLM_FreqList[0].Code;
    }
    var dateVal =
        d.Date != null
            ? String(d.Date).substring(0, 10)
            : d.TaskDate != null
              ? String(d.TaskDate).substring(0, 10)
              : getTodayIso();
    return {
        Code: d.Code != null ? parseInt(d.Code, 10) || 0 : 0,
        Task: d.Task != null ? String(d.Task).trim() : d.TaskName != null ? String(d.TaskName).trim() : '',
        FrequencyMaster_Code: freqCode,
        Active: normalizeActiveFlag(d.Active != null ? d.Active : d.IsActive != null ? d.IsActive : d.Status),
        Date: dateVal,
    };
}

function isDailyFreq(freqCode) {
    return String(getFreqDesp(freqCode)).trim().toLowerCase() === 'daily';
}

function renderTaskGrid() {
    var $tbody = $('#tbodyTaskEntry');
    $tbody.empty();

    if (!G_TLM_TaskRows.length) {
        $tbody.html(
            '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No tasks added. Click <strong>Add Task</strong>.</td></tr>'
        );
        return;
    }

    G_TLM_TaskRows.forEach(function (row, idx) {
        var freqOpts = (G_TLM_FreqList || []).map(function (f) {
            var code = f.Code != null ? String(f.Code) : '';
            var sel = String(row.FrequencyMaster_Code) === code ? ' selected' : '';
            return '<option value="' + escapeHtml(code) + '"' + sel + '>' + escapeHtml(f.Desp || code) + '</option>';
        }).join('');

        var statusOpts = TLM_STATUS_OPTIONS.map(function (s) {
            var sel = s.value === row.Active ? ' selected' : '';
            return '<option value="' + s.value + '"' + sel + '>' + s.label + '</option>';
        }).join('');

        var dateDisabled = isDailyFreq(row.FrequencyMaster_Code) ? ' disabled' : '';
        var dateVal = row.Date || getTodayIso();

        var tr =
            '<tr data-row-idx="' +
            idx +
            '">' +
            '<td class="text-center"><span class="pm-sno">' +
            (idx + 1) +
            '</span></td>' +
            '<td><input type="text" class="tlm-task-name" maxlength="500" value="' +
            escapeHtml(row.Task) +
            '" placeholder="Enter task" /></td>' +
            '<td><select class="tlm-task-freq">' +
            freqOpts +
            '</select></td>' +
            '<td><select class="tlm-task-status">' +
            statusOpts +
            '</select></td>' +
            '<td><input type="date" class="tlm-task-date" value="' +
            escapeHtml(dateVal) +
            '"' +
            dateDisabled +
            ' /></td>' +
            '<td class="text-center"><button type="button" class="tlm-row-del tlm-btn-remove-row" title="Remove"><i class="fas fa-times"></i></button></td>' +
            '</tr>';

        $tbody.append(tr);
    });
}

function escapeHtml(val) {
    return String(val || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function syncTaskRowsFromDom() {
    var rows = [];
    $('#tbodyTaskEntry tr[data-row-idx]').each(function () {
        var $tr = $(this);
        var idx = parseInt($tr.attr('data-row-idx'), 10);
        var existing = G_TLM_TaskRows[idx] || newTaskRow();
        var freqCode = $tr.find('.tlm-task-freq').val() || resolveFreqCode(existing);
        rows.push({
            Code: existing.Code || 0,
            Task: ($tr.find('.tlm-task-name').val() || '').trim(),
            FrequencyMaster_Code: freqCode,
            Active: $tr.find('.tlm-task-status').val() || 'Y',
            Date: isDailyFreq(freqCode) ? '' : ($tr.find('.tlm-task-date').val() || '').trim(),
        });
    });
    G_TLM_TaskRows = rows;
}

function addTaskRow(data) {
    syncTaskRowsFromDom();
    G_TLM_TaskRows.push(newTaskRow(data));
    renderTaskGrid();
}

function clearForm() {
    $('#hfTaskListMaster_Code').val('0');
    $('#txtFinYear').val(getFinancialYear());
    try {
        if ($('#ddlEmployee').data('select2')) $('#ddlEmployee').val('').trigger('change.select2');
        else $('#ddlEmployee').val('');
    } catch (e) {
        $('#ddlEmployee').val('');
    }
    G_TLM_TaskRows = [];
    renderTaskGrid();
}

function setDetailFormMode(mode) {
    G_TLM_DetailMode = mode;
    var ro = mode === 'view';
    $('#tlmDetailPanel').toggleClass('tlm-readonly', ro);
    $('#ddlEmployee').prop('disabled', ro);
    try {
        if ($('#ddlEmployee').data('select2')) $('#ddlEmployee').prop('disabled', ro);
    } catch (e) {}
    $('#btnSaveTaskList, #btnClearTaskList, #btnAddTaskRow, #btnCopyFromFinYear').toggle(!ro);
}

function showListPanel() {
    $('#tlmListPanel').show();
    $('#tlmDetailPanel').hide();
    G_TLM_DetailMode = 'list';
    refreshTaskListGrid();
}

function showDetailPanel(mode) {
    $('#tlmListPanel').hide();
    $('#tlmDetailPanel').show();
    setDetailFormMode(mode);
}

function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="TLM_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="TLM_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="TLM_OpenDelete(' +
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
        if (rows[i] && typeof rows[i] === 'object') Object.keys(rows[i]).forEach(addKey);
    }
    return ordered;
}

function formatGridCellValue(key, val) {
    if (val == null || val === '') return '';
    if (key === 'Active' || key === 'IsActive' || key === 'Status') {
        var s = String(val).toUpperCase();
        if (s === 'Y' || s === 'ACTIVE') return 'Active';
        if (s === 'N' || s === 'INACTIVE') return 'Inactive';
    }
    if (key === 'FrequencyMaster_Code') {
        var freqLabel = getFreqDesp(val);
        if (freqLabel) return freqLabel;
    }
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return formatDate(val);
    return String(val);
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

function applyTaskListSearch(rows) {
    var q = ($('#tlmSearch').val() || '').toLowerCase().trim();
    var list = rows || [];
    if (!q) return list.slice();
    return list.filter(function (r) {
        for (var k in r) {
            if (Object.prototype.hasOwnProperty.call(r, k)) {
                var v = r[k];
                if (v != null && String(v).toLowerCase().indexOf(q) >= 0) return true;
            }
        }
        return false;
    });
}

function bindTaskListGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-TaskListMaster').empty();
        var colspan = G_TLM_ApiColumnKeys && G_TLM_ApiColumnKeys.length ? Math.max(6, G_TLM_ApiColumnKeys.length + 2) : 8;
        $('#table-body-TaskListMaster').html(
            '<tr><td colspan="' +
                colspan +
                '" style="text-align:center;padding:40px;color:#64748b;">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-TaskListMaster').empty();
        return;
    }

    var apiKeys = G_TLM_ApiColumnKeys && G_TLM_ApiColumnKeys.length ? G_TLM_ApiColumnKeys : mergeColumnKeysFromRows(rows);
    var sampleForFilters = G_TLM_SourceRows && G_TLM_SourceRows.length ? G_TLM_SourceRows : rows;
    var dataKeys = apiKeys.filter(function (k) {
        return k !== 'Code';
    });
    var hiddenColumns = TLM_GRID_HIDDEN_COLUMNS.slice();
    var StringFilterColumn = [];
    var NumericFilterColumn = [];
    dataKeys.forEach(function (key) {
        if (hiddenColumns.indexOf(key) >= 0) return;
        StringFilterColumn.push(key);
    });

    var mapped = rows.map(function (item, idx) {
        return mapApiRowToGridRow(item, idx, apiKeys);
    });

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-TaskListMaster',
        'table-body-TaskListMaster',
        mapped,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        [],
        [],
        hiddenColumns,
        { 'S.No.': 'center', Action: 'center', FinYear: 'center' },
        true,
        null,
        null
    );
}

function refreshTaskListGrid() {
    TaskListMasterService.GetTaskListMasterList()
        .then(function (res) {
            G_TLM_SourceRows = firstArray(res);
            G_TLM_ApiColumnKeys = mergeColumnKeysFromRows(G_TLM_SourceRows);
            bindTaskListGridData(applyTaskListSearch(G_TLM_SourceRows));
        })
        .catch(function () {
            G_TLM_SourceRows = [];
            G_TLM_ApiColumnKeys = null;
            bindTaskListGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load task list.');
        });
}

function applyRecordToForm(rec) {
    $('#hfTaskListMaster_Code').val(rec.Code != null ? rec.Code : 0);
    $('#txtFinYear').val(rec.FinYear != null ? rec.FinYear : getFinancialYear());
    var emp = rec.UserMaster_Code != null ? rec.UserMaster_Code : rec.EmployeeMaster_Code != null ? rec.EmployeeMaster_Code : '';
    return initDetailLookups(emp, { skipFinYear: true }).then(function () {
        G_TLM_TaskRows = [newTaskRow(rec)];
        renderTaskGrid();
    });
}

function loadEditRecord(code, mode) {
    return TaskListMasterService.GetTaskListMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            return applyRecordToForm(rec).then(function () {
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}

function validateTaskRows() {
    syncTaskRowsFromDom();
    if (!G_TLM_TaskRows.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Please add at least one task.');
        return false;
    }

    var seen = {};
    for (var i = 0; i < G_TLM_TaskRows.length; i++) {
        var row = G_TLM_TaskRows[i];
        var task = (row.Task || '').trim();
        if (!task) {
            if (typeof toastr !== 'undefined') toastr.warning('Task is required in row ' + (i + 1) + '.');
            return false;
        }
        var key = task.toLowerCase();
        if (seen[key]) {
            if (typeof toastr !== 'undefined') toastr.warning('Duplicate task "' + task + '" is not allowed.');
            return false;
        }
        seen[key] = true;

        if (row.FrequencyMaster_Code == null || row.FrequencyMaster_Code === '') {
            if (typeof toastr !== 'undefined') toastr.warning('Frequency is required in row ' + (i + 1) + '.');
            return false;
        }
        if (!isDailyFreq(row.FrequencyMaster_Code) && !row.Date) {
            if (typeof toastr !== 'undefined') toastr.warning('Date is required when frequency is not Daily (row ' + (i + 1) + ').');
            return false;
        }
    }
    return true;
}

function buildSavePayload(row) {
    var active = normalizeActiveFlag(row.Active);
    return {
        Code: row.Code || 0,
        UserId: authUserCode(),
        UserMaster_Code: parseInt($('#ddlEmployee').val() || '0', 10) || 0,
        FinYear: ($('#txtFinYear').val() || getFinancialYear()).trim(),
        Task: row.Task,
        FrequencyMaster_Code: parseInt(row.FrequencyMaster_Code, 10) || 0,
        Date: isDailyFreq(row.FrequencyMaster_Code) ? null : row.Date || null,
        Active: active,
        IsActive: active,
    };
}

function saveTaskRowsSequentially(rows, index) {
    if (index >= rows.length) {
        if (typeof toastr !== 'undefined') toastr.success('Saved successfully.');
        setTimeout(showListPanel, 900);
        return Promise.resolve();
    }

    return TaskListMasterService.SaveTaskListMaster(buildSavePayload(rows[index])).then(function (res) {
        var ok = res && (res.Status === 'Y' || res.status === 'Y');
        if (!ok) {
            if (typeof toastr !== 'undefined')
                toastr.error((res && (res.Msg || res.Message || res.message)) || 'Save failed at row ' + (index + 1) + '.');
            return Promise.reject(new Error('Save failed'));
        }
        return saveTaskRowsSequentially(rows, index + 1);
    });
}

function saveTaskList() {
    var currentCode = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    //var optionName = currentCode > 0 ? 'Edit' : 'New';

    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, optionName, 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }

        var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
        if (!emp) {
            if (typeof toastr !== 'undefined') toastr.warning('Please select an employee.');
            try {
                if ($('#ddlEmployee').data('select2')) $('#ddlEmployee').select2('open');
            } catch (e) {}
            return;
        }

        if (!validateTaskRows()) return;

        syncTaskRowsFromDom();
        saveTaskRowsSequentially(G_TLM_TaskRows.slice(), 0).catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Save request failed.');
        });
    /*});*/
}

function copyTasksFromFinYear() {
    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    if (!emp) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select an employee first.');
        return;
    }
    bindCopyFinYearDropdown();
    showModal('dvCopyFinYearModal');
}

function confirmCopyFromFinYear() {
    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    var sourceFinYear = ($('#ddlCopySourceFinYear').val() || '').trim();
    var targetFinYear = ($('#txtFinYear').val() || getFinancialYear()).trim();

    if (!sourceFinYear) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select source fin year.');
        return;
    }
    if (sourceFinYear === targetFinYear) {
        if (typeof toastr !== 'undefined') toastr.warning('Source and target fin year cannot be the same.');
        return;
    }

    TaskListMasterService.GetTaskListMasterList()
        .then(function (res) {
            hideModal('dvCopyFinYearModal');
            var tasks = firstArray(res).filter(function (row) {
                var rowEmp = row.UserMaster_Code != null ? row.UserMaster_Code : row.EmployeeMaster_Code;
                var rowFinYear = row.FinYear != null ? String(row.FinYear).trim() : '';
                return String(rowEmp) === String(emp) && rowFinYear === sourceFinYear;
            });

            if (!tasks.length) {
                if (typeof toastr !== 'undefined') toastr.warning('No tasks found in selected fin year.');
                return;
            }

            syncTaskRowsFromDom();
            var existingKeys = {};
            G_TLM_TaskRows.forEach(function (r) {
                existingKeys[(r.Task || '').trim().toLowerCase()] = true;
            });

            var added = 0;
            tasks.forEach(function (t) {
                var row = newTaskRow(t);
                row.Code = 0;
                var key = (row.Task || '').trim().toLowerCase();
                if (!key || existingKeys[key]) return;
                existingKeys[key] = true;
                G_TLM_TaskRows.push(row);
                added++;
            });
            renderTaskGrid();
            if (typeof toastr !== 'undefined')
                toastr.success(added + ' task(s) copied from ' + sourceFinYear + ' to ' + targetFinYear + '.');
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Copy request failed.');
        });
}

function TLM_OpenView(code) {
    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'View', 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
   /* });*/
}

function TLM_OpenEdit(code) {
    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'Edit', 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    /*});*/
}

function TLM_OpenDelete(code) {
    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'Delete', 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }
        $('#hfTaskListDeleteCode').val(code);
        $('#txtTaskListDeleteRemark').val('');
        showModal('dvTaskListDeleteModal');
        setTimeout(function () {
            $('#txtTaskListDeleteRemark').focus();
        }, 300);
    /*});*/
}

function confirmTaskListDelete() {
    var code = parseInt($('#hfTaskListDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#txtTaskListDeleteRemark').val() || '').trim();
    if (!code) {
        hideModal('dvTaskListDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#txtTaskListDeleteRemark').focus();
        return;
    }
    TaskListMasterService.DeleteTaskListMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvTaskListDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshTaskListGrid();
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
        $('#ERPHeading').text('Task List Master');
    }

    loadFreqList().then(function () {
        var params = BizSolHelperFunction.getUrlVars();
        var codeFromUrl = parseInt(params.Code || params.code || '0', 10);
        if (isFinite(codeFromUrl) && codeFromUrl > 0) {
            showDetailPanel('edit');
            clearForm();
            $('#hfTaskListMaster_Code').val(String(codeFromUrl));
            loadEditRecord(codeFromUrl, 'edit');
        } else {
            refreshTaskListGrid();
        }
    });

    $('#btnCreateTaskList').on('click', function () {
        //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'New', 'Y', getFinancialYear()).then(function (response) {
        //    if (!response || response.CheckModuleOptionRight === 'N') {
        //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
        //        return;
        //    }
            initDetailLookups('').then(function () {
                $('#hfTaskListMaster_Code').val('0');
                try {
                    if ($('#ddlEmployee').data('select2')) $('#ddlEmployee').val('').trigger('change.select2');
                    else $('#ddlEmployee').val('');
                } catch (e) {
                    $('#ddlEmployee').val('');
                }
                G_TLM_TaskRows = [newTaskRow()];
                renderTaskGrid();
                showDetailPanel('new');
            });
       /* });*/
    });

    $('#btnBackToTaskList').on('click', showListPanel);
    $('#btnClearTaskList').on('click', function () {
        var code = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
        var emp = $('#ddlEmployee').val() || '';
        clearForm();
        $('#hfTaskListMaster_Code').val(String(code));
        initDetailLookups(emp, code > 0 ? { skipFinYear: true } : {}).then(function () {
            G_TLM_TaskRows = [newTaskRow()];
            renderTaskGrid();
        });
    });
    $('#btnSaveTaskList').on('click', saveTaskList);
    $('#btnAddTaskRow').on('click', function () {
        addTaskRow();
    });
    $('#btnCopyFromFinYear').on('click', copyTasksFromFinYear);
    $('#btnConfirmCopyFinYear').on('click', confirmCopyFromFinYear);
    $('#btnTaskListConfirmDelete').on('click', confirmTaskListDelete);

    $(document).on('change', '.tlm-task-freq', function () {
        var $tr = $(this).closest('tr');
        var freq = $(this).val();
        var $date = $tr.find('.tlm-task-date');
        if (isDailyFreq(freq)) {
            if (!$date.val()) $date.val(getTodayIso());
            $date.prop('disabled', true);
        } else {
            if (!$date.val()) $date.val(getTodayIso());
            $date.prop('disabled', false);
        }
    });

    $(document).on('click', '.tlm-btn-remove-row', function () {
        if (G_TLM_DetailMode === 'view') return;
        syncTaskRowsFromDom();
        var idx = parseInt($(this).closest('tr').attr('data-row-idx'), 10);
        if (isFinite(idx)) G_TLM_TaskRows.splice(idx, 1);
        renderTaskGrid();
    });

    var searchTimer;
    $('#tlmSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindTaskListGridData(applyTaskListSearch(G_TLM_SourceRows));
        }, 200);
    });

});

window.TLM_OpenView = TLM_OpenView;
window.TLM_OpenEdit = TLM_OpenEdit;
window.TLM_OpenDelete = TLM_OpenDelete;
