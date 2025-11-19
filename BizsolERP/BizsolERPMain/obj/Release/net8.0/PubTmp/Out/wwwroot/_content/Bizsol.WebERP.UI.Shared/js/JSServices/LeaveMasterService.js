import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const LeaveMasterService = {
    GetLeaveMasterList: function GetLeaveMasterList() {
        var URL = UrlService.API_ENDPOINT_LeaveMaster + "/GetLeaveMasterList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetLeaveMasterByCode: function GetLeaveMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_LeaveMaster + "/GetLeaveMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveLeaveMaster: function SaveLeaveMaster(Data) {
        var URL = UrlService.API_ENDPOINT_LeaveMaster + "/SaveLeaveMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteLeaveMaster: function DeleteLeaveMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_LeaveMaster + "/DeleteLeaveMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

}

export { LeaveMasterService }