import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { apiPath } from "@/utils/routes";
import Swal from "sweetalert2";
import useAuthStore from "@/store/store";
import { Drawer } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GmailToField({ contacts = [], initialRecipients = [], placeholder = "To:", onChange = () => {} }) {
  const [recipients, setRecipients] = useState(() =>
    (initialRecipients || []).map((r) => normalizeRecipient(r))
  );
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => onChange(recipients.map((r) => r.email ?? r.value)), [recipients]);

  useEffect(() => {
    if (!Array.isArray(initialRecipients) || initialRecipients.length === 0) return;

    const normalized = initialRecipients.map((r) => normalizeRecipient(r));
    setRecipients((prev) => {
      const existing = new Set(prev.map((r) => (r.email || r.value || "").toLowerCase()));
      const toAdd = normalized.filter((r) => !existing.has((r.email || r.value || "").toLowerCase()));
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
    if (typeof item === "string") return { name: null, email: item, value: item, valid: EMAIL_REGEX.test(item) };
    return { name: item.name || null, email: item.email || item.value, value: item.email || item.value, valid: EMAIL_REGEX.test(item.email || item.value) };
  }

  function addRecipientFromString(str) {
    const parts = str.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const newOnes = parts.map((p) => normalizeRecipient(p));
    setRecipients((prev) => {
      const existing = new Set(prev.map((r) => (r.email || r.value || "").toLowerCase()));
      const toAdd = newOnes.filter((r) => !existing.has((r.email || r.value || "").toLowerCase()));
      return [...prev, ...toAdd];
    });
    setInput("");
    setOpen(false);
  }

  function addRecipient(rec) {
    const r = normalizeRecipient(rec);
    setRecipients((prev) => {
      const existing = new Set(prev.map((x) => (x.email || x.value || "").toLowerCase()));
      if (existing.has((r.email || r.value || "").toLowerCase())) return prev;
      return [...prev, r];
    });
    setInput("");
    setOpen(false);
    inputRef.current && inputRef.current.focus();
  }

  function removeRecipient(index) {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleInputKeyDown(e) {
    const suggestions = filteredContacts(input);
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions.length > 0) {
        addRecipient(suggestions[highlight]);
      } else if (input.trim()) {
        addRecipientFromString(input.trim());
      }
      return;
    }
    if (e.key === "," || e.key === ";") {
      e.preventDefault();
      if (input.trim()) addRecipientFromString(input);
      return;
    }
    if (e.key === "Backspace" && input === "") {
      if (recipients.length > 0) setRecipients((prev) => prev.slice(0, -1));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, suggestions.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
  }

  function filteredContacts(q) {
    if (!q || q.trim() === "") return contacts.slice(0, 6);
    const s = q.toLowerCase();
    return contacts.filter((c) =>
      (c.email && c.email.toLowerCase().includes(s)) || (c.name && c.name.toLowerCase().includes(s))
    ).slice(0, 6);
  }

  function handlePaste(e) {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!text) return;
    if (/[;,\n]/.test(text)) {
      e.preventDefault();
      addRecipientFromString(text);
    }
  }

  return (
    <div className="w-full">
      <div ref={wrapperRef} className="border rounded p-2 flex flex-wrap items-center gap-1 min-h-[46px] bg-[#191526]" onClick={() => inputRef.current && inputRef.current.focus()}>
        {recipients.map((r, i) => (
          <div key={`${r.value}-${i}`} className={`flex items-center text-sm text-black rounded-full px-3 py-1 border ${r.valid ? 'bg-gray-100 border-gray-200' : 'bg-red-50 border-red-200'}`}>
            <span className="truncate max-w-[18rem] mr-2">
              {r.name ? `${r.name} ` : ''}
              {r.name ? <span className="text-black-600">&lt;{r.email}&gt;</span> : r.email}
            </span>
            <button aria-label={`Remove ${r.value}`} onClick={() => removeRecipient(i)} className="text-gray-500 hover:text-gray-700 ml-1">×</button>
          </div>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleInputKeyDown}
          onPaste={handlePaste}
          placeholder={recipients.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[160px] outline-none p-1 text-sm bg-transparent"
        />
      </div>

      {open && (
        <div className="relative mt-1 z-50">
          <ul className="absolute bg-white border rounded w-full max-h-56 overflow-auto shadow-md text-black">
            {filteredContacts(input).length === 0 ? (
              <li className="p-2 text-sm text-gray-500">No matches. Press Enter to add "{input}"</li>
            ) : (
              filteredContacts(input).map((c, idx) => (
                <li key={c.email} onMouseDown={(ev) => { ev.preventDefault(); addRecipient(c); }} onMouseEnter={() => setHighlight(idx)} className={`p-2 cursor-pointer flex items-center justify-between ${idx === highlight ? 'bg-blue-50' : ''}`}>
                  <div className="text-sm">
                    <div className="font-medium">{c.name || c.email}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
export default function SendBulkEmailViaGmail({ open, handleClose, emails = [], newClients }) {
  const user = useAuthStore((state) => state.user);
  const [body, setBody] = useState("");
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
  
  // newClients.map((item) => {
  //   setTo((prev) => [...prev, item.email]);
  // });

  const hccEmail = user?.user?.hccEmail || " ";
  const id = user?.user?._id;
  const senderName = `${user?.user?.firstName} ${user?.user?.secondName}`;
  const senderTitle = user?.user?.title || "Business Growth Consultant";

  useEffect(() => {
    if (!id) return;

    async function templateOptions() {
      try {
        const res = await axios.get(`${apiPath.prodPath3}/api/templates`);
        const templateArr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const options = templateArr.map((it) => ({ label: it.name || it.id, value: it.id, id: it.id, name: it.name, description: it.description }));
        setTemplateData(options);
      } catch (err) {
        console.error(err);
      }
    }
    templateOptions();

    async function loadContacts() {
      try {
        const r = await axios.get(`${apiPath.prodPath}/api/clients/allNewLeads`);
        const rows = Array.isArray(r.data) ? r.data : r.data?.data || [];
        const mapped = rows
          .filter((client) => client?.email)
          .map((client) => ({
            email: client.email,
            name: client.clientName || client.name || "",
            value: client.email,
          }));
        setContacts(mapped);
      } catch (err) {
      }
    }

    async function loadContactLists() {
      try {
        const r = await axios.get(`${apiPath.prodPath3}/api/contact-lists/${id}`);
        const rows = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setContactLists(rows);
      } catch (err) {
        setContactLists([]);
      }
    }

    loadContacts();
    loadContactLists();
  }, [id]);

  useEffect(() => {
    if (!selectedContactListId || !id) return;

    async function loadMembers() {
      try {
        const r = await axios.get(
          `${apiPath.prodPath3}/api/contact-lists/${id}/${selectedContactListId}/members`
        );
        const members = r.data?.data?.members || [];
        const recipientEmails = members.map((member) => member?.email).filter(Boolean);
        setListRecipients(recipientEmails);
      } catch (err) {
        setListRecipients([]);
        Swal.fire("Error", "Failed to load members for selected list", "error");
      }
    }

    loadMembers();
  }, [selectedContactListId, id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleUpload = async () => {
    try {
      if (!id) {
        Swal.fire("Error", "User is not available in session", "error");
        return;
      }
      if (!to || (Array.isArray(to) && to.length === 0)) {
        Swal.fire("Warning", "Please add at least one recipient", "warning");
        return;
      }

      const firstRecipient = Array.isArray(to) ? to[0] : to;
      let templateData2 = {
        title: "Good Day From Hill Country",
        recipientName: firstRecipient || "",
        body: body,
        additionalText: "Thank You for your Time",
        senderName: senderName,
        senderTitle: senderTitle,
        companyName: "Hill Country Coders",
        companyAddress: "Cedar Park Texas USA",
        companyWebsite: "https://www.hillcountrycoders.com",
      };

      const formData = new FormData();
      if (Array.isArray(to)) {
        formData.append("recipients", JSON.stringify(to));
      } else if (typeof to === "string") {
        formData.append("recipients", to);
      }
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("service", service);
      if (templateId?.value) formData.append("templateId", templateId.value);
      formData.append("templateData", JSON.stringify(templateData2));
      attachments.forEach((file) => formData.append("attachments", file));

      const response = await axios.post(`${apiPath.prodPath3}/api/bulkEmail/sendBulkEmail/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data);
      Swal.fire("Sent", "Email sent successfully", "success");
      setBody("");
      setSubject("");
      setTemplateId("");
      setAttachments([]);
      setTo([]);
      setSelectedContactListId("");
      setListRecipients([]);
      handleClose();
    } catch (error) {
      console.error("Error sending email:", error);
      Swal.fire("Error", "Failed to send email", "error");
    }
  };

  function handleToChange(list) {
    setTo(list.map((s) => String(s)));
  }

  return (
    <>
      <Drawer
        className="bg-all-modals"
        anchor="left"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: "1142px",
            height: "dvh",
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "16px",
            boxShadow: 3,
            marginTop: "30px",
            marginBottom: "30px",
          },
        }}
      >
        <div className="p-10 flex flex-col bg-[#2D245B] flex-wrap">
          <div className="flex flex-row justify-end">
            <CloseIcon className="text-2xl hover:cursor-pointer" onClick={() => handleClose()} />
          </div>
          <h1 className="text-white font-satoshi text-2xl font-bold mb-5">Email</h1>
          <div className="space-y-4 mt-4">
            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="font-satoshi text-md">From</label>
                <p className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]" name="note">{hccEmail}</p>
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <label className="font-satoshi text-md">To</label>
                <GmailToField
                  contacts={contacts}
                  initialRecipients={[
                    ...(newClients || []).map((client) => client.email).filter(Boolean),
                    ...listRecipients,
                  ]}
                  onChange={handleToChange}
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="font-satoshi text-md">Subject</label>
                <input type="text" value={subject} className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]" onChange={(e) => setSubject(e.target.value)} name="subject" />
              </div>
            </div>

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="font-satoshi text-md">Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="p-2 rounded-[8px] bg-[#191526] border-[#452C95] text-white"
                >
                  <option value="gmail">Gmail</option>
                  <option value="sendgrid">SendGrid</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="font-satoshi text-md">Contact List</label>
                <select
                  value={selectedContactListId}
                  onChange={(e) => setSelectedContactListId(e.target.value)}
                  className="p-2 rounded-[8px] bg-[#191526] border-[#452C95] text-white"
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

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-full">
                <label htmlFor="body">Body</label>
                <textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]" />
              </div>
            </div>

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="font-satoshi text-md">Files</label>
                <input type="file" multiple className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]" onChange={handleFileChange} name="Files" />
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <label htmlFor="taskStatus">Template</label>
                <select value={templateId?.value || ""} onChange={(e) => setTemplateId({ value: e.target.value })} className="p-2 rounded-[8px] bg-[#191526] border-[#452C95] text-white">
                  <option value="">Select Template</option>
                  {templateData.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>
            </div>

            <Button onClick={handleUpload} className="w-full bg-[#B797FF]">Send Email</Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
