import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { apiPath } from "@/utils/routes";
import Swal from "sweetalert2";
import useAuthStore from "@/store/store";
import { Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Recipient chip input ──────────────────────────────────────────────────────
function GmailToField({
  contacts = [],
  initialRecipients = [],
  placeholder = "Add recipients…",
  onChange = () => {},
}) {
  const [recipients, setRecipients] = useState(() =>
    (initialRecipients || []).map(normalizeRecipient),
  );
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(
    () => onChange(recipients.map((r) => r.email ?? r.value)),
    [recipients],
  );

  useEffect(() => {
    if (!Array.isArray(initialRecipients) || initialRecipients.length === 0)
      return;
    const normalized = initialRecipients.map(normalizeRecipient);
    setRecipients((prev) => {
      const existing = new Set(
        prev.map((r) => (r.email || r.value || "").toLowerCase()),
      );
      const toAdd = normalized.filter(
        (r) => !existing.has((r.email || r.value || "").toLowerCase()),
      );
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, [initialRecipients]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(0);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function normalizeRecipient(item) {
    if (typeof item === "string")
      return {
        name: null,
        email: item,
        value: item,
        valid: EMAIL_REGEX.test(item),
      };
    return {
      name: item.name || null,
      email: item.email || item.value,
      value: item.email || item.value,
      valid: EMAIL_REGEX.test(item.email || item.value),
    };
  }

  function filteredContacts(q) {
    if (!q) return contacts.slice(0, 8);
    const lower = q.toLowerCase();
    return contacts
      .filter(
        (c) =>
          c.email?.toLowerCase().includes(lower) ||
          c.name?.toLowerCase().includes(lower),
      )
      .slice(0, 8);
  }

  function addRecipient(item) {
    const n = normalizeRecipient(item);
    setRecipients((prev) => {
      const exists = prev.some(
        (r) =>
          (r.email || r.value || "").toLowerCase() ===
          (n.email || "").toLowerCase(),
      );
      return exists ? prev : [...prev, n];
    });
    setInput("");
    setOpen(false);
  }

  function removeRecipient(i) {
    setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleInputKeyDown(e) {
    const filtered = filteredContacts(input);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (filtered.length && open) addRecipient(filtered[highlight]);
      else if (input.trim()) addRecipient(input.trim());
    } else if (e.key === "Backspace" && !input && recipients.length) {
      removeRecipient(recipients.length - 1);
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    const emails = text
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => EMAIL_REGEX.test(s));
    if (emails.length) {
      e.preventDefault();
      emails.forEach((em) => addRecipient(em));
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: 42,
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: "6px 10px",
          background: "rgba(20,15,43,0.7)",
          border: "1px solid rgba(69,44,149,0.5)",
          borderRadius: 10,
          cursor: "text",
          transition: "border .15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#B797FF")}
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "rgba(69,44,149,0.5)")
        }
      >
        {recipients.map((r, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              background: r.valid
                ? "rgba(127,86,217,0.25)"
                : "rgba(248,113,113,0.2)",
              border: `1px solid ${r.valid ? "rgba(127,86,217,0.5)" : "rgba(248,113,113,0.5)"}`,
              color: r.valid ? "#E1C9FF" : "#FCA5A5",
            }}
          >
            {r.name ? `${r.name} <${r.email}>` : r.email}
            <button
              onClick={() => removeRecipient(i)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                fontSize: 13,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          onPaste={handlePaste}
          placeholder={recipients.length === 0 ? placeholder : undefined}
          style={{
            flex: 1,
            minWidth: 140,
            outline: "none",
            background: "transparent",
            color: "#F5F0FF",
            fontSize: 13.5,
            border: "none",
            padding: "2px 0",
          }}
        />
      </div>
      {open && filteredContacts(input).length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#1B1539",
            border: "1px solid rgba(69,44,149,0.6)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {filteredContacts(input).map((c, idx) => (
            <div
              key={c.email}
              onMouseDown={(e) => {
                e.preventDefault();
                addRecipient(c);
              }}
              onMouseEnter={() => setHighlight(idx)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                background:
                  idx === highlight ? "rgba(127,86,217,0.2)" : "transparent",
                borderBottom: "1px solid rgba(69,44,149,0.2)",
              }}
            >
              <div style={{ fontWeight: 500, color: "#F5F0FF" }}>
                {c.name || c.email}
              </div>
              <div style={{ fontSize: 11, color: "#A99BD4" }}>{c.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drag-and-drop attachment zone ─────────────────────────────────────────────
function AttachmentZone({ attachments, setAttachments }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#B797FF" : "rgba(127,86,217,0.4)"}`,
          borderRadius: 12,
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all .2s",
          background: dragging ? "rgba(127,86,217,0.08)" : "rgba(20,15,43,0.4)",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={{ fontSize: 22, marginBottom: 6 }}>⊕</div>
        <div style={{ fontSize: 13, color: "#A99BD4" }}>
          Drag files here or{" "}
          <span style={{ color: "#B797FF", textDecoration: "underline" }}>
            browse
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#6F618F", marginTop: 4 }}>
          PDF, images, docs — any format
        </div>
      </div>

      {attachments.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
        >
          {attachments.map((file, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(20,15,43,0.6)",
                border: "1px solid rgba(127,86,217,0.3)",
                fontSize: 12,
                color: "#E1C9FF",
              }}
            >
              <span>📎</span>
              <span
                style={{
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </span>
              <span style={{ color: "#6F618F", fontSize: 11 }}>
                {formatSize(file.size)}
              </span>
              <button
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#6F618F",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function SendBulkEmailViaGmail({
  open,
  handleClose,
  emails = [],
  newClients,
  preselectedListId = "",
}) {
  const user = useAuthStore((state) => state.user);
  const [body, setBody] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [to, setTo] = useState(emails || []);
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateData, setTemplateData] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [service, setService] = useState("gmail");
  const [contactLists, setContactLists] = useState([]);
  const [selectedContactListId, setSelectedContactListId] = useState("");
  const [listRecipients, setListRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const hccEmail = user?.user?.hccEmail || " ";
  const id = user?.user?._id;
  const senderName = `${user?.user?.firstName} ${user?.user?.secondName}`;
  const senderTitle = user?.user?.title || "Business Growth Consultant";

  // Selected template object for preview
  const selectedTemplate = templateData.find(
    (t) => t.value === (templateId?.value || templateId),
  );

  useEffect(() => {
    if (!id) return;

    async function templateOptions() {
      try {
        const res = await axios.get(`${apiPath.prodPath3}/api/templates`);
        const templateArr = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        setTemplateData(
          templateArr.map((it) => ({
            label: it.name || it.id,
            value: it._id || it.id,
            id: it._id || it.id,
            name: it.name,
            description: it.description,
          })),
        );
      } catch (err) {
        console.error(err);
      }
    }

    async function loadContacts() {
      try {
        const r = await axios.get(
          `${apiPath.prodPath}/api/clients/allNewLeads`,
        );
        const rows = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setContacts(
          rows
            .filter((c) => c?.email)
            .map((c) => ({
              email: c.email,
              name: c.clientName || c.name || "",
              value: c.email,
            })),
        );
      } catch (err) {}
    }

    async function loadContactLists() {
      try {
        const r = await axios.get(
          `${apiPath.prodPath3}/api/contact-lists/${id}`,
        );
        const rows = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setContactLists(rows);
      } catch (err) {
        setContactLists([]);
      }
    }

    templateOptions();
    loadContacts();
    loadContactLists();
  }, [id]);

  useEffect(() => {
    if (!selectedContactListId || !id) return;
    async function loadMembers() {
      try {
        const r = await axios.get(
          `${apiPath.prodPath3}/api/contact-lists/${id}/${selectedContactListId}/members`,
        );
        const members = r.data?.data?.members || [];
        setListRecipients(members.map((m) => m?.email).filter(Boolean));
      } catch (err) {
        setListRecipients([]);
        Swal.fire("Error", "Failed to load members for selected list", "error");
      }
    }
    loadMembers();
  }, [selectedContactListId, id]);

  useEffect(() => {
    if (preselectedListId && open) {
      setSelectedContactListId(preselectedListId);
    }
  }, [open, preselectedListId]);

  const handleUpload = async () => {
    if (!id) {
      Swal.fire("Error", "User not found in session", "error");
      return;
    }
    if (!to || (Array.isArray(to) && to.length === 0)) {
      Swal.fire("Warning", "Please add at least one recipient", "warning");
      return;
    }
    if (!subject.trim()) {
      Swal.fire("Warning", "Please add a subject", "warning");
      return;
    }

    setSending(true);
    try {
      const firstRecipient = Array.isArray(to) ? to[0] : to;
      const templateData2 = {
        title: "Good Day From Hill Country",
        recipientName: firstRecipient || "",
        body,
        additionalText: "Thank You for your Time",
        senderName,
        senderTitle,
        companyName: "Hill Country Coders",
        companyAddress: "Cedar Park Texas USA",
        companyWebsite: "https://www.hillcountrycoders.com",
      };

      const formData = new FormData();
      formData.append(
        "recipients",
        Array.isArray(to) ? JSON.stringify(to) : to,
      );
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("service", service);
      if (templateId?.value || templateId)
        formData.append("templateId", templateId?.value || templateId);
      if (selectedContactListId)
        formData.append("contactListId", selectedContactListId);
      formData.append("templateData", JSON.stringify(templateData2));
      attachments.forEach((file) => formData.append("attachments", file));

      await axios.post(
        `${apiPath.prodPath3}/api/bulkEmail/sendBulkEmail/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      Swal.fire("Launched", "Bulk campaign queued successfully", "success");
      setBody("");
      setSubject("");
      setTemplateId("");
      setAttachments([]);
      setTo([]);
      setSelectedContactListId("");
      setListRecipients([]);
      handleClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!id) {
      Swal.fire("Error", "User not found in session", "error");
      return;
    }
    if (!subject.trim()) {
      Swal.fire("Warning", "Please add a subject before sending a test", "warning");
      return;
    }
    if (!body.trim() && !templateId) {
      Swal.fire(
        "Warning",
        "Please add a body or select a template before sending a test",
        "warning",
      );
      return;
    }

    const resolvedTestEmail = testEmail.trim() || hccEmail?.trim();
    if (!resolvedTestEmail || resolvedTestEmail === " ") {
      Swal.fire("Warning", "No test email address found", "warning");
      return;
    }

    setSending(true);
    try {
      const templateData2 = {
        title: "Good Day From Hill Country",
        recipientName: resolvedTestEmail,
        body,
        additionalText: "Thank You for your Time",
        senderName,
        senderTitle,
        companyName: "Hill Country Coders",
        companyAddress: "Cedar Park Texas USA",
        companyWebsite: "https://www.hillcountrycoders.com",
      };

      const formData = new FormData();
      formData.append("recipients", JSON.stringify([resolvedTestEmail]));
      formData.append("subject", `[TEST] ${subject}`);
      formData.append("body", body);
      formData.append("service", service);
      if (templateId?.value || templateId)
        formData.append("templateId", templateId?.value || templateId);
      formData.append("templateData", JSON.stringify(templateData2));
      attachments.forEach((file) => formData.append("attachments", file));

      await axios.post(
        `${apiPath.prodPath3}/api/bulkEmail/sendBulkEmail/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      Swal.fire({
        icon: "success",
        text: `Test email sent to ${resolvedTestEmail}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to send test email", "error");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: "rgba(20,15,43,0.7)",
    border: "1px solid rgba(69,44,149,0.5)",
    borderRadius: 10,
    padding: "10px 13px",
    color: "#F5F0FF",
    fontSize: 13.5,
    outline: "none",
    width: "100%",
    transition: "border .15s",
    fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: "#A99BD4",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 5,
    display: "block",
  };

  const recipientCount = Array.isArray(to) ? to.length : to ? 1 : 0;
  const selectedListName = contactLists.find(
    (l) => l._id === selectedContactListId,
  )?.name;

  async function fetchTemplateBody(templateIdValue) {
    if (!templateIdValue) {
      setTemplateBody("");
      return;
    }
    try {
      const r = await axios.get(
        `${apiPath.prodPath3}/api/templates/${templateIdValue}`,
      );
      setTemplateBody(r.data?.data?.body || "");
    } catch (err) {
      setTemplateBody("");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "96vw",
          maxWidth: "1280px",
          height: "92vh",
          borderRadius: "20px",
          backgroundColor: "transparent",
          overflow: "hidden",
          m: 0,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
        },
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "linear-gradient(160deg, #2D245B 0%, #1B1539 100%)",
          border: "1px solid rgba(127,86,217,0.35)",
          borderRadius: 20,
          fontFamily: "'General Sans', system-ui, sans-serif",
          color: "#F5F0FF",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 28px 14px",
            borderBottom: "1px solid rgba(127,86,217,0.2)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7F56D9, #4A2CA0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              ✉
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                Send Bulk Campaign
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#A99BD4" }}>
                {recipientCount > 0
                  ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}${selectedListName ? ` · ${selectedListName}` : ""}`
                  : "Add recipients or select a contact list"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(127,86,217,0.35)",
              background: "rgba(127,86,217,0.08)",
              color: "#E1C9FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <CloseIcon style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* ── Body: two-panel layout ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* LEFT: compose */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid rgba(127,86,217,0.2)",
              minWidth: 0,
              overflowY: "auto",
              padding: "20px 28px",
              gap: 18,
            }}
          >
            {/* From */}
            <div>
              <label style={labelStyle}>From</label>
              <div
                style={{ ...inputStyle, cursor: "default", color: "#A99BD4" }}
              >
                {hccEmail}
              </div>
            </div>

            {/* To */}
            <div>
              <label style={labelStyle}>To</label>
              <GmailToField
                contacts={contacts}
                initialRecipients={[
                  ...(newClients || []).map((c) => c.email).filter(Boolean),
                  ...listRecipients,
                ]}
                onChange={(list) => setTo(list.map(String))}
              />
            </div>

            {/* Subject */}
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your subject line…"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#B797FF")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(69,44,149,0.5)")
                }
              />
            </div>

            {/* Service + Contact List row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
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
              <div>
                <label style={labelStyle}>Contact List</label>
                <select
                  value={selectedContactListId}
                  onChange={(e) => setSelectedContactListId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select Contact List</option>
                  {contactLists.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template */}
            <div>
              <label style={labelStyle}>Template</label>
              <select
                value={templateId?.value || templateId || ""}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  fetchTemplateBody(e.target.value);
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— No template (write body below) —</option>
                {templateData.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Body (HTML)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  templateId
                    ? "Leave blank to use template body, or override here…"
                    : "Write your email body or paste HTML…"
                }
                style={{
                  ...inputStyle,
                  resize: "none",
                  minHeight: 140,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#B797FF")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(69,44,149,0.5)")
                }
              />
            </div>

            {/* Attachments */}
            <div>
              <label style={labelStyle}>Attachments</label>
              <AttachmentZone
                attachments={attachments}
                setAttachments={setAttachments}
              />
            </div>
          </div>

          {/* RIGHT: preview + meta */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              background: "rgba(20,15,43,0.4)",
              overflowY: "auto",
              padding: "20px 20px",
              gap: 18,
            }}
          >
            <div>
              <label style={labelStyle}>Live Preview</label>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  minHeight: 200,
                  position: "relative",
                }}
              >
                {body || templateBody ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        height: 220,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <iframe
                        srcDoc={body || templateBody || ""}
                        style={{
                          width: "600px",
                          height: "800px",
                          border: "none",
                          display: "block",
                          transform: "scale(0.46)",
                          transformOrigin: "top left",
                          pointerEvents: "none",
                        }}
                        title="Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    <button
                      onClick={() =>
                        window.open(
                          URL.createObjectURL(
                            new Blob([body || templateBody], {
                              type: "text/html",
                            }),
                          ),
                          "_blank",
                        )
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px",
                        background: "rgba(127,86,217,0.15)",
                        border: "none",
                        borderTop: "1px solid rgba(127,86,217,0.2)",
                        color: "#B797FF",
                        fontSize: 11.5,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      ↗ Open full preview
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
                    Preview appears once you add a body or select a template
                  </div>
                )}
              </div>
            </div>

            {/* Campaign summary */}
            <div
              style={{
                background: "rgba(127,86,217,0.08)",
                border: "1px solid rgba(127,86,217,0.25)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6F618F",
                  marginBottom: 10,
                }}
              >
                Summary
              </div>
              {[
                [
                  "Recipients",
                  recipientCount > 0
                    ? `${recipientCount} contact${recipientCount !== 1 ? "s" : ""}`
                    : "None added",
                ],
                ["Service", service === "sendgrid" ? "SendGrid" : "Gmail"],
                ["List", selectedListName || "Manual recipients"],
                ["Template", selectedTemplate?.label || "None"],
                [
                  "Attachments",
                  attachments.length > 0
                    ? `${attachments.length} file${attachments.length !== 1 ? "s" : ""}`
                    : "None",
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    marginBottom: 7,
                  }}
                >
                  <span style={{ color: "#A99BD4" }}>{k}</span>
                  <span style={{ color: "#F5F0FF", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Activity note */}
            <div
              style={{
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 10,
                padding: "10px 13px",
                fontSize: 11.5,
                color: "#86EFAC",
                lineHeight: 1.5,
              }}
            >
              <strong>Activity logging</strong>
              <br />
              Each send will be recorded as a bulk job. Monitor progress in the
              Bulk Jobs tab.
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            borderTop: "1px solid rgba(127,86,217,0.2)",
            flexShrink: 0,
            background: "rgba(20,15,43,0.4)",
          }}
        >
          <div style={{ fontSize: 12, color: "#6F618F" }}>
            {recipientCount > 0
              ? `Launching to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} via ${service === "sendgrid" ? "SendGrid" : "Gmail"}`
              : "No recipients selected yet"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setBody("");
                setSubject("");
                setTemplateId("");
                setAttachments([]);
                setTo([]);
                setSelectedContactListId("");
                setListRecipients([]);
                setTestEmail("");
                handleClose();
              }}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.08)",
                color: "#E1C9FF",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={hccEmail || "test@email.com"}
              style={{
                background: "rgba(20,15,43,0.7)",
                border: "1px solid rgba(69,44,149,0.5)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#F5F0FF",
                fontSize: 12.5,
                outline: "none",
                width: 200,
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#B797FF")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(69,44,149,0.5)")
              }
            />
            <button
              onClick={handleSendTest}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.08)",
                color: "#E1C9FF",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {testEmail.trim()
                ? `Send test to ${testEmail.trim()}`
                : "Send test to me"}
            </button>
            <button
              onClick={handleUpload}
              disabled={sending}
              style={{
                padding: "9px 22px",
                borderRadius: 10,
                border: "none",
                background: sending
                  ? "rgba(127,86,217,0.3)"
                  : "linear-gradient(180deg,#9B74F0,#6B42C8)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
                boxShadow: sending
                  ? "none"
                  : "0 6px 20px -6px rgba(127,86,217,0.7)",
              }}
            >
              {sending ? "Launching…" : "🚀 Launch Campaign"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
