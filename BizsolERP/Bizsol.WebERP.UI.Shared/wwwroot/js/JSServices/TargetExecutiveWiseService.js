import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getTargetExecutiveWiseApiBase() {
    if (UrlService.API_ENDPOINT_TargetExecutiveWise) {
        return UrlService.API_ENDPOINT_TargetExecutiveWise;
    }
    const base = (UrlService.BASE_URL || '').replace(/\/+$/, '');
    return base + '/TargetExecutiveWise';
}

const TargetExecutiveWiseService = {
    Locate: function Locate(marketingManMaster_Code, finYear, monthNumber, code) {
        const URL =
            getTargetExecutiveWiseApiBase() +
            '/Locate?code=' + encodeURIComponent(code || 0) +
            '&marketingManMaster_Code=' + encodeURIComponent(marketingManMaster_Code || 0) +
            '&finYear=' + encodeURIComponent(finYear || '') +
            '&monthNumber=' + encodeURIComponent(monthNumber || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    Save: function Save(data) {
        const URL = getTargetExecutiveWiseApiBase() + '/Save';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    Edit: function Edit(data) {
        const URL = getTargetExecutiveWiseApiBase() + '/Edit';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    Delete: function Delete(code, reason) {
        const userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const URL =
            getTargetExecutiveWiseApiBase() +
            '/Delete?code=' + encodeURIComponent(code) +
            '&userMaster_Code=' + encodeURIComponent(userCode) +
            '&reasonForDelete=' + encodeURIComponent(reason || '') +
            '&ipAddress=1&location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        const userMasterCode = authKeyData.UserMaster_Code;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetNestedMarketingManList?UserMaster_Code=' +
            encodeURIComponent(userMasterCode) +
            '&MarketingManMaster_Code=0';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { TargetExecutiveWiseService };
