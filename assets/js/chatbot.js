(() => {
  const WELCOME_MESSAGE = "Hello! Welcome to XOA Solutions Limited. How can I help you today?";
  const STORAGE_KEY = "xoa-chatbot-history-v1";
  const MAX_HISTORY = 50;
  const MAX_MESSAGE_LENGTH = 2000;
  const suggestions = [
    "What does XOA Solutions Limited do?",
    "What services do you offer?",
    "Tell me about your solar energy solutions.",
    "How can I contact XOA?",
    "How can I partner with XOA?"
  ];

  const script = document.getElementById("xoa-chatbot-script");
  const endpoint = getSameOriginEndpoint(script?.dataset.apiEndpoint);
  const widget = document.createElement("div");
  widget.className = "xoa-chatbot";
  widget.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-label="Open XOA AI Assistant" aria-expanded="false" aria-controls="xoa-chat-window">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.3A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>
    </button>
    <section class="chatbot-window" id="xoa-chat-window" role="dialog" aria-modal="false" aria-labelledby="xoa-chat-title" hidden>
      <header class="chatbot-header">
        <div class="chatbot-brand">
          <span class="chatbot-brand-mark" aria-hidden="true">X</span>
          <div class="chatbot-heading">
            <h2 id="xoa-chat-title">XOA AI Assistant</h2>
            <p>Your intelligent business assistant.</p>
            <span class="chatbot-status" data-chat-status role="status"><span class="chatbot-status-dot" aria-hidden="true"></span><span data-chat-status-label>Available · demo mode</span></span>
          </div>
        </div>
        <div class="chatbot-header-actions">
          <button class="chatbot-icon-button" type="button" data-minimize aria-label="Minimize chat" aria-expanded="true" title="Minimize chat">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <button class="chatbot-icon-button" type="button" data-close aria-label="Close chat" title="Close chat">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
      </header>
      <div class="chatbot-content">
        <div class="chatbot-toolbar">
          <span>Conversation</span>
          <button class="chatbot-clear" type="button" data-clear>Clear conversation</button>
        </div>
        <div class="chatbot-transcript" data-transcript role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions">
          <div class="chatbot-messages" data-messages></div>
          <div class="chatbot-typing" data-typing role="status" aria-live="polite" hidden>
            <span class="chatbot-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>XOA is preparing a response</span>
          </div>
        </div>
        <div class="chatbot-suggestions" data-suggestions>
          <span class="chatbot-suggestions-label">Suggested questions</span>
          <div class="chatbot-suggestions-list">${suggestions.map((question) => `<button class="chatbot-suggestion" type="button" data-question="${question}">${question}</button>`).join("")}</div>
        </div>
        <form class="chatbot-form" data-chat-form>
          <label class="chatbot-sr-only" for="xoa-chat-input">Your message</label>
          <input class="chatbot-input" id="xoa-chat-input" name="message" type="text" placeholder="Ask a question..." maxlength="${MAX_MESSAGE_LENGTH}" autocomplete="off" required>
          <button class="chatbot-send" type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 3 10.4 13.6M21 3l-6.7 18-3.9-7.4L3 9.7 21 3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </form>
        <p class="chatbot-disclaimer" data-chat-disclaimer>Demo mode · Responses use information published on this website.</p>
      </div>
    </section>`;
  document.body.append(widget);

  const launcher = widget.querySelector(".chatbot-launcher");
  const panel = widget.querySelector(".chatbot-window");
  const minimizeButton = widget.querySelector("[data-minimize]");
  const closeButton = widget.querySelector("[data-close]");
  const clearButton = widget.querySelector("[data-clear]");
  const form = widget.querySelector("[data-chat-form]");
  const input = widget.querySelector(".chatbot-input");
  const sendButton = widget.querySelector(".chatbot-send");
  const transcript = widget.querySelector("[data-transcript]");
  const messagesElement = widget.querySelector("[data-messages]");
  const typingIndicator = widget.querySelector("[data-typing]");
  const suggestionsElement = widget.querySelector("[data-suggestions]");
  const statusElement = widget.querySelector("[data-chat-status]");
  const statusLabel = widget.querySelector("[data-chat-status-label]");
  const disclaimer = widget.querySelector("[data-chat-disclaimer]");
  let requestPending = false;
  let messages = loadHistory();

  if (!messages.length) messages = [{ role: "assistant", content: WELCOME_MESSAGE }];
  renderMessages();
  updateMode();

  launcher.addEventListener("click", () => {
    if (panel.hidden) openPanel();
    else closePanel(true);
  });

  closeButton.addEventListener("click", () => closePanel(true));

  minimizeButton.addEventListener("click", () => {
    const minimized = panel.classList.toggle("is-minimized");
    widget.querySelector(".chatbot-content").hidden = minimized;
    minimizeButton.setAttribute("aria-expanded", String(!minimized));
    minimizeButton.setAttribute("aria-label", minimized ? "Restore chat" : "Minimize chat");
    minimizeButton.title = minimized ? "Restore chat" : "Minimize chat";
  });

  clearButton.addEventListener("click", () => {
    messages = [{ role: "assistant", content: WELCOME_MESSAGE }];
    saveHistory();
    renderMessages();
    suggestionsElement.hidden = false;
    input.focus();
  });

  widget.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => sendMessage(button.dataset.question));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel(true);
  });

  function getSameOriginEndpoint(value) {
    if (!value?.trim()) return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      return url.origin === window.location.origin && /^https?:$/.test(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function openPanel() {
    panel.hidden = false;
    panel.classList.remove("is-minimized");
    widget.querySelector(".chatbot-content").hidden = false;
    minimizeButton.setAttribute("aria-expanded", "true");
    minimizeButton.setAttribute("aria-label", "Minimize chat");
    minimizeButton.title = "Minimize chat";
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close XOA AI Assistant");
    requestAnimationFrame(() => input.focus());
  }

  function closePanel(returnFocus) {
    panel.hidden = true;
    panel.classList.remove("is-minimized");
    widget.querySelector(".chatbot-content").hidden = false;
    minimizeButton.setAttribute("aria-expanded", "true");
    minimizeButton.setAttribute("aria-label", "Minimize chat");
    minimizeButton.title = "Minimize chat";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open XOA AI Assistant");
    if (returnFocus) launcher.focus();
  }

  function loadHistory() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored
        .filter((message) => message && ["assistant", "user"].includes(message.role) && typeof message.content === "string")
        .slice(-MAX_HISTORY)
        .map((message) => ({ role: message.role, content: message.content.slice(0, MAX_MESSAGE_LENGTH) }));
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {
      setStatus("Available · session only", "unavailable");
    }
  }

  function setStatus(label, state = "available") {
    statusLabel.textContent = label;
    statusElement.classList.toggle("is-connecting", state === "connecting");
    statusElement.classList.toggle("is-unavailable", state === "unavailable");
  }

  function updateMode() {
    if (!endpoint) return setDemoMode();

    setStatus("Checking AI service…", "connecting");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch(endpoint, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("AI service unavailable");
        return response.json();
      })
      .then((data) => {
        if (data.configured) {
          setStatus("AI assistant online");
          disclaimer.textContent = "Messages go to XOA's AI service. Do not share sensitive information.";
        } else {
          setDemoMode();
        }
      })
      .catch(() => setDemoMode("AI unavailable · demo mode", "unavailable"))
      .finally(() => window.clearTimeout(timeout));
  }

  function setDemoMode(label = "Available · demo mode", state = "available") {
    setStatus(label, state);
    disclaimer.textContent = "Demo mode · Responses use information published on this website.";
  }

  function renderMessages() {
    messagesElement.replaceChildren();
    messages.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = `chatbot-message chatbot-message--${message.role}`;
      const label = document.createElement("span");
      label.className = "chatbot-message-label";
      label.textContent = message.role === "assistant" ? "XOA Assistant" : "You";
      const content = document.createElement("span");
      content.textContent = message.content;
      bubble.append(label, content);
      messagesElement.append(bubble);
    });
    suggestionsElement.hidden = messages.length > 1;
    scrollTranscript();
  }

  function addMessage(role, content) {
    messages.push({ role, content });
    messages = messages.slice(-MAX_HISTORY);
    saveHistory();
    renderMessages();
  }

  function scrollTranscript() {
    requestAnimationFrame(() => { transcript.scrollTop = transcript.scrollHeight; });
  }

  async function sendMessage(rawMessage) {
    const content = rawMessage.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content || requestPending) return;

    requestPending = true;
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;
    suggestionsElement.hidden = true;
    addMessage("user", content);
    typingIndicator.hidden = false;
    scrollTranscript();

    try {
      const reply = endpoint ? await requestBackendReply() : await getDemoReply(content);
      addMessage("assistant", reply);
    } catch {
      addMessage("assistant", "I couldn't prepare a response just now. Please try again, or use the information and navigation on this website.");
      setStatus("Available · demo mode", "unavailable");
    } finally {
      requestPending = false;
      input.disabled = false;
      sendButton.disabled = false;
      typingIndicator.hidden = true;
      input.focus();
    }
  }

  async function getDemoReply(question) {
    await new Promise((resolve) => window.setTimeout(resolve, 360));
    return getVerifiedSiteReply(question);
  }

  async function requestBackendReply() {
    setStatus("Connecting…", "connecting");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages: messages.slice(-20) }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Chat service unavailable");
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Invalid chat response");
      setStatus("Online");
      disclaimer.textContent = "Messages go to XOA's AI service. Do not share sensitive information.";
      return data.reply.trim().slice(0, MAX_MESSAGE_LENGTH);
    } catch {
      setStatus("AI unavailable · demo mode", "unavailable");
      disclaimer.textContent = "The AI service could not be reached. Demo answers use information published on this website.";
      return `The AI service is temporarily unavailable. ${getVerifiedSiteReply(messages.at(-1)?.content || "")}`;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function getVerifiedSiteReply(question) {
    const text = question.toLowerCase();

    if (/partner|partnership|collaborat|supplier/.test(text)) {
      return "The website does not publish a partnership process or partner contact details. Its Contact page has an enquiry form preview, but that form needs backend integration before it can submit; contact details are awaiting confirmation.";
    }
    if (/contact|email|telephone|phone|whatsapp|get in touch|reach/.test(text)) {
      return "The Contact page lists email, telephone and WhatsApp details as awaiting confirmation. Its enquiry form is a frontend preview and cannot submit messages until a backend is connected. You can visit the Contact page from the site navigation.";
    }
    if (/solar|photovoltaic|\bpv\b|panel/.test(text)) {
      return "XOA lists solar and photovoltaic energy among its areas of work. The website describes this as an area focused on solutions that respond to changing energy needs; it does not publish specific installations, system specifications or performance results.";
    }
    if (/service|offer|capabilit|what does|what do you|who are|company|about xoa|background|history|founded|established/.test(text)) {
      return "XOA Solutions Limited is an engineering and energy company founded in 2007. Its published areas of work include solar and photovoltaic energy, renewable energy, power solutions, engineering, research and development, and quality assurance and standardisation.";
    }
    if (/renewable|wind|sustainable energy|clean energy/.test(text)) {
      return "The website describes renewable energy solutions as an area of work and expresses a commitment to sustainable development. It does not publish specific project details or performance claims.";
    }
    if (/engineer|technical|power solution|power system/.test(text)) {
      return "XOA lists power solutions and engineering solutions among its areas of work. The website describes an engineering-led perspective, but does not publish specific project specifications or client examples.";
    }
    if (/research|development|innovation|r&d/.test(text)) {
      return "Research and development is one of XOA's published service areas. The website says it values investigation, learning and innovation in response to emerging opportunities.";
    }
    if (/quality|assurance|standard|certif|accredit/.test(text)) {
      return "XOA lists quality assurance and standardisation among its service areas and states a commitment to quality. The website does not identify certifications or accreditations.";
    }
    if (/project|client|achievement|result|statistic|price|cost|budget/.test(text)) {
      return "The project gallery is explicitly illustrative and does not represent verified XOA projects. The website does not publish client names, project achievements, prices or performance statistics.";
    }

    return "I'm in demo mode and can answer using information published on this website. Try asking about XOA's background, services, solar and renewable energy, engineering, research and development, quality, or contact options.";
  }
})();