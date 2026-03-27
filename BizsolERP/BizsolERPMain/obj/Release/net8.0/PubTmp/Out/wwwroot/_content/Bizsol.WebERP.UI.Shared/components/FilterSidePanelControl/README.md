# FilterSidePanelControl Component

A generic, reusable web component for creating filter side panels with floating action buttons in your application.

## Features

- **Dynamic Filter Configuration**: Add filters dynamically via JavaScript
- **Multiple Filter Types**: Supports daterange, multiselect, select, and text filters
- **Floating Action Button**: Automatic floating button to open filter panel
- **Responsive Design**: Works on mobile and desktop
- **Event-Based**: Emits custom events when filters are applied
- **Dependent Dropdowns**: Support for updating filter data dynamically

## Installation

1. Add the CSS reference to your page:
```html
<link href="~/_content/Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.css" rel="stylesheet" />
```

2. Add the JavaScript module reference:
```html
<script type="module" src="~/_content/Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js"></script>
```

3. Also ensure DateRangeControl is included if using daterange filters:
```html
<link href="~/_content/Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.css" rel="stylesheet" />
<script type="module" src="~/_content/Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js"></script>
```

## Usage

### Basic Setup

Add the component to your HTML/Razor page:

```html
<filter-side-panel-control id="filterPanel" show-button="true"></filter-side-panel-control>
```

### Configure Filters

Use JavaScript to configure the filters:

```javascript
import { FilterSidePanelControlHelper } from '../../Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js';

const filterPanel = document.getElementById('filterPanel');

// Define your filters
const filters = [
    { 
        id: 'dateRange', 
        type: 'daterange', 
        label: 'Date Range' 
    },
    { 
        id: 'salesPerson', 
        type: 'multiselect', 
        label: 'Sales Person', 
        data: [
            { Code: '1', Desp: 'John Doe' },
            { Code: '2', Desp: 'Jane Smith' }
        ]
    },
    { 
        id: 'status', 
        type: 'select', 
        label: 'Status', 
        data: [
            { Code: 'A', Desp: 'Active' },
            { Code: 'I', Desp: 'Inactive' }
        ]
    },
    { 
        id: 'searchText', 
        type: 'text', 
        label: 'Search', 
        placeholder: 'Enter search term...' 
    }
];

// Set the filters
filterPanel.setFilters(filters);
```

### Listen for Filter Apply Event

```javascript
filterPanel.addEventListener('filtersapplied', (e) => {
    const filters = e.detail.filters;
    
    console.log('Date Range:', filters.dateRange);
    console.log('Sales Person:', filters.salesPerson);
    console.log('Status:', filters.status);
    console.log('Search Text:', filters.searchText);
    
    // Use the filter values to fetch/display data
    fetchReportData(filters);
});
```

## Filter Types

### 1. Date Range Filter

```javascript
{ 
    id: 'dateRange', 
    type: 'daterange', 
    label: 'Date Range' 
}
```

**Returns:**
```javascript
{
    fromDate: '2024-04-01',
    toDate: '2025-03-31'
}
```

### 2. Multi-Select Filter

```javascript
{ 
    id: 'salesPerson', 
    type: 'multiselect', 
    label: 'Sales Person', 
    data: [
        { Code: '1', Desp: 'John Doe' },
        { Code: '2', Desp: 'Jane Smith' }
    ]
}
```

**Returns:**
```javascript
{
    values: ['1', '2'],           // Array of selected values
    isAll: false,                 // Whether "Select All" is checked
    joined: '1,2'                 // Comma-separated string (or '0' if all)
}
```

### 3. Select (Dropdown) Filter

```javascript
{ 
    id: 'status', 
    type: 'select', 
    label: 'Status', 
    data: [
        { Code: 'A', Desp: 'Active' },
        { Code: 'I', Desp: 'Inactive' }
    ]
}
```

**Returns:** Single selected value (string)

### 4. Text Input Filter

```javascript
{ 
    id: 'searchText', 
    type: 'text', 
    label: 'Search', 
    placeholder: 'Enter search term...' 
}
```

**Returns:** Text value (string)

## API Methods

### `setFilters(filters)`
Set or update all filters in the panel.

```javascript
filterPanel.setFilters([...]);
```

### `getFilterValues()`
Get all current filter values.

```javascript
const values = filterPanel.getFilterValues();
```

### `updateFilterData(filterId, data)`
Update data for a specific filter (useful for dependent dropdowns).

```javascript
filterPanel.updateFilterData('salesPerson', [
    { Code: '3', Desp: 'New Person' }
]);
```

### `onApply(callback)`
Set a callback function for the apply button.

```javascript
filterPanel.onApply((filters) => {
    console.log('Filters applied:', filters);
});
```

### `open()` / `close()`
Programmatically open or close the filter panel.

```javascript
filterPanel.open();
filterPanel.close();
```

## Dependent Dropdowns Example

```javascript
// Setup the initial filters
filterPanel.setFilters([
    { 
        id: 'country', 
        type: 'multiselect', 
        label: 'Country', 
        data: countryData 
    },
    { 
        id: 'city', 
        type: 'multiselect', 
        label: 'City', 
        data: [] 
    }
]);

// Listen for changes on country filter to update city filter
setTimeout(() => {
    const countryWrapper = filterPanel.shadowRoot.getElementById('country');
    if (countryWrapper) {
        const checkboxes = countryWrapper.querySelectorAll('.country_chk');
        checkboxes.forEach(chk => {
            chk.addEventListener('change', () => {
                const selectedCountries = filterPanel.getFilterValues().country.values;
                
                // Fetch cities based on selected countries
                fetchCities(selectedCountries).then(cities => {
                    filterPanel.updateFilterData('city', cities);
                });
            });
        });
    }
}, 500);
```

## Styling

The component uses Bootstrap 5 classes and custom CSS. You can customize the appearance by overriding the CSS variables or classes in your own stylesheet.

### Key CSS Classes:
- `.filter-floating-btn` - The floating action button
- `.filter-offcanvas` - The side panel container
- `.filter-group` - Each filter group container
- `.filter-apply-btn` - The apply button

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show-button` | boolean | `true` | Whether to show the floating action button |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires support for Web Components (Custom Elements v1).

## Example: Complete Implementation

See `SalesanalysisAST.cshtml` and `SalesanalysisAST.js` for a complete working example with all filter types and dependent dropdowns.

## Notes

- The component uses Shadow DOM, so styles are encapsulated
- FontAwesome icons are required for the filter icon (ensure FontAwesome is loaded in your page)
- The DateRangeControl component must be available if using daterange filters
- Filter data should be in format `{ Code: string, Desp: string }`

## Troubleshooting

**Filters not appearing:**
- Ensure the component script is loaded as a module
- Check browser console for errors
- Verify filter configuration is valid

**DateRange not working:**
- Ensure DateRangeControl component is loaded
- Check that dateRange filter type is spelled correctly

**Dependent dropdowns not updating:**
- Add event listeners after a short timeout (e.g., 500ms) to ensure DOM is ready
- Access shadow DOM elements using `filterPanel.shadowRoot.getElementById()`

## License

Internal use only - Bizsol ERP System
