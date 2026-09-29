import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/** Last-used approver group (Code) when adding subsequent levels in this session */
const LAST_MRN_APPROVAL_GROUP_KEY = 'MRNServiceApprovalCfg_lastGroupMasterCode';

const MRNMasterApprovalConfigService = {

    SaveConfig: function SaveConfig(GRNRequestData) {
        const json_data = typeof GRNRequestData === 'string'
            ? GRNRequestData
            : JSON.stringify(GRNRequestData, null, 2);
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        let userMasterCode = authKeyData.UserMaster_Code;
        let url = UrlService.API_ENDPOINT_MRNMasterApprovalConfig + `/SaveMRNMasterConfig`;
        return promiseAjaxCallApi.CallAPI('POST', url, json_data)
            .then(function (value) {
                return value;
            });
    },

    DeleteConfig: function DeleteConfig(Code, ReasonForDelete) {
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        let userMasterCode = authKeyData.UserMaster_Code;
        let url = UrlService.API_ENDPOINT_MRNMasterApprovalConfig +
            `/DeleteMRNMasterConfig?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '')
            .then(function (value) {
                return value;
            });
    },

    GetMRNMasterddl: function GetMRNMasterddl(Mode, Code = 0) {
        let url = UrlService.API_ENDPOINT_MRNMasterApprovalConfig + `/GetMRNMasterddl?Mode=${Mode}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(
            function (value) {
                return value;
            }
        );
    },
    // ── Get all approval levels (LOCATE) ──────────────────────────────────────
    GetLevelList: function GetLevelList() {
        return MRNMasterApprovalConfigService.GetMRNMasterddl('LOCATE');
    },

    // ── Get a single level by Code (SHOWDATA) ─────────────────────────────────
    GetLevelById: function GetLevelById(code) {
        return MRNMasterApprovalConfigService.GetMRNMasterddl('SHOWDATA', code);
    },

    // ── Get approver group dropdown list (DDL_APPROVERGROUP) ──────────────────
    GetApproverGroupList: function GetApproverGroupList() {
        return MRNMasterApprovalConfigService.GetMRNMasterddl('DDL_APPROVERGROUP');
    },

    /**
     * Remember group choice so "Add level" can pre-select the same group next time.
     */
    RememberLastApproverGroup: function RememberLastApproverGroup(groupMasterCode) {
        if (groupMasterCode == null || groupMasterCode === '' || String(groupMasterCode) === '0') {
            return;
        }
        try {
            sessionStorage.setItem(LAST_MRN_APPROVAL_GROUP_KEY, String(groupMasterCode));
        } catch (e) { /* ignore quota / private mode */ }
    },

    /**
     * If session holds a group not returned by DDL, add a placeholder option so the value stays valid.
     */
    MergeSessionGroupIntoSelect: function MergeSessionGroupIntoSelect(selectEl) {
        if (!selectEl || selectEl.nodeName !== 'SELECT') return;
        let code = '';
        try {
            code = sessionStorage.getItem(LAST_MRN_APPROVAL_GROUP_KEY) || '';
        } catch (e) { return; }
        if (!code) return;
        const codeStr = String(code);
        for (let i = 0; i < selectEl.options.length; i++) {
            if (String(selectEl.options[i].value) === codeStr) return;
        }
        const o = document.createElement('option');
        o.value = codeStr;
        o.textContent = 'Group ' + codeStr;
        selectEl.appendChild(o);
    },

    /**
     * Pre-fill group for a new row from session (or clear when none stored).
     * @param {string} selectId DOM id of the group select (e.g. 'frmGroup')
     */
    ApplyDefaultGroupForNewLevel: function ApplyDefaultGroupForNewLevel(selectId) {
        const sel = typeof selectId === 'string' ? document.getElementById(selectId) : selectId;
        if (!sel) return;
        let code = '';
        try {
            code = sessionStorage.getItem(LAST_MRN_APPROVAL_GROUP_KEY) || '';
        } catch (e) { }
        sel.value = code ? String(code) : '';
    },

}

export { MRNMasterApprovalConfigService };




