import { WebSocketServer } from 'ws';

let wss; // singleton WebSocket server
const clients = new Set();

// Initialize WebSocket server
export const initWebSocket = (httpServer) => {
    if (!wss) {
        wss = new WebSocketServer({ server: httpServer });
        wss.on('connection', (ws) => {
            console.log('Client connected');
            clients.add(ws);

            ws.on('close', () => {
                clients.delete(ws);
                console.log('Client disconnected');
            });
        });
    }
    return wss;
};

// Broadcast a message to all connected clients
export const broadcast = (data) => {
    const message = JSON.stringify(data);
    for (const client of clients) {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    }
};