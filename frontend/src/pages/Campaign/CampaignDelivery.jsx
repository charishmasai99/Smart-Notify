import { useState } from "react";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Bell,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import api from "../../config/apiConfig";

export default function CampaignDelivery({
  campaign,
  onClose,
  onSuccess,
}) {
  const [channel, setChannel] = useState("email");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  if (!campaign) {
    return null;
  }

  const channels = [
    {
      id: "email",
      label: "Email",
      icon: Mail,
      description: "Send a real email",
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      description: "Send a real SMS",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: Smartphone,
      description: "WhatsApp delivery",
    },
    {
      id: "push",
      label: "Push",
      icon: Bell,
      description: "Browser push notification",
    },
  ];

  const getRecipientPlaceholder = () => {
    if (channel === "email") {
      return "user@example.com";
    }

    return "+919876543210";
  };

  const validateRecipient = () => {
    if (!recipient.trim()) {
      toast.error("Please enter a recipient.");
      return false;
    }

    if (channel === "email") {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(recipient.trim())) {
        toast.error(
          "Please enter a valid email address."
        );

        return false;
      }
    }

    if (
      channel === "sms" ||
      channel === "whatsapp"
    ) {
      const phoneRegex =
        /^\+?[1-9]\d{9,14}$/;

      if (!phoneRegex.test(recipient.trim())) {
        toast.error(
          "Please enter a valid phone number with country code."
        );

        return false;
      }
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateRecipient()) {
      return;
    }

    if (!campaign.id) {
      toast.error(
        "Campaign must be saved before sending."
      );

      return;
    }

    if (!campaign.content?.trim()) {
      toast.error(
        "Campaign content is empty."
      );

      return;
    }

    try {
      setLoading(true);

      let response;

      // =====================================================
      // REAL EMAIL
      // =====================================================

      if (channel === "email") {
  response = await api.post(
    "/ai/send-email",
    {
      campaign_id: campaign.id,
      recipient: recipient.trim(),
      subject:
        campaign.subject ||
        "SmartNotify Campaign",
      content: campaign.content,
    }
  );
}

      // =====================================================
      // REAL SMS
      // =====================================================

      else if (channel === "sms") {
  response = await api.post(
    "/ai/send-sms",
    {
      campaign_id: campaign.id,
      recipient: recipient.trim(),
      content: campaign.content,
    }
  );
}

      // =====================================================
      // WHATSAPP
      // =====================================================

      else if (channel === "whatsapp") {
  response = await api.post(
    "/ai/send-whatsapp",
    {
      campaign_id: campaign.id,
      recipient: recipient.trim(),
      content: campaign.content,
    }
  );
}

      // =====================================================
      // PUSH
      // =====================================================

      else if (channel === "push") {
        toast.error(
          "Push delivery should use the registered FCM audience tokens. Direct recipient sending is not configured here yet."
        );

        return;
      }

      if (response?.data?.success) {
        toast.success(
          response.data.message ||
            `${channel} sent successfully.`
        );

        if (onSuccess) {
          onSuccess(response.data);
        }

        onClose();
      } else {
        toast.error(
          response?.data?.message ||
            "Delivery failed."
        );
      }
    } catch (error) {
      console.error(
        "CAMPAIGN DELIVERY ERROR:",
        error.response?.data ||
          error.message
      );

      const detail =
        error.response?.data?.detail;

      toast.error(
        detail ||
          "Message could not be sent."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="campaign-delivery-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="campaign-delivery-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="campaign-delivery-header">

          <div>
            <div className="campaign-delivery-eyebrow">
              CAMPAIGN DELIVERY
            </div>

            <h2>
              Send Campaign
            </h2>

            <p>
              Choose a delivery channel and
              send this campaign.
            </p>
          </div>

          <button
            type="button"
            className="campaign-delivery-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="campaign-delivery-body">

          {/* CAMPAIGN SUMMARY */}

          <div className="campaign-delivery-summary">

            <strong>
              {campaign.campaign_name ||
                "Untitled Campaign"}
            </strong>

            <span>
              {campaign.subject ||
                "No subject"}
            </span>

            <span>
              {campaign.content ||
                "No campaign content"}
            </span>

          </div>

          {/* CHANNEL */}

          <label>
            Delivery Channel
          </label>

          <div className="campaign-channel-grid">

            {channels.map(
              ({
                id,
                label,
                icon: Icon,
                
              }) => (
                <button
                  key={id}
                  type="button"
                  disabled={loading}
                  className={`campaign-channel-card ${
                    channel === id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setChannel(id);
                    setRecipient("");
                  }}
                >

                  <Icon size={18} />

                  <span>
                    {label}
                  </span>

                  {channel === id && (
                    <span className="campaign-channel-check">
                      ✓
                    </span>
                  )}

                </button>
              )
            )}

          </div>

          {/* RECIPIENT */}

          <div className="campaign-recipient-grid">

            <div>

              <label>
                Recipient
              </label>

              <input
                type={
                  channel === "email"
                    ? "email"
                    : "tel"
                }
                value={recipient}
                onChange={(event) =>
                  setRecipient(
                    event.target.value
                  )
                }
                placeholder={
                  getRecipientPlaceholder()
                }
                disabled={loading}
              />

            </div>

            <div className="campaign-delivery-info">

              <label>
                Selected Channel
              </label>

              <div className="campaign-selected-channel">
                {channel === "email" && (
                  <>
                    <Mail size={16} />
                    Email
                  </>
                )}

                {channel === "sms" && (
                  <>
                    <MessageSquare size={16} />
                    SMS
                  </>
                )}

                {channel === "whatsapp" && (
                  <>
                    <Smartphone size={16} />
                    WhatsApp
                  </>
                )}

                {channel === "push" && (
                  <>
                    <Bell size={16} />
                    Push Notification
                  </>
                )}
              </div>

            </div>

          </div>

          {/* WARNING */}

          {channel === "whatsapp" && (
            <div className="campaign-delivery-warning">
              WhatsApp delivery is currently not
              connected to a real WhatsApp provider.
              Do not use this option for production
              delivery yet.
            </div>
          )}

          {channel === "push" && (
            <div className="campaign-delivery-warning">
              Push notifications use Firebase FCM
              registration tokens and are not sent
              to a manually entered phone/email.
            </div>
          )}

          {channel === "email" && (
            <div className="campaign-delivery-success">
              <CheckCircle2 size={16} />
              This uses the real email delivery
              endpoint.
            </div>
          )}

          {channel === "sms" && (
            <div className="campaign-delivery-success">
              <CheckCircle2 size={16} />
              This uses the real Twilio SMS delivery
              endpoint.
            </div>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="campaign-delivery-footer">

          <button
            type="button"
            className="campaign-delivery-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="campaign-delivery-send"
            onClick={handleSend}
            disabled={loading}
          >

            {loading ? (
              <>
                <Loader2
                  size={16}
                  className="campaign-delivery-spinner"
                />

                Sending...
              </>
            ) : (
              <>
                <Send size={16} />

                {channel === "email"
                  ? "Send Email"
                  : channel === "sms"
                  ? "Send SMS"
                  : channel === "whatsapp"
                  ? "Send WhatsApp"
                  : "Send Push"}
              </>
            )}

          </button>

        </div>

      </div>
    </div>
  );
}