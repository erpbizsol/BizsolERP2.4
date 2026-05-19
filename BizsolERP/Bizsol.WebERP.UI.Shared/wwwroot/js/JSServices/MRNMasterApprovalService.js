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
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/GetPendingMRNMasterList?Status=${encodeURIComponent(status || '')}` +
            `&FromDate=${encodeURIComponent(fromDate || '')}&ToDate=${encodeURIComponent(toDate || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetMRNMasterDetail: function GetMRNMasterDetail(mrnMasterCode) {
        const code = encodeURIComponent(mrnMasterCode);
        const url = UrlService.API_ENDPOINT_MRNMasterLevelsApproval +
            `/GetMRNMasterDetail?MRNMaster_Code=${code}`;
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
};

export { MRNMasterApprovalService };
