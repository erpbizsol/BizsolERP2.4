import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RmIndentService = {
    GetRmIndentList: function GetRmIndentList() {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetRmIndentList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Get indent by ID
    GetIndentById: function GetIndentById(indentId) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetIndentById?indentId=" + indentId;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Get indents by status
    GetIndentsByStatus: function GetIndentsByStatus(status) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetIndentsByStatus?status=" + status;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Create new indent
    CreateIndent: function CreateIndent(indentData) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/CreateIndent";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(indentData)).then(
            function (value) {
                return value;
            }
        );
    },

    // Update existing indent
    UpdateIndent: function UpdateIndent(indentId, indentData) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/UpdateIndent?indentId=" + indentId;
        return promiseAjaxCallApi.CallAPI('PUT', URL, JSON.stringify(indentData)).then(
            function (value) {
                return value;
            }
        );
    },

    // Delete indent
    DeleteIndent: function DeleteIndent(indentId) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RmIndent + "/DeleteIndent?indentId=" + indentId + "&userCode=" + userCode;
        return promiseAjaxCallApi.CallAPI('DELETE', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Approve indent
    ApproveIndent: function ApproveIndent(indentId) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let GroupMaster_Code = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        var URL = UrlService.API_ENDPOINT_RmIndent + "/ApproveIndent?indentId=" + indentId + "&userCode=" + userCode + "&groupCode=" + GroupMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Reject indent
    RejectIndent: function RejectIndent(indentId, reason) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let GroupMaster_Code = JSON.parse(sessionStorage.getItem('UserDetails'))[0].GroupMaster_Code;
        var URL = UrlService.API_ENDPOINT_RmIndent + "/RejectIndent?indentId=" + indentId + "&userCode=" + userCode + "&groupCode=" + GroupMaster_Code + "&reason=" + encodeURIComponent(reason);
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Mark as purchased
    MarkAsPurchased: function MarkAsPurchased(indentId, purchasedDate) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_RmIndent + "/MarkAsPurchased?indentId=" + indentId + "&userCode=" + userCode + "&purchasedDate=" + purchasedDate;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Get indent history
    GetIndentHistory: function GetIndentHistory(indentId) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/GetIndentHistory?indentId=" + indentId;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    // Search indents
    SearchIndents: function SearchIndents(searchCriteria) {
        var URL = UrlService.API_ENDPOINT_RmIndent + "/SearchIndents";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(searchCriteria)).then(
            function (value) {
                return value;
            }
        );
    }
}

export { RmIndentService }
