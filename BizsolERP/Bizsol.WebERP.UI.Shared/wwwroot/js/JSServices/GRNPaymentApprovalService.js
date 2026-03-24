import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/** Calls Web API that wraps USP_WebAPI_GRNPaymentLevelsApproval (modes: PENDINGGRNPAYMENTLIST, GETGRNPAYMENTDETAIL, APPROVEPO, REJECTPO). */
const GRNPaymentApprovalService = {

    GetPendingGRNPaymentList: function GetPendingGRNPaymentList(FromDate, ToDate, Status) {
        const url = UrlService.API_ENDPOINT_GRNPaymentApproval +
            `/GetPendingGRNPaymentList?FromDate=${encodeURIComponent(FromDate)}&ToDate=${encodeURIComponent(ToDate)}&Status=${encodeURIComponent(Status)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetGRNPaymentDetail: function GetGRNPaymentDetail(grnPaymentMasterCode) {
        const url = UrlService.API_ENDPOINT_GRNPaymentApproval +
            `/GetGRNPaymentDetail?GRNPaymentMaster_Code=${grnPaymentMasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    ApproveGRNPayment: function ApproveGRNPayment(grnPaymentMasterCode, levelCode, remarks) {
        let userCode = 0, groupCode = 0;
        try {
            userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
            groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        } catch (e) { /* optional session */ }
        const url = UrlService.API_ENDPOINT_GRNPaymentApproval +
            `/ApproveGRNPayment?GRNPaymentMaster_Code=${grnPaymentMasterCode}&LevelCode=${levelCode}` +
            `&UserMaster_Code=${userCode}&GroupMaster_Code=${groupCode}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },

    RejectGRNPayment: function RejectGRNPayment(grnPaymentMasterCode, levelCode, remarks) {
        let userCode = 0, groupCode = 0;
        try {
            userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
            groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        } catch (e) { /* optional session */ }
        const url = UrlService.API_ENDPOINT_GRNPaymentApproval +
            `/RejectGRNPayment?GRNPaymentMaster_Code=${grnPaymentMasterCode}&LevelCode=${levelCode}` +
            `&UserMaster_Code=${userCode}&GroupMaster_Code=${groupCode}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },
};

export { GRNPaymentApprovalService };
