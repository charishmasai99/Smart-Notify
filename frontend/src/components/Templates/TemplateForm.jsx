import { useState } from "react";

import {
  FileText,
  X,
  Save,
  Mail,
  MessageSquare,
  Bell,
  Globe,
} from "lucide-react";


export default function TemplateForm({
  onSave,
  onClose,
  initialData = null,
}) {
  const [formData, setFormData] = useState(() => ({
    template_name:
      initialData?.template_name || "",

    template_type:
      initialData?.template_type || "",

    content:
      initialData?.content || "",
  }));


  const [saving, setSaving] = useState(false);


  // ==========================================================
  // INPUT
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.template_name.trim()) {
      return;
    }

    if (!formData.template_type) {
      return;
    }

    if (!formData.content.trim()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        template_name:
          formData.template_name.trim(),

        template_type:
          formData.template_type,

        content:
          formData.content.trim(),
      };

      console.log(
        "FINAL TEMPLATE PAYLOAD:",
        payload
      );

      await onSave(payload);

    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // ICON
  // ==========================================================

  const getTypeIcon = () => {
    switch (formData.template_type) {
      case "Email":
        return <Mail size={18} />;

      case "SMS":
        return (
          <MessageSquare size={18} />
        );

      case "Push Notification":
        return <Bell size={18} />;

      case "Web Broadcast":
        return <Globe size={18} />;

      default:
        return <FileText size={18} />;
    }
  };


  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-slate-950/60
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="
          flex max-h-[90vh]
          w-full max-w-4xl
          flex-col overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div
          className="
            flex shrink-0
            items-center justify-between
            border-b border-slate-200
            px-7 py-5
          "
        >
          <div className="flex items-center gap-4">

            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-xl bg-blue-50
              "
            >
              <FileText
                size={25}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2
                className="
                  text-2xl font-bold
                  text-slate-900
                "
              >
                {initialData
                  ? "Edit Template"
                  : "Add Template"}
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-slate-500
                "
              >
                Create a reusable communication
                template for your campaigns.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X size={21} />
          </button>
        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >

          <div className="space-y-6 p-7">

            {/* DETAILS */}

            <div>
              <h3
                className="
                  mb-4 text-base
                  font-bold text-slate-900
                "
              >
                Template Details
              </h3>

              <div
                className="
                  grid grid-cols-1
                  gap-5 md:grid-cols-2
                "
              >

                {/* TEMPLATE NAME */}

                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm font-semibold
                      text-slate-700
                    "
                  >
                    Template Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    name="template_name"
                    type="text"
                    value={
                      formData.template_name
                    }
                    onChange={handleChange}
                    placeholder="e.g. Emergency Alert"
                    className="
                      sn-input w-full
                    "
                    required
                  />
                </div>


                {/* TEMPLATE TYPE */}

                <div>
                  <label
                    className="
                      mb-2 block
                      text-sm font-semibold
                      text-slate-700
                    "
                  >
                    Template Type
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <select
                      name="template_type"
                      value={
                        formData.template_type
                      }
                      onChange={handleChange}
                      className="
                        sn-input w-full
                        appearance-none pr-10
                      "
                      required
                    >
                      <option value="">
                        Select Template Type
                      </option>

                      <option value="Emergency Alert">
                        Emergency Alert
                      </option>

                      <option value="Health Awareness">
                        Health Awareness
                      </option>

                      <option value="Environmental">
                        Environmental
                      </option>

                      <option value="Financial Literacy">
                        Financial Literacy
                      </option>

                      <option value="Announcement">
                        Announcement
                      </option>

                      <option value="General">
                        General
                      </option>
                    </select>

                    {formData.template_type && (
                      <div
                        className="
                          pointer-events-none
                          absolute right-4 top-1/2
                          -translate-y-1/2
                          text-blue-600
                        "
                      >
                        {getTypeIcon()}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>


            {/* CONTENT */}

            <div>

              <div
                className="
                  mb-2 flex
                  items-center justify-between
                "
              >
                <label
                  className="
                    block text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  Template Content
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <span
                  className="
                    text-xs text-slate-400
                  "
                >
                  {formData.content.length}
                  {" "}characters
                </span>
              </div>

              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write the reusable campaign message here..."
                rows={8}
                className="
                  w-full resize-y
                  rounded-xl
                  border border-slate-300
                  bg-white
                  px-4 py-3
                  text-sm text-slate-900
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
                required
              />

            </div>


            {/* PREVIEW */}

            {formData.content.trim() && (
              <div
                className="
                  rounded-xl
                  border border-blue-100
                  bg-blue-50/50
                  p-5
                "
              >
                <div
                  className="
                    mb-3 flex
                    items-center gap-2
                  "
                >
                  <FileText
                    size={18}
                    className="text-blue-600"
                  />

                  <h3
                    className="
                      font-semibold
                      text-slate-900
                    "
                  >
                    Template Preview
                  </h3>
                </div>

                <div
                  className="
                    rounded-lg
                    border border-slate-200
                    bg-white p-4
                  "
                >
                  <div
                    className="
                      mb-3 flex
                      items-center
                      justify-between
                    "
                  >
                    <span
                      className="
                        font-semibold
                        text-slate-900
                      "
                    >
                      {formData.template_name ||
                        "Template Name"}
                    </span>

                    {formData.template_type && (
                      <span
                        className="
                          rounded-full
                          bg-blue-50
                          px-3 py-1
                          text-xs font-semibold
                          text-blue-700
                        "
                      >
                        {formData.template_type}
                      </span>
                    )}
                  </div>

                  <p
                    className="
                      whitespace-pre-wrap
                      text-sm leading-6
                      text-slate-600
                    "
                  >
                    {formData.content}
                  </p>
                </div>
              </div>
            )}

          </div>


          {/* FOOTER */}

          <div
            className="
              flex shrink-0
              justify-end gap-3
              border-t border-slate-200
              bg-slate-50
              px-7 py-5
            "
          >

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-xl
                border border-slate-300
                bg-white
                px-6 py-3
                font-semibold
                text-slate-700
                hover:bg-slate-100
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-7 py-3
                font-semibold
                text-white
                hover:bg-blue-700
                disabled:opacity-60
              "
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : initialData
                  ? "Update Template"
                  : "Save Template"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}