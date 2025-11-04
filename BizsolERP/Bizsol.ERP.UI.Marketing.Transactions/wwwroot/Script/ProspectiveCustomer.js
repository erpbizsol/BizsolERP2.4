import { ProspectiveCustomerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProspectiveCustomerService.js';

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);

    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Prospective Customer");
    }

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
            } catch(e) {
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

            var urlParams = getUrlVars();
            var urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
            
            if (!urlMarketingMan || urlMarketingMan === '') {
                if (matchedPersonName) {
                    $('#ddlMarketingMan').val(matchedPersonName);
                } else {
                    $('#ddlMarketingMan').val("ALL");
                }
            }

        } else {
            toastr.error('No Data Found');
        }
    }).catch(function(error) {
        console.error('Error loading marketing person list:', error);
        toastr.error('Error loading sales person list');
    });
}
function GetThichnessList() {
    ProspectiveCustomerService.GetThichnessList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlThikness')[0], response.map((item) => ({ Code: item.NumericValue, Desp: item.desp })));

            $('#ddlThikness').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetSizeList() {
    ProspectiveCustomerService.GetSizeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlSize')[0], response.map((item) => ({ Code: item.NumericValue, Desp: item.desp })));

            $('#ddlSize').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetGradeList() {
    ProspectiveCustomerService.GetGradeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlGrade')[0], response.map((item) => ({ Code: item.NumericValue, Desp: item.desp })));

            $('#ddlGrade').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetISCodeList() {
    ProspectiveCustomerService.GetISCodeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlISCode')[0], response.map((item) => ({ Code: item.NumericValue, Desp: item.desp })));

            $('#ddlISCode').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetProspectiveCustomerList() {
    var MarketingPersonName = $("#ddlMarketingMan").val();
    var Thikness = $("#ddlThikness").val();
    var Size = $("#ddlSize").val();
    var Grade = $("#ddlGrade").val();
    var ISCode = $("#ddlISCode").val();
    var Status = $("#txtStatus").val();

    ProspectiveCustomerService.GetProspectiveCustomerList(MarketingPersonName, Thikness, Size, Grade, ISCode, Status).then(function (response) {
         if (response.length > 0) {
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

             BizsolCustomFilterGrid.CreateDataTable("table-header-ProspectiveCustomer", "table-body-ProspectiveCustomer", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        }
        else {
            toastr.error('No Data Found');
        }
    }).catch(function(error) {
        HideLoader();
        toastr.error('Error loading buying capacity data');
        console.error('Error:', error);
    });
}
function BindSelectList1(element, list) {
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

window.GetProspectiveCustomerList = GetProspectiveCustomerList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
