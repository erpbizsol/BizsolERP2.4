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
    SaleOrdersApprovedBYOTP: function SaleOrdersApprovedBYOTP(BuyerPOMaster_Code,OTP) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SaleOrdersApprovedBYOTP?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&OTP=" + OTP;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaleOrdersCreditLimitReports: function SaleOrdersCreditLimitReports(BuyerPOMaster_Code) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SaleOrdersCreditLimitReports?BuyerPOMaster_Code=" + BuyerPOMaster_Code ;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SendVerifyOrApproveNotificationToSenior: function SendVerifyOrApproveNotificationToSenior(BuyerPOMaster_Code) {
        var url = UrlService.API_ENDPOINT_SaleOrderApproval + "/SendVerifyOrApproveNotificationToSenior?BuyerPOMaster_Code=" + BuyerPOMaster_Code ;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { SaleOrderApprovalService }