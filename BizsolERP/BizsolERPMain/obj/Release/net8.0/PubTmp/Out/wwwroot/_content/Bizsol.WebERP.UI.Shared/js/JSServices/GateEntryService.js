import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const GateEntryService = {
    GateEntryDate: function GateEntryDate(FormDate, ToDate, QueryCondition=".") {
        var url = UrlService.API_ENDPOINT_GateEntryMaster + `/GateEntryDate?Fromdate=${FormDate}&Todate=${ToDate}&QueryCondition=${QueryCondition}`;
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
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/${Code}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    Print: function Print(GateEntryMaster_Code) {
        let CompanyCode = JSON.parse(sessionStorage.getItem('authKey')).CompanyCode;
        let url = `${UrlService.API_ENDPOINT_CRYSTAL}/PrintGateEntryReport?GateEntryMaster_Code=${GateEntryMaster_Code}&CompanyCode=${CompanyCode}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveGateEntryMaster: function SaveGateEntryMaster(payload, POItemsData,Mode) {
        let CompanyCode = JSON.parse(sessionStorage.getItem('authKey')).CompanyCode;
        let url = `${UrlService.API_ENDPOINT_GateEntryMaster}/SaveGateEntryMaster?CompanyCode=${CompanyCode}&Mode=${Mode}&POItemsData=${POItemsData}`;
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
    },
     GetGoodDespList: function GetGoodDespList() {
         let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetGoodDespList`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingPONO: function GetPendingPONO() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetPendingPONO`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    
    GetPOItems: function GetPOItems(purchaseOrderMaster_Code) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetPOItems?PurchaseOrderMaster_Code=${purchaseOrderMaster_Code}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    getPODetailByGateEntryCode: function getPODetailByGateEntryCode(gateEntryMaster_Code) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/getPODetailByGateEntryCode?Code=${gateEntryMaster_Code}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }, 
    
    getTransitMaterialList: function getTransitMaterialList(FormDate, ToDate) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/getTransitMaterialList?Fromdate=${FormDate}&Todate=${ToDate}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    getVehiclesStatusList: function getVehiclesStatusList(FormDate, ToDate) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/getVehiclesStatusList?Fromdate=${FormDate}&Todate=${ToDate}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUOMMasterList: function GetUOMMasterList() {
        let url = UrlService.API_ENDPOINT_UOM + `/GetUOMMasterList`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GateEntryCategoryIn: function GateEntryCategoryIn() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GateEntryCategoryIn`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GateEntryCategoryOut: function GateEntryCategoryOut() {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GateEntryCategoryOut`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDriverDetailsByVehicleNo: function GetDriverDetailsByVehicleNo(Mode, VehicleNo) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/GetDriverDetailsByVehicleNo?Mode=${Mode}&VehicleNo=${VehicleNo}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    getDll: function getDll(Mode) {
        let url = UrlService.API_ENDPOINT_GateEntryMaster + `/getDll?Mode=${Mode}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }

}



export { GateEntryService }