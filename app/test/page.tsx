import { TestStyles } from "@/components/test-styles"

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">Test Page</h1>
      <p className="text-lg text-gray-700 mb-8">This page is for testing various components and styles.</p>
      <TestStyles />
    </div>
  )
}
