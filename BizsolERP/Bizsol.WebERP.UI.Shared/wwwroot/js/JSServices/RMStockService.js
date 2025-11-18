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
    EditRMStockData: function EditRMStockData(Code, SNo) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/EditRMStockData?Code=" + Code + "&SNo=" + SNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CopyFromPreviousRMStockData: function CopyFromPreviousRMStockData(IdentificationNo) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/CopyFromPreviousRMStockData?IdentificationNo=" + IdentificationNo;
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
    GetRMStockMachineNo: function GetRMStockMachineNo() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockMachineNo";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockNumericValueWidth: function GetRMStockNumericValueWidth(Code) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockNumericValueWidth?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockUNAPPROVEDPLANNED: function GetRMStockUNAPPROVEDPLANNED() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockUNAPPROVEDPLANNED";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockDispatch: function GetRMStockDispatch(FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockDispatch?FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockSlitted: function GetRMStockSlitted(FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockSlitted?FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockJobWorkData: function GetRMStockJobWorkData(FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockJobWorkData?FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMStockSummaryData: function GetRMStockSummaryData() {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetRMStockSummaryData";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSlittedCoilStockData: function GetSlittedCoilStockData(FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/GetSlittedCoilStockData?FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifySlittingPlan: function VerifySlittingPlan(Code, Level) {
        var URL = UrlService.API_ENDPOINT_RMStock + "/VerifySlittingPlan?Code=" + encodeURIComponent(Code) + "&VerifyLevel=" + encodeURIComponent(Level);
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    
}

export { RMStockService }
