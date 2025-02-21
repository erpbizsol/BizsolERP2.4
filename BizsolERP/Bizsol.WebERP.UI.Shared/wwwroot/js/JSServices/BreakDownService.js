import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BreakDownService = {
    StartOrEndSummary: function StartOrEndSummary() {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/StartOrEndSummary";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EndBreakDown: function EndBreakDown(PvcProductionMaster_Code) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/EndBreakDown?PvcProductionMaster_Code=" + PvcProductionMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDDlBreakDown: function GetDDlBreakDown(Mode) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/GetDDlBreakDown?Mode="+Mode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    
}
export { BreakDownService }