import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CoilProductionPlanService = {
    GetCoilProductionPlanGridView: function GetCoilProductionPlanGridView() {

       // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetCoilProductionPlanGridView";
       
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParaMeter: function GetFixedParaMeter() {

        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetFixedParaMeter";
        
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
    
    
}



export { CoilProductionPlanService }

