import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BOMService = {
    GetBOMList: function GetBOMList() {
        const URL = UrlService.API_ENDPOINT_BOM + "/GetBOMList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },

    GetBOMByCode: function GetBOMByCode(code, subProjectMaster_Code) {
        const URL = UrlService.API_ENDPOINT_BOM + "/GetBOMByCode?Code=" + (code || 0)
                  + "&SubProjectMaster_Code=" + (subProjectMaster_Code || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },

    GetCategoryList: function GetCategoryList() {
        const URL = UrlService.API_ENDPOINT_BOM + "/GetCategoryList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },

    GetWorkTypeList: function GetWorkTypeList() {
        const URL = UrlService.API_ENDPOINT_BOM + "/GetWorkTypeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },

    GetItemMasterList: function GetItemMasterList(WorkType) {
        const URL = UrlService.API_ENDPOINT_BOM + "/GetItemMasterList?WorkType=" + encodeURIComponent(WorkType || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },

    SaveBOM: function SaveBOM(payload) {
        const URL = UrlService.API_ENDPOINT_BOM + "/SaveBOM";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    },

    VerifyBOM: function VerifyBOM(code) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKey.UserMaster_Code || 0;
        const URL = UrlService.API_ENDPOINT_BOM + "/VerifyBOM?Code=" + (code || 0) + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) {
            return value;
        });
    },

    DeleteBOM: function DeleteBOM(code, reason) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKey.UserMaster_Code || 0;
        const URL = UrlService.API_ENDPOINT_BOM + "/DeleteBOM?Code=" + (code || 0) + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + encodeURIComponent(reason || '') + "&IPAddress=1&Location=1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) {
            return value;
        });
    }
};

export { BOMService };
