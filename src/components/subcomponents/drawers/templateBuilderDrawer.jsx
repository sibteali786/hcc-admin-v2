"use client";
import React, { useMemo, useRef, useState } from "react";
import { Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import { apiPath } from "@/utils/routes";

const MERGE_TAGS = [
  { key: "{{firstName}}",  label: "First Name" },
  { key: "{{lastName}}",   label: "Last Name" },
  { key: "{{company}}",    label: "Company" },
  { key: "{{email}}",      label: "Email" },
  { key: "{{bookingLink}}",label: "Booking Link" },
  { key: "{{senderName}}", label: "Sender Name" },
  { key: "{{senderTitle}}",label: "Sender Title" },
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

// Input modes for the body editor
const INPUT_MODES = ["write", "paste", "upload"];

export default function TemplateBuilderDrawer({ open, handleClose, refreshData }) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind]               = useState("template");
  const [subject, setSubject]         = useState("");
  const [body, setBody]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [inputMode, setInputMode]     = useState("write");   // write | paste | upload
  const [previewMode, setPreviewMode] = useState("rendered"); // rendered | source
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  // Live preview — substitute merge tags with sample values
  const previewHtml = useMemo(() => {
    if (!body) return "";
    return body.replace(/\{\{(\w+)\}\}/g, (match, key) => SAMPLE_VALUES[key] || match);
  }, [body]);

  // Insert merge tag at cursor position in textarea
  const insertMergeTag = (tag) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => prev + (prev ? " " : "") + tag);
      return;
    }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = body.slice(0, start) + tag + body.slice(end);
    setBody(next);
    // Restore cursor after tag
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + tag.length;
      el.focus();
    });
  };

  // Handle HTML file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;
    if (!file.name.endsWith(".html") && file.type !== "text/html") {
      setUploadError("Only .html files are supported.");
      return;
    }
    if (file.size > 500 * 1024) {
      setUploadError("File must be under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBody(ev.target.result || "");
      setInputMode("write"); // switch to write mode to show the content
    };
    reader.readAsText(file);
  };

  const resetState = () => {
    setName(""); setDescription(""); setKind("template");
    setSubject(""); setBody(""); setInputMode("write");
    setPreviewMode("rendered"); setUploadError("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Swal.fire("Warning", "Template name is required", "warning");
      return;
    }
    if (!body.trim()) {
      Swal.fire("Warning", "Template body cannot be empty", "warning");
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
      if (typeof refreshData === "function") refreshData();
      handleClose();
    } catch (error) {
      Swal.fire("Error", "Failed to create template", "error");
    } finally {
      setSaving(false);
    }
  };

  const charCount = body.length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "96vw",
          maxWidth: "1320px",
          height: "92vh",
          borderRadius: "20px",
          backgroundColor: "transparent",
          overflow: "hidden",
          m: 0,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
        },
      }}
    >
      {/* Outer shell */}
      <div style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: "linear-gradient(160deg, #2D245B 0%, #1B1539 100%)",
        border: "1px solid rgba(127,86,217,0.35)",
        borderRadius: "20px",
        fontFamily: "'General Sans', system-ui, sans-serif",
        color: "#F5F0FF",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px 16px",
          borderBottom: "1px solid rgba(127,86,217,0.2)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #7F56D9, #4A2CA0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
            }}>✦</div>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>
                Template Builder
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#A99BD4" }}>
                HTML email template with live preview
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{
            width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(127,86,217,0.35)",
            background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <CloseIcon style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* ── Meta fields ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12, padding: "16px 28px",
          borderBottom: "1px solid rgba(127,86,217,0.15)",
          flexShrink: 0,
        }}>
          {[
            { label: "Name *", value: name, setter: setName, placeholder: "Follow-up Touchpoint" },
            { label: "Subject", value: subject, setter: setSubject, placeholder: "Quick note from {{senderName}}" },
            { label: "Description", value: description, setter: setDescription, placeholder: "Optional" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#A99BD4", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </label>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                style={{
                  background: "rgba(20,15,43,0.7)", border: "1px solid rgba(69,44,149,0.5)",
                  borderRadius: 10, padding: "9px 13px", color: "#F5F0FF",
                  fontSize: 13.5, outline: "none", transition: "border .15s",
                }}
                onFocus={e => e.target.style.borderColor = "#B797FF"}
                onBlur={e => e.target.style.borderColor = "rgba(69,44,149,0.5)"}
              />
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#A99BD4", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Kind
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={{
                background: "rgba(20,15,43,0.7)", border: "1px solid rgba(69,44,149,0.5)",
                borderRadius: 10, padding: "9px 13px", color: "#F5F0FF",
                fontSize: 13.5, outline: "none", cursor: "pointer",
              }}
            >
              <option value="template">Template</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
        </div>

        {/* ── Main editor area ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 0 }}>

          {/* Left: Editor */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            borderRight: "1px solid rgba(127,86,217,0.2)",
            minWidth: 0,
          }}>

            {/* Editor toolbar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 20px",
              borderBottom: "1px solid rgba(127,86,217,0.15)",
              flexShrink: 0,
            }}>
              {/* Input mode switcher */}
              <div style={{
                display: "inline-flex", padding: 3,
                background: "rgba(20,15,43,0.6)",
                border: "1px solid rgba(69,44,149,0.4)",
                borderRadius: 10, gap: 2,
              }}>
                {INPUT_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setInputMode(mode); if (mode === "upload") fileRef.current?.click(); }}
                    style={{
                      padding: "6px 13px", borderRadius: 8, border: "none",
                      fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                      transition: "all .15s",
                      background: inputMode === mode ? "linear-gradient(180deg,#9B74F0,#6B42C8)" : "transparent",
                      color: inputMode === mode ? "#fff" : "#A99BD4",
                      boxShadow: inputMode === mode ? "0 4px 12px -4px rgba(127,86,217,0.6)" : "none",
                    }}
                  >
                    {mode === "write" ? "✏ Write" : mode === "paste" ? "⊞ Paste HTML" : "↑ Upload .html"}
                  </button>
                ))}
              </div>

              {/* Char count */}
              <span style={{ fontSize: 11.5, color: "#6F618F" }}>
                {charCount.toLocaleString()} chars
              </span>
            </div>

            {/* Merge tag chips */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 20px",
              borderBottom: "1px solid rgba(127,86,217,0.12)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#6F618F", alignSelf: "center", marginRight: 4 }}>
                INSERT:
              </span>
              {MERGE_TAGS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => insertMergeTag(key)}
                  title={`Insert ${key}`}
                  style={{
                    padding: "3px 10px", borderRadius: 999,
                    fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                    background: "rgba(127,86,217,0.12)",
                    border: "1px solid rgba(127,86,217,0.35)",
                    color: "#E1C9FF", transition: "all .15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(127,86,217,0.28)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(127,86,217,0.12)"; }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Upload error */}
            {uploadError && (
              <div style={{ padding: "8px 20px", background: "rgba(248,113,113,0.1)", borderBottom: "1px solid rgba(248,113,113,0.3)", fontSize: 12.5, color: "#FCA5A5" }}>
                ⚠ {uploadError}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept=".html,text/html"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />

            {/* Textarea */}
            <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 16px", display: "flex", flexDirection: "column" }}>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  inputMode === "paste"
                    ? "Paste your full HTML here…"
                    : "Write or paste HTML here. Use merge tags above to insert personalization tokens."
                }
                style={{
                  flex: 1, width: "100%", resize: "none",
                  background: "rgba(20,15,43,0.6)",
                  border: "1px solid rgba(69,44,149,0.4)",
                  borderRadius: 12, padding: "14px 16px",
                  color: "#F5F0FF", fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.6, outline: "none",
                  transition: "border .15s",
                  minHeight: 0,
                }}
                onFocus={e => e.target.style.borderColor = "#B797FF"}
                onBlur={e => e.target.style.borderColor = "rgba(69,44,149,0.4)"}
              />
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Preview toolbar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 20px",
              borderBottom: "1px solid rgba(127,86,217,0.15)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#B797FF" }}>
                Live Preview
              </span>
              {/* Rendered / Source toggle */}
              <div style={{
                display: "inline-flex", padding: 3,
                background: "rgba(20,15,43,0.6)",
                border: "1px solid rgba(69,44,149,0.4)",
                borderRadius: 10, gap: 2,
              }}>
                {["rendered", "source"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    style={{
                      padding: "5px 12px", borderRadius: 8, border: "none",
                      fontSize: 12, fontWeight: 500, cursor: "pointer",
                      transition: "all .15s",
                      background: previewMode === mode ? "rgba(127,86,217,0.4)" : "transparent",
                      color: previewMode === mode ? "#F5F0FF" : "#A99BD4",
                    }}
                  >
                    {mode === "rendered" ? "Rendered" : "HTML Source"}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview body */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 20 }}>
              {!previewHtml ? (
                <div style={{
                  height: "100%", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 12,
                  color: "#6F618F",
                }}>
                  <div style={{ fontSize: 32 }}>✦</div>
                  <p style={{ margin: 0, fontSize: 13.5 }}>
                    Preview appears once you add HTML body
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#4A3F6B" }}>
                    Merge tags will be substituted with sample values
                  </p>
                </div>
              ) : previewMode === "rendered" ? (
                <div style={{
                  background: "#fff", borderRadius: 12, overflow: "hidden",
                  minHeight: 200,
                  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.6)",
                }}>
                  <iframe
                    srcDoc={previewHtml}
                    style={{ width: "100%", minHeight: 500, border: "none", display: "block" }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <pre style={{
                  margin: 0, padding: 16,
                  background: "rgba(20,15,43,0.7)",
                  border: "1px solid rgba(69,44,149,0.4)",
                  borderRadius: 12,
                  fontSize: 12, lineHeight: 1.6,
                  color: "#A99BD4", overflow: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {previewHtml}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px",
          borderTop: "1px solid rgba(127,86,217,0.2)",
          flexShrink: 0,
          background: "rgba(20,15,43,0.4)",
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 500,
              background: kind === "newsletter" ? "rgba(96,165,250,0.12)" : "rgba(127,86,217,0.15)",
              border: `1px solid ${kind === "newsletter" ? "rgba(96,165,250,0.35)" : "rgba(127,86,217,0.35)"}`,
              color: kind === "newsletter" ? "#93C5FD" : "#E1C9FF",
            }}>
              {kind}
            </span>
            {name && (
              <span style={{ fontSize: 13, color: "#A99BD4" }}>
                "{name}"
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { resetState(); handleClose(); }}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
                fontSize: 13.5, fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 22px", borderRadius: 10, border: "none",
                background: saving ? "rgba(127,86,217,0.3)" : "linear-gradient(180deg,#9B74F0,#6B42C8)",
                color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 6px 20px -6px rgba(127,86,217,0.7)",
                transition: "all .2s",
              }}
            >
              {saving ? "Saving…" : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}