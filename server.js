require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function validateEnvironment() {
  const required = ['OPENAI_API_KEY', 'SLACK_SIGNING_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing.join(', '));
    process.exit(1);
  }
}

async function reviseText(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional editor. Revise the following text for improved grammar, clarity, and tone. Return only the revised text without any explanations or additional comments.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error('Failed to revise text');
  }
}

app.post('/slack/revise', async (req, res) => {
  try {
    const { text, user_name, channel_name } = req.body;

    if (!text || text.trim().length === 0) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide text to revise. Usage: `/revise [your text here]`'
      });
    }

    res.json({
      response_type: 'in_channel',
      text: 'Revising your text... :wheelchair:'
    });

    try {
      const revisedText = await reviseText(text);
      
      console.log(`Revision request from ${user_name} in #${channel_name}`);
      console.log(`Original: ${text}`);
      console.log(`Revised: ${revisedText}`);

      const followUpResponse = {
        response_type: 'in_channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Original:* ${text}\n\n*Revised:* ${revisedText}`
            }
          },
        ]
      };

      if (req.body.response_url) {
        await axios.post(req.body.response_url, followUpResponse);
      }

    } catch (error) {
      const errorResponse = {
        response_type: 'ephemeral',
        text: 'Sorry, I encountered an error while revising your text. Please try again.'
      };

      if (req.body.response_url) {
        await axios.post(req.body.response_url, errorResponse);
      }
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      response_type: 'ephemeral',
      text: 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  validateEnvironment();
  console.log(`Grammar Wheelchair server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/slack/revise`);
});