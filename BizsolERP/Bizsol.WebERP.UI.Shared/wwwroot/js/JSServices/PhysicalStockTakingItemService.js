import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PhysicalStockTakingItemService = {
    ScanCoilDetails: function ScanCoilDetails(IdentificationNo, GodownMaster_Code, StockTaking, ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanCoilDetails?IdentificationNo=" + IdentificationNo + "" + "&GodownMaster_Code=" + GodownMaster_Code + "&StockTaking=" + StockTaking + "" + "&ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    AddPhysicalStock: function AddPhysicalStock(AsOnDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/AddPhysicalStock?AsOnDate=" + AsOnDate + "" + "&Remark=" + Remark + "" + "&IdentificationNo=" + IdentificationNo + "" + "&StockType=" + StockType + "" + "&ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeMaster_Code=" + ItemSizeMaster_Code + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&Status=" + Status + "" + "&GodownMaster_Code=" + GodownMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RemovePhysicalStock: function RemovePhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/RemovePhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&PhysicalStockTackingTransaction_Code=" + PhysicalStockTackingTransaction_Code;

        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UpdateQtyInPhysicalStock: function UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code, QtyPC, QtyMT, QtyMTRS, Status, Remark) {

        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/UpdateQtyInPhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&PhysicalStockTackingTransaction_Code" + PhysicalStockTackingTransaction_Code + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&Status=" + Status + "" + "&Remark=" + Remark + "";
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
    ScanIdDataListStockTacing: function ScanIdDataListStockTacing() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanIdDeataListStockTacing?UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ShowPhysicalStockAsOnDate: function ShowPhysicalStockAsOnDate(AsOnDate) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ShowPhysicalStockAsOnDate?AsOnDate=" + AsOnDate + "";
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
}
export { PhysicalStockTakingItemService }