# Biblical Character Dialogue System

An interactive web application that allows users to have conversations with biblical characters. The characters respond based on scriptural accounts of their lives and experiences.

## Features

- Interactive selection of biblical characters
- Text-based dialogue system with the selected character
- Character responses based on scriptural accounts
- Suggested questions for better user experience
- Optional AI-powered responses for more dynamic conversations

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Add your AI API key to the `.env` file (optional)
5. Start the development server:
   ```
   npm start
   ```

## Environment Variables

- `REACT_APP_AI_API_KEY`: Your API key for OpenAI or another AI provider
- `REACT_APP_AI_API_ENDPOINT`: API endpoint URL (defaults to OpenAI)
- `REACT_APP_AI_MODEL`: AI model to use (defaults to gpt-3.5-turbo)
- `REACT_APP_APP_NAME`: Application name

## Adding New Characters

To add a new biblical character:

1. Open `src/data/characters.js`
2. Add a new character object to the array with:
   - Unique ID
   - Name
   - Color
   - Greeting message
   - Default suggestions
   - Suggestion categories
   - Predefined responses
   - Keywords to match for responses

## Architecture

- `src/components/`: UI components
- `src/data/`: Character data and other static information
- `src/services/`: API and service integrations
- `src/hooks/`: Custom React hooks
- `src/utils/`: Utility functions

## AI Integration

The application can use static predefined responses or connect to an AI API for more dynamic conversations:

1. If `REACT_APP_AI_API_KEY` is not set, the app will use static responses from `characters.js`
2. If `REACT_APP_AI_API_KEY` is set, the app will make API calls to generate dynamic responses

## License

[MIT](LICENSE) 