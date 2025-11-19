import { useState, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaFileAlt, FaStar } from "react-icons/fa";
import api from "../lib/api";

const ZenoAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: "ai",
          content: "Hello! I'm Zeno, your AI assistant. I can help you search through your PDF files and answer questions about their content. I can find specific information and summarize documents. What would you like to know about your PDF files?",
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await api.post('/query', {
        query: inputMessage
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.data.answer,
        timestamp: new Date(),
        sources: response.data.sources || []
      };

      setMessages(prev => [...prev, aiMessage]);
      setSearchResults(response.data.sources || []);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Zeno Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 flex items-center justify-center group ${isOpen ? 'scale-90' : 'hover:scale-110'
          }`}
      >
        <FaRobot className="text-white text-2xl" />
        {!isOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
        )}
        <div className="absolute -top-12 right-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Ask Zeno AI
        </div>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-foreground rounded-2xl border border-gray-800 shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <FaRobot className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Zeno AI</h3>
                <p className="text-xs text-gray-400">Your file assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${message.type === 'user'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : message.isError
                        ? 'bg-red-900/20 border border-red-700 text-red-400'
                        : 'bg-gray-800 text-white'
                    }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {/* Sources for AI messages */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaStar className="text-primary text-xs" />
                        <span className="text-xs text-gray-400 font-medium">Relevant Sources</span>
                      </div>
                      <div className="space-y-2">
                        {message.sources.slice(0, 3).map((source, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg">
                            <FaFileAlt className="text-primary text-xs" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{source.name}</p>
                              <p className="text-xs text-gray-400">v{source.version}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-8 bg-gray-600 rounded-full h-1">
                                <div
                                  className="bg-primary h-1 rounded-full"
                                  style={{ width: `${Math.min(100, source.score * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400">{source.score.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Zeno is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Zeno about your files..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:text-secondary disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ZenoAI;