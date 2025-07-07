import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const AttachmentControlService = {
    GetAttachmentUploadFiles: function GetAttachmentUploadFiles(MasterTableName, MasterTableCode, DetailTableName, DetailTableCode) {

        let url = UrlService.API_DOCUMENT_ATTECHMENT + `/GetAllDocumentAttachment?MasterTableName=${MasterTableName}&MasterTableCode=${MasterTableCode}&MasterTableCode=${MasterTableCode}&DetailTableName=${DetailTableName}&DetailTableCode=${DetailTableCode}`
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteImage: function DeleteImage(Code, ReasonForDelete) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let url = UrlService.API_DOCUMENT_ATTECHMENT + `/DeleteDocumentMaster?Code=${Code}&UserMaster_Code=${userCode}&ReasonForDelete=${ReasonForDelete}`

        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    DownloadAllAttachment: function DownloadAllAttachment(MasterTableName, MasterTableCode, DetailTableName, DetailTableCode) {
        //let url = UrlService.API_DOCUMENT_ATTECHMENT + `/DownloadAllAttachment?MasterTableName=${MasterTableName}&MasterTableCode=${MasterTableCode}&DetailTableName=${''}&DetailTableCode=${0}`
        let url = UrlService.API_DOCUMENT_ATTECHMENT + `/DownloadAllAttachment?MasterTableName=${MasterTableName}&MasterTableCode=${MasterTableCode}&DetailTableName=${DetailTableName}&DetailTableCode=${DetailTableCode}`
        return promiseAjaxCallApi.CallAPIasBlobObj('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveAttachment: function SaveAttachment(PayLoadData) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let url = UrlService.API_DOCUMENT_ATTECHMENT + `/SaveDocumentMaster?UserMaster_Code=${userCode}`
        return promiseAjaxCallApi.CallAPI('POST', url, PayLoadData).then(
            function (value) {
                return value;
            }
        );
    },
    DownloadAttachment: function DownloadAttachment(DocumentMaster_Code) {
        let url = UrlService.API_DOCUMENT_ATTECHMENT + `/ShowDocumentAttachment?DocumentMaster_Code=${DocumentMaster_Code}&IsDownload=Y`
        return promiseAjaxCallApi.CallAPIasBlobObj('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
}


export { AttachmentControlService }

