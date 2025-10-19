import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

// SVG Wallet Logo Components
const TrustWalletIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 8v8c0 7.732 5.943 12.2 12 14 6.057-1.8 12-6.268 12-14V8L16 2z" fill="#3375bb"/>
    <path d="M16 6L8 10v6c0 4.97 3.83 7.84 8 9 4.17-1.16 8-4.03 8-9v-6L16 6z" fill="white"/>
  </svg>
)

const CoinbaseIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#0052ff"/>
    <path d="M16 24c-4.411 0-8-3.589-8-8s3.589-8 8-8c2.52 0 4.77 1.17 6.24 3h-3.03C18.38 10.39 17.25 10 16 10c-3.309 0-6 2.691-6 6s2.691 6 6 6c1.25 0 2.38-0.39 3.21-1h3.03C20.77 22.83 18.52 24 16 24z" fill="white"/>
  </svg>
)

const WalletConnector = ({ onConnect, onDisconnect, currentWallet, account }) => {
  const [connecting, setConnecting] = useState(null)
  const [installedWallets, setInstalledWallets] = useState({})

  // Mobile detection utility
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Enhanced wallet detection for mobile compatibility
  const detectMetaMask = () => {
    if (typeof window.ethereum === 'undefined') return false
    
    // Desktop detection
    if (window.ethereum.isMetaMask) return true
    
    // Mobile detection - check user agent for MetaMask
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    // Check if we're in MetaMask mobile browser
    if (userAgent.includes('MetaMaskMobile')) return true
    
    // Mobile detection - MetaMask mobile injects ethereum but may not have isMetaMask
    if (isMobile() && typeof window.ethereum !== 'undefined') {
      // Additional checks for MetaMask mobile
      if (window.ethereum._metamask || 
          window.ethereum.selectedAddress !== undefined || 
          (window.ethereum.providers && window.ethereum.providers.find(p => p.isMetaMask))) {
        return true
      }
      
      // Check if ethereum provider exists and we can request accounts (likely MetaMask)
      try {
        if (window.ethereum.request) {
          return true
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    return false
  }

  // Essential wallets only - compact configuration with real logos
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊', // MetaMask fox logo
      color: '#f6851b',
      detect: detectMetaMask
    },
    {
      id: 'trust',
      name: 'Trust Wallet', 
      icon: 'trust-svg', // Will be rendered as TrustWalletIcon
      color: '#3375bb',
      detect: () => {
        if (typeof window.ethereum === 'undefined') return false
        if (window.ethereum.isTrust) return true
        // Check for Trust Wallet on mobile
        if (isMobile() && window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
          return true // Could be Trust Wallet
        }
        return false
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      icon: 'coinbase-svg', // Will be rendered as CoinbaseIcon
      color: '#0052ff',
      detect: () => {
        if (typeof window.ethereum === 'undefined') return false
        if (window.ethereum.isCoinbaseWallet) return true
        // Additional check for Coinbase Wallet SDK
        if (window.ethereum.isCoinbaseBrowser || window.coinbaseWalletExtension) return true
        return false
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱', // Mobile/connection icon for WalletConnect
      color: '#3b99fc', 
      detect: () => true
    }
  ]

  useEffect(() => {
    checkInstalledWallets()
  }, [])

  const checkInstalledWallets = () => {
    const installed = {}
    wallets.forEach(wallet => {
      installed[wallet.id] = wallet.detect()
    })
    setInstalledWallets(installed)
  }

  const connectWallet = async (walletId) => {
    setConnecting(walletId)
    
    try {
      let provider = null
      let accounts = []

      switch (walletId) {
        case 'metamask':
          if (!detectMetaMask()) {
            if (isMobile()) {
              // On mobile, try to open MetaMask app or fallback to install
              const currentUrl = window.location.href
              const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
              
              toast.success('Opening MetaMask app...', { duration: 2000 })
              
              // Try to open MetaMask app directly
              window.location.href = metamaskUrl
              
              // Fallback after delay if app doesn't open
              setTimeout(() => {
                if (document.hasFocus()) {
                  toast.error('MetaMask app not found. Please install MetaMask.')
                  window.open('https://metamask.io/download/', '_blank')
                }
              }, 3000)
              return
            } else {
              // Desktop - direct to install page
              window.open('https://metamask.io/download/', '_blank')
              toast.error('Please install MetaMask extension first')
              return
            }
          }
          
          // Try to connect if detected
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
            provider = new ethers.BrowserProvider(window.ethereum)
            accounts = await provider.listAccounts()
          } catch (error) {
            if (error.code === 4001) {
              toast.error('Connection cancelled by user')
              return
            }
            throw error
          }
          break

        case 'mobile-metamask':
          // Mobile MetaMask deep link
          const currentUrl = window.location.href
          const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
          
          toast.success('Opening MetaMask app...', { duration: 3000 })
          
          // Try to open MetaMask app
          window.location.href = metamaskUrl
          
          // Fallback - open in new tab after delay
          setTimeout(() => {
            if (document.hasFocus()) {
              // If still focused, MetaMask didn't open, show instructions
              toast.error('Please install MetaMask mobile app first')
              window.open('https://metamask.io/download/', '_blank')
            }
          }, 3000)
          
          return

        case 'binance':
          if (!window.BinanceChain) {
            throw new Error('Binance Wallet not installed')
          }
          await window.BinanceChain.request({ method: 'eth_requestAccounts' })
          provider = new ethers.BrowserProvider(window.BinanceChain)
          accounts = await provider.listAccounts()
          break

        case 'trust':
          if (!window.ethereum?.isTrust) {
            if (isMobile()) {
              // Try Trust Wallet deep link
              const trustUrl = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`
              toast.success('Opening Trust Wallet...', { duration: 2000 })
              window.location.href = trustUrl
              
              setTimeout(() => {
                if (document.hasFocus()) {
                  toast.error('Trust Wallet not found. Please install Trust Wallet.')
                  window.open('https://trustwallet.com/', '_blank')
                }
              }, 3000)
              return
            } else {
              window.open('https://trustwallet.com/', '_blank')
              toast.error('Please install Trust Wallet first')
              return
            }
          }
          
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
            provider = new ethers.BrowserProvider(window.ethereum)
            accounts = await provider.listAccounts()
          } catch (error) {
            if (error.code === 4001) {
              toast.error('Connection cancelled by user')
              return
            }
            throw error
          }
          break

        case 'coinbase':
          if (!window.ethereum?.isCoinbaseWallet) {
            if (isMobile()) {
              // Try Coinbase Wallet deep link
              const coinbaseUrl = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`
              toast.success('Opening Coinbase Wallet...', { duration: 2000 })
              window.location.href = coinbaseUrl
              
              setTimeout(() => {
                if (document.hasFocus()) {
                  toast.error('Coinbase Wallet not found. Please install Coinbase Wallet.')
                  window.open('https://wallet.coinbase.com/', '_blank')
                }
              }, 3000)
              return
            } else {
              window.open('https://wallet.coinbase.com/', '_blank')
              toast.error('Please install Coinbase Wallet first')
              return
            }
          }
          
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
            provider = new ethers.BrowserProvider(window.ethereum)
            accounts = await provider.listAccounts()
          } catch (error) {
            if (error.code === 4001) {
              toast.error('Connection cancelled by user')
              return
            }
            throw error
          }
          break

        case 'walletconnect':
          // WalletConnect integration would require additional setup
          toast.error('WalletConnect integration coming soon!')
          return

        case 'phantom':
          if (!window.solana?.isPhantom) {
            throw new Error('Phantom Wallet not installed')
          }
          const resp = await window.solana.connect()
          toast.success(`Connected to Phantom: ${resp.publicKey.toString()}`)
          return

        default:
          throw new Error('Wallet not supported')
      }

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      onConnect({
        provider,
        signer,
        address,
        chainId: Number(network.chainId),
        walletType: walletId
      })

      toast.success(`Connected to ${wallets.find(w => w.id === walletId)?.name}!`)
      
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast.error(error.message || 'Failed to connect wallet')
    } finally {
      setConnecting(null)
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
    toast.success('Wallet disconnected')
  }

  const openWalletDownload = (wallet) => {
    window.open(wallet.downloadUrl, '_blank', 'noopener,noreferrer')
  }


  if (currentWallet && account) {

  return (
    <div className="wallet-connector-container">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="form-title">Wallet Connected</h3>
        </div>
        
        <div className="stat-card-enhanced mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label-enhanced">Wallet Type</span>
            <span className="text-gradient-primary font-semibold">
              {wallets.find(w => w.id === currentWallet)?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label-enhanced">Address</span>
            <span className="font-mono text-sm">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        </div>

        <button 
          onClick={disconnectWallet}
          className="btn-enhanced btn-secondary-enhanced btn-large w-full"
        >
          Disconnect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="compact-wallet-connector">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Wallet</h3>
      </div>
      
      <div className="wallet-grid">
        {wallets.map(wallet => {
          const isInstalled = installedWallets[wallet.id]
          const isConnecting = connecting === wallet.id
          
          return (
            <button
              key={wallet.id}
              onClick={() => {
                if (isInstalled) {
                  connectWallet(wallet.id)
                } else {
                  window.open(
                    wallet.id === 'metamask' ? 'https://metamask.io/download/' :
                    wallet.id === 'trust' ? 'https://trustwallet.com/' :
                    wallet.id === 'coinbase' ? 'https://wallet.coinbase.com/' :
                    'https://walletconnect.com/', 
                    '_blank'
                  )
                }
              }}
              disabled={isConnecting}
              className="wallet-card"
              style={{
                backgroundColor: wallet.color + '10',
                border: `2px solid ${wallet.color + '40'}`,
                opacity: isConnecting ? 0.7 : 1
              }}
            >
              <div className="wallet-icon" style={{ color: wallet.color }}>
                {wallet.icon === 'trust-svg' ? (
                  <TrustWalletIcon size={32} />
                ) : wallet.icon === 'coinbase-svg' ? (
                  <CoinbaseIcon size={32} />
                ) : (
                  wallet.icon
                )}
              </div>
              <div className="wallet-name">{wallet.name}</div>
              {isConnecting && <div className="loading-enhanced"></div>}
            </button>
          )
        })}
      </div>
      
      <style jsx>{`
        .compact-wallet-connector {
          max-width: 400px;
          margin: 0 auto;
          padding: var(--space-4);
        }
        
        .wallet-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
        }
        
        .wallet-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          position: relative;
          min-height: 100px;
          cursor: pointer;
        }
        
        .wallet-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--glow-primary);
        }
        
        .wallet-card:active {
          transform: translateY(0);
        }
        
        .wallet-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2);
        }
        
        .wallet-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
        }
        
        
        .loading-enhanced {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 16px;
          height: 16px;
        }
        
        @media (max-width: 480px) {
          .compact-wallet-connector {
            padding: var(--space-3);
          }
          
          .wallet-grid {
            gap: var(--space-2);
          }
          
          .wallet-card {
            padding: var(--space-3);
            min-height: 90px;
          }
          
          .wallet-icon {
            font-size: 1.75rem;
            margin-bottom: var(--space-1);
          }
          
          .wallet-name {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  )
}

export default WalletConnector
