const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  ProductList,
  Source,
  Parameter,
  MasterList,
  Finish_Raw_Material,
  Finish_Parameter,
  Product_Tag_Vendor,
  Vendors,
  Packaging,
  FormulationProductRemarks,
} = require("../db/models/associations");

const {
  currency_sub,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");
// const Finish_Raw_Material = require("../db/models/finish_raw_materials.model");
// const Finish_Parameter = require("../db/models/finish_parameter.model");

router.route("/getMaterials").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product_Tag_Vendor.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: Vendors,
          attributes: ["id", "company_name"],
        },
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_name",
            "product_code",
            "client_code",
            "status",
            "product_category",
          ],
          where: {
            product_category: { [Op.in]: ["Raw Materials", "Consumables"] },
            status: "Active",
          },
          include: [
            {
              model: Packaging,
              required: true,
              attributes: ["id", "packaging_name"],
              as: "prod_packaging",
            },
          ],
        },
      ],
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
  }
});

router.route("/getParameters").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Parameter.findAndCountAll({
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
  }
});

router.route("/getFinishProduct").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductList.findAndCountAll({
      where: {
        product_category: "Finish Product",
        status: "Active",
      },
      include: [
        {
          model: MasterList,
          required: true,
          attributes: ["fname", "mname", "lname"],
        },
      ],
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
            status = "Closed";
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
    return res.status(500).json({
      message: "An error occurred while fetching finish products",
      error: error.message,
    });
  }
});

router.route("/getSpecificFormulation").get(async (req, res) => {
  try {
    const productData = await ProductList.findOne({
      where: {
        product_id: req.query.id,
      },
      include: [
        {
          model: Finish_Parameter,
          include: [
            {
              model: Parameter,
              required: true,
            },
          ],
        },
        {
          model: Finish_Raw_Material,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
              include: [
                {
                  model: ProductList,
                  required: true,
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                  ],
                },
                {
                  model: Vendors,
                  required: true,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!productData) {
      return res.status(404).json({ message: "Formulation not found" });
    }

    const transformedData = {
      ...productData.dataValues,
      materials:
        productData.finish_raw_materials?.map((rawMaterial) => ({
          id: rawMaterial.product_tag_vendor_id,
          finishRawMatTagId: rawMaterial.id,
          product_tag_vendor_id: rawMaterial.product_tag_vendor_id,
          product_list: {
            product_code:
              rawMaterial.product_tag_vendor?.product_list?.product_code,
            client_code:
              rawMaterial.product_tag_vendor?.product_list?.client_code,
            product_name:
              rawMaterial.product_tag_vendor?.product_list?.product_name,
          },
          vendor: {
            company_name: rawMaterial.product_tag_vendor?.vendor?.company_name,
          },
          composition: rawMaterial.composition,
          qualified: rawMaterial.qualified,
          instruction: rawMaterial.instruction,
          isDeleted: rawMaterial.isDeleted,
        })) || [],
      parameters:
        productData.finish_parameters?.map((param) => ({
          finishParamTagId: param.id,
          id: param.parameter_id,
          name: param.parameter?.name,
          uom: param.uom,
          category: param.category,
          isDeleted: param.isDeleted,
          createdAt: param.createdAt,
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

router.route("/createFinishGoods").post(async (req, res) => {
  try {
    const { formData, selectedMaterials, selectedParameters, userLoggedID } =
      req.body;

    const {
      clientCode,
      productCode,
      productName,
      packaging_id,
      remarks,
      prefix,
      weight,
    } = formData;

    const createFinishGood = await ProductList.create({
      product_code: productCode,
      product_name: productName,
      client_code: clientCode,
      product_category: "Finish Product",
      packaging_id: packaging_id,
      status: "Active",
      prefix: prefix,
      weight: weight,
      masterlist_id: userLoggedID,
    });

    if (createFinishGood) {
      const product_id = createFinishGood.product_id;

      // Insert remarks using the product_id
      if (remarks && remarks.trim(" ") !== "") {
        const insertRemarks = await FormulationProductRemarks.create({
          product_id: product_id,
          remarks: remarks,
          createdBy: userLoggedID,
        });
      }

      const materialsToInsert = selectedMaterials.map((item) => ({
        product_id: createFinishGood.product_id,
        product_tag_vendor_id: item.id,
        composition: item.composition,
        qualified: item.qualified,
        instruction: item.instruction,
        weight: item.targetWeight,
      }));

      const paramsToInsert = selectedParameters.map((item) => ({
        finish_product_id: createFinishGood.product_id,
        parameter_id: item.id,
        uom: item.uom,
        category: item.category,
      }));

      await Finish_Raw_Material.bulkCreate(materialsToInsert);
      await Finish_Parameter.bulkCreate(paramsToInsert);
    }

    return res.status(200).json();
  } catch (error) {
    console.error(error);
  }
});

router.route("/updateFormulation").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const requestData = req.body;
    const {
      formData,
      id,
      deletedRemarks,
      selectedMaterials,
      selectedParameters,
      userLoggedID,
    } = requestData;

    if (!requestData.selectedMaterials) {
      await transaction.rollback();
      return res.status(400).json({
        message: "selectedMaterials is required",
      });
    }

    // Validate each material
    for (const mat of selectedMaterials) {
      if (!mat.product_tag_vendor_id) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Material ${mat.id} is missing product_tag_vendor_id`,
        });
      }
    }

    await ProductList.update(
      {
        product_code: formData.productCode,
        client_code: formData.clientCode,
        product_name: formData.productName,
        product_category: formData.productCategory,
        packaging_id: formData.packaging_id,
        prefix: formData.prefix,
        weight: formData.weight,
      },
      {
        where: { product_id: id },
        transaction,
      }
    );

    // Insert remarks using the product_id
    if (formData.remarks && formData.remarks.trim(" ") !== "") {
      await FormulationProductRemarks.create(
        {
          product_id: id,
          remarks: formData.remarks,
          createdBy: userLoggedID,
        },
        { transaction }
      );
    }

    if (deletedRemarks.length > 0) {
      for (const remarkID of deletedRemarks) {
        await FormulationProductRemarks.update(
          {
            isDeleted: 1,
          },
          {
            where: {
              id: remarkID,
            },
          },
          { transaction }
        );
      }
    }

    await Finish_Raw_Material.update(
      { isDeleted: true },
      { where: { product_id: id }, transaction }
    );

    for (const mat of selectedMaterials) {
      if (mat.finishRawMatTagId && mat.finishRawMatTagId.trim(" ") !== "") {
        console.log("This is product tag vendor", mat.product_tag_vendor_id);
        await Finish_Raw_Material.update(
          {
            isDeleted: false,
            composition: mat.composition,
            qualified: mat.qualified,
            instruction: mat.instruction,
            weight: mat.targetWeight,
          },
          {
            where: { id: mat.finishRawMatTagId },
            transaction,
          }
        );
      } else {
        // Add validation for required fields
        if (!mat.product_tag_vendor_id) {
          await transaction.rollback();
          return res.status(400).json({
            message: "product_tag_vendor_id is required for new materials",
          });
        }

        await Finish_Raw_Material.create(
          {
            product_id: id,
            product_tag_vendor_id: mat.product_tag_vendor_id,
            composition: mat.composition,
            qualified: mat.qualified,
            instruction: mat.instruction ?? "",
            weight: mat.targetWeight,
            isDeleted: false,
          },
          { transaction }
        );
      }
    }

    await Finish_Parameter.update(
      { isDeleted: true },
      { where: { finish_product_id: id }, transaction }
    );

    for (const param of selectedParameters) {
      if (param.finishParamTagId) {
        await Finish_Parameter.update(
          {
            isDeleted: false,
            uom: param.uom,
            category: param.category,
          },
          {
            where: { id: param.finishParamTagId },
            transaction,
          }
        );
      } else {
        await Finish_Parameter.create(
          {
            finish_product_id: id,
            parameter_id: param.id,
            uom: param.uom,
            category: param.category,
            isDeleted: false,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Formulation updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while updating specific finish products",
      error: error.message,
    });
  }
});

router.route("/getFinishProductBySearchOrFilter").get(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const status = req.query.status || "";
    const searchCategory = req.query.searchCategory || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Base conditions for all queries
    const baseCondition = {
      product_category: "Finish Product",
      status: "Active",
    };

    // Build the search condition based on the category
    let searchCondition = { ...baseCondition };

    if (searchText) {
      switch (searchCategory) {
        case "product_id":
          searchCondition = {
            ...baseCondition,
            product_code: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "product_name":
          searchCondition = {
            ...baseCondition,
            product_name: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "chemist":
          // For chemist name search, we'll handle it in the include/where part
          break;
        default:
          // Default (all) - search across multiple fields
          searchCondition = {
            ...baseCondition,
            [Op.or]: [
              { product_name: { [Op.like]: `%${searchText}%` } },
              { product_code: { [Op.like]: `%${searchText}%` } },
            ],
          };
      }
    }

    // Configure inclusion of MasterList for chemist name search
    const includeOption = {
      model: MasterList,
      required: true,
      attributes: ["fname", "mname", "lname"],
    };

    // If searching by chemist name, add where clause to the include option
    if (searchCategory === "chemist" && searchText) {
      includeOption.where = {
        [Op.or]: [
          { fname: { [Op.like]: `%${searchText}%` } },
          { mname: { [Op.like]: `%${searchText}%` } },
          { lname: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    // Perform the database query
    const { count, rows } = await ProductList.findAndCountAll({
      where: searchCondition,
      include: [includeOption],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    // Process results to include status information
    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified"],
        });

        let qualificationStatus = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (rawMaterials.length > 0) {
          const allQualified = rawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = rawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            qualificationStatus = "Closed";
            statusColor = "text-success";
          } else if (anyQualified) {
            qualificationStatus = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        // Filter by status if specified
        if (status && qualificationStatus !== status) {
          return null; // This will be filtered out
        }

        return {
          ...productData,
          chemistName,
          qualificationStatus,
          statusColor,
        };
      })
    );

    // Filter out null items (those that didn't match status filter)
    const filteredProducts = productsWithStatus.filter((item) => item !== null);

    return res.status(200).json({
      totalItems: filteredProducts.length, // Adjust count for filtered results
      totalPages: Math.ceil(filteredProducts.length / limit),
      currentPage: page,
      data: filteredProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching finish products",
      error: error.message,
    });
  }
});

router.get("/getRemarksHistory", async (req, res) => {
  const { product_id } = req.query;
  try {
    const isFetch = await FormulationProductRemarks.findAll({
      where: { product_id, isDeleted: 0 },
      include: [
        {
          model: MasterList,
          as: "fpr_author_id",
          required: true,
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("fpr_author_id.fname"),
                " ",
                sequelize.col("fpr_author_id.lname")
              ),
              "fullName",
            ],
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedResults = isFetch.map((remark) => {
      return {
        ...remark.get({ plain: true }),
        fullName: remark.fpr_author_id.get("fullName"),
      };
    });

    return res.json(formattedResults);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
