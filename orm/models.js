import sequelize from './database.js';
import User from './models/user.js';
import Message from './models/message.js';

export default {
    sequelize,
    User,
    Message
};