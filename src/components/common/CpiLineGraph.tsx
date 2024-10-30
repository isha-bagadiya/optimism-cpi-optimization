import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Event {
  name: string;
  startDate: string;
  endDate: string;
  color: string;
}

interface Annotation {
  [key: string]: any;
}

// Extend ChartData to include annotations
interface CustomChartData extends ChartData<"line"> {
  annotations?: Annotation;
}

type CouncilName =
  | "Token House"
  | "Citizen House"
  | "Grants Council"
  | "Grants Council (Milestone & Metrics Sub-committee)"
  | "Security Council"
  | "Code of Conduct Council"
  | "Developer Advisory Board";

// Define the activeRedistributed type as a partial record
type ActiveRedistributed = Partial<Record<CouncilName, number>>;

type CPIResult = {
  filename: string;
  cpi: number;
  activeRedistributed?: ActiveRedistributed;
};

const CPILineGraph: React.FC<{
  cpiResults: CPIResult[];
  initialCPI: CPIResult[];
}> = ({ cpiResults, initialCPI }) => {
  // Event data
  const events: Event[] = [
    {
      name: "RPGF Round 2",
      startDate: "2022-01-06",
      endDate: "2023-03-30",
      color: "rgba(255,0,0,0.7)",
    },
    {
      name: "RPGF Round 3",
      startDate: "2023-10-14",
      endDate: "2024-01-11",
      color: "rgba(255,0,0,0.7)",
    },
    {
      name: "RPGF Round 4",
      startDate: "2024-06-03",
      endDate: "2024-01-11",
      color: "rgba(255,0,0,0.7)",
    },
    {
      name: "Season 3",
      startDate: "2023-01-26",
      endDate: "2023-04-05",
      color: "rgba(128,0,128,0.7)",
    },
    {
      name: "Season 4",
      startDate: "2023-06-08",
      endDate: "2023-09-20",
      color: "rgba(128,0,128,0.7)",
    },
    {
      name: "Season 5",
      startDate: "2024-01-04",
      endDate: "2024-12-31",
      color: "rgba(128,0,128,0.7)",
    },
    {
      name: "Season 6",
      startDate: "2024-06-27",
      endDate: "2024-12-31",
      color: "rgba(128,0,128,0.7)",
    },
  ];

  // Format dates from filenames to standardized ISO format
  const formatDate = (filename: string) => {
    if (!filename || typeof filename !== "string") {
      console.warn("Invalid filename received:", filename);
      return "";
    }

    const dateStr = filename.replace(".csv", "");

    // Handle both MM-DD-YYYY and YYYY-MM-DD formats
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts[0].length === 4) {
        // YYYY-MM-DD format - use the date string directly
        return dateStr;
      } else {
        // MM-DD-YYYY format - construct ISO string
        const month = parts[0].padStart(2, "0");
        const day = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return dateStr; // Return as is if no dashes found
  };

  // Get all unique dates from both datasets and sort chronologically
  const allDates = Array.from(
    new Set([
      ...initialCPI.map((item) => formatDate(item.filename)),
      ...cpiResults.map((item) => formatDate(item.filename)),
    ])
  )
    .filter(Boolean)
    .sort();

  const formatDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr || typeof dateStr !== "string") {
        // console.warn('Invalid date string received:', dateStr);
        return "";
      }

      // Create date object in UTC
      const date = new Date(dateStr + "T00:00:00Z");

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date created from:", dateStr);
        return dateStr;
      }

      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  };

  // Prepare annotations for events
  const annotations: { [key: string]: any } = {};
  events.forEach((event, index) => {
    const isRPGF = event.name.includes("RPGF");
    const yPosition = isRPGF ? "8%" : "12%";

    annotations[`eventLine${index}`] = {
      type: "line",
      xMin: event.startDate,
      xMax: event.startDate,
      borderColor: event.color,
      borderWidth: 1,
      borderDash: [6, 6],
    };
    annotations[`eventLabel${index}`] = {
      type: "label",
      xValue: event.startDate,
      yValue: yPosition,
      content: event.name,
      font: {
        size: 12,
        weight: "bold",
      },
      color: event.color,
      textAlign: "center",
      xAdjust: isRPGF ? 55 : 40,
      yAdjust: isRPGF ? -20 : 20,
    };
  });

  const data = {
    labels: allDates,
    datasets: [
      {
        label: "Historical CPI",
        data: allDates.map((date) => {
          const result = initialCPI.find(
            (r) => formatDate(r.filename) === date
          );
          return result ? result.cpi : null;
        }),
        borderColor: "rgb(75, 192, 192)",
        fill: false,
        tension: 0.4,
        spanGaps: true,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointHoverRadius: 5,
        order: 2,
      },
      {
        label: "Simulated CPI",
        data: allDates.map((date) => {
          const result = cpiResults.find(
            (r) => formatDate(r.filename) === date
          );
          return result ? result.cpi : null;
        }),
        borderColor: "rgb(255, 99, 132)",
        fill: false,
        tension: 0.4,
        spanGaps: true,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointHoverRadius: 5,
        order: 1,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Inter",
            size: 12,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      annotation: {
        annotations: annotations,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context) => {
            return formatDisplayDate(context[0].label);
          },
          label: (context) => {
            const date = context.label;
            let dataset;
            if (context.datasetIndex === 0) {
              dataset = initialCPI.find((r) => formatDate(r.filename) === date);
            } else {
              dataset = cpiResults.find((r) => formatDate(r.filename) === date);
            }

            const lines = [
              `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
            ];

            if (dataset?.activeRedistributed !== undefined) {
              lines.push("Active Councils:");

              Object.entries(dataset.activeRedistributed).forEach(
                ([council, value]) => {
                  if (value !== undefined) {
                    lines.push(`  ${council}: ${value.toFixed(2)}`);
                  }
                }
              );
            }

            if (
              context.datasetIndex ===
              context.chart.data.datasets.length - 1
            ) {
              lines.push("");
            }

            return lines;
          },
          labelTextColor: (context) => {
            return context.dataset.borderColor as string;
          },
        },
        // displayColors: true,
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Date",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 8,
          maxRotation: 45,
          minRotation: 45,
          callback: function (value) {
            return formatDisplayDate(value as string);
          },
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "CPI Value",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          precision: 4,
          callback: function (value) {
            return Number(value).toFixed(2);
          },
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg h-[500px] p-6">
      <Line data={data} options={options} />
    </div>
  );
};

export default CPILineGraph;
