"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  X,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CompanionChatProps {
  recipeId: string;
  recipeTitle: string;
}

function parseRecipeLinks(text: string): ReactNode[] {
  const regex = /\[RECIPE:([^:]+):([^\]]+)\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, id, name] = match;
    parts.push(
      <Link
        key={`${id}-${match.index}`}
        href={`/recipes/${id}`}
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {name}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function CompanionChat({ recipeId, recipeTitle }: CompanionChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !loading) {
      inputRef.current?.focus();
    }
  }, [open, loading]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/recipe-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't get a recommendation right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="fixed bottom-24 right-4 z-40 h-14 gap-2 rounded-full px-5 shadow-lg md:bottom-6 md:right-6"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">Suggest Pairings</span>
        </Button>
      )}

      {/* Chat Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col p-0 sm:max-w-md"
        >
          {/* Header */}
          <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
            <SheetTitle className="truncate text-base">
              Pairings for {recipeTitle}
            </SheetTitle>
            <SheetClose
              render={
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <X className="size-4" />
                  Close
                </Button>
              }
            />
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-4 pt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Get companion dish recommendations for{" "}
                  <span className="font-medium text-foreground">
                    {recipeTitle}
                  </span>
                </p>
                <div className="flex w-full max-w-xs flex-col gap-2">
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() =>
                      sendMessage(
                        `What dishes would pair well with ${recipeTitle}?`
                      )
                    }
                  >
                    <UtensilsCrossed className="size-4" />
                    Suggest a companion dish
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() =>
                      sendMessage(
                        `What drinks would pair well with ${recipeTitle}?`
                      )
                    }
                  >
                    <Wine className="size-4" />
                    Suggest a drink
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant"
                      ? parseRecipeLinks(msg.content)
                      : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t px-4 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pairings..."
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
