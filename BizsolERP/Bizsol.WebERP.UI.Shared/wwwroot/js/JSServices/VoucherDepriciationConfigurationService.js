import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * VoucherDepriciationConfigurationService — Voucher / Depreciation Configuration (Store Transactions).
 * Calls USP_WebAPI_VoucherDepriciationConfiguration via Web API routes on {BASE_URL}/VoucherDepriciationConfiguration.
 */
function _userMasterCode() {
    try { return (JSON.parse(sessionStorage.getItem('authKey') || '{}').UserMaster_Code) || 0; }
    catch (e) { return 0; }
}

const VoucherDepriciationConfigurationService = {

    GetConfiguration: function GetConfiguration() {
        var URL = UrlService.API_ENDPOINT_VoucherDepriciationConfiguration + `/GetConfiguration`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetLedgerList: function GetLedgerList() {
        var URL = UrlService.API_ENDPOINT_VoucherDepriciationConfiguration + `/GetLedgerList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /** Returns { DebitBasis, CreditBasis, Period } from F_CommonValues */
    GetDropdownList: function GetDropdownList() {
        var URL = UrlService.API_ENDPOINT_VoucherDepriciationConfiguration + `/GetDropdownList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /** accountBasis: 2 = Asset Group, 3 = Asset Type, 4 = Asset */
    GetMappingList: function GetMappingList(accountBasis) {
        var URL = UrlService.API_ENDPOINT_VoucherDepriciationConfiguration
            + `/GetMappingList?AccountBasis=${encodeURIComponent(accountBasis || 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    /** payload = { Code, Master: [TY_VoucherDepriciationConfigurationMaster], Transactions: [TY_VoucherDepriciationConfigurationTransaction] } */
    SaveConfiguration: function SaveConfiguration(payload) {
        var URL = UrlService.API_ENDPOINT_VoucherDepriciationConfiguration
            + `/SaveConfiguration?UserMaster_Code=${encodeURIComponent(_userMasterCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload || {}));
    }
};

export { VoucherDepriciationConfigurationService };
