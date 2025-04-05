import React, { useState } from 'react';
import CharacterSelection from './components/CharacterSelection';
import ChatInterface from './components/ChatInterface';
import useCharacterAnimation from './hooks/useCharacterAnimation';
import { generateCharacterResponse, getSuggestionUpdates } from './services/aiService';
import { textToSpeech, getVoiceForCharacter, prepareGreetingAudio, fetchAudioAsBlob } from './services/audioService';
import { saveInteraction } from './firebase/services';

// Import all characters from the correct index file
import allCharacters from './data/characters/index';

// Cache for character greeting audio
const greetingAudioCache = new Map();

// Generate unique IDs for messages
let messageIdCounter = 0;
const generateMessageId = () => `msg_${++messageIdCounter}`;

// Add this new function to create a reliable audio player
const createReliableAudioPlayer = (audioBlob, onEnded) => {
  // Create a clean blob URL for this audio
  const blobUrl = URL.createObjectURL(audioBlob);
  
  // Create a new audio element
  const audio = new Audio();
  
  // Set up clean-up for when playback ends
  audio.onended = () => {
    console.log('Audio playback ended, cleaning up blob URL');
    URL.revokeObjectURL(blobUrl);
    if (onEnded) onEnded();
  };
  
  // Set up error handler
  audio.onerror = (e) => {
    console.error('Audio playback error:', e);
    URL.revokeObjectURL(blobUrl);
  };
  
  // Configure audio element
  audio.src = blobUrl;
  audio.type = 'audio/mpeg';
  
  // Set CORS attributes even for blob URLs (as a precaution)
  audio.crossOrigin = 'anonymous';
  
  // Return the configured audio element
  return audio;
};

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
      // Get response from the AI service - now returns an object with response and cache status
      const { response, fromCache, audioUrl } = await generateCharacterResponse(
        characterData, 
        userMessage, 
        newMessages
      );
      
      // Generate ID for the response message
      const responseId = generateMessageId();
      
      let audio;
      let firebaseUrl = audioUrl;
      
      // If we have a cached response with audio URL, use it directly
      if (fromCache && audioUrl) {
        console.log('Using cached audio URL:', audioUrl);
        
        try {
          // Fetch the audio from Firebase and convert to blob first
          console.log('Attempting to fetch audio blob from Firebase URL');
          const audioBlob = await fetchAudioAsBlob(audioUrl);
          console.log('Successfully fetched audio blob, creating player with size:', audioBlob.size);
          
          // Create audio player from blob
          audio = createReliableAudioPlayer(audioBlob, () => {
            setResponseAudio(null);
          });
          
          // Ensure the audio is loaded
          await audio.load();
          console.log('Audio loaded successfully');
          
        } catch (audioError) {
          console.warn('Failed to use cached audio, generating new audio:', audioError);
          
          // Fall back to generating new audio
          try {
            const voice = getVoiceForCharacter(characterData);
            const { blob: audioBlob, url: newFirebaseUrl } = await textToSpeech(
              response, 
              voice, 
              1.3,
              characterData.name
            );
            
            console.log('Generated new audio successfully');
            
            // Create audio player from freshly generated blob
            audio = createReliableAudioPlayer(audioBlob, () => {
              setResponseAudio(null);
            });
            
            firebaseUrl = newFirebaseUrl;
          } catch (fallbackError) {
            console.error('Failed to generate fallback audio:', fallbackError);
            // Continue without audio if we can't create fallback
          }
        }
      } else {
        // Otherwise generate new audio from the text
        const voice = getVoiceForCharacter(characterData);
        
        // Generate audio for the response
        const { blob: audioBlob, url: newFirebaseUrl } = await textToSpeech(
          response, 
          voice, 
          1.3, // speed
          characterData.name // Pass character name for Firebase storage
        );
        
        // Create the audio element
        const audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        
        // Configure audio
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setResponseAudio(null);
        };
        
        // Save the Firebase URL
        firebaseUrl = newFirebaseUrl;
        
        // If this is a new response (not from cache), save it to Firestore
        if (!fromCache) {
          try {
            await saveInteraction(
              userMessage,
              response,
              audioBlob,
              characterData.name
            );
            console.log('New interaction saved to Firebase');
          } catch (firebaseError) {
            console.error('Error saving to Firebase:', firebaseError);
            // Continue with the conversation even if Firebase saving fails
          }
        }
      }
      
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
          firebaseUrl: firebaseUrl, // Store the Firebase URL
          fromCache: fromCache, // Track if this was from cache
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