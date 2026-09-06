import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

function App() {
  // =====================================================
  // PAGE
  // =====================================================

  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // =====================================================
  // EMAIL
  // =====================================================

  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [emails, setEmails] = useState([]);
  const [manualEmails, setManualEmails] = useState("");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // =====================================================
  // LOGIN
  // =====================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("bulkmail_token")
  );

  const [username, setUsername] = useState(
    localStorage.getItem("bulkmail_username") || ""
  );

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // =====================================================
  // TOAST
  // =====================================================

  const [toast, setToast] = useState({
    show: false,
    type: "",
    text: "",
  });

  const fileInputRef = useRef(null);

  // =====================================================
  // API
  // =====================================================

  const API_URL = "";

  // =====================================================
  // TOAST
  // =====================================================

  function showToast(type, text) {
    setToast({
      show: true,
      type,
      text,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "",
        text: "",
      });
    }, 3000);
  }

  // =====================================================
  // GET TOKEN
  // =====================================================

  function getToken() {
    return localStorage.getItem("bulkmail_token");
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin(event) {
    event.preventDefault();

    if (!loginUsername.trim() || !loginPassword.trim()) {
      showToast("warn", "Please enter username and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: loginUsername.trim(),
        password: loginPassword,
      });

      const token = response.data.token;

      if (!token) {
        showToast("err", "Login failed. Token not received.");
        return;
      }

      const loggedInUsername =
        response.data.username || loginUsername.trim();

      localStorage.setItem("bulkmail_token", token);
      localStorage.setItem(
        "bulkmail_username",
        loggedInUsername
      );

      setIsLoggedIn(true);
      setUsername(loggedInUsername);

      setLoginUsername("");
      setLoginPassword("");

      showToast("ok", "Login successful.");
    } catch (error) {
      console.error("Login error:", error);

      showToast(
        "err",
        error.response?.data?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    localStorage.removeItem("bulkmail_token");
    localStorage.removeItem("bulkmail_username");

    setIsLoggedIn(false);
    setUsername("");

    setPage("dashboard");
    setMobileMenu(false);

    showToast("ok", "Logged out successfully.");
  }

  // =====================================================
  // AUTH ERROR
  // =====================================================

  function handleAuthError(error) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("bulkmail_token");
      localStorage.removeItem("bulkmail_username");

      setIsLoggedIn(false);
      setUsername("");

      showToast(
        "err",
        "Session expired. Please login again."
      );

      return true;
    }

    return false;
  }

  // =====================================================
  // FETCH LOGS
  // =====================================================

  async function fetchLogs() {
    const token = getToken();

    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);

      if (!handleAuthError(error)) {
        showToast(
          "err",
          "Unable to load logs. Check your backend server."
        );
      }
    }
  }

  // =====================================================
  // LOAD LOGS AFTER LOGIN
  // =====================================================

  useEffect(() => {
    if (isLoggedIn) {
      fetchLogs();
    }
  }, [isLoggedIn]);

  // =====================================================
  // MESSAGE
  // =====================================================

  function handleMessage(event) {
    setMsg(event.target.value);
  }

  // =====================================================
  // MANUAL EMAILS
  // =====================================================

  function handleManualEmails(event) {
    setManualEmails(event.target.value);
  }

  // =====================================================
  // RECIPIENT LIST
  // =====================================================

  function getRecipientList() {
    const manualList = manualEmails
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const excelList = emails.map((email) =>
      String(email).trim()
    );

    const combined = [
      ...excelList,
      ...manualList,
    ];

    const uniqueEmails = [
      ...new Set(
        combined.map((email) => email.toLowerCase())
      ),
    ];

    return uniqueEmails.filter(
      (email) =>
        email.includes("@") &&
        email.includes(".")
    );
  }

  // =====================================================
  // EXCEL / CSV UPLOAD
  // =====================================================

  function handleFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = e.target.result;

        const workbook = XLSX.read(data, {
          type: "binary",
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[sheetName];

        const emailList =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              header: 1,
            }
          );

        const flatEmails = emailList
          .flat()
          .map((email) =>
            String(email).trim()
          )
          .filter(
            (email) =>
              email.includes("@") &&
              email.includes(".")
          );

        setEmails(flatEmails);

        showToast(
          "ok",
          `${flatEmails.length} recipient${
            flatEmails.length !== 1
              ? "s"
              : ""
          } loaded successfully`
        );
      } catch (error) {
        console.error(
          "File processing error:",
          error
        );

        showToast(
          "err",
          "Unable to read this file."
        );
      }
    };

    reader.readAsBinaryString(file);
  }

  // =====================================================
  // SEND EMAILS
  // =====================================================

  async function sendEmails() {
    const recipientList = getRecipientList();

    if (!subject.trim()) {
      showToast(
        "warn",
        "Please enter an email subject."
      );

      return;
    }

    if (!msg.trim()) {
      showToast(
        "warn",
        "Please enter an email message."
      );

      return;
    }

    if (recipientList.length === 0) {
      showToast(
        "warn",
        "Please add at least one recipient."
      );

      return;
    }

    const token = getToken();

    if (!token) {
      setIsLoggedIn(false);

      showToast(
        "err",
        "Please login again."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/sendemail`,
        {
          subject: subject.trim(),
          msg: msg.trim(),
          emails: recipientList,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const message =
        response.data?.message ||
        response.data ||
        "Campaign sent successfully.";

      showToast("ok", message);

      await fetchLogs();

      // Clear campaign
      setSubject("");
      setMsg("");
      setManualEmails("");
      setEmails([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setPage("logs");
      setMobileMenu(false);
    } catch (error) {
      console.error("Send error:", error);

      if (!handleAuthError(error)) {
        showToast(
          "err",
          error.response?.data?.message ||
            "Failed to send emails. Check your backend."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // CLEAR LOGS
  // =====================================================

  async function clearLogs() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all email logs?"
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLogs([]);

      showToast(
        "ok",
        "All logs cleared successfully."
      );
    } catch (error) {
      console.error(
        "Failed to clear logs:",
        error
      );

      if (!handleAuthError(error)) {
        showToast(
          "err",
          "Failed to clear logs."
        );
      }
    }
  }

  // =====================================================
  // CLEAR RECIPIENTS
  // =====================================================

  function clearRecipients() {
    setEmails([]);
    setManualEmails("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast(
      "ok",
      "Recipient list cleared."
    );
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  function navigateTo(targetPage) {
    setPage(targetPage);
    setMobileMenu(false);
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  const recipientCount =
    getRecipientList().length;

  const totalLogs = logs.length;

  const successfulLogs = logs.filter(
    (log) => log.status === "sent"
  ).length;

  const failedLogs = logs.filter(
    (log) => log.status !== "sent"
  ).length;

  const successRate =
    totalLogs > 0
      ? Math.round(
          (successfulLogs / totalLogs) * 100
        )
      : 0;

  // =====================================================
  // TOAST COLORS
  // =====================================================

  const toastStyles = {
    ok:
      "bg-emerald-500/90 border-emerald-300/30",

    warn:
      "bg-amber-500/90 border-amber-300/30",

    err:
      "bg-rose-500/90 border-rose-300/30",
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center relative overflow-hidden px-4">

        {/* Background */}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">

          <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-[120px]" />

          <div className="absolute top-[30%] -right-40 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[120px]" />

          <div className="absolute -bottom-40 left-[30%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px]" />

        </div>

        <div
          className="
            relative
            w-full
            max-w-md
            rounded-[2rem]
            border
            border-white/10
            bg-white/[0.06]
            backdrop-blur-2xl
            shadow-2xl
            p-6
            sm:p-8
          "
        >

          {/* Logo */}

          <div className="flex justify-center">

            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                flex
                items-center
                justify-center
                shadow-xl
                shadow-blue-900/40
                text-3xl
              "
            >
              ✉
            </div>

          </div>

          <div className="text-center mt-6">

            <h1 className="text-2xl sm:text-3xl font-bold">
              BulkMail
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Admin Campaign Workspace
            </p>

          </div>

          {/* Login */}

          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >

            <div>

              <label className="block text-sm font-medium mb-2">
                Username
              </label>

              <input
                type="text"
                value={loginUsername}
                onChange={(e) =>
                  setLoginUsername(e.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-black/20
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-400/30
                  focus:ring-4
                  focus:ring-blue-500/5
                "
              />

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-black/20
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-400/30
                  focus:ring-4
                  focus:ring-blue-500/5
                "
              />

            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="
                w-full
                flex
                items-center
                justify-center
                gap-3
                px-5
                py-3.5
                rounded-xl
                bg-gradient-to-r
                from-blue-500
                to-indigo-600
                font-semibold
                text-sm
                shadow-xl
                shadow-blue-950/40
                hover:from-blue-400
                hover:to-indigo-500
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >

              {loginLoading ? (
                <>
                  <span
                    className="
                      w-4
                      h-4
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                      animate-spin
                    "
                  />

                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          <div className="mt-6 text-center">

            <p className="text-xs text-slate-600">
              Secure administrator access
            </p>

          </div>

        </div>

        {/* Login Toast */}

        {toast.show && (
          <div
            className={`
              fixed
              top-5
              left-1/2
              -translate-x-1/2
              z-[100]
              w-[calc(100%-2rem)]
              max-w-md
              px-5
              py-3.5
              rounded-2xl
              border
              shadow-2xl
              backdrop-blur-xl
              text-sm
              font-semibold
              text-center
              ${toastStyles[toast.type]}
            `}
          >
            {toast.text}
          </div>
        )}

      </div>
    );
  }

  // =====================================================
  // MAIN APP
  // =====================================================

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

        <div className="absolute top-[30%] -right-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />

        <div className="absolute -bottom-40 left-[30%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

      </div>

      {/* =================================================
          TOAST
      ================================================= */}

      {toast.show && (
        <div
          className={`
            fixed
            top-5
            left-1/2
            -translate-x-1/2
            z-[100]
            w-[calc(100%-2rem)]
            max-w-md
            px-5
            py-3.5
            rounded-2xl
            border
            shadow-2xl
            backdrop-blur-xl
            text-sm
            font-semibold
            text-center
            ${toastStyles[toast.type]}
          `}
        >
          {toast.text}
        </div>
      )}

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <aside
        className="
          fixed
          left-0
          top-0
          bottom-0
          w-64
          hidden
          lg:flex
          flex-col
          border-r
          border-white/10
          bg-slate-950/70
          backdrop-blur-2xl
          z-40
        "
      >

        {/* Logo */}

        <div className="px-7 py-7">

          <div className="flex items-center gap-3">

            <div
              className="
                h-11
                w-11
                rounded-2xl
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                flex
                items-center
                justify-center
                shadow-lg
                shadow-blue-900/40
              "
            >
              ✉
            </div>

            <div>

              <h1 className="font-bold text-xl">
                BulkMail
              </h1>

              <p className="text-xs text-slate-500">
                Email Campaigns
              </p>

            </div>

          </div>

        </div>

        {/* Navigation */}

        <nav className="px-4 space-y-2">

          <button
            onClick={() => navigateTo("dashboard")}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              text-sm
              font-medium
              transition
              ${
                page === "dashboard"
                  ? "bg-blue-500/15 text-blue-300 border border-blue-400/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            onClick={() => navigateTo("logs")}
            className={`
              w-full
              flex
              items-center
              justify-between
              px-4
              py-3
              rounded-xl
              text-sm
              font-medium
              transition
              ${
                page === "logs"
                  ? "bg-blue-500/15 text-blue-300 border border-blue-400/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >

            <span className="flex items-center gap-3">

              <span>▤</span>

              Email Logs

            </span>

            <span
              className="
                text-xs
                px-2
                py-0.5
                rounded-full
                bg-white/10
                text-slate-400
              "
            >
              {logs.length}
            </span>

          </button>

        </nav>

        {/* Sidebar bottom */}

        <div className="mt-auto p-5">

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              p-4
            "
          >

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-xs text-slate-400">
                Backend connected
              </span>

            </div>

            <p className="text-xs text-slate-600 mt-2">
              MongoDB logging enabled
            </p>

          </div>

          {/* Desktop Logout */}

          <button
            onClick={handleLogout}
            className="
              w-full
              mt-3
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              rounded-xl
              border
              border-rose-400/10
              bg-rose-500/5
              text-rose-300
              text-sm
              hover:bg-rose-500/10
              transition
            "
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MOBILE MENU
      ================================================= */}

      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* Overlay */}

          <div
            className="
              absolute
              inset-0
              bg-black/70
              backdrop-blur-sm
            "
            onClick={() =>
              setMobileMenu(false)
            }
          />

          {/* Drawer */}

          <aside
            className="
              absolute
              left-0
              top-0
              bottom-0
              w-[280px]
              max-w-[85vw]
              bg-slate-950
              border-r
              border-white/10
              shadow-2xl
              p-5
              flex
              flex-col
            "
          >

            {/* Header */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-500
                    to-indigo-600
                    flex
                    items-center
                    justify-center
                  "
                >
                  ✉
                </div>

                <div>

                  <p className="font-bold">
                    BulkMail
                  </p>

                  <p className="text-xs text-slate-500">
                    Email Campaigns
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  setMobileMenu(false)
                }
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  text-slate-400
                "
              >
                ✕
              </button>

            </div>

            {/* User */}

            <div
              className="
                mt-8
                p-4
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-500/15
                    border
                    border-blue-400/10
                    flex
                    items-center
                    justify-center
                    text-blue-300
                    font-semibold
                  "
                >
                  {username
                    ? username
                        .charAt(0)
                        .toUpperCase()
                    : "A"}
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-slate-500">
                    Logged in as
                  </p>

                  <p className="text-sm font-medium truncate">
                    {username}
                  </p>

                </div>

              </div>

            </div>

            {/* Mobile navigation */}

            <nav className="mt-6 space-y-2">

              <button
                onClick={() =>
                  navigateTo("dashboard")
                }
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  ${
                    page === "dashboard"
                      ? "bg-blue-500/15 text-blue-300"
                      : "text-slate-400 hover:bg-white/5"
                  }
                `}
              >
                <span>⌂</span>
                Dashboard
              </button>

              <button
                onClick={() =>
                  navigateTo("logs")
                }
                className={`
                  w-full
                  flex
                  items-center
                  justify-between
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  ${
                    page === "logs"
                      ? "bg-blue-500/15 text-blue-300"
                      : "text-slate-400 hover:bg-white/5"
                  }
                `}
              >

                <span className="flex items-center gap-3">
                  <span>▤</span>
                  Email Logs
                </span>

                <span
                  className="
                    px-2
                    py-0.5
                    rounded-full
                    bg-white/10
                    text-xs
                  "
                >
                  {logs.length}
                </span>

              </button>

            </nav>

            {/* Bottom */}

            <div className="mt-auto">

              <div className="flex items-center gap-2 mb-4">

                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                <span className="text-xs text-slate-500">
                  System Online
                </span>

              </div>

              <button
                onClick={handleLogout}
                className="
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-rose-400/10
                  bg-rose-500/5
                  text-rose-300
                  text-sm
                  font-medium
                "
              >
                <span>↪</span>
                Logout
              </button>

            </div>

          </aside>

        </div>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="lg:ml-64 relative">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-white/10
            bg-slate-950/70
            backdrop-blur-2xl
          "
        >

          <div
            className="
              max-w-7xl
              mx-auto
              px-4
              sm:px-5
              md:px-8
              py-3
              sm:py-4
              flex
              items-center
              justify-between
              gap-3
            "
          >

            {/* Mobile left */}

            <div className="flex items-center gap-3 lg:hidden">

              <button
                onClick={() =>
                  setMobileMenu(true)
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  flex
                  items-center
                  justify-center
                  text-lg
                "
              >
                ☰
              </button>

              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-gradient-to-br
                  from-blue-500
                  to-indigo-600
                  flex
                  items-center
                  justify-center
                "
              >
                ✉
              </div>

              <span className="font-bold hidden sm:block">
                BulkMail
              </span>

            </div>

            {/* Desktop title */}

            <div className="hidden lg:block">

              <p className="text-sm text-slate-500">
                {page === "dashboard"
                  ? "Campaign Dashboard"
                  : "Email Activity"}
              </p>

              <h2 className="font-semibold text-lg">
                {page === "dashboard"
                  ? "Create a new campaign"
                  : "Email delivery logs"}
              </h2>

            </div>

            {/* Right */}

            <div className="flex items-center gap-2">

              {/* System status */}

              <div
                className="
                  hidden
                  md:flex
                  items-center
                  gap-2
                  px-3
                  lg:px-4
                  py-2
                  rounded-full
                  border
                  border-emerald-400/10
                  bg-emerald-500/5
                "
              >

                <span className="w-2 h-2 rounded-full bg-emerald-400" />

                <span className="text-xs text-emerald-300">
                  System Online
                </span>

              </div>

              {/* User */}

              <div
                className="
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                "
              >

                <div
                  className="
                    w-7
                    h-7
                    rounded-lg
                    bg-blue-500/20
                    border
                    border-blue-400/20
                    flex
                    items-center
                    justify-center
                    text-xs
                    text-blue-300
                    font-semibold
                  "
                >
                  {username
                    ? username
                        .charAt(0)
                        .toUpperCase()
                    : "A"}
                </div>

                <span className="text-xs text-slate-300 max-w-[80px] truncate">
                  {username}
                </span>

              </div>

              {/* Mobile page button */}

              <button
                onClick={() =>
                  navigateTo(
                    page === "dashboard"
                      ? "logs"
                      : "dashboard"
                  )
                }
                className="
                  lg:hidden
                  px-3
                  sm:px-4
                  py-2
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  text-xs
                  hover:bg-white/10
                  transition
                "
              >
                {page === "dashboard"
                  ? "Logs"
                  : "Dashboard"}
              </button>

              {/* Logout */}

              <button
                onClick={handleLogout}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-3
                  sm:px-4
                  py-2
                  rounded-xl
                  bg-rose-500/10
                  border
                  border-rose-400/10
                  text-rose-300
                  text-xs
                  font-medium
                  hover:bg-rose-500/20
                  transition
                "
                title="Logout"
              >

                <span>↪</span>

                <span className="hidden sm:inline">
                  Logout
                </span>

              </button>

            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-5
            md:px-8
            py-6
            sm:py-8
            md:py-10
          "
        >

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {page === "dashboard" && (
            <div className="space-y-6 sm:space-y-8">

              {/* Hero */}

              <section
                className="
                  relative
                  overflow-hidden
                  rounded-[1.5rem]
                  sm:rounded-[2rem]
                  border
                  border-white/10
                  bg-white/[0.06]
                  backdrop-blur-2xl
                  p-5
                  sm:p-7
                  md:p-10
                "
              >

                <div
                  className="
                    absolute
                    -top-32
                    -right-32
                    w-80
                    h-80
                    rounded-full
                    bg-blue-500/15
                    blur-[100px]
                  "
                />

                <div className="relative">

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-blue-400/10
                      bg-blue-500/10
                      px-3
                      sm:px-4
                      py-2
                      text-xs
                      text-blue-300
                    "
                  >
                    <span>✦</span>
                    Smart Email Campaigns
                  </div>

                  <h1
                    className="
                      mt-5
                      text-2xl
                      sm:text-3xl
                      md:text-5xl
                      font-bold
                      tracking-tight
                    "
                  >
                    Reach your audience.

                    <span
                      className="
                        block
                        bg-gradient-to-r
                        from-blue-300
                        via-indigo-300
                        to-cyan-300
                        bg-clip-text
                        text-transparent
                      "
                    >
                      One campaign at a time.
                    </span>
                  </h1>

                  <p
                    className="
                      mt-4
                      sm:mt-5
                      max-w-2xl
                      text-sm
                      md:text-base
                      leading-6
                      sm:leading-7
                      text-slate-400
                    "
                  >
                    Upload your recipient list,
                    compose your message and send
                    emails directly from your campaign
                    workspace.
                  </p>

                </div>

              </section>

              {/* Statistics */}

              <section
                className="
                  grid
                  grid-cols-2
                  lg:grid-cols-4
                  gap-3
                  sm:gap-4
                "
              >

                {/* Recipients */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.05]
                    backdrop-blur-xl
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                    Recipients
                  </p>

                  <div className="flex items-end justify-between mt-3">

                    <span className="text-2xl sm:text-3xl font-bold">
                      {recipientCount}
                    </span>

                    <span className="text-xl sm:text-2xl">
                      👥
                    </span>

                  </div>

                  <p className="hidden sm:block text-xs text-slate-600 mt-2">
                    Loaded for campaign
                  </p>

                </div>

                {/* Logs */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.05]
                    backdrop-blur-xl
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                    Total Activity
                  </p>

                  <div className="flex items-end justify-between mt-3">

                    <span className="text-2xl sm:text-3xl font-bold">
                      {totalLogs}
                    </span>

                    <span className="text-xl sm:text-2xl">
                      📊
                    </span>

                  </div>

                  <p className="hidden sm:block text-xs text-slate-600 mt-2">
                    MongoDB records
                  </p>

                </div>

                {/* Success */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.05]
                    backdrop-blur-xl
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                    Successful
                  </p>

                  <div className="flex items-end justify-between mt-3">

                    <span className="text-2xl sm:text-3xl font-bold text-emerald-300">
                      {successfulLogs}
                    </span>

                    <span className="text-xl sm:text-2xl">
                      ✓
                    </span>

                  </div>

                  <p className="hidden sm:block text-xs text-slate-600 mt-2">
                    Successfully sent
                  </p>

                </div>

                {/* Success rate */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.05]
                    backdrop-blur-xl
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                    Success Rate
                  </p>

                  <div className="flex items-end justify-between mt-3">

                    <span className="text-2xl sm:text-3xl font-bold">
                      {successRate}%
                    </span>

                    <span className="text-xl sm:text-2xl">
                      ⚡
                    </span>

                  </div>

                  <p className="hidden sm:block text-xs text-slate-600 mt-2">
                    {failedLogs} failed
                  </p>

                </div>

              </section>

              {/* =================================================
                  COMPOSE
              ================================================= */}

              <section
                className="
                  rounded-[1.5rem]
                  sm:rounded-[2rem]
                  border
                  border-white/10
                  bg-white/[0.06]
                  backdrop-blur-2xl
                  overflow-hidden
                "
              >

                {/* Header */}

                <div
                  className="
                    px-5
                    sm:px-6
                    md:px-8
                    py-5
                    sm:py-6
                    border-b
                    border-white/10
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >

                  <div>

                    <h2 className="text-lg sm:text-xl font-semibold">
                      Compose Campaign
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Prepare your email before sending
                    </p>

                  </div>

                  <div
                    className="
                      hidden
                      sm:flex
                      items-center
                      gap-2
                      text-xs
                      text-slate-500
                    "
                  >

                    <span className="w-2 h-2 bg-blue-400 rounded-full" />

                    Draft

                  </div>

                </div>

                <div className="p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-7">

                  {/* Subject */}

                  <div>

                    <label className="block text-sm font-medium mb-3">
                      Email Subject
                    </label>

                    <input
                      type="text"
                      value={subject}
                      onChange={(e) =>
                        setSubject(e.target.value)
                      }
                      placeholder="Enter email subject..."
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        px-5
                        py-3.5
                        text-sm
                        text-white
                        placeholder:text-slate-700
                        outline-none
                        focus:border-blue-400/30
                        focus:ring-4
                        focus:ring-blue-500/5
                        transition
                      "
                    />

                  </div>

                  {/* Message */}

                  <div>

                    <div className="flex justify-between mb-3">

                      <label className="text-sm font-medium">
                        Email Message
                      </label>

                      <span className="text-xs text-slate-600">
                        {msg.length} characters
                      </span>

                    </div>

                    <textarea
                      value={msg}
                      onChange={handleMessage}
                      placeholder="Write your email message here..."
                      className="
                        w-full
                        min-h-[180px]
                        sm:min-h-[220px]
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        px-5
                        py-4
                        text-sm
                        text-white
                        placeholder:text-slate-700
                        outline-none
                        resize-none
                        focus:border-blue-400/30
                        focus:ring-4
                        focus:ring-blue-500/5
                        transition
                      "
                    />

                  </div>

                  {/* Manual recipients */}

                  <div>

                    <label className="block text-sm font-medium mb-3">
                      Recipient Emails
                    </label>

                    <textarea
                      value={manualEmails}
                      onChange={handleManualEmails}
                      placeholder={`Enter email addresses separated by comma, semicolon or new line...

example@gmail.com
user@yahoo.com`}
                      className="
                        w-full
                        min-h-[130px]
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        px-5
                        py-4
                        text-sm
                        text-white
                        placeholder:text-slate-700
                        outline-none
                        resize-y
                        focus:border-blue-400/30
                        focus:ring-4
                        focus:ring-blue-500/5
                        transition
                      "
                    />

                    {manualEmails.trim() && (
                      <p className="text-xs text-slate-600 mt-2">
                        {manualEmails
                          .split(/[\n,;]+/)
                          .filter((email) =>
                            email.trim()
                          ).length}{" "}
                        manually entered recipient(s)
                      </p>
                    )}

                  </div>

                  {/* Upload */}

                  <div>

                    <label className="block text-sm font-medium mb-3">
                      Upload Recipient List
                    </label>

                    <div
                      className="
                        rounded-2xl
                        border-2
                        border-dashed
                        border-white/10
                        bg-black/10
                        p-5
                        sm:p-7
                        text-center
                        hover:border-blue-400/30
                        hover:bg-blue-500/[0.02]
                        transition
                      "
                    >

                      <div
                        className="
                          mx-auto
                          w-12
                          sm:w-14
                          h-12
                          sm:h-14
                          rounded-2xl
                          bg-blue-500/10
                          border
                          border-blue-400/10
                          flex
                          items-center
                          justify-center
                          text-xl
                          sm:text-2xl
                        "
                      >
                        📁
                      </div>

                      <h3 className="mt-4 font-medium">
                        Upload recipient file
                      </h3>

                      <p className="text-xs text-slate-600 mt-2">
                        XLSX, XLS or CSV files supported
                      </p>

                      <label
                        className="
                          inline-flex
                          items-center
                          justify-center
                          mt-5
                          px-5
                          py-2.5
                          rounded-xl
                          bg-blue-500/15
                          border
                          border-blue-400/20
                          text-blue-300
                          text-sm
                          font-medium
                          cursor-pointer
                          hover:bg-blue-500/25
                          transition
                        "
                      >

                        Choose File

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFile}
                          className="hidden"
                        />

                      </label>

                    </div>

                  </div>

                  {/* Recipient info */}

                  {recipientCount > 0 && (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-emerald-400/10
                        bg-emerald-500/[0.04]
                        p-5
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                          gap-4
                        "
                      >

                        <div className="flex items-center gap-4">

                          <div
                            className="
                              w-11
                              h-11
                              rounded-xl
                              bg-emerald-500/10
                              flex
                              items-center
                              justify-center
                              text-emerald-300
                            "
                          >
                            ✓
                          </div>

                          <div>

                            <p className="font-medium">
                              Recipient list ready
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {recipientCount} unique valid email addresses
                            </p>

                          </div>

                        </div>

                        <button
                          onClick={clearRecipients}
                          className="
                            text-xs
                            text-rose-300/70
                            hover:text-rose-300
                            self-start
                            sm:self-auto
                          "
                        >
                          Remove list
                        </button>

                      </div>

                    </div>
                  )}

                  {/* Send area */}

                  <div
                    className="
                      flex
                      flex-col
                      md:flex-row
                      md:items-center
                      md:justify-between
                      gap-5
                      pt-2
                    "
                  >

                    <div>

                      <p className="text-sm font-medium">
                        Ready to send?
                      </p>

                      <p className="text-xs text-slate-600 mt-1">
                        Your activity will be stored in MongoDB.
                      </p>

                    </div>

                    <button
                      onClick={sendEmails}
                      disabled={loading}
                      className="
                        group
                        w-full
                        md:w-auto
                        inline-flex
                        items-center
                        justify-center
                        gap-3
                        px-7
                        py-3.5
                        rounded-xl
                        bg-gradient-to-r
                        from-blue-500
                        to-indigo-600
                        font-semibold
                        text-sm
                        shadow-xl
                        shadow-blue-950/40
                        hover:from-blue-400
                        hover:to-indigo-500
                        hover:-translate-y-0.5
                        transition
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >

                      {loading ? (
                        <>
                          <span
                            className="
                              w-4
                              h-4
                              rounded-full
                              border-2
                              border-white/30
                              border-t-white
                              animate-spin
                            "
                          />

                          Sending...
                        </>
                      ) : (
                        <>
                          Send Campaign

                          <span className="group-hover:translate-x-1 transition">
                            →
                          </span>
                        </>
                      )}

                    </button>

                  </div>

                </div>

              </section>

            </div>
          )}

          {/* =================================================
              LOGS PAGE
          ================================================= */}

          {page === "logs" && (
            <div className="space-y-6 sm:space-y-7">

              {/* Log hero */}

              <section
                className="
                  rounded-[1.5rem]
                  sm:rounded-[2rem]
                  border
                  border-white/10
                  bg-white/[0.06]
                  backdrop-blur-2xl
                  p-5
                  sm:p-7
                  md:p-9
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-5
                  "
                >

                  <div>

                    <div
                      className="
                        inline-flex
                        items-center
                        gap-2
                        px-3
                        py-1.5
                        rounded-full
                        bg-blue-500/10
                        border
                        border-blue-400/10
                        text-xs
                        text-blue-300
                      "
                    >
                      ● MongoDB Activity
                    </div>

                    <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold">
                      Email Logs
                    </h1>

                    <p className="mt-3 text-sm text-slate-500 max-w-xl">
                      Every email activity returned by
                      your backend and stored in MongoDB
                      is displayed here.
                    </p>

                  </div>

                  <div className="flex gap-2 sm:gap-3">

                    <button
                      onClick={fetchLogs}
                      className="
                        flex-1
                        sm:flex-none
                        px-4
                        sm:px-5
                        py-2.5
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        text-xs
                        sm:text-sm
                        hover:bg-white/10
                        transition
                      "
                    >
                      ↻ Refresh
                    </button>

                    <button
                      onClick={clearLogs}
                      disabled={logs.length === 0}
                      className="
                        flex-1
                        sm:flex-none
                        px-4
                        sm:px-5
                        py-2.5
                        rounded-xl
                        border
                        border-rose-400/10
                        bg-rose-500/5
                        text-rose-300
                        text-xs
                        sm:text-sm
                        hover:bg-rose-500/10
                        transition
                        disabled:opacity-40
                      "
                    >
                      Clear Logs
                    </button>

                  </div>

                </div>

              </section>

              {/* Log statistics */}

              <section
                className="
                  grid
                  grid-cols-3
                  gap-3
                  sm:gap-4
                "
              >

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.05]
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[9px] sm:text-xs uppercase tracking-wider text-slate-600">
                    Total
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold mt-2">
                    {totalLogs}
                  </p>

                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-emerald-400/10
                    bg-emerald-500/[0.04]
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[9px] sm:text-xs uppercase tracking-wider text-emerald-400/60">
                    Sent
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-2">
                    {successfulLogs}
                  </p>

                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-rose-400/10
                    bg-rose-500/[0.04]
                    p-4
                    sm:p-5
                  "
                >

                  <p className="text-[9px] sm:text-xs uppercase tracking-wider text-rose-400/60">
                    Failed
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold text-rose-300 mt-2">
                    {failedLogs}
                  </p>

                </div>

              </section>

              {/* Logs */}

              <section
                className="
                  rounded-[1.5rem]
                  sm:rounded-[2rem]
                  border
                  border-white/10
                  bg-white/[0.06]
                  backdrop-blur-2xl
                  overflow-hidden
                "
              >

                <div
                  className="
                    px-5
                    sm:px-6
                    md:px-8
                    py-5
                    sm:py-6
                    border-b
                    border-white/10
                  "
                >

                  <h2 className="text-base sm:text-lg font-semibold">
                    Delivery Activity
                  </h2>

                  <p className="text-xs text-slate-600 mt-1">
                    Live records retrieved from MongoDB
                  </p>

                </div>

                {logs.length === 0 ? (

                  <div className="py-20 sm:py-24 text-center px-5">

                    <div
                      className="
                        mx-auto
                        w-16
                        h-16
                        rounded-2xl
                        bg-white/5
                        border
                        border-white/10
                        flex
                        items-center
                        justify-center
                        text-2xl
                      "
                    >
                      ✉
                    </div>

                    <h3 className="mt-5 font-medium">
                      No email activity yet
                    </h3>

                    <p className="text-xs text-slate-600 mt-2">
                      Send a campaign and the MongoDB
                      logs will appear here.
                    </p>

                    <button
                      onClick={() =>
                        navigateTo("dashboard")
                      }
                      className="
                        mt-6
                        px-5
                        py-2.5
                        rounded-xl
                        bg-blue-500/10
                        border
                        border-blue-400/10
                        text-blue-300
                        text-sm
                      "
                    >
                      Create Campaign
                    </button>

                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full text-sm min-w-[850px]">

                      <thead>

                        <tr className="border-b border-white/10">

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            #
                          </th>

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            Recipient
                          </th>

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            Subject
                          </th>

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            Message
                          </th>

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            Date & Time
                          </th>

                          <th className="text-left px-5 sm:px-6 py-4 text-xs text-slate-500 font-medium">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {logs.map(
                          (log, index) => (
                            <tr
                              key={
                                log._id ||
                                index
                              }
                              className="
                                border-b
                                border-white/5
                                hover:bg-white/[0.035]
                                transition
                              "
                            >

                              <td className="px-5 sm:px-6 py-5 text-xs text-slate-600">
                                {index + 1}
                              </td>

                              <td className="px-5 sm:px-6 py-5">

                                <div className="flex items-center gap-3">

                                  <div
                                    className="
                                      w-9
                                      h-9
                                      rounded-xl
                                      bg-blue-500/10
                                      border
                                      border-blue-400/10
                                      flex
                                      items-center
                                      justify-center
                                      text-blue-300
                                      text-xs
                                    "
                                  >
                                    @
                                  </div>

                                  <span className="text-xs font-mono text-slate-300">
                                    {log.recipient ||
                                      log.email ||
                                      "-"}
                                  </span>

                                </div>

                              </td>

                              <td className="px-5 sm:px-6 py-5">

                                <p
                                  className="
                                    max-w-[220px]
                                    truncate
                                    text-xs
                                    text-slate-400
                                  "
                                >
                                  {log.subject ||
                                    "-"}
                                </p>

                              </td>

                              <td className="px-5 sm:px-6 py-5">

                                <p
                                  className="
                                    max-w-[250px]
                                    truncate
                                    text-xs
                                    text-slate-500
                                  "
                                >
                                  {log.messagePreview ||
                                    log.message ||
                                    log.msg ||
                                    "-"}
                                </p>

                              </td>

                              <td className="px-5 sm:px-6 py-5">

                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  {formatDate(
                                    log.sentAt ||
                                      log.createdAt
                                  )}
                                </span>

                              </td>

                              <td className="px-5 sm:px-6 py-5">

                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-1.5
                                    rounded-full
                                    border
                                    text-xs
                                    font-medium
                                    ${
                                      log.status ===
                                      "sent"
                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/10"
                                        : "bg-rose-500/10 text-rose-300 border-rose-400/10"
                                    }
                                  `}
                                >

                                  <span
                                    className={`
                                      w-1.5
                                      h-1.5
                                      rounded-full
                                      ${
                                        log.status ===
                                        "sent"
                                          ? "bg-emerald-400"
                                          : "bg-rose-400"
                                      }
                                    `}
                                  />

                                  {log.status ||
                                    "unknown"}

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

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default App;