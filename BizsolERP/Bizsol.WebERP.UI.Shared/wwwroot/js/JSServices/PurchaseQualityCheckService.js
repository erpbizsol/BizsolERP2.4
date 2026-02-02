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
    GetMRNMasterDataForMRNNo: function GetMRNMasterDataForMRNNo(PartyMaster_Code, FinYear) {
        var URL = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetMRNMasterDataForMRNNo?PartyMaster_Code=${PartyMaster_Code}&FinYear=${FinYear}`;
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
}

export { PurchaseQualityCheckService }


