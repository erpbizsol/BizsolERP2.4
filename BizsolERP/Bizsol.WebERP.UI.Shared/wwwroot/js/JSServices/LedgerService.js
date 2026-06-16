import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const formatLedgerDate = (d) => {
    if (d === '0') return '0';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return String(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const LedgerService = {

    GetLedgerData: function GetLedgerData(Mode, AccountCodes, FromDate, ToDate, extraModel) {
        const fd = formatLedgerDate(FromDate);
        const td = formatLedgerDate(ToDate);

        const url = `${UrlService.API_ENDPOINT_Ledger}/GetLedgerData`;

        const model = Object.assign({
            Mode: Mode,
            AccountCodes: AccountCodes,
            FromDate: fd,
            ToDate: td
        }, extraModel || {});

        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(model)).then(
            function (value) {
                return value;
            }
        );
    },

    /** Open ledger Crystal report in preview (same pattern as VisitorEntry / PurchaseQualityCheck). */
    PreviewLedgerReport: function PreviewLedgerReport(AccountCodes, FromDate, ToDate, options) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const companyCode = authKey.CompanyCode || 0;
        const fd = formatLedgerDate(FromDate);
        const td = formatLedgerDate(ToDate);
        const opts = options || {};
        const yn = (v) => (v ? 'Y' : 'N');

        const url = `${UrlService.API_ENDPOINT_CRYSTAL}/WebLedgerReport`
            + `?AccountCodes=${encodeURIComponent(AccountCodes)}`
            + `&FromDate=${encodeURIComponent(fd)}`
            + `&ToDate=${encodeURIComponent(td)}`
            + `&CompanyCode=${encodeURIComponent(companyCode)}`
            + `&ShowNarration=${yn(opts.showNarration)}`
            + `&ShowGSTNo=${yn(opts.showGSTNo)}`
            + `&ShowMonthTotal=${yn(opts.showMonthTotal)}`
            + `&ShowRefNo=${yn(opts.showRefNo)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    /** Open ledger Crystal report for print. */
    PrintLedgerReport: function PrintLedgerReport(AccountCodes, FromDate, ToDate, options) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const companyCode = authKey.CompanyCode || 0;
        const fd = formatLedgerDate(FromDate);
        const td = formatLedgerDate(ToDate);
        const opts = options || {};
        const yn = (v) => (v ? 'Y' : 'N');

        const url = `${UrlService.API_ENDPOINT_CRYSTAL}/WebLedgerReport`
            + `?AccountCodes=${encodeURIComponent(AccountCodes)}`
            + `&FromDate=${encodeURIComponent(fd)}`
            + `&ToDate=${encodeURIComponent(td)}`
            + `&CompanyCode=${encodeURIComponent(companyCode)}`
            + `&ShowNarration=${yn(opts.showNarration)}`
            + `&ShowGSTNo=${yn(opts.showGSTNo)}`
            + `&ShowMonthTotal=${yn(opts.showMonthTotal)}`
            + `&ShowRefNo=${yn(opts.showRefNo)}`
            + `&IsPrint=Y`;

        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    /** Extract Crystal report URL from ledger / voucher API responses. */
    extractCrystalUrl: function extractCrystalUrl(response) {
        if (!response) return '';
        if (typeof response === 'string') {
            const s = response.trim();
            return /^https?:\/\//i.test(s) ? s : '';
        }

        const pick = function (obj) {
            if (!obj || typeof obj !== 'object') return '';
            return obj.Url || obj.url || obj.ReportUrl || obj.reportUrl || obj.PdfUrl || obj.pdfUrl || '';
        };

        let url = pick(response);
        if (url) return String(url).trim();

        const nested = response.Data || response.data || response.Result || response.result;
        url = pick(nested);
        if (url) return String(url).trim();

        if (Array.isArray(response) && response.length > 0) {
            url = pick(response[0]);
            if (url) return String(url).trim();
        }
        if (Array.isArray(nested) && nested.length > 0) {
            url = pick(nested[0]);
            if (url) return String(url).trim();
        }
        return '';
    },

    /** Voucher Crystal preview (Show link) — same pattern as WebLedgerReport / WebPurchaseQualityCheck. */
    PreviewLedgerVoucherReport: function PreviewLedgerVoucherReport(rowPayload) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const companyCode = authKey.CompanyCode || 0;
        const p = rowPayload || {};
        const recordDate = formatLedgerDate(p.RecordDate || '0');

        const url = `${UrlService.API_ENDPOINT_CRYSTAL}/WebLedgerVoucherReport`
            + `?MasterTableName=${encodeURIComponent(p.MasterTableName || '')}`
            + `&MasterTableCode=${encodeURIComponent(p.MasterTableCode || p.Code || 0)}`
            + `&Code=${encodeURIComponent(p.Code || p.MasterTableCode || 0)}`
            + `&EntryNo=${encodeURIComponent(p.EntryNo || 0)}`
            + `&VoucherType=${encodeURIComponent(p.VoucherType || '')}`
            + `&VoucherNo=${encodeURIComponent(p.VoucherNo || '')}`
            + `&RecordDate=${encodeURIComponent(recordDate)}`
            + `&CompanyCode=${encodeURIComponent(companyCode)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, '');
    },

    /** Row-level Show / Edit — Show opens voucher Crystal report; Edit navigates to voucher screen. */
    GetLedgerVoucherAction: function GetLedgerVoucherAction(Mode, rowPayload) {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const payload = Object.assign({
            CompanyCode: authKey.CompanyCode || 0
        }, rowPayload || {});

        if (payload.RecordDate !== undefined && payload.RecordDate !== null && payload.RecordDate !== '' && payload.RecordDate !== '0') {
            payload.RecordDate = formatLedgerDate(payload.RecordDate);
        }

        const apiPromise = LedgerService.GetLedgerData(Mode, '0', '0', '0', payload);

        if (Mode !== 'SHOW_VOUCHER') {
            return apiPromise;
        }

        return apiPromise.then(function (response) {
            if (LedgerService.extractCrystalUrl(response)) {
                return response;
            }
            return LedgerService.PreviewLedgerVoucherReport(payload);
        });
    }
}

export { LedgerService }
