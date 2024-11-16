import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QuotationApprovalService = {
    GetUnApprovedQuotation: function GetUnApprovedQuotation() {
        var url = UrlService.API_ENDPOINT_QuotationApproval + "/GetUnApprovedQuotation";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetQuotationDetail: function GetQuotationDetail(QuotationMaster_Code) {
        var url = UrlService.API_ENDPOINT_QuotationApproval + "/GetQuotationDetail?QuotationMaster_Code=" + QuotationMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    QuotationApproved: function QuotationApproved(QuotationMaster_Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_QuotationApproval + "/QuotationApproved?QuotationMaster_Code=" + QuotationMaster_Code + "&UserMaster_Code" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { QuotationApprovalService }