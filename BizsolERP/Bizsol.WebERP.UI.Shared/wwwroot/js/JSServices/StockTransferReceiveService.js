import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const StockTransferReceiveService = {
    GetPendingRoll: function GetPendingRoll(Godownmaster_Code, IdentificationNo) {
        var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetPendingRoll?Godownmaster_Code=" + Godownmaster_Code + "&IdentificationNo='" + IdentificationNo + "'";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
StockTransferWherehouseReceive: function StockTransferWherehouseReceive() {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/StockTransferWherehouseReceive";
    return this._http.post(url, {}, { headers: this.headers() });
},
GetWarehouse: function GetWarehouse() {
    
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetWarehouse?UserMaster_Code=" + UserMaster_Code;
    return this._http.get(url, { headers: this.headers() });
},
ItemWaiseVerifyRollIdInPackingList: function ItemWaiseVerifyRollIdInPackingList(Data) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/ItemWaiseVerifyRollIdInPackingList";

    return this._http.post(url, {}, { headers: this.headers() });
},
PackingActualPalletIDDispatch: function PackingActualPalletIDDispatch(PalletNo, PartyName, Data) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/PackingActualPalletIDDispatch?PalletNo='" + PalletNo +"'" + "&PartyName='" + PartyName+"'";
    return this._http.post(url, {}, { headers: this.headers() });
},
RemoveIDDispatch: function RemoveIDDispatch(PalletNo,PartyName) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/RemoveIDDispatch?PalletNo='" + PalletNo +"'" + "&PartyName='" + PartyName + "'";
    return this._http.post(url, {}, { headers: this.headers() });
},
GetPartyNamePendingPackingListActualDespatch: function GetPartyNamePendingPackingListActualDespatch() {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetPartyNamePendingPackingListActualDespatch";
    return this._http.get(url, { headers: this.headers() });
},
GetPendingPackingListPalletsActualDespatch: function GetPendingPackingListPalletsActualDespatch(PartyName) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetPendingPackingListPalletsActualDespatch?PartyName='" + PartyName + "'";
    return this._http.get(url, { headers: this.headers() });
},
}
export { StockTransferWherehouseReceive }