import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { diaryAPI, mealsAPI, profileAPI } from '../services/api';

interface DayData {
  date: string;
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
  meal_count: number;
  has_data: boolean;
}

interface MonthData {
  year: number;
  month: number;
  days: DayData[];
}

const Diary: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<{
    averageDeficit: number;
    weeklyWeightChange: number;
    loading: boolean;
    userWantsToLoseWeight: boolean;
  }>({
    averageDeficit: 0,
    weeklyWeightChange: 0,
    loading: true,
    userWantsToLoseWeight: true
  });

  useEffect(() => {
    loadMonthData();
    loadWeeklyProgress();
  }, [currentDate]);

  const loadWeeklyProgress = async (retryCount = 0) => {
    try {
      setWeeklyProgress(prev => ({ ...prev, loading: true }));
      
      // Get the past 7 days
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      
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
      
             // Get user's daily calorie goal and weight goals from profile
       let dailyCalorieGoal = 2000; // Default fallback
       let userWantsToLoseWeight = true; // Default assumption
       try {
         const profileResponse = await profileAPI.get();
         if (profileResponse.data.profile?.daily_calories) {
           dailyCalorieGoal = profileResponse.data.profile.daily_calories;
         }
         if (profileResponse.data.profile?.weight && profileResponse.data.profile?.target_weight) {
           userWantsToLoseWeight = profileResponse.data.profile.weight > profileResponse.data.profile.target_weight;
         }
       } catch (error) {
         console.error('Failed to get profile for calorie goal:', error);
       }
      
      const dailyDeficits = Object.values(dailyTotals).map((totals: any) => 
        dailyCalorieGoal - totals.calories
      );
      
      const averageDeficit = dailyDeficits.length > 0 
        ? dailyDeficits.reduce((sum, deficit) => sum + deficit, 0) / dailyDeficits.length
        : 0;
      
             // Calculate weekly weight change: (average deficit * 7) / 3500
       // Positive deficit = weight loss, Negative deficit = weight gain
       const weeklyWeightChange = -(averageDeficit * 7) / 3500;
      
             setWeeklyProgress({
         averageDeficit,
         weeklyWeightChange,
         loading: false,
         userWantsToLoseWeight
       });
    } catch (error) {
      console.error('Failed to load weekly progress:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (error instanceof Error && (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')))) {
        console.log(`Retrying weekly progress load (attempt ${retryCount + 1})...`);
        setTimeout(() => loadWeeklyProgress(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setWeeklyProgress(prev => ({ ...prev, loading: false }));
    }
  };

  const loadMonthData = async (retryCount = 0) => {
    setLoading(true);
    try {
      const year: number = currentDate.getFullYear();
      const month: number = currentDate.getMonth() + 1;
      
      // Get the first and last day of the month
      const startDate: string = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay: number = new Date(year, month, 0).getDate();
      const endDate: string = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      // Get meals for the entire month
      const response = await mealsAPI.getByRange(startDate, endDate);
      const meals = response.data.meals || [];
      
      // Get user's profile for goals
      let dailyCalorieGoal: number = 2000;
      let dailyProteinGoal: number = 150;
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
      
      // Group meals by date and calculate daily totals
      const dailyTotals = meals.reduce((acc: any, meal: any) => {
        const date = meal.meal_date;
        if (!acc[date]) {
          acc[date] = { 
            calories: 0, 
            protein: 0, 
            carbs: 0, 
            fat: 0, 
            fiber: 0, 
            sugar: 0, 
            sodium: 0,
            meal_count: 0
          };
        }
        acc[date].calories += meal.calories || 0;
        acc[date].protein += meal.protein || 0;
        acc[date].carbs += meal.carbs || 0;
        acc[date].fat += meal.fat || 0;
        acc[date].fiber += meal.fiber || 0;
        acc[date].sugar += meal.sugar || 0;
        acc[date].sodium += meal.sodium || 0;
        acc[date].meal_count += 1;
        return acc;
      }, {});
      
      // Create month data structure
      const monthData: MonthData = {
        year,
        month,
        days: []
      };
      
      // Generate all days in the month
      const loopDate = new Date(startDate);
      while (loopDate <= new Date(endDate)) {
        const dateStr = loopDate.toISOString().split('T')[0];
        const dayData = dailyTotals[dateStr];
        
        if (dayData) {
          // Day has meal data
          monthData.days.push({
            date: dateStr,
            total_calories: dayData.calories,
            total_protein: dayData.protein,
            total_carbs: dayData.carbs,
            total_fat: dayData.fat,
            total_fiber: dayData.fiber,
            total_sugar: dayData.sugar,
            total_sodium: dayData.sodium,
            calories_goal: dailyCalorieGoal,
            protein_goal: dailyProteinGoal,
            calories_met: dayData.calories <= dailyCalorieGoal,
            protein_met: dayData.protein >= dailyProteinGoal,
            meal_count: dayData.meal_count,
            has_data: true
          });
        } else {
          // Day has no meal data
          monthData.days.push({
            date: dateStr,
            total_calories: 0,
            total_protein: 0,
            total_carbs: 0,
            total_fat: 0,
            total_fiber: 0,
            total_sugar: 0,
            total_sodium: 0,
            calories_goal: dailyCalorieGoal,
            protein_goal: dailyProteinGoal,
            calories_met: false,
            protein_met: false,
            meal_count: 0,
            has_data: false
          });
        }
        
        loopDate.setDate(loopDate.getDate() + 1);
      }
      
      setMonthData(monthData);
    } catch (error) {
      console.error('Failed to load month data:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (error instanceof Error && (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')))) {
        console.log(`Retrying month data load (attempt ${retryCount + 1})...`);
        setTimeout(() => loadMonthData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getDayStatus = (day: DayData) => {
    if (!day.has_data) return 'no-data';
    if (day.calories_met && day.protein_met) return 'both-met';
    if (day.calories_met || day.protein_met) return 'partial';
    return 'none-met';
  };

  const getDayColor = (day: DayData) => {
    const status = getDayStatus(day);
    switch (status) {
      case 'both-met':
        return 'bg-success-500 text-white';
      case 'partial':
        return 'bg-warning-500 text-white';
      case 'none-met':
        return 'bg-danger-500 text-white';
      default:
        return 'bg-gray-100 text-gray-400';
    }
  };

  const getProgressColor = (isPositive: boolean, isGoodForGoal: boolean) => {
    if (isGoodForGoal) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const handleDateClick = async (date: string) => {
    setSelectedDate(date);
    try {
      // Get meals for the selected date
      const response = await mealsAPI.getByDate(date);
      const meals = response.data.meals || [];
      
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
      
      // Calculate daily totals
      const dailyTotals = meals.reduce((acc: any, meal: any) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        acc.fiber += meal.fiber || 0;
        acc.sugar += meal.sugar || 0;
        acc.sodium += meal.sodium || 0;
        return acc;
      }, {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      });
      
      const dayData = {
        date,
        total_calories: dailyTotals.calories,
        total_protein: dailyTotals.protein,
        total_carbs: dailyTotals.carbs,
        total_fat: dailyTotals.fat,
        total_fiber: dailyTotals.fiber,
        total_sugar: dailyTotals.sugar,
        total_sodium: dailyTotals.sodium,
        calories_goal: dailyCalorieGoal,
        protein_goal: dailyProteinGoal,
        calories_met: dailyTotals.calories <= dailyCalorieGoal,
        protein_met: dailyTotals.protein >= dailyProteinGoal,
        meal_count: meals.length,
        has_data: meals.length > 0
      };
      
      setSelectedDayData(dayData);
    } catch (error) {
      console.error('Failed to load date data:', error);
    }
  };

  const renderCalendar = () => {
    if (!monthData) return null;

    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Get the first day of the month to determine padding
    const firstDayOfMonth = start.getDay();
    const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Padding days */}
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="p-2" />
        ))}
        
        {/* Calendar days */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = monthData.days.find(d => d.date === dateStr);
          const isCurrentDay = isToday(day);
          
          return (
            <button
              key={day.toString()}
              onClick={() => handleDateClick(dateStr)}
              className={`
                p-2 h-16 text-sm font-medium rounded-lg transition-all duration-200
                ${getDayColor(dayData || { has_data: false } as DayData)}
                ${isCurrentDay ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
            >
              <div className="text-center">
                <div className="font-semibold">{format(day, 'd')}</div>
                                 {dayData?.has_data && (
                   <div className="text-xs opacity-75">
                     {dayData.total_calories} cal
                   </div>
                 )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Nutrition Diary</h2>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-orange-500" />
          <span className="text-sm text-gray-600 font-medium">Track your daily nutrition goals</span>
        </div>
      </div>

      {/* Weekly Progress Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-6 w-6 text-orange-600" />
          <h3 className="text-xl font-bold text-orange-900">Weekly Progress Analysis</h3>
        </div>
        
        {weeklyProgress.loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Daily Deficit/Surplus */}
            <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">Average Daily Calorie</h4>
                {weeklyProgress.averageDeficit > 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : weeklyProgress.averageDeficit < 0 ? (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-500" />
                )}
              </div>
                             <div className="text-center">
                 <div className={`text-2xl font-bold ${
                   weeklyProgress.averageDeficit === 0 
                     ? 'text-gray-600'
                     : getProgressColor(
                         weeklyProgress.averageDeficit > 0,
                         (weeklyProgress.averageDeficit > 0) === weeklyProgress.userWantsToLoseWeight
                       )
                 }`}>
                   {weeklyProgress.averageDeficit > 0 ? '-' : weeklyProgress.averageDeficit < 0 ? '+' : ''}{Math.abs(weeklyProgress.averageDeficit).toFixed(0)}
                 </div>
                 <div className="text-sm text-gray-600">
                   {weeklyProgress.averageDeficit > 0 ? 'Deficit' : weeklyProgress.averageDeficit < 0 ? 'Surplus' : 'Maintenance'} calories
                 </div>
               </div>
            </div>
            
                         {/* Weekly Weight Change */}
             <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-md">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="font-semibold text-gray-700">Weekly Weight Change</h4>
                 {weeklyProgress.weeklyWeightChange > 0 ? (
                   <TrendingUp className="h-5 w-5 text-orange-600" />
                 ) : weeklyProgress.weeklyWeightChange < 0 ? (
                   <TrendingDown className="h-5 w-5 text-green-600" />
                 ) : (
                   <Minus className="h-5 w-5 text-gray-500" />
                 )}
               </div>
               <div className="text-center">
                 <div className={`text-2xl font-bold ${
                   weeklyProgress.weeklyWeightChange === 0 
                     ? 'text-gray-600'
                     : getProgressColor(
                         weeklyProgress.weeklyWeightChange > 0,
                         (weeklyProgress.weeklyWeightChange > 0) !== weeklyProgress.userWantsToLoseWeight
                       )
                 }`}>
                   {weeklyProgress.weeklyWeightChange > 0 ? '+' : ''}{Math.abs(weeklyProgress.weeklyWeightChange).toFixed(2)}
                 </div>
                 <div className="text-sm text-gray-600">
                   {weeklyProgress.weeklyWeightChange > 0 ? 'Gain' : weeklyProgress.weeklyWeightChange < 0 ? 'Loss' : 'No Change'} per week (lbs)
                 </div>
               </div>
             </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="text-xs text-orange-700">
            <strong>Calculation:</strong> Based on your average daily calorie {weeklyProgress.averageDeficit > 0 ? 'deficit' : weeklyProgress.averageDeficit < 0 ? 'surplus' : 'maintenance'} over the past 7 days. 
            Weekly weight change = (Average daily {weeklyProgress.averageDeficit > 0 ? 'deficit' : weeklyProgress.averageDeficit < 0 ? 'surplus' : 'balance'} × 7) ÷ 3,500 calories per pound.
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-600 rounded-xl font-medium transition-all duration-200 hover:bg-orange-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>
        
        <h3 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-600 rounded-xl font-medium transition-all duration-200 hover:bg-orange-50"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">Both goals met</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">One goal met</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">No goals met</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">No data</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDayData && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg border border-orange-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Calories</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Consumed:</span>
                  <span className="font-medium">{selectedDayData.total_calories}</span>
                </div>
                <div className="flex justify-between">
                  <span>Goal:</span>
                  <span className="font-medium">{selectedDayData.calories_goal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    selectedDayData.calories_met ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {selectedDayData.calories_met ? 'Met ✓' : 'Not Met ✗'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Protein</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Consumed:</span>
                  <span className="font-medium">{selectedDayData.total_protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Goal:</span>
                  <span className="font-medium">{selectedDayData.protein_goal}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    selectedDayData.protein_met ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {selectedDayData.protein_met ? 'Met ✓' : 'Not Met ✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {selectedDayData.meal_count > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{selectedDayData.meal_count}</span> meal{selectedDayData.meal_count !== 1 ? 's' : ''} logged
              </p>
            </div>
          )}
          
          {/* Additional Macros - Secondary Focus */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Additional Nutrients</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900">{selectedDayData.total_carbs || 0}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900">{selectedDayData.total_fat || 0}g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900">{selectedDayData.total_fiber || 0}g</div>
                <div className="text-xs text-gray-500">Fiber</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900">{selectedDayData.total_sugar || 0}g</div>
                <div className="text-xs text-gray-500">Sugar</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900">{selectedDayData.total_sodium || 0}mg</div>
                <div className="text-xs text-gray-500">Sodium</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diary;
