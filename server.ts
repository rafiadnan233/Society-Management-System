import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Initialize express application
const app = express();
const PORT = 3000;

// Parse json and urlencoded request bodies
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize the Google Gemini API client
// Use fallback or environment variable, ensure it fails gracefully if missing
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables!");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_OR_MISSING_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// System instruction representing the Astha Twin Tower AI Assistant
const ASTHA_SYSTEM_INSTRUCTION = `You are Astha Twin Tower AI Assistant.
Always answer in Bengali (Bangla) default unless the user asks to use English.
Help residents, visitors, staff, and administrators.
Provide accurate information about society services at Astha Twin Tower (located in Khetasar, Cumilla, Bangladesh).
Keep responses context-aware, outstandingly polite, warm, concise, and professional.

Key facts about Astha Twin Tower:
1. Contact & Location: Khetasar, Cumilla, Bangladesh.
2. Apartment Management: There are multiple flats across tower blocks.
3. Maintenance Bills: The monthly maintenance fee should be paid via local mobile wallets (bKash/Nagad) or Cash by the 10th of every month. Late feeds may apply after the 15th of the month.
4. Security & Visitors: All visitors/guests, vehicles, and delivery partners must register at the reception/gate. Residents can submit pre-arrival visitor entry request passes online.
5. Voice Navigation: Astha Twin Tower system has a state-of-the-art Voice Navigator supporting voice commands (e.g. 'take me to the dashboard', 'show me payments') to help quick navigation.
6. Complaints Desk: If there are complaints (leakage, plumbing, security, common lights, garbage), residents can file them online. The administration processes them immediately.
7. Quiet Hours: 10:00 PM to 6:00 AM (to ensure comfort for children and elderly residents).
8. Common Areas: Community room, play area, and rooftop gardens must be reserved ahead of events with the society committee.

Format your responses with neat markdown lists or bold markers where relevant. Always keep instructions short, helpful, and friendly.`;

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Static mount for secure CCTV static assets & pages
app.use("/cctv", express.static(path.join(process.cwd(), "cctv-static")));

// Post Gemini API endpoint
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, history, systemContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' field in post body." });
    }

    const ai = getGeminiClient();
    
    // Construct rich chat message format
    // Format previous conversations if of history structure, otherwise just send the prompt
    // For general text generation we can use ai.models.generateContent with helper params
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }
    
    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // Helper to query Gemini with sequential routing for high availability
    const queryGeminiWithFallback = async () => {
      // Robust order of models, from primary down to high-compatibility and backup options
      const modelsToTry = [
        "gemini-3.5-flash", 
        "gemini-flash-latest", 
        "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview"
      ];

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Gemini Request] Attempting model: ${modelName}`);
          const res = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: ASTHA_SYSTEM_INSTRUCTION + 
                (systemContext ? `\n\n[Real-time Operational Context of Astha Twin Towers]:\n${systemContext}\n\nPlease use this live data from the Society Management System to answer the user's questions confidently and accurately. Refer to staff names, phone numbers, flats, committee designations, active notices, construction progress, or complaints whenever they ask. Default to Bangla unless specified otherwise.` : ""),
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          });
          if (res && res.text) {
            console.log(`[Gemini Success] Successfully resolved using model: ${modelName}`);
            return res;
          }
        } catch (modelErr: any) {
          const errMsg = modelErr?.message || String(modelErr);
          console.warn(`[Gemini Warning] Model ${modelName} returned error or demand spike. Error: ${errMsg}`);
          // Immediate fallback to next configured model without blocking delay
        }
      }
      throw new Error("All configured Gemini models are currently experiencing high demand or returned temporary errors.");
    };

    // Smart local semantic fallback response generator for offline resilience
    const getLocalSmartResponse = (query: string): string => {
      const q = query.toLowerCase();
      
      if (q.includes("বিল") || q.includes("পেমেন্ট") || q.includes("টাকা") || q.includes("payment") || q.includes("bill") || q.includes("fee") || q.includes("maint")) {
        return `**আস্থা টুইন টাওয়ার পেমেন্ট গাইডলাইন:**\n১. **শেষ সময়:** প্রতি মাসের ১০ তারিখের মধ্যে মাসিক মেইনটেইন্যান্স ফি পরিশোধ করতে হবে।\n২. **জরিমানা:** ১৫ তারিখ পার হয়ে গেলে বিলম্ব ফি যুক্ত হতে পারে।\n৩. **পরিশোধ পদ্ধতি:** আপনি আপনার ড্যাশবোর্ড থেকে মোবাইল ওয়ালেট (bKash, Nagad) অথবা সরাসরি ক্যাশ প্রদান করতে পারেন।`;
      }
      
      if (q.includes("quiet") || q.includes("ঘুম") || q.includes("শান্ত") || q.includes("শব্দ") || q.includes("night") || q.includes("silent") || q.includes("রাত")) {
        return `**আস্থা টুইন টাওয়ার নিয়মানুবর্তিতা (Quiet Hours):**\n- **সময়সূচী:** প্রতিদিন রাত ১০:০০ টা থেকে সকাল ০৬:০০ টা পর্যন্ত শান্ত ঘন্টা (Quiet Hours) বলবৎ থাকে।\n- এই সময়ে উচ্চ শব্দ সৃষ্টিকারী কাজ বা জোরে উৎসব করা নিষেধ যাতে শিশু ও বৃদ্ধ বাসিন্দাদের ব্যাঘাত না ঘটে।`;
      }

      if (q.includes("visitor") || q.includes("guest") || q.includes("ভিজিটর") || q.includes("মেহমান") || q.includes("গেস্ট") || q.includes("passes")) {
        return `**ভিজিটর রেজিষ্ট্রেশন ও পূর্বঅনুমতি:**\n১. নিরাপত্তার স্বার্থে সকল বহিরাগত অতিথি বা ডেলিভারি পার্টনারকে মেইন গেটে রেজিষ্ট্রেশন করতে হবে।\n২. বাসিন্দারা Resident ড্যাশবোর্ডে গিয়ে পূর্বেই **Visitor Entry Request** ক্রিয়া করতে পারেন যাতে মেহমানদের কোনো ঝামেলা ছাড়া দ্রুত প্রবেশ করতে দেওয়া হয়।`;
      }

      if (q.includes("complaint") || q.includes("অভিযোগ") || q.includes("নষ্ট") || q.includes("ত্রুটি") || q.includes("পানির") || q.includes("লিঙ্ক")) {
        return `**অভিযোগ ও সমাধান সেবা (Complaints):**\n- পানির লিকেজ, প্লাম্বিং সমস্যা, এবং কমন এরিয়ার যেকোনো ত্রুটির জন্য আপনি আপনার বাসিন্দা ড্যাশবোর্ড থেকে **Complaint Management** অপশনে গিয়ে টিকিট ওপেন করতে পারেন।\n- আমাদের টেকনিক্যাল টিম টিকিট পাওয়া মাত্রই জরুরি কাজ সম্পন্ন করবে।`;
      }

      if (q.includes("location") || q.includes("ঠিকানা") || q.includes("কোথায়") || q.includes("কুমিল্লা") || q.includes("cumilla") || q.includes("address")) {
        return `**আস্থা টুইন টাওয়ারের অবস্থান:**\n- **ঠিকানা:** খেতাসার, কুমিল্লা, বাংলাদেশ (Khetasar, Cumilla, Bangladesh)। এটি একটি সর্বাধুনিক সুযোগ-সুবিধা সম্বলিত আবাসন প্রকল্প।`;
      }

      return `স্বাগতম! আমি আস্থা টুইন টাওয়ারের এআই সহকারী।\nবর্তমানে সার্ভারের উচ্চ ট্রাফিকের কারণে মূল ক্লাউড প্রসেসরটি সাময়িকভাবে সাড়া দিচ্ছে না, তবে আমি আপনাকে উত্তর প্রদানে সক্ষম!\n\n**নিম্নলিখিত বিষয়ে যেকোনো তথ্য জানতে লিখুন:**\n- পেমেন্ট এবং বিলের নিয়মাবলী\n- কোয়াইট আওয়ার্স বা শব্দহীন সময়সূচী\n- নতুন ভিজিটর এন্ট্রি পাস অনুমোদন প্রক্রিয়া\n- যেকোনো অভিযোগ জমা দেওয়া এবং ট্র্যাক করা`;
    };

    let reply;
    try {
      const response = await queryGeminiWithFallback();
      reply = response.text || "দুঃখিত, আমি তাৎক্ষণিকভাবে তথ্য প্রস্তুত করতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করবেন।";
    } catch (fallbackErr) {
      console.warn("[Gemini Fallback Triggered] Serving high-fidelity local semantic fallback content:", fallbackErr);
      reply = getLocalSmartResponse(prompt);
    }
    
    res.json({ text: reply });
  } catch (err: any) {
    console.error("Gemini API Error in backend:", err);
    res.status(500).json({ 
      error: "Failed to process Gemini query", 
      details: err?.message || err,
      text: "দুঃখিত, আস্থা টুইন টাওয়ার এআই অ্যাসিস্ট্যান্ট সার্ভারে একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় সাবমিট করুন।" 
    });
  }
});

// Vite middleware flow for full stack context
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing server in Development Mode with Vite Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Initializing server in Production Mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express full-stack backend running successfully at http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch(err => {
  console.error("Failed to start Astha server:", err);
});
