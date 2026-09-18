import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

const PARTICLE_COUNT = 200

export default function ParticleField({ mouseRef }) {
  const groupRef = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const white = new THREE.Color('#ffffff')
    const cyan = new THREE.Color('#7dd3fc')

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 11
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6

      const mixed = white.clone().lerp(cyan, Math.random() * 0.8)
      col[i * 3] = mixed.r
      col[i * 3 + 1] = mixed.g
      col[i * 3 + 2] = mixed.b
    }
    return [pos, col]
  }, [])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.y += delta * 0.025
    group.rotation.x += delta * 0.004

    const { x, y } = mouseRef.current
    group.position.x = THREE.MathUtils.lerp(group.position.x, x * 0.5, 0.03)
    group.position.y = THREE.MathUtils.lerp(group.position.y, -y * 0.5, 0.03)
  })

  return (
    <group ref={groupRef}>
      <Points positions={positions} colors={colors} stride={3}>
        <PointMaterial
          transparent
          vertexColors
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}
