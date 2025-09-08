import React from 'react';
import { ArrowRight, Target, Sparkles, TrendingUp, BarChart3, User, Zap, Trophy, Activity, Heart, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      
      {/* Hero Section with Background Graphics */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500 rounded-full"></div>
          <div className="absolute top-32 right-20 w-20 h-20 bg-red-500 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-orange-400 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-red-400 rounded-full"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16">
          
          {/* Hero Content */}
          <div className="text-center mb-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-3 mb-8 hover:opacity-80 transition-opacity"
          >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
              NutriTrack
            </h1>
          </button>
          
            <h2 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Every Meal
              <span className="block text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text">
                Matters
            </span>
          </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The easiest nutrition tracking app on the market. 
              AI-powered simplicity meets powerful insights.
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 mb-10 text-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Goals Achieved</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">1M+</div>
                  <div className="text-sm text-gray-600">Meals Tracked</div>
                </div>
              </div>
            </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
                className="group px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
                className="px-10 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
        </div>
      </div>


      {/* Three Steps with Enhanced Graphics */}
      <div className="max-w-6xl mx-auto px-4 py-16 bg-white">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">How it works</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">Simple steps to start tracking your nutrition and achieving your goals</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Step 1 */}
          <div className="relative text-center group">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-800">1</span>
              </div>
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-full w-8 h-0.5 bg-gradient-to-r from-orange-300 to-transparent"></div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Sign Up</h4>
            <p className="text-gray-600">Create your account in under 30 seconds. No complicated forms.</p>
          </div>
          
          {/* Step 2 */}
          <div className="relative text-center group">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-800">2</span>
              </div>
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-full w-8 h-0.5 bg-gradient-to-r from-orange-300 to-transparent"></div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Set Goals</h4>
            <p className="text-gray-600">AI calculates your personalized nutrition targets based on your goals.</p>
          </div>
          
          {/* Step 3 */}
          <div className="relative text-center group">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-800">3</span>
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Track Progress</h4>
            <p className="text-gray-600">Log meals and monitor your progress with beautiful visual insights.</p>
          </div>
        </div>
      </div>


      {/* Key Features with Enhanced Visuals */}
      <div className="bg-gradient-to-br from-gray-50 to-orange-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Star className="w-6 h-6 text-orange-500" />
              <Star className="w-6 h-6 text-orange-500" />
              <Star className="w-6 h-6 text-orange-500" />
              <Star className="w-6 h-6 text-orange-500" />
              <Star className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced nutrition tracking tools that make healthy eating simple and effective for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Analysis</h4>
                <p className="text-gray-600 mb-6">Describe your meal in plain English. Our AI handles the complex nutrition calculations for you.</p>
                <div className="flex items-center text-orange-500 text-sm font-semibold">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                  <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-800" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Smart Insights</h4>
                <p className="text-gray-600 mb-6">Get detailed analytics on your nutrition trends and patterns to help you make better choices.</p>
                <div className="flex items-center text-blue-500 text-sm font-semibold">
                  <span>View Demo</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
                    </div>
                    
            {/* Feature 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-orange-800" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Goal Tracking</h4>
                <p className="text-gray-600 mb-6">Set personalized nutrition targets and track your progress with easy-to-understand metrics.</p>
                <div className="flex items-center text-green-500 text-sm font-semibold">
                  <span>Start Tracking</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Enhanced Demo Section with Hero Image */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Activity className="w-8 h-8 text-orange-500" />
              <span className="text-orange-500 font-semibold text-lg">LIVE DEMO</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">See Your Progress at a Glance</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get instant insights into your daily nutrition with our intuitive dashboard. 
              Track calories, protein, and more with beautiful visual progress indicators.
            </p>
                  </div>
                  
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Dashboard Mock */}
            <div className="relative">
              {/* Main Dashboard Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Today's Performance</h3>
                      <p className="text-gray-500 text-sm">You're crushing it! 🔥</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-xs text-gray-500">Goal Progress</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Calories */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Calories</span>
                      </div>
                      <span className="font-bold text-gray-900">1,850 / 2,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full relative" style={{ width: '92%' }}>
                        <div className="absolute right-0 top-0 w-2 h-4 bg-white rounded-full opacity-80"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Protein */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Protein</span>
                      </div>
                      <span className="font-bold text-gray-900">145g / 150g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full relative" style={{ width: '97%' }}>
                        <div className="absolute right-0 top-0 w-2 h-4 bg-white rounded-full opacity-80"></div>
                      </div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Carbs</span>
                      </div>
                      <span className="font-bold text-gray-900">180g / 200g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-green-500 to-teal-500 h-4 rounded-full relative" style={{ width: '90%' }}>
                        <div className="absolute right-0 top-0 w-2 h-4 bg-white rounded-full opacity-80"></div>
                </div>
                    </div>
                  </div>
                  
                  {/* Achievement Badge */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 text-center border border-orange-200">
                    <div className="flex items-center justify-center space-x-2 text-orange-700 mb-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold">Daily Goal Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">7 Days</div>
                    <div className="text-sm text-orange-600">Keep it up, champion!</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Stats Cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">98%</div>
                    <div className="text-xs text-gray-500">Health Score</div>
                  </div>
            </div>
          </div>
          
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">2.1K</div>
                    <div className="text-xs text-gray-500">Calories Burned</div>
                  </div>
          </div>
        </div>

              {/* Background Decoration */}
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Right Side - Benefits */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Real-Time Tracking</h4>
                  <p className="text-gray-600">Monitor your nutrition metrics throughout the day with instant updates and insights.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Accurate Data</h4>
                  <p className="text-gray-600">Every macro and micronutrient tracked with precision to help you reach your goals.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Stay Motivated</h4>
                  <p className="text-gray-600">Celebrate your progress with streaks, badges, and milestones that keep you on track.</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center space-x-3">
                    <span>Try It Free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          </div>
                  </div>
                </div>
                
      {/* Action CTA Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <Zap className="w-8 h-8 text-yellow-300" />
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Nutrition?</h3>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Join thousands of users who trust NutriTrack for their nutrition goals. 
              Start your journey to better health today.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="group px-10 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:border-white/50 hover:bg-white/10 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
          </div>
        </div>


        {/* Social Media & Community Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-orange-500 font-semibold text-lg">COMMUNITY</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Join the NutriTrack Community</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect with friends, share your progress, and stay motivated together. 
              Our social platform makes nutrition tracking fun and collaborative.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Features */}
              <div className="space-y-6">
                                 <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                   </div>
                                   <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Build Your Network</h4>
                  <p className="text-gray-600">Create groups with friends and family. Share wins and motivate each other.</p>
                </div>
                 </div>

                 <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7 text-white" />
                   </div>
                                   <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Share & Inspire</h4>
                  <p className="text-gray-600">Like, comment, and share progress. Get inspired by meal ideas and success stories.</p>
                </div>
                 </div>

                 <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-white" />
                   </div>
                                   <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Stay Accountable</h4>
                  <p className="text-gray-600">Set group challenges and track progress together. Accountability never felt so good.</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-6">
                <button
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center space-x-3">
                    <span>Join Community</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </div>

            {/* Right Side - Phone Mockup */}
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative mx-auto w-80 h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  
                  {/* Phone Header */}
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold">NutriTrack Community</span>
                      </div>
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                    </div>
                  </div>

                  {/* Feed Content */}
                  <div className="p-4 space-y-4">
                    
                    {/* Post 1 */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">SM</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Sarah M.</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">Just hit my protein goal! 🎯 Greek yogurt bowl with berries and nuts.</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>❤️ 12 likes</span>
                        <span>💬 3 comments</span>
                      </div>
                    </div>

                    {/* Post 2 */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">MJ</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Mike J.</p>
                          <p className="text-xs text-gray-500">5 hours ago</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">Week 3 progress: Down 8 lbs! 💪 This community keeps me motivated.</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>❤️ 28 likes</span>
                        <span>💬 7 comments</span>
                      </div>
                    </div>

                    {/* Post 3 */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">AL</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Alex L.</p>
                          <p className="text-xs text-gray-500">1 day ago</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">New meal prep Sunday recipe! 🥗 High protein quinoa bowl.</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>❤️ 15 likes</span>
                        <span>💬 4 comments</span>
                      </div>
                    </div>

                    {/* Floating Action Button */}
                    <div className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-40 animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  NutriTrack
                </h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The easiest nutrition tracking app on the market. AI-powered simplicity meets powerful insights.
              </p>
              <div className="flex space-x-4">
                <button type="button" className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center hover:bg-orange-500/30 transition-colors">
                  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button type="button" className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center hover:bg-orange-500/30 transition-colors">
                  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </button>
                <button type="button" className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center hover:bg-orange-500/30 transition-colors">
                  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Features</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Pricing</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Mobile App</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">API</button></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">About</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Careers</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Blog</button></li>
                <li><button type="button" className="text-gray-300 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Support</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 NutriTrack. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <button type="button" className="text-gray-400 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Privacy</button>
                <button type="button" className="text-gray-400 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Terms</button>
                <button type="button" className="text-gray-400 hover:text-orange-400 transition-colors bg-transparent border-none p-0 cursor-pointer">Cookies</button>
              </div>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
};

export default Welcome;
