import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const EmployeeDeductionMasterService = {
    GetDeductionMasterList: function GetDeductionMasterList() {
        var URL = UrlService.API_ENDPOINT_DeductionMaster + "/GetDeductionMasterList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetDeductionMasterByCode: function GetDeductionMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_DeductionMaster + "/GetDeductionMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveDeductionMaster: function SaveDeductionMaster(Data) {
        var URL = UrlService.API_ENDPOINT_DeductionMaster + "/SaveDeductionMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteDeductionMaster: function DeleteDeductionMaster(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DeductionMaster + "/DeleteDeductionMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

}

export { EmployeeDeductionMasterService }