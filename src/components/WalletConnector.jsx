import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

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
          window.ethereum.selectedAddress || 
          (window.ethereum.providers && window.ethereum.providers.find(p => p.isMetaMask))) {
        return true
      }
      
      // Generic ethereum provider on mobile - could be MetaMask
      return true
    }
    
    return false
  }

  // Essential wallets only - compact configuration
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      color: '#f6851b',
      detect: detectMetaMask
    },
    {
      id: 'trust',
      name: 'Trust Wallet', 
      icon: '🛡️',
      color: '#3375bb',
      detect: () => typeof window.ethereum !== 'undefined' && window.ethereum.isTrust
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      icon: '🔵', 
      color: '#0052ff',
      detect: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
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
              // On mobile, direct user to open in MetaMask app
              const currentUrl = window.location.href
              const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
              toast.error('Please open this page in the MetaMask mobile app')
              setTimeout(() => {
                window.open(metamaskUrl, '_blank')
              }, 2000)
              return
            } else {
              throw new Error('MetaMask not installed')
            }
          }
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          provider = new ethers.BrowserProvider(window.ethereum)
          accounts = await provider.listAccounts()
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
            throw new Error('Trust Wallet not installed')
          }
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          provider = new ethers.BrowserProvider(window.ethereum)
          accounts = await provider.listAccounts()
          break

        case 'coinbase':
          if (!window.ethereum?.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not installed')
          }
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          provider = new ethers.BrowserProvider(window.ethereum)
          accounts = await provider.listAccounts()
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
                backgroundColor: isInstalled ? wallet.color + '10' : 'var(--surface-primary)',
                border: `2px solid ${isInstalled ? wallet.color + '40' : 'var(--border-primary)'}`,
                opacity: isConnecting ? 0.7 : 1
              }}
            >
              <div className="wallet-icon" style={{ color: wallet.color }}>
                {wallet.icon}
              </div>
              <div className="wallet-name">{wallet.name}</div>
              {isConnecting && <div className="loading-enhanced"></div>}
              {!isInstalled && <div className="install-badge">Install</div>}
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
        
        .install-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--warning-bg);
          color: var(--warning-text);
          font-size: 0.6875rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
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
