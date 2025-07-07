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
    },
    GetPVCProductionMaster_Code: function GetPVCProductionMaster_Code(PayLoad) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/GetPVCProductionMaster_Code";

        return promiseAjaxCallApi.CallAPI('POST', url, PayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    UpdateIssueIDQtyMT: function UpdateIssueIDQtyMT(pVCProductionMaster_Code, qtyMT, pVCProductionIssueDetails_Code) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/UpdateIssueIDQtyMT?PVCProductionMaster_Code=" + pVCProductionMaster_Code + "&QtyMT=" + qtyMT + "&PVCProductionIssueDetails_Code=" + pVCProductionIssueDetails_Code;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetTotalIssueOrReciveWeightByPlanBatchNo: function GetTotalIssueOrReciveWeightByPlanBatchNo(planBatchNo, mode, itemSizeMaster, pVCProductionMaster_Code) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/GetTotalIssueOrReciveWeightByPlanBatchNo?PlanBatchNo=" + planBatchNo + "&Mode=" + mode + "&ItemSizeMaster=" + itemSizeMaster + "&PVCProductionMaster_Code=" + pVCProductionMaster_Code;

            return promiseAjaxCallApi.CallAPI('GET', url, "").then(
                function (value) {
                    return value;
                }
            );
    },
    UDF_ValidatePipePCWeightWithCalculated: function UDF_ValidatePipePCWeightWithCalculated(PlanBatchNo, QtyPC, QtyMT) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/UDF_ValidatePipePCWeightWithCalculated?PlanBatchNo=" + PlanBatchNo + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveRecevied: function SaveRecevied(PayLoad) {


        let url = UrlService.API_ENDPOINT_RollingProduction + "/SaveRecevied";

        return promiseAjaxCallApi.CallAPI('POST', url, PayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    
}



export { RollingProductionService }

