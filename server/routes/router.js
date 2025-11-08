import express from 'express';
import ImageKit from 'imagekit';
import { promises as fs } from 'fs';

import {generatefiles} from '../models/helpfunctions.js';
const router = express.Router();

import { AzureOpenAI } from "openai";


// Chat Route
let userMessages = "these are the user messages history do not include in  your response, make sure respond to latest user request\n";
let botMessages = "these are the bot messages history do not include in  your response\n";
router.post('/chat-deepseek',  async (req, res) => {
    const { message } = req.body;
    userMessages += "user request: " + message + "\n";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
          "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-r1:free",
          "messages": [{"role": "user","content": message}
                    //    {"role": "assistant","content": botMessages},
            
          ]
        })
    
      });
    
    const data = await response.json();
    const botResponse = data.choices[0].message.content || "no response";
    botMessages += "bot response: " + botResponse + "\n";
    res.json({ data: botResponse });

}
);


// Message Route
router.post('/image', async (req, res) => {

    const {message, imageUrl} = req.body;
    console.log(req.body);
    userMessages += "user request: " + message + "\n";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
          "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-4-scout:free",
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": message
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": imageUrl
                  }
                }
              ]
            }
          ]
        })
      });
    
    const data = await response.json();
    const botResponse = data.choices[0].message.content || "no response";
    res.json({ data: botResponse });
});


const endpoint = "https://openairesourcefirst.openai.azure.com/";
const modelName = "gpt-4o-mini";
const deployment = "gpt-4o-mini";

const apiKey = "ChISMFCwOIJLzxKslNVVm2Cm3ESE21HlsKikodBOVkPSGcekGfWoJQQJ99BDACfhMk5XJ3w3AAABACOG2pdA";
const apiVersion = "2024-04-01-preview";
const options = { endpoint, apiKey, deployment, apiVersion }
router.post('/message', async (req, res) => {
    const { message } = req.body;
    userMessages += "user request: " + message + "\n";
    const client = new AzureOpenAI(options);
    const data = await fs.readFile("routes/Programvaruarthitecture.txt", 'utf8');
    console.log(userMessages);
    const response = await client.chat.completions.create({
        messages: [
            { role:"system", content: botMessages },
            { role:"system", content: data },
            { role:"user", content:  userMessages },

        ],
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        model: modelName
    });
    if (response?.error !== undefined && response.status !== "200") {
        throw response.error;
    }
    let responseText = "";
    for (const choice of response.choices) {
        responseText += choice.message.content;
    }
    botMessages += "bot response: " + responseText + "\n";
    res.json({ data: responseText });

});

let userMessage = "these are the user messages history do not include in  your response, make sure respond to latest user request\n";  // the length of this string is 
let botMessage = "these are the bot messages history do not include in  your response\n";
router.post('/chat', async (req, res) => {
    const { message } = req.body;
    userMessage += "user request: " + message + "\n";
    if (userMessage.length === 182) {
      userMessage += `This is the first message from the user. 
      Please respond with a JSON object that outlines the initial project structure with neccessery files and it's content. 
      Make sure the JSON is properly formatted and complete.`;
          }
    const client = new AzureOpenAI(options);
    const response = await client.chat.completions.create({
        messages: [
            { role:"system", content: "You are a professional programmer" },
            { role:"user", content: userMessage },
            { role:"assistant", content: botMessage },

        ],
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        model: modelName
    });
    if (response?.error !== undefined && response.status !== "200") {
        throw response.error;
    }
    let responseText = "";
    for (const choice of response.choices) {
        responseText += choice.message.content;
    }
    botMessage += "bot response: " + responseText + "\n";

    if (responseText.includes("```json")) {
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "");
        responseText = JSON.parse(responseText);
        fs.writeFile('response.json', JSON.stringify(responseText, null, 2), (err) => {
            if (err) throw err;
        });
    }
    // stringify the responseText
    // responseText = JSON.stringify(responseText, null, 2);
    // generatefiles();
    res.json({ data: responseText });

});


const imagekit = new ImageKit({
    publicKey: "public_vIIUYDN3TgSfgAxlE+gUi/cjQXE=",
    privateKey: "private_NeC2inSMuF5vP84h7YMV7vPGTbw=", // Make sure to replace with your actual private key
    urlEndpoint: "https://ik.imagekit.io/fxjzsfork"
});
// Authentication Route
router.get('/auth', async (req, res) => {
    try {
        const token = imagekit.getAuthenticationParameters();
        res.status(200).json(token);
    } catch (error) {
        console.error('Error generating authentication token:', error);
        res.status(500).json({ error: 'Failed to generate authentication token.' });
    }
});


export default router;
