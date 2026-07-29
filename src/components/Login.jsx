import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  const handleEmailPasswordSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onLoginSuccess(data.user)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMode('verify')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onLoginSuccess(data.user)
    }
  }

  const resendCode = async () => {
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError(error.message)
    else setError('Code resent — check your email.')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400" />
          <span className="text-white font-medium">Leadflow</span>
        </div>

        {mode === 'verify' ? (
          <>
            <p className="text-gray-400 text-sm text-center mb-6">
              Enter the 6-digit code sent to {email}
            </p>
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 mb-3"
              >
                {loading ? 'Verifying...' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={resendCode}
                className="w-full text-purple-400 text-xs"
              >
                Resend code
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm text-center mb-6">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </p>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full bg-white text-gray-800 rounded-lg py-2 text-sm font-medium mb-4 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <form onSubmit={mode === 'signin' ? handleEmailPasswordSignIn : handleSignUp}>
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mb-5">
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-gray-400 text-xs text-center mt-4">
              {mode === 'signin' ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-purple-400">Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-purple-400">Sign in</button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Login