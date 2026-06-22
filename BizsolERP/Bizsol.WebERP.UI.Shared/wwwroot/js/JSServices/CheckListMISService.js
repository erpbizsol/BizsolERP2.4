import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CheckListMISService = {
    GetReportTypelist: function GetReportTypelist(ModuleDesc) {
        var module = encodeURIComponent(ModuleDesc || 'Check List MIS SCORE');
        var URL = UrlService.API_ENDPOINT_CHECKLIST_MIS + '/GetReportType?ModuleDesc=' + module;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetCheckListMIS: function GetCheckListMIS(ReportType, UserMasterCode, FromDate, ToDate, Mode) {
        var URL = UrlService.API_ENDPOINT_CHECKLIST_MIS
            + '/GetCheckListMIS?ReportType=' + encodeURIComponent(ReportType || 'Check List MIS SCORE')
            + '&UserMasterCode=' + encodeURIComponent(UserMasterCode || 0)
            + '&FromDate=' + encodeURIComponent(FromDate || '')
            + '&ToDate=' + encodeURIComponent(ToDate || '')
            + '&Mode=' + encodeURIComponent(Mode || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetWeeks: function GetWeeks(weeksBack) {
        var URL = UrlService.API_ENDPOINT_CHECKLIST_MIS + '/GetWeeks?weeksBack=' + encodeURIComponent(weeksBack || 12);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SendWhatsappToUser: function SendWhatsappToUser(reportType, link, userMasterCode) {
        var URL = UrlService.API_ENDPOINT_CHECKLIST_MIS
            + '/SendWhatsappToUser?ReportType=' + encodeURIComponent(reportType || '')
            + '&Link=' + encodeURIComponent(link || '')
            + '&UserMasterCode=' + encodeURIComponent(userMasterCode ?? 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    UploadWhatsappFile: function UploadWhatsappFile(fileName, fileExtension, fileBase64String) {
        var URL = (typeof window !== 'undefined' && window.UPLOAD_WHATSAPP_URL)
            || '/CommonReports/CheckListMIS/UploadWhatsappFile';
        var payload = JSON.stringify({
            FileName: fileName,
            FileExtension: fileExtension,
            FileDataBase64string: fileBase64String,
        });
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: URL,
                method: 'POST',
                contentType: 'application/json',
                dataType: 'text',
                data: payload,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    var msg = (xhr && xhr.responseText) ? xhr.responseText.trim() : '';
                    if (!msg) {
                        msg = status + ': ' + error;
                    }
                    reject(new Error(msg));
                },
            });
        });
    },
};

export { CheckListMISService };
