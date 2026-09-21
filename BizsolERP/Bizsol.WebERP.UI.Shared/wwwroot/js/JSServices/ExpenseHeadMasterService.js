import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ExpenseHeadMasterService = {
    GetExpenseHeadMasterList: function GetExpenseHeadMasterList() {
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster + "/GetExpenseHeadList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDESIGNATIONAMEList: function GetDESIGNATIONAMEList() {
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster + "/GetDESIGNATIONAMEList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetExpenseGroupList: function GetExpenseGroupList() {
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster + "/GetExpenseGroupList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetExpenseHeadMasterByCode: function GetExpenseHeadMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster + "/GetExpenseHeadMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;

            }
        );
    },
    SaveExpenseHeadMaster: function SaveExpenseHeadMaster(Data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster + `/SaveExpenseHeadMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteExpenseHeadMaster: function DeleteExpenseHeadMaster(code, reason) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData ? authKeyData.UserMaster_Code : 0;
        var URL = UrlService.API_ENDPOINT_ExpenseHeadMaster +
            '/DeleteExpenseHeadMaster' +
            '?Code=' + encodeURIComponent(code) +
            '&UserMaster_Code=' + encodeURIComponent(userMasterCode) +
            '&ReasonForDelete=' + encodeURIComponent(reason || '');
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
}
export { ExpenseHeadMasterService }