import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";

// pdf
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const PostProduction = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // State for search/filters
  const [searchText, setSearchText] = useState("");

  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  const [filterStatus, setFilterStatus] = useState("All");

  // fetch overview
  const [fetchOverviewCount, setFetchOverviewCount] = useState({
    inProgress: 0,
    postProduction: 0,
    reProduction: 0,
  });

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/PostProduction/fetchOverviewCounts`
      );

      if (!response.data.counts) {
        throw new Error("Counts object missing in response");
      }

      setFetchOverviewCount({
        inProgress: response.data.counts.inProgress ?? 0,
        postProduction: response.data.counts.postProduction ?? 0,
        reProduction: response.data.counts.reProduction ?? 0,
      });
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH TABLE
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/PostProduction/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // modal state
  const [showQAForm, setShowQAForm] = useState(false);
  const [validated, setValidated] = useState(false);

  // Handle checkbox selection
  const handleCheckboxChange = (e, id) => {
    e.stopPropagation();
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      // Only select items with status "In Progress"
      const inProgressIds = pagination.data
        .filter(
          (item) => item?.pp_batch_entry_id?.[0]?.status === "In Progress"
        )
        .map((item) => item.id);
      setSelectedItems(inProgressIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Handle modal show/hide
  const handleShow = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }
    setShowQAForm(true);
  };

  const handleClose = () => {
    setShowQAForm(false);
    setValidated(false);
  };

  const [filterColumn, setFilterColumn] = useState("all");

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/PostProduction/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/PostProduction/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${BASE_URL}/PostProduction/generateQcForms`,
        { batchIds: selectedItems }
      );

      console.log("API response:", response.data);
      // alert(
      //   `Received ${
      //     response.data.length
      //   } batches with products: ${response.data.reduce(
      //     (sum, batch) => sum + batch.products.length,
      //     0
      //   )}`
      // );

      // 2. Generate PDFs and zip them
      const { zipUrl } = await generateAndZipQcForms(response.data);
      console.log("Zip file created at:", zipUrl);

      // 3. Download the zip file
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = "Quality_Control_Forms.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);

      handleClose();
    } catch (error) {
      console.error("Error generating QC forms:", error);
      alert(`Failed to generate Quality Control Forms: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // pdf form
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

  const generateAndZipQcForms = async (batchData) => {
    console.log("Received batch data:", batchData);
    const zip = new JSZip();

    // Create empty batch notice PDF
    const createEmptyBatchPdf = (batch) => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("NO PRODUCTS FOUND", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Batch: ${batch.batch_name || batch.batch_id}`, 20, 40);
      doc.text(`No products were found for this batch`, 20, 60);
      return doc.output("blob");
    };

    // Process each batch
    for (const batch of batchData) {
      const batchFolder = zip.folder(
        batch.batch_name || `Batch_${batch.batch_id}`
      );

      if (batch.products?.length > 0) {
        // Generate PDF for each product
        for (const product of batch.products) {
          try {
            const pdf = generateQcPdf(batch, product);
            batchFolder.file(
              `${product.product_code}_QC_Form.pdf`,
              pdf.output("blob")
            );
          } catch (error) {
            console.error(
              `PDF generation error for ${product.product_code}:`,
              error
            );
          }
        }
      } else {
        // Add placeholder for empty batches
        batchFolder.file(`NO_PRODUCTS_NOTICE.pdf`, createEmptyBatchPdf(batch));
      }
    }

    // Generate the zip file
    try {
      const zipContent = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      return { zipUrl: URL.createObjectURL(zipContent) };
    } catch (error) {
      console.error("Zip generation failed:", error);
      throw error;
    }
  };

  const generateQcPdf = (batch, product) => {
    const doc = new jsPDF();

    try {
      // --- HEADER TEXT ---
      // ========================
      // Header Section
      // ========================
      const logoImage = settings?.logo || "";
      const logoHeight = 30;
      const logoWidth = 36;
      const logoX = 5;
      const logoY = 5;

      if (logoImage) {
        doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);
      }

      // Company Info Container (60% width)
      const containerWidth = 110;
      const containerStartX = 42;
      let currentY = 20;

      // Company Name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${settings.company_name}`, containerStartX, currentY);
      currentY += 7;

      doc.setFontSize(12);
      doc.text("QUALITY CONTROL REPORT", 105, 25, { align: "center" });
      doc.line(73, 27, 137, 27); // underline

      // --- PRODUCT INFORMATION ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let y = 40;

      // PRODUCT CODE
      doc.text("PRODUCT CODE:", 18, y);
      doc.text(product.product_code || "", 50, y);
      doc.line(48, y + 1, 95, y + 1);

      // DATE
      doc.text("DATE:", 105, y);
      const today = new Date().toLocaleDateString();
      doc.text(today, 140, y);
      doc.line(138, y + 1, 190, y + 1);

      y += 8;

      // BATCH NUMBER
      doc.text("BATCH NUMBER:", 18, y);
      doc.text(batch.batch_name || "", 50, y);
      doc.line(48, y + 1, 95, y + 1);

      // TEAM LEADER
      doc.text("TEAM LEADER:", 105, y);
      doc.line(138, y + 1, 190, y + 1);

      y += 8;

      // MIXER NUMBER
      doc.text("MIXER NUMBER:", 18, y);
      doc.line(48, y + 1, 95, y + 1);

      // TEAM MEMBERS
      doc.text("TEAM MEMBERS:", 105, y);
      doc.line(138, y + 1, 190, y + 1);
      doc.line(138, y + 8, 190, y + 8); // extra line

      y += 8;

      // QUANTITY
      doc.text("QUANTITY:", 18, y);
      const formattedQty = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(product.quantity ?? 0);

      doc.text(formattedQty, 50, y);
      doc.line(48, y + 1, 95, y + 1);

      // --- TABLE HEADER ---
      y += 15;
      const startX = 18;
      const colWidths = [60, 60, 52];
      const headers = ["", "RESULT", "ACCEPTANCE"];
      const tests = [
        "COLOR",
        "FLAVOUR / AROMA",
        "MOISTURE (%)",
        "FOREIGN MATERIAL",
        "STD. PLATE COUNT",
        "COLIFORM",
        "E. coli",
        "SALMONELLA",
        "OTHER:",
      ];

      doc.setFont("helvetica", "bold");
      doc.setDrawColor(0);
      let tableY = y;
      doc.rect(startX, tableY, colWidths[0], 10);
      doc.rect(startX + colWidths[0], tableY, colWidths[1], 10);
      doc.rect(startX + colWidths[0] + colWidths[1], tableY, colWidths[2], 10);
      doc.text("TEST PARAMETERS", startX + 2, tableY + 7);
      doc.text("RESULT", startX + colWidths[0] + 2, tableY + 7);
      doc.text(
        "ACCEPTANCE",
        startX + colWidths[0] + colWidths[1] + 2,
        tableY + 7
      );

      doc.setFont("helvetica", "normal");
      tableY += 10;

      tests.forEach((param) => {
        doc.rect(startX, tableY, colWidths[0], 10);
        doc.rect(startX + colWidths[0], tableY, colWidths[1], 10);
        doc.rect(
          startX + colWidths[0] + colWidths[1],
          tableY,
          colWidths[2],
          10
        );
        doc.text(param, startX + 2, tableY + 7);
        tableY += 10;
      });

      // --- LEGEND ---
      doc.setFontSize(10);
      doc.text("Legend:", startX, tableY + 10);

      // Draw checkmark and cross symbols
      doc.setFont("helvetica", "bold");
      doc.text("\u2714 Acceptable", startX + 20, tableY + 10);

      doc.text("\u2718 Unacceptable", startX + 60, tableY + 10);

      // Reset color
      doc.setTextColor(0);

      // --- SIGNATURE SECTION ---
      const signY = tableY + 30;
      doc.setFontSize(10);
      doc.text("Prepared By:", startX, signY);
      doc.text("Evaluated By:", startX + 70, signY);
      doc.text("Approved for Delivery:", startX + 140, signY);

      doc.line(startX, signY + 5, startX + 40, signY + 5);
      doc.line(startX + 70, signY + 5, startX + 110, signY + 5);
      doc.line(startX + 140, signY + 5, startX + 180, signY + 5);

      doc.text("TEAM LEADER", startX + 5, signY + 10);
      doc.text("Q.C. HEAD", startX + 75, signY + 10);
      doc.text("PLANT MANAGER", startX + 145, signY + 10);

      return doc;
    } catch (error) {
      console.error("Error in PDF generation:", error);
      const fallback = new jsPDF();
      fallback.text("Error generating QC form", 20, 20);
      return fallback;
    }
  };

  // table click

  const handleRowClick = (id) => {
    navigate(`/inventory/batch-entry-create-update/${id}/isPostProduction`);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("All");
    setFromFilter("");
    setToFilter("");
    setSearchCategory("all");
    setPaginationUrl(BASE_URL + "/PostProduction/fetchData");
    pagination.updateParams({});
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/PostProduction/fetchFilteredData");
    pagination.updateParams({
      filterStatus,
      fromFilter,
      toFilter,
    });
  };
  return (
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
      ) : authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">POST PRODUCTION</span>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={handleShow}
                disabled={selectedItems.length === 0}
              >
                Quality Control Form
              </button>
            </div>
          </div>

          <div className="container-fluid mt-3">
            <div className="row poOverviewCards justify-content-center">
              {/* Added justify-content-center */}
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Batch New</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {fetchOverviewCount.inProgress}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Post-Production</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {" "}
                      {fetchOverviewCount.postProduction}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Re-Production</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {" "}
                      {fetchOverviewCount.reProduction}
                    </p>
                  </div>
                </div>
              </div>
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
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="All">All</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Post-Production">Post-Production</option>
                  <option value="Re-Production">Re-Production</option>
                </select>
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="from">Schedule From</label>
                <input
                  type="date"
                  name="from"
                  id="from"
                  className="form-control"
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                />
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="from">Schedule To</label>
                <input
                  type="date"
                  name="to"
                  id="to"
                  className="form-control"
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
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
                  onClick={clearFilters}
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
                          filterColumn === "batch_no" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("batch_no")}
                      >
                        Batch No.
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "mixer" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("mixer")}
                      >
                        Mixer
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "schedule_start" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("schedule_start")}
                      >
                        Schedule Start
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "schedule_end" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("schedule_end")}
                      >
                        Schedule End
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "date_created" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("date_created")}
                      >
                        Date Created
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "status" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("status")}
                      >
                        Status
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid mt-3">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive "
                id="postProductionTable"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ height: "1.3rem", width: "1.3rem" }}
                        />
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BATCH NO
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      MIXER
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE START
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE END
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DATE CREATED
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PROCCESSED BY
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
                      <td colSpan="8" className="text-center py-4">
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
                      <td colSpan="8" className="text-center text-danger py-4">
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
                      <td colSpan="8" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      const formattedDate = item?.createdAt
                        ? new Date(item.createdAt)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const sched_start_date = item?.start_date
                        ? new Date(item.start_date)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const sched_end_date = item?.end_date
                        ? new Date(item.end_date)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const isInProgress =
                        item?.pp_batch_entry_id?.[0]?.status === "In Progress";
                      const isChecked = selectedItems.includes(item.id);

                      return (
                        <tr
                          key={item.id || index}
                          onClick={(e) => {
                            // Only navigate if the click wasn't on a checkbox
                            if (!e.target.closest('input[type="checkbox"]')) {
                              handleRowClick(item.id);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(e, item.id)}
                              disabled={!isInProgress}
                              style={{ height: "1.3rem", width: "1.3rem" }}
                            />
                          </td>
                          <td>{item?.batch_transaction_number || "---"}</td>
                          <td>
                            {item?.batch_entry_tag_mixers
                              ?.map((mixer) => mixer.mixer.name)
                              .join(", ") || "---"}
                          </td>
                          <td>{sched_start_date}</td>
                          <td>{sched_end_date}</td>
                          <td>{formattedDate}</td>
                          <td>Ako nalang muna siguro</td>
                          <td style={{ color: "#1E73BE" }}>
                            {item?.pp_batch_entry_id?.[0]?.status || "---"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Only show pagination controls when there's data */}
            {!pagination.loading &&
              !pagination.error &&
              pagination.data.length > 0 && (
                <PaginationControls {...pagination} />
              )}
          </div>

          <Modal
            show={showQAForm}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
          >
            <Form noValidate validated={validated} className="needs-validation">
              <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h6>Are you sure you want to download Quality Control Form?</h6>

                <h6>
                  <strong>Selected Items: </strong>
                  {selectedItems.length}
                </h6>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Confirm
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default PostProduction;
