import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Users,
  Plus,
  Search,
  MapPin,
  Globe2,
  Edit3,
  Trash2,
  Eye,
  X,
} from "lucide-react";

import AudienceStats from "../../components/Audience/AudienceStats";
import audienceService from "../../services/audienceService";
import AudienceForm from "../../components/Audience/AudienceForm";


/* =========================================================
   HELPERS
========================================================= */

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


/* =========================================================
   COMPONENT
========================================================= */

export default function Audience() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCampaignManager = currentUser?.role === "Campaign Manager";
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingAudience, setEditingAudience] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAudience, setViewingAudience] = useState(null);
  const [audienceMembers, setAudienceMembers] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);


  /* =========================================================
     LOAD AUDIENCES
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadAudiences() {
      try {
        const data = await audienceService.getAll();

        if (mounted) {
          setAudiences(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Unable to load audiences:", error);

        if (mounted) {
          toast.error("Unable to load audience.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAudiences();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     VIEW AUDIENCE
  ========================================================= */

  const handleViewAudience = useCallback(async (audience) => {
    setShowViewModal(true);
    setViewingAudience(audience);
    setAudienceMembers([]);
    setViewLoading(true);

    try {
      const [audienceDetails, members] = await Promise.all([
        audienceService.getById(audience.id),
        audienceService.getMembers(audience.id),
      ]);

      setViewingAudience(audienceDetails || audience);
      setAudienceMembers(
        Array.isArray(members) ? members : []
      );
    } catch (error) {
      console.error(
        "Unable to load audience details:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Unable to load audience details."
        )
      );
    } finally {
      setViewLoading(false);
    }
  }, []);



  /* =========================================================
     OPEN AUDIENCE FROM GLOBAL SEARCH
  ========================================================= */

  useEffect(() => {
  const audienceId = searchParams.get("audienceId");

  if (!audienceId || audiences.length === 0) {
    return;
  }

  const selectedAudience = audiences.find(
    (audience) =>
      String(audience.id) === String(audienceId)
  );

  if (!selectedAudience) {
    return;
  }

  // Defer the view operation until after the current effect
  // completes. This avoids calling state setters synchronously
  // from inside the effect while preserving the existing
  // audience view modal behavior.
  Promise.resolve().then(() => {
  handleViewAudience(selectedAudience);
});

  // Remove the search parameter after opening the selected
  // audience so refreshing the page does not reopen it.
  setSearchParams(
    (previous) => {
      const next = new URLSearchParams(previous);
      next.delete("audienceId");
      return next;
    },
    { replace: true }
  );
}, [
  audiences,
  searchParams,
  setSearchParams,
  handleViewAudience,
]);

  /* =========================================================
     REFRESH
  ========================================================= */

  async function refreshAudiences() {
    try {
      const data = await audienceService.getAll();

      setAudiences(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to refresh audiences:", error);

      toast.error("Unable to refresh audience.");
    }
  }


  /* =========================================================
     ERROR MESSAGE
  ========================================================= */

  function getErrorMessage(error, fallback) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item === "object") {
            return (
              item.msg ||
              item.message ||
              "Validation error"
            );
          }

          return "Validation error";
        })
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return (
        detail.msg ||
        detail.message ||
        fallback
      );
    }

    if (error?.message) {
      return error.message;
    }

    return fallback;
  }


  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  async function handleSave(formData) {
    try {
      if (editingAudience) {
        await audienceService.update(
          editingAudience.id,
          formData
        );

        toast.success(
          "Audience updated successfully."
        );
      } else {
        await audienceService.create(formData);

        toast.success(
          "Audience created successfully."
        );
      }

      await refreshAudiences();

      setShowForm(false);
      setEditingAudience(null);
    } catch (error) {
      console.error(
        "Unable to save audience:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Unable to save audience."
        )
      );

      /*
       * Re-throw so AudienceForm knows the request failed.
       */
      throw error;
    }
  }


  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this audience?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await audienceService.delete(id);

      await refreshAudiences();

      toast.success(
        "Audience deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Delete failed."
        )
      );
    }
  }


  /* =========================================================
     CLOSE VIEW MODAL
  ========================================================= */

  function closeViewModal() {
    setShowViewModal(false);
    setViewingAudience(null);
    setAudienceMembers([]);
    setViewLoading(false);
  }


  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

  const audienceTypes = useMemo(() => {
    const values = audiences.flatMap((audience) =>
      toArray(audience.audience_type)
    );

    return [...new Set(values)];
  }, [audiences]);


  const languages = useMemo(() => {
    const values = audiences.flatMap((audience) =>
      toArray(audience.language)
    );

    return [...new Set(values)];
  }, [audiences]);


  /* =========================================================
     FILTERED AUDIENCES
  ========================================================= */

  const filteredAudiences = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return audiences.filter((audience) => {
      const audienceTypes = toArray(
        audience.audience_type
      );

      const states = toArray(
        audience.state
      );

      const languages = toArray(
        audience.language
      );

      const genders = toArray(
        audience.gender
      );

      const occupations = toArray(
        audience.occupation
      );

      const searchableValues = [
        audience.name,
        audience.description,
        ...audienceTypes,
        ...states,
        ...languages,
        ...genders,
        ...occupations,
      ];

      const matchesSearch =
        !query ||
        searchableValues
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesType =
        !typeFilter ||
        audienceTypes.includes(typeFilter);

      const matchesLanguage =
        !languageFilter ||
        languages.includes(languageFilter);

      return (
        matchesSearch &&
        matchesType &&
        matchesLanguage
      );
    });
  }, [
    audiences,
    search,
    typeFilter,
    languageFilter,
  ]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="audience-loading">
        <div className="audience-loading-spinner" />
        <p>Loading audiences...</p>
      </div>
    );
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="audience-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="audience-header-card">

        <div className="audience-header-content">

          <div className="audience-title-row">

            <div className="audience-title-icon">
              <Users size={24} />
            </div>

            <div>
              <h1>
                Audience Management
              </h1>

              <p>
                Segment regional populations by
                state, language, occupation, and
                demographics for targeted
                communications.
              </p>
            </div>

          </div>


          <div className="audience-header-right">

            <div className="audience-total">

              <span>
                TOTAL VERIFIED
                <br />
                CITIZENS
              </span>

              <strong>
                {audiences.length}
              </strong>

            </div>


            {isCampaignManager && (
              <button
                type="button"
                className="audience-create-button"
                onClick={() => {
                  setEditingAudience(null);
                  setShowForm(true);
                }}
              >
                <Plus size={18} />
                <span>
                  Create
                  <br />
                  Audience
                </span>
              </button>
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <AudienceStats
        audiences={audiences}
      />


      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <section className="audience-filter-card">

        <div className="audience-search-box">

          <Search size={20} />

          <input
            type="text"
            placeholder="Search by name, state, language, or occupation..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="audience-clear-button"
              onClick={() => setSearch("")}
            >
              <X size={17} />
            </button>
          )}

        </div>


        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
          className="audience-filter-select"
        >
          <option value="">
            All Audience Types
          </option>

          {audienceTypes.map((type) => (
            <option
              value={type}
              key={`type-${type}`}
            >
              {type}
            </option>
          ))}
        </select>


        <select
          value={languageFilter}
          onChange={(event) =>
            setLanguageFilter(event.target.value)
          }
          className="audience-filter-select"
        >
          <option value="">
            All Languages
          </option>

          {languages.map((language) => (
            <option
              value={language}
              key={`language-${language}`}
            >
              {language}
            </option>
          ))}
        </select>

      </section>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="audience-table-card">

        <div className="audience-table-header">

          <div>
            <h2>
              Audience Groups
            </h2>

            <p>
              Manage audience segments used for
              targeted public communications.
            </p>
          </div>

          <span>
            {filteredAudiences.length} group
            {filteredAudiences.length !== 1
              ? "s"
              : ""}
          </span>

        </div>


        <div className="audience-table-wrapper">

          <table className="audience-table">

            <thead>
              <tr>

                <th>
                  Audience Name
                </th>

                <th>
                  Type
                </th>

                <th>
                  State
                </th>

                <th>
                  Language
                </th>

                <th>
                  Gender
                </th>

                <th>
                  Occupation
                </th>

                <th>
                  Actions
                </th>

              </tr>
            </thead>


            <tbody>

              {filteredAudiences.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="audience-empty"
                  >

                    <div className="audience-empty-icon">
                      <Users size={28} />
                    </div>

                    <h3>
                      No audience segments found
                    </h3>

                    <p>
                      Try changing your search or
                      filters.
                    </p>


                    {(search ||
                      typeFilter ||
                      languageFilter) && (

                      <button
                        type="button"
                        className="audience-reset-button"
                        onClick={() => {
                          setSearch("");
                          setTypeFilter("");
                          setLanguageFilter("");
                        }}
                      >
                        Clear Filters
                      </button>

                    )}

                  </td>

                </tr>

              ) : (

                filteredAudiences.map(
                  (audience, index) => (

                    <tr
                      key={
                        audience.id ??
                        `audience-${index}`
                      }
                    >

                      {/* NAME */}

                      <td>

                        <div className="audience-name-cell">

                          <div className="audience-row-icon">
                            <Users size={19} />
                          </div>

                          <div>

                            <strong>
                              {audience.name ||
                                "Unnamed Audience"}
                            </strong>

                            <span>
                              {audience.description ||
                                "Audience segment"}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* TYPE */}

                      <td>

                        <span className="audience-type-badge">
                          {toArray(
                            audience.audience_type
                          ).join(", ") ||
                            "General"}
                        </span>

                      </td>


                      {/* STATE */}

                      <td>

                        <div className="audience-location">

                          <MapPin size={16} />

                          <strong>
                            {toArray(
                              audience.state
                            ).join(", ") || "—"}
                          </strong>

                        </div>

                      </td>


                      {/* LANGUAGE */}

                      <td>

                        <div className="audience-language">

                          <Globe2 size={16} />

                          <span>
                            {toArray(
                              audience.language
                            ).join(", ") || "—"}
                          </span>

                        </div>

                      </td>


                      {/* GENDER */}

                      <td>
                        {toArray(
                          audience.gender
                        ).join(", ") || "—"}
                      </td>


                      {/* OCCUPATION */}

                      <td>
                        {toArray(
                          audience.occupation
                        ).join(", ") || "—"}
                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="audience-actions">

                          {/*
                           * VIEW is available to every workspace role.
                           * This keeps Admin and Communication Team users
                           * able to inspect audience information without
                           * giving them create/edit/delete permissions.
                           */}

                          <button
                            type="button"
                            className="audience-action view"
                            title="View audience"
                            aria-label={`View ${
                              audience.name ||
                              "audience"
                            }`}
                            onClick={() =>
                              handleViewAudience(
                                audience
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>


                          {/*
                           * CREATE / UPDATE / DELETE remain restricted
                           * to the Campaign Manager.
                           */}

                          {isCampaignManager && (
                            <>

                              <button
                                type="button"
                                className="audience-action edit"
                                title="Edit audience"
                                aria-label={`Edit ${
                                  audience.name ||
                                  "audience"
                                }`}
                                onClick={() => {
                                  setEditingAudience(
                                    audience
                                  );

                                  setShowForm(true);
                                }}
                              >
                                <Edit3 size={17} />
                              </button>


                              <button
                                type="button"
                                className="audience-action delete"
                                title="Delete audience"
                                aria-label={`Delete ${
                                  audience.name ||
                                  "audience"
                                }`}
                                onClick={() =>
                                  handleDelete(
                                    audience.id
                                  )
                                }
                              >
                                <Trash2 size={17} />
                              </button>

                            </>
                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <div className="audience-table-footer">

          <span>
            Showing {filteredAudiences.length} of{" "}
            {audiences.length} audience groups
          </span>


          {isCampaignManager && (
            <button
              type="button"
              className="audience-footer-add"
            onClick={() => {
              setEditingAudience(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} />
            Add Audience
          </button>
          )}

        </div>

      </section>


      {/* =====================================================
          VIEW AUDIENCE MODAL

          This modal is read-only.
          All workspace roles can view audience information.
          Only Campaign Manager receives edit/delete controls
          in the table and the separate AudienceForm below.
      ===================================================== */}

      {showViewModal && viewingAudience && (
        <div
          className="audience-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewModal();
            }
          }}
        >

          <div
            className="audience-modal audience-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audience-view-title"
          >

            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="audience-modal-header">

              <div>
                <h2 id="audience-view-title">
                  {viewingAudience.name ||
                    "Audience Details"}
                </h2>

                <p>
                  View audience segment information and
                  members.
                </p>
              </div>

              <button
                type="button"
                className="audience-modal-close"
                onClick={closeViewModal}
                aria-label="Close audience details"
              >
                <X size={20} />
              </button>

            </div>


            {/* =================================================
                MODAL BODY
            ================================================== */}

            <div className="audience-modal-body audience-view-body">

              {viewLoading ? (

                <div className="audience-view-loading">
                  <div className="audience-loading-spinner" />
                  <p>Loading audience details...</p>
                </div>

              ) : (

                <>

                  {/* =================================================
                      AUDIENCE INFORMATION
                  ================================================== */}

                  <section className="audience-view-section">

                    <div className="audience-view-section-heading">
                      <div>
                        <h3>Audience Information</h3>
                        <p>Read-only audience segment details.</p>
                      </div>
                    </div>

                    <div className="audience-view-grid">

                      <div className="audience-view-field">
                        <span>Audience Name</span>
                        <strong>
                          {viewingAudience.name || "—"}
                        </strong>
                      </div>

                      <div className="audience-view-field">
                        <span>Audience Type</span>
                        <strong>
                          {toArray(
                            viewingAudience.audience_type
                          ).join(", ") || "General"}
                        </strong>
                      </div>

                      <div className="audience-view-field full">
                        <span>Description</span>
                        <strong>
                          {viewingAudience.description ||
                            "No description provided."}
                        </strong>
                      </div>

                      <div className="audience-view-field">
                        <span>State</span>
                        <strong>
                          {toArray(
                            viewingAudience.state
                          ).join(", ") || "—"}
                        </strong>
                      </div>

                      <div className="audience-view-field">
                        <span>Language</span>
                        <strong>
                          {toArray(
                            viewingAudience.language
                          ).join(", ") || "—"}
                        </strong>
                      </div>

                      <div className="audience-view-field">
                        <span>Gender</span>
                        <strong>
                          {toArray(
                            viewingAudience.gender
                          ).join(", ") || "—"}
                        </strong>
                      </div>

                      <div className="audience-view-field">
                        <span>Occupation</span>
                        <strong>
                          {toArray(
                            viewingAudience.occupation
                          ).join(", ") || "—"}
                        </strong>
                      </div>

                    </div>

                  </section>


                  {/* =================================================
                      MEMBERS
                  ================================================== */}

                  <section className="audience-view-section">

                    <div className="audience-view-section-heading">

                      <div>
                        <h3>Audience Members</h3>
                        <p>
                          Recipients currently assigned to this
                          audience segment.
                        </p>
                      </div>

                      <span className="audience-view-member-count">
                        {audienceMembers.length} member
                        {audienceMembers.length !== 1
                          ? "s"
                          : ""}
                      </span>

                    </div>

                    {audienceMembers.length === 0 ? (

                      <div className="audience-view-empty">
                        <Users size={24} />
                        <strong>No members assigned</strong>
                        <span>
                          This audience does not currently have
                          any members.
                        </span>
                      </div>

                    ) : (

                      <div className="audience-members-table-wrapper">

                        <table className="audience-members-table">

                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Push</th>
                            </tr>
                          </thead>

                          <tbody>
                            {audienceMembers.map(
                              (member, memberIndex) => (
                                <tr
                                  key={
                                    member.member_id ??
                                    member.user_id ??
                                    `member-${memberIndex}`
                                  }
                                >
                                  <td>
                                    <strong>
                                      {member.name || "Unnamed User"}
                                    </strong>
                                  </td>

                                  <td>
                                    {member.email || "—"}
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        member.has_fcm_token
                                          ? "audience-member-status available"
                                          : "audience-member-status unavailable"
                                      }
                                    >
                                      {member.has_fcm_token
                                        ? "Available"
                                        : "Not available"}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>

                        </table>

                      </div>

                    )}

                  </section>

                </>

              )}

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================== */}

            <div className="audience-modal-footer">

              <button
                type="button"
                className="audience-modal-cancel"
                onClick={closeViewModal}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          FORM
      ===================================================== */}

      {showForm && (
        <AudienceForm
          initialData={editingAudience}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingAudience(null);
          }}
        />
      )}

    </div>
  );
}