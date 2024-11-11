// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentPage = 1;  // Track current page of the PDF
let adminClient = null;  // Track the admin client (the presenter)

// Serve static files from the "public" directory
app.use(express.static("public"));

// Handle WebSocket connections
wss.on("connection", (ws) => {
    console.log("New client connected");

    // Send current page to the new client
    ws.send(JSON.stringify({ type: "syncPage", page: currentPage }));

    // Handle messages from clients
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.type === "changePage") {
            if (ws === adminClient) {
                currentPage = data.page;
                // Broadcast new page to all clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "syncPage", page: currentPage }));
                    }
                });
            }
        } else if (data.type === "admin") {
            adminClient = ws;
        }
    });

    // Handle client disconnect
    ws.on("close", () => {
        console.log("Client disconnected");
        if (ws === adminClient) {
            adminClient = null;  // Clear admin if admin client disconnected
        }
    });
});

// Start the server
server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
