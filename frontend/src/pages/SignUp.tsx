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
  IconShield,
  IconUser,
  IconPhone,
  IconCheck
} from '@tabler/icons-react';

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign up logic here
    console.log('Sign up:', formData);
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

      {/* Main Sign Up Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <IconShield className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">SECURE THREAD</span>
          </div>
          <p className="text-gray-300 text-sm">
            Join thousands of users who trust us with their security.
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-black mb-2">Create Account</h1>
            <p className="text-brand-gray text-sm">
              Fill in your information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-brand-black">
                  First Name
                </label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-brand-black">
                  Last Name
                </label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-brand-black">
                Email Address
              </label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-brand-black">
                Phone Number
              </label>
              <div className="relative">
                <IconPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-brand-black">
                  Password
                </label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors"
                  >
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-black">
                  Confirm Password
                </label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors"
                  >
                    {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and Marketing Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-accent bg-white border-gray-300 rounded focus:ring-accent focus:ring-2 mt-0.5"
                    required
                  />
                  {formData.agreeToTerms && (
                    <IconCheck className="absolute inset-0 w-4 h-4 text-accent pointer-events-none" />
                  )}
                </div>
                <span className="text-sm text-brand-gray group-hover:text-brand-black transition-colors">
                  I agree to the{' '}
                  <a href="#" className="text-accent hover:text-accent/80 transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-accent hover:text-accent/80 transition-colors">Privacy Policy</a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="agreeToMarketing"
                  checked={formData.agreeToMarketing}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent bg-white border-gray-300 rounded focus:ring-accent focus:ring-2 mt-0.5"
                />
                <span className="text-sm text-brand-gray group-hover:text-brand-black transition-colors">
                  I'd like to receive marketing communications and product updates
                </span>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 group mt-6"
            >
              <span>Create Account</span>
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
                <span className="px-4 bg-white/80 text-brand-gray">Or sign up with</span>
              </div>
            </div>
          </div>

          {/* Social Sign Up */}
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

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-gray">
              Already have an account?{' '}
              <a href="/signin" className="text-accent hover:text-accent/80 font-medium transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            By creating an account, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;