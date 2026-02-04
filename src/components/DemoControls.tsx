"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { ChevronDown, Play, RotateCcw } from "lucide-react";

type DemoScenario = {
  id: string;
  name: string;
  agent: "cara" | "lena";
  description: string;
};

const scenarios: DemoScenario[] = [
  {
    id: "cara-full",
    name: "CARA: Alex's Negotiation Journey",
    agent: "cara",
    description: "3-month coaching journey from cold start to quarterly review",
  },
  {
    id: "lena-full",
    name: "LENA: Sarah's Training Program",
    agent: "lena",
    description: "Set up and deliver training for new managers",
  },
];

export default function DemoControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const { setActiveContact, triggerAgentResponse } = useChatStore();

  const handleStartScenario = (scenario: DemoScenario) => {
    setActiveContact(scenario.agent);
    setActiveScenario(scenario.id);
    setIsOpen(false);
  };

  const handleTriggerStep = (agent: "cara" | "lena", step: string) => {
    triggerAgentResponse(agent, step);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Main control button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2b2b40] hover:bg-[#3d3d5c] text-white rounded-md shadow-lg transition-all"
        >
          <Play size={14} fill="currentColor" />
          <span className="text-sm font-medium">Demo Controls</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#292828] border border-[#484644] rounded-md shadow-xl overflow-hidden">
            <div className="p-3 border-b border-[#3b3a39]">
              <h3 className="text-sm font-semibold text-white">
                Demo Scenarios
              </h3>
              <p className="text-xs text-[#a19f9d] mt-1">
                Select a scenario to start the demo
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="p-3 border-b border-[#3b3a39] last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            scenario.agent === "cara"
                              ? "bg-[#2b2b40]"
                              : "bg-[#0078d4]"
                          }`}
                        />
                        <span className="text-sm font-medium text-white">
                          {scenario.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#a19f9d] mt-1 ml-4">
                        {scenario.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartScenario(scenario)}
                      className="px-2 py-1 text-xs bg-[#3b3a39] hover:bg-[#484644] text-white rounded transition-colors"
                    >
                      Start
                    </button>
                  </div>

                  {/* Step triggers */}
                  {activeScenario === scenario.id && (
                    <div className="mt-3 ml-4 space-y-1">
                      <p className="text-xs text-[#c8c6c4] mb-2">
                        Trigger steps:
                      </p>
                      {scenario.agent === "cara" ? (
                        <>
                          <StepButton
                            label="Pre-meeting prep"
                            onClick={() =>
                              handleTriggerStep("cara", "preMeeting")
                            }
                          />
                          <StepButton
                            label="Post-meeting debrief"
                            onClick={() =>
                              handleTriggerStep("cara", "postMeeting")
                            }
                          />
                          <StepButton
                            label="Spaced repetition"
                            onClick={() =>
                              handleTriggerStep("cara", "spacedRepetition")
                            }
                          />
                          <StepButton
                            label="Quarterly review"
                            onClick={() =>
                              handleTriggerStep("cara", "quarterlyReview")
                            }
                          />
                        </>
                      ) : (
                        <>
                          <StepButton
                            label="Setup request"
                            onClick={() =>
                              handleTriggerStep("lena", "setupRequest")
                            }
                          />
                          <StepButton
                            label="Delivery to Jamie"
                            onClick={() =>
                              handleTriggerStep("lena", "deliveryJamie")
                            }
                          />
                          <StepButton
                            label="Progress report"
                            onClick={() => handleTriggerStep("lena", "report")}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reset button */}
            <div className="p-3 border-t border-[#3b3a39] bg-[#201f1f]">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs text-[#c8c6c4] hover:text-white hover:bg-[#3b3a39] rounded transition-colors"
              >
                <RotateCcw size={14} />
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-2 py-1.5 text-xs text-[#c8c6c4] hover:text-white hover:bg-[#3b3a39] rounded transition-colors"
    >
      → {label}
    </button>
  );
}
