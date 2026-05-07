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
                "Approved On": "center"
            };

            const updatedResponse = filtered.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" ${item.Status !== 'Unverified' ? 'disabled' : ''} onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete" ${item.VerifyStatus === 'Y' ? 'disabled' : ''} onclick="DeleteData('${item.Code}',this)"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>`;

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

            BizsolCustomFilterGrid.CreateDataTable("ExpenseEntryList-header", "ExpenseEntryList-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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

window.GetExpenseEntryList = GetExpenseEntryList;
window.EditData = EditData;
window.ViewData = ViewData;
window.DeleteData = DeleteData;
window.DoExpenseEntryDelete = DoExpenseEntryDelete;
window.CloseExpenseEntrySuccessModal = CloseExpenseEntrySuccessModal;
window.closeApprovedEntriesModal = closeApprovedEntriesModal;