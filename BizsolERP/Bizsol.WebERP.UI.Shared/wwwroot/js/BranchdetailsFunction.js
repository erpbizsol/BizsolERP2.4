import { UrlService } from './URL.js';
import { promiseAjaxCallApi } from './PromiseAjaxCallApi.js';

const BranchDetailsFunction = {
    _branchInfoPromise: null,
    _branchInfoCompanyCode: null,
    _isSafeTableName: function _isSafeTableName(tableName) {
        var name = (tableName == null ? '' : String(tableName)).trim();
        if (!name) return false;
        return /^[A-Za-z0-9_]+$/.test(name);
    },
    _normalizeCompanyCodes: function _normalizeCompanyCodes(companyCodes) {
        var codes = companyCodes;
        if (Array.isArray(companyCodes)) {
            codes = companyCodes.map(function (c) { return parseInt(c, 10); })
                .filter(function (c) { return !isNaN(c) && c > 0; })
                .join(',');
        }
        return (codes == null ? '' : String(codes)).trim();
    },
    _mapTransferResponse: function _mapTransferResponse(response) {
        var msg = (response && response.Msg != null) ? String(response.Msg).trim() : '';
        var lower = msg.toLowerCase();
        if (lower.indexOf('no valid company selected') >= 0
            || lower.indexOf('main company not found') >= 0
            || lower.indexOf('mastertablename is required') >= 0) {
            return { Status: 'FAILURE', Msg: msg || 'Branch transfer failed.' };
        }
        if (!msg) {
            return { Status: 'SUCCESS', Msg: 'Transfer completed successfully.' };
        }
        return { Status: 'SUCCESS', Msg: msg };
    },
    /**
     * Fetches branch info (MainCompany, etc.) for the current company from GetBranchInfo API.
     * Cached per company code.
     */
    getBranchInfo: function getBranchInfo() {
        let authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        let companyCode = parseInt(authKey.CompanyCode, 10) || 0;

        if (!this._branchInfoPromise || this._branchInfoCompanyCode !== companyCode) {
            this._branchInfoCompanyCode = companyCode;
            let url = `${UrlService.ERP_SIDE_MENU}/GetBranchInfo?CompanyCode=${companyCode}`;

            this._branchInfoPromise = promiseAjaxCallApi.CallAPI('GET', url, '').then(function (response) {
                if (Array.isArray(response)) return response[0] || {};
                if (response && Array.isArray(response.data)) return response.data[0] || {};
                if (response && Array.isArray(response.Data)) return response.Data[0] || {};
                return response || {};
            }).catch((error) => {
                this._branchInfoPromise = null;
                throw error;
            });
        }

        return this._branchInfoPromise;
    },
    MainCompany: function MainCompany() {
        return this.getBranchInfo().then(function (branchInfo) {
            return branchInfo.MainCompany;
        });
    },
    _allowOperationsPromise: null,
    _allowOperationsCompanyCode: null,
    /**
     * Common function — fetches AllowEdit/AllowNew/AllowDelete for the current company from the
     * AllowOperationsInBranch API. Response is cached per company code, so the API is called only
     * once; any change to how this is fetched only needs to be made here.
     */
    getAllowOperationsInBranch: function getAllowOperationsInBranch() {
        let authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        let companyCode = parseInt(authKey.CompanyCode, 10) || 0;

        if (!this._allowOperationsPromise || this._allowOperationsCompanyCode !== companyCode) {
            this._allowOperationsCompanyCode = companyCode;
            let url = `${UrlService.ERP_SIDE_MENU}/AllowOperationsInBranch?CompanyCode=${companyCode}`;

            this._allowOperationsPromise = promiseAjaxCallApi.CallAPI('GET', url, '').then(function (response) {
                if (Array.isArray(response)) return response[0] || {};
                if (response && Array.isArray(response.data)) return response.data[0] || {};
                if (response && Array.isArray(response.Data)) return response.Data[0] || {};
                return response || {};
            }).catch((error) => {
                this._allowOperationsPromise = null;
                throw error;
            });
        }

        return this._allowOperationsPromise;
    },
    /**
     * Usage: const canEdit = await BranchDetailsFunction.AllowEdit(); // true/false
     */
    AllowEdit: function AllowEdit() {
        return this.getAllowOperationsInBranch().then(function (allowInfo) {
            return ((allowInfo && allowInfo.AllowEdit) || '').toString().toUpperCase() === 'Y';
        });
    },
    AllowNew: function AllowNew() {
        return this.getAllowOperationsInBranch().then(function (allowInfo) {
            return ((allowInfo && allowInfo.AllowNew) || '').toString().toUpperCase() === 'Y';
        });
    },
    AllowDelete: function AllowDelete() {
        return this.getAllowOperationsInBranch().then(function (allowInfo) {
            return ((allowInfo && allowInfo.AllowDelete) || '').toString().toUpperCase() === 'Y';
        });
    },
    /**
     * Common function — fetches the list of Branch companies (FixedParameter rows where
     * MainCompany = 'N' AND MaintainMasterTransferApplicable = 'Y') that are eligible to
     * receive master data pushed from the Main Company. Used to populate the "Branch Details"
     * checkbox list. Not cached, since the list should always reflect current settings.
     * Usage: const branches = await BranchDetailsFunction.GetTransferApplicableBranches();
     * // [{ Code: 1, CompanyName: '...' }, ...]
     */
    GetTransferApplicableBranches: function GetTransferApplicableBranches() {
        let url = `${UrlService.ERP_SIDE_MENU}/GetTransferApplicableBranches`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (response) {
            if (Array.isArray(response)) return response;
            if (response && Array.isArray(response.data)) return response.data;
            if (response && Array.isArray(response.Data)) return response.Data;
            return [];
        });
    },
    /**
     * Common function — pushes one master record to selected branches via USP_FrmTransferMasterEntry.
     * Pass all checked branch FixedParameter codes as comma-separated string (e.g. "1,3").
     * Resolves to { Status: 'SUCCESS'|'FAILURE', Msg: '...' }.
     */
    TransferDataToBranch: function TransferDataToBranch(tableName, tableCode, companyCodes, currentMode, formName) {
        if (!this._isSafeTableName(tableName)) {
            return Promise.resolve({ Status: 'FAILURE', Msg: 'Invalid TableName.' });
        }
        var codes = this._normalizeCompanyCodes(companyCodes);
        if (!codes) {
            return Promise.resolve({ Status: 'FAILURE', Msg: 'No branch company codes supplied for transfer.' });
        }
        let url = `${UrlService.ERP_SIDE_MENU}/TransferDataToBranch`
            + `?TableName=${encodeURIComponent(tableName)}`
            + `&TableCode=${encodeURIComponent(tableCode)}`
            + `&CompanyCodes=${encodeURIComponent(codes)}`
            + `&CurrentMode=${encodeURIComponent(currentMode || 'New')}`
            + `&FormName=${encodeURIComponent(formName || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '', { suppressErrorToast: true })
            .then(function (response) { return BranchDetailsFunction._mapTransferResponse(response); });
    },
    /**
     * Reads <TableName>BranchDetails (e.g. SubCategoryMasterBranchDetails) — source of truth
     * for which Branch Details checkboxes should be checked.
     * Usage: const codes = await BranchDetailsFunction.GetTransferredBranches('SubCategoryMaster', 24);
     */
    GetTransferredBranches: function GetTransferredBranches(tableName, tableCode) {
        if (!this._isSafeTableName(tableName)) {
            return Promise.resolve([]);
        }
        let url = `${UrlService.ERP_SIDE_MENU}/GetTransferredBranches?TableName=${encodeURIComponent(tableName)}&TableCode=${tableCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (response) {
            var rows;
            if (Array.isArray(response)) rows = response;
            else if (response && Array.isArray(response.data)) rows = response.data;
            else if (response && Array.isArray(response.Data)) rows = response.Data;
            else rows = [];

            return rows
                .map(function (row) { return parseInt(row.CompanyCode ?? row.companyCode, 10); })
                .filter(function (code) { return !isNaN(code) && code > 0; });
        });
    }
}

export { BranchDetailsFunction }
