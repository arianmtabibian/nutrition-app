/**
 * Generate a short summary (5 words or less) from a meal description
 * Server-side version of the client-side utility
 */
const generateMealSummary = (description) => {
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

module.exports = {
  generateMealSummary
};
