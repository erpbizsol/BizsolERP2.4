import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';
const LeadMasterService = {
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=`+ userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetStatuslist: function GetStatuslist() {
        var jsonData = {
            distinct: "Y",
            fieldName: "[dbo].[UDF_WebAPI_GetStatusFromEnquiry]([Vw_WebAPI_EnquiryMaster].Code)",
            fieldNameOrderBy: "",
            filterCondition: "group by [dbo].[UDF_WebAPI_GetStatusFromEnquiry]([Vw_WebAPI_EnquiryMaster].Code)",
            tableName: "Vw_WebAPI_EnquiryMaster",
            UserMaster_Code: userMasterCode
        };
        var json_data = JSON.stringify(jsonData);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DROPDOWN + `/GetDropdownList`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;``
            }
        );

    },
    GetAccountlist: function GetAccountlist() {
        var jsonData = {
            distinct: "Y",
            fieldName: "AccountDesp",
            fieldNameOrderBy: "",
            filterCondition: " AND Code in (Select Code From [Dbo].[UDF_GetNestedDealerList](0,0))",
            tableName: "AccountMaster",
            UserMaster_Code: userMasterCode
        };
        var json_data = JSON.stringify(jsonData);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DROPDOWN + `/GetDropdownList`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value; ``
            }
        );

    },
    GetEnquiryTypelist: function GetEnquiryTypelist() {
        var jsonData = {
            distinct: "Y",
            fieldName: "EnquiryTypeDesp",
            fieldNameOrderBy: "EnquiryTypeDesp",
            filterCondition: " And EnquiryTypeDesp<>''",
            tableName: "EnquiryTypeMaster",
            UserMaster_Code: userMasterCode
        };
        var json_data = JSON.stringify(jsonData);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DROPDOWN + `/GetDropdownList`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value; ``
            }
        );

    },
    GetAccountCategorylist: function GetAccountCategorylist() {
        var jsonData = {
            distinct: "Y",
            fieldName: "AccountCategory",
            fieldNameOrderBy: "",
            filterCondition: " And AccountCategory<>''",
            tableName: "AccountMaster",
            UserMaster_Code: userMasterCode
        };
        var json_data = JSON.stringify(jsonData);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DROPDOWN + `/GetDropdownList`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value; ``
            }
        );

    },
    GetLeadSourcelist: function GetLeadSourcelist() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_LEADSOURCE + `/GetLeadSourceList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDepartmentlist: function GetDepartmentlist() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEPARTMENT + `/GetDepartmentMasterList?Status=Y`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetLeadMasterList: function GetLeadMasterList(SalesPerson) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/GetEnquiryMasterList?MarketingManPerson=` + SalesPerson;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDealerMasterByName: function GetDealerMasterByName(DealerName) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/GetDealerMasterByName?DealerName=` + DealerName;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    SaveDealerMaster: function SaveDealerMaster(DealerMasterData) {
        var json_data = JSON.stringify(DealerMasterData, null, 2);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/SaveDealerMaster`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );

    },
    DeleteDealerMaster: function DeleteDealerMaster(Code, ReasonForDelete) {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_DEALER_MASTER + `/DeleteDealerMaster?Code=${Code}&UserMaster_Code=${userMasterCode}&ReasonForDelete=${ReasonForDelete}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetNestedAccountMasterList: function GetNestedAccountMasterList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=` + userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityList: function GetCityList(CountryName, StateName) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityList?CountryName=` + CountryName + `&StateName=` + StateName + `&UserId=` + userMasterCode;
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
    GetCountryMasterList: function GetCountryMasterList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var URL = UrlService.API_ENDPOINT_COUNTRY + `/GetCountryMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityDetailsByName: function GetCityDetailsByName(CityName, Mode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityMasterByName?CityName=` + CityName + `&Mode=` + Mode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDesignationList: function GetDesignationList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/GetContactPersonDepartment`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUOMMasterList: function GetUOMMasterList() {
        var url = UrlService.API_ENDPOINT_UOM + '/GetUOMMasterList';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetItemMasterDropDown: function GetItemMasterDropDown() {
        var url = UrlService.API_ENDPOINT_ITEM + '/GetItemMasterDropDown';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetItemSizeMasterList: function GetItemSizeMasterList(ItemName) {
        var url = UrlService.API_ENDPOINT_ItemSize + '/GetItemSizeMasterList?ItemName=' + encodeURIComponent(ItemName);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetAccountDetailsByAccountDesp: function GetAccountDetailsByAccountDesp(CompanyName) {
        var url = UrlService.API_ENDPOINT_ENQUIRY + '/GetAccountDetailsByAccountDesp?AccountDesp=' + encodeURIComponent(CompanyName);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetEnquiryDetailsByCode: function GetEnquiryDetailsByCode(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRY + '/GetEnquiryDetailsByCode?Code=' + encodeURIComponent(Code);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetProductDetailsByCode: function GetProductDetailsByCode(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRY + '/GetProductDetailsByCode?Code=' + encodeURIComponent(Code);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    GetContactPersonDetailsByCode: function GetContactPersonDetailsByCode(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRY + '/GetContactPersonDetailsByCode?Code=' + encodeURIComponent(Code);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
    SaveLeadEnquiryData: function SaveLeadEnquiryData(leadEnquiryData) {
        var json_data = JSON.stringify(leadEnquiryData, null, 2);
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/SaveEnquiryMaster_New`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    SaveContactPersonDetails: function SaveContactPersonDetails(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/SaveContactPersonDetails`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    SaveEnquiryProductDetails: function SaveEnquiryProductDetails(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/SaveEnquiryProductDetails`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteEnquiryMaster: function DeleteEnquiryMaster(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/DeleteEnquiryMaster_New?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}&IPAddress=${encodeURIComponent('1')}&Location=${encodeURIComponent('1')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    DeleteEnquiryContactDetail: function DeleteEnquiryContactDetail(Code,ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/DeleteEnquiryContactDetail_New?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}&IPAddress=${encodeURIComponent('')}&Location=${encodeURIComponent('')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    DeleteEnquiryProductDetail: function DeleteEnquiryProductDetail(Code,ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/DeleteEnquiryProductDetail_New?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}&IPAddress=${encodeURIComponent('')}&Location=${encodeURIComponent('')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
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
    VerifyEnquiry: function VerifyEnquiry(Code, ReasonForVerify) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/EnquiryVerifyDetail?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForVerify=${encodeURIComponent(ReasonForVerify)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    RejectEnquiry: function RejectEnquiry(Code, ReasonForReject) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/EnquiryReject?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForReject=${encodeURIComponent(ReasonForReject)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    EnquiryAssign: function EnquiryAssign(Code, MarketingPersonMaster_Code) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/EnquiryAssignPersonDetail?EnquiryMaster_Code=${encodeURIComponent(Code)}&MarketingPersonMaster_Code=${encodeURIComponent(MarketingPersonMaster_Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    GetEnquiryFollowUpList: function GetEnquiryFollowUpList(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRYFOLLOWUP +
            `/GetEnquiryFollowUpList?EnquiryMaster_Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    GetEnquiryContactPersonDetailList: function GetEnquiryContactPersonDetailList(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRYFOLLOWUP +
            `/GetEnquiryContactPersonDetailList?EnquiryMaster_Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    SaveEnquiryFollowUp: function SaveEnquiryFollowUp(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ENQUIRYFOLLOWUP + `/SaveEnquiryFollowUp?UserId=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetEnquiryFollowUpByCode: function GetEnquiryFollowUpByCode(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRYFOLLOWUP +
            `/${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    DeleteEnquiryFollowUp: function DeleteEnquiryFollowUp(Code, ReasonForDelete) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var url = UrlService.API_ENDPOINT_ENQUIRYFOLLOWUP +
            `/DeleteEnquiryFollowUp?Code=${encodeURIComponent(Code)}&UserMaster_Code=${encodeURIComponent(userMasterCode)}&ReasonForDelete=${encodeURIComponent(ReasonForDelete)}&IPAddress=${encodeURIComponent('')}&Location=${encodeURIComponent('')}`;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(function (value) {
            return value;
        });
    },
    GetCompanyParameter: function GetCompanyParameter() {
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/GetCompanyParameter`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    GetAssignDetails: function GetAssignDetails(Code) {
        var url = UrlService.API_ENDPOINT_ENQUIRY +
            `/GetAssignDetails?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(function (value) {
            return value;
        });
    },
    GetLeadStatuslist: function GetLeadStatuslist() {
        var URL = UrlService.API_ENDPOINT_ENQUIRY + `/GetLeadStatuslist`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { LeadMasterService }

