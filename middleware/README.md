# Rusted Gate Farm Data Management - Middleware

## Overview
The middleware component serves as the backend service for the Rusted Gate Farm Data Management system. It provides a RESTful API interface for managing farm assets, categories, fields, and entries, with built-in support for natural language queries and change logging.

## Features
- RESTful API endpoints for CRUD operations
- Natural language query processing
- TypeScript implementation for type safety
- Comprehensive test suite for the routes

## Tech Stack
- Node.js v22.16.0
- Express.js
- TypeScript
- Knex.js (SQL query builder)
- MySQL
- Jest (Testing)
- OpenAI Integration

## Installation

1. Clone the repository
2. Navigate to the middleware directory:
```bash
cd middleware
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file in the root directory with the following variables:
```
    DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   DB_PORT=
   PORT=
   API_URL=
   OPENAI_API_KEY=
   SSL_CERTIFICATE=
```

## Available Scripts

- `npm run build` - Compiles TypeScript to JavaScript
- `npm start` - Runs the compiled application
- `npm run dev` - Compiles and runs the application in development mode

## Testing
The project includes a comprehensive test suite using Jest. Run tests with:
- Currently only tests the routes communication.
```bash
npm test
```
