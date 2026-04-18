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

const CityMasterService = {
    GetStateList: function GetStateList(CountryName) {
        const c = CountryName != null && String(CountryName).trim() !== '' ? String(CountryName).trim() : 'ALL';
        const URL =
            UrlService.API_ENDPOINT_STATE +
            `/GetStateList?CountryName=${encodeURIComponent(c)}&UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetCityList: function GetCityList(CountryName, StateName) {
        const URL =
            UrlService.API_ENDPOINT_CITY +
            `/GetCityList?CountryName=${encodeURIComponent(CountryName || '')}&StateName=${encodeURIComponent(StateName || 'ALL')}&UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Same route style as UOM: GET {base}/City/{code} — avoids /City/GetCityMasterByCode being parsed as {Code}=GetCityMasterByCode. */
    GetCityMasterByCode: function GetCityMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_CITY + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveCityMaster: function SaveCityMaster(data) {
        const URL = UrlService.API_ENDPOINT_CITY + '/SaveCityMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteCityMaster: function DeleteCityMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_CITY +
            '/DeleteCityMaster?Code=' +
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

export { CityMasterService };
