import type { Member } from "@/lib/types";

export function MemberAvatar({
  member,
  size = 40,
  ring = false,
}: { member: Member; size?: number; ring?: boolean }) {
  return (
    <div
      className={`relative grid place-items-center rounded-full shrink-0 font-bold text-secondary overflow-hidden ${
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
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span>{member.emoji}</span>
      )}
    </div>
  );
}
