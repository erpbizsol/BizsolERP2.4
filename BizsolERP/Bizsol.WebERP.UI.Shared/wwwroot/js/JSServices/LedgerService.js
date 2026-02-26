import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const LedgerService = {

    GetLedgerData: function GetLedgerData(Mode, AccountCodes, FromDate, ToDate) {

        const formatDate = (d) => {
            if (d === '0') return "0";
            // If it's already a Date object use it, otherwise try to parse
            const dt = (d instanceof Date) ? d : new Date(d);
            if (isNaN(dt)) return String(d);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const fd = formatDate(FromDate);
        const td = formatDate(ToDate);

        let url = `${UrlService.API_ENDPOINT_Ledger}/GetLedgerData`;

        const model = {
            Mode: Mode,
            AccountCodes: AccountCodes,
            FromDate: fd,
            ToDate: td
        };

        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(model)).then(
            function (value) {
                return value;
            }
        );
    }
}

export { LedgerService }
