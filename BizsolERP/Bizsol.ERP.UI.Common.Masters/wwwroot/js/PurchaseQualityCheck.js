import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { PurchaseQualityCheckService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseQualityCheckService.js';
import { QCPropertyTestTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyTestTypeMasterService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_PropertyColumns = [];
let G_PurchaseQualityCheckData = [];
let G_PurchaseQualityCheckDataList = [];
let G_SelectedTestTypeCodes = [];
let G_SelectedTestTypes = [];
let G_HeaderTestTypeSelections = [];
let G_ChangedInputs = [];
let G_MRNNoList = [];
let G_MRNType = '';
let G_IsViewMode = false;
let menuValue = '';
let G_GodownList = [];

$(document).ready(function () {
    const urlParams = BizSolHelperFunction.getUrlVars
        ? BizSolHelperFunction.getUrlVars()
        : {};

    G_MRNType = decodeURI(urlParams['MRNType'] || '');
    if (G_MRNType && G_MRNType !== 'undefined') {
        if (G_MRNType == 'R') {
            $('#labelNameChange').text("MRN No");
        } else {
            $('#labelNameChange').text("GRN No");
        }
    }
    menuValue = decodeURI(urlParams['ModuleDesp'] || '');
    if (menuValue && menuValue !== 'undefined') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('Purchase Quality Check');
    }
    $('#locatePurchaseQualityCheck').hide();
    GetMRNQCPropertyList();
    GetQCPropertyTestTypeMaster();
    bindYearDropdown();
    GetMRNVendor();
    loadMRNMasterList();
    $('#btnSaveQualityCheck').on('click', function() {
        saveQualityCheckData();
    });
    
    $('#btnReset').on('click', function() {
        resetGrid();
    });
    $('#btnPrint').on('click', function() {
        printGrid();
    });
    // Back button clears entire form, selects, table and returns to grid
    $('#btnBack').on('click', handleBackButton);
    $("#ddlFinYear").change(function () {
        loadMRNMasterList();
        clearTable();
        $('#txtMRNDate').val('');
        $('#txtBillDate').val('');
        $('#txtBillNo').val('');
    });
});
function toggleMRNField(isView) {
    const $select = $('#txtMRNNo');
    const $input = $('#ViewMRNNo');
    if (!$select.length || !$input.length) return;

    try {
        if (isView) {
            // Hide select OR its select2 container and show plain input
            if ($select.data('select2')) {
                try { $select.select2('close'); } catch (e) {}
                const sel2 = $select.data('select2');
                if (sel2 && sel2.$container) sel2.$container.hide();
                // keep original select hidden (select2 hides original), but ensure it's disabled
                $select.prop('disabled', true);
            } else {
                $select.hide().prop('disabled', true);
            }
            $input.show().prop('disabled', true);
        } else {
            if ($select.data('select2')) {
                const sel2 = $select.data('select2');
                if (sel2 && sel2.$container) sel2.$container.show();
                $select.prop('disabled', false);
            } else {
                $select.show().prop('disabled', false);
            }
            $input.hide().prop('disabled', false);
        }
    } catch (ex) {
        console.error('Error toggling MRN field:', ex);
        if (isView) {
            $select.hide().prop('disabled', true);
            $input.show().prop('disabled', true);
        } else {
            $select.show().prop('disabled', false);
            $input.hide().prop('disabled', false);
        }
    }
}

// Added: toggle Party Name field between select/select2 and plain input for view mode
function togglePartyField(isView) {
    const $select = $('#ddlPartyName');
    const $input = $('#ViewPartyName');
    if (!$select.length || !$input.length) return;

    try {
        if (isView) {
            if ($select.data('select2')) {
                try { $select.select2('close'); } catch (e) {}
                const sel2 = $select.data('select2');
                if (sel2 && sel2.$container) sel2.$container.hide();
                $select.prop('disabled', true);
            } else {
                $select.hide().prop('disabled', true);
            }
            // show plain input and set its value from selected option text
            const selectedText = $select.find('option:selected').text() || '';
            $input.val(selectedText).show().prop('disabled', true);
        } else {
            if ($select.data('select2')) {
                const sel2 = $select.data('select2');
                if (sel2 && sel2.$container) sel2.$container.show();
                $select.prop('disabled', false);
            } else {
                $select.show().prop('disabled', false);
            }
            $input.hide().prop('disabled', false).val('');
        }
    } catch (ex) {
        console.error('Error toggling Party field:', ex);
        if (isView) {
            $select.hide().prop('disabled', true);
            $input.show().prop('disabled', true);
        } else {
            $select.show().prop('disabled', false);
            $input.hide().prop('disabled', false);
        }
    }
}
function handleBackButton() {
    try {
        clearTable();
        G_ChangedInputs = [];
        G_PurchaseQualityCheckData = [];
        G_PropertyColumns = [];

        $('#hfMRNMasterCode').val('0');

        const $container = $('#locatePurchaseQualityCheck');
        $container.find('input[type="text"], input[type="number"], input[type="hidden"], textarea').val('');

        $('#ddlFinYear').val('');
        $('#ddlPartyName').val(0);
        $('#txtMRNNo').val('');

        $('.changed-input').removeClass('changed-input');
        $('.is-invalid').removeClass('is-invalid');
        $('#locatePurchaseQualityCheck').hide();
        $('#dvGrid').show();
        $('#btnSaveQualityCheck').hide();
        $('#btnReset').hide();
        GetMRNQCPropertyList();

        G_IsViewMode = false;

        // Ensure MRN and Party fields are in select mode
        toggleMRNField(false);
        togglePartyField(false);
    } catch (ex) {
        console.error('Error handling back button:', ex);
        toastr.error('Error while clearing form. Please refresh the page.');
    }
}

function CreateNew() {
    var ModuleName = `${menuValue}`,
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#dvGrid').hide();
            $('#locatePurchaseQualityCheck').show();
            clearTable();
            G_ChangedInputs = [];
            G_PurchaseQualityCheckData = [];
            G_PropertyColumns = [];

            $('#hfMRNMasterCode').val('0');
            const $container = $('#locatePurchaseQualityCheck');

            $container.find('select, textarea').prop('disabled', false);

            $container.find('input[type="text"], input[type="number"], textarea').val('');

            $container.find('select').each(function () {
                const $sel = $(this);
                const defaultVal = $sel.data('default') !== undefined ? $sel.data('default') : '';
                $sel.val(defaultVal);
            });
            $('#ddlFinYear').val('');
            $('#ddlPartyName').val('0').trigger('change');
	        $('#txtMRNNo').val('').trigger('change');
            $('#txtBillNo').val('');

            $('.changed-input').removeClass('changed-input');
            $('.is-invalid').removeClass('is-invalid');
            $('#btnSaveQualityCheck').hide();
            $('#btnReset').hide();

            G_IsViewMode = false;

            // Ensure MRN and Party fields are in select mode
            toggleMRNField(false);
            togglePartyField(false);
        }
    });
}
function GetMRNQCPropertyList() {
    Showloader();
    PurchaseQualityCheckService.GetMRNQCPropertyList(G_MRNType).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            G_PurchaseQualityCheckDataList = response;
            const StringFilterColumn = ["Party Name","Bill No"];
            const NumericFilterColumn = ["MRN No"];
            const DateFilterColumn = ["MRN Date","Bill Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["MrnMaster_Code", "FinYear", "PartyMaster_Code", "Code","Verify"];
            const ColumnAlignment = { 'S.No.': 'center;width:10px', 'MRN Date': 'center','Bill Date':'center','MRN No':'center' };

            const updatedResponse = response.map((item) => {
                const mrnNo = (item['MRN No'] || item.MRNNo || item.MRN_NO || '').toString().replace(/'/g, "\\'");
                const finYear = (item.FinYear || '').toString().replace(/'/g, "\\'");
                const code = item.MrnMaster_Code || item.MrnMaster_Code || 0;

                let InputHTML = '';

                InputHTML = (item?.Verify || '').toString().toUpperCase() === 'Y'
                    ? `
                        <button class="btn btn-primary icon-height mb-1" title="Edit" disabled>
                            <i class="fa-solid fa-pencil"></i>
                        </button>&nbsp;
                        <button class="btn btn-primary icon-height mb-1" title="View" onclick="PurchaseQualityCheck_ViewData('${mrnNo}','${finYear}',${item.PartyMaster_Code},'${item?.['MRN Date']}','${item?.['Bill No']}','${item?.['Bill Date']}')">
                            <i class="fa-regular fa-eye"></i>
                        </button>&nbsp;
                        <button class="btn btn-success icon-height mb-1" title="Verify" disabled>
                            <i class="fa-solid fa-check"></i>
                        </button>&nbsp;
                        <button type="button" title="Print" class="btn btn-info btn-height" onclick="Print_PurchaseQualityCheck(${code})">
                            <i class="fa-solid fa-print"></i>
                        </button>&nbsp;
                        <button class="btn btn-danger icon-height mb-1" title="Delete" disabled>
                            <i class="fa-regular fa-circle-xmark"></i>
                        </button>`
                    : `
                        <button class="btn btn-primary icon-height mb-1" title="Edit" onclick="PurchaseQualityCheck_EditData('${mrnNo}','${finYear}')">
                            <i class="fa-solid fa-pencil"></i>
                        </button>&nbsp;
                        <button class="btn btn-primary icon-height mb-1" title="View" onclick="PurchaseQualityCheck_ViewData('${mrnNo}','${finYear}',${item.PartyMaster_Code},'${item?.['MRN Date']}','${item?.['Bill No']}','${item?.['Bill Date']}')">
                            <i class="fa-regular fa-eye"></i>
                        </button>&nbsp;
                        <button class="btn btn-success icon-height mb-1" title="Verify" onclick="Verify_PurchaseQualityCheck(${code})">
                            <i class="fa-solid fa-check"></i>
                        </button>&nbsp;
                        <button type="button" title="Print" class="btn btn-info btn-height" onclick="Print_PurchaseQualityCheck(${code})">
                            <i class="fa-solid fa-print"></i>
                        </button>&nbsp;
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${code}')">
                            <i class="fa-regular fa-circle-xmark"></i>
                        </button>`;

                return {
                    ...item,
                    'Action': InputHTML,
                };
            });
            
            BizsolCustomFilterGrid.CreateDataTable("table-header-locatePurchaseQualityCheckList", "table-body-locatePurchaseQualityCheckList", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false);
            
            $("#tbllocatePurchaseQualityCheckList").show();
        }
        else {
            toastr.error('No Data Found');
            $("#tbllocatePurchaseQualityCheckList").hide();
        }
    }).catch(function (error) {
        HideLoader();
        console.error('Error loading list:', error);
        toastr.error('Error loading list. Please try again.');
        $("#tbllocatePurchaseQualityCheckList").hide();
    });
}
function loadMRNMasterList() {
    const $mrnNo = $('#txtMRNNo');
    if (!$mrnNo.length) {
        return;
        //return Promise.resolve();
    }
    
    var PartyMaster_Code = $("#ddlPartyName").val() == null ? 0 : $("#ddlPartyName").val();
    var FinYear = $("#ddlFinYear").val() == null ? '' : $("#ddlFinYear").val();

    Showloader();
    return PurchaseQualityCheckService.GetMRNMasterDataForMRNNo(PartyMaster_Code, FinYear, G_MRNType)
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response) && response.length > 0) {
                G_MRNNoList = response;
                bindMRNDropdown(response);
                return ;
                //return Promise.resolve(response);
            } else {
                G_MRNNoList = [];
                $mrnNo.html('<option value="0">No MRN available</option>');
                clearMRNData();
                clearTable();
                return;
                //return Promise.resolve([]);
            }
        })
        .catch(function (error) {
            HideLoader();
            G_MRNNoList = [];
            $mrnNo.html('<option value="0">Please select..</option>');
            clearMRNData();
            clearTable();
            return ;
            //return Promise.resolve([]);
        });
}
function bindMRNDropdown(list) {
    const $mrnNo = $('#txtMRNNo');
    if (!$mrnNo.length) {
        return;
    }

    $mrnNo.off('change select2:select');
    $mrnNo.off('select2:open select2:close');

    let options = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const code = item.Code || item.code || 0;
        const mrnNo = item.MRNNo || item.MRN_NO || item.mrnNo || '';
        
        if (mrnNo) {
            options += `<option value="${mrnNo}" data-code="${code}" data-mrn-no="${mrnNo}">${mrnNo}</option>`;
        }
    });

    $mrnNo.html(options);

    try {
        if ($.fn.select2) {
            // Destroy existing select2 instance if it exists
            if ($mrnNo.hasClass('select2-hidden-accessible')) {
                $mrnNo.select2('destroy');
            }
            
            $mrnNo.select2({
                width: '100%',
                dropdownParent: $(document.body)
            });
            
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($mrnNo);
            } else {
                function preventScroll() {
                    const scrollY = window.scrollY || window.pageYOffset;
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.width = '100%';
                    document.body.setAttribute('data-scroll-y', scrollY);
                }

                function restoreScroll() {
                    const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, parseInt(scrollY));
                    document.body.removeAttribute('data-scroll-y');
                }

                $mrnNo.on('select2:open', preventScroll);
                $mrnNo.on('select2:close', restoreScroll);
            }
            
            $mrnNo.on('change select2:select', function () {
                const mrnNo = $(this).val();
                if (mrnNo && mrnNo !== '0' && mrnNo !== '') {
                    const selectedMRNData = G_MRNNoList.find(function(item) {
                        return (item.MRNNo === mrnNo || item.MRN_NO === mrnNo || item.mrnNo === mrnNo);
                    });
                    
                    if (selectedMRNData) {
                        if (selectedMRNData.ReceiveDate) {
                            $('#txtMRNDate').val(selectedMRNData.ReceiveDate);
                        }
                        
                        if (selectedMRNData.BillDate) {
                            $('#txtBillDate').val(selectedMRNData.BillDate);
                        }
                        
                        if (selectedMRNData.BillNo) {
                            $('#txtBillNo').val(selectedMRNData.BillNo);
                        }
                        if (selectedMRNData.PartyMaster_Code !== undefined && selectedMRNData.PartyMaster_Code !== null) {
                            const partyVal = String(selectedMRNData.PartyMaster_Code);
                            const $ddlParty = $('#ddlPartyName');

                            // If an option with this value exists, select by value
                            if ($ddlParty.find(`option[value="${partyVal}"]`).length > 0) {
                                $ddlParty.val(partyVal);
                                if ($ddlParty.data('select2')) {
                                    $ddlParty.trigger('change.select2');
                                } else {
                                    $ddlParty.trigger('change');
                                }
                            } else {
                                // Fallback: try selecting by visible text using likely fields
                                const candidateText = (selectedMRNData.PartyName || selectedMRNData.PartyDesp || selectedMRNData.AccountDesp || selectedMRNData.Party || selectedMRNData.PartyMaster_Desp || '').toString().trim();
                                if (candidateText) {
                                    BizSolHelperFunction.SelectOptionByText('ddlPartyName', candidateText);
                                    if ($ddlParty.data('select2')) {
                                        $ddlParty.trigger('change.select2');
                                    } else {
                                        $ddlParty.trigger('change');
                                    }
                                } else {
                                    // If no display name available, leave dropdown unchanged
                                    console.warn('Party display name not available for MRN data, cannot select by text.');
                                }
                            }
                        }
                    }
                    
                    let mrnMasterCode = mrnNo;
                    if (mrnMasterCode && mrnMasterCode !== 0) {
                        $('#hfMRNMasterCode').val(mrnMasterCode);
                        loadPurchaseQualityCheckData(mrnMasterCode);
                    } else {
                        toastr.warning('Unable to get MRN Master Code. Please select a valid MRN.');
                    }
                } else {
                    $('#txtMRNDate').val('');
                    $('#txtBillDate').val('');
                    $('#txtBillNo').val('');
                    clearMRNData();
                    clearTable();
                }
            });
        }
    } catch (e) {
        toastr.error('Error initializing select2 for MRN No:', e);
    }
}
function clearMRNData() {
    $('#hfMRNMasterCode').val('0');
}
function loadPurchaseQualityCheckData(mrnMasterCode) {
    if (!mrnMasterCode || mrnMasterCode === 0) {
        toastr.warning('Please select MRN NO first.');
        return;
    }
    
    if (!G_SelectedTestTypeCodes || G_SelectedTestTypeCodes.length === 0) {
        toastr.warning('Please select at least one Test Type.');
        return;
    }

    Showloader();
    PurchaseQualityCheckService.PurchaseQualityCheckList(mrnMasterCode, G_SelectedTestTypeCodes)
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response) && response.length > 0) {
                if (response[0].Status2 == 'Y') {
                    G_PurchaseQualityCheckData = response;
                    buildQualityCheckTable(response);
                } else {
                    toastr.warning(response[0].Msg);
                    clearTable();
                }
        } else {
                toastr.warning('No data found for the selected MRN.');
                clearTable();
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error loading data. Please try again.');
        });
}
function buildQualityCheckTable(data) {
    if (!data || data.length === 0) {
        clearTable();
        toastr.warning('No data to display');
        return;
    }

    if (!checkTableExists()) {
        toastr.error('Table structure not found. Please refresh the page.');
        return;
    }

    const standardColumns = ['MRNMaster_Code', 'MRNDetail_Code', 'ItemMaster_Code', 'ItemCode', 'ItemName', 'ItemDisplayName'];
    const allColumns = Object.keys(data[0]).filter(key => !standardColumns.includes(key));
    
    const propertyMap = {}; 
    allColumns.forEach(function(colName) {
        const match = colName.match(/^(.+)_(\d+|Default)_(Value|Validate|ValueType|QCPropertyMaster_Code)$/);
        if (match) {
            const propertyName = match[1];
            const testTypeCode = match[2];
            const type = match[3];
            
            if (!propertyMap[propertyName]) {
                propertyMap[propertyName] = {};
            }
            if (!propertyMap[propertyName][testTypeCode]) {
                propertyMap[propertyName][testTypeCode] = {};
            }
            const typeKey = type === 'QCPropertyMaster_Code' ? 'qcPropertyMasterCode' : type.toLowerCase();
            propertyMap[propertyName][testTypeCode][typeKey] = colName;
        }
    });
    
    const propertyNames = Object.keys(propertyMap).sort();
    
    // Show table wrapper and buttons
    $('.table-wrapper').show();
    $('#btnPrint').show();

    // Show or hide Save/Reset depending on view mode flag
    if (G_IsViewMode) {
        $('#btnSaveQualityCheck').hide();
        $('#btnReset').hide();
    } else {
    $('#btnSaveQualityCheck').show();
    $('#btnReset').show();
    }
    
    G_ChangedInputs = [];
    
    buildDynamicTableHeader(propertyMap, propertyNames);
    buildDynamicTableBody(data, propertyMap, propertyNames);
}
function buildDynamicTableHeader(propertyMap, propertyNames) {
    const $thead = $('#table-header');
    if (!$thead.length) {
        return;
    }

    $thead.empty();

    let row1 = '<tr>' +
               '<th rowspan="2" class="qc-item-cell align-middle text-center" style="min-width: 40px;">SNo</th>' +
               '<th rowspan="2" class="qc-item-cell align-middle" style="min-width: 80px;">Item Code</th>' +
               '<th rowspan="2" class="qc-item-cell align-middle" style="min-width: 200px;">Item Name</th>'+
               '<th rowspan="2" class="qc-item-cell align-middle" style="min-width: 200px;">Specification</th>'+
               '<th rowspan="2" class="qc-item-cell align-middle" style="min-width: 80px;">Status</th>'+
               '<th rowspan="2" class="qc-item-cell align-middle" style="min-width: 120px;">Warehouse</th>';
    
    propertyNames.forEach(function(propertyName) {
        const testTypeCodes = Object.keys(propertyMap[propertyName]);
        const colspan = testTypeCodes.length;
        row1 += `<th colspan="${colspan}" class="qc-property-header text-center">${propertyName}</th>`;
    });
    
    row1 += '</tr>';

    let row2 = '<tr class="qc-property-subheader">';
    
    propertyNames.forEach(function(propertyName) {
        const testTypeCodes = Object.keys(propertyMap[propertyName]).sort();
        
        testTypeCodes.forEach(function(testTypeCode) {
            // Find test type name from selected test types
            let testTypeName = testTypeCode;
            const testType = G_SelectedTestTypes.find(t => String(t.code) === String(testTypeCode));
            if (testType) {
                testTypeName = testType.name;
            }
            
            row2 += `<th class="qc-property-subheader text-center" style="min-width: 100px;">${testTypeName}</th>`;
        });
    });
    
    row2 += '</tr>';
    
    $thead.html(row1 + row2);
}
function buildDynamicTableBody(data, propertyMap, propertyNames) {
    const $tbody = $('#table-body');
    if (!$tbody.length) {
        return;
    }

    $tbody.empty();

    // Determine view mode
    const isView = G_IsViewMode === true;

    data.forEach(function (item, itemIndex) {
        let row = `<tr data-mrn-master-code="${item.MRNMaster_Code || ''}" 
                       data-mrn-detail-code="${item.MRNDetail_Code || ''}" 
                       data-item-code="${item.ItemMaster_Code || ''}">`;
        
        const serialNumber = itemIndex + 1;
        row += `<td class="qc-item-cell text-center">${serialNumber}</td>`;
        
        const itemCode = item.ItemCode || '';
        row += `<td class="qc-item-cell">${itemCode}</td>`;

        const itemName = item.ItemName || '';
        row += `<td class="qc-item-cell">${itemName}</td>`;

        const specification = item.Specification || '';
        row += `<td class="qc-item-cell">${specification}</td>`;
        
        const status = item.Status || '';
        // Fixed status select - ensure only the correct option is selected
        const isAccepted = status === 'A' || status === 'a';
        const isRejected = status === 'R' || status === 'r';
        
        // Use unique ID with MRNDetail_Code to avoid conflicts
        const statusSelectId = `status_${item.MRNDetail_Code}_${item.ItemMaster_Code}`;
        row += `<td class="qc-item-cell">
                    <select class="form-control form-control-sm status-select" 
                            id="${statusSelectId}" 
                            data-mrn-detail-code="${item.MRNDetail_Code || ''}" 
                            data-item-code="${item.ItemMaster_Code || ''}" ${isView ? 'disabled' : ''}>
                        <option value="">Select...</option>
                        <option value="A" ${isAccepted ? 'selected' : ''}>Accepted</option>
                        <option value="R" ${isRejected ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>`;

        // Render a dropdown for Godown/Warehouse. We'll populate options after table body is created.
        const currentGodownName = item.GodownName || '';
        const currentGodownCode = item.Godown_Code || item.WarehouseMaster_Code || item.GodownId || '';
        
        // Use unique ID with MRNDetail_Code to avoid conflicts
        const godownSelectId = `godown_${item.MRNDetail_Code}_${item.ItemMaster_Code}`;
        row += `<td class="qc-item-cell">
                    <select class="form-control form-control-sm godown-select" 
                            id="${godownSelectId}" 
                            data-item-code="${item.ItemMaster_Code || ''}"
                            data-mrn-detail-code="${item.MRNDetail_Code || ''}"
                            data-current-name="${currentGodownName}"
                            data-current-code="${currentGodownCode}" ${isView ? 'disabled' : ''}>
                        <option value="">Please select...</option>
                    </select>
                </td>`;
        
        propertyNames.forEach(function (propertyName) {
            const testTypeCodes = Object.keys(propertyMap[propertyName]).sort();
            
            testTypeCodes.forEach(function (testTypeCode) {
                const columns = propertyMap[propertyName][testTypeCode];
                
                // Get values from data
                const valueColName = columns.value;
                const validateColName = columns.validate;
                const valueTypeColName = columns.valuetype;
                const qcPropertyMasterCodeColName = columns.qcPropertyMasterCode;
                
                const fieldValue = item[valueColName] || '';
                const validateValue = item[validateColName] || '';
                const valueType = item[valueTypeColName] || '';
                const qcPropertyMasterCode = item[qcPropertyMasterCodeColName] || '';
                
                // Check if disabled
                const isDisabled = fieldValue === '[DISABLED]';
                const cellClass = isDisabled ? 'qc-disabled' : 'qc-property-cell';
                
                // Create unique input ID with MRNDetail_Code
                const inputId = `qc_${propertyName.replace(/\s+/g, '_')}_${testTypeCode}_${item.MRNDetail_Code}_${item.ItemMaster_Code}`;
                
                if (isDisabled) {
                    // Disabled cell
                    row += `<td class="${cellClass} text-center">
                        <span class="text-muted">DISABLED</span>
                    </td>`;
                } else if (valueType === 'Lov' && validateValue) {
                    // LOV type - create dropdown
                    const lovOptions = validateValue.split(',').map(v => v.trim());
                    let selectHtml = `<select class="form-control form-control-sm property-input" 
                                              id="${inputId}" 
                                              autocomplete="off"
                                              data-property="${propertyName}"
                                              data-property-code="${qcPropertyMasterCode}"
                                              data-testtype="${testTypeCode}"
                                              data-valuetype="${valueType}"
                                              data-item-code="${item.ItemMaster_Code}"
                                              data-mrn-master-code="${item.MRNMaster_Code}"
                                              data-mrn-detail-code="${item.MRNDetail_Code}" ${isView ? 'disabled' : ''}>
                        <option value="">Select...</option>`;
                    
                    lovOptions.forEach(function(option) {
                        const selected = fieldValue === option ? 'selected' : '';
                        selectHtml += `<option value="${option}" ${selected}>${option}</option>`;
                    });
                    
                    selectHtml += '</select>';
                    row += `<td class="${cellClass}">${selectHtml}</td>`;
                } else {
                    // Text or numeric input
                    const inputType = valueType === 'Numeric' ? 'text' : 'text';
                    const placeholder = validateValue || 'Enter value';
                    const numericClass = valueType === 'Numeric' ? 'numeric-input' : '';
                    
                    const textAlignStyle = valueType === 'Numeric' ? 'style="text-align: right;"' : '';
                    
                    row += `<td class="${cellClass}">
                        <input type="${inputType}" 
                               class="form-control form-control-sm property-input ${numericClass}" 
                               id="${inputId}"
                               autocomplete="off"
                               ${textAlignStyle}
                               data-property="${propertyName}"
                               data-property-code="${qcPropertyMasterCode}"
                               data-testtype="${testTypeCode}"
                               data-valuetype="${valueType}"
                               data-validate="${validateValue}"
                               data-item-code="${item.ItemMaster_Code}"
                               data-mrn-master-code="${item.MRNMaster_Code}"
                               data-mrn-detail-code="${item.MRNDetail_Code}"
                               value="${fieldValue}"
                               placeholder="${placeholder}"
                               title="${validateValue ? 'Allowed: ' + validateValue : ''}" ${isView ? 'disabled' : ''}>
                    </td>`;
                }
            });
        });
        
        row += '</tr>';
        $tbody.append(row);
    });
    
    $tbody.find('.property-input').on('change', function() {
        // ignore changes if view mode
        if (G_IsViewMode) return;
        handlePropertyInputChange($(this));
    });

    $tbody.find('.numeric-input').on('input', function(e) {
        restrictNumericInput($(this), e);
    });
    
    $tbody.find('.numeric-input').on('paste', function(e) {
        const $input = $(this);
        setTimeout(function() {
            restrictNumericInput($input, null);
        }, 10);
    });
    
    // Populate all godown selects using the service (filtered by status: Accepted = no "Store Rejected", Rejected = only "Store Rejected")
    bindGodownNameDropdown().then(function(godownList) {
        try {
            if (!Array.isArray(godownList)) {
                godownList = [];
            }

            $tbody.find('tr').each(function() {
                const $row = $(this);
                const $statusSelect = $row.find('.status-select');
                const $godownSelect = $row.find('.godown-select');
                if (!$godownSelect.length) return;

                const status = $statusSelect.length ? $statusSelect.val() : '';
                const filteredGodowns = getGodownListByStatus(godownList, status);
                const currentName = $godownSelect.data('current-name') || '';
                const currentCode = $godownSelect.data('current-code') || '';

                let options = '<option value="">Please select...</option>';
                filteredGodowns.forEach(function(g) {
                    const code = g.Code || g.code || g.WarehouseMaster_Code || g.GodownId || 0;
                    const name = g.GodownName || g.godownName || g.Name || g.Description || '';
                    if (!name) return;
                    const selected = (String(code) === String(currentCode) || String(name) === String(currentName)) ? 'selected' : '';
                    options += `<option value="${code}" data-name="${name}" ${selected}>${name}</option>`;
                });

                $godownSelect.html(options);

                if (isView) {
                    $godownSelect.prop('disabled', true);
                }
            });

            // Handle change event to mark changed inputs - use event delegation to prevent conflicts
            $tbody.off('change', '.godown-select').on('change', '.godown-select', function(e) {
                e.stopPropagation();
                const $s = $(this);
                if (G_IsViewMode) return;
                $s.addClass('changed-input');
                console.log('Godown changed for MRNDetail', $s.data('mrn-detail-code'), 'value', $s.val());
            });

            // On status change: refresh warehouse options for this row and mark changed
            $tbody.off('change', '.status-select').on('change', '.status-select', function(e) {
                e.stopPropagation();
                const $statusSelect = $(this);
                if (G_IsViewMode) return;
                $statusSelect.addClass('changed-input');
                console.log('Status changed for MRNDetail', $statusSelect.data('mrn-detail-code'), 'value', $statusSelect.val());

                const $row = $statusSelect.closest('tr');
                const $godownSelect = $row.find('.godown-select');
                if (!$godownSelect.length || !G_GodownList.length) return;

                const status = $statusSelect.val();
                const filteredGodowns = getGodownListByStatus(G_GodownList, status);
                const currentVal = $godownSelect.val();
                const currentOpt = $godownSelect.find('option:selected');
                const currentName = currentOpt.length ? currentOpt.data('name') || currentOpt.text() : '';

                let options = '<option value="">Please select...</option>';
                let currentValStillValid = false;
                filteredGodowns.forEach(function(g) {
                    const code = g.Code || g.code || g.WarehouseMaster_Code || g.GodownId || 0;
                    const name = g.GodownName || g.godownName || g.Name || g.Description || '';
                    if (!name) return;
                    const selected = (String(code) === String(currentVal) || name === currentName) ? 'selected' : '';
                    if (String(code) === String(currentVal) || name === currentName) currentValStillValid = true;
                    options += `<option value="${code}" data-name="${name}" ${selected}>${name}</option>`;
                });

                $godownSelect.html(options);
                if (!currentValStillValid && currentVal) {
                    $godownSelect.addClass('changed-input');
                }
            });
        } catch (ex) {
            console.error('Error populating godown selects', ex);
        }
    }).catch(function(err) {
        console.error('Error fetching godown list', err);
    });
}
function restrictNumericInput($input, e) {
    let value = $input.val();
    const originalValue = value;
    
    value = value.replace(/[^\d.]/g, '');
    
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    if (value.startsWith('.')) {
        value = '0.' + value.substring(1);
    }
    
    if (originalValue !== value) {
        $input.val(value);
    }
}
function validateNumericValue(value) {
    if (!value || value === '') {
        return true;
    }
    
    if (isNaN(value)) {
        return false;
    }
    
    const parts = value.toString().split('.');
    if (parts.length === 2 && parts[1].length > 2) {
        return false;
    }
    
    return true;
}
function handlePropertyInputChange($input) {
    const property = $input.data('property');
    const propertyCode = $input.data('property-code');
    const testType = $input.data('testtype');
    const valueType = $input.data('valuetype');
    const itemCode = $input.data('item-code');
    const mrnMasterCode = $input.data('mrn-master-code');
    const mrnDetailCode = $input.data('mrn-detail-code');
    let value = $input.val();
    
    console.log('Property changed:', {
        property: property,
        propertyCode: propertyCode,
        testType: testType,
        itemCode: itemCode,
        mrnMasterCode: mrnMasterCode,
        mrnDetailCode: mrnDetailCode,
        value: value,
        valueType: valueType
    });
    
    // Validate numeric value type
    if (valueType === 'Numeric' && value && value !== '') {
        // Remove leading/trailing spaces
        value = value.trim();
        
        if (!validateNumericValue(value)) {
            toastr.warning('Please enter a valid numeric value with maximum 2 decimal places.');
            $input.addClass('is-invalid');
            // Format the value to max 2 decimal places
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                const parts = value.split('.');
                // Only format if there are more than 2 decimal places
                if (parts.length === 2 && parts[1].length > 2) {
                    value = numValue.toFixed(2);
                    $input.val(value);
                }
            }
            return;
        }
        
        // Ensure max 2 decimal places (but don't force 2 decimals if user entered whole number)
        const parts = value.split('.');
        if (parts.length === 2 && parts[1].length > 2) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                value = numValue.toFixed(2);
                $input.val(value);
            }
        }
    }
    
    // Validate based on valueType
    if (valueType && valueType !== 'Lov') {
        const validateRule = $input.data('validate');
        if (validateRule && value) {
            // Check if it's a range (e.g., "10-20")
            const rangeMatch = validateRule.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
            if (rangeMatch) {
                const min = parseFloat(rangeMatch[1]);
                const max = parseFloat(rangeMatch[2]);
                const numValue = parseFloat(value);
                
                if (!isNaN(numValue) && (numValue < min || numValue > max)) {
                    toastr.warning(`Value should be between ${min} and ${max}`);
                    $input.addClass('is-invalid');
                    return;
                }
            }
        }
    }
    
    $input.removeClass('is-invalid');
    
    // Track this change for batch save
    const changeData = {
        code: 0,
        mrnMaster_Code: parseInt(mrnMasterCode) || 0,
        mrnDetail_Code: parseInt(mrnDetailCode) || 0,
        qcPropertyMaster_Code: parseInt(propertyCode) || 0,
        testTypeMaster_Code: parseInt(testType) || 0,
        result: value
    };
    
    // Remove existing change for this combination if exists
    const existingIndex = G_ChangedInputs.findIndex(item => 
        item.mrnDetail_Code === changeData.mrnDetail_Code &&
        item.qcPropertyMaster_Code === changeData.qcPropertyMaster_Code &&
        item.testTypeMaster_Code === changeData.testTypeMaster_Code
    );
    
    if (existingIndex > -1) {
        G_ChangedInputs[existingIndex] = changeData;
    } else {
        G_ChangedInputs.push(changeData);
    }
    
    // Mark input as changed (add visual indicator)
    $input.addClass('changed-input');
    
    console.log('Tracked changes:', G_ChangedInputs.length);
    
    // DO NOT auto-update status - let user control it manually
    // Removed all auto-status update logic to prevent interference with dropdown selections
}
function GetQCPropertyTestTypeMaster() {
    const $container = $('#chkTestType');
    if (!$container.length) {
        return;
    }

    $container.empty();
    G_SelectedTestTypes = []; 
    G_HeaderTestTypeSelections = [];
    
    Showloader();
    
    QCPropertyTestTypeMasterService.QCPropertyTestTypeMasterList()
        .then(function (response) {
            HideLoader();
            
            if (response && Array.isArray(response) && response.length > 0) {
                response.sort(function(a, b) {
                    const sortOrderA = a['Sort Order'] || a.SortOrder || 0;
                    const sortOrderB = b['Sort Order'] || b.SortOrder || 0;
                    return sortOrderA - sortOrderB;
                });
               
                let firstCheckboxAdded = false;
                response.forEach(function(testType) {
                    const code = testType.Code || testType.code || 0;
                    const testTypeName = testType['Test Type'] || testType.TestType || testType.testType || '';
                    const active = testType.Active || testType.active || 'YES';
                    
                    if (active === 'YES' || active === 'Y' || active === true) {
                        const checkboxId = 'chkHeaderTestType_' + code;
                        const isFirst = !firstCheckboxAdded;
                        firstCheckboxAdded = true;
                        
                        const checkboxHtml = `
                            <span class="form-check form-check-inline">
                                <input class="form-check-input header-test-type-checkbox" 
                                       type="checkbox" 
                                       id="${checkboxId}" 
                                       name="chkHeaderTestType" 
                                       value="${code}" 
                                       data-test-type="${testTypeName}"
                                       data-test-code="${code}"
                                       ${isFirst ? 'checked' : ''}>
                                <label class="form-check-label" for="${checkboxId}">
                                    ${testTypeName}
                                </label>
                            </span>
                        `;
                        
                        $container.append(checkboxHtml);
                    }
                });
                $container.find('.header-test-type-checkbox').on('change', function () {
                    handleHeaderTestTypeCheckboxChange($(this));
                });
                
                // Check the first checkbox by default and trigger its change handler
                const $firstCheckbox = $container.find('.header-test-type-checkbox').first();
                if ($firstCheckbox.length > 0) {
                    $firstCheckbox.prop('checked', true);
                    handleHeaderTestTypeCheckboxChange($firstCheckbox);
                }
                
            } else {
                HideLoader();
                toastr.warning('No Test Types available');
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error loading Test Types. Please try again.');
        });
}
function handleHeaderTestTypeCheckboxChange($checkbox) {
    const testTypeName = $checkbox.data('test-type') || '';
    const testTypeCode = $checkbox.data('test-code') || $checkbox.val();
    const isChecked = $checkbox.is(':checked');

    if (isChecked) {
        if (G_HeaderTestTypeSelections.indexOf(testTypeName) === -1) {
            G_HeaderTestTypeSelections.push(testTypeName);
        }
        
        const exists = G_SelectedTestTypes.find(t => t.code === testTypeCode);
        if (!exists) {
            G_SelectedTestTypes.push({
                code: testTypeCode,
                name: testTypeName
            });
        }
        
        console.log('Test Type selected:', testTypeName, 'Code:', testTypeCode);
    } else {
        // Check if this is the last selected test type
        if (G_SelectedTestTypes.length === 1) {
            toastr.warning('At least one Test Type must be selected.');
            $checkbox.prop('checked', true);
            return;
        }
        
        const index = G_HeaderTestTypeSelections.indexOf(testTypeName);
        if (index > -1) {
            G_HeaderTestTypeSelections.splice(index, 1);
        }
        
        const testTypeIndex = G_SelectedTestTypes.findIndex(t => t.code === testTypeCode);
        if (testTypeIndex > -1) {
            G_SelectedTestTypes.splice(testTypeIndex, 1);
        }
        
        console.log('Test Type deselected:', testTypeName, 'Code:', testTypeCode);
    }

    // Update selected test types display
    updateSelectedTestTypes();
    
    // Reload data if MRN is selected
    const mrnNo = $('#txtMRNNo').val();
    if (mrnNo && mrnNo !== '0' && mrnNo !== '') {
        const mrnMasterCode = mrnNo;
        if (mrnMasterCode && mrnMasterCode !== 0) {
            loadPurchaseQualityCheckData(mrnMasterCode);
        }
    }
}
function updateSelectedTestTypes() {
    const selectedNames = [];
    const selectedCodes = [];
    
    // Collect selected test types
    $('#chkTestType .header-test-type-checkbox:checked').each(function () {
        const testTypeName = $(this).data('test-type') || '';
        const testTypeCode = $(this).data('test-code') || $(this).val();
        
        if (testTypeName) {
            selectedNames.push(testTypeName);
        }
        if (testTypeCode) {
            selectedCodes.push(testTypeCode);
        }
    });
    
    // Update global variable with selected codes
    G_SelectedTestTypeCodes = selectedCodes;
    
    // Update txtTestType field with selected names (comma-separated)
    $('#txtTestType').val(selectedNames.join(', '));
    
    console.log('Selected Test Type Codes:', G_SelectedTestTypeCodes);
}
function checkTableExists() {
    const $table = $('#tblPurchaseQualityCheck');
    const $thead = $('#table-header');
    const $tbody = $('#table-body');
    
    if (!$table.length || !$thead.length || !$tbody.length) {
        console.error('Table structure not found. Please ensure table exists in HTML.');
        return false;
    }
    return true;
}
function clearTable() {
    $('#table-header').empty();
    $('#table-body').empty();
    $('.table-wrapper').hide();
    $('#btnSaveQualityCheck').hide();
    $('#btnReset').hide();
    $('#btnPrint').hide();
    G_PurchaseQualityCheckData = [];
    G_PropertyColumns = [];
}
function saveQualityCheckData() {
    var ModuleName = `${menuValue}`,
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const mrnMasterCode = $('#hfMRNMasterCode').val();
            if (!mrnMasterCode || mrnMasterCode === '0') {
                toastr.error('Please select MRN NO.');
                return;
            }

            if (!G_SelectedTestTypeCodes || G_SelectedTestTypeCodes.length === 0) {
                toastr.error('Please select at least one Test Type.');
                return;
            }

            // Mandatory: Status and Warehouse must be selected for every detail row
            let mandatoryError = '';
            $('#table-body tr').each(function () {
                const $tr = $(this);
                const mrnDetailCode = $tr.data('mrn-detail-code') || 0;
                if (!mrnDetailCode) return;

                const $status = $tr.find('.status-select');
                const $godown = $tr.find('.godown-select');
                const statusVal = $status.length ? ($status.val() || '').trim() : '';
                const godownVal = $godown.length ? ($godown.val() || '').trim() : '';

                if (!statusVal) {
                    mandatoryError = 'Please select Status for all rows (Accepted or Rejected).';
                    return false; // break
                }
                if (!godownVal) {
                    mandatoryError = 'Please select Warehouse for all rows.';
                    return false;
                }
            });
            if (mandatoryError) {
                toastr.error(mandatoryError);
                return;
            }

            const dataToSave = [];
            
            // Group by MRNDetail to collect status and godown per row
            const detailMap = new Map();
            
            // First collect status and godown per detail
            $('#table-body tr').each(function () {
                const $tr = $(this);
                const mrnDetailCode = $tr.data('mrn-detail-code') || 0;
                if (!mrnDetailCode) return;
                
                const $status = $tr.find('.status-select');
                const $godown = $tr.find('.godown-select');
                
                const statusVal = $status.length ? $status.val() : '';
                const godownVal = $godown.length ? $godown.val() : '';
                
                detailMap.set(mrnDetailCode, {
                    status: statusVal || null,
                    WarehouseMaster_Code: godownVal ? parseInt(godownVal) : null
                });
            });
            
            // Now collect property inputs and merge with detail info
            $('.property-input').each(function () {
                const $input = $(this);
                const value = $input.val();

                // Skip if disabled or empty
                if ($input.prop('disabled') || !value || value === '' || value === null || value === undefined) {
                    return;
                }

                // Skip if it's a select dropdown with "Select..." option selected
                if ($input.is('select') && (value === '' || value === '0')) {
                    return;
                }

                const propertyCode = $input.data('property-code');
                const testType = $input.data('testtype');
                const mrnMasterCode = $input.data('mrn-master-code');
                const mrnDetailCode = $input.data('mrn-detail-code');

                // Only add if we have all required data
                if (propertyCode && testType && mrnMasterCode && mrnDetailCode) {
                    const detailInfo = detailMap.get(mrnDetailCode) || {};
                    
                    const record = {
                        code: 0,
                        mrnMaster_Code: parseInt(mrnMasterCode) || 0,
                        mrnDetail_Code: parseInt(mrnDetailCode) || 0,
                        qcPropertyMaster_Code: parseInt(propertyCode) || 0,
                        testTypeMaster_Code: parseInt(testType) || 0,
                        result: value.trim()
                    };
                    
                    // Add status only if it has a value (backend expects char, so send single char or null)
                    if (detailInfo.status && detailInfo.status !== '') {
                        record.status = detailInfo.status.charAt(0); // Take first character only
                    }
                    
                    // Add WarehouseMaster_Code only if it has a value
                    if (detailInfo.WarehouseMaster_Code !== null && detailInfo.WarehouseMaster_Code !== undefined) {
                        record.WarehouseMaster_Code = detailInfo.WarehouseMaster_Code;
                    }
                    
                    dataToSave.push(record);
                }
            });

            if (dataToSave.length === 0) {
                toastr.warning('No data to save. Please fill at least one field.');
                return;
            }

            const invalidRecords = dataToSave.filter(item =>
                !item.qcPropertyMaster_Code || item.qcPropertyMaster_Code === 0 ||
                !item.mrnMaster_Code || item.mrnMaster_Code === 0 ||
                !item.mrnDetail_Code || item.mrnDetail_Code === 0 ||
                !item.testTypeMaster_Code || item.testTypeMaster_Code === 0
            );

            if (invalidRecords.length > 0) {
                toastr.error('Some records are missing required data. Please check the data.');
                return;
            }

            // Send the array directly, NOT wrapped in an object
            Showloader();

            PurchaseQualityCheckService.SaveMRNQCPropertyResult(dataToSave)
                .then(function (response) {
                    if (response.Status == 'Y') {
                        toastr.success(response.Msg || 'Data saved successfully.');
                        G_ChangedInputs = [];
                        $('.property-input').removeClass('changed-input');
                        // Remove changed class from status and godown selects
                        $('.status-select').removeClass('changed-input');
                        $('.godown-select').removeClass('changed-input');
                    } else {
                        toastr.error(response.Msg || 'Error saving data.');
                    }
                    HideLoader();
                    const mrnNo = $('#txtMRNNo').val();
                    if (mrnNo && mrnNo !== '0') {
                        loadPurchaseQualityCheckData(mrnNo);
                    }
                })
                .catch(function (error) {
                    HideLoader();
                    toastr.error('Error saving data. Please try again.');
                });
        }
    });
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
function resetGrid() {
    if (!confirm('Are you sure you want to reset all values in the grid? This will clear all entered data.')) {
        return;
    }
    G_ChangedInputs = [];
    const mrnNo = $('#txtMRNNo').val();
    if (mrnNo && mrnNo !== '0' && mrnNo !== '') {
        const mrnMasterCode = mrnNo;
        if (mrnMasterCode && mrnMasterCode !== 0) {
            loadPurchaseQualityCheckData(mrnMasterCode);
        }
    }
}
function printGrid() {
    if (!confirm('Are you sure you want to Print the grid')) {
        return;
    }
    G_ChangedInputs = [];
    const mrnNo = $('#txtMRNNo').val();
    ////if (mrnNo && mrnNo !== '0' && mrnNo !== '') {
    ////    const mrnMasterCode = mrnNo;
    ////    if (mrnMasterCode && mrnMasterCode !== 0) {
    ////        loadPurchaseQualityCheckData(mrnMasterCode);
    ////    }
    //}
}
function SavePurchaseQualityCheck() {
    saveQualityCheckData();
}
function bindYearDropdown() {
    const $dropdown = $('#ddlFinYear');
    if (!$dropdown.length) {
        console.warn('Fin Year dropdown element not found');
        return;
    }
    Showloader();
    PurchaseQualityCheckService.GetFinYear()
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response) && response.length > 0) {
                let options = '<option value="">Please select...</option>';
                
                response.forEach(function (item) {
                    const finYear = item.FinYear || item.finYear || item.FinYearValue || '';
                    if (finYear) {
                        options += `<option value="${finYear}">${finYear}</option>`;
                    }
                });
                
                $dropdown.html(options);
            } else {
                HideLoader();
                toastr.warning('No Financial Year data found');
                $dropdown.html('<option value="">Please select...</option>');
            }
        })
        .catch(function (error) {
            HideLoader();
            toastr.error('Error loading Financial Year list. Please try again.');
            $dropdown.html('<option value="">Please select...</option>');
        });
}
/** Returns godown list filtered by QC status: Accepted = exclude "Store Rejected", Rejected = only "Store Rejected". */
function getGodownListByStatus(godownList, status) {
    if (!Array.isArray(godownList)) return [];
    const statusVal = (status || '').toString().trim().toUpperCase();
    return godownList.filter(function(g) {
        const name = (g.GodownName || g.godownName || g.Name || g.Description || '').toString().trim();
        const isStoreRejected = name.toLowerCase() === 'store rejected';
        if (statusVal === 'A') return !isStoreRejected;  // Accepted: exclude Store Rejected
        if (statusVal === 'R') return isStoreRejected;   // Rejected: only Store Rejected
        return true;  // No status: show all
    });
}

function bindGodownNameDropdown() {
    // Return a promise that resolves with the godown list array so callers can populate selects.
    return PurchaseQualityCheckService.GetGodownNameList().then(function(response) {
        if (response && Array.isArray(response)) {
            G_GodownList = response;
            return response;
        }
        G_GodownList = [];
        return [];
    }).catch(function(err) {
        console.error('Error in GetGodownNameList', err);
        G_GodownList = [];
        return [];
    });
}
function GetMRNVendor() {
    const $PartyName = $('#ddlPartyName');
    if (!$PartyName.length) {
        return;
    }

    Showloader();
    PurchaseQualityCheckService.GetMRNVendor()
        .then(function (response) {
            HideLoader();
            if (response && Array.isArray(response) && response.length > 0) {
                bindVendorDropdown(response);
            } else {
                toastr.warning('No vendor data found');
                $PartyName.html('<option value="0">No vendor available</option>');
            }
        })
        .catch(function (error) {
            HideLoader();
            console.error('Error loading vendor list:', error);
            toastr.error('Error loading vendor list. Please try again.');
        });
}
function bindVendorDropdown(list) {
    const $PartyName = $('#ddlPartyName');
    if (!$PartyName.length) {
        return;
    }

    let options = '<option value="0">Please select..</option>';

    (list || []).forEach(function (item) {
        const code = item.Code || item.code || 0;
        const partyName = item.AccountDesp || item.accountDesp || '';

        if (partyName && code && code !== 0) {
            options += `<option value="${code}" data-code="${code}">${partyName}</option>`;
        }
    });

    $PartyName.html(options);

    try {
        if ($.fn.select2) {
            $PartyName.select2({
                width: '100%',
                dropdownParent: $(document.body)
            });
            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($PartyName);
            } else {
                function preventScroll() {
                    const scrollY = window.scrollY || window.pageYOffset;
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.width = '100%';
                    document.body.setAttribute('data-scroll-y', scrollY);
                }

                function restoreScroll() {
                    const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                    document.documentElement.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    window.scrollTo(0, parseInt(scrollY));
                    document.body.removeAttribute('data-scroll-y');
                }

                $PartyName.on('select2:open', preventScroll);
                $PartyName.on('select2:close', restoreScroll);
            }
            $PartyName.on('change select2:select', function () {
                loadMRNMasterList();
                clearTable();
                $('#txtMRNDate').val('');
                $('#txtBillDate').val('');
                $('#txtBillNo').val('');
            });
        }
    } catch (e) {
        toastr.error('Error initializing select2 for Party Name:', e);
    }
}
function PurchaseQualityCheck_EditData(MRNNo, finYear) {
    var ModuleName = `${menuValue}`,
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            if (!MRNNo || MRNNo === 0) {
                toastr.error('Invalid MRN No');
                return;
            }

            $('#dvGrid').hide();
            $('#locatePurchaseQualityCheck').show();
            $('#btnSaveQualityCheck').show();
            $('#btnReset').show();

            if (finYear) {
                const $ddlFinYear = $('#ddlFinYear');
                $ddlFinYear.val(finYear);
            }

            G_IsViewMode = false;

            toggleMRNField(false);
            togglePartyField(false);

            if (MRNNo) {
                const $txtMRNNo = $('#txtMRNNo');
                $txtMRNNo.val(MRNNo);
                if (MRNNo) {
                    $('#txtMRNNo').val(MRNNo).trigger('change');
                }
            }
            $('#locatePurchaseQualityCheck').find('input, select, textarea').prop('disabled', true);
        }
    });
}
function PurchaseQualityCheck_ViewData(MRNNo, finYear, PartyMaster_Code, MRNDate, BillNo, BillDate) {
    var ModuleName = `${menuValue}`,
        OptionName = "View",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            if (!MRNNo || MRNNo === 0) {
                toastr.error('Invalid MRN No');
                return;
            }

            $('#dvGrid').hide();
            $('#locatePurchaseQualityCheck').show();
            toggleMRNField(true);
            togglePartyField(true);
            $('#locatePurchaseQualityCheck').find('input, select, textarea').prop('disabled', true);
            $('#btnBack').prop('disabled', false);

            if (finYear) {
                const $ddlFinYear = $('#ddlFinYear');
                $ddlFinYear.val(finYear);
            }

            G_IsViewMode = true;

            if (PartyMaster_Code) {
                const $ddlParty = $('#ddlPartyName');
                if ($ddlParty.length) {
                    $ddlParty.val(PartyMaster_Code);
                    const selectedText = $ddlParty.find('option:selected').text() || '';
                    $('#ViewPartyName').val(selectedText);
                }
            }

            if (MRNNo) {
                const $viewInput = $('#ViewMRNNo');
                if ($viewInput.length) {
                    $viewInput.val(MRNNo);
                }
            }
            $('#txtMRNDate').val(MRNDate);
            $('#txtBillNo').val(BillNo);
            $('#txtBillDate').val(BillDate);

            let mrnMasterCode = MRNNo;
            if (mrnMasterCode && mrnMasterCode !== 0) {
                $('#hfMRNMasterCode').val(mrnMasterCode);
                loadPurchaseQualityCheckData(mrnMasterCode);
            }

            $('#btnSaveQualityCheck').hide();
            $('#btnReset').hide();
        }
    });
}
function Verify_PurchaseQualityCheck(Code) {
    var ModuleName = `${menuValue}`,
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            try {
                if (!Code) {
                    toastr.error('Invalid MRN Master Code');
                    return;
                }

                if (!confirm('Are you sure you want to verify this record?')) {
                    return;
                }

                Showloader();
                PurchaseQualityCheckService.VerifyMRNQCPropertyResult(Code).then(function (response) {
                        HideLoader();
                        if (response && response.Status === 'Y') {
                            toastr.success(response.Msg || 'Verified successfully.');
                            GetMRNQCPropertyList();
                        } else if (response && response.Status === 'N') {
                            toastr.warning(response.Msg || 'Verification failed.');
                        } else {
                            toastr.warning('Unexpected response during verification.');
                        }
                    }).catch(function (error) {
                        HideLoader();
                        toastr.error((error && error.Msg) || 'Error during verification.');
                });
            } catch (ex) {
                HideLoader();
                console.error('Error in Verify_PurchaseQualityCheck:', ex);
                toastr.error('An error occurred while verifying.');
            }
        }
    });
}
function Print_PurchaseQualityCheck(Code) {
    PurchaseQualityCheckService.PrintMRNQCPropertyResult(Code).then(function (response) {
        let url = response.Url;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
    }).catch(function (error) {
        console.error("Error in printing report:", error);
    });
}
function Delete(Code) {
    var ModuleName = `${menuValue}`,
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModal(Code);
        }
    });
}
function OpenModal(Code) {
    $('#hfCode').val(Code);
    $('#PurchaseQualityRemark').modal({ backdrop: 'static' });
    $('#PurchaseQualityRemark').modal('show');
    $("#txtRemark").val("");
}
function CloseModal() {
    $('#PurchaseQualityRemark').modal('hide');
    $("#txtRemark").val("");
}
function DeletePurchaseQualityCheck() {
    var code = $("#hfCode").val();
    var Remark = $("#txtRemark").val();
    if (Remark == '') {
        toastr.warning("Please enter the Reason for delete.");
        return;
    }
    PurchaseQualityCheckService.DeletePurchaseQuality(code, Remark)
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                CloseModal();
                GetMRNQCPropertyList();
            } else {
                toastr.error(response.Msg);
            }
        })
        .catch(function (error) {
            toastr.error('Error loading data. Please try again.');
        });
}
function Download() {
    const hiddenFields = [
        "MrnMaster_Code", "FinYear", "PartyMaster_Code", "Code", "Verify"
    ];
    ExportToExcelControl.ExportToExcel(G_PurchaseQualityCheckDataList, hiddenFields, "PurchaseQualityCheck");
}

window.PurchaseQualityCheck_EditData = PurchaseQualityCheck_EditData;
window.PurchaseQualityCheck_ViewData = PurchaseQualityCheck_ViewData;
window.Verify_PurchaseQualityCheck = Verify_PurchaseQualityCheck;
window.Print_PurchaseQualityCheck = Print_PurchaseQualityCheck;
window.SavePurchaseQualityCheck = SavePurchaseQualityCheck;
window.bindYearDropdown = bindYearDropdown;
window.CreateNew = CreateNew;
window.Delete = Delete;
window.DeletePurchaseQualityCheck = DeletePurchaseQualityCheck;
window.CloseModal = CloseModal;
window.Download = Download;