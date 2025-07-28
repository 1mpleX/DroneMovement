window.predictedPath = [];
window.allTelemetry = [];
window.baseTelemetry = [];
window.generatedTelemetry = [];
window.replayInterval = null;
window.responseHistory = [];

function addTelemetryPoint() {
    const container = document.getElementById("telemetry-container");
    if (!container) {
        logError("Telemetry container not found");
        return;
    }

    const div = document.createElement("div");
    div.className = "telemetry-block";

    div.innerHTML = `
        <label>Time (seconds):</label>
        <input type="number" step="0.01" class="time" placeholder="0"/>

        <label>Longitude:</label>
        <input type="number" step="0.000001" class="longitude" placeholder="00.000000"/>

        <label>Latitude:</label>
        <input type="number" step="0.000001" class="latitude" placeholder="00.000000"/>

        <label>Altitude:</label>
        <input type="number" step="0.01" class="altitude" placeholder="100"/>

        <button onclick="this.parentNode.remove()">🗑 Remove</button>
    `;

    container.appendChild(div);
}

function loadJsonFile() {
    const input = document.getElementById('jsonFileInput');
    if (!input.files || input.files.length === 0) {
        alert('Выберите JSON файл.');
        return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.telemetry && Array.isArray(data.telemetry)) {
                const validTelemetry = data.telemetry.filter(point => validateTelemetryPoint(point));
                if (validTelemetry.length !== data.telemetry.length) {
                    console.warn(`Filtered ${data.telemetry.length - validTelemetry.length} invalid telemetry points`);
                }
                fillTelemetryBlocks(validTelemetry);
                if (data.drone_id) document.getElementById('droneId').value = data.drone_id;
                if (data.drone_type) document.getElementById('droneType').value = data.drone_type;
                logInfo(`Loaded ${validTelemetry.length} telemetry points`);
            } else {
                alert('Некорректный формат файла: нет telemetry.');
            }
        } catch (err) {
            logError('Ошибка чтения файла', err);
            alert('Ошибка чтения файла: ' + err);
        }
    };
    reader.readAsText(file);
}

function fillTelemetryBlocks(telemetry) {
    const container = document.getElementById('telemetry-container');
    if (!container) {
        logError("Telemetry container not found");
        return;
    }
    
    container.innerHTML = '';
    telemetry.forEach(point => {
        const div = document.createElement('div');
        div.className = 'telemetry-block';
        div.innerHTML = `
            <label>Time (seconds):</label>
            <input type="number" step="0.01" class="time" value="${point.time}"/>
            <label>Longitude:</label>
            <input type="number" step="0.000001" class="longitude" value="${formatCoordinate(point.position[0])}"/>
            <label>Latitude:</label>
            <input type="number" step="0.000001" class="latitude" value="${formatCoordinate(point.position[1])}"/>
            <label>Altitude:</label>
            <input type="number" step="0.01" class="altitude" value="${formatAltitude(point.altitude)}"/>
            <button onclick="this.parentNode.remove()">🗑 Remove</button>
        `;
        container.appendChild(div);
    });
}

function collectTelemetryData() {
    const blocks = document.querySelectorAll(".telemetry-block");
    const telemetry = [];
    blocks.forEach(block => {
        const time = parseFloat(block.querySelector(".time").value);
        const lon = parseFloat(block.querySelector(".longitude").value);
        const lat = parseFloat(block.querySelector(".latitude").value);
        const alt = parseFloat(block.querySelector(".altitude").value);
        
        const point = {
            time: time,
            position: [lon, lat],
            altitude: alt
        };
        
        if (validateTelemetryPoint(point)) {
            telemetry.push(point);
        }
    });
    return telemetry;
}

function getDroneInfo() {
    return {
        droneId: document.getElementById("droneId").value.trim(),
        droneType: document.getElementById("droneType").value.trim()
    };
} 