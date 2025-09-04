import React from 'react';
import { ArrowRight, Target, CheckCircle, Sparkles, TrendingUp, Lightbulb, BarChart3, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Spacing */}
      <div className="h-20"></div>
      
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Hero Section - Strava-inspired */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              NutriTrack
            </h1>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Every Meal
            <span className="block text-orange-500">
              Matters
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Track your nutrition with the precision of an athlete. 
            Set goals, monitor progress, and achieve peak performance.
          </p>

          {/* CTA Buttons - Strava style */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="group px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>


        {/* Three Steps - Strava-inspired clean design */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Sign Up</h4>
              <p className="text-gray-600 text-sm">Create your account in under 30 seconds</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Set Goals</h4>
              <p className="text-gray-600 text-sm">AI calculates your personalized targets</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Track</h4>
              <p className="text-gray-600 text-sm">Log meals and monitor your progress</p>
            </div>
          </div>
        </div>


        {/* Key Features - Strava-style cards */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Athletes</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track your nutrition with the precision and insights that serious athletes demand.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Feature 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h4>
              <p className="text-gray-600 text-sm">Describe your meal in plain English. Our AI handles the complex nutrition calculations.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance Insights</h4>
              <p className="text-gray-600 text-sm">Get detailed analytics on your nutrition trends and performance patterns.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Goal Tracking</h4>
              <p className="text-gray-600 text-sm">Set ambitious targets and track your progress with precision metrics.</p>
            </div>
          </div>
        </div>


        {/* Demo Card - Nutrition Focused */}
        <div className="mb-24">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">See Your Progress at a Glance</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant insights into your daily nutrition with our intuitive dashboard. 
              Track calories, protein, and more with beautiful visual progress indicators.
            </p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Today's Progress</h3>
              <p className="text-gray-600 text-sm">You're doing great!</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Calories</span>
                <span className="font-bold text-gray-900">1,850 / 2,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full" style={{ width: '92%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Protein</span>
                <span className="font-bold text-gray-900">145g / 150g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full" style={{ width: '97%' }}></div>
              </div>

              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Calorie goal achieved!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Break */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-16"></div>

        {/* Bottom CTA */}
        <div className="text-center mb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Free Today
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>


        {/* Social Media & Community Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Join the NutriTrack Community</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect with friends, share your progress, and stay motivated together. 
              Our social platform makes nutrition tracking fun and collaborative.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Features */}
            <div className="space-y-8">
              <div className="space-y-6">
                                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                     </svg>
                   </div>
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900 mb-2">Build Your Tribe</h4>
                     <p className="text-gray-600">Create private groups with friends & family. Share wins and motivate each other.</p>
                   </div>
                 </div>

                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                     </svg>
                   </div>
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900 mb-2">Engage & Inspire</h4>
                     <p className="text-gray-600">Like, comment, and share. Get inspired by meal ideas and progress stories.</p>
                   </div>
                 </div>

                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900 mb-2">Stay Accountable</h4>
                     <p className="text-gray-600">Set group challenges and track progress together. Accountability never felt so good.</p>
                   </div>
                 </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center space-x-3">
                    <span>Join Community</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
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
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Section Break */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-16"></div>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  NutriTrack
                </h3>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                The easiest nutrition tracking app on the market. AI-powered simplicity meets powerful insights.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">API</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Mobile App</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 text-sm mb-4 md:mb-0">
                © 2024 NutriTrack. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Cookie Policy</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">GDPR</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Welcome;
