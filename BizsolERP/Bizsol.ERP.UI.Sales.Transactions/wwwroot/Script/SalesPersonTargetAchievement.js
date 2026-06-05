import { SalesPersonTargetAchievementService} from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_SalesPersonTargetAchievementService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_LastReportVm = null;

// Technical/internal columns hidden in EVERY report type.
const HIDDEN_REPORT_COLUMNS = [
    'Code',
    'MarketingManMaster_Code',
    'Report Period',
    'Monthly Target',
    'Target Type',
];

// Columns hidden ONLY in the Marketing Man & Party Wise (Party Detail) report.
// Other report types (e.g. "Weekly Marketing Man Wise Sales") keep these columns.
const PARTY_WISE_HIDDEN_COLUMNS = [
    'Weekly Target',
    'Achieved Sale',
];

// Party-wise section should show only: S.No, Marketing Executive, Party Name,
// Invoice Count, Total Qty, Total Sale Amount. Hide any target / achievement
// columns regardless of how the backend names them (Weekly/Monthly target, etc.).
const PARTY_WISE_HIDDEN_COLUMN_PATTERNS = [
    /target/,
    /achiev/,
];

// The target/achievement columns should only be hidden for the Party Wise report
// type (e.g. "Weekly Marketing Man And Party Wise Sales"). Other report types such
// as "Weekly Marketing Man Wise Sales" must keep all their columns.
function isPartyWiseReportSelected() {
    const label = (
        $('#ddlReportTypelist option:selected').text() ||
        $('#ddlReportTypelist').val() ||
        ''
    ).toLowerCase();
    return label.indexOf('party') !== -1;
}

function isHiddenReportColumn(key, hideTargets) {
    if (!key) return true;
    const normalized = String(key).trim().toLowerCase();
    if (HIDDEN_REPORT_COLUMNS.some(function (col) {
        return col.trim().toLowerCase() === normalized;
    })) {
        return true;
    }
    if (hideTargets) {
        if (PARTY_WISE_HIDDEN_COLUMNS.some(function (col) {
            return col.trim().toLowerCase() === normalized;
        })) {
            return true;
        }
        if (PARTY_WISE_HIDDEN_COLUMN_PATTERNS.some(function (re) {
            return re.test(normalized);
        })) {
            return true;
        }
    }
    return false;
}

function isSerialColumn(key) {
    const k = String(key).trim().toLowerCase().replace(/[\s.]/g, '');
    return k === 'sno' || k === 'srno' || k === 'serialno' || k === 'slno';
}

function isNumericValue(value) {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number' && isFinite(value)) return true;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return !isNaN(n) && isFinite(n);
}

/** Detect columns where every non-empty cell is numeric (filter.js total row uses these). */
function getNumericColumnsFromData(data, hideTargets) {
    if (!data || data.length === 0) return [];

    const headers = Object.keys(data[0]).filter(function (key) {
        return !isHiddenReportColumn(key, hideTargets);
    });

    return headers.filter(function (key) {
        if (isSerialColumn(key)) return false;

        let hasValue = false;
        for (let i = 0; i < data.length; i++) {
            const v = data[i][key];
            if (v === null || v === undefined || v === '') continue;
            hasValue = true;
            if (!isNumericValue(v)) return false;
        }
        return hasValue;
    });
}

function getTotalColumnsFromData(data, hideTargets) {
    return getNumericColumnsFromData(data, hideTargets).filter(function (key) {
        const k = String(key).toLowerCase();
        if (k.indexOf('code') !== -1) return false;
        if (/%/.test(key)) return false;
        return true;
    });
}

/** Numeric columns where every non-empty value is a whole number (no fractional part). */
function getIntegerColumnsFromData(data, hideTargets) {
    return getNumericColumnsFromData(data, hideTargets).filter(function (key) {
        for (let i = 0; i < data.length; i++) {
            const v = data[i][key];
            if (v === null || v === undefined || v === '') continue;
            const n = parseFloat(String(v).replace(/,/g, ''));
            if (isNaN(n) || !isFinite(n)) continue;
            if (n % 1 !== 0) return false;
        }
        return true;
    });
}

/** Build per-column decimal config: integer columns -> 0 decimals, others -> 2. */
function buildFixedDecimalsFromData(data, hideTargets) {
    const config = {};
    if (!data || data.length === 0) return config;
    const numericCols = getNumericColumnsFromData(data, hideTargets);
    const integerCols = getIntegerColumnsFromData(data, hideTargets);
    numericCols.forEach(function (key) {
        config[key] = integerCols.indexOf(key) >= 0 ? 0 : 2;
    });
    return config;
}

function asList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'value', 'Value'];
    for (let i = 0; i < keys.length; i++) {
        const v = response[keys[i]];
        if (Array.isArray(v)) return v;
    }
    return [];
}
function BindSelectList(element, list, FirstItem) {
    let option = '';
    if (FirstItem === 'FirstItemAll') {
        option = '<option value="All">All</option>';
    } else if (FirstItem === 'FirstItemSelected') {
        option = '';
    } else {
        option = '<option value="0"></option>';
    }
    $.each(list, function (_key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function initSelect2($el) {
    if (!$el || !$el.length) return;
    if ($el.data('select2')) {
        $el.select2('destroy');
    }
    $el.select2({
        width: '-webkit-fill-available',
        matcher: function (params, data) {
            if ($.trim(params.term) === '') {
                return data;
            }
            if (data.text && data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                return data;
            }
            return null;
        },
    });
}

$(document).ready(function () {
    $('#divReportSections').hide();
    var urlParams = BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['ModuleDesp']);
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Sales Person Target Achievement");
    }
    LoadWeekDateRange();
    GetNestedMarketingManList();
    GetReportTypeList();

    $('#btnShow').click(function () {
        if (!validateFilters()) return;
        $(this).prop('hidden', true);
        $('#btnLoading').prop('hidden', false);
        GetReportData();
    });

    $('#btnDownload').click(function () {
        Export();
    });
});
function validateFilters() {
    const fromVal = $('#txtdateFrom').val();
    const toVal = $('#txtdateTo').val();
    if (!fromVal) {
        toastr.warning('Please enter From Date.');
        $('#txtdateFrom').focus();
        return false;
    }
    if (!toVal) {
        toastr.warning('Please enter To Date.');
        $('#txtdateTo').focus();
        return false;
    }
    const mode = $('#ddlReportTypelist').val();
    if (!mode) {
        toastr.warning('Please select Report Type (Mode).');
        $('#ddlReportTypelist').focus();
        return false;
    }
    return true;
}
const MARKETING_MAN_MAX_RETRIES = 4;
const MARKETING_MAN_RETRY_DELAY_MS = 600;

function isAuthKeyReady() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return !!(authKey && authKey.UserMaster_Code);
    } catch (e) {
        return false;
    }
}

function GetNestedMarketingManList(attempt) {
    attempt = attempt || 0;

    // The marketing-man API depends on authKey in sessionStorage. On a quick page
    // refresh it can still be initializing, so wait and retry instead of failing.
    if (!isAuthKeyReady()) {
        if (attempt < MARKETING_MAN_MAX_RETRIES) {
            setTimeout(function () {
                GetNestedMarketingManList(attempt + 1);
            }, MARKETING_MAN_RETRY_DELAY_MS);
        } else {
            $('#ddlMarketingMan').empty();
            toastr.error('Unable to load marketing man list. Please refresh the page.');
        }
        return;
    }

    SalesPersonTargetAchievementService.GetNestedMarketingManList()
        .then(function (response) {
            const rows = asList(response);
            if (rows.length > 0) {
                let matchedCode = null;
                let userMaster_Code = null;
                try {
                    const authKey = JSON.parse(sessionStorage.getItem('authKey'));
                    userMaster_Code = authKey ? authKey.UserMaster_Code : null;
                } catch (e) {
                    userMaster_Code = null;
                }

                const list = rows
                    .filter(function (item) {
                        return item && item.PersonName;
                    })
                    .map(function (item) {
                        const userCode = item.Usermaster_Code ?? item.UserMaster_Code;
                        if (userMaster_Code && userCode == userMaster_Code) {
                            matchedCode = item.Code;
                        }
                        return { Code: item.Code, Desp: item.PersonName };
                    });

                const $ddl = $('#ddlMarketingMan');
                BindSelectList($ddl[0], list, 'FirstItemAll');
                initSelect2($ddl);

                if (matchedCode != null && matchedCode !== '') {
                    $ddl.val(String(matchedCode)).trigger('change');
                }
            } else if (attempt < MARKETING_MAN_MAX_RETRIES) {
                // Empty response on refresh is usually transient; retry before erroring.
                setTimeout(function () {
                    GetNestedMarketingManList(attempt + 1);
                }, MARKETING_MAN_RETRY_DELAY_MS);
            } else {
                $('#ddlMarketingMan').empty();
                toastr.error('No marketing man data found.');
            }
        })
        .catch(function (error) {
            console.error('Error fetching nested marketing man list:', error);
            if (attempt < MARKETING_MAN_MAX_RETRIES) {
                setTimeout(function () {
                    GetNestedMarketingManList(attempt + 1);
                }, MARKETING_MAN_RETRY_DELAY_MS);
            } else {
                $('#ddlMarketingMan').empty();
                toastr.error('Error loading marketing man list.');
            }
        });
}
function reportTypeLabel(row) {
    return (
        row.DisplayName ??
        row.displayName ??
        row.Desp ??
        row.desp ??
        row.FieldValue ??
        row.ReportType ??
        ''
    ).toString();
}

function GetReportTypeList() {
    SalesPersonTargetAchievementService.GetReportTypeList($("#ERPHeading").text())
        .then(function (response) {
            const rows = asList(response);
            if (rows.length > 0) {
                const $ddl = $('#ddlReportTypelist');
                const list = rows
                    .map(function (item) {
                        const label = reportTypeLabel(item);
                        if (!label) return null;
                        return { Code: label, Desp: label };
                    })
                    .filter(Boolean);

                if (list.length > 0) {
                    BindSelectList($ddl[0], list, 'FirstItemSelected');
                    initSelect2($ddl);
                } else {
                    $ddl.empty();
                    toastr.warning('No report types found.');
                }
            } else {
                $('#ddlReportTypelist').empty();
                toastr.warning('No report types found.');
            }
        })
        .catch(function (error) {
            console.error('Error fetching report type list:', error);
            $('#ddlReportTypelist').empty();
            toastr.error('Error loading report types.');
        });
}
function parseReportVm(response) {
    if (response == null) {
        return {
            reportPeriod: '',
            partyDetail: [],
            executiveSummary: [],
            grandTotal: [],
        };
    }
    if (Array.isArray(response)) {
        return {
            reportPeriod: '',
            partyDetail: response,
            executiveSummary: [],
            grandTotal: [],
        };
    }
    return {
        reportPeriod: (response.reportPeriod ?? response.ReportPeriod ?? '').toString(),
        partyDetail: asList(response.partyDetail ?? response.PartyDetail),
        executiveSummary: asList(response.executiveSummary ?? response.ExecutiveSummary),
        grandTotal: asList(response.grandTotal ?? response.GrandTotal),
    };
}

function hasAnyReportData(vm) {
    if (!vm) return false;
    return (
        vm.partyDetail.length > 0 ||
        vm.executiveSummary.length > 0 ||
        vm.grandTotal.length > 0
    );
}

function renderReportGrid(config) {
    const data = config.data || [];
    const $section = $(config.sectionId);
    const $noData = $(config.noDataId);
    const $paginator = $(config.paginatorId);

    $('#' + config.headerId).empty();
    $('#' + config.bodyId).empty();
    $paginator.empty().hide();

    if (data.length === 0) {
        $section.hide();
        $noData.hide();
        return;
    }

    $section.show();
    $noData.hide();

    const gridOpts = buildGridOptionsFromData(data, config.hideTargets);
    BizsolCustomFilterGrid.CreateDataTable(
        config.headerId,
        config.bodyId,
        data,
        false,
        [],
        gridOpts.StringFilterColumn,
        gridOpts.NumericFilterColumn,
        [],
        [],
        gridOpts.hiddenColumns,
        gridOpts.ColumnAlignment,
        true,
        gridOpts.TotalColumns,
        gridOpts.FixedDecimals
    );
    $paginator.show();
}

function bindReportGrids(vm) {
    const hidePartyTargets = isPartyWiseReportSelected();
    renderReportGrid({
        sectionId: '#secPartyDetail',
        noDataId: '#noPartyDetail',
        paginatorId: '#paginator-tblPartyDetail',
        headerId: 'tblPartyDetail-header',
        bodyId: 'tblPartyDetail-body',
        data: vm.partyDetail,
        hideTargets: hidePartyTargets,
    });
    renderReportGrid({
        sectionId: '#secExecutiveSummary',
        noDataId: '#noExecutiveSummary',
        paginatorId: '#paginator-tblExecutiveSummary',
        headerId: 'tblExecutiveSummary-header',
        bodyId: 'tblExecutiveSummary-body',
        data: vm.executiveSummary,
    });
    renderReportGrid({
        sectionId: '#secGrandTotal',
        noDataId: '#noGrandTotal',
        paginatorId: '#paginator-tblGrandTotal',
        headerId: 'tblGrandTotal-header',
        bodyId: 'tblGrandTotal-body',
        data: vm.grandTotal,
    });
}

function buildGridOptionsFromData(data, hideTargets) {
    const hiddenColumns = HIDDEN_REPORT_COLUMNS.slice();
    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const ColumnAlignment = {};
    const numericCols = getNumericColumnsFromData(data, hideTargets);
    const TotalColumns = getTotalColumnsFromData(data, hideTargets);
    const FixedDecimals = buildFixedDecimalsFromData(data, hideTargets);

    if (data && data.length > 0) {
        Object.keys(data[0]).forEach(function (key) {
            if (isHiddenReportColumn(key, hideTargets)) {
                if (hiddenColumns.indexOf(key) < 0) hiddenColumns.push(key);
                return;
            }
            if (numericCols.indexOf(key) >= 0) {
                NumericFilterColumn.push(key);
                ColumnAlignment[key] = 'right';
            } else {
                StringFilterColumn.push(key);
            }
        });
    }

    return {
        StringFilterColumn,
        NumericFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        TotalColumns,
        FixedDecimals,
    };
}

function GetReportData() {
    const fromDate = convertDateFormat($('#txtdateFrom').val());
    const toDate = convertDateFormat($('#txtdateTo').val());
    const mode = $('#ddlReportTypelist').val() || 'Week';
    const marketingManMaster_Code =
        $('#ddlMarketingMan option:selected').val() == 'All' ? 0 : $('#ddlMarketingMan option:selected').val();

    SalesPersonTargetAchievementService.GetRptTargetVsAchievement(
        fromDate,
        toDate,
        mode,
        marketingManMaster_Code
    )
        .then(function (response) {
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);

            const vm = parseReportVm(response);
            G_LastReportVm = vm;

            if (hasAnyReportData(vm)) {
                $('#divReportSections').show();
                bindReportGrids(vm);
            } else {
                $('#divReportSections').hide();
                G_LastReportVm = null;
                toastr.error('Record not found...!');
            }
        })
        .catch(function (error) {
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);
            console.error('Error fetching report:', error);
            toastr.error('Unable to load report. Please try again.');
        });
}
function convertDateFormat(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day} -${monthAbbreviation} -${year}`;
}
function normalizeIsoDateForInput(value) {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.substring(0, 10);
    }
    return s;
}

function extractWeekDateRangeRow(response) {
    if (response == null) return null;
    if (Array.isArray(response)) {
        return response.length > 0 ? response[0] : null;
    }
    if (response.WeekStartDate != null || response.weekStartDate != null) {
        return response;
    }
    const list = asList(response);
    return list.length > 0 ? list[0] : null;
}

function setWeekDates(weekStartDate, weekEndDate) {
    const from = normalizeIsoDateForInput(weekStartDate);
    const to = normalizeIsoDateForInput(weekEndDate);
    $('#txtdateFrom').val(from);
    $('#txtdateTo').val(to);
}

function LoadWeekDateRange() {
    SalesPersonTargetAchievementService.GetWeekDateRange()
        .then(function (response) {
            const row = extractWeekDateRangeRow(response);
            if (!row) {
                toastr.error('Week date range not available.');
                return;
            }
            const weekStart = row.WeekStartDate ?? row.weekStartDate;
            const weekEnd = row.WeekEndDate ?? row.weekEndDate;
            if (!weekStart || !weekEnd) {
                toastr.error('Week date range not available.');
                return;
            }
            setWeekDates(weekStart, weekEnd);
        })
        .catch(function (error) {
            console.error('Error fetching week date range:', error);
            toastr.error('Unable to load week date range.');
        });
}
function getPdfMake() {
    return window.pdfMake || window.pdfmake || null;
}

function formatPdfCell(value, decimals) {
    if (value === null || value === undefined) return '';
    if (isNumericValue(value)) {
        const n = parseFloat(String(value).replace(/,/g, ''));
        const d = decimals != null ? decimals : 2;
        return n.toFixed(d);
    }
    return String(value);
}

const PDF_NAVY = '#16284d';
const PDF_HEADER_FILL = '#1b2c52';
const PDF_TOTAL_FILL = '#eef2f8';
const PDF_BORDER = '#c8d0dd';

function formatPdfDisplayDate(isoDate) {
    if (!isoDate) return '';
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) return isoDate;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1], 10);
    if (isNaN(m) || m < 1 || m > 12) return isoDate;
    return parts[2] + '-' + monthNames[m - 1] + '-' + parts[0];
}

function buildPdfTableSection(title, data, options) {
    options = options || {};
    const hideTargets = options.hideTargets;
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]).filter(function (key) {
        return !isHiddenReportColumn(key, hideTargets);
    });
    if (headers.length === 0) return null;

    const numericCols = getNumericColumnsFromData(data, hideTargets);
    const integerCols = getIntegerColumnsFromData(data, hideTargets);
    const totalCols = getTotalColumnsFromData(data, hideTargets);
    const totals = {};
    totalCols.forEach(function (col) {
        totals[col] = 0;
    });

    const headerRow = headers.map(function (h) {
        return {
            text: h,
            style: 'tableHeader',
            fillColor: PDF_HEADER_FILL,
            color: '#ffffff',
            alignment: 'center',
            margin: [0, 3, 0, 3],
        };
    });

    const bodyRows = data.map(function (row) {
        return headers.map(function (h) {
            const v = row[h];
            if (totalCols.indexOf(h) >= 0) {
                const n = parseFloat(String(v).replace(/,/g, ''));
                if (!isNaN(n) && isFinite(n)) totals[h] += n;
            }
            if (isSerialColumn(h)) {
                return {
                    text: formatPdfCell(v, 0),
                    alignment: 'center',
                    margin: [0, 2, 0, 2],
                };
            }
            return {
                text: integerCols.indexOf(h) >= 0 ? formatPdfCell(v, 0) : formatPdfCell(v),
                alignment: numericCols.indexOf(h) >= 0 ? 'right' : 'left',
                margin: [0, 2, 0, 2],
            };
        });
    });

    let totalRowIndex = -1;
    if (!options.skipTotalRow && totalCols.length > 0) {
        const labelIdx = headers.findIndex(function (h) {
            return !isSerialColumn(h) && totalCols.indexOf(h) < 0;
        });
        const totalLabelIdx = labelIdx >= 0 ? labelIdx : 0;
        const totalRow = headers.map(function (h, idx) {
            const cell = {
                bold: true,
                color: PDF_NAVY,
                alignment: numericCols.indexOf(h) >= 0 ? 'right' : 'left',
                margin: [0, 2, 0, 2],
            };
            if (totalCols.indexOf(h) >= 0) {
                cell.text = integerCols.indexOf(h) >= 0 ? formatPdfCell(totals[h], 0) : formatPdfCell(totals[h], 2);
            } else if (idx === totalLabelIdx) {
                cell.text = 'Total';
            } else {
                cell.text = '';
            }
            return cell;
        });
        bodyRows.push(totalRow);
        totalRowIndex = bodyRows.length - 1;
    }

    const block = [];
    if (title) {
        block.push({ text: title, style: 'sectionTitle', margin: [0, 14, 0, 5] });
    }
    block.push({
        table: {
            headerRows: 1,
            widths: headers.map(function (h) {
                return isSerialColumn(h) ? 34 : '*';
            }),
            body: [headerRow].concat(bodyRows),
        },
        layout: {
            fillColor: function (rowIndex) {
                if (rowIndex === 0) return null;
                if (rowIndex - 1 === totalRowIndex) return PDF_TOTAL_FILL;
                return null;
            },
            hLineWidth: function () {
                return 0.6;
            },
            vLineWidth: function () {
                return 0.6;
            },
            hLineColor: function () {
                return PDF_BORDER;
            },
            vLineColor: function () {
                return PDF_BORDER;
            },
            paddingTop: function () {
                return 3;
            },
            paddingBottom: function () {
                return 3;
            },
            paddingLeft: function () {
                return 6;
            },
            paddingRight: function () {
                return 6;
            },
        },
    });
    return block;
}

function buildPdfDocumentDefinition(vm) {
    const content = [];
    const reportType = $('#ddlReportTypelist option:selected').text() || '';
    const fromDate = $('#txtdateFrom').val() || '';
    const toDate = $('#txtdateTo').val() || '';

    if (reportType) {
        content.push({ text: reportType, style: 'docSubtitle' });
    }

    let periodText = vm.reportPeriod || '';
    if (!periodText && fromDate && toDate) {
        periodText = formatPdfDisplayDate(fromDate) + ' to ' + formatPdfDisplayDate(toDate);
    }
    if (periodText) {
        content.push({
            text: [
                { text: 'Report Period: ', bold: true, color: PDF_NAVY },
                { text: periodText, color: '#3a3f4b' },
            ],
            fontSize: 9,
            margin: [0, 6, 0, 2],
        });
    }

    const sections = [
        { title: '', data: vm.partyDetail, skipTotalRow: false, hideTargets: isPartyWiseReportSelected() },
        { title: 'Marketing Executive Summary', data: vm.executiveSummary, skipTotalRow: false },
        { title: 'Grand Total', data: vm.grandTotal, skipTotalRow: true },
    ];

    sections.forEach(function (sec) {
        const block = buildPdfTableSection(sec.title, sec.data, {
            skipTotalRow: sec.skipTotalRow,
            hideTargets: sec.hideTargets,
        });
        if (block) content.push.apply(content, block);
    });

    return {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [28, 28, 28, 42],
        content: content,
        styles: {
            docTitle: { fontSize: 16, bold: true, color: PDF_NAVY },
            docSubtitle: { fontSize: 13, bold: true, color: PDF_NAVY },
            sectionTitle: { fontSize: 11, bold: true, color: PDF_NAVY },
            tableHeader: { fontSize: 8, bold: true },
        },
        defaultStyle: { fontSize: 8, color: '#3a3f4b' },
        footer: function (currentPage, pageCount) {
            return {
                margin: [28, 8, 28, 0],
                columns: [
                    { text: 'BizSol ERP', fontSize: 7.5, color: '#9aa3b2' },
                    {
                        text: 'Page ' + currentPage + ' of ' + pageCount,
                        alignment: 'right',
                        fontSize: 7.5,
                        color: '#9aa3b2',
                    },
                ],
            };
        },
    };
}

function getExportFileName() {
    const reportType = ($('#ddlReportTypelist option:selected').text() || 'Report').replace(/\s+/g, '_');
    const d = new Date();
    const dateString =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        '_' +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0');
    return 'SalesPersonTargetAchievement_' + reportType + '_' + dateString + '.pdf';
}

function Export() {
    if (!G_LastReportVm || !hasAnyReportData(G_LastReportVm)) {
        toastr.warning('No data to download. Please run Show first.');
        return;
    }

    const pdfMake = getPdfMake();
    if (!pdfMake || typeof pdfMake.createPdf !== 'function') {
        toastr.error('PDF library is not loaded. Please refresh the page.');
        return;
    }

    try {
        const docDefinition = buildPdfDocumentDefinition(G_LastReportVm);
        pdfMake.createPdf(docDefinition).download(getExportFileName());
        toastr.success('PDF download started.');
    } catch (err) {
        console.error('PDF export failed:', err);
        toastr.error('Unable to generate PDF.');
    }
}
window.Export = Export;
window.BindSelectList = BindSelectList;
