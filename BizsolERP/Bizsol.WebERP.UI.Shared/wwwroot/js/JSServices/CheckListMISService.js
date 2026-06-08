import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CHECKLIST_MIS_BASE =
    UrlService.API_ENDPOINT_CHECKLIST_MIS || `${UrlService.BASE_URL}/CheckListMIS`;

/**
 * Checklist MIS Report — dbo.USP_WebAPI_CheckListMIS
 * GETMIS    -> one aggregated row per doer for the Mon–Sun week containing `date`.
 * GETWEEKS  -> recent week ranges to populate the period dropdown.
 */
const CheckListMISService = {
    /** Weekly MIS rows. `date` (yyyy-MM-dd) = any day inside the target week; omit for current week. */
    GetCheckListMIS: function GetCheckListMIS(date, userMasterCode) {
        let URL =
            CHECKLIST_MIS_BASE +
            '/GetCheckListMIS?userMasterCode=' +
            encodeURIComponent(userMasterCode || 0);
        if (date) {
            URL += '&date=' + encodeURIComponent(date);
        }
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Recent Mon–Sun week ranges for the period selector. */
    GetWeeks: function GetWeeks(weeksBack) {
        const URL =
            CHECKLIST_MIS_BASE +
            '/GetWeeks?weeksBack=' +
            encodeURIComponent(weeksBack || 12);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { CheckListMISService };
