import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const WeighmentService = {

    GetMachinesList: function GetMachinesList() {

        let url = `${UrlService.API_ENDPOINT_Weighment}/GetMachinesList`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMachineWeight: function GetMachineWeight(MachineName) {

        let url = `${UrlService.API_ENDPOINT_Weighment}/GetMachineWeight?MachineName=${encodeURIComponent(MachineName)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    
    
}



export { WeighmentService }

