import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Loader2, Trash2, Utensils, Calendar, Zap, Beef, Heart, HeartOff, X } from 'lucide-react';
import { mealsAPI, favoritesAPI } from '../services/api';
import { generateMealSummary } from '../utils/mealSummary';

interface Meal {
  id: number;
  mealDate: string;
  mealType: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  createdAt: string;
}

const Inputs: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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

  const [message, setMessage] = useState('');
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
  const [favoritingMeal, setFavoritingMeal] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [selectedSavedMeal, setSelectedSavedMeal] = useState<any>(null);
  const [quickAddMealType, setQuickAddMealType] = useState('breakfast');

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string, formatString: string) => {
    try {
      if (!dateString) return 'N/A';
      const parsedDate = parseISO(dateString);
      if (isNaN(parsedDate.getTime())) return 'Invalid Date';
      return format(parsedDate, formatString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const response = await mealsAPI.getByDate(selectedDate);
      setMeals(response.data || []);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoading(false);
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
    setQuickAddMealType(favorite.mealType); // Default to the saved meal type
    setShowMealTypeSelector(true);
  };

  const handleQuickAddMeal = async () => {
    if (!selectedSavedMeal) return;

    setAddingMeal(true);
    try {
      const mealData = {
        mealDate: selectedDate,
        mealType: quickAddMealType,
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
      await loadMeals(); // Reload meals after adding
      
      // Close modal and reset
      setShowMealTypeSelector(false);
      setSelectedSavedMeal(null);
      
      setMessage(`Added "${selectedSavedMeal.name}" as ${quickAddMealType}!`);
      setTimeout(() => setMessage(''), 3000);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('mealAdded'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
      
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to add meal');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setAddingMeal(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowMealTypeSelector(false);
    setSelectedSavedMeal(null);
    setQuickAddMealType('breakfast');
  };

  const handleAddMeal = async (isManual: boolean) => {
    if (!newMeal.description.trim()) {
      setMessage('Please enter a meal description');
      return;
    }

    setAddingMeal(true);
    setMessage('');
    
    try {
      let mealData: any = {
        mealDate: selectedDate,
        mealType: newMeal.meal_type,
        description: newMeal.description
      };

      // If using manual entry, include the macros
      if (isManual) {
        mealData = {
          ...mealData,
          calories: manualMacros.calories,
          protein: manualMacros.protein,
          carbs: manualMacros.carbs,
          fat: manualMacros.fat,
          fiber: manualMacros.fiber,
          sugar: manualMacros.sugar,
          sodium: manualMacros.sodium
        };
      }

      const response = await mealsAPI.add(mealData);
      
      // Reload meals from server to ensure consistency
      await loadMeals();
      
      // Reset form
      setNewMeal({ meal_type: 'breakfast', description: '' });
      setManualMacros({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      });
      setMessage('Meal added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Notify other tabs that a meal was added
      localStorage.setItem('mealAdded', Date.now().toString());
      
      // Also trigger custom events for the same tab
      console.log('🍽️ Inputs: Dispatching meal added events IMMEDIATELY');
      
      window.dispatchEvent(new CustomEvent('mealAdded'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
      
      console.log('🍽️ Inputs: All events dispatched!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to add meal');
    } finally {
      setAddingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    try {
      await mealsAPI.delete(mealId);
      setMeals(prev => prev.filter(meal => meal.id !== mealId));
      setMessage('Meal deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Notify other tabs that a meal was deleted
      localStorage.setItem('mealDeleted', Date.now().toString());
      
      // Also trigger custom events for the same tab
      console.log('🍽️ Inputs: Dispatching meal deleted events');
      window.dispatchEvent(new CustomEvent('mealDeleted'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      
      // Force sidebar and calendar refresh
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to delete meal');
    }
  };

  const handleAddToFavorites = async (meal: Meal) => {
    setFavoritingMeal(meal.id);
    try {
      await favoritesAPI.createFromMeal(meal.id);
      setMessage('Meal saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Reload favorites to update the count and list
      await loadFavorites();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setMessage('This meal is already saved');
      } else {
        setMessage(error.response?.data?.error || 'Failed to save meal');
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setFavoritingMeal(null);
    }
  };

  const startEditMeal = (meal: Meal) => {
    setEditingMeal(meal.id);
    setEditForm({
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      fiber: meal.fiber || 0,
      sugar: meal.sugar || 0,
      sodium: meal.sodium || 0
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
    try {
      const response = await mealsAPI.update(mealId, editForm);
      
      // Reload meals from server to ensure consistency
      await loadMeals();
      setMessage('Meal updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setEditingMeal(null);
      
      // Notify other tabs that a meal was updated
      localStorage.setItem('mealUpdated', Date.now().toString());
      
      // Also trigger custom events for the same tab
      console.log('🍽️ Inputs: Dispatching meal updated events');
      window.dispatchEvent(new CustomEvent('mealUpdated'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
      
      // Force sidebar and calendar refresh
      window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      window.dispatchEvent(new CustomEvent('calendarRefresh'));
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update meal');
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-800';
      case 'lunch':
        return 'bg-yellow-100 text-yellow-800';
      case 'dinner':
        return 'bg-blue-100 text-blue-800';
      case 'snack':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDailyTotals = () => {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0),
      fiber: totals.fiber + (meal.fiber || 0),
      sugar: totals.sugar + (meal.sugar || 0),
      sodium: totals.sodium + (meal.sodium || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
  };

  const dailyTotals = calculateDailyTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Meal Inputs</h2>
        <div className="flex items-center space-x-2">
          <Utensils className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Add and track your meals</span>
        </div>
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

      {/* Date Selection */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
        </div>
        
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Add New Meal */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Add New Meal</h3>
        </div>
        
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
          
          {/* Saved Meals Selection */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Or select from saved meals
              </label>
              <button
                type="button"
                onClick={() => setShowFavorites(!showFavorites)}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                {showFavorites ? 'Hide' : 'Show'} Saved Meals ({favorites.length})
              </button>
            </div>
            
            {showFavorites && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loadingFavorites ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    <span className="ml-2 text-sm text-gray-600">Loading saved meals...</span>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No saved meals yet</p>
                    <p>Save meals using the "Save" button to quickly select them here</p>
                  </div>
                ) : (
                  favorites.map((favorite) => (
                    <div
                      key={favorite.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleSelectFromFavorites(favorite)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{favorite.meal_type === 'breakfast' ? '🍳' : favorite.meal_type === 'lunch' ? '🥗' : favorite.meal_type === 'dinner' ? '🍽️' : '🍎'}</span>
                          <span className="font-medium text-gray-900">{favorite.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            favorite.meal_type === 'breakfast' ? 'bg-yellow-100 text-yellow-800' :
                            favorite.meal_type === 'lunch' ? 'bg-green-100 text-green-800' :
                            favorite.meal_type === 'dinner' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {favorite.meal_type.charAt(0).toUpperCase() + favorite.meal_type.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {favorite.calories} cal • {favorite.protein}g protein
                        </div>
                      </div>
                      <div className="text-primary-600 hover:text-primary-700">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
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
                  <Utensils className="h-4 w-4" />
                  <span>Add Meal Manually</span>
                </>
              )}
            </button>
          </div>
          
          {/* Manual Entry Fields - Always visible */}
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
            <h4 className="font-medium text-green-800 flex items-center space-x-2">
              <Utensils className="h-4 w-4" />
              <span>Enter Nutrition Values (for manual entry)</span>
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Calories</label>
                <input
                  type="number"
                  value={manualMacros.calories || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, calories: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={manualMacros.protein || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={manualMacros.carbs || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={manualMacros.fat || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Fiber (g)</label>
                <input
                  type="number"
                  value={manualMacros.fiber || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, fiber: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              
                              <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">Sugar (g)</label>
                  <input
                    type="number"
                    value={manualMacros.sugar || ''}
                    onChange={(e) => setManualMacros(prev => ({ ...prev, sugar: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Sodium (mg)</label>
                <input
                  type="number"
                  value={manualMacros.sodium || ''}
                  onChange={(e) => setManualMacros(prev => ({ ...prev, sodium: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Daily Summary */}
      {meals.length > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800 mb-4">Daily Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{meals.length}</div>
              <div className="text-sm text-primary-700">Meals</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{dailyTotals.calories}</div>
              <div className="text-sm text-primary-700">Calories</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{dailyTotals.protein}g</div>
              <div className="text-sm text-primary-700">Protein</div>
            </div>
          </div>
          
          {/* Additional macros - secondary focus */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-primary-200">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600">{dailyTotals.carbs}g</div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600">{dailyTotals.fat}g</div>
              <div className="text-xs text-gray-500">Fat</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600">{dailyTotals.fiber}g</div>
              <div className="text-xs text-gray-500">Fiber</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600">{dailyTotals.sugar}g</div>
              <div className="text-xs text-gray-500">Sugar</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600">{dailyTotals.sodium}mg</div>
              <div className="text-xs text-gray-500">Sodium</div>
            </div>
          </div>
        </div>
      )}

      {/* Meals List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Meals for {safeFormatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No meals logged for this date</p>
            <p className="text-sm">Add your first meal above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <div key={meal.id} className="p-4 bg-gray-50 rounded-lg">
                {editingMeal === meal.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getMealTypeIcon(meal.mealType)}</div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.mealType)}`}>
                            {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description field for editing */}
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
                    
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={cancelEditMeal}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditMeal(meal.id)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getMealTypeIcon(meal.mealType)}</div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.mealType)}`}>
                            {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {safeFormatDate(meal.createdAt, 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {generateMealSummary(meal.description)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1" title={meal.description}>
                          {meal.description.length > 50 ? `${meal.description.substring(0, 50)}...` : meal.description}
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
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                          title="Edit meal"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="text-gray-400 hover:text-danger-600 transition-colors"
                          title="Delete meal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Type Selector Modal */}
      {showMealTypeSelector && selectedSavedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Saved Meal</h3>
              <button
                onClick={cancelQuickAdd}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">
                  {selectedSavedMeal.meal_type === 'breakfast' ? '🍳' : 
                   selectedSavedMeal.meal_type === 'lunch' ? '🥗' : 
                   selectedSavedMeal.meal_type === 'dinner' ? '🍽️' : '🍎'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedSavedMeal.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedSavedMeal.calories} cal • {selectedSavedMeal.protein}g protein
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select meal type for today:
              </label>
              <select
                value={quickAddMealType}
                onChange={(e) => setQuickAddMealType(e.target.value)}
                className="input w-full"
              >
                <option value="breakfast">🍳 Breakfast</option>
                <option value="lunch">🥗 Lunch</option>
                <option value="dinner">🍽️ Dinner</option>
                <option value="snack">🍎 Snack</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelQuickAdd}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddMeal}
                disabled={addingMeal}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {addingMeal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add Meal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inputs;
