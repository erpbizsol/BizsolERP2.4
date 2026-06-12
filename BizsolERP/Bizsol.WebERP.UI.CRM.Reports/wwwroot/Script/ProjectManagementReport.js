import { ProjectManagementReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectManagementReportService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ProjectDetailDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectDetailDashboardService.js';

const MODULE_DESCRIPTION_FOR_REPORT_CONFIG = 'Project Management Report';

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
    return ProjectManagementReportService.GetReportType(MODULE_DESCRIPTION_FOR_REPORT_CONFIG)
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

function applyReportTypeUi() {
    const reportType = ($('#ddlReportType').val() || '').trim();
    G_CurrentLayout = getReportLayout(reportType);
    const profile = getTreeProfile();

    const $subWrap = $('#pmrSubProjectField');
    if (G_CurrentLayout.useSubProjectFilter) $subWrap.show();
    else {
        $subWrap.hide();
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
    $('#tblPMRBody').empty();
    updateSummaryChips([]);
    populateExportTable([]);
}

function fetchReport() {
    const reportType = ($('#ddlReportType option:selected').val() || '').trim();
    if (!reportType) {
        toastr.warning('Select report type.');
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

    ProjectManagementReportService.GetProjectManagementReport(reportType, proj, sub, 0)
        .then(function (response) {
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
            console.error('ProjectManagementReport error:', err);
            clearReport();
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

function handleTreeRowClick($row) {
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
    $('#ERPHeading').text('Management Report');
    loadDropdowns();

    $('#ddlReportType').on('change', function () {
        applyReportTypeUi();
        clearReport();
    });
    $('#ddlProject').on('change', function () {
        loadSubProjectDropdown(parseInt($(this).val() || '0', 10) || 0);
    });

    $(document).on('click', '#tblPMRBody .pmr-tree-parent, .pmr-nested-table .pmr-tree-parent', function (e) {
        e.stopPropagation();
        handleTreeRowClick($(this));
    });

    $('#fetchReportButton').on('click', fetchReport);
    $('#btnDownload').on('click', exportExcel);
    $('#btnClose').on('click', clearReport);
});
