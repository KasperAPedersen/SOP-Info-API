import Express from 'express';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';

import UserRoute from './routes/userRoute.js';
import MessageRoute from './routes/messageRoute.js';
import AbsenceRoute from './routes/absenceRoute.js';

const app = Express();

app.use(Express.json());
app.use(morgan("dev"));

app.use('/user', UserRoute);
app.use('/message', MessageRoute);
app.use('/absence', AbsenceRoute);

const server = app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000 on all interfaces')
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('WebSocket client disconnected');
    });
});

function broadcastMessage(message) {
    const data = JSON.stringify(message);
    for (const client of clients) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    }
}

setInterval(() => {
    const message = {
        id: Math.floor(Math.random() * 1000),
        author: 'user1',
        title: 'Hello',
        message: 'This is a live message',
        timestamp: new Date().toISOString()
    };
    broadcastMessage(message);
    console.log('Sent message via WebSocket:', message);
}, 10000);