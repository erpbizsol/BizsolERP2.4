import { WebNotificationService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/WebNotificationService.js';


$(document).ready(function () {
    let baseUrl = `${window.location.protocol}//${window.location.host}`;
    startTimer();
    GetWebNotificationList(baseUrl);
    setInterval(GetWebNotificationList, 60000); // Refresh notifications every 60 seconds
});

function GetWebNotificationList(baseUrl) {
    let totalNotificationCount = 0;
    let notificationList = '';

    // Fetch notifications
    WebNotificationService.GetWebNotificationMasterList("BIZANKIT", 102).then(function (value) {
        value.forEach(notification => {
            totalNotificationCount += notification.NotificationCount;
            notificationList += `
                <div onclick="window.location.href='${baseUrl}/${notification.ScreenURL}'" style="display: flex; justify-content: space-between; padding: 8px 16px;">
                    <span>${notification.NotificationDescription}</span>
                    <span style="padding: 2px 8px;">
                        ${notification.NotificationCount > 0 ? `<span style="padding: 2px 8px;">${notification.NotificationCount}</span>` : ''}
                    </span>
                </div>`;
        });

        if (totalNotificationCount > 0) {
            $("#notificationCount").text(totalNotificationCount).show();
        } else {
            $("#notificationCount").hide();
        }
        $("#bell-icon").click(function () {
            $("#notificationDropdown").html(notificationList).toggle();
        });

        $(document).click(function (event) {
            if (!$(event.target).closest("#bell-icon, #notificationDropdown").length) {
                $("#notificationDropdown").hide();
            }
        });
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
            $('#time').html("00:00");
            minutes = 1;
            seconds = 0;
            startTimer();
            GetWebNotificationList();
            return;
        }
        $('#time').html(minutes + ":" + (seconds < 10 ? '0' + seconds : seconds));
    }, 1000);
}

$('#resetBtn').click(function () {
    GetWebNotificationList();
    clearInterval(timer);
    minutes = 1;
    seconds = 0;
    $('#time').html(minutes + ":" + (seconds < 10 ? '0' + seconds : seconds));
    startTimer();
});
