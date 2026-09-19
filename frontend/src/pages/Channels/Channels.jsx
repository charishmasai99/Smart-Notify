import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

import {
  Bell,
  CheckCircle2,
  Globe2,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
  Smartphone,
  Wifi,
  XCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import channelService from "../../services/channelService";

import {
  connectWebBroadcast,
  disconnectWebBroadcast,
} from "../../services/notificationService";


// ============================================================
// CHANNEL ICONS
// ============================================================

const iconMap = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageCircle,
  push: Bell,
  web_broadcast: Globe2,
};


// ============================================================
// CHANNELS PAGE
// ============================================================

export default function Channels() {
  const { currentUser } = useAuth();
  const isCommunicationTeam = currentUser?.role === "Communication Team";

  // ==========================================================
  // STATE
  // ==========================================================

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [testing, setTesting] =
    useState(null);

  const [recipient, setRecipient] =
    useState({});

  const [content, setContent] =
    useState(
      "SmartNotify channel integration test — your communication channel is working."
    );

  const [subject, setSubject] =
    useState(
      "SmartNotify Channel Test"
    );

  const [liveMessages, setLiveMessages] =
    useState([]);


  // ==========================================================
  // LOAD CHANNEL CONFIGURATION
  // ==========================================================

  const load = async (
    initial = false
  ) => {

    try {

      if (initial) {

        setLoading(true);

      } else {

        setRefreshing(true);

      }


      const response =
        await channelService.getChannels();


      setData(response);

    } catch (error) {

      toast.error(
        error?.response?.data?.detail ||
          "Unable to load channel configuration."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD + WEB BROADCAST
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    // ========================================================
    // LOAD CHANNEL DATA
    // ========================================================

    channelService
      .getChannels()
      .then((response) => {

        if (!cancelled) {

          setData(response);

        }

      })
      .catch((error) => {

        if (!cancelled) {

          toast.error(
            error?.response?.data?.detail ||
              "Unable to load channel configuration."
          );

        }

      })
      .finally(() => {

        if (!cancelled) {

          setLoading(false);

        }

      });


    // ========================================================
    // WEB BROADCAST MESSAGE HANDLER
    // ========================================================

    const handleBroadcast =
      (message) => {

        if (cancelled) {

          return;

        }


        console.log(
          "📢 Channels received SmartNotify Web Broadcast:",
          message
        );


        setLiveMessages(
          (items) => {

            return [
              message,
              ...items,
            ].slice(
              0,
              8
            );

          }
        );

      };


    // ========================================================
    // CONNECT USING CENTRAL WEBSOCKET SERVICE
    // ========================================================

    connectWebBroadcast(
      handleBroadcast
    );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

  cancelled = true;

  disconnectWebBroadcast(
    handleBroadcast
  );

};

  }, []);


  // ==========================================================
  // CHANNEL DATA
  // ==========================================================

  const channels =
    data?.channels ?? [];


  const configuredCount =
    channels.filter(
      (item) =>
        item.configured
    ).length;


  // ==========================================================
  // TEST CHANNEL
  // ==========================================================

  const test = async (
    channel
  ) => {

    setTesting(channel);


    try {

      // ======================================================
      // WEB BROADCAST
      // ======================================================

      if (
        channel ===
        "web_broadcast"
      ) {

        await channelService.broadcast(
          {
            subject,
            content,
          }
        );

      }

      // ======================================================
      // OTHER CHANNELS
      // ======================================================

      else {

        const value =
          (
            recipient[channel] ||
            ""
          ).trim();


        if (!value) {

          toast.error(
            channel === "push"
              ? "Enter an FCM token."
              : "Enter a recipient first."
          );

          return;

        }


        await channelService.testChannel(
          {
            channel,
            recipient: value,
            content,
            subject,
          }
        );

      }


      // ======================================================
      // SUCCESS
      // ======================================================

      toast.success(
        `${
          channels.find(
            (item) =>
              item.id === channel
          )?.name ||
          channel
        } test completed.`
      );


      // ======================================================
      // REFRESH CHANNEL DATA
      // ======================================================

      await load();

    } catch (error) {

      toast.error(
        error?.response?.data?.detail ||
          "Channel test failed."
      );

    } finally {

      setTesting(null);

    }

  };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <div className="sn-page">

        <div className="sn-loading">

          <div
            className="sn-spinner"
          />

          <p>
            Loading communication
            channels...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (

    <div className="sn-page">


      {/* ====================================================
          PAGE HEADER
          ==================================================== */}

      <div className="sn-page-header">

        <div>

          <div className="sn-eyebrow">
            MILESTONE 3 · MODULE 1
          </div>


          <h1 className="sn-page-title">
            Multi-Channel Integration
          </h1>


          <p className="sn-page-subtitle">
            Connect, configure and test
            Email, SMS, WhatsApp, Push
            Notification and Web Broadcast
            delivery.
          </p>

        </div>


        <button
          className="sn-secondary-add"
          type="button"
          onClick={() =>
            load()
          }
          disabled={refreshing}
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>


      {/* ====================================================
          KPI CARDS
          ==================================================== */}

      <div className="sn-kpi-grid">


        {/* ==================================================
            AVAILABLE CHANNELS
            ================================================== */}

        <div
          className="
            sn-kpi-card
            sn-kpi-blue
          "
        >

          <div
            className="sn-kpi-label"
          >
            Available Channels
          </div>


          <div
            className="sn-kpi-value"
          >
            5
          </div>


          <div
            className="sn-kpi-icon"
          >

            <Send
              size={23}
            />

          </div>

        </div>


        {/* ==================================================
            CONFIGURED
            ================================================== */}

        <div
          className="
            sn-kpi-card
            sn-kpi-green
          "
        >

          <div
            className="sn-kpi-label"
          >
            Configured
          </div>


          <div
            className="sn-kpi-value"
          >
            {configuredCount}
          </div>


          <div
            className="sn-kpi-icon"
          >

            <CheckCircle2
              size={23}
            />

          </div>

        </div>


        {/* ==================================================
            WEB CLIENTS
            ================================================== */}

        <div
          className="
            sn-kpi-card
            sn-kpi-purple
          "
        >

          <div
            className="sn-kpi-label"
          >
            Web Clients
          </div>


          <div
            className="sn-kpi-value"
          >
            {
              data?.active_web_connections ??
              0
            }
          </div>


          <div
            className="sn-kpi-icon"
          >

            <Wifi
              size={23}
            />

          </div>

        </div>


        {/* ==================================================
            MODULE
            ================================================== */}

        <div
          className="
            sn-kpi-card
            sn-kpi-orange
          "
        >

          <div
            className="sn-kpi-label"
          >
            Module
          </div>


          <div
            className="sn-kpi-value"
          >
            1
          </div>


          <div
            className="sn-kpi-icon"
          >

            <Globe2
              size={23}
            />

          </div>

        </div>

      </div>


      {/* ====================================================
          CHANNEL CONFIGURATION
          ==================================================== */}

      <div
        className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
        "
      >

        <div
          className="
            mb-5
            flex
            items-start
            justify-between
            gap-4
          "
        >

          <div>

            <h2
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              Channel Configuration
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Provider credentials stay
              on the backend; only safe
              configuration status is exposed.
            </p>

          </div>


          <div
            className="
              rounded-full
              bg-slate-100
              px-3
              py-1
              text-xs
              font-semibold
              text-slate-600
            "
          >

            {configuredCount}/5 ready

          </div>

        </div>


        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-5
          "
        >

          {channels.map(
            (channel) => {

              const Icon =
                iconMap[
                  channel.id
                ] || Send;


              return (

                <div
                  key={
                    channel.id
                  }
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                  "
                >

                  <div
                    className="
                      mb-4
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <span
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        shadow-sm
                      "
                    >

                      <Icon
                        size={20}
                      />

                    </span>


                    {channel.configured ? (

                      <CheckCircle2
                        className="
                          text-emerald-600
                        "
                        size={20}
                      />

                    ) : (

                      <XCircle
                        className="
                          text-slate-300
                        "
                        size={20}
                      />

                    )}

                  </div>


                  <h3
                    className="
                      font-bold
                      text-slate-900
                    "
                  >
                    {channel.name}
                  </h3>


                  <p
                    className={`
                      mt-1
                      text-xs
                      font-semibold
                      ${
                        channel.configured
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    `}
                  >

                    {channel.configured
                      ? "Configured"
                      : "Needs configuration"}

                  </p>


                  <button
                    type="button"
                    onClick={() =>
                      test(
                        channel.id
                      )
                    }
                    disabled={
                      !isCommunicationTeam ||
                      testing ===
                        channel.id ||
                      !channel.configured
                    }
                    style={{
                      display: isCommunicationTeam ? undefined : "none",
                    }}
                    className="
                      mt-4
                      inline-flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-slate-900
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >

                    <Send
                      size={14}
                    />

                    {
                      testing ===
                      channel.id
                        ? "Testing..."
                        : "Test Channel"
                    }

                  </button>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/* ====================================================
          TEST CONSOLE + LIVE BROADCAST
          ==================================================== */}

      <div
        className="
          grid
          gap-6
          xl:grid-cols-[1.2fr_0.8fr]
        "
      >


        {/* ==================================================
            CHANNEL TEST CONSOLE
            ================================================== */}

        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >

          <h2
            className="
              text-lg
              font-bold
              text-slate-900
            "
          >
            Channel Test Console
          </h2>


          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Use a real recipient/token
            to validate each configured
            gateway.
          </p>


          <div
            className="
              mt-5
              grid
              gap-4
              md:grid-cols-2
            "
          >


            {/* ==============================================
                SUBJECT
                ============================================== */}

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
                Subject
              </label>


              <input
                value={
                  subject
                }
                onChange={
                  (e) =>
                    setSubject(
                      e.target.value
                    )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                "
              />

            </div>


            {/* ==============================================
                RECIPIENT
                ============================================== */}

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
                Email / Phone / FCM Token
              </label>


              <input
                value={
                  recipient.email ||
                  ""
                }
                onChange={
                  (e) =>
                    setRecipient(
                      (v) => ({
                        ...v,

                        email:
                          e.target.value,

                        sms:
                          e.target.value,

                        whatsapp:
                          e.target.value,

                        push:
                          e.target.value,

                      })
                    )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                "
                placeholder="
                  recipient@example.com
                  or +919...
                "
              />

            </div>


            {/* ==============================================
                TEST MESSAGE
                ============================================== */}

            <div
              className="
                md:col-span-2
              "
            >

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
                Test Message
              </label>


              <textarea
                value={
                  content
                }
                onChange={
                  (e) =>
                    setContent(
                      e.target.value
                    )
                }
                rows={4}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                "
              />

            </div>

          </div>


          {/* ==================================================
              TEST BUTTONS
              ================================================== */}

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
            "
          >

            {channels
              .filter(
                (item) =>
                  item.configured
              )
              .map(
                (item) => (

                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      test(
                        item.id
                      )
                    }
                    disabled={
                      !isCommunicationTeam ||
                      testing ===
                      item.id
                    }
                    style={{
                      display: isCommunicationTeam ? undefined : "none",
                    }}
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-slate-700
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >

                    Test{" "}
                    {item.name}

                  </button>

                )
              )}

          </div>

        </div>


        {/* ==================================================
            LIVE WEB BROADCAST
            ================================================== */}

        <div
          className="
            rounded-3xl
            border
            border-violet-100
            bg-violet-50/50
            p-6
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Globe2
              size={21}
              className="
                text-violet-700
              "
            />


            <h2
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              Live Web Broadcast
            </h2>

          </div>


          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Connected SmartNotify web
            clients receive broadcast
            events instantly over WebSocket.
          </p>


          {/* =================================================
              ACTIVE CONNECTIONS
              ================================================= */}

          <div
            className="
              mt-5
              rounded-2xl
              border
              border-violet-100
              bg-white
              p-4
            "
          >

            <div
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Active connections
            </div>


            <div
              className="
                mt-1
                text-3xl
                font-black
                text-violet-700
              "
            >

              {
                data?.active_web_connections ??
                0
              }

            </div>

          </div>


          {/* =================================================
              LIVE MESSAGES
              ================================================= */}

          <div
            className="
              mt-4
              max-h-52
              space-y-2
              overflow-auto
            "
          >

            {liveMessages.length === 0 ? (

              <p
                className="
                  rounded-xl
                  bg-white
                  p-4
                  text-xs
                  text-slate-400
                "
              >
                Waiting for a web
                broadcast...
              </p>

            ) : (

              liveMessages.map(
                (
                  message,
                  index
                ) => (

                  <div
                    key={`
                      ${
                        message.timestamp ||
                        "msg"
                      }-${index}
                    `}
                    className="
                      rounded-xl
                      bg-white
                      p-3
                      text-xs
                      text-slate-600
                    "
                  >

                    <strong>
                      {
                        message.title ||
                        message.subject ||
                        "SmartNotify"
                      }
                    </strong>


                    <div
                      className="
                        mt-1
                      "
                    >

                      {
                        message.content ||
                        message.message ||
                        "Broadcast received"
                      }

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </div>

  );

}