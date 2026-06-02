import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { TaskListMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';
import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';

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

var TLM_WEEKDAYS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
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

function unwrapNestedRecordList(payload, listKeys, isRecord) {
    if (!payload || typeof payload !== 'object') return [];
    var i;
    for (i = 0; i < listKeys.length; i++) {
        var named = payload[listKeys[i]];
        if (Array.isArray(named) && named.length) return named;
        if (isRecord(named)) return [named];
    }
    var containerKeys = ['Data', 'data', 'Result', 'result', 'value', 'Value', 'Table', 'table'];
    for (i = 0; i < containerKeys.length; i++) {
        var nested = payload[containerKeys[i]];
        if (Array.isArray(nested) && nested.length) return nested;
        if (isRecord(nested)) return [nested];
    }
    if (isRecord(payload)) return [payload];
    return [];
}

function isUserRecord(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
    return (
        'UserName' in r ||
        'userName' in r ||
        'UserMaster_Code' in r ||
        'userMaster_Code' in r ||
        'EmployeeName' in r ||
        ('Code' in r && ('UserID' in r || 'LoginName' in r))
    );
}

function extractUserList(payload) {
    var list = firstArray(payload);
    if (list.length) return list;
    return unwrapNestedRecordList(
        payload,
        ['UserMasterList', 'userMasterList', 'UserList', 'userList', 'UserMasterData', 'userMasterData'],
        isUserRecord
    );
}

function isFreqMasterRow(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
    if (r.Task != null && String(r.Task).trim() !== '') return false;
    if (r.UserMaster_Code != null && r.EmployeeName != null) return false;
    return (
        'Frequency' in r ||
        'frequency' in r ||
        'Freq' in r ||
        'FrequencyMaster_Code' in r ||
        ('Desp' in r && r.FinYear == null) ||
        (r.Code != null && r.FinYear == null && r.Task == null)
    );
}

function filterFreqMasterRows(rows) {
    return (rows || []).filter(isFreqMasterRow);
}

function extractFreqList(payload) {
    var list = filterFreqMasterRows(firstArray(payload));
    if (list.length) return list;
    return filterFreqMasterRows(
        unwrapNestedRecordList(
            payload,
            [
                'FrequencyList',
                'frequencyList',
                'FrequencyMasterList',
                'frequencyMasterList',
                'FreqList',
                'freqList',
            ],
            isFreqMasterRow
        )
    );
}

function normalizeDropdownFreqRows(rows) {
    return (rows || [])
        .map(function (r) {
            var code = r.Code != null ? r.Code : r.code != null ? r.code : r.FrequencyMaster_Code;
            var text =
                r.Frequency ||
                r.frequency ||
                r.Desp ||
                r.Description ||
                r.description ||
                r.Freq ||
                '';
            if (code == null || code === '') return null;
            return { Code: code, Desp: String(text).trim() || String(code) };
        })
        .filter(function (r) {
            return r && r.Code != null && r.Code !== '' && String(r.Desp).trim() !== '';
        });
}

function mergeFreqNameAndCodeRows(nameRows, codeRows) {
    var names = firstArray(nameRows);
    var codes = firstArray(codeRows);
    var merged = [];
    var len = Math.max(names.length, codes.length);
    for (var i = 0; i < len; i++) {
        var nameRec = names[i] || {};
        var codeRec = codes[i] || {};
        var code = codeRec.Code != null ? codeRec.Code : codeRec.code;
        var text =
            nameRec.Frequency ||
            nameRec.frequency ||
            nameRec.Desp ||
            nameRec.Description ||
            nameRec.description ||
            '';
        if (code == null || code === '') continue;
        merged.push({ Code: code, Desp: String(text).trim() || String(code) });
    }
    return merged;
}

function loadFreqDropdownFallback() {
    return Promise.all([
        TaskListMasterService.GetFrequencyMasterDropdown(),
        TaskListMasterService.GetFrequencyMasterCodeDropdown(),
    ])
        .then(function (results) {
            var merged = mergeFreqNameAndCodeRows(results[0], results[1]);
            if (merged.length) return normalizeFreqRows(merged);
            return normalizeDropdownFreqRows(extractFreqList(results[0]).concat(firstArray(results[0])));
        })
        .catch(function () {
            return TaskListMasterService.GetFrequencyMasterDropdown().then(function (res) {
                return normalizeDropdownFreqRows(extractFreqList(res).concat(firstArray(res)));
            });
        });
}

function normalizeUserRows(rows) {
    return (rows || []).map(function (r) {
        var code =
            r.UserMaster_Code != null
                ? r.UserMaster_Code
                : r.userMaster_Code != null
                  ? r.userMaster_Code
                  : r.Code != null
                    ? r.Code
                    : r.code;
        var text =
            r.Desp ||
            r.EmployeeName ||
            r.UserName ||
            r.userName ||
            r.DisplayName ||
            r.PersonName ||
            r.Name ||
            r.LoginName ||
            r.UserID ||
            r.userID ||
            '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function loadUserMasterFallback() {
    return UserMasterService.GetUserMasterList().then(function (res) {
        return normalizeUserRows(extractUserList(res));
    });
}

function normalizeFreqRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.FrequencyMaster_Code != null ? r.FrequencyMaster_Code : r.code;
        var text = r.Desp || r.Frequency || r.Freq || r.Name || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function parseRowCode(row) {
    if (row == null) return 0;
    if (typeof row === 'number' || typeof row === 'string') return parseInt(row, 10) || 0;
    if (row.Code != null && row.Code !== '') return parseInt(row.Code, 10) || 0;
    if (row.code != null && row.code !== '') return parseInt(row.code, 10) || 0;
    return 0;
}

function getTaskRowExcludeCodes(rows) {
    var excludeCodes = {};
    var headerCode = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    if (headerCode) excludeCodes[headerCode] = true;
    (rows || []).forEach(function (row) {
        var code = parseRowCode(row);
        if (code) excludeCodes[code] = true;
    });
    return excludeCodes;
}

function parseApiSaveResult(res) {
    var root = firstRecord(res);
    if (!root || typeof root !== 'object') root = res || {};
    if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
        root = Object.assign({}, root, root.data);
    }
    var statusVal = root.Status != null ? root.Status : root.status;
    var msgVal = String(root.Msg || root.msg || root.Message || root.message || '').trim();
    var msgLower = msgVal.toLowerCase();
    var hasExplicitFailure =
        statusVal === 'N' ||
        statusVal === false ||
        msgLower.indexOf('already exists') >= 0 ||
        msgLower.indexOf('exists for this employee and fin year') >= 0 ||
        msgLower.indexOf('task already exists') >= 0 ||
        msgLower.indexOf('fail') >= 0 ||
        msgLower.indexOf('error') >= 0;
    var codeVal = parseRowCode(root);
    var inferredSuccess =
        statusVal === 'Y' ||
        statusVal === true ||
        codeVal > 0 ||
        msgLower.indexOf('save') >= 0 ||
        msgLower.indexOf('success') >= 0;
    return {
        ok: !hasExplicitFailure && inferredSuccess,
        msg: msgVal,
        code: codeVal,
    };
}

function getFreqDesp(freqCode) {
    var match = (G_TLM_FreqList || []).find(function (f) {
        return String(f.Code) === String(freqCode);
    });
    return match ? match.Desp : '';
}

/**
 * Decide which control the Date column must show for a given frequency:
 *   none    -> Daily (no date is sent)
 *   weekday -> Weekly (choose a day of the week)
 *   month   -> Monthly (month picker, only month is saved)
 *   day     -> Quarterly (date picker, only the day-of-month is saved)
 *   date    -> As and when required / anything else (full date)
 */
function getFreqDateMode(freqCode) {
    var s = String(getFreqDesp(freqCode) || '')
        .trim()
        .toLowerCase();
    if (!s) return 'date';
    if (s.indexOf('daily') >= 0) return 'none';
    if (s.indexOf('week') >= 0) return 'weekday';
    if (s.indexOf('month') >= 0) return 'month';
    if (s.indexOf('quarter') >= 0) return 'day';
    return 'date';
}

function buildTaskDateCell(mode, dateVal) {
    var raw = dateVal != null ? String(dateVal).substring(0, 10) : '';
    if (mode === 'none') {
        return '<input type="text" class="tlm-task-date" data-date-mode="none" value="" placeholder="—" disabled />';
    }
    if (mode === 'month') {
        var t = new Date();
        var daysInMonth = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
        var selDay = '';
        if (/^\d{1,2}$/.test(raw)) selDay = String(parseInt(raw, 10)).padStart(2, '0');
        else if (raw.length >= 10) selDay = raw.substring(8, 10);
        var dayOpts = '<option value="">-- Date --</option>';
        for (var dnum = 1; dnum <= daysInMonth; dnum++) {
            var dv = String(dnum).padStart(2, '0');
            dayOpts += '<option value="' + dv + '"' + (dv === selDay ? ' selected' : '') + '>' + dv + '</option>';
        }
        return '<select class="tlm-task-date" data-date-mode="month">' + dayOpts + '</select>';
    }
    if (mode === 'day') {
        var td = new Date();
        var daysInMonthD = new Date(td.getFullYear(), td.getMonth() + 1, 0).getDate();
        var selD = '';
        if (/^\d{1,2}$/.test(raw)) selD = String(parseInt(raw, 10)).padStart(2, '0');
        else if (raw.length >= 10) selD = raw.substring(8, 10);
        var dOpts = '<option value="">-- Date --</option>';
        for (var di = 1; di <= daysInMonthD; di++) {
            var dvv = String(di).padStart(2, '0');
            dOpts += '<option value="' + dvv + '"' + (dvv === selD ? ' selected' : '') + '>' + dvv + '</option>';
        }
        return '<select class="tlm-task-date" data-date-mode="day">' + dOpts + '</select>';
    }
    if (mode === 'weekday') {
        var dow = '';
        if (raw) {
            var byName = TLM_WEEKDAYS.find(function (x) {
                return x.label.toLowerCase() === raw.toLowerCase();
            });
            if (byName) {
                dow = byName.value;
            } else {
                var d = new Date(raw + 'T00:00:00');
                if (!isNaN(d.getTime())) dow = String(d.getDay());
            }
        }
        var opts =
            '<option value="">-- Day --</option>' +
            TLM_WEEKDAYS.map(function (w) {
                return (
                    '<option value="' +
                    w.value +
                    '"' +
                    (w.value === dow ? ' selected' : '') +
                    '>' +
                    w.label +
                    '</option>'
                );
            }).join('');
        return '<select class="tlm-task-date" data-date-mode="weekday">' + opts + '</select>';
    }
    var dateValue = raw || getTodayIso();
    return (
        '<input type="date" class="tlm-task-date" data-date-mode="date" value="' +
        escapeHtml(dateValue) +
        '" />'
    );
}

/** Read the effective DATE (YYYY-MM-DD) to store, based on the active control mode. */
function readTaskRowDate($tr) {
    var $date = $tr.find('.tlm-task-date');
    var mode = $date.attr('data-date-mode') || 'date';
    var raw = ($date.val() || '').trim();
    if (mode === 'none') return '';
    if (mode === 'month') {
        if (!raw) return '';
        return raw;
    }
    if (mode === 'day') {
        if (!raw) return '';
        return raw;
    }
    if (mode === 'weekday') {
        if (raw === '') return '';
        var w = TLM_WEEKDAYS.find(function (x) {
            return x.value === raw;
        });
        return w ? w.label : '';
    }
    return raw;
}

function applyTaskRowDateField($tr) {
    var $date = $tr.find('.tlm-task-date');
    var mode = $date.attr('data-date-mode') || 'date';
    $date.prop('disabled', G_TLM_DetailMode === 'view' || mode === 'none');
}

function rebuildRowDateCell($tr) {
    var freqCode = $tr.find('.tlm-task-freq').val() || '';
    var mode = getFreqDateMode(freqCode);
    var currentDate = readTaskRowDate($tr);
    $tr.find('.tlm-task-date')
        .closest('td')
        .html(buildTaskDateCell(mode, currentDate));
    applyTaskRowDateField($tr);
    updateDateColumnHeader();
}

/** Switch the "Date" column header to Day / Month / Date based on the rows' frequencies. */
function updateDateColumnHeader() {
    var modes = {};
    $('#tbodyTaskEntry .tlm-task-date').each(function () {
        var mode = $(this).attr('data-date-mode') || 'date';
        if (mode === 'none') return;
        modes[mode] = true;
    });
    var keys = Object.keys(modes);
    var label = 'Date';
    if (keys.length === 1) {
        if (keys[0] === 'weekday') label = 'Day';
        else if (keys[0] === 'month') label = 'Month';
        else label = 'Date';
    } else if (keys.length > 1) {
        label = 'Date / Day';
    }
    $('#thTaskDate').text(label);
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
    return '';
}

function refreshTaskGridIfDetailOpen() {
    if (!$('#tlmDetailPanel').is(':visible') || !G_TLM_TaskRows.length) return;
    syncTaskRowsFromDom();
    G_TLM_TaskRows = G_TLM_TaskRows.map(function (row) {
        return newTaskRow(row);
    });
    renderTaskGrid();
}

function applyFreqList(rows) {
    G_TLM_FreqList = normalizeFreqRows(filterFreqMasterRows(rows || []));
    refreshTaskGridIfDetailOpen();
    return G_TLM_FreqList;
}

function loadFreqList() {
    return TaskListMasterService.GetTaskListFreq()
        .then(function (res) {
            var rows = applyFreqList(extractFreqList(res));
            if (rows.length) return rows;
            return loadFreqDropdownFallback().then(function (fallbackRows) {
                if (fallbackRows.length) return applyFreqList(fallbackRows);
                if (typeof toastr !== 'undefined') {
                    toastr.warning('Frequency list is empty. Check API mode DDL_FREQUENCYMASTER on server.');
                }
                return applyFreqList([]);
            });
        })
        .catch(function () {
            return loadFreqDropdownFallback()
                .then(function (fallbackRows) {
                    return applyFreqList(fallbackRows);
                })
                .catch(function () {
                    applyFreqList([]);
                    if (typeof toastr !== 'undefined') toastr.error('Could not load frequency list.');
                    return [];
                });
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

function bindCopyEmployeeDropdown(rows, selectedCode) {
    var $sel = $('#ddlCopyEmployee');
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
        dropdownParent: $('#dvCopyFinYearModal'),
    });
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) $sel.trigger('change.select2');
}

function loadUserList(selectedCode) {
    function applyUserList(rows) {
        G_TLM_UserList = rows || [];
        bindEmployeeDropdown(G_TLM_UserList, selectedCode);
        return G_TLM_UserList;
    }

    return TaskListMasterService.GetTaskListEmployee()
        .then(function (res) {
            var rows = normalizeUserRows(extractUserList(res));
            if (rows.length) return applyUserList(rows);
            return loadUserMasterFallback().then(function (fallbackRows) {
                if (!fallbackRows.length && typeof toastr !== 'undefined') {
                    toastr.warning('Employee list is empty. Check API mode DDL_USERMASTER on server.');
                }
                return applyUserList(fallbackRows);
            });
        })
        .catch(function () {
            return loadUserMasterFallback()
                .then(function (fallbackRows) {
                    return applyUserList(fallbackRows);
                })
                .catch(function () {
                    applyUserList([]);
                    if (typeof toastr !== 'undefined') toastr.error('Could not load employee list.');
                    return [];
                });
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

function bindCopyFinYearDropdown(selectedEmployeeCode) {
    var $sel = $('#ddlCopySourceFinYear');
    var current = ($('#txtFinYear').val() || getFinancialYear()).trim();
    var selectedEmp = parseInt(selectedEmployeeCode || '0', 10) || 0;
    $sel.empty();
    $sel.append(new Option('-- Select Fin Year --', ''));

    var fyAdded = {};
    function addFinYearOption(fy) {
        var value = String(fy || '').trim();
        if (!value || fyAdded[value]) return;
        fyAdded[value] = true;
        $sel.append(new Option(value, value));
    }

    if (selectedEmp && (G_TLM_SourceRows || []).length) {
        (G_TLM_SourceRows || []).forEach(function (row) {
            var rowEmp = row.UserMaster_Code != null ? row.UserMaster_Code : row.EmployeeMaster_Code;
            if (String(rowEmp) !== String(selectedEmp)) return;
            addFinYearOption(finYearOptionValue(row));
        });
        if (Object.keys(fyAdded).length) return;
    }

    TaskListMasterService.GetFinyearList()
        .then(function (res) {
            var rows = firstArray(res);
            if (rows.length) {
                rows.forEach(function (row) {
                    addFinYearOption(finYearOptionValue(row));
                });
                // Keep API years, and append a rolling range so user can choose another source year.
                buildFinYearOptions(current, 12).forEach(function (fy) {
                    addFinYearOption(fy);
                });
                return;
            }
            buildFinYearOptions(current, 12).forEach(function (fy) {
                addFinYearOption(fy);
            });
        })
        .catch(function () {
            buildFinYearOptions(current, 12).forEach(function (fy) {
                addFinYearOption(fy);
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
    var dateVal =
        d.Date != null
            ? String(d.Date).substring(0, 10)
            : d.TaskDate != null
              ? String(d.TaskDate).substring(0, 10)
              : getTodayIso();
    return {
        Code: parseRowCode(d),
        Task: d.Task != null ? String(d.Task).trim() : d.TaskName != null ? String(d.TaskName).trim() : '',
        FrequencyMaster_Code: freqCode,
        Active: normalizeActiveFlag(d.Active != null ? d.Active : d.IsActive != null ? d.IsActive : d.Status),
        Date: dateVal,
    };
}

function renderTaskGrid() {
    var $tbody = $('#tbodyTaskEntry');
    $tbody.empty();

    if (!G_TLM_TaskRows.length) {
        $tbody.html(
            '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No tasks added. Click <strong>Add Task</strong>.</td></tr>'
        );
        updateDateColumnHeader();
        return;
    }

    G_TLM_TaskRows.forEach(function (row, idx) {
        var freqCode = row.FrequencyMaster_Code != null ? String(row.FrequencyMaster_Code) : '';
        var freqOpts =
            '<option value=""' +
            (!freqCode ? ' selected' : '') +
            '>-- Select frequency --</option>';
        freqOpts += (G_TLM_FreqList || [])
            .map(function (f) {
                var code = f.Code != null ? String(f.Code) : '';
                if (!code) return '';
                var sel = freqCode === code ? ' selected' : '';
                return (
                    '<option value="' +
                    escapeHtml(code) +
                    '"' +
                    sel +
                    '>' +
                    escapeHtml(f.Desp || code) +
                    '</option>'
                );
            })
            .join('');

        var statusOpts = TLM_STATUS_OPTIONS.map(function (s) {
            var sel = s.value === row.Active ? ' selected' : '';
            return '<option value="' + s.value + '"' + sel + '>' + s.label + '</option>';
        }).join('');

        var dateCellHtml = buildTaskDateCell(getFreqDateMode(freqCode), row.Date);

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
            '<td>' +
            dateCellHtml +
            '</td>' +
            '<td class="text-center"><button type="button" class="tlm-row-del tlm-btn-remove-row" title="Remove"><i class="fas fa-times"></i></button></td>' +
            '</tr>';

        $tbody.append(tr);
        applyTaskRowDateField($tbody.find('tr[data-row-idx="' + idx + '"]'));
    });

    updateDateColumnHeader();
}

function escapeHtml(val) {
    return String(val || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function normalizeTaskKey(task) {
    return String(task || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function getSavedTaskKeys(emp, finYear, excludeCodes) {
    var keys = {};
    var exclude = excludeCodes || {};
    (G_TLM_SourceRows || []).forEach(function (row) {
        var rowEmp = row.UserMaster_Code != null ? row.UserMaster_Code : row.EmployeeMaster_Code;
        var rowFinYear = row.FinYear != null ? String(row.FinYear).trim() : '';
        if (String(rowEmp) !== String(emp) || rowFinYear !== finYear) return;
        var code = parseRowCode(row);
        if (code && exclude[code]) return;
        var key = normalizeTaskKey(row.Task);
        if (key) keys[key] = String(row.Task || '').trim();
    });
    return keys;
}

function findDuplicateTaskInRows(rows) {
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
        var task = (rows[i].Task || '').trim();
        var key = normalizeTaskKey(task);
        if (!key) continue;
        if (seen[key]) {
            return { task: task, row: i + 1, firstRow: seen[key] };
        }
        seen[key] = i + 1;
    }
    return null;
}

function findDuplicateTaskAgainstSaved(rows, emp, finYear) {
    var excludeCodes = getTaskRowExcludeCodes(rows);
    var savedKeys = getSavedTaskKeys(emp, finYear, excludeCodes);
    for (var i = 0; i < rows.length; i++) {
        var task = (rows[i].Task || '').trim();
        var key = normalizeTaskKey(task);
        if (!key) continue;
        if (savedKeys[key]) {
            return { task: task, row: i + 1, existingTask: savedKeys[key] };
        }
    }
    return null;
}

function isBulkNewTaskSave() {
    syncTaskRowsFromDom();
    if (!G_TLM_TaskRows.length) return false;
    return G_TLM_TaskRows.every(function (row) {
        return !parseRowCode(row);
    });
}

function parseEmployeeFinYearExistsResult(res) {
    var rec = firstRecord(res);
    if (!rec || typeof rec !== 'object') rec = {};

    var list = firstArray(res);
    if (Array.isArray(list) && list.length && list[0] && typeof list[0] === 'object') {
        rec = Object.assign({}, list[0], rec);
    }

    var existsFlag = rec.RecordExists != null ? rec.RecordExists : rec.recordExists != null ? rec.recordExists : rec.Exists;
    if (
        existsFlag === 1 ||
        existsFlag === true ||
        String(existsFlag || '')
            .trim()
            .toLowerCase() === '1' ||
        String(existsFlag || '')
            .trim()
            .toLowerCase() === 'true' ||
        String(existsFlag || '')
            .trim()
            .toLowerCase() === 'y'
    ) {
        return true;
    }

    var countVal = rec.RecordCount != null ? rec.RecordCount : rec.recordCount != null ? rec.recordCount : rec.Count;
    if ((parseInt(countVal, 10) || 0) > 0) return true;

    var msg = String((res && (res.Msg || res.msg || res.Message || res.message)) || (rec && (rec.Msg || rec.msg || rec.Message || rec.message)) || '').toLowerCase();
    return msg.indexOf('already exists') >= 0 || msg.indexOf('exists') >= 0;
}

function checkEmployeeFinYearAlreadySaved(emp, finYear) {
    if (typeof TaskListMasterService.CheckEmployeeFinYearExists !== 'function') {
        return Promise.resolve(employeeFinYearExistsInSource(emp, finYear));
    }
    return TaskListMasterService.CheckEmployeeFinYearExists(emp, finYear)
        .then(function (res) {
            return parseEmployeeFinYearExistsResult(res);
        })
        .catch(function () {
            return employeeFinYearExistsInSource(emp, finYear);
        });
}

function employeeFinYearExistsInSource(emp, finYear) {
    var found = false;
    var targetFinYear = String(finYear || '').trim();
    (G_TLM_SourceRows || []).forEach(function (row) {
        var rowEmp =
            row.UserMaster_Code != null
                ? row.UserMaster_Code
                : row.UserMasterCode != null
                  ? row.UserMasterCode
                  : row.EmployeeMaster_Code != null
                    ? row.EmployeeMaster_Code
                    : row.EmployeeCode;
        var rowFinYear =
            row.FinYear != null
                ? String(row.FinYear).trim()
                : row.FinancialYear != null
                  ? String(row.FinancialYear).trim()
                  : '';
        if (String(rowEmp) === String(emp) && rowFinYear === targetFinYear) found = true;
    });
    return found;
}

function fetchTasksForEmployeeFinYear(emp, finYear) {
    function fallbackTasks() {
        return filterTasksFromSourceRows(emp, finYear);
    }
    if (typeof TaskListMasterService.GetTaskListByEmpFinYear === 'function') {
        return TaskListMasterService.GetTaskListByEmpFinYear(emp, finYear)
            .then(function (res) {
                var rows = firstArray(res);
                if (rows.length) return rows;
                // API can return success metadata without array; use cached list as fallback.
                return fallbackTasks();
            })
            .catch(function () {
                return fallbackTasks();
            });
    }
    return Promise.resolve(fallbackTasks());
}

function filterTasksFromSourceRows(emp, finYear) {
    var targetFinYear = String(finYear || '').trim();
    return (G_TLM_SourceRows || []).filter(function (row) {
        var rowEmp =
            row.UserMaster_Code != null
                ? row.UserMaster_Code
                : row.UserMasterCode != null
                  ? row.UserMasterCode
                  : row.EmployeeMaster_Code != null
                    ? row.EmployeeMaster_Code
                    : row.EmployeeCode;
        var rowFinYear =
            row.FinYear != null
                ? String(row.FinYear).trim()
                : row.FinancialYear != null
                  ? String(row.FinancialYear).trim()
                  : '';
        return String(rowEmp) === String(emp) && rowFinYear === targetFinYear;
    });
}

function warnDuplicateTaskInput($input) {
    if (G_TLM_DetailMode === 'view') return;
    var $tr = $input.closest('tr');
    var idx = parseInt($tr.attr('data-row-idx'), 10);
    if (!isFinite(idx)) return;

    syncTaskRowsFromDom();
    var task = ($input.val() || '').trim();
    var key = normalizeTaskKey(task);
    if (!key) {
        $input.removeClass('tlm-task-dup');
        return;
    }

    var dupInGrid = false;
    G_TLM_TaskRows.forEach(function (row, i) {
        if (i !== idx && normalizeTaskKey(row.Task) === key) dupInGrid = true;
    });

    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    var excludeCodes = getTaskRowExcludeCodes(G_TLM_TaskRows);
    var dupInDb = emp && getSavedTaskKeys(emp, finYear, excludeCodes)[key];

    $input.toggleClass('tlm-task-dup', dupInGrid || !!dupInDb);
    if (dupInGrid && typeof toastr !== 'undefined') {
        toastr.warning('Duplicate task "' + task + '" is not allowed.');
    } else if (dupInDb && typeof toastr !== 'undefined') {
        toastr.warning('Task "' + task + '" already exists for this employee and fin year.');
    }
}

function syncTaskRowsFromDom() {
    var rows = [];
    $('#tbodyTaskEntry tr').each(function (domIdx) {
        var $tr = $(this);
        if (!$tr.find('.tlm-task-name').length) return;
        var idxAttr = parseInt($tr.attr('data-row-idx'), 10);
        var idx = isFinite(idxAttr) ? idxAttr : domIdx;
        var existing = G_TLM_TaskRows[idx] || newTaskRow();
        var freqCode = $tr.find('.tlm-task-freq').val() || resolveFreqCode(existing);
        rows.push({
            Code: parseRowCode(existing),
            Task: ($tr.find('.tlm-task-name').val() || '').trim(),
            FrequencyMaster_Code: freqCode,
            Active: $tr.find('.tlm-task-status').val() || 'Y',
            Date: readTaskRowDate($tr),
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
    var code = item.Code != null ? Number(item.Code) : item.code != null ? Number(item.code) : 0;
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
    $('#hfTaskListMaster_Code').val(String(parseRowCode(rec)));
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

    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();

    var gridDup = findDuplicateTaskInRows(G_TLM_TaskRows);
    if (gridDup) {
        if (typeof toastr !== 'undefined') {
            toastr.warning(
                'Duplicate task "' +
                    gridDup.task +
                    '" in row ' +
                    gridDup.firstRow +
                    ' and row ' +
                    gridDup.row +
                    '.'
            );
        }
        return false;
    }

    if (emp) {
        var savedDup = findDuplicateTaskAgainstSaved(G_TLM_TaskRows, emp, finYear);
        if (savedDup) {
            if (typeof toastr !== 'undefined') {
                toastr.warning(
                    'Task "' + savedDup.task + '" already exists for this employee and fin year (row ' + savedDup.row + ').'
                );
            }
            return false;
        }
    }

    for (var i = 0; i < G_TLM_TaskRows.length; i++) {
        var row = G_TLM_TaskRows[i];
        var task = (row.Task || '').trim();
        if (!task) {
            if (typeof toastr !== 'undefined') toastr.warning('Task is required in row ' + (i + 1) + '.');
            return false;
        }

        if (row.FrequencyMaster_Code == null || row.FrequencyMaster_Code === '') {
            if (typeof toastr !== 'undefined') toastr.warning('Frequency is required in row ' + (i + 1) + '.');
            return false;
        }
        var dateMode = getFreqDateMode(row.FrequencyMaster_Code);
        if (dateMode !== 'none' && !row.Date) {
            var fieldLabel = dateMode === 'weekday' ? 'Day' : dateMode === 'month' ? 'Month' : 'Date';
            if (typeof toastr !== 'undefined') toastr.warning(fieldLabel + ' is required in row ' + (i + 1) + '.');
            return false;
        }
    }
    return true;
}

function buildSavePayload(row) {
    var active = normalizeActiveFlag(row.Active);
    return {
        Mode: 'SAVE',
        Code: parseRowCode(row),
        UserId: authUserCode(),
        UserMaster_Code: parseInt($('#ddlEmployee').val() || '0', 10) || 0,
        FinYear: ($('#txtFinYear').val() || getFinancialYear()).trim(),
        Task: (row.Task || '').trim(),
        FrequencyMaster_Code: parseInt(row.FrequencyMaster_Code, 10) || 0,
        Date: row.Date ? row.Date : ' ',
        Active: active,
        IsActive: active,
    };
}

function addSavedTaskToSourceRows(row, savedCode) {
    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    G_TLM_SourceRows.push({
        Code: savedCode || row.Code || 0,
        UserMaster_Code: emp,
        FinYear: finYear,
        Task: (row.Task || '').trim(),
    });
}

async function saveTaskRowsSequentially(rows, index) {
    var startIndex = parseInt(index || 0, 10) || 0;
    if (!Array.isArray(rows) || !rows.length || startIndex >= rows.length) {
        if (typeof toastr !== 'undefined') toastr.warning('No rows to save.');
        return;
    }

    for (var i = startIndex; i < rows.length; i++) {
        var row = rows[i];
        var payload = buildSavePayload(row);
        var res = await TaskListMasterService.SaveTaskListMaster(payload);
        var parsed = parseApiSaveResult(res);
        if (!parsed.ok) {
            var msg = parsed.msg || 'Save failed at row ' + (i + 1) + '.';
            if (typeof toastr !== 'undefined') toastr.error(msg);
            throw new Error(msg);
        }
        var savedCode = parsed.code || parseRowCode(row);
        row.Code = savedCode;
        addSavedTaskToSourceRows(row, savedCode);
    }

    if (typeof toastr !== 'undefined') toastr.success('Saved successfully.');
    setTimeout(showListPanel, 900);
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

        saveTaskListWithFreshData();
    /*});*/
}

function saveTaskListWithFreshData() {
    var emp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    var bulkNew = isBulkNewTaskSave();
    var headerCode = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    var isCreateModeSave = headerCode === 0 && G_TLM_DetailMode === 'new';

    function warnEmployeeFinYearExists() {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Data already exists for this employee and fin year (' + finYear + ').');
        }
    }

    return TaskListMasterService.GetTaskListMasterList()
        .then(function (res) {
            G_TLM_SourceRows = firstArray(res);
        })
        .catch(function () {
            /* keep existing list if refresh fails */
        })
        .then(function () {
            if (!validateTaskRows()) return;
            if (isCreateModeSave || bulkNew) {
                return Promise.resolve(checkEmployeeFinYearAlreadySaved(emp, finYear)).then(function (exists) {
                    if (exists) {
                        warnEmployeeFinYearExists();
                        return;
                    }
                    syncTaskRowsFromDom();
                    return saveTaskRowsSequentially(G_TLM_TaskRows.slice(), 0);
                });
            }
            if (!bulkNew) {
                syncTaskRowsFromDom();
                return saveTaskRowsSequentially(G_TLM_TaskRows.slice(), 0);
            }
        });
}

function copyTasksFromFinYear() {
    var headerEmp = parseInt($('#ddlEmployee').val() || '0', 10) || 0;
    loadUserList(headerEmp || '')
        .then(function () {
            bindCopyEmployeeDropdown(G_TLM_UserList, headerEmp || '');
            return TaskListMasterService.GetTaskListMasterList()
                .then(function (res) {
                    G_TLM_SourceRows = firstArray(res);
                })
                .catch(function () {
                    /* continue with existing cache */
                });
        })
        .then(function () {
            var selectedEmp = parseInt($('#ddlCopyEmployee').val() || '0', 10) || 0;
            bindCopyFinYearDropdown(selectedEmp);
            showModal('dvCopyFinYearModal');
        });
}

function confirmCopyFromFinYear() {
    var emp = parseInt($('#ddlCopyEmployee').val() || $('#ddlEmployee').val() || '0', 10) || 0;
    var sourceFinYear = ($('#ddlCopySourceFinYear').val() || '').trim();
    var targetFinYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    var isSameFinYear = sourceFinYear === targetFinYear;

    if (!emp) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select an employee first.');
        return;
    }
    if (!sourceFinYear) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select source fin year.');
        return;
    }

    try {
        if ($('#ddlEmployee').data('select2')) $('#ddlEmployee').val(String(emp)).trigger('change.select2');
        else $('#ddlEmployee').val(String(emp));
    } catch (e) {
        $('#ddlEmployee').val(String(emp));
    }

    Promise.resolve()
        .then(function () {
            return TaskListMasterService.GetTaskListMasterList()
                .then(function (res) {
                    G_TLM_SourceRows = firstArray(res);
                })
                .catch(function () {
                    /* continue with existing cache */
                });
        })
        .then(function () {
            if (isSameFinYear) return false;
            return employeeFinYearExistsInSource(emp, targetFinYear);
        })
        .then(function (targetExists) {
            if (targetExists) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning(
                        'Data already exists for this employee and fin year (' + targetFinYear + ').'
                    );
                }
                return null;
            }
            return fetchTasksForEmployeeFinYear(emp, sourceFinYear);
        })
        .then(function (tasks) {
            if (!tasks) return;
            hideModal('dvCopyFinYearModal');

            if (!tasks.length) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning('No tasks found for selected employee in fin year ' + sourceFinYear + '.');
                }
                return;
            }

            G_TLM_TaskRows = tasks.map(function (t) {
                var row = newTaskRow(t);
                row.Code = isSameFinYear ? parseRowCode(t) : 0;
                row.Date = getTodayIso();
                return row;
            });
            renderTaskGrid();
            if (typeof toastr !== 'undefined') {
                if (isSameFinYear) {
                    toastr.success(
                        G_TLM_TaskRows.length +
                            ' task(s) loaded for fin year ' +
                            sourceFinYear +
                            '. You can edit and save these tasks.'
                    );
                } else {
                    toastr.success(
                        G_TLM_TaskRows.length +
                            ' task(s) loaded from ' +
                            sourceFinYear +
                            '. Review and click Save for fin year ' +
                            targetFinYear +
                            '.'
                    );
                }
            }
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
    $('#ddlCopyEmployee').on('change', function () {
        var selectedEmp = parseInt($(this).val() || '0', 10) || 0;
        bindCopyFinYearDropdown(selectedEmp);
    });
    $('#btnTaskListConfirmDelete').on('click', confirmTaskListDelete);

    $(document).on('blur', '.tlm-task-name', function () {
        warnDuplicateTaskInput($(this));
    });

    $(document).on('change', '.tlm-task-freq', function () {
        if (G_TLM_DetailMode === 'view') return;
        rebuildRowDateCell($(this).closest('tr'));
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
