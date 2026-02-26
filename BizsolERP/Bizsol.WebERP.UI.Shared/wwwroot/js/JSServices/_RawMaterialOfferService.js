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
    GetRawMaterialClearanceList: function GetRawMaterialClearanceList(AccountMaster_Code, OrderNo, ProjectNo, FromDate, ToDate, IsCompleted) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialClearanceList?AccountMaster_Code=" + AccountMaster_Code + "&OrderNo=" + OrderNo + "&ProjectNo=" + ProjectNo + "&FromDate=" + FromDate + "&ToDate=" + ToDate + "&IsCompleted=" + IsCompleted;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialClearanceVerify: function GetRawMaterialClearanceVerify(Code, RejectRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialClearanceVerify?Code=" + Code + "&RejectRemark=" + RejectRemark + "&UserMaster_Code=" + userCode;
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
    GetBOMMasterDataOrderWise: function GetBOMMasterDataOrderWise(AccountMaster_Code,OrderNo,ProjectNo,Code) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/GetBOMMasterDataOrderWise?AccountMaster_Code=${AccountMaster_Code}&OrderNo=${encodeURIComponent(OrderNo)}&ProjectNo=${encodeURIComponent(ProjectNo)}&Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBOMMasterIdentificationNo: function GetBOMMasterIdentificationNo(BomTransactionOrderWise_Code) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/GetBOMMasterIdentificationNo?BomTransactionOrderWise_Code=${BomTransactionOrderWise_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveRMInspectionRequest: function SaveRMInspectionRequest(saveData) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/SaveRawMaterialOffer";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(saveData)).then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialOfferList: function GetRawMaterialOfferList() {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/GetRawMaterialOfferList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMInspectionRequestDetailsEdit: function GetRMInspectionRequestDetailsEdit(Code, BomTransactionOrderWise_Code) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/GetRMInspectionRequestDetailsEdit?Code=${Code}&BomTransactionOrderWise_Code=${BomTransactionOrderWise_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMInspectionRequestMasterEdit: function GetRMInspectionRequestMasterEdit(Code) {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/GetRMInspectionRequestMasterEdit?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteRawMaterialOffer: function DeleteRawMaterialOffer(Code, ReasonForDelete,Mode, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + `/DeleteRawMaterialDetailsByCode?Code=${Code}&UserMaster_Code=${userCode}&ReasonForDelete=${ReasonForDelete}&Mode=${Mode}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveInspectedRemark: function SaveInspectedRemark(Code) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/SaveInspectedRemark?Code=" + Code + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAllRawMaterialClearanceVerify: function GetAllRawMaterialClearanceVerify(Codes, Remark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetAllRawMaterialClearanceVerify?Codes=" + Codes + "&Remark=" +Remark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMClearanceHold: function GetRMClearanceHold(Code, HoldRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRMClearanceHold?Code=" + Code + "&HoldRemark=" + HoldRemark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { RawMaterialOfferService }
