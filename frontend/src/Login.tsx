import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup ? { name, email, password } : { email, password };
      const response = await axios.post(`http://localhost:3001${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isSignup ? 'create account' : 'sign in'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 bg-white/15 backdrop-blur rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">WhatsApp CRM</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Reach your customers<br />where they already are.
          </h2>
          <p className="mt-4 text-emerald-100 text-lg leading-relaxed max-w-md">
            Send personalized broadcasts, manage contacts, and track delivery — all from one beautiful platform.
          </p>
          <div className="mt-8 flex gap-6">
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-sm text-emerald-200 mt-0.5">Messages sent</p>
            </div>
            <div>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-emerald-200 mt-0.5">Delivery rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-emerald-200 mt-0.5">Templates</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-emerald-300 relative z-10">© 2024 WhatsApp CRM</p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight">WhatsApp CRM</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {isSignup ? 'Get started with a free account' : 'Sign in to your account to continue'}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            {isSignup && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                  placeholder="Jane Smith" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                placeholder="you@company.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required minLength={isSignup ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2 shadow-sm shadow-emerald-600/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSignup ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
