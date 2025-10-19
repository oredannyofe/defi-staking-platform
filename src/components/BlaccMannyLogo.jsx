import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

const BlaccMannyLogo = ({ size = 'large' }) => {
  const { theme } = useTheme()
  
  const sizes = {
    small: { width: 32, height: 32, fontSize: '1.1rem' },
    medium: { width: 60, height: 60, fontSize: '1.5rem' },
    large: { width: 80, height: 80, fontSize: '2rem' }
  }
  
  const logoSize = sizes[size] || sizes.large
  
  // Enhanced theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'futuristic':
        return {
          gradient: ['#ffffff', '#e0e0e0', '#c0c0c0'], // White to gray
          fillGradient: ['rgba(255, 255, 255, 0.15)', 'rgba(200, 200, 200, 0.25)'],
          diamondFill: '#ffffff',
          letterStroke: '#ffffff',
          textGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)',
          subtitleColor: '#ffffff',
          glowColor: '#ffffff'
        }
      case 'dark':
        return {
          gradient: ['#ffffff', '#e5e7eb', '#d1d5db'],
          fillGradient: ['rgba(255, 255, 255, 0.1)', 'rgba(229, 231, 235, 0.2)'],
          diamondFill: '#ffffff',
          letterStroke: '#ffffff',
          textGradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%)',
          subtitleColor: '#d1d5db',
          glowColor: '#ffffff'
        }
      default: // light theme
        return {
          gradient: ['#1f2937', '#374151', '#4b5563'],
          fillGradient: ['rgba(31, 41, 55, 0.08)', 'rgba(75, 85, 99, 0.15)'],
          diamondFill: '#ffffff',
          letterStroke: '#1f2937',
          textGradient: 'linear-gradient(135deg, #000000 0%, #1f2937 50%, #374151 100%)',
          subtitleColor: '#6b7280',
          glowColor: '#1f2937'
        }
    }
  }
  
  const colors = getThemeColors()
  
  return (
    <div className="blaccmanny-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      {/* Animated Logo SVG */}
      <div className="logo-container" style={{ 
        position: 'relative',
        filter: theme === 'futuristic' ? `drop-shadow(0 0 10px ${colors.glowColor})` : 'none'
      }}>
        <svg 
          width={logoSize.width} 
          height={logoSize.height} 
          viewBox="0 0 100 100" 
          className="logo-svg"
          style={{ 
            filter: theme === 'futuristic' ? `drop-shadow(0 0 5px ${colors.glowColor}40)` : 'none'
          }}
        >
          {/* Outer ring with rotation animation */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="20 10"
            className="logo-outer-ring"
          />
          
          {/* Inner hexagon */}
          <polygon
            points="50,15 75,30 75,60 50,75 25,60 25,30"
            fill="url(#logoFillGradient)"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            className="logo-hexagon"
          />
          
          {/* Center diamond */}
          <polygon
            points="50,25 65,40 50,55 35,40"
            fill={colors.diamondFill}
            className="logo-diamond"
            style={{
              filter: theme === 'futuristic' ? `drop-shadow(0 0 3px ${colors.glowColor})` : 'none'
            }}
          />
          
          {/* Center dot */}
          <circle
            cx="50"
            cy="40"
            r="3"
            fill={theme === 'futuristic' ? colors.glowColor : (theme === 'light' ? '#1f2937' : colors.glowColor)}
            className="logo-center-dot"
            style={{
              filter: theme === 'futuristic' ? `drop-shadow(0 0 2px ${colors.glowColor})` : 'none'
            }}
          />
          
          {/* Letter "B" stylized */}
          <path
            d="M45 60 L45 75 L55 75 L60 70 L60 67.5 L55 65 L60 62.5 L60 60 L45 60 M48 63 L55 63 M48 67.5 L55 67.5 M48 72 L55 72"
            stroke={colors.letterStroke}
            strokeWidth={theme === 'futuristic' ? '2.5' : '2'}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="logo-letter"
            style={{
              filter: theme === 'futuristic' ? `drop-shadow(0 0 3px ${colors.letterStroke})` : 'none'
            }}
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="50%" stopColor={colors.gradient[1]} />
              <stop offset="100%" stopColor={colors.gradient[2]} />
            </linearGradient>
            <radialGradient id="logoFillGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors.fillGradient[0]} />
              <stop offset="100%" stopColor={colors.fillGradient[1]} />
            </radialGradient>
          </defs>
        </svg>
        
        {/* Floating particles animation */}
        <div className="logo-particles">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                position: 'absolute',
                width: theme === 'futuristic' ? '4px' : '3px',
                height: theme === 'futuristic' ? '4px' : '3px',
                background: theme === 'futuristic' ? colors.glowColor : 'var(--brand-accent)',
                borderRadius: '50%',
                animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                top: `${20 + i * 10}%`,
                left: `${15 + i * 12}%`,
                boxShadow: theme === 'futuristic' ? `0 0 6px ${colors.glowColor}` : 'none',
                filter: theme === 'futuristic' ? `drop-shadow(0 0 2px ${colors.glowColor})` : 'none'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Logo Text */}
      {(size === 'large' || size === 'small') && (
        <div className="logo-text">
          <div 
            className="logo-title"
            style={{
              fontSize: logoSize.fontSize,
              fontWeight: '800',
              background: colors.textGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              animation: size === 'large' ? 'titleSlide 1.2s ease-out' : 'none',
              whiteSpace: 'nowrap',
              textShadow: theme === 'futuristic' ? `0 0 10px ${colors.glowColor}40, 0 1px 3px rgba(0,0,0,0.8)` : 'none',
              filter: theme === 'futuristic' ? `drop-shadow(0 0 8px ${colors.glowColor}60)` : 'none',
              fontFamily: theme === 'futuristic' ? 'var(--font-futuristic-display), Orbitron, monospace' : 'inherit'
            }}
          >
            BlaccManny
          </div>
          {size === 'large' && (
            <div 
              className="logo-subtitle"
              style={{
                fontSize: 'var(--text-sm)',
                color: colors.subtitleColor,
                fontWeight: theme === 'futuristic' ? '600' : '500',
                letterSpacing: theme === 'futuristic' ? '0.15em' : '0.1em',
                textTransform: 'uppercase',
                marginTop: 'var(--space-1)',
                animation: 'subtitleFade 1.5s ease-out 0.3s both',
                textShadow: theme === 'futuristic' ? `0 0 8px ${colors.subtitleColor}60, 0 1px 2px rgba(0,0,0,0.9)` : 'none',
                filter: theme === 'futuristic' ? `drop-shadow(0 0 4px ${colors.subtitleColor}40)` : 'none',
                fontFamily: theme === 'futuristic' ? 'var(--font-futuristic-body), Rajdhani, sans-serif' : 'inherit'
              }}
            >
              DeFi Staking Platform
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BlaccMannyLogo