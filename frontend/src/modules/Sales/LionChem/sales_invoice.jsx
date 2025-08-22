import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

const Invoice = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [agentData, setAgentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/sales_invoice/getSalesData"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  const fetchAgentData = () => {
    axios
      .get(BASE_URL + "/sales_invoice/getAgent")
      .then((res) => {
        setAgentData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const maskCurrency = (value) => {
    return Number(value)
      .toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/[0-9]/g, "*");
  };

  const handleClearFilter = () => {
    setSearchText("");
    setSearchField("all");
    setSelectedAgent("");
    setFromDate("");
    setToDate("");
    setPaginationUrl(BASE_URL + "/sales_invoice/getSalesData");
    pagination.updateParams({});
  };

  const handleSearchCategoryChange = (category) => {
    setSearchField(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim() === "") {
      setPaginationUrl(BASE_URL + "/sales_invoice/getSalesData");
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchField);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/sales_invoice/getSalesDataSearch");

    const params = {
      searchText: text,
    };

    if (category && category !== "all") {
      params.searchField = category;
    }

    pagination.updateParams(params);
  };

  const handleApplyFilter = () => {
    setPaginationUrl(BASE_URL + "/sales_invoice/getFilteredSalesInvoice");
    pagination.updateParams({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      agentId: selectedAgent,
    });
  };

  const isRowSelectable = (item) => {
    const { sales_invoice, is_only_deliver_number, delivery_number } = item;

    if (is_only_deliver_number && delivery_number && !sales_invoice) {
      return true;
    } else if (sales_invoice && delivery_number) {
      return true;
    }

    return false;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const selectableIds = pagination.data
        .filter((item) => isRowSelectable(item))
        .map((item) => item.sales_invoice_id);
      setSelectedRows(selectableIds);
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (id, item) => {
    if (!isRowSelectable(item)) return;

    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const selectableRowsCount =
    pagination.data?.filter((item) => isRowSelectable(item)).length || 0;
  const isIndeterminate =
    selectedRows.length > 0 && selectedRows.length < selectableRowsCount;

  const handleRowClick = (id) => {
    navigate(`/sales/create-invoice-update/${id}`);
  };

  // Search field options for better UX
  const searchFieldOptions = [
    { value: "all", label: "All Fields" },
    { value: "transaction_id", label: "Transaction ID" },
    { value: "invoice_date", label: "Invoice Date" },
    { value: "date_created", label: "Date Created" },
    { value: "receivables", label: "Receivables" },
    ...(roleType?.includes("Management")
      ? [{ value: "gross_amount", label: "Gross Amount" }]
      : []),
  ];

  const getPlaceholderText = () => {
    const selectedOption = searchFieldOptions.find(
      (option) => option.value === searchField
    );
    return `Search ${
      selectedOption ? selectedOption.label.toLowerCase() : "all fields"
    }`;
  };

  return (
    <div
      className="h-100 w-100 border bg-white"
      style={{ maxWidth: "1560px", borderRadius: "0.5rem", padding: "1rem" }}
    >
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom w-100">
          <span className="fs-3">SALES | INVOICE</span>
        </div>

        <div className=" w-100 row">
          <div className="col-12 col-md-8 d-flex flex-row align-items-center mb-2"></div>
          <div className="col-12 col-md-4 d-flex justify-content-end mb-2">
            {authrztn.includes("Invoices-Add") && (
              <Link
                to="/sales/create-invoice-update"
                className="btn btn-primary d-flex flex-row align-items-center title-button"
              >
                <i className="bx bx-plus fs-5"></i> Create
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container-fluid">
        <div className="row p-2 mx-auto">
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Current Sales Total</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-primary"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bxs-discount fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Total Discount</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-warning"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {" "}
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bx-money fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Collection</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-success"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {" "}
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mx-auto mt-2">
          <div
            className={
              roleType?.includes("Management") ? "col-sm mb-2" : "d-none"
            }
          >
            <label htmlFor="select-agent">Select Agent</label>
            <select
              id="select-agent"
              className="form-select"
              value={selectedAgent}
              onClick={() => {
                if (agentData.length === 0) fetchAgentData();
              }}
              onChange={(e) => setSelectedAgent(e.target.value)}
              aria-label="Select Agent"
            >
              <option value="">All Agents</option>
              {agentData.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fname} {agent.lname}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm mb-2">
            <label htmlFor="date-created">From</label>
            <input
              type="date"
              name="date-created"
              id="date-created"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="date-to">To</label>
            <input
              type="date"
              name="date-to"
              id="date-to"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
            <button
              type="button"
              className="btn btn-primary me-2"
              onClick={handleApplyFilter}
            >
              Apply Filter
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
        </div>

        <div className="row mx-auto mt-2">
          <div className="col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={getPlaceholderText()}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {searchFieldOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      className={`dropdown-item ${
                        searchField === option.value ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-3">
        <div
          className="table-responsive"
          style={{
            overflowX: "auto",
            maxWidth: "100%",
            border: "1px solid #dee2e6",
            borderRadius: "0.375rem",
          }}
        >
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ backgroundColor: "#EBEFF4" }}>
                <th
                  className="text-muted fw-semibold text-uppercase sticky-column"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "0.75rem",
                    padding: "12px 8px",
                    width: "50px",
                    position: "sticky",
                    left: "0",
                    zIndex: "10",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ height: "18px", width: "18px" }}
                    checked={
                      selectableRowsCount > 0 &&
                      selectedRows.length === selectableRowsCount
                    }
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    disabled={selectableRowsCount === 0}
                  />
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "140px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Transaction ID
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Invoice Date
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sales Agent
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "100px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Type
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "150px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Customer
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "110px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Date Created
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "110px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delivery Date
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "110px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Days Past Due
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className={
                    roleType?.includes("Management")
                      ? "text-muted fw-semibold text-uppercase"
                      : "d-none"
                  }
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Gross Amount
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Receivables
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Payment Status
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delivery Status
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="13" className="text-center py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="13" className="text-center text-danger py-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error loading data
                  </td>
                </tr>
              ) : pagination.data.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center py-4 text-muted">
                    <i className="fas fa-inbox me-2"></i>
                    No data available
                  </td>
                </tr>
              ) : (
                pagination.data.map((item, index) => (
                  <tr
                    key={item.sales_invoice_id}
                    onClick={() => handleRowClick(item.sales_invoice_id)}
                    className="table-row-hover"
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f3f4",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.sales_invoice_id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          handleRowSelect(item.sales_invoice_id, item)
                        }
                        style={{
                          height: "16px",
                          width: "16px",
                          opacity: isRowSelectable(item) ? 1 : 0.3,
                          cursor: isRowSelectable(item)
                            ? "pointer"
                            : "not-allowed",
                        }}
                        disabled={!isRowSelectable(item)}
                      />
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.transaction_id}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.invoice_date}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {`${item.sales_created_masterlist?.fname ?? ""} ${
                        item.sales_created_masterlist?.mname ?? ""
                      } ${item.sales_created_masterlist?.lname ?? ""}`.trim()}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(() => {
                        const {
                          sales_invoice,
                          is_only_deliver_number,
                          delivery_number,
                        } = item;

                        if (is_only_deliver_number && !delivery_number) {
                          return (
                            <span
                              className="text-danger"
                              style={{ fontSize: "bold" }}
                            >
                              DR Only
                            </span>
                          );
                        } else if (
                          is_only_deliver_number &&
                          delivery_number &&
                          !sales_invoice
                        ) {
                          return (
                            <span
                              className="text-success"
                              style={{ fontSize: "bold" }}
                            >
                              DR Only
                            </span>
                          );
                        } else if (sales_invoice && delivery_number) {
                          return (
                            <span
                              className="text-success"
                              style={{ fontSize: "bold" }}
                            >
                              With SI & DR
                            </span>
                          );
                        } else if (
                          !sales_invoice &&
                          !is_only_deliver_number &&
                          !delivery_number
                        ) {
                          return (
                            <span
                              className="text-secondary"
                              style={{ fontSize: "bold" }}
                            >
                              ---
                            </span>
                          );
                        } else if (
                          sales_invoice &&
                          !is_only_deliver_number &&
                          !delivery_number
                        ) {
                          return (
                            <span
                              className="text-danger"
                              style={{ fontSize: "bold" }}
                            >
                              With SI
                            </span>
                          );
                        } else {
                          return (
                            <span
                              className="text-secondary"
                              style={{ fontSize: "bold" }}
                            >
                              Unknown
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "140px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.customer.company_name}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span className="text-muted">Soon</span>
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        color:
                          new Date().setHours(0, 0, 0, 0) >
                          new Date(item.due_date).setHours(0, 0, 0, 0)
                            ? "#dc3545"
                            : "#198754",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(() => {
                        const today = new Date().setHours(0, 0, 0, 0);
                        const due = new Date(item.due_date).setHours(0, 0, 0);
                        const diff = today - due;
                        const daysPast =
                          diff > 0
                            ? Math.floor(diff / (1000 * 60 * 60 * 24))
                            : 0;
                        return `${daysPast} day(s)`;
                      })()}
                    </td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₱
                      {item.total_gross.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className=""
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span className="text-muted">Soon</span>
                    </td>
                    <td
                      className=""
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        className="text-warning"
                        style={{ fontSize: "bold" }}
                      ></span>
                    </td>
                    <td
                      className=""
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        className="text-info"
                        style={{ fontSize: "bold" }}
                      ></span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls {...pagination} />
      </div>
    </div>
  );
};
export default Invoice;
