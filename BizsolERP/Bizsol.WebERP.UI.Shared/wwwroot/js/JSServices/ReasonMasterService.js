import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

const ReasonMasterService = {
    GetReasonMasterList: function GetReasonMasterList() {
        const URL =
            UrlService.API_ENDPOINT_REASON_MASTER +
            `/GetReasonMasterList?UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetReasonTypeMasterList: function GetReasonTypeMasterList() {
        const URL =
            UrlService.API_ENDPOINT_REASON_MASTER +
            `/GetReasonTypeMasterList?UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    /**
     * Category list for F_CommonValues_Code_Category (Reason Master).
     * Wire the API to your F_CommonValues / category source for Reason Master.
     */
    GetReasonCategoryList: function GetReasonCategoryList() {
        const URL =
            UrlService.API_ENDPOINT_REASON_MASTER +
            `/GetReasonCategoryList?UserId=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetReasonMasterByCode: function GetReasonMasterByCode(code) {
        const URL = UrlService.API_ENDPOINT_REASON_MASTER + '/' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    SaveReasonMaster: function SaveReasonMaster(data) {
        const URL = UrlService.API_ENDPOINT_REASON_MASTER + '/SaveReasonMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    },
    DeleteReasonMaster: function DeleteReasonMaster(code, reason) {
        const userCode = authUserCode();
        const URL =
            UrlService.API_ENDPOINT_REASON_MASTER +
            '/DeleteReasonMaster?Code=' +
            encodeURIComponent(code) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode) +
            '&ReasonForDelete=' +
            encodeURIComponent(reason || '') +
            '&IPAddress=1&Location=1';
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
};

export { ReasonMasterService };
