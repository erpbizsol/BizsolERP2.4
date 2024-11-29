import { CRMReportsServices } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

$(document).ready(function () {
    GetReportType();
    GetItemMasterDropDownLists();
   
});
function GetReportType() {
    var ModuleDesc = $("#txtReportType").val();
    CRMReportsServices.GetReportTypelist(ModuleDesc).then(function (response) {
        const $reportTypeList = $('#txtReportTypelists');
        const $inputField = $('#txtReportType');

        if (response.length > 0) {
            $reportTypeList.empty();
            let options = '';
            response.forEach(function (item, index) {
                options += `<option value="${item.Desp}" text="${item.Code}" ${index === 0 ? 'selected' : ''}>${item.Desp}</option>`;
            });
            $reportTypeList.html(options);
            $inputField.val(response[0].Desp);
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
        $('#txtReportTypelists').empty();
        $('#txtReportType').val('');
    });
}

$('#fetchReportButton').click(function () {
    GetStockReportLists();
});

function GetItemMasterDropDownLists() {
    CRMReportsServices.GetItemMasterDropDownlist().then(function (response) {
        if (response.length > 0) {
            $('#txtItemNamelist').empty();
            var options = '<option value="Select" selected>Select</option>';;
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].ItemName + '" text="' + response[i].Code + '"></option>';  
            }
            $('#txtItemNamelist').html(options);
        } else {
            $('#txtItemNamelist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtItemNamelist').empty();
    });
}


function GetStockReportLists() {
    var code = 0;
    var ReportType = $("#txtReportType").val();
    const inputElement = document.getElementById("txtItemName");
    const dataList = document.getElementById("txtItemNamelist");
    const inputValue = inputElement.value;
    const selectedOption = Array.from(dataList.options).find(
        option => option.value === inputValue
    );
    if (selectedOption) {
        code = selectedOption.getAttribute("text");

    }
    CRMReportsServices.GetStockReportList(code, ReportType).then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Sale Person", "Visit Type", "Dealer Name", "City", "State", "Size_Desp", "Thickness"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
            //if (reportType === "Visit Report With Size and Thk") {
            //    updateFooter(response);
            //} else {
            //    clearFooter();
            //}
        } else {
            alert("Record not found...!");
        }
    });
}

window.GetReportType = GetReportType;

