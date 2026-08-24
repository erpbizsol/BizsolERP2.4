import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const WeightConfirmationService = {

    GetProcessList: function GetProcessList() {
        var URL = UrlService.API_ENDPOINT_WeightConfirmation + '/GetProcessList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },

    UpdateWeight: function UpdateWeight(ItemMaster_Code, IdentificationNo, ProcessMaster_Code, UserMaster_Code, ActualWeight) {
        var URL = UrlService.API_ENDPOINT_WeightConfirmation
            + '/UpdateWeight?ItemMaster_Code=' + ItemMaster_Code
            + '&IdentificationNo=' + encodeURIComponent(IdentificationNo)
            + '&ProcessMaster_Code=' + ProcessMaster_Code
            + '&UserMaster_Code=' + UserMaster_Code
            + '&ActualWeight=' + ActualWeight;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(
            function (value) {
                return value;
            }
        );
    },

    GetFixedParaMeter: function GetFixedParaMeter() {
        var URL = UrlService.API_ENDPOINT_WeightConfirmation + '/GetFixedParaMeter';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(
            function (value) {
                return value;
            }
        );
    },

}

export { WeightConfirmationService }
