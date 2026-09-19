import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users as UsersIcon,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import userService from "../../services/userService";


// ============================================================
// HELPERS
// ============================================================

const normalizeUsers = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


const normalizeRole = (role) => {
  if (!role) {
    return "User";
  }

  return String(role)
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};


const getInitials = (name, email) => {
  const source = String(name || email || "User").trim();

  if (!source) {
    return "U";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};


const getRoleStyle = (role) => {
  const normalized = String(role || "User").toLowerCase();

  if (
    normalized.includes("admin") ||
    normalized.includes("administrator")
  ) {
    return {
      badge: "bg-violet-50 text-violet-700 ring-violet-200",
      icon: ShieldCheck,
      iconClass: "text-violet-600",
    };
  }

  if (
    normalized.includes("communication") ||
    normalized.includes("team")
  ) {
    return {
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
      icon: UsersIcon,
      iconClass: "text-blue-600",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: User,
    iconClass: "text-slate-500",
  };
};


const getAvatarStyle = (index) => {
  const styles = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
    "bg-rose-100 text-rose-700",
  ];

  return styles[index % styles.length];
};


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const getCreatedDate = (user) => {
  return (
    user?.created_at ||
    user?.createdAt ||
    user?.joined_at ||
    user?.registered_at ||
    user?.date_joined ||
    null
  );
};


const isUserActive = (user) => {
  if (typeof user?.is_active === "boolean") {
    return user.is_active;
  }

  if (typeof user?.isActive === "boolean") {
    return user.isActive;
  }

  if (typeof user?.active === "boolean") {
    return user.active;
  }

  if (typeof user?.status === "string") {
    return user.status.toLowerCase() === "active";
  }

  return true;
};


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}) {
  const toneClasses = {
    blue: {
      wrapper: "bg-blue-50 text-blue-600",
      accent: "bg-blue-500",
    },
    violet: {
      wrapper: "bg-violet-50 text-violet-600",
      accent: "bg-violet-500",
    },
    emerald: {
      wrapper: "bg-emerald-50 text-emerald-600",
      accent: "bg-emerald-500",
    },
    amber: {
      wrapper: "bg-amber-50 text-amber-600",
      accent: "bg-amber-500",
    },
  };

  const selected = toneClasses[tone] || toneClasses.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${selected.accent}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#07152f]">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected.wrapper}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}


// ============================================================
// ROLE BADGE
// ============================================================

function RoleBadge({ role }) {
  const normalized = normalizeRole(role);
  const style = getRoleStyle(normalized);
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${style.badge}`}
    >
      <Icon size={12} className={style.iconClass} />
      {normalized}
    </span>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}


// ============================================================
// USER AVATAR
// ============================================================

function UserAvatar({ user, index, large = false }) {
  return (
    <div
      className={`
        flex shrink-0 items-center justify-center rounded-2xl font-extrabold
        ${large ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"}
        ${getAvatarStyle(index)}
      `}
    >
      {getInitials(user?.name, user?.email)}
    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyUsers({ onAddUser, hasFilters }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <UsersIcon size={28} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {hasFilters ? "No users match your filters" : "No users yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing the search text or role filter to find the users you are looking for."
          : "Create your first SmartNotify user to start managing access and communication roles."}
      </p>

      {!hasFilters && (
        <button
          type="button"
          onClick={onAddUser}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Add first user
        </button>
      )}
    </div>
  );
}


// ============================================================
// USER FORM
// ============================================================

function UserForm({
  form,
  editingUser,
  saving,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">

        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 md:px-7">
          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {editingUser ? (
                <Edit3 size={20} />
              ) : (
                <UserCheck size={20} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#07152f]">
                {editingUser ? "Edit User" : "Create User"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {editingUser
                  ? "Update account details and permissions."
                  : "Add a new SmartNotify account."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>


        {/* Modal body */}
        <form onSubmit={onSubmit} className="p-6 md:p-7">

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-bold text-blue-900">
                  Account access
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Assign the appropriate SmartNotify role. Password is only
                  required when creating a new account.
                </p>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Name */}
            <div>
              <label
                htmlFor="user-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full name
              </label>

              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="user-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Enter full name"
                />
              </div>
            </div>


            {/* Email */}
            <div>
              <label
                htmlFor="user-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="user-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="name@example.com"
                />
              </div>
            </div>


            {/* Password */}
            <div>
              <label
                htmlFor="user-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="user-password"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required={!editingUser}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                placeholder={
                  editingUser
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
              />

              {editingUser && (
                <p className="mt-2 text-xs text-slate-400">
                  Leave blank if the password should remain unchanged.
                </p>
              )}
            </div>


            {/* Role */}
            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Role
              </label>

              <div className="relative">
                <select
                  id="user-role"
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="User">
                    User
                  </option>

                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Communication Team">
                    Communication Team
                  </option>
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

          </div>


          {/* Role preview */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Selected access level
            </p>

            <div className="mt-3 flex items-center gap-3">
              <RoleBadge role={form.role} />

              <span className="text-xs text-slate-500">
                {form.role === "Admin"
                  ? "Administrative account with elevated management access."
                  : form.role === "Communication Team"
                    ? "Communication-focused account for campaign operations."
                    : "Standard SmartNotify user account."}
              </span>
            </div>

          </div>


          {/* Actions */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {editingUser ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check size={17} />
                  {editingUser ? "Update User" : "Create User"}
                </>
              )}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


// ============================================================
// MOBILE USER CARD
// ============================================================

function MobileUserCard({
  user,
  index,
  onEdit,
  onDelete,
}) {
  const active = isUserActive(user);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            user={user}
            index={index}
          />

          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">
              {user.name || "Unnamed user"}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {user.email || "No email"}
            </p>
          </div>
        </div>

        <StatusBadge active={active} />

      </div>


      <div className="mt-5 grid grid-cols-2 gap-3">

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            User ID
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            #{user.id}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Role
          </p>

          <div className="mt-1">
            <RoleBadge role={user.role} />
          </div>
        </div>

      </div>


      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Joined
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {formatDate(getCreatedDate(user))}
          </p>
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() => onEdit(user)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
          >
            <Edit3 size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(user.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 size={14} />
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// MAIN USERS PAGE
// ============================================================

export default function Users() {

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  const [sortBy, setSortBy] = useState("name");

  const [openMenu, setOpenMenu] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
  });


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    let ignore = false;

    const fetchUsers = async () => {

      try {

        const data = await userService.getAll();

        if (!ignore) {

          setUsers(normalizeUsers(data));

          setLoading(false);

        }

      } catch (requestError) {

        console.error(
          "LOAD USERS ERROR:",
          requestError
        );

        if (!ignore) {

          setError(
            requestError?.response?.data?.detail ||
            "Failed to load users"
          );

          setLoading(false);

        }

      }

    };

    fetchUsers();

    return () => {
      ignore = true;
    };

  }, []);


  // ==========================================================
  // RELOAD USERS
  // ==========================================================

  const loadUsers = async () => {

    try {

      setError("");

      const data =
        await userService.getAll();

      setUsers(
        normalizeUsers(data)
      );

    } catch (requestError) {

      console.error(
        "RELOAD USERS ERROR:",
        requestError
      );

      setError(
        requestError?.response?.data?.detail ||
        "Failed to load users"
      );

    }

  };


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {

    if (refreshing) {
      return;
    }

    try {

      setRefreshing(true);

      setError("");

      await loadUsers();

    } finally {

      setRefreshing(false);

    }

  };


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {

    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });

  };


  // ==========================================================
  // OPEN ADD FORM
  // ==========================================================

  const openAddForm = () => {

    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "User",
    });

    setError("");

    setShowForm(true);

  };


  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  const openEditForm = (user) => {

    console.log(
      "Editing user:",
      user
    );

    setEditingUser(user);

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "User",
    });

    setError("");

    setOpenMenu(null);

    setShowForm(true);

  };


  // ==========================================================
  // CREATE / UPDATE USER
  // ==========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);

      setError("");

      // ========================================================
      // UPDATE
      // ========================================================

      if (editingUser) {

        const updateData = {
          name: form.name,
          email: form.email,
          role: form.role,
        };

        if (form.password.trim() !== "") {

          updateData.password =
            form.password;

        }

        console.log(
          "Updating user ID:",
          editingUser.id
        );

        console.log(
          "Update data:",
          updateData
        );

        await userService.update(
          editingUser.id,
          updateData
        );

        alert(
          "User updated successfully!"
        );

      }

      // ========================================================
      // CREATE
      // ========================================================

      else {

        const createData = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        };

        console.log(
          "Creating user:",
          createData
        );

        await userService.create(
          createData
        );

        alert(
          "User created successfully!"
        );

      }


      // ========================================================
      // RESET
      // ========================================================

      setShowForm(false);

      setEditingUser(null);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "User",
      });

      await loadUsers();

    } catch (requestError) {

      console.error(
        "USER SAVE ERROR:",
        requestError
      );

      console.error(
        "SERVER RESPONSE:",
        requestError?.response?.data
      );

      setError(
        requestError?.response?.data?.detail ||
        "Failed to save user"
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(id);

      setError("");

      await userService.delete(id);

      alert(
        "User deleted successfully!"
      );

      await loadUsers();

    } catch (requestError) {

      console.error(
        "DELETE USER ERROR:",
        requestError
      );

      console.error(
        "SERVER RESPONSE:",
        requestError?.response?.data
      );

      setError(
        requestError?.response?.data?.detail ||
        "Failed to delete user"
      );

    } finally {

      setDeletingId(null);

      setOpenMenu(null);

    }

  };


  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "User",
    });

  };


  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const stats = useMemo(() => {

    const total =
      users.length;

    const active =
      users.filter(
        (user) =>
          isUserActive(user)
      ).length;

    const admins =
      users.filter(
        (user) =>
          String(
            user?.role || ""
          )
            .toLowerCase()
            .includes("admin")
      ).length;

    const communicationTeam =
      users.filter(
        (user) =>
          String(
            user?.role || ""
          )
            .toLowerCase()
            .includes("communication")
      ).length;

    const inactive =
      Math.max(
        total - active,
        0
      );

    return {
      total,
      active,
      admins,
      communicationTeam,
      inactive,
    };

  }, [users]);


  // ==========================================================
  // FILTER + SEARCH + SORT
  // ==========================================================

  const filteredUsers = useMemo(() => {

    const search =
      searchTerm
        .trim()
        .toLowerCase();

    const result =
      users.filter((user) => {

        const name =
          String(
            user?.name || ""
          ).toLowerCase();

        const email =
          String(
            user?.email || ""
          ).toLowerCase();

        const role =
          String(
            user?.role || "User"
          ).toLowerCase();

        const matchesSearch =
          !search ||
          name.includes(search) ||
          email.includes(search) ||
          role.includes(search) ||
          String(user?.id || "").includes(search);

        const matchesRole =
          roleFilter === "all" ||
          role === roleFilter.toLowerCase();

        const active =
          isUserActive(user);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && active) ||
          (statusFilter === "inactive" && !active);

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );

      });


    return result.sort((a, b) => {

      if (sortBy === "id") {
        return (
          Number(a?.id || 0) -
          Number(b?.id || 0)
        );
      }

      if (sortBy === "role") {
        return String(
          a?.role || ""
        ).localeCompare(
          String(
            b?.role || ""
          )
        );
      }

      if (sortBy === "email") {
        return String(
          a?.email || ""
        ).localeCompare(
          String(
            b?.email || ""
          )
        );
      }

      if (sortBy === "newest") {

        const aDate =
          new Date(
            getCreatedDate(a) ||
            0
          ).getTime();

        const bDate =
          new Date(
            getCreatedDate(b) ||
            0
          ).getTime();

        return bDate - aDate;

      }

      return String(
        a?.name ||
        a?.email ||
        ""
      ).localeCompare(
        String(
          b?.name ||
          b?.email ||
          ""
        )
      );

    });

  }, [
    users,
    searchTerm,
    roleFilter,
    statusFilter,
    sortBy,
  ]);


  const hasFilters =
    Boolean(
      searchTerm ||
      roleFilter !== "all" ||
      statusFilter !== "all"
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="min-h-full bg-[#f5f8fc] px-5 py-7 md:px-8 lg:px-10">

        <div className="mx-auto max-w-[1500px]">

          <div className="mb-8">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {[
              1,
              2,
              3,
              4,
            ].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}

          </div>

          <div className="mt-6 h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />

        </div>

      </div>

    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="min-h-full bg-[#f5f8fc] px-5 py-7 md:px-8 lg:px-10">

      <div className="mx-auto max-w-[1500px]">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              <UsersIcon size={14} />
              Administration
            </div>

            <div className="flex items-center gap-4">

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 sm:flex">
                <UsersIcon size={23} />
              </div>

              <div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[#07152f] md:text-4xl">
                  User Management
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Manage SmartNotify accounts, roles and access from one
                  centralized workspace.
                </p>

              </div>

            </div>

          </div>


          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>


            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >

              <Plus size={18} />

              Add User

            </button>

          </div>

        </div>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">

            <XCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-bold">
                User management error
              </p>

              <p className="mt-0.5 text-xs">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-rose-500 hover:bg-rose-100"
            >
              <X size={16} />
            </button>

          </div>

        )}


        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={UsersIcon}
            label="Total Users"
            value={stats.total}
            helper="All registered accounts"
            tone="blue"
          />

          <StatCard
            icon={UserCheck}
            label="Active Users"
            value={stats.active}
            helper="Currently active accounts"
            tone="emerald"
          />

          <StatCard
            icon={ShieldCheck}
            label="Administrators"
            value={stats.admins}
            helper="Accounts with admin role"
            tone="violet"
          />

          <StatCard
            icon={Activity}
            label="Communication Team"
            value={stats.communicationTeam}
            helper={`${stats.inactive} inactive account${stats.inactive === 1 ? "" : "s"}`}
            tone="amber"
          />

        </div>


        {/* ====================================================
            QUICK OVERVIEW
        ==================================================== */}

        <section className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">

            <div className="relative overflow-hidden bg-[#07152f] p-6 text-white md:p-7">

              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-2xl" />
              <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />

              <div className="relative">

                <div className="flex items-start justify-between gap-5">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                      Workspace overview
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                      Your user base at a glance
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                      Keep account ownership and communication access organized
                      as your SmartNotify workspace grows.
                    </p>

                  </div>

                  <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-white/10 sm:flex">
                    <Shield size={20} className="text-blue-300" />
                  </div>

                </div>


                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-medium text-slate-400">
                      Total
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {stats.total}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-medium text-slate-400">
                      Active
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {stats.active}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-medium text-slate-400">
                      Admins
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {stats.admins}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-medium text-slate-400">
                      Inactive
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {stats.inactive}
                    </p>
                  </div>

                </div>

              </div>

            </div>


            <div className="p-6 md:p-7">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Account health
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[#07152f]">
                    Active account ratio
                  </h3>

                </div>

                <CheckCircle2
                  size={20}
                  className="text-emerald-500"
                />

              </div>


              <div className="mt-6 flex items-end justify-between gap-4">

                <div>

                  <p className="text-4xl font-extrabold tracking-tight text-[#07152f]">
                    {stats.total > 0
                      ? `${((stats.active / stats.total) * 100).toFixed(0)}%`
                      : "0%"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Active accounts
                  </p>

                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">
                    {stats.active} / {stats.total}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    healthy accounts
                  </p>
                </div>

              </div>


              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${
                      stats.total > 0
                        ? Math.min(
                            100,
                            (stats.active / stats.total) * 100
                          )
                        : 0
                    }%`,
                  }}
                />

              </div>


              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock3 size={14} />
                  Account status
                </div>

                <span className="text-xs font-bold text-slate-700">
                  {stats.inactive} inactive
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            USERS WORKSPACE
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Workspace header */}
          <div className="border-b border-slate-100 px-5 py-5 md:px-7">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UsersIcon size={19} />
                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-[#07152f]">
                      All Users
                    </h2>

                    <p className="text-xs text-slate-500">
                      Showing {filteredUsers.length} of {users.length} account
                      {users.length === 1 ? "" : "s"}
                    </p>

                  </div>

                </div>

              </div>


              <div className="flex flex-col gap-3 sm:flex-row">

                {/* Search */}
                <div className="relative min-w-0 sm:w-[320px]">

                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search name, email or ID..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />

                </div>


                {/* Role filter */}
                <div className="relative">

                  <select
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(
                        event.target.value
                      )
                    }
                    className="h-11 min-w-[150px] appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="all">
                      All roles
                    </option>

                    <option value="user">
                      User
                    </option>

                    <option value="admin">
                      Admin
                    </option>

                    <option value="communication team">
                      Communication Team
                    </option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

            </div>


            {/* Filter row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

              <div className="flex flex-wrap items-center gap-2">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status
                </span>

                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(value)
                    }
                    className={`
                      rounded-lg px-3 py-1.5 text-xs font-bold transition
                      ${
                        statusFilter === value
                          ? "bg-[#07152f] text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}

                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <X size={13} />
                    Clear filters
                  </button>
                )}

              </div>


              <div className="flex items-center gap-2">

                <span className="hidden text-xs font-medium text-slate-400 sm:block">
                  Sort by
                </span>

                <div className="relative">

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value
                      )
                    }
                    className="h-9 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500"
                  >
                    <option value="name">
                      Name
                    </option>

                    <option value="newest">
                      Newest
                    </option>

                    <option value="id">
                      User ID
                    </option>

                    <option value="email">
                      Email
                    </option>

                    <option value="role">
                      Role
                    </option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              MOBILE CARDS
          ================================================== */}

          <div className="grid gap-4 bg-slate-50/50 p-4 md:hidden">

            {filteredUsers.length === 0 ? (

              <div className="rounded-2xl border border-slate-200 bg-white">
                <EmptyUsers
                  onAddUser={openAddForm}
                  hasFilters={hasFilters}
                />
              </div>

            ) : (

              filteredUsers.map(
                (user, index) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    index={index}
                    onEdit={openEditForm}
                    onDelete={handleDelete}
                  />
                )
              )

            )}

          </div>


          {/* ==================================================
              DESKTOP TABLE
          ================================================== */}

          <div className="hidden overflow-x-auto md:block">

            {filteredUsers.length === 0 ? (

              <EmptyUsers
                onAddUser={openAddForm}
                hasFilters={hasFilters}
              />

            ) : (

              <table className="w-full min-w-[920px] text-left">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      User
                    </th>

                    <th className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      Role
                    </th>

                    <th className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      Status
                    </th>

                    <th className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      User ID
                    </th>

                    <th className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      Joined
                    </th>

                    <th className="border-b border-slate-200 px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map(
                    (user, index) => {

                      const active =
                        isUserActive(user);

                      const isDeleting =
                        deletingId === user.id;

                      return (

                        <tr
                          key={user.id}
                          className="group border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30"
                        >

                          {/* User */}
                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3.5">

                              <UserAvatar
                                user={user}
                                index={index}
                              />

                              <div className="min-w-0">

                                <div className="flex items-center gap-2">

                                  <p className="truncate font-bold text-slate-900">
                                    {user.name ||
                                      "Unnamed user"}
                                  </p>

                                  {index === 0 && (
                                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-600">
                                      Primary
                                    </span>
                                  )}

                                </div>

                                <div className="mt-1 flex items-center gap-1.5">

                                  <Mail
                                    size={12}
                                    className="text-slate-400"
                                  />

                                  <p className="max-w-[260px] truncate text-xs text-slate-500">
                                    {user.email ||
                                      "No email address"}
                                  </p>

                                </div>

                              </div>

                            </div>

                          </td>


                          {/* Role */}
                          <td className="px-5 py-5">
                            <RoleBadge
                              role={user.role}
                            />
                          </td>


                          {/* Status */}
                          <td className="px-5 py-5">
                            <StatusBadge
                              active={active}
                            />
                          </td>


                          {/* ID */}
                          <td className="px-5 py-5">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-600">
                              #{user.id}
                            </span>

                          </td>


                          {/* Joined */}
                          <td className="px-5 py-5">

                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">

                              <Clock3
                                size={14}
                                className="text-slate-400"
                              />

                              {formatDate(
                                getCreatedDate(
                                  user
                                )
                              )}

                            </div>

                          </td>


                          {/* Actions */}
                          <td className="px-6 py-5">

                            <div className="flex items-center justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    user
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 opacity-80 transition hover:bg-amber-100 hover:opacity-100"
                              >
                                <Edit3 size={14} />
                                Edit
                              </button>


                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() =>
                                  handleDelete(
                                    user.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 opacity-80 transition hover:bg-rose-100 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                {isDeleting ? (
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={14}
                                  />
                                )}

                                {isDeleting
                                  ? "Deleting..."
                                  : "Delete"}

                              </button>


                              <div className="relative">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu ===
                                        user.id
                                        ? null
                                        : user.id
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal
                                    size={17}
                                  />
                                </button>


                                {openMenu === user.id && (

                                  <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditForm(
                                          user
                                        )
                                      }
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Edit3
                                        size={14}
                                      />
                                      Edit account
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          user.id
                                        )
                                      }
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2
                                        size={14}
                                      />
                                      Delete account
                                    </button>

                                  </div>

                                )}

                              </div>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            )}

          </div>


          {/* ==================================================
              FOOTER SUMMARY
          ================================================== */}

          {filteredUsers.length > 0 && (

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs md:flex-row md:items-center md:justify-between md:px-6">

              <div className="flex items-center gap-2 text-slate-500">

                <Zap
                  size={14}
                  className="text-blue-500"
                />

                <span>
                  {hasFilters
                    ? `Filtered view · ${filteredUsers.length} matching account${filteredUsers.length === 1 ? "" : "s"}`
                    : `All ${users.length} registered account${users.length === 1 ? "" : "s"}`}
                </span>

              </div>


              <div className="flex items-center gap-4">

                <span className="font-semibold text-emerald-600">
                  {stats.active} active
                </span>

                <span className="font-semibold text-slate-500">
                  {stats.inactive} inactive
                </span>

              </div>

            </div>

          )}

        </section>


        {/* ====================================================
            SECURITY NOTE
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={19} />
              </div>

              <div>

                <p className="text-sm font-bold text-slate-800">
                  Access management
                </p>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                  Keep administrator and communication-team access limited to
                  the accounts that need it. Use the role selector when creating
                  or updating users.
                </p>

              </div>

            </div>


            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-500">

              <CheckCircle2
                size={15}
                className="text-emerald-500"
              />

              Workspace protected

            </div>

          </div>

        </section>


      </div>


      {/* ======================================================
          ADD / EDIT USER MODAL
      ====================================================== */}

      {showForm && (

        <UserForm
          form={form}
          editingUser={editingUser}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />

      )}

    </div>
  );
}
