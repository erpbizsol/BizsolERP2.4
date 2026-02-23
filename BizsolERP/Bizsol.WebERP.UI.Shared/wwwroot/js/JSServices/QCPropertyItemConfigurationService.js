import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const QCPropertyItemConfigurationService = {
    SaveQCPropertyItemConfiguration: function SaveQCPropertyItemConfiguration(data) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        const json = JSON.stringify(data, null, 2);
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/SaveQCPropertyItemConfiguration?UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('POST', url, json).then(function (value) {
            return value;
        });
    },
    GetQCPropertyItemConfigurationByCode: function GetQCPropertyItemConfigurationByCode(Code) {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyItemConfigurationByCode?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetQCPropertyItemConfigurationList: function GetQCPropertyItemConfigurationList(IsProperty) {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyItemConfigurationList?IsProperty=${IsProperty}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    },
    
    DeleteQCPropertyItemConfiguration: function DeleteQCPropertyItemConfiguration(Code, Remark) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/DeleteQCPropertyItemConfiguration?Code=${encodeURIComponent(Code)}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${Remark}&IPAddress=''&Location=''`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    DeleteQCPropertyItemConfigurationByCode: function DeleteQCPropertyItemConfigurationByCode(Code, Remark) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userMasterCode = authKeyData.UserMaster_Code || 0;
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/DeleteQCPropertyItemConfigurationByCode?Code=${encodeURIComponent(Code)}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${Remark}&IPAddress=''&Location=''`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetItemMasterList: function GetItemMasterList(Category) {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyItemName?Category=${Category}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetQCPropertyGroupMasterList: function GetQCPropertyGroupMasterList() {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyGroupMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetQCPropertyMasterForDropdown: function GetQCPropertyMasterForDropdown(QCPropertyGroupMaster_Code) {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyMasterForDropdown?QCPropertyGroupMaster_Code=${QCPropertyGroupMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetQCPropertyItemCategory: function GetQCPropertyItemCategory() {
        const url = UrlService.API_ENDPOINT_QCPropertyGroupMaster + `/GetQCPropertyItemCategory`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
};

export { QCPropertyItemConfigurationService };


