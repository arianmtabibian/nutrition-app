import React, { useState, useCallback, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight, Target, Zap, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkServerHealth, testRegistrationEndpoint } from '../utils/serverHealthCheck';

const EnhancedRegister: React.FC = () => {
  const navigate = useNavigate();
  const { register, user, logout } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [serverStatus, setServerStatus] = useState<{ isHealthy: boolean; message: string } | null>(null);
  const [checkingServer, setCheckingServer] = useState(false);
  const [showLoggedInMessage, setShowLoggedInMessage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Simplified form validation - Only validate on submit for better performance
  const validateForm = useCallback(() => {
    const errors = {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Basic required field validation
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';

    // Simple length validation
    if (formData.first_name.trim() && formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }
    if (formData.last_name.trim() && formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }
    if (formData.username.trim() && formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Basic email validation
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password match validation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.values(errors).every(error => error === '');
  }, [formData]);

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const performRegistration = async () => {
    setError('');
    setRegistrationStatus('');

    // Check if user is already logged in
    if (user) {
      setShowLoggedInMessage(true);
      return;
    }

    // Validate form - only on submit
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setRegistrationStatus('Connecting to server...');
    
    try {
      // Add progress updates with retry awareness
      const progressUpdates = [
        { delay: 2000, message: 'Creating your account...' },
        { delay: 5000, message: 'Setting up your profile...' },
        { delay: 10000, message: 'Almost done, finalizing registration...' },
        { delay: 15000, message: 'Server is responding slowly, please wait...' },
        { delay: 20000, message: 'Still working on it, almost there...' }
      ];

      progressUpdates.forEach(({ delay, message }) => {
        setTimeout(() => {
          if (loading) setRegistrationStatus(message);
        }, delay);
      });

      await register(
        formData.email,
        formData.password,
        formData.first_name,
        formData.last_name,
        formData.username
      );
      
      setRegistrationStatus('Account created successfully! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate('/onboarding');
      }, 1000);
      
    } catch (error: any) {
      console.error('Registration error in form:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Registration failed';
      
      if (errorMessage.includes('timed out')) {
        errorMessage = 'Registration timed out. The server is responding slowly. Please try again in a moment.';
      } else if (errorMessage.includes('CORS_ERROR')) {
        errorMessage = 'Connection issue. Please check your internet connection and try again.';
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      }
      
      setError(errorMessage);
      setRegistrationStatus('');
    } finally {
      setLoading(false);
      setRegistrationStatus('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performRegistration();
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement social login
    alert(`${provider} login coming soon!`);
  };

  const handleServerHealthCheck = async () => {
    setCheckingServer(true);
    setServerStatus(null);
    
    try {
      const healthResult = await checkServerHealth();
      const registrationResult = await testRegistrationEndpoint();
      
      setServerStatus({
        isHealthy: healthResult.isHealthy && registrationResult.isAccessible,
        message: `Health: ${healthResult.message}. Registration: ${registrationResult.message}`
      });
    } catch (error) {
      setServerStatus({
        isHealthy: false,
        message: 'Failed to check server status'
      });
    } finally {
      setCheckingServer(false);
    }
  };

  // Check if user is already logged in when component mounts
  useEffect(() => {
    if (user) {
      setShowLoggedInMessage(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500 rounded-full"></div>
        <div className="absolute top-32 right-20 w-20 h-20 bg-red-500 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-orange-400 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-red-400 rounded-full"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="absolute top-8 left-8 p-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-3 mb-6 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                NutriTrack
              </h1>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Start your nutrition journey today</p>
            
            {/* Show message if user is already logged in */}
            {user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm mb-3">
                  You are currently logged in as <strong>{user.email}</strong>. 
                  To create a new account, please log out first.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log Out & Create New Account
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => handleSocialLogin('Google')}
              className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 hover:border-orange-300"
            >
              <div className="w-5 h-5 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('Apple')}
              className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 hover:border-orange-300"
            >
              <div className="w-5 h-5 bg-black rounded-full"></div>
              <span className="text-gray-700 font-medium">Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-r from-orange-50 via-white to-red-50 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 border border-white/20 ${user ? 'opacity-50 pointer-events-none' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, first_name: e.target.value }));
                        clearFieldError('first_name');
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.first_name 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                      }`}
                      placeholder="John"
                      required
                    />
                  </div>
                  {fieldErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.first_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, last_name: e.target.value }));
                        clearFieldError('last_name');
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.last_name 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                      }`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  {fieldErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, username: e.target.value }));
                      clearFieldError('username');
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.username 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                    }`}
                    placeholder="johndoe123"
                    required
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      clearFieldError('email');
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                    }`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, password: e.target.value }));
                      clearFieldError('password');
                    }}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.password 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      clearFieldError('confirmPassword');
                    }}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500 hover:border-gray-400'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      {error}
                    </div>
                    {(error.includes('timed out') || error.includes('slow')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          performRegistration();
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{registrationStatus || 'Creating Account...'}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Server Status Check */}
          <div className="text-center mt-4">
            <button
              onClick={handleServerHealthCheck}
              disabled={checkingServer}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 mx-auto"
            >
              {checkingServer ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking Server...</span>
                </>
              ) : (
                <>
                  {serverStatus?.isHealthy ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span>Check Server Status</span>
                </>
              )}
            </button>
            
            {serverStatus && (
              <div className={`mt-2 p-2 rounded-lg text-xs ${
                serverStatus.isHealthy 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {serverStatus.message}
              </div>
            )}
          </div>

          {/* Help Message */}
          {loading && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Registration taking longer than expected? The server might be starting up. Please wait...
              </p>
            </div>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By creating an account, you agree to our{' '}
            <button type="button" className="text-orange-600 hover:underline bg-transparent border-none p-0 cursor-pointer">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="text-orange-600 hover:underline bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRegister;
