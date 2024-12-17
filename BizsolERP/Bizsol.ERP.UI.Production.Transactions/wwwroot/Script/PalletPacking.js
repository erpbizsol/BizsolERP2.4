import { PalletPackingService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/PalletPackingService.js';

let BuyerPOMaster_Code = 0;
let Godownmaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Pallet Packing");
   
    $('input[name="filterType"]').on('change', function () {
        const selectedValue = $(this).val();  
        if (selectedValue === 'dateWise') {
            $('#dateWiseSection').show();
            GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
            $('#orderWiseSection').hide();
        } else if (selectedValue === 'orderWise') {
            $('#dateWiseSection').hide();
            $('#orderWiseSection').show();
            $('#txtOrderNo').val('');
            $('#txtWarehouse').val('');
            $('#txtPalletType').val('');
            $('#packingWt').val('');
            $('#referenceNo').val('');
            FillPendingOrder();
        }
    });
    if ($('#dateWise').is(':checked')) {
        GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
    } else {

    }

    $('#txtWarehouse').on('focus', function (e) {
        $("#txtWarehouse").val("");
    });
    $('#txtOrderNo').on('focus', function (e) {
        $("#txtOrderNo ").val("");
    });
    $('#txtPalletType').on('focus', function (e) {
        $("#txtPalletType ").val("");
    });
    $('#txtOrderNo1').on('focus', function (e) {
        $("#txtOrderNo1 ").val("");
    });
    $('#txtWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#packingWt").focus();
        }
    });
    $('#packingWt').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#referenceNo").focus();
        }
    });
    $('#referenceNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPalletType").focus();
        }
    });
    $('#txtPalletType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderNo").focus();
        }
    });
    $('#txtOrderNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtScanIdentificationNo").focus();
        }
    });
    $('#txtScanIdentificationNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            onScanIdSelect();
        }
    });
});
let todayDate = new Date().toISOString().slice(0, 10); 
$('#txtdate').val(todayDate);
let date = convertDateFormat($('#txtdate').val());
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day} - ${monthAbbreviation} - ${year}`;
}
function GetPackedPalletDateAndOrderWise(date, BuyerPOMaster_Code) {
    PalletPackingService.GetPackedPalletDateAndOrderWise(date, BuyerPOMaster_Code).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-PalletPacking", "table-body-PalletPacking", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });
}
function FillPendingOrder() {
    PalletPackingService.FillPendingOrder().then(function (response) {
        if (response && response.length > 0) {
            $('#txtOrderNoList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].Desp + '" >' + response[i].Desp + '</option>';
            }
            $('#txtOrderNoList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtOrderNo");
        const dataList = document.getElementById("txtOrderNoList");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                BuyerPOMaster_Code = selectedOption.getAttribute("text");
                if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function FillPendingOrderModal() {
    PalletPackingService.FillPendingOrder().then(function (response) {
        if (response && response.length > 0) {
            $('#txtOrderNoList1 option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].Desp + '" >' + response[i].Desp + '</option>';
            }
            $('#txtOrderNoList1')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtOrderNo1");
        const dataList = document.getElementById("txtOrderNoList1");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                BuyerPOMaster_Code = selectedOption.getAttribute("text");
                if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function CreateNew() {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
    });
    $("#txtPalletdate").val($("#txtdate").val());
    $("#txtOrderNo1").val($("#txtOrderNo").val());
    $('#txtWarehouse').val('');
    $('#txtPalletType').val('');
    $('#packingWt').val('');
    FillWarehouse();
    FillPendingOrderModal();
    FillPalletType();
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function FillWarehouse() {
    PalletPackingService.FillWarehouse().then(function (response) {
        if (response && response.length > 0) {
            $('#txtWarehouseList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].GodownName + '" >' + response[i].GodownName + '</option>';
            }
            $('#txtWarehouseList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtWarehouse");
        const dataList = document.getElementById("txtWarehouseList");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                Godownmaster_Code = selectedOption.getAttribute("text");
                if (Godownmaster_Code !== undefined && Godownmaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function FillPalletType() {
    PalletPackingService.FillPalletType().then(function (response) {
        const datalist = $('#txtPalletTypeList');
        datalist.empty();
        if (response && response.length > 0) {
            response.forEach(function (item) {
                const option = $('<option>').val(item.PalletType).text(item.PalletType);
                datalist.append(option);
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function onSelectRoll(BuyerPOMaster_Code, GodownMaster_Code) {
    if (BuyerPOMaster_Code !== 0 && GodownMaster_Code !== 0) {
        GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code);

    } else {

    }
}
function GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code) {
    PalletPackingService.GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code).then(function (response) {
            const datalist = $('#txtScanIdentificationNoList');
            datalist.empty();
            if (response && response.length > 0) {
                response.forEach(function (item) {
                    const option = $('<option>').val(item.IdentificationNo).text(item.IdentificationNo);
                    datalist.append(option);
                });
            } else {
                toastr.error('No data received or empty response');
            }
        }).catch(function (error) {
            toastr.error('Error fetching user list:', error);
        });
    }
function onScanIdSelect() {   
        IdentificationNo = $("#txtScanIdentificationNo").val();
        this.ScanID();
        this.GetPendingIDOrderWise();
}

//function ScanID() {
//    PalletPackingService.ScanID(IdentificationNo, Godownmaster_Code).subscribe((res: any[]) => {
//        const newData = res.map((item, index) => ({
//            SN: this.scanIdCheck.length + index + 1,
//            ...item
//        }));
//        const existingIds = this.scanIdCheck.map(item => item['Identification No']);
//        const uniqueData = newData.filter(item => !existingIds.includes(item['Identification No']));

//        if (uniqueData.length === 0) {
//            toastr.warning('Identification number already exists in the grid.');
//            return;
//        }

//        this.scanIdCheck = this.scanIdCheck.concat(uniqueData);
//        this.allData = this.scanIdCheck;
//        this.dataSource.data = this.scanIdCheck;
//        if (this.scanIdCheck.length > 0) {
//            this.displayedColumns = Object.keys(this.scanIdCheck[0]);
//            const columnToHide = ['Stock Type', 'ColForWhere'];
//            this.displayedColumns = this.displayedColumns.filter(column => !columnToHide.includes(column));
//            this.dataSource.sort = this.sort;
//            this.dataSource.paginator = this.paginator;
//            this.filters = this.filterService.initializeFilters(this.displayedColumns, this.scanIdCheck);
//            this.footerColumns = [...this.displayedColumns];
//            if (res?.length > 0) {
//                this.ColForWhere = res[0]?.ColForWhere;
//                this.ColValue = res[0]?.['Identification No'];
//            }
//            this.savePalletPacking();
//        }
//    },
//        err => {
//            this.toasterService.showError(err.error);
//        });
//}
function ScanID() {
    PalletPackingService.ScanID(IdentificationNo, Godownmaster_Code).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });
}

window.GetPackedPalletDateAndOrderWise = GetPackedPalletDateAndOrderWise;
window.FillPendingOrder = FillPendingOrder;
window.CreateNew = CreateNew;
window.CloseModal = CloseModal;