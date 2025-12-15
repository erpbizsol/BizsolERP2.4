import { VerifyDispatchPlanService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_VerifyDispatchPlanService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_DispatchPlanlist = [];
let G_DispatchAdviceNo = 0;
let G_DispatchMaster_Code = 0;
let G_AccountMaster_Code = 0;
$(document).ready(function () {
    //BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    var urlParams = BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['ModuleDesp']);
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Despatch Plan Marketing Person Wise");
    }
    if (decodeURI(urlParams['FrmAction']) == 'Verify PPC') {
        $("#ddlStatus").val('P');
    } else if (decodeURI(urlParams['FrmAction']) == 'Verify') {
        $("#ddlStatus").val('D');
    } else {
        $("#ddlStatus").val('M');
    }

    GetDispatchAdvicePlanList($("#ddlStatus").val());
    $("#ddlStatus").change(function(){
        GetDispatchAdvicePlanList($(this).val());
    })
});
function GetDispatchAdvicePlanList(Status) {
    Showloader();
    VerifyDispatchPlanService.GetDispatchAdvicePlanList(Status).then(function (response) {
        if (response && response.length > 0) {
            G_DispatchPlanlist = response;
            $("#dvTableDispatch").show();
            HideLoader();
            const stringFilterColumn = ["Marketing Man","PinCode", "Vehicle No", "Client Name", "Consignee Name", "City", "State", "Buyer PO No", "Ord No","Item Name","Size/Particular"];
            const numericFilterColumn = ["DO No",
                "Ord Qty Pc","Ord Qty MT","OrdQty MTRS","Bal Qty Pc","Bal Qty MT","BalQty MTRS","Pld Qty Pc","Pld Qty MT","PldQty MTRS","OutStanding Amt","Over due Amt","Credit Days","Credit Limit","AvailableLimit"
            ];
            const dateFilterColumn = ["Ord Date", "Dispatch Date", "DO Date","Buyer PO Date","Delivery Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode"];
            const columnAlignment = {
                "Ord Qty Pc": "right;max-width:30px;",
                "Ord Qty MT": "right",
                "OrdQty MTRS": "right",
                "Ord Qty MTRS": "right",
                "Bal Qty Pc": "right",
                "Bal Qty MT": "right",
                "BalQty MTRS": "right",
                "Bal Qty MTRS": "right",
                "Pld Qty Pc": "right",
                "Pld Qty MT": "right",
                "PldQty MTRS": "right",
                "Pld Qty MTRS": "right",
                "OutStanding Amt": "right",
                "Over due Amt": "right",
                "Credit Days": "right",
                "Credit Limit": "right",
                "AvailableLimit": "right"
            };
            const updatedResponse = response.map(item => {
                const Action = Status == 'C' ? `<button class="btn btn-success icon-height mb-1" title="View All" onclick="ViewAll(${item["Code"]})">All</button>` : `<button class="btn btn-success icon-height mb-1" title="Verify" onclick="Verify(${item["Code"]})"><i class="fa fa-check"></i></button>`;
                const Other = Status == 'D' ? `<button class="btn btn-warning icon-height mb-1" title="Verify/Send Mail" onclick="SendMail(${item["Code"]})">Verify/Send Mail</button>` : '';
                let formattedItem;
                if (Status == 'D') {
                    formattedItem = {
                        ...item,
                        //Action: Action,
                        Other: Other
                    };
                } else if (Status == 'C') { 
                    formattedItem = {
                        ...item,
                        Action: Action,
                        LV1_Transporter: item.LV1_Transporter == '' ? '' : `<a href="javascript:void(0)" onclick="ApprovedQuotstion(${item.Code},${item.LV1_TransporterCode})">${item.LV1_Transporter}</a>`,
                        LV2_Transporter: item.LV2_Transporter == '' ? '' : `<a href="javascript:void(0)" onclick="ApprovedQuotstion(${item.Code},${item.LV2_TransporterCode})">${item.LV2_Transporter}</a>`,
                        LV3_Transporter: item.LV3_Transporter == '' ? '' : `<a href="javascript:void(0)" onclick="ApprovedQuotstion(${item.Code},${item.LV3_TransporterCode})">${item.LV3_Transporter}</a>`
                    };
                } else{
                    formattedItem = {
                        ...item,
                        Action: Action
                    };
                }

                if (formattedItem["Ord Qty Pc"] != null && formattedItem["Ord Qty Pc"] !== '') {
                    const val = Number(formattedItem["Ord Qty Pc"]);
                    if (!isNaN(val)) formattedItem["Ord Qty Pc"] = val.toFixed(0);
                }
                if (formattedItem["Bal Qty Pc"] != null && formattedItem["Bal Qty Pc"] !== '') {
                    const val = Number(formattedItem["Bal Qty Pc"]);
                    if (!isNaN(val)) formattedItem["Bal Qty Pc"] = val.toFixed(0);
                }
                if (formattedItem["Pld Qty Pc"] != null && formattedItem["Pld Qty Pc"] !== '') {
                    const val = Number(formattedItem["Pld Qty Pc"]);
                    if (!isNaN(val)) formattedItem["Pld Qty Pc"] = val.toFixed(0);
                }
                
                // Format MT columns - 3 decimals
                if (formattedItem["Ord Qty MT"] != null && formattedItem["Ord Qty MT"] !== '') {
                    const val = Number(formattedItem["Ord Qty MT"]);
                    if (!isNaN(val)) formattedItem["Ord Qty MT"] = val.toFixed(3);
                }
                if (formattedItem["Bal Qty MT"] != null && formattedItem["Bal Qty MT"] !== '') {
                    const val = Number(formattedItem["Bal Qty MT"]);
                    if (!isNaN(val)) formattedItem["Bal Qty MT"] = val.toFixed(3);
                }
                if (formattedItem["Pld Qty MT"] != null && formattedItem["Pld Qty MT"] !== '') {
                    const val = Number(formattedItem["Pld Qty MT"]);
                    if (!isNaN(val)) formattedItem["Pld Qty MT"] = val.toFixed(3);
                }
                
                // Format MTRS columns - 0 decimals (support spaced and unspaced labels)
                if (formattedItem["OrdQty MTRS"] != null && formattedItem["OrdQty MTRS"] !== '') {
                    const val = Number(formattedItem["OrdQty MTRS"]);
                    if (!isNaN(val)) formattedItem["OrdQty MTRS"] = val.toFixed(0);
                }
                if (formattedItem["Ord Qty MTRS"] != null && formattedItem["Ord Qty MTRS"] !== '') {
                    const val = Number(formattedItem["Ord Qty MTRS"]);
                    if (!isNaN(val)) formattedItem["Ord Qty MTRS"] = val.toFixed(0);
                }
                if (formattedItem["BalQty MTRS"] != null && formattedItem["BalQty MTRS"] !== '') {
                    const val = Number(formattedItem["BalQty MTRS"]);
                    if (!isNaN(val)) formattedItem["BalQty MTRS"] = val.toFixed(0);
                }
                if (formattedItem["Bal Qty MTRS"] != null && formattedItem["Bal Qty MTRS"] !== '') {
                    const val = Number(formattedItem["Bal Qty MTRS"]);
                    if (!isNaN(val)) formattedItem["Bal Qty MTRS"] = val.toFixed(0);
                }
                if (formattedItem["PldQty MTRS"] != null && formattedItem["PldQty MTRS"] !== '') {
                    const val = Number(formattedItem["PldQty MTRS"]);
                    if (!isNaN(val)) formattedItem["PldQty MTRS"] = val.toFixed(0);
                }
                if (formattedItem["Pld Qty MTRS"] != null && formattedItem["Pld Qty MTRS"] !== '') {
                    const val = Number(formattedItem["Pld Qty MTRS"]);
                    if (!isNaN(val)) formattedItem["Pld Qty MTRS"] = val.toFixed(0);
                }
                
                // Format Amount columns - 2 decimals
                if (formattedItem["OutStanding Amt"] != null && formattedItem["OutStanding Amt"] !== '') {
                    const val = Number(formattedItem["OutStanding Amt"]);
                    if (!isNaN(val)) formattedItem["OutStanding Amt"] = val.toFixed(2);
                }
                if (formattedItem["Over due Amt"] != null && formattedItem["Over due Amt"] !== '') {
                    const val = Number(formattedItem["Over due Amt"]);
                    if (!isNaN(val)) formattedItem["Over due Amt"] = val.toFixed(2);
                }
                if (formattedItem["Credit Limit"] != null && formattedItem["Credit Limit"] !== '') {
                    const val = Number(formattedItem["Credit Limit"]);
                    if (!isNaN(val)) formattedItem["Credit Limit"] = val.toFixed(2);
                }
                if (formattedItem["AvailableLimit"] != null && formattedItem["AvailableLimit"] !== '') {
                    const val = Number(formattedItem["AvailableLimit"]);
                    if (!isNaN(val)) formattedItem["AvailableLimit"] = val.toFixed(2);
                }
                
                // Format Credit Days - 0 decimals
                if (formattedItem["Credit Days"] != null && formattedItem["Credit Days"] !== '') {
                    const val = Number(formattedItem["Credit Days"]);
                    if (!isNaN(val)) formattedItem["Credit Days"] = val.toFixed(0);
                }
                
                return formattedItem;
            });
            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

            setTimeout(() => {
                const filteredData = updatedResponse;
                const totals = calculateTotals(filteredData);
                const domTotals = calculateTotalsFromDOM();
                totals.ordQtyPc = domTotals.ordQtyPc;
                totals.ordQtyMT = domTotals.ordQtyMT;
                totals.ordQtyMTRS = domTotals.ordQtyMTRS;
                totals.balQtyPc = domTotals.balQtyPc;
                totals.balQtyMT = domTotals.balQtyMT;
                totals.balQtyMTRS = domTotals.balQtyMTRS;
                totals.pldQtyPc = domTotals.pldQtyPc;
                totals.pldQtyMT = domTotals.pldQtyMT;
                totals.pldQtyMTRS = domTotals.pldQtyMTRS;
                totals.outStandingAmt = domTotals.outStandingAmt;
                totals.overDueAmt = domTotals.overDueAmt;
                totals.creditDays = domTotals.creditDays;
                totals.creditLimit = domTotals.creditLimit;
                totals.availableLimit = domTotals.availableLimit;
                addTotalsRow(totals, hiddenColumns);

                // Enforce fixed widths by column index (1–14) after render
                applyFixedWidthsByIndex();
            }, 300);

        } else {
            HideLoader();
            $("#dvTableDispatch").hide();
            toastr.error('No Data Found');
            G_DispatchPlanlist = [];
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Get Dispatch Advice Plan List ');
        $("#dvTableDispatch").hide();
        G_DispatchPlanlist = [];
    });
}
function calculateTotalsFromDOM() {
    const totals = {
        ordQtyPc: 0,        
        ordQtyMT: 0,        
        ordQtyMTRS: 0,      
        balQtyPc: 0,        
        balQtyMT: 0,        
        balQtyMTRS: 0,      
        pldQtyPc: 0,        
        pldQtyMT: 0,        
        pldQtyMTRS: 0,      
        outStandingAmt: 0,  
        overDueAmt: 0,      
        creditDays: 0,      
        creditLimit: 0,     
        availableLimit: 0   
    };

    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    
    if (!tableHead || !tableBody) return totals;
    
    // Get the actual header row - find the non-totals row (header might be after totals row)
    const allRows = Array.from(tableHead.querySelectorAll('tr'));
    let headerRow = allRows.find(row => !row.classList.contains('totals-row'));
    if (!headerRow && tableHead.children.length > 0) {
        // If no totals-row class found, get the first row
        headerRow = tableHead.children[0];
    }
    if (!headerRow) return totals;
    
    const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
    const rows = tableBody.querySelectorAll('tr');
    
    // Build a column index map for reliable matching
    // CRITICAL: Check for MTRS keys before MT to prevent false matches
    const columnMap = {};
    headers.forEach((header, idx) => {
        const normalized = header.toLowerCase().trim();
        const normalizedNoSpace = normalized.replace(/\s+/g, '');

        // Flags
        const hasMTRS = normalized.includes('mtrs') || normalizedNoSpace.includes('mtrs');
        const hasMT = (normalized.includes(' mt') || normalized.endsWith('mt') || normalizedNoSpace.endsWith('mt')) && !hasMTRS;
        const hasPC = normalized.includes(' pc') || normalized.endsWith('pc') || normalizedNoSpace.endsWith('pc');

        // MTRS columns FIRST (support both 'Ord Qty MTRS' and 'OrdQty MTRS')
        if (hasMTRS) {
            if (normalized.includes('ord qty') || normalizedNoSpace.startsWith('ordqty')) {
                columnMap[idx] = 'ordQtyMTRS';
            } else if (normalized.includes('bal qty') || normalizedNoSpace.startsWith('balqty')) {
                columnMap[idx] = 'balQtyMTRS';
            } else if (normalized.includes('pld qty') || normalizedNoSpace.startsWith('pldqty')) {
                columnMap[idx] = 'pldQtyMTRS';
            }
        }
        // MT columns (only if not MTRS)
        else if (hasMT) {
            if (normalized.includes('ord qty') || normalizedNoSpace.startsWith('ordqty')) {
                columnMap[idx] = 'ordQtyMT';
            } else if (normalized.includes('bal qty') || normalizedNoSpace.startsWith('balqty')) {
                columnMap[idx] = 'balQtyMT';
            } else if (normalized.includes('pld qty') || normalizedNoSpace.startsWith('pldqty')) {
                columnMap[idx] = 'pldQtyMT';
            }
        }
        // PC columns (only if not MT/MTRS)
        else if (hasPC) {
            if (normalized.includes('ord qty') || normalizedNoSpace.startsWith('ordqty')) {
                columnMap[idx] = 'ordQtyPc';
            } else if (normalized.includes('bal qty') || normalizedNoSpace.startsWith('balqty')) {
                columnMap[idx] = 'balQtyPc';
            } else if (normalized.includes('pld qty') || normalizedNoSpace.startsWith('pldqty')) {
                columnMap[idx] = 'pldQtyPc';
            }
        }
        // Other numeric/amount columns
        else if (normalized.includes('outstanding amt') || normalizedNoSpace.includes('outstandingamt')) {
            columnMap[idx] = 'outStandingAmt';
        } else if (normalized.includes('over due amt') || normalized.includes('overdue amt') || normalizedNoSpace.includes('overdueamt')) {
            columnMap[idx] = 'overDueAmt';
        } else if (normalized.includes('credit days') || normalizedNoSpace.includes('creditdays')) {
            columnMap[idx] = 'creditDays';
        } else if (normalized.includes('credit limit') || normalizedNoSpace.includes('creditlimit')) {
            columnMap[idx] = 'creditLimit';
        } else if (normalized.includes('availablelimit') || normalized.includes('available limit') || normalizedNoSpace.includes('availablelimit')) {
            columnMap[idx] = 'availableLimit';
        }
    });
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            if (index >= headers.length) return;
            
            const cellValue = parseFloat(cell.textContent.trim().replace(/,/g, '')) || 0;
            const columnType = columnMap[index];
            
            // Use the column map to add to correct total
            if (columnType && totals.hasOwnProperty(columnType)) {
                totals[columnType] += cellValue;
            }
        });
    });
    
    return totals;
}
function applyFixedWidthsByIndex() {
    const table = document.getElementById('tblDispatchPlan');
    if (!table) return;
    const headRow = table.querySelector('thead tr');
    if (!headRow) return;

    const widths = {
        1: '20px',   // SNo
        2: '100px',  // Order No
        3: '80px',   // Order Date
        4: '80px',   // Dispatch Date
        5: '80px',   // Item Name
        6: '20px',   // Size
        7: '20px',   // Thickness
        8: '80px',   // Marketing Man
        9: '20px',   // Total Qty
        10: '20px',  // Order Bal Qty
        11: '20px',  // Rolled Qty
        12: '20px',  // Bal Qty
        13: '20px',  // Planned Qty
        14: '20px'   // Plan St
    };

    const applyWidth = (cell, px) => {
        if (!cell || !px) return;
        cell.style.minWidth = px;
    };

    const ths = headRow.querySelectorAll('th');
    ths.forEach((th, idx) => {
        const colIndex = idx + 1;
        if (widths[colIndex]) applyWidth(th, widths[colIndex]);
    });

    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        tds.forEach((td, idx) => {
            const colIndex = idx + 1;
            if (widths[colIndex]) applyWidth(td, widths[colIndex]);
        });
    });
}
function calculateTotals(data) {
    const totals = {
        totalQty: 0,        
        orderBalQty: 0,     
        rolledQty: 0,       
        balQty: 0,          
        plannedQty: 0,      
        rldplannedQty: 0,   
        dispatchQty: 0,     
        availableStockForDispatch: 0, 
        balanceDispatchQty: 0,
        ordQtyPc: 0,        
        ordQtyMT: 0,        
        ordQtyMTRS: 0,      
        balQtyPc: 0,        
        balQtyMT: 0,        
        balQtyMTRS: 0,      
        pldQtyPc: 0,        
        pldQtyMT: 0,        
        pldQtyMTRS: 0,      
        outStandingAmt: 0,  
        overDueAmt: 0,      
        creditDays: 0,      
        creditLimit: 0,     
        availableLimit: 0   
    };


    data.forEach((item, index) => {


        const totalQty = Number(item["Ord Qty"] ?? item["OrdQty"] ?? item["Ord_Qty"] ?? 0);
        const orderBalQty = Number(item["Ord Bal Qty"] ?? item["OrdBalQty"] ?? item["Ord_Bal_Qty"] ?? 0);

        const rolledQty = Number(item["Rld Qty_raw"] ?? item["Rld Qty"] ?? item["RldQty"] ?? item["Rld_Qty"] ?? 0);
        const plannedQty = Number(item["Pld Qty_raw"] ?? item["Pld Qty"] ?? item["PldQty"] ?? item["Pld_Qty"] ?? 0);

        const balQty = Number(item["Pld Bal Qty"] ?? item["PldBalQty"] ?? item["Pld_Bal_Qty"] ?? 0);
        const rldplannedQty = Number(item["Rld Bal Qty"] ?? item["RldBalQty"] ?? item["Rld_Bal_Qty"] ?? 0);

        const dispatchQty = Number(item["Dispatch Qty_raw"] ?? item["Dispatch Qty"] ?? item["DispatchQty"] ?? item["Dispatch_Qty"] ?? 0);

        const availableStockForDispatch = Number(
            item["Avl stock for dispatch"] ?? item["Availiable stock for dispatch"] ?? item["AvailableStockForDispatch"] ?? item["Avail_Stock_For_Dispatch"] ?? 0
        );
        const balanceDispatchQty = Number(item["Bal Dispatch Qty"] ?? item["BalanceDispatchQty"] ?? item["Bal_Dispatch_Qty"] ?? 0);

        // New columns to sum - PC columns
        const ordQtyPc = Number(item["Ord Qty Pc"] ?? item["OrdQtyPc"] ?? item["Ord_Qty_Pc"] ?? item["OrdQtyPC"] ?? 0);
        const balQtyPc = Number(item["Bal Qty Pc"] ?? item["BalQtyPc"] ?? item["Bal_Qty_Pc"] ?? item["BalQtyPC"] ?? 0);
        const pldQtyPc = Number(item["Pld Qty Pc"] ?? item["PldQtyPc"] ?? item["Pld_Qty_Pc"] ?? item["PldQtyPC"] ?? 0);
        
        // MT columns - ensure these are read separately
        const ordQtyMT = Number(item["Ord Qty MT"] ?? item["OrdQtyMT"] ?? item["Ord_Qty_MT"] ?? 0);
        const balQtyMT = Number(item["Bal Qty MT"] ?? item["BalQtyMT"] ?? item["Bal_Qty_MT"] ?? 0);
        const pldQtyMT = Number(item["Pld Qty MT"] ?? item["PldQtyMT"] ?? item["Pld_Qty_MT"] ?? 0);
        
        // MTRS columns - ensure these are distinct from MT, check all possible variations
        const ordQtyMTRS = Number(item["OrdQty MTRS"] ?? item["OrdQtyMTRS"] ?? item["Ord_Qty_MTRS"] ?? item["Ord Qty MR"] ?? item["OrdQtyMR"] ?? item["Ord QtyMTRS"] ?? item["Qty MTRS"] ?? item["QtyMTRS"] ?? 0);
        const balQtyMTRS = Number(item["BalQty MTRS"] ?? item["BalQtyMTRS"] ?? item["Bal_Qty_MTRS"] ?? item["Bal Qty MR"] ?? item["BalQtyMR"] ?? item["Bal QtyMTRS"] ?? 0);
        const pldQtyMTRS = Number(item["PldQty MTRS"] ?? item["PldQtyMTRS"] ?? item["Pld_Qty_MTRS"] ?? item["Pld Qty MR"] ?? item["PldQtyMR"] ?? item["Pld QtyMTRS"] ?? 0);
        const outStandingAmt = Number(item["OutStanding Amt"] ?? item["OutStandingAmt"] ?? item["OutStanding_Amt"] ?? item["Outstanding Amt"] ?? item["OutstandingAmt"] ?? 0);
        const overDueAmt = Number(item["Over due Amt"] ?? item["OverDueAmt"] ?? item["Over_Due_Amt"] ?? item["Overdue Amt"] ?? item["OverdueAmt"] ?? 0);
        const creditDays = Number(item["Credit Days"] ?? item["CreditDays"] ?? item["Credit_Days"] ?? 0);
        const creditLimit = Number(item["Credit Limit"] ?? item["CreditLimit"] ?? item["Credit_Limit"] ?? 0);
        const availableLimit = Number(item["AvailableLimit"] ?? item["Available_Limit"] ?? item["Available Limit"] ?? 0);

        if (!isNaN(totalQty)) totals.totalQty += totalQty;
        if (!isNaN(orderBalQty)) totals.orderBalQty += orderBalQty;
        if (!isNaN(rolledQty)) totals.rolledQty += rolledQty;
        if (!isNaN(balQty)) totals.balQty += balQty;
        if (!isNaN(plannedQty)) totals.plannedQty += plannedQty;
        if (!isNaN(rldplannedQty)) totals.rldplannedQty += rldplannedQty;
        if (!isNaN(dispatchQty)) totals.dispatchQty += dispatchQty;
        if (!isNaN(availableStockForDispatch)) totals.availableStockForDispatch += availableStockForDispatch;
        if (!isNaN(balanceDispatchQty)) totals.balanceDispatchQty += balanceDispatchQty;

        // Sum new columns
        if (!isNaN(ordQtyPc)) totals.ordQtyPc += ordQtyPc;
        if (!isNaN(ordQtyMT)) totals.ordQtyMT += ordQtyMT;
        if (!isNaN(ordQtyMTRS)) totals.ordQtyMTRS += ordQtyMTRS;
        if (!isNaN(balQtyPc)) totals.balQtyPc += balQtyPc;
        if (!isNaN(balQtyMT)) totals.balQtyMT += balQtyMT;
        if (!isNaN(balQtyMTRS)) totals.balQtyMTRS += balQtyMTRS;
        if (!isNaN(pldQtyPc)) totals.pldQtyPc += pldQtyPc;
        if (!isNaN(pldQtyMT)) totals.pldQtyMT += pldQtyMT;
        if (!isNaN(pldQtyMTRS)) totals.pldQtyMTRS += pldQtyMTRS;
        if (!isNaN(outStandingAmt)) totals.outStandingAmt += outStandingAmt;
        if (!isNaN(overDueAmt)) totals.overDueAmt += overDueAmt;
        if (!isNaN(creditDays)) totals.creditDays += creditDays;
        if (!isNaN(creditLimit)) totals.creditLimit += creditLimit;
        if (!isNaN(availableLimit)) totals.availableLimit += availableLimit;

    });

    return totals;
}
function addTotalsRow(totals, hiddenColumns = []) {
    const tableHead = document.getElementById('table-head');
    if (!tableHead) {
        setTimeout(() => addTotalsRow(totals, hiddenColumns), 200);
        return;
    }
    const existingTotalsRow = tableHead.querySelector('.totals-row');
    if (existingTotalsRow) {
        existingTotalsRow.remove();
    }
    if (tableHead.children.length === 0) {
        setTimeout(() => addTotalsRow(totals, hiddenColumns), 200);
        return;
    }
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.style.backgroundColor = '#fff';
    totalsRow.style.fontWeight = 'bold';
    totalsRow.style.borderBottom = '2px solid #5c95ce';
    totalsRow.style.position = 'sticky';
    totalsRow.style.top = '0';
    totalsRow.style.zIndex = '15';
    const firstHeaderRow = tableHead.children[0];
    const columnCount = firstHeaderRow.children.length;
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('th');
        cell.style.textAlign = 'center';
        cell.style.padding = '4px 4px';
        cell.style.border = '1px solid #ddd';
        cell.style.fontSize = '8pt';
        cell.style.height = '16px';
        cell.style.verticalAlign = 'middle';
        cell.style.whiteSpace = 'nowrap';

        const headerText = firstHeaderRow.children[i].textContent.trim();


        // Normalize both sides and only hide on exact normalized equality.
        // This prevents generic entries like "Code" from hiding columns such as "Pin Code".
        const normalizedHeader = headerText.replace(/\s+/g, '').toLowerCase();
        const isHidden = hiddenColumns.some(hiddenCol => {
            const normalizedHidden = String(hiddenCol).replace(/\s+/g, '').toLowerCase();
            return normalizedHeader === normalizedHidden;
        });

        // Special case: Show Status column in totals row even if it's hidden
        const isStatusColumn = headerText.includes('Status') || headerText.includes('Plan Status');

        if (isHidden && !isStatusColumn) {
            cell.textContent = '';
            cell.style.backgroundColor = '#e8f4fd';
            cell.style.display = 'none';
        } else {
            // Check for specific columns first (before general matches)
            if (headerText.includes('Ord Qty Pc')) {
                cell.textContent = totals.ordQtyPc.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Ord Qty MT')) {
                cell.textContent = totals.ordQtyMT.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('OrdQty MTRS') || headerText.includes('Ord Qty MTRS')) {
                cell.textContent = totals.ordQtyMTRS.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Bal Qty Pc')) {
                cell.textContent = totals.balQtyPc.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Bal Qty MT')) {
                cell.textContent = totals.balQtyMT.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('BalQty MTRS') || headerText.includes('Bal Qty MTRS')) {
                cell.textContent = totals.balQtyMTRS.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Qty Pc')) {
                cell.textContent = totals.pldQtyPc.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Qty MT')) {
                cell.textContent = totals.pldQtyMT.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('PldQty MTRS') || headerText.includes('Pld Qty MTRS')) {
                cell.textContent = totals.pldQtyMTRS.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Ord Qty') || headerText.includes('OQ')) {
                cell.textContent = totals.totalQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Ord Bal Qty') || headerText.includes('OBQ')) {
                cell.textContent = totals.orderBalQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Rld Qty')) {
                cell.textContent = totals.rolledQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Bal Qty')) {
                cell.textContent = totals.balQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Qty')) {
                cell.textContent = totals.plannedQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Rld Bal Qty')) {
                cell.textContent = totals.rldplannedQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Bal Dispatch Qty')) {
                cell.textContent = totals.balanceDispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Dispatch Qty')) {
                cell.textContent = totals.dispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Avl stock for dispatch') || headerText.includes('Availiable stock for dispatch')) {
                cell.textContent = totals.availableStockForDispatch.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('OutStanding Amt') || headerText.includes('Outstanding Amt')) {
                cell.textContent = totals.outStandingAmt.toFixed(2);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Over due Amt') || headerText.includes('Overdue Amt')) {
                cell.textContent = totals.overDueAmt.toFixed(2);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Credit Days')) {
                cell.textContent = totals.creditDays.toFixed(0);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Credit Limit')) {
                cell.textContent = totals.creditLimit.toFixed(2);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('AvailableLimit') || headerText.includes('Available Limit')) {
                cell.textContent = totals.availableLimit.toFixed(2);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Plan Status') || headerText.includes('PlanStatus') || headerText.includes('planStatus')) {
                cell.textContent = '';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 2) {
                cell.textContent = 'Total';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 0) {
                cell.textContent = 'Rows';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 1) {
                cell.textContent = countTableTr();
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'Right';
            } else {
                cell.textContent = '';
                cell.style.backgroundColor = '#e8f4fd';
            }
        }

        totalsRow.appendChild(cell);
    }

    tableHead.insertBefore(totalsRow, tableHead.firstChild);


    totalsRow.offsetHeight;

    setTimeout(() => {
        const allRows = tableHead.querySelectorAll('tr');
        allRows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            for (let i = cells.length - 1; i >= 0; i--) {
                const cell = cells[i];
                if (cell.textContent.trim() === '' && cell.style.backgroundColor === '') {
                    cell.remove();
                } else {
                    break;
                }
            }
        });
    }, 100);
}

document.addEventListener("DOMContentLoaded", function () {
    setInterval(ChangecolorTr, 1000); // Slower interval for better performance
});
function ChangecolorTr() {
    const tableBody = document.getElementById("table-body");
    const tableHead = document.getElementById("table-head");
    if (!tableBody || !tableHead) return;

    // Determine indices dynamically
    let statusColIndex = 21; // fallback
    let doNoColIndex = -1;
    let actionColIndex = -1; // color should not apply to Action only
    // Find the actual header (skip totals row if present)
    const allHeadRows = Array.from(tableHead.querySelectorAll('tr'));
    let headerRow = allHeadRows.find(r => !r.classList.contains('totals-row')) || allHeadRows[0] || null;
    if (headerRow) {
        const ths = Array.from(headerRow.querySelectorAll('th')).map(th => (th.textContent || '').trim());
        ths.forEach((text, idx) => {
            const norm = text.toLowerCase();
            const normNoSpace = norm.replace(/\s+/g, '');
            if (doNoColIndex === -1 && (norm.includes('do no') || normNoSpace.includes('dono'))) doNoColIndex = idx;
            if (norm.includes('plan status') || norm === 'status' || normNoSpace.includes('planstatus')) statusColIndex = idx;
            if (actionColIndex === -1 && (norm === 'action' || normNoSpace === 'action')) actionColIndex = idx;
        });
    }
    // If still not found, bail to avoid coloring all rows the same
    if (doNoColIndex === -1) return;

    const rows = tableBody.querySelectorAll("tr");
    if (rows.length === 0) return;
    // Group-based coloring: each consecutive DO No group gets a color; cycle 5 then repeat
    const groupColors = [
        "#fde2e2", // red-ish
        "#e6f7e6", // green-ish
        "#e6f0ff", // blue-ish
        "#fff7e0", // yellow-ish
        "#f3e6ff"  // purple-ish
    ];
    let i = 0;
    let groupIndex = 0;
    while (i < rows.length) {
        const row = rows[i];
        const tds = row.querySelectorAll('td');
        if (tds.length === 0) { i++; continue; }

        // Read current DO No
        const currentDo = (doNoColIndex >= 0 && tds.length > doNoColIndex)
            ? (tds[doNoColIndex].textContent || '').trim()
            : '';

        // Compute length of consecutive run with the same DO No
        let j = i + 1;
        while (j < rows.length) {
            const tdsNext = rows[j].querySelectorAll('td');
            const nextDo = (doNoColIndex >= 0 && tdsNext.length > doNoColIndex)
                ? (tdsNext[doNoColIndex].textContent || '').trim()
                : '';
            if (nextDo !== currentDo) break;
            j++;
        }

        // Apply a single color to the entire group, cycling across 5 colors
        const groupColor = groupColors[groupIndex % groupColors.length];
        for (let k = i; k < j; k++) {
            const cells = rows[k].querySelectorAll('td');
            // Color all cells, including Action
            Array.from(cells).forEach(td => {
                td.style.backgroundColor = groupColor;
            });
        }
        groupIndex++;

        // Preserve/overlay status coloring inside the group
        for (let k = i; k < j; k++) {
            const cells = rows[k].querySelectorAll('td');
            if (cells.length > statusColIndex) {
                const statusCell = cells[statusColIndex];
                const statusValue = (statusCell.textContent || '').trim().toUpperCase();
                switch (statusValue) {
                    case 'PLANNED':
                        statusCell.style.backgroundColor = '#07bb72';
                        break;
                    case 'PARTIAL':
                        statusCell.style.backgroundColor = '#ebb861';
                        break;
                    case 'PENDING':
                        statusCell.style.backgroundColor = '#f87171';
                        break;
                    default:
                        // keep row color applied earlier
                        break;
                }
            }
        }

        // Advance to next run start
        i = j;
    }
}
function countTableTr() {
    return $('#table-body tr').length;
}

$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    setTimeout(() => {
        const filteredData = window['filteredData_tblDispatchPlan'] || [];
        const totals = calculateTotals(filteredData);
        const domTotals = calculateTotalsFromDOM();
        totals.ordQtyPc = domTotals.ordQtyPc;
        totals.ordQtyMT = domTotals.ordQtyMT;
        totals.ordQtyMTRS = domTotals.ordQtyMTRS;
        totals.balQtyPc = domTotals.balQtyPc;
        totals.balQtyMT = domTotals.balQtyMT;
        totals.balQtyMTRS = domTotals.balQtyMTRS;
        totals.pldQtyPc = domTotals.pldQtyPc;
        totals.pldQtyMT = domTotals.pldQtyMT;
        totals.pldQtyMTRS = domTotals.pldQtyMTRS;
        totals.outStandingAmt = domTotals.outStandingAmt;
        totals.overDueAmt = domTotals.overDueAmt;
        totals.creditDays = domTotals.creditDays;
        totals.creditLimit = domTotals.creditLimit;
        totals.availableLimit = domTotals.availableLimit;
        const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode"];
        addTotalsRow(totals, hiddenColumns);
        applyFixedWidthsByIndex();
    }, 300);
});

$(document).on('click', '[id^="pageSize-"], [id^="firstBtn-"], [id^="prevBtn-"], [id^="nextBtn-"], [id^="lastBtn-"]', function () {
    setTimeout(() => {
        const filteredData = window['filteredData_tblDispatchPlan'] || [];
        const totals = calculateTotals(filteredData);
        const domTotals = calculateTotalsFromDOM();
        totals.ordQtyPc = domTotals.ordQtyPc;
        totals.ordQtyMT = domTotals.ordQtyMT;
        totals.ordQtyMTRS = domTotals.ordQtyMTRS;
        totals.balQtyPc = domTotals.balQtyPc;
        totals.balQtyMT = domTotals.balQtyMT;
        totals.balQtyMTRS = domTotals.balQtyMTRS;
        totals.pldQtyPc = domTotals.pldQtyPc;
        totals.pldQtyMT = domTotals.pldQtyMT;
        totals.pldQtyMTRS = domTotals.pldQtyMTRS;
        totals.outStandingAmt = domTotals.outStandingAmt;
        totals.overDueAmt = domTotals.overDueAmt;
        totals.creditDays = domTotals.creditDays;
        totals.creditLimit = domTotals.creditLimit;
        totals.availableLimit = domTotals.availableLimit;
        const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode"];
        addTotalsRow(totals, hiddenColumns);
        applyFixedWidthsByIndex();
    }, 300);
});
function ExportExcel() {
    const hiddenFields = ["Code","AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC"];
    VerifyDispatchPlanService.GetDispatchAdvicePlanList($("#ddlStatus").val()).then(function (response) {
        ExportToExcelControl.ExportToExcel(response, hiddenFields, "DispatchAdvicePlan");
    });

}
function Verify(Code) {
    var ModuleName = "Despatch Plan Marketing Person Wise",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear(),
        status = $("#ddlStatus").val();

    if (status === 'M') {
        OptionName = "Verify Marketing";
    } else if (status === 'P') {
        OptionName = "Verify PPC";
    } else if (status === 'D') {
        OptionName = "Verify";
    }

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenVerifyModal(Code);
        }
    });
}
function VerifyDispatch() {
    var Remark = $("#txtRemark").val();
    if (Remark == '') {
        toastr.error("Please enter remark.");
        return;
    }
    var Code = $("#hfCode").val();
    if (confirm("Are you sure you want to verify ?")) {
        Showloader();
        var Status = $("#ddlStatus").val();
        VerifyDispatchPlanService.Verify(Code, Status, Remark).then(function (response) {
            if (response.Status == 'Y') {
                toastr.success(response.Message);
                GetDispatchAdvicePlanList($("#ddlStatus").val());
                CloseVerifyModal();
                HideLoader();
            } else {
                toastr.error(response[0].Message);
                HideLoader();
            }
        }).catch(function (error) {
            HideLoader();
            toastr.error(error.Message || 'Error During Verify ');
        });
    }
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
function ViewAll(Code) {
    Showloader();
    VerifyDispatchPlanService.AllTransporterRateList(Code).then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["DespatchAdviceMaster_Code","AccountMaster_Code"];

            const columnAlignment = {
                Rate: 'right',
            };
            const updatedResponse = response.map(item => {
                const formattedItem = {
                    ...item,
                    'Transporter Name': `<a href="javascript:void(0)" onclick="ApprovedQuotstion(${item.AccountMaster_Code},${item.DespatchAdviceMaster_Code})">${item['Transporter Name']}</a>`,
                };
                return formattedItem;
            });
            BizsolCustomFilterGrid.CreateDataTable("AllTable-head", "AllTable-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            HideLoader();
            $('#AllModal').modal({ backdrop: 'static' });
            $('#AllModal').modal('show');
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
    });
}
function TransporterList() {
    Showloader();
    VerifyDispatchPlanService.TransporterList().then(function (response) {
        HideLoader();
        const $tbody = $('#transporterGridBody');
        const $selectAll = $('#selectAll');
        if ($tbody.length === 0 || $selectAll.length === 0) {
            return;
        }

        const previouslySelected = new Set(GetEmpCodes());
        $tbody.empty();

        if (response && response.length > 0) {
            response.forEach(function (item) {
                const code = item["Code"];
                const name = item["AccountDesp"];
                const nature = item["AccountNature"];
                if (!code && !name) return;
                const isChecked = previouslySelected.has(String(code)) || nature === 'Registered Transporter';
                const showUpdateBtn = nature !== 'Registered Transporter';
                const rowHtml = `
                    <tr>
                        <td style="text-align:center;">
                            <input type="checkbox"
                                   class="option"
                                   value="${code}"
                                   data-name="${name ? name.replace(/"/g, '&quot;') : ''}"
                                   ${isChecked ? 'checked' : ''}>
                        </td>
                        <td>${name || ''}</td>
                        <td style="text-align:center;">
                            ${showUpdateBtn ? `<button type="button" class="btn btn-primary btn-sm transporter-update" data-code="${code}">Update</button>` : ''}
                        </td>
                    </tr>`;
                $tbody.append(rowHtml);
            });
        } else {
            toastr.error('No Data Found');
        }

        // Refresh select-all state after rendering rows
        updateSelected();
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Transporter List');
    });
}
function SendMail(Code) {
    G_DispatchAdviceNo = Code;
    $('#Transporter').modal({ backdrop: 'static' });
    $('#Transporter').modal('show');
    TransporterList();
}
function CloseModal() {
    $('#AllModal').modal('hide');
    
}
function CloseTransporter() {
    $('#Transporter').modal('hide');
}
function GetEmpCodes() {
    const selectedCodes = [];
    $('.option:checked').each(function () {
        selectedCodes.push(String($(this).val()));
    });
    return selectedCodes;
}
function updateSelected() {
    const totalOptions = $('.option').length;
    const totalChecked = $('.option:checked').length;
    $('#selectAll').prop('checked', totalOptions > 0 && totalChecked === totalOptions);
}

$(document).on('change', '#selectAll', function () {
    const isChecked = $(this).is(':checked');
    $('.option').prop('checked', isChecked);
    updateSelected();
    if (typeof GetGenerateTaskTicketDateList === 'function') {
        GetGenerateTaskTicketDateList('Get');
    }
});

$(document).on('change', '.option', function () {
    updateSelected();
});
$(document).on('click', '.transporter-update', function () {
    const code = $(this).data('code');
    const $cb = $('.option[value="' + code + '"]');
    if ($cb.length) {
        $cb.prop('checked', true);
    }
    updateSelected();
    UpdateTransporter();
});
function UpdateTransporter() {
    var ModuleName = "Despatch Plan Marketing Person Wise",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            Update()
        }
    });
}
function Update() {
    let codes = GetEmpCodes();
    if (codes == '') {
        toastr.error('Please select at least one transporter.');
        return;
    }
    if (confirm("Are you sure you want to update ?")) {
        Showloader();
        VerifyDispatchPlanService.UpdateTransporter(codes).then(function (response) {
            if (response.Status == 'Y') {
                toastr.success(response.Message);
                HideLoader();
                CloseTransporter();
            } else {
                toastr.error(response.Message);
                HideLoader();
            }
        }).catch(function (error) {
            HideLoader();
        });
    }
}
function SendMailToTransporter() {
    var ModuleName = "Despatch Plan Marketing Person Wise",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear(),
        status = $("#ddlStatus").val();

    if (status === 'M') {
        OptionName = "Verify Marketing";
    } else if (status === 'P') {
        OptionName = "Verify PPC";
    } else if (status === 'D') {
        OptionName = "Verify";
    }

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {

            let TranporterCodes = GetEmpCodes();
            let Remark = $("#txtDispatchRemark").val();
            if (TranporterCodes == '') {
                toastr.error('Please select at least one transporter.');
                return;
            }
            if (Remark == '') {
                toastr.error('Please enter remark.');
                return;
            }
            if (confirm("Are you sure you want to verify/send mail ?")) {
                Showloader();
                VerifyDispatchPlanService.SendMailToTransporter(TranporterCodes, G_DispatchAdviceNo,Remark).then(function (response) {
                    if (response.Status == 'Y') {
                        toastr.success(response.Message);
                        HideLoader();
                        CloseTransporter();
                        GetDispatchAdvicePlanList($("#ddlStatus").val());
                    } else {
                        toastr.error(response.Message);
                        HideLoader();
                    }
                }).catch(function (error) {
                    HideLoader();
                });
            }
        }
    });
}
function ApprovedTransporter() {
    Showloader();
    VerifyDispatchPlanService.ApprovedQuotation(G_DispatchMaster_Code, G_AccountMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Message);
            GetDispatchAdvicePlanList($("#ddlStatus").val());
            CloseApprovedModal();
            HideLoader();
        } else {
            toastr.error(response.Message);
            HideLoader();
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Approved Quotation ');
    });
}
function ApprovedQuotstion(Code, TransporterCode) {
    G_DispatchMaster_Code = Code;
    G_AccountMaster_Code = TransporterCode;
    $('#dvApproved').modal({ backdrop: 'static' });
    $('#dvApproved').modal('show');
    CloseModal();
}
function CloseApprovedModal() {
    $('#dvApproved').modal('hide');
}
function OpenVerifyModal(Code) {
    $('#hfCode').val(Code);
    $('#dvRemark').modal({ backdrop: 'static' });
    $('#dvRemark').modal('show');
    $("#txtRemark").val("");
}
function CloseVerifyModal() {
    $('#dvRemark').modal('hide');
    $("#txtRemark").val("");
}

window.ViewAll = ViewAll;
window.CloseVerifyModal = CloseVerifyModal;
window.OpenVerifyModal = OpenVerifyModal;
window.VerifyDispatch = VerifyDispatch;
window.Verify = Verify;
window.ExportExcel = ExportExcel;
window.CloseModal = CloseModal;
window.CloseApprovedModal = CloseApprovedModal;
window.SendMail = SendMail;
window.CloseTransporter = CloseTransporter;
window.TransporterList = TransporterList;
window.GetEmpCodes = GetEmpCodes;
window.updateSelected = updateSelected;
window.UpdateTransporter = UpdateTransporter;
window.SendMailToTransporter = SendMailToTransporter;
window.ApprovedQuotstion = ApprovedQuotstion;
window.ApprovedTransporter = ApprovedTransporter;



