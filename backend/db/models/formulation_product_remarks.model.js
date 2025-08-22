const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const FormulationProductRemarks = sequelize.define(
  "formulation_product_remarks",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },

    product_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    },

    remarks: {
      type: DataTypes.TEXT,
    },

    createdBy: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    },
    isDeleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }
);

module.exports = FormulationProductRemarks;
