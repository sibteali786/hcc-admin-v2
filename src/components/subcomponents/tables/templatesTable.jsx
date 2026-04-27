"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Refresh } from "@mui/icons-material";
import { apiPath } from "@/utils/routes";
import TemplateBuilderDrawer from "../drawers/templateBuilderDrawer";

export default function TemplatesTable() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiPath.prodPath3}/api/templates`);
      const rows = res.data?.data || [];
      setTemplates(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setTemplates([]);
      Swal.fire("Error", "Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="mt-5 w-full">
      <div className="flex flex-col gap-2 border-2 border-[#452C95] shadow-lg rounded-[12px] p-4 bg-[#231C46] w-full">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="bg-[#452C95] w-1/3 text-white hover:bg-[#452C95] hover:opacity-80"
            onClick={fetchTemplates}
          >
            <Refresh className="mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-[#B797FF] w-1/3 text-black hover:bg-[#B797FF] hover:opacity-80"
            onClick={() => setOpenCreateDrawer(true)}
          >
            + Create Template
          </Button>
        </div>

        {loading ? (
          <p className="text-[#E1C9FF] text-sm mt-4">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-[#E1C9FF] text-sm mt-4">No templates found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
            {templates.map((template) => {
              const kind = template?.kind || "template";
              const badgeClass =
                kind === "newsletter"
                  ? "bg-[#7F56D9] text-white"
                  : "bg-[#452C95] text-[#E1C9FF]";
              return (
                <div
                  key={template?._id}
                  className="rounded-[12px] border border-[#452C95] bg-[#2D245B] p-4"
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-[#E1C9FF] truncate">
                      {template?.name || "Untitled Template"}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
                      {kind}
                    </span>
                  </div>

                  <p className="text-sm text-white mb-2">
                    {(template?.subject || "No subject").slice(0, 90)}
                  </p>

                  <p className="text-xs text-[#B797FF]">
                    usageCount: {Number(template?.usageCount || 0)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TemplateBuilderDrawer
        open={openCreateDrawer}
        handleClose={() => setOpenCreateDrawer(false)}
        refreshData={fetchTemplates}
      />
    </div>
  );
}
