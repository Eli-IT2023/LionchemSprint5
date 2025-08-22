const router = require("express").Router();
const { Op, where, Sequelize } = require("sequelize");
const {
  Packaging,
  Activity_Log,
  PackagingImage,
} = require("../../../db/models/associations");
const moment = require("moment");

// CREATE
router.route("/create").post(async (req, res) => {
  try {
    const {
      packageName,
      packagingImage,
      description,
      status,
      userLoggedID,
      selectedImg, // Add selectedImg to the destructured parameters
    } = req.body;

    // Check if the parameter already exists
    const existingParameter = await Packaging.findOne({
      where: { packaging_name: packageName.trim() },
    });

    if (existingParameter) {
      return res.status(201).json();
    }

    const createPackaging = await Packaging.create({
      packaging_name: packageName.trim(),
      description: description,
      status: status,
    });

    if (createPackaging) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new packaging: ${packageName}`,
      });

      // Process multiple images if they exist
      if (packagingImage && packagingImage.length > 0) {
        const imagePromises = packagingImage.map(async (img, index) => {
          let packagingImageBuffer = null;

          // Handle both string (base64) and object formats
          const imageData = typeof img === "string" ? img : img.data;

          if (imageData && imageData.startsWith("data:image/")) {
            const base64Data = imageData.replace(
              /^data:image\/\w+;base64,/,
              ""
            );
            packagingImageBuffer = Buffer.from(base64Data, "base64");
          }

          // Create the image
          const newImage = await PackagingImage.create({
            packaging_id: createPackaging.id,
            packaging_image: packagingImageBuffer,
            isSelected: 0, // Default to not selected
          });

          // Return both the new image and its tempId (if exists)
          return {
            dbImage: newImage,
            tempId: typeof img === "object" ? img.tempId : null,
          };
        });

        const createdImages = await Promise.all(imagePromises);

        // If an image was selected, update its isSelected status
        if (selectedImg) {
          // Find the image that matches the selectedImg (could be tempId or index)
          const selectedImage = createdImages.find(
            (img) =>
              img.tempId === selectedImg || img.dbImage.id === selectedImg
          );

          if (selectedImage) {
            await PackagingImage.update(
              { isSelected: 1 },
              {
                where: {
                  id: selectedImage.dbImage.id,
                },
              }
            );
          }
        }
      }

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// UPDATE
router.route("/update").post(async (req, res) => {
  try {
    const {
      packageName,
      packagingImage,
      description,
      status,
      userLoggedID,
      forEditPrimary,
      selectedImg,
      deletedImageIds = [],
    } = req.body;

    // Check if packaging name already exists (excluding current record)
    const existingPackaging = await Packaging.findOne({
      where: {
        packaging_name: packageName.trim(),
        id: { [Op.ne]: forEditPrimary },
      },
    });

    if (existingPackaging) {
      return res.status(201).json();
    }

    // First update the packaging details
    const updatedPackaging = await Packaging.update(
      {
        packaging_name: packageName.trim(),
        description: description,
        status: status,
      },
      {
        where: { id: forEditPrimary },
      }
    );

    if (updatedPackaging) {
      // Process new images first to get their IDs
      const newImageIds = {};
      if (packagingImage && packagingImage.length > 0) {
        const imagePromises = packagingImage.map(async (img) => {
          // Skip if this is an existing image (has an id)
          if (img.id) return;

          let packagingImageBuffer = null;
          if (img.data && img.data.startsWith("data:image/")) {
            const base64Data = img.data.replace(/^data:image\/\w+;base64,/, "");
            packagingImageBuffer = Buffer.from(base64Data, "base64");
          }

          const newImage = await PackagingImage.create({
            packaging_id: forEditPrimary,
            packaging_image: packagingImageBuffer,
            isSelected: 0,
          });

          // Map the temporary ID to the new database ID
          if (img.tempId) {
            newImageIds[img.tempId] = newImage.id;
          }
        });

        await Promise.all(imagePromises);
      }

      // Reset all isSelected to 0 for this packaging
      await PackagingImage.update(
        { isSelected: 0 },
        {
          where: {
            packaging_id: forEditPrimary,
          },
        }
      );

      // Handle the selected image (could be new or existing)
      let finalSelectedId = selectedImg;
      if (selectedImg && newImageIds[selectedImg]) {
        finalSelectedId = newImageIds[selectedImg];
      }

      if (finalSelectedId) {
        await PackagingImage.update(
          { isSelected: 1 },
          {
            where: {
              id: finalSelectedId,
              packaging_id: forEditPrimary,
            },
          }
        );
      }

      // Handle image deletions
      if (deletedImageIds && deletedImageIds.length > 0) {
        await PackagingImage.update(
          { isDeleted: 1 },
          {
            where: {
              id: { [Op.in]: deletedImageIds },
              packaging_id: forEditPrimary,
            },
          }
        );
      }

      // Log the activity
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated packaging: ${packageName} with ID ${forEditPrimary}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// FETCH DATA
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Packaging.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "DESC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: image.packaging_image.toString("base64"),
            };
          }
          return image;
        });
      }
      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// FETCH SORTED DATA
router.route("/fetchDataSort").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Packaging.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [[sortDBTableColumn, sortType]],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: image.packaging_image.toString("base64"),
            };
          }
          return image;
        });
      }
      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// FETCH FILTERED DATA
router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    // Build the where clause dynamically
    const whereClause = {};

    // Handle status filter (including "All" option)
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // Handle date filter
    if (filterDateCreated) {
      const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day")
        .toDate();

      const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day")
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "DESC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: image.packaging_image.toString("base64"),
            };
          }
          return image;
        });
      }
      return formattedRow;
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: formattedRows,
      filters: {
        status: filterStatus,
        date: filterDateCreated,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// FETCH SEARCH DATA
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const whereClause = {};

    if (filterColumn !== "all") {
      whereClause[filterColumn] = {
        [Op.like]: `%${searchText}%`,
      };
      whereClause.status = filterStatus;
    } else {
      whereClause[Op.or] = [
        { packaging_name: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } },
      ];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "DESC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: image.packaging_image.toString("base64"),
            };
          }
          return image;
        });
      }
      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
