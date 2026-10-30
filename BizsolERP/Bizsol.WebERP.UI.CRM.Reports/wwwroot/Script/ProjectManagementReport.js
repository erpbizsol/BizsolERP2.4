import { ProjectManagementReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectManagementReportService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ProjectDetailDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectDetailDashboardService.js';
import { POGRNBillingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POGRNBillingReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

/** Fallback when ModuleDesp query string is missing — must match F_ReportConfiguration.ModuleDescription if used. */
const FALLBACK_MODULE_DESCRIPTION = 'Management Report';

function moduleDescriptionForReportConfig() {
    const fromUrl = decodeURI(BizSolHelperFunction.getUrlVars()['ModuleDesp'] || '');
    if (fromUrl && fromUrl !== 'undefined' && String(fromUrl).trim() !== '') {
        return String(fromUrl).trim();
    }
    return FALLBACK_MODULE_DESCRIPTION;
}

function moduleDescriptionForDisplay() {
    return BizSolHelperFunction.ToWithSpace(moduleDescriptionForReportConfig());
}

function applyPageHeadingFromModuleDesp() {
    const display = moduleDescriptionForDisplay();
    if (display && display !== 'undefined') {
        $('#ERPHeading').text(display);
        $('#pmrPageTitleText').text(display);
    }
}

const FALLBACK_REPORT_TYPES = [
    'Project wise',
    'Project & Subproject wise',
    'Project & Vendor wise',
    'Vendor wise',
    'Category & Item wise',
];

const METRIC_COLS = {
    bomQty: { key: 'BOMQty', label: 'BOM QTY', amount: false },
    bomValue: { key: 'BOMValue', label: 'BOM Value', amount: true },
    poQty: { key: 'POQty', label: 'PO QTY', amount: false },
    poValue: { key: 'POValue', label: 'PO Value', amount: true },
    grnQty: { key: 'GRNQty', label: 'GRN QTY', amount: false },
    grnValue: { key: 'GRNValue', label: 'GRN Value', amount: true },
    payment: { key: 'Payment', label: 'Payment', amount: true },
    bomPoQtyBal: { key: 'BOM to PO qty Bal', label: 'BOM to PO qty Bal', amount: false },
    bomPoValBal: { key: 'BOM To PO Value bal', label: 'BOM To PO Value bal', amount: true },
    poGrnQtyBal: { key: 'PO to GRN QTY bal', label: 'PO to GRN QTY bal', amount: false },
    poGrnValBal: { key: 'PO To GRN Value Bal', label: 'PO To GRN Value Bal', amount: true },
    grnPayBal: { key: 'GRN(Bill) To Payment Bal', label: 'GRN(Bill) To Payment Bal', amount: true },
};

const REPORT_LAYOUT = {
    project: {
        useSubProjectFilter: false,
        dimensions: ['project'],
        metrics: ['bomQty', 'bomValue', 'poQty', 'poValue', 'grnQty', 'grnValue', 'payment', 'bomPoQtyBal', 'bomPoValBal', 'poGrnQtyBal', 'poGrnValBal', 'grnPayBal'],
    },
    projectSubproject: {
        useSubProjectFilter: true,
        dimensions: ['project', 'subproject'],
        metrics: ['bomQty', 'bomValue', 'poQty', 'poValue', 'grnQty', 'grnValue', 'payment', 'bomPoQtyBal', 'bomPoValBal', 'poGrnQtyBal', 'poGrnValBal', 'grnPayBal'],
    },
    vendor: {
        useSubProjectFilter: false,
        dimensions: ['vendor'],
        metrics: ['poQty', 'poValue', 'grnQty', 'grnValue', 'payment', 'poGrnQtyBal', 'poGrnValBal', 'grnPayBal'],
    },
    projectVendor: {
        useSubProjectFilter: false,
        dimensions: ['project', 'vendor'],
        metrics: ['poQty', 'poValue', 'grnQty', 'grnValue', 'payment', 'poGrnQtyBal', 'poGrnValBal', 'grnPayBal'],
    },
    categoryItem: {
        useSubProjectFilter: true,
        dimensions: ['category', 'item'],
        metrics: ['poQty', 'poValue', 'grnQty', 'grnValue', 'payment', 'poGrnQtyBal', 'poGrnValBal', 'grnPayBal'],
    },
};

const DIMENSION_META = {
    project: { th: '#thProject', label: 'Project name', field: 'ProjectName' },
    subproject: { th: '#thSubProject', label: 'Sub project name', field: 'SubProjectName' },
    vendor: { th: '#thVendor', label: 'Vendor', field: 'VendorName' },
    category: { th: '#thCategory', label: 'Category', field: 'CategoryName' },
    item: { th: '#thItem', label: 'Item name', field: 'ItemName' },
};

/**
 * Full drill chain (every expandable row follows this order):
 * Project wise root → Sub project → Project & Vendor → Vendor → Category / Item
 */
const DRILL_META = {
    subproject: {
        reportKey: 'projectSubproject',
        nextLevel: 'projectVendor',
        title: 'Sub project',
        labelField: 'SubProjectName',
        emptyLabel: '(No Sub Project)',
    },
    projectVendor: {
        reportKey: 'projectVendor',
        nextLevel: 'vendor',
        title: 'Project & Vendor',
        labelField: 'ProjectName',
        labelField2: 'VendorName',
    },
    vendor: {
        reportKey: 'vendor',
        nextLevel: 'categoryItem',
        title: 'Vendor',
        labelField: 'VendorName',
    },
    categoryItem: {
        reportKey: 'categoryItem',
        nextLevel: null,
        title: 'Category / Item',
        labelField: 'CategoryName',
        labelField2: 'ItemName',
    },
    categoryGroup: {
        nextLevel: 'categoryItemLeaf',
        title: 'Category',
        labelField: 'CategoryName',
        localChildren: true,
    },
    categoryItemLeaf: {
        leaf: true,
        title: 'Item',
        labelField: 'ItemName',
    },
};

/** CSS class + color per nested drill level — distinct header colors in ProjectManagementReport.cshtml */
const NESTED_HEAD_LEVEL_CLASS = {
    subproject: 'pmr-nested--subproject',
    projectVendor: 'pmr-nested--projectVendor',
    vendor: 'pmr-nested--vendor',
    categoryItem: 'pmr-nested--categoryItem',
    categoryGroup: 'pmr-nested--categoryGroup',
    categoryItemLeaf: 'pmr-nested--categoryItemLeaf',
};

const NESTED_HEAD_COLORS = {
    subproject: '#2563eb',
    projectVendor: '#0d9488',
    vendor: '#7c3aed',
    categoryItem: '#ea580c',
    categoryGroup: '#db2777',
    categoryItemLeaf: '#16a34a',
    default: '#5b9bd5',
};

function nestedHeadLevelClass(displayLevel) {
    return NESTED_HEAD_LEVEL_CLASS[displayLevel] || 'pmr-nested--default';
}

function nestedHeadCellStyle(displayLevel) {
    const bg = NESTED_HEAD_COLORS[displayLevel] || NESTED_HEAD_COLORS.default;
    return 'background-color:' + bg + ' !important;color:#fff !important;';
}

/** First drill level when expanding root rows for each report type */
const ROOT_DRILL_START = {
    project: 'subproject',
    projectSubproject: 'projectVendor',
    projectVendor: 'vendor',
    vendor: 'categoryItem',
    categoryItem: 'categoryItemLeaf',
};

const TREE_LEVELS = DRILL_META;

/** Root tree profile per selected report type */
const TREE_PROFILES = {
    project: {
        contextLevel: 'project',
        headerHtml: 'Project<br>name',
        rootLabel: (row) => dimensionCellText(row, 'project'),
        canExpand: () => true,
    },
    projectSubproject: {
        contextLevel: 'subproject',
        headerHtml: 'Project /<br>Sub project',
        rootLabel: (row) => {
            const p = dimensionCellText(row, 'project');
            const s = dimensionCellText(row, 'subproject');
            return s ? p + ' / ' + s : p;
        },
        canExpand: () => true,
    },
    projectVendor: {
        contextLevel: 'projectVendor',
        headerHtml: 'Project /<br>Vendor',
        rootLabel: (row) => {
            const p = dimensionCellText(row, 'project');
            const v = dimensionCellText(row, 'vendor');
            return p && v ? p + ' / ' + v : p || v;
        },
        canExpand: () => true,
    },
    vendor: {
        contextLevel: 'vendor',
        headerHtml: 'Vendor',
        rootLabel: (row) => dimensionCellText(row, 'vendor'),
        canExpand: () => true,
    },
    categoryItem: {
        contextLevel: 'categoryGroup',
        headerHtml: 'Category',
        groupByCategory: true,
    },
};

function getRootDrillLevel() {
    const key = normalizeReportTypeKey($('#ddlReportType').val());
    return ROOT_DRILL_START[key] || 'subproject';
}

let G_ReportData = [];
let G_CurrentLayout = REPORT_LAYOUT.project;
let G_SubProjectList = [];
let G_ProjectList = [];
let G_TreeCache = {};
let G_CategoryGroupCache = {};
let G_TreeExpandId = 0;
let G_BudgetRawRows = [];
let G_BudgetDrill = resetBudgetDrill();
let G_POGRNRawRows = [];
let G_PoGrnQtyMode = 'both';
let G_PoGrnDrill = resetPoGrnDrill();
let G_PoGrnBindingSub = false;

const BUDGET_PAGE_SUBTITLE = 'Project, sub-project and category / expense-head budget vs payment. Click a project to open sub-projects, then category. Click a category to see items and payments.';
const WISE_PAGE_SUBTITLE = 'BOM, PO, GRN and payment summary with balance columns for the selected project filters.';
const POGRN_PAGE_SUBTITLE = 'Click a project to open SubProjectWise. Click a sub project to open PO / GRN detail.';

const BUDGET_DRILL_LEVELS = [
    { key: 'project', title: 'Project wise', firstCol: 'Project<br>name', next: 'subproject' },
    { key: 'subproject', title: 'Sub project wise', firstCol: 'Sub project', next: 'category' },
    { key: 'category', title: 'Category / expense Group wise', firstCol: 'Category /<br>Expense Group', next: 'detail' },
    { key: 'detail', title: 'Item / payment detail', firstCol: 'Item', next: null },
];

function resetBudgetDrill() {
    return {
        level: 'project',
        projectCode: 0,
        projectName: '',
        subProjectCode: 0,
        subProjectName: '',
        lineType: '',
        lineCode: 0,
        lineName: '',
        budgetAmount: 0,
        budgetGstAmount: 0,
        paymentAmount: 0,
    };
}

function resetPoGrnDrill() {
    return { level: 'project', project: '', subProject: '' };
}

function isProjectBudgetMode() {
    const v = String($('#ddlReportKind').val() || '').toLowerCase().replace(/\s+/g, '');
    return v === 'projectbudget';
}

function isPoGrnMode() {
    const v = String($('#ddlReportKind').val() || '').toLowerCase().replace(/[\s/_-]+/g, '');
    return v === 'pogrn' || v === 'pogrnreport';
}

function setPmrFilterFieldsVisible($fields, visible) {
    if (!$fields || !$fields.length) return;
    $fields.css('display', visible ? 'flex' : 'none');
}

function asArray(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'rows', 'Rows'];
    for (let i = 0; i < keys.length; i++) {
        const v = response[keys[i]];
        if (Array.isArray(v)) return v;
    }
    return [];
}

function firstNonEmpty(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v != null && v !== '') return v;
    }
    return '';
}

function reportTypeDisplay(row) {
    return String(row.DisplayName || row.displayName || row.FieldValue || row.Desp || row.Value || '').trim();
}

function normalizeReportTypeKey(reportType) {
    const s = String(reportType || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if ((s.includes('project') && s.includes('sub')) || s.includes('subproject') || s.includes('sub project')) return 'projectSubproject';
    if (s.includes('category') && s.includes('item')) return 'categoryItem';
    if (s.includes('project') && s.includes('vendor')) return 'projectVendor';
    if (s.includes('vendor')) return 'vendor';
    return 'project';
}

function getReportLayout(reportType) {
    return REPORT_LAYOUT[normalizeReportTypeKey(reportType)] || REPORT_LAYOUT.project;
}

function getTreeProfile() {
    const key = normalizeReportTypeKey($('#ddlReportType').val());
    return TREE_PROFILES[key] || TREE_PROFILES.project;
}

function bindSelectList(element, list, firstItem) {
    const $el = $(element);
    $el.empty();
    if (firstItem === 'All') $el.append(new Option('All', '0'));
    else if (firstItem === 'Select') $el.append(new Option('Select', ''));
    list.forEach(function (val) {
        const code = val.Code != null ? String(val.Code) : '';
        let text = val.Desp != null ? String(val.Desp).trim() : '';
        if (!text) text = '--';
        $el.append(new Option(text, code));
    });
}

function initSelect2(el) {
    $(el).select2({
        width: '100%',
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
            return null;
        },
    });
}

function mapProjects(rows) {
    return rows.map(function (item) {
        const Code = firstNonEmpty(item, ['ProjectMaster_Code', 'projectMaster_Code', 'Code', 'code']);
        const Desp = String(firstNonEmpty(item, ['ProjectName', 'projectName', 'ProjectDesp', 'projectDesp', 'Desp', 'desp'])).trim();
        return { Code, Desp: Desp || String(Code || '') };
    });
}

function subProjectCode(item) {
    return firstNonEmpty(item, ['SubProjectMaster_Code', 'subProjectMaster_Code', 'Code', 'code']);
}

function subProjectParentCode(item) {
    const v = firstNonEmpty(item, [
        'ProjectMaster_Code',
        'projectMaster_Code',
        'MasterProjectCode',
        'masterProjectCode',
    ]);
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

function subProjectDesp(item) {
    if (!item || typeof item !== 'object') return '';
    let v = firstNonEmpty(item, ['SubProjectDesp', 'subProjectDesp', 'SubProjectName', 'subProjectName', 'SubProject', 'subProject', 'Name', 'name', 'Desp', 'desp']);
    if (!v) {
        const sm = item.SubProjectMaster ?? item.subProjectMaster;
        if (sm != null && String(sm).trim() !== '' && !/^\d+$/.test(String(sm).trim())) v = sm;
    }
    return String(v).trim();
}

function mapSubProjects(rows) {
    return rows.map(function (item) {
        const Code = String(subProjectCode(item) || '');
        const Desp = subProjectDesp(item);
        return { Code, Desp: Desp || '--' };
    });
}

function bindSubProjectDropdown(rows) {
    bindSelectList($('#ddlSubProject')[0], mapSubProjects(asArray(rows)), 'All');
    if ($('#ddlSubProject').data('select2')) $('#ddlSubProject').select2('destroy');
    initSelect2('#ddlSubProject');
}

function refreshSubProjectOptions(projectMasterCode) {
    const pid = parseInt(projectMasterCode || '0', 10) || 0;
    const items = pid === 0 ? G_SubProjectList : G_SubProjectList.filter((sp) => subProjectParentCode(sp) === pid);
    bindSubProjectDropdown(items);
}

function loadSubProjectMasterCache() {
    return SubProjectMasterService.GetSubProjectList()
        .then(function (response) {
            G_SubProjectList = asArray(response);
            refreshSubProjectOptions(0);
        })
        .catch(function () {
            return ProjectManagementReportService.GetSubProjectMasterList(0).then(function (response) {
                G_SubProjectList = asArray(response);
                refreshSubProjectOptions(0);
            });
        })
        .catch(function () {
            G_SubProjectList = [];
            bindSubProjectDropdown([]);
        });
}

function loadSubProjectDropdown(projectMasterCode) {
    const pid = parseInt(projectMasterCode || '0', 10) || 0;
    if (pid === 0) {
        refreshSubProjectOptions(0);
        return Promise.resolve();
    }
    if (G_SubProjectList.some((sp) => subProjectParentCode(sp) > 0)) {
        refreshSubProjectOptions(pid);
        return Promise.resolve();
    }
    return ProjectDetailDashboardService.GetSubProjectListByProject(pid)
        .then(function (response) {
            bindSubProjectDropdown(response);
        })
        .catch(function () {
            refreshSubProjectOptions(pid);
        });
}

function loadReportTypeDropdown() {
    return ProjectManagementReportService.GetReportType(moduleDescriptionForReportConfig())
        .then(function (response) {
            const rows = asArray(response);
            const $rt = $('#ddlReportType');
            $rt.empty();
            const labels = rows.length ? rows.map(reportTypeDisplay).filter(Boolean) : FALLBACK_REPORT_TYPES.slice();
            labels.forEach(function (label) {
                $rt.append($('<option/>').attr('value', label).text(label));
            });
            initSelect2('#ddlReportType');
            applyReportTypeUi();
        })
        .catch(function () {
            const $rt = $('#ddlReportType');
            $rt.empty();
            FALLBACK_REPORT_TYPES.forEach(function (label) {
                $rt.append($('<option/>').attr('value', label).text(label));
            });
            initSelect2('#ddlReportType');
            applyReportTypeUi();
        });
}

function loadProjectDropdown() {
    return ProjectManagementReportService.GetProjectMasterList()
        .then(function (response) {
            const rows = mapProjects(asArray(response));
            G_ProjectList = rows.slice();
            bindSelectList($('#ddlProject')[0], rows, 'All');
            if ($('#ddlProject').data('select2')) $('#ddlProject').select2('destroy');
            initSelect2('#ddlProject');
        })
        .catch(function () {
            G_ProjectList = [];
            bindSelectList($('#ddlProject')[0], [], 'All');
            if ($('#ddlProject').data('select2')) $('#ddlProject').select2('destroy');
            initSelect2('#ddlProject');
        });
}

function loadDropdowns() {
    return Promise.all([loadReportTypeDropdown(), loadProjectDropdown(), loadSubProjectMasterCache()]).catch(function () {
        toastr.error('Could not load filters.');
    });
}

function findReportTypeOption(matchKey) {
    let found = '';
    $('#ddlReportType option').each(function () {
        const v = $(this).val() || '';
        if (normalizeReportTypeKey(v) === matchKey) {
            found = v;
            return false;
        }
    });
    if (!found && matchKey === 'projectSubproject') return 'Project & Subproject wise';
    if (!found && matchKey === 'project') return 'Project wise';
    if (!found && matchKey === 'vendor') return 'Vendor wise';
    if (!found && matchKey === 'projectVendor') return 'Project & Vendor wise';
    if (!found && matchKey === 'categoryItem') return 'Category & Item wise';
    return found;
}

function isBudgetDetailLevel() {
    return isProjectBudgetMode() && G_BudgetDrill.level === 'detail';
}

function isBudgetExpenseLine(lineType) {
    return String(lineType || '').toLowerCase().indexOf('expense') >= 0;
}

function applyBudgetUi() {
    $('.pmr-page').addClass('pmr-budget-mode').removeClass('pmr-pogr-mode pmr-pogr-detail pmr-pogr-sub');
    $('.pmr-page').toggleClass('pmr-budget-detail', isBudgetDetailLevel());
    setPmrFilterFieldsVisible($('#pmrProjectField'), true);
    setPmrFilterFieldsVisible($('#pmrProjectOptionField'), false);
    setPmrFilterFieldsVisible($('#pmrSubProjectField'), false);
    setPmrFilterFieldsVisible($('#pmrStatusField'), true);
    setPmrFilterFieldsVisible($('#pmrQtyValueField'), false);
    setPmrFilterFieldsVisible($('#pmrPoGrnViewField'), false);
    $('#ddlSubProject').val('0').trigger('change.select2');
    $('#tblPOGRN').hide();
    if (isBudgetDetailLevel()) {
        $('#tblPMR').hide();
        $('#pmrBudgetDetail').show();
    } else {
        $('#tblPMR').show();
        $('#pmrBudgetDetail').hide();
        $('#tblPMR thead th.pmr-wise-col').hide();
        $('#tblPMR thead th.pmr-budget-col').show();
        $('#thSubProject, #thVendor, #thCategory, #thItem').hide();
        const level = getBudgetLevel(G_BudgetDrill.level);
        $('#thProject').show().html(level.firstCol);
    }
    $('#pmrSelectedChips').hide().empty();
    $('#pmrPageSubtitle').text(BUDGET_PAGE_SUBTITLE);
}

function applyPoGrnUi() {
    $('.pmr-page').addClass('pmr-pogr-mode').removeClass('pmr-budget-mode pmr-budget-detail');
    $('#pmrBudgetDetail').hide();
    setPmrFilterFieldsVisible($('#pmrProjectOptionField'), false);
    setPmrFilterFieldsVisible($('#pmrStatusField'), true);
    setPmrFilterFieldsVisible($('#pmrProjectField'), true);
    setPmrFilterFieldsVisible($('#pmrPoGrnViewField'), true);
    const showSub = G_PoGrnDrill.level === 'subproject' || G_PoGrnDrill.level === 'detail';
    $('.pmr-page').toggleClass('pmr-pogr-sub', showSub);
    setPmrFilterFieldsVisible($('#pmrSubProjectField'), showSub);
    if (!showSub) {
        $('#ddlSubProject').val('0').trigger('change.select2');
    }
    $('#tblPMR').hide();
    $('#tblPOGRN').show();
    $('#pmrPageSubtitle').text(POGRN_PAGE_SUBTITLE);
    applyPoGrnQtyValueVisibility();
}

function applyModeUi() {
    if (isPoGrnMode()) {
        applyPoGrnUi();
        return;
    }
    if (isProjectBudgetMode()) {
        applyBudgetUi();
        return;
    }
    $('.pmr-page').removeClass('pmr-budget-mode pmr-budget-detail pmr-pogr-mode pmr-pogr-detail pmr-pogr-sub');
    $('#pmrBudgetDetail').hide();
    setPmrFilterFieldsVisible($('#pmrProjectField'), true);
    setPmrFilterFieldsVisible($('#pmrProjectOptionField'), true);
    setPmrFilterFieldsVisible($('#pmrStatusField'), false);
    setPmrFilterFieldsVisible($('#pmrQtyValueField'), false);
    setPmrFilterFieldsVisible($('#pmrPoGrnViewField'), false);
    $('#tblPMR').show();
    $('#tblPOGRN').hide();
    $('#tblPMR thead th.pmr-budget-col').hide();
    $('#tblPMR thead th.pmr-wise-col').show();
    $('#pmrSelectedChips').hide().empty();
    $('#pmrPageSubtitle').text(WISE_PAGE_SUBTITLE);
    applyReportTypeUi();
}

function applyReportTypeUi() {
    if (isPoGrnMode()) {
        applyPoGrnUi();
        return;
    }
    if (isProjectBudgetMode()) {
        applyBudgetUi();
        return;
    }
    const reportType = ($('#ddlReportType').val() || '').trim();
    G_CurrentLayout = getReportLayout(reportType);
    const profile = getTreeProfile();

    const $subWrap = $('#pmrSubProjectField');
    if (G_CurrentLayout.useSubProjectFilter) setPmrFilterFieldsVisible($subWrap, true);
    else {
        setPmrFilterFieldsVisible($subWrap, false);
        $('#ddlSubProject').val('0').trigger('change.select2');
    }

    $('#thProject').show().html(profile.headerHtml || 'Particulars');
    $('#thSubProject, #thVendor, #thCategory, #thItem').hide();

    $('#tblPMR thead tr th[data-metric]').each(function () {
        $(this).toggle(G_CurrentLayout.metrics.indexOf($(this).data('metric')) >= 0);
    });
    $('#pmrDrillBreadcrumb').hide();
}

function formatAmount(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmountNumber(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

function balanceAmountCellHtml(amount) {
    const n = parseAmountNumber(amount);
    const isNegative = n < 0;
    const safe = escapeHtmlText(formatAmount(Math.abs(n)));
    const cls = isNegative ? 'num pmr-balance-negative' : 'num';
    return '<td class="' + cls + '">' + safe + '</td>';
}

function formatQty(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

function rowValue(row, keys) {
    if (typeof keys === 'string') keys = [keys];
    for (let i = 0; i < keys.length; i++) {
        if (row[keys[i]] != null && row[keys[i]] !== '') return row[keys[i]];
    }
    return '';
}

function rowCode(row, keys) {
    const v = parseInt(rowValue(row, keys), 10);
    return Number.isNaN(v) ? 0 : v;
}

function getFilterProjectCode() {
    const v = $('#ddlProject option:selected').val();
    if (v == null || v === '' || v === '0' || v === 'All') return 0;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
}

function getFilterProjectName() {
    return String($('#ddlProject option:selected').text() || '').trim();
}

function getFilterSubProjectName() {
    const v = $('#ddlSubProject option:selected').val();
    if (v == null || v === '' || v === '0' || v === 'All') return '';
    const text = String($('#ddlSubProject option:selected').text() || '').trim();
    if (!text || text.toLowerCase() === 'all') return '';
    return text;
}

function getFilterStatus() {
    return String($('#ddlStatus').val() || '').trim();
}

/** Resolve project code from row, filter dropdown, or G_ProjectList (required for sub-project tree drill). */
function resolveProjectCode(row, ctx) {
    let code = rowCode(row, ['ProjectMaster_Code', 'projectMaster_Code']);
    if (code > 0) return code;
    if (ctx && ctx.projectCode > 0) return ctx.projectCode;

    const name = String(
        (ctx && ctx.projectName) ||
            rowValue(row, ['ProjectName', 'projectName']) ||
            rowValue(row, ['Particulars', 'particulars']) ||
            ''
    ).trim();

    const filterCode = getFilterProjectCode();
    if (filterCode > 0) {
        const filterName = getFilterProjectName().toLowerCase();
        if (!name || filterName === name.toLowerCase()) return filterCode;
    }

    if (!name) return 0;

    const hit = G_ProjectList.find(function (p) {
        return String(p.Desp || '').trim().toLowerCase() === name.toLowerCase();
    });
    return hit ? parseInt(hit.Code, 10) || 0 : 0;
}

function blankMetricFields() {
    const row = {};
    Object.keys(METRIC_COLS).forEach(function (mk) {
        row[METRIC_COLS[mk].key] = 0;
    });
    return row;
}

function normalizeSubProjectMasterRow(item, projectCode, projectName) {
    const code = parseInt(subProjectCode(item), 10) || 0;
    const name = subProjectDesp(item);
    return {
        ProjectMaster_Code: projectCode,
        SubProjectMaster_Code: code,
        ProjectName: projectName,
        SubProjectName: name,
        _masterKey: String(code) + '|' + name.toLowerCase(),
    };
}

function subProjectsFromCache(projectCode) {
    return G_SubProjectList.filter(function (sp) {
        return subProjectParentCode(sp) === projectCode;
    });
}

function fetchSubProjectMasterForDrill(projectCode) {
    const cached = subProjectsFromCache(projectCode);
    if (cached.length) return Promise.resolve(cached);

    return ProjectManagementReportService.GetSubProjectMasterList(projectCode)
        .then(function (response) {
            const rows = asArray(response);
            if (rows.length) return rows;
            return ProjectDetailDashboardService.GetSubProjectListByProject(projectCode);
        })
        .then(function (response) {
            const rows = asArray(response);
            if (rows.length) return rows;
            return SubProjectMasterService.GetSubProjectList();
        })
        .then(function (response) {
            const all = asArray(response);
            return all.filter(function (sp) {
                return subProjectParentCode(sp) === projectCode;
            });
        })
        .catch(function () {
            return subProjectsFromCache(projectCode);
        });
}

function particularsSubIdentity(row) {
    const p = String(rowValue(row, ['Particulars', 'particulars']) || '');
    const sep = String.fromCharCode(1);
    if (p.indexOf(sep) < 0) return { code: 0, name: '' };
    const parts = p.split(sep);
    return {
        code: parseInt(parts[1], 10) || 0,
        name: String(parts[2] || '').trim().toLowerCase(),
    };
}

function factRowKey(row) {
    const code = rowCode(row, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
    const name = String(rowValue(row, ['SubProjectName', 'subProjectName']) || '').trim().toLowerCase();
    if (code > 0) return 'c:' + code;
    if (name) return 'n:' + name;
    const id = particularsSubIdentity(row);
    if (id.code > 0) return 'c:' + id.code;
    if (id.name) return 'n:' + id.name;
    return '';
}

function rowHasMetrics(row, metrics) {
    const mlist = metrics || G_CurrentLayout.metrics;
    return mlist.some(function (mk) {
        return parseNum(rowValue(row, [METRIC_COLS[mk].key])) !== 0;
    });
}

function applyBalanceFields(row) {
    const bomQty = parseNum(rowValue(row, ['BOMQty']));
    const bomVal = parseNum(rowValue(row, ['BOMValue']));
    const poQty = parseNum(rowValue(row, ['POQty']));
    const poVal = parseNum(rowValue(row, ['POValue']));
    const grnQty = parseNum(rowValue(row, ['GRNQty']));
    const grnVal = parseNum(rowValue(row, ['GRNValue']));
    const pay = parseNum(rowValue(row, ['Payment']));
    row['BOM to PO qty Bal'] = bomQty - poQty;
    row['BOM To PO Value bal'] = bomVal - poVal;
    row['PO to GRN QTY bal'] = poQty - grnQty;
    row['PO To GRN Value Bal'] = poVal - grnVal;
    row['GRN(Bill) To Payment Bal'] = grnVal - pay;
    return row;
}

function aggregateFactMetrics(factRows) {
    const row = blankMetricFields();
    factRows.forEach(function (r) {
        Object.keys(METRIC_COLS).forEach(function (mk) {
            const key = METRIC_COLS[mk].key;
            row[key] = parseNum(row[key]) + parseNum(rowValue(r, [key]));
        });
    });
    return applyBalanceFields(row);
}

function buildZeroSubProjectRow(projectCode, projectName, subCode, subName) {
    return Object.assign(
        {
            ProjectMaster_Code: projectCode,
            SubProjectMaster_Code: subCode,
            ProjectName: projectName,
            SubProjectName: subName || '(No Sub Project)',
            RowType: 'DETAIL',
        },
        blankMetricFields()
    );
}

/** Merge SubProjectMaster list with API fact rows so every sub-project appears under a project. */
function mergeSubProjectDrillRows(ctx, factRows) {
    const projectCode = ctx.projectCode || 0;
    const projectName =
        ctx.projectName ||
        getFilterProjectName() ||
        String(rowValue(factRows[0] || {}, ['ProjectName']) || '').trim();

    if (!projectCode) return Promise.resolve(factRows);

    return fetchSubProjectMasterForDrill(projectCode).then(function (masterRows) {
        if (!masterRows.length) return factRows;

        const factsByCode = new Map();
        const factsByName = new Map();
        const usedKeys = new Set();

        factRows.forEach(function (r) {
            const code = rowCode(r, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
            const name = String(rowValue(r, ['SubProjectName', 'subProjectName']) || '').trim().toLowerCase();
            const pid = particularsSubIdentity(r);
            const effCode = code > 0 ? code : pid.code;
            const effName = name || pid.name;
            if (effCode > 0) factsByCode.set(effCode, r);
            if (effName && effName !== '(no sub project)') factsByName.set(effName, r);
        });

        const merged = [];

        masterRows.forEach(function (sp) {
            const norm = normalizeSubProjectMasterRow(sp, projectCode, projectName);
            const code = norm.SubProjectMaster_Code;
            const nameKey = String(norm.SubProjectName || '').trim().toLowerCase();
            let fact =
                (code > 0 && factsByCode.get(code)) ||
                (nameKey && factsByName.get(nameKey)) ||
                null;

            if (fact) {
                usedKeys.add(factRowKey(fact));
                const row = Object.assign({}, fact);
                if (!rowValue(row, ['ProjectName'])) row.ProjectName = projectName;
                if (!rowValue(row, ['SubProjectName'])) row.SubProjectName = norm.SubProjectName;
                if (!rowCode(row, ['SubProjectMaster_Code'])) row.SubProjectMaster_Code = code;
                merged.push(applyBalanceFields(row));
            } else {
                const looseFact = factRows.find(function (r) {
                    const rc = rowCode(r, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
                    const rn = String(rowValue(r, ['SubProjectName', 'subProjectName']) || '').trim().toLowerCase();
                    return (code > 0 && rc === code) || (nameKey && rn === nameKey);
                });
                if (looseFact && rowHasMetrics(looseFact)) {
                    usedKeys.add(factRowKey(looseFact));
                    const row = Object.assign({}, looseFact);
                    row.ProjectMaster_Code = projectCode;
                    row.ProjectName = projectName;
                    row.SubProjectMaster_Code = code || rowCode(row, ['SubProjectMaster_Code']);
                    row.SubProjectName = norm.SubProjectName;
                    merged.push(applyBalanceFields(row));
                } else {
                    merged.push(buildZeroSubProjectRow(projectCode, projectName, code, norm.SubProjectName));
                }
            }
        });

        factRows.forEach(function (r) {
            const key = factRowKey(r);
            if (key && usedKeys.has(key)) return;
            const name = String(rowValue(r, ['SubProjectName', 'subProjectName']) || '').trim();
            const code = rowCode(r, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
            if (!rowHasMetrics(r)) return;
            if (name.toLowerCase() === '(no sub project)' || (!name && code === 0)) {
                merged.push(applyBalanceFields(Object.assign({}, r)));
                if (key) usedKeys.add(key);
                return;
            }
            if (!key || !usedKeys.has(key)) merged.push(applyBalanceFields(Object.assign({}, r)));
        });

        merged.sort(function (a, b) {
            return String(rowValue(a, ['SubProjectName']) || '').localeCompare(
                String(rowValue(b, ['SubProjectName']) || ''),
                undefined,
                { sensitivity: 'base' }
            );
        });

        return merged;
    });
}

/** Per-sub-project API fetch fills BOM/PO when list call missed rows (legacy SP or name/code mismatch). */
function enrichSubProjectRowsFromPerSubApi(ctx, merged) {
    const reportType = findReportTypeOption('projectSubproject');
    const projectCode = ctx.projectCode || 0;
    if (!projectCode || !merged.length) return Promise.resolve(merged);

    const tasks = merged.map(function (row) {
        const subCode = rowCode(row, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
        if (!subCode || rowHasMetrics(row)) return Promise.resolve(row);

        return ProjectManagementReportService.GetProjectManagementReport(reportType, projectCode, subCode, 0)
            .then(function (response) {
                const facts = asArray(response).filter(function (r) {
                    return !r.Error && !r.error && !isTotalRow(r);
                });
                if (!facts.length) return row;
                const metrics = aggregateFactMetrics(facts);
                return Object.assign({}, row, metrics);
            })
            .catch(function () {
                return row;
            });
    });

    return Promise.all(tasks);
}

function isTotalRow(row) {
    const rt = String(rowValue(row, ['RowType', 'rowType']) || '').toUpperCase();
    if (rt === 'TOTAL') return true;
    return String(rowValue(row, ['Particulars', 'particulars']) || '').trim().toLowerCase() === 'total';
}

function dimensionCellText(row, dim) {
    const meta = DIMENSION_META[dim];
    let val = String(rowValue(row, [meta.field]) || '').trim();
    if (!val && dim === 'project') val = String(rowValue(row, ['Particulars', 'particulars']) || '').trim();
    return val;
}

function computeStats(rows) {
    const detailRows = rows.filter((r) => !isTotalRow(r));
    const totalRow = rows.find(isTotalRow);
    if (totalRow) {
        return {
            rows: detailRows.length,
            bom: parseNum(rowValue(totalRow, ['BOMValue'])),
            po: parseNum(rowValue(totalRow, ['POValue'])),
            grn: parseNum(rowValue(totalRow, ['GRNValue'])),
        };
    }
    let bom = 0, po = 0, grn = 0;
    detailRows.forEach(function (r) {
        bom += parseNum(rowValue(r, ['BOMValue']));
        po += parseNum(rowValue(r, ['POValue']));
        grn += parseNum(rowValue(r, ['GRNValue']));
    });
    return { rows: detailRows.length, bom, po, grn };
}

function updateSummaryChips(rows) {
    if (!rows.length) {
        $('#pmrStatRows').text('0');
        $('#pmrStatBOM').text(formatAmount(0));
        $('#pmrStatPO').text(formatAmount(0));
        $('#pmrStatGRN').text(formatAmount(0));
        return;
    }
    const s = computeStats(rows);
    $('#pmrStatRows').text(String(s.rows));
    $('#pmrStatBOM').text(formatAmount(s.bom));
    $('#pmrStatPO').text(formatAmount(s.po));
    $('#pmrStatGRN').text(formatAmount(s.grn));
}

function getMetricsForLevel(level) {
    const cfg = DRILL_META[level];
    if (cfg && cfg.reportKey) {
        const layoutKey = normalizeReportTypeKey(findReportTypeOption(cfg.reportKey));
        return (REPORT_LAYOUT[layoutKey] || G_CurrentLayout).metrics;
    }
    if (level === 'categoryGroup' || level === 'categoryItemLeaf') return REPORT_LAYOUT.categoryItem.metrics;
    return G_CurrentLayout.metrics;
}

function readDataAttr($el, name) {
    const attrVal = $el.attr('data-' + name);
    if (attrVal != null && attrVal !== '') return attrVal;
    const camel = name.replace(/-([a-z])/g, function (_, c) {
        return c.toUpperCase();
    });
    const dataVal = $el.data(camel);
    return dataVal == null ? '' : dataVal;
}

function formatMetricCell(row, metricKey) {
    const col = METRIC_COLS[metricKey];
    const raw = rowValue(row, [col.key]);
    return col.amount || metricKey.includes('Bal') ? formatAmount(raw) : formatQty(raw);
}

function escapeHtmlText(text) {
    return $('<div/>').text(text == null ? '' : String(text)).html();
}

function metricNumCellHtml(row, metricKey) {
    const text = formatMetricCell(row, metricKey);
    const safe = escapeHtmlText(text);
    return '<td class="num"><span class="pmr-num-text" title="' + safe + '">' + safe + '</span></td>';
}

function buildMetricCells(row, metrics) {
    return metrics.map(function (mk) {
        return metricNumCellHtml(row, mk);
    }).join('');
}

function sumRowsMetrics(rows, metrics) {
    const sum = {};
    metrics.forEach(function (mk) {
        const col = METRIC_COLS[mk];
        sum[col.key] = 0;
    });
    rows.forEach(function (r) {
        metrics.forEach(function (mk) {
            const col = METRIC_COLS[mk];
            sum[col.key] += parseNum(rowValue(r, [col.key]));
        });
    });
    return sum;
}

function sumRowAsDisplay(sumObj, metrics) {
    const fake = {};
    metrics.forEach(function (mk) {
        const col = METRIC_COLS[mk];
        fake[col.key] = sumObj[col.key];
    });
    return fake;
}

function treeContextFromRow(row, level, parentCtx) {
    const ctx = Object.assign({}, parentCtx || {});
    const projCode = resolveProjectCode(row, ctx);
    const subCode = rowCode(row, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
    const venCode = rowCode(row, ['VendorMaster_Code', 'vendorMaster_Code']);
    if (projCode > 0) ctx.projectCode = projCode;
    if (subCode > 0) ctx.subProjectCode = subCode;
    if (venCode > 0) ctx.vendorCode = venCode;
    if (level === 'project' || rowValue(row, ['ProjectName', 'Particulars'])) {
        ctx.projectName =
            rowValue(row, ['ProjectName', 'projectName']) ||
            rowValue(row, ['Particulars', 'particulars']) ||
            ctx.projectName ||
            '';
    }
    if (level === 'subproject' || rowValue(row, ['SubProjectName'])) ctx.subProjectName = rowValue(row, ['SubProjectName']) || ctx.subProjectName || '';
    if (level === 'vendor' || level === 'projectVendor' || rowValue(row, ['VendorName'])) ctx.vendorName = rowValue(row, ['VendorName']) || ctx.vendorName || '';
    return ctx;
}

function treeCacheKey(parentLevel, childLevel, ctx) {
    return [parentLevel, childLevel, ctx.projectCode || 0, ctx.subProjectCode || 0, ctx.vendorCode || 0].join('|');
}

function canDrillTo(childLevel) {
    const cfg = DRILL_META[childLevel];
    return !!(cfg && (cfg.reportKey || cfg.localChildren));
}

function fetchTreeChildRows(parentLevel, childLevel, ctx) {
    const childCfg = DRILL_META[childLevel];
    if (!childCfg || !childCfg.reportKey) return Promise.resolve([]);

    const drillCtx = Object.assign({}, ctx);
    if (!drillCtx.projectCode) {
        drillCtx.projectCode = getFilterProjectCode() || resolveProjectCode(
            { ProjectName: drillCtx.projectName, Particulars: drillCtx.projectName },
            drillCtx
        );
    }
    if (!drillCtx.projectName) {
        drillCtx.projectName = getFilterProjectName() || drillCtx.projectName || '';
    }

    const reportType = findReportTypeOption(childCfg.reportKey);
    const key = treeCacheKey(parentLevel, childLevel, drillCtx);
    if (G_TreeCache[key]) return Promise.resolve(G_TreeCache[key]);

    return ProjectManagementReportService.GetProjectManagementReport(
        reportType,
        drillCtx.projectCode || 0,
        drillCtx.subProjectCode || 0,
        drillCtx.vendorCode || 0
    ).then(function (response) {
        const rows = asArray(response).filter((r) => !r.Error && !r.error && !isTotalRow(r));
        if (childLevel !== 'subproject' || !drillCtx.projectCode) {
            G_TreeCache[key] = rows;
            return rows;
        }
        return mergeSubProjectDrillRows(drillCtx, rows)
            .then(function (merged) {
                return enrichSubProjectRowsFromPerSubApi(drillCtx, merged);
            })
            .then(function (merged) {
                G_TreeCache[key] = merged;
                return merged;
            });
    });
}

function childRowLabel(row, displayLevel) {
    const cfg = DRILL_META[displayLevel];
    if (!cfg) return '';
    if (displayLevel === 'subproject') {
        const s = String(rowValue(row, ['SubProjectName']) || '').trim();
        const p = String(rowValue(row, ['ProjectName']) || '').trim();
        if (s) return p ? p + ' / ' + s : s;
        return cfg.emptyLabel || '(No Sub Project)';
    }
    if (displayLevel === 'projectVendor') {
        const p = String(rowValue(row, ['ProjectName']) || '').trim();
        const v = String(rowValue(row, ['VendorName']) || '').trim();
        if (p && v) return p + ' / ' + v;
        return p || v;
    }
    if (cfg.labelField2) {
        const c = String(rowValue(row, [cfg.labelField]) || '').trim();
        const i = String(rowValue(row, [cfg.labelField2]) || '').trim();
        if (c && i) return c + ' / ' + i;
        return c || i;
    }
    return String(rowValue(row, [cfg.labelField]) || '').trim();
}

function metricHeaderHtml(mk) {
    const parts = METRIC_COLS[mk].label.split(' ');
    const mid = Math.ceil(parts.length / 2);
    const line1 = parts.slice(0, mid).join(' ');
    const line2 = parts.slice(mid).join(' ');
    return line1 + (line2 ? '<br>' + line2 : '');
}

function appendTreeParentRow($container, row, idx, label, metrics, parentLevel, childLevel, ctx, options) {
    options = options || {};
    const rowId = 'pmr-tree-' + ++G_TreeExpandId;
    const canExpand = options.canExpand !== false && canDrillTo(childLevel);

    const $tr = $('<tr/>')
        .addClass(options.rootClass || 'pmr-tree-parent')
        .attr('data-tree-id', rowId)
        .attr('data-parent-level', parentLevel || '')
        .attr('data-child-level', childLevel || '')
        .attr('data-project-code', ctx.projectCode || 0)
        .attr('data-project-name', ctx.projectName || '')
        .attr('data-sub-code', ctx.subProjectCode || 0)
        .attr('data-vendor-code', ctx.vendorCode || 0);

    if (options.localKey) $tr.attr('data-local-key', options.localKey);

    let html = '<td class="text-center">' + (idx + 1) + '</td><td class="pmr-th-dim pmr-particulars-cell">';
    if (canExpand) html += '<i class="fa fa-angle-right pmr-tree-toggle me-1" data-target="' + rowId + '"></i>';
    html += '<span class="pmr-particulars-text">' + $('<div/>').text(label).html() + '</span></td>';
    html += buildMetricCells(row, metrics);
    $tr.html(html);
    $container.append($tr);

    if (!canExpand) return;

    const colSpan = 2 + metrics.length;
    const $wrap = $('<tr class="pmr-tree-child-wrap" style="display:none"/>').attr('id', rowId + '-wrap');
    const $cell = $('<td colspan="' + colSpan + '" class="p-0"/>');
    const $panel = $('<div class="pmr-tree-child-panel"/>')
        .attr('data-loaded', '0')
        .attr('data-fetch-level', childLevel || '')
        .attr('data-parent-level', parentLevel || '')
        .attr('data-project-code', ctx.projectCode || 0)
        .attr('data-project-name', ctx.projectName || '')
        .attr('data-sub-code', ctx.subProjectCode || 0)
        .attr('data-vendor-code', ctx.vendorCode || 0);

    if (options.localKey) {
        $panel.attr('data-local-key', options.localKey).attr('data-local-children', '1');
    }

    $panel.html('<div class="pmr-tree-loading text-muted small py-2 ps-3">Click row to expand…</div>');
    $cell.append($panel);
    $wrap.append($cell);
    $container.append($wrap);
}

function buildNestedTreeTable(childRows, displayLevel, parentLevel, parentCtx) {
    const meta = DRILL_META[displayLevel];
    const metrics = getMetricsForLevel(displayLevel);
    const nextLevel = meta ? meta.nextLevel : null;
    const nextCfg = nextLevel ? DRILL_META[nextLevel] : null;
    const title = meta ? meta.title || displayLevel : displayLevel;

    const levelClass = nestedHeadLevelClass(displayLevel);
    const headStyle = nestedHeadCellStyle(displayLevel);
    const $table = $('<table class="table table-sm mb-0 pmr-nested-table ' + levelClass + '"/>');
    const $thead = $(
        '<thead><tr class="pmr-nested-head" style="' + headStyle + '">' +
            '<th style="width:2rem;' + headStyle + '">#</th>' +
            '<th style="' + headStyle + '">' + title + '</th>' +
        '</tr></thead>'
    );
    metrics.forEach(function (mk) {
        $thead.find('tr').append(
            '<th class="num" style="' + headStyle + '">' + metricHeaderHtml(mk) + '</th>'
        );
    });
    $table.append($thead);
    const $tbody = $('<tbody/>');

    childRows.forEach(function (row, idx) {
        const ctx = treeContextFromRow(row, displayLevel, parentCtx);
        const label = childRowLabel(row, displayLevel);
        const canExpand = !!(nextLevel && canDrillTo(nextLevel) && label);
        appendTreeParentRow($tbody, row, idx, label, metrics, displayLevel, canExpand ? nextLevel : '', ctx, { canExpand: canExpand });
    });

    $table.append($tbody);
    return $table.prop('outerHTML');
}

function buildCategoryGroups(rows) {
    const metrics = G_CurrentLayout.metrics;
    const groups = new Map();
    rows.forEach(function (r) {
        const cat = String(rowValue(r, ['CategoryName']) || '—').trim() || '—';
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(r);
    });
    const list = [];
    groups.forEach(function (items, cat) {
        const sum = sumRowsMetrics(items, metrics);
        list.push({ category: cat, items: items, summary: sumRowAsDisplay(sum, metrics) });
    });
    list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
}

function renderCategoryTreeTable(rows) {
    const $body = $('#tblPMRBody');
    $body.empty();
    G_TreeCache = {};
    G_CategoryGroupCache = {};
    G_TreeExpandId = 0;

    const detailRows = rows.filter((r) => !isTotalRow(r));
    const totalRow = rows.find(isTotalRow);
    const metrics = G_CurrentLayout.metrics;
    const groups = buildCategoryGroups(detailRows);

    groups.forEach(function (grp, idx) {
        const rowId = 'pmr-cat-' + ++G_TreeExpandId;
        G_CategoryGroupCache[rowId] = grp.items;
        const ctx = { projectCode: 0, subProjectCode: 0, vendorCode: 0 };
        appendTreeParentRow($body, grp.summary, idx, grp.category, metrics, 'categoryGroup', 'categoryItemLeaf', ctx, {
            rootClass: 'pmr-tree-root pmr-tree-parent',
            localKey: rowId,
            canExpand: grp.items.length > 0,
        });
    });

    if (totalRow) {
        const $tr = $('<tr class="row-total"/>');
        $tr.html('<td></td><td><strong>Total</strong></td>' + buildMetricCells(totalRow, metrics));
        $body.append($tr);
    }
}

function renderTreeTable(rows) {
    const profile = getTreeProfile();
    if (profile.groupByCategory) {
        renderCategoryTreeTable(rows);
        return;
    }

    const $body = $('#tblPMRBody');
    $body.empty();
    G_TreeCache = {};
    G_CategoryGroupCache = {};
    G_TreeExpandId = 0;

    const detailRows = rows.filter((r) => !isTotalRow(r));
    const totalRow = rows.find(isTotalRow);
    const metrics = G_CurrentLayout.metrics;
    const parentLevel = profile.contextLevel;
    const childLevel = getRootDrillLevel();

    detailRows.forEach(function (row, idx) {
        const ctx = treeContextFromRow(row, parentLevel, {});
        const label = profile.rootLabel(row);
        const canExpand = profile.canExpand ? profile.canExpand(row) : true;
        appendTreeParentRow($body, row, idx, label, metrics, parentLevel, canExpand ? childLevel : '', ctx, {
            rootClass: 'pmr-tree-root pmr-tree-parent',
            canExpand: canExpand && !!childLevel,
        });
    });

    if (totalRow) {
        const $tr = $('<tr class="row-total"/>');
        $tr.html('<td></td><td><strong>Total</strong></td>' + buildMetricCells(totalRow, metrics));
        $body.append($tr);
    }
}

function renderReport(rows) {
    G_ReportData = rows.slice();
    updateSummaryChips(G_ReportData);
    renderTreeTable(G_ReportData);
    populateExportTable(G_ReportData);
    applyReportTypeUi();
}

function clearReport() {
    G_ReportData = [];
    G_TreeCache = {};
    G_CategoryGroupCache = {};
    G_BudgetRawRows = [];
    G_BudgetDrill = resetBudgetDrill();
    G_POGRNRawRows = [];
    G_PoGrnDrill = resetPoGrnDrill();
    $('#tblPMRBody').empty();
    $('#pogrTableBody').empty();
    $('#tblBudgetItemsBody, #tblBudgetPaysBody').empty();
    $('#pmrBudgetDetail').hide();
    $('.pmr-page').removeClass('pmr-budget-detail');
    $('#pmrDrillBreadcrumb').hide();
    $('#pmrSelectedChips').hide().empty();
    updateSummaryChips([]);
    populateExportTable([]);
    if (isProjectBudgetMode() || isPoGrnMode()) applyModeUi();
    if (isPoGrnMode()) buildPoGrnTableHeader(getPoGrnLevel('project'));
}

function fetchReport() {
    if (isPoGrnMode()) {
        fetchPoGrnReport();
        return;
    }
    if (isProjectBudgetMode()) {
        fetchBudgetReport();
        return;
    }
    const reportType = ($('#ddlReportType option:selected').val() || '').trim();
    if (!reportType) {
        toastr.warning('Select project option.');
        return;
    }
    applyReportTypeUi();
    G_TreeCache = {};
    G_CategoryGroupCache = {};

    const proj = $('#ddlProject option:selected').val() === '0' || $('#ddlProject option:selected').val() === 'All' ? 0 : parseInt($('#ddlProject option:selected').val(), 10) || 0;
    let sub = 0;
    if (G_CurrentLayout.useSubProjectFilter) {
        sub = $('#ddlSubProject option:selected').val() === '0' || $('#ddlSubProject option:selected').val() === 'All' ? 0 : parseInt($('#ddlSubProject option:selected').val(), 10) || 0;
    }

    if (typeof Showloader === 'function') Showloader();
    ProjectManagementReportService.GetProjectManagementReport(reportType, proj, sub, 0)
        .then(function (response) {
            if (typeof HideLoader === 'function') HideLoader();
            const rows = asArray(response);
            if (!rows.length) {
                clearReport();
                toastr.error('Record not found.');
                return;
            }
            const err0 = rows[0].Error || rows[0].error || rows[0].Msg || rows[0].msg;
            if (err0 != null && err0 !== '') {
                clearReport();
                toastr.error(String(err0));
                return;
            }
            renderReport(rows.filter((r) => !r.Error && !r.error && !r.Msg && !r.msg));
        })
        .catch(function (err) {
            if (typeof HideLoader === 'function') HideLoader();
            console.error('ProjectManagementReport error:', err);
            clearReport();
            toastr.error((err && (err.Msg || err.message)) || 'Error loading project wise report.');
        });
}

function populateExportTable(data) {
    const dimHeaders = G_CurrentLayout.dimensions.map((dim) => DIMENSION_META[dim].label);
    const metricHeaders = G_CurrentLayout.metrics.map((mk) => METRIC_COLS[mk].label);
    const headers = ['S.No'].concat(dimHeaders).concat(metricHeaders);
    const $h = $('#tblPMRExport thead tr');
    const $b = $('#tblPMRExport tbody');
    $h.empty();
    $b.empty();
    if (!data.length) return;
    headers.forEach((h) => $h.append($('<th/>').text(h)));
    data.forEach(function (item) {
        const tr = $('<tr/>');
        const total = isTotalRow(item);
        let sno = rowValue(item, ['S.No', 'SNo', 'S_No']) || '';
        if (total) sno = '';
        tr.append($('<td/>').text(sno));
        G_CurrentLayout.dimensions.forEach(function (dim, idx) {
            let text = dimensionCellText(item, dim);
            if (total && idx === 0) text = 'Total';
            else if (total) text = '';
            tr.append($('<td/>').text(text));
        });
        G_CurrentLayout.metrics.forEach(function (metricKey) {
            tr.append($('<td/>').text(formatMetricCell(item, metricKey)));
        });
        $b.append(tr);
    });
}

function exportExcel() {
    if (isPoGrnMode()) {
        exportPoGrnExcel();
        return;
    }
    if (isProjectBudgetMode()) {
        exportBudgetExcel();
        return;
    }
    if (!G_ReportData.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const now = new Date();
    const dateString = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    $('#tblPMRExport').table2excel({ filename: 'ManagementReport_' + dateString, fileext: '.xlsx' });
}

function toggleTreePanel($toggle, $wrap) {
    const isHidden = $wrap.is(':hidden');
    if (isHidden) {
        $toggle.removeClass('fa-angle-right').addClass('fa-angle-down');
        $wrap.show();
    } else {
        $toggle.removeClass('fa-angle-down').addClass('fa-angle-right');
        $wrap.hide();
    }
    return isHidden;
}

function loadTreeChildPanel($panel) {
    if ($panel.data('loaded') === 1 || $panel.data('loaded') === '1') return Promise.resolve();

    const parentLevel = readDataAttr($panel, 'parent-level');
    const childLevel = readDataAttr($panel, 'fetch-level') || readDataAttr($panel, 'child-level');
    const ctx = {
        projectCode: parseInt(readDataAttr($panel, 'project-code') || '0', 10) || 0,
        projectName: String(readDataAttr($panel, 'project-name') || '').trim(),
        subProjectCode: parseInt(readDataAttr($panel, 'sub-code') || '0', 10) || 0,
        vendorCode: parseInt(readDataAttr($panel, 'vendor-code') || '0', 10) || 0,
    };
    if (!ctx.projectCode) {
        ctx.projectCode = resolveProjectCode({ ProjectName: ctx.projectName, Particulars: ctx.projectName }, ctx);
    }

    $panel.html('<div class="pmr-tree-loading text-muted small py-2 ps-3">Loading…</div>');

    if (String(readDataAttr($panel, 'local-children')) === '1') {
        const localKey = readDataAttr($panel, 'local-key');
        const items = G_CategoryGroupCache[localKey] || [];
        if (!items.length) {
            $panel.html('<div class="text-muted small py-2 ps-3">No records found.</div>');
        } else {
            const metrics = getMetricsForLevel('categoryItemLeaf');
            const leafClass = nestedHeadLevelClass('categoryItemLeaf');
            const headStyle = nestedHeadCellStyle('categoryItemLeaf');
            let html = '<table class="table table-sm mb-0 pmr-nested-table ' + leafClass + '"><thead>';
            html += '<tr class="pmr-nested-head" style="' + headStyle + '">';
            html += '<th style="width:2rem;' + headStyle + '">#</th>';
            html += '<th style="' + headStyle + '">Item</th>';
            metrics.forEach(function (mk) {
                html += '<th class="num" style="' + headStyle + '">' + metricHeaderHtml(mk) + '</th>';
            });
            html += '</tr></thead><tbody>';
            items.forEach(function (row, idx) {
                const label = dimensionCellText(row, 'item') || childRowLabel(row, 'categoryItem');
                html += '<tr><td class="text-center">' + (idx + 1) + '</td><td>' + $('<div/>').text(label).html() + '</td>';
                html += buildMetricCells(row, metrics);
                html += '</tr>';
            });
            html += '</tbody></table>';
            $panel.html(html);
        }
        $panel.data('loaded', 1);
        return Promise.resolve();
    }

    return fetchTreeChildRows(parentLevel, childLevel, ctx)
        .then(function (rows) {
            if (!rows.length) {
                $panel.html('<div class="text-muted small py-2 ps-3">No records found.</div>');
            } else {
                $panel.html(buildNestedTreeTable(rows, childLevel, parentLevel, ctx));
            }
            $panel.data('loaded', 1);
        })
        .catch(function () {
            $panel.html('<div class="text-danger small py-2 ps-3">Failed to load child data.</div>');
        });
}

function getBudgetLevel(key) {
    return BUDGET_DRILL_LEVELS.find(function (l) { return l.key === key; }) || BUDGET_DRILL_LEVELS[0];
}

function budgetField(row, keys, emptyLabel) {
    const v = String(rowValue(row, keys) || '').trim();
    return v || (emptyLabel || '');
}

function budgetRowClosedStatus(row) {
    return String(rowValue(row, ['Closed', 'closed']) || '').trim();
}

function budgetRowDetailType(row) {
    return String(rowValue(row, ['DetailType', 'detailType']) || '').trim();
}

function isBudgetSummaryRow(row) {
    const t = budgetRowDetailType(row).toLowerCase();
    return t === '' || t === 'line' || t === 'summary';
}

function filterBudgetRows() {
    let rows = G_BudgetRawRows.slice();
    if (G_BudgetDrill.level !== 'detail') {
        rows = rows.filter(isBudgetSummaryRow);
    }
    const status = getFilterStatus();
    if (status) {
        const want = status.toLowerCase();
        rows = rows.filter(function (r) {
            return budgetRowClosedStatus(r).toLowerCase() === want;
        });
    }
    const filterCode = getFilterProjectCode();
    if (filterCode > 0) {
        rows = rows.filter(function (r) {
            return rowCode(r, ['ProjectMaster_Code', 'projectMaster_Code']) === filterCode;
        });
    }
    if (G_BudgetDrill.level !== 'project' && G_BudgetDrill.projectCode > 0) {
        rows = rows.filter(function (r) {
            return rowCode(r, ['ProjectMaster_Code', 'projectMaster_Code']) === G_BudgetDrill.projectCode;
        });
    } else if (G_BudgetDrill.level !== 'project' && G_BudgetDrill.projectName) {
        const want = G_BudgetDrill.projectName.toLowerCase();
        rows = rows.filter(function (r) {
            return budgetField(r, ['ProjectName', 'projectName']).toLowerCase() === want;
        });
    }
    if (G_BudgetDrill.level === 'category' || G_BudgetDrill.level === 'detail') {
        if (G_BudgetDrill.subProjectCode > 0) {
            rows = rows.filter(function (r) {
                return rowCode(r, ['SubProjectMaster_Code', 'subProjectMaster_Code']) === G_BudgetDrill.subProjectCode;
            });
        } else {
            const want = String(G_BudgetDrill.subProjectName || '').trim().toLowerCase();
            rows = rows.filter(function (r) {
                const name = budgetField(r, ['SubProjectDesp', 'subProjectDesp', 'ProjectLocation', 'SubProjectName'], '(No Sub Project)').toLowerCase();
                return name === (want || '(no sub project)');
            });
        }
    }
    if (G_BudgetDrill.level === 'detail') {
        if (G_BudgetDrill.lineCode > 0) {
            rows = rows.filter(function (r) {
                return rowCode(r, ['LineMaster_Code', 'lineMaster_Code']) === G_BudgetDrill.lineCode;
            });
        }
        if (G_BudgetDrill.lineType) {
            const wantType = G_BudgetDrill.lineType.toLowerCase();
            rows = rows.filter(function (r) {
                return budgetField(r, ['LineType', 'lineType']).toLowerCase() === wantType;
            });
        }
    }
    return rows;
}

function sumBudgetLines(lines) {
    let budget = 0;
    let gst = 0;
    let pay = 0;
    lines.forEach(function (r) {
        budget += parseNum(rowValue(r, ['BudgetAmount', 'budgetAmount']));
        gst += parseNum(rowValue(r, ['BudgetGSTAmount', 'budgetGSTAmount']));
        pay += parseNum(rowValue(r, ['PaymentAmount', 'paymentAmount']));
    });
    return {
        BudgetAmount: budget,
        BudgetGSTAmount: gst,
        PaymentAmount: pay,
        BalanceAmount: budget + gst - pay,
    };
}

function budgetGroupRows(rows, level) {
    const map = new Map();
    rows.forEach(function (r) {
        let key = '';
        let label = '';
        let projectCode = rowCode(r, ['ProjectMaster_Code', 'projectMaster_Code']);
        let subCode = rowCode(r, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
        let lineCode = rowCode(r, ['LineMaster_Code', 'lineMaster_Code']);
        if (level === 'project') {
            label = budgetField(r, ['ProjectName', 'projectName'], '(No Project)');
            key = String(projectCode || 0) + '|' + label.toLowerCase();
        } else if (level === 'subproject') {
            label = budgetField(r, ['SubProjectDesp', 'subProjectDesp', 'ProjectLocation', 'SubProjectName'], '(No Sub Project)');
            key = String(subCode || 0) + '|' + label.toLowerCase();
        } else {
            label = budgetField(r, ['CategoryOrExpenseHead', 'categoryOrExpenseHead'], '—');
            const lineType = budgetField(r, ['LineType', 'lineType']);
            key = String(lineCode || 0) + '|' + lineType + '|' + label.toLowerCase();
        }
        if (!map.has(key)) {
            map.set(key, {
                key: key,
                label: label,
                projectCode: projectCode,
                projectName: budgetField(r, ['ProjectName', 'projectName']),
                subProjectCode: subCode,
                subProjectName: budgetField(r, ['SubProjectDesp', 'subProjectDesp', 'ProjectLocation', 'SubProjectName'], '(No Sub Project)'),
                lineType: budgetField(r, ['LineType', 'lineType']),
                lineMasterCode: lineCode,
                lineGroupOrder: parseNum(rowValue(r, ['LineGroupOrder', 'lineGroupOrder'])),
                sortOrder: parseNum(rowValue(r, ['SortOrder', 'sortOrder'])),
                lines: [],
            });
        }
        map.get(key).lines.push(r);
    });
    const list = Array.from(map.values()).map(function (g) {
        return Object.assign(g, sumBudgetLines(g.lines));
    });
    list.sort(function (a, b) {
        if (level === 'category') {
            if (a.lineGroupOrder !== b.lineGroupOrder) return a.lineGroupOrder - b.lineGroupOrder;
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        }
        return String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' });
    });
    return list;
}

function budgetMetricCells(agg) {
    return (
        '<td class="num">' + formatAmount(agg.BudgetAmount) + '</td>' +
        '<td class="num">' + formatAmount(agg.BudgetGSTAmount) + '</td>' +
        '<td class="num">' + formatAmount(agg.PaymentAmount) + '</td>' +
        balanceAmountCellHtml(agg.BalanceAmount)
    );
}

function updateBudgetBreadcrumb() {
    const level = G_BudgetDrill.level;
    if (level === 'project') {
        $('#pmrDrillBreadcrumb').hide();
        return;
    }
    const cfg = getBudgetLevel(level);
    $('#pmrDrillTitle').text(cfg.title);
    const crumbs = [
        { level: 'project', label: 'Project wise' },
    ];
    if (G_BudgetDrill.projectName) crumbs.push({ level: 'subproject', label: G_BudgetDrill.projectName });
    if ((level === 'category' || level === 'detail') && G_BudgetDrill.subProjectName) {
        crumbs.push({ level: 'category', label: G_BudgetDrill.subProjectName });
    }
    if (level === 'detail' && G_BudgetDrill.lineName) {
        crumbs.push({ level: 'detail', label: G_BudgetDrill.lineName });
    }
    const html = crumbs.map(function (c, i) {
        const last = i === crumbs.length - 1;
        if (last) return '<span class="pmr-crumb-current">' + escapeHtmlText(c.label) + '</span>';
        return '<a href="#" class="pmr-crumb-link" data-level="' + c.level + '">' + escapeHtmlText(c.label) + '</a><span class="pmr-crumb-sep"> › </span>';
    }).join('');
    $('#pmrDrillPath').html(html);
    $('#pmrDrillBackText').text(
        level === 'detail' ? 'Back to Category' : (level === 'category' ? 'Back to Sub project' : 'Back to Project wise')
    );
    $('#pmrDrillBreadcrumb').show();
}

function renderBudgetLevel() {
    applyBudgetUi();
    if (G_BudgetDrill.level === 'detail') {
        fetchBudgetDetail();
        return;
    }
    const levelCfg = getBudgetLevel(G_BudgetDrill.level);
    const rows = filterBudgetRows();
    const groups = budgetGroupRows(rows, G_BudgetDrill.level);
    const $body = $('#tblPMRBody');
    $body.empty();
    updateBudgetBreadcrumb();

    if (!groups.length) {
        $body.append('<tr><td colspan="6" class="text-muted text-center py-3">No records found.</td></tr>');
        return;
    }

    const canDrill = !!levelCfg.next;
    groups.forEach(function (g, idx) {
        const labelHtml = canDrill
            ? '<a href="#" class="pmr-budget-drill-link">' + escapeHtmlText(g.label) + '</a>'
            : '<span class="pmr-particulars-text">' + escapeHtmlText(g.label) + '</span>';
        const $tr = $('<tr/>')
            .addClass(canDrill ? 'pmr-budget-drill' : '')
            .attr('data-budget-level', G_BudgetDrill.level)
            .attr('data-project-code', g.projectCode || 0)
            .attr('data-project-name', g.projectName || '')
            .attr('data-sub-code', g.subProjectCode || 0)
            .attr('data-sub-name', g.subProjectName || '')
            .attr('data-line-type', g.lineType || '')
            .attr('data-line-code', g.lineMasterCode || 0)
            .attr('data-label', g.label || '')
            .attr('data-budget-amount', g.BudgetAmount || 0)
            .attr('data-budget-gst', g.BudgetGSTAmount || 0)
            .attr('data-payment-amount', g.PaymentAmount || 0);
        $tr.html(
            '<td class="text-center">' + (idx + 1) + '</td>' +
            '<td class="pmr-th-dim pmr-particulars-cell">' + labelHtml + '</td>' +
            budgetMetricCells(g)
        );
        $body.append($tr);
    });

    const total = sumBudgetLines(rows);
    $body.append(
        '<tr class="row-total"><td></td><td><strong>Total</strong></td>' +
        budgetMetricCells(total) +
        '</tr>'
    );
}

function budgetDrillInto($tr) {
    const current = getBudgetLevel(G_BudgetDrill.level);
    if (!current.next) return;
    if (current.key === 'project') {
        G_BudgetDrill.projectCode = parseInt($tr.attr('data-project-code') || '0', 10) || 0;
        G_BudgetDrill.projectName = String($tr.attr('data-project-name') || $tr.attr('data-label') || '').trim();
    } else if (current.key === 'subproject') {
        G_BudgetDrill.subProjectCode = parseInt($tr.attr('data-sub-code') || '0', 10) || 0;
        G_BudgetDrill.subProjectName = String($tr.attr('data-sub-name') || $tr.attr('data-label') || '').trim();
    } else if (current.key === 'category') {
        G_BudgetDrill.lineType = String($tr.attr('data-line-type') || '').trim();
        G_BudgetDrill.lineCode = parseInt($tr.attr('data-line-code') || '0', 10) || 0;
        G_BudgetDrill.lineName = String($tr.attr('data-label') || '').trim();
        G_BudgetDrill.budgetAmount = parseNum($tr.attr('data-budget-amount'));
        G_BudgetDrill.budgetGstAmount = parseNum($tr.attr('data-budget-gst'));
        G_BudgetDrill.paymentAmount = parseNum($tr.attr('data-payment-amount'));
    }
    G_BudgetDrill.level = current.next;
    renderBudgetLevel();
}

function budgetGoToLevel(levelKey) {
    if (levelKey === 'project') {
        G_BudgetDrill = resetBudgetDrill();
    } else if (levelKey === 'subproject') {
        G_BudgetDrill.level = 'subproject';
        G_BudgetDrill.subProjectCode = 0;
        G_BudgetDrill.subProjectName = '';
        G_BudgetDrill.lineType = '';
        G_BudgetDrill.lineCode = 0;
        G_BudgetDrill.lineName = '';
    } else if (levelKey === 'category') {
        G_BudgetDrill.level = 'category';
        G_BudgetDrill.lineType = '';
        G_BudgetDrill.lineCode = 0;
        G_BudgetDrill.lineName = '';
    } else {
        G_BudgetDrill.level = 'detail';
    }
    renderBudgetLevel();
}

function budgetDrillBack() {
    if (G_BudgetDrill.level === 'detail') budgetGoToLevel('category');
    else if (G_BudgetDrill.level === 'category') budgetGoToLevel('subproject');
    else if (G_BudgetDrill.level === 'subproject') budgetGoToLevel('project');
}

function splitBudgetDetailResponse(response) {
    if (response && !Array.isArray(response)) {
        const items = asArray(response.items || response.Items || response.ItemDetails || response.itemDetails);
        const payments = asArray(response.payments || response.Payments || response.PaymentDetails || response.paymentDetails);
        if (items.length || payments.length) return { items, payments };
    }
    const rows = asArray(response).filter(function (r) { return r && !r.Error && !r.error && !r.Msg && !r.msg; });
    const items = [];
    const payments = [];
    rows.forEach(function (r) {
        const t = String(rowValue(r, ['DetailType', 'detailType', 'RowType', 'rowType']) || '').toLowerCase();
        if (t === 'payment' || t === 'pay') {
            payments.push(r);
            return;
        }
        if (t === 'item' || t === 'budget' || t === 'expensehead' || t === 'expense head') {
            items.push(r);
            return;
        }
        const hasPay = rowValue(r, ['VendorName', 'vendorName', 'EmployeeName', 'employeeName', 'PartyName', 'partyName', 'EntryNo', 'entryNo', 'EntryNoWithPrefix']);
        const hasItem = rowValue(r, ['ItemName', 'itemName', 'ExpenseCategory', 'expenseCategory', 'ExpenseHead', 'expenseHead']);
        if (hasPay && !hasItem) payments.push(r);
        else items.push(r);
    });
    return { items, payments };
}

function budgetDetailItemLabel(row, isExpense) {
    const keys = isExpense
        ? ['ExpenseCategory', 'expenseCategory', 'ExpenseHead', 'expenseHead', 'ItemName', 'itemName', 'CategoryOrExpenseHead']
        : ['ItemName', 'itemName', 'CategoryOrExpenseHead'];
    return budgetField(row, keys, '—');
}

function budgetDetailPartyLabel(row, isExpense) {
    const keys = isExpense
        ? ['PartyName', 'partyName', 'EmployeeName', 'employeeName', 'MarketingMan_Name', 'VendorName']
        : ['PartyName', 'partyName', 'VendorName', 'vendorName', 'AccountDesp'];
    return budgetField(row, keys, '—');
}

function budgetDetailEntryNo(row) {
    return budgetField(row, ['EntryNoWithPrefix', 'entryNoWithPrefix', 'EntryNo', 'entryNo', 'Entry no']);
}

function renderBudgetDetailTables(items, payments) {
    const isExpense = isBudgetExpenseLine(G_BudgetDrill.lineType);
    const title = G_BudgetDrill.lineName || (isExpense ? 'Expense' : 'Category');
    $('#pmrBudgetItemTitle').text(isExpense ? 'For ' + title : title);
    $('#pmrBudgetPayTitle').text('Payment');

    const $ih = $('#tblBudgetItemsHead').empty();
    const $ib = $('#tblBudgetItemsBody').empty();
    if (isExpense) {
        $ih.append('<tr><th>Expense category</th><th class="num">Budget amount</th></tr>');
    } else {
        $ih.append('<tr><th>Item name</th><th class="num">Budget amount</th><th class="num">Budget amount with GST</th></tr>');
    }
    if (!items.length) {
        $ib.append('<tr><td colspan="' + (isExpense ? 2 : 3) + '" class="pmr-budget-detail-empty">No item records found.</td></tr>');
    } else {
        let totBudget = 0;
        let totGst = 0;
        items.forEach(function (r) {
            const budget = parseNum(rowValue(r, ['BudgetAmount', 'budgetAmount']));
            const gst = parseNum(rowValue(r, ['BudgetGSTAmount', 'budgetGSTAmount', 'BudgetAmountWithGST']));
            totBudget += budget;
            totGst += gst;
            if (isExpense) {
                $ib.append(
                    '<tr><td>' + escapeHtmlText(budgetDetailItemLabel(r, true)) + '</td>' +
                    '<td class="num">' + formatAmount(budget) + '</td></tr>'
                );
            } else {
                $ib.append(
                    '<tr><td>' + escapeHtmlText(budgetDetailItemLabel(r, false)) + '</td>' +
                    '<td class="num">' + formatAmount(budget) + '</td>' +
                    '<td class="num">' + formatAmount(gst) + '</td></tr>'
                );
            }
        });
        if (isExpense) {
            $ib.append('<tr class="row-total"><td><strong>Total</strong></td><td class="num">' + formatAmount(totBudget) + '</td></tr>');
        } else {
            $ib.append(
                '<tr class="row-total"><td><strong>Total</strong></td>' +
                '<td class="num">' + formatAmount(totBudget) + '</td>' +
                '<td class="num">' + formatAmount(totGst) + '</td></tr>'
            );
        }
    }

    const $ph = $('#tblBudgetPaysHead').empty();
    const $pb = $('#tblBudgetPaysBody').empty();
    if (isExpense) {
        $ph.append('<tr><th>Employee name</th><th>Entry no</th><th class="num">Amount</th></tr>');
    } else {
        $ph.append('<tr><th>Vendor name</th><th>Entry no with prefix</th><th class="num">Amount</th></tr>');
    }
    if (!payments.length) {
        $pb.append('<tr><td colspan="3" class="pmr-budget-detail-empty">No payment records found.</td></tr>');
    } else {
        let totPay = 0;
        payments.forEach(function (r) {
            const amt = parseNum(rowValue(r, ['PaymentAmount', 'paymentAmount', 'Amount', 'amount']));
            totPay += amt;
            $pb.append(
                '<tr><td>' + escapeHtmlText(budgetDetailPartyLabel(r, isExpense)) + '</td>' +
                '<td>' + escapeHtmlText(budgetDetailEntryNo(r)) + '</td>' +
                '<td class="num">' + formatAmount(amt) + '</td></tr>'
            );
        });
        $pb.append(
            '<tr class="row-total"><td><strong>Total</strong></td><td></td><td class="num">' + formatAmount(totPay) + '</td></tr>'
        );
    }
}

function fetchBudgetDetail() {
    applyBudgetUi();
    updateBudgetBreadcrumb();
    const split = splitBudgetDetailResponse(filterBudgetRows().filter(function (r) {
        return !isBudgetSummaryRow(r);
    }));
    const fallbackItems = [{
        ItemName: G_BudgetDrill.lineName,
        ExpenseCategory: G_BudgetDrill.lineName,
        BudgetAmount: G_BudgetDrill.budgetAmount,
        BudgetGSTAmount: G_BudgetDrill.budgetGstAmount,
    }];
    renderBudgetDetailTables(split.items.length ? split.items : fallbackItems, split.payments);
}

function fetchBudgetReport() {
    const status = getFilterStatus();
    if (!status) {
        toastr.warning('Please select status');
        $('#ddlStatus').focus();
        return;
    }
    applyBudgetUi();
    G_BudgetDrill = resetBudgetDrill();
    if (typeof Showloader === 'function') Showloader();
    ProjectManagementReportService.GetProjectBudgetReport(status)
        .then(function (response) {
            if (typeof HideLoader === 'function') HideLoader();
            const rows = asArray(response);
            if (!rows.length) {
                G_BudgetRawRows = [];
                $('#tblPMRBody').empty();
                $('#pmrDrillBreadcrumb').hide();
                toastr.error('Record not found.');
                return;
            }
            const err0 = rows[0].Error || rows[0].error || rows[0].Msg || rows[0].msg;
            if (err0 != null && err0 !== '') {
                G_BudgetRawRows = [];
                $('#tblPMRBody').empty();
                toastr.error(String(err0));
                return;
            }
            G_BudgetRawRows = rows.filter(function (r) { return !r.Error && !r.error; });
            G_ReportData = G_BudgetRawRows.slice();
            renderBudgetLevel();
        })
        .catch(function (err) {
            if (typeof HideLoader === 'function') HideLoader();
            console.error('GetProjectBudgetReport error:', err);
            G_BudgetRawRows = [];
            $('#tblPMRBody').empty();
            toastr.error((err && (err.Msg || err.message)) || 'Error loading project budget report.');
        });
}

function exportBudgetExcel() {
    if (isBudgetDetailLevel()) {
        const $src = $('#tblBudgetItems').clone();
        const $pay = $('#tblBudgetPays').clone();
        const $h = $('#tblPMRExport thead tr');
        const $b = $('#tblPMRExport tbody');
        $h.empty();
        $b.empty();
        $h.append($('<th/>').text($('#pmrBudgetItemTitle').text() || 'Items'));
        $src.find('thead th').each(function () { $h.append($('<th/>').text($(this).text())); });
        $src.find('tbody tr').each(function () {
            const tr = $('<tr/>');
            tr.append($('<td/>').text(''));
            $(this).find('td').each(function () { tr.append($('<td/>').text($(this).text())); });
            $b.append(tr);
        });
        $b.append($('<tr/>').append($('<td/>').text($('#pmrBudgetPayTitle').text() || 'Payment')));
        $pay.find('tbody tr').each(function () {
            const tr = $('<tr/>');
            $(this).find('td').each(function () { tr.append($('<td/>').text($(this).text())); });
            $b.append(tr);
        });
        const now = new Date();
        const dateString = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
        $('#tblPMRExport').table2excel({ filename: 'ProjectBudgetDetail_' + dateString, fileext: '.xlsx' });
        return;
    }
    if (!G_BudgetRawRows.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const rows = filterBudgetRows();
    const $h = $('#tblPMRExport thead tr');
    const $b = $('#tblPMRExport tbody');
    $h.empty();
    $b.empty();
    const headers = [
        'Project Name', 'Sub Project', 'Line Type', 'Category / Expense Head',
        'Budget Amount', 'Budget GST Amount', 'Payment', 'Balance',
    ];
    headers.forEach(function (h) { $h.append($('<th/>').text(h)); });
    rows.forEach(function (item) {
        const tr = $('<tr/>');
        tr.append($('<td/>').text(budgetField(item, ['ProjectName'])));
        tr.append($('<td/>').text(budgetField(item, ['SubProjectDesp', 'ProjectLocation', 'SubProjectName'])));
        tr.append($('<td/>').text(budgetField(item, ['LineType'])));
        tr.append($('<td/>').text(budgetField(item, ['CategoryOrExpenseHead'])));
        tr.append($('<td/>').text(formatAmount(rowValue(item, ['BudgetAmount']))));
        tr.append($('<td/>').text(formatAmount(rowValue(item, ['BudgetGSTAmount']))));
        tr.append($('<td/>').text(formatAmount(rowValue(item, ['PaymentAmount']))));
        tr.append($('<td/>').text(formatAmount(rowValue(item, ['BalanceAmount']))));
        $b.append(tr);
    });
    const now = new Date();
    const dateString = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    $('#tblPMRExport').table2excel({ filename: 'ProjectBudgetReport_' + dateString, fileext: '.xlsx' });
}

const POGRN_FIELD = {
    project: ['ProjectDesp', 'projectDesp', 'ProjectName', 'projectName'],
    subProject: ['SubProjectDesp', 'subProjectDesp', 'SubProjectName', 'subProjectName'],
    poNo: ['PO no', 'PONo', 'PONO', 'PoNo', 'poNo'],
    vendor: ['Vendor Name', 'VendorName', 'vendorName', 'AccountDesp', 'accountDesp'],
    poDate: ['Po date', 'PODate', 'PoDate', 'poDate'],
    grnNo: ['GRN No', 'GRNNo', 'GrnNo', 'grnNo'],
    grnDate: ['GRN Date', 'GRNDate', 'GrnDate', 'grnDate'],
};

const POGRN_DRILL_LEVELS = [
    { key: 'project', title: 'ProjectWise', firstCol: 'Project name', field: POGRN_FIELD.project, empty: '(No Project)', next: 'subproject' },
    { key: 'subproject', title: 'SubProjectWise', firstCol: 'Sub project', field: POGRN_FIELD.subProject, empty: '(No Sub Project)', next: 'detail' },
    { key: 'detail', title: 'PO / GRN Detail', firstCol: 'PO / GRN', field: null, empty: '', next: null, isDetail: true },
];

const POGRN_PO_QTY_KEYS = ['Total Qty', 'TotalQty', 'totalQty'];
const POGRN_PO_VAL_KEYS = [
    ['Taxable amt', 'TaxableAmt', 'taxableAmt'],
    ['GST', 'Gst', 'gst'],
    ['Freight Amt With Gst', 'FreightAmtWithGst', 'freightAmtWithGst'],
    ['Total po amount', 'TotalPoAmount', 'totalPoAmount'],
];
const POGRN_GRN_QTY_KEYS = [
    ['Total Bill QTY', 'TotalBillQTY', 'totalBillQTY'],
    ['Total Accept Qty', 'TotalAcceptQty', 'totalAcceptQty'],
];
const POGRN_GRN_VAL_KEYS = [
    ['GRN taxable amount', 'GRNTaxableAmount', 'grnTaxableAmount'],
    ['Freight amount with GST', 'FreightAmountWithGST', 'freightAmountWithGST'],
    ['GST amount', 'GSTAmount', 'gstAmount'],
    ['Total bill amount', 'TotalBillAmount', 'totalBillAmount'],
    ['Deduction', 'deduction'],
    ['Net GRN Amount', 'NetGRNAmount', 'netGRNAmount'],
    ['Balance Billing Amount', 'BalanceBillingAmount', 'balanceBillingAmount'],
];

const POGRN_SUMMARY_COLS = [
    { id: 'poQty', label: 'Total Qty', headHtml: 'Total<br>Qty', qty: true, keys: POGRN_PO_QTY_KEYS, section: 'po' },
    { id: 'taxable', label: 'Taxable amt', headHtml: 'Taxable<br>amt', qty: false, keys: POGRN_PO_VAL_KEYS[0], section: 'po' },
    { id: 'gst', label: 'GST', qty: false, keys: POGRN_PO_VAL_KEYS[1], section: 'po' },
    { id: 'freightPo', label: 'Freight Amt With Gst', headHtml: 'Freight Amt<br>With Gst', qty: false, keys: POGRN_PO_VAL_KEYS[2], section: 'po' },
    { id: 'totalPo', label: 'Total po amount', headHtml: 'Total po<br>amount', qty: false, keys: POGRN_PO_VAL_KEYS[3], section: 'po' },
    { id: 'billQty', label: 'Total Bill QTY', headHtml: 'Total Bill<br>QTY', qty: true, keys: POGRN_GRN_QTY_KEYS[0], section: 'grn' },
    { id: 'acceptQty', label: 'Total Accept Qty', headHtml: 'Total Accept<br>Qty', qty: true, keys: POGRN_GRN_QTY_KEYS[1], section: 'grn' },
    { id: 'grnTax', label: 'GRN taxable amount', headHtml: 'GRN taxable<br>amount', qty: false, keys: POGRN_GRN_VAL_KEYS[0], section: 'grn' },
    { id: 'freightGrn', label: 'Freight amount with GST', headHtml: 'Freight amount<br>with GST', qty: false, keys: POGRN_GRN_VAL_KEYS[1], section: 'grn' },
    { id: 'gstGrn', label: 'GST amount', headHtml: 'GST<br>amount', qty: false, keys: POGRN_GRN_VAL_KEYS[2], section: 'grn' },
    { id: 'totalBill', label: 'Total bill amount', headHtml: 'Total bill<br>amount', qty: false, keys: POGRN_GRN_VAL_KEYS[3], section: 'grn' },
    { id: 'deduction', label: 'Deduction', qty: false, keys: POGRN_GRN_VAL_KEYS[4], section: 'grn' },
    { id: 'netGrn', label: 'Net GRN Amount', headHtml: 'Net GRN<br>Amount', qty: false, keys: POGRN_GRN_VAL_KEYS[5], section: 'grn' },
    { id: 'balance', label: 'Balance Billing Amount', headHtml: 'Balance<br>Billing Amount', qty: false, keys: POGRN_GRN_VAL_KEYS[6], section: 'grn' },
];

const POGRN_DETAIL_COLS = [
    { id: 'poNo', label: 'PO no', keys: POGRN_FIELD.poNo, text: true, section: 'po' },
    { id: 'vendor', label: 'Vendor Name', headHtml: 'Vendor<br>Name', keys: POGRN_FIELD.vendor, text: true, section: 'po' },
    { id: 'poDate', label: 'Po date', keys: POGRN_FIELD.poDate, text: true, section: 'po' },
    ...POGRN_SUMMARY_COLS.slice(0, 5),
    { id: 'grnNo', label: 'GRN No', keys: POGRN_FIELD.grnNo, text: true, section: 'grn' },
    { id: 'grnDate', label: 'GRN Date', keys: POGRN_FIELD.grnDate, text: true, section: 'grn' },
    ...POGRN_SUMMARY_COLS.slice(5),
];

function getPoGrnLevel(key) {
    return POGRN_DRILL_LEVELS.find(function (l) { return l.key === key; }) || POGRN_DRILL_LEVELS[0];
}

function poGrnSectionClass(col) {
    return col && col.section === 'grn' ? 'col-grn' : 'col-po';
}

function isPoGrnDetailLevel(levelCfg) {
    return !!(levelCfg && levelCfg.isDetail);
}

function visiblePoGrnSummaryCols(levelCfg) {
    const cfg = levelCfg || getPoGrnLevel(G_PoGrnDrill.level);
    let cols = isPoGrnDetailLevel(cfg)
        ? POGRN_SUMMARY_COLS.slice()
        : POGRN_SUMMARY_COLS.filter(function (col) { return !col.qty; });
    if (isPoGrnOnlyView()) cols = cols.filter(function (col) { return col.section === 'grn'; });
    return cols;
}

function visiblePoGrnDetailCols() {
    if (isPoGrnOnlyView()) {
        return POGRN_DETAIL_COLS.filter(function (col) { return col.section === 'grn'; });
    }
    return POGRN_DETAIL_COLS.slice();
}

function formatPoGrnNum(v, decimals) {
    const n = parseNum(v);
    return n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function poGrnDimValue(row, fieldKeys, emptyLabel) {
    const v = String(rowValue(row, fieldKeys) || '').trim();
    return v || emptyLabel;
}

function formatPoGrnCell(row, col) {
    if (col.text) {
        const raw = rowValue(row, col.keys);
        return raw === '' ? '' : escapeHtmlText(String(raw));
    }
    const raw = rowValue(row, col.keys);
    if (raw === '' || raw == null) return '';
    return formatPoGrnNum(raw, col.qty ? 3 : 2);
}

function aggregatePoGrnMetrics(rows) {
    const out = {};
    POGRN_SUMMARY_COLS.forEach(function (col) { out[col.id] = 0; });
    const poSeen = {};
    rows.forEach(function (row) {
        POGRN_GRN_QTY_KEYS.concat(POGRN_GRN_VAL_KEYS).forEach(function (keys, idx) {
            const col = POGRN_SUMMARY_COLS[5 + idx];
            out[col.id] += parseNum(rowValue(row, keys));
        });
        const poKey = String(rowValue(row, POGRN_FIELD.poNo) || '').trim();
        if (poKey && poSeen[poKey]) return;
        if (poKey) poSeen[poKey] = true;
        out.poQty += parseNum(rowValue(row, POGRN_PO_QTY_KEYS));
        POGRN_PO_VAL_KEYS.forEach(function (keys, i) {
            out[POGRN_SUMMARY_COLS[i + 1].id] += parseNum(rowValue(row, keys));
        });
    });
    return out;
}

function groupPoGrnRows(rows, keyFn) {
    const map = new Map();
    rows.forEach(function (r) {
        const k = keyFn(r);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
    });
    return map;
}

function poGrnRowsForCurrentProject() {
    let rows = G_POGRNRawRows.slice();
    const filterName = getFilterProjectName();
    if (getFilterProjectCode() > 0 && filterName && filterName.toLowerCase() !== 'all') {
        const want = filterName.toLowerCase();
        rows = rows.filter(function (r) {
            return poGrnDimValue(r, POGRN_FIELD.project, '').toLowerCase() === want;
        });
    }
    if (G_PoGrnDrill.project) {
        rows = rows.filter(function (r) {
            return poGrnDimValue(r, POGRN_FIELD.project, '(No Project)') === G_PoGrnDrill.project;
        });
    }
    return rows;
}

function bindPoGrnSubProjectOptions() {
    G_PoGrnBindingSub = true;
    const seen = {};
    const list = [];
    poGrnRowsForCurrentProject().forEach(function (r) {
        const name = poGrnDimValue(r, POGRN_FIELD.subProject, '');
        if (!name) return;
        const key = name.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        list.push({ Code: name, Desp: name });
    });
    list.sort(function (a, b) {
        return String(a.Desp || '').localeCompare(String(b.Desp || ''), undefined, { sensitivity: 'base' });
    });

    const keep = getFilterSubProjectName() || G_PoGrnDrill.subProject || '';
    bindSelectList($('#ddlSubProject')[0], list, 'All');
    if ($('#ddlSubProject').data('select2')) $('#ddlSubProject').select2('destroy');
    initSelect2('#ddlSubProject');

    let selected = '0';
    if (keep) {
        $('#ddlSubProject option').each(function () {
            if (String($(this).text() || '').trim().toLowerCase() === keep.toLowerCase()) {
                selected = $(this).val();
                return false;
            }
        });
    }
    $('#ddlSubProject').val(selected).trigger('change.select2');
    G_PoGrnBindingSub = false;
}

function getPoGrnViewMode() {
    return String($('#ddlPoGrnView').val() || 'all');
}

function isPoGrnOnlyView() {
    return getPoGrnViewMode() === 'grnOnly';
}

function poGrnHasPo(row) {
    const po = String(rowValue(row, POGRN_FIELD.poNo) || '').trim();
    return po !== '' && po.toLowerCase() !== '(no po)';
}

function poGrnHasGrn(row) {
    const grn = String(rowValue(row, POGRN_FIELD.grnNo) || '').trim();
    if (grn) return true;
    return POGRN_GRN_QTY_KEYS.concat(POGRN_GRN_VAL_KEYS).some(function (keys) {
        return parseNum(rowValue(row, keys)) !== 0;
    });
}

function filterPoGrnRows() {
    let rows = poGrnRowsForCurrentProject();
    const subFilter = getFilterSubProjectName();
    if (subFilter) {
        const want = subFilter.toLowerCase();
        rows = rows.filter(function (r) {
            return poGrnDimValue(r, POGRN_FIELD.subProject, '(No Sub Project)').toLowerCase() === want;
        });
    } else if (G_PoGrnDrill.subProject) {
        rows = rows.filter(function (r) {
            return poGrnDimValue(r, POGRN_FIELD.subProject, '(No Sub Project)') === G_PoGrnDrill.subProject;
        });
    }
    const view = getPoGrnViewMode();
    if (view === 'withPo') {
        rows = rows.filter(poGrnHasPo);
    } else if (view === 'grnOnly') {
        rows = rows.filter(function (r) { return !poGrnHasPo(r) && poGrnHasGrn(r); });
    }
    return rows;
}

function poGrnHeaderHtml(col) {
    if (col && col.headHtml) return col.headHtml;
    return escapeHtmlText(col && col.label ? col.label : '');
}

function buildPoGrnTableHeader(levelCfg) {
    const $head = $('#pogrTableHead');
    $head.empty();
    if (isPoGrnDetailLevel(levelCfg)) {
        const $c = $('<tr/>');
        $c.append(isPoGrnOnlyView()
            ? '<th class="pmr-th-dim">GRN</th>'
            : '<th class="pmr-th-dim">PO /<br>GRN</th>');
        visiblePoGrnDetailCols().forEach(function (col) {
            let cls = poGrnSectionClass(col);
            if (col.text) cls += ' pmr-th-dim';
            else if (col.qty) cls += ' col-qty num';
            else cls += ' col-val num';
            if (col.id === 'balance') cls += ' pogr-col-balance';
            $c.append('<th class="' + cls + '">' + poGrnHeaderHtml(col) + '</th>');
        });
        $head.append($c);
        return;
    }
    const cols = visiblePoGrnSummaryCols(levelCfg);
    const poCount = cols.filter(function (c) { return c.section === 'po'; }).length;
    const grnCount = cols.filter(function (c) { return c.section === 'grn'; }).length;
    const first = (levelCfg && levelCfg.firstCol) || 'Project name';
    const $g = $('<tr/>');
    $g.append('<th rowspan="2" class="pmr-th-dim">' + escapeHtmlText(first) + '</th>');
    if (poCount > 0) $g.append('<th colspan="' + poCount + '" class="col-po-group">PO</th>');
    if (grnCount > 0) $g.append('<th colspan="' + grnCount + '" class="col-grn-group">GRN / Billing</th>');
    const $c = $('<tr/>');
    cols.forEach(function (col) {
        let cls = (col.qty ? 'col-qty num ' : 'col-val num ') + poGrnSectionClass(col);
        if (col.id === 'balance') cls += ' pogr-col-balance';
        $c.append('<th class="' + cls + '">' + poGrnHeaderHtml(col) + '</th>');
    });
    $head.append($g).append($c);
}

function applyPoGrnQtyValueVisibility() {
    const detail = isPoGrnDetailLevel(getPoGrnLevel(G_PoGrnDrill.level));
    $('.pmr-page').toggleClass('pmr-pogr-detail', detail);
    setPmrFilterFieldsVisible($('#pmrQtyValueField'), detail);
    if (!detail) {
        $('#tblPOGRN .col-qty').addClass('hidden-col');
        $('#tblPOGRN .col-val').removeClass('hidden-col');
        return;
    }
    const mode = G_PoGrnQtyMode || 'both';
    $('#tblPOGRN .col-qty').toggleClass('hidden-col', mode === 'value');
    $('#tblPOGRN .col-val').toggleClass('hidden-col', mode === 'qty');
}

function poGrnColExtraClass(col) {
    return col && col.id === 'balance' ? ' pogr-col-balance' : '';
}

function poGrnMetricCells(agg, levelCfg) {
    let html = '';
    visiblePoGrnSummaryCols(levelCfg).forEach(function (col) {
        const cls = (col.qty ? 'col-qty ' : 'col-val ') + 'num ' + poGrnSectionClass(col) + poGrnColExtraClass(col);
        const val = agg[col.id];
        const text = val === '' || val == null ? '' : formatPoGrnNum(val, col.qty ? 3 : 2);
        html += '<td class="' + cls + '">' + text + '</td>';
    });
    return html;
}

function updatePoGrnBreadcrumb() {
    const current = getPoGrnLevel(G_PoGrnDrill.level);
    const currentIdx = POGRN_DRILL_LEVELS.findIndex(function (l) { return l.key === G_PoGrnDrill.level; });
    if (currentIdx <= 0) {
        $('#pmrDrillBreadcrumb').hide();
        $('#pmrSelectedChips').hide().empty();
        return;
    }

    $('#pmrDrillTitle').text(current.title);
    const chips = [];
    if (G_PoGrnDrill.project) {
        chips.push('<span class="pmr-chip"><span class="lbl">Project</span><span class="val">' + escapeHtmlText(G_PoGrnDrill.project) + '</span></span>');
    }
    if (G_PoGrnDrill.subProject) {
        chips.push('<span class="pmr-chip"><span class="lbl">Sub project</span><span class="val">' + escapeHtmlText(G_PoGrnDrill.subProject) + '</span></span>');
    }
    $('#pmrSelectedChips').html(chips.join('')).toggle(chips.length > 0);

    const parts = [];
    for (let i = 0; i <= currentIdx; i++) {
        const lvl = POGRN_DRILL_LEVELS[i];
        if (i < currentIdx) {
            parts.push('<a href="#" class="pmr-crumb-link" data-level="' + lvl.key + '">' + escapeHtmlText(lvl.title) + '</a>');
        } else {
            parts.push('<span class="pmr-crumb-current">' + escapeHtmlText(lvl.title) + '</span>');
        }
        if (i < currentIdx) parts.push('<span class="pmr-crumb-sep"> → </span>');
    }
    $('#pmrDrillPath').html(parts.join(''));
    $('#pmrDrillBackText').text(currentIdx === 2 ? 'Back to Sub project' : 'Back to ProjectWise');
    $('#pmrDrillBreadcrumb').show();
}

function poGrnDetailColClass(col) {
    let cls = poGrnSectionClass(col);
    if (col.qty) cls += ' col-qty num';
    else if (!col.text) cls += ' col-val num';
    cls += poGrnColExtraClass(col);
    return cls;
}

function renderPoGrnGroupedDetail($body, rows) {
    const detailCols = visiblePoGrnDetailCols();
    if (isPoGrnOnlyView()) {
        rows.forEach(function (row) {
            const label = String(rowValue(row, POGRN_FIELD.grnNo) || '').trim() || '(No GRN)';
            let cells = '<td class="label-cell">' + escapeHtmlText(label) + '</td>';
            detailCols.forEach(function (col) {
                cells += '<td class="' + poGrnDetailColClass(col) + '">' + formatPoGrnCell(row, col) + '</td>';
            });
            $body.append('<tr class="pogr-level-detail pogr-grn-row">' + cells + '</tr>');
        });
    } else {
        const byPo = groupPoGrnRows(rows, function (r) {
            return String(rowValue(r, POGRN_FIELD.poNo) || '').trim() || '(No PO)';
        });
        const poKeys = Array.from(byPo.keys()).sort(function (a, b) {
            return a.localeCompare(b, undefined, { sensitivity: 'base' });
        });

        poKeys.forEach(function (poKey) {
            const poRows = byPo.get(poKey);
            const span = poRows.length || 1;
            poRows.forEach(function (row, idx) {
                const isFirst = idx === 0;
                let cells = '';
                if (isFirst) {
                    cells += '<td class="label-cell pogr-po-once" rowspan="' + span + '">' + escapeHtmlText(poKey) + '</td>';
                }
                detailCols.forEach(function (col) {
                    const cls = poGrnDetailColClass(col);
                    if (col.section === 'po') {
                        if (isFirst) {
                            cells += '<td class="' + cls + ' pogr-po-once" rowspan="' + span + '">' + formatPoGrnCell(row, col) + '</td>';
                        }
                        return;
                    }
                    cells += '<td class="' + cls + '">' + formatPoGrnCell(row, col) + '</td>';
                });
                $body.append('<tr class="pogr-level-detail ' + (isFirst ? 'pogr-po-row' : 'pogr-grn-row') + '">' + cells + '</tr>');
            });
        });
    }

    const total = aggregatePoGrnMetrics(rows);
    let totalCells = '<td class="label-cell"><strong>Total</strong></td>';
    detailCols.forEach(function (col) {
        if (col.text) {
            totalCells += '<td class="' + poGrnSectionClass(col) + poGrnColExtraClass(col) + '"></td>';
        } else {
            totalCells += '<td class="num ' + poGrnSectionClass(col) + poGrnColExtraClass(col) + '">' + formatPoGrnNum(total[col.id], col.qty ? 3 : 2) + '</td>';
        }
    });
    $body.append('<tr class="pogr-row-total">' + totalCells + '</tr>');
}

function renderPoGrnLevel() {
    applyPoGrnUi();
    if (G_PoGrnDrill.level === 'subproject' || G_PoGrnDrill.level === 'detail') {
        bindPoGrnSubProjectOptions();
    }
    const levelCfg = getPoGrnLevel(G_PoGrnDrill.level);
    const rows = filterPoGrnRows();
    const $body = $('#pogrTableBody');
    $body.empty();
    buildPoGrnTableHeader(levelCfg);
    updatePoGrnBreadcrumb();

    if (!rows.length) {
        $body.append('<tr><td colspan="20" class="text-muted text-center py-3">No records found.</td></tr>');
        applyPoGrnQtyValueVisibility();
        return;
    }

    if (levelCfg.isDetail) {
        renderPoGrnGroupedDetail($body, rows);
        applyPoGrnQtyValueVisibility();
        return;
    }

    const byKey = groupPoGrnRows(rows, function (r) {
        return poGrnDimValue(r, levelCfg.field, levelCfg.empty);
    });
    const labels = Array.from(byKey.keys()).sort(function (a, b) {
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    labels.forEach(function (label) {
        const groupRows = byKey.get(label);
        const agg = aggregatePoGrnMetrics(groupRows);
        const canDrill = !!levelCfg.next;
        const link = canDrill
            ? '<a href="#" class="pogr-drill-link">' + escapeHtmlText(label) + '</a>'
            : '<span class="pmr-particulars-text">' + escapeHtmlText(label) + '</span>';
        const $tr = $('<tr/>')
            .addClass('pogr-level-' + levelCfg.key + (canDrill ? ' pogr-drill' : ''))
            .attr('data-level', levelCfg.key)
            .attr('data-key', label);
        $tr.append('<td class="label-cell">' + link + '</td>' + poGrnMetricCells(agg, levelCfg));
        $body.append($tr);
    });

    const grand = aggregatePoGrnMetrics(rows);
    $body.append('<tr class="pogr-row-total"><td class="label-cell"><strong>Total</strong></td>' + poGrnMetricCells(grand, levelCfg) + '</tr>');
    applyPoGrnQtyValueVisibility();
}

function poGrnDrillInto(key) {
    const label = String(key || '').trim();
    if (!label) return;
    const current = getPoGrnLevel(G_PoGrnDrill.level);
    if (!current.next) return;
    if (current.key === 'project') G_PoGrnDrill.project = label;
    else if (current.key === 'subproject') G_PoGrnDrill.subProject = label;
    G_PoGrnDrill.level = current.next;
    renderPoGrnLevel();
}

function applyPoGrnSubProjectFilter() {
    if (G_PoGrnBindingSub) return;
    if (!isPoGrnMode() || !G_POGRNRawRows.length) return;
    if (G_PoGrnDrill.level === 'project') return;
    const name = getFilterSubProjectName();
    if (G_PoGrnDrill.level === 'detail') {
        if (name) G_PoGrnDrill.subProject = name;
        else {
            G_PoGrnDrill.level = 'subproject';
            G_PoGrnDrill.subProject = '';
        }
    }
    renderPoGrnLevel();
}

function poGrnGoToLevel(levelKey) {
    const idx = POGRN_DRILL_LEVELS.findIndex(function (l) { return l.key === levelKey; });
    if (idx < 0) return;
    G_PoGrnDrill.level = levelKey;
    if (idx < 1) G_PoGrnDrill.project = '';
    if (idx < 2) G_PoGrnDrill.subProject = '';
    renderPoGrnLevel();
}

function poGrnDrillBack() {
    const idx = POGRN_DRILL_LEVELS.findIndex(function (l) { return l.key === G_PoGrnDrill.level; });
    if (idx <= 0) return;
    poGrnGoToLevel(POGRN_DRILL_LEVELS[idx - 1].key);
}

function fetchPoGrnReport() {
    const status = ($('#ddlStatus').val() || '').trim();
    if (!status) {
        toastr.warning('Please select status');
        $('#ddlStatus').focus();
        return;
    }
    applyPoGrnUi();
    G_PoGrnDrill = resetPoGrnDrill();
    if (typeof Showloader === 'function') Showloader();
    POGRNBillingReportService.GetPOGRNBillingReport(status)
        .then(function (response) {
            if (typeof HideLoader === 'function') HideLoader();
            const rows = asArray(response);
            if (!rows.length) {
                G_POGRNRawRows = [];
                $('#pogrTableBody').empty();
                $('#pmrDrillBreadcrumb').hide();
                toastr.error('Record not found.');
                return;
            }
            const err0 = rows[0].Error || rows[0].error || rows[0].Msg || rows[0].msg;
            if (err0 != null && err0 !== '') {
                G_POGRNRawRows = [];
                $('#pogrTableBody').empty();
                toastr.error(String(err0));
                return;
            }
            G_POGRNRawRows = rows.filter(function (r) { return !r.Error && !r.error && !r.Msg && !r.msg; });
            G_ReportData = G_POGRNRawRows.slice();
            renderPoGrnLevel();
        })
        .catch(function (err) {
            if (typeof HideLoader === 'function') HideLoader();
            console.error('POGRNBillingReport error:', err);
            G_POGRNRawRows = [];
            $('#pogrTableBody').empty();
            $('#pmrDrillBreadcrumb').hide();
            toastr.error((err && (err.Msg || err.message)) || 'Error loading PO / GRN report.');
        });
}

function exportPoGrnExcel() {
    if (!G_POGRNRawRows.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const rows = filterPoGrnRows();
    const $h = $('#tblPMRExport thead tr');
    const $b = $('#tblPMRExport tbody');
    $h.empty();
    $b.empty();
    const headers = ['Project', 'Sub project'].concat(POGRN_DETAIL_COLS.map(function (c) { return c.label; }));
    headers.forEach(function (h) { $h.append($('<th/>').text(h)); });
    rows.forEach(function (item) {
        const tr = $('<tr/>');
        tr.append($('<td/>').text(rowValue(item, POGRN_FIELD.project)));
        tr.append($('<td/>').text(rowValue(item, POGRN_FIELD.subProject)));
        POGRN_DETAIL_COLS.forEach(function (col) {
            const raw = rowValue(item, col.keys);
            tr.append($('<td/>').text(col.text ? raw : formatPoGrnNum(raw, col.qty ? 3 : 2)));
        });
        $b.append(tr);
    });
    const now = new Date();
    const dateString = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    $('#tblPMRExport').table2excel({ filename: 'POGRNBillingReport_' + dateString, fileext: '.xlsx' });
}

function handleTreeRowClick($row) {
    if (isProjectBudgetMode() || isPoGrnMode()) return;
    const rowId = $row.attr('data-tree-id');
    if (!rowId) return;

    let $wrap = $('#' + rowId + '-wrap');
    if (!$wrap.length) $wrap = $row.next('.pmr-tree-child-wrap');
    if (!$wrap.length) return;

    const $toggle = $row.find('.pmr-tree-toggle[data-target="' + rowId + '"]').first();
    const $panel = $wrap.find('.pmr-tree-child-panel').first();
    if (!$panel.length) return;

    const opening = toggleTreePanel($toggle, $wrap);
    if (opening) loadTreeChildPanel($panel);
}

$(document).ready(function () {
    applyPageHeadingFromModuleDesp();
    loadDropdowns();
    $('#ddlReportKind').select2({ width: '100%', minimumResultsForSearch: Infinity });
    $('#ddlStatus, #ddlQtyValue, #ddlPoGrnView').select2({ width: '100%', minimumResultsForSearch: Infinity });
    applyModeUi();
    if (isPoGrnMode()) buildPoGrnTableHeader(getPoGrnLevel('project'));

    $('#ddlReportKind').on('change', function () {
        applyModeUi();
        clearReport();
    });
    $('#ddlReportType').on('change', function () {
        applyReportTypeUi();
        clearReport();
    });
    $('#ddlQtyValue').on('change', function () {
        G_PoGrnQtyMode = $(this).val() || 'both';
        applyPoGrnQtyValueVisibility();
    });
    $('#ddlPoGrnView').on('change', function () {
        if (isPoGrnMode() && G_POGRNRawRows.length) renderPoGrnLevel();
    });
    $('#ddlStatus').on('change', function () {
        if (isProjectBudgetMode() && G_BudgetRawRows.length) fetchBudgetReport();
    });
    $('#ddlProject').on('change', function () {
        loadSubProjectDropdown(parseInt($(this).val() || '0', 10) || 0);
        if (isProjectBudgetMode() && G_BudgetRawRows.length) {
            G_BudgetDrill = resetBudgetDrill();
            renderBudgetLevel();
        }
        if (isPoGrnMode() && G_POGRNRawRows.length) {
            G_PoGrnDrill = resetPoGrnDrill();
            renderPoGrnLevel();
        }
    });
    $('#ddlSubProject').on('change', function () {
        if (isPoGrnMode()) applyPoGrnSubProjectFilter();
    });

    $(document).on('click', '#tblPMRBody .pmr-tree-parent, .pmr-nested-table .pmr-tree-parent', function (e) {
        if (isProjectBudgetMode() || isPoGrnMode()) return;
        e.stopPropagation();
        handleTreeRowClick($(this));
    });
    $(document).on('click', '#tblPMRBody a.pmr-budget-drill-link', function (e) {
        e.preventDefault();
        e.stopPropagation();
        budgetDrillInto($(this).closest('tr'));
    });
    $(document).on('click', '#tblPMRBody tr.pmr-budget-drill', function (e) {
        if ($(e.target).closest('a').length) return;
        budgetDrillInto($(this));
    });
    $(document).on('click', '#pogrTableBody a.pogr-drill-link', function (e) {
        e.preventDefault();
        e.stopPropagation();
        poGrnDrillInto($(this).closest('tr').attr('data-key'));
    });
    $(document).on('click', '#pogrTableBody tr.pogr-drill', function (e) {
        if ($(e.target).closest('a').length) return;
        poGrnDrillInto($(this).attr('data-key'));
    });
    $('#btnDrillBack').on('click', function (e) {
        e.preventDefault();
        if (isPoGrnMode()) poGrnDrillBack();
        else budgetDrillBack();
    });
    $(document).on('click', '#pmrDrillPath .pmr-crumb-link', function (e) {
        e.preventDefault();
        if (isPoGrnMode()) poGrnGoToLevel($(this).data('level'));
        else budgetGoToLevel($(this).data('level'));
    });

    $('#fetchReportButton').on('click', fetchReport);
    $('#btnDownload').on('click', exportExcel);
    $('#btnClose').on('click', clearReport);
});
