import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const EmployeeMasterService = {

    GetEmployeeMasterList: function GetEmployeeMasterList(EmployeeStatus) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetEmployeeMasterList?EmployeeStatus=${EmployeeStatus}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetEmployeeMasterByCode: function GetEmployeeMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetLeaveDetailByEmployeeMaster_Code: function GetLeaveDetailByEmployeeMaster_Code(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetLeaveDetailByEmployeeMaster_Code?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDeductionDetailByEmployeeMaster_Code: function GetDeductionDetailByEmployeeMaster_Code(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetDeductionDetailByEmployeeMaster_Code?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAllowanceDetailByEmployeeMaster_Code: function GetAllowanceDetailByEmployeeMaster_Code(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetAllowanceDetailByEmployeeMaster_Code?EmployeeMaster_Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckModuleOptionRight: function CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var UserMaster_Code = authKeyData.UserMaster_Code;
        let url = UrlService.ERP_SIDE_MENU + `/CheckModuleOptionRight?ModuleName=${ModuleName}&OptionName=${OptionName}&ShowMsg=${ShowMsg}&FinYear=${FinYear}&UserMaster_Code=${UserMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );


    },
    DeleteEmployeeMaster: function DeleteEmployeeMaster(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/DeleteEmployeeMaster?Code=${Code} &UserMaster_Code=${userMasterCode}&ReasonForDelete=${ReasonForDelete}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCountryMasterList: function GetCountryMasterList() {
        
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var URL = UrlService.API_ENDPOINT_COUNTRY + `/GetCountryMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EmployeeSkill: function EmployeeSkill() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/EmployeeSkill`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EmployeeGrade: function EmployeeGrade() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/EmployeeGrade`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EmployeeCategory: function EmployeeCategory() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/EmployeeCategory`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetConfigEmployeeMaster: function GetConfigEmployeeMaster() {
        let url = UrlService.API_ENDPOINT_EmployeeMaster + `/GetConfigEmployeeMaster`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUserList: function GetUserList() {
        let url = UrlService.API_UserMODULE + `/GetUserList`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckDuplicateCardNo: function CheckDuplicateCardNo(Code, EmployeeCardNo) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/CheckDuplicateCardNo?EmployeeCardNo=${EmployeeCardNo}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckEmployeeName: function CheckEmployeeName(Code, EmployeeName) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/CheckEmployeeName?EmployeeName=${EmployeeName}&Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveEmployeeMaster: function SaveEmployeeMaster(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + "/SaveEmployeeMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetDepartmentMasterList: function GetDepartmentMasterList() {
        var URL = UrlService.API_ENDPOINT_DEPARTMENT + `/GetDepartmentMasterList?Status=Y`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSubDepartmentMasterList: function GetSubDepartmentMasterList(Department) {
        var URL = UrlService.API_ENDPOINT_SUBDEPARTMENT + `/GetSubDepartmentMasterList?Status=A&DepartmentName=${Department}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDesignationMasterList: function GetDesignationMasterList() {
        var URL = UrlService.API_ENDPOINT_DESIGNATION + `/GetDesignationMasterList?Status=Y`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EmployeeShift: function EmployeeShift() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/EmployeeShift`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveEmployeeAllowanceDetails: function SaveEmployeeAllowanceDetails(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + "/SaveEmployeeAllowanceDetails";
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetLeaveDetailByEmployeeMaster_Code: function GetLeaveDetailByEmployeeMaster_Code(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetLeaveDetailByEmployeeMaster_Code?EmployeeMaster_Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDeductionDetailByEmployeeMaster_Code: function GetDeductionDetailByEmployeeMaster_Code(Code) {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/GetDeductionDetailByEmployeeMaster_Code?EmployeeMaster_Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveEmployeeLeaveDetails: function SaveEmployeeLeaveDetails(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + "/SaveEmployeeLeaveDetails";
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    SaveEmployeeDeductionDetails: function SaveEmployeeDeductionDetails(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + "/SaveEmployeeDeductionDetails";
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetBankMasterList: function GetBankMasterList() {
        var URL = UrlService.API_ENDPOINT_BANK_MASTER + `/GetBankMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBankMasterByCode: function GetBankMasterByCode(Code) {
        var URL = UrlService.API_ENDPOINT_BANK_MASTER + `/${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityMasterList: function GetCityMasterList(CountryName, StateName) {
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityList?CountryName=${CountryName}&StateName=${StateName}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetStateMasterList: function GetStateMasterList(CountryName) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_STATE + `/GetStateList?CountryName=${CountryName}&UserId=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetF_PayrollParameter: function GetF_PayrollParameter() {
        var URL = UrlService.API_ENDPOINT_FixedParameter + `/GetF_PayrollParameter`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DegreeMasterList: function DegreeMasterList() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/DegreeMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    
    MachineMasterList: function MachineMasterList() {
        var URL = UrlService.API_ENDPOINT_EmployeeMaster + `/MachineMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { EmployeeMasterService }