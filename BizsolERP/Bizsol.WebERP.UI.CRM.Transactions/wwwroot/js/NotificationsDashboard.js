import { NotificationsDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/NotificationsDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const NOTIFICATION_ICON_VARIANTS = [
    { mod: '0', icon: 'fa-solid fa-file-invoice' },
    { mod: '1', icon: 'fa-regular fa-bell' },
    { mod: '2', icon: 'fa-regular fa-file-lines' },
    { mod: '3', icon: 'fa-solid fa-user-check' },
    { mod: '4', icon: 'fa-solid fa-warehouse' },
    { mod: '5', icon: 'fa-solid fa-industry' },
];

function tileVisual(title, index) {
    var t = (title || '').toLowerCase();
    if (t.indexOf('buyer') !== -1 && t.indexOf('po') !== -1) return { mod: '0', icon: 'fa-solid fa-file-invoice' };
    if (t.indexOf('production') !== -1) return { mod: '1', icon: 'fa-solid fa-industry' };
    if (t.indexOf('quotation') !== -1) return { mod: '2', icon: 'fa-regular fa-file-lines' };
    if (t.indexOf('indent') !== -1) return { mod: '4', icon: 'fa-solid fa-warehouse' };
    if (t.indexOf('verify') !== -1 && t.indexOf('po') !== -1) return { mod: '3', icon: 'fa-solid fa-clipboard-check' };
    if (t.indexOf('verify') !== -1) return { mod: '3', icon: 'fa-solid fa-user-check' };
    if (t.indexOf('rm') !== -1) return { mod: '5', icon: 'fa-solid fa-boxes-stacked' };
    return NOTIFICATION_ICON_VARIANTS[index % NOTIFICATION_ICON_VARIANTS.length];
}

const TIME_LABELS = ['Just now', '5m ago', '15m ago', '30m ago', '1h ago', 'Today', 'Yesterday'];

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
    return [];
}

function loggedInUserId() {
    try {
        var userDetails = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (Array.isArray(userDetails) && userDetails.length && userDetails[0].UserID) {
            return userDetails[0].UserID;
        }
    } catch (e) { /* ignore */ }
    return '';
}

function buildNotificationUrl(notification) {
    if (!notification || !notification.ScreenURL) return '';
    var screenUrl = String(notification.ScreenURL).replace(/^\/+/, '');
    var sep = screenUrl.indexOf('?') !== -1 ? '&' : '?';
    var q =
        'menu=' + encodeURIComponent(notification.NotificationDescription || '') +
        '&FrmType=' + encodeURIComponent(notification.DotNetMainMenuName || '') +
        '&FrmAction=' + encodeURIComponent(notification.ForAction || '');
    var relative = screenUrl + sep + q;
    var baseUrl = (sessionStorage.getItem('AppBaseURL') || '').replace(/\/$/, '');
    if (baseUrl) {
        return baseUrl + '/' + relative;
    }
    return BizSolHelperFunction.buildAppUrl(relative);
}

function setLoading(isLoading) {
    $('#nd-loading').toggle(!!isLoading);
    if (isLoading) {
        $('#nd-empty').hide();
        $('#nd-grid').hide();
    }
}

function showEmpty(message) {
    $('#nd-loading').hide();
    $('#nd-grid').hide().empty();
    $('#nd-empty').show();
    $('#nd-empty-text').text(message || 'You have no new notifications.');
    $('#nd-count-badge').text('0');
    $('#nd-total-pending').text('0');
}

function bindNotificationTiles(rows) {
    var $grid = $('#nd-grid').empty();
    var items = [];
    var totalCount = 0;

    (rows || []).forEach(function (notification) {
        var count = parseInt(notification.NotificationCount, 10) || 0;
        totalCount += count;
        if (count <= 0) return;
        items.push(notification);
    });

    if (!items.length) {
        showEmpty('You have no new notifications.');
        return;
    }

    $('#nd-empty').hide();
    $grid.show();
    $('#nd-count-badge').text(String(items.length));
    $('#nd-total-pending').text(String(totalCount));
    $('#nd-dashboard-name').text(totalCount + ' pending items across ' + items.length + ' notifications');

    items.forEach(function (notification, index) {
        var title = notification.NotificationDescription || 'Notification';
        var variant = tileVisual(title, index);
        var timeLabel = TIME_LABELS[index % TIME_LABELS.length];
        var href = buildNotificationUrl(notification);
        var count = parseInt(notification.NotificationCount, 10) || 0;
        var disabled = !href;

        var $card = $('<a>', {
            class: 'nd-card nd-accent-' + variant.mod + (disabled ? ' is-disabled' : ''),
            href: disabled ? 'javascript:void(0);' : href,
        });
        if (disabled) {
            $card.attr('title', 'Screen URL is not configured.');
        }

        var $head = $('<div>', { class: 'nd-card-head' });
        $head.append(
            $('<span>', { class: 'nd-card-icon', 'aria-hidden': 'true' })
                .append($('<i class="' + variant.icon + '"></i>'))
        );
        $head.append(
            $('<span>', { class: 'nd-card-time' })
                .append($('<i class="far fa-clock"></i> '))
                .append(document.createTextNode(timeLabel))
        );
        $card.append($head);

        var $main = $('<div>', { class: 'nd-card-main' });
        $main.append($('<div>', { class: 'nd-card-count' }).text(count));
        var $info = $('<div>', { class: 'nd-card-info' });
        $info.append($('<div>', { class: 'nd-card-title' }).text(title));
        $info.append($('<div>', { class: 'nd-card-count-label' }).text('Pending'));
        $main.append($info);
        $main.append(
            $('<span>', { class: 'nd-card-go', 'aria-hidden': 'true' })
                .append($('<i class="fas fa-arrow-right"></i>'))
        );
        $card.append($main);

        $grid.append($card);
    });
}

function loadDashboard() {
    var userId = loggedInUserId();
    if (!userId) {
        showEmpty('Logged-in user was not found. Please login again.');
        return;
    }

    setLoading(true);
    $('#nd-count-badge').text('—');
    $('#nd-total-pending').text('—');

    NotificationsDashboardService.GetWebNotificationMasterList(userId)
        .then(function (res) {
            bindNotificationTiles(firstArray(res));
        })
        .catch(function (err) {
            console.error('NotificationsDashboard load failed', err);
            showEmpty('Failed to load notifications. Please try again.');
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load notifications dashboard.');
            }
        })
        .finally(function () {
            setLoading(false);
        });
}

$(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    BizSolHelperFunction.applyUserDashboardMenuBackButton('#btnBackToUserDashboardMenu');
    $('#btnBackToUserDashboardMenu').on('click', function () {
        BizSolHelperFunction.goToUserDashboardMenu();
    });
    $('#btnNdRefresh').on('click', function () {
        loadDashboard();
    });
    $('#nd-grid').on('click', '.nd-card.is-disabled', function (e) {
        e.preventDefault();
        if (typeof toastr !== 'undefined') {
            toastr.warning('Screen URL is not configured.');
        }
    });
    loadDashboard();
});

export { loadDashboard };
