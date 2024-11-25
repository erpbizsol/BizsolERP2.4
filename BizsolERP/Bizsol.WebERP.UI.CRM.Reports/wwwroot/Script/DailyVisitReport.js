import { CRMReportsServices } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

var VerficationCheck = "N";
$(document).ready(function () {
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${yyyy}-${mm}-${dd}`;
    $('#txtdateFrom, #txtdateTo').val(currentDate);
   
    GetSalespersonLists();
    GetDealerLists();
    GetOrderTypeLists();
    GetOrderStatusLists();
    GetDisplayNameForReportTypes();
});
function GetSalespersonLists() {
    CRMReportsServices.GetSalespersonList().then(function (response) {
        if (response.length > 0) {
            $('#txtSalesPersonlist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].PersonName + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtSalesPersonlist').html(options);

        } else {
            $('#txtSalesPersonlist').empty();
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

        } else {
            $('#txtOrderTypelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtOrderTypelist').empty();
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

        } else {
            console.warn('Response is empty or invalid:', response);
            $('#txtOrderStatuslist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching Order Status List:', error);
        $('#txtOrderStatuslist').empty();
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

$('#fetchReportButton').click(function () {
    GetDailyVistList();
});
function GetDailyVistList() {
   
    const formValues = {
        fromDate: convertDateFormat($("#txtdateFrom").val()),
        toDate: convertDateFormat($("#txtdateTo").val()),
        orderType: $('#txtOrderType').val(),
        orderStatusName: $('#txtOrderStatus').val(),
        ReportTypeName: $('#txtReportType').val(),
        PersonName: $('#txtSalesPerson').val(),
        AccountDesp: $('#txtDealerName').val(),
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
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
            if (reportType === "Visit Report With Size and Thk") {
                updateFooter(response);
            } else {
                clearFooter();
            }
        } else {
            toastr.error("Record not found...!");
            //alert("Record not found...!");
        }
    });
}
function updateFooter(data) {
    const reportType = "Visit Report With Size and Thk";
    if (reportType === "Visit Report With Size and Thk") {
        const rowCount = data.length;
        let totalQuantity = 0;
        let totalBasicRate = 0;
        let totalDiscount = 0;
        let totalExtraCharges = 0;
        let paymentAmount = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Total Ordered Qty"] || 0);
            totalBasicRate += parseFloat(row["Basic Rate"] || 0);
            totalDiscount += parseFloat(row["Discount"] || 0);
            totalExtraCharges += parseFloat(row["Extra Charges"] || 0);
            paymentAmount += parseFloat(row["Payment Amount"] || 0);
        });
        const tfootContent = `
        <tr>
            <td colspan="1"></td>
            <td colspan="10"><b>Row Count :</b>  ${rowCount}</td>
            <td><b>Total</b></td>
            <td>${totalQuantity.toFixed(2)}</td>
            <td>${totalBasicRate.toFixed(2)}</td>
            <td>${totalDiscount.toFixed(2)}</td>
            <td>${totalExtraCharges.toFixed(2)}</td>
            <td colspan="1"></td>
            <td>${paymentAmount.toFixed(2)}</td>
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
function clearFooter() {
    const tfoot = document.querySelector("#table tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${ day } -${ monthAbbreviation } -${ year }`;
}



