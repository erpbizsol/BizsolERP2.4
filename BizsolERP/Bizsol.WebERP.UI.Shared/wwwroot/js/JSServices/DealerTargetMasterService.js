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

/**
 * Dealer Target Master
 * GetNestedDealerList -> AccountMaster (UDF nested / MarketingManClientDetails when IsNested = N)
 * GetDealerLocate     -> DealerMaster GetDealerLocate (DealerName, CityName, Sales Person, Status)
 */
const DealerTargetMasterService = {
    /**
     * Nested sales persons for the logged-in user (GetNestedMarketingManList).
     */
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        const userMasterCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetNestedMarketingManList?UserMaster_Code=' +
            encodeURIComponent(userMasterCode) +
            '&MarketingManMaster_Code=0';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * Parties (AccountMaster) for the logged-in user / selected marketing person.
     * IsNested = N -> only that person's MarketingManClientDetails
     * IsNested = Y -> UDF_GetNestedDealerList (team hierarchy)
     */
    GetNestedDealerList: function GetNestedDealerList(MarketingManMaster_Code, IsNested) {
        const userMasterCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_DEALER_TARGET_MASTER +
            '/GetNestedDealerList?UserMaster_Code=' +
            encodeURIComponent(userMasterCode) +
            '&MarketingManMaster_Code=' +
            encodeURIComponent(MarketingManMaster_Code ?? 0) +
            '&IsNested=' +
            encodeURIComponent(IsNested == null || IsNested === '' ? 'N' : IsNested);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

 

    /** Month options (MonthNameWithYear) for Dealer Target. */
    GetMonth: function GetMonth() {
        const URL = UrlService.API_ENDPOINT_DEALER_TARGET_MASTER + '/GetMonth';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Active dealers for the selected party (DealerMaster GetDealerLocate). */
    GetDealerLocate: function GetDealerLocate(AccountDesp, FinYear, TargetedDate, TargetFor) {
        const URL =
            UrlService.API_ENDPOINT_DEALER_TARGET_MASTER +
            '/GetDealerLocate?AccountDesp=' +
            encodeURIComponent(AccountDesp == null ? '' : AccountDesp) +
            '&FinYear=' +
            encodeURIComponent(FinYear == null ? '' : FinYear) +
            '&TargetedDate=' +
            encodeURIComponent(TargetedDate == null ? '' : TargetedDate) +
            '&TargetFor=' +
            encodeURIComponent(TargetFor == null ? '' : TargetFor);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Saved dealer target header + amounts by DealerTargetMaster.Code. */
    GetByCodeData: function GetByCodeData(Code) {
        const URL =
            UrlService.API_ENDPOINT_DEALER_TARGET_MASTER +
            '/GetByCodeData?Code=' +
            encodeURIComponent(Code ?? 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * Save VW_DealerTarget:
     * DealerTargetMaster (TY_DealerTargetMaster) + DealerTargetTransaction (TY_DealerTargetTransaction)
     */
    SaveDealerTarget: function SaveDealerTarget(data) {
        const userMasterCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_DEALER_TARGET_MASTER +
            '/SaveDealerTarget?UserMaster_Code=' +
            encodeURIComponent(userMasterCode);
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },

    /** Dealer Target Report — FromDate / ToDate (USP Mode GETDEALERTARGETREPORT). */
    GetDealerTargetReport: function GetDealerTargetReport(FromDate, ToDate) {
        const URL =
            UrlService.API_ENDPOINT_DEALER_TARGET_MASTER +
            '/GetDealerTargetReport?FromDate=' +
            encodeURIComponent(FromDate == null ? '' : FromDate) +
            '&ToDate=' +
            encodeURIComponent(ToDate == null ? '' : ToDate);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    }

  
};

export { DealerTargetMasterService };
