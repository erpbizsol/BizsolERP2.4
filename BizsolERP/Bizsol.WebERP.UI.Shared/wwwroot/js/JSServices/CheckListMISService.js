import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';



const CheckListMISService = {
    /** Weekly MIS rows. `date` (yyyy-MM-dd) = any day inside the target week; omit for current week. */
    GetCheckListMIS: function GetCheckListMIS(date, userMasterCode) {
        let URL = API_ENDPOINT_CHECKLIST_MIS +'/GetCheckListMIS?userMasterCode=' +encodeURIComponent(userMasterCode || 0);
        if (date) {
            URL += '&date=' + encodeURIComponent(date);
        }
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Recent Mon–Sun week ranges for the period selector. */
    GetWeeks: function GetWeeks(weeksBack) {
        const URL = API_ENDPOINT_CHECKLIST_MIS +'/GetWeeks?weeksBack=' +encodeURIComponent(weeksBack || 12);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
    GetReportTypelist: function GetReportTypelist(ModuleDesc) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CHECKLIST_MIS + `/GetReportType?ModuleDesc=Check List MIS SCORE`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    
};

export { CheckListMISService };
