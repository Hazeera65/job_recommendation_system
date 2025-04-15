import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

type Message = {
  from: "user" | "bot"
  text: string
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.from === "user"

  return (
    <div className={cn("flex items-start gap-3 mb-4", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
          isUser ? "bg-slate-100 text-slate-500" : "bg-teal-100 text-teal-600",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[85%]",
          isUser ? "bg-slate-100 text-slate-700" : "bg-white border border-teal-100 text-slate-700 shadow-sm",
        )}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                {children}
              </a>
            ),
            ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">{children}</code>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-teal-200 pl-3 italic my-2">{children}</blockquote>
            ),
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  )
}
