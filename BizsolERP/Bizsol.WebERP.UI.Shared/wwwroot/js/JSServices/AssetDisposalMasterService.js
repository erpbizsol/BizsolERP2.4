import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const AssetDisposalMasterService = {

    GetAssetDisposalMasterList: function GetAssetDisposalMasterList(fromDate, toDate) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AssetDisposalMaster
            + `/GetAssetDisposalMasterList?FromDate=${encodeURIComponent(fromDate || '')}`
            + `&ToDate=${encodeURIComponent(toDate || '')}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetAssetDisposalMasterByCode: function GetAssetDisposalMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_AssetDisposalMaster
            + `/GetAssetDisposalMasterByCode?Code=${encodeURIComponent(code || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetAssetList: function GetAssetList(assetsMasterCode) {
        var URL = UrlService.API_ENDPOINT_AssetDisposalMaster
            + `/GetAssetList?AssetsMaster_Code=${encodeURIComponent(assetsMasterCode || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveAssetDisposalMaster: function SaveAssetDisposalMaster(payload) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var body = payload && typeof payload === 'object' ? payload : {};
        if (!Array.isArray(body.Details) && body.Code != null) {
            body = { Code: body.Code || 0, Details: [body] };
        }
        var json_data = JSON.stringify(body);
        var URL = UrlService.API_ENDPOINT_AssetDisposalMaster
            + `/SaveAssetDisposalMaster?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(function (value) {
            return value;
        });
    },

    DeleteAssetDisposalMaster: function DeleteAssetDisposalMaster(code, reason, ip, location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_AssetDisposalMaster
            + `/DeleteAssetDisposalMaster?Code=${encodeURIComponent(code)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`
            + `&ReasonForDelete=${encodeURIComponent(reason || '')}`
            + `&IP=${encodeURIComponent(ip || '')}`
            + `&Location=${encodeURIComponent(location || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    }
};

export { AssetDisposalMasterService };
