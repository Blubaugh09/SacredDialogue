import { useState, useEffect } from 'react';

/**
 * Custom hook for animating characters
 * 
 * @param {Array} characters - Array of character objects
 * @param {number} interval - Animation interval in milliseconds
 * @returns {Object} - Object with character positions
 */
const useCharacterAnimation = (characters, interval = 2000) => {
  const [positions, setPositions] = useState({});
  
  useEffect(() => {
    // Initialize character positions
    const initialPositions = {};
    characters.forEach(char => {
      initialPositions[char.id] = { 
        x: Math.random() * 5, 
        y: Math.random() * 5 
      };
    });
    setPositions(initialPositions);
    
    // Animate characters
    const animationInterval = setInterval(() => {
      setPositions(prevPositions => {
        const newPositions = {...prevPositions};
        characters.forEach(char => {
          newPositions[char.id] = {
            x: prevPositions[char.id]?.x + (Math.random() - 0.5) * 2 || 0,
            y: prevPositions[char.id]?.y + (Math.random() - 0.5) * 2 || 0
          };
        });
        return newPositions;
      });
    }, interval);
    
    return () => clearInterval(animationInterval);
  }, [characters, interval]);
  
  return positions;
};

export default useCharacterAnimation; 