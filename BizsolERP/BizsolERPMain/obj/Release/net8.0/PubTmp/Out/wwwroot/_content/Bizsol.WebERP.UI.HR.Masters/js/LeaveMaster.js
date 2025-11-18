import { LeaveMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/LeaveMasterService.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

let CurrentFinYear = JSON.parse(sessionStorage.getItem('authKey')).FinYear;

$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Leave Master");

    GetLeaveMasterTable();
    $('#txtLeaveDesp').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtShortDesp").focus();
        }
    });
    $('#txtShortDesp').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDefaultValue").focus();
        }
    });
    $('#txtDefaultValue').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtHalfApplicable").focus();
        }
    });
    $('#txtHalfApplicable').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtHalfLeaveDesp").focus();
        }
    });
    $('#txtHalfLeaveDesp').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtApplicability").focus();
        }
    });
    $('#txtApplicability').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCarryForwordApplicable").focus();
        }
    });
    $('#txtCarryForwordApplicable').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#saveLeaveMasterButton").focus();
        }
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function CreateNew_LeaveMaster() {
    OrderEntryListService.CheckModuleOptionRight('Leave Master', 'New', 'Y', CurrentFinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#locateLeaveMaster").hide();
            $("#newCreateForm").show();
        }
    }).catch(function (error) {
        console.error("Error checking module rights:", error);
        toastr.error("An error occurred while checking permissions.");
    });
}
function LeaveMaster_Back() {
    $("#locateLeaveMaster").show();
    $("#newCreateForm").hide();
    ClearForm_LeaveMaster();
}
function GetLeaveMasterTable() {
    Showloader();
    LeaveMasterService.GetLeaveMasterList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblLeaveMaster').show();
            const stringFilterColumn = ["Leave Description"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const columnAlignment = {
                "No Of Leave": "right",
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditLeaveMaster(this,'${item.Code}','N')"><i class="fa-solid fa-pencil"></i></button>
                &nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteLeaveMaster(this,'${item.Code}')"><i class="fa fa-times"></i></button>`
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-LeaveMaster", "table-body-LeaveMaster", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
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
            $('#tblLeaveMaster').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Leave transfer');
        });
}
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 5) {
        value = value.slice(0, 5);
    }
    input.value = value;
}
function submit_LeaveMaster() {
    let code = parseInt($('#Code').val());
    let LeaveDesp = $('#txtLeaveDesp').val();
    let ShortDesp = $('#txtShortDesp').val();
    let DefaultValue = parseInt($('#txtDefaultValue').val());
    let HalfApplicable = $('#txtHalfApplicable').val();
    let HalfLeaveDesp = $('#txtHalfLeaveDesp').val();
    let Applicability = $('#txtApplicability').val();
    let CarryForwordApplicable = $('#txtCarryForwordApplicable').val();

    if (!LeaveDesp || !ShortDesp || isNaN(DefaultValue) || !HalfApplicable || !HalfLeaveDesp || !Applicability || !CarryForwordApplicable) {
        toastr.warning('Please fill all the fields correctly.');
        return;
    }

    if (DefaultValue <= 0) {
        toastr.warning('Percentage must be greater than zero.');
        return;
    }

    let CheckLeaveMasterPayLoad = [{

        code: code,
        leaveDesp: LeaveDesp,
        shortDesp: ShortDesp,
        defaultValue: DefaultValue,
        halfApplicable: HalfApplicable,
        halfLeaveDesp: HalfLeaveDesp,
        applicability: Applicability,
        carryForwordApplicable: CarryForwordApplicable,

    }];

    LeaveMasterService.SaveLeaveMaster(JSON.stringify(CheckLeaveMasterPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            $("#locateLeaveMaster").show();
            $("#newCreateForm").hide();
            GetLeaveMasterTable();
            ClearForm_LeaveMaster();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearForm_LeaveMaster() {
    $('#newCreateForm input').val('');
    $('#newCreateForm input').prop('disabled', false);
    $('#newCreateForm select').prop('disabled', false);
    $('#saveLeaveMasterButton').prop('disabled', false);
    $('#Code').val('0');
}

async function EditLeaveMaster(buttonElement, code, IsMode) {
    try {
        const item = JSON.parse(buttonElement.getAttribute('data-index'));
        const row = $(buttonElement).closest('tr');


        const isReadOnly = (IsMode === 'Y');
        $('#newCreateForm input').prop('disabled', isReadOnly);
        $('#newCreateForm select').prop('disabled', isReadOnly);
        $('#saveLeaveMasterButton').prop('disabled', isReadOnly);

        const rightsResponse = await OrderEntryListService.CheckModuleOptionRight('Leave Master', 'EDIT', 'Y', CurrentFinYear);
        if (rightsResponse.CheckModuleOptionRight === 'N') {
            toastr.error(rightsResponse.Msg);
            return;
        }

        const deptResponse = await LeaveMasterService.GetLeaveMasterByCode(code);

        $("#locateLeaveMaster").hide();
        $("#newCreateForm").show();
        $('#Code').val(code);
        $('#txtLeaveDesp').val(deptResponse.LeaveDesp);
        $('#txtShortDesp').val(deptResponse.ShortDesp);
        $('#txtDefaultValue').val(deptResponse.DefaultValue);
        $('#txtHalfApplicable').val(deptResponse.HalfApplicable);
        $('#txtHalfLeaveDesp').val(deptResponse.HalfLeaveDesp);
        $('#txtApplicability').val(deptResponse.Applicability);
        $('#txtCarryForwordApplicable').val(deptResponse.CarryForwordApplicable);

    } catch (error) {
        console.error('EditLeaveMaster error:', error);
        toastr.error('An error occurred: ' + (error?.message || 'Unknown error'));
    }
}

function DeleteLeaveMaster(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    OrderEntryListService.CheckModuleOptionRight('Leave Master', 'Delete', 'Y', CurrentFinYear).then(function (response) {
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
function CloseModal_LeaveMasterDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_LeaveMasterDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    LeaveMasterService.DeleteLeaveMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_LeaveMasterDelete();
            GetLeaveMasterTable();
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
    var ReportType = "LeaveMasterReport";
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
window.CreateNew_LeaveMaster = CreateNew_LeaveMaster;
window.LeaveMaster_Back = LeaveMaster_Back;
window.submit_LeaveMaster = submit_LeaveMaster;
window.validateIntegerInput = validateIntegerInput;
window.EditLeaveMaster = EditLeaveMaster;
window.DeleteLeaveMaster = DeleteLeaveMaster;
window.SaveModal_LeaveMasterDelete = SaveModal_LeaveMasterDelete;
window.CloseModal_LeaveMasterDelete = CloseModal_LeaveMasterDelete;