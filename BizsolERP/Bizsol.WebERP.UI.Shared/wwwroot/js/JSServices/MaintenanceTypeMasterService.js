import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MaintenanceTypeMasterService = {
    GetMaintenanceTypeMasterList: function () {
        var url = UrlService.API_ENDPOINT_MAINTENANCETYPE + '/GetMaintenanceTypeMasterList';
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    GetMaintenanceTypeMasterByCode: function (code) {
        var url = UrlService.API_ENDPOINT_MAINTENANCETYPE + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', url, '', { suppressErrorToast: true });
    },
    SaveMaintenanceTypeMaster: function (data) {
        var url = UrlService.API_ENDPOINT_MAINTENANCETYPE + '/SaveMaintenanceTypeMaster';
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(data), { suppressErrorToast: true });
    },
    DeleteMaintenanceTypeMaster: function (code, reasonForDelete) {
        var url = UrlService.API_ENDPOINT_MAINTENANCETYPE
            + '/DeleteMaintenanceTypeMaster?Code=' + encodeURIComponent(code)
            + '&ReasonForDelete=' + encodeURIComponent(reasonForDelete || '')
            + '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },
    VerifyMaintenanceTypeMaster: function (code) {
        var url = UrlService.API_ENDPOINT_MAINTENANCETYPE
            + '/VerifyMaintenanceTypeMaster?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', url, '', { suppressErrorToast: true });
    }
};

export { MaintenanceTypeMasterService };
