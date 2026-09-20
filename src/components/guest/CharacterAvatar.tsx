import type { Character } from "@/lib/types";

const portraitIds = ["maya", "tom", "yuki", "nuri", "sori", "dal"];

export function CharacterAvatar({
  character,
  size = 48,
  portrait = false,
}: {
  character: Character;
  size?: number;
  portrait?: boolean;
}) {
  const index = portraitIds.indexOf(character.id);
  return (
    <span
      aria-hidden="true"
      className={`character-avatar${portrait ? " character-portrait" : ""}`}
      style={{
        ...(portrait ? {} : { width: size, height: size }),
        backgroundColor: character.color,
        ...(index >= 0
          ? {
              backgroundImage: "url('/characters/seoul-friends.webp')",
              backgroundPosition: `${(index % 3) * 50}% ${index < 3 ? 0 : 100}%`,
            }
          : {}),
      }}
    >
      {index < 0 ? character.name.ko.slice(0, 1) : null}
    </span>
  );
}
