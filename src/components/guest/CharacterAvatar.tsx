import type { Character } from "@/lib/types";

// Small, local vector portraits: no image service or remote assets required.
export function CharacterAvatar({
  character,
  size = 48,
}: {
  character: Character;
  size?: number;
}) {
  const variant = ["maya", "tom", "yuki", "nuri", "sori", "dal"].indexOf(
    character.id,
  );
  const backgrounds = [
    "#e8d9ef",
    "#dce5cb",
    "#f8dfce",
    "#f1dbad",
    "#f3c7b6",
    "#d4dff2",
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className="character-avatar"
    >
      <rect
        width="100"
        height="100"
        rx="28"
        fill={backgrounds[variant] ?? "#e3ded4"}
      />
      <circle cx="77" cy="22" r="17" fill="white" fillOpacity=".35" />
      <path d="M16 100c2-24 15-35 34-35s32 11 34 35" fill={character.color} />
      <path
        d="M29 43c0-21 10-29 22-29 17 0 25 13 24 30l-3 28H26z"
        fill="#32302c"
      />
      <rect x="43" y="59" width="15" height="20" rx="7" fill="#dcae8a" />
      <ellipse cx="51" cy="44" rx="20" ry="25" fill="#efc8a5" />
      {variant === 0 ? (
        <path
          d="M25 75c-5-45 4-62 26-62 28 0 33 34 26 65l-13-9c9-18 5-42-13-45-19 8-23 26-13 46z"
          fill="#766088"
        />
      ) : (
        <path
          d="M29 41c-4-21 11-32 25-28 20 0 25 17 20 31l-8-18c-11 13-25 11-30 8l-5 15z"
          fill={variant === 1 ? "#95613b" : "#32302c"}
        />
      )}
      <circle cx="44" cy="45" r="1.7" fill="#39332d" />
      <circle cx="60" cy="45" r="1.7" fill="#39332d" />
      <path
        d="M46 57q6 5 12-1"
        stroke="#a66651"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {variant === 4 ? (
        <g stroke="#39332d" strokeWidth="1.8">
          <rect x="36" y="39" width="15" height="12" rx="4" />
          <rect x="54" y="39" width="15" height="12" rx="4" />
          <path d="M51 44h3" />
        </g>
      ) : null}
      {variant === 5 ? (
        <path d="M27 31c2-27 47-27 49 0H27z" fill="#597490" />
      ) : null}
      <path
        d="m38 78 13 10 13-10"
        stroke="white"
        strokeOpacity=".5"
        strokeWidth="2"
      />
    </svg>
  );
}
