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
    GetDetails: function GetDetails(Mode,Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetDetails?Mode=" + Mode + "&Code=" + Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingOrderList: function GetPendingOrderList(mode, Name, BuyerPOMaster_Code, FromGodownCode) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetPendingOrderList?Mode=" + mode + "&Name=" + encodeURIComponent(Name) + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&FromGodownCode=" + FromGodownCode;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ValidatePackingList: function ValidatePackingList(packingListMaster_Code,  onlyEntry, payload) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/ValidatePackingList?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + onlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    SavePackingList: function SavePackingList(packingListMaster_Code, onlyEntry,  payload) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/SavePackingList?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + onlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    GetShowPackingListData: function GetShowPackingListData(packingListMaster_Code, OnlyEntry="T") {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetShowPackingListData?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + OnlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    LoadingEndPackingListBatchNo: function LoadingEndPackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/LoadingEndPackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ScanIdDataList: function ScanIdDataList(RMRequisitionMasterCode, FromGodownCode, BuyerPOMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetScanIdDataList?RMRequisitionMasterCode=" + RMRequisitionMasterCode + "&FromGodownCode=" + FromGodownCode + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ScanPendingId: function ScanPendingId(BundleOrId, GodownMaster_Code, BuyerPOMaster_Code, DespatchAdvicemaster_Code, EntryDate, ShowAllStockasPerSize, PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/ScanPendingId?BundleOrId=" + encodeURIComponent(BundleOrId) + "&GodownMaster_Code=" + GodownMaster_Code + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&DespatchAdvicemaster_Code=" + DespatchAdvicemaster_Code + "&EntryDate=" + EntryDate + "&ShowAllStockasPerSize=" + ShowAllStockasPerSize + "&PackingListMaster_Code=" + PackingListMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    RemovePackingListTransaction: function RemovePackingListTransaction(packingListMaster_Code, packingListTransaction_Code, palletNo) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/RemovePackingListTransaction?PackingListMaster_Code=" + packingListMaster_Code + "&PackingListTransaction_Code=" + packingListTransaction_Code + "&PalletNo=" + palletNo; 
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    LoadNoofPalletInPackingList: function LoadNoofPalletInPackingList(payload, showAllStockasPerSize) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/LoadNoofPalletInPackingList?ShowAllStockasPerSize=" + showAllStockasPerSize;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    GetNotfoundScanInfoInPackingList: function GetNotfoundScanInfoInPackingList(BundleOrIdOrBatch) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetNotfoundScanInfoInPackingList?BundleOrIdOrBatch="+BundleOrIdOrBatch;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}



export { PackingListFGService }

