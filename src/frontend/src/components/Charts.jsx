import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Charts({ backups }) {
  const success = backups.filter(
    (b) => b.status.toLowerCase() === "success"
  ).length;

  const failed = backups.filter(
    (b) => b.status.toLowerCase() === "failed"
  ).length;

  const uploaded = backups.filter((b) => b.upload_status).length;

  const notUploaded = backups.length - uploaded;

  const pieData = {
    labels: ["Success", "Failed"],
    datasets: [
      {
        data: [success, failed],
        backgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  };

  const barData = {
    labels: ["Uploaded", "Not Uploaded"],
    datasets: [
      {
        label: "Backups",
        data: [uploaded, notUploaded],
        backgroundColor: ["#2563eb", "#f59e0b"],
      },
    ],
  };

  const lineData = {
    labels: backups.map((b) => `#${b.id}`),
    datasets: [
      {
        label: "Backup Records",
        data: backups.map((_, index) => index + 1),
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        tension: 0.4,
      },
    ],
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))",
        gap: "20px",
        margin: "30px 0",
      }}
    >
      <div className="card">
        <h3>Success vs Failed</h3>
        <Pie data={pieData} />
      </div>

      <div className="card">
        <h3>Upload Status</h3>
        <Bar data={barData} />
      </div>

      <div className="card">
        <h3>Backup Growth</h3>
        <Line data={lineData} />
      </div>
    </div>
  );
}

export default Charts;