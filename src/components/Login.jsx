import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from './Logo'

function Login({ onLoginSuccess, onBack }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'verify'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', score: 0 }

    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', score }
    if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', score }
    return { label: 'Strong', color: 'bg-green-500', score }
  }

  const passwordsMatch = confirmPassword === '' || password === confirmPassword
  const passwordStrength = getPasswordStrength(password)

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

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-sm relative shadow-2xl shadow-black/50">

        <div className="h-5 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1 transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to home
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-white font-semibold text-lg">Leadflow</span>
          </div>
          <p className="text-gray-400 text-sm text-center">
            {mode === 'verify'
              ? `Enter the code sent to ${email}`
              : mode === 'signin'
              ? 'Welcome back — sign in to continue'
              : "Let's get you set up"}
          </p>
        </div>

        {mode === 'verify' ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm text-center tracking-widest outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
            />

            {error && <p className="text-red-400 text-xs -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-[0.98] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 shadow-lg shadow-purple-600/25 transition-all"
            >
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>

            <button
              type="button"
              onClick={resendCode}
              className="text-purple-400 hover:text-purple-300 text-xs transition"
            >
              Resend code
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-800 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 -my-1">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {mode === 'signin' ? (
              <form onSubmit={handleEmailPasswordSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                {error && <p className="text-red-400 text-xs -mt-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-[0.98] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 shadow-lg shadow-purple-600/25 transition-all"
                >
                  {loading ? 'Please wait...' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-gray-500"
                  />

                  {password && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-14 text-right">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className={`w-full bg-gray-800/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none border transition-all placeholder:text-gray-500 ${
                      passwordsMatch
                        ? 'border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
                        : 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                    }`}
                  />
                  {!passwordsMatch && (
                    <p className="text-red-400 text-xs">Passwords do not match</p>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs -mt-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-[0.98] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 shadow-lg shadow-purple-600/25 transition-all"
                >
                  {loading ? 'Please wait...' : 'Create account'}
                </button>
              </form>
            )}

            <p className="text-gray-400 text-xs text-center">
              {mode === 'signin' ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-purple-400 hover:text-purple-300 transition">Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-purple-400 hover:text-purple-300 transition">Sign in</button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login