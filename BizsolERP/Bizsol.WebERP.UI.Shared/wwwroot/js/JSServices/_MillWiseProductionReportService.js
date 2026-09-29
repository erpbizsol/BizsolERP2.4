import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MillWiseProductionReport = {
    GetItemSizeWiseAndMonthWiseData: function GetItemSizeWiseAndMonthWiseData(Json) {
        var json_data = JSON.stringify(Json, null, 2);
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/GetItemSizeWiseAndMonthWiseData`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetItemSizeParameter: function GetItemSizeParameter() {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/GetItemSizeParameter`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
    GetMachineNo: function GetMachineNo() {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/GetMachineNo`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
    GetMillWiseProductionReport: function GetMillWiseProductionReport(fromDate, toDate) {
        var URL = UrlService.API_ENDPOINT_MillWiseProductionReport +
            `/GetMillWiseProductionReport?FromDate=` + encodeURIComponent(fromDate) +
            `&ToDate=` + encodeURIComponent(toDate);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
    GetMillWiseProductionFilters: function GetMillWiseProductionFilters(GroupTypeMaster_Code, MarketingManMaster_Codes) {
        var gtCode = (GroupTypeMaster_Code !== undefined && GroupTypeMaster_Code !== null && GroupTypeMaster_Code !== '') ? GroupTypeMaster_Code : 0;
        var mmCode = (MarketingManMaster_Codes !== undefined && MarketingManMaster_Codes !== null && MarketingManMaster_Codes !== 0) ? MarketingManMaster_Codes : "All";
        var URL = UrlService.API_ENDPOINT_MillWiseProductionReport +
            `/GetMillWiseProductionFilters?GroupTypeMaster_Code=` + encodeURIComponent(gtCode) +
            `&MarketingManMaster_Codes=` + encodeURIComponent(mmCode);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
    GetGroupTypeMaster: function GetGroupTypeMaster() {
        var URL = UrlService.API_ENDPOINT_MillWiseProductionReport + `/GetGroupTypeMaster`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
    GetMarketingManMasterByCR_DR: function GetMarketingManMasterByCR_DR(GroupTypeMaster_Code) {
        var gtCode = (GroupTypeMaster_Code !== undefined && GroupTypeMaster_Code !== null && GroupTypeMaster_Code !== '') ? GroupTypeMaster_Code : 0;
        var URL = UrlService.API_ENDPOINT_MillWiseProductionReport +
            `/GetMarketingManMasterByCR_DR?GroupTypeMaster_Code=` + encodeURIComponent(gtCode);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },
}

export { MillWiseProductionReport }
