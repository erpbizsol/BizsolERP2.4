import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';
const DealerMasterService = {
    GetDealerList: function GetDealerList(AccountDesp) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/GetDealerList?AccountDesp=${AccountDesp}&UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDealerMasterByCode: function GetDealerMasterByCode(Code) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/GetDealerMasterByCode?Code=` + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDealerMasterByName: function GetDealerMasterByName(DealerName) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/GetDealerMasterByName?DealerName=` + DealerName;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    SaveDealerMaster: function SaveDealerMaster(DealerMasterData) {
        var json_data = JSON.stringify(DealerMasterData, null, 2);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/SaveDealerMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );

    },
    DeleteDealerMaster: function DeleteDealerMaster(Code, ReasonForDelete) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/DeleteDealerMaster?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${ReasonForDelete}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetNestedAccountMasterList: function GetNestedAccountMasterList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=` + userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityList: function GetCityList(CountryName, StateName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityList?CountryName=` + CountryName + `&StateName=` + StateName + `&UserId=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityDetailsByName: function GetCityDetailsByName(CityName, Mode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityMasterByName?CityName=` + CityName + `&Mode=` + Mode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { DealerMasterService }

