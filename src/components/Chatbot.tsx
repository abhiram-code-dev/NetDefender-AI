import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, User, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { chatWithAI, generateSpeech } from "../services/gemini";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm NetDefender AI. How can I help you with your cybersecurity needs today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!voiceEnabled && sourceRef.current) {
      sourceRef.current.stop();
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Fetch context
      let context = "";
      if (auth.currentUser) {
        const q = query(
          collection(db, "scans"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const scans = snapshot.docs.map(doc => ({
          type: doc.data().type,
          status: doc.data().status,
          malwareType: doc.data().aiAnalysis?.malwareType,
          riskScore: doc.data().aiAnalysis?.riskScore,
          timestamp: doc.data().timestamp
        }));
        context = `Recent Scans: ${JSON.stringify(scans)}`;
      }

      const aiResponse = await chatWithAI(userMessage, messages, context);
      setMessages(prev => [...prev, { role: "ai", text: aiResponse }]);
      
      if (voiceEnabled) {
        const audioData = await generateSpeech(aiResponse);
        if (audioData) {
          playRawPCM(audioData);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playRawPCM = async (base64Data: string) => {
    if (!voiceEnabled) return;

    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;
    
    // Resume context if suspended (common browser policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const audioBuffer = audioContext.createBuffer(1, len / 2, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < len / 2; i++) {
      // Assuming 16-bit PCM
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }
    
    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    sourceRef.current = source;
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      setIsSpeaking(false);
      sourceRef.current = null;
    };
    setIsSpeaking(true);
    source.start();
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      const recognition = (window as any).recognition;
      if (recognition) recognition.stop();
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInput(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable microphone permissions in your browser settings.");
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      (window as any).recognition = recognition;
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[400px] h-[550px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-blue-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NetDefender Assistant</h3>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">AI Powered</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg transition-colors ${voiceEnabled ? "text-blue-500 hover:bg-blue-500/10" : "text-gray-500 hover:bg-white/5"}`}
                  title={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-500" : "bg-white/10"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-500 text-white rounded-tr-none" : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"}`}>
                      <div className="markdown-body">
                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
              <div className="relative flex items-center gap-2">
                <button 
                  onClick={toggleVoice}
                  className={`p-2 rounded-xl transition-colors ${isListening ? "bg-red-500/20 text-red-500" : "bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center text-white relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />}
      </motion.button>
    </div>
  );
}
