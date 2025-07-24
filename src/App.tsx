import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import bgImageC from './assets/backgroundC.jpeg';
import bgImage from './assets/background.jpeg';


// Global Styles
const appContainer: React.CSSProperties = {
  height: '100vh',
  width: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f0f2f5',
  backgroundImage: `url(${bgImageC})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: '300% center',
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
};
const wrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '800px',
  height: '90vh',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
};
// Entry Screen
const entryContainer: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundImage: `url(${bgImage})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: '2rem',
  textAlign: 'center',
  marginTop: 0,
  gap: '0.5rem',
};
const titleStyle: React.CSSProperties = { fontSize: '2rem', marginBottom: '1rem' };
const descStyle: React.CSSProperties = { fontSize: '1rem', marginBottom: '1rem', color: '#333' };
const disclaimerStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' };
const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#007bff',
  color: '#fff',
  cursor: 'pointer',
};
// Key Entry & Chat
const headerStyle: React.CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid #e6e6e6',
  fontSize: '1.25rem',
  fontWeight: 600,
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const messagesContainer: React.CSSProperties = {
  flex: 1,
  padding: '1rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  backgroundColor: '#f9f9f9',
};
const inputArea: React.CSSProperties = {
  padding: '1rem',
  borderTop: '1px solid #e6e6e6',
  backgroundColor: '#fff',
  display: 'flex',
  gap: '0.5rem',
};
const textInput: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '1rem',
};
const sendButton: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#007bff',
  color: '#fff',
  fontSize: '1rem',
  cursor: 'pointer',
};
const bubbleStyle = (fromUser: boolean): React.CSSProperties => ({
  maxWidth: '80%',
  alignSelf: fromUser ? 'flex-end' : 'flex-start',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  backgroundColor: fromUser ? '#daf8e3' : '#e2e2e5',
  color: '#000',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
});
const LOCAL_STORAGE_KEY = 'CHATBOT_API_KEY';

type Message = { sender: 'user' | 'bot'; text: string };
type View = 'entry' | 'key' | 'chat';

const App: React.FC = () => {
  const [view, setView] = useState<View>('entry');
  const [apiKey, setApiKey] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load stored key
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) { setApiKey(stored); setView('chat'); }
  }, []);
  // Auto-scroll
  useEffect(() => { if (view==='chat' && containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; }, [messages, view]);

  // Validate API Key
  const validateKey = async (key: string): Promise<boolean> => {
    try {
      const url = key.startsWith('sk-')
        ? 'https://api.openai.com/v1/models'
        : `https://generativelanguage.googleapis.com/v1beta2/models?key=${key}`;
      const res = await fetch(url, key.startsWith('sk-') ? { headers: { Authorization: `Bearer ${key}` } } : {});
      return res.ok;
    } catch {
      return false;
    }
  };

  // Handle Key Entry
  const handleKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!inputValue.trim()) { setErrorMsg("No key? Bold move. Try again."); return; }
    setLoading(true);
    const valid = await validateKey(inputValue.trim());
    setLoading(false);
    if (valid) {
      localStorage.setItem(LOCAL_STORAGE_KEY, inputValue.trim());
      setApiKey(inputValue.trim());
      setView('chat');
      setInputValue('');
    } else {
      setErrorMsg("That key's faker than a three-dollar bill. Give me a real one.");
    }
  };

  // Send Chat Message
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !apiKey) return;
    const userText = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.sender==='user'?'user':'assistant', content: m.text }));
      const systemPrompt = { role:'system', content:'You are RiddleBot, a witty, edgy chatbot fed up with mundane chatter. Ask and solve funny riddles, deliver snark, and keep it playful.' };
      const url = apiKey.startsWith('sk-')
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      const payload = apiKey.startsWith('sk-')
        ? { model:'gpt-3.5-turbo', messages:[systemPrompt,...history,{role:'user',content:userText}] }
        : { model:'gemini-2.5-flash', messages:[systemPrompt,...history,{role:'user',content:userText}] };
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${apiKey}`}, body:JSON.stringify(payload) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error?.message||`HTTP ${res.status}`);
      const content = data.choices?.[0]?.message?.content||'No response.';
      setMessages(prev => [...prev, { sender:'bot', text:content }]);
    } catch(err:any) {
      setMessages(prev => [...prev, { sender:'bot', text:`Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  // Render
  if (view === 'entry') return (
    <div style={appContainer}><div style={wrapper}>
      <div style={entryContainer}>
        <div style={{ width: '100%', marginTop: '1.5rem' }}>
          <h1 style={titleStyle}>🤖 Welcome to RiddleBot!</h1>
          <p style={descStyle}>Brain-twisting riddles, snarky humor, and endless fun.</p>
          <p style={disclaimerStyle}>Disclaimer: Purely for entertainment—no feelings harmed.</p>
          <p style={disclaimerStyle}><em>PS: I couldn’t care less if you’re offended!</em></p>
          <button style={buttonStyle} onClick={() => setView('key')}>Get Started</button>
        </div>
      </div>
    </div></div>
  );

  if (view === 'key') return (
    <div style={appContainer}>
      <div style={wrapper}>
        <form onSubmit={handleKeySubmit} style={entryContainer}>
          <div style={{ width: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>        
            <h2 style={titleStyle}>🔐 API Key Time!</h2>
            <p style={descStyle}>
              Pop in your own API key from OpenAI, Google Gemini, or any other supported provider below.
            </p>
            <input
              type="password"
              placeholder="Your secret API key here"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ ...textInput, maxWidth: 200, width: '100%', margin: '0 auto' }}
            />
            {errorMsg && (
              <div style={{ color: '#c00', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {errorMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                style={{ ...buttonStyle, backgroundColor: '#6c757d', padding: '0.5rem 1.25rem', fontSize: '0.98rem', borderRadius: '4px', minWidth: 90, maxWidth: 110, flex: 'none' }}
                onClick={() => setView('entry')}
                disabled={loading}
              >
                Go Back
              </button>
              <button
                type="submit"
                style={{ ...buttonStyle, padding: '0.5rem 1.25rem', fontSize: '0.98rem', borderRadius: '4px', minWidth: 110, maxWidth: 140, flex: 'none' }}
                disabled={loading}
              >
                {loading ? 'Hunting for key...' : 'Validate & Continue'}
              </button>
              
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={appContainer}><div style={wrapper}>
      <div style={headerStyle}>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('entry')}>🧩 RiddleBot</span>
        <button
          onClick={() => {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setApiKey('');
            setMessages([]);
            setInputValue('');
            setView('key');
          }}
          style={{ ...sendButton, backgroundColor: '#6c757d' }}
        >
          Re-enter API Key
        </button>
      </div>
      <div ref={containerRef} style={messagesContainer}>
        {messages.map((msg, idx) => (
          <div key={idx} style={bubbleStyle(msg.sender === 'user')}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={inputArea}>
        <input type="text" placeholder={loading ? 'Thinking...' : 'Type a riddle or answer…'} disabled={loading} value={inputValue} onChange={e => setInputValue(e.target.value)} style={textInput} />
        <button type="submit" disabled={loading || !inputValue.trim()} style={sendButton}>Send</button>
      </form>
    </div></div>
  );
};

export default App;
