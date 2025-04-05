import React from 'react';

const StoryMode = ({ 
  selectedCharacter, 
  onStorySelect, 
  onClose 
}) => {
  // Define story data for each character
  // In a real app, this would likely come from the character data
  const characterStories = {
    // Jesus stories
    'Jesus': [
      {
        id: 'jesus_sermon',
        title: 'The Sermon on the Mount',
        description: 'Experience Jesus teaching his most famous sermon about the Beatitudes, salt and light, and the true meaning of the Law.',
        type: 'storytelling'
      },
      {
        id: 'jesus_parables',
        title: 'Parables of the Kingdom',
        description: 'Listen as Jesus explains the Kingdom of God through parables like the mustard seed, the leaven, and the hidden treasure.',
        type: 'storytelling'
      },
      {
        id: 'jesus_lastsupper',
        title: 'The Last Supper',
        description: 'Join Jesus and his disciples at the final Passover meal as he institutes communion and prepares for his sacrifice.',
        type: 'storytelling'
      }
    ],
    // Moses stories
    'Moses': [
      {
        id: 'moses_burning_bush',
        title: 'The Burning Bush',
        description: 'Witness the moment when God called Moses through a bush that burned but was not consumed.',
        type: 'storytelling'
      },
      {
        id: 'moses_exodus',
        title: 'The Exodus from Egypt',
        description: 'Experience the dramatic confrontation with Pharaoh and the miraculous crossing of the Red Sea.',
        type: 'storytelling'
      },
      {
        id: 'moses_tencommandments',
        title: 'Receiving the Ten Commandments',
        description: 'Join Moses on Mount Sinai as he receives the Law from God amid thunder and lightning.',
        type: 'storytelling'
      }
    ],
    // David stories
    'David': [
      {
        id: 'david_goliath',
        title: 'Defeating Goliath',
        description: 'Experience the famous battle where young David faces the Philistine giant with only a sling and five stones.',
        type: 'storytelling'
      },
      {
        id: 'david_king',
        title: 'Becoming King of Israel',
        description: 'Follow David\'s journey from shepherd to king as he is anointed and eventually takes the throne.',
        type: 'storytelling'
      },
      {
        id: 'david_psalms',
        title: 'Writing the Psalms',
        description: 'Join David as he composes some of his most famous psalms during both triumphs and struggles.',
        type: 'storytelling'
      }
    ],
    // Abraham stories
    'Abraham': [
      {
        id: 'abraham_calling',
        title: 'The Call to Leave Ur',
        description: 'Join Abraham as he receives God\'s call to leave his homeland and journey to an unknown land.',
        type: 'storytelling'
      },
      {
        id: 'abraham_covenant',
        title: 'The Covenant with God',
        description: 'Witness the moment when God makes a covenant with Abraham, promising descendants as numerous as the stars.',
        type: 'storytelling'
      },
      {
        id: 'abraham_isaac',
        title: 'The Sacrifice of Isaac',
        description: 'Experience the dramatic test of faith as Abraham is asked to sacrifice his beloved son Isaac.',
        type: 'storytelling'
      }
    ],
    // Default stories for characters without specific stories
    'default': [
      {
        id: 'calling',
        title: 'Divine Calling',
        description: 'Experience the moment when this biblical figure was called by God for a special purpose.',
        type: 'storytelling'
      },
      {
        id: 'greatest_challenge',
        title: 'Greatest Challenge',
        description: 'Journey through the greatest test or challenge this character faced in their faith journey.',
        type: 'storytelling'
      },
      {
        id: 'legacy',
        title: 'Lasting Legacy',
        description: 'Discover how this character\'s life and choices continue to impact faith and history today.',
        type: 'storytelling'
      }
    ]
  };

  // Get the stories for the selected character (or use default if not found)
  const stories = characterStories[selectedCharacter.name] || characterStories.default;

  // Guided conversations - common to all characters
  const guidedConversations = [
    {
      id: 'faith_journey',
      title: 'Faith Journey',
      description: 'A guided conversation about developing faith through trials and blessings.',
      type: 'guided'
    },
    {
      id: 'lessons_for_today',
      title: 'Lessons for Today',
      description: 'Explore how this character\'s experiences relate to modern challenges.',
      type: 'guided'
    },
    {
      id: 'divine_encounters',
      title: 'Divine Encounters',
      description: 'Discuss moments when this character experienced God\'s presence directly.',
      type: 'guided'
    }
  ];

  // Handler for story selection
  const handleStorySelect = (story) => {
    onStorySelect(story);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-amber-50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundImage: 'url("/papyrus-texture.jpg")', 
          backgroundRepeat: 'repeat',
          backgroundSize: '400px'
        }}
      >
        <div className="sticky top-0 bg-amber-900 p-4 rounded-t-lg border-b border-amber-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-50">
            Journey with {selectedCharacter.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-amber-200 hover:text-amber-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-amber-900 mb-4 border-b border-amber-200 pb-2">
              Key Moments in {selectedCharacter.name}'s Life
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {stories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-amber-100/80 border border-amber-300 rounded-lg p-4 cursor-pointer hover:bg-amber-200/80 transition-colors shadow-md"
                  onClick={() => handleStorySelect(story)}
                >
                  <h4 className="text-lg font-medium text-amber-900 mb-2">{story.title}</h4>
                  <p className="text-amber-800 text-sm">{story.description}</p>
                  <div className="mt-3 text-xs font-medium text-amber-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Experience this moment
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-amber-900 mb-4 border-b border-amber-200 pb-2">
              Guided Conversations
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {guidedConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="bg-amber-100/80 border border-amber-300 rounded-lg p-4 cursor-pointer hover:bg-amber-200/80 transition-colors shadow-md"
                  onClick={() => handleStorySelect(conversation)}
                >
                  <h4 className="text-lg font-medium text-amber-900 mb-2">{conversation.title}</h4>
                  <p className="text-amber-800 text-sm">{conversation.description}</p>
                  <div className="mt-3 text-xs font-medium text-amber-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Begin this conversation
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-amber-200 bg-amber-100/50 rounded-b-lg">
          <p className="text-center text-amber-800 text-sm italic">
            "For whatever was written in former days was written for our instruction, that through endurance and through the encouragement of the Scriptures we might have hope." — Romans 15:4
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryMode; 