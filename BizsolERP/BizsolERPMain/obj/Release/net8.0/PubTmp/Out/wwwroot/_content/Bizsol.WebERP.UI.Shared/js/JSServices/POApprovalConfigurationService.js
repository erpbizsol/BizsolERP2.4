import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const POApprovalConfigurationService = {

    // ── Core Getddl helper ────────────────────────────────────────────────────
    Getddl: function Getddl(Mode, Code = 0) {
        let url = UrlService.API_ENDPOINT_POApprovalConfig + `/Getddl?Mode=${Mode}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    // ── Get all approval levels (LOCATE) ──────────────────────────────────────
    GetLevelList: function GetLevelList() {
        return POApprovalConfigurationService.Getddl('LOCATE');
    },

    // ── Get a single level by Code (SHOWDATA) ─────────────────────────────────
    GetLevelById: function GetLevelById(code) {
        return POApprovalConfigurationService.Getddl('SHOWDATA', code);
    },

    // ── Get approver group dropdown list (DDL_APPROVERGROUP) ──────────────────
    GetApproverGroupList: function GetApproverGroupList() {
        return POApprovalConfigurationService.Getddl('DDL_APPROVERGROUP');
    },

    // ── Save / Update approval level ──────────────────────────────────────────
    SavePOApprovalConfig: function SavePOApprovalConfig(payload) {
        let url = UrlService.API_ENDPOINT_POApprovalConfig + '/SavePOApprovalConfig';
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },

    // ── Delete approval level by Code with mandatory reason ───────────────────
    DeletePOApprovalConfig: function DeletePOApprovalConfig(code, reasonForDelete) {
        let url = UrlService.API_ENDPOINT_POApprovalConfig +
            `/DeletePOApprovalConfig?Code=${code}&ReasonForDelete=${encodeURIComponent(reasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(
            function (value) {
                return value;
            }
        );
    },

}

export { POApprovalConfigurationService }
