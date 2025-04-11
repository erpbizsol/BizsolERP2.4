import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CoilProductionPlanService = {
    GetCoilProductionPlanGridView: function GetCoilProductionPlanGridView(mode) {

       // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetCoilProductionPlanGridView?Mode=" + mode;
       
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
    },

    Getddl: function Getddl( mode,  code, itemSizeMaster_Code) {

        // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/Getddl?Mode=" + mode + "&Code=" + code + "&ItemSizeMaster_Code=" + itemSizeMaster_Code;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetddlForGrid: function GetddlForGrid(mode, code, itemSizeMaster_Code,elementID) {

        // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/Getddl?Mode=" + mode + "&Code=" + code + "&ItemSizeMaster_Code=" + itemSizeMaster_Code;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                let resobj = {
                    Respone: value,
                    ElementID: elementID
                }
                return resobj;
            }
        );
    },
    SaveCoilPlan: function SaveCoilPlan(payload) {

        // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/SaveCoilPlan";

        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },

    ShowCoilPlan: function ShowCoilPlan(Code,rno) {

        // let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        let url = UrlService.API_ENDPOINT_CoilProductionPlan + "/ShowCoilPlan?Code=" + Code;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                let resobj = {
                    Respone: value,
                    Rno: rno
                }
                return resobj;
            }
        );
    },
    
}



export { CoilProductionPlanService }

