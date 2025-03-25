import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const POApprovalService = {
    GetUnApprovedPO: function GetUnApprovedPO(QueryCondition, FrmType) {
        var URL = UrlService.API_ENDPOINT_POApproval + "/GetUnApprovedPO?QueryCondition=" + QueryCondition + "&FrmType=" + FrmType;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPODetail: function GetPODetail(PurchaseOrderMaster_Code) {
        var URL = UrlService.API_ENDPOINT_POApproval + "/GetPODetail?PurchaseOrderMaster_Code=" + PurchaseOrderMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPOHistory: function GetPOHistory(ItemMaster_Code, itemsizemaster_Code) {
        var URL = UrlService.API_ENDPOINT_POApproval + "/GetPOHistory?ItemMaster_Code=" + ItemMaster_Code + "&Itemsizemaster_Code=" + itemsizemaster_Code;

        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    POApproved: function POApproved(PurchaseOrderMaster_Code, QueryCondition, FrmType) {
    let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_POApproval + "/POApproved?PurchaseOrderMaster_Code=" + PurchaseOrderMaster_Code + "&UserMaster_Code=" + userCode + "&QueryCondition=" + QueryCondition + "&FrmType=" + FrmType;
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
        );
    },
GetPOIndentPriceComparisonDetails: function GetPOIndentPriceComparisonDetails(IndentMaster_Code) {
    var URL = UrlService.API_ENDPOINT_POApproval + "/GetPOIndentPriceComparisonDetails?IndentMaster_Code=" + IndentMaster_Code;
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
        );
    },
    GeneratePasswords: function GeneratePasswords(Mode, NoOfPwd, FromDate, ToDate, UsedForFillter) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_POApproval + "/GeneratePasswords?Mode==" + Mode + "'" + "&NoOfPwd=" + NoOfPwd + "&UserMaster_Code=" + userCode + "&FromDate='" + FromDate +"'" + "&ToDate='" + ToDate +"'" + "&UsedForFillter='" + UsedForFillter +"'";
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
        );
    },
    GetPODeliveryTermsDetail: function GetPODeliveryTermsDetail(PurchaseOrderMaster_Code) {
        var URL = UrlService.API_ENDPOINT_POApproval + "/GetPODeliveryTermsDetail?PurchaseOrderMaster_Code=" + PurchaseOrderMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { POApprovalService }