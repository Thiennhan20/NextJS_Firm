'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Box } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Mesh } from 'three';

type SpinningProps = {
  args: [number, number, number];
  color: string;
  position?: [number, number, number];
};

function SpinningBox({ args, color, ...restProps }: SpinningProps) {
  const meshRef = useRef<Mesh>(null!);
  
  // Optimize animation with useFrame
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <Box args={args} {...restProps} ref={meshRef}>
      <meshStandardMaterial color={color} transparent opacity={0.6} roughness={0.4} metalness={0.8} />
    </Box>
  );
}

function SpinningSphere({ args, color, ...restProps }: SpinningProps) {
  const meshRef = useRef<Mesh>(null!);
  
  // Optimize animation with useFrame
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <Sphere args={args} {...restProps} ref={meshRef}>
      <meshStandardMaterial color={color} transparent opacity={0.6} roughness={0.4} metalness={0.8} />
    </Sphere>
  );
}

export default function ThreeBackground() {
  // Memoize colors array to prevent re-creation
  const colors = useMemo(() => ['#B8860B', '#FFD700', '#8B0000', '#A52A2A', '#000000'], []);
  
  // Memoize box positions and colors to prevent re-calculation
  const boxElements = useMemo(() => 
    Array.from({ length: 8 }).map((_, i) => ({
      key: `box-${i}`,
      position: [(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)]
    })), [colors]
  );
  
  // Memoize sphere positions and colors to prevent re-calculation
  const sphereElements = useMemo(() => 
    Array.from({ length: 6 }).map((_, i) => ({
      key: `sphere-${i}`,
      position: [(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)]
    })), [colors]
  );

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas 
        camera={{ position: [0, 0, 20], fov: 50 }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[15, 15, 15]} intensity={1.2} color="#FFD700" />
        <pointLight position={[-15, -15, 15]} intensity={1.2} color="#8B0000" />
        <directionalLight position={[10, 10, 10]} intensity={0.5} color="#B8860B" />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#A52A2A" />
        <Stars radius={150} depth={50} count={400} factor={2} saturation={0.6} fade />
        
        {boxElements.map(({ key, position, color }) => (
          <SpinningBox
            key={key}
            position={position}
            args={[1.0, 1.0, 1.0]}
            color={color}
          />
        ))}

        {sphereElements.map(({ key, position, color }) => (
          <SpinningSphere
            key={key}
            position={position}
            args={[0.6, 16, 16]}
            color={color}
          />
        ))}

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
