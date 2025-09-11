const OpenAI = require('openai');

// Initialize OpenAI client only when needed
let openai = null;

const initializeOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Calculate maintenance calories using AI
async function calculateMaintenanceCalories(userData) {
  try {
    // Check if OpenAI API key is available
    const openaiClient = initializeOpenAI();
    if (!openaiClient) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
    Calculate the daily maintenance calories for a person with the following characteristics:
    - Weight: ${userData.weight} kg
    - Height: ${userData.height} cm
    - Age: ${userData.age} years
    - Gender: ${userData.gender}
    - Activity Level: ${userData.activity_level}

    Please provide:
    1. The calculated maintenance calories per day
    2. The recommended daily protein intake in grams
    3. A brief explanation of the calculation method

    Format your response as JSON with the following structure:
    {
      "daily_calories": number,
      "daily_protein": number,
      "explanation": "string"
    }
    `;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert. Provide accurate calorie and protein calculations based on scientific formulas. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    const result = JSON.parse(response);
    
    return {
      daily_calories: Math.round(result.daily_calories),
      daily_protein: Math.round(result.daily_protein),
      explanation: result.explanation
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to calculate calories using AI');
  }
}

// Analyze meal and calculate nutrition using AI
async function analyzeMeal(mealDescription) {
  try {
    // Check if OpenAI API key is available
    const openaiClient = initializeOpenAI();
    if (!openaiClient) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
    Analyze the following meal and provide comprehensive nutritional information:
    
    Meal: ${mealDescription}
    
    Please estimate all macronutrients and key nutrients. Consider typical portion sizes and cooking methods.
    
    Format your response as JSON with the following structure:
    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number,
      "notes": "string with any relevant notes about the estimation"
    }
    
    Be realistic with your estimates. If the description is vague, provide reasonable values and explain your reasoning.
    All values should be positive numbers.`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert. Provide realistic calorie and protein estimates for meals. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const response = completion.choices[0].message.content;
    const result = JSON.parse(response);
    
    return {
      calories: Math.round(result.calories),
      protein: Math.round(result.protein * 10) / 10, // Round to 1 decimal place
      carbs: Math.round(result.carbs * 10) / 10,
      fat: Math.round(result.fat * 10) / 10,
      fiber: Math.round(result.fiber * 10) / 10,
      sugar: Math.round(result.sugar * 10) / 10,
      sodium: Math.round(result.sodium * 10) / 10,
      notes: result.notes
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to analyze meal using AI');
  }
}

module.exports = {
  calculateMaintenanceCalories,
  analyzeMeal
};
