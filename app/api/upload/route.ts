import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename is required." }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty." }, { status: 400 })
  }

  try {
    const blob = await put(filename, request.body, {
      access: "public",
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 })
  }
}
