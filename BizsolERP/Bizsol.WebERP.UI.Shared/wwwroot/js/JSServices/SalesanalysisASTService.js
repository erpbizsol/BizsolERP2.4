import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SalesanalysisASTService = {

    GetSalesAnalysisData: function GetSalesAnalysisData(Mode, DealerCodes, FromDate, ToDate, SalesPersons, Cities, Status, GP, IndustryType) {

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

        const requestBody = {
            Mode: Mode,
            DealerCodes: DealerCodes,
            FromDate: fd,
            ToDate: td,
            SalesPersons: SalesPersons,
            Cities: Cities,
            Status: Status,
            GP: GP,
            IndustryType: IndustryType
        };

        let url = `${UrlService.API_ENDPOINT_SalesanalysisAST}/GetSalesAnalysisData`;

        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(requestBody)).then(
            function (value) {
                return value;
            }
        );
    },
    GetMultipleTableSalesAnalysisData: function GetMultipleTableSalesAnalysisData(Mode, DealerCodes, FromDate, ToDate, SalesPersons, Cities, Status, GP, IndustryType) {

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

        const requestBody = {
            Mode: Mode,
            DealerCodes: DealerCodes,
            FromDate: fd,
            ToDate: td,
            SalesPersons: SalesPersons,
            Cities: Cities,
            Status: Status,
            GP: GP,
            IndustryType: IndustryType
        };

        let url = `${UrlService.API_ENDPOINT_SalesanalysisAST}/GetMultipleTableSalesAnalysisData`;

        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(requestBody)).then(
            function (value) {
                return value;
            }
        );
    }
}

export { SalesanalysisASTService }
