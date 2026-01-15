export default function InstallPage() {
    return (
      <main
        style={{
          maxWidth: 560,
          margin: "40px auto",
          padding: 16,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <img
            src="/icons/icon-192.png"
            alt="Appless icon"
            width={64}
            height={64}
            style={{ borderRadius: 14 }}
          />
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>Install Appless</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Add it to your Home Screen so it feels like an app.</p>
          </div>
        </div>
  
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 14, marginTop: 16 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>iPhone (Safari)</h2>
          <ol style={{ lineHeight: 1.9, marginBottom: 0 }}>
            <li>Open this link in <b>Safari</b> (not Instagram/TikTok in-app browser)</li>
            <li>Tap <b>Share</b> (square with arrow)</li>
            <li>Tap <b>Add to Home Screen</b></li>
            <li>Tap <b>Add</b></li>
          </ol>
        </div>
  
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 14, marginTop: 16 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Android (Chrome)</h2>
          <ol style={{ lineHeight: 1.9, marginBottom: 0 }}>
            <li>Open this link in <b>Chrome</b></li>
            <li>Tap the <b>⋮</b> menu</li>
            <li>Tap <b>Install app</b> or <b>Add to Home screen</b></li>
          </ol>
        </div>
  
        <p style={{ marginTop: 16, opacity: 0.8 }}>
          Tip: If it opens inside an in-app browser, use “Open in Safari/Chrome” first.
        </p>
      </main>
    );
  }
  