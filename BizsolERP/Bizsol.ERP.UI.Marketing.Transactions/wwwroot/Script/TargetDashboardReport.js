import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { TargetDashboardReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TargetDashboardReportService.js';

const TILES = [
    { id: 'itemLocation', group: 'sales', mode: 'ITEMVSLOCATIONWISESALE', title: 'Item vs Location Sale', icon: 'fa-map-location-dot', theme: 'indigo', amountKeys: ['Sales Amount'] },
    { id: 'itemMkt', group: 'sales', mode: 'ITEMVSMKTNAMEWISESALE', title: 'Item vs MKT Name Sale', icon: 'fa-user-tie', theme: 'sky', amountKeys: ['Sales Amount'] },
    { id: 'itemSale', group: 'sales', mode: 'ITEMWISESALE', title: 'Itemwise Sale', icon: 'fa-boxes-stacked', theme: 'emerald', amountKeys: ['Sales Amount'] },
    { id: 'itemReturn', group: 'sales', mode: 'ITEMWISESALERETURN', title: 'Itemwise Sale Return', icon: 'fa-rotate-left', theme: 'rose', amountKeys: ['Sales Return Amount'] },
    { id: 'expired', group: 'returns', mode: 'SALERETURNEXPIREDVSNONEXPIRED', title: 'Sale Return Expired vs Non-Expired', icon: 'fa-triangle-exclamation', theme: 'amber', amountKeys: ['Sales Return Amount'], wide: true },
    { id: 'monthArchive', group: 'targets', mode: 'MONTHWISETARGETVSARCHIVE', title: 'Month wise Target vs Archive', icon: 'fa-calendar-days', theme: 'violet', special: 'monthArchive', wide: true }
];

const SECTIONS = [
    { id: 'sales', title: 'Sales' },
    { id: 'returns', title: 'Returns' },
    { id: 'targets', title: 'Targets' }
];

const HIDDEN_COLUMNS = {
    monthArchive: ['M5 Label', 'M4 Label', 'M3 Label', 'M2 Label', 'M1 Label', 'M0 Label']
};

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];

    const named = ['data', 'Data', 'result', 'Result', 'table', 'Table', 'items', 'Items', '$values'];
    for (let i = 0; i < named.length; i++) {
        if (Array.isArray(payload[named[i]])) return payload[named[i]];
    }

    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
        const value = payload[keys[i]];
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            return value;
        }
    }
    return [];
}

function rowsFromDashboard(payload, names) {
    if (!payload || typeof payload !== 'object') return [];
    for (let i = 0; i < names.length; i++) {
        const key = names[i];
        if (payload[key] !== undefined) return firstPayloadArray(payload[key]);
        const found = Object.keys(payload).find(function (k) {
            return k.toLowerCase() === String(key).toLowerCase();
        });
        if (found) return firstPayloadArray(payload[found]);
    }
    return [];
}

function pick(row, names, fallback) {
    if (!row) return fallback;
    for (let i = 0; i < names.length; i++) {
        const key = names[i];
        if (row[key] !== undefined && row[key] !== null && String(row[key]) !== '') {
            return row[key];
        }
        const found = Object.keys(row).find(function (k) {
            return k.toLowerCase() === String(key).toLowerCase();
        });
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]) !== '') {
            return row[found];
        }
    }
    return fallback;
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'string' && value.trim().toUpperCase() === 'N/A') return 0;
    const num = Number(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
}

function escapeHtml(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
}

function formatDisplayDate(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const parts = raw.substring(0, 10).split('-');
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(value) {
    return '₹' + toNumber(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatNumber(value) {
    return toNumber(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getSelectedFromDate() {
    return String($('#txtFromDate').val() || '').trim();
}

function getSelectedToDate() {
    return String($('#txtToDate').val() || '').trim();
}

function bindDefaultDates() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(formatDate(firstOfMonth));
    $('#txtToDate').val(formatDate(today));
}

function buildFinYear(fromDate) {
    const year = parseInt(String(fromDate || '').split('-')[0], 10);
    return year ? year + '-' + (year + 1) : '';
}

function isAmountColumn(name) {
    const key = String(name || '').toLowerCase().replace(/\s+/g, '');
    return key.indexOf('amount') >= 0 || key.indexOf('target') >= 0 || key.indexOf('archive') >= 0 || key.indexOf('sale') >= 0;
}

function isQtyColumn(name) {
    const key = String(name || '').toLowerCase();
    return key.indexOf('qty') >= 0 || key.indexOf('pcs') >= 0 || key.indexOf('crate') >= 0;
}

function isNameColumn(name) {
    const key = String(name || '').toLowerCase();
    return key.indexOf('name') >= 0 || key.indexOf('location') >= 0 || key.indexOf('item') >= 0 || key.indexOf('dealer') >= 0 || key.indexOf('warehouse') >= 0 || key.indexOf('type') >= 0;
}

function columnClass(columnName, isFirst) {
    const classes = [];
    if (isNameColumn(columnName)) classes.push('tdr-col-text');
    if (isAmountColumn(columnName) || isQtyColumn(columnName) || columnName === 'Achievement') classes.push('tdr-col-num');
    if (isFirst) classes.push('tdr-sticky-col');
    return classes.length ? ' class="' + classes.join(' ') + '"' : '';
}

function applyDatePreset(preset) {
    const today = new Date();
    let from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let to = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'week') {
        from.setDate(to.getDate() - 6);
    } else if (preset === 'month') {
        from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'lastMonth') {
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    $('#txtFromDate').val(formatDate(from));
    $('#txtToDate').val(formatDate(to));
    $('#tdrPresets .tdr-chip').removeClass('is-active');
    $('#tdrPresets .tdr-chip[data-preset="' + preset + '"]').addClass('is-active');
}

function syncPresetFromDates() {
    const fromDate = getSelectedFromDate();
    const toDate = getSelectedToDate();
    const today = formatDate(new Date());
    const firstOfMonth = formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const lastMonthStart = formatDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
    const lastMonthEnd = formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
    const weekStart = formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 6));

    let preset = '';
    if (fromDate === today && toDate === today) preset = 'today';
    else if (fromDate === weekStart && toDate === today) preset = 'week';
    else if (fromDate === firstOfMonth && toDate === today) preset = 'month';
    else if (fromDate === lastMonthStart && toDate === lastMonthEnd) preset = 'lastMonth';

    $('#tdrPresets .tdr-chip').removeClass('is-active');
    if (preset) {
        $('#tdrPresets .tdr-chip[data-preset="' + preset + '"]').addClass('is-active');
    }
}

function visibleColumns(rows, tile) {
    if (!rows || !rows.length) return [];
    const hidden = []
        .concat(HIDDEN_COLUMNS[tile.special] || [])
        .concat(HIDDEN_COLUMNS[tile.id] || [])
        .map(function (c) { return c.toLowerCase(); });
    return Object.keys(rows[0]).filter(function (key) {
        if (key.charAt(0) === '_') return false;
        return hidden.indexOf(String(key).toLowerCase()) === -1;
    });
}
function monthArchiveColumns(rows) {
    if (!rows || !rows.length) return [];
    const row = rows[0];
    const labels = ['M5', 'M4', 'M3', 'M2', 'M1', 'M0'].map(function (key) {
        return pick(row, [key + ' Label'], key);
    });
    const columns = [{ key: pickKey(row, ['MKT Name', 'MKTName']), title: 'MKT Name' }];
    ['M5', 'M4', 'M3', 'M2', 'M1', 'M0'].forEach(function (key, index) {
        columns.push({ key: pickKey(row, [key + ' Target']), title: labels[index] + ' Target' });
        columns.push({ key: pickKey(row, [key + ' Archive']), title: labels[index] + ' Archive' });
    });
    return columns.filter(function (col) { return !!col.key; });
}

function pickKey(row, names) {
    for (let i = 0; i < names.length; i++) {
        if (row[names[i]] !== undefined) return names[i];
        const found = Object.keys(row).find(function (k) {
            return k.toLowerCase() === String(names[i]).toLowerCase();
        });
        if (found) return found;
    }
    return '';
}

function sumByKeys(rows, keys) {
    let total = 0;
    (rows || []).forEach(function (row) {
        (keys || []).forEach(function (key) {
            total += toNumber(pick(row, [key], 0));
        });
    });
    return total;
}

function achievementBadge(pct) {
    const tone = pct >= 80 ? 'good' : (pct >= 40 ? 'mid' : 'low');
    return '<span class="tdr-badge tdr-badge-' + tone + '">' + pct.toFixed(1) + '%</span>';
}

function initials(value) {
    const text = String(value || '').trim();
    if (!text) return '?';
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
}

function personHtml(value) {
    if (value === null || value === undefined || value === '') {
        return '<span class="tdr-na">—</span>';
    }
    return '<div class="tdr-person"><span class="tdr-avatar">' + escapeHtml(initials(value)) + '</span><span>' + escapeHtml(value) + '</span></div>';
}

function cellHtml(value, columnName, barPct, asPerson) {
    if (asPerson) {
        return personHtml(value);
    }
    if (columnName === 'Achievement') {
        return achievementBadge(toNumber(value));
    }
    if (value === null || value === undefined || value === '') {
        return '<span class="tdr-na">—</span>';
    }
    if (isAmountColumn(columnName)) {
        const width = Math.max(0, Math.min(barPct || 0, 100));
        const bar = width > 0
            ? '<span class="tdr-amt-bar"><i style="width:' + width + '%"></i></span>'
            : '';
        return '<div class="tdr-amt-cell"><span class="tdr-amt">' + formatAmount(value) + '</span>' + bar + '</div>';
    }
    if (isQtyColumn(columnName) || typeof value === 'number') {
        return formatNumber(value);
    }
    return escapeHtml(value);
}

function renderTable(rows, tile) {
    if (!rows || !rows.length) {
        return '<div class="tdr-tile-empty"><i class="fas fa-inbox"></i><span>No data for this period</span></div>';
    }

    const workingRows = rows.slice();
    let columns;
    if (tile.special === 'monthArchive' && looksLikeMonthArchive(workingRows)) {
        columns = monthArchiveColumns(workingRows).map(function (col) {
            return { key: col.key, title: col.title };
        });
    } else {
        columns = visibleColumns(workingRows, tile).map(function (key) {
            return { key: key, title: key };
        });
    }

    if (!columns.length) {
        return '<div class="tdr-tile-empty"><i class="fas fa-inbox"></i><span>No data for this period</span></div>';
    }

    const amountMax = {};
    columns.forEach(function (col) {
        if (!isAmountColumn(col.title)) return;
        let max = 0;
        workingRows.forEach(function (row) {
            max = Math.max(max, toNumber(row[col.key]));
        });
        amountMax[col.key] = max;
    });

    const head = columns.map(function (col, index) {
        const kind = (isAmountColumn(col.title) || isQtyColumn(col.title)) ? 'num' : 'text';
        return '<th' + columnClass(col.title, index === 0) + '>' +
            '<div class="tdr-th-inner">' +
            '<span class="tdr-th-label">' + escapeHtml(col.title) + '</span>' +
            '<button type="button" class="tdr-col-filter" data-col-index="' + index + '" data-kind="' + kind + '" aria-label="Filter ' + escapeHtml(col.title) + '">' +
            '<i class="fa-solid fa-angle-down"></i></button>' +
            '</div></th>';
    }).join('');

    const body = workingRows.map(function (row) {
        const cells = columns.map(function (col, index) {
            const max = amountMax[col.key] || 0;
            const barPct = max > 0 ? (toNumber(row[col.key]) / max) * 100 : 0;
            const asPerson = index === 0 && /location|mkt|dealer|warehouse/i.test(col.title);
            const raw = row[col.key];
            const rawText = raw === null || raw === undefined ? '' : String(raw);
            const numeric = isAmountColumn(col.title) || isQtyColumn(col.title) || typeof raw === 'number';
            return '<td' + columnClass(col.title, index === 0) + ' data-raw="' + escapeHtml(rawText) + '"' +
                (numeric ? ' data-num="' + toNumber(raw) + '"' : '') + '>' +
                cellHtml(raw, col.title, barPct, asPerson) + '</td>';
        }).join('');
        return '<tr>' + cells + '</tr>';
    }).join('');

    return '<div class="tdr-table-wrap"><table class="table table-striped table-hover tdr-table"><thead><tr>' +
        head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
}

function freezeTableHeaders() {
    $('#tdrTileGrid .tdr-table-wrap').each(function () {
        const wrap = this;
        if (wrap.querySelector('.tdr-freeze-body')) return;
        const table = wrap.querySelector('table');
        const thead = table && table.querySelector('thead');
        const firstRow = table && table.querySelector('tbody tr');
        if (!thead || !firstRow) return;

        const headRow = thead.querySelector('tr');
        const widths = Array.prototype.map.call(firstRow.children, function (cell, index) {
            const headCell = headRow && headRow.children[index];
            const bodyWidth = Math.ceil(cell.getBoundingClientRect().width);
            const headWidth = headCell ? Math.ceil(headCell.getBoundingClientRect().width) : 0;
            return Math.max(bodyWidth, headWidth);
        });

        const headWrap = document.createElement('div');
        headWrap.className = 'tdr-freeze-head';
        const headTable = table.cloneNode(false);
        headTable.appendChild(thead);
        headWrap.appendChild(headTable);

        const scroll = document.createElement('div');
        scroll.className = 'tdr-freeze-body';
        scroll.appendChild(table);
        wrap.appendChild(headWrap);
        wrap.appendChild(scroll);

        const total = widths.reduce(function (sum, width) { return sum + width; }, 0);
        headTable.style.width = total + 'px';
        headTable.style.minWidth = total + 'px';
        table.style.width = total + 'px';
        table.style.minWidth = total + 'px';

        function lockCells(row) {
            Array.prototype.forEach.call(row.children, function (cell, index) {
                const width = widths[index] || 0;
                cell.style.width = width + 'px';
                cell.style.minWidth = width + 'px';
                cell.style.maxWidth = width + 'px';
            });
        }
        lockCells(headTable.querySelector('tr'));
        Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), lockCells);

        scroll.addEventListener('scroll', function () {
            headWrap.scrollLeft = scroll.scrollLeft;
            closeColumnFilter();
        });
        headWrap.style.paddingRight = (scroll.offsetWidth - scroll.clientWidth) + 'px';
    });
}

function tileMeta(tile, rows) {
    const count = (rows || []).length;
    const countText = count + (count === 1 ? ' record' : ' records');
    if (tile.special === 'monthArchive') {
        return countText;
    }
    const amount = sumByKeys(rows, tile.amountKeys || []);
    if ((tile.amountKeys || []).length) {
        return countText + '  ·  ' + formatAmount(amount);
    }
    return countText;
}

function looksLikeMonthArchive(rows) {
    const row = rows && rows[0];
    if (!row) return false;
    return Object.keys(row).some(function (key) {
        return /m[0-5]\s*(target|archive|label)/i.test(key);
    });
}

function renderTile(tile, results) {
    const pack = (results && results[tile.id]) || { rows: [], failed: false };
    let rows = pack.rows || [];
    if (tile.id === 'itemReturn' && looksLikeMonthArchive(rows)) {
        rows = [];
    }
    const body = pack.failed
            ? '<div class="tdr-tile-empty"><i class="fas fa-triangle-exclamation"></i><span>Unable to load this tile</span></div>'
        : renderTable(rows, tile);
    const search = rows.length
        ? '<input type="search" class="tdr-tile-search" placeholder="Search..." aria-label="Search ' + escapeHtml(tile.title) + '" />'
        : '';
    return '<section class="tdr-tile tdr-theme-' + tile.theme + (tile.wide ? ' tdr-tile-wide' : '') + '" id="tile-' + tile.id + '">' +
        '<div class="tdr-tile-head">' +
        '<div class="tdr-tile-icon"><i class="fas ' + tile.icon + '"></i></div>' +
        '<div class="tdr-tile-title">' +
        '<h4>' + escapeHtml(tile.title) + '</h4>' +
        '<span>' + escapeHtml(tileMeta(tile, rows)) + '</span>' +
        '</div>' +
        search +
        '</div>' +
        '<div class="tdr-tile-body">' + body + '</div>' +
        '</section>';
}

function renderTiles(results) {
    const html = SECTIONS.map(function (section) {
        const tiles = TILES.filter(function (tile) { return tile.group === section.id; });
        return '<div class="tdr-section tdr-section-' + section.id + '">' +
            '<div class="tdr-section-label"><span>' + escapeHtml(section.title) + '</span><em id="tdrMeta-' + section.id + '"></em></div>' +
            '<div class="tdr-section-grid">' +
            tiles.map(function (tile) { return renderTile(tile, results); }).join('') +
            '</div>' +
            '</div>';
    }).join('');
    $('#tdrTileGrid').html(html);
}

function setShowLoading(isLoading) {
    $('#btnShowData').prop('disabled', isLoading);
    $('#btnShowDataText').text(isLoading ? 'Loading...' : 'Show Data');
}

function showEmpty(message) {
    $('#tdrDashboard').hide();
    $('#tdrEmptyState').show();
    if (message) {
        $('#tdrEmptyState p').html(message);
    }
}

function showDashboard() {
    $('#tdrEmptyState').hide();
    $('#tdrDashboard').show();
}

function mapDashboardResponse(response) {
    const payload = response && (response.Data || response.data || response);
    const itemReturnRows = rowsFromDashboard(payload, ['ItemwiseSaleReturn']);
    const monthRows = rowsFromDashboard(payload, ['MonthWiseTargetVsArchive']);
    return {
        itemLocation: { id: 'itemLocation', rows: rowsFromDashboard(payload, ['ItemVsLocationWiseSale']), failed: false },
        itemMkt: { id: 'itemMkt', rows: rowsFromDashboard(payload, ['ItemVsMktNameWiseSale']), failed: false },
        itemSale: { id: 'itemSale', rows: rowsFromDashboard(payload, ['ItemwiseSale']), failed: false },
        itemReturn: { id: 'itemReturn', rows: looksLikeMonthArchive(itemReturnRows) ? [] : itemReturnRows, failed: false },
        expired: { id: 'expired', rows: rowsFromDashboard(payload, ['SaleReturnExpiredVsNonExpired']), failed: false },
        monthArchive: { id: 'monthArchive', rows: monthRows.length ? monthRows : (looksLikeMonthArchive(itemReturnRows) ? itemReturnRows : []), failed: false }
    };
}

function showData() {
    const fromDate = getSelectedFromDate();
    const toDate = getSelectedToDate();

    if (!fromDate) {
        toastr.error('Please select From Date.');
        $('#txtFromDate').focus();
        return;
    }
    if (!toDate) {
        toastr.error('Please select To Date.');
        $('#txtToDate').focus();
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.error('To Date cannot be earlier than From Date.');
        $('#txtToDate').focus();
        return;
    }

    const finYear = buildFinYear(fromDate);
    setShowLoading(true);
    if (typeof window.Showloader === 'function') window.Showloader();

    TargetDashboardReportService.GetDashboard(fromDate, toDate, 0, finYear).then(function (response) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);

        const status = response && (response.Status || response.status);
        if (status && String(status).toUpperCase() === 'N') {
            showEmpty((response.Msg || response.message) || 'Unable to load Target Dashboard data.');
            toastr.error((response.Msg || response.message) || 'Unable to load Target Dashboard data.');
            return;
        }

        const results = mapDashboardResponse(response);
        const anyData = TILES.some(function (tile) {
            return results[tile.id] && results[tile.id].rows && results[tile.id].rows.length;
        });

        renderTiles(results);
        showDashboard();
        freezeTableHeaders();
        if (!anyData) {
            toastr.info('No data found for ' + formatDisplayDate(fromDate) + ' – ' + formatDisplayDate(toDate) + '.');
        }
    }).catch(function (error) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);
        const message = (error && (error.Msg || error.message)) || 'Unable to load Target Dashboard data.';
        showEmpty(escapeHtml(message));
        toastr.error(message);
    });
}

function resetDashboard() {
    bindDefaultDates();
    $('#tdrTileGrid').empty();
    applyDatePreset('month');
    showEmpty('Pick dates or a quick chip, then click <strong>Show Data</strong>.');
}

let filterAnchor = null;

function closeColumnFilter() {
    filterAnchor = null;
    $('#tdrColFilterPop').remove();
}

function sameNum(a, b) {
    return Math.abs(a - b) < 0.0001;
}

function rowMatchesFilter(row, index, rule) {
    const cell = row.children().eq(Number(index));
    if (rule.kind === 'num') {
        const num = toNumber(cell.attr('data-num'));
        if (rule.op === 'greater') return num > rule.a;
        if (rule.op === 'less') return num < rule.a;
        if (rule.op === 'between') {
            const low = Math.min(rule.a, rule.b);
            const high = Math.max(rule.a, rule.b);
            return num >= low && num <= high;
        }
        return sameNum(num, rule.a);
    }
    const raw = String(cell.attr('data-raw') || '');
    return (rule.values || []).indexOf(raw) >= 0;
}

function applyTileView(tile) {
    const query = String(tile.find('.tdr-tile-search').val() || '').toLowerCase();
    const filters = tile.data('colFilters') || {};
    const keys = Object.keys(filters);
    tile.find('tbody tr').each(function () {
        const row = $(this);
        let show = !query || row.text().toLowerCase().indexOf(query) >= 0;
        for (let i = 0; i < keys.length && show; i++) {
            show = rowMatchesFilter(row, keys[i], filters[keys[i]]);
        }
        row.toggle(show);
    });
    tile.find('.tdr-col-filter').each(function () {
        const idx = String($(this).attr('data-col-index'));
        $(this).toggleClass('is-on', !!filters[idx]);
    });
}

function sortTileColumn(tile, index, order, kind) {
    const tbody = tile.find('tbody');
    const rows = tbody.children('tr').get();
    rows.sort(function (a, b) {
        const left = $(a).children().eq(index);
        const right = $(b).children().eq(index);
        if (kind === 'num') {
            const diff = toNumber(left.attr('data-num')) - toNumber(right.attr('data-num'));
            return order === 'asc' ? diff : -diff;
        }
        const textDiff = String(left.attr('data-raw') || '').localeCompare(String(right.attr('data-raw') || ''));
        return order === 'asc' ? textDiff : -textDiff;
    });
    tbody.append(rows);
}

function uniqueColumnValues(tile, index) {
    const seen = {};
    const values = [];
    tile.find('tbody tr').each(function () {
        const raw = String($(this).children().eq(index).attr('data-raw') || '');
        if (seen[raw]) return;
        seen[raw] = true;
        values.push(raw);
    });
    values.sort(function (a, b) { return a.localeCompare(b); });
    return values;
}

function textFilterBox(tile, index, rule) {
    const selected = rule && rule.kind === 'text' ? rule.values : null;
    const box = $('<div class="tdr-filter-box"></div>');
    box.append('<input type="search" class="tdr-filter-find form-control form-control-sm" placeholder="Search..." />');
    const list = $('<div class="tdr-filter-list"></div>');
    list.append('<label class="tdr-filter-all-row"><input type="checkbox" class="tdr-filter-all" checked /> Select all</label>');
    let allChecked = true;
    uniqueColumnValues(tile, index).forEach(function (value) {
        const checked = !selected || selected.indexOf(value) >= 0;
        if (!checked) allChecked = false;
        const option = $('<label class="tdr-filter-option"></label>');
        option.attr('data-label', value || '—');
        const input = $('<input type="checkbox" />');
        input.val(value);
        input.prop('checked', checked);
        option.append(input);
        option.append($('<span></span>').text(value || '—'));
        list.append(option);
    });
    list.find('.tdr-filter-all').prop('checked', allChecked);
    box.append(list);
    box.append('<div class="tdr-filter-actions"><button type="button" class="tdr-filter-apply">Apply</button><button type="button" class="tdr-filter-clear">Clear</button></div>');
    return box;
}

function numericFilterBox(rule) {
    const op = rule && rule.kind === 'num' ? rule.op : 'equals';
    const between = op === 'between';
    const current = rule && rule.kind === 'num' ? rule.a : '';
    const max = rule && rule.kind === 'num' ? rule.b : '';
    return '<div class="tdr-filter-box">' +
        '<select class="tdr-filter-op form-control form-control-sm">' +
        '<option value="equals"' + (op === 'equals' ? ' selected' : '') + '>=</option>' +
        '<option value="greater"' + (op === 'greater' ? ' selected' : '') + '>&gt;</option>' +
        '<option value="less"' + (op === 'less' ? ' selected' : '') + '>&lt;</option>' +
        '<option value="between"' + (op === 'between' ? ' selected' : '') + '>Between</option>' +
        '</select>' +
        '<input type="number" class="tdr-filter-a form-control form-control-sm" placeholder="' + (between ? 'Min' : 'Enter value') + '" value="' + (current === '' || current === undefined ? '' : current) + '" />' +
        '<input type="number" class="tdr-filter-b form-control form-control-sm" placeholder="Max" value="' + (between ? max : '') + '"' + (between ? '' : ' style="display:none"') + ' />' +
        '<div class="tdr-filter-actions"><button type="button" class="tdr-filter-apply">Apply</button><button type="button" class="tdr-filter-clear">Clear</button></div>' +
        '</div>';
}

function placeFilterPop(anchor) {
    const pop = document.getElementById('tdrColFilterPop');
    if (!pop || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    let left = rect.right - width;
    if (left < 8) left = Math.max(8, rect.left);
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
}

function openColumnFilter(button) {
    if (filterAnchor && filterAnchor.is(button)) {
        closeColumnFilter();
        return;
    }
    closeColumnFilter();
    filterAnchor = button;
    const tile = button.closest('.tdr-tile');
    const index = String(button.attr('data-col-index'));
    const kind = button.attr('data-kind') || 'text';
    const rule = (tile.data('colFilters') || {})[index];
    const pop = $('<div id="tdrColFilterPop" class="tdr-filter-pop"></div>');
    pop.append(
        '<button type="button" class="tdr-filter-sort" data-order="asc"><i class="fa-solid fa-arrow-up-a-z"></i> Ascending</button>' +
        '<button type="button" class="tdr-filter-sort" data-order="desc"><i class="fa-solid fa-arrow-down-z-a"></i> Descending</button>'
    );
    pop.append(kind === 'num' ? numericFilterBox(rule) : textFilterBox(tile, index, rule));
    $('body').append(pop);
    placeFilterPop(button[0]);

    pop.on('click', '.tdr-filter-sort', function () {
        sortTileColumn(tile, Number(index), $(this).attr('data-order'), kind);
        closeColumnFilter();
    });
    pop.on('change', '.tdr-filter-op', function () {
        const between = $(this).val() === 'between';
        pop.find('.tdr-filter-a').attr('placeholder', between ? 'Min' : 'Enter value');
        pop.find('.tdr-filter-b').toggle(between);
    });
    pop.on('input', '.tdr-filter-find', function () {
        const query = String($(this).val() || '').toLowerCase();
        pop.find('.tdr-filter-option').each(function () {
            const label = String($(this).attr('data-label') || '').toLowerCase();
            $(this).toggle(!query || label.indexOf(query) >= 0);
        });
    });
    pop.on('change', '.tdr-filter-all', function () {
        pop.find('.tdr-filter-option input').prop('checked', $(this).prop('checked'));
    });
    pop.on('change', '.tdr-filter-option input', function () {
        const total = pop.find('.tdr-filter-option input').length;
        const checked = pop.find('.tdr-filter-option input:checked').length;
        pop.find('.tdr-filter-all').prop('checked', total > 0 && checked === total);
    });
    pop.on('click', '.tdr-filter-apply', function () {
        const next = Object.assign({}, tile.data('colFilters') || {});
        if (kind === 'num') {
            const op = String(pop.find('.tdr-filter-op').val() || 'equals');
            const a = pop.find('.tdr-filter-a').val();
            const b = pop.find('.tdr-filter-b').val();
            if (a === '' || (op === 'between' && b === '')) return;
            next[index] = { kind: 'num', op: op, a: toNumber(a), b: toNumber(b) };
        } else {
            const values = [];
            pop.find('.tdr-filter-option input:checked').each(function () {
                values.push(String($(this).val()));
            });
            const total = pop.find('.tdr-filter-option input').length;
            if (values.length === total) delete next[index];
            else next[index] = { kind: 'text', values: values };
        }
        tile.data('colFilters', next);
        applyTileView(tile);
        closeColumnFilter();
    });
    pop.on('click', '.tdr-filter-clear', function () {
        const next = Object.assign({}, tile.data('colFilters') || {});
        delete next[index];
        tile.data('colFilters', next);
        applyTileView(tile);
        closeColumnFilter();
    });
}

$(document).ready(function () {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.setHeadingFromQueryParam === 'function') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    }
    $('#ERPHeading').text($('#ERPHeading').text() || 'Target Dashboard');

    bindDefaultDates();
    applyDatePreset('month');
    showEmpty();

    $('#btnShowData').click(showData);
    $('#btnReset').click(resetDashboard);
    $('#tdrPresets').on('click', '.tdr-chip', function () {
        applyDatePreset($(this).data('preset'));
    });
    $('#txtFromDate, #txtToDate').on('change', syncPresetFromDates);
    $('#txtFromDate, #txtToDate').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            showData();
        }
    });
    $('#tdrTileGrid').on('input', '.tdr-tile-search', function () {
        applyTileView($(this).closest('.tdr-tile'));
    });
    $('#tdrTileGrid').on('click', '.tdr-col-filter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openColumnFilter($(this));
    });
    $(document).on('click', function (e) {
        if ($(e.target).closest('#tdrColFilterPop, .tdr-col-filter').length) return;
        closeColumnFilter();
    });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeColumnFilter();
    });
    $(window).on('resize', closeColumnFilter);
});

window.ShowData = showData;
window.ResetDashboard = resetDashboard;
