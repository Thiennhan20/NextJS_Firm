// Backend API Route - src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      )
    }

    // Log for debugging
    console.log("Received messages:", messages)

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": messages // Đúng format rồi
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API Error:", errorText)
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log("Groq API Response:", data) // Debug log
    
    return NextResponse.json(data)

  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}