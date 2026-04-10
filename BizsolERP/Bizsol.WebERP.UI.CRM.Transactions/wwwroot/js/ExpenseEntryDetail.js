import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    ExpenseHead: 0,
    Designation: 1,
    EffectiveFrom: 2,
    PerDayLimit: 3,
    Project: 4,
    SubProject: 5,
    AllowedAmount: 6,
    ExpenseAmount: 7,
    ApprovedAmount: 8,
    Remarks: 9,
    Attachment: 10,
    VerifyStatus: 11,
    ExpenseEntryDetail_Code: 12,
    ExpenseHeadMaster_Code: 13
};

var G_ProjectList = [];
var G_SubProjectList = [];
var G_ProjectApplicable = 'N';
var G_LevelVerifyApplicable = 'N';

/** API expects int; empty / non-numeric cells must be 0 (not null). */
function normalizeDetailLineCode($tr) {
    var $cell = $tr.find('td').eq(Indx_Tbl.ExpenseEntryDetail_Code);
    if (!$cell.length) return 0;
    var t = ($cell.text() || '').replace(/\s/g, '').trim();
    if (t === '') {
        var html = $cell.html() || '';
        t = String(html).replace(/<[^>]*>/g, '').replace(/\s/g, '').trim();
    }
    var n = parseInt(t, 10);
    return isNaN(n) ? 0 : n;
}

/** Body shape expected by SaveExpenseEntryMaster / VerifyExpenseEntryMaster API. */
function buildExpenseEntryApiPayload(masterRow, detailRows) {
    return {
        vm_ExpenseEntryMaster: masterRow,
        ExpenseEntryMaster: [masterRow],
        ExpenseEntryDetail: detailRows
    };
}

function escHtml(str) {
    if (str == null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildProjectSelectHtml(selectedCode, index) {
    const sel = selectedCode != null ? String(selectedCode) : '0';
    const parts = ['<option value="0">-- Project --</option>'];
    G_ProjectList.forEach(function (p) {
        const code = p.Code != null ? p.Code : 0;
        const name = (p.ProjectDesp || p.ProjectName || '').trim() || ('Project ' + code);
        parts.push('<option value="' + code + '"' + (String(code) === sel ? ' selected' : '') + '>' + escHtml(name) + '</option>');
    });
    return '<select class="form-control form-control-sm ee-ddl-project" data-index="' + index + '">' + parts.join('') + '</select>';
}

function buildSubProjectSelectHtml(projectMasterCode, selectedSubCode, index) {
    const pid = String(projectMasterCode != null ? projectMasterCode : 0);
    const ssel = selectedSubCode != null ? String(selectedSubCode) : '0';
    const parts = ['<option value="0">-- Sub Project --</option>'];
    G_SubProjectList
        .filter(function (sp) {
            return String(sp.ProjectMaster_Code != null ? sp.ProjectMaster_Code : sp.MasterProjectCode || 0) === pid;
        })
        .forEach(function (sp) {
            const code = sp.Code != null ? sp.Code : 0;
            const name = (sp.SubProjectDesp || sp.SubProjectName || '').trim() || ('Sub Project ' + code);
            parts.push('<option value="' + code + '"' + (String(code) === ssel ? ' selected' : '') + '>' + escHtml(name) + '</option>');
        });
    return '<select class="form-control form-control-sm ee-ddl-subproject" data-index="' + index + '">' + parts.join('') + '</select>';
}
var MarketingPersonName = param_MarketingMan_Name;
var MarketingManMaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Expense Entry Details");

    
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${dd}-${mm}-${yyyy}`;
    
    $('#txtEntryDate').val(currentDate);
    DatePicker();

    $('#txtMarketingManName').val(MarketingPersonName);
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {

        }
    });
    $('#ExpenseEntryDetails').on('keydown', '.txtExpendedAmount', function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            $(this).closest('tr').find('.txtRemarks').focus();
        }
    });

    $('#ExpenseEntryDetails').on('keydown', '.txtRemarks', function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            var nextRow = $(this).closest('tr').next();
            if (nextRow.length) {
                nextRow.find('.txtExpendedAmount').focus();
            }
        }
    });

    $('#ExpenseEntryDetails').on('change', '.ee-ddl-project', function () {
        var $row = $(this).closest('tr');
        var idx = $(this).data('index');
        var proj = parseInt($(this).val(), 10) || 0;
        var html = buildSubProjectSelectHtml(proj, 0, idx);
        $row.find('td').eq(Indx_Tbl.SubProject).html(html);
    });

    ExpenseEntryService.GetConfigExpenseEntryParameter()
        .then(function (cfg) {
            var row = Array.isArray(cfg) && cfg.length > 0 ? cfg[0] : (cfg || {});
            G_ProjectApplicable      = ((row.ProjectApplicable      || 'N') + '').trim().toUpperCase();
            G_LevelVerifyApplicable  = ((row.LevelVerifyApplicable  || 'N') + '').trim().toUpperCase();
            PopulateExpenseHeadDetails(param_ExpenseEntryMaster_Code);
        })
        .catch(function () {
            PopulateExpenseHeadDetails(param_ExpenseEntryMaster_Code);
        });

    $('#btnBack').click(function (e) {
        let MarketingPersonName = encodeURIComponent($("#txtMarketingManName").val());
        let FromDate = encodeURIComponent($("#txtFromDate").val());
        let ToDate = encodeURIComponent($("#txtToDate").val());

        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList?MarketingMan_Name=" + MarketingPersonName + "&FromDate=" + FromDate + "&ToDate=" + ToDate;
    });


    $('#btnSubmit').click(function (e) {
        SaveData();
    });
    $('#btnVerify').click(function (e) {
        VerifyExpenseEntryMaster();
    });

    $('#eeBtnConfirmCancel').on('click', function () { ApplyAmountExceedResponse(false); });
    $('#eeBtnConfirmProceed').on('click', function () { ApplyAmountExceedResponse(true); });

    DisableControls();
    ValidateMarketingPersonSenior();
});

function DisableControls() {
    if (param_Mode == 'View') {
        $('input, textarea').prop('disabled', true);
        $('#ExpenseEntryDetails select.ee-ddl-project, #ExpenseEntryDetails select.ee-ddl-subproject').prop('disabled', true);
        $("#btnBack").prop("disabled", false);
        $("#btnSubmit").hide();
        $("#btnVerify").hide();
    } else {
        $("#btnSubmit").show();
        $("#btnVerify").show();
    }
    if (param_ExpenseEntryMaster_Code > 0) {
        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
    } else {
        $("#ExpenseEntryDetails tbody tr").each(function () {
            var input = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ') input');
            input.prop('disabled', true);
        });
        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
    }
}
function PopulateExpenseHeadDetails(Code) {
    ExpenseEntryService.ExpenseEntry_ValidateMarketingPersonSenior(param_ExpenseEntryMaster_Code).then(function (seniorResponse) {
        var valid = '';
        if (seniorResponse && seniorResponse.length > 0) {
            valid = seniorResponse[0].Valid === 'N' ? 'disabled' : '';
        }
        return Promise.all([
            ProjectMasterService.GetProjectList(),
            SubProjectMasterService.GetSubProjectList(),
            ExpenseEntryService.GetExpenseEntryDetails(MarketingPersonName, Code)
        ]).then(function (results) {
            G_ProjectList = Array.isArray(results[0]) ? results[0] : [];
            G_SubProjectList = Array.isArray(results[1]) ? results[1] : [];
            var response = results[2];
            if (!response) {
                toastr.error('No Data Found');
                DisableControls();
                return;
            }
            var rawList = response.ExpenseEntryDetail || [];
            if (rawList.length > 0) {
                var detailData = rawList.map(function (item, index) {
                    var pm = Number(item.ProjectMaster_Code != null ? item.ProjectMaster_Code : 0) || 0;
                    var spm = Number(item.SubProjectMaster_Code != null ? item.SubProjectMaster_Code : 0) || 0;
                    return {
                        'Expense Head': item['Expense Head'],
                        'Designation Name': item['Designation Name'],
                        'Effective From': item['Effective From'],
                        'Per Day Limit': '<input type="number" id="txtPerDay" data-index="' + index + '" value="' + (item['Per Day Limit'] || 0) + '" class="bal-mt-input txtPerDay" readonly="readonly" autocomplete="off">',
                        'Project': buildProjectSelectHtml(pm, index),
                        'Sub Project': buildSubProjectSelectHtml(pm, spm, index),
                        'Allowed Amount': '<input type="number" id="txtAllowedAmount" data-index="' + index + '" value="' + (item['Allowed Amount'] || 0) + '" class="bal-mt-input txtAllowedAmount" readonly="readonly" autocomplete="off" style="text-align: right;">',
                        'Expense Amount': '<input type="number" id="txtExpendedAmount" data-index="' + index + '" value="' + (item['Expense Amount'] || 0) + '" class="bal-mt-input txtExpendedAmount" onfocusout="CalculateApprovedAmount(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
                        'Approved Amount': '<input type="number" ' + valid + ' id="txtApprovedAmount" data-index="' + index + '" value="' + (item['Approved Amount'] || 0) + '" class="bal-pc-input txtApprovedAmount" onfocusout="ApprovedAmountIncrease(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
                        'Remarks': '<input type="text" id="txtRemarks" data-index="' + index + '" value="' + (item['Remarks'] || '') + '" class="bal-mtrs-input txtRemarks" autocomplete="off" maxlength="16">',
                        'Attachment': '<a id="btnAttachment}" class="btn btn-success icon-height mb-1" title="Attachment" onclick="ViewAttachment(this)"><i class="fa fa-paperclip" aria-hidden="true"></i></a>',
                        'VerifyStatus': item['VerifyStatus'] !== undefined && item['VerifyStatus'] !== null ? item['VerifyStatus'] : '',
                        'ExpenseEntryDetail_Code': item['ExpenseEntryDetail_Code'] != null ? item['ExpenseEntryDetail_Code'] : 0,
                        'ExpenseHeadMaster_Code': '<input type="hidden" class="hdnExpenseHeadMasterCode" value="' + (item.ExpenseHeadMaster_Code != null ? item.ExpenseHeadMaster_Code : 0) + '" />'
                    };
                });
                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ['Designation Name', 'Per Day Limit', 'VerifyStatus', 'ExpenseEntryDetail_Code', 'ExpenseHeadMaster_Code', 'Attachment', 'Effective From'];
                if (G_ProjectApplicable !== 'Y') {
                    hiddenColumns.push('Project', 'Sub Project');
                }
                const ColumnAlignment = {
                    'Allowed Amount': 'center',
                    'Approved Amount': 'center',
                    'Effective From': 'center',
                    'Expense Amount': 'center',
                    'Remarks': 'center',
                    'Project': 'left',
                    'Sub Project': 'left'
                };
                BizsolCustomFilterGrid.CreateDataTable('ExpenseEntryDetails-header', 'ExpenseEntryDetails-body', detailData, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                $('#paginator-ExpenseEntryDetails').show();
            } else {
                ShowExpenseEntryDetailEmptyState();
            }
            if (response.ExpenseEntryMaster && response.ExpenseEntryMaster.length > 0) {
                $('#txtEntryNo').val(response.ExpenseEntryMaster[0].EntryNo);
                $('#txtEntryDate').val(response.ExpenseEntryMaster[0].EntryDate);
                $('#txtFromDate').val(response.ExpenseEntryMaster[0].FromDate);
                $('#txtToDate').val(response.ExpenseEntryMaster[0].ToDate);
                MarketingManMaster_Code = (response.ExpenseEntryMaster[0].MarketingManMaster_Code);
                CalculateTotalDays(MarketingManMaster_Code);
            } else {
                toastr.error('No Data Found');
            }
            DisableControls();
        }).catch(function () {
            toastr.error('Could not load expense entry details.');
            DisableControls();
        });
    }).catch(function () {
        toastr.error('Could not load expense entry details.');
        DisableControls();
    });
}
function ShowExpenseEntryDetailEmptyState() {
    var emptyRow = {
        "Expense Head": "", "Designation Name": "", "Effective From": "", "Per Day Limit": 0,
        "Project": "", "Sub Project": "",
        "Allowed Amount": 0, "Expense Amount": 0, "Approved Amount": 0, "Remarks": "",
        "Attachment": "", ExpenseEntryDetail_Code: 0, ExpenseHeadMaster_Code: 0
    };
    var hiddenColumns = ["Designation Name", "Per Day Limit", "VerifyStatus", "ExpenseEntryDetail_Code", "ExpenseHeadMaster_Code", "Attachment", "Effective From"];
    if (G_ProjectApplicable !== 'Y') {
        hiddenColumns.push('Project', 'Sub Project');
    }
    renderTableHeader(hiddenColumns, "ExpenseEntryDetails-header", "ExpenseEntryDetails-body", Object.keys(emptyRow), false, [], [], [], []);
    var colCount = Object.keys(emptyRow).length;
    $("#ExpenseEntryDetails-body").html('<tr class="expense-entry-empty-row"><td colspan="' + colCount + '"><span>No expense heads configured for this sales person</span></td></tr>');
    $("#paginator-ExpenseEntryDetails").hide();
}
function limitInputLength(elem, maxLength) {
    let value = elem.value;
    value = value.replace(/-/g, 0);
    if (value.length > maxLength) {
        value = value.slice(0, maxLength);
    }
    if (value.trim() === '') {
        value = '0';
    }
    elem.value = value;
}

function ViewAttachment(x) {
    var ObjCurrRow = $(x).closest('tr');
    var mode = param_Mode || "all";
    var ExpenseEntryDetail_Code = ObjCurrRow.find('td:eq(' + Indx_Tbl.ExpenseEntryDetail_Code + ')')[0].innerHTML.trim();
    InitAttachmentControl('ExpenseEntryMaster',param_ExpenseEntryMaster_Code , 'ExpenseEntryDetail', ExpenseEntryDetail_Code, 0, '', mode);
}

function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#ExpenseEntryDetail_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}

var G_AmountExceedRow = null;

function CalculateApprovedAmount(x) {
    var ApprovedAmount = 0;
    var ObjCurrRow = $(x).closest('tr');
    var AllowedAmount = ObjCurrRow.find('.txtAllowedAmount').val();
    var ExpendedAmount = ObjCurrRow.find('.txtExpendedAmount').val();
    ApprovedAmount = ExpendedAmount;
    if (parseFloat(AllowedAmount) < parseFloat(ExpendedAmount)) {
        ApprovedAmount = AllowedAmount;
        G_AmountExceedRow = ObjCurrRow;
        G_AmountExceedRow.data('allowedAmount', AllowedAmount);
        $('#eeConfirmBackdrop').addClass('show');
        return;
    }
    ObjCurrRow.find('.txtApprovedAmount').val(ApprovedAmount);
}

function ApplyAmountExceedResponse(proceed) {
    if (G_AmountExceedRow && G_AmountExceedRow.length) {
        var allowedAmount = G_AmountExceedRow.data('allowedAmount');
        G_AmountExceedRow.find('.txtApprovedAmount').val(allowedAmount);
        G_AmountExceedRow = null;
    }
    $('#eeConfirmBackdrop').removeClass('show');
}

function ShowExpenseEntryDetailSuccessModal(title, text, iconClass) {
    $('#eeSuccessModalTitle').text(title || "Done!");
    $('#eeSuccessModalText').text(text || "Operation completed successfully.");
    $('#eeSuccessModalIcon').removeClass().addClass('fas ' + (iconClass || 'fa-circle-check'));
    $('#eeSuccessBackdrop').addClass('show');
}

function CloseExpenseEntryDetailSuccessModal() {
    $('#eeSuccessBackdrop').removeClass('show');
}
function ApprovedAmountIncrease(x) {
    var ObjCurrRow = $(x).closest('tr');
    var allowedAmountIncrease = parseFloat(ObjCurrRow.find('.txtApprovedAmount').val()) || 0;
    var expendedAmountIncrease = parseFloat(ObjCurrRow.find('.txtExpendedAmount').val()) || 0;

    if (allowedAmountIncrease > expendedAmountIncrease) {
        ObjCurrRow.find('.txtApprovedAmount').val(expendedAmountIncrease);
        toastr.warning("Approved amount should be Less than Expended amount.");
    }
}


function setupDateInputFormatting() {
    $('#txtToDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDateFrom(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDateFrom(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtFromDate').val('');

        }

    } else {
        $('#txtFromDate').val('');

    }
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtToDate').val('');

        }

    } else {
        $('#txtToDate').val('');

    }
}
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtToDate, #txtFromDate').val(`${day}-${month}-${year}`);
    $('#txtToDate, #txtFromDate').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
    }).on('change', function () {
        CalculateTotalDays(MarketingManMaster_Code);

    });

}
function parseDate(dateStr) {
    var parts = dateStr.split('-');
    // dd-mm-yyyy format: parts[0]=day, parts[1]=month, parts[2]=year
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // JS Date months are 0-indexed
    var year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}
function CalculateTotalDays(MarketingManMaster_Code) {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();

    if (fromDate && toDate) {
        var fromDateObj = parseDate(fromDate);
        var toDateObj = parseDate(toDate);

        // Inclusive: same day = 1, 22nd to 24th = 3 days
        var timeDiff = toDateObj - fromDateObj;
        var totalDays = Math.round((timeDiff / (1000 * 3600 * 24)) + 1);

        if (totalDays >= 1) {
            $('#txtTotalDays').val(totalDays);

            // Call service once and apply allowed amount to each row
            ExpenseEntryService.CalculateAllowedAmount(
                MarketingManMaster_Code,
                convertDateFormat1(fromDate),
                convertDateFormat1(toDate)
            ).then(function (response) {
                if (response && response.length > 0) {
                    $('#ExpenseEntryDetails tbody tr').each(function () {
                        if ($(this).hasClass('expense-entry-empty-row')) return;
                        const $row = $(this);
                        if (!$row.find('.hdnExpenseHeadMasterCode').length) return;

                        // Get ExpenseHeadMaster_Code from hidden input or a reliable source
                        const rowCode = parseInt($row.find('.hdnExpenseHeadMasterCode').val(), 10);

                        // Find matching item from response
                        const matchedItem = response.find(function (item) {
                            return item.ExpenseHeadMaster_Code === rowCode;
                        });

                        if (matchedItem) {
                            $row.find('.txtAllowedAmount').val(matchedItem.TotalExpense);
                        } else {
                            $row.find('.txtAllowedAmount').val("0");
                        }
                    });
                } else {
                    console.warn('No allowed amounts found from API');
                }
            }).catch(function (err) {
                console.error("Error fetching allowed amounts:", err);
                toastr.error("Could not load allowed amounts.");
            });

        } else {
            toastr.error("Please select a valid range of dates.");
        }
    } else {
        toastr.error("Please select both dates.");
    }
}


function VerifyExpenseEntryMaster() {
    if (ValidateVerifyData() == false) {
        return false;
    }
    if (param_ExpenseEntryMaster_Code == 0) {
        toastr.warning("Oops! Please save your data first, then verify.");
        return false;
    }
    
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response != '') {
            MarketingManMaster_Code = response.Code;

        }

        var ExpenseEntryDetailsData = [];

        var ExpenseEntryMasterRow = {};
        ExpenseEntryMasterRow["Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
        ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
        ExpenseEntryMasterRow["MarketingManMaster_Code"] = parseInt(MarketingManMaster_Code, 10) || 0;
        ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
        ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

        $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
            if ($(this).hasClass('expense-entry-empty-row')) return;
            if (!$(this).find('.hdnExpenseHeadMasterCode').length) return;

            var ExpenseHead = 0;
            var Designation = '';
            var EffectiveFrom = '';
            var PerDayLimit = 0;
            var AllowedAmount = 0;
            var ExpenseAmount = 0;
            var ApprovedAmount = 0;
            var Remarks = '';
            var Attachment = '';
            var ExpenseHeadMaster_Code = 0;


            ExpenseHead = $(this).find('td:eq(' + Indx_Tbl.ExpenseHead + ')')[0].innerHTML.trim();
            Designation = $(this).find('td:eq(' + Indx_Tbl.Designation + ')')[0].innerHTML.trim();
            EffectiveFrom = $(this).find('td:eq(' + Indx_Tbl.EffectiveFrom + ')')[0].innerHTML.trim();
            PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
            AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
            ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
            ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
            Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
            Attachment = '';// $(this).find('td:eq(' + Indx_Tbl.Attachment + ')')[0].getElementsByTagName('input')[0].value;
            //ExpenseHeadMaster_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseHeadMaster_Code + ')')[0].innerHTML.trim();
            ExpenseHeadMaster_Code = parseInt($(this).find('.hdnExpenseHeadMasterCode').val(), 10) || 0;
            var projectMaster_Code    = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-project').val(), 10) || 0) : 0;
            var subProjectMaster_Code = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) : 0;

            var rowData = {};

            rowData["Code"] = normalizeDetailLineCode($(this));
            rowData["ExpenseEntryMaster_Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
            rowData["ExpenseHeadMaster_Code"] = ExpenseHeadMaster_Code;
            rowData["ProjectMaster_Code"] = projectMaster_Code;
            rowData["SubProjectMaster_Code"] = subProjectMaster_Code;
            rowData["AllowLimit"] = PerDayLimit;
            rowData["AllowAmount"] = ApprovedAmount;
            rowData["ExpendedAmount"] = ExpenseAmount;
            rowData["Remarks"] = Remarks;
            rowData["voucherMaster_Code"] = 0;
            rowData["finYear"] = '';
            rowData["createdBy"] = UserMaster_Code;
            rowData["createDate"] = new Date().toISOString().split("T")[0];
            rowData["updatedBy"] = UserMaster_Code;
            rowData["updateDate"] = new Date().toISOString().split("T")[0];
            rowData["TotalDays"] = $('#txtTotalDays').val();
            rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
            rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
            rowData["verifyStatus"] = "Y";
            rowData["verifyRejectedBy"] = UserMaster_Code;
            rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
            rowData["location"] = '';
            rowData["expendedThrough"] = 0;
            rowData["expendedOnBehalf"] = 0;
            rowData["amountToRecover"] = 0;

            ExpenseEntryDetailsData.push(rowData);
        });

        var allTablesData = buildExpenseEntryApiPayload(ExpenseEntryMasterRow, ExpenseEntryDetailsData);

        ExpenseEntryService.VerifyExpenseEntryMaster(allTablesData).then(function (response) {
            if (response && response.Status === 'N') {
                toastr.error(response.Msg);
            } else if (response && response.Status === 'Y') {
                ShowExpenseEntryDetailSuccessModal("Verified Successfully!", response.Msg || "Expense entry has been verified.", "fa-circle-check");
                setTimeout(function () {
                    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
                }, 2000);
            }
        });

    });

}

function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response!='') {
            MarketingManMaster_Code = response.Code;


            var ExpenseEntryDetailsData = [];

            var ExpenseEntryMasterRow = {};

            var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
            var UserMaster_Code = authKeyData.UserMaster_Code;

            ExpenseEntryMasterRow["Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
            ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
            ExpenseEntryMasterRow["MarketingManMaster_Code"] = parseInt(MarketingManMaster_Code, 10) || 0;
            ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
            ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

            $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
                if ($(this).hasClass('expense-entry-empty-row')) return;
                if (!$(this).find('.hdnExpenseHeadMasterCode').length) return;

                var PerDayLimit = 0;
                var AllowedAmount = 0;
                var ExpenseAmount = 0;
                var ApprovedAmount = 0;
                var Remarks = '';
                var ExpenseHeadMaster_Code = 0;

                PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
                AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
                ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
                Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseHeadMaster_Code = $(this).find('.hdnExpenseHeadMasterCode').val();
                var projectMaster_Code    = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-project').val(), 10) || 0) : 0;
                var subProjectMaster_Code = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) : 0;

                var rowData = {};

                rowData["Code"] = normalizeDetailLineCode($(this));
                rowData["ExpenseEntryMaster_Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
                rowData["ExpenseHeadMaster_Code"] = parseInt(ExpenseHeadMaster_Code, 10) || 0;
                rowData["ProjectMaster_Code"] = projectMaster_Code;
                rowData["SubProjectMaster_Code"] = subProjectMaster_Code;
                rowData["AllowLimit"] = PerDayLimit;
                rowData["AllowAmount"] = ApprovedAmount;
                rowData["ExpendedAmount"] = ExpenseAmount;
                rowData["Remarks"] = Remarks;
                rowData["voucherMaster_Code"] = 0;
                rowData["finYear"] = '';
                rowData["createdBy"] = UserMaster_Code;
                rowData["createDate"] = new Date().toISOString().split("T")[0];
                rowData["updatedBy"] = UserMaster_Code;
                rowData["updateDate"] = new Date().toISOString().split("T")[0];
                rowData["TotalDays"] = $('#txtTotalDays').val();
                rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
                rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
                rowData["verifyStatus"] = "N";
                rowData["verifyRejectedBy"] = 0;
                rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
                rowData["location"] = '';
                rowData["expendedThrough"] = 0;
                rowData["expendedOnBehalf"] = 0;
                rowData["amountToRecover"] = 0;

                ExpenseEntryDetailsData.push(rowData);
            });

            var allTablesData = buildExpenseEntryApiPayload(ExpenseEntryMasterRow, ExpenseEntryDetailsData);

            ExpenseEntryService.SaveExpenseEntryMaster(allTablesData).then(function (response) {
                if (response && response.Status === 'N') {
                    toastr.error(response.Msg);
                } else if (response && response.Status === 'Y') {
                    var Code = response.Code == undefined || response.Code == '' ? 0 : response.Code;
                    ShowExpenseEntryDetailSuccessModal("Saved Successfully!", response.Msg || "Expense entry has been saved.", "fa-circle-check");
                    setTimeout(function () {
                        const codes = window.btoa(Code);
                        var MarketingPersonName = window.btoa(param_MarketingMan_Name);
                        var Mode = window.btoa("Edit");
                        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
                    }, 2000);
                }
            });
        }
    });
}
function ValidateData() {
    var TotalDays = $('#txtTotalDays').val();
    var TotalAllowed = 0;
    var TotalApproved = 0;
    var TotalExp = 0;
    var EntryDateRange = $('#txtEntryDate').val();
    var FromDateRange = $('#txtFromDate').val();
    var ToDateRange = $('#txtToDate').val();

    if (EntryDateRange < FromDateRange || EntryDateRange < ToDateRange) {
        toastr.warning("Entry Date must be greater than both From Date and To Date");
        return false;
    }

    if (TotalDays < 0) {
        toastr.error("Please select a valid range of dates.");
        return false;
    }
    
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        if ($(this).hasClass('expense-entry-empty-row')) return;
        var $amtCell = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')');
        if (!$amtCell.length || !$amtCell[0].getElementsByTagName('input').length) return;
        var AllowedAmount = $amtCell[0].getElementsByTagName('input')[0].value;
        var ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
        var ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;

        TotalAllowed += parseFloat(AllowedAmount);
        TotalExp += parseFloat(ExpenseAmount);
        TotalApproved += parseFloat(ApprovedAmount);

    });
    if (TotalAllowed < 0) {
        toastr.error("Invalid Allowed Amount.");
        return false;
    }
    if (TotalExp < 0) {
        toastr.error("Invalid Expense Amount.");
        return false;
    }
    if (TotalApproved > TotalExp) {
        toastr.warning("Approved amount can not greater then expended amount");
        return false;
    }
    return true;
}

function ValidateVerifyData() {
    if (ValidateData() == false) {
        return false;
    }
    var TotalApprovedAmount = 0;
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        if ($(this).hasClass('expense-entry-empty-row')) return;
        var $ap = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')');
        if (!$ap.length || !$ap[0].getElementsByTagName('input').length) return;
        var ApprovedAmount = $ap[0].getElementsByTagName('input')[0].value;
        TotalApprovedAmount += parseFloat(ApprovedAmount);
    });

    if (TotalApprovedAmount <= 0) {
        toastr.error("Invalid Approved Amount.");
        return false;
    }
    return true;
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${monthAbbreviation}-${day}`;
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function ValidateMarketingPersonSenior() {
ExpenseEntryService.ExpenseEntry_ValidateMarketingPersonSenior(param_ExpenseEntryMaster_Code).then(function (response) {
    if (parseInt(param_ExpenseEntryMaster_Code) === 0) {
        $('#btnVerify').prop('disabled', true);
        return;
    }

    if (response && response.length > 0) {
        if (response[0].Valid == "Y") {
            $('#btnVerify').prop('disabled', false);
        } else {
            $('#btnVerify').prop('disabled', true);
        }
    }
    if (param_Mode == 'View' && param_ExpenseEntryMaster_Code > 0) {
        $("#btnVerify").prop("disabled", true);
    }
});
}

window.ViewAttachment = ViewAttachment;
window.CalculateApprovedAmount = CalculateApprovedAmount;
window.ApprovedAmountIncrease = ApprovedAmountIncrease;
window.SaveData = SaveData;
window.VerifyExpenseEntryMaster = VerifyExpenseEntryMaster;
window.limitInputLength = limitInputLength;
window.ApplyAmountExceedResponse = ApplyAmountExceedResponse;
window.CloseExpenseEntryDetailSuccessModal = CloseExpenseEntryDetailSuccessModal;