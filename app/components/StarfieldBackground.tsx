"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "./ThemeProvider";

export default function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolved: theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    function createParticles(count: number, color: number, size: number) {
      const geometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      const material = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity: isDark ? 0.7 : 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Points(geometry, material);
    }

    const countCyan = isDark ? 2800 : 2000;
    const countBlue = isDark ? 1800 : 1200;
    const countWhite = isDark ? 600 : 400;
    const sizeCyan = isDark ? 0.025 : 0.02;
    const sizeBlue = isDark ? 0.018 : 0.015;
    const sizeWhite = isDark ? 0.012 : 0.01;

    const particlesCyan = createParticles(countCyan, 0xd97757, sizeCyan);
    const particlesBlue = createParticles(countBlue, 0xe8957a, sizeBlue);
    const particlesWhite = createParticles(countWhite, isDark ? 0xffffff : 0x666666, sizeWhite);
    scene.add(particlesCyan);
    scene.add(particlesBlue);
    scene.add(particlesWhite);

    let mouseX = 0, mouseY = 0;
    let targetCamX = 0, targetCamY = 0;
    let clickBurst = 0;

    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    const handleClick = () => { clickBurst = 1.0; };
    window.addEventListener("mousedown", handleClick);

    const clock = new THREE.Clock();
    let rafId: number;

    function updateParticles(particles: THREE.Points, speed: number) {
      const positions = (particles.geometry.attributes.position as THREE.BufferAttribute).array;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] += speed;
        if (positions[i] > 5) {
          positions[i] -= 25;
          positions[i - 1] = (Math.random() - 0.5) * 20;
          positions[i - 2] = (Math.random() - 0.5) * 20;
        }
        if (positions[i] < -20) {
          positions[i] += 25;
          positions[i - 1] = (Math.random() - 0.5) * 20;
          positions[i - 2] = (Math.random() - 0.5) * 20;
        }
      }
      (particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      clickBurst *= 0.92;

      updateParticles(particlesCyan, (-0.003 + clickBurst * 0.04) * dt * 60);
      updateParticles(particlesBlue, (-0.004 + clickBurst * 0.05) * dt * 60);
      updateParticles(particlesWhite, (-0.002 + clickBurst * 0.03) * dt * 60);

      targetCamX = -mouseX * 0.5;
      targetCamY = mouseY * 0.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      camera.fov = 75 + clickBurst * 35;
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", handleResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [isDark]);

  return <div ref={mountRef} className="absolute inset-0 overflow-hidden" />;
}
