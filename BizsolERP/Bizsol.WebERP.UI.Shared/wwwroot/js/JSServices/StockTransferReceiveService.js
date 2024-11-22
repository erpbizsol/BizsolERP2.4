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
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
        );
},
GetWarehouse: function GetWarehouse() {
    let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetWarehouse?UserMaster_Code=" + userCode;
    return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
        function (value) {
            return value;
        }
    );
},
ItemWaiseVerifyRollIdInPackingList: function ItemWaiseVerifyRollIdInPackingList(Data) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/ItemWaiseVerifyRollIdInPackingList";

    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
PackingActualPalletIDDispatch: function PackingActualPalletIDDispatch(PalletNo, PartyName, Data) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/PackingActualPalletIDDispatch?PalletNo='" + PalletNo +"'" + "&PartyName='" + PartyName+"'";
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
RemoveIDDispatch: function RemoveIDDispatch(PalletNo,PartyName) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/RemoveIDDispatch?PalletNo='" + PalletNo +"'" + "&PartyName='" + PartyName + "'";
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
GetPartyNamePendingPackingListActualDespatch: function GetPartyNamePendingPackingListActualDespatch() {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetPartyNamePendingPackingListActualDespatch";
    return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
        function (value) {
            return value;
        }
    );
},
GetPendingPackingListPalletsActualDespatch: function GetPendingPackingListPalletsActualDespatch(PartyName) {
    var URL = UrlService.API_ENDPOINT_StockTransferReceive + "/GetPendingPackingListPalletsActualDespatch?PartyName='" + PartyName + "'";
    return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
        function (value) {
            return value;
        }
    );
},
}
export { StockTransferReceiveService }