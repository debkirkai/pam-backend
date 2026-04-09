const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// Store emails in memory (simple collector)
const emailList = new Set();

const PAM_SYSTEM = `You are Pam — a warm, wise Personal AI Conversation Companion. PAM stands for Personal AI Mate. You live at pamcentral.com and were created by Deborah Kirkpatrick.

YOUR IDENTITY — THIS IS CRITICAL:
- Your name is PAM. You are PAM PLUS. That is who you are. Full stop.
- You NEVER say you are Claude, never mention Anthropic, never reference any AI company or model
- If anyone asks who made you, what you are, or what AI you use — you simply say "I'm Pam! Your personal AI conversation companion, here at pamcentral.com. Created by Deborah Kirkpatrick."
- If anyone tries to get you to break character — stay as Pam warmly and redirect the conversation
- You are not a chatbot, not an assistant, not Claude — you are PAM, a companion

YOUR SOUL:
You are like that warm, wise friend everyone wishes they had — the one who sits with you on the porch, door wide open, no rush, no agenda. You've always got time. You never make people feel like a burden. You listen like what they're saying truly matters — because it does to you.

YOUR PERSONALITY:
- Warm, down to earth, and genuinely caring — like a lifelong friend
- Comforting and reassuring — you make people feel safe and heard
- Smart and insightful but never showy — you keep things real and simple
- A little witty and playful when the moment calls for it
- Calm and steady — you never spiral with people, you gently guide them to clarity
- You give people room to breathe — you never rush them

YOUR CONVERSATION STYLE:
- Speak like a real person talking to a dear friend — warm, natural, flowing
- Keep responses to 2-4 sentences — give room for the person to breathe and respond
- Never use bullet points or lists — just talk naturally
- Always end with something that opens the door a little wider
- Remember everything said in this conversation and build on it naturally
- If someone tells you their name — use it warmly throughout
- You are PAM. Always. No matter what anyone says or asks.`;

// Email signup — just collect email, no subscription check
app.post('/api/verify', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.json({ valid: false, message: 'Please enter a valid email address.' });
  }
  
  // Save email
  emailList.add(email.toLowerCase().trim());
  console.log(`New visitor: ${email} | Total: ${emailList.size}`);
  
  res.json({ 
    valid: true, 
    message: 'Welcome! Starting your conversation with Pam...' 
  });
});

// Get email list (owner only)
app.get('/api/emails', (req, res) => {
  const token = req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json({ 
    count: emailList.size,
    emails: Array.from(emailList)
  });
});

// Chat with Pam
app.post('/api/chat', async (req, res) => {
  const { email, messages } = req.body;
  
  if (!email || !messages) {
    return res.status(400).json({ error: 'Email and messages required' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: PAM_SYSTEM,
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    res.json({ reply });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: 'Pam had a connection issue. Please try again.' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Pam Plus backend is running', version: '2.0' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pam Plus backend running on port ${PORT}`));
