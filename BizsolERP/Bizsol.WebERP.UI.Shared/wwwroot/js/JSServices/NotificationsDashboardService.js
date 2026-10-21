import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function trimSlash(url) {
    return (url || '').replace(/\/$/, '');
}

function dashboardConfigurationApiBase() {
    if (UrlService.API_ENDPOINT_DASHBOARD_CONFIGURATION) {
        return trimSlash(UrlService.API_ENDPOINT_DASHBOARD_CONFIGURATION);
    }
    return trimSlash(UrlService.BASE_URL) + '/DashboardConfiguration';
}

function notificationsDashboardApiBase() {
    if (UrlService.API_ENDPOINT_NOTIFICATIONS_DASHBOARD) {
        return trimSlash(UrlService.API_ENDPOINT_NOTIFICATIONS_DASHBOARD);
    }
    return dashboardConfigurationApiBase();
}

function getJson(url) {
    return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
}

function getJsonWithFallback(pathAndQuery) {
    var primary = notificationsDashboardApiBase() + pathAndQuery;
    var fallback = dashboardConfigurationApiBase() + pathAndQuery;
    return getJson(primary).catch(function (err) {
        if (fallback === primary) throw err;
        return getJson(fallback);
    });
}

const NotificationsDashboardService = {
    GetDashboardDetails: function GetDashboardDetails() {
        return getJsonWithFallback('/GetDashboardDetails');
    },

    GetUserDashboardConfig: function GetUserDashboardConfig(userMasterCode, webApiDashboardMasterCode) {
        return getJsonWithFallback(
            '/GetUserDashboardConfig?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&WebApiDashboardMaster_Code=' +
            encodeURIComponent(webApiDashboardMasterCode || 0)
        );
    },

    GetWebNotificationMasterList: function GetWebNotificationMasterList(userId, companyCode) {
        var auth = {};
        try {
            auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        } catch (e) { /* ignore */ }
        var url = UrlService.API_ENDPOINT_WebNotification +
            '/GetWebNotificationMasterList?UserID=' + encodeURIComponent(userId || '') +
            '&CompanyCode=' + encodeURIComponent(companyCode || auth.CompanyCode || '');
        return getJson(url);
    },
};

export { NotificationsDashboardService };
