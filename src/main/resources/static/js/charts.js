function drawTrajectoryGraph(data) {
    const ctx = document.getElementById('deviationChart').getContext('2d');
    const current = data.currentTrajectory || [];
    const forecast = data.forecast || [];
    const real = data.realContinuation || [];
    const makeXY = arr => arr.map(p => ({x: p.longitude, y: p.latitude}));
    const datasets = [];
    if (current.length > 0) {
        datasets.push({
            label: 'Текущая траектория',
            data: makeXY(current),
            borderColor: 'blue',
            backgroundColor: 'rgba(0,0,255,0.1)',
            fill: false,
            tension: 0.1
        });
    }
    if (forecast.length > 0) {
        datasets.push({
            label: 'Прогноз',
            data: makeXY(forecast),
            borderColor: 'orange',
            backgroundColor: 'rgba(255,165,0,0.1)',
            borderDash: [5,5],
            fill: false,
            tension: 0.1
        });
    }
    if (real.length > 0) {
        datasets.push({
            label: 'Реальное продолжение',
            data: makeXY(real),
            borderColor: 'green',
            backgroundColor: 'rgba(0,255,0,0.1)',
            borderDash: [2,2],
            fill: false,
            tension: 0.1
        });
    }
    if (window.trajectoryChart) {
        window.trajectoryChart.destroy();
    }
    window.trajectoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Долгота' }
                },
                y: {
                    type: 'linear',
                    title: { display: true, text: 'Широта' }
                }
            }
        }
    });
    drawDeviationGraph(forecast, real);
    drawRealtimeDeviationGraph(forecast, real);
    update3DVisualization(data);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function drawDeviationGraph(forecast, real) {
    const ctx = document.getElementById('forecastDeviationChart').getContext('2d');
    const deviation = [];
    const altDeviation = [];
    const labels = [];
    for (let i = 0; i < Math.min(forecast.length, real.length); i++) {
        const f = forecast[i];
        const r = real[i];
        const dist = haversineDistance(f.latitude, f.longitude, r.latitude, r.longitude);
        const altDev = Math.abs(f.altitude - r.altitude);
        deviation.push(dist);
        altDeviation.push(altDev);
        labels.push(f.secondsAhead || f.time || i+1);
    }
    if (window.forecastDeviationChart && typeof window.forecastDeviationChart.destroy === 'function') {
        window.forecastDeviationChart.destroy();
    }
    window.forecastDeviationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Горизонтальное отклонение (м)',
                    data: deviation,
                    borderColor: 'red',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Отклонение по высоте (м)',
                    data: altDeviation,
                    borderColor: 'purple',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Время (сек)' }
                },
                y: {
                    title: { display: true, text: 'Отклонение (м)' }
                }
            }
        }
    });
}

function drawRealtimeDeviationGraph(forecast, real) {
    const ctx = document.getElementById('realtimeDeviationChart').getContext('2d');
    const deviation = [];
    const altDeviation = [];
    const labels = [];
    for (let i = forecast.length; i < real.length; i++) {
        const r = real[i];
        const f = forecast[forecast.length - 1];
        const dist = haversineDistance(f.latitude, f.longitude, r.latitude, r.longitude);
        const altDev = Math.abs(f.altitude - r.altitude);
        deviation.push(dist);
        altDeviation.push(altDev);
        labels.push(r.secondsAhead || r.time || i+1);
    }
    if (window.realtimeDeviationChart && typeof window.realtimeDeviationChart.destroy === 'function') {
        window.realtimeDeviationChart.destroy();
    }
    window.realtimeDeviationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Горизонтальное отклонение (м) — новые координаты',
                    data: deviation,
                    borderColor: 'darkred',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Отклонение по высоте (м) — новые координаты',
                    data: altDeviation,
                    borderColor: 'darkmagenta',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Время (сек)' }
                },
                y: {
                    title: { display: true, text: 'Отклонение (м)' }
                }
            }
        }
    });
} 