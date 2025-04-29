import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RollingProductionService = {
    GetRollingProductionPlanGridView: function GetRollingProductionPlanGridView(FromDate, Todate, Mode) {

        let url = UrlService.API_ENDPOINT_RollingProduction + "/GetRollingProductionPlanGridView?FromDate=" + FromDate + "&ToDate=" + Todate + "&Mode=" + Mode;
        
       
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetFixedParaMeter: function GetFixedParaMeter() {

        let url = UrlService.API_ENDPOINT_RollingProduction + "/GetFixedParaMeter";
        
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    Getddl: function Getddl(mode,code) {

        
        let url = UrlService.API_ENDPOINT_RollingProduction + "/Getddl?Mode=" + mode + "&Code="+code

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    UDF_GetPlanBatchIssueReceiveDetail: function UDF_GetPlanBatchIssueReceiveDetail(PayLoad) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/UDF_GetPlanBatchIssueReceiveDetail";

        return promiseAjaxCallApi.CallAPI('POST', url, PayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    SaveIssueID: function SaveIssueID(PayLoad) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/SaveIssueID";

        return promiseAjaxCallApi.CallAPI('POST', url, PayLoad).then(
            function (value) {
                return value;
            }
        );
    }
    
}



export { RollingProductionService }

