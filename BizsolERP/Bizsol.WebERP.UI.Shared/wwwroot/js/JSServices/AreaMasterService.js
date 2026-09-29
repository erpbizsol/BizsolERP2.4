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

const AreaMasterService = {
    GetAreaMasterList: function GetAreaMasterList() {
        const URL =
            UrlService.API_ENDPOINT_AREA_MASTER +
            `/GetAreaMasterList?UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetAreaMasterByCode: function GetAreaMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_AREA_MASTER + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveAreaMaster: function SaveAreaMaster(data) {
        const URL = UrlService.API_ENDPOINT_AREA_MASTER + '/SaveAreaMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteAreaMaster: function DeleteAreaMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_AREA_MASTER +
            '/DeleteAreaMaster?Code=' +
            encodeURIComponent(code) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode) +
            '&ReasonForDelete=' +
            encodeURIComponent(reason || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
};

export { AreaMasterService };
