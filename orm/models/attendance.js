import {DataTypes} from 'sequelize';
import sequelize from '../database.js';

let Attendance = sequelize.define('attendance', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('present', 'not present'),
        defaultValue: 'not present'
    }
}, {
    tableName: 'attendance',
    timestamps: true
});

Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
};

export default Attendance;
