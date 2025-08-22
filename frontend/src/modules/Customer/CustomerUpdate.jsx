import React, { useState, useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import IndividualForm from "./IndividualForm";
import CompanyForm from "./CompanyForm";
import DataTable from "react-data-table-component";
import { customStyles } from "../styles/table-style";
import { useParams } from "react-router-dom";
import BASE_URL from "../../assets/global/url";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

function CustomerUpdate({ authrztn }) {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();

  const hasFetched = useRef(false);

  // const [customerCashWallet, setCustomerCashWallet] = useState([]);

  const [validated, setValidated] = useState(false);

  const [formType, setFormType] = useState("company");
  const [status, setStatus] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [mobileNumber, setMobileNumber] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [socialLinks, setSocialLinks] = React.useState([]);

  const [contactPerson, setContactPerson] = React.useState([]);
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

  // const [cashWith, setCashWith] = useState("");
  // const [amount, setAmount] = useState(0);
  // const [checkNumber, setCheckNumber] = useState("");
  // const [cashWallet, setCashWallet] = useState([]);

  // const FetchCustomerCashWallet = () => {
  //   axios
  //     .get(BASE_URL + `/customer/getCustomerCashWallet/${id}`)
  //     .then((res) => {
  //       setCustomerCashWallet(res.data);
  //     });
  // };
  // useEffect(() => {
  //   FetchCustomerCashWallet();
  // }, []);

  // const columns = [
  //   {
  //     name: "Type",
  //     selector: (row) => row.cashType,
  //   },
  //   {
  //     name: "Amount",
  //     selector: (row) => row.amount,
  //   },
  //   {
  //     name: "Check Number",
  //     selector: (row) => row.checkNumber,
  //   },
  //   {
  //     name: "Issue Date",
  //     selector: (row) => row.issuedDate,
  //   },
  // ];

  // const handleAddCash = () => {
  //   const newEntry = {
  //     type: cashWith,
  //     amount: amount,
  //     checkNumber: checkNumber,
  //   };
  //   setCashWallet([...cashWallet, newEntry]);

  //   setCashWith("");
  //   setAmount(0);
  //   setCheckNumber("");
  // };

  // const combinedWallet = [...customerCashWallet, ...cashWallet];

  // const userData = combinedWallet.map((data, i) => ({
  //   key: i,
  //   cashType: data.cash_type || data.type,
  //   amount: data.amount,
  //   checkNumber: data.check_number || data.checkNumber,
  //   issuedDate: data.createAt || data.issuedDate,
  // }));

  useEffect(() => {
    if (hasFetched.current) {
      return; // Skip if already fetched
    }

    hasFetched.current = true; // Mark as fetched

    axios
      .get(`${BASE_URL}/customer/getCustomerDetails`, {
        params: { customerId: id },
      })
      .then((res) => {
        setFormType(res.data.type);
        setStatus(res.data.status);
        setCompanyAddress(res.data.company_address);
        setCountry(res.data.country);
        setMobileNumber(res.data.mobile_no);
        setTelephoneNumber(res.data.telephone_no);
        setJobPosition(res.data.job_position);
        setTin(res.data.tin);
        setCompanyName(res.data.company_name);
        setCompanyNature(res.data.company_nature);
        setCompanyEmail(res.data.company_email);

        res.data.customer_social_links.map((link) => {
          setSocialLinks((prev) => [
            ...prev,
            {
              id: link.id,
              platform: link.platform,
              link: link.link,
              isDeleted: link.isDeleted,
            },
          ]);
        });
        res.data.customer_contact_people.map((person) => {
          setContactPerson((prev) => [
            ...prev,
            {
              id: person.id,
              fname: person.fname,
              mname: person.mname,
              lname: person.lname,
              email: person.email,
              jobPosition: person.job_position,
              mobileNumber: person.mobile_no,
              Remarks: person.remarks,
              isDeleted: person.isDeleted,
            },
          ]);
        });
      })
      .catch((error) => {
        console.error("Error fetching customer details: ", error);
      });
  }, [id]);

  const handleBack = () => {
    navigate("/sales/customers");
  };

  const updateCustomer = async (e) => {
    e.preventDefault();
    if (!companyNature) {
      swal({
        icon: "error",
        title: "Name is required",
        text: "Please enter a name before updating.",
      });
      return;
    }
    try {
      const response = await axios.put(
        `${BASE_URL}/customer/updateCustomer/${id}`,
        {
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
        }
      );

      if (response.status === 200) {
        swal({
          title: "Update successful!",
          text: "The Customer has been updated successfully.",
          icon: "success",
          button: "OK",
        }).then(() => {
          navigate("/sales/customers");
        });
      } else if (response.status === 202) {
        swal({
          icon: "error",
          title: "Customer has been already exists",
          text: "Please input another Customer Name",
        });
      } else {
        swal({
          icon: "error",
          title: "Something went wrong",
          text: "Please contact our support",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/customers" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            CUSTOMER DETAILS
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={updateCustomer}>
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
            companyAddress={companyAddress}
            setCompanyAddress={setCompanyAddress}
            country={country}
            setCountry={setCountry}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            jobPosition={jobPosition}
            setJobPosition={setJobPosition}
            tin={tin}
            setTin={setTin}
          />
        )}
        {formType === "company" && (
          <CompanyForm
            countryOptions={countryOptions}
            setCompanyAddress={setCompanyAddress}
            companyAddress={companyAddress}
            setCountry={setCountry}
            country={country}
            setMobileNumber={setMobileNumber}
            mobileNumber={mobileNumber}
            setTin={setTin}
            tin={tin}
            setCompanyName={setCompanyName}
            companyName={companyName}
            setCompanyNature={setCompanyNature}
            companyNature={companyNature}
            setCompanyEmail={setCompanyEmail}
            companyEmail={companyEmail}
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
            contactPerson={contactPerson}
            setContactPerson={setContactPerson}
            telephoneNumber={telephoneNumber}
            setTelephoneNumber={setTelephoneNumber}
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
                  data={userData}
                  customStyles={customStyles}
                />
              </div>
              <div className="d-flex flex-column title-custom align-items-end">
                <span className="align-self-end">Cash Balance</span>
                <span className="fs-2 text-end" style={{ color: "green" }}>
                  ₱ {balance}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        <br></br>
        {authrztn.includes("Customers-Edit") && (
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
        )}
      </Form>
    </div>
  );
}

export default CustomerUpdate;
