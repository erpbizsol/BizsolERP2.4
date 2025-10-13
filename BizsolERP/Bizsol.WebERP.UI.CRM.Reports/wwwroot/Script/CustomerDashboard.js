import { CustomerDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CustomerDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

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

// Ensure datalabels plugin is loaded before rendering charts
loadChartDataLabelsPlugin(() => {
    renderBarChart();
    renderLineChart();
});
