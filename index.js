import express from "express";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const port = 3000;


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Serve static files
app.use(express.static("public"));

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Create a WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      const { content } = parsedMessage;

      if (!content) {
        ws.send(JSON.stringify({ error: "Invalid input. 'content' is required." }));
        return;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      });

      const response = completion.choices[0].message.content;

      // Send the response back to the client
      ws.send(JSON.stringify({ response }));
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ error: "An error occurred while processing your request." }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
