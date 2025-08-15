#!/usr/bin/env node

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const envLocalPath = path.resolve(process.cwd(), ".env.local")

// Function to generate a random string for JWT secret
function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
}

// Generate a new JWT secret
const jwtSecret = generateRandomString(64) // 64 characters for a strong secret

// Generate a new NextAuth secret (can be the same or different from JWT_SECRET)
const nextAuthSecret = generateRandomString(32) // 32 characters for NextAuth

let envContent = ""

// Check if .env.local exists
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, "utf8")
}

// Update or add JWT_SECRET
if (envContent.includes("JWT_SECRET=")) {
  envContent = envContent.replace(/^(JWT_SECRET=).*$/m, `JWT_SECRET=${jwtSecret}`)
} else {
  envContent += `\nJWT_SECRET=${jwtSecret}`
}

// Update or add NEXTAUTH_SECRET
if (envContent.includes("NEXTAUTH_SECRET=")) {
  envContent = envContent.replace(/^(NEXTAUTH_SECRET=).*$/m, `NEXTAUTH_SECRET=${nextAuthSecret}`)
} else {
  envContent += `\nNEXTAUTH_SECRET=${nextAuthSecret}`
}

// Ensure NEXTAUTH_URL is present, default to http://localhost:3000 if not
if (!envContent.includes("NEXTAUTH_URL=")) {
  envContent += `\nNEXTAUTH_URL=http://localhost:3000`
}

// Ensure BLOB_READ_WRITE_TOKEN is present, leave empty if not
if (!envContent.includes("BLOB_READ_WRITE_TOKEN=")) {
  envContent += `\nBLOB_READ_WRITE_TOKEN=`
}

// Ensure MongoDB URI is present, leave empty if not
if (!envContent.includes("MONGODB_URI=")) {
  envContent += `\nMONGODB_URI=mongodb://localhost:27017/enterprise_db`
}

// Ensure SMTP details are present, leave empty if not
if (!envContent.includes("SMTP_HOST=")) {
  envContent += `\nSMTP_HOST=`
}
if (!envContent.includes("SMTP_PORT=")) {
  envContent += `\nSMTP_PORT=`
}
if (!envContent.includes("SMTP_USER=")) {
  envContent += `\nSMTP_USER=`
}
if (!envContent.includes("SMTP_PASS=")) {
  envContent += `\nSMTP_PASS=`
}

fs.writeFileSync(envLocalPath, envContent.trim() + "\n")

console.log(".env.local updated with new JWT_SECRET and NEXTAUTH_SECRET.")
console.log("Please ensure MONGODB_URI, BLOB_READ_WRITE_TOKEN, and SMTP details are correctly configured.")
