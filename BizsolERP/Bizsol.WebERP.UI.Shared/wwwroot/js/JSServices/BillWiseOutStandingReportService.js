import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BillWiseOutStandingReportService = {
    GetBillWiseOutStandingReport: function GetBillWiseOutStandingReport(
        marketingManMasterCode,
        accountMasterCode,
        asonDate,
        groupTypeMasterCode
    ) {
        const mm = (marketingManMasterCode != null && String(marketingManMasterCode).trim() !== '' && String(marketingManMasterCode) !== '0')
            ? String(marketingManMasterCode).trim() : '';
        const ac = (accountMasterCode != null && String(accountMasterCode).trim() !== '' && String(accountMasterCode) !== '0')
            ? String(accountMasterCode).trim() : '';
        const ad = asonDate != null ? String(asonDate) : '';
        const gtCode = (groupTypeMasterCode != null && String(groupTypeMasterCode).trim() !== '' && String(groupTypeMasterCode) !== '0')
            ? String(groupTypeMasterCode).trim() : '0';

        let URL =
            UrlService.API_ENDPOINT_BillWiseOutStandingReport +
            '/GetBillWiseOutStandingReport?AsonDate=' +
            encodeURIComponent(ad) +
            '&GroupTypeMaster_Code=' +
            encodeURIComponent(gtCode);

        if (mm !== '') URL += '&MarketingManMaster_Codes=' + encodeURIComponent(mm);
        if (ac !== '') URL += '&AccountMaster_Codes=' + encodeURIComponent(ac);

        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { BillWiseOutStandingReportService };
