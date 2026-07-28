import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const FMSReportService = {
    GetUnApprovedFMSReport: function GetUnApprovedFMSReport(QueryCondition, FrmType) {
        var URL = UrlService.API_ENDPOINT_FMSReport + "/GetUnApprovedFMSReport?QueryCondition=" + QueryCondition + "&FrmType=" + FrmType;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPOHistory: function GetPOHistory(ItemMaster_Code, Itemsizemaster_Code) {
        var URL = UrlService.API_ENDPOINT_FMSReport + "/GetPOHistory?ItemMaster_Code=" + ItemMaster_Code + "&Itemsizemaster_Code=" + (Itemsizemaster_Code || 0);
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    FMSReportApproved: function FMSReportApproved(Code, Status) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FMSReport + "/FMSReportApproved?Code=" + Code + "&UserMaster_Code=" + userCode + "&Status=" + Status;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
            );
        },
}
export { FMSReportService }