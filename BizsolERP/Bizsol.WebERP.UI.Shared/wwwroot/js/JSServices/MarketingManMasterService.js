import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * Marketing Man Master — matches BizSol.WebERP.DAL.Common.Masters.Service.MarketingManMasterService
 * and dbo.USP_WebAPI_MarketingManMaster (modes GETLIST, GETBYCODE, GETUSERLIST, GETSENIORLIST,
 * GETACCOUNTLIST, GETEXPENSECATEGORYLIST, GETZONELIST (GetZoneList), SAVE, DELETE).
 *
 * WebAPI base: UrlService.API_ENDPOINT_SALESPERSON (e.g. /api/MarketingMan). Query names must match
 * controller [FromQuery] binding — DAL uses ExcludeMarketingManCode and MarketingManMaster_CodeForAccounts.
 * Mode is set server-side in DAL; do not send Mode on GET unless your controller requires it.
 */
const MarketingManMasterService = {
    GetMarketingManMasterList: function GetMarketingManMasterList() {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/GetMarketingManMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetMarketingManMasterByCode: function GetMarketingManMasterByCode(code) {
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetMarketingManMasterByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Maps to GetMarketingManUserList → Mode GETUSERLIST, @ExcludeMarketingManCode. */
    GetMarketingManUserList: function GetMarketingManUserList(excludeMarketingManCode) {
        const ex = excludeMarketingManCode != null ? excludeMarketingManCode : 0;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetMarketingManUserList?ExcludeMarketingManCode=' +
            encodeURIComponent(ex);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Maps to GetSeniorMarketingManList → Mode GETSENIORLIST, @ExcludeMarketingManCode. */
    GetSeniorMarketingManList: function GetSeniorMarketingManList(excludeMarketingManCode) {
        const ex = excludeMarketingManCode != null ? excludeMarketingManCode : 0;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetSeniorMarketingManList?ExcludeMarketingManCode=' +
            encodeURIComponent(ex);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Maps to GetMarketingManAccountList → Mode GETACCOUNTLIST, @MarketingManMaster_CodeForAccounts (SP). */
    GetMarketingManAccountList: function GetMarketingManAccountList(marketingManMasterCodeForAccounts) {
        const mm = marketingManMasterCodeForAccounts != null ? marketingManMasterCodeForAccounts : 0;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/GetMarketingManAccountList?MarketingManMaster_CodeForAccounts=' +
            encodeURIComponent(mm);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Maps to GetExpenseCategoryList → Mode GETEXPENSECATEGORYLIST (MarketingManExpenseEntryCategory). */
    GetExpenseCategoryList: function GetExpenseCategoryList() {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/GetExpenseCategoryList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /** Maps to GetZoneList → Mode GETZONELIST (ZoneMaster rows for #ddlZone). */
    GetZoneList: function GetZoneList() {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/GetZoneList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveMarketingManMaster: function SaveMarketingManMaster(data) {
        const URL = UrlService.API_ENDPOINT_SALESPERSON + '/SaveMarketingManMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteMarketingManMaster: function DeleteMarketingManMaster(code, reason) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKeyData.UserMaster_Code || 0;
        const URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            '/DeleteMarketingManMaster?Code=' +
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
};

export { MarketingManMasterService };
