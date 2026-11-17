import { BankBookReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankBookReportService.js';
import { BankMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankMasterService.js';

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
var COL_COUNT = 6;

$(document).ready(function () {
    $('#ddlBbStatus').val('Pending');
    $('#ddlBbBank').val('0');
    $('#ddlBbProject').val('0');
    initDates();
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
    loadBankFilter();
    loadProjectFilter();
    goToLevel('PROJECTWISE');
});

function formatDmy(date) {
    return String(date.getDate()).padStart(2, '0') + '/'
        + String(date.getMonth() + 1).padStart(2, '0') + '/'
        + date.getFullYear();
}

function setDefaultDates() {
    var today = new Date();
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtBbFromDate').val(formatDmy(first));
    $('#txtBbToDate').val(formatDmy(today));
    if ($.fn.datepicker) {
        $('#txtBbFromDate').datepicker('update', first);
        $('#txtBbToDate').datepicker('update', today);
    }
}

function initDates() {
    if ($.fn.datepicker) {
        $('#txtBbFromDate, #txtBbToDate').datepicker({
            format: 'dd/mm/yyyy',
            autoclose: true,
            todayHighlight: true,
            orientation: 'bottom auto',
            container: 'body'
        });
    }
    setDefaultDates();
}

function parseDmy(value) {
    var match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value || '').trim());
    if (!match) return null;
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
}

function readDateFilters() {
    var fromRaw = ($('#txtBbFromDate').val() || '').trim();
    var toRaw = ($('#txtBbToDate').val() || '').trim();
    var fromDate = fromRaw ? parseDmy(fromRaw) : null;
    var toDate = toRaw ? parseDmy(toRaw) : null;
    if (fromRaw && !fromDate) {
        if (window.toastr) toastr.warning('From date must be dd/mm/yyyy.');
        return null;
    }
    if (toRaw && !toDate) {
        if (window.toastr) toastr.warning('To date must be dd/mm/yyyy.');
        return null;
    }
    if (fromDate && toDate && fromDate > toDate) {
        if (window.toastr) toastr.warning('From date must be on or before To date.');
        return null;
    }
    return { fromRaw: fromRaw, toRaw: toRaw };
}

function selectedBankCode() {
    return parseInt($('#ddlBbBank').val() || '0', 10) || 0;
}

function selectedBankName() {
    var text = $('#ddlBbBank option:selected').text() || 'All';
    return String(text).trim() || 'All';
}

function loadBankFilter() {
    BankMasterService.GetBankMasterList().then(function (data) {
        var rows = Array.isArray(data) ? data
            : (Array.isArray(data && data.data) ? data.data
            : (Array.isArray(data && data.Data) ? data.Data : []));
        var html = '<option value="0">All</option>';
        var seen = {};
        rows.forEach(function (b) {
            var code = String(b.Code || b.code || b.BankMaster_Code || b.bankMaster_Code || '').trim();
            var name = String(b.BankName || b.bankName || '').trim();
            var account = String(b.AccountNo || b.accountNo || '').trim();
            if (!code || code === '0' || !name || seen[code]) return;
            seen[code] = true;
            var label = account ? name + ' (' + account + ')' : name;
            html += '<option value="' + escHtml(code) + '">' + escHtml(label) + '</option>';
        });
        var current = String($('#ddlBbBank').val() || '0');
        $('#ddlBbBank').html(html);
        if ($('#ddlBbBank option[value="' + current + '"]').length) $('#ddlBbBank').val(current);
        else $('#ddlBbBank').val('0');
    }).catch(function () { });
}

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
    var dates = readDateFilters();
    if (!dates) return;
    var payload = {
        Mode: drill.level,
        FromDate: dates.fromRaw,
        ToDate: dates.toRaw,
        BankMaster_Code: selectedBankCode(),
        ReportStatus: $('#ddlBbStatus').val() || 'Pending',
        FilterProjectMaster_Code: selectedProjectCode(),
        ProjectMaster_Code: drill.projectCode || 0,
        SubProjectMaster_Code: drill.subCode || 0,
        CategoryMaster_Code: drill.categoryCode || 0,
        ItemDescription: drill.level === 'PARTYWISE' || drill.level === 'DETAIL' ? drill.desp : '',
        PartyName: drill.level === 'DETAIL' ? drill.party : ''
    };
    $('#tblBankBookBody').html(emptyRow('Loading…'));
    $('#tblBankBookFoot').empty();
    if (typeof Showloader === 'function') Showloader();
    BankBookReportService.GetBankBookReport(payload)
        .then(function (data) {
            renderRows(normalizeRows(data));
        })
        .catch(function () {
            lastRows = [];
            $('#tblBankBookBody').html(emptyRow('Could not load the bank book report.'));
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
            OpeningAmount: num(pick(r, ['OpeningAmount', 'openingAmount'])),
            ReceivedAmount: num(pick(r, ['ReceivedAmount', 'receivedAmount'])),
            PaymentAmount: num(pick(r, ['PaymentAmount', 'paymentAmount'])),
            ClosingAmount: closingOf(r),
            ScopeOpening: num(pick(r, ['ScopeOpening', 'scopeOpening'])),
            OpeningBanks: pick(r, ['OpeningBanks', 'openingBanks']),
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

function closingOf(row) {
    var sent = pick(row, ['ClosingAmount', 'closingAmount']);
    if (sent !== '' && sent != null) return num(sent);
    return num(pick(row, ['OpeningAmount', 'openingAmount']))
        + num(pick(row, ['ReceivedAmount', 'receivedAmount']))
        - num(pick(row, ['PaymentAmount', 'paymentAmount']));
}

function emptyRow(message) {
    return '<tr><td colspan="' + COL_COUNT + '" class="bb-empty">' + message + '</td></tr>';
}

function totalCells(opening, received, payment, balance, drcr) {
    return '<td>Total</td>'
        + '<td class="bb-amt">' + formatAmt(opening) + '</td>'
        + '<td class="bb-amt">' + formatAmt(payment) + '</td>'
        + '<td class="bb-amt">' + formatAmt(received) + '</td>'
        + '<td class="bb-amt">' + formatAmt(balance) + '</td>'
        + '<td class="bb-side">' + escHtml(drcr || '') + '</td>';
}

function closingCells(balance, drcr) {
    return '<td>Closing</td>'
        + '<td></td><td></td><td></td>'
        + '<td class="bb-amt">' + formatAmt(balance) + '</td>'
        + '<td class="bb-side">' + escHtml(drcr || '') + '</td>';
}

function rowNet(row) {
    return num(row.OpeningAmount) + num(row.ReceivedAmount) - num(row.PaymentAmount);
}

function drCrOf(balance) {
    var n = Math.round((num(balance) + Number.EPSILON) * 100) / 100;
    if (n > 0) return 'Cr';
    if (n < 0) return 'Dr';
    return '';
}

/* Opening + received − payment: a positive balance is Cr, a negative balance is Dr. */
function applyRunningBalance(rows) {
    var run = 0;
    rows.forEach(function (row) {
        run = Math.round((run + rowNet(row) + Number.EPSILON) * 100) / 100;
        row.Balance = run;
        row.DrCr = drCrOf(run);
    });
    rows.finalBalance = run;
}

function renderRows(rows) {
    rows = rows || [];
    applyBulkOpening(rows);
    applyRunningBalance(rows);
    lastRows = rows;
    $('#bbParticularHead').text('Particular');
    renderParentPills();
    renderOpeningNote(rows);
    $('#bbOpeningHead').text('Opening');

    if (!rows.length) {
        $('#tblBankBookBody').html(emptyRow('No records for this level.'));
        $('#tblBankBookFoot').html('<tr>' + totalCells(0, 0, 0, 0, '') + '</tr>');
        return;
    }

    var opening = 0;
    var received = 0;
    var payment = 0;
    var canDrill = drill.level !== 'DETAIL';
    var html = '';
    rows.forEach(function (row) {
        opening += row.OpeningAmount;
        received += row.ReceivedAmount;
        payment += row.PaymentAmount;
        var cls = canDrill ? ' class="bb-row-link"' : '';
        html += '<tr' + cls + '><td class="bb-particular">' + escHtml(row.Particular) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.OpeningAmount) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.PaymentAmount) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.ReceivedAmount) + '</td>'
            + '<td class="bb-amt">' + formatAmt(row.Balance) + '</td>'
            + '<td class="bb-side">' + escHtml(row.DrCr) + '</td></tr>';
    });
    var balance = rows.finalBalance || 0;
    $('#tblBankBookBody').html(html);
    $('#tblBankBookBody tr.bb-row-link').each(function (i) {
        $(this).data('row', rows[i]);
    });
    $('#tblBankBookFoot').html(
        '<tr class="bb-total">' + totalCells(opening, received, payment, balance, drCrOf(balance)) + '</tr>'
        + '<tr class="bb-closing">' + closingCells(balance, drCrOf(balance)) + '</tr>'
    );
}

function applyBulkOpening(rows) {
    rows.bulkOpening = null;
    if (!rows.length || drill.level === 'PROJECTWISE' || drill.level === 'SUBPROJECTWISE') return;
    rows.forEach(function (row) {
        row.OpeningAmount = 0;
    });
}

function parseOpeningBanks(text) {
    if (!text) return [];
    return String(text).split('|').map(function (part) {
        var cut = part.lastIndexOf('^');
        if (cut < 0) return null;
        return {
            name: part.slice(0, cut),
            amount: num(part.slice(cut + 1))
        };
    }).filter(function (bank) { return bank && bank.name; });
}

function renderOpeningNote(rows) {
    var $note = $('#bbOpenNote');
    if (drill.level !== 'SUBPROJECTWISE' || !rows.length) {
        $note.empty().attr('hidden', 'hidden');
        return;
    }
    var banks = parseOpeningBanks(rows[0].OpeningBanks);
    if (!banks.length) {
        $note.empty().attr('hidden', 'hidden');
        return;
    }
    var html = '<span class="bb-open-note-title">Opening balances for this project</span>';
    banks.forEach(function (bank) {
        html += '<span class="bb-open-bank">' + escHtml(bank.name) + ' <b>' + formatAmt(bank.amount) + '</b></span>';
    });
    $note.html(html).removeAttr('hidden');
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
    $('#ddlBbBank').val('0');
    $('#txtBbFromDate, #txtBbToDate').val('');
    setDefaultDates();
    $('#ddlBbProject').html('<option value="0">All</option>').val('0');
    loadProjectFilter();
    renderCrumb();
    $('#bbParticularHead').text('Particular');
    $('#bbOpeningHead').text('Opening');
    $('#bbOpenNote').empty().attr('hidden', 'hidden');
    $('#tblBankBookBody').html(emptyRow('Click Show to load the report.'));
    $('#tblBankBookFoot').empty();
}

function exportMetaRows() {
    var projectText = $('#ddlBbProject option:selected').text() || 'All';
    var fromRaw = ($('#txtBbFromDate').val() || '').trim() || 'All';
    var toRaw = ($('#txtBbToDate').val() || '').trim() || 'All';
    var parents = parentParts();
    return [
        ['Bank Book Report', '', '', '', '', ''],
        ['Bank name', selectedBankName(), '', '', '', ''],
        ['From date', fromRaw, '', '', '', ''],
        ['To date', toRaw, '', '', '', ''],
        ['Status', $('#ddlBbStatus').val() || 'Pending', '', '', '', ''],
        ['Project name', String(projectText).trim() || 'All', '', '', '', ''],
        ['Level', levelMeta(drill.level).label, '', '', '', ''],
        ['Path', parents.length ? parents.join(' > ') : levelMeta(drill.level).label, '', '', '', ''],
        ['', '', '', '', '', ''],
        ['Particular', 'Opening', 'Payment amount', 'Received amount', 'Balance', 'Dr/Cr']
    ];
}

function exportExcel() {
    if (!lastRows.length) {
        if (window.toastr) toastr.warning('Load the report first.');
        return;
    }
    var opening = 0;
    var received = 0;
    var payment = 0;
    var balance = lastRows.length ? lastRows[lastRows.length - 1].Balance : 0;
    var $thead = $('#tblBankBookExport thead');
    var $body = $('#tblBankBookExport tbody');
    $thead.empty();
    $body.empty();
    exportMetaRows().forEach(function (cells) {
        var meta = $('<tr/>');
        cells.forEach(function (cell) {
            meta.append($('<th/>').text(cell));
        });
        $thead.append(meta);
    });
    lastRows.forEach(function (row) {
        opening += row.OpeningAmount;
        received += row.ReceivedAmount;
        payment += row.PaymentAmount;
        var tr = $('<tr/>');
        tr.append($('<td/>').text(row.Particular));
        tr.append($('<td/>').text(formatAmt(row.OpeningAmount)));
        tr.append($('<td/>').text(formatAmt(row.PaymentAmount)));
        tr.append($('<td/>').text(formatAmt(row.ReceivedAmount)));
        tr.append($('<td/>').text(formatAmt(row.Balance)));
        tr.append($('<td/>').text(row.DrCr || ''));
        $body.append(tr);
    });
    var total = $('<tr/>');
    total.append($('<td/>').text('Total'));
    total.append($('<td/>').text(formatAmt(opening)));
    total.append($('<td/>').text(formatAmt(payment)));
    total.append($('<td/>').text(formatAmt(received)));
    total.append($('<td/>').text(formatAmt(balance)));
    total.append($('<td/>').text(drCrOf(balance)));
    $body.append(total);
    var closing = $('<tr/>');
    closing.append($('<td/>').text('Closing'));
    closing.append($('<td/>').text(''));
    closing.append($('<td/>').text(''));
    closing.append($('<td/>').text(''));
    closing.append($('<td/>').text(formatAmt(balance)));
    closing.append($('<td/>').text(drCrOf(balance)));
    $body.append(closing);

    var now = new Date();
    var dateString = now.getFullYear() + '-'
        + String(now.getMonth() + 1).padStart(2, '0') + '-'
        + String(now.getDate()).padStart(2, '0') + '_'
        + String(now.getHours()).padStart(2, '0') + '-'
        + String(now.getMinutes()).padStart(2, '0');
    var level = levelMeta(drill.level).label.replace(/\s+/g, '');
    var bankPart = selectedBankName().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '') || 'AllBanks';
    if ($.fn.table2excel) {
        $('#tblBankBookExport').table2excel({
            filename: 'BankBookReport_' + bankPart + '_' + level + '_' + dateString,
            fileext: '.xlsx'
        });
        return;
    }
    downloadCsv('BankBookReport_' + bankPart + '_' + level + '_' + dateString + '.csv');
}

function downloadCsv(filename) {
    var lines = [];
    $('#tblBankBookExport thead tr, #tblBankBookExport tbody tr').each(function () {
        var cols = [];
        $(this).find('th, td').each(function () {
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
    var v = Math.round((Math.abs(num(n)) + Number.EPSILON) * 100) / 100;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
