import { CRMReportsServices } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

let VerficationCheck = "N";

$(document).ready(function () {
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
            var options = '';
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
            var options = '';
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
            var options = '';
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
            // Apply filtering logic based on VerificationCheck
            let filteredData = response;
            if (VerificationCheck === "N") {
                filteredData = response.filter(status =>
                    status.VerifyStatus === 'Un-Verified' || status.VerifyStatus === 'Verified'
                );
            }
            // Populate the datalist
            $('#txtOrderStatuslist').empty();
            let options = '';
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


function GetDisplayNameForReportTypes() {
    CRMReportsServices.GetDisplayNameForReportType().then(function (response) {
        if (response.length > 0) {
            $('#txtReportTypelist').empty();
            var options = '';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].DisplayName + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtReportTypelist').html(options);

        } else {
            $('#txtReportTypelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtReportTypelist').empty();
    });
}

$('#fetchReportButton').click(function () {
    GetDailyVistList();
});
   
function GetDailyVistList() {
    const formValues = {
        fromDate: $('#txtdateFrom').val(),
        toDate: $('#txtdateTo').val(),
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
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = true;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "IsVerify", "Date"];
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)

        } else {
            alert("Record not found...!");  
        }
      
    });
}





