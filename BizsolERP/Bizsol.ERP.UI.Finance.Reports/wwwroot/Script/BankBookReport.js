import { BankBookReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankBookReportService.js';

var LEVELS = [
    { id: 'PROJECTWISE', label: 'Project Wise' },
    { id: 'SUBPROJECTWISE', label: 'Sub Project Wise' },
    { id: 'CATEGORYWISE', label: 'Category Wise' },
    { id: 'DESPWISE', label: 'Desp Wise' },
    { id: 'PARTYWISE', label: 'Customer / Vendor Wise' },
    { id: 'DETAIL', label: 'Vendor Wise Detail' }
];

var drill = {
    level: 'PROJECTWISE',
    projectCode: 0,
    projectName: '',
    subCode: 0,
    subName: '',
    categoryCode: 0,
    categoryName: '',
    desp: '',
    despLabel: '',
    party: '',
    partyLabel: ''
};

var lastRows = [];

$(document).ready(function () {
    $('#ddlBbStatus').val('Pending');
    $('#ddlBbProject').val('0');
    $('#ddlBbStatus').on('change', function () {
        $('#ddlBbProject').html('<option value="0">All</option>').val('0');
        loadProjectFilter();
    });
    $('#btnBbShow').on('click', function () {
        var selected = selectedProjectCode();
        if (selected > 0 && drill.projectCode > 0 && drill.projectCode !== selected) {
            goToLevel('PROJECTWISE');
            return;
        }
        loadReport();
    });
    $('#btnBbExcel').on('click', exportExcel);
    $('#btnBbClear').on('click', clearReport);
    $('#bbCrumb').on('click', '.bb-crumb-btn', function () {
        goToLevel($(this).attr('data-level'));
    });
    $('#tblBankBookBody').on('click', 'tr.bb-row-link', function () {
        openNextLevel($(this).data('row'));
    });
    loadProjectFilter();
    goToLevel('PROJECTWISE');
});

function selectedProjectCode() {
    return parseInt($('#ddlBbProject').val() || '0', 10) || 0;
}

function loadProjectFilter() {
    BankBookReportService.GetBankBookReport({
        Mode: 'GETPROJECTS',
        ReportStatus: $('#ddlBbStatus').val() || 'Pending',
        FilterProjectMaster_Code: 0
    }).then(function (data) {
        var rows = normalizeRows(data);
        var html = '<option value="0">All</option>';
        var seen = {};
        rows.forEach(function (p) {
            var code = String(p.RowKey || '').trim();
            var name = String(p.Particular || '').trim();
            if (!code || code === '0' || !name || seen[code]) return;
            seen[code] = true;
            html += '<option value="' + escHtml(code) + '">' + escHtml(name) + '</option>';
        });
        $('#ddlBbProject').html(html).val('0');
    }).catch(function () { });
}

function levelIndex(id) {
    for (var i = 0; i < LEVELS.length; i++) {
        if (LEVELS[i].id === id) return i;
    }
    return 0;
}

function levelMeta(id) {
    return LEVELS[levelIndex(id)] || LEVELS[0];
}

function goToLevel(levelId) {
    var idx = levelIndex(levelId);
    if (idx < 1) {
        drill.projectCode = 0;
        drill.projectName = '';
    }
    if (idx < 2) {
        drill.subCode = 0;
        drill.subName = '';
    }
    if (idx < 3) {
        drill.categoryCode = 0;
        drill.categoryName = '';
    }
    if (idx < 4) {
        drill.desp = '';
        drill.despLabel = '';
    }
    if (idx < 5) {
        drill.party = '';
        drill.partyLabel = '';
    }
    drill.level = LEVELS[idx].id;
    renderCrumb();
    loadReport();
}

function renderCrumb() {
    var idx = levelIndex(drill.level);
    var html = '';
    for (var i = 0; i <= idx; i++) {
        if (i > 0) html += '<span class="bb-crumb-sep">→</span>';
        var current = i === idx ? ' is-current' : '';
        html += '<button type="button" class="bb-crumb-btn' + current + '" data-level="'
            + LEVELS[i].id + '">' + escHtml(LEVELS[i].label) + '</button>';
    }
    $('#bbCrumb').html(html);
    $('#bbLevelTitle').text(levelMeta(drill.level).label);
    renderParentPills();
}

function openNextLevel(row) {
    if (!row || drill.level === 'DETAIL') return;
    var key = row.RowKey == null ? '' : String(row.RowKey);
    var name = row.Particular == null ? '' : String(row.Particular);
    if (drill.level === 'PROJECTWISE') {
        drill.projectCode = parseInt(key, 10) || 0;
        drill.projectName = name;
        goToLevel('SUBPROJECTWISE');
        return;
    }
    if (drill.level === 'SUBPROJECTWISE') {
        drill.subCode = parseInt(key, 10) || 0;
        drill.subName = name;
        goToLevel('CATEGORYWISE');
        return;
    }
    if (drill.level === 'CATEGORYWISE') {
        drill.categoryCode = parseInt(key, 10) || 0;
        drill.categoryName = name;
        goToLevel('DESPWISE');
        return;
    }
    if (drill.level === 'DESPWISE') {
        drill.desp = key;
        drill.despLabel = name;
        goToLevel('PARTYWISE');
        return;
    }
    if (drill.level === 'PARTYWISE') {
        drill.party = key;
        drill.partyLabel = name;
        goToLevel('DETAIL');
    }
}

function loadReport() {
    var payload = {
        Mode: drill.level,
        ReportStatus: $('#ddlBbStatus').val() || 'Pending',
        FilterProjectMaster_Code: selectedProjectCode(),
        ProjectMaster_Code: drill.projectCode || 0,
        SubProjectMaster_Code: drill.subCode || 0,
        CategoryMaster_Code: drill.categoryCode || 0,
        ItemDescription: drill.level === 'PARTYWISE' || drill.level === 'DETAIL' ? drill.desp : '',
        PartyName: drill.level === 'DETAIL' ? drill.party : ''
    };
    $('#tblBankBookBody').html('<tr><td colspan="3" class="bb-empty">Loading…</td></tr>');
    $('#tblBankBookFoot').empty();
    if (typeof Showloader === 'function') Showloader();
    BankBookReportService.GetBankBookReport(payload)
        .then(function (data) {
            renderRows(normalizeRows(data));
        })
        .catch(function () {
            lastRows = [];
            $('#tblBankBookBody').html('<tr><td colspan="3" class="bb-empty">Could not load the bank book report.</td></tr>');
            if (window.toastr) toastr.error('Could not load the bank book report.');
        })
        .then(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

function normalizeRows(data) {
    var list = Array.isArray(data) ? data
        : (Array.isArray(data && data.data) ? data.data
        : (Array.isArray(data && data.Data) ? data.Data : []));
    return list.map(function (r) {
        return {
            RowKey: pick(r, ['RowKey', 'rowKey']),
            Particular: pick(r, ['Particular', 'particular']),
            ReceivedAmount: num(pick(r, ['ReceivedAmount', 'receivedAmount'])),
            PaymentAmount: num(pick(r, ['PaymentAmount', 'paymentAmount'])),
            ParentName: pick(r, ['ParentName', 'parentName'])
        };
    });
}

function pick(row, names) {
    if (!row) return '';
    for (var i = 0; i < names.length; i++) {
        if (row[names[i]] != null) return row[names[i]];
    }
    return '';
}

function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function renderRows(rows) {
    lastRows = rows || [];
    $('#bbParticularHead').text('Particular');
    renderParentPills();

    if (!rows.length) {
        $('#tblBankBookBody').html('<tr><td colspan="3" class="bb-empty">No records for this level.</td></tr>');
        $('#tblBankBookFoot').html('<tr><td>Total</td><td class="bb-amt">0.00</td><td class="bb-amt">0.00</td></tr>');
        return;
    }

    var received = 0;
    var payment = 0;
    var canDrill = drill.level !== 'DETAIL';
    var html = '';
    rows.forEach(function (row) {
        received += row.ReceivedAmount;
        payment += row.PaymentAmount;
        var cls = canDrill ? ' class="bb-row-link"' : '';
        html += '<tr' + cls + '><td class="bb-particular">' + escHtml(row.Particular) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.ReceivedAmount) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.PaymentAmount) + '</td></tr>';
    });
    $('#tblBankBookBody').html(html);
    $('#tblBankBookBody tr.bb-row-link').each(function (i) {
        $(this).data('row', rows[i]);
    });
    $('#tblBankBookFoot').html(
        '<tr><td>Total</td><td class="bb-amt">' + formatAmt(received) + '</td><td class="bb-amt">' + formatAmt(payment) + '</td></tr>'
    );
}

function parentParts() {
    var idx = levelIndex(drill.level);
    var parts = [];
    if (idx >= 1 && drill.projectName) parts.push(drill.projectName);
    if (idx >= 2 && drill.subName) parts.push(drill.subName);
    if (idx >= 3 && drill.categoryName) parts.push(drill.categoryName);
    if (idx >= 4 && (drill.despLabel || drill.desp)) parts.push(drill.despLabel || drill.desp);
    if (idx >= 5 && (drill.partyLabel || drill.party)) parts.push(drill.partyLabel || drill.party);
    return parts;
}

function renderParentPills() {
    var parts = parentParts();
    if (!parts.length) {
        $('#bbLevelSub').empty();
        return;
    }
    var html = '';
    for (var i = 0; i < parts.length; i++) {
        if (i > 0) html += '<span class="bb-crumb-sep">→</span>';
        var current = i === parts.length - 1 ? ' is-current' : '';
        html += '<span class="bb-crumb-btn' + current + '">' + escHtml(parts[i]) + '</span>';
    }
    $('#bbLevelSub').html(html);
}

function clearReport() {
    lastRows = [];
    drill.level = 'PROJECTWISE';
    drill.projectCode = 0;
    drill.projectName = '';
    drill.subCode = 0;
    drill.subName = '';
    drill.categoryCode = 0;
    drill.categoryName = '';
    drill.desp = '';
    drill.despLabel = '';
    drill.party = '';
    drill.partyLabel = '';
    $('#ddlBbStatus').val('Pending');
    $('#ddlBbProject').val('0');
    renderCrumb();
    $('#bbParticularHead').text('Particular');
    $('#tblBankBookBody').html('<tr><td colspan="3" class="bb-empty">Click Show to load the report.</td></tr>');
    $('#tblBankBookFoot').empty();
}

function exportExcel() {
    if (!lastRows.length) {
        if (window.toastr) toastr.warning('Load the report first.');
        return;
    }
    var received = 0;
    var payment = 0;
    var $head = $('#tblBankBookExport thead tr');
    var $body = $('#tblBankBookExport tbody');
    $head.empty();
    $body.empty();
    $head.append($('<th/>').text('Particular'));
    $head.append($('<th/>').text('Received amount'));
    $head.append($('<th/>').text('Payment amount'));
    lastRows.forEach(function (row) {
        received += row.ReceivedAmount;
        payment += row.PaymentAmount;
        var tr = $('<tr/>');
        tr.append($('<td/>').text(row.Particular));
        tr.append($('<td/>').text(formatAmt(row.ReceivedAmount)));
        tr.append($('<td/>').text(formatAmt(row.PaymentAmount)));
        $body.append(tr);
    });
    var total = $('<tr/>');
    total.append($('<td/>').text('Total'));
    total.append($('<td/>').text(formatAmt(received)));
    total.append($('<td/>').text(formatAmt(payment)));
    $body.append(total);

    var now = new Date();
    var dateString = now.getFullYear() + '-'
        + String(now.getMonth() + 1).padStart(2, '0') + '-'
        + String(now.getDate()).padStart(2, '0') + '_'
        + String(now.getHours()).padStart(2, '0') + '-'
        + String(now.getMinutes()).padStart(2, '0');
    var level = levelMeta(drill.level).label.replace(/\s+/g, '');
    if ($.fn.table2excel) {
        $('#tblBankBookExport').table2excel({
            filename: 'BankBookReport_' + level + '_' + dateString,
            fileext: '.xlsx'
        });
        return;
    }
    downloadCsv('BankBookReport_' + level + '_' + dateString + '.csv');
}

function downloadCsv(filename) {
    var lines = ['Particular,Received amount,Payment amount'];
    $('#tblBankBookExport tbody tr').each(function () {
        var cols = [];
        $(this).find('td').each(function () {
            var text = $(this).text().replace(/"/g, '""');
            cols.push('"' + text + '"');
        });
        lines.push(cols.join(','));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function formatAmt(n) {
    var v = Math.round((num(n) + Number.EPSILON) * 100) / 100;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
