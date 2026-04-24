(() => {
  if (window.__atlasTraceInjected) return;
  window.__atlasTraceInjected = true;

  const MAX_BODY_CHARS = 20000;

  function nowIso() {
    return new Date().toISOString();
  }

  function isHttpUrl(url) {
    return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
  }

  function shouldCaptureContentType(contentType) {
    if (!contentType) return true;

    const type = contentType.toLowerCase();
    if (type.includes("image/svg+xml")) return false;
    if (type.includes("image/")) return false;
    if (type.includes("video/")) return false;
    if (type.includes("audio/")) return false;
    if (type.includes("font/")) return false;
    if (type.includes("application/octet-stream")) return false;

    return true;
  }

  function normalizeBody(text) {
    if (typeof text !== "string") return "";
    if (text.length <= MAX_BODY_CHARS) return text;
    return `${text.slice(0, MAX_BODY_CHARS)}\n...[truncated]`;
  }

  function bodyToString(body) {
    if (body == null) return "";
    if (typeof body === "string") return body;

    if (body instanceof URLSearchParams) {
      return body.toString();
    }

    if (body instanceof FormData) {
      const parts = [];
      body.forEach((value, key) => {
        if (typeof value === "string") {
          parts.push(`${key}=${value}`);
        } else {
          parts.push(`${key}=[blob:${value.type || "unknown"}:${value.size}]`);
        }
      });
      return parts.join("&");
    }

    if (body instanceof Blob) {
      return `[blob:${body.type || "unknown"}:${body.size}]`;
    }

    if (body instanceof ArrayBuffer) {
      return `[arraybuffer:${body.byteLength}]`;
    }

    if (ArrayBuffer.isView(body)) {
      return `[typedarray:${body.byteLength}]`;
    }

    if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
      return "[readable-stream-not-captured]";
    }

    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  }

  async function getFetchRequestBody(input, init) {
    if (init && "body" in init) {
      return normalizeBody(bodyToString(init.body));
    }

    if (typeof Request !== "undefined" && input instanceof Request) {
      try {
        return normalizeBody(await input.clone().text());
      } catch {
        return "";
      }
    }

    return "";
  }

  function postNetwork(payload) {
    window.postMessage(
      {
        source: "atlastrace_injected",
        type: "ATLASTRACE_NETWORK",
        payload,
      },
      "*"
    );
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = async function atlasTraceFetch(input, init) {
      const startedMs = Date.now();
      const method = (init && init.method) || (input && input.method) || "GET";
      const url = typeof input === "string" ? input : input && input.url;
      const requestBody = await getFetchRequestBody(input, init);

      try {
        const response = await originalFetch.apply(this, arguments);
        const durationMs = Date.now() - startedMs;
        const contentType = (response.headers.get("content-type") || "").toLowerCase();

        if (isHttpUrl(url) && shouldCaptureContentType(contentType)) {
          let responseBody = "";
          try {
            responseBody = normalizeBody(await response.clone().text());
          } catch (error) {
            responseBody = `[unreadable response body: ${String(error && error.message ? error.message : error)}]`;
          }

          postNetwork({
            type: "request",
            source: "fetch",
            ts: nowIso(),
            url,
            method: String(method).toUpperCase(),
            status: response.status,
            durationMs,
            contentType,
            requestBody,
            responseBody,
          });
        }

        return response;
      } catch (error) {
        if (isHttpUrl(url)) {
          postNetwork({
            type: "request",
            source: "fetch",
            ts: nowIso(),
            url,
            method: String(method).toUpperCase(),
            status: null,
            durationMs: Date.now() - startedMs,
            contentType: "",
            error: String(error && error.message ? error.message : error),
            requestBody,
            responseBody: "",
          });
        }
        throw error;
      }
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function atlasTraceOpen(method, url) {
    this.__atlasTraceMethod = method ? String(method).toUpperCase() : "GET";
    this.__atlasTraceUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function atlasTraceSend(body) {
    const xhr = this;
    const startedMs = Date.now();
    xhr.__atlasTraceRequestBody = normalizeBody(bodyToString(body));

    function emit(status, errorMessage) {
      const url = xhr.__atlasTraceUrl;
      if (!isHttpUrl(url)) return;

      const contentType = (xhr.getResponseHeader("content-type") || "").toLowerCase();
      if (!shouldCaptureContentType(contentType)) return;

      let responseBody = "";
      try {
        const rt = xhr.responseType;
        if (!rt || rt === "text" || rt === "json") {
          responseBody = normalizeBody(xhr.responseText || "");
        } else {
          responseBody = `[responseType ${rt || "unknown"} not captured]`;
        }
      } catch (error) {
        responseBody = `[unreadable response body: ${String(error && error.message ? error.message : error)}]`;
      }

      postNetwork({
        type: "request",
        source: "xhr",
        ts: nowIso(),
        url,
        method: xhr.__atlasTraceMethod || "GET",
        status,
        durationMs: Date.now() - startedMs,
        contentType,
        error: errorMessage || null,
        requestBody: xhr.__atlasTraceRequestBody || "",
        responseBody,
      });
    }

    xhr.addEventListener("load", () => emit(xhr.status, null));
    xhr.addEventListener("error", () => emit(null, "xhr_error"));
    xhr.addEventListener("abort", () => emit(null, "xhr_abort"));
    xhr.addEventListener("timeout", () => emit(null, "xhr_timeout"));

    return originalSend.apply(this, arguments);
  };
})();
