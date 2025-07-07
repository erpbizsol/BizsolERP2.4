import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

var VerficationCheck = "N";
$(document).ready(function () {
    $("#ERPHeading").text("Daily Visit Report");

    GetSalespersonLists();
    GetDealerLists();
    GetOrderTypeLists();
    GetOrderStatusLists();
    GetDisplayNameForReportTypes();
    DatePicker();
    GetCRMFixedParameterConfig();
    $('#txtdateFrom').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtdateTo").focus();
        }
    });
    $('#txtdateTo').on('keydown', function (e) {
        if (e.key === "Enter") {
            //$("#txtSalesPerson").focus();
            $("#ddlSalesPersonlist").focus();
            
        }
    });
    $('#txtSalesPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDealerName").focus();
        }
    });
    $('#txtDealerName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderType").focus();
        }
    });
    $('#txtOrderType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderStatus").focus();
        }
    });
    $('#txtOrderStatus').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReportType").focus();
        }
    });
    $('#txtReportType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#fetchReportButton").focus();
        }
    });
    $('#txtSalesPerson').on('focus', function (e) {
        $("#txtSalesPerson").val('');
    });
    $('#txtDealerName').on('focus', function (e) {
        $("#txtDealerName").val('');
    });
    $('#txtOrderType').on('focus', function (e) {
        $("#txtOrderType").val('');
    });
    $('#txtOrderStatus').on('focus', function (e) {
        $("#txtOrderStatus").val('');
    });
    $('#txtReportType').on('focus', function (e) {
        $("#txtReportType").val('');
    });
    $('#fetchReportButton').click(function () {
        GetDailyVistList();
    });
    $('#btnDownload').click(function () {
        Export();
    });
    
});

function GetCRMFixedParameterConfig() {

    CRMReportsServices.GetCRMOrderEntryConfig().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('CRMOrderEntryConfig', JSON.stringify(response[0]));
            CRMReportsServices.GetFixedParameterQtyConfig().then(function (response) {
                if (response.length > 0) {
                    sessionStorage.setItem('QtyConfig', JSON.stringify(response[0]));
                   

                }
            });
        }
    });
}

function GetSalespersonLists() {
    CRMReportsServices.GetSalespersonList().then(function (response) {
        if (response.length > 0) {
            $('#txtSalesPersonlist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].PersonName + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtSalesPersonlist').html(options);

            BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })), 'FirstItemAll');
            $('#ddlSalesPersonlist').select2({
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
            $('#txtSalesPersonlist').empty();
            $('#ddlSalesPersonlist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtSalesPersonlist').empty();
    });
}
function GetDealerLists() {
    CRMReportsServices.GetDealerList().then(function (response) {
        if (response.length > 0) {
            $('#txtDealerNamelist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].AccountDesp + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtDealerNamelist').html(options);

            BindSelectList($('#ddlDealerNamelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })), 'FirstItemAll');
            $('#ddlDealerNamelist').select2({
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
            $('#txtDealerNamelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtDealerNamelist').empty();
    });
}
function GetOrderTypeLists() {
    CRMReportsServices.GetOrderTypeList().then(function (response) {
        if (response.length > 0) {
            $('#txtOrderTypelist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].Field + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtOrderTypelist').html(options);

            BindSelectList($('#ddlOrderTypelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.Field })), 'FirstItemAll');
            $('#ddlOrderTypelist').select2({
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
            $('#txtOrderTypelist').empty();
            $('#ddlOrderTypelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtOrderTypelist').empty();
        $('#ddlOrderTypelist').empty();
    });
}

function GetOrderStatusLists(VerificationCheck) {
    CRMReportsServices.GetOrderStatusList().then(function (response) {
        if (response.length > 0) {
            let filteredData = response;
            if (VerificationCheck === "N") {
                filteredData = response.filter(status =>
                    status.VerifyStatus === 'Un-Verified' || status.VerifyStatus === 'Verified'
                );
            }
            $('#txtOrderStatuslist').empty();
            var options = '<option value="All" selected>All</option>';
            for (let i = 0; i < filteredData.length; i++) {
                options += '<option value="' + filteredData[i].VerifyStatus + '" text="' + filteredData[i].Code + '"></option>';
            }
            $('#txtOrderStatuslist').html(options);

            BindSelectList($('#ddlOrderStatuslist')[0], response.map((item) => ({ Code: item.Code, Desp: item.VerifyStatus })), 'FirstItemAll');
            $('#ddlOrderStatuslist').select2({
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
            console.warn('Response is empty or invalid:', response);
            $('#txtOrderStatuslist').empty();
            $('#ddlOrderStatuslist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching Order Status List:', error);
        $('#txtOrderStatuslist').empty();
        $('#ddlOrderStatuslist').empty();
    });
}

function GetFixedParameterConfigurationList() {
    CRMReportsServices.GetFixedParameterConfigurationList().then(function (response) {
        let fixedParameterConfigurationList = response;
        if (fixedParameterConfigurationList.length > 0) {

            VerficationCheck = fixedParameterConfigurationList[0].ThreeLevelVerificationApplicable;
            GetOrderStatusLists();
        }
        else {
            console.warn('Fixed Parameter Configuration list is empty');
        }
    });
}

//function GetDisplayNameForReportTypes() {
//    CRMReportsServices.GetDisplayNameForReportType().then(function (response) {
//        if (response.length > 0) {
//            $('#txtReportTypelist').empty();
//            var options = '';
//            for (var i = 0; i < response.length; i++) {
//                options += '<option value="' + response[i].DisplayName + '" text="' + response[i].Code + '"></option>';
//            }
//            $('#txtReportTypelist').html(options);

//        } else {
//            $('#txtReportTypelist').empty();
//        }
//    }).catch(function (error) {
//        console.error('Error fetching salesperson list:', error);
//        $('#txtReportTypelist').empty();
//    });
//}
function GetDisplayNameForReportTypes() {
    CRMReportsServices.GetDisplayNameForReportType().then(function (response) {
        const $reportTypeList = $('#txtReportTypelist');
        const $inputField = $('#txtReportType'); 

        if (response.length > 0) {
            $reportTypeList.empty();
            let options = '';
            response.forEach(function (item, index) {
                options += `<option value="${item.DisplayName}" text="${item.Code}" ${index === 0 ? 'selected' : ''}>${item.DisplayName}</option>`;
            });
            $reportTypeList.html(options);
            $inputField.val(response[0].DisplayName);
            $reportTypeList.on('change', function () {
                const selectedValue = $(this).val();
                $inputField.val(selectedValue);
            });

            BindSelectList($('#ddlReportTypelist')[0], response.map((item) => ({ Code: item.DisplayName, Desp: item.DisplayName })), 'FirstItemSelected');
            $('#ddlReportTypelist').select2({
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
            $reportTypeList.empty();
            $inputField.val('');
        }
    }).catch(function (error) {
        console.error('Error fetching report types:', error);
        $('#txtReportTypelist').empty();
        $('#txtReportType').val('');
    });
}


function GetDailyVistList() {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;


    const formValues = {
        fromDate: convertDateFormat($("#txtdateFrom").val()),
        toDate: convertDateFormat($("#txtdateTo").val()),
        //orderType: $('#txtOrderType').val(),
        //orderStatusName: $('#txtOrderStatus').val(),
        orderType: $('#ddlOrderTypelist option:selected').text(),
        orderStatusName: $('#ddlOrderStatuslist option:selected').text(),
        //ReportTypeName: $('#txtReportType').val(),
        ReportTypeName: $('#ddlReportTypelist').val(),
        //PersonName: $('#txtSalesPerson').val(),
        PersonName: $('#ddlSalesPersonlist option:selected').text(),
        //AccountDesp: $('#txtDealerName').val(),
        AccountDesp: $('#ddlDealerNamelist option:selected').text(),
    };
    const fromDate = formValues.fromDate;
    const toDate = formValues.toDate;
    const orderType = formValues.orderType === 'All' || !formValues.orderType ? '' : formValues.orderType;
    const orderStatus = formValues.orderStatusName === 'All' || !formValues.orderStatusName ? '' : formValues.orderStatusName;
    const reportType = formValues.ReportTypeName;
    const salesperson = formValues.PersonName === 'All' || !formValues.PersonName ? '' : formValues.PersonName;
    const dealerName = formValues.AccountDesp === 'All' || !formValues.AccountDesp ? '' : formValues.AccountDesp;
    const strCondition = '';
    CRMReportsServices.GetDailyVisitReport(fromDate, toDate, orderStatus, reportType, salesperson, dealerName, orderType, strCondition).then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Sale Person", "Visit Type", "Dealer Name", "City", "State", "Size_Desp", "Thickness"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];

            if (QtyMTHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Qty ' + QtyMTHeader)) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Qty ' + QtyMTHeader) {
                                reorderedItem['Total Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push("Total Qty MT")
            } else {
                hiddenColumns.push("Total Qty MT");
            }

            if (QtyPCHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Qty ' + QtyPCHeader)) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Qty ' + QtyPCHeader) {
                                reorderedItem['Total Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push("Total Qty PC")
            } else {
                hiddenColumns.push("Total Qty PC");
            }
            if (QtyMTRHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Qty ' + QtyMTRHeader)) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Qty ' + QtyMTRHeader) {
                                reorderedItem['Total Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push("Total Qty MR")
            } else {
                hiddenColumns.push("Total Qty MR");
            }



            const ColumnAlignment = {
                "Payment Amount": 'right',
                "Other Sale Qty": 'right',
                "Other Stock Qty": 'right',
                "Our Stock Qty": 'right',
                "Final Order Amount": 'right',
                "Final Rate": 'right',
                "Discount": 'right',
                "Total Order Amount": 'right',
                "Basic Rate": 'right',
                "Extra Charges": 'right',
                "Total Order Qty": 'right',
                "Total Ordered Qty": 'right',
                "Total Qty MT": 'right',
                "Total Qty PC": 'right',
                "Total Qty MR": 'right',
                "Date": 'center',
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns,ColumnAlignment);
            if (reportType == 'Visit Report With Size and Thk' || reportType == 'Visit Report' || reportType == 'Visit Report 1.0' || reportType == "Route Plan Report" ) {
                updateFooter(response, reportType);
            } else {
                clearFooter();
            }
            PopulateTableForPrint(response, hiddenColumns);
            if (reportType == 'Visit Report With Size and Thk' || reportType == 'Visit Report' || reportType == 'Visit Report 1.0' || reportType == "Route Plan Report") {
                updateFooterPrint(response, reportType);
            } else {
                clearFooterPrint();
            }
        } else {
            toastr.error("Record not found...!");
        }
    });
}
function updateFooter(data, reportType) {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

    if (reportType === "Visit Report With Size and Thk") {
        const rowCount = data.length;
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let totalDiscount = 0;
        let totalExtraCharges = 0;
        let paymentAmount = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;

        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            totalDiscount += parseFloat(row["Discount"] || 0);
            totalExtraCharges += parseFloat(row["Extra Charges"] || 0);
            paymentAmount += parseFloat(row["Payment Amount"] || 0);
            TotalQtyMT += parseFloat(row['Total Qty ' + QtyMTHeader] || 0);
            TotalQtyPC += parseFloat(row['Total Qty ' + QtyPCHeader] || 0);
            TotalQtyMR += parseFloat(row['Total Qty ' + QtyMTRHeader] || 0);
        });
        const tfootContent = `
        <tr>
            <td colspan="1"></td>
            <td colspan="11"><b>Row Count :</b>  ${rowCount}</td>
            <td style="text-align:right"><b>Total</b></td>
            ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
            
            <td style="text-align:right"><b>${totalBasicRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalDiscount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalExtraCharges.toFixed(2)}</b></td>
            <td colspan="1"></td>
            <td style="text-align:right"><b>${paymentAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#table tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#table");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Visit Report") {
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let TotalOrderAmount = 0;
        let totalDiscount = 0;
        let FinalRate = 0;
        let FinalOrderAmount = 0;
        let paymentAmount = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            TotalOrderAmount += parseFloat(row["Total Order Amount"] || 0);
            totalDiscount += parseFloat(row["Discount"] || 0);
            FinalRate += parseFloat(row["Final Rate"] || 0);
            FinalOrderAmount += parseFloat(row["Final Order Amount"] || 0);
            paymentAmount += parseFloat(row["Payment Amount"] || 0);
        });
        const tfootContent = `
        <tr>
            <td colspan="10"><b>Total :</b></td>
            <td style="text-align:right"><b>${totalQuantity.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalBasicRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${TotalOrderAmount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalDiscount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${FinalRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${FinalOrderAmount.toFixed(2)}</b></td>
            <td colspan="1"></td>
            <td style="text-align:right"><b>${paymentAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#table tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#table");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Visit Report 1.0") {
        //let totalQuantity = 0;
        let TotalOrderAmount = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;
        data.forEach(row => {
            //totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            TotalOrderAmount += parseFloat(row["Total Order Amount"] || 0);
            TotalQtyMT += parseFloat(row['Total Qty ' + QtyMTHeader] || 0);
            TotalQtyPC += parseFloat(row['Total Qty ' + QtyPCHeader] || 0);
            TotalQtyMR += parseFloat(row['Total Qty ' + QtyMTRHeader] || 0);
        });
        const tfootContent = `
        <tr>
            <td colspan="8"><b>Total :</b></td>
            ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
            <td style="text-align:right"><b>${TotalOrderAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#table tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#table");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Route Plan Report") {
        let totalQuantity = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;

        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            TotalQtyMT += parseFloat(row['Total Qty ' + QtyMTHeader] || 0);
            TotalQtyPC += parseFloat(row['Total Qty ' + QtyPCHeader] || 0);
            TotalQtyMR += parseFloat(row['Total Qty ' + QtyMTRHeader] || 0);
        });
        const tfootContent = `
        <tr>
            <td colspan="9"><b>Total :</b></td>
             ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
        </tr>
        `;
        const tfoot = document.querySelector("#table tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#table");
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
function updateFooterPrint(data, reportType) {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

    if (reportType === "Visit Report With Size and Thk") {
        const rowCount = data.length;
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let totalDiscount = 0;
        let totalExtraCharges = 0;
        let paymentAmount = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            totalDiscount += parseFloat(row["Discount"] || 0);
            totalExtraCharges += parseFloat(row["Extra Charges"] || 0);
            paymentAmount += parseFloat(row["Payment Amount"] || 0);
            TotalQtyMT += parseFloat(row["Total Qty MT"] || 0);
            TotalQtyPC += parseFloat(row["Total Qty PC"] || 0);
            TotalQtyMR += parseFloat(row["Total Qty MR"] || 0);
        });
        const tfootContent = `
        <tr>
            <td ></td>
            <td ><b>Row Count :</b>  ${rowCount}</td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
             <td ></td>
            <td style="text-align:right"><b>Total</b></td>
             ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
           <td style="text-align:right"><b>${totalBasicRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalDiscount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalExtraCharges.toFixed(2)}</b></td>
            <td colspan="1"></td>
            <td style="text-align:right"><b>${paymentAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#tblReport tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#tblReport");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Visit Report") {
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let TotalOrderAmount = 0;
        let totalDiscount = 0;
        let FinalRate = 0;
        let FinalOrderAmount = 0;
        let paymentAmount = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            TotalOrderAmount += parseFloat(row["Total Order Amount"] || 0);
            totalDiscount += parseFloat(row["Discount"] || 0);
            FinalRate += parseFloat(row["Final Rate"] || 0);
            FinalOrderAmount += parseFloat(row["Final Order Amount"] || 0);
            paymentAmount += parseFloat(row["Payment Amount"] || 0);
        });
        const tfootContent = `
        <tr>
            <td ><b>Total :</b></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td style="text-align:right"><b>${totalQuantity.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalBasicRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${TotalOrderAmount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${totalDiscount.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${FinalRate.toFixed(2)}</b></td>
            <td style="text-align:right"><b>${FinalOrderAmount.toFixed(2)}</b></td>
            <td colspan="1"></td>
            <td style="text-align:right"><b>${paymentAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#tblReport tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#tblReport");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Visit Report 1.0") {
        let totalQuantity = 0;
        let TotalOrderAmount = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            TotalOrderAmount += parseFloat(row["Total Order Amount"] || 0);
            TotalQtyMT += parseFloat(row["Total Qty MT"] || 0);
            TotalQtyPC += parseFloat(row["Total Qty PC"] || 0);
            TotalQtyMR += parseFloat(row["Total Qty MR"] || 0);
        });
        const tfootContent = `
        <tr>
            <td ><b>Total :</b></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
             ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
            <td style="text-align:right"><b>${TotalOrderAmount.toFixed(2)}</b></td>
        </tr>
        `;
        const tfoot = document.querySelector("#tblReport tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#tblReport");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
    if (reportType === "Route Plan Report") {
        let totalQuantity = 0;
        let TotalQtyMT = 0;
        let TotalQtyPC = 0;
        let TotalQtyMR = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            TotalQtyMT += parseFloat(row["Total Qty MT"] || 0);
            TotalQtyPC += parseFloat(row["Total Qty PC"] || 0);
            TotalQtyMR += parseFloat(row["Total Qty MR"] || 0);
        });
        const tfootContent = `
        <tr>
            <td ><b>Total :</b></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
            <td ></td>
             ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMT.toFixed(2)}</b></td>` : ''}
            ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalQtyPC.toFixed(2)}</b></td>` : ''}
            ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalQtyMR.toFixed(2)}</b></td>` : ''}
        </tr>
        `;
        const tfoot = document.querySelector("#tblReport tfoot");
        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#tblReport");
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
function clearFooterPrint() {
    const tfoot = document.querySelector("#tblReport tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${ day } -${ monthAbbreviation } -${ year }`;
}
function setupDateInputFormatting() {
    $('#txtdateTo').on('input', function () {
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
    $('#txtdateFrom').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDateFrom(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDateFrom(value) {
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
            $('#txtdateFrom').val('');

        }
    } else {
        $('#txtdateFrom').val('');

    }
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
            $('#txtdateTo').val('');

        }
    } else {
        $('#txtdateTo').val('');

    }
}
function DatePicker() {
 
    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdateTo, #txtdateFrom').val(`${day}/${month}/${year}`);
    $('#txtdateTo, #txtdateFrom').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}

function PopulateTableForPrint(data,hiddencols) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    //tableBody.empty();
    $('#tblReport  thead tr').empty();
    $('#tblReport tbody').empty();

    // Get the keys from the first object to generate the header dynamically
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        if ($.inArray(header, hiddencols) == -1) {
            const th = document.createElement('th');
            th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
            tableHeader.appendChild(th);
        }
       
    });

    $('#tblReport th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            if ($.inArray(header, hiddencols) == -1) {
                const td = document.createElement('td');
                td.textContent = item[header];
                row.appendChild(td);
            }
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    var ReportType = $('#ddlReportTypelist').val().replace(/ /g, "").replace(".", "");
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
window.GetCRMFixedParameterConfig = GetCRMFixedParameterConfig;
window.BindSelectList = BindSelectList;