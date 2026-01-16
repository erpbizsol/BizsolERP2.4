import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CustomerDashboardService = {

GetCustomerDashboardData: function GetCustomerDashboardData(Mode, DealerCodes, FromDate, ToDate, CityCodes = '0') {

    const formatDate = (d) => {
        if (d === '0') return "0";
        // If it's already a Date object use it, otherwise try to parse
        const dt = (d instanceof Date) ? d : new Date(d);
        if (isNaN(dt)) return String(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const fd = formatDate(FromDate);
    const td = formatDate(ToDate);

    let url = `${UrlService.API_ENDPOINT_CustomerDashboard}/GetCustomerDashboardData`;
        
    const model = {
        Mode: Mode,
        DealerCodes: DealerCodes,
        FromDate: fd,
        ToDate: td,
        CityCodes: CityCodes
    };

        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(model)).then(
            function (value) {
                return value;
            }
        );
    }
}

export { CustomerDashboardService }

