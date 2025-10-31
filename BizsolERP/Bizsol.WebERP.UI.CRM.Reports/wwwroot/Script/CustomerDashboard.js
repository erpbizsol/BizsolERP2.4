import { CustomerDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CustomerDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global cache for dealer list response
let G_ddlDealerNameList = [];
const _cityGeoCache = new Map();

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

    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('SALESTAB', selectedDealers).then(function (response) {
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

        if (Array.isArray(chartRows) && chartRows.length > 0) {
            // Ensure sorted by MonthOrder (Apr..Mar)
            chartRows.sort((a, b) => (Number(a.MonthOrder) || 0) - (Number(b.MonthOrder) || 0));
            monthLabels = chartRows.map(r => r.MonthName || '');
            currentFY = chartRows.map(r => {
                const v = r.CurrentFYQty;
                return (v === null || v === undefined || v === '') ? 0 : Number(v);
            });
            prevFY = chartRows.map(r => {
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
                        borderWidth: 1
                    },
                    {
                        label: 'Previous FY Sales',
                        data: prevFY,
                        backgroundColor: 'rgba(24,67,135,0.95)',
                        borderColor: 'rgba(24,67,135,1)',
                        borderWidth: 1
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
                                return ctx.dataset.label + ': ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        offset: -6,
                        color: '#222',
                        font: { weight: 'bold', size: 12 },
                        formatter: function (value) {
                            if (value === null || value === undefined) return '';
                            return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
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
                                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                        },
                        title: { display: true, text: 'Sales' }
                    }
                }
            },
            plugins: (typeof ChartDataLabels !== 'undefined') ? [window.ChartDataLabels] : []
        });

        // Ensure the chart is sized correctly after insertion
        try { setTimeout(() => window.barChartInstance.resize(), 50); } catch (e) { /* ignore */ }

        setBestSaleDetils();
    })
    
}
function setBestSaleDetils() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('SALESTAB_BESTSALEDETAILS', selectedDealers).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#kpi-selected-year')[0].innerHTML = response[0].TotalCurrentSales
            $('#kpi-best-month')[0].innerHTML = response[0].BestMonthName
            $('#kpi-best-month-amt')[0].innerHTML = response[0].BestMonthSale
            $('#kpi-best-day-date')[0].innerHTML = response[0].BestDayDate
            $('#kpi-best-day-amt')[0].innerHTML = response[0].BestDaySale
        }
    })
}

/* ===== NEW: Checkbox multi-select rendering utility ===== */

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


function BindSelectList(element, list) {
    if (!element) return;

    // If element is a jQuery object by mistake, get DOM
    if (element.jquery) element = element[0];

    // If the element is a SELECT, replace it with a DIV container so checkboxes are valid HTML
    let container = element;
    if (element.tagName && element.tagName.toLowerCase() === 'select') {
        const div = document.createElement('div');
        div.id = element.id || ('checkbox_' + Math.random().toString(36).slice(2));
        // carry over class names and inline styles to keep layout
        div.className = element.className || '';
        if (element.style && element.style.cssText) div.style.cssText = element.style.cssText;
        element.parentNode.replaceChild(div, element);
        container = div;
    }

    // Build markup
    const searchId = container.id + '_search';
    const allId = container.id + '_all';
    const listId = container.id + '_list';

    const html = [
        `<div class="multi-checkbox-root" style="font-size:13px;">`,
        `  <div class="multi-checkbox-search" style="margin-bottom:6px;">`,
        `    <input type="text" id="${searchId}" placeholder="Search..." style="width:100%;padding:6px;border:1px solid #ccc;border-radius:3px;" />`,
        `  </div>`,
        `  <div class="multi-checkbox-selectall" style="margin-bottom:6px;">`,
        `    <label style="cursor:pointer;"><input type="checkbox" id="${allId}" style="margin-right:6px;" checked /> Select All</label>`,
        `  </div>`,
        `  <div id="${listId}" class="multi-checkbox-list" style="max-height:150px;overflow:auto;border:1px solid #e6e6e6;padding:6px;border-radius:3px;background:#fff;"></div>`,
        `</div>`
    ].join('\n');

    container.innerHTML = html;

    const listDiv = container.querySelector('#' + listId);

    // Render each checkbox item
    list.forEach(function (item) {
        const val = escapeHtml(item.Code);
        const text = escapeHtml(item.Desp);
        const itemId = `${container.id}_chk_${val}`;
        const itemHtml =
            `<div class="checkbox-item" style="padding:4px 2px;">` +
            `  <label for="${itemId}" style="cursor:pointer;"><input type="checkbox" id="${itemId}" class="${container.id}_chk" value="${val}" style="margin-right:6px;" checked/> ${text}</label>` +
            `</div>`;
        listDiv.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Event wiring
    const selectAllCheckbox = document.getElementById(allId);
    const itemCheckboxSelector = '.' + container.id + '_chk';
    function getItemCheckboxes() {
        return Array.from(container.querySelectorAll(itemCheckboxSelector));
    }

    // Select All behavior
    selectAllCheckbox.addEventListener('change', function (ev) {
        const checked = ev.target.checked;
        getItemCheckboxes().forEach(function (chk) { chk.checked = checked; });
    });

    // Individual checkbox change updates Select All state
    getItemCheckboxes().forEach(function (chk) {
        chk.addEventListener('change', function () {
            const all = getItemCheckboxes();
            const checkedCount = all.filter(c => c.checked).length;
            selectAllCheckbox.checked = (checkedCount === all.length && all.length > 0);
            // If none checked, leave Select All unchecked
            if (checkedCount === 0) selectAllCheckbox.checked = false;
        });
    });

    // Search/filter behavior
    const searchInput = document.getElementById(searchId);
    searchInput.addEventListener('input', function (ev) {
        const term = ev.target.value.trim().toLowerCase();
        const items = container.querySelectorAll('.checkbox-item');
        items.forEach(function (div) {
            const text = div.textContent.trim().toLowerCase();
            div.style.display = (term === '' || text.indexOf(term) !== -1) ? '' : 'none';
        });
    });
}


function GetSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const checks = container.querySelectorAll('.' + containerId + '_chk + input, .' + containerId + '_chk'); // fallback
    // Better: select inputs directly
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"].' + containerId + '_chk'));
    return inputs.filter(i => i.checked).map(i => i.value);
}

/* Ensure datalabels plugin is loaded before rendering charts */
loadChartDataLabelsPlugin(() => {
    renderBarChart();
    renderRegionalSection(); // initial render (will be a no-op if elements missing)
    renderClientSection();   // initial attempt to render client visuals
});

/* ===== Regional charts + map rendering (existing) ===== */

function renderRegionalSection() {
    
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }

    // placeholder summary used only if API doesn't return useful data
    const placeholder = {
        stateMax: 'Maharashtra',
        cityMax: 'Thane',
        pareto: { labels: ['Maharashtra'], sales: [1.0], cumulative: [100] },
        regionSales: { labels: ['Maharashtra'], data: [22299.43] },
        polygon: [
            [19.35, 72.85],
            [19.40, 73.05],
            [19.10, 73.10],
            [19.00, 72.90],
            [19.15, 72.80]
        ],
        center: [19.9993, 72.5408],
        zoom: 10
    };

    Showloader();
    // Use mode 'SALESTAB_REGIONAL' (adjust if your API expects a different Mode)
    CustomerDashboardService.GetCustomerDashboardData('REGIONTAB', selectedDealers).then(function (response) {
        HideLoader();

        // Normalize response into a single "regionalSummary" object.
        let regionalSummary = Object.assign({}, placeholder);

        try {
            if (response) {
                // If API returns array, prefer first element
                const data = Array.isArray(response) && response.length > 0 ? response[0] : response;

                // map commonly returned field names to our shape (be tolerant)
                regionalSummary.stateMax = data.ConsigneeStateName || regionalSummary.stateMax;
                regionalSummary.cityMax = data.ConsigneeCityName || regionalSummary.cityMax;

                if (data.ConsigneeStateName && data.CurrentYearSales) {
                    regionalSummary.regionSales.labels = Array.isArray(data.RegionLabels) ? data.RegionLabels : String(data.ConsigneeStateName).split(',');
                    regionalSummary.regionSales.data = Array.isArray(data.RegionSalesData) ? data.RegionSalesData.map(Number) : String(data.CurrentYearSales).split(',').map(Number);
                }

                // If API provides polygon or center coordinates use them
                if (data.Polygon && Array.isArray(data.Polygon) && data.Polygon.length > 0) {
                    regionalSummary.polygon = data.Polygon;
                }
                if ((data.CenterLat && data.CenterLon) || (data.Center && Array.isArray(data.Center))) {
                    regionalSummary.center = data.Center && Array.isArray(data.Center) ? data.Center : [Number(data.CenterLat || data.Latitude || regionalSummary.center[0]), Number(data.CenterLon || data.Longitude || regionalSummary.center[1])];
                }
                if (data.Zoom) regionalSummary.zoom = Number(data.Zoom);

                // lookup city polygon/center if not already done
                const cityName = data.ConsigneeCityName || data.CityName;
                if (cityName) {
                    // async call — ensure function containing this is async or use .then()
                    getCityCenterAndPolygon(cityName).then(function(geo) {
                        if (geo) {
                            regionalSummary.center = geo.center || regionalSummary.center;
                            if (Array.isArray(geo.polygon) && geo.polygon.length > 0) {
                                regionalSummary.polygon = geo.polygon;
                            }
                            // now render map/chart as usual using regionalSummary
                            // (re-run the leaflet polygon/marker code)
                        }
                    }).catch(e => console.warn('city geo lookup failed', e));
                }

            }
        } catch (e) {
            console.warn('regional response mapping failed, using placeholder', e);
            regionalSummary = Object.assign({}, placeholder);
        }

        // write summary text
        const stateEl = document.getElementById('regional-state-max');
        const cityEl = document.getElementById('regional-city-max');
        if (stateEl) stateEl.textContent = regionalSummary.stateMax || '-';
        if (cityEl) cityEl.textContent = regionalSummary.cityMax || '-';

        // Region sales horizontal bar
        try {
            const regionCanvas = document.getElementById('regionSalesChart');
            if (regionCanvas) {
                regionCanvas.style.minWidth = regionCanvas.style.minWidth || '600px';

                const ctx2 = regionCanvas.getContext('2d');
                if (window.regionSalesChartInstance) {
                    try { window.regionSalesChartInstance.destroy(); } catch (e) { }
                }
                window.regionSalesChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: regionalSummary.regionSales.labels,
                        datasets: [{
                            label: 'Sales',
                            data: regionalSummary.regionSales.data,
                            backgroundColor: 'rgba(24,67,135,0.95)',
                            borderColor: 'rgba(24,67,135,1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            datalabels: {
                                anchor: 'end',
                                align: 'right',
                                color: '#fff',
                                formatter: function (value) {
                                    if (value === null || value === undefined) return '';
                                    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
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
                    plugins: [window.ChartDataLabels]
                });

                try { window.regionSalesChartInstance.resize(); window.regionSalesChartInstance.update(); } catch (e) { }
            }
        } catch (e) {
            console.warn('region sales chart failed', e);
        }

        // Leaflet map render (if coordinates available)
        try {
            if (typeof L !== 'undefined') {
                let mapEl = document.getElementById('regionalMap');
                if (mapEl) {
                    if (!window._regionalLeafletMap) {
                        window._regionalLeafletMap = L.map(mapEl).setView(regionalSummary.center, regionalSummary.zoom);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 18,
                            attribution: '&copy; OpenStreetMap contributors'
                        }).addTo(window._regionalLeafletMap);
                    } else {
                        window._regionalLeafletMap.setView(regionalSummary.center, regionalSummary.zoom);
                    }

                    if (window._regionalLayerGroup) {
                        window._regionalLayerGroup.clearLayers();
                    } else {
                        window._regionalLayerGroup = L.layerGroup().addTo(window._regionalLeafletMap);
                    }

                    const polygon = L.polygon(regionalSummary.polygon, {
                        color: '#992d2d',
                        weight: 2,
                        fillColor: '#992d2d',
                        fillOpacity: 0.35
                    }).addTo(window._regionalLeafletMap);

                    const marker = L.marker(regionalSummary.center).bindPopup(`${regionalSummary.cityMax}<br/>${regionalSummary.stateMax}`).addTo(window._regionalLeafletMap);

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
        // If API failed, render placeholder UI using existing placeholder logic
        // call itself with placeholder object to draw charts (simple fallback)
        try {
            // reuse previous placeholder-render path by directly assigning placeholder values
            const stateEl = document.getElementById('regional-state-max');
            const cityEl = document.getElementById('regional-city-max');
            if (stateEl) stateEl.textContent = placeholder.stateMax || '-';
            if (cityEl) cityEl.textContent = placeholder.cityMax || '-';
        } catch (e) { /* ignore */ }
    });
}

/* ===== NEW: Client charts + table rendering ===== */

function formatNumber(v) {
    if (v === null || v === undefined) return '';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderClientSection() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }
    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('CLIENTTAB', selectedDealers).then(function (response) {
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
        });
    }

    const productSpecTabBtn = document.getElementById('product-specification-tab');
    if (productSpecTabBtn) {
        productSpecTabBtn.addEventListener('shown.bs.tab', function () {
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
        }
        if (document.querySelector('#product-specification') && document.querySelector('#product-specification').classList.contains('show')) {
            renderProductSpecificationSection();
        }
    }, 300);
});

/* ===== Product Specification rendering ===== */
function renderProductSpecificationSection() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }

    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('PRODUCTSPECIFICATIONTAB', selectedDealers).then(function (response) {
        HideLoader();

        if (!response || response.length === 0) {
            console.warn('No product specification data received');
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
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
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
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
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
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }

    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('PRODUCTTAB', selectedDealers).then(function (response) {
    HideLoader();
        
        if (!response || response.length === 0) {
            console.warn('No product data received');
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
        const topProducts = response.slice(0, 5).map(function(item) {
            return {
       name: item['Products Name'] || '',
        value: Number(item['Current Year Sales'] || 0)
    };
        });

      // Pie: top products
        const prodCanvas = document.getElementById('topProductsPie');
        if (prodCanvas && topProducts.length > 0) {
      const labels = topProducts.map(p => p.name);
       const data = topProducts.map(p => p.value);
     if (window.topProductsPieInstance) try { window.topProductsPieInstance.destroy(); } catch (e) { }
          // compute min width based on label count to avoid huge chart stretching
         const minW = Math.min(Math.max(400, labels.length * 70), 1000);
     prodCanvas.style.minWidth = minW + 'px';
            const ctx = prodCanvas.getContext('2d');
            window.topProductsPieInstance = new Chart(ctx, {
        type: 'pie',
       data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#c0392b','#e74c3c','#d35400','#f39c12','#3498db'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
            try { window.topProductsPieInstance.resize(); window.topProductsPieInstance.update(); } catch (e) { }
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
        

    }).catch(function(err) {
        HideLoader();
        console.error('Error fetching product data:', err);
    });
}

/* ===== Target & Growth rendering ===== */

function renderTargetGrowthSection() {
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');
    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }
    if (selectedDealers == '') {
        return;
    }

    Showloader();
    CustomerDashboardService.GetCustomerDashboardData('TARGETGROWTHTAB', selectedDealers).then(function (response) {
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
  
/* ===== existing service calls to populate select lists ===== */
CRMReportsServices.GetSalespersonList().then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
        // Wire change event to root container so dllSalesPresonListChange fires when checkboxes change
        try {
            const root = document.getElementById('ddlSalesPersonlist');
            if (root) {
                root.removeEventListener('change', dllSalesPresonListChange);
                root.addEventListener('change', dllSalesPresonListChange);
            }
        } catch (e) { console.warn('Could not attach change handler to ddlSalesPresonlist', e); }
    } else {
        const el = $('#ddlSalesPersonlist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
});

// Fires when the sales person multi-checkbox list changes. Alerts selected values.
function dllSalesPresonListChange() {
    try {
        const vals = GetSelectedValues('ddlSalesPersonlist');
        if (!vals || vals.length === 0) {
           // alert('No SalesPerson selected');
           // return;
        }

        // Fetch dealer list for each selected salesperson and merge unique results
        const promises = vals.map(function (code) {
            try {
                return CRMReportsServices.GetDealerList(code);
            } catch (e) {
                return Promise.resolve([]);
            }
        });
        Showloader();
        Promise.all(promises).then(function (responses) {
            HideLoader();
            // responses is array of arrays
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
                try {
                    BindSelectList($('#ddlDealerNamelist')[0], merged.map(function (item) { return { Code: item.Code, Desp: item.AccountDesp }; }));
                } catch (e) {
                    console.error('Error binding dealer list after salesperson change', e);
                }
            } else {
                G_ddlDealerNameList = [];
                const el = $('#ddlDealerNamelist')[0];
                if (el) el.innerHTML = '';
            }
        }).catch(function (err) {
            console.error('Error fetching dealer lists for selected salespersons', err);
            G_ddlDealerNameList = [];
            const el = $('#ddlDealerNamelist')[0];
            if (el) el.innerHTML = '';
        });
    } catch (e) {
        console.error('dllSalesPresonListChange error', e);
    }
}

CRMReportsServices.GetDealerList().then(function (response) {
    if (response && response.length > 0) {
        // cache full response globally
        G_ddlDealerNameList = response.slice();
        BindSelectList($('#ddlDealerNamelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
    } else {
        // clear cache and UI
        G_ddlDealerNameList = [];
        const el = $('#ddlDealerNamelist')[0];
        if (el) el.innerHTML = '';
    }
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
    const el = $('#ddlDealerNamelist')[0];
    // on error clear cache
    G_ddlDealerNameList = [];
    if (el) el.innerHTML = '';
});

function CustomerDashboard_ShowReport() { 
    // For Sales Person dropdown
    //const selectedSalesPersons = GetSelectedValues('ddlSalesPersonlist');
    // For Dealer Name dropdown
    let selectedDealers = GetSelectedValues('ddlDealerNamelist');
    selectedDealers = selectedDealers.join(',');

    if (AreAllSelected('ddlDealerNamelist') === true) {
        selectedDealers = '0';
    }

    if (selectedDealers == '') {
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
    }
    if (document.querySelector('#product-specification') && document.querySelector('#product-specification').classList.contains('show')) {
        renderProductSpecificationSection();
    }
    //renderBarChart();
    //Showloader();
    //CustomerDashboardService.GetCustomerDashboardData('CLIENTTAB', selectedDealers).then(function (response) {
    //    HideLoader();
    //    const StringFilterColumn = [];
    //    const NumericFilterColumn = [];
    //    const DateFilterColumn = [];
    //    const Button = false;
    //    const showButtons = []
    //    const StringdoubleFilterColumn = [];
    //    const hiddenColumns = [];
    //    const ColumnAlignment = { 'Action': ';min-width:145px' };


    //    if (response.length > 0) {
    //        BizsolCustomFilterGrid.CreateDataTable("clientSalesTableHeader", "clientSalesTableBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
    //    }
    //})

}


function AreAllSelected(containerId) {
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

    // Try Nominatim first (returns geojson polygon sometimes)
    try {
        const email = 'your@email.example'; // replace with contact email per Nominatim policy
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&q=${encodeURIComponent(cityName)}&email=${encodeURIComponent(email)}`;
        const nomRes = await fetch(nominatimUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (Array.isArray(nomData) && nomData.length > 0) {
                const item = nomData[0];
                const center = [Number(item.lat), Number(item.lon)];
                let polygon = null;
                if (item.geojson && (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon')) {
                    // normalize to one polygon (outer ring)
                    if (item.geojson.type === 'Polygon') {
                        polygon = item.geojson.coordinates[0].map(coord => [coord[1], coord[0]]); // [lat,lon]
                    } else if (item.geojson.type === 'MultiPolygon') {
                        polygon = item.geojson.coordinates[0][0].map(coord => [coord[1], coord[0]]);
                    }
                }
                const out = { center, polygon };
                _cityGeoCache.set(key, out);
                return out;
            }
        }
    } catch (e) {
        console.warn('Nominatim lookup failed', e);
    }

    // Fallback: Overpass API to fetch administrative boundary relation geometry
    try {
        // Query for relation with this name and admin boundary (admin_level can vary by country)
        // Uses out geom to get coordinates
        const overpassQuery = `[out:json][timeout:25];
relation["name"="${cityName}"]["boundary"="administrative"];
out geom;`;
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const res = await fetch(overpassUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: overpassQuery
        });
        if (res.ok) {
            const json = await res.json();
            if (json.elements && json.elements.length > 0) {
                // pick first relation element with geometry
                const rel = json.elements.find(e => e.type === 'relation' && Array.isArray(e.members) === false ? false : true) || json.elements[0];
                // Overpass sometimes returns geometry on relation.members or on ways. Easiest: build polygon from rel.geometry if exists
                if (rel && rel.geometry && Array.isArray(rel.geometry) && rel.geometry.length > 0) {
                    const polygon = rel.geometry.map(g => [g.lat, g.lon]);
                    // center as average of polygon vertices (simple centroid fallback)
                    const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
                    const lon = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
                    const out = { center: [lat, lon], polygon };
                    _cityGeoCache.set(key, out);
                    return out;
                }
            }
        }
    } catch (e) {
        console.warn('Overpass lookup failed', e);
    }

    // Final fallback: try a simple nominatim search (without polygon) for center only
    try {
        const nomUrl2 = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(cityName)}`;
        const r = await fetch(nomUrl2);
        if (r.ok) {
            const j = await r.json();
            if (Array.isArray(j) && j.length > 0) {
                const center = [Number(j[0].lat), Number(j[0].lon)];
                const out = { center, polygon: null };
                _cityGeoCache.set(key, out);
                return out;
            }
        }
    } catch (e) { /* ignore */ }

    _cityGeoCache.set(key, null);
    return null;
}

window.CustomerDashboard_ShowReport = CustomerDashboard_ShowReport;

