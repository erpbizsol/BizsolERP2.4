import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const POApprovalService = {
    GetUnApprovedPO: function GetUnApprovedPO() {
        var URL = UrlService.API_ENDPOINT_POApproval + "/GetUnApprovedPO";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
GetPODetail: function GetPODetail(PurchaseOrderMaster_Code) {
    var URL = UrlService.API_ENDPOINT_POApproval + "/GetPODetail?PurchaseOrderMaster_Code=" + PurchaseOrderMaster_Code;
    return this._http.post(URL, {}, { headers: this.headers() });
},
GetPOHistory: function GetPOHistory(ItemMaster_Code, Itemsizemaster_Code) {
    var URL = UrlService.API_ENDPOINT_POApproval + "/GetPOHistory?ItemMaster_Code=" + ItemMaster_Code + "&Itemsizemaster_Code=" + Itemsizemaster_Code;

    return this._http.post(URL, {}, { headers: this.headers() });
},
POApproved: function POApproved(PurchaseOrderMaster_Code) {

    var URL = UrlService.API_ENDPOINT_POApproval + "/POApproved?PurchaseOrderMaster_Code=" + PurchaseOrderMaster_Code + "&UserMaster_Code" + UserMaster_Code;
    return this._http.post(URL, {}, { headers: this.headers() });
},
GetPOIndentPriceComparisonDetails: function GetPOIndentPriceComparisonDetails(IndentMaster_Code) {
    var URL = UrlService.API_ENDPOINT_POApproval + "/GetPOIndentPriceComparisonDetails?IndentMaster_Code=" + IndentMaster_Code;
    return this._http.post(URL, {}, { headers: this.headers() });
},
GeneratePasswords: function GeneratePasswords(Mode, NoOfPwd, FromDate, ToDate, UsedForFillter) {
    var URL = UrlService.API_ENDPOINT_POApproval + "/GeneratePasswords?Mode==" + Mode +"'" + "&NoOfPwd=" + NoOfPwd + "&UserMaster_Code=" + UserMaster_Code + "&FromDate='" + FromDate +"'" + "&ToDate='" + ToDate +"'" + "&UsedForFillter='" + UsedForFillter +"'";
    return this._http.post(URL, {}, { headers: this.headers() });
},
}
export { POApprovalService }