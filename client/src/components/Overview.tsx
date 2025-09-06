import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday } from 'date-fns';
import { Target, Flame, Beef, TrendingUp, Calendar, Zap, Plus, Utensils, Clock, Edit2, Save, X, Loader2, Heart, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { profileAPI, mealsAPI, diaryAPI, favoritesAPI } from '../services/api';
import { generateMealSummary } from '../utils/mealSummary';

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

  // Helper function for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };
  const [loading, setLoading] = useState(true);
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingMeal, setEditingMeal] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
  const [updatingMeal, setUpdatingMeal] = useState(false);
  const [showAddMealForm, setShowAddMealForm] = useState(false);
  const [newMeal, setNewMeal] = useState({
    meal_type: 'breakfast',
    description: ''
  });
  const [manualMacros, setManualMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
  const [addingMeal, setAddingMeal] = useState(false);
  const [favoritingMeal, setFavoritingMeal] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [selectedSavedMeal, setSelectedSavedMeal] = useState<any>(null);
  const [quickAddMealType, setQuickAddMealType] = useState('breakfast');
  const [weekData, setWeekData] = useState<any[]>([]);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [weeklyStats, setWeeklyStats] = useState({
    averageDeficit: 0,
    daysWithData: 0,
    loading: false
  });
  const [lastRefresh, setLastRefresh] = useState(0);

  useEffect(() => {
    loadOverviewData();
    loadFavorites();
    loadWeekData();
  }, []);

  useEffect(() => {
    loadWeekData();
  }, [weekStartDate]);

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

  // Meal editing functions
  const startEditMeal = (meal: MealData) => {
    setEditingMeal(meal.id);
    setEditForm({
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      sugar: meal.sugar,
      sodium: meal.sodium
    });
  };

  const cancelEditMeal = () => {
    setEditingMeal(null);
    setEditForm({
      description: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  };

  const handleEditMeal = async (mealId: number) => {
    setUpdatingMeal(true);
    try {
      await mealsAPI.update(mealId, editForm);
      
      // Update the local state
      setTodayMeals(prev => prev.map(meal => 
        meal.id === mealId ? { ...meal, ...editForm } : meal
      ));
      
      // Refresh overview data to update totals
      await loadOverviewData();
      
      setEditingMeal(null);
      
      // Notify other components about the meal update
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
      
    } catch (error: any) {
      console.error('Failed to update meal:', error);
      alert(error.response?.data?.error || 'Failed to update meal');
    } finally {
      setUpdatingMeal(false);
    }
  };

  // Meal creation functions
  const handleAddMeal = async (isManual: boolean) => {
    if (!newMeal.description.trim()) {
      alert('Please enter a meal description');
      return;
    }

    setAddingMeal(true);
    try {
      const mealData = {
        meal_date: today,
        meal_type: newMeal.meal_type,
        description: newMeal.description,
        ...(isManual ? manualMacros : {})
      };

      await mealsAPI.add(mealData);
      
      // Reset form
      setNewMeal({
        meal_type: 'breakfast',
        description: ''
      });
      setManualMacros({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      });
      setShowAddMealForm(false);
      
      // Refresh data
      await loadOverviewData();
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('mealAdded'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
      
    } catch (error: any) {
      console.error('Failed to add meal:', error);
      alert(error.response?.data?.error || 'Failed to add meal');
    } finally {
      setAddingMeal(false);
    }
  };

  const cancelAddMeal = () => {
    setShowAddMealForm(false);
    setNewMeal({
      meal_type: 'breakfast',
      description: ''
    });
    setManualMacros({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  };

  // Save meal function
  const handleAddToFavorites = async (meal: MealData) => {
    setFavoritingMeal(meal.id);
    try {
      await favoritesAPI.createFromMeal(meal.id);
      // Could add a toast notification here if desired
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert('This meal is already saved');
      } else {
        alert('Failed to save meal');
      }
    } finally {
      setFavoritingMeal(null);
    }
  };

  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const response = await favoritesAPI.getAll();
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSelectFromFavorites = (favorite: any) => {
    setSelectedSavedMeal(favorite);
    setQuickAddMealType(favorite.meal_type); // Default to the saved meal type
    setShowMealTypeSelector(true);
  };

  const handleQuickAddMeal = async () => {
    if (!selectedSavedMeal) return;

    setAddingMeal(true);
    try {
      const mealData = {
        meal_date: today,
        meal_type: quickAddMealType,
        description: selectedSavedMeal.description,
        calories: selectedSavedMeal.calories || 0,
        protein: selectedSavedMeal.protein || 0,
        carbs: selectedSavedMeal.carbs || 0,
        fat: selectedSavedMeal.fat || 0,
        fiber: selectedSavedMeal.fiber || 0,
        sugar: selectedSavedMeal.sugar || 0,
        sodium: selectedSavedMeal.sodium || 0
      };

      await mealsAPI.add(mealData);
      
      // Close modal and reset
      setShowMealTypeSelector(false);
      setSelectedSavedMeal(null);
      setShowAddMealForm(false); // Also close the add meal form if open
      
      // Refresh data
      await loadOverviewData();
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('mealAdded'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
      
    } catch (error: any) {
      console.error('Failed to add meal:', error);
      alert(error.response?.data?.error || 'Failed to add meal');
    } finally {
      setAddingMeal(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowMealTypeSelector(false);
    setSelectedSavedMeal(null);
    setQuickAddMealType('breakfast');
  };

  const loadWeekData = async () => {
    setWeeklyStats(prev => ({ ...prev, loading: true }));
    try {
      const currentWeekStart = startOfWeek(weekStartDate, { weekStartsOn: 0 });
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
      });

      // Get user's profile for goals
      let dailyCalorieGoal = 2000;
      let dailyProteinGoal = 150;
      try {
        const profileResponse = await profileAPI.get();
        if (profileResponse.data.profile?.daily_calories) {
          dailyCalorieGoal = profileResponse.data.profile.daily_calories;
        }
        if (profileResponse.data.profile?.daily_protein) {
          dailyProteinGoal = profileResponse.data.profile.daily_protein;
        }
      } catch (error) {
        console.error('Failed to get profile for goals:', error);
      }

      const weekDataPromises = weekDays.map(async (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        try {
          const response = await mealsAPI.getByDate(dateStr);
          const meals = response.data.meals || [];
          
          const dayTotals = meals.reduce((acc: any, meal: any) => {
            acc.calories += meal.calories || 0;
            acc.protein += meal.protein || 0;
            return acc;
          }, { calories: 0, protein: 0 });

          return {
            date: dateStr,
            dayOfWeek: format(day, 'EEE'),
            dayNumber: format(day, 'd'),
            calories: dayTotals.calories,
            protein: dayTotals.protein,
            caloriesGoal: dailyCalorieGoal,
            proteinGoal: dailyProteinGoal,
            caloriesMet: dayTotals.calories <= dailyCalorieGoal,
            proteinMet: dayTotals.protein >= dailyProteinGoal,
            bothMet: dayTotals.calories <= dailyCalorieGoal && dayTotals.protein >= dailyProteinGoal,
            hasData: meals.length > 0,
            isToday: isToday(day)
          };
        } catch (error) {
          return {
            date: dateStr,
            dayOfWeek: format(day, 'EEE'),
            dayNumber: format(day, 'd'),
            calories: 0,
            protein: 0,
            caloriesGoal: dailyCalorieGoal,
            proteinGoal: dailyProteinGoal,
            caloriesMet: false,
            proteinMet: false,
            bothMet: false,
            hasData: false,
            isToday: isToday(day)
          };
        }
      });

      const weekResults = await Promise.all(weekDataPromises);
      setWeekData(weekResults);

      // Calculate weekly stats
      const daysWithData = weekResults.filter(day => day.hasData);
      const averageDeficit = daysWithData.length > 0 
        ? daysWithData.reduce((sum, day) => sum + (day.caloriesGoal - day.calories), 0) / daysWithData.length
        : 0;

      setWeeklyStats({
        averageDeficit: Math.round(averageDeficit),
        daysWithData: daysWithData.length,
        loading: false
      });

    } catch (error) {
      console.error('Failed to load week data:', error);
      setWeeklyStats(prev => ({ ...prev, loading: false }));
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStartDate(prev => 
      direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7)
    );
  };

  // Remove aggressive auto-refresh - only refresh on user actions or events

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
      const now = Date.now();
      // Throttle refreshing to prevent excessive calls (max once every 2 seconds)
      if (now - lastRefresh > 2000) {
        console.log('Custom event detected, refreshing data...');
        setLastRefresh(now);
        loadOverviewData();
        loadWeekData();
      }
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
      {/* Simple Header with Orange Theme */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Good {getGreeting()}! 👋</h1>
            <p className="text-gray-600">Here's your nutrition snapshot for {format(new Date(), 'MMMM d')}</p>
          </div>
          <div className="text-right">
            <button
              onClick={refreshData}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
            >
              <Zap className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Progress - Simple */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
              <p className="text-sm text-gray-600">Your 7-day nutrition journey</p>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Goals Met</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-gray-600">Partial</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-gray-600">No Data</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {format(startOfWeek(weekStartDate, { weekStartsOn: 0 }), 'MMM d')} - {format(endOfWeek(weekStartDate, { weekStartsOn: 0 }), 'MMM d')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Week Calendar */}
          <div className="flex space-x-3 flex-1 mr-6">
            {weekData.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col items-center p-3 rounded-lg text-xs font-medium transition-colors flex-1 ${
                  day.isToday 
                    ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' 
                    : day.bothMet 
                      ? 'bg-green-100 text-green-800' 
                      : day.hasData 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="text-xs">{day.dayOfWeek}</span>
                <span className="text-sm font-bold">{day.dayNumber}</span>
                {day.hasData && (
                  <div className="text-xs mt-1">
                    <div>{day.calories}cal</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Weekly Stats */}
          <div className="text-right">
            {weeklyStats.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              <>
                <div className={`text-lg font-bold ${
                  weeklyStats.averageDeficit > 0 ? 'text-green-600' : 
                  weeklyStats.averageDeficit < 0 ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {weeklyStats.averageDeficit > 0 ? '-' : weeklyStats.averageDeficit < 0 ? '+' : ''}
                  {Math.abs(weeklyStats.averageDeficit)}
                </div>
                <div className="text-xs text-gray-600">
                  {weeklyStats.averageDeficit > 0 ? 'Deficit' : weeklyStats.averageDeficit < 0 ? 'Surplus' : 'Maintenance'} avg
                </div>
                <div className="text-xs text-gray-500">
                  {weeklyStats.daysWithData}/7 days logged
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Weight Loss/Gain Analysis */}
      {profile.weight && profile.target_weight && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Weight Progress Analysis</h3>
          </div>
          
          <WeightAnalysis 
            currentWeight={profile.weight}
            targetWeight={profile.target_weight}
            dailyCalorieGoal={profile.daily_calories}
          />
        </div>
      )}

      {/* Today's Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            {getStatusIcon(todayNutrition?.calories_met || false)}
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xl font-bold text-gray-900">{currentCalories}</div>
              <div className="text-sm text-orange-600 font-medium">of {caloriesGoal} calories</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Beef className="w-5 h-5 text-green-600" />
            </div>
            {getStatusIcon(todayNutrition?.protein_met || false)}
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xl font-bold text-gray-900">{currentProtein}g</div>
              <div className="text-sm text-green-600 font-medium">of {proteinGoal}g protein</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Calories Left Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xl font-bold text-gray-900">{caloriesRemaining}</div>
              <div className="text-sm text-blue-600 font-medium">calories remaining</div>
            </div>
            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block">
              {Math.round(caloriesProgress)}% complete
            </div>
          </div>
        </div>

        {/* Protein Left Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xl font-bold text-gray-900">{proteinRemaining}g</div>
              <div className="text-sm text-purple-600 font-medium">protein remaining</div>
            </div>
            <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full inline-block">
              {Math.round(proteinProgress)}% complete
            </div>
          </div>
        </div>
      </div>

       {/* Additional Nutrients - Simplified */}
       <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
         <div className="flex items-center mb-4">
           <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
             <BarChart3 className="w-4 h-4 text-purple-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900">Other Nutrients</h3>
         </div>
         <div className="grid grid-cols-5 gap-4">
           <div className="text-center">
             <div className="text-xl font-bold text-purple-600">{todayNutrition?.total_carbs || 0}g</div>
             <div className="text-xs text-gray-500 mt-1">Carbs</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-bold text-yellow-600">{todayNutrition?.total_fat || 0}g</div>
             <div className="text-xs text-gray-500 mt-1">Fat</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-bold text-green-600">{todayNutrition?.total_fiber || 0}g</div>
             <div className="text-xs text-gray-500 mt-1">Fiber</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-bold text-pink-600">{todayNutrition?.total_sugar || 0}g</div>
             <div className="text-xs text-gray-500 mt-1">Sugar</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-bold text-indigo-600">{todayNutrition?.total_sodium || 0}mg</div>
             <div className="text-xs text-gray-500 mt-1">Sodium</div>
           </div>
         </div>
       </div>

      {/* Quick Actions - Simple Style */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <Zap className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/inputs'}
            className="flex items-center space-x-4 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Add Meal</div>
              <div className="text-sm text-gray-600">Log your nutrition</div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard/profile'}
            className="flex items-center space-x-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Update Goals</div>
              <div className="text-sm text-gray-600">Adjust your targets</div>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Meals */}
      {todayMeals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Meals</h3>
            <button
              onClick={() => setShowAddMealForm(!showAddMealForm)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddMealForm ? 'Cancel' : 'Add Meal'}</span>
            </button>
          </div>
          
          {/* Add Meal Form */}
          {showAddMealForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Meal</h4>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={newMeal.meal_type}
                      onChange={(e) => setNewMeal(prev => ({ ...prev, meal_type: e.target.value }))}
                      className="input"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Description
                    </label>
                    <input
                      type="text"
                      value={newMeal.description}
                      onChange={(e) => setNewMeal(prev => ({ ...prev, description: e.target.value }))}
                      className="input"
                      placeholder="e.g., Grilled chicken breast with brown rice and vegetables"
                      required
                    />
                  </div>
                </div>
                
                {/* AI Analysis Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>AI will analyze your meal and calculate all nutrition values</span>
                </div>
                
                {/* Two buttons side by side */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleAddMeal(false)}
                    disabled={addingMeal}
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    {addingMeal ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Analyzing meal...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Add Meal Using AI</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAddMeal(true)}
                    disabled={addingMeal}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {addingMeal ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Adding meal...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add Manual Entry</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Manual Macros Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Manual Nutrition Values (Optional)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Calories</label>
                      <input
                        type="number"
                        value={manualMacros.calories}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, calories: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={manualMacros.protein}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, protein: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualMacros.carbs}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={manualMacros.fat}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, fat: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={manualMacros.fiber}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, fiber: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sugar (g)</label>
                      <input
                        type="number"
                        value={manualMacros.sugar}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, sugar: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={manualMacros.sodium}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, sodium: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={cancelAddMeal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="p-4 bg-gray-50 rounded-lg">
                {editingMeal === meal.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Edit Meal</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditMeal(meal.id)}
                          disabled={updatingMeal}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {updatingMeal ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEditMeal}
                          disabled={updatingMeal}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="input w-full"
                        placeholder="Meal description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Calories</label>
                        <input
                          type="number"
                          value={editForm.calories}
                          onChange={(e) => setEditForm(prev => ({ ...prev, calories: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                        <input
                          type="number"
                          value={editForm.protein}
                          onChange={(e) => setEditForm(prev => ({ ...prev, protein: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          value={editForm.carbs}
                          onChange={(e) => setEditForm(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fat (g)</label>
                        <input
                          type="number"
                          value={editForm.fat}
                          onChange={(e) => setEditForm(prev => ({ ...prev, fat: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fiber (g)</label>
                        <input
                          type="number"
                          value={editForm.fiber}
                          onChange={(e) => setEditForm(prev => ({ ...prev, fiber: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sugar (g)</label>
                        <input
                          type="number"
                          value={editForm.sugar}
                          onChange={(e) => setEditForm(prev => ({ ...prev, sugar: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (mg)</label>
                        <input
                          type="number"
                          value={editForm.sodium}
                          onChange={(e) => setEditForm(prev => ({ ...prev, sodium: Number(e.target.value) }))}
                          className="input text-sm w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
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
                        <p className="text-gray-900 font-medium">{generateMealSummary(meal.description)}</p>
                        <p className="text-xs text-gray-500 mt-1" title={meal.description}>
                          {meal.description.length > 40 ? `${meal.description.substring(0, 40)}...` : meal.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
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
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAddToFavorites(meal)}
                          disabled={favoritingMeal === meal.id}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                          title="Save meal for quick access later"
                        >
                          {favoritingMeal === meal.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Heart className="h-3 w-3" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => startEditMeal(meal)}
                          className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                          title="Edit meal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
        </div>
      )}

      {/* Add Meal Section when no meals exist */}
      {todayMeals.length === 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Your First Meal Today</h3>
            <button
              onClick={() => setShowAddMealForm(!showAddMealForm)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddMealForm ? 'Cancel' : 'Add Meal'}</span>
            </button>
          </div>
          
          {/* Add Meal Form */}
          {showAddMealForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Meal</h4>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={newMeal.meal_type}
                      onChange={(e) => setNewMeal(prev => ({ ...prev, meal_type: e.target.value }))}
                      className="input"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Description
                    </label>
                    <input
                      type="text"
                      value={newMeal.description}
                      onChange={(e) => setNewMeal(prev => ({ ...prev, description: e.target.value }))}
                      className="input"
                      placeholder="e.g., Grilled chicken breast with brown rice and vegetables"
                      required
                    />
                  </div>
                </div>
                
                {/* AI Analysis Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>AI will analyze your meal and calculate all nutrition values</span>
                </div>
                
                {/* Two buttons side by side */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleAddMeal(false)}
                    disabled={addingMeal}
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    {addingMeal ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Analyzing meal...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Add Meal Using AI</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAddMeal(true)}
                    disabled={addingMeal}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {addingMeal ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Adding meal...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add Manual Entry</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Manual Macros Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Manual Nutrition Values (Optional)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Calories</label>
                      <input
                        type="number"
                        value={manualMacros.calories}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, calories: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={manualMacros.protein}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, protein: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualMacros.carbs}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={manualMacros.fat}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, fat: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={manualMacros.fiber}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, fiber: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sugar (g)</label>
                      <input
                        type="number"
                        value={manualMacros.sugar}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, sugar: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={manualMacros.sodium}
                        onChange={(e) => setManualMacros(prev => ({ ...prev, sodium: Number(e.target.value) }))}
                        className="input text-sm w-full"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={cancelAddMeal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showAddMealForm && (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No meals logged today</p>
              <p className="text-sm">Click "Add Meal" to start tracking your nutrition</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Overview;
