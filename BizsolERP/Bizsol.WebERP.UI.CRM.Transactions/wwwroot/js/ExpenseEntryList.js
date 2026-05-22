import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { ExpenseEntryLevelsApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryLevelsApprovalService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

function CheckRight(optionName) {
    const ModuleName = $('#ERPHeading').text().trim();
    const FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(ModuleName, optionName, 'Y', FinYear);
}
var G_EEL_LevelVerifyApplicable = 'N';
/** Cached list rows keyed by Code — used by approval-flow modal (avoids wrong DOM column reads). */
var G_EE_ListRowCache = {};

const Indx_Tbl = {
    Code: 0,
    PersonName: 1,
    EntryNo: 2,
    MarketingManMaster_Code: 3,
    EntryDate: 4,
    FromDate: 5,
    ToDate: 6,
    ApprovedBy: 7,
    ApprovedOn: 8,
    VerifyStatus: 9,
    Status: 10
}

$(document).ready(function () {
    $("#ERPHeading").text("Expense Entry");

    GetNestedMarketingManList();
    DatePicker();
    renderInitialEmptyExpenseTable();

    // Load config → controls approval-level UI visibility
    ExpenseEntryService.GetConfigExpenseEntryParameter()
        .then(function (cfg) {
            var row = Array.isArray(cfg) && cfg.length > 0 ? cfg[0] : (cfg || {});
            G_EEL_LevelVerifyApplicable = ((row.LevelVerifyApplicable || 'N') + '').trim().toUpperCase();
            applyEEListConfigVisibility();
        })
        .catch(function () {
            applyEEListConfigVisibility();
        });

    var urlParams = getUrlVars();

    var SalesPersonNameSave = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
    var FromDateSave = decodeURIComponent(urlParams['FromDate'] || "");
    var ToDateSave   = decodeURIComponent(urlParams['ToDate']   || "");

    if (SalesPersonNameSave) {
        $('#ddlMarketingMan').val(SalesPersonNameSave);
    }

    // URL params may arrive as dd-mm-yyyy (old format) — convert to yyyy-mm-dd for type="date"
    if (FromDateSave) {
        document.getElementById('txtFromDate').value = toIsoDateStr(FromDateSave);
    }
    if (ToDateSave) {
        document.getElementById('txtToDate').value = toIsoDateStr(ToDateSave);
    }

   $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlMarketingMan").focus();
        }
    });

      $("#btnShow").click(function () {
          var MarketingMan_Name=$("#ddlMarketingMan").val();
          var fromDate= $("#txtFromDate").val();
          var toDate= $("#txtToDate").val();

          if(fromDate==undefined|| fromDate==''){
              toastr.error('Please select valid From Date');
                return false;
          }
          if(toDate==undefined|| toDate==''){
              toastr.error('Please select valid To Date');
                return false;
          }
          if(MarketingMan_Name==undefined|| MarketingMan_Name==''){
              toastr.error('Please select Sales Person');
                return false;
          }
          

        GetExpenseEntryList();
    });
    $('#btnAddExpenseEntryHero').on('click', function () {
        CreateNew(0);
    });
     $("#btnAddExpenseEntry").click(function () {
        CreateNew(0);
    });
    
    $('#btnExpenseEntryConfig').click(function (e) {

        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseHeadMaster";

    });

    $('#eeStatCardPendingOnMe').on('click', function () {
        navigateToExpenseLevelsApproval();
    });

    // Total chip → show ALL data
    $('#eeStatCardTotal').on('click', function () {
        $('#ddlListStatus').val('ALL');
        triggerShowIfValid();
    });

    // Pending chip → filter to VerifyStatus='P' (Pending approval) only
    $('#eeStatCardPending').on('click', function () {
        $('#ddlListStatus').val('Pending');
        triggerShowIfValid();
    });

    // Approved chip → open modal with only Approved entries
    $('#eeStatCardApproved').on('click', function () {
        openApprovedEntriesModal();
    });

    $('#ddlListStatus').on('change', function () {
        triggerShowIfValid();
    });

    $('#eeBtnCancelDelete').on('click', function () {
        $('#eeDeleteConfirmBackdrop').removeClass('show');
    });
 });

function applyEEListConfigVisibility() {
    var ObjUserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
    var isAdmin = ObjUserDetails && ObjUserDetails[0] && ObjUserDetails[0].UserType === 'A';

    // Settings / config icon: always shown to admins
    if (isAdmin) {
        $('#btnExpenseEntryConfig').prop('hidden', false);
    } else {
        $('#btnExpenseEntryConfig').prop('hidden', true);
    }

    // "Pending on Me" chip: only when level-verify is enabled
    if (G_EEL_LevelVerifyApplicable === 'Y') {
        $('#eeStatCardPendingOnMe').show();
        refreshPendingOnMeCount();
    } else {
        $('#eeStatCardPendingOnMe').hide();
    }

    // Re-render list so approval-flow action button reflects config
    if ($('#ExpenseEntryList-body tr').length > 0 && !$('#ExpenseEntryList-body tr.expense-entry-empty-row').length) {
        triggerShowIfValid();
    }
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
function GetNestedMarketingManList() {
    ExpenseEntryService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            $('#ddlSalesPersonList').empty();

            let options = '<option value="ALL" selected>ALL</option>';
            let matchedPersonName = null;

            for (let i = 0; i < response.length; i++) {
                const person = response[i];
                let userMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
                // Check if UserMaster_Code matches
                if (person.Usermaster_Code == userMaster_Code) {
                    matchedPersonName = person.PersonName;
                }

                options += `<option value="${person.PersonName}">${person.PersonName}</option>`;
            }

            $('#ddlSalesPersonList').html(options);

            // Set the marketing man input or dropdown value
            var urlParams = getUrlVars();
            if (decodeURIComponent(urlParams['MarketingMan_Name'] || "") == '') {
                if (matchedPersonName) {
                    $('#ddlMarketingMan').val(matchedPersonName);
                } else {
                    $('#ddlMarketingMan').val("ALL");
                }
            }

            GetExpenseEntryList({ suppressEmptyToast: true });

        } else {
            toastr.error('No Data Found');
        }
    });
}
/**
 * Converts yyyy-mm-dd (from type="date") → dd-Mon-yyyy for the API
 * e.g. "2026-04-08" → "08-Apr-2026"
 */
function convertDateFormat(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${monthNames[parseInt(month, 10) - 1]}-${year}`;
}

/**
 * Returns the date in yyyy-mm-dd for the Levels Approval API.
 * type="date" already gives yyyy-mm-dd, so just return it as-is.
 */
function listDateToIso(yyyymmdd) {
    return (yyyymmdd || '');
}

function navigateToExpenseLevelsApproval() {
    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryLevelsApproval";
}

function triggerShowIfValid() {
    var fromDate = $("#txtFromDate").val();
    var toDate = $("#txtToDate").val();
    var MarketingMan_Name = $("#ddlMarketingMan").val();
    if (!fromDate || !toDate || !MarketingMan_Name) return;
    GetExpenseEntryList();
}

function resetStatChips() {
    $('#eeStatTotal,#eeStatPending,#eeStatApproved').text('—');
}

/**
 * Always computed from ALL raw rows (not the filtered subset) so chips
 * reflect the full period, not just what is shown.
 *   Total chip    = all rows
 *   Pending chip  = VerifyStatus 'P' → Status 'Pending' (submitted for approval, awaiting)
 *   Approved chip = VerifyStatus 'Y' → Status 'Verified' (all levels approved)
 */
function updateStatChipsFromRawRows(rows) {
    if (!rows || !rows.length) {
        resetStatChips();
        return;
    }
    var total = rows.length;
    var pending = 0;
    var approved = 0;
    rows.forEach(function (item) {
        var s = (item.Status || '').trim();
        if (s === 'Pending')  pending++;
        if (s === 'Verified') approved++;
    });
    $('#eeStatTotal').text(String(total));
    $('#eeStatPending').text(String(pending));
    $('#eeStatApproved').text(String(approved));
}

function refreshPendingOnMeCount() {
    var fd = listDateToIso($("#txtFromDate").val());
    var td = listDateToIso($("#txtToDate").val());
    if (!fd || !td) {
        $('#eeStatPendingOnMe').text('—');
        return;
    }
    ExpenseEntryLevelsApprovalService.GetPendingExpenseEntryList(fd, td, 'P')
        .then(function (data) {
            var list = Array.isArray(data) ? data : (data && (data.Data || data.data)) || [];
            if (!Array.isArray(list)) list = [];
            $('#eeStatPendingOnMe').text(list.length > 0 ? String(list.length) : '0');
        })
        .catch(function () {
            $('#eeStatPendingOnMe').text('—');
        });
}

function renderInitialEmptyExpenseTable() {
    ShowExpenseEntryListEmptyState({ mode: 'initial' });
}

/**
 * Status filter mapping:
 *   ALL           → all rows
 *   PENDING_ALL   → Unverified + Pending + Rejected  (not yet fully approved)
 *   Verified      → Verified only
 *   Unverified    → Unverified only
 *   Pending       → Pending only
 *   Rejected      → Rejected only
 */
function applyStatusFilter(rows) {
    var st = $('#ddlListStatus').val() || 'ALL';
    if (st === 'ALL') return rows || [];
    if (st === 'PENDING_ALL') {
        return (rows || []).filter(function (item) {
            var s = (item.Status || '').trim();
            return s === 'Unverified' || s === 'Pending' || s === 'Rejected';
        });
    }
    return (rows || []).filter(function (item) {
        return (item.Status || '').trim() === st;
    });
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.suppressEmptyToast] — no toastr when list is empty (e.g. first auto-load)
 */
function GetExpenseEntryList(opts){
   opts = opts || {};
   var fromDate= convertDateFormat($("#txtFromDate").val());
   var toDate= convertDateFormat($("#txtToDate").val());
   var MarketingPersonName=$("#ddlMarketingMan").val();

    ExpenseEntryService.GetExpenseEntryList(fromDate,toDate,MarketingPersonName).then(function (response) {
        var $tableCard = $("#cardExpenseEntryList");
        $tableCard.show();
        refreshPendingOnMeCount();

        var raw = Array.isArray(response) ? response : [];
        // Chips always reflect the full raw list, not just the filtered view
        updateStatChipsFromRawRows(raw);
        var filtered = applyStatusFilter(raw);

        if (filtered && filtered.length > 0) {
            const StringFilterColumn = ["Person Name"];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date","From Date","To Date","Approved On"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code","MarketingManMaster_Code","VerifyStatus"];
            const ColumnAlignment = {
                "Entry No": "right",
                "Entry Date": "center",
                "From Date": "center",
                "To Date": "center",
                "Approved On": "center",
                "Expended Amount": "right",
                "Approved Amount": "right",
                "Deduction": "right"
            };
            const totalApprovedAmount=["Approved Amount","Deduction","Expended Amount"];
            G_EE_ListRowCache = {};
            const updatedResponse = filtered.map(item => {
                G_EE_ListRowCache[item.Code] = { ...item };
                let approvalFlowBtn = '';
                if (G_EEL_LevelVerifyApplicable === 'Y') {
                    approvalFlowBtn = `<button class="btn icon-height mb-1 ee-btn-view-approval" title="View Approval Flow" onclick="ViewApprovalFlowData(${item.Code},this)"><i class="fa fa-eye"></i></button>`;
                }
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" ${item.Status !== 'Unverified' ? 'disabled' : ''} onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" ${item.VerifyStatus === 'Y' ? 'disabled' : ''} onclick="DeleteData('${item.Code}',this)"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>
                ${approvalFlowBtn}`;

                var td_StatusBtn = '';
                if (item.Status == 'Unverified') {
                    td_StatusBtn = `<button type="button" class="btn btn-secondary btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Verified') {
                    td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else if (item.Status == 'Rejected') {
                    td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light  btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                } else {
                    td_StatusBtn = `<button type="button" class="btn btn-success  btn-rounded waves-effect waves-light btn-sm"  style="cursor: not-allowed">${item.Status}</button>`;
                }
                return {
                    ...item,
                    Action: buttonsHTML,
                    Status: td_StatusBtn,
                };
            });

            BizsolCustomFilterGrid.CreateDataTable("ExpenseEntryList-header", "ExpenseEntryList-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true, totalApprovedAmount);
            $("#paginator-ExpenseEntryList").show();
        } else {
            ShowExpenseEntryListEmptyState({
                mode: raw.length > 0 ? 'filter' : 'nodata',
                suppressToast: !!opts.suppressEmptyToast
            });
        }
    }).catch(function () {
        $("#cardExpenseEntryList").show();
        resetStatChips();
        ShowExpenseEntryListEmptyState({ mode: 'error' });
    });
}

/**
 * @param {object} opt
 * @param {'initial'|'nodata'|'filter'|'error'} opt.mode
 */
function ShowExpenseEntryListEmptyState(opt) {
    opt = opt || {};
    var mode = opt.mode || 'nodata';
    const emptyRow = {
        Code: 0, "Person Name": "", "Entry No": "", MarketingManMaster_Code: 0,
        "Entry Date": "", "From Date": "", "To Date": "", "Approved By": "", "Approved On": "",
        VerifyStatus: "", "Status": "", Action: ""
    };
    const StringFilterColumn = ["Person Name"];
    const NumericFilterColumn = ["Entry No"];
    const DateFilterColumn = ["Entry Date","From Date","To Date","Approved On"];
    const hiddenColumns = ["Code","MarketingManMaster_Code","VerifyStatus"];
    const ColumnAlignment = {
        "Entry No": "right", "Entry Date": "center", "From Date": "center", "To Date": "center", "Approved On": "center"
    };
    renderTableHeader(hiddenColumns, "ExpenseEntryList-header", "ExpenseEntryList-body", Object.keys(emptyRow), false, StringFilterColumn, NumericFilterColumn, DateFilterColumn, []);
    var colCount = Object.keys(emptyRow).length;
    var innerHtml;
    if (mode === 'initial') {
        innerHtml = '<div class="ee-list-empty-inner">' +
            '<i class="fas fa-inbox" aria-hidden="true"></i>' +
            '<div class="ee-list-empty-title">No expense entries loaded yet</div>' +
            '<p class="ee-list-empty-hint">Select date range and sales person, then click <strong>Show</strong>. To add a row, click <strong>Create New Entry</strong>.</p>' +
            '</div>';
    } else if (mode === 'filter') {
        innerHtml = '<div class="ee-list-empty-inner">' +
            '<i class="fas fa-filter-circle-xmark" aria-hidden="true"></i>' +
            '<div class="ee-list-empty-title">No rows match this status</div>' +
            '<p class="ee-list-empty-hint">Try <strong>All Status</strong> or change dates, then Show again.</p>' +
            '</div>';
    } else if (mode === 'error') {
        innerHtml = '<div class="ee-list-empty-inner">' +
            '<i class="fas fa-plug-circle-xmark" aria-hidden="true"></i>' +
            '<div class="ee-list-empty-title">Could not load the list</div>' +
            '<p class="ee-list-empty-hint">Check your connection and try <strong>Show</strong> again.</p>' +
            '</div>';
    } else {
        innerHtml = '<div class="ee-list-empty-inner">' +
            '<i class="fas fa-file-circle-plus" aria-hidden="true"></i>' +
            '<div class="ee-list-empty-title">No expense entries found</div>' +
            '<p class="ee-list-empty-hint">There are no entries for this period. Use <strong>Create New Entry</strong> to add one.</p>' +
            '</div>';
    }
    $("#ExpenseEntryList-body").html(
        '<tr class="expense-entry-empty-row ee-list-empty-promo"><td colspan="' + colCount + '" class="ee-list-empty-create"><span>' + innerHtml + '</span></td></tr>'
    );
    $("#paginator-ExpenseEntryList").hide();
    if (mode === 'nodata' && !opt.suppressToast) {
        toastr.info('No expense entries for the selected criteria.');
    }
}

function EditData(Code, x) {
    CheckRight('Edit').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg);
            return;
        }
        const codes = window.btoa(Code);
        var ObjCurrRow = $(x).closest('tr');
        var Name = ObjCurrRow.find('td:eq(' + Indx_Tbl.PersonName + ')')[0].innerHTML.trim();
        var MarketingPersonName = window.btoa(Name);
        var Mode = window.btoa("Edit");
        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
    });
}
function ViewData(Code, x) {
    CheckRight('View').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg);
            return;
        }
        const codes = window.btoa(Code);
        var ObjCurrRow = $(x).closest('tr');
        var Name = ObjCurrRow.find('td:eq(' + Indx_Tbl.PersonName + ')')[0].innerHTML.trim();
        var MarketingPersonName = window.btoa(Name);
        var Mode = window.btoa("View");
        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
    });
}
function CreateNew(Code) {
    CheckRight('New').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg);
            return;
        }
        if ($("#ddlMarketingMan").val() == 'undefined' || $("#ddlMarketingMan").val() == "" || $("#ddlMarketingMan").val() == "ALL") {
            toastr.error('Please select a sales person name.');
            return;
        }
        const codes = window.btoa(Code);
        var MarketingPersonName = window.btoa($("#ddlMarketingMan").val());
        var Mode = window.btoa("New");
        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
    });
}

var G_DeleteExpenseEntryCode = 0;

function DeleteData(Code) {
    CheckRight('Edit').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg);
            return;
        }
        G_DeleteExpenseEntryCode = Code;
        $('#eeReasonForDeleteInput').val('');
        $('#eeDeleteConfirmBackdrop').addClass('show');
        setTimeout(function () { $('#eeReasonForDeleteInput').focus(); }, 150);
    });
}

function DoExpenseEntryDelete() {
    var reason = $('#eeReasonForDeleteInput').val();
    if (!reason || !reason.trim()) {
        toastr.warning("Please provide a reason for deletion.");
        $('#eeReasonForDeleteInput').focus();
        return;
    }
    ExpenseEntryService.DeleteExpenseEntryMaster(G_DeleteExpenseEntryCode, reason).then(function (response) {
        $('#eeDeleteConfirmBackdrop').removeClass('show');
        if (response && response.Status === 'Y') {
            GetExpenseEntryList();
            ShowExpenseEntrySuccessModal("Deleted Successfully!", response.Msg || "The expense entry has been permanently removed.", "fa-trash-can");
        } else {
            toastr.error((response && response.Msg) || "Failed to delete expense entry.");
        }
    }).catch(function (error) {
        toastr.error((error && error.Msg) || "Error during delete. Please try again.");
        $('#eeDeleteConfirmBackdrop').removeClass('show');
    });
}

function ShowExpenseEntrySuccessModal(title, text, iconClass) {
    $('#eeSuccessModalTitle').text(title || "Done!");
    $('#eeSuccessModalText').text(text || "Operation completed successfully.");
    $('#eeSuccessModalIcon').removeClass().addClass('fas ' + (iconClass || 'fa-circle-check'));
    $('#eeSuccessBackdrop').addClass('show');
}

function CloseExpenseEntrySuccessModal() {
    $('#eeSuccessBackdrop').removeClass('show');
}
/**
 * Accepts any of:  yyyy-mm-dd | dd-mm-yyyy | dd-Mon-yyyy
 * Always returns: yyyy-mm-dd  (required by type="date" inputs)
 */
function toIsoDateStr(raw) {
    if (!raw) return '';
    var p = raw.split('-');
    if (p.length !== 3) return raw;
    // Already yyyy-mm-dd (year part > 31)
    if (p[0].length === 4) return raw;
    // dd-mm-yyyy
    if (p[1].length === 2 && !isNaN(p[1])) return `${p[2]}-${p[1]}-${p[0]}`;
    // dd-Mon-yyyy
    var monMap = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
                   Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
    var mm = monMap[p[1]];
    if (mm) return `${p[2]}-${mm}-${p[0]}`;
    return raw;
}

/**
 * Sets default date values on the native type="date" inputs.
 * From Date = 1st of the current month, To Date = today.
 * Uses document.getElementById for reliable binding on type="date".
 */
function DatePicker() {
    var today = new Date();
    var year  = today.getFullYear();
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var day   = ('0' + today.getDate()).slice(-2);

    document.getElementById('txtFromDate').value = `${year}-${month}-01`;
    document.getElementById('txtToDate').value   = `${year}-${month}-${day}`;
}
/** Open the Approved entries modal and load data filtered to Status=Approved */
function openApprovedEntriesModal() {
    var fd = listDateToIso($("#txtFromDate").val());
    var td = listDateToIso($("#txtToDate").val());

    $('#eeApprovedModal').addClass('show');
    $('#eeApprovedModalBody').html(
        '<tr><td colspan="7" class="text-center py-3 text-muted">' +
        '<i class="fas fa-spinner fa-spin me-2"></i>Loading approved entries…</td></tr>'
    );

    ExpenseEntryLevelsApprovalService.GetPendingExpenseEntryList(fd, td, 'Y')
        .then(function (data) {
            var raw = Array.isArray(data) ? data : (data && (data.Data || data.data)) || [];
            if (!Array.isArray(raw)) raw = [];

            // Filter to only Approved entries from the response
            var list = raw.filter(function (item) {
                var st = (item.ApprovalStatus || item.Status || '').toString().trim().toLowerCase();
                return st === 'approved' || st === 'y';
            });

            if (list.length === 0) {
                $('#eeApprovedModalBody').html(
                    '<tr><td colspan="7" class="text-center py-3 text-muted">' +
                    '<i class="fas fa-inbox me-2"></i>No approved entries for this period.</td></tr>'
                );
                return;
            }

            var html = '';
            list.forEach(function (item, idx) {
                var personName    = item['Person Name'] || item.PersonName || '—';
                var entryNo       = item['Entry No'] || item.EntryNo || '—';
                var entryDate     = item['Entry Date'] || item.EntryDate || '—';
                var expendedAmt   = item['Total Expended Amount'] != null
                    ? '\u20B9' + parseFloat(item['Total Expended Amount']).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '—';
                var allowedAmt    = item['Total Allowed Amount'] != null
                    ? '\u20B9' + parseFloat(item['Total Allowed Amount']).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '—';
                html += '<tr>' +
                    '<td class="text-center">' + (idx + 1) + '</td>' +
                    '<td>' + personName + '</td>' +
                    '<td class="text-center">' + entryNo + '</td>' +
                    '<td class="text-center">' + entryDate + '</td>' +
                    '<td class="text-end">' + expendedAmt + '</td>' +
                    '<td class="text-end">' + allowedAmt + '</td>' +
                    '<td class="text-center"><span class="ee-badge-approved">Approved</span></td>' +
                    '</tr>';
            });
            $('#eeApprovedModalBody').html(html);
        })
        .catch(function () {
            $('#eeApprovedModalBody').html(
                '<tr><td colspan="7" class="text-center text-danger py-3">' +
                '<i class="fas fa-plug-circle-xmark me-2"></i>Failed to load approved entries.</td></tr>'
            );
        });
}

function closeApprovedEntriesModal() {
    $('#eeApprovedModal').removeClass('show');
}

function eeListFmtDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return String(dt.getDate()).padStart(2, '0') + '/' +
        String(dt.getMonth() + 1).padStart(2, '0') + '/' +
        dt.getFullYear();
}

function eeListFmtCurrency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function eeListEscHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function eeListGetApprovalStatus(p) {
    const raw = (p.ApprovalStatus ?? p.Status ?? p.Approval_Status ?? 'Pending').toString().trim();
    if (raw === 'N' || raw.toLowerCase() === 'pending') return 'Pending';
    if (raw === 'Y' || raw.toLowerCase() === 'approved' || raw.toLowerCase() === 'verified') return 'Approved';
    if (raw === 'R' || raw.toLowerCase() === 'rejected') return 'Rejected';
    return raw || 'Pending';
}

function eeListParseLevelDetails(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return [];
        try {
            const j = JSON.parse(t);
            if (Array.isArray(j)) return j;
            if (j && Array.isArray(j.Data)) return j.Data;
            if (j && Array.isArray(j.data)) return j.data;
            if (j && Array.isArray(j.Levels)) return j.Levels;
            if (j && Array.isArray(j.levels)) return j.levels;
            return [];
        } catch (e) { return []; }
    }
    if (typeof v === 'object' && Array.isArray(v.LevelDetails)) return v.LevelDetails;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (Array.isArray(v.Data)) return v.Data;
        if (Array.isArray(v.data)) return v.data;
        if (Array.isArray(v.Levels)) return v.Levels;
        if (Array.isArray(v.levels)) return v.levels;
    }
    return [];
}

function eeListNormalizeListResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.Data)) return data.Data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

function eeListGetExpenseMasterCode(p) {
    const c = p.Code ?? p.ExpenseEntryMaster_Code ?? p.code;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function eeListIsLevelDetailRow(row) {
    if (!row || typeof row !== 'object') return false;
    return !!(row.LevelDesc || row.LevelDesp || row.Description || row.LevelName
        || row.LevelNo || row.Level || row.ApproverName || row.UserName);
}

function eeListExtractLevelDetailsFromApi(root, master) {
    const candidates = [];
    if (Array.isArray(root)) {
        root.forEach(function (part) {
            if (Array.isArray(part) && part.length > 0 && eeListIsLevelDetailRow(part[0])) {
                candidates.push(part);
            }
        });
    }
    const data = root?.Data ?? root?.data ?? root;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        ['LevelDetails', 'ExpenseEntryApprovalLevels', 'ApprovalLevels', 'Levels', 'WorkFlow', 'ApprovalWorkFlow']
            .forEach(function (key) {
                if (data[key] != null) candidates.push(data[key]);
            });
    }
    if (master && typeof master === 'object') {
        ['LevelDetails', 'ExpenseEntryApprovalLevels', 'ApprovalLevels', 'Levels']
            .forEach(function (key) {
                if (master[key] != null) candidates.push(master[key]);
            });
    }
    for (let i = 0; i < candidates.length; i++) {
        const parsed = eeListParseLevelDetails(candidates[i]);
        if (parsed.length > 0) return parsed;
    }
    return [];
}

function eeListMergeLevelDetailsLists(fromList, fromApi) {
    const a = Array.isArray(fromList) ? fromList : [];
    const b = Array.isArray(fromApi) ? fromApi : [];
    if (!b.length) return a.slice();
    if (!a.length) return b.slice();

    const map = new Map();
    a.forEach(function (row, idx) {
        let n = eeListLevelNoFromRow(row);
        if (n < 1) n = idx + 1;
        map.set(n, { ...row });
    });
    b.forEach(function (row, idx) {
        let n = eeListLevelNoFromRow(row);
        if (n < 1) n = idx + 1;
        const prev = map.get(n) || {};
        const next = { ...prev, ...row };
        next.LevelDesc = eeListPickLevelTitle(row, n) || eeListPickLevelTitle(prev, n)
            || row.LevelDesc || prev.LevelDesc || row.LevelName || prev.LevelName || '';
        next.Remarks = eeListGetLevelRemarks(row) || eeListGetLevelRemarks(prev) || '';

        const hasApprover = function (x) { return x && String(x.ApproverName ?? x.UserName ?? '').trim() !== ''; };
        if (!hasApprover(row) && hasApprover(prev)) {
            next.ApproverName = prev.ApproverName;
            next.UserName = prev.UserName;
        }
        const hasDate = function (x) { return x && String(x.ApprovedOn ?? '').trim() !== ''; };
        if (!hasDate(row) && hasDate(prev)) {
            next.ApprovedOn = prev.ApprovedOn;
        }
        map.set(n, next);
    });
    return [...map.keys()].sort(function (x, y) { return x - y; }).map(function (k) { return map.get(k); });
}

function eeListNormalizeApprovalEntry(row) {
    if (!row || typeof row !== 'object') return null;
    const p = { ...row };
    p.LevelDetails = eeListParseLevelDetails(p.LevelDetails);
    if (!p.TotalLevels && p.LevelDetails.length > 0) {
        p.TotalLevels = p.LevelDetails.length;
    }
    return p;
}

function eeListFindApprovalEntryInList(data, code) {
    const list = eeListNormalizeListResponse(data);
    return list.find(function (row) {
        return eeListGetExpenseMasterCode(row) === code;
    }) || null;
}

/** Same LevelDetails source as ExpenseEntryLevelsApproval list cards. */
function eeListFetchApprovalMetaEntry(code) {
    const fd = listDateToIso($('#txtFromDate').val());
    const td = listDateToIso($('#txtToDate').val());
    const tryFetch = function (status) {
        return ExpenseEntryLevelsApprovalService.GetPendingExpenseEntryList(fd, td, status)
            .then(function (data) { return eeListFindApprovalEntryInList(data, code); });
    };
    return tryFetch('A')
        .then(function (hit) {
            if (hit) return eeListNormalizeApprovalEntry(hit);
            return tryFetch('Y').then(function (hitY) {
                if (hitY) return eeListNormalizeApprovalEntry(hitY);
                return tryFetch('P').then(function (hitP) {
                    return hitP ? eeListNormalizeApprovalEntry(hitP) : null;
                });
            });
        })
        .catch(function () { return null; });
}

function eeListLevelNoFromRow(r) {
    if (!r || typeof r !== 'object') return 0;
    const keys = ['LevelNo', 'Level', 'LevelOrder', 'ApprovalLevelNo', 'Level_No', 'LevelIndex',
        'SrNo', 'SNo', 'Sequence', 'OrderNo', 'RowNo', 'LineNo'];
    for (let i = 0; i < keys.length; i++) {
        const v = r[keys[i]];
        if (v == null || v === '') continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

function eeListGetLevelRowByStep(levels, stepIndex) {
    const arr = Array.isArray(levels) ? levels : [];
    const hit = arr.find(function (l) { return eeListLevelNoFromRow(l) === stepIndex; });
    if (hit) return hit;
    if (stepIndex >= 1 && stepIndex <= arr.length) return arr[stepIndex - 1];
    return null;
}

function eeListPickLevelTitle(lvlInfo, levelNo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return 'Level ' + levelNo;
    const t = lvlInfo.Description ?? lvlInfo.LevelDesc ?? lvlInfo.LevelDesp
        ?? lvlInfo.LevelName ?? lvlInfo.LevelDescription;
    const s = t != null ? String(t).trim() : '';
    return s || ('Level ' + levelNo);
}

function eeListGetLevelRemarks(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const r = lvlInfo.Remarks ?? lvlInfo.Remark ?? lvlInfo.ApprovalRemarks
        ?? lvlInfo.LevelRemarks ?? lvlInfo.Comments ?? lvlInfo.RejectionRemarks;
    return r != null ? String(r).trim() : '';
}

function eeListNumFromRow(row, keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const v = row[arr[i]];
        if (v != null && v !== '') {
            const n = parseFloat(String(v).replace(/,/g, ''));
            if (!isNaN(n)) return n;
        }
    }
    return 0;
}

function eeListSumDetailLines(lines, keys) {
    return (lines || []).reduce(function (sum, row) {
        return sum + eeListNumFromRow(row, keys);
    }, 0);
}

function eeListGetExpendedAmount(entry, lines) {
    const keys = ['Expended Amount', 'ExpendedAmount', 'Total Expended Amount', 'Total Amount', 'TotalAmount'];
    for (let i = 0; i < keys.length; i++) {
        const n = eeListNumFromRow(entry, keys[i]);
        if (n !== 0) return n;
    }
    return eeListSumDetailLines(lines, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
}

function eeListGetApprovedAmount(entry, lines) {
    const keys = ['Approved Amount', 'ApprovedAmount', 'Total Approved Amount'];
    for (let i = 0; i < keys.length; i++) {
        const n = eeListNumFromRow(entry, keys[i]);
        if (n !== 0) return n;
    }
    return eeListSumDetailLines(lines, ['Approved Amount', 'Approved', 'ApprovedAmount']);
}

function eeListGetDeduction(entry, lines) {
    const n = eeListNumFromRow(entry, ['Deduction', 'Total Deduction', 'DeductionAmount']);
    if (n !== 0) return n;
    const exp = eeListGetExpendedAmount(entry, lines);
    const appr = eeListGetApprovedAmount(entry, lines);
    if (exp > 0 && appr >= 0 && exp > appr) return exp - appr;
    return 0;
}

function eeListGetListStatus(entry) {
    const s = (entry._listStatus ?? entry.Status ?? '').toString().trim();
    if (s && s.indexOf('<') === -1) return s;
    return eeListGetApprovalStatus(entry);
}

function eeListDisplayApprovedBy(raw) {
    if (raw == null || raw === '' || raw === '—') return '—';
    const s = String(raw).trim();
    if (/^\d+$/.test(s)) return '—';
    return s;
}

function eeListDisplayDate(raw) {
    if (raw == null || raw === '' || raw === '—') return '—';
    const s = String(raw).trim();
    if (/^\d+$/.test(s)) return '—';
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const p = s.split('-');
        return p[0] + '/' + p[1] + '/' + p[2];
    }
    const formatted = eeListFmtDateDisplay(s);
    return formatted || s;
}

function eeListRestoreListFields(p, listSnapshot) {
    if (!listSnapshot || typeof listSnapshot !== 'object') return p;
    const textFields = ['Person Name', 'Entry No', 'Entry Date', 'From Date', 'To Date', 'Approved By', 'Approved On'];
    textFields.forEach(function (key) {
        const listVal = listSnapshot[key];
        const apiVal = p[key];
        if (listVal != null && String(listVal).trim() !== '' &&
            (apiVal == null || String(apiVal).trim() === '' || (key === 'Approved By' && /^\d+$/.test(String(apiVal).trim())))) {
            p[key] = listVal;
        }
    });
    const amountFields = ['Expended Amount', 'Approved Amount', 'Deduction'];
    amountFields.forEach(function (key) {
        const listNum = eeListNumFromRow(listSnapshot, key);
        const apiNum = eeListNumFromRow(p, key);
        if (listNum !== 0 && apiNum === 0) p[key] = listSnapshot[key];
    });
    if (listSnapshot._listStatus) p._listStatus = listSnapshot._listStatus;
    const listLevels = eeListParseLevelDetails(listSnapshot.LevelDetails);
    const apiLevels = eeListParseLevelDetails(p.LevelDetails);
    if (listLevels.length > 0) {
        p.LevelDetails = eeListMergeLevelDetailsLists(listLevels, apiLevels);
        if (!p.TotalLevels) p.TotalLevels = listLevels.length;
    }
    ['CurrentLevelNo', 'CurrentLevel', 'TotalLevels', 'MaxLevel', 'CurrentLevelDesc', 'ApprovalStatus']
        .forEach(function (key) {
            const listVal = listSnapshot[key];
            const apiVal = p[key];
            if (listVal != null && listVal !== '' && (apiVal == null || apiVal === '' || apiVal === 0)) {
                p[key] = listVal;
            }
        });
    return p;
}

function eeListMergeDetailIntoEntry(root, baseEntry) {
    const listSnapshot = { ...baseEntry };
    const p = { ...baseEntry };
    const fromList = eeListParseLevelDetails(baseEntry.LevelDetails);

    if (Array.isArray(root)) {
        p._detailLines = root;
        p.LevelDetails = fromList.length ? fromList.slice() : [];
        return eeListRestoreListFields(p, listSnapshot);
    }
    const data = root?.Data ?? root?.data ?? root;
    if (!data || typeof data !== 'object') {
        p.LevelDetails = fromList.length ? fromList.slice() : eeListParseLevelDetails(p.LevelDetails);
        return eeListRestoreListFields(p, listSnapshot);
    }
    if (Array.isArray(data)) {
        p._detailLines = data;
        p.LevelDetails = fromList.length ? fromList.slice() : [];
        return eeListRestoreListFields(p, listSnapshot);
    }

    const master = data.ExpenseEntryMaster?.[0] ?? data.ExpenseEntryMaster ?? data.Master ?? data;
    if (master && typeof master === 'object') Object.assign(p, master);

    const fromApi = eeListExtractLevelDetailsFromApi(root, master);
    p.LevelDetails = eeListMergeLevelDetailsLists(fromList, fromApi.length ? fromApi : eeListParseLevelDetails(p.LevelDetails));

    const lines = data.ExpenseEntryDetails ?? data.ExpenseEntryDetail ?? data.Details ?? data.Items ?? data.Lines;
    if (Array.isArray(lines)) p._detailLines = lines;

    if (!p.TotalLevels && p.LevelDetails.length > 0) p.TotalLevels = p.LevelDetails.length;
    return eeListRestoreListFields(p, listSnapshot);
}

function eeListExtractDetailLines(root) {
    let lines = [];
    if (Array.isArray(root)) {
        lines = root;
    } else {
        const data = root?.Data ?? root?.data ?? root;
        if (!data) return [];
        if (Array.isArray(data)) lines = data;
        else if (typeof data === 'object') {
            const raw = data.ExpenseEntryDetails ?? data.ExpenseEntryDetail ?? data.Details ?? data.Items ?? data.Lines;
            lines = Array.isArray(raw) ? raw : [];
        }
    }
    return lines.filter(function (row) {
        if (!row || typeof row !== 'object') return false;
        const hasHead = !!(row['Expense Head'] ?? row.ExpenseHead ?? row.ExpenseDesp);
        const exp = row['Expense Amount'] ?? row.ExpendedAmount ?? row['Expended Amount'];
        return hasHead || (exp != null && exp !== '' && parseFloat(exp) > 0);
    });
}

function eeListGetFlowStatus(entry) {
    const listSt = (entry._listStatus || '').toString().trim().toLowerCase();
    if (listSt === 'verified' || listSt === 'approved') return 'approved';
    if (listSt === 'rejected') return 'rejected';
    if (listSt === 'pending') return 'pending';
    return eeListGetApprovalStatus(entry).toLowerCase();
}

function BuildEeListApprovalStepper(entry) {
    const levels = eeListParseLevelDetails(entry.LevelDetails);
    const totalLvl = Math.max(
        parseInt(entry.TotalLevels ?? entry.MaxLevel ?? 0, 10) || 0,
        levels.length
    );
    if (totalLvl === 0) {
        return '<div class="gpa-level-stepper-wrap">' +
            '<div class="gpa-level-stepper-title"><i class="fa fa-layer-group me-1"></i>Approval Flow</div>' +
            '<div class="text-center py-3 text-muted" style="font-size:0.85rem;">No approval flow configured for this entry.</div>' +
            '</div>';
    }

    const curLvlNo = parseInt(entry.CurrentLevelNo ?? entry.CurrentLevel ?? 1, 10) || 1;
    const st = eeListGetFlowStatus(entry);

    let html = '<div class="gpa-level-stepper-wrap">' +
        '<div class="gpa-level-stepper-title"><i class="fa fa-layer-group me-1"></i>Approval Flow</div>' +
        '<div class="gpa-detail-stepper">';

    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = eeListGetLevelRowByStep(levels, i) || {};
        let stepState;
        if (st === 'approved' || i < curLvlNo) stepState = 'done';
        else if (i === curLvlNo) stepState = st === 'rejected' ? 'rejected' : 'active';
        else stepState = 'pending';

        let lvlNameRaw = eeListPickLevelTitle(lvlInfo, i);
        if (!lvlNameRaw && i === curLvlNo) {
            lvlNameRaw = String(entry.CurrentLevelDesc ?? '').trim();
        }
        if (!lvlNameRaw) {
            lvlNameRaw = i === curLvlNo
                ? (String(entry.CurrentLevelDesc ?? '').trim() || ('Level ' + i))
                : ('Level ' + i);
        }

        const approver = eeListEscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? eeListFmtDateDisplay(lvlInfo.ApprovedOn) : '';
        const lvlRemarksRaw = eeListGetLevelRemarks(lvlInfo);
        let remarksHtml = '';
        if (lvlRemarksRaw && (stepState === 'done' || stepState === 'rejected')) {
            remarksHtml = '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + eeListEscHtml(lvlRemarksRaw) + '</div>';
        }

        const iconHtml = stepState === 'done' ? '<i class="fa fa-check"></i>'
            : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                : stepState === 'active' ? '<i class="fa fa-hourglass-half"></i>'
                    : i;

        const badgeLabel = stepState === 'done' ? 'Approved'
            : stepState === 'rejected' ? 'Rejected'
                : stepState === 'active' ? 'Pending'
                    : 'Waiting';

        const approverHtml = approver
            ? '<div class="gpa-dstep-sub"><i class="fa fa-user me-1"></i>' + approver +
            (approvedOn ? ' &mdash; ' + approvedOn : '') + '</div>'
            : '';

        const lineClass = stepState === 'done' ? 'gpa-dstep-line-done' : 'gpa-dstep-line-pending';

        html += '<div class="gpa-dstep-item gpa-dstep-' + stepState + '">' +
            '<div class="gpa-dstep-circle">' + iconHtml + '</div>' +
            '<div class="gpa-dstep-body">' +
            '<div class="gpa-dstep-title">' + eeListEscHtml(lvlNameRaw) + '</div>' +
            approverHtml +
            remarksHtml +
            '<div class="gpa-dstep-badge gpa-dstep-badge-' + stepState + '">' + badgeLabel + '</div>' +
            '</div>' +
            '</div>';

        if (i < totalLvl) {
            html += '<div class="gpa-dstep-line ' + lineClass + '"></div>';
        }
    }

    html += '</div></div>';
    return html;
}

function eeListBuildDetailRowsHtml(items) {
    if (!items || items.length === 0) {
        return '<tr><td colspan="6" class="text-center py-3 text-muted">No expense lines found.</td></tr>';
    }
    let rows = '';
    items.forEach(function (row, idx) {
        const head = eeListEscHtml(row['Expense Head'] ?? row.ExpenseHead ?? row.ExpenseDesp ?? '—');
        const allowAmt = eeListFmtCurrency(row['Allow Amount'] ?? row['Allowed Amount'] ?? row.AllowAmount ?? 0);
        const expAmt = eeListFmtCurrency(row['Expense Amount'] ?? row.ExpendedAmount ?? row['Expended Amount'] ?? 0);
        const apprAmt = eeListFmtCurrency(row['Approved Amount'] ?? row.Approved ?? row.ApprovedAmount ?? 0);
        const rem = eeListEscHtml(row.Remarks ?? row['Remarks'] ?? row.Description ?? '');
        rows += '<tr>' +
            '<td class="text-center">' + (idx + 1) + '</td>' +
            '<td>' + head + '</td>' +
            '<td class="text-end">' + allowAmt + '</td>' +
            '<td class="text-end">' + expAmt + '</td>' +
            '<td class="text-end">' + apprAmt + '</td>' +
            '<td>' + rem + '</td>' +
            '</tr>';
    });
    return rows;
}

function renderExpenseEntryApprovalFlowModal(entry, detailLines) {
    const person = eeListEscHtml(entry['Person Name'] ?? entry.PersonName ?? '—');
    const entryNo = eeListEscHtml(entry['Entry No'] ?? entry.EntryNo ?? '—');
    const entryDate = eeListEscHtml(eeListDisplayDate(entry['Entry Date'] ?? entry.EntryDate));
    const fromDate = eeListEscHtml(eeListDisplayDate(entry['From Date'] ?? entry.FromDate));
    const toDate = eeListEscHtml(eeListDisplayDate(entry['To Date'] ?? entry.ToDate));
    const expendedAmt = eeListFmtCurrency(eeListGetExpendedAmount(entry, detailLines));
    const approvedAmt = eeListFmtCurrency(eeListGetApprovedAmount(entry, detailLines));
    const deduction = eeListFmtCurrency(eeListGetDeduction(entry, detailLines));
    const status = eeListEscHtml(eeListGetListStatus(entry));
    const approvedBy = eeListEscHtml(eeListDisplayApprovedBy(entry['Approved By'] ?? entry.ApprovedBy));
    const approvedOn = eeListEscHtml(eeListDisplayDate(entry['Approved On'] ?? entry.ApprovedOn));

    $('#eeApprovalFlowModalBody').html(
        '<div class="row g-2 mb-3">' +
            '<div class="col-md-6">' +
                '<table class="table table-sm table-borderless">' +
                    '<tr><td class="fw-bold" style="width:45%">Entry Number</td><td>' + entryNo + '</td></tr>' +
                    '<tr><td class="fw-bold">Person Name</td><td>' + person + '</td></tr>' +
                    '<tr><td class="fw-bold">Entry Date</td><td>' + entryDate + '</td></tr>' +
                    '<tr><td class="fw-bold">From Date</td><td>' + fromDate + '</td></tr>' +
                    '<tr><td class="fw-bold">To Date</td><td>' + toDate + '</td></tr>' +
                '</table>' +
            '</div>' +
            '<div class="col-md-6">' +
                '<table class="table table-sm table-borderless">' +
                    '<tr><td class="fw-bold" style="width:45%">Expended Amount</td><td class="text-end">' + expendedAmt + '</td></tr>' +
                    '<tr><td class="fw-bold">Approved Amount</td><td class="text-end">' + approvedAmt + '</td></tr>' +
                    '<tr><td class="fw-bold">Deduction</td><td class="text-end">' + deduction + '</td></tr>' +
                    '<tr><td class="fw-bold">Status</td><td>' + status + '</td></tr>' +
                    '<tr><td class="fw-bold">Approved By</td><td>' + approvedBy + '</td></tr>' +
                    '<tr><td class="fw-bold">Approved On</td><td>' + approvedOn + '</td></tr>' +
                '</table>' +
            '</div>' +
        '</div>' +
        BuildEeListApprovalStepper(entry) +
        '<div class="table-responsive">' +
            '<table class="table table-sm table-bordered">' +
                '<thead style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;">' +
                    '<tr>' +
                        '<th class="text-center">#</th>' +
                        '<th>Expense Head</th>' +
                        '<th class="text-end">Allow Amount</th>' +
                        '<th class="text-end">Expended</th>' +
                        '<th class="text-end">Approved</th>' +
                        '<th>Remarks</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' + eeListBuildDetailRowsHtml(detailLines) + '</tbody>' +
            '</table>' +
        '</div>'
    );
}

function ViewApprovalFlowData(Code, x) {
    CheckRight('View').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg);
            return;
        }
        const code = parseInt(Code, 10);
        if (!Number.isFinite(code) || code <= 0) return;

        const cached = G_EE_ListRowCache[code] || {};
        const baseEntry = {
            ...cached,
            Code: code,
            _listStatus: cached.Status || ''
        };

        $('#eeApprovalFlowModalTitle').html('<i class="fa fa-file-invoice-dollar me-2"></i>Expense Entry Details');
        $('#eeApprovalFlowModalBody').html(
            '<div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading approval flow…</div>'
        );
        $('#eeApprovalFlowModal').modal({ backdrop: 'static' });
        $('#eeApprovalFlowModal').modal('show');

        ExpenseEntryLevelsApprovalService.GetExpenseEntryApprovalDetail(code)
            .then(function (res) {
                return eeListFetchApprovalMetaEntry(code).then(function (approvalMeta) {
                    const metaEntry = approvalMeta || {};
                    const baseWithMeta = {
                        ...baseEntry,
                        ...metaEntry,
                        Code: code,
                        _listStatus: baseEntry._listStatus || metaEntry.Status || metaEntry.ApprovalStatus || ''
                    };
                    if (metaEntry.LevelDetails && metaEntry.LevelDetails.length) {
                        baseWithMeta.LevelDetails = metaEntry.LevelDetails;
                    }
                    const entry = eeListMergeDetailIntoEntry(res, baseWithMeta);
                    const detailLines = eeListExtractDetailLines(res);
                    renderExpenseEntryApprovalFlowModal(entry, detailLines);
                });
            })
            .catch(function () {
                $('#eeApprovalFlowModalBody').html(
                    '<div class="text-center py-4 text-danger"><i class="fa fa-exclamation-triangle me-2"></i>Failed to load approval flow.</div>'
                );
            });
    });
}

function closeExpenseEntryApprovalFlowModal() {
    $('#eeApprovalFlowModal').modal('hide');
}

window.GetExpenseEntryList = GetExpenseEntryList;
window.EditData = EditData;
window.ViewData = ViewData;
window.DeleteData = DeleteData;
window.DoExpenseEntryDelete = DoExpenseEntryDelete;
window.CloseExpenseEntrySuccessModal = CloseExpenseEntrySuccessModal;
window.closeApprovedEntriesModal = closeApprovedEntriesModal;
window.ViewApprovalFlowData = ViewApprovalFlowData;
window.closeExpenseEntryApprovalFlowModal = closeExpenseEntryApprovalFlowModal;