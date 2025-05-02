import { DesignationMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DesignationMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

let Status = '';
let designationType_Code = 0;
let CurrentFinYear = JSON.parse(sessionStorage.getItem('authKey')).FinYear;
$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Designation Master");

    Status = $('#txtStatus').val();
    GetDesignationMasterListTable();

    $('#txtDesignationCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPrefix").focus();
        }
    });
    $('#txtPrefix').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDesignationName").focus();
        }
    });
    $('#txtDesignationName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtActive").focus();
        }
    });
    $('#txtActive').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDesignationType").focus();
        }
    });
    $('#txtDesignationType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#saveDesignationButton").focus();
        }
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function CreateNew_DesignationMaster() {
    OrderEntryListService.CheckModuleOptionRight('Sub Department', 'NEW', 'Y', CurrentFinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#locateDesignationMaster").hide();
            $("#newCreateForm").show();
            FillDesignationType();
        }
    }).catch(function (error) {
        console.error("Error checking module rights:", error);
        toastr.error("An error occurred while checking permissions.");
    });
}
function DesignationMaster_Back() {
    $("#locateDesignationMaster").show();
    $("#newCreateForm").hide();
    $('#txtDesignationCode').val('');
    $('#txtPrefix').val('');
    $('#txtDesignationName').val('');
    $('#txtActive').val('');
}
function ListStatus_Designation() {
    Status = $('#txtStatus').val();

    if (Status === 'Y') {
        GetDesignationMasterListTable();
    } else if (Status === 'N') {
        GetDesignationMasterListTable();
    } else {
        GetDesignationMasterListTable();
    }
}
function GetDesignationMasterListTable() {
    Showloader();
    DesignationMasterService.GetDesignationMasterList(Status).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblDesignationMaster').show();
            const stringFilterColumn = ["Designation Code","Designation Name", "Designation Type","Prefix"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const columnAlignment = {
                'Designation Code': 'center',
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditDesignation(this,'${item.Code}')"><i class="fa-solid fa-pencil"></i></button>&nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteDesignation(this,'${item.Code}')"><i class="fa fa-times"></i></button>`
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-DesignationMaster", "table-body-DesignationMaster", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
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
            $('#tblDesignationMaster').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Allowance transfer');
        });
}
function ChangeBackgroundColor() {
    const tableRows = document.querySelectorAll('#table-body-DesignationMaster tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            if (cell.textContent.trim() === 'NO') {
                cell.style.backgroundColor = '#E84050';
                cell.style.color = 'white';
            }
        });
    });
}
function FillDesignationType() {
    DesignationMasterService.GetDesignationTypeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtDesignationType')[0], response.map((item) => ({ Code: item.Value, Desp: item.Value })));

            $('#txtDesignationType').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function submit_DesignationMaster() {
    let code = $('#Code').val();
    let designationCode = $('#txtDesignationCode').val();
    let prefix = $('#txtPrefix').val();
    let designationName = $('#txtDesignationName').val();
    let designationActive = $('#txtActive').val();
    designationType_Code = $('#txtDesignationType').val();

    let CheckDesignationMasterPayLoad = [{

        code: code,
        designationCode: designationCode,
        prefix: prefix,
        designationName: designationName,
        isActive: designationActive,
        designationType: designationType_Code,

    }];

    if (!designationCode || !designationName || !designationType_Code || !prefix || !designationActive) {
        toastr.warning('Please Fill All The Fields.');
        return;
    }
    DesignationMasterService.SaveDesignationMaster(JSON.stringify(CheckDesignationMasterPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            $("#locateDesignationMaster").show();
            $("#newCreateForm").hide();
            GetDesignationMasterListTable();
            ClearForm_DesignationMaster();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearForm_DesignationMaster() {
    $('#txtDesignationCode').val('');
    $('#txtPrefix').val('');
    $('#txtDesignationName').val('');
    $('#txtActive').val('');
    $('#txtDesignationType').val('');
}
//async function EditDesignation(buttonElement, code) {
//    const item = JSON.parse(buttonElement.getAttribute('data-index'));
//    const row = $(buttonElement).closest('tr');
//    await FillDesignationType();

//    DesignationMasterService.GetDesignationMasterByCode(code)
//        .then(function (response) {
//            if (response && response.length > 0) {
//                $("#locateDesignationMaster").hide();
//                $("#newCreateForm").show();

//                $('#Code').val(response.Code);
//                $('#txtDesignationCode').val(response.DesignationCode);
//                $('#txtPrefix').val(response.Prefix);
//                $('#txtDesignationName').val(response.DesignationName);
//                BizSolHelperFunction.SelectOptionByText('txtDesignationType', response.DesignationType);
//            }
//        })
//        .catch(function (error) {
//            toastr.error(error.Msg || 'Error while fetching allowance details');
//        });
//}
async function EditDesignation(buttonElement, code) {
    try {
        const item = JSON.parse(buttonElement.getAttribute('data-index'));
        const row = $(buttonElement).closest('tr');

        await FillDesignationType();

        const rightsResponse = await OrderEntryListService.CheckModuleOptionRight('Designation', 'EDIT', 'Y', CurrentFinYear);

        if (rightsResponse.CheckModuleOptionRight === 'N') {
            toastr.error(rightsResponse.Msg || 'You do not have permission to edit.');
            return;
        }

        const designationResponse = await DesignationMasterService.GetDesignationMasterByCode(code);

            const data = designationResponse;

            $('#locateDesignationMaster').hide();
            $('#newCreateForm').show();

            $('#Code').val(data.Code);
            $('#txtDesignationCode').val(data.DesignationCode);
            $('#txtPrefix').val(data.Prefix);
            $('#txtDesignationName').val(data.DesignationName);
            BizSolHelperFunction.SelectOptionByText('txtDesignationType', data.DesignationType);
        
    } catch (error) {
        console.error('Error during EditDesignation:', error);
        toastr.error('An error occurred while editing the designation.');
    }
}

function DeleteDesignation(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    OrderEntryListService.CheckModuleOptionRight('Designation', 'DELETE', 'Y', CurrentFinYear).then(function (response) {
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

function CloseModal_DesignationDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}

function SaveModal_DesignationDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    DesignationMasterService.DeleteDesignationMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            GetDesignationMasterListTable();
            CloseModal_DesignationDelete();
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during Designation delete');
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
    var ReportType = "DesignationMasterReport";
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
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.Export = Export;
window.ListStatus_Designation = ListStatus_Designation;
window.CreateNew_DesignationMaster = CreateNew_DesignationMaster;
window.DesignationMaster_Back = DesignationMaster_Back;
window.submit_DesignationMaster = submit_DesignationMaster;
window.EditDesignation = EditDesignation;
window.DeleteDesignation = DeleteDesignation;
window.SaveModal_DesignationDelete = SaveModal_DesignationDelete;
window.CloseModal_DesignationDelete = CloseModal_DesignationDelete;