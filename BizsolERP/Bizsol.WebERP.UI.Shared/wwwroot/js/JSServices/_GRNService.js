import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const GRNService = {

    // ── Core GRN CRUD ──────────────────────────────────────────────────────

    GetGRNByCode: function GetGRNByCode(Code) {
        let url = UrlService.API_ENDPOINT_GRNService + `/GetGRNServiceByCode?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    SaveGRN: function SaveGRN(GRNRequestData) {
        let json_data = JSON.stringify(GRNRequestData, null, 2);
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        let userMasterCode = authKeyData.UserMaster_Code;
        let url = UrlService.API_ENDPOINT_GRNService + `/SaveGRNService`;
        return promiseAjaxCallApi.CallAPI('POST', url, json_data)
            .then(function (value) {
                return value;
            });
    },

    DeleteGRN: function DeleteGRN(Code, ReasonForDelete) {
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        let userMasterCode = authKeyData.UserMaster_Code;
        let url = UrlService.API_ENDPOINT_GRNService +
            `/DeleteGRNService?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '')
            .then(function (value) {
                return value;
            });
    },

    // ── PO helpers ─────────────────────────────────────────────────────────

    GetPendingPOStoreList: function GetPendingPOStoreList() {
        let url = UrlService.API_ENDPOINT_GRNService + `/GetPendingPOStoreList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '')
            .then(function (value) {
                return value;
            });
    },

    GetPOItemDetails: function GetPOItemDetails(POCode) {
        let url = UrlService.API_ENDPOINT_PurchaseOrderMaster +
            `/GetPOItemDetails?POCode=${POCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    // ── Project / Sub-Project helpers ──────────────────────────────────────

    GetProjectList: function GetProjectList() {
        let url = UrlService.API_ENDPOINT_ProjectMaster + `/GetProjectList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetSubProjectList: function GetSubProjectList(ProjectCode) {
        let url = UrlService.API_ENDPOINT_SubProjectMaster +
            `/GetSubProjectList?ProjectCode=${ProjectCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

  

}

export { GRNService }
