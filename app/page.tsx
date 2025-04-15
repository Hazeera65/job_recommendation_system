import ChatInterface from "@/components/chat-interface"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-teal-50 to-slate-50">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal-700 mb-2">Asha - Your JobsForHer Assistant</h1>
          <p className="text-slate-600">Helping women discover career opportunities, events, and mentorship</p>
        </header>
        <ChatInterface />
      </div>
    </main>
  )
}
