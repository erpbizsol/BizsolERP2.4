import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * Marketing Man Master — API base: UrlService.API_ENDPOINT_SALESPERSON (/MarketingMan).
 * Align endpoint names with your WebAPI controller when wiring the backend.
 */
const MarketingManMasterService = {
    GetMarketingManMasterList: function GetMarketingManMasterList() {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/GetMarketingManMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetMarketingManMasterByCode: function GetMarketingManMasterByCode(code) {
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetMarketingManMasterByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveMarketingManMaster: function SaveMarketingManMaster(data) {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/SaveMarketingManMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteMarketingManMaster: function DeleteMarketingManMaster(code, reason) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKeyData.UserMaster_Code || 0;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/DeleteMarketingManMaster?Code=' +
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

export { MarketingManMasterService };
