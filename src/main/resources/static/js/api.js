function detectDroneType() {
    if (!checkRequiredElements()) {
        logError("Required elements not found");
        return;
    }

    const { droneId, droneType } = getDroneInfo();
    const telemetry = collectTelemetryData();

    if (telemetry.length < 3) {
        logError("Недостаточно точек телеметрии для определения типа дрона (минимум 3)");
        return;
    }

    const payload = {
        drone_id: droneId,
        drone_type: droneType,
        telemetry: telemetry
    };

    fetch("/api/drones/drone-type", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("response").textContent = JSON.stringify(data, null, 2);
            logInfo(`Drone type detected: ${data.detected_type}`);
        })
        .catch(err => {
            logError("Error detecting drone type", err);
        });
}

function collectAndCreateGraph() {
    if (!checkRequiredElements()) {
        logError("Required elements not found");
        return;
    }

    if (window.replayInterval) {
        clearInterval(window.replayInterval);
        window.replayInterval = null;
    }
    document.getElementById("response").textContent = "Waiting...";

    const blocks = document.querySelectorAll(".telemetry-block");
    window.allTelemetry = [];
    blocks.forEach(block => {
        const time = parseFloat(block.querySelector(".time").value);
        const lon = parseFloat(block.querySelector(".longitude").value);
        const lat = parseFloat(block.querySelector(".latitude").value);
        const alt = parseFloat(block.querySelector(".altitude").value);
        window.allTelemetry.push({
            time: time,
            position: [lon, lat],
            altitude: alt
        });
    });
    
    const { droneId, droneType } = getDroneInfo();
    const method = document.getElementById('graphMethod').value;
    const pointsLimit = parseInt(document.getElementById('pointsLimit').value, 10);

    window.baseTelemetry = window.allTelemetry.slice(0, pointsLimit);
    window.generatedTelemetry = [...window.baseTelemetry];

    function sendAndUpdate() {
        const payload = {
            drone_id: droneId,
            drone_type: droneType,
            telemetry: window.generatedTelemetry,
            method: method,
            points_limit: window.generatedTelemetry.length
        };
        
        fetch("/api/drones/trajectory-visualization", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("response").textContent =
                  "Telemetry (" + window.generatedTelemetry.length + "):\n" +
                  JSON.stringify(window.generatedTelemetry, null, 2) +
                  "\n\nServer response:\n" +
                  JSON.stringify(data, null, 2);
                drawTrajectoryGraph(data);
            })
            .catch(err => {
                logError("Error creating graph", err);
            });
    }

    sendAndUpdate();

    window.replayInterval = setInterval(() => {

        if (window.generatedTelemetry.length >= 2) {
            const prev = window.generatedTelemetry[window.generatedTelemetry.length - 2];
            const curr = window.generatedTelemetry[window.generatedTelemetry.length - 1];
            const timeDiff = curr.time - prev.time;
            let newTime = curr.time + (timeDiff > 0 ? timeDiff : 1);
            const lonSpeed = (curr.position[0] - prev.position[0]) / (timeDiff > 0 ? timeDiff : 1);
            const latSpeed = (curr.position[1] - prev.position[1]) / (timeDiff > 0 ? timeDiff : 1);
            const altSpeed = (curr.altitude - prev.altitude) / (timeDiff > 0 ? timeDiff : 1);
            const newPoint = {
                time: newTime,
                position: [curr.position[0] + lonSpeed * (timeDiff > 0 ? timeDiff : 1), curr.position[1] + latSpeed * (timeDiff > 0 ? timeDiff : 1)],
                altitude: curr.altitude + altSpeed * (timeDiff > 0 ? timeDiff : 1)
            };
            window.generatedTelemetry.push(newPoint);
        }
        sendAndUpdate();
    }, 1000);
}

function stopAllCalculations() {

    if (window.replayInterval) {
        clearInterval(window.replayInterval);
        window.replayInterval = null;

    }

    if (typeof isAnimating !== 'undefined') {
        isAnimating = false;
    }

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.textContent = "Старт";
    }
}

function startAllCalculations() {
    if (typeof isAnimating !== 'undefined') {
        isAnimating = true;
    }

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.textContent = "Остановить расчет";
    }
}

function toggleAllCalculations() {
    const stopBtn = document.getElementById('stopBtn');
    if (!stopBtn) return;
    
    if (stopBtn.textContent === "Старт") {
        collectAndCreateGraph();
        stopBtn.textContent = "Остановить расчет";
    } else if (stopBtn.textContent === "Остановить расчет") {
        stopAllCalculations();
        stopBtn.textContent = "Старт";
    } else {
        startAllCalculations();
        stopBtn.textContent = "Остановить расчет";
    }
} 