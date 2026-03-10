import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BOMService = {
    GetBOMList: function GetBOMList() {
        var URL = UrlService.API_ENDPOINT_BOM + "/GetBOMList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCategoryList: function GetCategoryList() {
        var URL = UrlService.API_ENDPOINT_BOM + "/GetCategoryList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetWorkTypeList: function GetWorkTypeList() {
        var URL = UrlService.API_ENDPOINT_BOM + "/GetWorkTypeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemMasterList: function GetItemMasterList(WorkType) {
        var URL = UrlService.API_ENDPOINT_BOM + "/GetItemMasterList?WorkType=" + WorkType;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    SaveBOMRow: function SaveBOMRow(data) {
        var URL = UrlService.API_ENDPOINT_BOM + "/SaveBOM";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },

    VerifyBOMRow: function VerifyBOMRow(data) {
        var URL = UrlService.API_ENDPOINT_BOM + "/VerifyBOMRow";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },

    DeleteBOM: function DeleteBOM(code, reason) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BOM + "/DeleteBOM?Code=" + code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + encodeURIComponent(reason || '') + "&IPAddress=1&Location=1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) {
            return value;
        });
    },
}

export { BOMService }