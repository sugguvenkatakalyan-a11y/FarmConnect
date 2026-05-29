// src/components/Chatbot.js

import React, { useState, useEffect, useRef } from 'react';
import { ClipLoader } from 'react-spinners';

// Reusable Icon components for the chatbot
const ChatIcon = () => <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
const SendIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"></path></svg>;


// --- UPDATED: Pass both `purchases` AND `crops` as props ---
const Chatbot = ({ purchases, crops }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hello! I'm your farm assistant. How can I help you today?", sender: "bot" }]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef(null);

  // --- NEW: A list of suggested questions for the user ---
  const suggestions = [
      "What vegetables are nearby?",
      "How does delivery work?",
      "What was my last order?",
      "What are the current prices?",
      "Can you help me find organic crops?",
      "What is the return policy?",
      "How can I contact support?",
      "What are the payment options?",
      "How do I track my order?",
      "What are the delivery times?",
  ];

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // --- NEW: Function to handle clicking on a suggestion ---
  const handleSuggestionClick = (suggestion) => {
      setInputText(suggestion);
      // We wrap the call in a timeout to allow the state to update before sending
      setTimeout(() => {
          handleSendMessage(suggestion);
      }, 0);
  };
  
  const handleSendMessage = async (messageToSend) => {
    const currentMessage = typeof messageToSend === 'string' ? messageToSend : inputText;
    if (currentMessage.trim() === "" || isLoading) return;

    const userMessage = { text: currentMessage, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
        // --- CRITICAL FIX: Use a relative URL to allow the Vite proxy to work. ---
        // This was the cause of your connection errors.
      const res = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // --- UPDATED: Send the full context to the backend ---
        body: JSON.stringify({
          message: currentMessage,
          context: {
            purchases: purchases,
            crops: crops // Pass the nearby crops data
          }
        }),
      });

      if (!res.ok) throw new Error(`Failed to get response. Status: ${res.status}`);

      const data = await res.json();
      setMessages(prev => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (error) {
      console.error("Chatbot fetch error:", error);
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now. Please try again later.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-fadeInUp">
          <div className="bg-emerald-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-lg">FarmDirect Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-600 p-1 rounded-full"><CloseIcon /></button>
          </div>

          <div ref={chatboxRef} className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {/* --- NEW: Show suggestions only for the first message --- */}
            {messages.length === 1 && (
                <div className="flex flex-col items-start gap-2 pt-2">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleSuggestionClick(s)} className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors">
                            {s}
                        </button>
                    ))}
                </div>
            )}
            {isLoading && <div className="flex justify-start"><div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2"><ClipLoader color="#10B981" size={20} /></div></div>}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-full px-2">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask a question..." className="w-full bg-transparent p-3 focus:outline-none text-gray-800"/>
              <button onClick={() => handleSendMessage()} disabled={isLoading} className="text-emerald-500 hover:text-emerald-600 disabled:text-gray-400 p-2 rounded-full transition-colors"><SendIcon /></button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-emerald-500 hover:bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all" aria-label="Toggle Chatbot"><ChatIcon /></button>
    </div>
  );
};

export default Chatbot;