import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConversationById } from '../firebase/services';
import { createAudioFromUrl } from '../utils/audioUtils';
import { Play, Pause } from 'lucide-react';
import '../styles/SharedConversation.css';

const SharedConversation = () => {
  const { characterName, conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const conversationData = await getConversationById(characterName, conversationId);
        
        if (!conversationData) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        
        setConversation(conversationData);
        
        // Create audio player if there's an audio URL
        if (conversationData.audioUrl) {
          try {
            const audio = createAudioFromUrl(conversationData.audioUrl);
            if (audio) {
              // Make sure it's a valid audio element before adding event listeners
              audio.addEventListener('play', () => setIsPlaying(true));
              audio.addEventListener('pause', () => setIsPlaying(false));
              audio.addEventListener('ended', () => setIsPlaying(false));
              setAudioPlayer(audio);
            }
          } catch (err) {
            console.error('Error creating audio element:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load the conversation. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchConversation();
    
    // Cleanup function
    return () => {
      if (audioPlayer && typeof audioPlayer.pause === 'function') {
        try {
          audioPlayer.pause();
          
          // Only try to remove event listeners if they were added successfully
          if (audioPlayer.removeEventListener) {
            audioPlayer.removeEventListener('play', () => setIsPlaying(true));
            audioPlayer.removeEventListener('pause', () => setIsPlaying(false));
            audioPlayer.removeEventListener('ended', () => setIsPlaying(false));
          }
        } catch (err) {
          console.error('Error cleaning up audio player:', err);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterName, conversationId]);
  
  const handlePlayAudio = () => {
    if (!audioPlayer) return;
    
    try {
      if (isPlaying && typeof audioPlayer.pause === 'function') {
        audioPlayer.pause();
      } else if (typeof audioPlayer.play === 'function') {
        audioPlayer.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="shared-conversation-container">
        <div className="loading-spinner">Loading conversation...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="shared-conversation-container">
        <div className="error-message">{error}</div>
        <Link to="/" className="home-link">Return to Home</Link>
      </div>
    );
  }
  
  return (
    <div className="shared-conversation-container">
      <div className="shared-header">
        <h1>Conversation with {characterName}</h1>
        <Link to="/" className="home-link">Return to Home</Link>
      </div>
      
      <div className="shared-content">
        <div className="question-card">
          <h3>Question:</h3>
          <p>{conversation.userMessage}</p>
        </div>
        
        <div className="response-card">
          <h3>Response from {characterName}:</h3>
          <p>{conversation.aiResponse}</p>
          
          {audioPlayer && (
            <button 
              className="audio-button" 
              onClick={handlePlayAudio}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="audio-button-text">
                {isPlaying ? 'Pause' : 'Play'} Audio
              </span>
            </button>
          )}
        </div>
        
        <div className="timestamp">
          Shared on: {new Date(conversation.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default SharedConversation; 