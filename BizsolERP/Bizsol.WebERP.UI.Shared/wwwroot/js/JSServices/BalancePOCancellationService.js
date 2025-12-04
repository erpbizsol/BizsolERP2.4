import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BalancePOCancellationService = {
    SaveCancelPendingOrder: function SaveCancelPendingOrder(data) {
        var URL = UrlService.API_ENDPOINT_BalancePOCancellation + "/SaveCancelPendingOrder";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    GetThichnessList: function GetThichnessList() {
        var URL = UrlService.API_ENDPOINT_BalancePOCancellation + `/GetThichness`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSizeList: function GetSizeList() {
        var URL = UrlService.API_ENDPOINT_BalancePOCancellation + `/GetSize`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetGradeList: function GetGradeList() {
        var URL = UrlService.API_ENDPOINT_BalancePOCancellation + `/GetGrade`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetISCodeList: function GetISCodeList() {
        URL = UrlService.API_ENDPOINT_BalancePOCancellation + `/GetISCode`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { BalancePOCancellationService }