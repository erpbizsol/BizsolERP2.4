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

    // ── SAVE : insert / update (JSON body → SP @OtherParameter, Mode SAVE) ─
    SaveAssetsMaster: function SaveAssetsMaster(payload) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        if (payload && typeof payload === 'object' && payload.UserMaster_Code == null) {
            payload.UserMaster_Code = userMasterCode;
        }
        var json_data = JSON.stringify(payload, null, 2);
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

    /** VERIFY : branch transfer via USP_FrmTransferMasterEntry + set Verify = Y */
    VerifyAssetsMaster: function VerifyAssetsMaster(code, companyCodes) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AssetsMaster
            + `/VerifyAssetsMaster?Code=${encodeURIComponent(code || 0)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`
            + `&CompanyCodes=${encodeURIComponent(companyCodes || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    }
};

export { AssetsMasterService };
