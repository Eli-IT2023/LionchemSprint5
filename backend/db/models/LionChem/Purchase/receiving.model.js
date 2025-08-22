const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Receiving = sequelize.define("receiving", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  po_id: {
    type: DataTypes.CHAR,
  },
  status: {
    type: DataTypes.STRING,
  },
  rejectedBy: {
    type: DataTypes.CHAR,
  },
  rejectRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = Receiving;
