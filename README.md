# AI Literacy Quiz with Cloudflare D1

A modern quiz application built with React, Vite, and Cloudflare Workers, featuring a D1 database for persistent storage.

## Features

- 🧠 AI literacy questions with multiple choice answers
- 📊 Real-time progress tracking
- 🎯 Score calculation and performance analytics
- 💾 Persistent data storage with Cloudflare D1
- 🚀 Serverless deployment on Cloudflare Workers
- 🎨 Modern, responsive UI with Tailwind CSS

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## Quick Start

### Prerequisites

- Node.js 18+ 
- Cloudflare account
- Wrangler CLI

### Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

3. **Create D1 Database**
   ```bash
   npx wrangler d1 create ai-literacy-quiz-db
   ```
   Copy the database ID from the output.

4. **Update Database Configuration**
   Edit `wrangler.jsonc` and replace the database ID with your actual database ID.

5. **Run Database Migrations**
   ```bash
   # Apply migrations locally for development
   npx wrangler d1 migrations apply ai-literacy-quiz-db --local
   
   # Apply migrations to remote database for production
   npx wrangler d1 migrations apply ai-literacy-quiz-db --remote
   ```

6. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

## Development

### Local Development
```bash
npm run dev
```

### Database Management

**Run migrations:**
```bash
# Local development
npx wrangler d1 migrations apply ai-literacy-quiz-db --local

# Production
npx wrangler d1 migrations apply ai-literacy-quiz-db --remote
```

**View database contents:**
```bash
npx wrangler d1 execute ai-literacy-quiz-db --command="SELECT * FROM questions;" --local
```

**Add new questions:**
```bash
npx wrangler d1 execute ai-literacy-quiz-db --command="INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES ('Your question here?', 'Option A', 'Option B', 'Option C', 'Option D', 0);" --local
```

### Creating New Migrations

To add new database changes, create a new migration file in the `migrations/` directory:

```bash
# Example: migrations/0003_add_categories.sql
ALTER TABLE questions ADD COLUMN category TEXT DEFAULT 'general';
```

Then apply it with:
```bash
npx wrangler d1 migrations apply ai-literacy-quiz-db --local
```

## Database Schema

### Questions Table
- `id`: Primary key
- `question`: Question text
- `option_a`, `option_b`, `option_c`, `option_d`: Answer choices
- `correct_answer`: Index of correct answer (0-3)
- `created_at`: Timestamp

### Quiz Sessions Table
- `id`: Session identifier
- `current_question_index`: Current question position
- `answers`: JSON array of user answers
- `start_time`: Session start timestamp
- `completed`: Completion status
- `created_at`: Timestamp

## API Endpoints

- `POST /api/quiz/start` - Start a new quiz session
- `GET /api/quiz/question` - Get current question
- `POST /api/quiz/answer` - Submit an answer
- `GET /api/quiz/results` - Get quiz results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - feel free to use this project for your own AI literacy initiatives!