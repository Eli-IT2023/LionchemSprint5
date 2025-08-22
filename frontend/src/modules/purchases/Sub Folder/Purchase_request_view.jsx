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

import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const Purchase_request_view = ({ authrztn, roleType }) => {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [purchaseRequest, setPurchaseRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rejectValidated, setRejectValidated] = useState(false);

  // ### fetch resets
  const [warehouseData, setWarehouseData] = useState([]);
  const fetchWarehouse = async () => {
    try {
      const warehouse = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      if (warehouse.data) {
        setWarehouseData(warehouse.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
      navigate("/purchases/purchase-request");
    }
  };

  const [taxData, setTaxData] = useState([]);
  const fetchTax = () => {
    axios.get(BASE_URL + "/PurchaseRequest/getTax").then((res) => {
      setTaxData(res.data);
    });
  };

  const [preparedByData, setPreparedByData] = useState("");
  const fetchPreparedBy = async (userId) => {
    await axios
      .get(BASE_URL + "/PurchaseRequest/getPreparedBy", {
        params: {
          userId,
        },
      })
      .then((response) => {
        setPreparedByData(`${response.data.fname} ${response.data.lname}`);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  // ### fetch reset ends

  useEffect(() => {
    fetchPurchaseRequest();
    fetchWarehouse();
    fetchTax();
  }, [id]);

  const fetchPurchaseRequest = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseRequest/getData/${id}`
      );
      if (response.data.success) {
        setPurchaseRequest(response.data.data);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error"
        );
        navigate("/purchases/purchase-request");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
      navigate("/purchases/purchase-request");
    } finally {
      setLoading(false);
    }
  };

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/PurchaseRequest/getOrderListData/${id}`
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ### reject modal ###
  const showRejectModal = () => setShowModal(true);

  const handleClose = () => {
    setShowModal(false);
    setShowModal2(false);
    setRejectRemarks("");
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Validate form
    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      setRejectValidated(true);
      return; // Exit early if invalid
    }

    try {
      const confirmed = await swal({
        title: "Reject this purchase request?",
        text: "This action cannot be undone",
        icon: "warning",
        buttons: ["Cancel", "Confirm"],
        dangerMode: true,
      });

      if (confirmed) {
        setShowModal(false);
        // Actual rejection API call
        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/reject/${id}`,
          {
            rejectRemarks: rejectRemarks,
            rejectedBy: userLoggedID,
          }
        );

        if (response.data.success) {
          swal({
            title: "Rejected!",
            text: "Purchase request has been rejected",
            icon: "success",
            buttons: false,
            timer: 2500,
          }).then(() => {
            navigate("/purchases/purchase-request");
          });
        } else {
          throw new Error(response.data.message || "Failed to reject");
        }
      }
    } catch (error) {
      console.error("Rejection error:", error);
      swal({
        title: "Error",
        text:
          error.response?.data?.message || "Failed to reject purchase request",
        icon: "error",
      });
    }
  };
  // ### reject modal end ###

  // ### update ###
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    date_needed: "",
    remarks: "",
    orderItems: [],
  });

  useEffect(() => {
    if (purchaseRequest) {
      setFormValues({
        date_needed: purchaseRequest.date_needed || "",
        remarks: purchaseRequest.remarks || "",
        orderItems: pagination.data.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          remarks: item.remarks || "",
        })),
      });
    }
  }, [purchaseRequest, pagination.data]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    try {
      const confirmed = await swal({
        title: "Confirm changes?",
        text: "Do you want to save these updates?",
        icon: "warning",
        buttons: ["Cancel", "Save"],
        dangerMode: false,
      });

      if (confirmed) {
        const updateData = {
          id: purchaseRequest.id,
          date_needed: formValues.date_needed,
          remarks: formValues.remarks,
          updatedBy: userLoggedID,
          orderItems: formValues.orderItems.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            remarks: item.remarks,
          })),
        };

        // console.log("Submitting update:", updateData);

        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/update/${id}`,
          updateData
        );

        if (response.data.success) {
          swal({
            title: "Success!",
            text: "Changes saved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
          }).then(() => {
            setIsEditing(false);
            // Refresh data if needed
            reloadTable();
          });
        } else {
          throw new Error(response.data.message || "Failed to save changes");
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
      swal({
        title: "Error",
        text: error.response?.data?.message || "Failed to save changes",
        icon: "error",
      });
    }
  };

  // ### update end

  // ### product list
  const handleProductList = async (e, product_id) => {
    e.preventDefault();

    const remainingItems = pagination.data.length;

    // console.log("Selected Item ID:", product_id);

    if (remainingItems <= 1) {
      swal(
        "Cannot Delete",
        "You must have at least one item in the list.",
        "warning"
      );
      return;
    }

    const confirmed = await swal({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (confirmed) {
      axios
        .put(`${BASE_URL}/PurchaseRequest/deleteProductList/${product_id}`)
        .then((response) => {
          if (response.data.success) {
            swal({
              title: "Success!",
              text: "Product has been removed successfully",
              icon: "success",
              buttons: false,
              timer: 2500,
            });
            reloadTable();
          } else {
            throw new Error(response.data.message || "Failed to delete");
          }
        })
        .catch((error) => {
          console.error("Delete failed:", error);
          swal("Error", error.message, "error");
        });
    }
  };

  const reloadTable = () => {
    setPaginationUrl(
      `${BASE_URL}/PurchaseRequest/getOrderListData/${id}?t=${Date.now()}`
    );
    pagination.refreshData();
    fetchPurchaseRequest();
  };

  // ### product list end

  // ### approve
  const [showModal2, setShowModal2] = useState(false);
  const showApproveModal = () => setShowModal2(true);

  const handleApprove = async (e) => {
    e.preventDefault();
    setShowModal2(false);
    if (!id) {
      swal("Error", "Missing purchase request ID. Cannot proceed.", "error");
      return;
    }

    console.log("Approved request ID:", id);

    const response = await axios.put(
      `${BASE_URL}/PurchaseRequest/approve/${id}`,
      {
        approvedBy: userLoggedID,
      }
    );

    if (response.data.success) {
      swal({
        title: "Approved!",
        text: "Purchase Request has been approved successfully",
        icon: "success",
        buttons: false,
        timer: 2000,
      }).then(() => {
        navigate("/purchases/purchase-request");
      });
    } else {
      throw new Error(response.data.message || "Failed to save changes");
    }
  };

  // ### approve end

  const getStatusStyles = (status) => {
    switch (status) {
      case "In Progress":
        return { bg: "#FFF4F4", text: "#EE5B5B" };
      case "Partial Order":
        return { bg: "#E4F0FF", text: "#3D96FF" };
      case "Ordered":
        return { bg: "#E1FCE6", text: "#62D665" };
      default:
        return { bg: "#FFFFFF", text: "#000000" };
    }
  };

  // ### select product
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterColumn, setFilterColumn] = useState("all");
  const [searchText, setSearchText] = useState("");

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
    } else {
      console.log("search inputted");
    }
  };
  // ### end select product

  // ### vendor fetch state
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [vendorPrices, setVendorPrices] = useState({});

  // ### vendor data functions
  const handleVendorFetch = async (product_id) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseRequest/getVendorsByProduct/${product_id}`
      );
      setVendors(response.data);
      // Initialize prices and reset selections
      const initialPrices = {};
      response.data.forEach((vendor) => {
        initialPrices[vendor.vendor_id] = vendor.product_price || 0;
      });
      setVendorPrices(initialPrices);
      setSelectedVendors([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      swal("Error", "Failed to fetch vendors", "error");
    }
  };

  const handleCartClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    handleVendorFetch(product.product_id);
  };

  // ### selection functions
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      const allVendorIds = vendors.map((vendor) => vendor.vendor_id);
      setSelectedVendors(allVendorIds);
      console.log("Selected all vendors:", allVendorIds);
    } else {
      setSelectedVendors([]);
      console.log("Deselected all vendors");
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors((prev) => {
      let newSelectedVendors;
      if (prev.includes(vendorId)) {
        newSelectedVendors = prev.filter((id) => id !== vendorId);
      } else {
        newSelectedVendors = [...prev, vendorId];
      }

      // Update selectAll state based on current selection
      setSelectAll(newSelectedVendors.length === vendors.length);

      console.log("Selected vendors:", newSelectedVendors);
      return newSelectedVendors;
    });
  };

  // ### price editing functions
  const handlePriceEdit = (vendorId) => {
    setEditingPriceId(vendorId);
  };

  const handlePriceChange = (vendorId, value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    setVendorPrices((prev) => ({
      ...prev,
      [vendorId]: sanitizedValue,
    }));
  };

  const handlePriceSave = (vendorId) => {
    setEditingPriceId(null);
    // Optional: Add API call to save the price here
    console.log(`Saved price ${vendorPrices[vendorId]} for vendor ${vendorId}`);
  };

  // ### render

  // ### card
  const [vendorCards, setVendorCards] = useState([]);

  const handleConfirmVendors = () => {
    if (!selectedProduct || selectedVendors.length === 0) {
      swal("Error", "Please select at least one vendor", "error");
      return;
    }

    setVendorCards((prevCards) => {
      const newCards = [...prevCards];

      selectedVendors.forEach((vendorId) => {
        const vendor = vendors.find((v) => v.vendor_id === vendorId);
        const vendorName =
          `${vendor.vendor.fname || ""} ${vendor.vendor.lname || ""}`.trim() ||
          vendor.vendor.company_name;
        const vendorAddress = vendor.vendor.company_address;
        const vendorEmail = vendor.vendor.company_email;
        const vat = vendor.vendor.vat;

        const existingCardIndex = newCards.findIndex(
          (card) => card.vendorId === vendorId
        );

        const productToAdd = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
          productId: selectedProduct.product_id,
          productCode: selectedProduct.product_code,
          productName: selectedProduct.product_name,
          quantity: "",
          originalQuantity: selectedProduct.quantity,
          price: vendorPrices[vendorId] || 0,
          remarks: "",
          orderedQuantity: selectedProduct.ordered_quantity,
        };

        if (existingCardIndex >= 0) {
          const productExists = newCards[existingCardIndex].products.some(
            (p) => p.productId === productToAdd.productId
          );

          if (!productExists) {
            newCards[existingCardIndex].products.push(productToAdd);
          }
        } else {
          newCards.push({
            poNumber: generatePONumber(),
            vendorId,
            vendorName,
            vendorAddress,
            vendorEmail,
            vat,
            taxId: null, // Initialize as null
            taxRate: 0, // Initialize as 0
            deliveryEstimateFrom: "",
            deliveryEstimateTo: "",
            shippingMethod: "",
            paymentTerm: "",
            deliveryDate: "",
            purchaseOrderDate: "",
            products: [productToAdd],
          });
        }
      });

      return newCards;
    });

    setShowProductModal(false);
    setSearchText("");
    setSelectedVendors([]);
    setSelectAll(false);
  };

  // Add this with your other handler functions
  const handleDeliveryDateChange = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].deliveryDate = value;
      return newCards;
    });
  };

  // Add this with your other handler functions
  const handlePurchaseOrderDate = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].purchaseOrderDate = value;
      return newCards;
    });
  };

  // estimated days
  const handleDeliveryEstimateChange = (cardIndex, type, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      if (type === "from") {
        newCards[cardIndex].deliveryEstimateFrom = value;
      } else {
        newCards[cardIndex].deliveryEstimateTo = value;
      }
      return newCards;
    });
  };

  // shipping method
  const handleShippingMethod = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].shippingMethod = value;

      return newCards;
    });
  };

  // payment term
  const handlePaymentTerm = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].paymentTerm = value;

      return newCards;
    });
  };

  const generatePONumber = () => {
    // Generate random 3-digit number (100-999)
    const randomNum = Math.floor(100 + Math.random() * 900);

    // Get current datetime in YYYYMMDDHHMMSS format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // Combine all parts with PO prefix
    return `PO-${datetimeStr}${randomNum}`;
  };

  // Delete entire card
  const handleDeleteCard = (cardIndex) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards.splice(cardIndex, 1);
      return newCards;
    });
  };

  // Remove product from card
  const handleRemoveProduct = (cardIndex, productId) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId
      );

      if (productIndex >= 0) {
        newCards[cardIndex].products.splice(productIndex, 1);
      }

      // If no products left, remove the entire card
      if (newCards[cardIndex].products.length === 0) {
        newCards.splice(cardIndex, 1);
      }

      return newCards;
    });
  };

  // Update product quantity
  const handleProductQuantityChange = (cardIndex, productId, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId
      );
      if (productIndex >= 0) {
        newCards[cardIndex].products[productIndex].quantity = value;
      }
      return newCards;
    });
  };

  const handleProductRemarksChange = (cardIndex, productId, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId
      );
      if (productIndex >= 0) {
        newCards[cardIndex].products[productIndex].remarks = value;
      }
      return newCards;
    });
  };
  // ### card end

  // ### preview p.o state and handlers
  // const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [selectedTax, setSelectedTax] = useState(null);
  const [selectedTaxRate, setSelectedTaxRate] = useState(0);

  const handleClosePOModal = () => {
    setShowPOModal(false);
    setSelectedPO(null); // Reset when closing
  };

  // ### preview p.o end

  // ### pdf modal view for vendor products

  const [showPOModal, setShowPOModal] = useState(false);
  const [currentVendorPage, setCurrentVendorPage] = useState(0);
  const [vendorPages, setVendorPages] = useState([]);

  // Update your handleShowPOModal function
  const handleShowPOModal = () => {
    // Validate all cards before showing the modal
    const errors = {
      deliveryDate: {},
      quantities: {},
    };
    let hasErrors = false;

    vendorCards.forEach((card, cardIndex) => {
      // Validate delivery date
      if (!card.deliveryDate) {
        errors.deliveryDate[cardIndex] = "Delivery date is required";
        hasErrors = true;
      }

      // Validate quantities
      card.products.forEach((product, productIndex) => {
        if (!product.quantity || isNaN(parseFloat(product.quantity))) {
          if (!errors.quantities[cardIndex]) {
            errors.quantities[cardIndex] = {};
          }
          errors.quantities[cardIndex][productIndex] = "Quantity is required";
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);

    if (hasErrors) {
      swal(
        "Error",
        "Please fill in all required fields (marked in red)",
        "error"
      );
      return;
    }

    // If no errors, proceed to show modal
    const pages = vendorCards.map((card) => ({
      ...card,
      pageNumber: vendorCards.indexOf(card) + 1,
      totalPages: vendorCards.length,
    }));

    setVendorPages(pages);
    setCurrentVendorPage(0);
    setShowPOModal(true);
    fetchPreparedBy(userLoggedID);
  };

  // Add navigation handlers
  const handleNextPage = () => {
    if (currentVendorPage < vendorPages.length - 1) {
      setCurrentVendorPage(currentVendorPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentVendorPage > 0) {
      setCurrentVendorPage(currentVendorPage - 1);
    }
  };

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // ### pdf modal view end

  // ### create p.o
  const [validationErrors, setValidationErrors] = useState({
    deliveryDate: {},
    quantities: {},
  });

  // prepare PO Data
  const preparePOData = () => {
    const productTotals = {};

    vendorCards.forEach((card) => {
      card.products.forEach((product) => {
        const productId = product.productId || product.id;
        if (!productId) {
          console.error("Missing productId in product:", product);
          return;
        }

        const quantity = parseFloat(product.quantity) || 0;

        if (!productTotals[productId]) {
          productTotals[productId] = {
            productId: productId,
            productCode: product.productCode,
            productName: product.productName,
            totalQuantity: 0,
          };
        }
        productTotals[productId].totalQuantity += quantity;
      });
    });

    // Then generate the PO data with the calculated totals
    return vendorCards.map((card) => {
      // Calculate amounts for each card
      const cardSubtotal = card.products.reduce(
        (sum, product) =>
          sum +
          (parseFloat(product.quantity) || 0) *
            (parseFloat(product.price) || 0),
        0
      );

      // Use the taxRate from the card instead of selectedTaxRate
      const cardTaxRate = card.taxRate || 0;
      const cardVatAmount = cardSubtotal * (card.vat / 100);
      const cardWithholdingTax = cardSubtotal * (cardTaxRate / 100);
      const cardTotal = cardSubtotal + cardVatAmount - cardWithholdingTax;

      return {
        poNumber: card.poNumber,
        vendorId: card.vendorId,
        vendorName: card.vendorName,
        vendorAddress: card.vendorAddress,
        deliveryDate: card.deliveryDate,
        purchaseOrderDate:
          card.purchaseOrderDate || new Date().toISOString().split("T")[0],
        withholdingTaxId: card.taxId,
        withholdingTaxRate: cardTaxRate, // Use the card's tax rate
        shippingMethod: card.shippingMethod,
        paymentTerm: card.paymentTerm,
        shipTo: warehouseData[0]?.warehouse_id,
        vatRate: card.vat,
        subtotal: cardSubtotal,
        vatAmount: cardVatAmount,
        withholdingTax: cardWithholdingTax,
        total: cardTotal,
        preparedBy: userLoggedID,
        prId: id,
        productTotals: productTotals,
        products: card.products.map((product) => ({
          productId: product.productId,
          productCode: product.productCode,
          productName: product.productName,
          productOriginalQuantity: product.originalQuantity,
          quantity: parseFloat(product.quantity) || 0,
          price: parseFloat(product.price) || 0,
          remarks: product.remarks.substring(0, 50),
          productTotalSum: productTotals[product.productId]?.totalQuantity || 0,
        })),
      };
    });
  };

  const calculateProductTotals = () => {
    const productTotals = {};

    // First get all products with their original quantities from the purchase request
    const originalProducts = {};
    pagination.data.forEach((item) => {
      originalProducts[item.product_id] = item.quantity;
    });

    // Calculate total ordered quantities across all vendors
    vendorCards.forEach((card) => {
      card.products.forEach((product) => {
        // Ensure we're using the correct property name for product ID
        const productId = product.productId || product.id; // Try both common property names
        if (!productId) {
          console.error("Missing productId in product:", product);
          return;
        }

        const quantity = parseFloat(product.quantity) || 0;

        if (productTotals[productId]) {
          productTotals[productId].orderedQuantity += quantity;
        } else {
          productTotals[productId] = {
            productId: productId, // Explicitly set productId here
            productCode: product.productCode,
            productName: product.productName,
            orderedQuantity: quantity,
            originalQuantity: originalProducts[productId] || 0,
          };
        }
      });
    });

    // Now determine status based on the TOTAL ordered quantity
    Object.keys(productTotals).forEach((productId) => {
      const product = productTotals[productId];
      product.status =
        product.orderedQuantity >= product.originalQuantity
          ? "Ordered"
          : "Partial Order";
    });

    return productTotals;
  };

  // handle create PO
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const handleCreatePO = async () => {
    setIsCreatingPO(true);
    const productTotals = calculateProductTotals();

    const errors = {
      deliveryDate: {},
      quantities: {},
    };
    let hasErrors = false;

    vendorCards.forEach((card, cardIndex) => {
      if (!card.deliveryDate) {
        errors.deliveryDate[cardIndex] = "Delivery date is required";
        hasErrors = true;
      }

      card.products.forEach((product, productIndex) => {
        if (!product.quantity || isNaN(parseFloat(product.quantity))) {
          if (!errors.quantities[cardIndex]) {
            errors.quantities[cardIndex] = {};
          }
          errors.quantities[cardIndex][productIndex] = "Quantity is required";
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);

    if (hasErrors) {
      swal(
        "Error",
        "Please fill in all required fields (marked in red)",
        "error"
      );
      return;
    }

    const poData = preparePOData(); // this is an array
    const requestData = {
      poData,
      productTotals: Object.values(productTotals).map((product) => ({
        productId: product.productId,
        productCode: product.productCode,
        productName: product.productName,
        orderedQuantity: product.orderedQuantity,
        originalQuantity: product.originalQuantity,
        status: product.status,
        prId: id,
      })),
    };

    console.log("Final PO Data to be submitted:", requestData);

    try {
      const response = await axios.post(
        `${BASE_URL}/PurchaseOrder/createPO`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        swal({
          title: "Success!",
          text: "Purchase Order created successfully!",
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          // Optionally navigate or refresh data
          // navigate(`/purchases/purchase-order-list/${id}`);
          setIsCreatingPO(false);
          handlePurchaseOrderCard();
          setVendorCards([]);
          handleClosePOModal();
          reloadTable();
        });
      } else {
        throw new Error(response.data.message || "Failed to create PO");
      }
    } catch (error) {
      console.error("PO creation error:", error);
      swal({
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to create Purchase Order",
        icon: "error",
      });
    }
  };

  // ### po card state and fetch
  const [purchaseOrderCards, setPurchaseOrderCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Fetch purchase order cards
  const handlePurchaseOrderCard = async () => {
    setLoadingCards(true);
    try {
      console.log(`Fetching PO cards for PR ID: ${id}`);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getPurchaseOrderCards/${id}`
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        // Format dates before setting state
        const formattedCards = response.data.data.map((card) => ({
          ...card,
          po_date: card.po_date ? card.po_date.split("T")[0] : "",
          delivery_date: card.delivery_date
            ? card.delivery_date.split("T")[0]
            : "",
        }));

        setPurchaseOrderCards(formattedCards);
      } else {
        // swal(
        //   "Error",
        //   response.data.message || "No purchase orders found for this PR",
        //   "info" // Changed to "info" since no POs might be a normal case
        // );
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response,
      });
    } finally {
      setLoadingCards(false);
    }
  };
  // ### po card end

  useEffect(() => {
    handlePurchaseOrderCard();
  }, [id]);

  // ### create p.o end
  if (loading) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseRequest) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <p>Purchase request not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/purchase-request")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">PURCHASE REQUEST DETAILS </span>
          </span>
        </div>
      </div>

      <Form noValidate onSubmit={handleSaveChanges}>
        <div className="container-fluid mt-4">
          <div className="row mb-3">
            <div className="col-sm">
              <label htmlFor="pr_no">PR NO.</label>
              <input
                type="text"
                className="form-control"
                id="pr_no"
                name="pr_no"
                value={purchaseRequest.pr_no || ""}
                readOnly
                required
              />
            </div>
            <div className="col-sm">
              <label htmlFor="dateNeeded">Date Needed</label>
              <input
                type="date"
                className="form-control"
                id="dateNeeded"
                name="date_needed"
                value={formValues.date_needed}
                onChange={(e) =>
                  setFormValues({ ...formValues, date_needed: e.target.value })
                }
                required
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                name="remarks"
                id="remarks"
                cols="5"
                rows="5"
                className="form-control"
                value={formValues.remarks}
                onChange={(e) =>
                  setFormValues({ ...formValues, remarks: e.target.value })
                }
                readOnly={!isEditing}
              />
            </div>
            <div className="col-sm">
              {purchaseRequest.status === "Rejected" && (
                <div>
                  <label className="">Reject Remarks</label>
                  <textarea
                    name="remarks"
                    id="remarks"
                    cols="5"
                    rows="5"
                    className="form-control"
                    value={purchaseRequest.rejectRemarks || ""}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="container-fluid mt-4">
          <div className="w-100 d-flex align-items-center">
            <span>Order Items</span>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="container-fluid mt-3">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive"
                id="purchaseRequestProductListTableView"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT ID
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      QUANTITY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      ORDERED QUANTITY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
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
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      {/* Empty header for delete button */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="5" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr key={item.id}>
                        <td>{item.product_code}</td>
                        <td>{item.product_name}</td>
                        <td>
                          {item.quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          {item.ordered_quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>{item.remarks}</td>
                        <td>
                          <span
                            className="py-2 px-3 rounded text-center"
                            style={{
                              display: "block",
                              backgroundColor: getStatusStyles(item.status).bg,
                              color: getStatusStyles(item.status).text,
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {roleType?.includes("") &&
                            item.status !== "Ordered" && (
                              <button
                                type="button"
                                style={{ marginTop: "3px" }}
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => handleCartClick(item)}
                              >
                                <i className="fa-solid fa-cart-plus"></i>
                              </button>
                            )}
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

        <div className="container-fluid mt-5 d-flex flex-row align-items-center justify-content-end d-none">
          {purchaseRequest.status !== "Rejected" && (
            <div className="d-flex flex-row">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Make Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger mx-3"
                    onClick={showRejectModal}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={showApproveModal}
                  >
                    Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel Changes
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary mx-3"
                    onClick={handleSaveChanges} // Add this
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Form>

      {/* Purchase Order */}
      <div className="container-fluid mt-5">
        <div className="w-100 d-flex align-items-center">
          <span>Purchase Order</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        {/* card */}
        <div className="w-100 row mt-3">
          {vendorCards.map((card, index) => (
            <div key={index} className="col-md-6 mb-4 position-relative">
              {/* Delete button */}
              <button
                className="btn btn-danger btn-sm position-absolute"
                style={{ top: "5px", right: "20px", zIndex: 1 }}
                onClick={() => handleDeleteCard(index)}
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="card h-100 border shadow-sm">
                <div className="card-body p-0 pb-3">
                  <div className="card-title p-2 bg-secondary rounded-top text-white">
                    Purchase Order No: {card.poNumber}
                  </div>

                  <div className="px-4 w-100 row">
                    <div className="col-sm d-flex flex-column">
                      <span>
                        <strong>Vendor Name:</strong>
                        <span className="mx-2">{card.vendorName}</span>
                      </span>
                      <span>
                        <strong>Vendor Address:</strong>
                        <span className="mx-2">{card.vendorAddress}</span>
                      </span>
                      <span>
                        <strong>VAT:</strong>
                        <span className="mx-2">{card.vat}% </span>
                      </span>
                    </div>

                    <div className="col-sm d-flex flex-column align-items-start">
                      <div className="mb-1 d-none">
                        <span>Estimated Days to Deliver</span>
                        <span className="d-flex flex-row align-items-center">
                          <input
                            type="number"
                            min="0"
                            value={card.deliveryEstimateFrom || ""}
                            className="form-control form-control-sm"
                            style={{ maxWidth: "5rem" }}
                            onChange={(e) =>
                              handleDeliveryEstimateChange(
                                index,
                                "from",
                                e.target.value
                              )
                            }
                            placeholder="From"
                          />
                          <span className="mx-2">To</span>
                          <input
                            type="number"
                            min="1"
                            value={card.deliveryEstimateTo || ""}
                            className="form-control form-control-sm"
                            style={{ maxWidth: "5rem" }}
                            onChange={(e) =>
                              handleDeliveryEstimateChange(
                                index,
                                "to",
                                e.target.value
                              )
                            }
                            placeholder="To"
                          />
                        </span>
                      </div>

                      <div className="d-flex flex-row mb-1">
                        <div className="mx-2">
                          <label htmlFor="">
                            <strong>PO Date</strong>
                          </label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={
                              card.purchaseOrderDate ||
                              new Date().toISOString().split("T")[0] // default to today
                            }
                            onChange={(e) =>
                              handlePurchaseOrderDate(index, e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label htmlFor="">
                            <strong>Delivery Date</strong>
                          </label>
                          <input
                            type="date"
                            name=""
                            id=""
                            className={`form-control form-control-sm ${
                              validationErrors.deliveryDate[index]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={card.deliveryDate || ""}
                            onChange={(e) => {
                              handleDeliveryDateChange(index, e.target.value);
                              // Clear error when user types
                              if (validationErrors.deliveryDate[index]) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  deliveryDate: {
                                    ...prev.deliveryDate,
                                    [index]: null,
                                  },
                                }));
                              }
                            }}
                          />
                          {validationErrors.deliveryDate[index] && (
                            <div className="invalid-feedback">
                              {validationErrors.deliveryDate[index]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mx-2">
                        <label htmlFor="paymentTerm">
                          <strong>Withholding Tax</strong>
                        </label>
                        <br />
                        <select
                          name="tax"
                          id="tax"
                          className="form-select form-select-sm w-100"
                          onChange={(e) => {
                            if (e.target.value === "") {
                              setVendorCards((prevCards) => {
                                const newCards = [...prevCards];
                                newCards[index].taxId = null;
                                newCards[index].taxRate = 0;
                                return newCards;
                              });
                            } else {
                              const selected = taxData.find(
                                (tax) => tax.id === e.target.value
                              );
                              if (selected) {
                                setVendorCards((prevCards) => {
                                  const newCards = [...prevCards];
                                  newCards[index].taxId = selected.id;
                                  newCards[index].taxRate = parseFloat(
                                    selected.rate
                                  );
                                  return newCards;
                                });
                              }
                            }
                          }}
                          value={card.taxId || ""}
                        >
                          <option value="">Select Tax</option>
                          {taxData.map((item, index) => (
                            <option key={index} value={item.id}>
                              {item.name} ({item.rate}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="w-100 d-flex align-items-center">
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="px-4 w-100 row mb-3 ">
                    <div className="col-sm">
                      <label htmlFor="shippingMethod">
                        <strong>Shipping Method</strong>
                      </label>
                      <input
                        type="text"
                        name=""
                        id="shippingMethod"
                        value={card.shippingMethod || ""}
                        className="form-control form-control-sm"
                        onChange={(e) =>
                          handleShippingMethod(
                            index,

                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <label htmlFor="paymentTerm">
                        <strong>Payment Term</strong>
                      </label>
                      <input
                        type="text"
                        name=""
                        id="paymentTerm"
                        value={card.paymentTerm || ""}
                        className="form-control form-control-sm"
                        onChange={(e) =>
                          handlePaymentTerm(
                            index,

                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="px-3 w-100 table-responsive">
                    <table className="table">
                      <thead>
                        <tr className="table-secondary">
                          <th style={{ width: "20%" }} scope="col">
                            Product Code
                          </th>
                          <th style={{ width: "20%" }} scope="col">
                            Product Name
                          </th>
                          <th style={{ width: "15%" }} scope="col">
                            Quantity
                          </th>
                          <th
                            style={{ width: "15%" }}
                            scope="col"
                            className={
                              roleType?.includes("Management") ? "" : "d-none"
                            }
                          >
                            Price
                          </th>
                          <th style={{ width: "20%" }} scope="col">
                            Remarks
                          </th>
                          <th style={{ width: "10%" }} scope="col"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {card.products.map((product, productIndex) => (
                          <tr key={product.id}>
                            <td>{product.productCode}</td>
                            <td>{product.productName}</td>
                            <td>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className={`form-control form-control-sm ${
                                  validationErrors.quantities[index]?.[
                                    productIndex
                                  ]
                                    ? "is-invalid"
                                    : ""
                                }`}
                                value={product.quantity}
                                onChange={(e) => {
                                  handleProductQuantityChange(
                                    index,
                                    product.id,
                                    e.target.value
                                  );
                                  // Clear error when user types
                                  if (
                                    validationErrors.quantities[index]?.[
                                      productIndex
                                    ]
                                  ) {
                                    setValidationErrors((prev) => {
                                      const newErrors = { ...prev };
                                      if (newErrors.quantities[index]) {
                                        delete newErrors.quantities[index][
                                          productIndex
                                        ];
                                        // If no more errors for this card, remove the card entry
                                        if (
                                          Object.keys(
                                            newErrors.quantities[index]
                                          ).length === 0
                                        ) {
                                          delete newErrors.quantities[index];
                                        }
                                      }
                                      return newErrors;
                                    });
                                  }
                                }}
                              />
                              {validationErrors.quantities[index]?.[
                                productIndex
                              ] && (
                                <div className="invalid-feedback d-block">
                                  {
                                    validationErrors.quantities[index][
                                      productIndex
                                    ]
                                  }
                                </div>
                              )}
                            </td>
                            <td
                              className={
                                roleType?.includes("Management") ? "" : "d-none"
                              }
                            >
                              {parseFloat(product.price).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={product.remarks}
                                onChange={(e) =>
                                  handleProductRemarksChange(
                                    index,
                                    product.id,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <button
                                className="border-0 btn-sm fs-6"
                                style={{ background: "inherit" }}
                                onClick={() =>
                                  handleRemoveProduct(index, product.id)
                                }
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm">
            <button
              className="w-100 btn btn-primary py-2"
              onClick={() => handleShowPOModal(true, null)}
              disabled={vendorCards.length === 0}
            >
              Preview PO
            </button>
          </div>
        </div>
      </div>

      {/* on going order card*/}
      {purchaseOrderCards.length > 0 && (
        <div className="container-fluid mt-5">
          <div className="w-100 d-flex align-items-center">
            <span>Old Purchase Order</span>
            <hr className="flex-grow-1 mx-3" />
          </div>

          {loadingCards ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="w-100 row mt-3">
              {purchaseOrderCards.map((card, index) => (
                <div key={index} className="col-md-6 mb-4 position-relative">
                  <div className="card h-100 border shadow-sm">
                    <div className="card-body p-0 pb-3">
                      <div className="card-title p-2 bg-secondary rounded-top text-white d-flex flex-row justify-content-between">
                        <div>Purchase Order No: {card.po_number}</div>
                        <div>
                          Date Created:{" "}
                          {new Date(card.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "2-digit",
                            }
                          )}
                        </div>
                      </div>

                      <div className="px-4 w-100 row">
                        <div className="col-sm d-flex flex-column">
                          <span>
                            <strong>Vendor Name:</strong>
                            <span className="mx-2">{card.vendor_name}</span>
                          </span>
                          <span>
                            <strong>Vendor Address:</strong>
                            <span className="mx-2">{card.vendor_address}</span>
                          </span>
                          <span>
                            <strong>VAT:</strong>
                            <span className="mx-2">{card.vat_rate}%</span>
                          </span>
                          <span>
                            <strong>Withholding Tax:</strong>
                            <span className="mx-2">
                              {card.withholding_tax_rate}%
                            </span>
                          </span>
                        </div>

                        <div className="col-sm d-flex flex-column align-items-start">
                          <div className="d-flex flex-row mb-1">
                            <div className="mx-2">
                              <label>
                                <strong>PO Date</strong>
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={card.po_date}
                                readOnly
                              />
                            </div>

                            <div>
                              <label>
                                <strong>Delivery Date</strong>
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={card.delivery_date}
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="mx-2">
                            <strong>Status:</strong>
                            <span
                              className={`mx-2 ${
                                card.status === "For Approval"
                                  ? "text-danger"
                                  : "text-primary"
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-100 d-flex align-items-center">
                        <hr className="flex-grow-1 mx-3" />
                      </div>

                      <div className="px-4 w-100 row mb-3">
                        <div className="col-sm">
                          <label htmlFor="shippingMethod">
                            <strong>Shipping Method</strong>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={card.shipping_method}
                            readOnly
                          />
                        </div>
                        <div className="col-sm">
                          <label htmlFor="paymentTerm">
                            <strong>Payment Term</strong>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={card.payment_term}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="px-3 w-100 table-responsive">
                        <table className="table">
                          <thead>
                            <tr className="table-secondary">
                              <th style={{ width: "20%" }}>Product Code</th>
                              <th style={{ width: "25%" }}>Product Name</th>
                              <th style={{ width: "10%" }}>Quantity</th>
                              <th
                                style={{ width: "10%" }}
                                className={
                                  roleType?.includes("Management")
                                    ? ""
                                    : "d-none"
                                }
                              >
                                Price
                              </th>
                              <th style={{ width: "25%" }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.products?.map((product, productIndex) => (
                              <tr key={productIndex}>
                                <td>{product.product_code}</td>
                                <td>{product.product_name}</td>
                                <td>
                                  {parseFloat(product.quantity).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td
                                  className={
                                    roleType?.includes("Management")
                                      ? ""
                                      : "d-none"
                                  }
                                >
                                  {parseFloat(product.price).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>{product.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="px-3 w-100">
                        <div className="d-flex flex-row flex-direction-row justify-content-between">
                          <div></div>
                          {roleType?.includes("Management") && (
                            <div className="d-flex flex-row justify-content-end">
                              <div className="d-flex flex-column">
                                <span className="text-start">
                                  <strong>SUBTOTAL ORDER:</strong> PHP{" "}
                                  {parseFloat(card.subtotal).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                                <span className="text-start">
                                  <strong>TOTAL VAT ({card.vat_rate}%):</strong>{" "}
                                  <span className="text-primary">
                                    PHP{" "}
                                    {parseFloat(card.vat_amount).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </span>
                                </span>
                                <span className="text-start">
                                  <strong>
                                    WITHHOLDING TAX ({card.withholding_tax_rate}
                                    %):
                                  </strong>{" "}
                                  <span className="text-danger">
                                    PHP{" "}
                                    {parseFloat(
                                      card.withholding_tax
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </span>
                                <span className="text-start">
                                  <strong>TOTAL ORDER AMOUNT:</strong>{" "}
                                  <span className="fw-semibold">
                                    PHP{" "}
                                    {parseFloat(
                                      card.total_amount
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* modals */}
      <Modal
        show={showProductModal}
        onHide={() => {
          setShowProductModal(false);
          setSearchText("");
        }}
        backdrop="static"
        size="xl"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="container-fluid">
              <div className="row mb-3">
                <div className="col-md-6">
                  <p>
                    <strong>Product Code:</strong>{" "}
                    {selectedProduct.product_code}
                  </p>
                  <p>
                    <strong>Product Name:</strong>{" "}
                    {selectedProduct.product_name}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Quantity:</strong>{" "}
                    {selectedProduct.quantity.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedProduct.status}
                  </p>
                </div>
              </div>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
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
                  <li className="d-none">
                    <button
                      className={`dropdown-item ${
                        filterColumn === "vendor_id" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("vendor_id")}
                    >
                      Vendor ID
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "vendor_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("vendor_name")}
                    >
                      Vendor Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "contact" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("contact")}
                    >
                      Contact
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "email" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("email")}
                    >
                      E-Mail
                    </button>
                  </li>
                </ul>
              </div>
              <div className="w-100">
                <div className="table-responsive data-table scrollable-contents">
                  <table
                    className="table table-hover table-responsive"
                    id="purchaseRequestProductDetailsTable"
                  >
                    <thead className="table-light">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectAll && vendors.length > 0}
                            onChange={handleSelectAll}
                            className="form-check-input border border-secondary"
                            style={{ height: "1.3rem", width: "1.3rem" }}
                            disabled={vendors.length === 0}
                          />
                        </th>
                        <th className="d-none">VENDOR ID</th>
                        <th>VENDOR NAME</th>
                        <th>CONTACT</th>
                        <th>EMAIL ADDRESS</th>
                        <th
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          PRICE
                        </th>
                        <th className="d-none">ADDRESS</th>
                        <th className="d-none">VAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length > 0 ? (
                        vendors.map((vendor) => {
                          const individualName = `${
                            vendor.vendor.fname || ""
                          } ${vendor.vendor.lname || ""}`.trim();
                          const vendorName =
                            individualName ||
                            vendor.vendor.company_name ||
                            "N/A";
                          const contact =
                            vendor.vendor.contact ||
                            vendor.vendor.contact2 ||
                            "N/A";

                          return (
                            <tr key={vendor.vendor_id}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input border border-secondary"
                                  style={{
                                    height: "1.3rem",
                                    width: "1.3rem",
                                  }}
                                  checked={selectedVendors.includes(
                                    vendor.vendor_id
                                  )}
                                  onChange={() =>
                                    handleVendorSelect(vendor.vendor_id)
                                  }
                                />
                              </td>
                              <td className="d-none">{vendor.vendor_id}</td>
                              <td>{vendorName}</td>
                              <td>{contact}</td>
                              <td>{vendor.vendor.company_email || "N/A"}</td>
                              <td
                                className={
                                  roleType?.includes("Management")
                                    ? ""
                                    : "d-none"
                                }
                              >
                                <div className="d-flex flex-row align-items-center">
                                  <input
                                    type="text"
                                    value={vendorPrices[vendor.vendor_id] || ""}
                                    className="form-control"
                                    readOnly={
                                      editingPriceId !== vendor.vendor_id
                                    }
                                    onChange={(e) =>
                                      handlePriceChange(
                                        vendor.vendor_id,
                                        e.target.value
                                      )
                                    }
                                  />
                                  {editingPriceId === vendor.vendor_id ? (
                                    <button
                                      className="btn btn-success btn-sm mx-2"
                                      onClick={() =>
                                        handlePriceSave(vendor.vendor_id)
                                      }
                                    >
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-primary btn-sm mx-2"
                                      onClick={() =>
                                        handlePriceEdit(vendor.vendor_id)
                                      }
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="d-none">
                                {vendor.vendor.company_address || "N/A"}
                              </td>
                              <td className="d-none">
                                {vendor.vendor.vat || "0"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            No vendors found for this product
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {vendors.length > 0 && <PaginationControls {...pagination} />}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowProductModal(false);
              setSearchText("");
            }}
          >
            Close
          </Button>
          {/* <Button
              variant="primary"
              onClick={() => {
                console.log("Selected Vendors:", selectedVendors);
                console.log("Vendor Prices:", vendorPrices);
                // Here you can add logic to process the selected vendors and their prices
                setShowProductModal(false);
                setSearchText("");
              }}
            > */}
          <Button variant="primary" onClick={handleConfirmVendors}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Modal Container for Vendor Products */}
      <div className="pdf-modal-container">
        <Modal
          backdrop="static"
          show={showPOModal}
          onHide={handleClosePOModal}
          dialogClassName="pdf-custom-modal-width"
        >
          <Modal.Header
            className="p-0 text-white p-2 px-3 white-close-btn border-0"
            style={{
              background: "#595959",
              height: "60px",
            }}
            closeButton
          >
            <Modal.Title>PREVIEW P.O LIST</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: "#AEAEAE" }} className="p-4">
            {vendorPages.length > 0 && (
              <div
                className="container-fluid bg-white p-3 rounded"
                id="pdfVendorCanvassPage"
              >
                {/* Header Section */}
                <div className="text-center mb-4">
                  <img
                    src={Logo}
                    className="img-fluid"
                    alt="Logo"
                    style={{ maxHeight: "100px" }}
                  />
                  <h5 className="mb-2" style={{ fontWeight: 700 }}>
                    CONCORD SCIENTIFIC AND CHEMICAL CORPORATION
                  </h5>
                  <span>
                    The Richwell Center, Unit 603 102 Timog Avenue, Barangay
                    Sacred Heart, Quezon City
                  </span>
                  <br />
                  <span>VAT Reg. TIN: 000-388-249</span>
                  <br />
                  <span>Telephone No: 896-3562</span>
                </div>
                {/* Vendor PO Content */}
                <div className="w-100 d-flex flex-row justify-content-center mb-3">
                  <div className="mb-3" style={{ width: "800px" }}>
                    <h5 className="fw-bold text-center fs-3">PURCHASE ORDER</h5>
                    <div className="w-100 mt-3 d-flex flex-row justify-content-between gap-4">
                      <div className="w-50 d-flex flex-column align-items-start">
                        <span className="text-start">
                          <strong>PO NO:</strong>{" "}
                          {vendorPages[currentVendorPage].poNumber}
                        </span>
                        <span className="text-start">
                          <strong>Date Issued:</strong>{" "}
                          {new Date(
                            vendorPages[currentVendorPage]?.purchaseOrderDate ||
                              new Date()
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="w-50 text-start">
                        <span>
                          <strong>Ship To:</strong> {warehouseData[0].name}
                        </span>
                      </div>
                    </div>
                    <div className="w-100 mt-3 d-flex flex-row justify-content-between gap-4">
                      <div className="w-50 d-flex flex-column align-items-start">
                        <span className="text-start">
                          <strong>Vendor:</strong>{" "}
                          {vendorPages[currentVendorPage].vendorName}
                        </span>
                        <span className="text-start">
                          <strong>Address:</strong>{" "}
                          {vendorPages[currentVendorPage].vendorAddress}
                        </span>
                        <span className="text-start">
                          <strong>Email:</strong>{" "}
                          {vendorPages[currentVendorPage].vendorEmail}
                        </span>
                      </div>
                      <div className="w-50 d-flex flex-column align-items-start">
                        <span className="text-start">
                          <strong>Delivery Date: </strong>
                          {formatDate(
                            vendorPages[currentVendorPage].deliveryDate
                          )}
                        </span>
                        <span className="text-start">
                          <strong>Shipping Method:</strong>{" "}
                          {vendorPages[currentVendorPage].shippingMethod}
                        </span>
                        <span className="text-start">
                          <strong>Payment Terms:</strong>{" "}
                          {vendorPages[currentVendorPage].paymentTerm}
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
                        <th style={{ background: "#7B7B7B", color: "#fff" }}>
                          QUANTITY
                        </th>
                        <th
                          style={{ background: "#7B7B7B", color: "#fff" }}
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          UNIT PRICE
                        </th>
                        <th
                          style={{ background: "#7B7B7B", color: "#fff" }}
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorPages[currentVendorPage].products.map(
                        (product) => (
                          <tr key={product.id}>
                            <td>{product.productName}</td>
                            <td>
                              {(!isNaN(parseFloat(product.quantity))
                                ? parseFloat(product.quantity)
                                : 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td
                              className={
                                roleType?.includes("Management") ? "" : "d-none"
                              }
                            >
                              {(!isNaN(parseFloat(product.price))
                                ? parseFloat(product.price)
                                : 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td
                              className={
                                roleType?.includes("Management") ? "" : "d-none"
                              }
                            >
                              {(
                                (!isNaN(parseFloat(product.quantity))
                                  ? parseFloat(product.quantity)
                                  : 0) *
                                (!isNaN(parseFloat(product.price))
                                  ? parseFloat(product.price)
                                  : 0)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )
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
                          {formatNumber(
                            vendorPages[currentVendorPage].products.reduce(
                              (sum, product) =>
                                sum + product.quantity * product.price,
                              0
                            )
                          )}
                        </span>

                        {/* Calculate VAT */}
                        <span
                          className="text-start"
                          title="SUB TOTAL ORDER x VAT RATE"
                        >
                          <strong>
                            TOTAL VAT ({vendorPages[currentVendorPage].vat ?? 0}
                            %):
                          </strong>{" "}
                          <span>
                            PHP{" "}
                            {formatNumber(
                              vendorPages[currentVendorPage].products.reduce(
                                (sum, product) =>
                                  sum +
                                  (parseFloat(product.quantity) || 0) *
                                    (parseFloat(product.price) || 0),
                                0
                              ) *
                                ((vendorPages[currentVendorPage].vat ?? 0) /
                                  100)
                            )}
                          </span>
                        </span>

                        {/* Calculate Withholding Tax */}
                        <span
                          className="text-start"
                          title="SUB TOTAL ORDER x TAX RATE"
                        >
                          <strong>
                            WITHHOLDING TAX (
                            {vendorPages[currentVendorPage].taxRate ?? 0}%):
                          </strong>{" "}
                          <span>
                            PHP{" "}
                            {formatNumber(
                              vendorPages[currentVendorPage].products.reduce(
                                (sum, product) =>
                                  sum +
                                  (parseFloat(product.quantity) || 0) *
                                    (parseFloat(product.price) || 0),
                                0
                              ) *
                                (vendorPages[currentVendorPage].taxRate / 100)
                            )}
                          </span>
                        </span>

                        {/* Calculate Grand Total */}
                        <span
                          className="text-start"
                          title="SUB TOTAL ORDER + VAT AMOUNT - TAX AMOUNT"
                        >
                          <strong>TOTAL ORDER AMOUNT:</strong>{" "}
                          {(() => {
                            const subtotal = vendorPages[
                              currentVendorPage
                            ].products.reduce(
                              (sum, product) =>
                                sum + product.quantity * product.price,
                              0
                            );
                            const vatAmount =
                              subtotal *
                              (vendorPages[currentVendorPage].vat / 100);
                            const withholdingTax =
                              subtotal *
                              (vendorPages[currentVendorPage].taxRate / 100);
                            const total = subtotal + vatAmount - withholdingTax;
                            return `PHP ${formatNumber(total)}`;
                          })()}
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
                        {purchaseRequest.requestor.full_name}
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
                        {preparedByData}
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
                      ></div>
                      <strong>NAME</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page Navigation */}
            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="secondary"
                onClick={handlePrevPage}
                disabled={currentVendorPage === 0}
              >
                Previous
              </Button>

              <span className="text-white fw-semibold align-self-center">
                Page {currentVendorPage + 1} of {vendorPages.length}
              </span>

              <Button
                variant="secondary"
                onClick={handleNextPage}
                disabled={currentVendorPage === vendorPages.length - 1}
              >
                Next
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer
            className="p-0 p-2 border-0"
            style={{ background: "#595959", height: "60px" }}
          >
            <Button
              variant="primary"
              onClick={handleCreatePO}
              disabled={isCreatingPO}
            >
              {isCreatingPO ? "Creating..." : "Create P.O"}
            </Button>
            {/* {authrztn?.includes("PurchaseRequest-Approve") && (
              <>
                <Button
                  variant="primary"
                  onClick={handleCreatePO}
                  disabled={isCreatingPO}
                >
                  {isCreatingPO ? "Creating..." : "Create P.O"}
                </Button>
              </>
            )} */}
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};
export default Purchase_request_view;
