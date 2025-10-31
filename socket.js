import { WebSocketServer } from 'ws';

let wss;

export const initWebSocket = (httpServer) => {
    if (!wss) {
        wss = new WebSocketServer({ server: httpServer });

        wss.on('connection', (ws) => {
            ws.subscriptions = new Set();
            ws.on('message', (msg) => {
                try {
                    const data = JSON.parse(msg.toString());
                    if (data.subscribe) {
                        ws.subscriptions.add(data.subscribe);
                    } else if (data.unsubscribe) {
                        ws.subscriptions.delete(data.unsubscribe);
                    }
                } catch (err) {
                    console.error("Invalid message from client:", msg.toString());
                }
            });
        });
    }
    return wss;
};

export const broadcast = (type, data) => {
    const message = JSON.stringify({ type, ...data });
    for (const client of wss.clients) {
        if (client.readyState === client.OPEN && client.subscriptions.has(type)) {
            client.send(message);
        }
    }
};
