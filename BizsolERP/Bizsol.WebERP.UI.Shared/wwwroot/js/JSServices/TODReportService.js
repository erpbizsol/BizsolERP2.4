import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const TODReportService = {
    /**
     * Calls Usp_RptTODReportNew.
     * Empty code lists mean All.
     * CreditLimitAsPer: M (Master) / I (Invoice)
     * AccountType: A (Account) / I (Indentor) / C (Consignee)
     */
    GetTODReport: function GetTODReport(filter) {
        const payload = {
            AccountMaster_Codes: filter && filter.AccountMaster_Codes ? filter.AccountMaster_Codes : '',
            Scheme_Codes: filter && filter.Scheme_Codes ? filter.Scheme_Codes : '',
            CreditLimitAsPer: filter && filter.CreditLimitAsPer ? filter.CreditLimitAsPer : '',
            // ItemMaster_Codes: filter && filter.ItemMaster_Codes ? filter.ItemMaster_Codes : '',
            // ItemSizeParameter_Codes: filter && filter.ItemSizeParameter_Codes ? filter.ItemSizeParameter_Codes : '',
            AccountType: filter && filter.AccountType ? filter.AccountType : ''
        };
        const URL = UrlService.API_ENDPOINT_TOD_REPORT + '/GetTODReport';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(function (value) {
            return value;
        });
    }
};

export { TODReportService };
