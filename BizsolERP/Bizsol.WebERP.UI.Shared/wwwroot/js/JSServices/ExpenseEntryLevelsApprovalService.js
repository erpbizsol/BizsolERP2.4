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

const ExpenseEntryLevelsApprovalService = {

    GetPendingExpenseEntryList: function GetPendingExpenseEntryList(FromDate, ToDate, Status) {
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_LEVELS_APPROVAL +
            `/GetPendingExpenseEntryList?FromDate=${encodeURIComponent(FromDate || '')}&ToDate=${encodeURIComponent(ToDate || '')}&Status=${encodeURIComponent(Status || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetExpenseEntryApprovalDetail: function GetExpenseEntryApprovalDetail(expenseEntryMasterCode) {
        const code = encodeURIComponent(expenseEntryMasterCode);
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_LEVELS_APPROVAL +
            `/GetExpenseEntryApprovalDetail?ExpenseEntryMaster_Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    ApproveExpenseEntry: function ApproveExpenseEntry(expenseEntryMasterCode, levelCode, remarks, approvalHistory) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_LEVELS_APPROVAL +
            `/ApproveExpenseEntry?ExpenseEntryMaster_Code=${encodeURIComponent(expenseEntryMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        const body = JSON.stringify({
            ExpenseEntryApprovalHistory: Array.isArray(approvalHistory) ? approvalHistory : []
        });
        return promiseAjaxCallApi.CallAPI('POST', url, body).then(function (value) { return value; });
    },

    RejectExpenseEntry: function RejectExpenseEntry(expenseEntryMasterCode, levelCode, remarks) {
        const { userCode, groupCode } = getSessionUserAndGroup();
        const url = UrlService.API_ENDPOINT_EXPENSE_ENTRY_LEVELS_APPROVAL +
            `/RejectExpenseEntry?ExpenseEntryMaster_Code=${encodeURIComponent(expenseEntryMasterCode)}&LevelCode=${encodeURIComponent(levelCode)}` +
            `&UserMaster_Code=${encodeURIComponent(userCode)}&GroupMaster_Code=${encodeURIComponent(groupCode)}` +
            `&Remarks=${encodeURIComponent(remarks || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) { return value; });
    },
};

export { ExpenseEntryLevelsApprovalService };
