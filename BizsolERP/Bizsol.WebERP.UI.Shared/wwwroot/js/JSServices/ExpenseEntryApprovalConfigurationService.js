import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/** Calls USP_WebAPI_ExpenseEntryApprovalConfiguration via Web API (same pattern as GRN payment approval). */
const ExpenseEntryApprovalConfigurationService = {

    Getddl: function Getddl(Mode, Code = 0) {
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_APPROVAL_CONFIG +
            `/GetExpenseEntryApprovalddl?Mode=${encodeURIComponent(Mode)}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetLevelList: function GetLevelList() {
        return ExpenseEntryApprovalConfigurationService.Getddl('LOCATE');
    },

    GetLevelById: function GetLevelById(code) {
        return ExpenseEntryApprovalConfigurationService.Getddl('SHOWDATA', code);
    },

    GetApproverGroupList: function GetApproverGroupList() {
        return ExpenseEntryApprovalConfigurationService.Getddl('DDL_APPROVERGROUP');
    },

    SaveConfig: function SaveConfig(payload) {
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_APPROVAL_CONFIG + '/SaveExpenseEntryApprovalConfig';
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(function (value) {
            return value;
        });
    },

    DeleteConfig: function DeleteConfig(code, reasonForDelete) {
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_APPROVAL_CONFIG +
            `/DeleteExpenseEntryApprovalConfig?Code=${code}&ReasonForDelete=${encodeURIComponent(reasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    }
};

export { ExpenseEntryApprovalConfigurationService };
