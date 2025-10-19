import React, { useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const FuturisticBackground = () => {
  const { isFuturistic } = useTheme()
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const particlesRef = useRef([])

  useEffect(() => {
    if (!isFuturistic) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system for futuristic effects
    const createParticles = () => {
      const particles = []
      const particleCount = 150

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: Math.random() * 2 + 0.5,
          size: Math.random() * 2 + 0.5,
          color: Math.random() > 0.5 ? '#00ff88' : '#44ff88',
          opacity: Math.random() * 0.8 + 0.2,
          life: Math.random() * 100 + 50,
          maxLife: Math.random() * 100 + 50
        })
      }
      return particles
    }

    // Digital rain effect
    const createRain = () => {
      const drops = []
      const dropCount = 80
      const chars = '01101001011010010110100101101001'

      for (let i = 0; i < dropCount; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          speed: Math.random() * 3 + 1,
          char: chars[Math.floor(Math.random() * chars.length)],
          opacity: Math.random() * 0.6 + 0.4
        })
      }
      return drops
    }

    // Neural network connections
    const createConnections = () => {
      const nodes = []
      const nodeCount = 40

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          connections: []
        })
      }
      return nodes
    }

    let particles = createParticles()
    let rainDrops = createRain()
    let nodes = createConnections()
    particlesRef.current = { particles, rainDrops, nodes }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw particle field
      particles.forEach((particle, index) => {
        // Update particle
        particle.x += particle.vx
        particle.y += particle.vy
        particle.z -= particle.vz
        particle.life--

        // Reset particle if it's too close or dead
        if (particle.z <= 0 || particle.life <= 0) {
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
          particle.z = 1000
          particle.life = particle.maxLife
        }

        // Calculate screen position (3D projection)
        const scale = 200 / (200 + particle.z)
        const x2d = particle.x * scale + canvas.width / 2
        const y2d = particle.y * scale + canvas.height / 2
        const size = particle.size * scale

        if (x2d > 0 && x2d < canvas.width && y2d > 0 && y2d < canvas.height) {
          ctx.save()
          ctx.globalAlpha = particle.opacity * (particle.life / particle.maxLife)
          ctx.fillStyle = particle.color
          ctx.shadowColor = particle.color
          ctx.shadowBlur = size * 2
          ctx.beginPath()
          ctx.arc(x2d, y2d, size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      // Draw digital rain
      rainDrops.forEach((drop) => {
        drop.y += drop.speed
        if (drop.y > canvas.height) {
          drop.y = -20
          drop.x = Math.random() * canvas.width
        }

        ctx.save()
        ctx.globalAlpha = drop.opacity
        ctx.fillStyle = '#00ff00'
        ctx.font = '14px monospace'
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 10
        ctx.fillText(drop.char, drop.x, drop.y)
        ctx.restore()
      })

      // Draw neural network
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges
        if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1
        if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1

        // Find nearby nodes and create connections
        nodes.forEach((otherNode) => {
          if (node !== otherNode) {
            const dx = node.x - otherNode.x
            const dy = node.y - otherNode.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 120) {
              ctx.save()
              ctx.globalAlpha = (120 - distance) / 120 * 0.3
              ctx.strokeStyle = '#44ff88'
              ctx.lineWidth = 0.5
              ctx.shadowColor = '#44ff88'
              ctx.shadowBlur = 3
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(otherNode.x, otherNode.y)
              ctx.stroke()
              ctx.restore()
            }
          }
        })

        // Draw node
        ctx.save()
        ctx.globalAlpha = 0.8
        ctx.fillStyle = '#00ff88'
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw holographic grid
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.strokeStyle = '#00ff44'
      ctx.lineWidth = 0.5
      ctx.shadowColor = '#00ff44'
      ctx.shadowBlur = 2

      // Vertical lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      ctx.restore()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isFuturistic])

  if (!isFuturistic) return null

  return (
    <canvas
      ref={canvasRef}
      className="futuristic-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0f 25%, #0f0f1a 50%, #1a1a2e 75%, #000000 100%)'
      }}
    />
  )
}

export default FuturisticBackground