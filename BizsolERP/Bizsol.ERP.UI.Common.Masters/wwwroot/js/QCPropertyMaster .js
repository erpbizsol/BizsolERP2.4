import { QCPropertyMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyMasterService.js';
import { QCPropertyGroupMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyGroupMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_Code = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetQCPropertyMasterTable();

    $('#btnDownload').click(function () {
        Export_QCPropertyMaster();
    });

    $(document).on('change', '#txtValueType', function () {
        HandleValueTypeChange();
    });

    SetupEnterKeyNavigation();
    PopulateValueTypeDropdown();
});

function SetupEnterKeyNavigation() {
    $('#txtQCGroup').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtPropertyName').focus();
        }
    });

    $('#txtPropertyName').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtSortOrderMaster').focus();
        }
    });

    $('#txtSortOrderMaster').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtValueType').focus();
        }
    });

    $('#txtValueType').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            var valueType = $(this).val();
            if (valueType === 'Lov' || valueType === 'LOV') {
                $('#txtLOVValue').focus();
            } else if (valueType === 'Numeric' || valueType === 'Decimal') {
                $('#txtMinValue').focus();
            } else {
                $('#txtDefaultValue').focus();
            }
        }
    });

    $('#txtLOVValue').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtMinValue').focus();
        }
    });

    $('#txtMinValue').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtMaxValue').focus();
        }
    });

    $('#txtMaxValue').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#txtDefaultValue').focus();
        }
    });

    $('#txtDefaultValue').on('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            $('#saveQCPropertyMasterButton').focus();
        }
    });
}

function GetQCPropertyMasterTable() {
    QCPropertyMasterService.QCPropertyMasterList().then(function (response) {
        $("#tblQCPropertyMaster").show();
        if (response.length > 0) {
            const StringFilterColumn = ["QC Group Name", "Property Name", "Value Type", "Lov Values", "Default Value", "Active"];
            const NumericFilterColumn = ["Sort Order", "Min Value","Max Value"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "QCPropertyGroupMaster_Code", "Verify"];
            const ColumnAlignment = {
                "Sort Order": "right",
                "Min Value": "right",
                "Max Value": "right", 'SNo': 'center;width:10px'
            };

            const updatedResponse = response.map(function (item) {
                let editButton = '<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="QCPropertyMaster_EditData(' + item.Code + ')"><i class="fa fa-pencil"></i></button>&nbsp;';
                let deleteButton = '<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteQCMaster(' + item.Code + ')"><i class="fa fa-remove"></i></button>&nbsp;';

                let verifyFlag = '';
                if (item.Verify !== undefined && item.Verify !== null) {
                    verifyFlag = item.Verify;
                } else if (item.isVerified !== undefined && item.isVerified !== null) {
                    verifyFlag = item.isVerified;
                } else if (item.Verified !== undefined && item.Verified !== null) {
                    verifyFlag = item.Verified;
                }

                let verifyButton = '';
                if (typeof verifyFlag === 'string' && verifyFlag.trim().toUpperCase() === 'N') {
                    verifyButton = '<button class="btn btn-success icon-height mb-1" title="Verify" onclick="Verify_QCPropertyMaster(' + item.Code + ')"><i class="fa fa-check"></i></button>&nbsp;';
                }

                let buttonsHTML = editButton + deleteButton + verifyButton;

                return Object.assign({}, item, {
                    Action: buttonsHTML
                });
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-QCPropertyMaster", "table-body-QCPropertyMaster", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error('No Data Found');
            $("#tblQCPropertyMaster").hide();
        }
    });
}
function GetQCPropertyMasterForDropdown() {
    return QCPropertyMasterService.GetQCPropertyGroupMasterForDropdown().then(function (response) {
        if (response && response.length > 0) {
            var QCPropertyGroupNameList = response.map(function (item) {
                var name = '';
                if (item.QCPropertyGroupName) {
                    name = item.QCPropertyGroupName;
                } else if (item.QCGroupName) {
                    name = item.QCGroupName;
                } else if (item.PropertyGroupName) {
                    name = item.PropertyGroupName;
                } else if (item.Desp) {
                    name = item.Desp;
                } else if (item.FieldValue) {
                    name = item.FieldValue;
                }
                return { Code: item.Code || 0, Desp: name };
            });
            BindSelectList1($('#txtQCGroup')[0], QCPropertyGroupNameList);

            if ($('#txtQCGroup').hasClass('select2-hidden-accessible')) {
                $('#txtQCGroup').select2('destroy');
            }
            $('#txtQCGroup').select2({
                width: '-webkit-fill-available'
            });
        } else {
            var html = '<option value="">Select</option>';
            $('#txtQCGroup').html(html);
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching QC Property Group list');
        var html = '<option value="">Select</option>';
        $('#txtQCGroup').html(html);
    });
}
function QCPropertyMaster_EditData(Code) {
    G_Code = Code;
    PopulateValueTypeDropdown();
    GetQCPropertyMasterForDropdown().then(function () {
        QCPropertyMasterService.GetQCPropertyMasterByCode(Code).then(function (response) {
            $('#locateQCPropertyMaster').hide();
            $('#newCreateFormQCPropertyMaster').show();
            $('#Code').val(Code);
            if (response && response.length > 0) {
                var row = response[0];
                var propertyName = '';
                var sortOrderValue = '';
                var valueType = '';
                var lovValue = '';
                var qcGroup = '';
                var minValue = '';
                var maxValue = '';
                var defaultValue = '';

                if (row.PropertyName) {
                    propertyName = row.PropertyName;
                } else if (row.propertyName) {
                    propertyName = row.propertyName;
                } else if (row.Desp) {
                    propertyName = row.Desp;
                } else if (row.FieldValue) {
                    propertyName = row.FieldValue;
                }

                $('#txtPropertyName').val(propertyName);

                if (row.SortOrder !== undefined && row.SortOrder !== null) {
                    sortOrderValue = row.SortOrder;
                } else if (row.sortOrder !== undefined && row.sortOrder !== null) {
                    sortOrderValue = row.sortOrder;
                } else if (row.SortOrderMaster !== undefined && row.SortOrderMaster !== null) {
                    sortOrderValue = row.SortOrderMaster;
                } else if (row.sortOrderMaster !== undefined && row.sortOrderMaster !== null) {
                    sortOrderValue = row.sortOrderMaster;
                }
                $('#txtSortOrderMaster').val(sortOrderValue);

                if (row.ValueType !== undefined && row.ValueType !== null) {
                    valueType = row.ValueType;
                } else if (row.valueType !== undefined && row.valueType !== null) {
                    valueType = row.valueType;
                }
                
                if (row.LOVValue !== undefined && row.LOVValue !== null) {
                    lovValue = row.LOVValue;
                } else if (row.lovValue !== undefined && row.lovValue !== null) {
                    lovValue = row.lovValue;
                } else if (row.LovValue !== undefined && row.LovValue !== null) {
                    lovValue = row.LovValue;
                } else if (row.LovValues !== undefined && row.LovValues !== null) {
                    lovValue = row.LovValues;
                } else if (row.lovValues !== undefined && row.lovValues !== null) {
                    lovValue = row.lovValues;
                } else if (row.LOVValues !== undefined && row.LOVValues !== null) {
                    lovValue = row.LOVValues;
                } else if (row.Lov_Values !== undefined && row.Lov_Values !== null) {
                    lovValue = row.Lov_Values;
                } else if (row.LOV_Values !== undefined && row.LOV_Values !== null) {
                    lovValue = row.LOV_Values;
                } else if (row.Lov_Value !== undefined && row.Lov_Value !== null) {
                    lovValue = row.Lov_Value;
                } else if (row.LOV_Value !== undefined && row.LOV_Value !== null) {
                    lovValue = row.LOV_Value;
                } else if (row.Desp !== undefined && row.Desp !== null && valueType && (valueType === 'Lov' || valueType === 'LOV')) {
                    lovValue = row.Desp;
                } else if (row.FieldValue !== undefined && row.FieldValue !== null && valueType && (valueType === 'Lov' || valueType === 'LOV')) {
                    lovValue = row.FieldValue;
                }

                if (valueType) {
                    var normalizedValueType = valueType;
                    if (normalizedValueType === 'LOV' || normalizedValueType === 'lov') {
                        normalizedValueType = 'Lov';
                    }
                    
                    $('#txtValueType').val(normalizedValueType);
                    HandleValueTypeChange();
                    
                    setTimeout(function () {
                        if (normalizedValueType === 'Lov' || normalizedValueType === 'LOV') {
                            if (lovValue) {
                                $('#txtLOVValue').val(lovValue);
                            }
                        } else if (normalizedValueType === 'Numeric' || normalizedValueType === 'Decimal') {
                            if (row.MinValue !== undefined && row.MinValue !== null) {
                                $('#txtMinValue').val(row.MinValue);
                            } else if (row.minValue !== undefined && row.minValue !== null) {
                                $('#txtMinValue').val(row.minValue);
                            }
                            if (row.MaxValue !== undefined && row.MaxValue !== null) {
                                $('#txtMaxValue').val(row.MaxValue);
                            } else if (row.maxValue !== undefined && row.maxValue !== null) {
                                $('#txtMaxValue').val(row.maxValue);
                            }
                        } else if (normalizedValueType === 'Text') {
                            if (row.DefaultValue !== undefined && row.DefaultValue !== null) {
                                $('#txtDefaultValue').val(row.DefaultValue);
                            } else if (row.defaultValue !== undefined && row.defaultValue !== null) {
                                $('#txtDefaultValue').val(row.defaultValue);
                            }
                        }
                    }, 200);
                } else {
                    $('#txtValueType').val('Numeric');
                    HandleValueTypeChange();
                }

                var qcGroupText = '';
                if (row.QCGroupName !== undefined && row.QCGroupName !== null) {
                    qcGroupText = row.QCGroupName;
                } else if (row.qcGroupName !== undefined && row.qcGroupName !== null) {
                    qcGroupText = row.qcGroupName;
                } else if (row.QCPropertyGroupName !== undefined && row.QCPropertyGroupName !== null) {
                    qcGroupText = row.QCPropertyGroupName;
                } else if (row.qcPropertyGroupName !== undefined && row.qcPropertyGroupName !== null) {
                    qcGroupText = row.qcPropertyGroupName;
                } else if (row.PropertyGroupName !== undefined && row.PropertyGroupName !== null) {
                    qcGroupText = row.PropertyGroupName;
                } else if (row.propertyGroupName !== undefined && row.propertyGroupName !== null) {
                    qcGroupText = row.propertyGroupName;
                } else if (row.Desp !== undefined && row.Desp !== null) {
                    qcGroupText = row.Desp;
                } else if (row.desp !== undefined && row.desp !== null) {
                    qcGroupText = row.desp;
                }

                var qcGroupCode = 0;
                if (row.QCPropertyGroupMaster_Code !== undefined && row.QCPropertyGroupMaster_Code !== null) {
                    qcGroupCode = row.QCPropertyGroupMaster_Code;
                } else if (row.qcPropertyGroupMaster_Code !== undefined && row.qcPropertyGroupMaster_Code !== null) {
                    qcGroupCode = row.qcPropertyGroupMaster_Code;
                } else if (row.QCPropertyGroupMasterCode !== undefined && row.QCPropertyGroupMasterCode !== null) {
                    qcGroupCode = row.QCPropertyGroupMasterCode;
                } else if (row.qcPropertyGroupMasterCode !== undefined && row.qcPropertyGroupMasterCode !== null) {
                    qcGroupCode = row.qcPropertyGroupMasterCode;
                } else if (row.QCGroup !== undefined && row.QCGroup !== null) {
                    qcGroupCode = row.QCGroup;
                } else if (row.qcGroup !== undefined && row.qcGroup !== null) {
                    qcGroupCode = row.qcGroup;
                } else if (row.QCGroupCode !== undefined && row.QCGroupCode !== null) {
                    qcGroupCode = row.QCGroupCode;
                } else if (row.qcGroupCode !== undefined && row.qcGroupCode !== null) {
                    qcGroupCode = row.qcGroupCode;
                }

                setTimeout(function () {
                    if (qcGroupText) {
                        BizSolHelperFunction.SelectOptionByText('txtQCGroup', qcGroupText);
                    } else if (qcGroupCode && qcGroupCode > 0) {
                        var $qcGroupSelect = $('#txtQCGroup');
                        $qcGroupSelect.val(qcGroupCode);
                        if ($qcGroupSelect.hasClass('select2-hidden-accessible')) {
                            $qcGroupSelect.trigger('change.select2');
                        } else {
                            $qcGroupSelect.trigger('change');
                        }
                    }
                }, 200);
            }
            setTimeout(function () {
                $('#txtQCGroup').focus();
            }, 500);
        });
    });
}

function submit_QCPropertyMaster() {
    let propertyName = $('#txtPropertyName').val();
    if (propertyName) {
        propertyName = propertyName.trim();
    }

    if (!propertyName) {
        toastr.warning('Please Fill The Property Name.');
        $('#txtPropertyName').focus();
        return;
    }

    let sortOrderText = $('#txtSortOrderMaster').val();
    if (!sortOrderText) {
        toastr.warning('Please Enter Sort Order.');
        $('#txtSortOrderMaster').focus();
        return;
    }

    let sortOrderNumber = parseFloat(sortOrderText);
    if (isNaN(sortOrderNumber)) {
        toastr.warning('Please Enter Valid Sort Order.');
        $('#txtSortOrderMaster').focus();
        return;
    }

    let valueType = $('#txtValueType').val();
    if (!valueType) {
        toastr.warning('Please Select Value Type.');
        $('#txtValueType').focus();
        return;
    }

    let lovValue = '';
    let minValueNumber = 0;
    let maxValueNumber = 0;
    let defaultValue = '';

    if (valueType === 'Lov' || valueType === 'LOV') {
        let lovValueText = $('#txtLOVValue').val();
        if (!lovValueText) {
            toastr.warning('Please Enter LOV Value.');
            $('#txtLOVValue').focus();
            return;
        }
        lovValueText = lovValueText.trim();
        if (!lovValueText) {
            toastr.warning('Please Enter LOV Value.');
            $('#txtLOVValue').focus();
            return;
        }
        lovValue = lovValueText;
    } else if (valueType === 'Numeric' || valueType === 'Decimal') {
        let minValueText = $('#txtMinValue').val();
        if (!minValueText) {
            toastr.warning('Please Enter Min Value.');
            $('#txtMinValue').focus();
            return;
        }
        minValueNumber = parseFloat(minValueText);
        if (isNaN(minValueNumber)) {
            toastr.warning('Please Enter Valid Min Value.');
            $('#txtMinValue').focus();
            return;
        }

        let maxValueText = $('#txtMaxValue').val();
        if (!maxValueText) {
            toastr.warning('Please Enter Max Value.');
            $('#txtMaxValue').focus();
            return;
        }
        maxValueNumber = parseFloat(maxValueText);
        if (isNaN(maxValueNumber)) {
            toastr.warning('Please Enter Valid Max Value.');
            $('#txtMaxValue').focus();
            return;
        }

        if (minValueNumber > maxValueNumber) {
            toastr.warning('Min Value cannot be greater than Max Value.');
            return;
        }
        if (maxValueNumber < minValueNumber) {
            toastr.warning('Max Value cannot be less than Min Value.');
            return;
        }
    } else if (valueType === 'Text') {
        let defaultValueText = $('#txtDefaultValue').val();
        if (defaultValueText) {
            defaultValue = defaultValueText.trim();
        }
    }

    let qcGroup = $('#txtQCGroup').val();
    if (!qcGroup) {
        toastr.warning('Please Select QC Group.');
        $('#txtQCGroup').focus();
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

    let qcGroupCode = 0;
    if (qcGroup) {
        qcGroupCode = Number(qcGroup);
        if (isNaN(qcGroupCode)) {
            qcGroupCode = 0;
        }
    }

    let payload = [{
        Code: masterCode,
        QCPropertyGroupMaster_Code: qcGroupCode,
        PropertyName: propertyName,
        SortOrder: sortOrderNumber,
        ValueType: valueType,
        LovValues: lovValue,
        MinValue: minValueNumber,
        MaxValue: maxValueNumber,
        DefaultValue: defaultValue,
        Verify: 'Y',
        CreatedBy: userCode
    }];

    QCPropertyMasterService.SaveQCPropertyMaster(JSON.stringify(payload))
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#txtPropertyName').val('');
                $('#txtSortOrderMaster').val('');
                $('#txtValueType').val('');
                $('#txtLOVValue').val('');
                $('#txtQCGroup').val('');
                $('#txtMinValue').val('');
                $('#txtMaxValue').val('');
                $('#txtDefaultValue').val('');
                $('#Code').val('0');
                HandleValueTypeChange();
                QCPropertyMaster_Back();
                GetQCPropertyMasterTable();
                G_Code = 0;
            }
            else if (response.Status === 'N') {
                toastr.warning(response.Msg);
            }
        });
}
function DeleteQCMaster(Code) {
    if (!Code) {
        return;
    }

    $('#myModal').data('code', Code);
    $('#myModal').modal({
        backdrop: 'static',
    });

    $('#myModal').modal('show');
}

function CloseModal_QCPropertyMasterDelete() {
    $('#myModal').modal('hide');
    $('#reasonForDeleteInput').val('');

}
function SaveModal_QCPropertyMasterDelete() {
    let reasonForDelete = $('#reasonForDeleteInput').val();
    let code = $('#myModal').data('code');

    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        $('#reasonForDeleteInput').focus();
        return;
    }

    QCPropertyMasterService.DeleteQCPropertyMaster(code, reasonForDelete).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseModal_QCPropertyMasterDelete();
            GetQCPropertyMasterTable();
        } else {
            toastr.warning(response.Msg || 'Error during deletion');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error during QCPropertyMaster delete');
    });
}
function Verify_QCPropertyMaster(Code) {
    if (!Code) {
        return;
    }

    QCPropertyMasterService.VerifyQCPropertyMaster(Code).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Verified successfully.');
            GetQCPropertyMasterTable();
        } else if (response && response.Status === 'N') {
            toastr.warning(response.Msg || 'Verification failed.');
        } else {
            toastr.warning('Unexpected response during verification.');
        }
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error during verification.');
    });
}

function CreateNew_QCPropertyMaster() {
    $('#Code').val('0');
    $('#txtPropertyName').val('');
    $('#txtSortOrderMaster').val('');
    $('#txtLOVValue').val('');
    $('#txtQCGroup').val('');
    $('#txtMinValue').val('');
    $('#txtMaxValue').val('');
    $('#txtDefaultValue').val('');
    $('#locateQCPropertyMaster').hide();
    $('#newCreateFormQCPropertyMaster').show();
    $('#txtValueType').val('Numeric');
    PopulateValueTypeDropdown();
    GetQCPropertyMasterForDropdown();
    setTimeout(function () {
        $('#txtQCGroup').focus();
    }, 300);
}

function QCPropertyMaster_Back() {
    $('#newCreateFormQCPropertyMaster').hide();
    $('#locateQCPropertyMaster').show();
}

function QCPropertyMaster_validateSortOrder(input) {
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

function QCPropertyMaster_validateDecimal(input) {
    var value = '';
    if (input && input.value) {
        value = input.value;
    }

    var valueType = $('#txtValueType').val();
    
    if (valueType === 'Numeric') {
        value = value.replace(/[^0-9]/g, '');
    } else if (valueType === 'Decimal') {
        value = value.replace(/[^0-9.]/g, '');
        
        var parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts[1];
            parts = value.split('.');
        }

        if (parts[1] && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
    } else {
        value = value.replace(/[^0-9.]/g, '');
        
        var parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts[1];
            parts = value.split('.');
        }

        if (parts[1] && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
    }

    input.value = value;
}

function QCPropertyMaster_validateMinMax() {
    var minValueText = $('#txtMinValue').val();
    var maxValueText = $('#txtMaxValue').val();
    
    if (minValueText && maxValueText) {
        var minValue = parseFloat(minValueText);
        var maxValue = parseFloat(maxValueText);
        
        if (!isNaN(minValue) && !isNaN(maxValue)) {
            if (minValue > maxValue) {
                toastr.warning('Min Value cannot be greater than Max Value.');
                //$('#txtMinValue').focus();
                return false;
            }
            if (maxValue < minValue) {
                toastr.warning('Max Value cannot be less than Min Value.');
                //$('#txtMaxValue').focus();
                return false;
            }
        }
    }
    return true;
}

function HandleValueTypeChange() {
    var valueType = $('#txtValueType').val();
    
    if (valueType === 'Text') {
        $('#txtLOVValue').closest('div[class*="col-md"]').hide();
        $('#txtMinValue').closest('div[class*="col-md"]').hide();
        $('#txtMaxValue').closest('div[class*="col-md"]').hide();
        $('#txtLOVValue').val('').removeAttr('required');
        $('#txtMinValue').val('').removeAttr('required');
        $('#txtMaxValue').val('').removeAttr('required');
        $('#txtDefaultValue').closest('div[class*="col-md"]').show();
        $('#txtDefaultValue').attr('required', 'required');
    } else if (valueType === 'Numeric' || valueType === 'Decimal') {
        $('#txtLOVValue').closest('div[class*="col-md"]').hide();
        $('#txtDefaultValue').closest('div[class*="col-md"]').hide();
        $('#txtLOVValue').val('').removeAttr('required');
        $('#txtDefaultValue').val('').removeAttr('required');
        $('#txtMinValue').closest('div[class*="col-md"]').show();
        $('#txtMaxValue').closest('div[class*="col-md"]').show();
        $('#txtMinValue').attr('required', 'required');
        $('#txtMaxValue').attr('required', 'required');
        
        if (valueType === 'Numeric') {
            var minValue = $('#txtMinValue').val();
            var maxValue = $('#txtMaxValue').val();
            if (minValue && minValue.indexOf('.') !== -1) {
                $('#txtMinValue').val(minValue.split('.')[0]);
            }
            if (maxValue && maxValue.indexOf('.') !== -1) {
                $('#txtMaxValue').val(maxValue.split('.')[0]);
            }
        }
    } else if (valueType === 'Lov' || valueType === 'LOV') {
        $('#txtMinValue').closest('div[class*="col-md"]').hide();
        $('#txtMaxValue').closest('div[class*="col-md"]').hide();
        $('#txtDefaultValue').closest('div[class*="col-md"]').hide();
        $('#txtMinValue').val('').removeAttr('required');
        $('#txtMaxValue').val('').removeAttr('required');
        $('#txtDefaultValue').val('').removeAttr('required');
        $('#txtLOVValue').closest('div[class*="col-md"]').show();
        $('#txtLOVValue').attr('required', 'required');
    } else {
        $('#txtLOVValue').closest('div[class*="col-md"]').show();
        $('#txtMinValue').closest('div[class*="col-md"]').show();
        $('#txtMaxValue').closest('div[class*="col-md"]').show();
        $('#txtDefaultValue').closest('div[class*="col-md"]').show();
        $('#txtLOVValue').attr('required', 'required');
        $('#txtMinValue').attr('required', 'required');
        $('#txtMaxValue').attr('required', 'required');
        $('#txtDefaultValue').attr('required', 'required');
    }
}

function PopulateValueTypeDropdown() {
    HandleValueTypeChange();
}

function PopulateQCGroupDropdown() {
    return QCPropertyGroupMasterService.QCPropertyGroupMasterList().then(function (response) {
        var html = '<option value="">Select</option>';
        if (response && response.length > 0) {
            for (var i = 0; i < response.length; i++) {
                var item = response[i];
                var code = item.Code || 0;
                var name = '';
                if (item.QCGroupName) {
                    name = item.QCGroupName;
                } else if (item.QCPropertyGroupName) {
                    name = item.QCPropertyGroupName;
                } else if (item.PropertyGroupName) {
                    name = item.PropertyGroupName;
                } else if (item.Desp) {
                    name = item.Desp;
                } else if (item.FieldValue) {
                    name = item.FieldValue;
                }
                html += '<option value="' + code + '">' + name + '</option>';
            }
        }
        $('#txtQCGroup').html(html);
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error loading QC Group list');
    });
}

function Export_QCPropertyMaster() {
    var tableId = "QCPropertyMaster";
    var bodyId = "table-body-QCPropertyMaster";
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

    var ReportType = "QCPropertyMaster";
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
function BindSelectList1(element, list) {
    let option = '<option value="">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.GetQCPropertyMasterTable = GetQCPropertyMasterTable;
window.QCPropertyMaster_EditData = QCPropertyMaster_EditData;
window.CreateNew_QCPropertyMaster = CreateNew_QCPropertyMaster;
window.submit_QCPropertyMaster = submit_QCPropertyMaster;
window.QCPropertyMaster_Back = QCPropertyMaster_Back;
window.Verify_QCPropertyMaster = Verify_QCPropertyMaster;
window.QCPropertyMaster_validateSortOrder = QCPropertyMaster_validateSortOrder;
window.QCPropertyMaster_validateDecimal = QCPropertyMaster_validateDecimal;
window.QCPropertyMaster_validateMinMax = QCPropertyMaster_validateMinMax;
window.HandleValueTypeChange = HandleValueTypeChange;
window.DeleteQCMaster = DeleteQCMaster;
window.SaveModal_QCPropertyMasterDelete = SaveModal_QCPropertyMasterDelete;
window.CloseModal_QCPropertyMasterDelete = CloseModal_QCPropertyMasterDelete;