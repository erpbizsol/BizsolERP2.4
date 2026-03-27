import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { DateRangeControl } from '../../Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js';
import '../../Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js';
import { LedgerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/LedgerService.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global cache for account list response
let G_ddlAccountList = [];
let fromDate = '0';
let toDate = '0';

// Global variable to store raw ledger data
let G_RawLedgerData = [];
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
        { id: 'ddlAccountList', type: 'multiselect', label: 'Account List', data: [] },
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
        console.log('Calling LoadRawLedgerData...');
        LoadRawLedgerData().then(() => {
            LedgerNew_ShowReport(true); // true = refresh all tabs
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

    // Load Account List with mode DDL_ACCOUNTLIST
    const accountListPromise = LedgerService.GetLedgerData('DDL_ACCOUNTLIST', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            G_ddlAccountList = response.slice();
            const data = response.map(item => ({ Code: item.Code, Desp: item.AccountDesp || item.Desp || item.Description }));
            filterPanel.updateFilterData('ddlAccountList', data);
        }
    }).catch(function (error) {
        console.error('Error fetching account list:', error);
    });
    loadPromises.push(accountListPromise);

    // Wait for all dropdowns to load
    Promise.all(loadPromises).then(function () {
        console.log('All filter dropdowns loaded successfully');
    }).catch(function (error) {
        console.error('Error loading one or more filter dropdowns:', error);
    });
}

// Helper function to collect all filter values from FilterSidePanelControl
function GetAllFilters() {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.warn('FilterSidePanelControl not found - using fallback values');
        return {
            accountCodes: '0',
            fromDate: fromDate,
            toDate: toDate
        };
    }

    try {
        const filterValues = filterPanel.getFilterValues();
        console.log('Filter values from control:', filterValues);

        const filters = {
            accountCodes: filterValues.ddlAccountList?.joined || '0',
            fromDate: filterValues.dateRange?.fromDate || fromDate || '0',
            toDate: filterValues.dateRange?.toDate || toDate || '0'
        };

        console.log('Processed filters:', filters);
        return filters;
    } catch (e) {
        console.error('Error getting filter values:', e);
        return {
            accountCodes: '0',
            fromDate: fromDate,
            toDate: toDate
        };
    }
}

// Function to load raw ledger data
async function LoadRawLedgerData() {
    const filters = GetAllFilters();
    const selectedAccounts = filters.accountCodes;

    if (!selectedAccounts || selectedAccounts === '' || selectedAccounts === '0') {
        console.warn('No accounts selected, skipping data load');
        G_RawLedgerData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
        return;
    }

    console.log('Loading raw ledger data...');
    console.log('Filters:', { accounts: selectedAccounts, from: filters.fromDate, to: filters.toDate });
    Showloader();

    try {
        const response = await LedgerService.GetLedgerData(
            'SHOW_INGRID',
            selectedAccounts,
            filters.fromDate,
            filters.toDate
        );

        HideLoader();

        if (response && Array.isArray(response) && response.length > 0) {
            G_RawLedgerData = response;
            G_IsDataLoaded = true;
            console.log(`Loaded ${G_RawLedgerData.length} raw data records`);
        } else {
            console.warn('No raw data received from API');
            G_RawLedgerData = [];
            G_IsDataLoaded = false;
            clearAllTabs();
        }
    } catch (error) {
        HideLoader();
        console.error('Error loading raw ledger data:', error);
        G_RawLedgerData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
    }
}

// Clear all tabs when no data
function clearAllTabs() {
    console.log('Clearing all tabs - no data available');
    // Clear the ledger table
    //$('#tblLedgerDataHeader').empty();
    //$('#tblLedgerDataBody').empty();
    //$('#paginator-tblLedgerDataBody').empty();
}

// Show report
function LedgerNew_ShowReport(refreshAll = false) {
    console.log('Showing report...', refreshAll ? '(refreshing all tabs)' : '');

    // Update date range display
    updateDateRangeDisplay();

    // Render the ledger data grid
    if (G_IsDataLoaded && G_RawLedgerData.length > 0) {
        renderLedgerGrid();
    } else {
        clearAllTabs();
    }
}

// Render Ledger Data Grid using BizsolCustomFilterGrid
function renderLedgerGrid() {
    console.log('Rendering ledger grid with', G_RawLedgerData.length, 'records');

    // Clear existing table
    //$('#tblLedgerDataHeader').empty();
    //$('#tblLedgerDataBody').empty();
    //$('#paginator-tblLedgerDataBody').empty();

    if (!G_RawLedgerData || G_RawLedgerData.length === 0) {
        console.warn('No data to render in grid');
        return;
    }

    // Define filter columns - adjust based on your data structure
    const StringFilterColumn = ["AccountDesp"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
       
    };

    // Use BizsolCustomFilterGrid to create the data table
    BizsolCustomFilterGrid.CreateDataTable(
        "tblLedgerDataHeader",
        "tblLedgerDataBody",
        G_RawLedgerData,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
    

    console.log('Ledger grid rendered successfully');
}

// Update date range display
function updateDateRangeDisplay() {
    const dateRangeEl = document.getElementById('report-date-range');
    if (dateRangeEl && fromDate !== '0' && toDate !== '0') {
        dateRangeEl.textContent = `Ledger Showing From : ${formatDateDisplay(fromDate)} To ${formatDateDisplay(toDate)}`;
    }
}

// Format date helper for display
function formatDateDisplay(dateStr) {
    if (!dateStr || dateStr === '0') return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Initialize FilterSidePanelControl on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initFilterSidePanelControl();
    });
} else {
    initFilterSidePanelControl();
}
