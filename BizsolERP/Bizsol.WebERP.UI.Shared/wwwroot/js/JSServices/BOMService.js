import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BOMService = {
    GetBOMList: function GetBOMList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BOM + "/GetBOMList?UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    SaveBOMRow: function SaveBOMRow(data) {
        var URL = UrlService.API_ENDPOINT_BOM + "/SaveBOMRow";
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
}

export { BOMService }