import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const Vendors = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();

  // fetch
  const [companyName, setcompanyName] = useState("");
  const [companyNature, setcompanyNature] = useState("");
  const [emailAddress, setemailAddress] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [designation, setDesignation] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [mname, setMname] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [contactNo, setContactNo] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [tin, setTin] = useState("");
  const [position, setPosition] = useState("");
  const [selectedID, setSelectedID] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [vat, setVat] = useState("");

  // validation
  const [validated, setValidated] = useState(false);

  // clear filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  // update show modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // add show modal
  const [showModal, setShowModal] = useState(false);
  const handleShow = () => {
    setShowModal(true);
    fetchCountries(); // Fetch countries when modal is shown
  };
  const [currency, setCurrency] = useState([]);
  const [currencyID, setCurrencyID] = useState("");
  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrency(res.data);
    });
  };
  const handleClose = () => {
    setShowModal(false);
    setShowUpdateModal(false);
    setcompanyName("");
    setcompanyNature("");
    setemailAddress("");
    setCompanyAddress("");
    setCity("");
    setCountry("");
    setDesignation("");
    setFname("");
    setLname("");
    setMname("");
    setCivilStatus("");
    setDob("");
    setGender("");
    setContactNo("");
    setContactNo2("");
    setTin("");
    setPosition("");
    setVat("");
    setValidated(false);

    // Reset contactPersons to its initial state
    setContactPersons([
      {
        fname: "",
        lname: "",
        mname: "",
        civilStatus: "",
        dob: "",
        gender: "",
        contactNo: "",
        tin: "",
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
        buttons: false,
        timer: 2000,
      });
    } else {
      swal({
        title: "Create this new vendor?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/vendors/addVendors", {
                companyName,
                companyNature,
                emailAddress,
                companyAddress,
                city,
                country,
                designation,
                fname,
                mname,
                lname,
                civilStatus,
                dob,
                gender,
                contactNo,
                contactNo2,
                tin,
                position,
                currencyID,
                vat,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Vendors successfully added.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  reloadTable();
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Vendors duplicated, unable to insert.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              });
          } catch (error) {
            console.error("Error adding Vendors:", error);
            swal({
              title: "Error!",
              text: "There was an error adding the Vendors.",
              icon: "error",
              buttons: false,
              timer: 2000,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  // update
  const handleUpdateShow = (data) => {
    setShowUpdateModal(true);
    setSelectedID(data.id);
    setcompanyName(data.company_name);
    setcompanyNature(data.company_nature);
    setemailAddress(data.company_email);
    setCompanyAddress(data.company_address);
    setCity(data.company_city);
    setCountry(data.company_country);
    setDesignation(data.company_designation);
    setFname(data.fname);
    setLname(data.fname);
    setMname(data.lname);
    setCivilStatus(data.civil_status);
    setDob(data.dob);
    setGender(data.gender);
    setContactNo(data.contact);
    setTin(data.tin_number);
    setPosition(data.position);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
        buttons: false,
        timer: 2000,
      });
    } else {
      swal({
        title: "Update this vendors?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/vendors/updateVendors", {
                companyName,
                companyNature,
                emailAddress,
                companyAddress,
                city,
                country,
                designation,
                fname,
                mname,
                lname,
                civilStatus,
                dob,
                gender,
                contactNo,
                tin,
                position,
                selectedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Vendors successfully updated.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  reloadTable();
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Vendors duplicated, unable to update.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              });
          } catch (error) {
            console.error("Error updating Vendors:", error);
            swal({
              title: "Error!",
              text: "There was an error updating the vendors.",
              icon: "error",
              buttons: false,
              timer: 2000,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  // country
  // const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);

  // Function to fetch country data
  const fetchCountries = async () => {
    try {
      const response = await axios.get(
        "https://countriesnow.space/api/v0.1/countries/iso"
      );

      const countries = response.data.data.map((country) => ({
        value: country.name,
        label: `${country.name} (${country.Iso3})`,
      }));

      countries.sort((a, b) => (a.label > b.label ? 1 : -1));
      setCountryOptions(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // add another contact person
  const [contactPersons, setContactPersons] = useState([
    {
      fname: "",
      lname: "",
      mname: "",
      civilStatus: "",
      dob: "",
      gender: "",
      contactNo: "",
      contactNo2a: "",
      tin: "",
    },
  ]);

  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      {
        fname: "",
        lname: "",
        mname: "",
        civilStatus: "",
        dob: "",
        gender: "",
        contactNo: "",
        tin: "",
      },
    ]);
  };

  const removeContactPerson = (index) => {
    const newContactPersons = contactPersons.filter((_, i) => i !== index);
    setContactPersons(newContactPersons);
  };

  // Fetch data
  const [showData, setShowData] = useState([]);

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/vendors/fetchPaginatedVendors"
  );

  const pagination = useServerPagination(paginationUrl, 10);
  // fetch
  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/vendors/fetchPaginatedVendors");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/vendors/filterSearchVendors");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
        filterCurrency,
        filterStatus,
        filterDesignation,
      });
    }
  };

  const reloadTable = () => {
    pagination.updateParams({
      searchText,
      filterColumn: filterColumn || "all",
      filterCurrency,
      filterStatus,
      filterDesignation,
    });
    setIsLoading(false);
  };

  //   const reloadTable = () => {
  //     pagination.updateParams({
  //       filterStatus,
  //       filterDesignation,
  //       filterColumn,
  //       searchText,
  //     });
  //     setIsLoading(false);
  //     // axios
  //     //   .get(BASE_URL + "/vendors/filterSearchVendors", {
  //     //     params: {
  //     //       filterStatus,
  //     //       filterDesignation,
  //     //       filterColumn,
  //     //       searchText,
  //     //     },
  //     //   })
  //     //   .then((res) => {
  //     //     setShowData(res.data);
  //     //     setIsLoading(false);
  //     //   });
  //   };

  useEffect(() => {
    setShowData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCountries();
      reloadCurrency();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    reloadTable();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const filteredItems = showData?.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

    switch (filterColumn) {
      case "company_name":
        return item.company_name.toLowerCase().includes(searchLower);
      case "company_nature":
        return item.company_nature.toLowerCase().includes(searchLower);
      case "company_email":
        return item.company_email.toLowerCase().includes(searchLower);
      case "company_city":
        return item.company_city.toLowerCase().includes(searchLower);
      case "company_country":
        return item.company_country.toLowerCase().includes(searchLower);
      case "company_designation":
        return item.company_designation.toLowerCase().includes(searchLower);
      case "Contact":
        return item.contact.toString().toLowerCase().includes(searchLower);
      case "status":
        return item.status.toLowerCase().includes(searchLower);
      case "contact_person":
        return contactPerson.includes(searchLower); // Add contact person filter
      default:
        return (
          item.company_name.toLowerCase().includes(searchLower) ||
          item.company_nature.toLowerCase().includes(searchLower) ||
          item.company_email.toLowerCase().includes(searchLower) ||
          item.company_city.toLowerCase().includes(searchLower) ||
          item.company_country.toLowerCase().includes(searchLower) ||
          item.company_designation.toLowerCase().includes(searchLower) ||
          item.contact.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          contactPerson.includes(searchLower) // Add contact person to default filter
        );
    }
  });

  const applyFilter = () => {
    setPaginationUrl(BASE_URL + "/vendors/filterSearchVendors");
    reloadTable();
  };

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
    setFilterCurrency("");
    setFilterDesignation("");
    setFilterStatus("");
    setPaginationUrl(BASE_URL + "/vendors/fetchPaginatedVendors");
    pagination.updateParams({});
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <div className="position-relative">
      <input
        type="text"
        className="form-control w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
      <span
        onClick={onClick}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
        }}
      >
        <i className="fa-regular fa-calendar"></i>
      </span>
    </div>
  ));

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
      ) : authrztn.includes("Vendors-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">VENDORS</span>
            </div>

            <div>
              {authrztn.includes("Vendors-Add") && (
                <button
                  className="btn btn-primary d-flex align-items-center title-button"
                  onClick={handleShow}
                >
                  <i className="bx bx-plus fs-5"></i> Add Vendor
                </button>
              )}
            </div>
          </div>
          <div className="w-100 row align-items-end mt-4 mx-auto">
            <div className="col-md-3 mb-2">
              <span>Business Status</span>
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <span>Business Currency</span>
              <select
                name=""
                id=""
                className="form-select"
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
              >
                <option value="" selected disabled>
                  Select Currency
                </option>
                {currency.map((item, index) => (
                  <option key={index} value={item.currency_name}>
                    {item.currency_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <span>Business Designation</span>
              <select
                name=""
                id=""
                className="form-select"
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
              >
                <option value="" selected disabled>
                  Select Designation
                </option>
                <option value="All">All</option>
                <option value="Local">Local</option>
                <option value="Overseas">Overseas</option>
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex gap-2 h-100 align-items-end">
              <button
                type="button"
                className="btn btn-dark flex-grow-1"
                onClick={applyFilter}
                style={{ whiteSpace: "nowrap" }}
              >
                Apply Filter
              </button>
              <button
                className="btn btn-light border flex-grow-1"
                onClick={clearFilter}
                style={{ whiteSpace: "nowrap" }}
              >
                Clear Filter
              </button>
            </div>

            <div className="col-sm mb-2">
              {/* <span>Currency</span>
          <select
            name=""
            id=""
            className="form-select"
            onChange={(e) => setCurrencyID(e.target.value)}
          >
            <option value="" selected disabled>
              Select Currency
            </option>
            {currency.map((item, index) => (
              <option key={index} value={item.id}>
                {item.currency_name}
              </option>
            ))}
          </select> */}
            </div>
            <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container"></div>
            <div className="col-sm"></div>
          </div>
          <div className="w-100 mt-2 container-fluid">
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
                      filterColumn === "company_name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_name")}
                  >
                    Company Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_nature" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_nature")}
                  >
                    Company Nature
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_email" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_email")}
                  >
                    Company Email
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_designation" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_designation")}
                  >
                    Designation
                  </button>
                </li>
                {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_city" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_city")}
                  >
                    City
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_country" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_country")}
                  >
                    Country
                  </button>
                </li> */}
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "currency" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("currency")}
                  >
                    Currency
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "contact_person" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("contact_person")}
                  >
                    Contact Person
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "contact" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("contact")}
                  >
                    Contact Number
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-100 mt-3 container-fluid">
            {/* <DataTable
              columns={columns}
              data={showData}
              customStyles={customStyles}
              onRowClicked={(row) =>
                navigate(`../purchases/vendor-update/${row.id}`)
              }
              className="dataTable"
            /> */}
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
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
                      COMPANY NAME
                      <i className="fas fa-sort ms-1"></i>
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
                      NATURE
                      <i className="fas fa-sort ms-1"></i>
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
                      COMPANY EMAIL
                      <i className="fas fa-sort ms-1"></i>
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
                      DESIGNATION
                      <i className="fas fa-sort ms-1"></i>
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
                      CURRENCY
                      <i className="fas fa-sort ms-1"></i>
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
                      CONTACT PERSON
                      <i className="fas fa-sort ms-1"></i>
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
                      CONTACT
                      <i className="fas fa-sort ms-1"></i>
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
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.error ? (
                    <tr>
                      <td className="text-center text-danger py-4">
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
                      <td colSpan={8} className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          console.log(item.id);
                          navigate(`../purchases/vendor-update/${item.id}`);
                        }}
                      >
                        <td className="text-center">{item.company_name}</td>
                        <td className="text-center">{item.company_nature}</td>
                        <td className="text-center">{item.company_email}</td>
                        <td className="text-center">
                          {item.company_designation}
                        </td>
                        <td className="text-center">
                          {item.currency.currency_name}
                        </td>
                        <td className="text-center">{`${item.fname} ${item.lname}`}</td>
                        <td className="text-center">{item.contact}</td>
                        <td
                          className="text-center"
                          style={{
                            padding: "5px, 10px",
                            borderRadius: "5px",
                            color: item.status
                              ? item.status === "Active"
                                ? "#3B9F3F"
                                : "#FFA500"
                              : "initial",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                          }}
                        >
                          {item.status}
                        </td>
                      </tr>
                    ))
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

      {/* add vendor */}
      <Modal show={showModal} onHide={handleClose} size="xl" backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Create Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <div className="w-100 container-fluid">
              <div className="w-100 d-flex align-items-center">
                <span>General Information</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyName">
                    <Form.Label>
                      Company Name
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={companyName}
                      placeholder="Enter Name"
                      onChange={(e) => setcompanyName(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyNature">
                    <Form.Label>
                      Company Nature
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={companyNature}
                      placeholder="Enter Nature"
                      onChange={(e) => setcompanyNature(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="emailAddress">
                    <Form.Label>
                      Email Address
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={emailAddress}
                      placeholder="Enter Email"
                      onChange={(e) => setemailAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-12 col-md-8">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>
                      Company Address
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={companyAddress}
                      placeholder="Enter Address"
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>
                      City
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={city}
                      placeholder="Enter City"
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group controlId="country">
                    <Form.Label>
                      Country <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      required
                      options={countryOptions}
                      value={countryOptions.find(
                        (option) => option.value === country
                      )}
                      onChange={(selectedOption) =>
                        setCountry(selectedOption ? selectedOption.value : "")
                      }
                      placeholder="Select Country"
                      isClearable
                      isSearchable
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>
                      Designation <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={designation}
                      required
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      <option value="" disabled>
                        Select Designation
                      </option>
                      <option value="Local">Local</option>
                      <option value="Overseas">Overseas</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>
                      Currency <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      required
                      onChange={(e) => setCurrencyID(e.target.value)}
                    >
                      <option value="" selected disabled>
                        Select Currency
                      </option>
                      {currency.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.currency_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm mb-2">
                  <Form.Group controlId="vat">
                    <Form.Label>
                      VAT (%) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={vat}
                      placeholder="Enter VAT"
                      required
                      onChange={(e) => {
                        let value = e.target.value;

                        // Allow only digits and at most one decimal point
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          // Convert to number and cap at 100
                          const numericValue = parseFloat(value);
                          if (!isNaN(numericValue)) {
                            if (numericValue > 100) {
                              setVat("100");
                            } else {
                              setVat(value);
                            }
                          } else {
                            // Empty or just "." is okay to keep typing
                            setVat(value);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        const allowedKeys = [
                          "Backspace",
                          "Delete",
                          "ArrowLeft",
                          "ArrowRight",
                          "Tab",
                          "Home",
                          "End",
                        ];

                        const isNumber = /[0-9]/.test(e.key);
                        const isDecimal = e.key === ".";

                        if (
                          !isNumber &&
                          !allowedKeys.includes(e.key) &&
                          !(isDecimal && !vat.includes("."))
                        ) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={6} // enough for e.g. 100.00
                    />
                  </Form.Group>
                </div>
                <div className="col-sm mb-2"></div>
                <div className="col-sm mb-2"></div>
              </div>

              <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center">
                  <span>Contact Information</span>
                  <hr className="flex-grow-1 mx-3" />
                  {/* <Button variant="outline-primary" onClick={addContactPerson}>
                    <i className="fas fa-plus"></i>
                  </Button> */}
                </div>
                {/* {contactPersons.map((person, index) => ( */}
                <div className="border p-3 mb-3 position-relative">
                  {/* {index > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-2"
                        onClick={() => removeContactPerson(index)}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )} */}
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`firstName`}>
                        <Form.Label>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter First Name"
                          value={fname}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].fname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setFname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`lastName`}>
                        <Form.Label>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={lname}
                          placeholder="Enter Last Name"
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].lname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setLname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`middleName`}>
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Middle Name"
                          value={mname}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].mname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setMname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`civilStatus`}>
                        <Form.Label>Civil Status</Form.Label>
                        <Form.Select
                          value={civilStatus}
                          onChange={(e) => {
                            setCivilStatus(e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Select Civil Status
                          </option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`dob`}>
                        <Form.Label>Date of Birth</Form.Label>
                        {/* <Form.Control
                          type="date"
                          value={dob}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].dob = e.target.value;
                            // setContactPersons(newContactPersons);
                            setDob(e.target.value);
                          }}
                        /> */}
                        <div>
                          <DatePicker
                            selected={dob}
                            dateFormat="MMM/dd/yyyy"
                            onChange={(date) => setDob(date)}
                            className="form-control p-2"
                            customInput={<CustomInput />}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            popperPlacement="bottom"
                            popperProps={{
                              positionFixed: true,
                            }}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`gender`}>
                        <Form.Label>Choose Gender</Form.Label>
                        <div className="row">
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name={`gender`}
                              id={`male`}
                              label="Male"
                              value="Male"
                              checked={gender === "Male"}
                              onChange={(e) => {
                                // const newContactPersons = [...contactPersons];
                                // newContactPersons[index].gender =
                                //   e.target.value;
                                // setContactPersons(newContactPersons);
                                setGender("Male");
                              }}
                            />
                          </div>
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name={`gender`}
                              id={`female`}
                              label="Female"
                              value="Female"
                              checked={gender === "Female"}
                              onChange={(e) => {
                                // const newContactPersons = [...contactPersons];
                                // newContactPersons[index].gender =
                                //   e.target.value;
                                // setContactPersons(newContactPersons);
                                setGender("Female");
                              }}
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Cellphone No. <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            required
                            placeholder="Enter Cellphone Number"
                            value={contactNo}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setContactNo(e.target.value)}
                            maxLength={10}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>Additional Contact No.</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            placeholder="Enter Contact Number"
                            value={contactNo2}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setContactNo2(e.target.value)}
                            maxLength={10}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>TIN</Form.Label>
                        <Form.Control
                          type="text"
                          value={tin}
                          placeholder="Enter TIN Number"
                          maxLength={15}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].tin = e.target.value;
                            // setContactPersons(newContactPersons);
                            setTin(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                  </div>
                </div>
                {/* ))} */}
              </div>
            </div>
            <Modal.Footer className="border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* update modal */}
      {/* <Modal
        show={showUpdateModal}
        onHide={handleClose}
        size="xl"
        backdrop="static"
      >
        <Modal.Header className="border-0">
          <Modal.Title>Update Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            noValidate
            validated={validated}
            onSubmit={handleUpdate}
            className="vendor-container scrollable-contents"
          >
            <div className="w-100 container-fluid">
              <div className="w-100 d-flex align-items-center">
                <span>General Information</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyName">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyName}
                      required
                      placeholder="Enter Name"
                      onChange={(e) => setcompanyName(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyNature">
                    <Form.Label>Company Nature</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={companyNature}
                      placeholder="Enter Nature"
                      onChange={(e) => setcompanyNature(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="emailAddress">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={emailAddress}
                      placeholder="Enter Email"
                      onChange={(e) => setemailAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-12 col-md-8">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>Company Address</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={companyAddress}
                      placeholder="Enter Address"
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={city}
                      placeholder="Enter City"
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm mb-2">
                  <Form.Group controlId="country">
                    <Form.Label>Country</Form.Label>
                    <Select
                      options={countryOptions}
                      value={countryOptions.find(
                        (option) => option.value === country
                      )}
                      onChange={(selectedOption) =>
                        setCountry(selectedOption ? selectedOption.value : "")
                      }
                      placeholder="Select Country"
                      isClearable
                      isSearchable
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>Designation</Form.Label>
                    <Form.Select
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      <option value="" selected disabled>
                        Select Designation
                      </option>
                      <option value="Local">Local</option>
                      <option value="Overseas">Overseas</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-sm"></div>
              </div>

              <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center">
                  <span>Contact Information</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter First Name"
                        value={fname}
                        onChange={(e) => setFname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={lname}
                        placeholder="Enter Last Name"
                        onChange={(e) => setLname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="middleName">
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Middle Name"
                        value={mname}
                        onChange={(e) => setMname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="civilStatus">
                      <Form.Label>Civil Status</Form.Label>
                      <Form.Select
                        required
                        value={civilStatus}
                        onChange={(e) => setCivilStatus(e.target.value)}
                      >
                        <option value="" selected disabled>
                          Select Civil Status
                        </option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="gender">
                      <Form.Label>Choose Gender</Form.Label>
                      <div className="row">
                        <div className="col-sm mb-1">
                          <Form.Check
                            type="radio"
                            name="gender"
                            id="male"
                            label="Male"
                            value="Male"
                            checked={gender === "Male"}
                            onChange={(e) => setGender(e.target.value)}
                          />
                        </div>
                        <div className="col-sm mb-1">
                          <Form.Check
                            type="radio"
                            name="gender"
                            id="female"
                            label="Female"
                            value="Female"
                            checked={gender === "Female"}
                            onChange={(e) => setGender(e.target.value)}
                          />
                        </div>
                      </div>
                    </Form.Group>
                  </div>
                </div>
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="mobileNumber">
                      <Form.Label>Contact No.</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter Contact Number"
                        value={contactNo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setContactNo(value);
                          }
                        }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="tinNumber">
                      <Form.Label>TIN</Form.Label>
                      <Form.Control
                        type="text"
                        value={tin}
                        placeholder="Enter TIN Number"
                        onChange={(e) => setTin(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="jobPosition">
                      <Form.Label>Job Position</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter Position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <Modal.Footer className="border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal> */}
    </div>
  );
};

export default Vendors;
