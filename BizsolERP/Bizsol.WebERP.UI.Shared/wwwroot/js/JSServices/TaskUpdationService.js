import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const TASK_UPDATION_BASE =
    UrlService.API_ENDPOINT_TASK_UPDATION || `${UrlService.BASE_URL}/TaskUpdation`;

/**
 * Task Updation — dbo.USP_WebAPI_TaskUpdation
 * GETTASKLISTBYEMP -> task + frequency + date-wise calendar for the logged-in employee.
 * SAVE             -> toggle a single day's completion status.
 */

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

const TaskUpdationService = {
    /** Logged-in user's tasks with the date-wise calendar (quarter of baseDate). */
    GetTaskListByEmp: function GetTaskListByEmp(userMasterCode, baseDate) {
        const userCode = userMasterCode || authUserCode();
        let URL =
            TASK_UPDATION_BASE +
            '/GetTaskListByEmp?userMasterCode=' +
            encodeURIComponent(userCode || 0);
        if (baseDate) {
            URL += '&date=' + encodeURIComponent(baseDate);
        }
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** Toggle / save a single task day's completion status. */
    SaveTaskUpdation: function SaveTaskUpdation(data) {
        const payload = Object.assign(
            {
                Mode: 'SAVE',
                UserId: authUserCode(),
            },
            data || {}
        );
        const URL = TASK_UPDATION_BASE + '/SaveTaskUpdation';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    },
};

export { TaskUpdationService };
