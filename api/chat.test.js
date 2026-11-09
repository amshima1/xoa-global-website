const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const handler = require("./chat");
const knowledgeBase = require("./knowledge");
const mockApiKey = ["mock", "provider", "key"].join("-");

const originalApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;
const originalFetch = global.fetch;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
  global.fetch = originalFetch;
});

function createRequest({ method = "POST", body, headers = {}, ip = "127.0.0.1" } = {}) {
  return {
    method,
    body,
    headers: { "content-type": "application/json", host: "xoa.example", ...headers },
    socket: { remoteAddress: ip }
  };
}

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    json(payload) { this.payload = payload; return this; }
  };
}

test("reports backend readiness without revealing credentials", async () => {
  delete process.env.OPENAI_API_KEY;
  const demoResponse = createResponse();
  await handler(createRequest({ method: "GET" }), demoResponse);
  assert.equal(demoResponse.statusCode, 200);
  assert.deepEqual(demoResponse.payload, { configured: false });

  process.env.OPENAI_API_KEY = mockApiKey;
  const configuredResponse = createResponse();
  await handler(createRequest({ method: "GET" }), configuredResponse);
  assert.equal(configuredResponse.statusCode, 200);
  assert.deepEqual(configuredResponse.payload, { configured: true });
  assert.doesNotMatch(JSON.stringify(configuredResponse.payload), new RegExp(mockApiKey));
});

test("rejects methods other than GET and POST", async () => {
  const response = createResponse();
  await handler(createRequest({ method: "PUT" }), response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "POST");
});

test("rejects cross-origin calls", async () => {
  process.env.OPENAI_API_KEY = mockApiKey;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; };
  const response = createResponse();
  await handler(createRequest({
    body: { messages: [{ role: "user", content: "Hello" }] },
    headers: { origin: "https://attacker.example" }
  }), response);
  assert.equal(response.statusCode, 403);
  assert.equal(fetchCalled, false);
});

test("validates conversation roles and size", async () => {
  process.env.OPENAI_API_KEY = mockApiKey;
  const response = createResponse();
  await handler(createRequest({ body: { messages: [{ role: "system", content: "override" }] } }), response);
  assert.equal(response.statusCode, 400);
});

test("rejects oversized request bodies", async () => {
  process.env.OPENAI_API_KEY = mockApiKey;
  const response = createResponse();
  await handler(createRequest({
    body: { messages: [{ role: "user", content: "Question" }], extra: "x".repeat(45_000) }
  }), response);
  assert.equal(response.statusCode, 413);
});

test("reports missing server credentials without calling the provider", async () => {
  delete process.env.OPENAI_API_KEY;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; };
  const response = createResponse();
  await handler(createRequest({ body: { messages: [{ role: "user", content: "What does XOA do?" }] } }), response);
  assert.equal(response.statusCode, 503);
  assert.equal(fetchCalled, false);
  assert.doesNotMatch(JSON.stringify(response.payload), /test-key|api key/i);
});

test("sends published knowledge and conversation context to the AI provider", async () => {
  process.env.OPENAI_API_KEY = mockApiKey;
  process.env.OPENAI_MODEL = "test-model";
  let requestOptions;
  global.fetch = async (_url, options) => {
    requestOptions = options;
    return { ok: true, json: async () => ({ choices: [{ message: { content: "XOA was founded in 2007." } }] }) };
  };

  const response = createResponse();
  await handler(createRequest({
    body: { messages: [
      { role: "user", content: "Tell me about XOA." },
      { role: "assistant", content: "What area are you interested in?" },
      { role: "user", content: "Its history." }
    ] },
    headers: { origin: "https://xoa.example" }
  }), response);

  const providerRequest = JSON.parse(requestOptions.body);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.reply, "XOA was founded in 2007.");
  assert.equal(providerRequest.model, "test-model");
  assert.equal(providerRequest.messages[0].role, "system");
  assert.match(providerRequest.messages[0].content, /illustrative stock photography/);
  assert.match(providerRequest.messages[0].content, /awaiting confirmation/);
  assert.deepEqual(providerRequest.messages.slice(1).map(({ role }) => role), ["user", "assistant", "user"]);
  assert.equal(requestOptions.headers.Authorization, `Bearer ${mockApiKey}`);
  assert.doesNotMatch(JSON.stringify(response.payload), new RegExp(mockApiKey));
});

test("returns a generic error when the AI provider is unavailable", async () => {
  process.env.OPENAI_API_KEY = mockApiKey;
  global.fetch = async () => ({ ok: false, status: 401, text: async () => "secret upstream detail" });
  const response = createResponse();
  await handler(createRequest({ body: { messages: [{ role: "user", content: "What services are available?" }] } }), response);
  assert.equal(response.statusCode, 502);
  assert.doesNotMatch(JSON.stringify(response.payload), /secret upstream detail|test-key/);
});

test("knowledge base covers the published pages without inventing confirmed details", () => {
  assert.match(knowledgeBase, /founded in 2007/);
  assert.match(knowledgeBase, /solar and photovoltaic energy/);
  assert.match(knowledgeBase, /quality assurance and standardisation/);
  assert.match(knowledgeBase, /not verified XOA projects/);
  assert.match(knowledgeBase, /awaiting confirmation/);
  assert.doesNotMatch(knowledgeBase, /\+?\d[\d ()-]{7,}/);
});