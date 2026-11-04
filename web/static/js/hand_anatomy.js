/** Anatomical rendering helpers. All interior structures attach to the measured hand rig. */
class NeuroGloveAnatomy {
    static smoothSurface(source) {
        // Weld UV seams before subdivision to avoid cracks in a transparent surface.
        const positions = [], influences = [], faces = [], welded = new Map(), remap = [];
        const p = source.attributes.position, si = source.attributes.skinIndex, sw = source.attributes.skinWeight;
        for (let i = 0; i < p.count; i++) {
            const xyz = [p.getX(i), p.getY(i), p.getZ(i)];
            const key = xyz.map(v => Math.round(v * 100000)).join(',');
            if (!welded.has(key)) {
                welded.set(key, positions.length); positions.push(xyz);
                const weights = new Map();
                for (let k = 0; k < 4; k++) {
                    const bone = si.array[i * 4 + k], weight = sw.array[i * 4 + k];
                    if (weight > 0) weights.set(bone, (weights.get(bone) || 0) + weight);
                }
                influences.push(weights);
            }
            remap.push(welded.get(key));
        }
        const indices = source.index ? source.index.array : Array.from({length:p.count},(_,i)=>i);
        for (let i = 0; i < indices.length; i += 3) faces.push([remap[indices[i]],remap[indices[i+1]],remap[indices[i+2]]]);
        let points = positions, weights = influences, triangles = faces;
        for (let pass = 0; pass < 2; pass++) {
            const edges = new Map(), neighbors = points.map(()=>new Set());
            const edgeKey = (a,b) => a < b ? `${a},${b}` : `${b},${a}`;
            for (const face of triangles) for(let k=0;k<3;k++) {
                const a=face[k],b=face[(k+1)%3],opposite=face[(k+2)%3],key=edgeKey(a,b);
                if (!edges.has(key)) edges.set(key,{a,b,opposites:[]});
                edges.get(key).opposites.push(opposite); neighbors[a].add(b);neighbors[b].add(a);
            }
            const boundary = points.map(()=>[]);
            for (const edge of edges.values()) if(edge.opposites.length === 1) {boundary[edge.a].push(edge.b);boundary[edge.b].push(edge.a);}
            const nextPoints=[],nextWeights=[];
            const add = (stencil) => {
                const point=[0,0,0],weight=new Map();
                for (const [index,factor] of stencil) {
                    for(let d=0;d<3;d++)point[d]+=points[index][d]*factor;
                    for(const [bone,value] of weights[index])weight.set(bone,(weight.get(bone)||0)+value*factor);
                }
                nextPoints.push(point);nextWeights.push(weight);return nextPoints.length-1;
            };
            for(let i=0;i<points.length;i++) {
                const adjacent=[...neighbors[i]],n=adjacent.length;
                if(boundary[i].length===2) add([[i,.75],...boundary[i].map(j=>[j,.125])]);
                else if(n) {const beta=n===3?3/16:3/(8*n);add([[i,1-n*beta],...adjacent.map(j=>[j,beta])]);}
                else add([[i,1]]);
            }
            for(const edge of edges.values()) {
                const {a,b,opposites:o}=edge;
                edge.index=add(o.length===2?[[a,.375],[b,.375],[o[0],.125],[o[1],.125]]:[[a,.5],[b,.5]]);
            }
            const nextTriangles=[];
            for(const [a,b,c] of triangles) {
                const ab=edges.get(edgeKey(a,b)).index,bc=edges.get(edgeKey(b,c)).index,ca=edges.get(edgeKey(c,a)).index;
                nextTriangles.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);
            }
            points=nextPoints;weights=nextWeights;triangles=nextTriangles;
        }
        const geometry=new THREE.BufferGeometry(),boneIndices=[],boneWeights=[];
        for (const weight of weights) {
            const largest=[...weight].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=largest.reduce((a,b)=>a+b[1],0)||1;
            for(let k=0;k<4;k++){boneIndices.push(largest[k]?.[0]||0);boneWeights.push((largest[k]?.[1]||0)/sum);}
        }
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
        geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(boneIndices,4));
        geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(boneWeights,4));
        geometry.setIndex(triangles.flat());geometry.computeVertexNormals();geometry.computeBoundingSphere();
        // Keep the original topology on the same smoothed/skinned points for a readable mesh.
        const overlay = new THREE.BufferGeometry();
        overlay.setAttribute('position', new THREE.Float32BufferAttribute(points.slice(0, positions.length).flat(), 3));
        overlay.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(boneIndices.slice(0, positions.length * 4), 4));
        overlay.setAttribute('skinWeight', new THREE.Float32BufferAttribute(boneWeights.slice(0, positions.length * 4), 4));
        overlay.setIndex(faces.flat());
        geometry.userData.meshOverlayGeometry = overlay;
        return geometry;
    }

    static createMeshOverlay(surface, skeleton, bindMatrix) {
        const geometry = (surface.userData.meshOverlayGeometry || surface).toNonIndexed();
        const barycentric = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < geometry.attributes.position.count; i++) barycentric[i * 3 + i % 3] = 1;
        geometry.setAttribute('meshBarycentric', new THREE.BufferAttribute(barycentric, 3));
        const material = new THREE.MeshBasicMaterial({
            color: 0x769b89, transparent: true, opacity: 0.58,
            skinning: true, depthWrite: false, depthTest: false, side: THREE.FrontSide
        });
        material.extensions = {derivatives: true};
        material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace('#include <common>', `
                #include <common>
                attribute vec3 meshBarycentric;
                varying vec3 vMeshBarycentric;
            `).replace('#include <begin_vertex>', `
                #include <begin_vertex>
                vMeshBarycentric = meshBarycentric;
            `);
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                varying vec3 vMeshBarycentric;
            `).replace('#include <alphatest_fragment>', `
                vec3 meshPixelWidth = fwidth(vMeshBarycentric);
                vec3 meshEdges = smoothstep(vec3(0.0), meshPixelWidth * 1.15, vMeshBarycentric);
                float meshLine = 1.0 - min(min(meshEdges.x, meshEdges.y), meshEdges.z);
                diffuseColor.a *= meshLine;
                if (diffuseColor.a < 0.015) discard;
                #include <alphatest_fragment>
            `);
        };
        const mesh = new THREE.SkinnedMesh(geometry, material);
        mesh.bind(skeleton, bindMatrix);
        mesh.frustumCulled = false;
        mesh.renderOrder = 5;
        return mesh;
    }

    static addInterior(bones) {
        const material = new THREE.MeshPhysicalMaterial({color:0xc3c9c7,roughness:.92,metalness:0,clearcoat:0,transparent:true,opacity:.46,depthWrite:false,depthTest:false});
        const jointMaterial = new THREE.MeshPhysicalMaterial({color:0xb7c5c8,roughness:.95,transparent:true,opacity:.24,depthWrite:false,depthTest:false});
        const tendonMaterial = new THREE.MeshStandardMaterial({color:0xcbdadf,roughness:.95,transparent:true,opacity:.25,depthWrite:false,depthTest:false});
        const structures=[];
        const addSegment=(bone,start,end,radius,mat=material)=>{
            const direction=new THREE.Vector3().subVectors(end,start),length=direction.length();
            if(length<.1)return;
            // A narrow diaphysis and softly expanded ends read as bone, rather than rods.
            const profile=[[0,.64],[.035,.95],[.10,1],[.18,.75],[.32,.52],[.68,.48],[.84,.70],[.93,1],[.985,.88],[1,.56]].map(([y,r])=>new THREE.Vector2(r*radius,y*length));
            const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile,20),mat);
            mesh.position.copy(start);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
            mesh.renderOrder=4;bone.add(mesh);structures.push(mesh);
            return mesh;
        };
        for(const name of ['index','midd','ring','pinky','thumb']) {
            const segments=name==='thumb'?['meta','prox','dist']:['meta','prox','midd','dist'];
            segments.forEach((segment,i)=>{
                const bone=bones[`${name}_${segment}`];if(!bone)return;
                const child=bones[`${name}_${segments[i+1]}`];
                const end=child?child.position.clone():new THREE.Vector3(0,name==='pinky'?1.25:1.65,0);
                const radius=(name==='thumb'?.36:name==='pinky'?.25:.32)*(segment==='meta'?1.10:segment==='dist'?.78:1);
                const length=end.length(),axis=end.clone().normalize();
                addSegment(bone,axis.clone().multiplyScalar(.12),end.clone().addScaledVector(axis,-.12),radius);
                const joint=new THREE.Mesh(new THREE.SphereGeometry(radius*.84,20,12),jointMaterial);
                joint.scale.set(1,.52,.85);joint.position.copy(end);joint.renderOrder=4;bone.add(joint);structures.push(joint);
                if(segment==='meta') {
                    const offset=new THREE.Vector3(.18,0,.45);
                    addSegment(bone,offset,end.clone().add(offset),.065,tendonMaterial);
                }
            });
        }
        const wrist=bones.radius_ulna;
        if(wrist) {
            wrist.updateWorldMatrix(true,false);
            // Carpal cluster in source model coordinates; transforms with the stationary wrist.
            [[-2.8,2.1,.30,.54],[-1.7,2.0,.32,.59],[-.5,1.9,.30,.48],[.5,2.0,.24,.43],[-3.0,3.1,.26,.44],[-1.9,3.2,.28,.56],[-.7,3.1,.27,.48],[.4,3.0,.26,.42]].forEach(([x,y,z,r])=>{
                const carpal=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material);
                carpal.position.copy(wrist.worldToLocal(new THREE.Vector3(x,y,z)));carpal.scale.set(1,.8,.7);carpal.renderOrder=4;wrist.add(carpal);structures.push(carpal);
            });
            for(const x of [-2.2,-.3]) {
                const start=wrist.worldToLocal(new THREE.Vector3(x,.15,.15));
                const end=wrist.worldToLocal(new THREE.Vector3(x+.1,1.4,.15));
                addSegment(wrist,start,end,x===-2.2?.38:.45);
            }
        }
        return structures;
    }
}
