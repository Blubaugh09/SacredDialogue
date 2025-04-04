const esther = { 
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
    queen: [
      "What was palace life like?",
      "Tell me about your relationship with Mordecai",
      "How did you handle the responsibilities of being queen?"
    ],
    courage: [
      "Were you afraid to reveal your Jewish identity?",
      "How did you prepare to approach the king?",
      "What gave you strength during this difficult time?"
    ],
    default: [
      "Tell me about Haman's plot",
      "How did you feel about the king's decree?",
      "What did you learn through your experiences?"
    ]
  },
  responses: {
    queen: "Becoming queen was never my ambition. I was a simple Jewish girl named Hadassah living under the care of my cousin Mordecai when King Xerxes held a contest to find a new queen after Queen Vashti was deposed. I was taken to the palace along with many other young women. For twelve months, we underwent beauty treatments before being presented to the king. When my turn came to go before him, I won his favor over all the other women, and he placed the royal crown on my head. This was not mere chance but divine providence. God positioned me in the palace 'for such a time as this,' though I did not understand His purpose until later. Palace life was luxurious but constraining, and I had to carefully guard the secret of my Jewish heritage at Mordecai's instruction.",
    
    courage: "Finding courage to approach the king uninvited was perhaps the most difficult moment of my life. According to Persian law, anyone who approached the king without being summoned could be put to death unless he extended his golden scepter. When Mordecai informed me about Haman's plot to destroy our people, I was initially afraid. But his words moved me deeply: 'Who knows whether you have come to the kingdom for such a time as this?' I asked all the Jews to fast with me for three days, and I fasted with my maids as well. Drawing strength from prayer and the support of my people, I prepared myself to face the king. I put on my royal robes—not to impress with external beauty, but to approach in the dignity of the position God had given me. When I finally entered the king's inner court, my heart was pounding, but I was at peace, having surrendered my life to God's purpose. It was a profound lesson that true courage is not the absence of fear, but acting in faith despite that fear.",
    
    save: "Saving my people was a divine miracle that unfolded through a series of seemingly small events. After the king extended his scepter to me, I did not immediately reveal Haman's plot. Instead, I invited the king and Haman to two banquets. This delay proved crucial, as during that night, the king couldn't sleep and had the royal chronicles read to him. He discovered that Mordecai had never been rewarded for exposing an assassination plot. The next day, Haman—who had built gallows to hang Mordecai—was forced to honor him instead. At my second banquet, I finally revealed my Jewish identity and exposed Haman's genocidal plan. The king's anger against Haman resulted in Haman being hanged on the very gallows he had prepared for Mordecai. Yet our challenges weren't over, as the king's first decree allowing our destruction couldn't be revoked. A new decree was issued giving Jews the right to defend themselves. On the day appointed for our destruction, we instead experienced victory. This taught me that God works through human actions to fulfill His promises, and sometimes we are called to risk everything for the sake of others.",
    
    mordecai: "Mordecai was more than just my cousin—he raised me as his own daughter after my parents died. Our relationship was one of deep mutual respect and trust. He was my guide and counselor even after I became queen, and I continued to obey his instructions as I had done when under his care. Each day, he would walk by the court of the palace to learn how I was doing. When he discovered Haman's plot, he put on sackcloth and ashes and wailed loudly at the king's gate. Our relationship proved crucial during the crisis. Though I was queen, I valued his wisdom and heeded his counsel. After Haman's downfall, Mordecai was elevated to a position of honor, given the king's signet ring, and made second in rank to King Xerxes. Our story demonstrates how God uses family relationships and mentoring to accomplish His purposes. Mordecai taught me courage, wisdom, and unwavering faith in God's sovereignty, even when circumstances seemed hopeless.",
    
    haman: "Haman was an Agagite, a descendant of the ancient enemies of Israel, and rose to become the king's highest official. His pride was his downfall. When Mordecai refused to bow down to him, Haman was filled with rage and plotted to destroy not just Mordecai but all Jews throughout the empire. He cast 'pur' (lots) to determine the day for this genocide and convinced the king to issue a decree. What was most chilling about Haman was how his hatred blinded him. Even when surrounded by wealth, honor, and family, he told his wife and friends, 'All this is worth nothing to me, so long as I see Mordecai the Jew sitting at the king's gate.' His story reveals how unchecked hatred can consume a person and lead to their destruction. In a divine twist of justice, every evil Haman planned came back upon his own head. He was hanged on the gallows he built for Mordecai, and his property was given to me. The feast of Purim, which Jews celebrate to this day, commemorates our deliverance from his wicked scheme.",
    
    faith: "Though God's name is never mentioned in the book of Esther, His hand of providence is evident throughout my story. My faith was not displayed through public prayers or religious ceremonies, but through courageous action in response to God's calling. When faced with possible death, I embraced the purpose for which God had placed me in the royal palace. The three-day fast I called for was clearly a spiritual preparation, even without explicitly mentioning prayer. My famous words, 'If I perish, I perish,' reflect not fatalism but a deep surrender to God's will. The most important lesson from my life is that God often works behind the scenes. He doesn't always part the sea or send fire from heaven, but He orchestrates circumstances and positions people strategically to accomplish His purposes. Even when God seems silent, He is working. My story encourages people of faith to look for God's hand in the 'coincidences' of life and to realize that they too might be placed in their positions—whatever those may be—'for such a time as this.'"
  },
  keywords: {
    queen: ['queen', 'becoming', 'vashti', 'crown', 'palace', 'king', 'xerxes', 'ahasuerus'],
    courage: ['courage', 'approach', 'risk', 'brave', 'fear', 'scepter', 'uninvited', 'summon'],
    save: ['save', 'rescue', 'people', 'jews', 'decree', 'defend', 'victory', 'deliverance'],
    mordecai: ['mordecai', 'cousin', 'relative', 'guardian', 'gate', 'advice', 'promoted'],
    haman: ['haman', 'enemy', 'plot', 'agagite', 'gallows', 'destruction', 'pur', 'lots'],
    faith: ['faith', 'god', 'providence', 'purpose', 'time', 'position', 'fast', 'prayer']
  }
};

export default esther; 