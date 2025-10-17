import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PDIService = {
    GetPDIList: function GetPDIList() {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDIList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SavePDIData: function SavePDIData(data) {
        var URL = UrlService.API_ENDPOINT_PDI + "/SavePDIData";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    ShowPDIData: function ShowPDIData(IdentificationNo) {
        var URL = UrlService.API_ENDPOINT_PDI + "/ShowPDIData?IdentificationNo=" + IdentificationNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EditPDIData: function EditPDIData(Code, SNo) {
        var URL = UrlService.API_ENDPOINT_PDI + "/EditPDIData?Code=" + Code + "&SNo=" + SNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeletePDIData: function DeletePDIData(Code, SlittingMasterCode, Reason, IPAddress, Location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_PDI + `/DeletePDIData?UserMaster_Code=${encodeURIComponent(userMasterCode)}&Code=${encodeURIComponent(Code)}&SlittingMasterCode=${encodeURIComponent(SlittingMasterCode)}&ReasonForDelete=${Reason}&IPAddress=${1}&Location=${1}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { PDIService }
