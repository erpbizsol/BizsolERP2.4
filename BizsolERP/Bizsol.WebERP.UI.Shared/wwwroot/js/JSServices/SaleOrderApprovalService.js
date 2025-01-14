import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SaleOrderApprovalService = {
    GetUnApprovedSaleOrders: function GetUnApprovedSaleOrders() {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/GetUnApprovedSaleOrders";
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

    SaleOrderApproved: function SaleOrderApproved(BuyerPOMaster_Code) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SaleOrderApproved?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { SaleOrderApprovalService }