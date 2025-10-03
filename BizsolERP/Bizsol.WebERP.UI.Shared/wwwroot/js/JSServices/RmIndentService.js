import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RmIndentService = {
    GetRmIndentList: function GetRmIndentList(Status, DateType, FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetRmIndentList?Status=" + Status + "&DateType=" + DateType + "&FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRmIndentStatusType: function GetRmIndentStatusType() {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetRmIndentStatusType";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetVendorList: function GetVendorList() {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetVendorList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveIndentPriceComparison: function SaveIndentPriceComparison(data) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/SaveIndentPriceComparison";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    UpdateStatus_IndentMaster: function UpdateStatus_IndentMaster(Code, Status) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/UpdateStatus_IndentMaster?Code="+Code+"&Status="+Status;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
}

export { RmIndentService }
