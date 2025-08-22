const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryReprint = sequelize.define("batch_entry_tag_reprint", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  batch_entry_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  requestor: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id foreign key",
  },
  approver: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id foreign key",
  },
  date_requested: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  date_approved: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = BatchEntryReprint;
