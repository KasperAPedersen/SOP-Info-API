import {DataTypes} from 'sequelize';
import sequelize from '../database.js';

let User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    consent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    firstLogin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'user',
    timestamps: false
});

User.associate = (models) => {
    User.hasMany(models.Absence, {
        foreignKey: 'userId'
    });
};

export default User;
