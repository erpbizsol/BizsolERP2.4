import { AllowanceMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AllowanceMasterService.js';

let Status = '';

$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Allowance Master");
    Status = $('#txtAllowance').val();
    GetAllowanceMasterTable();
    $('#txtDesp').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtSortOrder").focus();
        }
    });
    $('#txtSortOrder').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtActive").focus();
        }
    });
    $('#txtActive').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDefaultAmount").focus();
        }
    });
    $('#txtDefaultAmount').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPartOfCTC").focus();
        }
    });
    $('#txtPartOfCTC').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#saveAllowanceButton").focus();
        }
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function CreateNew_AllowanceMaster() {
    $("#locateAllowanceMaster").hide();
    $("#newCreateForm").show();

}
function ListStatus_AllowanceMaster() {
    Status = $('#txtAllowance').val();

    if (Status === 'Y') {
        GetAllowanceMasterTable(); 
    } else if (Status === 'N') {
        GetAllowanceMasterTable();
    } else {
        GetAllowanceMasterTable();
    }
}
function AllowanceMaster_Back() {
    $("#locateAllowanceMaster").show();
    $("#newCreateForm").hide();
}
function validateDecimalInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 7) {
        value = value.slice(0, 7);
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    input.value = value;
}
function GetAllowanceMasterTable() {
    Showloader();
    AllowanceMasterService.AllowanceMasterList(Status).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('tblAllowanceMaster').show();
            const stringFilterColumn = ["Allowance Name", "Part Of CTC", "Active"];
            const numericFilterColumn = ["Sort Order","Default Amount"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const columnAlignment = {
                'Sort Order':'right',
                'Default Amount':'right',
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditAllowance(this,'${item.Code}')"><i class="fa-solid fa-pencil"></i></button>&nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteAllowance(this,'${item.Code}')"><i class="fa fa-times"></i></button>`
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-AllowanceMaster", "table-body-AllowanceMaster", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            ChangeBackgroundColor();
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
            $('#tblAllowanceMaster').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Allowance transfer');
        });
}
function ChangeBackgroundColor() {
    const tableRows = document.querySelectorAll('#table-body-AllowanceMaster tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            if (cell.textContent.trim() === 'NO') {
                //cell.style.backgroundColor = '#E84050';
                cell.style.color = '#E84050';
            }
        });
    });
}
function submit_AllowanceMaster() {
    let code = $('#Code').val();
    let desp = $('#txtDesp').val();
    let sortOrder = $('#txtSortOrder').val();
    let active = $('#txtActive').val();
    let defaultAmount = $('#txtDefaultAmount').val();
    let partOfCTC = $('#txtPartOfCTC').val();

    let CheckAllowanceMasterPayLoad = [{

        code: code,
        desp: desp ,
        sortOrder: sortOrder ,
        isActive: active,
        defaultAmount: defaultAmount ,
        partOfCTC: partOfCTC,

    }];

    if (!desp || !sortOrder || !active || !defaultAmount || isNaN(defaultAmount) || parseFloat(defaultAmount) <= 0 || !partOfCTC) {
        toastr.warning('Please Fill All The Fields. Default Amount Must Be Greater Than Zero.');
        return;
    }
    AllowanceMasterService.SaveAllowanceMaster(JSON.stringify(CheckAllowanceMasterPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            $("#locateAllowanceMaster").show();
            $("#newCreateForm").hide();
            GetAllowanceMasterTable();
            ClearForm_AllowanceMaster();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearForm_AllowanceMaster() {
     $('#txtDesp').val('');
     $('#txtSortOrder').val('');
     $('#txtActive').val('');
     $('#txtDefaultAmount').val('');
     $('#txtPartOfCTC').val('');
}
function EditAllowance(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr'); 

    AllowanceMasterService.GetAllowanceMasterByCode(code)
        .then(function (response) {
            if (response) {
                $("#locateAllowanceMaster").hide(); 
                $("#newCreateForm").show(); 

                $('#Code').val(code);
                $('#txtDesp').val(response[0].Desp);
                $('#txtSortOrder').val(response[0].SortOrder);
                $('#txtActive').val(response[0].IsActive);
                $('#txtDefaultAmount').val(response[0].DefaultAmount);
                $('#txtPartOfCTC').val(response[0].PartOfCTC);
            }
        })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error while fetching allowance details');
        });
}
function DeleteAllowance(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    $('#myModal').data('code', code);
    $('#myModal').modal({
        backdrop: 'static',
    });

    $('#myModal').modal('show');
}

function CloseModal_AllowanceDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}

function SaveModal_AllowanceDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    AllowanceMasterService.DeleteAllowanceMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_AllowanceDelete(); 
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during Allowance delete');
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
    var ReportType = "AllowanceMasterReport";
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
window.CreateNew_AllowanceMaster = CreateNew_AllowanceMaster;
window.ListStatus_AllowanceMaster = ListStatus_AllowanceMaster;
window.AllowanceMaster_Back = AllowanceMaster_Back;
window.submit_AllowanceMaster = submit_AllowanceMaster;
window.validateDecimalInput = validateDecimalInput;
window.EditAllowance = EditAllowance;
window.DeleteAllowance = DeleteAllowance;
window.SaveModal_AllowanceDelete = SaveModal_AllowanceDelete;
window.CloseModal_AllowanceDelete = CloseModal_AllowanceDelete;