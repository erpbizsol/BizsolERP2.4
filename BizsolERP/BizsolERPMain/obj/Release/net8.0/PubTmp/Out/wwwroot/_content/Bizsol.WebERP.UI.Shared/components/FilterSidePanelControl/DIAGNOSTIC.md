# FilterSidePanelControl - Quick Diagnostic Script

Run this script in your browser console (F12) to diagnose issues with the FilterSidePanelControl:

```javascript
// ========================================
// FilterSidePanelControl Diagnostic Script
// ========================================

console.log('=== FilterSidePanelControl Diagnostic ===\n');

// 1. Check if component exists
const filterPanel = document.getElementById('filterPanel');
console.log('1. Component exists:', !!filterPanel);
if (!filterPanel) {
    console.error('? FilterSidePanelControl element not found!');
    console.log('   Make sure <filter-side-panel-control id="filterPanel"> is in the HTML');
} else {
    console.log('? FilterSidePanelControl element found');
}

// 2. Check if custom element is defined
const isDefined = customElements.get('filter-side-panel-control');
console.log('\n2. Custom element defined:', !!isDefined);
if (!isDefined) {
    console.error('? filter-side-panel-control not registered!');
    console.log('   Make sure FilterSidePanelControl.js is loaded');
} else {
    console.log('? Custom element registered');
}

// 3. Check shadow root
if (filterPanel) {
    console.log('\n3. Shadow root exists:', !!filterPanel.shadowRoot);
    if (!filterPanel.shadowRoot) {
        console.error('? Shadow root not found!');
    } else {
        console.log('? Shadow root exists');
        
        // 4. Check floating button
        const floatingBtn = filterPanel.shadowRoot.querySelector('.filter-floating-btn');
        console.log('\n4. Floating button exists:', !!floatingBtn);
        if (!floatingBtn) {
            console.error('? Floating button not found in shadow DOM!');
        } else {
            console.log('? Floating button found');
            console.log('   Button styles:', {
                display: getComputedStyle(floatingBtn).display,
                position: getComputedStyle(floatingBtn).position,
                zIndex: getComputedStyle(floatingBtn).zIndex,
                right: getComputedStyle(floatingBtn).right,
                top: getComputedStyle(floatingBtn).top
            });
        }
        
        // 5. Check filter panel
        const offcanvas = filterPanel.shadowRoot.querySelector('.filter-offcanvas');
        console.log('\n5. Offcanvas panel exists:', !!offcanvas);
        if (offcanvas) {
            console.log('? Offcanvas panel found');
        }
        
        // 6. Check filters container
        const filtersContainer = filterPanel.shadowRoot.getElementById('filtersContainer');
        console.log('\n6. Filters container exists:', !!filtersContainer);
        if (filtersContainer) {
            const filterGroups = filtersContainer.querySelectorAll('.filter-group');
            console.log('   Number of filters:', filterGroups.length);
            if (filterGroups.length === 0) {
                console.warn('??  No filters configured yet');
            } else {
                console.log('? Filters configured:', filterGroups.length);
            }
        }
    }
}

// 7. Check if initialization function exists
console.log('\n7. Functions exist:');
console.log('   window.SalesanalysisAST_ShowReport:', typeof window.SalesanalysisAST_ShowReport);

// 8. Try to get filter values
if (filterPanel && typeof filterPanel.getFilterValues === 'function') {
    console.log('\n8. Testing getFilterValues():');
    try {
        const values = filterPanel.getFilterValues();
        console.log('? Filter values retrieved:', values);
    } catch (e) {
        console.error('? Error getting filter values:', e);
    }
}

// 9. Check for JavaScript errors
console.log('\n9. Checking for errors in console...');
console.log('   Look for red error messages above');

// 10. Manual test - click floating button
console.log('\n10. Manual test available:');
console.log('   Run: document.getElementById("filterPanel").shadowRoot.querySelector(".filter-floating-btn").click()');
console.log('   This should open the filter panel');

console.log('\n=== Diagnostic Complete ===\n');
console.log('If you see ? marks above, those indicate issues to fix.');
console.log('If you see ? marks, those parts are working correctly.');
```

## After running the diagnostic:

### If floating button is not visible:

1. **Check z-index conflicts**:
```javascript
// Run in console:
const btn = document.getElementById('filterPanel').shadowRoot.querySelector('.filter-floating-btn');
console.log('Button computed styles:', {
    display: getComputedStyle(btn).display,
    visibility: getComputedStyle(btn).visibility,
    opacity: getComputedStyle(btn).opacity,
    zIndex: getComputedStyle(btn).zIndex
});
```

2. **Force button to appear**:
```javascript
// Run in console to force button visible:
const btn = document.getElementById('filterPanel').shadowRoot.querySelector('.filter-floating-btn');
if (btn) {
    btn.style.display = 'flex';
    btn.style.position = 'fixed';
    btn.style.right = '20px';
    btn.style.top = '100px';
    btn.style.zIndex = '9999';
    btn.style.background = 'red'; // Make it obvious
    console.log('Button forced to display');
}
```

3. **Manual click test**:
```javascript
// If button exists but not visible, try clicking it programmatically:
document.getElementById('filterPanel').shadowRoot.querySelector('.filter-floating-btn').click();
```

### If panel opens but no filters:

```javascript
// Check if setFilters was called:
const panel = document.getElementById('filterPanel');
console.log('Filters configured:', panel._filters);

// If empty, manually configure:
panel.setFilters([
    { id: 'dateRange', type: 'daterange', label: 'Date Range' },
    { id: 'test', type: 'text', label: 'Test Filter' }
]);
```

### Success indicators:
- ? Button visible in top-right corner
- ? Clicking button opens filter panel
- ? Filters appear in panel
- ? Apply button works
- ? Console shows "Filters applied event received"
