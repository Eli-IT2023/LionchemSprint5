import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Form } from "react-bootstrap";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

const CreateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const debounceTimeout = useRef(null);
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [isProductExisting, setIsProductExisting] = useState(false);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState([]);

  const checkProductCode = async (e, productCode) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/product/fetchProductCode`, {
          params: { id: productCode },
        });

        if (res.data.success && res.data.data) {
          console.log("Product exists:", res.data.data);

          const confirmed = await swal({
            icon: "warning",
            title: "Oops!",
            text: `Product Code already exists.`,
            button: "OK",
            dangerMode: true,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });

          if (confirmed) {
            e.target.value = "";
          }
        }
      } catch (err) {
        console.error("Error checking product:", err);
      }
    }, 500);
  };

  const checkClientCode = async (e, clientCode) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/product/fetchClientCode`, {
          params: { id: clientCode },
        });

        if (res.data.success && res.data.data) {
          console.log("Client exists:", res.data.data);

          const confirmed = await swal({
            icon: "warning",
            title: "Oops!",
            text: `Client Code already exists.`,
            button: "OK",
            dangerMode: true,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });

          if (confirmed) {
            e.target.value = "";
          }
        }
      } catch (err) {
        console.error("Error checking product:", err);
      }
    }, 500);
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const reloadProductCode = () => {
    axios
      .get(BASE_URL + "/product/lastCode")
      .then((res) => {
        const codes =
          res.data !== null ? res.data.toString().padStart(6, "0") : "000001";
        // setValue("productCode", codes);
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getVendors`);
      setVendorData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPackging = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataPackaging`);
      setPackagingData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSource = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataSource`);
      setSourceData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadProductCode();
      fetchVendorData();
      fetchPackging();
      fetchSource();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const addNewItem = () => {
    append({
      companyName: "",
      vendorId: "",
      vendorEmail: "",
      vendoryCountry: "",
      // invoice_date: { [Op.between]: [thisFromdate, thisTodate] },
      vendorPrice: 0,
    });
  };

  const { register, control, setValue, getValues } = useForm({
    defaultValues: {
      productCode: "",
      clientCode: "",
      productName: "",
      productCategory: "",
      packaging_id: "",
      source_id: "",
      remarks: "",
      productThreshold: "",
      items: [
        {
          companyName: "",
          vendorId: "",
          vendorEmail: "",
          vendoryCountry: "",
          vendorPrice: 0,
        },
      ],
    },
  });

  const {
    fields: vendortable,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "items",
  });
  const itemsValues = useWatch({
    control,
    name: "items",
    defaultValue: [],
  });

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      swal({
        title: "Create this new product?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = getValues();

          const formattedFormData = {
            ...formData,
            productThreshold: parseFloat(
              String(formData.productThreshold).replace(/,/g, "")
            ),
            items: formData.items.map((item) => ({
              ...item,
              vendorPrice:
                parseFloat(String(item.vendorPrice).replace(/,/g, "")) || 0,
            })),
            userLoggedID,
          };

          axios
            .post(`${BASE_URL}/product/createProduct`, formattedFormData, {
              headers: { "Content-Type": "application/json" },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Product created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                }).then(() => {
                  navigate("/inventory/product-list");
                });
              }
            })
            .catch((error) => {
              if (error.response) {
                if (error.response.status === 401) {
                  swal({
                    title: "Duplicate Product Code!",
                    text: "Product code already exists. Try another.",
                    icon: "warning",
                  });
                } else if (error.response.status === 409) {
                  swal({
                    title: "Duplicate Product Name!",
                    text: "Product name already exists. Try another.",
                    icon: "warning",
                  });
                } else {
                  swal({
                    title: "Something Went Wrong",
                    text: "Please contact your support immediately",
                    icon: "error",
                    buttons: false,
                    timer: 2000,
                    dangerMode: true,
                  });
                }
              } else {
                swal({
                  title: "Network Error",
                  text: "Unable to connect to the server.",
                  icon: "error",
                });
              }
            });
        }
      });
    }

    setValidated(true);
  };

  //Function for formatting the number using userForm
  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input
    // Remove non-numeric characters except for the decimal point
    let inputValue = value.replace(/[^0-9.]/g, "");
    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");
    // Format the integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Combine integer and decimal parts (if any)
    return decimalPart !== undefined
      ? `${integerPart}.${decimalPart}`
      : integerPart;
  };

  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        {isLoading ? (
          <div className="loading-container">
            <ThreeDot
              variant="brick-stack"
              color="#6290FE"
              size="large"
              text="Loading Data..."
              textColor=""
            />
          </div>
        ) : authrztn.includes("ProductList-Add") ? (
          <>
            <Form noValidate validated={validated} onSubmit={add}>
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-3">
                    <Link
                      to="/inventory/product-list"
                      className="text-dark me-2"
                    >
                      <i class="fa-solid fa-arrow-left"></i>
                    </Link>
                    CREATE PRODUCT
                  </span>
                </div>
              </div>

              <div className="p-2">
                <span className="text-decoration-underline">
                  GENERAL INFORMATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md">
                    <Form.Label htmlFor="productCode">
                      Product Code <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      id="productCode"
                      {...register("productCode", {
                        onChange: (e) => checkProductCode(e, e.target.value),
                      })}
                      required
                      placeholder="Enter Code"
                    />
                  </div>

                  {/* <div className="col-md">
                    <Form.Label htmlFor="clientCode">
                      Client Code <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Code"
                      id="clientCode"
                      {...register("clientCode", {
                        onChange: (e) => checkClientCode(e, e.target.value),
                      })}
                      // required
                    />
                  </div> */}

                  <div className="col-md">
                    <Form.Label htmlFor="productName">
                      Product Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Name"
                      id="productName"
                      {...register("productName")}
                      required
                    />
                  </div>
                  <div className="col-md">
                    <Form.Label htmlFor="productCategory">
                      Product Category <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      className="p-3"
                      id="productCategory"
                      {...register("productCategory")}
                      required
                    >
                      <option disabled value="">
                        Select Category
                      </option>
                      {/* <option value="Finish Product">Finish Product</option> */}
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Consumables">Consumables</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <Form.Label htmlFor="packaging_id">
                      Unit of Measure
                    </Form.Label>
                    <Form.Select
                      className="form-select p-3"
                      id="packaging_id"
                      {...register("packaging_id")}
                      required
                    >
                      <option disabled value="">
                        Select Unit of Measure
                      </option>
                      {packagingData.map((data, index) => (
                        <option key={index} value={data.id}>
                          {data.packaging_name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-8">
                    <Form.Label htmlFor="remarks">Remarks</Form.Label>
                    <Form.Control
                      id="remarks"
                      as="textarea"
                      rows={3}
                      style={{
                        fontSize: "16px",
                        height: "200px",
                        maxHeight: "200px",
                        resize: "none",
                        overflowY: "auto",
                      }}
                      placeholder="Enter Remarks"
                      {...register("remarks")}
                    />
                  </div>

                  {/* <div className="col-md">
                    <Form.Label htmlFor="source_id">Source</Form.Label>
                    <Form.Select
                      className="form-select p-3"
                      id="source_id"
                      {...register("source_id")}
                      required
                    >
                      <option disabled value="">
                        Select Source
                      </option>
                      {sourceData.map((data, index) => (
                        <option key={index} value={data.id}>
                          {data.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div> */}
                </div>

                <span className="text-decoration-underline">
                  THRESHOLD NOTIFICATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md-6">
                    <Form.Label htmlFor="productThreshold">
                      Critical Inventory Threshold
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text p-3">No.</span>
                      <Form.Control
                        type="text"
                        className="p-3"
                        id="productThreshold"
                        placeholder="Input quantity"
                        // {...register("productThreshold")}
                        {...register(`productThreshold`, {
                          onChange: (e) => {
                            const formattedValue = formatNumber(e.target.value);
                            setValue(`productThreshold`, formattedValue);
                          },
                        })}
                      />
                    </div>
                  </div>

                  <div className="col-md-6"></div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="p-2">
                        Vendor <span className="text-danger">*</span>
                      </th>
                      <th className="p-2">Contact Person</th>
                      <th className="p-2">Company Email</th>
                      <th className="p-2">Country</th>
                      <th className="p-2">Price</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendortable.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <select
                            required
                            {...register(`items.${index}.vendorId`)}
                            className="form-select form-select-sm p-2"
                            onChange={(e) => {
                              const selectedValue = String(e.target.value, 10);
                              const selectedVendor = vendorData.find(
                                (p) => String(p.id) === selectedValue
                              );

                              if (selectedVendor) {
                                setValue(
                                  `items.${index}.companyName`,
                                  selectedVendor.company_name
                                );
                                setValue(
                                  `items.${index}.vendorName`,
                                  `${selectedVendor.fname} ${selectedVendor.lname}`
                                );
                                setValue(
                                  `items.${index}.vendorEmail`,
                                  selectedVendor.company_email
                                );
                                setValue(
                                  `items.${index}.vendorCountry`,
                                  selectedVendor.company_country
                                );

                                setSelectedVendors((prev) => {
                                  const updated = [...prev];
                                  updated[index] = selectedValue;
                                  return updated;
                                });
                              }
                            }}
                          >
                            <option value="" disabled>
                              Select Vendor
                            </option>
                            {(vendortable.length === 1
                              ? vendorData
                              : vendorData.filter(
                                  (data) =>
                                    !selectedVendors.includes(data.id) ||
                                    selectedVendors[index] === data.id
                                )
                            ).map((data) => (
                              <option key={data.id} value={data.id}>
                                {data.company_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Form.Control
                            {...register(`items.${index}.vendorName`)}
                            className="p-2"
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            {...register(`items.${index}.vendorEmail`)}
                            className="p-2"
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            {...register(`items.${index}.vendorCountry`)}
                            className="p-2"
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            onInput={onInputFloat}
                            required
                            // {...register(`items.${index}.vendorPrice`)}
                            {...register(`items.${index}.vendorPrice`, {
                              onChange: (e) => {
                                const formattedValue = formatNumber(
                                  e.target.value
                                );
                                setValue(
                                  `items.${index}.vendorPrice`,
                                  formattedValue
                                );
                              },
                            })}
                            className="p-2"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              if (vendortable.length > 1) {
                                remove(index);
                                setSelectedVendors((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                              } else {
                                swal({
                                  title: "Oops!",
                                  text: "Cannot delete the last item",
                                  icon: "warning",
                                  buttons: false,
                                  timer: 2000,
                                  dangerMode: true,
                                });
                              }
                            }}
                            disabled={vendortable.length === 1}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-end mt-2">
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={addNewItem}
                >
                  New Item
                </button>
              </div>
              <div className="row mx-auto p-2 mt-4 mb-4"></div>
              <div className="w-100 text-end mb-3 ">
                <button
                  className="btn btn-outline-secondary title-button mx-3"
                  onClick={() => navigate("/inventory/product-list")}
                >
                  Cancel
                </button>
                <button className="btn btn-primary title-button">Save</button>
              </div>
            </Form>
          </>
        ) : (
          <div className="no-access">
            <img src={NoAccess} alt="NoAccess" className="no-access-img" />
            <h3>You don't have access to this function.</h3>
          </div>
        )}
      </div>
    </>
  );
};

export default CreateProduct;
