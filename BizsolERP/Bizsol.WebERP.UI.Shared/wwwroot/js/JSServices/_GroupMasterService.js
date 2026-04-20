import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const GroupMasterService = {

    GetGroupMasterList: function () {
        var URL = UrlService.API_ENDPOINT_GROUPMASTER + '/GetGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetGroupMasterByCode: function (code) {
        var URL = UrlService.API_ENDPOINT_GROUPMASTER + '/GetGroupMasterByCode?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    SaveGroupMaster: function (data) {
        var URL = UrlService.API_ENDPOINT_GROUPMASTER + '/SaveGroupMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data));
    },

    DeleteGroupMaster: function (Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var userMasterCode = authKeyData.UserMaster_Code || 0;
        var URL = UrlService.API_ENDPOINT_GROUPMASTER +
            '/DeleteGroupMaster?Code=' + Code +
            '&UserMaster_Code=' + userMasterCode +
            '&ReasonForDelete=' + encodeURIComponent(ReasonForDelete || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '');
    },
};

export { GroupMasterService };
