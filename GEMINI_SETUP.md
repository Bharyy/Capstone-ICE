# Gemini Integration Setup

## Quick Start

1. **Get your Gemini API key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key

2. **Configure environment variable:**
   - Open `.env` file in project root
   - Replace `your_api_key_here` with your actual API key:
     ```
     VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
     ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Model Status

| Model    | Status        | Response Type          |
|----------|--------------|------------------------|
| Gemini   | ✅ Working    | Real API responses     |
| GPT-4    | ⏳ Placeholder | Static message         |
| Claude   | ⏳ Placeholder | Static message         |
| Llama 2  | ⏳ Placeholder | Static message         |

## How It Works

### 1. Parallel Execution
When you send a message with multiple models selected:
```javascript
// All models called simultaneously
Promise.all([
  getModelResponse('Gemini', userInput),
  getModelResponse('GPT-4', userInput),
  getModelResponse('Claude', userInput)
])
```

### 2. Model Router Function
```javascript
async function getModelResponse(modelName, userInput) {
  switch (modelName) {
    case 'Gemini':
      return await callGemini(userInput)  // Real API call
    
    case 'GPT-4':
    case 'Claude':
    case 'Llama 2':
      return 'Thank you for asking. This model is not operational yet.'
    
    default:
      return 'Unknown model selected.'
  }
}
```

### 3. Adding New Models

To add a real integration for GPT-4, Claude, or Llama 2:

1. Add API call function (similar to `callGemini`)
2. Update the switch statement in `getModelResponse`
3. Add environment variable for the API key

Example for GPT-4:
```javascript
async function callGPT4(prompt) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
}

// Then update getModelResponse:
case 'GPT-4':
  return await callGPT4(userInput)
```

## Security Notes

⚠️ **Current Implementation (Demo Only):**
- API key stored in `.env` file
- Direct API calls from frontend
- API key exposed in browser network requests

🔒 **Production Requirements:**
- Move all API calls to backend server
- Implement authentication
- Add rate limiting
- Use server-side environment variables
- Never expose API keys to frontend

## Response Format

Each model response includes:
- `model`: Model name (e.g., "Gemini")
- `content`: Response text
- `timestamp`: Message timestamp
- `role`: "assistant"

The existing UI automatically handles multi-column layout based on the number of responses.
