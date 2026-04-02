import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PurchaseQualityCheckService = {
    PurchaseQualityCheckList: function PurchaseQualityCheckList(MRNMaster_Code, TestTypeCodes) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetPurchaseQualityCheckDataList?MRNMaster_Code=${MRNMaster_Code}&TestTypeCodes=${TestTypeCodes}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMRNMasterDataForMRNNo: function GetMRNMasterDataForMRNNo(PartyMaster_Code, FinYear, G_MRNType) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetMRNMasterDataForMRNNo?PartyMaster_Code=${PartyMaster_Code}&FinYear=${FinYear}&MRNType=${G_MRNType}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMRNVendor: function GetMRNVendor() {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetMRNVendor`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMRNQCPropertyList: function GetMRNQCPropertyList(G_MRNType) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetMRNQCPropertyList?MRNType=${G_MRNType}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFinYear: function GetFinYear() {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetFinYear`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetGodownNameList: function GetGodownNameList() {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetGodownNameList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveMRNQCPropertyResult: function SaveMRNQCPropertyResult(data) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        const json = JSON.stringify(data, null, 2);
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/SaveMRNQCPropertyResult?UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json).then(
            function (value) {
                return value;
            }
        );
    },
    VerifyMRNQCPropertyResult: function VerifyMRNQCPropertyResult(Code) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/VerifyMRNQCPropertyResult?Code=" + Code + "&UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PrintMRNQCPropertyResult: function PrintMRNQCPropertyResult(Code) {
        var URL = `${UrlService.API_ENDPOINT_CRYSTAL}/WebPurchaseQualityCheck?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeletePurchaseQuality: function DeletePurchaseQuality(Code, Remark) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/DeletePurchaseQuality?Code=${encodeURIComponent(Code)}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${Remark}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    RawMaterialReportOfMaize: function RawMaterialReportOfMaize(Fromdate, Todate, ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetRawMaterialReportOfMaize?Fromdate=${Fromdate}&Todate=${Todate}&ItemMaster_Code=${ItemMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialItemList: function GetRawMaterialItemList() {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + "/GetRawMaterialItemList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { PurchaseQualityCheckService }


