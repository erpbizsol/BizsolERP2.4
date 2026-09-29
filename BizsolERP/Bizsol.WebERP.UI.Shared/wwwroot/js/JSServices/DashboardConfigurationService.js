import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function dashboardConfigurationApiBase() {
    if (UrlService.API_ENDPOINT_DASHBOARD_CONFIGURATION) {
        return UrlService.API_ENDPOINT_DASHBOARD_CONFIGURATION;
    }
    var base = (UrlService.BASE_URL || '').replace(/\/$/, '');
    return base + '/DashboardConfiguration';
}

const DashboardConfigurationService = {
    GetUserDetails: function GetUserDetails() {
        const URL = dashboardConfigurationApiBase() + '/GetUserDetails';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetDashboardDetails: function GetDashboardDetails() {
        const URL = dashboardConfigurationApiBase() + '/GetDashboardDetails';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetDashboardTileDetail: function GetDashboardTileDetail(webApiDashboardMasterCode, userMasterCode) {
        const URL =
            dashboardConfigurationApiBase() +
            '/GetDashboardTileDetail?WebApiDashboardMaster_Code=' +
            encodeURIComponent(webApiDashboardMasterCode || 0) +
            '&UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetUserDashboardConfig: function GetUserDashboardConfig(userMasterCode, webApiDashboardMasterCode) {
        const URL =
            dashboardConfigurationApiBase() +
            '/GetUserDashboardConfig?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&WebApiDashboardMaster_Code=' +
            encodeURIComponent(webApiDashboardMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetUserDashboardDetails: function GetUserDashboardDetails(userMasterCode, webApiDashboardMasterCode) {
        var URL =
            dashboardConfigurationApiBase() +
            '/GetUserDashboardDetails?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&WebApiDashboardMaster_Code=' +
            encodeURIComponent(webApiDashboardMasterCode || 0) +
            '&Mode=' +
            encodeURIComponent('GET_USER_DASHBOARD_DETAILS');
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    SaveDashboardTileDetail: function SaveDashboardTileDetail(model) {
        const URL = dashboardConfigurationApiBase() + '/SaveDashboardTileDetail';
        var payload = model && typeof model === 'object' ? model : {};
        if (!Array.isArray(payload.DashboardTileDetail)) {
            payload.DashboardTileDetail = [];
        }
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload));
    },

    /** Un-assign a user from a dashboard (deletes UserWebApiDashboardDetails + NotApplicable). */
    ClearDashboardTileDetail: function ClearDashboardTileDetail(userMasterCode, webApiDashboardMasterCode) {
        const URL =
            dashboardConfigurationApiBase() +
            '/ClearDashboardTileDetail?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&WebApiDashboardMaster_Code=' +
            encodeURIComponent(webApiDashboardMasterCode || 0) +
            '&Mode=' +
            encodeURIComponent('CLEAR');
        return promiseAjaxCallApi.CallAPI('POST', URL, '', { suppressErrorToast: true });
    },
};

export { DashboardConfigurationService };
