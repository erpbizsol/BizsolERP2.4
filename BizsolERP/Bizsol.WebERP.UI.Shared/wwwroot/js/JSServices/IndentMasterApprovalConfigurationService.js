import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * IndentMasterApprovalConfigurationService
 * Web API: IndentMasterApprovalConfig  →  USP_WebAPI_IndentMasterApprovalConfiguration
 */
const IndentMasterApprovalConfigurationService = {

    Getddl: function Getddl(Mode, Code = 0) {
        const url = UrlService.API_ENDPOINT_IndentMasterApprovalConfig +
            `/Getddl?Mode=${encodeURIComponent(Mode)}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetLevelList: function GetLevelList() {
        return IndentMasterApprovalConfigurationService.Getddl('LOCATE');
    },

    GetLevelById: function GetLevelById(code) {
        return IndentMasterApprovalConfigurationService.Getddl('SHOWDATA', code);
    },

    GetApproverGroupList: function GetApproverGroupList() {
        return IndentMasterApprovalConfigurationService.Getddl('DDL_APPROVERGROUP');
    },

    SaveIndentMasterApprovalConfig: function SaveIndentMasterApprovalConfig(payload) {
        const url = UrlService.API_ENDPOINT_IndentMasterApprovalConfig + '/SaveIndentMasterApprovalConfig';
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) {
            return value;
        });
    },

    DeleteIndentMasterApprovalConfig: function DeleteIndentMasterApprovalConfig(code, reasonForDelete) {
        const url = UrlService.API_ENDPOINT_IndentMasterApprovalConfig +
            `/DeleteIndentMasterApprovalConfig?Code=${code}&ReasonForDelete=${encodeURIComponent(reasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    }
};

export { IndentMasterApprovalConfigurationService };
