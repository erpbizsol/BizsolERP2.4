import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const UOMMasterService = {
    GetUOMMasterList: function GetUOMMasterList() {
        const URL = UrlService.API_ENDPOINT_UOM + '/GetUOMMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetUOMMasterByCode: function GetUOMMasterByCode(code) {
        const URL =UrlService.API_ENDPOINT_UOM +'/' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveUOMMaster: function SaveUOMMaster(data) {
        const URL = UrlService.API_ENDPOINT_UOM + '/SaveUOMMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteUOMMaster: function DeleteUOMMaster(code, reason) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKeyData.UserMaster_Code || 0;
        const URL = UrlService.API_ENDPOINT_UOM +'/DeleteUOMMaster?Code=' +encodeURIComponent(code) +'&UserMaster_Code=' +
            encodeURIComponent(userCode) +'&ReasonForDelete=' +encodeURIComponent(reason || '') +'&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
    GetGSTUOMDropDown: function GetGSTUOMDropDown() {
        const URL = UrlService.API_ENDPOINT_UOM + '/GetGSTUOMDropDown';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { UOMMasterService };
