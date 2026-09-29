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

const StateMasterService = {
    GetStateMasterList: function GetStateMasterList(CountryName) {
        const URL =
            UrlService.API_ENDPOINT_STATE +
            `/GetStateList?CountryName=${encodeURIComponent(CountryName || 'All')}&UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetStateMasterByCode: function GetStateMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_STATE + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveStateMaster: function SaveStateMaster(data) {
        const URL = UrlService.API_ENDPOINT_STATE + '/SaveStateMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteStateMaster: function DeleteStateMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_STATE +
            '/DeleteStateMaster?Code=' +
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

export { StateMasterService };
