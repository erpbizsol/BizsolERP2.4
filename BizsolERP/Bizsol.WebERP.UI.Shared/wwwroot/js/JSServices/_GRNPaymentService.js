import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const API_ENDPOINT_GRNPaymentApprovalConfig = {

    // ── Core Getddl helper ────────────────────────────────────────────────────
    GetGRNPaymentddl: function GetGRNPaymentddl(Mode, Code = 0) {
        let url = UrlService.API_ENDPOINT_GRNPaymentApprovalConfig + `/GetGRNPaymentddl?Mode=${Mode}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },

    // ── Get all approval levels (LOCATE) ──────────────────────────────────────
    GetLevelList: function GetLevelList() {
        return API_ENDPOINT_GRNPaymentApprovalConfig.GetGRNPaymentddl('LOCATE');
    },

    // ── Get a single level by Code (SHOWDATA) ─────────────────────────────────
    GetLevelById: function GetLevelById(code) {
        return API_ENDPOINT_GRNPaymentApprovalConfig.GetGRNPaymentddl('SHOWDATA', code);
    },

    // ── Get approver group dropdown list (DDL_APPROVERGROUP) ──────────────────
    GetApproverGroupList: function GetApproverGroupList() {
        return API_ENDPOINT_GRNPaymentApprovalConfig.GetGRNPaymentddl('DDL_APPROVERGROUP');
    },

    // ── Save / Update approval level ──────────────────────────────────────────
    SaveGRNPaymentConfig: function SaveGRNPaymentConfig(payload) {
        let url = UrlService.API_ENDPOINT_GRNPaymentApprovalConfig + '/SaveGRNPaymentConfig';
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },

    // ── Delete approval level by Code with mandatory reason ───────────────────
    DeleteGRNPaymentConfig: function DeleteGRNPaymentConfig(code, reasonForDelete) {
        let url = UrlService.API_ENDPOINT_GRNPaymentApprovalConfig +
            `/DeleteGRNPaymentConfig?Code=${code}&ReasonForDelete=${encodeURIComponent(reasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(
            function (value) {
                return value;
            }
        );
    },

}

export { API_ENDPOINT_GRNPaymentApprovalConfig }
