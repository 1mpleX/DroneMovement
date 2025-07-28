let scene, camera, renderer, controls;
let drone, trajectory, forecastTrajectory, realTrajectory;
let animationId;
let isAnimating = true;
let currentPointIndex = 0;
let allPoints = [];

function init3DVisualization() {
    const container = document.getElementById('3d-container');
    const canvas = document.getElementById('3dCanvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    createAxes();
    createGridWithLabels();

    const droneGeometry = new THREE.BoxGeometry(2, 1, 2);
    const droneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    drone = new THREE.Mesh(droneGeometry, droneMaterial);
    drone.castShadow = true;
    scene.add(drone);

    createCoordinatesElement();
    
    animate();

    setTimeout(() => {
        resize3DVisualization();
    }, 100);
}

function resize3DVisualization() {
    const container = document.getElementById('3d-container');
    if (renderer && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    }
}

function recreate3DVisualization() {

    if (renderer) {
        renderer.dispose();
    }

    init3DVisualization();
}

function createCoordinatesElement() {

    const oldElement = document.getElementById('drone-coordinates-overlay');
    if (oldElement) {
        oldElement.remove();
    }
    
    const coordsElement = document.createElement('div');
    coordsElement.id = 'drone-coordinates-overlay';
    coordsElement.innerHTML = `
        <span style="color: white;">Координаты дрона:</span><br>
        <span style="color: #ff0000;">Долгота:</span> <span style="color: white;">0.000000</span><br>
        <span style="color: #00ff00;">Высота:</span> <span style="color: white;">0.00 м</span><br>
        <span style="color: #00bfff;">Широта:</span> <span style="color: white;">0.000000</span>
    `;

    document.body.appendChild(coordsElement);

    coordsElement.style.position = 'fixed';
    coordsElement.style.top = '10px';
    coordsElement.style.left = '10px';
    coordsElement.style.zIndex = '1000';
    coordsElement.style.pointerEvents = 'none';
    coordsElement.style.background = 'rgba(50, 50, 50, 0.9)';
    coordsElement.style.color = '#00ff00';
    coordsElement.style.padding = '10px';
    coordsElement.style.borderRadius = '5px';
    coordsElement.style.fontFamily = 'monospace';
    coordsElement.style.fontSize = '12px';
}

function update3DVisualization(data) {
    const current = data.currentTrajectory || [];
    const forecast = data.forecast || [];
    const real = data.realContinuation || [];

    if (trajectory) scene.remove(trajectory);
    if (forecastTrajectory) scene.remove(forecastTrajectory);
    if (realTrajectory) scene.remove(realTrajectory);

    allPoints = [];

    current.forEach(point => {
        allPoints.push({
            x: (point.longitude - 37.617) * 100000,
            y: point.altitude,
            z: (point.latitude - 55.755) * 100000,
            type: 'current'
        });
    });

    forecast.forEach(point => {
        allPoints.push({
            x: (point.longitude - 37.617) * 100000,
            y: point.altitude,
            z: (point.latitude - 55.755) * 100000,
            type: 'forecast'
        });
    });

    real.forEach(point => {
        allPoints.push({
            x: (point.longitude - 37.617) * 100000,
            y: point.altitude,
            z: (point.latitude - 55.755) * 100000,
            type: 'real'
        });
    });

    createTrajectoryLines(current, forecast, real);

    if (allPoints.length > 0) {
        const lastPoint = allPoints[allPoints.length - 1];
        updateDronePosition(lastPoint);
    }
}

function createTrajectoryLines(current, forecast, real) {
    if (current.length > 1) {
        const currentGeometry = new THREE.BufferGeometry();
        const currentPoints = current.map(p => new THREE.Vector3(
            (p.longitude - 37.617) * 100000,
            p.altitude,
            (p.latitude - 55.755) * 100000
        ));
        currentGeometry.setFromPoints(currentPoints);
        const currentMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        trajectory = new THREE.Line(currentGeometry, currentMaterial);
        scene.add(trajectory);
    }

    if (forecast.length > 1) {
        const forecastGeometry = new THREE.BufferGeometry();
        const forecastPoints = forecast.map(p => new THREE.Vector3(
            (p.longitude - 37.617) * 100000,
            p.altitude,
            (p.latitude - 55.755) * 100000
        ));
        forecastGeometry.setFromPoints(forecastPoints);
        const forecastMaterial = new THREE.LineDashedMaterial({ 
            color: 0xff6600, 
            dashSize: 3, 
            gapSize: 2 
        });
        forecastTrajectory = new THREE.Line(forecastGeometry, forecastMaterial);
        forecastTrajectory.computeLineDistances();
        scene.add(forecastTrajectory);
    }

    if (real.length > 1) {
        const realGeometry = new THREE.BufferGeometry();
        const realPoints = real.map(p => new THREE.Vector3(
            (p.longitude - 37.617) * 100000,
            p.altitude,
            (p.latitude - 55.755) * 100000
        ));
        realGeometry.setFromPoints(realPoints);
        const realMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        realTrajectory = new THREE.Line(realGeometry, realMaterial);
        scene.add(realTrajectory);
    }
}

function updateDronePosition(point) {
    if (!drone) {
        return;
    }

    drone.position.set(point.x, point.y, point.z);

    const realLongitude = (point.x / 100000) + 37.617;
    const realLatitude = (point.z / 100000) + 55.755;
    const realAltitude = point.y;

    updateCoordinatesElement(realLongitude, realAltitude, realLatitude);
}

function updateCoordinatesElement(longitude, altitude, latitude) {
    const coordsElement = document.getElementById('drone-coordinates-overlay');
    if (coordsElement) {
        coordsElement.innerHTML = `
            <span style="color: white;">Координаты дрона:</span><br>
            <span style="color: #ff0000;">Долгота:</span> <span style="color: white;">${formatCoordinate(longitude)}</span><br>
            <span style="color: #00ff00;">Высота:</span> <span style="color: white;">${formatAltitude(altitude)} м</span><br>
            <span style="color: #00bfff;">Широта:</span> <span style="color: white;">${formatCoordinate(latitude)}</span>
        `;
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}

function resetCamera() {
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    controls.reset();
}

function clearGraph() {

    if (trajectory) {
        scene.remove(trajectory);
        trajectory = null;
    }
    if (forecastTrajectory) {
        scene.remove(forecastTrajectory);
        forecastTrajectory = null;
    }
    if (realTrajectory) {
        scene.remove(realTrajectory);
        realTrajectory = null;
    }

    allPoints = [];
    currentPointIndex = 0;

    if (drone) {
        drone.position.set(0, 0, 0);
    }

    updateCoordinatesElement(0, 0, 0);
    
}

function createAxes() {
    const axisLength = 150;
    const axisWidth = 2;

    const xGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: axisWidth });
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    scene.add(xAxis);

    const yGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
    ]);
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: axisWidth });
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    scene.add(yAxis);

    const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
    ]);
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: axisWidth });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    scene.add(zAxis);

    addAxisLabels();
}

function addAxisLabels() {
    function createTextTexture(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = color;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.strokeText(text, canvas.width / 2, canvas.height / 2);

        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    const xLabel = createTextTexture('X', '#ff0000');
    const yLabel = createTextTexture('Y', '#00ff00');
    const zLabel = createTextTexture('Z', '#0000ff');

    const spriteMaterialX = new THREE.SpriteMaterial({ map: xLabel });
    const spriteX = new THREE.Sprite(spriteMaterialX);
    spriteX.position.set(160, 0, 0);
    spriteX.scale.set(20, 5, 1);
    scene.add(spriteX);
    
    const spriteMaterialY = new THREE.SpriteMaterial({ map: yLabel });
    const spriteY = new THREE.Sprite(spriteMaterialY);
    spriteY.position.set(0, 160, 0);
    spriteY.scale.set(20, 5, 1);
    scene.add(spriteY);
    
    const spriteMaterialZ = new THREE.SpriteMaterial({ map: zLabel });
    const spriteZ = new THREE.Sprite(spriteMaterialZ);
    spriteZ.position.set(0, 0, 160);
    spriteZ.scale.set(20, 5, 1);
    scene.add(spriteZ);
}

function createGridWithLabels() {
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);
}
