import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ProjectCategoryMasterService = {
    GetProjectCategoryList: function GetProjectCategoryList() {
        const URL = UrlService.API_ENDPOINT_ProjectCategoryMaster + '/GetProjectCategoryList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetProjectCategoryByCode: function GetProjectCategoryByCode(code) {
        const URL =
            UrlService.API_ENDPOINT_ProjectCategoryMaster +
            '/GetProjectCategoryByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveProjectCategory: function SaveProjectCategory(data) {
        const URL = UrlService.API_ENDPOINT_ProjectCategoryMaster + '/SaveProjectCategory';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },

    DeleteProjectCategory: function DeleteProjectCategory(code, reason) {
        const userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const URL =
            UrlService.API_ENDPOINT_ProjectCategoryMaster +
            '/DeleteProjectCategory?Code=' + code +
            '&UserMaster_Code=' + userCode +
            '&ReasonForDelete=' + encodeURIComponent(reason || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
};

export { ProjectCategoryMasterService };
