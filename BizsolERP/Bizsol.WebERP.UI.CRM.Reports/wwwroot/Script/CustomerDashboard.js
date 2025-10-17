import { CustomerDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CustomerDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

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
    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { }
    }
    const canvas = document.getElementById('barSalesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.barChartInstance) {
        try { window.barChartInstance.destroy(); } catch (e) { }
    }
    window.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Year Sales',
                    data: previousYearSales,
                    backgroundColor: 'rgba(192,57,43,0.85)',
                    borderColor: 'rgba(192,57,43,1)',
                    borderWidth: 1
                },
                {
                    label: 'Last Year Sales',
                    data: currentYearSales,
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
                tooltip: { enabled: true },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    offset: -6,
                    color: '#222',
                    font: { weight: 'bold', size: 13 },
                    formatter: function (value) {
                        return value;
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: 'Sales' }
                }
            }
        },
        plugins: [window.ChartDataLabels]
    });
}

function renderLineChart() {
    // Register chartjs-plugin-datalabels if available
    if (typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch (e) { }
    }
    const canvas = document.getElementById('lineSalesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.lineChartInstance) {
        try { window.lineChartInstance.destroy(); } catch (e) { }
    }
    const areaGradient = ctx.createLinearGradient(0, 0, 0, 300);
    areaGradient.addColorStop(0, 'rgba(192,57,43,0.28)');
    areaGradient.addColorStop(1, 'rgba(192,57,43,0.02)');

    window.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales',
                    data: currentYearSales,
                    fill: true,
                    backgroundColor: areaGradient,
                    borderColor: 'rgba(192,57,43,0.9)',
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(192,57,43,1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#222',
                        font: { weight: 'bold', size: 13 },
                        formatter: function (value) {
                            return value;
                        }
                    }
                },
                {
                    label: 'Target (dashed)',
                    data: Array(labels.length).fill(20),
                    type: 'line',
                    borderColor: 'rgba(54, 162, 235, 0.6)',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    tension: 0,
                    datalabels: { display: false }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false },
                datalabels: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Month' },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Sales' },
                    ticks: { precision: 0 }
                }
            }
        },
        plugins: [window.ChartDataLabels]
    });
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

/*
 BindSelectList(element, list)
 - element: the DOM element passed in (could be a <select> or a container <div>)
 - list: array of objects { Code: ..., Desp: ... }
 Behavior:
 - If element is a <select>, replace it with a <div> (keeps same id).
 - Render a search box, a "Select All" checkbox, and a list of checkbox items.
 - Add event handlers for search, select all toggle, and individual checkbox change.
*/
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
        `    <label style="cursor:pointer;"><input type="checkbox" id="${allId}" style="margin-right:6px;" /> Select All</label>`,
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
            `  <label for="${itemId}" style="cursor:pointer;"><input type="checkbox" id="${itemId}" class="${container.id}_chk" value="${val}" style="margin-right:6px;" /> ${text}</label>` +
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

/* Helper: retrieve selected values for a given container id (if needed elsewhere) */
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
    renderLineChart();
});

CRMReportsServices.GetSalespersonList().then(function (response) {
    if (response.length > 0) {
        // Bind as checkbox list (list of { Code, PersonName })
        BindSelectList($('#ddlSalesPersonlist')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
        // Removed select2 initialization - replaced with checkbox multi-select with search & select-all.
    } else {
        // If no response, remove/clear container
        const el = $('#ddlSalesPersonlist')[0];
        if (el) {
            if (el.tagName && el.tagName.toLowerCase() === 'select') {
                el.innerHTML = '';
            } else {
                el.innerHTML = '';
            }
        }
    }
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
});

CRMReportsServices.GetDealerList().then(function (response) {
    if (response.length > 0) {
        // Bind as checkbox list (list of { Code, AccountDesp })
        BindSelectList($('#ddlDealerNamelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        // Removed select2 initialization - replaced with checkbox multi-select with search & select-all.
    } else {
        const el = $('#ddlDealerNamelist')[0];
        if (el) {
            el.innerHTML = '';
        }
    }
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
    const el = $('#ddlDealerNamelist')[0];
    if (el) el.innerHTML = '';
});

function CustomerDashboard_ShowReport() { 
// For Sales Person dropdown
const selectedSalesPersons = GetSelectedValues('ddlSalesPersonlist');

// For Dealer Name dropdown
const selectedDealers = GetSelectedValues('ddlDealerNamelist');

console.log(selectedSalesPersons); // Array of selected codes
    console.log(selectedDealers);      // Array of selected codes
}
window.CustomerDashboard_ShowReport = CustomerDashboard_ShowReport;