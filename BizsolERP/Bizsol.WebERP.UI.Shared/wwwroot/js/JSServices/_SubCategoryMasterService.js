import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SubCategoryMasterService = {

    GetSubCategoryMasterList: function GetSubCategoryMasterList(FormType) {
        var formType = FormType != null ? FormType : '';
        var URL = UrlService.API_ENDPOINT_SUBCATEGORY +
            `/GetSubCategoryMasterList?FormType=${encodeURIComponent(formType)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) { return value; });
    },

    GetSubCategoryMasterByCode: function GetSubCategoryMasterByCode(code) {
        var URL = UrlService.API_ENDPOINT_SUBCATEGORY + `/` + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) { return value; });
    },

    SaveSubCategoryMaster: function SaveSubCategoryMaster(data) {
        var URL = UrlService.API_ENDPOINT_SUBCATEGORY + `/SaveSubCategoryMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) { return value; });
    },

    DeleteSubCategoryMaster: function DeleteSubCategoryMaster(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SUBCATEGORY +
            `/DeleteSubCategoryMaster?Code=${Code}&UserMaster_Code=${userMasterCode}` +
            `&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) { return value; });
    },
};

export { SubCategoryMasterService };
