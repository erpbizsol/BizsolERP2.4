import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const TargetDashboardReportService = {
    
    GetDashboard: function GetDashboard(FromDate, ToDate, Code, FinYear) {
        const base = UrlService.API_ENDPOINT_DEALER_TARGET_MASTER;
        const URL =
            base +
            '/GetTargetDashboardReport?FromDate=' +
            encodeURIComponent(FromDate == null ? '' : FromDate) +
            '&ToDate=' +
            encodeURIComponent(ToDate == null ? '' : ToDate) +
            '&Code=' +
            encodeURIComponent(Code == null ? 0 : Code) +
            '&FinYear=' +
            encodeURIComponent(FinYear == null ? '' : FinYear);
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true }).then(function (value) {
            return value;
        });
    },
};

export { TargetDashboardReportService };
