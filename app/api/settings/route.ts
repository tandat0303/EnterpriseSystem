import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Setting } from "@/models/Setting"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const category = searchParams.get("category")
    const isPublic = searchParams.get("isPublic") === "true"

    const query: any = {}
    if (key) query.key = key
    if (category && category !== "all") query.category = category
    if (isPublic) query.isPublic = true

    const settings = await Setting.find(query).populate("updatedBy", "name email").lean()

    return NextResponse.json(settings)
  } catch (error) {
    console.error("GET /api/settings error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy cài đặt." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settingData = await request.json()

    if (!settingData.key || !settingData.value || !settingData.type || !settingData.category) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc cho cài đặt." }, { status: 400 })
    }

    const existingSetting = await Setting.findOne({ key: settingData.key })
    if (existingSetting) {
      return NextResponse.json({ error: "Key cài đặt đã tồn tại." }, { status: 400 })
    }

    const newSetting = new Setting({
      ...settingData,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newSetting.save()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Setting",
      resourceId: newSetting._id.toString(),
      newData: newSetting,
      description: `Tạo cài đặt mới: ${newSetting.key}`,
      request,
    })

    return NextResponse.json(newSetting, { status: 201 })
  } catch (error) {
    console.error("POST /api/settings error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo cài đặt." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key, value, type, description, category, isPublic } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Key cài đặt là bắt buộc." }, { status: 400 })
    }

    const oldSetting = await Setting.findOne({ key }).lean()
    if (!oldSetting) {
      return NextResponse.json({ error: "Cài đặt không tìm thấy." }, { status: 404 })
    }

    const updatedSetting = await Setting.findOneAndUpdate(
      { key },
      {
        value,
        type,
        description,
        category,
        isPublic,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    ).lean()

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Setting",
      resourceId: updatedSetting?._id.toString() || "unknown",
      oldData: oldSetting,
      newData: updatedSetting,
      description: `Cập nhật cài đặt: ${key}`,
      request,
    })

    return NextResponse.json(updatedSetting)
  } catch (error) {
    console.error("PUT /api/settings error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật cài đặt." }, { status: 500 })
  }
}
