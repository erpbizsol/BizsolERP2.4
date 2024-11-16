import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ServicePOApprovalService = {
    GetUnApprovedServicePO: function GetUnApprovedServicePO() {
        var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/GetUnApprovedServicePO";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
GetServicePODetail: function GetServicePODetail(POServiceMaster_Code) {
    var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/GetServicePODetail?POServiceMaster_Code=" + POServiceMaster_Code;
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
    ServicePOApproved: function ServicePOApproved(POServiceMaster_Code) {
    let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/ServicePOApproved?POServiceMaster_Code=" + POServiceMaster_Code + "&UserMaster_Code=" + UserMaster_Code;

    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
}
export { ServicePOApprovalService }