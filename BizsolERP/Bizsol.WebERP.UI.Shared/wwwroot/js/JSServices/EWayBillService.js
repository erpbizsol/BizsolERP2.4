import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const EWayBillService = {
    GetEwayPendingDataForClosure: function GetEwayPendingDataForClosure(fromDate, toDate) {
        const URL =
            UrlService.API_ENDPOINT_EWayBill +
            '/GetEwayPendingDataForClosure?FromDate=' + encodeURIComponent(fromDate || '') +
            '&ToDate=' + encodeURIComponent(toDate || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    CloseEwayBill: function CloseEwayBill(EwayBillCloseRequest) {
        const rows = Array.isArray(EwayBillCloseRequest)
            ? EwayBillCloseRequest
            : (EwayBillCloseRequest ? [EwayBillCloseRequest] : []);
        const URL = UrlService.API_ENDPOINT_EWayBill + '/CloseEwayBill';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(rows)).then(function (value) {
            return value;
        });
    }
};

export { EWayBillService };
