import { WebNotificationService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/WebNotificationService.js';

startTimer();
setInterval(GetWebNotificationList, 60000);
let notificationList = '';

const NOTIFICATION_ICON_VARIANTS = [
    { mod: 'danger', icon: 'fa-solid fa-exclamation' },
    { mod: 'warning', icon: 'fa-regular fa-bell' },
    { mod: 'info', icon: 'fa-regular fa-house' },
    { mod: 'success', icon: 'fa-solid fa-user-plus' }
];

const TIME_LABELS = ['Just now', '5m ago', '15m ago', '30m ago', '1h ago', 'Today', 'Yesterday'];

function escapeHtml(text) {
    if (text == null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildNotificationUrl(notification, baseUrl) {
    if (!notification.ScreenURL) return '#';
    const sep = notification.ScreenURL.indexOf('?') !== -1 ? '&' : '?';
    const q =
        'menu=' +
        encodeURIComponent(notification.NotificationDescription || '') +
        '&FrmType=' +
        encodeURIComponent(notification.DotNetMainMenuName || '') +
        '&FrmAction=' +
        encodeURIComponent(notification.ForAction || '');
    return baseUrl + '/' + notification.ScreenURL + sep + q;
}

function renderNotificationWell(rowsHtml, headerCount) {
    const headerText =
        headerCount === 0
            ? 'Notifications'
            : `${headerCount} New Notification${headerCount === 1 ? '' : 's'}`;

    return (
        `<div class="notification-well">
            <div class="notification-well-header">${headerText}</div>
            <div class="notification-well-list">` +
        rowsHtml +
        `</div></div>`
    );
}

function GetWebNotificationList() {
    let totalNotificationCount = 0;
    const ud = sessionStorage.getItem('UserDetails');
    if (!ud) return;
    let UserDetailsobj = JSON.parse(ud);
    let UserID = UserDetailsobj[0].UserID;
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    WebNotificationService.GetWebNotificationMasterList(UserID)
        .then(function (value) {
            notificationList = '';
            let rowsHtml = '';
            let rowIndex = 0;
            let itemCount = 0;

            value.forEach(function (notification) {
                totalNotificationCount += notification.NotificationCount;
                if (notification.NotificationCount <= 0) return;

                itemCount++;
                const variant = NOTIFICATION_ICON_VARIANTS[rowIndex % NOTIFICATION_ICON_VARIANTS.length];
                const timeLabel = TIME_LABELS[rowIndex % TIME_LABELS.length];
                rowIndex++;

                const href = buildNotificationUrl(notification, baseUrl);
                const title = escapeHtml(notification.NotificationDescription);
                const description = escapeHtml(notification.NotificationCount + ' pending');

                rowsHtml +=
                    `<a href="${href}" class="notification-well-item">
                    <span class="notification-well-icon notification-well-icon--${variant.mod}" aria-hidden="true">
                        <i class="${variant.icon}"></i>
                    </span>
                    <span class="notification-well-body">
                        <span class="notification-well-title">${title}</span>
                        <span class="notification-well-desc">${description}</span>
                        <span class="notification-well-time">${timeLabel}</span>
                    </span>
                </a>`;
            });

            if (totalNotificationCount > 0) {
                $('#notificationCount').text(totalNotificationCount).show();
            } else {
                $('#notificationCount').hide();
            }

            if (itemCount === 0) {
                notificationList = renderNotificationWell(
                    `<div class="notification-well-empty">You have no new notifications.</div>`,
                    0
                );
            } else {
                notificationList = renderNotificationWell(rowsHtml, itemCount);
            }
        })
        .catch(function () {
            notificationList = renderNotificationWell(
                `<div class="notification-well-empty">Unable to load notifications.</div>`,
                0
            );
            $('#notificationCount').hide();
        });
}

var minutes = 1;
var seconds = 0;
var timer;
function startTimer() {
    timer = setInterval(function () {
        if (seconds > 0) {
            seconds--;
        } else if (minutes > 0) {
            seconds = 59;
            minutes--;
        } else {
            clearInterval(timer);
            $('#time').html('00:00');
            minutes = 1;
            seconds = 0;
            startTimer();
            GetWebNotificationList();
            return;
        }
        $('#time').html(minutes + ':' + (seconds < 10 ? '0' + seconds : seconds));
    }, 1000);
}

$('#resetBtn').click(function () {
    clearInterval(timer);
    minutes = 1;
    seconds = 0;
    $('#time').html(minutes + ':' + (seconds < 10 ? '0' + seconds : seconds));
    startTimer();
    GetWebNotificationList();
});

$('#bell-icon').on('click', function () {
    $('#notificationDropdown').html(notificationList);
});

window.GetWebNotificationList = GetWebNotificationList;
