import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CharacterSelection from './components/CharacterSelection';
import ChatInterface from './components/ChatInterface';
import StoryMode from './components/StoryMode';
import SharedConversation from './components/SharedConversation';
import useCharacterAnimation from './hooks/useCharacterAnimation';
import { generateCharacterResponse, generateStoryResponse, getSuggestionUpdates } from './services/aiService';
import { textToSpeech, getVoiceForCharacter, prepareGreetingAudio } from './services/audioService';
import { saveConversation, saveSession, findSimilarConversation, getPreviousConversations } from './firebase/services';
import { testFirebaseConnection } from './utils/firebaseTestUtil';
import { createAudioFromUrl, fixFirebaseStorageUrl } from './utils/audioUtils';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import './firebaseInit';

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
  const [showStoryMode, setShowStoryMode] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [firebaseError, setFirebaseError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isFirebaseTesting, setIsFirebaseTesting] = useState(false);
  const [playedMessages, setPlayedMessages] = useState(new Set());
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Use the character animation hook
  const positions = useCharacterAnimation(allCharacters);
  
  // Use navigate for routing
  const navigate = useNavigate();
  
  // Generate a unique session ID for tracking conversations
  useEffect(() => {
    if (!sessionId) {
      setSessionId(uuidv4());
    }
  }, [sessionId]);
  
  // Save session data when a character is selected
  useEffect(() => {
    if (selectedCharacter && sessionId) {
      const saveSessionData = async () => {
        try {
          await saveSession(sessionId, {
            character: selectedCharacter.name,
            startTime: new Date().toISOString(),
            device: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            }
          });
        } catch (error) {
          console.error("Error saving session:", error);
          setFirebaseError("Failed to save session data");
        }
      };
      
      saveSessionData();
    }
  }, [selectedCharacter, sessionId]);
  
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
      
      // Flag to track if we've already handled the greeting with cached audio
      let shouldSkipGreeting = false;
      
      // Preload previous conversations from Firestore
      try {
        console.log(`Preloading conversations for ${character.name}...`);
        const previousConversations = await getPreviousConversations(character.name);
        console.log(`Found ${previousConversations.length} previous conversations`);
        
        // Check if we have a cached greeting response with valid audio
        const cachedGreeting = previousConversations.find(conv => 
          conv.message === "" && conv.response === characterData.greeting
        );
        
        if (cachedGreeting && cachedGreeting.audioUrl) {
          console.log('Found cached greeting with audio:', cachedGreeting);
          
          // Try to create an audio element from the cached URL
          try {
            const audioUrl = fixFirebaseStorageUrl(cachedGreeting.audioUrl);
            const audio = await createAudioFromUrl(
              audioUrl, 
              () => setResponseAudio(null)
            );
            
            if (audio) {
              console.log('Successfully created audio for cached greeting');
              
              // Update message with audio immediately
              setMessages([{
                id: greetingId,
                type: 'character',
                text: characterData.greeting,
                audio: audio
              }]);
              
              // Set as current audio
              setResponseAudio(audio);
              
              // Play the audio
              setTimeout(() => {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(error => {
                    console.error('Error playing cached greeting audio:', error);
                  });
                }
              }, 100);
              
              // Set a flag to skip the setTimeout block below 
              // since we've already handled the greeting
              shouldSkipGreeting = true;
            } else {
              console.log('Failed to create audio for cached greeting, will generate new audio');
            }
          } catch (error) {
            console.error('Error setting up cached greeting audio:', error);
          }
        }
      } catch (error) {
        console.error('Error preloading conversations:', error);
      }
      
      // Handle greeting audio after loading other UI elements
      setTimeout(async () => {
        // Skip if we've already handled the greeting with cached audio
        if (shouldSkipGreeting) {
          console.log('Skipping greeting generation, using cached audio');
          return;
        }
        
        try {
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
            
            // Try playing the audio
            try {
              const playPromise = greetingAudio.play();
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.error('Error playing greeting audio:', error);
                });
              }
            } catch (playError) {
              console.error('Error playing greeting audio:', playError);
            }
            
            // Save the greeting message to Firebase if it's not already saved
            try {
              // Convert audio to blob for storage
              const audioBlob = await fetch(greetingAudio.src)
                .then(r => r.blob())
                .catch(err => {
                  console.error('Error fetching audio blob:', err);
                  return null; // Return null if fetch fails
                });
              
              // Check if we already have this greeting saved (to avoid duplicates)
              const previousConversations = await getPreviousConversations(character.name, 5);
              const existingGreeting = previousConversations.find(conv => 
                conv.message === "" && conv.response === characterData.greeting
              );
              
              if (!existingGreeting) {
                if (audioBlob) {
                  const savedConversation = await saveConversation(
                    character.name,
                    "", // No user message for greeting
                    characterData.greeting,
                    audioBlob,
                    sessionId
                  );
                  
                  console.log('Saved greeting conversation:', savedConversation);
                } else {
                  // If we couldn't get the audio blob, save without audio
                  const savedConversation = await saveConversation(
                    character.name,
                    "", // No user message for greeting
                    characterData.greeting,
                    null, // No audio
                    sessionId
                  );
                  
                  console.log('Saved greeting conversation without audio:', savedConversation);
                }
              } else {
                console.log('Greeting already saved, not duplicating:', existingGreeting);
              }
            } catch (error) {
              console.error('Error saving greeting to Firebase:', error);
              setFirebaseError(`Failed to save greeting: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Error setting up greeting audio:', error);
          // Update UI even without audio
          setMessages([{
            id: greetingId,
            type: 'character',
            text: characterData.greeting
          }]);
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
      // Check for cached conversations
      console.log(`Checking for cached response for: "${userMessage}"`);
      const cachedConversation = await findSimilarConversation(characterData.name, userMessage);
      
      if (cachedConversation && cachedConversation.response) {
        console.log('Found cached response:', cachedConversation);
        
        // Use cached conversation
        const response = cachedConversation.response;
        
        // Generate ID for the response message
        const responseId = generateMessageId();
        
        let audio = null;
        
        // If we have a valid cached audio URL, use that
        if (cachedConversation.audioUrl) {
          console.log('Attempting to use cached audio URL:', cachedConversation.audioUrl);
          
          try {
            // Use our utility to create an audio element from the URL
            audio = await createAudioFromUrl(
              cachedConversation.audioUrl, 
              () => setResponseAudio(null)
            );
            
            if (audio) {
              console.log('Successfully created audio element with cached URL');
              // Store the prepared audio
              setResponseAudio(audio);
            }
          } catch (error) {
            console.error('Error creating audio from cached URL:', error);
            audio = null;
          }
        }
        
        // If we couldn't use cached audio, generate new audio
        if (!audio) {
          console.log('No valid cached audio, generating new audio');
          try {
            const voice = getVoiceForCharacter(characterData);
            const audioBlob = await textToSpeech(response, voice);
            
            // Create the audio element
            const audioUrl = URL.createObjectURL(audioBlob);
            audio = new Audio(audioUrl);
            
            // Configure audio
            audio.onended = () => {
              if (audioUrl) URL.revokeObjectURL(audioUrl);
              setResponseAudio(null);
            };
            
            // Store the prepared audio
            setResponseAudio(audio);
            
            // We've found the cached response but had to regenerate audio
            // Save the new audio to update the conversation
            try {
              // Check if we already have this conversation saved (to avoid duplicates)
              const previousConversations = await getPreviousConversations(characterData.name, 5);
              const existingConversation = previousConversations.find(conv => 
                conv.message === userMessage && conv.response === response
              );
              
              if (!existingConversation) {
                const savedConversation = await saveConversation(
                  characterData.name,
                  userMessage,
                  response,
                  audioBlob,
                  sessionId
                );
                
                console.log('Saved new conversation:', savedConversation);
                
                // Store the conversation ID with the message for sharing
                const updatedMessages = [...messages];
                const messageIndex = updatedMessages.findIndex(msg => 
                  msg.type === 'character' && msg.text === response
                );
                
                if (messageIndex !== -1) {
                  updatedMessages[messageIndex].conversationId = savedConversation.id;
                  setMessages(updatedMessages);
                }
              } else {
                console.log('Conversation already exists, not duplicating:', existingConversation);
              }
            } catch (error) {
              console.error('Error saving conversation to Firebase:', error);
              setFirebaseError(error.message);
            }
          } catch (audioError) {
            console.error('Error generating new audio for cached response:', audioError);
          }
        }
        
        // Now that we have both the text and audio ready, update the UI
        setMessages(prev => [
          ...prev.slice(0, typingIndicatorIndex),
          { 
            id: responseId,
            type: 'character', 
            text: response,
            audio: audio, // Attach the audio to the message (might be null if there was an error)
            requestStartTime: requestStartTime, // Track when the request started
            isCached: true // Mark as cached response
          }
        ]);
        
        console.log('Using cached response for:', userMessage);
        
        // Try playing the audio if available
        if (audio) {
          try {
            // Wait briefly to allow the message UI to update
            setTimeout(() => {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.error('Error playing cached audio:', error);
                });
              }
            }, 100);
          } catch (playError) {
            console.error('Error playing cached audio:', playError);
          }
        }
        
        // Update suggestions based on the conversation if not in story mode
        if (!activeStory) {
          const newSuggestions = getSuggestionUpdates(characterData, userMessage);
          setSuggestions(newSuggestions);
        }
      } else {
        console.log('No cached response found, generating new response');
        // Get response from the appropriate AI service based on whether we're in story mode
        let response;
        if (activeStory) {
          response = await generateStoryResponse(
            characterData,
            activeStory,
            newMessages
          );
        } else {
          response = await generateCharacterResponse(
            characterData, 
            userMessage, 
            newMessages
          );
        }
        
        // Generate ID for the response message
        const responseId = generateMessageId();
        
        // Start preparing the audio as soon as we have the text response
        const voice = getVoiceForCharacter(characterData);
        
        let audioBlob;
        let audio = null;
        
        try {
          audioBlob = await textToSpeech(response, voice);
          
          // Create the audio element
          const audioUrl = URL.createObjectURL(audioBlob);
          audio = new Audio(audioUrl);
          
          // Configure audio
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setResponseAudio(null);
          };
          
          // Store the prepared audio
          setResponseAudio(audio);
        } catch (audioError) {
          console.error('Error generating audio:', audioError);
          // Continue without audio if there's an error
        }
        
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
        
        // Save conversation to Firebase
        try {
          // Check if we already have this conversation saved (to avoid duplicates)
          const previousConversations = await getPreviousConversations(characterData.name, 5);
          const existingConversation = previousConversations.find(conv => 
            conv.message === userMessage && conv.response === response
          );
          
          if (!existingConversation) {
            const savedConversation = await saveConversation(
              characterData.name,
              userMessage,
              response,
              audioBlob,
              sessionId
            );
            
            console.log('Saved new conversation:', savedConversation);
            
            // Store the conversation ID with the message for sharing
            const updatedMessages = [...messages];
            const messageIndex = updatedMessages.findIndex(msg => 
              msg.type === 'character' && msg.text === response
            );
            
            if (messageIndex !== -1) {
              updatedMessages[messageIndex].conversationId = savedConversation.id;
              setMessages(updatedMessages);
            }
          } else {
            console.log('Conversation already exists, not duplicating:', existingConversation);
          }
        } catch (error) {
          console.error('Error saving conversation to Firebase:', error);
          setFirebaseError(error.message);
        }
        
        // Update suggestions based on the conversation if not in story mode
        if (!activeStory) {
          const newSuggestions = getSuggestionUpdates(characterData, userMessage);
          setSuggestions(newSuggestions);
        }
      }
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
    
    // Save session end information
    if (selectedCharacter) {
      saveSession(sessionId, {
        endTime: new Date().toISOString(),
        messageCount: messages.filter(m => !m.isTyping).length,
        completed: true
      }).catch(error => {
        console.error('Error updating session:', error);
      });
    }
    
    setSelectedCharacter(null);
    setCharacterData(null);
    setMessages([]);
    setInputValue('');
    setSuggestions([]);
    setActiveStory(null);
    setFirebaseError(null);
    
    // Navigate to home
    navigate('/');
  };
  
  // Toggle story mode dialog
  const toggleStoryMode = () => {
    setShowStoryMode(!showStoryMode);
  };
  
  // Handle story selection
  const handleStorySelect = async (story) => {
    setActiveStory(story);
    setShowStoryMode(false);
    
    // Clear previous conversation
    setMessages([]);
    
    // Set loading state
    setLoading(true);
    
    try {
      // Generate initial story response
      const response = await generateStoryResponse(
        characterData,
        story,
        [] // Empty conversation history since this is the start
      );
      
      // Generate ID for the response message
      const responseId = generateMessageId();
      
      // Prepare audio for the story introduction
      const voice = getVoiceForCharacter(characterData);
      const audioBlob = await textToSpeech(response, voice);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Configure audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setResponseAudio(null);
      };
      
      // Store the prepared audio
      setResponseAudio(audio);
      
      // Add the story introduction message
      setMessages([{ 
        id: responseId,
        type: 'character', 
        text: response,
        audio: audio
      }]);
      
      // Save story introduction to Firebase
      try {
        const storyIntro = `Story Mode: ${story.title} - ${story.type}`;
        
        const savedConversation = await saveConversation(
          characterData.name,
          storyIntro,
          response,
          audioBlob,
          sessionId
        );
        
        console.log('Saved story introduction:', savedConversation);
      } catch (error) {
        console.error('Error saving story introduction to Firebase:', error);
        setFirebaseError(error.message);
      }
      
      // Set empty suggestions since we're in story mode
      setSuggestions([]);
    } catch (error) {
      console.error('Error starting story:', error);
      
      // Add an error message
      setMessages([{ 
        id: generateMessageId(),
        type: 'character', 
        text: "I'm sorry, I'm having trouble beginning this story. Please try again later."
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to test Firebase connection
  const handleTestFirebase = async () => {
    setIsFirebaseTesting(true);
    setFirebaseError(null);
    
    try {
      const result = await testFirebaseConnection();
      console.log("Firebase test result:", result);
      
      if (result.firestore.success && result.storage.success) {
        alert("Firebase connection successful!\n\nFirestore: ✅\nStorage: ✅");
      } else {
        let errorMessage = "Firebase connection issues:\n\n";
        if (!result.firestore.success) {
          errorMessage += `Firestore: ❌ - ${result.firestore.error}\n`;
        } else {
          errorMessage += "Firestore: ✅\n";
        }
        
        if (!result.storage.success) {
          errorMessage += `Storage: ❌ - ${result.storage.error}`;
        } else {
          errorMessage += "Storage: ✅";
        }
        
        alert(errorMessage);
        setFirebaseError("Firebase connection test failed");
      }
    } catch (error) {
      console.error("Firebase test error:", error);
      alert(`Firebase test failed: ${error.message}`);
      setFirebaseError("Firebase connection test failed");
    } finally {
      setIsFirebaseTesting(false);
    }
  };
  
  // Find the last character message with audio that hasn't been played yet
  const lastMessageWithAudio = [...messages].reverse().find(
    msg => msg.type === 'character' && msg.audio && !msg.isTyping && !playedMessages.has(msg.text)
  );
  
  if (lastMessageWithAudio?.audio) {
    // Clean up any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
    }
    
    // Mark this message as played to avoid duplicate playback
    setPlayedMessages(prev => new Set([...prev, lastMessageWithAudio.text]));
    
    // Play the new audio
    const audio = lastMessageWithAudio.audio;
    setCurrentAudio(audio);
    
    // Calculate response time (if there's a start time for this message)
    if (lastMessageWithAudio.requestStartTime) {
      const endTime = Date.now();
      const responseTimeMs = endTime - lastMessageWithAudio.requestStartTime;
      // Comment out or remove the line below since setResponseTime is not defined
      // setResponseTime(prev => ({
      //   ...prev,
      //   [lastMessageWithAudio.id]: responseTimeMs
      // }));
      
      // Log response time instead
      console.log(`Response time for message ${lastMessageWithAudio.id}: ${responseTimeMs}ms`);
    }
  }
  
  // Main app component with routing
  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p>Loading {selectedCharacter?.name}...</p>
          </div>
        </div>
      )}
      
      {firebaseError && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center z-50">
          Firebase error: {firebaseError}. Storage functionality may be limited.
        </div>
      )}
      
      <Routes>
        <Route path="/" element={
          <>
            {selectedCharacter ? (
              <>
                <ChatInterface 
                  selectedCharacter={characterData || selectedCharacter}
                  messages={messages}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleSendMessage={handleSendMessage}
                  suggestions={suggestions}
                  handleSuggestionClick={handleSuggestionClick}
                  onBackClick={handleBackClick}
                  onStoryModeClick={toggleStoryMode}
                  activeStory={activeStory}
                />
                
                {showStoryMode && (
                  <StoryMode 
                    selectedCharacter={characterData || selectedCharacter}
                    onStorySelect={handleStorySelect}
                    onClose={toggleStoryMode}
                  />
                )}
              </>
            ) : (
              <CharacterSelection
                characters={allCharacters}
                positions={positions}
                onSelectCharacter={handleCharacterSelect}
              >
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    onClick={handleTestFirebase}
                    disabled={isFirebaseTesting}
                    className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isFirebaseTesting ? "Testing..." : "Test Firebase Connection"}
                  </button>
                  {firebaseError && (
                    <p className="text-red-500 text-sm mt-1">{firebaseError}</p>
                  )}
                </div>
              </CharacterSelection>
            )}
          </>
        } />
        <Route path="/share/:characterName/:conversationId" element={<SharedConversation />} />
      </Routes>
    </div>
  );
}

export default App; 