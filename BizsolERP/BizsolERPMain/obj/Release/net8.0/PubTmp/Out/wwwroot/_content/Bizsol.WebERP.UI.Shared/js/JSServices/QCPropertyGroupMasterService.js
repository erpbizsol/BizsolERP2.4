import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QCPropertyGroupMasterService = {
    QCPropertyGroupMasterList: function QCPropertyGroupMasterList() {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/GetQCPropertyGroupMasterList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
   
    GetQCPropertyGroupMasterByCode: function GetQCPropertyGroupMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/GetQCPropertyGroupMasterByCode?Code="+Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveQCPropertyGroupMaster: function SaveQCPropertyGroupMaster(Data) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/SaveQCPropertyGroupMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteQCPropertyGroupMaster: function DeleteQCPropertyGroupMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/DeleteQCPropertyGroupMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete +"" +"&IPAddress="+"1"+"&Location="+"1";
        return promiseAjaxCallApi.CallAPI('POST', URL,"").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyQCPropertyGroupMaster: function VerifyQCPropertyGroupMaster(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/VerifyQCPropertyGroupMaster?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { QCPropertyGroupMasterService }