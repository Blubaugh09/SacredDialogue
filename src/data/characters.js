/**
 * Biblical characters data with their information and predefined responses
 */

const characters = [
  { 
    id: 1, 
    name: 'Abraham', 
    color: '#8B4513',
    greeting: 'Greetings! I am Abraham from the scriptures. What would you like to ask me about my life and experiences?',
    defaultSuggestions: [
      "Tell me about your journey from Ur to Canaan",
      "What happened with Isaac on Mount Moriah?",
      "How did you feel when God promised you descendants?"
    ],
    suggestionsMap: {
      journey: [
        "Tell me about your time in Egypt",
        "What was your relationship with Lot?",
        "How did you choose where to settle?"
      ],
      isaac: [
        "Tell me about your other son Ishmael",
        "How did Sarah react to God's promise?",
        "What was it like raising Isaac?"
      ],
      default: [
        "What happened at Sodom and Gomorrah?",
        "Tell me about your encounter with Melchizedek",
        "How did you negotiate with God over Sodom?"
      ]
    },
    responses: {
      journey: "God called me to leave my home in Ur of the Chaldeans and journey to a land He would show me. It was a test of faith to leave everything familiar behind, but I trusted in God's promise. The journey was long and difficult, but my faith sustained me as we traveled to Canaan, the land God promised to my descendants.",
      isaac: "The day God asked me to sacrifice my son Isaac was the most difficult test of my faith. As we climbed Mount Moriah, my heart was heavy, but I trusted God completely. At the last moment, God provided a ram for the sacrifice instead. Through this, I learned that God provides and that His promises are trustworthy, even when we cannot see how.",
      descendants: "God promised me descendants as numerous as the stars in the sky and the sand on the seashore. Though Sarah and I were old and childless for many years, God fulfilled His promise through the birth of Isaac. This covenant established me as the father of many nations, and through my lineage came the blessing for all peoples of the earth.",
      sarah: "Sarah was not only my wife but my half-sister and faithful companion throughout our journey. She laughed when she heard she would bear a son in her old age, but God's promise came true with Isaac's birth. Her faith was tested alongside mine as we waited many years for God's promise to be fulfilled.",
      hagar: "Hagar was Sarah's Egyptian servant whom my wife gave to me as a concubine when we thought Sarah would never have children. Ishmael, my first son, was born through Hagar. There was tension after Isaac's birth, and God instructed me to send Hagar and Ishmael away, which grieved me deeply. But God promised to make Ishmael a great nation too, and He watched over them in the wilderness. I learned that God has plans that extend beyond what we can see, and He is faithful even in painful circumstances.",
      lot: "Lot was my nephew who journeyed with me from Ur. As our flocks grew, our herdsmen began to quarrel over land, so we agreed to separate. I gave Lot the choice of land, and he chose the fertile Jordan Valley near Sodom. Later, when four kings captured Sodom and took Lot prisoner, I gathered 318 trained men and rescued him. Though Lot made choices that led him toward Sodom's wickedness, I never abandoned him. Sometimes the hardest lesson is watching those we love make difficult choices while still showing them compassion.",
      faith: "My faith journey had many tests and moments of doubt. When God first called me, I obeyed even without knowing the destination. When years passed without the promised heir, I questioned and took matters into my own hands with Hagar. But God was patient with my imperfect faith. The greatest lesson I learned is that faith isn't about never doubting—it's about continuing to trust God despite those doubts. That's why I'm remembered not for my perfection, but for my willingness to believe God's promises even when they seemed impossible.",
      names: "I was born as Abram, which means 'exalted father,' but God renamed me Abraham, meaning 'father of many nations.' This name change came when I was 99 years old, still childless, yet God was declaring His promise as if it had already happened. Similarly, my wife's name changed from Sarai to Sarah. These new names were constant reminders of God's covenant promises and our new identities in His plan. Names held great significance in our culture—they declared destiny and purpose. My new name reminded me daily of God's faithfulness even before I saw the fulfillment.",
      sodom: "The destruction of Sodom and Gomorrah revealed both God's justice and mercy. Three visitors came to me—the Lord himself with two angels. They told me of their plan to destroy these wicked cities. My nephew Lot lived there, so I pleaded with God, asking if He would spare the city for fifty righteous people, then gradually negotiated down to ten. God agreed, showing His mercy and willingness to listen to intercession. Though He couldn't find even ten righteous people, God still remembered me and rescued Lot and his daughters.",
      melchizedek: "My encounter with Melchizedek came after I rescued Lot from captivity. Melchizedek was the king of Salem and priest of God Most High—a mysterious figure who brought out bread and wine to bless me. I gave him a tenth of everything, recognizing his spiritual authority. He blessed me saying, 'Blessed be Abram by God Most High, Creator of heaven and earth. And praise be to God Most High, who delivered your enemies into your hand.'",
      egypt: "Our journey to Egypt was driven by severe famine in Canaan. I feared for our safety because Sarah was beautiful, and I worried the Egyptians might kill me to take her. So I asked her to say she was my sister—which was partly true, as she was my half-sister. Pharaoh took Sarah into his palace and gave me livestock and servants, but then God sent plagues upon Pharaoh's household. When Pharaoh learned the truth, he sent us away with all our possessions."
    },
    // Keywords to match for different response types
    keywords: {
      journey: ['journey', 'ur', 'canaan', 'travel'],
      isaac: ['isaac', 'son', 'sacrifice', 'moriah'],
      descendants: ['promise', 'descendants', 'stars', 'covenant', 'nations'],
      sarah: ['sarah', 'wife', 'spouse'],
      hagar: ['hagar', 'ishmael', 'servant', 'maid'],
      lot: ['lot', 'nephew', 'sodom'],
      faith: ['faith', 'believe', 'trust', 'doubt'],
      names: ['abram', 'sarai', 'name', 'rename'],
      sodom: ['sodom', 'gomorrah', 'destroy', 'city'],
      melchizedek: ['melchizedek', 'priest', 'salem', 'king'],
      egypt: ['egypt', 'pharaoh', 'famine']
    }
  },
  { 
    id: 2, 
    name: 'Moses', 
    color: '#B22222',
    greeting: 'Greetings! I am Moses who led the Israelites out of Egypt. What would you like to know about my experiences?',
    defaultSuggestions: [
      "Tell me about the burning bush",
      "What was it like to confront Pharaoh?",
      "How did you feel when you received the Ten Commandments?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge as a leader?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  },
  { 
    id: 3, 
    name: 'David', 
    color: '#4169E1',
    greeting: 'Hello! I am David, shepherd, musician, warrior, and king of Israel. What would you like to ask me?',
    defaultSuggestions: [
      "Tell me about defeating Goliath",
      "What inspired your psalms?",
      "How did you handle being pursued by Saul?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge as a leader?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  },
  { 
    id: 4, 
    name: 'Daniel', 
    color: '#DAA520',
    greeting: 'Greetings! I am Daniel, who served in the courts of Babylon. What would you like to know about my experiences?',
    defaultSuggestions: [
      "Tell me about the lions' den",
      "What visions did God give you?",
      "How did you remain faithful in a foreign land?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  },
  { 
    id: 5, 
    name: 'Esther', 
    color: '#9932CC',
    greeting: 'Greetings! I am Queen Esther. What would you like to know about how God used me to save my people?',
    defaultSuggestions: [
      "Tell me about becoming queen",
      "How did you find courage to approach the king?",
      "What was it like to save your people?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  },
  { 
    id: 6, 
    name: 'Mary', 
    color: '#2E8B57',
    greeting: 'Greetings! I am Mary, the mother of Jesus. What would you like to know about my extraordinary journey?',
    defaultSuggestions: [
      "Tell me about the angel's visit",
      "What was it like raising Jesus?",
      "How did you feel at the crucifixion?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  },
  { 
    id: 7, 
    name: 'Paul', 
    color: '#708090',
    greeting: 'Greetings! I am Paul, once a persecutor of the church, transformed by Christ. What would you like to know about my ministry?',
    defaultSuggestions: [
      "Tell me about your conversion on the Damascus road",
      "What was it like writing the epistles?",
      "How did you endure persecution and imprisonment?"
    ],
    suggestionsMap: {
      default: [
        "What was your greatest challenge?",
        "Tell me about your relationship with God",
        "What lesson should we learn from your life?"
      ]
    },
    responses: {
      // Add responses later
    },
    keywords: {
      // Add keywords later
    }
  }
];

export default characters; 