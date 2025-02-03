import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SaleOrderApprovalService = {
    GetUnApprovedSaleOrders: function GetUnApprovedSaleOrders(QueryCondition) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/GetUnApprovedSaleOrders?QueryCondition=" + QueryCondition;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSaleOrderDetail: function GetSaleOrderDetail(BuyerPOMaster_Code) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/GetSaleOrderDetail?BuyerPOMaster_Code=" + BuyerPOMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    SaleOrderApproved: function SaleOrderApproved(BuyerPOMaster_Code, QueryCondition, FrmType) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SaleOrderApproved?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&UserMaster_Code=" + userCode + "&QueryCondition=" + QueryCondition + "&FrmType=" + FrmType;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { SaleOrderApprovalService }