import { CustomerDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CustomerDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { DateRangeControl } from '../../Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js';
import '../../Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global cache for dealer list response
let G_ddlDealerNameList = [];
const _cityGeoCache = new Map();
let fromDate = '0';
let toDate = '0';

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
        console.log('Calling CustomerDashboard_ShowReport...');
        CustomerDashboard_ShowReport();
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
    const citiesPromise = CustomerDashboardService.GetCustomerDashboardData('DDL_CITIESNAMELIST', '0','0','0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.CityName, Desp: item.CityName }));
            filterPanel.updateFilterData('ddlCitiesNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching cities list:', error);
    });
    loadPromises.push(citiesPromise);

   

    // Wait for all dropdowns to load, then call the report
    Promise.all(loadPromises).then(function() {
        console.log('All filter dropdowns loaded successfully');
        // Call the report after all filters are loaded
        setTimeout(() => {
            console.log('Calling CustomerDashboard_ShowReport after all filters loaded...');
            CustomerDashboard_ShowReport();
        }, 1000); // Adding a small delay to ensure UI updates are complete
    }).catch(function(error) {
        console.error('Error loading one or more filter dropdowns:', error);
        // Still call the report even if some filters failed to load
        setTimeout(() => {
            console.log('Calling CustomerDashboard_ShowReport (with some filter errors)...');
            CustomerDashboard_ShowReport();
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

// Helper function to collect all filter values from FilterSidePanelControl
function GetAllFilters() {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.warn('FilterSidePanelControl not found - using fallback values');
        // Fallback to old method if control not found
        return {
            dealerCodes: GetSelectedValues('ddlDealerNamelist').join(',') || '0',
            salesPersons: GetSelectedValues('ddlSalesPersonlist').join(',') || '0',
            cities: GetSelectedValues('ddlCitiesNamelist').join(',') || '0',
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
            fromDate: fromDate,
            toDate: toDate
        };
    }
}

// DateRangeControl wiring (legacy support)
function initDateRangeControl() {
 const dr = document.querySelector('date-range-control#dateRange');
 if (!dr) return;

 // Initialize placeholders and default range (today)
 const todayISO = new Date().toISOString().slice(0,10);
 // If you want default from/to to be today, uncomment:
 // dr.setRange({ fromDate: todayISO, toDate: todayISO });

 // --- Set default to current financial year (Apr1 - Mar31) ---
 try {
 const now = new Date();
 const month = now.getMonth() +1; //1-12
 const year = now.getFullYear();
 const fyStartYear = (month >=4) ? year : (year -1);
 const fyEndYear = fyStartYear +1;
 const fyFrom = fyStartYear + '-04-01';
 const fyTo = fyEndYear + '-03-31';

 // Try to set the webcomponent range (some implementations expose setRange)
 try { dr.setRange({ fromDate: fyFrom, toDate: fyTo }); } catch (e) { /* ignore if not available */ }

 // Sync legacy hidden inputs immediately
 try {
 const legacyFrom = document.getElementById('txtFromDate');
 const legacyTo = document.getElementById('txtToDate');
 if (legacyFrom) legacyFrom.value = fyFrom;
 if (legacyTo) legacyTo.value = fyTo;
 } catch (e) { }

 // Update module-level variables so initial requests use FY by default
 try { fromDate = fyFrom; toDate = fyTo; } catch (e) { }
 } catch (e) {
 console.warn('Failed to initialize financial year default range', e);
 }
 // --- end FY default ---

 // Keep hidden legacy inputs in sync
 function syncToLegacyInputs(detail) {
 const from = detail.fromDate || '';
 const to = detail.toDate || '';
 const legacyFrom = document.getElementById('txtFromDate');
 const legacyTo = document.getElementById('txtToDate');
 if (legacyFrom) legacyFrom.value = from;
 if (legacyTo) legacyTo.value = to;
 }

 // On change event from the webcomponent
 dr.addEventListener('daterangechange', function (e) {
 try {
 syncToLegacyInputs(e.detail);
 } catch (err) {
 console.warn('DateRangeControl sync error', err);
 }
 });

 // Expose a small helper for older code to programmatically set dates
 window.SetDateRange = function (fromIso, toIso) {
 dr.setRange({ fromDate: fromIso, toDate: toIso });
 };
}

// Initialize both FilterSidePanelControl and legacy DateRangeControl
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', () => {
 initFilterSidePanelControl();
 initDateRangeControl();
 });
} else {
    initFilterSidePanelControl();
    initDateRangeControl();
}

// Existing chart data and functions follow

const labels = ['Apr', 'May', 'Jun', 'Jul'];
const previousYearSales = [55,87,59,52];
const currentYearSales = [41,9,28,51];

function loadChartDataLabelsPlugin(callback) {
 if (window.ChartDataLabels) {
 callback();
 return;
 }
 const script = document.createElement('script');
 script.src = "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js";
 script.onload = callback;
 document.head.appendChild(script);
}

function renderBarChart() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
 
if (selectedDealers == '' || selectedDealers == null) {
return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
 Showloader();
    CustomerDashboardService.GetCustomerDashboardData('SALESTAB', selectedDealers, fromDate, toDate).then(function (response) {
 HideLoader();
 const chartRows = Array.isArray(response) ? response : (response && response.MonthlySales ? response.MonthlySales : []);

        // chartRows expected as array of objects:
        // [{ MonthOrder:1, MonthName:'Apr', CurrentFYQty:5405.29, PrevFYQty:4697.70 }, ...]
        if (typeof ChartDataLabels !== 'undefined') {
            try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
        }

        let canvas = document.getElementById('barSalesChart');
        if (!canvas) return;

        // If a previous chart instance exists, destroy it and replace the canvas element
        if (window.barChartInstance) {
            try { window.barChartInstance.destroy(); } catch (e) { /* ignore */ }

            // Replace canvas with a fresh element to remove any leftover inline styles or event handlers
            try {
                const parent = canvas.parentNode;
                const newCanvas = document.createElement('canvas');
                newCanvas.id = canvas.id;
                newCanvas.className = canvas.className || '';
                // keep a sensible height for the chart area (adjust as needed)
                newCanvas.style.width = '100%';
                newCanvas.style.height = canvas.style.height || '320px';
                parent.replaceChild(newCanvas, canvas);
                canvas = newCanvas;
            } catch (e) {
                // fallback to using existing canvas if replacement fails
                console.warn('Canvas replace failed, continuing with existing element', e);
            }
        }

        const ctx = canvas.getContext('2d');

        // Convert input rows into arrays suitable for Chart.js
        let monthLabels = [];
        let currentFY = [];
        let prevFY = [];

        if (Array.isArray(chartRows) && chartRows.length >0) {
            // Ensure sorted by MonthOrder (Apr..Mar)
            chartRows.sort((a, b) => (Number(a.MonthOrder) ||0) - (Number(b.MonthOrder) ||0));
            monthLabels = chartRows.map(r => r.MonthName || '');

            currentFY = chartRows.map(r => {
                const v = r.CurrentFYQty;
                return (v === null || v === undefined || v === '') ?0 : Number(v);
            });
            prevFY = chartRows.map(r => {
                const v = r.PrevFYQty;
                return (v === null || v === undefined || v === '') ?0 : Number(v);
            });

        } else {
            // fallback to existing sample arrays (keeps backward compatibility)
            monthLabels = labels;
            currentFY = currentYearSales;
            prevFY = previousYearSales;
        }

        // Apply a sensible min-width so Chart area can horizontally scroll when many months exist,
        // but clear it for small label counts to avoid unexpected scrolling.
        if (monthLabels.length >8) {
            const minW = Math.min(Math.max(400, monthLabels.length *60),1400);
            canvas.style.minWidth = minW + 'px';
        } else {
            canvas.style.minWidth = '';
        }

        // Create bar chart comparing current and previous financial year month-wise
        window.barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Current FY Sales',
                        data: currentFY,
                        backgroundColor: 'rgba(192,57,43,0.85)',
                        borderColor: 'rgba(192,57,43,1)',
                        borderWidth:1
                    },
                    {
                        label: 'Previous FY Sales',
                        data: prevFY,
                        backgroundColor: 'rgba(24,67,135,0.95)',
                        borderColor: 'rgba(24,67,135,1)',
                        borderWidth:1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const val = ctx.raw;
                                if (val === null || val === undefined) return '';
                                return ctx.dataset.label + ': ' + Number(val).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        offset: -6,
                        color: '#222',
                        font: { weight: 'bold', size:12 },
                        formatter: function (value) {
                            if (value === null || value === undefined) return '';
                            return Number(value).toLocaleString('en-US', { maximumFractionDigits:2 });
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                if (value === null || value === undefined) return '';
                                return Number(value).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
                            }
                        },
                        title: { display: true, text: 'Sales' }
                    }
                }
            },
            plugins: (typeof ChartDataLabels !== 'undefined') ? [window.ChartDataLabels] : []
        });

        // Ensure the chart is sized correctly after insertion
        try { setTimeout(() => window.barChartInstance.resize(),50); } catch (e) { /* ignore */ }

        setBestSaleDetils();
    })

}
function setBestSaleDetils() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('SALESTAB_BESTSALEDETAILS', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#kpi-selected-year')[0].innerHTML = response[0].TotalCurrentSales
            $('#kpi-best-month')[0].innerHTML = response[0].BestMonthName
            $('#kpi-best-month-amt')[0].innerHTML = response[0].BestMonthSale
            $('#kpi-best-day-date')[0].innerHTML = response[0].BestDayDate
            $('#kpi-best-day-amt')[0].innerHTML = response[0].BestDaySale
        }
        else {
            $('#kpi-selected-year')[0].innerHTML = '0'
            $('#kpi-best-month')[0].innerHTML = '-'
            $('#kpi-best-month-amt')[0].innerHTML = '0'
            $('#kpi-best-day-date')[0].innerHTML = '-'
            $('#kpi-best-day-amt')[0].innerHTML = '0'
        }
    })
}

/* ===== Utility functions ===== */

// Escape HTML to avoid XSS when injecting labels
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* Legacy functions kept for backward compatibility with old UI (if exists) */
function BindSelectList(element, list) {
    console.warn('BindSelectList is deprecated - using FilterSidePanelControl instead');
    // Kept for backward compatibility but not used with FilterSidePanelControl
}

function GetSelectedValues(containerId) {
    console.warn('GetSelectedValues is deprecated - using FilterSidePanelControl.getFilterValues() instead');
    // Fallback for legacy code
    const container = document.getElementById(containerId);
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"].' + containerId + '_chk'));
    return inputs.filter(i => i.checked).map(i => i.value);
}

/* Ensure datalabels plugin is loaded before rendering charts */
loadChartDataLabelsPlugin(() => {
    // Initial render will be triggered by FilterSidePanelControl after data loads
    console.log('ChartDataLabels plugin loaded');
});

/* ===== Regional charts + map rendering (existing) ===== */

function renderRegionalSection() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
    const placeholder = {
        stateMax: '-',
        cityMax: '-',
        pareto: { labels: ['-'], sales: [0], cumulative: [0] },
        regionSales: { labels: ['-'], data: [0] },
        polygon: [],
        center: [0, 0],
        zoom: 11
    };

    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('REGIONTAB', selectedDealers, fromDate, toDate).then(async function (response) {
        HideLoader();

        // Normalize response - expect array of city records
        let regionalData = [];

        try {
            if (response && Array.isArray(response) && response.length > 0) {
                regionalData = response;
            } else {
                console.warn('No regional data received or unexpected format');
                regionalData = [];
            }
        } catch (e) {
            console.warn('regional response parsing failed', e);
            regionalData = [];
        }

        // Extract first row for KPIs
        let stateMax = '-';
        let cityMax = '-';
        if (regionalData.length > 0) {
            stateMax = regionalData[0].ConsigneeStateName || '-';
            cityMax = regionalData[0].ConsigneeCityName || '-';
        }

        // write summary text
        const stateEl = document.getElementById('regional-state-max');
        const cityEl = document.getElementById('regional-city-max');
        if (stateEl) stateEl.textContent = stateMax;
        if (cityEl) cityEl.textContent = cityMax;

        // Build region sales chart data from all rows
        const regionLabels = [];
        const regionSalesData = [];
        regionalData.forEach(function (item) {
            const cityName = item.ConsigneeCityName || '';
            const sales = Number(item.CurrentYearSales || 0);
            if (cityName) {
                regionLabels.push(cityName);
                regionSalesData.push(sales);
            }
        });

        // Region sales horizontal bar
        try {
            const regionCanvas = document.getElementById('regionSalesChart');
            if (regionCanvas) {
                regionCanvas.style.minWidth = regionCanvas.style.minWidth || '600px';

                const ctx2 = regionCanvas.getContext('2d');
                if (window.regionSalesChartInstance) {
                    try { window.regionSalesChartInstance.destroy(); } catch (e) { }
                }

                // Ensure datalabels plugin is registered globally so labels render
                if (typeof ChartDataLabels !== 'undefined') {
                    try { Chart.register(ChartDataLabels); } catch (e) { /* already registered */ }
                }

                window.regionSalesChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: regionLabels.length >0 ? regionLabels : ['-'],
                        datasets: [{
                            label: 'Sales',
                            data: regionSalesData.length >0 ? regionSalesData : [0],
                            backgroundColor: 'rgba(24,67,135,0.95)',
                            borderColor: 'rgba(24,67,135,1)',
                            borderWidth:1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            // Configure datalabels here (works if plugin registered)
                            datalabels: {
                                display: true,
                                anchor: 'center',
                                align: 'center',
                                color: '#fff',
                                formatter: function (value) {
                                    if (value === null || value === undefined) return '';
                                    return Number(value).toLocaleString('en-US', { maximumFractionDigits:2 });
                                },
                                font: { weight: 'bold' }
                            },
                            tooltip: { enabled: true }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: { display: true, text: 'Sales' }
                            },
                            y: { grid: { display: false } }
                        }
                    },
                    // If plugin variable exists, also add to chart plugins array to be safe
                    plugins: (typeof ChartDataLabels !== 'undefined') ? [ChartDataLabels] : []
                });

                try { window.regionSalesChartInstance.resize(); window.regionSalesChartInstance.update(); } catch (e) { }
            }
        } catch (e) {
            console.warn('region sales chart failed', e);
        }

        // Fetch polygon and center for each city and render map
        try {
            if (typeof L !== 'undefined' && regionalData.length > 0) {
                let mapEl = document.getElementById('regionalMap');
                if (mapEl) {
                    console.log('Rendering map with', regionalData.length, 'cities');

                    // Initialize map if not already created
                    if (!window._regionalLeafletMap) {
                        // Use a default center (will be updated after adding layers)
                        window._regionalLeafletMap = L.map(mapEl).setView([20.5937, 78.9629], 5); // Default: center of India
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 18,
                            attribution: '&copy; OpenStreetMap contributors'
                        }).addTo(window._regionalLeafletMap);
                    }

                    // Clear existing layers
                    if (window._regionalLayerGroup) {
                        window._regionalLayerGroup.clearLayers();
                    } else {
                        window._regionalLayerGroup = L.layerGroup().addTo(window._regionalLeafletMap);
                    }

                    // Fetch geo data for each city
                    const geoPromises = regionalData.map(async function (item) {
                        const cityName = item.ConsigneeCityName;
                        const stateName = item.ConsigneeStateName;
                        const sales = item.CurrentYearSales;

                        if (!cityName) return null;

                        try {
                            const geo = await getCityCenterAndPolygon(cityName);
                            return {
                                city: cityName,
                                state: stateName,
                                sales: sales,
                                geo: geo
                            };
                        } catch (e) {
                            console.warn('Failed to fetch geo for', cityName, e);
                            return null;
                        }
                    });

                    const geoResults = await Promise.all(geoPromises);

                    // Track combined bounds
                    let combinedBounds = null;

                    // Add polygons and markers for each city
                    geoResults.forEach(function (result) {
                        if (!result || !result.geo) return;

                        const { city, state, sales, geo } = result;

                        // Add polygon if available
                        if (geo.polygon && Array.isArray(geo.polygon) && geo.polygon.length >= 3) {
                            try {
                                const polygon = L.polygon(geo.polygon, {
                                    color: '#c0392b',
                                    weight: 2,
                                    fillColor: '#e74c3c',
                                    fillOpacity: 0.25
                                }).addTo(window._regionalLayerGroup);

                                // Bind popup with city info
                                polygon.bindPopup(`<strong>${city}</strong><br/>${state}<br/>Sales: ${formatNumber(sales)}`);

                                // Update combined bounds
                                if (!combinedBounds) {
                                    combinedBounds = polygon.getBounds();
                                } else {
                                    combinedBounds.extend(polygon.getBounds());
                                }
                            } catch (e) {
                                console.warn('Failed to add polygon for', city, e);
                            }
                        }

                        // Add marker at center
                        if (geo.center && Array.isArray(geo.center) && geo.center.length === 2) {
                            try {
                                const marker = L.marker(geo.center)
                                    .bindPopup(`<strong>${city}</strong><br/>${state}<br/>Sales: ${formatNumber(sales)}`)
                                    .addTo(window._regionalLayerGroup);

                                // Update combined bounds
                                if (!combinedBounds) {
                                    combinedBounds = L.latLngBounds([geo.center, geo.center]);
                                } else {
                                    combinedBounds.extend(marker.getLatLng());
                                }
                            } catch (e) {
                                console.warn('Failed to add marker for', city, e);
                            }
                        }
                    });

                    // Fit map to show all added layers
                    if (combinedBounds) {
                        try {
                            window._regionalLeafletMap.fitBounds(combinedBounds, { padding: [20, 20] });
                        } catch (e) {
                            console.warn('Could not fit bounds:', e);
                        }
                    }

                    setTimeout(function () {
                        try {
                            window._regionalLeafletMap.invalidateSize();
                        } catch (e) { }
                    }, 250);
                }
            }
        } catch (e) {
            console.warn('Leaflet not available or map render failed', e);
        }

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching regional summary', err);
        // If API failed, render placeholder UI
        try {
            const stateEl = document.getElementById('regional-state-max');
            const cityEl = document.getElementById('regional-city-max');
            if (stateEl) stateEl.textContent = '-';
            if (cityEl) cityEl.textContent = '-';
        } catch (e) { /* ignore */ }
    });
}

/* ===== NEW: Client charts + table rendering ===== */

function formatNumber(v) {
    if (v === null || v === undefined) return '';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderClientSection() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('CLIENTTAB', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Growth (%)': 'right',
            'Current Year Sales': 'right',
            'Last Year Sales': 'right'
        };


        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("clientSalesTableHeader", "clientSalesTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            // Top client
            const topClient = response[0]["Client Name"] || '-';
            const topEl = document.getElementById('top-client-name');
            if (topEl) topEl.textContent = topClient;
        }
    })




    // populate the table

}

/* When client tab becomes visible, re-render charts to ensure proper sizing */
document.addEventListener('DOMContentLoaded', function () {
    const salesTabBtn = document.getElementById('Sales-tab');
    if (salesTabBtn) {
        salesTabBtn.addEventListener('shown.bs.tab', function () {
            renderBarChart();
        });
    }
    const regionalTabBtn = document.getElementById('regional-tab');
    if (regionalTabBtn) {
        regionalTabBtn.addEventListener('shown.bs.tab', function () {
            renderRegionalSection();
        });
    }

    const clientTabBtn = document.getElementById('client-tab');
    if (clientTabBtn) {
        clientTabBtn.addEventListener('shown.bs.tab', function () {
            renderClientSection();
        });
    }

    const targetTabBtn = document.getElementById('target-growth-tab');
    if (targetTabBtn) {
        targetTabBtn.addEventListener('shown.bs.tab', function () {
            renderTargetGrowthSection();
        });
    }

    const productTabBtn = document.getElementById('product-tab');
    if (productTabBtn) {
        productTabBtn.addEventListener('shown.bs.tab', function () {
            renderProductSection();
            renderProductSpecificationSection();
        });
    }

    // In case page initially shows regional or client tab, ensure render called after short delay
    setTimeout(function () {
        if (document.querySelector('#Sales') && document.querySelector('#Sales').classList.contains('show')) {
            renderBarChart();
        }
        if (document.querySelector('#regional') && document.querySelector('#regional').classList.contains('show')) {
            renderRegionalSection();
        }
        if (document.querySelector('#client') && document.querySelector('#client').classList.contains('show')) {
            renderClientSection();
        }
        if (document.querySelector('#target-growth') && document.querySelector('#target-growth').classList.contains('show')) {
            renderTargetGrowthSection();
        }
        if (document.querySelector('#product') && document.querySelector('#product').classList.contains('show')) {
            renderProductSection();
            renderProductSpecificationSection();
        }
        
    }, 300);
});

/* ===== Product Specification rendering ===== */
function renderProductSpecificationSection() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('PRODUCTSPECIFICATIONTAB', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No product specification data received');
            return;
        }

        // Get top thickness and size from first record (assuming sorted by highest sales)
        const topThickness = response[0]['Thickness'] || '-';
        const topSize = response[0]['Size'] || '-' ;

        // KPI values
        const topThicknessEl = document.getElementById('top-thickness');
        const topSizeEl = document.getElementById('top-size');
        if (topThicknessEl) topThicknessEl.textContent = topThickness;
        if (topSizeEl) topSizeEl.textContent = topSize;

        // Prepare data for thickness pie chart - aggregate by Thickness
        const thicknessMap = new Map();
        response.forEach(item => {
            const thickness = item['Thickness'] || '';
            const sales = Number(item['Current Year Sales'] || 0);
            if (thickness && thickness !== '') {
                if (thicknessMap.has(thickness)) {
                    thicknessMap.set(thickness, thicknessMap.get(thickness) + sales);
                } else {
                    thicknessMap.set(thickness, sales);
                }
            }
        });

        // Convert to array and sort by sales descending, take top 5
        const thicknessData = Array.from(thicknessMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Thickness pie chart
        const thicknessCanvas = document.getElementById('thicknessPie');
        if (thicknessCanvas && thicknessData.length > 0) {
            const labels = thicknessData.map(d => d.label);
            const data = thicknessData.map(d => d.value);
            if (window.thicknessPieInstance) try { window.thicknessPieInstance.destroy(); } catch (e) { }
            const ctx = thicknessCanvas.getContext('2d');
            window.thicknessPieInstance = new Chart(ctx, {
                type: 'pie',
                data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#8e44ad', '#c0392b', '#e74c3c', '#f39c12', '#d35400'] }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                        }
                    },
                    plugins: {
                        legend: { position: 'right' },
                        datalabels: {
                            anchor: 'center',
                            align: 'end',
                            offset: 45,
                            color: '#818181',
                            font: { weight: 'bold', size: 12 },
                            formatter: function (value) {
                                if (value === null || value === undefined) return '';
                                return formatNumber(value);
                            },
                            clip: false
                        }
                    }
                },
                plugins: [window.ChartDataLabels]
            });
        }

        // Prepare data for size pie chart - aggregate by Size
        const sizeMap = new Map();
        response.forEach(item => {
            const size = item['Size'] || '';
            const sales = Number(item['Current Year Sales'] || 0);
            if (size && size !== '') {
                if (sizeMap.has(size)) {
                    sizeMap.set(size, sizeMap.get(size) + sales);
                } else {
                    sizeMap.set(size, sales);
                }
            }
        });

        // Convert to array and sort by sales descending, take top 5
        const sizeData = Array.from(sizeMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Size pie chart
        const sizeCanvas = document.getElementById('sizePie');
        if (sizeCanvas && sizeData.length > 0) {

            const labels = sizeData.map(d => d.label);
            const data = sizeData.map(d => d.value);
            if (window.sizePieInstance) try { window.sizePieInstance.destroy(); } catch (e) { }
            const ctx2 = sizeCanvas.getContext('2d');
            window.sizePieInstance = new Chart(ctx2, {
                type: 'pie',
                data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#3498db', '#2c3e50', '#e67e22', '#9b59b6', '#e74c3c'] }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                        }
                    },
                    plugins: {
                        legend: { position: 'right' },
                        datalabels: {
                            anchor: 'center',
                            align: 'end',
                            offset: 45,
                            color: '#818181',
                            font: { weight: 'bold', size: 12 },
                            formatter: function (value) {
                                if (value === null || value === undefined) return '';
                                return formatNumber(value);
                            },
                            clip: false
                        }
                    }
                },
                plugins: [window.ChartDataLabels]
            });
        }

        // Product specification table using BizsolCustomFilterGrid
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Products Growth (%)': 'right',
            'Current Year Sales': 'right',
            'Last Year Sales': 'right'
        };

        BizsolCustomFilterGrid.CreateDataTable("productSpecTableHeader", "productSpecTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching product specification data:', err);
    });
}

/* ===== Product rendering ===== */
function renderProductSection() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('PRODUCTTAB', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No product data received');
            return;
        }

        // Get top product and group from first record (assuming sorted by highest sales)
        const topProduct = response[0]['Products Name'] || '-';
        const topGroup = response[0]['Group Name'] || '-' ;

        // write top product/group
        const topProductEl = document.getElementById('top-product-name');
        const topGroupEl = document.getElementById('top-group-name');
        if (topProductEl) topProductEl.textContent = topProduct;
        if (topGroupEl) topGroupEl.textContent = topGroup;

        // Prepare data for top products pie chart (top 5)
        const topProducts = response.slice(0, 5).map(function (item) {
            return {
                name: item['Products Name'] || '',
                value: Number(item['Current Year Sales'] || 0)
            };
        });

        // Pie: top products
        let prodCanvas = document.getElementById('topProductsPie');
        if (prodCanvas && topProducts.length > 0) {
            // Destroy previous chart instance
            if (window.topProductsPieInstance) {
                try {
                    window.topProductsPieInstance.destroy();
                } catch (e) {
                    console.warn('Error destroying topProductsPie chart:', e);
                }
            }

            // Replace canvas with a fresh element to remove any leftover inline styles or event handlers
            try {
                const parent = prodCanvas.parentNode;
                const newCanvas = document.createElement('canvas');
                newCanvas.id = prodCanvas.id;
                newCanvas.className = prodCanvas.className || '';
                newCanvas.style.width = '100%';
                newCanvas.style.height = prodCanvas.style.height || '250px';
                parent.replaceChild(newCanvas, prodCanvas);
                prodCanvas = newCanvas;
            } catch (e) {
                console.warn('Canvas replace failed, continuing with existing element', e);
            }

            const labels = topProducts.map(p => p.name);
            const data = topProducts.map(p => p.value);

            const ctx = prodCanvas.getContext('2d');
            window.topProductsPieInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#c0392b', '#e74c3c', '#d35400', '#f39c12', '#3498db']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                        }
                    },
                    plugins: {
                        legend: { position: 'right' },
                        datalabels: {
                            anchor: 'center',
                            align: 'end',
                            offset: 55,
                            color: '#818181',
                            font: { weight: 'bold', size: 12 },
                            formatter: function (value) {
                                if (value === null || value === undefined) return '';
                                return formatNumber(value);
                            },
                            clip: false
                        }
                    }
                },
                plugins: [window.ChartDataLabels]
            });

            // Ensure the chart is sized correctly after insertion
            try {
                setTimeout(() => {
                    if (window.topProductsPieInstance) {
                        window.topProductsPieInstance.resize();
                        window.topProductsPieInstance.update();
                    }
                }, 50);
            } catch (e) {
                console.warn('Error resizing chart:', e);
            }
        }

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
            'Products Growth (%)': 'right',
            'Current Year Sales': 'right',
            'Last Year Sales': 'right'
        };

        BizsolCustomFilterGrid.CreateDataTable("productSalesTableHeader", "productSalesTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching product data:', err);
    });
}

/* ===== Target & Growth rendering ===== */

function renderTargetGrowthSection() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
    
if (selectedDealers == '' || selectedDealers == null) {
    return;
}
fromDate = filters.fromDate;
toDate = filters.toDate;
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('TARGETGROWTHTAB', selectedDealers, fromDate, toDate).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No target growth data received');
            return;
        }

        // Find best marketing man (highest Current Year Sales)
        let best = { name: '-', amt: 0 };
        if (response.length > 0) {
            const sorted = response.slice().sort((a, b) => {
                const aVal = Number(a['Current Year Sales'] || 0);
                const bVal = Number(b['Current Year Sales'] || 0);
                return bVal - aVal;
            });
            best.name = sorted[0]['Marketing Man'] || '-';
            best.amt = Number(sorted[0]['Current Year Sales'] || 0);
        }

        // Best marketing man KPI
        const bestEl = document.getElementById('best-marketing-man');
        const bestAmtEl = document.getElementById('best-marketing-man-amt');
        if (bestEl) bestEl.textContent = best.name;
        if (bestAmtEl) bestAmtEl.textContent = formatNumber(best.amt);

        // Gauge chart: Use first record or aggregate data for gauge visualization
        const gaugeCanvas = document.getElementById('targetGaugeChart');
        if (gaugeCanvas && response.length > 0) {
            // Aggregate totals for gauge
            let totalCurrent = 0;
            let totalTarget = 0;
            response.forEach(function (r) {
                totalCurrent += Number(r['Current Year Sales'] || 0);
                totalTarget += Number(r['Target'] || 0);
            });

            const achievedPct = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
            const remainingPct = Math.max(100 - achievedPct, 0);

            if (window.targetGaugeChartInstance) {
                try { window.targetGaugeChartInstance.destroy(); } catch (e) { }
            }

            const ctx = gaugeCanvas.getContext('2d');

            // Helper function to format large numbers with K/M suffix
            function formatCompactNumber(val) {
                if (val >= 1000000) {
                    return (val / 1000000).toFixed(2) + 'M';
                } else if (val >= 1000) {
                    return (val / 1000).toFixed(2) + 'K';
                }
                return formatNumber(val);
            }

            window.targetGaugeChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Achieved', 'Remaining'],
                    datasets: [{
                        data: [achievedPct, remainingPct],
                        backgroundColor: ['rgba(231, 76, 60, 0.8)', 'rgba(220, 220, 220, 0.4)'],
                        borderWidth: 0,
                        borderRadius: 0
                    }]
                },
                options: {
                    rotation: -Math.PI,
                    circumference: Math.PI,
                    cutout: '78%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    const idx = ctx.dataIndex;
                                    if (idx === 0) {
                                        return ctx.label + ': ' + formatNumber(totalCurrent) + ' (' + achievedPct.toFixed(2) + '%)';
                                    }
                                    return ctx.label + ': ' + remainingPct.toFixed(2) + '%';
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'gaugeLabels',
                    afterDatasetsDraw: function (chart) {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const centerX = (chartArea.left + chartArea.right) / 2;
                        const centerY = chartArea.bottom;

                        const meta = chart._metasets[0];
                        if (!meta || !meta.data || meta.data.length === 0) return;

                        const arc = meta.data[0];
                        const radius = arc.outerRadius;

                        const leftX = centerX - radius - 10;
                        const rightX = centerX + radius + 10;
                        const bottomLabelY = centerY + 25;

                        ctx.save();

                        ctx.font = '14px Arial';
                        ctx.fillStyle = '#666';
                        ctx.textAlign = 'left';
                        ctx.fillText('0', leftX, bottomLabelY);

                        ctx.textAlign = 'center';
                        ctx.font = 'bold 20px Arial';
                        ctx.fillStyle = '#000';
                        ctx.fillText(formatCompactNumber(totalCurrent), centerX, centerY - 15);

                        ctx.textAlign = 'right';
                        ctx.font = '14px Arial';
                        ctx.fillStyle = '#666';
                        ctx.fillText(formatNumber(totalTarget), rightX, bottomLabelY);

                        ctx.font = '12px Arial';
                        ctx.fillStyle = '#999';
                        ctx.fillText('Target', rightX, bottomLabelY + 18);

                        ctx.restore();
                    }
                }]
            });

            const centerLabel = document.getElementById('gauge-center-label');
            if (centerLabel) centerLabel.textContent = formatNumber(totalCurrent);
        }

        // Separate data into two arrays: with target and without target
        const withTarget = [];
        const withoutTarget = [];

        response.forEach(function (r) {
            const target = Number(r['Target'] || 0);
            if (target > 0) {
                withTarget.push(r);
            } else {
                withoutTarget.push(r);
            }
        });

        // Sales without target table
        const tbodyNo = document.querySelector('#salesWithoutTargetTable tbody');
        if (tbodyNo) {
            tbodyNo.innerHTML = '';
            withoutTarget.forEach(function (r) {
                const marketingMan = escapeHtml(r['Marketing Man'] || '');
                const sales = Number(r['Current Year Sales'] || 0);
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${marketingMan}</td><td class="text-end">${formatNumber(sales)}</td>`;
                tbodyNo.appendChild(tr);
            });
        }

        // Target Analysis table (with Target Achieved column)
        const tbodyT = document.querySelector('#targetAnalysisTable tbody');
        if (tbodyT) {
            tbodyT.innerHTML = '';
            withTarget.forEach(function (r) {
                const marketingMan = escapeHtml(r['Marketing Man'] || '');
                const current = Number(r['Current Year Sales'] || 0);
                const target = Number(r['Target'] || 0);
                const targetAchieved = r['Target Achieved'] || 'No';
                const achievedFlag = (targetAchieved.toString().toLowerCase() === 'yes' || targetAchieved === 'Y') ? 'Yes' : 'No';

                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${marketingMan}</td>
            <td class="text-end">${formatNumber(current)}</td>
     <td class="text-end">${formatNumber(target)}</td>
                <td class="text-center" style="background:${achievedFlag === 'Yes' ? '#2ecc71' : 'transparent'}">${achievedFlag}</td>`;
                tbodyT.appendChild(tr);
            });
        }

        // Marketing Men's Growth table (use all records from response)
        const mgTable = document.querySelector('#marketingGrowthTable tbody');
        if (mgTable) {
            mgTable.innerHTML = '';
            response.forEach(function (r) {
                const marketingMan = escapeHtml(r['Marketing Man'] || '');
                const growthPct = r['Marketing Men Growth (%)'];
                const current = Number(r['Current Year Sales'] || 0);
                const last = Number(r['Last Year Sales'] || 0);

                // Format growth percentage
                let growthDisplay = '';
                if (growthPct !== null && growthPct !== undefined && growthPct !== '') {
                    growthDisplay = Number(growthPct).toFixed(2);
                } else {
                    growthDisplay = '-';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${marketingMan}</td>
    <td class="text-end">${growthDisplay}</td>
      <td class="text-end">${formatNumber(current)}</td>
        <td class="text-end">${formatNumber(last)}</td>`;
                mgTable.appendChild(tr);
            });
        }

    }).catch(function (err) {
        HideLoader();
        console.error('Error fetching target growth data:', err);
    });
}

/* Segment tab removed as per requirements */

/* Service calls and dropdown logic now handled by FilterSidePanelControl initialization */

function CustomerDashboard_ShowReport() {
const filters = GetAllFilters();
const selectedDealers = filters.dealerCodes;
 
if (selectedDealers == '' || selectedDealers == null) {
console.warn('No dealers selected');
return;
}

 if (document.querySelector('#Sales') && document.querySelector('#Sales').classList.contains('show')) {
 renderBarChart();
 }
 if (document.querySelector('#regional') && document.querySelector('#regional').classList.contains('show')) {
 renderRegionalSection();
 }
 if (document.querySelector('#client') && document.querySelector('#client').classList.contains('show')) {
 renderClientSection();
 }
 if (document.querySelector('#target-growth') && document.querySelector('#target-growth').classList.contains('show')) {
 renderTargetGrowthSection();
 }
 if (document.querySelector('#product') && document.querySelector('#product').classList.contains('show')) {
 renderProductSection();
 renderProductSpecificationSection();
 }
}


/* Legacy function kept for backward compatibility */
function AreAllSelected(containerId) {
    console.warn('AreAllSelected is deprecated - using FilterSidePanelControl instead');
    try {
        if (!containerId) return false;
        const container = document.getElementById(containerId);
        if (!container) return false;

        // If "Select All" checkbox exists, use its state as a quick answer
        const selectAllId = containerId + '_all';
        const selectAllEl = container.querySelector('#' + selectAllId);
        if (selectAllEl && selectAllEl instanceof HTMLInputElement && selectAllEl.type === 'checkbox') {
            return !!selectAllEl.checked;
        }

        // Fallback: evaluate all item checkboxes directly
        const itemSelector = 'input[type="checkbox"].' + containerId + '_chk';
        const inputs = Array.from(container.querySelectorAll(itemSelector));
        if (inputs.length === 0) return false;

        return inputs.every(function (chk) { return chk.checked === true; });
    } catch (e) {
        console.error('AreAllSelected error', e);
        return false;
    }
}



/*
async function testGeo() {
    const res = await getCityCenterAndPolygon('Pune');
    console.log('Geo result:', res);
}

testGeo();
*/

// Cache for city geo data


/**
 * Get center and polygon boundary for a city name.
 * Returns: { center: [lat, lon], polygon: [ [lat, lon], ... ] | null }
 * NOTE: Nominatim and Overpass have rate limits. Cache results and consider server-side proxy for production.
 */
async function getCityCenterAndPolygon(cityName) {
    if (!cityName) return null;
    const key = cityName.trim().toLowerCase();
    if (_cityGeoCache.has(key)) return _cityGeoCache.get(key);

    // Helper to validate coordinates
    function isValidCoord(lat, lon) {
        return !isNaN(lat) && !isNaN(lon) &&
            lat >= -90 && lat <= 90 &&
            lon >= -180 && lon <= 180;
    }

    // Helper to close polygon if needed
    function ensureClosedPolygon(coords) {
        if (!coords || coords.length < 3) return coords;
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push([first[0], first[1]]);
        }
        return coords;
    }

    console.log(`Fetching geo data for city: ${cityName}`);

    // Try Nominatim first with detailed polygon
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&addressdetails=1&q=${encodeURIComponent(cityName)}`;

        const nomRes = await fetch(nominatimUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BizSol-WebERP/1.0 (support@bizsol.com)'
            }
        });

        if (nomRes.ok) {
            const nomData = await nomRes.json();
            console.log('Nominatim response:', nomData);

            if (Array.isArray(nomData) && nomData.length > 0) {
                const item = nomData[0];
                const lat = Number(item.lat);
                const lon = Number(item.lon);

                if (!isValidCoord(lat, lon)) {
                    console.warn('Invalid coordinates from Nominatim:', lat, lon);
                    throw new Error('Invalid coordinates');
                }

                const center = [lat, lon];
                let polygon = null;

                if (item.geojson) {
                    try {
                        console.log('Processing geojson:', item.geojson.type);

                        if (item.geojson.type === 'Polygon' && Array.isArray(item.geojson.coordinates)) {
                            const coords = item.geojson.coordinates[0];
                            polygon = coords
                                .map(coord => [Number(coord[1]), Number(coord[0])]) // [lat, lon]
                                .filter(coord => isValidCoord(coord[0], coord[1]));
                            polygon = ensureClosedPolygon(polygon);
                            console.log(`Extracted ${polygon.length} polygon points from Nominatim`);
                        }
                        else if (item.geojson.type === 'MultiPolygon' && Array.isArray(item.geojson.coordinates)) {
                            // Find the largest polygon
                            let largestPoly = [];
                            for (const poly of item.geojson.coordinates) {
                                if (poly[0] && poly[0].length > largestPoly.length) {
                                    largestPoly = poly[0];
                                }
                            }
                            if (largestPoly.length > 0) {
                                polygon = largestPoly
                                    .map(coord => [Number(coord[1]), Number(coord[0])]) // [lat, lon]
                                    .filter(coord => isValidCoord(coord[0], coord[1]));
                                polygon = ensureClosedPolygon(polygon);
                                console.log(`Extracted ${polygon.length} polygon points from MultiPolygon`);
                            }
                        }
                    } catch (polyErr) {
                        console.warn('Failed to parse polygon from Nominatim:', polyErr);
                        polygon = null;
                    }
                }

                // If no polygon from geojson, try using boundingbox to create one
                if (!polygon && item.boundingbox && Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
                    const [minLat, maxLat, minLon, maxLon] = item.boundingbox.map(Number);
                    if (isValidCoord(minLat, minLon) && isValidCoord(maxLat, maxLon)) {
                        polygon = [
                            [minLat, minLon],
                            [maxLat, minLon],
                            [maxLat, maxLon],
                            [minLat, maxLon],
                            [minLat, minLon]  // close the rectangle
                        ];
                        console.log('Created rectangle polygon from bounding box');
                    }
                }

                const out = { center, polygon };
                _cityGeoCache.set(key, out);
                console.log('Cached result:', out);
                return out;
            }
        }
    } catch (e) {
        console.warn('Nominatim lookup failed:', e);
    }

    // Fallback: Overpass API with improved query for Indian cities
    try {
        console.log('Trying Overpass API...');
        const overpassQuery = `[out:json][timeout:25];
(
  relation["name"="${cityName}"]["boundary"="administrative"]["admin_level"~"^(5|6|7|8)$"];
  relation["name"="${cityName}"]["place"~"city|town"];
);
out geom;`;

        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const res = await fetch(overpassUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: overpassQuery
        });

        if (res.ok) {
            const json = await res.json();
            console.log('Overpass response:', json);

            if (json.elements && json.elements.length > 0) {
                for (const elem of json.elements) {
                    let centerLat, centerLon;

                    // Get center from bounds or center property
                    if (elem.bounds) {
                        centerLat = (elem.bounds.minlat + elem.bounds.maxlat) / 2;
                        centerLon = (elem.bounds.minlon + elem.bounds.maxlon) / 2;
                    } else if (elem.center) {
                        centerLat = elem.center.lat;
                        centerLon = elem.center.lon;
                    } else {
                        continue;
                    }

                    if (!isValidCoord(centerLat, centerLon)) continue;

                    let polygon = null;

                    // Try to extract polygon from members
                    if (elem.members && Array.isArray(elem.members)) {
                        const outerWays = elem.members.filter(m => m.role === 'outer' && m.geometry);
                        if (outerWays.length > 0) {
                            const allCoords = [];
                            outerWays.forEach(way => {
                                if (Array.isArray(way.geometry)) {
                                    way.geometry.forEach(pt => {
                                        if (isValidCoord(pt.lat, pt.lon)) {
                                            allCoords.push([Number(pt.lat), Number(pt.lon)]);
                                        }
                                    });
                                }
                            });
                            if (allCoords.length >= 3) {
                                polygon = ensureClosedPolygon(allCoords);
                                console.log(`Extracted ${polygon.length} polygon points from Overpass`);
                            }
                        }
                    }

                    // Fallback to bounding box rectangle if no polygon
                    if (!polygon && elem.bounds) {
                        const b = elem.bounds;
                        polygon = [
                            [b.minlat, b.minlon],
                            [b.maxlat, b.minlon],
                            [b.maxlat, b.maxlon],
                            [b.minlat, b.maxlon],
                            [b.minlat, b.minlon]
                        ];
                        console.log('Created rectangle from Overpass bounds');
                    }

                    //const out = { center: centerLat, polygon };
                    const out = { center: [centerLat, centerLon], polygon };
                    _cityGeoCache.set(key, out);
                    console.log('Cached Overpass result:', out);
                    return out;
                }
            }
        }
    } catch (e) {
        console.warn('Overpass lookup failed:', e);
    }

    // Final fallback: Simple Nominatim search with bounding box
    try {
        console.log('Trying final fallback...');
        const nomUrl2 = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(cityName)}`;
        const r = await fetch(nomUrl2, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BizSol-WebERP/1.0 (support@bizsol.com)'
            }
        });

        if (r.ok) {
            const j = await r.json();
            console.log('Fallback Nominatim response:', j);

            if (Array.isArray(j) && j.length > 0) {
                const lat = Number(j[0].lat);
                const lon = Number(j[0].lon);

                if (isValidCoord(lat, lon)) {
                    const center = [lat, lon];
                    let polygon = null;

                    // Try to create polygon from bounding box
                    if (j[0].boundingbox && Array.isArray(j[0].boundingbox) && j[0].boundingbox.length === 4) {
                        const [minLat, maxLat, minLon, maxLon] = j[0].boundingbox.map(Number);
                        if (isValidCoord(minLat, minLon) && isValidCoord(maxLat, maxLon)) {
                            polygon = [
                                [minLat, minLon],
                                [maxLat, minLon],
                                [maxLat, maxLon],
                                [minLat, maxLon],
                                [minLat, minLon]
                            ];
                            console.log('Created fallback rectangle from bounding box');
                        }
                    }


                    const out = { center, polygon };
                    _cityGeoCache.set(key, out);
                    console.log('Cached fallback result:', out);
                    return out;
                }
            }
        }
    } catch (e) {
        console.warn('Final fallback failed:', e);
    }

    console.warn(`No geo data found for ${cityName}`);
    _cityGeoCache.set(key, null);
    return null;
}

function GetDateRange() {
    // Read date range using shared helper and show in alert
    try {
        const drange = DateRangeControl.getDateRangeFromControl('dateRange');
        fromDate = drange.fromDate || '0';
        toDate = drange.toDate || '0';
        // alert('Date Range - From: ' + fromDate + '\nTo: ' + toDate);
    } catch (e) {
        console.warn('Could not read date range control via helper:', e);
    }
}
window.CustomerDashboard_ShowReport = CustomerDashboard_ShowReport;

