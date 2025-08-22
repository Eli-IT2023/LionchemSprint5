const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Customer,
  Activity_Log,
  Customer_SocialLinks,
  Customer_ContactPerson,
  SalesInvoice,
  SalesInvoiceTagProduct,
  ProductList,
  Packaging,
} = require("../db/models/associations");
const session = require("express-session");
const moment = require("moment");
router.route("/getCustomers").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      where: {
        status: true,
      },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomersFilter").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { filterStatus, filterDateCreatedStart, filterDateCreatedEnd } =
      req.query;

    const whereClause = {
      status: filterStatus,
    };

    if (filterDateCreatedStart && filterDateCreatedEnd) {
      const startOfDay = moment(filterDateCreatedStart, "YYYY-MM-DD")
        .startOf("day") // 00:00:00
        .toDate();

      const endOfDay = moment(filterDateCreatedEnd, "YYYY-MM-DD")
        .endOf("day") // 23:59:59.999
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }
    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomersSearch").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { filterStatus, searchText_value, filterColumn } = req.query;
    const whereClause = {};

    if (filterColumn !== "all") {
      // const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
      //   .startOf("day") // 00:00:00
      //   .toDate();

      // const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
      //   .endOf("day") // 23:59:59.999
      //   .toDate();

      whereClause[filterColumn] = {
        [Op.like]: `%${searchText_value}%`,
      };
      whereClause.status = filterStatus;
    } else {
      whereClause[Op.or] = [
        { company_name: { [Op.like]: `%${searchText_value}%` } },
        { country: { [Op.like]: `%${searchText_value}%` } },
        { mobile_no: { [Op.like]: `%${searchText_value}%` } },
        { telephone_no: { [Op.like]: `%${searchText_value}%` } },
        { company_email: { [Op.like]: `%${searchText_value}%` } },
      ];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});
// router.route("/getCustomers").get(async (req, res) => {
//   try {
//     const { selectedStatus, selectedType, filterColumn, searchText } =
//       req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let customerWhereClause = {};
//     const customerTableColumn = [
//       "tin",
//       "customer_name",
//       "company_name",
//       "mobile_no",
//       "email",
//       "country",
//       "type",
//     ];

//     // if (selectedStatus !== undefined && selectedStatus !== "") {
//     //   customerWhereClause["status"] = selectedStatus === "true";
//     // }

//     switch (filterColumn) {
//       case "tin":
//         customerWhereClause["tin"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       case "customer_name":
//         customerWhereClause = sequelize.where(
//           fn("CONCAT", col("first_name"), " ", col("last_name")),
//           {
//             [Op.like]: `%${searchText}%`,
//           }
//         );
//         break;
//       case "company":
//         customerWhereClause["company_name"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "phone":
//         customerWhereClause["mobile_no"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "email":
//         customerWhereClause["email"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "country":
//         customerWhereClause["country"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       case "type":
//         customerWhereClause["type"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       default:
//         customerWhereClause = {
//           [Op.or]: customerTableColumn.map((column) => {
//             if (column === "customer_name") {
//               return sequelize.where(
//                 fn("CONCAT", col("first_name"), " ", col("last_name")),
//                 {
//                   [Op.like]: `%${searchText}%`,
//                 }
//               );
//             } else {
//               return {
//                 [column]: {
//                   [Op.like]: `%${searchText}%`,
//                 },
//               };
//             }
//           }),
//         };
//         break;
//     }

//     if (selectedStatus !== "All") {
//       customerWhereClause["status"] =
//         selectedStatus === "Active" ? true : false;
//     }

//     if (selectedType !== "All") {
//       customerWhereClause["type"] = selectedType;
//     }

//     const { count, rows: customers } = await Customer.findAndCountAll({
//       // where: {
//       //   status: {
//       //     [Op.ne]: 0,
//       //   },
//       // },
//       limit: limit,
//       offset: offset,
//       order: [["createdAt", "DESC"]],
//       where: customerWhereClause,
//     });

//     if (customers) {
//       return res.json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: customers,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      formType,
      status,
      companyName,
      companyNature,
      companyEmail,
      companyAddress,
      country,
      mobileNumber,
      telephoneNumber,
      tin,
      socialLinks,
      contactPerson,
      userLoggedID,
    } = req.body;

    const existingCustomer = await Customer.findOne({
      where: {
        company_name: companyName,
      },
    });

    if (existingCustomer) {
      await transaction.rollback();
      return res.status(201).send("Exist");
    } else {
      const newCustomer = await Customer.create(
        {
          type: "company",
          status: status,
          company_name: companyName,
          company_nature: companyNature,
          company_email: companyEmail,
          company_address: companyAddress,
          country: country,
          mobile_no: mobileNumber,
          telephone_no: telephoneNumber,
          tin: tin,
        },
        { transaction }
      );

      if (socialLinks && socialLinks.length > 0) {
        for (const entry of socialLinks) {
          if (entry.isDeleted === false) {
            await Customer_SocialLinks.create(
              {
                id: entry.id,
                customer_id: newCustomer.customer_id,
                platform: entry.platform,
                link: entry.link,
              },
              { transaction }
            );
          }
        }
      }

      if (contactPerson && contactPerson.length > 0) {
        for (const entry of contactPerson) {
          if (entry.isDeleted === false) {
            await Customer_ContactPerson.create(
              {
                id: entry.id,
                customer_id: newCustomer.customer_id,
                fname: entry.fname,
                mname: entry.mname,
                lname: entry.lname,
                email: entry.email,
                job_position: entry.jobPosition,
                mobile_no: entry.mobileNumber,
                remarks: entry.Remarks,
              },
              { transaction }
            );
          }
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Customers: User created a new customer companyName: ${companyName}`,
      });

      await transaction.commit();
      res.status(200).json(newCustomer);
    }
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/getCustomerDetails").get(async (req, res) => {
  try {
    const data = await Customer.findOne({
      where: {
        customer_id: req.query.customerId,
      },
      include: [
        {
          model: Customer_SocialLinks,
          required: true,
        },
        {
          model: Customer_ContactPerson,
          required: true,
        },
      ],
    });
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

// router.route("/getCustomerCashWallet/:customerId").get(async (req, res) => {
//   const { customerId } = req.params;
//   try {
//     const data = await CustomerCashWallet.findAll({
//       where: { customer_id: customerId },
//     });

//     if (data) {
//       return res.json(data);
//     } else {
//       return res.status(404).json("No data found for this customer");
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/updateCustomer/:param_id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const customerId = req.params.param_id;
    let {
      status,
      companyName,
      companyNature,
      companyEmail,
      companyAddress,
      country,
      mobileNumber,
      telephoneNumber,
      tin,
      socialLinks,
      contactPerson,
      userLoggedID,
    } = req.body;

    const existingData = await Customer.findOne({
      where: {
        company_name: companyName,
        customer_id: {
          [Op.ne]: customerId,
        },
      },
    });

    if (existingData) {
      res.status(202).send("Exist");
    } else {
      const getData = await Customer.findOne({
        where: { customer_id: customerId },
      });

      const data = await Customer.update(
        {
          status: status,
          company_name: companyName,
          company_nature: companyNature,
          company_email: companyEmail,
          company_address: companyAddress,
          country: country,
          mobile_no: mobileNumber,
          telephone_no: telephoneNumber,
          tin: tin,
        },
        {
          where: { customer_id: customerId },
        }
      );

      if (socialLinks && socialLinks.length > 0) {
        for (const entry of socialLinks) {
          await Customer_SocialLinks.update(
            {
              customer_id: customerId,
              platform: entry.platform,
              link: entry.link,
            },
            {
              where: {
                id: entry.id,
              },
            },
            { transaction }
          );
        }
      }

      if (contactPerson && contactPerson.length > 0) {
        for (const entry of contactPerson) {
          await Customer_ContactPerson.update(
            {
              customer_id: customerId,
              fname: entry.fname,
              mname: entry.mname,
              lname: entry.lname,
              email: entry.email,
              job_position: entry.jobPosition,
              mobile_no: entry.mobileNumber,
              remarks: entry.Remarks,
            },
            {
              where: { customer_id: customerId, id: entry.id },
              returning: true,
              transaction,
            },
            { transaction }
          );
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Customer: User updated customer information: \n
        
          Company Address: ${getData.company_address} to ${companyAddress}
          Country: ${getData.country} to ${country}
          Company Name: ${getData.company_name} to ${companyName}
          Company Nature: ${getData.company_nature} to ${companyNature}
          Company Email: ${getData.company_email} to ${companyEmail}
          Mobile Number: ${getData.mobile_no} to ${mobileNumber}
          Tin: ${getData.tin} to ${tin}
        `,
      });

      await transaction.commit();
      res.status(200).json({ message: "Data updated successfully", data });
    }
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

// count customer
router.route("/countCustomers").get(async (req, res) => {
  try {
    // Count customers where customer_id is not null
    const customerCount = await Customer.count({
      where: { customer_id: { [Op.ne]: null } },
    });

    // Send the customer count as a response
    res.json({ totalCustomers: customerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// count customer this month
router.route("/countCustomersWithinMonth").get(async (req, res) => {
  try {
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );

    // Count the customers created between the first and last days of the month
    const customerCount = await Customer.count({
      where: {
        createdAt: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth],
        },
      },
    });

    res.json({ count: customerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error counting customers");
  }
});

module.exports = router;
