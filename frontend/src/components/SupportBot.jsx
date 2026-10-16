import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Plane,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  Tag,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Check,
  Search,
  ExternalLink,
  Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Gentle web audio synthesized chimes (zero external audio file dependencies)
const playChime = (type = 'receive') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'receive') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // Audio autoplay restrictions gracefully handled
  }
};

const QUICK_CHIPS = [
  { label: '✈️ Indian Routes', query: 'What domestic Indian routes are available?' },
  { label: '💺 Family Seating', query: 'How does automatic seat allocation keep families together?' },
  { label: '🏷️ Active Promos', query: 'What promo discount coupons can I use?' },
  { label: '🔍 Check PNR', query: 'How do I check my booking status?' },
  { label: '🧳 Baggage Rules', query: 'What is the domestic baggage allowance?' },
  { label: '❌ Cancellation', query: 'Can I cancel or modify my flight reservation?' }
];

const SupportBot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showProactiveBadge, setShowProactiveBadge] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'BOT',
      text: `Namaste & Welcome to Skynexa Airlines! ✈️\n\nI am your 24/7 AI Flight Concierge. I can assist you with live Indian domestic corridors, automatic family seat allocation, active ₹ discount coupons, or checking your booking status.\n\nHow can I help you today?`,
      time: 'Just now',
      actions: [
        { type: 'link', label: 'Search Flights', path: '/search' },
        { type: 'coupon', label: 'Copy SKY500', code: 'SKY500' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Proactive greeting bubble appears after 2.5s if not opened yet
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowProactiveBadge(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowProactiveBadge(false);
    }
  }, [messages, isOpen, isTyping]);

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'BOT',
        text: `Chat cleared! How can I assist you with your travels today?`,
        time: 'Just now',
        actions: [{ type: 'link', label: 'Search Flights', path: '/search' }]
      }
    ]);
  };

  const processBotResponse = (userQuery) => {
    const qLower = userQuery.toLowerCase().trim();

    // Check for PNR or booking reference (e.g. SKY-...)
    const pnrMatch = userQuery.match(/SKY-[A-Z0-9-]+/i);
    if (pnrMatch) {
      const pnr = pnrMatch[0].toUpperCase();
      return {
        text: `🔍 **Booking Lookup Detected: ${pnr}**\n\nYour reservation details are tracked in our database. To view passenger names, allocated seats, or download your receipt, please visit **My Bookings**.`,
        actions: [
          { type: 'link', label: `Open My Bookings`, path: '/my-bookings' },
          { type: 'link', label: `Support Help Desk`, path: '/support' }
        ]
      };
    }

    if (qLower.includes('pnr') || qLower.includes('status') || qLower.includes('check booking')) {
      return {
        text: `To check your booking status:\n\n1. Go to **My Bookings** in the top navigation.\n2. You'll see your full itinerary, assigned seats (e.g., 12A, 12B), and simulated payment confirmation.\n3. You can also paste your Booking Reference here (e.g. \`SKY-...\`) anytime!`,
        actions: [
          { type: 'link', label: 'Go to My Bookings', path: '/my-bookings' }
        ]
      };
    }

    if (
      qLower.includes('route') ||
      qLower.includes('flight') ||
      qLower.includes('chennai') ||
      qLower.includes('bengaluru') ||
      qLower.includes('delhi') ||
      qLower.includes('mumbai') ||
      qLower.includes('goa') ||
      qLower.includes('kochi') ||
      qLower.includes('hyderabad') ||
      qLower.includes('where')
    ) {
      return {
        text: `Here are our daily non-stop Indian domestic flight corridors:\n\n• **SK-101:** Chennai (MAA) → Bengaluru (BLR) at 08:30 AM (from ₹3,500)\n• **SK-204:** New Delhi (DEL) → Mumbai (BOM) at 11:15 AM (from ₹5,800)\n• **SK-309:** Bengaluru (BLR) → New Delhi (DEL) at 03:45 PM (from ₹4,800)\n• **SK-412:** Mumbai (BOM) → Goa (GOI) at 06:00 PM (from ₹2,999)\n• **SK-501:** Hyderabad (HYD) → Kochi (COK) at 12:00 PM (from ₹3,200)\n\nClick any shortcut below to search live seats!`,
        actions: [
          { type: 'link', label: 'MAA ✈ BLR (₹3,500)', path: '/search?origin=MAA&destination=BLR' },
          { type: 'link', label: 'DEL ✈ BOM (₹5,800)', path: '/search?origin=DEL&destination=BOM' },
          { type: 'link', label: 'BOM ✈ GOI (₹2,999)', path: '/search?origin=BOM&destination=GOI' }
        ]
      };
    }

    if (
      qLower.includes('seat') ||
      qLower.includes('family') ||
      qLower.includes('together') ||
      qLower.includes('allocation') ||
      qLower.includes('window') ||
      qLower.includes('aisle') ||
      qLower.includes('map')
    ) {
      return {
        text: `Our **Smart Seat Allocation Engine** ensures a comfortable journey:\n\n1. **Adjacent Group Seating:** When you book 2 or more passengers together, the algorithm automatically seats your entire family side-by-side in the same row!\n2. **Priority Policy:** For individual passengers, seats are filled in order of: **Window** (A, F) → **Aisle** (C, D) → **Middle** (B, E).\n3. **Interactive Seat Map:** You can also preview or choose exact seats before confirming your booking.`,
        actions: [
          { type: 'link', label: 'Search Flights & Pick Seats', path: '/search' }
        ]
      };
    }

    if (
      qLower.includes('promo') ||
      qLower.includes('coupon') ||
      qLower.includes('code') ||
      qLower.includes('discount') ||
      qLower.includes('offer') ||
      qLower.includes('save')
    ) {
      return {
        text: `Here are today's verified promotional discount codes:\n\n• **SKY500** — Flat **₹500 OFF** on all bookings above ₹3,000.\n• **FLYFLY10** — **10% OFF** up to ₹1,000 on bookings above ₹2,000.\n\nClick to copy below and apply directly on the Passenger Details page!`,
        actions: [
          { type: 'coupon', label: 'Copy SKY500', code: 'SKY500' },
          { type: 'coupon', label: 'Copy FLYFLY10', code: 'FLYFLY10' },
          { type: 'link', label: 'View All Offers', path: '/offers' }
        ]
      };
    }

    if (
      qLower.includes('baggage') ||
      qLower.includes('luggage') ||
      qLower.includes('carry on') ||
      qLower.includes('kg') ||
      qLower.includes('weight')
    ) {
      return {
        text: `Domestic Baggage Policy across all Skynexa flights:\n\n• **Checked Luggage:** 15 kg per passenger included free of charge.\n• **Cabin / Hand Baggage:** 1 bag up to 7 kg + 1 laptop bag / purse.\n• **Extra Baggage:** Can be added at airport check-in or via customer support.`,
        actions: [
          { type: 'link', label: 'Contact Baggage Desk', path: '/support' }
        ]
      };
    }

    if (
      qLower.includes('cancel') ||
      qLower.includes('refund') ||
      qLower.includes('reschedule') ||
      qLower.includes('terms')
    ) {
      return {
        text: `✈️ **Skynexa Cancellation Terms & Refund Policy (DGCA Compliant):**\n\n1. **24-Hour Free Cancellation:** Zero cancellation fee if cancelled within 24 hours of booking (departure > 7 days away).\n2. **> 24 Hours before Departure:** Fee of ₹999/passenger (or base fare). **100% of GST, PSF, and UDF airport fees are fully refunded**.\n3. **24h to 2 Hours before Departure:** Fee of ₹1,999/passenger. All statutory taxes & airport development fees refunded.\n4. **< 2 Hours before Departure:** Base fare retained; 100% of statutory airport fees remain refundable.\n5. **Airline Delay (>2h) / Cancellation:** 100% Full Refund with ₹0 penalty or free rebooking.\n6. **Instant Refund:** Automated credit back to original payment method.\n7. **Partial Cancellation:** Cancel 1 traveler while retaining other seats.`,
        actions: [
          { type: 'link', label: 'Manage In My Bookings', path: '/my-bookings' },
          { type: 'link', label: 'View Cancellation Policy', path: '/support' }
        ]
      };
    }

    if (
      qLower.includes('payment') ||
      qLower.includes('demo') ||
      qLower.includes('card') ||
      qLower.includes('upi') ||
      qLower.includes('money')
    ) {
      return {
        text: `Skynexa operates with a **Simulated Demo Payment Flow**:\n\n• No real banking credentials or money transactions are ever conducted.\n• You can simulate checkout with Demo Card or Demo UPI.\n• Your confirmed booking reference and seats are saved atomically in MongoDB.`,
        actions: [
          { type: 'link', label: 'Try Booking Flow', path: '/search' }
        ]
      };
    }

    if (
      qLower.includes('hello') ||
      qLower.includes('hi') ||
      qLower.includes('hey') ||
      qLower.includes('help') ||
      qLower.includes('namaste')
    ) {
      return {
        text: `Namaste! ✈️ How can I assist your travel today? You can ask me about flight routes, family seating rules, discount promo codes, or baggage limits!`,
        actions: [
          { type: 'link', label: 'Search Flights', path: '/search' },
          { type: 'coupon', label: 'Get Coupon SKY500', code: 'SKY500' }
        ]
      };
    }

    return {
      text: `I understand you're inquiring about: "${userQuery}".\n\nOur human flight concierges are available 24/7. You can check your itineraries in **My Bookings** or submit a direct ticket through our **Help & Support** center!`,
      actions: [
        { type: 'link', label: 'Help & Support Desk', path: '/support' },
        { type: 'link', label: 'Search Domestic Flights', path: '/search' }
      ]
    };
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (soundEnabled) playChime('send');

    const userMessage = {
      id: Date.now(),
      sender: 'USER',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Realistic bot response calculation
    setTimeout(() => {
      const botResponse = processBotResponse(query);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'BOT',
        text: botResponse.text,
        actions: botResponse.actions,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      if (soundEnabled) playChime('receive');
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Proactive Help Notification Badge (auto-triggers after 2.5s) */}
      {!isOpen && showProactiveBadge && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-sky-100 p-3.5 animate-bounceSoft text-navy z-50 ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-black uppercase text-skyblue tracking-wider">
                Skynexa Concierge
              </span>
            </div>
            <button
              onClick={() => setShowProactiveBadge(false)}
              className="text-slate-400 hover:text-navy cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
            Need help booking domestic Indian flights or family seats? Chat with our AI Concierge!
          </p>
          <button
            onClick={() => {
              setShowProactiveBadge(false);
              setIsOpen(true);
            }}
            className="mt-2.5 w-full py-1.5 px-3 bg-navy hover:bg-skyblue text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Start Chat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Trigger Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setShowProactiveBadge(false);
            setIsOpen(true);
          }}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-navy via-navy to-[#0c2e56] text-white rounded-full shadow-2xl hover:shadow-skyblue/40 hover:scale-105 transition-all duration-300 border border-white/20 cursor-pointer"
          aria-label="Open Skynexa AI Support Bot"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-skyblue flex items-center justify-center text-white shadow-inner animate-pulseGlow">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-navy animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-navy"></span>
          </div>

          <div className="text-left pr-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-skyblue-light">
              <Sparkles className="w-3 h-3 text-amber-300" /> Skynexa AI Bot
            </div>
            <span className="text-[11px] text-slate-200 font-medium block">
              Flights, Seats &amp; ₹ Promos
            </span>
          </div>
        </button>
      )}

      {/* Expanded Interactive Chat Modal Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 ring-1 ring-black/10 ${
            isMaximized
              ? 'fixed inset-4 sm:inset-10 z-50 w-auto h-auto max-w-4xl mx-auto'
              : 'w-[370px] sm:w-[430px] h-[570px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-navy via-navy to-[#0c2a50] p-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-skyblue flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Skynexa AI Flight Concierge</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  24/7 Indian Domestic &amp; Seating Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Clear Chat */}
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Maximize / Minimize Window */}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title={isMaximized ? 'Restore size' : 'Expand window'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMaximized(false);
                }}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="bg-slate-50 p-2.5 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-skyblue hover:text-white text-navy font-bold border border-slate-200 shadow-2xs transition cursor-pointer shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/50 to-white text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'BOT' && (
                  <div className="w-7 h-7 rounded-xl bg-navy text-skyblue flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Plane className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-2xs ${
                    msg.sender === 'USER'
                      ? 'bg-gradient-to-r from-skyblue to-navy text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-700 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.text}

                  {/* Interactive Action Chips inside bot responses */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => {
                        if (act.type === 'link') {
                          return (
                            <Link
                              key={actIdx}
                              to={act.path}
                              onClick={() => {
                                if (isMaximized) setIsMaximized(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-skyblue hover:text-white font-bold text-[10px] transition border border-sky-100"
                            >
                              <span>{act.label}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          );
                        }
                        if (act.type === 'coupon') {
                          return (
                            <button
                              key={actIdx}
                              onClick={() => copyCouponCode(act.code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white font-bold text-[10px] transition border border-emerald-200 cursor-pointer"
                            >
                              {copiedCoupon === act.code ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{act.label}</span>
                                </>
                              )}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 ${
                      msg.sender === 'USER' ? 'text-sky-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>

                {msg.sender === 'USER' && (
                  <div className="w-7 h-7 rounded-xl bg-skyblue text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-[11px] shadow-2xs">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                <div className="flex gap-1 py-1.5 px-3 bg-white rounded-full border border-slate-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-skyblue animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-skyblue animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-skyblue animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Concierge is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about flights, PNR status, family seats, promos..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue focus:outline-none text-xs font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-navy hover:bg-skyblue text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Skynexa AI Flight Engine
              </span>
              <Link
                to="/support"
                onClick={() => setIsOpen(false)}
                className="text-skyblue hover:underline font-bold"
              >
                Open Ticket Support →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportBot;
