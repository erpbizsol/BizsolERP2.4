import { SalesPersonDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesPersonDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const METRICS = ['Sales', 'Receipt', 'Visit'];
const PERIODS = ['Day', 'Month'];

/** Set false when API is ready — dummy data used for UI preview */
//const USE_DUMMY_DATA = true;
const USE_DUMMY_DATA = false;

/** Set true to show Performance tab (hidden in UI until ready) */
const SHOW_PERFORMANCE_TAB = false;

let activeTab = 'activity';
let chartPerformance = null;
let chartPaymentDonut = null;

$(document).ready(function () {
    $('#ERPHeading').text('Sales Person Dashboard');
    BizSolHelperFunction.applyUserDashboardMenuBackButton('#btnBackToUserDashboardMenu');
    $('#btnBackToUserDashboardMenu').on('click', function () {
        BizSolHelperFunction.goToUserDashboardMenu();
    });
    bindTabEvents();
    loadActiveTab();
});

function bindTabEvents() {
    $('.spd-tab').on('click', function () {
        const tab = $(this).data('tab');
        switchTab(tab);
        loadActiveTab();
    });
}

function switchTab(tab) {
    activeTab = tab;
    $('.spd-tab').removeClass('active');
    $(`.spd-tab[data-tab="${tab}"]`).addClass('active');
    $('.spd-tab-panel').removeClass('active');
    if (tab === 'activity') {
        $('#panelActivity').addClass('active');
    } else if (tab === 'performance' && SHOW_PERFORMANCE_TAB) {
        $('#panelPerformance').addClass('active');
    } else {
        $('#panelPayment').addClass('active');
        activeTab = 'payment';
    }
}

function setLoading(isLoading) {
    $('#spdLoader').toggleClass('show', isLoading);
}

function loadActiveTab() {
    if (activeTab === 'activity') {
        loadActivitySummary();
    } else if (activeTab === 'performance' && SHOW_PERFORMANCE_TAB) {
        loadPerformanceSummary();
    } else {
        loadPaymentSummary();
    }
}

function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
    return null;
}

function getDummyActivitySummary() {
    return [{
        DaySalesCount: 3,
        DaySalesTotal: 125000.0,
        DayReceiptCount: 2,
        DayReceiptTotal: 85000.0,
        DayVisitCount: 5,
        DayVisitTotal: 0.0,
        MonthSalesCount: 42,
        MonthSalesTotal: 1850000.0,
        MonthReceiptCount: 28,
        MonthReceiptTotal: 920000.0,
        MonthVisitCount: 86,
        MonthVisitTotal: 0.0,
    }];
}

function getDummyPerformanceSummary() {
    return [
        { Metric: 'Collection Target', Day: 300000, Month: 4500000 },
        { Metric: 'Collection Achieved', Day: 85000, Month: 920000 },
        { Metric: 'Achievement %', Day: 28.3, Month: 20.4 },
    ];
}

function getDummyPaymentSummary() {
    return [{
        Payment: 4500000,
        Achieved: 920000,
        AchievementPercent: 20.4,
    }];
}

function isEmptyActivityResponse(response) {
    const data = normalizeActivityData(response);
    return METRICS.every(function (m) {
        return data.Day[m].Count === 0 && data.Day[m].Total === 0
            && data.Month[m].Count === 0 && data.Month[m].Total === 0;
    });
}

function isEmptyPerformanceResponse(response) {
    const rows = Array.isArray(response) ? response : (response ? [response] : []);
    return !rows.length;
}

function isEmptyPaymentResponse(response) {
    const row = Array.isArray(response) ? (response[0] || {}) : (response || {});
    return numVal(row.Payment ?? row.payment) === 0
        && numVal(row.Achieved ?? row.achieved) === 0;
}

function loadActivitySummary() {
    if (USE_DUMMY_DATA) {
        const data = normalizeActivityData(getDummyActivitySummary());
        bindActivityValues('Day', data.Day);
        bindActivityValues('Month', data.Month);
        return;
    }

    setLoading(true);

    SalesPersonDashboardService.GetActivitySummary()
        .then(function (response) {
            const payload = isEmptyActivityResponse(response) ? getDummyActivitySummary() : response;
            const data = normalizeActivityData(payload);
            bindActivityValues('Day', data.Day);
            bindActivityValues('Month', data.Month);
        })
        .catch(function (err) {
            console.error('Activity summary error:', err);
            const data = normalizeActivityData(getDummyActivitySummary());
            bindActivityValues('Day', data.Day);
            bindActivityValues('Month', data.Month);
        })
        .finally(function () {
            setLoading(false);
        });
}

function loadPerformanceSummary() {
    if (USE_DUMMY_DATA) {
        renderPerformanceChart(getDummyPerformanceSummary());
        return;
    }

    setLoading(true);

    SalesPersonDashboardService.GetPerformanceSummary()
        .then(function (response) {
            renderPerformanceChart(
                isEmptyPerformanceResponse(response) ? getDummyPerformanceSummary() : response
            );
        })
        .catch(function (err) {
            console.error('Performance summary error:', err);
            renderPerformanceChart(getDummyPerformanceSummary());
        })
        .finally(function () {
            setLoading(false);
        });
}

function loadPaymentSummary() {
    if (USE_DUMMY_DATA) {
        renderPaymentSummary(getDummyPaymentSummary());
        return;
    }

    setLoading(true);

    SalesPersonDashboardService.GetPaymentSummary()
        .then(function (response) {
            renderPaymentSummary(
                isEmptyPaymentResponse(response) ? getDummyPaymentSummary() : response
            );
        })
        .catch(function (err) {
            console.error('Payment summary error:', err);
            renderPaymentSummary(getDummyPaymentSummary());
        })
        .finally(function () {
            setLoading(false);
        });
}

function parsePerformanceRows(response) {
    const rows = Array.isArray(response) ? response : (response ? [response] : []);
    const map = {};

    rows.forEach(function (row) {
        const metric = String(row.Metric || row.metric || row.Description || row.description || '').trim();
        if (!metric) return;
        map[metric.toLowerCase()] = {
            day: numVal(row.Day ?? row.day ?? row.DayValue ?? row.dayValue),
            month: numVal(row.Month ?? row.month ?? row.MonthValue ?? row.monthValue),
        };
    });

    const target = map['collection target'] || { day: 0, month: 0 };
    const achieved = map['collection achieved'] || { day: 0, month: 0 };
    const pct = map['achievement %'] || map['achievement%'] || { day: 0, month: 0 };

    return { target, achieved, pct };
}

function renderPerformanceChart(response) {
    const { target, achieved, pct } = parsePerformanceRows(response);

    $('#perfDayPct').text(pct.day.toFixed(1) + '%');
    $('#perfMonthPct').text(pct.month.toFixed(1) + '%');

    const canvas = document.getElementById('chartPerformance');
    if (!canvas || typeof Chart === 'undefined') return;

    chartPerformance = destroyChart(chartPerformance);
    chartPerformance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Collection Target', 'Collection Achieved'],
            datasets: [
                {
                    label: 'Day',
                    data: [target.day, achieved.day],
                    backgroundColor: '#f58220',
                    borderRadius: 4,
                    barPercentage: 0.55,
                },
                {
                    label: 'Month',
                    data: [target.month, achieved.month],
                    backgroundColor: '#9b7bb8',
                    borderRadius: 4,
                    barPercentage: 0.55,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return ` ${ctx.dataset.label}: ${fmtDisplayAmount(ctx.parsed.y)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return fmtAmount(value);
                        },
                    },
                },
            },
        },
    });
}

function parsePaymentSummaryData(response) {
    const row = Array.isArray(response) ? (response[0] || {}) : (response || {});

    const payment = numVal(
        row.Payment ?? row.payment ?? row.PaymentTarget ?? row.Target ?? row.MonthTarget
    );
    const achieved = numVal(
        row.Achieved ?? row.achieved ?? row.PaymentAchieved ?? row.MonthAchieved
    );
    let percent = numVal(row.AchievementPercent ?? row.achievementPercent ?? row.Percent);

    if (!percent && payment > 0) {
        percent = (achieved / payment) * 100;
    }

    return { payment, achieved, percent };
}

function renderPaymentSummary(response) {
    const { payment, achieved, percent } = parsePaymentSummaryData(response);

    $('#paymentPercentText').text(percent.toFixed(1) + ' %');
    $('#paymentTargetValue').text(fmtDisplayAmount(payment));
    $('#paymentAchievedValue').text(fmtDisplayAmount(achieved));

    const maxVal = Math.max(payment, achieved, 1);
    const maxBarHeight = 120;
    const paymentBarH = Math.max(8, Math.round((payment / maxVal) * maxBarHeight));
    const achievedBarH = Math.max(8, Math.round((achieved / maxVal) * maxBarHeight));

    $('#paymentTargetBar').css('height', paymentBarH + 'px');
    $('#paymentAchievedBar').css('height', achievedBarH + 'px');

    const canvas = document.getElementById('chartPaymentDonut');
    if (!canvas || typeof Chart === 'undefined') return;

    const achievedPct = Math.min(Math.max(percent, 0), 100);
    const remainingPct = 100 - achievedPct;

    chartPaymentDonut = destroyChart(chartPaymentDonut);
    chartPaymentDonut = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
                data: [achievedPct, remainingPct],
                backgroundColor: ['#2e8b3c', '#e8e8e8'],
                borderWidth: 0,
                hoverOffset: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '78%',
            animation: { animateRotate: true, duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
            },
        },
    });
}

function normalizeActivityData(response) {
    const result = {
        Day: defaultMetricBlock(),
        Month: defaultMetricBlock(),
    };

    if (!response) return result;

    const rows = Array.isArray(response) ? response : [response];

    rows.forEach(function (row) {
        PERIODS.forEach(function (period) {
            METRICS.forEach(function (metric) {
                const countKey = period + metric + 'Count';
                const totalKey = period + metric + 'Total';
                const altCountKey = period.toLowerCase() + metric + 'Count';
                const altTotalKey = period.toLowerCase() + metric + 'Total';

                if (row[countKey] != null || row[totalKey] != null) {
                    result[period][metric].Count = numVal(row[countKey]);
                    result[period][metric].Total = numVal(row[totalKey]);
                } else if (row[altCountKey] != null || row[altTotalKey] != null) {
                    result[period][metric].Count = numVal(row[altCountKey]);
                    result[period][metric].Total = numVal(row[altTotalKey]);
                }

                if (row.Period && row.ActivityType) {
                    const p = String(row.Period).toLowerCase();
                    const t = String(row.ActivityType).toLowerCase();
                    const periodKey = p === 'day' ? 'Day' : p === 'month' ? 'Month' : null;
                    const metricKey = capitalizeMetric(t);
                    if (periodKey && metricKey && result[periodKey][metricKey]) {
                        result[periodKey][metricKey].Count = numVal(row.Count);
                        result[periodKey][metricKey].Total = numVal(row.Total);
                    }
                }
            });
        });

        if (row.Day && typeof row.Day === 'object') {
            mergeBlock(result.Day, row.Day);
        }
        if (row.Month && typeof row.Month === 'object') {
            mergeBlock(result.Month, row.Month);
        }
    });

    return result;
}

function mergeBlock(target, source) {
    METRICS.forEach(function (metric) {
        const key = metric.toLowerCase();
        const src = source[metric] || source[key];
        if (src) {
            target[metric].Count = numVal(src.Count ?? src.count);
            target[metric].Total = numVal(src.Total ?? src.total);
        }
    });
}

function defaultMetricBlock() {
    return {
        Sales: { Count: 0, Total: 0 },
        Receipt: { Count: 0, Total: 0 },
        Visit: { Count: 0, Total: 0 },
    };
}

function capitalizeMetric(value) {
    const map = { sales: 'Sales', receipt: 'Receipt', visit: 'Visit' };
    return map[value] || null;
}

function numVal(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function fmtCount(v) {
    return String(Math.round(numVal(v)));
}

function fmtTotal(v) {
    return numVal(v).toFixed(1);
}

function fmtAmount(v) {
    const n = numVal(v);
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(0);
}

function fmtDisplayAmount(v) {
    const n = numVal(v);
    if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + ' L';
    if (n >= 1000) return (n / 1000).toFixed(1) + ' K';
    return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

function bindActivityValues(period, block) {
    const prefix = period.toLowerCase();
    METRICS.forEach(function (metric) {
        const data = block[metric] || { Count: 0, Total: 0 };
        $('#' + prefix + metric + 'Count').text(fmtCount(data.Count));
        $('#' + prefix + metric + 'Total').text(fmtTotal(data.Total));
    });
}

function resetActivityValues() {
    bindActivityValues('Day', defaultMetricBlock());
    bindActivityValues('Month', defaultMetricBlock());
}
