import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const TASKLIST_MASTER_BASE =
    UrlService.API_ENDPOINT_TASKLIST_MASTER || `${UrlService.BASE_URL}/TaskListMaster`;

/**
 * Task List Master — dbo.USP_WebAPI_TaskListMaster
 * GETLIST | GETBYCODE | GETFINYEARLIST | DDL_USERMASTER | DDL_FREQUENCYMASTER | SAVE | DELETE
 * (DAL must pass the correct Mode per endpoint; see TaskListMaster_API_Alignment.md)
 */

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

const TaskListMasterService = {
    GetCurrentFinYear: function GetCurrentFinYear() {
        const URL = TASKLIST_MASTER_BASE + '/GetFinyearList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetFinyearList: function GetFinyearList() {
        const URL = TASKLIST_MASTER_BASE + '/GetFinyearList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetTaskListMasterList: function GetTaskListMasterList() {
        const URL = TASKLIST_MASTER_BASE + '/GetTaskListMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetTaskListEmployee: function GetTaskListEmployee() {
        const URL = TASKLIST_MASTER_BASE + '/GetTaskListEmployee';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetTaskListFreq: function GetTaskListFreq() {
        const URL = TASKLIST_MASTER_BASE + '/GetTaskListFreq';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Fallback when GetTaskListFreq returns empty — reads FrequencyMaster via generic Dropdown API. */
    GetFrequencyMasterDropdown: function GetFrequencyMasterDropdown() {
        const userCode = authUserCode();
        const jsonData = {
            distinct: 'N',
            fieldName: 'Frequency',
            fieldNameOrderBy: 'Frequency',
            filterCondition: '',
            tableName: 'FrequencyMaster',
            UserMaster_Code: userCode,
        };
        const URL = UrlService.API_ENDPOINT_DROPDOWN + '/GetDropdownList';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(jsonData)).then(function (value) {
            return value;
        });
    },

    GetFrequencyMasterCodeDropdown: function GetFrequencyMasterCodeDropdown() {
        const userCode = authUserCode();
        const jsonData = {
            distinct: 'N',
            fieldName: 'Code',
            fieldNameOrderBy: 'Code',
            filterCondition: '',
            tableName: 'FrequencyMaster',
            UserMaster_Code: userCode,
        };
        const URL = UrlService.API_ENDPOINT_DROPDOWN + '/GetDropdownList';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(jsonData)).then(function (value) {
            return value;
        });
    },

    GetTaskListMasterByCode: function GetTaskListMasterByCode(code) {
        const URL =
            TASKLIST_MASTER_BASE +
            '/GetTaskListMasterByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Copy From Fin Year — tasks for employee + source fin year (SP Mode: GETBYEMPFINYEAR) */
    GetTaskListByEmpFinYear: function GetTaskListByEmpFinYear(userMasterCode, finYear) {
        const URL =
            TASKLIST_MASTER_BASE +
            '/GetTaskListByEmpFinYear?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&FinYear=' +
            encodeURIComponent(finYear || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Before bulk save — SP Mode: CHECKEMPFINYEAR */
    CheckEmployeeFinYearExists: function CheckEmployeeFinYearExists(userMasterCode, finYear) {
        const URL =
            TASKLIST_MASTER_BASE +
            '/CheckEmployeeFinYearExists?UserMaster_Code=' +
            encodeURIComponent(userMasterCode || 0) +
            '&FinYear=' +
            encodeURIComponent(finYear || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveTaskListMaster: function SaveTaskListMaster(data) {
        const URL = TASKLIST_MASTER_BASE + '/SaveTaskListMaster';
        const payload = Object.assign({ Mode: 'SAVE' }, data || {});
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    },

    DeleteTaskListMaster: function DeleteTaskListMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            TASKLIST_MASTER_BASE +
            '/DeleteTaskListMaster?Code=' +
            encodeURIComponent(code) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode) +
            '&ReasonForDelete=' +
            encodeURIComponent(reason || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
};

export { TaskListMasterService };
