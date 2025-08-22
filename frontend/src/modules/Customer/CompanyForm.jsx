// IndividualForm.jsx

import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";

const CompanyForm = ({
  countryOptions,
  setCompanyAddress,
  companyAddress,
  setCountry,
  country,
  setMobileNumber,
  mobileNumber,
  setTin,
  tin,
  setCompanyName,
  companyName,
  setCompanyNature,
  companyNature,
  setCompanyEmail,
  companyEmail,
  socialLinks,
  setSocialLinks,
  contactPerson,
  setContactPerson,
  setTelephoneNumber,
  telephoneNumber,
}) => {
  const [companyEmailError, setCompanyEmailError] = useState("");
  console.log(socialLinks);
  // const uuid = crypto.randomUUID(); // Generates a 36-character UUID
  const uuid = uuidv4(); // Generates a UUID
  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      { id: uuid, platform: "", link: "", isDeleted: false },
    ]);
  };

  const updateSocialLink = (itemToUpdate, field, value) => {
    const newSocialLinks = [...socialLinks];
    const index = newSocialLinks.findIndex((item) => item === itemToUpdate);
    if (index !== -1) {
      newSocialLinks[index][field] = value;
      setSocialLinks(newSocialLinks);
    }
  };

  const deleteSocialLink = (index) => {
    const newSocialLinks = [...socialLinks];
    // newSocialLinks.splice(index, 1); //old code
    newSocialLinks[index].isDeleted = true; // new Code
    setSocialLinks(newSocialLinks);
  };

  const addContact = () => {
    setContactPerson([
      ...contactPerson,
      {
        id: uuid,
        fname: "",
        mname: "",
        lname: " ",
        mobileNumber: "",
        email: "",
        jobPosition: "",
        Remarks: "",
        isDeleted: false,
      },
    ]);
  };

  const updateContact = (itemToUpdate, field, value) => {
    const newContactPerson = [...contactPerson];
    const index = newContactPerson.findIndex((item) => item === itemToUpdate);
    if (index !== -1) {
      newContactPerson[index][field] = value;
      setContactPerson(newContactPerson);
    }
  };

  const deleteContact = (index) => {
    const newContactPerson = [...contactPerson];
    // newcontactPerson.splice(index, 1); //old code
    newContactPerson[index].isDeleted = true; // new Code
    setContactPerson(newContactPerson);
  };

  const validateCompanyEmail = (e) => {
    const value = e.target.value;
    setCompanyEmail(value);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setCompanyEmailError("Please enter a valid email address.");
    } else {
      setCompanyEmailError("");
    }
  };
  return (
    <>
      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Nature <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyNature}
              onChange={(e) => setCompanyNature(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Email Address<span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              value={companyEmail}
              onChange={validateCompanyEmail}
              required
            />
            {companyEmailError && (
              <div className="text-danger">{companyEmailError}</div>
            )}
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>Country</Form.Label>
            <Form.Select
              defaultValue="Philippines"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option disabled value="">
                Select Country
              </option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Mobile No. <span className="text-danger">*</span>
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text">+63</span>
              <Form.Control
                type="text"
                required
                maxLength={10} // Limit to 10 digits
                value={mobileNumber}
                onKeyPress={(e) => {
                  // Allow only numbers
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Telephone No. <span className="text-danger">*</span>
            </Form.Label>
            <div className="input-group">
              <Form.Control
                required
                type="text"
                maxLength={10} // Limit to 10 digits
                value={telephoneNumber}
                onInput={(e) => {
                  // Allow only numbers
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setTelephoneNumber(e.target.value)}
                placeholder="Enter mobile number"
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
              onChange={(e) => setTin(e.target.value)}
            />
          </Form.Group>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-sm">
          <div className="d-flex flex-row justify-content-between mb-1">
            <span>
              <Form.Label className="h5">Social Media Links</Form.Label>
            </span>
            <span className="mx-2">
              <button
                className="btn btn-primary"
                type="button"
                onClick={addSocialLink}
              >
                <i className="fa-solid fa-plus"></i> Add Links
              </button>
            </span>
          </div>

          <table className="table  table-responsive table-hover">
            <thead className="table-light">
              <tr>
                <th>Platform</th>
                <th>Link</th>
                <th className="text-center" style={{ width: "10%" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {socialLinks.map(
                (link, index) =>
                  !link.isDeleted && ( // Conditionally render if not deleted
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Facebook"
                          value={link.platform}
                          onChange={(e) =>
                            updateSocialLink(link, "platform", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Enter link"
                          value={link.link}
                          onChange={(e) =>
                            updateSocialLink(link, "link", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center" style={{ width: "10%" }}>
                        <button
                          className="btn "
                          type="button"
                          onClick={() => deleteSocialLink(index)}
                          disabled={
                            socialLinks.filter((link) => !link.isDeleted)
                              .length === 1
                          }
                        >
                          <i className="fa-solid fa-trash text-danger fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border my-5"></div>

      <div className="row ">
        <div className="col-sm">
          <div className="d-flex flex-row justify-content-between align-items-center mb-4">
            <span>
              <Form.Label className="h5">CONTACT PERSON</Form.Label>
            </span>
            <span className="mx-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={addContact}
              >
                <i className="fa-solid fa-plus"></i> Add Contact
              </button>
            </span>
          </div>

          {contactPerson.map(
            (contact, index) =>
              !contact.isDeleted && ( // Conditionally render if not deleted
                <div className="container-fluid border mb-3" key={index}>
                  <div className="d-flex flex-row justify-content-between mt-3 mb-4">
                    <span>
                      <Form.Label className="h6">
                        CONTACT {index + 1}
                      </Form.Label>
                    </span>
                    <span className="mx-2">
                      <button
                        className="btn "
                        type="button"
                        onClick={() => deleteContact(index)}
                        disabled={
                          contactPerson.filter((c) => !c.isDeleted).length === 1
                        }
                      >
                        <i className="fa-solid fa-trash text-danger fs-5"></i>
                      </button>
                    </span>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>First Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="First Name"
                        value={contact.fname}
                        onChange={(e) =>
                          updateContact(contact, "fname", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Middle Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Middle Name"
                        value={contact.mname}
                        onChange={(e) =>
                          updateContact(contact, "mname", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Last Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Last Name"
                        value={contact.lname}
                        onChange={(e) =>
                          updateContact(contact, "lname", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>Email Address :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Email Address"
                        value={contact.email}
                        onChange={(e) =>
                          updateContact(contact, "email", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Job Position :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Job Position"
                        value={contact.jobPosition}
                        onChange={(e) =>
                          updateContact(contact, "jobPosition", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Mobile Number :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Mobile Number"
                        value={contact.mobileNumber}
                        onChange={(e) =>
                          updateContact(contact, "mobileNumber", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>Remarks :</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={contact.Remarks}
                        onChange={(e) =>
                          updateContact(contact, "Remarks", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </>
  );
};

export default CompanyForm;
