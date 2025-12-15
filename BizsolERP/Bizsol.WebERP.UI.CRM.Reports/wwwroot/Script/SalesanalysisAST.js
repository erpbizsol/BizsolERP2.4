import { SalesanalysisASTService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesanalysisASTService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { DateRangeControl } from '../../Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global variables
let G_ddlDealerNameList = [];
let fromDate = '0';
let toDate = '0';

// DateRangeControl initialization
function initDateRangeControl() {
    const dr = document.querySelector('date-range-control#dateRange');
    if (!dr) return;

    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const fyStartYear = (month >= 4) ? year : (year - 1);
        const fyEndYear = fyStartYear + 1;
        const fyFrom = fyStartYear + '-04-01';
        const fyTo = fyEndYear + '-03-31';

        try { dr.setRange({ fromDate: fyFrom, toDate: fyTo }); } catch (e) { }

        try {
            const legacyFrom = document.getElementById('txtFromDate');
            const legacyTo = document.getElementById('txtToDate');
            if (legacyFrom) legacyFrom.value = fyFrom;
            if (legacyTo) legacyTo.value = fyTo;
        } catch (e) { }

        try { fromDate = fyFrom; toDate = fyTo; } catch (e) { }
    } catch (e) {
        console.warn('Failed to initialize financial year default range', e);
    }

    function syncToLegacyInputs(detail) {
        const from = detail.fromDate || '';
        const to = detail.toDate || '';
        const legacyFrom = document.getElementById('txtFromDate');
        const legacyTo = document.getElementById('txtToDate');
        if (legacyFrom) legacyFrom.value = from;
        if (legacyTo) legacyTo.value = to;
    }

    dr.addEventListener('daterangechange', function (e) {
        try {
            syncToLegacyInputs(e.detail);
        } catch (err) {
            console.warn('DateRangeControl sync error', err);
        }
    });

    window.SetDateRange = function (fromIso, toIso) {
        dr.setRange({ fromDate: fromIso, toDate: toIso });
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDateRangeControl);
} else {
    initDateRangeControl();
}

// Helper functions
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatNumber(v) {
    if (v === null || v === undefined) return '';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BindSelectList(element, list) {
    if (!element) return;

    if (element.jquery) element = element[0];

    let container = element;
    if (element.tagName && element.tagName.toLowerCase() === 'select') {
        const div = document.createElement('div');
        div.id = element.id || ('checkbox_' + Math.random().toString(36).slice(2));
        div.className = element.className || '';
        if (element.style && element.style.cssText) div.style.cssText = element.style.cssText;
        element.parentNode.replaceChild(div, element);
        container = div;
    }

    const searchId = container.id + '_search';
    const allId = container.id + '_all';
    const listId = container.id + '_list';

    const html = [
        `<div class="multi-checkbox-root" style="font-size:13px;">`,
        `  <div class="multi-checkbox-search" style="margin-bottom:6px;">`,
        `    <input type="text" id="${searchId}" placeholder="Search..." style="width:100%;padding:6px;border:1px solid #ccc;border-radius:3px;" />`,
        `  </div>`,
        `  <div class="multi-checkbox-selectall" style="margin-bottom:6px;">`,
        `    <label style="cursor:pointer;"><input type="checkbox" id="${allId}" style="margin-right:6px;" checked /> Select All</label>`,
        `  </div>`,
        `  <div id="${listId}" class="multi-checkbox-list" style="max-height:150px;overflow:auto;border:1px solid #e6e6e6;padding:6px;border-radius:3px;background:#fff;"></div>`,
        `</div>`
    ].join('\n');

    container.innerHTML = html;

    const listDiv = container.querySelector('#' + listId);

    list.forEach(function (item) {
        const val = escapeHtml(item.Code);
        const text = escapeHtml(item.Desp);
        const itemId = `${container.id}_chk_${val}`;
        const itemHtml =
            `<div class="checkbox-item" style="padding:4px 2px;">` +
            `  <label for="${itemId}" style="cursor:pointer;"><input type="checkbox" id="${itemId}" class="${container.id}_chk" value="${val}" style="margin-right:6px;" checked/> ${text}</label>` +
            `</div>`;
        listDiv.insertAdjacentHTML('beforeend', itemHtml);
    });

    const selectAllCheckbox = document.getElementById(allId);
    const itemCheckboxSelector = '.' + container.id + '_chk';
    function getItemCheckboxes() {
        return Array.from(container.querySelectorAll(itemCheckboxSelector));
    }

    selectAllCheckbox.addEventListener('change', function (ev) {
        const checked = ev.target.checked;
        getItemCheckboxes().forEach(function (chk) { chk.checked = checked; });
    });

    getItemCheckboxes().forEach(function (chk) {
        chk.addEventListener('change', function () {
            const all = getItemCheckboxes();
            const checkedCount = all.filter(c => c.checked).length;
            selectAllCheckbox.checked = (checkedCount === all.length && all.length > 0);
            if (checkedCount === 0) selectAllCheckbox.checked = false;
        });
    });

    const searchInput = document.getElementById(searchId);
    searchInput.addEventListener('input', function (ev) {
        const term = ev.target.value.trim().toLowerCase();
        const items = container.querySelectorAll('.checkbox-item');
        items.forEach(function (div) {
            const text = div.textContent.trim().toLowerCase();
            div.style.display = (term === '' || text.indexOf(term) !== -1) ? '' : 'none';
        });
    });
}

function GetSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"].' + containerId + '_chk'));
    return inputs.filter(i => i.checked).map(i => i.value);
}

function AreAllSelected(containerId) {
    try {
        if (!containerId) return false;
        const container = document.getElementById(containerId);
        if (!container) return false;

        const selectAllId = containerId + '_all';
        const selectAllEl = container.querySelector('#' + selectAllId);
        if (selectAllEl && selectAllEl instanceof HTMLInputElement && selectAllEl.type === 'checkbox') {
            return !!selectAllEl.checked;
        }

        const itemSelector = 'input[type="checkbox"].' + containerId + '_chk';
        const inputs = Array.from(container.querySelectorAll(itemSelector));
        if (inputs.length === 0) return false;

        return inputs.every(function (chk) { return chk.checked === true; });
    } catch (e) {
        console.error('AreAllSelected error', e);
        return false;
    }
}

function GetDateRange() {
    try {
        const drange = DateRangeControl.getDateRangeFromControl('dateRange');
        fromDate = drange.fromDate || '0';
        toDate = drange.toDate || '0';
    } catch (e) {
        console.warn('Could not read date range control via helper:', e);
    }
}

// Tab rendering functions
function renderSummaryReport() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('SUMMARY_REPORT', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No summary report data received');
            // Clear KPIs
            document.getElementById('kpi-parties').textContent = '0';
            document.getElementById('kpi-high-gp').textContent = '0';
            document.getElementById('kpi-lost-client').textContent = '0';
            document.getElementById('kpi-manifested-sales').textContent = '0';
            document.getElementById('kpi-actual-sale').textContent = '0';
            document.getElementById('report-date-range').textContent = '';
            return;
        }

        // Calculate KPI values from the grid data
        const uniqueParties = new Set();
        let highGPCount = 0;
        let lostClientCount = 0;
        let manifestedSalesTotal = 0;
        let actualSaleTotal = 0;

        response.forEach(function(row) {
            // Count unique parties
            const partyName = row['Party Name'] || row.PartyName || '';
            if (partyName) {
                uniqueParties.add(partyName.trim());
            }

            // Count High GP (check if Status or GP column contains "High GP")
            const status = (row['Status'] || row.Status || '').toString().toUpperCase();
            const gp = (row['GP'] || row.GP || '').toString().toUpperCase();
            if (gp.includes('HIGH')) {
                highGPCount++;
            }

            // Count Lost Clients
            if (status.includes('LOST CLIENT')) {
                lostClientCount++;
            }

            // Sum Manifestation values
            const manifestation = parseFloat(row['Manifestation'] || row.Manifestation || 0);
            if (!isNaN(manifestation)) {
                manifestedSalesTotal += manifestation;
            }

            // Sum Weight as Actual Sale (based on your image showing Weight column)
            const weight = parseFloat(row['Weight'] || row.weight || 0);
            if (!isNaN(weight)) {
                actualSaleTotal += weight;
            }
        });

        // Update KPI values
        document.getElementById('kpi-parties').textContent = uniqueParties.size.toString();
        document.getElementById('kpi-high-gp').textContent = highGPCount.toString();
        document.getElementById('kpi-lost-client').textContent = lostClientCount.toString();
        document.getElementById('kpi-manifested-sales').textContent = formatNumber(manifestedSalesTotal);
        document.getElementById('kpi-actual-sale').textContent = formatNumber(actualSaleTotal);
        
        // Update date range display
        const fromDateDisplay = fromDate !== '0' ? formatDateForDisplay(fromDate) : 'N/A';
        const toDateDisplay = toDate !== '0' ? formatDateForDisplay(toDate) : 'Today';
        document.getElementById('report-date-range').textContent = `Report Showing From : ${fromDateDisplay} to ${toDateDisplay}`;

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Weight': 'right',
            'Manifestation': 'right',
            'Total Sales': 'right',
            'Growth (%)': 'right',
            'Target': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("summaryReportTableHeader", "summaryReportTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching summary report data:', err);
    });
}

// Helper function to format date for display
function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr === '0') return '';
    try {
        const date = new Date(dateStr);
        const day = date.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[date.getMonth()].toLowerCase();
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch (e) {
        return dateStr;
    }
}

function renderPartyScoring() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('PARTY_SCORING', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No party scoring data received');
            // Clear summary grids
            document.getElementById('locationSummaryBody').innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
            document.getElementById('mgktPersonSummaryBody').innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
            document.getElementById('partyIdSummaryBody').innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
            return;
        }

        // Calculate summary data from grid response
        const locationCounts = new Map();
        const mgktPersonCounts = new Map();
        const partyIdCounts = new Map();

        response.forEach(function(row) {
            // Count by Location
            const location = row['Location'] || row.Location || '';
            if (location) {
                locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
            }

            // Count by Marketing Person
            const mgktPerson = row['Marketing Man'] || row.MarketingMan || row['MGKT Person'] || '';
            if (mgktPerson) {
                mgktPersonCounts.set(mgktPerson, (mgktPersonCounts.get(mgktPerson) || 0) + 1);
            }

            // Count by Party ID
            const partyId = row['Party ID'] || row.PartyID || row['Party Name'] || '';
            if (partyId) {
                partyIdCounts.set(partyId, (partyIdCounts.get(partyId) || 0) + 1);
            }
        });

        // Populate Location Summary Grid
        populateSummaryGrid('locationSummaryBody', locationCounts, 'Location');

        // Populate MGKT Person Summary Grid
        populateSummaryGrid('mgktPersonSummaryBody', mgktPersonCounts, 'MGKT Person');

        // Populate Party ID Summary Grid
        populateSummaryGrid('partyIdSummaryBody', partyIdCounts, 'Party ID');

        // Render main Party Scoring table
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Score': 'right',
            'Sales': 'right',
            'Transactions': 'right',
            'Weight': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("partyScoringTableHeader", "partyScoringTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching party scoring data:', err);
    });
}

// Helper function to populate summary grids
function populateSummaryGrid(tbodyId, dataMap, columnName) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';

    // Convert Map to array and sort by count descending
    const sortedData = Array.from(dataMap.entries())
        .sort((a, b) => b[1] - a[1]);

    let grandTotal = 0;
    sortedData.forEach(function([key, count], index) {
        grandTotal += count;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}.</td>
            <td>${escapeHtml(key)}</td>
            <td class="text-end fw-bold">${count}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update the grid title with count in header
    const containerDiv = tbody.closest('.card');
    if (containerDiv) {
        const titleEl = containerDiv.querySelector('.summary-grid-title');
        if (titleEl) {
            titleEl.textContent = `${columnName} (${sortedData.length})`;
        }
        
        // Update the grand total in the footer
        const footerTotal = containerDiv.querySelector('.summary-grid-footer .grand-total-value');
        if (footerTotal) {
            footerTotal.textContent = grandTotal;
        }
    }
}

function renderGoldenCircleClient() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('GOLDEN_CIRCLE', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No golden circle client data received');
            return;
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Sales': 'right',
            'Growth (%)': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("goldenCircleTableHeader", "goldenCircleTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching golden circle data:', err);
    });
}

function renderManifestation() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('MANIFESTATION', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No manifestation data received');
            return;
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Sales': 'right',
            'Manifestation Score': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("manifestationTableHeader", "manifestationTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching manifestation data:', err);
    });
}

function renderNBDCRR() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('NBD_CRR', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No NBD CRR data received');
            return;
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'NBD Count': 'right',
            'CRR Count': 'right',
            'Total': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("nbdCrrTableHeader", "nbdCrrTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching NBD CRR data:', err);
    });
}

function renderSegmentWise() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('SEGMENT_WISE', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No segment wise data received');
            return;
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Sales': 'right',
            'Growth (%)': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("segmentWiseTableHeader", "segmentWiseTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching segment wise data:', err);
    });
}

function renderGPWiseSummary() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    GetDateRange();
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('GP_WISE_SUMMARY', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No GP wise summary data received');
            return;
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'GP': 'right',
            'Sales': 'right',
            'Percentage': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("gpWiseTableHeader", "gpWiseTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching GP wise summary data:', err);
    });
}

// Initialize dropdowns
CRMReportsServices.GetSalespersonList().then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
        try {
            const root = document.getElementById('ddlSalesPersonlist');
            if (root) {
                root.removeEventListener('change', dllSalesPresonListChange);
                root.addEventListener('change', dllSalesPresonListChange);
            }
        } catch (e) { console.warn('Could not attach change handler to ddlSalesPresonlist', e); }
    } else {
        const el = $('#ddlSalesPersonlist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
});

function dllSalesPresonListChange() {
    try {
        const vals = GetSelectedValues('ddlSalesPersonlist');
        if (!vals || vals.length === 0) {
            return;
        }

        const promises = vals.map(function (code) {
            try {
                return CRMReportsServices.GetDealerList(code);
            } catch (e) {
                return Promise.resolve([]);
            }
        });
        Showloader();
        Promise.all(promises).then(function (responses) {
            HideLoader();
            const merged = [];
            const seen = new Set();
            responses.forEach(function (resp) {
                if (Array.isArray(resp)) {
                    resp.forEach(function (d) {
                        const key = String(d.Code);
                        if (!seen.has(key)) {
                            seen.add(key);
                            merged.push(d);
                        }
                    });
                }
            });

            if (merged.length > 0) {
                G_ddlDealerNameList = merged.slice();
                try {
                    BindSelectList($('#ddlDealerNamelist')[0], merged.map(function (item) { return { Code: item.Code, Desp: item.AccountDesp }; }));
                } catch (e) {
                    console.error('Error binding dealer list after salesperson change', e);
                }
            } else {
                G_ddlDealerNameList = [];
                const el = $('#ddlDealerNamelist')[0];
                if (el) el.innerHTML = '';
            }
        }).catch(function (err) {
            console.error('Error fetching dealer lists for selected salespersons', err);
            G_ddlDealerNameList = [];
            const el = $('#ddlDealerNamelist')[0];
            if (el) el.innerHTML = '';
        });
    } catch (e) {
        console.error('dllSalesPresonListChange error', e);
    }
}

CRMReportsServices.GetDealerList().then(function (response) {
    if (response && response.length > 0) {
        G_ddlDealerNameList = response.slice();
        BindSelectList($('#ddlDealerNamelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
    } else {
        G_ddlDealerNameList = [];
        const el = $('#ddlDealerNamelist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching dealer list:', error);
    G_ddlDealerNameList = [];
    const el = $('#ddlDealerNamelist')[0];
    if (el) el.innerHTML = '';
});

SalesanalysisASTService.GetSalesAnalysisData('DDL_CITIESNAMELIST', '0', '0', '0').then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlCitiesNamelist')[0], response.map((item) => ({ Code: item.CityName, Desp: item.CityName })));
    } else {
        const el = $('#ddlCitiesNamelist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching cities list:', error);
    const el = $('#ddlCitiesNamelist')[0];
    if (el) el.innerHTML = '';
});

SalesanalysisASTService.GetSalesAnalysisData('DDL_STATUSNAME', '0', '0', '0').then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlStatusNamelist')[0], response.map((item) => ({ Code: item.StatusName, Desp: item.StatusName })));
    } else {
        const el = $('#ddlStatusNamelist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching status list:', error);
    const el = $('#ddlStatusNamelist')[0];
    if (el) el.innerHTML = '';
});

SalesanalysisASTService.GetSalesAnalysisData('DDL_GPLIST', '0', '0', '0').then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlGPlist')[0], response.map((item) => ({ Code: item.GP, Desp: item.GP })));
    } else {
        const el = $('#ddlGPlist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching GP list:', error);
    const el = $('#ddlGPlist')[0];
    if (el) el.innerHTML = '';
});

SalesanalysisASTService.GetSalesAnalysisData('DDL_INDUSTRYTYPELIST', '0', '0', '0').then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlIndustryTypelist')[0], response.map((item) => ({ Code: item.IndustryType, Desp: item.IndustryType })));
    } else {
        const el = $('#ddlIndustryTypelist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching industry type list:', error);
    const el = $('#ddlIndustryTypelist')[0];
    if (el) el.innerHTML = '';
});

// Show report function
function SalesanalysisAST_ShowReport() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');

    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }

    if (selectedDealers == '') {
        return;
    }

    // Check which tab is active and render accordingly
    if (document.querySelector('#summaryReport') && document.querySelector('#summaryReport').classList.contains('show')) {
        renderSummaryReport();
    }
    if (document.querySelector('#partyScoring') && document.querySelector('#partyScoring').classList.contains('show')) {
        renderPartyScoring();
    }
    if (document.querySelector('#goldenCircle') && document.querySelector('#goldenCircle').classList.contains('show')) {
        renderGoldenCircleClient();
    }
    if (document.querySelector('#manifestation') && document.querySelector('#manifestation').classList.contains('show')) {
        renderManifestation();
    }
    if (document.querySelector('#nbdCrr') && document.querySelector('#nbdCrr').classList.contains('show')) {
        renderNBDCRR();
    }
    if (document.querySelector('#segmentWise') && document.querySelector('#segmentWise').classList.contains('show')) {
        renderSegmentWise();
    }
    if (document.querySelector('#gpWiseSummary') && document.querySelector('#gpWiseSummary').classList.contains('show')) {
        renderGPWiseSummary();
    }
}

// Tab event listeners
document.addEventListener('DOMContentLoaded', function () {
    const summaryTabBtn = document.getElementById('summaryReport-tab');
    if (summaryTabBtn) {
        summaryTabBtn.addEventListener('shown.bs.tab', function () {
            renderSummaryReport();
        });
    }

    const partyScoringTabBtn = document.getElementById('partyScoring-tab');
    if (partyScoringTabBtn) {
        partyScoringTabBtn.addEventListener('shown.bs.tab', function () {
            renderPartyScoring();
        });
    }

    const goldenCircleTabBtn = document.getElementById('goldenCircle-tab');
    if (goldenCircleTabBtn) {
        goldenCircleTabBtn.addEventListener('shown.bs.tab', function () {
            renderGoldenCircleClient();
        });
    }

    const manifestationTabBtn = document.getElementById('manifestation-tab');
    if (manifestationTabBtn) {
        manifestationTabBtn.addEventListener('shown.bs.tab', function () {
            renderManifestation();
        });
    }

    const nbdCrrTabBtn = document.getElementById('nbdCrr-tab');
    if (nbdCrrTabBtn) {
        nbdCrrTabBtn.addEventListener('shown.bs.tab', function () {
            renderNBDCRR();
        });
    }

    const segmentWiseTabBtn = document.getElementById('segmentWise-tab');
    if (segmentWiseTabBtn) {
        segmentWiseTabBtn.addEventListener('shown.bs.tab', function () {
            renderSegmentWise();
        });
    }

    const gpWiseTabBtn = document.getElementById('gpWiseSummary-tab');
    if (gpWiseTabBtn) {
        gpWiseTabBtn.addEventListener('shown.bs.tab', function () {
            renderGPWiseSummary();
        });
    }

    // Initial render if tab is already active
    setTimeout(function () {
        if (document.querySelector('#summaryReport') && document.querySelector('#summaryReport').classList.contains('show')) {
            renderSummaryReport();
        }
        if (document.querySelector('#partyScoring') && document.querySelector('#partyScoring').classList.contains('show')) {
            renderPartyScoring();
        }
        if (document.querySelector('#goldenCircle') && document.querySelector('#goldenCircle').classList.contains('show')) {
            renderGoldenCircleClient();
        }
        if (document.querySelector('#manifestation') && document.querySelector('#manifestation').classList.contains('show')) {
            renderManifestation();
        }
        if (document.querySelector('#nbdCrr') && document.querySelector('#nbdCrr').classList.contains('show')) {
            renderNBDCRR();
        }
        if (document.querySelector('#segmentWise') && document.querySelector('#segmentWise').classList.contains('show')) {
            renderSegmentWise();
        }
        if (document.querySelector('#gpWiseSummary') && document.querySelector('#gpWiseSummary').classList.contains('show')) {
            renderGPWiseSummary();
        }
    }, 300);
});

window.SalesanalysisAST_ShowReport = SalesanalysisAST_ShowReport;
