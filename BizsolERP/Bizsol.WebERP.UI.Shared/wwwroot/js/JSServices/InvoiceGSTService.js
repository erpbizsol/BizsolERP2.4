import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const InvoiceGSTService = {
    GetInvoiceGSTCurrentList: function GetInvoiceGSTCurrentList() {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GetInvoiceGSTCurrentList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetInvoiceGSTOrderList: function GetInvoiceGSTOrderList() {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GetInvoiceGSTOrderList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetInvoiceGSTEditList: function GetInvoiceGSTEditList(Code) {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GetInvoiceGSTEditList?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveInvoiceGSTData: function SaveInvoiceGSTData(data) {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/SaveInvoiceGSTData";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    GetInvoiceGSTImage: function GetInvoiceGSTImage(code) {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GetInvoiceGSTImage?code=" + code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { InvoiceGSTService }
