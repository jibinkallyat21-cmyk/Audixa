import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

const LINE_DISTANCE = 1.4 // world units; connecting lines only draw within this range

function buildTier(count, radius, color, opacity, spread) {
  const positions = new Float32Array(count * 3)
  const c = new THREE.Color(color)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z
  }
  return { positions, color: c, radius, opacity }
}

function buildConnectingLines(positions, maxDistance) {
  const points = []
  const count = positions.length / 3
  for (let i = 0; i < count; i++) {
    const ax = positions[i * 3]
    const ay = positions[i * 3 + 1]
    const az = positions[i * 3 + 2]
    for (let j = i + 1; j < count; j++) {
      const bx = positions[j * 3]
      const by = positions[j * 3 + 1]
      const bz = positions[j * 3 + 2]
      const d = Math.hypot(ax - bx, ay - by, az - bz)
      if (d < maxDistance) {
        points.push(ax, ay, az, bx, by, bz)
      }
    }
  }
  return new Float32Array(points)
}

export default function ParticleField({ mouseRef, reduced = false }) {
  const groupRef = useRef()
  const whiteGroupRef = useRef()
  const amberGroupRef = useRef()
  const redGroupRef = useRef()

  const total = reduced ? 120 : 300
  const whiteCount = Math.round(total * 0.8)
  const amberCount = Math.round(total * 0.15)
  const redCount = total - whiteCount - amberCount
  const spread = { x: 11, y: 9, z: 6 }

  const tiers = useMemo(
    () => ({
      white: buildTier(whiteCount, 0.8, '#ffffff', 0.55, spread),
      amber: buildTier(amberCount, 1.2, '#F59E0B', 0.3, spread),
      red: buildTier(redCount, 1.5, '#E8323C', 0.5, spread),
    }),
    [whiteCount, amberCount, redCount],
  )

  // Rigid-body rotation preserves relative distances, so connecting lines
  // can be computed once at mount instead of every frame (O(n^2) avoided).
  const linePositions = useMemo(() => {
    if (reduced) return null
    const merged = new Float32Array((whiteCount + amberCount + redCount) * 3)
    merged.set(tiers.white.positions, 0)
    merged.set(tiers.amber.positions, whiteCount * 3)
    merged.set(tiers.red.positions, (whiteCount + amberCount) * 3)
    return buildConnectingLines(merged, LINE_DISTANCE)
  }, [tiers, reduced, whiteCount, amberCount, redCount])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.y += delta * 0.025
    group.rotation.x += delta * 0.004
    if (whiteGroupRef.current) whiteGroupRef.current.rotation.y += delta * 0.01
    if (amberGroupRef.current) amberGroupRef.current.rotation.y += delta * 0.006
    if (redGroupRef.current) redGroupRef.current.rotation.y += delta * 0.003

    if (!reduced) {
      const { x, y } = mouseRef.current
      group.position.x = THREE.MathUtils.lerp(group.position.x, x * 0.4, 0.05)
      group.position.y = THREE.MathUtils.lerp(group.position.y, -y * 0.4, 0.05)
    }
  })

  return (
    <group ref={groupRef}>
      {linePositions && linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
        </lineSegments>
      )}

      <group ref={whiteGroupRef}>
        <Points positions={tiers.white.positions} stride={3}>
          <PointMaterial
            transparent
            color={tiers.white.color}
            size={tiers.white.radius * 0.04}
            sizeAttenuation
            depthWrite={false}
            opacity={tiers.white.opacity}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>

      <group ref={amberGroupRef}>
        <Points positions={tiers.amber.positions} stride={3}>
          <PointMaterial
            transparent
            color={tiers.amber.color}
            size={tiers.amber.radius * 0.04}
            sizeAttenuation
            depthWrite={false}
            opacity={tiers.amber.opacity}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>

      <group ref={redGroupRef}>
        <Points positions={tiers.red.positions} stride={3}>
          <PointMaterial
            transparent
            color={tiers.red.color}
            size={tiers.red.radius * 0.04}
            sizeAttenuation
            depthWrite={false}
            opacity={tiers.red.opacity}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>
    </group>
  )
}
