# Rusted Gate Farm Data Management - Frontend

## Overview
A modern web application for managing farm data at Rusted Gate Farm. Built with React, TypeScript, and Vite, this frontend application provides an intuitive interface for farm data management.

## Features

- Simple to use "Farmer Friendly" UI with TypeScript
- Authentication with Microsoft Azure AD
- Form handling with React Hook Form and (MSAL)act Router
- Uses API calls to communicate with Middleware 
## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix tion Library (MSAL)
- **HTTP Client**: Axios
- **Date Handling**: datOM

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
3. Start the development server:
   ```bash
   npm run dev

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Run production build

## Making Changes

Before pushing changes to the main branch, please follow these steps:

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them locally using `npm run dev`

3. Build the project to ensure there are no build errors:
   ```bash
   npm run build
   ```

6. Commit and push your branch and create a pull request to main

**Important**: Always ensure the project builds successfully before pushing to main. Digital Ocean reads directly from the dist folder allowing the app to be static and free.

## Notes
- All of the data normalization occurs in the frontend before the data is sent to the middleware. This includes the name consistency as well as the rules surrounding duplicate names for Categories, AssetTypes, Fields and EnumOptions.
- **/dist**: Usually the compile folders are not included however this page can be static on Digital Ocean. Since Digital Ocean will read directly from github. This allows the page to run for free

## Testing
- Minimal Playwrite testing. This is something that needs further development.
