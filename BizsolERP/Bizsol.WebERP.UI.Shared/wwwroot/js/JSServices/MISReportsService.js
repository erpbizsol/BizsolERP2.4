import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MISReportsServices = {

    GetDayWiseMISReports: function GetDayWiseMISReports(Date) {
        var URL = UrlService.API_ENDPOINT_MillWiseProductionReport + `/GetDayWiseMISReports?Date=` + Date;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

};

export { MISReportsServices };
