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
        marketingManMaster_Code,
        isNested
    ) {
        var URL =
            `${getReportApiBase()}/GetRptTargetVsAchievement` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&Mode=${encodeURIComponent(mode || 'Week')}` +
            `&MarketingManMaster_Code=${encodeURIComponent(marketingManMaster_Code ?? 0)}` +
            `&IsNested=${encodeURIComponent(isNested ?? 'Y')}`;
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
    SendWhatsappToMarketingMan: function SendWhatsappToMarketingMan(
        reportType,
        link,
        marketingManMaster_Code,
        isNested
    ) {
        var URL =
            `${getReportApiBase()}/SendWhatsappToMarketingMan` +
            `?ReportType=${encodeURIComponent(reportType || '')}` +
            `&Link=${encodeURIComponent(link || '')}` +
            `&MarketingManMaster_Code=${encodeURIComponent(marketingManMaster_Code ?? 0)}` +
            `&IsNested=${encodeURIComponent(isNested ?? 'Y')}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    UploadWhatsappFile: function UploadWhatsappFile(fileName, fileExtension, fileBase64String) {
       var URL =
            (typeof window !== 'undefined' && window.UPLOAD_WHATSAPP_URL) ||
            '/SalesTransactions/SalesTransactions/UploadWhatsappFile';
        var payload = JSON.stringify({
            FileName: fileName,
            FileExtension: fileExtension,
            FileDataBase64string: fileBase64String,
        });
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: URL,
                method: 'POST',
                contentType: 'application/json',
                dataType: 'text',
                data: payload,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    var msg = (xhr && xhr.responseText) ? xhr.responseText.trim() : '';
                    if (!msg) {
                        msg = status + ': ' + error;
                    }
                    reject(new Error(msg));
                },
            });
        });
    },
};

export { SalesPersonTargetAchievementService};
