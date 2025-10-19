import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast, Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { FirebaseProvider } from './contexts/FirebaseContext'
import ThemeToggle from './components/ThemeToggle'
import AnimatedBackground from './components/AnimatedBackground'
import FuturisticBackground from './components/FuturisticBackground'
import BlaccMannyLogo from './components/BlaccMannyLogo'
import WalletConnect from './components/WalletConnect'
import StakingInterface from './components/StakingInterface'
import StatsDisplay from './components/StatsDisplay'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import StakingPools from './components/StakingPools'
import PortfolioManager from './components/PortfolioManager'
import AuthSystem from './components/AuthSystem'
import AccountManager from './components/AccountManager'
import TestComponent from './components/TestComponent'
import CryptoMarketDashboard from './components/CryptoMarketDashboard'
import FirebaseDebug from './components/FirebaseDebug'
import PerformanceMonitor from './components/PerformanceMonitor'
import SecurityEducation from './components/SecurityEducation'
import './professional-theme.css'
import './modern-tech-theme.css'
import './futuristic-theme.css'
import './ui-enhancements.css'
import './mobile-responsive.css'

function App() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(null)
  const [contracts, setContracts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [authRestoring, setAuthRestoring] = useState(true) // Loading state for auth restoration
  const [activeTab, setActiveTab] = useState('market')
  const [user, setUser] = useState(null)
  const [walletType, setWalletType] = useState(null)

  // Contract addresses (will be populated from deployments.json)
  const CONTRACT_ADDRESSES = {
    StakingToken: '',
    RewardToken: '',
    TokenStaking: ''
  }

  useEffect(() => {
    // Load contract addresses from deployment
    loadContractAddresses()
    
    // Restore authentication state from localStorage first
    restoreAuthenticationState()
    
    // Check if wallet is already connected
    checkWalletConnection()
  }, [])

  const loadContractAddresses = async () => {
    try {
      const response = await fetch('/deployments.json')
      const deployments = await response.json()
      CONTRACT_ADDRESSES.StakingToken = deployments.contracts.StakingToken
      CONTRACT_ADDRESSES.RewardToken = deployments.contracts.RewardToken
      CONTRACT_ADDRESSES.TokenStaking = deployments.contracts.TokenStaking
    } catch (error) {
      console.log('No deployment file found, using default addresses')
    }
  }

  // Save authentication state to localStorage
  const saveAuthenticationState = (userData) => {
    try {
      const stateToSave = {
        user: userData,
        timestamp: Date.now(),
        walletType: userData?.walletType || walletType
      }
      localStorage.setItem('defi-staking-auth', JSON.stringify(stateToSave))
      console.log('✅ Authentication state saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save authentication state:', error)
    }
  }

  // Restore authentication state from localStorage
  const restoreAuthenticationState = async () => {
    try {
      console.log('🔄 Checking for saved authentication state...')
      const savedState = localStorage.getItem('defi-staking-auth')
      if (savedState) {
        const { user: savedUser, timestamp, walletType: savedWalletType } = JSON.parse(savedState)
        
        // Check if saved state is not too old (24 hours)
        const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        if (Date.now() - timestamp < MAX_AGE) {
          console.log('🔄 Restoring authentication state from localStorage:', savedUser)
          setUser(savedUser)
          setWalletType(savedWalletType)
          
          // If user has wallet info, try to reconnect
          if (savedUser?.address) {
            console.log('🔗 Attempting to reconnect wallet...')
            await reconnectWallet(savedUser)
          }
        } else {
          console.log('⏰ Saved authentication state expired, clearing...')
          localStorage.removeItem('defi-staking-auth')
        }
      } else {
        console.log('🆆 No saved authentication state found')
      }
    } catch (error) {
      console.error('❌ Failed to restore authentication state:', error)
      localStorage.removeItem('defi-staking-auth')
    } finally {
      setAuthRestoring(false) // Always stop loading
    }
  }

  // Reconnect wallet using saved user data
  const reconnectWallet = async (userData) => {
    if (!userData.address) return
    
    try {
      // Check if wallet is still connected
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        })
        
        if (accounts.length > 0 && accounts[0].toLowerCase() === userData.address.toLowerCase()) {
          console.log('✅ Wallet still connected, restoring provider and signer...')
          
          // Recreate provider and signer
          const web3Provider = new ethers.BrowserProvider(window.ethereum)
          const web3Signer = await web3Provider.getSigner()
          const network = await web3Provider.getNetwork()
          
          setProvider(web3Provider)
          setSigner(web3Signer)
          setAccount(userData.address)
          setChainId(Number(network.chainId))
          
          // Load contracts
          await loadContracts(web3Provider, web3Signer)
          
          console.log('✅ Wallet reconnected successfully!')
        } else {
          console.log('🔌 Wallet address changed or disconnected, clearing saved state')
          clearAuthenticationState()
        }
      }
    } catch (error) {
      console.error('❌ Failed to reconnect wallet:', error)
      clearAuthenticationState()
    }
  }

  // Clear authentication state
  const clearAuthenticationState = () => {
    localStorage.removeItem('defi-staking-auth')
    setUser(null)
    setProvider(null)
    setSigner(null)
    setAccount('')
    setChainId(null)
    setWalletType(null)
    setContracts(null)
    console.log('🗑️ Authentication state cleared')
  }

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        })
        if (accounts.length > 0) {
          await connectWallet()
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  const connectWallet = async (walletData = null) => {
    if (!walletData && typeof window.ethereum === 'undefined') {
      toast.error('MetaMask is not installed!')
      return
    }

    try {
      setLoading(true)
      
      let web3Provider, web3Signer, address, network
      
      if (walletData) {
        // Using enhanced wallet connector
        web3Provider = walletData.provider
        web3Signer = walletData.signer
        address = walletData.address
        network = { chainId: walletData.chainId }
        setWalletType(walletData.walletType)
      } else {
        // Legacy MetaMask connection
        await window.ethereum.request({
          method: 'eth_requestAccounts'
        })

        web3Provider = new ethers.BrowserProvider(window.ethereum)
        web3Signer = await web3Provider.getSigner()
        address = await web3Signer.getAddress()
        network = await web3Provider.getNetwork()
        setWalletType('metamask')
      }

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(address)
      setChainId(Number(network.chainId))

      // Load contracts
      await loadContracts(web3Provider, web3Signer)

      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const loadContracts = async (provider, signer) => {
    try {
      // Contract ABIs (simplified for demo)
      const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 value) returns (bool)",
        "function transfer(address to, uint256 value) returns (bool)",
        "function transferFrom(address from, address to, uint256 value) returns (bool)",
        "function mint(address to, uint256 amount) returns (bool)"
      ]

      const STAKING_ABI = [
        "function stakingToken() view returns (address)",
        "function rewardToken() view returns (address)",
        "function totalStaked() view returns (uint256)",
        "function rewardRate() view returns (uint256)",
        "function stakedBalance(address account) view returns (uint256)",
        "function earned(address account) view returns (uint256)",
        "function getStakingInfo(address account) view returns (uint256, uint256, uint256, bool)",
        "function stake(uint256 amount) payable",
        "function withdraw(uint256 amount)",
        "function claimReward()",
        "function exit()",
        "event Staked(address indexed user, uint256 amount)",
        "event Withdrawn(address indexed user, uint256 amount)",
        "event RewardPaid(address indexed user, uint256 reward)"
      ]

      const stakingToken = new ethers.Contract(
        CONTRACT_ADDRESSES.StakingToken,
        ERC20_ABI,
        signer
      )

      const rewardToken = new ethers.Contract(
        CONTRACT_ADDRESSES.RewardToken,
        ERC20_ABI,
        signer
      )

      const tokenStaking = new ethers.Contract(
        CONTRACT_ADDRESSES.TokenStaking,
        STAKING_ABI,
        signer
      )

      setContracts({
        stakingToken,
        rewardToken,
        tokenStaking
      })
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.error('Failed to load contracts')
    }
  }

  const handleAuthentication = (authData) => {
    console.log('🚀 App.jsx: handleAuthentication called with:', authData)
    console.log('Auth data isAuthenticated:', authData.isAuthenticated)
    console.log('Auth data authMethod:', authData.authMethod)
    
    setUser(authData)
    saveAuthenticationState(authData) // Save to localStorage
    console.log('✅ User state updated and saved')
    
    if (authData.provider && authData.signer) {
      console.log('🔗 Setting up provider and signer...')
      setProvider(authData.provider)
      setSigner(authData.signer)
      setAccount(authData.address)
      setChainId(authData.chainId)
      setWalletType(authData.walletType)
      // Load contracts after authentication
      loadContracts(authData.provider, authData.signer)
      console.log('✅ Provider and contracts loading initiated')
    }
    
    console.log('🎉 Authentication completed, user should now have access!')
  }

  const handleLogout = () => {
    clearAuthenticationState() // Use the centralized clear function
    toast.success('Logged out successfully')
  }

  const disconnectWallet = () => {
    clearAuthenticationState() // Use the centralized clear function
    toast.success('Wallet disconnected')
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('🔄 Accounts changed:', accounts)
        if (accounts.length === 0) {
          console.log('🔌 No accounts, clearing state')
          clearAuthenticationState()
        } else {
          console.log('🔗 Account changed, attempting reconnection')
          // Clear old state and reconnect with new account
          clearAuthenticationState()
          setTimeout(() => connectWallet(), 1000) // Small delay to ensure clean state
        }
      })

      window.ethereum.on('chainChanged', () => {
        console.log('🔗 Chain changed, reloading page')
        clearAuthenticationState() // Clear before reload
        window.location.reload()
      })
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  // Modern navigation icons
  const MarketIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )

  const PortfolioIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )

  const StakeIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )

  const PoolsIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )

  const AnalyticsIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  const AuthIcon = () => (
    <svg className="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )


  return (
    <ThemeProvider>
      <FirebaseProvider>
        <div className="app">
        <AnimatedBackground />
        <FuturisticBackground />
        
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
        
        {/* Top Navigation Bar with Logo and Theme Toggle */}
        <nav className="top-nav">
          <div className="nav-brand">
            <BlaccMannyLogo size="small" />
          </div>
          <div className="nav-actions">
            {user && user.isAuthenticated && (
              <button
                onClick={() => setActiveTab('account')}
                className={`btn btn-small ${activeTab === 'account' ? 'btn-primary' : 'btn-secondary'} mr-3`}
                title={user.walletOnly ? 'Create Account' : 'Account Settings'}
              >
                {user.walletOnly ? '✨ Create Account' : '📝 Account'}
              </button>
            )}
            <div className="theme-toggle-positioned">
              <ThemeToggle />
            </div>
          </div>
        </nav>
        
        <div className="container">
          {/* Main Header - Always Visible */}
          <header className="header-minimal">
            <h1 className="main-title">Advanced DeFi Ecosystem</h1>
            <p className="main-subtitle">
              Professional staking solutions with institutional-grade security and real-time yield optimization
            </p>
          </header>

          {authRestoring ? (
            /* Loading screen while checking authentication */
            <div className="auth-loading">
              <div className="feature-card text-center">
                <div className="loading-enhanced mx-auto mb-4" style={{width: '48px', height: '48px'}}></div>
                <h3 className="text-xl font-semibold mb-2">🔄 Restoring Session</h3>
                <p className="text-secondary">
                  Checking for saved authentication state...
                </p>
              </div>
            </div>
          ) : (() => {
            console.log('🔍 Auth check - user:', user)
            console.log('🔍 Auth check - user.isAuthenticated:', user?.isAuthenticated)
            const shouldShowAuth = !user || !user.isAuthenticated
            console.log('🔍 shouldShowAuth:', shouldShowAuth)
            return shouldShowAuth
          })() ? (
            <AuthSystem 
              onAuth={handleAuthentication}
              onLogout={handleLogout}
              user={user}
            />
          ) : (
            <>
              <div className="wallet-info">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div className="text-sm text-secondary">Welcome</div>
                    <div className="font-semibold">
                      {user?.username || 'Wallet User'}
                      {user?.walletOnly && <span className="text-xs text-yellow-500 ml-1">(Wallet Only)</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary">Wallet</div>
                    <div className="wallet-address">
                      {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary">Network</div>
                    <div className="font-medium">
                      {user?.chainId === 1337 ? 'Localhost' : `Chain ID: ${user?.chainId}`}
                    </div>
                  </div>
                  {user?.walletOnly && (
                    <div className="alert alert-warning py-2 px-3 text-xs">
                      <span className="text-yellow-600">⚠️ Wallet-only access</span>
                      <button
                        onClick={() => setActiveTab('account')}
                        className="text-yellow-700 underline ml-2"
                      >
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!user?.walletOnly && user?.email && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✅ Full Account
                    </span>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="btn btn-secondary btn-small"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="nav-tabs">
                <button
                  onClick={() => setActiveTab('market')}
                  className={`nav-tab ${activeTab === 'market' ? 'active' : ''}`}
                >
                  <MarketIcon />
                  Market
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
                >
                  <PortfolioIcon />
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('stake')}
                  className={`nav-tab ${activeTab === 'stake' ? 'active' : ''}`}
                >
                  <StakeIcon />
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab('pools')}
                  className={`nav-tab ${activeTab === 'pools' ? 'active' : ''}`}
                >
                  <PoolsIcon />
                  Pools
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                >
                  <AnalyticsIcon />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                >
                  🏭 Security
                </button>
              </div>

              {/* Account Manager */}
              {activeTab === 'account' && (
                <AccountManager 
                  user={user}
                  onAccountCreated={handleAuthentication}
                  onClose={() => setActiveTab('market')}
                />
              )}


              {/* Security Education */}
              {activeTab === 'security' && (
                <SecurityEducation user={user} />
              )}

              {/* Always show market and portfolio, only show staking features when contracts are loaded */}
              {activeTab === 'market' && (
                <CryptoMarketDashboard />
              )}
              
              {activeTab === 'portfolio' && (
                <PortfolioManager 
                  account={account}
                  user={user}
                />
              )}

              {contracts && (
                <>
                  {activeTab === 'stake' && (
                    <>
                      <StatsDisplay 
                        contracts={contracts}
                        account={account}
                      />
                      <StakingInterface 
                        contracts={contracts}
                        account={account}
                      />
                    </>
                  )}
                  
                  {activeTab === 'pools' && (
                    <StakingPools 
                      contracts={contracts}
                      account={account}
                    />
                  )}
                  
                  {activeTab === 'analytics' && (
                    <AnalyticsDashboard 
                      contracts={contracts}
                      account={account}
                    />
                  )}
                </>
              )}
              
              {!contracts && (activeTab === 'stake' || activeTab === 'pools' || activeTab === 'analytics') && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">🔗</div>
                  <h3 className="text-xl font-semibold mb-2">Connect to Local Network</h3>
                  <p className="text-secondary mb-6">Start your local Hardhat node to access staking features</p>
                  <div className="alert alert-info">
                    <div>
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <p className="text-sm mb-3">Run the following commands to start the local blockchain:</p>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                        npx hardhat node<br/>
                        npx hardhat run scripts/deploy.js --network localhost
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
        
      </FirebaseProvider>
    </ThemeProvider>
  )
}

export default App