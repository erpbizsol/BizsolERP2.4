import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function _userCodes() {
    let userCode = 0, groupCode = 0;
    try {
        userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    } catch (e) { }
    try {
        groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
    } catch (e) { }
    return { userCode: userCode || 0, groupCode: groupCode || 0 };
}

/**
 * IndentMasterLevelsApprovalService
 * Web API: IndentMasterLevelsApproval  →  USP_WebAPI_IndentMasterLevelsApproval
 */
const IndentMasterLevelsApprovalService = {

    GetPendingIndentList: function GetPendingIndentList(FromDate, ToDate, Status) {
        const u = _userCodes();
        const url = UrlService.API_ENDPOINT_IndentMasterLevelsApproval +
            `/GetPendingIndentList?FromDate=${encodeURIComponent(FromDate || '')}` +
            `&ToDate=${encodeURIComponent(ToDate || '')}` +
            `&Status=${encodeURIComponent(Status || '')}` +
            `&UserMaster_Code=${u.userCode}&GroupMaster_Code=${u.groupCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetIndentLevelDetail: function GetIndentLevelDetail(indentCode) {
        const url = UrlService.API_ENDPOINT_IndentMasterLevelsApproval +
            `/GetIndentLevelDetail?IndentMaster_Code=${indentCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    CreateWorkflow: function CreateWorkflow(indentCode) {
        const u = _userCodes();
        const url = UrlService.API_ENDPOINT_IndentMasterLevelsApproval +
            `/CreateWorkflow?IndentMaster_Code=${indentCode}&UserMaster_Code=${u.userCode}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    ApproveIndent: function ApproveIndent(indentCode, levelCode, remarks) {
        const u = _userCodes();
        const url = UrlService.API_ENDPOINT_IndentMasterLevelsApproval +
            `/ApproveIndent?IndentMaster_Code=${indentCode}&LevelCode=${levelCode}` +
            `&UserMaster_Code=${u.userCode}&GroupMaster_Code=${u.groupCode}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    RejectIndent: function RejectIndent(indentCode, levelCode, remarks) {
        const u = _userCodes();
        const url = UrlService.API_ENDPOINT_IndentMasterLevelsApproval +
            `/RejectIndent?IndentMaster_Code=${indentCode}&LevelCode=${levelCode}` +
            `&UserMaster_Code=${u.userCode}&GroupMaster_Code=${u.groupCode}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    }
};

export { IndentMasterLevelsApprovalService };
