import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup ? { name, email, password } : { email, password };
      
      const response = await axios.post(`http://localhost:3001${endpoint}`, payload);

      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isSignup ? 'sign up' : 'login'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]">
      {/* Background blobs for glassmorphism */}
      <div className="absolute w-[500px] h-[500px] bg-whatsapp-light/30 rounded-full blur-[100px] top-[-10%] left-[-10%]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[100px] bottom-[-10%] right-[-5%]" />

      <div className="glass-dark sm:w-full sm:max-w-md p-8 rounded-3xl z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white">
            WhatsApp <span className="text-whatsapp-light">CRM</span>
          </h2>
          <p className="text-gray-300 mt-2">
            {isSignup ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-black/20 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-light transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-black/20 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-light transition-all"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              minLength={isSignup ? 8 : undefined}
              className="w-full bg-black/20 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-light transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-whatsapp-dark hover:bg-whatsapp-darker text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-whatsapp-dark/30 transform hover:-translate-y-0.5"
          >
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-whatsapp-light hover:text-white text-sm transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
