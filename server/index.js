// 1. Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. Setup Express App
const app = express();
const PORT = 3000;

// 3. Setup Middleware
app.use(cors());
app.use(express.json());

// --- AI INITIALIZATION WITH ERROR CHECKING ---
let model;
try {
    // This line might fail if the API key is missing or wrong
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Successfully initialized Gemini AI model.");
} catch (error) {
    console.error("\n❌❌❌ CRITICAL ERROR INITIALIZING GEMINI AI ❌❌❌");
    console.error("This is likely due to a missing or incorrect GEMINI_API_KEY in your .env file.");
    console.error("Please check your .env file and ensure the API key is correct.\n");
    console.error("Error Details:", error.message);
    process.exit(1); // This will stop the server with a clear error.
}
// --- END OF BLOCK ---

// 5. Create the API Endpoint
app.post('/api/get-advice', async (req, res) => {
    try {
        const { query, crop, district, season, language } = req.body;
        console.log("Received Query:", query);

        const prompt = `
            You are an expert agriculture advisor for Kerala, India, named "Digital Krishi Officer".
            A farmer has a question. Respond in a helpful, clear, and simple manner.
            The response MUST be formatted in HTML. Use <p>, <ul>, <li>, and <strong> tags for good formatting.
            The farmer's preferred language is ${language}. Respond ONLY in that language.

            Here is the farmer's query and context:
            - Question: "${query}"
            - Crop: ${crop || 'Not specified'}
            - District: ${district || 'Not specified'}
            - Season: ${season || 'Not specified'}

            Provide a practical, step-by-step solution. If it's about a pest or disease, suggest specific, commonly available treatments (organic and chemical) and preventive measures.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiAnswer = response.text();

        res.json({ answer: aiAnswer });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ answer: "<p>Sorry, I encountered an error. Please try again.</p>" });
    }
});

// 8. Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

