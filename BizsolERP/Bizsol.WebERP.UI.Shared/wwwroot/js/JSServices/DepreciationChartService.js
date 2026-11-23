import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const DepreciationChartService = {
    /** GET api/DepreciationChart/GetDepreciationChart — flat rows: group / type / asset */
    GetDepreciationChart: function GetDepreciationChart() {
        var URL = UrlService.API_ENDPOINT_DEPRECIATION_CHART + '/GetDepreciationChart';
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true }).then(function (value) {
            return value;
        });
    }
};

export { DepreciationChartService };
