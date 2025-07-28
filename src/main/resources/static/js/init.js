window.addEventListener('DOMContentLoaded', () => {
    const ctx1 = document.getElementById('deviationChart').getContext('2d');
    window.trajectoryChart = new Chart(ctx1, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: false,
            plugins: { legend: { display: true } },
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Долгота' } },
                y: { type: 'linear', title: { display: true, text: 'Широта' } }
            }
        }
    });

    const ctx2 = document.getElementById('forecastDeviationChart').getContext('2d');
    window.forecastDeviationChart = new Chart(ctx2, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Горизонтальное отклонение (м)', data: [], borderColor: 'red', fill: false, tension: 0.1 },
            { label: 'Отклонение по высоте (м)', data: [], borderColor: 'purple', fill: false, tension: 0.1 }
        ] },
        options: {
            responsive: false,
            plugins: { legend: { display: true } },
            scales: {
                x: { title: { display: true, text: 'Время (сек)' } },
                y: { title: { display: true, text: 'Отклонение (м)' } }
            }
        }
    });

    const ctx3 = document.getElementById('realtimeDeviationChart').getContext('2d');
    window.realtimeDeviationChart = new Chart(ctx3, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Горизонтальное отклонение (м) — новые координаты', data: [], borderColor: 'darkred', fill: false, tension: 0.1 },
            { label: 'Отклонение по высоте (м) — новые координаты', data: [], borderColor: 'darkmagenta', fill: false, tension: 0.1 }
        ] },
        options: {
            responsive: false,
            plugins: { legend: { display: true } },
            scales: {
                x: { title: { display: true, text: 'Время (сек)' } },
                y: { title: { display: true, text: 'Отклонение (м)' } }
            }
        }
    });
    init3DVisualization();
}); 