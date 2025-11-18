import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

var VerficationCheck = "N";
$(document).ready(function () {
    $("#ERPHeading").text("Order Report");
    $('#tblOrderReport').hide();
    $('#paginator-tblOrderReport').hide();
    GetSalespersonLists();
    GetDealerLists();
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
 
   
    $('#btnShow').click(function () {
        $(this).prop('hidden', true); // Disable the button to prevent multiple clicks
        $('#btnLoading').prop('hidden', false);
        GetReportData();
    });
    $('#btnDownload').click(function () {
        Export();
    });
    $('#ddlReportTypelist').on('change', function () {

        OnChange_ReportType();

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
           $('#ddlSalesPersonlist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        
    });
}
function GetDealerLists() {
    CRMReportsServices.GetDealerList().then(function (response) {
        if (response.length > 0) {
            
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
            $('#ddlDealerNamelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#ddlDealerNamelist').empty();
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


function GetDisplayNameForReportTypes() {
    CRMReportsServices.GetDisplayNameForOrderReport('Order Report').then(function (response) {
        

        if (response.length > 0) {
     

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
            
        }
    }).catch(function (error) {
        console.error('Error fetching report types:', error);
      
    });
}


function GetReportData() {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;


    const formValues = {
        fromDate: convertDateFormat($("#txtdateFrom").val()),
        toDate: convertDateFormat($("#txtdateTo").val()),
        ReportTypeName: $('#ddlReportTypelist').val(),
        MarketingManMaster_Code: $('#ddlSalesPersonlist option:selected').val() == 'All' ? 0 : $('#ddlSalesPersonlist option:selected').val(),
        AccountMaster_Code: $('#ddlDealerNamelist option:selected').val() == 'All' ? 0 : $('#ddlDealerNamelist option:selected').val(),
    };
    const fromDate = formValues.fromDate;
    const toDate = formValues.toDate;
    const reportType = formValues.ReportTypeName;
    const MarketingManMaster_Code = formValues.MarketingManMaster_Code;
    const AccountMaster_Code = formValues.AccountMaster_Code;
    const strCondition = '';
    const OtherParameters = '';
    CRMReportsServices.GetOrderReport(fromDate, toDate, strCondition, reportType, AccountMaster_Code, MarketingManMaster_Code, OtherParameters).then(function (response) {
        if (response.length > 0) {
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);
            $('#tblOrderReport').show();
            $('#paginator-tblOrderReport').show();

            const StringFilterColumn = ["Party Name", "Order No", "Sales Person", "City", "Transporter Name", "Vehicle No","Status"];
            const NumericFilterColumn = [];
            const DateFilterColumn = ["Invoice Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "MarketingManMaster_Code","AccountMaster_Code"];

            if (QtyMTRHeader !== '') {
                response  = response.map(item => {
                    if (item.hasOwnProperty('QtyMR')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'QtyMR') {
                                reorderedItem['Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });

                response  = response.map(item => {
                    if (item.hasOwnProperty('DispatchQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyMTRS') {
                                reorderedItem['Dispatch Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });

               
                response  = response.map(item => {
                    if (item.hasOwnProperty('BalQtyMTRS')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMTRS') {
                                reorderedItem['Bal Qty ' + QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push('Qty ' + QtyMTRHeader);
                NumericFilterColumn.push('Dispatch Qty ' + QtyMTRHeader);
                NumericFilterColumn.push('Bal Qty ' + QtyMTRHeader);
            } else {
                hiddenColumns.push("BalQtyMTRS");
                hiddenColumns.push("QtyMR");
                hiddenColumns.push("DispatchQtyMTRS");
            }
            if (QtyMTHeader !== '') {
                response  = response.map(item => {
                    if (item.hasOwnProperty('QtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'QtyMT') {
                                reorderedItem['Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response  = response.map(item => {
                    if (item.hasOwnProperty('DispatchQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyMT') {
                                reorderedItem['Dispatch Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
              
                response  = response.map(item => {
                    if (item.hasOwnProperty('BalQtyMT')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyMT') {
                                reorderedItem['Bal Qty ' + QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push(QtyMTHeader);
            } else {
                hiddenColumns.push("QtyMT");
                hiddenColumns.push("BalQtyMT");
                hiddenColumns.push("DispatchQtyMT");
            }
            if (QtyPCHeader !== '') {
                response  = response.map(item => {
                    if (item.hasOwnProperty('BalQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'BalQtyPC') {
                                reorderedItem['Bal Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response  = response.map(item => {
                    if (item.hasOwnProperty('QtyPc')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'QtyPc') {
                                reorderedItem['Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                response  = response.map(item => {
                    if (item.hasOwnProperty('DispatchQtyPC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'DispatchQtyPC') {
                                reorderedItem['Dispatch Qty ' + QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                
                NumericFilterColumn.push(QtyPCHeader);
            } else {
                hiddenColumns.push("BalQtyPC");
                hiddenColumns.push("QtyPc");
                hiddenColumns.push("DispatchQtyPC");
            }

            const ColumnAlignment = {
                
                "Date": 'center',
            };

           
            BizsolCustomFilterGrid.CreateDataTable("tblOrderReport-header", "tblOrderReport-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns,ColumnAlignment);
            
            PopulateTableForPrint(response, hiddenColumns);
           
        } else {
            $('#tblOrderReport').hide();
            $('#paginator-tblOrderReport').hide();
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);
            toastr.error("Record not found...!");
        }
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

function OnChange_ReportType() {
    var ReportType = $('#ddlReportTypelist').val();
    if (ReportType.toUpperCase() == 'MARKETINGMAN TARGET REPORT') {
        $('#lblToDate').text('As On Date');
        $('#divFromDate').hide();
    } else {
        $('#lblToDate').text('To Date');
        $('#divFromDate').show();
    }
}
window.Export = Export;
window.GetCRMFixedParameterConfig = GetCRMFixedParameterConfig;
window.BindSelectList = BindSelectList;
window.GetReportData = GetReportData;
window.OnChange_ReportType = OnChange_ReportType;