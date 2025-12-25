import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QCPropertyTestTypeMasterService = {
    QCPropertyTestTypeMasterList: function QCPropertyTestTypeMasterList() {
        var URL = UrlService.API_ENDPOINT_QCPropertyTestTypeMaster + "/GetQCPropertyTestTypeMasterList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
   
    GetQCPropertyTestTypeMasterByCode: function GetQCPropertyTestTypeMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyTestTypeMaster + "/GetQCPropertyTestTypeMasterByCode?Code="+Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveQCPropertyTestTypeMaster: function SaveQCPropertyTestTypeMaster(Data) {
        var URL = UrlService.API_ENDPOINT_QCPropertyTestTypeMaster + "/SaveQCPropertyTestTypeMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteQCPropertyTestTypeMaster: function DeleteQCPropertyTestTypeMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_QCPropertyTestTypeMaster + "/DeleteQCPropertyTestTypeMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete +"" +"&IPAddress="+"1"+"&Location="+"1";
        return promiseAjaxCallApi.CallAPI('POST', URL,"").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyQCPropertyTestTypeMaster: function VerifyQCPropertyTestTypeMaster(Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyTestTypeMaster + "/VerifyQCPropertyTestTypeMaster?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { QCPropertyTestTypeMasterService }