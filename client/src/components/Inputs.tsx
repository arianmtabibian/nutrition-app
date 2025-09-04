import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Loader2, Trash2, Utensils, Calendar, Zap, Beef } from 'lucide-react';
import { mealsAPI } from '../services/api';

interface Meal {
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
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });

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

  const loadMeals = async () => {
    setLoading(true);
    try {
      const response = await mealsAPI.getByDate(selectedDate);
      setMeals(response.data.meals || []);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoading(false);
    }
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
        meal_date: selectedDate,
        meal_type: newMeal.meal_type,
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
      
      // Add the new meal to the list
      const addedMeal = response.data.meal;
      setMeals(prev => [...prev, addedMeal]);
      
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
      window.dispatchEvent(new CustomEvent('mealAdded'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
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
      window.dispatchEvent(new CustomEvent('mealDeleted'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to delete meal');
    }
  };

  const startEditMeal = (meal: Meal) => {
    setEditingMeal(meal.id);
    setEditForm({
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
      setMeals(prev => prev.map(meal => 
        meal.id === mealId ? response.data.meal : meal
      ));
      setMessage('Meal updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setEditingMeal(null);
      
      // Notify other tabs that a meal was updated
      localStorage.setItem('mealUpdated', Date.now().toString());
      
      // Also trigger custom events for the same tab
      window.dispatchEvent(new CustomEvent('mealUpdated'));
      window.dispatchEvent(new CustomEvent('mealDataChanged'));
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
                        <div className="text-2xl">{getMealTypeIcon(meal.meal_type)}</div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.meal_type)}`}>
                            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                          </span>
                          <p className="text-gray-900 font-medium mt-1">{meal.description}</p>
                        </div>
                      </div>
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
                      <div className="text-2xl">{getMealTypeIcon(meal.meal_type)}</div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.meal_type)}`}>
                            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {safeFormatDate(meal.created_at, 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{meal.description}</p>
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
    </div>
  );
};

export default Inputs;
