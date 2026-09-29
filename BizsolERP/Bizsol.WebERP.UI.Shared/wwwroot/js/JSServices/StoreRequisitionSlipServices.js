import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StoreRequisitionSlipService = {

    GetStoreRequisitionList: function GetStoreRequisitionList(Status, FromDate, ToDate) {
        return StoreRequisitionSlipService.Getddl('LOCATE', 0, Status, FromDate, ToDate);
    },

    GetStoreRequisitionById: function GetStoreRequisitionById(code) {
        return StoreRequisitionSlipService.Getddl('SHOWDATA', code);
    },

    Getddl: function Getddl(Mode, Code = 0, Status = null, FromDate = null, ToDate = null) {
        let url = UrlService.API_ENDPOINT_StoreRequisitionMaster + `/Getddl?Mode=${encodeURIComponent(Mode)}`;
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
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetProjectList: function GetProjectList() {
        return StoreRequisitionSlipService.Getddl('DDL_PROJECTLIST');
    },

    GetSubProjectList: function GetSubProjectList(projectCode) {
        return StoreRequisitionSlipService.Getddl('DDL_SUBPROJECTLIST', projectCode);
    },

    GetItemList: function GetItemList() {
        return StoreRequisitionSlipService.Getddl('DDL_ITEMLIST');
    },

    GetUOMList: function GetUOMList() {
        return StoreRequisitionSlipService.Getddl('DDL_UOMLIST');
    },

    GetDepartmentList: function GetDepartmentList() {
        return StoreRequisitionSlipService.Getddl('DDL_DEPARTMENTLIST');
    },

    SaveStoreRequisition: function SaveStoreRequisition(payload) {
        let url = UrlService.API_ENDPOINT_StoreRequisitionMaster + `/SaveStoreRequisition`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) { return value; });
    },

    DeleteStoreRequisition: function DeleteStoreRequisition(code) {
        let url = UrlService.API_ENDPOINT_StoreRequisitionMaster + `/DeleteStoreRequisition?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    CancelStoreRequisition: function CancelStoreRequisition(code) {
        let url = UrlService.API_ENDPOINT_StoreRequisitionMaster + `/CancelStoreRequisition?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    }

}

export { StoreRequisitionSlipService }
