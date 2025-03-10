import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const PalletPackingService = {
    GetPackedPalletDateAndOrderWise: function GetPackedPalletDateAndOrderWise(Date, BuyerPOMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPackedPalletDateAndOrderWise?Date=" + Date + "" + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckDuplicateIDPallet: function CheckDuplicateIDPallet(IdentificationNo, ColForWhere, ColValue, PalletNo) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/CheckDuplicateIDPallet?IdentificationNo=" + IdentificationNo + "" + "&ColForWhere=" + ColForWhere + "" + "&ColValue=" + ColValue + "" + "&PalletNo=" + PalletNo + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    AddIDInPallet: function AddIDInPallet(ColForWhere, ColValue, PalletNo, PalletRemark, PalletWeight, Date, PalletType, BuyerPOMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/AddIDInPallet?ColForWhere=" + ColForWhere + "" + "&ColValue=" + ColValue + "" + "&PalletNo=" + PalletNo + "" + "&PalletRemark=" + PalletRemark + "" + "&PalletWeight=" + PalletWeight + "" + "&Date=" + Date + "" + "&PalletType=" + PalletType + "" + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code +"";
    
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    RemoveIDFromPallet: function RemoveIDFromPallet(ColForWhere, ColValue) {
    
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/RemoveIDFromPallet?ColForWhere=" + ColForWhere + "" + "&ColValue=" + ColValue + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    GetPendingIDOrderWise: function GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPendingIDOrderWise?BuyerPOMaster_Code=" + BuyerPOMaster_Code + "&GodownMaster_Code=" + GodownMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    GetPalletDetail: function GetPalletDetail(PalletNo) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPalletDetail?PalletNo=" + PalletNo + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    FillPendingOrder: function FillPendingOrder() {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillPendingOrder";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    FillWarehouse: function FillWarehouse() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillWarehouse?UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    FillPalletType: function FillPalletType() {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/FillPalletType";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    ScanID: function ScanID(IdentificationNo, GodownMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/ScanID?IdentificationNo=" + IdentificationNo + "" + "&GodownMaster_Code=" + GodownMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
        },
    EditPallet: function EditPallet(PalletNo, GodownMaster_Code, isAction) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/EditPallet?PalletNo=" + PalletNo + "" + "&GodownMaster_Code=" + GodownMaster_Code + "&isAction=" + isAction;
    return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
        function (value) {
            return value;
        }
    );
    },
    GetPackedPalletDate: function GetPackedPalletDate() {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/GetPackedPalletDate";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    Print: function Print(PalletNosToPrint,IsDownload) {
        let CompanyCode = JSON.parse(sessionStorage.getItem('authKey')).CompanyCode;
        let url = `${UrlService.API_ENDPOINT_CRYSTAL}/Printpallet?PalletNo=${PalletNosToPrint}&IsDownload=${IsDownload}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    RemovePallet: function RemovePallet(palletNo) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/RemovePallet?PalletNo=" + palletNo;

        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ExportInExcelPackedPalletDateAndOrderWise: function ExportInExcelPackedPalletDateAndOrderWise(Date, BuyerPOMaster_Code) {
        var URL = UrlService.API_ENDPOINT_PalletPacking + "/ExportInExcelPackedPalletDateAndOrderWise?Date=" + Date + "" + "&BuyerPOMaster_Code=" + BuyerPOMaster_Code + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { PalletPackingService }