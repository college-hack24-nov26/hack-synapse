/**
 * NeuroGlove Clinical Dashboard Controller
 * Real-time SSE streaming, Three.js 3D hand integration, high-speed canvas sparklines,
 * 2x2 mini Chart.js signal visualizers, multi-tab orchestration, and session management.
 */

let mirrorHand = null;
let exerciseMirrorHand = null;
const DASHBOARD_TABS = ["telemetry","exercises","games","prediction","glossary","settings"];
const DASHBOARD_TAB_KEY = "neuroglove.activeTab.v1";
let activeDashboardTab = "telemetry";
let latestDashboardState = null;
let lastAppliedLiveFrame = null;
let liveMirrorNeedsReset = true;
let telemetryBlanked = false;
let hasReceivedGloveFrame = false;
let sseSource = null;

// Audio feedback chime for target matching
let audioCtx = null;

// Native Canvas Sparklines Data Buffers (20 points rolling history)
const SPARK_POINTS = 20;
const sparkClfData = [];

// Mini Charts Instances (2x2 Grid)
let chartMiniFlex = null;
let chartMiniFsr = null;
let chartMiniImu = null;
let chartMiniEmg = null;

function playSuccessChime() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
        // Audio might require user gesture
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Mirror Hand 3D Visualizer
    if (typeof MirrorHandVisualizer !== "undefined") {
        mirrorHand = new MirrorHandVisualizer("mirrorHandCanvas");
        mirrorHand.setSensorOnly(true);
    }

    // 2. Initialize Mini Signal Charts (2x2 Grid)
    if (typeof Chart !== "undefined") Chart.defaults.font.family = window.ngI18n?.fontFamily || "Poppins, Arial, sans-serif";
    initMiniSignalCharts();

    // 3. Initial Sparkline Rendering
    renderAllSparklines();

    refreshTelemetryFeed();
    setInterval(refreshTelemetryFeed, 500);

    // 5. Connect to Real-time SSE Stream
    connectSSE();

    // 6. Setup Global Click Handlers (Patient profile dropdown, Device status dropdown)
    document.addEventListener("click", (e) => {
        const pMenu = document.getElementById("patientMenu");
        const pPopover = document.getElementById("patientDropdownPopover");
        if (pMenu && pPopover && !pMenu.contains(e.target)) {
            pPopover.classList.remove("active");
        }
        const dMenu = document.getElementById("deviceStatusMenu");
        const dPopover = document.getElementById("deviceDropdownPopover");
        if (dMenu && dPopover && !dMenu.contains(e.target)) {
            dPopover.classList.remove("active");
        }
    });

    // Restore navigation within this browser tab after a refresh.
    restoreDashboardTab();

    // 8. Initialize Lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
});

/* ==========================================================================
   High-Speed Native 2D Canvas Sparklines
   Zero memory leaks, ultra-lightweight 60fps rendering
   ========================================================================== */
function drawSparkline(canvasId, dataArray, strokeColor, fillColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!dataArray || dataArray.length < 2) return;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        if (val < min) min = val;
        if (val > max) max = val;
    }
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const range = max - min;
    const step = (w - 4) / (dataArray.length - 1);

    ctx.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
        const x = 2 + i * step;
        const norm = (dataArray[i] - min) / range;
        const y = h - 2 - (norm * (h - 4));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = strokeColor || "#0d9488";
    ctx.stroke();

    if (fillColor) {
        ctx.lineTo(2 + (dataArray.length - 1) * step, h);
        ctx.lineTo(2, h);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
}

function renderAllSparklines() {
    // Waveforms in Sensor Readings have been removed per clinical dashboard specs
    drawSparkline("sparkClf", sparkClfData, "#0d9488", "rgba(13, 148, 136, 0.12)");
}

/* ==========================================================================
   2x2 Mini Live Signal Charts (Chart.js)
   ========================================================================== */
function buildMiniChartInstance(canvasId, datasets, yMin, yMax) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return null;
    const ctx = canvas.getContext("2d");
    const pointsCount = 25;
    const labels = Array(pointsCount).fill("");

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "none" },
            events: [],
            scales: {
                x: { display: false },
                y: {
                    min: yMin !== undefined ? yMin : 0,
                    max: yMax !== undefined ? yMax : 100,
                    display: false
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            elements: {
                point: { radius: 0 },
                line: { tension: 0.25, borderWidth: 1.5 }
            }
        }
    });
}

function initMiniSignalCharts() {
    const pts = 25;

    // 1. All five independent flex sensor channels
    chartMiniFlex = buildMiniChartInstance("chartMiniFlex", [
        { label: "Thumb", borderColor: "#f59e0b", data: Array(pts).fill(null) },
        { label: "Index", borderColor: "#0d9488", data: Array(pts).fill(null) },
        { label: "Middle", borderColor: "#3b82f6", data: Array(pts).fill(null) },
        { label: "Ring", borderColor: "#8b6ab0", data: Array(pts).fill(null) },
        { label: "Little", borderColor: "#ce6c83", data: Array(pts).fill(null) }
    ], 0, 100);

    // 2. FSR Grip Pressure (Teal Area)
    chartMiniFsr = buildMiniChartInstance("chartMiniFsr", [
        {
            label: "FSR",
            borderColor: "#0d9488",
            backgroundColor: "rgba(13, 148, 136, 0.12)",
            fill: true,
            data: Array(pts).fill(12)
        }
    ], 0, 45);

    // 3. IMU Gyroscope (X: Cyan, Y: Amber, Z: Blue)
    chartMiniImu = buildMiniChartInstance("chartMiniImu", [
        { label: "X", borderColor: "#06b6d4", data: Array(pts).fill(2) },
        { label: "Y", borderColor: "#f59e0b", data: Array(pts).fill(-1) },
        { label: "Z", borderColor: "#3b82f6", data: Array(pts).fill(1) }
    ], -35, 35);

    // 4. EMG Arm (Teal with dashed line)
    chartMiniEmg = buildMiniChartInstance("chartMiniEmg", [
        {
            label: "EMG",
            borderColor: "#0d9488",
            borderDash: [3, 2],
            data: Array(pts).fill(34)
        }
    ], 0, 110);
}

function updateMiniCharts(flex, fsr, imu, emg) {
    if (chartMiniFlex) {
        ['thumb','index','middle','ring','pinky'].forEach((finger,index) => {
            const data = chartMiniFlex.data.datasets[index].data;
            data.shift();
            data.push(Number.isFinite(flex[finger]) ? Math.max(0,Math.min(100,flex[finger])) : null);
        });
        chartMiniFlex.update();
    }

    if (chartMiniFsr) {
        const d = chartMiniFsr.data.datasets[0].data;
        const fsrVal = Math.round((fsr.pressure_pct || 0) * 0.4);
        d.shift(); d.push(fsrVal);
        chartMiniFsr.update();
    }

    if (chartMiniImu) {
        const d0 = chartMiniImu.data.datasets[0].data;
        const d1 = chartMiniImu.data.datasets[1].data;
        const d2 = chartMiniImu.data.datasets[2].data;
        d0.shift(); d0.push(imu.gyro_x !== undefined ? imu.gyro_x : (imu.dyn_acc || 0) * 10);
        d1.shift(); d1.push(imu.gyro_y !== undefined ? imu.gyro_y : (imu.acc_y || 0) * -15);
        d2.shift(); d2.push(imu.gyro_z !== undefined ? imu.gyro_z : 0.8);
        chartMiniImu.update();
    }

    if (chartMiniEmg) {
        const d = chartMiniEmg.data.datasets[0].data;
        d.shift(); d.push(Number.isFinite(emg.envelope) ? emg.envelope : null);
        chartMiniEmg.update();
    }
}

/* ==========================================================================
   Server-Sent Events (SSE) Stream Handling
   ========================================================================== */
function connectSSE() {
    if (sseSource) sseSource.close();

    sseSource = new EventSource("/api/stream");

    sseSource.onmessage = (event) => {
        try {
            const state = JSON.parse(event.data);
            updateDashboard(state);
        } catch (e) {
            console.error("Error parsing SSE state:", e);
        }
    };

    sseSource.onerror = (err) => {
        console.warn("SSE connection interrupted, retrying...", err);
    };
}

// Firmware timestamps are uptime; freshness uses the server's host receipt time.
function isFreshGloveState(state, now = Date.now()) {
    if (!state || !["mqtt","serial"].includes(state.data_source) || (state.data_source === "serial" ? state.serial_connected !== true : state.mqtt_connected !== true) || !Number.isFinite(state.received_at)) return false;
    const age = now - state.received_at * 1000;
    return age >= -1000 && age < 2500 && Object.values(state.processed?.flex || {}).some(Number.isFinite);
}

function isFreshTelemetryState(state, now = Date.now()) {
    if (state?.data_source !== "simulate") return isFreshGloveState(state, now);
    if (!Number.isFinite(state.received_at)) return false;
    const age = now - state.received_at * 1000;
    return age >= -1000 && age < 2500 && Object.values(state.processed?.flex || {}).some(Number.isFinite);
}

function clearTelemetryDisplay() {
    if (telemetryBlanked) return;
    telemetryBlanked = true;
    for (const id of ["valThumbFlex","valIndexFlex","valMiddleFlex","valRingFlex","valPinkyFlex","valFsrGrip","valImuOrient","valEmgArm","clfClassName","clfConfVal"]) {
        const node = document.getElementById(id); if (node) node.textContent = "—";
    }
    for (const id of ["barThumbFlex","barIndexFlex","barMiddleFlex","barRingFlex","barPinkyFlex","barFsrGrip","barEmgArm","clfConfidenceFill"]) {
        const node = document.getElementById(id); if (node) node.style.width = "0%";
    }
    const status = document.getElementById("clfStatusBadge"); if (status) status.textContent = "Waiting for glove";
    const hint = document.getElementById("clfStatusHint"); if (hint) hint.textContent = "No fresh glove readings are available.";
    const card = document.getElementById("movementClassificationCard"); if (card) card.dataset.state = "waiting";
    const confidence = document.getElementById("clfConfidenceTrack");
    if (confidence) {confidence.removeAttribute("aria-valuenow");confidence.setAttribute("aria-valuetext","Waiting for glove");}
    highlightMovementPoseCard("unknown");
    sparkClfData.length = 0;
    for (const chart of [chartMiniFlex,chartMiniFsr,chartMiniImu,chartMiniEmg]) {
        if (chart) {chart.data.datasets.forEach(dataset => dataset.data.fill(null));chart.update("none");}
    }
    renderAllSparklines();
}

function refreshTelemetryFeed() {
    const isTelemetry = activeDashboardTab === "telemetry";
    const ready = isFreshTelemetryState(latestDashboardState);
    const simulated = latestDashboardState?.data_source === "simulate";
    const notice = document.getElementById("telemetryFeedNotice");
    const canvas = document.getElementById("mirrorHandCanvas");
    // Telemetry's viewer is permanently measurement-only, even while another tab is open.
    if (mirrorHand?.setSensorOnly) mirrorHand.setSensorOnly(true);
    if (notice) notice.hidden = !isTelemetry || ready;
    if (canvas) canvas.classList.toggle("live-feed-hidden", isTelemetry && !ready);
    if (!isTelemetry) return;
    const status = document.getElementById("telemetryReadingsStatus");
    if (status) status.textContent = ready ? (simulated ? "Simulated" : "Live glove") : "Waiting";
    const caption = document.getElementById("telemetryHandCaption");
    if (caption) caption.textContent = simulated ? "Simulated sensor mirror · Demo" : "Live sensor mirror · 3D";
    if (!ready) {
        if (mirrorHand?.holdPose) mirrorHand.holdPose();
        liveMirrorNeedsReset = true;lastAppliedLiveFrame = null;
        const title = document.getElementById("telemetryFeedTitle");
        if (title) title.textContent = simulated ? "Waiting for simulated data" : (hasReceivedGloveFrame ? "Glove data paused" : "Waiting for glove");
        const message = document.getElementById("telemetryFeedMessage");
        if (message) message.textContent = simulated ? "The hand will follow simulated finger and wrist readings when the demo feed resumes." : "Finger and wrist readings will appear when your glove sends data.";
        clearTelemetryDisplay();return;
    }
    telemetryBlanked = false;hasReceivedGloveFrame = true;
    if (mirrorHand && lastAppliedLiveFrame !== latestDashboardState.received_at) {
        const proc = latestDashboardState.processed;
        mirrorHand.updateSensorPose(proc.flex, proc.imu, proc.emg, proc.fsr, liveMirrorNeedsReset);
        lastAppliedLiveFrame = latestDashboardState.received_at;liveMirrorNeedsReset = false;
    }
}

function updateDashboard(state) {
    // Game controls must consume the packet before hidden charts/DOM work.
    if (typeof neuroGames !== "undefined" && neuroGames?.updateTelemetry) neuroGames.updateTelemetry(state);
    window.guidedPractice?.updateTelemetry(state);
    latestDashboardState = state;
    refreshTelemetryFeed();
    if (activeDashboardTab === "games") return;
    const proc = state.processed || {};
    const flex = proc.flex || {};
    const imu = proc.imu || {};
    const emg = proc.emg || {};
    const fsr = proc.fsr || {};
    const clf = state.classification || {};
    const reps = state.repetitions || {};

    // 1. Data Source & Mode Pills
    const isMqtt = state.data_source !== "simulate";
    const hardwareConnected = state.data_source === "serial" ? state.serial_connected === true : state.mqtt_connected === true;
    document.querySelectorAll('input[name="sourceRadio"]').forEach(radio => radio.checked = radio.value === state.data_source);
    const btnSim = document.getElementById("btnSourceSim");
    const btnMqtt = document.getElementById("btnSourceMqtt");
    if (btnMqtt) btnMqtt.classList.toggle("active", isMqtt);
    if (btnSim && btnMqtt) {
        if (isMqtt) {
            btnMqtt.classList.add("active");
            btnSim.classList.remove("active");
        } else {
            btnSim.classList.add("active");
            btnMqtt.classList.remove("active");
        }
    }

    const topConn = document.getElementById("topConnText");
    if (topConn) topConn.textContent = isMqtt ? (isFreshGloveState(state) ? "Live glove" : "Waiting for glove") : "Demo mode";
    const connButton = document.querySelector(".device-status-pill-btn");
    if (connButton) connButton.classList.toggle("hardware-offline", isMqtt && !hardwareConnected);
    // 2. Sidebar Device Status
    const devEsp = document.getElementById("devEspState");
    const devRpi = document.getElementById("devRpiState");
    const devMqtt = document.getElementById("devMqttState");
    if (devEsp) devEsp.textContent = isFreshGloveState(state) ? "Receiving data" : "Waiting for data";
    if (devRpi) devRpi.textContent = "Connected";
    if (devMqtt) devMqtt.textContent = state.mqtt_connected ? "Connected" : "Idle";
    const settingsSource = document.getElementById("settingsSourceStatus");
    if (settingsSource) settingsSource.textContent = !isMqtt ? "Simulation active" : isFreshGloveState(state) ? "Glove receiving data" : hardwareConnected ? "Waiting for glove readings" : "Waiting for glove connection";

    if (settingsSource && state.data_source === "serial") settingsSource.textContent = isFreshGloveState(state) ? `USB glove · ${state.serial?.port || "COM11"} · Receiving data` : `USB glove · ${state.serial?.port || "COM11"} · Waiting for readings`;
    if (activeDashboardTab === "telemetry" && !isFreshTelemetryState(state)) return;

    // 3. Sensor Channel Rows & Values
    const emgVal = Number.isFinite(emg.envelope) ? Math.round(emg.envelope) : null;
    for (const [finger,name] of [['thumb','Thumb'],['index','Index'],['middle','Middle'],['ring','Ring'],['pinky','Pinky']]) {
        const value = Number.isFinite(flex[finger]) ? Math.round(Math.max(0,Math.min(100,flex[finger]))) : null;
        const label = document.getElementById(`val${name}Flex`);
        const bar = document.getElementById(`bar${name}Flex`);
        if (label) {label.textContent = value === null ? '—' : `${value}%`;const raw=state.raw_sensors?.flex?.[finger];if(Number.isFinite(raw))label.title=`Raw sensor: ${raw} ADC`;}
        if (bar) bar.style.width = `${value ?? 0}%`;
    }

    const elFsrVal = document.getElementById("valFsrGrip");
    const elFsrBar = document.getElementById("barFsrGrip");
    if (elFsrVal) elFsrVal.textContent = `${Math.round(fsr.pressure_pct ?? 0)}%`;
    if (elFsrBar) elFsrBar.style.width = `${Math.min(100, fsr.pressure_pct ?? 0)}%`;

    const roll = (imu.roll ?? Math.atan2(imu.acc_x ?? 0, imu.acc_z ?? 1) * 180 / Math.PI).toFixed(1);
    const pitch = (imu.pitch ?? Math.atan2(imu.acc_y ?? 0, Math.hypot(imu.acc_x ?? 0, imu.acc_z ?? 1)) * 180 / Math.PI).toFixed(1);
    const yaw = Number.isFinite(imu.yaw) ? imu.yaw.toFixed(1) + "°" : "—";
    const elImu = document.getElementById("valImuOrient");
    if (elImu) elImu.textContent = `Roll: ${roll}° Pitch: ${pitch}° Yaw: ${yaw}`;

    const elEmgVal = document.getElementById("valEmgArm");
    const elEmgBar = document.getElementById("barEmgArm");
    if (elEmgVal) elEmgVal.textContent = emgVal === null ? "Not connected" : `${emgVal} ${emg.estimated ? 'a.u.' : 'µV'}`;
    document.querySelectorAll('[data-i18n="emg_arm"]').forEach(label=>{
        const name='EMG';
        if(label.textContent!==name)label.textContent=name;
        label.title='';
    });
    if(chartMiniEmg)chartMiniEmg.data.datasets[0].label='EMG';
    if (elEmgBar) elEmgBar.style.width = `${Math.min(100, emgVal ?? 0)}%`;

    // 4. Push to Sparkline Buffers & Redraw

    const confPct = Number.isFinite(clf.confidence) ? Math.round(Math.max(0, Math.min(1, clf.confidence)) * 100) : null;
    if (confPct !== null) {
        sparkClfData.push(confPct);
        if (sparkClfData.length > SPARK_POINTS) sparkClfData.shift();
    }

    renderAllSparklines();

    // 5. Update 2x2 Mini Live Signal Charts
    updateMiniCharts(flex, fsr, imu, emg);

    // 6. Movement Classification Card
    const rawClass = (clf.class || "UNKNOWN").toUpperCase();
    const elClfName = document.getElementById("clfClassName");
    const elClfConf = document.getElementById("clfConfVal");
    const hasEstimate = rawClass !== "UNKNOWN" && (confPct !== null || clf.method === "sensor_rules");
    if (elClfName) {
        const stateKey = "state_" + rawClass.toLowerCase();
        elClfName.textContent = hasEstimate ? (typeof t === "function" ? t(stateKey) : rawClass) : "—";
    }
    if (elClfConf) elClfConf.textContent = hasEstimate && confPct !== null ? `${confPct}%` : "—";
    const uncertain = state.attempt?.status === "UNCERTAIN";
    const classificationCard = document.getElementById("movementClassificationCard");
    if (classificationCard) classificationCard.dataset.state = !hasEstimate ? "waiting" : uncertain ? "uncertain" : "estimate";
    const classificationStatus = document.getElementById("clfStatusBadge");
    if (classificationStatus) classificationStatus.textContent = !hasEstimate ? "Waiting for data" : uncertain ? "Signal uncertain" : "Model estimate";
    const confidenceFill = document.getElementById("clfConfidenceFill");
    if (confidenceFill) confidenceFill.style.width = `${hasEstimate ? confPct ?? 0 : 0}%`;
    const confidenceTrack = document.getElementById("clfConfidenceTrack");
    if (confidenceTrack) {
        if (hasEstimate && confPct !== null) confidenceTrack.setAttribute("aria-valuenow", String(confPct));
        else confidenceTrack.removeAttribute("aria-valuenow");
        confidenceTrack.setAttribute("aria-valuetext", hasEstimate && confPct !== null ? `${confPct}% model confidence` : "Waiting for data");
    }
    const classificationHint = document.getElementById("clfStatusHint");
    if (classificationHint) classificationHint.textContent = !hasEstimate ? "Waiting for a movement estimate from sensor readings." : uncertain ? "The current sensor signal is uncertain." : clf.method === "sensor_rules" ? "Based on flex and pressure readings. EMG is not connected." : "Estimated from incoming sensor readings.";

    // 7. Active Pose Card Highlighting in Hand Movement Mapping
    highlightMovementPoseCard(rawClass.toLowerCase());

    // 8. 3D Hand Model Kinematics Update
    if (exerciseMirrorHand && activeDashboardTab === "exercises" && isFreshTelemetryState(state)) {
        exerciseMirrorHand.updatePose(flex, imu, null, emg, fsr);
    }

    // 12. Feed Telemetry to Hand Anatomy Glossary Module
    if (typeof handGlossary !== "undefined" && handGlossary && handGlossary.updateTelemetry) {
        handGlossary.updateTelemetry(state);
    }
}

function highlightMovementPoseCard(className) {
    const cards = document.querySelectorAll(".pose-pill-card");
    cards.forEach(c => { c.classList.remove("active"); c.removeAttribute("aria-current"); });

    let targetId = null;
    if (className.includes("open")) targetId = "poseCard-open";
    else if (className.includes("grasp")) targetId = "poseCard-grasp";
    else if (className.includes("pinch")) targetId = "poseCard-pinch";
    else if (className.includes("close")) targetId = "poseCard-close";
    else if (className.includes("flexion") || className.includes("flex")) targetId = "poseCard-wrist-flex";
    else if (className.includes("extension") || className.includes("ext")) targetId = "poseCard-wrist-ext";
    else if (className.includes("relax") || className.includes("rest")) targetId = "poseCard-relax";

    const preview = document.getElementById("clfActionPreview");
    const actionImage = document.getElementById("clfActionImage");
    const action = {"poseCard-open":"open","poseCard-grasp":"grasp","poseCard-pinch":"pinch","poseCard-close":"close","poseCard-wrist-flex":"flex","poseCard-wrist-ext":"extend","poseCard-relax":"relax"}[targetId];
    if (preview) preview.hidden = !action;
    if (actionImage && action && actionImage.dataset.action !== action) {
        actionImage.src = `/static/images/movement/${action}.svg?v=2`;
        actionImage.dataset.action = action;
    }
    const targetCard = targetId ? document.getElementById(targetId) : null;
    if (targetCard) { targetCard.classList.add("active"); targetCard.setAttribute("aria-current", "true"); }
    const status = document.getElementById("mappingDetectedPose");
    if (status) status.textContent = targetCard ? (targetCard.querySelector(".pose-pill-label")?.textContent || className) : "Waiting for estimate";
}

/* ==========================================================================
   Navigation, Tabs & Multi-Docking 3D Canvas
   ========================================================================== */
function restoreDashboardTab() {
    let saved = "telemetry";
    try { saved = window.sessionStorage.getItem(DASHBOARD_TAB_KEY) || saved; } catch (_) { /* Storage may be disabled. */ }
    switchDashboardTab(DASHBOARD_TABS.includes(saved) ? saved : "telemetry");
}

function switchDashboardTab(tabId) {
    if (!DASHBOARD_TABS.includes(tabId) || !document.getElementById(`tab-${tabId}`)) return;
    try { window.sessionStorage.setItem(DASHBOARD_TAB_KEY, tabId); } catch (_) { /* Navigation still works without storage. */ }
    if (tabId !== "exercises" && window.guidedPractice?.session?.active && window.guidedPractice.session.status === "active") window.guidedPractice.pause();
    activeDashboardTab = tabId;
    telemetryBlanked = false;
    if (tabId === "telemetry") {lastAppliedLiveFrame = null;liveMirrorNeedsReset = true;}
    // 1. Update Top Tabs
    document.querySelectorAll(".top-nav-tab").forEach(btn => btn.classList.remove("active"));
    const activeTopTab = document.getElementById(`tabBtn-${tabId}`);
    document.querySelectorAll(".top-nav-tab").forEach(btn => btn.removeAttribute("aria-current"));
    if (activeTopTab) { activeTopTab.classList.add("active"); activeTopTab.setAttribute("aria-current", "page"); }
    if (tabId !== "games" && typeof neuroGames !== "undefined" && neuroGames && neuroGames.isRunning && !neuroGames.isPaused) neuroGames.pauseGame();

    // 2. Update Tab Content Panes
    document.querySelectorAll(".dashboard-tab-content").forEach(c => c.classList.remove("active"));
    const activeContent = document.getElementById(`tab-${tabId}`);
    if (activeContent) activeContent.classList.add("active");

    // Each workspace owns its canvas and pose state. Never transfer exercise state into Telemetry.
    if (tabId === "exercises") {
        if (!exerciseMirrorHand && typeof MirrorHandVisualizer !== "undefined") exerciseMirrorHand = new MirrorHandVisualizer("guidedMirrorHandCanvas", {cameraDistance:125, fitSmallPanels:false});
        exerciseMirrorHand?.onResize();
    } else if (tabId === "telemetry") {
        mirrorHand?.onResize();
    } else if (tabId === "games") {
        if (typeof neuroGames !== "undefined" && neuroGames && neuroGames.initCanvasResolution) {
            neuroGames.initCanvasResolution();
        }
    } else if (tabId === "prediction") {
        window.predictionView?.refresh();
    } else if (tabId === "glossary") {
        if (typeof handGlossary !== "undefined" && handGlossary && handGlossary.renderList) {
            handGlossary.renderList();
        }
    }

    if (latestDashboardState) updateDashboard(latestDashboardState);
    else refreshTelemetryFeed();
    if (window.matchMedia("(max-width: 700px)").matches && !document.body.classList.contains("sidebar-collapsed")) toggleSidebar();
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

function scrollToSignals() {
    switchDashboardTab("telemetry");
    const target = document.getElementById("liveSignalsSection");
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function togglePatientDropdown() {
    const popover = document.getElementById("patientDropdownPopover");
    if (popover) {
        popover.classList.toggle("active");
    }
}

function toggleDeviceDropdown() {
    const popover = document.getElementById("deviceDropdownPopover");
    if (popover) {
        popover.classList.toggle("active");
    }
}

/* ==========================================================================
   3D Hand Camera Presets & Manual Posture Quick-Test
   ========================================================================== */
function selectCameraPreset(preset, btn) {
    if (!mirrorHand) return;
    if (preset === "reset") {
        mirrorHand.resetCamera();
    } else {
        mirrorHand.setCameraPreset(preset);
    }
    document.querySelectorAll(".btn-cam-pill").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

/* ==========================================================================
   Data Source Switching
   ========================================================================== */
async function switchDataSource(source) {
    try {
        const response = await fetch("/api/control/source", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: source })
        });
        if (!response.ok) throw new Error("The source could not be changed. Please try again.");
        const btnSim = document.getElementById("btnSourceSim");
        const btnMqtt = document.getElementById("btnSourceMqtt");
        if (source === "simulate") {
            if (btnSim) btnSim.classList.add("active");
            if (btnMqtt) btnMqtt.classList.remove("active");
        } else {
            if (btnMqtt) btnMqtt.classList.add("active");
            if (btnSim) btnSim.classList.remove("active");
        }
    } catch (e) {
        console.error("Failed to switch data source:", e);
        const status = document.getElementById("settingsSourceStatus");
        if (status) status.textContent = "Source change failed. Try again.";
        document.querySelectorAll('input[name="sourceRadio"]').forEach(radio => radio.checked = radio.value === latestDashboardState?.data_source);
    }
}

/* ==========================================================================
   Therapy Games Controls
   ========================================================================== */
function selectTherapyGame(game) {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.selectGame(game);
    }
}

function startTherapyGame() {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.startGame();
    }
}

function pauseTherapyGame() {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.pauseGame();
    }
}

function resetTherapyGame() {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.resetGame();
    }
}

function stopTherapyGame() {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.stopGame();
    }
}

function zeroWristCenter() {
    if (typeof neuroGames !== "undefined" && neuroGames) {
        neuroGames.zeroWristCenter();
    }
}

/* ==========================================================================
   Modals & History Reports
   ========================================================================== */
function openModal(id) {
    if (id === "modalSettings") {switchDashboardTab("settings");return;}
    const m = document.getElementById(id);
    if (m) {m.style.display = "flex";m.classList.add("active");}
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) {m.style.display = "none";m.classList.remove("active");}
    if (id === "modalHistory") window.sessionHistory?.onClose();
}

function setCalibrationFeedback(title, message, state = "ready") {
    const heading = document.getElementById("settingsSaveState");
    const feedback = document.getElementById("settingsSaveFeedback");
    if (heading) heading.textContent = title;
    if (feedback) {feedback.textContent = message;const bar = feedback.closest?.(".settings-save-bar");if (bar) bar.dataset.state = state;}
}

function markCalibrationChanged() {
    setCalibrationFeedback("Unsaved calibration changes", "Save when you’re ready to use these readings.", "changed");
    document.querySelectorAll('#settingsCalibrationForm [aria-invalid="true"]').forEach(input => input.removeAttribute("aria-invalid"));
}

function discardCalibrationChanges() {
    document.getElementById("settingsCalibrationForm")?.reset();
    document.querySelectorAll('#settingsCalibrationForm [aria-invalid="true"]').forEach(input => input.removeAttribute("aria-invalid"));
    setCalibrationFeedback("Calibration up to date", "Your last saved values have been restored.");
}

async function saveCalibration() {
    const form = document.getElementById("settingsCalibrationForm");
    const button = document.getElementById("settingsSaveButton");
    if (button?.disabled) return;
    if (form && !form.reportValidity()) {setCalibrationFeedback("Check your readings", "Complete each field using the allowed range.", "error");return;}
    const flex = {};
    for (const [finger,prefix] of [["thumb","Thumb"],["index","Index"],["middle","Middle"],["ring","Ring"],["pinky","Pinky"]]) {
        const relaxed = document.getElementById(`calib${prefix}Min`), closed = document.getElementById(`calib${prefix}Max`);
        const min = Number(relaxed.value), max = Number(closed.value);
        if (!relaxed.value.trim() || !closed.value.trim() || !Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0 || min > 4095 || max > 4095 || min === max) {
            relaxed.setAttribute("aria-invalid","true");closed.setAttribute("aria-invalid","true");relaxed.focus();
            setCalibrationFeedback("Check your finger readings", "Use two different readings between 0 and 4095 for each finger.", "error");return;
        }
        flex[finger] = {min_adc:min,max_adc:max};
    }
    const emg = Number(document.getElementById("calibEmgThresh").value), fsr = Number(document.getElementById("calibFsrThresh").value);
    if (!Number.isFinite(emg) || !Number.isInteger(fsr) || emg < 0 || fsr < 0 || fsr > 4095) {setCalibrationFeedback("Check your thresholds", "Enter a non-negative EMG threshold and an FSR reading between 0 and 4095.", "error");return;}
    const payload = {user_id:1,flex,emg_active_threshold:emg,fsr_contact_threshold:fsr,
        emg_baseline:Number(document.getElementById("calibEmgBaseline").value),fsr_baseline:Number(document.getElementById("calibFsrBaseline").value),fsr_max_raw:Number(document.getElementById("calibFsrMax")?.value || 1300)};
    const submittedInputs = Array.from(form?.querySelectorAll("input") || [], input => ({input,value:input.value}));
    if (button) {button.disabled = true;button.textContent = "Saving…";}
    setCalibrationFeedback("Saving calibration", "Applying your readings to this profile.");
    try {
        const res = await fetch("/api/calibration", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error("Your readings could not be saved. Please try again.");
        submittedInputs.forEach(({input,value}) => input.defaultValue = value);
        if (submittedInputs.some(({input,value}) => input.value !== value)) setCalibrationFeedback("Newer changes are not saved", "The submitted readings were saved. Save again to apply your latest edits.", "changed");
        else setCalibrationFeedback("Calibration saved", "Your hand mirror and sensor readings now use these values.", "saved");
    } catch (e) {
        setCalibrationFeedback("Calibration not saved", "Your changes are still here. Check the connection and try again.", "error");
    } finally {
        if (button) {button.disabled = false;button.textContent = "Save calibration";}
    }
}

function openHistoryModal() {
    window.sessionHistory?.open();
}

// The workspace opens with navigation expanded on every visit.
function toggleSidebar() {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    const toggle = document.getElementById("sidebarToggle");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
    // Resize after the sidebar's width transition and while it is moving.
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 230);
}
