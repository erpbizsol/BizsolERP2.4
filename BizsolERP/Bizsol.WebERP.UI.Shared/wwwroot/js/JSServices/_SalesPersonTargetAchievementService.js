import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';
function getReportApiBase() {
    return (
        UrlService.API_ENDPOINT_SalesPersonTargetAchievementReport ||
        UrlService.API_ENDPOINT_SalesPersonTargetAchievement ||
        UrlService.API_ENDPOINT_CRMReports
    );
}

const SalesPersonTargetAchievementService = {
    GetWeekDateRange: function GetWeekDateRange() {
        var URL = `${getReportApiBase()}/GetWeekDateRange`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL =
            UrlService.API_ENDPOINT_SALESPERSON +
            `/GetNestedMarketingManList?UserMaster_Code=` +
            encodeURIComponent(userMasterCode) +
            `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** GET /SalesPersonTargetAchievementReport/GetRptTargetVsAchievement */
    GetRptTargetVsAchievement: function GetRptTargetVsAchievement(
        fromDate,
        toDate,
        mode,
        marketingManMaster_Code
    ) {
        var URL =
            `${getReportApiBase()}/GetRptTargetVsAchievement` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&Mode=${encodeURIComponent(mode || 'Week')}` +
            `&MarketingManMaster_Code=${encodeURIComponent(marketingManMaster_Code ?? 0)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetReportTypeList: function GetReportTypeList(moduleDesp) {
        var URL =
            `${getReportApiBase()}/GetReportTypeList` +
            `?ModuleDesp=${encodeURIComponent(moduleDesp)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { SalesPersonTargetAchievementService};
