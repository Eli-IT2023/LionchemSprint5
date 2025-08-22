import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";
import dayjs from "dayjs";

const dummySalesInvoice = [
  {
    id: 1,
    salesInvoice: "SI-2023-001",
    customerName: "John Doe",
    location: "New York",
    contactNo: "123-456-7890",
    totalOrdered: 100,
    quantityToDeliver: 20,
  },
  {
    id: 2,
    salesInvoice: "SI-2023-002",
    customerName: "Jane Smith",
    location: "Los Angeles",
    contactNo: "234-567-8901",
    totalOrdered: 150,
    quantityToDeliver: 30,
  },
  {
    id: 3,
    salesInvoice: "SI-2023-003",
    customerName: "Bob Johnson",
    location: "Chicago",
    contactNo: "345-678-9012",
    totalOrdered: 200,
    quantityToDeliver: 20,
  },
];

const dummyReturnProductData = [
  {
    returnProductId: "RTRN-20250616101219484",
    requestor: "John Smith",
    quantityToBeReturned: 150,
    dateCreated: "2023-05-15",
    approver: "Jane Doe",
    status: "To Review",
    returnProductDetails: [
      {
        scheduleId: "SCHD-1",
        salesInvoice: "SI-2023-001",
        customerName: "John Doe",
        productCode: "PD-001",
        productName: "Product A",
        totalOrdered: 100,
        totalReceived: 80,
      },
      {
        scheduleId: "SCHD-2",
        salesInvoice: "SI-2023-002",
        customerName: "Jane Smith",
        productCode: "PD-002",
        productName: "Product B",
        totalOrdered: 150,
        totalReceived: 120,
      },
      {
        scheduleId: "SCHD-3",
        salesInvoice: "SI-2023-003",
        customerName: "Bob Johnson",
        productCode: "PD-003",
        productName: "Product C",
        totalOrdered: 200,
        totalReceived: 180,
      },
    ],
  },
  {
    returnProductId: "RTRN-20250616101219485",
    requestor: "Mike Johnson",
    quantityToBeReturned: 200,
    dateCreated: "2025-05-18",
    approver: "Sarah Williams",
    status: "Disposed",
    returnProductDetails: [
      {
        scheduleId: "SCH-002",
        salesInvoice: "",
        customerName: "",
        productCode: "",
        productName: "",
        totalOrdered: 200,
        totalReceived: 200,
        returnQuantity: 0,
      },
    ],
  },
  {
    returnProductId: "RTRN-20250616101219486",
    requestor: "Emily Davis",
    quantityToBeReturned: 75,
    dateCreated: "2025-05-20",
    approver: "Robert Brown",
    status: "Transferred",
    returnProductDetails: [
      {
        scheduleId: "SCH-002",
        salesInvoice: "",
        customerName: "",
        productCode: "",
        productName: "",
        totalOrdered: 200,
        totalReceived: 200,
        returnQuantity: 0,
      },
    ],
  },
];

const TaxReport = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(dummyReturnProductData);
  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  // Dummy data for filters
  const [filterApprover, setFilterApprover] = useState("");
  const [filterRequestor, setFilterRequestor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [formData, setFormData] = useState({
    id: "",
    scheduleId: "",
    requestor: "",
    batchNo: "",
    approvedBy: "",
    totalQuantity: "",
    dateRequested: "",
    deliveryDate: "",
    status: "",
  });

  // Dummy handlers
  const handleFilter = () => {
    // handle filter here
  };

  const handleClearFilter = () => {
    setFilterApprover("");
    setFilterRequestor("");
    setFilterStatus("");
    setSearchText("");
    setFilterColumn("all");
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleShow = (data, isRowForApproval) => {
    if (data !== null) {
      setFormData({
        id: data.id,
        scheduleId: data.scheduleId,
        requestor: data.requestor,
        batchNo: data.batchNo,
        approvedBy: data.approvedBy,
        totalQuantity: data.totalQuantity,
        dateRequested: data.dateRequested,
        deliveryDate: data.deliveryDate,
        status: data.status,
      });
    }
    setShowModal(true);
    setEnableEdit(false);
    setIsRowForApproval(isRowForApproval);
  };

  const handleClose = () => {
    setShowModal(false);
    setEnableEdit(false);
    setIsRowForApproval(false);
    setFormData({
      id: "",
      scheduleId: "",
      requestor: "",
      batchNo: "",
      approvedBy: "",
      totalQuantity: "",
      dateRequested: "",
      deliveryDate: "",
      status: "",
    });
  };

  const handleEdit = () => {
    setEnableEdit(true);
  };

  const deleteRow = (id) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">WITHHOLDING TAX REPORT</span>
        </div>
      </div>
      <div className="container-fluid ">
        <div className="row">
          <div className="col">
            <div className="py-3">
              <strong>Withholding Tax Summary</strong>
            </div>
          </div>
        </div>
        <div className="row align-items-end">
          <div className="col-md-3 col-sm-6 mb-3">
            <label htmlFor="date">Date</label>
            <input
              value={month}
              type="month"
              name="date"
              id="date"
              className="form-control"
            />
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <label htmlFor="customerSupplier">Customer/Supplier</label>
            <select
              name="customerSupplier"
              id="customerSupplier"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">e.g. Supplier A</option>
              {["To Review", "Transferred", "Disposed"].map((status, index) => (
                <option key={index} value={index}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <label htmlFor="transactionType">Transaction Type</label>
            <select
              name="transactionType"
              id="transactionType"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Select</option>
              {["To Review", "Transferred", "Disposed"].map((status, index) => (
                <option key={index} value={index}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 d-flex justify-content-end align-items-end gap-2">
            <button
              type="button"
              className="btn btn-dark"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleFilter}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-light border"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col mb-2">
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
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "approvedBy" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("approvedBy")}
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
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_needed" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("dateRequested")}
                  >
                    Date Needed
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* New Table */}
      <div className="container-fluid mt-1">
        <div className="table-responsive">
          <table className="table table-hover" id="scheduleTable">
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Transaction ID
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Customer/Supplier
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>

                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Tax Type
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Gross Amount
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Withholding Tax Deduction
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Status
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    Date
                    <span className="d-flex flex-column mx-2">
                      <i
                        className="fa-solid fa-chevron-up"
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.returnProductId} style={{ cursor: "pointer" }}>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.returnProductId}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.requestor}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.quantityToBeReturned}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.dateCreated}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.approver}
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        color:
                          row.status === "Transferred"
                            ? "#198754" // green
                            : row.status === "On-Schedule"
                            ? "#6f42c1" // violet
                            : row.status === "To Review"
                            ? "#e89c4a" // orange
                            : row.status === "Disposed"
                            ? "#dc3545" // red
                            : row.status === "Partial Deliver"
                            ? "#ffc107" // yellow
                            : "#6c757d", // gray/secondary
                        fontWeight: 600,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    {row.dateCreated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="col-6 gap-3 d-flex flex-row g-2 align-items-end ms-1 w-100">
        <button className="btn btn-outline-danger">
          {" "}
          <i className="fa-solid fa-upload me-1"></i> Export to PDF
        </button>
        <button className="btn btn-outline-success">
          <i className="fa-solid fa-download me-1"></i> Export to Excel
        </button>
      </div>
    </div>
  );
};

export default TaxReport;
