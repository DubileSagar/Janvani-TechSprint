import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-flash-latest',
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
  ]
});

import { useLanguage } from '../context/LanguageContext';

const Chatbot = () => {
  const { language, isHindi } = useLanguage();
  const [messages, setMessages] = useState([
    { text: isHindi ? "नमस्ते! मैं आपके क्षेत्र को स्वच्छ रखने में मदद करने के लिए यहाँ हूँ। मुझसे कुछ भी पूछें!" : "Hi! I'm here to help you keep your area clean. Ask me anything!", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatWindowRef = useRef(null);

  const systemPreamble = `You are 'JanSathi', a specialized AI assistant dedicated to promoting cleanliness in India.
  
  **CRITICAL INSTRUCTION:**
  The user's preferred language is: ${language === 'hi' ? 'HINDI' : 'ENGLISH'}.
  You MUST answer in ${language === 'hi' ? 'HINDI' : 'ENGLISH'} language only.
  
  **YOUR MISSION:**
  To educate and assist citizens in maintaining a clean environment.`;

  async function getBotResponse(input) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return "Error: Gemini API Key is missing. Please check your configuration.";
    }

    const prompt = `${systemPreamble}\n\nUser: ${input}\nAssistant:`;
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024
        }
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        console.warn("Gemini returned empty text. Full result:", result);
      }

      return text.trim() || 'I did not find enough details. Could you rephrase or add context?';
    } catch (e) {
      console.error('Gemini error', e);
      return `I had trouble reaching the AI service. Error: ${e.message || 'Unknown error'}`;
    }
  }

  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const suggestedQuestions = [
    "How do I report a pothole?",
    "What are the waste segregation rules?",
    "How to keep my area clean?",
    "Report a street light issue",
    "What is JanVani?"
  ];

  const handleSuggestionClick = (question) => {
    setInputValue(question);
    sendMessage(question);
  };

  const sendMessage = async (textOverride) => {
    const messageText = textOverride || inputValue.trim();
    if (messageText === "") return;

    
    setMessages(prev => [...prev, { text: messageText, isBot: false }]);
    setInputValue('');
    setIsTyping(true);

    
    const botResponse = await getBotResponse(messageText);

    setIsTyping(false);
    setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="chatbot">
      {}
      <div className="chatbot-header">
        <div className="bot-avatar-large">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.405 0 4.753.175 7.043.513l1.834 10.601c.28.891-.077 1.343-1.026 1.343h-2.12a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75h2.12c.949 0 1.256.452 1.026 1.343l-1.834 10.601A48.322 48.322 0 0112 21.75a48.322 48.322 0 01-7.043-.513L3.123 10.636c-.23-.891.077-1.343 1.026-1.343h2.12a.75.75 0 00.75-.75v-3.75a.75.75 0 00-.75-.75h-2.12c-.949 0-1.256-.452-1.026-1.343l1.834-10.601zM12 9a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zM16.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75z" opacity="0.5" />
          </svg>
        </div>
        <div>
          <h2>JanSathi</h2>
          <p>AI Civic Assistant</p>
        </div>
      </div>

      {}
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isBot ? 'bot' : 'user'}`}>
            {message.isBot && (
              <div className="bot-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M16.5 7.5h-9v9h9v-9z" />
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-6 9.75a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="message-content">
              {message.isBot ? (
                <div className="markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                </div>
              ) : (
                message.text
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="bot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="suggestions-container">
        {suggestedQuestions.map((q, i) => (
          <button key={i} className="suggestion-chip" onClick={() => handleSuggestionClick(q)}>
            {q}
          </button>
        ))}
      </div>

      {}
      <div className="chat-input-container">
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title="Voice Input"
        >
          {isListening && <span className="pulse-ring"></span>}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mic-icon">
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? "Listening..." : "Type your query here..."}
        />
        <button onClick={() => sendMessage()} className="send-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
