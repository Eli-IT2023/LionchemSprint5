import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import "../../assets/css/lionchem.css";

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

const ReturnProducts = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(dummyReturnProductData);
  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);

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
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center mb-5">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">RETURN PRODUCTS</span>
        </div>

        <div className="d-flex flex-row align-items-center justify-content-center gap-2">
          <button
            onClick={() =>
              navigate("/delivery-management/return-product-details")
            }
            className="btn btn-primary d-flex align-items-center title-button"
          >
            Request Return
          </button>
        </div>
      </div>
      <div className="container-fluid ">
        <div className="row align-items-end">
          <div className="col-sm mb-3">
            <label htmlFor="status">Status</label>
            <select
              name="status"
              id="status"
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
          <div className="col-sm mb-3 d-flex align-items-end gap-2">
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    RETURN PRODUCT CODE
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    REQUESTOR
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    QUANTITY TO BE RETURNED
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    DATE CREATED
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    APPROVER
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
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    STATUS
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
                <tr
                  key={row.returnProductId}
                  onClick={() =>
                    navigate(
                      `/delivery-management/update-return-product-details/${row.returnProductId}`
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal size="xl" backdrop="static" show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>SCHEDULE DETAILS</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="container-fluid mb-3">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="scheduleId">
                    <Form.Label>Schedule ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.scheduleId || ""}
                      readOnly
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="deliveryDate">
                    <Form.Label>Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      readOnly={!enableEdit}
                      value={formData.deliveryDate || ""}
                      // onChange={(e) =>
                      //   setFormData({
                      //     ...formData,
                      //     deliveryDate: e.target.value,
                      //   })
                      // }
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row" style={{ minHeight: "150px" }}>
                <div className="col-md-6 d-flex flex-column h-100">
                  <Form.Group className="mb-3" controlId="totalQuantity">
                    <Form.Label>Total Quantity</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.totalQuantity || ""}
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="status">
                    <Form.Label>Status</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.status || ""}
                      readOnly
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="h-100" controlId="remarks">
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      style={{
                        height: "calc(86.5% - 24px)",
                        minHeight: "100px",
                      }}
                      value={formData.remarks || ""}
                      placeholder="Remarks"
                      readOnly
                    />
                  </Form.Group>
                </div>
              </div>
            </div>

            <div className="container-fluid mt-1">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted w-20 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Sales Invoice
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
                        className="text-muted w-20 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Customer Name
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
                        className="text-muted w-25 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Location
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
                        className="text-muted w-15 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Contact No.
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
                        className="text-muted w-10 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Total Ordered
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
                        className="text-muted w-10 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Quantity to Deliver
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
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummySalesInvoice.map((row) => (
                      <tr key={row.id} style={{ cursor: "pointer" }}>
                        <td
                          style={{ width: "20%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.salesInvoice}
                        </td>
                        <td
                          style={{ width: "20%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.customerName}
                        </td>
                        <td
                          style={{ width: "25%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.location}
                        </td>
                        <td
                          style={{ width: "15%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.contactNo}
                        </td>
                        <td
                          style={{ width: "10%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.totalOrdered}
                        </td>
                        <td
                          style={{ width: "10%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          <Form.Control
                            type="text"
                            value={row.quantityToDeliver}
                            readOnly={!enableEdit}
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="w-100 d-flex justify-content-end my-2">
              <button
                type="button"
                className="btn btn-secondary d-flex align-items-center title-button"
              >
                <i className="bx bx-plus fs-5"></i> New Item
              </button>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {isRowForApproval &&
            (!enableEdit ? (
              <Button variant="primary" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setEnableEdit(false)}>
                Save
              </Button>
            ))}
          <Button variant="danger">Reject</Button>
          <Button variant="success">Approve</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReturnProducts;
