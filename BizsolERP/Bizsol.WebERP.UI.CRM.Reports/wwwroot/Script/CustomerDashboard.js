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

// Global variable to store raw dashboard data
let G_RawDashboardData = [];
let G_IsDataLoaded = false;

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

    // Set default date range to financial year (from FY start to current date)
    setTimeout(() => {
        console.log('Setting default date range...');
        try {
            const dateRangeEl = filterPanel.shadowRoot?.getElementById('dateRange');
            if (dateRangeEl) {
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                const fyStartYear = (month >= 4) ? year : (year - 1);
                const fyFrom = fyStartYear + '-04-01';
                // Set FyTo to current date instead of financial year end
                const fyTo = now.toISOString().slice(0, 10);

                console.log(`Setting financial year range: ${fyFrom} to ${fyTo} (current date)`);
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

        // Load raw data and then show the report (refresh all tabs)
        console.log('Calling LoadRawDashboardData...');
        LoadRawDashboardData().then(() => {
            CustomerDashboard_ShowReport(true); // true = refresh all tabs
        });
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
    const citiesPromise = CustomerDashboardService.GetCustomerDashboardData('DDL_CITIESNAMELIST', '0', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            const data = response.map(item => ({ Code: item.CityName, Desp: item.CityName }));
            filterPanel.updateFilterData('ddlCitiesNamelist', data);
        }
    }).catch(function (error) {
        console.error('Error fetching cities list:', error);
    });
    loadPromises.push(citiesPromise);



    // Wait for all dropdowns to load, then load raw data and call the report
    Promise.all(loadPromises).then(function () {
        console.log('All filter dropdowns loaded successfully');
        // Load raw data and then call the report
        setTimeout(() => {
            console.log('Loading raw dashboard data after all filters loaded...');
            LoadRawDashboardData().then(() => {
                CustomerDashboard_ShowReport(true); // true = refresh all tabs on initial load
            });
        }, 1000); // Adding a small delay to ensure UI updates are complete
    }).catch(function (error) {
        console.error('Error loading one or more filter dropdowns:', error);
        // Still load raw data and call the report even if some filters failed to load
        setTimeout(() => {
            console.log('Loading raw dashboard data (with some filter errors)...');
            LoadRawDashboardData().then(() => {
                CustomerDashboard_ShowReport(true); // true = refresh all tabs on initial load
            });
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
    const todayISO = new Date().toISOString().slice(0, 10);
    // If you want default from/to to be today, uncomment:
    // dr.setRange({ fromDate: todayISO, toDate: todayISO });

    // --- Set default to current financial year (Apr1 - Current Date) ---
    try {
        const now = new Date();
        const month = now.getMonth() + 1; //1-12
        const year = now.getFullYear();
        const fyStartYear = (month >= 4) ? year : (year - 1);
        const fyFrom = fyStartYear + '-04-01';
        // Set FyTo to current date instead of financial year end
        const fyTo = now.toISOString().slice(0, 10);

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

// Global helper to clean up flatpickr mobile overlay
// IMPORTANT: This must be defined before initialization code
function cleanupFlatpickrOverlay() {
    try {
        const overlay = document.getElementById('flatpickr-mobile-overlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = '';
            console.log('Cleaned up flatpickr overlay');
        }
    } catch (e) {
        console.warn('Error cleaning up flatpickr overlay:', e);
    }
}

// Handle page visibility changes (tab switching, minimizing)
function initPageVisibilityHandler() {
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Clean up overlay when page becomes hidden
            cleanupFlatpickrOverlay();
        }
    });
    
    // Also handle when window loses focus
    window.addEventListener('blur', function() {
        cleanupFlatpickrOverlay();
    });
}

// Initialize both FilterSidePanelControl and legacy DateRangeControl
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Clean up any existing overlays on page load
        cleanupFlatpickrOverlay();
        
        initFilterSidePanelControl();
        initDateRangeControl();
        initMobileTabScrolling();
        initTabChangeHandlers(); // NEW: Fix map on tab change
        initOrientationChangeHandler(); // NEW: Fix map on orientation change
        initPageVisibilityHandler(); // NEW: Clean up overlay on tab switch
    });
} else {
    // Clean up any existing overlays on page load
    cleanupFlatpickrOverlay();
    
    initFilterSidePanelControl();
    initDateRangeControl();
    initMobileTabScrolling();
    initTabChangeHandlers(); // NEW: Fix map on tab change
    initOrientationChangeHandler(); // NEW: Fix map on orientation change
    initPageVisibilityHandler(); // NEW: Clean up overlay on tab switch
}



// Add event listeners for tab changes to fix map rendering on mobile
function initTabChangeHandlers() {
    const regionalTab = document.getElementById('regional-tab');
    if (regionalTab) {
        regionalTab.addEventListener('shown.bs.tab', function (e) {
            console.log('Regional Analysis tab shown - invalidating map');
            // Fix map rendering when tab becomes visible
            setTimeout(function () {
                if (window._regionalLeafletMap) {
                    try {
                        window._regionalLeafletMap.invalidateSize();
                        console.log('Map size invalidated after tab shown');
                    } catch (err) {
                        console.warn('Error invalidating map size:', err);
                    }
                }
            }, 100);

            // Additional invalidation for stubborn rendering issues
            setTimeout(function () {
                if (window._regionalLeafletMap) {
                    try {
                        window._regionalLeafletMap.invalidateSize();
                    } catch (err) { }
                }
            }, 500);
        });
    }
}

// Handle orientation changes on mobile
function initOrientationChangeHandler() {
    window.addEventListener('orientationchange', function() {
        console.log('Orientation changed');
        
        // Clean up any orphaned flatpickr overlays on orientation change
        cleanupFlatpickrOverlay();
        
        setTimeout(function() {
            if (window._regionalLeafletMap) {
                try {
                    window._regionalLeafletMap.invalidateSize();
                    console.log('Map size invalidated after orientation change');
                } catch (err) {
                    console.warn('Error invalidating map after orientation change:', err);
                }
            }
        }, 300);
    });
}

// Mobile-friendly tab scrolling - scroll active tab into view
function initMobileTabScrolling() {
    const tabsContainer = document.getElementById('customerDashboardTabs');

    if (tabsContainer) {
        // Function to scroll active tab into view
        function scrollActiveTabIntoView() {
            const activeTab = tabsContainer.querySelector('.nav-link.active');
            if (activeTab && window.innerWidth < 768) {
                // Smooth scroll the active tab into view
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }

        // Listen for tab change events
        const tabButtons = tabsContainer.querySelectorAll('.nav-link');
        tabButtons.forEach(function (button) {
            button.addEventListener('shown.bs.tab', function () {
                scrollActiveTabIntoView();
            });
        });

        // Scroll to active tab on page load
        setTimeout(scrollActiveTabIntoView, 300);
    }
}

// Add window resize handler for responsive chart updates
let resizeTimeout;
let lastWidth = window.innerWidth;
let isZooming = false;

// Detect zoom/pinch events to prevent unwanted redraws
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        isZooming = true;
        document.body.classList.add('zooming');
        // Force hide loader during zoom
        try {
            if (typeof HideLoader === 'function') {
                HideLoader();
            }
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.visibility = 'hidden';
                loader.style.display = 'none';
            }
        } catch (e) {
            console.warn('Could not hide loader:', e);
        }
    }
});

document.addEventListener('touchend', function () {
    setTimeout(function () {
        isZooming = false;
        document.body.classList.remove('zooming');
    }, 500); // Increased delay to ensure smooth experience
});

// Also detect browser zoom via visualViewport API
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
        // This fires during pinch zoom
        if (isZooming) {
            try {
                if (typeof HideLoader === 'function') {
                    HideLoader();
                }
            } catch (e) {
                console.warn('Could not hide loader:', e);
            }
        }
    });
}

window.addEventListener('resize', function () {
    // Skip resize handling during zoom gestures
    if (isZooming) {
        return;
    }

    // Clean up flatpickr overlay on resize (especially when transitioning between mobile and desktop)
    cleanupFlatpickrOverlay();

    // Debounce resize events to avoid too many redraws
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        // Only redraw if width actually changed (not just zoom/scroll)
        const currentWidth = window.innerWidth;
        if (Math.abs(currentWidth - lastWidth) > 10 && G_IsDataLoaded && window.barChartInstance) {
            lastWidth = currentWidth;
            // Redraw the bar chart with new responsive settings without showing loader
            try {
                renderBarChart();
            } catch (e) {
                console.warn('Chart resize failed:', e);
            }
        }
    }, 500); // Increased debounce time to 500ms for better stability
});

// Function to load raw dashboard data
async function LoadRawDashboardData() {
    const filters = GetAllFilters();
    const selectedDealers = filters.dealerCodes;
    const selectedCities = filters.cities;

    if (!selectedDealers || selectedDealers === '' || selectedDealers === '0') {
        console.warn('No dealers selected, skipping data load');
        G_RawDashboardData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
        return;
    }

    console.log('Loading raw dashboard data...');
    console.log('Filters:', { dealers: selectedDealers, cities: selectedCities, from: filters.fromDate, to: filters.toDate });
    Showloader();

    try {
        const response = await CustomerDashboardService.GetCustomerDashboardData(
            'getVw_Data',
            selectedDealers,
            filters.fromDate,
            filters.toDate,
            selectedCities
        );

        HideLoader();

        if (response && Array.isArray(response) && response.length > 0) {
            G_RawDashboardData = response;
            G_IsDataLoaded = true;
            console.log(`Loaded ${G_RawDashboardData.length} raw data records`);
        } else {
            console.warn('No raw data received from API');
            G_RawDashboardData = [];
            G_IsDataLoaded = false;
            clearAllTabs();
        }
    } catch (error) {
        HideLoader();
        console.error('Error loading raw dashboard data:', error);
        G_RawDashboardData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
    }
}

// Function to clear all tabs when no data is available
function clearAllTabs() {
    console.log('Clearing all tabs due to no data...');

    // Clear Sales Tab
    try {
        $('#kpi-selected-year').html('0');
        $('#kpi-best-month').html('-');
        $('#kpi-best-month-amt').html('0');
        $('#kpi-best-day-date').html('-');
        $('#kpi-best-day-amt').html('0');

        if (window.barChartInstance) {
            window.barChartInstance.destroy();
            window.barChartInstance = null;
        }
    } catch (e) {
        console.warn('Error clearing sales tab:', e);
    }

    // Clear Regional Tab
    try {
        $('#regional-state-max').text('-');
        $('#regional-city-max').text('-');

        if (window._regionalLayerGroup) {
            window._regionalLayerGroup.clearLayers();
        }
    } catch (e) {
        console.warn('Error clearing regional tab:', e);
    }

    // Clear Client Tab
    try {
        $('#top-client-name').text('-');
        $('#clientSalesTableBody').empty();
        $('#clientSalesTableHeader').empty();
    } catch (e) {
        console.warn('Error clearing client tab:', e);
    }

    // Clear Product Tab
    try {
        $('#top-product-name').text('-');
        $('#top-group-name').text('-');
        $('#productSalesTableBody').empty();
        $('#productSalesTableHeader').empty();

        if (window.topProductsPieInstance) {
            window.topProductsPieInstance.destroy();
            window.topProductsPieInstance = null;
        }
    } catch (e) {
        console.warn('Error clearing product tab:', e);
    }

    // Clear Product Specification Tab
    try {
        $('#top-thickness').text('-');
        $('#top-size').text('-');
        $('#productSpecTableBody').empty();
        $('#productSpecTableHeader').empty();

        if (window.thicknessPieInstance) {
            window.thicknessPieInstance.destroy();
            window.thicknessPieInstance = null;
        }

        if (window.sizePieInstance) {
            window.sizePieInstance.destroy();
            window.sizePieInstance = null;
        }
    } catch (e) {
        console.warn('Error clearing product specification tab:', e);
    }

    // Clear Target & Growth Tab
    try {
        $('#best-marketing-man').text('-');
        $('#best-marketing-man-amt').text('0');
        $('#gauge-center-label').text('0');

        if (window.targetGaugeChartInstance) {
            window.targetGaugeChartInstance.destroy();
            window.targetGaugeChartInstance = null;
        }

        $('#salesWithoutTargetTable tbody').empty();
        $('#targetAnalysisTable tbody').empty();
        $('#marketingGrowthTable tbody').empty();
    } catch (e) {
        console.warn('Error clearing target growth tab:', e);
    }
}

// Existing chart data and functions follow

const labels = ['Apr', 'May', 'Jun', 'Jul'];
const previousYearSales = [55, 87, 59, 52];
const currentYearSales = [41, 9, 28, 51];

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
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for sales chart');
        return;
    }

    console.log('Rendering bar chart from raw data...');

    // Process raw data to create monthly sales summary
    const chartRows = processRawDataForSalesTab(G_RawDashboardData);

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

    // Adjust canvas height for mobile devices
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        canvas.style.height = '250px';
        canvas.setAttribute('height', '250');
    } else {
        canvas.style.height = '320px';
        canvas.setAttribute('height', '320');
    }

    // Convert input rows into arrays suitable for Chart.js
    let monthLabels = [];
    let currentFY = [];
    let prevFY = [];

    if (Array.isArray(chartRows) && chartRows.length > 0) {
        // Ensure sorted by MonthOrder (Apr..Mar)
        chartRows.sort((a, b) => (Number(a.MonthOrder) || 0) - (Number(b.MonthOrder) || 0));
        
        // Filter to only show months within the selected date range
        // This prevents showing previous year data for future months that haven't occurred yet
        const filters = GetAllFilters();
        const toDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : new Date();
        const toMonth = toDate.getMonth() + 1; // 1-12
        const toYear = toDate.getFullYear();
        
        // Determine current FY year for comparison
        const currentFYYear = (toMonth >= 4) ? toYear : (toYear - 1);
        
        // Month number mapping (1-12 calendar months)
        const monthNameToNumber = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };
        
        // Filter chartRows to only include months up to the selected toDate
        const filteredRows = chartRows.filter(r => {
            const monthNum = monthNameToNumber[r.MonthName];
            if (!monthNum) return false;
            
            // For FY starting in April:
            // If month is Apr-Dec, it belongs to current calendar year
            // If month is Jan-Mar, it belongs to next calendar year
            const monthYear = (monthNum >= 4) ? currentFYYear : (currentFYYear + 1);
            
            // Create a date for the last day of this month
            const monthEndDate = new Date(monthYear, monthNum, 0); // Day 0 of next month = last day of current month
            
            // Only include if this month's end is before or equal to toDate
            return monthEndDate <= toDate;
        });
        
        monthLabels = filteredRows.map(r => r.MonthName || '');

        currentFY = filteredRows.map(r => {
            const v = r.CurrentFYQty;
            return (v === null || v === undefined || v === '') ? 0 : Number(v);
        });
        prevFY = filteredRows.map(r => {
            const v = r.PrevFYQty;
            return (v === null || v === undefined || v === '') ? 0 : Number(v);
        });

    } else {
        // fallback to existing sample arrays (keeps backward compatibility)
        monthLabels = labels;
        currentFY = currentYearSales;
        prevFY = previousYearSales;
    }

    // Apply a sensible min-width so Chart area can horizontally scroll when many months exist,
    // but clear it for small label counts to avoid unexpected scrolling.
    if (monthLabels.length > 8) {
        const minW = Math.min(Math.max(400, monthLabels.length * 60), 1400);
        canvas.style.minWidth = minW + 'px';
    } else {
        canvas.style.minWidth = '';
    }

    // Create bar chart comparing current and previous financial year month-wise
    // Use stunning multi-stop gradients for professional appearance
    
    // Current FY - Vibrant Red to Orange gradient with shine effect
    const currentFYGradient = ctx.createLinearGradient(0, 0, 0, 400);
    currentFYGradient.addColorStop(0, 'rgba(255, 107, 107, 1)');      // Bright coral red (top shine)
    currentFYGradient.addColorStop(0.15, 'rgba(255, 118, 117, 0.98)'); // Light coral
    currentFYGradient.addColorStop(0.5, 'rgba(239, 87, 119, 0.95)');   // Vibrant pink-red (middle)
    currentFYGradient.addColorStop(0.85, 'rgba(192, 57, 43, 0.92)');   // Deep red
    currentFYGradient.addColorStop(1, 'rgba(165, 42, 42, 0.9)');       // Dark red (bottom depth)

    // Previous FY - Rich Blue to Cyan gradient with glass effect
    const prevFYGradient = ctx.createLinearGradient(0, 0, 0, 400);
    prevFYGradient.addColorStop(0, 'rgba(116, 185, 255, 1)');          // Sky blue (top shine)
    prevFYGradient.addColorStop(0.15, 'rgba(99, 179, 237, 0.98)');     // Light blue
    prevFYGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.95)');      // Azure blue (middle)
    prevFYGradient.addColorStop(0.85, 'rgba(41, 128, 185, 0.92)');     // Deep blue
    prevFYGradient.addColorStop(1, 'rgba(30, 95, 145, 0.9)');          // Navy blue (bottom depth)

    window.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Current FY Sales',
                    data: currentFY,
                    backgroundColor: currentFYGradient,
                    borderColor: 'rgba(255, 107, 107, 1)',
                    borderWidth: 3,
                    borderRadius: 12,
                    borderSkipped: false,
                    barPercentage: 0.75,
                    categoryPercentage: 0.85
                },
                {
                    label: 'Previous FY Sales',
                    data: prevFY,
                    backgroundColor: prevFYGradient,
                    borderColor: 'rgba(116, 185, 255, 1)',
                    borderWidth: 3,
                    borderRadius: 12,
                    borderSkipped: false,
                    barPercentage: 0.75,
                    categoryPercentage: 0.85
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (ctx) {
                            const val = ctx.raw;
                            if (val === null || val === undefined) return '';
                            return ctx.dataset.label + ': ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: function (context) {
                        // Align labels based on available space to prevent overlap
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.chart.data.datasets[0].data, ...context.chart.data.datasets[1].data);

                        // For smaller values, place labels inside the bar to save space
                        if (value < maxValue * 0.15) {
                            return 'start';
                        }
                        return 'end';
                    },
                    offset: function (context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.chart.data.datasets[0].data, ...context.chart.data.datasets[1].data);

                        // Adjust offset based on bar height
                        if (value < maxValue * 0.15) {
                            return 4; // Inside bar
                        }
                        return -2; // Outside bar
                    },
                    color: function (context) {
                        const value = context.dataset.data[context.dataIndex];
                        const maxValue = Math.max(...context.chart.data.datasets[0].data, ...context.chart.data.datasets[1].data);

                        // White text for labels inside bars
                        if (value < maxValue * 0.15) {
                            return '#fff';
                        }
                        return '#222';
                    },
                    font: function (context) {
                        // Responsive font sizing based on screen width
                        const width = context.chart.width;
                        let size = 11;
                        if (width < 400) {
                            size = 8;
                        } else if (width < 600) {
                            size = 9;
                        } else if (width < 800) {
                            size = 10;
                        }
                        return {
                            weight: 'bold',
                            size: size
                        };
                    },
                    formatter: function (value, context) {
                        if (value === null || value === undefined) return '';

                        // On mobile, show labels only if screen is wide enough or alternate labels
                        const chartWidth = context.chart.width;
                        const isMobile = window.innerWidth < 768;

                        // For very narrow charts on mobile, show every other label
                        if (isMobile && chartWidth < 500) {
                            const dataIndex = context.dataIndex;
                            // Show label for even indices only
                            if (dataIndex % 2 !== 0) {
                                return '';
                            }
                        }

                        // Format number - show shorter format on mobile or desktop with many bars
                        const num = Number(value);
                        const barCount = context.chart.data.labels.length;

                        // Use compact format for crowded charts or mobile
                        if ((isMobile && num >= 1000) || (barCount > 8 && num >= 1000)) {
                            // Show abbreviated format (e.g., 5.6k)
                            if (num >= 1000000) {
                                return (num / 1000000).toFixed(1) + 'M';
                            }
                            return (num / 1000).toFixed(1) + 'k';
                        }

                        return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    },
                    display: function (context) {
                        // Hide labels if value is too small or on very narrow mobile screens
                        const value = context.dataset.data[context.dataIndex];
                        if (!value || value < 1) return false;

                        const isMobile = window.innerWidth < 768;
                        const chartWidth = context.chart.width;

                        // On very small screens, be more selective
                        if (isMobile && chartWidth < 400) {
                            // Only show labels for larger values
                            const maxValue = Math.max(...context.dataset.data.filter(v => v));
                            return value >= maxValue * 0.3;
                        }

                        return true;
                    },
                    rotation: 0,
                    clamp: true,
                    clip: true
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: true,
                        borderColor: '#e0e0e0',
                        borderWidth: 2
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 11 : 12,
                            weight: '600'
                        },
                        color: '#495057',
                        padding: 8
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: true,
                        borderColor: '#e0e0e0',
                        borderWidth: 2
                    },
                    ticks: {
                        callback: function (value) {
                            if (value === null || value === undefined) return '';
                            const num = Number(value);
                            
                            // Use compact format (K/M) for better space usage on mobile
                            if (num >= 1000000) {
                                return (num / 1000000).toFixed(1) + 'M';
                            } else if (num >= 1000) {
                                return (num / 1000).toFixed(1) + 'K';
                            }
                            
                            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                        },
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12,
                            weight: '500'
                        },
                        color: '#6c757d',
                        padding: 8
                    },
                    title: {
                        display: true,
                        text: 'Sales',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: '#495057'
                    }
                }
            }
        },
        plugins: [
            // Custom plugin for bar shadows and 3D effect
            {
                id: 'barShadowPlugin',
                beforeDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    
                    chart.data.datasets.forEach((dataset, datasetIndex) => {
                        const meta = chart.getDatasetMeta(datasetIndex);
                        if (!meta.hidden) {
                            meta.data.forEach((element) => {
                                // Draw shadow
                                ctx.shadowColor = datasetIndex === 0 ? 'rgba(192, 57, 43, 0.4)' : 'rgba(41, 128, 185, 0.4)';
                                ctx.shadowBlur = 15;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 4;
                                
                                // Create path for rounded rectangle shadow
                                const {x, y, base, width, height} = element;
                                const radius = 12;
                                
                                ctx.beginPath();
                                ctx.moveTo(x - width/2 + radius, base);
                                ctx.lineTo(x - width/2 + radius, y + radius);
                                ctx.quadraticCurveTo(x - width/2, y, x - width/2 + radius, y);
                                ctx.lineTo(x + width/2 - radius, y);
                                ctx.quadraticCurveTo(x + width/2, y, x + width/2, y + radius);
                                ctx.lineTo(x + width/2, base);
                                ctx.closePath();
                                
                                ctx.fillStyle = datasetIndex === 0 ? 
                                    'rgba(192, 57, 43, 0.1)' : 'rgba(41, 128, 185, 0.1)';
                                ctx.fill();
                            });
                        }
                    });
                    
                    ctx.restore();
                }
            },
            ...(typeof ChartDataLabels !== 'undefined' ? [window.ChartDataLabels] : [])
        ]
    });

    // Ensure the chart is sized correctly after insertion
    try { setTimeout(() => window.barChartInstance.resize(), 50); } catch (e) { /* ignore */ }

    setBestSaleDetils();
}

// Process raw data for Sales Tab (monthly aggregation)
function processRawDataForSalesTab(rawData) {
    const monthMap = new Map();
    const monthOrder = {
        'Apr': 1, 'May': 2, 'Jun': 3, 'Jul': 4, 'Aug': 5, 'Sep': 6,
        'Oct': 7, 'Nov': 8, 'Dec': 9, 'Jan': 10, 'Feb': 11, 'Mar': 12
    };

    // Month name mapping to ensure 3-letter abbreviations
    const monthAbbreviations = {
        'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
        'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
        'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec',
        // Also handle already abbreviated months
        'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
        'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Aug',
        'Sep': 'Sep', 'Oct': 'Oct', 'Nov': 'Nov', 'Dec': 'Dec'
    };

    // Handle numeric month numbers (1-12) - FY starts in April
    const monthNumberToName = {
        1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
        7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
    };

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    rawData.forEach(row => {
        let month = row.InvoiceMonth;
        if (!month && month !== 0) return;

        // Convert numeric month to name
        if (typeof month === 'number' || !isNaN(month)) {
            month = monthNumberToName[parseInt(month)] || month;
        }

        // Convert to 3-letter abbreviation if needed
        month = monthAbbreviations[month] || month;

        if (!monthMap.has(month)) {
            monthMap.set(month, {
                MonthName: month,
                MonthOrder: monthOrder[month] || 0,
                CurrentFYQty: 0,
                PrevFYQty: 0
            });
        }

        const monthData = monthMap.get(month);
        const qty = Number(row.SalesQtyMT) || 0;

        // Determine if this is current FY or previous FY based on invoice date
        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);

        // Check if invoice is within user-selected date range
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);

        if (invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange) {
            monthData.CurrentFYQty += qty;
        } else if (!isInUserDateRange) {
            // If not in user date range, treat as previous year for comparison
            monthData.PrevFYQty += qty;
        } else {
            monthData.PrevFYQty += qty;
        }
    });

    return Array.from(monthMap.values()).sort((a, b) => a.MonthOrder - b.MonthOrder);
}
function setBestSaleDetils() {
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        $('#kpi-selected-year')[0].innerHTML = '0';
        $('#kpi-best-month')[0].innerHTML = '-';
        $('#kpi-best-month-amt')[0].innerHTML = '0';
        $('#kpi-best-day-date')[0].innerHTML = '-';
        $('#kpi-best-day-amt')[0].innerHTML = '0';
        return;
    }

    // Calculate best sale details from raw data
    const details = processBestSaleDetails(G_RawDashboardData);

    $('#kpi-selected-year')[0].innerHTML = formatNumber(details.TotalCurrentSales);
    $('#kpi-best-month')[0].innerHTML = details.BestMonthName;
    $('#kpi-best-month-amt')[0].innerHTML = formatNumber(details.BestMonthSale);
    $('#kpi-best-day-date')[0].innerHTML = details.BestDayDate;
    $('#kpi-best-day-amt')[0].innerHTML = formatNumber(details.BestDaySale);
}

// Process raw data for best sale details
function processBestSaleDetails(rawData) {
    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    const currentFYData = rawData.filter(row => {
        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);
        return invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange;
    });

    // Total current year sales
    const totalCurrentSales = currentFYData.reduce((sum, row) => sum + (Number(row.SalesQtyMT) || 0), 0);

    // Best month
    const monthSales = new Map();
    currentFYData.forEach(row => {
        const month = row.InvoiceMonth;
        if (month) {
            monthSales.set(month, (monthSales.get(month) || 0) + (Number(row.SalesQtyMT) || 0));
        }
    });

    let bestMonthName = '-';
    let bestMonthSale = 0;
    monthSales.forEach((sales, month) => {
        if (sales > bestMonthSale) {
            bestMonthSale = sales;
            bestMonthName = month;
        }
    });

    // Best day
    const daySales = new Map();
    currentFYData.forEach(row => {
        const date = row.InvoiceDate;
        if (date) {
            daySales.set(date, (daySales.get(date) || 0) + (Number(row.SalesQtyMT) || 0));
        }
    });

    let bestDayDate = '-';
    let bestDaySale = 0;
    daySales.forEach((sales, date) => {
        if (sales > bestDaySale) {
            bestDaySale = sales;
            bestDayDate = new Date(date).toLocaleDateString('en-IN');
        }
    });

    return {
        TotalCurrentSales: totalCurrentSales,
        BestMonthName: bestMonthName,
        BestMonthSale: bestMonthSale,
        BestDayDate: bestDayDate,
        BestDaySale: bestDaySale
    };
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

async function renderRegionalSection() {
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for regional section');
        return;
    }

    console.log('Rendering regional section from raw data...');

    // Process raw data for regional analysis
    const regionalData = processRawDataForRegionalTab(G_RawDashboardData);

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

    // Render attractive regional cards (top regions)
    renderRegionalCards(regionalData);

    // Render map with marker clustering for better performance
    await renderOptimizedMap(regionalData);
}

// Render attractive regional cards for top regions
function renderRegionalCards(regionalData) {
    const container = document.getElementById('regionalCardsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!regionalData || regionalData.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No regional data available</div>';
        return;
    }

    // Take top 10 regions for display
    const topRegions = regionalData.slice(0, 10);
    const maxSales = topRegions.length > 0 ? topRegions[0].CurrentYearSales : 1;

    // Medal icons for top 3
    const rankIcons = {
        1: '🥇',
        2: '🥈',
        3: '🥉'
    };

    topRegions.forEach((region, index) => {
        const rank = index + 1;
        const cityName = region.ConsigneeCityName || 'Unknown';
        const stateName = region.ConsigneeStateName || '';
        const sales = Number(region.CurrentYearSales || 0);
        const percentage = maxSales > 0 ? (sales / maxSales) * 100 : 0;

        // Format sales value
        const salesFormatted = formatNumber(sales);

        // Create card element
        const card = document.createElement('div');
        card.className = `regional-card rank-${Math.min(rank, 5)}`;
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="regional-card-header">
                <div class="regional-card-city">
                    ${escapeHtml(cityName)}
                </div>
                <div class="regional-card-rank">
                    ${rank <= 3 ? rankIcons[rank] : '#' + rank}
                </div>
            </div>
            <div class="regional-card-sales">
                ${salesFormatted}
            </div>
            <div class="regional-card-state">
                <i class="fas fa-map-marker-alt me-1"></i>${escapeHtml(stateName)}
            </div>
            <div class="regional-card-bar">
                <div class="regional-card-bar-fill" style="width: 0%" data-width="${percentage.toFixed(1)}%"></div>
            </div>
        `;

        container.appendChild(card);
    });

    // Animate progress bars after a short delay
    setTimeout(() => {
        const bars = container.querySelectorAll('.regional-card-bar-fill');
        bars.forEach(bar => {
            const targetWidth = bar.getAttribute('data-width');
            bar.style.width = targetWidth;
        });
    }, 100);
}

// NEW: Optimized map rendering with marker clustering and progressive loading
async function renderOptimizedMap(regionalData) {
    try {
        if (typeof L === 'undefined' || regionalData.length === 0) {
            console.warn('Leaflet not available or no regional data');
            return;
        }

        const mapEl = document.getElementById('regionalMap');
        const mapSkeleton = document.getElementById('mapSkeleton');
        if (!mapEl) return;

        console.log('Rendering optimized map with', regionalData.length, 'cities');
        console.log('Rendering optimized map with regionalDataobj', regionalData);

        // Initialize map if not already created
        if (!window._regionalLeafletMap) {
            // Show skeleton while initializing
            if (mapSkeleton) mapSkeleton.classList.remove('hidden');

            // Create map without bounds restriction first
            window._regionalLeafletMap = L.map(mapEl, {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true, // Better performance for many markers
                minZoom: 4,
                maxZoom: 18
            });

            // Set initial view to center of India
            window._regionalLeafletMap.setView([20.5937, 78.9629], 5);

            // Use CartoDB Positron for faster loading and cleaner look
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 18,
                minZoom: 4
            }).addTo(window._regionalLeafletMap);

            console.log('Map initialized successfully');
        }

        // Clear existing marker cluster group
        if (window._regionalMarkerCluster) {
            window._regionalLeafletMap.removeLayer(window._regionalMarkerCluster);
        }

        // Clear existing polygon layer
        if (window._regionalLayerGroup) {
            window._regionalLayerGroup.clearLayers();
        } else {
            window._regionalLayerGroup = L.layerGroup().addTo(window._regionalLeafletMap);
        }

        // Check if MarkerCluster is available
        const hasMarkerCluster = typeof L.markerClusterGroup === 'function';
        
        if (hasMarkerCluster) {
            // Initialize marker cluster group with custom styling
            window._regionalMarkerCluster = L.markerClusterGroup({
                maxClusterRadius: 80,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function(cluster) {
                    const count = cluster.getChildCount();
                    let c = ' marker-cluster-';
                    if (count < 10) {
                        c += 'small';
                    } else if (count < 30) {
                        c += 'medium';
                    } else {
                        c += 'large';
                    }
                    return new L.DivIcon({ 
                        html: '<div><span>' + count + '</span></div>',
                        className: 'marker-cluster' + c, 
                        iconSize: new L.Point(40, 40) 
                    });
                }
            });
        } else {
            console.warn('MarkerCluster not available, using regular layer group');
            window._regionalMarkerCluster = L.layerGroup();
        }

        // Use simplified markers instead of fetching complex polygons
        // This dramatically improves performance
        const markers = [];
        const bounds = [];

        // Process cities sequentially to respect Nominatim rate limit (1 req/sec)
        // Show progress incrementally for better UX
        let processedCount = 0;
        const totalCities = regionalData.length;

        for (let i = 0; i < regionalData.length; i++) {
            const item = regionalData[i];
            const cityName = item.ConsigneeCityName;
            const stateName = item.ConsigneeStateName;
            const sales = item.CurrentYearSales;

            if (!cityName) continue;

            try {
                // Get only center coordinates (much faster than full polygon)
                // Pass both city and state for better accuracy
                const geo = await getCityCenter(cityName, stateName);
                if (geo && geo.center && Array.isArray(geo.center) && geo.center.length === 2) {
                    // Create custom marker with sales data
                    const salesValue = formatNumber(sales);
                    const marker = L.marker(geo.center, {
                        icon: L.divIcon({
                            className: 'custom-map-marker',
                            html: `<div style="background: #c0392b; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-map-marker-alt" style="color: white; font-size: 16px;"></i></div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    });

                    // Enhanced popup with better styling
                    marker.bindPopup(`
                        <div style="min-width: 150px;">
                            <strong style="font-size: 16px; color: #c0392b;">${cityName}</strong><br/>
                            <span style="color: #666;">${stateName}</span><br/>
                            <hr style="margin: 8px 0;">
                            <strong>Sales:</strong> <span style="color: #27ae60; font-weight: bold;">${salesValue}</span>
                        </div>
                    `);

                    markers.push(marker);
                    bounds.push(geo.center);

                    // Add marker immediately for progressive display
                    if (typeof window._regionalMarkerCluster.addLayer === 'function') {
                        window._regionalMarkerCluster.addLayer(marker);
                    }
                }
            } catch (e) {
                console.warn('Failed to get location for', cityName, stateName, e);
            }

            processedCount++;

            // Update progress in skeleton
            if (mapSkeleton && !mapSkeleton.classList.contains('hidden')) {
                const progress = Math.round((processedCount / totalCities) * 100);
                const skeletonText = mapSkeleton.querySelector('div');
                if (skeletonText) {
                    skeletonText.innerHTML = `
                        <i class="fas fa-map-marked-alt fa-3x mb-3" style="opacity: 0.3;"></i>
                        <div>Loading cities... ${processedCount}/${totalCities} (${progress}%)</div>
                    `;
                }
            }

            // Add markers to map progressively (every 5 cities)
            if (processedCount % 5 === 0 || processedCount === totalCities) {
                if (!window._regionalLeafletMap.hasLayer(window._regionalMarkerCluster)) {
                    window._regionalLeafletMap.addLayer(window._regionalMarkerCluster);
                }
            }

            // Hide skeleton after first 3 cities are processed (regardless of success)
            if (processedCount === 3 && mapSkeleton) {
                mapSkeleton.classList.add('hidden');
            }

            // Add small delay to respect Nominatim rate limit (1 req/sec)
            // Only delay if not cached (cache hits are instant)
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // IMPORTANT: Hide skeleton after all cities are processed
        if (mapSkeleton) {
            mapSkeleton.classList.add('hidden');
            // Force display:none as extra safety measure for mobile black screen prevention
            mapSkeleton.style.display = 'none';
        }

        console.log(`Loaded ${markers.length} markers from ${totalCities} cities`);

        // Ensure marker cluster is added to map
        if (markers.length > 0 && !window._regionalLeafletMap.hasLayer(window._regionalMarkerCluster)) {
            window._regionalLeafletMap.addLayer(window._regionalMarkerCluster);
        }

        // Fit map to show all markers
        if (bounds.length > 0) {
            try {
                const latLngBounds = L.latLngBounds(bounds);
                
                // Calculate appropriate zoom based on number of markers
                let maxZoomLevel = 7; // Default zoom
                if (bounds.length <= 5) {
                    maxZoomLevel = 9; // Zoom in more for few cities
                } else if (bounds.length <= 20) {
                    maxZoomLevel = 8; // Medium zoom for moderate cities
                }
                
                window._regionalLeafletMap.fitBounds(latLngBounds, { 
                    padding: [50, 50],
                    maxZoom: maxZoomLevel,
                    animate: true
                });
                console.log(`Map bounds fitted to ${bounds.length} markers with max zoom ${maxZoomLevel}`);
            } catch (e) {
                console.error('Could not fit bounds:', e);
                // Fallback: center on India
                window._regionalLeafletMap.setView([20.5937, 78.9629], 5);
            }
        } else {
            console.warn('No markers to display - showing India center view');
            // Default India view when no markers
            window._regionalLeafletMap.setView([20.5937, 78.9629], 5);
        }

        // Ensure map renders properly - invalidate size multiple times for reliability
        setTimeout(function () {
            try {
                if (window._regionalLeafletMap) {
                    window._regionalLeafletMap.invalidateSize();
                    console.log('Map size invalidated');
                }
            } catch (e) { 
                console.warn('Map invalidate size error:', e);
            }
        }, 250);

        // Additional invalidation after a longer delay to ensure everything is rendered
        setTimeout(function () {
            try {
                if (window._regionalLeafletMap) {
                    window._regionalLeafletMap.invalidateSize();
                }
            } catch (e) { }
        }, 1000);

        console.log(`Map rendered with ${markers.length} markers`);

    } catch (e) {
        console.error('Map render failed:', e);
        // Hide skeleton on error
        const mapSkeleton = document.getElementById('mapSkeleton');
        if (mapSkeleton) mapSkeleton.classList.add('hidden');
    }
}

// NEW: Simplified function to get only city center (much faster than full polygon)
async function getCityCenter(cityName, stateName = '') {
    if (!cityName) return null;
    
    // Create composite key for cache using both city and state
    const cityNormalized = cityName.trim().toLowerCase();
    const stateNormalized = stateName ? stateName.trim().toLowerCase() : '';
    const cacheKey = stateNormalized ? `${cityNormalized}|${stateNormalized}` : cityNormalized;
    
    // Check cache first (instant return for cached cities)
    if (_cityGeoCache.has(cacheKey)) {
        return _cityGeoCache.get(cacheKey);
    }

    // Retry logic for failed requests
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Build search query with city and state for better accuracy
            let searchQuery = cityName;
            if (stateName) {
                searchQuery += ', ' + stateName;
            }
            searchQuery += ', India';
            
            // Simple Nominatim query without polygon (much faster)
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(searchQuery)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'BizSol-WebERP/1.0'
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    const item = data[0];
                    const lat = Number(item.lat);
                    const lon = Number(item.lon);

                    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                        const result = { center: [lat, lon], polygon: null };
                        _cityGeoCache.set(cacheKey, result);
                        return result;
                    }
                }
            } else if (response.status === 429) {
                // Rate limit hit - wait longer before retry
                console.warn(`Rate limit hit for ${cityName}, waiting before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            // No valid data found
            if (attempt === maxRetries) {
                console.warn(`No location data found for ${cityName}, ${stateName}`);
                return null;
            }

        } catch (e) {
            lastError = e;
            
            // Don't retry on timeout errors, just fail fast
            if (e.name === 'TimeoutError' || e.name === 'AbortError') {
                console.warn(`Timeout fetching location for ${cityName}, ${stateName}`);
                return null;
            }

            // For network errors, retry with exponential backoff
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
                console.warn(`Retry ${attempt + 1}/${maxRetries} for ${cityName} after ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.warn(`Failed to fetch location for ${cityName}, ${stateName} after ${maxRetries} retries:`, lastError);
    return null;
}

// Process raw data for Regional Tab (city-wise aggregation)
function processRawDataForRegionalTab(rawData) {
    const cityMap = new Map();

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    // Filter for current FY data within user-selected date range
    const currentFYData = rawData.filter(row => {
        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);
        return invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange;
    });

    currentFYData.forEach(row => {
        const city = row.ConsigneeCityName;
        const state = row.ConsigneeStateName;
        const sales = Number(row.SalesQtyMT) || 0;

        if (!city) return;

        // Create a composite key using both city and state (normalized to handle variations)
        // This prevents duplicate markers for same city in different states
        const cityNormalized = (city || '').toString().trim().toUpperCase();
        const stateNormalized = (state || '').toString().trim().toUpperCase();
        const compositeKey = `${cityNormalized}|${stateNormalized}`;

        if (!cityMap.has(compositeKey)) {
            cityMap.set(compositeKey, {
                ConsigneeCityName: city, // Keep original casing for display
                ConsigneeStateName: state, // Keep original casing for display
                CurrentYearSales: 0
            });
        }

        cityMap.get(compositeKey).CurrentYearSales += sales;
    });

    // Convert to array and sort by sales descending
    return Array.from(cityMap.values())
        .sort((a, b) => b.CurrentYearSales - a.CurrentYearSales);
}

/* ===== NEW: Client charts + table rendering ===== */

function formatNumber(v) {
    if (v === null || v === undefined) return '';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderClientSection() {
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for client section');
        return;
    }

    console.log('Rendering client section from raw data...');

    // Process raw data for client analysis
    const response = processRawDataForClientTab(G_RawDashboardData);
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
        BizsolCustomFilterGrid.CreateDataTable("clientSalesTableHeader", "clientSalesTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
        // Top client
        const topClient = response[0]["Client Name"] || '-';
        const topEl = document.getElementById('top-client-name');
        if (topEl) topEl.textContent = topClient;
    }
}

// Process raw data for Client Tab (consignee-wise aggregation with growth)
function processRawDataForClientTab(rawData) {
    const clientMap = new Map();

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    rawData.forEach(row => {
        const clientCode = row.ConsigneeMaster_Code;
        const clientName = row.ConsigneeName;
        const sales = Number(row.SalesQtyMT) || 0;

        if (!clientName) return;

        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const prevFYStart = new Date(row.PrevFY_FromDate);
        const prevFYEnd = new Date(row.PrevFY_ToDate);

        // Check if invoice is within user-selected date range
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);

        if (!clientMap.has(clientCode)) {
            clientMap.set(clientCode, {
                "Client Name": clientName,
                "Current Year Sales": 0,
                "Last Year Sales": 0,
                "Growth (%)": 0
            });
        }

        const clientData = clientMap.get(clientCode);

        if (invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange) {
            clientData["Current Year Sales"] += sales;
        } else if (invoiceDate >= prevFYStart && invoiceDate <= prevFYEnd) {
            // Previous year sales for growth comparison (not filtered)
            clientData["Last Year Sales"] += sales;
        }
    });

    // Calculate growth percentage
    const result = Array.from(clientMap.values()).map(client => {
        const current = client["Current Year Sales"];
        const last = client["Last Year Sales"];

        if (last > 0) {
            client["Growth (%)"] = ((current - last) / last * 100).toFixed(2);
        } else if (current > 0) {
            client["Growth (%)"] = '100.00';
        } else {
            client["Growth (%)"] = '0.00';
        }

        return client;
    });

    // Sort by current year sales descending
    return result.sort((a, b) => b["Current Year Sales"] - a["Current Year Sales"]);
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
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for product specification section');
        return;
    }

    console.log('Rendering product specification section from raw data...');

    // Process raw data for product specification
    const response = processRawDataForProductSpecificationTab(G_RawDashboardData);

    if (!response || response.length === 0) {
        console.warn('No product specification data after processing');
        return;
    }

    // Get top thickness and size from first record (assuming sorted by highest sales)
    const topThickness = response[0]['Thickness'] || '-';
    const topSize = response[0]['Size'] || '-';

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
                        top: 40,
                        bottom: 40,
                        left: 40,
                        right: 40
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    datalabels: {
                        anchor: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'end' : 'center';
                        },
                        align: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'start' : 'center';
                        },
                        offset: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 10 : 0;
                        },
                        color: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? '#333' : '#fff';
                        },
                        font: function (context) {
                            const isMobile = window.innerWidth < 768;
                            return {
                                weight: 'bold',
                                size: isMobile ? 9 : 10
                            };
                        },
                        formatter: function (value, context) {
                            if (value === null || value === undefined) return '';

                            const num = Number(value);
                            const isMobile = window.innerWidth < 768;

                            if (num >= 5000 || isMobile) {
                                if (num >= 1000000) {
                                    return (num / 1000000).toFixed(1) + 'M';
                                }
                                return (num / 1000).toFixed(1) + 'k';
                            }

                            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                        },
                        clip: false,
                        display: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;

                            return percentage > 2;
                        }
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
                        top: 40,
                        bottom: 40,
                        left: 40,
                        right: 40
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 10,
                            font: { size: 11 }
                        }
                    },
                    datalabels: {
                        anchor: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'end' : 'center';
                        },
                        align: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'start' : 'center';
                        },
                        offset: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 10 : 0;
                        },
                        color: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? '#333' : '#fff';
                        },
                        font: function (context) {
                            const isMobile = window.innerWidth < 768;
                            return { weight: 'bold', size: isMobile ? 9 : 10 };
                        },
                        formatter: function (value, context) {
                            if (value === null || value === undefined) return '';
                            const num = Number(value);
                            const isMobile = window.innerWidth < 768;
                            if (num >= 5000 || isMobile) {
                                if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                                return (num / 1000).toFixed(1) + 'k';
                            }
                            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                        },
                        clip: false,
                        display: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage > 2;
                        }
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
}

// Process raw data for Product Specification Tab (thickness/size-wise aggregation)
function processRawDataForProductSpecificationTab(rawData) {
    const specMap = new Map();

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    rawData.forEach(row => {
        const thickness = row.ItemThickness || '';
        const size = row.ItemSize || '';
        const key = `${thickness}|${size}`;
        const sales = Number(row.SalesQtyMT) || 0;

        if (!thickness && !size) return;

        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const prevFYStart = new Date(row.PrevFY_FromDate);
        const prevFYEnd = new Date(row.PrevFY_ToDate);

        // Check if invoice is within user-selected date range
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);

        if (!specMap.has(key)) {
            specMap.set(key, {
                "Thickness": thickness,
                "Size": size,
                "Current Year Sales": 0,
                "Last Year Sales": 0,
                "Products Growth (%)": 0
            });
        }

        const specData = specMap.get(key);

        if (invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange) {
            specData["Current Year Sales"] += sales;
        } else if (invoiceDate >= prevFYStart && invoiceDate <= prevFYEnd) {
            // Previous year sales for growth comparison (not filtered)
            specData["Last Year Sales"] += sales;
        }
    });

    // Calculate growth percentage
    const result = Array.from(specMap.values()).map(spec => {
        const current = spec["Current Year Sales"];
        const last = spec["Last Year Sales"];

        if (last > 0) {
            spec["Products Growth (%)"] = ((current - last) / last * 100).toFixed(2);
        } else if (current > 0) {
            spec["Products Growth (%)"] = '100.00';
        } else {
            spec["Products Growth (%)"] = '0.00';
        }

        return spec;
    });

    // Sort by current year sales descending
    return result.sort((a, b) => b["Current Year Sales"] - a["Current Year Sales"]);
}

/* ===== Product rendering ===== */
function renderProductSection() {
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for product section');
        return;
    }

    console.log('Rendering product section from raw data...');

    // Process raw data for product analysis
    const response = processRawDataForProductTab(G_RawDashboardData);

    if (!response || response.length === 0) {
        console.warn('No product data after processing');
        return;
    }

    // Get top product and group from first record (assuming sorted by highest sales)
    const topProduct = response[0]['Products Name'] || '-';
    const topGroup = response[0]['Group Name'] || '-';

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
                        top: 40,
                        bottom: 40,
                        left: 40,
                        right: 40
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    datalabels: {
                        anchor: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'end' : 'center';
                        },
                        align: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 'start' : 'center';
                        },
                        offset: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? 10 : 0;
                        },
                        color: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;
                            return percentage < 15 ? '#333' : '#fff';
                        },
                        font: function (context) {
                            const isMobile = window.innerWidth < 768;
                            return {
                                weight: 'bold',
                                size: isMobile ? 9 : 10
                            };
                        },
                        formatter: function (value, context) {
                            if (value === null || value === undefined) return '';

                            const num = Number(value);
                            const isMobile = window.innerWidth < 768;

                            if (num >= 5000 || isMobile) {
                                if (num >= 1000000) {
                                    return (num / 1000000).toFixed(1) + 'M';
                                }
                                return (num / 1000).toFixed(1) + 'k';
                            }

                            return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
                        },
                        clip: false,
                        display: function (context) {
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const value = dataset.data[context.dataIndex];
                            const percentage = (value / total) * 100;

                            return percentage > 2;
                        }
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

    BizsolCustomFilterGrid.CreateDataTable("productSalesTableHeader", "productSalesTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
}

// Process raw data for Product Tab (product/group-wise aggregation)
function processRawDataForProductTab(rawData) {
    const productMap = new Map();

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    rawData.forEach(row => {
        const productCode = row.ItemMaster_Code;
        const productName = row.ItemName || row.MasterItemName;
        const groupName = row.ItemCategory;
        const sales = Number(row.SalesQtyMT) || 0;

        if (!productName) return;

        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const prevFYStart = new Date(row.PrevFY_FromDate);
        const prevFYEnd = new Date(row.PrevFY_ToDate);

        // Check if invoice is within user-selected date range
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);

        if (!productMap.has(productCode)) {
            productMap.set(productCode, {
                "Products Name": productName,
                "Group Name": groupName || '-',
                "Current Year Sales": 0,
                "Last Year Sales": 0,
                "Products Growth (%)": 0
            });
        }

        const productData = productMap.get(productCode);

        if (invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange) {
            productData["Current Year Sales"] += sales;
        } else if (invoiceDate >= prevFYStart && invoiceDate <= prevFYEnd) {
            // Previous year sales for growth comparison (not filtered)
            productData["Last Year Sales"] += sales;
        }
    });

    // Calculate growth percentage
    const result = Array.from(productMap.values()).map(product => {
        const current = product["Current Year Sales"];
        const last = product["Last Year Sales"];

        if (last > 0) {
            product["Products Growth (%)"] = ((current - last) / last * 100).toFixed(2);
        } else if (current > 0) {
            product["Products Growth (%)"] = '100.00';
        } else {
            product["Products Growth (%)"] = '0.00';
        }

        return product;
    });

    // Sort by current year sales descending
    return result.sort((a, b) => b["Current Year Sales"] - a["Current Year Sales"]);
}

/* ===== Target & Growth rendering ===== */

function renderTargetGrowthSection() {
    if (!G_IsDataLoaded || G_RawDashboardData.length === 0) {
        console.warn('No raw data available for target growth section');
        return;
    }

    console.log('Rendering target growth section from raw data...');

    // Process raw data for target growth analysis
    const response = processRawDataForTargetGrowthTab(G_RawDashboardData);
    
    if (!response || response.length === 0) {
        console.warn('No target growth data after processing');
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

    // OPTION 3: Bullet Chart (Professional Target Comparison)
    // Specialized chart designed for comparing actual vs target with performance zones
    const gaugeCanvas = document.getElementById('targetGaugeChart');
    if (gaugeCanvas && response.length > 0) {
        // Aggregate totals
        let totalCurrent = 0;
        let totalTarget = 0;
        response.forEach(function (r) {
            totalCurrent += Number(r['Current Year Sales'] || 0);
            totalTarget += Number(r['Target'] || 0);
        });

        const achievedPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

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

        // Define performance zones based on target
        const maxScale = Math.max(totalTarget * 1.2, totalCurrent * 1.1); // Show 120% of target or 110% of current, whichever is higher
        const zone1 = totalTarget * 0.5;   // 0-50% Poor (red)
        const zone2 = totalTarget * 0.75;  // 50-75% Fair (orange)
        const zone3 = totalTarget;         // 75-100% Good (yellow)
        const zone4 = maxScale;            // 100%+ Excellent (green background)

        // Create performance gradient
        const performanceGradient = ctx.createLinearGradient(0, 0, 600, 0);
        performanceGradient.addColorStop(0, 'rgba(52, 152, 219, 1)');      // Blue
        performanceGradient.addColorStop(0.5, 'rgba(46, 204, 113, 0.95)'); // Green
        performanceGradient.addColorStop(1, 'rgba(26, 188, 156, 0.9)');    // Teal

        // Responsive padding based on screen size
        const isMobileChart = window.innerWidth < 768;
        const isTabletChart = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Adjust bar thickness and padding for mobile
        const barThickness = isMobileChart ? 40 : (isTabletChart ? 60 : 80);
        const performanceBarThickness = isMobileChart ? 30 : (isTabletChart ? 40 : 50);
        
        window.targetGaugeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Performance'],
                datasets: [
                    // Background zones (qualitative ranges)
                    {
                        label: 'Poor (0-50%)',
                        data: [zone1],
                        backgroundColor: 'rgba(231, 76, 60, 0.15)',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barThickness: barThickness,
                        order: 4
                    },
                    {
                        label: 'Fair (50-75%)',
                        data: [zone2],
                        backgroundColor: 'rgba(230, 126, 34, 0.15)',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barThickness: barThickness,
                        order: 3
                    },
                    {
                        label: 'Good (75-100%)',
                        data: [zone3],
                        backgroundColor: 'rgba(241, 196, 15, 0.15)',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barThickness: barThickness,
                        order: 2
                    },
                    {
                        label: 'Excellent (100%+)',
                        data: [zone4],
                        backgroundColor: 'rgba(46, 204, 113, 0.08)',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barThickness: barThickness,
                        order: 1
                    },
                    // Actual performance bar (featured measure)
                    {
                        label: 'Quantity Sold',
                        data: [totalCurrent],
                        backgroundColor: performanceGradient,
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 3,
                        borderRadius: 8,
                        barThickness: performanceBarThickness,
                        order: 0
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: isMobileChart ? 80 : (isTabletChart ? 90 : 10),
                        right: isMobileChart ? 10 : (isTabletChart ? 100 : 120)
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            filter: function(item, chart) {
                                // Show all legends
                                return true;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        padding: 15,
                        titleFont: {
                            size: 15,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        callbacks: {
                            label: function (ctx) {
                                const val = ctx.raw;
                                const datasetLabel = ctx.dataset.label;
                                
                                if (datasetLabel === 'Quantity Sold') {
                                    const pct = totalTarget > 0 ? achievedPct.toFixed(1) + '% of target' : '';
                                    return datasetLabel + ': ' + formatNumber(val) + (pct ? ' (' + pct + ')' : '');
                                }
                                
                                return datasetLabel + ': Up to ' + formatCompactNumber(val);
                            },
                            afterBody: function(tooltipItems) {
                                const item = tooltipItems[0];
                                if (item.dataset.label === 'Quantity Sold') {
                                    return '\nTarget: ' + formatNumber(totalTarget);
                                }
                                return '';
                            }
                        }
                    },
                    datalabels: {
                        display: function(context) {
                            // Only show label for the actual performance bar
                            return context.dataset.label === 'Quantity Sold';
                        },
                        anchor: 'end',
                        align: 'end',
                        offset: isMobileChart ? 4 : 8,
                        color: '#2c3e50',
                        font: {
                            weight: 'bold',
                            size: isMobileChart ? 10 : (isTabletChart ? 12 : 15)
                        },
                        formatter: function (value, context) {
                            if (!value) return '';
                            // Show only the value without percentage for cleaner display
                            return formatCompactNumber(value);
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        beginAtZero: true,
                        max: maxScale,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.06)',
                            drawBorder: true,
                            borderColor: '#dee2e6',
                            borderWidth: 2
                        },
                        ticks: {
                            callback: function (value) {
                                return formatCompactNumber(value);
                            },
                            font: {
                                size: isMobileChart ? 9 : (isTabletChart ? 10 : 11),
                                weight: '500'
                            },
                            color: '#6c757d',
                            maxTicksLimit: isMobileChart ? 5 : 8,
                            padding: isMobileChart ? 2 : 4
                        },
                        title: {
                            display: !isMobileChart,
                            text: 'Quantity (MT)',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            color: '#495057'
                        }
                    },
                    y: {
                        stacked: false,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: isMobileChart ? 9 : (isTabletChart ? 11 : 14),
                                weight: '600'
                            },
                            color: '#2c3e50',
                            padding: isMobileChart ? 4 : 8,
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                }
            },
            plugins: [
                // Custom plugin to draw target marker line
                {
                    id: 'targetMarker',
                    afterDatasetsDraw: function(chart) {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const xScale = chart.scales.x;
                        const isMobileMarker = window.innerWidth < 768;
                        
                        // Calculate x position for target
                        const targetX = xScale.getPixelForValue(totalTarget);
                        
                        if (targetX >= chartArea.left && targetX <= chartArea.right) {
                            ctx.save();
                            
                            // Draw vertical target line
                            ctx.beginPath();
                            ctx.strokeStyle = '#c0392b';
                            ctx.lineWidth = isMobileMarker ? 3 : 4;
                            ctx.moveTo(targetX, chartArea.top + 5);
                            ctx.lineTo(targetX, chartArea.bottom - 5);
                            ctx.stroke();
                            
                            // Draw target marker (triangles on left and right)
                            const markerSize = isMobileMarker ? 7 : 10;
                            const markerY = (chartArea.top + chartArea.bottom) / 2;
                            
                            // Left triangle pointing right
                            ctx.beginPath();
                            ctx.fillStyle = '#c0392b';
                            ctx.moveTo(targetX - 2, markerY);
                            ctx.lineTo(targetX - markerSize - 2, markerY - markerSize);
                            ctx.lineTo(targetX - markerSize - 2, markerY + markerSize);
                            ctx.closePath();
                            ctx.fill();
                            
                            // Right triangle pointing left
                            ctx.beginPath();
                            ctx.moveTo(targetX + 2, markerY);
                            ctx.lineTo(targetX + markerSize + 2, markerY - markerSize);
                            ctx.lineTo(targetX + markerSize + 2, markerY + markerSize);
                            ctx.closePath();
                            ctx.fill();
                            
                            // Target label positioning based on screen size
                            if (isMobileMarker) {
                                // For mobile, place label inside chart area if possible
                                const labelX = targetX + 5;
                                ctx.font = 'bold 9px Arial';
                                ctx.fillStyle = '#c0392b';
                                ctx.textAlign = 'left';
                                ctx.fillText('TARGET', labelX, markerY - 6);
                                ctx.fillText(formatCompactNumber(totalTarget), labelX, markerY + 8);
                            } else {
                                // For desktop, place label outside chart area on right
                                ctx.font = 'bold 11px Arial';
                                ctx.fillStyle = '#c0392b';
                                ctx.textAlign = 'left';
                                ctx.fillText('TARGET', chartArea.right + 8, markerY - 8);
                                ctx.fillText(formatCompactNumber(totalTarget), chartArea.right + 8, markerY + 8);
                            }
                            
                            ctx.restore();
                        }
                    }
                },
                window.ChartDataLabels
            ]
        });

        // Ensure the chart is sized correctly after insertion
        setTimeout(() => {
            if (window.targetGaugeChartInstance) {
                try {
                    window.targetGaugeChartInstance.resize();
                    window.targetGaugeChartInstance.update();
                } catch (e) {
                    console.warn('Error resizing target chart:', e);
                }
            }
        }, 100);

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
}

// Process raw data for Target & Growth Tab (marketing man-wise aggregation)
function processRawDataForTargetGrowthTab(rawData) {
    const marketingManMap = new Map();

    // Get the actual user-selected date range from filters
    const filters = GetAllFilters();
    const userFromDate = filters.fromDate && filters.fromDate !== '0' ? new Date(filters.fromDate) : null;
    const userToDate = filters.toDate && filters.toDate !== '0' ? new Date(filters.toDate) : null;

    rawData.forEach(row => {
        const marketingManCode = row.MarketingManMaster_Code || row.TargetMarketingManCode;
        const marketingMan = row.MarketingMan || row.TargetMarketingManName;
        const sales = Number(row.SalesQtyMT) || 0;
        const targetAmount = Number(row.TargetAmount) || 0;

        if (!marketingMan) return;

        const invoiceDate = new Date(row.InvoiceDate);
        const currentFYStart = new Date(row.CurrentFY_FromDate);
        const currentFYEnd = new Date(row.CurrentFY_ToDate);
        const prevFYStart = new Date(row.PrevFY_FromDate);
        const prevFYEnd = new Date(row.PrevFY_ToDate);

        // Determine if this row falls within the user-selected date range
        const isInUserDateRange = (!userFromDate || invoiceDate >= userFromDate) && 
                                  (!userToDate || invoiceDate <= userToDate);

        if (!marketingManMap.has(marketingManCode)) {
            marketingManMap.set(marketingManCode, {
                "Marketing Man": marketingMan,
                "Current Year Sales": 0,
                "Last Year Sales": 0,
                "Target": 0,
                "Target Achieved": 'No',
                "Marketing Men Growth (%)": 0
            });
        }

        const manData = marketingManMap.get(marketingManCode);

        // Only include sales that fall within the user-selected date range
        if (invoiceDate >= currentFYStart && invoiceDate <= currentFYEnd && isInUserDateRange) {
            manData["Current Year Sales"] += sales;
            
            // Sum all targets for records within the selected date range
            // This ensures total target is relevant to the filtered period
            manData["Target"] += targetAmount;
        } else if (invoiceDate >= prevFYStart && invoiceDate <= prevFYEnd) {
            // Previous year sales for growth calculation (not filtered by user date range)
            manData["Last Year Sales"] += sales;
        }
    });

    // Calculate growth percentage and target achievement
    const result = Array.from(marketingManMap.values()).map(man => {
        const current = man["Current Year Sales"];
        const last = man["Last Year Sales"];
        const target = man["Target"];

        // Growth calculation
        if (last > 0) {
            man["Marketing Men Growth (%)"] = ((current - last) / last * 100).toFixed(2);
        } else if (current > 0) {
            man["Marketing Men Growth (%)"] = '100.00';
        } else {
            man["Marketing Men Growth (%)"] = '0.00';
        }

        // Target achievement
        if (target > 0 && current >= target) {
            man["Target Achieved"] = 'Yes';
        } else {
            man["Target Achieved"] = 'No';
        }

        return man;
    });

    // Sort by current year sales descending
    return result.sort((a, b) => b["Current Year Sales"] - a["Current Year Sales"]);
}

/* Segment tab removed as per requirements */

/* Service calls and dropdown logic now handled by FilterSidePanelControl initialization */

function CustomerDashboard_ShowReport(refreshAll = false) {
    if (!G_IsDataLoaded) {
        console.warn('Raw data not loaded yet');
        clearAllTabs();
        return;
    }

    // If refreshAll is true, refresh all tabs regardless of visibility
    // Otherwise, only refresh the currently visible tab
    if (refreshAll) {
        console.log('Refreshing all tabs...');
        renderBarChart();
        renderRegionalSection();
        renderClientSection();
        renderTargetGrowthSection();
        renderProductSection();
        renderProductSpecificationSection();
    } else {
        // Render only the currently visible tab
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


window.CustomerDashboard_ShowReport = CustomerDashboard_ShowReport;

