import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const VisitOrderEntryService = {
    GetUserDetails: function GetUserDetails() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var companyCode = authKeyData.CompanyCode;
        var URL = UrlService.API_UserMODULE + `/GetUserDetails?UserMaster_Code=` + userMasterCode + `&CompanyCode=` + companyCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedDealerList: function GetNestedDealerList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=` + userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCRMFixedParameterConfig: function GetCRMFixedParameterConfig() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CRM_CONFIG + `/GetCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAccountMasterDetails: function GetAccountMasterDetails(AccountDesp) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/GetAccountDetailsByAccountDesp?AccountDesp=` + AccountDesp;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDealerDetailsByDealerName: function GetDealerDetailsByDealerName(AccountDesp) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetDealerDetailsByDealerName?DealerName=` + AccountDesp;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemMasterDropdown: function GetItemMasterDropdown() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ITEM + `/GetItemMasterDropdown`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemSizeListByItemCode: function GetItemSizeListByItemCode(ItemMaster_Code) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeListByItemCode?ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSizeParameterAsPerChart: function GetSizeParameterAsPerChart(ItemName) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetSizeParameterAsPerChart?ItemName=" + ItemName;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetThkParameterAsPerChart: function GetThkParameterAsPerChart(ItemName,Size) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetThkParameterAsPerChart?ItemName=" + ItemName + `&Size=` + Size;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFreightList: function GetFreightList(ItemName) {
        let url = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetFreightList" ;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFreightTypeList: function GetFreightTypeList(ItemName, Size) {
        let url = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetFreightTypeList";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAccountDeliveryLocationDetails: function GetAccountDeliveryLocationDetails(AccountDesp) {
        let url = UrlService.API_ENDPOINT_ACCOUNT_MASTER + "/GetAccountDeliveryLocationDetails?AccountDesp=" + AccountDesp;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveVisit: function SaveVisit(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/SaveVisit?UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetZoneMasterList: function GetZoneMasterList() {
        let url = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetZoneMasterList";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    
}

export { VisitOrderEntryService }