import { DepartmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DepartmentService.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let Status = '';
let CurrentFinYear = JSON.parse(sessionStorage.getItem('authKey')).FinYear;
$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Department");

    Status = $('#txtStatus').val();
    GetDepartmentTable();

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
            $("#saveDepartmentButton").focus();
        }
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function CreateNew_Department() {
    OrderEntryListService.CheckModuleOptionRight('Department', 'New', 'Y', CurrentFinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#locateDepartment").hide();
            $("#newCreateForm").show();
            GetDepartmentTypeList();
            GetDivisionList();
        }
    }).catch(function (error) {
        console.error("Error checking module rights:", error);
        toastr.error("An error occurred while checking permissions.");
    });
    
}
function Department_Back() {
    $("#locateDepartment").show();
    $("#newCreateForm").hide();
    ClearForm_Department();
}
function ListStatus_Department() {
    Status = $('#txtStatus').val();

    if (Status === 'Y') {
        GetDepartmentTable();
    } else if (Status === 'N') {
        GetDepartmentTable();
    } else {
        GetDepartmentTable();
    }
}
function GetDepartmentTable() {
    Showloader();
    DepartmentService.DepartmentList(Status).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblDepartment').show();
            const stringFilterColumn = ["Department Name"];
            const numericFilterColumn = ["Department Code"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "UserName", "DepartmentAddress", "DivisionName", "Weeklyoff", "SecondWeeklyoff", "FirstSecondWeeklyoffON", "SecondSecondWeeklyoffON", "LunchTimeDeduction", "ProfessionalTaxApplicable", "MachineApplicable", "LunchTimeDeductionInWeeklyOff","DepartmentEmailId"];
            const columnAlignment = {
                'Department Code': 'center',
                'FinYear': 'center',
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditDepartment(this,'${item.Code}','N')"><i class="fa-solid fa-pencil"></i></button>
                &nbsp;<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteDepartment(this,'${item.Code}')"><i class="fa fa-times"></i></button>
                &nbsp;<button class="btn btn-info icon-height mb-1" title="View" onclick="EditDepartment(this,'${item.Code}','Y')"><i class="fa-regular fa-eye"></i></button>`
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-Department", "table-body-Department", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
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
            $('#tblDepartment').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Department transfer');
        });
}
function GetDepartmentTypeList() {
    DepartmentService.GetDepartmentTypeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtDepartmentType')[0], response.map((item) => ({ Code: item.Value, Desp: item.Value })));

            $('#txtDepartmentType').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetDivisionList() {
    DepartmentService.GetDivisionList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtDivisionName')[0], response.map((item) => ({ Code: item.DivisionDesp, Desp: item.DivisionDesp })));

            $('#txtDivisionName').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, ''); 
    if (value.length > 5) {
        value = value.slice(0, 5); 
    }
    input.value = value;
}
function submit_Department() {
    let code = parseInt($('#Code').val());
    let DepartmentName = $('#txtDepartmentName').val();
    let DepartmentCode = $('#txtDepartmentCode').val();
    let DepartmentType = $('#txtDepartmentType').val();
    let DepartmentAddress = $('#txtDepartmentAddress').val();
    let WeeklyOff = $('#txtWeeklyOff').val();
    let DivisionName = $('#txtDivisionName').val();
    let SecondWeeklyOff = $('#txtSecondWeeklyOff').val();
    let FirstSecondWeeklyoffON = parseInt($('#txtFirstSecondWeeklyoffON').val());
    let SecondSecondWeeklyoffON = parseInt($('#txtSecondSecondWeeklyoffON').val());
    let LunchTimeDeduction = $('#txtLunchTimeDeduction').val();
    let ProfessionalTaxApplicable = $('#txtProfessionalTaxApplicable').val();
    let MachineApplicable = $('#txtMachineApplicable').val();
    let LunchTimeDeductionInWeeklyOff = $('#txtLunchTimeDeductionInWeeklyOff').val();
    let DepartmentEmailID = $('#txtDepartmentEmailID').val();
    let Prefix = $('#txtPrefix').val();
    let ShiftMaster_CodeForDeductLunchTimeForOT = $('#txtShiftMaster_CodeForDeductLunchTimeForOT').val();
    let ShiftMaster_CodeForDeductInWeekOfForOT = $('#txtShiftMaster_CodeForDeductInWeekOfForOT').val();
    let active = $('#txtIsActive').val();
    let UserCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;

    let CheckDepartmentPayLoad = [{

        code: code,
        departmentName: DepartmentName,
        initials: DepartmentCode,
        departmentType: DepartmentType,
        departmentAddress: DepartmentAddress,
        weeklyoff: WeeklyOff,
        divisionName: DivisionName,
        secondWeeklyoff: SecondWeeklyOff,
        firstSecondWeeklyoffON: FirstSecondWeeklyoffON,
        secondSecondWeeklyoffON: SecondSecondWeeklyoffON,
        lunchTimeDeduction: LunchTimeDeduction,
        machineApplicable: ProfessionalTaxApplicable,
        machineApplicable: MachineApplicable,
        lunchTimeDeductionInWeeklyOff: LunchTimeDeductionInWeeklyOff,
        departmentEmailId: DepartmentEmailID,
        prefix: Prefix,
        shiftMaster_CodeForDeductLunchTimeForOT: ShiftMaster_CodeForDeductLunchTimeForOT,
        shiftMaster_CodeForDeductInWeekOfForOT: ShiftMaster_CodeForDeductInWeekOfForOT,
        isActive: active,
        userMaster_Code: UserCode,

    }];

    if (!DepartmentName || !DepartmentCode || !DepartmentType || !DepartmentAddress || !WeeklyOff || !DivisionName || !SecondWeeklyOff
        || !FirstSecondWeeklyoffON || !SecondSecondWeeklyoffON || !LunchTimeDeduction || !ProfessionalTaxApplicable || !MachineApplicable
        || !LunchTimeDeductionInWeeklyOff || !DepartmentEmailID || !Prefix || !ShiftMaster_CodeForDeductLunchTimeForOT || !ShiftMaster_CodeForDeductInWeekOfForOT || !active) {
        toastr.warning('Please Fill All The Fields.');
        return;
    }
    DepartmentService.SaveDepartment(JSON.stringify(CheckDepartmentPayLoad)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            $("#locateDepartment").show();
            $("#newCreateForm").hide();
            Status = $('#txtStatus').val();
            GetDepartmentTable();
            ClearForm_Department();
        }
        else if (response.Status === 'N') {
            toastr.warning(response.Msg);
        }
    });
}
function ClearForm_Department() {
    $('#newCreateForm input').val('');
    $("#newCreateForm select").val('');
    $('#newCreateForm input').prop('disabled', false);
    $('#newCreateForm select').prop('disabled', false);
    $('#saveDepartmentButton').prop('disabled', false);
    $('#Code').val('0');
}
//async function EditDepartment(buttonElement, code, IsMode) {
//    const item = JSON.parse(buttonElement.getAttribute('data-index'));
//    const row = $(buttonElement).closest('tr');
//    await GetDepartmentTypeList();
//    await GetDivisionList();
//    if (IsMode === 'Y') {
//        $('#newCreateForm input').prop('disabled', true);
//        $('#newCreateForm select').prop('disabled', true);
//        $('#saveDepartmentButton').prop('disabled', true);
//    }
//    else if(IsMode === 'N'){
//        $('#newCreateForm input').prop('disabled', false);
//        $('#newCreateForm select').prop('disabled', false);
//        $('#saveDepartmentButton').prop('disabled', false);
//    }
//    OrderEntryListService.CheckModuleOptionRight('Department', 'EDIT', 'Y', CurrentFinYear).then(function (response) {
//        if (response.CheckModuleOptionRight === 'N') {
//            toastr.error(rightsResponse.Msg);
//            return;
//        }
//        else {
//    DepartmentService.GetDepartmentByCode(code)
//        .then(function (response) {
//            if (response && response.length > 0) {
//                $("#locateDepartment").hide();
//                $("#newCreateForm").show();

//                $('#Code').val(code);
//                $('#txtDepartmentName').val(response[0].DepartmentName);
//                $('#txtDepartmentCode').val(response[0].Initials);
//                BizSolHelperFunction.SelectOptionByText('txtDepartmentType', response[0].DepartmentType);
//                $('#txtDepartmentAddress').val(response[0].DepartmentAddress);
//                $('#txtWeeklyOff').val(response[0].Weeklyoff);
//                BizSolHelperFunction.SelectOptionByText('txtDivisionName', response[0].DivisionName);
//                $('#txtSecondWeeklyOff').val(response[0].SecondWeeklyoff);
//                $('#txtFirstSecondWeeklyoffON').val(response[0].FirstSecondWeeklyoffON);
//                $('#txtSecondSecondWeeklyoffON').val(response[0].SecondSecondWeeklyoffON);
//                $('#txtLunchTimeDeduction').val(response[0].LunchTimeDeduction);
//                $('#txtProfessionalTaxApplicable').val(response[0].ProfessionalTaxApplicable);
//                $('#txtMachineApplicable').val(response[0].MachineApplicable);
//                $('#txtLunchTimeDeductionInWeeklyOff').val(response[0].LunchTimeDeductionInWeeklyOff);
//                $('#txtDepartmentEmailID').val(response[0].DepartmentEmailId);
//                $('#txtPrefix').val(response[0].Prefix);
//                $('#txtShiftMaster_CodeForDeductLunchTimeForOT').val(response[0].ShiftMaster_CodeForDeductLunchTimeForOT);
//                $('#txtShiftMaster_CodeForDeductInWeekOfForOT').val(response[0].ShiftMaster_CodeForDeductInWeekOfForOT);
//                $('#txtIsActive').val(response[0].IsActive);
//            }
//        })
//        .catch(function (error) {
//            toastr.error('Error fetching department types: ' + (error?.message || JSON.stringify(error)));
//        });
//        }
//    })
//}
async function EditDepartment(buttonElement, code, IsMode) {
    try {
        const item = JSON.parse(buttonElement.getAttribute('data-index'));
        const row = $(buttonElement).closest('tr');

        await GetDepartmentTypeList();
        await GetDivisionList();

        const isViewMode = IsMode === 'Y';
        $('#newCreateForm input, #newCreateForm select').prop('disabled', isViewMode);
        $('#saveDepartmentButton').prop('disabled', isViewMode);

        const rightsResponse = await OrderEntryListService.CheckModuleOptionRight('Department', 'EDIT', 'Y', CurrentFinYear);

        if (rightsResponse.CheckModuleOptionRight === 'N') {
            toastr.error(rightsResponse.Msg || 'You do not have permission to edit.');
            return;
        }

        const departmentData = await DepartmentService.GetDepartmentByCode(code);

        if (departmentData && departmentData.length > 0) {
            const dept = departmentData[0];

            $('#locateDepartment').hide();
            $('#newCreateForm').show();

            $('#Code').val(code);
            $('#txtDepartmentName').val(dept.DepartmentName);
            $('#txtDepartmentCode').val(dept.Initials);
            BizSolHelperFunction.SelectOptionByText('txtDepartmentType', dept.DepartmentType);
            $('#txtDepartmentAddress').val(dept.DepartmentAddress);
            $('#txtWeeklyOff').val(dept.Weeklyoff);
            BizSolHelperFunction.SelectOptionByText('txtDivisionName', dept.DivisionName);
            $('#txtSecondWeeklyOff').val(dept.SecondWeeklyoff);
            $('#txtFirstSecondWeeklyoffON').val(dept.FirstSecondWeeklyoffON);
            $('#txtSecondSecondWeeklyoffON').val(dept.SecondSecondWeeklyoffON);
            $('#txtLunchTimeDeduction').val(dept.LunchTimeDeduction);
            $('#txtProfessionalTaxApplicable').val(dept.ProfessionalTaxApplicable);
            $('#txtMachineApplicable').val(dept.MachineApplicable);
            $('#txtLunchTimeDeductionInWeeklyOff').val(dept.LunchTimeDeductionInWeeklyOff);
            $('#txtDepartmentEmailID').val(dept.DepartmentEmailId);
            $('#txtPrefix').val(dept.Prefix);
            $('#txtShiftMaster_CodeForDeductLunchTimeForOT').val(dept.ShiftMaster_CodeForDeductLunchTimeForOT);
            $('#txtShiftMaster_CodeForDeductInWeekOfForOT').val(dept.ShiftMaster_CodeForDeductInWeekOfForOT);
            $('#txtIsActive').val(dept.IsActive);
        } else {
            toastr.warning('Department details not found.');
        }
    } catch (error) {
        toastr.error('An error occurred while editing the department: ' + (error?.message || JSON.stringify(error)));
    }
}

function DeleteDepartment(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    OrderEntryListService.CheckModuleOptionRight('Department', 'DELETE', 'Y', CurrentFinYear).then(function (response) {
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
function CloseModal_DepartmentDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_DepartmentDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    DepartmentService.DeleteDepartment(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_DepartmentDelete();
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
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
    var ReportType = "DepartmentReport";
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
window.ListStatus_Department = ListStatus_Department;
window.CreateNew_Department = CreateNew_Department;
window.Department_Back = Department_Back;
window.submit_Department = submit_Department;
window.validateIntegerInput = validateIntegerInput;
window.EditDepartment = EditDepartment;
window.DeleteDepartment = DeleteDepartment;
window.SaveModal_DepartmentDelete = SaveModal_DepartmentDelete;
window.CloseModal_DepartmentDelete = CloseModal_DepartmentDelete;