import React, { useState } from 'react';
import CharacterSelection from './components/CharacterSelection';
import ChatInterface from './components/ChatInterface';
import useCharacterAnimation from './hooks/useCharacterAnimation';
import { generateCharacterResponse, getSuggestionUpdates } from './services/aiService';
import { textToSpeech, getVoiceForCharacter, prepareGreetingAudio } from './services/audioService';

// Import all characters from the correct index file
import allCharacters from './data/characters/index';

// Cache for character greeting audio
const greetingAudioCache = new Map();

// Generate unique IDs for messages
let messageIdCounter = 0;
const generateMessageId = () => `msg_${++messageIdCounter}`;

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterData, setCharacterData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseAudio, setResponseAudio] = useState(null);
  
  // Use the character animation hook
  const positions = useCharacterAnimation(allCharacters);
  
  // Character selection handler - now loads character data dynamically
  const handleCharacterSelect = async (character) => {
    setLoading(true);
    setSelectedCharacter(character);
    
    try {
      // Dynamically import character data based on selection
      // This allows us to only load the detailed data when needed
      const characterModule = await import(`./data/characters/${character.name.toLowerCase()}.js`);
      const characterData = characterModule.default;
      
      setCharacterData(characterData);
      
      // Add the initial character greeting message
      const greetingId = generateMessageId();
      setMessages([
        { 
          id: greetingId,
          type: 'character', 
          text: characterData.greeting 
        }
      ]);
      
      // Set character-specific suggestions
      setSuggestions(characterData.defaultSuggestions);
      
      // Handle greeting audio after loading other UI elements
      setTimeout(async () => {
        // Check if we have cached greeting audio
        let greetingAudio = greetingAudioCache.get(character.name);
        
        if (!greetingAudio) {
          // If not in cache, prepare it now
          greetingAudio = await prepareGreetingAudio(characterData);
          
          // Store in cache for future use
          if (greetingAudio) {
            greetingAudioCache.set(character.name, greetingAudio.cloneNode());
          }
        } else {
          // If we're using cached audio, create a fresh clone to play
          greetingAudio = greetingAudio.cloneNode();
        }
        
        // Set as current response audio and play
        if (greetingAudio) {
          // Update the message with the audio
          setMessages([{
            id: greetingId,
            type: 'character',
            text: characterData.greeting,
            audio: greetingAudio
          }]);
          
          setResponseAudio(greetingAudio);
        }
      }, 100);
      
    } catch (error) {
      console.error(`Failed to load character data for ${character.name}:`, error);
      
      // Fallback to using the basic character data
      setCharacterData(character);
      const greetingId = generateMessageId();
      setMessages([
        { 
          id: greetingId,
          type: 'character', 
          text: `Greetings! I am ${character.name} from the Bible. What would you like to know about me?` 
        }
      ]);
      
      setSuggestions(character.defaultSuggestions || [
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending a message (either typed or spoken)
  const handleSendMessage = async (transcribedText) => {
    // Use either transcribed text (from voice) or input value (from typing)
    const userMessage = transcribedText || inputValue;
    
    if (!userMessage.trim() || !characterData) return;
    
    const userMessageId = generateMessageId();
    const newMessages = [
      ...messages,
      { 
        id: userMessageId,
        type: 'user', 
        text: userMessage 
      }
    ];
    setMessages(newMessages);
    setInputValue('');
    
    // Start timing the response
    const requestStartTime = Date.now();
    
    // Set typing indicator
    const typingIndicatorIndex = newMessages.length;
    const typingId = generateMessageId();
    setMessages([...newMessages, { 
      id: typingId, 
      type: 'character', 
      text: '...', 
      isTyping: true 
    }]);
    
    try {
      // Get response from the AI service
      const response = await generateCharacterResponse(
        characterData, 
        userMessage, 
        newMessages
      );
      
      // Generate ID for the response message
      const responseId = generateMessageId();
      
      // Start preparing the audio as soon as we have the text response
      const voice = getVoiceForCharacter(characterData);
      const audioPromise = textToSpeech(response, voice);
      
      // Prepare the audio in the background while still showing typing
      const audioBlob = await audioPromise;
      
      // Create the audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Configure audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setResponseAudio(null);
      };
      
      // Store the prepared audio
      setResponseAudio(audio);
      
      // Now that we have both the text and audio ready, update the UI
      setMessages(prev => [
        ...prev.slice(0, typingIndicatorIndex),
        { 
          id: responseId,
          type: 'character', 
          text: response,
          audio: audio, // Attach the audio to the message
          requestStartTime: requestStartTime // Track when the request started
        }
      ]);
      
      // Play the audio (ChatInterface will handle this)
      
      // Update suggestions based on the conversation
      const newSuggestions = getSuggestionUpdates(characterData, userMessage);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating response:', error);
      // Replace typing indicator with error message
      const errorId = generateMessageId();
      setMessages(prev => [
        ...prev.slice(0, typingIndicatorIndex),
        { 
          id: errorId,
          type: 'character', 
          text: "I'm sorry, I'm having trouble responding right now. Please try again later."
        }
      ]);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    
    // Auto-send after a short delay to mimic clicking
    setTimeout(() => {
      handleSendMessage(suggestion); // Pass suggestion directly to avoid async state issues
    }, 100);
  };
  
  // Reset the state when going back to character selection
  const handleBackClick = () => {
    // Stop any playing audio
    if (responseAudio) {
      responseAudio.pause();
      setResponseAudio(null);
    }
    
    setSelectedCharacter(null);
    setCharacterData(null);
    setMessages([]);
    setInputValue('');
    setSuggestions([]);
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p>Loading {selectedCharacter?.name}...</p>
          </div>
        </div>
      )}
      
      {!selectedCharacter ? (
        <CharacterSelection 
          characters={allCharacters} 
          positions={positions} 
          onSelectCharacter={handleCharacterSelect} 
        />
      ) : (
        <ChatInterface 
          selectedCharacter={characterData || selectedCharacter}
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          suggestions={suggestions}
          handleSuggestionClick={handleSuggestionClick}
          onBackClick={handleBackClick}
        />
      )}
    </div>
  );
}

export default App; 