import { TestStyles } from "@/components/test-styles"

export default function TestCssPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">CSS Test Page</h1>
      <p className="text-lg text-gray-700 mb-8">This page is specifically for debugging CSS issues.</p>
      <TestStyles />
      <div className="mt-8 p-4 border border-blue-500 bg-blue-50 text-blue-800 rounded">
        <h2 className="text-2xl font-semibold mb-2">CSS Debugging Area</h2>
        <p>If you are seeing this, Tailwind CSS is likely working. Check the styles of the components above.</p>
        <div className="mt-4 flex space-x-4">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
            Red
          </div>
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
            Green
          </div>
          <div className="w-16 h-16 bg-purple-500 shadow-lg flex items-center justify-center text-white font-bold">
            Purple
          </div>
        </div>
      </div>
    </div>
  )
}
