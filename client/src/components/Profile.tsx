import React, { useState, useEffect } from 'react';
import { Calculator, Save, Loader2, Sparkles } from 'lucide-react';
import { profileAPI } from '../services/api';

interface UserProfile {
  daily_calories: number;
  daily_protein: number;
  weight?: number;
  target_weight?: number;
  height?: number;
  age?: number;
  activity_level?: string;
  gender?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    daily_calories: 2000,
    daily_protein: 150,
    activity_level: 'moderate',
    gender: 'male'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculationData, setCalculationData] = useState({
    weight: '',
    height: '',
    age: '',
    activity_level: 'moderate',
    gender: 'male'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.get();
      if (response.data.profile) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await profileAPI.update(profile);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    if (!calculationData.weight || !calculationData.height || !calculationData.age) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      // Convert pounds to kg for AI calculation (1 kg = 2.20462 lbs)
      const weightInKg = parseFloat(calculationData.weight) / 2.20462;
      // Convert inches to cm for AI calculation (1 cm = 0.393701 inches)
      const heightInCm = parseFloat(calculationData.height) / 0.393701;
      
      const response = await profileAPI.calculateCalories({
        weight: weightInKg,
        height: heightInCm,
        age: parseInt(calculationData.age),
        activity_level: calculationData.activity_level,
        gender: calculationData.gender
      });
      
      const { daily_calories, daily_protein, explanation } = response.data;
      
      setProfile(prev => ({
        ...prev,
        daily_calories,
        daily_protein,
        weight: parseFloat(calculationData.weight), // Store in pounds
        height: parseFloat(calculationData.height),
        age: parseInt(calculationData.age),
        activity_level: calculationData.activity_level,
        gender: calculationData.gender
      }));
      
      setMessage(`AI Calculation Complete! ${explanation}`);
      setShowCalculator(false);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to calculate calories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nutrition Profile</h2>
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="btn-primary flex items-center space-x-2"
        >
          <Calculator className="h-4 w-4" />
          <span>AI Calculator</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-success-50 border border-success-200 text-success-700'
            : 'bg-danger-50 border border-danger-200 text-danger-700'
        }`}>
          {message}
        </div>
      )}

      {/* AI Calculator */}
      {showCalculator && (
        <div className="card border-primary-200 bg-primary-50">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-primary-800">AI-Powered Calorie Calculator</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Weight (lbs)
               </label>
               <input
                 type="number"
                 value={calculationData.weight}
                 onChange={(e) => setCalculationData(prev => ({ ...prev, weight: e.target.value }))}
                 className="input"
                 placeholder="154"
                 step="0.1"
               />
             </div>
            
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Height (inches)
               </label>
               <input
                 type="number"
                 value={calculationData.height}
                 onChange={(e) => setCalculationData(prev => ({ ...prev, height: e.target.value }))}
                 className="input"
                 placeholder="69"
                 step="0.1"
               />
             </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={calculationData.age}
                onChange={(e) => setCalculationData(prev => ({ ...prev, age: e.target.value }))}
                className="input"
                placeholder="30"
                min="16"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={calculationData.gender}
                onChange={(e) => setCalculationData(prev => ({ ...prev, gender: e.target.value }))}
                className="input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Level
              </label>
              <select
                value={calculationData.activity_level}
                onChange={(e) => setCalculationData(prev => ({ ...prev, activity_level: e.target.value }))}
                className="input"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Lightly active (light exercise 1-3 days/week)</option>
                <option value="moderate">Moderately active (moderate exercise 3-5 days/week)</option>
                <option value="active">Very active (hard exercise 6-7 days/week)</option>
                <option value="very_active">Extremely active (very hard exercise, physical job)</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  <span>Calculate</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowCalculator(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Calorie Goal
            </label>
            <input
              type="number"
              value={profile.daily_calories}
              onChange={(e) => setProfile(prev => ({ ...prev, daily_calories: parseInt(e.target.value) || 0 }))}
              className="input"
              min="1000"
              max="10000"
              step="50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 1,500 - 3,000 calories per day
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Protein Goal (g)
            </label>
            <input
              type="number"
              value={profile.daily_protein}
              onChange={(e) => setProfile(prev => ({ ...prev, daily_protein: parseInt(e.target.value) || 0 }))}
              className="input"
              min="50"
              max="500"
              step="5"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 0.8 - 2.2g per kg of body weight
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Weight (lbs)
            </label>
            <input
              type="number"
              value={profile.weight || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
              className="input"
              placeholder="Enter current weight"
              min="66"
              max="660"
              step="0.1"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your current body weight in pounds
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Weight (lbs)
            </label>
            <input
              type="number"
              value={profile.target_weight || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, target_weight: parseFloat(e.target.value) || undefined }))}
              className="input"
              placeholder="Enter target weight"
              min="66"
              max="660"
              step="0.1"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your goal weight in pounds
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (inches)
            </label>
            <input
              type="number"
              value={profile.height || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
              className="input"
              placeholder="Enter height"
              min="48"
              max="96"
              step="0.1"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your height in inches
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
              className="input"
              placeholder="Enter age"
              min="16"
              max="100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your age in years
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Level
            </label>
            <select
              value={profile.activity_level || 'moderate'}
              onChange={(e) => setProfile(prev => ({ ...prev, activity_level: e.target.value }))}
              className="input"
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Lightly active (light exercise 1-3 days/week)</option>
              <option value="moderate">Moderately active (moderate exercise 3-5 days/week)</option>
              <option value="active">Very active (hard exercise 6-7 days/week)</option>
              <option value="very_active">Extremely active (very hard exercise, physical job)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Your typical activity level
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={profile.gender || 'male'}
              onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
              className="input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Your biological sex
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Profile Display */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Daily Calories:</span>
            <p className="font-medium">{profile.daily_calories} cal</p>
          </div>
          <div>
            <span className="text-gray-500">Daily Protein:</span>
            <p className="font-medium">{profile.daily_protein}g</p>
          </div>
          <div>
            <span className="text-gray-500">Weight:</span>
            <p className="font-medium">{profile.weight ? `${profile.weight} lbs` : 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Height:</span>
            <p className="font-medium">{profile.height ? `${profile.height} inches` : 'Not set'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
          <div>
            <span className="text-gray-500">Age:</span>
            <p className="font-medium">{profile.age ? `${profile.age} years` : 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Activity Level:</span>
            <p className="font-medium capitalize">{profile.activity_level || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Gender:</span>
            <p className="font-medium capitalize">{profile.gender || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Target Weight:</span>
            <p className="font-medium text-primary-600">{profile.target_weight ? `${profile.target_weight} lbs` : 'Not set'}</p>
          </div>
        </div>
        
        {profile.target_weight && profile.weight && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Weight to {profile.target_weight < profile.weight ? 'Lose' : 'Gain'}:</span>
                <p className="font-medium text-primary-600">
                  {Math.abs(profile.target_weight - profile.weight).toFixed(1)} lbs
                </p>
              </div>
              <div>
                <span className="text-gray-500">Goal Type:</span>
                <p className="font-medium text-primary-600">
                  {profile.target_weight < profile.weight ? 'Weight Loss' : 'Weight Gain'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
