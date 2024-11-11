import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const StateMasterService = {
    GetStateMasterList: function GetStateMasterList(CountryName) {
        //var URL = UrlService.API_ENDPOINT_POApproval + "/GetUnApprovedPO";
        var URL = UrlService.API_ENDPOINT_STATE + `/GetStateList?CountryName=${CountryName}&UserId=145`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetStateMasterByCode: function GetStateMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_STATE + "/"+Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveStateMaster: function SaveStateMaster(Data) {
        var URL = UrlService.API_ENDPOINT_STATE + "/SaveStateMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteStateMaster: function DeleteStateMaster(Code, UserMaster_Code,Reason) {
        var URL = UrlService.API_ENDPOINT_STATE + `/DeleteStateMaster?Code=${Code}&UserMaster_Code=${UserMaster_Code}&ReasonForDelete=${Reason}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { StateMasterService }