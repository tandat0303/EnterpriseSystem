"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client" // Import apiClient

interface SubmissionActionButtonsProps {
  submissionId: string
  onActionSuccess: () => void
}

export function SubmissionActionButtons({ submissionId, onActionSuccess }: SubmissionActionButtonsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "feedback" | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleOpenDialog = (action: "approve" | "reject" | "feedback") => {
    setDialogAction(action)
    setIsDialogOpen(true)
    setComment("")
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setDialogAction(null)
    setComment("")
  }

  const handleSubmitAction = async () => {
    if (dialogAction === "feedback" && comment.trim().length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập phản hồi khi yêu cầu phản hồi.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post(`/api/submissions/${submissionId}/action`, {
        action: dialogAction,
        comment,
      })
      onActionSuccess()
      handleCloseDialog()
    } catch (error: any) {
      console.error("Submission action failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi thực hiện hành động.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <Button onClick={() => handleOpenDialog("approve")} className="bg-green-600 hover:bg-green-700">
        Duyệt
      </Button>
      <Button onClick={() => handleOpenDialog("reject")} variant="destructive">
        Từ chối
      </Button>
      <Button onClick={() => handleOpenDialog("feedback")} variant="outline">
        Yêu cầu phản hồi
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" && "Duyệt biểu mẫu"}
              {dialogAction === "reject" && "Từ chối biểu mẫu"}
              {dialogAction === "feedback" && "Yêu cầu phản hồi"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {(dialogAction === "reject" || dialogAction === "feedback") && (
              <div className="grid gap-2">
                <Label htmlFor="comment">Bình luận (Tùy chọn)</Label>
                <Textarea
                  id="comment"
                  placeholder="Nhập bình luận của bạn..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}
            {dialogAction === "approve" && <p>Bạn có chắc chắn muốn duyệt biểu mẫu này không?</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmitAction} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}