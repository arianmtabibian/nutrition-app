/**
 * Generate a short summary (5 words or less) from a meal description
 */
export const generateMealSummary = (description: string): string => {
  if (!description || description.trim() === '') {
    return 'Untitled Meal';
  }

  // Clean the description - remove extra spaces, punctuation at the end
  const cleanDescription = description.trim().replace(/[.,!?;]+$/, '');
  
  // Common words to remove for more concise summaries
  const fillerWords = [
    'with', 'and', 'or', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
    'from', 'by', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'some', 'very', 'really', 'quite', 'rather',
    'pretty', 'more', 'most', 'less', 'least', 'much', 'many', 'few', 'little',
    'big', 'small', 'large', 'huge', 'tiny'
  ];

  // Split into words and filter
  const words = cleanDescription
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0);

  // If it's already 5 words or less, return as is (but capitalized)
  if (words.length <= 5) {
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Extract important words (non-filler words first)
  const importantWords = words.filter(word => !fillerWords.includes(word));
  
  // If we have 5 or fewer important words, use those
  if (importantWords.length <= 5) {
    return importantWords
      .slice(0, 5)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Otherwise, take first 5 important words
  const summary = importantWords
    .slice(0, 5)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return summary;
};

/**
 * Generate an even shorter summary (3 words or less) for compact displays
 */
export const generateShortMealSummary = (description: string): string => {
  if (!description || description.trim() === '') {
    return 'Meal';
  }

  const cleanDescription = description.trim().replace(/[.,!?;]+$/, '');
  
  // For very short summaries, focus on the main food items
  const words = cleanDescription
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2); // Remove very short words

  // Common food-related words that are important to keep
  const foodWords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'lamb',
    'rice', 'pasta', 'bread', 'quinoa', 'oats', 'cereal',
    'salad', 'soup', 'sandwich', 'burger', 'pizza', 'taco', 'wrap',
    'eggs', 'cheese', 'milk', 'yogurt',
    'apple', 'banana', 'orange', 'berry', 'fruit',
    'broccoli', 'spinach', 'carrot', 'potato', 'tomato', 'vegetable',
    'grilled', 'baked', 'fried', 'roasted', 'steamed', 'boiled'
  ];

  // Prioritize food words
  const priorityWords = words.filter(word => foodWords.includes(word));
  const remainingWords = words.filter(word => !foodWords.includes(word));

  // Combine priority words first, then others
  const selectedWords = [...priorityWords, ...remainingWords].slice(0, 3);

  if (selectedWords.length === 0) {
    return 'Meal';
  }

  return selectedWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
