import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { url } = body || {}

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No valid URL provided" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    try {
      console.log("Fetching M3U from URL:", url)
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch M3U data: ${response.status} ${response.statusText}`)
      }

      let content
      try {
        content = await response.text()
      } catch (error) {
        console.error("Error reading response text:", error)
        throw new Error("Failed to read response content")
      }

      if (content === undefined || content === null) {
        return NextResponse.json({ error: "Received null or undefined content from the URL" }, { status: 400 })
      }

      if (typeof content !== "string") {
        return NextResponse.json(
          {
            error: `Received invalid content type from the URL: ${typeof content}`,
          },
          { status: 400 },
        )
      }

      if (content.trim() === "") {
        return NextResponse.json({ error: "Received empty content from the URL" }, { status: 400 })
      }

      console.log("Successfully fetched M3U content, length:", content.length)
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
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
