import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const CollectionCommitmentService = {
    CollectionCommitmentOrderByList: function CollectionCommitmentOrderByList() {
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/CollectionCommitmentOrderByList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    CollectionCommitmentTable: function CollectionCommitmentTable(Date, OrderBy) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/CollectionCommitmentTable?Date=" + Date + "" + "&OrderBy=" + OrderBy + "" + "&UserCode=" + userCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveCollectionCommitment: function SaveCollectionCommitment(Date,Data) {
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/SaveCollectionCommitment?Date=" + Date + "";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteCollectionCommitment: function DeleteCollectionCommitment(PartyMaster_Code, Date) {
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/DeleteCollectionCommitment?PartyMaster_Code=" + PartyMaster_Code + "&Date=" + Date +"";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CollectionCommitmentReportTable: function CollectionCommitmentReportTable(FromDate, ToDate) {
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/CollectionCommitmentReportTable?FromDate=" + FromDate + "" + "&ToDate=" + ToDate + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CollectionCommitmentCheckSenior: function CollectionCommitmentCheckSenior(Code) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CollectionCommitment + "/CollectionCommitmentCheckSenior?UserMaster_Code=" + userCode + "" + "&Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { CollectionCommitmentService }