import { QCPropertyTestTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyTestTypeMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

let G_Code = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetQCPropertyTestTypeMasterTable();

    $('#btnDownload').click(function () {
        Export_QCPropertyTestTypeMaster();
    });

    SetupEnterKeyNavigation();
});
function SetupEnterKeyNavigation() {
    $('#txtTestType').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtSortOrder').focus();
        }
    });

    $('#txtSortOrder').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#chkActive').focus();
        }
    });

    $('#chkActive').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $(this).prop('checked', !$(this).prop('checked'));
            $('#saveQCPropertyTestTypeMasterButton').focus();
        }
    });
}
function GetQCPropertyTestTypeMasterTable() {
    QCPropertyTestTypeMasterService.QCPropertyTestTypeMasterList().then(function (response) {
        $("#tblQCPropertyTestTypeMaster").show();
        if (response.length > 0) {
            const StringFilterColumn = ["Test Type", "Active"];
            const NumericFilterColumn = ["Sort Order"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = { 'Sort Order': "right", 'SNo': 'center;width:10px' };

            const updatedResponse = response.map(function (item) {
                let editButton = '<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="QCPropertyTestTypeMaster_EditData(' + item.Code + ')"><i class="fa fa-pencil"></i></button>&nbsp;';
                let deleteButton = '<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteQCPropertyTestTypeMaster(' + item.Code + ')"><i class="fa fa-remove"></i></button>&nbsp;';

                let buttonsHTML = editButton + deleteButton ;

                return Object.assign({}, item, {
                    Action: buttonsHTML
                });
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-QCPropertyTestTypeMaster", "table-body-QCPropertyTestTypeMaster", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error('No Data Found');
            $("#tblQCPropertyTestTypeMaster").hide();
        }
    });
}

function QCPropertyTestTypeMaster_EditData(Code) {
    var ModuleName = "QC Property Test Type Master",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
    G_Code = Code;
    QCPropertyTestTypeMasterService.GetQCPropertyTestTypeMasterByCode(Code).then(function (response) {
        $('#locateQCPropertyTestTypeMaster').hide();
        $('#newCreateFormQCPropertyTestTypeMaster').show();
        $('#Code').val(Code);
        if (response && response.length > 0) {
            var row = response[0];
            var despValue = '';
            var activeFlag = '';
            var sortOrderValue = '';

            if (row.TestType) {
                despValue = row.TestType;
            } else if (row.QCPropertyTestTypeMasterName) {
                despValue = row.QCPropertyTestTypeMasterName;
            } else if (row.QCPropertyGroupName) {
                despValue = row.QCPropertyGroupName;
            } else if (row.PropertyGroupName) {
                despValue = row.PropertyGroupName;
            } else if (row.Desp) {
                despValue = row.Desp;
            } else if (row.FieldValue) {
                despValue = row.FieldValue;
            }

            $('#txtTestType').val(despValue);

            if (row.SortOrder !== undefined && row.SortOrder !== null) {
                sortOrderValue = row.SortOrder;
            } else if (row.sortOrder !== undefined && row.sortOrder !== null) {
                sortOrderValue = row.sortOrder;
            }
            
            if (sortOrderValue !== '' && sortOrderValue !== null && sortOrderValue !== undefined) {
                var numValue = parseFloat(sortOrderValue);
                if (!isNaN(numValue)) {
                    sortOrderValue = numValue.toFixed(1);
                }
            }
            $('#txtSortOrder').val(sortOrderValue);

            if (row.IsActive !== undefined && row.IsActive !== null) {
                activeFlag = row.IsActive;
            } else if (row.isActive !== undefined && row.isActive !== null) {
                activeFlag = row.isActive;
            } else if (row.Active !== undefined && row.Active !== null) {
                activeFlag = row.Active;
            } else if (row.Status !== undefined && row.Status !== null) {
                activeFlag = row.Status;
            }

            var isChecked = false;
            if (typeof activeFlag === 'string') {
                var upperFlag = activeFlag.trim().toUpperCase();
                isChecked = upperFlag === 'Y' || upperFlag === 'YES' || upperFlag === 'TRUE' || upperFlag === '1';
            } else if (typeof activeFlag === 'number') {
                isChecked = activeFlag === 1;
            } else if (typeof activeFlag === 'boolean') {
                isChecked = activeFlag;
            }

            $('#chkActive').prop('checked', isChecked);
        }
        setTimeout(function () {
            $('#txtQCGroupName').focus();
        }, 100);
    });
            
        }
    });
}

function submit_QCPropertyTestTypeMaster() {
    let FieldValue = $('#txtTestType').val();
    if (FieldValue) {
        FieldValue = FieldValue.trim();
    }

    if (!FieldValue) {
        toastr.warning('Please Fill The Test Type.');
        $('#txtTestType').focus();
        return;
    }

    let sortOrderText = $('#txtSortOrder').val();
    if (!sortOrderText) {
        toastr.warning('Please Enter Sort Order.');
        $('#txtSortOrder').focus();
        return;
    }

    let sortOrderNumber = parseFloat(sortOrderText);
    if (isNaN(sortOrderNumber)) {
        toastr.warning('Please Enter Valid Sort Order.');
        $('#txtSortOrder').focus();
        return;
    }

    let userCode = 0;
    try {
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        if (authKeyData && authKeyData.UserMaster_Code) {
            userCode = authKeyData.UserMaster_Code;
        }
    } catch (e) {
    }

    let codeValue = $('#Code').val();
    let masterCode = 0;
    if (codeValue) {
        masterCode = Number(codeValue);
        if (isNaN(masterCode)) {
            masterCode = 0;
        }
    }

    let isActive = $('#chkActive').is(':checked') ? 'Y' : 'N';

    let payload = [{
        Code: masterCode,
        TestType: FieldValue,
        sortOrder: sortOrderNumber,
        isActive: isActive,
        userMaster_Code: userCode
    }];

    QCPropertyTestTypeMasterService.SaveQCPropertyTestTypeMaster(JSON.stringify(payload))
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#txtTestType').val('');
                $('#txtSortOrder').val('');
                $('#chkActive').prop('checked', true);
                $('#Code').val('0');
                QCPropertyTestTypeMaster_Back();
                GetQCPropertyTestTypeMasterTable();
                G_Code = 0;
            }
            else if (response.Status === 'N') {
                toastr.warning(response.Msg);
            }
        });
}
function DeleteQCPropertyTestTypeMaster(Code) {
    if (!Code) {
        return;
    }

    var ModuleName = "QC Property Test Type Master",
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
    $('#myModal').data('code', Code);
    $('#myModal').modal({
        backdrop: 'static',
    });

    $('#myModal').modal('show');
        }
    });
}

function CloseModal_QCPropertyTestTypeMasterDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_QCPropertyTestTypeMasterDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        $('#reasonForDeleteInput').focus();
        return;
    }

    QCPropertyTestTypeMasterService.DeleteQCPropertyTestTypeMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_QCPropertyTestTypeMasterDelete();
            GetQCPropertyTestTypeMasterTable();
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during QCPropertyTestTypeMaster delete');
    });
}
function Verify_QCPropertyTestTypeMaster(Code) {
    if (!Code) {
        return;
    }

    QCPropertyTestTypeMasterService.VerifyQCPropertyTestTypeMaster(Code).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Verified successfully.');
            GetQCPropertyTestTypeMasterTable();
        } else if (response && response.Status === 'N') {
            toastr.warning(response.Msg || 'Verification failed.');
        } else {
            toastr.warning('Unexpected response during verification.');
        }
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error during verification.');
    });
}

function CreateNew_QCPropertyTestTypeMaster() {
    var ModuleName = "QC Property Test Type Master",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
    $('#Code').val('0');
    $('#txtTestType').val('');
    $('#txtSortOrder').val('');
    $('#chkActive').prop('checked', true);
    $('#locateQCPropertyTestTypeMaster').hide();
    $('#newCreateFormQCPropertyTestTypeMaster').show();
        }
    });
}

function QCPropertyTestTypeMaster_Back() {
    $('#newCreateFormQCPropertyTestTypeMaster').hide();
    $('#locateQCPropertyTestTypeMaster').show();
}

function QCPropertyTestTypeMaster_validateSortOrder(input) {
    var value = '';
    if (input && input.value) {
        value = input.value;
    }

    value = value.replace(/[^0-9.]/g, '');

    var parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
        parts = value.split('.');
    }

    if (parts[1] && parts[1].length > 1) {
        value = parts[0] + '.' + parts[1].slice(0, 1);
    }

    if (value.length > 8) {
        value = value.slice(0, 8);
    }

    input.value = value;
}

function Export_QCPropertyTestTypeMaster() {
    var tableId = "QCPropertyTestTypeMaster";
    var bodyId = "table-body-QCPropertyTestTypeMaster";
    var filteredData = window[`filteredData_${tableId}`];
    
    if (!filteredData || filteredData.length === 0) {
        toastr.warning('No data available to export.');
        return;
    }

    var hiddenColumns = window[`hiddenColumns_${bodyId}`] || [];
    var columns = Object.keys(filteredData[0]).filter(function(col) {
        return hiddenColumns.indexOf(col) === -1 && col !== 'Action';
    });

    var tempTable = $('<table id="tempExportTable" style="display:none;"></table>');
    var thead = $('<thead></thead>');
    var headerRow = $('<tr></tr>');
    
    columns.forEach(function(col) {
        headerRow.append($('<th></th>').text(col));
    });
    
    thead.append(headerRow);
    tempTable.append(thead);

    var tbody = $('<tbody></tbody>');
    filteredData.forEach(function(item) {
        var row = $('<tr></tr>');
        columns.forEach(function(col) {
            var cellValue = item[col] !== undefined && item[col] !== null ? item[col] : '';
            if (typeof cellValue === 'string' && cellValue.indexOf('<') !== -1) {
                var tempDiv = $('<div></div>').html(cellValue);
                cellValue = tempDiv.text() || tempDiv.val() || '';
            }
            row.append($('<td></td>').text(cellValue));
        });
        tbody.append(row);
    });
    
    tempTable.append(tbody);
    $('body').append(tempTable);

    var ReportType = "QCPropertyTestTypeMaster";
    var currentDate = new Date();
    var year = currentDate.getFullYear();
    var month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    var day = currentDate.getDate().toString().padStart(2, "0");
    var hours = currentDate.getHours().toString().padStart(2, "0");
    var minutes = currentDate.getMinutes().toString().padStart(2, "0");
    var seconds = currentDate.getSeconds().toString().padStart(2, "0");
    var dateString = year + "-" + month + "-" + day + "_" + hours + "-" + minutes + "-" + seconds;

    $("#tempExportTable").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });

    tempTable.remove();
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}

window.GetQCPropertyTestTypeMasterTable = GetQCPropertyTestTypeMasterTable;
window.QCPropertyTestTypeMaster_EditData = QCPropertyTestTypeMaster_EditData;
window.CreateNew_QCPropertyTestTypeMaster = CreateNew_QCPropertyTestTypeMaster;
window.submit_QCPropertyTestTypeMaster = submit_QCPropertyTestTypeMaster;
window.QCPropertyTestTypeMaster_Back = QCPropertyTestTypeMaster_Back;
window.Verify_QCPropertyTestTypeMaster = Verify_QCPropertyTestTypeMaster;
window.QCPropertyTestTypeMaster_validateSortOrder = QCPropertyTestTypeMaster_validateSortOrder;
window.DeleteQCPropertyTestTypeMaster = DeleteQCPropertyTestTypeMaster;
window.SaveModal_QCPropertyTestTypeMasterDelete = SaveModal_QCPropertyTestTypeMasterDelete;
window.CloseModal_QCPropertyTestTypeMasterDelete = CloseModal_QCPropertyTestTypeMasterDelete;