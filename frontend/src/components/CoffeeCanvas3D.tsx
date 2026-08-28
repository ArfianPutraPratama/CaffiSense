import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CoffeeCanvas3DProps {
  scrollY?: number;
  className?: string;
}

export default function CoffeeCanvas3D({ scrollY = 0, className = "" }: CoffeeCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setIsLoaded] = useState(false);
  const scrollRef = useRef(scrollY);

  useEffect(() => {
    scrollRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 6.2);
    camera.lookAt(0, 0.3, 0);

    // 2. Renderer with High-End Color & Shadow settings
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 1.4);
    scene.add(ambientLight);

    // Key warm sunlight
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.radius = 3;
    scene.add(keyLight);

    // Warm orange bounce / fill
    const orangeFill = new THREE.PointLight(0xea580c, 3.5, 10);
    orangeFill.position.set(-3.5, 1.5, 2.5);
    scene.add(orangeFill);

    // Cool cyan/blue rim light for premium contrast
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-2, 4, -5);
    scene.add(rimLight);

    // Top soft accent for liquid shine
    const topLight = new THREE.PointLight(0xfed7aa, 2.0, 6);
    topLight.position.set(0, 4, 0);
    scene.add(topLight);

    // 4. Root 3D Container
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const coffeeGroup = new THREE.Group();
    masterGroup.add(coffeeGroup);

    // 5. Materials
    // Matte dark charcoal ceramic with subtle pearl sheen
    const cupExteriorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1c1917,
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      reflectivity: 0.5,
    });

    // Glazed warm porcelain interior
    const cupInteriorMat = new THREE.MeshPhysicalMaterial({
      color: 0xfaf5f0,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
    });

    // Rich Espresso Liquid with reflections
    const coffeeLiquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x241208,
      roughness: 0.04,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transmission: 0.15,
      ior: 1.34,
    });

    // Roasted Coffee Bean Material
    const beanMat = new THREE.MeshStandardMaterial({
      color: 0x2e160a,
      roughness: 0.35,
      metalness: 0.08,
    });

    // Molecular Holographic Node Material
    const atomCoreMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0xf97316,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.3,
    });

    const atomNitrogenMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const bondLineMat = new THREE.LineBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.55,
      linewidth: 2,
    });

    // 6. Geometry: Designer Ceramic Coffee Cup
    // Outer Lathe Profile
    const outerProfile: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.9, 0),
      new THREE.Vector2(1.02, 0.08),
      new THREE.Vector2(1.22, 0.75),
      new THREE.Vector2(1.48, 1.7),
      new THREE.Vector2(1.5, 1.8),
    ];
    const outerGeom = new THREE.LatheGeometry(outerProfile, 64);
    const outerMesh = new THREE.Mesh(outerGeom, cupExteriorMat);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    outerMesh.position.y = -0.55;
    coffeeGroup.add(outerMesh);

    // Inner Lathe Profile
    const innerProfile: THREE.Vector2[] = [
      new THREE.Vector2(0, 0.12),
      new THREE.Vector2(0.82, 0.12),
      new THREE.Vector2(1.08, 0.75),
      new THREE.Vector2(1.36, 1.68),
      new THREE.Vector2(1.44, 1.79),
      new THREE.Vector2(1.5, 1.8),
    ];
    const innerGeom = new THREE.LatheGeometry(innerProfile, 64);
    const innerMesh = new THREE.Mesh(innerGeom, cupInteriorMat);
    innerMesh.position.y = -0.55;
    innerMesh.receiveShadow = true;
    coffeeGroup.add(innerMesh);

    // Handle (Ergonomic Torus)
    const handleGeom = new THREE.TorusGeometry(0.58, 0.13, 32, 48, Math.PI * 0.96);
    const handleMesh = new THREE.Mesh(handleGeom, cupExteriorMat);
    handleMesh.rotation.z = -Math.PI * 0.52;
    handleMesh.rotation.y = Math.PI / 2;
    handleMesh.position.set(1.52, 0.42, 0);
    handleMesh.castShadow = true;
    coffeeGroup.add(handleMesh);

    // Saucer / Piring
    const saucerPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1.3, 0),
      new THREE.Vector2(1.95, 0.1),
      new THREE.Vector2(2.35, 0.28),
      new THREE.Vector2(2.32, 0.32),
      new THREE.Vector2(1.9, 0.15),
      new THREE.Vector2(1.25, 0.05),
      new THREE.Vector2(0, 0.05),
    ];
    const saucerGeom = new THREE.LatheGeometry(saucerPoints, 64);
    const saucerMesh = new THREE.Mesh(saucerGeom, cupExteriorMat);
    saucerMesh.position.y = -0.6;
    saucerMesh.receiveShadow = true;
    saucerMesh.castShadow = true;
    coffeeGroup.add(saucerMesh);

    // 7. Coffee Liquid & Dynamic Procedural Latte Art Surface
    const liquidGeom = new THREE.CylinderGeometry(1.32, 1.32, 0.06, 64);
    const liquidMesh = new THREE.Mesh(liquidGeom, coffeeLiquidMat);
    liquidMesh.position.set(0, 1.02, 0);
    coffeeGroup.add(liquidMesh);

    // Latte Art Foam Canvas Texture
    const foamCanvas = document.createElement("canvas");
    foamCanvas.width = 512;
    foamCanvas.height = 512;
    const fctx = foamCanvas.getContext("2d");
    if (fctx) {
      // Base espresso dark gradient
      const bgGrad = fctx.createRadialGradient(256, 256, 40, 256, 256, 256);
      bgGrad.addColorStop(0, "#451a03");
      bgGrad.addColorStop(0.65, "#381404");
      bgGrad.addColorStop(1, "#200902");
      fctx.fillStyle = bgGrad;
      fctx.fillRect(0, 0, 512, 512);

      // Golden Crema Swirls
      fctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
      fctx.lineWidth = 14;
      fctx.beginPath();
      fctx.arc(256, 256, 170, 0, Math.PI * 2);
      fctx.stroke();

      fctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      fctx.lineWidth = 8;
      fctx.beginPath();
      fctx.arc(256, 256, 120, 0, Math.PI * 2);
      fctx.stroke();

      // Delicate Rosette / Heart Foam Core
      fctx.fillStyle = "rgba(254, 243, 199, 0.85)";
      fctx.beginPath();
      fctx.ellipse(256, 240, 48, 38, 0, 0, Math.PI * 2);
      fctx.fill();

      fctx.fillStyle = "rgba(253, 230, 138, 0.9)";
      fctx.beginPath();
      fctx.ellipse(256, 270, 32, 24, 0, 0, Math.PI * 2);
      fctx.fill();

      fctx.fillStyle = "rgba(254, 243, 199, 0.95)";
      fctx.beginPath();
      fctx.arc(256, 305, 16, 0, Math.PI * 2);
      fctx.fill();

      // Center Stem
      fctx.strokeStyle = "rgba(254, 243, 199, 0.9)";
      fctx.lineWidth = 6;
      fctx.beginPath();
      fctx.moveTo(256, 200);
      fctx.lineTo(256, 330);
      fctx.stroke();
    }
    const foamTex = new THREE.CanvasTexture(foamCanvas);
    const foamMat = new THREE.MeshStandardMaterial({
      map: foamTex,
      roughness: 0.4,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });
    const foamPlane = new THREE.Mesh(new THREE.CircleGeometry(1.3, 64), foamMat);
    foamPlane.rotation.x = -Math.PI / 2;
    foamPlane.position.set(0, 1.055, 0);
    coffeeGroup.add(foamPlane);

    // 8. 3D Roasted Coffee Beans with Split Center Groove
    const createRoastedBean = () => {
      const beanRoot = new THREE.Group();

      // Outer bean half-ellipsoid
      const beanGeom = new THREE.SphereGeometry(0.24, 32, 32);
      beanGeom.scale(1.4, 0.82, 1.0);
      const beanBody = new THREE.Mesh(beanGeom, beanMat);
      beanBody.castShadow = true;
      beanRoot.add(beanBody);

      // Deep roast center cleft
      const cleftGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 16);
      const cleftMat = new THREE.MeshBasicMaterial({ color: 0x120703 });
      const cleft = new THREE.Mesh(cleftGeom, cleftMat);
      cleft.rotation.z = Math.PI / 2;
      cleft.position.y = 0.17;
      beanRoot.add(cleft);

      return beanRoot;
    };

    const beans: { mesh: THREE.Group; radius: number; speed: number; yOffset: number; phase: number; rotSpeed: { x: number; y: number; z: number } }[] = [];
    const beanData = [
      { radius: 2.35, speed: 0.65, yOffset: 0.6, phase: 0, rot: { x: 0.015, y: 0.02, z: 0.01 } },
      { radius: 2.65, speed: -0.48, yOffset: 1.4, phase: Math.PI * 0.65, rot: { x: -0.01, y: 0.018, z: 0.012 } },
      { radius: 2.1, speed: 0.82, yOffset: -0.2, phase: Math.PI * 1.35, rot: { x: 0.02, y: -0.015, z: 0.008 } },
      { radius: 2.5, speed: 0.55, yOffset: -0.7, phase: Math.PI * 1.8, rot: { x: 0.012, y: 0.025, z: -0.01 } },
    ];

    beanData.forEach((d) => {
      const bean = createRoastedBean();
      scene.add(bean);
      beans.push({
        mesh: bean,
        radius: d.radius,
        speed: d.speed,
        yOffset: d.yOffset,
        phase: d.phase,
        rotSpeed: d.rot,
      });
    });

    // 9. Floating Holographic Caffeine Molecule Structure
    const moleculeGroup = new THREE.Group();
    moleculeGroup.position.set(0, 1.8, 0);
    scene.add(moleculeGroup);

    // Caffeine 6-ring & 5-ring coordinates
    const atomPositions: [number, number, number, boolean][] = [
      [-0.7, 0.4, 0, false],
      [0.0, 0.8, 0, true],
      [0.7, 0.4, 0, false],
      [0.7, -0.4, 0, true],
      [0.0, -0.8, 0, false],
      [-0.7, -0.4, 0, true],
      [1.4, 0.1, 0, false],
      [1.4, -0.6, 0, true],
    ];

    const atomMeshes: THREE.Mesh[] = [];
    atomPositions.forEach(([x, y, z, isNitrogen]) => {
      const geom = new THREE.SphereGeometry(isNitrogen ? 0.09 : 0.075, 20, 20);
      const mesh = new THREE.Mesh(geom, isNitrogen ? atomNitrogenMat : atomCoreMat);
      mesh.position.set(x * 0.7, y * 0.7, z * 0.7);
      moleculeGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    // Molecular connecting bonds
    const bondPairs = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [2, 6], [6, 7], [7, 3]
    ];

    bondPairs.forEach(([i1, i2]) => {
      const p1 = new THREE.Vector3(atomPositions[i1][0] * 0.7, atomPositions[i1][1] * 0.7, atomPositions[i1][2] * 0.7);
      const p2 = new THREE.Vector3(atomPositions[i2][0] * 0.7, atomPositions[i2][1] * 0.7, atomPositions[i2][2] * 0.7);
      const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geom, bondLineMat);
      moleculeGroup.add(line);
    });

    // 10. Atmospheric Rising Steam Simulation
    const steamCount = 36;
    const steamGeom = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    const steamVel: { vy: number; vx: number; vz: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3 + 0] = (Math.random() - 0.5) * 0.6;
      steamPos[i * 3 + 1] = 1.05 + Math.random() * 2.0;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      steamVel.push({
        vy: 0.01 + Math.random() * 0.015,
        vx: (Math.random() - 0.5) * 0.006,
        vz: (Math.random() - 0.5) * 0.006,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 60,
      });
    }

    steamGeom.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));

    // High quality soft smoke brush texture
    const sCanvas = document.createElement("canvas");
    sCanvas.width = 128;
    sCanvas.height = 128;
    const sctx = sCanvas.getContext("2d");
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, "rgba(255, 245, 235, 0.4)");
      grad.addColorStop(0.45, "rgba(255, 235, 215, 0.15)");
      grad.addColorStop(0.85, "rgba(255, 255, 255, 0.03)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const sTex = new THREE.CanvasTexture(sCanvas);

    const steamMat = new THREE.PointsMaterial({
      size: 0.95,
      map: sTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const steamCloud = new THREE.Points(steamGeom, steamMat);
    coffeeGroup.add(steamCloud);

    // 11. Interactive Mouse Parallax & Momentum
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotY = normX * 0.9;
        targetRotX = normY * 0.5;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 12. Main Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentScroll = scrollRef.current;

      // Scroll-driven dynamic 3D rotation & parallax
      const scrollInfluenceY = currentScroll * 0.0025;
      const scrollInfluenceTilt = Math.sin(currentScroll * 0.0015) * 0.2;

      // Inertial smoothing
      currentRotY += (targetRotY + scrollInfluenceY - currentRotY) * 0.05;
      currentRotX += (targetRotX + scrollInfluenceTilt - currentRotX) * 0.05;

      coffeeGroup.rotation.y = currentRotY;
      coffeeGroup.rotation.x = currentRotX + 0.12;

      // Gentle floating levitation
      coffeeGroup.position.y = Math.sin(elapsed * 1.4) * 0.07;

      // Orbiting coffee beans with 3D spin
      beans.forEach((b) => {
        const angle = elapsed * b.speed + b.phase;
        b.mesh.position.x = Math.cos(angle) * b.radius;
        b.mesh.position.z = Math.sin(angle) * b.radius;
        b.mesh.position.y = b.yOffset + Math.sin(elapsed * 2.2 + b.phase) * 0.18;
        b.mesh.rotation.x += b.rotSpeed.x;
        b.mesh.rotation.y += b.rotSpeed.y;
        b.mesh.rotation.z += b.rotSpeed.z;
      });

      // Holographic molecule rotation & hover
      moleculeGroup.rotation.y = -elapsed * 0.35 + currentRotY * 0.5;
      moleculeGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.18;
      moleculeGroup.position.y = 1.95 + Math.sin(elapsed * 1.8) * 0.12;

      // Pulse atom emission
      const pulse = 0.7 + Math.sin(elapsed * 3) * 0.3;
      atomCoreMat.emissiveIntensity = pulse;
      atomNitrogenMat.emissiveIntensity = pulse * 0.9;

      // Steam Particle lifecycle physics
      const posArray = steamGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < steamCount; i++) {
        steamVel[i].life += 1;
        posArray[i * 3 + 1] += steamVel[i].vy;
        posArray[i * 3 + 0] += steamVel[i].vx + Math.sin(elapsed * 2 + i) * 0.0015;
        posArray[i * 3 + 2] += steamVel[i].vz + Math.cos(elapsed * 2 + i) * 0.0015;

        // Reset particle at top of column
        if (posArray[i * 3 + 1] > 3.2 || steamVel[i].life > steamVel[i].maxLife) {
          posArray[i * 3 + 1] = 1.05;
          posArray[i * 3 + 0] = (Math.random() - 0.5) * 0.5;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          steamVel[i].life = 0;
        }
      }
      steamGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // 13. Auto Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 14. Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-[400px] sm:h-[460px] flex items-center justify-center ${className}`}>
      {/* 3D WebGL Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Klik & Geser untuk memutar cangkir 3D"
      />

      {/* Floating 3D Interaction Pill */}
      <div className="absolute top-2 left-2 sm:left-4 bg-white/95 backdrop-blur-md border border-gray-200/90 px-3.5 py-1.5 rounded-full shadow-sm text-[10px] font-black text-gray-800 pointer-events-none flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
        </span>
        <span>3D Studio • Putar dengan Kursor / Scroll</span>
      </div>
    </div>
  );
}
