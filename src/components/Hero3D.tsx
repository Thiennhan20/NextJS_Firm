'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber' // Removed useThree
import { Environment, Float, PerspectiveCamera } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface FloatingPosterProps {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  image?: string
}

function FloatingPoster({ position, rotation, color, image = '' }: FloatingPosterProps) {
  const mesh = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (!hovered) {
      const t = state.clock.getElapsedTime()
      mesh.current.rotation.y = Math.sin(t / 1.5) / 6
      mesh.current.position.y = Math.sin(t / 1.5) / 10
    }
  })

  return (
    <Float 
      speed={1.5} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
      enabled={!hovered}
    >
      <mesh 
        ref={mesh} 
        position={position} 
        rotation={rotation}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.5, 2.2, 0.1]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          map={image ? new THREE.TextureLoader().load(image) : undefined}
        />
      </mesh>
    </Float>
  )
}

function Scene() {
  const controlsRef = useRef<OrbitControls>(null);
  
  useFrame((state) => {
    if (!state.gl.domElement.matches(':hover') && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[0, 5, 0]}
        angle={0.5}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <FloatingPoster 
        position={[-2, 0, 0]} 
        rotation={[0, -0.2, 0]} 
        color="#ff6b6b"
        image="https://picsum.photos/400/250"
      />
      <FloatingPoster 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]} 
        color="#4ecdc4"
        image="https://picsum.photos/400/250"
      />
      <FloatingPoster 
        position={[2, 0, 0]} 
        rotation={[0, 0.2, 0]} 
        color="#ffd93d"
        image="https://picsum.photos/400/250"
      />
      <Environment preset="city" />
    </>
  );
}

export default function Hero3D() {
  return (
    <div className="h-screen relative">
      <Canvas className="absolute inset-0">
        <Scene />
      </Canvas>
      
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
            Welcome to Movie World
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-300"
          >
            Discover amazing movies in stunning 3D
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-red-600/20"
            >
              Explore Movies
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-lg font-semibold backdrop-blur-sm"
            >
              Watch Trailer
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}