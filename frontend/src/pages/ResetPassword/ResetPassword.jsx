import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import { toast } from "react-hot-toast";

import authService from "../../services/authService";


export default function ResetPassword() {

  const navigate = useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const token = useMemo(
    () =>
      searchParams.get(
        "token"
      ) || "",
    [searchParams]
  );


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    completed,
    setCompleted,
  ] = useState(false);


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    if (!token) {

      toast.error(
        "This password reset link is invalid."
      );

      return;
    }


    if (password.length < 8) {

      toast.error(
        "Password must contain at least 8 characters."
      );

      return;
    }


    if (password !== confirmPassword) {

      toast.error(
        "Passwords do not match."
      );

      return;
    }


    try {

      setLoading(true);

      await authService.resetPassword(
        token,
        password,
        confirmPassword
      );

      setCompleted(true);

      toast.success(
        "Password reset successfully."
      );

    } catch (error) {

      console.error(
        "Reset password failed:",
        error?.response?.data ||
          error?.message
      );

      const detail =
        error?.response?.data?.detail;

      toast.error(
        typeof detail === "string"
          ? detail
          : "This reset link is invalid or expired."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // SUCCESS
  // ============================================================

  if (completed) {

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
          p-8
          text-center
          shadow-2xl
          backdrop-blur-xl
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

            Password updated

          </h1>


          <p className="
            mt-3
            text-sm
            leading-6
            text-slate-400
          ">

            Your SmartNotify password has
            been changed successfully.

          </p>


          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="
              mt-7
              w-full
              rounded-xl
              bg-blue-600
              py-3.5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-blue-500
            "
          >

            SIGN IN

          </button>

        </div>

      </div>

    );
  }


  // ============================================================
  // INVALID TOKEN
  // ============================================================

  if (!token) {

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
          border-red-500/20
          bg-white/[0.06]
          p-8
          text-center
          shadow-2xl
          backdrop-blur-xl
        ">

          <h1 className="
            text-2xl
            font-bold
            text-white
          ">

            Invalid reset link

          </h1>


          <p className="
            mt-3
            text-sm
            text-slate-400
          ">

            The password reset link is
            missing or invalid.

          </p>


          <Link
            to="/forgot-password"
            className="
              mt-7
              block
              rounded-xl
              bg-blue-600
              py-3.5
              text-sm
              font-bold
              text-white
              hover:bg-blue-500
            "
          >

            REQUEST A NEW LINK

          </Link>

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
        p-8
        shadow-2xl
        backdrop-blur-xl
      ">

        <Link
          to="/"
          className="
            inline-flex
            items-center
            gap-2
            text-xs
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

            Create new password

          </h1>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-400
          ">

            Choose a new password for
            your SmartNotify account.

          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* PASSWORD */}

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

              New password

            </label>


            <div className="relative">

              <Lock className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-slate-500
              " />


              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Enter new password"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/70
                  py-3.5
                  pl-12
                  pr-12
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                  hover:text-white
                "
              >

                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}

              </button>

            </div>

          </div>


          {/* CONFIRM */}

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

              Confirm password

            </label>


            <div className="relative">

              <Lock className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-slate-500
              " />


              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirm-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Confirm new password"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/70
                  py-3.5
                  pl-12
                  pr-12
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />


              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                  hover:text-white
                "
              >

                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}

              </button>

            </div>

          </div>


          <div className="
            rounded-xl
            border
            border-blue-400/10
            bg-blue-400/5
            px-4
            py-3
            text-xs
            leading-5
            text-slate-400
          ">

            Password must contain at least
            8 characters.

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
              ? "UPDATING PASSWORD..."
              : "UPDATE PASSWORD"
            }

          </button>

        </form>

      </div>

    </div>

  );
}