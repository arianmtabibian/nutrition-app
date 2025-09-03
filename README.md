# Nutrition Tracker

A comprehensive web-based nutrition tracking application with AI-powered meal analysis, built with React, Node.js, and OpenAI integration.

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Profile Management**: Set and calculate maintenance calories using AI
- **Nutrition Diary**: Calendar view with color-coded goal tracking
- **Meal Input**: AI-powered meal analysis for comprehensive nutrition data
- **Complete Macro Tracking**: Tracks calories, protein, carbs, fat, fiber, sugar, and sodium
- **Goal Tracking**: Daily protein and calorie goal monitoring (primary focus)
- **Smart UI Design**: Emphasizes calories and protein while displaying all macros

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite
- **AI Integration**: OpenAI GPT-4
- **Authentication**: JWT with bcrypt

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Database Migration (Existing Users)

If you have an existing database with the previous schema, run the migration script to add the new macro tracking columns:

```bash
node migrate-db.js
```

This will add support for tracking carbs, fat, fiber, sugar, and sodium while preserving your existing data.

### Quick Start (Windows)
1. Double-click `start.bat` to automatically install dependencies and start the application

### Quick Start (Mac/Linux)
1. Make the start script executable: `chmod +x start.sh`
2. Run: `./start.sh`

### Manual Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Create environment file:
   ```bash
   # Windows
   copy env.example .env
   
   # Mac/Linux
   cp env.example .env
   ```

4. Configure your environment variables in `.env`:
   - Set your OpenAI API key
   - Change the JWT secret
   - Adjust port if needed

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. **Register/Login**: Create an account or sign in
2. **Profile Setup**: Set your daily calorie and protein goals
3. **Add Meals**: Input meal descriptions for AI analysis
4. **Track Progress**: View your daily nutrition diary
5. **Monitor Goals**: See which days you hit your targets

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/meals` - Add new meal
- `GET /api/meals/:date` - Get meals for specific date
- `GET /api/diary/:month` - Get diary data for month

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
