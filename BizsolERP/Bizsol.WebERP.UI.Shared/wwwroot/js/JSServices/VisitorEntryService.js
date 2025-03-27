import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const VisitorEntryService = {
    VisitorMaster: function VisitorMaster() {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/VisitorMaster";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VisitorMasterShowCheckOut: function VisitorMasterShowCheckOut(CheckOutDate) {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/VisitorMasterShowCheckOut?CheckOutDate=" + CheckOutDate + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VisitorMasterShowAll: function VisitorMasterShowAll(CheckOutDate) {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/VisitorMasterShowAll?CheckOutDate=" + CheckOutDate + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ShowExistVisitOrderDetails: function ShowExistVisitOrderDetails(DMS_DBName) {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/ShowExistVisitOrderDetails?DMS_DBName=" + DMS_DBName + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PrintRPT: function PrintRPT(Code) {
        var URL = `${UrlService.API_ENDPOINT_CRYSTAL}/PrintVisitorEntryRPT?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPersonToMeet: function GetPersonToMeet() {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/GetPersonToMeet";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VisitorMasterShowData: function VisitorMasterShowData() {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/VisitorMasterShowData";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveVisitorEntry: function SaveVisitorEntry(Data) {
        var URL = UrlService.API_ENDPOINT_VisitorMaster + "/SaveVisitorEntry";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
}

export { VisitorEntryService }