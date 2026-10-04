/**
 * Thin wrapper around the backend. Kept in one file so if the API's base
 * URL ever needs to change (e.g. once deployed to Render), there's exactly
 * one place to edit.
 */

// In dev, Vite's proxy (see vite.config.js) forwards /api/* to FastAPI
// running on localhost:8000, so a relative path works in both dev and
// production (once this frontend and the backend are deployed together
// or CORS is configured -- see backend/.env's CORS_ORIGINS).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    // Try to surface the backend's own error message (FastAPI sends
    // { "detail": "..." }) rather than a generic "request failed".
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON -- keep statusText */
    }
    throw new Error(detail);
  }

  return response.json();
}

export function getMatches(studentProfile) {
  return request("/api/match", {
    method: "POST",
    body: JSON.stringify(studentProfile),
  });
}

export function getScholarships() {
  return request("/api/scholarships");
}
