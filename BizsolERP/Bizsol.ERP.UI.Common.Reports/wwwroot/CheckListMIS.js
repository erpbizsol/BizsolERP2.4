import { BizSolHelperFunction } from '../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CheckListMISService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/CheckListMISService.js';
import { TaskListMasterService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';
import { UserMasterService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';

/* ───────────────────────── config ───────────────────────── */
/** Must match F_ReportConfiguration.ModuleDescription used by GetReportType API. */
var CM_MODULE_DESCRIPTION_FOR_REPORT_CONFIG = 'Checklist MIS Report';

var CM_REPORT_TYPES_DEFAULT = [
    { code: 'GETMIS', label: 'Check List MIS Score', showChart: true },
    { code: 'GETDETAIL', label: 'Task Wise Detail', showChart: false },
];
var CM_REPORT_TYPES = CM_REPORT_TYPES_DEFAULT.slice();

/* ───────────────────────── state ───────────────────────── */
var G_CM_BaseDate = new Date();
var G_CM_Rows = [];
var G_CM_Filtered = [];
var G_CM_Page = 1;
var G_CM_PageSize = 10;
var G_CM_UserMap = {};
var G_CM_UserList = [];
var G_CM_ReportMode = 'GETMIS';

var DONUT_COLORS = [
    '#2563eb', '#7c3aed', '#0ea5e9', '#ef4444', '#f59e0b',
    '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#e11d48', '#06b6d4', '#a855f7',
];

var PDF_NAVY = '#16284d';
var PDF_HEADER_FILL = '#1b2c52';
var PDF_BORDER = '#c8d0dd';

/* ───────────────────────── helpers ───────────────────────── */
function toIso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
}

function escapeHtml(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function num(v) {
    var n = Number(v);
    return isNaN(n) ? 0 : n;
}

function pct(v) {
    if (v == null || v === '') return '<span class="cm-na">N/A</span>';
    var n = Number(v);
    if (isNaN(n)) return '<span class="cm-na">N/A</span>';
    return n.toFixed(2).replace(/\.00$/, '') + '%';
}

function ynBadge(val) {
    var y = String(val || 'N').toUpperCase() === 'Y';
    var cls = y ? 'color:#15803d;font-weight:700' : 'color:#b91c1c;font-weight:700';
    return '<span style="' + cls + '">' + (y ? 'Y' : 'N') + '</span>';
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
    var keys = ['Data', 'data', 'Result', 'result', 'value', 'Value', 'Table', 'table', 'Rows', 'rows'];
    for (var i = 0; i < keys.length; i++) {
        if (payload[keys[i]] && Array.isArray(payload[keys[i]])) return payload[keys[i]];
    }
    return [];
}

function prop(row, names) {
    if (!row) return null;
    for (var i = 0; i < names.length; i++) {
        if (row[names[i]] != null && row[names[i]] !== '') return row[names[i]];
    }
    var rowKeys = Object.keys(row);
    for (var j = 0; j < names.length; j++) {
        var want = names[j].toLowerCase();
        for (var k = 0; k < rowKeys.length; k++) {
            if (rowKeys[k].toLowerCase() === want && row[rowKeys[k]] != null && row[rowKeys[k]] !== '') {
                return row[rowKeys[k]];
            }
        }
    }
    return null;
}

function isUserRecord(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
    return (
        r.UserMaster_Code != null || r.userMaster_Code != null ||
        r.EmployeeName != null || r.UserName != null || r.userName != null ||
        (r.Code != null && r.Task == null && r.Frequency == null)
    );
}

function extractUserList(payload) {
    var list = unwrapApiList(payload);
    if (list.length) return list;
    if (!payload || typeof payload !== 'object') return [];
    var keys = ['UserMasterList', 'userMasterList', 'UserList', 'userList', 'UserMasterData', 'userMasterData'];
    for (var i = 0; i < keys.length; i++) {
        var nested = payload[keys[i]];
        if (Array.isArray(nested) && nested.length) return nested;
        if (nested && nested.$values && Array.isArray(nested.$values)) return nested.$values;
    }
    return [];
}

function normalizeUserRows(rows) {
    return (rows || []).map(function (r) {
        var code = prop(r, ['UserMaster_Code', 'userMaster_Code', 'Code', 'code']);
        var text = prop(r, [
            'Desp', 'EmployeeName', 'employeeName', 'UserName', 'userName',
            'DisplayName', 'PersonName', 'Name', 'LoginName', 'DoerName',
            'UserID', 'userID', 'Employee_Name', 'employee_Name',
        ]);
        var parsedCode = parseInt(code, 10) || 0;
        var desp = String(text || '').trim() || (parsedCode > 0 ? String(parsedCode) : '');
        return { Code: parsedCode, Desp: desp };
    }).filter(function (r) { return r.Code > 0 && r.Desp; });
}

function buildUserMap(rows) {
    var map = {};
    normalizeUserRows(rows).forEach(function (u) {
        if (u.Desp) map[u.Code] = u.Desp;
    });
    return map;
}

function sortUserList() {
    G_CM_UserList.sort(function (a, b) {
        return a.Desp.localeCompare(b.Desp);
    });
}

function upsertUserEntry(code, name) {
    var parsedCode = parseInt(code, 10) || 0;
    var desp = String(name || '').trim();
    if (!parsedCode || !desp) return;
    var found = false;
    for (var i = 0; i < G_CM_UserList.length; i++) {
        if (G_CM_UserList[i].Code === parsedCode) {
            G_CM_UserList[i].Desp = desp;
            found = true;
            break;
        }
    }
    if (!found) {
        G_CM_UserList.push({ Code: parsedCode, Desp: desp });
    }
    G_CM_UserMap[parsedCode] = desp;
}

function applyUserList(rows) {
    (rows || []).forEach(function (u) {
        upsertUserEntry(u.Code, u.Desp);
    });
    sortUserList();
    return G_CM_UserList;
}

function loadUserLookup() {
    return TaskListMasterService.GetTaskListEmployee()
        .then(function (res) {
            var rows = normalizeUserRows(extractUserList(res));
            if (rows.length) return applyUserList(rows);
            return UserMasterService.GetUserMasterList().then(function (res2) {
                return applyUserList(normalizeUserRows(extractUserList(res2)));
            });
        })
        .catch(function () {
            return UserMasterService.GetUserMasterList()
                .then(function (res2) {
                    return applyUserList(normalizeUserRows(extractUserList(res2)));
                })
                .catch(function () {
                    G_CM_UserList = [];
                    G_CM_UserMap = {};
                    return [];
                });
        });
}

function resolveDoerName(row) {
    var apiName = String(row.DoerName || '').trim();
    if (apiName) return apiName;
    var code = row.UserMaster_Code;
    if (code && G_CM_UserMap[code]) return G_CM_UserMap[code];
    return '';
}

function normalizeSummaryRow(r) {
    return {
        UserMaster_Code: num(prop(r, ['UserMaster_Code', 'userMaster_Code', 'Code', 'code'])),
        DoerName: String(prop(r, [
            'DoerName', 'doerName', 'EmployeeName', 'employeeName',
            'UserName', 'userName', 'Desp', 'desp', 'DisplayName', 'PersonName', 'Name',
        ]) || '').trim(),
        MISPeriod: String(prop(r, ['MISPeriod', 'misPeriod', 'Period', 'period']) || ''),
        WorkToBeAccomplished: num(prop(r, ['WorkToBeAccomplished', 'workToBeAccomplished'])),
        Accomplished: num(prop(r, ['Accomplished', 'accomplished'])),
        NotDoneOnTime: num(prop(r, ['NotDoneOnTime', 'notDoneOnTime'])),
        NotDonePctRaw: prop(r, ['NotDonePct', 'notDonePct']),
        NotDoneOnTimePctRaw: prop(r, ['NotDoneOnTimePct', 'notDoneOnTimePct']),
    };
}

function normalizeDetailRow(r) {
    var onTime = prop(r, ['OnTime', 'onTime', 'DoneOnTime', 'doneOnTime']);
    return {
        UserMaster_Code: num(prop(r, ['UserMaster_Code', 'userMaster_Code', 'Code', 'code'])),
        DoerName: String(prop(r, [
            'DoerName', 'doerName', 'EmployeeName', 'employeeName',
            'UserName', 'userName', 'Desp', 'desp', 'DisplayName', 'PersonName', 'Name',
        ]) || '').trim(),
        MISPeriod: String(prop(r, ['MISPeriod', 'misPeriod', 'Period', 'period']) || ''),
        Task: String(prop(r, ['Task', 'task']) || ''),
        DueDate: String(prop(r, ['DueDate', 'dueDate', 'Date', 'date']) || ''),
        Frequency: String(prop(r, ['Frequency', 'frequency']) || ''),
        IsDone: String(prop(r, ['IsDone', 'isDone']) || 'N').toUpperCase(),
        OnTime: onTime == null ? 'N' : (num(onTime) === 1 || String(onTime).toUpperCase() === 'Y' ? 'Y' : 'N'),
    };
}

function weekRange(baseDate) {
    var d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    var dow = d.getDay();
    var diffToMon = (dow + 6) % 7;
    var start = new Date(d);
    start.setDate(d.getDate() - diffToMon);
    var end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start, end: end };
}

function ddmmyyyy(d) {
    var day = String(d.getDate()).padStart(2, '0');
    var m = String(d.getMonth() + 1).padStart(2, '0');
    return day + '/' + m + '/' + d.getFullYear();
}

function periodLabelFor(baseDate) {
    var r = weekRange(baseDate);
    return ddmmyyyy(r.start) + ' - ' + ddmmyyyy(r.end);
}

function reportTypeLabel(row) {
    return String(
        prop(row, ['DisplayName', 'displayName', 'Desp', 'desp', 'FieldValue', 'fieldValue']) || ''
    ).trim();
}

/** Map F_ReportConfiguration row → USP_WebAPI_CheckListMIS @Mode (GETMIS / GETDETAIL). */
function reportTypeMode(row, label) {
    var explicit = prop(row, [
        'ReportMode', 'reportMode', 'Mode', 'mode',
        'ProcedureMode', 'StoredProcedureMode', 'SPMode',
    ]);
    if (explicit != null && String(explicit).trim() !== '') {
        var mode = String(explicit).trim().toUpperCase();
        if (/^GET/i.test(mode)) return mode;
    }
    var low = String(label || reportTypeLabel(row)).toLowerCase();
    if (low.indexOf('detail') >= 0 || low.indexOf('task wise') >= 0) return 'GETDETAIL';
    if (low) return 'GETMIS';
    return '';
}

function asReportTypeArray(response) {
    var list = unwrapApiList(response);
    if (list.length) return list;
    if (response == null || typeof response !== 'object') return [];
    var keys = ['items', 'Items', 'records', 'Records', 'List', 'list'];
    for (var i = 0; i < keys.length; i++) {
        if (Array.isArray(response[keys[i]]) && response[keys[i]].length) return response[keys[i]];
    }
    return [];
}

function showChartForMode(mode) {
    return String(mode || '').toUpperCase() === 'GETMIS';
}

function parseReportTypesFromApi(rows) {
    var parsed = [];
    (rows || []).forEach(function (row) {
        var label = reportTypeLabel(row);
        if (!label) return;
        var code = reportTypeMode(row, label);
        if (!code) return;
        parsed.push({ code: code, label: label, showChart: showChartForMode(code) });
    });
    return parsed;
}

function moduleDescriptionForReportConfig() {
    var fromUrl = decodeURI(BizSolHelperFunction.getUrlVars()['ModuleDesp'] || '');
    if (fromUrl && fromUrl !== 'undefined' && String(fromUrl).trim() !== '') {
        return String(fromUrl).trim();
    }
    var heading = String($('#ERPHeading').text() || '').trim();
    if (heading && heading !== 'undefined') return heading;
    return CM_MODULE_DESCRIPTION_FOR_REPORT_CONFIG;
}

function currentReportType() {
    return CM_REPORT_TYPES.find(function (t) { return t.code === G_CM_ReportMode; }) || CM_REPORT_TYPES[0];
}

function isSummaryMode() {
    return G_CM_ReportMode === 'GETMIS';
}

function colCount() {
    return isSummaryMode() ? 7 : 8;
}

function destroyCmSelect2($el) {
    if ($el && $el.length && $el.hasClass('select2-hidden-accessible')) {
        $el.select2('destroy');
    }
}

function initCmSelect2(selector, placeholder) {
    var $el = $(selector);
    if (!$el.length || typeof $.fn.select2 === 'undefined') return;
    destroyCmSelect2($el);
    $el.select2({
        width: 'style',
        placeholder: placeholder || 'Select…',
        minimumResultsForSearch: 0,
        dropdownParent: $('#CheckListMISPage'),
    });
}

function bindReportTypeDropdown() {
    var $rt = $('#cmReportType');
    var selected = $rt.val() || G_CM_ReportMode;
    var types = CM_REPORT_TYPES.length ? CM_REPORT_TYPES : CM_REPORT_TYPES_DEFAULT;
    $rt.empty();
    if (!types.length) {
        $rt.append($('<option/>').attr('value', '').text('-- No report types --'));
    } else {
        types.forEach(function (t) {
            $rt.append($('<option/>').attr('value', t.code).text(t.label));
        });
    }
    if (selected && $rt.find('option[value="' + String(selected) + '"]').length) {
        $rt.val(selected);
    } else if (types.length) {
        $rt.val(types[0].code);
    }
    G_CM_ReportMode = $rt.val() || (types[0] && types[0].code) || 'GETMIS';
    destroyCmSelect2($rt);
    initCmSelect2('#cmReportType', 'Report Type');
    $rt.val(G_CM_ReportMode);
    if ($rt.data('select2')) {
        $rt.trigger('change.select2');
    }
}

function loadReportTypeDropdown() {
    var moduleDesc = moduleDescriptionForReportConfig();
    return CheckListMISService.GetReportTypelist(moduleDesc)
        .then(function (response) {
            var rows = asReportTypeArray(response);
            var parsed = parseReportTypesFromApi(rows);
            CM_REPORT_TYPES = parsed.length ? parsed : CM_REPORT_TYPES_DEFAULT.slice();
            if (!parsed.length && typeof toastr !== 'undefined') {
                toastr.warning('No report types from API — using defaults.');
            }
            bindReportTypeDropdown();
        })
        .catch(function (err) {
            console.error('GetReportType failed:', err);
            CM_REPORT_TYPES = CM_REPORT_TYPES_DEFAULT.slice();
            bindReportTypeDropdown();
            if (typeof toastr !== 'undefined') toastr.error('Could not load report types.');
        });
}

function mergeUsersFromReportRows(rows) {
    (rows || []).forEach(function (r) {
        var code = num(prop(r, ['UserMaster_Code', 'userMaster_Code', 'Code', 'code']));
        var name = String(resolveDoerName(r) || prop(r, ['DoerName', 'doerName', 'EmployeeName', 'UserName']) || '').trim();
        if (code > 0 && name) {
            upsertUserEntry(code, name);
        }
    });
    sortUserList();
}

function loadDoersFromMIS() {
    return CheckListMISService.GetCheckListMIS(toIso(G_CM_BaseDate), 0, 'GETMIS')
        .then(function (res) {
            mergeUsersFromReportRows(unwrapApiList(res).map(normalizeSummaryRow));
        })
        .catch(function () {
            return null;
        });
}

function refreshUserDropdown() {
    return loadUserLookup()
        .then(function () {
            return loadDoersFromMIS();
        })
        .then(function () {
            bindUserDropdown();
        })
        .catch(function () {
            bindUserDropdown();
        });
}

function bindUserDropdown() {
    var $uf = $('#cmUserFilter');
    var selected = parseInt($uf.val(), 10) || 0;
    $uf.empty();
    $uf.append(new Option('All Users', '0'));
    G_CM_UserList.forEach(function (u) {
        if (!u.Code || !u.Desp) return;
        $uf.append(new Option(u.Desp, String(u.Code)));
    });
    if (selected && $uf.find('option[value="' + String(selected) + '"]').length) {
        $uf.val(String(selected));
    } else {
        $uf.val('0');
    }
    destroyCmSelect2($uf);
    initCmSelect2('#cmUserFilter', 'All Users');
    $uf.val(selected ? String(selected) : '0');
    if ($uf.data('select2')) {
        $uf.trigger('change.select2');
    }
}

function updateLayoutForReportType() {
    var cfg = currentReportType();
    if (cfg.showChart) {
        $('.cm-chart-side').removeClass('cm-hidden');
        $('.cm-grid-side').removeClass('cm-full');
    } else {
        $('.cm-chart-side').addClass('cm-hidden');
        $('.cm-grid-side').addClass('cm-full');
    }
}

function renderTableHead() {
    var html;
    if (isSummaryMode()) {
        html =
            '<tr>' +
            '<th class="cm-th-num">#</th>' +
            '<th>MIS Period</th>' +
            '<th>Doer Name</th>' +
            '<th class="cm-th-num">Work to be<br />accomplished</th>' +
            '<th class="cm-th-num">Accomplished</th>' +
            '<th class="cm-th-num">This week Work<br />Not Done%</th>' +
            '<th class="cm-th-num">This week work not<br />done on time %</th>' +
            '</tr>';
    } else {
        html =
            '<tr>' +
            '<th class="cm-th-num">#</th>' +
            '<th>MIS Period</th>' +
            '<th>Doer Name</th>' +
            '<th>Task</th>' +
            '<th>Due Date</th>' +
            '<th>Frequency</th>' +
            '<th class="cm-th-num">Done</th>' +
            '<th class="cm-th-num">On Time</th>' +
            '</tr>';
    }
    $('#cmTableHead').html(html);
}

/* ───────────────────────── donut chart ───────────────────────── */
function renderDonut() {
    var $wrap = $('#cmDonut');
    var $legend = $('#cmDonutLegend');
    $legend.empty();

    if (!isSummaryMode()) {
        $wrap.html('<div class="cm-donut-empty"><i class="fas fa-list"></i><div>Chart available in MIS Score report.</div></div>');
        return;
    }

    var data = G_CM_Filtered
        .map(function (r, i) {
            return { name: resolveDoerName(r), value: r.NotDoneOnTime, idx: i };
        })
        .filter(function (d) { return d.value > 0; });

    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (!total) {
        $wrap.html('<div class="cm-donut-empty"><i class="fas fa-circle-check"></i><div>No pending-on-time tasks for this week.</div></div>');
        return;
    }

    var size = 190, stroke = 34, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
    var circ = 2 * Math.PI * r;
    var offset = 0;
    var segments = '';

    data.forEach(function (d, i) {
        var frac = d.value / total;
        var len = frac * circ;
        var color = DONUT_COLORS[i % DONUT_COLORS.length];
        segments +=
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" ' +
            'stroke="' + color + '" stroke-width="' + stroke + '" ' +
            'stroke-dasharray="' + len + ' ' + (circ - len) + '" ' +
            'stroke-dashoffset="' + (-offset) + '" ' +
            'transform="rotate(-90 ' + cx + ' ' + cy + ')">' +
            '<title>' + escapeHtml(d.name) + ': ' + d.value + '</title></circle>';
        offset += len;

        $legend.append(
            '<div class="cm-leg-item">' +
            '<span class="cm-leg-dot" style="background:' + color + '"></span>' +
            '<span class="cm-leg-name" title="' + escapeHtml(d.name) + '">' + escapeHtml(d.name) + '</span>' +
            '<span class="cm-leg-val">' + d.value + '</span>' +
            '</div>'
        );
    });

    $wrap.html(
        '<svg viewBox="0 0 ' + size + ' ' + size + '" class="cm-donut-svg">' +
        segments +
        '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" class="cm-donut-total">' + total + '</text>' +
        '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" class="cm-donut-sub">not on time</text>' +
        '</svg>'
    );
}

/* ───────────────────────── grid ───────────────────────── */
function renderGrid() {
    renderTableHead();
    var $body = $('#cmTableBody');
    var cols = colCount();

    if (!G_CM_Filtered.length) {
        $body.html('<tr><td class="cm-empty" colspan="' + cols + '"><i class="fas fa-inbox"></i> No records for this week.</td></tr>');
        $('#cmPager').html('');
        return;
    }

    var totalPages = Math.max(1, Math.ceil(G_CM_Filtered.length / G_CM_PageSize));
    if (G_CM_Page > totalPages) G_CM_Page = totalPages;
    var startIdx = (G_CM_Page - 1) * G_CM_PageSize;
    var pageRows = G_CM_Filtered.slice(startIdx, startIdx + G_CM_PageSize);

    var html = '';
    pageRows.forEach(function (r, i) {
        if (isSummaryMode()) {
            html += '<tr>' +
                '<td class="cm-sno">' + (startIdx + i + 1) + '</td>' +
                '<td class="cm-period">' + escapeHtml(r.MISPeriod) + '</td>' +
                '<td class="cm-doer">' + escapeHtml(resolveDoerName(r)) + '</td>' +
                '<td class="cm-numcell">' + r.WorkToBeAccomplished + '</td>' +
                '<td class="cm-numcell">' + r.Accomplished + '</td>' +
                '<td class="cm-numcell">' + pct(r.NotDonePctRaw) + '</td>' +
                '<td class="cm-numcell">' + pct(r.NotDoneOnTimePctRaw) + '</td>' +
                '</tr>';
        } else {
            html += '<tr>' +
                '<td class="cm-sno">' + (startIdx + i + 1) + '</td>' +
                '<td class="cm-period">' + escapeHtml(r.MISPeriod) + '</td>' +
                '<td class="cm-doer">' + escapeHtml(resolveDoerName(r)) + '</td>' +
                '<td>' + escapeHtml(r.Task) + '</td>' +
                '<td class="cm-period">' + escapeHtml(r.DueDate) + '</td>' +
                '<td>' + escapeHtml(r.Frequency) + '</td>' +
                '<td class="cm-numcell">' + ynBadge(r.IsDone) + '</td>' +
                '<td class="cm-numcell">' + ynBadge(r.OnTime) + '</td>' +
                '</tr>';
        }
    });
    $body.html(html);

    var from = startIdx + 1;
    var to = Math.min(startIdx + G_CM_PageSize, G_CM_Filtered.length);
    $('#cmPager').html(
        '<span class="cm-pager-info">' + from + ' - ' + to + ' / ' + G_CM_Filtered.length + '</span>' +
        '<button class="cm-pager-btn" id="cmPrev" ' + (G_CM_Page <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>' +
        '<button class="cm-pager-btn" id="cmNext" ' + (G_CM_Page >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>'
    );
}

function applyFilter() {
    G_CM_Filtered = G_CM_Rows.slice();
    G_CM_Page = 1;
    renderGrid();
    renderDonut();
}

function selectedUserCode() {
    return parseInt($('#cmUserFilter').val(), 10) || 0;
}

/* ───────────────────────── data load ───────────────────────── */
function loadMIS(refreshUsers) {
    if (typeof ShowLoader === 'function') ShowLoader();
    $('#cmPeriodBanner').text(periodLabelFor(G_CM_BaseDate));
    updateLayoutForReportType();

    var userCode = selectedUserCode();
    var userPromise = refreshUsers ? refreshUserDropdown() : Promise.resolve();

    return userPromise
        .then(function () {
            return CheckListMISService.GetCheckListMIS(toIso(G_CM_BaseDate), userCode, G_CM_ReportMode);
        })
        .then(function (res) {
            var normalizer = isSummaryMode() ? normalizeSummaryRow : normalizeDetailRow;
            G_CM_Rows = unwrapApiList(res).map(normalizer);
            applyFilter();
        })
        .catch(function () {
            G_CM_Rows = [];
            applyFilter();
            if (typeof toastr !== 'undefined') toastr.error('Could not load Checklist MIS report.');
        })
        .finally(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

/* ───────────────────────── PDF export ───────────────────────── */
function getPdfMake() {
    return window.pdfMake || window.pdfmake || null;
}

function pctPlain(v) {
    if (v == null || v === '') return 'N/A';
    var n = Number(v);
    if (isNaN(n)) return 'N/A';
    return n.toFixed(2).replace(/\.00$/, '') + '%';
}

function buildPdfTableBody(rows) {
    if (isSummaryMode()) {
        var headers = ['#', 'MIS Period', 'Doer Name', 'Work to be accomplished', 'Accomplished', 'Work Not Done %', 'Not Done On Time %'];
        var headerRow = headers.map(function (h) {
            return { text: h, style: 'tableHeader', fillColor: PDF_HEADER_FILL, color: '#ffffff', alignment: 'center', margin: [0, 3, 0, 3] };
        });
        var bodyRows = rows.map(function (r, i) {
            return [
                { text: String(i + 1), alignment: 'center' },
                { text: r.MISPeriod || '' },
                { text: resolveDoerName(r) },
                { text: String(r.WorkToBeAccomplished), alignment: 'right' },
                { text: String(r.Accomplished), alignment: 'right' },
                { text: pctPlain(r.NotDonePctRaw), alignment: 'right' },
                { text: pctPlain(r.NotDoneOnTimePctRaw), alignment: 'right' },
            ];
        });
        return { headers: headers, body: [headerRow].concat(bodyRows) };
    }

    var headers2 = ['#', 'MIS Period', 'Doer Name', 'Task', 'Due Date', 'Frequency', 'Done', 'On Time'];
    var headerRow2 = headers2.map(function (h) {
        return { text: h, style: 'tableHeader', fillColor: PDF_HEADER_FILL, color: '#ffffff', alignment: 'center', margin: [0, 3, 0, 3] };
    });
    var bodyRows2 = rows.map(function (r, i) {
        return [
            { text: String(i + 1), alignment: 'center' },
            { text: r.MISPeriod || '' },
            { text: resolveDoerName(r) },
            { text: r.Task || '' },
            { text: r.DueDate || '' },
            { text: r.Frequency || '' },
            { text: r.IsDone || 'N', alignment: 'center' },
            { text: r.OnTime || 'N', alignment: 'center' },
        ];
    });
    return { headers: headers2, body: [headerRow2].concat(bodyRows2) };
}

function buildPdfDocumentDefinition() {
    var reportLabel = $('#cmReportType option:selected').text() || 'Checklist MIS Report';
    var userLabel = $('#cmUserFilter option:selected').text() || 'All Users';
    var period = $('#cmPeriodBanner').text() || periodLabelFor(G_CM_BaseDate);
    var table = buildPdfTableBody(G_CM_Filtered);

    var content = [
        { text: 'Checklist MIS Report', style: 'docTitle' },
        { text: reportLabel, style: 'docSubtitle' },
        {
            text: [
                { text: 'Period: ', bold: true, color: PDF_NAVY },
                { text: period, color: '#3a3f4b' },
            ],
            fontSize: 9,
            margin: [0, 4, 0, 0],
        },
        {
            text: [
                { text: 'User: ', bold: true, color: PDF_NAVY },
                { text: userLabel, color: '#3a3f4b' },
            ],
            fontSize: 9,
            margin: [0, 2, 0, 8],
        },
        {
            table: {
                headerRows: 1,
                widths: table.headers.map(function (h, idx) {
                    return idx === 0 ? 24 : '*';
                }),
                body: table.body,
            },
            layout: {
                hLineWidth: function () { return 0.6; },
                vLineWidth: function () { return 0.6; },
                hLineColor: function () { return PDF_BORDER; },
                vLineColor: function () { return PDF_BORDER; },
                paddingTop: function () { return 3; },
                paddingBottom: function () { return 3; },
                paddingLeft: function () { return 5; },
                paddingRight: function () { return 5; },
            },
        },
    ];

    if (isSummaryMode()) {
        var chartData = G_CM_Filtered
            .map(function (r) { return { name: resolveDoerName(r), value: r.NotDoneOnTime }; })
            .filter(function (d) { return d.value > 0; });
        if (chartData.length) {
            content.push({ text: 'Tasks not completed on time', style: 'sectionTitle', margin: [0, 12, 0, 4] });
            chartData.forEach(function (d) {
                content.push({ text: d.name + ': ' + d.value, fontSize: 8, margin: [0, 1, 0, 0] });
            });
        }
    }

    return {
        pageSize: 'A4',
        pageOrientation: isSummaryMode() ? 'landscape' : 'portrait',
        pageMargins: [28, 28, 28, 42],
        content: content,
        styles: {
            docTitle: { fontSize: 15, bold: true, color: PDF_NAVY },
            docSubtitle: { fontSize: 11, bold: true, color: PDF_NAVY },
            sectionTitle: { fontSize: 10, bold: true, color: PDF_NAVY },
            tableHeader: { fontSize: 7.5, bold: true },
        },
        defaultStyle: { fontSize: 7.5, color: '#3a3f4b' },
        footer: function (currentPage, pageCount) {
            return {
                margin: [28, 8, 28, 0],
                columns: [
                    { text: 'BizSol ERP', fontSize: 7.5, color: '#9aa3b2' },
                    { text: 'Page ' + currentPage + ' of ' + pageCount, alignment: 'right', fontSize: 7.5, color: '#9aa3b2' },
                ],
            };
        },
    };
}

function exportPdf() {
    if (!G_CM_Filtered.length) {
        if (typeof toastr !== 'undefined') toastr.warning('No data to export.');
        return;
    }
    var pdfMake = getPdfMake();
    if (!pdfMake || typeof pdfMake.createPdf !== 'function') {
        if (typeof toastr !== 'undefined') toastr.error('PDF library is not loaded. Please refresh the page.');
        return;
    }
    try {
        var d = new Date();
        var stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var fileName = 'CheckListMIS_' + G_CM_ReportMode + '_' + stamp + '.pdf';
        pdfMake.createPdf(buildPdfDocumentDefinition()).download(fileName);
        if (typeof toastr !== 'undefined') toastr.success('PDF download started.');
    } catch (err) {
        console.error('PDF export failed:', err);
        if (typeof toastr !== 'undefined') toastr.error('Unable to generate PDF.');
    }
}

/* ───────────────────────── bootstrap ───────────────────────── */
$(document).ready(function () {
    var moduleDesp = decodeURI(BizSolHelperFunction.getUrlVars()['ModuleDesp'] || '');
    if (moduleDesp && moduleDesp !== 'undefined' && moduleDesp.trim() !== '') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    } else {
        $('#ERPHeading').text('Checklist MIS Report');
    }

    var $picker = $('#cmWeekPicker');
    $picker.attr('max', toIso(new Date()));
    $picker.val(toIso(G_CM_BaseDate));
    $('#cmPeriodBanner').text(periodLabelFor(G_CM_BaseDate));

    loadReportTypeDropdown()
        .then(function () {
            return refreshUserDropdown();
        })
        .then(function () {
            loadMIS(true);
        });

    $('#cmReportType').on('change', function () {
        G_CM_ReportMode = $(this).val() || 'GETMIS';
        loadMIS();
    });

    $('#cmUserFilter').on('change', function () {
        loadMIS();
    });

    $picker.on('change', function () {
        var val = $(this).val();
        if (!val) return;
        var parts = val.split('-');
        G_CM_BaseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        loadMIS(true);
    });

    $('#cmResetFilter').on('click', function () {
        var defaultMode = (CM_REPORT_TYPES[0] && CM_REPORT_TYPES[0].code) || 'GETMIS';
        G_CM_ReportMode = defaultMode;
        G_CM_BaseDate = new Date();
        $picker.val(toIso(G_CM_BaseDate));
        $('#cmReportType').val(defaultMode);
        $('#cmUserFilter').val('0');
        if ($('#cmReportType').hasClass('select2-hidden-accessible')) {
            $('#cmReportType, #cmUserFilter').trigger('change.select2');
        }
        loadMIS(true);
    });

    $('#cmExportPdf').on('click', function () {
        exportPdf();
    });

    $(document).on('click', '#cmPrev', function () {
        if (G_CM_Page > 1) { G_CM_Page--; renderGrid(); }
    });
    $(document).on('click', '#cmNext', function () {
        var totalPages = Math.max(1, Math.ceil(G_CM_Filtered.length / G_CM_PageSize));
        if (G_CM_Page < totalPages) { G_CM_Page++; renderGrid(); }
    });
});
