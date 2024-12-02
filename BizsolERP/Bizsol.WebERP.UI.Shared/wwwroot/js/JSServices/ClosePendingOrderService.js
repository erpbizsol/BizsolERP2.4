import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ClosePendingOrderService = {

    GetFilterForCancelPendingOrder: function GetFilterForCancelPendingOrder() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CANCELPENDINGORDER + `/GetFilterForCancelPendingOrder?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    
    GetCancelPendingOrderList: function GetCancelPendingOrderList(fromDate, toDate, salesperson, partyName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = `${UrlService.API_ENDPOINT_CANCELPENDINGORDER}/GetCancelPendingOrderList` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&SalesPerson=${encodeURIComponent(salesperson)}` +
            `&PartyName=${encodeURIComponent(partyName)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    }


}
export { ClosePendingOrderService }