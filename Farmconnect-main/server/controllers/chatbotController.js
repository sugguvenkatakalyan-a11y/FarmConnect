const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// --- NEW: Expanded FAQ Data - The "Brain" of the Chatbot ---
const faqData = `
- **How does ordering work?**
  "You can browse crops on the 'Nearby Crops' tab. Click on a crop to see details, then on the product page, enter a quantity and click 'Add to Cart'. You can view your cart and checkout by clicking the cart icon at the top right."
- **What are the delivery options and times?**
  "We offer home delivery on Wednesdays and Saturdays. Delivery fees can vary based on your distance from the farm. Some farmers may also offer direct farm pickup as an option during checkout."
- **How can I find organic crops?**
  "While many of our partner farmers use sustainable practices, we do not have a specific 'organic' filter right now. We recommend checking the description of each crop for details provided by the farmer."
- **What are the current prices?**
  "You can see the price for each crop listed on its card on the 'Nearby Crops' tab (e.g., ₹50/kg). Prices are set directly by the farmers."
- **What is the return policy?**
  "Due to the perishable nature of fresh produce, we generally do not accept returns. However, if you have an issue with the quality of your order, please contact our support team within 24 hours of delivery, and we will do our best to make it right."
- **How can I contact support?**
  "For any issues or questions not answered here, you can reach our support team by emailing us at support@farmconnect.com."
- **What are the payment options?**
  "We accept all major credit cards, debit cards, and UPI payments through our secure online checkout process."
- **How do I track my order?**
  "You can see the current status of all your orders under the 'My Purchases' tab in your dashboard. The status will update from 'Confirmed' to 'Out for Delivery' and finally 'Delivered'."
`;

// --- Static Farm Data ---
const farmData = `
Our farm is named 'FarmConnect'. We are a platform connecting customers directly with farmers.
Our Mission: To support local agriculture and make fresh food accessible.
`;

// Initialize the Gemini Pro model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const chatWithBot = async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let dynamicContext = farmData;
        
        // Add the new, expanded FAQs to the context
        dynamicContext += `\n\n--- FREQUENTLY ASKED QUESTIONS (FAQs) ---\n${faqData}`;

        // Add Nearby Crop data
        if (context && context.crops && context.crops.length > 0) {
            const simplifiedCrops = context.crops.map(c => ({
                name: c.name,
                price: `₹${c.price}/${c.unit}`,
                stock: c.quantity,
                farmer: c.farmerInfo.name,
                distance: `${c.distance} km`
            }));
            dynamicContext += `\n\n--- LIVE NEARBY CROP DATA ---\nThis is a real-time list of crops available near the user. Use this to answer questions about availability, price, etc.\n${JSON.stringify(simplifiedCrops, null, 2)}`;
        } else {
            dynamicContext += "\n\n--- LIVE NEARBY CROP DATA ---\nNo crops are currently loaded for the user's location. Tell the user to try updating their location.";
        }

        // Add User's Purchase History
        if (context && context.purchases && context.purchases.length > 0) {
            const simplifiedPurchases = context.purchases.map(p => ({
                crop: p.cropName,
                quantity: `${p.quantity} ${p.unit}`,
                price: `₹${p.totalPrice.toFixed(2)}`,
                status: p.status,
                date: new Date(p.createdAt).toLocaleDateString()
            }));
            dynamicContext += `\n\n--- USER'S PERSONAL ORDER HISTORY ---\nThis is the user's specific order history. Use this to answer questions about their past purchases.\n${JSON.stringify(simplifiedPurchases, null, 2)}`;
        } else {
            dynamicContext += "\n\n--- USER'S PERSONAL ORDER HISTORY ---\nThe user has not made any purchases yet.";
        }

        const prompt = `
        You are a friendly and highly capable customer support chatbot for 'FarmConnect', an online farm marketplace.
        Your primary goal is to answer user questions concisely and helpfully based ONLY on the information provided below.
        You have access to: General Info, FAQs, a live list of nearby crops, and the user's personal order history.

        **Instructions:**
        1.  Carefully read the user's question and determine which section of the information is most relevant.
        2.  For general questions, ALWAYS check the "FAQs" section first and use the provided answer.
        3.  If asked about available crops, prices, or stock, use the "LIVE NEARBY CROP DATA". Do not make anything up.
        4.  If asked about a past order or its status, use the "USER'S PERSONAL ORDER HISTORY".
        5.  If the answer cannot be found in any of the provided information, you MUST say: "I'm sorry, I don't have the information to answer that. You can contact our support team at support@farmconnect.com for more help."
        6.  Keep your answers friendly and to the point.

        --- INFORMATION ---
        ${dynamicContext}
        ---

        Now, please answer the following customer question:
        Customer: "${message}"
        Chatbot:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error('Error in chatWithBot controller:', error);
        res.status(500).json({ error: 'Failed to get a response from the chatbot.' });
    }
};

module.exports = { chatWithBot };