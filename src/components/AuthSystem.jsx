import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'
import { useFirebase } from '../contexts/FirebaseContext'
import { walletAnalytics } from '../services/WalletAnalytics'
import WalletConnector from './WalletConnector'

const AuthSystem = ({ onAuth, onLogout, user }) => {
  const [authMode, setAuthMode] = useState('login') // Start with main auth options
  const [loading, setLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletData, setWalletData] = useState(null)
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    avatar: '',
    notifications: {
      trades: true,
      priceAlerts: true,
      news: false
    }
  })
  
  // Get Firebase functions
  const { 
    user: firebaseUser, 
    userProfile, 
    signup: firebaseSignup, 
    login: firebaseLogin, 
    logout: firebaseLogout,
    updateUserProfile,
    linkWalletAddress,
    checkUsernameAvailable,
    isAuthenticated,
    loading: firebaseLoading
  } = useFirebase()

  useEffect(() => {
    if (firebaseUser && userProfile) {
      setUserData(prev => ({
        ...prev,
        username: userProfile.username || '',
        email: userProfile.email || '',
        bio: userProfile.bio || '',
        walletAddress: userProfile.walletAddress || ''
      }))
    }
  }, [firebaseUser, userProfile])

  const signMessage = async (message, signer) => {
    try {
      const signature = await signer.signMessage(message)
      return signature
    } catch (error) {
      throw new Error('Failed to sign message: ' + error.message)
    }
  }

  // Wallet connection handler - provides immediate platform access
  const handleWalletConnect = async (connectedWalletData) => {
    const startTime = performance.now()
    setLoading(true)
    
    try {
      console.log('🔗 Authenticating with wallet...', {
        walletType: connectedWalletData.walletType,
        address: connectedWalletData.address?.slice(0, 6) + '...',
        chainId: connectedWalletData.chainId
      })
      
      // Create complete authentication data for immediate platform access
      const walletAuthData = {
        address: connectedWalletData.address,
        walletType: connectedWalletData.walletType,
        chainId: connectedWalletData.chainId,
        provider: connectedWalletData.provider,
        signer: connectedWalletData.signer,
        timestamp: Date.now(),
        isAuthenticated: true,
        authMethod: 'wallet', // Specify this is wallet-only authentication
        walletOnly: true, // This is crucial for the AccountManager to work correctly
        username: `Trader_${connectedWalletData.address.slice(-6).toUpperCase()}`, // Friendly default username
        firebaseUser: null, // No Firebase user - pure wallet auth
        canUpgradeAccount: true // Allow optional email upgrade later
      }
      
      const totalTime = performance.now() - startTime
      console.log(`🎉 Wallet authentication completed in ${Math.round(totalTime)}ms`)
      console.log('Auth data:', walletAuthData)
      
      // Emit performance metric
      if (window.emitPerformanceMetric) {
        window.emitPerformanceMetric('Wallet Authentication', totalTime, 'wallet');
      }
      
      toast.success(`Welcome! ${connectedWalletData.walletType} connected successfully. You now have full access to the platform!`)
      
      // Grant immediate complete access to all platform features
      console.log('Calling onAuth with wallet data...')
      onAuth(walletAuthData)
      console.log('onAuth called successfully')
      
      // Track wallet connection analytics (non-blocking)
      walletAnalytics.trackWalletConnection(connectedWalletData).catch(err => {
        console.warn('Analytics tracking failed (non-critical):', err)
      })
      
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error(`❌ Wallet authentication failed after ${Math.round(totalTime)}ms:`, error)
      console.error('Error details:', error.stack)
      toast.error(error.message || 'Failed to authenticate with wallet')
    } finally {
      setLoading(false)
    }
  }

  // Email-based authentication (requires wallet to be connected first)
  const handleEmailLogin = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      setAuthMode('wallet_connect')
      return
    }
    if (!userData.email || !userData.password) {
      toast.error('Please enter both email and password')
      return
    }

    setLoading(true)
    try {
      const result = await firebaseLogin(userData.email, userData.password)
      if (result.success) {
        onAuth({
          ...userProfile,
          isAuthenticated: true,
          firebaseUser: result.user
        })
      }
    } catch (error) {
      console.error('Email login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      setAuthMode('wallet_connect')
      return
    }

    console.log('🚀 Starting email signup process...');
    console.log('Current userData:', { 
      username: userData.username, 
      email: userData.email, 
      passwordLength: userData.password?.length 
    });

    if (!userData.username.trim()) {
      toast.error('Please enter a username')
      return
    }
    if (!userData.email || !userData.password) {
      toast.error('Please enter both email and password')
      return
    }
    if (userData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      console.log('📝 Checking username availability...');
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailable(userData.username)
      if (!isUsernameAvailable) {
        toast.error('Username is already taken')
        setLoading(false)
        return
      }
      console.log('✅ Username is available');

      console.log('🔥 Calling Firebase signup...');
      const result = await firebaseSignup(userData.email, userData.password, {
        username: userData.username,
        bio: userData.bio
      })
      
      console.log('📦 Firebase signup result:', result);
      
      if (result.success) {
        console.log('✅ Signup successful, now linking wallet...');
        
        // Auto-link wallet after successful signup
        try {
          const message = `Link wallet to DeFi Staking Platform\n\nUser: ${userData.username}\nWallet: ${walletData.address}\nTimestamp: ${Date.now()}`
          const signature = await signMessage(message, walletData.signer)
          
          // Link wallet to Firebase user account
          const linkResult = await linkWalletAddress(walletData.address)
          
          if (linkResult.success) {
            const authData = {
              ...result.user,
              address: walletData.address,
              walletType: walletData.walletType,
              chainId: walletData.chainId,
              signature,
              message,
              timestamp: Date.now(),
              isAuthenticated: true,
              firebaseUser: result.user,
              provider: walletData.provider,
              signer: walletData.signer,
              username: userData.username
            }
            
            onAuth(authData)
            toast.success('Account created and wallet linked successfully!')
          } else {
            throw new Error(linkResult.error || 'Failed to link wallet')
          }
        } catch (walletError) {
          console.error('Wallet linking after signup failed:', walletError)
          // Still authenticate the user even if wallet linking fails
          onAuth({
            ...userProfile,
            isAuthenticated: true,
            firebaseUser: result.user,
            username: userData.username
          })
          toast.error('Account created but wallet linking failed. You can link it later.')
        }
      } else {
        console.log('❌ Signup failed:', result.error);
        toast.error(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Email signup error:', error)
      toast.error('Unexpected error during signup. Please try again.');
    } finally {
      setLoading(false)
    }
  }

  const handleWalletLogin = async (walletData) => {
    if (!isAuthenticated) {
      toast.error('Please login with email first, then connect your wallet')
      return
    }

    const startTime = performance.now()
    setLoading(true)
    
    try {
      console.log('🔗 Starting wallet linking process...', {
        walletType: walletData.walletType,
        address: walletData.address?.slice(0, 6) + '...'
      })

      // Step 1: Create signature message
      const message = `Link wallet to DeFi Staking Platform\n\nUser: ${userProfile?.username}\nWallet: ${walletData.address}\nTimestamp: ${Date.now()}`
      
      const signStartTime = performance.now()
      const signature = await signMessage(message, walletData.signer)
      const signDuration = performance.now() - signStartTime
      console.log(`✅ Message signed (${Math.round(signDuration)}ms)`)
      
      // Step 2: Link wallet to Firebase user account
      const linkStartTime = performance.now()
      const result = await linkWalletAddress(walletData.address)
      const linkDuration = performance.now() - linkStartTime
      console.log(`✅ Wallet linking completed (${Math.round(linkDuration)}ms)`)
      
      if (result.success) {
        const authData = {
          ...userProfile,
          address: walletData.address,
          walletType: walletData.walletType,
          chainId: walletData.chainId,
          signature,
          message,
          timestamp: Date.now(),
          isAuthenticated: true,
          firebaseUser
        }
        
        onAuth(authData)
        const totalTime = performance.now() - startTime
        console.log(`🎉 Wallet linked successfully in ${Math.round(totalTime)}ms`)
        
        // Emit performance metric
        if (window.emitPerformanceMetric) {
          window.emitPerformanceMetric('Wallet Linking', totalTime, 'wallet');
        }
        
        toast.success('Wallet linked successfully!')
      } else {
        throw new Error(result.error || 'Failed to link wallet')
      }
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error(`❌ Wallet linking failed after ${Math.round(totalTime)}ms:`, error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to connect wallet'
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user'
      } else if (error.message.includes('already linked')) {
        errorMessage = 'This wallet is already linked to another account'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again'
      } else if (error.code === 4001) {
        errorMessage = 'Connection cancelled by user'
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletSignup = async (walletData) => {
    // Direct wallet authentication - no email required
    console.log('🚀 handleWalletSignup called with:', walletData)
    try {
      await handleWalletConnect(walletData)
    } catch (error) {
      console.error('❌ handleWalletSignup error:', error)
      throw error
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    
    try {
      const result = await updateUserProfile({
        username: userData.username,
        bio: userData.bio,
        notifications: userData.notifications
      })
      
      if (result.success) {
        onAuth({
          ...userProfile,
          ...userData,
          isAuthenticated: true,
          firebaseUser
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Track wallet disconnection if there's wallet data
      if (walletData?.address && walletData?.sessionId) {
        await walletAnalytics.trackWalletDisconnection(walletData.address, walletData.sessionId)
      }
      
      await firebaseLogout()
      onLogout()
      setUserData({
        username: '',
        email: '',
        password: '',
        bio: '',
        avatar: '',
        notifications: {
          trades: true,
          priceAlerts: true,
          news: false
        }
      })
      
      // Reset wallet data
      setWalletData(null)
      setWalletConnected(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isAuthenticated && authMode !== 'profile') {
    return (
      <div className="feature-card">
        <div className="text-center mb-6">
          <div className="feature-icon mx-auto mb-3" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
            👤
          </div>
          <h3 className="form-title">Welcome Back!</h3>
          <p className="text-secondary">{userProfile?.username || 'User'}</p>
        </div>

        <div className="responsive-grid-2 gap-4 mb-6">
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">Email</div>
            <div className="text-sm">
              {userProfile?.email || 'Not provided'}
            </div>
          </div>
          
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">Wallet</div>
            <div className="font-mono text-sm">
              {userProfile?.walletAddress 
                ? `${userProfile.walletAddress.slice(0, 6)}...${userProfile.walletAddress.slice(-4)}`
                : 'Not connected'
              }
            </div>
          </div>
        </div>

        {!userProfile?.walletAddress && (
          <div className="alert alert-warning mb-4">
            <div>
              <h4 className="font-semibold mb-2">🔗 Connect Your Wallet</h4>
              <p className="text-sm">
                Connect a wallet to access staking features and DeFi functionalities.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={() => setAuthMode('profile')}
            className="btn-enhanced btn-secondary-enhanced btn-medium flex-1"
          >
            ⚙️ Profile
          </button>
          {!userProfile?.walletAddress && (
            <button 
              onClick={() => setAuthMode('wallet_connect')}
              className="btn-enhanced btn-primary-enhanced btn-medium flex-1"
            >
              🔗 Connect Wallet
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="btn-enhanced btn-secondary-enhanced btn-medium flex-1"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    )
  }

  if (authMode === 'profile') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="section-header mb-8">
          <h2 className="section-title">User Profile</h2>
          <p className="section-subtitle">Manage your account settings and preferences</p>
        </div>

        <div className="form-section">
          <div className="text-center mb-6">
            <div className="feature-icon mx-auto mb-3" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
              👤
            </div>
            <div className="text-lg font-semibold">{userData.username || 'Anonymous'}</div>
            <div className="text-sm text-secondary font-mono">
              {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
            </div>
          </div>

          <div className="space-y-6">
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Username</label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                className="form-input-enhanced"
                placeholder="Your username"
              />
            </div>

            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Email</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                className="form-input-enhanced"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Bio</label>
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                className="form-input-enhanced"
                rows="3"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Notification Preferences</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={userData.notifications.trades}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, trades: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span>Trade notifications</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={userData.notifications.priceAlerts}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, priceAlerts: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span>Price alerts</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={userData.notifications.news}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, news: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span>News updates</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setAuthMode('login')}
              className="btn-enhanced btn-secondary-enhanced btn-medium"
            >
              ← Back
            </button>
            <button
              onClick={updateProfile}
              disabled={loading}
              className="btn-enhanced btn-primary-enhanced btn-medium flex-1"
            >
              {loading ? (
                <>
                  <div className="loading-enhanced"></div>
                  Updating...
                </>
              ) : (
                <>
                  💾 Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle wallet connection mode (first required step)
  if (authMode === 'wallet_connect') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="section-header mb-8">
          <h2 className="section-title">🔗 Connect Your Wallet</h2>
          <p className="section-subtitle">
            First, connect your wallet to access the DeFi platform. This is required before creating an account.
          </p>
        </div>

        <div className="form-section">
          {!walletConnected ? (
            <div className="text-center">
              <div className="feature-icon mx-auto mb-4" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                👛
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Wallet</h3>
              <p className="text-secondary mb-6">
                Select your preferred wallet to connect to the platform
              </p>

              <WalletConnector 
                onConnect={handleWalletConnect}
                onDisconnect={() => {}}
                currentWallet={null}
                account={null}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="feature-icon mx-auto mb-4" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                ✅
              </div>
              <h3 className="text-xl font-semibold mb-2">Wallet Connected!</h3>
              <p className="text-secondary mb-4">
                {walletData?.walletType} • {walletData?.address?.slice(0, 6)}...{walletData?.address?.slice(-4)}
              </p>
              <p className="text-sm text-secondary mb-6">
                Great! Now you can proceed to create an account or sign in.
              </p>
              
              <button
                onClick={() => setAuthMode('auth_options')}
                className="btn-enhanced btn-primary-enhanced btn-medium"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Authentication options (after wallet is connected)
  if (authMode === 'auth_options') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="section-header mb-8">
          <h2 className="section-title">Choose Authentication Method</h2>
          <p className="section-subtitle">
            Your wallet is connected! Now create an account or sign in to continue.
          </p>
        </div>

        {/* Wallet Status */}
        <div className="alert alert-success mb-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <h4 className="font-semibold mb-1">Wallet Connected</h4>
              <p className="text-sm">
                {walletData?.walletType} • {walletData?.address?.slice(0, 6)}...{walletData?.address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          <div className="feature-card">
            <div className="text-center">
              <div className="feature-icon mx-auto mb-4" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                ✨
              </div>
              <h3 className="text-xl font-semibold mb-2">Create New Account</h3>
              <p className="text-secondary mb-6">
                Create a new account with email and password, linked to your wallet
              </p>
              
              <button
                onClick={() => setAuthMode('email_signup')}
                className="btn-enhanced btn-primary-enhanced btn-medium"
              >
                ✨ Create Account
              </button>
            </div>
          </div>

          <div className="feature-card">
            <div className="text-center">
              <div className="feature-icon mx-auto mb-4" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                🔑
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign In</h3>
              <p className="text-secondary mb-6">
                Already have an account? Sign in with your email and password
              </p>
              
              <button
                onClick={() => setAuthMode('email_login')}
                className="btn-enhanced btn-secondary-enhanced btn-medium"
              >
                🔑 Sign In
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              setWalletConnected(false)
              setWalletData(null)
              setAuthMode('wallet_connect')
            }}
            className="btn-enhanced btn-secondary-enhanced btn-medium"
          >
            ← Change Wallet
          </button>
        </div>
      </div>
    )
  }

  // Email authentication forms
  if (authMode === 'email_login' || authMode === 'email_signup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="section-header mb-8">
          <h2 className="section-title">
            {authMode === 'email_login' ? 'Email Login' : 'Create Account'}
          </h2>
          <p className="section-subtitle">
            {authMode === 'email_login' 
              ? 'Sign in with your email and password'
              : 'Create a new account with email and password'
            }
          </p>
        </div>

        {/* Wallet Status */}
        <div className="alert alert-success mb-6">
          <div className="flex items-center gap-3">
            <div className="text-xl">✅</div>
            <div>
              <span className="text-sm font-medium">Wallet Connected: </span>
              <span className="text-sm font-mono">
                {walletData?.walletType} • {walletData?.address?.slice(0, 6)}...{walletData?.address?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="space-y-6">
            {authMode === 'email_signup' && (
              <div className="form-group-enhanced">
                <label className="form-label-enhanced">Username *</label>
                <input
                  type="text"
                  value={userData.username}
                  onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                  className="form-input-enhanced"
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}
            
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Email *</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                className="form-input-enhanced"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="form-group-enhanced">
              <label className="form-label-enhanced">Password *</label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                className="form-input-enhanced"
                placeholder="Enter your password"
                required
              />
            </div>

            {authMode === 'email_signup' && (
              <div className="form-group-enhanced">
                <label className="form-label-enhanced">Bio (Optional)</label>
                <textarea
                  value={userData.bio}
                  onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                  className="form-input-enhanced"
                  rows="2"
                  placeholder="Tell us about yourself..."
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setAuthMode('auth_options')}
              className="btn-enhanced btn-secondary-enhanced btn-medium"
            >
              ← Back
            </button>
            <button
              onClick={authMode === 'email_login' ? handleEmailLogin : handleEmailSignup}
              disabled={loading || firebaseLoading}
              className="btn-enhanced btn-primary-enhanced btn-medium flex-1"
            >
              {loading || firebaseLoading ? (
                <>
                  <div className="loading-enhanced"></div>
                  {authMode === 'email_login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {authMode === 'email_login' ? '🔑 Sign In' : '✨ Create Account'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="section-header mb-8">
        <h2 className="section-title">Welcome to BlaccManny DeFi Platform</h2>
        <p className="section-subtitle">
          Connect your wallet for instant access to all platform features
        </p>
      </div>

      {/* Direct Wallet Connection */}
      <div className="feature-card">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
            👛
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-secondary mb-6">
            Choose your wallet for instant access to all platform features
          </p>

          <WalletConnector 
            onConnect={handleWalletSignup}
            onDisconnect={() => {}}
            currentWallet={null}
            account={null}
          />
        </div>
      </div>
    </div>
  )
}

export default AuthSystem