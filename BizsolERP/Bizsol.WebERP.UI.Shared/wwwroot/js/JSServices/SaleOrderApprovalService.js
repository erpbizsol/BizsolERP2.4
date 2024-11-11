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
       /* return this._http.post(url, {}, { headers: this.headers() });*/
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    SaleOrderApproved: function SaleOrderApproved(BuyerPOMaster_Code) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SaleOrderApproved?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&UserMaster_Code=" + UserMaster_Code;

        return this._http.post(url, {}, { headers: this.headers() });
    },
}
export { SaleOrderApprovalService }