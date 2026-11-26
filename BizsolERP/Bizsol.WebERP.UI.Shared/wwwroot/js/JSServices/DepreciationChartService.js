import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const DepreciationChartService = {
    /** GET api/DepreciationChart/GetDepreciationChart?FromDate=&ToDate= — flat rows: group / type / asset */
    GetDepreciationChart: function GetDepreciationChart(fromDate, toDate) {
        var URL = UrlService.API_ENDPOINT_DEPRECIATION_CHART
            + '/GetDepreciationChart?FromDate=' + encodeURIComponent(fromDate || '')
            + '&ToDate=' + encodeURIComponent(toDate || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true }).then(function (value) {
            return value;
        });
    },

    /** GET api/DepreciationChart/GetFinYearStartDate — financial year start used as From date */
    GetFinYearStartDate: function GetFinYearStartDate() {
        var URL = UrlService.API_ENDPOINT_DEPRECIATION_CHART + '/GetFinYearStartDate';
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true }).then(function (value) {
            return value;
        });
    }
};

export { DepreciationChartService };
