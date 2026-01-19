import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RawMaterialOfferService = {
    GetRawMaterialDropDown: function GetRawMaterialDropDown() {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialDropDown";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRawMaterialGoDownName: function GetRawMaterialGoDownName() {
        var URL = UrlService.API_ENDPOINT_RawMaterialOffer + "/GetRawMaterialGoDownName";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    }
}

export { RawMaterialOfferService }
