import { DepreciationChartService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DepreciationChartService.js';

var COL_COUNT = 8;
var allRows = [];          // flat rows from API (normalized)
var tree = [];             // [{ key, name, total, typeCount, assetCount, types: [{ key, name, total, assets: [] }] }]
var expandedGroups = {};   // key -> true
var expandedTypes = {};    // key -> true
var searchText = '';

$(document).ready(function () {
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

    loadChart();
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

function formatAmt(v) {
    return num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLife(v) {
    if (v === undefined || v === null || v === '') return '';
    var n = parseFloat(v);
    if (isNaN(n)) return escHtml(v);
    return String(Math.round(n * 100) / 100);
}

/** Same as Assets Master list — ISO / API dates → dd-mm-yyyy */
function formatDisplayDatePlain(val) {
    if (val == null || val === '') return '';
    var s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        var iso = s.substring(0, 10);
        var p = iso.split('-');
        return p[2] + '-' + p[1] + '-' + p[0];
    }
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/i.test(s)) {
        return s;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        return s;
    }
    return s;
}

function escHtml(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Five empty cells so each detail column width follows that column's data (no colspan). */
function emptyDetailCells() {
    return '<td class="dc-cell-empty"></td><td class="dc-cell-empty"></td><td class="dc-cell-empty"></td>' +
        '<td class="dc-cell-empty"></td><td class="dc-cell-empty"></td>';
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

function normalizeRows(list) {
    return list.map(function (r) {
        return {
            groupCode: pick(r, ['AssetGroupMaster_Code']) || 0,
            group: String(pick(r, ['AssetGroup', 'AssetGroupName']) || '(Blank)'),
            typeCode: pick(r, ['AssetTypeMaster_Code']) || 0,
            type: String(pick(r, ['AssetType', 'AssetTypeName']) || '(Blank)'),
            code: pick(r, ['AssetsMaster_Code', 'Code']) || 0,
            refNo: String(pick(r, ['RefNo']) || ''),
            tagNo: String(pick(r, ['AssetTagNo']) || ''),
            life: pick(r, ['AssetLife']),
            dop: String(pick(r, ['DateOfPurchase']) || ''),
            putToUse: String(pick(r, ['PutToUseDate']) || ''),
            gross: num(pick(r, ['GrossBlock', 'AssetValue']))
        };
    });
}

/* ---------- data ---------- */

function loadChart() {
    $('#tblDepreciationChartBody').html(
        '<tr class="dc-state-row"><td colspan="' + COL_COUNT + '"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>');
    DepreciationChartService.GetDepreciationChart().then(function (res) {
        allRows = normalizeRows(unwrap(res));
        buildTree();
        renderGrid();
    }).catch(function (err) {
        var msg = (err && (err.responseText || err.message)) || 'Unable to load Depreciation Chart.';
        $('#tblDepreciationChartBody').html(
            '<tr class="dc-state-row dc-state-row--error"><td colspan="' + COL_COUNT + '"><i class="fas fa-triangle-exclamation"></i> ' + escHtml(msg) + '</td></tr>');
        if (window.toastr) { toastr.error(msg); }
    });
}

function buildTree() {
    var groupMap = {};
    tree = [];
    allRows.forEach(function (r) {
        var gKey = 'g' + r.groupCode + '~' + r.group;
        var g = groupMap[gKey];
        if (!g) {
            g = { key: gKey, name: r.group, total: 0, assetCount: 0, types: [], typeMap: {} };
            groupMap[gKey] = g;
            tree.push(g);
        }
        var tKey = gKey + '|t' + r.typeCode + '~' + r.type;
        var t = g.typeMap[tKey];
        if (!t) {
            t = { key: tKey, name: r.type, total: 0, assets: [] };
            g.typeMap[tKey] = t;
            g.types.push(t);
        }
        t.assets.push(r);
        t.total += r.gross;
        g.total += r.gross;
        g.assetCount++;
    });
}

/* ---------- filtering ---------- */

function assetMatches(a, q) {
    return (a.refNo + ' ' + a.tagNo + ' ' + a.dop + ' ' + a.putToUse + ' ' + (a.life === undefined || a.life === null ? '' : a.life))
        .toLowerCase().indexOf(q) >= 0;
}

/** Returns a filtered copy of the tree (or the full tree when no search text). */
function getVisibleTree() {
    if (!searchText) return tree;
    var q = searchText;
    var out = [];
    tree.forEach(function (g) {
        var groupHit = g.name.toLowerCase().indexOf(q) >= 0;
        var types = [];
        g.types.forEach(function (t) {
            var typeHit = groupHit || t.name.toLowerCase().indexOf(q) >= 0;
            var assets = typeHit ? t.assets : t.assets.filter(function (a) { return assetMatches(a, q); });
            if (assets.length) {
                types.push({
                    key: t.key, name: t.name, assets: assets,
                    total: assets.reduce(function (s, a) { return s + a.gross; }, 0)
                });
            }
        });
        if (types.length) {
            out.push({
                key: g.key, name: g.name, types: types,
                total: types.reduce(function (s, t) { return s + t.total; }, 0),
                assetCount: types.reduce(function (s, t) { return s + t.assets.length; }, 0)
            });
        }
    });
    return out;
}

/* ---------- render ---------- */

function renderGrid() {
    var data = getVisibleTree();
    var forceOpen = !!searchText;
    var html = [];
    var grand = 0, typeTotal = 0;

    data.forEach(function (g) {
        var gOpen = forceOpen || !!expandedGroups[g.key];
        grand += g.total;
        typeTotal += g.types.length;

        html.push(
            '<tr class="dc-row dc-row-group' + (gOpen ? ' is-open' : '') + '" tabindex="0" data-kind="group" data-key="' + escHtml(g.key) + '" aria-expanded="' + gOpen + '">' +
            '<td class="dc-cell-group"><span class="dc-toggle" aria-hidden="true"></span><span class="dc-name">' + escHtml(g.name) + '</span></td>' +
            '<td class="dc-cell-type dc-cell-meta"><span class="dc-pill">' + g.types.length + ' type' + (g.types.length === 1 ? '' : 's') + '</span></td>' +
            emptyDetailCells() +
            '<td class="dc-num dc-amt">' + formatAmt(g.total) + '</td></tr>');

        if (!gOpen) return;

        g.types.forEach(function (t) {
            var tOpen = forceOpen || !!expandedTypes[t.key];
            html.push(
                '<tr class="dc-row dc-row-type' + (tOpen ? ' is-open' : '') + '" tabindex="0" data-kind="type" data-key="' + escHtml(t.key) + '" aria-expanded="' + tOpen + '">' +
                '<td class="dc-cell-indent"></td>' +
                '<td class="dc-cell-type"><span class="dc-toggle" aria-hidden="true"></span><span class="dc-name">' + escHtml(t.name) + '</span></td>' +
                emptyDetailCells() +
                '<td class="dc-num dc-amt">' + formatAmt(t.total) + '</td></tr>');

            if (!tOpen) return;

            t.assets.forEach(function (a) {
                html.push(
                    '<tr class="dc-row dc-row-asset">' +
                    '<td class="dc-cell-indent"></td><td class="dc-cell-indent"></td>' +
                    '<td class="dc-cell-ref">' + escHtml(a.refNo) + '</td>' +
                    '<td>' + escHtml(a.tagNo) + '</td>' +
                    '<td class="dc-num">' + formatLife(a.life) + '</td>' +
                    '<td class="dc-center">' + escHtml(formatDisplayDatePlain(a.dop)) + '</td>' +
                    '<td class="dc-center">' + escHtml(formatDisplayDatePlain(a.putToUse)) + '</td>' +
                    '<td class="dc-num dc-amt">' + formatAmt(a.gross) + '</td></tr>');
            });
        });
    });

    if (!data.length) {
        html.push('<tr class="dc-state-row"><td colspan="' + COL_COUNT + '"><i class="fas fa-box-open"></i> ' +
            (searchText ? 'No assets match your search.' : 'No assets found.') + '</td></tr>');
    }

    $('#tblDepreciationChartBody').html(html.join(''));
    $('#dcFootTotal').text(formatAmt(grand));
    $('#dcStatGroups').text(data.length);
    $('#dcStatTypes').text(typeTotal);
    $('#dcStatTotal').text(formatAmt(grand));
}

function toggleRow($tr) {
    var key = String($tr.attr('data-key'));
    var store = $tr.attr('data-kind') === 'group' ? expandedGroups : expandedTypes;
    if (searchText) return; // everything matching is already expanded while searching
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
