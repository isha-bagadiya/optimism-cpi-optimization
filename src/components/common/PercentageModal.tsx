"use client";
import { useContext, useEffect, useRef, useState } from "react";
import CPILineGraph from "./CpiLineGraph";
import sidebg from "../../../public/influencepagesideimage.svg";
import Image from "next/image";
import { IoInformationCircleOutline } from "react-icons/io5";
import { SavingContext } from "./SavingContext";

const councilInfo = {
  "Token House":
    "Oversees voting on governance proposals by OP token holders or their delegates.",
  "Citizen House":
    "Allocates funding for public goods and votes on certain governance vetoes.",
  "Grants Council":
    "Reviews and approves grant applications, ensuring milestone adherence and transparency.",
  "Grants Council (Milestone & Metrics Sub-committee)":
    "Specializes in defining and tracking project milestones to measure grant impact.",
  "Security Council":
    "Protects protocol integrity by managing security upgrades and coordinating emergency responses.",
  "Code of Conduct Council":
    "Enforces community conduct standards by reviewing and addressing violation reports.",
  "Developer Advisory Board":
    "Advises on technical decisions and reviews mission proposals, supporting technical governance.",
};

const councilFields = [
  "Token House",
  "Citizen House",
  "Grants Council",
  "Grants Council (Milestone & Metrics Sub-committee)",
  "Security Council",
  "Code of Conduct Council",
  "Developer Advisory Board",
];

const initialPercentages = {
  "Token House": "32.33",
  "Citizen House": "34.59",
  "Grants Council": "10.15",
  "Grants Council (Milestone & Metrics Sub-committee)": "2.82",
  "Security Council": "12.78",
  "Code of Conduct Council": "4.32",
  "Developer Advisory Board": "3.01",
};

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

type CPIData = {
  date: string;
  HHI: string;
  CPI: string;
  activeRedistributed?: ActiveRedistributed;
};

const PercentageModal: React.FC = () => {
  const [councilPercentages, setCouncilPercentages] =
    useState<Record<string, string>>(initialPercentages);
  const [totalPercentage, setTotalPercentage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cpiResults, setCpiResults] = useState<CPIResult[]>([]);
  const [initialCPI, setInitialCPI] = useState<CPIResult[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { isSaving } = useContext(SavingContext);

  const [loadingGraph, setLoadingGraph] = useState(false);

  // Initialize the refs array
  useEffect(() => {
    inputRefs.current = councilFields.map(() => null);
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    const loadInitialCPI = async () => {
      try {
        const response = await fetch("/csv.json");
        const data: CPIData[] = await response.json();
        // Convert CPIData to CPIResult format
        const formattedData: CPIResult[] = data.map((item) => ({
          filename: item.date,
          cpi: parseFloat(item.CPI),
        }));
        setInitialCPI(formattedData);
      } catch (err) {
        console.error("Error loading initial CPI:", err);
      }
    };

    loadInitialCPI();
  }, []);

  useEffect(() => {
    const total = Object.values(councilPercentages).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0
    );
    setTotalPercentage(Number(total.toFixed(2)));
  }, [councilPercentages]);

  const formatNumber = (num: number) => {
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const adjustLastEmptyField = () => {
    const currentTotal = Object.values(councilPercentages).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );

    if (currentTotal >= 100) return false;

    const emptyFields = councilFields.filter(
      (field) => !councilPercentages[field] || councilPercentages[field] === ""
    );

    if (emptyFields.length === 1) {
      const remainingValue = 100 - currentTotal;
      const formattedValue = formatNumber(remainingValue);

      setCouncilPercentages((prev) => ({
        ...prev,
        [emptyFields[0]]: formattedValue,
      }));
      return true;
    }
    return false;
  };

  const handlePercentageChange = (field: string, value: string) => {
    // Only allow numbers and decimal points
    const sanitizedValue = value.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    if ((sanitizedValue.match(/\./g) || []).length > 1) return;

    // Validate the number is between 0 and 100
    const numValue = parseFloat(sanitizedValue);
    if (numValue > 100) return;

    setCouncilPercentages((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const wasAdjusted = adjustLastEmptyField();

      if (wasAdjusted) {
        if (currentIndex === councilFields.length - 1) {
          if (!isButtonDisabled) {
            handleSubmit(e as unknown as React.FormEvent);
          }
        }
      } else {
        if (currentIndex < councilFields.length - 1) {
          inputRefs.current[currentIndex + 1]?.focus();
        } else if (!isButtonDisabled) {
          handleSubmit(e as unknown as React.FormEvent);
        }
      }
    }
  };

  const handleFocusOut = (currentIndex: number) => {
    if (currentIndex === councilFields.length - 2) {
      // Second to last field
      adjustLastEmptyField();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) {
      return;
    }
    setLoadingGraph(true);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCpiResults([]);
    try {
      // Validate all percentages are numbers
      const invalidFields = Object.entries(councilPercentages).filter(
        ([_, value]) =>
          isNaN(parseFloat(value)) ||
          parseFloat(value) < 0 ||
          parseFloat(value) > 100
      );

      if (invalidFields.length > 0) {
        throw new Error(
          `Invalid percentage values for: ${invalidFields
            .map(([field]) => field)
            .join(", ")}`
        );
      }

      // Store percentages
      const storeResponse = await fetch("/api/store-percentages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentages: councilPercentages,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.message || "Failed to store percentages");
      }

      const storeData = await storeResponse.json();
      // console.log("Store response:", storeData);

      // Calculate CPI
      const cpiResponse = await fetch("/api/calculate-cpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(councilPercentages),
      });

      if (!cpiResponse.ok) {
        throw new Error("Failed to calculate CPI");
      }

      const { results } = await cpiResponse.json();
      setCpiResults(results);
      // console.log("resultttt", results);
      setSuccess("Percentages submitted and CPI calculated successfully!");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setLoadingGraph(false);
    }
  };

  const isButtonDisabled = totalPercentage !== 100 || loading;

  return (
    <>
      <div className="text-white w-full h-max p-8 pt-0 relative flex justify-center items-center flex-col bg-dark-gray min-h-[100vh] overflow-x-hidden overflow-y-hidden">
        {/* Details Form */}
        <h1 className="font-mori font-semibold text-[#FEC5FB] text-2xl md:text-4xl lg:text-6xl tracking-tight text-center mb-6 md:mb-12">
          Add Percentage for HCCs
        </h1>

        <p className=" mb-14 text-gray-300 font-mori">
          This tool allows you to explore how adjusting the influence of
          different governance bodies impacts the overall Concentration of Power
          Index (CPI) in the Optimism Collective. By setting custom influence
          levels for each House, Council, and Committee, you can instantly see
          how these changes affect the distribution and concentration of voting
          power across the organization. <br />{" "}
          <span className="font-bold tracking-wider">
            Dive in to understand how governance dynamics shift based on your
            inputs!
          </span>
        </p>

        <form className="flex flex-col font-mori" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {councilFields.map((field, index) => (
              <div
                key={field}
                className="flex flex-col items-start justify-between space-y-2 lg:w-[30%] md:w-[28%] sm:w-[42%] w-full hau"
              >
                <div className="flex justify-start items-center gap-2 w-full">
                  <label className=" font-mori text-md font-bold tracking-tighter">
                    {field}
                  </label>
                  <div className="relative">
                    <div
                      className="text-[#FEC5FB] hover:text-[#FFD366] transition-colors cursor-pointer text-lg"
                      onMouseEnter={() => setActiveTooltip(field)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <IoInformationCircleOutline />
                    </div>
                    {activeTooltip === field && (
                      <div className="absolute z-10 w-60 p-2 bg-[#222222] text-white text-xs rounded-lg shadow-lg left-[-10px] top-6 border border-[#FEC5FB] opacity-70">
                        {councilInfo[field as keyof typeof councilInfo]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full relative">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className="w-full font-semibold p-4 bg-[#222222] rounded-lg outline-none border-none focus:ring-1 focus:ring-[#FEC5FB]"
                    value={councilPercentages[field] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validate input with regex to allow up to two decimal places
                      if (
                        /^\d{0,3}(\.\d{0,2})?$/.test(value) &&
                        Number(value) <= 100
                      ) {
                        handlePercentageChange(field, value);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => handleFocusOut(index)}
                    inputMode="decimal"
                    min="0"
                    max="100"
                    placeholder="Enter Percentage"
                    required
                  />
                  <p className="absolute right-3 top-1/3 transform -translate-y-1/2 font-extralight text-[16px] text-[#FFD366] my-3">
                    %
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPercentage > 100 ? (
            <p className="text-xs text-center my-4 text-[#FEC5FB] mt-10">
              Total exceeds 100%. Please adjust{" "}
              {(totalPercentage - 100).toFixed(2)}%.
            </p>
          ) : (
            <p className="text-xs text-center my-4 text-[#FEC5FB] mt-10">
              Remaining Perecentages: {(100 - totalPercentage).toFixed(2)}%
            </p>
          )}
          <button
            type="submit"
            aria-label="simulate"
            className={`button-50 max-w-max self-center px-10 py-1 font-redhat font-semibold ${
              isButtonDisabled ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isButtonDisabled || isSaving}
          >
            {loading ? "Simulating..." : "Simulate"}
          </button>

          <div className="absolute -right-[100px] top-[530px] md:top-[380px] h-[300px] w-[300px] overflow-hidden hidden sm:flex items-center justify-center">
            <Image src={sidebg} alt="sidebg" className="w-full h-auto"></Image>
          </div>

          {error && (
            <p className="text-red-500 mt-4 text-center mx-auto">{error}</p>
          )}

          {loadingGraph ? (
            <div className="mt-8 w-[95%] mx-auto flex items-center justify-center bg-white text-black rounded-lg shadow-lg p-6 h-[550px]">
              <div className="loader"></div>
            </div>
          ) : (
            (cpiResults.length > 0 || initialCPI.length > 0) && (
              <div className="mt-8 w-[95%] mx-auto flex items-center justify-center">
                <CPILineGraph cpiResults={cpiResults} initialCPI={initialCPI} />
              </div>
            )
          )}
        </form>
      </div>
    </>
  );
};

export default PercentageModal;
