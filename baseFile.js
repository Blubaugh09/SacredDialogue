import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Info } from 'lucide-react';

const BiblicalCharacterDialogue = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Biblical characters
  const characters = [
    { id: 1, name: 'Abraham', color: '#8B4513' },
    { id: 2, name: 'Moses', color: '#B22222' },
    { id: 3, name: 'David', color: '#4169E1' },
    { id: 4, name: 'Daniel', color: '#DAA520' },
    { id: 5, name: 'Esther', color: '#9932CC' },
    { id: 6, name: 'Mary', color: '#2E8B57' },
    { id: 7, name: 'Paul', color: '#708090' },
  ];
  
  // Character animation
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
    const interval = setInterval(() => {
      setPositions(prevPositions => {
        const newPositions = {...prevPositions};
        characters.forEach(char => {
          newPositions[char.id] = {
            x: prevPositions[char.id].x + (Math.random() - 0.5) * 2,
            y: prevPositions[char.id].y + (Math.random() - 0.5) * 2
          };
        });
        return newPositions;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Character selection handler
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setMessages([
      { 
        type: 'character', 
        text: `Greetings! I am ${character.name} from the scriptures. What would you like to ask me about my life and experiences?` 
      }
    ]);
    
    // Set character-specific suggestions
    if (character.name === 'Abraham') {
      setSuggestions([
        "Tell me about your journey from Ur to Canaan",
        "What happened with Isaac on Mount Moriah?",
        "How did you feel when God promised you descendants?"
      ]);
    } else {
      setSuggestions([
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]);
    }
  };
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessages = [
      ...messages,
      { type: 'user', text: inputValue }
    ];
    setMessages(newMessages);
    setInputValue('');
    
    // Simulate Abraham's response
    setTimeout(() => {
      let response = "I'm not sure I understand that question. Perhaps ask me about my journey, my family, or my covenant with God?";
      
      const question = inputValue.toLowerCase();
      
      if (selectedCharacter.name === 'Abraham') {
        if (question.includes('journey') || question.includes('ur') || question.includes('canaan')) {
          response = "God called me to leave my home in Ur of the Chaldeans and journey to a land He would show me. It was a test of faith to leave everything familiar behind, but I trusted in God's promise. The journey was long and difficult, but my faith sustained me as we traveled to Canaan, the land God promised to my descendants.";
        } else if (question.includes('isaac') || question.includes('son') || question.includes('sacrifice') || question.includes('moriah')) {
          response = "The day God asked me to sacrifice my son Isaac was the most difficult test of my faith. As we climbed Mount Moriah, my heart was heavy, but I trusted God completely. At the last moment, God provided a ram for the sacrifice instead. Through this, I learned that God provides and that His promises are trustworthy, even when we cannot see how.";
        } else if (question.includes('promise') || question.includes('descendants') || question.includes('stars') || question.includes('covenant')) {
          response = "God promised me descendants as numerous as the stars in the sky and the sand on the seashore. Though Sarah and I were old and childless for many years, God fulfilled His promise through the birth of Isaac. This covenant established me as the father of many nations, and through my lineage came the blessing for all peoples of the earth.";
        } else if (question.includes('sarah') || question.includes('wife')) {
          response = "Sarah was not only my wife but my half-sister and faithful companion throughout our journey. She laughed when she heard she would bear a son in her old age, but God's promise came true with Isaac's birth. Her faith was tested alongside mine as we waited many years for God's promise to be fulfilled.";
        } else if (question.includes('hagar') || question.includes('ishmael')) {
          response = "Hagar was Sarah's Egyptian servant whom my wife gave to me as a concubine when we thought Sarah would never have children. Ishmael, my first son, was born through Hagar. There was tension after Isaac's birth, and God instructed me to send Hagar and Ishmael away, which grieved me deeply. But God promised to make Ishmael a great nation too, and He watched over them in the wilderness. I learned that God has plans that extend beyond what we can see, and He is faithful even in painful circumstances.";
        } else if (question.includes('lot') || question.includes('nephew')) {
          response = "Lot was my nephew who journeyed with me from Ur. As our flocks grew, our herdsmen began to quarrel over land, so we agreed to separate. I gave Lot the choice of land, and he chose the fertile Jordan Valley near Sodom. Later, when four kings captured Sodom and took Lot prisoner, I gathered 318 trained men and rescued him. Though Lot made choices that led him toward Sodom's wickedness, I never abandoned him. Sometimes the hardest lesson is watching those we love make difficult choices while still showing them compassion.";
        } else if (question.includes('faith') || question.includes('believe') || question.includes('trust')) {
          response = "My faith journey had many tests and moments of doubt. When God first called me, I obeyed even without knowing the destination. When years passed without the promised heir, I questioned and took matters into my own hands with Hagar. But God was patient with my imperfect faith. The greatest lesson I learned is that faith isn't about never doubting—it's about continuing to trust God despite those doubts. That's why I'm remembered not for my perfection, but for my willingness to believe God's promises even when they seemed impossible.";
        } else if (question.includes('names') || question.includes('abram') || question.includes('renamed')) {
          response = "I was born as Abram, which means 'exalted father,' but God renamed me Abraham, meaning 'father of many nations.' This name change came when I was 99 years old, still childless, yet God was declaring His promise as if it had already happened. Similarly, my wife's name changed from Sarai to Sarah. These new names were constant reminders of God's covenant promises and our new identities in His plan. Names held great significance in our culture—they declared destiny and purpose. My new name reminded me daily of God's faithfulness even before I saw the fulfillment.";
        }
      }
      
      setMessages(prev => [...prev, { type: 'character', text: response }]);
      
      // Update suggestions based on the conversation
      if (selectedCharacter.name === 'Abraham') {
        if (question.includes('isaac')) {
          setSuggestions([
            "Tell me about your other son Ishmael",
            "How did Sarah react to God's promise?",
            "What was it like raising Isaac?"
          ]);
        } else if (question.includes('journey')) {
          setSuggestions([
            "Tell me about your time in Egypt",
            "What was your relationship with Lot?",
            "How did you choose where to settle?"
          ]);
        } else {
          setSuggestions([
            "What happened at Sodom and Gomorrah?",
            "Tell me about your encounter with Melchizedek",
            "How did you negotiate with God over Sodom?"
          ]);
        }
      }
    }, 1000);
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setMessages([
      ...messages,
      { type: 'user', text: suggestion }
    ]);
    
    // Simulate Abraham's response for the suggestion
    setTimeout(() => {
      let response = "That's an excellent question about my experiences.";
      
      if (selectedCharacter.name === 'Abraham') {
        if (suggestion.includes('journey from Ur')) {
          response = "Leaving Ur was one of the defining moments of my life. God called me to go to an unknown land, promising to make me into a great nation. Though I was already 75 years old, I took my wife Sarah, my nephew Lot, and all our possessions and servants, and we set out for Canaan. The journey tested my faith and taught me to trust God's guidance completely.";
        } else if (suggestion.includes('Isaac on Mount Moriah')) {
          response = "The sacrifice of Isaac was my greatest test of faith. When God asked me to offer my son as a sacrifice, I was heartbroken but trusted that God would somehow keep His promise that through Isaac my descendants would continue. As I raised the knife, an angel stopped me and provided a ram instead. This taught me that God sometimes tests our faith to strengthen it, and that He always provides a way.";
        } else if (suggestion.includes('descendants')) {
          response = "When God promised me descendants as numerous as the stars, I was nearly 100 years old and Sarah was 90 and barren. I laughed at first—it seemed impossible! But I learned that nothing is impossible with God. The birth of Isaac was just the beginning. Now, thousands of years later, I am known as the father of faith for many nations, just as God promised.";
        } else if (suggestion.includes('other son Ishmael')) {
          response = "Ishmael was my firstborn son through Hagar, Sarah's Egyptian servant. When Sarah couldn't have children, she gave Hagar to me as a wife, which was a custom of our time. Ishmael was 13 years old when Isaac was born, and there was tension between Sarah and Hagar. Though it broke my heart, God instructed me to send Hagar and Ishmael away, but He promised to make Ishmael into a great nation too. God was faithful to that promise—Ishmael became the father of twelve princes and a great nation of his own.";
        } else if (suggestion.includes('time in Egypt')) {
          response = "Our journey to Egypt was driven by severe famine in Canaan. I feared for our safety because Sarah was beautiful, and I worried the Egyptians might kill me to take her. So I asked her to say she was my sister—which was partly true, as she was my half-sister. Pharaoh took Sarah into his palace and gave me livestock and servants, but then God sent plagues upon Pharaoh's household. When Pharaoh learned the truth, he sent us away with all our possessions. This taught me that my deception, even from fear, had consequences, and that I should have trusted God more fully for protection.";
        } else if (suggestion.includes('Sodom and Gomorrah')) {
          response = "The destruction of Sodom and Gomorrah revealed both God's justice and mercy. Three visitors came to me—the Lord himself with two angels. They told me of their plan to destroy these wicked cities. My nephew Lot lived there, so I pleaded with God, asking if He would spare the city for fifty righteous people, then gradually negotiated down to ten. God agreed, showing His mercy and willingness to listen to intercession. Though He couldn't find even ten righteous people, God still remembered me and rescued Lot and his daughters. It was a solemn reminder that God judges sin but always provides a way of escape for those who follow Him.";
        } else if (suggestion.includes('Melchizedek')) {
          response = "My encounter with Melchizedek came after I rescued Lot from captivity. Melchizedek was the king of Salem and priest of God Most High—a mysterious figure who brought out bread and wine to bless me. I gave him a tenth of everything, recognizing his spiritual authority. He blessed me saying, 'Blessed be Abram by God Most High, Creator of heaven and earth. And praise be to God Most High, who delivered your enemies into your hand.' This meeting showed me that God had established ways to worship Him even in lands where I was a stranger, and Melchizedek's blessing affirmed God's protection over my life.";
        } else if (suggestion.includes('Sarah react')) {
          response = "When God promised us a child in our old age, Sarah laughed in disbelief. She was 90 years old and had been barren all her life. When the visitors told us she would have a son, she denied laughing out of embarrassment, but God knew her heart. Her laughter turned from doubt to joy when Isaac was born—we even named him 'Isaac,' which means 'laughter.' Sarah said, 'God has brought me laughter, and everyone who hears about this will laugh with me.' Her journey from disbelief to wonder shows how God often works beyond our understanding, bringing joy where we least expect it.";
        }
      }
      
      setMessages(prev => [...prev, { type: 'character', text: response }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {!selectedCharacter ? (
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Select a Biblical Character to Talk With</h1>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 mt-8">
            {characters.map((character) => (
              <div 
                key={character.id}
                className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
                onClick={() => handleCharacterSelect(character)}
                style={{
                  transform: `translate(${positions[character.id]?.x || 0}px, ${positions[character.id]?.y || 0}px)`
                }}
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: character.color }}
                >
                  <div className="text-white text-2xl font-bold">
                    {character.name.charAt(0)}
                  </div>
                </div>
                <span className="text-sm font-medium">{character.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md p-4 flex items-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: selectedCharacter.color }}
            >
              <div className="text-white text-lg font-bold">
                {selectedCharacter.name.charAt(0)}
              </div>
            </div>
            <div>
              <h2 className="font-bold">{selectedCharacter.name}</h2>
              <p className="text-xs text-gray-500">Biblical Character</p>
            </div>
            <button 
              className="ml-auto text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedCharacter(null)}
            >
              Back
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 bg-slate-50">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 max-w-xs md:max-w-md ${
                  message.type === 'user' 
                    ? 'ml-auto bg-blue-500 text-white rounded-lg rounded-tr-none p-3' 
                    : 'bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-sm'
                }`}
              >
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4">
            <div className="mb-2">
              <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded-full"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center bg-white rounded-lg border border-gray-300 p-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask ${selectedCharacter.name} a question...`}
                className="flex-1 border-none outline-none bg-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`ml-2 p-2 rounded-full ${
                  inputValue.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BiblicalCharacterDialogue;