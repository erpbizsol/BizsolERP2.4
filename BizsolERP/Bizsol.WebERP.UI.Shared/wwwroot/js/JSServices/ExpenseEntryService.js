import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ExpenseEntryService = {
    //GetNestedMarketingManList: function GetNestedMarketingManList() {
    //    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    //    var userMasterCode = authKeyData.UserMaster_Code;
    //    var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=`+ userMasterCode + `&MarketingManMaster_Code=0`;
    //    return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
    //        function (value) {
    //            return value;
    //        }
    //    );
    //},
    GetMarketingManMasterByName: function GetMarketingManMasterByName(MarketingPersonName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/GetMarketingManMasterByName?MarketingManName=${MarketingPersonName}` ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/ExpenseEntry_SalesPersonList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
     GetExpenseEntryList: function GetExpenseEntryList(fromDate,toDate,MarketingPersonName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/GetExpenseEntryList?FromDate=${encodeURIComponent(fromDate)}&ToDate=${encodeURIComponent(toDate)}&MarketingMan_Name=${encodeURIComponent(MarketingPersonName)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetExpenseHeadDetails: function GetExpenseHeadDetails(MarketingPersonName,Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/GetExpenseHeadDetails?MarketingMan_Name=${MarketingPersonName}&UserMaster_Code=${userMasterCode}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
     GetExpenseEntryDetails: function GetExpenseEntryDetails(MarketingPersonName,Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/GetExpenseEntryDetails?ExpenseHeadMaster_Code=${Code}&MarketingMan_Name=${MarketingPersonName}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveExpenseEntryMaster: function SaveExpenseEntryMaster(Data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/SaveExpenseEntryMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    VerifyExpenseEntryMaster: function VerifyExpenseEntryMaster(Data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/VerifyExpenseEntryMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteExpenseEntryMaster: function DeleteExpenseEntryMaster(Code, Reason, IPAddress, Location) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/DeleteExpenseEntryMaster?UserMaster_Code=${encodeURIComponent(userMasterCode)}&Code=${encodeURIComponent(Code)}&ReasonForDelete=${encodeURIComponent(Reason || '')}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ExpenseEntry_ValidateMarketingPersonSenior: function ExpenseEntry_ValidateMarketingPersonSenior(Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/ExpenseEntry_ValidateMarketingPersonSenior?UserMaster_Code=${encodeURIComponent(userMasterCode)}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CalculateAllowedAmount: function CalculateAllowedAmount(MarketingManMaster_Code,FromDate,ToDate) {
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/CalculateAllowedAmount?MarketingManMaster_Code=${MarketingManMaster_Code}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetConfigExpenseEntryParameter: function GetConfigExpenseEntryParameter() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EXPENSE_ENTRY + `/GetConfigExpenseEntryParameter`;
        
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    }
    export { ExpenseEntryService }