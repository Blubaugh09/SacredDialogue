import React from 'react';

const CharacterSelection = ({ characters, positions, onSelectCharacter }) => {
  // Function to render character avatar (text or video)
  const renderCharacterAvatar = (character) => {
    // Check if video exists for the character
    const hasVideo = character.name === 'Abraham' || character.name === 'Mary' || character.name === 'Esther' || character.name === 'David';
    
    if (hasVideo) {
      return (
        <div 
          className="w-28 h-36 md:w-32 md:h-40 rounded-lg overflow-hidden mb-3 border-2 border-amber-700 shadow-lg"
          style={{ backgroundColor: character.color }}
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={`/${character.name}.mp4`} type="video/mp4" />
            {/* Fallback to text if video fails */}
            <div className="text-white text-2xl font-bold flex items-center justify-center h-full">
              {character.name}
            </div>
          </video>
        </div>
      );
    }
    
    // For characters without videos, use a rectangle with their initial
    return (
      <div 
        className="w-28 h-36 md:w-32 md:h-40 rounded-lg flex items-center justify-center mb-3 border-2 border-amber-700 shadow-lg bg-opacity-80"
        style={{ 
          backgroundColor: character.color,
          backgroundImage: `url("/assets/scroll-bg.jpg")`,
          backgroundSize: 'cover',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="text-white text-3xl font-bold text-center px-2">
          {character.name}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex-1 p-6 relative min-h-screen"
      style={{
        backgroundImage: 'url("/assets/desert-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-amber-900/30"></div>
      
      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-amber-50 drop-shadow-lg">
          <span className="block text-sm font-normal mb-1 uppercase tracking-wider text-amber-200">Conversations from</span>
          The Ancient Scriptures
        </h1>
        
        <div className="max-w-5xl mx-auto p-8 bg-amber-50/90 backdrop-blur-sm rounded-lg border border-amber-200 shadow-xl">
          <h2 className="text-2xl text-center mb-8 text-amber-900 font-semibold">Choose a Biblical Figure</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8 justify-items-center">
            {characters.map((character) => (
              <div 
                key={character.id}
                className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:shadow-xl group"
                onClick={() => onSelectCharacter(character)}
                style={{
                  transform: `translate(${positions[character.id]?.x * 0.3 || 0}px, ${positions[character.id]?.y * 0.3 || 0}px)`
                }}
              >
                {renderCharacterAvatar(character)}
                <span className="text-lg font-semibold text-amber-900 group-hover:text-amber-700">{character.name}</span>
                <span className="text-xs text-amber-700 italic mt-1 opacity-80 group-hover:opacity-100">Speak with {character.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center text-amber-800 text-sm italic border-t border-amber-200 pt-6">
            "And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth." — John 1:14
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection; 