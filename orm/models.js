import User from './models/user.js';
import Message from './models/message.js';
import Absence from './models/absence.js';
import Attendence from './models/attendence.js';

const models = {
    User,
    Message,
    Absence,
    Attendence
};

// Initialize associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

export { User, Message, Absence, Attendence };
export default models;