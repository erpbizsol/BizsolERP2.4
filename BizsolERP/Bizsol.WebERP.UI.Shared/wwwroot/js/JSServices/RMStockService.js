import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RMStockService = {
    GetRMStockCurrentList: function GetRMStockCurrentList() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockCurrentList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockWidth: function GetRMStockWidth() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockWidth";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockItemName: function GetRMStockItemName() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockItemName";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockCalculateWidth: function GetRMStockCalculateWidth(IdentificationNo, Code) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockCalculateWidth?IdentificationNo=" + IdentificationNo + "&Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveRMStockData: function SaveRMStockData(data) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/SaveRMStockData";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    ShowRMStockData: function ShowRMStockData(IdentificationNo) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/ShowRMStockData?IdentificationNo=" + IdentificationNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteRMStockData: function DeleteRMStockData(Code, SlittingMasterCode, Reason, IPAddress, Location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RMStock + `/DeleteRMStockData?UserMaster_Code=${encodeURIComponent(userMasterCode)}&Code=${encodeURIComponent(Code)}&SlittingMasterCode=${encodeURIComponent(SlittingMasterCode)}&ReasonForDelete=${Reason}&IPAddress=${1}&Location=${1}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { RMStockService }
