import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const VendorMasterService = {

    GetSolarVendorMasterList: function GetSolarVendorMasterList(IsClientOrVendor) {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetSolarVendorMasterList?IsClientOrVendor=${IsClientOrVendor}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

    GetSolarVendorMasterByCode: function GetSolarVendorMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetSolarVendorMasterByCode?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

    SaveVendorMaster: function SaveVendorMaster(data) {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/SaveVendorMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) { return value; });
    },

    DeleteSolarVendorMaster: function DeleteSolarVendorMaster(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VendorMaster +
            `/DeleteSolarVendorMaster?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) { return value; });
    },

    VerifySolarVendorMaster: function VerifySolarVendorMaster(Code) {
        var URL = UrlService.API_ENDPOINT_VendorMaster +
            `/VerifySolarVendorMaster?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    GetCityList: function GetCityList() {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetCityList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    GetStateList: function GetStateList() {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetStateList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    GetNationList: function GetNationList() {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetNationList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    /** City master row by name (state/country/pin) — same contract as Dealer/Route City service. */
    GetCityMasterByName: function GetCityMasterByName(CityName, Mode) {
        var URL =
            UrlService.API_ENDPOINT_CITY +
            `/GetCityMasterByName?CityName=` +
            encodeURIComponent(CityName || "") +
            `&Mode=` +
            encodeURIComponent(Mode || "");
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) {
            return value;
        });
    },
    GetServiceProviderNatureList: function GetServiceProviderNatureList() {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetServiceProviderNatureList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    GetFixedParameterDetails: function GetFixedParameterDetails() {
        var URL = UrlService.API_ENDPOINT_FixedParameter + `/GetFixedParameterDetails`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
};

export { VendorMasterService };
