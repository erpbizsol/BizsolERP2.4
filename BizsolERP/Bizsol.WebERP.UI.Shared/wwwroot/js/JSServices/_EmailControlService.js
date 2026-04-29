import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const EmailControlService = {

    /**
     * Send an email via the backend SQL-function-based API.
     * Attachments are passed as a base64 array so we can use the standard JSON API call.
     * @param {object} payload  { To, CC, BCC, Subject, Body, Attachments: [{FileName, FileBase64, ContentType}] }
     */
    SendEmail: function SendEmail(payload) {
        let url = UrlService.API_ENDPOINT_SendMail + '/SendEmailBySQL';
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(payload)).then(
            function (value) { return value; }
        );
    }

};

export { EmailControlService };
