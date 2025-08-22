const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Finish_Parameter = sequelize.define("finish_parameter", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  finish_product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
    comment: "Finish Product ID",
  },
  parameter_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  uom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = Finish_Parameter;
