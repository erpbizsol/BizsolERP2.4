import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ReportsService = {
    GetReportTypeOfMaize: function GetReportTypeOfMaize(ModuleDesp) {
        var URL = UrlService.API_ENDPOINT_Reports + `/GetReportTypeOfMaize?ModuleDesp=${ModuleDesp}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { ReportsService }


