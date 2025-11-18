import { RMStockService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RMStockService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_today = '';
let G_FromDateValue = '';
let G_FromDateValueSlitted = '';
let G_FromDateValueJobWork = '';
let G_FromDateSlittedCoilStockValue = '';
let G_ToDateValue = '';
let G_ToDateValueSlitted = '';
let G_ToDateValueJobWork = '';
let G_ToDateSlittedCoilStockValue = '';
let G_IdentificationNo = '';
let G_Code = 0;
let G_SNo = 0;
let G_Width = 0;
let G_selectWidth = 0;
let G_SlittingPlanMaster_Code = 0;
let G_AppendedRowKeys = {};

function applyAllowManualWeightState() {
    const AllowManualWeight = $('#AllowManualWeight').is(':checked');
    if (AllowManualWeight) {
        $('.txtWeightPerSlitRow').prop('disabled', false).removeClass('bg-light');
    } else {
        $('.txtWeightPerSlitRow').prop('disabled', true).addClass('bg-light');
    }
}

$(document).ready(function () {
    let isInitialLoad = true;
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
   
    $('#current-stock').show();
    $('#unApproved-planned').hide();
    $('#dispatch').hide();
    $('#slitted').hide();
    $('#job-work').hide();
    $('#stock-summary').hide();
    $('#slitted-coil-stock').hide();
    GetRMStockCurrentListTable();
    $('#exampleCheck').on("click", function () {
        GetRMStockCurrentListTable();
        GetUnApprovedPlannedList();
    });

    $('#RMStockCurrentPlanned').on('change', '.ddlSlitWidthRow', function () {
        var $row = $(this).closest('tr');
        var rowId = $row.attr('id');

        if ($('#PartingCase').is(':checked')) {
            calculateWeightPerSlit(rowId);
        } else {
            var $no = $row.find('.txtNoOfSlitsRow');
            var $wps = $row.find('.txtWeightPerSlitRow');
            var $tw = $row.find('.txtTotalWeightRow');
            $no.val(0);
            $wps.val(0);
            $tw.val(0);
            GetRMStockNumericValueWidthForRow(rowId);
        }
        updateTableTotals();
    });

    $('#AllowManualWeight').off('change').on('change', function () {
        applyAllowManualWeightState();
    });
    $('#CopyFromPrevious').off('change').on('change', function () {
        if ($(this).is(':checked')) {
            copyFromPrevious();
        }
    });
    $('#RMStockCurrentPlanned tbody').on('input', '.txtNoOfSlitsRow, .txtWeightPerSlitRow', function () {
        var row = $(this).closest('tr');
        var n = parseFloat(row.find('input.txtNoOfSlitsRow').val()) || 0;
        var w = parseFloat(row.find('input.txtWeightPerSlitRow').val()) || 0;
        var t = n * w;
        row.find('input.txtTotalWeightRow').val(t.toFixed(3));
        updateTableTotals();
    });
    $('#txtNoOfSlits, #txtWeightPerSlit').on('input', function () {
        calculateTotalWeight();
    });

    $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        var targetTab = $(e.target).attr('data-bs-target');
        loadTabData(targetTab);
    });

    $('#btnDownload').click(function () {
        Export();
    });
});


function setCurrentDate() {
    G_today = new Date().toISOString().split('T')[0];
    $('#txtDate').val(G_today);
}
function GetRMStockCurrentListTable() {
    Showloader();
    RMStockService.GetRMStockCurrentList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblRMStockCurrent').show();
            const stringFilterColumn = ["Invoice No", "Item Name", "Vendor", "Brand", "Ch Wt", "Thickness", "Grade", "Make", "Width", "Ac Wt", "Warehouse", "Remarks", "IdentificationNo","Grade"];
            const numericFilterColumn = ["MRN No", "Qty MT","Qty PC","Qty MTRS"];
            const dateFilterColumn = ["Receive Date","Invoice Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            if ($('#exampleCheck').is(':checked')) {
                hiddenColumns = ["Code", "Numeric Value","IsPlanned","Size"];
            } else {
                hiddenColumns = ["Code", "Numeric Value", "% E", "Hardness", "UTS", "YST", "BEND TEST", "IsPlanned", "Size"];
            }
            const columnAlignment = {
                'Invoice Date': 'center', 'Receive Date': 'center', 'Thickness': 'right', 'Ch Wt': 'right', 'Width': 'right;min-width:60px','Ac Wt': 'right',
                'Qty MT': 'right', 'Qty PC': 'right', 'Qty MTRS': 'right', '% E': 'right;min-width:50px', 'Hardness': 'right', 'UTS': 'right;min-width:70px', 'YST': 'right;min-width:70px',
                
            };
            const updatedResponse = response.map((item, index) => {
                const buttonText = item.IsPlanned ? "Planned" : "Plan";
                const buttonClass = item.IsPlanned ? "btn btn-success" : "btn btn-primary";

                let PlannedButtonInputHTML = `<button type="button" class="${buttonClass} btn-height" title="Planned Button" onclick='ShowModelPlanned(${JSON.stringify(item)})' style="width: 70px;">${buttonText}</button>`;

                return {
                    ...item,
                    'Planned Button': PlannedButtonInputHTML,
                };
            });
            calculateRMStockCurrentFooterTotals(response);
            BizsolCustomFilterGrid.CreateDataTable("table-header-RMStockCurrent", "table-body-RMStockCurrent", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment,false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblRMStockCurrent').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during RMStockCurrent');
            $('#tblRMStockCurrent').hide();
        });
}
function calculateRMStockCurrentFooterTotals(rows) {
    try {
        let totalChWt = 0;
        let totalAcWt = 0;
        const rowCount = Array.isArray(rows) ? rows.length : 0;
        if (rows && rows.length) {
            rows.forEach(function(r){
                totalChWt += parseFloat(r['Ch Wt']) || 0;
                totalAcWt += parseFloat(r['Ac Wt']) || 0;
            });
        }
        const $rowCountCell = $('#RowCountValue');
        if ($rowCountCell.length) {
            $rowCountCell.text('Count:' + rowCount);
        } else {
            const $footerFirstTh = $('#RMStockCurrent tfoot th').first();
            if ($footerFirstTh.length) {
                $footerFirstTh.text('Totals (' + rowCount + ')');
            }
        }
        if ($('#totalChWt').length) {
            $('#totalChWt').text(totalChWt.toFixed(3));
        }
        if ($('#totalAcWt').length) {
            $('#totalAcWt').text(totalAcWt.toFixed(3));
        }
    } catch(e) {
    }
}
function ShowModelPlanned(rowData) {
    $('#txtIdentificationNo').val(rowData.IdentificationNo);
    $('#txtWidth').val(rowData?.['Ac Wt']);
    $('#despSize').text(rowData.Size);
    G_IdentificationNo = rowData.IdentificationNo;
    G_Width = rowData?.['Numeric Value'];
    clearForm();
    //enableNewRowAddition();
    //$('#PlannedMyModal').data('IdentificationNo', G_IdentificationNo);
    $('#PlannedMyModal').modal({
        backdrop: 'static',
    });
    $('#PlannedMyModal').modal('show');
    ShowRMStockPlan();
    //GetRMStockWidthList();
    //GetRMStockItemNameList();
    GetRMStockMachineNoList();
    setCurrentDate();
    updateTableTotals();
     
}
function ShowRMStockPlan() {
    RMStockService.ShowRMStockData(G_IdentificationNo).then(function (response) {
        fillTableWithExistingData(response);
        setTimeout(function() {
            updateTableTotals();
            applyAllowManualWeightState();
        }, 100);
    });
}

function fillTableWithExistingData(response) {
    Promise.all([GetRMStockItemNameList(), GetRMStockWidthList()])
        .then(function ([itemNameList, widthList])
        {
    var tbody = $('#RMStockCurrentPlanned tbody');
    tbody.empty();
    
        if (response.length > 0) {
            G_AppendedRowKeys = {};
            G_SlittingPlanMaster_Code = response[0].Code;
            response.forEach(function (item, index) {
                var itemNameText = item.ItemName || '';
                var slitWidthText = item.Desp || '';
                var noOfSlitsVal = item.NoofSlits || 0;
                var weightVal = item.Weight || 0;
                var weightPerSlitVal = noOfSlitsVal ? (weightVal / noOfSlitsVal) : 0;
                BizSolHelperFunction.SelectOptionByText('ddlMachineNo', item.MachineNo);

                var rowId = (item.SNo);
                var rowKey = [itemNameText, slitWidthText, noOfSlitsVal, weightVal].join('|');
                G_AppendedRowKeys[rowKey] = true;

                var interactiveRow = `
                    <tr id="${rowId}" data-detail-code="${item.SNo || 0}" data-master-code="${item.Code || 0}">
                        <td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
                        <td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
                        <td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" oninput="validateIntegerInput(this)" autocomplete="off" required /></td>
                        <td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" oninput="validateDecimalRateInput(this)" autocomplete="off" required disabled /></td>
                        <td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly /></td>
                        <td>
                            <button type="button" class="btn btn-success btn-height" onclick='Save_PlannedSlitting(${rowId})' title="Edit" data-row-id="${rowId}"><i class="fas fa-pencil"></i></button>
                    <button type="button" onclick="deleteRow(this,${item.SNo},${item.Code})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
                tbody.append(interactiveRow);

                var $row = $('#' + rowId);

                BindSelectList1($row.find('select.ddlItemNameRow')[0], itemNameList);
                BindSelectList1($row.find('select.ddlSlitWidthRow')[0], widthList);
                
                BizSolHelperFunction.SelectOptionByText(`ddlItemName_${rowId}`, itemNameText);
                BizSolHelperFunction.SelectOptionByText(`ddlSlitWidth_${rowId}`, slitWidthText);

                $row.find('input.txtNoOfSlitsRow').val(noOfSlitsVal);
                $row.find('input.txtWeightPerSlitRow').val(weightPerSlitVal.toFixed(3));
                $row.find('input.txtTotalWeightRow').val(weightVal);
            });
            if ($('.ddlItemNameRow').length) {
                $('.ddlItemNameRow').select2({
                    dropdownParent: $('#PlannedMyModal'),
                    width: '-webkit-fill-available'
                });
            }
            if ($('.ddlSlitWidthRow').length) {
                $('.ddlSlitWidthRow').select2({
                    dropdownParent: $('#PlannedMyModal'),
                    width: '-webkit-fill-available'
                });
            }
            enableNewRowAddition();
            applyAllowManualWeightState();
        } else {
            enableNewRowAddition();
            G_SlittingPlanMaster_Code = 0;
            applyAllowManualWeightState();
        }
    });
}


function enableNewRowAddition() {
    const $tbody = $('#RMStockCurrentPlanned tbody');
    const rowId = 0;

    const newRowHtml = `
        <tr id="${rowId}" data-detail-code="0" data-master-code="${G_SlittingPlanMaster_Code || 0}">
            <td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
            <td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
            <td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" oninput="validateIntegerInput(this)" autocomplete="off" required /></td>
            <td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" oninput="validateDecimalRateInput(this)" autocomplete="off" required disabled /></td>
            <td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly /></td>
            <td>
                <button type="button" onclick="Save_PlannedSlitting(${rowId})" title="Save" class="btn btn-success btn-height"><i class="fas fa-save"></i></button>
            </td>
        </tr>
    `;

    $tbody.append(newRowHtml);
    const $row = $('#' + rowId);
    const $ddlItem = $row.find('select.ddlItemNameRow');
    const $ddlWidth = $row.find('select.ddlSlitWidthRow');
    
    $ddlItem.html($('#ddlItemName').html());
    $ddlWidth.html($('#ddlSlitWidth').html());
    $ddlItem.trigger('change');
    $ddlWidth.trigger('change');

    GetRMStockItemNameList().then(function (itemNameList) {
        BindSelectList1($row.find('select.ddlItemNameRow')[0], itemNameList);
        if ($('.ddlItemNameRow').length) {
            $('.ddlItemNameRow').select2({
                dropdownParent: $('#PlannedMyModal'),
                width: '-webkit-fill-available'
            });
        }
    });
    GetRMStockWidthList().then(function (slitWidthList) {
        BindSelectList1($row.find('select.ddlSlitWidthRow')[0], slitWidthList);
        if ($('.ddlSlitWidthRow').length) {
            $('.ddlSlitWidthRow').select2({
                dropdownParent: $('#PlannedMyModal'),
                width: '-webkit-fill-available'
            });
        }
        applyAllowManualWeightState();
    });
}

//function GetRMStockItemNameList() {
//    Showloader();
//    RMStockService.GetRMStockItemName().then(function (response) {
//        if (response && response.length > 0) {
//            HideLoader();
//            const list = response.map((item) => ({ Code: item.Code, Desp: item.ItemName }));

//            //if ($('#ddlItemName').length) {
//            //    BindSelectList1($('#ddlItemName')[0], list);
//            //    $('#ddlItemName').select2({
//            //        dropdownParent: $('#PlannedMyModal'),
//            //        width: '-webkit-fill-available'
//            //    });
//            //}

//            $('.ddlItemNameRow').each(function () {
//                BindSelectList1(this, list);

//            });
//            if ($('.ddlItemNameRow').length) {
//                $('.ddlItemNameRow').select2({
//                    dropdownParent: $('#PlannedMyModal'),
//                    width: '-webkit-fill-available'
//                });
//            }
//        } else {
//            toastr.error('No data received or empty response');
//            HideLoader();
//        }
//    }).catch(function (error) {
//        toastr.error('Error fetching user list:', error);
//        HideLoader();
//    });
//}

function GetRMStockItemNameList() {
    Showloader();
    return RMStockService.GetRMStockItemName().then(function (response) {
            HideLoader();
            if (response && response.length > 0) {
                const list = response.map((item) => ({ Code: item.Code, Desp: item.ItemName }));
                return list; 
            } else {
                toastr.error('No data received or empty response');
                return [];
            }
        })
        .catch(function (error) {
            toastr.error('Error fetching item list');
            HideLoader();
            return [];
        });
}
function GetRMStockWidthList() {
    Showloader();
    return RMStockService.GetRMStockWidth().then(function (response) {
            HideLoader();
            if (response && response.length > 0) {
                const list = response.map((item) => ({ Code: item.Code, Desp: item.Desp }));
                return list;
            } else {
                toastr.error('No data received or empty response');
                return [];
            }
        })
        .catch(function (error) {
            toastr.error('Error fetching width list');
            HideLoader();
            return [];
        });
}

function GetRMStockMachineNoList() {
    RMStockService.GetRMStockMachineNo().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlMachineNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.MachineNo })));

            $('#ddlMachineNo').select2({
                dropdownParent: $('#PlannedMyModal'),
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
function validateDecimalRateInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 3) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}
function calculateWeightPerSlit(rowId) {
    var $row = rowId ? $('#' + rowId) : null;
    var slitValue = rowId
        ? ($row.find('#ddlSlitWidth_' + rowId).val() || $row.find('.ddlSlitWidthRow').first().val())
        : $('#ddlSlitWidth').val();

    var $noOfSlits = rowId
        ? ($row.find('#txtNoOfSlits_' + rowId).length ? $row.find('#txtNoOfSlits_' + rowId) : $row.find('.txtNoOfSlitsRow').first())
        : $('#txtNoOfSlits');
    var $weightPerSlit = rowId
        ? ($row.find('#txtWeightPerSlit_' + rowId).length ? $row.find('#txtWeightPerSlit_' + rowId) : $row.find('.txtWeightPerSlitRow').first())
        : $('#txtWeightPerSlit');
    var $totalWeight = rowId
        ? ($row.find('#txtTotalWeight_' + rowId).length ? $row.find('#txtTotalWeight_' + rowId) : $row.find('.txtTotalWeightRow').first())
        : $('#txtTotalWeight');

    $noOfSlits.val(0);
    $weightPerSlit.val(0);
    $totalWeight.val(0);

    var widthValue = parseFloat(slitValue);
    if (isNaN(widthValue) || widthValue === 0) {
        $weightPerSlit.val('');
        if (rowId) {
            var n = parseFloat($noOfSlits.val()) || 0;
            var w = parseFloat($weightPerSlit.val()) || 0;
            $totalWeight.val((n * w).toFixed(3));
        } else {
         calculateTotalWeight();
        }
         return;
     }
     
    RMStockService.GetRMStockCalculateWidth(G_IdentificationNo, widthValue)
        .then(function (response) {
         if (response && response.length > 0 && response[0].CalculatedSlitPerWidth !== undefined) {
                $weightPerSlit.val(response[0].CalculatedSlitPerWidth);
            } else {
                $weightPerSlit.val('');
            }
            if (rowId) {
                var n = parseFloat($noOfSlits.val()) || 0;
                var w = parseFloat($weightPerSlit.val()) || 0;
                $totalWeight.val((n * w).toFixed(3));
         } else {
             calculateTotalWeight();
         }
        })
        .catch(function (error) {
         toastr.error('Error calculating weight per slit: ' + (error.message || 'Unknown error'));
            $weightPerSlit.val('');
            if (rowId) {
                var n = parseFloat($noOfSlits.val()) || 0;
                var w = parseFloat($weightPerSlit.val()) || 0;
                $totalWeight.val((n * w).toFixed(3));
            } else {
         calculateTotalWeight();
            }
        });
}
//function GetRMStockNumericValueWidth() {
//    let modalSlitNumericWidthValue = parseFloat($('#ddlSlitWidth').val()) || 0;
//    RMStockService.GetRMStockNumericValueWidth(modalSlitNumericWidthValue).then(function (response) {
//        if (response && response.length > 0) {
//            G_selectWidth = (response[0].NumericValue); 
//            //let selectWidth = G_selectWidth;
//            if (G_Width >= G_selectWidth) {
//                //GetRMStockWidthList();
//                calculateWeightPerSlit();
//            }
//            else {
//                toastr.warning("Slit Width value is greater then Original Width");
//                BizSolHelperFunction.SelectOptionByText('ddlSlitWidth', '');
//                return false;
//            }
//        }
//    });
//}

function GetRMStockNumericValueWidthForRow(rowId) {
    var $row = $('#' + rowId);
    var code = parseFloat($row.find('.ddlSlitWidthRow').val()) || 0;
    RMStockService.GetRMStockNumericValueWidth(code).then(function (response) {
        if (response && response.length > 0) {
            var numericWidth = response[0].NumericValue;
            if (G_Width >= numericWidth) {
                calculateWeightPerSlit(rowId);
            } else {
                toastr.warning("Slit Width value is greater then Original Width");
                // clear the select for this row
                var $ddl = $row.find('.ddlSlitWidthRow');
                if ($ddl.hasClass('select2-hidden-accessible')) {
                    $ddl.val(null).trigger('change');
                } else {
                    $ddl.val('');
                }
            }
        }
     });
 }
function calculateTotalWeight() {
    var noOfSlits = parseFloat($('#txtNoOfSlits').val()) || 0;
    var weightPerSlit = parseFloat($('#txtWeightPerSlit').val()) || 0;
    var totalWeight = noOfSlits * weightPerSlit;
    $('#txtTotalWeight').val(totalWeight.toFixed(3));
}

function copyFromPrevious() {
	if (!$('#CopyFromPrevious').is(':checked')) {
		return;
	}

	if (!G_IdentificationNo) {
		toastr.warning('Identification number not available.');
		return;
    }
    Promise.all([GetRMStockItemNameList(), GetRMStockWidthList()])
        .then(function ([itemNameList, widthList]) {
            const $tbody = $('#RMStockCurrentPlanned tbody'); 
            $tbody.empty();
            RMStockService.CopyFromPreviousRMStockData(G_IdentificationNo).then(function (response) {
                if (response && response.length > 0) {
                    var tbody = $('#RMStockCurrentPlanned tbody');
                    response.forEach(function (item, index) {
                        var itemNameText = item.ItemName || '';
                        var slitWidthText = item.Desp || '';
                        var noOfSlitsVal = item.NoofSlits || 0;
                        var weightVal = item.Weight || 0;
                        var weightPerSlitVal = 0;
                        BizSolHelperFunction.SelectOptionByText('ddlMachineNo', item.MachineNo);
                        if (noOfSlitsVal && noOfSlitsVal !== 0) {
                            weightPerSlitVal = weightVal / noOfSlitsVal;
                        }
                        var rowId = (index);
                        var rowKey = [itemNameText, slitWidthText, noOfSlitsVal, weightVal].join('|');
                        var newRow = `
					<tr id="${rowId}" data-detail-code="0" data-master-code="${G_SlittingPlanMaster_Code || 0}">
						<td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
						<td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
						<td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" autocomplete="off" required /></td>
						<td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" autocomplete="off" required disabled /></td>
						<td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly/></td>
						<td><button type="button" class="btn btn-success btn-height" onclick="Save_PlannedSlitting(${rowId})" title="Save" data-row-id="${rowId}"><i class="fas fa-save"></i></button></td>
					</tr>
				`;
                        tbody.append(newRow);
                        G_AppendedRowKeys[rowKey] = true;
                        var $newRow = $('#' + rowId);
                        var $ddlItem = $newRow.find('#ddlItemName_' + rowId);
                        var $ddlWidth = $newRow.find('#ddlSlitWidth_' + rowId);

                        BindSelectList1($ddlItem[0], itemNameList);
                        BindSelectList1($ddlWidth[0], widthList);

                        BizSolHelperFunction.SelectOptionByText('ddlItemName_' + rowId, itemNameText);
                        BizSolHelperFunction.SelectOptionByText('ddlSlitWidth_' + rowId, slitWidthText);

                        $newRow.find('#txtNoOfSlits_' + rowId).val(noOfSlitsVal);
                        $newRow.find('#txtWeightPerSlit_' + rowId).val(weightPerSlitVal.toFixed(3));
                        $newRow.find('#txtTotalWeight_' + rowId).val(weightVal);

                        if ($('.ddlItemNameRow').length) {
                            $('.ddlItemNameRow').select2({
                                dropdownParent: $('#PlannedMyModal'),
                                width: '-webkit-fill-available'
                            });
                        }
                        if ($('.ddlSlitWidthRow').length) {
                            $('.ddlSlitWidthRow').select2({
                                dropdownParent: $('#PlannedMyModal'),
                                width: '-webkit-fill-available'
                            });
                        }
                        if ($.fn.select2) {
                            try {
                                $ddlItem.select2({ dropdownParent: $('#PlannedMyModal'), width: '-webkit-fill-available' });
                                $ddlWidth.select2({ dropdownParent: $('#PlannedMyModal'), width: '-webkit-fill-available' });
                            } catch (e) { }
                        }
                    });

                    setTimeout(function() {
                        updateTableTotals();
                        applyAllowManualWeightState();
                    }, 200);
                } else {
                    enableNewRowAddition();
                    applyAllowManualWeightState();
                    toastr.info('No previous RM Stock data found.');
                }
            }).catch(function (error) {
                toastr.error('Failed to copy previous data: ' + (error.message || 'Unknown error'));
            });
        });
}
function clearForm() {
    $('#ddlItemName').val('').trigger('change');
    $('#ddlSlitWidth').val('').trigger('change');
    $('#txtNoOfSlits').val('');
    $('#txtWeightPerSlit').val('');
    $('#txtTotalWeight').val('');
    G_SNo = 0;
}

//function editRow(button, Code, SlittingMasterCode) {
//    var row = $(button).closest('tr');
//    var cells = row.find('td');
//    G_SNo = Code;
//    G_Code = SlittingMasterCode;
//    RMStockService.EditRMStockData(G_Code, G_SNo).then(function (response) {
//        BizSolHelperFunction.SelectOptionByText('ddlItemName', response[0].ItemName);
//        BizSolHelperFunction.SelectOptionByText('ddlSlitWidth', response[0].Desp);
//        BizSolHelperFunction.SelectOptionByText('ddlMachineNo', response[0].MachineNo);
//        $('#txtNoOfSlits').val(response[0].NoofSlits);
//        $('#txtWeightPerSlit').val(response[0].Weight);
//        $('#txtDate').val(response[0].SlittingDate);
//        $('#txtTotalWeight').val(cells.eq(4).text());

//    });
    
//    row.remove();
//    updateTableTotals();
//}
function deleteRow(button, Code,SlittingMasterCode) {
    G_SNo = Code;
    G_Code = SlittingMasterCode;
    $('#myModalDelete').modal({
        backdrop: 'static',
    });

    $('#myModalDelete').modal('show');
}
function DeleteModal() {
    let reasonForDelete = $('#deleteReason').val();
    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }
    RMStockService.DeleteRMStockData(G_SNo, G_Code, reasonForDelete).then(function (response) {
        if (response != '') {
            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                ShowRMStockPlan();
                CloseModal();
                clearForm(); 
            } else {
                toastr.error(response.Msg);
            }
        }
    });
}
function CloseModal() {
    $('#myModalDelete').modal('hide');
    $('#deleteReason').val('');

}
function updateTableTotals() {
    var $container = $('#PlannedMyModal');
    var tbody = $container.find('#RMStockCurrentPlanned tbody');
    var rows = tbody.find('tr');
    
    var totalWidthCount = 0;
    var totalNoOfSlits = 0;
    var totalWeightPerSlit = 0;
    var totalWeight = 0;
    
    if (rows.length === 0) {
        $container.find('#totalWidthCount').text('0');
        $container.find('#totalNoOfSlits').text('0');
        $container.find('#totalWeightPerSlit').text('0.000');
        $container.find('#totalWeight').text('0.000');
        return;
    }
    
    rows.each(function() {
        var $row = $(this);
        var noOfSlits = parseFloat($row.find('.txtNoOfSlitsRow').val()) || 0;
        var weightPerSlit = parseFloat($row.find('.txtWeightPerSlitRow').val()) || 0;
        var rowTotalWeight = parseFloat($row.find('.txtTotalWeightRow').val());
        if (isNaN(rowTotalWeight) || rowTotalWeight <= 0) {
            rowTotalWeight = noOfSlits * weightPerSlit;
        }

        var selectedWidthText = $row.find('.ddlSlitWidthRow option:selected').text().trim();
        var widthCount = parseFloat(selectedWidthText) || 0;
        
        totalWidthCount += widthCount;
        totalNoOfSlits += noOfSlits;
        totalWeightPerSlit += weightPerSlit;
        totalWeight += rowTotalWeight;
    });
    
    $container.find('#totalWidthCount').text(totalWidthCount.toFixed(0));
    $container.find('#totalNoOfSlits').text(totalNoOfSlits.toFixed(0));
    $container.find('#totalWeightPerSlit').text(totalWeightPerSlit.toFixed(3));
    $container.find('#totalWeight').text(totalWeight.toFixed(3));
}
function Save_PlannedSlitting(rowId) {
    const isBulkSave = $('#CopyFromPrevious').is(':checked');
    if (isBulkSave) {
        SaveCopiedRows();
        return;
    }

    Showloader();
    saveRowAndUpdateMaster(rowId)
        .then(function (response) {
            toastr.success((response && response.Message) || 'Saved successfully');
            ShowRMStockPlan();
            clearForm();
        })
        .catch(function (error) {
            toastr.error((error && error.message) || 'Error saving data');
        })
        .finally(function () {
            HideLoader();
        });
}

function SaveCopiedRows() {
    const $rows = $('#RMStockCurrentPlanned tbody tr');
    if (!$rows.length) {
        toastr.warning('No rows available to save');
        return;
    }

    const rowIds = $rows.map(function () {
        return $(this).attr('id');
    }).get();

    if (!rowIds.length) {
        toastr.warning('Unable to identify rows to save');
        return;
    }

    Showloader();
    (async function () {
        for (let i = 0; i < rowIds.length; i++) {
            await saveRowAndUpdateMaster(rowIds[i]);
        }
    })()
        .then(function () {
            toastr.success('All rows saved successfully');
            ShowRMStockPlan();
            clearForm();
            $('#CopyFromPrevious').prop('checked', false);
        })
        .catch(function (error) {
            toastr.error((error && error.message) || 'Error saving data');
        })
        .finally(function () {
            HideLoader();
        });
}

function saveRowAndUpdateMaster(rowId) {
    const payload = buildPlannedRowPayload(rowId);
    if (!payload) {
        return Promise.reject(new Error('Validation failed'));
    }

    payload.slittingPlanMaster_Code = G_SlittingPlanMaster_Code || Number($('#' + rowId).data('master-code')) || 0;

    return RMStockService.SaveRMStockData(payload).then(function (response) {
        if (!response || response.Status !== 'Y') {
            throw new Error((response && response.Message) || 'Save failed');
        }

        const masterCode = extractMasterCodeFromResponse(response);
        if (masterCode) {
            G_SlittingPlanMaster_Code = masterCode;
            $('#' + rowId).attr('data-master-code', masterCode);
        }

        setTimeout(function() {
            applyAllowManualWeightState();
        }, 150);

        return response;
    });
}

function extractMasterCodeFromResponse(response) {
    if (!response) return 0;
    const candidates = [
        response.SlittingPlanMaster_Code,
        response.slittingPlanMaster_Code,
        response.slittingPlanMasterCode,
        response.MasterCode,
        response.Code
    ];

    for (let i = 0; i < candidates.length; i++) {
        const value = Number(candidates[i]);
        if (!isNaN(value) && value > 0) {
            return value;
        }
    }
    return 0;
}

function buildPlannedRowPayload(rowId) {
    const suffix = rowId != null ? rowId : 0;
    const itemSelector = $('#ddlItemName_' + suffix);
    const widthSelector = $('#ddlSlitWidth_' + suffix);
    const noOfSlitsInput = $('#txtNoOfSlits_' + suffix);
    const weightPerSlitInput = $('#txtWeightPerSlit_' + suffix);
    const totalWeightInput = $('#txtTotalWeight_' + suffix);
    const $row = $('#' + suffix);

    if (!itemSelector.length || !widthSelector.length || !noOfSlitsInput.length || !weightPerSlitInput.length || !totalWeightInput.length) {
        toastr.error('Unable to locate row fields for saving');
        return null;
    }

    const ItemMaster_Code = itemSelector.val();
    const ItemMasterWidth_Code = widthSelector.val();
    const NoOfSlitsValue = noOfSlitsInput.val();
    const IdentificationNo = G_IdentificationNo;
    const MachineNo = $('#ddlMachineNo').val();
    G_today = $('#txtDate').val();
    const PartingCase = $('#PartingCase').is(':checked') ? 'Y' : 'N';
    
    if (!ItemMaster_Code || ItemMaster_Code === '0') { toastr.error('Please select an item name'); return null; }
    if (!ItemMasterWidth_Code || ItemMasterWidth_Code === '0') { toastr.error('Please select a slit width'); return null; }

    const slitWidthValue = parseFloat(ItemMasterWidth_Code);
    if (isNaN(slitWidthValue) || slitWidthValue <= 0) { toastr.error('Please select a valid slit width'); return null; }

    const noOfSlitsNum = parseFloat(NoOfSlitsValue);
    if (isNaN(noOfSlitsNum) || noOfSlitsNum <= 0) { toastr.error('Please enter number of slits'); return null; }

    const weightPerSlitVal = parseFloat(weightPerSlitInput.val());
    if (isNaN(weightPerSlitVal) || weightPerSlitVal <= 0) { toastr.error('Please enter weight per slit'); return null; }

    if (!MachineNo || MachineNo === '0') { toastr.error('Please enter Machine No'); return null; }

    let totalWeightNum = parseFloat(totalWeightInput.val());
    if (isNaN(totalWeightNum) || totalWeightNum <= 0) {
        totalWeightNum = noOfSlitsNum * weightPerSlitVal;
        totalWeightInput.val(totalWeightNum.toFixed(3));
    }

    updateTableTotals();

    let detailCode = Number($row.data('detail-code'));
    if (isNaN(detailCode)) {
        detailCode = Number(suffix) || 0;
    }

    return {
        Code: detailCode,
        itemMaster_Code: ItemMaster_Code,
        ItemParameterValueMaster_Code: ItemMasterWidth_Code,
        noofSlit: noOfSlitsNum,
        identificationNo: IdentificationNo,
        totalWeight: totalWeightNum.toFixed(3),
        machineNo: MachineNo,
        date: G_today,
        partingCase: PartingCase
    };
}
function CloseModal_RMStock() {
    GetRMStockCurrentListTable();
    G_Code = 0;
    G_SlittingPlanMaster_Code = 0;
    $('#CopyFromPrevious').prop('checked', false);
    $('#AllowManualWeight').prop('checked', false);
    $('#PartingCase').prop('checked', false);
    $('#PlannedMyModal').modal('hide');
}
function BindSelectList1(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function initializeTabs() {
    var triggerTabList = [].slice.call(document.querySelectorAll('#rmStockTabs button'));
    triggerTabList.forEach(function (triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl);

        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();

            var targetTab = triggerEl.getAttribute('data-bs-target');
            loadTabData(targetTab);
        });
    });
}
function GetUnApprovedPlannedList() {
    Showloader();
    RMStockService.GetRMStockUNAPPROVEDPLANNED().then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#tblUnApproved_Planned').show();
            const stringFilterColumn = ["Item Name", "Thickness", "Grade", "Make", "IdentificationNo", "Width"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            if ($('#exampleCheck').is(':checked')) {
                hiddenColumns = ["Code","MRN No", "Numeric Value", "IsPlanned", "Invoice No", "Vendor", "Brand", "Ch Wt", "Receive Date", "Invoice Date",  "Ac Wt", "Warehouse", "Remarks", "Qty MT", "Qty PC", "Qty MTRS"];
            } else {
                hiddenColumns = ["Code", "MRN No", "Numeric Value", "% E", "Hardness", "UTS", "YST", "BEND TEST", "IsPlanned", "Invoice No",  "Vendor", "Brand", "Ch Wt", "Receive Date", "Invoice Date", "Ac Wt", "Warehouse", "Remarks", "Qty MT", "Qty PC", "Qty MTRS"];
            }
            const columnAlignment = {
                'Invoice Date': 'center', 'Receive Date': 'center', 'Thickness': 'right', 'Ch Wt': 'right', 'Width': 'right;min-width:60px', 'Ac Wt': 'right',
                'Qty MT': 'right', 'Qty PC': 'right', 'Qty MTRS': 'right', '% E': 'right;min-width:50px', 'Hardness': 'right', 'UTS': 'right;min-width:70px', 'YST': 'right;min-width:70px', 'Status': ';width:150px',
                'Purchased Date': ';width:150px',
                'Vendor': ';min-width:230px !important;',
                'Item Name': ';min-width:100px !important;',
            };
          
            BizsolCustomFilterGrid.CreateDataTable("table-header-UnApproved_Planned", "table-body-UnApproved_Planned", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblUnApproved_Planned').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during UnApproved_Planned');
            $('#tblUnApproved_Planned').hide();
       
    });
}
function GetSlittedCoilStockList(G_FromDateSlittedCoilStockValue, G_ToDateSlittedCoilStockValue) {
    Showloader();
    RMStockService.GetSlittedCoilStockData(G_FromDateSlittedCoilStockValue, G_ToDateSlittedCoilStockValue).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            response = response.map(item => {
                if (item["Qty MT"] !== undefined && item["Qty MT"] !== null && !isNaN(item["Qty MT"])) {
                    item["Qty MT"] = parseFloat(item["Qty MT"]).toFixed(3);
                }
                return item;
            });
            $('#tblSlitted_Coil_Stock').show();
            const stringFilterColumn = ["Item Name", "IdentificationNo", "Qty PC", "Qty MT"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Create Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = ["Code","Qty MTRS"];
            const columnAlignment = { "Qty PC": 'right', "Qty MT": 'right', "Qty MTRS": 'right',"Create Date":'center'};
            calculateTotalFooterSlitted_Coil_Stock(response);
            BizsolCustomFilterGrid.CreateDataTable("table-header-Slitted_Coil_Stock", "table-body-Slitted_Coil_Stock", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblSlitted_Coil_Stock').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during Slitted_Coil_Stock');
            $('#tblSlitted_Coil_Stock').hide();
       
    });
}
function calculateTotalFooterSlitted_Coil_Stock(rows) {
    try {
        let totalSlitted_Coil_QtyPC = 0;
        let totalSlitted_Coil_QtyMT = 0;
        if (rows && rows.length) {
            rows.forEach(function (r) {
                totalSlitted_Coil_QtyPC += parseFloat(r['Qty PC']) || 0;
                totalSlitted_Coil_QtyMT += parseFloat(r['Qty MT']) || 0;
            });
        }
        if ($('#totalSlitted_Coil_QtyPC').length) {
            $('#totalSlitted_Coil_QtyPC').text(totalSlitted_Coil_QtyPC);
        }
        if ($('#totalSlitted_Coil_QtyMT').length) {
            $('#totalSlitted_Coil_QtyMT').text(totalSlitted_Coil_QtyMT.toFixed(3));
        }
    } catch (e) {
    }
}
function loadTabData(tabId) {
    $('#RMStockCurrent tbody').empty();
    $('#RMStockCurrent thead tr').empty();
    $('#UnApproved_Planned tbody').empty();
    $('#UnApproved_Planned thead tr').empty();
    $('#Slitted_Coil_Stock tbody').empty();
    $('#Slitted_Coil_Stock thead tr').empty();
    $('#dispatch tbody').empty();
    $('#dispatch thead tr').empty();
    $('#Slitted tbody').empty();
    $('#Slitted thead tr').empty();
    $('#JobWorkData tbody').empty();
    $('#JobWorkData thead tr').empty();
    $('#SummaryData tbody').empty();
    $('#SummaryData thead tr').empty();
    switch (tabId) {
        case '#current-stock':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').show();
            $('#unApproved-planned').hide();
            $('#slitted-coil-stock').hide();
            $('#dispatch').hide();
            $('#checkBoxHideAndShow').show();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#stock-summary').hide();
            GetRMStockCurrentListTable();
            break;
        case '#unApproved-planned':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#unApproved-planned').show();
            $('#slitted-coil-stock').hide();
            $('#dispatch').hide();
            $('#stock-summary').hide();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#checkBoxHideAndShow').show();
            $('#tblUnApproved_Planned').hide();
            GetUnApprovedPlannedList();
            break;
        case '#slitted-coil-stock':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#unApproved-planned').show();
            $('#dispatch').hide();
            $('#stock-summary').hide();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#checkBoxHideAndShow').hide();
            $('#tblUnApproved_Planned').hide();
            $('#slitted-coil-stock').show();
            setCurrentDateDispatch();
            GetSlittedCoilStockList(G_FromDateSlittedCoilStockValue, G_ToDateSlittedCoilStockValue);
            break;
        case '#dispatch':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#slitted-coil-stock').hide();
            $('#checkBoxHideAndShow').hide();
            $('#tbldispatch').hide();
            $('#dispatch').show();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#stock-summary').hide();
            setCurrentDateDispatch();
            loadDispatchData(G_FromDateValue, G_ToDateValue);
            break;
        case '#slitted':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#slitted-coil-stock').hide();
            $('#checkBoxHideAndShow').hide();
            $('#dispatch').hide();
            $('#tblSlitted').hide();
            $('#slitted').show();
            $('#job-work').hide();
            $('#stock-summary').hide();
            setCurrentDateDispatch();
            loadSlittedData(G_FromDateValueSlitted, G_ToDateValueSlitted);
            break;
        case '#job-work':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#slitted-coil-stock').hide();
            $('#checkBoxHideAndShow').hide();
            $('#dispatch').hide();
            $('#slitted').hide();
            $('#stock-summary').hide();
            $('#tblJobWorkData').hide();
            $('#job-work').show();
            setCurrentDateDispatch();
            loadJobWorkData(G_FromDateValueJobWork, G_ToDateValueJobWork);
            break;
        case '#stock-summary':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#slitted-coil-stock').hide();
            $('#checkBoxHideAndShow').hide();
            $('#dispatch').hide();
            $('#job-work').hide();
            $('#slitted').hide();
            $('#tblSummaryData').hide();
            $('#stock-summary').show();
            loadStockSummaryData();
            break;
        default:
            break;
    }
}
function setCurrentDateDispatch() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0'); 
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

     $('#txtFromDate').val(formatDate(firstOfMonth));  
     $('#txtFromDateSlitted').val(formatDate(firstOfMonth));  
     $('#txtFromDateJobWork').val(formatDate(firstOfMonth));  
     $('#txtFromDateSlittedCoilStock').val(formatDate(firstOfMonth));  
     $('#txtToDate').val(formatDate(today));    
     $('#txtToDateSlitted').val(formatDate(today));    
     $('#txtToDateJobWork').val(formatDate(today));    
     $('#txtToDateSlittedCoilStock').val(formatDate(today));    
    G_FromDateValue = $('#txtFromDate').val();  
    G_FromDateValueSlitted = $('#txtFromDateSlitted').val();  
    G_FromDateValueJobWork = $('#txtFromDateJobWork').val();  
    G_FromDateSlittedCoilStockValue = $('#txtFromDateSlittedCoilStock').val();  
    G_ToDateValue = $('#txtToDate').val();    
    G_ToDateValueSlitted = $('#txtToDateSlitted').val();    
    G_ToDateValueJobWork = $('#txtToDateJobWork').val();    
    G_ToDateSlittedCoilStockValue = $('#txtToDateSlittedCoilStock').val();
    
}
function ShowDispatchList() {
    G_FromDateValue = $('#txtFromDate').val();
    G_ToDateValue = $('#txtToDate').val();
    loadDispatchData(G_FromDateValue, G_ToDateValue);
}
function loadDispatchData(G_FromDateValue, G_ToDateValue) {
    Showloader();
    RMStockService.GetRMStockDispatch(G_FromDateValue, G_ToDateValue).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#tbldispatch').show();
            const stringFilterColumn = ["Thickness", "Width", "Grade", "Make", "Identification No", "Client","Item Name"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            const columnAlignment = {
                'Thickness': "right;min-width:20px", 'Width': "right;min-width:20px",'Date':"center"
            };
           
            BizsolCustomFilterGrid.CreateDataTable("table-header-dispatch", "table-body-dispatch", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tbldispatch').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during dispatch');
            $('#tbldispatch').hide();

        });
}
function ShowSlittedList() {
    G_FromDateValueSlitted = $('#txtFromDateSlitted').val();
    G_ToDateValueSlitted = $('#txtToDateSlitted').val();
    loadSlittedData(G_FromDateValueSlitted, G_ToDateValueSlitted);
}
function loadSlittedData(G_FromDateValueSlitted, G_ToDateValueSlitted) {
    Showloader();
    RMStockService.GetRMStockSlitted(G_FromDateValueSlitted, G_ToDateValueSlitted).then(function (response) {
        if (response.length > 0) {
            response = response.map(item => {
                if (item["Yield %"] !== undefined && item["Yield %"] !== null && !isNaN(item["Yield %"])) {
                    item["Yield %"] = parseFloat(item["Yield %"]).toFixed(2);
                }
                if (item["Width Loss %"] !== undefined && item["Width Loss %"] !== null && !isNaN(item["Width Loss %"])) {
                    item["Width Loss %"] = parseFloat(item["Width Loss %"]).toFixed(2);
                }
                if (item["Output Weight"] !== undefined && item["Output Weight"] !== null && !isNaN(item["Output Weight"])) {
                    item["Output Weight"] = parseFloat(item["Output Weight"]).toFixed(3);
                }
                if (item["Scrap"] !== undefined && item["Scrap"] !== null && !isNaN(item["Scrap"])) {
                    item["Scrap"] = parseFloat(item["Scrap"]).toFixed(3);
                }
                return item;
            });

            $('#tblSlitted').show();
            const stringFilterColumn = ["Entry No", "Thickness", "Width", "Grade", "Make", "Item Name", "Identification No", "Weight", "ACT WT", "Warehouse", "Slitting plan", "Output Weight", "Scrap", "Yield %","Width Loss %"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Entry Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            const columnAlignment = {
                'Thickness': "right;min-width:20px", 'Width': "right;min-width:20px", 'Entry Date': "center",
                'Weight': "right;min-width:20px", 'ACT WT': "right;min-width:20px", 'Output Weight': "right", "Scrap": "right", "Yield %":"right", "Width Loss %":"right"
            };
            calculateTotalFooterSlitted(response);
            BizsolCustomFilterGrid.CreateDataTable("table-header-Slitted", "table-body-Slitted", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            HideLoader();
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblSlitted').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during Slitted');
            $('#tblSlitted').hide();

        });
}
function calculateTotalFooterSlitted(rows) {
        try {
            let totalWt = 0;
            let totalActWt = 0;
            if (rows && rows.length) {
                rows.forEach(function (r) {
                    totalWt += parseFloat(r['Weight']) || 0;
                    totalActWt += parseFloat(r['ACT WT']) || 0;
                });
            }
            // Write into footer elements if they exist
            if ($('#totalWt').length) {
                $('#totalWt').text(totalWt.toFixed(3));
            }
            if ($('#totalActWt').length) {
                $('#totalActWt').text(totalActWt.toFixed(3));
            }
        } catch (e) {
        }
}
function ShowJobWorkList() {
    G_FromDateValueJobWork = $('#txtFromDateJobWork').val();
    G_ToDateValueJobWork = $('#txtToDateJobWork').val();
    loadJobWorkData(G_FromDateValueJobWork, G_ToDateValueJobWork);
}
function loadJobWorkData(G_FromDateValueJobWork, G_ToDateValueJobWork) {
    Showloader();
    RMStockService.GetRMStockJobWorkData(G_FromDateValueJobWork, G_ToDateValueJobWork).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            response = response.map(item => {
                if (item["Yield %"] !== undefined && item["Yield %"] !== null && !isNaN(item["Yield %"])) {
                    item["Yield %"] = parseFloat(item["Yield %"]).toFixed(2);
                }
                if (item["Width Loss %"] !== undefined && item["Width Loss %"] !== null && !isNaN(item["Width Loss %"])) {
                    item["Width Loss %"] = parseFloat(item["Width Loss %"]).toFixed(2);
                }
                if (item["Output Weight"] !== undefined && item["Output Weight"] !== null && !isNaN(item["Output Weight"])) {
                    item["Output Weight"] = parseFloat(item["Output Weight"]).toFixed(3);
                }
                if (item["Scrap"] !== undefined && item["Scrap"] !== null && !isNaN(item["Scrap"])) {
                    item["Scrap"] = parseFloat(item["Scrap"]).toFixed(3);
                }
                return item;
            });
            $('#tblJobWorkData').show();
            const stringFilterColumn = ["Entry No","Thickness", "Width", "Grade", "Make", "Item Name", "Identification No", "Weight", "ACT WT", "Warehouse", "Slitting plan", "Output Weight", "Scrap", "Yield %", "Width Loss %", "Party Name"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Entry Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            const columnAlignment = {
                'Thickness': "right;min-width:20px", 'Width': "right;min-width:20px", 'Entry Date': "center", "Party Name": "left;min-width:262px", "Warehouse":";min-width:110px",
                'Weight': "right;min-width:20px", 'ACT WT': "right;min-width:20px", 'Output Weight': "right", "Scrap": "right", "Yield %": "right", "Width Loss %": "right"
            };
            calculateTotalFooterJobWork(response);
            BizsolCustomFilterGrid.CreateDataTable("table-header-JobWorkData", "table-body-JobWorkData", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblJobWorkData').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during JobWorkData');
            $('#tblJobWorkData').hide();

        });
}
function calculateTotalFooterJobWork(rows) {
    try {
        let totalWeight = 0;
        let totalActualWt = 0;
        if (rows && rows.length) {
            rows.forEach(function (r) {
                totalWeight += parseFloat(r['Weight']) || 0;
                totalActualWt += parseFloat(r['ACT WT']) || 0;
            });
        }
        if ($('#totalWeight').length) {
            $('#totalWeight').text(totalWeight.toFixed(3));
        }
        if ($('#totalActualWt').length) {
            $('#totalActualWt').text(totalActualWt.toFixed(3));
        }
    } catch (e) {
    }
}
function loadStockSummaryData() {
    calculateStockSummary(); 
    Showloader();
    RMStockService.GetRMStockSummaryData().then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#tblSummaryData').show();
            const stringFilterColumn = ["Item Name", "No OF PC/Coil", "Total Weight", "No OF PC","Weight"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            const columnAlignment = {
                "Item Name":";width:20px",
                "No OF PC/Coil":"right;width:20px",
                "Total Weight":"right;width:20px",
                "No OF PC":"right;width:20px",
                "Weight":"right;width:20px",
            };
            calculateTotalFooterStockSummary(response);
            BizsolCustomFilterGrid.CreateDataTable("table-header-SummaryData", "table-body-SummaryData", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblSummaryData').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during SummaryData');
            $('#tblSummaryData').hide();

        });
}
function calculateTotalFooterStockSummary(rows) {
    try {
        let totalWeightStock = 0;
        let totalNoOFPC = 0;
        let totalNoOFPCCoil = 0;
        let totalWtStock = 0;
        if (rows && rows.length) {
            rows.forEach(function (r) {
                totalWeightStock += parseFloat(r['Total Weight']) || 0;
                totalNoOFPCCoil += parseFloat(r['No OF PC/Coil']) || 0;
                totalNoOFPC += parseFloat(r['No OF PC']) || 0;
                totalWtStock += parseFloat(r['Weight']) || 0;
            });
        }
        if ($('#totalWeightStock').length) {
            $('#totalWeightStock').text(totalWeightStock.toFixed(3));
        }
        if ($('#totalWtStock').length) {
            $('#totalWtStock').text(totalWtStock.toFixed(3));
        }
        if ($('#totalNoOFPCCoil').length) {
            $('#totalNoOFPCCoil').text(totalNoOFPCCoil);
        }
        if ($('#totalNoOFPC').length) {
            $('#totalNoOFPC').text(totalNoOFPC);
        }
    } catch (e) {
    }
}
function Export() {
    var ReportType = "RMStockReport";
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
function calculateStockSummary() {
    $('#totalStockValue').text('₹ 0.00');
    $('#totalItems').text('0');

    // Example calculation (replace with your actual logic):
    // let totalValue = 0;
    // let totalItems = 0;
    // // Calculate from your data
    // $('#totalStockValue').text('₹ ' + totalValue.toFixed(2));
    // $('#totalItems').text(totalItems);
}
function refreshCurrentStock() {
    ListStatus_IndentMaster();
}

function refreshDispatch() {
    loadDispatchData();
}

function refreshSlitted() {
    loadSlittedData();
}

function refreshJobWork() {
    loadJobWorkData();
}

function refreshStockSummary() {
    loadStockSummaryData();
}

window.initializeTabs = initializeTabs;
window.loadTabData = loadTabData;
window.loadDispatchData = loadDispatchData;
window.loadSlittedData = loadSlittedData;
window.loadJobWorkData = loadJobWorkData;
window.loadStockSummaryData = loadStockSummaryData;
window.calculateStockSummary = calculateStockSummary;
window.refreshCurrentStock = refreshCurrentStock;
window.refreshDispatch = refreshDispatch;
window.refreshSlitted = refreshSlitted;
window.refreshJobWork = refreshJobWork;
window.refreshStockSummary = refreshStockSummary;
window.ShowModelPlanned = ShowModelPlanned;
window.CloseModal_RMStock = CloseModal_RMStock;
window.Save_PlannedSlitting = Save_PlannedSlitting;
window.validateIntegerInput = validateIntegerInput;
window.calculateTotalWeight = calculateTotalWeight;
window.copyFromPrevious = copyFromPrevious;
//window.addNewRow = addNewRow;
window.clearForm = clearForm;
//window.editRow = editRow;
window.deleteRow = deleteRow;
window.updateTableTotals = updateTableTotals;
window.validateDecimalRateInput = validateDecimalRateInput;
window.fillTableWithExistingData = fillTableWithExistingData;
window.enableNewRowAddition = enableNewRowAddition;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;
window.ShowDispatchList = ShowDispatchList;
window.ShowSlittedList = ShowSlittedList;
window.ShowJobWorkList = ShowJobWorkList;
//window.ShowSlittedCoilStockList = ShowSlittedCoilStockList;