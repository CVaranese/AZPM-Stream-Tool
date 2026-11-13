// Screenshot a page in headless Chrome after a real-time wait, printing console output.
// usage: node capture.js <url> <out.png> [waitMs]
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const [url, out, waitArg] = process.argv.slice(2);
const waitMs = Number(waitArg || 5000);
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9333;
const prof = path.join(__dirname, "prof-cdp");

const proc = spawn(chrome, [
  "--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`,
  `--user-data-dir=${prof}`, "--autoplay-policy=no-user-gesture-required",
  "--window-size=1920,1080", "--force-device-scale-factor=1", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (u) => new Promise((res, rej) => {
  http.get(u, (r) => { let d = ""; r.on("data", (c) => d += c); r.on("end", () => res(JSON.parse(d))); }).on("error", rej);
});

(async () => {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await getJson(`http://127.0.0.1:${port}/json`); break; } catch { await sleep(200); }
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => {
    const msgId = ++id; pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    if (msg.method === "Runtime.consoleAPICalled") {
      console.log("console:", msg.params.args.map((a) => a.value ?? a.description).join(" "));
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      console.log("exception:", d.exception?.description || d.text);
    }
    if (msg.method === "Log.entryAdded") {
      console.log("log:", msg.params.entry.level, msg.params.entry.text, msg.params.entry.url || "");
    }
  };
  await new Promise((r) => ws.onopen = r);
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await sleep(waitMs);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  require("fs").writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log("wrote", out);
  ws.close();
  proc.kill();
  process.exit(0);
})();
