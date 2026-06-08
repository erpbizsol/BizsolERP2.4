import { BizSolHelperFunction } from '../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CheckListMISService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/CheckListMISService.js';
import { TaskListMasterService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/TaskListMasterService.js';
import { UserMasterService } from '../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';

/* ───────────────────────── state ───────────────────────── */
var G_CM_BaseDate = new Date();   // any day inside the selected week
var G_CM_Rows = [];               // raw MIS rows for the week
var G_CM_Filtered = [];           // after name search
var G_CM_Page = 1;
var G_CM_PageSize = 10;
var G_CM_UserMap = {};            // UserMaster_Code -> display name

var DONUT_COLORS = [
    '#2563eb', '#7c3aed', '#0ea5e9', '#ef4444', '#f59e0b',
    '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#e11d48', '#06b6d4', '#a855f7',
];

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

/* Percent display: null/undefined (no work this week) -> N/A. */
function pct(v) {
    if (v == null || v === '') return '<span class="cm-na">N/A</span>';
    var n = Number(v);
    if (isNaN(n)) return '<span class="cm-na">N/A</span>';
    return n.toFixed(2).replace(/\.00$/, '') + '%';
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

/* Read a property allowing for camel/Pascal case differences from the API. */
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

function normalizeUserRows(rows) {
    return (rows || []).map(function (r) {
        var code = prop(r, ['UserMaster_Code', 'userMaster_Code', 'Code', 'code']);
        var text = prop(r, [
            'Desp', 'EmployeeName', 'UserName', 'DisplayName',
            'PersonName', 'Name', 'LoginName', 'DoerName',
        ]);
        return { Code: parseInt(code, 10) || 0, Desp: String(text || '').trim() };
    }).filter(function (r) { return r.Code > 0; });
}

function buildUserMap(rows) {
    var map = {};
    normalizeUserRows(rows).forEach(function (u) {
        if (u.Desp) map[u.Code] = u.Desp;
    });
    return map;
}

function loadUserLookup() {
    return TaskListMasterService.GetTaskListEmployee()
        .then(function (res) {
            var rows = normalizeUserRows(unwrapApiList(res));
            if (rows.length) {
                G_CM_UserMap = buildUserMap(rows);
                return;
            }
            return UserMasterService.GetUserMasterList().then(function (res2) {
                G_CM_UserMap = buildUserMap(unwrapApiList(res2));
            });
        })
        .catch(function () {
            return UserMasterService.GetUserMasterList()
                .then(function (res2) {
                    G_CM_UserMap = buildUserMap(unwrapApiList(res2));
                })
                .catch(function () {
                    G_CM_UserMap = {};
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

function normalizeRow(r) {
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

/* Monday-start week boundaries for the supplied date. */
function weekRange(baseDate) {
    var d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    var dow = d.getDay();                 // 0=Sun..6=Sat
    var diffToMon = (dow + 6) % 7;        // days since Monday
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

/* ───────────────────────── donut chart (dependency-free SVG) ───────────────────────── */
function renderDonut() {
    var $wrap = $('#cmDonut');
    var $legend = $('#cmDonutLegend');

    var data = G_CM_Filtered
        .map(function (r, i) {
            return { name: resolveDoerName(r), value: r.NotDoneOnTime, idx: i };
        })
        .filter(function (d) { return d.value > 0; });

    $legend.empty();

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
    var $body = $('#cmTableBody');

    if (!G_CM_Filtered.length) {
        $body.html('<tr><td class="cm-empty" colspan="7"><i class="fas fa-inbox"></i> No records for this week.</td></tr>');
        $('#cmPager').html('');
        return;
    }

    var totalPages = Math.max(1, Math.ceil(G_CM_Filtered.length / G_CM_PageSize));
    if (G_CM_Page > totalPages) G_CM_Page = totalPages;
    var startIdx = (G_CM_Page - 1) * G_CM_PageSize;
    var pageRows = G_CM_Filtered.slice(startIdx, startIdx + G_CM_PageSize);

    var html = '';
    pageRows.forEach(function (r, i) {
        html += '<tr>' +
            '<td class="cm-sno">' + (startIdx + i + 1) + '</td>' +
            '<td class="cm-period">' + escapeHtml(r.MISPeriod) + '</td>' +
            '<td class="cm-doer">' + escapeHtml(resolveDoerName(r)) + '</td>' +
            '<td class="cm-numcell">' + r.WorkToBeAccomplished + '</td>' +
            '<td class="cm-numcell">' + r.Accomplished + '</td>' +
            '<td class="cm-numcell">' + pct(r.NotDonePctRaw) + '</td>' +
            '<td class="cm-numcell">' + pct(r.NotDoneOnTimePctRaw) + '</td>' +
            '</tr>';
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
    var term = String($('#cmNameSearch').val() || '').trim().toLowerCase();
    G_CM_Filtered = !term
        ? G_CM_Rows.slice()
        : G_CM_Rows.filter(function (r) {
            return String(resolveDoerName(r)).toLowerCase().indexOf(term) >= 0;
        });
    G_CM_Page = 1;
    renderGrid();
    renderDonut();
}

/* ───────────────────────── data load ───────────────────────── */
function loadMIS() {
    if (typeof ShowLoader === 'function') ShowLoader();
    $('#cmPeriodBanner').text(periodLabelFor(G_CM_BaseDate));

    return Promise.all([
        loadUserLookup(),
        CheckListMISService.GetCheckListMIS(toIso(G_CM_BaseDate), 0),
    ])
        .then(function (results) {
            G_CM_Rows = unwrapApiList(results[1]).map(normalizeRow);
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

    loadMIS();

    $picker.on('change', function () {
        var val = $(this).val();
        if (!val) return;
        var parts = val.split('-');
        G_CM_BaseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        loadMIS();
    });

    $('#cmNameSearch').on('input', function () {
        applyFilter();
    });

    $('#cmResetFilter').on('click', function () {
        $('#cmNameSearch').val('');
        G_CM_BaseDate = new Date();
        $picker.val(toIso(G_CM_BaseDate));
        loadMIS();
    });

    $(document).on('click', '#cmPrev', function () {
        if (G_CM_Page > 1) { G_CM_Page--; renderGrid(); }
    });
    $(document).on('click', '#cmNext', function () {
        var totalPages = Math.max(1, Math.ceil(G_CM_Filtered.length / G_CM_PageSize));
        if (G_CM_Page < totalPages) { G_CM_Page++; renderGrid(); }
    });
});
