import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const UserRightDashboardService = {

    // ── Dropdowns ─────────────────────────────────────────────────────
    GetCompanyMasterList: function () {
        var URL = UrlService.API_ENDPOINT_USERRIGHTDASHBOARD + '/GetCompanyMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetGroupMasterList: function () {
        var URL = UrlService.API_ENDPOINT_USERRIGHTDASHBOARD + '/GetGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /**
     * Users for selected group(s). Comma-separated codes; empty = all active users.
     * Uses quiet AJAX — never shows global toastr (optional preview panel).
     */
    GetGroupUserList: function (groupMasterCodes) {
        var codes = (groupMasterCodes === undefined || groupMasterCodes === null)
            ? ''
            : String(groupMasterCodes).trim();
        var URL = UrlService.API_ENDPOINT_USERRIGHTDASHBOARD +
            '/GetGroupUserList?GroupMaster_Codes=' + encodeURIComponent(codes);
        return $.ajax({
            url: URL,
            method: 'GET',
            contentType: 'application/json',
            dataType: 'json'
        });
    },

    GetUserRightDashboard: function (CompanyCode, GroupCode) {
        var URL = UrlService.API_ENDPOINT_USERRIGHTDASHBOARD +
            '/GetUserRightDashboard?CompanyCode=' + encodeURIComponent(CompanyCode) +
            '&GroupCode=' + encodeURIComponent(GroupCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    
    SaveUserModuleRight: function (data) {
        var URL = UrlService.API_ENDPOINT_USERRIGHTDASHBOARD + '/SaveUserModuleRight';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data));
    },

};

export { UserRightDashboardService };
