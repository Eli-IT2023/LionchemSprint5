const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReceivingProductOrder = sequelize.define("receiving_product_order", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  receiving_id: {
    type: DataTypes.CHAR,
  },
  receiving_history_id: {
    type: DataTypes.CHAR,
  },
  po_vendor_product_id: {
    type: DataTypes.CHAR,
  },
  quantity_received: {
    type: DataTypes.DOUBLE,
  },
  expiry_date: {
    type: DataTypes.DATE,
  },
});

module.exports = ReceivingProductOrder;
