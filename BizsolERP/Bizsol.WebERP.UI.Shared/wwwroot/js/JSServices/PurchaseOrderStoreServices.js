import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PurchaseOrderStoreService = {

    GetPurchaseOrderStoreList: function GetPurchaseOrderStoreList(Status, FromDate, ToDate) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetPurchaseOrderStoreList?Status=${Status}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPurchaseOrderStoreById: function GetPurchaseOrderStoreById(code) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetPurchaseOrderStoreById?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPOStoreStatusList: function GetPOStoreStatusList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetPOStoreStatusList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetVendorList: function GetVendorList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetVendorList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetGodownList: function GetGodownList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetGodownList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetItemList: function GetItemList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetItemList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetUOMList: function GetUOMList() {
        let url = UrlService.API_ENDPOINT_UOM + `/GetUOMMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPaymentTermsList: function GetPaymentTermsList() {
        let url = UrlService.API_ENDPOINT_PAYMENT_TERMS_MASTER + `/GetPaymentTermsMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    SavePurchaseOrderStore: function SavePurchaseOrderStore(payload, Mode) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/SavePurchaseOrderStore?Mode=${Mode}`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },

    DeletePurchaseOrderStore: function DeletePurchaseOrderStore(code, UserMaster_Code, ReasonForDelete) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/DeletePurchaseOrderStore?Code=${code}&UserMaster_Code=${UserMaster_Code}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPendingPOStoreList: function GetPendingPOStoreList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderStore + `/GetPendingPOStoreList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    }

}

export { PurchaseOrderStoreService }
