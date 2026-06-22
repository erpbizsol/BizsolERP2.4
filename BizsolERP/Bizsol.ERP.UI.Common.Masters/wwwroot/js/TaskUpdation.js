import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { TaskUpdationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TaskUpdationService.js';
import { TaskListMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';

var G_TU_BaseDate = new Date();          // the selected date being viewed
var G_TU_Rows = [];                      // flat rows returned by the API
var G_TU_Tasks = [];                     // pivoted: one entry per task with its day map
var G_TU_SelectedUserCode = 0;           // user whose tasks are shown (admin can change)

function authUserCode() {
    try {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function authUserName() {
    // Prefer the descriptive name from UserDetails, fall back to authKey.
    try {
        var details = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (Array.isArray(details) && details[0]) {
            var d = details[0];
            var n = d.EmployeeName || d.UserName || d.userName || d.DisplayName
                || d.PersonName || d.Name || d.Desp || d.LoginName || '';
            if (String(n).trim()) return String(n).trim();
        }
    } catch (e) { /* ignore */ }
    try {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserName || authKeyData.userName || '';
    } catch (e) {
        return '';
    }
}

/* Admin = UserDetails[0].UserType === 'A' (same convention used across the app). */
function isAdminUser() {
    try {
        var details = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        return Array.isArray(details) && details[0] && String(details[0].UserType || '').toUpperCase() === 'A';
    } catch (e) {
        return false;
    }
}

/* Map the raw employee API rows into { Code, Name }. */
function normalizeUserRows(rows) {
    return (rows || [])
        .map(function (r) {
            var code = r.UserMaster_Code != null ? r.UserMaster_Code
                : r.userMaster_Code != null ? r.userMaster_Code
                : r.Code != null ? r.Code : r.code;
            var name = r.Desp || r.EmployeeName || r.UserName || r.userName
                || r.DisplayName || r.PersonName || r.Name || r.LoginName || '';
            return { Code: parseInt(code, 10) || 0, Name: String(name).trim() };
        })
        .filter(function (r) {
            return r.Code > 0;
        });
}

function toIso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
}

function dateOnly(value) {
    return String(value || '').substring(0, 10);
}

function todayIso() {
    return toIso(new Date());
}

function isSunday(d) {
    return d.getDay() === 0;
}

/** Snap Sunday back to Saturday (Sunday is not a plan/report day). */
function nearestWorkingDay(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    while (isSunday(x)) {
        x.setDate(x.getDate() - 1);
    }
    return x;
}

/** Whether the user may tick a checkbox on this plan date. */
function canEditPlanDate(iso, serverEnabled) {
    if (!serverEnabled || isSunday(new Date(parseInt(iso.slice(0, 4), 10), parseInt(iso.slice(5, 7), 10) - 1, parseInt(iso.slice(8, 10), 10)))) {
        return false;
    }
    if (isAdminUser()) {
        return iso <= todayIso();
    }
    return iso === todayIso();
}

/** Non-admin users always view today; only admin may pick another plan date. */
function getViewDateIso() {
    if (isAdminUser()) {
        return toIso(G_TU_BaseDate);
    }
    return todayIso();
}

function initDatePickerControl() {
    var $picker = $('#tuDatePicker');
    $picker.attr('max', todayIso());

    if (isAdminUser()) {
        G_TU_BaseDate = nearestWorkingDay(G_TU_BaseDate);
        $picker.prop('disabled', false);
        $picker.val(toIso(G_TU_BaseDate));
        $picker.attr('title', 'Pick a plan date (Sunday excluded)');
        return;
    }

    var now = new Date();
    now.setHours(0, 0, 0, 0);
    G_TU_BaseDate = now;
    $picker.val(todayIso());
    $picker.prop('disabled', true);
    $picker.attr('title', 'Only admin can change the plan date');
}

function unwrapApiList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) {
        if (payload.length && Array.isArray(payload[0])) return payload[0];
        return payload;
    }
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    var nested = payload.Data || payload.data;
    if (nested && nested.$values && Array.isArray(nested.$values)) return nested.$values;
    var keys = ['Data', 'data', 'Result', 'result', 'value', 'Value', 'Table', 'table', 'Tasks', 'tasks', 'Rows', 'rows'];
    for (var i = 0; i < keys.length; i++) {
        if (payload[keys[i]] && Array.isArray(payload[keys[i]])) return payload[keys[i]];
    }
    return [];
}

function escapeHtml(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function isTrue(val) {
    var s = String(val == null ? '' : val).trim().toUpperCase();
    return s === 'Y' || s === '1' || s === 'TRUE';
}

/* Month boundaries that contain the supplied date (1st -> last day of that month). */
function monthRange(baseDate) {
    var start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    var end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0); // last day of the month
    return { start: start, end: end };
}

function eachDate(start, end) {
    var dates = [];
    var d = new Date(start.getTime());
    while (d <= end) {
        dates.push(new Date(d.getTime()));
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function periodLabel(range) {
    return (
        MONTH_SHORT[range.start.getMonth()] +
        '–' +
        MONTH_SHORT[range.end.getMonth()] +
        ' ' +
        range.end.getFullYear()
    );
}

/* Group the flat API rows into one object per task with a date->cell map. */
function pivotRows(rows) {
    var map = {};
    var order = [];
    (rows || []).forEach(function (r) {
        var code = r.TaskListMaster_Code != null ? r.TaskListMaster_Code : r.taskListMaster_Code;
        if (code == null) return;
        var key = String(code);
        if (!map[key]) {
            map[key] = {
                Code: parseInt(code, 10) || 0,
                Task: r.Task != null ? r.Task : r.task || '',
                Frequency: r.Frequency != null ? r.Frequency : r.frequency || '',
                FrequencyMaster_Code: r.FrequencyMaster_Code != null ? r.FrequencyMaster_Code : r.frequencyMaster_Code,
                cells: {},
            };
            order.push(key);
        }
        var iso = dateOnly(r.TaskDate != null ? r.TaskDate : r.taskDate);
        if (!iso) return;
        map[key].cells[iso] = {
            IsDone: isTrue(r.IsDone != null ? r.IsDone : r.isDone),
            IsEnabled: isTrue(r.IsEnabled != null ? r.IsEnabled : r.isEnabled) || (r.IsEnabled === 1 || r.isEnabled === 1),
            UpdationCode: r.UpdationCode != null ? r.UpdationCode : r.updationCode || 0,
        };
    });
    return order.map(function (k) {
        return map[k];
    });
}

/* Returns a frequency badge class based on the label text. */
function freqBadgeClass(freq) {
    var f = String(freq || '').toLowerCase();
    if (f.indexOf('daily') >= 0)   return 'daily';
    if (f.indexOf('week')  >= 0)   return 'weekly';
    if (f.indexOf('month') >= 0)   return 'monthly';
    return 'other';
}

/* Update the stats strip in the header. */
function updateStats(tasks, dateIso) {
    var total   = tasks.length;
    var done    = tasks.filter(function (t) { return t.cells[dateIso] && t.cells[dateIso].IsDone; }).length;
    var pending = total - done;
    var pct     = total > 0 ? Math.round((done / total) * 100) : 0;

    $('#tuStatTotal').text(total);
    $('#tuStatDone').text(done);
    $('#tuStatPending').text(pending);
    $('#tuProgressBar').css('width', pct + '%');
    $('#tuProgressPct').text(pct + '% done');
}

function renderCalendar() {
    var dates = [new Date(G_TU_BaseDate.getFullYear(), G_TU_BaseDate.getMonth(), G_TU_BaseDate.getDate())];
    var today = todayIso();

    var $head = $('#tuTableHead');
    var $body = $('#tuTableBody');

    /* Header: S.No | Task | Frequency | date columns */
    var monthRow = '<tr>' +
        '<th class="tu-col-sno" rowspan="2">#</th>' +
        '<th class="tu-col-task" rowspan="2"><i class="fas fa-list-check me-1"></i>Work To Do</th>' +
        '<th class="tu-col-freq" rowspan="2"><i class="fas fa-rotate me-1"></i>Frequency</th>';
    var dayRow = '<tr>';
    var curMonth = -1;
    var monthSpan = 0;
    var monthCells = [];

    dates.forEach(function (d) {
        if (d.getMonth() !== curMonth) {
            if (monthSpan > 0) monthCells.push({ label: MONTH_SHORT[curMonth], span: monthSpan });
            curMonth = d.getMonth();
            monthSpan = 0;
        }
        monthSpan++;
        var iso = toIso(d);
        var cls = 'tu-day-cell';
        var isToday = iso === today;
        if (d.getDay() === 0 || d.getDay() === 6) cls += ' tu-weekend';
        if (isToday) cls += ' tu-today tu-today-hdr';
        dayRow += '<th class="' + cls + '">' + d.getDate() + '</th>';
    });
    if (monthSpan > 0) monthCells.push({ label: MONTH_SHORT[curMonth], span: monthSpan });
    dayRow += '</tr>';

    monthCells.forEach(function (m) {
        monthRow += '<th colspan="' + m.span + '">' + m.label + '</th>';
    });
    monthRow += '</tr>';
    $head.html(monthRow + dayRow);

    if (!G_TU_Tasks.length) {
        var emptyMsg = isSunday(dates[0])
            ? 'No tasks on Sunday.'
            : 'No tasks assigned to you.';
        $body.html(
            '<tr><td class="tu-empty" colspan="' + (dates.length + 3) + '">' +
            '<i class="fas fa-inbox"></i>' + emptyMsg + '</td></tr>'
        );
        updateStats([], toIso(dates[0]));
        return;
    }

    var selectedIso = getViewDateIso();
    updateStats(G_TU_Tasks, selectedIso);

    var bodyHtml = '';
    G_TU_Tasks.forEach(function (task, idx) {
        var freqCls = freqBadgeClass(task.Frequency);
        bodyHtml += '<tr data-task-code="' + task.Code + '">';
        bodyHtml += '<td class="tu-col-sno"><div class="tu-sno-bubble">' + (idx + 1) + '</div></td>';
        bodyHtml += '<td class="tu-col-task"><div class="tu-task-inner"><span class="tu-task-bar"></span><span class="tu-task-name" title="' + escapeHtml(task.Task) + '">' + escapeHtml(task.Task) + '</span></div></td>';
        bodyHtml += '<td class="tu-col-freq"><span class="tu-freq-badge ' + freqCls + '">' + escapeHtml(task.Frequency) + '</span></td>';

        dates.forEach(function (d) {
            var iso = toIso(d);
            var cell = task.cells[iso] || {};
            var isPast = iso < today;
            // Server decides due/enabled by frequency; client applies role rules:
            // admin may update any past/current plan date; users only today.
            var serverEnabled = cell.IsEnabled != null ? cell.IsEnabled : !isPast;
            var enabled = canEditPlanDate(iso, serverEnabled);
            var done = !!cell.IsDone;

            var cls = 'tu-day-cell';
            if (d.getDay() === 0 || d.getDay() === 6) cls += ' tu-weekend';
            if (iso === today) cls += ' tu-today';
            if (isPast && !enabled) cls += ' tu-past';
            if (done) cls += ' tu-done';

            bodyHtml +=
                '<td class="' + cls + '">' +
                '<div class="tu-chk-wrap">' +
                '<input type="checkbox" class="tu-chk" data-date="' + iso + '"' +
                (done ? ' checked' : '') +
                (enabled ? '' : ' disabled') +
                ' />' +
                '</div>' +
                '</td>';
        });
        bodyHtml += '</tr>';
    });
    $body.html(bodyHtml);
}

function loadCalendar() {
    var userCode = G_TU_SelectedUserCode || authUserCode();
    if (!userCode) {
        $('#tuTableBody').html('<tr><td class="tu-empty">Unable to identify logged-in user.</td></tr>');
        return;
    }

    if (typeof ShowLoader === 'function') ShowLoader();

    return TaskUpdationService.GetTaskListByEmp(userCode, getViewDateIso())
        .then(function (res) {
            G_TU_Rows = unwrapApiList(res);
            G_TU_Tasks = pivotRows(G_TU_Rows);
            renderCalendar();
        })
        .catch(function () {
            G_TU_Rows = [];
            G_TU_Tasks = [];
            renderCalendar();
            if (typeof toastr !== 'undefined') toastr.error('Could not load task calendar.');
        })
        .finally(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

/* Populate the user dropdown (admins only) and show it in place of the name badge. */
function initUserDropdown() {
    var $sel = $('#tuUserSelect');
    return TaskListMasterService.GetTaskListEmployee()
        .then(function (res) {
            var rows = normalizeUserRows(unwrapApiList(res));
            $sel.empty();
            var selfCode = authUserCode();
            var hasSelf = false;
            rows.forEach(function (u) {
                if (u.Code === selfCode) hasSelf = true;
                $sel.append('<option value="' + u.Code + '">' + escapeHtml(u.Name || ('User #' + u.Code)) + '</option>');
            });
            if (!hasSelf && selfCode) {
                $sel.prepend('<option value="' + selfCode + '">' + escapeHtml(authUserName() || ('User #' + selfCode)) + '</option>');
            }
            $sel.val(String(selfCode));
            $sel.prop('disabled', false);   // admin can change
            $('#tuEmpName').hide();
            $sel.show();
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Could not load user list.');
        });
}

/* Normal (non-admin) user: no dropdown at all — only their own name is shown,
   so they can never switch to another user. Admin alone gets the selector. */
function initSelfLockedUser() {
    var $sel = $('#tuUserSelect');
    var selfCode = authUserCode();
    G_TU_SelectedUserCode = selfCode;
    $sel.empty();
    $sel.append('<option value="' + selfCode + '">' + escapeHtml(authUserName() || ('User #' + selfCode)) + '</option>');
    $sel.val(String(selfCode));
    $sel.prop('disabled', true);            // locked for normal users
    $sel.hide();                            // hidden so it can't be interacted with
    $('#tuEmpName').show();                 // show the read-only name badge instead
}

function onToggleStatus($chk) {
    var $tr = $chk.closest('tr');
    var taskCode = parseInt($tr.attr('data-task-code') || '0', 10) || 0;
    var date = $chk.attr('data-date');
    var isDone = $chk.is(':checked') ? 'Y' : 'N';
    var today = todayIso();

    if (!taskCode || !date) return;

    if (isSunday(new Date(parseInt(date.slice(0, 4), 10), parseInt(date.slice(5, 7), 10) - 1, parseInt(date.slice(8, 10), 10)))) {
        $chk.prop('checked', isDone !== 'Y');
        if (typeof toastr !== 'undefined') toastr.warning('Sunday is not included in the task report.');
        return;
    }

    if (!isAdminUser() && date !== today) {
        $chk.prop('checked', isDone !== 'Y');
        if (typeof toastr !== 'undefined') toastr.warning('You can only update today\'s tasks.');
        return;
    }

    if (isAdminUser() && date > today) {
        $chk.prop('checked', isDone !== 'Y');
        if (typeof toastr !== 'undefined') toastr.warning('Future dates cannot be updated.');
        return;
    }

    $chk.prop('disabled', true);
    TaskUpdationService.SaveTaskUpdation({
        Mode: 'SAVE',
        TaskListMaster_Code: taskCode,
        UserMaster_Code: G_TU_SelectedUserCode || authUserCode(),
        Date: date,
        IsDone: isDone,
    })
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y' || (res.Msg && /success/i.test(res.Msg)));
            if (ok) {
                $chk.closest('td').toggleClass('tu-done', isDone === 'Y');
                // Update the in-memory cell so stats recalculate correctly
                var task = G_TU_Tasks.find(function (t) { return t.Code === taskCode; });
                if (task) {
                    if (!task.cells[date]) task.cells[date] = {};
                    task.cells[date].IsDone = isDone === 'Y';
                }
                updateStats(G_TU_Tasks, date);
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Saved.');
            } else {
                $chk.prop('checked', isDone !== 'Y');
                if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.message)) || 'Save failed.');
            }
        })
        .catch(function () {
            $chk.prop('checked', isDone !== 'Y');
            if (typeof toastr !== 'undefined') toastr.error('Save request failed.');
        })
        .finally(function () {
            if (canEditPlanDate(date, true)) {
                $chk.prop('disabled', false);
            }
        });
}

$(document).ready(function () {
    var moduleDesp = decodeURI(BizSolHelperFunction.getUrlVars()['ModuleDesp'] || '');
    if (moduleDesp && moduleDesp !== 'undefined' && moduleDesp.trim() !== '') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    } else {
        $('#ERPHeading').text('Task Updation');
    }

    G_TU_SelectedUserCode = authUserCode();

    var name = authUserName();
    $('#tuEmpName').html('<i class="fas fa-user me-1"></i> ' + escapeHtml(name || ('User #' + authUserCode())));

    // Date picker: admin can change plan date; normal users locked to today.
    initDatePickerControl();

    // Admins can pick any user (dropdown enabled); normal users are locked to themselves.
    if (isAdminUser()) {
        initUserDropdown();
    } else {
        initSelfLockedUser();
    }

    loadCalendar();

    $('#tuDatePicker').on('change', function () {
        if (!isAdminUser()) {
            initDatePickerControl();
            return;
        }
        var val = $(this).val();
        if (!val) return;
        // Guard against any manually typed future date.
        if (val > todayIso()) {
            val = todayIso();
            $(this).val(val);
            if (typeof toastr !== 'undefined') toastr.warning('Future dates are not allowed.');
        }
        var parts = val.split('-');
        var picked = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (isSunday(picked)) {
            picked = nearestWorkingDay(picked);
            val = toIso(picked);
            $(this).val(val);
            if (typeof toastr !== 'undefined') toastr.warning('Sunday is not included in the task report.');
        }
        G_TU_BaseDate = picked;
        loadCalendar();
    });

    $('#tuUserSelect').on('change', function () {
        // Only admins may view/update another user's tasks; normal users stay on self.
        if (!isAdminUser()) {
            $(this).val(String(authUserCode()));
            G_TU_SelectedUserCode = authUserCode();
            return;
        }
        G_TU_SelectedUserCode = parseInt($(this).val() || '0', 10) || authUserCode();
        loadCalendar();
    });

    $(document).on('change', '.tu-chk', function () {
        onToggleStatus($(this));
    });
});
