import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
let QtyMTHeader = '';
let QtyPCHeader = '';
let QtyMTRHeader = '';
let ThreeLevelVerification = '';
let DiscountLimit = '';
let indx_DiscountCol =16;
let AskOtherCharges = '';
let DistributorDealerApplicableInOrder = 'N';
let indx_BasicRate_DetailView = 16;
let indx_BasicRate_DetailOutView = 20;
let indx_DisType_DetailView = 18;
let indx_DisType_DetailOutView = 22;
let g_Code = 0;
let g_Mode = '';
let G_AskPassword = 'Y';
$(document).ready(function () {
    $("#ERPHeading").text("Verify Order/Visit");
    GetNestedMarketingManList();
    GetNestedDealerList();
    
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
   
});
function GetOrderVerifyData() {
    //var SalesPerson = $('#ddlSalesPerson').val();
    //var DealerName = $('#ddlDealerName').val();
    var SalesPerson = $('#ddlSalesPersonlist option:selected').text();
    var DealerName = $('#ddlDealerNameList option:selected').text()

    let SalePerson = '';
    let Dealer = '';
    
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
    
    if (SalesPerson === '') {
        //toastr.error('Please select sales person !')
        //$('#ddlSalesPerson').focus();
    } else if (DealerName === '') {
        //toastr.error('Please select Dealer Name !')
       // $('#ddlDealerName').focus();
    } else {
       
            GetVerifyOrderList(SalePerson.trim(), Dealer.trim());
       
        
    }
}
function GetNestedMarketingManList() {
    VisitOrderEntryService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {
            //$('#ddlSalesPersonList option').remove();

            //var option = '<option text="0" value="All" selected >All</option>';

            //for (var i = 0; i < response.length; i++) {
            //    option += '<option text="' + response[i].Code + '" value="' + response[i].PersonName + '" >' + response[i].PersonName + '</option>';
            //}

            //$('#ddlSalesPersonList')[0].innerHTML = option;

            BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })), 'FirstItemAll');
            $('#ddlSalesPersonlist').select2({
                // allowClear: true,
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
            });
        } else {
            toastr.error('No Data Found')
            return false;
        }
    });
}
function GetNestedDealerList() {
    VisitOrderEntryService.GetNestedDealerList().then(function (response) {
        if (response.length > 0) {
            //$('#ddlDealerNameList option').remove();

            //var option = '<option text="0" value="All" selected >All</option>';

            //for (var i = 0; i < response.length; i++) {
            //    option += '<option text="' + response[i].Code + '" value="' + response[i].AccountDesp + '" >' + response[i].AccountDesp + '</option>';
            //}

            //$('#ddlDealerNameList')[0].innerHTML = option;
            BindSelectList($('#ddlDealerNameList')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })), 'FirstItemAll');
            $('#ddlDealerNameList').select2({
                // allowClear: true,
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
            });
        } else {
           toastr.error('No Data Found')
            return false;
        }
    });
}
//function GetOrderType() {
//    VisitOrderEntryService.GetOrderTypeList().then(function (response) {
//        if (response.length > 0) {
//            const select = $('#ddlOrderType');
//            response.forEach(item => {
//                select.append(`<option value="${item.Field}">${item.Field}</option>`);
//            });
//        } else {
//            toastr.error('No Data Found')
//            return false;
//        }
//    });
//}
//function GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
//    VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder).then(function (response) {
//        if (response.length > 0) {
//            $("#txtTable").show();
//            const StringFilterColumn = ["Order Id", "Sale Person", "Visit Type"];
//            const NumericFilterColumn = ["Out Standing", "Over Due Amount", "Total Final Amount"];
//            const DateFilterColumn = ["Visit Date"];
//            const Button = false;
//            const showButtons = [];
//            const StringdoubleFilterColumn = ["Zone", "Dealer Name", "City", "State"];
//            const hiddenColumns = ["Code", "OrderVisitType", "Avg Rate", "Total Order Amount", "Discount", "Basic Rate", "Final Rate"];
//            if (ThreeLevelVerification === 'N') {
//                hiddenColumns.push("VerifiedLv2", "VerifiedLv3");
//                response.forEach(item => {
//                    if (item.hasOwnProperty('VerifiedLv1')) {
//                        item['Verify'] = item['VerifiedLv1'];
//                        delete item['VerifiedLv1'];
//                    }
//                });
//            }
//            let statusButtonHTML = ""; // Initialize the statusButtonHTML

//            if (QtyMTHeader !== '') {
//                response = response.map(item => {
//                    if (item.hasOwnProperty('Total Order Qty')) {
//                        const reorderedItem = {};
//                        for (const key in item) {
//                            if (key === 'Total Order Qty') {
//                                reorderedItem[QtyMTHeader] = item[key];
//                            } else {
//                                reorderedItem[key] = item[key];
//                            }
//                        }
//                        return reorderedItem;
//                    }
//                    return item;
//                });
//                NumericFilterColumn.push(QtyMTHeader)
//            } else {
//                hiddenColumns.push("Total Order Qty");
//            }

//            if (QtyPCHeader !== '') {
//                response = response.map(item => {
//                    if (item.hasOwnProperty('Total Order Qty PC')) {
//                        const reorderedItem = {};
//                        for (const key in item) {
//                            if (key === 'Total Order Qty PC') {
//                                reorderedItem[QtyPCHeader] = item[key];
//                            } else {
//                                reorderedItem[key] = item[key];
//                            }
//                        }
//                        return reorderedItem;
//                    }
//                    return item;
//                });
//            } else {
//                hiddenColumns.push("Total Order Qty PC");
//            }
//            if (QtyMTRHeader !== '') {
//                response = response.map(item => {
//                    if (item.hasOwnProperty('Total Order Qty MR')) {
//                        const reorderedItem = {};
//                        for (const key in item) {
//                            if (key === 'Total Order Qty MR') {
//                                reorderedItem[QtyMTRHeader] = item[key];
//                            } else {
//                                reorderedItem[key] = item[key];
//                            }
//                        }
//                        return reorderedItem;
//                    }
//                    return item;
//                });
//            } else {
//                hiddenColumns.push("Total Order Qty MR");
//            }

//            response = response.map(item => {
//                if (item.hasOwnProperty('Other Charges')) {
//                    const reorderedItem = {};
//                    for (const key in item) {
//                        if (key === 'Other Charges') {
//                            reorderedItem['Discount'] = item[key];
//                        } else {
//                            reorderedItem[key] = item[key];
//                        }
//                    }
//                    return reorderedItem;
//                }
//                return item;
//            });
//            const ColumnAlignment = {
//                "Total Order Qty": "right",
//                "Total Order Qty PC": "right",
//                "Total Order Qty MR": "right",
//                "Avg Rate": "right",
//                "Total Order Amount": "right",
//                "Over Due Amount": "right",
//                "Total Final Amount": "right",
//                "Discount": "right",
//                "Basic Rate": "right",
//                "Final Rate": "right",
//                "Out Standing":"right"
//            };
//            if (QtyMTHeader != '') {
//                ColumnAlignment[QtyMTHeader] = "right";
//            }
//            if (QtyPCHeader != '') {
//                ColumnAlignment[QtyPCHeader] = "right";
//            }
//            if (QtyMTRHeader != '') {
//                ColumnAlignment[QtyMTRHeader] = "right";
//            }
//            let VerifiedLv1Button = '';
//            let VerifiedLv2Button = '';
//            let VerifiedLv3Button = '';
    //            let EditOtherCharges = '';
    //            const updatedResponse = response.map(item => {
    //                var EditOtherCharges = '';


    //                    var basicAmount = item['Basic Rate'];
    //                    var Amount = item['Discount'];
    //                    var FinalAmount = 0;
    //                    var Sign = "+";
    //                    var PlusSelected = "";
    //                    var MinusSelected = "";

    //                    if (Amount < 0) {
    //                        Sign = "-";
    //                    }
//                    Amount = Math.abs(Amount);

//                    if (Sign === "+") {
//                        FinalAmount = Number(basicAmount) + Number(Amount);
//                        PlusSelected = "selected";
//                    } else {
//                        FinalAmount = Number(basicAmount) - Number(Amount);
//                        MinusSelected = "selected";
//                    }


//                    var sptext = basicAmount + Sign + Amount + "=" + FinalAmount;

//                    //EditOtherCharges = AskOtherCharges == 'N' ? '' : "<span name=\"btnOtherChargesVerify1\" id=\"btnOtherChargesVerify1\" class=\"btn btn-success btn-sm\" onclick=\"OtherChargesVerifyLv1(" + item['Code'] + "," + item['Other Charges'] + ");\" ><i class=\"fa fa-check\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnOtherChargesReject1\" id=\"btnOtherChargesReject1\" class=\"btn btn-danger btn-sm\" onclick=\"OtherChargesRejectLvl1(" + item['Code'] + "," + item['Other Charges'] + ");\"><i class=\"fa fa-times-circle\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnEdit1\" class=\"btn btn-primary btn-sm\" id=\"btnEdit1\"  onclick=\"EditLvl1(" + item['Code'] + ");\"><i class=\"fa fa-paint-brush\" aria-hidden=\"true\"></i></span><br/><span id=\"SpanEdit_" + item['Code'] + "\">" + sptext + "</span><div id=\"DivEdit_" + item['Code'] + "\" style=\"display:none\"><select id=\"selectSign_" + item['Code'] + "\" onchange=\"calFinalAmt(" + item['Code'] + ")\" name=\"selectSign\"> <option value=\"-\" " + MinusSelected + ">-</option> <option value=\"+\" " + PlusSelected + ">+</option> </select><input type=\"text\" class=\"box_border form-control\" id=\"txtOtherCharges_" + item['Code'] + "\" value=\"" + Amount + "\" onfocusout=\"calFinalAmt(" + item['Code'] + ")\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfBasic_" + item['Code'] + "\" value=\"" + item['Basic Rate'] + "\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfIsOtherChargesVerify_" + item['Code'] + "\" value=\"N\" ></div>";
//                   // EditOtherCharges = AskOtherCharges == 'N' ? '' : "<span name=\"btnEdit1\" class=\"btn btn-primary btn-sm\" id=\"btnEdit1\"  onclick=\"EditLvl1(" + item['Code'] ,this +");\"><i class=\"fa fa-paint-brush\" aria-hidden=\"true\"></i></span>&nbsp;<span name=\"btnOtherChargesReject1\" id=\"btnOtherChargesReject1\" class=\"btn btn-danger btn-sm\" onclick=\"OtherChargesRejectLvl1(" + item['Code'] + "," + item['Other Charges'] + ");\"><i class=\"fa fa-times-circle\" aria-hidden=\"true\"></i></span>&nbsp;<br/><span id=\"SpanEdit_" + item['Code'] + "\" onMouseOver=\"this.style.fontSize = '12px'\" onMouseOut=\"this.style.fontSize = '10px'\">" + sptext + "</span><div id=\"DivEdit_" + item['Code'] + "\" style=\"display:none\"><select id=\"selectSign_" + item['Code'] + "\" onchange=\"calFinalAmt(" + item['Code'] + ")\" name=\"selectSign\" class=\"sizewidth\"> <option value=\"-\" " + MinusSelected + ">-</option> <option value=\"+\" " + PlusSelected + ">+</option> </select><input type=\"text\" class=\"box_border form-control\" id=\"txtOtherCharges_" + item['Code'] + "\" value=\"" + Amount + "\" onfocusout=\"calFinalAmt(" + item['Code'] + ")\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfBasic_" + item['Code'] + "\" value=\"" + item['Basic Rate'] + "\" ><input type=\"hidden\" class=\"box_border form-control\" id=\"hfIsOtherChargesVerify_" + item['Code'] + "\" value=\"N\" ></div><span name=\"btnOtherChargesVerify1\" id=\"btnOtherChargesVerify1\" class=\"btn btn-success btn-sm\" onclick=\"OtherChargesVerifyLv1(" + item['Code'] + "," + item['Other Charges'] + ");\" ><i class=\"fa fa-check\" aria-hidden=\"true\"></i></span>";
//                EditOtherCharges = AskOtherCharges == 'N' ? '' : `<span name="btnEdit1" class="btn btn-primary icon-height" id="btnEdit1" onclick="EditLvl1(${item['Code']}, this);"><i class="fa fa-paint-brush" aria-hidden="true"></i></span>&nbsp;<span name="btnOtherChargesReject1" id="btnOtherChargesReject1" class="btn btn-danger icon-height" onclick="OtherChargesRejectLvl1(${item['Code']}, ${item['Discount']});"><i class="fa fa-times-circle" aria-hidden="true"></i></span>&nbsp;<br/><span id="SpanEdit_${item['Code']}">${sptext}</span><div id="DivEdit_${item['Code']}" style="display:none"><select id="selectSign_${item['Code']}" onchange="calFinalAmt(${item['Code']})" name="selectSign" class="sizewidth"><option value="-" ${MinusSelected}>-</option><option value="+" ${PlusSelected}>+</option></select><input type="text" class="box_border form-control" id="txtOtherCharges_${item['Code']}" value="${Amount}" onfocusout="calFinalAmt(${item['Code']})"><input type="hidden" class="box_border form-control" id="hfBasic_${item['Code']}" value="${item['Basic Rate']}"><input type="hidden" class="box_border form-control" id="hfIsOtherChargesVerify_${item['Code']}" value="N"></div><span name="btnOtherChargesVerify1" id="btnOtherChargesVerify1" class="btn btn-success icon-height" onclick="OtherChargesVerifyLv1(${item['Code']}, ${item['Discount']});"><i class="fa fa-check" aria-hidden="true"></i></span>`;


//                if (item.OrderVisitType == "O") {
//                    //if (item[QtyMTHeader] > 0) {
//                        if (ThreeLevelVerification == "Y") {
//                            if (item.VerifiedLv1 == "Verify") {
//                                if (item['Over Due Amount'] > 0) {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                }
//                                else {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                }
//                            }
//                            if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
//                                if (item['Over Due Amount'] > 0) {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                }
//                                else {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                }
//                            }
//                            if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
//                                if (item['Over Due Amount'] > 0) {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
//                                }
//                                else {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                    VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
//                                }
//                            }
//                        }
//                        else {
//                            if (item.Verify == "Verify") {
//                                if (item['Over Due Amount'] > 0) {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
//                                }
//                                else {
//                                    VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
//                                }
//                            }
//                        }

//                    //}
//                }
//                else {
//                    if (ThreeLevelVerification == "Y") {
//                        if (item.VerifiedLv1 == "Verify") {
//                            if (item['Over Due Amount'] > 0) {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                            }
//                            else {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                            }
//                        }
//                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
//                            if (item['Over Due Amount'] > 0) {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" ></td>";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";

//                            }
//                            else {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Pending\" class=\"btn btn-primary  btn-height\" disabled/>";
//                            }
//                        }
//                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
//                            if (item['Over Due Amount'] > 0) {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
//                            }
//                            else {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv2Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verified\" class=\"btn btn-primary  btn-height\" disabled/>";
//                                VerifiedLv3Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify\" class=\"btn btn-primary btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input type =\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
//                            }
//                        }
//                    }
//                    else {
//                        if (item.Verify == "Verify") {
//                            if (item['Over Due Amount'] > 0) {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
//                            }
//                            else {
//                                VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
//                            }
//                        }
//                    }
//                }
//                const buttonsHTML = `<span><a href="#" onclick="ViewOrder('${item['Code']}')">${item['Order Id']}</a></span>`;
//                if (ThreeLevelVerification === 'Y') {
//                    return {
//                        ...item,
//                        "Order Id": buttonsHTML,
//                        VerifiedLv1: VerifiedLv1Button,
//                        VerifiedLv2: VerifiedLv2Button,
//                        VerifiedLv3: VerifiedLv3Button
//                    };
//                } else {
//                    return {
//                        ...item,
//                        "Order Id": buttonsHTML,
//                        Verify: VerifiedLv1Button,
//                    };
//                }
//            });

//            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
//            updateFooter(response);
//        } else {
//            toastr.error('No Data Found');
//            $("#txtTable").hide();
//        }
//    }).catch(function (error) {
//        toastr.error('Error fetching data');
//        $("#txtTable").hide();
//    });
//}


function BindSelectList(element, list, FirstItem) {
    let option = '';

    if (FirstItem == 'FirstItemAll') {
        option = '<option value="All">All</option>';
    } else if (FirstItem == 'FirstItemSelected') {
        option = '';
    } else {
        option = '<option value="0"></option>';
    }

    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function GetVerifyOrderList(SalesPerson, DealerName) {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Mode = $('#listTemplate').val();
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

    if (Mode == "CONSOLIDATED_VIEW") {
        VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, Mode).then(function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Order Id", "Sale Person"];
                const NumericFilterColumn = ["Order Amount"];
                const DateFilterColumn = ["Visit Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Dealer Name", "City"];
                const hiddenColumns = ["Code", "Visit Type", "OrderVisitType", "VerifiedLv1", "VerifiedLv2", "VerifiedLv3", "State", "Verify", "Order Qty", "OverdueOTPentered","DealerMaster_Code"];
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

                const ColumnAlignment = {
                    "Order Amount": "right",
                    "Order Qty": "right",
                };
                
                let VerifiedLv1Button = '';


                const updatedResponse = response.map(item => {
                    var EditOtherCharges = '';

                        //if (ThreeLevelVerification == "Y") {
                        //    if (item.VerifiedLv1 == "Verify") {
                        //        VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify 1\" title=\"Verification Level 1\" class=\"btn btn-primary  btn-height mb-1\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>";
                        //    }
                        //    if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                        //        VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify1\" id=\"btnVerify1\" value=\"Verify 2\" title=\"Verification Level 2\" class=\"btn btn-warning  btn-height mb-1\" onclick=\"GPVerifyLv1(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject1\" id=\"btnReject1\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV1\" >";
                        //    }
                        //    if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                        //        VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify2\" id=\"btnVerify2\" value=\"Verify 3\" title=\"Verification Level 3\" class=\"btn btn-success  btn-height mb-1\" onclick=\"AdminVerifyLv2(" + item.Code + ",this);\" />&nbsp;<input  type=\"button\" name=\"btnReject2\" id=\"btnReject2\" value=\"Reject\" class=\"btn btn-danger  btn-height mb-1\" onclick=\"Reject(" + item.Code + ");\"/>" + EditOtherCharges + "<input type=\"hidden\" class=\"box_border form-control\" id=\"hflv_" + item.Code + "\" value=\"LV2\" >";
                        //    }
                        //}
                        //else {
                        //    if (item.Verify == "Verify") {
                        //        VerifiedLv1Button = "<input type=\"button\" name=\"btnVerify\" id=\"btnVerify\" value=\"Verify\" class=\"btn btn-primary  btn-height\" onclick=\"Verify(" + item.Code + ",this);\"/>&nbsp;<input type=\"button\" name=\"btnReject\" id=\"btnReject\" value=\"Reject\" class=\"btn btn-danger  btn-height\" onclick=\"Reject(" + item.Code + ");\"/>"
                        //    }
                        //}
                    if (ThreeLevelVerification == "Y") {
                        if (item.VerifiedLv1 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL1" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-warning icon-height mb-1" title="Verification Level 2" id="btnVerify1"  onclick="GPVerifyLv1('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL2" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-success icon-height mb-1" title="Verification Level 3" id="btnVerify2"  onclick="AdminVerifyLv2('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                    }
                    else {
                        if (item.Verify == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                    }

                       
                   
                    const buttonsHTML = `<span><a href="#" onclick="ViewOrder('${item['Code']}')">${item['Order Id']}</a></span>`;
                    const td_discount = `<span><a href="#" onclick="ViewOrder('${item['Code']}')">${item['Discount']}</a></span>`;
                    //const td_Action = `<button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>`;
                    const td_hidden = `<input type="text" id="txtCode" name="txtCode" value="${item.Code}" hidden >
                                                 <input type="text" id="txtMode${item.Code}" name="txtMode${item.Code}" value="" hidden >
                                                 <input type="text" id="txtOverdueOTPentered${item.Code}" name="txtOverdueOTPentered" value="${item.OverdueOTPentered}" hidden >
                                                 <input type="text" id="txtTotalAmount${item.Code}" name="txtTotalAmount" value="${item['Order Amount']}" hidden >
                                                 <input type="text" id="txtDealerCode${item.Code}" name="txtDealerCode" value="${item.DealerMaster_Code}" hidden >`;
                        return {
                            ...item,
                            "Order Id": buttonsHTML,
                            "Discount": td_discount,
                            "Action": VerifiedLv1Button,
                            "Code": td_hidden,
                        };
                   
                   
                });

                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                updateFooter(updatedResponse);
            } else {
                toastr.error('No Data Found');
                $("#txtTable").hide();
            }
        }).catch(function (error) {
            toastr.error('Error fetching data');
            $("#txtTable").hide();
        });
    } else if (Mode == "CONSOLIDATED_OUTSTANDING_VIEW") {
        VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, Mode).then(function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Order Id", "Sale Person"];
                const NumericFilterColumn = ["Order Amount",  "Outstanding","Overdue Amount"];
                const DateFilterColumn = ["Visit Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Dealer Name", "City"];
                const hiddenColumns = ["Code", "Visit Type", "OrderVisitType", "VerifiedLv1", "VerifiedLv2", "VerifiedLv3", "State", "Verify", "Order Qty", "OverdueOTPentered", "DealerMaster_Code"];
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

                const ColumnAlignment = {
                    "Order Amount": "right",
                    "Outstanding": "right",
                    "Overdue Amount": "right",
                    "Credit Days": "right",
                    "Order Qty": "right",
                };

                let VerifiedLv1Button = '';


                const updatedResponse = response.map(item => {
                    var EditOtherCharges = '';

                    if (ThreeLevelVerification == "Y") {
                        if (item.VerifiedLv1 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL1" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-warning icon-height mb-1" title="Verification Level 2" id="btnVerify1"  onclick="GPVerifyLv1('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL2" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-success icon-height mb-1" title="Verification Level 3" id="btnVerify2"  onclick="AdminVerifyLv2('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                    }
                    else {
                        if (item.Verify == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.Discount}" hidden >`;
                        }
                    }



                    const buttonsHTML = `<span><a href="#" onclick="ViewOrder('${item['Code']}')">${item['Order Id']}</a></span>`;
                    //const td_Action = `<button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>`;

                    const td_hidden = `<input type="text" id="txtCode" name="txtCode" value="${item.Code}" hidden >
                                                 <input type="text" id="txtMode${item.Code}" name="txtMode${item.Code}" value="" hidden >
                                                 <input type="text" id="txtOverdueOTPentered${item.Code}" name="txtOverdueOTPentered" value="${item.OverdueOTPentered}" hidden >
                                                 <input type="text" id="txtTotalAmount${item.Code}" name="txtTotalAmount" value="${item['Order Amount']}" hidden >
                                                 <input type="text" id="txtDealerCode${item.Code}" name="txtDealerCode" value="${item.DealerMaster_Code}" hidden >`;
                    return {
                        ...item,
                        "Order Id": buttonsHTML,
                        "Action": VerifiedLv1Button,
                        "Code": td_hidden,
                    };
                   
                  
                });

                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                updateFooter(updatedResponse);
            } else {
                toastr.error('No Data Found');
                $("#txtTable").hide();
            }
        }).catch(function (error) {
            toastr.error('Error fetching data');
            $("#txtTable").hide();
        });
    } else if (Mode == "DETAIL_VIEW") {
        VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, Mode).then(function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Order Id", "Sale Person", "Visit Type", "Size", "Thk"];
                const NumericFilterColumn = ["Order Amount"];
                const DateFilterColumn = ["Visit Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Zone", "Dealer Name", "City"];
                const hiddenColumns = ["Code", "Sub Detail.No", "State", "OrderVisitType", "DiscountAvg", "DetailCode", "Pricelist (Zone)", "Avg Rate", "Other Charges", "Final Rate", "VerifiedLv1", "VerifiedLv2", "VerifiedLv3", "Verify", "OverdueOTPentered", "DealerMaster_Code", "hiddenRow"];
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
                        if (item.hasOwnProperty('Qty MT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty MT') {
                                    reorderedItem['Qty '+ QtyMTHeader] = item[key];
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
                    hiddenColumns.push("Qty MT");
                }

                if (QtyPCHeader !== '') {
                    response = response.map(item => {
                        if (item.hasOwnProperty('Qty PC')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty PC') {
                                    reorderedItem['Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                } else {
                    hiddenColumns.push("Qty PC");
                }
                if (QtyMTRHeader !== '') {
                    response = response.map(item => {
                        if (item.hasOwnProperty('Qty MR')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty MR') {
                                    reorderedItem['Qty '+QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                } else {
                    hiddenColumns.push("Qty MR");
                }

         
                const ColumnAlignment = {
                    "Qty MT": "right",
                    "Qty PC": "right",
                    "Qty MR": "right",
                    "Order Amount": "right",
                    "Overdue Amount": "right",
                    "Final Amount": "right",
                    "Discount": "right",
                    "Basic Rate": "right",
                    "Final Rate": "right",
                    "Outstanding": "right",
                    "Credit Days":"right"
                };
                if (QtyMTHeader != '') {
                    ColumnAlignment['Qty ' + QtyMTHeader] = "right";
                }
                if (QtyPCHeader != '') {
                    ColumnAlignment['Qty ' + QtyPCHeader] = "right";
                }
                if (QtyMTRHeader != '') {
                    ColumnAlignment['Qty ' + QtyMTRHeader] = "right";
                }
                let VerifiedLv1Button = '';
                let EditOtherCharges = '';
                AskOtherCharges = 'Y';
                const updatedResponse = response.map(item => {
                    var EditOtherCharges = '';


                    var basicAmount = item['Basic Rate'];
                    var Amount = item['Discount'];
                    var FinalAmount = 0;
                    var Sign = "+";
                    var PlusSelected = "";
                    var MinusSelected = "";

                    if (Amount > 0) {
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
                    //EditOtherCharges = AskOtherCharges == 'N' ? '' : `&nbsp;<button name="btnEdit1" class="btn btn-primary icon-height" id="btnEdit1" onclick="EditLvl1(${item['Code']}, this);"><i class="fa fa-paint-brush" aria-hidden="true"></i></button>&nbsp;<button name="btnOtherChargesReject1" id="btnOtherChargesReject1" class="btn btn-danger icon-height" onclick="OtherChargesRejectLvl1(${item['Code']}, ${item['Discount']});"><i class="fa fa-times" aria-hidden="true"></i></button>&nbsp;<br/><span id="SpanEdit_${item['Code']}">${sptext}</span><div id="DivEdit_${item['Code']}" style="display:none"><input type="text" class="box_border form-control form-control-sm  text-end" id="txtOtherCharges_${item['Code']}" value="${Amount}" onfocusout="calFinalAmt(${item['Code']})"><input type="hidden" class="box_border form-control" id="hfBasic_${item['Code']}" value="${item['Basic Rate']}"><input type="hidden" class="box_border form-control" id="hfIsOtherChargesVerify_${item['Code']}" value="N"></div><button name="btnOtherChargesVerify1" id="btnOtherChargesVerify1" class="btn btn-success icon-height" onclick="OtherChargesVerifyLv1(${item['Code']}, ${item['Discount']});"><i class="fa fa-check" aria-hidden="true"></i></button>`;


                    //const updatedResponse = response.map(item => {


                    if (ThreeLevelVerification == "Y") {
                        if (item.VerifiedLv1 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL1" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-warning icon-height mb-1" title="Verification Level 2" id="btnVerify1"  onclick="GPVerifyLv1('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL2" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-success icon-height mb-1" title="Verification Level 3" id="btnVerify2"  onclick="AdminVerifyLv2('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                    }
                    else {
                        if (item.Verify == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                    }

                    const buttonsHTML = `<span><a href="#" onclick="ViewDiscountModal('${item['Code']}','${item['DetailCode']}','${item['Discount']}',this)">${item['Discount']}</a>
                                        <input type="text" id="txtUnit" name="txtUnit" value="${item['Rate Unit']}" hidden ></span>`;
                    //const td_Action = `<button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>`;
                    
                    const td_hidden = `<input type="text" id="txtCode" name="txtCode" value="${item.Code}" hidden >
                                                 <input type="text" id="txtMode${item.Code}" name="txtMode${item.Code}" value="" hidden >
                                                 <input type="text" id="txtOverdueOTPentered${item.Code}" name="txtOverdueOTPentered" value="${item.OverdueOTPentered}" hidden >
                                                 <input type="text" id="txtTotalAmount${item.Code}" name="txtTotalAmount" value="${item['Order Amount']}" hidden >
                                                 <input type="text" id="txtDealerCode${item.Code}" name="txtDealerCode" value="${item.DealerMaster_Code}" hidden >`;
                    return {
                        "hiddenRow": JSON.stringify(item),
                        ...item,
                        "Discount": buttonsHTML,
                        "Action": VerifiedLv1Button,
                        "Code": td_hidden
                        
                    };
                    
                });

                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                updateFooter(updatedResponse);
            } else {
                toastr.error('No Data Found');
                $("#txtTable").hide();
            }
        }).catch(function (error) {
            toastr.error('Error fetching data');
            $("#txtTable").hide();
        });
    } else if (Mode == "DETAIL_OUTSTANDING_VIEW") {
        VisitOrderEntryService.GetVerifyOrderList(SalesPerson, DealerName, Mode).then(function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Order Id", "Sale Person", "Visit Type", "Size", "Thk"];
                const NumericFilterColumn = ["Order Amount","Outstanding", "Overdue Amount"];
                const DateFilterColumn = ["Visit Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Zone", "Dealer Name", "City"];
                const hiddenColumns = ["Code", "Sub Detail.No", "State", "OrderVisitType", "DiscountAvg", "DetailCode", "Pricelist (Zone)", "Avg Rate", "Other Charges", "Final Rate", "VerifiedLv1", "VerifiedLv2", "VerifiedLv3", "Verify", "OverdueOTPentered", "DealerMaster_Code", "hiddenRow"];
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
                        if (item.hasOwnProperty('Qty MT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty MT') {
                                    reorderedItem['Qty ' + QtyMTHeader] = item[key];
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
                    hiddenColumns.push("Qty MT");
                }

                if (QtyPCHeader !== '') {
                    response = response.map(item => {
                        if (item.hasOwnProperty('Qty PC')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty PC') {
                                    reorderedItem['Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                } else {
                    hiddenColumns.push("Qty PC");
                }
                if (QtyMTRHeader !== '') {
                    response = response.map(item => {
                        if (item.hasOwnProperty('Qty MR')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'Qty MR') {
                                    reorderedItem['Qty ' + QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                } else {
                    hiddenColumns.push("Qty MR");
                }


                const ColumnAlignment = {
                    "Qty MT": "right",
                    "Qty PC": "right",
                    "Qty MR": "right",
                    "Order Amount": "right",
                    "Overdue Amount": "right",
                    "Final Amount": "right",
                    "Discount": "right",
                    "Basic Rate": "right",
                    "Final Rate": "right",
                    "Outstanding": "right",
                    "Credit Days": "right"
                };
                if (QtyMTHeader != '') {
                    ColumnAlignment['Qty ' + QtyMTHeader] = "right";
                }
                if (QtyPCHeader != '') {
                    ColumnAlignment['Qty ' + QtyPCHeader] = "right";
                }
                if (QtyMTRHeader != '') {
                    ColumnAlignment['Qty ' + QtyMTRHeader] = "right";
                }
                let VerifiedLv1Button = '';
                let EditOtherCharges = '';
                AskOtherCharges = 'Y';
                const updatedResponse = response.map(item => {
                    var EditOtherCharges = '';


                    var basicAmount = item['Basic Rate'];
                    var Amount = item['Discount'];
                    var FinalAmount = 0;
                    var Sign = "+";
                    var PlusSelected = "";
                    var MinusSelected = "";

                    if (Amount > 0) {
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
                    //EditOtherCharges = AskOtherCharges == 'N' ? '' : `&nbsp;<button name="btnEdit1" class="btn btn-primary icon-height" id="btnEdit1" onclick="EditLvl1(${item['Code']}, this);"><i class="fa fa-paint-brush" aria-hidden="true"></i></button>&nbsp;<button name="btnOtherChargesReject1" id="btnOtherChargesReject1" class="btn btn-danger icon-height" onclick="OtherChargesRejectLvl1(${item['Code']}, ${item['Discount']});"><i class="fa fa-times" aria-hidden="true"></i></button>&nbsp;<br/><span id="SpanEdit_${item['Code']}">${sptext}</span><div id="DivEdit_${item['Code']}" style="display:none"><input type="text" class="box_border form-control form-control-sm  text-end" id="txtOtherCharges_${item['Code']}" value="${Amount}" onfocusout="calFinalAmt(${item['Code']})"><input type="hidden" class="box_border form-control" id="hfBasic_${item['Code']}" value="${item['Basic Rate']}"><input type="hidden" class="box_border form-control" id="hfIsOtherChargesVerify_${item['Code']}" value="N"></div><button name="btnOtherChargesVerify1" id="btnOtherChargesVerify1" class="btn btn-success icon-height" onclick="OtherChargesVerifyLv1(${item['Code']}, ${item['Discount']});"><i class="fa fa-check" aria-hidden="true"></i></button>`;


                    //const updatedResponse = response.map(item => {


                    if (ThreeLevelVerification == "Y") {
                        if (item.VerifiedLv1 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                  <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL1" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-warning icon-height mb-1" title="Verification Level 2" id="btnVerify1"  onclick="GPVerifyLv1('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                  <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL2" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >`;
                        }
                        if (item.VerifiedLv1 != "Verify" && item.VerifiedLv2 != "Verify" && item.VerifiedLv3 == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-success icon-height mb-1" title="Verification Level 3" id="btnVerify2"  onclick="AdminVerifyLv2('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                  <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >
                                                 `;
                        }
                    }
                    else {
                        if (item.Verify == "Verify") {
                            VerifiedLv1Button = `<button class="btn btn-primary icon-height mb-1" title="Verification Level 1" id="btnVerify"  onclick="Verify('${item.Code}',this)"><i class="fa fa-check" aria-hidden="true"></i></button>
                                                 <button class="btn btn-danger icon-height mb-1" title="Reject" id="btnReject" onclick="Reject('${item.Code}')"><i class="fa fa-times"></i></button>
                                                  <button class="btn btn-danger icon-height mb-1" title="Delete Line" id="btnDelete" onclick="VerifyOrder_DeleteLine('${item.Code}','${item.DetailCode}',this)"><i class="fa fa-trash"></i></button>
                                                 <button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>
                                                 <input type="text" id="txtLevel" name="txtLevel" value="LVL3" hidden >
                                                 <input type="text" id="txtDiscountVal" name="txtDiscountVal" value="${item.DiscountAvg}" hidden >
                                                 `;
                        }
                    }

                    const buttonsHTML = `<span><a href="#" onclick="ViewDiscountModal('${item['Code']}','${item['DetailCode']}','${item['Discount']}',this)">${item['Discount']}</a>
                                        <input type="text" id="txtUnit" name="txtUnit" value="${item['Rate Unit']}" hidden ></span>`;
                    //const td_Action = `<button class="btn btn-info icon-height mb-1" title="View Verification Details" onclick="ViewVerificationDetails('${item['Code']}')"><i class="fa fa-eye"></i></button>`;

                    const td_hidden = `<input type="text" id="txtCode" name="txtCode" value="${item.Code}" hidden >
                                                 <input type="text" id="txtMode${item.Code}" name="txtMode${item.Code}" value="" hidden >
                                                 <input type="text" id="txtOverdueOTPentered${item.Code}" name="txtOverdueOTPentered" value="${item.OverdueOTPentered}" hidden >
                                                  <input type="text" id="txtTotalAmount${item.Code}" name="txtTotalAmount" value="${item['Order Amount']}" hidden >
                                                 <input type="text" id="txtDealerCode${item.Code}" name="txtDealerCode" value="${item.DealerMaster_Code}" hidden >`;
                    return {
                        "hiddenRow": JSON.stringify(item),
                        ...item,
                        "Discount": buttonsHTML,
                        "Action": VerifiedLv1Button,
                        "Code": td_hidden,
                    };

                });

                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                updateFooter(updatedResponse);
            } else {
                toastr.error('No Data Found');
                $("#txtTable").hide();
            }
        }).catch(function (error) {
            toastr.error('Error fetching data');
            $("#txtTable").hide();
        });
    }
   
}


function GetFixedParameterConfiguration() {
    //VisitOrderEntryService.GetFixedParameterConfiguration().then(function (response) {
    //    if (response.length > 0) {
    //        QtyMTHeader = response[0].QtyMTHeader;
    //        QtyPCHeader = response[0].QtyPCHeader;
    //        QtyMTRHeader = response[0].QtyMTRHeader;
    //        ThreeLevelVerification = response[0].ThreeLevelVerificationApplicable;
    //        DiscountLimit = response[0].LimitForVerifyDiscount;
    //        AskOtherCharges = response[0].AskOtherCharges;
    //        DistributorDealerApplicableInOrder = response[0].DistributorDealerApplicableInOrder
    //       }
    //    else {
    //        toastr.error('No Data Found')
    //    }
    //});

    VisitOrderEntryService.GetCRMOrderEntryConfig().then(function (response) {

        if (response.length > 0) {
            ThreeLevelVerification = response[0].ThreeLevelVerificationApplicable;
            DiscountLimit = response[0].LimitForVerifyDiscount;
            AskOtherCharges = response[0].AskDiscountOnOrder;
            DistributorDealerApplicableInOrder = response[0].ShowDealerColumn;
            sessionStorage.setItem('CRMOrderEntryConfig', JSON.stringify(response[0]));
            VisitOrderEntryService.GetFixedParameterQtyConfig().then(function (response) {
                if (response.length > 0) {
                    QtyMTHeader = (response[0].QtyMT) !==''? ('Qty ' + response[0].QtyMT):'';
                    QtyPCHeader = response[0].QtyPC !=''? 'Qty ' + response[0].QtyPC : '';
                    QtyMTRHeader = response[0].QtyMR != '' ? 'Qty ' + response[0].QtyMR : '';
                    sessionStorage.setItem('QtyConfig', JSON.stringify(response[0]));
                }
            });
            VisitOrderEntryService.GetFixedParameter().then(function (response) {

                if (response.length > 0) {

                    sessionStorage.setItem('FixedParameterCreditLimit', JSON.stringify(response[0]));

                }
            });
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

function ViewVerificationDetails(Code) {

    var tbody = $('#VerificationDetails tbody');
    tbody.empty();
    VisitOrderEntryService.GetVisitVerificationDetailsReport(Code).then(function (response) {
        $('#ShowVerificationModal').modal('show');
        $('#ShowVerificationModal').modal({ backdrop: 'static', keyboard: false })

        var headers = Object.keys(response[0]);
        var values = Object.values(response[0]);
        $.each(headers, function (index, field) {
            var row = $('<tr></tr>');  // Create a new row for each field
            row.append('<td><b>' + field + '</b></td>');  // Add the field name as the first column

            row.append('<td>' + values[index] + '</td>');

            if (field.includes("Over Due Remark") == true && values[index]===""){ }
            else {
                tbody.append(row);
            }
       
        });

    });
}
function ViewDiscountModal(VisitMaster_Code, VisitOrderDetails_Code,OldDiscount, x) {

    var ObjCurrRow = $(x).closest('tr');
    var LVL = ObjCurrRow.find('input[name="txtLevel"]').val();
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;
    var DiscountUnit = ObjCurrRow.find('input[name="txtUnit"]').val();
    var BasicRate = ObjCurrRow[0].cells[indx_BasicRate_DetailView].innerText;
    var DisType = ObjCurrRow[0].cells[indx_DisType_DetailView].innerText;

    var tbody = $('#DiscountDetails tbody');
    tbody.empty();
    VisitOrderEntryService.GetVisitDiscountDetailsReport(VisitOrderDetails_Code).then(function (response) {
        $('#ShowDiscountModal').modal('show');
        $('#ShowDiscountModal').modal({ backdrop: 'static', keyboard: false })

        $('#txtVisitMasterCode').val(VisitMaster_Code);
        $('#txtVisitOrderDetailsCode').val(VisitOrderDetails_Code);
        $('#txtDiscountLevel').val(LVL);
        $('#txtOldDiscount').val(OldDiscount);
        $('#txtDiscountUnit').val(DiscountUnit);
        $('#txtModalBasicRate').val(BasicRate);
        $('#ddlDiscountType').val(DisType);

        if (LVL == "LVL1") {
            $('#txtDiscount').prop('disabled', true);
            $('#btnUpdate').prop('disabled', true);
        } else {
            $('#txtDiscount').prop('disabled', false);
            $('#btnUpdate').prop('disabled', false);
        }
        if (response.length > 0) {
            

            $("#DiscountDetails").show();
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
               
            };

            BizsolCustomFilterGrid.CreateDataTable("DiscountTable-header", "DiscountTable-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false)
        }


    });
}
function updateFooter(data) {
    var Mode = $('#listTemplate').val();
    let TotalOrderQty = 0;
    let TotalOrderQtyPC = 0;
    let TotalOrderQtyMR = 0;
    let TotalFinalAmount = 0;
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
     var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;
    var tfootContent = '';

    if (Mode == 'DETAIL_VIEW') {
        data.forEach(row => {
            if (QtyMTHeader != '') {
                TotalOrderQty += parseFloat(row['Qty '+QtyMTHeader]) || 0;
            }
            if (QtyPCHeader != '') {
                TotalOrderQtyPC += parseFloat(row['Qty ' + QtyPCHeader]) || 0;
            }
            if (QtyMTRHeader != '') {
                TotalOrderQtyMR += parseFloat(row['Qty ' + QtyMTRHeader]) || 0;
            }
            TotalFinalAmount += parseFloat(row["Final Amount"]) || 0;
        });
         tfootContent = `
    <tr>
        <td><b>Total</b></td>
        <td colspan="13"></td>
        
        ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyPC.toFixed(2)}</b></td>` : ''}
        ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyMR.toFixed(2)}</b></td>` : ''}
        ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQty.toFixed(2)}</b></td>` : ''}
        
        <td style="text-align:right"><b>${TotalFinalAmount.toFixed(2)}</b></td>
         <td colspan="5"></td>
    </tr>
`;

    } else if (Mode == 'CONSOLIDATED_VIEW') {
        data.forEach(row => {
            TotalOrderQty += parseFloat(row["Order Qty"]) || 0;
            TotalFinalAmount += parseFloat(row["Order Amount"]) || 0;
        });
        tfootContent = `
    <tr>
        <td><b>Total</b></td>
        <td colspan="5"></td>
        <td style="text-align:right"></td>
        <td style="text-align:right"><b>${TotalFinalAmount.toFixed(2)}</b></td>
         <td colspan="2"></td>
    </tr>
`;
    } else if (Mode == 'CONSOLIDATED_OUTSTANDING_VIEW') {
        data.forEach(row => {
            TotalOrderQty += parseFloat(row["Order Qty"]) || 0;
            TotalFinalAmount += parseFloat(row["Order Amount"]) || 0;
        });
        tfootContent = `
    <tr>
        <td><b>Total</b></td>
        <td colspan="9"></td>
        <td style="text-align:right"></td>
        <td style="text-align:right"><b>${TotalFinalAmount.toFixed(2)}</b></td>
         <td colspan="2"></td>
    </tr>
`;

    } else if (Mode == 'DETAIL_OUTSTANDING_VIEW') {
                data.forEach(row => {
                    if (QtyMTHeader != '') {
                        TotalOrderQty += parseFloat(row['Qty ' + QtyMTHeader]) || 0;
                    }
                    if (QtyPCHeader != '') {
                        TotalOrderQtyPC += parseFloat(row['Qty ' + QtyPCHeader]) || 0;
                    }
                    if (QtyMTRHeader != '') {
                        TotalOrderQtyMR += parseFloat(row['Qty ' + QtyMTRHeader]) || 0;
                    }
                    TotalFinalAmount += parseFloat(row["Final Amount"]) || 0;
                });
                tfootContent = `
            <tr>
                <td><b>Total</b></td>
                <td colspan="17"></td>
        
                ${QtyPCHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyPC.toFixed(2)}</b></td>` : ''}
                ${QtyMTRHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQtyMR.toFixed(2)}</b></td>` : ''}
                ${QtyMTHeader != '' ? `<td style="text-align:right"><b>${TotalOrderQty.toFixed(2)}</b></td>` : ''}
        
                <td style="text-align:right"><b>${TotalFinalAmount.toFixed(2)}</b></td>
                 <td colspan="5"></td>
            </tr>
        `;
    }

   

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
    /*var Sign = $('#selectSign_' + code).val();*/
    var Sign = '-';
    if (Sign === "+") {
        FinalAmount = Number(basicAmount) + Number(Amount);
    } else {
        FinalAmount = Number(basicAmount) - Number(Amount);
    }
    $('#SpanEdit_' + code)[0].innerHTML = parseFloat(basicAmount).toFixed(2) + Sign + parseFloat(Amount).toFixed(2) + "=" + parseFloat(FinalAmount).toFixed(2);

}
function Reject(code) {
    var ModuleName = "Verify Order/Visit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    var OptionName = 'Reject';
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const alertCls = confirm("Are you sure you want to Reject this Visit?");
            if (alertCls) {
                RejectVisit(code);
            }
        }
    });
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
function Verify(Code, element) {

    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DiscountLimit = CRM_Config.LimitForVerifyDiscount;

    var ThreeLevelVerificationApplicable = CRM_Config.ThreeLevelVerificationApplicable;
    if (ThreeLevelVerificationApplicable == 'Y') {
        var OptionName = "VerifyL1"
        G_AskPassword = 'N';
    } else {
        var OptionName = "Verify"
    }

    var ModuleName = "Verify Order/Visit",       
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            var Mode = 'VisitOrder_VerifyLv1';
            var ObjCurrRow = $(element).closest('tr');
            var Code = ObjCurrRow.find('input[name="txtCode"]').val();
            ObjCurrRow.find('input[name="txtMode' + Code + '"]').val(Mode);
            g_Code = Code;
            g_Mode = Mode;
            
            //var Discount = ObjCurrRow[0].cells[indx_DiscountCol].innerHTML;
            var Discount = ObjCurrRow.find('input[name="txtDiscountVal"]').val();
            var DiscountValToCompare = 0;
            //var Sign = $('#selectSign_' + Code).val();
            var Sign = '-';
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
            //VerifyForAll(Code, Mode)
            ValidateOverdueAmount(ObjCurrRow);
        }
    });
}
function GPVerifyLv1(Code, e) {
    var ModuleName = "Verify Order/Visit",
        OptionName = "VerifyL2",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DiscountLimit = CRM_Config.LimitForVerifyDiscount;
        G_AskPassword = 'N';
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {

            var Mode = "VisitOrder_VerifyLv2";
            //var Discount = $('#txtOtherCharges_' + Code).val();
            var ObjCurrRow = $(e).closest('tr');
            var Discount = ObjCurrRow.find('input[name="txtDiscountVal"]').val();
            var DiscountValToCompare = 0;
            var Code = ObjCurrRow.find('input[name="txtCode"]').val();
            g_Code = Code;
            g_Mode = Mode;
            ObjCurrRow.find('input[name="txtMode' + Code + '"]').val(Mode);
            //var Sign = $('#selectSign_' + Code).val();
            var Sign = '-';
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
            //VerifyForAll(Code, Mode)
            ValidateOverdueAmount(ObjCurrRow);
        }
    });
}
function AdminVerifyLv2(Code, element) {
    var ModuleName = "Verify Order/Visit",
        OptionName = "VerifyL3",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DiscountLimit = CRM_Config.LimitForVerifyDiscount;
    G_AskPassword = 'Y';
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {


            var Mode = "VisitOrder_VerifyLv3";
            //var Discount = $('#txtOtherCharges_' + Code).val();
            var ObjCurrRow = $(element).closest('tr');
            var Discount = ObjCurrRow.find('input[name="txtDiscountVal"]').val();
            var Code = ObjCurrRow.find('input[name="txtCode"]').val();
            ObjCurrRow.find('input[name="txtMode' + Code + '"]').val(Mode);
            g_Code = Code;
            g_Mode = Mode;
            if (parseFloat(Discount) == 0) {
                $('#hfIsOtherChargesVerify_' + Code).val("Y");
            }
            //var Sign = $('#selectSign_' + Code).val();
            var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

            var DiscountValToCompare =  0;
            var Sign = '-';
            if (Sign === "-") {
                //var DiscountValToCompare = 0;
                if (parseFloat(Discount) < 0) {
                    DiscountValToCompare = parseFloat(Discount) * (-1);
                } else {
                    DiscountValToCompare = parseFloat(Discount);
                }
                if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
                    if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                        //alert("The Discount Limit is : " + DiscountLimit + " Rs. \nThis record has exceeded discount Limit; So it can be verified only by the Management!");
                        //return;
                        alert("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");
                    }
                }
            }
            if (AskOtherCharges == "Y") {
                if ($('#hfIsOtherChargesVerify_' + Code).val() === "N") {
                    toastr.error("Please Check! You not verify other Charges..")
                    return;
                }
            }
            //VerifyForAll(Code, Mode)
            ValidateOverdueAmount(ObjCurrRow);
        }
    });
}
function VerifyForAll() {
    //const alertCls = confirm("Are you sure you want to Verify this Visit?");
    //if (alertCls) {

    
    var Code = g_Code;
    var Mode = g_Mode;
    var VisitMaster_OverdueOTPentered = $("#txtOverdueOTPentered" + Code).val();
    var FixedParameterCreditLimit_Config = JSON.parse(sessionStorage.getItem('FixedParameterCreditLimit'));
    var OverduePasswordRemark = '0';
    if ((FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == 'Y' || FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == 'R') && VisitMaster_OverdueOTPentered=='N') {
        var OverduePasswordCode = CheckCreditLimitsControl_PasswordCode !== undefined && CheckCreditLimitsControl_PasswordCode !== '' ? CheckCreditLimitsControl_PasswordCode : 0;
        OverduePasswordRemark = CheckCreditLimitsControl_Remark !== undefined && CheckCreditLimitsControl_Remark !== '' ? CheckCreditLimitsControl_Remark : '0';
    } else {
        var OverduePasswordCode = 0;
    }

    VisitOrderEntryService.VerifyVisitOrder(Code, Mode, OverduePasswordCode, OverduePasswordRemark).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                GetOrderVerifyData();
            } else {
                toastr.error(response.Msg);
            }
        });
   // }
}
function OtherChargesVerifyLv1(Code, Amount) {
    var Discount = $('#txtOtherCharges_' + Code).val();
    var OldDiscount = 0;
    var DiscountValToCompare = 0;
    //var Sign = $('#selectSign_' + Code).val();
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

    DiscountValToCompare = CRM_Config.LimitForVerifyDiscount > 0 ? CRM_Config.LimitForVerifyDiscount : 0;
    var Sign = '-';

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
    //var Sign = $('#selectSign_' + Code).val();
    var Sign = '-';
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
    //var Sign = $('#selectSign_' + Code).val();
    var Sign = '-';
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

    var DiscountValToCompare = CRM_Config.LimitForVerifyDiscount > 0 ? CRM_Config.LimitForVerifyDiscount : 0;

    if (Sign === "-") {
        if (level == 'LV2') {
            //var DiscountValToCompare = 0;
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
function GroupRows() {
    var rows = $('#myTable tbody tr').get();
    var groupedRows = {};
}

function UpdateDiscountValue() {
    var VisitMaster_Code=$('#txtVisitMasterCode').val();
    var VisitOrderDetails_Code = $('#txtVisitOrderDetailsCode').val();
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DiscountLimit = CRM_Config.LimitForVerifyDiscount > 0 ? CRM_Config.LimitForVerifyDiscount : 0;
    var DiscountType = $('#ddlDiscountType').val();
    var DiscountToBeCompared = 0;
    var BasicRate = $('#txtModalBasicRate').val();

    var OldDiscount = $('#txtOldDiscount').val();
    var NewDiscount = $('#txtDiscount').val();
    var DisLevel = $('#txtDiscountLevel').val();
    var DisUnit = $('#txtDiscountUnit').val();

    if (DiscountType == 'Per Unit') {
        DiscountToBeCompared = parseFloat(NewDiscount);
    } else {
        DiscountToBeCompared = parseFloat(BasicRate) * (parseFloat(NewDiscount) / 100);
    }

    if (parseFloat(NewDiscount) > parseFloat(OldDiscount)) {
        toastr.error("The Discount cannot be exceeded from Previous Discount : " + OldDiscount + " Rs. !");
        return false;
    }
    
    if (parseFloat(DiscountLimit) != 0 && parseFloat(NewDiscount) != 0) {
            if (parseFloat(NewDiscount) > parseFloat(DiscountLimit)) {
                toastr.error("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
    }
    
  
    var ModuleName = "Verify Order/Visit",
        OptionName = "",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    var ApplicableToAll = $('#chkApplicableForWholeOrder')[0].checked;
    var Mode = '';
    if (DisLevel == 'LVL2' && ApplicableToAll == false) {
        Mode = "UPDATE_DISCOUNT_LV2";
        OptionName = "VerifyL2";
    } else if (DisLevel == 'LVL3' && ApplicableToAll == false) {
        Mode = "UPDATE_DISCOUNT_LV3";
        OptionName = "VerifyL3";
    } else if (DisLevel == 'LVL2' && ApplicableToAll == true) {
        Mode = "UPDATE_DISCOUNT_LV2_ALL";
        OptionName = "VerifyL2";
    } else if (DisLevel == 'LVL3' && ApplicableToAll == true) {
        Mode = "UPDATE_DISCOUNT_LV3_ALL";
        OptionName = "VerifyL3";
    }

  

    var visitOrderDetailsData = [];

    if (NewDiscount > 0) {
        var rowdata = {};


        rowdata["Code"] = VisitOrderDetails_Code;
        rowdata["VisitMaster_Code"] = VisitMaster_Code;
        rowdata["Size"] = '';
        rowdata["Thickness"] = '';
        rowdata["LengthDesp"] = '';
        rowdata["OrderQty"] = 0;
        rowdata["Rate"] = 0;
        rowdata["Discount"] = NewDiscount == undefined || NewDiscount == "" ? 0 : NewDiscount;
        rowdata["Amount"] = 0;
        rowdata["Remarks"] = '';
        rowdata["BasicRate"] = 0;
        rowdata["ExtraCharges"] = 0;
        rowdata["ItemDesp"] = '';
        rowdata["LogicalStock"] = 0;
        rowdata["IsNewRow"] = '';
        rowdata["ItemParameterValueMasterSizeCode"] = 0;
        rowdata["ItemParameterValueMasterTHKCode"] = 0;
        rowdata["ItemParameterValueMasterLength"] = 0;
        rowdata["DeliveryLocation"] =0;
        rowdata["GSTInOrder"] = '';
        rowdata["QtyPC"] = 0;
        rowdata["RateUnit"] = DisUnit == undefined || DisUnit == "" ? "" : DisUnit;
        rowdata["OtherCharges"] = 0;
        rowdata["OtherChargesLV1Old"] = OldDiscount == undefined || OldDiscount == "" ? 0 : OldDiscount;
        rowdata["OtherChargesLV1New"] = NewDiscount == undefined || NewDiscount == "" ? 0 : NewDiscount;
        rowdata["OtherChargesLV2Old"] = OldDiscount == undefined || OldDiscount == "" ? 0 : OldDiscount;
        rowdata["OtherChargesLV2New"] = NewDiscount == undefined || NewDiscount == "" ? 0 : NewDiscount;
        rowdata["QtyMR"] = 0;
        rowdata["SizeDesp"] = '';
        rowdata["ItemSizeMasterCode"] = 0;
        rowdata["DeliveryDate"] = new Date().toISOString().split("T")[0]
        rowdata["ZoneMasterCode"] = 0;
        rowdata["ZoneName"] = '';
        rowdata["DealerMaster_Code"] = 0;
        rowdata["Tolerance"] = 0;
        rowdata["DiscountType"] = DiscountType == undefined || DiscountType == "" ? 0 : DiscountType;
        rowdata["AccountMaster_Code_Consignee"] = 0;
        rowdata["Discount_AfterRate"] = 0;
        rowdata["DiscountType_AfterRate"] = 0;
        rowdata["DiscountLV1UpdatedBy"] = 0;
        rowdata["DiscountLV2UpdatedBy"] = 0;
        rowdata["DiscountLV1UpdatedOn"] = new Date().toISOString().split("T")[0]
        rowdata["DiscountLV2UpdatedOn"] = new Date().toISOString().split("T")[0]



        visitOrderDetailsData.push(rowdata);

       

        VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

            if (response.CheckModuleOptionRight == 'N') {
                toastr.error(response.Msg);
                return false;
            } else {


                VisitOrderEntryService.UpdateVisitOrderDetails_Discount(visitOrderDetailsData, VisitMaster_Code, Mode).then(function (response) {

                    if (response != '') {
                        if (response.Status == 'N') {
                            toastr.error(response.Msg);
                        } else {

                            toastr.success(response.Msg);
                            setTimeout(function () {
                                $('#txtModalBasicRate').val(0);

                                $('#txtOldDiscount').val(0);
                                $('#txtDiscount').val(0);
                                $('#txtDiscountLevel').val('');
                                $('#txtDiscountUnit').val('');
                                $('#ShowDiscountModal').modal('hide');
                                GetOrderVerifyData();
                            }, 2000); // 2 seconds delay before redirect
                        }

                    }

                });
            }
        });
    }
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth(); // 0 is January, 11 is December

    var startYear = currentDate.getFullYear();

    // If the current month is before April (i.e., January, February, March), 
    // the financial year will belong to the previous year.
    if (currentMonth < 3) {
        startYear = startYear - 1; // Subtract one year for FY before April
    }

    // The fiscal year starts from April, so we return the year range.
    return startYear + "-" + (startYear + 1);
}

function InitCheckCreditLimitsControl(AccountMaster_Code, Amount, PreviousAmount, Source, PasswordsCodeRs, PasswordsCodeDays, ShowFormDialog, LedgerClosing, OverDueAmount
    , ShowOnlyOutstandingInfo, Log_OnLineVerification_Code, OnlyCheckCreditLimit, CheckBillingWithoutAdvance, AdvancePayPercentage
    , EntryDesp, MasterTableCode, BuyerPOMaster_Code, CallBackFunctionName_btnDone, Code, Mode, AskPassword) {


    var url = baseUrl + '/CustomControl/CheckCreditLimits';

    $('#DivCheckCreditLimitsModal').load(url, {
        AccountMaster_Code: AccountMaster_Code
        , Amount: Amount
        , PreviousAmount: PreviousAmount
        , Source: Source
        , PasswordsCodeRs: PasswordsCodeRs
        , PasswordsCodeDays: PasswordsCodeDays
        , ShowFormDialog: ShowFormDialog
        , LedgerClosing: LedgerClosing
        , OverDueAmount: OverDueAmount
        , ShowOnlyOutstandingInfo: ShowOnlyOutstandingInfo
        , Log_OnLineVerification_Code: Log_OnLineVerification_Code
        , OnlyCheckCreditLimit: OnlyCheckCreditLimit
        , CheckBillingWithoutAdvance: CheckBillingWithoutAdvance
        , AdvancePayPercentage: AdvancePayPercentage
        , EntryDesp: EntryDesp
        , MasterTableCode: MasterTableCode
        , BuyerPOMaster_Code: BuyerPOMaster_Code
        , CallBackFunctionName_btnDone: CallBackFunctionName_btnDone
        , Code: Code
        , Mode: Mode
        , AskPassword: AskPassword
        , AskRemark: 'Y'

    });

}
function ValidateOverdueAmount(ObjCurrRow) {
    const alertCls = confirm("Are you sure you want to Verify this Visit?");
    if (alertCls) {

        var FixedParameterCreditLimit_Config = JSON.parse(sessionStorage.getItem('FixedParameterCreditLimit'));
        var VisitMaster_OverdueOTPentered = ObjCurrRow.find('input[name="txtOverdueOTPentered"]').val();
        var TotalOrderAmount = parseFloat(ObjCurrRow.find('input[name="txtTotalAmount"]').val());
        var AccountMaster_Code = ObjCurrRow.find('input[name="txtDealerCode"]').val();
        var Config_CheckCreditLimit = FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == undefined || FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == '' ? 'N' : FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO;


        ///Config_CheckCreditLimit='R' means it will check credit limit only for Crm and Not Check in ERP

        if ((Config_CheckCreditLimit == 'Y' || Config_CheckCreditLimit == 'R') && VisitMaster_OverdueOTPentered=='N') {
            if (TotalOrderAmount > 0) {
                InitCheckCreditLimitsControl(AccountMaster_Code, TotalOrderAmount, 0, 'VISIT MASTER', 0, 0, 'Y', 0, 0, 'N', 0, 'N', 'N', 0, 'Y', 0, 0, 'VerifyForAll', 0, '', G_AskPassword);
            }
        } else {
            VerifyForAll();
        }
    }
}
function VerifyOrder_DeleteLine(Visitcode,DetailCode,itemRow) {
    var ModuleName = "Verify Order/Visit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    var OptionName = 'DeleteRow';
    let objItemRow = JSON.parse($(itemRow).closest('tr')[0].cells[0].innerHTML.trim());
    
    let RowDetails = `\nOrder Id:${objItemRow['Order Id']} \n Visit Date:${objItemRow['Visit Date']} \n Dealer Name:${objItemRow['Dealer Name']}\n Item Name:${objItemRow['Item Name']}\n Size:${objItemRow['Size']} \n Thk:${objItemRow['Thk']} \n Final Amount:${objItemRow['Final Amount']}`;
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const alertCls = confirm("Are you sure you want to Delete Row?" + RowDetails);
            if (alertCls) {
                VisitOrderEntryService.DeleteVisitOrderDetails_Row(Visitcode, DetailCode).then(function (res) {

                    if (res.Status == 'Y') {
                        toastr.success(res.Msg)
                        GetOrderVerifyData();
                    } else {
                        toastr.error(res.Msg)
                    }
                    
                })
                
               
            }
        }
    });
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
window.ViewVerificationDetails = ViewVerificationDetails;
window.ViewDiscountModal = ViewDiscountModal;
window.UpdateDiscountValue = UpdateDiscountValue;
window.InitCheckCreditLimitsControl = InitCheckCreditLimitsControl;
window.ValidateOverdueAmount = ValidateOverdueAmount;
window.VerifyForAll = VerifyForAll;
window.VerifyOrder_DeleteLine = VerifyOrder_DeleteLine;


