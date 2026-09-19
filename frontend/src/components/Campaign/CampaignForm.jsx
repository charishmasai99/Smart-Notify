import { useState } from "react";
import toast from "react-hot-toast";

import aiService from "../../services/aiService";
import channelService from "../../services/channelService";
import MultiChannelSelector from "./MultiChannelSelector";

export default function CampaignForm({
  onSave,
  onClose,
  initialData = null,
  audiences = [],
  savedCampaignId: parentSavedCampaignId = null,
}) {
  // =====================================================
  // FORMAT DATETIME
  // =====================================================

  const formatDateTimeLocal = (value) => {
    if (!value) return "";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      const year =
        date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const hours = String(
        date.getHours()
      ).padStart(2, "0");

      const minutes = String(
        date.getMinutes()
      ).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] =
    useState(() => ({
      campaign_name:
        initialData?.campaign_name ||
        "",

      campaign_type:
        initialData?.campaign_type ||
        "Announcement",

      channels:
        Array.isArray(initialData?.channels) && initialData.channels.length
          ? initialData.channels
          : ["email"],

      subject:
        initialData?.subject ||
        "",

      content:
        initialData?.content ||
        "",

      audience_id:
        initialData?.audience_id ??
        "",

      schedule_time:
        formatDateTimeLocal(
          initialData?.schedule_time
        ),

      schedule_frequency:
        initialData?.schedule_frequency ||
        "one_time",

      status:
        initialData?.status ||
        "Draft",
    }));

  // =====================================================
  // AI STATES
  // =====================================================

  const [campaignType, setCampaignType] =
    useState(
      initialData?.campaign_type ||
      "announcement"
    );

  const [aiAudience, setAiAudience] =
    useState("general public");

  const [tone, setTone] =
    useState("professional");

  const [translatedContent, setTranslatedContent] =
    useState("");

  const [translationLanguage, setTranslationLanguage] =
    useState("telugu");

  const [toneResult, setToneResult] =
    useState("");

  const [complianceResult, setComplianceResult] =
    useState("");

  const [loadingAI, setLoadingAI] =
    useState(false);

  // =====================================================
  // MULTI-CHANNEL DISTRIBUTION
  // =====================================================

  const [channelRecipients, setChannelRecipients] =
    useState(
      initialData?.recipients || {}
    );

  const [savedCampaignId, setSavedCampaignId] = useState(
    parentSavedCampaignId || initialData?.id || null
  );

  const selectedChannels =
    formData.channels || [];
  // =====================================================
  // ERROR HANDLER
  // =====================================================

  const getErrorMessage = (
    error,
    fallbackMessage
  ) => {
    const detail =
      error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (
            typeof item ===
            "string"
          ) {
            return item;
          }

          if (
            item?.loc &&
            item?.msg
          ) {
            const field =
              Array.isArray(
                item.loc
              )
                ? item.loc.join(".")
                : "field";

            return `${field}: ${item.msg}`;
          }

          if (item?.msg) {
            return item.msg;
          }

          return JSON.stringify(
            item
          );
        })
        .join("\n");
    }

    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }

    if (
      typeof error?.message ===
      "string"
    ) {
      return error.message;
    }

    return fallbackMessage;
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // =====================================================
  // GENERATE CONTENT
  // =====================================================

  const handleGenerateContent =
    async () => {
      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Enter a campaign brief in the Campaign Content field first."
        );

        return;
      }

      try {
        setLoadingAI(true);

        const response =
          await aiService.generateContent(
            {
              brief:
                formData.content,

              campaign_type:
                campaignType,

              audience:
                aiAudience,

              tone: tone,
            }
          );

        setFormData(
          (prev) => ({
            ...prev,
            content:
              response?.content ||
              "",
          })
        );

        toast.success(
          "AI content generated successfully!"
        );
      } catch (error) {
        console.error(
          "Generate content error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "AI content generation failed."
          )
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // =====================================================
  // PERSONALIZE
  // =====================================================

  const handlePersonalize =
    async () => {
      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Generate or enter campaign content first."
        );

        return;
      }

      try {
        setLoadingAI(true);

        const response =
          await aiService.personalize(
            {
              content:
                formData.content,

              audience:
                aiAudience,

              tone: tone,
            }
          );

        setFormData(
          (prev) => ({
            ...prev,
            content:
              response?.content ||
              "",
          })
        );

        toast.success(
          "Content personalized successfully!"
        );
      } catch (error) {
        console.error(
          "Personalization error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Personalization failed."
          )
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // =====================================================
  // TONE CHECK
  // =====================================================

  const handleToneCheck =
    async () => {
      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Enter campaign content first."
        );

        return;
      }

      try {
        setLoadingAI(true);

        const response =
          await aiService.toneCheck(
            {
              content:
                formData.content,
            }
          );

        setToneResult(
          response?.analysis ||
            ""
        );

        toast.success(
          "Tone analysis completed!"
        );
      } catch (error) {
        console.error(
          "Tone check error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Tone check failed."
          )
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // =====================================================
  // TRANSLATION
  // =====================================================

  const handleTranslate =
    async () => {
      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Enter campaign content first."
        );

        return;
      }

      try {
        setLoadingAI(true);

        const requestData = {
          content:
            formData.content,

          target_language:
            translationLanguage,
        };

        const response =
          await aiService.translate(
            requestData
          );

        setTranslatedContent(
          response?.content ||
            ""
        );

        toast.success(
          `${translationLanguage} translation completed!`
        );
      } catch (error) {
        console.error(
          "Translation error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Translation failed."
          )
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // =====================================================
  // USE TRANSLATION
  // =====================================================

  const handleUseTranslation =
    () => {
      if (!translatedContent) {
        toast.error(
          "Translate the content first."
        );

        return;
      }

      setFormData(
        (prev) => ({
          ...prev,
          content:
            translatedContent,
        })
      );

      toast.success(
        "Translated content applied to campaign!"
      );
    };

  // =====================================================
  // COMPLIANCE
  // =====================================================

  const handleComplianceCheck =
    async () => {
      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Enter campaign content first."
        );

        return;
      }

      try {
        setLoadingAI(true);

        const response =
          await aiService.complianceCheck(
            {
              content:
                formData.content,
            }
          );

        setComplianceResult(
          response?.analysis ||
            ""
        );

        toast.success(
          "Compliance check completed!"
        );
      } catch (error) {
        console.error(
          "Compliance error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Compliance check failed."
          )
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // =====================================================
  // MULTI-CHANNEL SEND
  // =====================================================

  const handleMultiChannelSend = async () => {
    const campaignId =
      savedCampaignId || parentSavedCampaignId;

    if (!campaignId) {
      toast.error("Please save the campaign first.");
      return;
    }

    if (!selectedChannels.length) {
      toast.error("Select at least one communication channel.");
      return;
    }

    const missing = selectedChannels.filter(
      (item) =>
        item !== "web_broadcast" &&
        !String(channelRecipients[item] || "").trim()
    );

    if (missing.length) {
      toast.error(
        `Enter a recipient for: ${missing
          .map((item) => item.replace("_", " "))
          .join(", ")}`
      );
      return;
    }

    try {
      const response = await channelService.sendMultiChannel({
        campaign_id: campaignId,
        channels: selectedChannels,
        recipients: channelRecipients,
        subject: formData.subject,
        content: formData.content,
      });

      const successCount =
        response?.results?.filter(
          (item) => item.status === "Sent"
        ).length || 0;

      if (successCount === selectedChannels.length) {
        toast.success("All selected channels sent successfully.");
      } else if (successCount > 0) {
        toast.success(
          `${successCount}/${selectedChannels.length} channels sent successfully.`
        );
      } else {
        toast.error("All selected channels failed. Check delivery logs.");
      }
    } catch (error) {
      console.error("Multi-channel delivery error:", error);
      toast.error(
        error?.response?.data?.detail ||
        "Multi-channel delivery failed."
      );
    }
  };

  // =====================================================
  // SAVE CAMPAIGN
  // =====================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      // -----------------------------------------------
      // CAMPAIGN NAME
      // -----------------------------------------------

      if (
        !formData.campaign_name.trim()
      ) {
        toast.error(
          "Campaign name is required."
        );

        return;
      }

      // -----------------------------------------------
      // SUBJECT
      // -----------------------------------------------

      if (
        !formData.subject.trim()
      ) {
        toast.error(
          "Campaign subject is required."
        );

        return;
      }

      // -----------------------------------------------
      // CONTENT
      // -----------------------------------------------

      if (
        !formData.content.trim()
      ) {
        toast.error(
          "Campaign content is required."
        );

        return;
      }

      // -----------------------------------------------
      // AUDIENCE
      // -----------------------------------------------

      if (
        !formData.audience_id
      ) {
        toast.error(
          "Please select an audience."
        );

        return;
      }

      const audienceId =
        Number(
          formData.audience_id
        );

      // Prevent invalid values such as 0,
      // NaN or negative IDs.
      if (
        !Number.isInteger(
          audienceId
        ) ||
        audienceId <= 0
      ) {
        toast.error(
          "Please select a valid audience."
        );

        return;
      }

      // -----------------------------------------------
      // SCHEDULED CAMPAIGN VALIDATION
      // -----------------------------------------------

      if (formData.status === "Scheduled") {
        if (!formData.schedule_time) {
          toast.error("Select a schedule date and time.");
          return;
        }

        const missingRecipients = selectedChannels.filter(
          (item) =>
            item !== "web_broadcast" &&
            !String(channelRecipients[item] || "").trim()
        );

        if (missingRecipients.length) {
          toast.error(
            `Add recipient(s) for: ${missingRecipients
              .map((item) => item.replace("_", " "))
              .join(", ")}`
          );
          return;
        }
      }

      // -----------------------------------------------
      // FINAL PAYLOAD
      // -----------------------------------------------

      const campaignData = {
        campaign_name:
          formData.campaign_name.trim(),

        campaign_type:
          String(formData.campaign_type || campaignType).trim() || "Announcement",

        channels:
          selectedChannels.length
            ? selectedChannels
            : ["email"],

        subject:
          formData.subject.trim(),

        content:
          formData.content.trim(),

        audience_id:
          audienceId,

        schedule_time:
          formData.schedule_time &&
          formData.schedule_time.trim() !== ""
            ? formData.schedule_time
            : null,

        schedule_frequency:
          formData.schedule_frequency ||
          "one_time",

        recipients:
          channelRecipients,

        status:
          formData.status ||
          "Draft",
      };

      console.log(
        "FINAL CAMPAIGN PAYLOAD:",
        campaignData
      );

      try {
        const savedCampaign = await onSave(campaignData);

if (savedCampaign?.id) {
  setSavedCampaignId(savedCampaign.id);
}
      } catch (error) {
        console.error(
          "Campaign save error:",
          error
        );

        toast.error(
          getErrorMessage(
            error,
            "Unable to save campaign."
          )
        );
      }
    };

  // =====================================================
  // UI HELPERS
  // =====================================================

  const inputClass = `
    w-full
    rounded-xl
    border border-slate-200
    bg-white
    px-4 py-3
    text-sm text-slate-800
    placeholder:text-slate-400
    shadow-sm
    outline-none
    transition
    focus:border-blue-500
    focus:ring-4
    focus:ring-blue-50
  `;

  const selectClass = `
    w-full
    rounded-xl
    border border-slate-200
    bg-white
    px-4 py-3
    text-sm text-slate-800
    shadow-sm
    outline-none
    transition
    focus:border-blue-500
    focus:ring-4
    focus:ring-blue-50
  `;

  const actionButton = `
    inline-flex
    items-center
    justify-center
    gap-2
    rounded-xl
    px-4
    py-2.5
    text-sm
    font-semibold
    transition
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-slate-950/60
        p-4
        sm:p-6
        overflow-y-auto
      "
    >

      {/* =================================================
          MODAL CONTAINER
      ================================================= */}

      <div
        className="
          flex
          w-full
          max-w-6xl
          max-h-[calc(100vh-32px)]
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-slate-200
            bg-white
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              px-6
              py-5
              lg:px-8
            "
          >

            <div className="flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  text-blue-600
                "
              >
                📣
              </div>

              <div>

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-blue-600
                  "
                >
                  Campaign Management
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-slate-900
                    lg:text-2xl
                  "
                >
                  {initialData
                    ? "Edit Campaign"
                    : "Create Campaign"}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Build, optimize and
                  validate your campaign.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-2xl
                text-slate-500
                transition
                hover:bg-red-50
                hover:text-red-600
              "
            >
              ×
            </button>

          </div>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >

          {/* =================================================
              SCROLLABLE CONTENT
          ================================================= */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
            "
          >

            <div
              className="
                space-y-7
                p-6
                lg:p-8
              "
            >

              {/* =================================================
                  SECTION 1 - CAMPAIGN DETAILS
              ================================================= */}

              <section>

                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      font-bold
                      text-blue-600
                    "
                  >
                    1
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-slate-900
                      "
                    >
                      Campaign Details
                    </h3>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Enter the basic information
                      for your campaign.
                    </p>

                  </div>

                </div>

                <div
                  className="
                    grid
                    grid-cols-1
                    gap-5
                    md:grid-cols-2
                  "
                >

                  {/* Campaign Name */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Campaign Name

                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      name="campaign_name"
                      value={
                        formData.campaign_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Monsoon Safety Awareness"
                      className={
                        inputClass
                      }
                      required
                    />

                  </div>

                  {/* Subject */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Subject

                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      name="subject"
                      value={
                        formData.subject
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter campaign subject"
                      className={
                        inputClass
                      }
                      required
                    />

                  </div>

                  {/* Audience */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Audience

                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      name="audience_id"
                      value={
                        formData.audience_id
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        selectClass
                      }
                      required
                    >

                      <option value="">
                        Select Audience
                      </option>

                      {audiences.map(
                        (audience) => (
                          <option
                            key={
                              audience.id
                            }
                            value={
                              audience.id
                            }
                          >
                            {audience.name ||
                              audience.audience_name ||
                              `Audience #${audience.id}`}
                          </option>
                        )
                      )}

                    </select>

                    {audiences.length ===
                      0 && (
                      <p
                        className="
                          mt-1.5
                          text-xs
                          text-red-500
                        "
                      >
                        No audiences available.
                        Create an audience first.
                      </p>
                    )}

                  </div>

                  {/* Schedule */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Schedule Time
                    </label>

                    <input
                      type="datetime-local"
                      name="schedule_time"
                      value={
                        formData.schedule_time
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
                    />

                    <p
                      className="
                        mt-1.5
                        text-xs
                        text-slate-400
                      "
                    >
                      Required when status is Scheduled.
                    </p>

                  </div>

                  {/* Frequency */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Frequency
                    </label>

                    <select
                      name="schedule_frequency"
                      value={formData.schedule_frequency}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="one_time">One Time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>

                    <p
                      className="
                        mt-1.5
                        text-xs
                        text-slate-400
                      "
                    >
                      Recurring campaigns automatically schedule the next run.
                    </p>

                  </div>

                  {/* Status */}

                  <div className="md:col-span-2">

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Campaign Status
                    </label>

                    <select
  name="status"
  value={formData.status}
  onChange={handleChange}
  className={selectClass}
>
  <option value="Draft">
    Draft
  </option>

  <option value="Pending Review">
    Pending Review
  </option>

  <option value="Approved">
    Approved
  </option>

  <option value="Scheduled">
    Scheduled
  </option>

  <option value="Sending">
    Sending
  </option>

  <option value="Completed">
    Completed
  </option>
</select>

                  </div>

                </div>

                <div className="mt-6">
                  <MultiChannelSelector
                    value={selectedChannels}
                    onChange={(channels) =>
                      setFormData((previous) => ({
                        ...previous,
                        channels,
                      }))
                    }
                    disabled={loadingAI}
                  />
                </div>

              </section>

              {/* =================================================
                  SECTION 2 - CAMPAIGN CONTENT
              ================================================= */}

              <section>

                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-50
                      font-bold
                      text-violet-600
                    "
                  >
                    2
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-slate-900
                      "
                    >
                      Campaign Content
                    </h3>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Write your brief or let AI
                      transform it into a campaign
                      message.
                    </p>

                  </div>

                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                  "
                >

                  <textarea
                    name="content"
                    value={
                      formData.content
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Create a public awareness message about staying safe during heavy rainfall and flooding..."
                    rows={7}
                    className="
                      w-full
                      resize-y
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-slate-800
                      placeholder:text-slate-400
                      outline-none
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-50
                    "
                    required
                  />

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <p className="text-xs text-slate-400">
                      {
                        formData.content
                          .length
                      }{" "}
                      characters
                    </p>

                    <span className="text-xs text-slate-400">
                      AI tools can improve this
                      content below
                    </span>

                  </div>

                </div>

              </section>

              {/* =================================================
                  SECTION 3 - AI ASSISTANT
              ================================================= */}

              <section
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-violet-200
                  bg-gradient-to-br
                  from-violet-50
                  via-white
                  to-blue-50
                "
              >

                <div
                  className="
                    border-b
                    border-violet-100
                    px-6
                    py-5
                  "
                >

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-violet-600
                        text-xl
                        text-white
                        shadow-lg
                        shadow-violet-200
                      "
                    >
                      ✨
                    </div>

                    <div>

                      <h3
                        className="
                          text-lg
                          font-bold
                          text-slate-900
                        "
                      >
                        AI Content Assistant
                      </h3>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-slate-500
                        "
                      >
                        Generate and optimize
                        campaign content using AI.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="p-6">

                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-4
                      md:grid-cols-3
                    "
                  >

                    {/* Campaign Type */}

                    <div>

                      <label
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >
                        Campaign Type
                      </label>

                      <select
                        value={
                          campaignType
                        }
                        onChange={(e) => {
                          setCampaignType(e.target.value);
                          setFormData((previous) => ({
                            ...previous,
                            campaign_type: e.target.value,
                          }));
                        }}
                        className={
                          selectClass
                        }
                      >

                        <option value="announcement">
                          Announcement
                        </option>

                        <option value="awareness">
                          Awareness
                        </option>

                        <option value="alert">
                          Alert
                        </option>

                        <option value="notification">
                          Notification
                        </option>

                      </select>

                    </div>

                    {/* Target Audience */}

                    <div>

                      <label
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >
                        Target Audience
                      </label>

                      <select
                        value={
                          aiAudience
                        }
                        onChange={(e) =>
                          setAiAudience(
                            e.target.value
                          )
                        }
                        className={
                          selectClass
                        }
                      >

                        <option value="general public">
                          General Public
                        </option>

                        <option value="students">
                          Students
                        </option>

                        <option value="professionals">
                          Professionals
                        </option>

                        <option value="senior citizens">
                          Senior Citizens
                        </option>

                      </select>

                    </div>

                    {/* Tone */}

                    <div>

                      <label
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >
                        Tone
                      </label>

                      <select
                        value={tone}
                        onChange={(e) =>
                          setTone(
                            e.target.value
                          )
                        }
                        className={
                          selectClass
                        }
                      >

                        <option value="professional">
                          Professional
                        </option>

                        <option value="friendly">
                          Friendly
                        </option>

                        <option value="formal">
                          Formal
                        </option>

                        <option value="urgent">
                          Urgent
                        </option>

                        <option value="reassuring">
                          Reassuring
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* Generate */}

                  <button
                    type="button"
                    onClick={
                      handleGenerateContent
                    }
                    disabled={
                      loadingAI
                    }
                    className={`${actionButton}
                      mt-5
                      w-full
                      bg-violet-600
                      text-white
                      shadow-sm
                      hover:bg-violet-700
                      hover:shadow-md
                    `}
                  >

                    {loadingAI ? (
                      <>
                        <span
                          className="
                            h-4
                            w-4
                            animate-spin
                            rounded-full
                            border-2
                            border-white/40
                            border-t-white
                          "
                        />

                        Processing...
                      </>
                    ) : (
                      <>
                        ✨ Generate Campaign Content
                      </>
                    )}

                  </button>

                  {/* AI Actions */}

                  <div
                    className="
                      mt-3
                      grid
                      grid-cols-1
                      gap-3
                      sm:grid-cols-3
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        handlePersonalize
                      }
                      disabled={
                        loadingAI ||
                        !formData.content
                      }
                      className={`${actionButton}
                        bg-indigo-50
                        text-indigo-700
                        hover:bg-indigo-100
                      `}
                    >
                      👤 Personalize
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleToneCheck
                      }
                      disabled={
                        loadingAI ||
                        !formData.content
                      }
                      className={`${actionButton}
                        bg-blue-50
                        text-blue-700
                        hover:bg-blue-100
                      `}
                    >
                      🎯 Tone Check
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleComplianceCheck
                      }
                      disabled={
                        loadingAI ||
                        !formData.content
                      }
                      className={`${actionButton}
                        bg-emerald-50
                        text-emerald-700
                        hover:bg-emerald-100
                      `}
                    >
                      🛡️ Compliance
                    </button>

                  </div>

                </div>

              </section>

              {/* =================================================
                  TONE RESULT
              ================================================= */}

              {toneResult && (
                <section
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-blue-200
                    bg-blue-50/70
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      border-b
                      border-blue-100
                      px-5
                      py-4
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-600
                        text-white
                      "
                    >
                      🎯
                    </div>

                    <div>

                      <h3
                        className="
                          font-bold
                          text-blue-900
                        "
                      >
                        Tone Analysis
                      </h3>

                      <p className="text-xs text-blue-600">
                        AI analysis of your campaign
                        tone
                      </p>

                    </div>

                  </div>

                  <pre
                    className="
                      overflow-x-auto
                      whitespace-pre-wrap
                      p-5
                      font-sans
                      text-sm
                      leading-6
                      text-slate-700
                    "
                  >
                    {typeof toneResult ===
                    "string"
                      ? toneResult
                      : JSON.stringify(
                          toneResult,
                          null,
                          2
                        )}
                  </pre>

                </section>
              )}

              {/* =================================================
                  COMPLIANCE RESULT
              ================================================= */}

              {complianceResult && (
                <section
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-emerald-200
                    bg-emerald-50/70
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      border-b
                      border-emerald-100
                      px-5
                      py-4
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-600
                        text-white
                      "
                    >
                      🛡️
                    </div>

                    <div>

                      <h3
                        className="
                          font-bold
                          text-emerald-900
                        "
                      >
                        Compliance Result
                      </h3>

                      <p className="text-xs text-emerald-600">
                        Campaign compliance analysis
                      </p>

                    </div>

                  </div>

                  <pre
                    className="
                      overflow-x-auto
                      whitespace-pre-wrap
                      p-5
                      font-sans
                      text-sm
                      leading-6
                      text-slate-700
                    "
                  >
                    {typeof complianceResult ===
                    "string"
                      ? complianceResult
                      : JSON.stringify(
                          complianceResult,
                          null,
                          2
                        )}
                  </pre>

                </section>
              )}

              {/* =================================================
                  TRANSLATION
              ================================================= */}

              <section
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-orange-200
                  bg-orange-50/60
                "
              >

                <div
                  className="
                    border-b
                    border-orange-100
                    px-6
                    py-5
                  "
                >

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        bg-orange-500
                        text-xl
                        text-white
                      "
                    >
                      🌐
                    </div>

                    <div>

                      <h3 className="font-bold text-slate-900">
                        Multilingual Translation
                      </h3>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-slate-500
                        "
                      >
                        Translate your campaign
                        into another language.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="p-6">

                  <div
                    className="
                      flex
                      flex-col
                      gap-3
                      sm:flex-row
                    "
                  >

                    <select
                      value={
                        translationLanguage
                      }
                      onChange={(e) =>
                        setTranslationLanguage(
                          e.target.value
                        )
                      }
                      className={`${selectClass} sm:flex-1`}
                    >

                      <option value="telugu">
                        Telugu
                      </option>

                      <option value="hindi">
                        Hindi
                      </option>

                      <option value="tamil">
                        Tamil
                      </option>

                      <option value="kannada">
                        Kannada
                      </option>

                      <option value="malayalam">
                        Malayalam
                      </option>

                      <option value="english">
                        English
                      </option>

                    </select>

                    <button
                      type="button"
                      onClick={
                        handleTranslate
                      }
                      disabled={
                        loadingAI ||
                        !formData.content
                      }
                      className={`${actionButton}
                        bg-orange-500
                        text-white
                        hover:bg-orange-600
                        sm:w-40
                      `}
                    >
                      🌐 Translate
                    </button>

                  </div>

                  {translatedContent && (
                    <div className="mt-5">

                      <div
                        className="
                          mb-2
                          flex
                          items-center
                          justify-between
                        "
                      >

                        <label
                          className="
                            text-sm
                            font-bold
                            text-slate-700
                          "
                        >
                          Translated Content
                        </label>

                        <span
                          className="
                            text-xs
                            font-medium
                            text-orange-600
                          "
                        >
                          {
                            translationLanguage
                          }
                        </span>

                      </div>

                      <textarea
                        value={
                          translatedContent
                        }
                        onChange={(e) =>
                          setTranslatedContent(
                            e.target.value
                          )
                        }
                        rows={7}
                        className="
                          w-full
                          resize-y
                          rounded-xl
                          border
                          border-orange-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-slate-700
                          outline-none
                          focus:ring-4
                          focus:ring-orange-100
                        "
                      />

                      <button
                        type="button"
                        onClick={
                          handleUseTranslation
                        }
                        className={`${actionButton}
                          mt-3
                          bg-orange-600
                          text-white
                          hover:bg-orange-700
                        `}
                      >
                        ✓ Use Translation in Campaign
                      </button>

                    </div>
                  )}

                </div>

              </section>

              {/* =================================================
                  MULTI-CHANNEL DELIVERY TEST
              ================================================= */}

              <section
                className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white"
              >
                <div className="border-b border-blue-100 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
                      📡
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Multi-Channel Distribution</h3>
                      <p className="mt-1 text-sm text-slate-500">Send this campaign through the selected communication channels.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Selected channels</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedChannels.length ? selectedChannels.map((item) => (
                        <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                          {item.replace("_", " ")}
                        </span>
                      )) : <span className="text-xs text-slate-400">No channels selected.</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {selectedChannels.filter((item) => item !== "web_broadcast").map((item) => (
                      <div key={item}>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          {item === "push" ? "FCM token" : `${item.replace("_", " ")} recipient`}
                        </label>
                        <input
                          value={channelRecipients[item] || ""}
                          onChange={(event) => setChannelRecipients((previous) => ({ ...previous, [item]: event.target.value }))}
                          placeholder={item === "email" ? "recipient@example.com" : item === "push" ? "FCM registration token" : "+919876543210"}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  {selectedChannels.includes("web_broadcast") && (
                    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
                      Web Broadcast sends the campaign to connected SmartNotify web clients through WebSocket.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleMultiChannelSend}
                    disabled={loadingAI || !formData.content.trim() || !selectedChannels.length}
                    className={`${actionButton} mt-5 w-full bg-blue-600 text-white hover:bg-blue-700`}
                  >
                    🚀 Send Through Selected Channels
                  </button>
                </div>
              </section>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="
              shrink-0
              border-t
              border-slate-200
              bg-white
              px-6
              py-4
              lg:px-8
            "
          >

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                {initialData
                  ? "Changes will update the existing campaign."
                  : "Save this campaign when you are ready."}
              </p>

              <div
                className="
                  flex
                  justify-end
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loadingAI ||
                    audiences.length ===
                      0
                  }
                  className="
                    rounded-xl
                    bg-blue-600
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-700
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {initialData
                    ? "✓ Update Campaign"
                    : "✓ Save Campaign"}
                </button>

              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}