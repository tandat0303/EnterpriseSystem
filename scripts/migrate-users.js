const { MongoClient, ObjectId } = require("mongodb")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI không được tìm thấy trong .env.local")
  process.exit(1)
}

async function migrateUsers() {
  let client

  try {
    console.log("🔄 Đang kết nối tới MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("✅ Kết nối MongoDB thành công!")

    const db = client.db()

    // Get all roles
    const roles = await db.collection("roles").find({}).toArray()
    const roleMap = new Map()
    roles.forEach((role) => {
      roleMap.set(role.name, role._id)
    })

    // Get users without roleId
    const usersWithoutRole = await db
      .collection("users")
      .find({ roleId: { $exists: false } })
      .toArray()

    if (usersWithoutRole.length === 0) {
      console.log("✅ Tất cả users đã có roleId")
      return
    }

    console.log(`🔄 Đang migrate ${usersWithoutRole.length} users...`)

    // Migrate users based on their old role field
    for (const user of usersWithoutRole) {
      let roleId

      // Map old role to new roleId
      if (user.role === "admin" || user.email === "admin@casumina.com") {
        roleId = roleMap.get("admin")
      } else if (user.role?.includes("Manager") || user.role?.includes("Trưởng") || user.role?.includes("Giám đốc")) {
        roleId = roleMap.get("manager")
      } else {
        roleId = roleMap.get("employee")
      }

      if (roleId) {
        await db.collection("users").updateOne({ _id: user._id }, { $set: { roleId: roleId } })
        console.log(`✅ Updated user ${user.email} with role ${roleId}`)
      }
    }

    console.log("\n🎉 Migration hoàn thành!")
  } catch (error) {
    console.error("❌ Lỗi khi migrate users:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Đã đóng kết nối MongoDB")
    }
  }
}

// Run the migration
migrateUsers()
