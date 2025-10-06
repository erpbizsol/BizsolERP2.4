import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CustomerDashboardService = {

    GetMachinesList: function GetMachinesList() {

        let url = `${UrlService.API_ENDPOINT_Weighment}/GetMachinesList`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
    
}



export { CustomerDashboardService }

