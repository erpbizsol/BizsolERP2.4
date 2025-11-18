import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PDIService = {
    GetPDIList: function GetPDIList() {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDIList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPDIOrderList: function GetPDIOrderList() {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDIOrderList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SavePDIData: function SavePDIData(data) {
        var URL = UrlService.API_ENDPOINT_PDI + "/SavePDIData";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(
            function (value) {
                return value;
            }
        );
    },
    GetPDIImage: function GetPDIImage(code) {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDIImage?code=" + code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { PDIService }
