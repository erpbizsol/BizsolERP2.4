import { RmIndentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RmIndentService.js';

let today = '';
let G_IndentStatusType = [];
$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Raw Material Indent Management");
    }
    setCurrentDate();
    ListStatus_IndentMaster();
    FillIndentStatusType();
});

//function setCurrentDate() {
//    today = new Date().toISOString().split('T')[0];
//    $('#txtFromDate').val(today);
//    $('#txtToDate').val(today);
//    $('#txtPurchasedDate').val(today);
//}
function setCurrentDate() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Format a date object as dd-mm-yyyy
    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    $('#txtFromDate').val(formatDate(firstOfMonth));  // first day of month in dd-mm-yyyy
    $('#txtToDate').val(formatDate(today));           // today in dd-mm-yyyy
    $('#txtPurchasedDate').val(formatDate(today));    // today in dd-mm-yyyy
}


function ListStatus_IndentMaster() {
    let Status=$('#ddlStatus').val() || 0;
    let DateType=$('#txtDateType').val();
    let FromDate=$('#txtFromDate').val();
    let ToDate=$('#txtToDate').val();
    GetRMIndentListTable(Status, DateType, FromDate, ToDate);
}
function FillIndentStatusType() {
    RmIndentService.GetRmIndentStatusType().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList2($('#ddlStatus')[0], response.map((item) => ({ Code: item.ShortDesp, Desp: item.Value })));

            $('#ddlStatus').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}


function GetRMIndentListTable(Status, DateType, FromDate, ToDate) {
    RmIndentService.GetRmIndentList(Status, DateType, FromDate, ToDate).then(function (response) {
        if (response && response.length > 0) {
            FillIndentStatusTypeTable();
            $('#tblRMIndent').show();
            const stringFilterColumn = ["Item Name", "SizeDesp", "THICKNESS", "GRADE", "MAKE","WIDTH"];
            const numericFilterColumn = ["Indent No", "Qty MT","Qty PC","Qty MTRS"];
            const dateFilterColumn = ["Indent Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code","Purchased Date"];
            const columnAlignment = {
                'Indent Date': 'center',
                'THICKNESS': 'right',
                'WIDTH': 'right',
                'Qty MT': 'right',
                'Qty PC': 'right',
                'Qty MTRS': 'right',
                'Status': ';width:150px',
                'Purchased Date': ';width:150px',
            };
            
            const updatedResponse = response.map((item, index) => {
                const isPurchased = (item.Status || '').toString().trim().toLowerCase() == 'c';
                const buttonDisabled = isPurchased ? '' : 'disabled';
                const buttonClass = isPurchased ? 'btn btn-primary btn-height' : 'btn btn-secondary btn-height';

                let sourceInputHTML = `<button type="button" id="txtSource_${item.Code}" class="${buttonClass}" title="Source" onclick="ShowModelVenderDetails('${item.Code}','${item?.['Qty MT']}','${item?.['Qty PC']}','${item?.['Qty MTRS']}');" style="width: 70px;" ${buttonDisabled}>Add Source</button>`;
                let statusInputHTML = ` <select class="box_border form-control form-control-sm ddlStatus1" data-current-status="${(item.Status || '').toString().trim()}" style="min-width: 70px;" required onchange="toggleSourceButton('${item.Code}', this.value)"></select>`;
                //let purchaseDateInputHTML = `<input type="text" id="txtPurchaseDate_${item.Code}" onkeypress="BizSolhandleEnterKey(event);" value="${item["Purchased Date"]}" class="BizSolFormControl box_border form-control form-control-sm" name="txtSource" placeholder="" autocomplete="off" onclick="$(this).val('')" style="min-width: 70px;" readonly onchange="" required>`;

                return {
                    ...item,
                    Source: sourceInputHTML,
                    Status: statusInputHTML,
                    //'Purchased Date': purchaseDateInputHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-RMIndent", "table-body-RMIndent", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            FillVendorNameList();
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblRMIndent').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during RMIndent');
        });
}
function toggleSourceButton(itemCode, selectedStatus) {
    
    const button = document.getElementById(`txtSource_${itemCode}`);
    if (button) {
        if (selectedStatus.toLowerCase() === 'c') {
            button.disabled = false;
            button.className = 'btn btn-primary btn-height';
            button.style.width = '70px';
        } else {
            button.disabled = true;
            button.className = 'btn btn-secondary btn-height';
            button.style.width = '70px';
        }
    }
    UpdateStatus_IndentMaster(itemCode, selectedStatus);
}
function FillIndentStatusTypeTable() {
    RmIndentService.GetRmIndentStatusType().then(function (response) {
        if (response && response.length > 0) {
            G_IndentStatusType = response;

            //const options = (response || []).map((item) => ({ Code: item.ShortDesp, Desp: item.Value }));
            //const $selects = $('.ddlStatus1');
            //if ($selects.length === 0) return;

            //$selects.each(function () {
            //    const sel = this;
            //    const $sel = $(sel);
            //    const current = ($sel.data('current-status') || '').toString().trim();
            //    BindSelectList(sel, options);
            //    if (current) {
            //        $sel.val(current);
            //    }
            //});

            //$selects.select2({
            //    width: '-webkit-fill-available'
            //});
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function initilizeSelect() {

    if (G_IndentStatusType.length > 0) {
        const options = (G_IndentStatusType || []).map((item) => ({ Code: item.ShortDesp, Desp: item.Value }));
        const $selects = $('.ddlStatus1');
        if ($selects.length === 0) return;

        

        $('.ddlStatus1').each(function () {
            // Check if already initialized
            if (!$(this).hasClass('select2-hidden-accessible')) {
                $selects.each(function () {
                    const sel = this;
                    const $sel = $(sel);
                    const current = ($sel.data('current-status') || '').toString().trim();
                    BindSelectList(sel, options);
                    if (current) {
                        $sel.val(current);
                    }
                });

                $(this).select2({
                    width: '-webkit-fill-available'
                });
            }
        });
        //////$selects.select2({
        //////    width: '-webkit-fill-available'
        //////});
    }
    
} 
function UpdateStatus_IndentMaster(Code,Status) {
    RmIndentService.UpdateStatus_IndentMaster(Code, Status).then(function (response) {
        if (response && response.Status === 'Y') {
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function ShowModelVenderDetails(code, qtyMT, qtyPC, qtyMTRS) {
    $('#hfCode').val(code);
    $('#txtQtyMT').val(qtyMT || '');
    $('#txtQtyPC').val(qtyPC || '');
    $('#txtQtyMTRS').val(qtyMTRS || '');
    $('#txtPurchasedDate').val(today);

    $('#myModal').data('code', code);
    $('#myModal').modal({
        backdrop: 'static',
    });
    $('#myModal').modal('show');

    $('#ddlVenderName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQtyMT").focus();
        }
    });
    $('#txtQtyMT').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQtyPC").focus();
        }
    });
    $('#txtQtyPC').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQtyMTRS").focus();
        }
    });
    $('#txtQtyMTRS').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRate").focus();
        }
    });
    $('#txtRate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPurchasedDate").focus();
        }
    });
    $('#txtPurchasedDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRemarks").focus();
        }
    });
}
function FillVendorNameList() {
    RmIndentService.GetVendorList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlVenderName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));

            $('#ddlVenderName').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function validateDecimalInput(input) {
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
function validateDecimalRateInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    input.value = value;
}
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 5) {
        value = value.slice(0, 5);
    }
    input.value = value;
}
function CloseModal_IndentMaster() {
    $('#myModal').modal('hide');
    ClearFormModal();
}
function SaveModal_IndentMaster() {
    let VendorName = $('#ddlVenderName').val();
    let QtyMT = $('#txtQtyMT').val();
    let TransactionCode = $('#hfCode').val();
    let QtyPC = $('#txtQtyPC').val();
    let QtyMTRS = $('#txtQtyMTRS').val();
    let Rate = $('#txtRate').val();
    let PurchasedDate = $('#txtPurchasedDate').val();
    let Remarks = $('#txtRemarks').val();

    if (VendorName === '' || VendorName == '0' || QtyMT === '' || QtyPC === '' || QtyMTRS === '' || Rate === '' || PurchasedDate === '') {
        toastr.warning("Fill All Fields");
        return false;
    }

    let payLoadSaveIndentPriceComparisionDetails = {
        Code: 0,
        IndentTrans_Code: TransactionCode, 
        VendorMaster_Code: VendorName,
        Rate: parseFloat(Rate),
        QtyMT: parseFloat(QtyMT),
        QtyPC: parseInt(QtyPC),
        QtyMTRS: parseFloat(QtyMTRS),
        Remarks: Remarks, 
        PurchasedDate: PurchasedDate
    };

    RmIndentService.SaveIndentPriceComparison(payLoadSaveIndentPriceComparisionDetails).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Message);
            CloseModal_IndentMaster();
            ListStatus_IndentMaster();
        } else {
            toastr.error(response.Message || 'Error saving data');
        }
    }).catch(function (error) {
        toastr.error('Error saving data: ' + error);
    });
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
function ClearFormModal() {
    $('#txtRate').val('');
    $('#txtPurchasedDate').val('');
    $('#txtRemarks').val('');
}
function BindSelectList(element, list) {
    let option = '';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectList1(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectList2(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

setInterval(initilizeSelect, 500);

window.ListStatus_IndentMaster = ListStatus_IndentMaster;
window.ShowModelVenderDetails = ShowModelVenderDetails;
window.CloseModal_IndentMaster = CloseModal_IndentMaster;
window.SaveModal_IndentMaster = SaveModal_IndentMaster;
window.toggleSourceButton = toggleSourceButton;
window.validateDecimalInput = validateDecimalInput;
window.validateIntegerInput = validateIntegerInput;
window.validateDecimalRateInput = validateDecimalRateInput;