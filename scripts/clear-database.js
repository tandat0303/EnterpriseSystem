const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI

async function clearDatabase() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI không được tìm thấy trong .env.local")
    process.exit(1)
  }

  let client

  try {
    console.log("🔄 Đang kết nối tới MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("✅ Kết nối MongoDB thành công!")

    const db = client.db()

    console.log("🗑️  Đang xóa tất cả dữ liệu...")

    // Danh sách đầy đủ các collection cần xóa
    const collections = [
      "users",
      "roles",
      "permissions",
      "departments",
      "formtemplates",
      "formsubmissions",
      "workflows",
      "notifications",
      "auditlogs",
      "settings",
    ]

    for (const collectionName of collections) {
      // Kiểm tra xem collection có tồn tại không trước khi xóa
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext()
      if (collectionExists) {
        const result = await db.collection(collectionName).deleteMany({})
        console.log(`✅ Đã xóa ${result.deletedCount} documents từ ${collectionName}`)
      } else {
        console.log(`ℹ️ Collection ${collectionName} không tồn tại, bỏ qua.`)
      }
    }

    console.log("🎉 Xóa dữ liệu hoàn thành!")
  } catch (error) {
    console.error("❌ Lỗi khi xóa dữ liệu:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Đã đóng kết nối MongoDB")
    }
  }
}

clearDatabase()
