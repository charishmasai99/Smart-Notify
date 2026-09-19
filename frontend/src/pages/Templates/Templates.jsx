import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Mail,
  MessageSquare,
  Bell,
  Globe,
  Megaphone,
  Sparkles,
  Copy,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";

import templateService from "../../services/templateService";
import TemplateForm from "../../components/Templates/TemplateForm";

const TYPE_META = {
  Email: {
    icon: Mail,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-50",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
  },
  SMS: {
    icon: MessageSquare,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-50",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  "Push Notification": {
    icon: Bell,
    iconClass: "text-violet-600",
    iconBg: "bg-violet-50",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
  },
  "Web Broadcast": {
    icon: Globe,
    iconClass: "text-orange-600",
    iconBg: "bg-orange-50",
    badge: "bg-orange-50 text-orange-700 border-orange-100",
  },
  Announcement: {
    icon: Megaphone,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-50",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
  },
  General: {
    icon: FileText,
    iconClass: "text-slate-600",
    iconBg: "bg-slate-100",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.General;

export default function Templates() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCampaignManager = currentUser?.role === "Campaign Manager";

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    let active = true;

    const loadTemplates = async () => {
      try {
        const data = await templateService.getAll();
        if (active) setTemplates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to load templates:", error);
        if (active) toast.error("Unable to load templates.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTemplates();
    return () => {
      active = false;
    };
  }, []);

  // =====================================================
  // OPEN TEMPLATE FROM GLOBAL SEARCH
  // =====================================================

  useEffect(() => {
    const templateId = searchParams.get("templateId");

    if (!templateId || templates.length === 0) {
      return;
    }

    const selectedTemplate = templates.find(
      (template) =>
        String(template.id) === String(templateId)
    );

    if (!selectedTemplate) {
      return;
    }

    // Templates already use TemplateForm for the existing edit flow.
    // Open that exact template when the current role can manage it.
    if (isCampaignManager) {
      setEditingTemplate(selectedTemplate);
      setShowForm(true);
    } else {
      // Non-managers cannot edit templates in the existing UI.
      // Put the exact template name into the page search so the
      // selected template is the only visible result.
      setSearch(
        selectedTemplate.template_name ||
        selectedTemplate.name ||
        ""
      );
    }

    // Remove the search parameter after selecting the exact template.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("templateId");
        return next;
      },
      { replace: true }
    );
  }, [
    templates,
    searchParams,
    setSearchParams,
    isCampaignManager,
  ]);

  const templateTypes = useMemo(
    () => [...new Set(templates.map((item) => item.template_type).filter(Boolean))],
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const value = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !value ||
        template.template_name?.toLowerCase().includes(value) ||
        template.template_type?.toLowerCase().includes(value) ||
        template.content?.toLowerCase().includes(value);

      const matchesType =
        !typeFilter || template.template_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [templates, search, typeFilter]);

  const typeCounts = useMemo(() => {
    return templates.reduce((acc, item) => {
      const type = item.template_type || "General";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }, [templates]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleSave = async (templateData) => {
    try {
      if (editingTemplate) {
        await templateService.update(editingTemplate.id, templateData);
        toast.success("Template updated successfully!");
      } else {
        await templateService.create(templateData);
        toast.success("Template created successfully!");
      }

      handleClose();
      const updated = await templateService.getAll();
      setTemplates(Array.isArray(updated) ? updated : []);
    } catch (error) {
      console.error("Unable to save template:", error);
      toast.error(
        editingTemplate
          ? "Unable to update template."
          : "Unable to create template."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await templateService.delete(id);
      setTemplates((previous) => previous.filter((item) => item.id !== id));
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error("Unable to delete template:", error);
      toast.error("Unable to delete template.");
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content || "");
      toast.success("Template content copied.");
    } catch {
      toast.error("Unable to copy template content.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-[#f5f8fc]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <FileText className="animate-pulse text-blue-600" size={24} />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] px-5 py-7 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <FileText size={25} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-[#07152f]">
                  Template Management
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {templates.length} templates
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Build, organize and reuse communication content across every SmartNotify campaign.
              </p>
            </div>
          </div>

          {isCampaignManager && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Template
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={FileText}
            label="All templates"
            value={templates.length}
            tone="blue"
          />
          <SummaryCard
            icon={Mail}
            label="Email"
            value={typeCounts.Email || 0}
            tone="indigo"
          />
          <SummaryCard
            icon={MessageSquare}
            label="SMS"
            value={typeCounts.SMS || 0}
            tone="green"
          />
          <SummaryCard
            icon={Globe}
            label="Web & Push"
            value={(typeCounts["Web Broadcast"] || 0) + (typeCounts["Push Notification"] || 0)}
            tone="violet"
          />
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by template name, type or message..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <SlidersHorizontal
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="h-12 min-w-[210px] appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">All Template Types</option>
                  {templateTypes.map((type) => (
                    <option key={type} value={type}>
                      {type} ({typeCounts[type] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex h-12 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={17} />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                  aria-label="List view"
                >
                  <List size={17} />
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredTemplates.length === 0 ? (
          <EmptyState onAdd={isCampaignManager ? handleAdd : undefined} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                canManage={isCampaignManager}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Template</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Content</th>
                  {isCampaignManager && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((template) => {
                  const meta = getTypeMeta(template.template_type);
                  const Icon = meta.icon;

                  return (
                    <tr key={template.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
                            <Icon size={19} className={meta.iconClass} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{template.template_name}</p>
                            <p className="text-xs text-slate-400">Template #{template.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${meta.badge}`}>
                          {template.template_type || "General"}
                        </span>
                      </td>
                      <td className="max-w-xl px-5 py-4 text-sm leading-6 text-slate-500">
                        <span className="line-clamp-2">{template.content}</span>
                      </td>
                      {isCampaignManager && (
                        <td className="px-5 py-4">
                          <ActionButtons
                            onEdit={() => handleEdit(template)}
                            onDelete={() => handleDelete(template.id)}
                            onCopy={() => handleCopy(template.content)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-800">
          <span className="flex items-center gap-2">
            <Sparkles size={15} />
            Reusable templates keep campaign creation faster and more consistent.
          </span>
          <span className="font-bold">
            Showing {filteredTemplates.length} of {templates.length}
          </span>
        </div>
      </div>

      {showForm && (
        <TemplateForm
          initialData={editingTemplate}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#07152f]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, canManage, onEdit, onDelete, onCopy }) {
  const meta = getTypeMeta(template.template_type);
  const Icon = meta.icon;

  return (
    <article className="group flex min-h-[255px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start justify-between border-b border-slate-100 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
            <Icon size={21} className={meta.iconClass} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-900">{template.template_name}</h3>
            <p className="mt-0.5 text-xs text-slate-400">Template #{template.id}</p>
          </div>
        </div>
        <span className={`ml-3 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.badge}`}>
          {template.template_type || "General"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {template.content || "No content available."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={() => onCopy(template.content)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Copy size={15} />
            Copy
          </button>

          {canManage && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(template)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <Edit3 size={15} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(template.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ActionButtons({ onEdit, onDelete, onCopy }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCopy} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Copy">
        <Copy size={16} />
      </button>
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
        <Edit3 size={15} />
        Edit
      </button>
      <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">
        <Trash2 size={15} />
        Delete
      </button>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <FileText size={30} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-800">No templates found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Try a different search or filter. You can also create a reusable template for your next campaign.
      </p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Create Template
        </button>
      )}
    </div>
  );
}
