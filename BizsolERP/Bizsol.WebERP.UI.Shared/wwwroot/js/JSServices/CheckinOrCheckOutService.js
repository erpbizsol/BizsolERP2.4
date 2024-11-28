import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const CheckinOrCheckOutService = {
   
    GetDayWiseCheckInOut: function GetDayWiseCheckInOut() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const url = `${UrlService.API_ENDPOINT_DayWiseCheckInOut}/GetDayWiseCheckInOut?UserMaster_Code=${userCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDistance: function GetDistance() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const url = `${UrlService.API_ENDPOINT_DayWiseCheckInOut}/GetDistance?UserMaster_Code=${userCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveCheckIncheckOut: function SaveCheckIncheckOut(latitude, longitude, address) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let url = `${UrlService.API_ENDPOINT_DayWiseCheckInOut}/SaveDayWiseCheckInOut?UserMaster_Code=${userCode}&latitude=${latitude}&longitude=${longitude}&Location=${address}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    }
}
export { CheckinOrCheckOutService }