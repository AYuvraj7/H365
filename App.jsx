import { useState, useRef, useEffect } from "react";
import {
  Megaphone, Send, Loader2, Store, Scissors, Laptop, Utensils, Tractor,
  Copy, Check, Lock, Image as ImageIcon, CalendarDays, MessageSquareText, Upload, Download,
} from "lucide-react";

const DAILY_LIMIT = 8;
const todayKey = () => `usage:${new Date().toISOString().slice(0, 10)}`;

// Brand palette — matches Hector365 logo (black bg, silver/white, electric blue glow)
const C = {
  bg: "#07090F",
  card: "#121826",
  cardBorder: "#233047",
  chipBg: "#15233A",
  accent: "#2F8FFF",
  accentGlow: "#7FD8E8",
  textHeading: "#F4F7FB",
  textBody: "#D7DEEA",
  textMuted: "#5C7090",
  white: "#FFFFFF",
};

const CATEGORIES = [
  { id: "kirana", label: "किराना", icon: Store },
  { id: "tailor", label: "दर्ज़ी", icon: Scissors },
  { id: "freelancer", label: "फ्रीलांस", icon: Laptop },
  { id: "food", label: "खाना", icon: Utensils },
  { id: "farm", label: "खेती", icon: Tractor },
];

const STARTER_PROMPTS = [
  "Diwali offer का WhatsApp message बनाओ",
  "मेरी sale कम है, ज़्यादा ग्राहक कैसे लाऊं?",
  "Instagram के लिए caption चाहिए",
  "नए ग्राहक को पहली बार कैसे आकर्षित करूं?",
];

const TABS = [
  { id: "chat", label: "बात करें", icon: MessageSquareText },
  { id: "poster", label: "पोस्टर बनाएं", icon: ImageIcon },
  { id: "ideas", label: "इस हफ्ते के Ideas", icon: CalendarDays },
];

async function callClaude(systemPrompt, messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: systemPrompt, messages }),
  });
  const data = await response.json();
  return (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
}

function Bubble({ msg, onCopy, copiedId }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed text-[15px]"
        style={
          isUser
            ? { background: C.accent, color: C.white, borderRadius: "18px 18px 4px 18px" }
            : { background: C.card, color: C.textBody, borderRadius: "18px 18px 18px 4px", border: `1px solid ${C.cardBorder}` }
        }
      >
        {msg.text}
        {!isUser && !msg.loading && (
          <div className="flex justify-end mt-1">
            <button onClick={() => onCopy(msg.id, msg.text)} className="opacity-50 hover:opacity-100" style={{ color: C.accentGlow }}>
              {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function useDailyLimit() {
  const [usedToday, setUsedToday] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(todayKey());
        setUsedToday(res ? parseInt(res.value, 10) || 0 : 0);
      } catch {
        setUsedToday(0);
      }
    })();
  }, []);
  const limitReached = usedToday >= DAILY_LIMIT;
  const increment = async () => {
    const n = usedToday + 1;
    setUsedToday(n);
    try {
      await window.storage.set(todayKey(), String(n));
    } catch {}
  };
  return { usedToday, limitReached, increment };
}

function ChatTab({ category, usage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading || usage.limitReached) return;
    const userMsg = { id: Date.now() + "u", role: "user", text: content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const catLabel = CATEGORIES.find((c) => c.id === category)?.label || "general";
    const systemPrompt = `Tum "Hector365" ho — ek free community marketing-madad AI, "Thrive Skills Educational Society" ki taraf se. User ka business: "${catLabel}". Tumhara focus hai: zyada grahak kaise aaye, marketing kaise badhe. Hinglish/Hindi mix me, simple, dosti bhare tone me, seedha kaam ki baat karo. Practical, turant istemal hone wala jawab do — lambi lecture mat do.`;

    try {
      const text2 = await callClaude(systemPrompt, history.map((m) => ({ role: m.role, content: m.text })));
      setMessages((prev) => [...prev, { id: Date.now() + "a", role: "assistant", text: text2 || "Kuch gadbad hui, dobara try karein." }]);
      await usage.increment();
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + "a", role: "assistant", text: "Connection me problem aayi. Dobara try karein." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-lg font-semibold mb-2" style={{ color: C.textHeading, fontFamily: "Georgia, serif" }}>
              नमस्ते! कैसे ग्राहक बढ़ाएं?
            </p>
            <p className="text-sm mb-6" style={{ color: C.textMuted }}>
              Thrive Skills Educational Society की तरफ से, marketing में free मदद
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  disabled={usage.limitReached}
                  className="text-left text-sm px-4 py-2.5 rounded-xl disabled:opacity-50"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} onCopy={handleCopy} copiedId={copiedId} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: "18px 18px 18px 4px" }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.accent }} />
              <span className="text-sm" style={{ color: C.textMuted }}>Hector365 सोच रहा है...</span>
            </div>
          </div>
        )}
        {usage.limitReached && (
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm" style={{ background: C.chipBg, color: C.accentGlow }}>
              <Lock className="w-4 h-4" />
              आज की free limit पूरी हो गई — कल फिर मिलेंगे!
            </div>
          </div>
        )}
      </div>
      <div className="flex items-end gap-2 px-4 py-3" style={{ background: C.chipBg }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={usage.limitReached ? "कल फिर try karein..." : "अपना सवाल यहां लिखें..."}
          rows={1}
          disabled={usage.limitReached}
          className="flex-1 px-4 py-2.5 rounded-2xl outline-none resize-none text-[15px] disabled:opacity-50"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody, maxHeight: "100px" }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim() || usage.limitReached}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
          style={{ background: C.accent, boxShadow: `0 0 16px ${C.accent}66` }}
        >
          <Send className="w-4.5 h-4.5" style={{ color: C.white }} />
        </button>
      </div>
    </div>
  );
}

function PosterTab({ category, usage }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const generateText = async () => {
    setLoadingText(true);
    const catLabel = CATEGORIES.find((c) => c.id === category)?.label || "business";
    const systemPrompt = `Tum poster ke liye chota, punchy marketing text banate ho. User ka business: "${catLabel}". Sirf 2 lines do: pehli line ek HEADLINE (max 6 shabd, bold offer/hook), dusri line ek SUBTEXT (max 10 shabd, detail). Format strictly:\nHEADLINE: ...\nSUBTEXT: ...\nKuch aur mat likho.`;
    try {
      const result = await callClaude(systemPrompt, [{ role: "user", content: "Poster ke liye text banao" }]);
      const h = result.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim();
      const s = result.match(/SUBTEXT:\s*(.+)/i)?.[1]?.trim();
      if (h) setHeadline(h);
      if (s) setSubtext(s);
      await usage.increment();
    } catch {
      setHeadline("बड़ा ऑफर!");
      setSubtext("आज ही दुकान पर आएं");
    } finally {
      setLoadingText(false);
    }
  };

  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const W = 800, H = 800;
      canvas.width = W;
      canvas.height = H;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);

      const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      grad.addColorStop(0, "rgba(7,9,15,0)");
      grad.addColorStop(1, "rgba(7,9,15,0.88)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      if (headline) {
        ctx.fillStyle = "#F4F7FB";
        ctx.font = "bold 56px Georgia";
        ctx.textAlign = "left";
        ctx.fillText(headline, 36, H - 110, W - 72);
      }
      if (subtext) {
        ctx.fillStyle = "#7FD8E8";
        ctx.font = "28px Georgia";
        ctx.fillText(subtext, 36, H - 60, W - 72);
      }
      ctx.fillStyle = "#2F8FFF";
      ctx.fillRect(0, 0, 170, 44);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Hector365", 85, 29);
    };
    img.src = imgSrc;
  }, [imgSrc, headline, subtext]);

  const download = () => {
    const link = document.createElement("a");
    link.download = "poster.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <p className="text-sm mb-4" style={{ color: C.textMuted }}>
        अपने product/दुकान की फोटो डालें, फिर offer-text generate करें — तैयार पोस्टर मिल जाएगा।
      </p>

      {!imgSrc && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-12 rounded-xl border-2 border-dashed"
          style={{ borderColor: C.cardBorder, color: C.textMuted, background: C.card }}
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm">फोटो चुनें</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {imgSrc && (
        <div>
          <canvas ref={canvasRef} className="w-full rounded-xl mb-4" style={{ border: `1px solid ${C.cardBorder}` }} />
          <div className="flex flex-col gap-2 mb-4">
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Headline (जैसे: 50% तक की छूट!)"
              className="px-4 py-2.5 rounded-xl outline-none text-[15px]"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody }}
            />
            <input
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              placeholder="Subtext (जैसे: सिर्फ इस हफ्ते)"
              className="px-4 py-2.5 rounded-xl outline-none text-[15px]"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody }}
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={generateText}
              disabled={loadingText || usage.limitReached}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: C.chipBg, color: C.accentGlow }}
            >
              {loadingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              AI से text बनवाएं
            </button>
            <button
              onClick={download}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: C.accent, color: C.white, boxShadow: `0 0 16px ${C.accent}55` }}
            >
              <Download className="w-4 h-4" />
              Poster Download करें
            </button>
            <button
              onClick={() => {
                setImgSrc(null);
                setHeadline("");
                setSubtext("");
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody }}
            >
              नई फोटो
            </button>
          </div>
          {usage.limitReached && <p className="text-sm mt-3" style={{ color: C.accentGlow }}>आज की free limit पूरी हो गई — फिर भी poster download कर सकते हैं।</p>}
        </div>
      )}
    </div>
  );
}

function IdeasTab({ category, usage }) {
  const [ideas, setIdeas] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const catLabel = CATEGORIES.find((c) => c.id === category)?.label || "business";
    const today = new Date().toLocaleDateString("hi-IN", { day: "numeric", month: "long" });
    const systemPrompt = `Tum "Hector365" ho. Aaj ki tareekh: ${today}. User ka business: "${catLabel}". Is hafte/season ke hisaab se 4 chhote marketing ideas do (jaise upcoming tyohar, season, weekday offer). Har idea sirf 1-2 lines me, numbered list (1. 2. 3. 4.). Practical aur turant istemal hone wala ho, Hindi/Hinglish me.`;
    try {
      const result = await callClaude(systemPrompt, [{ role: "user", content: "Is hafte ke marketing ideas do" }]);
      setIdeas(result);
      await usage.increment();
    } catch {
      setIdeas("Kuch gadbad hui, dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <p className="text-sm mb-4" style={{ color: C.textMuted }}>
        हर हफ्ते, मौसम और त्योहार के हिसाब से नए marketing ideas पाएं — बस button दबाएं।
      </p>
      <button
        onClick={generate}
        disabled={loading || usage.limitReached}
        className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium disabled:opacity-50 mb-5"
        style={{ background: C.accent, color: C.white, boxShadow: `0 0 16px ${C.accent}55` }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
        {loading ? "सोच रहा हूं..." : "इस हफ्ते के Ideas लाएं"}
      </button>
      {usage.limitReached && (
        <p className="text-sm mb-3 flex items-center gap-2" style={{ color: C.accentGlow }}>
          <Lock className="w-4 h-4" /> आज की free limit पूरी हो गई — कल फिर मिलेंगे!
        </p>
      )}
      {ideas && (
        <div className="p-5 rounded-xl whitespace-pre-wrap leading-relaxed text-[15px]" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textBody }}>
          {ideas}
        </div>
      )}
    </div>
  );
}

export default function Hector365() {
  const [category, setCategory] = useState(null);
  const [tab, setTab] = useState("chat");
  const usage = useDailyLimit();

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: C.bg }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "#0B0F1A", borderBottom: `1px solid ${C.cardBorder}` }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: C.chipBg, border: `1px solid ${C.accent}`, boxShadow: `0 0 12px ${C.accent}66` }}
        >
          <Megaphone className="w-4.5 h-4.5" style={{ color: C.accentGlow }} />
        </div>
        <div>
          <p className="font-semibold text-[17px] tracking-wide" style={{ color: C.textHeading, fontFamily: "Georgia, serif" }}>
            HECTOR<span style={{ color: C.accent }}>365</span>
          </p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>
            आज {Math.max(DAILY_LIMIT - usage.usedToday, 0)} free मदद बाकी
          </p>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ background: "#0B0F1A" }}>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors"
              style={
                active
                  ? { background: C.accent, color: C.white, boxShadow: `0 0 10px ${C.accent}66` }
                  : { background: C.card, color: C.textBody, border: `1px solid ${C.cardBorder}` }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2" style={{ background: C.bg, borderBottom: `1px solid ${C.cardBorder}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg"
              style={active ? { color: C.accentGlow, borderBottom: `2px solid ${C.accent}` } : { color: C.textMuted, borderBottom: "2px solid transparent" }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[60vh] flex flex-col">
        {tab === "chat" && <ChatTab category={category} usage={usage} />}
        {tab === "poster" && <PosterTab category={category} usage={usage} />}
        {tab === "ideas" && <IdeasTab category={category} usage={usage} />}
      </div>
    </div>
  );
}
