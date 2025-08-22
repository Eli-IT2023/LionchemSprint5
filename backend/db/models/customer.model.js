const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Customer = sequelize.define("customer", {
  customer_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  type: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.BOOLEAN,
  },
  company_name: {
    type: DataTypes.STRING,
  },
  company_nature: {
    type: DataTypes.STRING,
  },
  company_email: {
    type: DataTypes.STRING,
  },
  company_address: {
    type: DataTypes.STRING,
  },
  country: {
    type: DataTypes.STRING,
  },
  mobile_no: {
    type: DataTypes.STRING,
  },
  telephone_no: {
    type: DataTypes.STRING,
  },
  tin: {
    type: DataTypes.STRING,
  },
});

module.exports = Customer;
