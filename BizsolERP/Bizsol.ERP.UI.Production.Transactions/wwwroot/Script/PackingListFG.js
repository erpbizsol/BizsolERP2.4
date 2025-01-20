
import { PackingListFGService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PackingListFGService.js';
$("#ERPHeading").text("Packing List FG");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
$('#txtPackingListDate').val(new Date().toISOString().slice(0, 10));

let PackingListFGFixedParaMeters = [];
let G_EwayBillApplicable = "N";
let GRNoWithVehicleAndTrannsporterMandatoryInPackingList = "N";
let PackingType = "D";
let RMRequisitionApplicableInPackingList = "N";
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
       
       // console.log(response);
        response = response.map((item) => ({
            "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName, "Qty KG": item.QtyMT, "Qty PC": item.QtyPC, "Qty SQM": item.QtyMTRS, Status: item.PKStatus,
            Action: item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="PackingListFG_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>': item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="PackingListFG_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="PackingListFG_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>', 
            QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS
        }))
        //console.log(response);
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty KG": 'right',
            "Qty SQM": 'right',
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbPackingListFGViewHeader", "tbPackingListFGViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            WebLocatePackingSumDispatch(response);
        } else {
            $('#tbPackingListFGView tr').empty()
        }

    });

    ChangeMode('');
}

function WebLocatePackingSumDispatch(response) {
    let DispatchRows = response.filter(item => item["Packing Type"] ==='Dispatch');
    let StockRows = response.filter(item => item["Packing Type"] === 'Stock Transfer');

    let DispatchTotalMT = 0;
    let DispatchTotalPC = 0;
    let DispatchTotalMTRS = 0;
    let StockTotalMT = 0;
    let StockTotalPC = 0;
    let StockTotalMTRS = 0;

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
        <td colspan="5"></td>
        <td >DISPATCH TOTAL:</td>
        <td style="text-align: right;">${ parseFloat(DispatchTotalMT).toFixed(2)}</td >
        <td style="text-align: right;">${DispatchTotalPC}</td>
        <td style="text-align: right;">${parseFloat(DispatchTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trStockTotal">
        <td colspan="5"></td>
        <td >STOCK TRANSFER TOTAL :</td>
        <td style="text-align: right;">${parseFloat(StockTotalMT).toFixed(2)}</td>
        <td style="text-align: right;">${StockTotalPC}</td>
        <td style="text-align: right;">${parseFloat(StockTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trTotal">
        <td colspan="5"></td>
        <td >TOTAL:</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMT + StockTotalMT)).toFixed(2)}</td>
        <td style="text-align: right;">${(DispatchTotalPC + StockTotalPC)}</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMTRS + StockTotalMTRS)).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        `;

   

    $('#tbPackingListFGView tfoot')[0].innerHTML = tfootContent;



}

function PackingListFG_CreateNew() {

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'VerifyApplicableInPackingList').PeramaterValue === 'Y') {
        ChangeMode('New');
    } else {
        toastr.error('Please Check! Verification enable Mandatory for web packing list.');
    }
    
}
function PackingListFG_Back() {
    ChangeMode('');
}
function PackingListFG_EditOrView(isEdit, PackingListMaster_Code) {
    
    if (isEdit === 'Y') {
        PackingListFGService.EditValidatePackingListBatchNo(PackingListMaster_Code).then(function (response) {
            if (response.Status == 'Y') {
                ChangeMode('Edit');
            } else {
                toastr.error(response.Msg);
            }
            
        });
    } else {
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

function PackingListFG_ShowDetailsModals(For) {

    if (For === 'ReqDetails') {
        var ddlReqNo = document.getElementById("ddlReqNo");
        var RMRequisitionMaster_Code = ddlReqNo.options[ddlReqNo.selectedIndex].attributes["code"].value;

        

        if (RMRequisitionMaster_Code == 0) {
            toastr.error('Plz! select Requisition No');
            return 
        }

            PackingListFGService.GetReqDetails(RMRequisitionMaster_Code).then(function (response) {

                
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
}

function PackingListFG_OnChangeddlPackingType() {

    $('#divGodownTo').hide();
    $('#divReqNo').hide();
    $('#divOrderNo').show();

    G_EwayBillApplicable = "N";
    PackingType = "D";
    var ddlPackingType = document.getElementById("ddlPackingType");
    PackingType = ddlPackingType.options[ddlPackingType.selectedIndex].attributes["packingtype"].value;

    if (PackingType === "S") {
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
            $('#ddlClientName').val(DefaultAccountCode);
            $('#ddlConsignee').val(DefaultAccountCode);
            $('#ddlClientName').select2({
                width: '-webkit-fill-available'
            })
            $('#ddlConsignee').select2({
                width: '-webkit-fill-available'
            })
            //$('#ddlClientName').attr("readonly", true);
            //$('#ddlConsignee').attr("readonly", true);

            

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
        
        //$('#ddlClientName').removeAttr("readonly");
        //$('#ddlConsignee').removeAttr("readonly");
        
        

        var ddlPackingType = document.getElementById("ddlPackingType");
        var TextPackingType = ddlPackingType.options[ddlPackingType.selectedIndex].text;
        if (PackingType === 'D' && TextPackingType.toUpperCase().trim() === ('JOBWORK RECEIVE SENT').trim()) {
            //GodownDataList('');
        }
        else {
            //GodownDataList('Dispatch');
        }
    }
    
}
function PackingListFG_OnChangeddlClientNameORddlConsignee(element) {

    let eleId = element.id;
    let ele = element;
    let eleText = ele.options[ele.selectedIndex].text;
    let eleValue = ele.value;
    if (eleId === 'ddlClientName') {
        $('#ddlConsignee').val(eleValue);
        $('#ddlConsignee').select2({
            width: '-webkit-fill-available'
        });
        Bind_ddlOrderNo("GetPendingOrderListByBuyerName", eleText);
    }
    else {
        Bind_ddlOrderNo("GetPendingOrderListByPartyName", eleText);
    }
}
function getPackingListFGFixedParaMeters() {
    PackingListFGService.GetFixedParaMeter().then(function (response) {
        PackingListFGFixedParaMeters = response;
        LoadFrm();
    });
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

function Bind_AllDLL() {
    Bind_ddlPackingType();
    Bind_ddlClientNameORddlConsignee();
    Bind_ddlReqNo();
    Bind_ddlGodown();
    Bind_ddlGodownTo();
    Bind_ddlTransporterName();
}
function Bind_ddlOrderNo(Mode, Name) {
    PackingListFGService.GetPendingOrderList(Mode, Name).then(function (response) {
        
        let option = '<option value="0" partyname="0"></option>';
        $.each(response, function (key, val) {
            
            option += '<option value="' + val.Code + '" partyname="' + val.PartyName + '" >' + val.Desp + '</option>';
        });

        $('#ddlOrderNo')[0].innerHTML = option;
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });

    });
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function LoadFrm() {
    

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'InvoiceByOrder').PeramaterValue === 'Y') {
        $('#lblddlOrderNo')[0].innerHTML = 'Order No:';
        $('#ddlOrderNo').attr('multiple', '');
        $('#ddlOrderNo').select2({
            width: '-webkit-fill-available'
        });

    } else {
        $('#lblddlOrderNo')[0].innerHTML = 'Desp.Adv.No';
    }

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'GRNoWithVehicleAndTrannsporterMandatoryInPackingList').PeramaterValue === 'Y') {
       GRNoWithVehicleAndTrannsporterMandatoryInPackingList = "Y";
    }
    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'RMRequisitionApplicableInPackingList').PeramaterValue === 'Y') {
        RMRequisitionApplicableInPackingList = "Y";
    }
    
    $('#divGodownTo').hide();
    $('#divReqNo').hide();
    $('#txtScanIdentification').attr('readonly', 'readonly');
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

PackingListFG_ShowViewGrid();
getPackingListFGFixedParaMeters();
Bind_AllDLL();
//LoadFrm();



window.PackingListFG_CreateNew = PackingListFG_CreateNew;
window.PackingListFG_Back = PackingListFG_Back;
window.PackingListFG_ShowViewGrid = PackingListFG_ShowViewGrid;
window.PackingListFG_EditOrView = PackingListFG_EditOrView;
window.PackingListFG_Verify = PackingListFG_Verify;
window.PackingListFG_ShowDetailsModals = PackingListFG_ShowDetailsModals;
window.PackingListFG_OnChangeddlPackingType = PackingListFG_OnChangeddlPackingType;
window.PackingListFG_OnChangeddlClientNameORddlConsignee = PackingListFG_OnChangeddlClientNameORddlConsignee;