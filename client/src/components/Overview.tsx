import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Target, Flame, Beef, TrendingUp, Calendar, Zap, Plus, Utensils, Clock } from 'lucide-react';
import { profileAPI, mealsAPI, diaryAPI } from '../services/api';

interface UserProfile {
  daily_calories: number;
  daily_protein: number;
  weight?: number;
  target_weight?: number;
}

interface DailyNutrition {
  total_calories: number;
  total_protein: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  total_sugar?: number;
  total_sodium?: number;
  calories_goal: number;
  protein_goal: number;
  calories_met: boolean;
  protein_met: boolean;
  date?: string;
}

interface MealData {
  id: number;
  meal_date: string;
  meal_type: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  created_at: string;
}

// Weight Analysis Component
const WeightAnalysis: React.FC<{
  currentWeight: number;
  targetWeight: number;
  dailyCalorieGoal: number;
}> = ({ currentWeight, targetWeight, dailyCalorieGoal }) => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      // Get meals for the past week
      const response = await mealsAPI.getByRange(startDate, endDate);
      const meals = response.data.meals || [];
      
      // Group meals by date and calculate daily totals
      const dailyTotals = meals.reduce((acc: any, meal: any) => {
        const date = meal.meal_date;
        if (!acc[date]) {
          acc[date] = { calories: 0, protein: 0 };
        }
        acc[date].calories += meal.calories || 0;
        acc[date].protein += meal.protein || 0;
        return acc;
      }, {});
      
      // Convert to array and sort by date
      const weeklyDataArray = Object.entries(dailyTotals).map(([date, totals]: [string, any]) => ({
        date,
        calories: totals.calories,
        deficit: dailyCalorieGoal - totals.calories
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setWeeklyData(weeklyDataArray);
    } catch (error) {
      console.error('Failed to load weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weightDifference = targetWeight - currentWeight;
  const isWeightLoss = weightDifference < 0;
  const absWeightDifference = Math.abs(weightDifference);
  
  // Calculate average daily calorie deficit/surplus over the past week
  const averageDailyDeficit = weeklyData.length > 0 
    ? weeklyData.reduce((sum, day) => sum + day.deficit, 0) / weeklyData.length
    : 0;
  
  // Calculate time to reach target weight
  // 1 lb of fat = approximately 3,500 calories
  const caloriesPerLb = 3500;
  const totalCaloriesNeeded = absWeightDifference * caloriesPerLb;
  const daysToTarget = averageDailyDeficit !== 0 ? Math.abs(totalCaloriesNeeded / averageDailyDeficit) : 0;
  const weeksToTarget = daysToTarget / 7;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center">
           <div className="text-lg font-bold text-gray-900">{currentWeight} lbs</div>
           <div className="text-xs text-gray-600">Current Weight</div>
         </div>
         <div className="text-center">
           <div className="text-lg font-bold text-primary-600">{targetWeight} lbs</div>
           <div className="text-xs text-gray-600">Target Weight</div>
         </div>
         <div className="text-center">
           <div className={`text-lg font-bold ${isWeightLoss ? 'text-green-600' : 'text-orange-600'}`}>
             {absWeightDifference.toFixed(1)} lbs
           </div>
           <div className="text-xs text-gray-600">to {isWeightLoss ? 'Lose' : 'Gain'}</div>
         </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${averageDailyDeficit > 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {Math.abs(averageDailyDeficit).toFixed(0)}
          </div>
          <div className="text-xs text-gray-600">
            {averageDailyDeficit > 0 ? 'Cal Deficit' : 'Cal Surplus'}/day
          </div>
        </div>
      </div>

      {/* Progress Analysis */}
      <div className="bg-white rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Weekly Progress Analysis</h4>
        
        {weeklyData.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average daily calorie {averageDailyDeficit > 0 ? 'deficit' : 'surplus'}:</span>
              <span className={`font-medium ${averageDailyDeficit > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {Math.abs(averageDailyDeficit).toFixed(0)} calories
              </span>
            </div>
            
            {averageDailyDeficit !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">At this pace, you'll reach your target in:</span>
                <span className="font-medium text-blue-600">
                  {daysToTarget < 30 ? `${Math.round(daysToTarget)} days` : `${weeksToTarget.toFixed(1)} weeks`}
                </span>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              * Based on past week's average calorie intake vs. your daily goal
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No meal data available for the past week. Add meals to see your progress analysis.
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for meal display
const getMealTypeIcon = (mealType: string) => {
  const icons: { [key: string]: string } = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snack: '🍎'
  };
  return icons[mealType.toLowerCase()] || '🍽️';
};

const getMealTypeColor = (mealType: string) => {
  const colors: { [key: string]: string } = {
    breakfast: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-green-100 text-green-800',
    dinner: 'bg-blue-100 text-blue-800',
    snack: 'bg-purple-100 text-purple-800'
  };
  return colors[mealType.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const safeFormatDate = (dateString: string, formatStr: string) => {
  try {
    return format(new Date(dateString), formatStr);
  } catch (error) {
    return dateString;
  }
};

const Overview: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<DailyNutrition | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const profileResponse = await profileAPI.get();
      if (profileResponse.data.profile) {
        setProfile(profileResponse.data.profile);
      }
      
      // Load today's meals directly to calculate totals
      const mealsResponse = await mealsAPI.getByDate(today);
      console.log('Meals response:', mealsResponse.data);
      
             // Calculate totals from meals
       const meals: MealData[] = mealsResponse.data.meals || [];
       setTodayMeals(meals); // Store meals for display
       const totalCalories = meals.reduce((sum: number, meal: MealData) => sum + (meal.calories || 0), 0);
       const totalProtein = meals.reduce((sum: number, meal: MealData) => sum + (meal.protein || 0), 0);
       const totalCarbs = meals.reduce((sum: number, meal: MealData) => sum + (meal.carbs || 0), 0);
       const totalFat = meals.reduce((sum: number, meal: MealData) => sum + (meal.fat || 0), 0);
       const totalFiber = meals.reduce((sum: number, meal: MealData) => sum + (meal.fiber || 0), 0);
       const totalSugar = meals.reduce((sum: number, meal: MealData) => sum + (meal.sugar || 0), 0);
       const totalSodium = meals.reduce((sum: number, meal: MealData) => sum + (meal.sodium || 0), 0);
       
       // Create nutrition data object
       const nutritionData = {
         total_calories: totalCalories,
         total_protein: totalProtein,
         total_carbs: totalCarbs,
         total_fat: totalFat,
         total_fiber: totalFiber,
         total_sugar: totalSugar,
         total_sodium: totalSodium,
         calories_goal: profileResponse.data.profile?.daily_calories || 0,
         protein_goal: profileResponse.data.profile?.daily_protein || 0,
         calories_met: totalCalories >= (profileResponse.data.profile?.daily_calories || 0),
         protein_met: totalProtein >= (profileResponse.data.profile?.daily_protein || 0),
         date: today
       };
      
      console.log('Calculated nutrition data:', nutritionData);
      setTodayNutrition(nutritionData);
      
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when component mounts or when today changes
  useEffect(() => {
    loadOverviewData();
  }, [today]);

  // Add a manual refresh function
  const refreshData = () => {
    loadOverviewData();
  };

  // Set up interval to refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOverviewData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh data when the tab becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing data...');
        loadOverviewData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Listen for storage events to refresh when meals are added from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mealAdded' || e.key === 'mealDeleted') {
        console.log('Storage event detected, refreshing data...');
        loadOverviewData();
      }
    };

    // Also listen for custom events that can be triggered from the same tab
    const handleCustomEvent = () => {
      console.log('Custom event detected, refreshing data...');
      loadOverviewData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mealDataChanged', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mealDataChanged', handleCustomEvent);
    };
  }, []);

  const calculateRemaining = (consumed: number, goal: number) => {
    return Math.max(0, goal - consumed);
  };

  const calculateProgress = (consumed: number, goal: number) => {
    return Math.min(100, (consumed / goal) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-success-500';
    return 'bg-primary-500';
  };

  const getStatusIcon = (met: boolean) => {
    return met ? (
      <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-success-600" />
      </div>
    ) : (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Target className="w-5 h-5 text-gray-500" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Debug information (remove this in production)
  console.log('Overview component state:', {
    profile,
    todayNutrition,
    today
  });

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Set</h3>
        <p className="text-gray-500 mb-4">Set your daily nutrition goals in the Profile tab to see your overview.</p>
        <button
          onClick={() => window.location.href = '/dashboard/profile'}
          className="btn-primary"
        >
          Set Goals
        </button>
      </div>
    );
  }

  // Show message if no nutrition data for today (check if we have actual meal data)
  if (!todayNutrition || (todayNutrition.total_calories === 0 && todayNutrition.total_protein === 0)) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Overview</h2>
            <p className="text-gray-600">Track your nutrition progress for today</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              className="btn-secondary flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        <div className="text-center py-12">
          <Flame className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Meals Logged Today</h3>
          <p className="text-gray-500 mb-4">Start tracking your nutrition by adding your first meal of the day.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/dashboard/inputs'}
              className="btn-primary"
            >
              Add Meal
            </button>
            <button
              onClick={refreshData}
              className="btn-secondary"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Daily Goals Summary (with 0 values) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calories Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Calories</h3>
                  <p className="text-sm text-gray-500">Daily Goal</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">0</span>
                <span className="text-lg text-gray-500">/ {profile.daily_calories}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-300 bg-gray-300" style={{ width: '0%' }}></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{profile.daily_calories} left</span>
                <span className="font-medium text-gray-900">0%</span>
              </div>
            </div>
          </div>

          {/* Protein Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Beef className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Protein</h3>
                  <p className="text-sm text-gray-500">Daily Goal</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">0g</span>
                <span className="text-lg text-gray-500">/ {profile.daily_protein}g</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-300 bg-gray-300" style={{ width: '0%' }}></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{profile.daily_protein}g left</span>
                <span className="font-medium text-gray-900">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have valid numbers for calculations
  const currentCalories = todayNutrition?.total_calories || 0;
  const currentProtein = todayNutrition?.total_protein || 0;
  const caloriesGoal = profile.daily_calories || 0;
  const proteinGoal = profile.daily_protein || 0;

  const caloriesRemaining = calculateRemaining(currentCalories, caloriesGoal);
  const proteinRemaining = calculateRemaining(currentProtein, proteinGoal);
  
  const caloriesProgress = calculateProgress(currentCalories, caloriesGoal);
  const proteinProgress = calculateProgress(currentProtein, proteinGoal);

  return (
    <div className="space-y-6">
      {/* Header */}
             <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold text-gray-900">Daily Overview</h2>
           <p className="text-gray-600">Track your nutrition progress for today</p>
         </div>
         <div className="flex items-center space-x-4">
           <button
             onClick={refreshData}
             className="btn-secondary flex items-center space-x-2"
           >
             <Zap className="h-4 w-4" />
             <span>Refresh</span>
           </button>
           <div className="flex items-center space-x-2 text-sm text-gray-500">
             <Calendar className="h-4 w-4" />
             <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
           </div>
         </div>
       </div>

      {/* Weight Loss/Gain Analysis */}
      {profile.weight && profile.target_weight && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Weight Progress Analysis</h3>
          </div>
          
          <WeightAnalysis 
            currentWeight={profile.weight}
            targetWeight={profile.target_weight}
            dailyCalorieGoal={profile.daily_calories}
          />
        </div>
      )}

      {/* Daily Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calories Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Calories</h3>
                <p className="text-sm text-gray-500">Daily Goal</p>
              </div>
            </div>
            {getStatusIcon(todayNutrition?.calories_met || false)}
          </div>

          <div className="space-y-4">
                         <div className="flex justify-between items-center">
               <span className="text-2xl font-bold text-gray-900">
                 {currentCalories}
               </span>
               <span className="text-lg text-gray-500">/ {caloriesGoal}</span>
             </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(caloriesProgress)}`}
                style={{ width: `${caloriesProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {caloriesRemaining > 0 ? `${caloriesRemaining} left` : 'Goal achieved! 🎉'}
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(caloriesProgress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Beef className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Protein</h3>
                <p className="text-sm text-gray-500">Daily Goal</p>
              </div>
            </div>
            {getStatusIcon(todayNutrition?.protein_met || false)}
          </div>

          <div className="space-y-4">
                         <div className="flex justify-between items-center">
               <span className="text-2xl font-bold text-gray-900">
                 {currentProtein}g
               </span>
               <span className="text-lg text-gray-500">/ {proteinGoal}g</span>
             </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(proteinProgress)}`}
                style={{ width: `${proteinProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {proteinRemaining > 0 ? `${proteinRemaining}g left` : 'Goal achieved! 🎉'}
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(proteinProgress)}%
              </span>
            </div>
          </div>
        </div>
             </div>

       {/* Additional Macros - Secondary Focus */}
       <div className="card">
         <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Nutrients</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-lg font-bold text-gray-900">{todayNutrition?.total_carbs || 0}g</div>
             <div className="text-xs text-gray-600">Carbs</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-lg font-bold text-gray-900">{todayNutrition?.total_fat || 0}g</div>
             <div className="text-xs text-gray-600">Fat</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-lg font-bold text-gray-900">{todayNutrition?.total_fiber || 0}g</div>
             <div className="text-xs text-gray-600">Fiber</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-lg font-bold text-gray-900">{todayNutrition?.total_sugar || 0}g</div>
             <div className="text-xs text-gray-600">Sugar</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-lg font-bold text-gray-900">{todayNutrition?.total_sodium || 0}mg</div>
             <div className="text-xs text-gray-600">Sodium</div>
           </div>
         </div>
       </div>

       {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/inputs'}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-300 transition-colors"
          >
            <Plus className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Add Meal</div>
              <div className="text-sm text-gray-500">Log your nutrition</div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard/profile'}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-300 transition-colors"
          >
            <Target className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Update Goals</div>
              <div className="text-sm text-gray-500">Adjust targets</div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard/diary'}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-300 transition-colors"
          >
            <Calendar className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">View History</div>
              <div className="text-sm text-gray-500">Track progress</div>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                     <div className="p-4 bg-gray-50 rounded-lg">
             <div className="text-2xl font-bold text-gray-900">
               {currentCalories}
             </div>
             <div className="text-sm text-gray-600">Calories</div>
           </div>
           
           <div className="p-4 bg-gray-50 rounded-lg">
             <div className="text-2xl font-bold text-gray-900">
               {currentProtein}g
             </div>
             <div className="text-sm text-gray-600">Protein</div>
           </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {caloriesRemaining}
            </div>
            <div className="text-sm text-gray-600">Calories Left</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {proteinRemaining}g
            </div>
            <div className="text-sm text-gray-600">Protein Left</div>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      {todayMeals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Meals</h3>
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getMealTypeIcon(meal.meal_type)}</div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.meal_type)}`}>
                          {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {safeFormatDate(meal.created_at, 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{meal.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {/* Main focus - Calories and Protein */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-lg">{meal.calories} cal</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Beef className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-lg">{meal.protein}g</span>
                    </div>
                    
                    {/* Additional macros - smaller and less prominent */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <span>Carbs: {meal.carbs}g</span>
                      <span>Fat: {meal.fat}g</span>
                      <span>Fiber: {meal.fiber}g</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
