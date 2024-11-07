import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PhysicalStockTakingItemService = {
    ScanCoilDetails: function ScanCoilDetails(IdentificationNo, GodownMaster_Code, StockTaking, ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanCoilDetails?IdentificationNo='" + IdentificationNo + "'" + "&GodownMaster_Code=" + GodownMaster_Code + "&StockTaking='" + StockTaking + "'" + "&ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

ScanCoilDetails: function ScanCoilDetails(IdentificationNo, GodownMaster_Code, StockTaking, ItemMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanCoilDetails?IdentificationNo='" + IdentificationNo +"'" + "&GodownMaster_Code=" + GodownMaster_Code + "&StockTaking='" + StockTaking +"'" + "&ItemMaster_Code=" + ItemMaster_Code;
    return this._http.get(url, { headers: this.headers() });
},
AddPhysicalStock: function AddPhysicalStock(AsOnDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/AddPhysicalStock?AsOnDate='" + AsOnDate +"'" + "&Remark='" + Remark +"'" + "&IdentificationNo='" + IdentificationNo +"'" + "&StockType='" + StockType +"'" + "&ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeMaster_Code=" + ItemSizeMaster_Code + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&Status='" + Status +"'" + "&GodownMaster_Code=" + GodownMaster_Code;
    return this._http.get(url, { headers: this.headers() });
},
RemovePhysicalStock: function RemovePhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/RemovePhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&PhysicalStockTackingTransaction_Code=" + PhysicalStockTackingTransaction_Code;

    return this._http.get(url, { headers: this.headers() });
},
UpdateQtyInPhysicalStock: function UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code, QtyPC, QtyMT, QtyMTRS, Status, Remark) {

    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/UpdateQtyInPhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code + "&PhysicalStockTackingTransaction_Code" + PhysicalStockTackingTransaction_Code + "&QtyPC=" + QtyPC + "&QtyMT=" + QtyMT + "&QtyMTRS=" + QtyMTRS + "&Status='" + Status +"'" + "&Remark='" + Remark +"'";
    return this._http.get(url, { headers: this.headers() });
},
DeletePhysicalStock: function DeletePhysicalStock(PhysicalStockTackingMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/DeletePhysicalStock?PhysicalStockTackingMaster_Code=" + PhysicalStockTackingMaster_Code;
    return this._http.get(url, { headers: this.headers() });
},
ScanIdDeataListStockTacing: function ScanIdDeataListStockTacing(ItemMaster_Code, Type) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ScanIdDeataListStockTacing?ItemMaster_Code=" + ItemMaster_Code + "&Type='" + Type +"'";
    return this._http.get(url, { headers: this.headers() });
},
ShowPhysicalStockAsOnDate: function ShowPhysicalStockAsOnDate(AsOnDate) {
    var URL = UrlService.API_ENDPOINT_PhysicalStockTaking + "/ShowPhysicalStockAsOnDate?AsOnDate='" + AsOnDate +"'";
    return this._http.get(url, { headers: this.headers() });
},
}
export { PhysicalStockTakingItemService }