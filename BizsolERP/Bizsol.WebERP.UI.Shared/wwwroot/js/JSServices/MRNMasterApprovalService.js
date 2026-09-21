import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';
function getSessionUserAndGroup() {
    let userCode = 0;
    let groupCode = 0;
    try {
        const authRaw = sessionStorage.getItem('authKey');
        if (authRaw) {
            const auth = JSON.parse(authRaw);
            if (auth && auth.UserMaster_Code != null) {
                userCode = parseInt(auth.UserMaster_Code, 10) || 0;
            }
        }
        const detailsRaw = sessionStorage.getItem('UserDetails');
        if (detailsRaw) {
            const details = JSON.parse(detailsRaw);
            if (Array.isArray(details) && details[0] && details[0].GroupMaster_Code != null) {
                groupCode = parseInt(details[0].GroupMaster_Code, 10) || 0;
            }
        }
    } catch (e) { /* session optional */ }
    return { userCode, groupCode };
}

const MRNMasterApprovalService = {

    GetPendingMRNMasterList: function GetPendingMRNMasterList(status, fromDate, toDate) {
        const { groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/GetPendingMRNMasterList?Status=${encodeURIComponent(status || '')}` +
            `&FromDate=${encodeURIComponent(fromDate || '')}&ToDate=${encodeURIComponent(toDate || '')}` +
            `&GroupMaster_Code=${encodeURIComponent(groupCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetMRNMasterDetail: function GetMRNMasterDetail(mrnMasterCode) {
        const code = encodeURIComponent(mrnMasterCode);
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/GetMRNMasterDetail?MRNMaster_Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetMRNApprovallavels: function GetMRNApprovallavels(code) {
        const mrnCode = encodeURIComponent(code);
        const url = UrlService.API_ENDPOINT_GRNService + `/GetMRNApprovallavels?Code=${mrnCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    ApproveMRNMaster: function ApproveMRNMaster(mrnMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/ApproveMRNMaster?MRNMaster_Code=${encodeURIComponent(mrnMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    RejectMRNMaster: function RejectMRNMaster(mrnMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/RejectMRNMaster?MRNMaster_Code=${encodeURIComponent(mrnMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    GetFirstPendingBillDate: function GetFirstPendingBillDate() {
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval + '/GetFirstPendingBillDate';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
    /** itemMasterCodes: comma-separated ItemMaster_Code list — API param name is Itemmaster_code. */
    GetMRNBudgetBalance: function GetMRNBudgetBalance(mrnMasterCode, accountMasterCode, projectMasterCode, subProjectMasterCode, itemMasterCodes) {
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/GetMRNBudgetBalance?MRNMaster_Code=${encodeURIComponent(mrnMasterCode || 0)}` +
            `&AccountMaster_Code=${encodeURIComponent(accountMasterCode || 0)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMasterCode || 0)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMasterCode || 0)}` +
            `&Itemmaster_code=${encodeURIComponent(itemMasterCodes || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

};

export { MRNMasterApprovalService };
