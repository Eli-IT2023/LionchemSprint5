import { useState, React, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { ThreeDot } from "react-loading-indicators";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

const CompanyProfile = () => {
  const userLoggedID = useDecodeToken();
  const [imagePreview, setImagePreview] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [landline, setLandline] = useState("");
  const [email, setEmail] = useState("");
  const [tin, setTin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForCreate, setIsForCreate] = useState(true);

  // FORM VALIDATION
  const [validated, setValidated] = useState(false);
  const [fetchData, setFetchData] = useState({});

  const fetchCompanyProfile = async () => {
    try {
      const res = await axios.get(BASE_URL + "/CompanyProfile/fetchData");
      if (res.data.success) {
        setFetchData(res.data.data || {}); // If success but there is no data, set state as empty object
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      setFetchData({}); // if no data found, set state as empty object
    }
  };

  // fetch data when page loads
  useEffect(() => {
    fetchCompanyProfile();
    // console.log(fetchCompanyProfile);
  }, []);

  useEffect(() => {
    if (Object.keys(fetchData).length > 0) {
      // SET TEXT INPUT VALUES BASED ON FETCHED DATA
      const profile = fetchData;

      setCompanyName(profile?.company_name || "");
      setCompanyAddress(profile?.company_address || "");
      setContactNumber(profile?.contact_number || "");
      setLandline(profile?.landline || "");
      setEmail(profile?.email || "");
      setTin(profile?.tin || "");
      setImagePreview(profile?.logo || null);
      setIsForCreate(false);
    } else {
      setIsForCreate(true);
    }
  }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "No data",
        text: "Please fill out all the fields!",
      });
      return;
    }

    const confirmed = await swal({
      icon: "warning",
      title: "Create New Company Profile?",
      text: "",
      buttons: true,
      dangerMode: true,
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/CompanyProfile/saveCompanyProfile",
        {
          userLoggedID,
          companyName,
          companyAddress,
          contactNumber,
          landline,
          imagePreview,
          email,
          tin,
        }
      );

      if (res.status === 200) {
        await swal({
          icon: "success",
          title: "Success!",
          text: "Company Profile has been successfully added!",
          button: false,
          timer: 2000,
        });
        fetchCompanyProfile();
      }
    } catch (error) {
      swal({
        icon: "error",
        title: "Error!",
        text: "There was an error saving company profile",
        button: false,
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "No data",
        text: "Please fill out all the fields!",
      });
      return;
    }

    const confirmed = await swal({
      icon: "warning",
      title: "Update New Company Profile?",
      text: "",
      buttons: true,
      dangerMode: true,
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/CompanyProfile/updateCompanyProfile",
        {
          userLoggedID,
          companyName,
          companyAddress,
          contactNumber,
          landline,
          imagePreview,
          email,
          tin,
        }
      );

      if (res.status === 200) {
        await swal({
          icon: "success",
          title: "Success!",
          text: "Company Profile has been successfully updated!",
          button: false,
          timer: 2000,
        });
        fetchCompanyProfile();
      }
    } catch (error) {
      swal({
        icon: "error",
        title: "Error!",
        text: "There was an error saving company profile",
        button: false,
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };

        reader.readAsDataURL(file);
      } else {
        // Reset preview and clear file input for invalid file type
        setImagePreview(null);
        event.target.value = ""; // Clear the file input
        swal({
          icon: "error",
          title: "Invalid file format",
          text: "Please upload a valid image format",
        });
      }
    } else {
      // Reset preview if no file selected
      setImagePreview(null);
    }
  };

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={(e) => {
        isForCreate ? handleSave(e) : handleUpdate(e);
      }}
      className="h-100 w-100 border bg-white custom-container"
    >
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
      ) : (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">COMPANY PROFILE</span>
              <span>PROFILE SETUP</span>
            </div>
            <div>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center title-button"
              >
                Save
              </button>
            </div>
          </div>

          <div className="container-fluid">
            <div className="row mx-auto gap-3">
              <div className="col-sm w-100 p-3">
                <div className="my-3">
                  <p className="m-0">Company Name</p>
                  <input
                    className="w-100 form-control"
                    type="text"
                    placeholder="Enter Name"
                    title="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <p className="m-0">Company Address</p>
                  <input
                    className="w-100 form-control"
                    type="text"
                    placeholder="Enter Address"
                    title="Company Address"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                <div className="mt-3 contact-section">
                  <div className="my-3">
                    <p className="m-0">Landline</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter Landline"
                      title="Landline"
                      value={landline}
                      onChange={(e) => setLandline(e.target.value)}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">Contact Number</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter Contact Number"
                      title="Enter Contact Number"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      maxLength={11}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">Company Email</p>
                    <input
                      className="w-100 form-control"
                      type="email"
                      placeholder="Enter Email"
                      title="Company E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">TIN No.</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter TIN"
                      title="TIN No."
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm w-100 p-3 flex-column justify-content-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="mb-3 rounded-circle border"
                    style={{
                      width: "clamp(200px, 25vw, 220px)", // Clamp for width
                      height: "clamp(150px, 20vw, 220px)", // Clamp for height
                      border: "2px dashed #ddd",
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {imagePreview ? (
                      <img
                        className="d-flex h-100 w-100 align-items-center justify-content-center"
                        src={imagePreview}
                        alt="Company Logo Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex flex-column h-100 w-100 align-items-center justify-content-center"
                        style={{
                          color: "#6c757d",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        <div>No image selected</div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  className="w-100 px-3 py-2 border rounded"
                  type="file"
                  name="CompanyLogo"
                  id="companylogo"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                />
                <small>Please upload a JPG, PNG, or WEBP File</small>
              </div>
            </div>
          </div>
        </>
      )}
    </Form>
  );
};

export default CompanyProfile;
