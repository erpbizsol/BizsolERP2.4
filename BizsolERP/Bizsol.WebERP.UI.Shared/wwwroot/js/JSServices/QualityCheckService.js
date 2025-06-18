import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const QualityCheckService = {
    SaveQRQualityCheck: function SaveQRQualityCheck(QRQCPayLoad) {
        var URL = UrlService.API_ENDPOINT_QualityCheck + "/SaveQRQualityCheck";
        return promiseAjaxCallApi.CallAPI('POST', URL, QRQCPayLoad).then(
            function (value) {
                return value;
            }
        );
    }

}

export { QualityCheckService }