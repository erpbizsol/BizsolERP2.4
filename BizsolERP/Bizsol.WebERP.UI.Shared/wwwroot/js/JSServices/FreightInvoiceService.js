import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const FreightInvoiceService = {
    GetFreightInvoiceList: function GetFreightInvoiceList(fromDate, toDate, searchText, accountMasterCode, billTypeCode) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetFreightInvoiceList?FromDate=' + fromDate + '&ToDate=' + toDate + '&SearchText=' + encodeURIComponent(searchText || '') + '&AccountMaster_Code=' + (accountMasterCode || 0) + '&BillTypeCode=' + (billTypeCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetSavedFreightInvoiceList: function GetSavedFreightInvoiceList(fromDate, toDate, searchText) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetSavedFreightInvoiceList?FromDate=' + (fromDate || '') + '&ToDate=' + (toDate || '') + '&SearchText=' + encodeURIComponent(searchText || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetSavedFreightInvoiceByCode: function GetSavedFreightInvoiceByCode(code) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetSavedFreightInvoiceByCode?Code=' + (code || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetTransporterList: function GetTransporterList() {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetTransporterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetBillTypeList: function GetBillTypeList() {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetBillTypeList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetFreightInvoiceByCode: function GetFreightInvoiceByCode(code) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/GetFreightInvoiceByCode?Code=' + code;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveFreightInvoice: function SaveFreightInvoice(payload) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/SaveFreightInvoice';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    },
    VerifyFreightInvoice: function VerifyFreightInvoice(code) {
        var URL = UrlService.API_ENDPOINT_FreightInvoice + '/VerifyFreightInvoice?Code=' + (code || 0);
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    }
};

export { FreightInvoiceService };
