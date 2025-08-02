import React, { useState } from 'react';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { 
  IconMail, 
  IconLock, 
  IconEye, 
  IconEyeOff, 
  IconBrandGithub, 
  IconBrandGoogle,
  IconArrowRight,
  IconShield
} from '@tabler/icons-react';

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic here
    console.log('Sign in:', { email, password, rememberMe });
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Ethereal Shadows Background */}
      <EtherealBackground 
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      {/* Main Sign In Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <IconShield className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">SECURE THREAD</span>
          </div>
          <p className="text-gray-300 text-sm">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-black mb-2">Sign In</h1>
            <p className="text-brand-gray text-sm">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-brand-black">
                Email Address
              </label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-gray" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-brand-black">
                Password
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-gray" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors"
                >
                  {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-accent bg-white border-gray-300 rounded focus:ring-accent focus:ring-2"
                />
                <span className="text-sm text-brand-gray">Remember me</span>
              </label>
              <a href="#" className="text-sm text-accent hover:text-accent/80 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 group"
            >
              <span>Sign In</span>
              <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-brand-gray">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Sign In */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50/70 transition-colors bg-white/50 backdrop-blur-sm">
              <IconBrandGoogle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-brand-black">Google</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50/70 transition-colors bg-white/50 backdrop-blur-sm">
              <IconBrandGithub className="h-5 w-5 text-brand-black" />
              <span className="text-sm font-medium text-brand-black">GitHub</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-gray">
              Don't have an account?{' '}
              <a href="/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">
                Sign up here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            By signing in, you agree to our{' '}
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;