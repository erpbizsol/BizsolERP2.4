import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ProjectMasterService = {
    GetProjectList: function GetProjectList() {
        const URL = UrlService.API_ENDPOINT_ProjectMaster + "/GetProjectList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },
    /** Single project (e.g. join ProjectMaster + CompanyParameter). Query param: Code */
    GetProjectByCode: function GetProjectByCode(code) {
        const URL =
            UrlService.API_ENDPOINT_ProjectMaster +
            '/GetProjectByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveProject: function SaveProject(data) {
        const URL = UrlService.API_ENDPOINT_ProjectMaster + "/SaveProject";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteProject: function DeleteProject(code, reason) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ProjectMaster + "/DeleteProject?Code=" + code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + encodeURIComponent(reason || '') + "&IPAddress=1&Location=1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) {
            return value;
        });
    },
    GetCompanyInfoList: function GetCompanyInfoList() {
        const URL = UrlService.API_ENDPOINT_ProjectMaster + "/GetCompanyInfoList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },
};

export { ProjectMasterService }
