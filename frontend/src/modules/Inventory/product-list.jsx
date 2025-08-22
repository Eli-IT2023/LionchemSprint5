import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import productUnits from "../../assets/global/unitofmeasure";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import {
  Plus,
  FadersHorizontal,
  MagnifyingGlass,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
const ProductList = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchFunction, setSearchFunction] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
  const [showChangeStatusButton, setShowChangeStatusButton] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectStatusFilter, setSelectStatusFilter] = useState("All");
  const [filterColumn, setFilterColumn] = useState("all");
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/product/getProductDataLio"
  );
  const [packaging_data, setPackagingData] = useState([]);
  const [filterPackage, setFilterPackage] = useState("All");
  const [filterPriceMin, setFilterPriceMin] = useState("0");
  const [filterPriceMax, setFilterPriceMax] = useState("0");
  const handleCloseStatusModal = () => setShowChangeStatusModal(false);
  const handleShowChangeStatusModal = () => setShowChangeStatusModal(true);

  const pagination = useServerPagination(paginationUrl, 10);

  //fetching of product Data
  const reloadProduct = async () => {
    setPaginationUrl(BASE_URL + "/product/getProductDataLio");
    pagination.updateParams({});
    setIsLoading(false);
  };

  const reloadPackaging = async () => {
    const res = await axios.get(`${BASE_URL}/product/getPackagingData`);
    setPackagingData(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadPackaging();
      reloadProduct();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // useEffect(() => {
  //   setProductData(pagination.data);
  //   setFilteredProductData(pagination.data);
  // }, [pagination.data]);

  // useEffect(() => {
  //   reloadProduct(selectStatusFilter);
  // }, [searchFunction]);

  // useEffect(() => {
  //   setSearchFunction("");
  // }, [filterColumn]);
  //end

  const handleCheckboxChange = (productId) => {
    const updatedCheckboxes = [...selectedCheckboxes];

    if (updatedCheckboxes.includes(productId)) {
      updatedCheckboxes.splice(updatedCheckboxes.indexOf(productId), 1);
    } else {
      updatedCheckboxes.push(productId);
    }

    setSelectedCheckboxes(updatedCheckboxes);
    setShowChangeStatusButton(updatedCheckboxes.length > 0);
  };

  const handleSelectAllChange = () => {
    const allProductIds = pagination.data.map((data) => data.product_id);

    if (allProductIds.length === 0) {
      // No data, disable the checkbox
      return;
    }

    if (selectedCheckboxes.length === allProductIds.length) {
      setSelectedCheckboxes([]);
      setShowChangeStatusButton(false);
      setSelectAllChecked(false);
    } else {
      setSelectedCheckboxes(allProductIds);
      setShowChangeStatusButton(true);
      setSelectAllChecked(true);
    }
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleSave = () => {
    axios
      .put(BASE_URL + "/product/statusupdate", {
        productIds: selectedCheckboxes,
        status: selectedStatus,
      })
      .then((res) => {
        if (res.status === 200) {
          swal({
            title: "Product Status Update!",
            text: "The product status has been updated successfully.",
            icon: "success",
            button: "OK",
          }).then(() => {
            handleCloseStatusModal();
            reloadProduct(selectStatusFilter);
            setSelectAllChecked(false);
            setSelectedCheckboxes([]);
            setShowChangeStatusButton(false);
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchFunction(value);
    setPaginationUrl(BASE_URL + "/product/getProductDataSearchBarLio");
    pagination.updateParams({ filterColumn, searchFunction: value });
    // setIsLoading(false);
  };

  const applyFilter = () => {
    setSearchFunction("");

    setPaginationUrl(BASE_URL + "/product/getProductDataFilterLio");
    pagination.updateParams({
      filterPackage,
      selectStatusFilter,
      filterPriceMin,
      filterPriceMax,
    });
  };

  const clearFilter = () => {
    setSearchFunction("");
    setSelectStatusFilter("All");
    setFilterPackage("All");
    setFilterPriceMin("0");
    setFilterPriceMax("0");
    reloadProduct();
  };

  // const filterData = (data, searchQuery, statusFilter) => {
  //   let filteredData = data;

  //   if (statusFilter == "") {
  //     filteredData = filteredData.filter((item) => {
  //       return item.status !== "Archive";
  //     });
  //   }

  //   if (statusFilter && statusFilter !== "All Status") {
  //     filteredData = filteredData.filter(
  //       (item) => item.status === statusFilter
  //     );
  //   }

  //   filteredData = filteredData.filter(
  //     (item) =>
  //       item.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       item.product_category
  //         .toLowerCase()
  //         .includes(searchQuery.toLowerCase()) ||
  //       item.unit_of_measure
  //         .toLowerCase()
  //         .includes(searchQuery.toLowerCase()) ||
  //       (item.product_price &&
  //         item.product_price
  //           .toString()
  //           .toLowerCase()
  //           .includes(searchQuery.toLowerCase()))
  //   );

  //   setFilteredProductData(filteredData);
  // };

  const handleUpdateProductModal = (row) => {
    navigate(`/inventory/update-product/${row.product_id}`);
  };

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAllChange}
          checked={selectAllChecked}
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedCheckboxes.includes(row.product_id)}
          onChange={() => handleCheckboxChange(row.product_id)}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: "Product ID",
      selector: (row) => row.product_code,
    },
    {
      name: "Product Name",
      selector: (row) => row.product_name,
    },
    {
      name: "Product Category",
      selector: (row) => row.product_category,
    },
    {
      name: "Packaging",
      selector: (row) => row.prod_packaging.packaging_name,
    },
    {
      name: "Average Price",
      selector: (row) => row.averageProductPrice,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;

        switch (row.status) {
          case "Active":
            color = "#32CD32";
            break;
          case "Inactive":
            color = "#FF0000";
            break;
          case "Archive":
            color = "#808080";
            break;
          default:
            color = "initial";
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: color,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {row.status}
          </div>
        );
      },
    },
  ];

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
        ) : authrztn.includes("ProductList-View") ? (
          <>
            <div className="w-100 p-2 d-flex flex-row justify-content-between">
              <div className="d-flex flex-column title-custom">
                <span className="fs-3">PRODUCT LIST</span>
              </div>

              <div>
                {authrztn.includes("ProductList-Edit") &&
                showChangeStatusButton ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleShowChangeStatusModal}
                  >
                    <ArrowsClockwise size={32} color="#f2f2f2" /> Change Status
                  </button>
                ) : authrztn.includes("ProductList-Add") ? (
                  <Link
                    to="/inventory/create-product"
                    className="btn btn-primary d-flex align-items-center title-button"
                  >
                    {/* <span>
                      <Plus size={32} color="#f2f2f2" />
                    </span> */}
                    <i className="bx bx-plus fs-5"></i>
                    Create
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="row g-3 align-items-end">
              {/* Package */}
              <div className="col-md-2">
                <label className="form-label fw-semibold">Package</label>
                <select
                  className="form-select"
                  value={filterPackage}
                  onChange={(e) => setFilterPackage(e.target.value)}
                >
                  <option value="" disabled>
                    Select Package
                  </option>
                  <option value="All">All Package</option>
                  {packaging_data.map((prod_packaging) => (
                    <option key={prod_packaging.id} value={prod_packaging.id}>
                      {prod_packaging.packaging_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="col-md-2">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={selectStatusFilter}
                  onChange={(e) => setSelectStatusFilter(e.target.value)}
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archive">Archive</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Price Range</label>
                <div className="d-flex gap-2 align-items-center border rounded px-3 py-2 justify-content-between">
                  <div className="d-flex align-items-center gap-1">
                    <span>Min</span>
                    <input
                      type="number"
                      className="form-control form-control-sm w-75"
                      min="0"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value)}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span>Max</span>
                    <input
                      type="number"
                      className="form-control form-control-sm w-75"
                      min={filterPriceMin}
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="col-md-3 d-flex gap-2">
                <button className="btn btn-dark w-100" onClick={applyFilter}>
                  Apply Filter
                </button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button>
              </div>

              {/* Search with Filter */}
              <div className="col-md-2">
                <label className="form-label fw-semibold"></label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchFunction}
                    onChange={handleSearchChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary dropdown-toggle-split"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fa-solid fa-sliders"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "all" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("all")}
                      >
                        All
                      </button>
                    </li>
                    {[
                      { value: "product_code", label: "Product ID" },
                      { value: "product_name", label: "Product Name" },
                      { value: "product_category", label: "Product Category" },
                      // { value: "packaging.packaging_name", label: "Packaging" },
                    ].map(({ value, label }) => (
                      <li key={value}>
                        <button
                          className={`dropdown-item ${
                            filterColumn === value ? "active" : ""
                          }`}
                          onClick={() => setFilterColumn(value)}
                        >
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* <div className="w-100 mt-3 container-fluid">
              <div className="input-group">
                <span className="input-group-text bg-body" id="basic-addon2">
                  <MagnifyingGlass size={32} color="#969696" />
                </span>
                <input
                  type="text"
                  className="form-control p-2"
                  placeholder="Search"
                  onChange={handleSearchChange}
                  value={searchFunction}
                />
                <span className="input-group-text bg-body" id="basic-addon2">
                  <FadersHorizontal size={32} />
                </span>
              </div>
            </div> */}

            {/* <div className="row mx-0 mt-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchFunction}
                  onChange={handleSearchChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("all")}
                    >
                      All
                    </button>
                  </li>
                  {[
                    { value: "product_code", label: "Product ID" },
                    { value: "product_name", label: "Product Name" },
                    { value: "product_category", label: "Product Category" },
                    { value: "packaging.packaging_name", label: "Packaging" },
                  ].map(({ value, label }) => (
                    <li key={value}>
                      <button
                        className={`dropdown-item ${
                          filterColumn === value ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn(value)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div> */}

            <div className="w-100 mt-3 container-fluid">
              {/* <DataTable
                columns={columns}
                data={pagination.data}
                customStyles={customStyles}
                className="dataTable"
                onRowClicked={handleUpdateProductModal}
              /> */}
              <div className="table-responsive data-table scrollable-contents">
                <table
                  className="table table-hover table-responsive "
                  id="productListTable"
                >
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          onChange={handleSelectAllChange}
                          checked={selectAllChecked}
                        />
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT ID
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT NAME
                        <i className="fas fa-sort ms-1"></i>
                      </th>

                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT CATEGORY
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PACKAGING
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        AVERAGE PRICE
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        STATUS
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex justify-content-center align-items-center">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <span className="ms-2">Loading data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pagination.error ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center text-danger py-4"
                        >
                          <div className="d-flex flex-column align-items-center">
                            <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                            <span>Error loading data</span>
                            <small className="text-muted mt-1">
                              {pagination.error.message}
                            </small>
                          </div>
                        </td>
                      </tr>
                    ) : pagination.data.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span>No data available</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagination.data.map((item, index) => {
                        return (
                          <tr
                            onClick={() => handleUpdateProductModal(item)}
                            style={{
                              cursor: "pointer",
                            }}
                            key={item.id}
                          >
                            <td className="text-center">
                              <input
                                style={{
                                  cursor: "pointer",
                                }}
                                type="checkbox"
                                checked={selectedCheckboxes.includes(
                                  item.product_id
                                )}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxChange(item.product_id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="text-center">
                              {item.product_code || "--"}
                            </td>
                            <td className="text-center">
                              {item.product_name || "--"}
                            </td>
                            <td className="text-center">
                              {item.product_category || "--"}
                            </td>
                            <td className="text-center">
                              {item.prod_packaging.packaging_name || "--"}
                            </td>
                            <td className="text-center">
                              {item.averageProductPrice || "--"}
                            </td>
                            <td
                              className="text-center"
                              style={{
                                padding: "5px 10px",
                                borderRadius: "5px",
                                color:
                                  item.status === "Active"
                                    ? "#32CD32"
                                    : item.status === "Inactive"
                                    ? "#FF0000"
                                    : item.status === "Archive"
                                    ? "#808080"
                                    : "#initial",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                textTransform: "uppercase",
                                fontWeight: "bold",
                              }}
                            >
                              {item.status}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls {...pagination} />
            </div>
          </>
        ) : (
          <div className="no-access">
            <img src={NoAccess} alt="NoAccess" className="no-access-img" />
            <h3>You don't have access to this function.</h3>
          </div>
        )}
      </div>

      {/* status update  */}
      <Modal
        size="md"
        show={showChangeStatusModal}
        onHide={handleCloseStatusModal}
        backdrop="static"
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "24px" }}>Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="exampleForm.ControlInput2">
            <Form.Label style={{ fontSize: "20px" }}>Status</Form.Label>
            <Form.Select
              style={{ height: "40px", fontSize: "15px" }}
              onChange={handleStatusChange}
              value={selectedStatus}
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archive">Archive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-warning"
            onClick={handleSave}
            style={{ fontSize: "20px" }}
          >
            Save
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleCloseStatusModal}
            style={{ fontSize: "20px" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductList;
