import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MachineMaintenanceService = {
    GetReasonMaster: function GetReasonMaster() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/GetReasonMaster`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDepartmentMasterList: function GetDepartmentMasterList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/GetDepartmentMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetMachineMasterList: function GetMachineMasterList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/GetMachineMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetMachineMaintenanceList: function GetMachineMaintenanceList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/GetMachineMaintenanceList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetMachineMaintenanceByCode: function GetMachineMaintenanceByCode (Code) {

        var URL = UrlService.API_ENDPOINT_MachineMaintenance +
            "/GetMachineMaintenanceByCode?Code=" + Code;

        return promiseAjaxCallApi.CallAPI('GET', URL, null)
            .then(function (value) {
                return value;
            });
    },
    SaveMachineMaintenance: function SaveMachineMaintenance(MachineMaintenanceRequestData) {
        var json_data = JSON.stringify(MachineMaintenanceRequestData, null, 2);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/SaveMachineMaintenance`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteMachineMaintenance: function DeleteMachineMaintenance(Code, ReasonForDelete) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/DeleteMachineMaintenance?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${ReasonForDelete}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMachineMaintenanceImageByCode: function GetMachineMaintenanceImageByCode(Code, Status) {
        const URL = `${UrlService.API_ENDPOINT_MachineMaintenance}/GetMachineMaintenanceImageByCode?Code=${Code}&Status=${Status}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, null)
            .then(function (value) {
                return value;
            });
    },
    GetStatusMaster: function GetStatusMaster() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_MachineMaintenance + `/GetStatusMaster`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
   
}
export { MachineMaintenanceService }

