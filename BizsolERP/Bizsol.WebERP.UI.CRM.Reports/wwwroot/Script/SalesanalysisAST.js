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
        { id: 'ddlSalesPersonlist', type: 'multiselect', label: 'Sales Person', data: [] },
        { id: 'ddlDealerNamelist', type: 'multiselect', label: 'Dealer Name', data: [] },
        { id: 'ddlCitiesNamelist', type: 'multiselect', label: 'Location', data: [] },
        { id: 'ddlStatusNamelist', type: 'multiselect', label: 'Status', data: [] },
        { id: 'ddlGPlist', type: 'multiselect', label: 'GP', data: [] },
        { id: 'ddlIndustryTypelist', type: 'multiselect', label: 'Segment', data: [] }
    ];
    
    console.log('Setting filters:', filters);
    filterPanel.setFilters(filters);

    // Set default date range to financial year
    setTimeout(() => {
        console.log('Setting default date range...');
        try {
            const dateRangeEl = filterPanel.shadowRoot?.getElementById('dateRange');
            if (dateRangeEl) {
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                const fyStartYear = (month >= 4) ? year : (year - 1);
                const fyEndYear = fyStartYear + 1;
                const fyFrom = fyStartYear + '-04-01';
                const fyTo = fyEndYear + '-03-31';
                
                console.log(`Setting financial year range: ${fyFrom} to ${fyTo}`);
                dateRangeEl.setRange({ fromDate: fyFrom, toDate: fyTo });
                fromDate = fyFrom;
                toDate = fyTo;
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
    const citiesPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_CITIESNAMELIST', '0', '0', '0', '0', '0', '0','0','0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.CityName, Desp: item.CityName }));
            filterPanel.updateFilterData('ddlCitiesNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching cities list:', error);
    });
    loadPromises.push(citiesPromise);

    // Load Status List
    const statusPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_STATUSNAME', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.StatusName, Desp: item.StatusName }));
            filterPanel.updateFilterData('ddlStatusNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching status list:', error);
    });
    loadPromises.push(statusPromise);

    // Load GP List
    const gpPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_GPLIST', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.GP, Desp: item.GP }));
            filterPanel.updateFilterData('ddlGPlist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching GP list:', error);
    });
    loadPromises.push(gpPromise);

    // Load Industry Type List
    const industryPromise = SalesanalysisASTService.GetSalesAnalysisData('DDL_INDUSTRYTYPELIST', '0', '0', '0', '0', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.Code, Desp: item.IndustryType }));
            filterPanel.updateFilterData('ddlIndustryTypelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching industry type list:', error);
    });
    loadPromises.push(industryPromise);

    // Wait for all dropdowns to load, then call the report
    Promise.all(loadPromises).then(function() {
        console.log('All filter dropdowns loaded successfully');
        // Call the report after all filters are loaded
        setTimeout(() => {
            console.log('Calling SalesanalysisAST_ShowReport after all filters loaded...');
            SalesanalysisAST_ShowReport();
        }, 1000); // Adding a small delay to ensure UI updates are complete
    }).catch(function(error) {
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

    const promises = salesPersonFilter.values.map(function (code) {
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
            fromDate: fromDate,
            toDate: toDate
        };
    }
    
    try {
        const filterValues = filterPanel.getFilterValues();
        console.log('Filter values from control:', filterValues);
        
        const filters = {
            dealerCodes: filterValues.ddlDealerNamelist?.joined || '0',
            salesPersons: filterValues.ddlSalesPersonlist?.joined || '0',
            cities: filterValues.ddlCitiesNamelist?.joined || '0',
            status: filterValues.ddlStatusNamelist?.joined || '0',
            gp: filterValues.ddlGPlist?.joined || '0',
            industryType: filterValues.ddlIndustryTypelist?.joined || '0',
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
    
    SalesanalysisASTService.GetSalesAnalysisData('SUMMARY_REPORT', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
        HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No summary report data received');
            // Clear KPIs
            document.getElementById('kpi-parties').textContent = '0';
            document.getElementById('kpi-high-gp').textContent = '0';
            document.getElementById('kpi-lost-client').textContent = '0';
            document.getElementById('kpi-manifested-sales').textContent = '0';
            document.getElementById('kpi-actual-sale').textContent = '0';
            updateReportDateRangeDisplay();
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
        updateReportDateRangeDisplay();

        const StringFilterColumn = ["Party Name", "Segment", "Marketing Man","Location"];
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

function renderPartyScoring() {
    const filters = GetAllFilters();
    
    if (filters.dealerCodes == '') {
        return;
    }
    
    // Update date range display for this tab
    updateReportDateRangeDisplay();
    
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('PARTY_SCORING', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
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
        const StringFilterColumn = ["Party Name", "Segment", "Marketing Man","Location"];
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
    const filters = GetAllFilters();
    
    if (filters.dealerCodes == '') {
        return;
    }
    
    // Update date range display for this tab
    updateReportDateRangeDisplay();
    
    Showloader();
    
    SalesanalysisASTService.GetSalesAnalysisData('GOLDEN_CIRCLE', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
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
                        label: function(context) {
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

    data.forEach(function(row) {
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
    sorted.forEach(function([person, weight]) {
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
    sorted.forEach(function([base, weight]) {
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

    sorted.forEach(function([party, gpData]) {
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
    
    SalesanalysisASTService.GetMultipleTableSalesAnalysisData('MANIFESTATION', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
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
        
        renderWeekWeightTable(weekWeightData);
        renderManifesteTable(manifesteData);
        renderOrderSheetTable(orderSheetData);
        renderItemWeightTable(itemWeightData);
        
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
    
    // Clear Order Sheet Data table
    document.getElementById('orderSheetTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('orderSheetTableHeader').innerHTML = '';
    
    // Clear Item / WEIGHT table
    document.getElementById('itemWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
    document.getElementById('itemWeightTableHeader').innerHTML = '';
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
        
        // Order Sheet Data has Invoice related columns
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

function renderWeekWeightTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('weekWeightTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('weekWeightTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    
    // Right align all numeric columns (weeks)
    const ColumnAlignment = {};
    Object.keys(data[0] || {}).forEach(key => {
        if (key !== 'MGKT_PERSON' && key !== 'MGKT Person' && key !== 'Marketing Man' && 
            key !== 'MarketingMan' && key !== 'Person') {
            ColumnAlignment[key] = 'right';
        }
    });

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("weekWeightTableHeader", "weekWeightTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
    }
}

function renderManifesteTable(data) {
    if (!data || data.length === 0) {
        document.getElementById('manifesteTableBody').innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        document.getElementById('manifesteTableHeader').innerHTML = '';
        return;
    }

    const StringFilterColumn = ["Party Name", "MGKT_PERSON","Item Name"];
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

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("manifesteTableHeader", "manifesteTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("orderSheetTableHeader", "orderSheetTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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

function renderNBDCRR() {
    const filters = GetAllFilters();
    
    if (filters.dealerCodes == '') {
        return;
    }
    
    // Update date range display for this tab
    updateReportDateRangeDisplay();
    
    Showloader();
    
    SalesanalysisASTService.GetMultipleTableSalesAnalysisData('NBD_CRR', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
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
    Object.keys(data[0] || {}).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'mgkt_person' && lowerKey !== 'mgkt person' && 
            lowerKey !== 'marketing man' && lowerKey !== 'marketingman' && 
            lowerKey !== 'week' && lowerKey !== 'person') {
            ColumnAlignment[key] = 'right';
        }
    });

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("nbdCrrBaseWeekTableHeader", "nbdCrrBaseWeekTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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

    if (typeof BizsolCustomFilterGrid !== 'undefined') {
        BizsolCustomFilterGrid.CreateDataTable("nbdCrrOrderDetailsTableHeader", "nbdCrrOrderDetailsTableBody", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
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
    
    SalesanalysisASTService.GetSalesAnalysisData('SEGMENT_WISE', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
        HideLoader();
        
        if (response && response.length > 0) {
            // Render the collapsible table grouped by segment
            renderSegmentWiseCollapsibleTable(response);
        } else {
            const el = $('#segmentWiseTableBody')[0];
            if (el) el.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
        }
    }).catch(function (error) {
        HideLoader();
        console.error('Error fetching segment wise data:', error);
    });
}

function renderSegmentWiseCollapsibleTable(data) {
    const tbody = document.getElementById('segmentWiseTableBody');
    const thead = document.getElementById('segmentWiseTableHeader');
    
    if (!tbody || !thead) {
        console.error('Segment Wise table elements not found');
        return;
    }

    // Group data by Segment and Buyers
    const segmentData = new Map();
    let grandTotalWeight = 0;
    let grandTotalManifested = 0;

    data.forEach(function(row) {
        const segment = row['Segment'] || row['SEGMENT'] || row['IndustryType'] || 'Unknown';
        const buyerName = row['Party Name'] || row['Buyers Name'] || row['BuyersName'] || row['PartyName'] || 'Unknown';
        const weight = parseFloat(row['Weight'] || row['WEIGHT'] || 0);
        const manifestedWeight = parseFloat(row['Manifested Weight'] || row['ManifestedWeight'] || 0);
        
        if (!segmentData.has(segment)) {
            segmentData.set(segment, {
                totalWeight: 0,
                totalManifested: 0,
                buyersMap: new Map()
            });
        }
        
        const segInfo = segmentData.get(segment);
        segInfo.totalWeight += weight;
        segInfo.totalManifested += manifestedWeight;
        
        if (!segInfo.buyersMap.has(buyerName)) {
            segInfo.buyersMap.set(buyerName, {
                weight: 0,
                manifested: 0
            });
        }
        
        const buyerInfo = segInfo.buyersMap.get(buyerName);
        buyerInfo.weight += weight;
        buyerInfo.manifested += manifestedWeight;
        
        grandTotalWeight += weight;
        grandTotalManifested += manifestedWeight;
    });

    // Create header
    thead.innerHTML = `
        <tr>
            <th style="width: 50%; background-color: #4472C4; color: white;">Segment</th>
            <th class="text-end" style="width: 20%; background-color: #4472C4; color: white;">Weight</th>
            <th class="text-end" style="width: 20%; background-color: #4472C4; color: white;">Manifested Weight</th>
            <th class="text-end" style="width: 10%; background-color: #4472C4; color: white;">Percentage</th>
        </tr>
    `;

    // Sort segments by weight descending
    const sortedSegments = Array.from(segmentData.entries())
        .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

    // Populate body
    tbody.innerHTML = '';
    
    sortedSegments.forEach(function([segment, segInfo], index) {
        const percentage = grandTotalWeight > 0 ? ((segInfo.totalWeight / grandTotalWeight) * 100) : 0;
        const segmentId = `segment-${index}`;
        
        // Main segment row
        const segmentRow = document.createElement('tr');
        segmentRow.style.cssText = 'cursor: pointer; background-color: #f8f9fa; font-weight: bold;';
        segmentRow.innerHTML = `
            <td>
                <i class="fa fa-angle-right segment-toggle" id="toggle-${segmentId}" style="margin-right: 8px;"></i>
                ${escapeHtml(segment)}
            </td>
            <td class="text-end">${formatNumber(segInfo.totalWeight)}</td>
            <td class="text-end">${formatNumber(segInfo.totalManifested)}</td>
            <td class="text-end">${percentage.toFixed(2)}%</td>
        `;
        tbody.appendChild(segmentRow);

        // Create collapsible container for buyers
        const buyersContainer = document.createElement('tr');
        buyersContainer.id = segmentId;
        buyersContainer.style.display = 'none';
        buyersContainer.className = 'segment-buyers-container';
        
        // Create nested table for buyers
        const buyersTableCell = document.createElement('td');
        buyersTableCell.colSpan = 4;
        buyersTableCell.style.padding = '0';
        
        let buyersTableHTML = `
            <table class="table table-sm mb-0" style="margin-left: 20px; width: calc(100% - 30px);">
                <thead>
                    <tr style="background-color: #5B9BD5; color: white;">
                        <th style="width: 5%;">#</th>
                        <th style="width: 42%;">Buyers Name</th>
                        <th class="text-end" style="width: 17.66%;">Weight</th>
                        <th class="text-end" style="width: 17.66%;">Manifested Weight</th>
                        <th class="text-end" style="width: 17.66%;">Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Sort buyers by weight descending
        const sortedBuyers = Array.from(segInfo.buyersMap.entries())
            .sort((a, b) => b[1].weight - a[1].weight);
        
        sortedBuyers.forEach(function([buyerName, buyerInfo], buyerIndex) {
            const buyerPercentage = segInfo.totalWeight > 0 ? ((buyerInfo.weight / segInfo.totalWeight) * 100) : 0;
            buyersTableHTML += `
                <tr>
                    <td>${buyerIndex + 1}</td>
                    <td>${escapeHtml(buyerName)}</td>
                    <td class="text-end">${formatNumber(buyerInfo.weight)}</td>
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
        segmentRow.addEventListener('click', function() {
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
    grandTotalRow.innerHTML = `
        <td><strong>Grand Total</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotalWeight)}</strong></td>
        <td class="text-end"><strong>${formatNumber(grandTotalManifested)}</strong></td>
        <td class="text-end"><strong>100.00%</strong></td>
    `;
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

    SalesanalysisASTService.GetSalesAnalysisData('GP_WISE_SUMMARY', filters.dealerCodes, filters.fromDate, filters.toDate, filters.salesPersons, filters.cities, filters.status, filters.gp, filters.industryType).then(function (response) {
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
    if (document.querySelector('#gpWiseSummary')?.classList.contains('show') || document.querySelector('#gpWiseSummary')?.classList.contains('active')) {
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
    if ( gpWiseTabBtn) {
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
