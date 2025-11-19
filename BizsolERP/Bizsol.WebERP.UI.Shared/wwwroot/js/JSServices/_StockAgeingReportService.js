import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StockAgeingReportService = {
    GetStockAgeingReportList: function GetStockAgeingReportList() {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetStockAgeingReportList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { StockAgeingReportService }
