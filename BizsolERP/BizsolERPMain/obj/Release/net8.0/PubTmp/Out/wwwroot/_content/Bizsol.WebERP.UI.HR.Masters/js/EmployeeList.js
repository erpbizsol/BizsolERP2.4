import { EmployeeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeMasterServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $("#ERPHeading").text("Employee List");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    BizSolHelperFunction.SelectOptionByText('ddlEmpStatus', "Active");
    GetEmployeeMasterList();
    $('#btnShow').on('click', function () {
        GetEmployeeMasterList();
    });
    $('#btnNewEmployee').click(function (e) {

        const Codes = window.btoa(0);
        window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeMaster?Code=" + Codes + "&Mode=New";

    });

    $('#btnEmpConfig').click(function (e) {

        window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeConfiguration";

    });
    $('#btnDownload').click(function () {
        Export();
    });

    $('#ShowCardDesp').on('change', function () {

        ShowCardDespColumn();
    });

 
    $(document).on('click change', function (event) {
        ShowCardDespColumn();
    });
    BizSolHelperFunction.HideOrShowConfigurationSettingBtn('btnEmpConfig');
    
});

function ShowCardDespColumn() {
    var ShowCardDesp = $('#ShowCardDesp').is(':checked');
    
    if (ShowCardDesp == false) {
        $("#tblEmployeeList thead tr th:nth-child(4)").css('display', 'none');
        $("#tblEmployeeList tbody tr td:nth-child(4)").css('display', 'none');
    } else {
        $("#tblEmployeeList thead tr th:nth-child(4)").css('display', '');
        $("#tblEmployeeList tbody tr td:nth-child(4)").css('display', '');
    }

}

function Export() {
    var ReportType = "EmployeeList";
    var status = $('#ddlEmpStatus option:selected').text()
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReport").table2excel({
        filename: ReportType + "_" + status + "_" + dateString,
        fileext: ".xlsx"
    });
}

function GetEmployeeMasterList() {

    var status = $('#ddlEmpStatus option:selected').text();
    EmployeeMasterService.GetEmployeeMasterList(status).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            $("#DivtblEmployeeList").show();
            const stringFilterColumn = ["Employee Card No", "Emp Name", "Department","Designation"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code","Address"];
            const ColumnAlignment = {
            };

            var ShowCardDesp = $('#ShowCardDesp').is(':checked');
            
            //if (ShowCardDesp == false) {
            //    hiddenColumns.push("Card Desp");
            //} else {
            //    hiddenColumns.pop("Card Desp");
            //}

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="EditEmployee(${item.Code})"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewEmployee(${item.Code})"><i class="fa fa-eye"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}')"><i class="fa fa-times"></i></button>`;

        

                let AddContent = item.Address;
                let truncatedAddress = AddContent.length > 15 ? AddContent.substring(0, 15) + '...' : AddContent;
                let AddressWithTooltip = `<span title="${AddContent}">${truncatedAddress}</span>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                    Address: AddressWithTooltip,
                };
            });

          
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment,true);
           
            
            if (ShowCardDesp == false) {
                var columnsToRemoveForPrint = ["Code", "Card Desp"];
            } else {
                var columnsToRemoveForPrint = ["Code"];
            }

            response.forEach(function (row) {
                columnsToRemoveForPrint.forEach(function (column) {
                    delete row[column];
                });
            });
            PopulateTableForPrint(response);
            ShowCardDespColumn();
        }
        else {
            toastr.error('No Data Found');
            $("#DivtblEmployeeList").hide();
        }
    }).catch(error => {
        toastr.error(error.Msg);
        $("#DivtblEmployeeList").hide();
    });
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

function Delete(Code) {
    var ModuleName = "Employee",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    EmployeeMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

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
        toastr.error('Please enter a reason before proceeding.');
        //toastr.error(response.Msg);
        return;
    }
    EmployeeMasterService.DeleteEmployeeMaster(code, reason).then(function (response) {
        if (response.Status=='Y') {
            toastr.success(response.Msg);
            $('#deleteReason').val('');
            $('#txtCode').val('');
            $('#myModal').modal('hide');

            GetEmployeeMasterList();
        } else {
            toastr.error(response.Msg);
        }
    });
      
}
function CloseModal() {
    $('#myModal').modal('hide');
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
function ViewEmployee(Code) {
    var ModuleName = "Employee",
        OptionName = "VIEW",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    EmployeeMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const Codes = window.btoa(Code);
            window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeMaster?Code=" + Codes + "&Mode=View";
        }

    });

}
function EditEmployee(Code) {
    var ModuleName = "Employee",
        OptionName = "EDIT",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    EmployeeMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
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
            const Codes = window.btoa(Code);
            window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeMaster?Code=" + Codes + "&Mode=Edit";
            //window.location = baseUrl + `/HRMasters/EmployeeMaster/EmployeeMaster?Edit=${Code}&Index=${rowIndex}&codeValues=${serializedArray}`;
        }

    });

}

window.Export = Export;
window.Delete = Delete;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;
window.EditEmployee = EditEmployee;
window.ViewEmployee = ViewEmployee;
window.GetEmployeeMasterList = GetEmployeeMasterList;
window.ShowCardDespColumn = ShowCardDespColumn;