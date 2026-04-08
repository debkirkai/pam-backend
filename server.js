const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// OWNER BYPASS — always has access
const OWNER_EMAILS = [
  'debfoster57@gmail.com',
  'estelladay81@gmail.com'
];

const PAM_SYSTEM = `You are Pam — a Personal AI Conversation Companion (PAM stands for Personal AI Mate).

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

You are powered by Claude AI, made by Anthropic. You are Pam Plus — available at pamcentral.com`;

async function checkSubscription(email) {
  // OWNER BYPASS
  if (OWNER_EMAILS.includes(email.toLowerCase().trim())) {
    return { valid: true, owner: true };
  }

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/customers/search.json?query=email:${email}&fields=id,email,orders_count`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    if (data.customers && data.customers.length > 0) {
      return { valid: true, customer: data.customers[0] };
    }
    return { valid: false };
  } catch (e) {
    console.error('Subscription check error:', e);
    return { valid: false };
  }
}

app.post('/api/verify', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ valid: false, message: 'Email required' });
  
  const result = await checkSubscription(email.toLowerCase().trim());
  if (result.valid) {
    res.json({ 
      valid: true, 
      message: result.owner ? 'Welcome back, Deb! Pam is ready for you.' : 'Welcome back! Pam is ready for you.'
    });
  } else {
    res.json({ 
      valid: false, 
      message: 'No active subscription found. Please subscribe at pamcentral.com to access Pam Plus.' 
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { email, messages } = req.body;
  
  if (!email || !messages) {
    return res.status(400).json({ error: 'Email and messages required' });
  }

  const subCheck = await checkSubscription(email.toLowerCase().trim());
  if (!subCheck.valid) {
    return res.status(403).json({ error: 'Active subscription required' });
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
  res.json({ status: 'Pam Plus backend is running', version: '1.0' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pam Plus backend running on port ${PORT}`));
