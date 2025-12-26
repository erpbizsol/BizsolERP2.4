import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QCPropertyMasterService = {
    GetQCPropertyGroupMasterForDropdown: function GetQCPropertyGroupMasterForDropdown() {
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/GetQCPropertyGroupMasterForDropdown";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    QCPropertyMasterList: function QCPropertyMasterList() {
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/GetQCPropertyMasterList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
   
    GetQCPropertyMasterByCode: function GetQCPropertyMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/GetQCPropertyMasterByCode?Code="+Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveQCPropertyMaster: function SaveQCPropertyMaster(Data) {
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/SaveQCPropertyMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteQCPropertyMaster: function DeleteQCPropertyMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/DeleteQCPropertyMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete +"" +"&IPAddress="+"1"+"&Location="+"1";
        return promiseAjaxCallApi.CallAPI('POST', URL,"").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyQCPropertyMaster: function VerifyQCPropertyMaster(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyMaster + "/VerifyQCPropertyMaster?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { QCPropertyMasterService }