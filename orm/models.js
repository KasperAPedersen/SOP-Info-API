import sequelize from './database.js';
import User from './models/user.js';
import Message from './models/message.js';
import Absence from './models/absence.js';

export default {
    sequelize,
    User,
    Message,
    Absence
};