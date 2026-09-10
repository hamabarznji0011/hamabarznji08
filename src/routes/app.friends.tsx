import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Copy,
  LogOut,
  Plus,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, useApp, type Friend, type Group } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";

export const Route = createFileRoute("/app/friends")({
  head: () => ({
    meta: [
      { title: "هاوڕێکان — مار و پەیژە" },
      { name: "description", content: "چاتی تایبەت و گروپی لەگەڵ هاوڕێکانت." },
      { property: "og:title", content: "هاوڕێکان — مار و پەیژە" },
      { property: "og:description", content: "چات و گروپەکانت لە یاری مار و پەیژە." },
    ],
  }),
  component: FriendsTab,
});

type View = "friends" | "groups";

function FriendsTab() {
  const { visibleFriends, groups, unreadFor, friendRequests } = useApp();
  const [view, setView] = useState<View>("friends");
  const [openFriend, setOpenFriend] = useState<Friend | null>(null);
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [popup, setPopup] = useState<{ type: "friend" | "group"; id: string } | null>(null);

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <button
        onClick={() => setCreating(true)}
        aria-label="دروستکردنی گروپ"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-full"
      >
        <Plus className="size-5 text-primary" />
      </button>

      <button
        onClick={() => setRequestsOpen(true)}
        aria-label="هاوڕێی نوێ"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] left-36 flex size-11 items-center justify-center rounded-full"
      >
        <UserPlus className="size-5 text-primary" />
        {friendRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {friendRequests.length}
          </span>
        )}
      </button>


      <div className="glass relative mb-5 flex rounded-2xl p-1">
        <span
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-primary shadow-[var(--shadow-glow)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: view === "friends" ? "translateX(0)" : "translateX(-100%)" }}
        />
        {(["friends", "groups"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              view === v ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {v === "friends" ? "هاوڕێکان" : "گروپەکان"}
          </button>
        ))}
      </div>

      {view === "friends" ? (
        <div className="space-y-3">
          {visibleFriends.map((f) => {
            const unread = unreadFor(f.id);
            return (
              <div
                key={f.id}
                className="glass animate-rise-in flex items-center gap-3 rounded-2xl p-3"
              >
                <button
                  onClick={() => setPopup({ type: "friend", id: f.id })}
                  className="press relative"
                  aria-label={`ڕێکخستنی ${f.name}`}
                >
                  <img src={f.avatar} alt={f.name} className="size-12 rounded-full bg-secondary" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setOpenFriend(f)}
                  className="press flex-1 text-right"
                >
                  <p className="font-bold">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.points} خاڵ</p>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="glass animate-rise-in flex items-center gap-3 rounded-2xl border-primary/30 p-3"
            >
              <button
                onClick={() => setPopup({ type: "group", id: g.id })}
                className="press flex size-12 items-center justify-center rounded-full bg-primary/25"
                aria-label={`ڕێکخستنی ${g.name}`}
              >
                <Users className="size-6 text-primary" />
              </button>
              <button onClick={() => setOpenGroup(g)} className="press flex-1 text-right">
                <p className="font-bold">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.memberIds.length} ئەندام</p>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(g.code);
                  toast.success("کۆدەکە کۆپی کرا");
                }}
                className="press flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-sm font-bold text-primary"
              >
                <Copy className="size-4" />
                {g.code}
              </button>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">هیچ گروپێک نییە</p>
          )}
        </div>
      )}

      {popup && <ActionPopup popup={popup} onClose={() => setPopup(null)} />}
      {creating && <CreateGroup onClose={() => setCreating(false)} />}
      {openFriend && <DirectChat friend={openFriend} onClose={() => setOpenFriend(null)} />}
      {openGroup && <GroupChat group={openGroup} onClose={() => setOpenGroup(null)} />}
    </section>
  );
}

function ActionPopup({
  popup,
  onClose,
}: {
  popup: { type: "friend" | "group"; id: string };
  onClose: () => void;
}) {
  const { blockFriend, leaveGroup } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-10" onClick={onClose}>
      <div
        className="glass-strong animate-soft-in w-full max-w-xs rounded-3xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {popup.type === "friend" ? (
          <button
            onClick={() => {
              blockFriend(popup.id);
              toast.success("بلۆک کرا");
              onClose();
            }}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/20 py-3 font-bold text-destructive"
          >
            <Ban className="size-5" />
            بلۆککردن
          </button>
        ) : (
          <button
            onClick={() => {
              leaveGroup(popup.id);
              toast.success("گروپەکە جێهێشترا");
              onClose();
            }}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/20 py-3 font-bold text-destructive"
          >
            <LogOut className="size-5" />
            جێهێشتنی گروپ
          </button>
        )}
      </div>
    </div>
  );
}

function CreateGroup({ onClose }: { onClose: () => void }) {
  const { visibleFriends, createGroup } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  useHideChrome();

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.error("زۆرترین ٤ ئەندام");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold text-panel-foreground">گروپی نوێ</h2>
        <button
          onClick={() => {
            if (selected.length === 0) {
              toast.error("هاوڕێ هەڵبژێرە");
              return;
            }
            createGroup(name.trim() || "گروپی نوێ", selected);
            toast.success("گروپ دروستکرا");
            onClose();
          }}

          aria-label="پشتڕاستکردنەوە"
          className="press flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="size-5" />
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ناوی گروپ"
        className="mt-5 w-full rounded-2xl border border-panel-border bg-panel-foreground/5 px-4 py-3 text-sm text-panel-foreground outline-none placeholder:text-panel-muted focus:border-primary"
      />

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {visibleFriends.map((f) => {
          const on = selected.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`press flex w-full items-center gap-3 rounded-2xl border p-3 transition-all ${
                on ? "border-primary bg-primary/15 text-panel-foreground" : "border-panel-border bg-panel-foreground/5 text-panel-foreground"
              }`}
            >
              <img src={f.avatar} alt={f.name} className="size-11 rounded-full bg-secondary" />
              <span className="flex-1 text-right font-bold">{f.name}</span>
              {on && <Check className="size-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChatBubble({
  mine,
  text,
  at,
  author,
  accent,
}: {
  mine: boolean;
  text: string;
  at: number;
  author?: string | undefined;
  accent?: boolean;
}) {
  const codeMatch = /^\d{6}$/.test(text.trim());
  const { joinGroupByCode } = useApp();

  return (
    <div className={`flex flex-col ${mine ? "items-start" : "items-end"}`}>
      {author && <span className="mb-0.5 text-[10px] text-panel-muted">{author}</span>}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
          mine
            ? "bg-primary text-primary-foreground"
            : accent
              ? "bg-accent/25 text-panel-foreground"
              : "bg-panel-foreground/5 text-panel-foreground"
        }`}
      >
        {codeMatch ? (
          <button
            onClick={() => {
              const g = joinGroupByCode(text.trim());
              toast.success(g ? `چوویتە ناو ${g.name}` : "کۆدەکە دروست نییە");
            }}
            className="font-bold text-emerald-glow underline"
          >
            {text}
          </button>
        ) : (
          text
        )}
      </div>
      <span className="mt-1 text-[10px] text-panel-muted">{formatTime(at)}</span>
    </div>
  );
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex items-center gap-2 pt-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="نامەیەک بنووسە..."
        className="flex-1 rounded-2xl border border-panel-border bg-panel-foreground/5 px-4 py-3 text-sm text-panel-foreground outline-none placeholder:text-panel-muted focus:border-primary"
      />
      {text.trim() && (
        <button
          onClick={() => {
            onSend(text.trim());
            setText("");
          }}
          aria-label="ناردن"
          className="press animate-soft-in flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Send className="size-5 -scale-x-100" />
        </button>
      )}
    </div>
  );
}

function DirectChat({ friend, onClose }: { friend: Friend; onClose: () => void }) {
  const { directMessages, sendDirect, markRead } = useApp();
  useHideChrome();
  useEffect(() => {
    markRead(friend.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend.id]);
  const messages = directMessages[friend.id] ?? [];

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <img src={friend.avatar} alt={friend.name} className="size-10 rounded-full bg-secondary" />
          <span className="font-bold text-panel-foreground">{friend.name}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar py-2">
        {messages.map((m) => (
          <ChatBubble key={m.id} mine={m.senderId === "me"} text={m.text} at={m.at} />
        ))}
      </div>

      <Composer onSend={(t) => sendDirect(friend.id, t)} />
    </div>
  );
}

function GroupChat({ group, onClose }: { group: Group; onClose: () => void }) {
  const { groupMessages, sendGroup, friends } = useApp();
  useHideChrome();
  const messages = groupMessages[group.id] ?? [];
  const nameOf = (id: string) => friends.find((f) => f.id === id)?.name ?? "ئەندام";

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/30">
            <Users className="size-5 text-accent" />
          </span>
          <div>
            <p className="font-bold text-panel-foreground">{group.name}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(group.code);
                toast.success("کۆدەکە کۆپی کرا");
              }}
              className="text-xs font-bold text-emerald-700"
            >
              {group.code}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar py-2">
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            mine={m.senderId === "me"}
            text={m.text}
            at={m.at}
            accent
            author={m.senderId === "me" ? undefined : nameOf(m.senderId)}
          />
        ))}
      </div>

      <Composer onSend={(t) => sendGroup(group.id, t)} />
    </div>
  );
}
