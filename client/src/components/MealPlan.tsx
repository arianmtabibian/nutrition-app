import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ChefHat, 
  Calendar,
  Clock,
  Target,
  Apple,
  Utensils,
  Heart,
  Zap,
  Coffee,
  Sun,
  Moon,
  User,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

const MealPlan: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'weekly'>('chat');
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'assistant',
      content: `Hi ${user?.first_name || 'there'}! 👋 I'm your AI nutrition assistant. I'm here to help you plan healthy, delicious meals that fit your lifestyle and goals. 

What would you like help with today? I can:
• Create personalized meal plans
• Suggest recipes based on your preferences
• Help with nutritional guidance
• Plan meals for specific dietary needs
• Calculate portions and macros

Just ask me anything about meal planning!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);

    // Load sample meal suggestions
    setMealSuggestions([
      {
        id: '1',
        title: 'Mediterranean Quinoa Bowl',
        description: 'Fresh quinoa with grilled vegetables, feta cheese, and olive oil dressing',
        calories: 420,
        protein: 18,
        carbs: 45,
        fat: 16,
        mealType: 'lunch',
        prepTime: 25,
        difficulty: 'easy',
        tags: ['Mediterranean', 'Vegetarian', 'High Protein']
      },
      {
        id: '2',
        title: 'Overnight Protein Oats',
        description: 'Creamy oats with protein powder, berries, and almond butter',
        calories: 380,
        protein: 25,
        carbs: 42,
        fat: 12,
        mealType: 'breakfast',
        prepTime: 5,
        difficulty: 'easy',
        tags: ['High Protein', 'Make Ahead', 'Healthy']
      },
      {
        id: '3',
        title: 'Herb-Crusted Salmon',
        description: 'Baked salmon with herbs, served with roasted vegetables',
        calories: 450,
        protein: 35,
        carbs: 15,
        fat: 28,
        mealType: 'dinner',
        prepTime: 30,
        difficulty: 'medium',
        tags: ['High Protein', 'Omega-3', 'Low Carb']
      }
    ]);
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (in real implementation, this would call your AI service)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('breakfast') || lowerInput.includes('morning')) {
      return `Great question about breakfast! 🌅 Here are some nutritious breakfast ideas:

• **Protein-packed options**: Greek yogurt with berries and nuts, scrambled eggs with vegetables, or protein smoothie bowls
• **Energy boosters**: Overnight oats with chia seeds, avocado toast with eggs, or quinoa breakfast bowls
• **Quick options**: Protein bars with fruit, hard-boiled eggs with whole grain toast

Would you like me to create a specific breakfast meal plan for you? I can customize it based on your calorie goals and dietary preferences!`;
    }
    
    if (lowerInput.includes('lunch') || lowerInput.includes('midday')) {
      return `Perfect timing for lunch planning! 🥗 Here are some balanced lunch ideas:

• **Power bowls**: Quinoa bowls with grilled protein and vegetables
• **Wraps & sandwiches**: Whole grain wraps with lean protein and lots of veggies
• **Salads**: Mixed greens with protein, healthy fats, and complex carbs
• **Soups**: Lentil or chicken vegetable soups with whole grain bread

Each option provides sustained energy for your afternoon. What type of flavors do you enjoy most?`;
    }
    
    if (lowerInput.includes('dinner') || lowerInput.includes('evening')) {
      return `Dinner is such an important meal! 🍽️ Here are some satisfying dinner ideas:

• **Lean proteins**: Grilled salmon, chicken breast, or plant-based proteins like tofu
• **Complex carbs**: Sweet potatoes, brown rice, or quinoa
• **Vegetables**: Roasted seasonal vegetables, steamed broccoli, or fresh salads
• **Healthy fats**: Avocado, olive oil, or nuts and seeds

I can help you plan a week of dinners that are both nutritious and delicious. What's your preferred cooking time - quick 20-minute meals or do you enjoy longer cooking sessions?`;
    }
    
    if (lowerInput.includes('weight loss') || lowerInput.includes('lose weight')) {
      return `I'd be happy to help with weight loss meal planning! 🎯 Here's my approach:

• **Calorie balance**: Creating a moderate deficit while ensuring adequate nutrition
• **Protein focus**: Higher protein meals to maintain muscle and increase satiety
• **Fiber-rich foods**: Vegetables, fruits, and whole grains to keep you full
• **Meal timing**: Regular meals to maintain steady energy levels

The key is creating sustainable habits rather than restrictive diets. Would you like me to suggest some specific low-calorie, high-nutrition meals that still taste amazing?`;
    }
    
    if (lowerInput.includes('muscle') || lowerInput.includes('protein') || lowerInput.includes('gain')) {
      return `Excellent focus on muscle building! 💪 Here's how I can help with high-protein meal planning:

• **Protein targets**: Aiming for 0.8-1g protein per lb of body weight
• **Complete proteins**: Combining different protein sources throughout the day
• **Post-workout meals**: Timing protein intake around your training
• **Variety**: Keeping meals interesting with different protein sources

Some great high-protein options include Greek yogurt bowls, lean meat dishes, legume-based meals, and protein smoothies. What's your current protein goal, and do you have any dietary restrictions?`;
    }
    
    // Default response for general queries
    return `That's a great question! 🤔 I'm here to help you with all aspects of meal planning and nutrition. 

Based on what you've shared, I can help you:
• Create personalized meal plans
• Suggest recipes that fit your goals
• Calculate nutritional information
• Plan for dietary restrictions
• Optimize meal timing

Could you tell me a bit more about your specific goals or preferences? For example:
- Are you looking to lose weight, gain muscle, or maintain your current weight?
- Do you have any dietary restrictions or food allergies?
- How much time do you typically have for meal prep?
- What types of cuisines do you enjoy?

The more I know about your preferences, the better I can tailor my recommendations! 😊`;
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      default: return <Apple className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Meal Planner</h1>
              <p className="text-gray-600">Your personal nutrition assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'chat', name: 'AI Chat', icon: MessageSquare },
            { id: 'suggestions', name: 'Meal Suggestions', icon: Lightbulb },
            { id: 'weekly', name: 'Weekly Plan', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-500 hover:text-orange-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Ask me about meal planning, nutrition, or recipes..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              💡 Try asking: "Plan a high-protein breakfast" or "What should I eat for dinner?"
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personalized Meal Suggestions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealSuggestions.map((meal) => (
                <div key={meal.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getMealTypeIcon(meal.mealType)}
                      <span className="text-sm font-medium text-gray-600 capitalize">{meal.mealType}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(meal.difficulty)}`}>
                      {meal.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{meal.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{meal.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{meal.calories}</div>
                      <div className="text-xs text-gray-500">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{meal.protein}g</div>
                      <div className="text-xs text-gray-500">Protein</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{meal.prepTime} min</span>
                    </div>
                    <div className="text-sm text-gray-500">{meal.carbs}g carbs • {meal.fat}g fat</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {meal.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
                    Add to Meal Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Weekly Meal Plan</h2>
            <p className="text-gray-600 mb-6">
              Your personalized weekly meal plan will appear here. Start by chatting with the AI assistant to create your plan!
            </p>
            <button 
              onClick={() => setActiveTab('chat')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Start Planning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlan;
