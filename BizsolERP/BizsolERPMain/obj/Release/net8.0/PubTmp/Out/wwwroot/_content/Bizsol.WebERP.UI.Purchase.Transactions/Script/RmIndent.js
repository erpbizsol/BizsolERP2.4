import { RmIndentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RmIndentService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

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
    $('#ddlVenderName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQtyMT").focus();
        }
    });
    $('#txtQtyMT').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlGrade").focus();
        }
    });
    $('#ddlGrade').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRate").focus();
        }
    });
    $('#txtRate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRemarks").focus();
        }
    });
    GetGradeList();
});
function setCurrentDate() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    $('#txtFromDate').val(formatDate(firstOfMonth));  // first day of month in dd-mm-yyyy
    $('#txtToDate').val(formatDate(today));
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
            $('#tblRMIndent').show();
            let stringFilterColumn = [];
            const numericFilterColumn = ["Indent No", "Qty MT"];
            const dateFilterColumn = ["Indent Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = [];
            if (Status == 'U' || Status == '0') {
                hiddenColumns = ["Code", "Purchased Date", "Qty PC", "Qty MTRS", "SizeDesp", "ClientName", "Vendor Name", "Rate","Verification"];
                stringFilterColumn = ["Item Name", "THICKNESS", "GRADE", "MAKE", "WIDTH", "Status","Order No","Order Item","Order Size"];
            } else {
                hiddenColumns = ["Code", "Purchased Date", "Qty PC", "Qty MTRS", "SizeDesp", "Action", "ClientName"];
                stringFilterColumn = ["Item Name", "THICKNESS", "GRADE", "MAKE", "WIDTH", "Status", "Vendor Name", "Rate", "Order No", "Order Item", "Order Size"];
            }
            const columnAlignment = {
                'Indent Date': 'center',
                'THICKNESS': 'right',
                'WIDTH': 'right',
                'Qty MT': 'right',
                'Action': ';min-width:100px',
                'Indent No': ';width:30px',
            };
            
			const updatedResponse = response.map((item, index) => {
                const orderNo = item?.['ClientName'];
                const orderNoWithTooltip = orderNo ? `<span title="${orderNo}">${item?.['Order No']}</span>` : (item?.['Order No'] || '');
				let ActionHtml = `<button type="button" class='btn btn-success btn-height'  title="Verify" onclick="Verify('${item.Code}','${item?.['Qty MT']}','${item?.['GRADE']}');" >Verify</button>&nbsp;
					<button type="button" class='btn btn-danger btn-height' title="Reject" onclick="Reject('${item.Code}')">Reject</button>`;
				return {
					...item,
					'Order No': orderNoWithTooltip,
					Action: ActionHtml,
				};
			});
            BizsolCustomFilterGrid.CreateDataTable("table-header-RMIndent", "table-body-RMIndent", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
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
function Reject(Code) {
    var ModuleName = "Indent (Raw Material)",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            try {
                var confirmed = window.confirm('Are you sure you want to reject this indent?');
                if (!confirmed) return;
            } catch (e) {
            }

            RmIndentService.UpdateStatus_IndentMaster(Code, 'R').then(function (response) {
                if (response && response.Status === 'Y') {
                    toastr.success('Rejected successfully');
                    try { ListStatus_IndentMaster(); } catch (e) { }
                } else {
                    toastr.error('No data received or empty response');
                }
            }).catch(function (error) {
                toastr.error('Error fetching user list:', error);
            }); 
        }
    });
}
function Verify(Code,qtyMT,Grade) {
    var ModuleName = "Indent (Raw Material)",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            ShowModelVenderDetails(Code, qtyMT,Grade)
        }
    });
    FillVendorNameList();
    
}
function ShowModelVenderDetails(code, qtyMT,Grade) {
    $('#hfCode').val(code);
    $('#txtQtyMT').val(qtyMT || '');
    $('#myModal').modal({
        backdrop: 'static',
    });
    $('#myModal').modal('show');
    BizSolHelperFunction.SelectOptionByText('ddlGrade',Grade);
}
function FillVendorNameList() {
    RmIndentService.GetVendorList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlVenderName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));

            $('#ddlVenderName').select2({
                dropdownParent: $('#myModal'),
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetGradeList() {
    RmIndentService.GetGradeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlGrade')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })));

            $('#ddlGrade').select2({
                dropdownParent: $('#myModal'),
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
    let Rate = $('#txtRate').val();
    let Grade = $('#ddlGrade').val();
    let Remarks = $('#txtRemarks').val();

    if (VendorName === '' || VendorName == '0' || QtyMT === '' || Grade === '' || Grade === '0' || Rate === '') {
        toastr.warning("Fill All Fields");
        return false;
    }

    let payLoadSaveIndentPriceComparisionDetails = {
        Code: 0,
        IndentTrans_Code: TransactionCode, 
        VendorMaster_Code: VendorName,
        Rate: parseFloat(Rate),
        QtyMT: parseFloat(QtyMT),
        ItemParameterValueMaster_CodeGrade: Grade,
        Remarks: Remarks
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
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}

window.ListStatus_IndentMaster = ListStatus_IndentMaster;
window.ShowModelVenderDetails = ShowModelVenderDetails;
window.CloseModal_IndentMaster = CloseModal_IndentMaster;
window.SaveModal_IndentMaster = SaveModal_IndentMaster;
window.toggleSourceButton = toggleSourceButton;
window.validateDecimalInput = validateDecimalInput;
window.validateIntegerInput = validateIntegerInput;
window.validateDecimalRateInput = validateDecimalRateInput;
window.Reject = Reject;
window.Verify = Verify;