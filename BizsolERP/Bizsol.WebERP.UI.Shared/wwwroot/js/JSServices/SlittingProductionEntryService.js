import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SlittingProductionEntryService = {
    GetSlittingPlanOrEntrySummary: function GetSlittingPlanOrEntrySummary(date, dateTo, filterType) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetSlittingPlanOrEntrySummary?Date=" + date + "&ToDate=" + dateTo + "&FilterType=" + filterType;
       
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParaMeter: function GetFixedParaMeter() {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetFixedParaMeter";
        
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    EditValidatePackingListBatchNo: function EditValidatePackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/EditValidatePackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code;
        
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyPackingListBatchNo: function VerifyPackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/VerifyPackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code ;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSlittingProductionEntryDDl: function GetSlittingProductionEntryDDl(ddlType, Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetSlittingProductionEntryDDl?ddlType=" + ddlType + "&Code=" + Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDetails: function GetDetails(Mode,Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetDetails?Mode=" + Mode + "&Code=" + Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingOrderList: function GetPendingOrderList(mode, Name, BuyerPOMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetPendingOrderList?Mode=" + mode + "&Name=" + encodeURIComponent(Name) + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ValidatePackingList: function ValidatePackingList(packingListMaster_Code,  onlyEntry, payload) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/ValidatePackingList?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + onlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    SavePackingList: function SavePackingList(packingListMaster_Code, onlyEntry,  payload) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/SavePackingList?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + onlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    GetShowPackingListData: function GetShowPackingListData(packingListMaster_Code, OnlyEntry="T") {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetShowPackingListData?PackingListMaster_Code=" + packingListMaster_Code + "&OnlyEntry=" + OnlyEntry;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    LoadingEndPackingListBatchNo: function LoadingEndPackingListBatchNo(PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/LoadingEndPackingListBatchNo?PackingListMaster_Code=" + PackingListMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ScanIdDataList: function ScanIdDataList(RMRequisitionMasterCode, FromGodownCode, BuyerPOMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetScanIdDataList?RMRequisitionMasterCode=" + RMRequisitionMasterCode + "&FromGodownCode=" + FromGodownCode + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    ScanPendingId: function ScanPendingId(BundleOrId, GodownMaster_Code, BuyerPOMaster_Code, DespatchAdvicemaster_Code, EntryDate, ShowAllStockasPerSize, PackingListMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/ScanPendingId?BundleOrId=" + encodeURIComponent(BundleOrId) + "&GodownMaster_Code=" + GodownMaster_Code + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&DespatchAdvicemaster_Code=" + DespatchAdvicemaster_Code + "&EntryDate=" + EntryDate + "&ShowAllStockasPerSize=" + ShowAllStockasPerSize + "&PackingListMaster_Code=" + PackingListMaster_Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    RemovePackingListTransaction: function RemovePackingListTransaction(packingListMaster_Code, packingListTransaction_Code, palletNo) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/RemovePackingListTransaction?PackingListMaster_Code=" + packingListMaster_Code + "&PackingListTransaction_Code=" + packingListTransaction_Code + "&PalletNo=" + palletNo; 
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    LoadNoofPalletInPackingList: function LoadNoofPalletInPackingList(payload) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/LoadNoofPalletInPackingList";
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    }
    
}



export { SlittingProductionEntryService }

