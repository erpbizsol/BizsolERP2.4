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

    //GetPendingPOStoreList: function GetPendingPOStoreList() {
    //    let url = UrlService.API_ENDPOINT_GRNService + `/GetPendingPOStoreList`;
    //    return promiseAjaxCallApi.CallAPI('GET', url, '')
    //        .then(function (value) {
    //            return value;
    //        });
    //},

    GetPOItemDetails: function GetPOItemDetails(ProjectCode, SubProjectMaster_Code, partyMaster_Code) {
        let url = UrlService.API_ENDPOINT_GRNService +
            `/GetPOItemDetails?ProjectMaster_Code=${ProjectCode}&SubProjectMaster_Code=${SubProjectMaster_Code}&partyMaster_Code=${partyMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    // ── Project / Sub-Project helpers ──────────────────────────────────────

    GetProjectList: function GetProjectList(SubProjectCode) {
        const code = SubProjectCode != null && SubProjectCode !== undefined ? String(SubProjectCode) : '';
        let url = UrlService.API_ENDPOINT_GRNService + `/GetProjectList?SubProjectCode=${encodeURIComponent(code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetSubProjectList: function GetSubProjectList(UserMaster_Code) {
        let url = UrlService.API_ENDPOINT_GRNService +
            `/GetSubProjectList?UserMaster_Code=${UserMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetVendor: function GetVendor() {
        let url = UrlService.API_ENDPOINT_GRNService + `/GetVendor`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetGRNList: function GetGRNList() {
        let url = UrlService.API_ENDPOINT_GRNService + `/GetGRNServiceList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    
    /** Marks GRN/MRN as verified (same contract as VerifySolarVendorMaster). */
    VerifyGRNService: function VerifyGRNService(Code) {
        let url = UrlService.API_ENDPOINT_GRNService + `/VerifyGRNServiceMaster?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetPendingPOByProject: function GetPendingPOByProject(ProjectCode) {
        let url = UrlService.API_ENDPOINT_GRNService + `/GetPendingPOByProject?ProjectCode=${ProjectCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    /** Pending PO numbers for the selected party/vendor (same contract as GRN Payment Entry GetPOList). */
    GetPendingPOStoreList: function GetPendingPOStoreList(Code) {
        const code = Code !== undefined && Code !== null ? String(Code).trim() : '';
        let url = UrlService.API_ENDPOINT_GRNService + `/GetPendingPOStoreList?Code=${encodeURIComponent(code || '0')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

}

export { GRNService }
