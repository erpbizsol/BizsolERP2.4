import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StoreRequisitionSlipService = {

    GetStoreRequisitionList: function (fromDate, toDate, finYear) {
        const url = UrlService.API_ENDPOINT_StoreRequisitionMaster + `/GetStoreRequisitionList?FromDate=${fromDate}&ToDate=${toDate}&FinYear=${finYear}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '');
    }
};

export { StoreRequisitionSlipService }
