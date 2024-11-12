import { StateMasterService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/StateMasterService.js';
$(document).ready(function () {
    $('#ddlCountry').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtState").focus();
        }
    });
    $('#txtState').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtStateInitial").focus();
        }
    });
    $('#txtStateInitial').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtStateCode").focus();
        }
    });
    $('#txtStateCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlCountry").focus();
        }
    });
    getStatelist();

});
function CreateNew() {
    window.location.href = "https://localhost:7188/CommonMasters/StateMaster?Create";
}
function EditData(Code) {
    let rowIndex = null;
    let codeValues = [];
    $('table tr:visible').each(function () {
        let rowCode = $(this).find('td').eq(0).text().trim();
        if (rowCode) {
            codeValues.push(rowCode);
        }
        if (rowCode === Code) {
            rowIndex = $(this).data('index');
        }
    });
    let serializedArray = encodeURIComponent(JSON.stringify(codeValues));
    window.location.href = `https://localhost:7188/CommonMasters/StateMaster?Edit=${Code}&Index=${rowIndex}&codeValues=${serializedArray}`;
}

function getStatelist() {
    StateMasterService.GetStateMasterList("All").then(function (response) {
        const StringFilterColumn = ["UserName", "StateName"];
        const NumericFilterColumn = ["StateCode"];
        const DateFilterColumn = ["UpdateDate", "CreateDate"];
        const Button = true;
        const showButtons=["E","D","VE"]
        const StringdoubleFilterColumn = ["CountryName", "StateShortName"];
        const hiddenColumns = ["Code"];
        CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
    });
}
window.openModal = function (){
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
    });
    getCountrylist();
}
function closeModal() {
    $('#myModal').modal('hide');
}
 window.getCountrylist = function() {
    StateMasterService.GetCountryMasterList().then(function (response) {
        const StringFilterColumn = ["Party Name"];
        const NumericFilterColumn = ["PO No"];
        const DateFilterColumn = ["PO Date"];
        const Button = true;
        const showButtons = ["E", "D", "VE"]
        const StringdoubleFilterColumn = ["Product"];
        const hiddenColumns = ["Code"];
        CreateDataTable("table-header1", "table-body1", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
    });
}
window.CreateNew = CreateNew;
window.EditData = EditData;