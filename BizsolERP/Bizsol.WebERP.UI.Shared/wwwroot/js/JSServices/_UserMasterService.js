import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';



const UserMasterService = {

    GetUserMasterList: function (UserMaster_Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var userMasterCode = authKeyData.UserMaster_Code || 0;
       
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GetUserMasterList?UserMaster_Code=' + encodeURIComponent(userMasterCode);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },
    GetUserMasterByCode: function (code) {
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GetUserMasterByCode?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },
    SaveUserMaster: function (data) {
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/SaveUserMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data));
    },
    DeleteUserMaster: function (Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var userMasterCode = authKeyData.UserMaster_Code || 0;
        var URL = UrlService.API_ENDPOINT_USERMASTER +
            '/DeleteUserMaster?Code=' + Code +
            '&UserMaster_Code=' + userMasterCode +
            '&ReasonForDelete=' + encodeURIComponent(ReasonForDelete || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '');
    },
    GetGroupMasterList: function () {
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GetGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },
    GetCompanyMasterList: function () {
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GetCompanyMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },
    GetSubProjectMasterList: function (CompanyCode) {
        var code = encodeURIComponent(CompanyCode == null ? '' : String(CompanyCode));
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GetSubProjectMasterList?CompanyCode=' + code;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },
    GetDashboardList: function () {
        var URL = UrlService.API_ENDPOINT_USERMASTER + '/GETDASHBOARDLIST';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

};

export { UserMasterService };
