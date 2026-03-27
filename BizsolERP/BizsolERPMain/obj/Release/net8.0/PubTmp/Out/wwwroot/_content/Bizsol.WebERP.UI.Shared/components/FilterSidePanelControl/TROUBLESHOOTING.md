# FilterSidePanelControl Troubleshooting Guide

## Issue: Apply Filter Not Working

### Quick Diagnostic Steps

1. **Open Browser Console** (F12)
   - Look for any JavaScript errors
   - Check if initialization logs appear

2. **Check if Component is Loaded**
   ```javascript
   // Run in console:
   const filterPanel = document.getElementById('filterPanel');
   console.log('Panel found:', filterPanel);
   console.log('Has shadowRoot:', filterPanel?.shadowRoot);
   console.log('Filter values:', filterPanel?.getFilterValues());
   ```

3. **Check Event Listener**
   ```javascript
   // The component should emit 'filtersapplied' event when Apply button is clicked
   const filterPanel = document.getElementById('filterPanel');
   filterPanel.addEventListener('filtersapplied', (e) => {
       console.log('Filter event received:', e.detail);
   });
   ```

### Common Issues and Solutions

#### Issue 1: Component Not Found
**Symptoms:** Console shows "FilterSidePanelControl element not found"

**Solution:**
- Verify `<filter-side-panel-control id="filterPanel">` exists in the HTML
- Make sure the component script is loaded: `<script type="module" src=".../FilterSidePanelControl.js"></script>`
- Check that scripts are loaded in correct order:
  1. DateRangeControl.js
  2. FilterSidePanelControl.js
  3. SalesanalysisAST.js

#### Issue 2: No Data in Filters
**Symptoms:** Dropdowns are empty

**Solution:**
- Check browser console for API errors
- Verify data is being fetched: Look for logs like "Fetching salesperson list"
- Check that `updateFilterData()` is being called with valid data
- Example debug:
  ```javascript
  const filterPanel = document.getElementById('filterPanel');
  console.log('Current filters:', filterPanel._filters);
  ```

#### Issue 3: Apply Button Does Nothing
**Symptoms:** Clicking Apply button doesn't trigger report

**Solution:**
1. Check if event listener is attached:
   ```javascript
   const filterPanel = document.getElementById('filterPanel');
   filterPanel.addEventListener('filtersapplied', (e) => {
       console.log('Event fired!', e.detail.filters);
   });
   ```

2. Verify `getFilterValues()` returns data:
   ```javascript
   const filterPanel = document.getElementById('filterPanel');
   const values = filterPanel.getFilterValues();
   console.log('Filter values:', values);
   ```

3. Check if `SalesanalysisAST_ShowReport()` is being called

#### Issue 4: Empty Filter Values
**Symptoms:** Filter values return empty or undefined

**Solution:**
- Check if filters have data loaded
- Verify checkboxes exist in shadow DOM:
  ```javascript
  const filterPanel = document.getElementById('filterPanel');
  const wrapper = filterPanel.shadowRoot.getElementById('ddlDealerNamelist');
  const checkboxes = wrapper?.querySelectorAll('.ddlDealerNamelist_chk');
  console.log('Checkboxes found:', checkboxes?.length);
  ```

#### Issue 5: Date Range Not Working
**Symptoms:** Date range returns '0' or undefined

**Solution:**
- Ensure DateRangeControl is loaded before FilterSidePanelControl
- Check if date range element exists:
  ```javascript
  const filterPanel = document.getElementById('filterPanel');
  const dateRange = filterPanel.shadowRoot.getElementById('dateRange');
  console.log('DateRange element:', dateRange);
  console.log('DateRange value:', dateRange?.getRange());
  ```

### Debug Mode

To enable detailed debugging, open the browser console and all filter operations will log their progress.

Look for these key logs:
1. "Initializing FilterSidePanelControl..." - Initialization started
2. "FilterSidePanelControl found:" - Component located
3. "Setting filters:" - Filters configuration
4. "Loading dropdown data..." - Data fetch started
5. "Filters applied event received:" - Apply button clicked
6. "Filter values from control:" - Values being read
7. "Processed filters:" - Final processed values

### Manual Test

Run this in the browser console after page load:

```javascript
// 1. Check component
const filterPanel = document.getElementById('filterPanel');
console.log('Component:', filterPanel);

// 2. Check shadow DOM
console.log('Shadow Root:', filterPanel?.shadowRoot);

// 3. Get filter values
const values = filterPanel?.getFilterValues();
console.log('Filter Values:', values);

// 4. Manually trigger apply
if (filterPanel) {
    filterPanel.dispatchEvent(new CustomEvent('filtersapplied', {
        detail: { filters: values },
        bubbles: true,
        composed: true
    }));
}
```

### Clear Cache

If the component doesn't load properly:
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache
3. Check browser console for 404 errors on component files

### Check Required Dependencies

Ensure these are loaded in your HTML:
```html
<!-- Required -->
<link href="~/_content/Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.css" rel="stylesheet" />
<link href="~/_content/Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.css" rel="stylesheet" />

<!-- FontAwesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

<!-- Scripts (in order) -->
<script type="module" src="~/_content/Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js"></script>
<script type="module" src="~/_content/Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js"></script>
<script type="module" src="~/_content/Bizsol.WebERP.UI.CRM.Reports/Script/SalesanalysisAST.js"></script>
```

### Still Not Working?

1. Check browser compatibility (requires ES6+ and Web Components support)
2. Check for JavaScript errors in other parts of the page that might interfere
3. Try in incognito/private mode to rule out extensions
4. Check network tab to ensure all scripts load successfully (status 200)

### Getting Help

When reporting issues, provide:
1. Browser console logs
2. Network tab screenshot showing script loading
3. Output of the manual test above
4. Browser and version information
