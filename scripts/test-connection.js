const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI

async function testConnection() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI không được tìm thấy trong .env.local")
    process.exit(1)
  }

  let client

  try {
    console.log("🔄 Đang kiểm tra kết nối MongoDB...")
    console.log("📍 URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@")) // Hide credentials

    client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const collections = await db.listCollections().toArray()

    console.log("✅ Kết nối MongoDB thành công!")
    console.log("📊 Database:", db.databaseName)
    console.log(
      "📋 Collections hiện có:",
      collections.map((c) => c.name),
    )

    // Test write permission
    await db.collection("test").insertOne({ test: true })
    await db.collection("test").deleteOne({ test: true })
    console.log("✅ Quyền ghi dữ liệu: OK")
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Đã đóng kết nối")
    }
  }
}

testConnection()
