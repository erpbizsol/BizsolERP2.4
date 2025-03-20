import { WebNotificationService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/WebNotificationService.js';

startTimer();
//GetWebNotificationList();
setInterval(GetWebNotificationList, 60000);
let notificationList = '';

function GetWebNotificationList() {
    let totalNotificationCount = 0;
    let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));
    let UserID = UserDetailsobj[0].UserID;
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    // Fetch notifications
    WebNotificationService.GetWebNotificationMasterList(UserID).then(function (value) {
        notificationList = ''
        value.forEach(notification => {
            totalNotificationCount += notification.NotificationCount;
            //notificationList += `
            //    <div onclick="window.location.href='../../${notification.ScreenURL}'" style="display: flex; justify-content: space-between; padding: 4px 16px;">
            //        <span>${notification.NotificationDescription}</span>
            //        <span>
            //            ${notification.NotificationCount > 0 ? `<span class="notificationCount">${notification.NotificationCount}</span>` : ''}
            //        </span>
            //    </div>`;
            notificationList += notification.NotificationCount > 0 ? `
                <div class="dropdown-item" onclick="window.location.href='${baseUrl}/${notification.ScreenURL}?menu=${notification.NotificationDescription}&FrmType=${notification.DotNetMainMenuName}&FrmAction=${notification.ForAction}'" style="display: flex; justify-content: space-between; padding: 4px 16px;">
                    <span>${notification.NotificationDescription}</span>
                    <span>
                        ${notification.NotificationCount > 0 ? `<span class="notificationCount">${notification.NotificationCount}</span>` : ''}
                    </span>
                </div>`:'';
        });
        if (totalNotificationCount > 0) {
            $("#notificationCount").text(totalNotificationCount).show();
        } else {
            $("#notificationCount").hide();
        }
       
        //$(document).click(function (event) {
        //    if (!$(event.target).closest("#bell-icon, #notificationDropdown").length) {
        //        $("#notificationDropdown").hide();
        //    }
        //});
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
        $('#time').html(minutes + ":" + (seconds < 1 ? '0' + seconds : seconds));
    }, 1000);
}

$('#resetBtn').click(function () {
    clearInterval(timer);
    minutes = 1;
    seconds = 0;
    $('#time').html(minutes + ":" + (seconds < 1 ? '0' + seconds : seconds));
    startTimer();
    GetWebNotificationList();

});
$("#bell-icon").click(function () {
    $("#notificationDropdown").html(notificationList);//.toggle();
});

window.GetWebNotificationList = GetWebNotificationList;
