import { WebSocketServer } from 'ws';

let wss;

export const initWebSocket = (httpServer) => {
    if (!wss) {
        wss = new WebSocketServer({ server: httpServer });

        wss.on('connection', (ws) => {
            console.log('Client connected');

            // Initialize client subscriptions
            ws.subscriptions = new Set();

            // Listen for subscription messages
            ws.on('message', (msg) => {
                try {
                    const data = JSON.parse(msg.toString());
                    if (data.subscribe) {
                        ws.subscriptions.add(data.subscribe); // e.g., "message" or "absence"
                        console.log(`Client subscribed to ${data.subscribe}`);
                    } else if (data.unsubscribe) {
                        ws.subscriptions.delete(data.unsubscribe);
                        console.log(`Client unsubscribed from ${data.unsubscribe}`);
                    }
                } catch (err) {
                    console.error("Invalid message from client:", msg.toString());
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }
    return wss;
};

// Broadcast to clients subscribed to a certain type
export const broadcast = (type, data) => {
    const message = JSON.stringify({ type, ...data });
    for (const client of wss.clients) {
        if (client.readyState === client.OPEN && client.subscriptions.has(type)) {
            client.send(message);
        }
    }
};
