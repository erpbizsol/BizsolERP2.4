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
}

export { MillWiseProductionReport }
