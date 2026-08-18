import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { ExpenseEntryLevelsApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryLevelsApprovalService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
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
/** Detail lines for the open approval-flow modal — used by line history lookup. */
var G_EE_ListHistoryContext = { detailLines: [], masterCode: 0 };
/** API-reconciled HasAttach flags (master + detail-line docs), keyed by ExpenseEntryMaster.Code. */
var G_EE_ListAttachmentYesMap = {};
const EE_SALES_PERSON_MAX_RETRIES = 4;
const EE_SALES_PERSON_RETRY_DELAY_MS = 600;

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

    DatePicker();
    renderInitialEmptyExpenseTable();

    /** Reload list after attachment save/delete so paperclip green/blue updates (PO Store pattern). */
    document.addEventListener('bizsol:attachmentcontrol:changed', function (ev) {
        const d = ev && ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== 'ExpenseEntryMaster') return;
        if (typeof GetExpenseEntryList !== 'function') return;
        if (!document.getElementById('ExpenseEntryList-body')) return;
        GetExpenseEntryList({ suppressEmptyToast: true });
    });

    var urlParams = getUrlVars();
    var FromDateSave = decodeURIComponent(urlParams['FromDate'] || "");
    var ToDateSave   = decodeURIComponent(urlParams['ToDate']   || "");

    // URL params may arrive as dd-mm-yyyy (old format) — convert to yyyy-mm-dd for type="date"
    if (FromDateSave) {
        document.getElementById('txtFromDate').value = toIsoDateStr(FromDateSave);
    }
    if (ToDateSave) {
        document.getElementById('txtToDate').value = toIsoDateStr(ToDateSave);
    }

    GetNestedMarketingManList();

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

    $('#ddlMarketingMan').on('change', function () {
        triggerShowIfValid();
    });

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
    var query = window.location.href.indexOf('?');
    if (query < 0) return vars;
    var hashes = window.location.href.slice(query + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function isAuthKeyReady() {
    try {
        var authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return !!(authKey && authKey.UserMaster_Code != null && authKey.UserMaster_Code !== '');
    } catch (e) {
        return false;
    }
}

function getAuthUserMasterCode() {
    try {
        var authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return authKey ? authKey.UserMaster_Code : null;
    } catch (e) {
        return null;
    }
}

function normalizeApiList(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.Data)) return response.Data;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
}

/** URL may carry plain encoded text (back from detail) or base64 (navigation links). */
function resolveMarketingManNameFromUrl() {
    var raw = (getUrlVars()['MarketingMan_Name'] || '').trim();
    if (!raw) return '';
    try {
        raw = decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim();
    } catch (e) { /* keep raw */ }
    if (!raw) return '';
    try {
        var decoded = atob(raw);
        if (decoded && decoded.trim()) return decoded.trim();
    } catch (e) { /* plain text */ }
    return raw;
}

function eeEscHtmlAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function bindSalesPersonValue(matchedPersonName, urlPersonName, personNames) {
    var preferred = (urlPersonName || '').trim();
    var fallback = (matchedPersonName || 'ALL').trim();
    var bound = '';

    if (preferred && personNames.indexOf(preferred) >= 0) {
        bound = preferred;
    } else if (fallback === 'ALL' || personNames.indexOf(fallback) >= 0) {
        bound = fallback;
    } else if (personNames.length > 0) {
        bound = personNames[0];
    }

    if (bound) {
        $('#ddlMarketingMan').val(bound);
    }
    return bound;
}

function loadExpenseListWhenSalesPersonReady(opts) {
    var person = ($('#ddlMarketingMan').val() || '').trim();
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!person || !fromDate || !toDate) return;
    GetExpenseEntryList(opts || { suppressEmptyToast: true });
}

function GetNestedMarketingManList(attempt) {
    attempt = attempt || 0;

    if (!isAuthKeyReady()) {
        if (attempt < EE_SALES_PERSON_MAX_RETRIES) {
            setTimeout(function () {
                GetNestedMarketingManList(attempt + 1);
            }, EE_SALES_PERSON_RETRY_DELAY_MS);
        } else {
            toastr.error('Unable to load sales person list. Please refresh the page.');
        }
        return;
    }

    ExpenseEntryService.GetNestedMarketingManList().then(function (response) {
        var rows = normalizeApiList(response);
        if (!rows.length) {
            if (attempt < EE_SALES_PERSON_MAX_RETRIES) {
                setTimeout(function () {
                    GetNestedMarketingManList(attempt + 1);
                }, EE_SALES_PERSON_RETRY_DELAY_MS);
            } else {
                toastr.error('No Data Found');
            }
            return;
        }

        var userMaster_Code = getAuthUserMasterCode();
        var matchedPersonName = null;
        var personNames = [];
        var options = '<option value="ALL">ALL</option>';

        for (var i = 0; i < rows.length; i++) {
            var person = rows[i];
            if (!person || !person.PersonName) continue;

            var personName = String(person.PersonName).trim();
            personNames.push(personName);

            var userCode = person.Usermaster_Code != null ? person.Usermaster_Code : person.UserMaster_Code;
            if (userMaster_Code != null && userCode == userMaster_Code) {
                matchedPersonName = personName;
            }

            options += '<option value="' + eeEscHtmlAttr(personName) + '">' + eeEscHtmlAttr(personName) + '</option>';
        }

        $('#ddlSalesPersonList').empty().html(options);

        var urlPersonName = resolveMarketingManNameFromUrl();
        bindSalesPersonValue(matchedPersonName, urlPersonName, personNames);
        loadExpenseListWhenSalesPersonReady({ suppressEmptyToast: true });

    }).catch(function () {
        if (attempt < EE_SALES_PERSON_MAX_RETRIES) {
            setTimeout(function () {
                GetNestedMarketingManList(attempt + 1);
            }, EE_SALES_PERSON_RETRY_DELAY_MS);
        } else {
            toastr.error('Error loading sales person list.');
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
            const DateFilterColumn = ["Entry Date","From Date","To Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code","MarketingManMaster_Code","VerifyStatus","Approved By","Approved On","HasAttach","HasAttachment"];
            const ColumnAlignment = {
                "Entry No": "right",
                "Entry Date": "center",
                "From Date": "center",
                "To Date": "center",
                "Total Days": "right",
                "Allow Amount": "right",
                "Expended Amount": "right",
                "Approved Amount": "right",
                "Deduction": "right"
            };
            const totalApprovedAmount=["Allow Amount","Approved Amount","Deduction","Expended Amount"];
            G_EE_ListRowCache = {};

            eeListSyncListAttachmentStates(filtered).then(function () {
                const updatedResponse = filtered.map(item => {
                    G_EE_ListRowCache[item.Code] = { ...item };
                    const statusText = (item.Status || '').trim();
                    const entryNo = item['Entry No'] != null ? String(item['Entry No']) : '';
                    const entryDateIso = eeListEntryDateParamForAttachmentControl(item['Entry Date'] ?? item.EntryDate);
                    const hasAttach = eeListHasAttachmentYes(item);
                    const attachBg = hasAttach
                        ? 'linear-gradient(135deg,#16a34a,#15803d)'
                        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
                    let approvalFlowBtn = '';
                    if (G_EEL_LevelVerifyApplicable === 'Y' || (statusText && statusText !== 'Unverified')) {
                        approvalFlowBtn = `<button class="btn icon-height mb-1 ms-1 ee-btn-view-approval" title="View Approval Flow" onclick="ViewApprovalFlowData(${item.Code},this)"><i class="fa fa-layer-group"></i></button>`;
                    }
                    let buttonsHTML = `<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>
                <button class="btn btn-primary icon-height mb-1 ms-1" title="Edit" ${statusText !== 'Unverified' ? 'disabled' : ''} onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1 ms-1" title="Delete" ${item.VerifyStatus === 'Y' ? 'disabled' : ''} onclick="DeleteData('${item.Code}',this)"><i class="fa fa-times"></i></button>
                <button class="btn btn-secondary icon-height mb-1 ms-1" title="Print Preview" onclick="PrintExpenseEntry(${item.Code},'preview')"><i class="fa fa-search-plus"></i></button>
                <button class="btn btn-dark icon-height mb-1 ms-1" title="Print" onclick="PrintExpenseEntry(${item.Code},'print')"><i class="fa fa-print"></i></button>
                <button class="btn icon-height mb-1 ms-1" title="Attachments" style="background:${attachBg};color:#fff;border:none;" onclick="openEEListAttachmentControl(${item.Code},'${eeEscHtmlAttr(entryNo)}','${eeEscHtmlAttr(entryDateIso)}')"><i class="fa fa-paperclip"></i></button>
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
            });
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
    CheckRight('Delete').then(function (respCheck) {
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
    const delPk = parseInt(G_DeleteExpenseEntryCode, 10) || 0;
    ExpenseEntryService.DeleteExpenseEntryMaster(G_DeleteExpenseEntryCode, reason).then(function (response) {
        $('#eeDeleteConfirmBackdrop').removeClass('show');
        if (response && response.Status === 'Y') {
            if (delPk > 0) {
                AttachmentControlService.DeleteAllAttachment('ExpenseEntryMaster', delPk, '', 0).catch(function () { /* best-effort */ });
            }
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

function eeListNormalizeApprovalFlowResponse(data, code) {
    if (data == null) return null;
    if (Array.isArray(data)) {
        const hit = data.find(function (row) { return eeListGetExpenseMasterCode(row) === code; });
        return eeListNormalizeApprovalEntry(hit || data[0] || null);
    }
    if (typeof data === 'object') {
        const nested = data.Data ?? data.data ?? data.Result ?? data.result;
        if (nested != null && nested !== data) {
            return eeListNormalizeApprovalFlowResponse(nested, code);
        }
        return eeListNormalizeApprovalEntry(data);
    }
    return null;
}

function eeListFetchApprovalMetaFromPendingList(code) {
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

/** LevelDetails for approval-flow modal — visible to all users, not only approvers/admins. */
function eeListFetchApprovalMetaEntry(code) {
    return ExpenseEntryLevelsApprovalService.GetExpenseEntryApprovalFlow(code)
        .then(function (data) {
            const row = eeListNormalizeApprovalFlowResponse(data, code);
            if (row && eeListParseLevelDetails(row.LevelDetails).length > 0) {
                return row;
            }
            return eeListFetchApprovalMetaFromPendingList(code);
        })
        .catch(function () {
            return eeListFetchApprovalMetaFromPendingList(code);
        });
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

function eeListExpenseHeadCodeFromRow(row) {
    if (!row || typeof row !== 'object') return 0;
    const n = parseInt(row.ExpenseHeadMaster_Code ?? row['Expense Head Master Code'] ?? 0, 10);
    return Number.isFinite(n) ? n : 0;
}

function eeListParseUiDate(raw) {
    if (raw == null || raw === '') return null;
    const s = String(raw).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const p = s.split('-');
        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const p = s.split('/');
        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const dt = new Date(s.substring(0, 10) + 'T12:00:00');
        return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
}

function eeListDateToCalcApiFormat(raw) {
    const dt = eeListParseUiDate(raw);
    if (!dt) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return dt.getDate() + '-' + monthNames[dt.getMonth()] + '-' + dt.getFullYear();
}

function eeListCalcTotalDaysFromEntry(entry) {
    const fromDt = eeListParseUiDate(entry['From Date'] ?? entry.FromDate);
    const toDt = eeListParseUiDate(entry['To Date'] ?? entry.ToDate);
    if (!fromDt || !toDt) return 0;
    const totalDays = Math.round((toDt - fromDt) / (1000 * 3600 * 24)) + 1;
    return totalDays >= 1 ? totalDays : 0;
}

function eeListResolveMarketingManMasterCode(entry) {
    const fromEntry = parseInt(entry.MarketingManMaster_Code ?? entry['MarketingManMaster_Code'] ?? 0, 10);
    if (fromEntry > 0) return Promise.resolve(fromEntry);
    const person = entry['Person Name'] ?? entry.PersonName ?? '';
    if (!person || person === '—') return Promise.resolve(0);
    return ExpenseEntryService.GetMarketingManMasterByName(person).then(function (resp) {
        return resp && resp.Code ? parseInt(resp.Code, 10) : 0;
    }).catch(function () { return 0; });
}

function eeListMatchDetailLineForEnrich(line, apiLine) {
    const headA = String(line['Expense Head'] ?? line.ExpenseHead ?? line.ExpenseDesp ?? '').trim().toLowerCase();
    const headB = String(apiLine['Expense Head'] ?? apiLine.ExpenseDesp ?? '').trim().toLowerCase();
    if (headA && headB && headA !== headB) return false;
    const pmA = parseInt(line.ProjectMaster_Code, 10) || 0;
    const pmB = parseInt(apiLine.ProjectMaster_Code, 10) || 0;
    if (pmA && pmB && pmA !== pmB) return false;
    const spA = parseInt(line.SubProjectMaster_Code, 10) || 0;
    const spB = parseInt(apiLine.SubProjectMaster_Code, 10) || 0;
    if (spA && spB && spA !== spB) return false;
    const subNameA = String(line['Sub Project Name'] ?? line.SubProjectName ?? '').trim().toLowerCase();
    const subNameB = String(apiLine['Sub Project Name'] ?? apiLine.SubProjectName ?? '').trim().toLowerCase();
    if (subNameA && subNameB && subNameA !== subNameB) return false;
    const expA = eeListNumFromRow(line, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
    const expB = eeListNumFromRow(apiLine, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
    if (expA > 0 && expB > 0 && Math.abs(expA - expB) > 0.01) return false;
    return true;
}

function eeListMergeShowDataOntoLine(line, showLine) {
    const r = Object.assign({}, line);
    if (!showLine) return r;
    if (showLine.ExpenseHeadMaster_Code != null) r.ExpenseHeadMaster_Code = showLine.ExpenseHeadMaster_Code;
    if (showLine['Per Day Limit'] != null) {
        r['Per Day Limit'] = showLine['Per Day Limit'];
        r.AllowLimit = showLine['Per Day Limit'];
    }
    if (showLine.ProjectMaster_Code != null) r.ProjectMaster_Code = showLine.ProjectMaster_Code;
    if (showLine.SubProjectMaster_Code != null) r.SubProjectMaster_Code = showLine.SubProjectMaster_Code;
    const detailCode = parseInt(
        showLine.ExpenseEntryDetail_Code ?? showLine.Code ?? showLine.code ?? 0,
        10
    );
    if (Number.isFinite(detailCode) && detailCode > 0) {
        r.ExpenseEntryDetail_Code = detailCode;
    }
    return r;
}

function eeListEnrichEntryAndLinesFromShowData(entry, masterCode, lines) {
    const person = entry['Person Name'] ?? entry.PersonName ?? '';
    const normalized = Array.isArray(lines) ? lines.slice() : [];
    if (!person || person === '—' || !masterCode) {
        return Promise.resolve({ entry: entry, lines: normalized });
    }
    return ExpenseEntryService.GetExpenseEntryDetails(person, masterCode).then(function (resp) {
        const enrichedEntry = Object.assign({}, entry);
        const master = resp && resp.ExpenseEntryMaster && resp.ExpenseEntryMaster[0];
        if (master) {
            enrichedEntry['From Date'] = master.FromDate || enrichedEntry['From Date'];
            enrichedEntry['To Date'] = master.ToDate || enrichedEntry['To Date'];
            enrichedEntry.FromDate = master.FromDate || enrichedEntry.FromDate;
            enrichedEntry.ToDate = master.ToDate || enrichedEntry.ToDate;
            enrichedEntry.MarketingManMaster_Code = master.MarketingManMaster_Code || enrichedEntry.MarketingManMaster_Code;
            enrichedEntry['MarketingManMaster_Code'] = enrichedEntry.MarketingManMaster_Code;
        }
        const showLines = (resp && resp.ExpenseEntryDetail) ? resp.ExpenseEntryDetail : [];
        if (!showLines.length) return { entry: enrichedEntry, lines: normalized };
        const used = new Set();
        const enrichedLines = normalized.map(function (line) {
            let matchIdx = -1;
            for (let i = 0; i < showLines.length; i++) {
                if (used.has(i)) continue;
                if (!eeListMatchDetailLineForEnrich(line, showLines[i])) continue;
                matchIdx = i;
                break;
            }
            if (matchIdx < 0) return Object.assign({}, line);
            used.add(matchIdx);
            return eeListMergeShowDataOntoLine(line, showLines[matchIdx]);
        });
        return { entry: enrichedEntry, lines: enrichedLines };
    }).catch(function () {
        return { entry: entry, lines: normalized };
    });
}

function eeListNormalizeApiArray(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.Data)) return response.Data;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
}

/** Match Expense Entry Detail page: calculated allowed amount (per-day limit × days). */
function eeListApplyCalculatedAllowedAmounts(entry, lines) {
    const rows = Array.isArray(lines) ? lines.slice() : [];
    if (!rows.length) return Promise.resolve(rows);

    const totalDays = eeListCalcTotalDaysFromEntry(entry);
    const applyFallback = function () {
        return rows.map(function (row) {
            const r = Object.assign({}, row);
            const perDay = eeListNumFromRow(r, ['Per Day Limit', 'AllowLimit', 'Allow Limit']);
            const amt = perDay > 0 && totalDays > 0 ? perDay * totalDays : 0;
            r['Allowed Amount'] = amt;
            r['Allow Amount'] = amt;
            return r;
        });
    };

    const fromApi = eeListDateToCalcApiFormat(entry['From Date'] ?? entry.FromDate);
    const toApi = eeListDateToCalcApiFormat(entry['To Date'] ?? entry.ToDate);
    if (!fromApi || !toApi) return Promise.resolve(applyFallback());

    return eeListResolveMarketingManMasterCode(entry).then(function (mmCode) {
        if (!mmCode) return applyFallback();
        return ExpenseEntryService.CalculateAllowedAmount(mmCode, fromApi, toApi).then(function (response) {
            const list = eeListNormalizeApiArray(response);
            const byHead = {};
            list.forEach(function (item) {
                if (item && item.ExpenseHeadMaster_Code != null) {
                    byHead[parseInt(item.ExpenseHeadMaster_Code, 10)] = parseFloat(item.TotalExpense) || 0;
                }
            });
            return rows.map(function (row) {
                const r = Object.assign({}, row);
                const headCode = eeListExpenseHeadCodeFromRow(r);
                let amt = headCode > 0 && byHead[headCode] != null ? byHead[headCode] : null;
                if (amt == null) {
                    const perDay = eeListNumFromRow(r, ['Per Day Limit', 'AllowLimit', 'Allow Limit']);
                    amt = perDay > 0 && totalDays > 0 ? perDay * totalDays : 0;
                }
                r['Allowed Amount'] = amt;
                r['Allow Amount'] = amt;
                return r;
            });
        }).catch(function () {
            return applyFallback();
        });
    });
}

function eeListDetailLineCodeFromRow(row, masterCode) {
    if (!row || typeof row !== 'object') return 0;
    const mc = parseInt(masterCode, 10) || 0;
    const keys = [
        'ExpenseEntryDetail_Code', 'ExpenseEntryDetailCode',
        'Detail Line Code', 'Detail_Line_Code',
        'Detail_Code', 'DetailCode', 'detailCode', 'ExpenseDetail_Code', 'Line_Code', 'LineCode'
    ];
    for (let i = 0; i < keys.length; i++) {
        const n = parseInt(row[keys[i]], 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    const code = parseInt(row.Code ?? row.code, 10);
    if (Number.isFinite(code) && code > 0 && code !== mc) return code;
    return 0;
}

function eeListBuildDetailRowsHtml(items, masterCode) {
    if (!items || items.length === 0) {
        return '<tr><td colspan="8" class="text-center py-3 text-muted">No expense lines found.</td></tr>';
    }
    const mc = parseInt(masterCode, 10) || 0;
    let rows = '';
    items.forEach(function (row, idx) {
        const head = eeListEscHtml(row['Expense Head'] ?? row.ExpenseHead ?? row.ExpenseDesp ?? '—');
        const allowAmt = eeListFmtCurrency(row['Allowed Amount'] ?? row['Allow Amount'] ?? 0);
        const kmRaw = parseFloat(row['Distance (KM)'] ?? row['KM'] ?? row.KM ?? 0) || 0;
        const kmCell = kmRaw > 0 ? String(kmRaw) : '';
        const expAmt = eeListFmtCurrency(row['Expense Amount'] ?? row.ExpendedAmount ?? row['Expended Amount'] ?? 0);
        const apprAmt = eeListFmtCurrency(row['Approved Amount'] ?? row.Approved ?? row.ApprovedAmount ?? 0);
        const rem = eeListEscHtml(row.Remarks ?? row['Remarks'] ?? row.Description ?? '');
        const detailCode = eeListDetailLineCodeFromRow(row, mc);
        const histBtn = detailCode > 0
            ? '<button type="button" class="btn-eea-line-history" title="View approval amount history" ' +
              'onclick="OpenEeListLineHistory(' + detailCode + ')"><i class="fa fa-history"></i></button>'
            : '<button type="button" class="btn-eea-line-history" disabled title="Line must be saved before history is available">' +
              '<i class="fa fa-history"></i></button>';
        rows += '<tr>' +
            '<td class="text-center">' + (idx + 1) + '</td>' +
            '<td>' + head + '</td>' +
            '<td class="text-end">' + allowAmt + '</td>' +
            '<td class="text-end" style="color:#b45309;">' + kmCell + '</td>' +
            '<td class="text-end">' + expAmt + '</td>' +
            '<td class="text-end">' + apprAmt + '</td>' +
            '<td>' + rem + '</td>' +
            '<td class="text-center">' + histBtn + '</td>' +
            '</tr>';
    });
    return rows;
}

function eeListNormalizeHistoryList(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.Data)) return data.Data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.ExpenseEntryApprovalHistory)) return data.ExpenseEntryApprovalHistory;
    if (Array.isArray(data.Result)) return data.Result;
    return [];
}

function eeListHistoryTextFromRow(row, keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const v = row[arr[i]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function eeListRenderHistoryModalBody(rows) {
    const $body = $('#eeListHistoryModalBody');
    if (!rows || rows.length === 0) {
        $body.html(
            '<tr><td colspan="5" class="text-center py-4" style="color:#0e7499;font-size:0.82rem;">' +
            '<i class="fa fa-inbox me-1"></i>No approval history for this line.</td></tr>'
        );
        return;
    }
    let html = '';
    rows.forEach(function (row, idx) {
        const level = eeListEscHtml(eeListHistoryTextFromRow(row, ['Level', 'LevelDesc', 'LevelDesp', 'Level Name', 'Level Description'])
            || ('L' + (row.ExpenseEntryApprovalConfiguration_Code || row.LevelCode || '')));
        const approvedBy = eeListEscHtml(eeListDisplayApprovedBy(eeListHistoryTextFromRow(row, ['Approved By', 'ApprovedBy', 'Approved By Name', 'ApprovedByName'])));
        const oldAmt = eeListFmtCurrency(eeListNumFromRow(row, ['Old Approved Amount', 'OldApprovedAmount', 'Old Approved', 'OldApproved']));
        const newAmt = eeListFmtCurrency(eeListNumFromRow(row, ['New Approved Amount', 'NewApprovedAmount', 'New Approved', 'NewApproved']));
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + (level || '—') + '</td>' +
            '<td>' + (approvedBy || '—') + '</td>' +
            '<td class="text-end">' + oldAmt + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#0891b2;">' + newAmt + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function OpenEeListLineHistory(detailCode) {
    const dc = parseInt(detailCode, 10) || 0;
    if (dc <= 0) {
        toastr.warning('This line has no detail code; history is not available.');
        return;
    }

    let lineLabel = '';
    const ctx = G_EE_ListHistoryContext || {};
    const masterCode = parseInt(ctx.masterCode, 10) || 0;
    if (Array.isArray(ctx.detailLines)) {
        const hit = ctx.detailLines.find(function (r) {
            return eeListDetailLineCodeFromRow(r, masterCode) === dc;
        });
        if (hit) {
            lineLabel = String(hit['Expense Head'] ?? hit.ExpenseHead ?? hit.ExpenseDesp ?? '').trim();
        }
    }

    $('#eeListHistoryModalTitle').text('Approval history');
    $('#eeListHistoryModalSub').text(
        'ExpenseEntryDetail_Code: ' + dc + (lineLabel ? ' · ' + lineLabel : '')
    );
    $('#eeListHistoryModalBody').html(
        '<tr><td colspan="5" class="text-center py-3" style="color:#0e7499;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading…</td></tr>'
    );

    $('#modalEeListLineHistory').modal({ backdrop: 'static' });
    $('#modalEeListLineHistory').modal('show');

    ExpenseEntryLevelsApprovalService.GetExpenseEntryApprovalHistory(dc)
        .then(function (res) {
            eeListRenderHistoryModalBody(eeListNormalizeHistoryList(res));
        })
        .catch(function () {
            $('#eeListHistoryModalBody').html(
                '<tr><td colspan="5" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                '<i class="fa fa-exclamation-triangle me-1"></i>Unable to load history.</td></tr>'
            );
            toastr.error('Error loading approval history for this line.');
        });
}

function CloseEeListLineHistoryModal() {
    $('#modalEeListLineHistory').modal('hide');
}

function renderExpenseEntryApprovalFlowModal(entry, detailLines) {
    const masterCode = parseInt(entry.Code ?? entry.ExpenseEntryMaster_Code, 10) || 0;
    G_EE_ListHistoryContext = {
        detailLines: Array.isArray(detailLines) ? detailLines.slice() : [],
        masterCode: masterCode
    };

    const person = eeListEscHtml(entry['Person Name'] ?? entry.PersonName ?? '—');
    const entryNo = eeListEscHtml(entry['Entry No'] ?? entry.EntryNo ?? '—');
    const entryDate = eeListEscHtml(eeListDisplayDate(entry['Entry Date'] ?? entry.EntryDate));
    const fromDate = eeListEscHtml(eeListDisplayDate(entry['From Date'] ?? entry.FromDate));
    const toDate = eeListEscHtml(eeListDisplayDate(entry['To Date'] ?? entry.ToDate));
    const expendedAmt = eeListFmtCurrency(eeListGetExpendedAmount(entry, detailLines));
    const approvedAmt = eeListFmtCurrency(eeListGetApprovedAmount(entry, detailLines));
    const deduction = eeListFmtCurrency(eeListGetDeduction(entry, detailLines));
    const status = eeListEscHtml(eeListGetListStatus(entry));

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
                        '<th class="text-end">Distance (KM)</th>' +
                        '<th class="text-end">Expended</th>' +
                        '<th class="text-end">Approved</th>' +
                        '<th>Remarks</th>' +
                        '<th class="text-center">History</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' + eeListBuildDetailRowsHtml(detailLines, masterCode) + '</tbody>' +
            '</table>' +
        '</div>'
    );
}

function ViewApprovalFlowData(Code, x) {
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
                } else if (eeListParseLevelDetails(baseEntry.LevelDetails).length > 0) {
                    baseWithMeta.LevelDetails = baseEntry.LevelDetails;
                }
                if (metaEntry.TotalLevels != null && metaEntry.TotalLevels !== '') {
                    baseWithMeta.TotalLevels = metaEntry.TotalLevels;
                }
                if (metaEntry.CurrentLevelNo != null && metaEntry.CurrentLevelNo !== '') {
                    baseWithMeta.CurrentLevelNo = metaEntry.CurrentLevelNo;
                }
                if (metaEntry.CurrentLevelDesc) {
                    baseWithMeta.CurrentLevelDesc = metaEntry.CurrentLevelDesc;
                }
                const entry = eeListMergeDetailIntoEntry(res, baseWithMeta);
                const detailLines = eeListExtractDetailLines(res);
                return eeListEnrichEntryAndLinesFromShowData(entry, code, detailLines).then(function (pack) {
                    return eeListApplyCalculatedAllowedAmounts(pack.entry, pack.lines).then(function (enriched) {
                        pack.entry._detailLines = enriched;
                        renderExpenseEntryApprovalFlowModal(pack.entry, enriched);
                    });
                });
            });
        })
        .catch(function () {
            $('#eeApprovalFlowModalBody').html(
                '<div class="text-center py-4 text-danger"><i class="fa fa-exclamation-triangle me-2"></i>Failed to load approval flow.</div>'
            );
        });
}

function closeExpenseEntryApprovalFlowModal() {
    $('#eeApprovalFlowModal').modal('hide');
}

function eeListHasAttachmentYes(entry) {
    if (!entry || typeof entry !== 'object') return false;
    const code = parseInt(entry.Code != null ? entry.Code : 0, 10) || 0;
    if (code > 0 && Object.prototype.hasOwnProperty.call(G_EE_ListAttachmentYesMap, code)) {
        return !!G_EE_ListAttachmentYesMap[code];
    }
    const v = entry.HasAttach != null ? entry.HasAttach
        : entry.hasAttach != null ? entry.hasAttach
            : entry.HasAttachment != null ? entry.HasAttachment
                : entry.hasAttachment;
    return String(v || '').trim().toUpperCase() === 'Y';
}

/** Verified → upload allowed, delete hidden (PO Store addview). Else full attachment CRUD. */
function eeListGetAttachmentControlMode(entry) {
    if (!entry) return 'all';
    const vs = String(entry.VerifyStatus ?? '').trim().toUpperCase();
    const status = String(entry.Status ?? '').trim();
    if (vs === 'Y' || status === 'Verified') return 'addview';
    return 'all';
}

/**
 * Reconcile list paperclip color with Document Attachment API (master + detail lines).
 * Falls back to LOCATE HasAttach when API calls fail.
 */
function eeListSyncListAttachmentStates(rows) {
    G_EE_ListAttachmentYesMap = {};
    if (!Array.isArray(rows) || rows.length === 0) return Promise.resolve();
    eeListPatchAttachmentService();
    const origGet = AttachmentControlService._eeListOrigGetFiles
        || AttachmentControlService.GetAttachmentUploadFiles.bind(AttachmentControlService);

    const tasks = rows.map(function (item) {
        if (!item || typeof item !== 'object') return Promise.resolve();
        const code = parseInt(item.Code != null ? item.Code : 0, 10) || 0;
        if (!code) return Promise.resolve();
        const person = item['Person Name'] || item.PersonName || '';
        const spFlag = String(item.HasAttach ?? item.HasAttachment ?? '').trim().toUpperCase() === 'Y';

        return eeListCollectDetailCodesFromApi(person, code).then(function (detailCodes) {
            return eeListFetchMergedExpenseEntryAttachments(code, detailCodes, origGet).then(function (merged) {
                const yes = Array.isArray(merged) && merged.length > 0;
                G_EE_ListAttachmentYesMap[code] = yes;
                item.HasAttach = yes ? 'Y' : 'N';
            });
        }).catch(function () {
            G_EE_ListAttachmentYesMap[code] = spFlag;
            item.HasAttach = spFlag ? 'Y' : 'N';
        });
    });
    return Promise.all(tasks);
}

function eeListEntryDateParamForAttachmentControl(raw) {
    if (raw == null || raw === '') return '';
    const iso = toIsoDateStr(String(raw).trim());
    if (!iso) return '';
    const dt = new Date(iso);
    return !isNaN(dt.getTime()) ? dt.toISOString() : '';
}

function eeListNormalizeAttachmentApiResponse(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.Data)) return response.Data;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
}

function eeListClearAttachmentAggregateMode() {
    window._eeListAttachmentAggregateMasterCode = 0;
    window._eeListAttachmentDetailCodes = null;
}

function eeListFetchMergedExpenseEntryAttachments(masterCode, detailCodes, origGet) {
    const mc = parseInt(masterCode, 10) || 0;
    const tasks = [
        origGet.call(AttachmentControlService, 'ExpenseEntryMaster', mc, '', 0)
    ];
    const lineSeen = new Set();
    (detailCodes || []).forEach(function (dc) {
        const code = parseInt(dc, 10) || 0;
        if (code <= 0 || lineSeen.has(code)) return;
        lineSeen.add(code);
        tasks.push(origGet.call(AttachmentControlService, 'ExpenseEntryMaster', mc, 'ExpenseEntryDetail', code));
    });
    return Promise.all(tasks).then(function (results) {
        const merged = [];
        const docSeen = new Set();
        results.forEach(function (resp) {
            eeListNormalizeAttachmentApiResponse(resp).forEach(function (item) {
                if (!item || typeof item !== 'object') return;
                const docCode = parseInt(item.Code ?? item.code, 10) || 0;
                if (docCode > 0) {
                    if (docSeen.has(docCode)) return;
                    docSeen.add(docCode);
                }
                merged.push(item);
            });
        });
        return merged;
    });
}

function eeListPatchAttachmentService() {
    if (AttachmentControlService._eeListGetFilesPatched) return;
    const prevGet = AttachmentControlService.GetAttachmentUploadFiles;
    AttachmentControlService._eeListOrigGetFiles = prevGet;
    AttachmentControlService.GetAttachmentUploadFiles = function (masterTableName, masterTableCode, detailTableName, detailTableCode) {
        const mc = parseInt(masterTableCode, 10) || 0;
        const aggMc = parseInt(window._eeListAttachmentAggregateMasterCode || '0', 10);
        const dName = detailTableName == null || detailTableName === undefined ? '' : String(detailTableName).trim();
        const dCode = parseInt(detailTableCode, 10) || 0;
        if (masterTableName === 'ExpenseEntryMaster' && aggMc > 0 && mc === aggMc && !dName && dCode === 0) {
            return eeListFetchMergedExpenseEntryAttachments(mc, window._eeListAttachmentDetailCodes || [], prevGet);
        }
        return Promise.resolve(prevGet.call(AttachmentControlService, masterTableName, masterTableCode, detailTableName, detailTableCode))
            .then(eeListNormalizeAttachmentApiResponse);
    };
    AttachmentControlService._eeListGetFilesPatched = true;
}

function eeListCollectDetailCodesFromApi(person, masterCode) {
    if (!person || !masterCode) return Promise.resolve([]);
    return ExpenseEntryService.GetExpenseEntryDetails(person, masterCode).then(function (resp) {
        const lines = (resp && resp.ExpenseEntryDetail) ? resp.ExpenseEntryDetail : [];
        const seen = new Set();
        const out = [];
        lines.forEach(function (row) {
            const dc = eeListDetailLineCodeFromRow(row, masterCode);
            if (dc > 0 && !seen.has(dc)) {
                seen.add(dc);
                out.push(dc);
            }
        });
        return out;
    }).catch(function () {
        return [];
    });
}

function InitEEListAttachmentControl(masterCode, entryNo, entryDate, mode) {
    eeListPatchAttachmentService();
    const url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#ExpenseEntryList_AttachmentControlmodal').load(url, {
        MasterTableName: 'ExpenseEntryMaster',
        MasterTableCode: parseInt(masterCode, 10) || 0,
        DetailTableName: '',
        DetailTableCode: 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: mode || 'all'
    }, function () {
        $(document).off('hidden.bs.modal.eeListAttachAgg', '#AttachmentControlmodal')
            .on('hidden.bs.modal.eeListAttachAgg', '#AttachmentControlmodal', function () {
                eeListClearAttachmentAggregateMode();
            });
    });
}

function openEEListAttachmentControl(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Invalid record. Cannot open attachments.');
        return;
    }
    const cached = G_EE_ListRowCache[masterCode] || {};
    const person = cached['Person Name'] || cached.PersonName || '';
    const mode = eeListGetAttachmentControlMode(cached);
    eeListCollectDetailCodesFromApi(person, masterCode).then(function (detailCodes) {
        window._eeListAttachmentAggregateMasterCode = masterCode;
        window._eeListAttachmentDetailCodes = detailCodes;
        InitEEListAttachmentControl(masterCode, entryNo, entryDate, mode);
    });
}

function eeListGetCompanyInfo() {
    try {
        const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (ud && ud[0]) return ud[0];
    } catch (e) { /* ignore */ }
    return {};
}

function eeListNormalizeApiRows(result) {
    if (Array.isArray(result)) return result;
    const datum = result?.Data ?? result?.data;
    if (datum != null && typeof datum === 'object' && !Array.isArray(datum)) {
        const inner = eeListNormalizeApiRows(datum);
        if (inner.length) return inner;
    }
    if (Array.isArray(result?.Table)) return result.Table;
    if (Array.isArray(result?.Data)) return result.Data;
    if (Array.isArray(result?.data)) return result.data;
    return [];
}

function eeListSessionPrintCompany() {
    const ud = eeListGetCompanyInfo();
    return {
        companyName: String(ud.CompanyName || ud.CompanyNameForShow || '').trim(),
        companyAliasName: String(ud.CompanyAliasName || ud.CompanyName || ud.CompanyNameForShow || '').trim(),
        companyAddr: String(ud.CompanyAddress || '').trim(),
        companyPhone: String(ud.PhoneNo || ud.CompanyPhone || '').trim(),
        companyEmail: String(ud.Email || ud.CompanyEmail || '').trim(),
        companyWeb: String(ud.Website || ud.CompanyWebsite || '').trim(),
        companyGST: String(ud.GSTIN || ud.CompanyGSTIN || '').trim(),
        companyTag: String(ud.BranchName || ud.CompanyTagLine || ud.TagLine || '').trim(),
    };
}

/** Map {@link GRNPaymentApprovalService.GetCompany} response for print header (same as GRN Payment Entry). */
function eeListCompanyFromGetCompanyApi(resp) {
    if (resp == null) {
        return { companyName: '', companyAliasName: '', companyAddr: '', companyPhone: '', companyEmail: '', companyWeb: '', companyGST: '', companyTag: '' };
    }
    let row = null;
    const rows = eeListNormalizeApiRows(resp);
    if (rows.length && rows[0]) row = rows[0];
    if (!row) {
        const o = resp.Data ?? resp.data ?? resp;
        if (o && typeof o === 'object' && !Array.isArray(o)) {
            if (o.CompanyName != null || o.companyName != null
                || o.CompanyInfo != null || o.Name != null || o.name != null
                || o.OfficeAddress1 != null || o.officeAddress1 != null
                || o.GSTNo != null || o.gSTNo != null) {
                row = o;
            }
        }
    }
    row = row || {};
    const phone = String(row.OfficePhones1 ?? row.officePhones1 ?? row.PhoneNo ?? row.phoneNo ?? '').trim();
    const web = String(row.WebSite ?? row.webSite ?? row.Website ?? row.website ?? '').trim();
    const companyName = String(row.CompanyName ?? row.companyName ?? row.CompanyInfo ?? row.Name ?? row.name ?? '').trim();
    const companyAlias = String(row.CompanyAliasName ?? row.companyAliasName ?? companyName).trim();
    return {
        companyName: companyName,
        companyAliasName: companyAlias || companyName,
        companyAddr: String(
            row.OfficeAddress1 ?? row.officeAddress1
            ?? row.CompanyAddress ?? row.companyAddress ?? row.Address ?? row.address ?? ''
        ).trim(),
        companyPhone: phone,
        companyEmail: String(row.Email ?? row.email ?? row.CompanyEmail ?? row.companyEmail ?? '').trim(),
        companyWeb: web,
        companyGST: String(
            row.GSTNo ?? row.gstNo ?? row.GSTIN ?? row.gstin ?? row.CompanyGSTIN ?? row.companyGSTIN ?? ''
        ).trim(),
        companyTag: String(row.BranchName ?? row.branchName ?? row.CompanyTagLine ?? row.TagLine ?? row.tagLine ?? '').trim(),
    };
}

function eeListMergePrintCompanyInfo(sessionCo, apiCo) {
    const a = apiCo || {};
    const s = sessionCo || {};
    return {
        companyName: (a.companyName || s.companyName || '').trim(),
        companyAliasName: (a.companyAliasName || s.companyAliasName || a.companyName || s.companyName || '').trim(),
        companyAddr: (a.companyAddr || s.companyAddr || '').trim(),
        companyPhone: (a.companyPhone || s.companyPhone || '').trim(),
        companyEmail: (a.companyEmail || s.companyEmail || '').trim(),
        companyWeb: (a.companyWeb || s.companyWeb || '').trim(),
        companyGST: (a.companyGST || s.companyGST || '').trim(),
        companyTag: (a.companyTag || s.companyTag || '').trim(),
    };
}

function eeListResolveProjectName(projectList, code) {
    const n = parseInt(code, 10) || 0;
    if (n <= 0) return '—';
    const hit = (projectList || []).find(function (p) { return parseInt(p.Code, 10) === n; });
    if (!hit) return '—';
    return (hit.ProjectDesp || hit.ProjectName || hit.Name || '—').trim() || '—';
}

function eeListResolveSubProjectName(subProjectList, code) {
    const n = parseInt(code, 10) || 0;
    if (n <= 0) return '—';
    const hit = (subProjectList || []).find(function (p) { return parseInt(p.Code, 10) === n; });
    if (!hit) return '—';
    return (hit.SubProjectDesp || hit.SubProjectName || hit.Name || '—').trim() || '—';
}

function eeListFmtPrintCurrency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function eeListFmtPrintDate(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const p = s.split('-');
        return p[0] + '/' + p[1] + '/' + p[2];
    }
    const formatted = eeListFmtDateDisplay(s);
    return formatted || s;
}

/** Same asset paths as PurchaseOrderStore print/preview — replace files under wwwroot/assets/images/ to update. */
function eeListGetPrintAssetBase() {
    return (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
}

function eeListGetPrintLogoUrl() {
    return eeListGetPrintAssetBase() + 'assets/images/pppllog.jpeg';
}

function eeListGetPrintStampAccountsUrl() {
    return eeListGetPrintAssetBase() + 'assets/images/PPPL_Stamp_Finance.jpeg';
}

function eeListGetPrintStampManagementUrl() {
    return eeListGetPrintAssetBase() + 'assets/images/PPPL_Stamp_HODA.jpeg';
}

function eeListBuildExpensePrintSigBox(labelTitle, stampImgUrl, showStamp) {
    const stampInner = showStamp
        ? '<img class="sig-stamp" src="' + stampImgUrl + '" alt="' + eeListEscHtml(labelTitle) + '">'
        : '<span class="sig-name">Name &amp; Signature with Date</span>';
    return '<div class="sig-box">'
        + '<div class="sig-stamp-wrap">' + stampInner + '</div>'
        + '<div class="sig-title">' + eeListEscHtml(labelTitle) + '</div>'
        + '</div>';
}

/** Stamps on print/preview only when expense entry is fully verified (same idea as PO approved stamp). */
function eeListIsExpenseEntryVerifiedForPrint(listEntry, master, statusText) {
    const st = (statusText || '').toString().trim().toLowerCase();
    if (st === 'verified' || st === 'approved') return true;
    const rawStatus = (listEntry._listStatus ?? listEntry.Status ?? master.Status ?? '').toString().trim().toLowerCase();
    if (rawStatus === 'verified' || rawStatus === 'approved') return true;
    const verifyStatus = (listEntry.VerifyStatus ?? master.VerifyStatus ?? '').toString().trim().toUpperCase();
    return verifyStatus === 'Y';
}

function eeListFormatIndianCurrency(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return formatted + '.' + decPart;
}

function eeListNumberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoD(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeD(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
        return twoD(n);
    }
    let n = Math.floor(Math.abs(amount));
    if (n === 0) return 'Zero Rupees Only';
    let w = '';
    if (n >= 10000000) { w += threeD(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000) { w += twoD(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000) { w += twoD(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100) { w += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n > 0) { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

function _BuildExpenseEntryPrintHTML(listEntry, master, detailLines, projectList, subProjectList, printCompany) {
    const co = printCompany || eeListMergePrintCompanyInfo(eeListSessionPrintCompany(), null);
    const companyName = co.companyName || co.companyAliasName || '';
    const companyAliasName = co.companyAliasName || co.companyName || '';
    const companyAddr = co.companyAddr || '';
    const companyPhone = co.companyPhone || '';
    const companyEmail = co.companyEmail || '';
    const companyWeb = co.companyWeb || '';
    const companyGST = co.companyGST || '';
    const companyTag = co.companyTag || '';

    const personName = listEntry['Person Name'] || listEntry.PersonName || master.PersonName || '';
    const fromDate = eeListFmtPrintDate(listEntry['From Date'] || listEntry.FromDate || master.FromDate);
    const toDate = eeListFmtPrintDate(listEntry['To Date'] || listEntry.ToDate || master.ToDate);
    const periodText = (fromDate && toDate) ? (fromDate + '  to  ' + toDate) : (fromDate || toDate || '');
    const totalDays = eeListCalcTotalDaysFromEntry(Object.assign({}, listEntry, master)) || listEntry['Total Days'] || master.TotalDays || '';
    const entryDate = eeListFmtPrintDate(listEntry['Entry Date'] || listEntry.EntryDate || master.EntryDate);
    const statusText = eeListGetListStatus(Object.assign({}, listEntry, { _listStatus: listEntry.Status || master.Status }));
    const approvedBy = eeListDisplayApprovedBy(listEntry['Approved By'] || listEntry.ApprovedBy || master.ApprovedBy);
    const entryNo = listEntry['Entry No'] || listEntry.EntryNo || master.EntryNo || '';
    const docTitle = 'PERSONAL EMPLOYEE EXPENSE REPORT';

    let designation = '';
    let department = '';
    const lines = (detailLines || []).filter(function (row) {
        return eeListNumFromRow(row, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']) > 0
            || !!(row['Expense Head'] || row.ExpenseHead);
    });

    if (lines.length > 0) {
        designation = String(lines[0]['Designation Name'] || lines[0].DesignationName || '').trim();
        department = String(lines[0].Department || lines[0]['Department Name'] || '').trim();
    }

    let detailRowsHtml = '';
    let grandExpended = 0;
    let grandApproved = 0;
    lines.forEach(function (row, idx) {
        const pm = row.ProjectMaster_Code != null ? row.ProjectMaster_Code : 0;
        const spm = row.SubProjectMaster_Code != null ? row.SubProjectMaster_Code : 0;
        const projectName = String(row['Project Name'] || row.ProjectName || eeListResolveProjectName(projectList, pm)).trim();
        const siteName = String(row['Sub Project Name'] || row.SubProjectName || eeListResolveSubProjectName(subProjectList, spm)).trim();
        const expenseType = String(row['Expense Head'] || row.ExpenseHead || row.ExpenseDesp || '').trim();
        const kmRaw = parseFloat(row['Distance (KM)'] ?? row['KM'] ?? row.KM ?? 0) || 0;
        const expended = eeListNumFromRow(row, ['Expense Amount', 'ExpendedAmount', 'Expended Amount']);
        const approved = eeListNumFromRow(row, ['Approved Amount', 'Approved', 'ApprovedAmount']);
        grandExpended += expended;
        grandApproved += approved > 0 ? approved : expended;
        detailRowsHtml += '<tr>'
            + '<td class="tc">' + (idx + 1) + '</td>'
            + '<td>' + eeListEscHtml(projectName) + '</td>'
            + '<td>' + eeListEscHtml(siteName) + '</td>'
            + '<td>' + eeListEscHtml(expenseType) + '</td>'
            + '<td class="tc">' + (kmRaw > 0 ? kmRaw : '') + '</td>'
            + '<td class="tr">&#8377;' + eeListFormatIndianCurrency(expended) + '</td>'
            + '</tr>';
    });

    if (!detailRowsHtml) {
        detailRowsHtml = '<tr><td class="tc">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    }

    const listApproved = eeListNumFromRow(listEntry, ['Approved Amount', 'ApprovedAmount']);
    const listExpended = eeListNumFromRow(listEntry, ['Expended Amount', 'ExpendedAmount']);
    if (listApproved > 0) grandApproved = listApproved;
    if (listExpended > 0 && grandExpended === 0) grandExpended = listExpended;
    const deduction = eeListGetDeduction(listEntry, lines);
    const grandTotal = grandApproved > 0 ? grandApproved : grandExpended;
    const amtWords = eeListNumberToWords(Math.round(grandTotal));

    let hdrContact = '';
    if (companyPhone) hdrContact += '&#9990;&nbsp;' + eeListEscHtml(companyPhone) + '<br>';
    if (companyEmail) hdrContact += '&#9993;&nbsp;' + eeListEscHtml(companyEmail) + '<br>';
    if (companyWeb) hdrContact += '&#127760;&nbsp;' + eeListEscHtml(companyWeb) + '<br>';
    if (companyGST) hdrContact += 'GSTIN:&nbsp;' + eeListEscHtml(companyGST);

    const _base = eeListGetPrintAssetBase();
    const logoUrl = eeListGetPrintLogoUrl();
    const stampUrlAccounts = eeListGetPrintStampAccountsUrl();
    const stampUrlManagement = eeListGetPrintStampManagementUrl();

    let employeeHtml = '<div class="info-name">' + eeListEscHtml(personName || '-') + '</div>';
    if (department) employeeHtml += '<div class="info-field"><b>Department : </b>' + eeListEscHtml(department) + '</div>';
    if (periodText) employeeHtml += '<div class="info-field"><b>Expense Period : </b>' + eeListEscHtml(periodText) + '</div>';

    let designationHtml = '';
    if (designation) designationHtml += '<div class="info-field"><b>Designation : </b>' + eeListEscHtml(designation) + '</div>';
    designationHtml += '<div class="info-field"><b>Submitted Date : </b>' + eeListEscHtml(entryDate || '-') + '</div>';
    designationHtml += '<div class="info-field"><b>Approval Status : </b>' + eeListEscHtml(statusText || '-') + '</div>';
    if (approvedBy && approvedBy !== '—') {
        designationHtml += '<div class="info-field"><b>Approved By : </b>' + eeListEscHtml(approvedBy) + '</div>';
    }

    const sectionBand = periodText
        ? '&#9679; EXPENSE PERIOD : ' + eeListEscHtml(periodText.toUpperCase()) + (personName ? ' &mdash; ' + eeListEscHtml(personName.toUpperCase()) : '')
        : 'EXPENSE DETAILS';

    let totalsHtml = '';
    totalsHtml += '<tr><td class="lbl">Total Expended Amount</td><td class="val">&#8377; ' + eeListFormatIndianCurrency(grandExpended) + '</td></tr>';
    totalsHtml += '<tr><td class="lbl">Deduction</td><td class="val">&#8377; ' + eeListFormatIndianCurrency(deduction) + '</td></tr>';
    if (grandApproved > 0) {
        totalsHtml += '<tr><td class="lbl">Total Approved Amount</td><td class="val">&#8377; ' + eeListFormatIndianCurrency(grandApproved) + '</td></tr>';
    }
    totalsHtml += '<tr class="grand"><td class="lbl">Total</td><td class="val">&#8377; ' + eeListFormatIndianCurrency(grandTotal) + '</td></tr>';

    const showStamps = eeListIsExpenseEntryVerifiedForPrint(listEntry, master, statusText);
    const signatureHtml = '<div class="sig-row">'
        + eeListBuildExpensePrintSigBox('Verified By / Accounts', stampUrlAccounts, showStamps)
        + eeListBuildExpensePrintSigBox('Approved By / Management', stampUrlManagement, showStamps)
        + '</div>';

    const css = '@page{size:A4 portrait;margin:8mm 10mm 10mm 10mm;}'
        + '*{box-sizing:border-box;margin:0;padding:0;}'
        + 'body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#000;background:#fff;}'
        + '.no-print{margin-bottom:5mm;}'
        + '@media print{.no-print{display:none!important;}}'
        + '.po-hdr{display:flex;align-items:flex-start;padding-bottom:5px;border-bottom:2.5px solid #000;margin-bottom:5px;}'
        + '.hdr-co{flex:1;}'
        + '.hdr-name{font-size:15pt;font-weight:800;color:#000;letter-spacing:0.3px;line-height:1.2;}'
        + '.hdr-tag{font-size:9pt;color:#000;letter-spacing:1px;margin-top:1px;font-weight:700;}'
        + '.hdr-contact{text-align:right;font-size:8pt;color:#000;line-height:1.75;min-width:155px;font-weight:600;}'
        + '.po-title{text-align:center;font-size:10pt;font-weight:800;border:2px solid #000;color:#000;padding:3px 0;margin:4px 0;letter-spacing:1.5px;}'
        + '.info-row{display:flex;border:1px solid #000;margin-bottom:4px;}'
        + '.info-cell{flex:1;padding:4px 7px;font-size:8.5pt;}'
        + '.info-cell+.info-cell{border-left:1px solid #000;}'
        + '.info-cell.full{flex:unset;width:100%;}'
        + '.info-label{font-weight:800;font-size:8pt;color:#000;border-bottom:1px dashed #555;padding-bottom:2px;margin-bottom:3px;}'
        + '.info-name{font-weight:800;font-size:9pt;margin-bottom:2px;color:#000;}'
        + '.info-field{font-size:8.5pt;margin-bottom:1px;color:#000;font-weight:600;}'
        + '.sec-band{border-top:2.5px solid #000;border-bottom:2.5px solid #000;font-weight:800;font-size:9.5pt;padding:4px 8px;margin:5px 0 4px;letter-spacing:0.6px;color:#000;text-transform:uppercase;}'
        + 'table.items{width:100%;border-collapse:collapse;}'
        + 'table.items th{background:#fff;color:#000;padding:5px;font-size:9pt;font-weight:800;border:1.5px solid #000;text-align:center;}'
        + 'table.items td{padding:4px 5px;font-size:9pt;color:#000;font-weight:600;border:1px solid #555;vertical-align:top;}'
        + '.tc{text-align:center;}.tr{text-align:right;}'
        + '.tot-wrap{display:flex;justify-content:flex-end;margin-top:5px;}'
        + 'table.totals{border-collapse:collapse;min-width:290px;}'
        + 'table.totals td{padding:3px 8px;font-size:9pt;border:1px solid #555;color:#000;}'
        + 'table.totals .lbl{font-weight:700;color:#000;}'
        + 'table.totals .val{text-align:right;min-width:100px;font-weight:700;color:#000;}'
        + 'table.totals tr.grand td{border:1.5px solid #000;border-top:2px solid #000;font-weight:800;color:#000;}'
        + '.words-box{border:1.5px solid #555;padding:5px 9px;margin:5px 0;font-size:9pt;font-weight:600;color:#000;}'
        + '.inv-text-box{border:1px solid #555;padding:7px 10px 9px;margin:8px 0 6px;font-size:8.5pt;color:#000;font-weight:600;line-height:1.6;}'
        + '.inv-text-box .inv-title{font-weight:800;text-decoration:underline;margin-bottom:5px;font-size:9pt;}'
        + '.inv-text-box .inv-list{margin:0;padding:0;list-style:none;}'
        + '.inv-text-box .inv-list li{padding:1px 0 1px 28px;text-indent:-28px;}'
        + '.sig-row{display:flex;gap:0;margin-top:12px;border:1.5px solid #000;}'
        + '.sig-box{flex:1;border-right:1.5px solid #000;display:flex;flex-direction:column;justify-content:flex-end;min-height:160px;min-width:0;}'
        + '.sig-box:last-child{border-right:none;}'
        + '.sig-title{font-weight:800;font-size:8.5pt;color:#000;text-align:center;padding:5px 4px;border-top:1.5px solid #000;letter-spacing:0.02em;}'
        + '.sig-name{font-size:7.5pt;color:#000;font-weight:600;}'
        + '.sig-stamp-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px 2px;}'
        + '.sig-stamp{width:100px;height:100px;object-fit:contain;display:block;margin:0 auto 4px;opacity:0.88;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        + '.page-wrap{width:100%;border-collapse:collapse;border-spacing:0;}'
        + '.page-footer-cell{padding:0;}'
        + '.page-body-cell{padding:0;vertical-align:top;}'
        + '.print-footer{width:100%;}'
        + '.print-footer-addr{text-align:center;font-family:Georgia,"Times New Roman",Times,serif;font-size:8.5pt;color:#6d7d92;line-height:1.45;padding:6px 8px 4px;}'
        + '.print-footer-strip{height:22px;width:100%;background:linear-gradient(102deg,#d4c6e6 0%,#d4c6e6 44.5%,#ffffff 44.5%,#ffffff 47.2%,#d8dce2 47.2%,#d8dce2 100%);-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        + '.hdr-logo{width:65px;height:65px;object-fit:contain;margin-right:14px;flex-shrink:0;}'
        + '.hdr-left{display:flex;align-items:center;flex:1;}'
        + '.wm-logo{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:320px;background:url(' + logoUrl + ') no-repeat center;background-size:contain;opacity:0.07;pointer-events:none;z-index:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}';

    const coreInner = ''
        + '<div class="po-hdr">'
        + '<div class="hdr-left"><img class="hdr-logo" src="' + logoUrl + '" alt="Logo">'
        + '<div class="hdr-co"><div class="hdr-name">' + eeListEscHtml(companyAliasName || companyName || '—') + '</div>'
        + (companyTag ? '<div class="hdr-tag">' + eeListEscHtml(companyTag) + '</div>' : '')
        + '</div></div>'
        + '<div class="hdr-contact">' + hdrContact + '</div>'
        + '</div>'
        + '<div class="po-title">' + docTitle + '</div>'
        + '<div class="info-row">'
        + '<div class="info-cell">'
        + '<div class="info-field"><b>Date : </b>' + eeListEscHtml(entryDate || '-') + '</div>'
        + '<div class="info-field"><b>Expense Period : </b>' + eeListEscHtml(periodText || '-') + '</div>'
        + '</div>'
        + '<div class="info-cell" style="text-align:right;">'
        + '<div class="info-field"><b>Entry No : </b>' + eeListEscHtml(entryNo) + '</div>'
        + '<div class="info-field"><b>Total Days : </b>' + eeListEscHtml(totalDays) + '</div>'
        + '<div class="info-field"><b>Status : </b>' + eeListEscHtml(statusText || '-') + '</div>'
        + '</div></div>'
        + '<div class="info-row">'
        + '<div class="info-cell"><div class="info-label">Employee Details :</div>' + employeeHtml + '</div>'
        + '<div class="info-cell"><div class="info-label">Employee Information :</div>' + designationHtml + '</div>'
        + '</div>'
        + '<div class="sec-band">' + sectionBand + '</div>'
        + '<table class="items"><thead><tr>'
        + '<th style="width:28px;">S.No</th>'
        + '<th>Project name</th>'
        + '<th>Site name</th>'
        + '<th>Expense type</th>'
        + '<th style="width:80px;">Distance (KM)</th>'
        + '<th style="width:90px;">Expended Amount</th>'
        + '</tr></thead><tbody>' + detailRowsHtml + '</tbody></table>'
        + '<div class="tot-wrap"><table class="totals"><tbody>' + totalsHtml + '</tbody></table></div>'
        + '<div class="words-box"><b>Amount in Word : </b>' + eeListEscHtml(amtWords) + '</div>'
        + '<div class="pdf-keep-together pdf-footer-block">'
        + '<div class="inv-text-box">'
        + '<div class="inv-title">NOTE: The following details are essential to process this expense report for payment purpose.</div>'
        + '<ul class="inv-list">'
        + '<li>i)&nbsp;&nbsp;&nbsp;&nbsp;Employee name and designation.</li>'
        + '<li>ii)&nbsp;&nbsp;&nbsp;Expense period and entry number.</li>'
        + '<li>iii)&nbsp;&nbsp;Project / site name and expense type.</li>'
        + '<li>iv)&nbsp;&nbsp;&nbsp;Supporting bills / invoices must be attached.</li>'
        + '</ul>'
        + '</div>'
        + signatureHtml
        + '</div>';

    const docPageTitle = docTitle + (entryNo ? ' - ' + entryNo : '');

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + eeListEscHtml(docPageTitle) + '</title><style>' + css + '</style></head><body>'
        + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 6px;">'
        + '<button onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
        + '<button onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
        + '</div>'
        + '<div class="wm-logo"></div>'
        + '<table class="page-wrap">'
        + '<tfoot><tr><td class="page-footer-cell">'
        + (companyAddr
            ? '<div class="print-footer"><div class="print-footer-addr">&#9679;&nbsp;' + eeListEscHtml(companyAddr) + '</div><div class="print-footer-strip"></div></div>'
            : '<div class="print-footer"><div class="print-footer-strip"></div></div>')
        + '</td></tr></tfoot>'
        + '<tbody><tr><td class="page-body-cell">' + coreInner + '</td></tr></tbody></table>'
        + '</body></html>';
}

function _DoPrintExpenseEntry(code, mode) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Invalid expense entry.');
        return;
    }
    const listEntry = G_EE_ListRowCache[masterCode] || {};
    const person = listEntry['Person Name'] || listEntry.PersonName || '';
    if (!person) {
        toastr.error('Person name not found for this entry.');
        return;
    }

    Promise.all([
        ProjectMasterService.GetProjectList(),
        SubProjectMasterService.GetSubProjectList(),
        ExpenseEntryService.GetExpenseEntryDetails(person, masterCode),
        GRNPaymentApprovalService.GetCompany().catch(function () { return null; })
    ]).then(function (results) {
        const projectList = Array.isArray(results[0]) ? results[0] : [];
        const subProjectList = Array.isArray(results[1]) ? results[1] : [];
        const resp = results[2] || {};
        const companyApi = results[3];
        const printCompany = eeListMergePrintCompanyInfo(
            eeListSessionPrintCompany(),
            companyApi ? eeListCompanyFromGetCompanyApi(companyApi) : null
        );
        const master = (resp.ExpenseEntryMaster && resp.ExpenseEntryMaster[0]) ? resp.ExpenseEntryMaster[0] : {};
        const detailLines = resp.ExpenseEntryDetail || [];
        const html = _BuildExpenseEntryPrintHTML(listEntry, master, detailLines, projectList, subProjectList, printCompany);
        const win = window.open('', '_blank');
        if (!win) {
            toastr.warning('Please allow popups for this site to use the print feature.');
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        if (mode === 'print') {
            setTimeout(function () { win.focus(); win.print(); }, 600);
        }
    }).catch(function () {
        toastr.error('Error loading expense entry for print.');
    });
}

function PrintExpenseEntry(code, mode) {
    _DoPrintExpenseEntry(code, mode);
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
window.OpenEeListLineHistory = OpenEeListLineHistory;
window.CloseEeListLineHistoryModal = CloseEeListLineHistoryModal;
window.openEEListAttachmentControl = openEEListAttachmentControl;
window.PrintExpenseEntry = PrintExpenseEntry;