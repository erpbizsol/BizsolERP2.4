import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PhysicalStockTakingItemService = {
    ScanCoilDetails: function ScanCoilDetails(IdentificationNo, ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanCoilDetails?IdentificationNo=" + IdentificationNo + "" + "&ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    AddPhysicalStock: function AddPhysicalStock(AsOnDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code, PhysicalStockTackingMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/AddPhysicalStock?AsOnDate=" + AsOnDate + "" + "&Remark=" + Remark + "" + "&IdentificationNo=" + IdentificationNo + "" + "&StockType=" + StockType + "" + "&ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeMaster_Code=" + ItemSizeMaster_Code + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&Status=" + Status + "" + "&GodownMaster_Code=" + GodownMaster_Code + "&PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RemovePhysicalStock: function RemovePhysicalStock(PhysicalStockTackingMaster_Code, TransactionCode) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/RemovePhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&TransactionCode=" + TransactionCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UpdateQtyInPhysicalStock: function UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, TransactionCode, QtyPC, QtyMT, QtyMTRS, TransactionStatus, Remark) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/UpdateQtyInPhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&TransactionCode=" + TransactionCode + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&TransactionStatus=" + TransactionStatus + "" + "&Remark=" + Remark + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeletePhysicalStock: function DeletePhysicalStock(PhysicalStockTackingMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/DeletePhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ScanIdDataListStockTacing: function ScanIdDataListStockTacing(ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanIdDataListStockTacing?ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PhysicalStockTackingTransactionDetails: function PhysicalStockTackingTransactionDetails(PhysicalStockTackingMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/PhysicalStockTackingTransactionDetails?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PhysicalStockTackingSummary: function PhysicalStockTackingSummary() {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/PhysicalStockTackingSummary";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PhysicalStockTackingSummaryByAsOnDate: function PhysicalStockTackingSummaryByAsOnDate( AsOnDate) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/PhysicalStockTackingSummaryByAsOnDate?AsOnDate=" + AsOnDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    PhysicalStockTackingReportAsOnDate: function PhysicalStockTackingReportAsOnDate(AsOnDate) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/PhysicalStockTackingReportAsOnDate?AsOnDate=" + AsOnDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParaMeter: function GetFixedParaMeter() {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/GetFixedParaMeter";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetWarehouse: function GetWarehouse() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/GetWarehouse?UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemName: function GetItemName() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/GetDDl?Mode=GetddlItemName&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetddlSizeDesp: function GetddlSizeDesp(ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/GetddlSizeDesp?ItemMaster_Code="+ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { PhysicalStockTakingItemService }