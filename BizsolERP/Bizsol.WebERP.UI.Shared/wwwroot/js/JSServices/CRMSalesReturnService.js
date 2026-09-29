import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CRMSalesReturnService = {
    GetCRMSalesReturnLocate: function GetCRMSalesReturnLocate(fromDate, ToDate) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey')) || {};
        var UserMaster_Code = authKeyData.UserMaster_Code || 0;
        var URL = UrlService.API_ENDPOINT_CRM_SALESRETURN + `/GetCRMSalesReturnLocate?fromDate=${fromDate}&ToDate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveCRMSalesReturn: function SaveCRMSalesReturn(data, UserId) {
        var URL = UrlService.API_ENDPOINT_CRM_SALESRETURN + `/SaveCRMSalesReturn?UserId=${UserId}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },

    DeleteCRMSalesReturn: function DeleteCRMSalesReturn(Code, CratesReceiveMaster_Code, UserMaster_Code, ReasonForDelete, IPAddress, Location) {
        var URL = UrlService.API_ENDPOINT_CRM_SALESRETURN + `/DeleteCRMSalesReturn?Code=${Code || 0}&CratesReceiveMaster_Code=${CratesReceiveMaster_Code || 0}&UserMaster_Code=${UserMaster_Code}&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}&IPAddress=${encodeURIComponent(IPAddress || '')}&Location=${encodeURIComponent(Location || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },

    GetCRMSalesReturnShowData: function GetCRMSalesReturnShowData(Code, CratesReceiveMaster_Code) {
        var URL = UrlService.API_ENDPOINT_CRM_SALESRETURN + `/GetCRMSalesReturnShowData?Code=${Code || 0}&CratesReceiveMaster_Code=${CratesReceiveMaster_Code || 0}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetDDL: function GetDDL(Mode) {
        var URL = UrlService.API_ENDPOINT_CRM_SALESRETURN + `/GetDDl?Mode=${Mode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    }
}

export { CRMSalesReturnService };
