"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Dialog } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { apiPath } from "@/utils/routes";
import TemplateBuilderDrawer from "../drawers/templateBuilderDrawer";

export default function TemplatesTable() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewTab, setPreviewTab] = useState("rendered");

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

  const mergeTags = useMemo(() => {
    const body = previewTemplate?.body || "";
    const pattern = /\{\{(\w+)\}\}/g;
    const tags = new Set();
    let match = pattern.exec(body);
    while (match) {
      tags.add(`{{${match[1]}}}`);
      match = pattern.exec(body);
    }
    return Array.from(tags);
  }, [previewTemplate]);

  const previewHtml = previewTemplate?.body || "";

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
                  onClick={() => {
                    setPreviewTemplate(template);
                    setPreviewTab("rendered");
                  }}
                  className="rounded-[12px] border border-[#452C95] bg-[#2D245B] p-4 cursor-pointer"
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

      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
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
            borderRadius: "20px",
            color: "#F5F0FF",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 22px",
              borderBottom: "1px solid rgba(127,86,217,0.2)",
              flexShrink: 0,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#E1C9FF" }}>
              {previewTemplate?.name || "Untitled Template"}
            </h2>
            <button
              onClick={() => setPreviewTemplate(null)}
              style={{
                border: "1px solid rgba(127,86,217,0.35)",
                borderRadius: "8px",
                background: "rgba(127,86,217,0.08)",
                color: "#E1C9FF",
                width: "32px",
                height: "32px",
                cursor: "pointer",
              }}
            >
              x
            </button>
          </div>

          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            <div
              style={{
                width: "40%",
                minWidth: 0,
                borderRight: "1px solid rgba(127,86,217,0.2)",
                padding: "18px",
                overflowY: "auto",
              }}
            >
              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#A99BD4" }}>Template Name</p>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                  {previewTemplate?.name || "Untitled Template"}
                </p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background:
                      previewTemplate?.kind === "newsletter"
                        ? "rgba(127,86,217,0.4)"
                        : "rgba(69,44,149,0.9)",
                    color: "#F5F0FF",
                  }}
                >
                  {previewTemplate?.kind || "template"}
                </span>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#A99BD4" }}>Subject</p>
                <p style={{ margin: 0, fontSize: "14px" }}>{previewTemplate?.subject || "No subject"}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#A99BD4" }}>Description</p>
                <p style={{ margin: 0, fontSize: "14px" }}>{previewTemplate?.description || "No description"}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#A99BD4" }}>Usage Count</p>
                <p style={{ margin: 0, fontSize: "14px" }}>{Number(previewTemplate?.usageCount || 0)}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#A99BD4" }}>Merge Tags</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {mergeTags.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#B797FF" }}>No merge tags found</span>
                  ) : (
                    mergeTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid rgba(127,86,217,0.35)",
                          background: "rgba(127,86,217,0.12)",
                          color: "#E1C9FF",
                        }}
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#A99BD4" }}>Created</p>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {previewTemplate?.createdAt
                    ? moment(previewTemplate.createdAt).format("MMM DD, YYYY hh:mm A")
                    : "-"}
                </p>
              </div>
            </div>

            <div style={{ width: "60%", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(127,86,217,0.2)",
                  flexShrink: 0,
                }}
              >
                {["rendered", "source"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    style={{
                      border: "1px solid rgba(127,86,217,0.35)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      color: "#F5F0FF",
                      cursor: "pointer",
                      background:
                        previewTab === tab
                          ? "linear-gradient(180deg,#9B74F0,#6B42C8)"
                          : "rgba(127,86,217,0.08)",
                    }}
                  >
                    {tab === "rendered" ? "Rendered" : "HTML Source"}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, minHeight: 0, padding: "16px", overflow: "auto" }}>
                {previewTab === "rendered" ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      overflow: "hidden",
                      minHeight: "100%",
                    }}
                  >
                    <iframe
                      title="Template preview"
                      srcDoc={previewTemplate?.body || ""}
                      sandbox=""
                      style={{ width: "100%", height: "100%", minHeight: "500px", border: "none" }}
                    />
                  </div>
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid rgba(69,44,149,0.4)",
                      background: "rgba(20,15,43,0.7)",
                      color: "#E1C9FF",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {previewHtml}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <TemplateBuilderDrawer
        open={openCreateDrawer}
        handleClose={() => setOpenCreateDrawer(false)}
        refreshData={fetchTemplates}
      />
    </div>
  );
}
