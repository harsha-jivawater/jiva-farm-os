const rawBaseUrl = process.env.SMOKE_BASE_URL?.trim();

if (!rawBaseUrl) {
  throw new Error("Set SMOKE_BASE_URL to the exact preview or production URL to test.");
}

const baseUrl = new URL(rawBaseUrl);
if (!["http:", "https:"].includes(baseUrl.protocol) || baseUrl.username) {
  throw new Error("SMOKE_BASE_URL must be an HTTP(S) URL without embedded credentials.");
}

const timeoutMs = 15_000;

async function request(pathname, options = {}) {
  return fetch(new URL(pathname, baseUrl), {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs)
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const health = await request("/api/health");
assert(health.status === 200, `/api/health returned ${health.status}.`);
const healthBody = await health.json();
assert(healthBody.status === "ok", "/api/health did not report status ok.");

const login = await request("/login");
assert(login.status === 200, `/login returned ${login.status}.`);
assert(
  (await login.text()).includes("Internal login"),
  "/login did not render the internal sign-in page."
);

const protectedPage = await request("/pilots", { redirect: "manual" });
assert(
  [302, 303, 307, 308].includes(protectedPage.status),
  `/pilots returned ${protectedPage.status} instead of redirecting an anonymous user.`
);
const location = protectedPage.headers.get("location") ?? "";
assert(
  new URL(location, baseUrl).pathname === "/login",
  "/pilots did not redirect to /login."
);

const expectedHeaders = {
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-robots-tag": "noindex, nofollow, noarchive"
};
for (const [name, expected] of Object.entries(expectedHeaders)) {
  assert(
    health.headers.get(name) === expected,
    `Security header ${name} is missing or incorrect.`
  );
}

console.log(`Deployment smoke check passed for ${baseUrl.origin}.`);
