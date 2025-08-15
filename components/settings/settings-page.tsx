"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ButtonLoading, LoadingCard } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { Setting, User } from "@/types"

export function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const data: Setting[] = await apiClient.get("/api/settings")
        if (Array.isArray(data)) {
          setSettings(data)
        } else {
          console.error("API /api/settings did not return an array:", data)
          setSettings([])
          toast({
            title: "Lỗi dữ liệu",
            description: "Dữ liệu cài đặt không hợp lệ.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Failed to fetch settings:", error)
        setSettings([])
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải cài đặt hệ thống.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  const getSettingValue = (key: string) => {
    const setting = settings.find((s) => s.key === key)
    return setting ? setting.value : ""
  }

  const getSettingType = (key: string) => {
    const setting = settings.find((s) => s.key === key)
    return setting ? setting.type : "string"
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const form = e.target as HTMLFormElement
      const updatedSettings: {
        key: string
        value: any
        type: string
        description?: string
        category?: string
        isPublic?: boolean
      }[] = []

      settings.forEach((setting) => {
        let value
        const inputElement = form.elements.namedItem(setting.key) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement

        if (inputElement) {
          if (setting.type === "boolean") {
            value = (inputElement as HTMLInputElement).checked
          } else if (setting.type === "number") {
            value = Number.parseFloat(inputElement.value)
          } else if (setting.type === "array" || setting.type === "object") {
            try {
              value = JSON.parse(inputElement.value)
            } catch (parseError) {
              console.error(`Error parsing JSON for setting ${setting.key}:`, parseError)
              toast({
                title: "Lỗi định dạng",
                description: `Giá trị cho '${setting.displayName || setting.key}' không phải là JSON hợp lệ.`,
                variant: "destructive",
              })
              setIsSaving(false)
              return
            }
          } else {
            value = inputElement.value
          }
        } else {
          value = setting.value
        }

        updatedSettings.push({
          key: setting.key,
          value: value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          isPublic: setting.isPublic,
        })
      })

      for (const setting of updatedSettings) {
        await apiClient.put("/api/settings", setting)
      }

      toast({
        title: "Thành công",
        description: "Cài đặt đã được cập nhật thành công!",
      })
      const data: Setting[] = await apiClient.get("/api/settings")
      if (Array.isArray(data)) {
        setSettings(data)
      }
    } catch (error: any) {
      console.error("Save settings failed:", error)
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <LoadingCard className="h-[500px] bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </LoadingCard>
      </div>
    )
  }

  const groupedSettings = settings.reduce(
    (acc, setting) => {
      const category = setting.category || "Khác"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(setting)
      return acc
    },
    {} as Record<string, Setting[]>,
  )

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Cài đặt hệ thống</h1>
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {Object.keys(groupedSettings).map((category, index) => (
          <Card
            key={category}
            className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <CardTitle className="text-blue-800 capitalize">{category.replace(/_/g, " ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedSettings[category].map((setting) => (
                <div key={setting.key}>
                  <Label htmlFor={setting.key} className="text-gray-700">{setting.displayName || setting.key}</Label>
                  {setting.description && <p className="text-sm text-gray-500 mb-1">{setting.description}</p>}
                  {setting.type === "string" && (
                    <Input
                      id={setting.key}
                      name={setting.key}
                      defaultValue={setting.value}
                      disabled={isSaving}
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  )}
                  {setting.type === "number" && (
                    <Input
                      id={setting.key}
                      name={setting.key}
                      type="number"
                      defaultValue={setting.value}
                      disabled={isSaving}
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  )}
                  {setting.type === "boolean" && (
                    <Switch
                      id={setting.key}
                      name={setting.key}
                      defaultChecked={setting.value}
                      disabled={isSaving}
                    />
                  )}
                  {(setting.type === "object" || setting.type === "array") && (
                    <Textarea
                      id={setting.key}
                      name={setting.key}
                      defaultValue={JSON.stringify(setting.value, null, 2)}
                      disabled={isSaving}
                      rows={5}
                      className="font-mono text-xs border-blue-200 focus:ring-blue-500"
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Cập nhật lần cuối bởi: {(setting.updatedBy as User)?.name || "Hệ thống"} vào{" "}
                    {new Date(setting.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          disabled={isSaving}
        >
          <ButtonLoading isLoading={isSaving} loadingText="Đang lưu cài đặt...">
            Lưu cài đặt
          </ButtonLoading>
        </Button>
      </form>
    </div>
  )
}