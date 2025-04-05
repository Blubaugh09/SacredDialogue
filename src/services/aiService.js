/**
 * Service for handling AI interactions
 */

import { ENV, hasEnv, getApiEndpoint, getApiKey, getModel, hasEnvValue } from '../utils/env';

/**
 * Generates a response for a biblical character based on the user's message
 * 
 * @param {Object} character - The character object
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI generated response
 */
export const generateCharacterResponse = async (character, userMessage, conversationHistory) => {
  const apiEndpoint = getApiEndpoint();
  const apiKey = getApiKey();
  const model = getModel();
  
  // Convert conversation history to a format the API can use
  const messages = conversationHistory.map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
  
  // Add system message with character information
  messages.unshift({
    role: 'system',
    content: generateCharacterInstructions(character)
  });
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
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
  const { suggestionsMap, defaultSuggestions } = character;
  
  if (!suggestionsMap) return defaultSuggestions || [];
  
  // Convert user message to lowercase for matching
  const message = userMessage.toLowerCase();
  
  // Find a matching topic based on keywords
  let matchedTopic = 'default';
  
  if (character.keywords) {
    const topics = Object.keys(character.keywords);
    
    for (const topic of topics) {
      const keywords = character.keywords[topic] || [];
      const hasMatch = keywords.some(keyword => message.includes(keyword.toLowerCase()));
      
      if (hasMatch) {
        matchedTopic = topic;
        break;
      }
    }
  }
  
  // Return the suggestions for the matched topic, or default suggestions
  return suggestionsMap[matchedTopic] || defaultSuggestions || [];
};

// Function to generate a story-based response for interactive storytelling
export const generateStoryResponse = async (character, storyData, conversationHistory = []) => {
  const apiEndpoint = getApiEndpoint();
  const apiKey = getApiKey();
  const model = getModel();
  
  // Create message history
  const messages = [
    // System message with storytelling instructions
    {
      role: 'system',
      content: generateStoryInstructions(character, storyData)
    }
  ];
  
  // Add any existing conversation history
  messages.push(
    ...conversationHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  );
  
  // If this is the first message (no history), add a user message requesting the story
  if (conversationHistory.length === 0) {
    messages.push({
      role: 'user',
      content: `I would like to experience "${storyData.title}" with you as my guide.`
    });
  }
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.8, // Slightly higher temperature for more creative storytelling
        max_tokens: 1200  // Allow longer responses for stories
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating story response:', error);
    throw error;
  }
};

// Generate system message instructions for story mode
const generateStoryInstructions = (character, storyData) => {
  const { name, voiceParams } = character;
  const { title, type, id } = storyData;
  
  let instructions = `You are ${name} from the Bible in interactive storytelling mode. You are guiding the user through "${title}".`;
  
  // Add more specific instructions based on the story type
  if (type === 'storytelling') {
    instructions += `\n\nAs ${name}, you should narrate this key moment from your life in vivid detail, using first-person perspective to make the user feel present in the scene. Create an immersive, multi-sensory experience describing sights, sounds, emotions, and spiritual significance. Break your storytelling into manageable portions and engage the user by occasionally asking what they notice or how they feel, or giving them simple choices about what aspect of the story to focus on next.`;
  } else if (type === 'guided') {
    instructions += `\n\nAs ${name}, you should guide a conversation about ${title} by sharing your wisdom and experiences on this topic. Ask thoughtful questions to engage the user in spiritual reflection. Respond to their thoughts with biblical insights, connecting your experiences to timeless spiritual principles. Make this an interactive dialogue rather than just a lecture.`;
  }
  
  // Add character voice parameters
  if (voiceParams) {
    const {
      tone, speaking_style, personality_traits,
      speech_patterns
    } = voiceParams;
    
    if (tone) instructions += `\nTone: ${tone}`;
    if (speaking_style) instructions += `\nSpeaking style: ${speaking_style}`;
    if (personality_traits) instructions += `\nPersonality: ${personality_traits}`;
    if (speech_patterns) instructions += `\nSpeech patterns: ${speech_patterns}`;
  }
  
  // Story-specific context based on the story ID
  if (id.includes('sermon')) {
    instructions += `\n\nSet the scene at the mountainside where you delivered these teachings. Explain the revolutionary nature of these teachings in their historical context.`;
  } else if (id.includes('exodus')) {
    instructions += `\n\nDescribe the intensity of the confrontation with Pharaoh, the fear and awe of the plagues, and the mixture of terror and faith during the crossing of the Red Sea.`;
  } else if (id.includes('goliath')) {
    instructions += `\n\nCapture the tension of the moment, your thoughts as you faced the giant, and your unwavering faith that God would deliver the victory.`;
  }
  
  instructions += `\n\nBegin the story in a compelling way that draws the user in. Your first response should set the scene and begin the narrative journey or guided conversation.`;
  
  return instructions;
};

// Generate system message instructions for the AI based on character data
const generateCharacterInstructions = (character) => {
  const { name, voiceParams } = character;
  
  let instructions = `You are ${name} from the Bible. Respond as ${name} would, in first person.`;
  
  // Add detailed voice/personality parameters if available
  if (voiceParams) {
    const {
      age, tone, speaking_style, personality_traits,
      background, historical_period, knowledge_limitations,
      relationship_to_god, speech_patterns
    } = voiceParams;
    
    if (age) instructions += `\nAge: ${age}`;
    if (tone) instructions += `\nTone: ${tone}`;
    if (speaking_style) instructions += `\nSpeaking style: ${speaking_style}`;
    if (personality_traits) instructions += `\nPersonality: ${personality_traits}`;
    if (background) instructions += `\nBackground: ${background}`;
    if (historical_period) instructions += `\nHistorical period: ${historical_period}`;
    if (knowledge_limitations) instructions += `\nKnowledge limitations: ${knowledge_limitations}`;
    if (relationship_to_god) instructions += `\nRelationship to God: ${relationship_to_god}`;
    if (speech_patterns) instructions += `\nSpeech patterns: ${speech_patterns}`;
  }
  
  instructions += `\n\nAs ${name}, you should only respond with information that would be known to you during your lifetime and from your perspective. If asked about events beyond your time, respond with what you prophesied or anticipated, or acknowledge that such events would be beyond your earthly knowledge.`;
  
  instructions += `\n\nYour responses should reflect your biblical character, values, and experiences. Use appropriate language and references from your time period. Always maintain the dignity and authenticity of your biblical character.`;
  
  return instructions;
}; 