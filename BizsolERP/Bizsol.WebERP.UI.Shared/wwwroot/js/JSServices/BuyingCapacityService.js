import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BuyingCapacityService = {
    GetBuyingCapacityList: function GetBuyingCapacityList(MarketingPersonName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_BuyingCapacity + `/GetBuyingCapacityList?MarketingMan_Name=${encodeURIComponent(MarketingPersonName)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveBuyingCapacity: function SaveBuyingCapacity(Data) {
        var URL = UrlService.API_ENDPOINT_BuyingCapacity + "/SaveBuyingCapacity";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    GetBuyingFrequency: function GetBuyingFrequency() {
        var URL = UrlService.API_ENDPOINT_BuyingCapacity + "/GetBuyingFrequency";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authRaw = sessionStorage.getItem('authKey');
        if (!authRaw) {
            return Promise.reject(new Error('Auth key not available'));
        }
        var authKeyData = JSON.parse(authRaw);
        var userMasterCode = authKeyData && authKeyData.UserMaster_Code;
        if (userMasterCode === undefined || userMasterCode === null || userMasterCode === '') {
            return Promise.reject(new Error('UserMaster_Code not available'));
        }
        var URL = UrlService.API_ENDPOINT_BuyingCapacity + `/BuyingCapacity_SalesPersonList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBuyingGPRollingCategory: function GetBuyingGPRollingCategory() {
        var URL = UrlService.API_ENDPOINT_BuyingCapacity + "/GetBuyingGPRollingCategory";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { BuyingCapacityService }