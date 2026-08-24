import { SalesanalysisASTService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesanalysisASTService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global variables
let G_ddlDealerNameList = [];
let fromDate = '0';
let toDate = '0';

// Chart instances
let baseSalesPieChartInstance = null;
let partySharePieChartInstance = null;
let regionalStateChartInstance = null;
let regionalCityChartInstance = null;
let regionalPartyChartInstance = null;
let productItemChartInstance = null;
let productSizeChartInstance = null;
let productThicknessChartInstance = null;
let tvgLostClientBarChartInstance = null;
let tvgManifestActualPieChartInstance = null;
let summaryGpPieChartInstance = null;
let summaryNbdCrrDonutChartInstance = null;
let salesComparisonBarChartInstance = null;

// Regional Analysis data and drill-down state
let G_RegionalAnalysisData = [];
let regionalAnalysisState = {
    level: 'state',
    selectedState: null,
    selectedCity: null
};

// Product Analysis data and drill-down state
let G_ProductAnalysisData = [];
let productAnalysisState = {
    level: 'item',
    selectedItem: null,
    selectedSize: null
};

// Initialize FilterSidePanelControl
function initFilterSidePanelControl() {
    console.log('Initializing FilterSidePanelControl...');

    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.error('FilterSidePanelControl element not found! Make sure <filter-side-panel-control id="filterPanel"> is in the HTML.');
        return;
    }

    console.log('FilterSidePanelControl found:', filterPanel);

    // Wait for the component to be fully defined
    if (!customElements.get('filter-side-panel-control')) {
        console.warn('filter-side-panel-control not yet defined, waiting...');
        customElements.whenDefined('filter-side-panel-control').then(() => {
            console.log('filter-side-panel-control now defined, continuing initialization...');
            initFilterSidePanelControl();
        });
        return;
    }

    // Initialize with empty filters first
    const filters = [
        { id: 'dateRange', type: 'daterange', label: 'Date Range' },
        { id: 'chkShowRecursive', type: 'checkbox', label: 'Show Recursive Marketing Man', checkboxLabel: 'Show Recursive Marketing Man', defaultChecked: true },
        { id: 'ddlSalesPersonlist', type: 'multiselect', label: 'Sales Person', data: [] },
        { id: 'ddlDealerNamelist', type: 'multiselect', label: 'Dealer Name', data: [] },
        { id: 'ddlCitiesNamelist', type: 'multiselect', label: 'Location', data: [] },
        { id: 'ddlStatusNamelist', type: 'multiselect', label: 'Status', data: [] },
        { id: 'ddlGPlist', type: 'multiselect', label: 'GP', data: [] },
        { id: 'ddlIndustryTypelist', type: 'multiselect', label: 'Segment', data: [] },
        { id: 'txtNotPurchaseFromDays', type: 'text', label: 'Not Purchase From Days', inputType: 'number', placeholder: 'Enter days', min: 0, step: 1, defaultValue: '60' }
    ];

    console.log('Setting filters:', filters);
    filterPanel.setFilters(filters);

    // Set default date range: Current Month by default, Financial Year if ?range=thisyear
    setTimeout(() => {
        console.log('Setting default date range...');
        try {
            const dateRangeEl = filterPanel.shadowRoot?.getElementById('dateRange');
            if (dateRangeEl) {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth(); // 0-based

                // Read URL query parameter ?range=thisyear
                const urlParams = new URLSearchParams(window.location.search);
                let rangeParam = (urlParams.get('range') || '').toLowerCase();
                //rangeParam='thisyear'
                let rangeFrom, rangeTo;

                if (rangeParam === 'thisyear') {
                    // Financial Year (April 1 – March 31)
                    const fyStartYear = (month >= 3) ? year : (year - 1); // month >= 3 means April onwards (0-based)
                    const fyEndYear = fyStartYear + 1;
                    rangeFrom = `${fyStartYear}-04-01`;
                    rangeTo = `${fyEndYear}-03-31`;
                    console.log(`Setting financial year range: ${rangeFrom} to ${rangeTo}`);
                } else {
                    // Current Month (default)
                    const mm = String(month + 1).padStart(2, '0');
                    const lastDay = new Date(year, month + 1, 0).getDate();
                    rangeFrom = `${year}-${mm}-01`;
                    rangeTo = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
                    console.log(`Setting current month range: ${rangeFrom} to ${rangeTo}`);
                }

                dateRangeEl.setRange({ fromDate: rangeFrom, toDate: rangeTo });
                fromDate = rangeFrom;
                toDate = rangeTo;
                console.log('Date range set successfully');
            } else {
                console.warn('DateRange element not found in shadow DOM');
            }
        } catch (e) {
            console.error('Failed to set default date range:', e);
        }
    }, 500);

    // Listen to filter apply event
    filterPanel.addEventListener('filtersapplied', (e) => {
        console.log('Filters applied event received:', e.detail);
        const filters = e.detail.filters;

        // Update global date variables
        if (filters.dateRange) {
            fromDate = filters.dateRange.fromDate || '0';
            toDate = filters.dateRange.toDate || '0';
            console.log(`Updated global date range: ${fromDate} to ${toDate}`);
        }

        // Show the report
        console.log('Calling SalesanalysisAST_ShowReport...');
        SalesanalysisAST_ShowReport();
    });

    console.log('FilterSidePanelControl initialized, loading dropdowns...');
    // Load dropdown data
    loadFilterDropdowns(filterPanel);
}

// Load all dropdown data for filters
function loadFilterDropdowns(filterPanel) {
    // Create an array to track all promises
    const loadPromises = [];

    // Load Sales Person List
    const salesPersonPromise = CRMReportsServices.GetSalespersonList().then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.Code, Desp: item.PersonName }))
            filterPanel.updateFilterData('ddlSalesPersonlist', data);

            // Setup change listener for dependent dealer dropdown
            setTimeout(() => {
                const salesPersonWrapper = filterPanel.shadowRoot.getElementById('ddlSalesPersonlist');
                if (salesPersonWrapper) {
                    const checkboxes = salesPersonWrapper.querySelectorAll('.ddlSalesPersonlist_chk');
                    checkboxes.forEach(chk => {
                        chk.addEventListener('change', () => {
                            updateDealerListBasedOnSalesPerson(filterPanel);
                        });
                    });
                }

                // Re-load dealer list when Show Recursive checkbox changes
                const recursiveChk = filterPanel.shadowRoot.getElementById('chkShowRecursive');
                if (recursiveChk) {
                    recursiveChk.addEventListener('change', () => {
                        updateDealerListBasedOnSalesPerson(filterPanel);
                    });
                }
            }, 500);
        }
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
    });
    loadPromises.push(salesPersonPromise);

    // Load Dealer List
    const dealerPromise = CRMReportsServices.GetDealerList().then(function (response) {
        if (response && response.length > 0) {
            G_ddlDealerNameList = response.slice();
            const data = response.map(item => ({ Code: item.Code, Desp: item.AccountDesp }));
            filterPanel.updateFilterData('ddlDealerNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching dealer list:', error);
    });
    loadPromises.push(dealerPromise);

    // Load Cities List
    const citiesPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_CITIESNAMELIST', '0', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.CityName, Desp: item.CityName }));
            filterPanel.updateFilterData('ddlCitiesNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching cities list:', error);
    });
    loadPromises.push(citiesPromise);

    // Load Status List
    const statusPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_STATUSNAME', '0', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.StatusName, Desp: item.StatusName }));
            filterPanel.updateFilterData('ddlStatusNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching status list:', error);
    });
    loadPromises.push(statusPromise);

    // Load GP List
    const gpPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_GPLIST', '0', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.GP, Desp: item.GP }));
            filterPanel.updateFilterData('ddlGPlist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching GP list:', error);
    });
    loadPromises.push(gpPromise);

    // Load Industry Type List
    const industryPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_INDUSTRYTYPELIST', '0', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.Code, Desp: item.IndustryType }));
            filterPanel.updateFilterData('ddlIndustryTypelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching industry type list:', error);
    });
    loadPromises.push(industryPromise);

    // Wait for all dropdowns to load, then call the report
    Promise.all(loadPromises).then(function () {
        console.log('All filter dropdowns loaded successfully');
        // Call the report after all filters are loaded
        setTimeout(() => {
            console.log('Calling SalesanalysisAST_ShowReport after all filters loaded...');
            SalesanalysisAST_ShowReport();
        }, 1000); // Adding a small delay to ensure UI updates are complete
    }).catch(function (error) {
        console.error('Error loading one or more filter dropdowns:', error);
        // Still call the report even if some filters failed to load
        setTimeout(() => {
            console.log('Calling SalesanalysisAST_ShowReport (with some filter errors)...');
            SalesanalysisAST_ShowReport();
        }, 1000);
    });
}

// Update dealer list based on selected sales persons (dependent dropdown)
function updateDealerListBasedOnSalesPerson(filterPanel) {
    const filterValues = filterPanel.getFilterValues();
    const salesPersonFilter = filterValues.ddlSalesPersonlist;

    if (!salesPersonFilter || salesPersonFilter.values.length === 0) {
        return;
    }

    const isNested = filterValues.chkShowRecursive !== false ? 'Y' : 'N';

    const promises = salesPersonFilter.values.map(function (code) {
        try {
            return CRMReportsServices.GetDealerList(code, isNested);
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
            const data = merged.map(item => ({ Code: item.Code, Desp: item.AccountDesp }));
            filterPanel.updateFilterData('ddlDealerNamelist', data);
        } else {
            G_ddlDealerNameList = [];
            filterPanel.updateFilterData('ddlDealerNamelist', []);
        }
    }).catch(function (err) {
        console.error('Error fetching dealer lists for selected salespersons', err);
        G_ddlDealerNameList = [];
        filterPanel.updateFilterData('ddlDealerNamelist', []);
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilterSidePanelControl);
} else {
    initFilterSidePanelControl();
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

function formatInteger(v) {
    return Number(v || 0).toLocaleString('en-US');
}

function formatIndianCurrency(v) {
    return '₹ ' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatLakhsValue(v) {
    const lakhs = Number(v || 0) / 100000;
    return `₹ ${lakhs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
}

function getSummaryTrendInfo(current, previous, higherIsBetter = true) {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;

    if (prev === 0 && curr === 0) {
        return { pct: 0, symbol: '=', isPositive: true };
    }

    const pct = prev === 0 ? 100 : Math.abs(((curr - prev) / prev) * 100);
    const increased = curr > prev;
    const isPositive = higherIsBetter ? increased : !increased;

    return {
        pct,
        symbol: curr > prev ? '▲' : (curr < prev ? '▼' : '='),
        isPositive
    };
}

function setSummaryKpiTrend(elementId, current, previous, higherIsBetter = true) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (previous === null || previous === undefined) {
        el.className = 'summary-kpi-trend trend-neutral';
        el.innerHTML = '<span>Current Month</span>';
        return;
    }

    const trend = getSummaryTrendInfo(current, previous, higherIsBetter);
    el.className = `summary-kpi-trend ${trend.isPositive ? 'trend-positive' : 'trend-negative'}`;
    el.innerHTML = `${trend.symbol} ${trend.pct.toFixed(1)}% <span>vs Last Month</span>`;
}

function parseSummaryReportResponse(response) {
    let rows = [];
    let summaryRow = null;

    if (!response) {
        return { rows, summaryRow };
    }

    if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
            rows = response[0] || [];
            summaryRow = (response[1] && response[1][0]) ? response[1][0] : null;
        } else if (response.length > 0) {
            rows = response;
        }
    } else if (response.Table || response.Table1) {
        rows = response.Table || response.Table1 || [];
        summaryRow = (response.Table2 && response.Table2[0]) ? response.Table2[0] : null;
    }

    return { rows: rows || [], summaryRow: summaryRow || null };
}

function categorizeGpForSummary(gpValue) {
    const gp = (gpValue || '').toString().trim().toLowerCase();
    if (gp.includes('super high') || gp.includes('high')) return 'high';
    if (gp.includes('medium') || gp.includes('med')) return 'medium';
    if (gp.includes('low')) return 'low';
    return 'other';
}

function aggregateSummaryMetrics(rows, summaryRow) {
    const lostClientParties = new Set();
    const nbdParties = new Set();
    const crrParties = new Set();
    const uniqueParties = new Set();
    let totalSaleMt = 0;
    let manifestedTotal = 0;
    let lostFreight = 0;
    const gpMtMap = { high: 0, medium: 0, low: 0, other: 0 };

    (rows || []).forEach(function (row, index) {
        const weight = parseFloat(row['Weight'] || row.weight || row.QtyMT || 0) || 0;
        const manifestation = parseFloat(row['Manifestation'] || row.Manifestation || 0) || 0;
        const party = (row['Party Name'] || row.PartyName || '').trim();
        const gpCategory = categorizeGpForSummary(row['GP'] || row.GP);
        const nbdCrr = (row['NBD/CRR'] || row.NBD_CRRType || row.NbdCrr || '').toString().trim().toUpperCase();
        const lostClient = (row['Lost Client'] || row.LostClient || '').toString().trim();
        const status = (row['Status'] || row.Status || '').toString().toUpperCase();
        const freight = parseFloat(row['Lost Freight'] || row.LostFreight || row['LostFreight'] || 0) || 0;

        if (party) uniqueParties.add(party.toLowerCase());

        totalSaleMt += weight;
        manifestedTotal += manifestation;
        lostFreight += freight;
        gpMtMap[gpCategory] = (gpMtMap[gpCategory] || 0) + weight;

        if (lostClient || status.includes('LOST')) {
            if (party) lostClientParties.add(party.toLowerCase());
        }

        const rowKey = (party || `row-${index}`).toLowerCase();
        if (nbdCrr.includes('NBD')) {
            nbdParties.add(rowKey);
        } else if (nbdCrr.includes('CRR')) {
            crrParties.add(rowKey);
        }
    });

    const sr = summaryRow || {};
    totalSaleMt = parseFloat(sr.TotalSale || sr.TotalSales || sr.TotalActualSales || sr['Total Sale'] || totalSaleMt) || totalSaleMt;
    const teamSaleMt = parseFloat(sr.TeamSale || sr.TeamSaleMT || sr['Team Sale'] || totalSaleMt) || totalSaleMt;
    const lostClients = parseFloat(sr.LostClients || sr.LostClient || sr['Lost Clients'] || lostClientParties.size) || lostClientParties.size;
    lostFreight = parseFloat(sr.LostFreight || sr['Lost Freight'] || lostFreight) || lostFreight;
    const totalParties = parseInt(
        sr.TotalClients || sr.TotalParties || sr['Total Parties'] || sr.TotalClient || sr['Total Clients'] || sr.NoOfParties || uniqueParties.size,
        10
    ) || uniqueParties.size;
    const nbdCount = parseInt(sr.NBDCount || sr.NBD || sr['NBD Count'] || nbdParties.size, 10) || nbdParties.size;
    const crrCount = parseInt(sr.CRRCount || sr.CRR || sr['CRR Count'] || crrParties.size, 10) || crrParties.size;
    const totalManifested = parseFloat(sr.TotalManifested || sr.totalManifested || manifestedTotal) || manifestedTotal;
    const readyDispatch = parseFloat(sr.ReadyToDispatch || sr.ReadyToDispatchStock || sr['Ready To Dispatch'] || 0) || 0;
    const readyDispatchValue = parseFloat(sr.ReadyToDispatchValue || sr['Ready To Dispatch Value'] || sr.ReadyDispatchValue || 0) || 0;
    const manifestActualScore = totalManifested > 0 ? (totalSaleMt / totalManifested) * 100 : 0;

    return {
        totalSaleMt,
        teamSaleMt,
        lostClients,
        totalParties,
        manifestActualScore,
        lostFreight,
        nbdCount,
        crrCount,
        nbdCrrTotal: nbdCount + crrCount,
        readyDispatch,
        readyDispatchValue,
        gpMtMap,
        totalManifested
    };
}

function clearSummaryDashboard() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('skpi-total-sale', '0 MT');
    setText('skpi-lost-client', '0');
    setText('skpi-total-parties', '0');
    setText('skpi-manifest-score', '0.00%');
    setText('skpi-total-manifested', '0 MT');
    setText('skpi-lost-freight', '₹ 0');
    setText('skpi-nbd-count', '0');
    setText('skpi-crr-count', '0');
    setText('skpi-nbd-crr-total', '0');
    setText('skpi-ready-dispatch', '0 MT');
    setText('skpi-ready-dispatch-value', '₹ 0.00 L');
    setText('summaryNbdCrrDonutTotal', '0');

    const gpLegend = document.getElementById('summaryGpLegend');
    const nbdLegend = document.getElementById('summaryNbdCrrLegend');
    if (gpLegend) gpLegend.innerHTML = '';
    if (nbdLegend) nbdLegend.innerHTML = '';

    if (summaryGpPieChartInstance) {
        try { summaryGpPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryGpPieChartInstance = null;
    }
    if (summaryNbdCrrDonutChartInstance) {
        try { summaryNbdCrrDonutChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryNbdCrrDonutChartInstance = null;
    }
}

function renderSummaryGpLegend(items) {
    const legend = document.getElementById('summaryGpLegend');
    if (!legend) return;

    legend.innerHTML = items.map(function (item) {
        return `
            <div class="summary-legend-item">
                <span class="summary-legend-swatch" style="background:${item.color};"></span>
                <div>
                    <div class="summary-legend-label">${escapeHtml(item.label)}</div>
                    <div class="summary-legend-meta">${escapeHtml(item.criteria)}</div>
                    <div class="summary-legend-meta">${formatNumber(item.value)} MT</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSummaryNbdCrrLegend(nbdCount, crrCount) {
    const legend = document.getElementById('summaryNbdCrrLegend');
    if (!legend) return;

    const total = nbdCount + crrCount;
    const nbdPct = total > 0 ? ((nbdCount / total) * 100).toFixed(0) : '0';
    const crrPct = total > 0 ? ((crrCount / total) * 100).toFixed(0) : '0';

    legend.innerHTML = `
        <div class="summary-legend-item">
            <span class="summary-legend-swatch" style="background:#6f42c1;"></span>
            <div>
                <div class="summary-legend-label">NBD</div>
                <div class="summary-legend-meta">${formatInteger(nbdCount)} (${nbdPct}%)</div>
            </div>
        </div>
        <div class="summary-legend-item">
            <span class="summary-legend-swatch" style="background:#4e73df;"></span>
            <div>
                <div class="summary-legend-label">CRR</div>
                <div class="summary-legend-meta">${formatInteger(crrCount)} (${crrPct}%)</div>
            </div>
        </div>
    `;
}

function renderSummaryGpPieChart(gpMtMap) {
    const canvas = document.getElementById('summaryGpPieChart');
    if (!canvas) return;

    if (summaryGpPieChartInstance) {
        try { summaryGpPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryGpPieChartInstance = null;
    }

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    const chartItems = [
        { key: 'high', label: 'High GP', criteria: '(> 12%)', color: '#1cc88a' },
        { key: 'medium', label: 'Medium GP', criteria: '(5% – 12%)', color: '#f6c23e' },
        { key: 'low', label: 'Low GP', criteria: '(< 5%)', color: '#e74a3b' }
    ];

    const visibleItems = chartItems
        .map(function (item) {
            return {
                ...item,
                value: gpMtMap[item.key] || 0
            };
        })
        .filter(function (item) { return item.value > 0; });

    if (visibleItems.length === 0) {
        renderSummaryGpLegend([]);
        return;
    }

    const labels = visibleItems.map(function (item) { return item.label; });
    const values = visibleItems.map(function (item) { return item.value; });
    const colors = visibleItems.map(function (item) { return item.color; });
    const total = values.reduce(function (sum, val) { return sum + val; }, 0);

    renderSummaryGpLegend(visibleItems);

    summaryGpPieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${formatNumber(value)} MT (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 12 },
                    formatter: function (value) {
                        const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                        return `${pct}%`;
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
}

function renderSummaryNbdCrrDonutChart(nbdCount, crrCount) {
    const canvas = document.getElementById('summaryNbdCrrDonutChart');
    if (!canvas) return;

    if (summaryNbdCrrDonutChartInstance) {
        try { summaryNbdCrrDonutChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryNbdCrrDonutChartInstance = null;
    }

    const total = nbdCount + crrCount;
    const totalEl = document.getElementById('summaryNbdCrrDonutTotal');
    if (totalEl) totalEl.textContent = formatInteger(total);

    renderSummaryNbdCrrLegend(nbdCount, crrCount);

    if (total === 0) return;

    summaryNbdCrrDonutChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['NBD', 'CRR'],
            datasets: [{
                data: [nbdCount, crrCount],
                backgroundColor: ['#6f42c1', '#4e73df'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                            return `${context.label}: ${formatInteger(value)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderSummaryDashboard(metrics) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('skpi-total-sale', `${formatNumber(metrics.totalSaleMt)} MT`);
    setText('skpi-lost-client', formatInteger(metrics.lostClients));
    setText('skpi-total-parties', formatInteger(metrics.totalParties));
    setText('skpi-manifest-score', `${metrics.manifestActualScore.toFixed(2)}%`);
    setText('skpi-total-manifested', `${formatNumber(metrics.totalManifested)} MT`);
    setText('skpi-lost-freight', formatIndianCurrency(metrics.lostFreight));
    setText('skpi-nbd-count', formatInteger(metrics.nbdCount));
    setText('skpi-crr-count', formatInteger(metrics.crrCount));
    setText('skpi-nbd-crr-total', formatInteger(metrics.nbdCrrTotal));
    setText('skpi-ready-dispatch', `${formatNumber(metrics.readyDispatch)} MT`);
    setText('skpi-ready-dispatch-value', formatLakhsValue(metrics.readyDispatchValue));

    renderSummaryGpPieChart(metrics.gpMtMap);
    renderSummaryNbdCrrDonutChart(metrics.nbdCount, metrics.crrCount);
}

function formatDateYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getLastMonthAsOnDateRange(fromDateStr, toDateStr) {
    if (!fromDateStr || !toDateStr || fromDateStr === '0' || toDateStr === '0') {
        return null;
    }

    const from = new Date(fromDateStr);
    const to = new Date(toDateStr);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return null;
    }

    const prevFrom = new Date(from.getFullYear(), from.getMonth() - 1, from.getDate());
    const prevTo = new Date(to.getFullYear(), to.getMonth() - 1, to.getDate());

    return {
        fromDate: formatDateYYYYMMDD(prevFrom),
        toDate: formatDateYYYYMMDD(prevTo)
    };
}

function getWeekOfMonthFromDate(dateStr) {
    if (!dateStr) return null;

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfMonth = date.getDate();
        const firstDayOfWeek = firstDay.getDay();

        return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
    } catch (e) {
        return null;
    }
}

function getSaleCompareInfo(currentValue, previousValue) {
    const current = parseFloat(currentValue) || 0;
    const previous = parseFloat(previousValue) || 0;

    if (current > previous) {
        return { bgStyle: 'background-color:#c6efce;', symbol: '▲', symbolColor: '#006100' };
    }
    if (current < previous) {
        return { bgStyle: 'background-color:#ffc7ce;', symbol: '▼', symbolColor: '#9c0006' };
    }
    return { bgStyle: 'background-color:#ffeb9c;', symbol: '=', symbolColor: '#806000' };
}

function formatSaleCompareCell(currentValue, previousValue, displayValue, bold) {
    const info = getSaleCompareInfo(currentValue, previousValue);
    const valueHtml = bold ? `<strong>${formatNumber(displayValue)}</strong>` : formatNumber(displayValue);

    return {
        style: info.bgStyle,
        html: `<span style="color:${info.symbolColor};font-weight:bold;margin-right:4px;">${info.symbol}</span>${valueHtml}`
    };
}

function aggregateSegmentWiseData(data) {
    const segmentData = new Map();
    let grandTotalWeight = 0;
    let grandTotalManifested = 0;
    const grandWeekTotals = {};
    const allWeeks = new Set();

    (data || []).forEach(function (row) {
        const segment = row['Segment'] || row['SEGMENT'] || row['IndustryType'] || 'Unknown';
        const buyerName = row['Party Name'] || row['Buyers Name'] || row['BuyersName'] || row['PartyName'] || 'Unknown';
        const weight = parseFloat(row['Weight'] || row['WEIGHT'] || 0);
        const manifestedWeight = parseFloat(row['Manifested Weight'] || row['ManifestedWeight'] || 0);
        const invoiceDate = row['Invoice Date'] || row['InvoiceDate'] || row['INVOICE_DATE'];
        const week = getWeekOfMonthFromDate(invoiceDate);

        if (!segmentData.has(segment)) {
            segmentData.set(segment, {
                totalWeight: 0,
                totalManifested: 0,
                weekTotals: {},
                buyersMap: new Map()
            });
        }

        const segInfo = segmentData.get(segment);
        segInfo.totalWeight += weight;
        segInfo.totalManifested += manifestedWeight;

        if (week !== null) {
            const weekKey = `W${week}`;
            allWeeks.add(week);
            segInfo.weekTotals[weekKey] = (segInfo.weekTotals[weekKey] || 0) + weight;
            grandWeekTotals[weekKey] = (grandWeekTotals[weekKey] || 0) + weight;
        }

        if (!segInfo.buyersMap.has(buyerName)) {
            segInfo.buyersMap.set(buyerName, {
                weight: 0,
                manifested: 0,
                weekSales: {}
            });
        }

        const buyerInfo = segInfo.buyersMap.get(buyerName);
        buyerInfo.weight += weight;
        buyerInfo.manifested += manifestedWeight;

        if (week !== null) {
            const weekKey = `W${week}`;
            buyerInfo.weekSales[weekKey] = (buyerInfo.weekSales[weekKey] || 0) + weight;
        }

        grandTotalWeight += weight;
        grandTotalManifested += manifestedWeight;
    });

    return {
        segmentData,
        grandTotalWeight,
        grandTotalManifested,
        grandWeekTotals,
        sortedWeeks: Array.from(allWeeks).sort((a, b) => a - b)
    };
}

// Helper function to collect all filter values
function GetAllFilters() {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.warn('FilterSidePanelControl not found - using fallback values');
        // Fallback to old method if control not found
        return {
            dealerCodes: '0',
            salesPersons: '0',
            cities: '0',
            status: '0',
            gp: '0',
            industryType: '0',
            notPurchaseFromDays: '60',
            fromDate: fromDate,
            toDate: toDate
        };
    }

    try {
        const filterValues = filterPanel.getFilterValues();
        console.log('Filter values from control:', filterValues);

        const rawDealerCodes = filterValues.ddlDealerNamelist?.joined || '0';
        const rawNotPurchaseFromDays = filterValues.txtNotPurchaseFromDays;
        const filters = {
            dealerCodes: rawDealerCodes === '0' || rawDealerCodes === '' ? '-1' : rawDealerCodes,
            salesPersons: filterValues.ddlSalesPersonlist?.joined || '0',
            cities: filterValues.ddlCitiesNamelist?.joined || '0',
            status: filterValues.ddlStatusNamelist?.joined || '0',
            gp: filterValues.ddlGPlist?.joined || '0',
            industryType: filterValues.ddlIndustryTypelist?.joined || '0',
            notPurchaseFromDays: (rawNotPurchaseFromDays === undefined || rawNotPurchaseFromDays === null || String(rawNotPurchaseFromDays).trim() === '') ? '60' : String(rawNotPurchaseFromDays).trim(),
            fromDate: filterValues.dateRange?.fromDate || fromDate || '0',
            toDate: filterValues.dateRange?.toDate || toDate || '0'
        };

        console.log('Processed filters:', filters);
        return filters;
    } catch (e) {
        console.error('Error getting filter values:', e);
        return {
            dealerCodes: '0',
            salesPersons: '0',
            cities: '0',
            status: '0',
            gp: '0',
            industryType: '0',
            notPurchaseFromDays: '60',
            fromDate: fromDate,
            toDate: toDate
        };
    }
}

// Helper function to format date for display
function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr === '0') return '';
    try {
        const date = new Date(dateStr);
        const day = date.getDate();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch (e) {
        return dateStr;
    }
}

// Helper function to update report date range display
function updateReportDateRangeDisplay() {
    const fromDateDisplay = fromDate !== '0' ? formatDateForDisplay(fromDate) : 'N/A';
    const toDateDisplay = toDate !== '0' ? formatDateForDisplay(toDate) : 'Today';
    document.getElementById('report-date-range').textContent = `Report Showing From : ${fromDateDisplay} to ${toDateDisplay}`;
}

// Tab rendering functions
function renderSummaryReport() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    Showloader();
    updateReportDateRangeDisplay();

    SalesanalysisASTService.GetMultipleTableSalesAnalysisData(
        'SUMMARY_REPORT',
        filters.dealerCodes,
        filters.fromDate,
        filters.toDate,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    ).then(function (response) {
        HideLoader();

        const parsed = parseSummaryReportResponse(response);

        if (!parsed.rows || parsed.rows.length === 0) {
            console.warn('No summary report data received');
            clearSummaryDashboard();
            const hdr = document.getElementById('summaryReportTableHeader');
            const bdy = document.getElementById('summaryReportTableBody');
            if (hdr) hdr.innerHTML = '';
            if (bdy) bdy.innerHTML = '<tr><td class="text-center">No data available</td></tr>';
            return;
        }

        const metrics = aggregateSummaryMetrics(parsed.rows, parsed.summaryRow);
        renderSummaryDashboard(metrics);

        const StringFilterColumn = ["Party Name", "Segment", "Marketing Man", "Location", "NBD/CRR", "Lost Client"];
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
            BizsolCustomFilterGrid.CreateDataTable("summaryReportTableHeader", "summaryReportTableBody", parsed.rows, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching summary report data:', err);
        clearSummaryDashboard();
    });
}

function renderPartyScoring() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('PARTY_SCORING', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
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

        response.forEach(function (row) {
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

            //// Count by Party ID
            //const partyId = row['Party ID'] || row.PartyID || row['Party Name'] || '';
            //if (partyId) {
            //    partyIdCounts.set(partyId, (partyIdCounts.get(partyId) || 0) + 1);
            //}
            // Count by Party ID
            const partyId = row['Party ID'] || row.PartyID || row['Party Name'] || '';
            if (partyId) {
                const parsed = parseInt(row['Score'], 10);
                partyIdCounts.set(partyId, Number.isNaN(parsed) ? 0 : parsed);
            }
        });

        // Populate Location Summary Grid
        populateSummaryGrid('locationSummaryBody', locationCounts, 'Location');

        // Populate MGKT Person Summary Grid
        populateSummaryGrid('mgktPersonSummaryBody', mgktPersonCounts, 'MGKT Person');

        // Populate Party ID Summary Grid
        populateSummaryGrid('partyIdSummaryBody', partyIdCounts, 'Parties');

        // Render main Party Scoring table
        const StringFilterColumn = ["Party Name", "Segment", "Marketing Man", "Location"];
        const NumericFilterColumn = ["Score"];
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
    sortedData.forEach(function ([key, count], index) {
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
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('GOLDEN_CIRCLE', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No golden circle client data received');
            // Clear all visualizations
            clearGoldenCircleDashboard();
            return;
        }

        // Process data for visualizations
        processGoldenCircleData(response);

        // Render original data table
        const StringFilterColumn = ["Party Name", "Item Name", "Marketing Man", "GP"];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Weight': 'right',
            'GP': 'right',
            'Sales': 'right',
            'Growth (%)': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("goldenCircleTableHeader", "goldenCircleTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }

        const goldenCircleNote = document.getElementById('goldenCircleGpFilterNote');
        if (goldenCircleNote) {
            goldenCircleNote.classList.remove('alert-warning');
            goldenCircleNote.classList.add('alert-info');
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching golden circle data:', err);
        clearGoldenCircleDashboard();
    });
}

function clearGoldenCircleDashboard() {
    // Clear charts
    if (baseSalesPieChartInstance) {
        baseSalesPieChartInstance.destroy();
        baseSalesPieChartInstance = null;
    }
    if (partySharePieChartInstance) {
        partySharePieChartInstance.destroy();
        partySharePieChartInstance = null;
    }

    // Clear tables
    document.getElementById('mgktPersonWeightBody').innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data available</td></tr>';
    document.getElementById('baseWeightBody').innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data available</td></tr>';
    document.getElementById('gpWeightBody').innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';

    const goldenCircleHeader = document.getElementById('goldenCircleTableHeader');
    const goldenCircleBody = document.getElementById('goldenCircleTableBody');
    const goldenCirclePaginator = document.getElementById('paginator-goldenCircleTable');
    const noDataMessage = 'No data available. Please apply GP filter and select <strong>Super High</strong> to view Golden Circle Client data.';

    if (goldenCircleHeader) goldenCircleHeader.innerHTML = '';
    if (goldenCircleBody) goldenCircleBody.innerHTML = `<tr><td colspan="100%" class="text-center text-muted">${noDataMessage}</td></tr>`;
    if (goldenCirclePaginator) goldenCirclePaginator.innerHTML = '';

    const goldenCircleNote = document.getElementById('goldenCircleGpFilterNote');
    if (goldenCircleNote) {
        goldenCircleNote.classList.remove('alert-info');
        goldenCircleNote.classList.add('alert-warning');
    }

    // Reset footers
    const mgktFooter = document.getElementById('mgktPersonWeightFooter');
    if (mgktFooter) {
        mgktFooter.innerHTML = '<tr><td class="col-width-2-name"><strong>Grand total</strong></td><td class="text-end col-width-2-value"><strong>0.00</strong></td></tr>';
    }

    const baseFooter = document.getElementById('baseWeightFooter');
    if (baseFooter) {
        baseFooter.innerHTML = '<tr><td class="col-width-2-name"><strong>Grand total</strong></td><td class="text-end col-width-2-value"><strong>0.00</strong></td></tr>';
    }

    const gpFooter = document.getElementById('gpWeightFooter');
    if (gpFooter) {
        gpFooter.innerHTML = '<tr><td class="col-width-4-party"><strong>Grand total</strong></td><td class="text-end col-width-4-value"><strong>0.00</strong></td><td class="text-end col-width-4-value"><strong>0.00</strong></td><td class="text-end col-width-4-value"><strong>0.00</strong></td></tr>';
    }
}

// Helper function to create pie charts using Chart.js
function createPieChart(canvasId, labels, data, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn('Canvas element not found:', canvasId);
        return null;
    }

    const ctx = canvas.getContext('2d');

    // Generate colors for the chart
    const colors = generateColors(labels.length);

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to generate colors
function generateColors(count) {
    const baseColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#858796', '#5a5c69', '#2e59d9', '#17a673', '#2c9faf'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

function processGoldenCircleData(data) {
    // Clear existing charts
    if (baseSalesPieChartInstance) {
        baseSalesPieChartInstance.destroy();
    }
    if (partySharePieChartInstance) {
        partySharePieChartInstance.destroy();
    }

    // Aggregations
    const mgktPersonWeight = new Map();
    const baseWeight = new Map();
    const partyWeight = new Map();
    const gpByParty = new Map(); // Map<partyCode, {High: 0, Low: 0, Medium: 0}>

    data.forEach(function (row) {
        // Marketing Person aggregation
        const marketingMan = row['Marketing Man'] || row.MarketingMan || row['MGKT Person'] || 'Unknown';
        const weight = parseFloat(row['Weight'] || row.weight || 0);
        mgktPersonWeight.set(marketingMan, (mgktPersonWeight.get(marketingMan) || 0) + weight);

        // Base (Item Name) aggregation
        const itemName = row['Item Name'] || row.ItemName || row.BASE || 'Unknown';
        baseWeight.set(itemName, (baseWeight.get(itemName) || 0) + weight);

        // Party aggregation for pie chart
        const partyName = row['Party Name'] || row.PartyName || 'Unknown';
        partyWeight.set(partyName, (partyWeight.get(partyName) || 0) + weight);

        // GP by Party aggregation
        const partyCode = row['Party Name'] || row.PartyName || row['PARTY_CODE'] || 'Unknown';
        const gp = (row['GP'] || row.gp || '').toString().toUpperCase();

        if (!gpByParty.has(partyCode)) {
            gpByParty.set(partyCode, { High: 0, Low: 0, Medium: 0 });
        }

        const gpData = gpByParty.get(partyCode);
        if (gp.includes('HIGH') || gp.includes('HRC') || gp.includes('CRCA') || gp.includes('HRPO')) {
            gpData.High += weight;
        } else if (gp.includes('LOW') || gp.includes('GI') || gp.includes('CRFH')) {
            gpData.Low += weight;
        } else if (gp.includes('MEDIUM') || gp.includes('GP')) {
            gpData.Medium += weight;
        }
    });

    // Render Marketing Person Weight Table
    renderMgktPersonWeightTable(mgktPersonWeight);

    // Render Base Weight Table and Pie Chart
    renderBaseWeightTable(baseWeight);
    renderBaseSalesPieChart(baseWeight);

    // Render Party Share Pie Chart
    renderPartySharePieChart(partyWeight);

    // Render GP / Weight Table
    renderGPWeightTable(gpByParty);
}

function renderMgktPersonWeightTable(mgktPersonWeight) {
    const tbody = document.getElementById('mgktPersonWeightBody');
    const tfoot = document.getElementById('mgktPersonWeightFooter');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by weight descending
    const sorted = Array.from(mgktPersonWeight.entries())
        .sort((a, b) => b[1] - a[1]);

    let grandTotal = 0;
    sorted.forEach(function ([person, weight]) {
        grandTotal += weight;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-width-2-name">${escapeHtml(person)}</td>
            <td class="text-end col-width-2-value">${formatNumber(weight)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update grand total in footer
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td class="col-width-2-name"><strong>Grand total</strong></td>
                <td class="text-end col-width-2-value"><strong>${formatNumber(grandTotal)}</strong></td>
            </tr>
        `;
    }
}

function renderBaseWeightTable(baseWeight) {
    const tbody = document.getElementById('baseWeightBody');
    const tfoot = document.getElementById('baseWeightFooter');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by weight descending
    const sorted = Array.from(baseWeight.entries())
        .sort((a, b) => b[1] - a[1]);

    let grandTotal = 0;
    sorted.forEach(function ([base, weight]) {
        grandTotal += weight;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-width-2-name">${escapeHtml(base)}</td>
            <td class="text-end col-width-2-value">${formatNumber(weight)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update grand total in footer
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td class="col-width-2-name"><strong>Grand total</strong></td>
                <td class="text-end col-width-2-value"><strong>${formatNumber(grandTotal)}</strong></td>
            </tr>
        `;
    }
}

function renderBaseSalesPieChart(baseWeight) {
    const sorted = Array.from(baseWeight.entries())
        .sort((a, b) => b[1] - a[1]);

    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);

    baseSalesPieChartInstance = createPieChart('baseSalesPieChart', labels, data, 'Base wise Sales % with weight');
}

function renderPartySharePieChart(partyWeight) {
    // Sort by weight descending
    const sorted = Array.from(partyWeight.entries())
        .sort((a, b) => b[1] - a[1]);

    // Take top 10 parties and group the rest as "Others"
    const topParties = sorted.slice(0, 10);
    const othersWeight = sorted.slice(10).reduce((sum, item) => sum + item[1], 0);

    const labels = topParties.map(item => item[0]);
    const data = topParties.map(item => item[1]);

    if (othersWeight > 0) {
        labels.push('Others');
        data.push(othersWeight);
    }

    partySharePieChartInstance = createPieChart('partySharePieChart', labels, data, 'Partywise Share % in Sales');
}

function renderGPWeightTable(gpByParty) {
    const tbody = document.getElementById('gpWeightBody');
    const tfoot = document.getElementById('gpWeightFooter');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by total weight descending
    const sorted = Array.from(gpByParty.entries())
        .sort((a, b) => {
            const totalA = a[1].High + a[1].Low + a[1].Medium;
            const totalB = b[1].High + b[1].Low + b[1].Medium;
            return totalB - totalA;
        });

    let grandTotalHigh = 0;
    let grandTotalLow = 0;
    let grandTotalMedium = 0;

    sorted.forEach(function ([party, gpData]) {
        grandTotalHigh += gpData.High;
        grandTotalLow += gpData.Low;
        grandTotalMedium += gpData.Medium;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-width-4-party">${escapeHtml(party)}</td>
            <td class="text-end col-width-4-value">${formatNumber(gpData.High)}</td>
            <td class="text-end col-width-4-value">${formatNumber(gpData.Low)}</td>
            <td class="text-end col-width-4-value">${formatNumber(gpData.Medium)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update grand total in footer
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td class="col-width-4-party"><strong>Grand total</strong></td>
                <td class="text-end col-width-4-value"><strong>${formatNumber(grandTotalHigh)}</strong></td>
                <td class="text-end col-width-4-value"><strong>${formatNumber(grandTotalLow)}</strong></td>
                <td class="text-end col-width-4-value"><strong>${formatNumber(grandTotalMedium)}</strong></td>
            </tr>
        `;
    }
}

function renderManifestation() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetMultipleTableSalesAnalysisData('MANIFESTATION', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response) {
            console.warn('No manifestation data received');
            clearManifestationTables();
            return;
        }

        console.log('Manifestation API Response:', response);

        // The API can return data in different formats:
        // Format 1: { weekWeight: [], manifeste: [], orderSheet: [], itemWeight: [] }
        // Format 2: { WeekWeight: [], Manifeste: [], OrderSheet: [], ItemWeight: [] }
        // Format 3: { Table1: [], Table2: [], Table3: [], Table4: [] }
        // Format 4: Array of 4 separate arrays [[...], [...], [...], [...]]
        // Format 5: Single array with mixed data

        let weekWeightData = [];
        let manifesteData = [];
        let orderSheetData = [];
        let itemWeightData = [];

        // Try different property name variations
        if (response.weekWeight || response.WeekWeight) {
            weekWeightData = response.weekWeight || response.WeekWeight || [];
            manifesteData = response.manifeste || response.Manifeste || [];
            orderSheetData = response.orderSheet || response.OrderSheet || [];
            itemWeightData = response.itemWeight || response.ItemWeight || [];
        }
        // Try Table1, Table2, etc.
        else if (response.Table || response.Table1) {
            weekWeightData = response.Table || response.Table1 || [];
            manifesteData = response.Table2 || [];
            orderSheetData = response.Table3 || [];
            itemWeightData = response.Table4 || [];
        }
        // Try array of arrays
        else if (Array.isArray(response) && response.length > 0) {
            if (Array.isArray(response[0])) {
                // Array of arrays
                weekWeightData = response[0] || [];
                manifesteData = response[1] || [];
                orderSheetData = response[2] || [];
                itemWeightData = response[3] || [];
            } else {
                // Single array - try to separate
                separateAndRenderManifestationData(response);
                return;
            }
        }

        const actualVsManifestData = Array.isArray(response) && Array.isArray(response[0]) ? (response[4] || []) : [];

        renderWeekWeightTable(weekWeightData);
        renderManifesteTable(manifesteData);
        renderOrderSheetTable(orderSheetData);
        renderItemWeightTable(itemWeightData);
        renderActualVsManifestTable(actualVsManifestData);

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching manifestation data:', err);
        clearManifestationTables();
    });
}

function clearManifestationTables() {
    // Clear Week / WEIGHT table
    document.getElementById('weekWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('weekWeightTableHeader').innerHTML = '';

    // Clear Manifeste table
    document.getElementById('manifesteTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('manifesteTableHeader').innerHTML = '';

    // Clear Invoice Details table
    document.getElementById('orderSheetTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('orderSheetTableHeader').innerHTML = '';

    // Clear Item / WEIGHT table
    document.getElementById('itemWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('itemWeightTableHeader').innerHTML = '';

    // Clear Actual vs Manifested table
    document.getElementById('actualVsManifestTableBody').innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
    document.getElementById('actualVsManifestTableHeader').innerHTML = '';
}

function separateAndRenderManifestationData(data) {
    // This function tries to intelligently separate the data
    // Based on the properties each row contains

    console.warn('API returned single array. Attempting to separate data by row properties...');

    const weekWeightData = [];
    const manifesteData = [];
    const orderSheetData = [];
    const itemWeightData = [];

    data.forEach(row => {
        const keys = Object.keys(row).map(k => k.toLowerCase());

        // Week/WEIGHT table has MGKT_PERSON and week columns (April - W1, etc.)
        const hasWeekColumns = Object.keys(row).some(k =>
            k.includes('April') || k.includes('August') || k.includes('December') ||
            k.includes('W1') || k.includes('W2') || k.includes('W3') || k.includes('W4') || k.includes('W5') ||
            k.includes('-W')
        );

        // Manifeste table has specific columns
        const hasManifestColumns = keys.some(k =>
            k.includes('party codes') || k.includes('partycodes') ||
            k.includes('mani_current_m') || k.includes('manifested') ||
            k.includes('not achieved') || k.includes('not done')
        );

        // Invoice Details has Invoice related columns
        const hasOrderSheetColumns = keys.some(k =>
            k.includes('invoice date') || k.includes('invoicedate') ||
            k.includes('invoice amount') || k.includes('invoiceamount') ||
            k.includes('nbd/crr') || k.includes('nbdcrr')
        );

        // Item / WEIGHT - simplest structure with just item and weight
        const hasItemWeightColumns = keys.length <= 3 &&
            (keys.includes('item name') || keys.includes('itemname')) &&
            (keys.includes('weight'));

        // Classify the row
        if (hasWeekColumns) {
            weekWeightData.push(row);
        } else if (hasManifestColumns) {
            manifesteData.push(row);
        } else if (hasOrderSheetColumns) {
            orderSheetData.push(row);
        } else if (hasItemWeightColumns) {
            itemWeightData.push(row);
        } else {
            // Default: put in order sheet if has weight
            if (keys.includes('weight')) {
                orderSheetData.push(row);
            }
        }
    });

    console.log('Separated data:', {
        weekWeight: weekWeightData.length,
        manifeste: manifesteData.length,
        orderSheet: orderSheetData.length,
        itemWeight: itemWeightData.length
    });

    renderWeekWeightTable(weekWeightData);
    renderManifesteTable(manifesteData);
    renderOrderSheetTable(orderSheetData);
    renderItemWeightTable(itemWeightData);
}

function getMonthIndexFromWeekLabel(weekLabel, fallbackDateStr) {
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const label = (weekLabel || '').toString().trim().toLowerCase();
    const monthPart = label.split('-')[0].trim();

    let monthIndex = monthNames.findIndex(function (name) {
        return monthPart === name || monthPart.startsWith(name.substring(0, 3));
    });

    if (monthIndex === -1 && fallbackDateStr && fallbackDateStr !== '0') {
        const d = new Date(fallbackDateStr);
        if (!isNaN(d.getTime())) {
            monthIndex = d.getMonth();
        }
    }

    return monthIndex;
}

function getDaysInMonthForWeekLabel(weekLabel, fallbackDateStr) {
    const monthIndex = getMonthIndexFromWeekLabel(weekLabel, fallbackDateStr);
    if (monthIndex === -1) return 30;

    let year = new Date().getFullYear();
    if (fallbackDateStr && fallbackDateStr !== '0') {
        const d = new Date(fallbackDateStr);
        if (!isNaN(d.getTime())) {
            year = d.getFullYear();
        }
    }

    return new Date(year, monthIndex + 1, 0).getDate();
}

function getDaysInWeekForWeekLabel(weekLabel) {
    const label = (weekLabel || '').toString().trim();
    const weekMatch = label.match(/W(\d+)/i);
    if (!weekMatch) return 7;

    const weekNumber = parseInt(weekMatch[1], 10);
    const monthIndex = getMonthIndexFromWeekLabel(weekLabel, fromDate !== '0' ? fromDate : toDate);
    if (monthIndex === -1) return 7;

    let year = new Date().getFullYear();
    const fallbackDateStr = fromDate !== '0' ? fromDate : toDate;
    if (fallbackDateStr && fallbackDateStr !== '0') {
        const d = new Date(fallbackDateStr);
        if (!isNaN(d.getTime())) {
            year = d.getFullYear();
        }
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startDay = ((weekNumber - 1) * 7) + 1;
    if (startDay > daysInMonth) return 0;
    return Math.min(7, daysInMonth - startDay + 1);
}

function calculateWeeklyManifestTarget(totalManifestTarget, weekLabel) {
    const totalTarget = parseFloat(totalManifestTarget) || 0;
    if (!totalTarget) return 0;

    const fallbackDateStr = fromDate !== '0' ? fromDate : toDate;
    const daysInMonth = getDaysInMonthForWeekLabel(weekLabel, fallbackDateStr);
    const daysInWeek = getDaysInWeekForWeekLabel(weekLabel) || 7;

    if (!daysInMonth) return 0;
    return (totalTarget / daysInMonth) * daysInWeek;
}

function renderWeekWeightTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('weekWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('weekWeightTableHeader').innerHTML = '';
        return;
    }

    const tableHeader = document.getElementById('weekWeightTableHeader');
    const tableBody = document.getElementById('weekWeightTableBody');
    if (!tableHeader || !tableBody) return;

    const allKeys = Object.keys(data[0]);

    // Identify the person column
    const personKeyOptions = ['MGKT_PERSON', 'MGKT Person', 'Marketing Man', 'MarketingMan', 'Person'];
    const personKey = personKeyOptions.find(k => allKeys.includes(k)) || allKeys[0];

    // Identify summary columns by keyword match
    const isSummaryKey = (k) => {
        const l = k.toLowerCase();
        return l.includes('actual total') || l === 'actualtotal' ||
               l.includes('target total') || l === 'targettotal' ||
               l.includes('variance') ||
               l.includes('achievement');
    };

    const actualTotalKey  = allKeys.find(k => k.toLowerCase().includes('actual total')  || k.toLowerCase() === 'actualtotal');
    const targetTotalKey  = allKeys.find(k => k.toLowerCase().includes('target total')  || k.toLowerCase() === 'targettotal');
    const varianceKey     = allKeys.find(k => k.toLowerCase().includes('variance'));
    const achievementKey  = allKeys.find(k => k.toLowerCase().includes('achievement'));

    // Week columns = everything that is not the person key and not a summary column
    const weekColumns = allKeys.filter(k => k !== personKey && !isSummaryKey(k));

    // ---- Build two-row header ----
    const headerBg  = '#4472C4';
    const subBg     = '#5B9BD5';
    const summaryBg = '#365E9A';
    const sepStyle  = 'border-left:2px solid rgba(255,255,255,0.4);';

    let row1 = `<tr>`;
    row1 += `<th rowspan="2" style="vertical-align:middle;background-color:${headerBg};color:white;white-space:nowrap;">${escapeHtml(personKey)}</th>`;
    weekColumns.forEach(wk => {
        row1 += `<th colspan="3" class="text-center" style="background-color:${headerBg};color:white;white-space:nowrap;${sepStyle}">${escapeHtml(wk)}</th>`;
    });
    if (actualTotalKey) row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};color:white;white-space:nowrap;${sepStyle}">Actual Total</th>`;
    if (targetTotalKey) row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};color:white;white-space:nowrap;">Total Manifest Target</th>`;
    if (varianceKey)    row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};color:white;white-space:nowrap;">Variance</th>`;
    if (achievementKey) row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};color:white;white-space:nowrap;">Achievement %</th>`;
    row1 += `</tr>`;

    let row2 = `<tr>`;
    weekColumns.forEach(() => {
        row2 += `<th class="text-end" style="background-color:${subBg};color:white;white-space:nowrap;${sepStyle}">Actual Sales</th>`;
        row2 += `<th class="text-end" style="background-color:${subBg};color:white;white-space:nowrap;">Weekly Manifest Target</th>`;
        row2 += `<th class="text-end" style="background-color:${subBg};color:white;white-space:nowrap;">Achievement %</th>`;
    });
    row2 += `</tr>`;

    tableHeader.innerHTML = row1 + row2;

    // ---- Build body ----
    tableBody.innerHTML = '';

    const grandWeekActuals  = {};
    const grandWeekTargets  = {};
    weekColumns.forEach(wk => { grandWeekActuals[wk] = 0; grandWeekTargets[wk] = 0; });
    let grandActualTotal = 0;
    let grandTargetTotal = 0;

    data.forEach(row => {
        const personName  = row[personKey] || '';
        const actualTotal = parseFloat(row[actualTotalKey] || 0);
        const targetTotal = parseFloat(row[targetTotalKey] || 0);
        const variance    = parseFloat(row[varianceKey]    || (actualTotal - targetTotal));

        const overallAchievement = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;

        grandActualTotal += actualTotal;
        grandTargetTotal += targetTotal;

        let rowHTML = `<td style="white-space:nowrap;">${escapeHtml(personName)}</td>`;

        weekColumns.forEach(wk => {
            const actualSales = parseFloat(row[wk] || 0);
            const weekTarget = calculateWeeklyManifestTarget(targetTotal, wk);
            const wkAchievement = weekTarget > 0 ? (actualSales / weekTarget) * 100 : 0;
            grandWeekActuals[wk] += actualSales;
            grandWeekTargets[wk] += weekTarget;

            rowHTML += `<td class="text-end" style="${sepStyle}">${formatNumber(actualSales)}</td>`;
            rowHTML += `<td class="text-end">${formatNumber(weekTarget)}</td>`;
            rowHTML += `<td class="text-end">${wkAchievement.toFixed(2)}%</td>`;
        });

        if (actualTotalKey) rowHTML += `<td class="text-end fw-bold" style="${sepStyle}">${formatNumber(actualTotal)}</td>`;
        if (targetTotalKey) rowHTML += `<td class="text-end fw-bold">${formatNumber(targetTotal)}</td>`;
        if (varianceKey)    rowHTML += `<td class="text-end fw-bold">${formatNumber(variance)}</td>`;
        if (achievementKey) rowHTML += `<td class="text-end fw-bold">${overallAchievement.toFixed(2)}%</td>`;

        const tr = document.createElement('tr');
        tr.innerHTML = rowHTML;
        tableBody.appendChild(tr);
    });

    // ---- Grand Total row ----
    const grandVariance    = grandActualTotal - grandTargetTotal;
    const grandAchievement = grandTargetTotal > 0 ? (grandActualTotal / grandTargetTotal) * 100 : 0;

    const grandTotalRow = document.createElement('tr');
    grandTotalRow.style.cssText = 'background-color:#d4edda;font-weight:bold;border-top:2px solid #333;';

    let grandHTML = `<td style="white-space:nowrap;"><strong>Grand Total</strong></td>`;
    weekColumns.forEach(wk => {
        const gActual = grandWeekActuals[wk] || 0;
        const gTarget = grandWeekTargets[wk] || 0;
        const gAch    = gTarget > 0 ? (gActual / gTarget) * 100 : 0;
        grandHTML += `<td class="text-end" style="${sepStyle}"><strong>${formatNumber(gActual)}</strong></td>`;
        grandHTML += `<td class="text-end"><strong>${formatNumber(gTarget)}</strong></td>`;
        grandHTML += `<td class="text-end"><strong>${gAch.toFixed(2)}%</strong></td>`;
    });
    if (actualTotalKey) grandHTML += `<td class="text-end" style="${sepStyle}"><strong>${formatNumber(grandActualTotal)}</strong></td>`;
    if (targetTotalKey) grandHTML += `<td class="text-end"><strong>${formatNumber(grandTargetTotal)}</strong></td>`;
    if (varianceKey)    grandHTML += `<td class="text-end"><strong>${formatNumber(grandVariance)}</strong></td>`;
    if (achievementKey) grandHTML += `<td class="text-end"><strong>${grandAchievement.toFixed(2)}%</strong></td>`;

    grandTotalRow.innerHTML = grandHTML;
    tableBody.appendChild(grandTotalRow);
}

function renderManifesteTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('manifesteTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('manifesteTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = ["Party Name", "MGKT_PERSON", "Item Name"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
        'Mani_Current_M': 'right',
        'Manifested ?': 'right',
        'Manifested': 'right',
        'Actual': 'right',
        'Current Week': 'right',
        'Current_M': 'right',
        'Not Achieved': 'right',
        'Not Done %': 'right',
        'NotAchieved': 'right',
        'NotDone': 'right'
    };
    const TotalColumns = ['Actual', 'Current_M']; // Pass column names to show totals
    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("manifesteTableHeader", "manifesteTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true, TotalColumns);
    }
}

function renderOrderSheetTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('orderSheetTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('orderSheetTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = ["Party Name", "Marketing Man", "Item Name"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
        'Weight': 'right',
        'Invoice Amount': 'right',
        'InvoiceAmount': 'right'
    };
    const TotalColumns = ['Weight', 'Invoice Amount']; // Pass column names to show totals

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("orderSheetTableHeader", "orderSheetTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true, TotalColumns);
    }
}

function renderItemWeightTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('itemWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('itemWeightTableHeader').innerHTML = '';
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
        'Weight': 'right',
        'WEIGHT': 'right'
    };

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("itemWeightTableHeader", "itemWeightTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
    }
}

function renderActualVsManifestTable(data) {
    const tbody = document.getElementById('actualVsManifestTableBody');
    const tfoot = document.getElementById('actualVsManifestTableFoot');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
        if (tfoot) tfoot.innerHTML = '';
        return;
    }

    const StringFilterColumn = ["Marketing Man", "Party Name"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
        'Manifest': 'right',
        'Actual': 'right'
    };
    const TotalColumns = ['Manifest', 'Actual'];

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable(
            "actualVsManifestTableHeader",
            "actualVsManifestTableBody",
            data,
            Button,
            showButtons,
            StringFilterColumn,
            NumericFilterColumn,
            DateFilterColumn,
            StringdoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            true,
            TotalColumns
        );
    }
}

function renderNBDCRR() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetMultipleTableSalesAnalysisData('NBD_CRR', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response) {
            console.warn('No NBD CRR data received');
            clearNBDCRRTables();
            return;
        }

        console.log('NBD CRR API Response:', response);

        let baseWeekData = [];
        let orderDetailsData = [];

        // Try different property name variations for the API response
        if (response.baseWeek || response.BaseWeek) {
            baseWeekData = response.baseWeek || response.BaseWeek || [];
            orderDetailsData = response.orderDetails || response.OrderDetails || [];
        }
        else if (response.Table || response.Table1) {
            baseWeekData = response.Table || response.Table1 || [];
            orderDetailsData = response.Table2 || [];
        }
        else if (Array.isArray(response) && response.length > 0) {
            if (Array.isArray(response[0])) {
                baseWeekData = response[0] || [];
                orderDetailsData = response[1] || [];
            } else {
                separateAndRenderNBDCRRData(response);
                return;
            }
        }

        renderNBDCRRBaseWeekTable(baseWeekData);
        renderNBDCRROrderDetailsTable(orderDetailsData);

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching NBD CRR data:', err);
        clearNBDCRRTables();
    });
}

function clearNBDCRRTables() {
    document.getElementById('nbdCrrBaseWeekTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('nbdCrrBaseWeekTableHeader').innerHTML = '';

    document.getElementById('nbdCrrOrderDetailsTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('nbdCrrOrderDetailsTableHeader').innerHTML = '';
}

function separateAndRenderNBDCRRData(data) {
    console.warn('API returned single array. Attempting to separate NBD CRR data by row properties...');

    const baseWeekData = [];
    const orderDetailsData = [];

    data.forEach(row => {
        const keys = Object.keys(row).map(k => k.toLowerCase());

        // BASE / Week table has MGKT_PERSON and week columns (April - W1, etc.)
        const hasWeekColumns = Object.keys(row).some(k =>
            k.includes('April') || k.includes('August') || k.includes('December') ||
            k.includes('W1') || k.includes('W2') || k.includes('W3') || k.includes('W4') || k.includes('W5') ||
            k.includes('-W') || k.includes('WEEK')
        );

        // Order Details has Invoice related columns and Party Name
        const hasOrderColumns = keys.some(k =>
            k.includes('party name') || k.includes('partyname') ||
            k.includes('invoice') || k.includes('nbd') || k.includes('crr') ||
            k.includes('item name') || k.includes('itemname')
        );

        if (hasWeekColumns) {
            baseWeekData.push(row);
        } else if (hasOrderColumns) {
            orderDetailsData.push(row);
        } else {
            // Default: check if has Marketing Man - likely order details
            if (keys.includes('marketing man') || keys.includes('marketingman')) {
                orderDetailsData.push(row);
            } else {
                baseWeekData.push(row);
            }
        }
    });

    console.log('Separated NBD CRR data:', {
        baseWeek: baseWeekData.length,
        orderDetails: orderDetailsData.length
    });

    renderNBDCRRBaseWeekTable(baseWeekData);
    renderNBDCRROrderDetailsTable(orderDetailsData);
}

function renderNBDCRRBaseWeekTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('nbdCrrBaseWeekTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('nbdCrrBaseWeekTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];

    // Right align all numeric columns (weeks, percentages, counts)
    const ColumnAlignment = {};
    const TotalColumns = ['Total Actual Weight', 'Weekly Manifested'];
    Object.keys(data[0] || {}).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'mgkt_person' && lowerKey !== 'mgkt person' &&
            lowerKey !== 'marketing man' && lowerKey !== 'marketingman' &&
            lowerKey !== 'week' && lowerKey !== 'person') {
            ColumnAlignment[key] = 'right';
        }
    });

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("nbdCrrBaseWeekTableHeader", "nbdCrrBaseWeekTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,true, TotalColumns);
    }
}

function renderNBDCRROrderDetailsTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('nbdCrrOrderDetailsTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('nbdCrrOrderDetailsTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = ['Invoice Date', 'InvoiceDate'];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
        'Weight': 'right',
        'Invoice Amount': 'right',
        'InvoiceAmount': 'right',
        'Manifested Weight': 'right',
        'ManifestedWeight': 'right'
    };

    const TotalColumns = ['Weight', 'Invoice Amount']; // Pass column names to show totals
    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("nbdCrrOrderDetailsTableHeader", "nbdCrrOrderDetailsTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true, TotalColumns);
    }
}

function renderSegmentWise() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    const lastMonthRange = getLastMonthAsOnDateRange(filters.fromDate, filters.toDate);
    const currentDataPromise = SalesanalysisASTService.GetSalesAnalysisData('SEGMENT_WISE', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays);
    const lastMonthDataPromise = lastMonthRange
        ? SalesanalysisASTService.GetSalesAnalysisData('SEGMENT_WISE', filters.dealerCodes, lastMonthRange.fromDate, lastMonthRange.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays)
        : Promise.resolve([]);

    Promise.all([currentDataPromise, lastMonthDataPromise]).then(function ([response, lastMonthResponse]) {
        HideLoader();

        if (response && response.length > 0) {
            renderSegmentWiseCollapsibleTable(response, lastMonthResponse || []);
        } else {
            const el = $('#segmentWiseTableBody')[0];
            if (el) el.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        }
    }).catch(function (error) {
        HideLoader();
        console.error('Error fetching segment wise data:', error);
    });
}

function renderSegmentWiseCollapsibleTable(data, lastMonthData) {
    const tbody = document.getElementById('segmentWiseTableBody');
    const thead = document.getElementById('segmentWiseTableHeader');

    if (!tbody || !thead) {
        console.error('Segment Wise table elements not found');
        return;
    }

    const currentAgg = aggregateSegmentWiseData(data);
    const lastMonthAgg = aggregateSegmentWiseData(lastMonthData);
    const segmentData = currentAgg.segmentData;
    const grandTotalWeight = currentAgg.grandTotalWeight;
    const grandTotalManifested = currentAgg.grandTotalManifested;
    const grandWeekTotals = currentAgg.grandWeekTotals;
    const lastMonthSegmentData = lastMonthAgg.segmentData;
    const lastMonthGrandWeekTotals = lastMonthAgg.grandWeekTotals;
    const lastMonthGrandTotalWeight = lastMonthAgg.grandTotalWeight;

    const allWeeks = new Set([...currentAgg.sortedWeeks, ...lastMonthAgg.sortedWeeks]);
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => a - b);

    // Create header with week columns
    let headerHTML = `
        <tr>
            <th style="background-color: #4472C4; color: white;">Segment</th>
    `;

    sortedWeeks.forEach(function (week) {
        headerHTML += `<th class="text-end" style="background-color: #4472C4; color: white;">W${week} SALE</th>`;
    });

    headerHTML += `
            <th class="text-end" style="background-color: #4472C4; color: white;">Total</th>
            <th class="text-end" style="background-color: #4472C4; color: white;">Manifested</th>
            <th class="text-end" style="background-color: #4472C4; color: white;">Percentage</th>
        </tr>
    `;

    thead.innerHTML = headerHTML;

    // Sort segments by weight descending
    const sortedSegments = Array.from(segmentData.entries())
        .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

    // Populate body
    tbody.innerHTML = '';

    sortedSegments.forEach(function ([segment, segInfo], index) {
        const segmentId = `segment-${index}`;
        const percentage = grandTotalWeight > 0 ? ((segInfo.totalWeight / grandTotalWeight) * 100) : 0;
        const lastMonthSegInfo = lastMonthSegmentData.get(segment);
        const lastMonthTotal = lastMonthSegInfo ? lastMonthSegInfo.totalWeight : 0;

        // Main segment row
        const segmentRow = document.createElement('tr');
        segmentRow.style.cssText = 'cursor: pointer; background-color: #f8f9fa; font-weight: bold;';

        let segmentRowHTML = `
            <td>
                <i class="fa fa-angle-right segment-toggle" id="toggle-${segmentId}" style="margin-right: 8px;"></i>
                ${escapeHtml(segment)}
            </td>
        `;

        sortedWeeks.forEach(function (week) {
            const weekKey = `W${week}`;
            const weekSale = segInfo.weekTotals[weekKey] || 0;
            const lastMonthWeekSale = lastMonthSegInfo ? (lastMonthSegInfo.weekTotals[weekKey] || 0) : 0;
            const compareCell = formatSaleCompareCell(weekSale, lastMonthWeekSale, weekSale, false);
            segmentRowHTML += `<td class="text-end" style="${compareCell.style}">${compareCell.html}</td>`;
        });

        const totalCompareCell = formatSaleCompareCell(segInfo.totalWeight, lastMonthTotal, segInfo.totalWeight, false);
        segmentRowHTML += `
            <td class="text-end" style="${totalCompareCell.style}">${totalCompareCell.html}</td>
            <td class="text-end">${formatNumber(segInfo.totalManifested)}</td>
            <td class="text-end">${percentage.toFixed(2)}%</td>
        `;

        segmentRow.innerHTML = segmentRowHTML;
        tbody.appendChild(segmentRow);

        // Create collapsible container for buyers
        const buyersContainer = document.createElement('tr');
        buyersContainer.id = segmentId;
        buyersContainer.style.display = 'none';
        buyersContainer.className = 'segment-buyers-container';

        // Create nested table for buyers
        const buyersTableCell = document.createElement('td');
        buyersTableCell.colSpan = sortedWeeks.length + 4;
        buyersTableCell.style.padding = '0';

        let buyersTableHTML = `
            <table class="table table-sm mb-0" style="margin-left: 20px; width: calc(100% - 30px);">
                <thead>
                    <tr style="background-color: #5B9BD5; color: white;">
                        <th>#</th>
                        <th>Buyers Name</th>
        `;

        sortedWeeks.forEach(function (week) {
            buyersTableHTML += `<th class="text-end">W${week} SALE</th>`;
        });

        buyersTableHTML += `
                        <th class="text-end">Total</th>
                        <th class="text-end">Manifested</th>
                        <th class="text-end">Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Sort buyers by weight descending
        const sortedBuyers = Array.from(segInfo.buyersMap.entries())
            .sort((a, b) => b[1].weight - a[1].weight);

        sortedBuyers.forEach(function ([buyerName, buyerInfo], buyerIndex) {
            const buyerPercentage = segInfo.totalWeight > 0 ? ((buyerInfo.weight / segInfo.totalWeight) * 100) : 0;
            const lastMonthBuyerInfo = lastMonthSegInfo ? lastMonthSegInfo.buyersMap.get(buyerName) : null;
            const lastMonthBuyerTotal = lastMonthBuyerInfo ? lastMonthBuyerInfo.weight : 0;

            buyersTableHTML += `
                <tr>
                    <td>${buyerIndex + 1}</td>
                    <td>${escapeHtml(buyerName)}</td>
            `;

            sortedWeeks.forEach(function (week) {
                const weekKey = `W${week}`;
                const weekSale = buyerInfo.weekSales[weekKey] || 0;
                const lastMonthWeekSale = lastMonthBuyerInfo ? (lastMonthBuyerInfo.weekSales[weekKey] || 0) : 0;
                const compareCell = formatSaleCompareCell(weekSale, lastMonthWeekSale, weekSale, false);
                buyersTableHTML += `<td class="text-end" style="${compareCell.style}">${compareCell.html}</td>`;
            });

            const buyerTotalCompareCell = formatSaleCompareCell(buyerInfo.weight, lastMonthBuyerTotal, buyerInfo.weight, false);
            buyersTableHTML += `
                    <td class="text-end" style="${buyerTotalCompareCell.style}">${buyerTotalCompareCell.html}</td>
                    <td class="text-end">${formatNumber(buyerInfo.manifested)}</td>
                    <td class="text-end">${buyerPercentage.toFixed(2)}%</td>
                </tr>
            `;
        });

        buyersTableHTML += `
                </tbody>
            </table>
        `;

        buyersTableCell.innerHTML = buyersTableHTML;
        buyersContainer.appendChild(buyersTableCell);
        tbody.appendChild(buyersContainer);

        // Add click event to toggle
        segmentRow.addEventListener('click', function () {
            const container = document.getElementById(segmentId);
            const toggle = document.getElementById(`toggle-${segmentId}`);

            if (container.style.display === 'none') {
                container.style.display = '';
                toggle.classList.remove('fa-angle-right');
                toggle.classList.add('fa-angle-down');
            } else {
                container.style.display = 'none';
                toggle.classList.remove('fa-angle-down');
                toggle.classList.add('fa-angle-right');
            }
        });
    });

    // Add grand total row
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.style.cssText = 'background-color: #d4edda; font-weight: bold; border-top: 2px solid #333;';

    let grandTotalHTML = `<td><strong>Grand Total</strong></td>`;

    sortedWeeks.forEach(function (week) {
        const weekKey = `W${week}`;
        const weekTotal = grandWeekTotals[weekKey] || 0;
        const lastMonthWeekTotal = lastMonthGrandWeekTotals[weekKey] || 0;
        const compareCell = formatSaleCompareCell(weekTotal, lastMonthWeekTotal, weekTotal, true);
        grandTotalHTML += `<td class="text-end" style="${compareCell.style}">${compareCell.html}</td>`;
    });

    const grandTotalCompareCell = formatSaleCompareCell(grandTotalWeight, lastMonthGrandTotalWeight, grandTotalWeight, true);
    grandTotalHTML += `
        <td class="text-end" style="${grandTotalCompareCell.style}">${grandTotalCompareCell.html}</td>
        <td class="text-end"><strong>${formatNumber(grandTotalManifested)}</strong></td>
        <td class="text-end"><strong>100.00%</strong></td>
    `;

    grandTotalRow.innerHTML = grandTotalHTML;
    tbody.appendChild(grandTotalRow);
}

function renderGPWiseSummary() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    // Update date range display for this tab
    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('GP_WISE_SUMMARY', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No GP wise summary data received');
            document.getElementById('gpWiseTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
            document.getElementById('gpWiseTableHeader').innerHTML = '';
            return;
        }

        console.log('GP Wise Summary API Response:', response);

        // Process and render the GP Wise Summary table with fixed header/footer
        renderGPWiseSummaryCustomTable(response);

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching GP wise summary data:', err);
    });
}

function renderGPWiseSummaryCustomTable(data) {
    const tbody = document.getElementById('gpWiseTableBody');
    const thead = document.getElementById('gpWiseTableHeader');

    if (!tbody || !thead) {
        console.error('GP Wise table elements not found');
        return;
    }

    // Aggregate data by Marketing Man and GP category
    const aggregatedData = new Map();

    data.forEach(function (row) {
        // Get Marketing Man (try multiple property variations)
        const marketingMan = row['Marketing Man'] || row['MarketingMan'] || row['MARKETING MAN'] ||
            row['MGKT Person'] || row['MGKT_PERSON'] || row['Person'] || 'Unknown';

        // Get Weight
        const weight = parseFloat(row['Weight'] || row['WEIGHT'] || row['weight'] || 0);

        // Get GP category and normalize it
        const gpRaw = (row['GP'] || row['gp'] || '').toString().toUpperCase().trim();
        let gpCategory = 'Medium'; // default

        if (gpRaw.includes('HIGH')) {
            gpCategory = 'High';
        } else if (gpRaw.includes('LOW')) {
            gpCategory = 'Low';
        } else if (gpRaw.includes('MEDIUM')) {
            gpCategory = 'Medium';
        }

        // Initialize if not exists
        if (!aggregatedData.has(marketingMan)) {
            aggregatedData.set(marketingMan, { High: 0, Low: 0, Medium: 0 });
        }

        // Add weight to appropriate category
        const personData = aggregatedData.get(marketingMan);
        personData[gpCategory] += weight;
    });

    // Create header
    thead.innerHTML = `
        <tr>
            <th rowspan="2" style="vertical-align: middle; background-color: #e9ecef; position: sticky; top: 0; z-index: 10;">MARKETING MAN</th>
            <th colspan="3" class="text-center" style="background-color: #e9ecef; position: sticky; top: 0; z-index: 10;">GP / WEIGHT</th>
            <th rowspan="2" class="text-end" style="vertical-align: middle; background-color: #e9ecef; position: sticky; top: 0; z-index: 10;">Total</th>
            <th rowspan="2" class="text-end" style="vertical-align: middle; background-color: #e9ecef; position: sticky; top: 0; z-index: 10;">% of Total</th>
        </tr>
        <tr>
            <th class="text-end" style="background-color: #e9ecef; position: sticky; top: 38px; z-index: 10;">High</th>
            <th class="text-end" style="background-color: #e9ecef; position: sticky; top: 38px; z-index: 10;">Low</th>
            <th class="text-end" style="background-color: #e9ecef; position: sticky; top: 38px; z-index: 10;">Medium</th>
        </tr>
    `;

    // Sort by total weight descending
    const sorted = Array.from(aggregatedData.entries())
        .sort((a, b) => {
            const totalA = a[1].High + a[1].Low + a[1].Medium;
            const totalB = b[1].High + b[1].Low + b[1].Medium;
            return totalB - totalA;
        });

    // Calculate overall grand total for percentage calculation
    let overallGrandTotal = 0;
    sorted.forEach(function ([marketingMan, gpData]) {
        overallGrandTotal += gpData.High + gpData.Low + gpData.Medium;
    });

    // Populate body
    tbody.innerHTML = '';
    let grandTotalHigh = 0;
    let grandTotalLow = 0;
    let grandTotalMedium = 0;
    let grandTotal = 0;

    sorted.forEach(function ([marketingMan, gpData]) {
        const rowTotal = gpData.High + gpData.Low + gpData.Medium;
        const percentageOfTotal = overallGrandTotal > 0 ? ((rowTotal / overallGrandTotal) * 100) : 0;

        grandTotalHigh += gpData.High;
        grandTotalLow += gpData.Low;
        grandTotalMedium += gpData.Medium;
        grandTotal += rowTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(marketingMan)}</td>
            <td class="text-end">${formatNumber(gpData.High)}</td>
            <td class="text-end">${formatNumber(gpData.Low)}</td>
            <td class="text-end">${formatNumber(gpData.Medium)}</td>
            <td class="text-end"><strong>${formatNumber(rowTotal)}</strong></td>
            <td class="text-end"><strong>${percentageOfTotal.toFixed(2)}%</strong></td>
        `;
        tbody.appendChild(tr);
    });

    // Add grand total row to tbody (sticky at bottom)
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.style.cssText = 'background-color: #d4edda; font-weight: bold; position: sticky; bottom: 0; border-top: 2px solid #333;';
    grandTotalRow.innerHTML = `
        <td><strong>Grand total</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotalHigh)}</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotalLow)}</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotalMedium)}</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotal)}</strong></td>
        <td class="text-end"><strong>100.00%</strong></td>
    `;
    tbody.appendChild(grandTotalRow);
}

function normalizeRegionalAnalysisRow(row) {
    return {
        partyName: (row['Party Name'] || row.PartyName || row.PARTY_NAME || 'Unknown').toString().trim(),
        stateName: (row['State Name'] || row.StateName || row.STATE_NAME || 'Unknown').toString().trim(),
        cityName: (row['City Name'] || row.CityName || row.CITY_NAME || 'Unknown').toString().trim(),
        weight: parseFloat(row['Weight'] || row.WEIGHT || row.weight || 0) || 0
    };
}

function regionalValuesMatch(a, b) {
    return (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase();
}

function aggregateRegionalData(data, keySelector) {
    const map = new Map();

    (data || []).forEach(function (row) {
        const key = keySelector(row);
        if (!key) return;
        map.set(key, (map.get(key) || 0) + row.weight);
    });

    return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1]);
}

function setRegionalAnalysisLevel(level, selectedState, selectedCity) {
    regionalAnalysisState = {
        level: level,
        selectedState: selectedState || null,
        selectedCity: selectedCity || null
    };
    renderRegionalAnalysisView();
}

function getRegionalItemsForLevel(level, selectedState, selectedCity) {
    let filtered = G_RegionalAnalysisData;

    if (level === 'city' || level === 'party') {
        filtered = filtered.filter(row => regionalValuesMatch(row.stateName, selectedState));
    }
    if (level === 'party') {
        filtered = filtered.filter(row => regionalValuesMatch(row.cityName, selectedCity));
    }

    if (level === 'state') {
        return aggregateRegionalData(filtered, row => row.stateName);
    }
    if (level === 'city') {
        return aggregateRegionalData(filtered, row => row.cityName);
    }
    return aggregateRegionalData(filtered, row => row.partyName);
}

function destroyRegionalChartInstance(instanceRef) {
    if (instanceRef) {
        try { instanceRef.destroy(); } catch (e) { /* ignore */ }
    }
    return null;
}

function fillRegionalLevelTable(level, items, selectedState, selectedCity, headerId, bodyId, footerId, onRowClick) {
    const tbody = document.getElementById(bodyId);
    const tfoot = document.getElementById(footerId);
    const theadRow = document.getElementById(headerId);
    if (!tbody || !theadRow) return;

    const grandTotal = items.reduce((sum, item) => sum + item[1], 0);

    if (level === 'state') {
        theadRow.innerHTML = `
            <th>State Name</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    } else if (level === 'city') {
        theadRow.innerHTML = `
            <th>State Name</th>
            <th>City Name</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    } else {
        theadRow.innerHTML = `
            <th>State Name</th>
            <th>City Name</th>
            <th>Party Name</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    }

    const colSpan = level === 'state' ? 3 : (level === 'city' ? 4 : 5);

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-muted">No data available</td></tr>`;
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="grand-total-row">
                    <td colspan="${colSpan - 2}"><strong>Grand Total</strong></td>
                    <td class="text-end"><strong>0.00</strong></td>
                    <td class="text-end"><strong>100.00%</strong></td>
                </tr>
            `;
        }
        return;
    }

    tbody.innerHTML = '';
    items.forEach(function ([label, weight]) {
        const percentage = grandTotal > 0 ? ((weight / grandTotal) * 100) : 0;
        const tr = document.createElement('tr');
        tr.style.cursor = typeof onRowClick === 'function' ? 'pointer' : 'default';

        if (level === 'state') {
            tr.innerHTML = `
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        } else if (level === 'city') {
            tr.innerHTML = `
                <td>${escapeHtml(selectedState)}</td>
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${escapeHtml(selectedState)}</td>
                <td>${escapeHtml(selectedCity)}</td>
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        }

        if (typeof onRowClick === 'function') {
            tr.addEventListener('click', function () {
                onRowClick(label);
            });
        }

        tbody.appendChild(tr);
    });

    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td colspan="${colSpan - 2}"><strong>Grand Total</strong></td>
                <td class="text-end"><strong>${formatNumber(grandTotal)}</strong></td>
                <td class="text-end"><strong>100.00%</strong></td>
            </tr>
        `;
    }
}

function renderRegionalAnalysisBreadcrumb() {
    const breadcrumb = document.getElementById('regionalAnalysisBreadcrumb');
    const backBtn = document.getElementById('regionalAnalysisBackBtn');
    const levelBadge = document.getElementById('regionalAnalysisLevelBadge');
    const drillHint = document.getElementById('regionalAnalysisDrillHint');
    if (!breadcrumb) return;

    const { level, selectedState, selectedCity } = regionalAnalysisState;
    let html = `<span class="regional-breadcrumb-item${level === 'state' ? ' active' : ''}" data-level="state">All States</span>`;

    if (level === 'city' || level === 'party') {
        html += `<span class="regional-breadcrumb-separator">›</span>`;
        html += `<span class="regional-breadcrumb-item${level === 'city' ? ' active' : ''}" data-level="city">${escapeHtml(selectedState)}</span>`;
    }

    if (level === 'party') {
        html += `<span class="regional-breadcrumb-separator">›</span>`;
        html += `<span class="regional-breadcrumb-item active" data-level="party">${escapeHtml(selectedCity)}</span>`;
    }

    breadcrumb.innerHTML = html;

    breadcrumb.querySelectorAll('.regional-breadcrumb-item[data-level]').forEach(function (item) {
        item.addEventListener('click', function () {
            const targetLevel = item.getAttribute('data-level');
            if (targetLevel === 'state') {
                setRegionalAnalysisLevel('state', null, null);
            } else if (targetLevel === 'city') {
                setRegionalAnalysisLevel('city', selectedState, null);
            }
        });
    });

    if (backBtn) {
        if (level === 'state') {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'inline-flex';
            backBtn.textContent = level === 'party' ? '\u2190 Back to Cities' : '\u2190 Back to States';
        }

        backBtn.onclick = function (e) {
            if (e) e.preventDefault();
            if (level === 'party') {
                setRegionalAnalysisLevel('city', selectedState, null);
            } else if (level === 'city') {
                setRegionalAnalysisLevel('state', null, null);
            }
        };
    }

    if (levelBadge) {
        if (level === 'state') levelBadge.textContent = 'State Wise';
        else if (level === 'city') levelBadge.textContent = 'City Wise';
        else levelBadge.textContent = 'Party Wise';
    }

    if (drillHint) {
        drillHint.style.display = level === 'party' ? 'none' : 'block';
    }
}

function updateRegionalLevelVisibility() {
    const { level } = regionalAnalysisState;
    const stateRow = document.getElementById('regionalLevelStateRow');
    const cityRow = document.getElementById('regionalLevelCityRow');
    const partyRow = document.getElementById('regionalLevelPartyRow');

    if (stateRow) stateRow.style.display = '';
    if (cityRow) cityRow.style.display = (level === 'city' || level === 'party') ? '' : 'none';
    if (partyRow) partyRow.style.display = level === 'party' ? '' : 'none';
}

function renderRegionalAnalysisView() {
    const { level, selectedState, selectedCity } = regionalAnalysisState;

    renderRegionalAnalysisBreadcrumb();
    updateRegionalLevelVisibility();

    // Always keep State chart/table visible
    const stateItems = getRegionalItemsForLevel('state');
    fillRegionalLevelTable('state', stateItems, null, null, 'regionalStateTableHeader', 'regionalStateTableBody', 'regionalStateTableFooter', function (label) {
        setRegionalAnalysisLevel('city', label, null);
    });
    regionalStateChartInstance = destroyRegionalChartInstance(regionalStateChartInstance);
    if (stateItems.length > 0) {
        regionalStateChartInstance = createProductPieChart(
            'regionalStatePieChart',
            stateItems.map(i => i[0]),
            stateItems.map(i => i[1]),
            function (label) { setRegionalAnalysisLevel('city', label, null); }
        );
    }

    // Show City chart in next row (state chart stays)
    if (level === 'city' || level === 'party') {
        const cityItems = getRegionalItemsForLevel('city', selectedState, null);
        const cityChartTitle = document.getElementById('regionalCityChartTitle');
        const cityTableTitle = document.getElementById('regionalCityTableTitle');
        if (cityChartTitle) cityChartTitle.textContent = `City-wise Sales - ${selectedState}`;
        if (cityTableTitle) cityTableTitle.textContent = `City-wise Data - ${selectedState}`;

        fillRegionalLevelTable('city', cityItems, selectedState, null, 'regionalCityTableHeader', 'regionalCityTableBody', 'regionalCityTableFooter', function (label) {
            setRegionalAnalysisLevel('party', selectedState, label);
        });
        regionalCityChartInstance = destroyRegionalChartInstance(regionalCityChartInstance);
        if (cityItems.length > 0) {
            regionalCityChartInstance = createProductPieChart(
                'regionalCityPieChart',
                cityItems.map(i => i[0]),
                cityItems.map(i => i[1]),
                function (label) { setRegionalAnalysisLevel('party', selectedState, label); }
            );
        }
    } else {
        regionalCityChartInstance = destroyRegionalChartInstance(regionalCityChartInstance);
    }

    // Show Party chart in next row (previous charts stay)
    if (level === 'party') {
        const partyItems = getRegionalItemsForLevel('party', selectedState, selectedCity);
        const partyChartTitle = document.getElementById('regionalPartyChartTitle');
        const partyTableTitle = document.getElementById('regionalPartyTableTitle');
        if (partyChartTitle) partyChartTitle.textContent = `Party-wise Sales - ${selectedCity}, ${selectedState}`;
        if (partyTableTitle) partyTableTitle.textContent = `Party-wise Data - ${selectedCity}, ${selectedState}`;

        fillRegionalLevelTable('party', partyItems, selectedState, selectedCity, 'regionalPartyTableHeader', 'regionalPartyTableBody', 'regionalPartyTableFooter', null);
        regionalPartyChartInstance = destroyRegionalChartInstance(regionalPartyChartInstance);
        if (partyItems.length > 0) {
            regionalPartyChartInstance = createProductPieChart(
                'regionalPartyPieChart',
                partyItems.map(i => i[0]),
                partyItems.map(i => i[1]),
                null
            );
        }
    } else {
        regionalPartyChartInstance = destroyRegionalChartInstance(regionalPartyChartInstance);
    }
}

function clearRegionalAnalysisDashboard() {
    G_RegionalAnalysisData = [];
    regionalAnalysisState = { level: 'state', selectedState: null, selectedCity: null };

    regionalStateChartInstance = destroyRegionalChartInstance(regionalStateChartInstance);
    regionalCityChartInstance = destroyRegionalChartInstance(regionalCityChartInstance);
    regionalPartyChartInstance = destroyRegionalChartInstance(regionalPartyChartInstance);

    const cityRow = document.getElementById('regionalLevelCityRow');
    const partyRow = document.getElementById('regionalLevelPartyRow');
    if (cityRow) cityRow.style.display = 'none';
    if (partyRow) partyRow.style.display = 'none';

    fillRegionalLevelTable('state', [], null, null, 'regionalStateTableHeader', 'regionalStateTableBody', 'regionalStateTableFooter', null);
    renderRegionalAnalysisBreadcrumb();
}

function renderRegionalAnalysis() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('REGIONAL_ANALYSIS', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No regional analysis data received');
            clearRegionalAnalysisDashboard();
            return;
        }

        G_RegionalAnalysisData = response.map(normalizeRegionalAnalysisRow);
        regionalAnalysisState = { level: 'state', selectedState: null, selectedCity: null };
        renderRegionalAnalysisView();
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching regional analysis data:', err);
        clearRegionalAnalysisDashboard();
    });
}

function normalizeProductAnalysisRow(row) {
    return {
        itemName: (row['Item Name'] || row.ItemName || row.ITEM_NAME || 'Unknown').toString().trim(),
        sizeDesp: (row['Size Description'] || row.SizeDescription || row.SIZE_DESCRIPTION || row['Size Desp'] || 'Unknown').toString().trim(),
        size: (row['Size'] || row.SIZE || row.size || 'Unknown').toString().trim() || 'Unknown',
        thickness: (row['Thickness'] || row.THICKNESS || row.thickness || 'Unknown').toString().trim(),
        weight: parseFloat(row['Weight'] || row.WEIGHT || row.weight || 0) || 0
    };
}

function productValuesMatch(a, b) {
    return (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase();
}

function aggregateProductData(data, keySelector) {
    const map = new Map();

    (data || []).forEach(function (row) {
        const key = keySelector(row);
        if (!key) return;
        map.set(key, (map.get(key) || 0) + row.weight);
    });

    return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1]);
}

function getProductFilteredData() {
    const { level, selectedItem, selectedSize } = productAnalysisState;

    if (level === 'size' || level === 'thickness') {
        let filtered = G_ProductAnalysisData.filter(row => productValuesMatch(row.itemName, selectedItem));
        if (level === 'thickness') {
            filtered = filtered.filter(row => productValuesMatch(row.size, selectedSize));
        }
        return filtered;
    }

    return G_ProductAnalysisData;
}

function getProductAggregatedItems() {
    const { level } = productAnalysisState;
    const filteredData = getProductFilteredData();

    if (level === 'item') {
        return aggregateProductData(filteredData, row => row.itemName);
    }
    if (level === 'size') {
        return aggregateProductData(filteredData, row => row.size);
    }

    return aggregateProductData(filteredData, row => row.thickness);
}

function setProductAnalysisLevel(level, selectedItem, selectedSize) {
    productAnalysisState = {
        level: level,
        selectedItem: selectedItem || null,
        selectedSize: selectedSize || null
    };
    renderProductAnalysisView();
}

function handleProductDrillDown(label) {
    const { level } = productAnalysisState;

    if (level === 'item') {
        setProductAnalysisLevel('size', label, null);
        return;
    }

    if (level === 'size') {
        setProductAnalysisLevel('thickness', productAnalysisState.selectedItem, label);
    }
}

function destroyProductChartInstance(instanceRef) {
    if (instanceRef) {
        try { instanceRef.destroy(); } catch (e) { /* ignore */ }
    }
    return null;
}

function createProductPieChart(canvasId, labels, data, onSegmentClick) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    const ctx = canvas.getContext('2d');
    const colors = generateColors(labels.length);
    const chartPlugins = typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [];

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 16
            },
            onClick: function (event, elements) {
                if (elements.length > 0 && typeof onSegmentClick === 'function') {
                    const index = elements[0].index;
                    onSegmentClick(labels[index], index);
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(2) : '0.00';
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    anchor: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
                        return percentage < 8 ? 'end' : 'center';
                    },
                    align: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
                        return percentage < 8 ? 'end' : 'center';
                    },
                    offset: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
                        return percentage < 8 ? 8 : 0;
                    },
                    color: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
                        return percentage < 8 ? '#1f2937' : '#ffffff';
                    },
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    formatter: function (value, context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        const label = context.chart.data.labels[context.dataIndex] || '';

                        if (percentage >= 8) {
                            const shortLabel = label.length > 12 ? `${label.substring(0, 10)}..` : label;
                            return `${shortLabel}\n${percentage.toFixed(1)}%`;
                        }

                        return `${percentage.toFixed(1)}%`;
                    },
                    clip: false,
                    display: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.dataset.data[context.dataIndex];
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        return percentage >= 2;
                    }
                }
            }
        },
        plugins: chartPlugins
    });
}

function getProductItemsForLevel(level, selectedItem, selectedSize) {
    let filtered = G_ProductAnalysisData;

    if (level === 'size' || level === 'thickness') {
        filtered = filtered.filter(row => productValuesMatch(row.itemName, selectedItem));
    }
    if (level === 'thickness') {
        filtered = filtered.filter(row => productValuesMatch(row.size, selectedSize));
    }

    if (level === 'item') {
        return aggregateProductData(filtered, row => row.itemName);
    }
    if (level === 'size') {
        return aggregateProductData(filtered, row => row.size);
    }
    return aggregateProductData(filtered, row => row.thickness);
}

function fillProductLevelTable(level, items, selectedItem, selectedSize, headerId, bodyId, footerId, onRowClick) {
    const tbody = document.getElementById(bodyId);
    const tfoot = document.getElementById(footerId);
    const theadRow = document.getElementById(headerId);
    if (!tbody || !theadRow) return;

    const grandTotal = items.reduce((sum, item) => sum + item[1], 0);

    if (level === 'item') {
        theadRow.innerHTML = `
            <th>Item Name</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    } else if (level === 'size') {
        theadRow.innerHTML = `
            <th>Item Name</th>
            <th>Size</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    } else {
        theadRow.innerHTML = `
            <th>Item Name</th>
            <th>Size</th>
            <th>Thickness</th>
            <th class="text-end">Weight</th>
            <th class="text-end">Share %</th>
        `;
    }

    const colSpan = level === 'item' ? 3 : (level === 'size' ? 4 : 5);

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-muted">No data available</td></tr>`;
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="grand-total-row">
                    <td colspan="${colSpan - 2}"><strong>Grand Total</strong></td>
                    <td class="text-end"><strong>0.00</strong></td>
                    <td class="text-end"><strong>100.00%</strong></td>
                </tr>
            `;
        }
        return;
    }

    tbody.innerHTML = '';
    items.forEach(function ([label, weight]) {
        const percentage = grandTotal > 0 ? ((weight / grandTotal) * 100) : 0;
        const tr = document.createElement('tr');
        tr.style.cursor = typeof onRowClick === 'function' ? 'pointer' : 'default';

        if (level === 'item') {
            tr.innerHTML = `
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        } else if (level === 'size') {
            tr.innerHTML = `
                <td>${escapeHtml(selectedItem)}</td>
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${escapeHtml(selectedItem)}</td>
                <td>${escapeHtml(selectedSize)}</td>
                <td>${escapeHtml(label)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${percentage.toFixed(2)}%</td>
            `;
        }

        if (typeof onRowClick === 'function') {
            tr.addEventListener('click', function () {
                onRowClick(label);
            });
        }

        tbody.appendChild(tr);
    });

    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td colspan="${colSpan - 2}"><strong>Grand Total</strong></td>
                <td class="text-end"><strong>${formatNumber(grandTotal)}</strong></td>
                <td class="text-end"><strong>100.00%</strong></td>
            </tr>
        `;
    }
}

function renderProductAnalysisBreadcrumb() {
    const breadcrumb = document.getElementById('productAnalysisBreadcrumb');
    const backBtn = document.getElementById('productAnalysisBackBtn');
    const levelBadge = document.getElementById('productAnalysisLevelBadge');
    const drillHint = document.getElementById('productAnalysisDrillHint');
    if (!breadcrumb) return;

    const { level, selectedItem, selectedSize } = productAnalysisState;
    let html = `<span class="regional-breadcrumb-item${level === 'item' ? ' active' : ''}" data-level="item">All Items</span>`;

    if (level === 'size' || level === 'thickness') {
        html += `<span class="regional-breadcrumb-separator">›</span>`;
        html += `<span class="regional-breadcrumb-item${level === 'size' ? ' active' : ''}" data-level="size">${escapeHtml(selectedItem)}</span>`;
    }

    if (level === 'thickness') {
        html += `<span class="regional-breadcrumb-separator">›</span>`;
        html += `<span class="regional-breadcrumb-item active" data-level="thickness">${escapeHtml(selectedSize)}</span>`;
    }

    breadcrumb.innerHTML = html;

    breadcrumb.querySelectorAll('.regional-breadcrumb-item[data-level]').forEach(function (item) {
        item.addEventListener('click', function () {
            const targetLevel = item.getAttribute('data-level');
            if (targetLevel === 'item') {
                setProductAnalysisLevel('item', null, null);
            } else if (targetLevel === 'size') {
                setProductAnalysisLevel('size', selectedItem, null);
            }
        });
    });

    if (backBtn) {
        if (level === 'item') {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'inline-flex';
            backBtn.textContent = level === 'thickness' ? '\u2190 Back to Sizes' : '\u2190 Back to Items';
        }

        backBtn.onclick = function (e) {
            if (e) e.preventDefault();
            if (level === 'thickness') {
                setProductAnalysisLevel('size', selectedItem, null);
            } else if (level === 'size') {
                setProductAnalysisLevel('item', null, null);
            }
        };
    }

    if (levelBadge) {
        if (level === 'item') levelBadge.textContent = 'Item Wise';
        else if (level === 'size') levelBadge.textContent = 'Size Wise';
        else levelBadge.textContent = 'Item-Size-Thickness';
    }

    if (drillHint) {
        drillHint.style.display = level === 'thickness' ? 'none' : 'block';
    }
}

function updateProductLevelVisibility() {
    const { level } = productAnalysisState;
    const itemRow = document.getElementById('productLevelItemRow');
    const sizeRow = document.getElementById('productLevelSizeRow');
    const thicknessRow = document.getElementById('productLevelThicknessRow');

    if (itemRow) itemRow.style.display = '';
    if (sizeRow) sizeRow.style.display = (level === 'size' || level === 'thickness') ? '' : 'none';
    if (thicknessRow) thicknessRow.style.display = level === 'thickness' ? '' : 'none';
}

function renderProductAnalysisView() {
    const { level, selectedItem, selectedSize } = productAnalysisState;

    renderProductAnalysisBreadcrumb();
    updateProductLevelVisibility();

    // Always keep Item chart/table visible
    const itemItems = getProductItemsForLevel('item');
    fillProductLevelTable('item', itemItems, null, null, 'productItemTableHeader', 'productItemTableBody', 'productItemTableFooter', function (label) {
        setProductAnalysisLevel('size', label, null);
    });
    productItemChartInstance = destroyProductChartInstance(productItemChartInstance);
    if (itemItems.length > 0) {
        productItemChartInstance = createProductPieChart(
            'productItemPieChart',
            itemItems.map(i => i[0]),
            itemItems.map(i => i[1]),
            function (label) { setProductAnalysisLevel('size', label, null); }
        );
    }

    // Show Item-Size chart in next row (item chart stays)
    if (level === 'size' || level === 'thickness') {
        const sizeItems = getProductItemsForLevel('size', selectedItem, null);
        const sizeChartTitle = document.getElementById('productSizeChartTitle');
        const sizeTableTitle = document.getElementById('productSizeTableTitle');
        if (sizeChartTitle) sizeChartTitle.textContent = `Item-Size wise Sales - ${selectedItem}`;
        if (sizeTableTitle) sizeTableTitle.textContent = `Item-Size wise Data - ${selectedItem}`;

        fillProductLevelTable('size', sizeItems, selectedItem, null, 'productSizeTableHeader', 'productSizeTableBody', 'productSizeTableFooter', function (label) {
            setProductAnalysisLevel('thickness', selectedItem, label);
        });
        productSizeChartInstance = destroyProductChartInstance(productSizeChartInstance);
        if (sizeItems.length > 0) {
            productSizeChartInstance = createProductPieChart(
                'productSizePieChart',
                sizeItems.map(i => i[0]),
                sizeItems.map(i => i[1]),
                function (label) { setProductAnalysisLevel('thickness', selectedItem, label); }
            );
        }
    } else {
        productSizeChartInstance = destroyProductChartInstance(productSizeChartInstance);
    }

    // Show Thickness chart in next row (previous charts stay)
    if (level === 'thickness') {
        const thicknessItems = getProductItemsForLevel('thickness', selectedItem, selectedSize);
        const thicknessChartTitle = document.getElementById('productThicknessChartTitle');
        const thicknessTableTitle = document.getElementById('productThicknessTableTitle');
        if (thicknessChartTitle) thicknessChartTitle.textContent = `Item-Size-Thickness wise Sales - ${selectedItem} / ${selectedSize}`;
        if (thicknessTableTitle) thicknessTableTitle.textContent = `Item-Size-Thickness wise Data - ${selectedItem} / ${selectedSize}`;

        fillProductLevelTable('thickness', thicknessItems, selectedItem, selectedSize, 'productThicknessTableHeader', 'productThicknessTableBody', 'productThicknessTableFooter', null);
        productThicknessChartInstance = destroyProductChartInstance(productThicknessChartInstance);
        if (thicknessItems.length > 0) {
            productThicknessChartInstance = createProductPieChart(
                'productThicknessPieChart',
                thicknessItems.map(i => i[0]),
                thicknessItems.map(i => i[1]),
                null
            );
        }
    } else {
        productThicknessChartInstance = destroyProductChartInstance(productThicknessChartInstance);
    }
}

function clearProductAnalysisDashboard() {
    G_ProductAnalysisData = [];
    productAnalysisState = { level: 'item', selectedItem: null, selectedSize: null };

    productItemChartInstance = destroyProductChartInstance(productItemChartInstance);
    productSizeChartInstance = destroyProductChartInstance(productSizeChartInstance);
    productThicknessChartInstance = destroyProductChartInstance(productThicknessChartInstance);

    const sizeRow = document.getElementById('productLevelSizeRow');
    const thicknessRow = document.getElementById('productLevelThicknessRow');
    if (sizeRow) sizeRow.style.display = 'none';
    if (thicknessRow) thicknessRow.style.display = 'none';

    fillProductLevelTable('item', [], null, null, 'productItemTableHeader', 'productItemTableBody', 'productItemTableFooter', null);
    renderProductAnalysisBreadcrumb();
}

function renderProductAnalysis() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('PRODUCT_ANALYSIS', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No product analysis data received');
            clearProductAnalysisDashboard();
            return;
        }

        G_ProductAnalysisData = response.map(normalizeProductAnalysisRow);
        productAnalysisState = { level: 'item', selectedItem: null, selectedSize: null };
        renderProductAnalysisView();
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching product analysis data:', err);
        clearProductAnalysisDashboard();
    });
}

function parseTargetVsGrowthResponse(response) {
    let gpLostRows = [];
    let summaryRow = null;

    if (!response) {
        return { gpLostRows, summaryRow };
    }

    if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
            gpLostRows = response[0] || [];
            summaryRow = (response[1] && response[1][0]) ? response[1][0] : null;
        } else if (response.length > 0 && (response[0].GP !== undefined || response[0].LostClient !== undefined)) {
            gpLostRows = response;
        }
    } else if (response.Table || response.Table1) {
        gpLostRows = response.Table || response.Table1 || [];
        const table2 = response.Table2 || [];
        summaryRow = table2[0] || null;
    } else if (response[0] || response[1]) {
        gpLostRows = response[0] || [];
        summaryRow = (response[1] && response[1][0]) ? response[1][0] : (Array.isArray(response[1]) ? null : response[1]);
    }

    return { gpLostRows: gpLostRows || [], summaryRow: summaryRow || null };
}

function clearTargetVsGrowthDashboard() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('tvgKpiLostClients', '0');
    setText('tvgKpiManifestPct', '0.00%');
    setText('tvgKpiActualPct', '0.00%');
    setText('tvgManifestMt', '0.00');
    setText('tvgActualMt', '0.00');
    setText('tvgManifestShare', '0.00%');
    setText('tvgActualShare', '0.00%');
    setText('tvgSnapManifest', '0.00 MT');
    setText('tvgSnapActual', '0.00 MT');
    setText('tvgSnapManifestPct', '0.00%');
    setText('tvgSnapActualPct', '0.00%');
    setText('tvgSnapGap', '0.00 MT');
    setText('tvgSnapAchievement', '0.00%');

    const tbody = document.getElementById('tvgLostClientTableBody');
    const tfoot = document.getElementById('tvgLostClientTableFooter');
    if (tbody) tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data available</td></tr>';
    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td><strong>Total</strong></td>
                <td class="text-end"><strong>0</strong></td>
            </tr>
        `;
    }

    if (tvgLostClientBarChartInstance) {
        try { tvgLostClientBarChartInstance.destroy(); } catch (e) { /* ignore */ }
        tvgLostClientBarChartInstance = null;
    }
    if (tvgManifestActualPieChartInstance) {
        try { tvgManifestActualPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        tvgManifestActualPieChartInstance = null;
    }
}

function renderTargetVsGrowthLostClientTable(gpLostRows) {
    const tbody = document.getElementById('tvgLostClientTableBody');
    const tfoot = document.getElementById('tvgLostClientTableFooter');
    if (!tbody) return 0;

    const order = ['Super High', 'High', 'Medium', 'Low'];
    const normalized = (gpLostRows || []).map(row => ({
        gp: (row.GP || row.gp || 'Unknown').toString().trim(),
        lost: parseFloat(row.LostClient || row.LostClients || row.lostClient || 0) || 0
    }));

    normalized.sort((a, b) => {
        const ai = order.findIndex(x => x.toLowerCase() === a.gp.toLowerCase());
        const bi = order.findIndex(x => x.toLowerCase() === b.gp.toLowerCase());
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    if (normalized.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data available</td></tr>';
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="grand-total-row">
                    <td><strong>Total</strong></td>
                    <td class="text-end"><strong>0</strong></td>
                </tr>
            `;
        }
        return 0;
    }

    let totalLost = 0;
    tbody.innerHTML = '';
    normalized.forEach(item => {
        totalLost += item.lost;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(item.gp)}</td>
            <td class="text-end">${Number(item.lost).toLocaleString('en-US')}</td>
        `;
        tbody.appendChild(tr);
    });

    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td><strong>Total</strong></td>
                <td class="text-end"><strong>${Number(totalLost).toLocaleString('en-US')}</strong></td>
            </tr>
        `;
    }

    return totalLost;
}

function renderTargetVsGrowthBarChart(gpLostRows) {
    const canvas = document.getElementById('tvgLostClientBarChart');
    if (!canvas) return;

    if (tvgLostClientBarChartInstance) {
        try { tvgLostClientBarChartInstance.destroy(); } catch (e) { /* ignore */ }
        tvgLostClientBarChartInstance = null;
    }

    const order = ['Super High', 'High', 'Medium', 'Low'];
    const sortedRows = [...(gpLostRows || [])].sort((a, b) => {
        const ag = (a.GP || a.gp || '').toString().toLowerCase();
        const bg = (b.GP || b.gp || '').toString().toLowerCase();
        const ai = order.findIndex(x => x.toLowerCase() === ag);
        const bi = order.findIndex(x => x.toLowerCase() === bg);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const labels = sortedRows.map(r => (r.GP || r.gp || 'Unknown').toString());
    const values = sortedRows.map(r => parseFloat(r.LostClient || r.LostClients || r.lostClient || 0) || 0);
    const colors = generateColors(labels.length);

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    tvgLostClientBarChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lost Clients',
                data: values,
                backgroundColor: colors,
                borderRadius: 8,
                maxBarThickness: 48
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#1f2937',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => Number(value).toLocaleString('en-US')
                }
            },
            scales: {
                x: {
                    ticks: { font: { weight: '600' } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => Number(value).toLocaleString('en-US')
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
}

function renderTargetVsGrowthPieChart(manifested, actual) {
    const canvas = document.getElementById('tvgManifestActualPieChart');
    if (!canvas) return;

    if (tvgManifestActualPieChartInstance) {
        try { tvgManifestActualPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        tvgManifestActualPieChartInstance = null;
    }

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    const labels = ['Manifest', 'Actual'];
    const values = [manifested, actual];
    const total = manifested + actual;

    tvgManifestActualPieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#4e73df', '#e74a3b'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 12, font: { size: 12, weight: '600' } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
                            return `${context.label}: ${formatNumber(value)} MT (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 12 },
                    formatter: function (value) {
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${pct}%`;
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
}

function renderTargetVsGrowthDashboard(gpLostRows, summaryRow) {
    const totalLost = renderTargetVsGrowthLostClientTable(gpLostRows);

    const manifested = parseFloat(
        summaryRow?.TotalManifested || summaryRow?.totalManifested || summaryRow?.Manifested || summaryRow?.Manifest || 0
    ) || 0;
    const actual = parseFloat(
        summaryRow?.TotalActualSales || summaryRow?.totalActualSales || summaryRow?.ActualSales || summaryRow?.Actual || 0
    ) || 0;
    const combined = manifested + actual;
    const manifestPct = combined > 0 ? (manifested / combined) * 100 : 0;
    const actualPct = combined > 0 ? (actual / combined) * 100 : 0;
    const gap = manifested - actual;
    const achievement = manifested > 0 ? (actual / manifested) * 100 : 0;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('tvgKpiLostClients', Number(totalLost).toLocaleString('en-US'));
    setText('tvgKpiManifestPct', `${manifestPct.toFixed(2)}%`);
    setText('tvgKpiActualPct', `${actualPct.toFixed(2)}%`);
    setText('tvgManifestMt', formatNumber(manifested));
    setText('tvgActualMt', formatNumber(actual));
    setText('tvgManifestShare', `${manifestPct.toFixed(2)}%`);
    setText('tvgActualShare', `${actualPct.toFixed(2)}%`);
    setText('tvgSnapManifest', `${formatNumber(manifested)} MT`);
    setText('tvgSnapActual', `${formatNumber(actual)} MT`);
    setText('tvgSnapManifestPct', `${manifestPct.toFixed(2)}%`);
    setText('tvgSnapActualPct', `${actualPct.toFixed(2)}%`);
    setText('tvgSnapGap', `${formatNumber(gap)} MT`);
    setText('tvgSnapAchievement', `${achievement.toFixed(2)}%`);

    renderTargetVsGrowthBarChart(gpLostRows);
    renderTargetVsGrowthPieChart(manifested, actual);
}

function renderTargetVsGrowth() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    SalesanalysisASTService.GetMultipleTableSalesAnalysisData(
        'TARGET_GROWTH_ANALYSIS',
        filters.dealerCodes,
        filters.fromDate,
        filters.toDate,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    ).then(function (response) {
        HideLoader();

        const parsed = parseTargetVsGrowthResponse(response);
        if ((!parsed.gpLostRows || parsed.gpLostRows.length === 0) && !parsed.summaryRow) {
            console.warn('No Target Vs Growth data received');
            clearTargetVsGrowthDashboard();
            return;
        }

        renderTargetVsGrowthDashboard(parsed.gpLostRows, parsed.summaryRow);
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching Target Vs Growth data:', err);
        clearTargetVsGrowthDashboard();
    });
}

function isClientAnalysisSummaryRow(row) {
    if (!row || typeof row !== 'object') return false;
    const keys = Object.keys(row).map(k => k.toLowerCase());
    return keys.some(k =>
        k.includes('totalclient') ||
        k.includes('lostclient') ||
        k.includes('salesmt') ||
        k.includes('avgmt') ||
        k.includes('sales (mt)') ||
        k.includes('avg mt/client')
    );
}

function normalizeClientAnalysisRow(row) {
    return {
        partyName: (row['Party Name'] || row.PartyName || row.Client || row.CLIENT || 'Unknown').toString().trim(),
        segment: (row['Segment'] || row.Segment || row.Seg || 'Unknown').toString().trim(),
        gp: (row['GP'] || row.GP || '').toString().trim() || '-',
        status: (row['Status'] || row.Status || '').toString().trim(),
        qty: parseFloat(row['Qty'] || row.QTY || row.MT || row.Weight || row['Weight'] || 0) || 0,
        target: parseFloat(row['Target'] || row.TARGET || row['Target MT'] || 0) || 0,
        ach: parseFloat(row['Ach.'] || row.Ach || row.Achieved || row['Achieved'] || row['Ach'] || 0) || 0,
        nofDreamClient: parseInt(row['NofDreamClient'] || row.NofDreamClient || row.nofDreamClient || 0, 10) || 0
    };
}

function getNofDreamClientFromTopRow(clientRows) {
    if (!clientRows || clientRows.length === 0) return 0;
    const topRow = clientRows[0];
    return parseInt(topRow['NofDreamClient'] || topRow.NofDreamClient || topRow.nofDreamClient || 0, 10) || 0;
}

function parseClientAnalysisResponse(response) {
    let clientRows = [];
    let summaryRow = null;

    if (!response) {
        return { clientRows, summaryRow };
    }

    if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
            clientRows = response[0] || [];
            if (response[1] && response[1].length > 0 && isClientAnalysisSummaryRow(response[1][0])) {
                summaryRow = response[1][0];
            }
        } else if (response.length > 0 && (response[0]['Party Name'] !== undefined || response[0].PartyName !== undefined || response[0].Client !== undefined)) {
            clientRows = response;
        }
    } else if (response.Table || response.Table1) {
        clientRows = response.Table || response.Table1 || [];
        const table2 = response.Table2 || [];
        if (table2.length > 0 && isClientAnalysisSummaryRow(table2[0])) {
            summaryRow = table2[0];
        }
    }

    return {
        clientRows: clientRows || [],
        summaryRow: summaryRow || null
    };
}

function computeClientAnalysisKpis(clientRows, summaryRow) {
    const normalized = (clientRows || []).map(normalizeClientAnalysisRow);
    const uniqueParties = new Set();
    let lostClients = 0;
    let salesMt = 0;

    normalized.forEach(item => {
        if (item.partyName && item.partyName !== 'Unknown') {
            uniqueParties.add(item.partyName.toLowerCase());
        }
        const status = item.status.toUpperCase();
        if (status.includes('LOST')) {
            lostClients++;
        }
        salesMt += item.qty;
    });

    const totalClients = parseFloat(
        summaryRow?.TotalClients || summaryRow?.['Total Clients'] || summaryRow?.TotalClient || uniqueParties.size
    ) || uniqueParties.size;

    lostClients = parseFloat(
        summaryRow?.LostClients || summaryRow?.['Lost Clients'] || summaryRow?.LostClient || lostClients
    ) || lostClients;

    salesMt = parseFloat(
        summaryRow?.SalesMT || summaryRow?.['Sales (MT)'] || summaryRow?.SalesMt || summaryRow?.TotalSales || salesMt
    ) || salesMt;

    let avgMtClient = parseFloat(
        summaryRow?.AvgMTClient || summaryRow?.['Avg MT/Client'] || summaryRow?.AvgMtClient || 0
    ) || 0;

    if (!avgMtClient && totalClients > 0) {
        avgMtClient = salesMt / totalClients;
    }

    return { totalClients, lostClients, salesMt, avgMtClient };
}

function clearClientAnalysisDashboard() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('caKpiTotalClients', '0');
    setText('caKpiLostClients', '0');
    setText('caKpiSalesMt', '0.00');
    setText('caKpiAvgMtClient', '0.00');
    setText('caKpiDreamClients', '0');

    const gpBody = document.getElementById('caGpClientTableBody');
    const segmentBody = document.getElementById('caSegmentSalesTableBody');

    if (gpBody) gpBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
    if (segmentBody) segmentBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
}

function renderClientAnalysisGpTable(clientRows) {
    const tbody = document.getElementById('caGpClientTableBody');
    if (!tbody) return;

    const gpOrder = ['Super High', 'High', 'Medium', 'Low'];
    const items = (clientRows || [])
        .map(normalizeClientAnalysisRow)
        .filter(item => item.partyName && item.partyName !== 'Unknown')
        .sort((a, b) => {
            const ai = gpOrder.findIndex(x => x.toLowerCase() === a.gp.toLowerCase());
            const bi = gpOrder.findIndex(x => x.toLowerCase() === b.gp.toLowerCase());
            if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            return b.qty - a.qty;
        });

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(item.partyName)}</td>
            <td>${escapeHtml(item.segment)}</td>
            <td class="text-end">${formatNumber(item.qty)}</td>
            <td>${escapeHtml(item.gp)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderClientAnalysisSegmentTable(clientRows) {
    const tbody = document.getElementById('caSegmentSalesTableBody');
    if (!tbody) return;

    const segmentMap = new Map();

    (clientRows || []).forEach(row => {
        const item = normalizeClientAnalysisRow(row);
        if (!item.partyName || item.partyName === 'Unknown') return;

        if (!segmentMap.has(item.segment)) {
            segmentMap.set(item.segment, { total: 0, parties: [] });
        }

        const group = segmentMap.get(item.segment);
        group.total += item.qty;
        group.parties.push({
            partyName: item.partyName,
            qty: item.qty
        });
    });

    const segments = Array.from(segmentMap.entries())
        .map(([segment, data]) => ({
            segment,
            total: data.total,
            parties: data.parties.sort((a, b) => b.qty - a.qty)
        }))
        .sort((a, b) => b.total - a.total);

    if (segments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    segments.forEach(group => {
        group.parties.forEach((party, index) => {
            const tr = document.createElement('tr');
            const segmentCell = index === 0
                ? `<td rowspan="${group.parties.length}" style="vertical-align:middle;font-weight:600;">${escapeHtml(group.segment)}</td>`
                : '';
            const totalCell = index === 0
                ? `<td rowspan="${group.parties.length}" class="text-end" style="vertical-align:middle;font-weight:700;background:#f8fafc;">${formatNumber(group.total)}</td>`
                : '';

            tr.innerHTML = `
                ${segmentCell}
                <td>${escapeHtml(party.partyName)}</td>
                <td class="text-end">${formatNumber(party.qty)}</td>
                ${totalCell}
            `;
            tbody.appendChild(tr);
        });
    });
}

function renderClientAnalysisDashboard(clientRows, summaryRow) {
    const kpis = computeClientAnalysisKpis(clientRows, summaryRow);
    const nofDreamClient = getNofDreamClientFromTopRow(clientRows);

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('caKpiTotalClients', Number(kpis.totalClients).toLocaleString('en-US'));
    setText('caKpiLostClients', Number(kpis.lostClients).toLocaleString('en-US'));
    setText('caKpiSalesMt', formatNumber(kpis.salesMt));
    setText('caKpiAvgMtClient', formatNumber(kpis.avgMtClient));
    setText('caKpiDreamClients', Number(nofDreamClient).toLocaleString('en-US'));

    renderClientAnalysisGpTable(clientRows);
    renderClientAnalysisSegmentTable(clientRows);
}

function renderClientAnalysis() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    SalesanalysisASTService.GetMultipleTableSalesAnalysisData(
        'CLIENT_ANALYSIS',
        filters.dealerCodes,
        filters.fromDate,
        filters.toDate,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    ).then(function (response) {
        HideLoader();

        const parsed = parseClientAnalysisResponse(response);
        if ((!parsed.clientRows || parsed.clientRows.length === 0) && !parsed.summaryRow) {
            console.warn('No Client Analysis data received');
            clearClientAnalysisDashboard();
            return;
        }

        renderClientAnalysisDashboard(parsed.clientRows, parsed.summaryRow);
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching Client Analysis data:', err);
        clearClientAnalysisDashboard();
    });
}

function formatComparisonPeriodLabel(fromDate, toDate) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fmt = function (d) {
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
    };
    return `(${fmt(fromDate)} – ${fmt(toDate)}, ${toDate.getFullYear()})`;
}

function formatMonthYearLabel(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function clipDateToMonthDay(year, month, day) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(Math.max(day, 1), lastDay));
}

function buildSalesComparisonMonthPair(year, month, rangeFrom, rangeTo) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const currentFrom = new Date(Math.max(monthStart.getTime(), rangeFrom.getTime()));
    const currentTo = new Date(Math.min(monthEnd.getTime(), rangeTo.getTime()));

    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const previousFrom = clipDateToMonthDay(prevYear, prevMonth, currentFrom.getDate());
    const previousTo = clipDateToMonthDay(prevYear, prevMonth, currentTo.getDate());

    return {
        label: formatMonthYearLabel(monthStart),
        current: {
            from: currentFrom,
            to: currentTo,
            fromDate: formatDateYYYYMMDD(currentFrom),
            toDate: formatDateYYYYMMDD(currentTo),
            title: formatMonthYearLabel(monthStart),
            rangeLabel: formatComparisonPeriodLabel(currentFrom, currentTo)
        },
        previous: {
            from: previousFrom,
            to: previousTo,
            fromDate: formatDateYYYYMMDD(previousFrom),
            toDate: formatDateYYYYMMDD(previousTo),
            title: formatMonthYearLabel(new Date(prevYear, prevMonth, 1)),
            rangeLabel: formatComparisonPeriodLabel(previousFrom, previousTo)
        }
    };
}

function getSalesComparisonMonthWiseConfig(fromDateStr, toDateStr) {
    const now = new Date();
    let rangeFrom;
    let rangeTo;
    let monthPairs = [];

    if (!fromDateStr || fromDateStr === '0' || !toDateStr || toDateStr === '0') {
        const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousTo = new Date(now.getFullYear(), now.getMonth(), 0);

        monthPairs.push({
            label: formatMonthYearLabel(currentFrom),
            current: {
                from: currentFrom,
                to: currentTo,
                fromDate: formatDateYYYYMMDD(currentFrom),
                toDate: formatDateYYYYMMDD(currentTo),
                title: formatMonthYearLabel(currentFrom),
                rangeLabel: formatComparisonPeriodLabel(currentFrom, currentTo)
            },
            previous: {
                from: previousFrom,
                to: previousTo,
                fromDate: formatDateYYYYMMDD(previousFrom),
                toDate: formatDateYYYYMMDD(previousTo),
                title: formatMonthYearLabel(previousFrom),
                rangeLabel: formatComparisonPeriodLabel(previousFrom, previousTo)
            }
        });
    } else {
        rangeFrom = new Date(fromDateStr);
        rangeTo = new Date(toDateStr);

        let cursor = new Date(rangeFrom.getFullYear(), rangeFrom.getMonth(), 1);
        const endCursor = new Date(rangeTo.getFullYear(), rangeTo.getMonth(), 1);

        while (cursor.getTime() <= endCursor.getTime()) {
            monthPairs.push(buildSalesComparisonMonthPair(cursor.getFullYear(), cursor.getMonth(), rangeFrom, rangeTo));
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }
    }

    if (monthPairs.length === 0) {
        rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        rangeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        monthPairs.push(buildSalesComparisonMonthPair(now.getFullYear(), now.getMonth(), rangeFrom, rangeTo));
    }

    let fetchFromDate = monthPairs[0].previous.fromDate;
    let fetchToDate = monthPairs[monthPairs.length - 1].current.toDate;

    monthPairs.forEach(function (pair) {
        if (pair.previous.fromDate < fetchFromDate) fetchFromDate = pair.previous.fromDate;
        if (pair.current.toDate > fetchToDate) fetchToDate = pair.current.toDate;
    });

    const firstPair = monthPairs[0];
    const lastPair = monthPairs[monthPairs.length - 1];

    return {
        monthPairs,
        fetchFromDate,
        fetchToDate,
        summaryPreviousRange: monthPairs.length === 1
            ? firstPair.previous.rangeLabel
            : `${firstPair.previous.title} – ${monthPairs[monthPairs.length - 1].previous.title}`,
        summaryCurrentRange: monthPairs.length === 1
            ? firstPair.current.rangeLabel
            : `${firstPair.current.title} – ${lastPair.current.title}`
    };
}

function normalizeSalesComparisonRow(row) {
    const dateValue = row.Date || row.DATE || row['Invoice Date'] || row.RemovalDate || row['Removal Date'];
    const qty = parseFloat(row.QtyMT || row.QTY || row.Qty || row.Weight || row['Weight'] || 0) || 0;
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    return { date, qty };
}

function parseSalesComparisonRows(response) {
    let rows = [];

    if (!response) return rows;

    if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
            rows = response[0] || [];
        } else {
            rows = response;
        }
    } else if (response.Table || response.Table1) {
        rows = response.Table || response.Table1 || [];
    }

    return (rows || []).map(normalizeSalesComparisonRow).filter(Boolean);
}

function isDateWithinPeriod(date, periodFrom, periodTo) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const from = new Date(periodFrom.getFullYear(), periodFrom.getMonth(), periodFrom.getDate()).getTime();
    const to = new Date(periodTo.getFullYear(), periodTo.getMonth(), periodTo.getDate()).getTime();
    return d >= from && d <= to;
}

function sumSalesComparisonQty(rows, periodFrom, periodTo) {
    return (rows || []).reduce(function (sum, item) {
        if (isDateWithinPeriod(item.date, periodFrom, periodTo)) {
            return sum + item.qty;
        }
        return sum;
    }, 0);
}

function getSalesComparisonGrowthInfo(currentTotal, previousTotal) {
    if (previousTotal === 0 && currentTotal === 0) {
        return { pct: 0, symbol: '=', cssClass: 'neutral', text: '= 0.0%' };
    }

    const pct = previousTotal === 0 ? 100 : Math.abs(((currentTotal - previousTotal) / previousTotal) * 100);
    const increased = currentTotal > previousTotal;
    const symbol = currentTotal > previousTotal ? '▲' : (currentTotal < previousTotal ? '▼' : '=');
    const cssClass = currentTotal >= previousTotal ? 'positive' : 'negative';

    return {
        pct,
        symbol,
        cssClass,
        text: `${symbol} ${pct.toFixed(1)}%`
    };
}

function clearSalesComparisonDashboard() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('scPreviousTotal', '0.00 MT');
    setText('scCurrentTotal', '0.00 MT');
    setText('scGrowthValue', '0.00%');
    setText('scPreviousPeriodRange', '—');
    setText('scCurrentPeriodRange', '—');
    setText('scPreviousPeriodTitle', 'Last Month');
    setText('scCurrentPeriodTitle', 'Current Month');

    const growthBadge = document.getElementById('scGrowthBadge');
    if (growthBadge) {
        growthBadge.className = 'sc-growth-badge neutral';
        growthBadge.textContent = '—';
        growthBadge.style.display = 'block';
    }

    if (salesComparisonBarChartInstance) {
        try { salesComparisonBarChartInstance.destroy(); } catch (e) { /* ignore */ }
        salesComparisonBarChartInstance = null;
    }
}

function buildSalesComparisonMonthResults(rows, config) {
    const monthResults = (config.monthPairs || []).map(function (pair) {
        const previousTotal = sumSalesComparisonQty(rows, pair.previous.from, pair.previous.to);
        const currentTotal = sumSalesComparisonQty(rows, pair.current.from, pair.current.to);
        return {
            ...pair,
            previousTotal,
            currentTotal
        };
    });

    const previousTotal = monthResults.reduce(function (sum, item) { return sum + item.previousTotal; }, 0);
    const currentTotal = monthResults.reduce(function (sum, item) { return sum + item.currentTotal; }, 0);

    return { monthResults, previousTotal, currentTotal };
}

function renderSalesComparisonChart(monthResults, previousTotal, currentTotal) {
    const canvas = document.getElementById('salesComparisonBarChart');
    if (!canvas) return;

    if (salesComparisonBarChartInstance) {
        try { salesComparisonBarChartInstance.destroy(); } catch (e) { /* ignore */ }
        salesComparisonBarChartInstance = null;
    }

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    const growth = getSalesComparisonGrowthInfo(currentTotal, previousTotal);
    const growthBadge = document.getElementById('scGrowthBadge');
    if (growthBadge) {
        growthBadge.className = `sc-growth-badge ${growth.cssClass}`;
        growthBadge.textContent = monthResults.length === 1 ? growth.text : '';
        growthBadge.style.display = monthResults.length === 1 ? 'block' : 'none';
    }

    const isMultiMonth = monthResults.length > 1;
    let chartConfig;

    if (isMultiMonth) {
        chartConfig = {
            type: 'bar',
            data: {
                labels: monthResults.map(function (item) { return item.label; }),
                datasets: [
                    {
                        label: 'Last Month',
                        data: monthResults.map(function (item) { return item.previousTotal; }),
                        backgroundColor: '#cbd5e0',
                        borderRadius: 6,
                        maxBarThickness: 52
                    },
                    {
                        label: 'Current Month',
                        data: monthResults.map(function (item) { return item.currentTotal; }),
                        backgroundColor: '#4e73df',
                        borderRadius: 6,
                        maxBarThickness: 52
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 11, weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${formatNumber(context.parsed.y)} MT`;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#1a202c',
                        font: { weight: 'bold', size: 10 },
                        formatter: function (value) {
                            return value > 0 ? `${formatNumber(value)}` : '';
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11, weight: '600' }, color: '#4a5568' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#edf2f7' },
                        ticks: {
                            color: '#718096',
                            callback: function (value) {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value;
                            }
                        }
                    }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        };
    } else {
        const pair = monthResults[0] || { previousTotal: 0, currentTotal: 0, previous: {}, current: {} };
        chartConfig = {
            type: 'bar',
            data: {
                labels: ['Last Month', 'Current Month'],
                datasets: [{
                    data: [pair.previousTotal, pair.currentTotal],
                    backgroundColor: ['#cbd5e0', '#4e73df'],
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 88
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${formatNumber(context.parsed.y)} MT`;
                            },
                            afterLabel: function (context) {
                                return context.dataIndex === 0 ? pair.previous.rangeLabel : pair.current.rangeLabel;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#1a202c',
                        font: { weight: 'bold', size: 13 },
                        formatter: function (value) {
                            return `${formatNumber(value)} MT`;
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: '600' }, color: '#4a5568' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#edf2f7' },
                        ticks: {
                            color: '#718096',
                            callback: function (value) {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value;
                            }
                        }
                    }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        };
    }

    salesComparisonBarChartInstance = new Chart(canvas.getContext('2d'), chartConfig);
}

function renderSalesComparisonDashboard(comparisonResult, config) {
    const previousTotal = comparisonResult.previousTotal;
    const currentTotal = comparisonResult.currentTotal;
    const growth = getSalesComparisonGrowthInfo(currentTotal, previousTotal);
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    const isMultiMonth = comparisonResult.monthResults.length > 1;

    setText('scPreviousPeriodTitle', isMultiMonth ? 'Last Month Total' : 'Last Month');
    setText('scCurrentPeriodTitle', isMultiMonth ? 'Current Month Total' : 'Current Month');
    setText('scPreviousTotal', `${formatNumber(previousTotal)} MT`);
    setText('scCurrentTotal', `${formatNumber(currentTotal)} MT`);
    setText('scGrowthValue', `${growth.symbol} ${growth.pct.toFixed(1)}%`);
    setText('scPreviousPeriodRange', config.summaryPreviousRange);
    setText('scCurrentPeriodRange', config.summaryCurrentRange);

    renderSalesComparisonChart(comparisonResult.monthResults, previousTotal, currentTotal);
}

function renderSalesComparison() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    const config = getSalesComparisonMonthWiseConfig(filters.fromDate, filters.toDate);

    SalesanalysisASTService.GetSalesAnalysisData(
        'Sales_Comparison',
        filters.dealerCodes,
        config.fetchFromDate,
        config.fetchToDate,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    ).then(function (response) {
        HideLoader();

        const rows = parseSalesComparisonRows(response);
        if (!rows.length) {
            console.warn('No Sales Comparison data received');
            clearSalesComparisonDashboard();
            return;
        }

        const comparisonResult = buildSalesComparisonMonthResults(rows, config);
        renderSalesComparisonDashboard(comparisonResult, config);
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching Sales Comparison data:', err);
        clearSalesComparisonDashboard();
    });
}

function renderHighGPLostClient() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();

    Showloader();

    SalesanalysisASTService.GetSalesAnalysisData('HIGH_GP_LOST_CLIENT', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No High GP Lost Client data received');
            document.getElementById('highGPLostClientTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
            document.getElementById('highGPLostClientTableHeader').innerHTML = '';
            return;
        }

        const StringFilterColumn = ["Party Name", "Segment", "Marketing Man", "Location", "GP", "Status"];
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
            'Growth (%)': 'right'
        };

        if (typeof BizsolCustomFilterGrid !== 'undefined') {
            BizsolCustomFilterGrid.CreateDataTable("highGPLostClientTableHeader", "highGPLostClientTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching High GP Lost Client data:', err);
    });
}

// Show report function
function SalesanalysisAST_ShowReport() {
    const filters = GetAllFilters();

    // Check if dealer codes are empty (not just checking the old way)
    if (!filters.dealerCodes || filters.dealerCodes === '') {
        console.warn('No dealers selected');
        return;
    }

    // Check which tab is active and render accordingly
    if (document.querySelector('#summaryReport')?.classList.contains('show') || document.querySelector('#summaryReport')?.classList.contains('active')) {
        renderSummaryReport();
    }
    if (document.querySelector('#partyScoring')?.classList.contains('show') || document.querySelector('#partyScoring')?.classList.contains('active')) {
        renderPartyScoring();
    }
    if (document.querySelector('#goldenCircle')?.classList.contains('show') || document.querySelector('#goldenCircle')?.classList.contains('active')) {
        renderGoldenCircleClient();
    }
    if (document.querySelector('#manifestation')?.classList.contains('show') || document.querySelector('#manifestation')?.classList.contains('active')) {
        renderManifestation();
    }
    if (document.querySelector('#nbdCrr')?.classList.contains('show') || document.querySelector('#nbdCrr')?.classList.contains('active')) {
        renderNBDCRR();
    }
    if (document.querySelector('#segmentWise')?.classList.contains('show') || document.querySelector('#segmentWise')?.classList.contains('active')) {
        renderSegmentWise();
    }
    if (document.querySelector('#regionalAnalysis')?.classList.contains('show') || document.querySelector('#regionalAnalysis')?.classList.contains('active')) {
        renderRegionalAnalysis();
    }
    if (document.querySelector('#productAnalysis')?.classList.contains('show') || document.querySelector('#productAnalysis')?.classList.contains('active')) {
        renderProductAnalysis();
    }
    if (document.querySelector('#targetVsGrowth')?.classList.contains('show') || document.querySelector('#targetVsGrowth')?.classList.contains('active')) {
        renderTargetVsGrowth();
    }
    if (document.querySelector('#clientAnalysis')?.classList.contains('show') || document.querySelector('#clientAnalysis')?.classList.contains('active')) {
        renderClientAnalysis();
    }
    if (document.querySelector('#gpWiseSummary')?.classList.contains('show') || document.querySelector('#gpWiseSummary')?.classList.contains('active')) {
        renderGPWiseSummary();
    }
    if (document.querySelector('#highGPLostClient')?.classList.contains('show') || document.querySelector('#highGPLostClient')?.classList.contains('active')) {
        renderHighGPLostClient();
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

    const regionalAnalysisTabBtn = document.getElementById('regionalAnalysis-tab');
    if (regionalAnalysisTabBtn) {
        regionalAnalysisTabBtn.addEventListener('shown.bs.tab', function () {
            renderRegionalAnalysis();
        });
    }

    const productAnalysisTabBtn = document.getElementById('productAnalysis-tab');
    if (productAnalysisTabBtn) {
        productAnalysisTabBtn.addEventListener('shown.bs.tab', function () {
            renderProductAnalysis();
        });
    }

    const targetVsGrowthTabBtn = document.getElementById('targetVsGrowth-tab');
    if (targetVsGrowthTabBtn) {
        targetVsGrowthTabBtn.addEventListener('shown.bs.tab', function () {
            renderTargetVsGrowth();
        });
    }

    const clientAnalysisTabBtn = document.getElementById('clientAnalysis-tab');
    if (clientAnalysisTabBtn) {
        clientAnalysisTabBtn.addEventListener('shown.bs.tab', function () {
            renderClientAnalysis();
        });
    }

    const gpWiseTabBtn = document.getElementById('gpWiseSummary-tab');
    if (gpWiseTabBtn) {
        gpWiseTabBtn.addEventListener('shown.bs.tab', function () {
            renderGPWiseSummary();
        });
    }

    const highGPLostClientTabBtn = document.getElementById('highGPLostClient-tab');
    if (highGPLostClientTabBtn) {
        highGPLostClientTabBtn.addEventListener('shown.bs.tab', function () {
            renderHighGPLostClient();
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
        if (document.querySelector('#regionalAnalysis') && document.querySelector('#regionalAnalysis').classList.contains('show')) {
            renderRegionalAnalysis();
        }
        if (document.querySelector('#productAnalysis') && document.querySelector('#productAnalysis').classList.contains('show')) {
            renderProductAnalysis();
        }
        if (document.querySelector('#targetVsGrowth') && document.querySelector('#targetVsGrowth').classList.contains('show')) {
            renderTargetVsGrowth();
        }
        if (document.querySelector('#clientAnalysis') && document.querySelector('#clientAnalysis').classList.contains('show')) {
            renderClientAnalysis();
        }
        if (document.querySelector('#gpWiseSummary') && document.querySelector('#gpWiseSummary').classList.contains('show')) {
            renderGPWiseSummary();
        }
        if (document.querySelector('#highGPLostClient') && document.querySelector('#highGPLostClient').classList.contains('show')) {
            renderHighGPLostClient();
        }
    }, 300);
});

window.SalesanalysisAST_ShowReport = SalesanalysisAST_ShowReport;
