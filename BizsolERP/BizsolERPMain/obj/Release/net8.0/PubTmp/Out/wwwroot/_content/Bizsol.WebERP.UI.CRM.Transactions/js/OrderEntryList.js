import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
let fixedParaMeterConfigurationList = [];
let QtyMTHeader = '';
let QtyPCHeader = '';
let QtyMTRHeader = '';
let selectedDates = [];
$(document).ready(function () {
    $("#ERPHeading").text("Order Entry List");
    var ObjUserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
    if (ObjUserDetails !== undefined && ObjUserDetails[0].UserType == 'A') {
        $('#btnCRMConfig').prop('hidden', false);
    } else {
        $('#btnCRMConfig').prop('hidden', true);
    }


    GetOrderStatusList();
    GetUserNameList();
    //highlightSelectedDates();
    GetOrderListForDate();
    GetFixedParameterConfiguration();

    const order = {
        VisitMaster_Code: '',
        Code: '',
        Status: 'UnVerified'
    };
    manageEditButton(order);
    $('#editButton').on('click', function () {

        openEditVisitMaster(order.VisitMaster_Code, order.Code);
    });

    $('#btnShow').on('click', function () {
        ShowOrderList();
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
    $('#ddlUserName').on('focus', function (e) {
        $("#ddlUserName").val("");
    });
    $('#ddlOrderStatus').on('focus', function (e) {
        $("#ddlOrderStatus").val("");
    });

    $('#btnAddDirectOrder').click(function (e) {
        
            window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry";

    });
    
    $('#btnCRMConfig').click(function (e) {

        window.location = baseUrl + "/CRMTransactions/FixedParameterConfiguration/FixedParameterConfiguration";

    });

    $('#btnDirectOrder').click(function (e) {
        var ModuleName = "Direct Order Entry",
            OptionName = "NEW",
            ShowMsg = "Y",
            FinYear = getFinancialYear();
        OrderEntryListService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

            if (response.CheckModuleOptionRight == 'N') {
                toastr.error(response.Msg);
                return false;
            } else {
                    window.location = baseUrl + "/CRMTransactions/Visit/DirectOrderEntry";
            }

        });
    });
    $('#btnDownload').click(function () {
        Export();
    });


    BizSolHelperFunction.HideOrShowConfigurationSettingBtn('btnCRMConfig');
});

function ShowOrderList() {
    let FromDate = convertDateFormat($('#txtFromDate').val());
    let ToDate = convertDateFormat($('#txtToDate').val());
    //let UserName = $('#ddlUserName').val();
    //let OrderStatus = $('#ddlOrderStatus').val();
    let UserName = $('#ddlUserNameList option:selected').val();
    let OrderStatus = $('#ddlOrderStatusList option:selected').val();
    if (OrderStatus === 'All') {
        OrderStatus = '';
    }
    if (typeof $('#txtFromDate').val() === 'undefined' || $('#txtFromDate').val() === '' || $('#txtFromDate').val() === null) {
        $('#txtFromDate').focus();
    } else if (typeof $('#txtToDate').val() === 'undefined' || $('#txtToDate').val() === '' || $('#txtToDate').val() === null) {
        $('#txtToDate').focus();
        //}else if ($('#ddlUserName').val() === '') {
        //    $('#ddlUserName').focus();
        //}else if ($('#ddlOrderStatus').val() === '') {
        //    $('#ddlOrderStatus').focus();
    } else {
        GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus);
    }
}


function manageEditButton(order) {
    const isEnabled = order.Status === 'UnVerified';
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

function GetOrderListForDate() {
    OrderEntryListService.GetOrderListDates().then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.Date) {
                    selectedDates.push(item.Date);
                }
            });
            highlightSelectedDates();
            
        }
        else {
            toastr.error('No Data Found')
            highlightSelectedDates();
        }
    });

}
function highlightSelectedDates() {
    var highlightedDates = {};
    //var selectedDates = ['01/10/2024', '05/10/2024', '11/11/2024'];
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
    return `${day}-${monthAbbreviation}-${year}`;
}
function GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus) {
    OrderEntryListService.GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            $("#tblOrderList").show();
            const stringFilterColumn = [ "City Name","Time", "Remarks", "Customer Name", "IsVerify","Sales Person"];
            const numericFilterColumn = [ "Amount",  "Credit Days"];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "VisitMaster_Code", "Verified On", "Verified By", "Verified", "Closed", "OtherCharges", "EditAllow", "DeleteAllow", "RejectedBy", "RejectedOn", "Reason", "VerifiedOn", "Order Type", "Total Amount"];
            const ColumnAlignment = {
                "Basic Rate": 'right',
                "Amount": 'right',
                "Final Rate": 'right',
                "Date": 'center',
                "Verified": 'center',
                "Closed": 'center',
                "Credit Days": 'right',
            };
            if (QtyMTRHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty MR')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty MR') {
                                reorderedItem['Qty '+QtyMTRHeader] = item[key];
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
                                reorderedItem['Qty ' + QtyMTHeader] = item[key];
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
                                reorderedItem['Qty ' + QtyPCHeader] = item[key];
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
            //if (QtyMTRHeader !== '') {
            //    response = response.map(item => {
            //        if (item.hasOwnProperty('Dispatched Qty MTRS')) {
            //            const reorderedItem = {};
            //            for (const key in item) {
            //               reorderedItem[key] = item[key];
            //            }
            //            return reorderedItem;
            //        }
            //        return item;
            //    });
            //    numericFilterColumn.push("Dispatched Qty MTRS");
            //    ColumnAlignment["Dispatched Qty MTRS"] = 'right';
            //} else {
            //    hiddenColumns.push("Dispatched Qty MTRS");
            //}
            //if (QtyMTHeader !== '') {
            //    response = response.map(item => {
            //        if (item.hasOwnProperty('Dispatched Qty')) {
            //            const reorderedItem = {};
            //            for (const key in item) {
            //                reorderedItem[key] = item[key];
            //            }
            //            return reorderedItem;
            //        }
            //        return item;
            //    });
            //    numericFilterColumn.push("Dispatched Qty");
            //    ColumnAlignment["Dispatched Qty"] = 'right';
            //} else {
            //    hiddenColumns.push("Dispatched Qty");
            //}
            //if (QtyPCHeader !== '') {
            //    response = response.map(item => {
            //        if (item.hasOwnProperty('Dispatched Qty PC')) {
            //            const reorderedItem = {};
            //            for (const key in item) {
            //                reorderedItem[key] = item[key];
            //            }
            //            return reorderedItem;
            //        }
            //        return item;
            //    });
            //    numericFilterColumn.push("Dispatched Qty PC");
            //    ColumnAlignment["Dispatched Qty PC"] = 'right';
            //} else {
            //    hiddenColumns.push("Dispatched Qty PC");
            //}
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" ${item.Status !== 'UnVerified' ? 'disabled' : ''} onclick="openEditVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="openViewVisitMaster(${item.VisitMaster_Code}, ${item.Code})"><i class="fa fa-eye"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" ${item.Status !== 'UnVerified' ? 'disabled' : ''} onclick="Delete('${item.Code}')"><i class="fa fa-times"></i></button>`;

                var td_StatusBtn = '';
                if (item.Status == 'UnVerified') {
                    td_StatusBtn = `<button type="button" class="btn btn-secondary btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Verified') {
                    td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Rejected') {
                    td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.Status}</button>`;
                } else {
                    td_StatusBtn = `<button type="button" class="btn btn-success  btn-rounded waves-effect waves-light btn-height " style="cursor: not-allowed">${item.Status}</button>`;
                }

                let remarksContent = item.Remarks;
                let truncatedRemarks = remarksContent.length > 15 ? remarksContent.substring(0, 15) + '...' : remarksContent;
                let remarksWithTooltip = `<span title="${remarksContent}">${truncatedRemarks}</span>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                    Status: td_StatusBtn,
                    Remarks: remarksWithTooltip, 
                };
            });

            ColumnAlignment['Qty ' + QtyMTHeader] = 'right';
            ColumnAlignment['Qty ' + QtyMTRHeader] = 'right';
            ColumnAlignment['Qty ' + QtyPCHeader] = 'right';

            BizsolCustomFilterGrid.CreateDataTable("table-header","table-body",updatedResponse,button,showButtons,stringFilterColumn,numericFilterColumn,dateFilterColumn,stringDoubleFilterColumn,hiddenColumns,ColumnAlignment);
            updateFooter(response); 

            var columnsToRemoveForPrint = ["Code", "VisitMaster_Code", "EditAllow", "DeleteAllow", "RejectedBy", "RejectedOn", "Reason", "Verified By", "Verified On", "Order Type", "Action", "Verified", "Closed", "Total Amount", "Total Order Qty PC", "Total Order Qty MR","Total Order Qty","OtherCharges"];
            response.forEach(function (row) {
                columnsToRemoveForPrint.forEach(function (column) {
                    delete row[column];
                });
            });
            PopulateTableForPrint(response);
        }
        else {
            toastr.error('No Data Found');
            $("#tblOrderList").hide();
        }
    }).catch(error => {
        toastr.error(error.Msg);
        $("#tblOrderList").hide();
    });
}
function GetOrderStatusList() {
    OrderEntryListService.GetOrderStatusList().then(function (response) {
        if (response.length > 0) {
            //$('#ddlOrderStatusList option').remove();

            //var option = '<option text="0" value="All" selected >All</option>';

            //for (var i = 0; i < response.length; i++) {
            //    option += '<option value="' + response[i].VerifyStatus + '" >' + response[i].VerifyStatus + '</option>';
            //}

            //$('#ddlOrderStatusList')[0].innerHTML = option;

            BindSelectList($('#ddlOrderStatusList')[0], response.map((item) => ({ Code: item.VerifyStatus, Desp: item.VerifyStatus })), 'FirstItemAll');
            $('#ddlOrderStatusList').select2({
                // allowClear: true,
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
            });

        } else {
            return false;
        }
    }).catch(function (error) {
        toastr.error('Error fetching order status list:', error);
    });
}
function GetUserNameList() {
    var userName = JSON.parse(sessionStorage.getItem('UserDetails'))[0].UserName;
    OrderEntryListService.GetUserNameList().then(function (result) {
        //$("#ddlUserName").val(userName);
        if (result && result.length > 0) {
        //    const datalist = $('#ddlUserNameList');
        //    datalist.empty();
        //    result.forEach(function (item) {
        //        const option = $('<option>').val(item.UserName).text(item.UserName);
        //        datalist.append(option);
        //    });

        BindSelectList($('#ddlUserNameList')[0], result.map((item) => ({ Code: item.UserName, Desp: item.UserName })), 'FirstItemSelected');
        $('#ddlUserNameList').select2({
            // allowClear: true,
           
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
        });
            $('#ddlUserNameList option').filter(function () {
                return $(this).text() === userName;
            }).prop('selected', true);
            $('#ddlUserNameList').trigger('change');


        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}

function openEditVisitMaster(VisitMaster_Code, Code) {

    var ModuleName = "Direct Order Entry",
        OptionName = "EDIT",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    OrderEntryListService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight =='N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const VisitMaster_Codes = window.btoa(VisitMaster_Code);
            const RoutePlanCode = window.btoa(0);
            //window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode=" + RoutePlanCode + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=Edit";
            window.location = baseUrl + "/CRMTransactions/Visit/DirectOrderEntry?RoutePlanCode=" + RoutePlanCode + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=Edit";
        }

    });

   
}
function openViewVisitMaster(VisitMaster_Code, Code) {
    var ModuleName = "Direct Order Entry",
        OptionName = "VIEW",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    OrderEntryListService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const VisitMaster_Codes = window.btoa(VisitMaster_Code);
            const RoutePlanCode = window.btoa(0);
            // window.location = baseUrl + "/CRMTransactions/Visit/VisitOrderEntry?RoutePlanCode="+RoutePlanCode +"&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=View";
                    window.location = baseUrl + "/CRMTransactions/Visit/DirectOrderEntry?RoutePlanCode=" + RoutePlanCode + "&VisitMaster_Code=" + VisitMaster_Codes + "&VisitMode=View";
        }

    });

}
function encodeHash(value) {
    return btoa(value); 
}
function Delete(Code) {
    var ModuleName = "Direct Order Entry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    OrderEntryListService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
                    $('#myModal').modal('show');
                    $('#myModal').modal({
                        backdrop: 'static', 
                    });
                    $("#txtcode").val(Code);
        }

    });
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
               //let UserName = $('#ddlUserName').val();
                // let OrderStatus = $('#ddlOrderStatus').val();
                let UserName = $('#ddlUserNameList option:selected').val();
                let OrderStatus = $('#ddlOrderStatusList option:selected').val();
                
                if (OrderStatus === 'All') {
                    OrderStatus = '';
                }
                GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus);
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
    return order.Status !== 'Verified';
}
function GetFixedParameterConfiguration() {
    //OrderEntryListService.GetFixedParameterConfiguration().then(function (res) {
    OrderEntryListService.GetFixedParameterQtyConfig().then(function (res) {
    
        fixedParaMeterConfigurationList = res;
        //QtyMTHeader = fixedParaMeterConfigurationList[0].QtyMTHeader;
        //QtyPCHeader = fixedParaMeterConfigurationList[0].QtyPCHeader;
        //QtyMTRHeader = fixedParaMeterConfigurationList[0].QtyMTRHeader;
        QtyMTHeader = fixedParaMeterConfigurationList[0].QtyMT;
        QtyPCHeader = fixedParaMeterConfigurationList[0].QtyPC;
        QtyMTRHeader = fixedParaMeterConfigurationList[0].QtyMR;
       
    });
}

function BindSelectList(element, list, FirstItem) {
    let option = '';

    if (FirstItem == 'FirstItemAll') {
        option = '<option value="All">All</option>';
    } else if (FirstItem == 'FirstItemSelected') {
        option = '';
    } else {
        option = '<option value="0"></option>';
    }

    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function updateFooter(data) {
    const calculateTotalAmount = "Total Amount";

    if (calculateTotalAmount === "Total Amount") {
        const rowCount = data.length;
        let totalQuantity = 0;
        //let totalBasicRate = 0;
        let totalFinalAmount = 0;
        //let totalFinalRate = 0;
        //let totalDispatchQtyMTRS = 0;
        //let totalDispatchQtyMT = 0;
        //let totalDispatchQtyPC = 0;
        let TotalOrderQty = 0;
        let TotalOrderQtyPC = 0;
        let TotalOrderQtyMR = 0;

        data.forEach(row => {
            totalQuantity += parseFloat(row['Qty ' + QtyMTHeader] || row['Qty ' + QtyMTRHeader] || row['Qty ' + QtyPCHeader] || 0);
            //totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            totalFinalAmount += parseFloat(row["Amount"] || 0);
            //totalFinalRate += parseFloat(row["Final Rate"] || 0);
            //totalDispatchQtyMTRS += parseFloat(row["Dispatched Qty MTRS"] || 0);
            //totalDispatchQtyMT += parseFloat(row["Dispatched Qty"] || 0);
            //totalDispatchQtyPC += parseFloat(row["Dispatched Qty PC"] || 0);
            if (QtyMTHeader != '') {
                TotalOrderQty += parseFloat(row['Qty ' + QtyMTHeader]) || 0;
            }
            if (QtyPCHeader != '') {
                TotalOrderQtyPC += parseFloat(row['Qty ' + QtyPCHeader]) || 0;
            }
            if (QtyMTRHeader != '') {
                TotalOrderQtyMR += parseFloat(row['Qty ' + QtyMTRHeader]) || 0;
            }
        });

        var tfootContent1 = ``;
        var tfootContent2= ``;
        var tfootContent3= ``;
        var tfootContent4= ``;
        var tfootContent = ``;

        tfootContent1 = `
        <tr>
            <td colspan="3"><b>Row Count :</b> ${rowCount}</td>
            <td><b>Total</b></td>
            ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQty.toFixed(2)}</b></td>` : ''}
             ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyPC.toFixed(2)}</b></td>` : ''}
             ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyMR.toFixed(2)}</b></td>` : ''}
            <td style="text-align: right;"><b>${totalFinalAmount.toFixed(2)}</b></td>
            <td style="text-align: right;"></td>   
            
            <td ></td>`;
        //if (QtyMTRHeader !== '') {
        //    tfootContent2 = `<td style="text-align: right;">${totalDispatchQtyMTRS.toFixed(2)}</td>`;
        //}
        //if (QtyMTHeader !== '') {
        //    tfootContent3 = `<td style="text-align: right;">${totalDispatchQtyMT.toFixed(2)}</td>`;
        //}
        //if (QtyPCHeader !== '') {
        //    tfootContent4 = `<td style="text-align: right;">${totalDispatchQtyPC.toFixed(2)}</td>`;
        //}

        tfootContent = `${tfootContent1}${tfootContent2}${tfootContent3}${tfootContent4}<td ></td><td ></td><td></td></tr>`;
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

function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth(); // 0 is January, 11 is December

    var startYear = currentDate.getFullYear();

    // If the current month is before April (i.e., January, February, March), 
    // the financial year will belong to the previous year.
    if (currentMonth < 3) {
        startYear = startYear - 1; // Subtract one year for FY before April
    }

    // The fiscal year starts from April, so we return the year range.
    return startYear + "-" + (startYear + 1);
}
function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    //tableBody.empty();

    // Get the keys from the first object to generate the header dynamically
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    var ReportType = "OrderReport";
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReport").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });
}
window.Export = Export;
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
window.ShowOrderList = ShowOrderList;