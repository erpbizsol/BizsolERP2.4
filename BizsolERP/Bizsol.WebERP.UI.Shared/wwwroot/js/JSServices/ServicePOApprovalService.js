import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ServicePOApprovalService = {
    GetUnApprovedServicePO: function GetUnApprovedServicePO() {
        var URL = API_ENDPOINT_ServicePOApproval + "/GetUnApprovedServicePO";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
GetServicePODetail: function GetServicePODetail(POServiceMaster_Code) {
    var URL = API_ENDPOINT_ServicePOApproval + "/GetServicePODetail?POServiceMaster_Code=" + POServiceMaster_Code;
    return this._http.post(url, {}, { headers: this.headers() });
},
ServicePOApproved: function ServicePOApproved(POServiceMaster_Code) {
    var URL = API_ENDPOINT_ServicePOApproval + "/ServicePOApproved?POServiceMaster_Code=" + POServiceMaster_Code + "&UserMaster_Code=" + UserMaster_Code;

    return this._http.post(url, {}, { headers: this.headers() });
},
}
export { ServicePOApprovalService }