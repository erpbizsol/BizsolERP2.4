import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const DepartmentService = {
    DepartmentList: function DepartmentList(Status) {
        var URL = UrlService.API_ENDPOINT_Department + "/GetDepartmentMasterList?Status=" + Status + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetDepartmentByCode: function GetDepartmentByCode(Code) {
        var URL = UrlService.API_ENDPOINT_Department + "/GetDepartmentMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveDepartment: function SaveDepartment(Data) {
        var URL = UrlService.API_ENDPOINT_Department + "/SaveDepartmentMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteDepartment: function DeleteDepartment(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_Department + "/DeleteDepartmentMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDepartmentTypeList: function GetDepartmentTypeList() {
        var URL = UrlService.API_ENDPOINT_Department + "/GetDepartmentTypeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDivisionList: function GetDivisionList() {
        var URL = UrlService.API_ENDPOINT_Department + "/GetDivisionList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    }
}

export { DepartmentService }