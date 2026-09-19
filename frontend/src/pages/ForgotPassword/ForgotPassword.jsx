import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

import { toast } from "react-hot-toast";

import authService from "../../services/authService";


export default function ForgotPassword() {

  const navigate = useNavigate();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {

      toast.error(
        "Please enter your email address."
      );

      return;
    }

    try {

      setLoading(true);

      await authService.forgotPassword(
        normalizedEmail
      );

      setSubmitted(true);

      toast.success(
        "If an account exists, a reset email has been sent."
      );

    } catch (error) {

      console.error(
        "Forgot password failed:",
        error?.response?.data ||
          error?.message
      );

      /*
       * Deliberately use the same message whether
       * the email exists or not.
       *
       * This prevents account enumeration.
       */

      setSubmitted(true);

      toast.success(
        "If an account exists, a reset email has been sent."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  if (submitted) {

    return (

      <div className="
        min-h-screen
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-blue-950
        flex
        items-center
        justify-center
        px-5
      ">

        <div className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-white/10
          bg-white/[0.06]
          backdrop-blur-xl
          shadow-2xl
          p-8
          text-center
        ">

          <div className="
            mx-auto
            mb-6
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-emerald-500/15
            text-emerald-400
          ">

            <CheckCircle
              className="h-8 w-8"
            />

          </div>


          <h1 className="
            text-2xl
            font-bold
            text-white
          ">

            Check your email

          </h1>


          <p className="
            mt-3
            text-sm
            leading-6
            text-slate-400
          ">

            If an account exists for

            <span className="
              mx-1
              font-semibold
              text-slate-200
            ">

              {email}

            </span>

            , you'll receive a password
            reset link shortly.

          </p>


          <div className="
            mt-6
            rounded-2xl
            border
            border-blue-400/10
            bg-blue-400/5
            p-4
            text-left
          ">

            <div className="
              flex
              gap-3
            ">

              <ShieldCheck
                className="
                  mt-0.5
                  h-5
                  w-5
                  shrink-0
                  text-blue-400
                "
              />

              <p className="
                text-xs
                leading-5
                text-slate-400
              ">

                For your security, reset links
                expire after 30 minutes.

              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="
              mt-7
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              px-5
              py-3.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-500
            "
          >

            <ArrowLeft
              className="h-4 w-4"
            />

            Back to Sign In

          </button>

        </div>

      </div>

    );
  }


  // ============================================================
  // FORM
  // ============================================================

  return (

    <div className="
      min-h-screen
      bg-gradient-to-br
      from-slate-950
      via-slate-900
      to-blue-950
      flex
      items-center
      justify-center
      px-5
    ">

      <div className="
        w-full
        max-w-md
        rounded-3xl
        border
        border-white/10
        bg-white/[0.06]
        backdrop-blur-xl
        shadow-2xl
        p-8
      ">

        <Link
          to="/"
          className="
            inline-flex
            items-center
            gap-2
            text-xs
            font-medium
            text-slate-400
            hover:text-white
          "
        >

          <ArrowLeft
            className="h-4 w-4"
          />

          Back to Sign In

        </Link>


        <div className="
          mt-8
          mb-8
        ">

          <div className="
            mb-5
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-blue-600/15
            text-blue-400
          ">

            <ShieldCheck
              className="h-7 w-7"
            />

          </div>


          <h1 className="
            text-3xl
            font-bold
            text-white
          ">

            Forgot password?

          </h1>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-400
          ">

            Enter your account email and
            we'll send you a secure link
            to reset your password.

          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            ">

              Email address

            </label>


            <div className="relative">

              <Mail className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-slate-500
              " />


              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/70
                  py-3.5
                  pl-12
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

          </div>


          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-xl
              bg-blue-600
              py-3.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-blue-600/20
              transition
              hover:bg-blue-500
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {loading
              ? "SENDING..."
              : "SEND RESET LINK"
            }

          </button>

        </form>

      </div>

    </div>

  );
}