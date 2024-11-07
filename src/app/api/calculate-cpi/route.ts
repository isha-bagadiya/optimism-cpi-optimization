import { connectDB } from "@/lib/db/cpimongo";
import { NextRequest, NextResponse } from "next/server";

type CouncilPercentages = Record<string, number>;
interface CouncilPercentage {
  active: number;
  inactive: number;
  redistributed: Record<string, number>;
  originalPercentages: Record<string, number>;
}

interface DateRange {
  start_date: string;
  end_date: string;
  HCC: Set<string>;
}

const dateRanges: DateRange[] = [
  {
    start_date: "2022-05-26",
    end_date: "2023-01-25",
    HCC: new Set(["th_vp", "ch_vp_r2"]),
  },
  {
    start_date: "2023-01-26",
    end_date: "2023-06-07",
    HCC: new Set(["th_vp", "ch_vp_r2", "gc_vp_s3"]),
  },
  {
    start_date: "2023-06-08",
    end_date: "2023-10-13",
    HCC: new Set(["th_vp", "ch_vp_r2", "gc_vp_s4"]),
  },
  {
    start_date: "2023-10-14",
    end_date: "2024-01-03",
    HCC: new Set(["th_vp", "ch_vp_r3", "gc_vp_s4"]),
  },
  {
    start_date: "2024-01-04",
    end_date: "2024-06-02",
    HCC: new Set([
      "th_vp",
      "ch_vp_r3",
      "gc_vp_s5",
      "gc_vp_mm_s5",
      "sc_vp_s5",
      "coc_vp_s5",
      "dab_vp_s5",
    ]),
  },
  {
    start_date: "2024-06-03",
    end_date: "2024-06-26",
    HCC: new Set([
      "th_vp",
      "ch_vp_r4",
      "gc_vp_s5",
      "gc_vp_mm_s5",
      "sc_vp_s5",
      "coc_vp_s5",
      "dab_vp_s5",
    ]),
  },
  {
    start_date: "2024-06-27",
    end_date: "2024-12-11",
    HCC: new Set([
      "th_vp",
      "ch_vp_r4",
      "gc_vp_s6",
      "gc_vp_mm_s6",
      "sc_vp_s6",
      "coc_vp_s6",
      "dab_vp_s6",
    ]),
  },
];

interface CouncilMapping {
  displayName: string;
  keys: string[];
}

const councilMappings: CouncilMapping[] = [
  {
    displayName: "Token House",
    keys: ["th_vp"],
  },
  {
    displayName: "Citizen House",
    keys: ["ch_vp_r2", "ch_vp_r3", "ch_vp_r4"],
  },
  {
    displayName: "Grants Council",
    keys: ["gc_vp_s3", "gc_vp_s4", "gc_vp_s5", "gc_vp_s6"],
  },
  {
    displayName: "Grants Council (Milestone & Metrics Sub-committee)",
    keys: ["gc_vp_mm_s5", "gc_vp_mm_s6"],
  },
  {
    displayName: "Security Council",
    keys: ["sc_vp_s5", "sc_vp_s6"],
  },
  {
    displayName: "Code of Conduct Council",
    keys: ["coc_vp_s5", "coc_vp_s6"],
  },
  {
    displayName: "Developer Advisory Board",
    keys: ["dab_vp_s5", "dab_vp_s6"],
  },
];

let cachedClient: any = null;
let cachedDb: any = null;

// function calculateCPI(
//   data: any[],
//   percentages: CouncilPercentages,
//   redistributedPercentages: Record<string, number>,
//   activeCouncils: Set<string>
// ): number {

//   // First, validate the input data
//   if (!data || data.length === 0) {
//     return 0;
//   }

//   return data.reduce((sum, delegate) => {

//     const getCouncilValue = (councilKeys: string[]): number => {
//       const activeKey = councilKeys.find(key => activeCouncils.has(key));
//       if (!activeKey) return 0;

//       const value = delegate.voting_power[activeKey];
//       // Ensure we're working with numbers
//       return typeof value === 'number'
//         ? value
//         : typeof value === 'string'
//           ? parseFloat(value)
//           : typeof value?.toString === 'function'
//             ? parseFloat(value.toString())
//             : 0;
//     };

//     // Get percentage values, ensuring they are numbers
//     const percentageValues = {
//       tokenHouse: (redistributedPercentages["Token House"] || 0) / 100,
//       citizenHouse: (redistributedPercentages["Citizen House"] || 0) / 100,
//       grantsCouncil: (redistributedPercentages["Grants Council"] || 0) / 100,
//       grantsMM: (redistributedPercentages["Grants Council (Milestone & Metrics Sub-committee)"] || 0) / 100,
//       securityCouncil: (redistributedPercentages["Security Council"] || 0) / 100,
//       coc: (redistributedPercentages["Code of Conduct Council"] || 0) / 100,
//       dab: (redistributedPercentages["Developer Advisory Board"] || 0) / 100
//     };

//     const influence =
//       parseFloat(delegate.voting_power.th_vp?.toString() || "0") *
//       percentageValues.tokenHouse +
//       getCouncilValue(["ch_vp_r2", "ch_vp_r3", "ch_vp_r4"]) *
//       percentageValues.citizenHouse +
//       getCouncilValue(["gc_vp_s3", "gc_vp_s4", "gc_vp_s5", "gc_vp_s6"]) *
//       percentageValues.grantsCouncil +
//       getCouncilValue(["gc_vp_mm_s5", "gc_vp_mm_s6"]) *
//       percentageValues.grantsMM +
//       getCouncilValue(["sc_vp_s5", "sc_vp_s6"]) *
//       percentageValues.securityCouncil+
//       getCouncilValue(["coc_vp_s5", "coc_vp_s6"]) * percentageValues.coc+
//       getCouncilValue(["dab_vp_s5", "dab_vp_s6"]) * percentageValues.dab;

//     return sum + Math.pow(influence, 2);
//   }, 0);
// }

function calculateCPI(
  data: any[],
  percentages: CouncilPercentages,
  redistributedPercentages: Record<string, number>,
  activeCouncils: Set<string>
): number {
  // First, validate the input data
  if (!data || data.length === 0) {
    return 0;
  }

  return data.reduce((sum, delegate) => {
    const parseVotingPower = (value: any): number => {
      if (typeof value === "undefined" || value === null) return 0;
      // Convert to string first to handle both number and string inputs
      const strValue = value.toString();
      // Parse with high precision
      return parseFloat(parseFloat(strValue).toFixed(10));
    };

    let influence = 0;
    for (const council of activeCouncils) {
      const votingPower =
        delegate.voting_power && delegate.voting_power[council] !== undefined
          ? parseVotingPower(delegate.voting_power[council])
          : 0;

      const percentage =
        redistributedPercentages[
          councilMappings.find((m) => m.keys.includes(council))?.displayName ||
            ""
        ];
      influence += (votingPower * (percentage || 0)) / 100;
    }
    return sum + Math.pow(influence, 2);
  }, 0);
}

function getActiveCouncils(date: Date): Set<string> {
  const dateString = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
  for (const range of dateRanges) {
    if (dateString >= range.start_date && dateString <= range.end_date) {
      return range.HCC;
    }
  }
  return new Set();
}

function calculateCouncilPercentages(
  activeCouncils: Set<string>,
  percentages: Record<string, number>
): CouncilPercentage {
  let activeTotal = 0;
  let inactiveTotal = 0;
  const activeCouncilsMap: Record<string, number> = {};
  const originalPercentages: Record<string, number> = {};

  for (const [council, percentage] of Object.entries(percentages)) {
    const percentageValue = Number(percentage);
    const mapping = councilMappings.find((m) => m.displayName === council);

    if (!mapping) continue;

    originalPercentages[council] = percentageValue;
    const isActive = mapping.keys.some((key: any) => activeCouncils.has(key));

    if (isActive) {
      activeTotal += percentageValue;
      activeCouncilsMap[council] = percentageValue;
    } else {
      inactiveTotal += percentageValue;
    }
  }

  const numberOfActiveCouncils = Object.keys(activeCouncilsMap).length;
  const redistributionPerCouncil =
    numberOfActiveCouncils > 0 ? inactiveTotal / numberOfActiveCouncils : 0;

  const redistributed: Record<string, number> = {};
  for (const [council, originalPercentage] of Object.entries(
    activeCouncilsMap
  )) {
    redistributed[council] = Number(
      (originalPercentage + redistributionPerCouncil).toFixed(2)
    );
  }

  return {
    active: Number(activeTotal.toFixed(2)),
    inactive: Number(inactiveTotal.toFixed(2)),
    redistributed,
    originalPercentages,
  };
}

class SimpleCache<T> {
  private cache: Map<string, { value: T; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item && Date.now() < item.expiry) {
      return item.value;
    }
    this.cache.delete(key);
    return undefined;
  }

  set(key: string, value: T, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }
}

const cache = new SimpleCache<any>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function getUniqueDates(db: any): Promise<Date[]> {
  const cachedDates = cache.get("uniqueDates");
  if (cachedDates) {
    return cachedDates;
  }

  const dates = await db
    .collection("delegate_data")
    .aggregate([
      { $group: { _id: "$date" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id" } },
    ])
    .toArray();

  const formattedDates = dates.map((d: any) => d.date);
  cache.set("uniqueDates", formattedDates, CACHE_DURATION);
  return formattedDates;
}

async function getDelegateDataForDate(db: any, date: Date) {
  const cacheKey = `delegateData_${date.toISOString()}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const data = await db
    .collection("delegate_data")
    .find({ date: date })
    .project({
      voting_power: 1,
      _id: 0,
    })
    .toArray();

  cache.set(cacheKey, data, CACHE_DURATION);
  return data;
}

// export async function POST(request: NextRequest) {
//   try {
//     const percentages = (await request.json()) as CouncilPercentages;
//     const client = await connectDB();
//     const db = client.db();

//     const dates = await getUniqueDates(db);

//     if (dates.length === 0) {
//       console.error("No dates found in the collection");
//       return NextResponse.json({ error: "No data available" }, { status: 404 });
//     }

//     const results = await Promise.all(
//       dates.map(async (date) => {
//         const activeCouncils = getActiveCouncils(new Date(date));
//         const data = await getDelegateDataForDate(db, new Date(date));

//         if (data.length === 0) {
//           console.warn(`No data found for date: ${date}`);
//           return null;
//         }

//         const councilPercentages = calculateCouncilPercentages(
//           activeCouncils,
//           percentages
//         );
//         const cpi = calculateCPI(
//           data,
//           percentages,
//           councilPercentages.redistributed,
//           activeCouncils
//         );

//         const activeRedistributed = Object.fromEntries(
//           Object.entries(councilPercentages.redistributed).filter(([council]) =>
//             councilMappings.some(
//               (mapping) =>
//                 mapping.keys.some((key) => activeCouncils.has(key)) &&
//                 mapping.displayName === council
//             )
//           )
//         );

//         const dateString = new Date(date).toISOString().split("T")[0];

//         return {
//           date: dateString,
//           cpi,
//           activeCouncils: Array.from(activeCouncils),
//           councilPercentages,
//           activeRedistributed,
//           filename: dateString,
//         };
//       })
//     );

//     const filteredResults = results.filter((result) => result !== null);

//     return NextResponse.json({ results: filteredResults });
//   } catch (error) {
//     console.error("Error calculating CPI:", error);
//     return NextResponse.json(
//       { error: "Failed to calculate CPI" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: NextRequest) {
  let client;
  try {
    const percentages = (await request.json()) as CouncilPercentages;
    client = await connectDB();
    const db = client.db();

    const dates = await getUniqueDates(db);

    if (dates.length === 0) {
      console.error("No dates found in the collection");
      return NextResponse.json({ error: "No data available" }, { status: 404 });
    }

    const results = await Promise.all(
      dates.map(async (date) => {
        const activeCouncils = getActiveCouncils(new Date(date));
        const data = await getDelegateDataForDate(db, new Date(date));

        if (data.length === 0) {
          console.warn(`No data found for date: ${date}`);
          return null;
        }

        const councilPercentages = calculateCouncilPercentages(
          activeCouncils,
          percentages
        );
        const cpi = calculateCPI(
          data,
          percentages,
          councilPercentages.redistributed,
          activeCouncils
        );

        const activeRedistributed = Object.fromEntries(
          Object.entries(councilPercentages.redistributed).filter(([council]) =>
            councilMappings.some(
              (mapping) =>
                mapping.keys.some((key) => activeCouncils.has(key)) &&
                mapping.displayName === council
            )
          )
        );

        const dateString = new Date(date).toISOString().split("T")[0];

        return {
          date: dateString,
          cpi,
          activeCouncils: Array.from(activeCouncils),
          councilPercentages,
          activeRedistributed,
          filename: dateString,
        };
      })
    );

    const filteredResults = results.filter((result) => result !== null);

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error("Error calculating CPI:", error);
    return NextResponse.json(
      { error: "Failed to calculate CPI" },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed successfully");
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}
