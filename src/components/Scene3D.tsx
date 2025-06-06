'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

function MoviePoster({ 
  position = [0, 0, 0] as [number, number, number], 
  rotation = [0, 0, 0] as [number, number, number] 
}) {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    mesh.current.rotation.y = Math.sin(t / 1.5) / 6
    mesh.current.position.y = Math.sin(t / 1.5) / 10
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={mesh} position={position} rotation={rotation}>
        <boxGeometry args={[1.5, 2.2, 0.1]} />
        <meshStandardMaterial color="#ff6b6b" metalness={0.5} roughness={0.2} />
      </mesh>
    </Float>
  )
}

export default function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <MoviePoster position={[-2, 0, 0]} rotation={[0, -0.2, 0]} />
      <MoviePoster position={[0, 0, 0]} rotation={[0, 0, 0]} />
      <MoviePoster position={[2, 0, 0]} rotation={[0, 0.2, 0]} />
      <Environment preset="city" />
    </>
  )
} 