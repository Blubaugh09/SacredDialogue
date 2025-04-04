/**
 * Service for handling AI interactions
 */

import { ENV, hasEnv } from '../utils/env';

/**
 * Generates a response for a biblical character based on the user's message
 * 
 * @param {Object} character - The character object
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI generated response
 */
export const generateCharacterResponse = async (character, userMessage, conversationHistory) => {
  // If API key isn't available or character has no responses, use static responses
  if (!hasEnv('AI_API_KEY') || !character || !character.responses) {
    return getStaticResponse(character, userMessage);
  }
  
  try {
    // Format conversation for the AI
    const formattedConversation = formatConversationForAI(character, conversationHistory);
    
    // Create system prompt with character's voice parameters
    const systemPrompt = createSystemPrompt(character);
    
    // Make API request
    const response = await fetch(ENV.AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: ENV.AI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...formattedConversation,
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('Unexpected API response:', data);
      return getStaticResponse(character, userMessage);
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    // Fallback to static responses if API fails
    return getStaticResponse(character, userMessage);
  }
};

/**
 * Creates a detailed system prompt using the character's voice parameters
 */
const createSystemPrompt = (character) => {
  if (!character.voiceParams) {
    return `You are ${character.name}, a character from the Bible. 
    Respond as ${character.name} would, based on scriptural accounts of your life and experiences.
    Keep responses faithful to biblical text and theological tradition.
    Speak in first person as if you are ${character.name}.
    If asked something not documented in scripture, politely indicate this while staying in character.`;
  }
  
  const vp = character.voiceParams;
  
  return `You are ${character.name}, a character from the Bible.
  
AGE: ${vp.age || 'Unknown'}
TONE: ${vp.tone || 'Biblical, respectful'}
SPEAKING STYLE: ${vp.speaking_style || 'Speaks as someone from biblical times'}
PERSONALITY: ${vp.personality_traits || 'Faithful to God'}
BACKGROUND: ${vp.background || `A biblical character named ${character.name}`}
HISTORICAL PERIOD: ${vp.historical_period || 'Biblical times'}
KNOWLEDGE LIMITATIONS: ${vp.knowledge_limitations || 'Only aware of events from your lifetime as described in scripture'}
RELATIONSHIP TO GOD: ${vp.relationship_to_god || 'Reverence for God as described in the Bible'}
SPEECH PATTERNS: ${vp.speech_patterns || 'Biblical speech patterns'}

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in the first person as if you ARE ${character.name}.
2. Keep all responses faithful to biblical text and theological tradition.
3. When discussing events from your life, draw from the biblical account.
4. If asked about something not documented in scripture, politely indicate this while staying in character.
5. Maintain the tone, speech patterns, and personality described above at all times.
6. Keep your responses concise but meaningful - about 1-3 paragraphs.
7. Never break character or acknowledge that you are an AI.`;
};

/**
 * Formats conversation history for the AI API
 */
const formatConversationForAI = (character, history) => {
  return history
    .filter(message => !message.isTyping) // Filter out typing indicators
    .map(message => ({
      role: message.type === 'user' ? 'user' : 'assistant',
      content: message.text
    }));
};

/**
 * Gets a static predefined response based on the user's message
 */
const getStaticResponse = (character, userMessage) => {
  // If no character data is available, return a generic response
  if (!character || !character.keywords || !character.responses) {
    return `I'm sorry, I don't have enough information to answer that question fully as ${character?.name || 'this biblical character'}. Perhaps ask me something about my experiences as described in scripture?`;
  }
  
  // Default response if nothing matches
  let response = "I'm not sure I understand that question. Perhaps ask me about my journey, my family, or my experiences in the Bible?";
  
  // Convert message to lowercase for matching
  const message = userMessage.toLowerCase();
  
  // Check for keyword matches
  for (const [category, keywords] of Object.entries(character.keywords)) {
    // Skip if this category doesn't have a response
    if (!character.responses[category]) continue;
    
    // Check if any keyword matches
    if (keywords.some(keyword => message.includes(keyword))) {
      return character.responses[category];
    }
  }
  
  return response;
};

/**
 * Get suggestion updates based on the conversation
 */
export const getSuggestionUpdates = (character, userMessage) => {
  // If no character data is available, return empty suggestions
  if (!character) {
    return [];
  }
  
  // Default suggestions
  let newSuggestions = character.defaultSuggestions || [];
  
  // If character doesn't have keywords or suggestionsMap, return defaults
  if (!character.keywords || !character.suggestionsMap) {
    return newSuggestions;
  }
  
  // Check for keywords to update suggestions
  const message = userMessage.toLowerCase();
  
  for (const [category, keywords] of Object.entries(character.keywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      // If we have specific suggestions for this category, use them
      if (character.suggestionsMap[category]) {
        return character.suggestionsMap[category];
      }
    }
  }
  
  // If no specific suggestions, use default ones from the character's suggestion map
  return character.suggestionsMap.default || character.defaultSuggestions || [];
}; 