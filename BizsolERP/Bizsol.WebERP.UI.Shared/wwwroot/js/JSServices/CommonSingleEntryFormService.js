import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const CommonSingleEntryFormService = {
    GetCommonSingleEntry: function GetCommonSingleEntry(CommonMastersConfiguration_Code) {
        var URL = UrlService.API_ENDPOINT_CommonSingleEntryForm + "/GetCommonSingleEntryFormByCode?CommonMastersConfiguration_Code=" + CommonMastersConfiguration_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SHOWDATABYEDIT: function SHOWDATABYEDIT(Code, CommonMastersConfiguration_Code) {
        var URL = UrlService.API_ENDPOINT_CommonSingleEntryForm + "/SHOWDATABYEDIT?Code=" + Code + "&CommonMastersConfiguration_Code=" + CommonMastersConfiguration_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveCommonSingleEntry: function SaveCommonSingleEntry(Code, CommonMastersConfiguration_Code, FieldValue) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CommonSingleEntryForm + "/SaveCommonSingleEntryForm?Code=" + Code + "&CommonMastersConfiguration_Code=" + CommonMastersConfiguration_Code + "&FieldValue=" + FieldValue + "&UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteCommonSingleEntryForm: function DeleteCommonSingleEntryForm(Code, CommonMastersConfiguration_Code, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CommonSingleEntryForm + "/DeleteCommonSingleEntryForm?Code=" + Code + "&CommonMastersConfiguration_Code=" + CommonMastersConfiguration_Code + "&UserMaster_Code=" + userCode + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCommonMastersConfiguration_Code: function GetCommonMastersConfiguration_Code(FieldValue) {
        var URL = UrlService.API_ENDPOINT_CommonSingleEntryForm + "/GetCommonMastersConfiguration_Code?FieldValue=" + FieldValue ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    }
export { CommonSingleEntryFormService }