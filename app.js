import Express from 'express';
import UserRoute from './routes/userRoute.js';

const app = Express();

app.use(Express.json());

app.use('/users', UserRoute);

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000 on all interfaces')
});

