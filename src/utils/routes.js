export const apiPath = {
  devPath: "http://localhost:8080",
  prodPath: "http://localhost:3001",
  prodPath2: "https://google-scraper-inky.vercel.app",
  devpath2: "http://localhost:5000",
  prodPath3: "http://localhost:5000",
};
// 

/**
 * ============================================================
 * API ROUTE CONSTANTS — utils/routes.js
 * ============================================================
 *
 * Central registry for every backend endpoint the frontend calls.
 * Import prodPath (or apiPath for dev) into any service file.
 *
 * USAGE:
 *   import { prodPath } from "@/utils/routes";
 *   const res = await axios.get(`${prodPath}/notes?entityId=...`);
 *
 * CONVENTION:
 *   prodPath  → points to your live backend
 *   apiPath   → points to local dev backend
 *   Use prodPath in all service files; swap for apiPath during local dev.
 * ============================================================
 */

// Your deployed backend base URL (no trailing slash)
export const prodPath = "https://hcc-adam-backend.vercel.app/api" || "http://localhost:8080/api";

// Local development backend (useful to switch quickly)
export const devPath = "http://localhost:8080/api";

// ── Notes endpoints ──────────────────────────────────────────



export const NOTE_ROUTES = {
  // GET  /notes?entityId=&entityType=&page=&limit=
  list: `${prodPath}/notes`,

  // GET  /notes/search?entityId=&entityType=&q=
  search: `${prodPath}/notes/search`,

  // GET  /notes/presigned?key=
  presigned: `${prodPath}/notes/presigned`,

  // GET    /notes/:id
  // PUT    /notes/:id
  // DELETE /notes/:id
  byId: (id) => `${prodPath}/notes/${id}`,

  // DELETE /notes/:id/attachments/:attachmentId
  attachment: (noteId, attachmentId, userId) =>
    `${prodPath}/notes/${noteId}/attachments/${attachmentId}/${userId}`,

  // POST   /notes/:id/comments
  comments: (noteId) => `${prodPath}/notes/${noteId}/comments`,

  // POST   /notes/:id/comments/:commentId/replies
  replies: (noteId, commentId, currentUserId) =>
    `${prodPath}/notes/${noteId}/comments/${commentId}/replies/${currentUserId}`,

  // PATCH  /notes/:id/comments/:commentId/resolve
  resolveComment: (noteId, commentId) =>
    `${prodPath}/notes/${noteId}/comments/${commentId}/resolve`,

  // DELETE /notes/:id/comments/:commentId
  deleteComment: (noteId, commentId, currentUserId) =>
    `${prodPath}/notes/${noteId}/comments/${commentId}/${currentUserId}`,
};

// ── Mention endpoints ────────────────────────────────────────
 
export const MENTION_ROUTES = {
  // GET    /mentions?page=&limit=&unread=
  list: `${prodPath}/mentions`,
 
  // PATCH  /mentions/read-all
  readAll: `${prodPath}/mentions/read-all`,
 
  // PATCH  /mentions/:mentionId/read
  markRead: (mentionId) => `${prodPath}/mentions/${mentionId}/read`,
 
  // GET    /mentions/users/search?q=
  // Powers the @ dropdown in comment inputs
  userSearch: (currentUserId) => `${prodPath}/mentions/users/search/${currentUserId}`,
};
