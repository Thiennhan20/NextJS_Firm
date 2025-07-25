'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ComingSoon() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const mountNode = mountRef.current as HTMLDivElement | null;
    if (mountNode) {
      mountNode.appendChild(renderer.domElement);
    }

    // Create stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      stars.rotation.x += 0.0005;
      stars.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (
        mountNode &&
        renderer.domElement.parentNode === mountNode
      ) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="movie-world-container">
      {/* 3D Canvas Background */}
      <div ref={mountRef} className="three-canvas" />
      
      {/* Content Box */}
      <div className="content-box">
        <h1 className="title">MovieWorld</h1>
        <h2 className="subtitle">Coming Soon</h2>
        
        <p className="description">
          Embark on a cinematic journey soon!
        </p>
        
        <button className="notify-button">
          Notify Me
        </button>
        
        <div className="emoji">🎥</div>
      </div>

      <style jsx>{`
        .movie-world-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #0a0520, #2a1b4a, #1c1133);
          padding: 0.5rem;
        }
        
        .three-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          opacity: 0.5;
        }
        
        .content-box {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: clamp(0.8rem, 3vw, 1rem);
          border-radius: 14px;
          background: rgba(10, 5, 32, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 6px 24px rgba(255, 138, 0, 0.2), 0 0 8px rgba(229, 46, 113, 0.25);
          width: clamp(200px, 85%, 340px);
          transition: transform 0.3s ease;
        }
        
        .content-box:hover {
          transform: translateY(-4px);
        }
        
        .title {
          font-size: clamp(1.8rem, 5.5vw, 2.2rem);
          font-weight: 800;
          font-family: 'Inter', sans-serif;
          color: #ffaa00;
          margin-bottom: 0.3rem;
          text-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
        }
        
        .subtitle {
          font-size: clamp(1.2rem, 4vw, 1.4rem);
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: #ff5e8a;
          margin-bottom: 1rem;
          letter-spacing: 0.01em;
        }
        
        .description {
          font-size: clamp(0.8rem, 2.5vw, 0.9rem);
          font-family: 'Inter', sans-serif;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1.2rem;
          line-height: 1.4;
          opacity: 0.95;
        }
        
        .notify-button {
          display: block;
          width: clamp(120px, 80%, 200px);
          padding: clamp(0.5rem, 2vw, 0.6rem);
          border-radius: 25px;
          background: linear-gradient(90deg, #ffaa00, #ff5e8a);
          color: white;
          font-weight: 600;
          font-size: clamp(0.8rem, 2.5vw, 0.9rem);
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          border: none;
          margin: 0 auto 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 3px 12px rgba(255, 94, 138, 0.4);
        }
        
        .notify-button:hover {
          transform: scale(1.04);
          box-shadow: 0 5px 18px rgba(255, 94, 138, 0.6);
          background: linear-gradient(90deg, #ff5e8a, #ffaa00);
        }
        
        .emoji {
          font-size: clamp(1.5rem, 4vw, 1.8rem);
          animation: float 2.8s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(255, 170, 0, 0.5));
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .content-box {
            padding: clamp(0.6rem, 2.5vw, 0.8rem);
            width: clamp(180px, 90%, 300px);
          }
          
          .title {
            font-size: clamp(1.6rem, 5vw, 1.9rem);
          }
          
          .subtitle {
            font-size: clamp(1rem, 3.5vw, 1.2rem);
          }
        }
        
        @media (max-height: 500px) {
          .content-box {
            padding: clamp(0.5rem, 2vw, 0.7rem);
            width: clamp(160px, 85%, 260px);
          }
          
          .title {
            font-size: clamp(1.4rem, 4.5vw, 1.6rem);
          }
          
          .subtitle {
            font-size: clamp(0.9rem, 3vw, 1.1rem);
          }
          
          .description {
            font-size: clamp(0.7rem, 2vw, 0.8rem);
            margin-bottom: 0.8rem;
          }
          
          .notify-button {
            padding: clamp(0.4rem, 1.5vw, 0.5rem);
            font-size: clamp(0.7rem, 2vw, 0.8rem);
          }
          
          .emoji {
            font-size: clamp(1.3rem, 3.5vw, 1.5rem);
          }
        }
        
        @media (orientation: landscape) and (max-height: 500px) {
          .content-box {
            padding: clamp(0.5rem, 2vw, 0.6rem);
            width: clamp(160px, 80%, 280px);
          }
        }
      `}</style>
    </div>
  );
}