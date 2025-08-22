const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleInvoiceList = sequelize.define("schedule_invoice_list", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_id: {
    type: DataTypes.CHAR(36),
  },
  batch_entry_id: {
    type: DataTypes.CHAR(36),
  },
  sales_invoice_id: {
    type: DataTypes.CHAR(36),
  },
  quantity: {
    type: DataTypes.DOUBLE,
  },
  delivered_quantity: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  oredered_quantity: {
    type: DataTypes.DOUBLE,
  },

  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = ScheduleInvoiceList;
