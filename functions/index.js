/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// server.js
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const app = express();
const port = 3000;

// --- Configuration ---
const apiKey = "AIzaSyDOYpZZcK5ZAda61h97mhQ9nbA1Hs7nUdA";
if (!apiKey) {
    console.error("\nFATAL ERROR: GEMINI_API_KEY not found. Create a .env file with GEMINI_API_KEY=YOUR_API_KEY");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// --- MODEL CONFIGURATION (Define Safety Settings) ---
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Define the model instance WITH safety settings
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    safetySettings,
});

// --- Middleware ---
app.use(express.json()); // Needed to parse JSON request bodies
app.use(express.static(path.join(__dirname))); // Serve static files (HTML, CSS, JS)

// --- Routes ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve login page
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html')); // Serve dashboard
});

// --- API Endpoint for Feeling Suggestions ---
app.post('/api/get-suggestion', async (req, res) => {
    const userFeeling = req.body.feeling;
    if (!userFeeling) {
        return res.status(400).json({ message: "Feeling description ('feeling' field) is required." });
    }
    // Keep prompt concise and focused
    const prompt = `User feels: "${userFeeling}". Give one short (1-2 sentences), actionable, positive suggestion. Simple language. No intro. Example: Take 3 deep breaths.`;
    console.log(`[Server] Received feeling: "${userFeeling}". Generating suggestion...`);
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestionText = response.text()?.trim();

        if (response.promptFeedback?.blockReason) {
            console.warn(`[Server] Suggestion blocked: ${response.promptFeedback.blockReason}`);
            return res.status(400).json({ message: `Suggestion blocked due to safety settings (${response.promptFeedback.blockReason}). Please rephrase.` });
        }
        if (!suggestionText) {
             console.error("[Server] Gemini returned empty suggestion.");
             return res.status(500).json({ message: "AI failed to generate suggestion." });
        }

        console.log(`[Server] Generated suggestion: "${suggestionText}"`);
        res.status(200).json({ suggestion: suggestionText });
    } catch (error) {
        console.error("[Server] Error calling Gemini API for suggestion:", error);
        res.status(500).json({ message: "Failed to get suggestion.", details: error.message });
    }
});

// --- API Endpoint for Motivation ---
app.get('/api/get-motivation', async (req, res) => {
    const prompt = `Generate one short (1-2 sentences), inspiring, universally applicable motivational quote or statement. Concise, positive. No complex language or specific references.`;
    console.log("[Server] Generating motivation quote...");
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const quoteText = response.text()?.trim();

        if (response.promptFeedback?.blockReason) {
             console.warn(`[Server] Motivation blocked: ${response.promptFeedback.blockReason}`);
             return res.status(400).json({ message: `Motivation blocked due to safety settings (${response.promptFeedback.blockReason}).` });
        }
        if (!quoteText) {
             console.error("[Server] Gemini returned empty motivation.");
             return res.status(500).json({ message: "AI failed to generate motivation." });
        }

        console.log(`[Server] Generated motivation: "${quoteText}"`);
        res.status(200).json({ motivation: quoteText });
    } catch (error) {
        console.error("[Server] Error calling Gemini API for motivation:", error);
        res.status(500).json({ message: "Failed to get motivation.", details: error.message });
    }
});

// --- ****** NEW: API Endpoint for AI Habit Coach Chat ****** ---
app.post('/api/ai-coach-chat', async (req, res) => {
    const userMessage = req.body.message;
    // Optional: Could include chat history here for better context in future iterations
    // const chatHistory = req.body.history || [];

    if (!userMessage) {
        return res.status(400).json({ message: "User message ('message' field) is required." });
    }

    // --- Construct the Prompt for the AI Coach ---
    // This prompt defines the AI's role, desired tone, and response guidelines.
    const prompt = `You are a friendly and supportive AI Habit Coach in a mobile app. Your goal is to help users build positive habits and stay motivated. Respond concisely (1-3 sentences) and conversationally.

    Instructions:
    - If the user states a goal (e.g., "I want more energy", "suggest a habit for stress relief", "help me be more productive"), suggest ONE simple, actionable habit related to it. Briefly explain why it helps (1 sentence benefit). Example Habit: "Try 5 minutes of stretching when you wake up. It can boost circulation."
    - If the user expresses difficulty, lack of motivation, or feeling stuck (e.g., "I have no motivation", "finding it hard", "failed today"), VALIDATE their feeling briefly, offer encouragement, and provide ONE simple motivational tip or reframing idea. Example Tip: "It's okay to have off days! Maybe start with just 2 minutes tomorrow? Small steps count."
    - If the user asks a general question about habits (e.g., "how long to form a habit?"), provide a concise, general answer.
    - If the user just says hello or makes small talk, respond politely and briefly, perhaps asking how you can help with their habits today.
    - Keep responses focused and avoid asking open-ended questions back unless absolutely necessary for clarification. Do not introduce yourself ("I am an AI...") repeatedly. Just respond directly to the user.

    User's message: "${userMessage}"

    Your helpful and concise response:`; // Ensure the prompt ends clearly indicating where the AI's response should go.

    console.log(`[Server] Received AI Coach message: "${userMessage}". Generating response...`);

    try {
        // Generate Content with Gemini using the constructed prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiReply = response.text()?.trim();

        // Handle potential safety blocks first
        if (response.promptFeedback?.blockReason) {
            console.warn(`[Server] AI Coach response blocked: ${response.promptFeedback.blockReason}`);
            // Provide a specific, user-friendly message for blocked content
            return res.status(400).json({ reply: `I cannot respond to that due to safety guidelines (${response.promptFeedback.blockReason}). Could you please rephrase your message or ask something else?` });
        }

        // Handle empty or undefined responses after checking blocks
        if (!aiReply) {
            console.error("[Server] Gemini returned an empty response for AI coach.");
            return res.status(500).json({ message: "AI failed to generate a response." });
        }

        console.log(`[Server] Generated AI Coach reply: "${aiReply}"`);
        // Send the successful reply back to the frontend
        res.status(200).json({ reply: aiReply });

    } catch (error) {
        console.error("[Server] Error calling Gemini API for AI Coach chat:", error);
        // Provide a generic error message for other failures
        res.status(500).json({ message: "Failed to get response from AI Coach.", details: error.message });
    }
});
// --- ****** END NEW AI Endpoint ****** ---



// --- Optional: Basic catch-all for 404s ---
app.use((req, res) => {
    console.warn(`[Server] 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).send("Sorry, the requested resource was not found on this server.");
});

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.app = onRequest(app);
