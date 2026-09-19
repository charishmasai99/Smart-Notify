import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";


/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  name: "",
  audience_type: "",
  description: "",
  state: "",
  gender: "",
  language: "",
  occupation: "",
};


/* =========================================================
   OPTIONS
========================================================= */

const AUDIENCE_TYPES = [
  "College Students",
  "Public Citizens",
  "Professionals",
  "Senior Citizens",
  "School Students",
  "Government Employees",
  "Farmers",
  "Women",
  "Youth",
];


const STATES = [
  "Andhra Pradesh",
  "Telangana",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Maharashtra",
  "Delhi",
];


const LANGUAGES = [
  "Telugu",
  "English",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
];


const GENDERS = [
  "All",
  "Male",
  "Female",
  "Other",
];


const OCCUPATIONS = [
  "Students",
  "Working Professionals",
  "Business",
  "Government Employees",
  "Self Employed",
  "Teachers",
  "Healthcare",
  "Farmers",
  "General Public",
];


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeSingle(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  if (!value) {
    return "";
  }

  return String(value).split(",")[0].trim();
}


/* =========================================================
   SINGLE SELECT
========================================================= */

function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  function selectOption(option) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`
          flex min-h-[52px] w-full
          items-center justify-between
          rounded-xl border bg-white
          px-4 py-2 text-left
          shadow-sm transition
          ${
            open
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-slate-300 hover:border-slate-400"
          }
        `}
      >
        <span
          className={
            value
              ? "text-sm text-slate-700"
              : "text-sm text-slate-400"
          }
        >
          {value || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`
            shrink-0 text-slate-500 transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 right-0 top-full z-[200] mt-2
            max-h-56 overflow-y-auto rounded-xl
            border border-slate-200 bg-white p-2 shadow-xl
          "
        >
          {options.map((option) => {
            const selected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`
                  flex w-full items-center justify-between
                  rounded-lg px-3 py-2.5 text-left text-sm transition
                  ${
                    selected
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <span>{option}</span>
                {selected && (
                  <span className="font-bold text-blue-600">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   AUDIENCE FORM
========================================================= */

export default function AudienceForm({
  onSave,
  onClose,
  initialData = null,
}) {

  const [formData, setFormData] =
    useState(() => {

      if (!initialData) {
        return {
          ...EMPTY_FORM,
        };
      }

      return {
        name:
          initialData.name || "",

        audience_type:
          normalizeSingle(
            initialData.audience_type
          ),

        description:
          initialData.description ||
          "",

        state:
          normalizeSingle(
            initialData.state
          ),

        gender:
          normalizeSingle(
            initialData.gender
          ),

        language:
          normalizeSingle(
            initialData.language
          ),

        occupation:
          normalizeSingle(
            initialData.occupation
          ),
      };
    });


  const [saving, setSaving] =
    useState(false);


  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  function updateField(
    field,
    value
  ) {
    setFormData(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }


  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();


    /* NAME */

    if (!formData.name.trim()) {
      alert(
        "Please enter an audience name."
      );

      return;
    }


    /* AUDIENCE TYPE */

    if (!formData.audience_type) {
      alert(
        "Please select an audience type."
      );

      return;
    }


    /*
     * IMPORTANT:
     * District is intentionally NOT included.
     */


    const payload = {
      name:
        formData.name.trim(),

      audience_type:
        formData.audience_type.trim(),

      description:
        formData.description.trim(),

      state:
        formData.state.trim(),

      gender:
        formData.gender.trim(),

      language:
        formData.language.trim(),

      occupation:
        formData.occupation.trim(),
    };


    console.log(
      "Audience payload:",
      payload
    );


    try {

      setSaving(true);

      await onSave(payload);

    } catch (error) {

      console.error(
        "Audience save error:",
        error
      );

      /*
       * Parent already displays
       * the API error.
       */

    } finally {

      setSaving(false);

    }
  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center
        justify-center
        bg-slate-950/50
        p-4
      "
    >

      <div
        className="
          flex max-h-[90vh]
          w-full max-w-4xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex items-start
            justify-between
            border-b
            border-slate-200
            px-7 py-6
          "
        >

          <div>

            <h2
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              {initialData
                ? "Edit Audience"
                : "Add Audience"}
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Define the target audience for
              your communication campaigns.
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-lg
              p-2
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="
            overflow-y-auto
          "
        >

          <div
            className="
              grid
              grid-cols-1
              gap-6
              p-7
              md:grid-cols-2
            "
          >

            {/* =============================================
                AUDIENCE NAME
            ============================================= */}

            <div>

              <label
                className="
                  mb-2 block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Audience Name

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>


              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="e.g. Telangana College Students"
                required
                className="
                  h-[52px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  text-sm
                  outline-none
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>


            {/* =============================================
                AUDIENCE TYPE
            ============================================= */}

            <MultiSelect
              label="Audience Type"
              options={AUDIENCE_TYPES}
              value={
                formData.audience_type
              }
              onChange={(value) =>
                updateField(
                  "audience_type",
                  value
                )
              }
              placeholder="Select audience type"
            />


            {/* =============================================
                STATE
            ============================================= */}

            <MultiSelect
              label="State"
              options={STATES}
              value={formData.state}
              onChange={(value) =>
                updateField(
                  "state",
                  value
                )
              }
              placeholder="Select state"
            />


            {/* =============================================
                LANGUAGE
            ============================================= */}

            <MultiSelect
              label="Language"
              options={LANGUAGES}
              value={
                formData.language
              }
              onChange={(value) =>
                updateField(
                  "language",
                  value
                )
              }
              placeholder="Select language"
            />


            {/* =============================================
                GENDER
            ============================================= */}

            <MultiSelect
              label="Gender"
              options={GENDERS}
              value={formData.gender}
              onChange={(value) =>
                updateField(
                  "gender",
                  value
                )
              }
              placeholder="Select gender"
            />


            {/* =============================================
                OCCUPATION
            ============================================= */}

            <MultiSelect
              label="Occupation"
              options={OCCUPATIONS}
              value={
                formData.occupation
              }
              onChange={(value) =>
                updateField(
                  "occupation",
                  value
                )
              }
              placeholder="Select occupation"
            />


            {/* =============================================
                DESCRIPTION
            ============================================= */}

            <div
              className="
                md:col-span-2
              "
            >

              <label
                className="
                  mb-2 block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Description
              </label>


              <textarea
                rows={4}
                value={
                  formData.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe this audience segment..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-300
                  px-4 py-3
                  text-sm
                  outline-none
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="
              flex
              justify-end
              gap-3
              border-t
              border-slate-200
              px-7 py-5
            "
          >

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-xl
                border
                border-slate-300
                px-6 py-3
                font-semibold
                text-slate-700
                hover:bg-slate-50
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={saving}
              className="
                rounded-xl
                bg-blue-600
                px-7 py-3
                font-semibold
                text-white
                shadow-sm
                hover:bg-blue-700
                disabled:opacity-60
              "
            >
              {saving
                ? "Saving..."
                : initialData
                ? "Update Audience"
                : "Save Audience"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );
}