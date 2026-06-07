import { useState } from "react";

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", active: true },
  { icon: "🛡️", label: "Services" },
  { icon: "📅", label: "Bookings" },
  { icon: "💬", label: "Messages", badge: 3 },
  { icon: "⭐", label: "Karma & Reviews" },
  { icon: "🎒", label: "FTL / Lost Items" },
  { icon: "🔔", label: "Notifications", badge: 5 },
  { icon: "📊", label: "Dashboard" },
  { icon: "👤", label: "Profile" },
  { icon: "⚙️", label: "Settings" },
];

const QUICK_ACTIONS = [
  {
    color: "#3B5BFC",
    bg: "#E8ECFF",
    icon: "🗂️",
    title: "Find Services",
    sub: "Browse trusted local services near you",
  },
  {
    color: "#12B76A",
    bg: "#D1FAE5",
    icon: "📋",
    title: "My Bookings",
    sub: "View and manage your bookings",
  },
  {
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "💬",
    title: "Messages",
    sub: "Chat with your service providers",
  },
  {
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "📦",
    title: "FTL / Lost Items",
    sub: "Report or search for lost items",
  },
];

const SERVICES = [
  {
    img: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=200&q=80",
    name: "Electrician",
    rating: 4.8,
    reviews: 120,
    price: "Rs. 500 - 800",
  },
  {
    img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=80",
    name: "Plumber",
    rating: 4.7,
    reviews: 98,
    price: "Rs. 700 - 1200",
  },
  {
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    name: "Home Cleaning",
    rating: 4.6,
    reviews: 76,
    price: "Rs. 1000 - 2000",
  },
  {
    img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&q=80",
    name: "Painter",
    rating: 4.6,
    reviews: 65,
    price: "Rs. 800 - 1500",
  },
];

const BOOKINGS = [
  {
    icon: "🏠",
    title: "Home Cleaning",
    date: "June 6, 2025  •  10:00 AM",
    status: "Confirmed",
    statusColor: "#12B76A",
    statusBg: "#D1FAE5",
  },
  {
    icon: "🔧",
    title: "Plumber",
    date: "June 7, 2025  •  2:00 PM",
    status: "Pending",
    statusColor: "#F59E0B",
    statusBg: "#FEF3C7",
  },
  {
    icon: "⚡",
    title: "Electrician",
    date: "June 8, 2025  •  11:00 AM",
    status: "Completed",
    statusColor: "#6B7280",
    statusBg: "#F3F4F6",
  },
];

const NOTIFICATIONS = [
  {
    icon: "📅",
    iconBg: "#E8ECFF",
    text: "Your booking for Home Cleaning is confirmed.",
    time: "2 min ago",
  },
  {
    icon: "💬",
    iconBg: "#EDE9FE",
    text: "New message from Suman Tamang",
    time: "15 min ago",
  },
  {
    icon: "⭐",
    iconBg: "#FEF3C7",
    text: "You earned 10 karma points!",
    time: "1 hour ago",
  },
  {
    icon: "📦",
    iconBg: "#FEF3C7",
    text: "Your FTL report has been matched.",
    time: "2 hours ago",
  },
];

const MapPins = () => (
  <svg
    viewBox="0 0 600 170"
    style={{ width: "100%", height: "170px" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="600" height="170" fill="#E8EFEA" rx="0" />
    {/* Roads */}
    <path d="M0,85 Q150,70 300,85 Q450,100 600,85" stroke="#fff" strokeWidth="3" fill="none" />
    <path d="M200,0 Q220,85 200,170" stroke="#fff" strokeWidth="2.5" fill="none" />
    <path d="M380,0 Q400,85 390,170" stroke="#fff" strokeWidth="2" fill="none" />
    <path d="M0,120 Q300,110 600,125" stroke="#fff" strokeWidth="2" fill="none" />
    {/* River */}
    <path d="M480,0 Q520,60 500,100 Q480,140 510,170" stroke="#90CDF4" strokeWidth="8" fill="none" opacity="0.6" />
    {/* Pins */}
    {[
      { x: 110, y: 60, color: "#3B5BFC" },
      { x: 240, y: 90, color: "#12B76A" },
      { x: 330, y: 55, color: "#12B76A" },
      { x: 440, y: 70, color: "#7C3AED" },
      { x: 295, y: 125, color: "#7C3AED" },
      { x: 375, y: 140, color: "#F59E0B" },
    ].map((pin, i) => (
      <g key={i}>
        <circle cx={pin.x} cy={pin.y} r="13" fill={pin.color} opacity="0.15" />
        <circle cx={pin.x} cy={pin.y} r="8" fill={pin.color} />
        <circle cx={pin.x} cy={pin.y} r="3" fill="#fff" />
      </g>
    ))}
  </svg>
);

export default function HamroKarma() {
  const [activeNav, setActiveNav] = useState("Home");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "#F8F9FA",
        color: "#1A1A2E",
        fontSize: "14px",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          background: "#fff",
          borderRight: "1px solid #F0F0F0",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "22px 20px 18px",
            borderBottom: "1px solid #F5F5F5",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3B5BFC, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🌀
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E" }}>
            Hamro Karma
          </span>
        </div>

        {/* Nav Items */}
        <nav style={{ padding: "12px 0", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 20px",
                border: "none",
                background:
                  activeNav === item.label ? "#EEF2FF" : "transparent",
                color: activeNav === item.label ? "#3B5BFC" : "#4B5563",
                fontWeight: activeNav === item.label ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "0",
                fontSize: "13.5px",
                position: "relative",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: "16px", minWidth: "20px" }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid #F0F0F0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B5BFC, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            SS
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              Sabin Shrestha
            </div>
            <div style={{ color: "#9CA3AF", fontSize: "12px" }}>Customer</div>
          </div>
          <span style={{ fontSize: "14px", color: "#9CA3AF" }}>›</span>
        </div>

        {/* Logout */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            color: "#EF4444",
            cursor: "pointer",
            fontSize: "13.5px",
            fontWeight: 500,
            borderTop: "1px solid #F5F5F5",
          }}
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #F0F0F0",
            padding: "0 28px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <button
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              padding: "4px",
            }}
          >
            ☰
          </button>
          <div
            style={{
              flex: 1,
              maxWidth: "480px",
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: "8px",
              height: "38px",
            }}
          >
            <span style={{ color: "#9CA3AF", fontSize: "15px" }}>🔍</span>
            <span style={{ color: "#9CA3AF", fontSize: "13px" }}>
              Search services, providers...
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: "20px" }}>🔔</span>
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-5px",
                  background: "#EF4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "15px",
                  height: "15px",
                  fontSize: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                5
              </span>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B5BFC, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              SS
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
          {/* Greeting */}
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", color: "#1A1A2E" }}>
            Namaste, Sabin! 👋
          </h1>
          <p style={{ color: "#6B7280", margin: "0 0 24px", fontSize: "14px" }}>
            What would you like to do today?
          </p>

          {/* Quick Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            {QUICK_ACTIONS.map((a) => (
              <div
                key={a.title}
                style={{
                  background: "#fff",
                  border: "1px solid #F0F0F0",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: a.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  {a.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1A1A2E" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.4 }}>
                  {a.sub}
                </div>
                <div style={{ color: a.color, fontSize: "16px", marginTop: "2px" }}>→</div>
              </div>
            ))}
          </div>

          {/* Bottom Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
            {/* Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Popular Services */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #F0F0F0",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>
                    Popular Services Near You
                  </h2>
                  <span style={{ color: "#3B5BFC", fontSize: "13px", cursor: "pointer" }}>
                    View All
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {SERVICES.map((s) => (
                    <div
                      key={s.name}
                      style={{
                        border: "1px solid #F0F0F0",
                        borderRadius: "10px",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={s.img}
                        alt={s.name}
                        style={{
                          width: "100%",
                          height: "90px",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.target.style.background = "#E5E7EB";
                          e.target.style.height = "90px";
                        }}
                      />
                      <div style={{ padding: "10px 10px 12px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>
                          {s.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ color: "#F59E0B", fontSize: "12px" }}>★</span>
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>{s.rating}</span>
                          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                            ({s.reviews})
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #F0F0F0",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>
                    Nearby Providers on Map
                  </h2>
                  <button
                    style={{
                      background: "#EEF2FF",
                      color: "#3B5BFC",
                      border: "1px solid #C7D2FE",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    View All on Map ↗
                  </button>
                </div>
                <div
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid #E5E7EB",
                    position: "relative",
                  }}
                >
                  <MapPins />
                  {/* Zoom controls */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "#fff",
                      borderRadius: "6px",
                      border: "1px solid #E5E7EB",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "none",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      +
                    </button>
                    <button
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "none",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                      }}
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Upcoming Bookings */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #F0F0F0",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>
                    Your Upcoming Bookings
                  </h2>
                  <span style={{ color: "#3B5BFC", fontSize: "13px", cursor: "pointer" }}>
                    View All
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {BOOKINGS.map((b) => (
                    <div
                      key={b.title}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        paddingBottom: "14px",
                        borderBottom: "1px solid #F9FAFB",
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "10px",
                          background: "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        {b.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{b.date}</div>
                      </div>
                      <span
                        style={{
                          background: b.statusBg,
                          color: b.statusColor,
                          borderRadius: "6px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #F0F0F0",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>
                    Recent Notifications
                  </h2>
                  <span style={{ color: "#3B5BFC", fontSize: "13px", cursor: "pointer" }}>
                    View All
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {NOTIFICATIONS.map((n, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        paddingBottom: "14px",
                        borderBottom: i < NOTIFICATIONS.length - 1 ? "1px solid #F9FAFB" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "9px",
                          background: n.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {n.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12.5px", color: "#374151", lineHeight: 1.4 }}>
                          {n.text}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            background: "#fff",
            borderTop: "1px solid #F0F0F0",
            padding: "12px 28px",
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: "12px",
          }}
        >
          © 2025 Hamro Karma. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
