// FilterSidePanelControl Web Component
// Usage: 
// <filter-side-panel-control id="filterPanel"></filter-side-panel-control>
// 
// To configure filters dynamically:
// const filterPanel = document.getElementById('filterPanel');
// filterPanel.setFilters([
//   { id: 'dateRange', type: 'daterange', label: 'Date Range' },
//   { id: 'salesPerson', type: 'multiselect', label: 'Sales Person', data: [{Code: '1', Desp: 'John'}] },
//   { id: 'status', type: 'select', label: 'Status', data: [{Code: 'A', Desp: 'Active'}] }
// ]);
//
// Listen to apply button click:
// filterPanel.addEventListener('filtersapplied', (e) => {
//   console.log(e.detail.filters); // Contains all filter values
// });

const template = document.createElement('template');
template.innerHTML = `
<style>
/* Import FontAwesome into Shadow DOM */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* All component styles */

:host {
    display: block;
}

.filter-floating-btn {
    position: fixed;
    right: 20px;
    top: 55px;
    z-index: 1000;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.filter-floating-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
}

.filter-floating-btn i {
    font-size: 18px;
}

.filter-offcanvas {
    position: fixed;
    top: 0;
    right: -100%;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 8px rgba(0,0,0,0.15);
    transition: right 0.3s ease;
    z-index: 1055;
    display: flex;
    flex-direction: column;
}

.filter-offcanvas.show {
    right: 0;
}

.offcanvas-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 1040;
    display: none;
}

.offcanvas-backdrop.show {
    display: block;
}

.offcanvas-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.offcanvas-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.btn-close {
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.offcanvas-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.filter-group {
    margin-bottom: 15px;
}

.filter-group label {
    display: block;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 5px;
    color: #333;
}

.filter-group select,
.filter-group input[type="text"],
.filter-group input[type="date"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
}

.filter-apply-btn-container {
    padding: 15px 20px;
    background: linear-gradient(to top, #ffffff 85%, rgba(255,255,255,0.95) 95%, transparent 100%);
    border-top: 1px solid #eee;
}

.filter-apply-btn {
    width: 100%;
    padding: 12px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
}

.filter-apply-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(102, 126, 234, 0.4);
}

.filter-apply-btn:active {
    transform: translateY(0);
}

.multi-checkbox-root {
    font-size: 13px;
}

.multi-checkbox-search {
    margin-bottom: 6px;
}

.multi-checkbox-search input {
    width: 100%;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 3px;
}

.multi-checkbox-selectall {
    margin-bottom: 6px;
}

.multi-checkbox-selectall label {
    cursor: pointer;
    font-weight: normal !important;
}

.multi-checkbox-selectall input {
    margin-right: 6px;
}

.multi-checkbox-list {
    max-height: 150px;
    overflow: auto;
    border: 1px solid #e6e6e6;
    padding: 6px;
    border-radius: 3px;
    background: #fff;
}

.checkbox-item {
    padding: 4px 2px;
}

.checkbox-item label {
    cursor: pointer;
    font-weight: normal !important;
}

.checkbox-item input[type="checkbox"] {
    margin-right: 6px;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
    .filter-floating-btn {
        right: 16px;
        top: auto;
        bottom: 24px;
        width: 50px;
        height: 50px;
        z-index: 1040;
    }
    
    .filter-floating-btn i {
        font-size: 20px;
    }
    
    .filter-offcanvas {
        width: 90% !important;
        max-width: 380px;
    }
}

/* Small mobile devices */
@media (max-width: 576px) {
    .filter-floating-btn {
        right: 12px;
        bottom: 20px;
        width: 48px;
        height: 48px;
    }
    
    .filter-floating-btn i {
        font-size: 18px;
    }
    
    .filter-offcanvas {
        width: 95% !important;
    }
}

/* Landscape mobile orientation */
@media (max-height: 500px) and (orientation: landscape) {
    .filter-floating-btn {
        width: 40px;
        height: 40px;
        bottom: 16px;
        right: 12px;
    }
    
    .filter-floating-btn i {
        font-size: 16px;
    }
}
</style>

<!-- Filter containers (will be populated via JavaScript) -->
<div id="floatingButtonContainer"></div>
<div id="offcanvasBackdrop" class="offcanvas-backdrop"></div>
<div id="offcanvasPanel" class="filter-offcanvas">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">
            <i class="fa-solid fa-filter" style="margin-right: 8px;"></i>Filters
        </h5>
        <button type="button" class="btn-close" aria-label="Close">&times;</button>
    </div>
    <div class="offcanvas-body" id="filtersContainer">
        <!-- Filters will be dynamically added here -->
    </div>
    <div class="filter-apply-btn-container">
        <button type="button" class="filter-apply-btn">
            <i class="fa-solid fa-eye" style="margin-right: 8px;"></i>Apply Filters & Show
        </button>
    </div>
</div>
`;

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

class FilterSidePanelControl extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._shadow.appendChild(template.content.cloneNode(true));
        
        this._filters = [];
        this._showFloatingButton = true;
        this._onApplyCallback = null;
        
        // Get references to elements
        this._floatingButtonContainer = this._shadow.getElementById('floatingButtonContainer');
        this._offcanvasBackdrop = this._shadow.getElementById('offcanvasBackdrop');
        this._offcanvasPanel = this._shadow.getElementById('offcanvasPanel');
        this._filtersContainer = this._shadow.getElementById('filtersContainer');
        this._applyButton = this._shadow.querySelector('.filter-apply-btn');
        this._closeButton = this._shadow.querySelector('.btn-close');
        
        // Bind methods
        this._openPanel = this._openPanel.bind(this);
        this._closePanel = this._closePanel.bind(this);
        this._handleApply = this._handleApply.bind(this);
        this._handleBackdropClick = this._handleBackdropClick.bind(this);
    }
    
    connectedCallback() {
        // Check attributes
        const showButton = this.getAttribute('show-button');
        if (showButton !== null && showButton !== 'true') {
            this._showFloatingButton = false;
        }
        
        // CRITICAL FIX: Inject global CSS to forcefully hide flatpickr mobile overlay
        // This is a nuclear option - if overlay is created, it will be invisible
        if (!document.getElementById('flatpickr-mobile-overlay-killer')) {
            const style = document.createElement('style');
            style.id = 'flatpickr-mobile-overlay-killer';
            style.textContent = `
                /* Force hide flatpickr mobile overlay globally */
                #flatpickr-mobile-overlay {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
                /* Also hide any orphaned overlays */
                .flatpickr-mobile {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            console.log('Flatpickr mobile overlay killer CSS injected');
        }
        
        // Render floating button if needed
        if (this._showFloatingButton) {
            this._renderFloatingButton();
        }
        
        // Attach event listeners
        this._applyButton.addEventListener('click', this._handleApply);
        this._closeButton.addEventListener('click', this._closePanel);
        this._offcanvasBackdrop.addEventListener('click', this._handleBackdropClick);
        
        // IMPORTANT: Initialize automatic flatpickr cleanup handlers
        // This prevents black screen issues on mobile without requiring manual setup
        this._initializeFlatpickrCleanup();
    }
    
    disconnectedCallback() {
        this._applyButton.removeEventListener('click', this._handleApply);
        this._closeButton.removeEventListener('click', this._closePanel);
        this._offcanvasBackdrop.removeEventListener('click', this._handleBackdropClick);
        
        // Clear cleanup interval
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
        
        // Clean up global event listeners for flatpickr cleanup
        if (this._cleanupHandlers) {
            document.removeEventListener('visibilitychange', this._cleanupHandlers.visibilityChange);
            window.removeEventListener('blur', this._cleanupHandlers.blur);
            window.removeEventListener('orientationchange', this._cleanupHandlers.orientationChange);
            window.removeEventListener('resize', this._cleanupHandlers.resize);
            if (this._cleanupHandlers.documentClick) {
                document.removeEventListener('click', this._cleanupHandlers.documentClick, true);
            }
        }
    }
    
    /**
     * Initialize automatic flatpickr overlay cleanup handlers
     * This prevents black screen issues on mobile devices
     * Called automatically when component is connected - no manual setup needed
     * @private
     */
    _initializeFlatpickrCleanup() {
        // Clean up immediately on initialization
        cleanupFlatpickrOverlay();
        
        // Set up aggressive continuous monitoring - check for overlay every 500ms
        // This catches any overlay that appears unexpectedly
        this._cleanupInterval = setInterval(() => {
            cleanupFlatpickrOverlay();
        }, 500);
        
        // Store handlers for cleanup on disconnect
        this._cleanupHandlers = {
            visibilityChange: () => {
                if (document.hidden) {
                    cleanupFlatpickrOverlay();
                }
            },
            blur: () => {
                cleanupFlatpickrOverlay();
            },
            orientationChange: () => {
                console.log('Orientation changed - cleaning up flatpickr overlay');
                cleanupFlatpickrOverlay();
                // Multiple cleanup attempts after orientation change
                setTimeout(() => cleanupFlatpickrOverlay(), 100);
                setTimeout(() => cleanupFlatpickrOverlay(), 300);
                setTimeout(() => cleanupFlatpickrOverlay(), 500);
            },
            resize: (() => {
                let resizeTimeout;
                return () => {
                    // Clean up overlay on resize immediately
                    cleanupFlatpickrOverlay();
                    
                    // Debounce additional resize handling with multiple attempts
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        cleanupFlatpickrOverlay();
                        setTimeout(() => cleanupFlatpickrOverlay(), 100);
                    }, 300);
                };
            })()
        };
        
        // Attach event listeners
        document.addEventListener('visibilitychange', this._cleanupHandlers.visibilityChange);
        window.addEventListener('blur', this._cleanupHandlers.blur);
        window.addEventListener('orientationchange', this._cleanupHandlers.orientationChange);
        window.addEventListener('resize', this._cleanupHandlers.resize);
        
        // Also monitor for clicks anywhere on document - flatpickr might create overlay on date click
        this._cleanupHandlers.documentClick = (e) => {
            // Small delay to let flatpickr create its overlay, then remove it
            setTimeout(() => {
                cleanupFlatpickrOverlay();
            }, 50);
        };
        document.addEventListener('click', this._cleanupHandlers.documentClick, true);
        
        console.log('FilterSidePanelControl: Aggressive automatic flatpickr cleanup initialized');
    }
    
    _renderFloatingButton() {
        this._floatingButtonContainer.innerHTML = `
            <button class="filter-floating-btn" type="button" title="Filters">
                <i class="fa-solid fa-filter"></i>
            </button>
        `;
        const btn = this._floatingButtonContainer.querySelector('.filter-floating-btn');
        if (btn) {
            btn.addEventListener('click', this._openPanel);
        }
    }
    
    _openPanel() {
        // Clean up any existing overlays before opening panel
        cleanupFlatpickrOverlay();
        
        this._offcanvasBackdrop.classList.add('show');
        this._offcanvasPanel.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Clean up again after panel is fully opened
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 100);
    }
    
    _closePanel() {
        this._offcanvasBackdrop.classList.remove('show');
        this._offcanvasPanel.classList.remove('show');
        document.body.style.overflow = '';
        
        // Aggressive cleanup when panel closes - multiple attempts
        cleanupFlatpickrOverlay();
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 50);
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 150);
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 300);
    }
    
    _handleBackdropClick() {
        this._closePanel();
    }
    
    _handleApply() {
        const filterValues = this.getFilterValues();
        
        // Aggressive cleanup immediately when apply is clicked - multiple attempts
        cleanupFlatpickrOverlay();
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 10);
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 50);
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 100);
        setTimeout(() => {
            cleanupFlatpickrOverlay();
        }, 200);
        
        // Emit custom event
        this.dispatchEvent(new CustomEvent('filtersapplied', {
            detail: { filters: filterValues },
            bubbles: true,
            composed: true
        }));
        
        // Call callback if provided
        if (typeof this._onApplyCallback === 'function') {
            this._onApplyCallback(filterValues);
        }
        
        // Close panel
        this._closePanel();
    }
    
    /**
     * Set filters configuration
     * @param {Array} filters - Array of filter objects
     * Example:
     * [
     *   { id: 'dateRange', type: 'daterange', label: 'Date Range' },
     *   { id: 'salesPerson', type: 'multiselect', label: 'Sales Person', data: [{Code: '1', Desp: 'John'}] },
     *   { id: 'status', type: 'select', label: 'Status', data: [{Code: 'A', Desp: 'Active'}] }
     * ]
     */
    setFilters(filters) {
        this._filters = filters || [];
        this._renderFilters();
    }
    
    _renderFilters() {
        this._filtersContainer.innerHTML = '';
        
        this._filters.forEach(filter => {
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group';
            filterGroup.id = `filter-group-${filter.id}`;
            
            const label = document.createElement('label');
            label.textContent = filter.label || filter.id;
            label.setAttribute('for', filter.id);
            label.className = 'col-form-label-sm';
            filterGroup.appendChild(label);
            
            switch (filter.type) {
                case 'daterange':
                    this._renderDateRangeFilter(filterGroup, filter);
                    break;
                case 'multiselect':
                    this._renderMultiSelectFilter(filterGroup, filter);
                    break;
                case 'select':
                    this._renderSelectFilter(filterGroup, filter);
                    break;
                case 'text':
                    this._renderTextFilter(filterGroup, filter);
                    break;
                default:
                    console.warn('Unknown filter type:', filter.type);
            }
            
            this._filtersContainer.appendChild(filterGroup);
        });
    }
    
    _renderDateRangeFilter(container, filter) {
        const dateRangeEl = document.createElement('date-range-control');
        dateRangeEl.id = filter.id;
        container.appendChild(dateRangeEl);
    }
    
    _renderMultiSelectFilter(container, filter) {
        const wrapper = document.createElement('div');
        wrapper.id = filter.id;
        wrapper.className = 'multi-checkbox-root';
        
        const searchId = `${filter.id}_search`;
        const allId = `${filter.id}_all`;
        const listId = `${filter.id}_list`;
        
        wrapper.innerHTML = `
            <div class="multi-checkbox-search">
                <input type="text" id="${searchId}" placeholder="Search..." />
            </div>
            <div class="multi-checkbox-selectall">
                <label><input type="checkbox" id="${allId}" checked /> Select All</label>
            </div>
            <div id="${listId}" class="multi-checkbox-list"></div>
        `;
        
        container.appendChild(wrapper);
        
        // Populate data
        const listDiv = wrapper.querySelector(`#${listId}`);
        const data = filter.data || [];
        
        data.forEach(item => {
            const val = escapeHtml(item.Code);
            const text = escapeHtml(item.Desp);
            const itemId = `${filter.id}_chk_${val}`;
            const itemHtml = `
                <div class="checkbox-item">
                    <label for="${itemId}">
                        <input type="checkbox" id="${itemId}" class="${filter.id}_chk" value="${val}" checked/>
                        ${text}
                    </label>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        // Attach event listeners
        setTimeout(() => {
            const selectAllCheckbox = wrapper.querySelector(`#${allId}`);
            const searchInput = wrapper.querySelector(`#${searchId}`);
            
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    const checkboxes = wrapper.querySelectorAll(`.${filter.id}_chk`);
                    checkboxes.forEach(chk => chk.checked = checked);
                });
            }
            
            // Individual checkbox listeners
            const itemCheckboxes = wrapper.querySelectorAll(`.${filter.id}_chk`);
            itemCheckboxes.forEach(chk => {
                chk.addEventListener('change', () => {
                    const all = wrapper.querySelectorAll(`.${filter.id}_chk`);
                    const checkedCount = Array.from(all).filter(c => c.checked).length;
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = (checkedCount === all.length && all.length > 0);
                    }
                });
            });
            
            // Search functionality
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.trim().toLowerCase();
                    const items = wrapper.querySelectorAll('.checkbox-item');
                    items.forEach(div => {
                        const text = div.textContent.trim().toLowerCase();
                        div.style.display = (term === '' || text.indexOf(term) !== -1) ? '' : 'none';
                    });
                });
            }
        }, 0);
    }
    
    _renderSelectFilter(container, filter) {
        const select = document.createElement('select');
        select.id = filter.id;
        select.className = 'form-control form-control-sm box_border';
        
        const data = filter.data || [];
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Code;
            option.textContent = item.Desp;
            select.appendChild(option);
        });
        
        container.appendChild(select);
    }
    
    _renderTextFilter(container, filter) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = filter.id;
        input.className = 'form-control form-control-sm box_border';
        input.placeholder = filter.placeholder || '';
        
        container.appendChild(input);
    }
    
    /**
     * Get all filter values
     * @returns {Object} Object containing all filter values
     */
    getFilterValues() {
        const values = {};
        
        console.log('Getting filter values, filters count:', this._filters.length);
        
        this._filters.forEach(filter => {
            console.log(`Processing filter: ${filter.id}, type: ${filter.type}`);
            
            switch (filter.type) {
                case 'daterange':
                    const dateRangeEl = this._shadow.getElementById(filter.id);
                    console.log(`DateRange element found:`, dateRangeEl);
                    if (dateRangeEl && typeof dateRangeEl.getRange === 'function') {
                        try {
                            const range = dateRangeEl.getRange();
                            values[filter.id] = {
                                fromDate: range.fromDate || '0',
                                toDate: range.toDate || '0'
                            };
                            console.log(`DateRange values:`, values[filter.id]);
                        } catch (e) {
                            console.error(`Error getting daterange for ${filter.id}:`, e);
                        }
                    }
                    break;
                    
                case 'multiselect':
                    const wrapper = this._shadow.getElementById(filter.id);
                    console.log(`Multiselect wrapper found:`, wrapper);
                    if (wrapper) {
                        try {
                            const checkboxes = wrapper.querySelectorAll(`.${filter.id}_chk:checked`);
                            const allCheckboxes = wrapper.querySelectorAll(`.${filter.id}_chk`);
                            console.log(`Total checkboxes: ${allCheckboxes.length}, Checked: ${checkboxes.length}`);
                            
                            const selectedValues = Array.from(checkboxes).map(chk => chk.value);
                            const allCheckbox = wrapper.querySelector(`#${filter.id}_all`);
                            const isAllSelected = allCheckbox && allCheckbox.checked;
                            
                            values[filter.id] = {
                                values: selectedValues,
                                isAll: isAllSelected,
                                //joined: (isAllSelected || selectedValues.length === allCheckboxes.length) ? '0' : selectedValues.join(',')
                                joined: selectedValues.join(',')
                            };
                            console.log(`Multiselect values for ${filter.id}:`, values[filter.id]);
                        } catch (e) {
                            console.error(`Error getting multiselect for ${filter.id}:`, e);
                        }
                    }
                    break;
                    
                case 'select':
                    const selectEl = this._shadow.getElementById(filter.id);
                    if (selectEl) {
                        values[filter.id] = selectEl.value;
                        console.log(`Select value for ${filter.id}:`, values[filter.id]);
                    }
                    break;
                    
                case 'text':
                    const inputEl = this._shadow.getElementById(filter.id);
                    if (inputEl) {
                        values[filter.id] = inputEl.value;
                        console.log(`Text value for ${filter.id}:`, values[filter.id]);
                    }
                    break;
            }
        });
        
        console.log('Final filter values:', values);
        return values;
    }
    
    /**
     * Update filter data (useful for dependent dropdowns)
     * @param {string} filterId - The ID of the filter to update
     * @param {Array} data - New data array
     */
    updateFilterData(filterId, data) {
        const filter = this._filters.find(f => f.id === filterId);
        if (!filter) {
            console.warn('Filter not found:', filterId);
            return;
        }
        
        filter.data = data;
        
        // Re-render only this filter
        const filterGroup = this._shadow.getElementById(`filter-group-${filterId}`);
        if (filterGroup) {
            // Clear existing content except label
            const label = filterGroup.querySelector('label');
            filterGroup.innerHTML = '';
            if (label) filterGroup.appendChild(label);
            
            // Re-render based on type
            if (filter.type === 'multiselect') {
                this._renderMultiSelectFilter(filterGroup, filter);
            } else if (filter.type === 'select') {
                this._renderSelectFilter(filterGroup, filter);
            }
        }
    }
    
    /**
     * Set callback for apply button
     * @param {Function} callback - Function to call when apply is clicked
     */
    onApply(callback) {
        this._onApplyCallback = callback;
    }
    
    /**
     * Open the filter panel programmatically
     */
    open() {
        this._openPanel();
    }
    
    /**
     * Close the filter panel programmatically
     */
    close() {
        this._closePanel();
    }
}

// Register the custom element
customElements.define('filter-side-panel-control', FilterSidePanelControl);

/**
 * Global helper to clean up flatpickr mobile overlay
 * This prevents issues with orphaned overlays causing black screens on mobile
 * Call this when the page becomes hidden, orientation changes, or window loses focus
 */
export function cleanupFlatpickrOverlay() {
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

// Export helper functions for external use
export const FilterSidePanelControlHelper = {
    /**
     * Get filter values from a filter panel instance
     * @param {string} controlId - ID of the filter-side-panel-control element
     * @returns {Object} Filter values
     */
    getFilterValues: function(controlId) {
        const panel = document.getElementById(controlId);
        if (panel && typeof panel.getFilterValues === 'function') {
            return panel.getFilterValues();
        }
        return {};
    },
    
    /**
     * Update filter data for a specific filter
     * @param {string} controlId - ID of the filter-side-panel-control element
     * @param {string} filterId - ID of the filter to update
     * @param {Array} data - New data array
     */
    updateFilterData: function(controlId, filterId, data) {
        const panel = document.getElementById(controlId);
        if (panel && typeof panel.updateFilterData === 'function') {
            panel.updateFilterData(filterId, data);
        }
    },
    
    /**
     * Clean up flatpickr overlay (utility function)
     */
    cleanupFlatpickrOverlay: cleanupFlatpickrOverlay
};
