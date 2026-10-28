import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function getDropdownList(tableName, fieldName, filterCondition) {
    const userCode = authUserCode();
    const jsonData = {
        distinct: 'Y',
        fieldName: fieldName,
        fieldNameOrderBy: fieldName,
        filterCondition: filterCondition || '',
        tableName: tableName,
        UserMaster_Code: userCode,
    };
    const URL = UrlService.API_ENDPOINT_DROPDOWN + '/GetDropdownList';
    return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(jsonData)).then(function (value) {
        return value;
    });
}

/**
 * Bank Master — api/Bank
 * Save body:
 * { bankMaster: [ tblBankMaster ], projectWiseOpenningDetail: [ { code, bankMaster_Code, projectMaster_Code, subProjectMaster_Code, amount } ] }
 */
const BankMasterService = {
    GetBankMasterList: function GetBankMasterList() {
        const URL = UrlService.API_ENDPOINT_BANK_MASTER + '/GetBankMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetBankMasterByCode: function GetBankMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_BANK_MASTER + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * POST api/Bank/SaveBankMaster
     * { bankMaster: [...], projectWiseOpenningDetail: [...] }
     * A raw array is still accepted and wrapped so ServiceTaxNo keeps saving on the bank row.
     */
    SaveBankMaster: function SaveBankMaster(payload) {
        var body = payload;
        if (Array.isArray(payload) || (payload && !payload.bankMaster && !payload.BankMaster)) {
            body = {
                bankMaster: Array.isArray(payload) ? payload : payload ? [payload] : [],
                projectWiseOpenningDetail: [],
            };
        }
        const URL = UrlService.API_ENDPOINT_BANK_MASTER + '/SaveBankMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(body)).then(function (value) {
            return value;
        });
    },

    /** GET api/Bank/GetFixedParameterFinance — AskProjectOpenningInBankMaster */
    GetFixedParameterFinance: function GetFixedParameterFinance() {
        const URL = UrlService.API_ENDPOINT_BANK_MASTER + '/GetFixedParameterFinance';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** DELETE — requires user rights check in SP (ModuleName = Bank). */
    DeleteBankMaster: function DeleteBankMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_BANK_MASTER +
            '/DeleteBankMaster?Code=' +
            encodeURIComponent(code) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode) +
            '&ReasonForDelete=' +
            encodeURIComponent(reason || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    GetCurrencyList: function GetCurrencyList() {
        return getDropdownList('CurrencyMaster', 'Description', " And Description<>''");
    },

    GetECMSBankList: function GetECMSBankList() {
        return getDropdownList('F_eCMSMaster', 'eCMSBANK', " And eCMSBANK<>''");
    },

    GetAccountList: function GetAccountList() {
        return getDropdownList('AccountMaster', 'AccountDesp', " And AccountDesp<>''");
    },
};

export { BankMasterService };
