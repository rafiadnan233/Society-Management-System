import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, Loader2, RefreshCw, Volume2, Building, ArrowRight, Smile, Hand, BookOpen, ChevronDown, ChevronUp, ChevronRight, CreditCard, ShieldCheck, AlertCircle, Clock, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// System instruction representing the Astha Twin Tower AI Assistant for Client Side Direct Fallback
const ASTHA_SYSTEM_INSTRUCTION = `You are Astha Twin Tower AI Assistant.
Always answer in Bengali (Bangla) default unless the user asks to use English.
Help residents, visitors, staff, and administrators.
Provide accurate information about society services at Astha Twin Tower (located in Khetasar, Cumilla, Bangladesh).
Keep responses context-aware, polite, warm, concise, and professional.

Key facts about Astha Twin Tower:
1. Contact & Location: Khetasar, Cumilla, Bangladesh.
2. Apartment Management: There are multiple flats across tower blocks.
3. Maintenance Bills: The monthly maintenance fee should be paid via local mobile wallets (bKash/Nagad) or Cash by the 10th of every month. Late fees may apply after the 15th of the month.
4. Security & Visitors: All visitors/guests, vehicles, and delivery partners must register at the reception/gate. Residents can submit pre-arrival visitor entry request passes online.
5. Voice Navigation: Astha Twin Tower system has a state-of-the-art Voice Navigator supporting voice commands (e.g. 'take me to the dashboard', 'show me payments') to help quick navigation.
6. Complaints Desk: If there are complaints (leakage, plumbing, security, common lights, garbage), residents can file them online. The administration processes them immediately.
7. Quiet Hours: 10:00 PM to 6:00 AM (to ensure comfort for children and elderly residents).
8. Common Areas: Community room, play area, and rooftop gardens must be reserved ahead of events with the society committee.

Format your responses with neat markdown lists or bold markers where relevant. Always keep instructions short, helpful, and friendly.`;

const FAQ_CATEGORIES = [
  {
    id: 'payments',
    titleBn: '💳 মেইনটেইন্যান্স ও বিল',
    titleEn: '💳 Payment Issues',
    faqs: [
      {
        qBn: 'মাসিক মেইনটেইন্যান্স ফি প্রদানের শেষ সময় কবে?',
        qEn: 'When is the monthly maintenance fee due and what is late fee?',
        aBn: 'প্রতি মাসের ১০ তারিখের মধ্যে আপনার নির্ধারিত ফ্ল্যাটের মেইনটেইন্যান্স বিল পরিশোধ করতে হবে। ১৫ তারিখ পার হয়ে গেলে বিলম্বে শাস্তিমূলক ফি বা চার্জ প্রযোজ্য হতে পারে।',
        aEn: 'The monthly maintenance fee must be paid by the 10th of every month. Late feeds/charges may apply after the 15th.'
      },
      {
        qBn: 'কোন কোন মাধ্যমে ফি পরিশোধ করা যাবে?',
        qEn: 'What payment methods are supported for bills?',
        aBn: 'আপনি সরাসরি আপনার ড্যাশবোর্ডের "Payments" ট্যাব থেকে bKash, Nagad মোবাইল ওয়ালেট অথবা সরাসরি ক্যাশ ট্রানজেকশন পেইমেন্ট হিসেবে সোসাইটিতে অর্থ জমা দিতে পারবেন।',
        aEn: 'You can pay directly through your resident portal dashboard using mobile wallets like bKash/Nagad, or via Cash.'
      },
      {
        qBn: 'পেমেন্ট রশিদ বা মানি রিসিট কীভাবে পাব?',
        qEn: 'How can I collect my formal payment receipt?',
        aBn: 'পেমেন্ট সম্পন্ন হওয়ার পর সিস্টেম স্বয়ংক্রিয়ভাবে একটি প্রিন্টযোগ্য ফর্মাল ডিজিটাল রিসিট জেনারেট করে যা আপনি যেকোনো সময় ডাউনলোড করতে পারেন।',
        aEn: 'After a successful payment, the system automatically generates a printable digital receipt for download.'
      }
    ]
  },
  {
    id: 'visitors',
    titleBn: '🚧 গেট ও সিকিউরিটি নিয়মনীতি',
    titleEn: '🚧 Gate Rules & Visitors',
    faqs: [
      {
        qBn: 'মেহমান বা গেস্ট আসার কি কোনো পূর্বঅনুমোদন লাগবে?',
        qEn: 'Do visitors need any prior approval from residents?',
        aBn: 'নিরাপত্তা নিশ্চিত করার জন্য গেটে মেহমানদের রেজিষ্ট্রেশন করতে হয়। বাসিন্দারা চাইলে যেকোনো পূর্বপ্রস্তুতির জন্য আগেই Online Visitor Pass টিকিট তৈরি করে রাখতে পারেন।',
        aEn: 'To ensure campus security, all guests must register at the gate. Residents can optionally generate an online pre-arrival Pass to bypass delay.'
      },
      {
        qBn: 'ডেলিভারি পার্টনার বা বা কুরিয়ার কীভাবে ফ্ল্যাট পর্যন্ত পৌঁছাবে?',
        qEn: 'How do delivery riders and couriers reach the flat?',
        aBn: 'সকল কুরিয়ার ও ডেলিভারি পার্টনারদের মেইন গেট কাউন্টারে এন্ট্রি দিতে হবে এবং ইন্টারকম বা সিকিউরিটি কর্তাদের মাধ্যমে বাসিন্দা সবুজ সংকেত দিলে তবেই প্রবেশাধিকার পাবে।',
        aEn: 'All delivery partners must report at the main entrance gate. Security will verify with the resident via intercom/system before entry.'
      }
    ]
  },
  {
    id: 'complaints',
    titleBn: '🛠️ অভিযোগ ও সেবা টিকিট',
    titleEn: '🛠️ Complaints Box',
    faqs: [
      {
        qBn: 'পানির লাইনে লিকেজ বা প্লাম্বিং সমস্যা হলে কী ব্যবস্থা আছে?',
        qEn: 'What should I do if there is a water leak or plumbing issue?',
        aBn: 'আপনি ড্যাশবোর্ড থেকে "Complaints" সেকশনে গিয়ে পানির লাইন, বৈদ্যুতিক ত্রুটি বা লিফট বিষয়ক যেকোনো সমস্যার টিকিট ওপেন করতে পারেন।',
        aEn: 'You can go to the "Complaints" section of your resident panel and submit an immediate ticket for plumbing, electric, or utility issues.'
      },
      {
        qBn: 'তদন্ত কতক্ষণের মধ্যে সম্পন্ন করা হয়?',
        qEn: 'How long does complaint investigation and repair take?',
        aBn: 'সাধারণত টিকিট জেনারেশনের ১২ ঘণ্টার মধ্যে আমাদের সাপোর্ট কারিগর বা ইলেক্ট্রিশিয়ান দল তদন্ত শুরু করে এবং অগ্রাধিকার ভিত্তিতে সমাধান করে।',
        aEn: 'Our technical support staff or plumber team typically initiates an investigation within 12 hours of priority ticket submission.'
      }
    ]
  },
  {
    id: 'rules',
    titleBn: '🌙 কুয়ায়েট আওয়ার্স ও কমন এরিয়া',
    titleEn: '🌙 Quiet Hours & Shared Areas',
    faqs: [
      {
        qBn: 'শান্ত ঘন্টা বা Quiet Hours এর সময়সূচী কোনটি?',
        qEn: 'What are the quiet hours in Astha Twin Towers?',
        aBn: 'আমাদের আবাসিক এলাকায় প্রতিদিন রাত ১০:০০ টা থেকে সকাল ৬:০০ টা পর্যন্ত শান্ত ঘন্টা বলবৎ থাকে। এই সময় উচ্চ শব্দকারী সকল কার্যক্রম নিষিদ্ধ।',
        aEn: 'Quiet hours are observed daily from 10:00 PM to 6:00 AM. Loud sounds, music, or disturbances are strictly prohibited during this frame.'
      },
      {
        qBn: 'কমিউনিটি হল রুম বুক করার নিয়ম কী?',
        qEn: 'How do I book the community room or rooftop for an event?',
        aBn: 'ব্যক্তিগত অনুষ্ঠান বা সামাজিক সভার জন্য অন্তত ৭ দিন পূর্বে ক্যালেন্ডার শিডিউল চেক করে সোসাইটি কার্যনির্বাহী কমিটির মাধ্যমে আবেদন করুন।',
        aEn: 'To reserve the community hall or rooftop garden, please check scheduling availability and submit an application to the society committee 7 days prior.'
      }
    ]
  }
];

export default function AIAssistantWidget() {
  const { 
    language,
    currentUser,
    config,
    members,
    flats,
    payments,
    expenses,
    notices,
    visitors,
    complaints,
    staff,
    constructionPhases
  } = useSociety();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelloTooltip, setShowHelloTooltip] = useState(true);
  const [activeTab, setActiveTab] = useState<'help' | 'chat'>('help');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('payments');
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('ASTHA_USER_GEMINI_KEY') || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate real-time system context to feed to Gemini AI
  const generateSystemContext = () => {
    let context = ``;
    
    // 1. Current Session Context
    if (currentUser) {
      context += `[User Session]: Logged in user is ${currentUser.name} (${currentUser.role}). `;
      if (currentUser.role === 'Resident') {
        context += `Flat No: ${currentUser.flatNo || 'N/A'}. `;
      }
      context += `\n`;
    } else {
      context += `[User Session]: Public/Anonymous guest visitor.\n`;
    }

    // 2. Society Config & Financial Specs
    if (config) {
      context += `[Society Setup]: Name: ${config.name || 'Astha Twin Towers'}, Address: ${config.address || 'Khetasar, Cumilla'}, Email: ${config.email || 'info@astha.com'}, Phone: ${config.contactNo || ''}. `;
      context += `Monthly Maintenance Fee: BDT ${config.bdtMaintenanceFee || 5000}. Payment Channels: bKash (${config.bKashMerchant || '01712345678'}), Nagad (${config.nagadMerchant || '01612345678'}), Rocket (${config.rocketMerchant || '01512345678'}).\n`;

      // 3. Construction Highlights
      const percent = config.constructionPercent !== undefined ? config.constructionPercent : 85;
      context += `[Construction Phase]: Progress: ${percent}% Completed. Description (EN): "${config.constructionDescEn || ''}". Description (BN): "${config.constructionDescBn || ''}".\n`;
    }

    // 4. Flats Statistics
    if (flats && flats.length > 0) {
      const occupied = flats.filter(f => f.status === 'Occupied').length;
      const vacant = flats.filter(f => f.status === 'Vacant').length;
      context += `[Flats Summary]: Total Flats: ${flats.length} (Occupied: ${occupied}, Vacant: ${vacant}).\n`;
    }

    // 5. Active Notices
    if (notices && notices.length > 0) {
      context += `[Active Notices]:\n`;
      notices.slice(0, 5).forEach((n, idx) => {
        context += `  - Notice #${idx + 1}: Date: ${n.date || 'unknown'}, Priority: ${n.priority || 'Normal'}, Title: "${n.title || ''}", Content: "${n.message || ''}"\n`;
      });
    }

    // 6. Support Staff / Contacts
    if (staff && staff.length > 0) {
      context += `[Duty Support Staff List]:\n`;
      staff.forEach((s) => {
        context += `  - Name: ${s.name} | Role: ${s.role} | Phone: ${s.phone || 'N/A'} | Status: ${s.status || 'Active'}\n`;
      });
    }

    // 7. Core Committee / Members Info
    if (members && members.length > 0) {
      const committee = members.filter(m => m.tag === 'Committee' || m.role === 'President' || m.role === 'Secretary');
      if (committee.length > 0) {
        context += `[Committee Members]:\n`;
        committee.forEach(c => {
          context += `  - Name: ${c.name} | Designation: ${c.role || 'Member'} | Phone: ${c.phone || 'N/A'}\n`;
        });
      }
      context += `[Total Registered Resident Members]: ${members.length}\n`;
    }

    // 8. Complaints Tracking
    if (complaints && complaints.length > 0) {
      const pending = complaints.filter(c => c.status === 'Pending').length;
      const investigating = complaints.filter(c => c.status === 'Investigating').length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;
      context += `[Complaints Status]: Total filed issues: ${complaints.length} (Pending: ${pending}, Investigating: ${investigating}, Resolved: ${resolved}).\n`;
      
      context += `[Recent Public Complaints]:\n`;
      complaints.slice(0, 5).forEach((c, idx) => {
        context += `  - Complaint #${idx+1}: Category: ${c.category}, Title: "${c.title}", Status: ${c.status}, Filed Date: ${c.date || ''}. By: Flat ${c.flatNo}\n`;
      });
    }

    // 9. Payment Logs Overview
    if (payments && payments.length > 0) {
      const totalPaid = payments.filter(p => p.status === 'Paid').length;
      const totalPending = payments.filter(p => p.status === 'Pending').length;
      context += `[Maintenance Payments Overview]: Total invoices tracked: ${payments.length} (${totalPaid} Paid, ${totalPending} Pending/Unpaid).\n`;
    }

    return context;
  };

  // Default welcome message based on selected language (bn/en)
  const defaultWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-msg',
    role: 'model',
    text: language === 'bn' 
      ? 'স্বাগতম! আমি আস্থা টুইন টাওয়ারের (Astha Twin Tower) এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে সোসাইটির নিয়মাবলী, ইউজার ড্যাশবোর্ড, পেমেন্ট ইনফো, এবং অভিযোগ মেটাতে সাহায্য করতে পারি। আপনি কীভাবে সাহায্য চান?'
      : 'Welcome! I am the Astha Twin Tower AI Assistant. I can help you with society rules, maintenance payments, visitor guidelines, and filing complaints. How can I assist you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Load default message if chat list is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([defaultWelcomeMessage()]);
    }
  }, [language]);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle suggested prompt clicks
  const handleSuggestionClick = (promptText: string) => {
    if (loading) return;
    sendMessage(promptText);
  };

  // Main sending function
  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend) return;

    // Clear input if we are sending the user's typed input
    if (!overrideText) {
      setInput('');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp
    };

    // Update list with User's message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const systemContext = generateSystemContext();

    try {
      // Map history format for server endpoint proxy (excludes welcome message to prevent noise)
      const chatHistory = updatedMessages
        .filter(m => m.id !== 'welcome-msg')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      // Call our secure Express full-stack proxy route
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSend,
          history: chatHistory.slice(-6), // Only send recent 6 messages to keep context efficient
          systemContext: systemContext
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || (language === 'bn' ? 'আমি দুঃখিত, সংযোগের সমস্যা হয়েছে।' : 'Sorry, connection failed.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.warn('Error generating response from backend, checking for client-side Gemini options:', err);
      
      const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      let clientResponseText = "";

      if (apiKey && apiKey !== "MOCK_OR_MISSING_KEY") {
        try {
          // Construct chat history format mapping for @google/genai SDK REST request
          const sdkContents = updatedMessages
            .filter(m => m.id !== 'welcome-msg')
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }]
            }));

          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const restResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: sdkContents,
              systemInstruction: {
                parts: [{ text: systemContext }]
              }
            })
          });

          if (restResponse.ok) {
            const restData = await restResponse.json();
            clientResponseText = restData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        } catch (restErr) {
          console.warn("Direct local client-side fetch key expired or failed, falling back to local database:", restErr);
        }
      }

      if (clientResponseText) {
        const botMessage: ChatMessage = {
          id: `client-bot-${Date.now()}`,
          role: 'model',
          text: clientResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setLoading(false);
        return;
      }

      // High-fidelity local offline assistant client-side responder representing the complete ASTHA project database
      const getClientOfflineResponse = (query: string, lang: 'bn' | 'en'): string => {
        const q = query.replaceAll('?', '').replaceAll('!', '').trim().toLowerCase();
        const bdtFee = config?.bdtMaintenanceFee || 5000;
        const constPercent = config?.constructionPercent !== undefined ? config.constructionPercent : 85;
        
        // Comprehensive Local Knowledge Database Lookup Table
        if (lang === 'bn') {
          // 1. PROJECT INTRODUCTION & LOCATION
          if (q.includes("ঠিকানা") || q.includes("অবস্থান") || q.includes("কোথায়") || q.includes("কুমিল্লা") || q.includes("খেতাসার") || q.includes("পরিচিতি") || q.includes("টাওয়ার") || q.includes("আস্থা") || q.includes("building") || q.includes("location") || q.includes("address")) {
            return `### 🏢 প্রকল্প পরিচিতি ও অবস্থান (Astha Twin Towers):
*আস্থা টুইন টাওয়ার্স হলো কুমিল্লার বুকে আবাসন খাতের এক অনন্য ও আধুনিক মাইলফলক। একটি সুরক্ষিত এবং প্রফেশনাল সোসাইটি ম্যানেজমেন্ট সিস্টেমের আওতায় এর কার্যক্রম পরিচালিত হয়।*

* **সঠিক অবস্থান:** খেতাসার, কুমিল্লা, বাংলাদেশ (Khetasar, Cumilla, Bangladesh)।
* **প্রকল্পের ধরন:** দ্বৈত আবাসিক লাক্সারি টাওয়ার (Twin Residential Towers)।
* **স্থাপত্য বৈশিষ্ট্য:**
  * **টোটাল ফ্ল্যাট/ইউনিট:** সর্বমোট ৭২টি লাক্সারি ফ্ল্যাট (প্রতি টাওয়ারে ৩৬টি করে ফ্ল্যাট)।
  * **নিরাপত্তা বেষ্টনী:** ২৪/৭ সিসিটিভি ক্যামেরা নজরদারি, ইন্টেলিজেন্ট NVR টার্মিনাল মনিটরিং এবং সার্বক্ষণিক মেটাল ডিটেকশন ও সিকিউরিটি গেট চেকিং।
  * **কমন সুযোগ-সুবিধা:** আধুনিক রুফটপ গার্ডেন (Rooftop Garden), আধুনিক ফিটনেস ও ব্যায়াম সেন্টার, সুসজ্জিত কমিউনিটি হল রুম এবং সার্বক্ষণিক অটো-জেনারেটর ব্যাকআপ।
  * **পানির বিশুদ্ধতা নিশ্চিতকরণ:** আধুনিক ওয়াটার ট্রিটমেন্ট প্ল্যান্ট এবং প্রতি সপ্তাহে ল্যাব-টেস্টের মাধ্যমে পানির গুণমান পরীক্ষা।

---
*আপনার কি কোয়াইট আওয়ার্স বা পেমেন্ট গেটওয়ে নিয়ে কোনো প্রশ্ন আছে? লিখে জানান।*`;
          }

          // 2. SOCIETY EXECUTIVE & MANAGEMENT COMMITTEE
          if (q.includes("কমিটি") || q.includes("সভাপতি") || q.includes("সেক্রেটারি") || q.includes("চেয়ারম্যান") || q.includes("কর্মকর্তা") || q.includes("ম্যানেজার") || q.includes("পরিচালক") || q.includes("সদস্য") || q.includes("রহমান") || q.includes("রফিকুল") || q.includes("আদনান") || q.includes("committee") || q.includes("president") || q.includes("secretary") || q.includes("treasurer") || q.includes("chairman")) {
            let res = `### 🏢 সোসাইটি ম্যানেজমেন্ট ও কার্যনির্বাহী কমিটি:
*আস্থা টুইন টাওয়ার্স সোসাইটির সুষ্ঠু পরিচালনা এবং স্বচ্ছ অর্থনৈতিক হিসাব নিশ্চিত করার জন্য নিম্নোক্ত নির্বাহী কমিটি সার্বক্ষণিকভাবে নিয়োজিত রয়েছেন:*

১. **এক্সিকিউটিভ চেয়ারম্যান:** **আলহাজ্ব মো: আব্দুর রহমান** (Alhaj Md. Abdur Rahman)
   * ফ্ল্যাট নম্বর: \`9A\` | ফোন: \`+8801711223344\`
   * দায়িত্ব: সার্বিক নীতি নির্ধারণ এবং প্রকল্প তদারকি।
২. **সোসাইটি সভাপতি:** **ইঞ্জিঃ রফিকুল ইসলাম** (Engr. Rafiqul Islam)
   * ফ্ল্যাট নম্বর: \`7B\` | ফোন: \`+8801911223344\`
   * দায়িত্ব: অবকাঠামো তদারকি ও সাংগঠনিক নেতৃত্ব।
৩. **সাধারণ সম্পাদক:** **ডাঃ আদনান চৌধুরী** (Dr. Adnan Chowdhury)
   * ফ্ল্যাট নম্বর: \`5C\` | ফোন: \`+8801811556677\`
   * দায়িত্ব: অফিশিয়াল নোটিশ প্রজ্ঞাপন, প্রশাসনিক কাজ এবং ড্যাশবোর্ড তদারকি।
৪. **যুগ্ম সাধারণ সম্পাদক:** **এম. রহমান** (M. Rahman)
   * ফ্ল্যাট নম্বর: \`3A\` | ফোন: \`+8801511442233\`
   * দায়িত্ব: সাধারণ সম্পাদকের সহযোগী সদস্য ও ইভেন্ট কো-অর্ডিনেশন।
৫. **কোষাধ্যক্ষ (কোষাধ্যক্ষ):** **আদনান চৌধুরী** (Adnan Chowdhury)
   * ফ্ল্যাট নম্বর: \`4B\` | ফোন: \`+8801611332211\`
   * দায়িত্ব: ব্যাংকিং লেজার সংরক্ষণ, ভাউচার অনুমোদন এবং মেইনটেন্যান্স ফি ট্র্যাকিং।

---
*সোসাইটির যেকোনো আর্থিক জিজ্ঞাসা থাকলে সরাসরি কোষাধ্যক্ষ বা সভাপতি মহোদয়ের সাধারণ নম্বরে যোগাযোগ করতে পারেন।*`;
            
            // Append dynamically from DB if we loaded any
            const committee = members ? members.filter(m => m.tag === 'Committee' || m.role === 'President' || m.role === 'Secretary') : [];
            if (committee.length > 5) {
              res += `\n\n📌 **ডাটাবেজ থেকে অতিরিক্ত নিবন্ধিত মেম্বার:**\n`;
              committee.slice(5).forEach((c, idx) => {
                res += `- **${c.name}** - ${c.role || 'Committee Member'} | ফোন: \`${c.phone || 'N/A'}\` | ফ্ল্যাট: \`${c.flatNo || 'N/A'}\`\n`;
              });
            }
            return res;
          }

          // 3. FLATS & RESIDENTS LAYOUT
          if (q.includes("ফ্ল্যাট") || q.includes("ইউনিট") || q.includes("ফ্ল্যাটের সংখ্যা") || q.includes("কতটি ফ্ল্যাট") || q.includes("flat") || q.includes("units") || q.includes("resident")) {
            const totalF = flats?.length || 72;
            const occupied = flats?.filter(f => f.status === 'Occupied').length || 54;
            const vacant = flats?.filter(f => f.status === 'Vacant').length || 18;
            return `### 📊 ফ্ল্যাট বিন্যাস এবং আবাসন পরিসংখ্যান:
*আস্থা টুইন টাওয়ার্সের আবাসিক ভবনের সামগ্রিক ডিস্ট্রিবিউশন প্রোফাইল নিম্নরূপ:*

* **সর্বমোট ফ্ল্যাট সংখ্যা:** ${totalF}টি সুসজ্জিত ইউনিট।
  * **টাওয়ার ১ (Tower 1):** ৩৬টি লাক্সারি ইউনিট।
  * **টাওয়ার ২ (Tower 2):** ৩৬টি লাক্সারি ইউনিট।
* **বর্তমান বসবাসকারী পরিসংখ্যান (লাইভ ডাটা ট্র্যাকার):**
  * **অধ্যুষিত/ব্যবহৃত ফ্ল্যাট (Occupied):** ${occupied}টি পরিবার বর্তমানে বসবাস করছেন।
  * **খালি ফ্ল্যাট (Vacant/Ready):** ${vacant}টি ইউনিট বুকিংয়ের জন্য উন্মুক্ত রয়েছে।
* **ফ্ল্যাট টাইপ:** ৩টি এক্সক্লুসিভ টাইপ (Type A, Type B, Type C) প্রতিটি ফ্ল্যাটে ৩টি বেডরুম, ৩টি বাথরুম ও প্রশস্ত বারান্দা অন্তর্ভুক্ত রয়েছে প্রজেক্ট লেআউট অনুসারে।

---
*কোনো নির্দিষ্ট ফ্ল্যাটের ফি বকেয়া বা মালিকের তথ্য দেখতে চাইলে আপনার ড্যাশবোর্ডের "Flats" ও "Members" অপশনে চোখ রাখুন।*`;
          }

          // 4. BILLING, PAYMENTS & MAINTENANCE FEE
          if (q.includes("বিল") || q.includes("পেমেন্ট") || q.includes("ফি") || q.includes("টাকা") || q.includes("বিকাশ") || q.includes("নগদ") || q.includes("রকেট") || q.includes("বকেয়া") || q.includes("জরিমানা") || q.includes("payment") || q.includes("bill") || q.includes("fee") || q.includes("ledger") || q.includes("bkash") || q.includes("nagad")) {
            let res = `### 💳 মেইনটেইন্যান্স বিল এবং পেমেন্ট গেটওয়ে:
*আস্থা টুইন টাওয়ার সোসাইটির স্বচ্ছ আর্থিক হিসাব এবং নিরাপত্তা বজায় রাখতে সকল বিল অনলাইন এবং সরাসরি ক্যাশ রিসিটের মাধ্যমে ট্র্যাক করা হয়:*

* **মাসিক মেইনটেইন্যান্স ফি:** **৳${bdtFee} BDT** (প্রতি ফ্ল্যাটের সাধারণ সার্ভিস চার্জ)।
* **ফি প্রদানের সময়সীমা:** প্রতি মাসের **১০ তারিখের মধ্যে** অবশ্যই পরিশোধ করতে হবে।
* **বিলম্ব চার্জ (Late Fee):** প্রতি মাসের **১৫ তারিখ অতিবাহিত হলে** বিলম্ব জরিমানা ১০০ টাকা (৳১০০ BDT) যুক্ত হতে পারে।
* **মোবাইল মার্চেন্ট একাউন্টসমূহ (স্বয়ংক্রিয় ট্র্যাকিং):**
  * 📱 **bKash মার্চেন্ট নম্বর:** \`${config?.bKashMerchant || '০১৭১২৩৪৫৬৭৮'}\` (Payment অপশন ব্যবহার করুন)
  * 📱 **Nagad মার্চেন্ট নম্বর:** \`${config?.nagadMerchant || '০১৬১২৩৪৫৬৭৮'}\`
  * 📱 **Rocket মার্চেন্ট নম্বর:** \`${config?.rocketMerchant || '০১৫১২৩৪৫৬৭৮-৯'}\`
* **রশিদ সংগ্রহ:** যেকোনো পেমেন্ট ড্যাশবোর্ড থেকে সম্পন্ন হবার পর স্বয়ংক্রিয়ভাবে ডাউনলোডযোগ্য **ডিজিটাল মানি রিসিট** জেনারেট হয় যা আপনার পেমেন্ট প্যানেলে জমা থাকে।

---`;
            if (currentUser && currentUser.flatNo) {
              const myDues = payments ? payments.filter(p => p.flatNo === currentUser.flatNo && p.status === 'Pending') : [];
              if (myDues.length > 0) {
                res += `\n\n⚠️ **আপনার ব্যক্তিগত সতর্কবার্তা:** আপনার লগইন করা অ্যাকাউন্ট (ফ্ল্যাট **${currentUser.flatNo}**) এর মোট **${myDues.length}টি মাসের বকেয়া পেমেন্ট** পেন্ডিং রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।`;
              } else {
                res += `\n\n✅ **আপনার ব্যক্তিগত স্ট্যাটাস:** আপনার ফ্ল্যাট **${currentUser.flatNo}** এর কোনো পেন্ডিং বা বকেয়া বিল পাওয়া যায়নি। ধন্যবাদ আপনার নিয়মানুবর্তিতার জন্য!`;
              }
            }
            return res;
          }

          // 5. SECURITY, CCTV, NVR, AND CAMPUS GUIDELINES
          if (q.includes("নিরাপত্তা") || q.includes("নজরদারি") || q.includes("সিকিউরিটি") || q.includes("ঘুম") || q.includes("শান্ত") || q.includes("ভিজিটর") || q.includes("ক্যামেরা") || q.includes("সিসিটিভি") || q.includes("গেট") || q.includes("security") || q.includes("visitor") || q.includes("cctv") || q.includes("quiet") || q.includes("gate")) {
            return `### 🚧 সিকিউরিটি, সিসিটিভি ক্যামেরা ও শান্ত ঘন্টা নীতিমালা:
*আস্থা টুইন টাওয়ার্সের মূল অগ্রাধিকার হলো বাসিন্দাদের সর্বোচ্চ নিশ্ছিদ্র নিরাপত্তা ও আরামদায়ক পরিবেশ নিশ্চিত করা। এই লক্ষ্যে নিম্নোক্ত নিয়মাবলী প্রযোজ্য:*

* **২৪/৭ সিসিটিভি ও NVR টার্মিনাল:** আস্থা টাওয়ার চত্বর জুড়ে মোট ৩২টি হাই-ডেফিনিশন আইপি ক্যামেরা রয়েছে। কন্ট্রোল রুমে অবস্থানরত নিরাপত্তা রক্ষীদের দ্বারা লাইভ **NVR মনিটরিং টার্মিনাল** পরিচালিত হয়।
* **শান্ত ঘন্টা (Quiet Hours):** প্রতিদিন **রাত ১০:০০ টা থেকে সকাল ০৬:০০ টা** পর্যন্ত শান্ত ঘন্টা বলবৎ থাকে। এই সময় ছাদবাগান, গেস্ট লাউঞ্জ বা ফ্ল্যাটে কোনো উচ্চ শব্দকারী মিউজিক বা কোলাহল করা কঠোরভাবে নিষিদ্ধ।
* **গেস্ট ও ভিজিটর এন্ট্রি রুলস:**
  * সকল অতিথি কুলাঙ্গার এবং ডেলিভারি রাইডারদের মূল ফটক বা গেট কাউন্টারে এন্ট্রি ফরমে স্পষ্ট তথ্য নথিভুক্ত করতে হবে।
  * বাসিন্দাদের দ্রুত যাতায়াত সুবিধার জন্য আগে থেকেই ড্যাশবোর্ডের "Visitors" ট্যাব থেকে **Online Entry Pass Code** টিকিট জেনারেট করে অতিথির মোবাইলে পাঠিয়ে দিতে পারেন যাতে দ্রুত গেট অতিক্রম করতে পারেন।

---
*যেকোনো জরুরী প্রয়োজনে বা সন্দেহজনক গতিবিধি লক্ষ্য করলে ড্যাশবোর্ডের 'Complaints' ডেস্কে বা সরাসরি জরুরি কন্টাক্ট নাম্বারে গার্ডকে অবহিত করুন।*`;
          }

          // 6. CIVIL CONSTRUCTION & DEVELOPMENT PROGRESS
          if (q.includes("নির্মাণ") || q.includes("অগ্রগতি") || q.includes("কাজ") || q.includes("ছাদ") || q.includes("ঢালাই") || q.includes("মাইলস্টোন") || q.includes("phase") || q.includes("progress") || q.includes("construction") || q.includes("foundation")) {
            return `### 🏗️ নির্মাণ কাজের অগ্রগতি ও আর্থিক হিসাব (Civil Work Report):
*আস্থা টুইন টাওয়ার্স কনস্ট্রাকশন অ্যান্ড ডেভেলপমেন্ট লেজার অনুযায়ী প্রকল্পের নির্মাণ অগ্রগতি বিবরণ নিচে তুলে ধরা হলো:*

* **সমাপ্তির শতকরা হার:** বর্তমানে প্রকল্পের **${constPercent}% নির্মাণ কাজ সম্পন্ন** হয়েছে।
* **টাওয়ার ভিত্তিক স্ট্রাকচারাল মাইলস্টোন:**
  * **টাওয়ার ১ (Tower 1):** ১৩ম তলার ছাদ ঢালাইয়ের কাজ ১০০% সিকিউরিটিতে সফলভাবে সম্পন্ন হয়েছে।
  * **টাওয়ার ২ (Tower 2):** ১১ম তলার ছাদ ঢালাই ও কংক্রিট কিউরিংয়ের কাজ সম্পন্ন হয়েছে।
  * **গুণমান পরীক্ষা:** প্রতি সপ্তাহে কংক্রিট পিউরিফিকেশন ও গুণমান পরীক্ষা কমিটি এবং কনসালটেন্ট ফার্ম দ্বারা সম্পন্ন করা হয়।
* **কনস্ট্রাকশন ফেইজসমূহ:**
  * **ফেইজ ১ (পাইল ফাউন্ডেশন):** ১০০% কমপ্লিট।
  * **ফেইজ ২ (ব্রিক ওয়ার্ক ও সাইট প্লাস্টারিং):** বর্তমানে চলমান কাজ চলছে। 
  * **ফেইজ ৩ (ইলেকট্রিক ও টাইলস ওয়ার্ক):** আসন্ন মাইলস্টোন।

---
*বিল্ডিং এর লাইভ কন্ট্রিবিউশন এবং ফেজ ওয়াইজ পেমেন্ট হিসাবের জন্য অনুগ্রহ করে "Construction" ট্যাবটি দেখুন।*`;
          }

          // 7. COMPLAINTS & COMPLAINTS DESK
          if (q.includes("অভিযোগ") || q.includes("নষ্ট") || q.includes("লিকেজ") || q.includes("প্লাম্বিং") || q.includes("সমস্যা") || q.includes("কমপ্লেন") || q.includes("টিকিট") || q.includes("complaint") || q.includes("ticket") || q.includes("fix")) {
            let res = `### 🛠️ অভিযোগ ও সেবা টিকিট নিষ্পত্তি পদ্ধতি:
*আস্থা টুইন টাওয়ার্স ড্যাশবোর্ড একটি স্বয়ংক্রিয় ডিজিটালাইজড কমপ্লেন ডেস্ক সমর্থন করে যাতে সাধারণ সমস্যাগুলো দ্রুত সমাধান করা যায়:*

* **হেল্প টিকিট বুকিং প্রক্রিয়া:** আপনার একাউন্ট প্যানেল থেকে "Complaints" অপশনে যান এবং সমস্যা সম্পর্কিত একটি রিয়েল-টাইম কমপ্লেন টিকিট লঞ্চ করুন (যেমন: পানির লিকেজ, বৈদ্যুতিক ত্রুটি বা ময়লা নিষ্কাশন)।
* **তদন্তের সময়কাল:** টিকিট বুক করার সর্বোচ্চ **১২ ঘণ্টার মধ্যে** আমাদের ইলেক্ট্রিশিয়ান বা প্লাম্বিং কারিগর দল তাৎক্ষণিক তদন্ত দল প্রেরণ করে সমস্যা খতিয়ে দেখেন।
* **স্ট্যাটাস ট্র্যাকিং:** আপনি ড্যাশবোর্ডেই দেখতে পাবেন আপনার অভিযোগটি কি এখনো **⏳ পেন্ডিং**, **⚠️ তদন্তাধীন** নাকি **✅ সমাধানকৃত** মোডে রয়েছে।

---`;
            if (complaints && complaints.length > 0) {
              const pending = complaints.filter(c => c.status === 'Pending').length;
              const resolved = complaints.filter(c => c.status === 'Resolved').length;
              res += `\n\n📊 **আজকের পরিসংখ্যান:** সোসাইটি বোর্ডে মোট **${complaints.length}টি ইস্যু রেজিস্টার্ড** রয়েছে যার মধ্যে **${resolved}টি সফলভাবে সমাধান করা হয়েছে** এবং **${pending}টি অপেক্ষমান** রয়েছে।`;
            }
            return res;
          }

          // 8. DUTY SUPPORT STAFF & EMERGENCY CONTACTS
          if (q.includes("স্টাফ") || q.includes("দারোয়ার") || q.includes("গার্ড") || q.includes("কর্মচারী") || q.includes("দারোয়ান") || q.includes("দারোয়ান") || q.includes("হেল্প") || q.includes("কন্টাক্ট") || q.includes("ফোন") || q.includes("জরুরী") || q.includes("জরুরি") || q.includes("staff") || q.includes("guard") || q.includes("contact") || q.includes("phone")) {
            let res = `### 📞 কর্তব্যরত সাপোর্ট স্টাফ ও জরুরী যোগাযোগ নম্বর:
*যেকোনো তাৎক্ষণিক লিফট রেসকিউ, পানির ট্রাব সহ জরুরী পরিস্থিতিতে নিম্নোক্ত অন-ডিউটি কর্মকর্তাদের সাথে যোগাযোগ করুন:*

* **জেনারেল গেট সিকিউরিটি সুপারভাইজার:** **আল-আমিন হোসেন** 
  * 📞 ফোন নম্বর: \`+8801900112233\` (সার্বক্ষণিক গেট পাহারা)
* **প্রধান বৈদ্যুতিক কারিগর ও লিফট ইঞ্জিনিয়ার:** **মিলন মিয়া** 
  * 📞 ফোন নম্বর: \`+8801822334455\`
* **পানি সরবরাহ ও প্লাম্বিং টেকনিশিয়ান:** **মোঃ রুবেল** 
  * 📞 ফোন নম্বর: \`+8801733445566\`
* **সোসাইটি আইটি টেকনিক্যাল সাপোর্ট ডেস্ক:** **আস্থা আইটি হাব** 
  * 📞 ফোন নম্বর: \`+8801555667788\`

---
*নিচে আপনার ডাটাবেজের ডাইনামিক রিয়েল-টাইম স্টাফের তালিকা দেওয়া হলা:*`;
            if (staff && staff.length > 0) {
              staff.forEach((s, idx) => {
                res += `\n* **${idx+1}. ${s.name}** - ${s.role} | ফোন: \`${s.phone || 'N/A'}\` (অবস্থা: ${s.status})`;
              });
            } else {
              res += `\n*(বর্তমানে ডাটাবেজে অতিরিক্ত নতুন সচল স্টাফ অন-রেকর্ড নেই)*`;
            }
            return res;
          }

          // DEFAULT BENGALI RESPONSE (PROMPT NOT MATCHED YET)
          return `🤖 **আস্থা টুইন টাওয়ার্স সাহায্যকারী ইন্টেলিজেন্ট এআই (লোকাল ডেটাবেজ সচল):**

আপনার জন্য সমস্ত প্রকল্পের তথ্য ভান্ডারটি অফলাইন মোডে আপডেট করে সুরক্ষিত করা হয়েছে। সার্ভার ডাউন থাকলে বা সংযোগ না মিললেও আমি তাৎক্ষণিকভাবে নিচের যেকোনো প্রশ্নের সঠিক নির্ভরযোগ্য তথ্য সরবরাহ করতে প্রস্তুত!

**অনুগ্রহ করে যেকোনো বিষয় নির্বাচন করুন অথবা নিচে টাইপ করুন:**
১. 🏢 **"প্রকল্পের পরিচিতি"** (অবস্থান, ঠিকানা, ফ্ল্যাট লেআউট এবং সাধারণ তথ্য)
২. 👥 **"সোসাইটি কমিটি"** (সভাপতি, কোষাধ্যক্ষ ও সাধারণ সম্পাদকের নাম ও ডাইরেক্ট ফোন নম্বর)
৩. 📊 **"ফ্ল্যাট বিন্যাস"** (আবাসন স্ট্যাটিস্টিকস, প্রস্তুত ও খালি ফ্ল্যাটের বিবরণ)
৪. 💳 **"মেইনটেইন্যান্স ফি"** (বিকাশ ও নগদ মার্চেন্ট নম্বর, মাসিক ফি পরিমাণ ও বিলম্ব জরিমানা)
৫. 🚧 **"সিকিউরিটি ও নিয়ম"** (সিসিটিভি NVR ক্যামেরা, শান্ত ঘন্টা এবং গেস্ট পাস তৈরির নিয়ম)
৬. 🏗️ **"নির্মাণ কাজ"** (উভয় টাওয়ারের বর্তমান নির্মাণ অগ্রগতি ও মাইলস্টোন আপডেট)
৭. 🛠️ **"অভিযোগ ডেস্ক"** (অভিযোগ ফরম খোলার নিয়ম ও সমাধান সময়সীমা)
৮. 📞 **"স্টাফ কন্টাক্ট"** (দারোয়ান, ইলেকট্রিশিয়ান ও জরুরি প্লাম্বারের কন্টাক্ট নম্বর)`;
        } else {
          // ENGLISH COGNITIVE OFFLINE RESPONDER
          if (q.includes("address") || q.includes("location") || q.includes("where") || q.includes("astha") || q.includes("twin") || q.includes("tower") || q.includes("cumilla")) {
            return `### 🏢 Project Overview & Location (Astha Twin Towers):
*Astha Twin Towers is a premier residential twin-tower development setting new standards of security and digital automation.*

* **Location:** Khetasar, Cumilla, Bangladesh.
* **Property Type:** High-end Twin Residential Blocks.
* **Layout Structure:**
  * **Total Flats:** 72 Premium apartment spaces (36 units inside Tower 1 and 36 units inside Tower 2).
  * **Campus Surveillance:** 24/7 high-fidelity IP cameras connected to active NVR monitoring terminal.
  * **Amenities:** Rooftop garden terrace, modern exercise fitness gym room, central community hall, and auto-diesel generator backup.
  * **Water Quality:** Standard water filtration plant with weekly certified purification compression checks.`;
          }

          if (q.includes("committee") || q.includes("president") || q.includes("secretary") || q.includes("treasurer") || q.includes("chairman") || q.includes("member") || q.includes("executive")) {
            return `### 🏢 Society Executive & Management Committee:
*The authorized representatives supervising the operational budgets and guidelines of Astha Twin Towers:*

1. **Executive Chairman:** **Alhaj Md. Abdur Rahman**
   * Unit: \`9B\` | Phone: \`+8801711223344\`
2. **Society President:** **Engr. Rafiqul Islam**
   * Unit: \`7B\` | Phone: \`+8801911223344\`
3. **General Secretary:** **Dr. Adnan Chowdhury**
   * Unit: \`5C\` | Phone: \`+8801811556677\`
4. **Treasurer (Financial Head):** **Adnan Chowdhury**
   * Unit: \`4B\` | Phone: \`+8801611332211\`

*You can contact the board directly during standard office hours regarding society audits or dues.*`;
          }

          if (q.includes("payments") || q.includes("fees") || q.includes("bkash") || q.includes("nagad") || q.includes("bill") || q.includes("due") || q.includes("money")) {
            return `### 💳 Invoices, Merchant Gateways & Maintenance Bills:
*Keep track of your billing certificates easily via bKash or Nagad mobile portals:*

* **Monthly Service Fee:** **BDT ${bdtFee}** per residential flat unit.
* **Payment Deadline:** Due by **10th of every month**.
* **Late Fee:** Penalty charges of BDT 100 may apply after the **15th of the month**.
* **Digital Gateway Portals:**
  * 📱 **bKash Merchant:** \`${config?.bKashMerchant || '01712345678'}\` (Select 'Payment')
  * 📱 **Nagad Merchant:** \`${config?.nagadMerchant || '01612345678'}\`
  * 📱 **Rocket Merchant:** \`${config?.rocketMerchant || '01512345678-9'}\`
* **Receipts:** Digital, verifiable printed receipts are instantly compiled inside your "Payments" portal database upon successful payment.`;
          }

          if (q.includes("construction") || q.includes("progress") || q.includes("work") || q.includes("slab") || q.includes("milestone") || q.includes("percent")) {
            return `### 🏗️ Construction Milestone Progress & Slabs:
*The Structural Status Ledger of Astha Towers twin-block residential project:*

* **Total Completed Ratio:** **${constPercent}% Completed**.
* **Structural Tier Details:**
  * **Tower 1:** 13th slab casting completed with zero defects.
  * **Tower 2:** 11th tier reinforced slab casting completed.
  * **Lab Compliance:** weekly concrete tests are validated by structural engineering consultant team.`;
          }

          if (q.includes("security") || q.includes("visitor") || q.includes("quiet") || q.includes("guard") || q.includes("cctv") || q.includes("gate")) {
            return `### 🚧 Security Oversight, Guard Protocols & Quiet Hours:
*Rules curated to shield the peace, comfort, and security of all residence units inside Astha Twin Towers:*

* **Quiet Hours:** Enforced strictly from **10:00 PM to 6:00 AM** daily. Noise levels or parties are prohibited during this frame.
* **Surveillance:** 24/7 Guard monitoring with terminal-controlled CCTV recorders.
* **Visitor Passes:** Residents must submit pre-arrival visitor entry request passes online. Guests can use the temporary passcode for immediate gate clearance.`;
          }

          // GENERAL ENGLISH DEFAULT
          return `🤖 **Astha AI Offline Intellectual Assistant:**
The Astha local knowledge database has been completely stored. I can address all operational facts without an internet connection.

**Feel free to ask me about:**
1. 🏢 **"project details"** or location specs
2. 👥 **"society committee"** board contacts
3. 📊 **"flats layout"** occupancy counts 
4. 💳 **"maintenance fees"** and mobile wallet numbers
5. 🚧 **"security protocols"** and quiet hours rules
6. 🏗️ **"construction progress"** tier updates
7. 🛠️ **"repair complaints"** desk handling
8. 📞 **"emergency numbers"** of caretakers & standby guard units`;
        }
      };
      const localResponseText = getClientOfflineResponse(textToSend, language);
      const offlineMsgText = language === 'bn' 
        ? `⚠️ *[নেটওয়ার্কFallback] ${localResponseText}*`
        : `⚠️ *[NetworkFallback] ${localResponseText}*`;

      const botMessage: ChatMessage = {
        id: `offline-${Date.now()}`,
        role: 'model',
        text: offlineMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Reset chat logic
  const resetChat = () => {
    setMessages([defaultWelcomeMessage()]);
  };

  // Highlight suggestion chips for rapid interaction
  const suggestions = language === 'bn' 
    ? [
        { label: 'পেমেন্টের শেষ সময় কবে?', text: 'সোসাইটি মেইনটেইন্যান্স পেমেন্ট করার শেষ সময় কখন এবং জরিমানা কত?' },
        { label: 'কুয়ায়েট আওয়ার্স কোনটি?', text: 'আস্থা টুইন টাওয়ারের কুয়ায়েট আওয়ার্স বা ঘুমের সময় সময়সূচী কী?' },
        { label: 'অভিযোগ দায়ের নিয়ম', text: 'কি কি ক্যাটাগরিতে এবং কিভাবে নতুন অভিযোগ সাবমিট করব?' },
        { label: 'ভিজিটর এন্ট্রি পাস', text: 'আমার ফ্ল্যাটে নতুন গেস্ট আসার জন্য পূর্বঅনুমতি বা ভিজিটর পাস কীভাবে তৈরি করতে পারি?' }
      ]
    : [
        { label: 'When is billing deadline?', text: 'When is the monthly maintenance fee due and are there late fees?' },
        { label: 'Visitor register guidelines', text: 'How do residents pre-approve or register visitors at Astha buildings?' },
        { label: 'Quiet hours boundaries', text: 'What are the quiet hours and general rules at Astha Twin Towers?' },
        { label: 'Filing a complaint', text: 'How do residents submit complaints and how long does investigation take?' }
      ];

  return (
    <div id="astha-ai-assistant-root" className="fixed bottom-6 right-6 z-50 font-sans print:hidden flex flex-col items-end">
      {/* Expanded Chat Box Window */}
      {isOpen && (
        <div 
          id="astha-ai-chat-window" 
          className="mb-4 w-[360px] sm:w-[410px] max-w-[calc(100vw-32px)] h-[520px] sm:h-[580px] bg-neutral-950 border border-emerald-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),_0_0_30px_rgba(16,185,129,0.1)] flex flex-col overflow-hidden animate-fade-in text-slate-200"
        >
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-neutral-900 via-[#032e24] to-neutral-950 p-4 border-b border-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md animate-pulse">
                  <div className="h-full w-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
              </div>
              <div>
                <h3 className="font-mono text-[11.5px] font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1">
                  <span>Astha AI Assistant</span>
                </h3>
                <span className="text-[9px] text-slate-400 font-mono block">
                  {language === 'bn' ? '● সর্বদা আপনার সেবায় নিয়োজিত' : '● Always active & secure'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <button 
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                title={language === 'bn' ? 'এপিআই কী কনফিগারেশন' : 'API Key Config'}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${showConfig ? 'text-amber-400 bg-neutral-900 border border-emerald-900' : 'text-slate-400 hover:text-[#D4AF37] hover:bg-neutral-900'}`}
              >
                <Key className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={resetChat}
                title={language === 'bn' ? 'পুনরায় চ্যাট শুরু করুন' : 'Reset chat'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Sub-Header Notice Bar */}
          <div className="bg-[#04211a]/40 border-b border-emerald-950/40 py-1.5 px-3 text-[9.5px] font-mono text-emerald-400/90 text-center flex items-center justify-center gap-1">
            <Building className="h-3 w-3 shrink-0" />
            <span>Khetasar, Cumilla, BD — Powered by Gemini AI</span>
          </div>

          {/* API Key Configuration Dropdown */}
          {showConfig && (
            <div className="bg-neutral-900/95 border-b border-emerald-950 p-3.5 space-y-2.5 animate-slide-down">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>{language === 'bn' ? 'জেমিনি কী কনফিগারেশন (GitHub Pages)' : 'Client Gemini API Key Config'}</span>
                </span>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="text-slate-400 hover:text-red-400 text-[10px]"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
                {language === 'bn' 
                  ? 'GitHub Pages-এর মতো স্ট্যাটিক হোস্টিং-এ সরাসরি রিয়েল-টাইম জেমিনি এআই কাজ করার জন্য নিচে আপনার নিজস্ব Gemini API Key পেস্ট করুন। এটি আপনার ব্রাউজারের লোকাল স্টোরেজে সম্পূর্ণ নিরাপদে রাখা হবে।' 
                  : 'To enable real-time replies on static hostings like GitHub Pages, paste your temporary Gemini API key below. It remains secure in your browser localStorage.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setUserApiKey(val);
                    localStorage.setItem('ASTHA_USER_GEMINI_KEY', val);
                  }}
                  placeholder="AIzaSy..."
                  className="flex-1 px-2.5 py-1.5 text-[10px] bg-neutral-950 border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-lg text-slate-100 font-mono"
                />
                {userApiKey && (
                  <button
                    onClick={() => {
                      setUserApiKey('');
                      localStorage.removeItem('ASTHA_USER_GEMINI_KEY');
                    }}
                    className="px-2.5 py-1.5 text-[9.5px] bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 rounded-lg font-mono transition-all"
                  >
                    {language === 'bn' ? 'মুছুন' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="text-[8.5px] text-slate-500 leading-normal bg-neutral-950/40 p-2 rounded-lg border border-emerald-950/30 font-sans">
                💡 <span className="font-bold">{language === 'bn' ? 'বিকল্প পথ:' : 'Alternative option:'}</span>{' '}
                {language === 'bn' 
                  ? 'আপনার রিপোসিটরির build ফোল্ডারে VITE_GEMINI_API_KEY এনভায়রনমেন্ট ভ্যারিয়েবল ব্যবহার করে এটি সেট করতে পারেন।' 
                  : 'You can also set the VITE_GEMINI_API_KEY environment variable during your GitHub build actions.'}
              </div>
            </div>
          )}

          {/* Quick Help Menu vs AI Chat Tab Controller Bar */}
          <div className="flex bg-neutral-900/95 border-b border-emerald-950/70 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer ${
                activeTab === 'help'
                  ? 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 text-emerald-400 border border-emerald-800/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'সহায়তা মেনু' : 'Quick Help'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 text-emerald-400 border border-emerald-800/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/50'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'এআই চ্যাট' : 'AI Chat'}</span>
            </button>
          </div>

          {/* Quick Help Menu Directory Panel */}
          {activeTab === 'help' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-neutral-950 to-neutral-900 scrollbar-thin scrollbar-thumb-emerald-950 pr-2 animate-fade-in">
              {/* Introduction Header banner inside Help */}
              <div className="p-3 bg-emerald-950/15 border border-emerald-900/30 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#D4AF37] tracking-widest uppercase flex items-center justify-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>{language === 'bn' ? 'আস্থা গাইডবুক (Quick FAQ)' : 'Astha Quick FAQ Directory'}</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {language === 'bn' 
                    ? 'নিচে ক্যাটাগরি অনুযায়ী সাধারণ প্রশ্নগুলোর সমাধান রয়েছে। যেকোনো প্রশ্নে ক্লিক করে সরাসরি উত্তর দেখুন।' 
                    : 'Browse through our structured categories below. Click on any question to view formal instructions.'}
                </p>
              </div>

              {/* Categories Wrapper */}
              <div className="space-y-2.5">
                {FAQ_CATEGORIES.map((category) => {
                  const isCatExpanded = expandedCategoryId === category.id;
                  return (
                    <div 
                      key={category.id} 
                      className="border border-emerald-950/80 bg-[#02100b]/45 rounded-xl overflow-hidden transition-all"
                    >
                      {/* Category Row Trigger header */}
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCategoryId(isCatExpanded ? null : category.id);
                          setExpandedFaqIdx(null); // Reset active internal faq
                        }}
                        className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                          isCatExpanded ? 'bg-emerald-950/30 border-b border-emerald-950/40 text-emerald-400' : 'text-slate-300 hover:bg-neutral-900/40'
                        }`}
                      >
                        <span className="text-[11px] font-bold font-sans tracking-wide">
                          {language === 'bn' ? category.titleBn : category.titleEn}
                        </span>
                        {isCatExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#D4AF37]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      {/* List of FAQs under Category */}
                      {isCatExpanded && (
                        <div className="p-2.5 space-y-2 bg-neutral-950/30 divide-y divide-emerald-950/25">
                          {category.faqs.map((faq, idx) => {
                            const isFaqExpanded = expandedFaqIdx === idx;
                            return (
                              <div key={idx} className={`${idx > 0 ? 'pt-2.5' : ''} space-y-1.5`}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedFaqIdx(isFaqExpanded ? null : idx)}
                                  className="w-full flex items-start gap-2 text-left text-[10.5px] font-medium text-slate-300 hover:text-emerald-400 cursor-pointer select-none"
                                >
                                  <HelpCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                                  <span className="flex-1">{language === 'bn' ? faq.qBn : faq.qEn}</span>
                                  {isFaqExpanded ? (
                                    <ChevronUp className="h-3 w-3 mt-1 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 mt-1 text-slate-500" />
                                  )}
                                </button>

                                {isFaqExpanded && (
                                  <div className="pl-5.5 space-y-2 text-[10.5px] leading-relaxed text-slate-400 animate-slide-down">
                                    <p className="bg-neutral-900/85 border-l-2 border-amber-500 py-1.5 px-2.5 rounded-r-lg text-slate-300 font-sans">
                                      {language === 'bn' ? faq.aBn : faq.aEn}
                                    </p>
                                    
                                    {/* Interactive Prompt Sender Button */}
                                    <div className="pt-0.5 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const questionText = language === 'bn' ? faq.qBn : faq.qEn;
                                          setActiveTab('chat');
                                          sendMessage(questionText);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 rounded-lg text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                      >
                                        <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                                        <span>{language === 'bn' ? 'এআই কে বিস্তারিত জিজ্ঞাসা করুন' : 'Ask AI to elaborate'}</span>
                                        <ArrowRight className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Area viewport */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-neutral-950 to-neutral-900 scrollbar-thin scrollbar-thumb-emerald-950 pr-2">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* User/Bot Avatar Icon */}
                  <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'bg-emerald-950 ring-1 ring-emerald-400' 
                      : 'bg-neutral-900 ring-1 ring-amber-500'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                    )}
                  </div>

                  {/* Message bubble outline */}
                  <div className="space-y-1">
                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed break-words whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-emerald-950/70 text-emerald-100 rounded-tr-none border border-emerald-900/30 shadow-md' 
                        : 'bg-neutral-900/95 text-slate-200 rounded-tl-none border border-slate-800/65 shadow-md shadow-emerald-950/5'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[8.5px] font-mono text-slate-500 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Simulated Gemini Typing Indicator */}
              {loading && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto">
                  <div className="h-7 w-7 rounded-lg shrink-0 bg-neutral-900 ring-1 ring-amber-400/80 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 text-[#D4AF37] animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <div className="px-4 py-2 bg-neutral-900 border border-slate-800/40 rounded-2xl rounded-tl-none flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <span className="animate-bounce delay-75">●</span>
                      <span className="animate-bounce delay-150">●</span>
                      <span className="animate-bounce delay-300">●</span>
                      <span className="text-[8.5px] text-slate-500 font-mono ml-1.5">
                        {language === 'bn' ? 'জেমিনি টাইপ করছে...' : 'Gemini is thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Inline Suggestion Quick Prompts Chips */}
          <div className="p-3 bg-neutral-950/95 border-t border-emerald-950/30">
            <span className="text-[9px] font-mono font-black uppercase text-[#D4AF37] tracking-wider block mb-2 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === 'bn' ? 'ঘন ঘন জিজ্ঞাসিত প্রশ্ন (FAQ):' : 'Suggested Inquiries Panel:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(sug.text)}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-[9.5px] font-sans bg-neutral-900 hover:bg-emerald-950/40 hover:text-emerald-400 border border-emerald-950/60 hover:border-emerald-700/60 rounded-full transition-all text-slate-400 text-left truncate max-w-full cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Input Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-neutral-950 border-t border-emerald-950 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'bn' ? 'এখানে যেকোনো প্রশ্ন লিখুন...' : 'Ask about Astha Twin Tower here...'}
              disabled={loading}
              className="flex-1 px-3 py-2 text-[11px] bg-neutral-900 border border-emerald-950 rounded-xl focus:outline-none focus:border-emerald-400 text-slate-100 font-sans placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                loading || !input.trim()
                  ? 'bg-neutral-900 text-slate-600 border border-slate-900'
                  : 'bg-emerald-950 border border-emerald-600 text-emerald-400 hover:bg-emerald-900 shadow-md shadow-emerald-950/20'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Hello Greeting Tooltip Bubble */}
      {!isOpen && showHelloTooltip && (
        <div className="absolute right-18 bottom-1 flex items-center gap-2 bg-neutral-950 border border-emerald-400/90 text-emerald-300 py-2 px-3 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.35)] animate-bounce select-none whitespace-nowrap z-50">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 animate-pulse text-[12px]">👋</span>
            <span className="font-mono text-[10.5px] font-black tracking-widest text-[#D4AF37]">
              {language === 'bn' ? 'হ্যালো! প্রশ্ন করুন' : 'HELLO! ASK AI'}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowHelloTooltip(false);
            }}
            className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title={language === 'bn' ? 'বন্ধ করুন' : 'Hide'}
          >
            <X className="h-3 w-3" />
          </button>
          {/* Tooltip Corner Arrow */}
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-950 border-r border-t border-emerald-400/90 rotate-45" />
        </div>
      )}

      {/* Floating Sparkles Trigger Button with Glowing Protective Halo Aura */}
      <div className="relative group/trigger">
        {!isOpen && (
          <>
            {/* Double Radiant "Halo" Rings */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 opacity-75 blur animate-pulse" />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400/20 to-amber-400/20 opacity-40 blur-md animate-ping" />
          </>
        )}
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={language === 'bn' ? 'আস্থা টুইন টাওয়ার এআই অ্যাসিস্ট্যান্ট' : 'Astha Twin Tower AI Assistant'}
          className={`h-15 w-15 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-emerald-400/20 relative z-10 ${
            isOpen 
              ? 'bg-neutral-950 text-emerald-400 border-2 border-red-500/70 hover:border-red-500' 
              : 'bg-gradient-to-tr from-neutral-950 via-[#043d30] to-neutral-900 text-emerald-400 border-2 border-emerald-400/80 hover:border-amber-400 hover:text-amber-400'
          }`}
        >
          {isOpen ? (
            <X className="h-5.5 w-5.5 animate-pulse" />
          ) : (
            <div className="relative flex flex-col items-center justify-center">
              <Smile className="h-5 w-5 text-amber-300 animate-pulse" />
              <Sparkles className="h-3 w-3 text-emerald-400 absolute -top-1.5 -right-2 animate-bounce" />
              <span className="text-[7.5px] font-mono font-black tracking-widest text-[#D4AF37] mt-0.5 uppercase">
                Hello
              </span>
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
