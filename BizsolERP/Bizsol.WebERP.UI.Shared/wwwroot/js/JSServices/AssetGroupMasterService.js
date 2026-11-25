import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const AssetGroupMasterService = {
    GetAssetGroupMasterList: function () {
        var url = UrlService.API_ENDPOINT_ASSETGROUP + '/GetAssetGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetAssetGroupMasterByCode: function (code) {
        var url = UrlService.API_ENDPOINT_ASSETGROUP + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    SaveAssetGroupMaster: function (data) {
        var url = UrlService.API_ENDPOINT_ASSETGROUP + '/SaveAssetGroupMaster';
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(data), { suppressErrorToast: true });
    },
    DeleteAssetGroupMaster: function (code, reasonForDelete) {
        var url = UrlService.API_ENDPOINT_ASSETGROUP
            + '/DeleteAssetGroupMaster?Code=' + encodeURIComponent(code)
            + '&ReasonForDelete=' + encodeURIComponent(reasonForDelete || '')
            + '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },
    VerifyAssetGroupMaster: function (code) {
        var url = UrlService.API_ENDPOINT_ASSETGROUP
            + '/VerifyAssetGroupMaster?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', url, '', { suppressErrorToast: true });
    },
    /** DrAccountDepriciation / CrAccountDepriciation text (e.g. Asset Group Wise). */
    GetAccountMasterFieldConfig: function () {
        var url = UrlService.API_ENDPOINT_ASSETGROUP + '/GetAccountMasterFieldConfig';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetAccountLedgerList: function () {
        var url = UrlService.API_ENDPOINT_ASSETGROUP + '/GetAccountLedgerList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    }
};

export { AssetGroupMasterService };
