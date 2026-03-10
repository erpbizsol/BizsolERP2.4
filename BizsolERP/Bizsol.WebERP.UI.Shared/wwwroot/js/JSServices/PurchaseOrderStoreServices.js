import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PurchaseOrderStoreService = {

    GetPurchaseOrderStoreList: function GetPurchaseOrderStoreList(Status, FromDate, ToDate) {
       // let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/GetPurchaseOrderMasterList?Status=${Status}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return PurchaseOrderStoreService.Getddl('LOCATE');
        
    },

    GetPurchaseOrderStoreById: function GetPurchaseOrderStoreById(code) {
        return PurchaseOrderStoreService.Getddl('SHOWDATA', code);
    },

    Getddl: function Getddl(Mode, Code = 0) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/Getddl?Mode=${Mode}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPOStoreStatusList: function GetPOStoreStatusList() {
        return PurchaseOrderStoreService.Getddl('POStoreStatusList');
    },

    GetVendorList: function GetVendorList() {
        return PurchaseOrderStoreService.Getddl('DDL_VENDORLIST');
    },

    GetGodownList: function GetGodownList() {
        return PurchaseOrderStoreService.Getddl('DDL_WORKTYPELIST');
    },

    GetWorkTypeList: function GetWorkTypeList() {
        return PurchaseOrderStoreService.Getddl('DDL_WORKTYPELIST');
    },

    GetItemList: function GetItemList() {
        return PurchaseOrderStoreService.Getddl('DDL_ITEMLIST');
    },

    GetUOMList: function GetUOMList() {
        return PurchaseOrderStoreService.Getddl('DDL_UOMLIST');
    },

    GetPaymentTermsList: function GetPaymentTermsList() {
        return PurchaseOrderStoreService.Getddl('DDL_PAYMENTTREMSLIST');
    },

    GetProjectList: function GetProjectList() {
        return PurchaseOrderStoreService.Getddl('DDL_PROJECTLIST');
    },

    GetSubProjectList: function GetSubProjectList(projectCode) {
        return PurchaseOrderStoreService.Getddl('DDL_SUBPROJECTLIST', projectCode);
    },

    SavePurchaseOrderStore: function SavePurchaseOrderStore(payload) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/SavePurchaseOrder`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },

    DeletePurchaseOrderStore: function DeletePurchaseOrderStore(code, UserMaster_Code, ReasonForDelete) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/DeletePurchaseOrder?Code=${code}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPendingPOStoreList: function GetPendingPOStoreList() {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/GetPendingPOStoreList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    }

}

export { PurchaseOrderStoreService }
