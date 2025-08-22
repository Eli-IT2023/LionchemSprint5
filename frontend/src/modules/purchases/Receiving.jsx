import { React, useState, useEffect } from "react";
import { Form, Carousel } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import "../../assets/css/lionchem.css";
import Logo from "../../assets/img/ELI LOGO.png";

import generatePDF from "../purchases/Sub Folder/ReceivedPDF";

import generateExcel from "../purchases/Sub Folder/ReceivedExcel";

import * as XLSX from "xlsx";
const Receiving = ({ authrztn, roleType }) => {
  const navigate = useNavigate();

  // export
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Table state
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/Receiving/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterVendor, setFilterVendor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateReceived, setFilterDateReceived] = useState("");

  // PO Report Modal states
  const [showPOReport, setShowPOReport] = useState(false);
  const [currentPoId, setCurrentPoId] = useState(null);
  const [receivingHistory, setReceivingHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [poReportData, setPoReportData] = useState(null);

  // Fetch vendor data
  const [vendorData, setVendorData] = useState([]);
  const fetchVendor = () => {
    axios
      .get(BASE_URL + "/Receiving/getVendor")
      .then((res) => {
        if (res.data.success && res.data.data) {
          setVendorData(res.data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching vendors:", error);
      });
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  // Fetch PO report data when a row is clicked
  const fetchPOReportData = async (poId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchPOReportTab/${poId}`
      );
      const data = response.data;

      if (data.success && data.data) {
        setReceivingHistory(data.data.rh_receiving_id || []);
        setPoReportData(data.data);

        // Fetch detailed data for the first item
        if (data.data.rh_receiving_id && data.data.rh_receiving_id.length > 0) {
          fetchPOReportTabData(poId, data.data.rh_receiving_id[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching PO report:", error);
      swal("Error", "Failed to load PO report data", "error");
    }
  };

  const fetchPOReportTabData = async (poId, historyId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchPOReportTabData/${historyId}`
      );
      const data = response.data;

      if (data.success && data.data) {
        // Update the specific history item with detailed data
        setReceivingHistory((prev) =>
          prev.map((item) =>
            item.id === historyId ? { ...item, details: data.data } : item
          )
        );
      }
    } catch (error) {
      console.error("Error fetching PO report tab data:", error);
    }
  };

  const handleShow = (poId) => {
    setCurrentPoId(poId);
    setShowPOReport(true);
    fetchPOReportData(poId);
  };

  const handleClose = () => {
    setShowPOReport(false);
    setCurrentPoId(null);
    setReceivingHistory([]);
    setActiveIndex(0);
    setPoReportData(null);
  };

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
    if (receivingHistory[selectedIndex]) {
      fetchPOReportTabData(currentPoId, receivingHistory[selectedIndex].id);
    }
  };

  // ### filter start
  const clearDataInputs = () => {
    setFilterVendor("All");
    setFilterStatus("All");
    setFilterDateReceived("");
    setSearchText("");
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/Receiving/fetchFilteredData");
    pagination.updateParams({
      filterVendor,
      filterStatus,
    }); // method use to pass to the router
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/Receiving/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/Receiving/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/Receiving/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
        filterStatus: filterStatus || "All", // Ensure default value
      });
    }
  };

  // ### Filter end ###

  // Render PO Report content for a specific history item
  const renderPOReportContent = (historyItem) => {
    if (!historyItem || !historyItem.details) return null;

    const details = historyItem.details;
    const receivingDate = details.createdAt
      ? new Date(details.createdAt).toISOString().split("T")[0]
      : "N/A";

    const poRequestDate = details.rh_receiving_id?.receiving_po_id?.po_pr_id
      ?.createdAt
      ? new Date(details.rh_receiving_id?.receiving_po_id?.po_pr_id?.createdAt)
          .toISOString()
          .split("T")[0]
      : "N/A";

    const vendor = details.rh_receiving_id?.receiving_po_id?.po_vendor;
    const vendorName =
      vendor?.fname && vendor?.lname
        ? `${vendor.fname} ${vendor.lname}`
        : vendor?.company_name || "N/A";

    const requestor =
      details.rh_receiving_id?.receiving_po_id?.po_pr_id?.requestor;
    const requestorName =
      requestor?.fname && requestor?.lname
        ? `${requestor.fname} ${requestor.lname}`
        : "N/A";

    const receivedBy = details.rh_received_by;
    const receivedByName =
      receivedBy?.fname && receivedBy?.lname
        ? `${receivedBy.fname} ${receivedBy.lname}`
        : "N/A";

    return (
      <div className="w-100">
        <div className="w-100 d-flex flex-row justify-content-between">
          <div className="d-flex flex-row" style={{ maxWidth: "700px" }}>
            <div>
              <img
                src={settings?.logo || Logo}
                alt="Report Logo"
                className="img-fluid"
                style={{ maxHeight: "130px" }}
              />
            </div>
            <div className="d-flex flex-column px-1">
              <span className="fw-semibold fs-5">
                {settings?.company_name || "E-Logic Innovations"}
              </span>
              <span>
                <strong>Address: </strong>
                <span>
                  {settings?.company_address ||
                    "2nd Floor Unit B ARCA Corporate Center, 150 F. Dela Cruz Street Cor. Maysan Road, Brgy Maysan, Valenzuela, Philippines"}
                </span>
              </span>
              <span>
                <strong>Landline: </strong>
                <span>{settings?.landline || "(02)  8659 8685"}</span>
              </span>
              <span>
                <strong>Email: </strong>
                <span>{settings?.email || "admin@elogicinnovations.com"}</span>
              </span>
            </div>
          </div>
          <div className="d-flex flex-column text-end">
            <span>
              Date Received:{" "}
              {new Date(receivingDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>
              P.O Request Date:{" "}
              {new Date(poRequestDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="w-100 d-flex align-items-center">
          <hr className="flex-grow-1" />
        </div>
        <span className="fs-5">P.O Receiving Report</span>

        <div className="w-100 d-flex flex-row justify-content-between mt-3 mb-3">
          <div className="d-flex flex-column">
            <span>
              <strong>Vendor Name: </strong>
              <span>{vendorName}</span>
            </span>
            <span>
              <strong>P.O Number: </strong>
              <span>
                {details.rh_receiving_id?.receiving_po_id?.po_number || "N/A"}
              </span>
            </span>
            <span className="mt-2">
              <strong>Duty & Customs: </strong>
              <span>
                {(
                  parseFloat(historyItem.details.duty_custom) || 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
            <span>
              <strong>Shipping Fee: </strong>
              <span>
                {(
                  parseFloat(historyItem.details.shipping_fee) || 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>
          <div className="d-flex flex-column align-items-end">
            <span>
              <strong>Received By: </strong>
              <span>{receivedByName}</span>
            </span>
            <span>
              <strong>Requestor: </strong>
              <span>{requestorName}</span>
            </span>
          </div>
        </div>

        <span className="fs-5 fw-bold">
          Receiving Report No: {details.rr_no || "N/A"}
        </span>

        <div className="w-100 mt-3">
          <table className="table">
            <thead>
              <tr>
                <th style={{ background: "#DBDFE4", color: "#29292A" }}>
                  PRODUCT CODE
                </th>
                <th style={{ background: "#DBDFE4", color: "#29292A" }}>
                  PRODUCT NAME
                </th>
                <th style={{ background: "#DBDFE4", color: "#29292A" }}>UOM</th>
                <th
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                  className={roleType?.includes("Management") ? "" : "d-none"}
                >
                  UNIT PRICE
                </th>
                <th style={{ background: "#DBDFE4", color: "#29292A" }}>
                  QUANTITY RECEIVED
                </th>

                <th style={{ background: "#DBDFE4", color: "#29292A" }}>
                  REMARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {historyItem.details?.receiving_product_orders?.length > 0 ? (
                historyItem.details.receiving_product_orders.map(
                  (product, idx) => (
                    <tr key={idx}>
                      <td>
                        {product.rpo_vendor_product_id?.po_vendor_product_id
                          ?.product_code || "N/A"}
                      </td>
                      <td>
                        {product.rpo_vendor_product_id?.po_vendor_product_id
                          ?.product_name || "N/A"}
                      </td>
                      <td>
                        {product.rpo_vendor_product_id?.po_vendor_product_id
                          ?.prod_packaging?.packaging_name || "N/A"}
                      </td>
                      <td
                        className={
                          roleType?.includes("Management") ? "" : "d-none"
                        }
                      >
                        {(
                          parseFloat(product.rpo_vendor_product_id?.price) || 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {(
                          parseFloat(product.quantity_received) || 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td>{product.rpo_vendor_product_id?.remarks || ""}</td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-3">
                    No products received in this transaction
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">RECEIVING</span>
          {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
        </div>

        <div className="d-none">
          <button
            onClick={() => navigate("/purchases/create-purchase-request")}
            className="btn btn-primary d-flex align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </button>
        </div>
      </div>

      <div className="container-fluid mt-5">
        <div className="row align-items-end">
          <div className="col-sm mb-3">
            <label htmlFor="vendor">Vendor</label>
            <select
              name="vendor"
              id="vendor"
              className="form-select"
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
            >
              <option value="">Select Vendor</option>
              {Array.isArray(vendorData) &&
                vendorData.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {[vendor.fname, vendor.lname].filter(Boolean).join(" ") ||
                      vendor.company_name ||
                      "Unnamed Vendor"}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="status">Status</label>
            <select
              name=""
              id="status"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="" selected>
                Select Status
              </option>
              <option value="All">All Status</option>
              <option value="For-Receiving">For-Receiving</option>
              <option value="Partial-Received">Partial-Received</option>
              <option value="Received">Received</option>
            </select>
          </div>
          <div className="col-sm mb-3 d-none">
            <label htmlFor="dateReceived">Date Received</label>
            <input
              type="date"
              name=""
              id="dateReceived"
              className="form-control"
              value={filterDateReceived}
              onChange={(e) => setFilterDateReceived(e.target.value)}
            />
          </div>
          <div className="col-sm mb-3 d-flex flex-row ">
            <button
              type="button"
              className="btn btn-dark"
              onClick={handleFilter}
            >
              Apply Filter
            </button>

            <button
              className="btn btn-light border mx-2"
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
          <div className="col-sm mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
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
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "id" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("id")}
                  >
                    PO NO.
                  </button>
                </li>
                <li className="d-none">
                  <button
                    className={`dropdown-item ${
                      filterColumn === "pr_no" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("pr_no")}
                  >
                    PR NO.
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "requestedBy" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("requestedBy")}
                  >
                    Requestor
                  </button>
                </li>
                <li className="d-none">
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_needed" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_needed")}
                  >
                    Date Needed
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="table-responsive data-table scrollable-contents">
          <table
            className="table table-hover table-responsive "
            id="receivingTable"
          >
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PO NO.
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  REQUESTOR
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  VENDOR
                  <i className="fas fa-sort ms-1"></i>
                </th>
                {/* <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  RECEIVED BY
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  DATE RECEIVED
                  <i className="fas fa-sort ms-1"></i>
                </th> */}
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  REMARKS
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
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
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="7" className="text-center text-danger py-4">
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
                  const vendor = item.po_vendor;
                  const vendorName =
                    vendor?.fname && vendor?.lname
                      ? `${vendor.fname} ${vendor.lname}`
                      : vendor?.company_name || "N/A";

                  const requestor = item.po_pr_id?.requestor;
                  const requestorName =
                    requestor?.fname && requestor?.lname
                      ? `${requestor.fname} ${requestor.lname}`
                      : "N/A";

                  const formattedDate = item.po_pr_id?.date_needed
                    ? new Date(item.po_pr_id.date_needed).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "2-digit",
                        }
                      )
                    : "N/A";

                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        item.receiving_po_id?.status === "Received"
                          ? handleShow(item.id)
                          : navigate(`/purchases/receiving-view/${item.id}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>{item.po_number}</td>
                      <td>{requestorName}</td>
                      <td>{vendorName}</td>
                      {/* <td>{receiverName}</td> */}
                      {/* <td>{formatttedReceivedAt}</td> */}
                      <td>{item.po_pr_id?.remarks}</td>
                      <td>
                        <span
                          className="poPaymentStatus"
                          style={{
                            backgroundColor:
                              item.receiving_po_id?.status === "Received"
                                ? "#EBFFEC"
                                : item.receiving_po_id?.status ===
                                    "For-Receiving" ||
                                  item.receiving_po_id?.status ===
                                    "Partial-Received"
                                ? "#E4F0FF"
                                : "#E4F0FF",
                            color:
                              item.receiving_po_id?.status === "Received"
                                ? "#1D8F22"
                                : item.receiving_po_id?.status ===
                                    "For-Receiving" ||
                                  item.receiving_po_id?.status ===
                                    "Partial-Received"
                                ? "#3D96FF"
                                : "#3D96FF",

                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "500",
                            display: "inline-block",
                            minWidth: "70px",
                            textAlign: "center",
                          }}
                        >
                          {item.receiving_po_id?.status || "N/A"}
                        </span>
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

      <Modal
        show={showPOReport}
        onHide={handleClose}
        backdrop="static"
        dialogClassName="receiving-pdf-custom-modal-width"
      >
        <Modal.Header
          className="border-bottom p-0 p-2 px-3"
          style={{ background: "#EEEEEE" }}
          closeButton
        >
          <span className="fw-semibold" style={{ fontSize: "15px" }}>
            Generation Report{" "}
            {receivingHistory.length > 1 &&
              `(${activeIndex + 1}/${receivingHistory.length})`}
          </span>
        </Modal.Header>
        <Modal.Body>
          {receivingHistory.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading report data...</p>
            </div>
          ) : (
            <Carousel
              activeIndex={activeIndex}
              onSelect={handleSelect}
              interval={null}
              indicators={receivingHistory.length > 1}
              controls={receivingHistory.length > 1}
              prevIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-prev-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginLeft: "-150px", // Pull it to the left edge
                  }}
                />
              }
              nextIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-next-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginRight: "-150px", // Pull it to the right edge
                  }}
                />
              }
            >
              {receivingHistory.map((historyItem, index) => (
                <Carousel.Item key={historyItem.id}>
                  <div className="w-100 p-2 px-5" id="contentSlide">
                    {renderPOReportContent(historyItem)}
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Modal.Body>
        <Modal.Footer className="p-0 border-top p-2">
          {roleType?.includes("Management") &&
            authrztn?.includes("Receiving-IE") && (
              <>
                <Button
                  variant="danger"
                  onClick={() =>
                    generatePDF(receivingHistory[activeIndex], settings)
                  }
                >
                  Export to PDF
                </Button>
                <Button
                  variant="success"
                  onClick={() =>
                    generateExcel(receivingHistory[activeIndex], settings)
                  }
                >
                  Export to Excel
                </Button>
              </>
            )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Receiving;
