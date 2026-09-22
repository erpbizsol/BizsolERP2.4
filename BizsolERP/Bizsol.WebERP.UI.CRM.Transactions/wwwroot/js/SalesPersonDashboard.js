import { SalesPersonDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesPersonDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const METRICS = ['Sales', 'Receipt', 'Visit'];
const PERIODS = ['Day', 'Month'];

let chartPaymentDonut = null;

$(document).ready(function () {
    $('#ERPHeading').text('Sales Person Dashboard');
    BizSolHelperFunction.applyUserDashboardMenuBackButton('#btnBackToUserDashboardMenu');
    $('#btnBackToUserDashboardMenu').on('click', function () {
        BizSolHelperFunction.goToUserDashboardMenu();
    });
    loadDashboard();
});

function setLoading(isLoading) {
    $('#spdLoader').toggleClass('show', isLoading);
}

function loadDashboard() {
    setLoading(true);
    Promise.all([loadActivitySummary(), loadPaymentSummary()])
        .finally(function () {
            setLoading(false);
        });
}

function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
    return null;
}

function loadActivitySummary() {
    return SalesPersonDashboardService.GetActivitySummary()
        .then(function (response) {
            const data = normalizeActivityData(response);
            bindActivityValues('Day', data.Day);
            bindActivityValues('Month', data.Month);
        })
        .catch(function (err) {
            console.error('Activity summary error:', err);
            resetActivityValues();
        });
}

function loadPaymentSummary() {
    return SalesPersonDashboardService.GetPaymentSummary()
        .then(function (response) {
            renderPaymentSummary(response);
        })
        .catch(function (err) {
            console.error('Payment summary error:', err);
            renderPaymentSummary({ Payment: 0, Achieved: 0, AchievementPercent: 0 });
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
