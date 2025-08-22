import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import "../../assets/css/style.css";
import IndividualForm from "./IndividualForm";
import CompanyForm from "./CompanyForm";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import { v4 as uuidv4 } from "uuid";

const CustomerCreate = () => {
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const userLoggedID = useDecodeToken();

  const [formType, setFormType] = useState("company");
  const [status, setStatus] = useState(true);
  // const [firstName, setFirstName] = useState("");
  // const [lastName, setLastName] = useState("");
  // const [email, setEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  // const [civilStatus, setCivilStatus] = useState("");
  // const [birthDate, setBirthDate] = useState("");
  // const [gender, setGender] = useState("Male");
  const [mobileNumber, setMobileNumber] = useState("");
  // const [jobPosition, setJobPosition] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [telephoneNumber, setTelephoneNumber] = useState("");

  // const [cashWith, setCashWith] = useState("");
  // const [amount, setAmount] = useState(0);
  // const [checkNumber, setCheckNumber] = useState("");
  // const [cashWallet, setCashWallet] = useState([]);
  // const uuid = crypto.randomUUID(); // Generates a 36-character UUID
  const uuid = uuidv4(); // Generates a UUID
  const [socialLinks, setSocialLinks] = React.useState([
    {
      id: uuid,
      platform: "",
      link: "",
      isDeleted: false,
    },
  ]);

  const [contactPerson, setContactPerson] = React.useState([
    {
      id: uuid,
      fname: "",
      mname: "",
      lname: " ",
      email: "",
      jobPosition: "",
      mobileNumber: "",
      Remarks: "",
      isDeleted: false,
    },
  ]);

  // console.log("socialLinks", socialLinks);

  // console.log("contactPerson", contactPerson);

  const countryOptions = [
    { value: "Philippines", label: "Philippines" },
    { value: "China", label: "China" },
    { value: "USA", label: "USA" },
    { value: "RUSSIA", label: "RUSSIA" },
    { value: "SINGAPORE", label: "SINGAPORE" },
    { value: "JAPAN", label: "JAPAN" },
  ];

  const statusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" },
  ];

  // Create Customer
  const createCustomer = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      const customerData = {
        status: status,
        companyName: companyName,
        companyNature: companyNature,
        companyEmail: companyEmail,
        companyAddress: companyAddress,
        country: country,
        mobileNumber: mobileNumber,
        telephoneNumber: telephoneNumber,
        tin: tin,
        socialLinks: socialLinks,
        contactPerson: contactPerson,
        userLoggedID,
      };

      axios.post(`${BASE_URL}/customer/create`, customerData).then((res) => {
        if (res.status === 200) {
          SuccessInserted(res);
        } else if (res.status === 201) {
          Duplicate_Message();
        } else {
          ErrorInserted();
        }
      });
    }
    setValidated(true);
  };

  //Validations
  const SuccessInserted = (res) => {
    swal({
      title: "Added New Customer",
      text: "The Customer has been added successfully",
      icon: "success",
      button: "OK",
    }).then(() => {
      navigate("/sales/customers");
    });
  };

  const Duplicate_Message = () => {
    swal({
      title: "Customer is Already Exist",
      text: "Change the customer name",
      icon: "error",
      button: "OK",
    });
  };

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact our Support",
      icon: "error",
      button: "OK",
    });
  };

  //Reload Table
  // const reloadTable = () => {
  //   axios
  //     .get(BASE_URL + "/customer/getCustomers")
  //     .then((res) => {
  //       const sortedCustomerList = res.data.sort(
  //         (a, b) => b.customer_id - a.customer_id
  //       );
  //       setInboundData(sortedCustomerList);
  //     })
  //     .catch((err) => console.log(err));
  // };

  // useEffect(() => {
  //   reloadTable();
  // }, []);

  const handleBack = () => {
    navigate("/sales/customers");
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/customers" className="text-dark mx-2">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            CREATE
          </span>
          <span>GENERAL INFORMATION</span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={createCustomer}>
        {/* <div className="col-sm">
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center">
              <Form.Check
                className="me-2"
                type="radio"
                label="INDIVIDUAL"
                name="generalInfo"
                id="individual"
                value="individual"
                checked={formType === "individual"}
                onChange={() => setFormType("individual")}
              />
              <Form.Check
                className="me-3"
                type="radio"
                label="COMPANY"
                name="generalInfo"
                id="company"
                value="company"
                checked={formType === "company"}
                onChange={() => setFormType("company")}
              />
            </div>
          </Form.Group>
        </div> */}

        <div className="row">
          <div className=" col-sm">
            <Form.Group>
              <label htmlFor="status">Status</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="status"
                  checked={status === true}
                  onChange={(e) => setStatus(!status)}
                />
                <label htmlFor="status">Toggle on to Active</label>
              </div>
            </Form.Group>
            <div className="mt-4"></div>
          </div>
          <div className="col-sm"></div>
        </div>

        {formType === "individual" && (
          <IndividualForm
            countryOptions={countryOptions}
            statusOptions={statusOptions}
            // setFirstName={setFirstName}
            // setLastName={setLastName}
            // setEmail={setEmail}
            setCompanyAddress={setCompanyAddress}
            setCountry={setCountry}
            // setCivilStatus={setCivilStatus}
            // setBirthDate={setBirthDate}
            // setGender={setGender}
            setMobileNumber={setMobileNumber}
            // setJobPosition={setJobPosition}
            setTin={setTin}
          />
        )}
        {formType === "company" && (
          <CompanyForm
            countryOptions={countryOptions}
            setCompanyAddress={setCompanyAddress}
            setCountry={setCountry}
            setMobileNumber={setMobileNumber}
            setTin={setTin}
            setCompanyName={setCompanyName}
            setCompanyNature={setCompanyNature}
            setCompanyEmail={setCompanyEmail}
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
            contactPerson={contactPerson}
            setContactPerson={setContactPerson}
            setTelephoneNumber={setTelephoneNumber}
            telephoneNumber={telephoneNumber}
          />
        )}

        <div className="mt-5"></div>

        {/* <div className="row mt-3">
          <div className="col">
            <h2 className="mb-0">Cash Wallet</h2>
            <div className="border-bottom border-2 mt-2"></div>
            <div className="mt-5"></div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="border bg-white custom-container">
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-5">Cash</span>
                  <span>Cash Method</span>
                </div>
              </div>
              <div className="border-bottom border-2 mt-2"></div>
              <div className="mt-4"></div>
              <Form.Group className="mb-3">
                <Form.Label>Cash With</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Check
                    className="me-2"
                    type="radio"
                    label="Cash"
                    name="cashWith"
                    id="cashWithCash"
                    value="Cash"
                    checked={cashWith === "Cash"}
                    onChange={(e) => setCashWith(e.target.value)}
                  />
                  <Form.Check
                    className="me-2"
                    type="radio"
                    label="Check"
                    name="cashWith"
                    id="cashWithCheck"
                    value="Check"
                    checked={cashWith === "Check"}
                    onChange={(e) => setCashWith(e.target.value)}
                  />
                </div>
              </Form.Group>
              {cashWith === "Check" && (
                <Form.Group className="mb-3">
                  <Form.Label>Check Number</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      style={{ cursor: "default" }}
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                    />
                  </div>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>AMOUNT</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">₱</span>
                  <Form.Control
                    type="text"
                    placeholder="00.0"
                    style={{ cursor: "default" }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </Form.Group>
              <Form.Group>
                <Button
                  variant="primary"
                  className="mx-2"
                  onClick={handleAddCash}
                >
                  Add Cash
                </Button>
              </Form.Group>
            </div>
          </div>

          <div className="col-sm">
            <div className="border bg-white custom-container">
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-5">Cash</span>
                  <span>Balance</span>
                </div>
              </div>
              <div className="w-100 mt-4 container-fluid">
                <DataTable
                  columns={columns}
                  data={cashWallet}
                  customStyles={customStyles}
                />
              </div>
              <div className="d-flex flex-column title-custom align-items-end">
                <span className="align-self-end">Cash Balance</span>
                <span className="fs-2 text-end" style={{ color: "green" }}>
                  ₱ {totalAmount}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        <br></br>

        <div className="d-flex justify-content-end">
          <Button
            variant="outline-secondary"
            className="mx-2"
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="mx-2">
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CustomerCreate;
