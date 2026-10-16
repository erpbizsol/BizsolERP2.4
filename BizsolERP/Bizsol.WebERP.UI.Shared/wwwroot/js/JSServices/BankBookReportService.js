import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BankBookReportService = {
    GetBankBookReport: function GetBankBookReport(payload) {
        var URL = UrlService.API_ENDPOINT_BANK_BOOK_REPORT + '/GetBankBookReport';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload || {})).then(function (value) {
            return value;
        });
    }
};

export { BankBookReportService };
