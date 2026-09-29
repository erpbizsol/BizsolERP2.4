import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ItemMasterService = {

    GetItemMasterListData: function GetItemMasterListData() {
        var URL = UrlService.API_ENDPOINT_ItemMaster + `/GetItemMasterListData`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

    GetItemMasterByCode: function GetItemMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_ItemMaster + `/GetItemMasterByCode?Code=${code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

    SaveItemMaster: function SaveItemMaster(data) {
        var URL = UrlService.API_ENDPOINT_ItemMaster + `/SaveItemMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) { return value; });
    },
    DeleteItemMaster: function DeleteItemMaster(Code, ReasonForDelete) {
        var authKeyData    = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ItemMaster +
            `/DeleteItemMaster?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(function (value) { return value; });
    },

    
    GetUomMasterList: function GetUomMasterList() {
        var URL = UrlService.API_ENDPOINT_ItemMaster + `/GetUomMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

    GetCategoryMasterList: function GetCategoryMasterList() {
        var URL = UrlService.API_ENDPOINT_ItemMaster + `/GetCategoryMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },

};

export { ItemMasterService };
