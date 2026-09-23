import { DealerTargetMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DealerTargetMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_DealerTargetReport = [];
let G_DealerTargetReportView = [];

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];

    const named = ['data', 'Data', 'result', 'Result', 'table', 'Table', 'items', 'Items', '$values'];
    for (let i = 0; i < named.length; i++) {
        if (Array.isArray(payload[named[i]])) return payload[named[i]];
    }

    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
        const value = payload[keys[i]];
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            return value;
        }
    }
    return [];
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return year + '-' + month + '-' + day;
}

function formatDisplayDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function rowNumber(row, names) {
    if (!row) return 0;
    const keys = Object.keys(row);
    for (let i = 0; i < names.length; i++) {
        const wanted = String(names[i]).replace(/\s+/g, '').toLowerCase();
        for (let k = 0; k < keys.length; k++) {
            if (String(keys[k]).replace(/\s+/g, '').toLowerCase() === wanted) {
                return Number(row[keys[k]]) || 0;
            }
        }
    }
    return 0;
}

function rowText(row, names) {
    if (!row) return '';
    const keys = Object.keys(row);
    for (let i = 0; i < names.length; i++) {
        const wanted = String(names[i]).replace(/\s+/g, '').toLowerCase();
        for (let k = 0; k < keys.length; k++) {
            if (String(keys[k]).replace(/\s+/g, '').toLowerCase() === wanted) {
                return String(row[keys[k]] || '').trim();
            }
        }
    }
    return '';
}

function SetDate() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(formatDate(firstOfMonth));
    $('#txtToDate').val(formatDate(today));
    UpdatePeriodLabel();
}

function UpdatePeriodLabel() {
    const fromDate = $('#txtFromDate').val();
    const toDate = $('#txtToDate').val();
    if (fromDate && toDate) {
        $('#dtrPeriodLabel').text(formatDisplayDate(fromDate) + '  –  ' + formatDisplayDate(toDate));
        return;
    }
    $('#dtrPeriodLabel').text('Select a date range');
}

function setShowLoading(isLoading) {
    const $btn = $('#btnShow');
    $btn.prop('disabled', isLoading);
    $('#btnShowText').text(isLoading ? 'Loading...' : 'Show');
}

function UpdateSummary(rows) {
    const dealerCount = rows.length;
    let monthlyTarget = 0;
    let perDayTarget = 0;
    let totalSale = 0;
    let perDaySale = 0;
    const parties = {};

    rows.forEach(function (row) {
        monthlyTarget += rowNumber(row, ['Monthly Target']);
        perDayTarget += rowNumber(row, ['Per Day Target']);
        totalSale += rowNumber(row, ['Total Sale (Actual)', 'Total Sale']);
        perDaySale += rowNumber(row, ['Per Day Sale (Actual)', 'Per Day Sale']);
        const party = rowText(row, ['Party Name']);
        if (party) parties[party] = true;
    });

    const achievement = monthlyTarget > 0 ? (totalSale / monthlyTarget) * 100 : 0;
    const partyCount = Object.keys(parties).length;
    const barWidth = Math.max(0, Math.min(achievement, 100));

    $('#kpiDealers').text(formatNumber(dealerCount));
    $('#kpiPartyCount').text(partyCount + (partyCount === 1 ? ' party' : ' parties'));
    $('#kpiMonthlyTarget').text(formatNumber(monthlyTarget));
    $('#kpiPerDayTarget').text('Per day ' + formatNumber(perDayTarget));
    $('#kpiTotalSale').text(formatNumber(totalSale));
    $('#kpiPerDaySale').text('Per day ' + formatNumber(perDaySale));
    $('#kpiAchievement').text(formatNumber(achievement) + '%');
    $('#kpiAchievementBar').css('width', barWidth + '%');
    $('#dtrKpiAchv').removeClass('is-good is-low');
    if (achievement >= 80) {
        $('#dtrKpiAchv').addClass('is-good');
    } else if (achievement < 40) {
        $('#dtrKpiAchv').addClass('is-low');
    }
    $('#dtrRecordCount').text(dealerCount + (dealerCount === 1 ? ' record' : ' records'));
}

function rowSearchText(row) {
    return [
        rowText(row, ['MKT Person', 'Marketing Person', 'Sales Person']),
        rowText(row, ['Party Name']),
        rowText(row, ['Location', 'CityName', 'City']),
        rowText(row, ['Dealer Name', 'DealerName'])
    ].join(' ').toLowerCase();
}

function enhanceReportRows(rows) {
    return (rows || []).map(function (row) {
        const enhanced = Object.assign({}, row);
        const target = rowNumber(row, ['Monthly Target']);
        const sale = rowNumber(row, ['Total Sale (Actual)', 'Total Sale']);
        const achievement = target > 0 ? (sale / target) * 100 : 0;
        if (enhanced['Achievement %'] === undefined && enhanced.Achievement === undefined) {
            enhanced['Achievement %'] = Number(achievement.toFixed(2));
        }
        enhanced._search = rowSearchText(enhanced);
        return enhanced;
    });
}

function filterReportRows(rows) {
    const term = ($('#txtDealerTargetReportSearch').val() || '').trim().toLowerCase();
    if (!term) return rows || [];
    return (rows || []).filter(function (row) {
        return (row._search || '').indexOf(term) !== -1;
    });
}

function BindDealerTargetReport(rows) {
    const visible = filterReportRows(rows);
    if (!visible.length) {
        $('#DealerTargetReport-header').empty();
        $('#DealerTargetReport-body').empty();
        $('#paginator-DealerTargetReport').empty();
        $('#dtrRecordCount').text('0 of ' + rows.length + (rows.length === 1 ? ' record' : ' records'));
        return;
    }
    if (visible.length !== rows.length) {
        $('#dtrRecordCount').text(visible.length + ' of ' + rows.length + (rows.length === 1 ? ' record' : ' records'));
    } else {
        $('#dtrRecordCount').text(rows.length + (rows.length === 1 ? ' record' : ' records'));
    }

    const stringFilterColumn = ['MKT Person', 'Party Name', 'Location', 'Dealer Name'];
    const numericFilterColumn = ['Avg Cost Per Crate', 'Monthly Target', 'Per Day Target', 'Total Sale (Actual)', 'Per Day Sale (Actual)', 'Achievement %'];
    const dateFilterColumn = [];
    const button = false;
    const showButtons = [];
    const stringDoubleFilterColumn = [];
    const hiddenColumns = [
        'Code', 'DealerMaster_Code', 'AccountMaster_Code', 'CityMaster_Code',
        'StateMaster_Code', 'MarketingManMaster_Code', 'DealerTargetMaster_Code', '_search'
    ];
    const columnAlignment = {
        'Avg Cost Per Crate': 'right',
        'Monthly Target': 'right',
        'Per Day Target': 'right',
        'Total Sale (Actual)': 'right',
        'Per Day Sale (Actual)': 'right',
        'Achievement %': 'right'
    };

    BizsolCustomFilterGrid.CreateDataTable(
        'DealerTargetReport-header',
        'DealerTargetReport-body',
        visible,
        button,
        showButtons,
        stringFilterColumn,
        numericFilterColumn,
        dateFilterColumn,
        stringDoubleFilterColumn,
        hiddenColumns,
        columnAlignment
    );

    window.itemsPerPage_DealerTargetReport = 25;
    if (typeof window.renderTableWithPagination === 'function') {
        window.renderTableWithPagination('DealerTargetReport', 'DealerTargetReport-body');
    }
}

function ShowEmptyState() {
    G_DealerTargetReport = [];
    G_DealerTargetReportView = [];
    $('#tblDealerTargetReport').hide();
    $('#dtrKpiRow').hide();
    $('#dtrEmptyState').show();
    $('#btnDownload').prop('disabled', true);
    $('#txtDealerTargetReportSearch').val('');
}

function ShowGrid() {
    $('#dtrEmptyState').hide();
    $('#dtrKpiRow').show();
    $('#tblDealerTargetReport').show();
    $('#btnDownload').prop('disabled', false);
}

function ShowData() {
    const FromDate = $('#txtFromDate').val();
    const ToDate = $('#txtToDate').val();

    if (!FromDate) {
        toastr.error('Please enter From Date');
        $('#txtFromDate').focus();
        return;
    }
    if (!ToDate) {
        toastr.error('Please enter To Date');
        $('#txtToDate').focus();
        return;
    }
    if (new Date(ToDate) < new Date(FromDate)) {
        toastr.error('To Date cannot be before From Date');
        $('#txtToDate').focus();
        return;
    }

    UpdatePeriodLabel();
    setShowLoading(true);
    if (typeof window.Showloader === 'function') window.Showloader();
    DealerTargetMasterService.GetDealerTargetReport(FromDate, ToDate).then(function (response) {
        const status = response && (response.Status || response.status);
        const msg = response && (response.Msg || response.msg || response.message);
        const rows = firstPayloadArray(response);
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);

        if (status && String(status).toUpperCase() === 'N') {
            ShowEmptyState();
            toastr.error(msg || 'No Data Found');
            return;
        }

        if (!rows.length) {
            ShowEmptyState();
            toastr.error(msg || 'No Data Found');
            return;
        }

        G_DealerTargetReport = enhanceReportRows(rows);
        G_DealerTargetReportView = G_DealerTargetReport;
        UpdateSummary(G_DealerTargetReport);
        ShowGrid();
        BindDealerTargetReport(G_DealerTargetReport);
    }).catch(function (error) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);
        ShowEmptyState();
        toastr.error((error && (error.Msg || error.message)) || 'Failed to load Dealer Target Report.');
    });
}

function Download() {
    if (!G_DealerTargetReport.length) {
        toastr.error('No data to export.');
        return;
    }
    const hiddenFields = [
        'Code', 'DealerMaster_Code', 'AccountMaster_Code', 'CityMaster_Code',
        'StateMaster_Code', 'MarketingManMaster_Code', 'DealerTargetMaster_Code', '_search'
    ];
    ExportToExcelControl.ExportToExcel(G_DealerTargetReport, hiddenFields, 'DealerTargetReport');
}

function ResetReport() {
    SetDate();
    ShowEmptyState();
    $('#DealerTargetReport-header').empty();
    $('#DealerTargetReport-body').empty();
    $('#paginator-DealerTargetReport').empty();
}

$(document).ready(function () {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.setHeadingFromQueryParam === 'function') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    }
    $('#ERPHeading').text($('#ERPHeading').text() || 'Dealer Target Report');
    SetDate();
    ShowEmptyState();

    $('#txtFromDate, #txtToDate').on('change', UpdatePeriodLabel);
    $('#txtFromDate, #txtToDate').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            ShowData();
        }
    });
    $('#txtDealerTargetReportSearch').on('input', function () {
        if (G_DealerTargetReport.length) {
            BindDealerTargetReport(G_DealerTargetReport);
        }
    });
    $('#btnShow').click(function () {
        ShowData();
    });
    $('#btnDownload').click(function () {
        Download();
    });
    $('#btnReset').click(function () {
        ResetReport();
    });
});

window.ShowData = ShowData;
window.Download = Download;
window.ResetReport = ResetReport;
