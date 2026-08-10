function Notification({ message, type, onClose }) {
  if (!message) return null;

  const background =
    type === "success"
      ? "#16a34a"
      : type === "error"
      ? "#dc2626"
      : "#2563eb";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background,
        color: "white",
        padding: "15px 20px",
        borderRadius: "10px",
        boxShadow: "0 6px 12px rgba(0,0,0,.2)",
        zIndex: 9999,
        minWidth: "280px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{message}</span>

        <button
          onClick={onClose}
          style={{
            marginLeft: "15px",
            background: "transparent",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Notification;