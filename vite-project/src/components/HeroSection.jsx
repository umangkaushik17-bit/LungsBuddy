import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Activity, Shield, Wind } from 'lucide-react';
import * as THREE from 'three';

/* ===================================================================
   CUSTOM DAMAGE SHADER
   
   Medical reasoning:
   - Healthy lung tissue is light pink-red due to rich capillary blood supply
   - Carbon/particulate deposition (anthracosis) starts in bronchial regions
     and lower lobes where airflow deposits particles
   - Gradual fibrosis increases surface roughness and reduces elasticity
   - Color: Pink → dull pink → grey → dark grey → black (anthracotic)
   - Multi-octave noise simulates uneven deposition seen in pathological specimens
   =================================================================== */

const damageVertexShader = `
  uniform float damageLevel;
  uniform float time;
  uniform float breathPhase;    // -1 (exhale) → +1 (inhale)
  uniform float heartbeatPulse; //  0 (rest) → 1 (peak pulse)

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Simple 3D noise for vertex displacement (wrinkle/fibrosis effect)
  vec3 mod289v(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289v(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permutev(vec4 x) { return mod289v(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrtv(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoisev(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289v(i);
    vec4 p = permutev(permutev(permutev(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrtv(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // --- Wrinkle displacement: increases with damage, 0 when healthy ---
    float wrinkle = snoisev(position * 8.0 + time * 0.05) * 0.006
                  + snoisev(position * 15.0 - time * 0.03) * 0.003;
    float wrinkleStrength = damageLevel * damageLevel;
    vec3 displaced = position + normal * wrinkle * wrinkleStrength;

    // --- Anatomical breathing deformation ---
    // Lower portions (diaphragm) expand more than the apex
    // Normalized Y: 0 at bottom → 1 at top
    float yNorm = clamp((displaced.y + 1.0) * 0.5, 0.0, 1.0);
    float diaphragmInfluence = 1.0 - yNorm * 0.6; // base = 1.0, apex = 0.4

    // Lateral expansion (XZ) stronger than vertical (Y) — mimics rib cage expansion
    float breathAmp = breathPhase * 0.015 * diaphragmInfluence * (1.0 - damageLevel * 0.7);
    displaced.x += displaced.x * breathAmp * 1.2;  // lateral
    displaced.z += displaced.z * breathAmp * 1.0;  // anterior-posterior
    displaced.y += displaced.y * breathAmp * 0.3;  // minimal vertical stretch

    // --- Heartbeat pulse ---
    // Radiates outward from center, strongest near bronchi (center mass)
    float centerDist = length(displaced.xz);
    float pulseRadius = max(0.0, 1.0 - centerDist * 1.5); // strongest at center
    float pulsePush = heartbeatPulse * 0.002 * pulseRadius * (1.0 - damageLevel * 0.5);
    displaced += normal * pulsePush;

    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const damageFragmentShader = `
  uniform float damageLevel;
  uniform float time;
  uniform vec3 healthyColor;
  uniform vec3 mildDamageColor;
  uniform vec3 moderateDamageColor;
  uniform vec3 severeDamageColor;
  uniform vec3 criticalDamageColor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // 3D Simplex noise for organic damage patterns
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    float noise1 = snoise(vPosition * 1.5 + time * 0.02) * 0.5 + 0.5;
    float noise2 = snoise(vPosition * 3.0 + time * 0.01) * 0.5 + 0.5;
    float noise3 = snoise(vPosition * 6.0 - time * 0.005) * 0.5 + 0.5;
    float noiseMask = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

    // Lower lobes + bronchial center accumulate more particles
    float lowerLobeBias = smoothstep(0.3, -0.5, vPosition.y) * 0.3;
    float centerBias = (1.0 - smoothstep(0.0, 0.8, length(vPosition.xz))) * 0.2;
    
    float effectiveDamage = clamp(damageLevel + (noiseMask - 0.5) * 0.3 + lowerLobeBias + centerBias, 0.0, 1.0);

    // 5-stage clinical color progression
    vec3 color;
    if (effectiveDamage < 0.25) {
      color = mix(healthyColor, mildDamageColor, effectiveDamage / 0.25);
    } else if (effectiveDamage < 0.5) {
      color = mix(mildDamageColor, moderateDamageColor, (effectiveDamage - 0.25) / 0.25);
    } else if (effectiveDamage < 0.75) {
      color = mix(moderateDamageColor, severeDamageColor, (effectiveDamage - 0.5) / 0.25);
    } else {
      color = mix(severeDamageColor, criticalDamageColor, (effectiveDamage - 0.75) / 0.25);
    }

    float roughness = mix(0.35, 0.85, effectiveDamage);

    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, vNormal), normalize(-vWorldPosition)), 0.0), mix(32.0, 4.0, roughness));
    float specIntensity = mix(0.4, 0.05, effectiveDamage);
    float fill = max(dot(vNormal, normalize(vec3(-0.3, 0.5, -0.5))), 0.0) * 0.3;

    vec3 ambient = color * 0.25;
    vec3 finalColor = ambient + color * (diff * 0.7 + fill) + vec3(1.0) * spec * specIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/* ===== Dust / Pollution Particles ===== */
const DustParticles = () => {
    const count = 120;
    const ref = useRef();

    const { positions, speeds, offsets } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        const off = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            // Distribute in a sphere around the lung
            const radius = 1.5 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = radius * Math.cos(phi);
            spd[i] = 0.2 + Math.random() * 0.5;    // Drift speed
            off[i] = Math.random() * Math.PI * 2;   // Phase offset
        }
        return { positions: pos, speeds: spd, offsets: off };
    }, []);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;
        const posArray = ref.current.geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const speed = speeds[i];
            const offset = offsets[i];

            // Gentle floating drift — irregular, like real airborne particulates
            posArray[idx] = positions[idx] + Math.sin(t * speed + offset) * 0.3;
            posArray[idx + 1] = positions[idx + 1] + Math.cos(t * speed * 0.7 + offset) * 0.4 + Math.sin(t * 0.15) * 0.2;
            posArray[idx + 2] = positions[idx + 2] + Math.sin(t * speed * 0.5 + offset * 2) * 0.3;
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions.slice()}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#94a3b8"
                transparent
                opacity={0.5}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
};

/* ===== Lung Model with Damage + In-Place Rotation ===== */
const LungModelWithBreathing = () => {
    const gltf = useGLTF('/models/3d-vh-f-lung.glb');
    const pivotRef = useRef();     // Outer pivot — handles rotation
    const innerRef = useRef();     // Inner group — offset position so model is centered at pivot origin
    const materialRef = useRef();
    const baseScaleRef = useRef(1);
    const centerOffsetRef = useRef(new THREE.Vector3());

    const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: damageVertexShader,
        fragmentShader: damageFragmentShader,
        uniforms: {
            damageLevel: { value: 0.0 },
            time: { value: 0.0 },
            breathPhase: { value: 0.0 },
            heartbeatPulse: { value: 0.0 },
            healthyColor: { value: new THREE.Color('#e8a0a0') },
            mildDamageColor: { value: new THREE.Color('#c49090') },
            moderateDamageColor: { value: new THREE.Color('#8a8a8e') },
            severeDamageColor: { value: new THREE.Color('#4a4a50') },
            criticalDamageColor: { value: new THREE.Color('#555560') },
        },
        side: THREE.DoubleSide,
    }), []);

    materialRef.current = shaderMaterial;

    useEffect(() => {
        if (!gltf.scene) return;

        gltf.scene.traverse((child) => {
            if (child.isMesh) child.material = shaderMaterial;
        });

        // Compute bounding box, find center offset and scale
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.6 / maxDim;
        baseScaleRef.current = scale;
        centerOffsetRef.current.copy(center).multiplyScalar(-1);

        if (pivotRef.current) {
            pivotRef.current.scale.setScalar(scale);
        }
        if (innerRef.current) {
            innerRef.current.position.copy(centerOffsetRef.current);
        }
    }, [gltf.scene, shaderMaterial]);

    useFrame((state) => {
        if (!pivotRef.current || !materialRef.current) return;
        const elapsed = state.clock.elapsedTime;
        const u = materialRef.current.uniforms;

        // --- Rotation ---
        pivotRef.current.rotation.y = elapsed * 0.3;

        // --- Damage cycle (ping-pong 0→1→0 over ~24s) ---
        const cycleTime = 12;
        const t = (elapsed % (cycleTime * 2)) / cycleTime;
        const damageLevel = t <= 1 ? t : 2 - t;
        u.damageLevel.value = damageLevel;
        u.time.value = elapsed;

        // ============================================
        // BREATHING — 15 breaths/min (4s cycle)
        //   Asymmetric: inhale 1.7s, exhale 2.3s
        //   Uses smoothstep for natural acceleration
        // ============================================
        const breathPeriod = 4.0;
        const inhaleRatio = 0.425;  // 1.7s / 4s
        const breathT = (elapsed % breathPeriod) / breathPeriod;
        let breathPhase;
        if (breathT < inhaleRatio) {
            // Inhale: 0 → 1 (smooth acceleration then deceleration)
            const p = breathT / inhaleRatio;
            breathPhase = p * p * (3 - 2 * p);  // smoothstep
        } else {
            // Exhale: 1 → 0 (slower, more relaxed)
            const p = (breathT - inhaleRatio) / (1 - inhaleRatio);
            breathPhase = 1 - p * p * (3 - 2 * p);
        }
        // Map 0–1 to -1–+1 range for shader
        u.breathPhase.value = breathPhase * 2 - 1;

        // ============================================
        // HEARTBEAT — 40 BPM (~1.5s per beat)
        //   Very subtle, slow pulse — alive, not distracting
        //   Single gentle swell instead of sharp lub-dub
        // ============================================
        const heartPeriod = 1.5;
        const heartT = (elapsed % heartPeriod) / heartPeriod;
        let heartbeat = 0;

        // Gentle single pulse — slow swell
        if (heartT < 0.2) {
            const p = heartT / 0.2;
            heartbeat = Math.sin(p * Math.PI) * 0.3;  // very soft peak
        }

        u.heartbeatPulse.value = heartbeat;

        // --- Global scale: damage squeeze + subtle macro breath ---
        // The per-vertex shader handles anatomical deformation,
        // but we still apply a gentle overall scale for visual impact
        const squeezeFactor = 1.0 - damageLevel * 0.12;
        const macroBreathe = 1.0 + (breathPhase * 2 - 1) * 0.008 * (1 - damageLevel * 0.7);
        const scale = baseScaleRef.current * squeezeFactor * macroBreathe;
        pivotRef.current.scale.setScalar(scale);
    });

    return (
        <group ref={pivotRef}>
            <group ref={innerRef}>
                <primitive object={gltf.scene} />
            </group>
        </group>
    );
};

/* ===== Scene with Medical Lighting + Particles ===== */
const LungScene = () => (
    <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
    >
        {/* Neutral medical lighting — soft, even, no harsh shadows */}
        <ambientLight intensity={0.5} color="#f0f4ff" />
        <directionalLight position={[4, 5, 5]} intensity={0.9} color="#ffffff" />
        <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#e8ecf4" />
        <directionalLight position={[0, -2, 4]} intensity={0.25} color="#f0f0ff" />
        {/* Subtle cyan rim for theme cohesion */}
        <pointLight position={[-3, 0, 4]} intensity={0.2} color="#06b6d4" distance={10} decay={2} />
        <pointLight position={[3, 0, 4]} intensity={0.2} color="#06b6d4" distance={10} decay={2} />

        <LungModelWithBreathing />
        <DustParticles />
    </Canvas>
);

/* ===== Stats ===== */
const stats = [
    { icon: Activity, label: 'Health Metrics', value: '15+' },
    { icon: Shield, label: 'AI Accuracy', value: '95%' },
    { icon: Wind, label: 'AQI Support', value: 'Real-time' },
];

/* ===== Hero Section ===== */
const HeroSection = () => {
    const handleScroll = () => {
        document.getElementById('input-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-grid-pattern"></div>
            <div className="absolute inset-0 bg-radial-glow"></div>
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-32 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: Content */}
                <motion.div
                    className="flex flex-col items-start text-left"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        AI-Powered Health Analytics
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                        <span className="gradient-text">Breathe</span>
                        <br />
                        <span className="text-white">Smarter.</span>
                    </h1>

                    <p className="text-gray-400 mt-6 max-w-lg text-lg leading-relaxed">
                        Advanced AI-powered lung health monitoring that analyzes your environment, lifestyle, and symptoms to deliver personalized health insights.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-8">
                        <button onClick={handleScroll} className="btn-glow px-8 py-3.5 text-base cursor-pointer">
                            Start Assessment →
                        </button>
                        <button
                            onClick={() => document.getElementById('damage-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-3.5 text-base rounded-xl border border-white/10 text-gray-300 hover:border-cyan-500/40 hover:text-white transition-all duration-300 cursor-pointer"
                        >
                            Learn More
                        </button>
                    </div>

                    <motion.div
                        className="flex gap-8 mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        {stats.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                    <Icon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">{value}</div>
                                    <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right: 3D Lung Model — fade in only, no zoom */}
                <motion.div
                    className="w-full h-[400px] md:h-[500px] lg:h-[550px] relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                >
                    {/* Radial glow behind model for depth integration */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-80 h-80 md:w-[26rem] md:h-[26rem] rounded-full bg-cyan-500/[0.04] blur-2xl"></div>
                    </div>
                    {/* Subtle ring */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[22rem] h-[22rem] md:w-[28rem] md:h-[28rem] rounded-full border border-white/[0.06]"></div>
                    </div>

                    <LungScene />

                    {/* Damage indicator badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.06]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[11px] text-gray-400 font-medium">Live Damage Simulation</span>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                </div>
            </motion.div>
        </section>
    );
};

useGLTF.preload('/models/3d-vh-f-lung.glb');

export default HeroSection;
