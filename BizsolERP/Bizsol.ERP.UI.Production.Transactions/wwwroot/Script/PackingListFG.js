import { PackingListFGService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PackingListFGService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { PalletPackingService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PalletPackingService.js';
$("#ERPHeading").text("Packing List FG");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
$('#txtPackingListDate').val(new Date().toISOString().slice(0, 10));
$('#txtGRDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');
let PackingListFGFixedParaMeters = [];
let G_EwayBillApplicable = "N";
let GRNoWithVehicleAndTrannsporterMandatoryInPackingList = "N";
let PackingType = "D";
let RMRequisitionApplicableInPackingList = "N";
let InvoiceByOrder = "N";
let ApplicableBatchWiseStock = "N";
let BOMOrderWiseFor = "";
let BaleNoDesp = "";
let FourthOrderUnitApplicable = "N";
let ShowPalletTypeAndNoInPackingList = "N";
let FGNameForBatchNo = "";
let ShowDeliveryCodeInPackingList = "N";
let ApplicableValidationInPackingList = "N";

let FinYear = '';
let PackingListMaster_Code = 0;
let BuyerPOMaster_Code = 0;
let ArryPackingListTransaction = [];
let AddPackingListTransaction = [];
let G_OnlyEntry = "T";
let G_isView = "N";
let G_PackingTypeDesp = "";
let G_dllClientName = "";
let G_dllConsigneeName = "";
let G_DefaultAccountCodeStockTransfar = 0;
let G_DeliveryAddressCode = "";
let G_QtyMT = 'MT';
let G_QtyPC = 'PC';
let G_QtyMTR = 'MTRS';
let G_DetailsModalType ='ScanPallet'
let FixedParameterQtyConfiguration = await PalletPackingService.FixedParameterQtyConfiguration();
let G_TransactionRate = 0;
let G_AutoSelectConsigneeByOrder = 'N';
let G_ValidationPackingListMaster_Code = 0;
let G_ValidationDetailsData = [];
let G_PackingListViewData = {};

if (FixedParameterQtyConfiguration.length > 0) {
    G_QtyMT = FixedParameterQtyConfiguration[0].QtyMT
    G_QtyPC = FixedParameterQtyConfiguration[0].QtyPC
    G_QtyMTR = FixedParameterQtyConfiguration[0].QtyMR
}

function ChangeMode(Mode) {
    $('#DivPackingListFGForm').hide();
    $('#DivPackingListFGViewGrid').hide();
    if (Mode === 'New' || Mode === 'View' || Mode === 'Edit') {
        $('#DivPackingListFGForm').show();
        $('#DivPackingListFGViewGrid').hide();
    } else {
        $('#DivPackingListFGForm').hide();
        $('#DivPackingListFGViewGrid').show();
    }

}
function PackingListFG_ShowViewGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    if (FromDate == "" && Todate == "") {
        return false;
    }
    Showloader();
    PackingListFGService.GetPackingListWebLocate(FromDate, Todate).then(function (response) {
        HideLoader();
        //response.forEach(item => {
        //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //});
       
        console.log(response);
        //response = response.map((item) => ({
        //    "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName, "Qty KG": item.QtyMT, "Qty PC": item.QtyPC, "Qty SQM": item.QtyMTRS, Status: item.PKStatus,
        //    Action: item.LoadingStatus !== 'C' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Loading end" onclick="PackingListFG_EndLoadingOnGrid(\'' + item.Code + '\')"> <i class="fa fa-ban"></i></a>' : item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="PackingListFG_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>': item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="PackingListFG_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>', 
        //    QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS
        //}))
        //response = response.map(item => {
        //    return {
        //        ...item,
        //        Action: item.LoadingStatus !== 'C' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Loading end" onclick="PackingListFG_EndLoadingOnGrid(\'' + item.Code + '\')"> <i class="fa fa-ban"></i></a>' : item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="PackingListFG_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>' : item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="PackingListFG_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>',
        //    }
        //})
        const showValidationBtn = ApplicableValidationInPackingList === 'Y';
        G_PackingListViewData = {};
        response = response.map(item => {
            const validationActionBtn = showValidationBtn ? '<a href="javascript:void(0)" class="btn btn-warning icon-height" title="Validate" onclick="PackingListFG_OpenValidationModal(\'' + item.Code + '\'); return false;"><i class="fa fa-check-square"></i></a>&nbsp;&nbsp;' : '';
            G_PackingListViewData[item.Code] = {
                packingListNo: item.PackingListNo || '',
                date: item.PackingListDate || '',
                warehouse: item.GodownName || '',
                packingType: item.PackingType || '',
                partyName: item.ClienName || '',
                validate: item.Validate || 'N'
            };
            return {
                "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName,
                ["Qty "+G_QtyMT]: item.QtyMT  ,
                ["Qty " + G_QtyPC]: item.QtyPC,
                ["Qty " + G_QtyMTR]: item.QtyMTRS,
                    Status: item.Validate === 'Y' ? 'Validated' : item.PKStatus,
                Action: item.LoadingStatus !== 'C' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Loading end" onclick="PackingListFG_EndLoadingOnGrid(\'' + item.Code + '\')"> <i class="fa fa-ban"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Delete" onclick="PackingListFG_DeleteEntryOnGrid(\'' + item.Code + '\')"> <i class="fa fa-trash"></i></a>' : item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="PackingListFG_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Delete" onclick="PackingListFG_DeleteEntryOnGrid(\'' + item.Code + '\')"> <i class="fa fa-trash"></i></a>' : item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-danger icon-height" title="Delete" onclick="PackingListFG_DeleteEntryOnGrid(\'' + item.Code + '\')"> <i class="fa fa-trash"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="PackingListFG_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>&nbsp;&nbsp;' + validationActionBtn + '<a class="btn btn-danger icon-height" title="Delete" onclick="PackingListFG_DeleteEntryOnGrid(\'' + item.Code + '\')"> <i class="fa fa-trash"></i></a>',
                    QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS, Code: item.Code, Validate: item.Validate || 'N'
            }
        })
        //console.log(response);
        const StringFilterColumn = ["Warehouse", "Packing Type", "Party Name","Status"];
        const NumericFilterColumn = ["PackingList No"];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS", "Code", "Validate"];
        const ColumnAlignment = {
            //"Qty PC": 'right',
            //"Qty KG": 'right',
            //"Qty SQM": 'right',
        };

        ColumnAlignment["Qty " + G_QtyMT] = "right";
        ColumnAlignment["Qty " + G_QtyPC] = "right";
        ColumnAlignment["Qty " + G_QtyMTR] = "right";

        if (G_QtyMTR.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyMTR);
        }
        if (G_QtyMT.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyMT);
        }
        if (G_QtyPC.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyPC);
        }

        if (RMRequisitionApplicableInPackingList === "N") {
            hiddenColumns.push("Requisition No / Order No")
        }
        if (RMRequisitionApplicableInPackingList === "Y") {
            StringFilterColumn.push("Requisition No / Order No")
        }

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbPackingListFGViewHeader", "tbPackingListFGViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            WebLocatePackingSumDispatch(response);
        } else {
            $('#tbPackingListFGView tr').empty()
            $('#paginator-tbPackingListFGView').empty();
        }

    });

    ChangeMode('');
}

function WebLocatePackingSumDispatch(response) {
    let DispatchRows = response.filter(item => item["Packing Type"] ==='Dispatch');
    let StockRows = response.filter(item => item["Packing Type"] === 'Stock Transfer');
    let ColSpan = 5;
    let DispatchTotalMT = 0;
    let DispatchTotalPC = 0;
    let DispatchTotalMTRS = 0;
    let StockTotalMT = 0;
    let StockTotalPC = 0;
    let StockTotalMTRS = 0;
    let styleTdMTRS = "text-align: right;";

    if (G_QtyMTR.toUpperCase() == "NA") {
        styleTdMTRS = "display: none;"
    }

    if (RMRequisitionApplicableInPackingList === "N") {
        ColSpan = 4;
    }

    if (StockRows.length > 0)
    {
        StockTotalMT = StockRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        StockTotalPC = StockRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        StockTotalMTRS = StockRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
    }

    if (DispatchRows.length > 0) {
        DispatchTotalMT = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        DispatchTotalPC = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        DispatchTotalMTRS = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
    }
    let tfootContent = `
        <tr id="trDispatchTotal">
        <td colspan="${ColSpan}"></td>
        <td >DISPATCH TOTAL:</td>
        <td style="text-align: right;">${ parseFloat(DispatchTotalMT).toFixed(2)}</td >
        <td style="text-align: right;">${DispatchTotalPC}</td>
        <td style="${styleTdMTRS}">${parseFloat(DispatchTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trStockTotal">
        <td colspan="${ColSpan}"></td>
        <td >STOCK TRANSFER TOTAL :</td>
        <td style="text-align: right;">${parseFloat(StockTotalMT).toFixed(2)}</td>
        <td style="text-align: right;">${StockTotalPC}</td>
        <td style="${styleTdMTRS}">${parseFloat(StockTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trTotal">
        <td colspan="${ColSpan}"></td>
        <td >TOTAL:</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMT + StockTotalMT)).toFixed(2)}</td>
        <td style="text-align: right;">${(DispatchTotalPC + StockTotalPC)}</td>
        <td style="${styleTdMTRS}">${parseFloat((DispatchTotalMTRS + StockTotalMTRS)).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        `;

   

    $('#tbPackingListFGView tfoot')[0].innerHTML = tfootContent;



}
function PackingListTransactionSum(response) {
    let DispatchRows = response

    let ColSpan = 0;
    let tdQtyRMTR = '';
    let DispatchTotalMT = 0;
    let DispatchTotalPC = 0;
    let DispatchTotalMTRS = 0;
    let DispatchTotalRMTR = 0;
    let NoPalletDispatchTotal = 0;
    let styleTdPalletTotal = "text-align: right;";
    let styleTdMTRS = "text-align: right;";

    if (G_QtyMTR.toUpperCase() == "NA") {
        styleTdMTRS = "display: none;"
    }
    

    if (DispatchRows.length > 0) {
        DispatchTotalMT = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        DispatchTotalPC = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        DispatchTotalMTRS = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
        DispatchTotalRMTR = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyRMTR, 0)
        let DispatchRowsGroupedbyPalletNo = DispatchRows.reduce((acc, item) => {
            // Use the category as the key
            const key = item["Pallet No"];
            if (key && !acc.includes(key)) {
                acc.push(key) ;
            }
           // acc[key].push(item);
            return acc;
        }, [])

        NoPalletDispatchTotal=DispatchRowsGroupedbyPalletNo.length;
    }

    if (G_OnlyEntry == "T") {
        ColSpan = 2;
        
    }
    if (FourthOrderUnitApplicable === "Y") {
        tdQtyRMTR = `<td style="text-align: right;">${parseFloat((DispatchTotalRMTR)).toFixed(2)}</td>`
    }
    if (ShowPalletTypeAndNoInPackingList === 'N') {
        styleTdPalletTotal ="display: none;"
    }
   // <td colspan="${ColSpan}"></td>
    let tfootContent = `
        <tr id="trTotalPackingListTransaction">
        <td style="${styleTdPalletTotal}">${(NoPalletDispatchTotal)}</td>
        <td >TOTAL:</td>
        <td colspan="${ColSpan}"></td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMT)).toFixed(2)}</td>
        <td style="text-align: right;">${(DispatchTotalPC)}</td>
        <td style="${styleTdMTRS}">${parseFloat((DispatchTotalMTRS)).toFixed(2)}</td>
        ${tdQtyRMTR}
        
        </tr>
        `;



    $('#tbPackingListTransaction tfoot')[0].innerHTML = tfootContent;

    $('#spPLT')[0].innerHTML = `PLT : ${NoPalletDispatchTotal}`;
    $('#spPC')[0].innerHTML = `PC : ${DispatchTotalPC}`;
    $('#spWT')[0].innerHTML = `WT : ${DispatchTotalMT}`;


    

}
function getPackingListFGFixedParaMeters() {
    PackingListFGService.GetFixedParaMeter().then(function (response) {
        PackingListFGFixedParaMeters = response;
        LoadFrm();
        if ($('#DivPackingListFGViewGrid').is(':visible')) {
            PackingListFG_ShowViewGrid();
        }
    });
}
function SelectOptionByText(Id, FindText) {
    var dd = document.getElementById(Id);
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === FindText) {
            dd.selectedIndex = i;
            break;
        }
    }
    $('#' + Id).select2({
        width: '-webkit-fill-available'
    })
}
function Bind_ddlPackingType() {
    PackingListFGService.GetPackingListDDl('GetddlPackingType').then(function (response) {

        let option = '<option value="0"></option>';
        $.each(response, function (key, val) {
            let selected = val.PackingDesp === 'Dispatch' ? 'selected' : '';
            option += '<option value="' + val.Code + '" DefaultAccountCode="' + val.DefaultAccountCode + '" EwayBillApplicable="' + val.EwayBillApplicable + '" PackingType="' + val.PackingType + '" ' + selected +'>' + val.PackingDesp + '</option>';
        });
        $('#ddlPackingType')[0].innerHTML = option;
        $('#ddlPackingType').select2({
            width: '-webkit-fill-available'
        });
    });

    
}
function Bind_ddlClientNameORddlConsignee() {
    PackingListFGService.GetPackingListDDl('GetddlClientName').then(function (response) {
        BindSelectList($('#ddlClientName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp})));
        $('#ddlClientName').select2({
            width: '-webkit-fill-available'
        });
        BindSelectList($('#ddlConsignee')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        $('#ddlConsignee').select2({
            width: '-webkit-fill-available'
        });

        if (G_dllClientName !== '') {
            SelectOptionByText('ddlClientName', G_dllClientName);
            SelectOptionByText('ddlConsignee', G_dllConsigneeName);
            if (ShowDeliveryCodeInPackingList === 'Y') {
                Bind_ddlDeliveryAddressCode($('#ddlClientName').val(), G_DeliveryAddressCode);
            }
        }
        if (Number(G_DefaultAccountCodeStockTransfar) > 0) {
            $('#ddlClientName').val(G_DefaultAccountCodeStockTransfar);
            $('#ddlConsignee').val(G_DefaultAccountCodeStockTransfar);
            $('#ddlClientName').select2({
                width: '-webkit-fill-available'
            })
            $('#ddlConsignee').select2({
                width: '-webkit-fill-available'
            })
            //$('#ddlClientName').attr("disabled", "disabled");
            //$('#ddlConsignee').attr("disabled", "disabled");
        }
        
        
    });
}
function Bind_ddlVendorNameORddlConsignee() {
    $('#lblddlClientName')[0].innerHTML = "Vendor Name:";
    PackingListFGService.GetPackingListDDl('GetddlVendorName').then(function (response) {
        BindSelectList($('#ddlClientName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        $('#ddlClientName').select2({
            width: '-webkit-fill-available'
        });
        BindSelectList($('#ddlConsignee')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        $('#ddlConsignee').select2({
            width: '-webkit-fill-available'
        });
        if (G_dllClientName !== '') {
            SelectOptionByText('ddlClientName', G_dllClientName);
            SelectOptionByText('ddlConsignee', G_dllConsigneeName);
        }

    });
}
function Bind_ddlReqNo() {
    PackingListFGService.GetPackingListDDl('GetddlReqNo').then(function (response) {
        let option = '<option value="0" GodownNameTo="0" Code="0" GodownNameFrom="0"></option>';
        $.each(response, function (key, val) {
            
            option += '<option value="' + val.RMRequisitionNo + '" GodownNameTo="' + val.GodownNameTo + '" Code="' + val.Code + '" GodownNameFrom="' + val.GodownNameFrom + '" >' + val.RMRequisitionNo + '</option>';
        });
        $('#ddlReqNo')[0].innerHTML = option;
        $('#ddlReqNo').select2({
            width: '-webkit-fill-available'
        });
        
    });
}
function Bind_ddlTransporterName() {
    PackingListFGService.GetPackingListDDl('GetddlTransporterName').then(function (response) {
        BindSelectList($('#ddlTransporterName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        $('#ddlTransporterName').select2({
            width: '-webkit-fill-available'
        });
       
    });
}
function Bind_ddlGodown() {
    PackingListFGService.GetPackingListDDl('GetddlGodown').then(function (response) {
        BindSelectList($('#ddlGodownFrom')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName })));
        $('#ddlGodownFrom').select2({
            width: '-webkit-fill-available'
        });
       
    });
}
function Bind_ddlGodownTo() {
    PackingListFGService.GetPackingListDDl('GetddlGodownTo').then(function (response) {
        BindSelectList($('#ddlGodownTo')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName })));
        $('#ddlGodownTo').select2({
            width: '-webkit-fill-available'
        });

    });
}
function Bind_ddlDeliveryAddressCode(ClientCode, selectedCode = "") {
    PackingListFGService.GetDeliveryAddressCodeList(ClientCode).then(function (response) {
        BindSelectList($('#ddlDeliveryAddressCode')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })));
        if (selectedCode !== "") {
            $('#ddlDeliveryAddressCode').val(selectedCode);
        }
        $('#ddlDeliveryAddressCode').select2({
            width: '-webkit-fill-available'
        });
    });
}

function Bind_AllDLL() {
    Bind_ddlPackingType();
    Bind_ddlClientNameORddlConsignee();
    Bind_ddlReqNo();
    Bind_ddlGodown();
    Bind_ddlGodownTo();
    Bind_ddlTransporterName();
}
function Bind_ddlOrderNo(Mode, Name, BuyerName) {
    PackingListFGService.GetPendingOrderList(Mode, Name, 0, 0, BuyerName).then(function (response) {

        if (response.length == 0) {
            let bName = Mode === "GetPendingOrderListByBuyerName" ? "Buyer Name: " : Mode === "GetPendingMRNListByPartyName" ? "Vendor Name:" : "Consignee Name: ";
            Name = bName + Name;
            let OrderOrMRN = Mode === "GetPendingMRNListByPartyName" ? "MRN No" : "Order No ";
            toastr.warning(OrderOrMRN+' Not Found for ' + Name);
        }
        let option = '<option value="0" partyname="0"></option>';
        $.each(response, function (key, val) {
            
            option += '<option value="' + val.Code + '" partyname="' + val.PartyName + '" >' + val.Desp + '</option>';
        });

        $('#ddlOrderNo')[0].innerHTML = option;
        if (BuyerPOMaster_Code > 0) {
            $('#ddlOrderNo').val(BuyerPOMaster_Code);
        }
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });
        
    });
}
function Bind_ddlOrderNoForEntryView(Mode, Name) {
    PackingListFGService.GetPendingOrderList(Mode, Name, PackingListMaster_Code, 0,'0').then(function (response) {

        //if (response.length == 0) {
        //    let bName = Mode === "GetPendingOrderListByBuyerName" ? "Buyer Name: " : Mode === "GetPendingMRNListByPartyName" ? "Vendor Name:" : "Consignee Name: ";
        //    Name = bName + Name;
        //    let OrderOrMRN = Mode === "GetPendingMRNListByPartyName" ? "MRN No" : "Order No ";
        //    toastr.warning(OrderOrMRN + ' Not Found for ' + Name);
        //}
        let option = '<option value="0" partyname="0"></option>';
        $.each(response, function (key, val) {

            option += '<option value="' + val.Code + '" partyname="' + val.PartyName + '" >' + val.Desp + '</option>';
        });

        $('#ddlOrderNo')[0].innerHTML = option;
        if (BuyerPOMaster_Code > 0) {
            $('#ddlOrderNo').val(BuyerPOMaster_Code);
        }
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });

    });
}
function Bind_PackingListTransactionGrid(isView) {
    if (ArryPackingListTransaction.length > 0) {

        let BatchORBundleDesp = ""

        if (ApplicableBatchWiseStock === "Y") {
            if (FGNameForBatchNo != "") {
                BatchORBundleDesp = FGNameForBatchNo;
            }
            else {
                BatchORBundleDesp = "Batch No";
            }
        }
        else if (BaleNoDesp != "") {
            BatchORBundleDesp=BaleNoDesp;
        }


        if (typeof ArryPackingListTransaction[0].PalletNo !== "undefined") {

            ArryPackingListTransaction = ArryPackingListTransaction.map(item => {
                
                return {
                    "Pallet No": item.PalletNo,
                    //[BatchORBundleDesp + "/ID"]: ApplicableBatchWiseStock == "Y" && item.BatchNo != "" ? item.BatchNo : BaleNoDesp != "" && item.BaleNo != "" ? item.BaleNo : item.IdentificationNo,
                    [BatchORBundleDesp + "/ID"]: item.BatchNo != "" ? item.BatchNo : BaleNoDesp != "" && item.BaleNo != "" ? item.BaleNo : item.SerialNo != "" ? item.SerialNo : item.IdentificationNo,
                    "Item Name": item.ItemName, "Size": item.SizeDesp,
                    ["Qty " + G_QtyMT]: item.QtyMT,
                    ["Qty " + G_QtyPC]: item.QtyPc,
                    ["Qty " + G_QtyMTR]: item.QtyMTRS,
                    "Qty RMTR": parseFloat(item.QtyRMTR).toFixed(3),
                    Action: G_OnlyEntry == "S" ? '<a class="btn btn-warning icon-height" title="Remove Pallet" onclick="PackingListFG_Remove(' + PackingListMaster_Code + ',\'' + item.Code + '\',\'' + item.PalletNo + '\')"> <i class="fa fa-remove"></i></a>' : item.PalletNo != "" ? '<a class="btn btn-danger icon-height" title="remove" onclick="PackingListFG_Remove(' + PackingListMaster_Code + ',\'' + item.Code + '\',\'\')"> <i class="fa fa-trash"></i></a>&nbsp;<a class="btn btn-warning icon-height" title="Remove Pallet" onclick="PackingListFG_Remove(' + PackingListMaster_Code + ',\'' + item.Code + '\',\'' + item.PalletNo + '\')"> <i class="fa fa-remove"></i></a>' : '<a class="btn btn-danger icon-height" title="remove" onclick="PackingListFG_Remove(' + PackingListMaster_Code + ',\'' + item.Code + '\',\'\')"> <i class="fa fa-trash"></i></a>',
                    QtyMT: item.QtyMT, QtyPC: item.QtyPc, QtyMTRS: item.QtyMTRS, QtyRMTR: item.QtyRMTR
                }
            })
        }
        

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS","QtyRMTR"];
        if (isView === 'Y') {
            hiddenColumns.push("Action");
        }
        if (G_OnlyEntry == "S") {
            hiddenColumns.push(BatchORBundleDesp +"/ID");
        }
        if (FourthOrderUnitApplicable==="N") {
            hiddenColumns.push("Qty RMTR");
        }
        if (ShowPalletTypeAndNoInPackingList === 'N') {
            hiddenColumns.push("Pallet No");
        }

        if (G_QtyMTR.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyMTR);
        }
        if (G_QtyMT.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyMT);
        }
        if (G_QtyPC.toUpperCase() == "NA") {
            hiddenColumns.push("Qty " + G_QtyPC);
        }

        const ColumnAlignment = {
            //"Qty PC": 'right',
            //"Qty KG": 'right',
            //"Qty SQM": 'right',
            "Qty RMTR": 'right'
        };
        ColumnAlignment["Qty " + G_QtyMT] = "right";
        ColumnAlignment["Qty " + G_QtyPC] = "right";
        ColumnAlignment["Qty " + G_QtyMTR] = "right";


        BizsolCustomFilterGrid.CreateDataTable("tbPackingListTransactionHeader", "tbPackingListTransactionBody", ArryPackingListTransaction, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

        PackingListTransactionSum(ArryPackingListTransaction);
    } else {
        $('#tbPackingListTransaction tr').empty();
        $('#paginator-tbPackingListTransaction').empty();
    }
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function EditMode(isView) {
    G_isView = isView;
    //alert('Mode:' + isView + PackingListMaster_Code);
    if (Number(PackingListMaster_Code) > 0) {
        PackingListFGService.GetShowPackingListData(PackingListMaster_Code, G_OnlyEntry).then(function (response) {

           
            console.log(response);
            if (response.length > 0) {
               
                BuyerPOMaster_Code = response[0][0].MRNMaster_Code > 0 ? response[0][0].MRNMaster_Code :  response[0][0].BuyerPoMaster_Code;
                ArryPackingListTransaction = response[1];
                Bind_PackingListTransactionGrid(isView);
                SelectOptionByText('ddlPackingType', response[0][0].PackingType);
                PackingListFG_OnChangeddlPackingType();
                G_dllClientName = response[0][0].ClienName;
                G_dllConsigneeName = response[0][0].ConsigneeName;
                G_DeliveryAddressCode = response[0][0].DeliveryAddressCode || "";


                $('#txtScanIdentification').removeAttr("readonly");

                $('#txtPackingListNo').val(response[0][0].PackingListNo);
               
                //$('#txtPackingListDate').val(new Date(response[0].PackingListDate).toISOString().slice(0, 10));
                $('#txtPackingListDate').val(response[0][0].PackingListDate.slice(0, 10));

                $('#txtDriverNo').val(response[0][0].DriverMobileNo);
                $('#txtVehicleNo').val(response[0][0].VehicleNo);
                $('#txtDistance').val(response[0][0].DistanceKM);
                $('#txtGRNo').val(response[0][0].GRNo);

                if (response[0][0].GRDate != null) {
                    $('#txtGRDate').val(response[0][0].GRDate.slice(0, 10));
                }
                

                $('#ddlPackingType').attr("disabled", "disabled");
                $('#ddlGodownFrom').attr("disabled", "disabled");
                $('#ddlGodownTo').attr("disabled", "disabled");
                $('#ddlReqNo').attr("disabled", "disabled");
                $('#ddlOrderNo').attr("disabled", "disabled");
       
                $('#ddlClientName').attr("disabled", "disabled");
                $('#ddlConsignee').attr("disabled", "disabled");
                $('#ddlTransporterName').attr("disabled", "disabled");
                $('#ddlDeliveryAddressCode').attr("disabled", "disabled");

                SelectOptionByText('ddlGodownFrom', response[0][0].GodownName);
                SelectOptionByText('ddlGodownTo', response[0][0].GodownNameTo);
                
                SelectOptionByText('ddlReqNo', response[0][0].RMRequisitionNo);
        
                SelectOptionByText('ddlClientName', response[0][0].ClienName);
                SelectOptionByText('ddlConsignee', response[0][0].ConsigneeName);
                SelectOptionByText('ddlTransporterName', response[0][0].TransporterName);


                if (response[0][0].RMRequisitionNo !== "" && G_isView=='Y') {
                    let option = '<option value="0" GodownNameTo="0" Code="0" GodownNameFrom="0"></option>';
                    option += '<option value="' + response[0][0].RMRequisitionNo + '" GodownNameTo="0" Code="0" GodownNameFrom="0" >' + response[0][0].RMRequisitionNo + '</option>';
                   
                    $('#ddlReqNo')[0].innerHTML = option;
                    $('#ddlReqNo').val(response[0][0].RMRequisitionNo);
                    $('#ddlReqNo').select2({
                        width: '-webkit-fill-available'
                    });
                }


                if (InvoiceByOrder === 'Y') {
                    if (response[0][0].PackingType !== 'Stock Transfer') {
                        if (response[0][0].PackingType === 'Purchase Return') {
                            Bind_ddlOrderNo("GetPendingMRNListByPartyName", response[0][0].ConsigneeName,'0');
                        }
                        else {
                           // Bind_ddlOrderNo("GetPendingOrderListByPartyName", response[0][0].ConsigneeName);
                            Bind_ddlOrderNoForEntryView("GetOrderListByPartyNameForEntryView", response[0][0].ConsigneeName);
                        }
                    }
                    
                }

                else {
                    //BindOrderNOForBatchPackingList(PackingListCode);
                    //$('#ddlOrderNo').val('@ViewBag.DespatchAdviceMaster_Code');
                    //$('#hfddlOrderNo').val('@ViewBag.DespatchAdviceMaster_Code');
                }
                
                $('#txtPackingListDate').attr("readonly", true);
                $('#ddlTransporterName').attr("readonly", true);
                $('#txtDriverNo').attr("readonly", true);
                $('#txtVehicleNo').attr("readonly", true);
                $('#txtDistance').attr("readonly", true);
                $('#txtGRNo').attr("readonly", true);
                $('#txtGRDate').attr("readonly", true);
                

                //if ('@ViewBag.ddlPackingType' === 'Stock Transfer') { changeddlPackingType(); }

                $('#btnScanQR').show();
                $('#btnUpdateRate').hide();

                // Check packing type for DivBtnAdd visibility
                let packingType = response[0][0].PackingType;
                if (packingType.toUpperCase().trim() === 'SCRAP DISPATCH' || packingType.toUpperCase().trim() === 'SCRAP') {
                    $('#DivBtnAdd').show();
                } else {
                    $('#DivBtnAdd').hide();
                }

                $('#btnLoadingEnd')[0].innerHTML = "End Loading"
                if (response[0][0].LoadingStatus === 'C') {
                    $('#btnLoadingEnd')[0].innerHTML = "Loaded"; $('#btnScanNoPallet').hide();
                    $('#txtScanIdentification').attr("readonly", true);
                    $('#btnLoadingEnd').removeAttr("onclick");
                    $('#btnLoadingEnd').attr("disabled", "disabled(");
                    $('#btnScanQR').hide();
                    $('#DivBtnAdd').hide();
                } else {
                    $('#btnLoadingEnd').removeAttr("disabled");
                    $('#btnLoadingEnd').attr("onclick", "return PackingListFG_EndLoading()");
                    $('#btnScanNoPallet').show();
                    $('#btnScanQR').show();
                    
                    // Show DivBtnAdd only if loading not complete and packing type is Scrap
                    if (packingType.toUpperCase().trim() === 'SCRAP DISPATCH' || packingType.toUpperCase().trim() === 'SCRAP') {
                        $('#DivBtnAdd').show();
                    }

                    G_TransactionRate = response[1].filter(item => item.Rate > 0).length;
                    if (G_EwayBillApplicable == "Y" && PackingType == "S" &&  G_TransactionRate==0) {
                       
                        $('#btnUpdateRate').show();
                    }
                }
                
                if (isView === 'Y') {
                    $('#DivBtnAdd').hide();
                    $('#txtScanIdentification').attr("readonly", true);
                    $('#btnLoadingEnd').removeAttr("onclick");
                    $('#btnLoadingEnd').attr("disabled", "disabled(");
                    $('#btnLoadingEnd')[0].innerHTML = "Loaded";
                    $('#btnScanNoPallet').hide();
                    $('#btnStart')[0].innerHTML = 'Scan Started';
                    $('#btnStart').attr("disabled", "disabled");
                    $('#btnStart').removeAttr("onclick");
                    $('#btnScanQR').hide();

                }
                else {
                    $('#btnStart')[0].innerHTML = 'Scan Started';
                    $('#btnStart').attr("disabled", "disabled");
                    $('#btnStart').removeAttr("onclick");
                    $('#btnScanQR').show();
                }

                if (ShowPalletTypeAndNoInPackingList === 'Y') {
                    $('#btnScanNoPallet').show();
                    $('#btnAvailableOrderStock').show();
                   
                } else {
                    $('#btnScanNoPallet').hide();
                    $('#btnAvailableOrderStock').hide();
                   

                }
                
            }
            

        });

        

    }
}

function PackingListFG_CreateNew() {

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'VerifyApplicableInPackingList').PeramaterValue === 'Y') {
        Bind_ddlReqNo();
        ClrFrm();
        ChangeMode('New');
        PackingListFG_OnChangeddlPackingType();
        $('#btnScanNoPallet').show();
        $('#btnUpdateRate').hide();
        if (ShowPalletTypeAndNoInPackingList === 'Y') {
            $('#btnScanNoPallet').show();
            $('#btnAvailableOrderStock').show();

        } else {
            $('#btnScanNoPallet').hide();
            $('#btnAvailableOrderStock').hide();


        }

    } else {
        toastr.error('Please Check! Verification enable Mandatory for web packing list.');
    }

}
function PackingListFG_Back() {
    PackingListFG_ShowViewGrid()
    ChangeMode('');
    ClrFrm();
}
function PackingListFG_EditOrView(isEdit, packingListMaster_Code) {

    $('#tbPackingListTransaction tr').empty();
    $('#paginator-tbPackingListTransaction').empty();

    if (isEdit === 'Y') {
        PackingListFGService.EditValidatePackingListBatchNo(packingListMaster_Code).then(function (response) {
            if (response.Status == 'Y') {
                //Bind_ddlReqNo()
                //$('#paginator-tbPackingListTransaction').show();
                PackingListMaster_Code = packingListMaster_Code;
                EditMode('N');
                ChangeMode('Edit');
            } else {
                toastr.error(response.Msg);
            }

        });
    } else {
        $('#paginator-tbPackingListTransaction').show();
        PackingListMaster_Code = packingListMaster_Code;
        EditMode('Y');
        ChangeMode('View');
    }


}
function PackingListFG_Verify(PackingListMaster_Code) {

    PackingListFGService.VerifyPackingListBatchNo(PackingListMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            PackingListFG_ShowViewGrid();
        } else {
            toastr.error(response.Msg);
        }
    });
}

function PackingListFG_GetValidationBatchOrId(item) {
    if (item.BatchNo && item.BatchNo !== '') {
        return item.BatchNo;
    }
    if (item.BaleNo && item.BaleNo !== '') {
        return item.BaleNo;
    }
    if (item.SerialNo && item.SerialNo !== '') {
        return item.SerialNo;
    }
    return item.IdentificationNo || '';
}

function PackingListFG_GetValidationBatchOrIdLabel() {
    if (ApplicableBatchWiseStock === "Y") {
        return FGNameForBatchNo !== "" ? FGNameForBatchNo : "Batch No";
    }
    if (BaleNoDesp !== "") {
        return BaleNoDesp;
    }
    return "Batch No / ID";
}

function PackingListFG_UpdateValidationCounts(data) {
    const validatedCount = data.filter(item => (item.Validate || '').toUpperCase() === 'Y').length;
    const unvalidatedCount = data.length - validatedCount;
    const allValidated = data.length > 0 && unvalidatedCount === 0;

    $('#spValidatedCount').text(validatedCount);
    $('#spUnvalidatedCount').text(unvalidatedCount);

    if (allValidated) {
        $('#spValidationStatus').show();
        $('#txtValidationScanText').prop('disabled', true).val('');
        $('#btnValidationScanQR').hide();
    } else {
        $('#spValidationStatus').hide();
        $('#txtValidationScanText').prop('disabled', false);
        $('#btnValidationScanQR').show();
    }

    if (allValidated) {
        PackingListFG_MarkGridAsValidated(G_ValidationPackingListMaster_Code);
    }
}

function PackingListFG_MarkGridAsValidated(packingListMaster_Code) {
    const tableId = 'tbPackingListFGView';
    const bodyId = 'tbPackingListFGViewBody';

    if (G_PackingListViewData[packingListMaster_Code]) {
        G_PackingListViewData[packingListMaster_Code].validate = 'Y';
    }

    const updateRowStatus = (rows) => {
        if (!rows || !Array.isArray(rows)) {
            return;
        }
        rows.forEach(row => {
            if (String(row.Code) === String(packingListMaster_Code)) {
                row.Status = 'Validated';
                row.Validate = 'Y';
            }
        });
    };

    updateRowStatus(window[`filteredData_${tableId}`]);
    updateRowStatus(window[`filteredDataTemp_${tableId}`]);

    if (typeof renderTableWithPagination === 'function' && $('#' + bodyId).length > 0) {
        renderTableWithPagination(tableId, bodyId);
    }
}

function PackingListFG_BuildValidationGridFooter(data) {
    const rows = data || [];
    if (rows.length === 0) {
        $('#tbValidationDetailsFooter').html('');
        return;
    }

    const palletNos = [...new Set(rows.map(item => String(item.PalletNo || '').trim()).filter(p => p !== ''))];
    const totalMT = rows.reduce((sum, item) => sum + (parseFloat(item.QtyMT) || 0), 0);
    const totalPC = rows.reduce((sum, item) => sum + (parseFloat(item.QtyPc) || 0), 0);
    const totalMTRS = rows.reduce((sum, item) => sum + (parseFloat(item.QtyMTRS) || 0), 0);
    const totalRMTR = rows.reduce((sum, item) => sum + (parseFloat(item.QtyRMTR) || 0), 0);

    let footerHtml = '<tr>';
    footerHtml += '<td style="text-align: right;">' + palletNos.length + '</td>';
    footerHtml += '<td></td>';
    footerHtml += '<td>TOTAL:</td>';
    footerHtml += '<td></td>';

    if (G_QtyMT.toUpperCase() !== "NA") {
        footerHtml += '<td style="text-align: right;">' + parseFloat(totalMT).toFixed(2) + '</td>';
    }
    if (G_QtyPC.toUpperCase() !== "NA") {
        footerHtml += '<td style="text-align: right;">' + totalPC + '</td>';
    }
    if (G_QtyMTR.toUpperCase() !== "NA") {
        footerHtml += '<td style="text-align: right;">' + parseFloat(totalMTRS).toFixed(2) + '</td>';
    }
    if (FourthOrderUnitApplicable === "Y") {
        footerHtml += '<td style="text-align: right;">' + parseFloat(totalRMTR).toFixed(2) + '</td>';
    }

    footerHtml += '<td></td><td></td>';
    footerHtml += '</tr>';

    $('#tbValidationDetailsFooter').html(footerHtml);
}

function PackingListFG_BindValidationGrid(data) {
    G_ValidationDetailsData = data || [];
    PackingListFG_UpdateValidationCounts(G_ValidationDetailsData);

    const batchOrIdLabel = PackingListFG_GetValidationBatchOrIdLabel() + " / ID";
    const columns = [
        { key: "Pallet No", align: "left", show: true },
        { key: batchOrIdLabel, align: "left", show: true },
        { key: "Item Name", align: "left", show: true },
        { key: "Size", align: "left", show: true },
        { key: "Qty " + G_QtyMT, align: "right", show: G_QtyMT.toUpperCase() !== "NA" },
        { key: "Qty " + G_QtyPC, align: "right", show: G_QtyPC.toUpperCase() !== "NA" },
        { key: "Qty " + G_QtyMTR, align: "right", show: G_QtyMTR.toUpperCase() !== "NA" },
        { key: "Qty RMTR", align: "right", show: FourthOrderUnitApplicable === "Y" },
        { key: "Validate By", align: "left", show: true },
        { key: "Validate On", align: "left", show: true }
    ].filter(col => col.show);

    let headerHtml = '<tr>';
    columns.forEach(col => {
        headerHtml += '<th class="' + (col.align === 'right' ? 'text-end' : '') + '">' + col.key + '</th>';
    });
    headerHtml += '</tr>';
    $('#tbValidationDetailsHeader').html(headerHtml);

    let bodyHtml = '';
    if (G_ValidationDetailsData.length === 0) {
        bodyHtml = '<tr><td colspan="' + columns.length + '" class="text-center">No validation details found.</td></tr>';
    } else {
        G_ValidationDetailsData.forEach(item => {
            const rowClass = (item.Validate || '').toUpperCase() === 'Y' ? 'pl-validation-row-validated' : '';
            bodyHtml += '<tr class="' + rowClass + '">';
            bodyHtml += '<td>' + (item.PalletNo || '') + '</td>';
            bodyHtml += '<td>' + PackingListFG_GetValidationBatchOrId(item) + '</td>';
            bodyHtml += '<td>' + (item.ItemName || '') + '</td>';
            bodyHtml += '<td>' + (item.SizeDesp || '') + '</td>';
            if (G_QtyMT.toUpperCase() !== "NA") {
                bodyHtml += '<td class="text-end">' + (item.QtyMT ?? '') + '</td>';
            }
            if (G_QtyPC.toUpperCase() !== "NA") {
                bodyHtml += '<td class="text-end">' + (item.QtyPc ?? '') + '</td>';
            }
            if (G_QtyMTR.toUpperCase() !== "NA") {
                bodyHtml += '<td class="text-end">' + (item.QtyMTRS ?? '') + '</td>';
            }
            if (FourthOrderUnitApplicable === "Y") {
                bodyHtml += '<td class="text-end">' + parseFloat(item.QtyRMTR || 0).toFixed(3) + '</td>';
            }
            bodyHtml += '<td>' + (item.ValidateBy || '') + '</td>';
            bodyHtml += '<td>' + (item.ValidateOn || '') + '</td>';
            bodyHtml += '</tr>';
        });
    }

    $('#tbValidationDetailsBody').html(bodyHtml);
    PackingListFG_BuildValidationGridFooter(G_ValidationDetailsData);
}

function PackingListFG_SetValidationHeaderInfo(packingListMaster_Code) {
    const header = G_PackingListViewData[packingListMaster_Code] || {};
    $('#spValidationPackingListNo').text(header.packingListNo || '');
    $('#spValidationDate').text(header.date || '');
    $('#spValidationWarehouse').text(header.warehouse || '');
    $('#spValidationPackingType').text(header.packingType || '');
    $('#spValidationPartyName').text(header.partyName || '');
}

function PackingListFG_LoadValidationDetails(showModal) {
    PackingListFGService.GetPackingListValidationDetails(G_ValidationPackingListMaster_Code).then(function (response) {
        const data = Array.isArray(response) ? response : (response?.Data || []);
        PackingListFG_BindValidationGrid(data);
        if (showModal === true) {
            $("#ValidationModal").modal({
                backdrop: 'static',
            });
            $("#ValidationModal").modal('show');
        }
    }).catch(function () {
        toastr.error('Unable to load validation details.');
        if (showModal === true) {
            PackingListFG_BindValidationGrid([]);
            $("#ValidationModal").modal({
                backdrop: 'static',
            });
            $("#ValidationModal").modal('show');
        }
    });
}

function PackingListFG_OpenValidationModal(packingListMaster_Code) {
    if (ApplicableValidationInPackingList !== 'Y') {
        toastr.error('Validation is not applicable for packing list.');
        return;
    }
    G_ValidationPackingListMaster_Code = packingListMaster_Code;
    $('#txtValidationScanText').val('').prop('disabled', false);
    $('#btnValidationScanQR').show();
    $('#spValidationStatus').hide();
    PackingListFG_SetValidationHeaderInfo(packingListMaster_Code);
    PackingListFG_LoadValidationDetails(true);
}

function PackingListFG_SubmitValidationScan() {
    const scanText = ($('#txtValidationScanText').val() || '').trim();
    if (scanText === '') {
        return;
    }

    $('#txtValidationScanText').prop('disabled', true);
    PackingListFGService.UpdatePackingListValidationDetails(G_ValidationPackingListMaster_Code, scanText).then(function (response) {
        $('#txtValidationScanText').prop('disabled', false);
        if (response.Status === 'Y') {
            toastr.success(response.Msg || 'Validated successfully.');
            $('#txtValidationScanText').val('');
            PackingListFG_LoadValidationDetails(false);
            $('#txtValidationScanText').focus();
        } else {
            toastr.error(response.Msg || 'Validation failed.');
            $('#txtValidationScanText').focus();
        }
    }).catch(function () {
        $('#txtValidationScanText').prop('disabled', false);
        toastr.error('Unable to update validation details.');
        $('#txtValidationScanText').focus();
    });
}

function PackingListFG_ShowDetailsModals(For) {
    $('#btnLoadNoOfPallet').hide();
    if (For === 'GetReqDetails') {
        let ddlReqNo = document.getElementById("ddlReqNo");
        let RMRequisitionMaster_Code = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["code"].value;



        if (RMRequisitionMaster_Code == 0) {
            toastr.error('Plz! select Requisition No');
            return
        }

        PackingListFGService.GetDetails(For, RMRequisitionMaster_Code).then(function (response) {


            console.log(response);
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["RMRequisitionMaster_Code", "StockGodownCode"];
            const ColumnAlignment = {
                "PC": 'right',
            };

            if (response.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbDetailsHeader", "tbDetailsbody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
                $('#ModalTitle')[0].innerHTML = 'Requisition Items Detail';
                $("#DetailsModal").modal({
                    backdrop: 'static',
                });
                $("#DetailsModal").modal('show');
            } else {
                //$('#tbPackingListFGView tr').empty()
                toastr.error('No Data Found!');
            }

        });

    }
    else if (For === 'AvailableStockDetail') {

        PackingListFGService.GetDetails(For, BuyerPOMaster_Code).then(function (response) {


            console.log(response);
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["RMRequisitionMaster_Code", "StockGodownCode"];
            const ColumnAlignment = {
                "PC": 'right',
            };

            if (response.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbDetailsHeader", "tbDetailsbody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
                $('#ModalTitle')[0].innerHTML = 'Available Stock Detail';
                $("#DetailsModal").modal({
                    backdrop: 'static',
                });
                $("#DetailsModal").modal('show');
            } else {
                //$('#tbPackingListFGView tr').empty()
                toastr.error('No Data Found!');
            }

        });
    }
    else if (For === 'ScanNoPallet') {
        let Code = BuyerPOMaster_Code;
        if (PackingType == 'S') {
            For = "ScanNoPalletForStockTransfer";
            let ddlReqNo = document.getElementById("ddlReqNo");
            Code = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["code"].value;
        } else {
            For = "ScanNoPalletForDispatch";
        }
        let ddlConsignee = document.getElementById("ddlConsignee");
        let ConsigneeName = ddlConsignee.options[ddlConsignee.selectedIndex].text;
        $('#btnLoadNoOfPallet').show();
        $('#btnLoadNoOfPallet')[0].innerHTML = "Load";
        if (ConsigneeName === '') {
            return;
        }

        PackingListFGService.GetPendingOrderList(For, ConsigneeName, Code, $('#ddlGodownFrom').val(),'0').then(function (response) {


            console.log(response);
            response = response.map((item) => ({
                "Item Name": item.ItemName, "Size Desp": item.SizeDesp, ["Qty " + G_QtyPC]: item.QtyPC, ["Qty " + G_QtyMT]: item.QtyMT, ["Qty " + G_QtyMTR]: item.QtyMR,
                "No Of Pallet Load/Id": '<input id="txtDistance" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" maxlength="6" autocomplete="off" value="0"><input type="hidden" value="' + item.BuyerPODetail_Code + '"/>'
            }))

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["RMRequisitionMaster_Code", "StockGodownCode", "ConsigneeName", "OrderNo", ""];
            const ColumnAlignment = {
                //"PC": 'right',
            };
            ColumnAlignment["Qty " + G_QtyMT] = "right";
            ColumnAlignment["Qty " + G_QtyPC] = "right";
            ColumnAlignment["Qty " + G_QtyMTR] = "right";

            if (response.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbDetailsHeader", "tbDetailsbody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
                $('#ModalTitle')[0].innerHTML = 'Scan No. Of Pallet';
                G_DetailsModalType = 'ScanPallet'
                $("#DetailsModal").modal({
                    backdrop: 'static',
                });
                $("#DetailsModal").modal('show');
            } else {
                //$('#tbPackingListFGView tr').empty()
                toastr.error('No Data Found!');
            }

        });

    }
    else if (For === 'ItemForRateUpdateDetail') {
        PackingListFGService.GetPendingOrderList('ItemForRateUpdate', '0', PackingListMaster_Code, 0,'0').then(function (response) {


            console.log(response);
            response = response.map((item) => ({
                ...item,
                "Rate": '<input id="txtRate" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" maxlength="6" autocomplete="off" value="0"><input type="hidden" value="' + item.ItemMaster_Code + '"/>'
            }))

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["ItemMaster_Code","HideObj"];
            const ColumnAlignment = {
                "Rate": 'right;Width:50px',
            };
            

            if (response.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbDetailsHeader", "tbDetailsbody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
                $('#ModalTitle')[0].innerHTML = 'Update Rate';
                G_DetailsModalType='Rate'
                $("#DetailsModal").modal({
                    backdrop: 'static',
                });
                $("#DetailsModal").modal('show');
                $('#btnLoadNoOfPallet')[0].innerHTML = "Update";
                $('#btnLoadNoOfPallet').show();
            } else {
                //$('#tbPackingListFGView tr').empty()
                toastr.error('No Data Found!');
            }

        });
    }
}

function PackingListFG_OnChangeddlPackingType() {

    $('#divGodownTo').hide();
    $('#btnAvailableOrderStock').show();
    $('#divReqNo').hide();
    $('#divOrderNo').show();
    $('#ddlClientName').removeAttr("disabled");
    $('#ddlConsignee').removeAttr("disabled");
    $('#lblddlClientName')[0].innerHTML ="Buyer Name:";
    $('#lblddlOrderNo')[0].innerHTML = "Order No:";
    G_dllClientName = '';
    G_dllConsigneeName=''
    G_EwayBillApplicable = "N";
    PackingType = "D";
    var ddlPackingType = document.getElementById("ddlPackingType");
    PackingType = ddlPackingType.options[ddlPackingType.selectedIndex].attributes["packingtype"].value;
    G_DefaultAccountCodeStockTransfar = 0;
    Bind_ddlClientNameORddlConsignee();

    // Get the selected packing type text
    let TextPackingType = ddlPackingType.options[ddlPackingType.selectedIndex].text;
    
    // Show DivBtnAdd only if packing type is "Scrap Dispatch" or "Scrap"
    if (TextPackingType.toUpperCase().trim() === 'SCRAP DISPATCH' || TextPackingType.toUpperCase().trim() === 'SCRAP') {
        $('#DivBtnAdd').show();
    } else {
        $('#DivBtnAdd').hide();
    }

    if (PackingType === "S") {
        $('#btnAvailableOrderStock').hide();
        $('#divGodownTo').show();
        // $('#ddlGodownTo').attr("required", true);
        PackingType = "S";
        if (RMRequisitionApplicableInPackingList === 'Y') {
            $('#divReqNo').show();
        }

        var ddlPackingType = document.getElementById("ddlPackingType");
        var DefaultAccountCode = ddlPackingType.options[ddlPackingType.selectedIndex].attributes["defaultaccountcode"].value;
        var EwayBillApplicable = ddlPackingType.options[ddlPackingType.selectedIndex].attributes["EwayBillApplicable"].value;
        G_EwayBillApplicable = EwayBillApplicable;
        if (Number(DefaultAccountCode) > 0) {
            G_DefaultAccountCodeStockTransfar = DefaultAccountCode;
            $('#ddlClientName').val(DefaultAccountCode);
            $('#ddlConsignee').val(DefaultAccountCode);
            $('#ddlClientName').select2({
                width: '-webkit-fill-available'
            })
            $('#ddlConsignee').select2({
                width: '-webkit-fill-available'
            })
            $('#ddlClientName').attr("disabled", "disabled");
            $('#ddlConsignee').attr("disabled", "disabled");



        }

        $('#divOrderNo').hide();
        if (G_EwayBillApplicable == 'Y') {
            //$('#totalActualWeight').show();
            $('#divRowTransporter').show();
        }
        else if (GRNoWithVehicleAndTrannsporterMandatoryInPackingList == 'Y') {
            $('#divRowTransporter').show();
        }

    }
    else {

        $('#ddlGodownTo').val('0');
        $('#ddlGodownTo').select2({
            width: '-webkit-fill-available'
        })
        $('#ddlGodownFrom').val('0');
        $('#ddlGodownFrom').select2({
            width: '-webkit-fill-available'
        })
        if (GRNoWithVehicleAndTrannsporterMandatoryInPackingList == 'Y') {
            $('#divRowTransporter').show();
        }
        else {
            $('#divRowTransporter').hide();
        }


        $('#ddlClientName').val(0);
        $('#ddlConsignee').val(0);
        $('#ddlClientName').select2({
            width: '-webkit-fill-available'
        })
        $('#ddlConsignee').select2({
            width: '-webkit-fill-available'
        })
        // ClientDataList('client');

        



        let ddlPackingType = document.getElementById("ddlPackingType");
        let TextPackingType = ddlPackingType.options[ddlPackingType.selectedIndex].text;
        if (PackingType === 'D' && TextPackingType.toUpperCase().trim() === ('JOBWORK RECEIVE SENT').trim()) {
            //GodownDataList('');
        }
        else {
            //GodownDataList('Dispatch');
        }

        if (PackingType === 'D' && TextPackingType.toUpperCase().trim() === ('PURCHASE RETURN').trim()) {
            Bind_ddlVendorNameORddlConsignee();
            G_PackingTypeDesp = TextPackingType;
            $('#lblddlOrderNo')[0].innerHTML = "MRN No.";
        }
        

    }

}
function PackingListFG_OnChangeddlClientNameORddlConsignee(element) {

    let eleId = element.id;
    let ele = element;
    let eleText = ele.options[ele.selectedIndex].text;
    let eleValue = ele.value;
    let ddlClientNameMode = G_PackingTypeDesp.toUpperCase().trim() === ('PURCHASE RETURN').trim() ? "GetPendingMRNListByPartyName" : '';
    if (eleId === 'ddlClientName') {
        $('#ddlConsignee').val(eleValue);
        $('#ddlConsignee').select2({
            width: '-webkit-fill-available'
        });
        ddlClientNameMode = ddlClientNameMode === '' ? "GetPendingOrderListByBuyerName" : ddlClientNameMode;
        //ddlClientNameMode = ddlClientNameMode === '' ? "GetPendingOrderListByPartyName" : ddlClientNameMode;
        Bind_ddlOrderNo(ddlClientNameMode, eleText, eleText);
        if (ShowDeliveryCodeInPackingList === 'Y') {
            Bind_ddlDeliveryAddressCode(eleValue);
        }
    }
    else {
        let ddlClientName = document.getElementById("ddlClientName");
        let ClientName = ddlClientName.options[ddlClientName.selectedIndex].text;
        ddlClientNameMode = ddlClientNameMode === '' ? "GetPendingOrderListByPartyName" : ddlClientNameMode;
        Bind_ddlOrderNo(ddlClientNameMode, eleText, ClientName);
    }
}

function PackingListFG_StartLoading(G_LoadNoOfPalletData=[]) {
    let ClientMaster_Code = $('#ddlClientName').val();
    let ConsigneeMaster_Code = $('#ddlConsignee').val();
    let PackingType_Code = $('#ddlPackingType').val();
    let ddlGodownTo_Code = $('#ddlGodownTo').val();
    let ddlGodownFrom_Code = $('#ddlGodownFrom').val();
    let ddlReqNo_Code = $('#ddlReqNo').val();
    
    let ddlGodownFrom = document.getElementById("ddlGodownFrom");
    let TextGodownFrom = ddlGodownFrom.options[ddlGodownFrom.selectedIndex].text;
    
    let ddlGodownTo = document.getElementById("ddlGodownTo");
    let TextGodownTo = ddlGodownTo.options[ddlGodownTo.selectedIndex].text;
    
    let ddlPackingType = document.getElementById("ddlPackingType");
    let TextPackingType = ddlPackingType.options[ddlPackingType.selectedIndex].text;

    let ddlClientName = document.getElementById("ddlClientName");
    let clientName = ddlClientName.options[ddlClientName.selectedIndex].text;

    let ddlConsignee = document.getElementById("ddlConsignee");
    let consigneeName = ddlConsignee.options[ddlConsignee.selectedIndex].text;
    let ddlOrderNo_Code = $('#ddlOrderNo')[0].value == "" ? "0" : $('#ddlOrderNo')[0].value;
   
    let ddlTransporterName = document.getElementById("ddlTransporterName");
    let TextTransporterName = ddlTransporterName.options[ddlTransporterName.selectedIndex].text;

    let DeliveryAddressCode = $('#ddlDeliveryAddressCode').val() || '';

    let OnlyEntry = "M";

    if (typeof ClientMaster_Code === 'undefined' || ClientMaster_Code === '' || ClientMaster_Code === null || ClientMaster_Code === '0') {
        toastr.error('Buyer Name could not blank');
       
        return false;
    } else if (typeof ConsigneeMaster_Code === 'undefined' || ConsigneeMaster_Code === '' || ConsigneeMaster_Code === null || ConsigneeMaster_Code === '0') {
        toastr.error('Consignee Name could not blank');
        
        return false;
    }
    else if (PackingType === "S" && (typeof ddlGodownTo_Code === 'undefined' || ddlGodownTo_Code === '' || ddlGodownTo_Code === null || ddlGodownTo_Code === '0')) {
        //  alert('Select Godown To ')
        toastr.error('Select Godown To ');
        
        return false;
    }
    else if (PackingType === "S" && (typeof ddlGodownTo_Code != 'undefined' || ddlGodownTo_Code != '' || ddlGodownTo_Code != null || ddlGodownTo_Code !== '0')) {
        if (ddlGodownTo_Code === ddlGodownFrom_Code) {
            toastr.error('Plz check! Warehouse From Warehouse To could not Same ');
            
            return false;
        }
    }
    if (typeof ddlGodownFrom_Code === 'undefined' || ddlGodownFrom_Code === '' || ddlGodownFrom_Code === null || ddlGodownFrom_Code === '0') {
       
        toastr.error('Plz check! Select Warehouse');

            return false;
        
    }

    let PackingListMaster = [{
        code: PackingListMaster_Code,
        packingListNo: 0,
        packingListDate: $('#txtPackingListDate')[0].value,
        clientName: clientName,
        consigneeName: consigneeName,
        remarks: "",
        finYear: FinYear,
        databaseLocation_Code: 0,
        userID: parseInt(JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code),
        roadPermitNo: "",
        vehicleNo: $('#txtVehicleNo')[0].value,
        godownName: TextGodownFrom,
        godownName_In: TextGodownTo,
        packingType: TextPackingType,
        transporterName: TextTransporterName,
        grNo: $('#txtGRNo')[0].value,
        grDate: $('#txtGRDate')[0].value,
        driverMobileNo: $('#txtDriverNo')[0].value,
        driverName: "",
        distanceKM: parseInt($('#txtDistance')[0].value),
        despatchAdviceMaster_Code: InvoiceByOrder == "Y" || G_PackingTypeDesp.toUpperCase().trim() === ('PURCHASE RETURN').trim() ? 0 : parseInt(ddlOrderNo_Code),
        removalTime: "",
        requisitionNo: $('#ddlReqNo')[0].value == "0" ? "" : $('#ddlReqNo')[0].value,
        buyerPoMaster_Code: G_PackingTypeDesp.toUpperCase().trim() === ('PURCHASE RETURN').trim() ? 0 : InvoiceByOrder == "Y" ? parseInt(ddlOrderNo_Code) : 0,
        printPC: "",
        printMT: "",
        printMTRS: "",
        mrnMaster_Code: G_PackingTypeDesp.toUpperCase().trim() === ('PURCHASE RETURN').trim() ? parseInt(ddlOrderNo_Code) : 0,
        deliveryAddressCode: DeliveryAddressCode
    }];

    let packingListPayLoad = {
        packingListMaster: PackingListMaster,
        packingListTransaction: AddPackingListTransaction
    }

    if (PackingListMaster_Code > 0) {
        OnlyEntry="T"
    }

    if (G_LoadNoOfPalletData.length > 0) {
        let loadNoofPalletInPackingListPayLoad = {
            packingListMaster: PackingListMaster,
            noofPallet: G_LoadNoOfPalletData
        }
        let ShowAllStockasPerSize = "N";


        if ($('#chkOtherStock')[0].checked == true) {
            ShowAllStockasPerSize = "Y";
        }
        console.log(packingListPayLoad);
        Showloader()
        PackingListFGService.LoadNoofPalletInPackingList(JSON.stringify(loadNoofPalletInPackingListPayLoad), ShowAllStockasPerSize).then(function (response1) {
            if (response1.Status === 'Y') {
                PackingListFGService.GetShowPackingListData(PackingListMaster_Code, G_OnlyEntry).then(function (response) {
                        toastr.success(response1.Msg);
                        ArryPackingListTransaction = response[1];
                        Bind_PackingListTransactionGrid('N');
                        $('#DetailsModal').modal('hide');
                        HideLoader();
                    });

            }
            else {
                toastr.error(response.Msg);
                HideLoader()
            }

        });

    }else {
        console.log(packingListPayLoad);

        PackingListFGService.ValidatePackingList(PackingListMaster_Code, OnlyEntry, JSON.stringify(packingListPayLoad)).then(function (response) {
            if (response.Status === 'Y') {
                // toastr.success(`Entry save success`);
                PackingListFGService.SavePackingList(PackingListMaster_Code, OnlyEntry, JSON.stringify(packingListPayLoad)).then(function (response) {
                    if (response.Status === 'Y') {

                        if (PackingListMaster_Code == 0) {
                            toastr.success(`Entry started !`);
                            PackingListMaster_Code = response.Code;
                            EditMode('N');
                        } else {
                            PackingListFGService.GetShowPackingListData(PackingListMaster_Code, G_OnlyEntry).then(function (response) {
                                toastr.success(`Entry save success`);
                                ArryPackingListTransaction = response[1];
                                Bind_PackingListTransactionGrid('N');
                            });
                        }

                    }
                    else {
                        toastr.error(response.Msg);
                    }

                });

            }
            else {
                toastr.error(response.Msg);
            }

        });
    }
    //toastr.error('Loading Start...');
}
function PackingListFG_ScanIdDataList() {
    let chkShowDataList = $('#chkShowIdDataList');
    if (chkShowDataList[0].checked) {
        let ddlReqNo = document.getElementById("ddlReqNo");
        let RMRequisitionMasterCode = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["code"].value;
        let FromGodownCode = $('#ddlGodownFrom').val();

        if (FromGodownCode == "0" || FromGodownCode == "") {
            return;
        }
        Showloader();
        PackingListFGService.ScanIdDataList(RMRequisitionMasterCode, FromGodownCode, BuyerPOMaster_Code).then(function (response) {
            HideLoader();
            AutoSuggestionControl.SetUpAutoSuggestion($('#txtScanIdentification'), $('#txtScanIdentification_List'), response.map((item) => ({ Desp: item.IdentificationNo })), 'StartWith', false);
        });
    } else {
        $('#txtScanIdentification_List').empty();
    }
    
}
function PackingListFG_EndLoading() {
    PackingListFGService.LoadingEndPackingListBatchNo(PackingListMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            PackingListFG_ShowViewGrid();
        } else {
            toastr.error(response.Msg);
        }
    });
}

function PackingListFG_EndLoadingOnGrid(packingListMaster_Code) {
    if (confirm("Vehicle are Loading...Do you want to Loading end of this Packing List ?!") == true) {
        PackingListFGService.LoadingEndPackingListBatchNo(packingListMaster_Code).then(function (response) {
            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                PackingListFG_ShowViewGrid();
            } else {
                toastr.error(response.Msg);
            }
        });
    } 


    
}

function PackingListFG_Remove(packingListMaster_Code, packingListTransaction_Code, palletNo) {
    if (G_OnlyEntry == "S" && palletNo=="") {
        toastr.warning('This entry not Remove in summary. please uncheck summary option to delete this entry!');
        return;
    }

    if (confirm(`Are you sure you want to Remove ${palletNo}?`) == true) {
        Showloader();
        PackingListFGService.RemovePackingListTransaction(packingListMaster_Code, packingListTransaction_Code,palletNo).then(function (response) {

            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                PackingListFGService.GetShowPackingListData(PackingListMaster_Code, G_OnlyEntry).then(function (response) {
                    ArryPackingListTransaction = response[1];
                    Bind_PackingListTransactionGrid('N');
                    HideLoader();
                });
            } else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });
    }
}

 function PackingListFG_LoadNoOfPallet() {
    let LoadNoOfPalletData = [];
    let dtScanPendingOrderForPallet = document.getElementById("tbDetails");
    let RowNo = 1;
    let indxCells = 5;

    if (G_DetailsModalType==='Rate') {
        indxCells = 2;
    }
    for (let i = 0; i < dtScanPendingOrderForPallet.rows.length; i++) {
        if (i == 0) {

        }
        else {
            let tbScanPendingOrderPalletUpdateRow = dtScanPendingOrderForPallet.rows[i];
            let noofPallet = tbScanPendingOrderPalletUpdateRow.cells[indxCells].getElementsByTagName('input')[0].value;
            let BuyerPODetail_Code = tbScanPendingOrderPalletUpdateRow.cells[indxCells].getElementsByTagName('input')[1].value;
            if (noofPallet == "" || noofPallet == "0") {
                //M.toast({ html: 'No Of Pallet can not be blank or Zero' });
                //return;
            } else if (G_DetailsModalType === 'Rate') {
                LoadNoOfPalletData.push({
                    
                    ItemMaster_Code: BuyerPODetail_Code,
                    Rate: noofPallet
                });
            }
            else {
                LoadNoOfPalletData.push({
                    rowNo: RowNo,
                    buyerPODetail_Code: BuyerPODetail_Code,
                    noofPallet: noofPallet
                });
                RowNo++;
            }
        }
    }

    if (LoadNoOfPalletData == 0 ) {
        toastr.warning(`Please Add atleast one No Of ${G_DetailsModalType === 'Rate' ? 'Rate' :'Pallet'}`);
        return;
    }

    if (G_DetailsModalType === 'Rate') {
        Promise.all(LoadNoOfPalletData.map(async item => {

            let UpdateRespon = await PackingListFGService.UpdateRate(PackingListMaster_Code,item.ItemMaster_Code, item.Rate)

            if (UpdateRespon.Status == 'Y') {
                toastr.success(UpdateRespon.Msg);
            } else {
                toastr.error(UpdateRespon.Msg);
            }
        }))
       // toastr.success(UpdateRespon.Msg);

    } else { 
        PackingListFG_StartLoading(LoadNoOfPalletData);
    }
    
}
function ClrFrm() {
    PackingListMaster_Code = 0;
    BuyerPOMaster_Code = 0;
    ArryPackingListTransaction = [];
    AddPackingListTransaction = [];
    G_dllClientName = '';
    G_dllConsigneeName = '';
    G_PackingTypeDesp = '';
    G_DefaultAccountCodeStockTransfar = 0;
    G_DeliveryAddressCode = "";

    $('#txtPackingListNo').val('0');
    $('#txtScanIdentification').val('');
    //$('#txtPackingListDate').val(new Date(response[0].PackingListDate).toISOString().slice(0, 10));
    $('#txtPackingListDate').val(new Date().toISOString().slice(0, 10));
    SelectOptionByText('ddlPackingType', 'Dispatch');
    
    $('#ddlGodownFrom').val('0');
    $('#ddlGodownTo').val('0');
    $('#ddlReqNo').val('0');
    $('#ddlOrderNo').val('0');
    $('#ddlOrderNo')[0].innerHTML = "";
    $('#ddlClientName').val('0');
    $('#ddlConsignee').val('0');

    
    
    $('#ddlTransporterName').val("0");
    $('#txtDriverNo').val("");
    $('#txtVehicleNo').val("");
    $('#txtDistance').val("0");
    $('#txtGRNo').val("");
    //$('#txtGRDate').val("");
    $('#txtGRDate').val(new Date().toISOString().slice(0, 10));
    $('#ddlDeliveryAddressCode').val('0');
    $('#ddlDeliveryAddressCode').select2({ width: '-webkit-fill-available' });

   
    $('#ddlGodownFrom').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlGodownTo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlReqNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlOrderNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlClientName').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlConsignee').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlTransporterName').select2({
        width: '-webkit-fill-available'
    });



    $('#ddlPackingType').removeAttr("disabled");
    $('#ddlGodownFrom').removeAttr("disabled");
    $('#ddlGodownTo').removeAttr("disabled");
    $('#ddlReqNo').removeAttr("disabled");
    $('#ddlOrderNo').removeAttr("disabled");

    $('#ddlClientName').removeAttr("disabled");
    $('#ddlConsignee').removeAttr("disabled");
    $('#ddlDeliveryAddressCode').removeAttr("disabled");

    $('#txtPackingListDate').removeAttr("readonly");
    $('#ddlTransporterName').removeAttr("disabled");
    $('#txtDriverNo').removeAttr("readonly");
    $('#txtVehicleNo').removeAttr("readonly");
    $('#txtDistance').removeAttr("readonly");
    $('#txtGRNo').removeAttr("readonly");
    $('#txtGRDate').removeAttr("readonly");

    $('#btnStart')[0].innerHTML = 'Start Scan';
    $('#btnStart').removeAttr("disabled");
    $('#btnStart').attr("onclick","PackingListFG_StartLoading()");

    $('#divGodownTo').hide();
    $('#divReqNo').hide();
    $('#txtScanIdentification').attr('readonly', 'readonly');

    $('#tbPackingListTransaction tr').empty();
    $('#paginator-tbPackingListTransaction').empty();

    $('#txtScanIdentification_List').empty();

    let chkShowDataList = $('#chkShowIdDataList');
    chkShowDataList[0].checked = false;
    $('#btnScanQR').hide();
    $('#btnUpdateRate').hide();
}
function ScanId() {
   console.log('scanid')
    let idno = $('#tbPackingListTransaction tbody')[0].innerHTML;
    let BundleOrId = $('#txtScanIdentification').val();
    let EntryDate = $('#txtPackingListDate').val();

    if (BundleOrId === "") {
        return;
    }

    if (BundleOrId !="" && idno.includes(BundleOrId)==true) {
        toastr.warning(BundleOrId + ' already in list');
        return;
    }

    let GodownMaster_Code = $('#ddlGodownFrom').val();
   
    let ShowAllStockasPerSize = "N";


    if ($('#chkOtherStock')[0].checked == true) {
        ShowAllStockasPerSize = "Y";
    }
    Showloader();
    PackingListFGService.ScanPendingId(BundleOrId, GodownMaster_Code, InvoiceByOrder == 'Y' ? BuyerPOMaster_Code : 0, InvoiceByOrder == 'Y' ? 0 : BuyerPOMaster_Code , EntryDate, ShowAllStockasPerSize, PackingListMaster_Code).then(function (response) {


        if (response.length > 0) {
            console.log(response);
            AddPackingListTransaction = response.map((item) => ({
                rowNo: item.RowNo,
                code: 0,
                packingListMaster_Code: PackingListMaster_Code,
                orderNo: item.OrderNo,
                orderItemName: item.OrderItemName,
                itemName: item.ItemName,
                displayItemName: item.DisplayItemName,
                baleNo: BaleNoDesp == "Bundle No" ? item.BaleNo: '',
                batchNo: ApplicableBatchWiseStock == "Y" || BOMOrderWiseFor == "PPPL" ? item.BatchNo :'',
                serialNo: item.SerialNo,
                identificationNo: item.IdentificationNo,
                sizeDesp: item.SizeDesp,
                sizeToDisplay: item.SizeToDisplay,
                qtyMT: item.QtyMT,
                qtyPc: item.QtyPc,
                qtyMTRS: item.QtyMTRS,
                actualWeight: item.ActualWeight,
                weightDiff: item.WeightDiff,
                rate: item.Rate,
                rateUnt: item.RateUnt,
                estimatedValue: item.EstimatedValue,
                remark: item.Remark,
                itemSizeMaster_Code: item.ItemSizeMaster_Code,
                stockMaster_Code: item.StockMaster_Code,
                stockMaster_Code_In: item.StockMaster_Code_In,
                buyerPODetail_Code: item.BuyerPODetail_Code,
                palletNo: item.PalletNo,
                orderSize: "",
                orderParticular: "",
                bomParticular: item.BomParticular,
                bomOrderWisePerPcWeight: item.BomOrderWisePerPcWeight,
                markNo: item.MarkNo,
                weightPerPc: item.WeightPerPc,
                erpItemMaster_code: item.ERPItemMaster_code,
                palletType: "",
                palletWeight: 0,
                qtyRMTR: 0,
                mrnMaster_Code: item.MRNMaster_Code
            }));

            console.log(AddPackingListTransaction);
            PackingListFG_StartLoading();
            Bind_PackingListTransactionGrid('N');
            $('#txtScanIdentification').val('');
            HideLoader();
        } else {

            PackingListFGService.GetNotfoundScanInfoInPackingList(BundleOrId).then(function (resOBJ) {

                

                

                if (resOBJ.Status == 'Y') {
                        toastr.error(`Batch No / ID : ${BundleOrId} Not Found in Godown.! Check By: USP_WebAPI_WebGetPackingListItemStock`);
                        toastr.info(resOBJ.Msg);
                    } else {
                        toastr.error(resOBJ.Msg);
                        toastr.error(`Batch No / ID : ${BundleOrId} Not Found in Godown.! Check By: USP_WebAPI_WebGetPackingListItemStock`);
                    }
                    
                


                    
                    
                
                HideLoader();
            });

            //toastr.warning(`Batch No / ID : ${BundleOrId} Not Found in Godown.! Check By: USP_WebAPI_WebGetPackingListItemStock`);
            //HideLoader();
        }
    });

   
}
 
function LoadFrm() {
    

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'InvoiceByOrder').PeramaterValue === 'Y') {
        $('#lblddlOrderNo')[0].innerHTML = 'Order No:';
        $('#ddlOrderNo').attr('multiple', '');
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });
        InvoiceByOrder = "Y";
    } else {
        $('#lblddlOrderNo')[0].innerHTML = 'Desp.Adv.No';
    }

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'GRNoWithVehicleAndTrannsporterMandatoryInPackingList').PeramaterValue === 'Y') {
       GRNoWithVehicleAndTrannsporterMandatoryInPackingList = "Y";
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'RMRequisitionApplicableInPackingList').PeramaterValue === 'Y') {
        RMRequisitionApplicableInPackingList = "Y";
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FinYear').PeramaterValue != '') {
        FinYear = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FinYear').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'BaleNoDesp').PeramaterValue != '') {
        BaleNoDesp = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'BaleNoDesp').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'BOMOrderWiseFor').PeramaterValue != '') {
        BOMOrderWiseFor = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'BOMOrderWiseFor').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ApplicableBatchWiseStock').PeramaterValue != '') {
        ApplicableBatchWiseStock = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ApplicableBatchWiseStock').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FourthOrderUnitApplicable').PeramaterValue != '') {
        FourthOrderUnitApplicable = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FourthOrderUnitApplicable').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ShowPalletTypeAndNoInPackingList').PeramaterValue != '') {
        ShowPalletTypeAndNoInPackingList = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ShowPalletTypeAndNoInPackingList').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FGNameForBatchNo').PeramaterValue != '') {
        FGNameForBatchNo = PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'FGNameForBatchNo').PeramaterValue;
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'AutoSelectConsigneeByOrder').PeramaterValue === 'Y') {
        G_AutoSelectConsigneeByOrder = "Y";
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ApplicableValidationInPackingList').PeramaterValue === 'Y') {
        ApplicableValidationInPackingList = "Y";
    } else {
        ApplicableValidationInPackingList = "N";
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ShowDeliveryCodeInPackingList') &&
        PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ShowDeliveryCodeInPackingList').PeramaterValue === 'Y') {
        ShowDeliveryCodeInPackingList = "Y";
        $('#divDeliveryAddressCode').show();
    } else {
        ShowDeliveryCodeInPackingList = "N";
        $('#divDeliveryAddressCode').hide();
    }

    if (ShowPalletTypeAndNoInPackingList === 'Y') {
        let chkSummary = document.getElementById("chkSummary");
        chkSummary.checked = true;
        G_OnlyEntry = "S";
        $('#btnScanNoPallet').show();
        $('#btnAvailableOrderStock').show();
    } else {
        $('#btnScanNoPallet').hide();
        $('#btnAvailableOrderStock').hide();

    }
     
    
    $('#divGodownTo').hide();
    $('#divReqNo').hide();
    $('#txtScanIdentification').attr('readonly', 'readonly');
    $('#btnScanQR').hide();
}

$('#ddlReqNo').on('change', function () {


    var ddlReqNo = document.getElementById("ddlReqNo");
    var GodownTotext = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["godownnameto"].value;
    var GodownFromtext = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["godownnamefrom"].value;

    var dd = document.getElementById('ddlGodownTo');
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === GodownTotext) {
            dd.selectedIndex = i;
            break;
        }
    }

    var d2 = document.getElementById('ddlGodownFrom');
    for (var i = 0; i < dd.options.length; i++) {
        if (d2.options[i].text === GodownFromtext) {
            d2.selectedIndex = i;
            break;
        }
    }

    
    $('#ddlGodownTo').select2({
        width: '-webkit-fill-available'
    })
    
    $('#ddlGodownFrom').select2({
        width: '-webkit-fill-available'
    })

    //ScanIdDataList();

});
$('#txtScanIdentification').on('keydown', function (e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        ScanId();
        $('#txtScanIdentification').focus()
        return false;
    }
});
$('#txtValidationScanText').on('keydown', function (e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        PackingListFG_SubmitValidationScan();
        return false;
    }
});
$('#ValidationModal').on('shown.bs.modal', function () {
    $('#txtValidationScanText').focus();
});
$('#chkSummary').on('change', function () {
    let chkSummary = document.getElementById("chkSummary");
    if (chkSummary.checked == true) {
        G_OnlyEntry = "S";
    } else {
        G_OnlyEntry = "T";
    }
    Showloader();
    PackingListFGService.GetShowPackingListData(PackingListMaster_Code, G_OnlyEntry).then(function (response) {
        ArryPackingListTransaction = response[1];
        Bind_PackingListTransactionGrid(G_isView);
        $('#DetailsModal').modal('hide');
        HideLoader();
    });
});

function InitScanQRCodeByCameraControl(outputQRTextElementID, callBackFunctionName) {
    let url = baseUrl + '/CustomControl/ScanQRCodeByCameraControl';

    $('#DivScanQRCodeByCameraControlModal').load(url, { OutputQRTextElementID: outputQRTextElementID, CallBackFunctionName: callBackFunctionName });

}
function PackingListFG_btnScanQR() {

    InitScanQRCodeByCameraControl("txtScanIdentification", "PackingListFG_CallbackScanQRCode");
}
function PackingListFG_btnValidationScanQR() {
    InitScanQRCodeByCameraControl("txtValidationScanText", "PackingListFG_CallbackValidationScanQRCode");
}
function PackingListFG_CallbackScanQRCode() {
    ScanId();
    $('#txtScanIdentification').focus()
}
function PackingListFG_CallbackValidationScanQRCode() {
    PackingListFG_SubmitValidationScan();
    $('#txtValidationScanText').focus();
}

function PackingListFG_DeleteEntryOnGrid(packingListMaster_Code) {
    if (confirm("Do you want to delete this Packing List ?!") == true) {

        Showloader();
        PackingListFGService.RemovePackingListTransaction(packingListMaster_Code, 0, '0').then(function (response) {

            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                PackingListFG_ShowViewGrid();
                HideLoader();
            } else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });
        //PackingListFGService.LoadingEndPackingListBatchNo(packingListMaster_Code).then(function (response) {
        //    if (response.Status == 'Y') {
        //        toastr.success(response.Msg);
        //        PackingListFG_ShowViewGrid();
        //    } else {
        //        toastr.error(response.Msg);
        //    }
        //});
    }
}

function PackingListFG_OnChangeddlOrderNo() {

    if (G_AutoSelectConsigneeByOrder === 'Y') {
        let ddlOrderNo = document.getElementById("ddlOrderNo");
        let selectedOrderValue = ddlOrderNo.value;

        // Skip if no order is selected
        if (!selectedOrderValue || selectedOrderValue === '0') {
            return;
        }

        // Get all options with the same order value (same order number)
        let allOptions = Array.from(ddlOrderNo.options);
        let sameOrderOptions = allOptions.filter(opt => opt.value === selectedOrderValue);

        // Extract unique party names for this order
        let uniquePartyNames = [...new Set(sameOrderOptions.map(opt => opt.getAttribute('partyname')))];

        // Remove '0' or empty values from unique party names
        uniquePartyNames = uniquePartyNames.filter(name => name && name !== '0');

        // Only auto-select if there is exactly one unique party name for this order
        if (uniquePartyNames.length === 1) {
            let partyName = uniquePartyNames[0];
            SelectOptionByText('ddlConsignee', partyName);
        }
    }
}


// Manual Item Table Management
let ManualItemRowCounter = 0;
let ManualItemList = [];

// Initialize Manual Item Table Header
function InitializeManualItemTableHeader() {
    const headerHTML = `
        <tr>
            <th style="width: 300px;">Item Name</th>
            <th style="width: 300px;">Size</th>
            <th style="width: 120px;">Qty ${G_QtyMT}</th>
            <th style="width: 120px;">Qty ${G_QtyPC}</th>
            <th style="width: 120px;">Qty ${G_QtyMTR}</th>
            <th style="width: 150px;">Action</th>
        </tr>
    `;
    $('#tbPackingListTransactionManualItemHeader')[0].innerHTML = headerHTML;
}

// Fetch Item List for Dropdown
async function GetItemListForManualEntry() {
    if (ManualItemList.length === 0) {
        try {
            Showloader();
            // Using existing service to get item list
            let response = await PackingListFGService.GetPackingListDDl('GetddlItemName');
            ManualItemList = response.map(item => ({ Code: item.Code, Desp: item.ItemName || item.Desp }));
            HideLoader();
        } catch (error) {
            console.error('Error fetching item list:', error);
            HideLoader();
            toastr.error('Failed to fetch item list');
        }
    }
    return ManualItemList;
}

// Add New Row to Manual Item Table
async function PackingListFG_AddManualItem() {
    // Initialize header if not already done
    if ($('#tbPackingListTransactionManualItemHeader tr').length === 0) {
        InitializeManualItemTableHeader();
    }

    // Get item list
    await GetItemListForManualEntry();

    ManualItemRowCounter++;
    const rowId = `manualRow_${ManualItemRowCounter}`;

    // Build Item Dropdown Options
    let itemOptions = '<option value="0">-- Select Item --</option>';
    ManualItemList.forEach(item => {
        itemOptions += `<option value="${item.Code}">${item.Desp}</option>`;
    });

    // Create Row HTML
    const rowHTML = `
        <tr id="${rowId}" data-row-id="${ManualItemRowCounter}">
            <td>
                <select class="form-control form-control-sm" id="ddlItem_${ManualItemRowCounter}">
                    ${itemOptions}
                </select>
            </td>
            <td>
                <select class="form-control form-control-sm" id="ddlSize_${ManualItemRowCounter}">
                    
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm text-end" id="txtQtyMT_${ManualItemRowCounter}" 
                       onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" 
                       onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);" 
                       maxlength="10" autocomplete="off" value="0" />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm text-end" id="txtQtyPC_${ManualItemRowCounter}" 
                       onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" 
                       maxlength="10" autocomplete="off" value="0" />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm text-end" id="txtQtyMR_${ManualItemRowCounter}" 
                       onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" 
                       maxlength="10" autocomplete="off" value="0" />
            </td>
            <td>
                <button type="button" class="btn btn-success btn-sm" onclick="PackingListFG_SaveManualItem(${ManualItemRowCounter})" title="Save">
                    <i class="fa fa-save"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="PackingListFG_RemoveManualItem(${ManualItemRowCounter})" title="Remove">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `;

    // Append row to table body
    $('#tbPackingListTransactionManualItemBody').append(rowHTML);

    // Initialize Select2 for the dropdown
    $(`#ddlItem_${ManualItemRowCounter}`).select2({
        width: '100%',
        dropdownParent: $('#DivPackingListFGForm')
    }).on('change', async function () {
        const itemCode = $(this).val();
        

        if (itemCode && itemCode !== '0') {
            const rowId = $(this).closest('tr').data('row-id');
            const sizeDropdown = $(`#ddlSize_${rowId}`);
            // Fetch sizes for the selected item
            let SizeDropRes = await PackingListFGService.GetDetails('GetItemSizeDetail', itemCode);

            if (SizeDropRes) {
                let sizeOptions = '<option value="0">Select Size</option>';
                SizeDropRes.forEach(function (size) {
                    sizeOptions += `<option value="${size.Code}">${size.SizeDesp}</option>`;
                });
                sizeDropdown.html(sizeOptions).prop('disabled', false);

                // Initialize Select2 for size dropdown
                sizeDropdown.select2({
                    width: '100%',
                    dropdownParent: $('#DivPackingListFGForm')
                });
            } else { 
            
                    sizeDropdown.html('<option value="0">Select Size</option>').prop('disabled', true);
            }
                
        }
       
    });
}

// Save Manual Item to Packing List
function PackingListFG_SaveManualItem(rowId) {
    const itemCode = $(`#ddlItem_${rowId}`).val();
    const sizeCode = $(`#ddlSize_${rowId}`).val();
    const itemText = $(`#ddlItem_${rowId} option:selected`).text();
    let sizeText = $(`#ddlSize_${rowId} option:selected`).text();
    const qtyMT = parseFloat($(`#txtQtyMT_${rowId}`).val()) || 0;
    const qtyPC = parseFloat($(`#txtQtyPC_${rowId}`).val()) || 0;
    const qtyMR = parseFloat($(`#txtQtyMR_${rowId}`).val()) || 0;

    // Validation
    if (itemCode === '0' || itemCode === '') {
        toastr.error('Please select an Item Name');
        return;
    }

    if (qtyMT === 0 && qtyPC === 0 && qtyMR === 0) {
        toastr.error('Please enter at least one quantity');
        return;
    }

    if (PackingListMaster_Code === 0) {
        toastr.error('Please start the packing list first by clicking "Start Scan"');
        return;
    }
    if (sizeText.includes('Select Size') == true) {
        sizeText = '';
    }
    // Prepare data for saving
    const manualItemData = [{
        rowNo: 0,
        code: 0,
        packingListMaster_Code: PackingListMaster_Code,
        orderNo: '',
        orderItemName: itemText,
        itemName: itemText,
        displayItemName: itemText,
        baleNo: '',
        batchNo: '',
        serialNo: '',
        identificationNo: '',
        sizeDesp: sizeText,
        sizeToDisplay: sizeText,
        qtyMT: qtyMT,
        qtyPc: qtyPC,
        qtyMTRS: qtyMR,
        actualWeight: 0,
        weightDiff: 0,
        rate: 0,
        rateUnt: 'MT',
        estimatedValue: 0,
        remark: '',
        itemSizeMaster_Code: sizeCode,
        stockMaster_Code: 0,
        stockMaster_Code_In: 0,
        buyerPODetail_Code: 0,
        palletNo: '',
        orderSize: '',
        orderParticular: '',
        bomParticular: '',
        bomOrderWisePerPcWeight: 0,
        markNo: '',
        weightPerPc: 0,
        erpItemMaster_code: 0,
        palletType: '',
        palletWeight: 0,
        qtyRMTR: 0,
        mrnMaster_Code: 0
    }];

    AddPackingListTransaction = manualItemData;

    // Save to packing list
    Showloader();
    PackingListFG_StartLoading();

    // Remove the row after successful save
    setTimeout(() => {
        $(`#manualRow_${rowId}`).remove();

        // If no more rows, clear the header
        if ($('#tbPackingListTransactionManualItemBody tr').length === 0) {
            $('#tbPackingListTransactionManualItemHeader').empty();
        }
        HideLoader();
    }, 1000);
}

// Remove Manual Item Row
function PackingListFG_RemoveManualItem(rowId) {
    if (confirm('Are you sure you want to remove this row?')) {
        $(`#manualRow_${rowId}`).remove();

        // If no more rows, clear the header
        if ($('#tbPackingListTransactionManualItemBody tr').length === 0) {
            $('#tbPackingListTransactionManualItemHeader').empty();
        }
    }
}

PackingListFG_ShowViewGrid();
getPackingListFGFixedParaMeters();
Bind_AllDLL();
//LoadFrm();



window.PackingListFG_CreateNew = PackingListFG_CreateNew;
window.PackingListFG_Back = PackingListFG_Back;
window.PackingListFG_ShowViewGrid = PackingListFG_ShowViewGrid;
window.PackingListFG_EditOrView = PackingListFG_EditOrView;
window.PackingListFG_Verify = PackingListFG_Verify;
window.PackingListFG_OpenValidationModal = PackingListFG_OpenValidationModal;
window.PackingListFG_SubmitValidationScan = PackingListFG_SubmitValidationScan;
window.PackingListFG_ShowDetailsModals = PackingListFG_ShowDetailsModals;
window.PackingListFG_OnChangeddlPackingType = PackingListFG_OnChangeddlPackingType;
window.PackingListFG_OnChangeddlClientNameORddlConsignee = PackingListFG_OnChangeddlClientNameORddlConsignee;
window.PackingListFG_StartLoading = PackingListFG_StartLoading;
window.PackingListFG_EndLoading = PackingListFG_EndLoading;
window.PackingListFG_ScanIdDataList = PackingListFG_ScanIdDataList;
window.PackingListFG_Remove = PackingListFG_Remove;
window.PackingListFG_LoadNoOfPallet = PackingListFG_LoadNoOfPallet;
window.PackingListFG_EndLoadingOnGrid = PackingListFG_EndLoadingOnGrid;
window.PackingListFG_btnScanQR = PackingListFG_btnScanQR;
window.PackingListFG_btnValidationScanQR = PackingListFG_btnValidationScanQR;
window.PackingListFG_CallbackScanQRCode = PackingListFG_CallbackScanQRCode;
window.PackingListFG_DeleteEntryOnGrid = PackingListFG_DeleteEntryOnGrid;
window.PackingListFG_OnChangeddlOrderNo = PackingListFG_OnChangeddlOrderNo;
window.PackingListFG_AddManualItem = PackingListFG_AddManualItem;
window.PackingListFG_SaveManualItem = PackingListFG_SaveManualItem;
window.PackingListFG_RemoveManualItem = PackingListFG_RemoveManualItem;

