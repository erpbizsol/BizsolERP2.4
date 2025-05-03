import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const AllowanceMasterService = {
    AllowanceMasterList: function AllowanceMasterList(Status) {
        var URL = UrlService.API_ENDPOINT_AllowanceMaster + "/GetAllowanceMasterList?Status=" + Status +"";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
   
    GetAllowanceMasterByCode: function GetAllowanceMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_AllowanceMaster + "/GetAllowanceMasterByCode?Code="+Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveAllowanceMaster: function SaveAllowanceMaster(Data) {
        var URL = UrlService.API_ENDPOINT_AllowanceMaster + "/SaveAllowanceMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteAllowanceMaster: function DeleteAllowanceMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AllowanceMaster + "/DeleteAllowanceMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete +"" +"&IPAddress="+"1"+"&Location="+"1";
        return promiseAjaxCallApi.CallAPI('POST', URL,"").then(
            function (value) {
                return value;
            }
        );
    },
}

export { AllowanceMasterService }