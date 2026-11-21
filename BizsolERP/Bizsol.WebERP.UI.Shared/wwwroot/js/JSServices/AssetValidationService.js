import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * AssetValidationService — Asset Validation / Asset Stock Audit (Store Transactions).
 * Calls USP_WebAPI_AssetValidation via Web API routes on {BASE_URL}/AssetValidation.
 */
function _userMasterCode() {
    try { return (JSON.parse(sessionStorage.getItem('authKey') || '{}').UserMaster_Code) || 0; }
    catch (e) { return 0; }
}

const AssetValidationService = {

    GetAssetValidationList: function GetAssetValidationList(fromDate, toDate) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/GetAssetValidationList?FromDate=${encodeURIComponent(fromDate || '')}`
            + `&ToDate=${encodeURIComponent(toDate || '')}`
            + `&UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetAssetValidationByCode: function GetAssetValidationByCode(code) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/GetAssetValidationByCode?Code=${encodeURIComponent(code || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetNextEntryNo: function GetNextEntryNo() {
        var URL = UrlService.API_ENDPOINT_AssetValidation + `/GetNextEntryNo`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /** payload = { Code, Master: [{ Code, EntryDate, StartDate }], Transactions: [{ Condition }] } */
    ScanAsset: function ScanAsset(qrCode, payload) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/ScanAsset?QrCode=${encodeURIComponent(qrCode || '')}`
            + `&UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload || {}));
    },

    /** row = { Code, PhysicalStatus, FoundAt, Condition } */
    UpdateTransaction: function UpdateTransaction(row) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/UpdateTransaction?UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(row || {}));
    },

    DeleteTransaction: function DeleteTransaction(code) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/DeleteTransaction?Code=${encodeURIComponent(code || 0)}`
            + `&UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '');
    },

    GetConditionList: function GetConditionList() {
        var URL = UrlService.API_ENDPOINT_AssetValidation + `/GetConditionList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /** payload = { Code, Master: [TY_AssetStockAuditMaster], Transactions: [TY_AssetStockAuditTransaction] } */
    SaveAssetValidation: function SaveAssetValidation(payload) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/SaveAssetValidation?UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload || {}));
    },

    DeleteAssetValidation: function DeleteAssetValidation(code, reason) {
        var URL = UrlService.API_ENDPOINT_AssetValidation
            + `/DeleteAssetValidation?Code=${encodeURIComponent(code || 0)}`
            + `&UserMaster_Code=${encodeURIComponent(_userMasterCode())}`
            + `&ReasonForDelete=${encodeURIComponent(reason || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '');
    }
};

export { AssetValidationService };
