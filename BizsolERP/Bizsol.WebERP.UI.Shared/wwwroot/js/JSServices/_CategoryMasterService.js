import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CategoryMasterService = {

    GetCategoryMasterList: function GetCategoryMasterList() {
        var URL = UrlService.API_ENDPOINT_CATEGORY + `/GetCategoryMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) { return value; });
    },

    GetCategoryMasterByCode: function GetCategoryMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_CATEGORY + `/` + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) { return value; });
    },

    SaveCategoryMaster: function SaveCategoryMaster(data) {
        var URL = UrlService.API_ENDPOINT_CATEGORY + `/SaveCategoryMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) { return value; });
    },

    DeleteCategoryMaster: function DeleteCategoryMaster(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CATEGORY +
            `/DeleteCategoryMaster?Code=${Code}&UserMaster_Code=${userMasterCode}` +
            `&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) { return value; });
    },
};

export { CategoryMasterService };
