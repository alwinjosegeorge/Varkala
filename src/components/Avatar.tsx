import type { Member } from "@/lib/types";

export function MemberAvatar({
  member,
  size = 40,
  ring = false,
}: { member: Member; size?: number; ring?: boolean }) {
  return (
    <div
      className={`grid place-items-center rounded-full shrink-0 font-bold text-secondary ${
        ring ? "ring-2 ring-white shadow-soft" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${member.color}, ${member.color}AA)`,
        fontSize: size * 0.42,
      }}
      aria-label={member.name}
    >
      <span>{member.emoji}</span>
    </div>
  );
}
