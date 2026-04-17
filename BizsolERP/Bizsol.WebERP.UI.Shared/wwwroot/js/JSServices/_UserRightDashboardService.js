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
