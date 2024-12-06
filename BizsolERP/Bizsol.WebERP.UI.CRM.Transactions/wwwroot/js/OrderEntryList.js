import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
let fixedParaMeterConfigurationList = [];
let QtyMTHeader = '';
let QtyPCHeader = '';
let QtyMTRHeader = '';
$(document).ready(function () {
    $("#ERPHeading").text("Order Entry List");
    GetOrderStatusList();
    GetUserNameList();
    highlightSelectedDates();

    const order = {
        VisitMaster_Code: '',
        Code: '',
        ButtonStatus: 'UnVerified'
    };
    manageEditButton(order);
    $('#editButton').on('click', function () {
        openEditVisitMaster(order.VisitMaster_Code, order.Code);
    });

    $('#btnShow').on('click', function () {
        let FromDate = convertDateFormat($('#txtFromDate').val());
        let ToDate = convertDateFormat($('#txtToDate').val());
        let UserName = $('#ddlUserName').val();
        let OrderStatus = $('#ddlOrderStatus').val();
        if ($('#ddlOrderStatus').val() === 'All') {
            OrderStatus = '';
        }
        if (typeof $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null) {
            $('#txtFromDate').focus();
        }else if (typeof $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null) {
            $('#txtToDate').focus();
        }else if ($('#ddlUserName').val() === '') {
            $('#ddlUserName').focus();
        }else if ($('#ddlOrderStatus').val() === '') {
            $('#ddlOrderStatus').focus();
        }else {
            GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus);
            GetFixedParameterConfiguration();
        }
    });
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlUserName").focus();
        }
    });
    $('#ddlUserName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlOrderStatus").focus();
        }
    });
    $('#ddlOrderStatus').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
});
function manageEditButton(order) {
    const isEnabled = order.ButtonStatus === 'UnVerified';
    $('#editButton').prop('disabled', !isEnabled);

}
function setupDateInputFormatting() {
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtFromDate').val('');

        }
    } else {
        $('#txtFromDate').val('');

    }
}
function highlightSelectedDates() {
    var highlightedDates = {};
    var selectedDates = ['01/10/2024', '05/10/2024', '11/11/2024'];
    selectedDates.forEach(date => {
        var parts = date.split('/');
        var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]).toDateString();
        highlightedDates[formattedDate] = true;
    });

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtFromDate, #txtToDate').val(`${ day }/${ month }/${ year }`);
    $('#txtFromDate,#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        beforeShowDay: function (date) {
            const formattedDate = date.toDateString();
            if (highlightedDates[formattedDate]) {
                return { classes: 'highlighted-date', tooltip: 'Data Available' };
            }
            return { classes: '', tooltip: '' };
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day} - ${monthAbbreviation} - ${year}`;
}

function GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus) {
    OrderEntryListService.GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = [ "Visit Type", "City Name","Time", "State Name", "Remarks", "Dealer Name", "IsVerify"];
            const numericFilterColumn = ["Basic Rate", "Final Amount", "Final Rate"];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "VisitMaster_Code", "Verified On", "UserName","Verified By", "Verified", "Closed", "OtherCharges", "EditAllow", "DeleteAllow", "RejectedBy", "RejectedOn", "Reason", "VerifiedOn", "Order Type", "Total Amount"];
            const ColumnAlignment = {
                "Basic Rate": 'right',
                "Final Amount": 'right',
                "Final Rate": 'right',
                "Date": 'center',
                "Verified": 'center',
                "Closed": 'center',
            };
            if (QtyMTRHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty MR')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty MR') {
                                reorderedItem[QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTRHeader);
            } else {
                hiddenColumns.push("Total Order Qty MR");
            }
            if (QtyMTHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty') {
                                reorderedItem[QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyMTHeader);
            } else {
                hiddenColumns.push("Total Order Qty");
            }
            if (QtyPCHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty PC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty PC') {
                                reorderedItem[QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                numericFilterColumn.push(QtyPCHeader);
            } else {
                hiddenColumns.push("Total Order Qty PC");
            }

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" ${item.ButtonStatus !== 'UnVerified' ? 'disabled' : ''} onclick="openEditVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="openViewVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa-regular fa-eye"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" ${item.ButtonStatus !== 'UnVerified' ? 'disabled' : ''} onclick="Delete('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`;

                var td_StatusBtn = '';
                if (item.ButtonStatus == 'Un-Verified') {
                    td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.ButtonStatus}</button>`;
                } else if (item.ButtonStatus == 'Verified') {
                    td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.ButtonStatus}</button>`;
                } else if (item.ButtonStatus == 'Rejected') {
                    td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.ButtonStatus}</button>`;
                } else {
                    td_StatusBtn = `<button type="button" class="btn btn-success  btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.ButtonStatus}</button>`;
                }

                let remarksContent = item.Remarks;
                let truncatedRemarks = remarksContent.length > 15 ? remarksContent.substring(0, 15) + '...' : remarksContent;
                let remarksWithTooltip = `<span title="${remarksContent}">${truncatedRemarks}</span>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                    ButtonStatus: td_StatusBtn,
                    Remarks: remarksWithTooltip, 
                };
            });

            ColumnAlignment[QtyMTHeader] = 'right';
            ColumnAlignment[QtyMTRHeader] = 'right';
            ColumnAlignment[QtyPCHeader] = 'right';

            BizsolCustomFilterGrid.CreateDataTable("table-header","table-body",updatedResponse,button,showButtons,stringFilterColumn,numericFilterColumn,dateFilterColumn,stringDoubleFilterColumn,hiddenColumns,ColumnAlignment);
            updateFooter(response); 
        }
        else {
            toastr.error('No Data Found');
        }
    }).catch(error => {
        toastr.error(error.Msg);
    });
}
function GetOrderStatusList() {
    OrderEntryListService.GetOrderStatusList().then(function (response) {
        if (response.length > 0) {
            $('#ddlOrderStatusList option').remove();

            var option = '<option text="0" value="All" selected >All</option>';

            for (var i = 0; i < response.length; i++) {
                option += '<option value="' + response[i].VerifyStatus + '" >' + response[i].VerifyStatus + '</option>';
            }

            $('#ddlOrderStatusList')[0].innerHTML = option;
        } else {
            $('#ErrorMsg').removeClass('invisible');
            $('#ErrorMsg').addClass('visible');
            return false;
        }
    }).catch(function (error) {
        toastr.error('Error fetching order status list:', error);
    });
}
function GetUserNameList() {
    var userName = JSON.parse(sessionStorage.getItem('UserDetails'))[0].UserName;
    OrderEntryListService.GetUserNameList().then(function (result) {
        $("#ddlUserName").val(userName);
        if (result && result.length > 0) {
            const datalist = $('#ddlUserNameList');
            datalist.empty();
            result.forEach(function (item) {
                const option = $('<option>').val(item.UserName).text(item.UserName);
                datalist.append(option);
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}

function openEditVisitMaster(VisitMaster_Code, Code) {
        const VisitMaster_Codes = window.btoa(VisitMaster_Code);
        const RoutePlanCode = window.btoa(0);
    window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode="+RoutePlanCode+"&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=Edit";
}
function openViewVisitMaster(VisitMaster_Code, Code) {
    const VisitMaster_Codes = window.btoa(VisitMaster_Code);
    const RoutePlanCode = window.btoa(0);
    window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode="+RoutePlanCode +"&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=View";
}
function encodeHash(value) {
    return btoa(value); 
}
function Delete(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static', 
    });
    $("#txtcode").val(Code);
}
function DeleteModal() {
    var reason = $("#deleteReason").val();
    var code = $("#txtcode").val();
    if (reason == "") {
        alert('Please enter a reason before proceeding.');
        toastr.error(response.Msg);
        return;
    }
    OrderEntryListService.DeleteVisit(code, reason).then(function (response) {
            if (response.Msg) {
                toastr.success(response.Msg);
                $('#deleteReason').val('');
                $('#txtCode').val('');
                $('#myModal').modal('hide');
               let FromDate = convertDateFormat($('#txtFromDate').val());
               let ToDate = convertDateFormat($('#txtToDate').val());
               let UserName = $('#ddlUserName').val();
               let OrderStatus = $('#ddlOrderStatus').val();
                if ($('#ddlOrderStatus').val() === 'All') {
                    OrderStatus = '';
                }
                GetUserWiseRoutePlanDetails(FromDate, ToDate, UserName, OrderStatus);
            } else {
                toastr.error('An error occurred. Please try again.');
            }
        })
        .catch(function (error) {
            //toastr.error('An unexpected error occurred.');
            console.error(error);
        });
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function isViewButtonEnabled(order) {
    return order.ButtonStatus !== 'Verified';
}
function GetFixedParameterConfiguration() {
    OrderEntryListService.GetFixedParameterConfiguration().then(function (res) {
        fixedParaMeterConfigurationList = res;
        QtyMTHeader = fixedParaMeterConfigurationList[0].QtyMTHeader;
        QtyPCHeader = fixedParaMeterConfigurationList[0].QtyPCHeader;
        QtyMTRHeader = fixedParaMeterConfigurationList[0].QtyMTRHeader;
    });
}
function updateFooter(data) {
    const calculateTotalAmount = "Total Amount";

    if (calculateTotalAmount === "Total Amount") {
        const rowCount = data.length;
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let totalDiscount = 0;
        let totalExtraCharges = 0;

        data.forEach(row => {
            totalQuantity += parseFloat(row[QtyMTHeader] || row[QtyMTRHeader] || row[QtyPCHeader] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            totalDiscount += parseFloat(row["Final Amount"] || 0);
            totalExtraCharges += parseFloat(row["Final Rate"] || 0);
        });

        const tfootContent = `
        <tr>
            <td colspan="5"><b>Row Count :</b> ${rowCount}</td>
            <td><b>Total</b></td>
            <td style="text-align: right;">${totalQuantity.toFixed(2)}</td>
            <td style="text-align: right;">${totalBasicRate.toFixed(2)}</td>
            <td style="text-align: right;">${totalDiscount.toFixed(2)}</td>
            <td style="text-align: right;">${totalExtraCharges.toFixed(2)}</td>   
        </tr>
        `;

        const tfoot = document.querySelector("#OrderList tfoot");

        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#OrderList");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
}


function clearFooter() {
    const tfoot = document.querySelector("#table tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}

window.validateDate = validateDate;
window.highlightSelectedDates = highlightSelectedDates;
window.GetRouteDataFromOrderEntry = GetRouteDataFromOrderEntry;
window.GetOrderStatusList = GetOrderStatusList;
window.GetUserNameList = GetUserNameList;
window.openEditVisitMaster = openEditVisitMaster;
window.openViewVisitMaster = openViewVisitMaster;
window.Delete = Delete;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;
window.GetFixedParameterConfiguration = GetFixedParameterConfiguration;