import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Target, User, Activity, Scale, Ruler, Calendar, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';

interface ProfileData {
  daily_calories: number;
  daily_protein: number;
  weight: number;
  target_weight: number;
  height: number;
  age: number;
  activity_level: string;
  gender: string;
  goal?: string;
  timeline?: string;
  calculated_deficit?: number;
  ai_recommendation?: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    daily_calories: 2000,
    daily_protein: 150,
    weight: 0,
    target_weight: 0,
    height: 0,
    age: 0,
    activity_level: 'moderate',
    gender: 'male'
  });
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [loading, setLoading] = useState(true);

  // AI-powered nutrition plan calculation
  const calculateNutritionPlan = async () => {
    try {
      // Parse timeline input using AI-like logic
      const timeline = profileData.timeline?.toLowerCase() || '';
      let days = 0;
      
      // Extract number and unit from timeline
      const numberMatch = timeline.match(/(\d+)/);
      const unitMatch = timeline.match(/(week|month|day|wk|mo|d)s?/i);
      
      if (numberMatch && unitMatch) {
        const number = parseInt(numberMatch[1]);
        const unit = unitMatch[1].toLowerCase();
        
        switch (unit) {
          case 'week':
          case 'wk':
            days = number * 7;
            break;
          case 'month':
          case 'mo':
            days = number * 30;
            break;
          case 'day':
          case 'd':
            days = number;
            break;
          default:
            days = number * 7; // Default to weeks
        }
      } else {
        // Fallback: assume weeks if format unclear
        days = 56; // 8 weeks default
      }
      
      // Calculate weight difference
      const weightDifference = profileData.target_weight - profileData.weight;
      const isWeightLoss = weightDifference < 0;
      
      // Calculate daily calorie adjustment
      // 1 pound = 3500 calories
      const totalCalorieAdjustment = Math.abs(weightDifference) * 3500;
      const dailyCalorieAdjustment = Math.round(totalCalorieAdjustment / days);
      
      // Calculate maintenance calories using Harris-Benedict equation
      let bmr = 0;
      if (profileData.gender === 'male') {
        bmr = 88.362 + (13.397 * profileData.weight * 0.453592) + (4.799 * profileData.height * 2.54) - (5.677 * profileData.age);
      } else {
        bmr = 447.593 + (9.247 * profileData.weight * 0.453592) + (3.098 * profileData.height * 2.54) - (4.330 * profileData.age);
      }
      
      // Apply activity multiplier
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const maintenanceCalories = Math.round(bmr * activityMultipliers[profileData.activity_level as keyof typeof activityMultipliers]);
      
      // Calculate target calories
      let targetCalories = maintenanceCalories;
      if (isWeightLoss) {
        targetCalories = maintenanceCalories - dailyCalorieAdjustment;
      } else {
        targetCalories = maintenanceCalories + dailyCalorieAdjustment;
      }
      
      // AI recommendation for extreme deficits
      let aiRecommendation = '';
      if (isWeightLoss && dailyCalorieAdjustment > 1000) {
        aiRecommendation = `⚠️ Warning: A ${dailyCalorieAdjustment} calorie daily deficit is quite aggressive and may not be sustainable. Consider extending your timeline to ${Math.ceil(days * 1.5)} days for a healthier ${Math.round(dailyCalorieAdjustment * 0.67)} calorie daily deficit.`;
      }
      
      // Calculate protein needs (1.6-2.2g per kg for weight loss, 1.6-2.4g per kg for weight gain)
      const weightInKg = profileData.weight * 0.453592;
      let proteinMultiplier = 1.8; // Default
      if (isWeightLoss) {
        proteinMultiplier = 2.0; // Higher protein for weight loss
      } else if (!isWeightLoss) {
        proteinMultiplier = 2.2; // Higher protein for muscle gain
      }
      const targetProtein = Math.round(weightInKg * proteinMultiplier);
      
      // Update profile data with calculations
      setProfileData(prev => ({
        ...prev,
        daily_calories: targetCalories,
        daily_protein: targetProtein,
        calculated_deficit: isWeightLoss ? -dailyCalorieAdjustment : dailyCalorieAdjustment,
        ai_recommendation: aiRecommendation
      }));
      
    } catch (error) {
      console.error('Error calculating nutrition plan:', error);
      // Fallback to basic calculation
      setProfileData(prev => ({
        ...prev,
        daily_calories: 2000,
        daily_protein: 150,
        calculated_deficit: 0,
        ai_recommendation: 'Unable to calculate personalized plan. Using default values.'
      }));
    }
  };

  const steps = [
    {
      title: "Welcome to NutriTrack!",
      subtitle: "Let's set up your profile in just 2 minutes",
      icon: Target,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 text-lg">
            We'll ask you a few quick questions to personalize your nutrition experience.
          </p>
        </div>
      )
    },
    {
      title: "What's your goal?",
      subtitle: "This helps us calculate your daily targets",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'lose', label: 'Lose Weight', description: 'Create a calorie deficit' },
              { value: 'maintain', label: 'Maintain Weight', description: 'Stay at current weight' },
              { value: 'gain', label: 'Gain Weight', description: 'Build muscle and weight' }
            ].map((goal) => (
              <button
                key={goal.value}
                onClick={() => setProfileData(prev => ({ ...prev, goal: goal.value }))}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  profileData.goal === goal.value
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
                }`}
              >
                <div className="font-medium text-gray-900">{goal.label}</div>
                <div className="text-sm text-gray-600">{goal.description}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Current Weight",
      subtitle: "Enter your current weight in pounds",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              type="number"
              value={profileData.weight || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              className="text-4xl font-bold text-center w-32 border-none outline-none bg-transparent"
              placeholder="150"
              min="66"
              max="660"
            />
            <div className="text-gray-500 text-lg">pounds</div>
          </div>
        </div>
      )
    },
    {
      title: "Target Weight",
      subtitle: "What's your goal weight?",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              type="number"
              value={profileData.target_weight || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, target_weight: parseFloat(e.target.value) || 0 }))}
              className="text-4xl font-bold text-center w-32 border-none outline-none bg-transparent"
              placeholder="140"
              min="66"
              max="660"
            />
            <div className="text-gray-500 text-lg">pounds</div>
          </div>
        </div>
      )
    },
    {
      title: "Timeline",
      subtitle: "How quickly do you want to reach your goal?",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              type="text"
              value={profileData.timeline || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, timeline: e.target.value }))}
              className="text-2xl font-medium text-center w-48 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-orange-500 focus:outline-none transition-all duration-200 hover:border-orange-300"
              placeholder="e.g., 8 weeks, 3 months, 60 days"
            />
            <div className="text-gray-500 text-sm mt-2">
              Enter any format: weeks, months, days
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Height",
      subtitle: "How tall are you?",
      icon: Ruler,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              type="number"
              value={profileData.height || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
              className="text-4xl font-bold text-center w-32 border-none outline-none bg-transparent"
              placeholder="69"
              min="48"
              max="96"
            />
            <div className="text-gray-500 text-lg">inches</div>
          </div>
        </div>
      )
    },
    {
      title: "Age",
      subtitle: "Your age helps calculate your metabolism",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              type="number"
              value={profileData.age || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              className="text-4xl font-bold text-center w-32 border-none outline-none bg-transparent"
              placeholder="30"
              min="16"
              max="100"
            />
            <div className="text-gray-500 text-lg">years old</div>
          </div>
        </div>
      )
    },
    {
      title: "Activity Level",
      subtitle: "How active are you on a typical week?",
      icon: Activity,
      content: (
        <div className="space-y-3">
          {[
            { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
            { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
            { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
            { value: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
            { value: 'very_active', label: 'Extremely Active', description: 'Very hard exercise, physical job' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setProfileData(prev => ({ ...prev, activity_level: level.value }))}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                profileData.activity_level === level.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
              }`}
            >
              <div className="font-medium text-gray-900">{level.label}</div>
              <div className="text-sm text-gray-600">{level.description}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Gender",
      subtitle: "This helps with accurate calorie calculations",
      icon: User,
      content: (
        <div className="space-y-3">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ].map((gender) => (
            <button
              key={gender.value}
              onClick={() => setProfileData(prev => ({ ...prev, gender: gender.value }))}
              className={`w-full p-6 border-2 rounded-xl text-center transition-all duration-200 ${
                profileData.gender === gender.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
              }`}
            >
              <div className="text-xl font-medium text-gray-900">{gender.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "AI Calculation",
      subtitle: "Calculating your personalized nutrition plan",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            {profileData.calculated_deficit !== undefined ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Your Personalized Plan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current Weight:</span>
                      <span className="font-medium">{profileData.weight} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Weight:</span>
                      <span className="font-medium">{profileData.target_weight} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline:</span>
                      <span className="font-medium">{profileData.timeline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Calorie Adjustment:</span>
                      <span className={`font-medium ${profileData.calculated_deficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {profileData.calculated_deficit > 0 ? '+' : ''}{profileData.calculated_deficit} cal
                      </span>
                    </div>
                  </div>
                </div>
                
                {profileData.ai_recommendation && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">⚠️ AI Recommendation</h4>
                    <p className="text-sm text-orange-800">{profileData.ai_recommendation}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Daily Targets</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Daily Calories:</span>
                      <span className="font-semibold">{profileData.daily_calories} cal</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Protein:</span>
                      <span className="font-semibold">{profileData.daily_protein}g</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Click the button below to calculate your personalized nutrition plan</p>
                <button
                  onClick={calculateNutritionPlan}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Calculate Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: "All Set!",
      subtitle: "Your profile is ready to go",
      icon: CheckCircle,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 text-lg">
            We've calculated your daily targets based on your profile. You can always adjust these later!
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span>Daily Calories:</span>
              <span className="font-semibold">{profileData.daily_calories} cal</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Protein:</span>
              <span className="font-semibold">{profileData.daily_protein}g</span>
            </div>
            {profileData.calculated_deficit !== undefined && (
              <div className="flex justify-between">
                <span>Daily Adjustment:</span>
                <span className={`font-semibold ${profileData.calculated_deficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {profileData.calculated_deficit > 0 ? '+' : ''}{profileData.calculated_deficit} cal
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  // Check if user already has a profile - if so, redirect to dashboard
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const response = await profileAPI.get();
        if (response.data.profile) {
          // User already has a profile, redirect to dashboard
          navigate('/dashboard');
          return;
        }
        setLoading(false);
      } catch (error) {
        // No profile exists, continue with onboarding
        setLoading(false);
      }
    };
    
    checkExistingProfile();
  }, [navigate]);

  useEffect(() => {
    if (timeRemaining > 0 && currentStep < steps.length - 1) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, currentStep, steps.length]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        // Update profile with collected data
        await profileAPI.update(profileData);
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to update profile:', error);
        // Still redirect to dashboard
        navigate('/dashboard');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const result = (() => {
      switch (currentStep) {
        case 0: return true; // Welcome step - always allow proceeding
        case 1: return profileData.goal;
        case 2: return profileData.weight > 0;
        case 3: return profileData.target_weight > 0;
        case 4: return profileData.timeline && profileData.timeline.trim().length > 0;
        case 5: return profileData.height > 0;
        case 6: return profileData.age > 0;
        case 7: return profileData.activity_level;
        case 8: return profileData.gender;
        case 9: return profileData.calculated_deficit !== undefined; // AI calculation step
        case 10: return true; // Final step - always allow proceeding
        default: return false; // Can't proceed on unknown steps
      }
    })();
    
    console.log(`Step ${currentStep}: canProceed = ${result}`);
    console.log('Profile data:', profileData);
    if (currentStep === 9) {
      console.log('Step 9 - calculated_deficit:', profileData.calculated_deficit);
    }
    return result;
  };

  if (loading) {
      return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking your profile...</p>
      </div>
    </div>
  );
  }

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
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
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
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6 shadow-inner">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          
          {/* Progress Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          
          {/* Time Remaining */}
          <div className="text-sm text-gray-500">
            ⏱️ {timeRemaining >= 60 ? `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s` : `${timeRemaining}s`} remaining
          </div>
        </div>

          {/* Step Content */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <currentStepData.icon className="w-10 h-10 text-orange-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-800">{currentStep + 1}</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
              <p className="text-gray-600">{currentStepData.subtitle}</p>
            </div>
          
          <div className="min-h-[200px] flex items-center justify-center">
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          

          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            <span>{currentStep === 10 ? 'Get Started' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Onboarding;
