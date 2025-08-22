import { React, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Form } from "react-bootstrap";
import { Modal, Button } from "react-bootstrap";

const dummySalesInvoice = [
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

const ReturnProductDetails_Update = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [totalReturnQty, setTotalReturnQty] = useState(0);
  const [returnID, setReturnID] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState("");

  const generateReturnID = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    const generatedReturnID = `RTRN-${datetimeStr}${randomNum}`;
    setReturnID(generatedReturnID);
  };

  useEffect(() => {
    generateReturnID();
  }, []);

  useEffect(() => {
    if (id) {
      const returnDetails = dummyReturnProductData.find(
        (item) => item.returnProductId === id
      )?.returnProductDetails;

      setRows(returnDetails);
    }
  }, [id]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleShow = () => {
    // Set selectedRows to the scheduleIds of rows already in the table
    const existingIds = rows.map((row) => row.scheduleId);
    setSelectedRows(existingIds);

    // Set selectAll if all dummy items are already in the table
    setSelectAll(existingIds.length === dummySalesInvoice.length);

    setShowModal(true);
    setEnableEdit(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setEnableEdit(false);
    setIsRowForApproval(false);
    setSelectAll(false);
  };

  const handleEdit = () => {
    setEnableEdit(true);
  };

  // Handle individual checkbox change
  const handleRowSelect = (rowId) => {
    let newSelectedRows;
    if (selectedRows.includes(rowId)) {
      newSelectedRows = selectedRows.filter((id) => id !== rowId);
    } else {
      newSelectedRows = [...selectedRows, rowId];
    }
    setSelectedRows(newSelectedRows);

    // Update selectAll state
    setSelectAll(newSelectedRows.length === dummySalesInvoice.length);
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    setSelectedRows(
      isChecked ? dummySalesInvoice.map((row) => row.scheduleId) : []
    );
  };

  const handleConfirm = () => {
    // Get all rows that should be in the table (selected in modal)
    const newRows = dummySalesInvoice
      .filter((row) => selectedRows.includes(row.scheduleId))
      .map((row) => ({
        ...row,
        returnQuantity:
          rows.find((r) => r.scheduleId === row.scheduleId)?.returnQuantity ||
          0,
      }));

    setRows(newRows);
    handleClose();

    // Calculate total return quantity
    const newTotal = newRows.reduce((sum, row) => {
      return sum + (row.returnQuantity || 0);
    }, 0);
    setTotalReturnQty(newTotal);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/delivery-management/return-products")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">RETURN PRODUCT DETAILS</span>
          </span>
        </div>
      </div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6">
            <Form.Group className="mb-3" controlId="scheduleId">
              <Form.Label>Return ID</Form.Label>
              <Form.Control type="text" value={id} readOnly />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group className="mb-3" controlId="moveTo">
              <Form.Label>Move to</Form.Label>
              <Form.Select disabled aria-label="Move To">
                <option>Inventory</option>
              </Form.Select>
            </Form.Group>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <Form.Group className="mb-3" controlId="totalQuantity">
              <Form.Label>Total Quantity</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Quantity"
                value={totalReturnQty}
                readOnly
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group className="mb-3" controlId="remarks">
              <Form.Label>Remarks</Form.Label>
              <Form.Control type="text" readOnly placeholder="Enter Remarks" />
            </Form.Group>
          </div>
        </div>
      </div>

      <div
        className="w-100 d-flex align-items-center py-2"
        style={{
          paddingInline: "0.75rem",
        }}
      >
        <span>Return Product Details</span>
        <hr className="flex-grow-1 mx-3" />
        <Button variant="primary" className="py-1 px-2" onClick={handleShow}>
          Add Item
        </Button>
      </div>

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
                    SCHEDULE ID
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
                    SALES INVOICE
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
                    CUSTOMER NAME
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
                    PRODUCT CODE
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
                    PRODUCT NAME
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
                    TOTAL ORDERED
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
                    TOTAL RECEIVED
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
                    RETURN QUANTITY
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
                <tr key={row.return} style={{ cursor: "pointer" }}>
                  <td
                    className="text-center p-3
"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.scheduleId}
                  </td>
                  <td
                    className="text-center p-3
"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.salesInvoice}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.customerName}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.productCode}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.productName}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.totalOrdered}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {row.totalReceived}
                  </td>
                  <td
                    className="text-center p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <Form>
                      <Form.Group
                        className="mb-0"
                        controlId={`returnQty-${row.scheduleId}`}
                      >
                        <Form.Control
                          type="number"
                          size="sm"
                          onChange={(e) => {
                            const updatedRows = rows.map((r) =>
                              r.scheduleId === row.scheduleId
                                ? {
                                    ...r,
                                    returnQuantity:
                                      parseInt(e.target.value) || 0,
                                  }
                                : r
                            );
                            setRows(updatedRows);
                            setTotalReturnQty(
                              updatedRows.reduce(
                                (sum, r) => sum + (r.returnQuantity || 0),
                                0
                              )
                            );
                          }}
                        />
                      </Form.Group>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-100 d-flex align-items-center justify-content-end py-2">
        <div className="d-flex gap-2">
          <Button
            variant="danger"
            className="py-1 px-2"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel
          </Button>
          <Button variant="success" className="py-1 px-2" onClick={handleShow}>
            Approve
          </Button>
        </div>
      </div>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Rejection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <p className="text-center">
              Are you sure you want to reject this return product request?
            </p>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={cancelRemarks}
                onChange={(e) => setCancelRemarks(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCancelModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              console.log(
                "Return request rejected with remarks:",
                cancelRemarks
              );
              setShowCancelModal(false);
              navigate("/delivery-management/return-products");
            }}
            disabled={!cancelRemarks.trim()}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal size="xl" backdrop="static" show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>RETURN REQUEST</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="container-fluid mb-3">
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

            <div className="container-fluid mt-1 ">
              <div className="table-responsive shadow-sm">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="select-all-checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
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
                          SCHEDULE ID
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
                          SALES INVOICE
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
                          CUSTOMER NAME
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
                          PRODUCT CODE
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
                          PRODUCT NAME
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
                          TOTAL ORDERED
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
                          TOTAL RECEIVED
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
                    {dummySalesInvoice.map((row) => (
                      <tr
                        key={row.scheduleId}
                        className={
                          selectedRows.includes(row.scheduleId)
                            ? "table-primary"
                            : ""
                        }
                      >
                        <td>
                          <Form.Check
                            style={{ cursor: "pointer" }}
                            type="checkbox"
                            id={`checkbox-${row.scheduleId}`}
                            checked={selectedRows.includes(row.scheduleId)}
                            onChange={() => handleRowSelect(row.scheduleId)}
                          />
                        </td>
                        <td
                          style={{ width: "20%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.scheduleId}
                        </td>
                        <td
                          style={{ width: "20%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.salesInvoice}
                        </td>
                        <td
                          style={{ width: "25%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.customerName}
                        </td>
                        <td
                          style={{ width: "15%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.productCode}
                        </td>
                        <td
                          style={{ width: "10%", whiteSpace: "nowrap" }}
                          className="text-center"
                        >
                          {row.productName}
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
                          {row.totalReceived}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <Button variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReturnProductDetails_Update;
