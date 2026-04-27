import { Dialog } from "@mui/material";
import "./style.scss";
import React, { useState } from "react";
import { ArrowBack } from "@mui/icons-material";
import ReplyIcon from "@mui/icons-material/Reply";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import moment from "moment";
import Swal from "sweetalert2";

function MailDetails({ open, handleClose, item, onReply }) {
  const [previewMode, setPreviewMode] = useState("rendered"); // rendered | source

  if (!item) return null;

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: "#A99BD4",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 4, display: "block",
  };

  const metaValueStyle = {
    fontSize: 13.5, color: "#F5F0FF", lineHeight: 1.5,
  };

  const handleOpenFullPreview = () => {
    if (!item.body) return;
    const blob = new Blob([item.body], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const handleAddActivity = () => {
    Swal.fire({
      icon: "success",
      text: "Thread saved as activity",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "96vw",
          maxWidth: "1200px",
          height: "90vh",
          borderRadius: "20px",
          backgroundColor: "transparent",
          overflow: "hidden",
          m: 0,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
        },
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: "linear-gradient(160deg, #2D245B 0%, #1B1539 100%)",
        border: "1px solid rgba(127,86,217,0.35)",
        borderRadius: 20,
        fontFamily: "'General Sans', system-ui, sans-serif",
        color: "#F5F0FF",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(127,86,217,0.2)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleClose}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowBack style={{ fontSize: 16 }} />
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {item.subject || "No Subject"}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "#A99BD4" }}>
                {item.from} · {item.date ? moment(item.date).format("MMM DD, YYYY · h:mm A") : ""}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onReply && onReply(item)}
              title="Reply"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 9,
                border: "1px solid rgba(127,86,217,0.35)",
                background: "rgba(127,86,217,0.1)", color: "#E1C9FF",
                cursor: "pointer", fontSize: 12.5, fontWeight: 500,
              }}
            >
              <ReplyIcon style={{ fontSize: 15 }} />
              Reply
            </button>
            <button
              onClick={handleAddActivity}
              title="Add as Activity"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 9,
                border: "1px solid rgba(74,222,128,0.3)",
                background: "rgba(74,222,128,0.06)", color: "#86EFAC",
                cursor: "pointer", fontSize: 12.5, fontWeight: 500,
              }}
            >
              <AddCircleOutlineIcon style={{ fontSize: 15 }} />
              Add as Activity
            </button>
          </div>
        </div>

        {/* ── Two-panel body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* LEFT — metadata panel */}
          <div style={{
            width: 280, flexShrink: 0,
            borderRight: "1px solid rgba(127,86,217,0.2)",
            padding: "20px 20px", overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 20,
          }}>

            {/* From */}
            <div>
              <label style={labelStyle}>From</label>
              <p style={metaValueStyle}>{item.from || "—"}</p>
            </div>

            {/* Subject */}
            <div>
              <label style={labelStyle}>Subject</label>
              <p style={metaValueStyle}>{item.subject || "N/A"}</p>
            </div>

            {/* Date */}
            <div>
              <label style={labelStyle}>Date</label>
              <p style={metaValueStyle}>
                {item.date ? moment(item.date).format("MMM DD, YYYY") : "—"}
              </p>
              <p style={{ fontSize: 11.5, color: "#6F618F", marginTop: 2 }}>
                {item.date ? moment(item.date).format("h:mm A") : ""}
              </p>
            </div>

            {/* MSG ID */}
            <div>
              <label style={labelStyle}>Message ID</label>
              <p style={{
                ...metaValueStyle, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#A99BD4", wordBreak: "break-all",
              }}>
                {item.msgId || item.id || "N/A"}
              </p>
            </div>

            {/* Snippet */}
            {item.snippet && (
              <div>
                <label style={labelStyle}>Snippet</label>
                <p style={{ ...metaValueStyle, fontSize: 12.5, color: "#A99BD4", lineHeight: 1.6 }}>
                  {item.snippet}
                </p>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(127,86,217,0.2)" }} />

            {/* Open full preview button */}
            {item.body && (
              <button
                onClick={handleOpenFullPreview}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 9, width: "100%",
                  border: "1px solid rgba(127,86,217,0.35)",
                  background: "rgba(127,86,217,0.08)", color: "#B797FF",
                  cursor: "pointer", fontSize: 12.5, fontWeight: 500,
                  justifyContent: "center",
                }}
              >
                <OpenInNewIcon style={{ fontSize: 14 }} />
                Open full preview
              </button>
            )}
          </div>

          {/* RIGHT — email body preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Preview tab toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 20px",
              borderBottom: "1px solid rgba(127,86,217,0.15)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: "#6F618F" }}>Email Body</span>
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
                      fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                      transition: "all .15s",
                      background: previewMode === mode ? "rgba(127,86,217,0.4)" : "transparent",
                      color: previewMode === mode ? "#F5F0FF" : "#A99BD4",
                    }}
                  >
                    {mode === "rendered" ? "Rendered" : "Source"}
                  </button>
                ))}
              </div>
            </div>

            {/* Body content */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              {!item.body ? (
                <div style={{
                  height: "100%", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  color: "#6F618F", gap: 8,
                }}>
                  <div style={{ fontSize: 28 }}>✉</div>
                  <p style={{ margin: 0, fontSize: 13 }}>No body content available</p>
                  {item.snippet && (
                    <p style={{ margin: 0, fontSize: 12, color: "#4A3F6B", maxWidth: 400, textAlign: "center" }}>
                      {item.snippet}
                    </p>
                  )}
                </div>
              ) : previewMode === "rendered" ? (
                <div style={{
                  background: "#fff", height: "100%",
                }}>
                  <iframe
                    srcDoc={item.body}
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                    sandbox="allow-same-origin"
                    title="Email body"
                  />
                </div>
              ) : (
                <pre style={{
                  margin: 0, padding: 20,
                  background: "rgba(20,15,43,0.6)",
                  height: "100%",
                  fontSize: 11.5, lineHeight: 1.6,
                  color: "#A99BD4",
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                  overflowY: "auto",
                }}>
                  {item.body}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px",
          borderTop: "1px solid rgba(127,86,217,0.2)",
          flexShrink: 0,
          background: "rgba(20,15,43,0.4)",
          fontSize: 12, color: "#6F618F",
        }}>
          <span>MSG: {item.msgId || item.id || "—"}</span>
          <button
            onClick={handleClose}
            style={{
              padding: "7px 16px", borderRadius: 9,
              border: "1px solid rgba(127,86,217,0.35)",
              background: "rgba(127,86,217,0.08)", color: "#E1C9FF",
              cursor: "pointer", fontSize: 12.5, fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default MailDetails;