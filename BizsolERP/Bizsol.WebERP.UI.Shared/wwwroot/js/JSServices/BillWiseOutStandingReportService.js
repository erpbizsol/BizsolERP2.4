import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BillWiseOutStandingReportService = {
    GetBillWiseOutStandingReport: function GetBillWiseOutStandingReport(
        marketingManMasterCode,
        accountMasterCode,
        asonDate,
        groupTypeMasterCode,
        creditDaysFromMaster
    ) {
        const mm = (marketingManMasterCode != null && String(marketingManMasterCode).trim() !== '' && String(marketingManMasterCode) !== '0')
            ? String(marketingManMasterCode).trim() : '';
        const ac = (accountMasterCode != null && String(accountMasterCode).trim() !== '' && String(accountMasterCode) !== '0')
            ? String(accountMasterCode).trim() : '';
        const ad = asonDate != null ? String(asonDate) : '';
        const gtCode = (groupTypeMasterCode != null && String(groupTypeMasterCode).trim() !== '' && String(groupTypeMasterCode) !== '0')
            ? String(groupTypeMasterCode).trim() : '0';
        const crDaysFromMaster = (function () {
            const v = String(creditDaysFromMaster || 'Y').trim().toUpperCase();
            if (v === 'N' || v === 'W') return v;
            return 'Y';
        })();

        let URL =
            UrlService.API_ENDPOINT_BillWiseOutStandingReport +
            '/GetBillWiseOutStandingReport?AsonDate=' +
            encodeURIComponent(ad) +
            '&GroupTypeMaster_Code=' +
            encodeURIComponent(gtCode) +
            '&CreditDaysFromMaster=' +
            encodeURIComponent(crDaysFromMaster);

        if (mm !== '') URL += '&MarketingManMaster_Codes=' + encodeURIComponent(mm);
        if (ac !== '') URL += '&AccountMaster_Codes=' + encodeURIComponent(ac);

        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetBillMonthWiseOutStandingReport: function GetBillMonthWiseOutStandingReport(
        marketingManMasterCode,
        accountMasterCode,
        asonDate,
        groupTypeMasterCode,
        creditDaysFromMaster
    ) {
        const mm = (marketingManMasterCode != null && String(marketingManMasterCode).trim() !== '' && String(marketingManMasterCode) !== '0')
            ? String(marketingManMasterCode).trim() : '';
        const ac = (accountMasterCode != null && String(accountMasterCode).trim() !== '' && String(accountMasterCode) !== '0')
            ? String(accountMasterCode).trim() : '';
        const ad = asonDate != null ? String(asonDate) : '';
        const gtCode = (groupTypeMasterCode != null && String(groupTypeMasterCode).trim() !== '' && String(groupTypeMasterCode) !== '0')
            ? String(groupTypeMasterCode).trim() : '0';
        const crDaysFromMaster = (function () {
            const v = String(creditDaysFromMaster || 'Y').trim().toUpperCase();
            if (v === 'N' || v === 'W') return v;
            return 'Y';
        })();

        let URL =
            UrlService.API_ENDPOINT_BillWiseOutStandingReport +
            '/GetBillMonthWiseOutStandingReport?AsonDate=' +
            encodeURIComponent(ad) +
            '&GroupTypeMaster_Code=' +
            encodeURIComponent(gtCode) +
            '&CreditDaysFromMaster=' +
            encodeURIComponent(crDaysFromMaster);

        if (mm !== '') URL += '&MarketingManMaster_Codes=' + encodeURIComponent(mm);
        if (ac !== '') URL += '&AccountMaster_Codes=' + encodeURIComponent(ac);

        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { BillWiseOutStandingReportService };
