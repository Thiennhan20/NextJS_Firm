'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Box } from '@react-three/drei';
import { useRef } from 'react';
import { Mesh } from 'three';

type SpinningProps = {
  args: [number, number, number];
  color: string;
  position?: [number, number, number];
};

function SpinningBox({ args, color, ...restProps }: SpinningProps) {
  const meshRef = useRef<Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.001;
    }
  });
  return (
    <Box args={args} {...restProps} ref={meshRef}>
      <meshStandardMaterial color={color} transparent opacity={0.7} roughness={0.3} metalness={0.9} />
    </Box>
  );
}

function SpinningSphere({ args, color, ...restProps }: SpinningProps) {
  const meshRef = useRef<Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.0005;
      meshRef.current.rotation.y += 0.0005;
    }
  });
  return (
    <Sphere args={args} {...restProps} ref={meshRef}>
      <meshStandardMaterial color={color} transparent opacity={0.7} roughness={0.3} metalness={0.9} />
    </Sphere>
  );
}

export default function ThreeBackground() {
  const colors = ['#B8860B', '#FFD700', '#8B0000', '#A52A2A', '#000000']; // DarkGold, Gold, DarkRed, Brown, Black

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[15, 15, 15]} intensity={1.2} color="#FFD700" />
        <pointLight position={[-15, -15, 15]} intensity={1.2} color="#8B0000" />
        <directionalLight position={[10, 10, 10]} intensity={0.5} color="#B8860B" />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#A52A2A" />
        <Stars radius={200} depth={80} count={5000} factor={4} saturation={0.8} fade />
        
        {Array.from({ length: 40 }).map((_, i) => (
          <SpinningBox
            key={`box-${i}`}
            position={[(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30]}
            args={[1.2, 1.2, 1.2]}
            color={colors[Math.floor(Math.random() * colors.length)]}
          />
        ))}

        {Array.from({ length: 40 }).map((_, i) => (
          <SpinningSphere
            key={`sphere-${i}`}
            position={[(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30]}
            args={[0.8, 32, 32]}
            color={colors[Math.floor(Math.random() * colors.length)]}
          />
        ))}

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
