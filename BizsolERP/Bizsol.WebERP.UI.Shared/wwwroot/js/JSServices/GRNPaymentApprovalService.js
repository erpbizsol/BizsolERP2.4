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

const GRNPaymentApprovalService = {

    GetPendingGRNPaymentList: function GetPendingGRNPaymentList(FromDate, ToDate, Status) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/GetPendingGRNPaymentList?FromDate=${encodeURIComponent(FromDate || '')}&ToDate=${encodeURIComponent(ToDate || '')}&Status=${encodeURIComponent(Status || '')}&GroupMaster_Code=${encodeURIComponent(groupCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetGRNPaymentDetail: function GetGRNPaymentDetail(grnPaymentMasterCode) {
        const code = encodeURIComponent(grnPaymentMasterCode);
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/GetGRNPaymentDetail?GRNPaymentMaster_Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    ApproveGRNPayment: function ApproveGRNPayment(grnPaymentMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/ApproveGRNPayment?GRNPaymentMaster_Code=${encodeURIComponent(grnPaymentMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    RejectGRNPayment: function RejectGRNPayment(grnPaymentMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/RejectGRNPayment?GRNPaymentMaster_Code=${encodeURIComponent(grnPaymentMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    HoldGRNPayment: function HoldGRNPayment(grnPaymentMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/HoldGRNPayment?GRNPaymentMaster_Code=${encodeURIComponent(grnPaymentMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    GetFirstPendingEntryDate: function GetFirstPendingEntryDate() {
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval + '/GetFirstPendingEntryDate';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetGRNPaymentApprovalHistory: function GetGRNPaymentApprovalHistory(grnPaymentMasterCode, accountMasterCode, projectMasterCode, subProjectMasterCode) {
        const url = UrlService.API_ENDPOINT_GRNPaymentLevelsApproval +
            `/GetGRNPaymentApprovalHistory?GRNPaymentMaster_Code=${encodeURIComponent(grnPaymentMasterCode || 0)}` +
            `&AccountMaster_Code=${encodeURIComponent(accountMasterCode || 0)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMasterCode || 0)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMasterCode || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

};

export { GRNPaymentApprovalService };
