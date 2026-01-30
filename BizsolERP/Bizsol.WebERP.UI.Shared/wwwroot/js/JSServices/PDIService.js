import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PDIService = {
    GetPDICurrentList: function GetPDICurrentList(Fromdate, ToDate) {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDICurrentList?FromDate=" + Fromdate + "&ToDate=" + ToDate;
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
    GetPDIEditList: function GetPDIEditList(Code) {
        var URL = UrlService.API_ENDPOINT_PDI + "/GetPDIEditList?Code=" + Code;
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
