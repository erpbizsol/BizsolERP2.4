import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const FGInspectedOfferService = {
    GetFGInspectedClearanceList: function GetFGInspectedClearanceList(AccountMaster_Code, OrderNo, ProjectNo, FromDate, ToDate, IsCompleted) {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/GetFGInspectedClearanceList?AccountMaster_Code=" + AccountMaster_Code + "&OrderNo=" + OrderNo + "&ProjectNo=" + ProjectNo + "&FromDate=" + FromDate + "&ToDate=" + ToDate + "&IsCompleted=" + IsCompleted;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFGInspectedClearanceVerify: function GetFGInspectedClearanceVerify(Code, RejectRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/GetFGInspectedClearanceVerify?Code=" + Code + "&RejectRemark=" + RejectRemark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFGInspectedClearanceReject: function GetFGInspectedClearanceReject(Code, RejectRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/GetFGInspectedClearanceReject?Code=" + Code + "&RejectRemark=" + RejectRemark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFGInspectedClearanceHold: function GetFGInspectedClearanceHold(Code,HoldRemark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/GetFGInspectedClearanceHold?Code=" + Code + "&HoldRemark=" + HoldRemark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBOMMasterDataOrderWise: function GetBOMMasterDataOrderWise(AccountMaster_Code, OrderNo, ProjectNo, Code) {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + `/GetBOMMasterDataOrderWise?AccountMaster_Code=${AccountMaster_Code}&OrderNo=${encodeURIComponent(OrderNo)}&ProjectNo=${encodeURIComponent(ProjectNo)}&Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveRMInspectionRequest: function SaveRMInspectionRequest(saveData) {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/SaveFGInspectedOffer";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(saveData)).then(
            function (value) {
                return value;
            }
        );
    },
    GetFGInspectedOfferList : function GetFGInspectedOfferList() {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + `/GetFGInspectedOfferList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMInspectionRequestDetailsEdit: function GetRMInspectionRequestDetailsEdit(Code, BomTransactionOrderWise_Code) {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + `/GetRMInspectionRequestDetailsEdit?Code=${Code}&BomTransactionOrderWise_Code=${BomTransactionOrderWise_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMInspectionRequestMasterEdit: function GetRMInspectionRequestMasterEdit(Code) {
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + `/GetRMInspectionRequestMasterEdit?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteFGDetailsByCode: function DeleteFGDetailsByCode(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + `/DeleteFGDetailsByCode?Code=${Code}&UserMaster_Code=${userCode}&ReasonForDelete=${ReasonForDelete}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveInspectedRemark: function SaveInspectedRemark(Code) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/SaveInspectedRemark?Code=" + Code + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAllFGClearanceVerify: function GetAllFGClearanceVerify(Codes, Remark) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_FGInspectedOffer + "/GetAllFGClearanceVerify?Codes=" + Codes + "&Remark=" + Remark + "&UserMaster_Code=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { FGInspectedOfferService }
