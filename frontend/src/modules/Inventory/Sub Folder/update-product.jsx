import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
const UpdateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
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
    fetchVendorData();
    fetchPackging();
    fetchSource();
  }, []);

  const addNewItem = () => {
    append({
      companyName: "",
      vendorId: "",
      vendorName: "",
      vendorEmail: "",
      vendorRole: "",
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
          vendorName: "",
          vendorEmail: "",
          vendorRole: "",
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

  useEffect(() => {
    axios
      .get(`${BASE_URL}/product/fetchProductEdit`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const productData = res.data[0];
          setValue("productCode", productData.product_code);
          setValue("productName", productData.product_name);
          setValue("productCategory", productData.product_category);
          setValue("clientCode", productData.client_code);
          setValue("packaging_id", productData.packaging_id);
          setValue("source_id", productData.source_id);
          setValue("remarks", productData.description);
          setValue("productThreshold", productData.threshold);
        }
      })
      .catch((err) => console.log(err));
  }, [id, setValue]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/productTagVendor/fetchProductVendor`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          setValue("items", []);
          res.data.forEach((vendor) => {
            append({
              companyName: vendor.vendor.company_name,
              vendorId: vendor.vendor.id,
              vendorName: `${vendor.vendor.fname} ${vendor.vendor.lname}`,
              vendorEmail: vendor.vendor.company_email,
              vendorCountry: vendor.vendor.company_country,
              vendorPrevPrice: vendor.previous_price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              vendorPrice: vendor.product_price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            });
          });
        }
      })
      .catch((err) => console.log(err));
  }, [id, append, setValue]);

  const update = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      swal({
        title: "Update this product?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = getValues();

          const formattedFormData = {
            ...formData,
            items: formData.items.map((item) => ({
              ...item,
              vendorPrice:
                parseFloat(String(item.vendorPrice).replace(/,/g, "")) || 0,
            })),
          };

          axios
            .put(`${BASE_URL}/product/updateProduct`, {
              id: id,
              ...formattedFormData,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Product updated successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/inventory/product-list");
                  window.scrollTo(0, 0);
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
            })
            .catch((error) => {
              // Handle Product Name Already Exists Error
              if (error.response && error.response.status === 409) {
                const wrapper = document.createElement("div");
                wrapper.classList.add("center-swal-text");
                wrapper.innerHTML =
                  "Please choose a unique name for the product to proceed.";
                swal({
                  icon: "error",
                  title: error.response.data.message,
                  content: wrapper,
                  button: "OK",
                });
                return;
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input

    let inputValue = value.replace(/[^0-9.]/g, "");

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
        {authrztn.includes("ProductList-Edit") ? (
          <>
            <Form noValidate validated={validated} onSubmit={update}>
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-3">
                    <Link
                      to="/inventory/product-list"
                      className="text-dark me-2"
                    >
                      <i class="fa-solid fa-arrow-left"></i>
                    </Link>
                    UPDATE PRODUCT
                  </span>
                </div>
              </div>

              <div className="p-2">
                <span className="text-decoration-underline">
                  GENERAL INFORMATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md">
                    <Form.Label htmlFor="productCode">Product Code</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      id="productCode"
                      {...register("productCode")}
                      readOnly
                    />
                  </div>

                  {/* <div className="col-md">
                    <Form.Label htmlFor="clientCode">Client Code</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Item Name"
                      id="clientCode"
                      {...register("clientCode")}
                      // required
                    />
                  </div> */}

                  <div className="col-md">
                    <Form.Label htmlFor="productName">Product Name</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Item Name"
                      id="productName"
                      {...register("productName")}
                      required
                    />
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="productCategory">
                      Product Category
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
                        type="number"
                        className="p-3"
                        id="productThreshold"
                        placeholder="Input quantity"
                        {...register("productThreshold")}
                        onKeyDown={(e) => {
                          ["-", "e", "+"].includes(e.key) && e.preventDefault();
                        }}
                        min={0}
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
                      <th className="p-2">Vendor</th>
                      <th className="p-2">Contact Person</th>
                      <th className="p-2">Company Email</th>
                      <th className="p-2">Country</th>
                      <th className="p-2">Previous Price</th>
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
                              }
                            }}
                          >
                            <option value="" disabled>
                              Select Vendor
                            </option>
                            {vendorData.map((data) => (
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
                            readOnly
                            {...register(`items.${index}.vendorPrevPrice`)}
                            className="p-2"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            onInput={onInputFloat}
                            required
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
              {authrztn.includes("ProductList-Edit") && (
                <div className="w-100 mb-3 d-flex flex-row align-items-end justify-content-end">
                  <button
                    className="btn btn-outline-secondary title-button mx-3"
                    onClick={() => {
                      navigate("/inventory/product-list");
                      window.scrollTo(0, 0);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary title-button">Save</button>
                </div>
              )}
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

export default UpdateProduct;
