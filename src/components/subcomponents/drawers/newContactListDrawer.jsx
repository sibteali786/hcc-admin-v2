import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/utils/routes";
import useAuthStore from "@/store/store";

export default function NewContactListDrawer({ open, handleClose, refreshData }) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.user?._id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadClients() {
      setLoading(true);
      try {
        const res = await axios.get(`${apiPath.prodPath}/api/clients/allNewLeads`, {
          params: {
            fields: "clientName,email,companyName",
            limit: 100,
            page: 1,
          },
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const filtered = rows.filter((row) => row?.email);
        setClients(filtered);
      } catch (error) {
        Swal.fire("Error", "Failed to load clients for list", "error");
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [open]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter((client) => {
      return (
        (client?.clientName || "").toLowerCase().includes(q) ||
        (client?.companyName || "").toLowerCase().includes(q) ||
        (client?.email || "").toLowerCase().includes(q)
      );
    });
  }, [clients, searchTerm]);

  const selectedMembers = useMemo(() => {
    return Object.values(selectedMap);
  }, [selectedMap]);

  const toggleClient = (client) => {
    const clientKey = String(client?._id || client?.email);
    if (!clientKey || !client?.email) return;

    setSelectedMap((prev) => {
      if (prev[clientKey]) {
        const next = { ...prev };
        delete next[clientKey];
        return next;
      }

      return {
        ...prev,
        [clientKey]: {
          email: client.email,
          name: client.clientName || "",
          clientRefId: client._id,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!userId) {
      Swal.fire("Error", "User not found in auth session", "error");
      return;
    }
    if (!name.trim()) {
      Swal.fire("Warning", "Please enter a list name", "warning");
      return;
    }
    if (selectedMembers.length === 0) {
      Swal.fire("Warning", "Please select at least one member", "warning");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${apiPath.prodPath3}/api/contact-lists/${userId}`, {
        name: name.trim(),
        description: description.trim(),
        members: selectedMembers,
      });

      Swal.fire("Saved", "Contact list created successfully", "success");
      setName("");
      setDescription("");
      setSearchTerm("");
      setSelectedMap({});
      if (typeof refreshData === "function") {
        refreshData();
      }
      handleClose();
    } catch (error) {
      Swal.fire("Error", "Failed to create contact list", "error");
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
      <div className="p-10 flex flex-col bg-[#2D245B] flex-wrap text-white h-full overflow-y-auto">
        <div className="flex flex-row justify-end">
          <CloseIcon className="text-2xl hover:cursor-pointer" onClick={() => handleClose()} />
        </div>

        <h1 className="font-satoshi text-2xl font-bold mb-5 text-[#E1C9FF]">New Contact List</h1>

        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[#7F56D9]">
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">List Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
              placeholder="Warm Leads - April"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-satoshi text-md">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#231C46]"
              placeholder="Optional description"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 flex-1 min-h-0 overflow-hidden">
          <div className="border border-[#452C95] bg-[#231C46] rounded-[12px] p-4 overflow-hidden flex flex-col">
            <h2 className="text-[#B797FF] font-semibold mb-3">Clients</h2>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border-[#452C95] rounded-[8px] border bg-[#2D245B] mb-3"
              placeholder="Search by name/company/email"
            />
            <div className="overflow-auto flex-1 pr-2">
              {loading ? (
                <p className="text-sm text-[#E1C9FF]">Loading clients...</p>
              ) : filteredClients.length === 0 ? (
                <p className="text-sm text-[#E1C9FF]">No clients found.</p>
              ) : (
                filteredClients.map((client) => {
                  const key = String(client?._id || client?.email);
                  const checked = Boolean(selectedMap[key]);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2D245B] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClient(client)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {client.clientName || client.companyName || "Unnamed Client"}
                        </p>
                        <p className="text-xs text-[#E1C9FF] truncate">{client.email}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="border border-[#452C95] bg-[#231C46] rounded-[12px] p-4 overflow-hidden flex flex-col">
            <h2 className="text-[#B797FF] font-semibold mb-3">
              Selected Members ({selectedMembers.length})
            </h2>
            <div className="overflow-auto flex-1 pr-2">
              {selectedMembers.length === 0 ? (
                <p className="text-sm text-[#E1C9FF]">No members selected yet.</p>
              ) : (
                selectedMembers.map((member) => (
                  <div
                    key={`${member.clientRefId || member.email}`}
                    className="p-2 rounded-md bg-[#2D245B] border border-[#452C95] mb-2"
                  >
                    <p className="text-sm text-white">{member.name || "No Name"}</p>
                    <p className="text-xs text-[#E1C9FF]">{member.email}</p>
                  </div>
                ))
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
            {saving ? "Saving..." : "Save Contact List"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
