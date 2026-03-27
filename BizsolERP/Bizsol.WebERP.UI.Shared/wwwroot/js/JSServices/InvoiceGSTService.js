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
    GetInvoiceGSTConsigneeList: function GetInvoiceGSTConsigneeList() {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GetInvoiceGSTConsigneeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GETDropdownSaleType: function GETDropdownSaleType() {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GETDropdownSaleType";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GETDropdownSubSaleType: function GETDropdownSubSaleType() {
        var URL = UrlService.API_ENDPOINT_InvoiceGST + "/GETDropdownSubSaleType";
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
}

export { InvoiceGSTService }
