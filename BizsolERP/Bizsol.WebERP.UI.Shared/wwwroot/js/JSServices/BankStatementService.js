import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BankStatementService = {

    // ── Bank master list (for dropdown) ──────────────────────────────────────
    GetBankMasterList: function GetBankMasterList() {
        var URL = UrlService.API_ENDPOINT_BANK_MASTER + `/GetBankMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    // ── LOCATE : Get list with date / bank / batch filters ────────────────────
    GetBankStatementList: function GetBankStatementList(bankMasterCode, accountNo, fromDate, toDate, importBatchNo) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/GetBankStatementList?BankMaster_Code=${encodeURIComponent(bankMasterCode || 0)}`
            + `&AccountNo=${encodeURIComponent(accountNo || '')}`
            + `&FromDate=${encodeURIComponent(fromDate || '')}`
            + `&ToDate=${encodeURIComponent(toDate || '')}`
            + `&ImportBatchNo=${encodeURIComponent(importBatchNo || '')}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    // ── IMPORT : Bulk import rows (TVP via JSON body) ─────────────────────────
    ImportBankStatement: function ImportBankStatement(data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        data.UserMaster_Code = userMasterCode;
        var json_data = JSON.stringify(data, null, 2);
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT + `/ImportBankStatement`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(function (value) {
            return value;
        });
    },

    // ── GETIMPORTLOG : Import history / audit log ─────────────────────────────
    GetImportLog: function GetImportLog(bankMasterCode, fromDate, toDate) {
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/GetImportLog?BankMaster_Code=${encodeURIComponent(bankMasterCode || 0)}`
            + `&FromDate=${encodeURIComponent(fromDate || '')}`
            + `&ToDate=${encodeURIComponent(toDate || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    // ── DELETE : Delete single record ─────────────────────────────────────────
    DeleteBankStatement: function DeleteBankStatement(code, reason, ip, location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/DeleteBankStatement?Code=${encodeURIComponent(code)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`
            + `&ReasonForDelete=${encodeURIComponent(reason || '')}`
            + `&IP=${encodeURIComponent(ip || '')}`
            + `&Location=${encodeURIComponent(location || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    // ── DELETEIMPORTBATCH : Delete entire import batch ────────────────────────
    DeleteImportBatch: function DeleteImportBatch(importBatchNo, reason) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/DeleteImportBatch?ImportBatchNo=${encodeURIComponent(importBatchNo)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`
            + `&ReasonForDelete=${encodeURIComponent(reason || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    // ── SHOWDATA : Get single record by Code ──────────────────────────────────
    GetBankStatementByCode: function GetBankStatementByCode(code) {
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/GetBankStatementByCode?Code=${encodeURIComponent(code)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * USP_WebAPI_BankStatement @Mode = ExistingReconciled — pending GRN payments (Status P) for bank reconcile pick list.
     * Web API: GET …/GetExistingReconciledPendingGrnList — execute SP with Mode ExistingReconciled and return rowset as JSON array.
     */
    /**
     * @param {number} [bankStatementCode] When set, Web API should pass @Code so the SP can filter pending GRN rows by bank + amount for this line.
     */
    GetExistingReconciledPendingGrnList: function GetExistingReconciledPendingGrnList(bankStatementCode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var bc = parseInt(String(bankStatementCode == null ? 0 : bankStatementCode), 10) || 0;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/GetExistingReconciled?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        if (bc > 0) {
            URL += `&Code=${encodeURIComponent(bc)}`;
        }
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * RECONCILE — optional grnPaymentMasterCode on query string maps to @GRNPaymentMaster_Code on SP RECONCILE.
     */
    ReconcileBankStatement: function ReconcileBankStatement(code, grnPaymentMasterCode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/ReconcileBankStatement?Code=${encodeURIComponent(code)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        var grn = parseInt(String(grnPaymentMasterCode == null ? 0 : grnPaymentMasterCode), 10) || 0;
        if (grn > 0) {
            URL += `&GRNPaymentMaster_Code=${encodeURIComponent(grn)}`;
        }
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    /** Same as ReconcileBankStatement + GRN link (no separate /LinkAndReconcile… route). */
    LinkAndReconcileBankStatement: function LinkAndReconcileBankStatement(code, grnPaymentMasterCode) {
        return BankStatementService.ReconcileBankStatement(code, grnPaymentMasterCode);
    },

    /**
     * After GRN delete: IsReconciled = N, GRNPaymentMaster_Code = 0 — uses SetBankStatementReconciliation body.
     * WebAPI should map to USP @Mode UNLINKBANKSTATEMENTGRN / CLEARGRNLINK or equivalent UPDATE.
     */
    UnlinkBankStatementGrn: function UnlinkBankStatementGrn(code) {
        return BankStatementService.SetBankStatementReconciliation(code, false, { clearGrnLink: true });
    },

    /**
     * Unreconcile a withdrawal line: WebAPI should call USP_WebAPI_BankStatement @Mode = UNRECONCILEWITHGRN —
     * deletes matching pending GRN payment (if found) and sets IsReconciled = N.
     */
    UnreconcileWithdrawalWithGrn: function UnreconcileWithdrawalWithGrn(code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/UnreconcileWithdrawalWithGrn?Code=${encodeURIComponent(code)}`
            + `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    // ── AUTORECONFROMGRN : Bulk match GRNPaymentMaster (P) to withdrawals ────
    AutoReconcileFromGrn: function AutoReconcileFromGrn() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/AutoReconcileFromGrn?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    // ── SAVEDATA : Insert / update one row (TVP body matches VM_BankStatementSaveRequest) ─
    SaveBankStatement: function SaveBankStatement(payload) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        if (payload && typeof payload === 'object' && payload.UserMaster_Code == null) {
            payload.UserMaster_Code = userMasterCode;
        }
        var json_data = JSON.stringify(payload, null, 2);
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT + `/SaveBankStatement`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(function (value) {
            return value;
        });
    },

    /**
     * Y/N reconciliation save. options.clearGrnLink: send GRNPaymentMaster_Code = 0 (bank line unlink + Not reconciled).
     * WebAPI must persist both fields on BankStatement (see SP UNLINKBANKSTATEMENTGRN / CLEARGRNLINK).
     */
    SetBankStatementReconciliation: function SetBankStatementReconciliation(code, isY, options) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var payload = {
            Code: code,
            IsReconciled: isY ? 'Y' : 'N',
            UserMaster_Code: userMasterCode
        };
        if (options && options.clearGrnLink === true) {
            payload.GRNPaymentMaster_Code = 0;
        }
        var body = JSON.stringify(payload);
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT + '/SetBankStatementReconciliation';
        return promiseAjaxCallApi.CallAPI('POST', URL, body).then(function (value) {
            return value;
        });
    }
};

export { BankStatementService };
