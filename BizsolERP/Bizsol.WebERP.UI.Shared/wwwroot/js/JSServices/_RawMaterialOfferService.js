import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RawMaterialOfferService = {
    GetRawMaterialDropDown: function GetRawMaterialDropDown() {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialDropDown";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialGoDownName: function GetRawMaterialGoDownName() {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialGoDownName";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialClearanceList: function GetRawMaterialClearanceList(AccountMaster_Code, OrderNo, ProjectNo) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialClearanceList?AccountMaster_Code=" + AccountMaster_Code + "&OrderNo=" + OrderNo + "&ProjectNo=" + ProjectNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialClearanceVerify: function GetRawMaterialClearanceVerify(Code) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialClearanceVerify?Code=" + Code + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialClearanceReject: function GetRawMaterialClearanceReject(Code, RejectRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialClearanceReject?Code=" + Code + "&RejectRemark=" + RejectRemark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { RawMaterialOfferService }
