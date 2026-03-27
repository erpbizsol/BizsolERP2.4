import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const TransporterMasterService = {
    GetSolarTransporterMasterList: function GetSolarTransporterMasterList(IsTransporter) {
        var URL = UrlService.API_ENDPOINT_VendorMaster + `/GetSolarTransporterMasterList?IsTransporter=${IsTransporter}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(function (value) { return value; });
    },
    
};

export { TransporterMasterService };
