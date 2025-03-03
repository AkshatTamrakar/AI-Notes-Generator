const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // or gemini-1.0-pro

app.use(bodyParser.json());

// Serve index.html from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate-notes', async (req, res) => {
    const { subject, gradeLevel, topic } = req.body;

    if (!subject || !gradeLevel || !topic) {
        return res.status(400).json({ error: 'Subject, grade level, and topic are required.' });
    }

    const prompt = `Generate detailed notes on ${topic} for ${gradeLevel} ${subject} students.`;

    try {
        const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] });
        const generatedNotes = result.response.candidates[0].content.parts[0].text.trim();
        res.json({ notes: generatedNotes });
    } catch (error) {
        console.error('Error generating notes:', error);
        if (error.response && error.response.candidates && error.response.candidates[0] && error.response.candidates[0].content && error.response.candidates[0].content.parts && error.response.candidates[0].content.parts[0].text){
            console.log("Gemini API error", error.response.candidates[0].content.parts[0].text);
            res.status(500).json({ error: "Gemini API Error" });
        } else {
            res.status(500).json({ error: 'Failed to generate notes.' });
        }
    }
});

app.get('/list-models', async (req, res) => {
    try {
        const models = await genAI.getAvailableModels();
        res.json({ models });
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to list models.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});