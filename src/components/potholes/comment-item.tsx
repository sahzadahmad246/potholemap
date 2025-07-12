"use client"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit2, Trash2, Check, X, MoreVertical, Loader2, AlertTriangle } from "lucide-react"
import type { ICommentPopulated } from "@/types/pothole"

interface CommentItemProps {
  comment: ICommentPopulated
  currentUserId?: string
  potholeId: string
  onCommentUpdated: () => void
}

export function CommentItem({ comment, currentUserId, potholeId, onCommentUpdated }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.comment)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isOwner = comment.userId?._id?.toString() === currentUserId
  const commentId = comment._id?.toString()

  const handleEdit = async () => {
    if (!commentId || editText.trim().length === 0) {
      toast.error("Comment cannot be empty.")
      return
    }
    if (editText.length > 200) {
      toast.error("Comment cannot exceed 200 characters.")
      return
    }

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/potholes/${potholeId}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: editText.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Comment updated successfully!")
        setIsEditing(false)
        onCommentUpdated()
      } else {
        toast.error(data.error || "Failed to update comment.")
      }
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error("An error occurred while updating comment.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!commentId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/potholes/${potholeId}/comments/${commentId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Comment deleted successfully!")
        setShowDeleteDialog(false)
        onCommentUpdated()
      } else {
        toast.error(data.error || "Failed to delete comment.")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("An error occurred while deleting comment.")
    } finally {
      setIsDeleting(false)
    }
  }

  const startEdit = () => {
    setIsEditing(true)
    setEditText(comment.comment)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditText(comment.comment)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return new Date(date).toLocaleDateString()
  }

  return (
    <>
      <div className="group relative">
        <div className="flex space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={comment.userId?.image || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
              {comment.userId?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">{comment.userId?.name || "Unknown User"}</span>
                {isOwner && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    You
                  </Badge>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(comment.createdAt)}</span>
              </div>

              {isOwner && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={startEdit} className="cursor-pointer">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={200}
                  className="min-h-[80px] resize-none"
                  placeholder="Edit your comment..."
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{editText.length}/200 characters</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={isUpdating}
                      className="h-8 bg-transparent"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={isUpdating || editText.trim().length === 0 || editText === comment.comment}
                      className="h-8"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 break-words leading-relaxed">{comment.comment}</p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
