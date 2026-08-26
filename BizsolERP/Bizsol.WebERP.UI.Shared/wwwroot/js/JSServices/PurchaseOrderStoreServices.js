import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PurchaseOrderStoreService = {

    GetPurchaseOrderStoreList: function GetPurchaseOrderStoreList(Status, FromDate, ToDate) {
       // let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/GetPurchaseOrderMasterList?Status=${Status}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return PurchaseOrderStoreService.Getddl('LOCATE', 0, Status, FromDate, ToDate);

    },

    GetPurchaseOrderStoreById: function GetPurchaseOrderStoreById(code) {
        return PurchaseOrderStoreService.Getddl('SHOWDATA', code);
    },

    Getddl: function Getddl(Mode, Code = 0, Status = null, FromDate = null, ToDate = null) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/Getddl?Mode=${encodeURIComponent(Mode)}`;
        // Always include Code (backend default is 0)
        url += `&Code=${encodeURIComponent(Code)}`;
        if (Status !== null && Status !== undefined && String(Status).length > 0) {
            url += `&Status=${encodeURIComponent(Status)}`;
        }
        if (FromDate !== null && FromDate !== undefined && String(FromDate).length > 0) {
            url += `&FromDate=${encodeURIComponent(FromDate)}`;
        }
        if (ToDate !== null && ToDate !== undefined && String(ToDate).length > 0) {
            url += `&ToDate=${encodeURIComponent(ToDate)}`;
        }
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetPOStoreStatusList: function GetPOStoreStatusList() {
        return PurchaseOrderStoreService.Getddl('DDL_POSTORESTATUSLIST');
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

    GetItemListWithoutProject: function GetItemListWithoutProject() {
        return PurchaseOrderStoreService.Getddl('DDL_WITHOUTPROJECTITEMLIST');
    },

    GetCompanyInfoList: function GetCompanyInfoList() {
        return PurchaseOrderStoreService.Getddl('DDL_COMPANYINFOLIST');
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
        return PurchaseOrderStoreService.Getddl('DDL_PENDINGPOONME');
    },

    GetPOApprovedList: function GetPOApprovedList() {
        return PurchaseOrderStoreService.Getddl('APPROVEDLIST');
    },

    GetBillToShipToList: function GetBillToShipToList() {
        return PurchaseOrderStoreService.Getddl('DDL_BILLTOSHIPTOADDRLIST');
    },

    GetSiteRepresentativeList: function GetSiteRepresentativeList() {
        return PurchaseOrderStoreService.Getddl('DDL_SITEREPRESENTATIVELIST');
    },

    SaveBillToShipToAddress: function SaveBillToShipToAddress(payload) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/SaveBillToShipToAddress`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) { return value; });
    },

    SaveSiteRepresentative: function SaveSiteRepresentative(payload) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/SaveSiteRepresentative`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) { return value; });
    },

    SavePaymentTerms: function SavePaymentTerms(payload) {

        let url = UrlService.API_ENDPOINT_PAYMENT_TERMS_MASTER + `/SavePaymentTermsMaster`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) { return value; });
    },

    CancelPurchaseOrderStore: function CancelPurchaseOrderStore(code, UserMaster_Code) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/CancelPurchaseOrder?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    UpdateMailSend: function UpdateMailSend(code) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster + `/UpdateMailSend?Code=${encodeURIComponent(code)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    GetPO_GRNDetails: function GetPO_GRNDetails(purchaseOrderMasterCode, itemMasterCode) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster +
            `/GetPO_GRNDetails?PurchaseOrderMaster_Code=${encodeURIComponent(purchaseOrderMasterCode || 0)}` +
            `&ItemMaster_Code=${encodeURIComponent(itemMasterCode || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    }

}

export { PurchaseOrderStoreService }
