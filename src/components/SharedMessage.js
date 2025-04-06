import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getSharedConversation } from '../firebase/services';
import { Play, Pause } from 'lucide-react';
import { createAudioFromUrl } from '../utils/audioUtils';
import '../styles/SharedMessage.css';

const SharedMessage = () => {
  const { characterName, shareId } = useParams();
  const [shared, setShared] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [videoAvailable, setVideoAvailable] = useState(false);
  
  // Check if video exists for the character
  useEffect(() => {
    const checkVideoAvailability = async () => {
      if (!characterName) return;
      
      try {
        // Create a HEAD request to check if the file exists
        const response = await fetch(`/${characterName}.mp4`, { method: 'HEAD' });
        setVideoAvailable(response.ok);
      } catch (error) {
        console.error('Error checking video availability:', error);
        setVideoAvailable(false);
      }
    };
    
    checkVideoAvailability();
  }, [characterName]);
  
  useEffect(() => {
    const fetchSharedMessage = async () => {
      try {
        setLoading(true);
        const sharedData = await getSharedConversation(shareId);
        
        if (!sharedData) {
          setError('Shared message not found');
          setLoading(false);
          return;
        }
        
        setShared(sharedData);
        
        // Create audio player if there's an audio URL
        if (sharedData.audioUrl) {
          const audio = createAudioFromUrl(sharedData.audioUrl);
          setAudioPlayer(audio);
          
          audio.addEventListener('play', () => setIsPlaying(true));
          audio.addEventListener('pause', () => setIsPlaying(false));
          audio.addEventListener('ended', () => setIsPlaying(false));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared message:', err);
        setError('Failed to load the shared message. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSharedMessage();
    
    // Cleanup function
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.removeEventListener('play', () => setIsPlaying(true));
        audioPlayer.removeEventListener('pause', () => setIsPlaying(false));
        audioPlayer.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, [shareId, audioPlayer]);
  
  const toggleAudio = () => {
    if (!audioPlayer) return;
    
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };
  
  if (loading) {
    return (
      <div className="shared-message-container">
        <div className="loading-spinner">Loading message...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="shared-message-container">
        <div className="error-message">{error}</div>
        <Link to="/" className="home-link">Return to Home</Link>
      </div>
    );
  }
  
  return (
    <div 
      className="shared-message-container"
      style={{ 
        backgroundImage: 'url("/assets/desert-bg.png")', 
        backgroundRepeat: 'repeat',
        backgroundSize: '400px'
      }}
    >
      <div className="shared-header">
        <h1>Conversation with {characterName}</h1>
        <Link to="/" className="home-link">Start Your Own Conversation</Link>
      </div>
      
      {videoAvailable && (
        <div className="video-container">
          <video 
            ref={videoRef}
            src={`/${characterName}.mp4`}
            className="character-video" 
            muted={isPlaying} // Mute video when audio is playing
            loop
            playsInline
            autoPlay
          />
        </div>
      )}
      
      <div className="shared-content">
        <div className="question-card">
          <h3>Question:</h3>
          <p>{shared.userMessage}</p>
        </div>
        
        <div className="response-card">
          <h3>Response from {characterName}:</h3>
          <p>{shared.aiResponse}</p>
          
          {audioPlayer && (
            <button 
              className="audio-button" 
              onClick={toggleAudio}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="audio-button-text">
                {isPlaying ? 'Pause' : 'Play'} Audio
              </span>
            </button>
          )}
        </div>
        
        {shared.timestamp && (
          <div className="timestamp">
            Shared on: {new Date(shared.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMessage; 