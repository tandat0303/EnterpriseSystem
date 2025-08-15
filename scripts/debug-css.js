const fs = require("fs")
const path = require("path")

console.log("🔍 Debugging CSS Issues...\n")

// Check if required files exist
const requiredFiles = ["app/globals.css", "tailwind.config.ts", "postcss.config.js", "app/layout.tsx"]

console.log("📁 Checking required files:")
requiredFiles.forEach((file) => {
  const exists = fs.existsSync(file)
  console.log(`${exists ? "✅" : "❌"} ${file}`)
})

// Check package.json dependencies
console.log("\n📦 Checking dependencies:")
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const requiredDeps = ["tailwindcss", "postcss", "autoprefixer", "tailwindcss-animate"]

requiredDeps.forEach((dep) => {
  const hasDevDep = packageJson.devDependencies && packageJson.devDependencies[dep]
  const hasDep = packageJson.dependencies && packageJson.dependencies[dep]
  console.log(`${hasDevDep || hasDep ? "✅" : "❌"} ${dep}`)
})

// Check if globals.css is imported in layout.tsx
console.log("\n📄 Checking globals.css import:")
try {
  const layoutContent = fs.readFileSync("app/layout.tsx", "utf8")
  const hasImport = layoutContent.includes('import "./globals.css"')
  console.log(`${hasImport ? "✅" : "❌"} globals.css imported in layout.tsx`)
} catch (error) {
  console.log("❌ Could not read app/layout.tsx")
}

// Check Tailwind directives in globals.css
console.log("\n🎨 Checking Tailwind directives:")
try {
  const cssContent = fs.readFileSync("app/globals.css", "utf8")
  const hasBase = cssContent.includes("@tailwind base")
  const hasComponents = cssContent.includes("@tailwind components")
  const hasUtilities = cssContent.includes("@tailwind utilities")

  console.log(`${hasBase ? "✅" : "❌"} @tailwind base`)
  console.log(`${hasComponents ? "✅" : "❌"} @tailwind components`)
  console.log(`${hasUtilities ? "✅" : "❌"} @tailwind utilities`)
} catch (error) {
  console.log("❌ Could not read app/globals.css")
}

console.log("\n🔧 Next steps:")
console.log("1. Run: rm -rf .next")
console.log("2. Run: npm run dev")
console.log("3. Check: http://localhost:3000/test-css")
