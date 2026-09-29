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

const CountryMasterService = {
    GetCountryMasterList: function GetCountryMasterList() {
        const Mode = 'LOCATE';
        const URL =
            UrlService.API_ENDPOINT_COUNTRY + `/GetCountryMasterList?Mode=${encodeURIComponent(Mode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetCountryMasterByCode: function GetCountryMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_COUNTRY + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveCountryMaster: function SaveCountryMaster(data) {
        const URL = UrlService.API_ENDPOINT_COUNTRY + '/SaveCountryMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteCountryMaster: function DeleteCountryMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_COUNTRY +
            '/DeleteCountryMaster?Code=' +
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

export { CountryMasterService };
