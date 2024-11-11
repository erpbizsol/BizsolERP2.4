import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QuotationApprovalService = {
    GetUnApprovedQuotation: function GetUnApprovedQuotation() {
        var URL = UrlService.API_ENDPOINT_QuotationApproval + "/GetUnApprovedQuotation";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
GetQuotationDetail: function GetQuotationDetail(QuotationMaster_Code) {
    var URL = UrlService.API_ENDPOINT_QuotationApproval + "/GetQuotationDetail?QuotationMaster_Code=" + QuotationMaster_Code;
return this._http.post(url, {}, { headers: this.headers() });
},
QuotationApproved: function QuotationApproved(QuotationMaster_Code) {
    var URL = UrlService.API_ENDPOINT_QuotationApproval + "/QuotationApproved?QuotationMaster_Code=" + QuotationMaster_Code + "&UserMaster_Code=" + UserMaster_Code;

    return this._http.post(url, {}, { headers: this.headers() });
},
}
export { QuotationApprovalService }