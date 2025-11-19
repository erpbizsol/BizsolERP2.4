import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const DesignationMasterService = {
    GetDesignationMasterList: function GetDesignationMasterList(Status) {
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/GetDesignationMasterList?Status=" + Status + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetDesignationMasterByCode: function GetDesignationMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/GetDesignationMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveDesignationMaster: function SaveDesignationMaster(Data) {
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/SaveDesignationMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteDesignationMaster: function DeleteDesignationMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/DeleteDesignationMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDesignationTypeList: function GetDesignationTypeList() {
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/GetDesignationTypeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckDependencyDesignation: function CheckDependencyDesignation(Code) {
        var URL = UrlService.API_ENDPOINT_DesignationMaster + "/CheckDependencyDesignation?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { DesignationMasterService }