import { DashboardConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DashboardConfigurationService.js';

function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.Data && Array.isArray(payload.Data)) return payload.Data;
    if (payload.value && Array.isArray(payload.value)) return payload.value;
    if (payload.Value && Array.isArray(payload.Value)) return payload.Value;
    if (payload.result && Array.isArray(payload.result)) return payload.result;
    if (payload.Result && Array.isArray(payload.Result)) return payload.Result;
    if (payload.Table && Array.isArray(payload.Table)) return payload.Table;
    if (payload.table && Array.isArray(payload.table)) return payload.table;
    // Nested common wrappers
    if (payload.data && payload.data.$values && Array.isArray(payload.data.$values)) return payload.data.$values;
    if (payload.Data && payload.Data.$values && Array.isArray(payload.Data.$values)) return payload.Data.$values;
    return [];
}

function destroySelect2IfAny($sel) {
    try {
        if ($sel.data('select2')) {
            $sel.select2('destroy');
        }
    } catch (e) { /* ignore */ }
}

function pickCode(item) {
    if (!item) return '';
    var code = item.Code != null ? item.Code
        : (item.code != null ? item.code : '');
    return code != null ? String(code) : '';
}

function pickDesp(item) {
    if (!item) return '';
    var text = item.Desp != null ? item.Desp
        : (item.desp != null ? item.desp
            : (item.Name != null ? item.Name
                : (item.name != null ? item.name : '')));
    return (text || '').toString().trim();
}

function pickUserName(item) {
    if (!item) return '';
    var text = item.UserName != null ? item.UserName
        : (item.userName != null ? item.userName
            : (item.Username != null ? item.Username
                : pickDesp(item)));
    return (text || '').toString().trim();
}

function pickTileCode(item) {
    if (!item) return '';
    var code = item.WebApiDashboardTileDetail_Code != null ? item.WebApiDashboardTileDetail_Code
        : (item.webApiDashboardTileDetail_Code != null ? item.webApiDashboardTileDetail_Code
            : (item.WebApiDashboardTileDetail != null ? item.WebApiDashboardTileDetail
                : pickCode(item)));
    return code != null ? String(code) : '';
}

function pickMasterCode(item) {
    if (!item) return '';
    var code = item.WebApiDashboardMaster_Code != null ? item.WebApiDashboardMaster_Code
        : (item.webApiDashboardMaster_Code != null ? item.webApiDashboardMaster_Code
            : (item.DashboardMaster_Code != null ? item.DashboardMaster_Code
                : (item.dashboardMaster_Code != null ? item.dashboardMaster_Code
                    : pickCode(item))));
    return code != null ? String(code) : '';
}

function isAssignedFlag(item) {
    if (!item) return false;
    var flag = item.IsAssigned != null ? item.IsAssigned
        : (item.isAssigned != null ? item.isAssigned
            : (item.IsSelected != null ? item.IsSelected
                : (item.isSelected != null ? item.isSelected
                    : (item.Selected != null ? item.Selected : null))));
    if (flag == null) return false;
    if (typeof flag === 'boolean') return flag;
    var s = String(flag).trim().toUpperCase();
    return s === 'Y' || s === 'TRUE' || s === '1' || s === 'YES';
}

function readApiStatus(response) {
    if (!response || typeof response !== 'object') return null;
    if (response.Status != null) return response.Status;
    if (response.status != null) return response.status;
    if (response.MsgStatus != null) return response.MsgStatus;
    if (response.msgStatus != null) return response.msgStatus;
    return null;
}

function apiSuccessY(response) {
    if (response == null) return true;
    if (typeof response === 'boolean') return response;
    if (typeof response === 'string') {
        var t = response.trim();
        if (!t) return true;
        if (/success/i.test(t)) return true;
        if (t.toUpperCase() === 'Y' || t.toUpperCase() === 'N') return t.toUpperCase() === 'Y';
        return true;
    }
    if (typeof response !== 'object') return true;

    var status = readApiStatus(response);
    if (status == null || String(status).trim() === '') {
        var failMsg = coalesceApiMessage(response, '');
        if (failMsg && /fail|error|invalid|required/i.test(failMsg)) return false;
        return true;
    }
    if (typeof status === 'boolean') return status;
    var s = String(status).trim().toUpperCase();
    if (s === 'Y' || s === 'SUCCESS' || s === 'OK' || s === 'TRUE' || s === '1') return true;
    if (s === 'N' || s === 'FAIL' || s === 'ERROR' || s === 'FALSE' || s === '0') return false;

    var message = coalesceApiMessage(response, '');
    if (message && /success/i.test(message)) return true;
    return false;
}

function coalesceApiMessage(response, fallback) {
    if (!response) return fallback;
    if (typeof response === 'string' && response.trim()) return response.trim();
    var msg = response.Msg != null ? response.Msg
        : (response.msg != null ? response.msg
            : (response.Message != null ? response.Message
                : (response.message != null ? response.message : '')));
    msg = (msg == null ? '' : msg).toString().trim();
    return msg || fallback;
}

function initSelect2($sel, placeholder, isMultiple) {
    destroySelect2IfAny($sel);
    $sel.select2({
        width: '100%',
        placeholder: placeholder || 'Search or select…',
        allowClear: true,
        multiple: !!isMultiple,
        closeOnSelect: !isMultiple,
        minimumResultsForSearch: 0,
        dropdownParent: $sel.closest('.dc-card').length ? $sel.closest('.dc-card') : $(document.body),
    });
}

function normalizeSelectedCodes(selectedCodes) {
    if (selectedCodes == null || selectedCodes === '') return [];
    if (Array.isArray(selectedCodes)) {
        return selectedCodes.map(function (c) { return c != null ? String(c) : ''; }).filter(function (c) {
            return c && c !== '0';
        });
    }
    var single = String(selectedCodes);
    return single && single !== '0' ? [single] : [];
}

function getSelectedDashboardCodes() {
    return $('.dc-dashboard-chk:checked').map(function () {
        return String($(this).val() || '');
    }).get().filter(function (c) {
        return c && c !== '0';
    });
}

function getDashboardLabel(masterCode) {
    var code = masterCode != null ? String(masterCode) : '';
    var $chk = $('.dc-dashboard-chk[value="' + code.replace(/"/g, '\\"') + '"]');
    if ($chk.length) {
        var label = ($chk.attr('data-label') || $chk.closest('label').text() || '').trim();
        if (label) return label;
    }
    return 'Dashboard ' + code;
}

function syncDashboardSelectAllState() {
    var $all = $('.dc-dashboard-chk');
    var total = $all.length;
    var checked = $all.filter(':checked').length;
    var $selectAll = $('#chkDashboardSelectAll');
    if (!$selectAll.length) return;
    $selectAll.prop('checked', total > 0 && checked === total);
}

function updateDashboardTriggerText() {
    var labels = $('.dc-dashboard-chk:checked').map(function () {
        return ($(this).attr('data-label') || '').toString().trim();
    }).get().filter(Boolean);

    var $text = $('#dcDashboardTriggerText');
    if (!$text.length) return;

    if (!labels.length) {
        $text.text('Search or select dashboard detail…').addClass('is-placeholder');
        return;
    }

    var shown = labels.slice(0, 2).join(', ');
    if (labels.length > 2) {
        shown += ' +' + (labels.length - 2) + ' more';
    }
    $text.text(shown).removeClass('is-placeholder');
}

function positionDashboardPanel() {
    var trigger = document.getElementById('btnDashboardTrigger');
    var panel = document.getElementById('dcDashboardPanel');
    if (!trigger || !panel) return;

    var rect = trigger.getBoundingClientRect();
    var top = rect.bottom + 4;
    var left = rect.left;
    var width = rect.width;
    var maxHeight = Math.max(160, Math.min(280, window.innerHeight - top - 16));

    // Fixed so parent overflow:hidden cannot clip the list
    panel.style.position = 'fixed';
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.width = width + 'px';
    panel.style.right = 'auto';
    panel.style.zIndex = '9999';

    var list = document.getElementById('dcDashboardCheckList');
    if (list) {
        list.style.maxHeight = Math.max(120, maxHeight - 90) + 'px';
    }
}

function setDashboardDropdownOpen(isOpen) {
    var $root = $('#dcDashboardMulti');
    if (!$root.length) return;
    $root.toggleClass('is-open', !!isOpen);
    $('#btnDashboardTrigger').attr('aria-expanded', isOpen ? 'true' : 'false');

    var panel = document.getElementById('dcDashboardPanel');
    if (isOpen) {
        positionDashboardPanel();
        setTimeout(function () {
            $('#txtDashboardSearch').trigger('focus');
        }, 0);
        $(window).off('scroll.dcDashPanel resize.dcDashPanel')
            .on('scroll.dcDashPanel resize.dcDashPanel', function () {
                if ($('#dcDashboardMulti').hasClass('is-open')) {
                    positionDashboardPanel();
                }
            });
    } else {
        $(window).off('scroll.dcDashPanel resize.dcDashPanel');
        if (panel) {
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.right = '';
            panel.style.zIndex = '';
        }
        $('#txtDashboardSearch').val('');
        applyDashboardSearch('');
    }
}

function applyDashboardSearch(term) {
    var q = (term || '').toString().trim().toLowerCase();
    $('.dc-multi-checkbox-item').each(function () {
        var $item = $(this);
        var text = ($item.text() || '').trim().toLowerCase();
        $item.toggleClass('is-hidden', !!(q && text.indexOf(q) === -1));
    });
}

function bindUserDropdown(rows, selectedCode) {
    var $sel = $('#ddlUser');
    if (!$sel.length) return;

    $sel.empty();
    $sel.append(new Option('-- Select User --', ''));

    $.each(rows || [], function (_, item) {
        var code = pickCode(item);
        if (!code || code === '0') return;
        var label = pickUserName(item) || ('User ' + code);
        $sel.append(new Option(label, code));
    });

    initSelect2($sel, 'Search or select user…', false);

    var v = selectedCode != null && selectedCode !== '' ? String(selectedCode) : '';
    $sel.val(v);
    if ($sel.data('select2')) {
        $sel.trigger('change.select2');
    }
}

function bindDashboardDetailDropdown(rows, selectedCodes) {
    var $list = $('#dcDashboardCheckList');
    if (!$list.length) {
        console.warn('dcDashboardCheckList not found in DOM');
        return;
    }

    $list.empty();
    $('#txtDashboardSearch').val('');

    var selectedSet = {};
    var values = normalizeSelectedCodes(selectedCodes);
    $.each(values, function (_, code) {
        selectedSet[String(code)] = true;
    });
    var hasPreselect = values.length > 0;
    var added = 0;

    $.each(rows || [], function (_, item) {
        var code = pickCode(item);
        if (!code || code === '0') return;
        var label = pickDesp(item) || ('Dashboard ' + code);
        var id = 'chkDashboard_' + code;
        var checked = hasPreselect ? !!selectedSet[code] : false;

        var $item = $('<div>', { class: 'dc-multi-checkbox-item' });
        var $label = $('<label>', { for: id });
        $label.append(
            $('<input>', {
                type: 'checkbox',
                id: id,
                class: 'dc-dashboard-chk',
                value: code,
                'data-label': label,
                checked: checked,
            })
        );
        $label.append($('<span>').text(label));
        $item.append($label);
        $list.append($item);
        added += 1;
    });

    if (!added) {
        $list.append(
            $('<div>', { class: 'dc-multi-empty' }).text('No dashboard details found.')
        );
    }

    syncDashboardSelectAllState();
    updateDashboardTriggerText();
    setDashboardDropdownOpen(false);
}

function clearTiles() {
    $('#dcTilesList').empty();
    $('#dcJumpChips').empty();
    $('#txtTileSearch').val('');
    $('#dcTilesSection').removeClass('is-visible');
    $('#dcTilesEmpty').removeClass('is-visible');
    updateSelectedCount();
}

function setTilesLoading(isLoading) {
    var $section = $('#dcTilesSection');
    var $loading = $('#dcTilesLoading');
    if (isLoading) {
        $section.addClass('is-visible');
        $loading.addClass('is-visible');
    } else {
        $loading.removeClass('is-visible');
    }
}

function updateSectionCounts() {
    $('.dc-section').each(function () {
        var $section = $(this);
        var total = $section.find('.dc-tile-checkbox').length;
        var selected = $section.find('.dc-tile-checkbox:checked').length;
        var $badge = $section.find('.dc-section-count');
        if (!$badge.length) return;
        if (!total) {
            $badge.text('0 tiles');
        } else {
            $badge.text(selected + ' / ' + total + ' selected');
        }
    });
}

function updateSelectedCount() {
    var total = $('.dc-tile-checkbox').length;
    var selected = $('.dc-tile-checkbox:checked').length;
    var $badge = $('#dcSelectedCount');
    if ($badge.length) {
        $badge.text(selected + ' / ' + total + ' selected');
        $badge.toggleClass('has-selection', selected > 0);
    }
    updateSectionCounts();
}

function syncTileItemState($checkbox) {
    var $item = $checkbox.closest('.dc-tile-item');
    $item.toggleClass('is-checked', $checkbox.is(':checked'));
}

function setSectionTilesChecked($section, checked) {
    $section.find('.dc-tile-checkbox').each(function () {
        var $chk = $(this);
        // only affect visible (search-filtered) tiles when filtering
        var $item = $chk.closest('.dc-tile-item');
        if ($item.hasClass('is-hidden')) return;
        $chk.prop('checked', !!checked);
        syncTileItemState($chk);
    });
    updateSelectedCount();
}

function applyTileSearch(query) {
    var q = (query || '').toString().trim().toLowerCase();

    $('.dc-section').each(function () {
        var $section = $(this);
        var visibleInSection = 0;

        $section.find('.dc-tile-item').each(function () {
            var $item = $(this);
            var label = ($item.find('.dc-tile-label').text() || '').toLowerCase();
            var match = !q || label.indexOf(q) !== -1;
            $item.toggleClass('is-hidden', !match);
            if (match) visibleInSection += 1;
        });

        var $noMatch = $section.find('.dc-no-match');
        if ($section.hasClass('is-empty')) {
            $noMatch.removeClass('is-visible');
            return;
        }
        $noMatch.toggleClass('is-visible', !!q && visibleInSection === 0);
    });
}

function scrollToSection(masterCode) {
    var code = masterCode != null ? String(masterCode) : '';
    var el = document.getElementById('dcSection_' + code);
    if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function applyAssignedTileChecks(assignedCodes) {
    var codeSet = {};
    $.each(assignedCodes || [], function (_, code) {
        var c = code != null ? String(code) : '';
        if (c && c !== '0') codeSet[c] = true;
    });

    $('.dc-tile-checkbox').each(function () {
        var $chk = $(this);
        var code = String($chk.val() || '');
        var shouldCheck = !!codeSet[code];
        $chk.prop('checked', shouldCheck);
        syncTileItemState($chk);
    });

    updateSelectedCount();
}

function extractAssignedCodesFromConfig(rows) {
    var codes = [];
    $.each(rows || [], function (_, item) {
        var code = pickTileCode(item);
        if (code && code !== '0') codes.push(code);
    });
    return codes;
}

function extractUserDashboardMasterCodes(rows) {
    var codes = [];
    var seen = {};
    $.each(rows || [], function (_, item) {
        var code = pickMasterCode(item);
        if (!code || code === '0' || seen[code]) return;
        seen[code] = true;
        codes.push(code);
    });
    return codes;
}

/** Check Dashboard Detail boxes for given master codes */
function setSelectedDashboardCodes(selectedCodes) {
    var selectedSet = {};
    $.each(normalizeSelectedCodes(selectedCodes), function (_, code) {
        selectedSet[String(code)] = true;
    });

    $('.dc-dashboard-chk').each(function () {
        var $chk = $(this);
        var code = String($chk.val() || '');
        $chk.prop('checked', !!selectedSet[code]);
    });

    syncDashboardSelectAllState();
    updateDashboardTriggerText();
}

/** User change → load UserWebApiDashboardDetails → auto-select dashboards → load tiles */
function onUserSelected() {
    var userCode = parseInt($('#ddlUser').val(), 10) || 0;

    if (!userCode) {
        setSelectedDashboardCodes([]);
        clearTiles();
        return Promise.resolve();
    }

    return DashboardConfigurationService.GetUserDashboardDetails(userCode)
        .then(function (res) {
            var masterCodes = extractUserDashboardMasterCodes(firstArray(res));
            setSelectedDashboardCodes(masterCodes);
            return refreshTilesForSelection();
        })
        .catch(function (err) {
            console.warn('GetUserDashboardDetails failed; clearing dashboard selection.', err);
            setSelectedDashboardCodes([]);
            clearTiles();
            if (typeof toastr !== 'undefined') {
                toastr.warning('Failed to load dashboards for selected user.');
            }
        });
}

function extractAssignedCodesFromTiles(rows) {
    var codes = [];
    $.each(rows || [], function (_, item) {
        if (!isAssignedFlag(item)) return;
        var code = pickCode(item);
        if (code && code !== '0') codes.push(code);
    });
    return codes;
}

function ensureForceLayoutCss() {
    if (document.getElementById('dcForceLayoutStyle')) return;
    var css = ''
        + '#DashboardConfigurationPage .dc-tiles-panel{max-height:min(62vh,560px)!important;overflow-y:auto!important;overflow-x:hidden!important;}'
        + '#DashboardConfigurationPage .dc-tiles-list{display:block!important;width:100%!important;grid-template-columns:none!important;}'
        + '#DashboardConfigurationPage .dc-section{display:block!important;width:100%!important;float:none!important;clear:both!important;margin:0 0 12px!important;}'
        + '#DashboardConfigurationPage .dc-section-body{max-height:none!important;overflow:visible!important;}'
        + '#DashboardConfigurationPage .dc-tile-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))!important;gap:10px!important;width:100%!important;}'
        + '#DashboardConfigurationPage .dc-tile-item.is-checked .dc-tile-label{color:#fff!important;}'
        + '#DashboardConfigurationPage .dc-no-match{display:none!important;}'
        + '#DashboardConfigurationPage .dc-no-match.is-visible{display:block!important;padding:12px 8px;text-align:center;color:#94a3b8;font-size:12.5px;font-weight:650;}';
    var style = document.createElement('style');
    style.id = 'dcForceLayoutStyle';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

function appendTileItem($grid, item, masterCode, checked) {
    var code = pickCode(item);
    if (!code || code === '0') return false;

    var label = pickDesp(item) || ('Tile ' + code);
    var id = 'chkTile_' + masterCode + '_' + code;
    // Default checked; Not Applicable (previously unchecked+saved) stay visible as unchecked
    var isChecked = checked !== false;

    var $item = $('<label>', {
        class: 'dc-tile-item' + (isChecked ? ' is-checked' : ''),
        for: id,
    });
    $item.append(
        $('<input>', {
            type: 'checkbox',
            id: id,
            class: 'dc-tile-checkbox',
            value: code,
            'data-tile-code': code,
            'data-tile-desp': label,
            'data-master-code': masterCode,
            checked: isChecked,
        })
    );
    $item.append(
        $('<span>', { class: 'dc-tile-check', 'aria-hidden': 'true' })
            .append($('<i class="fas fa-check"></i>'))
    );
    $item.append($('<span class="dc-tile-label">').text(label));
    $grid.append($item);
    return true;
}

function bindTilesGrouped(groups) {
    ensureForceLayoutCss();

    var $list = $('#dcTilesList');
    var $chips = $('#dcJumpChips');
    var $sectionWrap = $('#dcTilesSection');
    var $empty = $('#dcTilesEmpty');

    $list.empty();
    $chips.empty();
    $('#txtTileSearch').val('');
    $sectionWrap.addClass('is-visible');

    // Force stacked layout even if old compiled CSS used a grid/columns
    $list.css({
        display: 'block',
        width: '100%',
        gridTemplateColumns: 'none',
        flexDirection: 'column',
    });

    var groupList = groups || [];
    var totalTiles = 0;
    var accentIndex = 0;
    var hasAnyGroup = false;
    var colors = ['#6366f1', '#0284c7', '#059669', '#d97706', '#db2777', '#7c3aed'];

    $.each(groupList, function (_, group) {
        var masterCode = group && group.masterCode != null ? String(group.masterCode) : '';
        if (!masterCode || masterCode === '0') return;

        hasAnyGroup = true;
        var masterLabel = group.masterLabel || getDashboardLabel(masterCode);
        var items = group.tiles || [];

        // Not Applicable = previously unchecked+saved — still show here as unchecked
        var notApplicableSet = {};
        $.each(group.notApplicableCodes || group.assignedCodes || [], function (_, code) {
            var c = code != null ? String(code) : '';
            if (c && c !== '0') notApplicableSet[c] = true;
        });

        var validItems = [];
        $.each(items, function (_, item) {
            var code = pickCode(item);
            if (!code || code === '0') return;
            validItems.push(item);
        });

        var accentNum = accentIndex % 6;
        var accent = String(accentNum);
        accentIndex += 1;

        var $chip = $('<button>', {
            type: 'button',
            class: 'dc-jump-chip',
            'data-master-code': masterCode,
        });
        $chip.css('--dc-g', colors[accentNum]);
        $chip.append($('<span class="dot" aria-hidden="true"></span>'));
        $chip.append($('<span>').text(masterLabel));
        $chips.append($chip);

        var $section = $('<section>', {
            class: 'dc-section' + (!validItems.length ? ' is-empty' : ''),
            id: 'dcSection_' + masterCode,
            'data-master-code': masterCode,
            'data-accent': accent,
        });
        $section.css({
            display: 'block',
            width: '100%',
            float: 'none',
            clear: 'both',
            marginBottom: '12px',
        });

        var $head = $('<div>', { class: 'dc-section-head' });
        $head.append(
            $('<h3>', { class: 'dc-section-title' })
                .append($('<span class="ico"><i class="fas fa-layer-group"></i></span>'))
                .append($('<span>').text(masterLabel))
        );

        var $meta = $('<div>', { class: 'dc-section-meta' });
        $meta.append($('<span>', { class: 'dc-section-count' }));
        $head.append($meta);

        var $body = $('<div>', { class: 'dc-section-body' });
        if (!validItems.length) {
            $body.append(
                $('<div>', { class: 'dc-section-empty' })
                    .append($('<i class="fas fa-inbox"></i>'))
                    .append($('<span>').text('No tiles available for this dashboard'))
            );
        } else {
            var $grid = $('<div>', { class: 'dc-tile-grid' });
            $grid.css({
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
                width: '100%',
            });
            var count = 0;
            $.each(validItems, function (_, item) {
                var code = pickCode(item);
                var isChecked = !notApplicableSet[code];
                if (appendTileItem($grid, item, masterCode, isChecked)) {
                    count += 1;
                }
            });
            $body.append($grid);
            $body.append(
                $('<div>', { class: 'dc-no-match' })
                    .css({ display: 'none' })
                    .text('No tiles match your search in this dashboard.')
            );
            totalTiles += count;
        }

        $section.append($head).append($body);
        $list.append($section);
    });

    $empty.toggleClass('is-visible', !hasAnyGroup);
    updateSelectedCount();
}

/** Legacy flat binder — wraps rows into a single unnamed group. */
function bindTiles(rows, assignedCodes) {
    bindTilesGrouped([{
        masterCode: getSelectedDashboardCodes()[0] || '0',
        masterLabel: getDashboardLabel(getSelectedDashboardCodes()[0] || ''),
        tiles: rows || [],
        assignedCodes: assignedCodes || [],
    }]);
}

function loadUserDropdown(selectedCode) {
    return DashboardConfigurationService.GetUserDetails()
        .then(function (res) {
            bindUserDropdown(firstArray(res), selectedCode);
        })
        .catch(function (err) {
            console.error('GetUserDetails failed', err);
            bindUserDropdown([], selectedCode);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load users.');
            }
        });
}

function loadDashboardDetailDropdown(selectedCodes) {
    return DashboardConfigurationService.GetDashboardDetails()
        .then(function (res) {
            bindDashboardDetailDropdown(firstArray(res), selectedCodes);
        })
        .catch(function (err) {
            console.error('GetDashboardDetails failed', err);
            bindDashboardDetailDropdown([], selectedCodes);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load dashboard details.');
            }
        });
}

function loadAssignedTileCodes(userCode, masterCode) {
    if (!userCode || !masterCode) {
        return Promise.resolve([]);
    }

    return DashboardConfigurationService.GetUserDashboardConfig(userCode, masterCode)
        .then(function (res) {
            return extractAssignedCodesFromConfig(firstArray(res));
        })
        .catch(function (err) {
            console.warn('GetUserDashboardConfig failed; using tile IsAssigned flags if present.', err);
            return [];
        });
}

function loadGroupForDashboard(masterCode, userCode) {
    var code = masterCode != null ? String(masterCode) : '';
    var label = getDashboardLabel(code);

    // Always load FULL tile list (UserMaster_Code=0). Config page must show
    // unchecked/NotApplicable tiles too — mark them unchecked via GET_USER_CONFIG.
    return Promise.all([
        DashboardConfigurationService.GetDashboardTileDetail(code, 0),
        userCode ? loadAssignedTileCodes(userCode, code) : Promise.resolve([]),
    ]).then(function (results) {
        return {
            masterCode: code,
            masterLabel: label,
            tiles: firstArray(results[0]),
            notApplicableCodes: results[1] || [],
            assignedCodes: results[1] || [],
        };
    });
}

function refreshTilesForSelection() {
    var userCode = parseInt($('#ddlUser').val(), 10) || 0;
    var masterCodes = getSelectedDashboardCodes();

    if (!masterCodes.length) {
        clearTiles();
        return Promise.resolve();
    }

    setTilesLoading(true);

    return Promise.all(masterCodes.map(function (code) {
        return loadGroupForDashboard(code, userCode);
    }))
        .then(function (groups) {
            bindTilesGrouped(groups);
        })
        .catch(function (err) {
            console.error('refreshTilesForSelection failed', err);
            bindTilesGrouped([]);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load dashboard tiles.');
            }
        })
        .finally(function () {
            setTilesLoading(false);
        });
}

function loadTilesForDashboard(masterCode) {
    if (!masterCode) {
        clearTiles();
        return Promise.resolve();
    }
    return refreshTilesForSelection();
}

function getSelectedTileCodes() {
    return $('.dc-tile-checkbox:checked').map(function () {
        return $(this).val();
    }).get();
}

function getUncheckedTileCodes() {
    return $('.dc-tile-checkbox:not(:checked)').map(function () {
        return $(this).val();
    }).get();
}

/** Save: unchecked tiles → NotApplicable; always include selected dashboards for UserWebApiDashboardDetails */
function buildSavePayload() {
    var userCode = parseInt($('#ddlUser').val(), 10) || 0;
    var details = [];
    var mastersWithUnchecked = {};

    $('.dc-tile-checkbox:not(:checked)').each(function () {
        var $chk = $(this);
        var tile = parseInt($chk.val(), 10) || 0;
        var masterCode = parseInt($chk.attr('data-master-code'), 10) || 0;
        if (!tile || !masterCode) return;

        mastersWithUnchecked[masterCode] = true;
        details.push({
            Code: 0,
            WebApiDashboardMaster_Code: masterCode,
            WebApiDashboardTileDetail_Code: tile,
            UserMaster_Code: userCode,
        });
    });

    // All tiles checked: still send one row per selected dashboard (Tile=0)
    // so API/SP can insert UserWebApiDashboardDetails
    $.each(getSelectedDashboardCodes(), function (_, masterCode) {
        var mc = parseInt(masterCode, 10) || 0;
        if (!mc || mastersWithUnchecked[mc]) return;
        details.push({
            Code: 0,
            WebApiDashboardMaster_Code: mc,
            WebApiDashboardTileDetail_Code: 0,
            UserMaster_Code: userCode,
        });
    });

    return {
        DashboardTileDetail: details,
    };
}

function setAllTilesChecked(checked) {
    $('.dc-tile-checkbox').each(function () {
        var $chk = $(this);
        $chk.prop('checked', !!checked);
        syncTileItemState($chk);
    });
    updateSelectedCount();
}

function SaveDashboardTileDetail() {
    var userCode = parseInt($('#ddlUser').val(), 10) || 0;
    var masterCodes = getSelectedDashboardCodes();

    if (!userCode) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select User.');
        $('#ddlUser').focus();
        return;
    }
    if (!masterCodes.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select at least one Dashboard Detail.');
        setDashboardDropdownOpen(true);
        return;
    }

    var payload = buildSavePayload();
    var $btn = $('#btnSaveDashboardConfig');
    var $btnText = $('#btnSaveDashboardConfigText');
    var origText = $btnText.text();

    $btn.prop('disabled', true);
    $btnText.text('Saving…');

    DashboardConfigurationService.SaveDashboardTileDetail(payload)
        .then(function (res) {
            if (!apiSuccessY(res)) {
                if (typeof toastr !== 'undefined') {
                    toastr.error(coalesceApiMessage(res, 'Failed to save dashboard configuration.'));
                }
                return;
            }

            if (typeof toastr !== 'undefined') {
                toastr.success(coalesceApiMessage(res, 'Dashboard configuration saved.'));
            }

            refreshTilesForSelection();
        })
        .catch(function (err) {
            console.error('SaveDashboardTileDetail failed', err);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to save dashboard configuration.');
            }
        })
        .finally(function () {
            $btn.prop('disabled', false);
            $btnText.text(origText);
        });
}

$(function () {
    loadUserDropdown();
    loadDashboardDetailDropdown();

    $('#ddlUser').on('change', function () {
        onUserSelected();
    });

    $('#btnDashboardTrigger').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = !$('#dcDashboardMulti').hasClass('is-open');
        setDashboardDropdownOpen(open);
    });

    $(document).on('change', '.dc-dashboard-chk', function () {
        syncDashboardSelectAllState();
        updateDashboardTriggerText();
        refreshTilesForSelection();
    });

    $('#chkDashboardSelectAll').on('change', function () {
        var checked = $(this).is(':checked');
        $('.dc-dashboard-chk').prop('checked', checked);
        syncDashboardSelectAllState();
        updateDashboardTriggerText();
        refreshTilesForSelection();
    });

    $('#txtDashboardSearch').on('input', function () {
        applyDashboardSearch($(this).val());
    });

    // Keep panel open while interacting inside; close on outside click
    $('#dcDashboardPanel').on('click', function (e) {
        e.stopPropagation();
    });

    $(document).on('click.dcDashboardMulti', function (e) {
        if (!$(e.target).closest('#dcDashboardMulti').length) {
            setDashboardDropdownOpen(false);
        }
    });

    $(document).on('keydown.dcDashboardMulti', function (e) {
        if (e.key === 'Escape') setDashboardDropdownOpen(false);
    });

    $(document).on('change', '.dc-tile-checkbox', function () {
        syncTileItemState($(this));
        updateSelectedCount();
    });

    $(document).on('click', '.dc-jump-chip', function () {
        scrollToSection($(this).attr('data-master-code'));
    });

    $('#txtTileSearch').on('input', function () {
        applyTileSearch($(this).val());
        // keep no-match visibility in sync with forced CSS
        $('.dc-no-match').each(function () {
            var $el = $(this);
            $el.css('display', $el.hasClass('is-visible') ? 'block' : 'none');
        });
    });

    $('#btnSelectAllTiles').on('click', function () {
        setAllTilesChecked(true);
    });

    $('#btnClearAllTiles').on('click', function () {
        setAllTilesChecked(false);
    });

    $('#btnSaveDashboardConfig').on('click', function () {
        SaveDashboardTileDetail();
    });
});

export {
    loadUserDropdown,
    loadDashboardDetailDropdown,
    loadTilesForDashboard,
    refreshTilesForSelection,
    onUserSelected,
    setSelectedDashboardCodes,
    bindUserDropdown,
    bindDashboardDetailDropdown,
    bindTiles,
    bindTilesGrouped,
    getSelectedTileCodes,
    getUncheckedTileCodes,
    getSelectedDashboardCodes,
    buildSavePayload,
    SaveDashboardTileDetail,
};
