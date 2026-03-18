import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SubProjectMasterService = {
    GetSubProjectList: function GetSubProjectList() {
        const URL = UrlService.API_ENDPOINT_SubProjectMaster + "/GetSubProjectList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },
    SaveSubProject: function SaveSubProject(data) {
        const URL = UrlService.API_ENDPOINT_SubProjectMaster + "/SaveSubProject";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteSubProject: function DeleteSubProject(code, reason) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SubProjectMaster + "/DeleteSubProject?Code=" + code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + encodeURIComponent(reason || '') + "&IPAddress=1&Location=1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) {
            return value;
        });
    },
    GetUserList: function GetUserList() {
        let url = UrlService.API_ENDPOINT_SubProjectMaster + '/GetUserList';
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    GetSubProjectByCode: function GetSubProjectByCode(code) {
        const URL = UrlService.API_ENDPOINT_SubProjectMaster + "/GetSubProjectByCode?Code=" + code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },
    GetLevelList: function GetLevelList() {
        let url = UrlService.API_ENDPOINT_SubProjectMaster + '/GetLevelList';
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
};

export { SubProjectMasterService }
