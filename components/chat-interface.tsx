"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Papa from "papaparse"
import Fuse from "fuse.js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Send, Bot, Loader2, Search, Calendar, Users, FileQuestion, UserPlus, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChatMessage from "@/components/chat-message"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Initialize Google Generative AI with a placeholder API key
// In production, this should be an environment variable
const genAI = new GoogleGenerativeAI("AIzaSyDKjOhaQO3WES0kcyejjh9H9pftG5XtPoo")

type Message = {
  from: "user" | "bot"
  text: string
}

// Define types based on the provided schemas
type JobListing = {
  "Job Title": string
  "Company Name": string
  Location: string
  Industry: string
  Salary: string
  "Job Type": string
  "Required Skills": string
  "Application Deadline": string
}

type CommunityEvent = {
  "Event Name": string
  "Event Type": string
  Date: string
  Time: string
  Location: string
  "Host Organization": string
  Description: string
}

type MentorshipProgram = {
  "Program Name": string
  "Mentor Name": string
  "Area of Expertise": string
  Duration: string
  "Application Deadline": string
  "Contact Info": string
}

type FAQ = {
  Question: string
  Answer: string
}

// Dataset URLs
const DATA_URLS = {
  jobs: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/job_listings-RdU9cY8EQvmHRpiQagXSaEQXE5mSCQ.csv",
  events: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/community_events-p5dO2HulDkTV1Zj48C5LRCIkre9v4j.csv",
  mentorship:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mentorship_programs-cn1rjxHATZQOMeCqU0YxLZ2JdSZ2iq.csv",
  faqs: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/faqs-Y7Wq95HqnMTeeSuMOMSCl5VXNiUJRF.csv",
}

export default function ChatInterface() {
  const { toast } = useToast()
  const [input, setInput] = useState("")
  const [chat, setChat] = useState<Message[]>([])
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [mentorships, setMentorships] = useState<MentorshipProgram[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [jobsFuse, setJobsFuse] = useState<Fuse<JobListing> | null>(null)
  const [eventsFuse, setEventsFuse] = useState<Fuse<CommunityEvent> | null>(null)
  const [mentorshipFuse, setMentorshipFuse] = useState<Fuse<MentorshipProgram> | null>(null)
  const [faqsFuse, setFaqsFuse] = useState<Fuse<FAQ> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadingErrors, setLoadingErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Dialog states
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipProgram | null>(null)
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false)
  const [eventRegisterOpen, setEventRegisterOpen] = useState(false)
  const [mentorshipConnectOpen, setMentorshipConnectOpen] = useState(false)
  const [registrationEmail, setRegistrationEmail] = useState("")
  const [registrationName, setRegistrationName] = useState("")
  const [registrationMessage, setRegistrationMessage] = useState("")

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      const errors: string[] = []

      try {
        // Load Jobs Data
        const jobsResponse = await fetch(DATA_URLS.jobs)
        const jobsText = await jobsResponse.text()
        const jobsResult = Papa.parse<JobListing>(jobsText, {
          header: true,
          skipEmptyLines: true,
        })

        if (jobsResult.errors.length > 0) {
          errors.push("Error parsing jobs data")
        } else {
          setJobs(jobsResult.data)
          setJobsFuse(
            new Fuse(jobsResult.data, {
              keys: ["Job Title", "Company Name", "Location", "Industry", "Job Type", "Required Skills"],
              threshold: 0.4,
              includeScore: true,
            }),
          )
        }
      } catch (err) {
        console.error("Error loading jobs data:", err)
        errors.push("Failed to load jobs data")
      }

      try {
        // Load Events Data
        const eventsResponse = await fetch(DATA_URLS.events)
        const eventsText = await eventsResponse.text()
        const eventsResult = Papa.parse<CommunityEvent>(eventsText, {
          header: true,
          skipEmptyLines: true,
        })

        if (eventsResult.errors.length > 0) {
          errors.push("Error parsing events data")
        } else {
          setEvents(eventsResult.data)
          setEventsFuse(
            new Fuse(eventsResult.data, {
              keys: ["Event Name", "Event Type", "Location", "Host Organization", "Description"],
              threshold: 0.4,
              includeScore: true,
            }),
          )
        }
      } catch (err) {
        console.error("Error loading events data:", err)
        errors.push("Failed to load events data")
      }

      try {
        // Load Mentorship Data
        const mentorshipResponse = await fetch(DATA_URLS.mentorship)
        const mentorshipText = await mentorshipResponse.text()
        const mentorshipResult = Papa.parse<MentorshipProgram>(mentorshipText, {
          header: true,
          skipEmptyLines: true,
        })

        if (mentorshipResult.errors.length > 0) {
          errors.push("Error parsing mentorship data")
        } else {
          setMentorships(mentorshipResult.data)
          setMentorshipFuse(
            new Fuse(mentorshipResult.data, {
              keys: ["Program Name", "Mentor Name", "Area of Expertise", "Duration"],
              threshold: 0.4,
              includeScore: true,
            }),
          )
        }
      } catch (err) {
        console.error("Error loading mentorship data:", err)
        errors.push("Failed to load mentorship data")
      }

      try {
        // Load FAQs Data
        const faqsResponse = await fetch(DATA_URLS.faqs)
        const faqsText = await faqsResponse.text()
        const faqsResult = Papa.parse<FAQ>(faqsText, {
          header: true,
          skipEmptyLines: true,
        })

        if (faqsResult.errors.length > 0) {
          errors.push("Error parsing FAQs data")
        } else {
          setFaqs(faqsResult.data)
          setFaqsFuse(
            new Fuse(faqsResult.data, {
              keys: ["Question", "Answer"],
              threshold: 0.4,
              includeScore: true,
            }),
          )
        }
      } catch (err) {
        console.error("Error loading FAQs data:", err)
        errors.push("Failed to load FAQs data")
      }

      setLoadingErrors(errors)
      setDataLoading(false)

      // Add welcome message
      setChat([
        {
          from: "bot",
          text:
            "👋 Hi there! I'm Asha, your JobsForHer assistant. I can help you with:\n\n" +
            "- Finding job opportunities\n" +
            "- Discovering community events and sessions\n" +
            "- Exploring mentorship programs\n" +
            "- Answering your questions\n" +
            "- Assisting with registration\n" +
            "- Updating your profile\n\n" +
            "How can I assist you today?",
        },
      ])
    }

    loadData()
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  // Focus input on load
  useEffect(() => {
    if (!dataLoading) {
      inputRef.current?.focus()
    }
  }, [dataLoading])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Handle button actions
  const handleViewJobDetails = (job: JobListing) => {
    setSelectedJob(job)
    setJobDetailsOpen(true)
    // Reset form fields
    setRegistrationName("")
    setRegistrationEmail("")
    setRegistrationMessage("")
  }

  const handleRegisterForEvent = (event: CommunityEvent) => {
    setSelectedEvent(event)
    setEventRegisterOpen(true)
    // Reset form fields
    setRegistrationName("")
    setRegistrationEmail("")
    setRegistrationMessage("")
  }

  const handleConnectWithMentor = (mentorship: MentorshipProgram) => {
    setSelectedMentorship(mentorship)
    setMentorshipConnectOpen(true)
    // Reset form fields
    setRegistrationName("")
    setRegistrationEmail("")
    setRegistrationMessage("")
  }

  const handleSubmitEventRegistration = () => {
    if (!registrationEmail || !registrationName) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email to register.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Registration successful!",
      description: `You've registered for "${selectedEvent?.["Event Name"]}". Check your email for confirmation.`,
    })

    setEventRegisterOpen(false)

    // Add to chat history
    setChat((prev) => [
      ...prev,
      {
        from: "bot",
        text: `✅ You've successfully registered for "${selectedEvent?.["Event Name"]}"! A confirmation email has been sent to ${registrationEmail}.`,
      },
    ])
  }

  const handleSubmitMentorshipRequest = () => {
    if (!registrationEmail || !registrationName) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email to connect with this mentor.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Request sent!",
      description: `Your request to connect with ${selectedMentorship?.["Mentor Name"]} has been sent. You'll receive a response soon.`,
    })

    setMentorshipConnectOpen(false)

    // Add to chat history
    setChat((prev) => [
      ...prev,
      {
        from: "bot",
        text: `✅ Your request to connect with ${selectedMentorship?.["Mentor Name"]} for the "${selectedMentorship?.["Program Name"]}" program has been sent! You'll receive a response at ${registrationEmail} soon with further instructions to schedule your first meeting.`,
      },
    ])
  }

  const handleApplyForJob = () => {
    if (!registrationEmail || !registrationName) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email to apply for this job.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${selectedJob?.["Job Title"]}" at ${selectedJob?.["Company Name"]} has been submitted.`,
    })

    setJobDetailsOpen(false)

    // Add to chat history
    setChat((prev) => [
      ...prev,
      {
        from: "bot",
        text: `✅ Your application for "${selectedJob?.["Job Title"]}" at ${selectedJob?.["Company Name"]} has been submitted! You'll receive a confirmation at ${registrationEmail}.`,
      },
    ])
  }

  const handleSend = async () => {
    const userMessage = input.trim()
    if (!userMessage || isLoading) return

    setChat((prev) => [...prev, { from: "user", text: userMessage }])
    setInput("")
    setIsLoading(true)

    try {
      // Check for specific intents in the user message
      const lowerMessage = userMessage.toLowerCase()

      // Handle job-related queries
      if (
        lowerMessage.includes("job") ||
        lowerMessage.includes("career") ||
        lowerMessage.includes("work") ||
        lowerMessage.includes("position") ||
        lowerMessage.includes("employment") ||
        lowerMessage.includes("hiring")
      ) {
        if (jobsFuse && jobs.length > 0) {
          const jobMatches = jobsFuse.search(userMessage).slice(0, 3)

          if (jobMatches.length > 0) {
            const topJobs = jobMatches.map((match) => {
              const job = match.item
              return (
                `**${job["Job Title"]}** at ${job["Company Name"]}\n` +
                `📍 ${job.Location} | 💼 ${job.Industry} | 💰 ${job.Salary}\n` +
                `🔄 ${job["Job Type"]} | ⏰ Apply by: ${formatDate(job["Application Deadline"])}\n` +
                `🔑 Skills: ${job["Required Skills"]}`
              )
            })

            const response =
              "Here are some job opportunities that might interest you:\n\n" +
              topJobs.join("\n\n") +
              "\n\nWould you like to see more job listings or filter by a specific industry or location?"
            setChat((prev) => [...prev, { from: "bot", text: response }])
            setIsLoading(false)
            return
          }
        }
      }

      // Handle event-related queries
      else if (
        lowerMessage.includes("event") ||
        lowerMessage.includes("session") ||
        lowerMessage.includes("webinar") ||
        lowerMessage.includes("workshop") ||
        lowerMessage.includes("community") ||
        lowerMessage.includes("meetup")
      ) {
        if (eventsFuse && events.length > 0) {
          const eventMatches = eventsFuse.search(userMessage).slice(0, 3)

          if (eventMatches.length > 0) {
            const topEvents = eventMatches.map((match) => {
              const event = match.item
              return (
                `**${event["Event Name"]}**\n` +
                `📅 ${formatDate(event.Date)} at ${event.Time}\n` +
                `📍 ${event.Location} | 🏢 Hosted by: ${event["Host Organization"]}\n` +
                `ℹ️ ${event.Description}`
              )
            })

            const response =
              "Here are some upcoming events you might be interested in:\n\n" +
              topEvents.join("\n\n") +
              "\n\nWould you like to register for any of these events or see more options?"
            setChat((prev) => [...prev, { from: "bot", text: response }])
            setIsLoading(false)
            return
          }
        }
      }

      // Handle mentorship-related queries
      else if (
        lowerMessage.includes("mentor") ||
        lowerMessage.includes("mentorship") ||
        lowerMessage.includes("guidance") ||
        lowerMessage.includes("coach") ||
        lowerMessage.includes("advise") ||
        lowerMessage.includes("advisor")
      ) {
        if (mentorshipFuse && mentorships.length > 0) {
          const mentorMatches = mentorshipFuse.search(userMessage).slice(0, 3)

          if (mentorMatches.length > 0) {
            const topMentors = mentorMatches.map((match) => {
              const program = match.item
              return (
                `**${program["Program Name"]}**\n` +
                `👩‍💼 Mentor: ${program["Mentor Name"]}\n` +
                `🔍 Expertise: ${program["Area of Expertise"]}\n` +
                `⏱️ Duration: ${program.Duration}\n` +
                `📅 Apply by: ${formatDate(program["Application Deadline"])}\n` +
                `📧 Contact: ${program["Contact Info"]}`
              )
            })

            const response =
              "Here are some mentorship opportunities available now:\n\n" +
              topMentors.join("\n\n") +
              "\n\nWould you like to connect with any of these mentors or learn more about the programs?"
            setChat((prev) => [...prev, { from: "bot", text: response }])
            setIsLoading(false)
            return
          }
        }
      }

      // Handle FAQ queries
      else if (
        lowerMessage.includes("question") ||
        lowerMessage.includes("faq") ||
        lowerMessage.includes("how do i") ||
        lowerMessage.includes("what is") ||
        lowerMessage.includes("help") ||
        lowerMessage.includes("explain")
      ) {
        if (faqsFuse && faqs.length > 0) {
          const faqMatches = faqsFuse.search(userMessage).slice(0, 2)

          if (faqMatches.length > 0) {
            const topFaqs = faqMatches.map((match) => {
              const faq = match.item
              return `**Q: ${faq.Question}**\n\nA: ${faq.Answer}`
            })

            const response =
              "Here are some answers that might help:\n\n" +
              topFaqs.join("\n\n") +
              "\n\nDo you have any other questions I can help with?"
            setChat((prev) => [...prev, { from: "bot", text: response }])
            setIsLoading(false)
            return
          }
        }
      }

      // Handle signup-related queries
      else if (
        lowerMessage.includes("sign up") ||
        lowerMessage.includes("register") ||
        lowerMessage.includes("join") ||
        lowerMessage.includes("create account") ||
        lowerMessage.includes("signup")
      ) {
        const response =
          "I'd be happy to help you register! To create an account on JobsForHer:\n\n" +
          "1. Visit [our registration page](https://www.jobsforher.com/signup)\n" +
          "2. Fill in your basic details (name, email, password)\n" +
          "3. Complete your profile with your professional information\n" +
          "4. Verify your email address\n\n" +
          "Would you like me to guide you through any specific part of the registration process?"
        setChat((prev) => [...prev, { from: "bot", text: response }])
        setIsLoading(false)
        return
      }

      // Handle profile update queries
      else if (
        lowerMessage.includes("profile") ||
        lowerMessage.includes("update profile") ||
        lowerMessage.includes("edit profile") ||
        lowerMessage.includes("change my") ||
        lowerMessage.includes("modify my")
      ) {
        const response =
          "You can update your profile by following these steps:\n\n" +
          "1. Log in to your JobsForHer account\n" +
          "2. Click on your profile picture in the top right corner\n" +
          "3. Select 'Edit Profile' from the dropdown menu\n" +
          "4. Update your information in the relevant sections:\n" +
          "   - Personal Information\n" +
          "   - Professional Experience\n" +
          "   - Education\n" +
          "   - Skills\n" +
          "   - Career Preferences\n" +
          "5. Don't forget to click 'Save' after making changes\n\n" +
          "Is there a specific part of your profile you'd like to update?"
        setChat((prev) => [...prev, { from: "bot", text: response }])
        setIsLoading(false)
        return
      }

      // Try to find a general match across all datasets
      const generalMatch = await findGeneralMatch(userMessage)
      if (generalMatch) {
        setChat((prev) => [...prev, { from: "bot", text: generalMatch }])
        setIsLoading(false)
        return
      }

      // If no specific intent is matched, use Gemini AI
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

        // Create a system prompt to guide the AI
        const systemPrompt = `You are Asha, a helpful assistant for the JobsForHer Foundation. 
        Your goal is to help women find job opportunities, discover community events, 
        connect with mentors, and navigate the platform. Always be supportive, 
        encouraging, and focused on women's career development. 
        Avoid discussing topics unrelated to career, professional development, 
        or the JobsForHer platform. If asked about sensitive topics, 
        redirect the conversation to how you can help with career advancement.
        
        Current user query: ${userMessage}`

        const result = await model.generateContent(systemPrompt)
        const response = await result.response
        const reply = response.text()

        // Check if the response is appropriate and not too generic
        if (reply.length < 20 || reply.includes("I don't know") || reply.includes("I cannot")) {
          throw new Error("Inadequate AI response")
        }

        setChat((prev) => [...prev, { from: "bot", text: reply }])
      } catch (error) {
        console.error("AI Error:", error)

        // Provide a fallback response
        let fallbackResponse = "I understand you're asking about "

        if (lowerMessage.includes("job") || lowerMessage.includes("career")) {
          fallbackResponse +=
            "job opportunities. We have many listings across various industries and locations. Could you tell me what type of role or industry you're interested in?"
        } else if (lowerMessage.includes("event") || lowerMessage.includes("webinar")) {
          fallbackResponse +=
            "our events. We regularly host webinars, workshops, and networking sessions. Are you looking for any specific type of event or topic?"
        } else if (lowerMessage.includes("mentor")) {
          fallbackResponse +=
            "mentorship. Our platform connects women with experienced professionals across various fields. What area would you like guidance in?"
        } else {
          fallbackResponse =
            "I'd like to help you with that. Could you provide a bit more detail about what you're looking for? I can assist with job searches, events, mentorship, registration, and profile updates."
        }

        setChat((prev) => [...prev, { from: "bot", text: fallbackResponse }])
      }
    } catch (error) {
      console.error("Processing Error:", error)
      setChat((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Sorry, I had trouble processing that request. Please try again or ask in a different way.",
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Helper function to find matches across all datasets
  const findGeneralMatch = async (query: string): Promise<string | null> => {
    const lowerQuery = query.toLowerCase()
    let matches: { type: string; content: string; score: number }[] = []

    // Search jobs
    if (jobsFuse) {
      const jobMatches = jobsFuse.search(query).slice(0, 2)
      matches = matches.concat(
        jobMatches.map((match) => ({
          type: "job",
          content:
            `**${match.item["Job Title"]}** at ${match.item["Company Name"]}\n` +
            `📍 ${match.item.Location} | 💼 ${match.item.Industry}`,
          score: match.score || 1,
        })),
      )
    }

    // Search events
    if (eventsFuse) {
      const eventMatches = eventsFuse.search(query).slice(0, 2)
      matches = matches.concat(
        eventMatches.map((match) => ({
          type: "event",
          content:
            `**${match.item["Event Name"]}**\n` + `📅 ${formatDate(match.item.Date)} | 📍 ${match.item.Location}`,
          score: match.score || 1,
        })),
      )
    }

    // Search mentorship
    if (mentorshipFuse) {
      const mentorMatches = mentorshipFuse.search(query).slice(0, 2)
      matches = matches.concat(
        mentorMatches.map((match) => ({
          type: "mentorship",
          content:
            `**${match.item["Program Name"]}**\n` +
            `👩‍💼 Mentor: ${match.item["Mentor Name"]} | 🔍 ${match.item["Area of Expertise"]}`,
          score: match.score || 1,
        })),
      )
    }

    // Search FAQs
    if (faqsFuse) {
      const faqMatches = faqsFuse.search(query).slice(0, 1)
      matches = matches.concat(
        faqMatches.map((match) => ({
          type: "faq",
          content: `**Q: ${match.item.Question}**\n\nA: ${match.item.Answer}`,
          score: match.score || 1,
        })),
      )
    }

    // Sort by score (lower is better)
    matches.sort((a, b) => a.score - b.score)

    // If we have good matches, return them
    if (matches.length > 0 && matches[0].score < 0.4) {
      const bestMatches = matches.slice(0, 3)

      let response = "I found some information that might help you:\n\n"
      response += bestMatches.map((match) => match.content).join("\n\n")
      response += "\n\nWould you like more specific information about any of these?"

      return response
    }

    return null
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <Card className="w-full shadow-lg border-teal-200">
      <CardHeader className="bg-teal-50 border-b border-teal-100">
        <CardTitle className="flex items-center gap-2 text-teal-800">
          <Bot className="h-5 w-5 text-teal-600" />
          Asha - JobsForHer Assistant
        </CardTitle>
        <CardDescription className="text-teal-600">Your guide to jobs, events, mentorship, and more</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              Events
            </TabsTrigger>
            <TabsTrigger value="mentorship" className="flex-1">
              Mentorship
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0">
            {dataLoading ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ) : (
              <>
                {loadingErrors.length > 0 && (
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-sm">
                    <p className="font-medium">Some data couldn't be loaded:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {loadingErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <ScrollArea className="h-[400px] p-4">
                  {chat.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-teal-100 text-teal-600">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-teal-300"></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-teal-300"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-teal-300"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Quick prompts */}
                <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("Show me job opportunities in tech")}
                        >
                          <Search className="h-3.5 w-3.5 mr-1" />
                          Jobs
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Find job opportunities</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("What events are coming up this month?")}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Events
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Discover upcoming events</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("How can I find a mentor in marketing?")}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Mentorship
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Explore mentorship programs</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("How do I create an account?")}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Sign Up
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Learn how to register</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("How do I update my profile?")}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Profile
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update your profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 border-slate-200"
                          onClick={() => handleQuickPrompt("What services does JobsForHer offer?")}
                        >
                          <FileQuestion className="h-3.5 w-3.5 mr-1" />
                          FAQ
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get answers to common questions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Ask about jobs, events, mentorship..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading || dataLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || dataLoading || !input.trim()}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="m-0 p-4">
            <h3 className="text-lg font-medium mb-4">Featured Job Opportunities</h3>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-semibold">{job["Job Title"]}</h4>
                  <p className="text-sm text-slate-500">
                    {job["Company Name"]} • {job.Location}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{job.Industry}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{job["Job Type"]}</span>
                    <span className="text-xs bg-teal-100 px-2 py-1 rounded-full">{job.Salary}</span>
                  </div>
                  <p className="text-xs mt-2">
                    <strong>Skills:</strong> {job["Required Skills"]}
                  </p>
                  <p className="text-xs mt-1">
                    <strong>Apply by:</strong> {formatDate(job["Application Deadline"])}
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleViewJobDetails(job)}>
                    View Details
                  </Button>
                </Card>
              ))}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setActiveTab("chat")
                  handleQuickPrompt("Show me more job opportunities")
                }}
              >
                Explore More Jobs
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="events" className="m-0 p-4">
            <h3 className="text-lg font-medium mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {events.slice(0, 5).map((event, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-semibold">{event["Event Name"]}</h4>
                  <p className="text-sm text-slate-500">
                    {formatDate(event.Date)} at {event.Time}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{event["Event Type"]}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{event.Location}</span>
                  </div>
                  <p className="text-xs mt-2">
                    <strong>Host:</strong> {event["Host Organization"]}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2">{event.Description}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleRegisterForEvent(event)}>
                    Register
                  </Button>
                </Card>
              ))}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setActiveTab("chat")
                  handleQuickPrompt("What other events are available?")
                }}
              >
                See All Events
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mentorship" className="m-0 p-4">
            <h3 className="text-lg font-medium mb-4">Mentorship Programs</h3>
            <div className="space-y-4">
              {mentorships.slice(0, 5).map((program, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-semibold">{program["Program Name"]}</h4>
                  <p className="text-sm text-slate-500">Mentor: {program["Mentor Name"]}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs bg-teal-100 px-2 py-1 rounded-full">{program["Area of Expertise"]}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{program.Duration}</span>
                  </div>
                  <p className="text-xs mt-2">
                    <strong>Apply by:</strong> {formatDate(program["Application Deadline"])}
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleConnectWithMentor(program)}>
                    Connect
                  </Button>
                </Card>
              ))}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setActiveTab("chat")
                  handleQuickPrompt("Tell me more about mentorship opportunities")
                }}
              >
                Explore Mentorship
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Job Details Dialog */}
      <Dialog open={jobDetailsOpen} onOpenChange={setJobDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedJob?.["Job Title"]}</DialogTitle>
            <DialogDescription>
              {selectedJob?.["Company Name"]} • {selectedJob?.Location}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{selectedJob?.Industry}</span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{selectedJob?.["Job Type"]}</span>
              <span className="text-xs bg-teal-100 px-2 py-1 rounded-full">{selectedJob?.Salary}</span>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Required Skills</h4>
              <p className="text-sm">{selectedJob?.["Required Skills"]}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Application Deadline</h4>
              <p className="text-sm">{formatDate(selectedJob?.["Application Deadline"] || "")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-name">Your Name</Label>
              <Input
                id="job-name"
                value={registrationName}
                onChange={(e) => setRegistrationName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-email">Your Email</Label>
              <Input
                id="job-email"
                type="email"
                value={registrationEmail}
                onChange={(e) => setRegistrationEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-message">Cover Letter (Optional)</Label>
              <Textarea
                id="job-message"
                value={registrationMessage}
                onChange={(e) => setRegistrationMessage(e.target.value)}
                placeholder="Tell us why you're a good fit for this position"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyForJob}>Apply Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Registration Dialog */}
      <Dialog open={eventRegisterOpen} onOpenChange={setEventRegisterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register for {selectedEvent?.["Event Name"]}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedEvent?.Date || "")} at {selectedEvent?.Time} • {selectedEvent?.Location}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Event Type</h4>
              <p className="text-sm">{selectedEvent?.["Event Type"]}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Host Organization</h4>
              <p className="text-sm">{selectedEvent?.["Host Organization"]}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm">{selectedEvent?.Description}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-name">Your Name</Label>
              <Input
                id="event-name"
                value={registrationName}
                onChange={(e) => setRegistrationName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-email">Your Email</Label>
              <Input
                id="event-email"
                type="email"
                value={registrationEmail}
                onChange={(e) => setRegistrationEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-message">Questions or Comments (Optional)</Label>
              <Textarea
                id="event-message"
                value={registrationMessage}
                onChange={(e) => setRegistrationMessage(e.target.value)}
                placeholder="Any questions for the organizers?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEventRegistration}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mentorship Connection Dialog */}
      <Dialog open={mentorshipConnectOpen} onOpenChange={setMentorshipConnectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect with {selectedMentorship?.["Mentor Name"]}</DialogTitle>
            <DialogDescription>
              {selectedMentorship?.["Program Name"]} • {selectedMentorship?.["Area of Expertise"]}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Program Duration</h4>
              <p className="text-sm">{selectedMentorship?.Duration}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Application Deadline</h4>
              <p className="text-sm">{formatDate(selectedMentorship?.["Application Deadline"] || "")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentor-name">Your Name</Label>
              <Input
                id="mentor-name"
                value={registrationName}
                onChange={(e) => setRegistrationName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentor-email">Your Email</Label>
              <Input
                id="mentor-email"
                type="email"
                value={registrationEmail}
                onChange={(e) => setRegistrationEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentor-message">Why are you interested? (Optional)</Label>
              <Textarea
                id="mentor-message"
                value={registrationMessage}
                onChange={(e) => setRegistrationMessage(e.target.value)}
                placeholder="Tell us why you're interested in this mentorship program"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMentorshipConnectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitMentorshipRequest}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
