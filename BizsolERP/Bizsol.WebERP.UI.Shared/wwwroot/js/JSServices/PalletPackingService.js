import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PalletPackingService = {
    GetPackedPalletDateAndOrderWise: function GetPackedPalletDateAndOrderWise(Date, BuyerPOMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPackedPalletDateAndOrderWise?Date='" + Date + "'" + "&BuyerPOMaster_Code='" + BuyerPOMaster_Code + "'";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckDuplicateIDPallet: function CheckDuplicateIDPallet(ColForWhere, ColValue, PalletNo, IdentificationNo) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/CheckDuplicateIDPallet?ColForWhere='" + ColForWhere + "'" + "&ColValue='" + ColValue + "'" + "&PalletNo='" + PalletNo + "'" + "&IdentificationNo='" + IdentificationNo + "'";
        return this._http.get(url, { headers: this.headers() });
    },
AddIDInPallet: function AddIDInPallet(ColForWhere, ColValue, PalletNo, PalletRemark, PalletWeight, Date, PalletType) {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/AddIDInPallet?ColForWhere='" + ColForWhere + "'" + "&ColValue='" + ColValue + "'" + "&PalletNo='" + PalletNo + "'" + "&PalletRemark='" + PalletRemark + "'" + "&PalletWeight'" + PalletWeight + "'" + "&Date='" + Date + "'" + "&PalletType='" + PalletType + "'";

        return this._http.post(url, {}, { headers: this.headers() });
    },
RemoveIDFromPallet: function RemoveIDFromPallet(ColForWhere, ColValue) {

    var URL = UrlService.API_ENDPOINT_PalletPacking + "/RemoveIDFromPallet?ColForWhere='" + ColForWhere + "'" + "&ColValue'" + ColValue + "";
        return this._http.get(url, { headers: this.headers() });
    },
GetPendingIDOrderWise: function GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPendingIDOrderWise?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&GodownMaster_Code=" + GodownMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
GetPalletDetail: function GetPalletDetail(PalletNo) {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPalletDetail?PalletNo='" + PalletNo + "'";
        return this._http.get(url, { headers: this.headers() });
    },
FillPendingOrder: function FillPendingOrder() {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillPendingOrder";
        return this._http.get(url, { headers: this.headers() });
    },
FillWarehouse: function FillWarehouse() {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillWarehouse?UserMaster_Code=" + UserMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
FillPalletType: function FillPalletType() {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillPalletType";
        return this._http.get(url, { headers: this.headers() });
    },
ScanID: function ScanID(IdentificationNo, GodownMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/ScanID?IdentificationNo='" + IdentificationNo + "'" + "&GodownMaster_Code=" + GodownMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
EditPallet: function EditPallet(PalletNo, GodownMaster_Code) {
    var URL = UrlService.API_ENDPOINT_PalletPacking + "/EditPallet?PalletNo='" + PalletNo + "'" + "&GodownMaster_Code=" + GodownMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
}

export { PalletPackingService }