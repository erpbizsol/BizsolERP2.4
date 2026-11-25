import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MaintenanceScheduleMasterService = {

    GetMachineMasterList: function GetMachineMasterList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetMachineMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetMaintenanceTypeList: function GetMaintenanceTypeList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetMaintenanceTypeList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetMonthslist: function GetMonthslist() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetMonthslist`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetMaintenanceChecklist: function GetMaintenanceChecklist() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetMaintenanceChecklist`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetPeriodicityMasterList: function GetPeriodicityMasterList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetPeriodicityMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetActionMasterList: function GetActionMasterList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetActionMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetItemMasterList: function GetItemMasterList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetItemMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetItemNameList: function GetItemNameList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetItemMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMaintenanceScheduleMasterList: function GetMaintenanceScheduleMasterList() {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/GetMaintenanceScheduleMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetMaintenanceScheduleMasterByCode: function GetMaintenanceScheduleMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster
            + '/GetMaintenanceScheduleMasterByCode?code=' + encodeURIComponent(code || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    DeleteMaintenanceScheduleMaster: function DeleteMaintenanceScheduleMaster(code) {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster
            + '/DeleteMaintenanceScheduleMaster?code=' + encodeURIComponent(code || 0);
        return promiseAjaxCallApi.CallAPI('POST', URL, '', { suppressErrorToast: true });
    },

    SaveMaintenanceScheduleMaster: function SaveMaintenanceScheduleMaster(data) {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster + `/SaveMaintenanceScheduleMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },

    GetMaintenanceScheduleMasterLocate: function GetMaintenanceScheduleMasterLocate(machineMaster_Code) {
        var URL = UrlService.API_ENDPOINT_MaintenanceScheduleMaster
            + '/GetMaintenanceScheduleMasterLocate?machineMaster_Code=' + encodeURIComponent(machineMaster_Code || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true }).then(
            function (value) {
                return value;
            }
        );
    },

}
export { MaintenanceScheduleMasterService }

