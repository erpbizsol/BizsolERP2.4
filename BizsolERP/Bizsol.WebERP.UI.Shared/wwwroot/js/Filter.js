window.escapeId = function escapeId(id) {
    return id.replace(/([\/.:\[\]#@$%^&*()+=,!~`{}'"<>?|\\])/g, '\\$1');
}

window.bizsolGetFilterAnchor = function bizsolGetFilterAnchor($panel) {
    if (!$panel || !$panel.length) {
        return $();
    }
    var $stored = $panel.data('bizsol-filter-anchor');
    if ($stored && $stored.length && $stored.closest('body').length) {
        return $stored;
    }
    var $anchor = $panel.closest('th');
    if (!$anchor.length) {
        $anchor = $panel.closest('.filter-table-heading-div');
    }
    return $anchor;
};

window.bizsolMoveFilterPanelToBody = function bizsolMoveFilterPanelToBody($panel) {
    if (!$panel || !$panel.length || $panel.data('bizsol-filter-placeholder')) {
        return;
    }
    var $placeholder = $('<span class="bizsol-filter-placeholder" aria-hidden="true"></span>');
    $panel.after($placeholder);
    $panel.data('bizsol-filter-placeholder', $placeholder);
    $panel.appendTo(document.body);
};

window.bizsolRestoreFilterPanel = function bizsolRestoreFilterPanel($panel) {
    if (!$panel || !$panel.length) {
        return;
    }
    var $placeholder = $panel.data('bizsol-filter-placeholder');
    if ($placeholder && $placeholder.length) {
        $placeholder.before($panel);
        $placeholder.remove();
    }
    $panel.removeData('bizsol-filter-placeholder');
};

window.bizsolFloatFilterPanel = function bizsolFloatFilterPanel($panel) {
    if (!$panel || !$panel.length || !$panel.is(':visible')) {
        return;
    }

    var $anchor = bizsolGetFilterAnchor($panel);
    if (!$anchor.length) {
        return;
    }

    $panel.data('bizsol-filter-anchor', $anchor);
    bizsolMoveFilterPanelToBody($panel);

    var $posSource = $anchor;
    if ($panel.hasClass('filter-division')) {
        var $arrow = $anchor.find('.table-filter-arrow').first();
        if ($arrow.length) {
            $posSource = $arrow;
        }
    }

    var rect = $posSource[0].getBoundingClientRect();
    $panel.addClass('bizsol-filter-floating').css({
        position: 'fixed',
        top: Math.round(rect.bottom + 2) + 'px',
        left: Math.round(rect.left) + 'px',
        right: 'auto',
        zIndex: 100060
    });

    var panelWidth = $panel.outerWidth() || 200;
    var panelHeight = $panel.outerHeight() || 140;
    var top = rect.bottom + 2;
    var left = rect.left;

    if (left + panelWidth > window.innerWidth - 10) {
        left = Math.max(10, rect.right - panelWidth);
    }
    if (top + panelHeight > window.innerHeight - 10) {
        top = Math.max(10, rect.top - panelHeight - 2);
    }

    $panel.css({
        top: Math.round(top) + 'px',
        left: Math.round(left) + 'px'
    });
};

window.bizsolResetFloatFilterPanel = function bizsolResetFloatFilterPanel($panel) {
    if (!$panel || !$panel.length) {
        return;
    }
    $panel.removeClass('bizsol-filter-floating').css({
        position: '',
        top: '',
        left: '',
        right: '',
        zIndex: ''
    }).removeData('bizsol-filter-anchor');
    bizsolRestoreFilterPanel($panel);
};

window.repositionAllFloatingFilters = function repositionAllFloatingFilters() {
    $('.filter-dropdown.bizsol-filter-floating:visible, .filter-dropdown-double.bizsol-filter-floating:visible, .filter-division.bizsol-filter-floating:visible').each(function () {
        bizsolFloatFilterPanel($(this));
    });
};

window.bizsolBindFilterFloatListeners = function bizsolBindFilterFloatListeners() {
    if (window._bizsolFilterFloatListenersBound) {
        return;
    }
    window._bizsolFilterFloatListenersBound = true;

    var reposition = function () {
        repositionAllFloatingFilters();
    };

    $(window).on('scroll.bizsolFilterFloat resize.bizsolFilterFloat', reposition);
    document.addEventListener('scroll', reposition, true);
};

bizsolBindFilterFloatListeners();

/**
 * Manual column expand for every BizsolCustomFilterGrid table.
 * Drag the header edge to set a width. Double-click or double-tap that edge to fit the text.
 * On iOS and Android the edge is a finger target, and the drag does not scroll the grid.
 * Widths stay in place across sort, filter, and paging.
 */
window.bizsolTagHeaderColumns = function bizsolTagHeaderColumns($header, columns, hasAction) {
    const $ths = $header.find('tr:first').children('th');
    $ths.each(function (i) {
        if (hasAction && i === $ths.length - 1) {
            $(this).attr('data-bizsol-col', '__bizsol_action__');
            return;
        }
        if (columns[i] != null) {
            $(this).attr('data-bizsol-col', columns[i]);
        }
    });
};

window.bizsolBindManualColumnExpand = function bizsolBindManualColumnExpand(tableId) {
    const $table = $('#' + tableId);
    if (!$table.length) return;
    $table.find('thead tr:first th').each(function () {
        const $th = $(this);
        if (this.style.display === 'none' || $th.find('.bizsol-col-resize').length) return;
        if (window.getComputedStyle(this).position === 'static') {
            this.style.position = 'relative';
        }
        $th.append('<span class="bizsol-col-resize" title="Drag to resize. Double-tap to fit the text."></span>');
    });
};

/**
 * Turn on manual column expand for a table that is not built by CreateDataTable.
 * Safe to call again after the page redraws the header or the rows.
 * The table needs an id, and its first header row should be one th per column.
 */
window.bizsolHeaderColumnKey = function bizsolHeaderColumnKey(th) {
    const heading = th.querySelector('.filter-table-heading');
    if (heading && heading.textContent.trim()) return heading.textContent.trim();
    const clone = th.cloneNode(true);
    clone.querySelectorAll('.bizsol-col-resize, .filter-dropdown, .filter-dropdown-double, .filter-division').forEach(function (node) {
        node.remove();
    });
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
};

window.bizsolEnableManualColumnExpand = function bizsolEnableManualColumnExpand(tableId) {
    const $table = $('#' + tableId);
    if (!$table.length) return;
    const used = {};
    $table.find('thead tr:first').children('th').each(function (i) {
        if (this.style.display === 'none' || $(this).attr('data-bizsol-col')) return;
        let key = window.bizsolHeaderColumnKey(this) || ('col-' + i);
        if (used[key]) key = key + '-' + i;
        used[key] = true;
        $(this).attr('data-bizsol-col', key);
    });
    window.bizsolBindManualColumnExpand(tableId);
    window.bizsolApplyManualColumnWidths(tableId);
};

window.bizsolScanManualColumnTables = function bizsolScanManualColumnTables() {
    document.querySelectorAll('table.bizsol-col-expand, table[data-col-expand]').forEach(function (table) {
        if (!table.id) {
            window._bizsolColExpandSeq = (window._bizsolColExpandSeq || 0) + 1;
            table.id = 'bizsolColExpand' + window._bizsolColExpandSeq;
        }
        if (!table.tHead || !table.tHead.rows.length) return;
        window.bizsolEnableManualColumnExpand(table.id);
    });
};

window.bizsolWatchManualColumnTables = function bizsolWatchManualColumnTables() {
    if (window._bizsolColExpandWatch || !document.body) return;
    window._bizsolColExpandWatch = true;
    window.bizsolScanManualColumnTables();

    var queued = false;
    var observer = new MutationObserver(function (mutations) {
        var hit = false;
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            if (mutation.type !== 'childList') continue;
            var target = mutation.target;
            if (target && target.nodeType === 1 && target.closest && target.closest('table.bizsol-col-expand, table[data-col-expand]')) {
                var added = mutation.addedNodes;
                if (added.length === 1 && added[0].nodeType === 1 && added[0].classList && added[0].classList.contains('bizsol-col-resize')) {
                    continue;
                }
                hit = true;
                break;
            }
            for (var n = 0; n < mutation.addedNodes.length; n++) {
                var node = mutation.addedNodes[n];
                if (node.nodeType !== 1) continue;
                if ((node.matches && node.matches('table.bizsol-col-expand, table[data-col-expand]'))
                    || (node.querySelector && node.querySelector('table.bizsol-col-expand, table[data-col-expand]'))) {
                    hit = true;
                    break;
                }
            }
            if (hit) break;
        }
        if (!hit || queued) return;
        queued = true;
        requestAnimationFrame(function () {
            queued = false;
            window.bizsolScanManualColumnTables();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.bizsolWatchManualColumnTables);
} else {
    window.bizsolWatchManualColumnTables();
}

window.bizsolEnsureColumnWidthSnapshot = function bizsolEnsureColumnWidthSnapshot(tableId) {
    if (window[`columnWidthsReady_${tableId}`]) return;
    const widths = {};
    $('#' + tableId).find('thead tr:first th').each(function () {
        const col = $(this).attr('data-bizsol-col');
        if (!col || this.style.display === 'none') return;
        widths[col] = Math.max(48, Math.round(this.getBoundingClientRect().width));
    });
    window[`columnWidths_${tableId}`] = widths;
    window[`columnWidthsReady_${tableId}`] = true;
};

window.bizsolMeasureColumnContent = function bizsolMeasureColumnContent(table, colIndex) {
    const th = table.querySelectorAll('thead tr:first-child > th')[colIndex];
    if (!th) return 120;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;width:auto;height:auto;';
    document.body.appendChild(probe);
    let max = 60;

    const heading = th.querySelector('.filter-table-heading');
    const label = heading
        ? heading.textContent.trim()
        : (th.childNodes[0] && th.childNodes[0].nodeType === 3 ? th.childNodes[0].textContent.trim() : 'Action');
    const labelStyle = window.getComputedStyle(heading || th);
    probe.style.font = labelStyle.font;
    probe.textContent = label;
    max = Math.max(max, probe.scrollWidth + (th.querySelector('.table-filter-arrow') ? 40 : 20));

    table.querySelectorAll('tbody > tr, tfoot > tr').forEach(function (tr) {
        const cell = tr.children[colIndex];
        if (!cell || cell.style.display === 'none') return;
        const cs = window.getComputedStyle(cell);
        probe.style.font = cs.font;
        probe.style.padding = cs.padding;
        probe.innerHTML = cell.innerHTML;
        max = Math.max(max, probe.scrollWidth + 8);
    });

    probe.remove();
    return Math.min(Math.max(48, Math.ceil(max)), 720);
};

window.bizsolApplyManualColumnWidths = function bizsolApplyManualColumnWidths(tableId) {
    const widths = window[`columnWidths_${tableId}`];
    const $table = $('#' + tableId);
    if (!$table.length || !window[`columnWidthsReady_${tableId}`] || !widths) return;

    const $ths = $table.find('thead tr:first').children('th');
    let sum = 0;
    const sizeByIndex = [];

    $ths.each(function (i) {
        if (this.style.display === 'none') {
            sizeByIndex[i] = 0;
            return;
        }
        const col = $(this).attr('data-bizsol-col');
        let w = widths[col];
        if (!w) {
            w = Math.max(48, Math.round(this.getBoundingClientRect().width) || 120);
            if (col) widths[col] = w;
        }
        sizeByIndex[i] = w;
        sum += w;
        this.style.boxSizing = 'border-box';
        this.style.width = w + 'px';
        this.style.minWidth = w + 'px';
        this.style.maxWidth = w + 'px';
    });

    $table.find('tbody > tr, tfoot > tr').each(function () {
        const cells = this.children;
        for (let i = 0; i < sizeByIndex.length; i++) {
            const cell = cells[i];
            const w = sizeByIndex[i];
            if (!cell || !w || cell.style.display === 'none') continue;
            cell.style.boxSizing = 'border-box';
            cell.style.width = w + 'px';
            cell.style.minWidth = w + 'px';
            cell.style.maxWidth = w + 'px';
            if (cell.classList.contains('bizsol-action-cell')) {
                cell.style.overflow = 'visible';
                cell.style.textOverflow = 'clip';
            } else {
                cell.style.overflow = 'hidden';
                cell.style.textOverflow = 'ellipsis';
            }
        }
    });

    $table.addClass('bizsol-manual-cols');
    $table.css('width', sum + 'px');
};

window.bizsolCaptureScrollChain = function bizsolCaptureScrollChain(el) {
    const locks = [];
    let node = el && el.parentElement;
    while (node) {
        const canX = node.scrollWidth > node.clientWidth + 1;
        const canY = node.scrollHeight > node.clientHeight + 1;
        if (canX || canY || node.scrollLeft || node.scrollTop) {
            locks.push({ el: node, left: node.scrollLeft, top: node.scrollTop });
        }
        node = node.parentElement;
    }
    return locks;
};

window.bizsolRestoreScrollChain = function bizsolRestoreScrollChain(locks) {
    (locks || []).forEach(function (lock) {
        if (lock.el.scrollLeft !== lock.left) lock.el.scrollLeft = lock.left;
        if (lock.el.scrollTop !== lock.top) lock.el.scrollTop = lock.top;
    });
};

window.bizsolBindManualColumnExpandEvents = function bizsolBindManualColumnExpandEvents() {
    if (window._bizsolManualColResizeBound) return;
    window._bizsolManualColResizeBound = true;

    /* iOS and Android start a scroll on touchmove unless it is cancelled.
       pointerdown preventDefault is not enough inside an overflow-x grid. */
    document.addEventListener('touchmove', function (e) {
        if (!document.body.classList.contains('bizsol-col-resizing')) return;
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    $(document).on('pointerdown', '.bizsol-col-resize', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (document.body.classList.contains('bizsol-col-resizing')) return;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        const handle = this;
        const $th = $(handle).closest('th');
        const $table = $th.closest('table');
        const tableId = $table.attr('id');
        const colKey = $th.attr('data-bizsol-col');
        if (!tableId || !colKey) return;

        try { handle.setPointerCapture(e.pointerId); } catch (err) { /* pointer capture is optional */ }

        window.bizsolEnsureColumnWidthSnapshot(tableId);

        const now = Date.now();
        if (window._bizsolColLastTap
            && now - window._bizsolColLastTap < 450
            && window._bizsolColLastKey === colKey
            && window._bizsolColLastTable === tableId) {
            window._bizsolColLastTap = 0;
            try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
            window[`columnWidths_${tableId}`][colKey] = window.bizsolMeasureColumnContent($table[0], $th.index());
            window.bizsolApplyManualColumnWidths(tableId);
            return;
        }
        window._bizsolColLastTap = now;
        window._bizsolColLastKey = colKey;
        window._bizsolColLastTable = tableId;

        const startX = e.clientX;
        const startW = window[`columnWidths_${tableId}`][colKey] || $th.outerWidth();
        const pointerId = e.pointerId;
        const scrollLocks = window.bizsolCaptureScrollChain(handle);
        let moved = false;
        let pending = startW;
        let frame = 0;
        let ended = false;

        $('body').addClass('bizsol-col-resizing');
        $th.addClass('bizsol-col-active');

        function paint() {
            frame = 0;
            window[`columnWidths_${tableId}`][colKey] = pending;
            window.bizsolApplyManualColumnWidths(tableId);
            window.bizsolRestoreScrollChain(scrollLocks);
        }
        function onMove(ev) {
            if (ended || ev.pointerId !== pointerId) return;
            if (ev.cancelable) ev.preventDefault();
            const delta = ev.clientX - startX;
            if (Math.abs(delta) < 4) return;
            moved = true;
            pending = Math.max(48, Math.round(startW + delta));
            if (!frame) frame = requestAnimationFrame(paint);
        }
        function onUp(ev) {
            if (ended || (ev && ev.pointerId !== pointerId)) return;
            ended = true;
            if (frame) cancelAnimationFrame(frame);
            $(document).off('pointermove.bizsolColResize pointerup.bizsolColResize pointercancel.bizsolColResize');
            $('body').removeClass('bizsol-col-resizing');
            $th.removeClass('bizsol-col-active');
            if (moved) {
                window[`columnWidths_${tableId}`][colKey] = pending;
                window.bizsolApplyManualColumnWidths(tableId);
            } else {
                window[`columnWidths_${tableId}`][colKey] = startW;
            }
            window.bizsolRestoreScrollChain(scrollLocks);
            try { handle.releasePointerCapture(pointerId); } catch (err) { /* already released */ }
        }

        $(document).on('pointermove.bizsolColResize', onMove);
        $(document).on('pointerup.bizsolColResize pointercancel.bizsolColResize', onUp);
    });

    $(document).on('dblclick', '.bizsol-col-resize', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $th = $(this).closest('th');
        const table = $th.closest('table')[0];
        const tableId = table && table.id;
        const colKey = $th.attr('data-bizsol-col');
        if (!tableId || !colKey) return;
        window.bizsolEnsureColumnWidthSnapshot(tableId);
        window[`columnWidths_${tableId}`][colKey] = window.bizsolMeasureColumnContent(table, $th.index());
        window.bizsolApplyManualColumnWidths(tableId);
    });

    $(document).on('click', '.bizsol-col-resize', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
};

window.bizsolBindManualColumnExpandEvents();

window.getBizsolHelperForFilter = function getBizsolHelperForFilter() {
    return window.BizSolHelperFunction || null;
};

window.getBizsolPerPageConfig = function getBizsolPerPageConfig() {
    var helper = window.getBizsolHelperForFilter();
    if (helper && typeof helper.getWebUserPerPageConfig === 'function') {
        return helper.getWebUserPerPageConfig();
    }
    return { options: [10, 20, 30, 50, 100, 200], value: 10 };
};

window.buildPageSizeOptionsHtml = function buildPageSizeOptionsHtml(options, selectedValue) {
    var list = (options || []).slice();
    var selected = parseInt(selectedValue, 10);
    if (isNaN(selected) || selected <= 0) {
        selected = list[0] || window.getBizsolPerPageConfig().value;
    }
    if (list.indexOf(selected) === -1) {
        list.push(selected);
    }
    list.sort(function (a, b) { return a - b; });
    return list.map(function (n) {
        var sel = n === selected ? ' selected' : '';
        return '<option value="' + n + '"' + sel + '>' + n + '</option>';
    }).join('');
};

window.applyBizsolPerPageConfigToGrids = function applyBizsolPerPageConfigToGrids() {
    var cfg = window.getBizsolPerPageConfig();
    $('select.pageSize[id^="pageSize-"]').each(function () {
        var $sel = $(this);
        var tableId = ($sel.attr('id') || '').replace(/^pageSize-/, '');
        if (!tableId) {
            return;
        }
        var prev = parseInt($sel.val(), 10);
        $sel.html(window.buildPageSizeOptionsHtml(cfg.options, cfg.value));
        if (!isNaN(prev) && cfg.options.indexOf(prev) !== -1) {
            $sel.val(String(prev));
        } else {
            $sel.val(String(cfg.value));
        }
        window['itemsPerPage_' + tableId] = parseInt($sel.val(), 10) || cfg.value;
        window['currentPage_' + tableId] = 1;
        var bodyId = $('#' + tableId).find('tbody').attr('id');
        if (bodyId && window['Paginator_' + tableId]) {
            renderTableWithPagination(tableId, bodyId);
        }
    });
};

window.ensureBizsolWebUserConfiguration = function ensureBizsolWebUserConfiguration() {
    if (window._bizsolWebUserConfigPromise) {
        return window._bizsolWebUserConfigPromise;
    }
    window._bizsolWebUserConfigPromise = new Promise(function (resolve) {
        function runWithHelper(helper) {
            if (helper && typeof helper.ensureWebUserPerPageConfiguration === 'function') {
                helper.ensureWebUserPerPageConfiguration(window.applyBizsolPerPageConfigToGrids)
                    .then(resolve)
                    .catch(function () { resolve(window.getBizsolPerPageConfig()); });
                return;
            }
            resolve(window.getBizsolPerPageConfig());
        }
        var helper = window.getBizsolHelperForFilter();
        if (helper) {
            runWithHelper(helper);
            return;
        }
        import('/_content/Bizsol.WebERP.UI.Shared/js/HelperFunction.js')
            .then(function (module) {
                if (module && module.BizSolHelperFunction) {
                    window.BizSolHelperFunction = module.BizSolHelperFunction;
                }
                runWithHelper(window.getBizsolHelperForFilter());
            })
            .catch(function () {
                resolve(window.getBizsolPerPageConfig());
            });
    });
    return window._bizsolWebUserConfigPromise;
};

$(function () {
    window.ensureBizsolWebUserConfiguration();
});

/**
 * Format a number with Indian comma grouping  e.g. 2,00,000.00
 * @param {number|string} value    - numeric value
 * @param {number}        decimals - decimal places (default 2)
 * @returns {string}
 */
window.formatIndianNumber = function formatIndianNumber(value, decimals) {
    decimals = (decimals === undefined || decimals === null) ? 2 : decimals;
    var num = parseFloat(value);
    if (isNaN(num)) return String(value);
    var fixed = num.toFixed(decimals);
    var parts = fixed.split('.');
    var intPart = parts[0];
    var decPart = parts[1];
    var sign = '';
    if (intPart.charAt(0) === '-') { sign = '-'; intPart = intPart.slice(1); }
    // Indian grouping: last 3 digits, then groups of 2 from right
    var lastThree = intPart.length > 3 ? intPart.slice(-3) : intPart;
    var rest = intPart.length > 3 ? intPart.slice(0, intPart.length - 3) : '';
    var grouped = rest.length > 0 ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
    return sign + grouped + (decPart !== undefined ? '.' + decPart : '');
};

window.formatGridNumericDisplay = function formatGridNumericDisplay(value) {
    if (value === null || value === undefined || value === '') {
        return value;
    }
    var num = parseFloat(value);
    if (!isFinite(num)) {
        return value;
    }
    if (Math.abs(num - Math.round(num)) < 1e-9) {
        return String(Math.round(num));
    }
    return String(num);
};

window.getForcedDecimalPlaces = function getForcedDecimalPlaces(key, fixedDecimalConfig) {
    if (fixedDecimalConfig && typeof fixedDecimalConfig === 'object' && Object.prototype.hasOwnProperty.call(fixedDecimalConfig, key)) {
        return fixedDecimalConfig[key];
    }
    if (typeof fixedDecimalConfig === 'number') {
        return fixedDecimalConfig;
    }
    return null;
};

/**
 * Parse a grid cell for totalColumns / grand totals: plain numbers work; HTML (e.g. &lt;input value="100"&gt;) reads value="...".
 */
window.parseNumericCellForTotal = function parseNumericCellForTotal(raw) {
    if (raw === null || raw === undefined) return NaN;
    if (typeof raw === 'number' && isFinite(raw)) return raw;
    var str = String(raw).trim();
    if (str === '') return NaN;
    var n = parseFloat(str.replace(/,/g, ''));
    if (!isNaN(n) && isFinite(n)) return n;
    var m = str.match(/value\s*=\s*"([^"]*)"/i);
    if (m && m[1] !== undefined && m[1] !== '') {
        n = parseFloat(String(m[1]).replace(/,/g, ''));
        if (!isNaN(n) && isFinite(n)) return n;
    }
    m = str.match(/value\s*=\s*'([^']*)'/i);
    if (m && m[1] !== undefined && m[1] !== '') {
        n = parseFloat(String(m[1]).replace(/,/g, ''));
        if (!isNaN(n) && isFinite(n)) return n;
    }
    return NaN;
};

window.normalizeFilterColKey = function normalizeFilterColKey(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

window.normalizeLastValueColumns = function normalizeLastValueColumns(lastValueColumns) {
    if (lastValueColumns == null || lastValueColumns === false) {
        return [];
    }
    if (typeof lastValueColumns === 'string') {
        const name = lastValueColumns.trim();
        return name ? [name] : [];
    }
    if (Array.isArray(lastValueColumns)) {
        return lastValueColumns
            .map(function (c) { return c == null ? '' : String(c).trim(); })
            .filter(function (c) { return c !== ''; });
    }
    return [];
};

window.resolveLastValueColumnKey = function resolveLastValueColumnKey(requestedName, availableKeys) {
    if (!requestedName) {
        return '';
    }
    const keys = Array.isArray(availableKeys) ? availableKeys : [];
    if (keys.includes(requestedName)) {
        return requestedName;
    }
    const n = window.normalizeFilterColKey(requestedName);
    const match = keys.find(function (k) {
        return window.normalizeFilterColKey(k) === n;
    });
    return match || requestedName;
};

window.resolveLastValueColumns = function resolveLastValueColumns(lastValueColumns, availableKeys) {
    return window.normalizeLastValueColumns(lastValueColumns).map(function (name) {
        return window.resolveLastValueColumnKey(name, availableKeys);
    }).filter(function (name) { return name !== ''; });
};

window.applyLastValueColumnTotals = function applyLastValueColumnTotals(totals, items, totalColumns, lastValueColumns) {
    const availableKeys = (items && items.length)
        ? Object.keys(items[0])
        : (Array.isArray(totalColumns) ? totalColumns : []);
    const resolved = window.resolveLastValueColumns(lastValueColumns, availableKeys);
    if (!totals || !items || items.length === 0 || resolved.length === 0) {
        return;
    }
    const lastItem = items[items.length - 1];
    resolved.forEach(colName => {
        if (totalColumns && Array.isArray(totalColumns) && !totalColumns.includes(colName)) {
            return;
        }
        const value = window.parseNumericCellForTotal(lastItem[colName]);
        totals[colName] = (!isNaN(value) && isFinite(value)) ? value : 0;
    });
};

const BizsolCustomFilterGrid = {
    CreateDataTable: function CreateDataTable(headerId, bodyId, data, Button, ShowButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, HiddenColumns, ColumnAlignment, Paginator = true, TotalColumns = null, FixedDecimalvalue = null, CommaColumns = null, GlobalSearch = false, FloatingTotalRow = false, LastValueColumns = null) {
        const columns = Object.keys(data[0]);
        const tableId = $('#' + bodyId).closest('table').attr('id');
        renderTableHeader(HiddenColumns, headerId, bodyId, columns, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn);
        window[`hiddenColumns_${bodyId}`] = HiddenColumns;
        window[`columnAlignment_${bodyId}`] = ColumnAlignment;
        window[`totalColumns_${bodyId}`] = TotalColumns;
        window[`fixedDecimalvalue_${bodyId}`] = FixedDecimalvalue;
        window[`commaColumns_${bodyId}`] = Array.isArray(CommaColumns) ? CommaColumns : [];
        window[`floatingTotalRow_${bodyId}`] = !!FloatingTotalRow;
        window[`lastValueColumns_${bodyId}`] = window.normalizeLastValueColumns(LastValueColumns);

        // Create or remove the sticky <tfoot> used for the floating total row
        const $tbl = $('#' + bodyId).closest('table');
        $tbl.find('tfoot.bizsol-floating-tfoot').remove();
        if (FloatingTotalRow) {
            $tbl.append('<tfoot class="bizsol-floating-tfoot" id="tfoot-' + bodyId + '"></tfoot>');
        }
        renderTable(data, bodyId);
        window[`button_${tableId}`] = Button;
        window[`ShowButtons_${bodyId}`] = ShowButtons;
        window[`filteredData_${tableId}`] = data;
        window[`filteredDataTemp_${tableId}`] = data;
        window.bizsolClearColumnFilterStore(tableId);
        delete window[`bizsolSort_${tableId}`];
        bodyId = bodyId;
        window[`currentPage_${tableId}`] = 1;
        window[`itemsPerPage_${tableId}`] = window.getBizsolPerPageConfig().value;
        window[`Paginator_${tableId}`] = Paginator;
        window[`globalSearch_${tableId}`] = !!GlobalSearch;

        // Add filtered class if any filter columns are defined
        const hasFilterColumns = (StringFilterColumn && StringFilterColumn.length > 0) ||
                                (NumericFilterColumn && NumericFilterColumn.length > 0) ||
                                (DateFilterColumn && DateFilterColumn.length > 0) ||
                                (StringdoubleFilterColumn && StringdoubleFilterColumn.length > 0);

        if (hasFilterColumns) {
            $('#' + bodyId).closest('.table-wrapper').addClass('filtered');
        }

        // Inject global search box above table if enabled
        if (GlobalSearch) {
            const placeholder = (typeof GlobalSearch === 'string' && GlobalSearch.trim() !== '')
                ? GlobalSearch
                : 'Search...';
            createGlobalSearchBox(tableId, bodyId, placeholder);
        } else {
            // Remove any existing search box when re-initialising with search disabled
            $('#global-search-wrap-' + tableId).remove();
        }

        if (Paginator) {
            window.ensureBizsolWebUserConfiguration();
            createPaginator(tableId, bodyId);
            renderTableWithPagination(tableId, bodyId);
        }
    }

}

window.BizsolCustomFilterGrid = BizsolCustomFilterGrid;

window.bizsolGetColumnFilterStore = function bizsolGetColumnFilterStore(tableId) {
    if (!window.bizsolColumnFilterState) {
        window.bizsolColumnFilterState = {};
    }
    if (!window.bizsolColumnFilterState[tableId]) {
        window.bizsolColumnFilterState[tableId] = { string: {}, date: {}, numeric: {}, double: {} };
    }
    return window.bizsolColumnFilterState[tableId];
};

window.bizsolClearColumnFilterStore = function bizsolClearColumnFilterStore(tableId) {
    if (window.bizsolColumnFilterState) {
        delete window.bizsolColumnFilterState[tableId];
    }
};

window.bizsolEscapeFilterHtml = function bizsolEscapeFilterHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

window.bizsolCollectColumnValues = function bizsolCollectColumnValues(tableId, columnName) {
    var uniqueValues = [];
    var seen = Object.create(null);
    var source = window[`filteredDataTemp_${tableId}`] || window[`filteredData_${tableId}`] || [];
    source.forEach(function (row) {
        if (!row || !Object.prototype.hasOwnProperty.call(row, columnName)) {
            return;
        }
        var value = row[columnName];
        var key = String(value);
        if (seen[key]) {
            return;
        }
        seen[key] = true;
        uniqueValues.push(value);
    });
    return uniqueValues;
};

window.bizsolIsSelectedValue = function bizsolIsSelectedValue(value, selectedValues) {
    if (!selectedValues || !selectedValues.length) {
        return false;
    }
    var current = String(value);
    for (var i = 0; i < selectedValues.length; i++) {
        if (String(selectedValues[i]) === current) {
            return true;
        }
    }
    return false;
};

window.bizsolGetSavedFilterValues = function bizsolGetSavedFilterValues(tableId, kind, columnName) {
    var state = window.bizsolColumnFilterState && window.bizsolColumnFilterState[tableId];
    if (!state || !state[kind]) {
        return null;
    }
    var saved = state[kind][columnName];
    if (saved == null) {
        return null;
    }
    if (kind === 'double') {
        return saved.selectedValues || null;
    }
    return saved;
};

window.bizsolRestoreCheckboxSelection = function bizsolRestoreCheckboxSelection($container, selectedValues) {
    if (!$container || !selectedValues || !selectedValues.length) {
        return;
    }
    $container.find('input[type="checkbox"]').each(function () {
        if ($(this).val() === 'All') {
            return;
        }
        if (window.bizsolIsSelectedValue($(this).val(), selectedValues)) {
            $(this).prop('checked', true);
        }
    });
    var $boxes = $container.find('input[type="checkbox"]').not('[value="All"]');
    var allChecked = $boxes.length > 0 && $boxes.length === $boxes.filter(':checked').length;
    $container.find('input[value="All"]').prop('checked', allChecked);
};

window.bizsolMoveCheckedLabelsToTop = function bizsolMoveCheckedLabelsToTop($container, $prefer) {
    if (!$container || !$container.length) {
        return;
    }
    var $all = $container.children('label').filter(function () {
        return $(this).find('input[type="checkbox"]').first().val() === 'All';
    }).first();
    var checked = [];
    var unchecked = [];
    $container.children('label').each(function () {
        var $label = $(this);
        if ($label.find('input[type="checkbox"]').first().val() === 'All') {
            return;
        }
        if ($label.find('input[type="checkbox"]').first().is(':checked')) {
            checked.push(this);
        } else {
            unchecked.push(this);
        }
    });
    if ($prefer && $prefer.length) {
        var preferEl = $prefer.get(0);
        checked = checked.filter(function (el) { return el !== preferEl; });
        if ($prefer.find('input[type="checkbox"]').first().is(':checked')) {
            checked.unshift(preferEl);
        }
    }
    var $anchor = $all;
    checked.concat(unchecked).forEach(function (el) {
        if ($anchor && $anchor.length) {
            $(el).insertAfter($anchor);
            $anchor = $(el);
        } else {
            $container.append(el);
        }
    });
};

window.bizsolCellMatchesSelected = function bizsolCellMatchesSelected(cellValue, selectedValues) {
    if (!selectedValues || selectedValues.indexOf('All') !== -1) {
        return true;
    }
    return window.bizsolIsSelectedValue(cellValue, selectedValues);
};

window.bizsolCellMatchesDateFilter = function bizsolCellMatchesDateFilter(cellValue, selectedValues) {
    if (!selectedValues) {
        return true;
    }
    if (selectedValues.indexOf('All') !== -1) {
        return true;
    }
    if (!selectedValues.length) {
        return false;
    }
    var dateObj = new Date(cellValue);
    if (!isNaN(dateObj.getTime())) {
        var year = dateObj.getFullYear().toString();
        var month = dateObj.toLocaleString('default', { month: 'long' });
        var day = dateObj.getDate().toString();
        return selectedValues.indexOf(year) !== -1 &&
            selectedValues.indexOf(month) !== -1 &&
            selectedValues.indexOf(day) !== -1;
    }
    return window.bizsolIsSelectedValue(cellValue, selectedValues);
};

window.bizsolCellMatchesNumeric = function bizsolCellMatchesNumeric(cellValue, spec) {
    if (!spec) {
        return true;
    }
    var numericValue = parseFloat(cellValue);
    if (isNaN(numericValue)) {
        return false;
    }
    switch (spec.selectedOption) {
        case 'equals':
            return numericValue === spec.filterValue;
        case 'greater':
            return numericValue > spec.filterValue;
        case 'less':
            return numericValue < spec.filterValue;
        case 'between':
            return numericValue >= spec.minValue && numericValue <= spec.maxValue;
        default:
            return true;
    }
};

window.bizsolCellMatchesDouble = function bizsolCellMatchesDouble(cellValue, spec) {
    if (!spec) {
        return true;
    }
    var text = cellValue == null ? '' : String(cellValue).toLowerCase();
    if (spec.useTextFilter) {
        if (spec.filterType === 'startsWith') {
            return text.startsWith(spec.searchValue);
        }
        if (spec.filterType === 'endsWith') {
            return text.endsWith(spec.searchValue);
        }
        if (spec.filterType === 'like') {
            return text.includes(spec.searchValue);
        }
        return false;
    }
    if (spec.useCheckboxFilter) {
        var selected = spec.selectedValues || [];
        for (var i = 0; i < selected.length; i++) {
            if (String(selected[i]).toLowerCase() === text) {
                return true;
            }
        }
        return false;
    }
    return true;
};

window.bizsolApplyStoredSort = function bizsolApplyStoredSort(tableId, rows) {
    var spec = window[`bizsolSort_${tableId}`];
    if (!spec || !spec.column || !Array.isArray(rows)) {
        return rows;
    }
    var column = spec.column;
    var order = spec.order;
    var copy = rows.slice();
    copy.sort(function (a, b) {
        var keyA = a[column] !== undefined && a[column] !== null ? String(a[column]).trim() : '';
        var keyB = b[column] !== undefined && b[column] !== null ? String(b[column]).trim() : '';
        if ($.isNumeric(keyA) && $.isNumeric(keyB)) {
            return (order === 'asc') ? parseFloat(keyA) - parseFloat(keyB) : parseFloat(keyB) - parseFloat(keyA);
        }
        return (order === 'asc') ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    });
    return copy;
};

window.bizsolSyncFilterIcons = function bizsolSyncFilterIcons(tableId) {
    var $table = $('#' + tableId);
    $table.find('span.filter-table-heading .fa-filter').remove();
    var store = window.bizsolColumnFilterState && window.bizsolColumnFilterState[tableId];
    if (!store) {
        return;
    }
    var active = {};
    ['string', 'date', 'numeric', 'double'].forEach(function (kind) {
        Object.keys(store[kind] || {}).forEach(function (column) {
            active[column] = true;
        });
    });
    Object.keys(active).forEach(function (column) {
        $table.find('span.filter-table-heading').each(function () {
            var heading = $(this).clone().children().remove().end().text().trim();
            if (heading === column) {
                $(this).append('<i class="fa-solid fa-filter" style="color: white; margin-left: 5px;"></i>');
            }
        });
    });
};

window.bizsolReapplyGridFilters = function bizsolReapplyGridFilters(tableId, bodyId) {
    var source = window[`filteredDataTemp_${tableId}`] || [];
    var term = (window[`globalSearchTerm_${tableId}`] || '').toLowerCase().trim();
    var hidden = window[`hiddenColumns_${bodyId}`] || [];
    var store = window.bizsolGetColumnFilterStore(tableId);

    var result = source.filter(function (row) {
        if (term) {
            var hit = Object.keys(row).some(function (key) {
                if (hidden.indexOf(key) !== -1) {
                    return false;
                }
                var cell = row[key];
                if (cell === null || cell === undefined) {
                    return false;
                }
                return String(cell).toLowerCase().indexOf(term) !== -1;
            });
            if (!hit) {
                return false;
            }
        }
        var column;
        for (column in store.string) {
            if (Object.prototype.hasOwnProperty.call(store.string, column) &&
                !window.bizsolCellMatchesSelected(row[column], store.string[column])) {
                return false;
            }
        }
        for (column in store.date) {
            if (Object.prototype.hasOwnProperty.call(store.date, column) &&
                !window.bizsolCellMatchesDateFilter(row[column], store.date[column])) {
                return false;
            }
        }
        for (column in store.numeric) {
            if (Object.prototype.hasOwnProperty.call(store.numeric, column) &&
                !window.bizsolCellMatchesNumeric(row[column], store.numeric[column])) {
                return false;
            }
        }
        for (column in store.double) {
            if (Object.prototype.hasOwnProperty.call(store.double, column) &&
                !window.bizsolCellMatchesDouble(row[column], store.double[column])) {
                return false;
            }
        }
        return true;
    });

    window[`filteredData_${tableId}`] = window.bizsolApplyStoredSort(tableId, result);

    if (window[`Paginator_${tableId}`]) {
        createPaginator(tableId, bodyId);
        renderTableWithPagination(tableId, bodyId);
    } else {
        renderTable(window[`filteredData_${tableId}`], bodyId);
    }
    window.bizsolSyncFilterIcons(tableId);
};

window.populateFilterOptions = function populateFilterOptions(columnName, bodyId) {
    const tableId = $('#' + bodyId).closest('table').attr('id');
    var uniqueValues = window.bizsolCollectColumnValues(tableId, columnName);

    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    var checkboxContainer = $('#checkbox-container-' + escapedId);
    var saved = window.bizsolGetSavedFilterValues(tableId, 'string', columnName);
    checkboxContainer.empty();
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="All"> All</label>');

    uniqueValues.forEach(function (value) {
        var safe = window.bizsolEscapeFilterHtml(value);
        checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="' + safe + '"> ' + safe + '</label>');
    });
    window.bizsolRestoreCheckboxSelection(checkboxContainer, saved);
    window.bizsolMoveCheckedLabelsToTop(checkboxContainer);

    checkboxContainer.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });

    checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer.find('input[type="checkbox"]:checked').not('input[value="All"]').length;

        checkboxContainer.find('input[value="All"]').prop('checked', allChecked);
    });
}
window.toggleFilter = function (columnName, bodyId) {
    closeAllFilters();
    closeAllFiltersDouble();
    populateFilterOptions(columnName, bodyId);
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    $('#filter-' + escapedId).toggle();
    $('#filterDropdown-' + escapedId).toggle();
    var $filterPanel = $('#filter-' + escapedId);
    if ($filterPanel.is(':visible')) {
        bizsolFloatFilterPanel($filterPanel);
    }
};
window.closeAllFilters = function closeAllFilters() {
    $('.filter-dropdown, .filter-division').each(function () {
        bizsolResetFloatFilterPanel($(this));
    });
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}

$(document).on('input', '.filter-input', function () {
    var searchValue = $(this).val().toLowerCase();
    var column = $(this).data('column');
    // Find the closest checkbox container (within the same filter dropdown)
    var checkboxContainer = $(this).closest('.filter-dropdown').find('.checkbox-container');
    checkboxContainer.find('label').each(function () {
        var checkboxLabel = $(this).text().toLowerCase();
        $(this).toggle(checkboxLabel.includes(searchValue));
    });
});

// Single unified click handler to close filters when clicking outside
$(document).click(function (event) {
    // Check if click is outside filter elements
    if (!$(event.target).closest('.filter-dropdown, .filter-dropdown-double, .filter-division, .table-filter-arrow, .fafilter, .checkbox-container-double').length) {
        $('.filter-division').hide();
        closeAllFilters();
        closeAllFiltersDouble();
    }
});

// Prevent filter dropdowns from closing when clicking inside them
$(document).on('click', '.filter-dropdown, .filter-dropdown-double', function (event) {
    event.stopPropagation();
});

window.checkAllCheckboxesOnLoad = function checkAllCheckboxesOnLoad() {
    $('.filter-checkbox').prop('checked', true);
}

checkAllCheckboxesOnLoad();
window.toggleFilterDouble = function (columnName, bodyId) {
    closeAllFiltersDouble();
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    $('#filter-double-' + escapedId).toggle();
    $('.filter-dropdown').hide();
    $('#filterDropdown-' + escapedId).toggle();
    var $filterPanel = $('#filter-double-' + escapedId);
    if ($filterPanel.is(':visible')) {
        var doubleSpec = window.bizsolGetColumnFilterStore(tableId).double[columnName];
        if (doubleSpec) {
            if (doubleSpec.filterType) {
                $('#filter-type-' + escapedId).val(doubleSpec.filterType);
            }
            $filterPanel.find('.filter-input-double').val(doubleSpec.searchValue || '');
        }
        bizsolFloatFilterPanel($filterPanel);
    }
};

$(document).click(function (event) {
    if (!$(event.target).closest('.filter-dropdown-double, .fafilter').length) {
        closeAllFiltersDouble();
    }
});

var columnFilters = {};

// Helper function to check if any filters are active and manage the filtered class
window.updateFilteredClass = function(bodyId) {
    const tableId = $('#' + bodyId).closest('table').attr('id');
    var storedFilters = window.bizsolColumnFilterState && window.bizsolColumnFilterState[tableId];
    var hasStoredFilters = false;
    if (storedFilters) {
        hasStoredFilters = ['string', 'date', 'numeric', 'double'].some(function (kind) {
            return Object.keys(storedFilters[kind] || {}).length > 0;
        });
    }
    const hasActiveFilters = hasStoredFilters || Object.keys(columnFilters).length > 0 ||
                            $('.fa-filter[style*="color: white"]').length > 0;

    if (hasActiveFilters) {
        $('#' + bodyId).closest('.table-wrapper').addClass('filtered');
    } else {
        $('#' + bodyId).closest('.table-wrapper').removeClass('filtered');
    }
}

window.populateDateFilter = function (columnName, bodyId) {
closeAllFilters();
closeAllFiltersDouble();
    
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = columnName.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);
    
$('#filter-' + escapedId).toggle();
$('#filterDropdown-' + escapedId).toggle();
var $filterPanel = $('#filter-' + escapedId);
if ($filterPanel.is(':visible')) {
    bizsolFloatFilterPanel($filterPanel);
}
var uniqueDates = new Set();
var dateSource = window[`filteredDataTemp_${tableId}`] || window[`filteredData_${tableId}`] || [];
dateSource.forEach(function (row) {
    if (row.hasOwnProperty(columnName)) {
        uniqueDates.add(row[columnName]);
    }
});
var dateStructure = {};
uniqueDates.forEach(function (dateStr) {
    var dateObj = new Date(dateStr);
    var year = dateObj.getFullYear();
    var month = dateObj.toLocaleString('default', { month: 'long' });
    var day = dateObj.getDate();

    if (!dateStructure[year]) {
        dateStructure[year] = {};
    }
    if (!dateStructure[year][month]) {
        dateStructure[year][month] = [];
    }
    dateStructure[year][month].push(day);
});
var checkboxContainer1 = $('#checkbox-container-' + escapedId);
checkboxContainer1.empty();
checkboxContainer1.append('<label><input type="checkbox" class="filter-checkbox" value="All"> (Select All)</label>');
for (var year in dateStructure) {
    checkboxContainer1.append(
        `<label><i class="fa-solid fa-plus toggle-icon" data-target="year-${uniqueId}-${year}"></i><input type="checkbox" class="year-checkbox" value="${year}"> ${year}</label>` +
        `<div class="nested-checkbox" id="year-${uniqueId}-${year}"></div>`
    );
}
for (var year in dateStructure) {
    for (var month in dateStructure[year]) {
        var monthCheckbox = `<label><i class="fa-solid fa-plus toggle-icon" data-target="month-${uniqueId}-${year}-${month}"></i><input type="checkbox" class="month-checkbox" value="${month}"> ${month}</label>`;
        var dayCheckboxes = `<div class="nested-checkbox" id="month-${uniqueId}-${year}-${month}">`;
        dateStructure[year][month].forEach(function (day) {
            dayCheckboxes += `<label><input type="checkbox" class="day-checkbox" value="${day}"> ${day}</label>`;
        });
        dayCheckboxes += '</div>';

        $('#year-' + escapedId + '-' + year).append(monthCheckbox + dayCheckboxes);
    }
}
checkboxContainer1.find('.year-checkbox').change(function () {
    var isChecked = $(this).is(':checked');
    var year = $(this).val();
    $('#year-' + escapedId + '-' + year + ' input[type="checkbox"]').prop('checked', isChecked);
});
checkboxContainer1.find('.month-checkbox').change(function () {
    var isChecked = $(this).is(':checked');
    var monthCheckboxes = $(this).closest('label').nextAll('.nested-checkbox:first');
        monthCheckboxes.find('input[type="checkbox"]').prop('checked', isChecked);

        var yearCheckbox = $(this).closest('.nested-checkbox').prev('label').find('.year-checkbox');
        var monthCheckboxes = $(this).closest('.nested-checkbox').find('.month-checkbox');

        var checkedCount = monthCheckboxes.filter(':checked').length;
        yearCheckbox.prop('checked', checkedCount > 0);
    });
    checkboxContainer1.find('.day-checkbox').change(function () {
        var monthCheckbox = $(this).closest('.nested-checkbox').prev('label').find('.month-checkbox');
        var allDaysChecked = $(this).closest('.nested-checkbox').find('.day-checkbox:checked').length > 0;
        monthCheckbox.prop('checked', allDaysChecked);

        var yearCheckbox = monthCheckbox.closest('.nested-checkbox').prev('label').find('.year-checkbox');
        var allMonthsChecked = $(this).closest('.nested-checkbox').prevAll('label').find('.month-checkbox:checked').length;
        var allMonthsChecked1 = $(this).closest('.nested-checkbox').nextAll('label').find('.month-checkbox:checked').length;
        yearCheckbox.prop('checked', allMonthsChecked > 0 || allMonthsChecked1 > 0);
    });
    checkboxContainer1.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer1.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });
    checkboxContainer1.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer1.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer1.find('input[type="checkbox"]:checked').not('input[value="All"]').length;
        checkboxContainer1.find('input[value="All"]').prop('checked', allChecked);
    });
    $('.toggle-icon').click(function (event) {
        event.preventDefault();
        event.stopPropagation();
        var targetId = $(this).data('target');
        var escapedTargetId = escapeId(targetId);
        $('#' + escapedTargetId).toggle();
        $(this).toggleClass('fa-plus fa-minus');
    });
    window.bizsolRestoreCheckboxSelection(
        checkboxContainer1,
        window.bizsolGetSavedFilterValues(tableId, 'date', columnName)
    );
    window.bizsolMoveCheckedDateBlocksToTop(checkboxContainer1);
    if ($filterPanel.is(':visible')) {
        bizsolFloatFilterPanel($filterPanel);
    }
}
window.applyFilters = function applyFilters(bodyId) {
    const tableId = $('#' + bodyId).closest('table').attr('id');
    var store = window.bizsolGetColumnFilterStore(tableId);
    Object.keys(columnFilters || {}).forEach(function (column) {
        store.date[column] = columnFilters[column];
    });
    window.bizsolReapplyGridFilters(tableId, bodyId);
}
window.toggleFilterNumeric = function (filterId, ColumnName, bodyId) {
    closeAllFilters();
    closeAllFiltersDouble();
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = ColumnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    const escapedFilterId = escapeId(filterId);
    $('#filterDropdown-' + escapedId).toggle();
    $('#' + escapedFilterId).toggle();
    var numericSpec = window.bizsolGetColumnFilterStore(tableId).numeric[ColumnName];
    if (numericSpec) {
        $('#numeric-filter-select-' + escapedId).val(numericSpec.selectedOption);
        $('#filter-value-' + escapedId).val(isNaN(numericSpec.filterValue) ? '' : numericSpec.filterValue);
        $('#min-value-' + escapedId).val(isNaN(numericSpec.minValue) ? '' : numericSpec.minValue);
        $('#max-value-' + escapedId).val(isNaN(numericSpec.maxValue) ? '' : numericSpec.maxValue);
    }
    toggleNumericInputs(ColumnName, tableId);
    var $filterPanel = $('#' + escapedFilterId);
    if ($filterPanel.is(':visible')) {
        bizsolFloatFilterPanel($filterPanel);
    }
};
window.toggleNumericInputs = function (columnName, tableId) {
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = tableId ? `${tableId}-${colId}` : colId;
    const escapedId = escapeId(uniqueId);
    const selectedOption = $('#numeric-filter-select-' + escapedId).val();
    $('#filter-value-' + escapedId).hide();
    $('#min-value-' + escapedId).hide();
    $('#max-value-' + escapedId).hide();

    if (selectedOption === 'equals' || selectedOption === 'greater' || selectedOption === 'less') {
        $('#filter-value-' + escapedId).show();
    } else if (selectedOption === 'between') {
        $('#min-value-' + escapedId).show();
        $('#max-value-' + escapedId).show();
    }
};
window.applyNumericFilter = function (columnName, bodyId) {
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = columnName.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);
const selectedOption = $('#numeric-filter-select-' + escapedId).val();
const filterValue = parseFloat($('#filter-value-' + escapedId).val());
const minValue = parseFloat($('#min-value-' + escapedId).val());
const maxValue = parseFloat($('#max-value-' + escapedId).val());

    if (!isNaN(filterValue) || (!isNaN(minValue) && !isNaN(maxValue))) {
        window.bizsolGetColumnFilterStore(tableId).numeric[columnName] = {
            selectedOption: selectedOption,
            filterValue: filterValue,
            minValue: minValue,
            maxValue: maxValue
        };
        window.bizsolReapplyGridFilters(tableId, bodyId);
    }

    closeAllFilters();
};
window.bizsolMoveCheckedDateBlocksToTop = function bizsolMoveCheckedDateBlocksToTop($container) {
    if (!$container || !$container.length) {
        return;
    }
    var $all = $container.children('label').filter(function () {
        return $(this).find('input[type="checkbox"]').first().val() === 'All';
    }).first();
    var checked = [];
    var unchecked = [];
    $container.children('label').each(function () {
        var $label = $(this);
        if ($label.find('input[type="checkbox"]').first().val() === 'All') {
            return;
        }
        var $nested = $label.next('.nested-checkbox');
        var isChecked = $label.find('input[type="checkbox"]').first().is(':checked') ||
            ($nested.length > 0 && $nested.find('input[type="checkbox"]:checked').length > 0);
        (isChecked ? checked : unchecked).push({ label: this, nested: $nested.get(0) || null });
    });
    var $anchor = $all;
    checked.concat(unchecked).forEach(function (block) {
        if ($anchor && $anchor.length) {
            $(block.label).insertAfter($anchor);
            $anchor = $(block.label);
        } else {
            $container.append(block.label);
            $anchor = $(block.label);
        }
        if (block.nested) {
            $(block.nested).insertAfter($anchor);
            $anchor = $(block.nested);
        }
    });
};

window.bizsolResetColumnFilterInputs = function bizsolResetColumnFilterInputs(tableId, columnName) {
    var colId = String(columnName || '').replace(/\s+/g, '');
    var escapedId = escapeId(tableId + '-' + colId);
    var $stringPanel = $('#filter-' + escapedId);
    $stringPanel.find('.filter-input').val('');
    $stringPanel.find('input[type="checkbox"]').prop('checked', false);
    var $numericPanel = $('#filter-dropdown-numeric-' + escapedId);
    $numericPanel.find('input').val('');
    $('#numeric-filter-select-' + escapedId).val('equals');
    var $doublePanel = $('#filter-double-' + escapedId);
    $doublePanel.find('.filter-input-double').val('');
    $doublePanel.find('input[type="checkbox"]').prop('checked', false);
};

window.ClearColumnFilter = function ClearColumnFilter(columnName, bodyId) {
    var tableId = $('#' + bodyId).closest('table').attr('id');
    var store = window.bizsolGetColumnFilterStore(tableId);
    ['string', 'date', 'numeric', 'double'].forEach(function (kind) {
        if (store[kind] && Object.prototype.hasOwnProperty.call(store[kind], columnName)) {
            delete store[kind][columnName];
        }
    });
    if (columnFilters && Object.prototype.hasOwnProperty.call(columnFilters, columnName)) {
        delete columnFilters[columnName];
    }
    window.bizsolResetColumnFilterInputs(tableId, columnName);
    window.bizsolReapplyGridFilters(tableId, bodyId);
    closeAllFilters();
    closeAllFiltersDouble();
};

window.ClearFilter = function ClearFilter(bodyId) {
    $('.filter-dropdown, .filter-dropdown-double, .filter-division').each(function () {
        bizsolResetFloatFilterPanel($(this));
    });
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-input-double').val('');
    $('.filter-dropdown input[type="number"]').val('');
    $('.filter-dropdown select[id^="numeric-filter-select-"]').val('equals');
    $('.filter-dropdown, .filter-dropdown-double').find('input[type="checkbox"]').prop('checked', false);
    $('.filter-dropdown-double').hide();
    columnFilters = {};
    const tableId = $('#' + bodyId).closest('table').attr('id');
    window.bizsolClearColumnFilterStore(tableId);
    window.bizsolReapplyGridFilters(tableId, bodyId);
};
// ─── GLOBAL SEARCH ──────────────────────────────────────────────────────────

/**
 * Injects a global full-text search box above the table-wrapper.
 * @param {string} tableId
 * @param {string} bodyId
 * @param {string} placeholder  – text shown inside the input
 */
window.createGlobalSearchBox = function createGlobalSearchBox(tableId, bodyId, placeholder) {
    // Remove any existing box so re-initialisation stays clean
    $('#global-search-wrap-' + tableId).remove();

    const html = `
        <div id="global-search-wrap-${tableId}" class="bizsol-global-search-wrap">
            <span class="bizsol-gs-icon"><i class="fa fa-search"></i></span>
            <input  type="text"
                    id="global-search-input-${tableId}"
                    class="bizsol-global-search-input form-control"
                    placeholder="${placeholder}"
                    autocomplete="off" />
            <span class="bizsol-gs-clear" id="global-search-clear-${tableId}" title="Clear search" style="display:none;">
                <i class="fa fa-times-circle"></i>
            </span>
        </div>`;

    // Prepend above the table-wrapper (or the table itself as fallback)
    const $wrapper = $('#' + bodyId).closest('.table-wrapper');
    if ($wrapper.length) {
        $wrapper.before(html);
    } else {
        $('#' + bodyId).closest('table').before(html);
    }

    // Live-search on every keystroke
    $('#global-search-input-' + tableId).on('input', function () {
        const val = $(this).val();
        $('#global-search-clear-' + tableId).toggle(val.length > 0);
        applyGlobalSearch(tableId, bodyId);
    });

    // Clear button
    $('#global-search-clear-' + tableId).on('click', function () {
        $('#global-search-input-' + tableId).val('').trigger('input');
    });
};

/**
 * Filters the full data set against all visible columns and refreshes the grid.
 * @param {string} tableId
 * @param {string} bodyId
 */
window.applyGlobalSearch = function applyGlobalSearch(tableId, bodyId) {
    const term = ($('#global-search-input-' + tableId).val() || '').toLowerCase().trim();
    window[`globalSearchTerm_${tableId}`] = term;
    window[`currentPage_${tableId}`] = 1;
    window.bizsolReapplyGridFilters(tableId, bodyId);
};

/**
 * Wraps each visible occurrence of the search term in a highlight mark.
 * HTML tags in the cell are left untouched so existing markup stays valid.
 */
window.highlightGridSearchTerm = function highlightGridSearchTerm(value, term) {
    if (value === null || value === undefined) return value;
    const text = String(value);
    const needle = (term || '').trim();
    if (!needle || !text) return text;

    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(/(<[^>]*>)/g);
    const re = new RegExp(escaped, 'gi');
    return parts.map(function (part) {
        if (part.charAt(0) === '<' && part.charAt(part.length - 1) === '>') return part;
        return part.replace(re, function (match) {
            return '<mark class="bizsol-search-highlight">' + match + '</mark>';
        });
    }).join('');
};

window.applyStringFilters = function applyStringFilters(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const checkboxContainerId = tableId +'-'+column.replace(/\s+/g, '');
    const escapedCheckboxId = escapeId(checkboxContainerId);
    $('#checkbox-container-' + escapedCheckboxId + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    if (selectedValues.length > 0) {
        window.bizsolGetColumnFilterStore(tableId).string[column] = selectedValues.slice();
        window.bizsolReapplyGridFilters(tableId, bodyId);
    }
    closeAllFilters();
}
window.ShowEntry = function ShowEntry(columnName, bodyId) {
    populateFilterOptionsDouble(columnName, bodyId);
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const uniqueId = tableId + '-' + columnName.replace(/\s+/g, '');
    $('#checkbox-container-double-' + escapeId(uniqueId)).toggle();
}
window.populateFilterOptionsDouble = function populateFilterOptionsDouble(columnName, bodyId) {
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    var uniqueValues = window.bizsolCollectColumnValues(tableId, columnName);
    var saved = window.bizsolGetSavedFilterValues(tableId, 'double', columnName);

    var checkboxContainer = $('#checkbox-container-double-' + escapedId);
    checkboxContainer.empty();
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="All"> All</label>');
    uniqueValues.forEach(function (value) {
        var safe = window.bizsolEscapeFilterHtml(value);
        checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="' + safe + '"> ' + safe + '</label>');
    });
    window.bizsolRestoreCheckboxSelection(checkboxContainer, saved);
    window.bizsolMoveCheckedLabelsToTop(checkboxContainer);
    checkboxContainer.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });
    checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer.find('input[type="checkbox"]:checked').not('input[value="All"]').length;
        checkboxContainer.find('input[value="All"]').prop('checked', allChecked);
    });
}
window.applyfilterdouble = function applyfilterdouble(columnName, bodyId) {
var column = columnName;
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = column.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);

var filterType = $('#filter-type-' + escapedId).val();
var searchValue = ($('#filter-double-' + escapedId).find('.filter-input-double').val() || '').trim().toLowerCase();
var selectedValues = [];

$('#checkbox-container-double-' + escapedId + ' input:checked').each(function () {
    if ($(this).val() !== "All") {
        selectedValues.push($(this).val());
    }
});
var useCheckboxFilter = selectedValues.length > 0;
var useTextFilter = searchValue.length > 0;
if (useCheckboxFilter || useTextFilter) {
    window.bizsolGetColumnFilterStore(tableId).double[column] = {
        filterType: filterType,
        searchValue: searchValue,
        selectedValues: selectedValues.slice(),
        useCheckboxFilter: useCheckboxFilter,
        useTextFilter: useTextFilter
    };
    window.bizsolReapplyGridFilters(tableId, bodyId);
}
closeAllFiltersDouble();
};
window.closeAllFiltersDouble = function closeAllFiltersDouble() {
    $('.filter-dropdown-double').each(function () {
        bizsolResetFloatFilterPanel($(this));
    });
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}
window.applyfilterdate = function applyfilterdate(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];

    // Use the same ID pattern as populateDateFilter / renderTableHeader
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = column.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);

    $('#checkbox-container-' + escapedId + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    columnFilters[column] = selectedValues;
    applyFilters(bodyId);
    closeAllFilters();
}
window.renderTableHeader = function renderTableHeader(hiddenColumns, headerId, bodyId, columns, button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn) {
if (typeof closeAllFilters === 'function') {
    closeAllFilters();
}
if (typeof closeAllFiltersDouble === 'function') {
    closeAllFiltersDouble();
}
const $header = $(`#${headerId}`);
$header.empty();
const tableId = $(`#${bodyId}`).closest('table').attr('id');
let headerRow = '<tr>';
columns.forEach(col => {
    let filterHtml = '';
    const colId = col.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`; // Make IDs unique per table
        
    if (StringFilterColumn.includes(col)) {
        filterHtml = `<th>
                                     <div class="filter-table-heading-div">
                                      <span class="filter-table-heading">${col}</span>
                                        <span class="table-filter-arrow">
                                          <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                        </span>
                                          <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                            <div class="dropdown-content">
                                              <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc" data-tbody-id="${bodyId}">
                                                <i class="fa-solid fa-arrow-up-a-z sort-indicator sort-indicator-color"></i> Ascending
                                              </div>
                                              <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc" data-tbody-id="${bodyId}">
                                                <i class="fa-solid fa-arrow-down-z-a sort-indicator sort-indicator-color"></i> Descending
                                              </div>
                                              <div class="dropdown-item fafilter" onclick="toggleFilter('${col}','${bodyId}')">
                                                <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div class="filter-dropdown" id="filter-${uniqueId}">
                                        <input type="text" placeholder="Search..." class="filter-input form-control form-control-sm" data-column="${col}" />
                                        <div class="checkbox-container" id="checkbox-container-${uniqueId}"></div>
                                        <hr>
                                        <div class="filter-actions">
                                        <button class="btn btn-success btn-height" onclick="applyStringFilters('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                        <button class="btn btn-success btn-height" onclick="ClearColumnFilter('${col}','${bodyId}')">Clear</button>
                                        <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear All</button>
                                        </div>
                                        </div>
                                       </div>
                                 </th>`;
        } else if (NumericFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div class="filter-table-heading-div">
                                              <span class="filter-table-heading">${col}</span>
                                              <span class="table-filter-arrow">
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc" data-tbody-id="${bodyId}">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc" data-tbody-id="${bodyId}">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="toggleFilterNumeric('filter-dropdown-numeric-${uniqueId}','${col}','${bodyId}');">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                         <div class="filter-dropdown" id="filter-dropdown-numeric-${uniqueId}">
                                          <select id="numeric-filter-select-${uniqueId}" onchange="toggleNumericInputs('${col}', '${tableId}')">
                                                <option value="equals">=</option>
                                                <option value="greater">></option>
                                                <option value="less">&lt;</option>
                                                <option value="between">Between</option>
                                            </select>
                                            <div class="filter-inputs">
                                                <input type="number" id="filter-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Enter value" />
                                                 <input type="number" id="min-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Min value" style="display:none" />
                                                <input type="number" id="max-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Max value" style="display:none" />
                                            </div>
                                            <div class="filter-actions">
                                            <button class="btn btn-success btn-height" onclick="applyNumericFilter('${col}','${bodyId}')">Apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearColumnFilter('${col}','${bodyId}')">Clear</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear All</button>
                                            </div>
                                         </div>
                                         </th>`;
        } else if (DateFilterColumn.includes(col)) {
            filterHtml = ` <th>
                                            <div class="filter-table-heading-div">
                                              <span class="filter-table-heading"> ${col}</span>
                                              <span class="table-filter-arrow">
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc" data-tbody-id="${bodyId}">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc" data-tbody-id="${bodyId}">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="populateDateFilter('${col}','${bodyId}')">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                            <div class="filter-dropdown" id="filter-${uniqueId}">
                                            <div class="checkbox-container" id="checkbox-container-${uniqueId}"></div>
                                            <div class="filter-actions">
                                            <button class="btn btn-success btn-height" onclick="applyfilterdate('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearColumnFilter('${col}','${bodyId}')">Clear</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear All</button>
                                            </div>
                                            </div>
                                       </th>`;
        } else if (StringdoubleFilterColumn.includes(col)) {
            filterHtml = `<th>
                                           <div class="filter-table-heading-div">
                                         <span class="filter-table-heading">${col}</span>
                                         <span class="table-filter-arrow">
                                             <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                           </span>
                                             <div class="filter-division" onclick="stopPropagationdouble(event)" id="filterDropdown-${uniqueId}" style="display:none;">
                                               <div class="dropdown-content">
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc" data-tbody-id="${bodyId}">
                                                   <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                 </div>
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc" data-tbody-id="${bodyId}">
                                                   <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                 </div>
                                                 <div class="dropdown-item fafilter" onclick="toggleFilterDouble('${col}','${bodyId}')">
                                                   <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                 </div>
                                               </div>
                                             </div>
                                          </div>
                                        <div class="filter-dropdown-double" onclick="stopPropagationdouble(event)" id="filter-double-${uniqueId}">
                                         <select class="filter-type" id="filter-type-${uniqueId}">
                                            <option value="startsWith">Starts With</option>
                                            <option value="endsWith">Ends With</option>
                                            <option value="like">Between</option>
                                        </select>
                                        <input type="text" placeholder="Search..." class="filter-input-double form-control form-control-sm" data-column="${col}" />
                                        <div class="checkbox-container-double" id="checkbox-container-double-${uniqueId}"></div>
                                        <div class="filter-actions">
                                        <button class="btn btn-success btn-height" onclick="applyfilterdouble('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                        <button class="btn btn-primary btn-height" onclick="ShowEntry('${col}','${bodyId}')" data-column="${col}">Show Entries</button>
                                        <button class="btn btn-success btn-height" onclick="ClearColumnFilter('${col}','${bodyId}')">Clear</button>
                                        <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear All</button>
                                        </div>
                                        </div>
                                    </th>`;
        } else if (hiddenColumns.includes(col)) {
            filterHtml = `<th style="display:none">${col}</th>`
        }
        else {
            filterHtml = `<th>${col}</th>`;
        }
        headerRow += `${filterHtml}`;
    });
    if (button) {
        headerRow += '<th style="min-width:120px !important">Action</th></tr>';
    } else {
        headerRow += '</tr>';
    }
    $header.append(headerRow);
    window.bizsolTagHeaderColumns($header, columns, !!button);
    window.bizsolBindManualColumnExpand(tableId);
    window.bizsolApplyManualColumnWidths(tableId);
}
window.sortable = function sortable(element) {
    var column = $(element).data('column');
    var order = $(element).data('order');
    // Use data-tbody-id stored on the button at render time, because the filter
    // panel is moved to <body> by bizsolMoveFilterPanelToBody and is no longer
    // a descendant of the table when the user clicks Ascending/Descending.
    var tbodyId = $(element).data('tbody-id');
    if (!tbodyId) {
        // Fallback for older markup that may not have the attribute
        tbodyId = $(element).closest('table').find('tbody').attr('id');
    }
    sortTable(column, order, tbodyId);
};
window.sortTable = function sortTable(column, order, tbodyId) {
    const tableId = $('#' + tbodyId).closest('table').attr('id');
    window[`bizsolSort_${tableId}`] = { column: column, order: order };
    var data = window[`filteredData_${tableId}`];

    if (!Array.isArray(data)) {
        console.warn('sortTable: no data found for tableId:', tableId, 'tbodyId:', tbodyId);
        return;
    }

    data.sort(function (a, b) {
        var keyA = a[column] !== undefined && a[column] !== null ? String(a[column]).trim() : '';
        var keyB = b[column] !== undefined && b[column] !== null ? String(b[column]).trim() : '';
        if ($.isNumeric(keyA) && $.isNumeric(keyB)) {
            return (order === 'asc') ? parseFloat(keyA) - parseFloat(keyB) : parseFloat(keyB) - parseFloat(keyA);
        } else {
            return (order === 'asc') ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
        }
    });

    window[`filteredData_${tableId}`] = data;
    renderTable(data, tbodyId);
    if (window[`Paginator_${tableId}`]) {
        window[`currentPage_${tableId}`] = 1;
        createPaginator(tableId, tbodyId);
        renderTableWithPagination(tableId, tbodyId);
    }
    CloseFilter();
}
window.stopPropagationdouble = function stopPropagationdouble(event) {
    event.stopPropagation();
};
window.renderTable = function renderTable(items, bodyId, skipTotalRow = false) {
    let showButtons = ''
    const tableId = $('#' + bodyId).closest('table').attr('id');
    var button = window[`button_${tableId}`];
    if (button == true) {
        showButtons = window[`ShowButtons_${bodyId}`]
    }

    const totalColumns = window[`totalColumns_${bodyId}`];
    const lastValueColumns = window.resolveLastValueColumns(
        window[`lastValueColumns_${bodyId}`],
        (items && items.length) ? Object.keys(items[0]) : totalColumns
    );
    const columnTotals = {};
    let _floatingTfootHtml = null;

    // Calculate totals for specified columns (if not skipping)
    if (totalColumns && Array.isArray(totalColumns) && totalColumns.length > 0 && !skipTotalRow) {
        totalColumns.forEach(colName => {
            columnTotals[colName] = 0;
        });

        items.forEach(item => {
            totalColumns.forEach(colName => {
                if (lastValueColumns.includes(colName)) {
                    return;
                }
                const value = window.parseNumericCellForTotal(item[colName]);
                if (!isNaN(value) && isFinite(value)) {
                    columnTotals[colName] += value;
                }
            });
        });
        window.applyLastValueColumnTotals(columnTotals, items, totalColumns, lastValueColumns);
    }

    const searchTerm = window[`globalSearch_${tableId}`]
        ? (window[`globalSearchTerm_${tableId}`] || '')
        : '';

    let rows = items.map((item, index) => {
        const row = Object.keys(item).map((key) => {
            const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
            const isHiddenColumn = window[`hiddenColumns_${bodyId}`].includes(key);
            const style = isHiddenColumn
                ? 'display:none'
                : `text-align:${alignment}`;

            // Format numeric values based on FixedDecimalvalue / CommaColumns parameters
            let cellValue = item[key];
            const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];
            const commaColumns = window[`commaColumns_${bodyId}`] || [];

            const isNumeric = cellValue !== null && cellValue !== undefined
                              && !isNaN(parseFloat(cellValue)) && isFinite(cellValue);
            const forcedDecimalPlaces = window.getForcedDecimalPlaces(key, fixedDecimalConfig);
            const needsDecimalFormat = isNumeric && (
                commaColumns.includes(key) ||
                forcedDecimalPlaces !== null
            );

            if (needsDecimalFormat) {
                let decimalPlaces = forcedDecimalPlaces !== null ? forcedDecimalPlaces : 3;
                if (commaColumns.includes(key)) {
                    cellValue = formatIndianNumber(parseFloat(item[key]), decimalPlaces);
                } else {
                    cellValue = parseFloat(cellValue).toFixed(decimalPlaces);
                }
            } else if (isNumeric) {
                cellValue = window.formatGridNumericDisplay(cellValue);
            }

            if (searchTerm && !isHiddenColumn && cellValue !== null && cellValue !== undefined) {
                const rawText = item[key] === null || item[key] === undefined ? '' : String(item[key]);
                const displayText = String(cellValue);
                if (displayText.toLowerCase().includes(searchTerm)) {
                    cellValue = window.highlightGridSearchTerm(cellValue, searchTerm);
                } else if (rawText.toLowerCase().includes(searchTerm)) {
                    cellValue = '<mark class="bizsol-search-highlight">' + cellValue + '</mark>';
                }
            }

            return `<td style="${style}">${cellValue}</td>`;
        }).join('');

        let buttons = '';

        if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
            buttons = '<td class="bizsol-action-cell">';
            if (showButtons.includes('E')) {
                buttons += ` <button class="btn btn-primary icon-height mb-1" title="Edit"><i aria-hidden="true" class="fa fa-pencil" type="button" onclick="EditData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('D')) {
                buttons += ` <button class="btn btn-danger icon-height mb-1" title="Delete"><i aria-hidden="true" class="fa fa-trash" type="button" onclick="DeleteData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('V')) {
                buttons += `<button class="btn btn-info icon-height mb-1" title="View"> <i aria-hidden="true" class="fa fa-eye" type="button" onclick="ViewData('${item.Code}')" value="View"/></i></button> `;
            }
            if (showButtons.includes('VE')) {
                buttons += `<button class="btn btn-success icon-height mb-1" title="Verify"><i class="fa fa-check" type="button" onclick="VerifyData('${item.Code}')" value="Verify"/></i></button> `;
            }
            if (showButtons.includes('A')) {
                buttons += `<button class="btn btn-warning icon-height mb-1" title="Approve"><i class="fa-check-square-o" type="button" onclick="ApproveData('${item.Code}')" value="Approve"/></i></button> `;
            }
            if (showButtons.includes('M')) {
                buttons += `<button class="btn btn-info icon-height mb-1" title="More Info"><i class="" type="button" onclick="MoreData('${item.Code}')" value="..."/></i></button> `;
            }

            buttons += '</td>';
        }

        const _bizsolRC = item.__bizsolRowClass;
        const _trClass =
            _bizsolRC != null && String(_bizsolRC).trim() !== ''
                ? ` class="${String(_bizsolRC).replace(/"/g, '')}"`
                : '';
        return `<tr data-index="${index}"${_trClass}>${row}${buttons}</tr>`;
    }).join('');

    // Add total row if totalColumns is specified and not skipping
    if (totalColumns && Array.isArray(totalColumns) && totalColumns.length > 0 && items.length > 0 && !skipTotalRow) {
        const firstItem = items[0];
        const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];

        const _totalRowKeys = Object.keys(firstItem);
        const _firstVisibleTotalIdx = _totalRowKeys.findIndex(k => !window[`hiddenColumns_${bodyId}`].includes(k));
        const totalRow = _totalRowKeys.map((key, colIndex) => {
            const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
            const style = window[`hiddenColumns_${bodyId}`].includes(key)
                ? 'display:none'
                : `text-align:${alignment}`;

            let cellContent = '';

            if (colIndex === _firstVisibleTotalIdx) {
                // First visible column shows "Total" label
                cellContent = '<strong>Total</strong>';
            } else if (totalColumns.includes(key)) {
                const commaColumns = window[`commaColumns_${bodyId}`] || [];
                const forcedDecimalPlaces = window.getForcedDecimalPlaces(key, fixedDecimalConfig);
                let totalValue;
                if (commaColumns.includes(key) || forcedDecimalPlaces !== null) {
                    const decimalPlaces = forcedDecimalPlaces !== null ? forcedDecimalPlaces : 3;
                    totalValue = commaColumns.includes(key)
                        ? formatIndianNumber(columnTotals[key], decimalPlaces)
                        : columnTotals[key].toFixed(decimalPlaces);
                } else {
                    totalValue = window.formatGridNumericDisplay(columnTotals[key]);
                }
                cellContent = `<strong>${totalValue}</strong>`;
            }

            return `<td style="${style}; font-weight: bold; background-color: #ffffff; border-top: 2px solid #333;">${cellContent}</td>`;
        }).join('');

        let totalButtons = '';
        if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
            totalButtons = '<td class="bizsol-action-cell" style="background-color: #ffffff; border-top: 2px solid #333;"></td>';
        }

        const _isFloatingTotal = window[`floatingTotalRow_${bodyId}`];
        if (_isFloatingTotal) {
            // Store for tfoot update after tbody is written
            _floatingTfootHtml = `<tr class="total-row">${totalRow}${totalButtons}</tr>`;
        } else {
            rows += `<tr class="total-row">${totalRow}${totalButtons}</tr>`;
        }
    }

    $(`#${bodyId}`).html(rows);

    // Push total row into sticky tfoot when floating mode is active
    if (_floatingTfootHtml !== null) {
        $(`#tfoot-${bodyId}`).html(_floatingTfootHtml);
    }

    if (tableId === "VendorMaster") {
        const $body = $(`#${bodyId}`);
        $body.find("td").removeClass("vm-cell-action");
        $body.find(".vm-action-btns").closest("td").addClass("vm-cell-action");
    }
    if (tableId === "OrderList" && typeof window.applyOrderListTransferredRowColors === "function") {
        window.applyOrderListTransferredRowColors();
    }
    if (tableId === "RMReport" && typeof window.applyRMReportRemarkColors === "function") {
        window.applyRMReportRemarkColors();
    }
    window.bizsolApplyManualColumnWidths(tableId);
}
window.renderGrandTotalRow = function renderGrandTotalRow(tableId, bodyId) {
    const totalColumns = window[`totalColumns_${bodyId}`];
    const filteredData = window[`filteredData_${tableId}`];
    const lastValueColumns = window.resolveLastValueColumns(
        window[`lastValueColumns_${bodyId}`],
        (filteredData && filteredData.length) ? Object.keys(filteredData[0]) : totalColumns
    );
    const isPaginated = window[`Paginator_${tableId}`];
    
    console.log('renderGrandTotalRow called:', { tableId, bodyId, isPaginated, totalColumns, dataLength: filteredData?.length });
    
    // Only render grand total if pagination is enabled and totalColumns is specified
    if (!isPaginated || !totalColumns || !Array.isArray(totalColumns) || totalColumns.length === 0 || !filteredData || filteredData.length === 0) {
        console.log('renderGrandTotalRow: Skipping grand total row', { isPaginated, hasTotalColumns: !!totalColumns, hasData: !!filteredData });
        return;
    }

    var button = window[`button_${tableId}`];
    var showButtons = window[`ShowButtons_${bodyId}`];

    // Calculate grand totals from ALL filtered data
    const grandTotals = {};
    totalColumns.forEach(colName => {
        grandTotals[colName] = 0;
    });

    filteredData.forEach(item => {
        totalColumns.forEach(colName => {
            if (lastValueColumns.includes(colName)) {
                return;
            }
            const value = window.parseNumericCellForTotal(item[colName]);
            if (!isNaN(value) && isFinite(value)) {
                grandTotals[colName] += value;
            }
        });
    });
    window.applyLastValueColumnTotals(grandTotals, filteredData, totalColumns, lastValueColumns);

    console.log('Grand Totals calculated:', grandTotals);

    // Build grand total row
    const firstItem = filteredData[0];
    const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];

    const _grandTotalRowKeys = Object.keys(firstItem);
    const _firstVisibleGrandIdx = _grandTotalRowKeys.findIndex(k => !window[`hiddenColumns_${bodyId}`].includes(k));
    const grandTotalRow = _grandTotalRowKeys.map((key, colIndex) => {
        const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
        const style = window[`hiddenColumns_${bodyId}`].includes(key)
            ? 'display:none'
            : `text-align:${alignment}`;

        let cellContent = '';

        if (colIndex === _firstVisibleGrandIdx) {
            // First visible column shows "Grand Total" label
            cellContent = '<strong>Grand Total</strong>';
        } else if (totalColumns.includes(key)) {
            const commaColumns = window[`commaColumns_${bodyId}`] || [];
            const forcedDecimalPlaces = window.getForcedDecimalPlaces(key, fixedDecimalConfig);
            let totalValue;
            if (commaColumns.includes(key) || forcedDecimalPlaces !== null) {
                const decimalPlaces = forcedDecimalPlaces !== null ? forcedDecimalPlaces : 2;
                totalValue = commaColumns.includes(key)
                    ? formatIndianNumber(grandTotals[key], decimalPlaces)
                    : grandTotals[key].toFixed(decimalPlaces);
            } else {
                totalValue = window.formatGridNumericDisplay(grandTotals[key]);
            }
            cellContent = `<strong>${totalValue}</strong>`;
        }

        return `<td style="${style}; font-weight: bold; background-color: #d4edda; border-top: 3px solid #28a745;">${cellContent}</td>`;
    }).join('');

    let totalButtons = '';
    if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
        totalButtons = '<td class="bizsol-action-cell" style="background-color: #d4edda; border-top: 3px solid #28a745;"></td>';
    }

    const grandTotalRowHtml = `<tr class="grand-total-row">${grandTotalRow}${totalButtons}</tr>`;

    const _isFloatingGrandTotal = window[`floatingTotalRow_${bodyId}`];
    if (_isFloatingGrandTotal) {
        // Overwrite the sticky tfoot with the grand total (covers all filtered data)
        $(`#tfoot-${bodyId}`).html(grandTotalRowHtml);
    } else {
        // Append grand total row to tbody (default behaviour)
        $(`#${bodyId}`).append(grandTotalRowHtml);
    }
    window.bizsolApplyManualColumnWidths(tableId);
}
window.updatePageInfo = function updatePageInfo(tableId) {
    var filteredData = window[`filteredData_${tableId}`];
    var currentPage = window[`currentPage_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    const maxPage = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    if (itemsPerPage >= filteredData.length) {
        currentPage = 1;
    } else if (currentPage > maxPage) {
        currentPage = maxPage;
    }
    window[`currentPage_${tableId}`] = currentPage;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredData.length);
    $(`#pageInfo-${tableId}`).text(`${start} – ${end} of ${filteredData.length}`);
}
window.updateButtons = function updateButtons(tableId) {
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    $(`#firstBtn-${tableId}, #prevBtn-${tableId}`).prop('disabled', currentPage === 1);
    $(`#nextBtn-${tableId}, #lastBtn-${tableId}`).prop('disabled', currentPage === totalPages);
}
window.renderTableWithPagination = function renderTableWithPagination(tableId, bodyId) {
    updatePageInfo(tableId);
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = filteredData.slice(start, end);
    renderTable(itemsToDisplay, bodyId, false); // Pass false to show total row for current page

    // Add grand total row after paginated data (shows total of ALL data)
    renderGrandTotalRow(tableId, bodyId);

    updateButtons(tableId);
}
window.firstBtn = function firstBtn(tableId, bodyId) {
    var currentPage = window[`currentPage_${tableId}`];
    window[`currentPage_${tableId}`] = 1;
    renderTableWithPagination(tableId, bodyId);
};
window.prevBtn = function prevBtn(tableId, bodyId) {
    var currentPage = window[`currentPage_${tableId}`];

    if (currentPage > 1) {
        window[`currentPage_${tableId}`]--;
        renderTableWithPagination(tableId, bodyId);
    }
};
window.nextBtn = function nextBtn(tableId, bodyId) {
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        window[`currentPage_${tableId}`]++;
        renderTableWithPagination(tableId, bodyId);
    }
};
window.lastBtn = function lastBtn(tableId, bodyId) {
    var filteredData = window[`filteredData_${tableId}`];
    var currentPage = window[`currentPage_${tableId}`];

    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    window[`currentPage_${tableId}`] = Math.ceil(filteredData.length / itemsPerPage);
    renderTableWithPagination(tableId, bodyId);
};
window.pageSize = function pageSize(tableId, bodyId) {
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];

    currentPage = 1;
    renderTableWithPagination(tableId, bodyId);
};
window.createPaginator = function createPaginator(tableId, bodyId) {
    $('#paginator-' + tableId).empty();
    var perPageCfg = window.getBizsolPerPageConfig();
    var pageSizeOptionsHtml = window.buildPageSizeOptionsHtml(perPageCfg.options, perPageCfg.value);
    var filterHtml = `
        <div class="page-size-select">
            <label for="pageSize-${tableId}">Lines Per Page:</label>
            <select onchange="pageSize('${tableId}','${bodyId}')" class="pageSize" id="pageSize-${tableId}">
                ${pageSizeOptionsHtml}
            </select>
        </div>
        <button id="firstBtn-${tableId}" onclick="firstBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path>
            </svg>
        </button>
        <button id="prevBtn-${tableId}" onclick="prevBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
            </svg>
        </button>
        <span class="page-info" id="pageInfo-${tableId}">1 – 10 of 0</span>
        <button id="nextBtn-${tableId}" onclick="nextBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
            </svg>
        </button>
        <button id="lastBtn-${tableId}" onclick="lastBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path>
            </svg>
        </button>
    `;

    var $pag = $('#paginator-' + tableId);
    $pag.append(filterHtml);
    $pag.css('display', 'flex').show();
}
window.OpenFilter = function OpenFilter(columnName, event) {
    // Prevent event from bubbling to document click handler
    if (event) {
        event.stopPropagation();
    }
    
    // Close all other filter divisions first
    $(".filter-division").each(function () {
        bizsolResetFloatFilterPanel($(this));
    });
    $(".filter-division").hide();
    
    // Show the clicked filter division
    const escapedId = escapeId(columnName);
    var $filterDivision = $("#filterDropdown-" + escapedId);
    $filterDivision.show();
    bizsolFloatFilterPanel($filterDivision);
}
window.CloseFilter = function CloseFilter() {
    $(".filter-division").each(function () {
        bizsolResetFloatFilterPanel($(this));
    });
    $(".filter-division").hide();
}

