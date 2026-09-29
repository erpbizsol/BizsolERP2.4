import { SalesanalysisASTService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesanalysisASTService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { PurchaseQualityCheckService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseQualityCheckService.js';
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
let summaryGpWiseManPieChartInstance = null;
let salesComparisonBarChartInstance = null;
let partyScoreDonutChartInstance = null;
let caProductPieChartInstance = null;
let G_SummaryReportRows = [];
let G_PartyScoringRows = [];
let G_PartyScoringLastMonthMap = {};
let G_PartySaleMap = {};
let G_ClientRatingMaster = [];
const HIGH_GP_SALE_TARGET_PCT = 60;

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

    const monthToDateRange = getCurrentMonthToDateRange();
    fromDate = monthToDateRange.fromDate;
    toDate = monthToDateRange.toDate;

    // Initialize with empty filters first
    const filters = [
        { id: 'dateRange', type: 'daterange', label: 'Date Range', defaultFrom: monthToDateRange.fromDate, defaultTo: monthToDateRange.toDate },
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
    filterPanel.setFilters(filters, { useCommaToken: true });
    applyDefaultDateRangeToFilter(filterPanel);
    updateReportDateRangeDisplay();

    // Re-apply default so the To date stays today even if the control initializes later
    setTimeout(() => {
        applyDefaultDateRangeToFilter(filterPanel);
        updateReportDateRangeDisplay();
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
    loadPromises.push(loadClientRatingMaster());

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
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    if (gp.includes('super')) return 'superHigh';
    if (gp.includes('high')) return 'high';
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
    const gpMtMap = { superHigh: 0, high: 0, medium: 0, low: 0, other: 0 };

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
    const apiLostClientCount = sr.LostClientCount ?? sr.LostClients ?? sr.LostClient ?? sr['Lost Clients'];
    const lostClients = (apiLostClientCount !== undefined && apiLostClientCount !== null && apiLostClientCount !== '')
        ? (parseFloat(apiLostClientCount) || 0)
        : lostClientParties.size;
    lostFreight = parseFloat(sr.LostFreight || sr['Lost Freight'] || lostFreight) || lostFreight;
    const totalParties = parseInt(
        sr.TotalClients || sr.TotalParties || sr['Total Parties'] || sr.TotalClient || sr['Total Clients'] || sr.NoOfParties || uniqueParties.size,
        10
    ) || uniqueParties.size;
    const nbdCount = parseInt(sr.NBDCount || sr.NBD || sr['NBD Count'] || nbdParties.size, 10) || nbdParties.size;
    const crrCount = parseInt(sr.CRRCount || sr.CRR || sr['CRR Count'] || crrParties.size, 10) || crrParties.size;
    const totalManifested = parseFloat(sr.TotalManifested || sr.totalManifested || sr['Total Manifested'] || manifestedTotal) || manifestedTotal;
    const asOnDate = (toDate && toDate !== '0') ? new Date(toDate) : new Date();
    const validAsOn = isNaN(asOnDate.getTime()) ? new Date() : asOnDate;
    const daysInMonth = new Date(validAsOn.getFullYear(), validAsOn.getMonth() + 1, 0).getDate();
    const daysAsOnDate = Math.max(1, Math.min(validAsOn.getDate(), daysInMonth));
    const manifestedAsOnDate = daysInMonth > 0
        ? (totalManifested / daysInMonth) * daysAsOnDate
        : totalManifested;
    const readyDispatch = parseFloat(sr.ReadyToDispatch || sr.ReaddyToDispatch || sr.ReadyToDispatchStock || sr['Ready To Dispatch'] || 0) || 0;
    const readyDispatchValue = parseFloat(sr.ReadyToDispatchValue || sr['Ready To Dispatch Value'] || sr.ReadyDispatchValue || 0) || 0;
    const closeDreamClient = parseInt(
        sr.CloseDreamClient ?? sr.ClosedDreamClient ?? sr['Close Dream Client'] ?? sr.NofDreamClient ?? 0,
        10
    ) || 0;
    const manifestActualScore = manifestedAsOnDate > 0 ? (totalSaleMt / manifestedAsOnDate) * 100 : 0;

    return {
        totalSaleMt,
        teamSaleMt,
        lostClients,
        closeDreamClient,
        totalParties,
        manifestActualScore,
        lostFreight,
        nbdCount,
        crrCount,
        nbdCrrTotal: nbdCount + crrCount,
        readyDispatch,
        readyDispatchValue,
        gpMtMap,
        totalManifested,
        manifestedAsOnDate
    };
}

function clearSummaryDashboard() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('skpi-total-sale', '0 MT');
    setText('skpi-lost-client', '0');
    setText('skpi-close-dream-client', '0');
    setText('skpi-total-parties', '0');
    setText('skpi-manifest-score', '0.00%');
    setText('skpi-total-manifested', '0 MT');
    setText('skpi-manifest-asondate', '0 MT');
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
    if (summaryGpWiseManPieChartInstance) {
        try { summaryGpWiseManPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryGpWiseManPieChartInstance = null;
    }
    const gpWiseLegend = document.getElementById('summaryGpWiseManLegend');
    if (gpWiseLegend) gpWiseLegend.innerHTML = '';
    G_SummaryReportRows = [];
    renderSummaryTop10Clients([]);
    renderSummaryHighGpAchievement([]);
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
        { key: 'superHigh', label: 'Super High GP', criteria: '(> 15%)', color: '#224abe' },
        { key: 'high', label: 'High GP', criteria: '(12% – 15%)', color: '#1cc88a' },
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
    setText('skpi-close-dream-client', formatInteger(metrics.closeDreamClient));
    setText('skpi-total-parties', formatInteger(metrics.totalParties));
    setText('skpi-manifest-score', `${metrics.manifestActualScore.toFixed(2)}%`);
    setText('skpi-total-manifested', `${formatNumber(metrics.totalManifested)} MT`);
    setText('skpi-manifest-asondate', `${formatNumber(metrics.manifestedAsOnDate)} MT`);
    setText('skpi-lost-freight', formatIndianCurrency(metrics.lostFreight));

    const saleAsOnLabel = document.getElementById('skpi-total-sale-label');
    const asOnLabel = document.getElementById('skpi-manifested-asondate-label');
    const asOnText = toDate && toDate !== '0' ? formatDateForDisplay(toDate) : 'Current date';
    if (saleAsOnLabel) {
        saleAsOnLabel.textContent = `As on ${asOnText}`;
    }
    if (asOnLabel) {
        asOnLabel.textContent = asOnText;
    }
    setText('skpi-nbd-count', formatInteger(metrics.nbdCount));
    setText('skpi-crr-count', formatInteger(metrics.crrCount));
    setText('skpi-nbd-crr-total', formatInteger(metrics.nbdCrrTotal));
    setText('skpi-ready-dispatch', `${formatNumber(metrics.readyDispatch)} MT`);
    setText('skpi-ready-dispatch-value', formatLakhsValue(metrics.readyDispatchValue));

    renderSummaryGpPieChart(metrics.gpMtMap);
    renderSummaryNbdCrrDonutChart(metrics.nbdCount, metrics.crrCount);
    renderSummaryTop10Clients(G_SummaryReportRows);
    renderSummaryHighGpAchievement(G_SummaryReportRows);
    if (typeof applyRmRateButtonVisibility === 'function') {
        applyRmRateButtonVisibility();
    }
}

function getSummaryNbdCrrType(row) {
    return (row['NBD/CRR'] || row.NBD_CRRType || row.NbdCrr || row['NBD/CRR Type'] || '').toString().trim();
}

function getSummaryNbdCrrPartyRows() {
    const map = new Map();
    (G_SummaryReportRows || []).forEach(function (row) {
        const partyName = (row['Party Name'] || row.PartyName || row.PARTY_NAME || '').toString().trim();
        const nbdCrrType = getSummaryNbdCrrType(row);
        const typeUpper = nbdCrrType.toUpperCase();
        if (!partyName || (!typeUpper.includes('NBD') && !typeUpper.includes('CRR'))) {
            return;
        }
        const key = partyName.toLowerCase() + '|' + typeUpper;
        if (!map.has(key)) {
            map.set(key, {
                'Party Name': partyName,
                'NBD/CRR Type': nbdCrrType
            });
        }
    });
    return Array.from(map.values()).sort(function (a, b) {
        const typeCompare = String(a['NBD/CRR Type']).localeCompare(String(b['NBD/CRR Type']));
        if (typeCompare !== 0) return typeCompare;
        return String(a['Party Name']).localeCompare(String(b['Party Name']));
    });
}

function renderSummaryNbdCrrPartyTable() {
    const header = document.getElementById('summaryNbdCrrPartyTableHeader');
    const body = document.getElementById('summaryNbdCrrPartyTableBody');
    if (!header || !body) return;

    const rows = getSummaryNbdCrrPartyRows();
    if (!rows.length) {
        header.innerHTML = '';
        body.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No NBD / CRR party data available</td></tr>';
        const pager = document.getElementById('paginator-summaryNbdCrrPartyTable');
        if (pager) pager.innerHTML = '';
        return;
    }

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable(
            'summaryNbdCrrPartyTableHeader',
            'summaryNbdCrrPartyTableBody',
            rows,
            false,
            [],
            ['Party Name', 'NBD/CRR Type'],
            [],
            [],
            [],
            [],
            {
                'Party Name': 'left',
                'NBD/CRR Type': 'center'
            },
            true
        );
        return;
    }

    header.innerHTML = '<tr><th>Party Name</th><th>NBD/CRR Type</th></tr>';
    body.innerHTML = rows.map(function (row) {
        return `<tr><td>${escapeHtml(row['Party Name'])}</td><td class="text-center">${escapeHtml(row['NBD/CRR Type'])}</td></tr>`;
    }).join('');
}

function openSummaryNbdCrrPartyModal() {
    renderSummaryNbdCrrPartyTable();
    const modalEl = document.getElementById('summaryNbdCrrPartyModal');
    if (!modalEl) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

function initSummaryNbdCrrPartyModal() {
    const btn = document.getElementById('btnSummaryNbdCrrParties');
    if (btn && !btn.dataset.nbdPartyBound) {
        btn.dataset.nbdPartyBound = 'Y';
        btn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openSummaryNbdCrrPartyModal();
        });
    }

    const modalEl = document.getElementById('summaryNbdCrrPartyModal');
    if (modalEl && !modalEl.dataset.nbdPartyBound) {
        modalEl.dataset.nbdPartyBound = 'Y';
        modalEl.addEventListener('shown.bs.modal', renderSummaryNbdCrrPartyTable);
    }
}

function parseSummaryGpPercent(row) {
    const raw = row['GP%'] || row['GP %'] || row.GPPercent || row.GPPer || row['Gross Profit %'] || row.GrossProfitPct;
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) {
        return num;
    }
    return null;
}

function aggregateTop10Clients(rows) {
    const partyMap = new Map();

    (rows || []).forEach(function (row) {
        const party = (row['Party Name'] || row.PartyName || row.PARTY_NAME || '').toString().trim();
        if (!party) return;

        const weight = parseFloat(row['Weight'] || row.weight || row.QtyMT || 0) || 0;
        const gpPct = parseSummaryGpPercent(row);
        const key = party.toLowerCase();
        if (!partyMap.has(key)) {
            partyMap.set(key, { partyName: party, saleMt: 0, gpPctSum: 0, gpPctCount: 0, gpLabel: (row['GP'] || row.GP || '').toString() });
        }
        const item = partyMap.get(key);
        item.saleMt += weight;
        if (gpPct !== null) {
            item.gpPctSum += gpPct;
            item.gpPctCount += 1;
        }
    });

    return Array.from(partyMap.values())
        .sort((a, b) => b.saleMt - a.saleMt)
        .slice(0, 10)
        .map(function (item) {
            return {
                partyName: item.partyName,
                saleMt: item.saleMt,
                gpPct: item.gpPctCount > 0 ? (item.gpPctSum / item.gpPctCount) : null,
                gpLabel: item.gpLabel
            };
        });
}

function renderSummaryTop10Clients(rows) {
    const tbody = document.getElementById('summaryTop10ClientsBody');
    if (!tbody) return;

    const items = aggregateTop10Clients(rows);
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(function (item, index) {
        const gpText = item.gpPct !== null ? `${item.gpPct.toFixed(2)}%` : escapeHtml(item.gpLabel || '-');
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="client-name">${escapeHtml(item.partyName)}</td>
                <td class="text-end">${formatNumber(item.saleMt)}</td>
                <td class="text-end">${gpText}</td>
            </tr>
        `;
    }).join('');
}

function aggregateHighGpAchievement(rows) {
    let highGpSale = 0;
    let totalSale = 0;
    const manMap = new Map();

    (rows || []).forEach(function (row) {
        const weight = parseFloat(row['Weight'] || row.weight || row.QtyMT || 0) || 0;
        const manifested = parseFloat(row['Manifestation'] || row.Manifestation || 0) || 0;
        const gpCategory = categorizeGpForSummary(row['GP'] || row.GP);
        const marketingMan = (row['Marketing Man'] || row.MarketingMan || row['MGKT Person'] || row.Person || 'Unknown').toString().trim() || 'Unknown';
        const isHighGp = gpCategory === 'superHigh' || gpCategory === 'high';

        totalSale += weight;
        if (isHighGp) highGpSale += weight;

        if (!manMap.has(marketingMan)) {
            manMap.set(marketingMan, { highGpSale: 0, totalSale: 0, manifested: 0 });
        }
        const man = manMap.get(marketingMan);
        man.totalSale += weight;
        man.manifested += manifested;
        if (isHighGp) man.highGpSale += weight;
    });

    const achievedPct = totalSale > 0 ? (highGpSale / totalSale) * 100 : 0;
    const marketingRows = Array.from(manMap.entries())
        .map(function ([marketingMan, data]) {
            const achieved = data.totalSale > 0 ? (data.highGpSale / data.totalSale) * 100 : 0;
            return {
                marketingMan,
                achieved,
                manifested: data.manifested,
                status: achieved >= HIGH_GP_SALE_TARGET_PCT ? 'Achieved' : 'Not Achieved'
            };
        })
        .sort((a, b) => b.achieved - a.achieved);

    return { highGpSale, totalSale, achievedPct, marketingRows };
}

function renderSummaryHighGpGauge(achievedPct) {
    const meterArc = document.getElementById('summaryHighGpMeterArc');
    const valueEl = document.getElementById('summaryHighGpGaugeValue');
    const statusEl = document.getElementById('summaryHighGpGaugeStatus');
    const achieved = Math.max(0, achievedPct || 0);
    const isAchieved = achieved >= HIGH_GP_SALE_TARGET_PCT;
    const meterLength = 251.3;
    const shown = Math.min(achieved, 100);

    if (valueEl) {
        valueEl.textContent = `${achieved.toFixed(0)}%`;
        valueEl.classList.toggle('not-achieved', !isAchieved);
    }
    if (statusEl) {
        statusEl.textContent = isAchieved ? 'Achieved' : 'Not Achieved';
        statusEl.classList.toggle('not-achieved', !isAchieved);
    }
    if (meterArc) {
        meterArc.classList.toggle('not-achieved', !isAchieved);
        meterArc.style.strokeDasharray = String(meterLength);
        meterArc.style.strokeDashoffset = String(meterLength - ((shown / 100) * meterLength));
    }
}

function renderSummaryHighGpManTable(marketingRows) {
    const table = document.querySelector('.summary-highgp-table');
    const tbody = document.getElementById('summaryHighGpManBody');
    if (!tbody) return;

    if (table) {
        const thead = table.querySelector('thead');
        if (thead) {
            thead.innerHTML = `
                <tr>
                    <th>Marketing Man</th>
                    <th class="text-end">Achieved (%)</th>
                    <th>Status</th>
                </tr>
            `;
        }
    }

    if (!marketingRows || marketingRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = marketingRows.map(function (row) {
        const statusClass = row.status === 'Achieved' ? 'achieved' : 'not-achieved';
        return `
            <tr>
                <td>${escapeHtml(row.marketingMan)}</td>
                <td class="text-end">${row.achieved.toFixed(0)}%</td>
                <td class="summary-highgp-status ${statusClass}">${row.status}</td>
            </tr>
        `;
    }).join('');
}

function renderSummaryHighGpAchievement(rows) {
    const data = aggregateHighGpAchievement(rows);
    renderSummaryHighGpGauge(data.achievedPct);
    renderSummaryHighGpManTable(data.marketingRows);
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
            fromDate: resolveFilterDate(filterValues.dateRange?.fromDate, fromDate),
            toDate: resolveFilterDate(filterValues.dateRange?.toDate, toDate)
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

function getCurrentMonthToDateRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const urlParams = new URLSearchParams(window.location.search);
    const rangeParam = (urlParams.get('range') || '').toLowerCase();

    if (rangeParam === 'thisyear') {
        const fyStartYear = (month >= 3) ? year : (year - 1);
        return {
            fromDate: `${fyStartYear}-04-01`,
            toDate: `${fyStartYear + 1}-03-31`
        };
    }

    const mm = String(month + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return {
        fromDate: `${year}-${mm}-01`,
        toDate: `${year}-${mm}-${dd}`
    };
}

function applyDefaultDateRangeToFilter(filterPanel) {
    const range = getCurrentMonthToDateRange();
    fromDate = range.fromDate;
    toDate = range.toDate;

    const dateRangeEl = filterPanel?.shadowRoot?.getElementById('dateRange');
    if (dateRangeEl && typeof dateRangeEl.setRange === 'function') {
        dateRangeEl.setRange({ fromDate: range.fromDate, toDate: range.toDate });
        console.log(`Setting current month-to-date range: ${range.fromDate} to ${range.toDate}`);
        return true;
    }

    console.warn('DateRange element not found in shadow DOM');
    return false;
}

function resolveFilterDate(filterValue, fallbackValue) {
    if (filterValue && filterValue !== '0') {
        return filterValue;
    }
    if (fallbackValue && fallbackValue !== '0') {
        return fallbackValue;
    }
    return '0';
}

// Helper function to format date for display
function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr === '0') return '';
    try {
        const parts = String(dateStr).split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const monthIndex = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
            if (!Number.isNaN(year) && monthIndex >= 0 && monthIndex <= 11 && !Number.isNaN(day)) {
                return `${day} ${monthNames[monthIndex]} ${year}`;
            }
        }
        const date = new Date(dateStr);
        const day = date.getDate();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];
        return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
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
            renderGPWiseSummary({ manageLoader: false });
            return;
        }

        G_SummaryReportRows = parsed.rows;
        const metrics = aggregateSummaryMetrics(parsed.rows, parsed.summaryRow);
        renderSummaryDashboard(metrics);
        renderGPWiseSummary({ manageLoader: false });
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching summary report data:', err);
        clearSummaryDashboard();
        renderGPWiseSummary({ manageLoader: false });
    });
}

const PARTY_SCORE_RANGES = [
    { key: 'veryPoor', min: 0, max: 15, label: '0 - 15 (Very Poor)', color: '#e74a3b' },
    { key: 'poor', min: 15, max: 20, label: '15 - 20 (Poor)', color: '#e67e22' },
    { key: 'average', min: 20, max: 25, label: '20 - 25 (Average)', color: '#f6c23e' },
    { key: 'good', min: 25, max: 30, label: '25 - 30 (Good)', color: '#1cc88a' },
    { key: 'veryGood', min: 30, max: 35, label: '30 - 35 (Very Good)', color: '#4e73df' },
    { key: 'excellent', min: 35, max: 40, label: '35 - 40 (Excellent)', color: '#6f42c1' }
];

const PARTY_SCORE_CATEGORY_BY_RANGE = {
    veryPoor: { label: 'Poor', css: 'ps-badge-poor' },
    poor: { label: 'Needs Attention', css: 'ps-badge-attention' },
    average: { label: 'Average', css: 'ps-badge-average' },
    good: { label: 'Good', css: 'ps-badge-good' },
    veryGood: { label: 'Very Good', css: 'ps-badge-verygood' },
    excellent: { label: 'Excellent', css: 'ps-badge-excellent' }
};

function isClientRatingActive(row) {
    const raw = String(row.IsActive ?? row.Isactive ?? row['Is Active'] ?? 'N').trim().toUpperCase();
    return raw === 'Y' || raw === 'YES' || raw === '1' || raw === 'TRUE';
}

function parseClientRatingMaster(response) {
    let rows = [];
    if (Array.isArray(response)) {
        rows = Array.isArray(response[0]) ? (response[0] || []) : response;
    } else if (response && (response.Table || response.Table1)) {
        rows = response.Table || response.Table1 || [];
    }
    return rows.map(function (row) {
        const code = parseInt(row.Code ?? row.code ?? row.CODE ?? 0, 10) || 0;
        const desp = String(row.Desp ?? row.desp ?? row.Description ?? row.RatingName ?? '').trim();
        const maxValue = parseFloat(row.MaxValue ?? row.Maxvalue ?? row.maxValue ?? 0) || 0;
        return {
            code: code,
            desp: desp,
            maxValue: maxValue,
            isActive: isClientRatingActive(row)
        };
    }).filter(function (item) {
        return item.code >= 1 && item.code <= 10;
    }).sort(function (a, b) {
        return a.code - b.code;
    });
}

function getVisibleClientRatings() {
    return (G_ClientRatingMaster || []).filter(function (item) {
        return item.isActive;
    });
}

function getPartyScoreMaxTotal() {
    const ratings = getVisibleClientRatings();
    const total = ratings.reduce(function (sum, item) {
        return sum + (Number(item.maxValue) || 0);
    }, 0);
    return total > 0 ? total : 40;
}

function getPartyGoodScoreThreshold() {
    return (getPartyScoreMaxTotal() * 28) / 40;
}

function formatPartyScoreBound(value) {
    const num = Number(value) || 0;
    return Math.abs(num - Math.round(num)) < 0.05 ? String(Math.round(num)) : num.toFixed(1);
}

function getClientRatingColumnName(rating) {
    return (rating && rating.desp) ? rating.desp : (`Parameter ${rating.code}`);
}

function getScaledPartyScoreRanges() {
    const max = getPartyScoreMaxTotal();
    const scale = max > 0 ? (max / 40) : 1;
    return PARTY_SCORE_RANGES.map(function (range) {
        const min = range.min * scale;
        const maxVal = range.max * scale;
        const match = (range.label || '').match(/\(([^)]+)\)/);
        const name = match ? match[1] : range.key;
        return {
            ...range,
            min: min,
            max: maxVal,
            label: `${formatPartyScoreBound(min)} - ${formatPartyScoreBound(maxVal)} (${name})`
        };
    });
}

function updatePartyScoreMaxLabels() {
    const maxText = formatPartyScoreBound(getPartyScoreMaxTotal());
    const thresholdText = formatPartyScoreBound(getPartyGoodScoreThreshold());

    const rangeHeader = document.getElementById('psScoreRangeHeader');
    if (rangeHeader) rangeHeader.textContent = `Score Range (out of ${maxText})`;

    document.querySelectorAll('.ps-score-max-label').forEach(function (el) {
        el.textContent = maxText;
    });

    const bar = document.getElementById('psPartyWiseScoreBar');
    if (bar) bar.textContent = `Party Wise Average Score (Out of ${maxText})`;

    const goodLabel = document.getElementById('psGoodThresholdLabel');
    if (goodLabel) goodLabel.innerHTML = `Score &gt;= ${thresholdText} (Good &amp; Above)`;

    const attnLabel = document.getElementById('psAttentionThresholdLabel');
    if (attnLabel) attnLabel.innerHTML = `Score &lt; ${thresholdText} (Needs Attention)`;
}

function loadClientRatingMaster() {
    return SalesanalysisASTService.GetSalesAnalysisData('DDL_F_CLIENTRATING', '0', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        G_ClientRatingMaster = parseClientRatingMaster(response);
        updatePartyScoreMaxLabels();
        return G_ClientRatingMaster;
    }).catch(function (error) {
        console.error('Error fetching client rating master:', error);
        if (!Array.isArray(G_ClientRatingMaster)) {
            G_ClientRatingMaster = [];
        }
        updatePartyScoreMaxLabels();
        return G_ClientRatingMaster;
    });
}

function getPartyParameterScores(row) {
    const scores = {};
    for (let i = 1; i <= 10; i++) {
        const raw = row[`Parameter${i}`] ?? row[`parameter${i}`] ?? row[`PARAMETER${i}`] ?? row[`Parameter ${i}`];
        const val = parseFloat(raw);
        scores[i] = Number.isFinite(val) ? val : 0;
    }
    return scores;
}

function getPartyScoreFromParameters(params) {
    const active = getVisibleClientRatings();
    if (active.length) {
        return active.reduce(function (sum, item) {
            return sum + (Number(params[item.code]) || 0);
        }, 0);
    }
    let total = 0;
    for (let i = 1; i <= 10; i++) {
        total += Number(params[i]) || 0;
    }
    return total;
}

function getPartyScoreTableColspan() {
    return 6 + getVisibleClientRatings().length;
}

function getPartyField(row, names) {
    for (let i = 0; i < names.length; i++) {
        const key = names[i];
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
        }
    }
    return '';
}

function getPartyName(row) {
    return String(getPartyField(row, ['Party Name', 'PartyName', 'Parties', 'Dealer Name', 'DealerName']) || '').trim();
}

function getPartyKey(row) {
    const key = getPartyField(row, ['Party ID', 'PartyID', 'Party Code', 'PartyCode', 'Party Name', 'PartyName']);
    return String(key || '').trim().toUpperCase();
}

function getPartySaleMt(row) {
    const direct = parseFloat(getPartyField(row, ['Weight', 'Sale MT', 'SaleMT', 'Sales', 'Total Sale', 'TotalSale', 'Sale'])) || 0;
    if (direct > 0) return direct;

    const gst = String(getPartyField(row, ['Party GST', 'PartyGST', 'GSTNo', 'GSTIN']) || '').trim().toUpperCase();
    const name = getPartyName(row).toUpperCase();
    if (gst && G_PartySaleMap[gst] > 0) return G_PartySaleMap[gst];
    if (name && G_PartySaleMap[name] > 0) return G_PartySaleMap[name];
    return 0;
}

function buildPartySaleMap(summaryRows) {
    const map = {};
    (summaryRows || []).forEach(function (row) {
        const weight = parseFloat(row['Weight'] || row.weight || row.QtyMT || 0) || 0;
        if (!weight) return;

        const name = String(row['Party Name'] || row.PartyName || '').trim().toUpperCase();
        const gst = String(row['Party GST'] || row.PartyGST || row.GSTNo || row.GSTIN || '').trim().toUpperCase();
        if (name) map[name] = (map[name] || 0) + weight;
        if (gst) map[gst] = (map[gst] || 0) + weight;
    });
    return map;
}

function getPartyTotalScore(row, params) {
    return getPartyScoreFromParameters(params || getPartyParameterScores(row || {}));
}

function detectPartyScoreScale(rows) {
    const maxTotal = getPartyScoreMaxTotal();
    let max = 0;
    (rows || []).forEach(function (row) {
        const score = getPartyTotalScore(row, getPartyParameterScores(row));
        if (score > max) max = score;
    });
    return max > maxTotal ? 100 : maxTotal;
}

function toPartyScore40(rawScore, scale) {
    const maxTotal = getPartyScoreMaxTotal();
    const score = Number(rawScore) || 0;
    if (scale === 100) {
        return Math.max(0, Math.min(maxTotal, (score / 100) * maxTotal));
    }
    return Math.max(0, Math.min(maxTotal, score));
}

function toPartyScore100(rawScore, scale) {
    const maxTotal = getPartyScoreMaxTotal();
    const score = Number(rawScore) || 0;
    if (scale === 100) {
        return Math.max(0, Math.min(100, score));
    }
    return Math.max(0, Math.min(100, maxTotal > 0 ? (score / maxTotal) * 100 : 0));
}

function getPartyScoreRangeKey(scoreValue) {
    const score = Number(scoreValue) || 0;
    const ranges = getScaledPartyScoreRanges();
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const isLast = i === ranges.length - 1;
        if (score > range.min && score <= range.max) {
            return range.key;
        }
        if (i === 0 && score >= range.min && score <= range.max) {
            return range.key;
        }
        if (isLast && score > range.max) {
            return range.key;
        }
    }
    return ranges[0] ? ranges[0].key : PARTY_SCORE_RANGES[0].key;
}

function formatPartyMt(value) {
    return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatPartyScore(value) {
    const num = Number(value || 0);
    if (!isFinite(num)) return '0';
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    return parseFloat(num.toFixed(2)).toString();
}

function buildPartyScoreLastMonthMap(rows) {
    const scale = detectPartyScoreScale(rows);
    const map = {};
    (rows || []).forEach(function (row) {
        const key = getPartyKey(row);
        if (!key) return;
        const existing = map[key];
        const sale = getPartySaleMt(row);
        const apiScore = getPartyTotalScore(row, getPartyParameterScores(row));
        const score100 = toPartyScore100(apiScore, scale);
        if (!existing) {
            map[key] = { score100: score100, apiScore: apiScore, sale: sale };
            return;
        }
        existing.sale += sale;
        existing.score100 = Math.max(existing.score100, score100);
        existing.apiScore = Math.max(existing.apiScore || 0, apiScore);
    });
    return map;
}

function aggregatePartyScoringRows(rows) {
    const scale = detectPartyScoreScale(rows);
    const partyMap = new Map();

    (rows || []).forEach(function (row) {
        const key = getPartyKey(row) || getPartyName(row).toUpperCase();
        if (!key) return;

        const params = getPartyParameterScores(row);
        const apiScore = getPartyTotalScore(row, params);
        const score100 = toPartyScore100(apiScore, scale);
        const gst = String(getPartyField(row, ['Party GST', 'PartyGST', 'GSTNo', 'GSTIN']) || '').trim().toUpperCase();
        const existing = partyMap.get(key);
        if (!existing) {
            partyMap.set(key, {
                key: key,
                partyName: getPartyName(row) || key,
                gst: gst,
                sale: 0,
                apiScore: apiScore,
                score100: score100,
                score40: toPartyScore40(apiScore, scale),
                parameters: params
            });
            return;
        }
        if (gst && !existing.gst) existing.gst = gst;
        if (apiScore > (existing.apiScore || 0)) {
            existing.apiScore = apiScore;
            existing.score100 = score100;
            existing.score40 = toPartyScore40(apiScore, scale);
            existing.parameters = params;
        }
    });

    partyMap.forEach(function (party) {
        const nameKey = String(party.partyName || '').trim().toUpperCase();
        party.sale = G_PartySaleMap[party.gst] || G_PartySaleMap[party.key] || G_PartySaleMap[nameKey] || 0;
    });

    const parties = Array.from(partyMap.values()).map(function (party) {
        const rangeKey = getPartyScoreRangeKey(party.apiScore);
        return {
            ...party,
            rangeKey: rangeKey,
            category: PARTY_SCORE_CATEGORY_BY_RANGE[rangeKey]
        };
    }).sort(function (a, b) {
        if ((b.apiScore || 0) !== (a.apiScore || 0)) return (b.apiScore || 0) - (a.apiScore || 0);
        return b.sale - a.sale;
    });

    const goodThreshold = getPartyGoodScoreThreshold();
    const rangeStats = getScaledPartyScoreRanges().map(function (range) {
        return { ...range, sale: 0, parties: 0, sellingParties: 0 };
    });
    const rangeIndex = {};
    rangeStats.forEach(function (range, idx) { rangeIndex[range.key] = idx; });

    let totalSale = 0;
    let sellingParties = 0;
    let totalScore = 0;
    let topScore = 0;
    let lowScore = parties.length ? Number.POSITIVE_INFINITY : 0;
    let goodCount = 0;

    parties.forEach(function (party) {
        totalSale += party.sale;
        totalScore += (party.apiScore || 0);
        if ((party.apiScore || 0) > topScore) topScore = party.apiScore || 0;
        if ((party.apiScore || 0) < lowScore) lowScore = party.apiScore || 0;
        if ((party.apiScore || 0) >= goodThreshold) goodCount += 1;
        const idx = rangeIndex[party.rangeKey];
        if (idx !== undefined) {
            rangeStats[idx].sale += party.sale;
            rangeStats[idx].parties += 1;
            if (party.sale > 0) {
                rangeStats[idx].sellingParties = (rangeStats[idx].sellingParties || 0) + 1;
                sellingParties += 1;
            }
        }
    });

    return {
        parties: parties,
        rangeStats: rangeStats,
        totalSale: totalSale,
        sellingParties: sellingParties,
        totalParties: parties.length,
        avgScore: parties.length ? (totalScore / parties.length) : 0,
        topScore: topScore,
        lowScore: parties.length ? lowScore : 0,
        goodCount: goodCount,
        attentionCount: parties.length - goodCount
    };
}

function clearPartyScoringDashboard() {
    G_PartyScoringRows = [];
    G_PartyScoringLastMonthMap = {};
    G_PartySaleMap = {};
    updatePartyScoreMaxLabels();

    if (partyScoreDonutChartInstance) {
        try { partyScoreDonutChartInstance.destroy(); } catch (e) { /* ignore */ }
        partyScoreDonutChartInstance = null;
    }

    const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('psDonutTotalSale', '0 MT');
    setText('psDonutTotalParties', '(0 Parties with Sale)');
    setText('psRangeTotalSale', '0');
    setText('psRangeTotalSellingParties', '0');
    setText('psRangeTotalParties', '0');
    setText('psAvgScore', '0.00');
    setText('psTopScore', '0.00');
    setText('psLowScore', '0.00');
    setText('psGoodCount', '0');
    setText('psGoodPct', '0.00%');
    setText('psAttentionCount', '0');
    setText('psAttentionPct', '0.00%');

    const rangeBody = document.getElementById('psScoreRangeBody');
    if (rangeBody) {
        rangeBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
    }
    const partyHeader = document.getElementById('partyScoreTableHeader');
    const partyBody = document.getElementById('partyScoreTableBody');
    const partyPager = document.getElementById('paginator-partyScoreTable');
    if (partyHeader) partyHeader.innerHTML = '';
    if (partyBody) {
        partyBody.innerHTML = `<tr><td colspan="${getPartyScoreTableColspan()}" class="text-center text-muted">No data available</td></tr>`;
    }
    if (partyPager) partyPager.innerHTML = '';
}

function renderPartyScoreRangeTable(rangeStats, totalSale, sellingParties, totalParties) {
    const tbody = document.getElementById('psScoreRangeBody');
    if (!tbody) return;

    tbody.innerHTML = rangeStats.map(function (range) {
        return `<tr>
            <td><span class="ps-dot" style="background:${range.color}"></span>${escapeHtml(range.label)}</td>
            <td class="text-end">${formatPartyMt(range.sale)}</td>
            <td class="text-end">${formatInteger(range.sellingParties || 0)}</td>
            <td class="text-end">${formatInteger(range.parties)}</td>
        </tr>`;
    }).join('');

    const saleEl = document.getElementById('psRangeTotalSale');
    const sellingEl = document.getElementById('psRangeTotalSellingParties');
    const partyEl = document.getElementById('psRangeTotalParties');
    if (saleEl) saleEl.textContent = formatPartyMt(totalSale);
    if (sellingEl) sellingEl.textContent = formatInteger(sellingParties);
    if (partyEl) partyEl.textContent = formatInteger(totalParties);
}

function renderPartyScoreDonutChart(rangeStats, totalSale, totalParties) {
    const canvas = document.getElementById('partyScoreDonutChart');
    const saleEl = document.getElementById('psDonutTotalSale');
    const partyEl = document.getElementById('psDonutTotalParties');
    if (saleEl) saleEl.textContent = `${formatPartyMt(totalSale)} MT`;
    if (partyEl) partyEl.textContent = `(${formatInteger(totalParties)} Parties with Sale)`;
    if (!canvas) return;

    if (partyScoreDonutChartInstance) {
        try { partyScoreDonutChartInstance.destroy(); } catch (e) { /* ignore */ }
        partyScoreDonutChartInstance = null;
    }

    const visible = rangeStats.filter(function (range) { return range.sale > 0; });
    if (visible.length === 0) return;

    partyScoreDonutChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: visible.map(function (range) { return range.label; }),
            datasets: [{
                data: visible.map(function (range) { return range.sale; }),
                backgroundColor: visible.map(function (range) { return range.color; }),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '64%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const pct = totalSale > 0 ? ((value / totalSale) * 100).toFixed(2) : '0.00';
                            return `${context.label}: ${formatPartyMt(value)} MT (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            }
        }
    });
}

function renderPartyScoreSummaryKpis(summary) {
    const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('psAvgScore', formatPartyScore(summary.avgScore));
    setText('psTopScore', formatPartyScore(summary.topScore));
    setText('psLowScore', formatPartyScore(summary.lowScore));

    const goodPct = summary.totalParties > 0 ? (summary.goodCount / summary.totalParties) * 100 : 0;
    const attentionPct = summary.totalParties > 0 ? (summary.attentionCount / summary.totalParties) * 100 : 0;
    setText('psGoodCount', formatInteger(summary.goodCount));
    setText('psGoodPct', `${goodPct.toFixed(2)}%`);
    setText('psAttentionCount', formatInteger(summary.attentionCount));
    setText('psAttentionPct', `${attentionPct.toFixed(2)}%`);
}

function getPartyScoreTrendHtml(party) {
    const lastMonth = G_PartyScoringLastMonthMap[party.key];
    if (!lastMonth || lastMonth.apiScore === undefined) {
        return '<span class="ps-trend-flat">-</span>';
    }

    const diff = (party.apiScore || 0) - lastMonth.apiScore;
    if (Math.abs(diff) < 0.005) {
        return '<span class="ps-trend-flat">0.00</span>';
    }
    if (diff > 0) {
        return `<span class="ps-trend-up">↑ ${formatPartyScore(diff)}</span>`;
    }
    return `<span class="ps-trend-down">↓ ${formatPartyScore(diff)}</span>`;
}

function getPartyScoreCategoryColumnIndex() {
    const headerCells = document.querySelectorAll('#partyScoreTableHeader th, #partyScoreTableHeader td');
    for (let i = 0; i < headerCells.length; i++) {
        const text = (headerCells[i].textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (text.indexOf('score category') !== -1) {
            return i + 1;
        }
    }
    return getPartyScoreTableColspan();
}

function decoratePartyScoreCategoryCells() {
    const categoryCss = {
        'Excellent': 'ps-badge-excellent',
        'Very Good': 'ps-badge-verygood',
        'Good': 'ps-badge-good',
        'Average': 'ps-badge-average',
        'Needs Attention': 'ps-badge-attention',
        'Poor': 'ps-badge-poor'
    };

    const colIndex = getPartyScoreCategoryColumnIndex();
    document.querySelectorAll(`#partyScoreTableBody td:nth-child(${colIndex})`).forEach(function (td) {
        if (td.querySelector('.ps-badge')) return;
        const label = (td.textContent || '').trim();
        if (!label) return;
        const css = categoryCss[label] || 'ps-badge-average';
        td.innerHTML = `<span class="ps-badge ${css}">${escapeHtml(label)}</span>`;
    });
}

function bindPartyScoreTableDecorate() {
    const tbody = document.getElementById('partyScoreTableBody');
    if (!tbody || tbody.dataset.decorated === '1') return;
    tbody.dataset.decorated = '1';
    const observer = new MutationObserver(function () {
        decoratePartyScoreCategoryCells();
    });
    observer.observe(tbody, { childList: true });
}

function renderPartyWiseScoreTable(parties) {
    const tbody = document.getElementById('partyScoreTableBody');
    const thead = document.getElementById('partyScoreTableHeader');
    if (!tbody || !thead) return;

    bindPartyScoreTableDecorate();
    updatePartyScoreMaxLabels();

    const visibleRatings = getVisibleClientRatings();
    const maxTotal = getPartyScoreMaxTotal();
    const totalScoreColumn = `Total Score (Out of ${formatPartyScoreBound(maxTotal)})`;
    const colspan = getPartyScoreTableColspan();

    if (!parties.length) {
        thead.innerHTML = '';
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted">No data available</td></tr>`;
        const pager = document.getElementById('paginator-partyScoreTable');
        if (pager) pager.innerHTML = '';
        return;
    }

    const rows = parties.map(function (party, index) {
        const category = party.category || { label: '-' };
        const params = party.parameters || {};
        const row = {
            'S.No.': index + 1,
            'Party Name': party.partyName,
            'Total Sale (MT)': formatPartyMt(party.sale)
        };
        visibleRatings.forEach(function (rating) {
            row[getClientRatingColumnName(rating)] = formatPartyScore(params[rating.code] || 0);
        });
        row[totalScoreColumn] = formatPartyScore(party.apiScore);
        row['Score %'] = `${formatPartyScore(maxTotal > 0 ? ((party.apiScore || 0) / maxTotal) * 100 : 0)}%`;
        row['Score Category'] = category.label || '-';
        return row;
    });

    const alignment = {
        'S.No.': 'right',
        'Party Name': 'left',
        'Total Sale (MT)': 'right',
        [totalScoreColumn]: 'right',
        'Score %': 'right',
        'Score Category': 'center'
    };
    const numericFilterColumn = visibleRatings.map(getClientRatingColumnName).concat([totalScoreColumn]);
    visibleRatings.forEach(function (rating) {
        alignment[getClientRatingColumnName(rating)] = 'right';
    });

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable(
            'partyScoreTableHeader',
            'partyScoreTableBody',
            rows,
            false,
            [],
            ['Party Name', 'Score Category'],
            numericFilterColumn,
            [],
            [],
            [],
            alignment,
            true
        );
        decoratePartyScoreCategoryCells();
        return;
    }

    const headerCols = ['S.No.', 'Party Name', 'Total Sale (MT)']
        .concat(visibleRatings.map(getClientRatingColumnName))
        .concat([totalScoreColumn, 'Score %', 'Score Category']);
    thead.innerHTML = `<tr>${headerCols.map(function (col) { return `<th>${escapeHtml(col)}</th>`; }).join('')}</tr>`;
    tbody.innerHTML = rows.map(function (row) {
        const cssMap = {
            'Excellent': 'ps-badge-excellent',
            'Very Good': 'ps-badge-verygood',
            'Good': 'ps-badge-good',
            'Average': 'ps-badge-average',
            'Needs Attention': 'ps-badge-attention',
            'Poor': 'ps-badge-poor'
        };
        const css = cssMap[row['Score Category']] || 'ps-badge-average';
        const paramCells = visibleRatings.map(function (rating) {
            return `<td class="ps-num">${row[getClientRatingColumnName(rating)]}</td>`;
        }).join('');
        return `<tr>
            <td class="ps-num">${row['S.No.']}</td>
            <td class="ps-name">${escapeHtml(row['Party Name'])}</td>
            <td class="ps-num">${row['Total Sale (MT)']}</td>
            ${paramCells}
            <td class="ps-num">${row[totalScoreColumn]}</td>
            <td class="ps-num">${row['Score %']}</td>
            <td class="ps-center"><span class="ps-badge ${css}">${escapeHtml(row['Score Category'])}</span></td>
        </tr>`;
    }).join('');
}

function renderPartyScoringDashboard() {
    updatePartyScoreMaxLabels();
    const summary = aggregatePartyScoringRows(G_PartyScoringRows);
    renderPartyScoreRangeTable(summary.rangeStats, summary.totalSale, summary.sellingParties, summary.totalParties);
    renderPartyScoreDonutChart(summary.rangeStats, summary.totalSale, summary.sellingParties);
    renderPartyScoreSummaryKpis(summary);
    renderPartyWiseScoreTable(summary.parties);
}

function renderPartyScoring() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    const lastMonthRange = getLastMonthAsOnDateRange(filters.fromDate, filters.toDate);
    const currentPromise = SalesanalysisASTService.GetSalesAnalysisData('PARTY_SCORING', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays);
    const lastMonthPromise = lastMonthRange
        ? SalesanalysisASTService.GetSalesAnalysisData('PARTY_SCORING', filters.dealerCodes, lastMonthRange.fromDate, lastMonthRange.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays)
        : Promise.resolve([]);
    const salePromise = SalesanalysisASTService.GetMultipleTableSalesAnalysisData(
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
    );

    const ratingMasterPromise = loadClientRatingMaster();

    Promise.all([currentPromise, lastMonthPromise, salePromise, ratingMasterPromise]).then(function ([response, lastMonthResponse, saleResponse]) {
        HideLoader();
        G_PartyScoringRows = Array.isArray(response) ? response : [];
        G_PartyScoringLastMonthMap = buildPartyScoreLastMonthMap(Array.isArray(lastMonthResponse) ? lastMonthResponse : []);
        G_PartySaleMap = buildPartySaleMap(parseSummaryReportResponse(saleResponse).rows);

        if (!G_PartyScoringRows.length) {
            console.warn('No party scoring data received');
            clearPartyScoringDashboard();
            return;
        }

        renderPartyScoringDashboard();
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching party scoring data:', err);
        clearPartyScoringDashboard();
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

function getGpFilterCheckboxes() {
    const filterPanel = document.getElementById('filterPanel');
    const wrapper = filterPanel?.shadowRoot?.getElementById('ddlGPlist');
    if (!wrapper) return { checkboxes: [], selectAll: null };
    return {
        checkboxes: Array.from(wrapper.querySelectorAll('.ddlGPlist_chk')),
        selectAll: wrapper.querySelector('#ddlGPlist_all')
    };
}

function isHighGpFilterValue(value) {
    const gp = (value || '').toString().trim().toLowerCase();
    return gp.includes('high') && !gp.includes('super');
}

function isSuperHighGpFilterValue(value) {
    return (value || '').toString().trim().toLowerCase().includes('super');
}

function applyAllGpFilter() {
    const { checkboxes, selectAll } = getGpFilterCheckboxes();
    checkboxes.forEach(function (chk) {
        chk.checked = true;
    });
    if (selectAll) {
        selectAll.checked = true;
    }
}

function applyGoldenCircleDefaultGpFilter() {
    const { checkboxes, selectAll } = getGpFilterCheckboxes();
    if (!checkboxes.length) return;

    checkboxes.forEach(function (chk) {
        chk.checked = isSuperHighGpFilterValue(chk.value) || isHighGpFilterValue(chk.value);
    });
    if (selectAll) {
        selectAll.checked = false;
    }
}

function getDefaultGoldenCircleGpJoined() {
    const { checkboxes } = getGpFilterCheckboxes();
    const defaultCodes = checkboxes
        .map(function (chk) { return chk.value; })
        .filter(function (value) { return isSuperHighGpFilterValue(value) || isHighGpFilterValue(value); });
    return defaultCodes.length ? defaultCodes.join(',') : 'Super High,High';
}

function resolveGoldenCircleGp(gp) {
    if (!gp || gp === '0') {
        return getDefaultGoldenCircleGpJoined();
    }
    return gp;
}

function syncGpFilterForTab(tabTarget) {
    const target = String(tabTarget || '').replace('#', '').toLowerCase();
    if (target === 'goldencircle') {
        applyGoldenCircleDefaultGpFilter();
        return;
    }
    applyAllGpFilter();
}

function renderGoldenCircleClient() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    const goldenCircleGp = resolveGoldenCircleGp(filters.gp);
    SalesanalysisASTService.GetSalesAnalysisData('GOLDEN_CIRCLE', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, goldenCircleGp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No golden circle client data received');
            clearGoldenCircleDashboard();
            return;
        }

        processGoldenCircleData(response);
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching golden circle data:', err);
        clearGoldenCircleDashboard();
    });
}

function setGcText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function clearGoldenCircleDashboard() {
    if (baseSalesPieChartInstance) {
        try { baseSalesPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        baseSalesPieChartInstance = null;
    }
    if (partySharePieChartInstance) {
        try { partySharePieChartInstance.destroy(); } catch (e) { /* ignore */ }
        partySharePieChartInstance = null;
    }

    const gpSalesBody = document.getElementById('gcGpSalesBody');
    if (gpSalesBody) gpSalesBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>';
    const gpSalesFooter = document.getElementById('gcGpSalesFooter');
    if (gpSalesFooter) {
        gpSalesFooter.innerHTML = '<tr class="gc-total"><td>Grand Total</td><td class="text-end">0.00</td><td class="text-end">0.00</td><td class="text-end">0.00</td><td class="text-end">0.00</td></tr>';
    }

    const shareBody = document.getElementById('gcMktShareBody');
    if (shareBody) shareBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data available</td></tr>';
    setGcText('gcMktShareTotal', '0 MT');

    const baseLegend = document.getElementById('gcBaseLegend');
    if (baseLegend) baseLegend.innerHTML = '<div class="text-muted">No data available</div>';

    const itemBody = document.getElementById('gcItemShareBody');
    if (itemBody) itemBody.innerHTML = '<div class="text-center text-muted py-3">No data available</div>';

    setGcText('gcKpiSuperHigh', '0.00 MT');
    setGcText('gcKpiSuperHighPct', '0.00% of Total Sale');
    setGcText('gcKpiHigh', '0.00 MT');
    setGcText('gcKpiHighPct', '0.00% of Total Sale');
    setGcText('gcKpiCombo', '0.00 MT');
    setGcText('gcKpiComboPct', '0.00% of Total Sale');
    const gpBody = document.getElementById('gcGpCategoryBody');
    if (gpBody) gpBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
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
    if (baseSalesPieChartInstance) {
        try { baseSalesPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        baseSalesPieChartInstance = null;
    }
    if (partySharePieChartInstance) {
        try { partySharePieChartInstance.destroy(); } catch (e) { /* ignore */ }
        partySharePieChartInstance = null;
    }

    const mgktPersonWeight = new Map();
    const baseWeight = new Map();
    const itemWeight = new Map();
    const gpSale = { superHigh: 0, high: 0, medium: 0, low: 0, other: 0 };
    const gpParties = {
        superHigh: new Set(),
        high: new Set(),
        medium: new Set(),
        low: new Set(),
        other: new Set()
    };
    const gpByParty = new Map();

    (data || []).forEach(function (row) {
        const marketingMan = row['Marketing Man'] || row.MarketingMan || row['MGKT Person'] || 'Unknown';
        const weight = parseFloat(row['Weight'] || row.weight || 0) || 0;
        const itemName = row['Item Name'] || row.ItemName || 'Unknown';
        const baseName = row['Base'] || row.BASE || row['Item Group'] || row.ItemGroup || itemName;
        const partyName = (row['Party Name'] || row.PartyName || '').toString().trim() || 'Unknown';
        const gpKey = categorizeGpForSummary(row['GP'] || row.GP || row.gp);

        mgktPersonWeight.set(marketingMan, (mgktPersonWeight.get(marketingMan) || 0) + weight);
        baseWeight.set(baseName, (baseWeight.get(baseName) || 0) + weight);
        itemWeight.set(itemName, (itemWeight.get(itemName) || 0) + weight);
        gpSale[gpKey] = (gpSale[gpKey] || 0) + weight;
        if (partyName) {
            gpParties[gpKey].add(partyName.toUpperCase());
        }
        if (!gpByParty.has(partyName)) {
            gpByParty.set(partyName, { SuperHigh: 0, High: 0, Medium: 0, Low: 0 });
        }
        const partyGp = gpByParty.get(partyName);
        if (gpKey === 'superHigh') {
            partyGp.SuperHigh += weight;
        } else if (gpKey === 'high') {
            partyGp.High += weight;
        } else if (gpKey === 'medium') {
            partyGp.Medium += weight;
        } else {
            partyGp.Low += weight;
        }
    });

    renderGcMarketingShare(mgktPersonWeight);
    renderBaseSalesPieChart(baseWeight);
    renderGcItemShareBars(itemWeight);
    renderGcGpContribution(gpSale, gpParties);
    renderGcGpSalesGrid(gpByParty);
}

function sortWeightMap(weightMap) {
    return Array.from(weightMap.entries()).sort(function (a, b) { return b[1] - a[1]; });
}

function renderGcGpSalesGrid(gpByParty) {
    const tbody = document.getElementById('gcGpSalesBody');
    const tfoot = document.getElementById('gcGpSalesFooter');
    if (!tbody) return;

    const sorted = Array.from(gpByParty.entries()).sort(function (a, b) {
        const totalA = a[1].SuperHigh + a[1].High + a[1].Medium + a[1].Low;
        const totalB = b[1].SuperHigh + b[1].High + b[1].Medium + b[1].Low;
        return totalB - totalA;
    });

    let totalSuperHigh = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;

    tbody.innerHTML = sorted.map(function ([party, gpData]) {
        totalSuperHigh += gpData.SuperHigh;
        totalHigh += gpData.High;
        totalMedium += gpData.Medium;
        totalLow += gpData.Low;
        return `<tr>
            <td>${escapeHtml(party)}</td>
            <td class="text-end">${formatNumber(gpData.SuperHigh)}</td>
            <td class="text-end">${formatNumber(gpData.High)}</td>
            <td class="text-end">${formatNumber(gpData.Medium)}</td>
            <td class="text-end">${formatNumber(gpData.Low)}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>';

    if (tfoot) {
        tfoot.innerHTML = `<tr class="gc-total">
            <td>Grand Total</td>
            <td class="text-end">${formatNumber(totalSuperHigh)}</td>
            <td class="text-end">${formatNumber(totalHigh)}</td>
            <td class="text-end">${formatNumber(totalMedium)}</td>
            <td class="text-end">${formatNumber(totalLow)}</td>
        </tr>`;
    }
}

function renderGcMarketingShare(mgktPersonWeight) {
    const tbody = document.getElementById('gcMktShareBody');
    const sorted = sortWeightMap(mgktPersonWeight);
    const total = sorted.reduce(function (sum, item) { return sum + item[1]; }, 0);
    const colors = generateColors(sorted.length);
    setGcText('gcMktShareTotal', `${formatNumber(total)} MT`);

    if (tbody) {
        tbody.innerHTML = sorted.map(function ([person, weight], index) {
            const pct = total > 0 ? ((weight / total) * 100).toFixed(2) : '0.00';
            return `<tr>
                <td><span class="gc-dot" style="background:${colors[index]}"></span> ${escapeHtml(person)}</td>
                <td class="text-end">${formatNumber(weight)}</td>
                <td class="text-end">${pct}%</td>
            </tr>`;
        }).join('') || '<tr><td colspan="3" class="text-center text-muted">No data available</td></tr>';
    }

    const canvas = document.getElementById('gcMktShareDonutChart');
    if (!canvas || total <= 0) return;

    partySharePieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: sorted.map(function (item) { return item[0]; }),
            datasets: [{
                data: sorted.map(function (item) { return item[1]; }),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed || 0;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
                            return `${context.label}: ${formatNumber(value)} MT (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderBaseSalesPieChart(baseWeight) {
    const sorted = sortWeightMap(baseWeight);
    const total = sorted.reduce(function (sum, item) { return sum + item[1]; }, 0);
    const colors = generateColors(sorted.length);
    const legend = document.getElementById('gcBaseLegend');
    if (legend) {
        legend.innerHTML = sorted.map(function ([name, weight], index) {
            const pct = total > 0 ? ((weight / total) * 100).toFixed(2) : '0.00';
            return `<div class="gc-legend-row">
                <span class="gc-sq" style="background:${colors[index]}"></span>
                <span>${escapeHtml(name)}</span>
                <span class="ms-auto">${pct}%</span>
            </div>`;
        }).join('') || '<div class="text-muted">No data available</div>';
    }

    const canvas = document.getElementById('baseSalesPieChart');
    if (!canvas || total <= 0) return;

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    baseSalesPieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: sorted.map(function (item) { return item[0]; }),
            datasets: [{
                data: sorted.map(function (item) { return item[1]; }),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
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
                            const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
                            return `${context.label}: ${formatNumber(value)} MT (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 10 },
                    formatter: function (value) {
                        const pct = total > 0 ? (value / total) * 100 : 0;
                        return pct >= 8 ? `${pct.toFixed(2)}%` : '';
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
}

function renderGcItemShareBars(itemWeight) {
    const box = document.getElementById('gcItemShareBody');
    if (!box) return;

    const sorted = sortWeightMap(itemWeight);
    const total = sorted.reduce(function (sum, item) { return sum + item[1]; }, 0);
    const max = sorted.length ? sorted[0][1] : 0;

    box.innerHTML = sorted.map(function ([name, weight]) {
        const pct = total > 0 ? ((weight / total) * 100).toFixed(2) : '0.00';
        const barPct = max > 0 ? ((weight / max) * 100) : 0;
        return `<div class="gc-bar-row">
            <div>${escapeHtml(name)}</div>
            <div class="gc-bar-track"><div class="gc-bar-fill" style="width:${barPct}%"></div></div>
            <div class="text-end">${formatNumber(weight)}</div>
            <div class="text-end">${pct}%</div>
        </div>`;
    }).join('') || '<div class="text-center text-muted py-3">No data available</div>';
}

function renderGcGpContribution(gpSale, gpParties) {
    const rows = [
        { key: 'superHigh', label: 'Super High GP', icon: 'fa-star', color: '#1cc88a' },
        { key: 'high', label: 'High GP', icon: 'fa-thumbs-up', color: '#e67e22' },
        { key: 'medium', label: 'Medium GP', icon: 'fa-chart-pie', color: '#4e73df' },
        { key: 'low', label: 'Low GP', icon: 'fa-arrow-down', color: '#e74a3b' }
    ];
    const total = rows.reduce(function (sum, row) { return sum + (gpSale[row.key] || 0); }, 0);
    const superHigh = gpSale.superHigh || 0;
    const high = gpSale.high || 0;
    const combo = superHigh + high;

    setGcText('gcKpiSuperHigh', `${formatNumber(superHigh)} MT`);
    setGcText('gcKpiSuperHighPct', `${total > 0 ? ((superHigh / total) * 100).toFixed(2) : '0.00'}% of Total Sale`);
    setGcText('gcKpiHigh', `${formatNumber(high)} MT`);
    setGcText('gcKpiHighPct', `${total > 0 ? ((high / total) * 100).toFixed(2) : '0.00'}% of Total Sale`);
    setGcText('gcKpiCombo', `${formatNumber(combo)} MT`);
    setGcText('gcKpiComboPct', `${total > 0 ? ((combo / total) * 100).toFixed(2) : '0.00'}% of Total Sale`);

    const tbody = document.getElementById('gcGpCategoryBody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(function (row) {
        const sale = gpSale[row.key] || 0;
        const pct = total > 0 ? ((sale / total) * 100).toFixed(2) : '0.00';
        const parties = gpParties[row.key] ? gpParties[row.key].size : 0;
        return `<tr>
            <td><i class="fas ${row.icon} me-1" style="color:${row.color}"></i>${escapeHtml(row.label)}</td>
            <td class="text-end">${formatNumber(sale)}</td>
            <td class="text-end">${pct}%</td>
            <td class="text-end">${formatInteger(parties)}</td>
        </tr>`;
    }).join('');
}

function extractManifestWeekWeightData(response) {
    if (!response) return [];
    if (response.weekWeight || response.WeekWeight) {
        return response.weekWeight || response.WeekWeight || [];
    }
    if (response.Table || response.Table1) {
        return response.Table || response.Table1 || [];
    }
    if (Array.isArray(response) && response.length > 0) {
        if (Array.isArray(response[0])) {
            return response[0] || [];
        }
        return response.filter(function (row) {
            return Object.keys(row || {}).some(function (k) {
                return k.includes('W1') || k.includes('W2') || k.includes('W3') || k.includes('-W') || k.includes(' - W');
            });
        });
    }
    return [];
}

function renderManifestation() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    updateManifestProrataInfo(filters);
    Showloader();

    const lastMonthRange = getLastMonthAsOnDateRange(filters.fromDate, filters.toDate);
    const currentPromise = SalesanalysisASTService.GetMultipleTableSalesAnalysisData('MANIFESTATION', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays);
    const lastMonthPromise = lastMonthRange
        ? SalesanalysisASTService.GetMultipleTableSalesAnalysisData('MANIFESTATION', filters.dealerCodes, lastMonthRange.fromDate, lastMonthRange.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays)
        : Promise.resolve([]);

    Promise.all([currentPromise, lastMonthPromise]).then(function ([response, lastMonthResponse]) {
        HideLoader();

        if (!response) {
            console.warn('No manifestation data received');
            clearManifestationTables();
            return;
        }

        const weekWeightData = extractManifestWeekWeightData(response);
        const lastMonthWeekData = extractManifestWeekWeightData(lastMonthResponse);
        renderWeekWeightTable(weekWeightData);
        renderManifestWeekCompareTable(weekWeightData, lastMonthWeekData);
    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching manifestation data:', err);
        clearManifestationTables();
    });
}

function clearManifestationTables() {
    const weekBody = document.getElementById('weekWeightTableBody');
    const weekHeader = document.getElementById('weekWeightTableHeader');
    if (weekBody) weekBody.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    if (weekHeader) weekHeader.innerHTML = '';

    const compareBody = document.getElementById('mvWeekCompareBody');
    if (compareBody) compareBody.innerHTML = '<tr><td colspan="10" class="text-center">No data available</td></tr>';
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

function getManifestProrataInfo() {
    const filters = GetAllFilters();
    const to = new Date(filters.toDate || toDate);
    const from = new Date(filters.fromDate || fromDate);
    const validTo = isNaN(to.getTime()) ? new Date() : to;
    const validFrom = isNaN(from.getTime()) ? new Date(validTo.getFullYear(), validTo.getMonth(), 1) : from;
    const daysInMonth = new Date(validTo.getFullYear(), validTo.getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, Math.min(validTo.getDate(), daysInMonth));
    const factor = daysInMonth > 0 ? (daysPassed / daysInMonth) : 1;
    return {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        daysPassed: daysPassed,
        daysInMonth: daysInMonth,
        factor: factor
    };
}

function updateManifestProrataInfo(filters) {
    const info = getManifestProrataInfo();
    const periodEl = document.getElementById('mvReportPeriod');
    if (periodEl) {
        periodEl.textContent = `${formatDateForDisplay(filters.fromDate)} to ${formatDateForDisplay(filters.toDate)}`;
    }
    const calcEl = document.getElementById('mvProrataCalc');
    if (calcEl) {
        calcEl.textContent = `Prorata Factor = ${info.daysPassed} / ${info.daysInMonth} = ${(info.factor * 100).toFixed(2)}%`;
    }
}

function getAchievementClass(pct) {
    if (pct >= 100) return 'mv-ach-good';
    if (pct >= 85) return 'mv-ach-avg';
    return 'mv-ach-poor';
}

function getDaysInWeekForWeekLabel(weekLabel) {
    const label = (weekLabel || '').toString().trim();
    const weekMatch = label.match(/W(\d+)/i);
    if (!weekMatch) return 7;

    const weekNumber = parseInt(weekMatch[1], 10);
    const fallbackDateStr = toDate !== '0' ? toDate : fromDate;
    const monthIndex = getMonthIndexFromWeekLabel(weekLabel, fallbackDateStr);
    if (monthIndex === -1) return 7;

    let year = new Date().getFullYear();
    if (fallbackDateStr && fallbackDateStr !== '0') {
        const d = new Date(fallbackDateStr);
        if (!isNaN(d.getTime())) {
            year = d.getFullYear();
        }
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startDay = ((weekNumber - 1) * 7) + 1;
    if (startDay > daysInMonth) return 0;
    const fullWeekDays = Math.min(7, daysInMonth - startDay + 1);

    const to = new Date(fallbackDateStr);
    if (isNaN(to.getTime()) || to.getMonth() !== monthIndex || to.getFullYear() !== year) {
        return fullWeekDays;
    }

    const toDay = to.getDate();
    if (toDay < startDay) return 0;
    if (toDay >= startDay + fullWeekDays - 1) return fullWeekDays;
    return toDay - startDay + 1;
}

function calculateWeeklyManifestTarget(totalManifestTarget, weekLabel) {
    const totalTarget = parseFloat(totalManifestTarget) || 0;
    if (!totalTarget) return 0;

    const fallbackDateStr = fromDate !== '0' ? fromDate : toDate;
    const daysInMonth = getDaysInMonthForWeekLabel(weekLabel, fallbackDateStr);
    const daysInWeek = getDaysInWeekForWeekLabel(weekLabel) || 0;

    if (!daysInMonth || !daysInWeek) return 0;
    return (totalTarget / daysInMonth) * daysInWeek;
}

function getManifestWeekMeta(data) {
    const allKeys = Object.keys(data[0] || {});
    const personKeyOptions = ['MGKT_PERSON', 'MGKT Person', 'Marketing Man', 'MarketingMan', 'Person'];
    const personKey = personKeyOptions.find(function (k) { return allKeys.includes(k); }) || allKeys[0];
    const isSummaryKey = function (k) {
        const l = k.toLowerCase();
        return l.includes('actual total') || l === 'actualtotal' ||
            l.includes('target total') || l === 'targettotal' ||
            l.includes('variance') ||
            l.includes('achievement');
    };
    const actualTotalKey = allKeys.find(function (k) { return k.toLowerCase().includes('actual total') || k.toLowerCase() === 'actualtotal'; });
    const targetTotalKey = allKeys.find(function (k) { return k.toLowerCase().includes('target total') || k.toLowerCase() === 'targettotal'; });
    const weekColumns = allKeys.filter(function (k) { return k !== personKey && !isSummaryKey(k); });
    return { personKey, actualTotalKey, targetTotalKey, weekColumns };
}

function getWeekNumberFromLabel(weekLabel) {
    const match = String(weekLabel || '').match(/W(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
}

function sumManifestWeekActuals(data, weekColumns) {
    const totals = {};
    weekColumns.forEach(function (wk) { totals[wk] = 0; });
    (data || []).forEach(function (row) {
        weekColumns.forEach(function (wk) {
            totals[wk] += parseFloat(row[wk] || 0) || 0;
        });
    });
    return totals;
}

function renderWeekWeightTable(data) {
    const tableHeader = document.getElementById('weekWeightTableHeader');
    const tableBody = document.getElementById('weekWeightTableBody');
    if (!tableHeader || !tableBody) return;

    if (!data || data.length === 0) {
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        return;
    }

    const meta = getManifestWeekMeta(data);
    const weekColumns = meta.weekColumns;
    const prorata = getManifestProrataInfo();
    const headerBg = '#4472C4';
    const subBg = '#5B9BD5';
    const summaryBg = '#365E9A';
    const sepStyle = 'border-left:2px solid rgba(255,255,255,0.4);';

    let row1 = `<tr>`;
    row1 += `<th rowspan="2" style="vertical-align:middle;background-color:${headerBg};">${escapeHtml(meta.personKey)}</th>`;
    row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};${sepStyle}">Actual Total</th>`;
    row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};">Total Manifest Target (prorata)</th>`;
    row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};">Difference</th>`;
    row1 += `<th rowspan="2" class="text-end" style="vertical-align:middle;background-color:${summaryBg};">Mkt Man % Achieved</th>`;
    weekColumns.forEach(function (wk) {
        row1 += `<th colspan="3" class="text-center" style="background-color:${headerBg};${sepStyle}">${escapeHtml(wk)}</th>`;
    });
    row1 += `</tr>`;

    let row2 = `<tr>`;
    weekColumns.forEach(function () {
        row2 += `<th class="text-end" style="background-color:${subBg};${sepStyle}">Actual Sale (MT)</th>`;
        row2 += `<th class="text-end" style="background-color:${subBg};">Achievement %</th>`;
        row2 += `<th class="text-end" style="background-color:${subBg};">Weekly Target (prorata)</th>`;
    });
    row2 += `</tr>`;
    tableHeader.innerHTML = row1 + row2;

    const grandWeekActuals = {};
    const grandWeekTargets = {};
    weekColumns.forEach(function (wk) { grandWeekActuals[wk] = 0; grandWeekTargets[wk] = 0; });
    let grandActualTotal = 0;
    let grandTargetTotal = 0;

    const personRows = data.map(function (row) {
        const actualTotal = parseFloat(row[meta.actualTotalKey] || 0) || 0;
        const rawTargetTotal = parseFloat(row[meta.targetTotalKey] || 0) || 0;
        const targetTotal = rawTargetTotal * prorata.factor;
        const variance = actualTotal - targetTotal;
        const overallAchievement = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;
        grandActualTotal += actualTotal;
        grandTargetTotal += targetTotal;

        const weekCells = weekColumns.map(function (wk) {
            const actualSales = parseFloat(row[wk] || 0) || 0;
            const weekTarget = calculateWeeklyManifestTarget(rawTargetTotal, wk);
            const wkAchievement = weekTarget > 0 ? (actualSales / weekTarget) * 100 : 0;
            grandWeekActuals[wk] += actualSales;
            grandWeekTargets[wk] += weekTarget;
            return { actualSales, weekTarget, wkAchievement };
        });

        return {
            personName: row[meta.personKey] || '',
            actualTotal,
            targetTotal,
            variance,
            overallAchievement,
            weekCells
        };
    });

    const buildWeekCells = function (weekCells) {
        return weekCells.map(function (cell) {
            const cls = getAchievementClass(cell.wkAchievement);
            return `<td class="text-end" style="${sepStyle}">${formatNumber(cell.actualSales)}</td>
                <td class="text-end ${cls}">${cell.wkAchievement.toFixed(2)}%</td>
                <td class="text-end">${formatNumber(cell.weekTarget)}</td>`;
        }).join('');
    };

    const grandVariance = grandActualTotal - grandTargetTotal;
    const grandAchievement = grandTargetTotal > 0 ? (grandActualTotal / grandTargetTotal) * 100 : 0;
    const grandWeekCells = weekColumns.map(function (wk) {
        const gActual = grandWeekActuals[wk] || 0;
        const gTarget = grandWeekTargets[wk] || 0;
        const gAch = gTarget > 0 ? (gActual / gTarget) * 100 : 0;
        return { actualSales: gActual, weekTarget: gTarget, wkAchievement: gAch };
    });

    const buildSummaryCells = function (row) {
        return `<td class="text-end fw-bold" style="${sepStyle}">${formatNumber(row.actualTotal)}</td>
            <td class="text-end fw-bold">${formatNumber(row.targetTotal)}</td>
            <td class="text-end fw-bold">${formatNumber(row.variance)}</td>
            <td class="text-end fw-bold ${getAchievementClass(row.overallAchievement)}">${row.overallAchievement.toFixed(2)}%</td>`;
    };

    let html = personRows.map(function (row) {
        return `<tr>
            <td>${escapeHtml(row.personName)}</td>
            ${buildSummaryCells(row)}
            ${buildWeekCells(row.weekCells)}
        </tr>`;
    }).join('');

    html += `<tr class="mv-total-row">
        <td>Grand Total</td>
        ${buildSummaryCells({ actualTotal: grandActualTotal, targetTotal: grandTargetTotal, variance: grandVariance, overallAchievement: grandAchievement })}
        ${buildWeekCells(grandWeekCells)}
    </tr>`;

    tableBody.innerHTML = html;
}

function renderManifestWeekCompareTable(currentData, lastMonthData) {
    const tbody = document.getElementById('mvWeekCompareBody');
    if (!tbody) return;

    if (!currentData || currentData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No data available</td></tr>';
        return;
    }

    const currentMeta = getManifestWeekMeta(currentData);
    const lastMeta = lastMonthData && lastMonthData.length ? getManifestWeekMeta(lastMonthData) : { weekColumns: [], targetTotalKey: null };
    const currentWeekActuals = sumManifestWeekActuals(currentData, currentMeta.weekColumns);
    const lastWeekActualsByNo = {};
    (lastMeta.weekColumns || []).forEach(function (wk) {
        lastWeekActualsByNo[getWeekNumberFromLabel(wk)] = 0;
    });
    (lastMonthData || []).forEach(function (row) {
        (lastMeta.weekColumns || []).forEach(function (wk) {
            const weekNo = getWeekNumberFromLabel(wk);
            lastWeekActualsByNo[weekNo] = (lastWeekActualsByNo[weekNo] || 0) + (parseFloat(row[wk] || 0) || 0);
        });
    });

    const prorata = getManifestProrataInfo();
    let currentTargetTotal = 0;
    (currentData || []).forEach(function (row) {
        currentTargetTotal += parseFloat(row[currentMeta.targetTotalKey] || 0) || 0;
    });
    let lastTargetTotal = 0;
    (lastMonthData || []).forEach(function (row) {
        lastTargetTotal += parseFloat(row[lastMeta.targetTotalKey] || 0) || 0;
    });

    const currentTotalActual = currentMeta.weekColumns.reduce(function (sum, wk) { return sum + (currentWeekActuals[wk] || 0); }, 0);
    const lastTotalActual = Object.keys(lastWeekActualsByNo).reduce(function (sum, key) { return sum + (lastWeekActualsByNo[key] || 0); }, 0);

    const rows = currentMeta.weekColumns.map(function (wk) {
        const thisActual = currentWeekActuals[wk] || 0;
        const lastActual = (lastWeekActualsByNo[getWeekNumberFromLabel(wk)] || 0) * prorata.factor;
        const weekTarget = calculateWeeklyManifestTarget(currentTargetTotal, wk);
        const lastWeekTarget = calculateWeeklyManifestTarget(lastTargetTotal, wk);
        const thisPct = currentTotalActual > 0 ? (thisActual / currentTotalActual) * 100 : 0;
        const lastPct = lastTotalActual > 0 ? ((lastWeekActualsByNo[getWeekNumberFromLabel(wk)] || 0) / lastTotalActual) * 100 : 0;
        const diff = thisActual - lastActual;
        const vsLastPct = lastActual > 0 ? (diff / lastActual) * 100 : 0;
        const targetPct = weekTarget > 0 ? (thisActual / weekTarget) * 100 : 0;
        const thisAch = weekTarget > 0 ? (thisActual / weekTarget) * 100 : 0;
        const lastAch = lastWeekTarget > 0 ? (lastActual / lastWeekTarget) * 100 : 0;
        return { wk, thisActual, thisPct, lastActual, lastPct, diff, vsLastPct, weekTarget, targetPct, thisAch, lastAch };
    });

    const totals = rows.reduce(function (acc, row) {
        acc.thisActual += row.thisActual;
        acc.lastActual += row.lastActual;
        acc.weekTarget += row.weekTarget;
        return acc;
    }, { thisActual: 0, lastActual: 0, weekTarget: 0 });
    const totalDiff = totals.thisActual - totals.lastActual;
    const totalVsLast = totals.lastActual > 0 ? (totalDiff / totals.lastActual) * 100 : 0;
    const totalThisAch = totals.weekTarget > 0 ? (totals.thisActual / totals.weekTarget) * 100 : 0;
    const totalLastAch = totals.weekTarget > 0 ? (totals.lastActual / totals.weekTarget) * 100 : 0;

    const renderRow = function (label, row, isTotal) {
        return `<tr class="${isTotal ? 'mv-total-row' : ''}">
            <td>${escapeHtml(label)}</td>
            <td class="text-end">${formatNumber(row.thisActual)}</td>
            <td class="text-end">${row.thisPct.toFixed(2)}%</td>
            <td class="text-end">${formatNumber(row.lastActual)}</td>
            <td class="text-end">${formatNumber(row.diff)}</td>
            <td class="text-end ${getAchievementClass(100 + row.vsLastPct)}">${row.vsLastPct.toFixed(2)}%</td>
            <td class="text-end">${formatNumber(row.weekTarget)}</td>
            <td class="text-end">${row.targetPct.toFixed(2)}%</td>
            <td class="text-end ${getAchievementClass(row.thisAch)}">${row.thisAch.toFixed(2)}%</td>
            <td class="text-end ${getAchievementClass(row.lastAch)}">${row.lastAch.toFixed(2)}%</td>
        </tr>`;
    };

    tbody.innerHTML = rows.map(function (row) {
        return renderRow(row.wk, row, false);
    }).join('') + renderRow('Grand Total', {
        thisActual: totals.thisActual,
        thisPct: 100,
        lastActual: totals.lastActual,
        lastPct: 100,
        diff: totalDiff,
        vsLastPct: totalVsLast,
        weekTarget: totals.weekTarget,
        targetPct: 100,
        thisAch: totalThisAch,
        lastAch: totalLastAch
    }, true);
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

const GP_WISE_CATEGORIES = [
    { key: 'SuperHigh', label: 'SUPER HIGH (MT)', cssClass: 'gp-col-superhigh', color: '#224abe' },
    { key: 'High', label: 'HIGH (MT)', cssClass: 'gp-col-high', color: '#1cc88a' },
    { key: 'Medium', label: 'MEDIUM (MT)', cssClass: 'gp-col-medium', color: '#f6c23e' },
    { key: 'Low', label: 'LOW (MT)', cssClass: 'gp-col-low', color: '#e74a3b' }
];

function categorizeGpWiseBucket(gpValue) {
    const gpRaw = (gpValue || '').toString().toUpperCase().trim();
    if (gpRaw.includes('SUPER')) return 'SuperHigh';
    if (gpRaw.includes('HIGH')) return 'High';
    if (gpRaw.includes('LOW')) return 'Low';
    if (gpRaw.includes('MEDIUM') || gpRaw.includes('MED')) return 'Medium';
    return 'Medium';
}

function emptyGpWiseBuckets() {
    return { SuperHigh: 0, High: 0, Medium: 0, Low: 0 };
}

function getGpWiseRowTotal(gpData) {
    return GP_WISE_CATEGORIES.reduce(function (sum, cat) {
        return sum + (gpData[cat.key] || 0);
    }, 0);
}

function formatGpSharePct(value, total) {
    return (total > 0 ? ((value / total) * 100) : 0).toFixed(2) + '%';
}

function clearGPWiseSummaryView() {
    const tbody = document.getElementById('gpWiseTableBody');
    const thead = document.getElementById('gpWiseTableHeader');
    const legend = document.getElementById('summaryGpWiseManLegend');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No data available</td></tr>';
    if (legend) legend.innerHTML = '';
    if (summaryGpWiseManPieChartInstance) {
        try { summaryGpWiseManPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryGpWiseManPieChartInstance = null;
    }
}

function renderGPWiseSummary(options) {
    const manageLoader = !options || options.manageLoader !== false;
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();

    if (manageLoader) {
        Showloader();
    }

    SalesanalysisASTService.GetSalesAnalysisData('GP_WISE_SUMMARY', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType, filters.notPurchaseFromDays).then(function (response) {
        if (manageLoader) {
            HideLoader();
        }

        if (!response || response.length === 0) {
            console.warn('No GP wise summary data received');
            clearGPWiseSummaryView();
            return;
        }

        console.log('GP Wise Summary API Response:', response);
        renderGPWiseSummaryCustomTable(response);
    }).catch(function (err) {
        if (manageLoader) {
            HideLoader();
        }
        console.error('Error fetching GP wise summary data:', err);
        clearGPWiseSummaryView();
    });
}

function renderGPWiseSummaryCustomTable(data) {
    const tbody = document.getElementById('gpWiseTableBody');
    const thead = document.getElementById('gpWiseTableHeader');

    if (!tbody || !thead) {
        console.error('GP Wise table elements not found');
        return;
    }

    const aggregatedData = new Map();

    data.forEach(function (row) {
        const marketingMan = row['Marketing Man'] || row['MarketingMan'] || row['MARKETING MAN'] ||
            row['MGKT Person'] || row['MGKT_PERSON'] || row['Person'] || 'Unknown';
        const weight = parseFloat(row['Weight'] || row['WEIGHT'] || row['weight'] || 0) || 0;
        const gpCategory = categorizeGpWiseBucket(row['GP'] || row['gp']);

        if (!aggregatedData.has(marketingMan)) {
            aggregatedData.set(marketingMan, emptyGpWiseBuckets());
        }

        aggregatedData.get(marketingMan)[gpCategory] += weight;
    });

    const headerGroupCells = GP_WISE_CATEGORIES.map(function (cat) {
        return `<th colspan="2" class="text-center ${cat.cssClass}">${cat.label}</th>`;
    }).join('');
    const headerSubCells = GP_WISE_CATEGORIES.map(function (cat) {
        return `<th class="text-end ${cat.cssClass}">MT</th><th class="text-end ${cat.cssClass}">% of Total (MT)</th>`;
    }).join('');

    thead.innerHTML = `
        <tr>
            <th rowspan="2">MARKETING MAN</th>
            ${headerGroupCells}
            <th rowspan="2" class="text-end">TOTAL (MT)</th>
            <th rowspan="2" class="text-end">% of Total (MT)</th>
        </tr>
        <tr>
            ${headerSubCells}
        </tr>
    `;

    const sorted = Array.from(aggregatedData.entries())
        .sort((a, b) => getGpWiseRowTotal(b[1]) - getGpWiseRowTotal(a[1]));

    const overallGrandTotal = sorted.reduce(function (sum, item) {
        return sum + getGpWiseRowTotal(item[1]);
    }, 0);

    const grandTotals = emptyGpWiseBuckets();
    tbody.innerHTML = '';

    sorted.forEach(function ([marketingMan, gpData]) {
        const rowTotal = getGpWiseRowTotal(gpData);
        const rowShare = formatGpSharePct(rowTotal, overallGrandTotal);

        GP_WISE_CATEGORIES.forEach(function (cat) {
            grandTotals[cat.key] += gpData[cat.key] || 0;
        });

        const gpCells = GP_WISE_CATEGORIES.map(function (cat) {
            const value = gpData[cat.key] || 0;
            return `<td class="text-end">${formatNumber(value)}</td><td class="text-end">${formatGpSharePct(value, rowTotal)}</td>`;
        }).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(marketingMan)}</td>
            ${gpCells}
            <td class="text-end"><strong>${formatNumber(rowTotal)}</strong></td>
            <td class="text-end"><strong>${rowShare}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    const grandGpCells = GP_WISE_CATEGORIES.map(function (cat) {
        const value = grandTotals[cat.key] || 0;
        return `<td class="text-end"><strong>${formatNumber(value)}</strong></td><td class="text-end"><strong>${formatGpSharePct(value, overallGrandTotal)}</strong></td>`;
    }).join('');

    const grandTotalRow = document.createElement('tr');
    grandTotalRow.style.cssText = 'background-color: #d4edda; font-weight: bold; position: sticky; bottom: 0; border-top: 2px solid #333;';
    grandTotalRow.innerHTML = `
        <td><strong>Grand total</strong></td>
        ${grandGpCells}
        <td class="text-end"><strong>${formatNumber(overallGrandTotal)}</strong></td>
        <td class="text-end"><strong>100.00%</strong></td>
    `;
    tbody.appendChild(grandTotalRow);

    renderSummaryGpWiseManPieChart(sorted, overallGrandTotal);
}

function renderSummaryGpWiseManPieChart(sortedRows, overallGrandTotal) {
    const canvas = document.getElementById('summaryGpWiseManPieChart');
    const legend = document.getElementById('summaryGpWiseManLegend');

    if (summaryGpWiseManPieChartInstance) {
        try { summaryGpWiseManPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        summaryGpWiseManPieChartInstance = null;
    }

    if (!canvas) return;

    const pieItems = (sortedRows || [])
        .map(function ([marketingMan, gpData]) {
            return { label: marketingMan, value: getGpWiseRowTotal(gpData) };
        })
        .filter(function (item) { return item.value > 0; });

    if (pieItems.length === 0 || overallGrandTotal <= 0) {
        if (legend) legend.innerHTML = '';
        return;
    }

    const maxSlices = 7;
    let chartItems = pieItems;
    if (pieItems.length > maxSlices) {
        const topItems = pieItems.slice(0, maxSlices - 1);
        const otherValue = pieItems.slice(maxSlices - 1).reduce(function (sum, item) {
            return sum + item.value;
        }, 0);
        chartItems = topItems.concat([{ label: 'Others', value: otherValue }]);
    }

    const colors = generateColors(chartItems.length);

    if (legend) {
        legend.innerHTML = chartItems.map(function (item, index) {
            const pct = formatGpSharePct(item.value, overallGrandTotal);
            return `
                <div class="summary-legend-item">
                    <span class="summary-legend-swatch" style="background:${colors[index]};"></span>
                    <div>
                        <div class="summary-legend-label">${escapeHtml(item.label)}</div>
                        <div class="summary-legend-meta">${formatNumber(item.value)} MT (${pct})</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }

    summaryGpWiseManPieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: chartItems.map(function (item) { return item.label; }),
            datasets: [{
                data: chartItems.map(function (item) { return item.value; }),
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
                            const pct = overallGrandTotal > 0 ? ((value / overallGrandTotal) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${formatNumber(value)} MT (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: function (value) {
                        const pct = overallGrandTotal > 0 ? ((value / overallGrandTotal) * 100).toFixed(0) : '0';
                        return Number(pct) >= 8 ? `${pct}%` : '';
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
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

function formatCaInr(v) {
    return '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getRowField(row, names) {
    if (!row) return undefined;
    for (let i = 0; i < names.length; i++) {
        if (row[names[i]] !== undefined && row[names[i]] !== null && row[names[i]] !== '') {
            return row[names[i]];
        }
    }
    const lowerMap = {};
    Object.keys(row).forEach(function (k) { lowerMap[k.toLowerCase()] = row[k]; });
    for (let i = 0; i < names.length; i++) {
        const val = lowerMap[names[i].toLowerCase()];
        if (val !== undefined && val !== null && val !== '') return val;
    }
    return undefined;
}

function flattenSalesAnalysisTables(response) {
    const tables = [];
    if (!response) return tables;
    if (Array.isArray(response)) {
        if (response.length && Array.isArray(response[0])) {
            response.forEach(function (table) {
                if (Array.isArray(table)) tables.push(table);
            });
        } else {
            tables.push(response);
        }
        return tables;
    }
    ['Table', 'Table1', 'Table2', 'Table3', 'Table4', 'Table5'].forEach(function (key) {
        if (Array.isArray(response[key])) tables.push(response[key]);
    });
    return tables;
}

function isOutstandingAnalysisRow(row) {
    if (!row || typeof row !== 'object') return false;
    const keys = Object.keys(row).map(function (k) { return k.toLowerCase(); });
    return keys.includes('vendor/client') ||
        keys.includes('delaydays') ||
        keys.includes('delay days') ||
        (keys.includes('balance') && (keys.includes('amount adjusted') || keys.includes('amountadjusted')));
}

function isSalesAnalysisRow(row) {
    if (!row || typeof row !== 'object' || isOutstandingAnalysisRow(row)) return false;
    const keys = Object.keys(row).map(function (k) { return k.toLowerCase(); });
    return keys.includes('weight') || keys.includes('party name') || keys.includes('partyname') || keys.includes('gp');
}

function parseClientAnalysisResponse(response) {
    const tables = flattenSalesAnalysisTables(response);
    let salesRows = [];
    let outstandingRows = [];

    tables.forEach(function (table) {
        if (!table || !table.length) return;
        if (isOutstandingAnalysisRow(table[0])) {
            outstandingRows = outstandingRows.concat(table);
        } else if (isSalesAnalysisRow(table[0])) {
            salesRows = salesRows.concat(table);
        }
    });

    return { salesRows: salesRows || [], outstandingRows: outstandingRows || [] };
}

function getCaRowWeight(row) {
    return parseFloat(getRowField(row, ['Weight', 'weight', 'QtyMT', 'Qty', 'QTY', 'MT', 'SalesMT']) || 0) || 0;
}

function getCaRowValue(row) {
    return parseFloat(getRowField(row, [
        'TotalBillAmount', 'Total Bill Amount', 'TotalBillAmt',
        'Invoice Amount', 'InvoiceAmount', 'Sale Value', 'SaleValue', 'Value',
        'AmountRs', 'Net Amount', 'NetAmount', 'Bill Amount'
    ]) || 0) || 0;
}

function getCaPartyName(row) {
    return (getRowField(row, ['Party Name', 'PartyName', 'PARTY_NAME', 'Vendor/Client', 'Client', 'CLIENT']) || 'Unknown').toString().trim();
}

function getCaSegment(row) {
    return (getRowField(row, ['Segment', 'SEGMENT', 'Seg', 'IndustryType']) || 'Unknown').toString().trim();
}

function getCaProduct(row) {
    return (getRowField(row, ['Item Name', 'ItemName', 'ITEM_NAME', 'Product', 'Product Name', 'Item']) || 'Unknown').toString().trim();
}

function getCaOutstandingBalance(row) {
    const amount = parseFloat(getRowField(row, ['Amount']) || 0) || 0;
    const adjusted = parseFloat(getRowField(row, ['Amount Adjusted', 'AmountAdjusted']) || 0) || 0;
    const balance = getRowField(row, ['Balance', 'Outstanding', 'Outstanding Amount']);
    if (balance !== undefined) {
        return parseFloat(balance) || 0;
    }
    return amount - adjusted;
}

function getCaDelayDays(row) {
    return parseFloat(getRowField(row, ['Delay Days', 'DelayDays', 'Delay_Days']) || 0) || 0;
}

function getCaCreditDays(row) {
    return parseFloat(getRowField(row, ['Credit Days', 'CreditDays', 'Credit_Days']) || 0) || 0;
}

function isCaOverdueRow(row) {
    const delay = getCaDelayDays(row);
    const credit = getCaCreditDays(row);
    return delay > credit || delay > 0;
}

function sumCaSales(rows) {
    let mt = 0;
    let value = 0;
    (rows || []).forEach(function (row) {
        mt += getCaRowWeight(row);
        value += getCaRowValue(row);
    });
    return { mt: mt, value: value, avgRate: mt > 0 ? value / mt : 0 };
}

function groupCaBy(rows, keyFn) {
    const map = new Map();
    (rows || []).forEach(function (row) {
        const key = keyFn(row) || 'Unknown';
        if (!map.has(key)) map.set(key, { name: key, mt: 0, value: 0 });
        const item = map.get(key);
        item.mt += getCaRowWeight(row);
        item.value += getCaRowValue(row);
    });
    return Array.from(map.values()).sort(function (a, b) { return b.mt - a.mt; });
}

function groupCaOutstanding(rows, overdueOnly) {
    const map = new Map();
    (rows || []).forEach(function (row) {
        if (overdueOnly && !isCaOverdueRow(row)) return;
        const party = getCaPartyName(row);
        if (!party || party === 'Unknown') return;
        const key = party.toLowerCase();
        if (!map.has(key)) map.set(key, { name: party, amount: 0 });
        map.get(key).amount += getCaOutstandingBalance(row);
    });
    return Array.from(map.values()).sort(function (a, b) { return b.amount - a.amount; });
}

function renderCaTrend(id, current, previous) {
    const el = document.getElementById(id);
    if (!el) return;
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    if (prev === 0 && curr === 0) {
        el.className = 'summary-kpi-trend trend-neutral';
        el.innerHTML = '';
        return;
    }
    const pct = prev === 0 ? 100 : Math.abs(((curr - prev) / prev) * 100);
    const up = curr >= prev;
    el.className = `summary-kpi-trend ${up ? 'trend-positive' : 'trend-negative'}`;
    el.innerHTML = `${up ? '▲' : '▼'} ${pct.toFixed(2)}% <span>vs Last Period</span>`;
}

function renderCaEmptyTable(bodyId, footId, colSpan, message) {
    const body = document.getElementById(bodyId);
    const foot = document.getElementById(footId);
    if (body) body.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-muted">${message || 'No data available'}</td></tr>`;
    if (foot) foot.innerHTML = '';
}

function renderCaGpSection(salesRows) {
    const buckets = { superHigh: { mt: 0, value: 0 }, high: { mt: 0, value: 0 }, medium: { mt: 0, value: 0 }, low: { mt: 0, value: 0 } };
    (salesRows || []).forEach(function (row) {
        const key = categorizeGpForSummary(getRowField(row, ['GP', 'gp']) || '');
        const bucket = buckets[key] || buckets.low;
        bucket.mt += getCaRowWeight(row);
        bucket.value += getCaRowValue(row);
    });

    const rows = [
        { key: 'superHigh', label: 'Super High GP', mtId: 'caGpSuperMt', pctId: 'caGpSuperPct' },
        { key: 'high', label: 'High GP', mtId: 'caGpHighMt', pctId: 'caGpHighPct' },
        { key: 'medium', label: 'Medium GP', mtId: 'caGpMedMt', pctId: 'caGpMedPct' },
        { key: 'low', label: 'Low GP', mtId: 'caGpLowMt', pctId: 'caGpLowPct' }
    ];
    const totalMt = rows.reduce(function (sum, r) { return sum + buckets[r.key].mt; }, 0);
    const totalValue = rows.reduce(function (sum, r) { return sum + buckets[r.key].value; }, 0);

    rows.forEach(function (r) {
        const pct = totalMt > 0 ? (buckets[r.key].mt / totalMt) * 100 : 0;
        const mtEl = document.getElementById(r.mtId);
        const pctEl = document.getElementById(r.pctId);
        if (mtEl) mtEl.textContent = formatNumber(buckets[r.key].mt);
        if (pctEl) pctEl.textContent = `${pct.toFixed(2)}%`;
    });

    const body = document.getElementById('caGpDetailBody');
    const foot = document.getElementById('caGpDetailFoot');
    if (body) {
        body.innerHTML = rows.map(function (r) {
            const mtPct = totalMt > 0 ? (buckets[r.key].mt / totalMt) * 100 : 0;
            const valPct = totalValue > 0 ? (buckets[r.key].value / totalValue) * 100 : 0;
            return `<tr>
                <td>${escapeHtml(r.label)}</td>
                <td class="text-end">${formatNumber(buckets[r.key].mt)}</td>
                <td class="text-end">${mtPct.toFixed(2)}%</td>
                <td class="text-end">${formatCaInr(buckets[r.key].value)}</td>
                <td class="text-end">${valPct.toFixed(2)}%</td>
            </tr>`;
        }).join('');
    }
    if (foot) {
        foot.innerHTML = `<tr>
            <td>Total</td>
            <td class="text-end">${formatNumber(totalMt)}</td>
            <td class="text-end">100.00%</td>
            <td class="text-end">${formatCaInr(totalValue)}</td>
            <td class="text-end">100.00%</td>
        </tr>`;
    }
}

function renderCaProductSection(salesRows) {
    const grouped = groupCaBy(salesRows, getCaProduct);
    const total = grouped.reduce(function (sum, item) { return sum + item.mt; }, 0);
    const top = grouped.slice(0, 4);
    const othersMt = grouped.slice(4).reduce(function (sum, item) { return sum + item.mt; }, 0);
    const items = othersMt > 0 ? top.concat([{ name: 'Others', mt: othersMt, value: 0 }]) : top;
    const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#858796'];

    const body = document.getElementById('caProductLegendBody');
    const foot = document.getElementById('caProductLegendFoot');
    if (!items.length) {
        renderCaEmptyTable('caProductLegendBody', 'caProductLegendFoot', 3);
    } else if (body) {
        body.innerHTML = items.map(function (item, index) {
            const pct = total > 0 ? (item.mt / total) * 100 : 0;
            return `<tr>
                <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[index % colors.length]};margin-right:6px;"></span>${escapeHtml(item.name)}</td>
                <td class="text-end">${formatNumber(item.mt)}</td>
                <td class="text-end">${pct.toFixed(2)}%</td>
            </tr>`;
        }).join('');
    }
    if (foot && items.length) {
        foot.innerHTML = `<tr><td>Total</td><td class="text-end">${formatNumber(total)}</td><td class="text-end">100.00%</td></tr>`;
    }

    const canvas = document.getElementById('caProductPieChart');
    if (!canvas) return;
    if (caProductPieChartInstance) {
        try { caProductPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        caProductPieChartInstance = null;
    }
    if (!items.length || typeof Chart === 'undefined') return;
    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
    }
    caProductPieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: items.map(function (item) { return item.name; }),
            datasets: [{
                data: items.map(function (item) { return item.mt; }),
                backgroundColor: colors.slice(0, items.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: { display: false },
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
                    font: { weight: 'bold', size: 10 },
                    formatter: function (value) {
                        return total > 0 ? `${((value / total) * 100).toFixed(0)}%` : '';
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
    });
}

function renderCaTopAmountTable(bodyId, footId, rows, emptyLabel) {
    const body = document.getElementById(bodyId);
    const foot = document.getElementById(footId);
    const top = (rows || []).slice(0, 5);
    if (!top.length) {
        renderCaEmptyTable(bodyId, footId, 3, emptyLabel);
        return 0;
    }
    const total = top.reduce(function (sum, row) { return sum + row.amount; }, 0);
    if (body) {
        body.innerHTML = top.map(function (row, index) {
            return `<tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(row.name)}</td>
                <td class="text-end">${formatCaInr(row.amount)}</td>
            </tr>`;
        }).join('');
    }
    if (foot) {
        foot.innerHTML = `<tr><td colspan="2">Total</td><td class="text-end">${formatCaInr(total)}</td></tr>`;
    }
    return total;
}

function renderCaTopPartyMonth(salesRows) {
    const grouped = groupCaBy(salesRows, getCaPartyName).filter(function (item) { return item.name && item.name !== 'Unknown'; }).slice(0, 5);
    const body = document.getElementById('caTopPartyMonthBody');
    const foot = document.getElementById('caTopPartyMonthFoot');
    if (!grouped.length) {
        renderCaEmptyTable('caTopPartyMonthBody', 'caTopPartyMonthFoot', 3);
        return;
    }
    const total = grouped.reduce(function (sum, item) { return sum + item.mt; }, 0);
    if (body) {
        body.innerHTML = grouped.map(function (item, index) {
            return `<tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.name)}</td>
                <td class="text-end">${formatNumber(item.mt)}</td>
            </tr>`;
        }).join('');
    }
    if (foot) {
        foot.innerHTML = `<tr><td colspan="2">Total</td><td class="text-end">${formatNumber(total)}</td></tr>`;
    }
}

function renderCaSegmentSection(salesRows) {
    const grouped = groupCaBy(salesRows, getCaSegment);
    const totalMt = grouped.reduce(function (sum, item) { return sum + item.mt; }, 0);
    const totalValue = grouped.reduce(function (sum, item) { return sum + item.value; }, 0);
    const body = document.getElementById('caSegmentBody');
    const foot = document.getElementById('caSegmentFoot');
    if (!grouped.length) {
        renderCaEmptyTable('caSegmentBody', 'caSegmentFoot', 5);
        return;
    }
    if (body) {
        body.innerHTML = grouped.map(function (item) {
            const pct = totalMt > 0 ? (item.mt / totalMt) * 100 : 0;
            const avg = item.mt > 0 ? item.value / item.mt : 0;
            return `<tr>
                <td>${escapeHtml(item.name)}</td>
                <td class="text-end">${formatNumber(item.mt)}</td>
                <td class="text-end">${pct.toFixed(2)}%</td>
                <td class="text-end">${formatCaInr(item.value)}</td>
                <td class="text-end">${formatCaInr(avg)}</td>
            </tr>`;
        }).join('');
    }
    if (foot) {
        const avg = totalMt > 0 ? totalValue / totalMt : 0;
        foot.innerHTML = `<tr>
            <td>Total</td>
            <td class="text-end">${formatNumber(totalMt)}</td>
            <td class="text-end">100.00%</td>
            <td class="text-end">${formatCaInr(totalValue)}</td>
            <td class="text-end">${formatCaInr(avg)}</td>
        </tr>`;
    }
}

function clearClientAnalysisDashboard() {
    const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('caKpiSalesMt', '0.00');
    setText('caKpiSalesValue', '₹ 0.00');
    setText('caKpiAvgRate', '₹ 0.00');
    setText('caKpiSalesMtTrend', '');
    setText('caKpiSalesValueTrend', '');
    setText('caKpiAvgRateTrend', '');
    setText('caGpSuperMt', '0.00');
    setText('caGpHighMt', '0.00');
    setText('caGpMedMt', '0.00');
    setText('caGpLowMt', '0.00');
    setText('caGpSuperPct', '0.00%');
    setText('caGpHighPct', '0.00%');
    setText('caGpMedPct', '0.00%');
    setText('caGpLowPct', '0.00%');
    setText('caTotalOutstanding', '₹ 0.00');
    setText('caTotalOverdue', '₹ 0.00');
    renderCaEmptyTable('caGpDetailBody', 'caGpDetailFoot', 5);
    renderCaEmptyTable('caProductLegendBody', 'caProductLegendFoot', 3);
    renderCaEmptyTable('caTopOutstandingBody', 'caTopOutstandingFoot', 3);
    renderCaEmptyTable('caTopOverdueBody', 'caTopOverdueFoot', 3);
    renderCaEmptyTable('caTopPartyMonthBody', 'caTopPartyMonthFoot', 3);
    renderCaEmptyTable('caSegmentBody', 'caSegmentFoot', 5);
    if (caProductPieChartInstance) {
        try { caProductPieChartInstance.destroy(); } catch (e) { /* ignore */ }
        caProductPieChartInstance = null;
    }
}

function renderClientAnalysisDashboard(salesRows, outstandingRows, lastSalesRows, productRows) {
    const current = sumCaSales(salesRows);
    const previous = sumCaSales(lastSalesRows);
    const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('caKpiSalesMt', formatNumber(current.mt));
    setText('caKpiSalesValue', formatCaInr(current.value));
    setText('caKpiAvgRate', formatCaInr(current.avgRate));
    renderCaTrend('caKpiSalesMtTrend', current.mt, previous.mt);
    renderCaTrend('caKpiSalesValueTrend', current.value, previous.value);
    renderCaTrend('caKpiAvgRateTrend', current.avgRate, previous.avgRate);

    renderCaGpSection(salesRows);
    renderCaProductSection((productRows && productRows.length) ? productRows : salesRows);
    renderCaTopPartyMonth(salesRows);
    renderCaSegmentSection(salesRows);

    const outstandingParties = groupCaOutstanding(outstandingRows, false);
    const overdueParties = groupCaOutstanding(outstandingRows, true);
    renderCaTopAmountTable('caTopOutstandingBody', 'caTopOutstandingFoot', outstandingParties);
    renderCaTopAmountTable('caTopOverdueBody', 'caTopOverdueFoot', overdueParties);
    const totalOutstanding = outstandingParties.reduce(function (sum, row) { return sum + row.amount; }, 0);
    const totalOverdue = overdueParties.reduce(function (sum, row) { return sum + row.amount; }, 0);
    setText('caTotalOutstanding', formatCaInr(totalOutstanding));
    setText('caTotalOverdue', formatCaInr(totalOverdue));
}

function fetchClientAnalysisMode(mode, filters, fromDateValue, toDateValue) {
    return SalesanalysisASTService.GetMultipleTableSalesAnalysisData(
        mode,
        filters.dealerCodes,
        fromDateValue,
        toDateValue,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    );
}

function renderClientAnalysis() {
    const filters = GetAllFilters();

    if (filters.dealerCodes == '') {
        return;
    }

    updateReportDateRangeDisplay();
    Showloader();

    const lastMonthRange = getLastMonthAsOnDateRange(filters.fromDate, filters.toDate);
    const currentCa = fetchClientAnalysisMode('CLIENT_ANALYSIS', filters, filters.fromDate, filters.toDate);
    const currentSummary = (!G_SummaryReportRows || G_SummaryReportRows.length === 0)
        ? fetchClientAnalysisMode('SUMMARY_REPORT', filters, filters.fromDate, filters.toDate)
        : Promise.resolve(null);
    const lastSummary = lastMonthRange
        ? fetchClientAnalysisMode('SUMMARY_REPORT', filters, lastMonthRange.fromDate, lastMonthRange.toDate)
        : Promise.resolve(null);
    const productPromise = SalesanalysisASTService.GetSalesAnalysisData(
        'PRODUCT_ANALYSIS',
        filters.dealerCodes,
        filters.fromDate,
        filters.toDate,
        filters.salesPersons,
        filters.cities,
        filters.status,
        filters.gp,
        filters.industryType,
        filters.notPurchaseFromDays
    ).catch(function () { return []; });

    Promise.all([currentCa, currentSummary, lastSummary, productPromise]).then(function (results) {
        HideLoader();
        const parsed = parseClientAnalysisResponse(results[0]);
        let salesRows = parsed.salesRows || [];
        if ((!salesRows || salesRows.length === 0) && G_SummaryReportRows && G_SummaryReportRows.length) {
            salesRows = G_SummaryReportRows;
        }
        if ((!salesRows || salesRows.length === 0) && results[1]) {
            salesRows = parseSummaryReportResponse(results[1]).rows || [];
        }
        const lastSalesRows = results[2] ? (parseSummaryReportResponse(results[2]).rows || []) : [];
        const productRows = Array.isArray(results[3]) ? results[3] : [];
        const hasProduct = (salesRows || []).some(function (row) {
            const name = getCaProduct(row);
            return name && name !== 'Unknown';
        });

        if ((!salesRows || salesRows.length === 0) && (!parsed.outstandingRows || parsed.outstandingRows.length === 0)) {
            console.warn('No Client Analysis data received');
            clearClientAnalysisDashboard();
            return;
        }

        renderClientAnalysisDashboard(salesRows, parsed.outstandingRows, lastSalesRows, hasProduct ? null : productRows);
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
    if (document.querySelector('#highGPLostClient')?.classList.contains('show') || document.querySelector('#highGPLostClient')?.classList.contains('active')) {
        renderHighGPLostClient();
    }
}

// Tab event listeners
document.addEventListener('DOMContentLoaded', function () {
    const salesAnalysisTabs = document.getElementById('salesAnalysisTabs');
    if (salesAnalysisTabs) {
        salesAnalysisTabs.addEventListener('shown.bs.tab', function (e) {
            const target = e.target?.getAttribute('data-bs-target') || e.target?.getAttribute('aria-controls') || '';
            syncGpFilterForTab(target);
        }, true);
    }

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
        if (document.querySelector('#highGPLostClient') && document.querySelector('#highGPLostClient').classList.contains('show')) {
            renderHighGPLostClient();
        }
    }, 300);

    initRmRateModalControls();
    initSummaryNbdCrrPartyModal();
});

let G_RmRateValues = {};
let G_RmRateFinYearLoaded = false;

const RM_RATE_MONTHS = [
    { Name: 'April', ShortName: 'Apr', Number: 4 },
    { Name: 'May', ShortName: 'May', Number: 5 },
    { Name: 'June', ShortName: 'Jun', Number: 6 },
    { Name: 'July', ShortName: 'Jul', Number: 7 },
    { Name: 'August', ShortName: 'Aug', Number: 8 },
    { Name: 'September', ShortName: 'Sep', Number: 9 },
    { Name: 'October', ShortName: 'Oct', Number: 10 },
    { Name: 'November', ShortName: 'Nov', Number: 11 },
    { Name: 'December', ShortName: 'Dec', Number: 12 },
    { Name: 'January', ShortName: 'Jan', Number: 1 },
    { Name: 'February', ShortName: 'Feb', Number: 2 },
    { Name: 'March', ShortName: 'Mar', Number: 3 }
];

function getRmRateMonthByNumber(monthNumber) {
    const month = Number(monthNumber);
    return RM_RATE_MONTHS.find(function (item) {
        return Number(item.Number) === month;
    }) || null;
}

function getRmRateMonthShortName(monthNumber) {
    return getRmRateMonthByNumber(monthNumber)?.ShortName || '';
}

function getCurrentFinYear() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        if (authKey.FinYear) {
            return String(authKey.FinYear);
        }
    } catch (e) {
        console.warn('Unable to read FinYear from authKey', e);
    }
    return BizSolHelperFunction.getFinancialYear();
}

function getDefaultRmRateMonth() {
    if (fromDate && fromDate !== '0') {
        const parts = String(fromDate).split('-');
        if (parts.length >= 2) {
            const month = parseInt(parts[1], 10);
            if (month >= 1 && month <= 12) {
                return String(month);
            }
        }
        const date = new Date(fromDate);
        if (!isNaN(date.getTime())) {
            return String(date.getMonth() + 1);
        }
    }
    return String(new Date().getMonth() + 1);
}

function bindRmRateMonthDropdown() {
    const ddlMonth = document.getElementById('ddlRmRateMonth');
    if (!ddlMonth) return;

    const currentValue = ddlMonth.value || getDefaultRmRateMonth();
    ddlMonth.innerHTML = '<option value="">Please select...</option>' +
        RM_RATE_MONTHS.map(function (month) {
            return `<option value="${month.Number}">${month.Name}</option>`;
        }).join('');

    if (currentValue && ddlMonth.querySelector(`option[value="${currentValue}"]`)) {
        ddlMonth.value = currentValue;
    }
}

function extractFinYearList(response) {
    const source = Array.isArray(response)
        ? response
        : (response?.Table || response?.table || response?.data || response?.Data || []);

    const years = [];
    (Array.isArray(source) ? source : []).forEach(function (item) {
        const finYear = typeof item === 'string'
            ? item
            : (item?.FinYear || item?.finYear || item?.FinYearValue || item?.Code || item?.Desp || '');
        if (finYear && !years.includes(String(finYear))) {
            years.push(String(finYear));
        }
    });
    return years;
}

function fillRmRateFinYearOptions(years) {
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    if (!ddlFinYear) return;

    const currentFy = getCurrentFinYear();
    ddlFinYear.innerHTML = '<option value="">Please select...</option>' +
        years.map(function (finYear) {
            return `<option value="${escapeHtml(finYear)}">${escapeHtml(finYear)}</option>`;
        }).join('');

    G_RmRateFinYearLoaded = years.length > 0;
    if (currentFy && ddlFinYear.querySelector(`option[value="${currentFy}"]`)) {
        ddlFinYear.value = currentFy;
    } else if (years.length > 0) {
        ddlFinYear.value = years[0];
    }
}

function bindRmRateFinYearDropdown() {
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    if (!ddlFinYear) {
        return Promise.resolve();
    }

    if (G_RmRateFinYearLoaded && ddlFinYear.options.length > 1) {
        if (!ddlFinYear.value) {
            ddlFinYear.value = getCurrentFinYear();
        }
        return Promise.resolve();
    }

    ddlFinYear.innerHTML = '<option value="">Loading...</option>';

    return PurchaseQualityCheckService.GetFinYear().then(function (response) {
        const years = extractFinYearList(response);
        if (years.length > 0) {
            fillRmRateFinYearOptions(years);
            return;
        }

        const currentFy = getCurrentFinYear();
        const startYear = parseInt(String(currentFy).split('-')[0], 10) || new Date().getFullYear();
        const fallbackYears = [];
        for (let i = startYear - 2; i <= startYear + 1; i++) {
            fallbackYears.push(i + '-' + (i + 1));
        }
        fillRmRateFinYearOptions(fallbackYears);
    }).catch(function (error) {
        console.error('Error loading Financial Year list:', error);
        const currentFy = getCurrentFinYear();
        const startYear = parseInt(String(currentFy).split('-')[0], 10) || new Date().getFullYear();
        const fallbackYears = [];
        for (let i = startYear - 2; i <= startYear + 1; i++) {
            fallbackYears.push(i + '-' + (i + 1));
        }
        fillRmRateFinYearOptions(fallbackYears);
    });
}

function initRmRateModalControls() {
    bindRmRateMonthDropdown();
    bindRmRateFinYearDropdown();

    const rmRateModal = document.getElementById('rmRateModal');
    if (rmRateModal && !rmRateModal.dataset.rmRateBound) {
        rmRateModal.dataset.rmRateBound = 'Y';
        rmRateModal.addEventListener('show.bs.modal', openRmRateModal);
    }

    const btnRmRate = document.getElementById('btnRmRate');
    if (btnRmRate && !btnRmRate.dataset.rmRateBound) {
        btnRmRate.dataset.rmRateBound = 'Y';
        btnRmRate.addEventListener('click', openRmRateModal);
    }

    const btnSaveRmRate = document.getElementById('btnSaveRmRate');
    if (btnSaveRmRate && !btnSaveRmRate.dataset.rmRateBound) {
        btnSaveRmRate.dataset.rmRateBound = 'Y';
        btnSaveRmRate.addEventListener('click', saveRmRateModal);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRmRateModalControls);
} else {
    initRmRateModalControls();
}

function renderRmRateTableRows(items) {
    const tbody = document.getElementById('rmRateTableBody');
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No item data available</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(function (entry) {
        const name = entry[0];
        const qty = Number(entry[1] || 0);
        const savedRate = G_RmRateValues[name] ?? '';
        return `<tr>
            <td>${escapeHtml(name)}</td>
            <td class="text-end">${qty.toFixed(3)}</td>
            <td>
                <input type="number" class="form-control form-control-sm rm-rate-input" data-item="${escapeHtml(name)}" value="${escapeHtml(savedRate)}" min="0" step="0.01" />
            </td>
        </tr>`;
    }).join('');
}

function loadRmRateModalData() {
    const tbody = document.getElementById('rmRateTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>';

    if (G_ProductAnalysisData && G_ProductAnalysisData.length > 0) {
        renderRmRateTableRows(aggregateProductData(G_ProductAnalysisData, function (row) { return row.itemName; }));
        return;
    }

    const filters = GetAllFilters();
    SalesanalysisASTService.GetSalesAnalysisData(
        'PRODUCT_ANALYSIS',
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
        const rows = Array.isArray(response) ? response.map(normalizeProductAnalysisRow) : [];
        renderRmRateTableRows(aggregateProductData(rows, function (row) { return row.itemName; }));
    }).catch(function (err) {
        console.error('Error fetching RM Rate item data:', err);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load item data</td></tr>';
    });
}

function openRmRateModal() {
    bindRmRateMonthDropdownBySortNumber();
    bindRmRateFinYearDropdown();
}

function saveRmRateModal() {
    document.querySelectorAll('#rmRateTableBody .rm-rate-input').forEach(function (input) {
        G_RmRateValues[input.dataset.item] = input.value;
    });

    if (typeof toastr !== 'undefined') {
        toastr.success('RM Rate saved');
    }

    const modalEl = document.getElementById('rmRateModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }
}

window.SalesanalysisAST_ShowReport = SalesanalysisAST_ShowReport;

function getRmRateMonthListSortedByNumber() {
    return RM_RATE_MONTHS.slice().sort(function (a, b) {
        return Number(a.Number) - Number(b.Number);
    });
}

function bindRmRateMonthDropdownBySortNumber() {
    const ddlMonth = document.getElementById('ddlRmRateMonth');
    if (!ddlMonth) return;

    const currentValue = ddlMonth.value || getDefaultRmRateMonth();
    ddlMonth.innerHTML = '<option value="">Please select...</option>' +
        getRmRateMonthListSortedByNumber().map(function (month) {
            return `<option value="${month.Number}">${month.Name}</option>`;
        }).join('');

    if (currentValue && ddlMonth.querySelector(`option[value="${currentValue}"]`)) {
        ddlMonth.value = currentValue;
    }
}

function extractMonthWiseItemRMRateList(response) {
    if (Array.isArray(response)) {
        return response;
    }

    const nested = response?.Table || response?.table || response?.data || response?.Data
        || response?.Table1 || response?.Result || response?.result || [];
    return Array.isArray(nested) ? nested : [];
}

function compactMonthWiseFieldName(name) {
    return String(name || '').toLowerCase().replace(/[\s_]/g, '');
}

function getMonthWiseItemRMRateField(row, keys, fallback) {
    if (!row || typeof row !== 'object') {
        return fallback;
    }

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
        }
        if (row[key] === 0 || row[key] === '0') {
            return row[key];
        }
    }

    const rowKeys = Object.keys(row);
    const compactKeys = keys.map(compactMonthWiseFieldName);
    const matchedKey = rowKeys.find(function (rowKey) {
        const compactRowKey = compactMonthWiseFieldName(rowKey);
        return compactKeys.some(function (key) {
            return compactRowKey === key;
        });
    });

    if (!matchedKey) {
        return fallback;
    }

    const matchedValue = row[matchedKey];
    if (matchedValue === 0 || matchedValue === '0' || (matchedValue !== undefined && matchedValue !== null && matchedValue !== '')) {
        return matchedValue;
    }

    return fallback;
}

function getMonthWiseItemRMRateValue(row) {
    const rate = getMonthWiseItemRMRateField(row, [
        'RMRate', 'RM_Rate', 'RmRate', 'RM Rate', 'ItemRMRate', 'Item_RMRate',
        'RMRateValue', 'Rate', 'RawMaterialRate'
    ], undefined);

    if (rate === 0 || rate === '0' || (rate !== undefined && rate !== null && rate !== '')) {
        return rate;
    }

    const keys = Object.keys(row || {});
    for (let i = 0; i < keys.length; i++) {
        const compactKey = compactMonthWiseFieldName(keys[i]);
        if (compactKey === 'rmrate' || compactKey === 'itemrmrate' || compactKey.endsWith('rmrate') || compactKey === 'rate') {
            return row[keys[i]];
        }
    }

    return '';
}

function formatMonthWiseRmRateInputValue(rate) {
    if (rate === 0 || rate === '0') {
        return '0';
    }
    if (rate === null || rate === undefined || rate === '') {
        return '';
    }
    const num = Number(rate);
    if (!isNaN(num)) {
        return Number.isInteger(num) ? String(num) : num.toFixed(2);
    }
    return String(rate).trim();
}

function onRmRateInput(el) {
    if (!el) return;

    let value = String(el.value || '').replace(/[^0-9.]/g, '');
    const dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
        value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '');
        const parts = value.split('.');
        value = (parts[0] || '').slice(0, 8) + '.' + (parts[1] || '').slice(0, 2);
    } else {
        value = value.slice(0, 8);
    }

    el.value = value;
}
window.onRmRateInput = onRmRateInput;

function focusRmRateElement(el) {
    if (!el) return;
    el.focus();
    if (typeof el.select === 'function') {
        el.select();
    }
}

function onRmRateEnter(el, event) {
    if (!el || !event || event.key !== 'Enter') {
        return;
    }

    event.preventDefault();
    const inputs = Array.from(document.querySelectorAll('#rmRateTableBody .rm-rate-input'));
    const currentIndex = inputs.indexOf(el);
    const nextInput = currentIndex >= 0 ? inputs[currentIndex + 1] : null;
    if (nextInput) {
        focusRmRateElement(nextInput);
        return;
    }

    focusRmRateElement(document.getElementById('btnSaveRmRate'));
}
window.onRmRateEnter = onRmRateEnter;

function onRmRateFilterEnter(event) {
    if (!event || event.key !== 'Enter') {
        return;
    }

    event.preventDefault();
    const sourceId = event.target ? event.target.id : '';
    if (sourceId === 'ddlRmRateFinYear') {
        focusRmRateElement(document.getElementById('ddlRmRateMonth'));
        return;
    }

    if (sourceId === 'ddlRmRateMonth') {
        const firstRmRate = document.querySelector('#rmRateTableBody .rm-rate-input');
        if (firstRmRate) {
            focusRmRateElement(firstRmRate);
            return;
        }
        focusRmRateElement(document.getElementById('btnSaveRmRate'));
    }
}

function normalizeMonthWiseItemRMRateRow(row) {
    if (Array.isArray(row)) {
        return {
            itemName: row[0] ?? '',
            qty: Number(row[1] || 0),
            rmRate: row[2] ?? '',
            itemMasterCode: Number(row[3] || 0),
            monthDate: row[4] ?? ''
        };
    }

    const mapped = {
        itemName: getMonthWiseItemRMRateField(row, ['ItemName', 'Item_Name', 'ItemDesp', 'ItemMasterName', 'Item', 'Name', 'Desp'], ''),
        qty: Number(getMonthWiseItemRMRateField(row, ['QtyMT', 'Qty_MT', 'QtyMt', 'Qty', 'Quantity', 'Weight', 'MT'], 0) || 0),
        rmRate: getMonthWiseItemRMRateValue(row),
        itemMasterCode: Number(getMonthWiseItemRMRateField(row, ['ItemMaster_Code', 'ItemMasterCode', 'Item_Code', 'ItemCode', 'Code'], 0) || 0),
        monthDate: getMonthWiseItemRMRateField(row, ['MonthDate', 'Month_Date', 'AsOnDate'], '')
    };

    if (mapped.itemName && mapped.itemMasterCode && (mapped.rmRate === 0 || mapped.rmRate)) {
        return mapped;
    }

    const keys = Object.keys(row || {});
    keys.forEach(function (key) {
        const lowerKey = String(key).toLowerCase();
        const compactKey = compactMonthWiseFieldName(key);
        const value = row[key];
        if (!mapped.itemName && (lowerKey.includes('item') || lowerKey.includes('name') || lowerKey.includes('desp')) && !lowerKey.includes('code')) {
            mapped.itemName = value ?? '';
        } else if ((!mapped.qty || mapped.qty === 0) && (lowerKey.includes('qty') || lowerKey.includes('weight') || lowerKey === 'mt')) {
            mapped.qty = Number(value || 0);
        } else if ((mapped.rmRate === '' || mapped.rmRate === null || mapped.rmRate === undefined)
            && (compactKey === 'rmrate' || compactKey.endsWith('rmrate') || compactKey === 'rate' || lowerKey.includes('rate'))) {
            mapped.rmRate = value ?? '';
        } else if ((!mapped.itemMasterCode || mapped.itemMasterCode === 0) && lowerKey.includes('code')) {
            mapped.itemMasterCode = Number(value || 0);
        } else if (!mapped.monthDate && lowerKey.includes('date')) {
            mapped.monthDate = value ?? '';
        }
    });

    return mapped;
}

function buildMonthWiseItemRMRateRowHtml(entry, rowIndex) {
    const name = entry.itemName || '';
    const qty = Number(entry.qty || 0);
    const itemMasterCode = Number(entry.itemMasterCode || 0);
    const monthDate = entry.monthDate || '';
    const savedRate = formatMonthWiseRmRateInputValue(entry.rmRate);

    return `<tr>
        <td>${escapeHtml(name)}</td>
        <td class="text-end">${qty.toFixed(3)}</td>
        <td class="text-center">
            <input type="text" class="form-control form-control-sm rm-rate-input" inputmode="decimal" maxlength="11" data-item="${escapeHtml(name)}" data-row="${rowIndex}" data-item-code="${itemMasterCode}" data-qty="${qty}" data-month-date="${escapeHtml(monthDate)}" value="${escapeHtml(savedRate)}" oninput="onRmRateInput(this)" onkeydown="onRmRateEnter(this, event)" />
        </td>
    </tr>`;
}

function renderMonthWiseItemRMRateGrid(items) {
    const tbody = document.getElementById('rmRateTableBody');
    if (!tbody) return;

    const rows = (Array.isArray(items) ? items : []).filter(function (entry) {
        return entry && (entry.itemName || Number(entry.itemMasterCode || 0) > 0);
    });

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No item data available</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(function (entry, index) {
        return buildMonthWiseItemRMRateRowHtml(entry, index);
    }).join('');
}

function loadMonthWiseItemRMRateGrid() {
    const tbody = document.getElementById('rmRateTableBody');
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    const ddlMonth = document.getElementById('ddlRmRateMonth');
    if (!tbody || !ddlFinYear || !ddlMonth) return;

    const finYear = ddlFinYear.value;
    const month = getRmRateMonthShortName(ddlMonth.value);
    if (!finYear || !month) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Please select Fin Year and Month</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>';

    SalesanalysisASTService.GetMonthWiseItemRMRateData(finYear, month).then(function (response) {
        const rows = extractMonthWiseItemRMRateList(response).map(normalizeMonthWiseItemRMRateRow);
        renderMonthWiseItemRMRateGrid(rows);
    }).catch(function (error) {
        console.error('Error fetching month wise item RM Rate data:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load item data</td></tr>';
    });
}

function getLoggedInRmRateUserType() {
    try {
        const details = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (Array.isArray(details) && details[0]) {
            return String(details[0].UserType || '').toUpperCase();
        }
    } catch (e) {
        console.warn('Unable to read UserType from UserDetails', e);
    }
    return '';
}

function applyRmRateButtonVisibility() {
    const toolbar = document.getElementById('rmRateToolbar');
    const btnRmRate = document.getElementById('btnRmRate');

    if (toolbar) {
        toolbar.classList.remove('d-none');
    }
    if (btnRmRate) {
        btnRmRate.classList.remove('d-none');
    }
}

function initMonthWiseItemRMRateBinding() {
    applyRmRateButtonVisibility();
    bindRmRateMonthDropdownBySortNumber();

    const ddlMonth = document.getElementById('ddlRmRateMonth');
    if (ddlMonth && !ddlMonth.dataset.monthWiseRmRateBound) {
        ddlMonth.dataset.monthWiseRmRateBound = 'Y';
        ddlMonth.addEventListener('change', loadMonthWiseItemRMRateGrid);
    }
    if (ddlMonth && !ddlMonth.dataset.monthWiseRmRateEnterBound) {
        ddlMonth.dataset.monthWiseRmRateEnterBound = 'Y';
        ddlMonth.addEventListener('keydown', onRmRateFilterEnter);
    }

    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    if (ddlFinYear && !ddlFinYear.dataset.monthWiseRmRateBound) {
        ddlFinYear.dataset.monthWiseRmRateBound = 'Y';
        ddlFinYear.addEventListener('change', function () {
            if (document.getElementById('ddlRmRateMonth')?.value) {
                loadMonthWiseItemRMRateGrid();
            }
        });
    }
    if (ddlFinYear && !ddlFinYear.dataset.monthWiseRmRateEnterBound) {
        ddlFinYear.dataset.monthWiseRmRateEnterBound = 'Y';
        ddlFinYear.addEventListener('keydown', onRmRateFilterEnter);
    }

    const rmRateModal = document.getElementById('rmRateModal');
    if (rmRateModal && !rmRateModal.dataset.monthWiseRmRateBound) {
        rmRateModal.dataset.monthWiseRmRateBound = 'Y';
        rmRateModal.addEventListener('shown.bs.modal', function () {
            bindRmRateMonthDropdownBySortNumber();
            loadMonthWiseItemRMRateGrid();
        });
    }

    bindMonthWiseItemRMRateSaveButton();
}

function getSelectedRmRateMonthDate() {
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    const ddlMonth = document.getElementById('ddlRmRateMonth');
    const finYear = ddlFinYear ? ddlFinYear.value : '';
    const month = Number(ddlMonth ? ddlMonth.value : 0);
    const monthShortName = getRmRateMonthShortName(month);
    if (!finYear || !month || !monthShortName) {
        return '';
    }

    const yearParts = String(finYear).split('-');
    const startYear = parseInt(yearParts[0], 10);
    const endYear = parseInt(yearParts[1], 10) || (startYear + 1);
    const year = month >= 4 ? startYear : endYear;
    if (!year) {
        return '';
    }

    return `${monthShortName}-${year}`;
}

function collectMonthWiseItemRMRatePayload() {
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    const finYear = ddlFinYear ? ddlFinYear.value : '';
    const defaultMonthDate = getSelectedRmRateMonthDate();
    const payload = [];

    document.querySelectorAll('#rmRateTableBody .rm-rate-input').forEach(function (input) {
        const itemMasterCode = Number(input.dataset.itemCode || 0);
        const rmRate = Number(input.value || 0);
        if (!itemMasterCode || !(rmRate > 0)) {
            return;
        }

        payload.push({
            MonthDate: defaultMonthDate,
            FinYear: finYear,
            ItemMaster_Code: itemMasterCode,
            QtyMT: Number(input.dataset.qty || 0),
            RMRate: rmRate
        });
    });

    return payload;
}

function isMonthWiseItemRMRateSaveSuccess(response) {
    if (response === true || response === 'Y' || response === 'y') {
        return true;
    }
    if (response === null || response === undefined || response === false) {
        return false;
    }
    if (typeof response === 'string') {
        const lower = response.toLowerCase();
        return lower === 'y' || lower.includes('success') || lower.includes('saved');
    }
    if (typeof response !== 'object') {
        return false;
    }

    const status = response.Status || response.status || response.Flag || response.flag;
    if (status === 'N' || status === 'n' || status === false || response.Success === false) {
        return false;
    }

    return status === 'Y' || status === 'y' || status === true || status === 1 || response.Success === true || status === undefined;
}

function getMonthWiseItemRMRateSaveMessage(response, fallback) {
    return response?.Msg || response?.Message || response?.message || response?.Error || fallback;
}

function saveMonthWiseItemRMRateData() {
    const ddlFinYear = document.getElementById('ddlRmRateFinYear');
    const ddlMonth = document.getElementById('ddlRmRateMonth');
    const finYear = ddlFinYear ? ddlFinYear.value : '';
    const month = ddlMonth ? ddlMonth.value : '';

    if (!finYear || !month) {
        if (typeof toastr !== 'undefined') {
            toastr.error('Please select Fin Year and Month');
        }
        return;
    }

    const payload = collectMonthWiseItemRMRatePayload();
    if (payload.length === 0) {
        if (typeof toastr !== 'undefined') {
            toastr.error('No item with RM Rate greater than 0 to save');
        }
        return;
    }

    const btnSaveRmRate = document.getElementById('btnSaveRmRate');
    if (btnSaveRmRate) {
        btnSaveRmRate.disabled = true;
    }

    SalesanalysisASTService.SaveMonthWiseItemRMRateData(payload).then(function (response) {
        if (isMonthWiseItemRMRateSaveSuccess(response)) {
            payload.forEach(function (item) {
                const input = document.querySelector(`#rmRateTableBody .rm-rate-input[data-item-code="${item.ItemMaster_Code}"]`);
                if (input && input.dataset.item) {
                    G_RmRateValues[input.dataset.item] = String(item.RMRate);
                }
            });

            if (typeof toastr !== 'undefined') {
                toastr.success(getMonthWiseItemRMRateSaveMessage(response, 'RM Rate saved'));
            }

            const modalEl = document.getElementById('rmRateModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            }
            return;
        }

        if (typeof toastr !== 'undefined') {
            toastr.error(getMonthWiseItemRMRateSaveMessage(response, 'Failed to save RM Rate'));
        }
    }).catch(function (error) {
        console.error('Error saving month wise item RM Rate data:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error('Failed to save RM Rate');
        }
    }).finally(function () {
        if (btnSaveRmRate) {
            btnSaveRmRate.disabled = false;
        }
    });
}

function bindMonthWiseItemRMRateSaveButton() {
    const btnSaveRmRate = document.getElementById('btnSaveRmRate');
    if (!btnSaveRmRate || btnSaveRmRate.dataset.monthWiseRmRateSaveBound === 'Y') {
        return;
    }

    const newBtn = btnSaveRmRate.cloneNode(true);
    newBtn.dataset.monthWiseRmRateSaveBound = 'Y';
    btnSaveRmRate.parentNode.replaceChild(newBtn, btnSaveRmRate);
    newBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        saveMonthWiseItemRMRateData();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonthWiseItemRMRateBinding);
} else {
    initMonthWiseItemRMRateBinding();
}
