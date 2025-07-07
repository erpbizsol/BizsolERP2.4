import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
var baseUrl = `${window.location.protocol}//${window.location.host}`;
let QtyMTHeader = '';
let QtyPCHeader = '';
let QtyMTRHeader = '';
let ThreeLevelVerification = '';
let DiscountLimit = '';
let indx_DiscountCol =16;
let AskOtherCharges = '';
let DistributorDealerApplicableInOrder = 'N';
$(document).ready(function () {
    $("#ERPHeading").text("Verify Order/Visit");
    GetNestedMarketingManList();
    GetNestedDealerList();
    GetOrderType();
    GetFixedParameterConfiguration();
    $('#btnShow').on('click', function () {
        GetOrderVerifyData();
    });
    $('#ddlSalesPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlDealerName").focus();
        }
    });
    $('#ddlDealerName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlOrderType").focus();
        }
    });
    $('#ddlOrderType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkShowOnlyOrders").focus();
        }
    });
    $('#chkShowOnlyOrders').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
    $('#ddlSalesPerson').on('focus', function (e) {
        $("#ddlSalesPerson").val('');
    });
    $('#ddlDealerName').on('focus', function (e) {
        $("#ddlDealerName").val('');
    });
    $('#ddlOrderType').on('focus', function (e) {
        $("#ddlOrderType").val('');
    });
});
function GetOrderVerifyData() {
    var SalesPerson = $('#ddlSalesPerson').val();
    var DealerName = $('#ddlDealerName').val();
    var OrderType = $('#ddlOrderType').val();
    var ChkShowOrder = $('#chkShowOnlyOrders').is(":checked");
    let SalePerson = '';
    let Dealer = '';
    let OrdersType = '';
    let ChkWithOrder = false;
    if (SalesPerson === 'All') {
        SalePerson = "";
    } else {
        SalePerson = SalesPerson;
    }
    if (DealerName === 'All') {
        Dealer = "";
    } else {
        Dealer = DealerName;
    }
    if (OrderType === 'Visit') {
        OrdersType = 'V';
    } else {
        OrdersType = 'O';
    }
    if (ChkShowOrder === false) {
        ChkWithOrder = 0;
    } else {
        ChkWithOrder = 1;
    }
    if (SalesPerson === '') {
        toastr.error('Please select sales person !')
        $('#ddlSalesPerson').focus();
    } else if (DealerName === '') {
        toastr.error('Please select Dealer Name !')
        $('#ddlDealerName').focus();
    } else if (OrderType === '') {
        toastr.error('Please select Order Type !')
        $('#ddlOrderType').focus();
    } else {
        GetVerifyOrderList(SalePerson.trim(), Dealer.trim(), OrdersType, ChkWithOrder);
    }
}
function GetNestedMarketingManList() {
    VisitOrderEntryService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {
            $('#ddlSalesPersonList option').remove();

            var option = '<option text="0" value="All" selected >All</option>';

            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].PersonName + '" >' + response[i].PersonName + '</option>';
            }

            $('#ddlSalesPersonList')[0].innerHTML = option;
        } else {
            toastr.error('No Data Found')
            return false;
        }
    });
}
function GetNestedDealerList() {
    VisitOrderEntryService.GetNestedDealerList().then(function (response) {
        if (response.length > 0) {
            $('#ddlDealerNameList option').remove();

            var option = '<option text="0" value="All" selected >All</option>';

            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].AccountDesp + '" >' + response[i].AccountDesp + '</option>';
            }

            $('#ddlDealerNameList')[0].innerHTML = option;
        } else {
           toastr.error('No Data Found')
            return false;
        }
    });
}
function GetOrderType() {
    VisitOrderEntryService.GetOrderTypeList().then(function (response) {
        if (response.length > 0) {
            const select = $('#ddlOrderType');
            response.forEach(item => {
                select.append(`<option value="${item.Field}">${item.Field}</option>`);
            });
        } else {
            toastr.error('No Data Found')
            return false;
        }
    });
}
function GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
    VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder).then(function (response) {
        if (response.length > 0) {
            $("#txtTable").show();
            const StringFilterColumn = ["Order Id", "Sale Person", "Visit Type"];
            const NumericFilterColumn = ["Out Standing", "Over Due Amount", "Total Final Amount", "Discount", "Basic Rate", "Final Rate"];
            const DateFilterColumn = ["Visit Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = ["Zone", "Dealer Name", "City", "State"];
            const hiddenColumns = ["Code", "OrderVisitType", "Avg Rate", "Total Order Amount",];
            if (ThreeLevelVerification === 'N') {
                hiddenColumns.push("VerifiedLv2", "VerifiedLv3");
                response.forEach(item => {
                    if (item.hasOwnProperty('VerifiedLv1')) {
                        item['Verify'] = item['VerifiedLv1'];
                        delete item['VerifiedLv1'];
                    }
                });
            }
            let statusButtonHTML = ""; // Initialize the statusButtonHTML

            if (QtyMTHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty') {
                                reorderedItem[QtyMTHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
                NumericFilterColumn.push(QtyMTHeader)
            } else {
                hiddenColumns.push("Total Order Qty");
            }

            if (QtyPCHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty PC')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty PC') {
                                reorderedItem[QtyPCHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
            } else {
                hiddenColumns.push("Total Order Qty PC");
            }
            if (QtyMTRHeader !== '') {
                response = response.map(item => {
                    if (item.hasOwnProperty('Total Order Qty MR')) {
                        const reorderedItem = {};
                        for (const key in item) {
                            if (key === 'Total Order Qty MR') {
                                reorderedItem[QtyMTRHeader] = item[key];
                            } else {
                                reorderedItem[key] = item[key];
                            }
                        }
                        return reorderedItem;
                    }
                    return item;
                });
            } else {
                hiddenColumns.push("Total Order Qty MR");
            }

            response = response.map(item => {
                if (item.hasOwnProperty('Other Charges')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'Other Charges') {
                            reorderedItem['Discount'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });
            const ColumnAlignment = {
                "Total Order Qty": "right",
                "Total Order Qty PC": "right",
                "Total Order Qty MR": "right",
                "Avg Rate": "right",
                "Total Order Amount": "right",
                "Over Due Amount": "right",
                "Total Final Amount": "right",
                "Discount": "right",
                "Basic Rate": "right",
                "Final Rate": "right",
                "Out Standing":"right"
            };
            if (QtyMTHeader != '') {
                ColumnAlignment[QtyMTHeader] = "right";
            }
            if (QtyPCHeader != '') {
                ColumnAlignment[QtyPCHeader] = "right";
            }
            if (QtyMTRHeader != '') {
                ColumnAlignment[QtyMTRHeader] = "right";
            }
            let VerifiedLv1Button = '';
            let VerifiedLv2Button = '';
            let VerifiedLv3Button = '';
            let EditOtherCharges = '';
            const updatedResponse = response.map(item => {
                var EditOtherCharges = '';
                

                    var basicAmount = item['Basic Rate'];
                    var Amount = item['Discount'];
                    var FinalAmount = 0;
                    var Sign = "+";
                    var PlusSelected = "";
                    var MinusSelected = "";

                    if (Amount < 0) {
                        Sign = "-";
                    }
                    Amount = Math.abs(Amount);

                    if (Sign === "+") {
                        FinalAmount = Number(basicAmount) + Number(Amount);
                        PlusSelected = "selected";
                    } else {
                        FinalAmount = Number(basicAmount) - Number(Amount);
                        MinusSelected = "selected";
                    }


                    var sptext = basicAmount + Sign + Amount + "=" + FinalAmount;

                    //EditOtherCharges = AskOtherCharges == 'N' ? '' : "<span name=\"btnOtherChargesVerify1\" id=\"btnOtherChargesVerify1\" class=\"btn btn-success btn-sm\" onclick=\"OtherChargesVerifyLv1(" + item['Code'] + "," + item['Other Charges'] + ");\" ><i class=\"fa fa-check\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnOtherChargesReject1\" id=\"btnOtherChargesReject1\" class=\"btn btn-danger btn-sm\" onclick=\"OtherChargesRejectLvl1(" + item['Code'] + "," + item['Other Charges'] + ");\"><i class=\"fa fa-times-circle\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnEdit1\" class=\"btn btn-primary btn-sm\" id=\"btnEdit1\"  onclick=\"EditLvl1(" + item['Code'] + ");\"><i class=\"fa fa-paint-brush\" aria-hidden=\"true\"></i></span><br/><span id=\"SpanEdit_" + item['Code'] + "\">" + sptext + "</span><div id=\"DivEdit_" + item['Code'] + "\" style=\"display:none\"><select id=\"selectSign_" + item['Code'] + "\" onchange=\"calFinalAmt(" + item['Code'] + ")\" name=\"selectSign\"> <option value=\"-\" " + MinusSelected + ">-</option> <option value=\"+\" " + PlusSelected + ">+</option> </select><input type=\"text\" class=\"box_border form-control\" id=\"txtOtherCharges_" + item['Code'] + "\" value=\"" + Amount + "\" onfocusout=\"calFinalAmt(" + item['Code'] + ")\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfBasic_" + item['Code'] + "\" value=\"" + item['Basic Rate'] + "\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfIsOtherChargesVerify_" + item['Code'] + "\" value=\"N\" ></div>";
                   // EditOtherCharges = AskOtherCharges == 'N' ? '' : "<span name=\"btnEdit1\" class=\"btn btn-primary btn-sm\" id=\"btnEdit1\"  onclick=\"EditLvl1(" + item['Code'] ,this +");\"><i class=\"fa fa-paint-brush\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnOtherChargesReject1\" id=\"btnOtherChargesReject1\" class=\"btn btn-danger btn-sm\" onclick=\"OtherChargesRejectLvl1(" + item['Code'] + "," + item['Other Charges'] + ");\"><i class=\"fa fa-times-circle\" aria-hidden=\"true\"></i></span>&nbsp;<br/><span id=\"SpanEdit_" + item['Code'] + "\" onMouseOver=\"this.style.fontSize = '12px'\" onMouseOut=\"this.style.fontSize = '10px'\">" + sptext + "</span><div id=\"DivEdit_" + item['Code'] + "\" style=\"display:none\"><select id=\"selectSign_" + item['Code'] + "\" onchange=\"calFinalAmt(" + item['Code'] + ")\" name=\"selectSign\" class=\"sizewidth\"> <option value=\"-\" " + MinusSelected + ">-</option> <option value=\"+\" " + PlusSelected + ">+</option> </select><input type=\"text\" class=\"box_border form-control\" id=\"txtOtherCharges_" + item['Code'] + "\" value=\"" + Amount + "\" onfocusout=\"calFinalAmt(" + item['Code'] + ")\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfBasic_" + item['Code'] + "\" value=\"" + item['Basic Rate'] + "\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfIsOtherChargesVerify_" + item['Code'] + "\" value=\"N\" ></div><span name=\"btnOtherChargesVerify1\" id=\"btnOtherChargesVerify1\" class=\"btn btn-success btn-sm\" onclick=\"OtherChargesVerifyLv1(" + item['Code'] + "," + item['Other Charges'] + ");\" ><i class=\"fa fa-check\" aria-hidden=\"true\"></i></span>";
                EditOtherCharges = AskOtherCharges == 'N' ? '' : `<span name="btnEdit1" class="btn btn-primary icon-height" id="btnEdit1" onclick="EditLvl1(${item['Code']}, this);"><i class="fa fa-paint-brush" aria-hidden="true"></i></span>&nbsp;<span name="btnOtherChargesReject1" id="btnOtherChargesReject1" class="btn btn-danger icon-height" onclick="OtherChargesRejectLvl1(${item['Code']}, ${item['Discount']});"><i class="fa fa-times-circle" aria-hidden="true"></i></span>&nbsp;<br/><span id="SpanEdit_${item['Code']}">${sptext}</span><div id="DivEdit_${item['Code']}" style="display:none"><select id="selectSign_${item['Code']}" onchange="calFinalAmt(${item['Code']})" name="selectSign" class="sizewidth"><option value="-" ${MinusSelected}>-</option><option value="+" ${PlusSelected}>+</option></select><input type="text" class="box_border form-control" id="txtOtherCharges_${item['Code']}" value="${Amount}" onfocusout="calFinalAmt(${item['Code']})"><input type="hidden" class="box_border form-control" id="hfBasic_${item['Code']}" value="${item['Basic Rate']}"><input type="hidden" class="box_border form-control" id="hfIsOtherChargesVerify_${item['Code']}" value="N"></div><span name="btnOtherChargesVerify1" id="btnOtherChargesVerify1" class="btn btn-success icon-height" onclick="OtherChargesVerifyLv1(${item['Code']}, ${item['Discount']});"><i class="fa fa-check" aria-hidden="true"></i></span>`;


                if (item.OrderVisitType == "O") {
                    //if (item[QtyMTHeader] > 0) {
                        if (ThreeLevelVerification == "Y") {
                            if (item.VerifiedLv1 == "Verify") {
                                if (item['Over Due Amount'] > 0) {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                }
                                else {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                }
                            }
                            if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                                if (item['Over Due Amount'] > 0) {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                }
                                else {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                }
                            }
                            if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                                if (item['Over Due Amount'] > 0) {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
                                }
                                else {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
                                }
                            }
                        }
                        else {
                            if (item.Verify == "Verify") {
                                if (item['Over Due Amount'] > 0) {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
                                }
                                else {
                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
                                }
                            }
                        }

                    //}
                }
                else {
                    if (ThreeLevelVerification == "Y") {
                        if (item.VerifiedLv1 == "Verify") {
                            if (item['Over Due Amount'] > 0) {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                            }
                            else {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                            }
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                            if (item['Over Due Amount'] > 0) {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" ></td>";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";

                            }
                            else {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
                            }
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                            if (item['Over Due Amount'] > 0) {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
                            }
                            else {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input type =\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
                            }
                        }
                    }
                    else {
                        if (item.Verify == "Verify") {
                            if (item['Over Due Amount'] > 0) {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
                            }
                            else {
                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
                            }
                        }
                    }
                }
                const buttonsHTML = `<span><a href="#" onclick="ViewOrder('${item['Code']}')">${item['Order Id']}</a></span>`;
                if (ThreeLevelVerification === 'Y') {
                    return {
                        ...item,
                        "Order Id": buttonsHTML,
                        VerifiedLv1: VerifiedLv1Button,
                        VerifiedLv2: VerifiedLv2Button,
                        VerifiedLv3: VerifiedLv3Button
                    };
                } else {
                    return {
                        ...item,
                        "Order Id": buttonsHTML,
                        Verify: VerifiedLv1Button,
                    };
                }
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            updateFooter(response);
        } else {
            toastr.error('No Data Found');
            $("#txtTable").hide();
        }
    }).catch(function (error) {
        toastr.error('Error fetching data');
        $("#txtTable").hide();
    });
}
function GetFixedParameterConfiguration() {
    VisitOrderEntryService.GetFixedParameterConfiguration().then(function (response) {
        if (response.length > 0) {
            QtyMTHeader = response[0].QtyMTHeader;
            QtyPCHeader = response[0].QtyPCHeader;
            QtyMTRHeader = response[0].QtyMTRHeader;
            ThreeLevelVerification = response[0].ThreeLevelVerificationApplicable;
            DiscountLimit = response[0].LimitForVerifyDiscount;
            AskOtherCharges = response[0].AskOtherCharges;
            DistributorDealerApplicableInOrder = response[0].DistributorDealerApplicableInOrder
           }
        else {
            toastr.error('No Data Found')
        }
    });
}
function ViewOrder(Code) {

    VisitOrderEntryService.GetUnVerifiedVisitDetailsReport(Code).then(function (response) {
        if (response.length > 0) {
            $('#ShowOrderDetailModal').modal('show');
            $('#ShowOrderDetailModal').modal({ backdrop: 'static', keyboard: false })
            const StringFilterColumn = ["Item Name", "Size", "Thickness"];
            const NumericFilterColumn = ["Basic Rate", "Extra Charges", "Discount", "Final Rate", "Other Charges", "Order Qty", "Final Amount"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "Basic Rate": "right",
                "Discount": "right",
                "Extra Charges": "right",
                "Other Charges": "right",
                "Final Rate": "right",
                "Order Qty": "right",
                "Final Amount": "right",
            };
            if (DistributorDealerApplicableInOrder == 'N') {
                hiddenColumns.push("Dealer Name");
            }
            BizsolCustomFilterGrid.CreateDataTable("OrderTable-header", "OrderTable-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found')
        }
    });
}
function updateFooter(data) {
    let TotalOrderQty = 0;
    let TotalOrderQtyPC = 0;
    let TotalOrderQtyMR = 0;
    let TotalFinalAmount = 0;
    data.forEach(row => {
        if (QtyMTHeader != '') {
            TotalOrderQty += parseFloat(row[QtyMTHeader]) || 0;
        }
        if (QtyPCHeader != '') {
            TotalOrderQtyPC += parseFloat(row[QtyPCHeader]) || 0;
        }
        if (QtyMTRHeader != '') {
            TotalOrderQtyMR += parseFloat(row[QtyMTRHeader]) || 0;
        }
        TotalFinalAmount += parseFloat(row["Total Final Amount"]) || 0;
    });
    const tfootContent = `
    <tr>
        <td><b>Total</b></td>
        <td colspan="7"></td>
        ${QtyMTHeader !=''? `<td style="text-align:right"><b>${TotalOrderQty.toFixed(2)}</b></td>` : ''}
        ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyPC.toFixed(2)}</b></td>` : ''}
        ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyMR.toFixed(2)}</b></td>` : ''}
        <td colspan="3"></td>
        <td style="text-align:right"><b>${TotalFinalAmount.toFixed(2)}</b></td>
    </tr>
`;

    const tfoot = document.querySelector("#Visit tfoot");
    if (tfoot) {
        tfoot.innerHTML = tfootContent;
    } else {
        const table = document.querySelector("#Visit");
        if (table) {
            const newTfoot = document.createElement("tfoot");
            newTfoot.innerHTML = tfootContent;
            table.appendChild(newTfoot);
        } else {
            toastr.error("Table element with id 'table' not found.")
            return false;
        }
    }
}
function EditLvl1(Code,element) {
    var ObjCurrRow = $(element).closest('tr');
    var Discount = ObjCurrRow[0].cells[indx_DiscountCol].innerHTML;
    var lv = $('#hflv_' + Code).val();
    var Sign = $('#selectSign_' + Code).val();
    if (Sign === "-") {
        var DiscountValToCompare = 0;
        if (parseFloat(Discount) < 0) {
            DiscountValToCompare = parseFloat(Discount) * (-1);
        } else {
            DiscountValToCompare = parseFloat(Discount);
        }
        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                alert("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
        }
    }
    var alertCls = confirm("Are you want to Edit Other Charges ?");
    if (alertCls) {
        $('#DivEdit_' + Code).show();
    }
}
function calFinalAmt(code) {

    var basicAmount = $('#hfBasic_' + code).val();
    var Amount = $('#txtOtherCharges_' + code).val();
    var FinalAmount = 0;
    var Sign = $('#selectSign_' + code).val();

    if (Sign === "+") {
        FinalAmount = Number(basicAmount) + Number(Amount);
    } else {
        FinalAmount = Number(basicAmount) - Number(Amount);
    }
    $('#SpanEdit_' + code)[0].innerHTML = parseFloat(basicAmount).toFixed(2) + Sign + parseFloat(Amount).toFixed(2) + "=" + parseFloat(FinalAmount).toFixed(2);

}
function Reject(code) {
    const alertCls = confirm("Are you sure you want to Reject this Visit?");
    if (alertCls) {
        RejectVisit(code);
    }
}
function RejectVisit(Code) {
    $('#ReasonModal').modal('show');
    $('#ReasonModal').modal({
        backdrop: 'static',
    });
    $("#txtCode").val(Code);
}
function SaveRejectVisit() {
    var reason = $("#txtReason").val();
    var code = $("#txtCode").val();
    if (reason == "") {
        toastr.error('You do not enter any reason for reject.Please enter valid reason.');
        $("#txtReason").focus();
    } else {
        VisitOrderEntryService.RejectVisitOrder(code, reason).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#ReasonModal').modal('hide');
                document.getElementById('txtReason').value = '';
                document.getElementById('txtCode').value = '0';
                GetOrderVerifyData();
            } else {
                toastr.error(response.Msg);
            }
        });
    }
}
function Close() {
    $('#ReasonModal').modal('hide');
}
function Verify(Code,element) {
    var Mode = 'VisitOrder_VerifyLv1';
    var ObjCurrRow = $(element).closest('tr');
    var Discount = ObjCurrRow[0].cells[indx_DiscountCol].innerHTML;
    var DiscountValToCompare = 0;
    var Sign = $('#selectSign_' + Code).val();

    if (Sign === "-") {
        if (parseFloat(Discount) < 0) {
            DiscountValToCompare = parseFloat(Discount) * (-1);
        } else {
            DiscountValToCompare = parseFloat(Discount);
        }
        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                alert("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
        }

    }
    VerifyForAll(Code,Mode)
}
function GPVerifyLv1(Code,e) {
    var Mode = "VisitOrder_VerifyLv2";
    var Discount = $('#txtOtherCharges_' + Code).val();
    var DiscountValToCompare = 0;
    var Sign = $('#selectSign_' + Code).val();

    if (Sign === "-") {
        if (parseFloat(Discount) < 0) {
            DiscountValToCompare = parseFloat(Discount) * (-1);
        } else {
            DiscountValToCompare = parseFloat(Discount);
        }
        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                alert("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
        }
    }
    if (parseFloat(Discount) == 0) {
        $('#hfIsOtherChargesVerify_' + Code).val("Y");
    }
    if (AskOtherCharges == "Y") {
        if ($('#hfIsOtherChargesVerify_' + Code).val() === "N") {
            toastr.error("Please Check! You not verify other Charges..")
            return;
        }
    }
    VerifyForAll(Code, Mode);
}
function AdminVerifyLv2(Code,element) {
    var Mode = "VisitOrder_VerifyLv3";
    var Discount = $('#txtOtherCharges_' + Code).val();
    if (parseFloat(Discount) == 0) {
        $('#hfIsOtherChargesVerify_' + Code).val("Y");
    }
    var Sign = $('#selectSign_' + Code).val();
    if (Sign === "-") {
        var DiscountValToCompare = 0;
        if (parseFloat(Discount) < 0) {
            DiscountValToCompare = parseFloat(Discount) * (-1);
        } else {
            DiscountValToCompare = parseFloat(Discount);
        }
        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                alert("The Discount Limit is : " + DiscountLimit + " Rs. \nThis record has exceeded discount Limit; So it can be verified only by the Management!");
                return;
            }
        }
    }
    if(AskOtherCharges == "Y") {
        if ($('#hfIsOtherChargesVerify_' + Code).val() === "N") {
            toastr.error("Please Check! You not verify other Charges..")
            return;
        }
    }
    VerifyForAll(Code, Mode)
}
function VerifyForAll(Code,Mode) {
    const alertCls = confirm("Are you sure you want to Verify this Visit?");
    if (alertCls) {
        VisitOrderEntryService.VerifyVisitOrder(Code, Mode).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                GetOrderVerifyData();
            } else {
                toastr.error(response.Msg);
            }
        });
    }
}
function OtherChargesVerifyLv1(Code, Amount) {
    var Discount = $('#txtOtherCharges_' + Code).val();
    var OldDiscount = 0;
    var DiscountValToCompare = 0;
    var Sign = $('#selectSign_' + Code).val();

    if (Sign === "-") {

        if (parseFloat(Discount) < 0) {
            DiscountValToCompare = parseFloat(Discount) * (-1);
        } else {
            DiscountValToCompare = parseFloat(Discount);
        }
        if (parseFloat(Amount) < 0) {
            OldDiscount = parseFloat(Amount) * (-1);
        } else {
            OldDiscount = parseFloat(Amount);
        }
        if (parseFloat(Discount) > parseFloat(OldDiscount)) {
            alert("The Discount cannot be exceeded from Previous Discount : " + OldDiscount + " Rs. !");
            return false;
        }
        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                alert("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
        }
    }
    UpdateVisitOrderOtherCharges(Code, Amount)
}
function UpdateVisitOrderOtherCharges(Code,OldAmount) {
    var AmountNew = $('#txtOtherCharges_' + Code).val();
    var level = $('#hflv_' + Code).val();
    if (AmountNew === "") {
        toastr.error("Other Charges Not Found");
        return;
    }
    var Sign = $('#selectSign_' + Code).val();
    if (Sign === "-") {
        AmountNew *= -1;
    }
    const alertCls = confirm("Do you want to verify Other Charges ?");
    if (alertCls) {
        VisitOrderEntryService.UpdateVisitOrderOtherCharges(Code, OldAmount, AmountNew, level).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                $('#hfIsOtherChargesVerify_' + Code).val("Y");
            } else {
                toastr.error(response.Msg);
            }
        });
    }
}
function OtherChargesRejectLvl1(Code, Amount) {
    var level = $('#hflv_' + Code).val();
    var Discount = $('#txtOtherCharges_' + Code).val();
    var Sign = $('#selectSign_' + Code).val();
    if (Sign === "-") {
        if (level == 'LV2') {
            var DiscountValToCompare = 0;
            if (parseFloat(Discount) < 0) {
                DiscountValToCompare = parseFloat(Discount) * (-1);
            } else {
                DiscountValToCompare = parseFloat(Discount);
            }
            if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
                if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                    alert("The Discount Limit is : " + DiscountLimit + " Rs. \nThis record has exceeded discount Limit; So it can be verified only by the Management!");
                    return;
                }
            }
        }
    }
    var alertCls = confirm("Do you want to Reject Other Charges ?");
    if (alertCls) {
        VisitOrderEntryService.UpdateVisitOrderOtherCharges(Code, Amount, '0', level).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success("Other Charges Rejected! you can now verify order!");
                $('#txtOtherCharges_' + Code).val(0);
                $('#hfIsOtherChargesVerify_' + Code).val("Y");
                calFinalAmt(Code);
            } else {
                toastr.error(response.Msg);
            }
        });
     }
}
window.ViewOrder = ViewOrder;
window.EditLvl1 = EditLvl1;
window.calFinalAmt = calFinalAmt;
window.Verify = Verify;
window.Reject = Reject;
window.SaveRejectVisit = SaveRejectVisit;
window.OtherChargesVerifyLv1 = OtherChargesVerifyLv1;
window.OtherChargesRejectLvl1 = OtherChargesRejectLvl1;
window.GPVerifyLv1 = GPVerifyLv1;
window.AdminVerifyLv2 = AdminVerifyLv2;


