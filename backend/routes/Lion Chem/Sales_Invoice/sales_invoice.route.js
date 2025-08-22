const express = require("express");
const { where, Op, fn, col, literal } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  StockManagement,
  Activity_Log,
  TaxSettings,
  SalesInvoice,
  Packaging,
  Source,
  Finish_Raw_Material,
  SalesInvoiceTagProduct,
  Customer,
  MasterList,
  Currency,
  Product_Tag_Vendor,
  Vendors,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/getAgent").get(async (req, res) => {
  try {
    const data = await MasterList.findAll({
      order: [["createdAt", "DESC"]],
      where: {
        emp_id: {
          [Op.ne]: "00000",
        },
      },
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getStockmanagement").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductList.findAndCountAll({
      include: [
        {
          model: Packaging,
          required: true,
          attributes: ["id", "packaging_name"],
          as: "prod_packaging",
        },
      ],
      where: {
        status: "Active",
        product_category: "Finish Product",
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified", "isDeleted"],
        });

        const activeRawMaterials = rawMaterials.filter(
          (material) => material.isDeleted === false
        );

        let status = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (activeRawMaterials.length > 0) {
          const allQualified = activeRawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = activeRawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            status = "Qualified";
            statusColor = "text-success";
          } else if (anyQualified) {
            status = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        return {
          ...productData,
          chemistName,
          qualificationStatus: status,
          statusColor,
        };
      })
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: productsWithStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getStockmanagent_Search").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { searchTerm } = req.query;
    const { count, rows } = await ProductList.findAndCountAll({
      include: [
        {
          model: Packaging,
          required: true,
          attributes: ["id", "packaging_name"],
        },
      ],
      where: {
        status: "Active",
        product_category: "Finish Product",
        ...(searchTerm && {
          [Op.or]: [
            { $product_name$: { [Op.like]: `%${searchTerm}%` } },
            { $product_code$: { [Op.like]: `%${searchTerm}%` } },
            { "$packaging.packaging_name$": { [Op.like]: `%${searchTerm}%` } },
            { "$source.name$": { [Op.like]: `%${searchTerm}%` } },
          ],
        }),
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getTaxSettings").get(async (req, res) => {
  try {
    const getTax = await TaxSettings.findAll({
      where: {
        status: "active",
        applicability: "Sales",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getTax);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/createSales").post(async (req, res) => {
  try {
    const {
      transactionId,
      sales_invoiceText,
      deliveryText,
      selectedCustomer,
      poNumber,
      selectedDueDate,
      selectedInvoiceDate,
      selectedMethod,
      inputPaymentTerms,
      remarks,
      userLoggedID,
      selectedDestination,
      selectedCurrency,
      currencyRate,
      selectedWarehouse,
      isCheckedDelivery,
      isCheckedTax,
      taxSelectedID,
      lineItems,
      totalGross,
      withholdTaxAmount,
      netReceivableAmount,
    } = req.body;

    const create_data = await SalesInvoice.create({
      transaction_id: transactionId,
      destination: selectedDestination,
      sales_invoice: sales_invoiceText,
      is_only_deliver_number: isCheckedDelivery,
      delivery_number: deliveryText,
      customer_id: selectedCustomer,
      po_number: poNumber,
      due_date: selectedDueDate,
      invoice_date: selectedInvoiceDate,
      payment_method: selectedMethod,
      payment_terms: inputPaymentTerms,
      is_tax_applied: isCheckedTax,
      tax_settings_id: taxSelectedID || null,
      currency_id: selectedCurrency,
      rate: currencyRate,
      remarks: remarks,
      warehouse_id: selectedWarehouse,
      created_by: userLoggedID,
      total_gross: totalGross,
      withhold_tax: withholdTaxAmount,
      net_amount: netReceivableAmount,
    });

    if (!create_data) {
      return res.status(400).json({ message: "Failed to create invoice" });
    }

    const salesId = create_data.sales_invoice_id;
    for (const item of lineItems) {
      const rawMaterials = await Finish_Raw_Material.findAll({
        where: {
          product_id: item.product_id,
        },
        include: [
          {
            model: Product_Tag_Vendor,
            required: true,
          },
        ],
      });

      if (rawMaterials && rawMaterials.length > 0) {
        for (const rawMaterial of rawMaterials) {
          const reservedAmount = item.quantity * rawMaterial.weight;
          await ProductList.increment("reserved", {
            by: reservedAmount,
            where: {
              product_id: rawMaterial.product_tag_vendor.product_id,
            },
          });

          console.log(
            `Updated reserved stock for product_tag_vendor.product_id: ${rawMaterial.product_tag_vendor.product_id}, added: ${reservedAmount}`
          );
        }
      }

      await SalesInvoiceTagProduct.create({
        sales_invoice_id: salesId,
        product_id: item.product_id,
        unit_price: item.unit_price,
        discount_item: item.discount_percentage,
        quantity: item.quantity,
        subtotal: item.subtotal,
        discount_type: "Percentage",
        isDeleted: 0,
      });
    }
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Created a new Sales: SI = ${sales_invoiceText} | DR = ${deliveryText}`,
    });

    return res.status(200).json({
      message: "Sales invoice created successfully",
    });
  } catch (error) {
    console.error("Error creating sales invoice:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/updateSales").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      transactionId,
      sales_invoiceText,
      deliveryText,
      selectedCustomer,
      poNumber,
      selectedDueDate,
      selectedInvoiceDate,
      selectedMethod,
      inputPaymentTerms,
      remarks,
      userLoggedID,
      selectedDestination,
      selectedCurrency,
      currencyRate,
      selectedWarehouse,
      isCheckedDelivery,
      isCheckedTax,
      taxSelectedID,
      lineItems,
      totalGross,
      withholdTaxAmount,
      netReceivableAmount,
      id,
    } = req.body;

    await SalesInvoice.update(
      {
        transaction_id: transactionId,
        destination: selectedDestination,
        sales_invoice: sales_invoiceText,
        is_only_deliver_number: isCheckedDelivery,
        delivery_number: deliveryText,
        customer_id: selectedCustomer,
        po_number: poNumber,
        due_date: selectedDueDate,
        invoice_date: selectedInvoiceDate,
        payment_method: selectedMethod,
        payment_terms: inputPaymentTerms,
        is_tax_applied: isCheckedTax,
        tax_settings_id: taxSelectedID || null,
        currency_id: selectedCurrency,
        rate: currencyRate,
        remarks: remarks,
        warehouse_id: selectedWarehouse,
        created_by: userLoggedID,
        total_gross: totalGross,
        withhold_tax: withholdTaxAmount,
        net_amount: netReceivableAmount,
      },
      {
        where: { sales_invoice_id: id },
        transaction,
      }
    );

    await SalesInvoiceTagProduct.update(
      { isDeleted: true },
      { where: { sales_invoice_id: id }, transaction }
    );

    const existingTagProducts = await SalesInvoiceTagProduct.findAll({
      where: { sales_invoice_id: id, isDeleted: true },
      transaction,
    });

    const rawMaterialCache = new Map();
    const affectedRawMaterialIds = new Set();

    const allProductIds = [
      ...existingTagProducts.map((p) => p.product_id),
      ...lineItems.map((p) => p.product_id),
    ];

    for (const productId of new Set(allProductIds)) {
      const rawMaterials = await Finish_Raw_Material.findAll({
        where: { product_id: productId },
        include: [{ model: Product_Tag_Vendor, required: true }],
        transaction,
      });
      rawMaterialCache.set(productId, rawMaterials);

      for (const rawMaterial of rawMaterials) {
        affectedRawMaterialIds.add(rawMaterial.product_tag_vendor.product_id);
      }
    }

    if (affectedRawMaterialIds.size > 0) {
      await ProductList.update(
        { reserved: 0 },
        {
          where: {
            product_id: { [Op.in]: Array.from(affectedRawMaterialIds) },
          },
          transaction,
        }
      );
    }

    for (const product of lineItems) {
      const rawMaterials = rawMaterialCache.get(product.product_id) || [];

      if (product.salesTagProductId) {
        await SalesInvoiceTagProduct.update(
          {
            product_id: product.product_id,
            unit_price: product.unit_price,
            discount_item: product.discount_percentage,
            quantity: product.quantity,
            subtotal: product.subtotal,
            isDeleted: false,
          },
          { where: { id: product.salesTagProductId }, transaction }
        );
      } else {
        await SalesInvoiceTagProduct.create(
          {
            sales_invoice_id: id,
            product_id: product.product_id,
            unit_price: product.unit_price,
            discount_item: product.discount_percentage,
            quantity: product.quantity,
            subtotal: product.subtotal,
            isDeleted: false,
            discount_type: "Percentage",
          },
          { transaction }
        );
      }

      for (const rawMaterial of rawMaterials) {
        const reservedAmount = product.quantity * rawMaterial.weight;

        await ProductList.increment("reserved", {
          by: reservedAmount,
          where: {
            product_id: rawMaterial.product_tag_vendor.product_id,
          },
          transaction,
        });
      }
    }

    await transaction.commit();
    return res.status(200).json({
      message: "Sales invoice updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating sales invoice:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getSalesData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await SalesInvoice.findAndCountAll({
      include: [
        {
          model: Customer,
          required: true,
          attributes: ["customer_id", "company_name"],
        },
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
          as: "sales_created_masterlist",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSpecificSalesData").get(async (req, res) => {
  try {
    const salesSpecificData = await SalesInvoice.findOne({
      where: {
        sales_invoice_id: req.query.id,
      },
      include: [
        {
          model: Customer,
          required: true,
        },
        {
          model: TaxSettings,
          required: false,
        },
        {
          model: SalesInvoiceTagProduct,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
            },
          ],
        },
        {
          model: Currency,
          required: true,
        },
      ],
    });

    if (!salesSpecificData) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    const transformedData = {
      ...salesSpecificData.dataValues,
      products:
        salesSpecificData.sales_invoice_tag_products?.map((prod) => ({
          salesTagProductId: prod.id,
          sales_invoice_id: prod.sales_invoice_id,
          product_id: prod.product_id,
          product_code: prod.product_list?.product_code,
          product_name: prod.product_list?.product_name,
          quantity: prod.quantity,
          unitPrice: prod.unit_price,
          discount: prod.discount_item,
          subtotal: prod.subtotal,
          isDeleted: prod.isDeleted,
        })) || [],
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching specific finish products",
      error: error.message,
    });
  }
});

router.route("/getSalesDataSearch").get(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const searchField = req.query.searchField || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const baseCondition = {
      status: {
        [Op.ne]: "Cancelled",
      },
    };

    let searchCondition = { ...baseCondition };

    if (searchText) {
      switch (searchField) {
        case "transaction_id":
          searchCondition = {
            ...baseCondition,
            transaction_id: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "invoice_date":
          searchCondition = {
            ...baseCondition,
            invoice_date: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "date_created":
          searchCondition = {
            ...baseCondition,
            createdAt: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "gross_amount":
          searchCondition = {
            ...baseCondition,
            total_gross: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "receivables":
          searchCondition = {
            ...baseCondition,
            net_amount: { [Op.like]: `%${searchText}%` },
          };
          break;
        default:
          searchCondition = {
            ...baseCondition,
            [Op.or]: [
              { transaction_id: { [Op.like]: `%${searchText}%` } },
              { invoice_date: { [Op.like]: `%${searchText}%` } },
              { createdAt: { [Op.like]: `%${searchText}%` } },
              { total_gross: { [Op.like]: `%${searchText}%` } },
              { net_amount: { [Op.like]: `%${searchText}%` } },
            ],
          };
      }
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
      where: searchCondition,
      include: [
        {
          model: Customer,
          required: true,
          attributes: ["customer_id", "company_name"],
        },
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
          as: "sales_created_masterlist",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getFilteredSalesInvoice").get(async (req, res) => {
  try {
    const { fromDate, toDate, agentId } = req.query; // Add agentId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Add date range filter if provided
    if (fromDate || toDate) {
      whereClause.createdAt = {};

      if (fromDate) {
        whereClause.createdAt[Op.gte] = new Date(fromDate);
      }

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = endOfDay;
      }
    }

    if (agentId) {
      whereClause["$sales_created_masterlist.id$"] = agentId;
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          required: true,
          attributes: ["customer_id", "company_name"],
        },
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
          as: "sales_created_masterlist",
          where: agentId ? { id: agentId } : {},
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
