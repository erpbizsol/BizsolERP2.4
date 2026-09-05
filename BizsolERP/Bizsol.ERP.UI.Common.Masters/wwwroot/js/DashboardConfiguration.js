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

function pickByNames(item, names) {
    if (!item || typeof item !== 'object' || !names || !names.length) return '';
    var i;
    for (i = 0; i < names.length; i++) {
        var val = item[names[i]];
        if (val != null && String(val).trim() !== '') return String(val).trim();
    }
    var keys = Object.keys(item);
    var lowerToKey = {};
    for (i = 0; i < keys.length; i++) {
        lowerToKey[String(keys[i]).toLowerCase()] = keys[i];
    }
    for (i = 0; i < names.length; i++) {
        var actual = lowerToKey[String(names[i]).toLowerCase()];
        if (!actual) continue;
        var v = item[actual];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function pickUserName(item) {
    if (!item) return '';
    var text = pickByNames(item, ['UserName', 'userName', 'Username', 'username']) || pickDesp(item);
    return (text || '').toString().trim();
}

/** Assignment rows only — never fall back to Code (that column is the dashboard). */
function pickUserMasterCode(item) {
    var code = pickByNames(item, [
        'UserMaster_Code', 'userMaster_Code', 'UserMasterCode', 'UserCode', 'userCode',
    ]);
    return code && code !== '0' ? code : '';
}

/** User dropdown rows from GetUserDetails (Code is the user id). */
function pickUserListCode(item) {
    var code = pickByNames(item, [
        'Code', 'code', 'UserMaster_Code', 'userMaster_Code', 'UserMasterCode',
    ]);
    return code && code !== '0' ? code : '';
}

function userRowCodes(item) {
    var out = [];
    var seen = {};
    function add(c) {
        c = c != null ? String(c).trim() : '';
        if (!c || c === '0' || seen[c]) return;
        seen[c] = true;
        out.push(c);
    }
    add(pickCode(item));
    add(pickUserMasterCode(item));
    add(pickUserListCode(item));
    return out;
}

function userRowInSet(item, codeSet) {
    if (!item || !codeSet) return false;
    var codes = userRowCodes(item);
    for (var i = 0; i < codes.length; i++) {
        if (codeSet[codes[i]]) return true;
    }
    return false;
}

function expandUserCodes(codes) {
    var set = {};
    $.each(normalizeSelectedCodes(codes), function (_, c) {
        set[String(c)] = true;
    });
    $.each(G_userRows || [], function (_, item) {
        if (!userRowInSet(item, set)) return;
        $.each(userRowCodes(item), function (__, c) {
            set[c] = true;
        });
    });
    return Object.keys(set);
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
    var code = pickByNames(item, [
        'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code',
        'DashboardMaster_Code', 'dashboardMaster_Code', 'DashboardMasterCode',
    ]);
    if (!code) code = pickCode(item);
    return code && code !== '0' ? code : '';
}

function pickIsDefault(item) {
    if (!item) return false;
    var flag = item.IsDefault != null ? item.IsDefault
        : (item.isDefault != null ? item.isDefault
            : (item.Default != null ? item.Default
                : (item.isPrimary != null ? item.isPrimary
                    : (item.IsPrimary != null ? item.IsPrimary : null))));
    if (flag == null) return false;
    if (typeof flag === 'boolean') return flag;
    var s = String(flag).trim().toUpperCase();
    return s === 'Y' || s === 'TRUE' || s === '1' || s === 'YES';
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
    if (G_defaultDashboardCode && labels.length) {
        shown += ' · Default: ' + getDashboardLabel(G_defaultDashboardCode);
    }
    $text.text(shown).removeClass('is-placeholder');
}

function positionMultiPanel(triggerId, panelId, listId) {
    var trigger = document.getElementById(triggerId);
    var panel = document.getElementById(panelId);
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

    var list = document.getElementById(listId);
    if (list) {
        list.style.maxHeight = Math.max(120, maxHeight - 90) + 'px';
    }
}

function positionDashboardPanel() {
    positionMultiPanel('btnDashboardTrigger', 'dcDashboardPanel', 'dcDashboardCheckList');
}

function positionUserPanel() {
    positionMultiPanel('btnUserTrigger', 'dcUserPanel', 'dcUserCheckList');
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
        setUserDropdownOpen(false);
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
    $('#dcDashboardCheckList .dc-multi-checkbox-item').each(function () {
        var $item = $(this);
        var text = ($item.text() || '').trim().toLowerCase();
        $item.toggleClass('is-hidden', !!(q && text.indexOf(q) === -1));
    });
}

function applyUserSearch(term) {
    var q = (term || '').toString().trim().toLowerCase();
    $('#dcUserCheckList .dc-multi-checkbox-item').each(function () {
        var $item = $(this);
        var text = ($item.text() || '').trim().toLowerCase();
        $item.toggleClass('is-hidden', !!(q && text.indexOf(q) === -1));
    });

    var $currentGroup = null;
    var visibleInGroup = 0;
    function flushGroup() {
        if ($currentGroup) $currentGroup.toggleClass('is-hidden', visibleInGroup === 0);
    }
    $('#dcUserCheckList').children().each(function () {
        var $n = $(this);
        if ($n.hasClass('dc-multi-group')) {
            flushGroup();
            $currentGroup = $n;
            visibleInGroup = 0;
            return;
        }
        if ($n.hasClass('dc-multi-checkbox-item') && !$n.hasClass('is-hidden')) {
            visibleInGroup += 1;
        }
    });
    flushGroup();
}

function getSelectedUserCodes() {
    return $('.dc-user-chk:checked').map(function () {
        var n = parseInt($(this).val(), 10);
        return isNaN(n) ? 0 : n;
    }).get().filter(function (c) {
        return c > 0;
    });
}

/** Always the checked users. ALL / Select All expands to every user in the list. */
function getSaveTargetUserCodes() {
    return getSelectedUserCodes();
}

/** Single selected user, else null (none or multiple). */
function getSelectedUserCode() {
    var codes = getSelectedUserCodes();
    return codes.length === 1 ? codes[0] : null;
}

function isAllUsersSelected() {
    var $all = $('.dc-user-chk');
    return $all.length > 0 && $all.filter(':checked').length === $all.length;
}

function syncUserSelectAllState() {
    var $all = $('.dc-user-chk');
    var total = $all.length;
    var checked = $all.filter(':checked').length;
    var $selectAll = $('#chkUserSelectAll');
    if (!$selectAll.length) return;
    $selectAll.prop('checked', total > 0 && checked === total);
}

function updateUserTriggerText() {
    var $all = $('.dc-user-chk');
    var $checked = $all.filter(':checked');
    var $text = $('#dcUserTriggerText');
    if (!$text.length) return;

    if (!$checked.length) {
        $text.text('Search or select user…').addClass('is-placeholder');
        return;
    }

    if ($all.length && $checked.length === $all.length) {
        $text.text('ALL users').removeClass('is-placeholder');
        return;
    }

    var labels = $checked.map(function () {
        return ($(this).attr('data-label') || '').toString().trim();
    }).get().filter(Boolean);

    var shown = labels.slice(0, 2).join(', ');
    if (labels.length > 2) {
        shown += ' +' + (labels.length - 2) + ' more';
    }
    $text.text(shown).removeClass('is-placeholder');
}

function setUserDropdownOpen(isOpen) {
    var $root = $('#dcUserMulti');
    if (!$root.length) return;
    $root.toggleClass('is-open', !!isOpen);
    $('#btnUserTrigger').attr('aria-expanded', isOpen ? 'true' : 'false');

    var panel = document.getElementById('dcUserPanel');
    if (isOpen) {
        setDashboardDropdownOpen(false);
        positionUserPanel();
        setTimeout(function () {
            $('#txtUserSearch').trigger('focus');
        }, 0);
        $(window).off('scroll.dcUserPanel resize.dcUserPanel')
            .on('scroll.dcUserPanel resize.dcUserPanel', function () {
                if ($('#dcUserMulti').hasClass('is-open')) {
                    positionUserPanel();
                }
            });
    } else {
        $(window).off('scroll.dcUserPanel resize.dcUserPanel');
        if (panel) {
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.right = '';
            panel.style.zIndex = '';
        }
        $('#txtUserSearch').val('');
        applyUserSearch('');
    }
}

function bindUserDropdown(rows, selectedCodes, assignedCodes) {
    var $list = $('#dcUserCheckList');
    if (!$list.length) {
        console.warn('dcUserCheckList not found in DOM');
        return;
    }

    $list.empty();
    $('#txtUserSearch').val('');

    var selectedSet = {};
    var values = expandUserCodes(selectedCodes);
    $.each(values, function (_, code) {
        selectedSet[String(code)] = true;
    });
    var hasPreselect = values.length > 0;

    var assignedSet = {};
    var assignedValues = expandUserCodes(assignedCodes);
    $.each(assignedValues, function (_, code) {
        assignedSet[String(code)] = true;
    });
    var showGroups = assignedValues.length > 0;

    var list = (rows || []).slice().filter(function (item) {
        var code = pickUserListCode(item);
        return !!(code && code !== '0');
    });
    list.sort(function (a, b) {
        var aAssigned = userRowInSet(a, assignedSet);
        var bAssigned = userRowInSet(b, assignedSet);
        if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
        return pickUserName(a).localeCompare(pickUserName(b), undefined, { sensitivity: 'base' });
    });

    var added = 0;
    var lastWasAssigned = null;

    $.each(list, function (_, item) {
        var code = pickUserListCode(item);
        var label = pickUserName(item) || ('User ' + code);
        var id = 'chkUser_' + code;
        var isAssigned = userRowInSet(item, assignedSet);
        var checked = hasPreselect ? userRowInSet(item, selectedSet) : false;

        if (showGroups && lastWasAssigned !== isAssigned) {
            $list.append(
                $('<div>', {
                    class: 'dc-multi-group' + (isAssigned ? ' is-assigned' : ''),
                }).text(isAssigned ? 'Assigned to dashboard' : 'Not assigned')
            );
            lastWasAssigned = isAssigned;
        }

        var $item = $('<div>', { class: 'dc-multi-checkbox-item' + (isAssigned ? ' is-assigned' : '') });
        var $label = $('<label>', { for: id });
        $label.append(
            $('<input>', {
                type: 'checkbox',
                id: id,
                class: 'dc-user-chk',
                value: code,
                'data-label': label,
                checked: checked,
            })
        );
        $label.append($('<span>').text(label));
        if (isAssigned) {
            $label.append($('<em>', { class: 'dc-user-assigned-badge' }).text('Assigned'));
        }
        $item.append($label);
        $list.append($item);
        added += 1;
    });

    if (!added) {
        $list.append(
            $('<div>', { class: 'dc-multi-empty' }).text('No users found.')
        );
    }

    syncUserSelectAllState();
    updateUserTriggerText();
    setUserDropdownOpen(false);
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
        $item.append(
            $('<label>', { class: 'dc-default-pick', title: 'Open this dashboard first' })
                .append($('<input>', {
                    type: 'radio',
                    name: 'dcDefaultDashboardList',
                    class: 'dc-default-dash',
                    value: code,
                }))
                .append($('<span>').text('Default'))
        );
        $list.append($item);
        added += 1;
    });

    if (!added) {
        $list.append(
            $('<div>', { class: 'dc-multi-empty' }).text('No dashboard details found.')
        );
    }

    syncDashboardSelectAllState();
    syncDefaultDashboardUi();
    setDashboardDropdownOpen(false);
}

function getTileIcon(label) {
    var t = (label || '').toString().trim().toLowerCase();
    if (t.indexOf('payment') !== -1 && t.indexOf('approval') !== -1) return 'fa-money-check-dollar';
    if (t.indexOf('payment') !== -1 && t.indexOf('trend') !== -1) return 'fa-chart-line';
    if (t.indexOf('payment') !== -1) return 'fa-indian-rupee-sign';
    if (t.indexOf('expense') !== -1 && t.indexOf('approval') !== -1) return 'fa-file-invoice-dollar';
    if (t.indexOf('expense') !== -1) return 'fa-wallet';
    if (t.indexOf('grn') !== -1) return 'fa-truck-ramp-box';
    if (t.indexOf('po') !== -1 && t.indexOf('approval') !== -1) return 'fa-cart-shopping';
    if (t.indexOf('po') !== -1) return 'fa-clipboard-list';
    if (t.indexOf('project') !== -1 && t.indexOf('total') !== -1) return 'fa-diagram-project';
    if (t.indexOf('project') !== -1) return 'fa-folder-open';
    if (t.indexOf('reconcil') !== -1) return 'fa-scale-balanced';
    if (t.indexOf('status') !== -1) return 'fa-signal';
    if (t.indexOf('trend') !== -1) return 'fa-chart-area';
    if (t.indexOf('budget') !== -1) return 'fa-coins';
    if (t.indexOf('summary') !== -1) return 'fa-table-list';
    if (t.indexOf('approval') !== -1) return 'fa-circle-check';
    return 'fa-grip';
}

function syncPlaceholderVisibility() {
    var showTiles = $('#dcTilesSection').hasClass('is-visible');
    $('#dcStartPlaceholder').toggle(!showTiles);
}

function updateSelectionStats(selected, total) {
    var pct = total > 0 ? Math.round((selected / total) * 100) : 0;
    $('#dcStatSelected').text(selected);
    $('#dcStatTotal').text(total);
    $('#dcProgressPct').text(pct + '%');
    $('#dcProgressFill').css('width', pct + '%');
}

function clearTiles() {
    $('#dcTilesList').empty();
    $('#dcJumpChips').empty();
    $('#txtTileSearch').val('');
    $('#dcTilesSection').removeClass('is-visible');
    $('#dcTilesEmpty').removeClass('is-visible');
    updateSelectedCount();
    syncPlaceholderVisibility();
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
    updateSelectionStats(selected, total);
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

var G_assignedDashboardCodes = [];
var G_assignedUserCodes = [];
var G_sessionCheckedDashboards = {};
var G_userRows = [];
var G_userToDashboards = {};
var G_assignmentPairs = [];
var G_userToDefaultDashboard = {};
var G_defaultDashboardCode = '';
var G_assignmentCachePromise = null;
var G_userLoadPromise = null;
var G_applyingDashboardUsers = false;
var DEFAULT_STORE_KEY = 'dcUserDefaultDashboards';

function readDefaultStore() {
    try {
        var raw = sessionStorage.getItem(DEFAULT_STORE_KEY);
        var map = raw ? JSON.parse(raw) : {};
        return map && typeof map === 'object' ? map : {};
    } catch (e) {
        return {};
    }
}

function writeDefaultForUsers(userCodes, dashCode) {
    var map = readDefaultStore();
    var code = dashCode != null ? String(dashCode) : '';
    $.each(userCodes || [], function (_, uc) {
        var key = String(uc);
        if (!key || key === '0') return;
        if (code && code !== '0') map[key] = code;
        else delete map[key];
        G_userToDefaultDashboard[key] = code && code !== '0' ? code : '';
    });
    try {
        sessionStorage.setItem(DEFAULT_STORE_KEY, JSON.stringify(map));
    } catch (e) { /* ignore quota */ }
}

function inferDefaultFromUsers(userCodes, dashCodes) {
    var codes = normalizeSelectedCodes(dashCodes);
    if (!codes.length) return '';
    if (codes.length === 1) return codes[0];

    var store = readDefaultStore();
    var candidates = [];
    $.each(userCodes || [], function (_, uc) {
        var key = String(uc);
        var saved = G_userToDefaultDashboard[key] || store[key] || '';
        if (saved && codes.indexOf(String(saved)) !== -1) candidates.push(String(saved));
    });
    if (candidates.length && candidates.every(function (c) { return c === candidates[0]; })) {
        return candidates[0];
    }
    if (G_defaultDashboardCode && codes.indexOf(String(G_defaultDashboardCode)) !== -1) {
        return String(G_defaultDashboardCode);
    }
    return codes[0];
}

function setDefaultDashboardCode(code) {
    var selected = getSelectedDashboardCodes();
    var next = code != null ? String(code) : '';
    if (next && selected.indexOf(next) === -1) next = '';
    if (!next && selected.length) next = selected[0];
    G_defaultDashboardCode = next;
    syncDefaultDashboardUi();
}

function getCheckedDefaultDashboardCode() {
    var selected = getSelectedDashboardCodes();
    if (!selected.length) return '';

    var fromRadio = ($('.dc-default-dash:checked').first().val() || '').toString();
    if (fromRadio && selected.indexOf(fromRadio) !== -1) return fromRadio;

    if (G_defaultDashboardCode && selected.indexOf(String(G_defaultDashboardCode)) !== -1) {
        return String(G_defaultDashboardCode);
    }

    return selected[0];
}

function isDefaultDashboard(masterCode, defaultCode) {
    var mc = masterCode != null ? String(masterCode) : '';
    var dc = defaultCode != null ? String(defaultCode) : '';
    return !!(mc && dc && mc === dc);
}

function ensureDefaultDashboard() {
    var selected = getSelectedDashboardCodes();
    if (!selected.length) {
        G_defaultDashboardCode = '';
        return '';
    }
    var checked = getCheckedDefaultDashboardCode();
    if (checked) {
        G_defaultDashboardCode = checked;
        return G_defaultDashboardCode;
    }
    if (!G_defaultDashboardCode || selected.indexOf(String(G_defaultDashboardCode)) === -1) {
        G_defaultDashboardCode = inferDefaultFromUsers(getSelectedUserCodes(), selected);
    }
    if (!G_defaultDashboardCode) G_defaultDashboardCode = selected[0];
    return G_defaultDashboardCode;
}

function syncDefaultDashboardUi() {
    var selected = getSelectedDashboardCodes();
    var hasSelected = selected.length > 0;
    ensureDefaultDashboard();
    var current = G_defaultDashboardCode;

    $('.dc-default-pick').each(function () {
        var $pick = $(this);
        var code = String($pick.find('.dc-default-dash').val() || '');
        var isOn = selected.indexOf(code) !== -1;
        var isDefault = isOn && !!current && code === current;
        $pick.addClass('is-visible');
        $pick.toggleClass('is-on', isDefault);
        $pick.find('.dc-default-dash').prop('disabled', false);
        $pick.find('.dc-default-dash').prop('checked', isDefault);
    });

    $('.dc-section-default').each(function () {
        var $btn = $(this);
        var code = String($btn.attr('data-master-code') || '');
        var isDefault = hasSelected && !!current && code === current;
        $btn.toggleClass('is-visible', hasSelected);
        $btn.toggleClass('is-on', isDefault);
        $btn.find('.dc-default-dash').prop('checked', isDefault);
        $btn.find('.dc-default-text').text(isDefault ? 'Default' : 'Set default');
    });

    $('.dc-jump-chip').each(function () {
        var $chip = $(this);
        var code = String($chip.attr('data-master-code') || '');
        var isDefault = hasSelected && !!current && code === current;
        $chip.toggleClass('is-default', isDefault);
        $chip.find('.dc-default-star').toggle(isDefault);
    });

    updateDashboardTriggerText();
}

function chooseDefaultDashboard(code) {
    var next = code != null ? String(code) : '';
    if (!next || next === '0') return;

    var $chk = $('.dc-dashboard-chk').filter(function () {
        return String($(this).val() || '') === next;
    });
    var wasChecked = $chk.is(':checked');
    if ($chk.length && !wasChecked) {
        $chk.prop('checked', true);
        rememberSessionDashboard(next);
        syncDashboardSelectAllState();
    }

    G_defaultDashboardCode = next;
    syncDefaultDashboardUi();

    if (!wasChecked) {
        onDashboardSelected();
    }
}

function rememberSessionDashboard(code) {
    var c = code != null ? String(code) : '';
    if (c && c !== '0') G_sessionCheckedDashboards[c] = true;
}

function resetDashboardAssignmentTracking(assignedCodes) {
    G_assignedDashboardCodes = normalizeSelectedCodes(assignedCodes);
    G_sessionCheckedDashboards = {};
    $.each(G_assignedDashboardCodes, function (_, code) {
        rememberSessionDashboard(code);
    });
}

function getDashboardsToRemove() {
    var selectedSet = {};
    $.each(getSelectedDashboardCodes(), function (_, code) {
        selectedSet[String(code)] = true;
    });

    var remove = {};
    $.each(G_assignedDashboardCodes, function (_, code) {
        if (code && !selectedSet[String(code)]) remove[String(code)] = true;
    });
    $.each(G_sessionCheckedDashboards, function (code) {
        if (code && !selectedSet[String(code)]) remove[String(code)] = true;
    });
    return Object.keys(remove);
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

    resetDashboardAssignmentTracking(Object.keys(selectedSet));
    syncDashboardSelectAllState();
    syncDefaultDashboardUi();
}

function mergeUserDashboardAssignment(userCode, dashCode) {
    var uc = userCode != null ? String(userCode) : '';
    var dc = dashCode != null ? String(dashCode) : '';
    if (!uc || uc === '0' || !dc || dc === '0') return;
    if (!G_userToDashboards[uc]) G_userToDashboards[uc] = {};
    G_userToDashboards[uc][dc] = true;
}

function resetAssignmentCache() {
    G_userToDashboards = {};
    G_assignmentPairs = [];
    G_userToDefaultDashboard = {};
    G_assignmentCachePromise = null;
}

/** Assignment rows only — UserMaster_Code present. Do not treat user-list Code as a dashboard. */
function pickAssignmentDashCode(item) {
    var dash = pickByNames(item, [
        'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code',
        'DashboardMaster_Code', 'dashboardMaster_Code', 'DashboardMasterCode',
    ]);
    if (dash && dash !== '0') return dash;
    if (pickUserMasterCode(item)) {
        var code = pickCode(item);
        if (code && code !== '0') return code;
    }
    return '';
}

function resolveDashboardCodeFromRow(item) {
    return pickAssignmentDashCode(item);
}

function ingestAssignmentRows(rows, replaceAll) {
    if (replaceAll) {
        G_userToDashboards = {};
        G_assignmentPairs = [];
        G_userToDefaultDashboard = {};
    }
    var hits = 0;
    $.each(rows || [], function (_, item) {
        var userCode = pickUserMasterCode(item);
        var dashCode = pickAssignmentDashCode(item);
        if (!userCode || !dashCode) return;
        mergeUserDashboardAssignment(userCode, dashCode);
        G_assignmentPairs.push({ userCode: String(userCode), dashCode: String(dashCode) });
        if (pickIsDefault(item)) {
            G_userToDefaultDashboard[userCode] = dashCode;
        }
        hits += 1;
    });
    return hits;
}

function loadAssignmentCache() {
    resetAssignmentCache();
    return DashboardConfigurationService.GetUserDashboardDetails(0, 0)
        .then(function (res) {
            ingestAssignmentRows(firstArray(res), true);
        })
        .catch(function (err) {
            console.warn('GetUserDashboardDetails failed; assigned-user hints skipped.', err);
        });
}

function ensureAssignmentCache() {
    if (G_assignmentCachePromise) return G_assignmentCachePromise;
    G_assignmentCachePromise = loadAssignmentCache().catch(function (err) {
        G_assignmentCachePromise = null;
        throw err;
    });
    return G_assignmentCachePromise;
}

function getAssignedUserCodesForDashboards(dashCodes) {
    var dashSet = {};
    $.each(normalizeSelectedCodes(dashCodes), function (_, code) {
        dashSet[String(code)] = true;
    });

    var assigned = [];
    var seen = {};

    $.each(G_assignmentPairs || [], function (_, pair) {
        if (!pair || !dashSet[String(pair.dashCode)]) return;
        var uc = String(pair.userCode || '');
        if (!uc || uc === '0' || seen[uc]) return;
        seen[uc] = true;
        assigned.push(uc);
    });

    if (assigned.length) return assigned;

    $.each(G_userRows || [], function (_, item) {
        var displayCode = pickUserListCode(item);
        if (!displayCode || seen[displayCode]) return;
        var hit = false;
        $.each(userRowCodes(item), function (_, uc) {
            var map = G_userToDashboards[uc];
            if (!map) return;
            $.each(dashSet, function (dc) {
                if (map[dc]) hit = true;
            });
        });
        if (!hit) return;
        seen[displayCode] = true;
        assigned.push(displayCode);
    });
    return assigned;
}

/** Only users whose assignment row WebApiDashboardMaster_Code is in dashCodes. */
function extractAssignedUserCodesFromRows(rows, dashCodes) {
    var dashSet = {};
    $.each(normalizeSelectedCodes(dashCodes), function (_, code) {
        dashSet[String(code)] = true;
    });
    if (!Object.keys(dashSet).length) return [];

    var codes = [];
    var seen = {};
    $.each(rows || [], function (_, item) {
        var dc = pickAssignmentDashCode(item);
        if (!dc || !dashSet[String(dc)]) return;
        var uc = pickUserMasterCode(item);
        if (!uc || uc === '0' || seen[uc]) return;
        seen[uc] = true;
        codes.push(uc);
    });
    return codes;
}

function fetchAssignedUserCodesForDashboards(dashCodes) {
    var codes = normalizeSelectedCodes(dashCodes);
    if (!codes.length) {
        resetAssignmentCache();
        return Promise.resolve([]);
    }

    // One call for all assignments, then keep users only for the checked dashboard(s).
    // 1 dashboard → that dashboard's users. 2 dashboards → union of both.
    return DashboardConfigurationService.GetUserDashboardDetails(0, 0)
        .then(function (res) {
            var rows = firstArray(res);
            ingestAssignmentRows(rows, true);
            return extractAssignedUserCodesFromRows(rows, codes);
        })
        .catch(function (err) {
            console.warn('GetUserDashboardDetails failed; assigned-user list empty.', err);
            return getAssignedUserCodesForDashboards(codes);
        });
}

function rememberAssignmentsAfterSave(userCodes, masterCodes, removeCodes) {
    var removeSet = {};
    $.each(removeCodes || [], function (_, mc) {
        removeSet[String(mc)] = true;
    });
    G_assignmentPairs = (G_assignmentPairs || []).filter(function (pair) {
        if (!pair) return false;
        var userHit = false;
        $.each(userCodes || [], function (_, uc) {
            if (String(uc) === String(pair.userCode)) userHit = true;
        });
        if (!userHit) return true;
        return !removeSet[String(pair.dashCode)];
    });

    $.each(userCodes || [], function (_, uc) {
        var key = String(uc);
        if (!G_userToDashboards[key]) G_userToDashboards[key] = {};
        $.each(masterCodes || [], function (__, mc) {
            mergeUserDashboardAssignment(key, mc);
            var exists = false;
            $.each(G_assignmentPairs, function (___, pair) {
                if (pair && String(pair.userCode) === key && String(pair.dashCode) === String(mc)) {
                    exists = true;
                    return false;
                }
            });
            if (!exists) G_assignmentPairs.push({ userCode: key, dashCode: String(mc) });
        });
        $.each(removeCodes || [], function (__, mc) {
            if (G_userToDashboards[key]) delete G_userToDashboards[key][String(mc)];
        });
    });
}

function resetAssignedUserTracking(assignedCodes) {
    G_assignedUserCodes = normalizeSelectedCodes(assignedCodes);
}

function getUsersToUnassign() {
    var selectedSet = {};
    $.each(getSelectedUserCodes(), function (_, code) {
        selectedSet[String(code)] = true;
    });
    var remove = [];
    var seen = {};
    function add(code) {
        var key = String(code || '');
        if (!key || key === '0' || seen[key] || selectedSet[key]) return;
        seen[key] = true;
        var n = parseInt(key, 10);
        remove.push(isNaN(n) ? key : n);
    }
    $.each(G_assignedUserCodes || [], function (_, code) {
        add(code);
    });
    $('.dc-user-chk').each(function () {
        var $item = $(this).closest('.dc-multi-checkbox-item');
        if (!$item.hasClass('is-assigned')) return;
        if ($(this).is(':checked')) return;
        add($(this).val());
    });
    return remove;
}

function forgetUnassignedUsers(userCodes, masterCodes) {
    var userSet = {};
    $.each(userCodes || [], function (_, uc) {
        userSet[String(uc)] = true;
    });
    var dashSet = {};
    $.each(masterCodes || [], function (_, mc) {
        dashSet[String(mc)] = true;
    });

    G_assignmentPairs = (G_assignmentPairs || []).filter(function (pair) {
        if (!pair) return false;
        return !(userSet[String(pair.userCode)] && dashSet[String(pair.dashCode)]);
    });

    $.each(userCodes || [], function (_, uc) {
        var key = String(uc);
        if (!G_userToDashboards[key]) return;
        $.each(masterCodes || [], function (__, mc) {
            delete G_userToDashboards[key][String(mc)];
        });
    });
}

function applyUsersForSelectedDashboards(dashCodes, assignedCodesOverride) {
    var assignedCodes = assignedCodesOverride != null
        ? normalizeSelectedCodes(assignedCodesOverride)
        : getAssignedUserCodesForDashboards(dashCodes);
    resetAssignedUserTracking(assignedCodes);
    G_applyingDashboardUsers = true;
    try {
        bindUserDropdown(G_userRows, assignedCodes, assignedCodes);
    } finally {
        G_applyingDashboardUsers = false;
    }
    return assignedCodes;
}

function setUserTriggerLoading(isLoading) {
    var $text = $('#dcUserTriggerText');
    if (!$text.length) return;
    if (isLoading) {
        $text.text('Loading assigned users…').addClass('is-placeholder');
    }
}

/** Dashboard change → only assigned users selected; others unchecked */
function onDashboardSelected() {
    var dashCodes = getSelectedDashboardCodes();
    var usersReady = (G_userRows && G_userRows.length)
        ? Promise.resolve()
        : loadUserDropdown();

    return usersReady.then(function () {
        if (!dashCodes.length) {
            applyUsersForSelectedDashboards([], []);
            setDefaultDashboardCode('');
            clearTiles();
            return;
        }

        setUserTriggerLoading(true);
        return fetchAssignedUserCodesForDashboards(dashCodes)
            .then(function (assignedCodes) {
                applyUsersForSelectedDashboards(dashCodes, assignedCodes);
                setDefaultDashboardCode(inferDefaultFromUsers(assignedCodes, dashCodes));
                return refreshTilesForSelection();
            })
            .catch(function (err) {
                console.warn('Failed to load assigned users for dashboard.', err);
                applyUsersForSelectedDashboards(dashCodes);
                setDefaultDashboardCode(inferDefaultFromUsers(getSelectedUserCodes(), dashCodes));
                return refreshTilesForSelection();
            });
    });
}

/** User change → refresh tiles only (dashboard remains the driver) */
function onUserSelected() {
    if (G_applyingDashboardUsers) return Promise.resolve();

    var dashCodes = getSelectedDashboardCodes();
    if (!dashCodes.length && !getSelectedUserCodes().length) {
        clearTiles();
        return Promise.resolve();
    }

    if (dashCodes.length) {
        var currentDefault = getCheckedDefaultDashboardCode();
        if (!currentDefault || dashCodes.indexOf(String(currentDefault)) === -1) {
            setDefaultDashboardCode(inferDefaultFromUsers(getSelectedUserCodes(), dashCodes));
        }
    }

    return refreshTilesForSelection();
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
        + '#DashboardConfigurationPage .dc-section{display:block!important;width:100%!important;float:none!important;clear:both!important;margin:0 0 18px!important;}'
        + '#DashboardConfigurationPage .dc-section-body{max-height:none!important;overflow:visible!important;}'
        + '#DashboardConfigurationPage .dc-tile-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;}'
        + '@media (max-width:1100px){#DashboardConfigurationPage .dc-tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}'
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
        $('<span>', { class: 'dc-tile-icon', 'aria-hidden': 'true' })
            .append($('<i class="fas ' + getTileIcon(label) + '"></i>'))
    );
    $item.append($('<span class="dc-tile-label">').text(label));
    $item.append($('<span>', { class: 'dc-tile-toggle', 'aria-hidden': 'true' }));
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
    var colors = ['#0d9488', '#0284c7', '#7c3aed', '#d97706', '#db2777', '#4f46e5'];

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
        $chip.append($('<i>', { class: 'fas fa-star dc-default-star', title: 'Default dashboard' }).hide());
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
            marginBottom: '16px',
        });

        var $head = $('<div>', { class: 'dc-section-head' });
        $head.append(
            $('<h3>', { class: 'dc-section-title' })
                .append($('<span class="ico"><i class="fas fa-layer-group"></i></span>'))
                .append($('<span>').text(masterLabel))
        );

        var $meta = $('<div>', { class: 'dc-section-meta' });
        $meta.append(
            $('<label>', {
                class: 'dc-section-default',
                'data-master-code': masterCode,
                title: 'Open this dashboard first for selected users',
            })
                .append($('<input>', {
                    type: 'radio',
                    name: 'dcDefaultDashboardSection',
                    class: 'dc-default-dash',
                    value: masterCode,
                }))
                .append($('<i class="fas fa-star"></i>'))
                .append($('<span>', { class: 'dc-default-text' }).text('Set default'))
        );
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
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '12px',
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
    syncPlaceholderVisibility();
    syncDefaultDashboardUi();
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
    if (G_userLoadPromise && selectedCode == null) {
        return G_userLoadPromise;
    }

    G_userLoadPromise = DashboardConfigurationService.GetUserDetails()
        .then(function (res) {
            G_userRows = firstArray(res);
            bindUserDropdown(G_userRows, selectedCode);
        })
        .catch(function (err) {
            console.error('GetUserDetails failed', err);
            G_userRows = [];
            G_userLoadPromise = null;
            bindUserDropdown([], selectedCode);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load users.');
            }
        });
    return G_userLoadPromise;
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

/** Tiles unchecked for every selected user (ALL / multi). One user → that user's config. */
function loadSharedNotApplicableCodes(userCodes, masterCode) {
    var codes = (userCodes || []).filter(function (c) { return c > 0; });
    if (!codes.length || !masterCode) {
        return Promise.resolve([]);
    }
    if (codes.length === 1) {
        return loadAssignedTileCodes(codes[0], masterCode);
    }

    return Promise.all(codes.map(function (uc) {
        return loadAssignedTileCodes(uc, masterCode);
    })).then(function (lists) {
        if (!lists.length) return [];
        var counts = {};
        $.each(lists, function (_, list) {
            var seen = {};
            $.each(list || [], function (__, tileCode) {
                var key = String(tileCode);
                if (!key || key === '0' || seen[key]) return;
                seen[key] = true;
                counts[key] = (counts[key] || 0) + 1;
            });
        });
        var shared = [];
        $.each(counts, function (tileCode, count) {
            if (count === lists.length) shared.push(tileCode);
        });
        return shared;
    });
}

function loadGroupForDashboard(masterCode, userCodes) {
    var code = masterCode != null ? String(masterCode) : '';
    var label = getDashboardLabel(code);
    var users = Array.isArray(userCodes) ? userCodes : (userCodes ? [userCodes] : []);

    // Always load FULL tile list (UserMaster_Code=0). Config page must show
    // unchecked/NotApplicable tiles too — mark them unchecked via GET_USER_CONFIG.
    return Promise.all([
        DashboardConfigurationService.GetDashboardTileDetail(code, 0),
        loadSharedNotApplicableCodes(users, code),
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
    var userCodes = getSelectedUserCodes();
    var masterCodes = getSelectedDashboardCodes();

    if (!masterCodes.length) {
        clearTiles();
        return Promise.resolve();
    }

    setTilesLoading(true);

    return Promise.all(masterCodes.map(function (code) {
        return loadGroupForDashboard(code, userCodes);
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
function buildSavePayload(forUserCodes) {
    var userCodes = (forUserCodes && forUserCodes.length) ? forUserCodes : getSaveTargetUserCodes();
    var template = [];
    var mastersWithUnchecked = {};

    // Assignment rows FIRST (Tile=0). Default dashboard last so SP demotes the old Y.
    var defaultCode = parseInt(ensureDefaultDashboard(), 10) || 0;
    var dashCodes = getSelectedDashboardCodes().slice().sort(function (a, b) {
        var aDef = (parseInt(a, 10) || 0) === defaultCode ? 1 : 0;
        var bDef = (parseInt(b, 10) || 0) === defaultCode ? 1 : 0;
        return aDef - bDef;
    });
    $.each(dashCodes, function (_, masterCode) {
        var mc = parseInt(masterCode, 10) || 0;
        if (!mc) return;
        template.push({
            Code: 0,
            WebApiDashboardMaster_Code: mc,
            WebApiDashboardTileDetail_Code: 0,
        });
    });

    $('.dc-tile-checkbox:not(:checked)').each(function () {
        var $chk = $(this);
        var tile = parseInt($chk.val(), 10) || 0;
        var masterCode = parseInt($chk.attr('data-master-code'), 10) || 0;
        if (!tile || !masterCode) return;

        mastersWithUnchecked[masterCode] = true;
        template.push({
            Code: 0,
            WebApiDashboardMaster_Code: masterCode,
            WebApiDashboardTileDetail_Code: tile,
        });
    });

    var details = [];
    $.each(userCodes, function (_, userCode) {
        $.each(template, function (__, row) {
            details.push({
                Code: 0,
                WebApiDashboardMaster_Code: row.WebApiDashboardMaster_Code,
                WebApiDashboardTileDetail_Code: row.WebApiDashboardTileDetail_Code,
                UserMaster_Code: userCode,
                IsDefault: isDefaultDashboard(row.WebApiDashboardMaster_Code, defaultCode) ? 'Y' : 'N',
            });
        });
    });

    var removeCodes = getDashboardsToRemove();
    var unassignCodes = getUsersToUnassign();
    var keepDashCodes = getSelectedDashboardCodes();
    var removeRows = [];
    $.each(userCodes, function (_, userCode) {
        $.each(removeCodes, function (__, masterCode) {
            var mc = parseInt(masterCode, 10) || 0;
            if (!mc) return;
            removeRows.push({
                Code: 0,
                WebApiDashboardMaster_Code: mc,
                WebApiDashboardTileDetail_Code: 0,
                UserMaster_Code: userCode,
            });
        });
    });
    $.each(unassignCodes, function (_, userCode) {
        $.each(keepDashCodes, function (__, masterCode) {
            var mc = parseInt(masterCode, 10) || 0;
            if (!mc) return;
            removeRows.push({
                Code: 0,
                WebApiDashboardMaster_Code: mc,
                WebApiDashboardTileDetail_Code: 0,
                UserMaster_Code: userCode,
            });
        });
    });

    var userDashboardDetail = [];
    $.each(userCodes, function (_, userCode) {
        $.each(dashCodes, function (__, masterCode) {
            var mc = parseInt(masterCode, 10) || 0;
            if (!mc) return;
            userDashboardDetail.push({
                Code: 0,
                UserMaster_Code: userCode,
                WebApiDashboardMaster_Code: mc,
                IsDefault: isDefaultDashboard(mc, defaultCode) ? 'Y' : 'N',
            });
        });
    });

    return {
        DashboardTileDetail: details,
        UserDashboardDetail: userDashboardDetail,
        RemoveDashboardDetail: removeRows,
        DefaultWebApiDashboardMaster_Code: defaultCode,
        IsDefault: defaultCode > 0 ? 'Y' : 'N',
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

function buildUnassignPayload(userCode, masterCode) {
    var mc = parseInt(masterCode, 10) || 0;
    var uc = parseInt(userCode, 10) || 0;
    return {
        Mode: 'UNASSIGN',
        DashboardTileDetail: [{
            Code: 0,
            WebApiDashboardMaster_Code: mc,
            WebApiDashboardTileDetail_Code: -1,
            UserMaster_Code: uc,
            Mode: 'UNASSIGN',
            IsDefault: 'N',
        }],
        UserDashboardDetail: [],
        RemoveDashboardDetail: [{
            Code: 0,
            WebApiDashboardMaster_Code: mc,
            WebApiDashboardTileDetail_Code: -1,
            UserMaster_Code: uc,
            Mode: 'UNASSIGN',
        }],
    };
}

function clearRemovedDashboardAssignments(userCodes, removeCodes) {
    var jobs = [];
    $.each(userCodes || [], function (_, userCode) {
        $.each(removeCodes || [], function (__, masterCode) {
            jobs.push(
                DashboardConfigurationService.SaveDashboardTileDetail(
                    buildUnassignPayload(userCode, masterCode)
                ).catch(function () { return null; })
            );
            if (typeof DashboardConfigurationService.ClearDashboardTileDetail === 'function') {
                jobs.push(
                    DashboardConfigurationService.ClearDashboardTileDetail(userCode, masterCode)
                        .catch(function () { return null; })
                );
            }
        });
    });
    return jobs.length ? Promise.all(jobs) : Promise.resolve();
}

function SaveDashboardTileDetail() {
    var userCodes = getSelectedUserCodes();
    var unassignCodes = getUsersToUnassign();
    var masterCodes = getSelectedDashboardCodes();
    var removeCodes = getDashboardsToRemove();

    if (!userCodes.length && !unassignCodes.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select at least one User.');
        setUserDropdownOpen(true);
        return;
    }
    if (!masterCodes.length && !removeCodes.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select at least one Dashboard Detail.');
        setDashboardDropdownOpen(true);
        return;
    }

    if (isAllUsersSelected() && !window.confirm('Apply this dashboard configuration to ALL users?')) {
        return;
    }

    var $btn = $('#btnSaveDashboardConfig');
    var $btnText = $('#btnSaveDashboardConfigText');
    var origText = $btnText.text();

    $btn.prop('disabled', true);
    $btnText.text(userCodes.length > 1 ? 'Saving ' + userCodes.length + ' users…' : 'Saving…');

    var saveChain = Promise.resolve({ ok: 0, fail: 0 });
    if (unassignCodes.length && masterCodes.length) {
        saveChain = saveChain.then(function (acc) {
            return clearRemovedDashboardAssignments(unassignCodes, masterCodes)
                .then(function () {
                    acc.ok += 1;
                    return acc;
                })
                .catch(function (err) {
                    console.error('Unassign users failed', err);
                    acc.fail += 1;
                    return acc;
                });
        });
    }
    $.each(userCodes, function (_, userCode) {
        saveChain = saveChain.then(function (acc) {
            return clearRemovedDashboardAssignments([userCode], removeCodes)
                .then(function () {
                    if (!masterCodes.length) {
                        return { Status: 'Y' };
                    }
                    return DashboardConfigurationService.SaveDashboardTileDetail(
                        buildSavePayload([userCode])
                    );
                })
                .then(function (res) {
                    if (apiSuccessY(res)) acc.ok += 1;
                    else acc.fail += 1;
                    return acc;
                })
                .catch(function (err) {
                    console.error('Save failed for user ' + userCode, err);
                    acc.fail += 1;
                    return acc;
                });
        });
    });

    saveChain
        .then(function (acc) {
            if (!acc.ok) {
                if (typeof toastr !== 'undefined') {
                    toastr.error('Failed to save dashboard configuration.');
                }
                return;
            }

            if (typeof toastr !== 'undefined') {
                var okMsg;
                if (acc.fail) {
                    okMsg = 'Saved for ' + acc.ok + ' user(s); failed for ' + acc.fail + '.';
                } else if (unassignCodes.length && !userCodes.length) {
                    okMsg = 'Removed dashboard assignment for ' + unassignCodes.length + ' user(s).';
                } else if (isAllUsersSelected()) {
                    okMsg = 'Dashboard configuration saved for all users.';
                } else if (acc.ok > 1) {
                    okMsg = 'Dashboard configuration saved for ' + acc.ok + ' users.';
                } else {
                    okMsg = 'Dashboard configuration saved.';
                }
                if (unassignCodes.length && userCodes.length) {
                    okMsg += ' Unassigned ' + unassignCodes.length + ' user(s).';
                }
                if (masterCodes.length > 1 && ensureDefaultDashboard()) {
                    okMsg += ' Default: ' + getDashboardLabel(ensureDefaultDashboard()) + '.';
                }
                if (acc.fail) toastr.warning(okMsg);
                else toastr.success(okMsg);
            }

            resetDashboardAssignmentTracking(masterCodes);
            forgetUnassignedUsers(unassignCodes, masterCodes);
            rememberAssignmentsAfterSave(userCodes, masterCodes, removeCodes);
            writeDefaultForUsers(userCodes, ensureDefaultDashboard());
            fetchAssignedUserCodesForDashboards(masterCodes)
                .then(function (assignedCodes) {
                    applyUsersForSelectedDashboards(masterCodes, assignedCodes);
                    return refreshTilesForSelection();
                })
                .catch(function () {
                    applyUsersForSelectedDashboards(masterCodes, userCodes);
                    return refreshTilesForSelection();
                });
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
    syncPlaceholderVisibility();
    loadUserDropdown();
    loadDashboardDetailDropdown();

    $('#btnUserTrigger').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = !$('#dcUserMulti').hasClass('is-open');
        setUserDropdownOpen(open);
    });

    $(document).on('change', '.dc-user-chk', function () {
        syncUserSelectAllState();
        updateUserTriggerText();
        onUserSelected();
    });

    $('#chkUserSelectAll').on('change', function () {
        var checked = $(this).is(':checked');
        $('.dc-user-chk').prop('checked', checked);
        syncUserSelectAllState();
        updateUserTriggerText();
        onUserSelected();
    });

    $('#txtUserSearch').on('input', function () {
        applyUserSearch($(this).val());
    });

    $('#dcUserPanel').on('click', function (e) {
        e.stopPropagation();
    });

    $(document).on('click.dcUserMulti', function (e) {
        if (!$(e.target).closest('#dcUserMulti').length) {
            setUserDropdownOpen(false);
        }
    });

    $('#btnDashboardTrigger').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = !$('#dcDashboardMulti').hasClass('is-open');
        setDashboardDropdownOpen(open);
    });

    $(document).on('change', '.dc-dashboard-chk', function () {
        if ($(this).is(':checked')) rememberSessionDashboard($(this).val());
        syncDashboardSelectAllState();
        syncDefaultDashboardUi();
        onDashboardSelected();
    });

    $('#chkDashboardSelectAll').on('change', function () {
        var checked = $(this).is(':checked');
        $('.dc-dashboard-chk').prop('checked', checked);
        if (checked) {
            $('.dc-dashboard-chk').each(function () {
                rememberSessionDashboard($(this).val());
            });
        }
        syncDashboardSelectAllState();
        syncDefaultDashboardUi();
        onDashboardSelected();
    });

    $(document).on('change', '.dc-default-dash', function (e) {
        e.preventDefault();
        e.stopPropagation();
        chooseDefaultDashboard($(this).val());
    });

    $(document).on('click', '.dc-default-pick, .dc-section-default', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var code = String($(this).find('.dc-default-dash').val() || $(this).attr('data-master-code') || '');
        chooseDefaultDashboard(code);
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
        if (e.key === 'Escape') {
            setDashboardDropdownOpen(false);
            setUserDropdownOpen(false);
        }
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
    onDashboardSelected,
    setSelectedDashboardCodes,
    bindUserDropdown,
    bindDashboardDetailDropdown,
    bindTiles,
    bindTilesGrouped,
    getSelectedTileCodes,
    getUncheckedTileCodes,
    getSelectedDashboardCodes,
    getSelectedUserCodes,
    buildSavePayload,
    SaveDashboardTileDetail,
    setDefaultDashboardCode,
    chooseDefaultDashboard,
};
