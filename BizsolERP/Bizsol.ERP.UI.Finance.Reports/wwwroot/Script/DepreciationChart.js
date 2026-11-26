import { DepreciationChartService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DepreciationChartService.js?v=dep-chart-v15';

var columns = [];          // visible columns, API order: [{ key, kind }]
var tree = [];             // [{ key, name, sums, types: [{ key, name, sums, assets: [{ raw }] }] }]
var expandedGroups = {};
var expandedTypes = {};
var searchText = '';

$(document).ready(function () {
    setDefaultDates();
    $('#btnDcShow').on('click', function () { loadChart(); });
    $('#txtDcFromDate, #txtDcToDate').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadChart();
        }
    });

    $('#btnDcExpandAll').on('click', function () { setAllExpanded(true); });
    $('#btnDcCollapseAll').on('click', function () { setAllExpanded(false); });

    $('#txtDcSearch').on('input', function () {
        searchText = String($(this).val() || '').trim().toLowerCase();
        $('#btnDcSearchClear').prop('hidden', !searchText);
        renderGrid();
    });
    $('#btnDcSearchClear').on('click', function () {
        $('#txtDcSearch').val('').trigger('input').trigger('focus');
    });

    var $body = $('#tblDepreciationChartBody');
    $body.on('click', 'tr.dc-row-group, tr.dc-row-type', function () {
        toggleRow($(this));
    });
    $body.on('keydown', 'tr.dc-row-group, tr.dc-row-type', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleRow($(this));
        }
    });

    setDefaultDates().then(function () { loadChart(); });
});

/* ---------- helpers ---------- */

function pick(obj, names) {
    if (!obj) return undefined;
    for (var i = 0; i < names.length; i++) {
        if (obj[names[i]] !== undefined && obj[names[i]] !== null) return obj[names[i]];
    }
    var lower = {};
    Object.keys(obj).forEach(function (k) { lower[k.toLowerCase()] = obj[k]; });
    for (var j = 0; j < names.length; j++) {
        var v = lower[names[j].toLowerCase()];
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
}

function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function colCount() {
    return columns.length || 1;
}

function isoDate(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
}

function toInputDate(val) {
    if (val == null || val === '') return '';
    var s = String(val).trim();
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
    var dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
        return dmy[3] + '-' + dmy[2].padStart(2, '0') + '-' + dmy[1].padStart(2, '0');
    }
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return isoDate(parsed);
    return '';
}

function dateFromFinYearResponse(res) {
    var rows = unwrap(res);
    var row = rows[0];
    if (row == null) return toInputDate(res);
    if (typeof row !== 'object') return toInputDate(row);
    var named = pick(row, [
        'FinYearStartDate', 'FromDate', 'StartDate', 'FinancialYearStartDate',
        'FinStartDate', 'YearStartDate', 'Date'
    ]);
    if (named != null && named !== '') return toInputDate(named);
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i++) {
        var parsed = toInputDate(row[keys[i]]);
        if (parsed) return parsed;
    }
    return '';
}

function setDefaultDates() {
    var today = new Date();
    $('#txtDcToDate').val(isoDate(today));
    return DepreciationChartService.GetFinYearStartDate().then(function (res) {
        var fromDate = dateFromFinYearResponse(res);
        $('#txtDcFromDate').val(fromDate || isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
    }).catch(function () {
        $('#txtDcFromDate').val(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
    });
}

function readDateFilters() {
    var fromDate = String($('#txtDcFromDate').val() || '').trim();
    var toDate = String($('#txtDcToDate').val() || '').trim();
    if (!fromDate || !toDate) {
        if (window.toastr) toastr.warning('Please select From date and To date.');
        return null;
    }
    if (fromDate > toDate) {
        if (window.toastr) toastr.warning('From date must be on or before To date.');
        return null;
    }
    return { fromDate: fromDate, toDate: toDate };
}

function formatAmt(v) {
    return num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(v) {
    if (v === undefined || v === null || v === '') return '';
    var n = parseFloat(v);
    if (isNaN(n)) return escHtml(v);
    return String(Math.round(n * 100) / 100);
}

function formatDisplayDatePlain(val) {
    if (val == null || val === '') return '';
    var s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        var iso = s.substring(0, 10);
        var p = iso.split('-');
        return p[2] + '-' + p[1] + '-' + p[0];
    }
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/i.test(s)) return s;
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
    return s;
}

function escHtml(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normKey(key) {
    return String(key || '').toLowerCase().replace(/[^a-z0-9%]/g, '');
}

/** Id columns stay out of the grid. Every other field keeps the API column order. */
function isHiddenColumn(key) {
    var n = normKey(key);
    return n === 'code' || /code$/.test(n);
}

function columnKind(key) {
    var n = normKey(key);
    if (n.indexOf('date') >= 0 || n === 'asondate') return 'date';
    if (n === 'grossblock' || n === 'residualvalue' || n === 'depbeforecurrentfinyear' ||
        n === 'disposeoffvalue' || n === 'depcurrentyear' || n === 'netvalue') return 'amount';
    if (n === 'life' || n === 'noofdays' || n === 'noofyears' || n === 'remaininglife' ||
        n === '%ofdep' || n === 'deppercentage' || n === 'itdep' || n === 'itdespvalue') return 'number';
    return 'text';
}

function headerClass(kind) {
    if (kind === 'amount' || kind === 'number') return ' class="dc-num"';
    if (kind === 'date') return ' class="dc-center"';
    return '';
}

function cellClass(kind) {
    if (kind === 'amount') return ' class="dc-num dc-amt"';
    if (kind === 'number') return ' class="dc-num"';
    if (kind === 'date') return ' class="dc-center"';
    return '';
}

function formatCell(kind, value) {
    if (value === undefined || value === null || value === '') return '';
    if (kind === 'date') return escHtml(formatDisplayDatePlain(value));
    if (kind === 'amount') return formatAmt(value);
    if (kind === 'number') return formatNumber(value);
    return escHtml(value);
}

function unwrap(res) {
    if (typeof res === 'string') {
        try { res = JSON.parse(res); } catch (e) { return []; }
    }
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.Data)) return res.Data;
    return [];
}

function detectColumns(rows) {
    var keys = [];
    rows.forEach(function (row) {
        Object.keys(row).forEach(function (key) {
            if (keys.indexOf(key) < 0) keys.push(key);
        });
    });
    columns = keys.filter(function (key) { return !isHiddenColumn(key); }).map(function (key) {
        return { key: key, kind: columnKind(key) };
    });
}

function columnIndex(match) {
    for (var i = 0; i < columns.length; i++) {
        if (match(normKey(columns[i].key))) return i;
    }
    return -1;
}

function emptySums() {
    var sums = {};
    columns.forEach(function (col) {
        if (col.kind === 'amount') sums[col.key] = 0;
    });
    return sums;
}

function addSums(target, raw) {
    columns.forEach(function (col) {
        if (col.kind === 'amount') target[col.key] += num(raw[col.key]);
    });
}

function groupName(raw) {
    var value = pick(raw, ['Asset Group', 'AssetGroup', 'AssetGroupName']);
    return String(value == null || value === '' ? '(Blank)' : value);
}

function typeName(raw) {
    var value = pick(raw, ['Asset Type', 'AssetType', 'AssetTypeName']);
    return String(value == null || value === '' ? '(Blank)' : value);
}

/* ---------- data ---------- */

function loadChart() {
    var dates = readDateFilters();
    if (!dates) return;

    expandedGroups = {};
    expandedTypes = {};
    $('#tblDepreciationChartBody').html(
        '<tr class="dc-state-row"><td colspan="' + colCount() + '"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>');
    DepreciationChartService.GetDepreciationChart(dates.fromDate, dates.toDate).then(function (res) {
        var rows = unwrap(res);
        if (rows.length) detectColumns(rows);
        renderHeader();
        buildTree(rows);
        renderGrid();
    }).catch(function (err) {
        var raw = (err && err.xhr && err.xhr.responseText) || (err && err.message) || 'Unable to load Depreciation Chart.';
        var msg = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        $('#tblDepreciationChartBody').html(
            '<tr class="dc-state-row dc-state-row--error"><td colspan="' + colCount() + '"><i class="fas fa-triangle-exclamation"></i> ' + escHtml(msg) + '</td></tr>');
        if (window.toastr) { toastr.error(msg); }
    });
}

function buildTree(rows) {
    var groupMap = {};
    tree = [];
    rows.forEach(function (raw) {
        var group = groupName(raw);
        var type = typeName(raw);
        var groupCode = pick(raw, ['AssetGroupMaster_Code']) || 0;
        var typeCode = pick(raw, ['AssetTypeMaster_Code']) || 0;
        var gKey = 'g' + groupCode + '~' + group;
        var g = groupMap[gKey];
        if (!g) {
            g = { key: gKey, name: group, sums: emptySums(), types: [], typeMap: {} };
            groupMap[gKey] = g;
            tree.push(g);
        }
        var tKey = gKey + '|t' + typeCode + '~' + type;
        var t = g.typeMap[tKey];
        if (!t) {
            t = { key: tKey, name: type, sums: emptySums(), assets: [] };
            g.typeMap[tKey] = t;
            g.types.push(t);
        }
        t.assets.push({ raw: raw });
        addSums(t.sums, raw);
        addSums(g.sums, raw);
    });
}

/* ---------- filtering ---------- */

function assetText(asset) {
    return columns.map(function (col) { return asset.raw[col.key] == null ? '' : asset.raw[col.key]; }).join(' ');
}

function assetMatches(asset, q) {
    return assetText(asset).toLowerCase().indexOf(q) >= 0;
}

function copySums(assets) {
    var sums = emptySums();
    assets.forEach(function (asset) { addSums(sums, asset.raw); });
    return sums;
}

function getVisibleTree() {
    if (!searchText) return tree;
    var q = searchText;
    var out = [];
    tree.forEach(function (g) {
        var groupHit = g.name.toLowerCase().indexOf(q) >= 0;
        var types = [];
        g.types.forEach(function (t) {
            var typeHit = groupHit || t.name.toLowerCase().indexOf(q) >= 0;
            var assets = typeHit ? t.assets : t.assets.filter(function (asset) { return assetMatches(asset, q); });
            if (assets.length) types.push({ key: t.key, name: t.name, assets: assets, sums: copySums(assets) });
        });
        if (types.length) {
            var sums = emptySums();
            types.forEach(function (t) {
                columns.forEach(function (col) {
                    if (col.kind === 'amount') sums[col.key] += t.sums[col.key] || 0;
                });
            });
            out.push({ key: g.key, name: g.name, types: types, sums: sums });
        }
    });
    return out;
}

/* ---------- render ---------- */

function renderHeader() {
    if (!columns.length) return;
    var html = columns.map(function (col) {
        return '<th' + headerClass(col.kind) + '>' + escHtml(col.key) + '</th>';
    }).join('');
    $('#tblDepreciationChart thead').html('<tr>' + html + '</tr>');
}

function summaryCells(labelHtml, labelIndex, extraIndex, extraHtml, sums) {
    return columns.map(function (col, index) {
        if (index === labelIndex) return '<td>' + labelHtml + '</td>';
        if (extraIndex >= 0 && index === extraIndex) return '<td class="dc-cell-meta">' + extraHtml + '</td>';
        if (col.kind === 'amount') return '<td class="dc-num dc-amt">' + formatAmt(sums[col.key] || 0) + '</td>';
        return '<td class="dc-cell-empty"></td>';
    }).join('');
}

function renderGrid() {
    var data = getVisibleTree();
    var forceOpen = !!searchText;
    var html = [];
    var groupIndex = columnIndex(function (n) { return n === 'assetgroup'; });
    var typeIndex = columnIndex(function (n) { return n === 'assettype'; });
    if (groupIndex < 0) groupIndex = 0;
    if (typeIndex === groupIndex) typeIndex = -1;

    data.forEach(function (g) {
        var gOpen = forceOpen || !!expandedGroups[g.key];

        html.push(
            '<tr class="dc-row dc-row-group' + (gOpen ? ' is-open' : '') + '" tabindex="0" data-kind="group" data-key="' + escHtml(g.key) + '" aria-expanded="' + gOpen + '">' +
            summaryCells(
                '<span class="dc-toggle" aria-hidden="true"></span><span class="dc-name">' + escHtml(g.name) + '</span>',
                groupIndex,
                typeIndex,
                '<span class="dc-pill">' + g.types.length + ' type' + (g.types.length === 1 ? '' : 's') + '</span>',
                g.sums
            ) + '</tr>');

        if (!gOpen) return;

        g.types.forEach(function (t) {
            var tOpen = forceOpen || !!expandedTypes[t.key];
            html.push(
                '<tr class="dc-row dc-row-type' + (tOpen ? ' is-open' : '') + '" tabindex="0" data-kind="type" data-key="' + escHtml(t.key) + '" aria-expanded="' + tOpen + '">' +
                summaryCells(
                    '<span class="dc-toggle" aria-hidden="true"></span><span class="dc-name">' + escHtml(t.name) + '</span>',
                    typeIndex < 0 ? groupIndex : typeIndex,
                    -1,
                    '',
                    t.sums
                ) + '</tr>');

            if (!tOpen) return;

            t.assets.forEach(function (asset) {
                html.push('<tr class="dc-row dc-row-asset">' + columns.map(function (col, index) {
                    if (index === groupIndex || index === typeIndex) return '<td class="dc-cell-empty"></td>';
                    return '<td' + cellClass(col.kind) + '>' + formatCell(col.kind, asset.raw[col.key]) + '</td>';
                }).join('') + '</tr>');
            });
        });
    });

    if (!data.length) {
        html.push('<tr class="dc-state-row"><td colspan="' + colCount() + '"><i class="fas fa-box-open"></i> ' +
            (searchText ? 'No assets match your search.' : 'No assets found for the selected dates.') + '</td></tr>');
    }

    $('#tblDepreciationChartBody').html(html.join(''));
    applyColumnExpand();
}

function applyColumnExpand() {
    var $table = $('#tblDepreciationChart');
    if (window.innerWidth > 768 && window.bizsolEnableManualColumnExpand) {
        $table.addClass('bizsol-col-expand');
        window.bizsolEnableManualColumnExpand('tblDepreciationChart');
        return;
    }
    $table.removeClass('bizsol-col-expand bizsol-manual-cols');
    $table.find('.bizsol-col-resize').remove();
    $table.css('width', '');
    $table.find('th, td').css({ width: '', minWidth: '', maxWidth: '', overflow: '', textOverflow: '' });
}

function toggleRow($tr) {
    var key = String($tr.attr('data-key'));
    var store = $tr.attr('data-kind') === 'group' ? expandedGroups : expandedTypes;
    if (searchText) return;
    if (store[key]) { delete store[key]; } else { store[key] = true; }
    renderGrid();
    $('#tblDepreciationChartBody tr[data-key="' + key.replace(/"/g, '\\"') + '"]').trigger('focus');
}

function setAllExpanded(open) {
    expandedGroups = {};
    expandedTypes = {};
    if (open) {
        tree.forEach(function (g) {
            expandedGroups[g.key] = true;
            g.types.forEach(function (t) { expandedTypes[t.key] = true; });
        });
    }
    renderGrid();
}
