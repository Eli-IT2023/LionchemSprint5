import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

const Create_invoice_update = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return manilaTime;
  };

  const [paginationUrlProduct, setPaginationUrlProduct] = useState();
  const [show, setShow] = useState(false);

  const paginationProduct = useServerPagination(paginationUrlProduct, 10);

  const handleShow = () => {
    setShow(true);
    setPaginationUrlProduct(BASE_URL + "/sales_invoice/getStockmanagement");
    paginationProduct.updateParams({ selectedWarehouse: selectedWarehouse });
  };

  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [customerData, setCustomerData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [cutOffData, setCutOffData] = useState([]);
  const [taxSettingsData, setTaxSettingsData] = useState([]);
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState(
    getManilaDate()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  const [inputPaymentTerms, setInputPaymentTerms] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("Local");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [sales_invoiceText, setSales_invoiceText] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  const [remarks, setRemarks] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [taxSelectedID, setTaxSelectedID] = useState("");
  const [salesStatus, setSalesStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isCheckedDelivery, setIsCheckedDelivery] = useState(false);
  const [isCheckedTax, setIsCheckedTax] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleSearchProduct = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    setPaginationUrlProduct(
      BASE_URL + "/sales_invoice/getStockmanagent_Search"
    );

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      paginationProduct.updateParams({
        searchTerm: value,
        selectedWarehouse: selectedWarehouse,
      });
    }, 500);

    setDebounceTimer(timer);
  };

  const handleCheckBoxTax = (e) => {
    setIsCheckedTax(e.target.checked);

    if (e.target.checked === true) {
      fetchTaxSettings();
    } else {
      setTaxSettingsData([]);
      setTaxSelectedID("");
    }
  };

  const fetchTaxSettings = () => {
    axios
      .get(BASE_URL + "/sales_invoice/getTaxSettings")
      .then((res) => {
        setTaxSettingsData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchTransactionCode = (isDeliveryChecked) => {
    const now = new Date();
    const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const formattedDateTime = manilaTime
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const randomTwoDigits = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");

    if (!identifier) {
      setIdentifier(`${formattedDateTime}${randomTwoDigits}`);
    }

    const prefix = isDeliveryChecked ? "DR" : "SI";
    const customTransactionId = identifier
      ? `${prefix}-${identifier}`
      : `${prefix}-${formattedDateTime}${randomTwoDigits}`;
    setTransactionId(customTransactionId);
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/invoice/getCutoffPosted")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCustomerCurrency = async () => {
    try {
      const [currencyRes, customerRes] = await Promise.all([
        axios.get(`${BASE_URL}/currency/fetchCurrency`),
        axios.get(`${BASE_URL}/invoice/getCustomersData`),
      ]);

      setCurrencyData(currencyRes.data);

      const sortedCustomerList = customerRes.data.sort(
        (a, b) => b.customer_id - a.customer_id
      );
      setCustomerData(sortedCustomerList);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalesSpecificData = async (salesId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/sales_invoice/getSpecificSalesData`,
        {
          params: { id: salesId },
        }
      );

      if (response.data) {
        const data = response.data;

        setTransactionId(data.transaction_id);
        setSelectedDestination(data.destination);
        setSales_invoiceText(data.sales_invoice);
        setIsCheckedDelivery(data.is_only_deliver_number);
        setDeliveryText(data.delivery_number);
        setSelectedCustomer(data.customer?.customer_id);
        setPoNumber(data.po_number);
        setSelectedDueDate(data.due_date);
        setSelectedInvoiceDate(data.invoice_date);
        setSelectedMethod(data.payment_method);
        setInputPaymentTerms(data.payment_terms);
        setIsCheckedTax(data.is_tax_applied);
        setTaxSelectedID(data.tax_setting?.id);
        setSelectedCurrency(data.currency?.id);
        setRemarks(data.remarks);
        setSalesStatus(data.status);
        if (
          data.products &&
          Array.isArray(data.products) &&
          data.products.length > 0
        ) {
          const formattedItems = data.products.map((item) => ({
            salesTagProductId: item.salesTagProductId,
            product_id: item.product_id,
            product_code: item.product_code || "",
            product_name: item.product_name || "",
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            discount: parseFloat(item.discount) || 0,
            subtotal: parseFloat(item.subtotal) || 0,
            isDeleted: false,
          }));

          setSelectedItems(formattedItems);
        } else {
          console.warn("No products found in response data:", data);
          setSelectedItems([]);
        }
      } else {
        console.error("No data received from API");
        setSelectedItems([]);
      }
    } catch (error) {
      console.error("Error fetching sales invoice:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      swal({
        title: "Error",
        text:
          "Failed to fetch sales invoice data: " +
          (error.response?.data?.message || error.message),
        icon: "error",
        buttons: false,
        timer: 3000,
      });

      setSelectedItems([]); // Clear items on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (id) {
      fetchSalesSpecificData(id);
      setIsUpdate(true);
      setIsEditing(true);
    } else {
      fetchTransactionCode(isCheckedDelivery);
      fetchCutOff();
      setIsEditing(false);
      setIsUpdate(false);
    }
    fetchCustomerCurrency();
    fetchTaxSettings();
  }, [id]);

  useEffect(() => {
    fetchTransactionCode(isCheckedDelivery);
  }, [isCheckedDelivery]);

  const handleCurrencyRateChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setCurrencyRate(formattedValue);
  };

  const dateValidation = async (selectedDate, clearField) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      if (res.data === false) {
        swal({
          icon: "error",
          title: "Invalid Date Selection",
          text: "Please Create Cutoff for this Date",
        }).then(() => {
          clearField("");
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDueDateChange = (date) => {
    const dueDate = date;
    setSelectedDueDate(dueDate);
  };

  const handleDueInvoiceDate = (date) => {
    const invoiceDate = date;
    setSelectedInvoiceDate(invoiceDate);
    if (invoiceDate) {
      dateValidation(invoiceDate, setSelectedInvoiceDate);
    }

    const isWithinCutoff = cutOffData.some((cutoff) => {
      const fromDate = new Date(cutoff.from);
      const toDate = new Date(cutoff.to);
      const selectedDate = new Date(invoiceDate);

      return selectedDate >= fromDate && selectedDate <= toDate;
    });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Invoice Date Conflict",
        text: "The invoice date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setSelectedInvoiceDate("");
      });
    }
  };

  const CancelInvoice = () => {
    navigate("/sales/invoices");
  };

  const handleChangeCurrency = (value) => {
    const curr = currencyData.find((data) => String(data.id) === String(value));
    setSelectedCurrency(curr.id);
    setCurrencyRate(curr.currency_rate);
  };

  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control custom-form-height w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
        backgroundColor: !isEditing ? "white" : "#e9ecef",
        color: !isEditing ? "black" : "gray",
        cursor: !isEditing ? "pointer" : "not-allowed",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      required
      placeholder="Select Date"
    />
  ));

  const handleCheckSelectProduct = (item, isChecked) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);

      if (isChecked) {
        if (existing) {
          return prev.map((i) =>
            i.product_id === item.product_id ? { ...i, isDeleted: false } : i
          );
        } else {
          return [
            ...prev,
            {
              ...item,
              isDeleted: false,
              quantity: 0,
              unitPrice: item.avgPrice || 0,
              discount: 0,
            },
          ];
        }
      } else {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, isDeleted: true } : i
        );
      }
    });
  };

  const isItemSelected = (item) =>
    selectedItems.some(
      (i) => i.product_id === item.product_id && i.isDeleted === false
    );

  // item quantity
  const handleQuantityChange = (productId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Number(value) || 0 }
          : item
      )
    );
  };

  // item unit price
  const handleUnitPriceChange = (productId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, unitPrice: Number(value) || 0 }
          : item
      )
    );
  };

  // item discount
  const handleDiscountChange = (productId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, discount: Number(value) || 0 }
          : item
      )
    );
  };

  // Calculate subtotal for individual item
  const calculateSubtotal = (quantity, unitPrice, discount) => {
    const gross = quantity * unitPrice;
    const discountAmount = (gross * discount) / 100;
    return gross - discountAmount;
  };

  // Calculate total gross amount
  const calculateTotalGross = () => {
    return selectedItems
      .filter((item) => item.isDeleted === false)
      .reduce((total, item) => {
        const subtotal = calculateSubtotal(
          item.quantity || 0,
          item.unitPrice || 0,
          item.discount || 0
        );
        return total + subtotal;
      }, 0);
  };

  // Get selected tax rate
  const getSelectedTaxRate = () => {
    if (!isCheckedTax || !taxSelectedID) return 0;
    const selectedTax = taxSettingsData.find((tax) => tax.id === taxSelectedID);
    return selectedTax ? selectedTax.rate : 0;
  };

  // Calculate withhold tax deduction
  const calculateWithholdTax = () => {
    if (!isCheckedTax) return 0;
    const totalGross = calculateTotalGross();
    const taxRate = getSelectedTaxRate();
    return (totalGross * taxRate) / 100;
  };

  // Calculate net receivable amount
  const calculateNetReceivable = () => {
    const totalGross = calculateTotalGross();
    const withholdTax = calculateWithholdTax();
    return totalGross - withholdTax;
  };

  const handleSubmitFormulation = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const activeItems = selectedItems.filter(
      (item) => item.isDeleted === false
    );

    if (form.checkValidity() === false || activeItems.length === 0) {
      e.preventDefault();
      e.stopPropagation();

      let errorMessage = "Please fill in the red text fields.";
      if (activeItems.length === 0) {
        errorMessage = "Please select at least one product.";
      }

      console.log(activeItems, "Active Items");

      swal({
        icon: "error",
        title: "Fields are required",
        text: errorMessage,
      });
    } else {
      const invalidItems = activeItems.filter(
        (item) =>
          !item.quantity ||
          item.quantity <= 0 ||
          !item.unitPrice ||
          item.unitPrice <= 0
      );

      if (invalidItems.length > 0) {
        swal({
          icon: "error",
          title: "Invalid Product Data",
          text: "Please ensure all selected products have valid quantity and unit price.",
        });
        return;
      }
      const confirmMessage = isUpdate
        ? "Update this sales invoice?"
        : "Create this new sales invoice?";
      swal({
        title: confirmMessage,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const lineItems = activeItems.map((item) => {
            const base = {
              product_id: item.product_id,
              product_code: item.product_code,
              product_name: item.product_name,
              quantity: item.quantity || 0,
              unit_price: item.unitPrice || item.avgPrice || 0,
              discount_percentage: item.discount || 0,
              subtotal: calculateSubtotal(
                item.quantity || 0,
                item.unitPrice || item.avgPrice || 0,
                item.discount || 0
              ),
            };

            if (isUpdate && item.salesTagProductId) {
              base.salesTagProductId = item.salesTagProductId;
            }

            return base;
          });

          const totalGross = calculateTotalGross();
          const withholdTax = calculateWithholdTax();
          const netReceivableAmount = calculateNetReceivable();

          const payload = {
            transactionId,
            sales_invoiceText,
            deliveryText,
            selectedCustomer,
            poNumber,
            selectedDueDate,
            selectedInvoiceDate,
            selectedMethod,
            inputPaymentTerms,
            remarks,
            userLoggedID,
            selectedDestination,
            selectedCurrency,
            currencyRate,
            selectedWarehouse,
            isCheckedDelivery,
            isCheckedTax,
            taxSelectedID,
            lineItems: lineItems,
            totalGross: totalGross,
            withholdTaxAmount: withholdTax,
            netReceivableAmount: netReceivableAmount,
            taxRate: getSelectedTaxRate(),
            selectedTaxName:
              isCheckedTax && taxSelectedID
                ? taxSettingsData.find((tax) => tax.id === taxSelectedID)
                    ?.name || ""
                : "",
          };

          if (isUpdate) {
            payload.id = id;
          }

          const endpoint = isUpdate
            ? `${BASE_URL}/sales_invoice/updateSales`
            : `${BASE_URL}/sales_invoice/createSales`;
          axios
            .post(endpoint, payload)
            .then((res) => {
              if (res.status === 200) {
                const successMessage = isUpdate
                  ? "Sales invoice updated successfully"
                  : "Sales invoice created successfully";
                swal({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("../sales/invoices");
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
              console.error("Error creating sales invoice:", error);
              swal({
                title: "Error",
                text: "Failed to create sales invoice. Please try again.",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              });
            });
        }
      });
    }
    setValidated(true);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form noValidate validated={validated} onSubmit={handleSubmitFormulation}>
        <div className="w-100 p-2 d-flex flex-column justify-content-center">
          <div className="w-100 d-flex flex-row justify-content-between">
            <span className="fs-3">
              <Link to="/sales/invoices" className="text-dark mx-2">
                <i className="fa-solid fa-arrow-left"></i>
              </Link>
              {isUpdate ? "UPDATE SALES INVOICE" : "CREATE SALES INVOICE"}
            </span>
            {isUpdate && (
              <div className="dropdown dropdown-button">
                <button
                  className="border-0"
                  type="button"
                  id="dropdownMenuButton1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bx bx-dots-horizontal fs-4"></i>
                </button>
                <ul
                  className="dropdown-menu"
                  aria-labelledby="dropdownMenuButton1"
                >
                  <li>
                    <span
                      className="dropdown-item"
                      style={{ color: "red", cursor: "pointer" }}
                    >
                      Cancel Transaction
                    </span>
                  </li>
                  {salesStatus === "For-Approval" && (
                    <li>
                      <span
                        className="dropdown-item"
                        onClick={handleEditTransaction}
                        style={{ cursor: "pointer" }}
                      >
                        Edit Details
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="d-flex badge fw-medium ">
            <span className="px-2 py-1 bg-primary text-white fs-6">
              TRANSACTION ID
            </span>
            <span className="px-2 py-1 bg-secondary text-white fs-6">
              {transactionId}
            </span>
          </div>
        </div>

        <div className="destination d-flex flex-row  align-items-center">
          <div className="form-check mx-3">
            <input
              className="form-check-input"
              type="radio"
              name="Local"
              id="Local"
              onClick={() => {
                setSelectedDestination("Local");
              }}
              checked={selectedDestination === "Local" ? true : false}
            />
            <label
              onClick={() => {
                setSelectedDestination("Local");
              }}
              className="form-check-label"
              for="Local"
            >
              Local
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="Overseas"
              id="Overseas"
              onClick={() => {
                setSelectedDestination("Overseas");
              }}
              checked={selectedDestination === "Overseas" ? true : false}
            />
            <label
              onClick={() => {
                setSelectedDestination("Overseas");
              }}
              className="form-check-label"
              for="Overseas"
            >
              Overseas
            </label>
          </div>
        </div>

        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Sales Invoice :</span>
              <Form.Control
                name=""
                id=""
                className="custom-form-height"
                readOnly={isCheckedDelivery === true}
                onChange={(e) => {
                  setSales_invoiceText(e.target.value);
                }}
                value={sales_invoiceText}
              />
            </div>

            <div className="col-sm">
              <span>Delivery Confirmation :</span>
              <InputGroup className="mb-3 custom-form-height">
                <InputGroup.Checkbox
                  checked={isCheckedDelivery}
                  onChange={(e) => {
                    setIsCheckedDelivery(e.target.checked);
                    setSales_invoiceText("");
                  }}
                  aria-label="Checkbox for following text input"
                  disabled={isUpdate}
                />
                <Form.Control
                  onChange={(e) => {
                    setDeliveryText(e.target.value);
                  }}
                  value={deliveryText}
                  aria-label="Text input with checkbox"
                  disabled={isEditing}
                />
              </InputGroup>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Customer : <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedCustomer(e.target.value)}
                value={selectedCustomer}
                disabled={isEditing}
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {customerData.map((data, i) => (
                  <option key={i} value={data.customer_id}>
                    {data.type === "company"
                      ? data.company_name
                      : `${data.first_name} ${data.last_name}`}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-3">
              <span>PO NUMBER :</span> <span className="text-danger">*</span>
              <Form.Control
                name=""
                id=""
                className="custom-form-height"
                required
                onChange={(e) => {
                  setPoNumber(e.target.value);
                }}
                value={poNumber}
                disabled={isEditing}
              />
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Due Date <span className="text-danger">*</span>
              </span>
              <div>
                <DatePicker
                  selected={selectedDueDate}
                  onChange={handleDueDateChange}
                  dateFormat="MMM/dd/yyyy"
                  required
                  customInput={<CustomInput isEditing={isEditing} />}
                  disabled={isEditing}
                />
              </div>
            </div>
            <div className="col-sm mb-3">
              <span>
                Invoice Date <span className="text-danger">*</span>
              </span>
              <div>
                <DatePicker
                  selected={selectedInvoiceDate}
                  onChange={handleDueInvoiceDate}
                  dateFormat="MMM/dd/yyyy"
                  required
                  customInput={<CustomInput isEditing={isEditing} />}
                  disabled={isEditing}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Payment Method <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedMethod(e.target.value)}
                value={selectedMethod}
                disabled={isEditing}
              >
                <option value="" selected disabled>
                  Select Payment Method
                </option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
                <option value="90 Days">90 Days</option>
              </Form.Select>
            </div>

            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              <div className={"w-100"}>
                <span>
                  Payment Terms <span className="text-danger">*</span>
                </span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  required
                  onChange={(e) => setInputPaymentTerms(e.target.value)}
                  value={inputPaymentTerms}
                  disabled={isEditing}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm">
              <div className="col-sm">
                <span>Applicable Tax Rate :</span>
                <InputGroup className="mb-3 custom-form-height">
                  <InputGroup.Checkbox
                    checked={isCheckedTax}
                    onChange={handleCheckBoxTax}
                    aria-label="Checkbox for following text input"
                  />
                  <Form.Select
                    disabled={isCheckedTax !== true || isEditing}
                    aria-label="Text input with checkbox"
                    required
                    onChange={(e) => {
                      setTaxSelectedID(e.target.value);
                    }}
                    value={taxSelectedID}
                  >
                    <option value="">Select Tax Rate</option>
                    {taxSettingsData.map((data, i) => (
                      <option key={i} value={data.id}>
                        {`${data.name} (${data.rate}%)`}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </div>
            </div>
            <div className="col-sm">
              <span>
                Currency <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => handleChangeCurrency(e.target.value)}
                value={selectedCurrency}
                disabled={isEditing}
              >
                <option value="" selected disabled>
                  Select Currency
                </option>
                {currencyData.map((data, i) => (
                  <option key={i} value={data.id}>
                    {data.currency_name}
                  </option>
                ))}
              </Form.Select>
            </div>

            {selectedCurrency &&
            selectedCurrency !== "11111111-1111-1111-1111-111111111111" ? (
              <div className="col-sm">
                <span>
                  Currency Rate<span className="text-danger">*</span>
                </span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  required
                  onChange={handleCurrencyRateChange}
                  value={currencyRate}
                />
              </div>
            ) : null}
          </div>
          <div className="row mx-auto">
            <div className="col-sm">
              <span>Remarks</span>
              <Form.Control
                as="textarea"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                rows={3}
                maxLength={250}
                disabled={isEditing}
              />
            </div>
          </div>
        </div>
        <div className="container-fluid ">
          <div className="w-100 d-flex align-items-center mt-3 p-2">
            <h5>Item List</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th className="p-2">Product Code</th>
                    <th className="p-2">
                      Product Name<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">Quantity</th>
                    <th
                      className={
                        roleType?.includes("Management") ? "p-2" : "d-none"
                      }
                    >
                      Unit Price<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">Discount</th>
                    <th
                      className={
                        roleType?.includes("Management") ? "p-2" : "d-none"
                      }
                    >
                      Subtotal
                    </th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems
                    .filter((item) => item.isDeleted === false)
                    .map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_code}</td>
                        <td>{item.product_name}</td>
                        <td>
                          <Form.Control
                            className="form-control"
                            type="text"
                            min="0"
                            value={item.quantity || 0}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.product_id,
                                e.target.value
                              )
                            }
                            disabled={isEditing}
                            required
                          />
                        </td>
                        <td
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          <Form.Control
                            className="form-control"
                            type="text"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || 0}
                            onChange={(e) =>
                              handleUnitPriceChange(
                                item.product_id,
                                e.target.value
                              )
                            }
                            disabled={isEditing}
                            required
                          />
                        </td>

                        <td>
                          <div className="input-group mb-3">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0.00"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount || 0}
                              onChange={(e) =>
                                handleDiscountChange(
                                  item.product_id,
                                  e.target.value
                                )
                              }
                              disabled={isEditing}
                              aria-label="Discount"
                              aria-describedby="basic-addon1"
                            />
                            <div className="input-group-prepend">
                              <span
                                className="input-group-text"
                                id="basic-addon1"
                              >
                                %
                              </span>
                            </div>
                          </div>
                        </td>
                        <td
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          {calculateSubtotal(
                            item.quantity || 0,
                            item.unitPrice || item.avgPrice || 0,
                            item.discount || 0
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm text-danger fs-4"
                            onClick={() =>
                              handleCheckSelectProduct(
                                item,
                                !isItemSelected(item)
                              )
                            }
                            disabled={isEditing}
                            type="button"
                          >
                            <i class="fa-sharp-duotone fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-100 d-flex justify-content-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleShow}
              disabled={isEditing}
            >
              New Item
            </button>
          </div>
        </div>
        <div className="row mx-auto p-2 mt-4 mb-4">
          <div className="col-sm"></div>
          <div
            className={
              roleType?.includes("Management") ? "col-sm border-end" : "d-none"
            }
          >
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Gross :</span>
              <span className="text-secondary">
                {calculateTotalGross().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Withhold Tax Deduction :</span>
              <span className="text-danger">
                {isCheckedTax
                  ? `-${calculateWithholdTax().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "0.00"}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                <span className="text-white">Net Receivable Amount :</span>
                <span className="text-white text-underline">
                  {calculateNetReceivable().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={CancelInvoice}
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-sm">
                  <button
                    className="btn btn-primary w-100"
                    type="submit"
                    disabled={isEditing}
                  >
                    {isUpdate ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>

      <Modal
        show={show}
        size="xl"
        onHide={() => {
          setShow(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Lists</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchProduct}
              />
            </div>
          </div>
          <table className="table table-responsive table-hover">
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                ></th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Product Code
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Product Name
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  UOM
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {paginationProduct.loading ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : paginationProduct.error ? (
                <tr>
                  <td colSpan="5" className="text-center text-danger">
                    Error loading data
                  </td>
                </tr>
              ) : paginationProduct.data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No data available
                  </td>
                </tr>
              ) : (
                paginationProduct.data.map((item) => (
                  <tr
                    key={item.product_id}
                    onClick={() =>
                      handleCheckSelectProduct(item, !isItemSelected(item))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td className="w-25">
                      <Form.Check
                        checked={isItemSelected(item)}
                        onChange={(e) =>
                          handleCheckSelectProduct(item, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{item.product_code}</td>
                    <td>{item.product_name}</td>
                    <td>{item.prod_packaging?.packaging_name}</td>
                    <td>
                      <span className={item.statusColor}>
                        {item.qualificationStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationControls {...paginationProduct} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShow(false)} variant="secondary">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Create_invoice_update;
