import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function dashboardConfigurationApiBase() {
    if (UrlService.API_ENDPOINT_USER_DASHBOARD_MENU) {
        return UrlService.API_ENDPOINT_USER_DASHBOARD_MENU;
    }
    var base = (UrlService.BASE_URL || '').replace(/\/$/, '');
    return base + '/DashboardConfiguration';
}

function readUserMasterCode(obj) {
    if (!obj || typeof obj !== 'object') return '';
    var code = obj.UserMaster_Code != null ? obj.UserMaster_Code
        : (obj.userMaster_Code != null ? obj.userMaster_Code
            : (obj.UserMasterCode != null ? obj.UserMasterCode
                : (obj.Code != null ? obj.Code : '')));
    code = code != null ? String(code).trim() : '';
    return code && code !== '0' ? code : '';
}

const UserDashboardMenuService = {
    /** Always the logged-in user's UserMaster_Code from session. */
    GetLoggedInUserMasterCode: function GetLoggedInUserMasterCode() {
        try {
            var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
            var fromAuth = readUserMasterCode(auth);
            if (fromAuth) return fromAuth;
        } catch (e) { /* ignore */ }

        try {
            var userDetails = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
            if (Array.isArray(userDetails) && userDetails.length) {
                var fromDetails = readUserMasterCode(userDetails[0]);
                if (fromDetails) return fromDetails;
            }
        } catch (e) { /* ignore */ }

        return '';
    },

    /** Dashboards assigned to the logged-in user only. */
    GetUserDashboardDetails: function GetUserDashboardDetails(userMasterCode) {
        var code = UserDashboardMenuService.GetLoggedInUserMasterCode() || userMasterCode || '';
        const URL =
            dashboardConfigurationApiBase() +
            '/GetUserDashboardList?UserMaster_Code=' +
            encodeURIComponent(code || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /**
     * Tiles this user must not see on a dashboard (Not Applicable).
     * Always uses the logged-in UserMaster_Code.
     */
    GetUserDashboardConfiguration: function GetUserDashboardConfiguration(dashboardMasterCode, userMasterCode) {
        var userCode = UserDashboardMenuService.GetLoggedInUserMasterCode() || userMasterCode || '';
        const URL =
            dashboardConfigurationApiBase() +
            '/GetUserDashboardConfiguration?DashboardMaster_Code=' +
            encodeURIComponent(dashboardMasterCode || 0) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },
};

export { UserDashboardMenuService };
