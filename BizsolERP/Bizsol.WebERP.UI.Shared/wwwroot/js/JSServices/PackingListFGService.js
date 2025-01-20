import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PackingListFGService = {
    GetPackingListWebLocate: function GetPackingListWebLocate(date,dateTo) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
       
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParaMeter: function GetFixedParaMeter() {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetFixedParaMeter";
        
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    EditValidatePackingListBatchNo: function EditValidatePackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/EditValidatePackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code;
        
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyPackingListBatchNo: function VerifyPackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/VerifyPackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code ;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPackingListDDl: function GetPackingListDDl(ddlType) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetPackingListDDl?ddlType=" + ddlType;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetReqDetails: function GetReqDetails(RMRequisitionMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetReqDetails?Code=" + RMRequisitionMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingOrderList: function GetPendingOrderList(mode, Name) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetPendingOrderList?Mode=" + mode + "&Name=" + encodeURI(Name);
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
    
}



export { PackingListFGService }

