import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const POLevelsApproveService = {

  
    // ── Get pending PO list for level approval ───────────────────────────────
    GetPendingPOList: function GetPendingPOList(FromDate, ToDate, Status) {
        let url = UrlService.API_ENDPOINT_POLevelsApprove +
            `/GetPendingPOList?FromDate=${encodeURIComponent(FromDate)}&ToDate=${encodeURIComponent(ToDate)}&Status=${encodeURIComponent(Status)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // ── Get approval level detail for a PO ───────────────────────────────────
    GetPOLevelDetail: function GetPOLevelDetail(poCode) {
        let url = UrlService.API_ENDPOINT_POLevelsApprove + `/GetPOLevelDetail?PurchaseOrderMaster_Code=${poCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // ── Get PO line items (reuses POApproval endpoint) ────────────────────────
    GetPOItems: function GetPOItems(poCode) {
        let url = UrlService.API_ENDPOINT_POLevelsApprove + `/GetPODetail?PurchaseOrderMaster_Code=${poCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    
    // ── Get first pending PO date to use as default FromDate ────────────────
    GetFirstPendingPODate: function GetFirstPendingPODate() {
        let url = UrlService.API_ENDPOINT_POLevelsApprove + `/GetFirstPendingPODate`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
    
    // ── Approve a PO at the current level ─────────────────────────────────────
    ApprovePO: function ApprovePO(poCode, levelCode, remarks) {
        let userCode = 0, groupCode = 0;
        try {
            userCode  = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
            groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        } catch (e) {}
        let url = UrlService.API_ENDPOINT_POLevelsApprove +
            `/ApprovePO?PurchaseOrderMaster_Code=${poCode}&LevelCode=${levelCode}` +
            `&UserMaster_Code=${userCode}&GroupMaster_Code=${groupCode}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
            return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
        },
        
    // ── Reject a PO at the current level ──────────────────────────────────────
    RejectPO: function RejectPO(poCode, levelCode, remarks) {
        let userCode = 0, groupCode = 0;
        try {
            userCode  = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
            groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        } catch (e) {}
        let url = UrlService.API_ENDPOINT_POLevelsApprove +
        `/RejectPO?PurchaseOrderMaster_Code=${poCode}&LevelCode=${levelCode}` +
        `&UserMaster_Code=${userCode}&GroupMaster_Code=${groupCode}` +
        `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },
    
    // ── Put a PO on hold at the current level ─────────────────────────────────
    HoldPO: function HoldPO(poCode, levelCode, remarks) {
        let userCode = 0, groupCode = 0;
        try {
            userCode  = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
            groupCode = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        } catch (e) {}
        let url = UrlService.API_ENDPOINT_POLevelsApprove +
        `/HoldPO?PurchaseOrderMaster_Code=${poCode}&LevelCode=${levelCode}` +
        `&UserMaster_Code=${userCode}&GroupMaster_Code=${groupCode}` +
        `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },
    
    // ── Budget history (As per budget amount) ─────────────────────────────────
    GetBudgetHistory: function GetBudgetHistory(poCode) {
        let url = UrlService.API_ENDPOINT_POLevelsApprove + `/GetBudgetHistory?PurchaseOrderMaster_Code=${poCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
}

export { POLevelsApproveService }
