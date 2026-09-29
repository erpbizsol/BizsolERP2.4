import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getUserMasterCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        return authKeyData ? authKeyData.UserMaster_Code : 0;
    } catch (e) {
        return 0;
    }
}

const MRNUpdationService = {
    GetUnverifiedMrnList: function GetUnverifiedMrnList() {
        const userMasterCode = getUserMasterCode();
        const URL = UrlService.API_ENDPOINT_MRNUpdation +
            `/GetUnverifiedMrnList?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetMRNDetail: function GetMRNDetail(mrnMasterCode) {
        const userMasterCode = getUserMasterCode();
        const URL = UrlService.API_ENDPOINT_MRNUpdation +
            `/GetMRNDetail?MRNMaster_Code=${encodeURIComponent(mrnMasterCode)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    UpdateActualWeight: function UpdateActualWeight(code, mrnMasterCode, actualWeight) {
        const userMasterCode = getUserMasterCode();
        const URL = UrlService.API_ENDPOINT_MRNUpdation +
            `/UpdateActualWeight?Code=${encodeURIComponent(code)}` +
            `&MRNMaster_Code=${encodeURIComponent(mrnMasterCode)}` +
            `&ActualWeight=${encodeURIComponent(actualWeight)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, '').then(function (value) {
            return value;
        });
    },
};

export { MRNUpdationService };
