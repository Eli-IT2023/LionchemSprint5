import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const Formulation = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/formulation/getFinishProduct"
  );

  const pagination = useServerPagination(paginationUrl, 10);

  useEffect(() => {
    // Reset pagination when search parameters change
    if (searchText || statusFilter) {
      pagination.goToPage(1);
    }
  }, [searchText, statusFilter]);

  const renderStatus = (status, color) => {
    return <span className={color}>{status}</span>;
  };

  const handleRowClick = (id) => {
    navigate(`/inventory/create-update-formulation/${id}`);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    updateSearchParams(value, statusFilter, searchCategory);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    updateSearchParams(searchText, event.target.value, searchCategory);
  };

  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
    updateSearchParams(searchText, statusFilter, category);
  };

  const updateSearchParams = (text, status, category) => {
    setPaginationUrl(
      BASE_URL + "/formulation/getFinishProductBySearchOrFilter"
    );

    const params = {};

    if (text) {
      params.searchText = text;
    }

    if (status) {
      params.status = status;
    }

    if (category && category !== "all") {
      params.searchCategory = category;
    }

    pagination.updateParams(params);
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setSearchCategory("all");
    setPaginationUrl(BASE_URL + "/formulation/getFinishProduct");
    pagination.updateParams({});
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
              <span className="fs-3">FORMULATION</span>
            </div>
            <div>
              {authrztn.includes("Productions-Add") && (
                <Link
                  to="/inventory/create-update-formulation"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>

          <div className="container-fluid mt-4">
            <div className="row">
              <div className="col-sm">
                <label htmlFor="cutoff">Status</label>
                <select
                  className="form-select"
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">All</option>
                  <option value="Closed">Closed</option>
                  <option value="Quality Checking">Quality Checking</option>
                  <option value="Not Yet Qualified">Not Yet Qualified</option>
                </select>
              </div>
              <div className="col-sm mt-3 pt-1">
                <button
                  className="btn btn-outline-secondary p-2"
                  onClick={clearFilters}
                >
                  Clear Filter
                </button>
              </div>
              <div className="col-sm"></div>
            </div>
            <div className="col-sm mt-3">
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
                  className="btn btn-outline-secondary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className={`dropdown-item ${
                        searchCategory === "all" ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange("all")}
                    >
                      All Fields
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        searchCategory === "product_id" ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange("product_id")}
                    >
                      Product ID
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        searchCategory === "product_name" ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange("product_name")}
                    >
                      Product Name
                    </button>
                  </li>
                  {/* <li>
                    <button
                      className={`dropdown-item ${
                        searchCategory === "description" ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange("description")}
                    >
                      Description
                    </button>
                  </li> */}
                  <li>
                    <button
                      className={`dropdown-item ${
                        searchCategory === "chemist" ? "active" : ""
                      }`}
                      onClick={() => handleSearchCategoryChange("chemist")}
                    >
                      Chemist Name
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PREFIX
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT CODE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {/* <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DESCRIPTION
                      <i className="fas fa-sort ms-1"></i>
                    </th> */}
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CHEMIST NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DATE CREATED
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center"
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
                      <td colSpan="7" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item.product_id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center">{item.prefix}</td>
                        <td className="text-center">{item.product_code}</td>
                        <td className="text-center">{item.product_name}</td>
                        {/* <td>{item.description}</td> */}
                        <td className="text-center">{item.chemistName}</td>
                        <td className="text-center">
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(item.createdAt))}
                        </td>
                        <td className="text-center">
                          {renderStatus(
                            item.qualificationStatus,
                            item.statusColor
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Use the pagination controls with server pagination */}
            <PaginationControls {...pagination} />
          </div>
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

export default Formulation;
