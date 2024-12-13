import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const GateEntryService = {
    GateEntryDate: function GateEntryDate(FormDate,ToDate) {
        var url = UrlService.API_ENDPOINT_GateEntryMaster + `/GateEntryDate?Fromdate=${FormDate}&Todate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetMinPending: function GetMinPending() {
        var url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetMinPending`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    getGateEntryMasterList: function getGateEntryMasterList() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetGateEntryMasterList`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetVendorOrClientNameListData: function GetVendorOrClientNameListData(type) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetVendorOrClientNameList?Type=${type}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetGateEntryDetails: function GetGateEntryDetails(Code) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/${type}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    Print: function Print(GateEntryMaster_Code, CompanyCode) {
        let url = `${UrlService.API_ENDPOINT_CRYSTAL}/PrintGateEntryReport?GateEntryMaster_Code=${GateEntryMaster_Code}&CompanyCode=${CompanyCode}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveGateEntryMaster: function SaveGateEntryMaster(payload, POItemsData, CompanyCode) {
        let url = `${UrlService.API_ENDPOINT_GateEntryMaster}/SaveGateEntryMaster?CompanyCode=${CompanyCode}&POItemsData=${POItemsData}`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteGateEntryMaster: function DeleteGateEntryMaster(code, reason) {
       let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let url = UrlService.API_ENDPOINT_GateEntryMaster + "/DeleteGateEntryMaster" + `?code=${code}&UserMaster_Code=${userCode}&ReasonForDelete=${reason}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    UpdateConfigGateEntry: function UpdateConfigGateEntry(ParameterName, ParameterValue){
        let url = `${UrlService.API_ENDPOINT_GateEntryMaster}/UpdateConfigGateEntry?ParameterName=${ParameterName}&ParameterValue=${ParameterValue}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetTransportersNameList: function GetTransportersNameList() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetTransportersNameList`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetConfigGateEntry: function GetConfigGateEntry() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/getConfigGateEntryTest`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }

}



export { GateEntryService }