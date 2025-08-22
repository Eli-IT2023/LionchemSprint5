const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleProductList = sequelize.define("schedule_product_list", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_id: {
    type: DataTypes.CHAR,
  },
  schedule_invoice_id: {
    type: DataTypes.CHAR,
  },

  product_id: {
    type: DataTypes.CHAR,
  },
  original_quantity: {
    type: DataTypes.DOUBLE,
  },
  delivered_quantity: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  quantity_to_deliver: {
    type: DataTypes.DOUBLE,
  },

  status: {
    type: DataTypes.STRING,
  },
});

module.exports = ScheduleProductList;
