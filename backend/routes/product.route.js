const express = require("express");
const { where, Op, fn, col, literal, Sequelize } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Vendors,
  Activity_Log,
  Packaging,
  Source,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/lastCode").get(async (req, res) => {
  try {
    const latestProduct = await ProductList.findOne({
      order: [["createdAt", "DESC"]],
    });

    let nextyCode;
    if (latestProduct) {
      const lastCode = latestProduct.product_code;
      const lastNumber = parseInt(lastCode.substring(1), 10);
      nextyCode = (lastNumber + 1).toString().padStart(6, "0");
    } else {
      nextyCode = "000001";
    }

    // let latestNumber =
    //   latestProduct && latestProduct.getDataValue("latestNumber");
    // latestNumber = latestNumber
    //   ? (parseInt(latestNumber, 10) + 1).toString()
    //   : "1";
    return res.json(nextyCode);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//used Module :
// PAYABLE
router.route("/getProductData").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
      order: [["createdAt", "DESC"]],
      // where: {
      //   status: {
      //     [Op.ne]: "Archive",
      //   },
      // },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: true,
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [], // Exclude individual vendor data if only avg is needed
        },
      ],
      group: ["product_list.product_id"], // Group by ProductList ID and any included required model's ID
      order: [["createdAt", "DESC"]],
      where: {
        product_category: {
          [Op.ne]: "Finish Product", // Exclude archived products
        },
      },
      limit,
      offset,
      subQuery: false, // Needed when using group + pagination
    });

    res.json({
      totalItems: count.length || 0,
      totalPages: Math.ceil((count.length || 0) / limit),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataSearchBarLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { searchFunction, filterColumn } = req.query;

    // Base where clause: exclude "Finish Product"
    let productListWhereClause = {
      product_category: {
        [Op.ne]: "Finish Product",
      },
    };

    const productListColumnTable = [
      "product_code",
      "product_name",
      "product_category",
    ];

    let packagingWhereClause = {};

    // Add search filtering if searchFunction exists
    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "product_code":
        case "product_name":
        case "product_category":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "packaging_name": // New case for packaging search
          packagingWhereClause = {
            packaging_name: {
              [Op.like]: `%${searchFunction}%`,
            },
          };
          break;
        default:
          // Search across all product columns AND packaging name
          productListWhereClause = {
            ...productListWhereClause,
            [Op.or]: [
              ...productListColumnTable.map((col) => ({
                [col]: {
                  [Op.like]: `%${searchFunction}%`,
                },
              })),
              // Include packaging search in the OR condition
              {
                "$prod_packaging.packaging_name$": {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
            ],
          };
          break;
      }
    }

    // Fetch data with grouping and associations
    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          required: true,
          as: "prod_packaging",
          where: packagingWhereClause, // Include packaging filter if specified
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [], // exclude individual vendor data if only avg needed
        },
      ],
      group: ["product_list.product_id"],
      order: [["createdAt", "DESC"]],
      where: productListWhereClause,
      limit,
      offset,
      subQuery: false,
    });

    // When using group, count is an array; calculate totalItems accordingly
    const totalItems = Array.isArray(count) ? count.length : count;

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataFilterLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let {
      filterPackage = "All",
      selectStatusFilter = "All",
      filterPriceMin,
      filterPriceMax,
    } = req.query;

    const whereClause = {
      product_category: { [Op.ne]: "Finish Product" },
    };

    if (filterPackage !== "All") {
      whereClause.packaging_id = filterPackage;
    }

    if (selectStatusFilter !== "All") {
      whereClause.status = selectStatusFilter;
    }

    // Parse prices to floats, fallback NaN if invalid input
    const priceMin = parseFloat(filterPriceMin);
    const priceMax = parseFloat(filterPriceMax);

    const havingConditions = [];

    // Skip price filter if both min and max are 0 or invalid NaN
    if (!(priceMin === 0 && priceMax === 0)) {
      if (!isNaN(priceMin) && priceMin !== 0) {
        havingConditions.push(
          `AVG(product_tag_vendors.product_price) >= ${priceMin}`
        );
      }
      if (!isNaN(priceMax) && priceMax !== 0) {
        havingConditions.push(
          `AVG(product_tag_vendors.product_price) <= ${priceMax}`
        );
      }
    }

    const havingClause =
      havingConditions.length > 0
        ? literal(havingConditions.join(" AND "))
        : undefined;

    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          required: true,
          as: "prod_packaging",
          where: filterPackage !== "All" ? { id: filterPackage } : undefined,
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [],
        },
      ],
      group: ["product_list.product_id"],
      order: [["createdAt", "DESC"]],
      where: whereClause,
      having: havingClause,
      limit,
      offset,
      subQuery: false,
    });

    res.json({
      totalItems: count.length || 0,
      totalPages: Math.ceil((count.length || 0) / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.log("Error fetching filtered data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getPackagingData").get(async (req, res) => {
  try {
    const getData = await Packaging.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(getData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// router.route("/getFilteredProductData").get(async (req, res) => {
//   try {
//     const { selectStatusFilter, searchFunction, filterColumn } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let productListWhereClause = {};
//     let packagingWhereClause = {};

//     const productListColumnTable = [
//       "product_code",
//       "product_name",
//       "product_category",
//       "packaging_id",
//     ];

//     if (searchFunction && searchFunction.trim() !== "") {
//       switch (filterColumn) {
//         // Handle Fitler for Product ID
//         case "product_code":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Name
//         case "product_name":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Category
//         case "product_category":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Unit
//         case "packaging.packaging_name":
//           packagingWhereClause["packaging_name"] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle All
//         default:
//           productListWhereClause = {
//             [Op.or]: productListColumnTable.map((col) => {
//               return {
//                 [col]: {
//                   [Op.like]: `%${searchFunction}%`,
//                 },
//               };
//             }),
//           };
//         // // Add search for packaging.packaging_name too
//         // packagingWhereClause = {
//         //   packaging_name: {
//         //     [Op.like]: `%${searchFunction}%`,
//         //   },
//         // };
//         // break;
//       }
//     }

//     // Handle Default Select Status
//     if (selectStatusFilter == "") {
//       productListWhereClause["status"] = {
//         [Op.ne]: "Archive",
//       };
//     }

//     // Handle Status
//     if (selectStatusFilter !== "All Status" && selectStatusFilter !== "") {
//       productListWhereClause["status"] = selectStatusFilter;
//     }

//     const { count, rows: data } = await ProductList.findAndCountAll({
//       include: [
//         {
//           model: Packaging,
//           required: true,
//           // where: packagingWhereClause,
//         },
//         {
//           model: Product_Tag_Vendor,
//           required: false,
//           // include: [
//           //   {
//           //     model: Vendors,
//           //     required: true,
//           //   },
//           // ],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//       // where: productListWhereClause,
//     });

//     res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data: data,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/fetchDataPackaging").get(async (req, res) => {
  try {
    const getPackaging = await Packaging.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getPackaging);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchDataSource").get(async (req, res) => {
  try {
    const getSource = await Source.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getSource);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//Vendor tagging sa product
router.route("/getVendors").get(async (req, res) => {
  try {
    const data = await Vendors.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/createProduct").post(async (req, res) => {
  try {
    const {
      productCode,
      clientCode,
      productName,
      productCategory,
      packaging_id,
      source_id,
      remarks,
      productThreshold,
      items,
      userLoggedID,
    } = req.body;

    const existingProductCode = await ProductList.findOne({
      where: { product_code: productCode },
    });

    if (existingProductCode) {
      return res.status(401).json({ message: "Duplicate product code" });
    }

    const existingProduct = await ProductList.findOne({
      where: { product_name: productName },
    });

    if (existingProduct) {
      return res.status(409).json({ message: "Product Name Already Exists." });
    }

    const thresholdValue = productThreshold ?? null;

    const newProduct = await ProductList.create({
      product_code: productCode,
      product_name: productName,
      client_code: clientCode,
      packaging_id,
      product_category: productCategory,
      description: remarks,
      threshold: thresholdValue,
      status: "Active",
      masterlist_id: userLoggedID,
    });

    const ProductId = newProduct.product_id;

    await Promise.all(
      items.map((data) =>
        Product_Tag_Vendor.create({
          product_id: ProductId,
          vendor_id: data.vendorId,
          product_price: data.vendorPrice,
          status: "Active",
        })
      )
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Product List: User created new product with Product Code ${productCode}`,
    });

    return res.status(200).json(newProduct);
  } catch (err) {
    console.error(err);
    return res.status(500).send("An error occurred");
  }
});

router.route("/fetchProductEdit").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
      where: {
        product_id: req.query.id,
      },
    });

    if (!data) {
      return res.status(204).json();
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/updateProduct").put(async (req, res) => {
  try {
    const {
      id,
      productCode,
      productName,
      productCategory,
      productUnit,
      remarks,
      productThreshold,
      items,
      userLoggedID,
      clientCode,
      packaging_id,
      source_id,
    } = req.body;

    const existingProductName = await ProductList.findOne({
      where: {
        product_id: {
          [Op.ne]: id,
        },
        product_name: productName,
      },
    });

    if (existingProductName) {
      return res.status(409).json({ message: "Product Name Already Exists." });
    }

    const getProductData = await ProductList.findOne({
      where: {
        product_id: id,
        product_code: productCode,
      },
    });

    const dataToGetPreviousListOfVendors = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
      where: {
        product_id: id,
      },
    });

    const previousListOfVendors = dataToGetPreviousListOfVendors
      .reverse()
      .map((item) => {
        return `
      Company Name: ${item.vendor.company_name}
      Vendor Price: ${item.product_price}
      `;
      });

    const findProduct = await ProductList.findOne({
      where: {
        product_id: { [Op.ne]: id },
        product_code: productCode,
      },
    });

    if (findProduct) {
      res.status(201).send("Exist");
    } else {
      const thresholdValue =
        productThreshold === "" ||
        productThreshold === undefined ||
        productThreshold === null
          ? null
          : Number(productThreshold);

      await ProductList.update(
        {
          product_code: productCode,
          product_name: productName,
          product_category: productCategory,
          client_code: clientCode,
          packaging_id: packaging_id,
          description: remarks,
          threshold: thresholdValue,
        },
        {
          where: { product_id: id },
        }
      );

      await Product_Tag_Vendor.update(
        {
          status: "Inactive",
        },
        {
          where: {
            product_id: id,
          },
        }
      );

      for (const item of items) {
        const { vendorId, vendorPrice, vendorPrevPrice } = item;

        const currentProduct = await Product_Tag_Vendor.findOne({
          where: {
            product_id: id,
            vendor_id: vendorId,
          },
          attributes: ["product_price"], // Only fetch the price
        });

        let currentPrice = 0;

        if (currentProduct) {
          currentPrice = currentProduct.product_price;
        }

        if (currentPrice !== vendorPrice) {
          await Product_Tag_Vendor.update(
            {
              previous_price: currentPrice,
              product_price: vendorPrice,
              status: "Active",
            },
            {
              where: {
                product_id: id,
                vendor_id: vendorId,
              },
            }
          );
        } else {
          await Product_Tag_Vendor.update(
            {
              product_price: vendorPrice,
              status: "Active",
            },
            {
              where: {
                product_id: id,
                vendor_id: vendorId,
              },
            }
          );
        }

        const findVendor = await Product_Tag_Vendor.findAll({
          where: {
            product_id: id,
            vendor_id: vendorId,
          },
        });

        if (findVendor.length > 0) {
          // nothing
        } else {
          await Product_Tag_Vendor.create({
            product_id: id,
            vendor_id: vendorId,
            product_price: vendorPrice,
            status: "Active",
          });
        }
      }

      const currentListOfVendors = items
        .map((item) => {
          return `
        Company Name: ${item.companyName}
        Vendor Price: ${item.vendorPrice}
        `;
        })
        .join("");

      Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Product List: User updated information about product list with Product code ${productCode}.
        Product Name: ${getProductData.product_name} to ${productName}
        Product Category: ${getProductData.product_category} to ${productCategory}
        Unit of Measure: ${getProductData.unit_of_measure} to ${productUnit}
        Description: ${getProductData.description} to ${remarks}
        Product Threshold: ${getProductData.threshold} to ${thresholdValue}

        Vendor List --------
        ${previousListOfVendors}
        to
        ${currentListOfVendors}
        `,
      });

      return res.status(200).json();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/statusupdate").put(async (req, res) => {
  try {
    const { productIds, status } = req.body;

    const updateData = { status: status };

    if (status === "Archive") {
      updateData.archive_date = new Date();
    }
    for (const productId of productIds) {
      const productdata = await ProductList.findOne({
        where: { product_id: productId },
      });

      const updateStatus = await ProductList.update(updateData, {
        where: { product_id: productId },
      });
    }

    res.status(200).json({ message: "Products updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.route("/getProductInventory").get(async (req, res) => {
  try {
    const data = await StockManagement.findAll({
      include: [
        {
          model: ProductList,
          required: true,
          where: {
            product_category: "Finish Product",
          },
        },
      ],
      order: [["createdAt", "DESC"]],
      where: {
        stock: {
          [Op.ne]: 0,
        },
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/fetchProductCode").get(async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    const trimmedCode = id.toString().trim();

    const product = await ProductList.findOne({
      where: {
        product_code: Sequelize.where(
          Sequelize.fn("trim", Sequelize.col("product_code")),
          trimmedCode
        ),
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.route("/fetchClientCode").get(async (req, res) => {
  try {
    const product = await ProductList.findOne({
      where: {
        client_code: req.query.id, // Ensure this matches your DB column
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/fetchProductNameAndPrefix", async (req, res) => {
  try {
    const { id, productName, prefix, isUpdate } = req.query;
    const isUpdateBool = isUpdate === "true";

    if (!productName || !prefix) {
      return res.status(400).json({
        success: false,
        message: "Both productName and prefix are required",
      });
    }

    const whereConditions = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("product_name")),
          "=",
          productName.toLowerCase().trim()
        ),
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("prefix")),
          "=",
          prefix.toLowerCase().trim()
        ),
      ],
    };

    // For update, exclude current product
    if (isUpdateBool && id) {
      whereConditions[Op.and].push({
        product_id: { [Op.ne]: id },
      });
    }

    const product = await ProductList.findOne({
      where: whereConditions,
    });

    return res.json({
      success: true,
      exists: !!product,
      data: product || null,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
