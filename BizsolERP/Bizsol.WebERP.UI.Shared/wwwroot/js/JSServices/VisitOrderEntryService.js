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
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=`+ userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetVisitMasterList: function GetVisitMasterList(FromDate, ToDate, MarketingMan, User_Id) {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetVerifiedRoutePlanUserAndDateWise?User_ID=${User_Id}&MarketingMan_Name=${MarketingMan}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRoutePlanList: function GetRoutePlanList(Mode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/GetRoutePlanList?UserMaster_Code=${userMasterCode}&Mode=${Mode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    }, 
    NotVisitedRoutePlan: function NotVisitedRoutePlan(RoutePlanMaster_Code, Reason) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/NotVisitedRoutePlan?RoutePlanMaster_Code=${RoutePlanMaster_Code}&UserMaster_Code=${userMasterCode}&ReasonForClose=${Reason}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckInVisit: function CheckInVisit(RoutePlanMaster_Code, CheckIn, location, ChekedInLocation) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/CheckInVisit?RoutePlanMaster_Code=${RoutePlanMaster_Code}&CheckIn=${CheckIn}&Location=${location}&ChekedInLocation=${ChekedInLocation}&UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetOrderTypeList: function GetOrderTypeList() {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetOrderTypeList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetVerifyOrderList: function GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetVerifyOrderList?DealerName=${DealerName} &SalesPerson=${SalesPerson}&OrderType=${OrderType}&ChkWithOrder=${ChkWithOrder}&UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UnVerifiedExceededDiscountList: function UnVerifiedExceededDiscountList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetUnVerifiedExceededDiscountList?DealerName=${DealerName} &SalesPerson=${SalesPerson}&OrderType=${OrderType}&ChkWithOrder=${ChkWithOrder}&UserMaster_Code=${userMasterCode}`;
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
    GetEditVisitDetails: function GetEditVisitDetails(RoutePlan_Code,VisitMaster_Code) {
        let url = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetEditVisitDetails?RoutePlanMaster_Code=" + RoutePlan_Code + `&VisitMaster_Code=` + VisitMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckOut: function CheckOut(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let url = UrlService.API_ENDPOINT_VISIT_MASTER + "/CheckOut?UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', url, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParameterConfiguration: function GetFixedParameterConfiguration() {
        var URL = UrlService.API_ENDPOINT_FixedParameter + `/GetFixedParameterConfiguration`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUnVerifiedVisitDetailsReport: function GetUnVerifiedVisitDetailsReport(VisitMaster_Code) {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetUnVerifiedVisitDetailsReport?VisitMaster_Code=${VisitMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyVisitOrder: function VerifyVisitOrder(VisitMaster_Code, Mode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/VerifyVisitOrderReport?VisitMaster_Code=${VisitMaster_Code}&UserMaster_Code=${userMasterCode}&Mode=${Mode}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RejectVisitOrder: function RejectVisitOrder(VisitMaster_Code, Reason) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/RejectVisitOrderReport?VisitMaster_Code=${VisitMaster_Code}&UserMaster_Code=${userMasterCode}&Reason=${Reason}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UpdateVisitOrderOtherCharges: function UpdateVisitOrderOtherCharges(VisitMaster_Code, OtherChargesOld, OtherChargesNew,Level) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/UpdateVisitOrderDetails_OtherCharges?VisitMaster_Code=${VisitMaster_Code}&OtherChargesOld=${OtherChargesOld}&OtherChargesNew=${OtherChargesNew}&lv=${Level}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UnVerifiedExceededDiscountList: function UnVerifiedExceededDiscountList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetUnVerifiedExceededDiscountList?DealerName=${DealerName} &SalesPerson=${SalesPerson}&OrderType=${OrderType}&ChkWithOrder=${ChkWithOrder}&UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteVisitOrderDetails: function DeleteVisitOrderDetails(Code, DealerName, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/DeleteVisitOrderDetails?Code=${DealerName} &UserMaster_Code=${userMasterCode}&ReasonForDelete=${ReasonForDelete}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { VisitOrderEntryService }