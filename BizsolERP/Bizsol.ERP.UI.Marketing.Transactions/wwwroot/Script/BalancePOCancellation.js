import { BalancePOCancellationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BalancePOCancellationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';
import { ClosePendingOrderService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ClosePendingOrderService.js';

let G_FromDateValue = '';
let G_ToDateValue = '';
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    setCurrentDateBalancePOCancellation();
    InitializeUnitDropdowns();
    InitializeBalanceQtyOperator();
    GetFilterForCancelPendingOrder();
    //GetNestedMarketingManList();
    InitializePartyNameDropdown();
    InitializeOrderNoDropdown();
    InitializeOrderTypeDropdown();
    InitializeItemNameDropdown();
    InitializeBuyerPONoDropdown();

    $("#btnShow").click(function () {
        GetBalancePOCancellationList();
    });

    $("#btnSelectAll").click(function () {
        SelectAllRows();
    });

    $("#btnSaveBalance").click(function () {
        SaveBalancePOCancellation();
    });

    $("#ddlBalanceQtyOperator").change(function () {
        ToggleBalanceQtyToField();
    });

    $("#ddlDispatchQtyOperator").change(function () {
        ToggleDispatchQtyToField();
    });
});
function setCurrentDateBalancePOCancellation() {
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

function InitializeUnitDropdowns() {
    var unitList = [
        { Code: 'MT', Desp: 'MT' },
        { Code: 'PC', Desp: 'PC' },
        { Code: 'MTRS', Desp: 'MTRS' }
    ];
    
    if ($('#ddlBalanceQtyUnit').length > 0) {
        BindSelectList1($('#ddlBalanceQtyUnit')[0], unitList);
        $('#ddlBalanceQtyUnit').val('');
    }
    
    if ($('#ddlDispatchQtyUnit').length > 0) {
        BindSelectList1($('#ddlDispatchQtyUnit')[0], unitList);
        $('#ddlDispatchQtyUnit').val('');
    }
}

function InitializeBalanceQtyOperator() {
    if ($('#ddlBalanceQtyOperator').length > 0) {
        $('#ddlBalanceQtyOperator').val('>');
    }
    if ($('#txtBalanceQtyFrom').length > 0) {
        $('#txtBalanceQtyFrom').val('0.000');
    }
    if ($('#txtBalanceQtyTo').length > 0) {
        $('#txtBalanceQtyTo').val('0.000');
    }
    if ($('#ddlDispatchQtyOperator').length > 0) {
        $('#ddlDispatchQtyOperator').val('>');
    }
    if ($('#txtDispatchQtyFrom').length > 0) {
        $('#txtDispatchQtyFrom').val('0.000');
    }
    if ($('#txtDispatchQtyTo').length > 0) {
        $('#txtDispatchQtyTo').val('0.000');
    }
    ToggleBalanceQtyToField();
    ToggleDispatchQtyToField();
}

function ToggleBalanceQtyToField() {
    if ($('#ddlBalanceQtyOperator').length > 0 && $('#txtBalanceQtyTo').length > 0) {
        var operator = $('#ddlBalanceQtyOperator').val();
        if (operator === 'between') {
            $('#txtBalanceQtyTo').show();
        } else {
            $('#txtBalanceQtyTo').hide();
            $('#txtBalanceQtyTo').val('');
        }
    }
}

function ToggleDispatchQtyToField() {
    if ($('#ddlDispatchQtyOperator').length > 0 && $('#txtDispatchQtyTo').length > 0) {
        var operator = $('#ddlDispatchQtyOperator').val();
        if (operator === 'between') {
            $('#txtDispatchQtyTo').show();
        } else {
            $('#txtDispatchQtyTo').hide();
            $('#txtDispatchQtyTo').val('');
        }
    }
}

function InitializePartyNameDropdown() {
    if ($('#ddlPartyName').length > 0) {
        BindSelectList1($('#ddlPartyName')[0], []);
        $('#ddlPartyName').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeOrderNoDropdown() {
    if ($('#ddlOrderNo').length > 0) {
        BindSelectList1($('#ddlOrderNo')[0], []);
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeOrderTypeDropdown() {
    if ($('#ddlOrderType').length > 0) {
        BindSelectList1($('#ddlOrderType')[0], []);
        $('#ddlOrderType').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeItemNameDropdown() {
    if ($('#ddlItemName').length > 0) {
        BindSelectList1($('#ddlItemName')[0], []);
        $('#ddlItemName').select2({
            width: '-webkit-fill-available'
        });
    }
}

function InitializeBuyerPONoDropdown() {
    if ($('#ddlBuyerPONo').length > 0) {
        BindSelectList1($('#ddlBuyerPONo')[0], []);
        $('#ddlBuyerPONo').select2({
            width: '-webkit-fill-available'
        });
    }
}

function SelectAllRows() {
    var table = $('#BalancePOCancellation');
    var checkboxes = table.find('tbody input[type="checkbox"]');
    var allChecked = checkboxes.length > 0 && checkboxes.filter(':checked').length === checkboxes.length;
    
    checkboxes.prop('checked', !allChecked);
}
function GetFilterForCancelPendingOrder() {
    ClosePendingOrderService.GetFilterForCancelPendingOrder()
        .then(function (response) {
            // Bind Marketing Person (SalesPerson) list
            if (response && response.SalesPerson && response.SalesPerson.length > 0 && $('#ddlMarketingMan').length > 0) {
                var marketingList = [];
                for (var i = 0; i < response.SalesPerson.length; i++) {
                    var sp = response.SalesPerson[i].SalesPerson;
                    marketingList.push({ Code: sp, Desp: sp });
                }

                BindSelectList1($('#ddlMarketingMan')[0], marketingList);
                // Change default "ALL" option to value/text expected by this screen
                $('#ddlMarketingMan option[value="0"]').val('ALL').text('All');

                $('#ddlMarketingMan').select2({
                    width: '-webkit-fill-available'
                });
            }

            // Bind Party Name list
            if (response && response.PartyName && response.PartyName.length > 0 && $('#ddlPartyName').length > 0) {
                var partyList = [];
                for (var j = 0; j < response.PartyName.length; j++) {
                    var party = response.PartyName[j].Party;
                    partyList.push({ Code: party, Desp: party });
                }

                BindSelectList1($('#ddlPartyName')[0], partyList);
                $('#ddlPartyName option[value="0"]').val('ALL').text('All');

                $('#ddlPartyName').select2({
                    width: '-webkit-fill-available'
                });
            }
        })
        .catch(function (error) {
            console.error('Error fetching data:', error);
            if ($('#ddlMarketingMan').length > 0) {
                $('#ddlMarketingMan').empty();
            }
            if ($('#ddlPartyName').length > 0) {
                $('#ddlPartyName').empty();
            }
        });
}
//function GetNestedMarketingManList() {
//    LeadMasterService.GetNestedMarketingManList().then(function (response) {
//        if (response && response.length > 0) {
//            let matchedPersonName = null;
//            let marketingList = [];

//            try {
//                var authKeyStr = sessionStorage.getItem('authKey');
//                var userMaster_Code = null;
//                if (authKeyStr) {
//                    var authKey = JSON.parse(authKeyStr);
//                    userMaster_Code = authKey ? authKey.UserMaster_Code : null;
//                }
//            } catch (e) {
//                console.error('Error parsing authKey:', e);
//                userMaster_Code = null;
//            }

//            for (let i = 0; i < response.length; i++) {
//                const person = response[i];

//                if (person && person.PersonName) {
//                    if (userMaster_Code && person.Usermaster_Code == userMaster_Code) {
//                        matchedPersonName = person.PersonName;
//                    }

//                    marketingList.push({
//                        Code: person.PersonName,
//                        Desp: person.PersonName
//                    });
//                }
//            }

//            BindSelectList1($('#ddlMarketingMan')[0], marketingList);
//            $('#ddlMarketingMan option[value="0"]').val("ALL");
//            $('#ddlMarketingMan').select2({
//                width: '-webkit-fill-available'
//            });

//            try {
//                var urlMarketingMan = '';
//                if (typeof getUrlVars === 'function') {
//                    var urlParams = getUrlVars();
//                    urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
//                }
//                if (!urlMarketingMan || urlMarketingMan === '') {
//                    if (matchedPersonName) {
//                        $('#ddlMarketingMan').val(matchedPersonName);
//                    } else {
//                        $('#ddlMarketingMan').val("ALL");
//                    }
//                } else {
//                    $('#ddlMarketingMan').val(urlMarketingMan);
//                }
//            } catch (_) { $('#ddlMarketingMan').val("ALL"); }

//        } else {
//            toastr.error('No Data Found');
//        }
//    }).catch(function (error) {
//        console.error('Error loading marketing person list:', error);
//        toastr.error('Error loading sales person list');
//    });
//}
function GetBalancePOCancellationList() {
    var MarketingPersonName = $("#ddlMarketingMan").val();
    if (MarketingPersonName == null || MarketingPersonName === 'ALL') {
        MarketingPersonName = '';
    }

    G_FromDateValue = $("#txtBalanceFromDate").val();
    G_ToDateValue = $("#txtBalanceToDate").val();

    var partyName = $("#ddlPartyName").val();
    if (partyName == null || partyName === 'ALL') {
        partyName = '';
    }
    var orderNo = $("#ddlOrderNo").val() || 'ALL';
    var orderType = $("#ddlOrderType").val() || 'ALL';
    var itemName = $("#ddlItemName").val() || 'ALL';
    var buyerPONo = $("#ddlBuyerPONo").val() || 'ALL';
    var balanceQtyUnit = $("#ddlBalanceQtyUnit").val() || '';
    var balanceQtyOperator = $("#ddlBalanceQtyOperator").val() || '';
    var balanceQtyFrom = $("#txtBalanceQtyFrom").val() || '0.000';
    var balanceQtyTo = $("#txtBalanceQtyTo").val() || '0.000';
    var dispatchQtyUnit = $("#ddlDispatchQtyUnit").val() || '';
    var dispatchQtyFrom = $("#txtDispatchQtyFrom").val() || '0.000';
    var dispatchQtyTo = $("#txtDispatchQtyTo").val() || '0.000';
    var periodWise = $("#chkPeriodWise").is(':checked');
    var showOrderQty = $("#chkOrderQty").is(':checked');
    var dispatchQtyOperator = $("#ddlDispatchQtyOperator").val() || '';
    var showDispatchQty = $("#chkShowDispatchQty").is(':checked');
    var showDeliveryDetail = $("#DeliveryDetailCheck").is(':checked');
   
    Showloader();
    ClosePendingOrderService.GetCancelPendingOrderList(G_FromDateValue, G_ToDateValue, MarketingPersonName, partyName).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#BalancePOCancellation').show();
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "BuyerPODetail_Code", "BuyerPOMaster_Code"];
            const ColumnAlignment = {};
            response.forEach((item, index) => {
                item.Select = `<input type="checkbox" class="select-checkbox" data-index="${index}">`;
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BalancePOCancellation", "table-body-BalancePOCancellation", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        } else {
            HideLoader();
            $('#BalancePOCancellation').hide();
            toastr.error('No Data Found');
        }
        
    }).catch(function (error) {
        HideLoader();
        $('#BalancePOCancellation').hide();
        toastr.error('Error loading Balance PO Cancellation data');
    });
}
function BindSelectList1(element, list) {
    if (!element) {
        console.error('BindSelectList1: element is undefined');
        return;
    }
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}


window.GetBalancePOCancellationList = GetBalancePOCancellationList;
//window.GetNestedMarketingManList = GetNestedMarketingManList;

function GetSelectedBalancePOCancellationRows() {
    var tableId = 'BalancePOCancellation';
    var selectedRows = [];

    try {
        var filteredData = window['filteredData_' + tableId] || [];
        var paginatorEnabled = window['Paginator_' + tableId];
        var currentPage = window['currentPage_' + tableId] || 1;
        var itemsPerPage = 10;

        if ($('#pageSize-' + tableId).length > 0) {
            var pageSizeValue = parseInt($('#pageSize-' + tableId).val());
            if (!isNaN(pageSizeValue) && pageSizeValue > 0) {
                itemsPerPage = pageSizeValue;
            }
        }

        $('#' + tableId + ' tbody tr').each(function () {
            var $row = $(this);
            var $checkbox = $row.find('input.select-checkbox');

            if ($checkbox.length > 0 && $checkbox.is(':checked')) {
                var rowIndex = parseInt($row.attr('data-index'));
                if (isNaN(rowIndex)) {
                    return;
                }

                var globalIndex = rowIndex;
                if (paginatorEnabled) {
                    globalIndex = (currentPage - 1) * itemsPerPage + rowIndex;
                }

                if (globalIndex >= 0 && globalIndex < filteredData.length) {
                    selectedRows.push(filteredData[globalIndex]);
                }
            }
        });
    } catch (e) {
        console.error('Error while getting selected rows:', e);
    }

    return selectedRows;
}

function SaveBalancePOCancellation() {
    if ($('#txtReason').length > 0) {
        var reason = $('#txtReason').val();
        if (reason == null || reason.trim() == '') {
            toastr.error('Reason is required.');
            $('#txtReason').focus();
            return;
        }
    }

    var selectedRows = GetSelectedBalancePOCancellationRows();
    if (!selectedRows || selectedRows.length === 0) {
        toastr.error('Please select at least one order to cancel.');
        return;
    }

    // Build payload as array of detail objects expected by API
    var reasonText = $('#txtReason').val();
    var details = [];

    for (var i = 0; i < selectedRows.length; i++) {
        var r = selectedRows[i] || {};

        var buyerPODetail_Code = 0;
        if (r.BuyerPODetail_Code != null && r.BuyerPODetail_Code !== '') {
            buyerPODetail_Code = parseInt(r.BuyerPODetail_Code) || 0;
        }

        var qtyMT = 0;
        var qtyPC = 0;
        var qtyMTRS = 0;

        // Try both camelCase and PascalCase keys, in case API returns either
        if (r.qtyMT != null && r.qtyMT !== '') {
            qtyMT = parseFloat(r.qtyMT) || 0;
        } else if (r.QtyMT != null && r.QtyMT !== '') {
            qtyMT = parseFloat(r.QtyMT) || 0;
        }

        if (r.qtyPC != null && r.qtyPC !== '') {
            qtyPC = parseFloat(r.qtyPC) || 0;
        } else if (r.QtyPC != null && r.QtyPC !== '') {
            qtyPC = parseFloat(r.QtyPC) || 0;
        }

        if (r.qtyMTRS != null && r.qtyMTRS !== '') {
            qtyMTRS = parseFloat(r.qtyMTRS) || 0;
        } else if (r.QtyMTRS != null && r.QtyMTRS !== '') {
            qtyMTRS = parseFloat(r.QtyMTRS) || 0;
        }

        details.push({
            buyerPODetail_Code: buyerPODetail_Code,
            qtyMT: qtyMT,
            qtyPC: qtyPC,
            qtyMTRS: qtyMTRS,
            remark: reasonText
        });
    }

    Showloader();
    BalancePOCancellationService.SaveCancelPendingOrder(details).then(function (response) {
        HideLoader();
        if (response && response.length > 0 && response[0].Status === 'Y') {
            toastr.success(response[0].Msg || 'Record saved successfully.');
            GetBalancePOCancellationList();
        } else if (response && response.length > 0) {
            toastr.error(response[0].Msg || 'Error while saving record.');
        } else {
            toastr.error('Error while saving record.');
        }
    }).catch(function (error) {
        HideLoader();
        if (error && error.Msg) {
            toastr.error(error.Msg);
        } else {
            toastr.error('Error while saving record.');
        }
    });
}
