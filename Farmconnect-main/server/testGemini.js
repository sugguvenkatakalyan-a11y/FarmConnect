const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Try a supported model

async function testGemini() {
  try {
    const result = await model.generateContent('Hello, test message!');
    const response = await result.response;
    console.log('Response:', response.text());
  } catch (error) {
    console.error('Gemini API error:', error.message, error.stack);
  }
}

testGemini();