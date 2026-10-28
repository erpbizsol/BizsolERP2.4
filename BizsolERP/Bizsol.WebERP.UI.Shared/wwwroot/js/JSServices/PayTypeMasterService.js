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

const PayTypeMasterService = {
    GetPayTypeMasterLocate: function GetPayTypeMasterLocate() {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/GetPayTypeMasterLocate';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetList: function GetList() {
        return PayTypeMasterService.GetPayTypeMasterLocate();
    },
    GetByCode: function GetByCode(code) {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/GetPayTypeMasterByCode?code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetUserMasterList: function GetUserMasterList() {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/GetUserMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetUserGroupMasterList: function GetUserGroupMasterList() {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/GetUserGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetAccountGroupMasterList: function GetAccountGroupMasterList() {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/GetAccountGroupMasterList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    Save: function Save(payload) {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER + '/SavePayTypeMaster';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    },
    Delete: function Delete(code) {
        var URL = UrlService.API_ENDPOINT_PAY_TYPE_MASTER
            + '/DeletePayTypeMaster?Code=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', URL, '{}', { suppressErrorToast: true }).then(function (value) {
            return value;
        });
    }
};

export { PayTypeMasterService };
