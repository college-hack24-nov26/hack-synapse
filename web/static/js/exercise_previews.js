/** Hover-only exercise illustrations. Independent of the live sensor hand and session scores. */
class ExerciseCardPreview {
    constructor(canvas,card,exercise){
        this.canvas=canvas;this.ctx=canvas.getContext('2d');this.exercise=exercise;this.frame=null;this.active=false;
        this.draw(0);
        const begin=()=>{if(this.active||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;this.active=true;this.started=performance.now();this.tick(this.started);};
        const end=()=>{this.active=false;if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.draw(0);};
        card.addEventListener('pointerenter',begin);card.addEventListener('pointerleave',end);
        card.addEventListener('focusin',begin);card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))end();});
        document.addEventListener('visibilitychange',()=>{if(document.hidden)end();});
        // Opening a dialog or switching tabs stops the preview immediately.
        card.addEventListener('click',end);
    }
    tick(now){if(!this.active)return;this.draw((now-this.started)/1000);this.frame=requestAnimationFrame(time=>this.tick(time));}
    static loadHand(){
        if(this.ready)return this.ready;
        this.ready=new Promise(resolve=>{
            if(typeof MirrorHandVisualizer==='undefined'){resolve(null);return;}
            const canvas=document.createElement('canvas');canvas.id='exercisePreviewRenderer';
            canvas.width=240;canvas.height=288;canvas.setAttribute('aria-hidden','true');
            // The renderer measures its parent on resize. Keep that parent fixed
            // to the preview aspect ratio, rather than measuring the whole page.
            const holder=document.createElement('div');
            holder.style.cssText='position:fixed;left:-1000px;top:0;width:240px;height:288px;pointer-events:none';
            holder.setAttribute('aria-hidden','true');
            canvas.style.cssText='display:block;width:240px;height:288px';
            holder.append(canvas);document.body.append(holder);
            try{
                const hand=new MirrorHandVisualizer(canvas.id,{cameraDistance:132,fitSmallPanels:false,interactive:false,autoAnimate:false});
                const deadline=performance.now()+20000;
                const wait=()=>{
                    if(hand.isModelLoaded){
                        hand.renderer.setPixelRatio(1);hand.renderer.setSize(240,288,false);
                        hand.handMesh.material.transparent=false;hand.handMesh.material.opacity=1;hand.handMesh.material.depthWrite=true;
                        if(hand.wireMesh){hand.wireMesh.material.depthTest=true;hand.wireMesh.material.opacity=.3;}
                        const base=hand.getThermalColor(0);
                        for(let i=0;i<hand.vertexCount;i++){hand.colorBuffer[i*3]=base.r;hand.colorBuffer[i*3+1]=base.g;hand.colorBuffer[i*3+2]=base.b;}
                        hand.handMesh.geometry.attributes.color.needsUpdate=true;
                        resolve(hand);
                    }else if(performance.now()<deadline)setTimeout(wait,50);
                    else resolve(null);
                };wait();
            }catch(error){console.warn('Exercise hand preview unavailable',error);resolve(null);}
        });return this.ready;
    }
    draw(time){
        if(!this.ctx)return;
        if(!this.hand){
            if(!this.loading){this.loading=true;ExerciseCardPreview.loadHand().then(hand=>{this.hand=hand;if(hand)this.draw(0);});}
            return;
        }
        ExerciseCardPreview.renderPose(this.hand,this.exercise,time);
        this.ctx.clearRect(0,0,240,288);
        this.ctx.drawImage(this.hand.canvas,0,0,240,288);
    }
    static renderPose(hand,exercise,time){
        if(hand.bones.thumb_trapez?.userData.restQuat)hand.bones.thumb_trapez.quaternion.copy(hand.bones.thumb_trapez.userData.restQuat);
        const amount=(1-Math.cos(time/4*Math.PI*2))/2;
        const bends={thumb:.02,index:.02,middle:.02,ring:.02,pinky:.02};
        if(exercise==='grasp_release'||exercise==='grip_pressure')for(const finger of Object.keys(bends))bends[finger]=amount*.9;
        if(exercise==='individual_fingers')bends[Object.keys(bends)[Math.floor(time/1.8)%5]]=Math.sin((time%1.8)/1.8*Math.PI)**2*.85;
        if(exercise==='thumb_opposition'){
            const target=['index','middle','ring','pinky'][Math.floor(time/4)%4];
            bends.thumb=amount*(.64+['index','middle','ring','pinky'].indexOf(target)*.1);
            bends[target]=amount*.4;
        }
        hand.currentBends=bends;
        hand.currentWristPitch=exercise==='wrist_flexion'?Math.sin(time*1.5)*.6:0;
        hand.applyWristKinematics();hand.applyFingerKinematics();
        hand.handGroup.rotation.set(-.08,exercise==='forearm_rotation'?Math.sin(time*1.5)*1.5:.25,0);
        if(exercise==='thumb_opposition') ExerciseHandDemonstration.applyOpposition(hand,time);
        hand.renderer.render(hand.scene,hand.camera);
    }

}

/** Independent demonstration rig: never receives or changes live glove readings. */
class ExerciseHandDemonstration {
    static fingertip(hand,name) {
        const bone=hand.bones[name];if(!bone)return null;
        if(bone.userData.demoTip)return bone.userData.demoTip;
        const mesh=hand.handMesh,geometry=mesh.geometry,skeleton=mesh.skeleton;
        const boneIndex=skeleton.bones.indexOf(bone),parentIndex=skeleton.bones.indexOf(bone.parent);
        if(boneIndex<0||parentIndex<0)return null;
        const origin=new THREE.Vector3().setFromMatrixPosition(skeleton.boneInverses[boneIndex].clone().invert());
        const parent=new THREE.Vector3().setFromMatrixPosition(skeleton.boneInverses[parentIndex].clone().invert());
        const axis=origin.clone().sub(parent).normalize(),samples=[];
        const positions=geometry.attributes.position,indices=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight;
        for(let i=0;i<positions.count;i++){
            let weight=0;for(let j=0;j<4;j++)if(indices.array[i*4+j]===boneIndex)weight+=weights.array[i*4+j];
            if(weight<.5)continue;
            const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.bindMatrix);
            samples.push({point,distance:point.clone().sub(origin).dot(axis)});
        }
        samples.sort((a,b)=>b.distance-a.distance);if(!samples.length)return null;
        const tip=new THREE.Vector3(),cap=samples.slice(0,Math.max(3,Math.ceil(samples.length*.06)));
        cap.forEach(sample=>tip.add(sample.point));tip.divideScalar(cap.length).applyMatrix4(skeleton.boneInverses[boneIndex]);
        bone.userData.demoTip=tip;return tip;
    }

    static applyOpposition(hand,time) {
        if(hand.bones.thumb_trapez?.userData.restQuat)hand.bones.thumb_trapez.quaternion.copy(hand.bones.thumb_trapez.userData.restQuat);
        const names=['index','midd','ring','pinky'],phase=(time%20)/5,index=Math.floor(phase),local=phase-index;
        const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
        const amount=local<.38?smooth(local/.38):local<.6?1:1-smooth((local-.6)/.3);
        const targetBone=hand.bones[names[index]+'_dist'],thumb=hand.bones.thumb_dist;
        const targetTip=this.fingertip(hand,names[index]+'_dist'),thumbTip=this.fingertip(hand,'thumb_dist');
        if(!targetBone||!thumb||!targetTip||!thumbTip)return;
        hand.currentBends={thumb:0,index:0,middle:0,ring:0,pinky:0};
        hand.applyFingerKinematics();hand.handGroup.updateMatrixWorld(true);
        hand.demoOppositionPoses ||= {};
        // No axial thumb twist: opposition comes from the saddle joint and
        // forward MCP/IP flexion. Twisting Y to close a gap inverted the thumb.
        const definitions=[['thumb_trapez','x',0,.45],['thumb_trapez','z',0,.5],['thumb_meta','x',0,.85],['thumb_meta','z',0,1.55],['thumb_prox','z',0,1.15],['thumb_dist','z',0,.95],[names[index]+'_prox','z',0,1.5],[names[index]+'_prox','x',-.25,.25],[names[index]+'_midd','z',0,1.65],[names[index]+'_dist','z',0,1.15]];
        const joints=[...new Set(definitions.map(([name])=>hand.bones[name]).filter(Boolean))];
        const rest=joints.map(bone=>bone.quaternion.clone());
        if(!hand.demoOppositionPoses[index]){
            // Solve a complete contact pose once, with hinge limits on the
            // finger joints. Animate between these fixed poses to avoid IK jitter.
            const parameters=definitions.filter(([name])=>hand.bones[name]).map(([name,axis,min,max])=>({bone:hand.bones[name],axis,min,max,base:hand.bones[name].rotation[axis],value:0}));
            const a=new THREE.Vector3(),b=new THREE.Vector3();
            const modelInverse=hand.handMesh.parent.matrixWorld.clone().invert();
            const thumbJoints=['thumb_prox','thumb_dist'].map(name=>hand.bones[name]);
            const cost=()=>{
                hand.handGroup.updateMatrixWorld(true);
                a.copy(thumbTip).applyMatrix4(thumb.matrixWorld);b.copy(targetTip).applyMatrix4(targetBone.matrixWorld);
                let penalty=0;
                // +Z is the palmar side in this source model, independent of
                // camera rotation and the reflection used to display a right hand.
                for(const joint of thumbJoints){const local=joint.getWorldPosition(new THREE.Vector3()).applyMatrix4(modelInverse);penalty+=Math.max(0,.2-local.z)**2*80;}
                const localTip=a.clone().applyMatrix4(modelInverse);penalty+=Math.max(0,.8-localTip.z)**2*80;
                return a.distanceToSquared(b)+penalty+parameters.reduce((sum,p)=>sum+p.value*p.value*.04,0);
            };
            for(let pass=0;pass<360;pass++){
                const step=.28*Math.pow(.987,pass)+.001;
                for(const p of parameters){
                    let best=p.value,bestCost=cost();
                    for(const direction of [-1,1]){
                        const candidate=Math.max(p.min,Math.min(p.max,p.value+direction*step));p.bone.rotation[p.axis]=p.base+candidate;
                        const score=cost();if(score<bestCost){best=candidate;bestCost=score;}
                    }
                    p.value=best;p.bone.rotation[p.axis]=p.base+best;
                }
            }
            hand.demoOppositionPoses[index]=joints.map(bone=>bone.quaternion.clone());
        }
        joints.forEach((bone,i)=>bone.quaternion.copy(rest[i]).slerp(hand.demoOppositionPoses[index][i],amount));
        hand.handGroup.updateMatrixWorld(true);
    }

    static setupLighting(hand) {
        if (!hand.scene) return;
        // Natural warm portrait studio lighting for realistic human skin rendering
        hand.scene.traverse(obj => {
            if (obj.isAmbientLight) {
                obj.color.set('#fff5eb');
                obj.intensity = 0.32;
            } else if (obj.isDirectionalLight) {
                if (obj.position.z > 0 && obj.position.x > 0) {
                    // Key light (upper-right front)
                    obj.color.set('#fff9f4');
                    obj.intensity = 1.05;
                    obj.position.set(30, 48, 55);
                } else if (obj.position.x < 0) {
                    // Fill light (soft warm fill on left)
                    obj.color.set('#faece3');
                    obj.intensity = 0.24;
                    obj.position.set(-35, 12, 38);
                } else if (obj.position.z < 0) {
                    // Back/rim light (subsurface silhouette glow)
                    obj.color.set('#fcd8c4');
                    obj.intensity = 0.30;
                    obj.position.set(0, -25, -50);
                }
            }
        });
    }

    static applySkin(hand) {
        if (!hand.handMesh || !hand.handMesh.geometry) return;
        const geometry = hand.handMesh.geometry;
        const posAttr = geometry.attributes.position;
        const normAttr = geometry.attributes.normal;
        const count = geometry.attributes.position.count;

        // Ensure hand.colorBuffer matches the vertex count
        if (!hand.colorBuffer || hand.colorBuffer.length !== count * 3) {
            hand.colorBuffer = new Float32Array(count * 3);
        }
        hand.vertexCount = count;

        // Natural living human skin palette in linear color space for sRGB renderer
        const dorsalBase = new THREE.Color('#caa086').convertSRGBToLinear();    // Back of hand warm tan
        const palmarBase = new THREE.Color('#e5bcab').convertSRGBToLinear();    // Palm surface lighter & softer
        const flushColor = new THREE.Color('#d47a6b').convertSRGBToLinear();    // Fingertips & thenar capillary blush
        const knuckleColor = new THREE.Color('#b58269').convertSRGBToLinear();  // Knuckle dermal flexion creases
        const wristColor = new THREE.Color('#c59a80').convertSRGBToLinear();    // Lower wrist / forearm

        const tempColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);
            const nz = normAttr ? normAttr.getZ(i) : 0;

            // Palmar factor: positive normal Z and positive Z position faces the palm
            let palmar = (nz * 0.7) + (z > 0 ? 0.35 : -0.25) + 0.15;
            palmar = Math.max(0, Math.min(1, palmar));

            // Fingertip factor: upper fingers (y > 48, peaking at y ~ 70)
            const tipHeight = Math.max(0, Math.min(1, (y - 48) / 24));
            const tipFlush = tipHeight * (palmar * 0.7 + 0.3);

            // Thenar cushion factor (fleshy ball under thumb)
            const distFromThenar = Math.hypot(x - 14, y - 2);
            const thenarFlush = Math.max(0, Math.min(1, (18 - distFromThenar) / 18)) * palmar * 0.55;

            // Knuckle fold factor (dorsal side, y between 18 and 38)
            const knuckle = Math.max(0, Math.min(1, 1 - Math.abs(y - 28) / 10)) * (1 - palmar) * 0.45;

            // Wrist/forearm transition (y < -15)
            const wrist = Math.max(0, Math.min(1, (-15 - y) / 25));

            // Blend colors anatomically
            tempColor.copy(dorsalBase).lerp(knuckleColor, knuckle);
            tempColor.lerp(palmarBase, palmar * 0.85);
            tempColor.lerp(wristColor, wrist * 0.4);
            tempColor.lerp(flushColor, Math.max(tipFlush * 0.65, thenarFlush));

            hand.colorBuffer[i * 3]     = tempColor.r;
            hand.colorBuffer[i * 3 + 1] = tempColor.g;
            hand.colorBuffer[i * 3 + 2] = tempColor.b;
        }

        if (geometry.attributes.color) {
            geometry.attributes.color.array.set(hand.colorBuffer);
            geometry.attributes.color.needsUpdate = true;
        } else {
            geometry.setAttribute('color', new THREE.BufferAttribute(hand.colorBuffer, 3));
        }

        // Configure Material for living human skin with natural specularity & epidermal softness
        const material = hand.handMesh.material;
        Object.assign(material, {
            transparent: false,
            opacity: 1,
            depthWrite: true,
            roughness: 0.72,          // Soft, unpolished skin highlights
            metalness: 0.0,
            clearcoat: 0.04,
            clearcoatRoughness: 0.42,
            reflectivity: 0.22
        });

        // High-performance procedural skin micro-texture shader
        material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace('#include <common>', `
                #include <common>
                varying vec3 vDemoSkinPosition;
            `).replace('#include <begin_vertex>', `
                #include <begin_vertex>
                vDemoSkinPosition = position;
            `);

            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                varying vec3 vDemoSkinPosition;
                float demoSkinHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
                float demoSkinNoise(vec3 p) {
                    vec3 i = floor(p), f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(mix(demoSkinHash(i), demoSkinHash(i + vec3(1,0,0)), f.x),
                            mix(demoSkinHash(i + vec3(0,1,0)), demoSkinHash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(demoSkinHash(i + vec3(0,0,1)), demoSkinHash(i + vec3(1,0,1)), f.x),
                            mix(demoSkinHash(i + vec3(0,1,1)), demoSkinHash(i + vec3(1,1,1)), f.x), f.y),
                        f.z
                    );
                }
            `).replace('#include <color_fragment>', `
                #include <color_fragment>
                float skinTone = demoSkinNoise(vDemoSkinPosition * 2.2);
                float skinGrain = demoSkinNoise(vDemoSkinPosition * 36.0);
                // Organic variation in capillary tones
                diffuseColor.rgb *= mix(vec3(1.025, 0.98, 0.96), vec3(0.975, 1.015, 1.025), skinTone);
                diffuseColor.rgb *= 0.985 + 0.03 * skinGrain;
            `).replace('#include <normal_fragment_maps>', `
                #include <normal_fragment_maps>
                // Fine skin relief changes highlights without altering the silhouette.
                vec3 skinDetail = vec3(
                    demoSkinNoise(vDemoSkinPosition * 22.0 + vec3(0.19,0,0)),
                    demoSkinNoise(vDemoSkinPosition * 22.0 + vec3(0,0.19,0)),
                    demoSkinNoise(vDemoSkinPosition * 22.0 + vec3(0,0,0.19))
                ) - vec3(0.5);
                normal = normalize(normal + skinDetail * 0.045);
            `).replace('#include <roughnessmap_fragment>', `
                #include <roughnessmap_fragment>
                roughnessFactor = clamp(roughnessFactor + (skinGrain - 0.5) * 0.09, 0.62, 0.82);
            `);
        };

        material.needsUpdate = true;
        if (hand.wireMesh) hand.wireMesh.visible = false;
        try {
            if (hand.nailMesh) ExerciseHandDemonstration.applyNails(hand.nailMesh);
        } catch (e) {
            console.warn('Nail styling skipped:', e);
        }
        ExerciseHandDemonstration.setupLighting(hand);
    }

    static applyNails(nails) {
        if (!nails || !nails.geometry) return;
        const geometry = nails.geometry;
        const position = geometry.attributes.position;
        if (!position || !nails.skeleton) return;

        const indices = geometry.attributes.skinIndex.array;
        const weights = geometry.attributes.skinWeight.array;
        const centers = nails.skeleton.boneInverses.map(matrix =>
            new THREE.Vector3().setFromMatrixPosition(matrix.clone().invert()).applyMatrix4(nails.bindMatrixInverse)
        );

        const groups = new Map();
        const distances = [];
        const bones = [];
        const vertex = new THREE.Vector3();

        for (let i = 0; i < position.count; i++) {
            let slot = 0;
            for (let k = 1; k < 4; k++) {
                if (weights[i * 4 + k] > weights[i * 4 + slot]) slot = k;
            }
            const bone = indices[i * 4 + slot];
            const distance = vertex.fromBufferAttribute(position, i).distanceTo(centers[bone]);
            bones.push(bone);
            distances.push(distance);
            const range = groups.get(bone) || { min: Infinity, max: -Infinity };
            range.min = Math.min(range.min, distance);
            range.max = Math.max(range.max, distance);
            groups.set(bone, range);
        }

        // Realistic nail colors: healthy keratin pink bed, pale lunula, clean ivory tip
        const nailBed = new THREE.Color('#d9a79e').convertSRGBToLinear();
        const nailLunula = new THREE.Color('#f2e5df').convertSRGBToLinear();
        const nailTip = new THREE.Color('#f6f0e2').convertSRGBToLinear();

        const colors = new Float32Array(position.count * 3);
        const color = new THREE.Color();

        for (let i = 0; i < position.count; i++) {
            const range = groups.get(bones[i]);
            const along = (distances[i] - range.min) / Math.max(0.001, range.max - range.min);

            if (along < 0.15) {
                // Near cuticle / lunula
                const t = along / 0.15;
                color.copy(nailLunula).lerp(nailBed, t);
            } else if (along > 0.76) {
                // Free edge tip
                const t = Math.min(1, (along - 0.76) / 0.18);
                const blend = t * t * (3 - 2 * t);
                color.copy(nailBed).lerp(nailTip, blend);
            } else {
                color.copy(nailBed);
            }

            colors.set([color.r, color.g, color.b], i * 3);
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // High-gloss polished keratin material with skinning
        nails.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            vertexColors: true,
            skinning: true,
            transparent: false,
            opacity: 1,
            depthWrite: true,
            depthTest: true,
            side: THREE.DoubleSide,
            roughness: 0.36,
            metalness: 0.0,
            clearcoat: 0.28,
            clearcoatRoughness: 0.35,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        nails.visible = true;
        nails.renderOrder = 4;
        nails.frustumCulled = false;
    }

    constructor(canvas) {
        this.canvas = canvas;
        this.running = false;
        this.frame = null;
        this.prepared = false;
        this.hand = new MirrorHandVisualizer(canvas.id, {
            cameraDistance: 132,
            fitSmallPanels: false,
            interactive: false,
            autoAnimate: false
        });
    }

    start(exercise = 'individual_fingers') {
        if (this.exercise !== exercise) {
            this.stop();
            this.exercise = exercise;
        }
        if (this.running) return;
        this.running = true;
        this.started = performance.now();
        this.lastFrame = 0;
        this.hand.onResize();

        const tick = now => {
            if (!this.running) return;
            const visible = !document.hidden && document.getElementById('tab-exercises')?.classList.contains('active');
            if (visible && this.hand.isModelLoaded && now - this.lastFrame >= 1000 / 30) {
                if (!this.prepared) {
                    ExerciseHandDemonstration.applySkin(this.hand);
                    this.prepared = true;
                }
                ExerciseCardPreview.renderPose(this.hand, this.exercise, (now - this.started) / 1000);
                this.lastFrame = now;
            }
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    stop() {
        this.running = false;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
    }
}
