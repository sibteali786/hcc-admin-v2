import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { apiPath } from "@/utils/routes";
import Swal from "sweetalert2";
import useAuthStore from "@/store/store";
import { Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Recipient chip input (same pattern as bulk drawer) ────────────────────────
function ToField({ initialEmail = "", onChange = () => {} }) {
  const [recipients, setRecipients] = useState(() =>
    initialEmail ? [{ email: initialEmail, valid: EMAIL_REGEX.test(initialEmail) }] : []
  );
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => onChange(recipients.map((r) => r.email)), [recipients]);

  useEffect(() => {
    if (!initialEmail) return;
    setRecipients([{ email: initialEmail, valid: EMAIL_REGEX.test(initialEmail) }]);
  }, [initialEmail]);

  function addRecipient(email) {
    const trimmed = email.trim();
    if (!trimmed) return;
    const exists = recipients.some((r) => r.email.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setRecipients((prev) => [...prev, { email: trimmed, valid: EMAIL_REGEX.test(trimmed) }]);
    }
    setInput("");
  }

  function removeRecipient(i) {
    setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addRecipient(input);
    } else if (e.key === "Backspace" && !input && recipients.length) {
      removeRecipient(recipients.length - 1);
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    const emails = text.split(/[,;\s]+/).map((s) => s.trim()).filter((s) => EMAIL_REGEX.test(s));
    if (emails.length) { e.preventDefault(); emails.forEach(addRecipient); }
  }

  const inputStyle = {
    background: "rgba(20,15,43,0.7)", border: "1px solid rgba(69,44,149,0.5)",
    borderRadius: 10, color: "#F5F0FF", fontSize: 13.5, outline: "none",
    transition: "border .15s", minHeight: 42,
    display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px",
    cursor: "text",
  };

  return (
    <div
      style={inputStyle}
      onClick={() => inputRef.current?.focus()}
    >
      {recipients.map((r, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 500,
          background: r.valid ? "rgba(127,86,217,0.25)" : "rgba(248,113,113,0.2)",
          border: `1px solid ${r.valid ? "rgba(127,86,217,0.5)" : "rgba(248,113,113,0.5)"}`,
          color: r.valid ? "#E1C9FF" : "#FCA5A5",
        }}>
          {r.email}
          <button onClick={() => removeRecipient(i)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={recipients.length === 0 ? "Add recipient email…" : undefined}
        style={{ flex: 1, minWidth: 140, outline: "none", background: "transparent", color: "#F5F0FF", fontSize: 13.5, border: "none", padding: "2px 0" }}
      />
    </div>
  );
}

// ── Attachment zone ────────────────────────────────────────────────────────────
function AttachmentZone({ attachments, setAttachments }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }}
        style={{
          border: `2px dashed ${dragging ? "#B797FF" : "rgba(127,86,217,0.4)"}`,
          borderRadius: 10, padding: "14px 16px", textAlign: "center",
          cursor: "pointer", transition: "all .2s",
          background: dragging ? "rgba(127,86,217,0.08)" : "rgba(20,15,43,0.4)",
        }}
      >
        <input ref={fileRef} type="file" multiple style={{ display: "none" }}
          onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files)])} />
        <div style={{ fontSize: 18, marginBottom: 4 }}>⊕</div>
        <div style={{ fontSize: 12.5, color: "#A99BD4" }}>
          Drag files here or <span style={{ color: "#B797FF", textDecoration: "underline" }}>browse</span>
        </div>
      </div>
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {attachments.map((file, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(20,15,43,0.6)", border: "1px solid rgba(127,86,217,0.3)",
              fontSize: 12, color: "#E1C9FF",
            }}>
              <span>📎</span>
              <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
              <span style={{ color: "#6F618F", fontSize: 10.5 }}>{formatSize(file.size)}</span>
              <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                style={{ background: "none", border: "none", color: "#6F618F", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main compose drawer ────────────────────────────────────────────────────────
const SendEmailViaGmail = ({ open, handleClose, email = "", item, recipientName }) => {
  const user = useAuthStore((state) => state.user);
  const [body, setBody] = useState("");
  const [to, setTo] = useState([]);
  const [subject, setSubject] = useState("");
  const [service, setService] = useState("gmail");
  const [templateId, setTemplateId] = useState("");
  const [templateOptions, setTemplateOptions] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  const hccEmail = user?.user?.hccEmail || "";
  const id = user?.user?._id;
  const senderName = `${user?.user?.firstName} ${user?.user?.secondName}`;
  const senderTitle = user?.user?.title || "Business Growth Consultant";

  // Pre-fill subject when replying
  useEffect(() => {
    if (item?.subject && open) {
      const prefix = item.subject.startsWith("Re:") ? "" : "Re: ";
      setSubject(prefix + (item.subject || ""));
    }
  }, [open, item]);

  // Load templates from new endpoint
  useEffect(() => {
    if (!open) return;
    async function loadTemplates() {
      try {
        const res = await axios.get(`${apiPath.prodPath3}/api/templates`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTemplateOptions(arr.map((t) => ({ label: t.name, value: t._id || t.id })));
      } catch (err) {
        console.error(err);
      }
    }
    loadTemplates();
  }, [open]);

  const handleSend = async () => {
    if (!id) { Swal.fire("Error", "User not found", "error"); return; }
    if (to.length === 0) { Swal.fire("Warning", "Please add at least one recipient", "warning"); return; }
    if (!subject.trim()) { Swal.fire("Warning", "Subject is required", "warning"); return; }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", to[0]); // single email send takes first recipient
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("service", service);
      if (templateId) formData.append("templateId", templateId);
      formData.append("templateData", JSON.stringify({
        title: "Good Day From Hill Country",
        recipientName: recipientName || to[0] || "",
        body,
        additionalText: "Thank You for your Time",
        senderName, senderTitle,
        companyName: "Hill Country Coders",
        companyAddress: "Cedar Park Texas USA",
        companyWebsite: "https://www.hillcountrycoders.com",
      }));
      attachments.forEach((file) => formData.append("attachments", file));

      await axios.post(`${apiPath.prodPath}/api/appGmail/send/${id}`, formData);

      Swal.fire({ icon: "success", text: "Email sent", timer: 1500, showConfirmButton: false });
      setBody(""); setSubject(""); setTemplateId(""); setAttachments([]); setTo([]);
      handleClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: "rgba(20,15,43,0.7)", border: "1px solid rgba(69,44,149,0.5)",
    borderRadius: 10, padding: "10px 13px", color: "#F5F0FF",
    fontSize: 13.5, outline: "none", width: "100%", transition: "border .15s",
    fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: "#A99BD4",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 5, display: "block",
  };

  const isReply = Boolean(item?.from);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "96vw", maxWidth: "860px", height: "auto", maxHeight: "90vh",
          borderRadius: "20px", backgroundColor: "transparent",
          overflow: "hidden", m: 0,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
        },
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column",
        background: "linear-gradient(160deg, #2D245B 0%, #1B1539 100%)",
        border: "1px solid rgba(127,86,217,0.35)",
        borderRadius: 20, fontFamily: "'General Sans', system-ui, sans-serif",
        color: "#F5F0FF", maxHeight: "90vh", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px 12px",
          borderBottom: "1px solid rgba(127,86,217,0.2)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #7F56D9, #4A2CA0)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>
              {isReply ? "↩" : "✉"}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {isReply ? "Reply" : "New Message"}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "#A99BD4" }}>
                {isReply ? `Replying to ${item.from}` : "Compose a new email"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid rgba(127,86,217,0.35)",
            background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <CloseIcon style={{ fontSize: 15 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* From */}
          <div>
            <label style={labelStyle}>From</label>
            <div style={{ ...inputStyle, color: "#A99BD4", cursor: "default" }}>{hccEmail}</div>
          </div>

          {/* To */}
          <div>
            <label style={labelStyle}>To</label>
            <ToField
              initialEmail={email}
              onChange={(list) => setTo(list)}
            />
          </div>

          {/* Subject */}
          <div>
            <label style={labelStyle}>Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject…"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#B797FF"}
              onBlur={(e) => e.target.style.borderColor = "rgba(69,44,149,0.5)"}
            />
          </div>

          <div>
            <label style={labelStyle}>Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="gmail">Gmail</option>
              <option value="sendgrid">SendGrid</option>
            </select>
          </div>

          {/* Template picker */}
          <div>
            <label style={labelStyle}>Template (optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— No template —</option>
              {templateOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div>
            <label style={labelStyle}>Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={templateId ? "Leave blank to use template, or write an override…" : "Write your message here…"}
              rows={6}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => e.target.style.borderColor = "#B797FF"}
              onBlur={(e) => e.target.style.borderColor = "rgba(69,44,149,0.5)"}
            />
          </div>

          {/* Attachments */}
          <div>
            <label style={labelStyle}>Attachments</label>
            <AttachmentZone attachments={attachments} setAttachments={setAttachments} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px",
          borderTop: "1px solid rgba(127,86,217,0.2)", flexShrink: 0,
          background: "rgba(20,15,43,0.4)",
        }}>
          <div style={{ fontSize: 12, color: "#6F618F" }}>
            {to.length > 0
              ? `Sending via ${service === "sendgrid" ? "SendGrid" : "Gmail"} to ${to[0]}${to.length > 1 ? ` +${to.length - 1} more` : ""}`
              : "No recipient yet"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setBody(""); setSubject(""); setTemplateId(""); setAttachments([]); setTo([]); handleClose(); }}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: sending ? "rgba(127,86,217,0.3)" : "linear-gradient(180deg,#9B74F0,#6B42C8)",
                color: "white", fontSize: 13, fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
                boxShadow: sending ? "none" : "0 6px 20px -6px rgba(127,86,217,0.7)",
              }}
            >
              {sending ? "Sending…" : "Send ✈"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SendEmailViaGmail;