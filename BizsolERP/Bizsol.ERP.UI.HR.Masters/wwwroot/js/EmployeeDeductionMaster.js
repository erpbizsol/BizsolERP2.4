import { EmployeeDeductionMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeDeductionMasterService.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

let CurrentFinYear = JSON.parse(sessionStorage.getItem('authKey')).FinYear;

$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Employee Deduction");

    GetDeductionMasterTable();
    updateFormFields();
    $('#txtDeductionDesp').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCondition").focus();
        }
    });
    $('#txtCondition').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPercentage").focus();
        }
    });
    $('#txtPercentage').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPercentageOf").focus();
        }
    });
    $('#txtPercentageOf').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#saveEmployeeDeductionButton").focus();
        }
    });
    $('#txtPercentage').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#saveEmployeeDeductionButton").focus();
        }
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function updateFormFields() {
    const conditionValue = $("#txtCondition").val(); 
    const percentageLabel = $("label[for='txtPercentage']");
    const percentageOfContainer = $("#divPercentageOf");
    const percentageOfField = $("#txtPercentageOf");

    if (conditionValue === "F") {
        percentageLabel.html('Amount:<span class="text-danger">*</span>');
        percentageOfContainer.hide();
        percentageOfField.prop('required', false);
    } else {
        percentageLabel.html('Percentage:<span class="text-danger">*</span>');
        percentageOfContainer.show();
        percentageOfField.prop('required', true);
    }
}
function CreateNew_EmployeeDeduction() {
    OrderEntryListService.CheckModuleOptionRight('Deduction Master', 'New', 'Y', CurrentFinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#locateEmployeeDeduction").hide();
            $("#newCreateForm").show();
        }
    }).catch(function (error) {
        console.error("Error checking module rights:", error);
        toastr.error("An error occurred while checking permissions.");
    });
}
function EmployeeDeduction_Back() {
    $("#locateEmployeeDeduction").show();
    $("#newCreateForm").hide();
    ClearForm_EmployeeDeduction();
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function GetDeductionMasterTable() {
    Showloader();
    EmployeeDeductionMasterService.GetDeductionMasterList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblEmployeeDeductionMaster').show();
            const stringFilterColumn = ["Deduction Description"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {
                "Percentage": "right",
                "Code": "center"
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditEmployeeDeduction(this,'${item.Code}','N')"><i class="fa-solid fa-pencil"></i></button>
                &nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteEmployeeDeduction(this,'${item.Code}')"><i class="fa fa-times"></i></button>`
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-EmployeeDeduction", "table-body-EmployeeDeduction", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            var columnsToRemoveForPrint = ["Code"];
            response.forEach(function (row) {
                columnsToRemoveForPrint.forEach(function (column) {
                    delete row[column];
                });
            });
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblEmployeeDeductionMaster').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during SubDepartment transfer');
        });
}
function validateDecimalInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    input.value = value;
}
function submit_EmployeeDeductionMaster() {
    let code = parseInt($('#Code').val());
    let DeductionDesp = $('#txtDeductionDesp').val();
    let Condition = $('#txtCondition').val();
    let Percentage = parseFloat($('#txtPercentage').val());
    let PercentageOf = $('#txtPercentageOf').val();

    if (!DeductionDesp || !Condition || isNaN(Percentage) || !PercentageOf) {
        toastr.warning('Please fill all the fields correctly.');
        return;
    }

    if (Percentage <= 0) {
        toastr.warning('Percentage must be greater than zero.');
        return;
    }

    let CheckEmployeeDeductionPayLoad = [{

        code: code,
        deductionDesp: DeductionDesp,
        condition: Condition,
        percentage: Percentage,
        percentageOf: PercentageOf,

    }];

    EmployeeDeductionMasterService.SaveDeductionMaster(JSON.stringify(CheckEmployeeDeductionPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            $("#locateEmployeeDeduction").show();
            $("#newCreateForm").hide();
            GetDeductionMasterTable();
            ClearForm_EmployeeDeduction();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearForm_EmployeeDeduction() {
    $('#newCreateForm input').val('');
    //$("#newCreateForm select").val('');
    $('#newCreateForm input').prop('disabled', false);
    $('#newCreateForm select').prop('disabled', false);
    $('#saveEmployeeDeductionButton').prop('disabled', false);
    $('#Code').val('0');
}

async function EditEmployeeDeduction(buttonElement, code, IsMode) {
    try {
        const item = JSON.parse(buttonElement.getAttribute('data-index'));
        const row = $(buttonElement).closest('tr');


        const isReadOnly = (IsMode === 'Y');
        $('#newCreateForm input').prop('disabled', isReadOnly);
        $('#newCreateForm select').prop('disabled', isReadOnly);
        $('#saveEmployeeDeductionButton').prop('disabled', isReadOnly);

        const rightsResponse = await OrderEntryListService.CheckModuleOptionRight('Deduction Master', 'EDIT', 'Y', CurrentFinYear);
        if (rightsResponse.CheckModuleOptionRight === 'N') {
            toastr.error(rightsResponse.Msg);
            return;
        }

        const deptResponse = await EmployeeDeductionMasterService.GetDeductionMasterByCode(code);

            $("#locateEmployeeDeduction").hide();
            $("#newCreateForm").show();
            $('#Code').val(code);
            $('#txtCondition').val(deptResponse.Condition);
            updateFormFields();
            $('#txtDeductionDesp').val(deptResponse.DeductionDesp);
            $('#txtPercentage').val(deptResponse.Percentage);
            $('#txtPercentageOf').val(deptResponse.PercentageOf);

    } catch (error) {
        console.error('EditEmployeeDeduction error:', error);
        toastr.error('An error occurred: ' + (error?.message || 'Unknown error'));
    }
}

function DeleteEmployeeDeduction(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    OrderEntryListService.CheckModuleOptionRight('Deduction Master', 'Delete', 'Y', CurrentFinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#myModal').data('code', code);
            $('#myModal').modal({
                backdrop: 'static',
            });

            $('#myModal').modal('show');
        }
    }).catch(function (error) {
        console.error("Error checking module rights:", error);
        toastr.error("An error occurred while checking permissions.");
    });

}
function CloseModal_EmployeeDeductionDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_EmployeeDeductionDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    EmployeeDeductionMasterService.DeleteDeductionMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_EmployeeDeductionDelete();
            GetDeductionMasterTable();
        } else {
            toastr.warning(response.Msg);
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during Department delete');
    });
}
function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    //tableBody.empty();

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
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
    var ReportType = "EmployeeDeductionReport";
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
window.CreateNew_EmployeeDeduction = CreateNew_EmployeeDeduction;
window.updateFormFields = updateFormFields;
window.EmployeeDeduction_Back = EmployeeDeduction_Back;
window.submit_EmployeeDeductionMaster = submit_EmployeeDeductionMaster;
window.validateDecimalInput = validateDecimalInput;
window.EditEmployeeDeduction = EditEmployeeDeduction;
window.DeleteEmployeeDeduction = DeleteEmployeeDeduction;
window.SaveModal_EmployeeDeductionDelete = SaveModal_EmployeeDeductionDelete;
window.CloseModal_EmployeeDeductionDelete = CloseModal_EmployeeDeductionDelete;