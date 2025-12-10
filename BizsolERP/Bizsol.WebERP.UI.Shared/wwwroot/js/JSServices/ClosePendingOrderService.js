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
    
    GetCancelPendingOrderList: function GetCancelPendingOrderList(PeriodWise, fromDate, toDate, salesperson, partyName, OrderType, BuyerPONoFilter, ItemName, OrderNo) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        
        PeriodWise = PeriodWise != null && PeriodWise !== undefined ? PeriodWise : '';
        fromDate = fromDate != null && fromDate !== undefined ? fromDate : '';
        toDate = toDate != null && toDate !== undefined ? toDate : '';
        salesperson = salesperson != null && salesperson !== undefined ? salesperson : '';
        partyName = partyName != null && partyName !== undefined ? partyName : '';
        OrderType = OrderType != null && OrderType !== undefined ? OrderType : '';
        BuyerPONoFilter = BuyerPONoFilter != null && BuyerPONoFilter !== undefined ? BuyerPONoFilter : '';
        ItemName = ItemName != null && ItemName !== undefined ? ItemName : '';
        OrderNo = OrderNo != null && OrderNo !== undefined ? OrderNo : '';
        
        var URL = `${UrlService.API_ENDPOINT_CANCELPENDINGORDER}/GetCancelPendingOrderList` +
            `?PeriodWise=${encodeURIComponent(PeriodWise)}` +
            `&FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&SalesPerson=${encodeURIComponent(salesperson)}` +
            `&PartyName=${encodeURIComponent(partyName)}` +
            `&OrderNo=${encodeURIComponent(OrderNo)}` +
            `&ItemName=${encodeURIComponent(ItemName)}` +
            `&BuyerPONoFilter=${encodeURIComponent(BuyerPONoFilter)}` +
            `&OrderType=${encodeURIComponent(OrderType)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveCancelPendingOrder: function SaveCancelPendingOrder(data) {
        var URL = UrlService.API_ENDPOINT_CANCELPENDINGORDER + "/SaveCancelPendingOrder";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },

}
export { ClosePendingOrderService }