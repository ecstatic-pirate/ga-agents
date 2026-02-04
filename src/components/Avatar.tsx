"use client";

type AvatarProps = {
  initials: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "busy" | "offline";
  isAgent?: boolean;
  agentType?: "cara" | "lena";
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-10 h-10 text-sm",
};

const statusColors = {
  online: "bg-[#92c353]",
  away: "bg-[#ffaa44]",
  busy: "bg-[#c4314b]",
  offline: "bg-[#8a8886]",
};

// Teams avatar colors - based on initials hash
const avatarColors = [
  "#c4314b", // Red
  "#9b59b6", // Purple
  "#2b2b40", // Indigo
  "#0078d4", // Blue
  "#00b7c3", // Teal
  "#107c10", // Green
  "#ffaa44", // Orange
  "#2b2b40", // Violet
  "#038387", // Dark teal
  "#ca5010", // Dark orange
];

function getAvatarColor(initials: string, isAgent?: boolean, agentType?: "cara" | "lena"): string {
  if (isAgent) {
    return agentType === "cara" ? "#2b2b40" : "#0078d4"; // Purple for CARA, Blue for LENA
  }

  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Avatar({
  initials,
  size = "md",
  status,
  isAgent,
  agentType,
}: AvatarProps) {
  const bgColor = getAvatarColor(initials, isAgent, agentType);

  // Use "CA" for CARA and "LE" for LENA
  const displayInitials = isAgent
    ? (agentType === "cara" ? "CA" : "LE")
    : initials;

  return (
    <div className="avatar-container">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ backgroundColor: bgColor }}
      >
        <span className="leading-none">{displayInitials}</span>
      </div>
      {status && (
        <span
          className={`status-indicator ${statusColors[status]}`}
          style={{
            borderColor: "#1a1a1a",
          }}
        />
      )}
    </div>
  );
}
