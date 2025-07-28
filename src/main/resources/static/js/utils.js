function formatCoordinate(value, decimals = 6) {
    return parseFloat(value).toFixed(decimals);
}

function formatAltitude(value, decimals = 2) {
    return parseFloat(value).toFixed(decimals);
}

function validateTelemetryPoint(point) {
    return point && 
           typeof point.time === 'number' && 
           Array.isArray(point.position) && 
           point.position.length === 2 &&
           typeof point.altitude === 'number';
}
function checkRequiredElements() {
    const requiredIds = [
        'droneId', 'droneType', 'telemetry-container', 
        'deviationChart', 'forecastDeviationChart', 
        'realtimeDeviationChart', '3d-container', '3dCanvas'
    ];
    
    const missingElements = requiredIds.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return false;
    }
    
    return true;
}

function logError(message, error = null) {
    console.error('DroneMovement Error:', message, error);
    if (document.getElementById('response')) {
        document.getElementById('response').textContent = `Error: ${message}`;
    }
}

function logInfo(message) {
    console.log('DroneMovement Info:', message);
    if (document.getElementById('response')) {
        document.getElementById('response').textContent = message;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 