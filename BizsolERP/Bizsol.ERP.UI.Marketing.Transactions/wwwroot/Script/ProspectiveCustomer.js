import { ProspectiveCustomerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProspectiveCustomerService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

// Preserve native URL constructor before it gets shadowed by service file
var OriginalURLConstructor = null;
if (typeof window !== 'undefined' && typeof window.URL === 'function') {
    OriginalURLConstructor = window.URL;
}

// Helper function to restore URL constructor
function restoreURLConstructor() {
    if (OriginalURLConstructor && typeof OriginalURLConstructor === 'function') {
        try {
            window.URL = OriginalURLConstructor;
        } catch (e) {
            // If window.URL is read-only, try to restore via delete
            try {
                delete window.URL;
                window.URL = OriginalURLConstructor;
            } catch (e2) {
                // If still fails, define it
                Object.defineProperty(window, 'URL', {
                    value: OriginalURLConstructor,
                    writable: true,
                    configurable: true
                });
            }
        }
    }
}

// Restore immediately after imports
restoreURLConstructor();

// Periodically restore URL constructor to prevent it from being shadowed
setInterval(function() {
    restoreURLConstructor();
}, 100);

$(document).ready(function () {
    // Ensure URL constructor is available
    restoreURLConstructor();
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetNestedMarketingManList();
    GetThichnessList();
    GetSizeList();
    GetGradeList();
    GetISCodeList();
    $("#btnShow").click(function () {
        GetProspectiveCustomerList();
    });
});
function GetNestedMarketingManList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            $('#ddlSalesPersonList').empty();

            let options = '<option value="ALL" selected>ALL</option>';
            let matchedPersonName = null;

            try {
                var authKeyStr = sessionStorage.getItem('authKey');
                var userMaster_Code = null;
                if (authKeyStr) {
                    var authKey = JSON.parse(authKeyStr);
                    userMaster_Code = authKey ? authKey.UserMaster_Code : null;
                }
            } catch (e) {
                console.error('Error parsing authKey:', e);
                userMaster_Code = null;
            }

            for (let i = 0; i < response.length; i++) {
                const person = response[i];

                if (person && person.PersonName) {
                    if (userMaster_Code && person.Usermaster_Code == userMaster_Code) {
                        matchedPersonName = person.PersonName;
                    }

                    options += `<option value="${person.PersonName}">${person.PersonName}</option>`;
                }
            }

            $('#ddlSalesPersonList').html(options);

            // Set default marketing man value
            try {
                var urlMarketingMan = '';
                if (typeof getUrlVars === 'function') {
                    var urlParams = getUrlVars();
                    urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
                }
                if (!urlMarketingMan || urlMarketingMan === '') {
                    if (matchedPersonName) {
                        $('#ddlMarketingMan').val(matchedPersonName);
                    } else {
                        $('#ddlMarketingMan').val("ALL");
                    }
                } else {
                    $('#ddlMarketingMan').val(urlMarketingMan);
                }
            } catch (_) { $('#ddlMarketingMan').val("ALL"); }

        } else {
            toastr.error('No Data Found');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        console.error('Error loading marketing person list:', error);
        toastr.error('Error loading sales person list');
        restoreURLConstructor();
    });
}
function GetThichnessList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetThichnessList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlThikness')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlThikness').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetSizeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetSizeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlSize')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlSize').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetGradeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetGradeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlGrade')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlGrade').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetISCodeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetISCodeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlISCode')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlISCode').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetProspectiveCustomerList() {
    restoreURLConstructor();
    var MarketingPersonName = $("#ddlMarketingMan").val() || 'ALL';
    var Thikness = $("#ddlThikness").val();
    var Size = $("#ddlSize").val();
    var Grade = $("#ddlGrade").val();
    var ISCode = $("#ddlISCode").val();
    var Status = $("#txtStatus").val();
    Showloader();
    ProspectiveCustomerService.GetProspectiveCustomerList(MarketingPersonName, Thikness, Size, Grade, ISCode, Status).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#ProspectiveCustomer').show();
            const StringFilterColumn = ["Marketing Person", "Customer Name", "Contact Person", "Contact No", "Email", "Sagment", "Nation", "City", "State", "Payment Term", "Volume", "Created By", "Updated By"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-ProspectiveCustomer", "table-body-ProspectiveCustomer", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        } else {
            HideLoader();
            $('#ProspectiveCustomer').hide();
            toastr.error('No Data Found');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        HideLoader();
        $('#ProspectiveCustomer').hide();
        toastr.error('Error loading prospective customer data');
        console.error('Error:', error);
        restoreURLConstructor();
    });
}
function BindSelectList1(element, list) {
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}


window.GetProspectiveCustomerList = GetProspectiveCustomerList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
