import User from './models/user.js';
import Message from './models/message.js';
import Absence from './models/absence.js';
import Attendance from './models/attendance.js';

const models = {
    User,
    Message,
    Absence,
    Attendance
};

// Initialize associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

export { User, Message, Absence, Attendance };
export default models;