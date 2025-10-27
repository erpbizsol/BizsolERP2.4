import { RMStockService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RMStockService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_today = '';
let G_FromDateValue = '';
let G_ToDateValue = '';
let G_IdentificationNo = '';
let G_Code = 0;
let G_SNo = 0;
let G_Width = 0;
let G_selectWidth = 0;
let G_SlittingPlanMaster_Code = 0;
let G_AppendedRowKeys = {};

$(document).ready(function () {
    let isInitialLoad = true;
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);

    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Raw Material Stock Management");
    }
   
    $('#current-stock').show();
    $('#unApproved-planned').hide();
    $('#dispatch').hide();
    GetRMStockCurrentListTable();
    $('#exampleCheck').on("click", function () {
        GetRMStockCurrentListTable();
        GetUnApprovedPlannedList();
    });

    $('#RMStockCurrentPlanned').on('change', '.ddlSlitWidthRow', function () {
        var $row = $(this).closest('tr');
        var rowId = $row.attr('id');

        if ($('#PartingCase').is(':checked')) {
            // compute for this row
            calculateWeightPerSlit(rowId);
        } else {
            // reset only this row
            var $no = $row.find('.txtNoOfSlitsRow');
            var $wps = $row.find('.txtWeightPerSlitRow');
            var $tw = $row.find('.txtTotalWeightRow');
            $no.val(0);
            $wps.val(0);
            $tw.val(0);
            GetRMStockNumericValueWidthForRow(rowId);
        }
        // Update totals when width selection changes
        updateTableTotals();
    });
    $('#AllowManualWeight').off('change').on('change', function () {
        if ($(this).is(':checked')) {
            $('.txtWeightPerSlitRow').prop('disabled', false).removeClass('bg-light');
        } else {
            $('.txtWeightPerSlitRow').prop('disabled', true).addClass('bg-light');
        }
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
        // Update totals in real-time
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
            const numericFilterColumn = ["Qty MT","Qty PC","Qty MTRS"];
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
                'Qty MT': 'right', 'Qty PC': 'right', 'Qty MTRS': 'right', '% E': 'right;min-width:50px', 'Hardness': 'right', 'UTS': 'right;min-width:70px', 'YST': 'right;min-width:70px','Status': ';width:150px',
                'Purchased Date': ';width:150px',
                'Vendor': ';min-width:230px !important;',
                'Item Name': ';min-width:100px !important;',
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
            // calculate footer totals for Ch Wt and Ac Wt
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

 //Calculate and render totals for "Ch Wt" and "Ac Wt" into footer placeholders if present
function calculateRMStockCurrentFooterTotals(rows) {
    try {
        let totalChWt = 0;
        let totalAcWt = 0;
        if (rows && rows.length) {
            rows.forEach(function(r){
                totalChWt += parseFloat(r['Ch Wt']) || 0;
                totalAcWt += parseFloat(r['Ac Wt']) || 0;
            });
        }
        // Write into footer elements if they exist
        if ($('#totalChWt').length) {
            $('#totalChWt').text(totalChWt.toFixed(3));
        }
        if ($('#totalAcWt').length) {
            $('#totalAcWt').text(totalAcWt.toFixed(3));
        }
    } catch(e) {
        // fail silently
    }
}
function ShowModelPlanned(rowData) {
    $('#txtIdentificationNo').val(rowData.IdentificationNo);
    $('#txtWidth').val(rowData?.['Numeric Value']);
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
        // Update totals after table is filled
        setTimeout(function() {
            updateTableTotals();
        }, 100);
    });
}

function fillTableWithExistingData(response) {
    //GetRMStockItemNameList().then(function (itemNameList)
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
                    <tr id="${rowId}">
                        <td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
                        <td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
                        <td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" oninput="validateIntegerInput(this)" autocomplete="off" required /></td>
                        <td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" oninput="validateDecimalRateInput(this)" autocomplete="off" required disabled /></td>
                        <td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly /></td>
                        <td>
                            <button type="button" class="btn btn-success btn-height" onclick='Save_PlannedSlitting(${item.SNo},${item.Code})' title="Edit" data-row-id="${rowId}"><i class="fas fa-pencil"></i></button>
                    <button type="button" onclick="deleteRow(this,${item.SNo},${item.Code})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
                tbody.append(interactiveRow);

                var $row = $('#' + rowId);

                // Bind item name select
                BindSelectList1($row.find('select.ddlItemNameRow')[0], itemNameList);
                BindSelectList1($row.find('select.ddlSlitWidthRow')[0], widthList);
                
                // Preselect item
                BizSolHelperFunction.SelectOptionByText(`ddlItemName_${rowId}`, itemNameText);
                BizSolHelperFunction.SelectOptionByText(`ddlSlitWidth_${rowId}`, slitWidthText);

                // Handle rest of inputs
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
        } else {
            enableNewRowAddition();
            G_SlittingPlanMaster_Code = 0;
        }
    });
}


function enableNewRowAddition() {
    const $tbody = $('#RMStockCurrentPlanned tbody');
    const rowId = 0;

    const newRowHtml = `
        <tr id="${rowId}">
            <td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
            <td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
            <td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" oninput="validateIntegerInput(this)" autocomplete="off" required /></td>
            <td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" oninput="validateDecimalRateInput(this)" autocomplete="off" required disabled /></td>
            <td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly /></td>
            <td>
                <button type="button" onclick="Save_PlannedSlitting(0)" title="Save" class="btn btn-success btn-height"><i class="fas fa-save"></i></button>
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
    // Determine scope: header inputs (no rowId) or row-level inputs (with rowId)
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

    // Reset fields
    $noOfSlits.val(0);
    $weightPerSlit.val(0);
    $totalWeight.val(0);

    var widthValue = parseFloat(slitValue);
    if (isNaN(widthValue) || widthValue === 0) {
        $weightPerSlit.val('');
        // Recalculate total using appropriate scope
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
            // Recalculate total using appropriate scope
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

// Row-scoped numeric-width fetch and compute
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
            const $tbody = $('#RMStockCurrentPlanned tbody'); // used for appending
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
					<tr id="${rowId}">
						<td><select id="ddlItemName_${rowId}" class="box_border form-control form-control-sm ddlItemNameRow" required></select></td>
						<td><select id="ddlSlitWidth_${rowId}" class="box_border form-control form-control-sm ddlSlitWidthRow" required></select></td>
						<td><input id="txtNoOfSlits_${rowId}" class="box_border form-control form-control-sm text-end txtNoOfSlitsRow" autocomplete="off" required /></td>
						<td><input id="txtWeightPerSlit_${rowId}" class="box_border form-control form-control-sm text-end txtWeightPerSlitRow" autocomplete="off" required disabled /></td>
						<td><input id="txtTotalWeight_${rowId}" class="box_border form-control form-control-sm text-end txtTotalWeightRow" required readonly/></td>
						<td><button type="button" class="btn btn-success btn-height" onclick="Save_PlannedSlitting(0)" title="Save" data-row-id="${rowId}"><i class="fas fa-save"></i></button></td>
					</tr>
				`;
                        tbody.append(newRow);
                        G_AppendedRowKeys[rowKey] = true;
                        var $newRow = $('#' + rowId);
                        var $ddlItem = $newRow.find('#ddlItemName_' + rowId);
                        var $ddlWidth = $newRow.find('#ddlSlitWidth_' + rowId);

                        //// Bind lists directly (do not clone from header)
                        BindSelectList1($ddlItem[0], itemNameList);
                        BindSelectList1($ddlWidth[0], widthList);

                        // Select by text with your helper
                        BizSolHelperFunction.SelectOptionByText('ddlItemName_' + rowId, itemNameText);
                        BizSolHelperFunction.SelectOptionByText('ddlSlitWidth_' + rowId, slitWidthText);

                        // Set inputs
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
                        // Init Select2 after binding
                        if ($.fn.select2) {
                            try {
                                $ddlItem.select2({ dropdownParent: $('#PlannedMyModal'), width: '-webkit-fill-available' });
                                $ddlWidth.select2({ dropdownParent: $('#PlannedMyModal'), width: '-webkit-fill-available' });
                            } catch (e) { }
                        }
                    });

                    // Update totals after copying all rows
                    setTimeout(function() {
                        updateTableTotals();
                    }, 200);
                } else {
                    enableNewRowAddition();
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
    //$('#ddlMachineNo').val('').trigger('change');
    $('#txtNoOfSlits').val('');
    $('#txtWeightPerSlit').val('');
    $('#txtTotalWeight').val('');
    G_SNo = 0;
    $('#CopyFromPrevious').prop('checked', false);
    $('#AllowManualWeight').prop('checked', false);
    $('#PartingCase').prop('checked', false);
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
                // Refresh table data - updateTableTotals will be called after refresh completes
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
    var tbody = $('#RMStockCurrentPlanned tbody');
    var rows = tbody.find('tr');
    
    var totalWidthCount = 0;
    var totalNoOfSlits = 0;
    var totalWeightPerSlit = 0;
    var totalWeight = 0;
    
    // If no rows exist, reset totals to zero
    if (rows.length === 0) {
        $('#totalWidthCount').text('0');
        $('#totalNoOfSlits').text('0');
        $('#totalWeightPerSlit').text('0.000');
        $('#totalWeight').text('0.000');
        return;
    }
    
    // Calculate totals from all visible rows
    rows.each(function() {
        // Get values using class selectors for consistency
        var noOfSlits = parseFloat($(this).find('.txtNoOfSlitsRow').val()) || 0;
        var weightPerSlit = parseFloat($(this).find('.txtWeightPerSlitRow').val()) || 0;
        var rowTotalWeight = parseFloat($(this).find('.txtTotalWeightRow').val()) || 0;
        
        // Get selected width text from dropdown
        var selectedWidthText = $(this).find('.ddlSlitWidthRow option:selected').text().trim();
        var widthCount = parseFloat(selectedWidthText) || 0;
        
        // Accumulate totals
        totalWidthCount += widthCount;
        totalNoOfSlits += noOfSlits;
        totalWeightPerSlit += weightPerSlit;
        totalWeight += rowTotalWeight;
    });
    
    // Update total display elements
    $('#totalWidthCount').text(totalWidthCount.toFixed(0));
    $('#totalNoOfSlits').text(totalNoOfSlits.toFixed(0));
    $('#totalWeightPerSlit').text(totalWeightPerSlit.toFixed(3));
    $('#totalWeight').text(totalWeight.toFixed(3));
}
function Save_PlannedSlitting(SNo) {
    let ItemMaster_Code = $('#ddlItemName_' + SNo).val();
    let ItemMasterWidth_Code = $('#ddlSlitWidth_' + SNo).val();
    let NoOfSlitsValue = $('#txtNoOfSlits_' + SNo).val();
    let IdentificationNo = G_IdentificationNo;
    let TotalWeight = $('#txtTotalWeight_' + SNo).val();
    let MachineNo = $('#ddlMachineNo').val();
    G_today = $('#txtDate').val();
    let PartingCase = $('#PartingCase').is(':checked') ? 'Y' : 'N';
    if (!ItemMaster_Code || ItemMaster_Code === '0') { toastr.error('Please select an item name'); return; }
    if (!ItemMasterWidth_Code || ItemMasterWidth_Code === '0') { toastr.error('Please select a slit width'); return; }
    let slitWidthValue = parseFloat(ItemMasterWidth_Code);
    if (isNaN(slitWidthValue) || slitWidthValue <= 0) { toastr.error('Please select a valid slit width'); return; }

    let noOfSlitsNum = parseFloat(NoOfSlitsValue);
    if (isNaN(noOfSlitsNum) || noOfSlitsNum <= 0) { toastr.error('Please enter number of slits'); return; }

    let weightPerSlitVal = parseFloat($('#txtWeightPerSlit_' + SNo).val());
    if (isNaN(weightPerSlitVal) || weightPerSlitVal <= 0) { toastr.error('Please enter weight per slit'); return; }

    if (!MachineNo || MachineNo === '0') { toastr.error('Please enter Machine No'); return; }

    let totalWeightNum = parseFloat(TotalWeight);
    if (isNaN(totalWeightNum) || totalWeightNum <= 0) {
        totalWeightNum = noOfSlitsNum * weightPerSlitVal;
        $('#txtTotalWeight_' + SNo).val(totalWeightNum.toFixed(3));
    }

    let RMStockPayloadData = {
        Code: SNo,
        slittingPlanMaster_Code: G_SlittingPlanMaster_Code,
        itemMaster_Code: ItemMaster_Code,
        ItemParameterValueMaster_Code: ItemMasterWidth_Code,
        noofSlit: noOfSlitsNum,
        identificationNo: IdentificationNo,
        totalWeight: totalWeightNum.toFixed(3),
        machineNo: MachineNo,
        date: G_today,
        partingCase: PartingCase,
    };

    Showloader();
    RMStockService.SaveRMStockData(RMStockPayloadData).then(function (response) {
        HideLoader();
        if (response.Status === 'Y') {
            toastr.success(response.Message);
            // Refresh table data - updateTableTotals will be called after refresh completes
            ShowRMStockPlan();
            clearForm();
        } else {
            toastr.error(response.Message || 'Save failed');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && error.Message) || 'Error saving data');
    });
    
    if ($('#CopyFromPrevious').is(':checked')) {
        setTimeout(function () {
            copyFromPrevious();
        }, 100);
    }
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


// Tab Management Functions
function initializeTabs() {
    // Initialize Bootstrap tabs
    var triggerTabList = [].slice.call(document.querySelectorAll('#rmStockTabs button'));
    triggerTabList.forEach(function (triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl);

        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();

            // Load data for the active tab
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
            //const updatedResponse = response.map((item, index) => {
            //    const buttonText = item.IsPlanned ? "Planned" : "Plan";
            //    let PlannedButtonInputHTML = `<button type="button" class="btn btn-primary btn-height" title="Planned Button" onclick='ShowModelPlanned(${JSON.stringify(item)})' style="width: 70px;">${buttonText}</button>`;

            //    return {
            //        ...item,
            //        'Planned Button': PlannedButtonInputHTML,
            //    };
            //});
            // calculate footer totals for Ch Wt and Ac Wt
            calculateRMStockCurrentFooterTotals(response);
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
 
function loadTabData(tabId) {
    switch (tabId) {
        case '#current-stock':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').show();
            $('#unApproved-planned').hide();
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
            $('#dispatch').hide();
            $('#stock-summary').hide();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#checkBoxHideAndShow').show();
            $('#tblUnApproved_Planned').hide();
            GetUnApprovedPlannedList();
            break;
        case '#dispatch':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#checkBoxHideAndShow').hide();
            $('#tbldispatch').hide();
            $('#dispatch').show();
            $('#slitted').hide();
            $('#job-work').hide();
            $('#stock-summary').hide();
            setCurrentDateDispatch();
            break;
        case '#slitted':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#checkBoxHideAndShow').hide();
            $('#dispatch').hide();
            $('#tblSlitted').hide();
            $('#slitted').show();
            $('#job-work').hide();
            $('#stock-summary').hide();
            loadSlittedData();
            break;
        case '#job-work':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
            $('#checkBoxHideAndShow').hide();
            $('#dispatch').hide();
            $('#slitted').hide();
            $('#stock-summary').hide();
            $('#tblJobWorkData').hide();
            $('#job-work').show();
            loadJobWorkData();
            break;
        case '#stock-summary':
            $('#tblReport tbody').empty();
            $('#tblReport thead tr').empty();
            $('#current-stock').hide();
            $('#tblUnApproved_Planned').hide();
            $('#unApproved-planned').hide();
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
     $('#txtToDate').val(formatDate(today));    
    G_FromDateValue = $('#txtFromDate').val();  
    G_ToDateValue = $('#txtToDate').val();    
    loadDispatchData(G_FromDateValue, G_ToDateValue);
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

function loadSlittedData() {
    Showloader();
    RMStockService.GetRMStockSlitted().then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#tblSlitted').show();
            const stringFilterColumn = ["Thickness", "Width", "Grade", "Make", "Item Name", "Identification No", "Weight", "ACT WT", "Warehouse", "Slitting plan", "Output Weight", "Scrap", "Yield %","Width Loss %"];
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

            BizsolCustomFilterGrid.CreateDataTable("table-header-Slitted", "table-body-Slitted", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
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

function loadJobWorkData() {
    Showloader();
    RMStockService.GetRMStockJobWorkData().then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#tblJobWorkData').show();
            const stringFilterColumn = ["Thickness", "Width", "Grade", "Make", "Item Name", "Identification No", "Weight", "ACT WT", "Warehouse", "Slitting plan", "Output Weight", "Scrap", "Yield %", "Width Loss %", "Party Name"];
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
                "No OF PC/Coil":";width:20px",
                "Total Weight":";width:20px",
                "No OF PC":";width:20px",
                "Weight":";width:20px",
            };

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
    // Calculate total stock value and items
    // This is a placeholder - implement your actual calculation logic
    $('#totalStockValue').text('₹ 0.00');
    $('#totalItems').text('0');

    // Example calculation (replace with your actual logic):
    // let totalValue = 0;
    // let totalItems = 0;
    // // Calculate from your data
    // $('#totalStockValue').text('₹ ' + totalValue.toFixed(2));
    // $('#totalItems').text(totalItems);
}

// Tab-specific data loading functions
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

// Global functions for tab management
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
//window.ValidateWidthInput = ValidateWidthInput;