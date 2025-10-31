import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CustomerDashboardService = {

    GetCustomerDashboardData: function GetCustomerDashboardData(Mode,DealerCodes) {

        let url = `${UrlService.API_ENDPOINT_CustomerDashboard}/GetCustomerDashboardData?Mode=${Mode}&DealerCodes=${DealerCodes}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
    
    
}



export { CustomerDashboardService }

