import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const AssetTypeMasterService = {
    GetAssetTypeMasterList: function () {
        var url = UrlService.API_ENDPOINT_ASSETTYPE + '/GetAssetTypeMasterList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetMaintenancePlanningList: function () {
        var url = UrlService.API_ENDPOINT_ASSETTYPE + '/GetMaintenancePlanningList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetDepreciationMethodList: function () {
        var url = UrlService.API_ENDPOINT_ASSETTYPE + '/GetDepreciationMethodList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetAssetTypeMasterByCode: function (code) {
        var url = UrlService.API_ENDPOINT_ASSETTYPE + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    SaveAssetTypeMaster: function (data) {
        var url = UrlService.API_ENDPOINT_ASSETTYPE + '/SaveAssetTypeMaster';
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(data), { suppressErrorToast: true });
    },
    DeleteAssetTypeMaster: function (code, reasonForDelete) {
        var url = UrlService.API_ENDPOINT_ASSETTYPE
            + '/DeleteAssetTypeMaster?Code=' + encodeURIComponent(code)
            + '&ReasonForDelete=' + encodeURIComponent(reasonForDelete || '')
            + '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },
    VerifyAssetTypeMaster: function (code) {
        var url = UrlService.API_ENDPOINT_ASSETTYPE
            + '/VerifyAssetTypeMaster?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', url, '', { suppressErrorToast: true });
    }
};

export { AssetTypeMasterService };
