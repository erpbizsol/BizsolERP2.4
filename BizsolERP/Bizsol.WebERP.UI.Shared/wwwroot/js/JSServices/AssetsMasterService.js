import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * AssetsMasterService — fixed-asset master (Store Transactions).
 * Calls USP_WebAPI_AssetsMaster via Web API routes on {BASE_URL}/AssetsMaster
 * (same style as BankStatementService → USP_WebAPI_BankStatement).
 */
const AssetsMasterService = {

    // ── LOCATE : list with optional purchase-date filter ─────────────────────
    GetAssetsMasterList: function GetAssetsMasterList(fromDate, toDate) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/GetAssetsMasterList?FromDate=${encodeURIComponent(fromDate || '')}`
            + `&ToDate=${encodeURIComponent(toDate || '')}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    // ── SHOWDATA : single record by Code ─────────────────────────────────────
    GetAssetsMasterByCode: function GetAssetsMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/GetAssetsMasterByCode?Code=${encodeURIComponent(code || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetAssetTypeList: function GetAssetTypeList() {
        var URL = UrlService.API_ENDPOINT_AssetsMaster + `/GetAssetTypeList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetCurrencyList: function GetCurrencyList() {
        var URL = UrlService.API_ENDPOINT_AssetsMaster + `/GetCurrencyList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetDepartmentList: function GetDepartmentList() {
        var URL = UrlService.API_ENDPOINT_AssetsMaster + `/GetDepartmentList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetDatabaseLocationList: function GetDatabaseLocationList() {
        var URL = UrlService.API_ENDPOINT_AssetsMaster + `/GetDatabaseLocationList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetNextAssetTagNo: function GetNextAssetTagNo(assetTypeMasterCode, dateOfPurchase) {
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/GetNextAssetTagNo?AssetTypeMaster_Code=${encodeURIComponent(assetTypeMasterCode || 0)}`
            + `&DateOfPurchase=${encodeURIComponent(dateOfPurchase || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetPrintQrUrl: function GetPrintQrUrl(code) {
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/GetPrintQrUrl?Code=${encodeURIComponent(code || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    // ── SAVE : insert / update (VM { Code, Details } → TY_AssetsMaster TVP, Mode SAVE) ─
    SaveAssetsMaster: function SaveAssetsMaster(payload) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var body = payload && typeof payload === 'object' ? payload : {};
        if (!Array.isArray(body.Details) && body.Code != null) {
            body = { Code: body.Code || body.AssetsMaster_Code || 0, Details: [body] };
        }
        var json_data = JSON.stringify(body);
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/SaveAssetsMaster?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(function (value) {
            return value;
        });
    },

    // ── DELETE : soft-delete single record ───────────────────────────────────
    DeleteAssetsMaster: function DeleteAssetsMaster(code, reason, ip, location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/DeleteAssetsMaster?Code=${encodeURIComponent(code)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`
            + `&ReasonForDelete=${encodeURIComponent(reason || '')}`
            + `&IP=${encodeURIComponent(ip || '')}`
            + `&Location=${encodeURIComponent(location || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    /** VERIFY — same contract as AssetGroupMasterService.VerifyAssetGroupMaster. CompanyCodes resolved in API/SP. */
    VerifyAssetsMaster: function VerifyAssetsMaster(code) {
        var url = UrlService.API_ENDPOINT_AssetsMaster
            + '/VerifyAssetsMaster?Code=' + encodeURIComponent(code || 0);
        return promiseAjaxCallApi.CallAPI('POST', url, '', { suppressErrorToast: true });
    }
};

export { AssetsMasterService };
