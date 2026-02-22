'use client';

import { useState } from 'react';
import { MessageSquare, Pencil, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/use-comments';
import type { Comment } from '@/hooks/use-comments';

const MAX_COMMENT_LENGTH = 1000;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getUserInitials(name: string | null, username: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (username) return username.slice(0, 2).toUpperCase();
  return 'U';
}

interface CommentSectionProps {
  recipeId: string;
  recipeAuthorId: string;
  currentUserId?: string;
}

export function CommentSection({
  recipeId,
  recipeAuthorId,
  currentUserId,
}: CommentSectionProps) {
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: commentsData, isLoading } = useComments(recipeId, page);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const comments = commentsData?.data ?? [];
  const pagination = commentsData?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  function handleSubmit() {
    if (!newComment.trim()) return;
    createComment.mutate(
      { recipeId, content: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment('');
          setPage(1);
        },
      }
    );
  }

  function handleStartEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function handleSaveEdit(commentId: string) {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId, content: editContent.trim(), recipeId },
      { onSuccess: () => setEditingId(null) }
    );
  }

  function handleDelete(commentId: string) {
    deleteComment.mutate({ commentId, recipeId });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <MessageSquare className="size-5" />
          Comments
          {pagination && (
            <span className="text-muted-foreground text-sm font-normal">
              ({pagination.total})
            </span>
          )}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment form (authenticated only) */}
        {currentUserId && (
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              aria-label="Write a comment"
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || createComment.isPending}
              >
                {createComment.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => {
              const isEditing = editingId === comment.id;
              const canEdit = currentUserId === comment.user.id;
              const canDelete =
                currentUserId === comment.user.id ||
                currentUserId === recipeAuthorId;

              return (
                <li key={comment.id} className="flex gap-3">
                  <Avatar size="sm" className="mt-0.5">
                    <AvatarImage
                      src={comment.user.image ?? undefined}
                      alt={comment.user.name ?? 'User'}
                    />
                    <AvatarFallback>
                      {getUserInitials(
                        comment.user.name,
                        comment.user.username
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user.name ?? comment.user.username}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span className="text-muted-foreground text-xs italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={MAX_COMMENT_LENGTH}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={
                              !editContent.trim() || updateComment.isPending
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    )}

                    {!isEditing && (canEdit || canDelete) && (
                      <div className="flex gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-auto px-1 py-0 text-xs"
                            onClick={() => handleStartEdit(comment)}
                          >
                            <Pencil className="size-3" />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-auto px-1 py-0 text-xs"
                            onClick={() => handleDelete(comment.id)}
                            disabled={deleteComment.isPending}
                          >
                            <Trash2 className="size-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
