import { UrlService } from '../URL.js';
import { environment } from '../environment.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getApiBase() {
    const stand = UrlService.API_ENDPOINT_POGRNBillingReport;
    if (stand && String(stand).indexOf('undefined') === -1) {
        return String(stand).replace(/\/$/, '');
    }
    const base = String(UrlService.BASE_URL || environment.BASE_URL || '').replace(/\/$/, '');
    return base + '/POGRNBillingReport';
}

const POGRNBillingReportService = {
    GetPOGRNBillingReport: function GetPOGRNBillingReport(Status) {
        var URL = getApiBase() + `/GetPOGRNBillingReport?Status=${encodeURIComponent(Status || '')}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { POGRNBillingReportService };
