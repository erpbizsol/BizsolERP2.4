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

    // ── RECONCILE : Mark record as reconciled ─────────────────────────────────
    ReconcileBankStatement: function ReconcileBankStatement(code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT
            + `/ReconcileBankStatement?Code=${encodeURIComponent(code)}`
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

    /** Y/N save — add POST on API; UI falls back to ReconcileBankStatement when only setting Y. */
    SetBankStatementReconciliation: function SetBankStatementReconciliation(code, isY) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var body = JSON.stringify({
            Code: code,
            IsReconciled: isY ? 'Y' : 'N',
            UserMaster_Code: userMasterCode
        });
        var URL = UrlService.API_ENDPOINT_BANK_STATEMENT + '/SetBankStatementReconciliation';
        return promiseAjaxCallApi.CallAPI('POST', URL, body).then(function (value) {
            return value;
        });
    }
};

export { BankStatementService };
