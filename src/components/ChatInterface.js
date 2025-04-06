import React, { useRef, useEffect, useState } from 'react';
import { Send, Volume2, VolumeX, Mic, MicOff, Repeat, Video, ArrowLeft, Clock, BookOpen, Share2 } from 'lucide-react';
import { startRecording, stopRecording, speechToText } from '../services/audioService';
import { createShareableConversation } from '../firebase/services';

const ChatInterface = ({ 
  selectedCharacter, 
  messages, 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  suggestions, 
  handleSuggestionClick, 
  onBackClick,
  onStoryModeClick,
  activeStory
}) => {
  const messagesEndRef = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playedMessages, setPlayedMessages] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoAvailable, setVideoAvailable] = useState(false);
  const [responseTime, setResponseTime] = useState({});
  const videoRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [shareTooltip, setShareTooltip] = useState('');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
  // Check if video exists for the selected character
  useEffect(() => {
    const checkVideoAvailability = async () => {
      try {
        // Create a HEAD request to check if the file exists
        const response = await fetch(`/${selectedCharacter.name}.mp4`, { method: 'HEAD' });
        setVideoAvailable(response.ok);
        // Reset the show video state when changing characters
        setShowVideo(false);
      } catch (error) {
        console.error('Error checking video availability:', error);
        setVideoAvailable(false);
      }
    };
    
    checkVideoAvailability();
  }, [selectedCharacter.name]);
  
  // Detect user interaction to enable autoplay on mobile
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      // Remove the event listeners once user has interacted
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    // Add event listeners to detect user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Play audio for new character messages with embedded audio
  useEffect(() => {
    if (!isAudioEnabled) return;
    
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
        setResponseTime(prev => ({
          ...prev,
          [lastMessageWithAudio.id]: responseTimeMs
        }));
      }
      
      // Play the audio - handle mobile autoplay restrictions
      const playAudio = () => {
        if (!audio || !audio.src) {
          console.error('Invalid audio source', audio);
          return;
        }
        
        try {
          // Check if the audio is valid and has a source before playing
          if (audio.readyState === 0) {
            console.log('Audio not ready yet, waiting for loadeddata event');
            
            // Add event listener to play when loaded
            audio.addEventListener('loadeddata', () => {
              console.log('Audio loaded, attempting to play');
              attemptPlay();
            }, { once: true });
            
            // Set a timeout in case the loading takes too long
            setTimeout(() => {
              if (audio.readyState === 0) {
                console.error('Audio failed to load within timeout');
                
                // Mark as not played so UI can be updated
                setPlayedMessages(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(lastMessageWithAudio.text);
                  return newSet;
                });
              }
            }, 5000); // 5 second timeout
          } else {
            // Audio is ready to play
            attemptPlay();
          }
        } catch (error) {
          console.error('Error setting up audio playback:', error);
        }
        
        // Helper function to attempt playing with error handling
        function attemptPlay() {
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('AutoPlay failed:', error);
              // If autoplay fails (e.g., on mobile), we'll provide visual feedback
              // to prompt user to interact
              
              // We don't remove from played messages - this allows the autoplay
              // to try again after user interaction
              setPlayedMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(lastMessageWithAudio.text);
                return newSet;
              });
            });
          }
        }
      };
      
      // Try to play the audio
      playAudio();
      
      // If this character has an associated video, show it
      if (videoAvailable) {
        setShowVideo(true);
        
        // Need to wait slightly for the DOM to update
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(error => {
              console.error('Failed to play video:', error);
            });
          }
        }, 100);
      }
    }
  }, [messages, isAudioEnabled, currentAudio, playedMessages, videoAvailable, userInteracted]);
  
  // Clean up audio and video on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.onended = null;
      }
      
      // Make sure to stop recording if component unmounts
      if (recorder && stream) {
        stopRecordingAndCleanUp();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudio, recorder, stream]);
  
  // Toggle audio playback
  const toggleAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsAudioEnabled(!isAudioEnabled);
  };
  
  // Handle starting voice recording
  const handleStartRecording = async () => {
    try {
      // Stop any playing audio
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      
      const { recorder: newRecorder, stream: newStream } = await startRecording();
      setRecorder(newRecorder);
      setStream(newStream);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };
  
  // Handle stopping voice recording
  const handleStopRecording = async () => {
    if (!recorder || !stream) return;
    
    setIsProcessingSpeech(true);
    
    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording(recorder, stream);
      
      // Clean up recorder and stream
      setRecorder(null);
      setStream(null);
      setIsRecording(false);
      
      // Transcribe the audio
      const transcribedText = await speechToText(audioBlob);
      
      // Set the transcribed text as input
      setInputValue(transcribedText);
      
      // Automatically send the message
      if (transcribedText.trim()) {
        setTimeout(() => {
          handleSendMessage(transcribedText);
        }, 100);
      }
    } catch (error) {
      console.error('Error processing speech:', error);
    } finally {
      setIsProcessingSpeech(false);
    }
  };
  
  // Helper function to stop recording and clean up
  const stopRecordingAndCleanUp = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setRecorder(null);
    setStream(null);
    setIsRecording(false);
  };
  
  // Toggle video display
  const toggleVideo = () => {
    setShowVideo(!showVideo);
  };
  
  // Play a specific message audio
  const playMessageAudio = (message) => {
    if (!message || !message.audio) {
      console.error('Attempted to play message without audio:', message);
      return;
    }
    
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.onended = null;
      }
      
      const audio = message.audio;
      
      // Check if the source is from a Firebase Storage URL
      if (audio.src.includes('firebasestorage.googleapis.com')) {
        console.log('Firebase storage URL detected in message audio, adding CORS parameters');
        // Add token and alt parameter if not present
        if (!audio.src.includes('alt=media')) {
          const separator = audio.src.includes('?') ? '&' : '?';
          audio.src = `${audio.src}${separator}alt=media`;
        }
      }
      
      // Set this as the current audio
      setCurrentAudio(audio);
      
      // Add error handling to the audio element
      audio.onerror = (e) => {
        console.error('Error playing message audio:', e);
        alert('Sorry, there was an error playing the audio. Please try again.');
      };
      
      // Check if the audio is valid and has a source before playing
      if (audio.readyState === 0) {
        console.log('Message audio not ready yet, waiting for loadeddata event');
        
        // Add event listener to play when loaded
        audio.addEventListener('loadeddata', () => {
          console.log('Message audio loaded, attempting to play');
          attemptPlay();
        }, { once: true });
        
        // Set a timeout in case the loading takes too long
        setTimeout(() => {
          if (audio.readyState === 0) {
            console.error('Message audio failed to load within timeout');
          }
        }, 5000); // 5 second timeout
      } else {
        // Audio is ready to play
        attemptPlay();
      }
      
      // Helper function to attempt playing with error handling
      function attemptPlay() {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Failed to play message audio:', error);
            
            // If this is the first interaction, it might be an autoplay restriction
            if (!userInteracted) {
              alert('Please interact with the page to enable audio playback.');
            }
          });
        }
      }
      
      // Reset the played status for this message
      setPlayedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.text);
        return newSet;
      });
      
      // Set user interacted to true
      setUserInteracted(true);
    } catch (error) {
      console.error('Error in playMessageAudio:', error);
    }
  };
  
  // Add this function to generate share links for messages
  const generateShareLink = (characterName, shareId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${characterName}/${shareId}`;
  };

  // Add this function to copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  };

  // Function to handle sharing a conversation
  const handleShare = async (message) => {
    // Only character messages can be shared
    if (message.type !== 'character') return;
    
    try {
      setShareTooltip('Creating share link...');
      setShowShareTooltip(true);
      
      // First try to get the audio URL from the message
      let audioUrl = null;
      if (message.audio && message.audio.src) {
        // If it's an object URL, we need to use the existing audioUrl field
        if (message.audio.src.startsWith('blob:')) {
          // Try to get the Firebase audioUrl (if any)
          audioUrl = message.audioUrl;
        } else {
          // It's already a remote URL
          audioUrl = message.audio.src;
        }
      }
      
      // Create a shareable version of this conversation
      const shareId = await createShareableConversation(
        selectedCharacter.name,
        // Find the user message that came before this response
        messages.find(m => m.id === message.replyToId)?.text || "Unknown question",
        message.text,
        audioUrl
      );
      
      // Generate a share link using the character name and share ID
      const shareLink = generateShareLink(selectedCharacter.name, shareId);
      
      // Copy the link to clipboard
      const copied = await copyToClipboard(shareLink);
      
      // Show feedback to the user
      if (copied) {
        setShareTooltip('Link copied to clipboard!');
      } else {
        setShareTooltip('Failed to copy link. Please try again.');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      setShareTooltip('Failed to create share link. Please try again.');
    }
    
    // Hide the tooltip after 3 seconds
    setTimeout(() => {
      setShowShareTooltip(false);
    }, 3000);
  };
  
  // Render a typing indicator or the message text
  const renderMessageContent = (message) => {
    if (message.isTyping) {
      return (
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      );
    }
    
    return (
      <div>
        {message.text}
        {message.id && responseTime[message.id] && (
          <div className="mt-2 text-xs text-amber-700 flex items-center">
            <Clock size={12} className="inline mr-1" /> 
            Response: {(responseTime[message.id] / 1000).toFixed(2)}s
          </div>
        )}
        <div className="mt-2 flex items-center gap-3">
          {message.type === 'character' && message.audio && (
            <button 
              className="text-xs text-amber-700 flex items-center hover:text-amber-500 transition-colors" 
              onClick={() => playMessageAudio(message)}
            >
              <Repeat size={12} className="mr-1" /> Hear again
            </button>
          )}
          
          {message.type === 'character' && (message.conversationId || message.id) && (
            <button 
              className="text-xs text-amber-700 flex items-center hover:text-amber-500 transition-colors" 
              onClick={() => handleShare(message)}
            >
              <Share2 size={12} className="mr-1" /> Share
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        backgroundImage: 'url("assets/desert-bg.png")', 
        backgroundRepeat: 'repeat',
        backgroundSize: '400px'
      }}
    >
      <div className="bg-amber-900 text-amber-50 shadow-md p-4 flex items-center">
      
        <div>
          <h2 className="font-semibold text-xl text-amber-200">{selectedCharacter.name}</h2>
         
          {activeStory && (
            <p className="text-xs text-amber-100 mt-1 italic">
              <span className="mr-1">•</span> {activeStory.title}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center">
          <button 
            className="mr-3 text-amber-200 hover:text-amber-50 flex items-center p-2 transition-colors"
            onClick={onStoryModeClick}
            title="Enter Story Mode"
          >
            <BookOpen size={20} />
            <span className="ml-1 text-xs hidden md:inline">Story Mode</span>
          </button>
          <button 
            className="mr-3 text-amber-200 hover:text-amber-50 p-2 transition-colors"
            onClick={toggleAudio}
            title={isAudioEnabled ? "Silence the voice" : "Hear the voice"}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          {videoAvailable && (
            <button 
              className="mr-3 text-amber-200 hover:text-amber-50 p-2 transition-colors"
              onClick={toggleVideo}
              title={showVideo ? "Hide visage" : "See visage"}
            >
              <Video size={20} />
            </button>
          )}
          <button 
            className="text-amber-200 hover:text-amber-50 transition-colors flex items-center"
            onClick={onBackClick}
          >
            <ArrowLeft size={16} className="mr-1" /> Return
          </button>
        </div>
      </div>
      
      {showVideo && videoAvailable && (
        <div className="relative w-full" style={{ maxHeight: '40vh' }}>
          <video 
            ref={videoRef}
            src={`/${selectedCharacter.name}.mp4`}
            className="w-full h-auto" 
            style={{ maxHeight: '40vh', objectFit: 'contain' }}
            muted={!isAudioEnabled}
            loop
            playsInline
          />
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4 ancient-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 max-w-xs md:max-w-md ${
                message.type === 'user' 
                  ? 'ml-auto bg-amber-100 text-amber-900 rounded-lg rounded-tr-none p-3 border border-amber-200 shadow-md' 
                  : 'bg-amber-50 border border-amber-300 rounded-lg rounded-tl-none p-3 shadow-md'
              }`}
            >
              {renderMessageContent(message)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t border-amber-300 bg-amber-50/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          {suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-amber-800 mb-2">Questions from the scrolls:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm px-3 py-1 rounded-full border border-amber-300 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center bg-amber-50 rounded-lg border border-amber-300 p-2 shadow-inner">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask ${selectedCharacter.name} a question...`}
              className="flex-1 border-none outline-none bg-transparent"
              disabled={messages.some(m => m.isTyping) || isRecording || isProcessingSpeech}
            />
            
            {/* Voice input button */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={messages.some(m => m.isTyping) || isProcessingSpeech}
              className={`ml-2 p-2 rounded-full ${
                isRecording 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-amber-200 hover:bg-amber-300 text-amber-900'
              } transition-colors`}
              title={isRecording ? "End thy speaking" : "Speak thy question"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || messages.some(m => m.isTyping) || isRecording || isProcessingSpeech}
              className={`ml-2 p-2 rounded-full ${
                inputValue.trim() && !messages.some(m => m.isTyping) && !isRecording && !isProcessingSpeech
                  ? 'bg-amber-600 text-amber-50 hover:bg-amber-700' 
                  : 'bg-amber-300 text-amber-500 cursor-not-allowed'
              } transition-colors`}
            >
              <Send size={18} />
            </button>
          </div>
          
          {isProcessingSpeech && (
            <div className="mt-2 text-center text-sm text-amber-700">
              Translating thy voice into written word...
            </div>
          )}
          
          {isRecording && (
            <div className="mt-2 text-center text-sm text-red-600 font-medium">
              Speaking... (Click the symbol again when finished)
            </div>
          )}
        </div>
      </div>
      
      {/* Share tooltip */}
      {showShareTooltip && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-amber-900 text-white px-4 py-2 rounded shadow-lg z-50">
          {shareTooltip}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;