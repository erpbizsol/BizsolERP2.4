import { VerifyDispatchPlanService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_VerifyDispatchPlanService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
var userMaster = authKeyData.UserMaster_Code;
var UserType = UserDetails[0].UserType;

let G_DispatchPlanlist = [];
let G_DispatchAdviceNo = 0;
let G_DispatchMaster_Code = 0;
let G_AccountMaster_Code = 0;
let G_ViewAll_Code = 0;

let _vdpHeightRaf = 0;
let _vdpHeightHandlersBound = false;
function getViewportHeight() {
    return (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : (window.innerHeight || document.documentElement.clientHeight || 0);
}
function getFooterViewportOverlapHeight() {
    // Layout uses <footer class="modern-footer"> (fixed bottom), not footer.footer
    const footer = document.querySelector('footer.modern-footer') || document.querySelector('footer.footer') || document.querySelector('footer');
    if (!footer) return 0;
    const viewportHeight = getViewportHeight();
    const rect = footer.getBoundingClientRect();
    const h = rect.height || 0;
    if (!isFinite(h) || h <= 0) return 0;

    const overlap = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return overlap > 0 && isFinite(overlap) ? overlap : 0;
}
function adjustVerifyDispatchPlanTableHeight() {
    const twin = document.getElementById('dvTransporterReportTwinGrids');
    if (twin && !twin.classList.contains('d-none') && twin.offsetParent !== null) {
        const dv = document.getElementById('dvTableDispatch');
        if (!dv || dv.offsetParent === null) return;
        const layoutBottom = window.innerHeight || document.documentElement.clientHeight || getViewportHeight();
        const footerHeight = getFooterViewportOverlapHeight();
        const bottomGap = 0;
        const twinRect = twin.getBoundingClientRect();
        const topInset = Math.max(0, twinRect.top);
        let availableHeight = layoutBottom - topInset - footerHeight - bottomGap;
        if (!isFinite(availableHeight)) return;
        const gap = 6;
        const labelReserve = 18;
        const minWrapperPx = 350;
        const minTwinOuter = minWrapperPx * 2 + gap + labelReserve * 2;
        availableHeight = Math.max(minTwinOuter, Math.floor(availableHeight));
        twin.style.height = availableHeight + 'px';
        twin.style.maxHeight = 'none';
        let contentHeight = availableHeight - gap - labelReserve * 2;
        let hDetail;
        let hSummary;
        if (contentHeight <= 0) {
            return;
        }
        if (contentHeight < minWrapperPx * 2) {
            contentHeight = minWrapperPx * 2;
            availableHeight = contentHeight + gap + labelReserve * 2;
            twin.style.height = availableHeight + 'px';
        }
        hDetail = Math.floor(contentHeight / 2);
        hSummary = contentHeight - hDetail;
        const w1 = document.getElementById('tableWrapperTransporterR1');
        const w2 = document.getElementById('tableWrapperTransporterR2');
        if (w1) {
            w1.style.height = hDetail + 'px';
            w1.style.maxHeight = hDetail + 'px';
        }
        if (w2) {
            w2.style.height = hSummary + 'px';
            w2.style.maxHeight = hSummary + 'px';
        }
        return;
    }
    const tableWrapper = document.getElementById('tableWrapper');
    if (!tableWrapper) return;
    if (tableWrapper.offsetParent === null) return;

    const rect = tableWrapper.getBoundingClientRect();
    const viewportHeight = getViewportHeight();
    const footerHeight = getFooterViewportOverlapHeight();
    const bottomGap = 8;
    const minHeight = 200;

    let availableHeight = viewportHeight - rect.top - footerHeight - bottomGap;
    if (!isFinite(availableHeight)) return;
    availableHeight = Math.max(minHeight, Math.floor(availableHeight));

    tableWrapper.style.height = availableHeight + 'px';
    tableWrapper.style.maxHeight = availableHeight + 'px';
}
function scheduleVerifyDispatchPlanTableHeightAdjust() {
    if (_vdpHeightRaf) cancelAnimationFrame(_vdpHeightRaf);
    _vdpHeightRaf = requestAnimationFrame(function () {
        _vdpHeightRaf = 0;
        adjustVerifyDispatchPlanTableHeight();
    });
}
function bindVerifyDispatchPlanTableHeightHandlers() {
    if (_vdpHeightHandlersBound) return;
    _vdpHeightHandlersBound = true;

    window.addEventListener('resize', scheduleVerifyDispatchPlanTableHeightAdjust, { passive: true });
    window.addEventListener('orientationchange', scheduleVerifyDispatchPlanTableHeightAdjust, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleVerifyDispatchPlanTableHeightAdjust, { passive: true });
    }
    const sidebarEl = document.getElementById('modern-sidebar');
    if (sidebarEl) {
        new MutationObserver(scheduleVerifyDispatchPlanTableHeightAdjust).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
    }

    setTimeout(scheduleVerifyDispatchPlanTableHeightAdjust, 0);
    setTimeout(scheduleVerifyDispatchPlanTableHeightAdjust, 150);
    setTimeout(scheduleVerifyDispatchPlanTableHeightAdjust, 350);
}
$(document).ready(function () {
    //BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    var urlParams = BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['ModuleDesp']);
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Delivery Order/Despatch Advice (GST)");
    }
    if (decodeURI(urlParams['FrmAction']) == 'Verify PPC') {
        $("#ddlStatus").val('P');
    } else if (decodeURI(urlParams['FrmAction']) == 'Verify') {
        $("#ddlStatus").val('D');
    } else if (decodeURI(urlParams['FrmAction']) == 'Verify Marketing') {
        $("#ddlStatus").val('M');
    } else {
        $("#ddlStatus").val('AR');
    }

    bindVerifyDispatchPlanTableHeightHandlers();
    scheduleVerifyDispatchPlanTableHeightAdjust();
    setCurrentDateDespatchActivity();

    // GetDispatchAdvicePlanList($("#ddlStatus").val());
    // $("#ddlStatus").change(function(){
    //     GetDispatchAdvicePlanList($(this).val());
    // })
    var initialStatus = $("#ddlStatus").val();
    if (initialStatus === 'R' || initialStatus === 'T' || initialStatus === 'TR' || initialStatus === 'DR' || initialStatus === 'FL') {
        $(".despatch-activity-filter").removeClass('d-none');
        $("#dvTableDispatch").hide();
        $("#dvApprovedTransporterDashboard").removeClass('show').hide();
        if (initialStatus === 'TR') {
            ShowTransporterReportList();
        } else if (initialStatus === 'DR') {
            ShowDelayReportList();
        } else if (initialStatus === 'FL') {
            ShowFreightLossReportList();
        }
    } else if (initialStatus === 'AR') {
        $(".despatch-activity-filter").removeClass('d-none');
        $("#dvDelayReportCards").hide();
        $("#dvTableDispatch").hide();
        openApprovedTransporterDashboard();
    } else {
        $(".despatch-activity-filter").addClass('d-none');
        $("#dvApprovedTransporterDashboard").removeClass('show').hide();
        GetDispatchAdvicePlanList(initialStatus);
    }
    $("#ddlStatus").change(function () {
        var status = $(this).val();
        if (status === 'R' || status === 'T' || status === 'TR' || status === 'DR' || status === 'FL') {
            $(".despatch-activity-filter").removeClass('d-none');
            $("#dvTableDispatch").hide();
            $("#dvApprovedTransporterDashboard").removeClass('show').hide();
            if (status === 'TR') {
                ShowTransporterReportList();
            } else if (status === 'DR') {
                ShowDelayReportList();
            } else if (status === 'FL') {
                ShowFreightLossReportList();
            }
        } else if (status === 'AR') {
            $(".despatch-activity-filter").removeClass('d-none');
            $("#dvDelayReportCards").hide();
            $("#dvTableDispatch").hide();
            openApprovedTransporterDashboard();
        } else {
            $(".despatch-activity-filter").addClass('d-none');
            $("#dvApprovedTransporterDashboard").removeClass('show').hide();
            GetDispatchAdvicePlanList(status);
        }
    });
    $("#txtFromDate").change(function () {
        var s = $("#ddlStatus").val();
        if (s === 'R' || s === 'TR' || s === 'AR' || s === 'DR' || s === 'FL') {
            ShowFilteredList();
        }
    });
    $("#txtToDate").change(function () {
        var s = $("#ddlStatus").val();
        if (s === 'R' || s === 'TR' || s === 'AR' || s === 'DR' || s === 'FL') {
            ShowFilteredList();
        }
    });
});
function ensureStandardGridLayout() {
    $('#dvDelayReportCards').hide();
    $('#dvTransporterReportTwinGrids').addClass('d-none').removeClass('d-flex');
    $('#tableWrapper').removeClass('d-none');
}

function ensureTransporterTwinLayout() {
    $('#dvDelayReportCards').hide();
    $('#tableWrapper').addClass('d-none');
    $('#dvTransporterReportTwinGrids').removeClass('d-none').addClass('d-flex');
}

function GetDispatchAdvicePlanList(Status, fromdate, todate) {
    if (Status === 'TR') {
        ShowTransporterReportList();
        return;
    }
    // Hide Approved Transporter Dashboard when showing table
    $("#dvApprovedTransporterDashboard").removeClass('show').hide();
    
    ensureStandardGridLayout();
    if (fromdate == undefined) {
        fromdate = '';
    }
    if (todate == undefined) {
        todate = '';
    }
    Showloader();
    VerifyDispatchPlanService.GetDispatchAdvicePlanList(Status, fromdate, todate).then(function (response) {
        if (response && response.length > 0) {
            G_DispatchPlanlist = response;
            $("#dvTableDispatch").show();
            HideLoader();
            const stringFilterColumn = ["Marketing Man", "PinCode", "Vehicle No", "Client Name", "Consignee Name", "City", "State", "Buyer PO No", "Ord No", "Item Name", "Size/Particular", "Party Name","Destination City","Transporter Name","Truck No","Driver Name","Driver Mobile No"];
            const numericFilterColumn = ["DO No",
                "Ord Qty Pc", "Ord Qty MT", "OrdQty MTRS", "Bal Qty Pc", "Bal Qty MT", "BalQty MTRS", "Pld Qty Pc", "Pld Qty MT", "PldQty MTRS", "OutStanding Amt", "Over due Amt", "Credit Days", "Credit Limit", "AvailableLimit", "Approved Rate"
            ];
            const dateFilterColumn = ["Ord Date", "Dispatch Date", "DO Date","Buyer PO Date","Delivery Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode"
                , "Remarks", "CityMaster_Code_Freight", "DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
            // Show remark columns for Approved Quotation (T); hide for other locate statuses
            if (Status !== 'T') {
                hiddenColumns.push("Marketing Remark", "PPC Remark", "Despatch Remark", "Dispatch Remark");
            }
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
                const Action = Status == 'C' ? `<button class="btn btn-success icon-height mb-1" title="View All" onclick="ViewAll(${item["Code"]})">All</button>` : `<button class="btn btn-success icon-height mb-1" title="Verify" onclick="Verify(${item["Code"]})"><i class="fa fa-check"></i></button>&nbsp;<button class="btn btn-info icon-height mb-1" title="Update Qty" onclick="EditQty(${item["Code"]})"><i class="fa fa-pencil"></i></button>`;
                const Remark = `<button class="btn btn-info icon-height mb-1" title="Remarks" onclick="OpenShowRemarksModal(${item["Code"]})">Remark</button>`;
                const Other = Status == 'D' ? `<button class="btn btn-warning icon-height mb-1" title="Verify/Send Mail" onclick="SendMail(${item["Code"]})">Verify/Send Mail</button>&nbsp;<button class="btn btn-info icon-height mb-1" title="Update Qty" onclick="EditQty(${item["Code"]})"><i class="fa fa-pencil"></i></button>` : '';
                const Area = `${item["Area"]}&nbsp;<button class="btn btn-success icon-height mb-1" title="add/update area" onclick="UpdateArea(${item["Code"]},${item["CityMaster_Code_Freight"] != null ? item["CityMaster_Code_Freight"] : 0})"><i class="fa fa-plus"></i></button>`;

                let formattedItem;
                if (Status == 'D') {
                    formattedItem = {
                        ...item,
                        Remark: Remark,
                        //Action: Action,
                        Area: Area,
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
                } else if (Status == 'T'){
                    formattedItem = {
                        ...item
                    };
                } else {
                    formattedItem = {
                        ...item,
                        Remark: Remark,
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
            scheduleVerifyDispatchPlanTableHeightAdjust();

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
                applyTableBorders();
                scheduleVerifyDispatchPlanTableHeightAdjust();
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
    // Check if status is 'T' or 'R' and hide/remove totals row
    const status = $('#ddlStatus').val();
    if (status === 'T' || status === 'R') {
        const tableHead = document.getElementById('table-head');
        if (tableHead) {
            const existingTotalsRow = tableHead.querySelector('.totals-row');
            if (existingTotalsRow) {
                existingTotalsRow.remove();
            }
        }
        return;
    }
    
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
    setInterval(ChangecolorTr, 1000); 
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
        "#97AAC6", // blue-ish
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
function applyTableBorders() {
    const tableBody = document.getElementById('table-body');
    const tableHead = document.getElementById('table-head');
    
    if (tableBody) {
        const tds = tableBody.querySelectorAll('td');
        tds.forEach(td => {
            if (!td.style.border || td.style.border === '') {
                td.style.border = '1px solid #ddd';
            }
        });
    }
    
    if (tableHead) {
        const ths = tableHead.querySelectorAll('th');
        ths.forEach(th => {
            if (!th.style.border || th.style.border === '') {
                th.style.border = '1px solid #ddd';
            }
        });
    }
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
        const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode", "DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
        addTotalsRow(totals, hiddenColumns);
        applyFixedWidthsByIndex();
        applyTableBorders();
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
        const hiddenColumns = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "LV1_TransporterCode", "LV3_TransporterCode", "LV2_TransporterCode", "DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
        addTotalsRow(totals, hiddenColumns);
        applyFixedWidthsByIndex();
        applyTableBorders();
    }, 300);
});
function ExportExcel() {
    var status = $("#ddlStatus").val();
    if (status === 'AR') {
        var arFrom = $('#txtFromDate').val();
        var arTo = $('#txtToDate').val();
        if (!arFrom || !arTo) {
            toastr.warning('Please select From Date and To Date before export.');
            return;
        }
        if (new Date(arTo) < new Date(arFrom)) {
            toastr.warning('To Date must be greater than or equal to From Date.');
            return;
        }
        Showloader();
        VerifyDispatchPlanService.GetApprovedTransporterReport(arFrom, arTo).then(function (response) {
            HideLoader();
            var norm = normalizeApprovedTransporterReport(response);
            var rows = (norm.dataRows || []).slice();
            if (norm.grandRow) {
                rows.push(norm.grandRow);
            }
            if (!rows.length) {
                toastr.info('No data to export.');
                return;
            }
            ExportToExcelControl.ExportToExcel(rows, [], 'ApprovedTransporterDashboard');
            toastr.success('Export completed successfully.');
        }).catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || error.message || 'Error during export.');
        });
        return;
    }
    if (status === 'TR') {
        var fromDate = $('#txtFromDate').val();
        var toDate = $('#txtToDate').val();
        if (!fromDate || !toDate) {
            toastr.warning('Please select From Date and To Date before export.');
            return;
        }
        if (new Date(toDate) < new Date(fromDate)) {
            toastr.warning('To Date must be greater than or equal to From Date.');
            return;
        }
        Showloader();
        VerifyDispatchPlanService.GetTransporterReport(fromDate, toDate).then(function (response) {
            HideLoader();
            const parsed = parseTransporterReportResults(response);
            const has1 = parsed.result1 && parsed.result1.length > 0;
            const has2 = parsed.result2 && parsed.result2.length > 0;
            if (!has1 && !has2) {
                toastr.info('No data to export.');
                return;
            }
            if (typeof XLSX === 'undefined') {
                toastr.error('Excel export is not available.');
                return;
            }
            const wb = XLSX.utils.book_new();
            if (has1) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(omitTransporterHiddenExportColumns(parsed.result1)), 'Result1_DO');
            }
            if (has2) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(omitTransporterHiddenExportColumns(renameTransporterSummaryColumns(parsed.result2))), 'Result2_Transporter');
            }
            XLSX.writeFile(wb, 'TransporterReport.xlsx');
            toastr.success('Export completed successfully.');
        }).catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || error.message || 'Error during export.');
        });
        return;
    }
    if (status === 'DR') {
        var fromDate = $('#txtFromDate').val();
        var toDate = $('#txtToDate').val();
        if (!fromDate || !toDate) {
            toastr.warning('Please select From Date and To Date before export.');
            return;
        }
        if (new Date(toDate) < new Date(fromDate)) {
            toastr.warning('To Date must be greater than or equal to From Date.');
            return;
        }
        Showloader();
        VerifyDispatchPlanService.GetDelayReport(fromDate, toDate).then(function (response) {
            HideLoader();
            const parsed = parseTransporterReportResults(response);
            const detail = parsed.result1 && parsed.result1.length > 0 ? parsed.result1 : [];
            const summary = parsed.result2 && parsed.result2.length > 0 ? parsed.result2 : [];
            if (!detail.length && !summary.length) {
                toastr.info('No data to export.');
                return;
            }
            if (typeof XLSX === 'undefined') {
                toastr.error('Excel export is not available.');
                return;
            }
            const wb = XLSX.utils.book_new();
            if (detail.length) {
                // Excel: Unicode ballot icons (☑ / ☒) instead of SQL "?" placeholders
                XLSX.utils.book_append_sheet(
                    wb,
                    XLSX.utils.json_to_sheet(decorateDelayReportStatusIcons(mapNullsToEmptyStrings(detail), false)),
                    'DelayReport'
                );
            }
            if (summary.length) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapNullsToEmptyStrings(summary)), 'Summary');
            }
            XLSX.writeFile(wb, 'DispatchDelayReport.xlsx');
            toastr.success('Export completed successfully.');
        }).catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || error.message || 'Error during export.');
        });
        return;
    }
    if (status === 'FL') {
        var fromDate = $('#txtFromDate').val();
        var toDate = $('#txtToDate').val();
        if (!fromDate || !toDate) {
            toastr.warning('Please select From Date and To Date before export.');
            return;
        }
        if (new Date(toDate) < new Date(fromDate)) {
            toastr.warning('To Date must be greater than or equal to From Date.');
            return;
        }
        Showloader();
        VerifyDispatchPlanService.GetFreightLossReport(fromDate, toDate).then(function (response) {
            HideLoader();
            var rows = formatFreightLossQtyColumns(mapNullsToEmptyStrings(normalizeFreightLossRows(response)));
            if (!rows.length) {
                toastr.info('No data to export.');
                return;
            }
            if (typeof ExportToExcelControl !== 'undefined' && ExportToExcelControl.ExportToExcel) {
                ExportToExcelControl.ExportToExcel(rows, [], 'FreightLossReport');
            } else if (typeof XLSX !== 'undefined') {
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'FreightLossReport');
                XLSX.writeFile(wb, 'FreightLossReport.xlsx');
            } else {
                toastr.error('Excel export is not available.');
                return;
            }
            toastr.success('Export completed successfully.');
        }).catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || error.message || 'Error during export.');
        });
        return;
    }
    if (status === 'R' || status === 'T') {
        var fromDate = $('#txtFromDate').val();
        var toDate = $('#txtToDate').val();
        if (!fromDate || !toDate) {
            toastr.warning('Please select From Date and To Date before export.');
            return;
        }
        if (new Date(toDate) < new Date(fromDate)) {
            toastr.warning('To Date must be greater than or equal to From Date.');
            return;
        }
        if (status === 'R') {
            Showloader();
            VerifyDispatchPlanService.GetDespatchActivityReportList(fromDate, toDate).then(function (response) {
                HideLoader();
                if (response && response.length > 0) {
                    ExportToExcelControl.ExportToExcel(response, [], "DespatchActivityReport");
                    toastr.success('Export completed successfully.');
                } else {
                    toastr.info('No data to export for the selected date range.');
                }
            }).catch(function (error) {
                HideLoader();
                toastr.error(error.Msg || error.message || 'Error during export.');
            });
            return;
        }
        if (status === 'T') {
            const hiddenFields = ["Code", "AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
            Showloader();
            VerifyDispatchPlanService.GetDispatchAdvicePlanList(status, fromDate, toDate).then(function (response) {
                HideLoader();
                if (response && response.length > 0) {
                    ExportToExcelControl.ExportToExcel(response, hiddenFields, "DispatchAdvicePlan");
                    toastr.success('Export completed successfully.');
                } else {
                    toastr.info('No data to export.');
                }
            }).catch(function (error) {
                toastr.error(error.Msg || error.message || 'Error during export.');
            });
            HideLoader();
        }
        return;
    }
    const hiddenFields = ["Code","AutoOrderNo", "IsPlanned", "Dispatch Qty Pc", "Dispatch Qty MT", "Dispatch Qty MTRS", "BuyerPOMaster_Code", "BuyerPODetail_Code", "DespatchPlanCode", "ItemSizeMaster_Code", "Verified", "VarifyMarketing", "CheckedPPC", "DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
    VerifyDispatchPlanService.GetDispatchAdvicePlanList(status).then(function (response) {
        if (response && response.length > 0) {
            ExportToExcelControl.ExportToExcel(response, hiddenFields, "DispatchAdvicePlan");
            toastr.success('Export completed successfully.');
        } else {
            toastr.info('No data to export.');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || error.message || 'Error during export.');
    });
}
function Verify(Code) {
    var ModuleName = "Delivery Order/Despatch Advice (GST)",
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

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response1) {
        if (response1.CheckModuleOptionRight == 'N') {
            toastr.error(response1.Msg);
            return false;
        } else {
            if (status == "P" && UserType != "A" ) {
                VerifyDispatchPlanService.GetTimeBasedVerifyNotAllowInDispatch().then(function (response2) {
                    if (response2[0].Msg == '') {
                        OpenVerifyModal(Code);
                    } else {
                        MenuService.CheckModuleOptionRight(ModuleName, "Verify Within Time Limit", ShowMsg, FinYear).then(function (response3) {
                            if (response3.CheckModuleOptionRight == 'N') {
                                toastr.warning(response2[0].Msg);
                                return false;
                            } else {
                                OpenVerifyModal(Code);
                            }
                        });
                    }
                });
            } else {
                OpenVerifyModal(Code);
            }
        }
    });
}
function showConfirmDialog(message, title) {
    return new Promise(function (resolve) {
        var overlay = document.getElementById('vdpConfirmOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vdpConfirmOverlay';
            overlay.innerHTML =
                '<div class="vdp-confirm-backdrop"></div>' +
                '<div class="vdp-confirm-box" role="dialog" aria-modal="true">' +
                '  <div class="vdp-confirm-header">Confirm</div>' +
                '  <div class="vdp-confirm-body" id="vdpConfirmMsg"></div>' +
                '  <div class="vdp-confirm-footer">' +
                '    <button type="button" class="btn btn-secondary btn-sm" id="vdpConfirmCancel">Cancel</button>' +
                '    <button type="button" class="btn btn-primary btn-sm" id="vdpConfirmOk">OK</button>' +
                '  </div>' +
                '</div>';
            var style = document.createElement('style');
            style.textContent =
                '#vdpConfirmOverlay{display:none;position:fixed;inset:0;z-index:20000;align-items:center;justify-content:center;padding:16px;}' +
                '#vdpConfirmOverlay.vdp-confirm-open{display:flex;}' +
                '#vdpConfirmOverlay .vdp-confirm-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);}' +
                '#vdpConfirmOverlay .vdp-confirm-box{position:relative;background:#fff;border-radius:8px;width:min(360px,92vw);box-shadow:0 8px 24px rgba(0,0,0,.25);overflow:hidden;}' +
                '#vdpConfirmOverlay .vdp-confirm-header{background:#558bc0;color:#fff;font-weight:600;padding:10px 14px;}' +
                '#vdpConfirmOverlay .vdp-confirm-body{padding:16px 14px;font-size:14px;color:#2c3e50;line-height:1.4;}' +
                '#vdpConfirmOverlay .vdp-confirm-footer{padding:10px 14px 14px;display:flex;justify-content:flex-end;gap:8px;}' +
                '#vdpConfirmOverlay .vdp-confirm-footer .btn{min-width:72px;min-height:36px;}';
            document.head.appendChild(style);
            document.body.appendChild(overlay);
        }
        var msgEl = document.getElementById('vdpConfirmMsg');
        if (msgEl) msgEl.textContent = message || '';
        var header = overlay.querySelector('.vdp-confirm-header');
        if (header) header.textContent = title || 'Confirm';

        var settled = false;
        var finish = function (ok) {
            if (settled) return;
            settled = true;
            overlay.classList.remove('vdp-confirm-open');
            overlay.style.display = 'none';
            resolve(!!ok);
        };
        document.getElementById('vdpConfirmOk').onclick = function () { finish(true); };
        document.getElementById('vdpConfirmCancel').onclick = function () { finish(false); };
        overlay.querySelector('.vdp-confirm-backdrop').onclick = function () { finish(false); };

        overlay.style.display = 'flex';
        overlay.classList.add('vdp-confirm-open');
    });
}
function VerifyDispatch() {
    var Remark = $("#txtRemark").val();
    if (Remark == '') {
        toastr.error("Please enter remark.");
        return;
    }
    var Code = $("#hfCode").val();
    showConfirmDialog("Are you sure you want to verify ?").then(function (ok) {
        if (!ok) return;
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
function ViewAll(Code) {
    G_ViewAll_Code = Code;
    Showloader();
    VerifyDispatchPlanService.AllTransporterRateList(Code).then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["DespatchAdviceMaster_Code", "AccountMaster_Code", "IsApproved", "IsTransporter"];

            const columnAlignment = {
                Rate: 'right',
            };
            const updatedResponse = response.map(item => {
                const isApprovedTransporter = item.IsTransporter === 'Y' || item.IsApproved === 'Y';
                const actionButton = isApprovedTransporter
                    ? `<button class="btn btn-info icon-height mb-1" onclick="UnApprovedQuotstion(${item.DespatchAdviceMaster_Code},${item.AccountMaster_Code})">Un-Approved</button>`
                    : '';
                const formattedItem = {
                    ...item,
                    'Transporter Name': `<a href="javascript:void(0)" onclick="ApprovedQuotstion(${item.DespatchAdviceMaster_Code},${item.AccountMaster_Code})">${item['Transporter Name']}</a>`,
                    'Action': actionButton
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
    var ModuleName = "Delivery Order/Despatch Advice (GST)",
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
    showConfirmDialog("Are you sure you want to update ?").then(function (ok) {
        if (!ok) return;
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
    });
}
function SendMailToTransporter() {
    var ModuleName = "Delivery Order/Despatch Advice (GST)",
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
            showConfirmDialog("Are you sure you want to verify/send mail ?").then(function (ok) {
                if (!ok) return;
                Showloader();
                VerifyDispatchPlanService.SendMailToTransporter(TranporterCodes, G_DispatchAdviceNo, Remark).then(function (response) {
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
            });
        }
    });
}
function hideVerifyModal(modalId) {
    const element = document.getElementById(modalId);
    if (element && window.bootstrap && bootstrap.Modal) {
        const instance = bootstrap.Modal.getInstance(element);
        if (instance) {
            instance.hide();
            return;
        }
    }
    $('#' + modalId).modal('hide');
}
function ApprovedTransporter() {
    Showloader();
    VerifyDispatchPlanService.ApprovedQuotation(G_DispatchMaster_Code, G_AccountMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Message);
            CloseApprovedModal();
            GetDispatchAdvicePlanList($("#ddlStatus").val());
            //if (G_ViewAll_Code) {
            //    ViewAll(G_ViewAll_Code);
            //}
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
function UnApprovedTransporter() {
    Showloader();
    VerifyDispatchPlanService.UnApprovedQuotation(G_DispatchMaster_Code, G_AccountMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Message);
            CloseUnApprovedModal();
            GetDispatchAdvicePlanList($("#ddlStatus").val());
            if (G_ViewAll_Code) {
                ViewAll(G_ViewAll_Code);
            }
            HideLoader();
        } else {
            toastr.error(response.Message);
            HideLoader();
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Un Approved Quotation ');
    });
}
function ApprovedQuotstion(Code, TransporterCode) {
    G_DispatchMaster_Code = Code;
    G_AccountMaster_Code = TransporterCode;
    $('#dvApproved').modal({ backdrop: 'static' });
    $('#dvApproved').modal('show');
    CloseModal();
}
function UnApprovedQuotstion(Code, TransporterCode) {
    G_DispatchMaster_Code = Code;
    G_AccountMaster_Code = TransporterCode;
    $('#dvUnApproved').modal({ backdrop: 'static' });
    $('#dvUnApproved').modal('show');
    CloseModal();
}
function CloseApprovedModal() {
    hideVerifyModal('dvApproved');
}
function CloseUnApprovedModal() {
    hideVerifyModal('dvUnApproved');
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
function EditQty(Code) {
    var ModuleName = "Delivery Order/Despatch Advice (GST)",
    OptionName = "Edit",
    ShowMsg = "Y",
    FinYear = getFinancialYear()
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenUpdateQtyModal(Code);
        }
    });
}
function OpenUpdateQtyModal(Code) {
    Showloader();
    $('#dvUpdateQty').modal({ backdrop: 'static' });
    $('#dvUpdateQty').modal('show');
    VerifyDispatchPlanService.GetDespatchAdviceQtyForUpdate(Code).then(function (response) {
        HideLoader();
        const $tbody = $('#tbodyUpdateGridWrapper');

        $tbody.empty();

        if (response && response.length > 0) {
            response.forEach(function (item, index) {
                const masterCode = item["DespatchAdviceMaster_Code"];
                const tranCode = item["DespatchAdviceTransaction_Code"];
                const itemName = item["ItemName"] || '';
                const sizeDesp = item["SizeDesp"] || '';
                const qtyPc = item["PlannedQtyPc"] ?? 0;
                const qtyMT = item["PlannedQtyMT"] ?? 0;
                const qtyMTRS = item["PlannedQtyMTRS"] ?? 0;
                // Store balance quantities for validation
                const balQtyPc = item["BalQTYPCS"] ?? 0;
                const balQtyMT = item["BalQTYMT"] ?? 0;
                const balQtyMTRS = item["BalQTYMTRS"] ?? 0;

                // Format balance quantities for display
                const balQtyPcDisplay = Number(balQtyPc).toFixed(0);
                const balQtyMTDisplay = Number(balQtyMT).toFixed(3);
                const balQtyMTRSDisplay = Number(balQtyMTRS).toFixed(0);

                const rowHtml = `
                    <tr data-master-code="${masterCode}" data-tran-code="${tranCode}" data-bal-qty-pc="${balQtyPc}" data-bal-qty-mt="${balQtyMT}" data-bal-qty-mtrs="${balQtyMTRRS}">
                        <td style="text-align:center;">${index + 1}</td>
                        <td style="text-align:left;">${itemName}</td>
                        <td style="text-align:left;">${sizeDesp}</td>
                        <td style="text-align:right;">${balQtyPcDisplay}</td>
                        <td style="text-align:right;">${balQtyMTDisplay}</td>
                        <td style="text-align:right;">${balQtyMTRSDisplay}</td>
                        <td>
                            <input type="text"
                                   class="form-control form-control-sm qty-pc"
                                   value="${qtyPc}"
                                   style="text-align:right;" />
                        </td>
                        <td>
                            <input type="text"
                                   class="form-control form-control-sm qty-mt"
                                   value="${qtyMT}"
                                   style="text-align:right;" />
                        </td>
                        <td>
                            <input type="text"
                                   class="form-control form-control-sm qty-mtrs"
                                   value="${qtyMTRS}"
                                   style="text-align:right;" />
                        </td>
                    </tr>`;
                $tbody.append(rowHtml);
            });
        } else {
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Transporter List');
    });
    
}
function CloseUpdateQtyModal() {
    $('#dvUpdateQty').modal('hide');
}

$(document).on('keypress', '.qty-pc', function (e) {
    const charCode = e.which || e.keyCode;
    if (charCode === 8 || charCode === 9 || charCode === 13) return;
    const ch = String.fromCharCode(charCode);
    if (!/[0-9]/.test(ch)) {
        e.preventDefault();
    }
});
$(document).on('keypress', '.qty-mt, .qty-mtrs', function (e) {
    const input = e.target;
    const $input = $(input);
    const charCode = e.which || e.keyCode;
    if (charCode === 8 || charCode === 9 || charCode === 13) return;

    const ch = String.fromCharCode(charCode);
    if (!/[0-9.]/.test(ch)) {
        e.preventDefault();
        return;
    }

    const current = $input.val() ? $input.val().toString() : '';
    const start = input.selectionStart != null ? input.selectionStart : current.length;
    const end = input.selectionEnd != null ? input.selectionEnd : current.length;
    const next = current.slice(0, start) + ch + current.slice(end);

    const dots = (next.match(/\./g) || []).length;
    if (dots > 1) {
        e.preventDefault();
        return;
    }
    const parts = next.split('.');
    if (parts.length === 2 && parts[1].length > 3) {
        e.preventDefault();
        return;
    }
});

// Validation functions for balance quantity checks
function validateQtyPc(input) {
    const $input = $(input);
    const $row = $input.closest('tr');
    const balQtyPc = parseFloat($row.data('bal-qty-pc') || 0);
    const inputVal = $input.val() ? $input.val().toString().trim() : '';
    
    if (inputVal === '') {
        $input.removeClass('is-invalid');
        return true;
    }
    
    if (!/^\d+$/.test(inputVal)) {
        return false;
    }
    
    const qtyPc = parseInt(inputVal, 10);
    if (qtyPc > balQtyPc) {
        $input.addClass('is-invalid');
        return false;
    }
    
    $input.removeClass('is-invalid');
    return true;
}

function validateQtyMT(input) {
    const $input = $(input);
    const $row = $input.closest('tr');
    const balQtyMT = parseFloat($row.data('bal-qty-mt') || 0);
    const inputVal = $input.val() ? $input.val().toString().trim() : '';
    
    if (inputVal === '') {
        $input.removeClass('is-invalid');
        return true;
    }
    
    const decimalRegex = /^(?:\d+|\d*\.\d{1,3})$/;
    if (!decimalRegex.test(inputVal)) {
        return false;
    }
    
    const qtyMT = parseFloat(inputVal);
    if (qtyMT > balQtyMT) {
        $input.addClass('is-invalid');
        return false;
    }
    
    $input.removeClass('is-invalid');
    return true;
}

function validateQtyMTRS(input) {
    const $input = $(input);
    const $row = $input.closest('tr');
    const balQtyMTRS = parseFloat($row.data('bal-qty-mtrs') || 0);
    const inputVal = $input.val() ? $input.val().toString().trim() : '';
    
    if (inputVal === '') {
        $input.removeClass('is-invalid');
        return true;
    }
    
    const decimalRegex = /^(?:\d+|\d*\.\d{1,3})$/;
    if (!decimalRegex.test(inputVal)) {
        return false;
    }
    
    const qtyMTRS = parseFloat(inputVal);
    if (qtyMTRS > balQtyMTRS) {
        $input.addClass('is-invalid');
        return false;
    }
    
    $input.removeClass('is-invalid');
    return true;
}

// Flag to prevent recursive updates during auto-calculation
let isCalculating = false;

// Auto-calculation functions for MT and PC
function calculatePCFromMT($input) {
    if (isCalculating) return;
    
    const $row = $input.closest('tr');
    const balQtyPc = parseFloat($row.data('bal-qty-pc') || 0);
    const balQtyMT = parseFloat($row.data('bal-qty-mt') || 0);
    const inputVal = $input.val() ? $input.val().toString().trim() : '';
    
    // If field value is empty, treat as 0
    const qtyMT = inputVal === '' ? 0 : parseFloat(inputVal);
    if (isNaN(qtyMT)) {
        return;
    }
    
    // Check if balance quantities are valid for conversion
    if (balQtyPc === 0 || balQtyMT === 0) {
        return;
    }
    
    // Calculate conversion factor from balance quantities
    const conversionFactor = balQtyMT / balQtyPc;
    if (conversionFactor === 0 || !isFinite(conversionFactor)) {
        return;
    }
    
    // Calculate PC from MT: PC = MT / conversionFactor
    const calculatedPC = Math.round(qtyMT / conversionFactor);
    const $pcInput = $row.find('.qty-pc');
    
    // Update the calculated value (even if 0)
    if (calculatedPC >= 0 && calculatedPC <= balQtyPc) {
        isCalculating = true;
        $pcInput.val(calculatedPC);
        validateQtyPc($pcInput[0]);
        isCalculating = false;
    }
}

function calculateMTFromPC($input) {
    if (isCalculating) return;
    
    const $row = $input.closest('tr');
    const balQtyPc = parseFloat($row.data('bal-qty-pc') || 0);
    const balQtyMT = parseFloat($row.data('bal-qty-mt') || 0);
    const inputVal = $input.val() ? $input.val().toString().trim() : '';
    
    // If field value is empty, treat as 0
    const qtyPc = inputVal === '' ? 0 : parseInt(inputVal, 10);
    if (isNaN(qtyPc)) {
        return;
    }
    
    // Check if balance quantities are valid for conversion
    if (balQtyPc === 0 || balQtyMT === 0) {
        return;
    }
    
    // Calculate conversion factor from balance quantities
    const conversionFactor = balQtyMT / balQtyPc;
    if (conversionFactor === 0 || !isFinite(conversionFactor)) {
        return;
    }
    
    // Calculate MT from PC: MT = PC * conversionFactor
    const calculatedMT = (qtyPc * conversionFactor).toFixed(3);
    const $mtInput = $row.find('.qty-mt');
    const calculatedMTNum = parseFloat(calculatedMT);
    
    // Update the calculated value (even if 0)
    if (calculatedMTNum >= 0 && calculatedMTNum <= balQtyMT) {
        isCalculating = true;
        $mtInput.val(calculatedMT);
        validateQtyMT($mtInput[0]);
        isCalculating = false;
    }
}

// Add validation and auto-calculation on blur/change events
$(document).on('blur change', '.qty-pc', function () {
    validateQtyPc(this);
    // Auto-calculate MT when PC is entered
    calculateMTFromPC($(this));
});

$(document).on('blur change', '.qty-mt', function () {
    validateQtyMT(this);
    // Auto-calculate PC when MT is entered
    calculatePCFromMT($(this));
});

$(document).on('blur change', '.qty-mtrs', function () {
    validateQtyMTRS(this);
});

// Add real-time calculation on input (as user types)
$(document).on('input', '.qty-pc', function () {
    // Auto-calculate MT when PC is being typed (even if empty, treat as 0)
    calculateMTFromPC($(this));
});

$(document).on('input', '.qty-mt', function () {
    // Auto-calculate PC when MT is being typed (even if empty, treat as 0)
    calculatePCFromMT($(this));
});
function UpdateQty() {
    const rows = $('#tbodyUpdateGridWrapper tr');
    if (rows.length === 0) {
        toastr.error('No rows to update.');
        return;
    }
    const payload = [];
    let isValid = true;
    rows.each(function (rowIndex) {
        const $row = $(this);
        const masterCode = $row.data('master-code');
        const tranCode = $row.data('tran-code');

        let qtyPcStr = ($row.find('.qty-pc').val() || '').toString().trim();
        let qtyMtStr = ($row.find('.qty-mt').val() || '').toString().trim();
        let qtyMtrsStr = ($row.find('.qty-mtrs').val() || '').toString().trim();

        if (!masterCode || !tranCode) {
            return;
        }

        if (qtyPcStr === '') qtyPcStr = '0';
        if (qtyMtStr === '') qtyMtStr = '0';
        if (qtyMtrsStr === '') qtyMtrsStr = '0';

        if (!/^\d+$/.test(qtyPcStr)) {
            toastr.error('Invalid Planned Qty Pc at row ' + (rowIndex + 1) + '. Only whole numbers allowed.');
            $row.find('.qty-pc').focus();
            isValid = false;
            return false;
        }
        const decimalRegex = /^(?:\d+|\d*\.\d{1,3})$/;

        if (!decimalRegex.test(qtyMtStr)) {
            toastr.error('Invalid Planned Qty MT at row ' + (rowIndex + 1) + '. Max 3 decimals allowed (e.g. 1, 1.5, .999).');
            $row.find('.qty-mt').focus();
            isValid = false;
            return false;
        }

        if (!decimalRegex.test(qtyMtrsStr)) {
            toastr.error('Invalid Planned Qty MTRS at row ' + (rowIndex + 1) + '. Max 3 decimals allowed (e.g. 1, 1.5, .999).');
            $row.find('.qty-mtrs').focus();
            isValid = false;
            return false;
        }
        const qtyPc = parseInt(qtyPcStr, 10);
        const qtyMT = parseFloat(qtyMtStr);
        const qtyMTRS = parseFloat(qtyMtrsStr);
        
        // Validate against balance quantities
        const balQtyPc = parseFloat($row.data('bal-qty-pc') || 0);
        const balQtyMT = parseFloat($row.data('bal-qty-mt') || 0);
        const balQtyMTRS = parseFloat($row.data('bal-qty-mtrs') || 0);
        
        if (qtyPc > balQtyPc) {
            toastr.error('Planned Qty Pc (' + qtyPc + ') cannot be greater than Balance Qty Pc (' + balQtyPc + ') at row ' + (rowIndex + 1) + '.');
            $row.find('.qty-pc').focus().addClass('is-invalid');
            isValid = false;
            return false;
        }
        
        if (qtyMT > balQtyMT) {
            toastr.error('Planned Qty MT (' + qtyMT + ') cannot be greater than Balance Qty MT (' + balQtyMT + ') at row ' + (rowIndex + 1) + '.');
            $row.find('.qty-mt').focus().addClass('is-invalid');
            isValid = false;
            return false;
        }
        
        if (qtyMTRS > balQtyMTRS) {
            toastr.error('Planned Qty MTRS (' + qtyMTRS + ') cannot be greater than Balance Qty MTRS (' + balQtyMTRS + ') at row ' + (rowIndex + 1) + '.');
            $row.find('.qty-mtrs').focus().addClass('is-invalid');
            isValid = false;
            return false;
        }
        
        let Process = $("#ddlStatus").val();
        if (Process == 'M') {
            Process = 'Marketing';
        } else if (Process == 'P') {
            Process = 'PPC';
        }else {
            Process = 'Dispatch';
        }
        payload.push({
            DespatchAdviceMaster_Code: masterCode,
            DespatchAdviceTransaction_Code: tranCode,
            QtyPc: qtyPc,
            QtyMT: qtyMT,
            QtyMTRS: qtyMTRS,
            UserMaster_Code: userMaster,
            ProcessType: Process
        });
    });

    if (!isValid) {
        return;
    }

    if (payload.length === 0) {
        toastr.error('Invalid data. Please check quantities.');
        return;
    }
    console.log("userMasterCode" + userMaster);
    VerifyDispatchPlanService.SaveDespatchAdviceQty(payload).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            GetDispatchAdvicePlanList($("#ddlStatus").val());
            CloseUpdateQtyModal();
            HideLoader();
        } else {
            toastr.error(response.Msg);
            HideLoader();
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Approved Quotation ');
    });
}
function OpenShowRemarksModal(Code) {
    $('#dvShowRemarks').modal({ backdrop: 'static' });
    $('#dvShowRemarks').modal('show');
    VerifyDispatchPlanService.GetDespatchAdeviceRemarks(Code).then(function (response) {
    if (response && response.length > 0) {
        const stringFilterColumn = [];
        const numericFilterColumn = [];
        const dateFilterColumn = [];
        const button = false;
        const showButtons = [];
        const stringDoubleFilterColumn = [];
        let hiddenColumns = [];
        if ($("#ddlStatus").val() == "M") {
            hiddenColumns = ["Marketing Remark", "PPC Remark","Dispatch Remark"];
        } else if($("#ddlStatus").val() == "P"){
            hiddenColumns = ["Remarks", "PPC Remark","Dispatch Remark"];
        }else {
            hiddenColumns = ["Remarks"];
        }
       const columnAlignment = {};

        BizsolCustomFilterGrid.CreateDataTable("table-headRemarks", "table-bodyRemarks", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
    } else {
        toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error);
        HideLoader();
    });
}
function CloseShowRemarksModal() {
    $('#dvShowRemarks').modal('hide');
}
function UpdateArea(Code, CityMaster_Code_Freight) {
    var ModuleName = "Delivery Order/Despatch Advice (GST)",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#hfAreaCode').val(Code);
            $('#dvUpdateArea').modal({ backdrop: 'static' });
            $('#dvUpdateArea').modal('show');
            BindCityMasterDropdownForArea(CityMaster_Code_Freight || 0);
        }
    });  
}
function BindCityMasterDropdownForArea(selectedCityCode) {
    var $ddl = $('#ddlAreaCity');
    if (!$ddl.length) return;

    $ddl.off('change select2:select');
    $ddl.off('select2:open select2:close');

    var options = '<option value="">-- Select City --</option>';
    Showloader();
    VerifyDispatchPlanService.GetCityMasterList('India', 'All').then(function (response) {
        HideLoader();
        (response || []).forEach(function (item) {
            var code = item.Code || item.code || 0;
            var cityName = item.CityName || item.Descp || item.cityName || '';
            if (cityName) {
                options += '<option value="' + code + '">' + cityName + '</option>';
            }
        });
        $ddl.html(options);
        if (selectedCityCode) {
            $ddl.val(selectedCityCode);
        }

        try {
            if ($.fn.select2) {
                if ($ddl.hasClass('select2-hidden-accessible')) {
                    $ddl.select2('destroy');
                }
                $ddl.select2({
                    width: '100%',
                    placeholder: '-- Select City --',
                    allowClear: true,
                    dropdownParent: $('#dvUpdateArea')
                });
                if (typeof attachSelect2ScrollPrevention === 'function') {
                    attachSelect2ScrollPrevention($ddl);
                } else {
                    function preventScroll() {
                        var scrollY = window.scrollY || window.pageYOffset;
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.position = 'fixed';
                        document.body.style.top = '-' + scrollY + 'px';
                        document.body.style.width = '100%';
                        document.body.setAttribute('data-scroll-y', scrollY);
                    }
                    function restoreScroll() {
                        var scrollY = document.body.getAttribute('data-scroll-y') || '0';
                        document.documentElement.style.overflow = '';
                        document.body.style.position = '';
                        document.body.style.top = '';
                        document.body.style.width = '';
                        window.scrollTo(0, parseInt(scrollY, 10));
                        document.body.removeAttribute('data-scroll-y');
                    }
                    $ddl.on('select2:open', preventScroll);
                    $ddl.on('select2:close', restoreScroll);
                }
            }
        } catch (e) {
            toastr.error('Error initializing select2 for City:', e);
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || error.message || 'Error loading city list.');
    });
}
function SaveArea() {
    var code = $('#hfAreaCode').val();
    var cityMaster_Code = $('#ddlAreaCity').val();
    if (!code) {
        toastr.error('Invalid record.');
        return;
    }
    if (!cityMaster_Code) {
        toastr.warning('Please select a city.');
        return;
    }
    Showloader();
    VerifyDispatchPlanService.SaveArea(code, cityMaster_Code).then(function (response) {
        HideLoader();
        if (response && (response.Status === 'Y' || response.status === 'Y')) {
            toastr.success(response.Msg || 'Area saved successfully.');
            CloseUpdateAreaModal();
            var s = $("#ddlStatus").val();
            if (s === 'T') {
                GetDispatchAdvicePlanList(s, $('#txtFromDate').val(), $('#txtToDate').val());
            } else {
                GetDispatchAdvicePlanList(s);
            }
        } else {
            toastr.error(response.Msg || 'Error saving area.');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || error.message || 'Error saving area.');
    });
}
function CloseUpdateAreaModal() {
    var $ddl = $('#ddlAreaCity');
    if ($ddl.hasClass('select2-hidden-accessible')) {
        $ddl.select2('destroy');
    }
    $('#dvUpdateArea').modal('hide');
    $('#hfAreaCode').val('');
    $ddl.empty().append('<option value="">-- Select City --</option>').val('');
}
function setCurrentDateDespatchActivity() {
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
}
function ShowDespatchActivityList(fromDate, toDate) {
    ensureStandardGridLayout();
    Showloader();
    VerifyDispatchPlanService.GetDespatchActivityReportList(fromDate, toDate).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            G_DispatchPlanlist = response;
            const stringFilterColumn = ["Created By", "Verify Marketing Parson", "Verify PPC Person", "Final Verify","Quotation Approved Name"];
            const numericFilterColumn = ["DO No","Invoice No"];
            const dateFilterColumn = ["DO Date","Invoice Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Rows"];
            const columnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            $("#dvTableDispatch").show();
            const tableHead = document.getElementById('table-head');
            if (tableHead) {
                const totalsRow = tableHead.querySelector('.totals-row');
                if (totalsRow) totalsRow.remove();
            }
            scheduleVerifyDispatchPlanTableHeightAdjust();
        } else {
            $("#dvTableDispatch").hide();
            $(".totals-row").hide();
            toastr.info('No data found for the selected date range.');
        }
    }).catch(function (error) {
        HideLoader();
        $("#dvTableDispatch").hide();
        $(".totals-row").hide();
        toastr.error(error.Msg || error.message || 'Error loading Despatch Activity Report.');
    });
}
function ShowFilteredList() {
    if ($("#ddlStatus").val() === 'TR') {
        ShowTransporterReportList();
        return;
    }
    if ($("#ddlStatus").val() === 'DR') {
        ShowDelayReportList();
        return;
    }
    if ($("#ddlStatus").val() === 'FL') {
        ShowFreightLossReportList();
        return;
    }
    if ($("#ddlStatus").val() === 'AR') {
        openApprovedTransporterDashboard();
        return;
    }
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return;
    }
    if ($("#ddlStatus").val() === 'R') {
        ShowDespatchActivityList(fromDate, toDate)
    } else {
        GetDispatchAdvicePlanList($("#ddlStatus").val(), fromDate, toDate);
    }
}

window.ViewAll = ViewAll;
window.EditQty = EditQty;
window.CloseVerifyModal = CloseVerifyModal;
window.CloseUpdateQtyModal = CloseUpdateQtyModal;
window.OpenVerifyModal = OpenVerifyModal;
window.VerifyDispatch = VerifyDispatch;
window.Verify = Verify;
window.ExportExcel = ExportExcel;
window.CloseModal = CloseModal;
window.CloseApprovedModal = CloseApprovedModal;
window.CloseUnApprovedModal = CloseUnApprovedModal;
window.SendMail = SendMail;
window.CloseTransporter = CloseTransporter;
window.TransporterList = TransporterList;
window.GetEmpCodes = GetEmpCodes;
window.updateSelected = updateSelected;
window.UpdateTransporter = UpdateTransporter;
window.SendMailToTransporter = SendMailToTransporter;
window.ApprovedQuotstion = ApprovedQuotstion;
window.UnApprovedQuotstion = UnApprovedQuotstion;
window.ApprovedTransporter = ApprovedTransporter;
window.UnApprovedTransporter = UnApprovedTransporter;
window.UpdateQty = UpdateQty;
window.OpenShowRemarksModal = OpenShowRemarksModal;
window.CloseShowRemarksModal = CloseShowRemarksModal;
window.UpdateArea = UpdateArea;
window.CloseUpdateAreaModal = CloseUpdateAreaModal;
window.SaveArea = SaveArea;
window.ShowDespatchActivityList = ShowDespatchActivityList;
window.ShowFilteredList = ShowFilteredList;

function parseTransporterReportResults(response) {
    var result1 = [];
    var result2 = [];
    if (!response) {
        return { result1: result1, result2: result2 };
    }
    if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
        var r1 = response.Result1 != null ? response.Result1 : response.result1;
        var r2 = response.Result2 != null ? response.Result2 : response.result2;
        if (Array.isArray(r1)) result1 = r1;
        if (Array.isArray(r2)) result2 = r2;
        return { result1: result1, result2: result2 };
    }
    if (Array.isArray(response) && response.length > 0) {
        var first = response[0];
        if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
            return { result1: response, result2: [] };
        }
        if (Array.isArray(first)) {
            return { result1: first, result2: [] };
        }
    }
    return { result1: result1, result2: result2 };
}

function mapNullsToEmptyStrings(rows) {
    if (!rows || !rows.length) return rows || [];
    return rows.map(function (row) {
        var out = {};
        Object.keys(row).forEach(function (k) {
            var v = row[k];
            if (v === null || v === undefined) {
                out[k] = '';
            } else if (typeof v === 'string') {
                var t = v.trim();
                if (t === '' || t.toLowerCase() === 'null') {
                    out[k] = '';
                } else {
                    out[k] = v;
                }
            } else {
                out[k] = v;
            }
        });
        return out;
    });
}

function omitTransporterHiddenExportColumns(rows) {
    var hide = ['DespatchAdviceMaster_Code', 'despatchAdviceMaster_Code'];
    return mapNullsToEmptyStrings(rows).map(function (row) {
        var o = {};
        Object.keys(row).forEach(function (k) {
            if (hide.indexOf(k) < 0) {
                o[k] = row[k];
            }
        });
        return o;
    });
}

function renameTransporterSummaryColumns(rows) {
    if (!rows || !rows.length) return rows || [];
    return rows.map(function (row) {
        var out = {};
        Object.keys(row).forEach(function (k) {
            var newKey = /^total\s*count$/i.test(String(k).trim()) ? 'Quotation Count Received' : k;
            out[newKey] = row[k];
        });
        return out;
    });
}

function getTransporterReportColumnFilters(rows) {
    if (!rows || rows.length === 0) {
        return { stringFilterColumn: [], numericFilterColumn: [], dateFilterColumn: [] };
    }
    const keys = Object.keys(rows[0]);
    const dateFilterColumn = keys.filter(function (k) { return /date/i.test(k); });
    const numericFilterColumn = keys.filter(function (k) {
        if (dateFilterColumn.indexOf(k) >= 0) return false;
        let sample = null;
        for (let i = 0; i < Math.min(rows.length, 30); i++) {
            const v = rows[i][k];
            if (v !== null && v !== undefined && v !== '') {
                sample = v;
                break;
            }
        }
        if (sample === null || sample === undefined) return false;
        const n = typeof sample === 'number' ? sample : Number(String(sample).replace(/,/g, ''));
        return !isNaN(n) && isFinite(n);
    });
    const stringFilterColumn = keys.filter(function (k) {
        return dateFilterColumn.indexOf(k) < 0 && numericFilterColumn.indexOf(k) < 0;
    });
    return { stringFilterColumn: stringFilterColumn, numericFilterColumn: numericFilterColumn, dateFilterColumn: dateFilterColumn };
}

function bindTransporterResultGrid(headId, bodyId, rows, noDataElId) {
    if (!rows || rows.length === 0) {
        $('#' + headId).empty();
        $('#' + bodyId).empty();
        $('#' + noDataElId).removeClass('d-none');
        $('#' + headId).closest('.table-wrapper').addClass('d-none');
        return;
    }
    $('#' + noDataElId).addClass('d-none');
    $('#' + headId).closest('.table-wrapper').removeClass('d-none');
    const hiddenColumns = ["DespatchAdviceMaster_Code", "despatchAdviceMaster_Code"];
    let filters = getTransporterReportColumnFilters(rows);
    filters.stringFilterColumn = filters.stringFilterColumn.filter(function (c) { return hiddenColumns.indexOf(c) < 0; });
    filters.numericFilterColumn = filters.numericFilterColumn.filter(function (c) { return hiddenColumns.indexOf(c) < 0; });
    filters.dateFilterColumn = filters.dateFilterColumn.filter(function (c) { return hiddenColumns.indexOf(c) < 0; });
    const button = false;
    const stringDoubleFilterColumn = [];
    const showButtons = [];
    const columnAlignment = {};
    BizsolCustomFilterGrid.CreateDataTable(headId, bodyId, rows, button, showButtons, filters.stringFilterColumn, filters.numericFilterColumn, filters.dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
    const tableHead = document.getElementById(headId);
    if (tableHead) {
        const totalsRow = tableHead.querySelector('.totals-row');
        if (totalsRow) totalsRow.remove();
    }
}

function ShowTransporterReportList() {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return;
    }
    Showloader();
    VerifyDispatchPlanService.GetTransporterReport(fromDate, toDate).then(function (response) {
        HideLoader();
        ensureTransporterTwinLayout();
        $('.transporter-rpt-label').eq(0).text('Transporter approved details');
        $('.transporter-rpt-label').eq(1).text('Transporter summary');
        const parsed = parseTransporterReportResults(response);
        const hasR1 = parsed.result1 && parsed.result1.length > 0;
        const hasR2 = parsed.result2 && parsed.result2.length > 0;
        if (!hasR1 && !hasR2) {
            $("#dvTableDispatch").hide();
            toastr.info('No data found for Transporter Report.');
            return;
        }
        const r1Clean = mapNullsToEmptyStrings(parsed.result1 || []);
        const r2Clean = renameTransporterSummaryColumns(mapNullsToEmptyStrings(parsed.result2 || []));
        G_DispatchPlanlist = hasR2 ? r2Clean : r1Clean;
        bindTransporterResultGrid('table-head-transporter-r1', 'table-body-transporter-r1', r1Clean, 'transporterR1NoData');
        bindTransporterResultGrid('table-head-transporter-r2', 'table-body-transporter-r2', r2Clean, 'transporterR2NoData');
        $("#dvTableDispatch").show();
        scheduleVerifyDispatchPlanTableHeightAdjust();
    }).catch(function (error) {
        HideLoader();
        $("#dvTableDispatch").hide();
        toastr.error(error.Msg || error.message || 'Error loading Transporter Report.');
    });
}

window.ShowTransporterReportList = ShowTransporterReportList;

function isDelayReportStatusColumn(colName) {
    if (!colName) return false;
    var k = String(colName);
    return /MKT\s*Status/i.test(k) || /PPC\s*Status/i.test(k);
}

function delayReportStatusPlainText(val) {
    if (val === null || val === undefined) return '';
    var s = String(val).replace(/<[^>]*>/g, ' ').trim();
    if (!s) return '';
    // Strip leading placeholder (?), Wingdings leftovers, or Unicode ballot icons
    return s.replace(/^[\?\u00FE\u00FD\u00FC\u2610\u2611\u2612\u2713\u2714\u2717\u2718\u2705\u274C\s]+/, '').trim();
}

function delayReportStatusWithIcon(val, forHtml) {
    var text = delayReportStatusPlainText(val);
    if (!text) return '';
    if (/^late/i.test(text)) {
        if (forHtml) {
            // Black square + white X (matches Excel mockup)
            return '<span class="dr-status dr-status-late">' +
                '<span class="dr-status-icon" title="Late"><i class="fa-solid fa-xmark"></i></span>' +
                '<span class="dr-status-text">' + text + '</span></span>';
        }
        return '\u2612 ' + text; // ☒ for Excel
    }
    if (/^on\s*time/i.test(text)) {
        if (forHtml) {
            // Black square + white check (matches Excel mockup)
            return '<span class="dr-status dr-status-ok">' +
                '<span class="dr-status-icon" title="On Time"><i class="fa-solid fa-check"></i></span>' +
                '<span class="dr-status-text">' + text + '</span></span>';
        }
        return '\u2611 ' + text; // ☑ for Excel
    }
    return text;
}

function decorateDelayReportStatusIcons(rows, forHtml) {
    if (!rows || !rows.length) return rows || [];
    return rows.map(function (row) {
        var o = {};
        Object.keys(row).forEach(function (k) {
            o[k] = isDelayReportStatusColumn(k) ? delayReportStatusWithIcon(row[k], forHtml) : row[k];
        });
        return o;
    });
}

function ShowDelayReportList() {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return;
    }
    Showloader();
    VerifyDispatchPlanService.GetDelayReport(fromDate, toDate).then(function (response) {
        HideLoader();
        ensureStandardGridLayout();
        const parsed = parseTransporterReportResults(response);
        const detailClean = mapNullsToEmptyStrings(parsed.result1 || []);
        const summaryRow = (parsed.result2 && parsed.result2.length > 0) ? parsed.result2[0] : null;
        if (!detailClean.length) {
            $("#dvDelayReportCards").hide();
            $("#dvTableDispatch").hide();
            toastr.info('No data found for Dispatch Delay Report.');
            return;
        }
        // Grid cells get real HTML icons (SQL "?" placeholders are replaced)
        const detailForGrid = decorateDelayReportStatusIcons(detailClean, true);
        G_DispatchPlanlist = detailForGrid;
        const filters = getTransporterReportColumnFilters(detailForGrid);
        // Status cols contain HTML — keep them out of filter dropdowns
        filters.stringFilterColumn = filters.stringFilterColumn.filter(function (c) {
            return !isDelayReportStatusColumn(c);
        });
        BizsolCustomFilterGrid.CreateDataTable('table-head', 'table-body', detailForGrid, false, [], filters.stringFilterColumn, filters.numericFilterColumn, filters.dateFilterColumn, [], [], {}, false);
        const tableHead = document.getElementById('table-head');
        if (tableHead) {
            const totalsRow = tableHead.querySelector('.totals-row');
            if (totalsRow) totalsRow.remove();
        }
        renderDelayReportCards(summaryRow, detailClean);
        $("#dvDelayReportCards").show();
        $("#dvTableDispatch").show();
        scheduleVerifyDispatchPlanTableHeightAdjust();
    }).catch(function (error) {
        HideLoader();
        $("#dvDelayReportCards").hide();
        $("#dvTableDispatch").hide();
        toastr.error(error.Msg || error.message || 'Error loading Dispatch Delay Report.');
    });
}

function delayReportToNumber(v) {
    if (v === null || v === undefined || v === '') return 0;
    var n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
}

function delayReportFormatNumber(v) {
    var n = delayReportToNumber(v);
    return (Math.round(n * 100) / 100).toString();
}

function delayReportStageFromStatus(rows, colName) {
    var on = 0, late = 0, sumDelay = 0, lateCount = 0;
    rows.forEach(function (r) {
        var v = (r[colName] === null || r[colName] === undefined) ? '' : String(r[colName]).trim();
        if (!v) return;
        if (/late/i.test(v)) {
            late++;
            var m = v.match(/(\d+)\s*Min/i);
            if (m) { sumDelay += parseInt(m[1], 10); lateCount++; }
        } else if (/on\s*time/i.test(v)) {
            on++;
        }
    });
    var total = rows.length;
    return {
        on: on,
        late: late,
        score: total > 0 ? (on * 100 / total) : 0,
        avg: lateCount > 0 ? (sumDelay / lateCount) : 0
    };
}

function delayReportDispatchFromDetail(rows) {
    var on = 0, late = 0;
    rows.forEach(function (r) {
        var t = (r['Dispatch verifyTime'] === null || r['Dispatch verifyTime'] === undefined) ? '' : String(r['Dispatch verifyTime']).trim();
        var resp = (r['Delay Responsibility'] === null || r['Delay Responsibility'] === undefined) ? '' : String(r['Delay Responsibility']);
        if (/dispatch/i.test(resp)) {
            late++;
        } else if (t) {
            on++;
        }
    });
    var total = rows.length;
    return { on: on, late: late, score: total > 0 ? (on * 100 / total) : 0, avg: 0 };
}

function delayReportSetStage(prefix, o) {
    $('#drc' + prefix + 'OnTime').text(o.on);
    $('#drc' + prefix + 'Late').text(o.late);
    $('#drc' + prefix + 'Score').text(delayReportFormatNumber(o.score) + '%');
    $('#drc' + prefix + 'Avg').text(delayReportFormatNumber(o.avg));
}

function renderDelayReportCards(summaryRow, detail) {
    var total, mkt, ppc, dsp;
    if (summaryRow) {
        total = delayReportToNumber(summaryRow['Total Indents']);
        mkt = {
            on: delayReportToNumber(summaryRow['On-Time by Marketing']),
            late: delayReportToNumber(summaryRow['Late by Marketing']),
            score: delayReportToNumber(summaryRow['Marketing Score %']),
            avg: delayReportToNumber(summaryRow['Avg. Marketing Delay'])
        };
        ppc = {
            on: delayReportToNumber(summaryRow['On-Time by PPC']),
            late: delayReportToNumber(summaryRow['Late by PPC']),
            score: delayReportToNumber(summaryRow['PPC Score %']),
            avg: delayReportToNumber(summaryRow['Avg. PPC Delay'])
        };
        dsp = {
            on: delayReportToNumber(summaryRow['On-Time by Dispatch']),
            late: delayReportToNumber(summaryRow['Late by Dispatch']),
            score: delayReportToNumber(summaryRow['Dispatch Score %']),
            avg: delayReportToNumber(summaryRow['Avg. Dispatch Delay'])
        };
    } else {
        total = detail.length;
        mkt = delayReportStageFromStatus(detail, 'MKT Status (Before 4:00 PM/16:00)');
        ppc = delayReportStageFromStatus(detail, 'PPC Status (Before 5:00 PM/17:00)');
        dsp = delayReportDispatchFromDetail(detail);
    }
    $('#drcTotalIndents').text(total);
    delayReportSetStage('Mkt', mkt);
    delayReportSetStage('Ppc', ppc);
    delayReportSetStage('Dsp', dsp);
}

window.ShowDelayReportList = ShowDelayReportList;

function normalizeFreightLossRows(response) {
    if (!response) return [];
    if (Array.isArray(response)) {
        if (response.length && Array.isArray(response[0])) return response[0];
        return response;
    }
    var parsed = parseTransporterReportResults(response);
    return parsed.result1 || [];
}

function isFreightLossQtyColumn(columnName) {
    var name = String(columnName || '').replace(/[₹()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) return false;
    return /dispatch\s*advice\s*(mt|qty)/i.test(name)
        || /^lorry\s*capacity/i.test(name)
        || /dispatch\s*qty/i.test(name)
        || /freight\s*loss\s*(mt|$)/i.test(name)
        || /freight\s*rate/i.test(name)
        || /freight\s*loss\s*amount/i.test(name);
}

function getFreightLossQtyColumns(rows) {
    var keys = (rows && rows.length) ? Object.keys(rows[0]) : [];
    var matched = keys.filter(isFreightLossQtyColumn);
    if (matched.length) return matched;
    return [
        'Dispatch advice MT',
        'Lorry capacity',
        'Dispatch Qty MT',
        'Dispatch Qty (MT)',
        'Freight Loss MT',
        'Freight Loss (MT)',
        'Freight Rate MT',
        'Freight Rate (₹/MT)',
        'Freight Loss Amount',
        'Freight Loss Amount (₹)'
    ];
}

function getFreightLossAmountColumn(rows) {
    var keys = (rows && rows.length) ? Object.keys(rows[0]) : [];
    for (var i = 0; i < keys.length; i++) {
        var name = String(keys[i] || '').replace(/[₹()]/g, ' ').replace(/\s+/g, ' ').trim();
        if (/freight\s*loss\s*amount/i.test(name)) return keys[i];
    }
    return keys.indexOf('Freight Loss Amount') >= 0 ? 'Freight Loss Amount' : '';
}

function formatFreightLossQtyValue(val) {
    if (val === null || val === undefined || val === '') return val;
    var n = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
    if (isNaN(n) || !isFinite(n)) return val;
    return n.toFixed(3);
}

function formatFreightLossQtyColumns(rows) {
    var qtyCols = getFreightLossQtyColumns(rows);
    return (rows || []).map(function (row) {
        var next = Object.assign({}, row);
        qtyCols.forEach(function (col) {
            if (Object.prototype.hasOwnProperty.call(next, col)) {
                next[col] = formatFreightLossQtyValue(next[col]);
            }
        });
        return next;
    });
}

function ShowFreightLossReportList() {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return;
    }
    Showloader();
    VerifyDispatchPlanService.GetFreightLossReport(fromDate, toDate).then(function (response) {
        HideLoader();
        ensureStandardGridLayout();
        $("#dvDelayReportCards").hide();
        var rows = formatFreightLossQtyColumns(mapNullsToEmptyStrings(normalizeFreightLossRows(response)));
        if (!rows.length) {
            $("#dvTableDispatch").hide();
            toastr.info('No data found for Freight Loss Report.');
            return;
        }
        G_DispatchPlanlist = rows;
        const filters = getTransporterReportColumnFilters(rows);
        const qtyColumns = getFreightLossQtyColumns(rows);
        const amountColumn = getFreightLossAmountColumn(rows);
        const columnAlignment = {};
        const fixedDecimalvalue = {};
        qtyColumns.forEach(function (col) {
            columnAlignment[col] = 'right';
            fixedDecimalvalue[col] = 3;
        });
        const totalColumns = amountColumn ? [amountColumn] : [];
        BizsolCustomFilterGrid.CreateDataTable(
            'table-head',
            'table-body',
            rows,
            false,
            [],
            filters.stringFilterColumn,
            filters.numericFilterColumn,
            filters.dateFilterColumn,
            [],
            [],
            columnAlignment,
            false,
            totalColumns,
            fixedDecimalvalue,
            null,
            false,
            true
        );
        const tableHead = document.getElementById('table-head');
        if (tableHead) {
            const totalsRow = tableHead.querySelector('.totals-row');
            if (totalsRow) totalsRow.remove();
        }
        $("#dvTableDispatch").show();
        scheduleVerifyDispatchPlanTableHeightAdjust();
    }).catch(function (error) {
        HideLoader();
        $("#dvTableDispatch").hide();
        toastr.error(error.Msg || error.message || 'Error loading Freight Loss Report.');
    });
}

window.ShowFreightLossReportList = ShowFreightLossReportList;

/* --- Approved Transporter Dashboard (modal + GetApprovedTransporterReport) --- */
var ATD_CHART = null;
var ATD_RAW_RESPONSE = null;
var ATD_NORMALIZED = null;
var ATD_COLORS = ['#818cf8', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#94a3b8', '#64748b', '#c084fc', '#2dd4bf'];

function closeApprovedTransporterDashboard() {
    if (ATD_CHART) {
        try {
            ATD_CHART.destroy();
        } catch (e) { /* ignore */ }
        ATD_CHART = null;
    }
    $('#dvApprovedTransporterDashboard').removeClass('show').hide();
    // Optionally, show the default view (adjust based on your needs)
    // You can add logic here to return to a specific view if needed
}

function atdPick(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
            return obj[k];
        }
    }
    return null;
}

function atdExtractArray(resp) {
    if (!resp) return [];
    if (Array.isArray(resp)) {
        if (resp.length && Array.isArray(resp[0])) return resp[0];
        return resp;
    }
    if (typeof resp !== 'object') return [];
    var order = ['QuoteStatusMatrix', 'Matrix', 'Data', 'Rows', 'Table', 'Items', 'Result1', 'result1', 'Result', 'TransporterMatrix'];
    for (var i = 0; i < order.length; i++) {
        var v = resp[order[i]];
        if (Array.isArray(v) && v.length) return v;
    }
    if (Array.isArray(resp.Result2) && resp.Result2.length) return resp.Result2;
    return [];
}

function atdExtractDeclineArray(resp) {
    if (!resp || typeof resp !== 'object') return [];
    var order = ['DeclineStats', 'DeclineTransporterStats', 'Result3', 'result3', 'DeclineMatrix'];
    for (var i = 0; i < order.length; i++) {
        var v = resp[order[i]];
        if (Array.isArray(v) && v.length) return v;
    }
    return [];
}

function atdIsGrandRow(row, nameKey) {
    var n = row && nameKey ? row[nameKey] : '';
    var s = n !== undefined && n !== null ? String(n).trim().toLowerCase() : '';
    if (/^grand|^gran|^total/i.test(s)) return true;
    if (row && (row.IsGrandTotal === true || row.isGrandTotal === true)) return true;
    return false;
}

function atdGuessNameKey(sampleRow) {
    if (!sampleRow || typeof sampleRow !== 'object') return null;
    var keys = Object.keys(sampleRow);
    var prefer = ['Transporter', 'TransporterName', 'Account Desp', 'AccountDesp', 'Transpo', 'Name', 'Account'];
    for (var p = 0; p < prefer.length; p++) {
        if (keys.indexOf(prefer[p]) >= 0) return prefer[p];
    }
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (/transporter|transpo|account|name|desp/i.test(k) && !/code|master/i.test(k)) return k;
    }
    return keys[0] || null;
}

function atdNumericKeys(row, nameKey) {
    var keys = Object.keys(row);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === nameKey) continue;
        if (/indent\s*id|^indentid$/i.test(k)) continue;
        var v = row[k];
        if (v === null || v === undefined || v === '') continue;
        var n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
        if (!isNaN(n) && isFinite(n)) out.push(k);
    }
    return out;
}

function normalizeApprovedTransporterReport(resp) {
    var indentKpi = null;
    var quoteKpi = null;
    if (resp && typeof resp === 'object' && !Array.isArray(resp)) {
        indentKpi = atdPick(resp, ['IndentIdCount', 'indentIdCount', 'TotalIndentId', 'IndentId', 'IndentCount', 'KPI_IndentId']);
        quoteKpi = atdPick(resp, ['QuoteStatusCount', 'quoteStatusCount', 'TotalQuoteStatus', 'QuoteCount', 'KPI_QuoteStatus']);
    }
    var rows = atdExtractArray(resp).map(function (r) {
        return typeof r === 'object' && r !== null ? r : {};
    });
    var declineRows = atdExtractDeclineArray(resp);
    if (!rows.length) {
        return {
            indentKpi: indentKpi,
            quoteKpi: quoteKpi,
            nameKey: null,
            valueKeys: [],
            dataRows: [],
            grandRow: null,
            declineRows: declineRows
        };
    }
    var nameKey = atdGuessNameKey(rows[0]);
    var valueKeys = atdNumericKeys(rows[0], nameKey);
    if (!valueKeys.length) {
        valueKeys = Object.keys(rows[0]).filter(function (k) {
            return k !== nameKey && k !== 'IndentId' && k !== 'Indent ID';
        });
    }
    var dataRows = [];
    var grandRow = null;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (atdIsGrandRow(row, nameKey)) {
            grandRow = row;
        } else {
            dataRows.push(row);
        }
    }
    return {
        indentKpi: indentKpi,
        quoteKpi: quoteKpi,
        nameKey: nameKey,
        valueKeys: valueKeys,
        dataRows: dataRows,
        grandRow: grandRow,
        declineRows: declineRows
    };
}

function atdFormatInt(v) {
    if (v === null || v === undefined || v === '') return '—';
    var n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    if (isNaN(n)) return String(v);
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** True for API columns that are already row totals (exclude from sum-for-chart / KPI sum). */
function atdIsTotalColumnKey(k) {
    if (k === undefined || k === null) return false;
    var s = String(k).trim().toLowerCase().replace(/\s+/g, '');
    return s === 'grandtotal' || s.indexOf('grandtotal') === 0;
}

function atdKeysForDetailSum(valueKeys) {
    if (!valueKeys || !valueKeys.length) return [];
    return valueKeys.filter(function (k) {
        return !atdIsTotalColumnKey(k);
    });
}

function atdRowTotal(row, valueKeys) {
    var keys = atdKeysForDetailSum(valueKeys);
    var t = 0;
    for (var i = 0; i < keys.length; i++) {
        var v = row[keys[i]];
        var n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
        if (isNaN(n)) continue;
        t += n;
    }
    return t;
}

function atdGetFilteredDataRows(norm) {
    if (!norm || !norm.dataRows) return [];
    var nameKey = norm.nameKey;
    var trans = ($('#atdFilterTransporter').val() || '').trim();
    var indentVal = ($('#atdFilterIndent').val() || '').trim();
    return norm.dataRows.filter(function (r) {
        if (trans) {
            var nm = nameKey ? String(r[nameKey] || '').trim() : '';
            if (nm.toLowerCase() !== trans.toLowerCase()) return false;
        }
        if (indentVal) {
            var hasIndent = r['IndentId'] !== undefined || r['Indent ID'] !== undefined;
            if (hasIndent) {
                var iv = r['IndentId'] !== undefined ? String(r['IndentId']) : String(r['Indent ID']);
                if (iv !== indentVal) return false;
            }
        }
        return true;
    });
}

function atdVisibleValueKeys(norm) {
    return norm.valueKeys || [];
}

function atdHasRowFilters() {
    var trans = ($('#atdFilterTransporter').val() || '').trim();
    var indentVal = ($('#atdFilterIndent').val() || '').trim();
    return !!(trans || indentVal);
}

function atdBuildComputedGrandRow(filteredRows, nameKey, vkeys) {
    var agg = {};
    vkeys.forEach(function (k) {
        agg[k] = 0;
    });
    filteredRows.forEach(function (r) {
        vkeys.forEach(function (k) {
            var v = r[k];
            var n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
            if (isNaN(n) || !isFinite(n)) return;
            agg[k] += n;
        });
    });
    var row = {};
    row[nameKey || 'Name'] = 'Grand Total';
    vkeys.forEach(function (k) {
        row[k] = agg[k];
    });
    return row;
}

function atdFillFilterDropdowns(norm) {
    var $t = $('#atdFilterTransporter');
    var $i = $('#atdFilterIndent');
    var nameKey = norm.nameKey;
    var prevT = $t.val();
    var prevI = $i.val();
    $t.empty().append('<option value="">All</option>');
    $i.empty().append('<option value="">All</option>');
    var names = [];
    var indents = [];
    norm.dataRows.forEach(function (r) {
        if (nameKey) {
            var n = r[nameKey];
            if (n !== undefined && n !== null && String(n).trim() !== '') names.push(String(n).trim());
        }
        if (r['IndentId'] !== undefined && r['IndentId'] !== null && String(r['IndentId']).trim() !== '') indents.push(String(r['IndentId']).trim());
        if (r['Indent ID'] !== undefined && r['Indent ID'] !== null && String(r['Indent ID']).trim() !== '') indents.push(String(r['Indent ID']).trim());
    });
    names.sort();
    indents.sort();
    var seenN = {};
    names.forEach(function (n) {
        if (seenN[n]) return;
        seenN[n] = true;
        $t.append($('<option></option>').attr('value', n).text(n));
    });
    var seenI = {};
    indents.forEach(function (n) {
        if (seenI[n]) return;
        seenI[n] = true;
        $i.append($('<option></option>').attr('value', n).text(n));
    });
    if (prevT && $t.find('option[value="' + prevT.replace(/"/g, '\\"') + '"]').length) $t.val(prevT);
    if (prevI && $i.find('option[value="' + prevI.replace(/"/g, '\\"') + '"]').length) $i.val(prevI);
    if (!$i.find('option').length || $i.find('option').length === 1) {
        $('#atdWrapIndent').addClass('d-none');
    } else {
        $('#atdWrapIndent').removeClass('d-none');
    }
}

function atdRenderKpis(norm) {
    $('#atdKpiIndent').text(atdFormatInt(norm.indentKpi));
    $('#atdKpiQuote').text(atdFormatInt(norm.quoteKpi));
    if (norm.dataRows && norm.dataRows.length && (norm.indentKpi === null || norm.indentKpi === undefined)) {
        $('#atdKpiIndent').text(atdFormatInt(norm.dataRows.length));
    }
    if (norm.dataRows && norm.dataRows.length && (norm.quoteKpi === null || norm.quoteKpi === undefined)) {
        var sum = 0;
        norm.dataRows.forEach(function (r) {
            sum += atdRowTotal(r, norm.valueKeys);
        });
        $('#atdKpiQuote').text(atdFormatInt(sum));
    }
}

function atdRenderMatrix(norm) {
    var head = document.getElementById('atdMatrixHead');
    var body = document.getElementById('atdMatrixBody');
    if (!head || !body) return;
    head.innerHTML = '';
    body.innerHTML = '';
    var nameKey = norm.nameKey || 'Name';
    var vkeys = atdVisibleValueKeys(norm);
    var filteredRows = atdGetFilteredDataRows(norm);
    var useFilteredGrand = atdHasRowFilters();
    var grandForDisplay = useFilteredGrand ? atdBuildComputedGrandRow(filteredRows, nameKey, vkeys) : norm.grandRow;
    if (!grandForDisplay && filteredRows.length) {
        grandForDisplay = atdBuildComputedGrandRow(filteredRows, nameKey, vkeys);
    }
    var hr = document.createElement('tr');
    var th0 = document.createElement('th');
    th0.className = 'atd-th-name';
    th0.textContent = nameKey.length > 18 ? nameKey.slice(0, 16) + '…' : nameKey;
    th0.title = nameKey;
    hr.appendChild(th0);
    vkeys.forEach(function (k) {
        var th = document.createElement('th');
        th.className = 'atd-th-num';
        th.textContent = k;
        th.title = k;
        hr.appendChild(th);
    });
    head.appendChild(hr);
    filteredRows.forEach(function (row) {
        var tr = document.createElement('tr');
        var td0 = document.createElement('td');
        td0.className = 'atd-text';
        td0.textContent = row[nameKey] !== undefined && row[nameKey] !== null ? String(row[nameKey]) : '';
        td0.title = td0.textContent;
        tr.appendChild(td0);
        vkeys.forEach(function (k) {
            var td = document.createElement('td');
            td.className = atdIsTotalColumnKey(k) ? 'atd-num atd-col-total' : 'atd-num';
            var v = row[k];
            td.textContent = v === undefined || v === null || v === '' ? '' : atdFormatInt(v);
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
    if (grandForDisplay) {
        var gtr = document.createElement('tr');
        gtr.className = 'atd-grand-row';
        var gtd0 = document.createElement('td');
        gtd0.className = 'atd-text';
        gtd0.textContent = grandForDisplay[nameKey] !== undefined ? String(grandForDisplay[nameKey]) : 'Grand Total';
        gtr.appendChild(gtd0);
        vkeys.forEach(function (k) {
            var td = document.createElement('td');
            td.className = atdIsTotalColumnKey(k) ? 'atd-num atd-col-total' : 'atd-num';
            var v = grandForDisplay[k];
            td.textContent = v === undefined || v === null || v === '' ? '' : atdFormatInt(v);
            gtr.appendChild(td);
        });
        body.appendChild(gtr);
    }
}

function atdRenderDecline(norm) {
    var block = document.getElementById('atdDeclineBlock');
    var dh = document.getElementById('atdDeclineHead');
    var db = document.getElementById('atdDeclineBody');
    if (!block || !dh || !db) return;
    dh.innerHTML = '';
    db.innerHTML = '';
    var rows = norm.declineRows || [];
    if (!rows.length) {
        block.classList.add('d-none');
        return;
    }
    block.classList.remove('d-none');
    var keys = Object.keys(rows[0]);
    var hr = document.createElement('tr');
    keys.forEach(function (k) {
        var th = document.createElement('th');
        th.textContent = k;
        hr.appendChild(th);
    });
    dh.appendChild(hr);
    rows.forEach(function (row) {
        var tr = document.createElement('tr');
        keys.forEach(function (k) {
            var td = document.createElement('td');
            td.textContent = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
            tr.appendChild(td);
        });
        db.appendChild(tr);
    });
}

function atdRenderCategoryLegend(vkeys) {
    var el = document.getElementById('atdCategoryLegend');
    if (!el) return;
    el.innerHTML = '';
    var keys = atdKeysForDetailSum(vkeys || []);
    keys.forEach(function (k, i) {
        var d = document.createElement('div');
        d.className = 'atd-legend-item';
        var sw = document.createElement('span');
        sw.className = 'atd-legend-swatch';
        sw.style.background = ATD_COLORS[i % ATD_COLORS.length];
        var lb = document.createElement('span');
        lb.textContent = k;
        d.appendChild(sw);
        d.appendChild(lb);
        el.appendChild(d);
    });
}

function atdPieGrandTotalKey(valueKeys) {
    if (!valueKeys) return null;
    for (var i = 0; i < valueKeys.length; i++) {
        if (atdIsTotalColumnKey(valueKeys[i])) return valueKeys[i];
    }
    return null;
}

function atdPieRowValue(row, valueKeys) {
    // Prefer Grand Total column so pie % matches the table exactly
    var gtKey = atdPieGrandTotalKey(valueKeys);
    if (gtKey && row[gtKey] !== undefined && row[gtKey] !== null && row[gtKey] !== '') {
        var g = typeof row[gtKey] === 'number' ? row[gtKey] : Number(String(row[gtKey]).replace(/,/g, ''));
        if (!isNaN(g)) return g;
    }
    return atdRowTotal(row, valueKeys);
}

function atdFormatPct(val, total) {
    if (!total) return '0.0';
    return ((val / total) * 100).toFixed(1);
}

function atdWrapPieName(name, maxCharsPerLine) {
    var words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return ['—'];
    maxCharsPerLine = maxCharsPerLine || 18;
    var lines = [];
    var cur = '';
    words.forEach(function (w) {
        var next = cur ? (cur + ' ' + w) : w;
        if (next.length > maxCharsPerLine && cur) {
            lines.push(cur);
            cur = w;
        } else {
            cur = next;
        }
    });
    if (cur) lines.push(cur);
    if (lines.length > 3) {
        lines = [lines[0], lines[1], lines.slice(2).join(' ')];
    }
    return lines;
}

/** Spread Y positions so callout labels never overlap */
function atdResolveLabelYs(items, canvasH, minGap) {
    if (!items.length) return;
    minGap = minGap || 16;
    items.sort(function (a, b) { return a.y - b.y; });
    // forward pass
    for (var i = 1; i < items.length; i++) {
        if (items[i].y - items[i - 1].y < minGap) {
            items[i].y = items[i - 1].y + minGap;
        }
    }
    // pull back if overflow bottom
    var overflow = items[items.length - 1].y - (canvasH - 8);
    if (overflow > 0) {
        for (var j = 0; j < items.length; j++) items[j].y -= overflow;
    }
    // backward pass for top clamp
    if (items[0].y < 8) items[0].y = 8;
    for (var k = 1; k < items.length; k++) {
        if (items[k].y - items[k - 1].y < minGap) {
            items[k].y = items[k - 1].y + minGap;
        }
    }
}

function atdRenderHtmlPieLegend(legEl, labels, data, colors, total) {
    if (!legEl) return;
    legEl.innerHTML = '';
    if (!labels.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'atd-pie-html-legend';
    labels.forEach(function (name, i) {
        var pct = atdFormatPct(data[i], total);
        var row = document.createElement('div');
        row.className = 'atd-pie-html-legend-item';
        var sw = document.createElement('span');
        sw.className = 'atd-pie-html-legend-swatch';
        sw.style.background = colors[i % colors.length];
        var tx = document.createElement('span');
        tx.className = 'atd-pie-html-legend-text';
        tx.textContent = name + ' (' + pct + '%)';
        tx.title = name + ' (' + pct + '%)';
        row.appendChild(sw);
        row.appendChild(tx);
        wrap.appendChild(row);
    });
    legEl.appendChild(wrap);
}

function atdRenderDonut(norm) {
    var canvas = document.getElementById('atdDonutCanvas');
    var leg = document.getElementById('atdDonutLegend');
    if (!canvas || typeof Chart === 'undefined') {
        if (leg) leg.textContent = typeof Chart === 'undefined' ? 'Chart library not loaded.' : '';
        return;
    }
    if (ATD_CHART) {
        try {
            ATD_CHART.destroy();
        } catch (e) { /* ignore */ }
        ATD_CHART = null;
    }
    var nameKey = norm.nameKey;
    var vkeys = atdVisibleValueKeys(norm);
    var filteredRows = atdGetFilteredDataRows(norm);
    var labels = [];
    var data = [];
    filteredRows.forEach(function (r) {
        var nm = nameKey ? String(r[nameKey] || '').trim() : '';
        if (!nm) nm = '—';
        var t = atdPieRowValue(r, vkeys);
        if (t > 0) {
            labels.push(nm);
            data.push(t);
        }
    });
    if (!data.length) {
        if (leg) leg.textContent = 'No numeric data for chart.';
        return;
    }
    var pieTotal = data.reduce(function (a, b) { return a + b; }, 0);
    var sliceColors = labels.map(function (_, i) { return ATD_COLORS[i % ATD_COLORS.length]; });
    var isMobile = window.innerWidth < 768;
    var isTablet = window.innerWidth < 992;
    var manySlices = labels.length > 10;
    // Always second-image style: % inside + name callouts with leader lines (no bottom legend)
    var sidePad = isMobile ? 88 : (isTablet ? 110 : (manySlices ? 130 : 150));
    var vertPad = isMobile ? 28 : (manySlices ? 44 : 36);
    var wrapChars = isMobile ? 12 : (manySlices ? 14 : 16);
    var labelFontPx = manySlices || isMobile ? 8 : 9;
    var lineH = manySlices || isMobile ? 10 : 12;
    var ctx = canvas.getContext('2d');

    // Make chart area taller automatically when there are many transporters
    var chartWrap = canvas.parentElement;
    if (chartWrap && chartWrap.classList.contains('atd-chart-wrap')) {
        var h = isMobile ? 300 : (manySlices ? Math.min(520, 320 + labels.length * 10) : 380);
        chartWrap.style.minHeight = h + 'px';
        chartWrap.style.height = h + 'px';
        chartWrap.style.maxHeight = 'none';
    }

    var pieSliceLabels = {
        id: 'pieSliceLabels',
        afterDatasetsDraw: function (chart) {
            var g = chart.ctx;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;
            var ds = chart.data.datasets[0];
            var chartLabels = chart.data.labels || [];
            var total = ds.data.reduce(function (a, b) { return a + (Number(b) || 0); }, 0);
            if (!total) return;
            var canvasW = chart.width;
            var canvasH = chart.height;
            var leftItems = [];
            var rightItems = [];

            meta.data.forEach(function (arc, i) {
                var val = Number(ds.data[i]) || 0;
                if (val <= 0) return;
                var pct = (val / total) * 100;
                var mid = (arc.startAngle + arc.endAngle) / 2;
                var cosM = Math.cos(mid);
                var sinM = Math.sin(mid);
                var pctTxt = atdFormatPct(val, total) + '%';
                var sliceColor = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor;

                // % inside slice (white)
                if (pct >= 3.5) {
                    var rIn = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.55;
                    var ix = arc.x + cosM * rIn;
                    var iy = arc.y + sinM * rIn;
                    var fontSize = pct >= 18 ? 14 : (pct >= 8 ? 12 : 10);
                    if (isMobile) fontSize = Math.max(9, fontSize - 2);
                    g.save();
                    g.textAlign = 'center';
                    g.textBaseline = 'middle';
                    g.font = '800 ' + fontSize + "px 'Segoe UI', system-ui, sans-serif";
                    g.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    g.shadowBlur = 3;
                    g.fillStyle = '#ffffff';
                    g.fillText(pctTxt, ix, iy);
                    g.restore();
                }

                var fullName = String(chartLabels[i] || '').trim() || '—';
                var nameLines = atdWrapPieName(fullName, wrapChars);
                nameLines.push('(' + pctTxt + ')');
                var item = {
                    i: i,
                    arc: arc,
                    cosM: cosM,
                    sinM: sinM,
                    nameLines: nameLines,
                    sliceColor: sliceColor,
                    y: arc.y + sinM * (arc.outerRadius + 12),
                    blockH: nameLines.length * lineH
                };
                if (cosM >= 0) rightItems.push(item);
                else leftItems.push(item);
            });

            function drawSide(items, isRight) {
                var gap = Math.max(lineH + 2, Math.min(18, Math.floor(canvasH / (items.length + 1))));
                atdResolveLabelYs(items, canvasH, gap);
                items.forEach(function (it) {
                    var arc = it.arc;
                    var x0 = arc.x + it.cosM * arc.outerRadius;
                    var y0 = arc.y + it.sinM * arc.outerRadius;
                    var x1 = arc.x + it.cosM * (arc.outerRadius + 10);
                    var y1 = arc.y + it.sinM * (arc.outerRadius + 10);
                    var x2 = isRight ? Math.min(canvasW - 8, x1 + (isMobile ? 36 : 52)) : Math.max(8, x1 - (isMobile ? 36 : 52));
                    var y2 = it.y;
                    var labelPad = 4;

                    g.save();
                    g.font = '700 ' + labelFontPx + "px 'Segoe UI', system-ui, sans-serif";
                    var maxLineW = 0;
                    it.nameLines.forEach(function (ln) {
                        maxLineW = Math.max(maxLineW, g.measureText(ln).width);
                    });
                    if (isRight && x2 + labelPad + maxLineW > canvasW - 3) {
                        x2 = Math.max(8, canvasW - 3 - maxLineW - labelPad);
                    }
                    if (!isRight && x2 - labelPad - maxLineW < 3) {
                        x2 = Math.min(canvasW - 8, 3 + maxLineW + labelPad);
                    }

                    g.strokeStyle = it.sliceColor || '#ffffff';
                    g.lineWidth = 1.4;
                    g.beginPath();
                    g.moveTo(x0, y0);
                    g.lineTo(x1, y1);
                    g.lineTo(x2, y2);
                    g.stroke();
                    g.beginPath();
                    g.fillStyle = it.sliceColor || '#ffffff';
                    g.arc(x0, y0, 2.2, 0, Math.PI * 2);
                    g.fill();

                    g.textAlign = isRight ? 'left' : 'right';
                    g.textBaseline = 'middle';
                    g.shadowColor = 'rgba(0, 0, 0, 0.9)';
                    g.shadowBlur = 2;
                    g.fillStyle = '#ffffff';
                    var startY = y2 - ((it.nameLines.length - 1) * lineH) / 2;
                    it.nameLines.forEach(function (ln, li) {
                        g.fillText(ln, x2 + (isRight ? labelPad : -labelPad), startY + li * lineH);
                    });
                    g.restore();
                });
            }

            drawSide(leftItems, false);
            drawSide(rightItems, true);
        }
    };

    ATD_CHART = new Chart(ctx, {
        type: 'pie',
        plugins: [pieSliceLabels],
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: sliceColors,
                borderWidth: 2,
                borderColor: 'rgba(15, 23, 42, 0.95)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: vertPad, bottom: vertPad, left: sidePad, right: sidePad }
            },
            color: '#ffffff',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (c) {
                            var val = typeof c.parsed === 'number' ? c.parsed : (c.raw || 0);
                            var pct = atdFormatPct(val, pieTotal);
                            return c.label + ': ' + atdFormatInt(val) + ' (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });

    // Never show bottom HTML legend list (first-image style)
    if (leg) leg.innerHTML = '';
}

function atdRenderAll() {
    if (!ATD_NORMALIZED) return;
    atdFillFilterDropdowns(ATD_NORMALIZED);
    atdRenderKpis(ATD_NORMALIZED);
    atdRenderMatrix(ATD_NORMALIZED);
    atdRenderCategoryLegend(atdVisibleValueKeys(ATD_NORMALIZED));
    atdRenderDonut(ATD_NORMALIZED);
    atdRenderDecline(ATD_NORMALIZED);
}

function openApprovedTransporterDashboard() {
    // Hide table dispatch before showing dashboard
    $('#dvTableDispatch').hide();
    $('#dvApprovedTransporterDashboard').addClass('show').show();

    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return;
    }

    Showloader();
    VerifyDispatchPlanService.GetApprovedTransporterReport(fromDate, toDate).then(function (response) {
        HideLoader();
        ATD_RAW_RESPONSE = response;
        ATD_NORMALIZED = normalizeApprovedTransporterReport(response);
        if (!ATD_NORMALIZED.dataRows.length && !ATD_NORMALIZED.grandRow && !(ATD_NORMALIZED.declineRows && ATD_NORMALIZED.declineRows.length)) {
            toastr.info('No data returned for Approved Transporter report.');
        }
        atdRenderAll();
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && error.Msg) || (error && error.message) || 'Error loading Approved Transporter report.');
    });
}

$(document).on('change', '#atdFilterTransporter, #atdFilterIndent', function () {
    if (ATD_NORMALIZED) atdRenderAll();
});

var ATD_RESIZE_TIMER = null;
$(window).on('resize', function () {
    if (!$('#dvApprovedTransporterDashboard').hasClass('show') && !$('#dvApprovedTransporterDashboard').is(':visible')) return;
    if (!ATD_NORMALIZED) return;
    clearTimeout(ATD_RESIZE_TIMER);
    ATD_RESIZE_TIMER = setTimeout(function () {
        atdRenderDonut(ATD_NORMALIZED);
    }, 200);
});

$(document).on('hidden.bs.modal', '#dvApprovedTransporterDashboard', function () {
    if (ATD_CHART) {
        try {
            ATD_CHART.destroy();
        } catch (e) { /* ignore */ }
        ATD_CHART = null;
    }
});