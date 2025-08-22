const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnProduct = sequelize.define("return_product", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type: DataTypes.STRING,
  },
  return_product_code: {
    type: DataTypes.STRING,
  },

  total_quantity: {
    type: DataTypes.DOUBLE,
  },
  move_to: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.CHAR,
  },
});

module.exports = ReturnProduct;
