import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

import Logo from "../../../assets/img/logo.jpg";

const Purchase_order_view = ({
  poData,
  prData,
  onGeneratePDF,
  authrztn,
  roleType,
}) => {
  const poId = poData?.id || "N/A";
  const prId = prData?.id || "N/A";

  const [settings, setSettings] = useState(null);
  const [vendorPO, setVendorPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorProduct, setVendorProduct] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const userLoggedID = useDecodeToken();

  // ✅ Hook must always run, even if poData is null
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`
        );
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (poId && poId !== "N/A") {
      fetchVendorPO(poId);
      fetchVendorProduct(poId);
    }
  }, [poId]);

  const fetchVendorPO = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getVendorPO/${id}`
      );
      if (response.data && response.data.length > 0) {
        setVendorPO(response.data[0]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase order details vendor", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorProduct = async (id) => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getVendorProduct/${id}`
      );
      setVendorProduct(response.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch vendor products", "error");
      setVendorProduct([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ✅ Now safe to check render conditions
  if (loading) return <div>Loading purchase order details...</div>;
  if (!vendorPO) return <div>No purchase order data found</div>;

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div
      className="container-fluid bg-white p-3 rounded"
      id="pdfVendorCanvassPage"
    >
      {/* <span>PO ID: {poId}</span> */}
      {/* Header Section */}
      <div className="text-center mb-4">
        <img
          src={settings?.logo || Logo}
          className="img-fluid"
          alt="Logo"
          style={{ maxHeight: "100px" }}
        />
        <h5 className="mb-2" style={{ fontWeight: 700 }}>
          {settings?.company_name || "E-Logic Innovations"}
        </h5>
        <span>
          {settings?.company_address ||
            "2nd Floor Unit B ARCA Corporate Center, 150 F. Dela Cruz Street Cor. Maysan Road, Brgy Maysan, Valenzuela, Philippines"}
        </span>
        <br />
        <span>VAT Reg. TIN: {settings?.tin || "N/A"}</span>
        <br />
        <span>Telephone No: {settings?.landline || "(02)  8659 8685"}</span>
      </div>

      {/* Vendor PO Content */}

      <div className="w-100 d-flex flex-row justify-content-center mb-3">
        <div className="mb-3" style={{ width: "800px" }}>
          <h5 className="fw-bold text-center fs-3">PURCHASE ORDER</h5>
          <div className="w-100 mt-3 d-flex flex-row justify-content-between gap-4">
            <div className="w-50 d-flex flex-column align-items-start">
              <span className="text-start">
                <strong>PO NO:</strong> {vendorPO.po_number || "N/A"}
              </span>
              <span className="text-start">
                <strong>Date Issued:</strong> {formatDate(vendorPO.createdAt)}
              </span>
            </div>
            <div className="w-50 text-start">
              <span>
                <strong>Ship To:</strong>{" "}
                {vendorPO.po_warehouse_id?.name || "N/A"}
              </span>
            </div>
          </div>
          <div className="w-100 mt-3 d-flex flex-row justify-content-between gap-4">
            <div className="w-50 d-flex flex-column align-items-start">
              <span className="text-start">
                <strong>Vendor:</strong>{" "}
                {vendorPO.po_vendor?.fname && vendorPO.po_vendor?.lname
                  ? `${vendorPO.po_vendor.fname} ${vendorPO.po_vendor.lname}`
                  : vendorPO.po_vendor?.company_name || "N/A"}
              </span>
              <span className="text-start">
                <strong>Address:</strong>{" "}
                {vendorPO.po_vendor?.company_address || "N/A"}
              </span>
              <span className="text-start">
                <strong>Email:</strong>{" "}
                {vendorPO.po_vendor?.company_email || "N/A"}
              </span>
            </div>
            <div className="w-50 d-flex flex-column align-items-start">
              <span className="text-start">
                <strong>Delivery Date: </strong>
                {formatDate(vendorPO.delivery_date)}
              </span>
              <span className="text-start">
                <strong>Shipping Method:</strong>{" "}
                {vendorPO.shipping_method || "N/A"}
              </span>
              <span className="text-start">
                <strong>Payment Terms:</strong> {vendorPO.payment_term || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-4">
        <table className="table" id="pdfProductTable">
          <thead>
            <tr>
              <th style={{ background: "#7B7B7B", color: "#fff" }}>
                PRODUCT NAME
              </th>
              <th style={{ background: "#7B7B7B", color: "#fff" }}>QUANTITY</th>
              <th
                style={{ background: "#7B7B7B", color: "#fff" }}
                className={roleType?.includes("Management") ? "" : "d-none"}
              >
                UNIT PRICE
              </th>
              <th
                style={{ background: "#7B7B7B", color: "#fff" }}
                className={roleType?.includes("Management") ? "" : "d-none"}
              >
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="4" className="text-center">
                  Loading products...
                </td>
              </tr>
            ) : vendorProduct.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No products found
                </td>
              </tr>
            ) : (
              vendorProduct.map((product, index) => (
                <tr key={index}>
                  <td>
                    {product.po_vendor_product_id?.product_name ||
                      product.po_vendor_product_id?.product_code ||
                      "N/A"}
                  </td>
                  <td>
                    {parseFloat(product.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={roleType?.includes("Management") ? "" : "d-none"}
                  >
                    {" "}
                    {parseFloat(product.price || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={roleType?.includes("Management") ? "" : "d-none"}
                  >
                    {" "}
                    {parseFloat(
                      product.quantity * product.price || 0
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* total section */}
      <div
        className="d-flex flex-row justify-content-between"
        style={{ margin: "5rem 0" }}
      >
        <div></div>

        {roleType?.includes("Management") && (
          <div className="d-flex flex-row justify-content-end">
            <div className="d-flex flex-column">
              {/* Calculate subtotal */}
              <span className="text-start">
                <strong>SUBTOTAL ORDER:</strong> PHP{" "}
                {parseFloat(vendorPO.subtotal).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

              {/* Calculate VAT */}
              <span className="text-start" title="SUB TOTAL ORDER x VAT RATE">
                <strong>TOTAL VAT ({vendorPO.vat_rate}%)</strong>{" "}
                <span>
                  {" "}
                  PHP{" "}
                  {parseFloat(vendorPO.vat_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>

              {/* Calculate Withholding Tax */}
              <span className="text-start" title="SUB TOTAL ORDER x TAX RATE">
                <strong>WITHHOLDING TAX ({vendorPO.tax_rate}%)</strong>{" "}
                <span>
                  {" "}
                  PHP{" "}
                  {parseFloat(vendorPO.tax_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>

              {/* Calculate Grand Total */}
              <span
                className="text-start"
                title="SUB TOTAL ORDER + VAT AMOUNT - TAX AMOUNT"
              >
                <strong>TOTAL ORDER AMOUNT:</strong>{" "}
                <span>
                  PHP{" "}
                  {parseFloat(vendorPO.total_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div
        className="d-flex flex-row justify-content-around text-center"
        style={{ margin: "5rem 0" }}
      >
        {/* Requested By */}
        <div
          style={{ minWidth: "280px" }}
          className="d-flex flex-column justify-content-between gap-4"
        >
          <p>Requested By: </p>
          <div>
            <div
              style={{
                borderBottom: "1px solid black",
                width: "100%",
                margin: "0 auto",
                paddingBottom: "0.5rem",
              }}
            >
              {vendorPO.po_pr_id?.requestor?.fname &&
              vendorPO.po_pr_id?.requestor?.lname
                ? `${vendorPO.po_pr_id.requestor.fname} ${vendorPO.po_pr_id.requestor.lname}`
                : ""}
            </div>
            <strong>NAME</strong>
          </div>
        </div>

        {/* Prepared By */}
        <div
          style={{ minWidth: "280px" }}
          className="d-flex flex-column justify-content-between gap-4"
        >
          <p>Prepared By: </p>
          <div>
            <div
              style={{
                borderBottom: "1px solid black",
                width: "100%",
                margin: "0 auto",
                paddingBottom: "0.5rem",
              }}
            >
              {vendorPO.po_prepared?.fname && vendorPO.po_prepared?.lname
                ? `${vendorPO.po_prepared.fname} ${vendorPO.po_prepared.lname}`
                : ""}
            </div>
            <strong>NAME</strong>
          </div>
        </div>

        {/* Approved By */}
        <div
          style={{ minWidth: "280px" }}
          className="d-flex flex-column justify-content-between gap-4"
        >
          <p>Approved By: </p>
          <div>
            <div
              style={{
                borderBottom: "1px solid black",
                width: "100%",
                margin: "0 auto",
                paddingBottom: "0.5rem",
              }}
            >
              {vendorPO.po_approver?.fname && vendorPO.po_approver?.lname
                ? `${vendorPO.po_approver.fname} ${vendorPO.po_approver.lname}`
                : ""}
            </div>
            <strong>NAME</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchase_order_view;
