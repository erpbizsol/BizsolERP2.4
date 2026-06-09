import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { TaskListMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';
import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';

var G_TLM_SourceRows = [];
var G_TLM_TransactionRows = [];
var G_TLM_ApiColumnKeys = null;
var G_TLM_DetailMode = 'list';
var G_TLM_TaskRows = [];
var G_TLM_UserList = [];
var G_TLM_FreqList = [];
var G_TLM_PendingEditHeader = null;
var G_TLM_ActiveEmployeeCode = 0;
var G_TLM_SkipExistingTasksOnSave = false;

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

/** Period slots: period dropdown + calendar date per slot (stored as H1:yyyy-mm-dd|H2:...) */
var TLM_PERIOD_SLOTS = {
    quarter: { slots: ['Q1', 'Q2', 'Q3', 'Q4'] },
    halfyear: { slots: ['H1', 'H2'], labels: ['H1', 'H2'] },
    yearly: { slots: ['Y1'], labels: ['Year 1'] },
};

var TLM_GRID_HIDDEN_COLUMNS = [
    'Code',
    'TaskListMaster_Code',
    'TASKLISTMASTER_CODE',
    'UserMaster_Code',
    'TasksSummary',
    'TASKSSUMMARY',
    'FrequencyMaster_Code',
    'Task',
    'Frequency',
    'Date',
    'Active',
    'UserId',
    'CreatedBy',
    'UpdatedBy',
    'CreateDate',
    'UpdateDate',
    'Tasks',
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
 * Date column control by frequency:
 *   none       -> Daily, As and when required (no date)
 *   weekday    -> Weekly
 *   month      -> Monthly (days 1–31)
 *   quarter    -> Quarterly (Q1–Q4 + date per period)
 *   halfyear   -> Half-yearly (H1 / H2 + date per period)
 *   yearly     -> Yearly (Y1 + date)
 *   date       -> Other / full date
 */
function getFreqDateMode(freqCode) {
    var s = String(getFreqDesp(freqCode) || '')
        .trim()
        .toLowerCase();
    if (!s) return 'date';
    if (s.indexOf('daily') >= 0) return 'none';
    if (s.indexOf('as and when') >= 0 || s.indexOf('when required') >= 0) return 'none';
    if (s.indexOf('week') >= 0) return 'weekday';
    if (s.indexOf('quarter') >= 0) return 'date';
    if (s.indexOf('half') >= 0 && s.indexOf('year') >= 0) return 'date';
    if (s.indexOf('halfyear') >= 0 || s.indexOf('half yearly') >= 0) return 'date';
    if (s.indexOf('year') >= 0 && s.indexOf('quarter') < 0 && s.indexOf('month') < 0) return 'date';
    if (s.indexOf('month') >= 0) return 'month';
    return 'date';
}

function buildFixedDateOptions(count, labels, selectedVal) {
    var sel = String(selectedVal || '').trim();
    var opts = '<option value="">-- Date --</option>';
    for (var i = 0; i < count; i++) {
        var val = labels && labels[i] != null ? String(labels[i]) : String(i + 1);
        var label = labels && labels[i] != null ? String(labels[i]) : val;
        opts +=
            '<option value="' +
            escapeHtml(val) +
            '"' +
            (sel === val || sel === label ? ' selected' : '') +
            '>' +
            escapeHtml(label) +
            '</option>';
    }
    return opts;
}

function attrEncodeJson(obj) {
    return String(JSON.stringify(obj || {}))
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function attrDecodeJson(raw) {
    if (!raw) return {};
    try {
        return JSON.parse(
            String(raw)
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&')
        );
    } catch (e) {
        return {};
    }
}

function isIsoDate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').trim());
}

/** DB/API may send H1:2026-06 or Y1:2026-06-03 — normalize for period date picker (yyyy-mm-dd). */
function toBindableIsoDate(s) {
    var t = String(s || '').trim();
    if (!t) return '';
    if (isIsoDate(t)) return t;
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.substring(0, 10);
    if (/^\d{4}-\d{2}$/.test(t)) return t + '-01';
    return '';
}

function parsePeriodSlotPart(part) {
    var text = String(part || '').trim();
    var idx = text.indexOf(':');
    if (idx <= 0) return null;
    var slot = text.substring(0, idx).trim();
    var d = toBindableIsoDate(text.substring(idx + 1).trim());
    if (slot && d) return { slot: slot, date: d };
    return null;
}

function normalizePeriodDateMap(map) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) {
        if (map[k] && isIsoDate(map[k])) out[k] = map[k];
    });
    ['H1-1', 'H1-2', 'H1-3'].forEach(function (legacy) {
        if (out[legacy] && !out.H1) out.H1 = out[legacy];
        delete out[legacy];
    });
    ['H2-1', 'H2-2', 'H2-3'].forEach(function (legacy) {
        if (out[legacy] && !out.H2) out.H2 = out[legacy];
        delete out[legacy];
    });
    if (out['01'] && !out.Y1) {
        out.Y1 = out['01'];
        delete out['01'];
    }
    if (out['02'] && !out.Y1) {
        out.Y1 = out['02'];
        delete out['02'];
    }
    delete out.Y2;
    return out;
}

/** Parse DB value: Q1:2026-04-01|H1:2026-05-01 or legacy single slot / date */
function parsePeriodDateStorage(raw) {
    var map = {};
    var active = '';
    var text = String(raw || '').trim();
    if (!text) return { map: map, active: active };

    if (text.charAt(0) === '{') {
        try {
            var o = JSON.parse(text);
            Object.keys(o || {}).forEach(function (k) {
                if (o[k] && isIsoDate(o[k])) map[k] = o[k];
            });
        } catch (e) {}
        map = normalizePeriodDateMap(map);
        active = Object.keys(map)[0] || '';
        return { map: map, active: active };
    }

    if (text.indexOf('|') >= 0 || (text.indexOf(':') >= 0 && /^[QH][1-4]?$|^H[12]$|^Y1$/i.test(text.split(':')[0]))) {
        var parts = text.indexOf('|') >= 0 ? text.split('|') : [text];
        parts.forEach(function (part) {
            var parsed = parsePeriodSlotPart(part);
            if (parsed) {
                map[parsed.slot] = parsed.date;
                if (!active) active = parsed.slot;
            }
        });
        map = normalizePeriodDateMap(map);
        active = active || Object.keys(map)[0] || '';
        return { map: map, active: active };
    }

    if (isIsoDate(text)) {
        return { map: map, active: active };
    }

    if (/^Q[1-4]$|^H1$|^H2$|^H[12]-\d$|^Y1$|^0[12]$/.test(text)) {
        var legacyActive = text;
        if (/^H[12]-\d$/.test(text)) legacyActive = text.indexOf('H1') === 0 ? 'H1' : 'H2';
        if (text === '02') legacyActive = 'Y1';
        return { map: {}, active: legacyActive };
    }

    return { map: map, active: active };
}

function serializePeriodDateMap(map) {
    var parts = [];
    Object.keys(map || {}).forEach(function (slot) {
        if (map[slot] && isIsoDate(map[slot])) parts.push(slot + ':' + map[slot]);
    });
    return parts.join('|');
}

function getPeriodMapFromWrap($wrap) {
    return attrDecodeJson($wrap.attr('data-period-map'));
}

function setPeriodMapOnWrap($wrap, map) {
    $wrap.attr('data-period-map', attrEncodeJson(map || {}));
}

function syncPeriodPickerToWrap($wrap) {
    var slot = ($wrap.find('.tlm-period-slot').val() || '').trim();
    var pickerVal = ($wrap.find('.tlm-period-picker').val() || '').trim();
    if (!slot) return;
    var map = getPeriodMapFromWrap($wrap);
    if (pickerVal && isIsoDate(pickerVal)) map[slot] = pickerVal;
    else delete map[slot];
    setPeriodMapOnWrap($wrap, map);
}

function refreshPeriodSlotCheckmarks($wrap) {
    var map = getPeriodMapFromWrap($wrap);
    $wrap.find('.tlm-period-slot option').each(function () {
        var v = $(this).val();
        if (!v) return;
        var lbl = $(this).text().replace(/\s*✓\s*$/, '').trim();
        $(this).text(map[v] && isIsoDate(map[v]) ? lbl + ' ✓' : lbl);
    });
}

function loadPeriodSlotIntoPicker($wrap, slot) {
    syncPeriodPickerToWrap($wrap);
    var map = getPeriodMapFromWrap($wrap);
    var d = slot && map[slot] ? map[slot] : '';
    $wrap.find('.tlm-period-picker').val(d).prop('disabled', !slot || G_TLM_DetailMode === 'view');
    $wrap.find('.tlm-period-picker').attr('title', slot ? 'Select date for ' + slot : 'Select period first');
    refreshPeriodSlotCheckmarks($wrap);
}

function buildPeriodDateCell(mode, dateVal) {
    var cfg = TLM_PERIOD_SLOTS[mode];
    if (!cfg) return buildTaskDateCell('date', dateVal);

    var parsed = parsePeriodDateStorage(dateVal);
    var map = parsed.map || {};
    var slots = cfg.slots;
    var activeSlot = parsed.active && slots.indexOf(parsed.active) >= 0 ? parsed.active : slots[0];
    var labels = cfg.labels || slots;

    var slotOpts = '<option value="">-- Period --</option>';
    for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        var lbl = labels[i] != null ? labels[i] : s;
        var hasDate = map[s] ? ' ✓' : '';
        slotOpts +=
            '<option value="' +
            escapeHtml(s) +
            '"' +
            (s === activeSlot ? ' selected' : '') +
            '>' +
            escapeHtml(lbl + hasDate) +
            '</option>';
    }

    var pickerVal = map[activeSlot] || '';
    return (
        '<div class="tlm-period-date-wrap tlm-task-date-host" data-date-mode="' +
        escapeHtml(mode) +
        '" data-period-map="' +
        attrEncodeJson(map) +
        '">' +
        '<select class="tlm-period-slot" title="Select period">' +
        slotOpts +
        '</select>' +
        '<input type="date" class="tlm-period-picker" value="' +
        escapeHtml(pickerVal) +
        '" title="Select date for ' +
        escapeHtml(activeSlot) +
        '" />' +
        '</div>'
    );
}

function buildTaskDateCell(mode, dateVal) {
    var raw = dateVal != null ? String(dateVal).substring(0, 10) : '';
    if (mode === 'none') {
        return '<input type="text" class="tlm-task-date" data-date-mode="none" value="" placeholder="—" disabled />';
    }
    if (mode === 'month') {
        var selDay = '';
        if (/^\d{1,2}$/.test(raw)) selDay = String(parseInt(raw, 10)).padStart(2, '0');
        else if (raw.length >= 10) selDay = raw.substring(8, 10);
        var dayOpts = buildFixedDateOptions(
            31,
            null,
            selDay
        );
        return '<select class="tlm-task-date" data-date-mode="month">' + dayOpts + '</select>';
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
    // If value looks like a period-encoded string (e.g. "Q1:2026-04-01|Q2:..."), extract the first date
    var dateValue = raw;
    if (!isIsoDate(dateValue) && dateVal != null && String(dateVal).indexOf(':') >= 0) {
        var periodParsed = parsePeriodDateStorage(String(dateVal));
        var periodMap = periodParsed.map || {};
        var firstSlotDate = '';
        var slotKeys = Object.keys(periodMap);
        for (var pi = 0; pi < slotKeys.length; pi++) {
            if (isIsoDate(periodMap[slotKeys[pi]])) { firstSlotDate = periodMap[slotKeys[pi]]; break; }
        }
        dateValue = firstSlotDate || '';
    }
    dateValue = dateValue || getTodayIso();
    return (
        '<input type="date" class="tlm-task-date" data-date-mode="date" value="' +
        escapeHtml(dateValue) +
        '" />'
    );
}

/** Read the effective DATE value to store for the row. */
function readTaskRowDate($tr) {
    var $wrap = $tr.find('.tlm-period-date-wrap');
    if ($wrap.length) {
        syncPeriodPickerToWrap($wrap);
        return serializePeriodDateMap(getPeriodMapFromWrap($wrap));
    }

    var $date = $tr.find('.tlm-task-date');
    var mode = $date.attr('data-date-mode') || 'date';
    var raw = ($date.val() || '').trim();
    if (mode === 'none') return '';
    if (mode === 'month') {
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
    var ro = G_TLM_DetailMode === 'view';
    var $wrap = $tr.find('.tlm-period-date-wrap');
    if ($wrap.length) {
        $wrap.find('.tlm-period-slot, .tlm-period-picker').prop('disabled', ro);
        return;
    }
    var $date = $tr.find('.tlm-task-date');
    var mode = $date.attr('data-date-mode') || 'date';
    $date.prop('disabled', ro || mode === 'none');
}

function findTaskDateCellTd($tr) {
    var $host = $tr.find('.tlm-period-date-wrap, .tlm-task-date').first();
    if ($host.length) return $host.closest('td');
    return $tr.children('td').eq(4);
}

function rebuildRowDateCell($tr) {
    var freqCode = $tr.find('.tlm-task-freq').val() || '';
    var mode = getFreqDateMode(freqCode);
    var currentDate = readTaskRowDate($tr);
    findTaskDateCellTd($tr).html(buildTaskDateCell(mode, currentDate));
    applyTaskRowDateField($tr);
    updateDateColumnHeader();
}

function validatePeriodDatesForRow(dateMode, dateStr, rowNum) {
    var cfg = TLM_PERIOD_SLOTS[dateMode];
    if (!cfg) return true;
    var parsed = parsePeriodDateStorage(dateStr);
    var missing = (cfg.slots || []).filter(function (slot) {
        return !parsed.map[slot] || !isIsoDate(parsed.map[slot]);
    });
    if (!missing.length) return true;
    if (typeof toastr !== 'undefined') {
        toastr.warning(
            'Row ' +
                rowNum +
                ': Please select date for — ' +
                missing.join(', ')
        );
    }
    return false;
}

/** Switch the "Date" column header to Day / Month / Date based on the rows' frequencies. */
function updateDateColumnHeader() {
    var modes = {};
    $('#tbodyTaskEntry .tlm-task-date, #tbodyTaskEntry .tlm-period-date-wrap').each(function () {
        var mode = $(this).attr('data-date-mode') || 'date';
        if (mode === 'none') return;
        modes[mode] = true;
    });
    var keys = Object.keys(modes);
    var label = 'Date';
    if (keys.length === 1) {
        if (keys[0] === 'weekday') label = 'Day';
        else if (keys[0] === 'month') label = 'Month';
        else if (keys[0] === 'quarter' || keys[0] === 'halfyear' || keys[0] === 'yearly') label = 'Date';
        else label = 'Date';
    } else if (keys.length > 1) {
        label = 'Date / Day';
    }
    $('#thTaskDate').text(label);
}

function resolveFreqCode(data) {
    if (!data || typeof data !== 'object') return '';
    if (data.FrequencyMaster_Code != null && data.FrequencyMaster_Code !== '') {
        return data.FrequencyMaster_Code;
    }
    if (data.frequencyMaster_Code != null && data.frequencyMaster_Code !== '') {
        return data.frequencyMaster_Code;
    }
    if (data.FreqCode != null && data.FreqCode !== '') {
        return data.FreqCode;
    }
    var freqText =
        data.Freq != null
            ? String(data.Freq).trim()
            : data.Frequency != null
              ? String(data.Frequency).trim()
              : data.frequency != null
                ? String(data.frequency).trim()
                : '';
    if (freqText) {
        var byText = (G_TLM_FreqList || []).find(function (f) {
            return String(f.Desp).trim().toLowerCase() === freqText.toLowerCase();
        });
        if (byText) return byText.Code;
    }
    return '';
}

function normalizeApiTaskRow(r) {
    if (!r || typeof r !== 'object') return {};
    return Object.assign({}, r, {
        Code: r.Code != null && r.Code !== '' ? r.Code : r.code,
        TaskListMaster_Code:
            r.TaskListMaster_Code != null ? r.TaskListMaster_Code : r.taskListMaster_Code,
        UserMaster_Code:
            r.UserMaster_Code != null
                ? r.UserMaster_Code
                : r.userMaster_Code != null
                  ? r.userMaster_Code
                  : r.EmployeeMaster_Code,
        FinYear: r.FinYear != null ? r.FinYear : r.finYear,
        Task:
            r.Task != null
                ? String(r.Task).trim()
                : r.task != null
                  ? String(r.task).trim()
                  : r.TaskName != null
                    ? String(r.TaskName).trim()
                    : '',
        FrequencyMaster_Code:
            r.FrequencyMaster_Code != null && r.FrequencyMaster_Code !== ''
                ? r.FrequencyMaster_Code
                : r.frequencyMaster_Code != null && r.frequencyMaster_Code !== ''
                  ? r.frequencyMaster_Code
                  : r.FreqCode,
        Frequency: r.Frequency != null ? r.Frequency : r.frequency != null ? r.frequency : r.Freq,
        Active: r.Active != null ? r.Active : r.IsActive != null ? r.IsActive : r.isActive != null ? r.isActive : r.Status,
        Date: r.Date != null ? r.Date : r.date != null ? r.date : r.TaskDate,
    });
}

function isTaskTransactionRow(r) {
    if (!r || typeof r !== 'object') return false;
    var norm = normalizeApiTaskRow(r);
    if (!(norm.Task || '').trim()) return false;
    if (norm.TaskCount != null && norm.TasksSummary != null && !norm.FrequencyMaster_Code && !norm.Frequency) {
        return false;
    }
    return true;
}

function filterTransactionRows(rows, masterCode) {
    var id = parseInt(masterCode, 10) || 0;
    var list = id ? normalizeTaskRowsForMaster(rows, id) : (rows || []).map(normalizeApiTaskRow);
    return list.filter(function (r) {
        if (!isTaskTransactionRow(r)) return false;
        if (id && resolveMasterCodeFromRow(r) !== id) return false;
        return true;
    });
}

function resolveHeaderForMaster(masterCode) {
    var id = parseInt(masterCode, 10) || 0;
    if (!id) return null;
    var header = (G_TLM_SourceRows || []).find(function (r) {
        return resolveMasterCodeFromRow(r) === id;
    });
    return header ? normalizeApiTaskRow(header) : null;
}

function fetchTransactionsByEmpFinYear(header, masterCode) {
    if (!header || !header.UserMaster_Code || !header.FinYear) {
        return Promise.resolve([]);
    }
    return fetchTasksForEmployeeFinYear(header.UserMaster_Code, header.FinYear).then(function (rows) {
        return filterTransactionRows(rows, masterCode);
    });
}

function needsFullTaskList(header, rows) {
    if (!rows || !rows.length) return true;
    if (!header) return rows.length <= 1;

    var expected = parseInt(header.TaskCount, 10) || 0;
    if (expected > 0 && rows.length < expected) return true;

    if (header.TasksSummary) {
        var summaryCount = String(header.TasksSummary)
            .split(',')
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean).length;
        if (summaryCount > 1 && rows.length < summaryCount) return true;
    }

    return false;
}

function headerFromTransactionRow(row) {
    if (!row) return null;
    var norm = normalizeApiTaskRow(row);
    return {
        Code: resolveMasterCodeFromRow(norm),
        TaskListMaster_Code: resolveMasterCodeFromRow(norm),
        UserMaster_Code: norm.UserMaster_Code,
        EmployeeName: norm.EmployeeName,
        FinYear: norm.FinYear,
        TaskCount: norm.TaskCount,
        TasksSummary: norm.TasksSummary,
    };
}

function isMasterHeaderRow(r) {
    if (!r || typeof r !== 'object') return false;
    var norm = normalizeApiTaskRow(r);
    if ((norm.Task || '').trim()) return false;
    if (norm.FrequencyMaster_Code != null && norm.FrequencyMaster_Code !== '') return false;
    if (norm.TaskCount != null || norm.TasksSummary != null) return true;
    var master = resolveMasterCodeFromRow(norm) || parseRowCode(norm);
    return !!(master && norm.UserMaster_Code != null && norm.UserMaster_Code !== '' && (norm.FinYear || '').trim());
}

function collectAllArraysFromPayload(payload, depth) {
    var d = depth || 0;
    if (!payload || d > 5) return [];
    var out = [];

    if (Array.isArray(payload)) {
        if (payload.length && Array.isArray(payload[0])) {
            payload.forEach(function (chunk) {
                if (Array.isArray(chunk) && chunk.length) out.push(chunk);
            });
            return out;
        }
        if (payload.length && typeof payload[0] === 'object') out.push(payload);
        return out;
    }

    if (typeof payload !== 'object') return out;

    var namedKeys = [
        'Tables',
        'tables',
        'DataSets',
        'dataSets',
        'ResultSets',
        'resultSets',
        'Header',
        'header',
        'Master',
        'master',
        'TaskList',
        'taskList',
        'Tasks',
        'tasks',
        'TaskListTransaction',
        'taskListTransaction',
        'Details',
        'details',
        'Rows',
        'rows',
        'Data',
        'data',
    ];
    var i;
    for (i = 0; i < namedKeys.length; i++) {
        var named = payload[namedKeys[i]];
        if (Array.isArray(named) && named.length && typeof named[0] === 'object' && !Array.isArray(named[0])) {
            out.push(named);
        }
    }

    Object.keys(payload).forEach(function (k) {
        var v = payload[k];
        if (!Array.isArray(v) || !v.length) return;
        if (typeof v[0] === 'object' && !Array.isArray(v[0])) out.push(v);
        else if (Array.isArray(v[0])) {
            v.forEach(function (chunk) {
                if (Array.isArray(chunk) && chunk.length) out.push(chunk);
            });
        }
    });

    if (!out.length) {
        var flat = firstArray(payload);
        if (flat.length) out.push(flat);
    }
    return out;
}

/** When GETBYCODE detail set uses transaction Code in TaskListMaster_Code, attach real master id from header. */
function normalizeTaskRowsForMaster(rows, masterCode) {
    var id = parseInt(masterCode, 10) || 0;
    return (rows || []).map(function (r) {
        var norm = normalizeApiTaskRow(r);
        if (!(norm.Task || '').trim()) return norm;
        if (!id) return norm;

        var assoc = resolveMasterCodeFromRow(norm);
        if (assoc === id) return norm;

        var transCode = parseRowCode(norm);
        var aliasMaster = norm.TaskListMaster_Code != null ? parseInt(norm.TaskListMaster_Code, 10) || 0 : 0;
        if (aliasMaster && aliasMaster !== id) {
            return Object.assign({}, norm, {
                Code: transCode && transCode !== id ? transCode : aliasMaster,
                TaskListMaster_Code: id,
            });
        }
        if (!assoc || assoc !== id) {
            return Object.assign({}, norm, {
                Code: transCode && transCode !== id ? transCode : norm.Code,
                TaskListMaster_Code: id,
            });
        }
        return norm;
    });
}

function unwrapValuesArray(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
    return [];
}

function unwrapGetByCodeRoot(payload) {
    var p = payload;
    for (var i = 0; i < 6; i++) {
        if (!p || typeof p !== 'object') break;
        if (Array.isArray(p)) break;
        if (p.Header || p.header || p.Tasks || p.tasks) return p;
        if (p.data && typeof p.data === 'object') {
            p = p.data;
            continue;
        }
        if (p.Data && typeof p.Data === 'object') {
            p = p.Data;
            continue;
        }
        if (p.value && typeof p.value === 'object') {
            p = p.value;
            continue;
        }
        if (p.result && typeof p.result === 'object') {
            p = p.result;
            continue;
        }
        if (p.Result && typeof p.Result === 'object') {
            p = p.Result;
            continue;
        }
        break;
    }
    return p;
}

function parseGetByCodePayload(payload, masterCode) {
    var id = parseInt(masterCode, 10) || 0;
    payload = unwrapGetByCodeRoot(payload);
    var chunks = collectAllArraysFromPayload(payload, 0);
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        var hdrList = unwrapValuesArray(payload.Header || payload.header);
        var taskList = unwrapValuesArray(payload.Tasks || payload.tasks);
        if (hdrList.length || taskList.length) {
            chunks = [];
            if (hdrList.length) chunks.push(hdrList);
            if (taskList.length) chunks.push(taskList);
        }
    }
    var headers = [];
    var tasks = [];

    if (chunks.length >= 2) {
        chunks.forEach(function (chunk) {
            var rows = (chunk || []).map(normalizeApiTaskRow);
            rows.forEach(function (r) {
                if (isTaskTransactionRow(r)) tasks.push(r);
                else if (isMasterHeaderRow(r)) headers.push(r);
            });
        });
    } else {
        var flat = extractTaskListRows(payload);
        var allRows = flat.length ? flat : firstArray(payload);
        if (!allRows.length && chunks.length) {
            allRows = [];
            chunks.forEach(function (c) {
                allRows = allRows.concat(c);
            });
        }
        allRows = (allRows || []).map(normalizeApiTaskRow);
        headers = allRows.filter(isMasterHeaderRow);
        tasks = allRows.filter(isTaskTransactionRow);
        if (!tasks.length) tasks = filterTransactionRows(allRows, 0);
    }

    var header = headers.length ? headers[0] : null;
    if (!header) header = G_TLM_PendingEditHeader || resolveHeaderForMaster(id);
    if (!header && tasks.length) header = headerFromTransactionRow(tasks[0]);
    if (header) header = normalizeApiTaskRow(header);

    tasks = normalizeTaskRowsForMaster(tasks, id || (header ? resolveMasterCodeFromRow(header) : 0));
    if (id) tasks = filterTransactionRows(tasks, id);

    return { header: header, tasks: tasks };
}

function applyHeaderToForm(header, masterCode) {
    if (!header) return Promise.resolve();
    var norm = normalizeApiTaskRow(header);
    var master = parseInt(masterCode, 10) || resolveMasterCodeFromRow(norm) || parseRowCode(norm);
    $('#hfTaskListMaster_Code').val(String(master || 0));
    $('#txtFinYear').val(norm.FinYear != null ? norm.FinYear : getFinancialYear());
    var emp =
        norm.UserMaster_Code != null
            ? norm.UserMaster_Code
            : norm.EmployeeMaster_Code != null
              ? norm.EmployeeMaster_Code
              : '';
    return initDetailLookups(emp, { skipFinYear: true }).then(function () {
        bindEmployeeDropdown(G_TLM_UserList, emp, norm);
    });
}

/** Load header + tasks for edit (GETBYCODE returns { Header, Tasks }). */
function fetchEditPayloadForMaster(masterCode) {
    var id = parseInt(masterCode, 10) || 0;
    if (!id) return Promise.resolve({ header: null, tasks: [] });

    var header = G_TLM_PendingEditHeader || resolveHeaderForMaster(id);

    function loadByEmpFinYear() {
        var h = header || G_TLM_PendingEditHeader || resolveHeaderForMaster(id);
        return fetchTransactionsByEmpFinYear(h, id).then(function (rows) {
            return {
                header: h,
                tasks: rows,
            };
        });
    }

    function loadByCode() {
        if (typeof TaskListMasterService.GetTaskListMasterByCode !== 'function') {
            return loadByEmpFinYear();
        }
        return TaskListMasterService.GetTaskListMasterByCode(id)
            .then(function (res) {
                var parsed = parseGetByCodePayload(res, id);
                if (parsed.header) {
                    header = parsed.header;
                    G_TLM_PendingEditHeader = header;
                }
                if (!parsed.header && parsed.tasks.length) {
                    header = headerFromTransactionRow(parsed.tasks[0]);
                    G_TLM_PendingEditHeader = header;
                }
                if (parsed.tasks.length) return parsed;
                return loadByEmpFinYear();
            })
            .catch(function () {
                return loadByEmpFinYear();
            });
    }

    return loadByCode();
}

/** @deprecated use fetchEditPayloadForMaster */
function fetchTaskTransactionsForMaster(masterCode) {
    return fetchEditPayloadForMaster(masterCode).then(function (parsed) {
        return parsed.tasks || [];
    });
}

function extractTaskListRows(payload) {
    if (!payload) return [];

    if (Array.isArray(payload)) {
        if (payload.length && Array.isArray(payload[0])) {
            var merged = [];
            payload.forEach(function (chunk) {
                if (!Array.isArray(chunk)) return;
                (chunk || []).forEach(function (r) {
                    if (isTaskTransactionRow(r)) merged.push(r);
                });
            });
            if (merged.length) return merged;
        }
        return payload;
    }

    if (typeof payload === 'object') {
        if (isTaskTransactionRow(payload)) return [payload];
        if (payload.data && isTaskTransactionRow(payload.data)) return [payload.data];
        if (payload.Data && isTaskTransactionRow(payload.Data)) return [payload.Data];
    }

    var list = firstArray(payload);
    if (list.length) return list;
    return unwrapNestedRecordList(
        payload,
        [
            'TaskList',
            'taskList',
            'TaskListTransaction',
            'taskListTransaction',
            'Tasks',
            'tasks',
            'Rows',
            'rows',
            'Data',
            'data',
        ],
        function (r) {
            if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
            return (
                'Task' in r ||
                'task' in r ||
                'FrequencyMaster_Code' in r ||
                'frequencyMaster_Code' in r ||
                'TaskListMaster_Code' in r ||
                'taskListMaster_Code' in r
            );
        }
    );
}

function ensureSourceRowsLoaded() {
    if ((G_TLM_SourceRows || []).length) return Promise.resolve(G_TLM_SourceRows);
    return TaskListMasterService.GetTaskListMasterList()
        .then(function (res) {
            applyTaskListApiRows(firstArray(res));
            return G_TLM_SourceRows;
        })
        .catch(function () {
            G_TLM_SourceRows = [];
            G_TLM_TransactionRows = [];
            return [];
        });
}

function filterTasksFromSourceByCode(code) {
    var id = parseInt(code, 10) || 0;
    if (!id) return [];

    var rows = G_TLM_TransactionRows || [];
    var masterCode = 0;

    rows.forEach(function (r) {
        var rowMaster = resolveMasterCodeFromRow(r);
        var rowTrans = parseRowCode(r);
        if (rowMaster === id || rowTrans === id) {
            masterCode = rowMaster || id;
        }
    });

    if (!masterCode) masterCode = id;

    return rows.filter(function (r) {
        return resolveMasterCodeFromRow(r) === masterCode;
    });
}

/** One list row per employee + fin year (header), built from transaction lines. */
function consolidateListHeaders(transactions) {
    var map = {};
    (transactions || []).forEach(function (r) {
        var norm = normalizeApiTaskRow(r);
        var master = resolveMasterCodeFromRow(norm);
        if (!master) return;

        if (!map[master]) {
            map[master] = {
                Code: master,
                TaskListMaster_Code: master,
                UserMaster_Code: norm.UserMaster_Code,
                EmployeeName:
                    norm.EmployeeName != null
                        ? norm.EmployeeName
                        : norm.employeeName != null
                          ? norm.employeeName
                          : '',
                FinYear: norm.FinYear,
                TaskCount: 0,
                Tasks: [],
                CreateDate: norm.CreateDate,
                UpdateDate: norm.UpdateDate,
            };
        }

        map[master].TaskCount += 1;
        if (norm.Task) map[master].Tasks.push(String(norm.Task).trim());

        if (norm.CreateDate && (!map[master].CreateDate || norm.CreateDate < map[master].CreateDate)) {
            map[master].CreateDate = norm.CreateDate;
        }
        if (norm.UpdateDate && (!map[master].UpdateDate || norm.UpdateDate > map[master].UpdateDate)) {
            map[master].UpdateDate = norm.UpdateDate;
        }
    });

    return Object.keys(map)
        .map(function (k) {
            var h = map[k];
            h.TasksSummary = (h.Tasks || []).join(', ');
            return h;
        })
        .sort(function (a, b) {
            var fy = String(b.FinYear || '').localeCompare(String(a.FinYear || ''));
            if (fy !== 0) return fy;
            return String(a.EmployeeName || '').localeCompare(String(b.EmployeeName || ''));
        });
}

function applyTaskListApiRows(rawRows) {
    var rows = (rawRows || []).map(normalizeApiTaskRow);
    var headerLike =
        rows.length &&
        rows.every(function (r) {
            return (r.TaskCount != null || r.TasksSummary != null) && !r.Task && !r.Frequency;
        });

    if (headerLike) {
        G_TLM_TransactionRows = [];
        G_TLM_SourceRows = rows.map(function (r) {
            var master = resolveMasterCodeFromRow(r) || parseRowCode(r);
            return Object.assign({}, r, {
                Code: master,
                TaskListMaster_Code: master,
                TasksSummary:
                    r.TasksSummary != null
                        ? r.TasksSummary
                        : r.tasksSummary != null
                          ? r.tasksSummary
                          : '',
            });
        });
    } else {
        G_TLM_TransactionRows = rows.slice();
        G_TLM_SourceRows = consolidateListHeaders(rows);
    }

    G_TLM_ApiColumnKeys = mergeColumnKeysFromRows(G_TLM_SourceRows);
    return G_TLM_SourceRows;
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

function resolveEmployeeCodeFromLabel(label) {
    var text = String(label || '').trim();
    if (!text || text.indexOf('Select') >= 0) return 0;
    var found = (G_TLM_UserList || []).find(function (u) {
        var name = String(u.Desp || u.UserName || u.EmployeeName || '').trim();
        return name === text;
    });
    if (found && found.Code != null && found.Code !== '') return parseInt(found.Code, 10) || 0;
    return 0;
}

/** Read employee code from native select or Select2 (modal-safe). */
function getDropdownIntValue($sel) {
    if (!$sel || !$sel.length) return 0;
    var raw = $sel.val();
    if (Array.isArray(raw)) raw = raw.length ? raw[0] : '';
    var emp = parseInt(raw || '0', 10) || 0;
    if (emp) return emp;

    try {
        if ($sel.data('select2')) {
            var data = $sel.select2('data');
            var row = Array.isArray(data) ? data[0] : data;
            if (row) {
                emp = parseInt(row.id != null ? row.id : row.Code != null ? row.Code : row.code || '0', 10) || 0;
                if (emp) return emp;
                emp = resolveEmployeeCodeFromLabel(row.text || row.Desp || row.UserName);
                if (emp) return emp;
            }
        }
    } catch (e) {}

    emp = resolveEmployeeCodeFromLabel($sel.find('option:selected').text());
    if (emp) return emp;

    return 0;
}

function resolveEmployeeCodeForApi(emp) {
    var code = parseInt(emp, 10) || 0;
    if (code) return code;
    code = getCopyModalEmployeeCode();
    if (code) return code;
    code = getDetailEmployeeCode();
    if (code) return code;
    return parseInt(G_TLM_ActiveEmployeeCode, 10) || 0;
}

function getCopyModalEmployeeCode() {
    var emp = getDropdownIntValue($('#ddlCopyEmployee'));
    if (emp) return emp;
    var stored = parseInt($('#dvCopyFinYearModal').data('copyEmpCode') || '0', 10) || 0;
    if (stored) return stored;
    return getDetailEmployeeCode();
}

function getDetailEmployeeCode() {
    var emp = getDropdownIntValue($('#ddlEmployee'));
    if (emp) return emp;
    emp = getDropdownIntValue($('#ddlCopyEmployee'));
    if (emp) return emp;
    if (G_TLM_ActiveEmployeeCode) return parseInt(G_TLM_ActiveEmployeeCode, 10) || 0;
    var hdr = G_TLM_PendingEditHeader;
    if (hdr && hdr.UserMaster_Code != null) return parseInt(hdr.UserMaster_Code, 10) || 0;
    return 0;
}

function syncMainEmployeeDropdown(empCode, headerForLabel) {
    var code = parseInt(empCode, 10) || 0;
    if (!code) return Promise.resolve();
    G_TLM_ActiveEmployeeCode = code;
    var hdr = headerForLabel;
    if (!hdr) {
        var $opt = $('#ddlCopyEmployee option:selected');
        var copyVal = parseInt($opt.val() || '0', 10) || 0;
        if (copyVal === code && $opt.length) {
            hdr = { UserMaster_Code: code, EmployeeName: String($opt.text() || '').trim() };
        }
    }
    function applyBind() {
        bindEmployeeDropdown(G_TLM_UserList, code, hdr);
    }
    if ((G_TLM_UserList || []).length) {
        applyBind();
        return Promise.resolve();
    }
    return loadUserList(code).then(function () {
        applyBind();
    });
}

function bindEmployeeDropdown(rows, selectedCode, headerForLabel) {
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
    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    if (v && !$sel.find('option[value="' + v.replace(/"/g, '\\"') + '"]').length) {
        var hdr = headerForLabel || G_TLM_PendingEditHeader;
        var hdrLabel =
            hdr && (hdr.EmployeeName || hdr.Desp || hdr.UserName)
                ? String(hdr.EmployeeName || hdr.Desp || hdr.UserName).trim()
                : '';
        $sel.append(new Option(hdrLabel || 'Employee ' + v, v));
    }
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: 'Select employee…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
    $sel.val(v);
    if ($sel.data('select2')) $sel.trigger('change.select2');
    var appliedMain = getDropdownIntValue($sel);
    if (appliedMain) G_TLM_ActiveEmployeeCode = appliedMain;
    else if (v) G_TLM_ActiveEmployeeCode = parseInt(v, 10) || 0;
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
    if (v && !$sel.find('option[value="' + v.replace(/"/g, '\\"') + '"]').length) {
        $sel.append(new Option('Employee ' + v, v));
    }
    $sel.val(v);
    if ($sel.data('select2')) $sel.trigger('change.select2');
    var applied = getDropdownIntValue($sel);
    if (applied) G_TLM_ActiveEmployeeCode = applied;
    else if (v) G_TLM_ActiveEmployeeCode = parseInt(v, 10) || 0;
}

function loadUserList(selectedCode, options) {
    var opts = options || {};
    function applyUserList(rows) {
        G_TLM_UserList = rows || [];
        if (opts.bindMain !== false) {
            bindEmployeeDropdown(G_TLM_UserList, selectedCode);
        }
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

function normalizeTaskDateForBind(rawDate, dateMode) {
    var text = String(rawDate || '').trim();
    if (!text) return '';

    if (dateMode === 'quarter' || dateMode === 'halfyear' || dateMode === 'yearly') {
        if (text.indexOf('|') >= 0 || (text.indexOf(':') >= 0 && parsePeriodSlotPart(text))) {
            var map = {};
            var active = '';
            var parts = text.indexOf('|') >= 0 ? text.split('|') : [text];
            parts.forEach(function (part) {
                var parsed = parsePeriodSlotPart(part);
                if (parsed) {
                    map[parsed.slot] = parsed.date;
                    if (!active) active = parsed.slot;
                }
            });
            map = normalizePeriodDateMap(map);
            return serializePeriodDateMap(map) || text;
        }
        return text;
    }

    if (dateMode === 'date') {
        var iso = toBindableIsoDate(text);
        return iso || (text.length >= 10 ? text.substring(0, 10) : text);
    }

    return text;
}

function newTaskRow(data) {
    var d = normalizeApiTaskRow(data || {});
    var freqCode = resolveFreqCode(d);
    var dateMode = getFreqDateMode(freqCode);
    var rawDate =
        d.Date != null
            ? String(d.Date)
            : d.TaskDate != null
              ? String(d.TaskDate)
              : '';
    var dateVal = rawDate ? normalizeTaskDateForBind(rawDate, dateMode) : '';
    if (!dateVal) {
        if (dateMode === 'none') dateVal = '';
        else if (dateMode === 'date') dateVal = getTodayIso();
        else dateVal = '';
    }
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
    var editingMaster = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    var sourceRows = G_TLM_TransactionRows.length ? G_TLM_TransactionRows : G_TLM_SourceRows;

    sourceRows.forEach(function (row) {
        var rowEmp = row.UserMaster_Code != null ? row.UserMaster_Code : row.EmployeeMaster_Code;
        var rowFinYear = row.FinYear != null ? String(row.FinYear).trim() : '';
        if (String(rowEmp) !== String(emp) || rowFinYear !== finYear) return;
        if (editingMaster && resolveMasterCodeFromRow(row) === editingMaster) return;

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

function isTaskListEditSaveMode() {
    var headerCode = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    return headerCode > 0 && G_TLM_DetailMode === 'edit';
}

function shouldSkipExistingTasksOnSave() {
    return G_TLM_SkipExistingTasksOnSave || isTaskListEditSaveMode();
}

/** Copy/Edit: skip tasks already in DB; save only newly added rows. */
function getRowsToSaveForCurrentForm() {
    syncTaskRowsFromDom();
    var emp = getDetailEmployeeCode();
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    var isEditSave = isTaskListEditSaveMode();
    var excludeCodes = getTaskRowExcludeCodes(G_TLM_TaskRows);
    var savedKeys = emp ? getSavedTaskKeys(emp, finYear, excludeCodes) : {};

    return G_TLM_TaskRows.filter(function (row) {
        var task = (row.Task || '').trim();
        var key = normalizeTaskKey(task);
        if (!key) return false;

        if (isEditSave) {
            if (row._existingRow) return false;
            if (savedKeys[key]) return false;
            return true;
        }

        if (G_TLM_SkipExistingTasksOnSave) {
            if (row._fromCopy) return false;
            if (savedKeys[key]) return false;
            return true;
        }

        var transCode = parseRowCode(row);
        if (transCode > 0) return true;

        if (savedKeys[key]) return false;
        return true;
    });
}

function countSkippedExistingTasksOnSave() {
    syncTaskRowsFromDom();
    return Math.max(0, G_TLM_TaskRows.length - getRowsToSaveForCurrentForm().length);
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

/** Parse GETBYEMPFINYEAR — joined rows (Code, UserMaster_Code, EmployeeName, FinYear, Task, …). */
function parseEmpFinYearCopyPayload(res, emp) {
    var userCode = parseInt(emp, 10) || 0;
    var root = unwrapGetByCodeRoot(res);
    if (root && (root.Header || root.header || root.Tasks || root.tasks)) {
        var parsed = parseGetByCodePayload(res, 0);
        if (!parsed.header && parsed.tasks.length) {
            parsed.header = headerFromTransactionRow(parsed.tasks[0]);
        }
        if (parsed.header && userCode) {
            parsed.header.UserMaster_Code = parsed.header.UserMaster_Code || userCode;
        }
        return parsed;
    }

    var rows = extractTaskListRows(res);
    if (!rows.length) rows = firstArray(res);
    rows = (rows || []).map(normalizeApiTaskRow).filter(isTaskTransactionRow);
    if (!rows.length) return { header: null, tasks: [] };

    var masterCode = 0;
    rows.forEach(function (r) {
        var m = resolveMasterCodeFromRow(r);
        if (m && !masterCode) masterCode = m;
    });
    rows = normalizeTaskRowsForMaster(rows, masterCode);

    var first = rows[0];
    var header = {
        Code: masterCode,
        TaskListMaster_Code: masterCode,
        UserMaster_Code: userCode || first.UserMaster_Code,
        EmployeeName: first.EmployeeName,
        FinYear: first.FinYear,
    };
    return { header: header, tasks: rows };
}

function fetchEmpFinYearCopyData(emp, finYear) {
    var userCode = resolveEmployeeCodeForApi(emp);
    function fallbackPayload() {
        var rows = filterTasksFromSourceRows(userCode, finYear);
        if (!rows.length) return { header: null, tasks: [] };
        return parseEmpFinYearCopyPayload(rows, userCode);
    }
    if (!userCode) return Promise.resolve({ header: null, tasks: [] });
    if (typeof TaskListMasterService.GetTaskListByEmpFinYear !== 'function') {
        return Promise.resolve(fallbackPayload());
    }
    return TaskListMasterService.GetTaskListByEmpFinYear(userCode, finYear)
        .then(function (res) {
            var parsed = parseEmpFinYearCopyPayload(res, userCode);
            if (parsed.tasks.length) return parsed;
            return fallbackPayload();
        })
        .catch(function () {
            return fallbackPayload();
        });
}

function applyCopyFromFinYearToForm(parsed, targetFinYear, isSameFinYear) {
    if (!parsed || !parsed.tasks || !parsed.tasks.length) return Promise.resolve();

    var header = parsed.header || headerFromTransactionRow(parsed.tasks[0]);
    var emp = resolveEmployeeCodeForApi(header && header.UserMaster_Code);
    var masterCode = header ? resolveMasterCodeFromRow(header) || parseRowCode(header) : 0;
    var fy = (targetFinYear || getFinancialYear()).trim();

    return applyHeaderToForm(header, isSameFinYear ? masterCode : 0).then(function () {
        $('#hfTaskListMaster_Code').val(isSameFinYear ? String(masterCode || 0) : '0');
        $('#txtFinYear').val(fy);
        G_TLM_ActiveEmployeeCode = emp;
        G_TLM_SkipExistingTasksOnSave = true;
        G_TLM_TaskRows = parsed.tasks.map(function (t) {
            var row = newTaskRow(t);
            row.Code = isSameFinYear ? parseRowCode(t) : 0;
            row._fromCopy = true;
            return row;
        });
        renderTaskGrid();
        bindEmployeeDropdown(G_TLM_UserList, emp, header);
    });
}

function fetchTasksForEmployeeFinYear(emp, finYear) {
    return fetchEmpFinYearCopyData(emp, finYear).then(function (parsed) {
        return (parsed && parsed.tasks) || [];
    });
}

function filterTasksFromSourceRows(emp, finYear) {
    var targetFinYear = String(finYear || '').trim();
    var sourceRows = G_TLM_TransactionRows.length ? G_TLM_TransactionRows : G_TLM_SourceRows;
    return (sourceRows || []).filter(function (row) {
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
    G_TLM_ActiveEmployeeCode = 0;
    G_TLM_SkipExistingTasksOnSave = false;
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
    G_TLM_SkipExistingTasksOnSave = false;
    refreshTaskListGrid();
}

function showDetailPanel(mode) {
    $('#tlmListPanel').hide();
    $('#tlmDetailPanel').show();
    setDetailFormMode(mode);
}

function buildActionHtml(item) {
    var masterCode = resolveMasterCodeFromRow(item) || parseRowCode(item);
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="TLM_OpenView(' +
        masterCode +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="TLM_OpenEdit(' +
        masterCode +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="TLM_OpenDelete(' +
        masterCode +
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
    var masterCode = resolveMasterCodeFromRow(item) || parseRowCode(item);
    var row = {};
    row.Code = isFinite(masterCode) ? masterCode : 0;
    row['S.No.'] = idx + 1;
    apiKeysOrdered.forEach(function (key) {
        if (key === 'Code') return;
        row[key] = formatGridCellValue(key, item[key]);
    });
    if (item.TaskCount != null && row.TaskCount == null) row.TaskCount = item.TaskCount;
    if (item.TasksSummary != null && row.TasksSummary == null) row.TasksSummary = item.TasksSummary;
    row.Action = buildActionHtml(item);
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
            applyTaskListApiRows(firstArray(res));
            bindTaskListGridData(applyTaskListSearch(G_TLM_SourceRows));
        })
        .catch(function () {
            G_TLM_SourceRows = [];
            G_TLM_TransactionRows = [];
            G_TLM_ApiColumnKeys = null;
            bindTaskListGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load task list.');
        });
}

function resolveMasterCodeFromRow(rec) {
    if (!rec || typeof rec !== 'object') return 0;
    var master =
        rec.TaskListMaster_Code != null
            ? rec.TaskListMaster_Code
            : rec.taskListMaster_Code != null
              ? rec.taskListMaster_Code
              : 0;
    if (master) return parseInt(master, 10) || 0;
    return parseRowCode(rec);
}

function mergeTransactionsIntoCache(rows) {
    if (!rows || !rows.length) return;
    var master = resolveMasterCodeFromRow(rows[0]);
    if (!master) return;
    var normalized = rows.map(normalizeApiTaskRow);
    var kept = (G_TLM_TransactionRows || []).filter(function (r) {
        return resolveMasterCodeFromRow(r) !== master;
    });
    G_TLM_TransactionRows = kept.concat(normalized);
}

function applyRecordsToForm(rows, headerOverride) {
    var list = (rows || []).map(normalizeApiTaskRow);
    if (!list.length) return Promise.resolve();
    mergeTransactionsIntoCache(list);
    var header = headerOverride || G_TLM_PendingEditHeader;
    var first = list[0];
    var masterCode =
        resolveMasterCodeFromRow(first) ||
        (header ? resolveMasterCodeFromRow(header) : 0) ||
        parseInt($('#hfTaskListMaster_Code').val() || '0', 10) ||
        0;
    var emp =
        first.UserMaster_Code != null
            ? first.UserMaster_Code
            : first.EmployeeMaster_Code != null
              ? first.EmployeeMaster_Code
              : header && header.UserMaster_Code != null
                ? header.UserMaster_Code
                : '';
    var finYear =
        first.FinYear != null
            ? first.FinYear
            : header && header.FinYear != null
              ? header.FinYear
              : getFinancialYear();

    return applyHeaderToForm(
        header || { Code: masterCode, TaskListMaster_Code: masterCode, UserMaster_Code: emp, FinYear: finYear },
        masterCode
    ).then(function () {
        $('#hfTaskListMaster_Code').val(String(masterCode));
        $('#txtFinYear').val(finYear);
        G_TLM_TaskRows = list.map(function (r) {
            var row = newTaskRow(r);
            var transCode = parseRowCode(r);
            if (transCode) row.Code = transCode;
            row._existingRow = true;
            return row;
        });
        renderTaskGrid();
        bindEmployeeDropdown(G_TLM_UserList, emp, header);
    });
}

function loadEditRecord(code, mode) {
    var masterCode = parseInt(code, 10) || 0;
    if (!masterCode) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid record code.');
        return Promise.resolve();
    }

    if (!G_TLM_PendingEditHeader) {
        G_TLM_PendingEditHeader = resolveHeaderForMaster(masterCode);
    }

    return ensureSourceRowsLoaded()
        .then(function () {
            if (!G_TLM_PendingEditHeader) {
                G_TLM_PendingEditHeader = resolveHeaderForMaster(masterCode);
            }
            return fetchEditPayloadForMaster(masterCode);
        })
        .then(function (parsed) {
            parsed = parsed || { header: null, tasks: [] };
            var header =
                parsed.header || G_TLM_PendingEditHeader || resolveHeaderForMaster(masterCode);
            if (parsed.header) G_TLM_PendingEditHeader = parsed.header;

            if (!parsed.tasks.length) {
                if (header) {
                    return applyHeaderToForm(header, masterCode).then(function () {
                        G_TLM_TaskRows = [];
                        renderTaskGrid();
                        setDetailFormMode(mode || 'edit');
                        if (typeof toastr !== 'undefined') toastr.warning('No task lines found for this record.');
                    });
                }
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                clearForm();
                setDetailFormMode(mode || 'edit');
                return;
            }
            return applyRecordsToForm(parsed.tasks, header).then(function () {
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            var header = G_TLM_PendingEditHeader || resolveHeaderForMaster(masterCode);
            if (header) {
                return applyHeaderToForm(header, masterCode).then(function () {
                    if (typeof toastr !== 'undefined') toastr.warning('Could not load task lines from server.');
                    setDetailFormMode(mode || 'edit');
                });
            }
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
            clearForm();
        })
        .then(function () {
            G_TLM_PendingEditHeader = null;
        });
}

function validateTaskRows(rowsOptional) {
    syncTaskRowsFromDom();
    var rows = rowsOptional || G_TLM_TaskRows;
    if (!rows.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Please add at least one task to save.');
        return false;
    }

    var emp = getDetailEmployeeCode();
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();

    var gridDup = findDuplicateTaskInRows(rows);
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

    if (emp && !shouldSkipExistingTasksOnSave()) {
        var savedDup = findDuplicateTaskAgainstSaved(rows, emp, finYear);
        if (savedDup) {
            if (typeof toastr !== 'undefined') {
                toastr.warning(
                    'Task "' + savedDup.task + '" already exists for this employee and fin year (row ' + savedDup.row + ').'
                );
            }
            return false;
        }
    }

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var gridIdx = G_TLM_TaskRows.indexOf(row);
        var displayRow = gridIdx >= 0 ? gridIdx + 1 : i + 1;
        var task = (row.Task || '').trim();
        if (!task) {
            if (typeof toastr !== 'undefined') toastr.warning('Task is required in row ' + displayRow + '.');
            return false;
        }

        if (row.FrequencyMaster_Code == null || row.FrequencyMaster_Code === '') {
            if (typeof toastr !== 'undefined') toastr.warning('Frequency is required in row ' + displayRow + '.');
            return false;
        }
        var dateMode = getFreqDateMode(row.FrequencyMaster_Code);
        if (dateMode === 'quarter' || dateMode === 'halfyear' || dateMode === 'yearly') {
            if (!validatePeriodDatesForRow(dateMode, row.Date, displayRow)) return false;
        } else if (dateMode !== 'none' && !row.Date) {
            var fieldLabel =
                dateMode === 'weekday' ? 'Day' : dateMode === 'month' ? 'Date' : 'Date';
            if (typeof toastr !== 'undefined') toastr.warning(fieldLabel + ' is required in row ' + displayRow + '.');
            return false;
        }
    }
    return true;
}

function savePayloadDateValue(row) {
    if (!row || row.Date == null || row.Date === '') return '';
    return String(row.Date).trim();
}

function buildSavePayload(row) {
    var active = normalizeActiveFlag(row.Active);
    var transCode = parseRowCode(row);
    return {
        Mode: 'SAVE',
        Code: transCode,
        UserId: authUserCode(),
        UserMaster_Code: getDetailEmployeeCode(),
        FinYear: ($('#txtFinYear').val() || getFinancialYear()).trim(),
        Task: (row.Task || '').trim(),
        FrequencyMaster_Code: parseInt(row.FrequencyMaster_Code, 10) || 0,
        Date: savePayloadDateValue(row)||"",
        Active: active,
        IsActive: active,
    };
}

function addSavedTaskToSourceRows(row, savedCode) {
    var emp = getDetailEmployeeCode();
    var finYear = ($('#txtFinYear').val() || getFinancialYear()).trim();
    G_TLM_SourceRows.push({
        Code: savedCode || row.Code || 0,
        UserMaster_Code: emp,
        FinYear: finYear,
        Task: (row.Task || '').trim(),
    });
}

function isTaskAlreadyExistsSaveError(msg) {
    var m = String(msg || '').toLowerCase();
    return m.indexOf('already exists') >= 0 || m.indexOf('task already exists') >= 0;
}

async function saveTaskRowsSequentially(rows, index, skippedExistingCount) {
    var startIndex = parseInt(index || 0, 10) || 0;
    var skippedExisting = parseInt(skippedExistingCount, 10) || 0;
    if (!Array.isArray(rows) || !rows.length || startIndex >= rows.length) {
        if (typeof toastr !== 'undefined') toastr.warning('No rows to save.');
        return;
    }

    var savedCount = 0;
    for (var i = startIndex; i < rows.length; i++) {
        var row = rows[i];
        var payload = buildSavePayload(row);
        var res = await TaskListMasterService.SaveTaskListMaster(payload);
        var parsed = parseApiSaveResult(res);
        if (!parsed.ok) {
            if (shouldSkipExistingTasksOnSave() && isTaskAlreadyExistsSaveError(parsed.msg)) {
                continue;
            }
            var msg = parsed.msg || 'Save failed at row ' + (i + 1) + '.';
            if (typeof toastr !== 'undefined') toastr.error(msg);
            throw new Error(msg);
        }
        var savedCode = parsed.code || parseRowCode(row);
        row.Code = savedCode;
        addSavedTaskToSourceRows(row, savedCode);
        savedCount += 1;
    }

    G_TLM_SkipExistingTasksOnSave = false;

    if (typeof toastr !== 'undefined') {
        if (savedCount && skippedExisting) {
            toastr.success(
                savedCount + ' task(s) saved. ' + skippedExisting + ' existing task(s) skipped.'
            );
        } else if (savedCount) {
            toastr.success('Saved successfully.');
        } else if (skippedExisting) {
            toastr.warning('All tasks already exist for this employee and fin year. Nothing new to save.');
        }
    }
    if (savedCount) setTimeout(showListPanel, 900);
}

function saveTaskList() {
    var currentCode = parseInt($('#hfTaskListMaster_Code').val() || '0', 10) || 0;
    //var optionName = currentCode > 0 ? 'Edit' : 'New';

    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, optionName, 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }

        var emp = getDetailEmployeeCode();
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
    var emp = getDetailEmployeeCode();
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
            applyTaskListApiRows(firstArray(res));
        })
        .catch(function () {
            /* keep existing list if refresh fails */
        })
        .then(function () {
            syncTaskRowsFromDom();
            var rowsToSave = getRowsToSaveForCurrentForm();
            var skippedExisting = G_TLM_TaskRows.length - rowsToSave.length;

            if (!rowsToSave.length) {
                if (typeof toastr !== 'undefined') {
                    if (skippedExisting && isTaskListEditSaveMode()) {
                        toastr.warning('No new task to save. Use Add Task and enter a new task name.');
                    } else if (skippedExisting) {
                        toastr.warning(
                            'All tasks already exist for this employee and fin year. Add a new task to save.'
                        );
                    } else {
                        toastr.warning('Please add at least one task.');
                    }
                }
                return;
            }

            if (!validateTaskRows(rowsToSave)) return;

            if (shouldSkipExistingTasksOnSave()) {
                return saveTaskRowsSequentially(rowsToSave, 0, skippedExisting);
            }

            if (isCreateModeSave || bulkNew) {
                return Promise.resolve(checkEmployeeFinYearAlreadySaved(emp, finYear)).then(function (exists) {
                    if (exists) {
                        warnEmployeeFinYearExists();
                        return;
                    }
                    return saveTaskRowsSequentially(rowsToSave, 0, skippedExisting);
                });
            }
            return saveTaskRowsSequentially(rowsToSave, 0, skippedExisting);
        });
}

function copyTasksFromFinYear() {
    var headerEmp = resolveEmployeeCodeForApi(getDetailEmployeeCode());
    if (headerEmp) {
        G_TLM_ActiveEmployeeCode = headerEmp;
        $('#dvCopyFinYearModal').data('copyEmpCode', headerEmp);
    }
    loadUserList(headerEmp || '', { bindMain: false })
        .then(function () {
            bindCopyEmployeeDropdown(G_TLM_UserList, headerEmp || G_TLM_ActiveEmployeeCode || '');
            return TaskListMasterService.GetTaskListMasterList()
                .then(function (res) {
                    applyTaskListApiRows(firstArray(res));
                })
                .catch(function () {
                    /* continue with existing cache */
                });
        })
        .then(function () {
            var selectedEmp = getCopyModalEmployeeCode() || getDetailEmployeeCode();
            if (selectedEmp) G_TLM_ActiveEmployeeCode = selectedEmp;
            bindCopyFinYearDropdown(selectedEmp);
            showModal('dvCopyFinYearModal');
        });
}

function confirmCopyFromFinYear() {
    var emp = resolveEmployeeCodeForApi(getCopyModalEmployeeCode());
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

    G_TLM_ActiveEmployeeCode = emp;

    syncMainEmployeeDropdown(emp, null)
        .then(function () {
            return TaskListMasterService.GetTaskListMasterList()
                .then(function (res) {
                    applyTaskListApiRows(firstArray(res));
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
            return fetchEmpFinYearCopyData(emp, sourceFinYear);
        })
        .then(function (parsed) {
            if (!parsed) return;
            hideModal('dvCopyFinYearModal');

            if (!parsed.tasks || !parsed.tasks.length) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning('No tasks found for selected employee in fin year ' + sourceFinYear + '.');
                }
                return;
            }

            return applyCopyFromFinYearToForm(parsed, targetFinYear, isSameFinYear).then(function () {
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
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Copy request failed.');
        });
}

function openDetailForLoad(code, mode) {
    var masterCode = parseInt(code, 10) || 0;
    G_TLM_PendingEditHeader = resolveHeaderForMaster(masterCode);
    showDetailPanel(mode || 'edit');
    G_TLM_TaskRows = [];
    $('#hfTaskListMaster_Code').val(String(masterCode));
    $('#tbodyTaskEntry').html(
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">Loading record…</td></tr>'
    );
    return loadEditRecord(code, mode);
}

function TLM_OpenView(code) {
    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'View', 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }
        openDetailForLoad(code, 'view');
   /* });*/
}

function TLM_OpenEdit(code) {
    //MenuService.CheckModuleOptionRight(TLM_MODULE_NAME, 'Edit', 'Y', getFinancialYear()).then(function (response) {
    //    if (!response || response.CheckModuleOptionRight === 'N') {
    //        if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
    //        return;
    //    }
        openDetailForLoad(code, 'edit');
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
    var moduleDesp = decodeURI(BizSolHelperFunction.getUrlVars()['ModuleDesp'] || '');
    if (moduleDesp && moduleDesp !== 'undefined' && moduleDesp.trim() !== '') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    } else {
        $('#ERPHeading').text('Task List Master');
    }

    loadFreqList().then(function () {
        var params = BizSolHelperFunction.getUrlVars();
        var codeFromUrl = parseInt(params.Code || params.code || '0', 10);
        if (isFinite(codeFromUrl) && codeFromUrl > 0) {
            openDetailForLoad(codeFromUrl, 'edit');
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
    $('#ddlCopyEmployee').on('change select2:select', function () {
        var selectedEmp = getDropdownIntValue($('#ddlCopyEmployee'));
        if (selectedEmp) {
            G_TLM_ActiveEmployeeCode = selectedEmp;
            $('#dvCopyFinYearModal').data('copyEmpCode', selectedEmp);
        }
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

    $(document).on('change', '.tlm-period-slot', function () {
        if (G_TLM_DetailMode === 'view') return;
        var $wrap = $(this).closest('.tlm-period-date-wrap');
        loadPeriodSlotIntoPicker($wrap, $(this).val() || '');
    });

    $(document).on('change', '.tlm-period-picker', function () {
        if (G_TLM_DetailMode === 'view') return;
        var $wrap = $(this).closest('.tlm-period-date-wrap');
        syncPeriodPickerToWrap($wrap);
        refreshPeriodSlotCheckmarks($wrap);
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
