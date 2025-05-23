import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json().catch(() => ({}))
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch M3U data: ${response.status}`)
      }

      const content = await response.text()

      if (!content || content.trim() === "") {
        return NextResponse.json({ error: "Received empty content from the URL" }, { status: 400 })
      }

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    } catch (error) {
      console.error("Error fetching M3U data:", error)
      return NextResponse.json(
        { error: `Failed to fetch M3U data: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
