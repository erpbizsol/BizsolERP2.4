import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ProspectiveCustomerService = {
    GetProspectiveCustomerList: function GetProspectiveCustomerList(MarketingPersonName,Thickness,Size,Grade,ISCode,Status) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ProspectiveCustomer + "/GetProspectiveCustomerList?MarketingMan_Name=" + MarketingPersonName + "&UserMaster_Code=" + userMasterCode + "&Thickness=" + Thickness + "&Size=" + Size + "&Grade=" + Grade + "&ISCode=" + ISCode + "&Status=" + Status;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ProspectiveCustomer + `/ProspectiveCustomer_SalesPersonList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetThichnessList: function GetThichnessList() {
        var URL = UrlService.API_ENDPOINT_ProspectiveCustomer + `/GetThichness`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSizeList: function GetSizeList() {
        var URL = UrlService.API_ENDPOINT_ProspectiveCustomer + `/GetSize`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetGradeList: function GetGradeList() {
        var URL = UrlService.API_ENDPOINT_ProspectiveCustomer + `/GetGrade`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetISCodeList: function GetISCodeList() {
        URL = UrlService.API_ENDPOINT_ProspectiveCustomer + `/GetISCode`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { ProspectiveCustomerService }