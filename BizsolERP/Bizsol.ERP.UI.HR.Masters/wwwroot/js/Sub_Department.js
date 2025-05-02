import { Sub_DepartmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/Sub_DepartmentService.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';
import { DepartmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DepartmentService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let StatusList = 'Y';
let Status = '';
let DepartmentName = '';
let CurrentFinYear = JSON.parse(sessionStorage.getItem('authKey')).FinYear;

$(document).ready(function () {
    //PBControls();
    $("#ERPHeading").text("Sub Department");
    Status = $('#txtStatus').val();
    GetSubDepartmentTable()
    DepartmentDropDown();
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
function CreateNew_Sub_Department() {
          OrderEntryListService.CheckModuleOptionRight('Sub Department', 'New', 'Y', CurrentFinYear).then(function (response) {
                  if (response.CheckModuleOptionRight === 'N') {
                      toastr.error(response.Msg);
                      return false;
                  } else {
                      $("#locateSubDepartment").hide();
                      $("#newCreateForm").show();
                      DepartmentDropDown();
                  }
              }).catch(function (error) {
                  console.error("Error checking module rights:", error);
                  toastr.error("An error occurred while checking permissions.");
              });
}
function Department_Back() {
    $("#locateSubDepartment").show();
    $("#newCreateForm").hide();
    ClearForm_Sub_Department();
}
function ListStatus_Sub_Department() {
    Status = $('#txtStatus').val();

    if (Status === 'Y') {
        GetSubDepartmentTable();
    } else if (Status === 'N') {
        GetSubDepartmentTable();
    } else {
        GetSubDepartmentTable();
    }
}
function DepartmentDropDown() {
    DepartmentService.DepartmentList(StatusList).then(function (response) {
        if (response && response.length > 0) {
            
            BindSelectList($('#txtFilterDepartmentName')[0], response.map((item) => ({ Code: item?.['Department Name'], Desp: item?.['Department Name'] })));
            $('#txtFilterDepartmentName').select2({
                width: '-webkit-fill-available'
            });

            BindSelectList($('#txtDepartmentName')[0], response.map((item) => ({ Code: item?.['Department Name'], Desp: item?.['Department Name'] })));
            $('#txtDepartmentName').select2({
                width: '-webkit-fill-available'
            });
        }
    }).catch(function (error) {
        console.error('Error fetching department list:', error);
    });
}

function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function GetSubDepartmentTable() {
    DepartmentName = $('#txtFilterDepartmentName option:selected').text();
    Showloader();
    Sub_DepartmentService.SubDepartmentMasterList(Status, DepartmentName).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblSubDepartment').show();
            const stringFilterColumn = ["Department","SubDepartmentName"];
            const numericFilterColumn = ["Initials"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "UserName", "DepartmentAddress", "DivisionName", "Weeklyoff", "SecondWeeklyoff", "FirstSecondWeeklyoffON", "SecondSecondWeeklyoffON", "LunchTimeDeduction", "ProfessionalTaxApplicable", "MachineApplicable", "LunchTimeDeductionInWeeklyOff", "DepartmentEmailId"];
            const columnAlignment = {
                'Initials': 'right',
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
            BizsolCustomFilterGrid.CreateDataTable("table-header-SubDepartment", "table-body-SubDepartment", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
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
            $('#tblSubDepartment').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during SubDepartment transfer');
        });
}
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 5) {
        value = value.slice(0, 5);
    }
    input.value = value;
}
function submit_Sub_Department() {
    let code = parseInt($('#Code').val());
    let DepartmentName = $('#txtDepartmentName').val();
    let SubDepartmentName = $('#txtSubDepartmentName').val();
    let SubDepartmentCode = $('#txtSubDepartmentCode').val();
    let Prefix = $('#txtPrefix').val();
    let ShowInDailyAtt = $('#txtShowInDailyAtt').val();
    let UserCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;

    let CheckSub_DepartmentPayLoad = [{

        code: code,
        departmentName: DepartmentName,
        subDepartmentName: SubDepartmentName,
        initials: SubDepartmentCode,
        prefix: Prefix,
        showInDailyAtt: ShowInDailyAtt,
        userMaster_Code: UserCode,

    }];

    if (!DepartmentName || !SubDepartmentName || !SubDepartmentCode || !Prefix || !ShowInDailyAtt) {
        toastr.warning('Please Fill All The Fields.');
        return;
    }

    Sub_DepartmentService.SaveSubDepartment(JSON.stringify(CheckSub_DepartmentPayLoad)).then(function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    $("#locateSubDepartment").show();
                    $("#newCreateForm").hide();
                    Status = $('#txtStatus').val();
                    GetSubDepartmentTable();
                    ClearForm_Sub_Department();
                }
                else if (response.Status === 'N') {
                    toastr.warning(response.Msg);
                }
            });
}
function ClearForm_Sub_Department() {
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
//    await DepartmentDropDown();

//    if (IsMode === 'Y') {
//        $('#newCreateForm input').prop('disabled', true);
//        $('#newCreateForm select').prop('disabled', true);
//        $('#saveDepartmentButton').prop('disabled', true);
//    }
//    else if (IsMode === 'N') {
//        $('#newCreateForm input').prop('disabled', false);
//        $('#newCreateForm select').prop('disabled', false);
//        $('#saveDepartmentButton').prop('disabled', false);
//    }
//    OrderEntryListService.CheckModuleOptionRight('Sub Department', 'EDIT', 'Y', CurrentFinYear).then(function (response) {
//        if (response.CheckModuleOptionRight == 'N') {
//            toastr.error(response.Msg);
//            return false;
//        }
//        else {
//    Sub_DepartmentService.GetSubDepartmentrByCode(code).then(function (response) {
//            if (response && response.length > 0) {
//                $("#locateSubDepartment").hide();
//                $("#newCreateForm").show();

//                $('#Code').val(code);
//                BizSolHelperFunction.SelectOptionByText('txtDepartmentName', response[0].DepartmentName);
//                $('#txtSubDepartmentCode').val(response[0].Initials);
//                $('#txtSubDepartmentName').val(response[0].SubDepartmentName);
//                $('#txtShowInDailyAtt').val(response[0].ShowInDailyAtt);
//                $('#txtPrefix').val(response[0].Prefix);
//                $('#txtDeptStatus').val(response[0].IsActive);
//            }
//        })
//        }
//        .catch(function (error) {
//            toastr.error('Error fetching department types: ' + (error?.message || JSON.stringify(error)));
//        });
//}
async function EditDepartment(buttonElement, code, IsMode) {
    try {
        const item = JSON.parse(buttonElement.getAttribute('data-index'));
        const row = $(buttonElement).closest('tr');

        await DepartmentDropDown();

        const isReadOnly = (IsMode === 'Y');
        $('#newCreateForm input').prop('disabled', isReadOnly);
        $('#newCreateForm select').prop('disabled', isReadOnly);
        $('#saveDepartmentButton').prop('disabled', isReadOnly);

        const rightsResponse = await OrderEntryListService.CheckModuleOptionRight('Sub Department', 'EDIT', 'Y', CurrentFinYear);
        if (rightsResponse.CheckModuleOptionRight === 'N') {
            toastr.error(rightsResponse.Msg);
            return;
        }

        const deptResponse = await Sub_DepartmentService.GetSubDepartmentrByCode(code);
        if (deptResponse && deptResponse.length > 0) {
            const data = deptResponse[0];

            $("#locateSubDepartment").hide();
            $("#newCreateForm").show();

            $('#Code').val(code);
            BizSolHelperFunction.SelectOptionByText('txtDepartmentName', data.DepartmentName);
            $('#txtSubDepartmentCode').val(data.Initials);
            $('#txtSubDepartmentName').val(data.SubDepartmentName);
            $('#txtShowInDailyAtt').val(data.ShowInDailyAtt);
            $('#txtPrefix').val(data.Prefix);
            $('#txtDeptStatus').val(data.IsActive);
        }

    } catch (error) {
        console.error('EditDepartment error:', error);
        toastr.error('An error occurred: ' + (error?.message || 'Unknown error'));
    }
}

function DeleteDepartment(buttonElement, code) {
    const item = JSON.parse(buttonElement.getAttribute('data-index'));
    const row = $(buttonElement).closest('tr');

    OrderEntryListService.CheckModuleOptionRight('Sub Department', 'DELETE', 'Y', CurrentFinYear).then(function (response) {
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
function CloseModal_Sub_DepartmentDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_Sub_DepartmentDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }

    Sub_DepartmentService.DeleteSubDepartment(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_Sub_DepartmentDelete();
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
    var ReportType = "SubDepartmentReport";
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

//function BindSelect2FromDataList(element, arrayList, FirstItem, ddlwidth) {
//    element.empty();

//    if (FirstItem == 'FirstItemAll') {

//        element.append(new Option("All", "All"));
//    } else if (FirstItem == 'FirstItemZero') {

//        element.append(new Option("", "0"));
//    } else {

//    }


//    // Get the options from the datalist and append them to Select2
//    $.each(arrayList, function (index, item) {
//        // Append new option elements (key as value and value as text)
//        element.append(new Option(item.value, item.key));
//    });

//    // Trigger a change event to update Select2 UI
//    // element.trigger('change');

//    element.select2({
//        //// allowClear: true,
//        width: 'resolve',
//        matcher: function (params, data) {
//            // If there's no search term, return all data
//            if ($.trim(params.term) === '') {
//                return data;
//            }

//            // Match items that start with the search term
//            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
//                return data;
//            }

//            // Return null if no match
//            return null;
//        }
//    });
//}

window.Export = Export;
window.ListStatus_Sub_Department = ListStatus_Sub_Department;
window.CreateNew_Sub_Department = CreateNew_Sub_Department;
window.Department_Back = Department_Back;
window.submit_Sub_Department = submit_Sub_Department;
window.validateIntegerInput = validateIntegerInput;
window.EditDepartment = EditDepartment;
window.DeleteDepartment = DeleteDepartment;
window.SaveModal_Sub_DepartmentDelete = SaveModal_Sub_DepartmentDelete;
window.CloseModal_Sub_DepartmentDelete = CloseModal_Sub_DepartmentDelete;