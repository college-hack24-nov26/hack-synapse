/**
 * NeuroGlove Clinical Rehabilitation Platform
 * 3D Interactive Hand Model & Skeletal Kinematics Visualizer
 *
 * Architecture & Biomechanical Features:
 * - High-fidelity rigged humanoid polygon mesh (hand_optimized.glb: 3,148 vertices, 5,534 triangles).
 * - Articulated 21-bone skeleton with GPU vertex skinning and dual-surface clinical rendering.
 * - Anatomically correct individual finger kinematics (MCP, PIP, DIP) with physiological curl sequencing.
 * - Authentic opposable thumb articulation (saddle CMC abduction/adduction/opposition, MCP & IP flexion).
 * - True wrist joint pivot articulation (sagittal flexion/extension) with stationary forearm cuff.
 * - Coordinated Grasp & Release controller with discrete states and continuous progress interpolation.
 * - Frame-rate independent exponential smoothing via delta time.
 * - Localised joint activity colour driven independently by five flex channels.
 */

class MirrorHandVisualizer {
    constructor(canvasId = "mirrorHandCanvas", options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element #${canvasId} not found.`);
            return;
        }

        // Three.js Core Pipeline
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.handGroup = null;
        this.handMesh = null;
        this.wireMesh = null;
        this.clock = (typeof THREE !== "undefined" && THREE.Clock) ? new THREE.Clock() : null;

        // Kinematic State
        // Normalized finger curl [0.0 = full extension / open, 1.0 = full flexion / closed]
        this.currentBends = { thumb: 0.02, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.02 };
        this.targetBends  = { thumb: 0.02, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.02 };
        this.filteredFlex = { thumb: 0.02, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.02 };

        // Wrist Joint Kinematics (Flexion & Extension: palm pivoting from wrist while forearm stays stationary)
        // In radians: positive = palmar flexion (downward/forward), negative = dorsal extension (upward/backward)
        this.currentWristPitch = 0.0;
        this.targetWristPitch  = 0.0;
        this.filteredPitch     = 0.0;

        // Multi-modal Clinical Telemetry
        this.currentEmg = 20.0;  // µV baseline
        this.targetEmg  = 20.0;
        this.currentFsr = 0.0;   // % / kPa grip pressure
        this.targetFsr  = 0.0;

        // Grasp & Release Controller State Machine
        // States: 'OPEN', 'CLOSING', 'CLOSED', 'RELEASING', 'SENSOR_DRIVEN'
        this.graspController = {
            state: "OPEN",
            progress: 0.0,       // 0.0 = full open hand, 1.0 = full grasp enclosure
            targetProgress: 0.0,
            speed: 2.0           // progress units per second
        };

        // Parameterized Anatomical Poses for Quick Test & Clinical Calibration
        this.poses = {
            open: {
                thumb: 0.02, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.02,
                wristPitch: 0.0, emg: 22.0, fsr: 0.0
            },
            grasp: {
                thumb: 0.76, index: 0.82, middle: 0.84, ring: 0.80, pinky: 0.75,
                wristPitch: -0.12, // Subtle functional dorsiflexion (~7°) during power grasp
                emg: 95.0, fsr: 85.0
            },
            close: {
                thumb: 0.88, index: 0.94, middle: 0.95, ring: 0.92, pinky: 0.86,
                wristPitch: 0.0, emg: 80.0, fsr: 25.0
            },
            pinch: {
                thumb: 0.74, index: 0.78, middle: 0.16, ring: 0.10, pinky: 0.08,
                wristPitch: -0.05, emg: 72.0, fsr: 65.0
            },
            wrist_flexion: {
                thumb: 0.12, index: 0.15, middle: 0.15, ring: 0.12, pinky: 0.10,
                wristPitch: 0.65, // ~37° downward palmar flexion
                emg: 65.0, fsr: 0.0
            },
            wrist_extension: {
                thumb: 0.06, index: 0.08, middle: 0.08, ring: 0.06, pinky: 0.06,
                wristPitch: -0.65, // ~37° upward dorsal extension
                emg: 60.0, fsr: 0.0
            }
        };

        // Skeletal Hierarchy & Bone References
        this.bones = {};
        this.localWristAxis = new THREE.Vector3(1, 0, 0); // Flexion axis in radius_ulna local space
        this.isModelLoaded = false;

        // Heatmap Vertex Buffer & Dominant Bone Indices
        this.vertexCount = 0;
        this.vertexBoneIndices = null;
        this.colorBuffer = null;

        // Interaction & Orbit Camera State
        this.isMouseDown = false;
        this.isUserInteracting = false;
        this.mousePos = { x: 0, y: 0 };
        this.handRotation = { x: 0, y: 0, z: 0 };
        this.targetTilt = { x: 0, y: 0, z: 0 };
        this.defaultCameraDistance = options.cameraDistance ?? 148;
        this.fitSmallPanels = options.fitSmallPanels ?? true;
        this.visibilityCheck = options.isVisible || null;
        this.cameraDistance = this.defaultCameraDistance;

        // Autonomous Simulation / Heartbeat Tracking
        this.lastDataTime = 0;
        this.manualOverride = false;
        this.pulseTime = 0;

        this.initThree();
        if (options.interactive !== false) this.setupInteraction();
        this.loadHandModel();

        this.animate = this.animate.bind(this);
        if (options.autoAnimate !== false) requestAnimationFrame(this.animate);

        window.addEventListener("resize", () => this.onResize());
    }

    initThree() {
        const w = this.canvas.clientWidth || 340;
        const h = this.canvas.clientHeight || 380;

        this.scene = new THREE.Scene();
        this.scene.background = null; // Clean transparent canvas for seamless dashboard integration

        this.camera = new THREE.PerspectiveCamera(40, w / h, 1, 1000);
        this.camera.position.set(0, 0, this.cameraDistance);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(w, h, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.85;

        // Clinical Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xf7f9fa, 0.65);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
        keyLight.position.set(25, 45, 60);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xe1edf1, 0.30);
        fillLight.position.set(-35, 10, 40);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xc4dce4, 0.08);
        rimLight.position.set(0, -35, -45);
        this.scene.add(rimLight);

        // Root Group for Orbit Rotation and Centering
        this.handGroup = new THREE.Group();
        this.handGroup.position.set(0, 0, 0);
        this.scene.add(this.handGroup);
    }

    /**
     * Loads the authentic rigged anatomical hand mesh from GLB.
     * Model: Continuous human skin topology (3,148 vertices, 5,534 triangles), 21 articulated bones.
     */
    loadHandModel() {
        if (typeof THREE.GLTFLoader === "undefined") {
            console.warn("THREE.GLTFLoader not available. Building procedural anatomical hand fallback.");
            this.buildProceduralHandFallback();
            return;
        }

        const loader = new THREE.GLTFLoader();
        const modelUrl = "/static/models/hand_optimized.glb";

        loader.load(
            modelUrl,
            (gltf) => {
                const modelScene = gltf.scene;

                // Cache bone references and save rest orientations
                modelScene.traverse((obj) => {
                    if (obj.isBone) {
                        this.bones[obj.name] = obj;
                        obj.userData.restQuat = obj.quaternion.clone();
                        obj.userData.restEuler = obj.rotation.clone();
                    }
                    if (obj.isSkinnedMesh && obj.name === "Hand") {
                        this.handMesh = obj;
                    }
                    // Hide separate nail geometry for continuous humanoid skin
                    if (obj.name === "Nails") {
                        this.nailMesh = obj;
                        obj.visible = false;
                    }
                });

                if (!this.handMesh) {
                    console.error("Could not find 'Hand' SkinnedMesh in GLTF. Building fallback.");
                    this.buildProceduralHandFallback();
                    return;
                }

                // Shorten the long digit chains about their knuckles, keeping palm and
                // joint widths intact. Skinning carries the mesh with the revised rig.
                const digitLengths = {index_prox:.94, midd_prox:.92, ring_prox:.95, pinky_prox:.96, thumb_prox:.97};
                for (const [name, length] of Object.entries(digitLengths)) {
                    if (this.bones[name]) this.bones[name].scale.y *= length;
                }

                // Compute the local wrist flexion/extension axis in radius_ulna coordinate space:
                // The sagittal wrist flexion axis corresponds to world [1, 0, 0] transformed into radius_ulna local space.
                const radiusUlna = this.bones.radius_ulna;
                if (radiusUlna) {
                    const invParentQuat = radiusUlna.quaternion.clone().invert();
                    this.localWristAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(invParentQuat).normalize();
                }

                // Subdivide the rigged surface while interpolating the same skin weights.
                if (typeof NeuroGloveAnatomy !== "undefined") {
                    this.handMesh.geometry = NeuroGloveAnatomy.smoothSurface(this.handMesh.geometry);
                    this.anatomicalInterior = NeuroGloveAnatomy.addInterior(this.bones);
                }
                const surfaceMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0xffffff, roughness: 0.88, metalness: 0,
                    clearcoat: 0, clearcoatRoughness: 1,
                    transparent: true, opacity: 0.78, depthWrite: false,
                    vertexColors: true, skinning: true, side: THREE.FrontSide
                });
                surfaceMaterial.onBeforeCompile = shader => {
                    shader.fragmentShader = shader.fragmentShader.replace("#include <alphatest_fragment>", `
                        float anatomicalRim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 1.35);
                        diffuseColor.a *= 0.86 + 0.14 * anatomicalRim;
                        #include <alphatest_fragment>
                    `);
                };
                this.handMesh.material = surfaceMaterial;
                this.handMesh.renderOrder = 3;
                this.handMesh.frustumCulled = false;
                // A fine antialiased mesh follows the same skeleton as the sensor-driven surface.
                this.wireMesh = null;
                if (typeof NeuroGloveAnatomy !== "undefined") {
                    this.wireMesh = NeuroGloveAnatomy.createMeshOverlay(this.handMesh.geometry, this.handMesh.skeleton, this.handMesh.bindMatrix);
                    this.handMesh.parent.add(this.wireMesh);
                    // Keep the surface mesh legible without competing bone overlays.
                    for (const structure of this.anatomicalInterior || []) structure.visible = false;
                }

                // 3. Precompute Vertex Dominant Bone Indices for Real-Time GPU Thermal Heatmaps
                const geo = this.handMesh.geometry;
                this.vertexCount = geo.attributes.position.count;
                this.colorBuffer = new Float32Array(this.vertexCount * 3);

                const sIdx = geo.attributes.skinIndex.array;
                const sWeight = geo.attributes.skinWeight.array;
                this.vertexBoneIndices = new Int32Array(this.vertexCount);

                for (let i = 0; i < this.vertexCount; i++) {
                    let maxWeight = -1;
                    let dominantBoneIdx = 0;
                    for (let j = 0; j < 4; j++) {
                        const w = sWeight[i * 4 + j];
                        if (w > maxWeight) {
                            maxWeight = w;
                            dominantBoneIdx = sIdx[i * 4 + j];
                        }
                    }
                    this.vertexBoneIndices[i] = dominantBoneIdx;

                    // Initialize with baseline clinical deep-cyan
                    this.colorBuffer[i * 3]     = 0.04;
                    this.colorBuffer[i * 3 + 1] = 0.11;
                    this.colorBuffer[i * 3 + 2] = 0.20;
                }

                this.heatMasks = new Float32Array(this.vertexCount * 2);
                const restPosition = geo.attributes.position;
                for (let i = 0; i < this.vertexCount; i++) {
                    const x = restPosition.getX(i), y = restPosition.getY(i), z = restPosition.getZ(i);
                    this.heatMasks[i * 2] = Math.exp(-(((x + 5.5) / 2.8) ** 2 + ((y - 6.0) / 3.1) ** 2 + ((z - 1.2) / 3.0) ** 2) * 1.5);
                    this.heatMasks[i * 2 + 1] = Math.exp(-(((x + 1.1) / 2.0) ** 2 + ((y - 2.5) / 1.7) ** 2 + ((z - 1.0) / 2.0) ** 2) * 1.8);
                }
                geo.setAttribute("color", new THREE.BufferAttribute(this.colorBuffer, 3));
                this.buildJointActivityMasks();

                // 4. Center and Scale Model within handGroup
                const modelOffsetGroup = new THREE.Group();
                modelOffsetGroup.position.set(4.07, -11.25, -0.21);
                modelOffsetGroup.add(modelScene);

                const modelScale = 3.8;
                // Source mesh has a left palm (+Z flexion, thumb at -X).
                // Reflect the complete rig so the displayed anatomy is a right hand.
                this.handGroup.scale.set(-modelScale * 1.025, modelScale, modelScale);
                this.handedness = "right";
                this.handGroup.add(modelOffsetGroup);

                this.isModelLoaded = true;
                console.log("NeuroGlove 3D Hand Model successfully initialized:", this.vertexCount, "vertices.");
            },
            undefined,
            (error) => {
                console.error("Failed to load hand 3D model:", error);
                this.buildProceduralHandFallback();
            }
        );
    }

    /**
     * Procedural Humanoid Hand Geometry Fallback
     */
    buildProceduralHandFallback() {
        if (this.isModelLoaded) return;
        console.log("Building continuous procedural humanoid 3D skinned hand fallback...");

        const rootBone = new THREE.Bone();
        rootBone.name = "radius_ulna";
        rootBone.position.set(0, -22, 0);
        this.bones[rootBone.name] = rootBone;
        rootBone.userData.restQuat = rootBone.quaternion.clone();
        rootBone.userData.restEuler = rootBone.rotation.clone();

        const fingerConfigs = [
            { name: "thumb", x: -9.5, y: -8, z: 2.5, rotZ: 0.35, segs: ["meta", "prox", "dist"], lens: [6, 5, 4.5] },
            { name: "index", x: -5.2, y: 0, z: 0.5, rotZ: 0.04, segs: ["meta", "prox", "midd", "dist"], lens: [6.5, 6, 5, 4] },
            { name: "middle", x: 0.0, y: 2, z: 0.0, rotZ: 0.0, segs: ["meta", "prox", "midd", "dist"], lens: [7.0, 6.8, 5.5, 4.2] },
            { name: "ring", x: 5.2, y: 0.5, z: -0.5, rotZ: -0.04, segs: ["meta", "prox", "midd", "dist"], lens: [6.5, 6.2, 5, 3.8] },
            { name: "pinky", x: 9.8, y: -3.5, z: -1.2, rotZ: -0.12, segs: ["meta", "prox", "midd", "dist"], lens: [5.5, 5, 4, 3.2] }
        ];

        const allBones = [rootBone];

        fingerConfigs.forEach(fc => {
            let parent = rootBone;
            fc.segs.forEach((seg, sIdx) => {
                const bone = new THREE.Bone();
                bone.name = `${fc.name}_${seg}`;
                if (sIdx === 0) {
                    bone.position.set(fc.x, 22 + fc.y, fc.z);
                    bone.rotation.z = fc.rotZ;
                } else {
                    bone.position.set(0, fc.lens[sIdx - 1], 0);
                }
                bone.userData.restQuat = bone.quaternion.clone();
                bone.userData.restEuler = bone.rotation.clone();
                this.bones[bone.name] = bone;
                parent.add(bone);
                parent = bone;
                allBones.push(bone);
            });
        });

        const geo = new THREE.CylinderGeometry(8.5, 7.0, 24, 24, 16);
        const pos = geo.attributes.position;
        const skinIndices = [];
        const skinWeights = [];

        for (let i = 0; i < pos.count; i++) {
            const py = pos.getY(i);
            if (py < -5) {
                skinIndices.push(0, 0, 0, 0);
                skinWeights.push(1, 0, 0, 0);
            } else {
                skinIndices.push(0, 1, 0, 0);
                skinWeights.push(0.4, 0.6, 0, 0);
            }
        }

        geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
        geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

        this.vertexCount = pos.count;
        this.colorBuffer = new Float32Array(this.vertexCount * 3);
        this.vertexBoneIndices = new Int32Array(this.vertexCount);

        for (let i = 0; i < this.vertexCount; i++) {
            this.colorBuffer[i * 3]     = 0.04;
            this.colorBuffer[i * 3 + 1] = 0.11;
            this.colorBuffer[i * 3 + 2] = 0.20;
            this.vertexBoneIndices[i] = skinIndices[i * 4];
        }

        geo.setAttribute("color", new THREE.BufferAttribute(this.colorBuffer, 3));

        const skeleton = new THREE.Skeleton(allBones);

        const surfaceMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.90,
            metalness: 0.0,
            transparent: true,
            opacity: 0.95,
            vertexColors: true,
            skinning: true,
            side: THREE.FrontSide
        });

        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x769b89,
            wireframe: true,
            transparent: true,
            opacity: 0.055,
            skinning: true,
            depthWrite: false
        });

        this.handMesh = new THREE.SkinnedMesh(geo, surfaceMat);
        this.handMesh.add(rootBone);
        this.handMesh.bind(skeleton);
        this.buildJointActivityMasks();
        this.handMesh.frustumCulled = false;

        this.wireMesh = new THREE.SkinnedMesh(geo, wireMat);
        this.wireMesh.bind(skeleton);
        this.wireMesh.frustumCulled = false;
        this.handMesh.add(this.wireMesh);

        this.handGroup.scale.x = -1;
        this.handedness = "right";
        this.handGroup.add(this.handMesh);
        this.isModelLoaded = true;
    }

    /**
     * Medical Kinematic Strain Color Palette Generator
     * Sensor activity palette: resting sage, moderate yellow, high red.
     * This visualises measured flex/pressure, not a muscle-strain diagnosis.
     */
    getThermalColor(intensity) {
        const value = Math.max(0, Math.min(1, intensity));
        const stops = [[0.50,0.62,0.54],[0.72,0.76,0.34],[0.96,0.72,0.13],[0.95,0.34,0.07],[0.82,0.055,0.035]];
        const step = Math.min(3, Math.floor(value * 4)), fraction = value * 4 - step;
        const a = stops[step], b = stops[step + 1];
        return {r:a[0]+(b[0]-a[0])*fraction,g:a[1]+(b[1]-a[1])*fraction,b:a[2]+(b[2]-a[2])*fraction};
    }

    setupInteraction() {
        const onStart = (clientX, clientY) => {
            this.isMouseDown = true;
            this.isUserInteracting = true;
            this.mousePos = { x: clientX, y: clientY };
        };

        const onMove = (clientX, clientY) => {
            if (!this.isMouseDown) return;
            const deltaX = clientX - this.mousePos.x;
            const deltaY = clientY - this.mousePos.y;

            this.handRotation.y += deltaX * 0.009;
            this.handRotation.x += deltaY * 0.009;

            // Clamping vertical rotation to prevent flipping upside down
            this.handRotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.handRotation.x));
            this.mousePos = { x: clientX, y: clientY };
        };

        const onEnd = () => {
            this.isMouseDown = false;
        };

        this.canvas.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY));
        window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
        window.addEventListener("mouseup", onEnd);

        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener("touchend", onEnd);

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            this.cameraDistance = Math.max(95, Math.min(220, this.cameraDistance + e.deltaY * 0.16));
            this.camera.position.z = this.cameraDistance;
        }, { passive: false });
    }

    onResize() {
        if (!this.canvas || !this.renderer || !this.camera) return;
        const parent = this.canvas.parentElement;
        const w = parent ? parent.clientWidth : (this.canvas.clientWidth || 340);
        const h = parent ? parent.clientHeight : (this.canvas.clientHeight || 380);
        this.camera.aspect = w / h;
        if (h < 320 && this.fitSmallPanels) {
            this.camera.position.z = Math.max(this.cameraDistance, 160);
        } else {
            this.camera.position.z = this.cameraDistance;
        }
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    }

    setCameraPreset(preset) {
        this.isUserInteracting = true;
        switch (preset) {
            case "palm":
                this.cameraDistance = this.defaultCameraDistance;
                this.handRotation.x = 0;
                this.handRotation.y = 0;
                this.handRotation.z = 0;
                break;
            case "dorsal":
                this.cameraDistance = this.defaultCameraDistance;
                this.handRotation.x = 0;
                this.handRotation.y = Math.PI;
                this.handRotation.z = 0;
                break;
            case "side":
                this.cameraDistance = this.defaultCameraDistance;
                this.handRotation.x = 0;
                this.handRotation.y = -Math.PI * 0.5;
                this.handRotation.z = 0;
                break;
            case "reset":
            default:
                this.resetCamera();
                return;
        }
        this.camera.position.z = this.cameraDistance;
    }

    resetCamera() {
        this.isUserInteracting = false;
        this.handRotation = { x: 0, y: 0, z: 0 };
        this.targetTilt = { x: 0, y: 0, z: 0 };
        this.cameraDistance = this.defaultCameraDistance;
        this.camera.position.set(0, 0, this.cameraDistance);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Coordinated Grasp & Release State Machine Triggers
     */
    setSensorOnly(enabled) {
        if (enabled && !this.sensorOnly) this.holdPose();
        this.sensorOnly = enabled;
    }

    holdPose() {
        this.graspController.state = "SENSOR_DRIVEN";
        this.manualOverride = false;
        for (const finger of ["thumb", "index", "middle", "ring", "pinky"]) this.targetBends[finger] = this.currentBends[finger];
        this.targetWristPitch = this.currentWristPitch;
        this.targetEmg = this.currentEmg;
        this.targetFsr = this.currentFsr;
    }

    triggerGrasp() {
        if (this.sensorOnly) return;
        this.manualOverride = true;
        this.lastDataTime = Date.now();
        this.graspController.state = "CLOSING";
        this.graspController.targetProgress = 1.0;
    }

    triggerRelease() {
        if (this.sensorOnly) return;
        this.manualOverride = true;
        this.lastDataTime = Date.now();
        this.graspController.state = "RELEASING";
        this.graspController.targetProgress = 0.0;
    }

    /**
     * Parameterized Posture Quick-Test
     * Works independently of hardware availability and transitions smoothly without pose jumps.
     */
    testPose(mode) {
        if (this.sensorOnly) return;
        this.manualOverride = (mode !== "auto");
        this.lastDataTime = Date.now();

        if (mode === "auto") {
            this.graspController.state = "SENSOR_DRIVEN";
            return;
        }

        const pose = this.poses[mode];
        if (pose) {
            for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
                this.targetBends[f] = pose[f];
            }
            this.targetWristPitch = pose.wristPitch;
            this.targetEmg = pose.emg;
            this.targetFsr = pose.fsr;

            if (mode === "grasp" || mode === "close") {
                this.graspController.state = "CLOSED";
                this.graspController.progress = 1.0;
            } else if (mode === "open") {
                this.graspController.state = "OPEN";
                this.graspController.progress = 0.0;
            }
        }
    }

    /**
     * Continuous Grasp Interpolation along Anatomical Curling Curve
     */
    interpolateGraspPose(progress) {
        const p = Math.max(0.0, Math.min(1.0, progress));
        const ease = 0.5 - 0.5 * Math.cos(p * Math.PI); // Cosine smooth-step easing

        const open = this.poses.open;
        const grasp = this.poses.grasp;

        for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
            this.targetBends[f] = open[f] + (grasp[f] - open[f]) * ease;
        }
        this.targetWristPitch = open.wristPitch + (grasp.wristPitch - open.wristPitch) * ease;
        this.targetEmg = open.emg + (grasp.emg - open.emg) * ease;
        this.targetFsr = open.fsr + (grasp.fsr - open.fsr) * ease;
    }

    /**
     * Live Sensor Telemetry Ingestion Pipeline
     * Connects 5 flex channels, IMU pitch, EMG envelope, and FSR pressure.
     */
    updateSensorPose(flex, imu, emg, fsr, reset = false) {
        if (reset) {
            for (const finger of ["thumb","index","middle","ring","pinky"]) {
                const value = Number.isFinite(flex?.[finger]) ? Math.max(0,Math.min(1,flex[finger]/100)) : 0;
                this.filteredFlex[finger] = value < .015 ? .02 : value;
            }
            const pitch = this.sensorWristPitch(imu);
            this.filteredPitch = Math.abs(pitch) < .035 ? 0 : Math.max(-.78,Math.min(.87,pitch));
            this.targetTilt = {x:0,y:0,z:0};
        }
        this.updatePose(flex, imu, null, emg, fsr);
        if (reset) {
            Object.assign(this.currentBends, this.targetBends);
            this.currentWristPitch = this.targetWristPitch;
            this.currentEmg = this.targetEmg;this.currentFsr = this.targetFsr;
        }
    }

    sensorWristPitch(imu) {
        if (Number.isFinite(imu?.pitch)) return -imu.pitch * Math.PI / 180;
        if (Number.isFinite(imu?.acc_y)) return -Math.atan2(imu.acc_y, Math.hypot(imu.acc_x || 0, imu.acc_z ?? 1));
        return 0;
    }

    updatePose(flexData, imuData, targetPoseInfo, emgData, fsrData) {
        this.lastDataTime = Date.now();
        this.manualOverride = false;
        this.graspController.state = "SENSOR_DRIVEN";

        // 1. Five Independent Flex Sensor Channels
        if (flexData) {
            for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
                if (f in flexData) {
                    const rawVal = flexData[f];
                    // Normalize percentage [0 - 100] to [0.0 - 1.0]
                    let norm = Math.max(0.0, Math.min(1.0, rawVal / 100.0));

                    // Deadband threshold: values within 1.5% of neutral snap to calibrated baseline
                    if (norm < 0.015) {
                        norm = 0.02;
                    }

                    // Store the measured target; one render-time filter avoids packet-rate-dependent lag.
                    this.filteredFlex[f] = norm; // Time-based smoothing happens once per rendered frame.
                    this.targetBends[f] = this.filteredFlex[f];
                }
            }

            // Estimate grasp progress from aggregate finger flexion
            const meanBend = (this.targetBends.index + this.targetBends.middle + this.targetBends.ring + this.targetBends.pinky) / 4.0;
            this.graspController.progress = meanBend;
        }

        // 2. IMU Orientation & Wrist Flexion/Extension
        if (imuData) {
            let rawPitch = this.sensorWristPitch(imuData);

            // Deadband threshold around resting horizontal (±2°)
            if (Math.abs(rawPitch) < 0.035) {
                rawPitch = 0.0;
            }

            // Safe angular limits: Palmar Flexion max +0.87 rad (+50°), Dorsal Extension min -0.78 rad (-45°)
            rawPitch = Math.max(-0.78, Math.min(0.87, rawPitch));

            this.filteredPitch = rawPitch;
            this.targetWristPitch = this.filteredPitch;

            // Rotation about the hand's long axis, using gravity or fused roll.
            if (!this.isMouseDown) {
                this.targetTilt.y = Number.isFinite(imuData.roll) ? imuData.roll * Math.PI / 180 : Number.isFinite(imuData.acc_x) && Number.isFinite(imuData.acc_z) ? Math.atan2(imuData.acc_x,imuData.acc_z) : 0;
                this.targetTilt.z = 0;
            }
        }

        // 3. Target Pose Information
        if (targetPoseInfo) {
            this.targetPose = targetPoseInfo.pose || "OPEN";
            this.isMatched = targetPoseInfo.matched || false;
        }

        // 4. EMG Muscle Activity
        if (emgData?.available === false) this.targetEmg = 0;
        if (emgData && Number.isFinite(emgData.envelope)) {
            this.targetEmg = emgData.envelope;
        }

        // 5. Grip-Force Contact Pressure
        if (fsrData && fsrData.pressure_pct !== undefined) {
            this.targetFsr = fsrData.pressure_pct;
        }

        this.updateHUDTexts();
    }

    updateHUDTexts() {
        const emgValEl = document.getElementById("hudEmgVal");
        const emgStatusEl = document.getElementById("hudEmgStatus");
        if (emgValEl) {
            emgValEl.textContent = `${this.currentEmg.toFixed(1)} µV`;
            if (emgValEl.style) {
                emgValEl.style.color = this.currentEmg > 45.0 ? "#facc15" : "#38bdf8";
            }
            if (emgStatusEl) {
                emgStatusEl.textContent = this.currentEmg > 45.0 ? "Active Contraction" : "Baseline";
            }
        }

        const fsrValEl = document.getElementById("hudFsrVal");
        const fsrStatusEl = document.getElementById("hudFsrStatus");
        if (fsrValEl) {
            fsrValEl.textContent = `${this.currentFsr.toFixed(1)}%`;
            if (fsrValEl.style) {
                fsrValEl.style.color = this.currentFsr > 30.0 ? "#ef4444" : "#10b981";
            }
            if (fsrStatusEl) {
                fsrStatusEl.textContent = this.currentFsr > 30.0 ? "Firm Contact" : "No Contact";
            }
        }
    }

    animate() {
        if (this.visibilityCheck && !this.visibilityCheck()) {
            this.clock?.getDelta();
            requestAnimationFrame(this.animate);
            return;
        }
        this.pulseTime += 0.04;

        // Frame-rate independent delta time
        const dt = this.clock ? Math.min(0.08, this.clock.getDelta()) : 0.016;

        // Hold the last measured pose when telemetry stops. Demo movement is
        // supplied by the simulator through the same data path as hardware.
        // Grasp State Machine Stepping (when in CLOSING or RELEASING state)
        if (this.graspController.state === "CLOSING") {
            this.graspController.progress = Math.min(1.0, this.graspController.progress + dt * this.graspController.speed);
            this.interpolateGraspPose(this.graspController.progress);
            if (this.graspController.progress >= 1.0) {
                this.graspController.state = "CLOSED";
            }
        } else if (this.graspController.state === "RELEASING") {
            this.graspController.progress = Math.max(0.0, this.graspController.progress - dt * this.graspController.speed);
            this.interpolateGraspPose(this.graspController.progress);
            if (this.graspController.progress <= 0.0) {
                this.graspController.state = "OPEN";
            }
        }

        // Frame-Rate Independent Exponential Smoothing: alpha = 1.0 - exp(-dt * speed)
        // Eliminates jitter and sudden jumps across all refresh rates (30 Hz to 144 Hz)
        const smoothSpeed = 24.0;
        const alpha = 1.0 - Math.exp(-dt * smoothSpeed);

        for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
            this.currentBends[f] += (this.targetBends[f] - this.currentBends[f]) * alpha;
        }
        this.currentTilt ||= {x:0,y:0,z:0};
        for (const axis of ['x','y','z']) {
            const difference = this.targetTilt[axis] - this.currentTilt[axis];
            this.currentTilt[axis] += Math.atan2(Math.sin(difference),Math.cos(difference)) * alpha;
        }
        this.currentWristPitch += (this.targetWristPitch - this.currentWristPitch) * alpha;
        this.currentEmg += (this.targetEmg - this.currentEmg) * alpha;
        this.currentFsr += (this.targetFsr - this.currentFsr) * alpha;

        if (this.isModelLoaded) {
            // 1. Articulated Wrist Joint Kinematics (Stationary forearm cuff, palm pivots)
            this.applyWristKinematics();

            // 2. Anatomically Accurate 5-Digit Finger Kinematics
            this.applyFingerKinematics();

            // Surface colours need fewer updates than the skeleton. Avoid rebuilding
            // large vertex colour buffers on every high-refresh display frame.
            this.heatmapElapsed = (this.heatmapElapsed || 0) + dt;
            if (this.heatmapElapsed >= 1 / 30) {
                this.applyThermalHeatmaps();
                this.heatmapElapsed %= 1 / 30;
            }
        }

        // 3D Camera Orbit & Hand Group Orientation
        if (!this.isMouseDown && !this.isUserInteracting) {
            const idleFloat = 0; // Measured movement only; no decorative hand motion.
            this.handGroup.rotation.x = this.handRotation.x + this.currentTilt.x + idleFloat;
            this.handGroup.rotation.y = this.handRotation.y + this.currentTilt.y;
            this.handGroup.rotation.z = this.handRotation.z + this.currentTilt.z;
        } else {
            this.handGroup.rotation.x = this.handRotation.x;
            this.handGroup.rotation.y = this.handRotation.y;
            this.handGroup.rotation.z = this.handRotation.z;
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }

    /**
     * Anatomically Plausible Finger Articulation:
     * - Continuous coupled joint curling across the complete sensor range.
     * - Physiological inward convergence: Digits converge naturally toward the midline.
     * - Saddle CMC Thumb Articulation: Multi-axial opposition (palmar sweep + medial adduction), MCP & IP flexion.
     */
    applyFingerKinematics() {
        const b = this.currentBends;
        const bones = this.bones;

        // Continuous curl fractions for MCP, PIP, and DIP joints
        const getCurlFractions = (bend) => {
            const c = Math.max(0.0, Math.min(1.0, bend));
            // All joints participate throughout the stroke; no engagement thresholds.
            const mcp = c;
            const pip = c;
            const dip = c;
            return { mcp, pip, dip };
        };

        // Rotates bone along its local flexion axis (Z) and anatomical convergence axis (X)
        const setJointRot = (bone, curlZ, convX = 0) => {
            if (!bone || !bone.userData.restEuler) return;
            bone.rotation.z = bone.userData.restEuler.z + curlZ;
            bone.rotation.x = bone.userData.restEuler.x + convX;
            bone.rotation.y = bone.userData.restEuler.y;
        };

        // 1. Index Finger (bones: index_prox, index_midd, index_dist)
        const fIdx = getCurlFractions(b.index || 0.0);
        setJointRot(bones.index_prox, fIdx.mcp * 1.12, -fIdx.mcp * 0.08); // MCP flexion + subtle ulnar convergence
        setJointRot(bones.index_midd, fIdx.pip * 1.48);                   // PIP flexion
        setJointRot(bones.index_dist, fIdx.dip * 0.95);                   // DIP flexion

        // 2. Middle Finger (bones: midd_prox / middle_prox, midd_midd, midd_dist)
        const fMid = getCurlFractions(b.middle || 0.0);
        const midProx = bones.midd_prox || bones.middle_prox;
        const midMidd = bones.midd_midd || bones.middle_midd;
        const midDist = bones.midd_dist || bones.middle_dist;
        setJointRot(midProx, fMid.mcp * 1.12);                            // MCP flexion (central midline)
        setJointRot(midMidd, fMid.pip * 1.48);                            // PIP flexion
        setJointRot(midDist, fMid.dip * 0.95);                            // DIP flexion

        // 3. Ring Finger (bones: ring_prox, ring_midd, ring_dist)
        const fRng = getCurlFractions(b.ring || 0.0);
        setJointRot(bones.ring_prox, fRng.mcp * 1.12, fRng.mcp * 0.06);   // MCP flexion + radial convergence
        setJointRot(bones.ring_midd, fRng.pip * 1.48);                    // PIP flexion
        setJointRot(bones.ring_dist, fRng.dip * 0.95);                    // DIP flexion

        // 4. Pinky Finger (bones: pinky_prox, pinky_midd, pinky_dist)
        const fPnk = getCurlFractions(b.pinky || 0.0);
        setJointRot(bones.pinky_prox, fPnk.mcp * 1.10, fPnk.mcp * 0.14);  // MCP flexion + inward cupping
        setJointRot(bones.pinky_midd, fPnk.pip * 1.48);                   // PIP flexion
        setJointRot(bones.pinky_dist, fPnk.dip * 0.95);                   // DIP flexion

        // 5. Opposable Thumb (bones: thumb_meta, thumb_prox, thumb_dist)
        const bThb = Math.max(0.0, Math.min(1.0, b.thumb || 0.0));
        const oppFrac = bThb;
        const thbMcp = bThb;
        const thbDip = bThb;

        if (bones.thumb_meta && bones.thumb_meta.userData.restEuler) {
            // Saddle CMC joint: simultaneous palmar flexion (+Z) and medial adduction/opposition sweep (+X)
            bones.thumb_meta.rotation.z = bones.thumb_meta.userData.restEuler.z + oppFrac * 0.65;
            bones.thumb_meta.rotation.x = bones.thumb_meta.userData.restEuler.x + oppFrac * 0.55;
        }
        setJointRot(bones.thumb_prox, thbMcp * 0.85);                     // MCP flexion
        setJointRot(bones.thumb_dist, thbDip * 1.10);                     // IP flexion
    }

    /**
     * Articulated Wrist Joint Kinematics:
     * Rotates all five metacarpal rays from the shared carpal wrist joint pivot.
     * Keeps the forearm root (radius_ulna) completely stationary so the forearm cuff does not rotate.
     */
    applyWristKinematics() {
        // Keep forearm root stationary
        if (this.bones.radius_ulna && this.bones.radius_ulna.userData.restQuat) {
            this.bones.radius_ulna.quaternion.copy(this.bones.radius_ulna.userData.restQuat);
        }

        // Clamp safe angular limits
        // Flexion: up to +0.87 rad (+50°), Extension: down to -0.78 rad (-45°)
        const safePitch = Math.max(-0.78, Math.min(0.87, this.currentWristPitch));

        const metaBoneNames = ["pinky_meta", "ring_meta", "midd_meta", "index_meta", "thumb_trapez"];
        const qOffset = new THREE.Quaternion().setFromAxisAngle(this.localWristAxis, safePitch);

        for (const name of metaBoneNames) {
            const bone = this.bones[name];
            if (bone && bone.userData.restQuat) {
                bone.quaternion.copy(bone.userData.restQuat).premultiply(qOffset);
            }
        }

        // Support procedural fallback bones if active
        if (this.bones.middle_meta && this.bones.middle_meta.userData.restQuat) {
            for (const name of ["pinky_meta", "ring_meta", "middle_meta", "index_meta", "thumb_meta"]) {
                const b = this.bones[name];
                if (b && b.userData.restQuat) {
                    b.quaternion.copy(b.userData.restQuat).premultiply(qOffset);
                }
            }
        }
    }

    /**
     * Cache soft joint regions in the undeformed mesh, so activity colours
     * follow the skin during bending without spreading to unrelated digits.
     */
    buildJointActivityMasks() {
        const mesh = this.handMesh, skeleton = mesh?.skeleton;
        if (!skeleton?.boneInverses?.length) return;
        const digits = ['thumb','index','middle','ring','pinky'];
        const digitIndex = name => digits.findIndex(d => name.startsWith(d === 'middle' ? 'midd' : d));
        const centers = [];
        skeleton.bones.forEach((bone, index) => {
            const digit = digitIndex(bone.name);
            if (digit < 0 || !/_(prox|midd|dist)$/.test(bone.name)) return;
            const center = new THREE.Vector3().setFromMatrixPosition(skeleton.boneInverses[index].clone().invert());
            center.applyMatrix4(mesh.bindMatrixInverse);
            centers.push({digit, center, radius: bone.name.endsWith('_prox') ? 1.35 : 1.0});
        });
        const geometry = mesh.geometry, position = geometry.attributes.position;
        const indices = geometry.attributes.skinIndex.array, weights = geometry.attributes.skinWeight.array;
        const boneDigits = skeleton.bones.map(b => digitIndex(b.name));
        this.jointActivityMasks = new Float32Array(position.count * 5);
        const vertex = new THREE.Vector3();
        for (let i = 0; i < position.count; i++) {
            vertex.fromBufferAttribute(position, i);
            for (const joint of centers) {
                let belonging = 0;
                for (let k = 0; k < 4; k++) if (boneDigits[indices[i*4+k]] === joint.digit) belonging += weights[i*4+k];
                const distance = Math.max(0, vertex.distanceTo(joint.center) / joint.radius - .85);
                // Compact soft spots around the joint; the finger shaft stays neutral.
                const mask = belonging * Math.exp(-distance * distance * 2);
                const offset = i*5 + joint.digit;
                this.jointActivityMasks[offset] = Math.max(this.jointActivityMasks[offset], mask < .04 ? 0 : mask);
            }
        }
    }

    applyThermalHeatmaps() {
        if (!this.handMesh || !this.vertexBoneIndices) return;

        const geometry = this.handMesh.geometry, colors = this.colorBuffer;
        const b = this.currentBends;
        const activity = [b.thumb,b.index,b.middle,b.ring,b.pinky].map(v => Math.max(0,Math.min(1,v || 0)));
        for (let i = 0; i < this.vertexCount; i++) {
            let intensity = 0;
            for (let d = 0; d < 5; d++) intensity = Math.max(intensity, activity[d] * (this.jointActivityMasks?.[i*5+d] || 0));
            // A single FSR and forearm EMG cannot identify which fingertip or
            // intrinsic hand muscle is loaded, so neither paints invented hotspots.
            const color = this.getThermalColor(intensity);
            colors[i*3] = color.r;colors[i*3+1] = color.g;colors[i*3+2] = color.b;
        }
        geometry.attributes.color.needsUpdate = true;
    }
}
