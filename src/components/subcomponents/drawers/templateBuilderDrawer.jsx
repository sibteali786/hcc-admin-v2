import React, { useMemo, useState } from "react";
import { Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/utils/routes";

const MERGE_TAGS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{company}}",
  "{{email}}",
  "{{bookingLink}}",
  "{{senderName}}",
  "{{senderTitle}}",
];

const SAMPLE_VALUES = {
  firstName: "Alex",
  lastName: "Johnson",
  company: "Hill Country Coders",
  email: "alex@example.com",
  bookingLink: "https://cal.com/hcc/demo",
  senderName: "Taylor Adams",
  senderTitle: "Business Growth Consultant",
};

export default function TemplateBuilderDrawer({ open, handleClose, refreshData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("template");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const previewHtml = useMemo(() => {
    if (!body) return "";
    return body.replace(/\{\{(\w+)\}\}/g, (match, key) => SAMPLE_VALUES[key] || match);
  }, [body]);

  const appendMergeTag = (tag) => {
    setBody((prev) => `${prev}${prev ? " " : ""}${tag}`);
  };

  const resetState = () => {
    setName("");
    setDescription("");
    setKind("template");
    setSubject("");
    setBody("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Swal.fire("Warning", "Template name is required", "warning");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${apiPath.prodPath3}/api/templates`, {
        name: name.trim(),
        description: description.trim(),
        kind,
        format: "html",
        subject: subject.trim(),
        body,
        service: "both",
      });

      Swal.fire("Saved", "Template created successfully", "success");
      resetState();
      if (typeof refreshData === "function") {
        refreshData();
      }
      handleClose();
    } catch (error) {
      Swal.fire("Error", "Failed to create template", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "90vw",
          maxWidth: "1200px",
          height: "90vh",
          borderRadius: "16px",
          backgroundColor: "transparent",
          overflow: "hidden",
          m: 0,
        },
      }}
    >
      <div className="p-10 flex flex-col bg-[#2D245B] text-white h-full overflow-hidden">
        <div className="flex flex-row justify-end">
          <CloseIcon className="text-2xl hover:cursor-pointer" onClick={() => handleClose()} />
        </div>

        <h1 className="font-satoshi text-2xl font-bold mb-5 text-[#E1C9FF]">Template Builder</h1>

        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[#7F56D9]">
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
              placeholder="Follow-up Touchpoint"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">Kind</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
            >
              <option value="template">Template</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
              placeholder="Quick follow-up from {{senderName}}"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 flex-1 min-h-0 overflow-hidden">
          <div className="border border-[#452C95] bg-[#231C46] rounded-[12px] p-4 overflow-hidden flex flex-col">
            <h2 className="text-[#B797FF] font-semibold mb-3">HTML Body</h2>

            <div className="flex flex-wrap gap-2 mb-3">
              {MERGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendMergeTag(tag)}
                  className="px-2 py-1 text-xs rounded-full border border-[#7F56D9] text-[#E1C9FF] hover:bg-[#2D245B]"
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#2D245B] flex-1 min-h-[260px]"
              placeholder="Paste or write HTML here..."
            />
          </div>

          <div className="border border-[#452C95] bg-[#231C46] rounded-[12px] p-4 overflow-hidden flex flex-col">
            <h2 className="text-[#B797FF] font-semibold mb-3">Live Preview</h2>
            <div className="bg-[#2D245B] border border-[#452C95] rounded-[8px] p-3 text-sm overflow-auto flex-1">
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-[#E1C9FF]">Preview appears here once body is provided.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-[#7F56D9]">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#B797FF] text-black hover:opacity-90"
          >
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
