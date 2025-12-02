import { BalancePOCancellationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BalancePOCancellationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';
import { ClosePendingOrderService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ClosePendingOrderService.js';

let G_FromDateValue = '';
let G_ToDateValue = '';
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    setCurrentDateDispatch();
    GetNestedMarketingManList();
    GetThichnessList();
    GetSizeList();
    GetGradeList();
    GetISCodeList();
    $("#btnShow").click(function () {
        GetBalancePOCancellationList();
    });
});
function setCurrentDateDispatch() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    $('#txtBalanceFromDate').val(formatDate(firstOfMonth));
    $('#txtBalanceToDate').val(formatDate(today));
    G_FromDateValue = $('#txtBalanceFromDate').val();
    G_ToDateValue = $('#txtBalanceToDate').val();

}
function GetNestedMarketingManList() {
    LeadMasterService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            let matchedPersonName = null;
            let marketingList = [];

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

                    marketingList.push({
                        Code: person.PersonName,
                        Desp: person.PersonName
                    });
                }
            }

            BindSelectList1($('#ddlMarketingMan')[0], marketingList);
            $('#ddlMarketingMan option[value="0"]').val("ALL");
            $('#ddlMarketingMan').select2({
                width: '-webkit-fill-available'
            });

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
    }).catch(function (error) {
        console.error('Error loading marketing person list:', error);
        toastr.error('Error loading sales person list');
    });
}
function GetThichnessList() {
    restoreURLConstructor();
    BalancePOCancellationService.GetThichnessList().then(function (response) {
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
    BalancePOCancellationService.GetSizeList().then(function (response) {
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
    BalancePOCancellationService.GetGradeList().then(function (response) {
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
    BalancePOCancellationService.GetISCodeList().then(function (response) {
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
function GetBalancePOCancellationList() {
    var MarketingPersonName = $("#ddlMarketingMan").val() || 'ALL';
    G_FromDateValue = $("#txtBalanceFromDate").val();
    G_ToDateValue = $("#txtBalanceToDate").val();
    var partyName = $("#ddlPartyName").val();
   
    Showloader();
    ClosePendingOrderService.GetCancelPendingOrderList(G_FromDateValue, G_ToDateValue, MarketingPersonName, partyName).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#BalancePOCancellation').show();
            const StringFilterColumn = ["Marketing Person", "Customer Name", "Contact Person", "Contact No", "Email", "Sagment", "Nation", "City", "State", "Payment Term", "Volume", "Created By", "Updated By"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-BalancePOCancellation", "table-body-BalancePOCancellation", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        } else {
            HideLoader();
            $('#BalancePOCancellation').hide();
            toastr.error('No Data Found');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        HideLoader();
        $('#BalancePOCancellation').hide();
        toastr.error('Error loading Balance PO Cancellation data');
    });
}
function BindSelectList1(element, list) {
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}


window.GetBalancePOCancellationList = GetBalancePOCancellationList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
