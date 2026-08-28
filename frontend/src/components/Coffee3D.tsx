import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Coffee3DProps {
  className?: string;
}

export default function Coffee3D({ className = '' }: Coffee3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.2, 5.5);
    camera.lookAt(0, 0.3, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Coffee Group
    const coffeeGroup = new THREE.Group();
    scene.add(coffeeGroup);

    // --- MATERIALS ---
    // Ceramic Mug Material (Clean Warm Off-White)
    const ceramicMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f5,
      roughness: 0.15,
      metalness: 0.05,
    });

    // Dark Coffee Liquid Material
    const coffeeLiquidMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.2,
      metalness: 0.1,
    });

    // Saucer Material
    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeea,
      roughness: 0.2,
      metalness: 0.05,
    });

    // Accent Rim / Brand color ring
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange brand color
      roughness: 0.3,
    });

    // --- GEOMETRIES ---
    // 1. Saucer Plate
    const saucerGeo = new THREE.CylinderGeometry(1.8, 1.4, 0.12, 48);
    const saucer = new THREE.Mesh(saucerGeo, saucerMaterial);
    saucer.position.y = -0.7;
    saucer.receiveShadow = true;
    saucer.castShadow = true;
    coffeeGroup.add(saucer);

    // 2. Coffee Mug Body (Tapered Cylinder)
    const mugGeo = new THREE.CylinderGeometry(1.1, 0.9, 1.6, 48, 1, true);
    const mug = new THREE.Mesh(mugGeo, ceramicMaterial);
    mug.position.y = 0.15;
    mug.castShadow = true;
    mug.receiveShadow = true;
    coffeeGroup.add(mug);

    // Mug Bottom Cap
    const mugBottomGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 48);
    const mugBottom = new THREE.Mesh(mugBottomGeo, ceramicMaterial);
    mugBottom.position.y = -0.63;
    mugBottom.receiveShadow = true;
    coffeeGroup.add(mugBottom);

    // Mug Inner Bottom
    const innerBottomGeo = new THREE.CircleGeometry(0.88, 48);
    const innerBottom = new THREE.Mesh(innerBottomGeo, ceramicMaterial);
    innerBottom.rotation.x = -Math.PI / 2;
    innerBottom.position.y = -0.55;
    coffeeGroup.add(innerBottom);

    // 3. Mug Handle (Torus)
    const handleGeo = new THREE.TorusGeometry(0.5, 0.12, 24, 36, Math.PI * 1.15);
    const handle = new THREE.Mesh(handleGeo, ceramicMaterial);
    handle.position.set(1.1, 0.15, 0);
    handle.rotation.z = -Math.PI / 2 + 0.2;
    handle.rotation.y = Math.PI / 2;
    handle.castShadow = true;
    coffeeGroup.add(handle);

    // 4. Coffee Liquid Surface
    const liquidGeo = new THREE.CircleGeometry(1.0, 48);
    const liquid = new THREE.Mesh(liquidGeo, coffeeLiquidMaterial);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.y = 0.78;
    coffeeGroup.add(liquid);

    // 5. Latte Art / Foam Ring
    const foamGeo = new THREE.RingGeometry(0.3, 0.65, 32);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xd9ba9b, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.rotation.x = -Math.PI / 2;
    foam.position.y = 0.785;
    coffeeGroup.add(foam);

    // 6. Accent Brand Ring on Mug
    const ringGeo = new THREE.TorusGeometry(1.02, 0.015, 16, 48);
    const ring = new THREE.Mesh(ringGeo, accentMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.85;
    coffeeGroup.add(ring);

    // --- STEAM PARTICLES ---
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleScales = new Float32Array(particleCount);
    const particleOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 0.8;
      particlePositions[i * 3 + 1] = 0.9 + Math.random() * 1.8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      particleSpeeds[i] = 0.008 + Math.random() * 0.012;
      particleScales[i] = 0.1 + Math.random() * 0.15;
      particleOffsets[i] = Math.random() * Math.PI * 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle Texture creation dynamically via Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.5, 'rgba(240, 240, 240, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.6,
      map: particleTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const steamParticles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(steamParticles);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(4, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const warmPoint = new THREE.PointLight(0xf97316, 1.5, 6);
    warmPoint.position.set(-2, 3, 2);
    scene.add(warmPoint);

    const softFill = new THREE.PointLight(0x38bdf8, 0.8, 6);
    softFill.position.set(3, -1, -2);
    scene.add(softFill);

    // --- INTERACTIVE MOUSE ROTATION ---
    let targetRotationX = 0.2;
    let targetRotationY = 0.4;
    let currentRotationX = 0.2;
    let currentRotationY = 0.4;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.8 + 0.4;
      targetRotationX = -y * 0.4 + 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp rotation towards mouse
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      // Subtle float / breathing
      coffeeGroup.rotation.x = currentRotationX + Math.sin(elapsedTime * 1.5) * 0.03;
      coffeeGroup.rotation.y = currentRotationY + Math.cos(elapsedTime * 0.8) * 0.05;
      coffeeGroup.position.y = Math.sin(elapsedTime * 2) * 0.06;

      // Animate Steam
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Move upward
        positions[i * 3 + 1] += particleSpeeds[i];
        // Slight organic swirl
        positions[i * 3] += Math.sin(elapsedTime * 2 + particleOffsets[i]) * 0.003;
        positions[i * 3 + 2] += Math.cos(elapsedTime * 2 + particleOffsets[i]) * 0.003;

        // Reset if too high
        if (positions[i * 3 + 1] > 2.8) {
          positions[i * 3 + 1] = 0.85;
          positions[i * 3] = (Math.random() - 0.5) * 0.7;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[340px] relative cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}
