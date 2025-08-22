const express = require("express");
const { Op, Sequelize, col, literal } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Activity_Log,
  PurchaseRequest,
  PurchaseRequestOrderItem,
  TaxSettings,
  PurchaseOrder,
  PurchaseOrderVendorProduct,
  Receiving,
  Packaging,
  ReceivingHistory,
  ReceivingProductOrder,
  CompanyProfile,
  BatchEntryInvoice,
  SalesInvoice,
  Customer,
  BatchEntryMain,
  PostProduction,
  SalesInvoiceTagProduct,
  ScheduleModel,
  ScheduleInvoiceList,
  ScheduleProductList,
  ScheduleDeliver,
  ReturnProduct,
  ReturnProductList,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment-timezone");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// fetch schedule list with pagination
router.route("/fetchScheduleList").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("This is the route");
    const { count, rows } = await ScheduleProductList.findAndCountAll({
      include: [
        {
          model: ProductList,
          as: "schedule_product_list_product_id", // make sure this alias is also correct
        },
        {
          model: SalesInvoice,
          as: "spl_schedule_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
        {
          model: ScheduleModel,
          as: "spl_schedule_id",
          where: {
            status: {
              [Op.in]: ["Completed", "Partial-Deliver"], // only include schedules with valid status
            },
          },
          required: true, // ensures inner join (excludes null schedules)
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
      logging: console.log, // optional: helps you debug the SQL
    });

    const data = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Add this new route to your backend
router.route("/fetchSelectedSchedules").get(async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];

    if (ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const schedules = await ScheduleProductList.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      include: [
        {
          model: ProductList,
          as: "schedule_product_list_product_id",
        },
        {
          model: SalesInvoice,
          as: "spl_schedule_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
        {
          model: ScheduleModel,
          as: "spl_schedule_id",
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const data = schedules.map((schedule) => schedule.get({ plain: true }));

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching selected schedules:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// const createReturnProduct = await ReturnProduct.create(
//   {
//     return_product_code: returnId,
//     title: returnName,
//     move_to: moveTo,
//     total_quantity: totalQuantity,
//     remarks: remarks,
//   },
//   { transaction }
// );

// create return
// router.route("/create").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     console.log("Received return data:", req.body);
//     const {
//       returnId,
//       returnName,
//       moveTo,
//       totalQuantity,
//       remarks,
//       userLogged,
//       items,
//     } = req.body;

//     const groupedKeys = new Set();
//     const scheduleIds = new Set();

//     // 1. Update ScheduleProductList
//     for (const item of items) {
//       const { scheduleProductListId, returnQuantity } = item;

//       const scheduleProduct = await ScheduleProductList.findOne({
//         where: { id: scheduleProductListId },
//         transaction,
//       });

//       if (!scheduleProduct) {
//         throw new Error(
//           `ScheduleProductList with id ${scheduleProductListId} not found`
//         );
//       }

//       const newOriginalQty =
//         (scheduleProduct.original_quantity || 0) - returnQuantity;

//       await ScheduleProductList.update(
//         {
//           original_quantity: newOriginalQty,
//           quantity_to_return: returnQuantity,
//         },
//         {
//           where: { id: scheduleProductListId },
//           transaction,
//         }
//       );

//       // Combine full UUIDs using a custom delimiter
//       const key = `${scheduleProduct.schedule_id}|${scheduleProduct.schedule_invoice_id}`;
//       groupedKeys.add(key);
//       scheduleIds.add(scheduleProduct.schedule_id);
//     }

//     console.log("Grouped Keys:", [...groupedKeys]);

//     // 2. Update ScheduleInvoiceList based on updated ScheduleProductList aggregates
//     for (const key of groupedKeys) {
//       const [schedule_id, sales_invoice_id] = key.split("|");

//       console.log("Processing aggregate for:", {
//         schedule_id,
//         sales_invoice_id,
//       });

//       const aggregates = await ScheduleProductList.findAll({
//         where: {
//           schedule_id,
//           schedule_invoice_id: sales_invoice_id,
//         },
//         attributes: [
//           [
//             sequelize.fn("SUM", sequelize.col("original_quantity")),
//             "totalOriginalQty",
//           ],
//           [
//             sequelize.fn("SUM", sequelize.col("quantity_to_return")),
//             "totalReturnQty",
//           ],
//         ],
//         raw: true,
//         transaction,
//       });

//       const totalOriginalQty = parseInt(aggregates[0].totalOriginalQty) || 0;
//       const totalReturnQty = parseInt(aggregates[0].totalReturnQty) || 0;

//       console.log("Aggregate result:", aggregates[0]);

//       await ScheduleInvoiceList.update(
//         {
//           oredered_quantity: totalOriginalQty,
//           quantity_to_return: totalReturnQty,
//         },
//         {
//           where: {
//             schedule_id,
//             sales_invoice_id,
//           },
//           transaction,
//         }
//       );
//     }

//     // 3. Update ScheduleModel.quantity_to_return from ScheduleInvoiceList aggregates
//     for (const scheduleId of scheduleIds) {
//       const totalReturnQtyAggregate = await ScheduleInvoiceList.findAll({
//         where: { schedule_id: scheduleId },
//         attributes: [
//           [
//             sequelize.fn("SUM", sequelize.col("quantity_to_return")),
//             "totalReturnQty",
//           ],
//         ],
//         raw: true,
//         transaction,
//       });

//       const totalReturnQty =
//         parseInt(totalReturnQtyAggregate[0].totalReturnQty) || 0;

//       await ScheduleModel.update(
//         {
//           quantity_to_return: totalReturnQty,
//         },
//         {
//           where: { id: scheduleId },
//           transaction,
//         }
//       );
//     }

//     // 4. Create ReturnProduct record
//     const addReturnProduct = await ReturnProduct.create(
//       {
//         return_product_code: returnId,
//         title: returnName,
//         move_to: moveTo,
//         total_quantity: totalQuantity,
//         status: "To Review",
//         remarks,
//         createdBy: userLogged,
//       },
//       { transaction }
//     );

//     // 5. Create ReturnProductList records
//     for (const item of items) {
//       const { scheduleProductListId, returnQuantity } = item;

//       const fetchScheduleProductList = await ScheduleProductList.findOne({
//         where: { id: scheduleProductListId },
//         transaction,
//       });

//       await ReturnProductList.create(
//         {
//           return_product_id: addReturnProduct.id,
//           schedule_product_list_id: scheduleProductListId,
//           original_quantity: fetchScheduleProductList.original_quantity,
//           return_quantity: returnQuantity,
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();

//     res.status(200).json({
//       success: true,
//       message: "Return product created successfully",
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error creating return product:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create return product",
//       error: error.message,
//     });
//   }
// });

router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Received return data:", req.body);
    const {
      returnId,
      returnName,
      moveTo,
      totalQuantity,
      remarks,
      userLogged,
      items,
    } = req.body;

    const addReturnProduct = await ReturnProduct.create(
      {
        return_product_code: returnId,
        title: returnName,
        move_to: moveTo,
        total_quantity: totalQuantity,
        status: "To Review",
        remarks,
        createdBy: userLogged,
      },
      { transaction }
    );

    const uniqueScheduleCombos = new Set();

    for (const item of items) {
      const { scheduleProductListId, returnQuantity } = item;

      const fetchScheduleProductList = await ScheduleProductList.findOne({
        where: { id: scheduleProductListId },
        attributes: ["schedule_id", "schedule_invoice_id", "original_quantity"],
        transaction,
      });

      await ReturnProductList.create(
        {
          return_product_id: addReturnProduct.id,
          schedule_product_list_id: scheduleProductListId,
          original_quantity: fetchScheduleProductList.original_quantity,
          return_quantity: returnQuantity,
        },
        { transaction }
      );

      const newOriginalQty =
        fetchScheduleProductList.original_quantity - returnQuantity;

      await ScheduleProductList.update(
        { original_quantity: newOriginalQty },
        { where: { id: scheduleProductListId }, transaction }
      );

      const comboKey = `${fetchScheduleProductList.schedule_id}|${fetchScheduleProductList.schedule_invoice_id}`;
      uniqueScheduleCombos.add(comboKey);
    }

    // 👉 Sum updated original_quantity per unique combo and update ScheduleInvoiceList
    for (const combo of uniqueScheduleCombos) {
      const [schedule_id, sales_invoice_id] = combo.split("|");

      const sumResult = await ScheduleProductList.findOne({
        where: {
          schedule_id,
          schedule_invoice_id: sales_invoice_id,
        },
        attributes: [
          [sequelize.fn("SUM", sequelize.col("original_quantity")), "quantity"],
        ],
        raw: true,
        transaction,
      });

      const totalQty = parseInt(sumResult.quantity) || 0;

      console.log(
        `Updating ScheduleInvoiceList for combo ${combo} with quantity: ${totalQty}`
      );

      await ScheduleInvoiceList.update(
        {
          oredered_quantity: totalQty,
        },
        {
          where: {
            schedule_id,
            sales_invoice_id,
          },
          transaction,
        }
      );
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Return product created and quantities updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating return product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create return product",
      error: error.message,
    });
  }
});

module.exports = router;
