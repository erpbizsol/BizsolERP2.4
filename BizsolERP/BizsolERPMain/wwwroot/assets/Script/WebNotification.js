
const authToken = '{"ERPDBConStr":"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBINFRAMAT_Temp; User ID=sa;pwd=biz1981;Packet Size=32000","ERPMainDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDMSDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDB_Name":"BizSolERPDBBizDev","ERPMainDB_Name":"BizSolERPMainDB_BizDev","ERPDMSDB_Name":"BizSolERPDMSDB_BizDev","AuthToken":"xyz","UserMaster_Code":"145","CompanyCode":"102"}';
$(document).ready(function () {
    startTimer();
    updateNotificationCount();
    setInterval(updateNotificationCount, 60000);

});
function updateNotificationCount() {
    const params = {
        UserID: 'BIZANKIT',
        CompanyCode: 102,
    };
    $.ajax({
        url: "https://web.bizsol.in/erpapidev/api/WebNotification/GetWebNotificationMasterList",
        type: "GET",
        data: params,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authToken);
        },
        success: function (data) {
            let totalNotificationCount = 0;
            let notificationList = '';
            data.forEach(notification => {
                totalNotificationCount += notification.NotificationCount;
                notificationList += `
                        <div onclick="window.location.href='${notification.ScreenURL}'" style="display: flex; justify-content: space-between; padding: 8px 16px;">
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
        },
        error: function (error) {
            console.error("Error fetching notifications:", error);
        }
    });
}

var minutes = 1;
var seconds = 0;
var timer;
function startTimer() {
    timer = setInterval(function () {
        if (seconds > 0) {
            seconds--;
        }
        else if (minutes > 0) {
            seconds = 59;
            minutes--;
        }
        else {
            clearInterval(timer);
            $('#time').html("00:00");
            return;
        }
        $('#time').html(minutes + ":" + (seconds < 10 ? '0' + seconds : seconds));
    }, 1000);
}

$('#resetBtn').click(function () {
    updateNotificationCount();
    clearInterval(timer);
    minutes = 1;
    seconds = 0;
    $('#time').html(minutes + ":" + (seconds < 10 ? '0' + seconds : seconds));
    setTimeout(startTimer);
});

