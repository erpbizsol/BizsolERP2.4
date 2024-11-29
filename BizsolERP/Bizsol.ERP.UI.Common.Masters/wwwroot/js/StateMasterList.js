import { StateMasterService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/StateMasterService.js';

const TblIndx = {
    Code: 0,
    CountryName: 1,
    StateName: 2,
    StateShortName: 3,
    UserName: 4,
    CreateDate: 5,
    UpdateDate: 6,
    StateCode: 7,
    ActionBtn: 8
}
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

    $("#State").on("click", "tr", function () {
        // Get row data or index
        var rowIndex = $(this).index();
        if ($(this).index() === 0) return;

        let rowCode = $(this).find('td').eq(TblIndx.Code).text().trim();
        let CountryName = $(this).find('td').eq(TblIndx.CountryName).text().trim();
        let StateName = $(this).find('td').eq(TblIndx.StateName).text().trim();
        let StateShortName = $(this).find('td').eq(TblIndx.StateShortName).text().trim();
        let StateCode = $(this).find('td').eq(TblIndx.StateCode).text().trim();
        var CreateDate = $(this).find('td').eq(TblIndx.CreateDate).text().trim();
        var dt = CreateDate.substring(0, 10);
        var Tm = CreateDate.substring(11, 16);
        StateMasterService.GetCountryMasterList().then(function (response1) {
            data = response1;
            let Country = '';
            var arr = [];
            const rows = data.map(item => {
                return `<option>${item.CountryName}</option > `;
            }).join('');
            $('#ddlCountry').empty();
            $('#ddlCountry').html(rows);
            
            //if (data.length > 0) {

            //    for (var i = 0; i < data.length; i++) {

            //        arr.push(data[i].CountryName);
            //    }
            //}
            var list = Array.prototype.map.call(document.getElementById("ddlCountry").options, (option) => option.value);

            // Array Sequence : FieldName, Caption, Control Type, Control, Control Value, List

            /*List Parameters : FirstLetterSearchList  --- List that search values from the first letter
                                ,SearchList  --- List that search values from the whole string
                                ,MultiselectList --- Select Multiple values from the List 
                                ,List --- Simple Dropdown
                                ,Suggestion  --- Textbox with suggestion list
                                */
            var arrControls = [
                ["CountryName", "Country Name(First Letter Search)", "Input", "FirstLetterSearchList", CountryName, JSON.stringify({ list })],
                //["CountryName1", "Country Name(Substring Search)", "Input", "SearchList", CountryName, JSON.stringify({ list })],
                //["CountryName", "Country Name(MultiSelect)", "Input", "MultiselectList", CountryName, JSON.stringify({ list })],
                //["CountryName", "Country Name", "Input", "List", CountryName, JSON.stringify({ list })],
                //["CountrySuggestion", "Country Name(Sugges)", "Input", "Suggestion", CountryName, JSON.stringify({ list })],
                ["StateName", "State Name", "Input", "String", StateName, ''],
                ["StateShortName", "State Short Name", "Input", "String", StateShortName, ''],
                ["StateCode", "State Code", "Input", "Number", StateCode, ''],
                ["Date", "Date", "Input", "Date", dt],
                ["Time", "Time", "Input", "Time", Tm],
                ["Switch", "Switch", "Switch", "Switch", ""],
            ];
            InitGridRowEditControl(rowCode, arrControls, "Myfun");
        });

        
    });
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
        const ColumnAlignment = {
            "CreateDate": 'center',
            "UpdateDate": 'center',
        };
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        //CreateDataTable(headerId, bodyId, data, Button, ShowButtons=[], StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, HiddenColumns) 

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
function InitGridRowEditControl(rowCode, arrControls, callBackFunctionName) {

    var url = '/GridControl/GridRowEditControl';
    var strGridHeader = "State Master";
    $('#DivGridRowEditModal').load(url, { GridRowCode: rowCode, GridHeader: strGridHeader, ArrayControls: arrControls, CallBackFunctionName: callBackFunctionName });

}


window.CreateNew = CreateNew;
window.EditData = EditData;
window.InitGridRowEditControl = InitGridRowEditControl;