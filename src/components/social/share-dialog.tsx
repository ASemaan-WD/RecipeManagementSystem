'use client';

import { useState, useCallback } from 'react';
import {
  Share2,
  Copy,
  X,
  Check,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  useRecipeShares,
  useShareRecipe,
  useRevokeShare,
  useUpdateVisibility,
  useCreateShareLink,
  useRevokeShareLink,
  useSearchUsers,
} from '@/hooks/use-sharing';
import type { Visibility } from '@/generated/prisma/client';

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE' as const, label: 'Private', description: 'Only you' },
  { value: 'SHARED' as const, label: 'Shared', description: 'Specific people' },
  { value: 'PUBLIC' as const, label: 'Public', description: 'Everyone' },
] as const;

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

interface ShareDialogProps {
  recipeId: string;
  currentVisibility: Visibility;
}

export function ShareDialog({ recipeId, currentVisibility }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const { data: sharesData } = useRecipeShares(recipeId);
  const { data: searchResults, isLoading: isSearching } =
    useSearchUsers(searchQuery);
  const shareRecipe = useShareRecipe();
  const revokeShare = useRevokeShare();
  const updateVisibility = useUpdateVisibility();
  const createShareLink = useCreateShareLink();
  const revokeShareLink = useRevokeShareLink();

  const handleVisibilityChange = useCallback(
    (visibility: Visibility) => {
      updateVisibility.mutate({ recipeId, visibility });
    },
    [recipeId, updateVisibility]
  );

  function handleShareWithUser(username: string) {
    shareRecipe.mutate(
      { recipeId, username },
      { onSuccess: () => setSearchQuery('') }
    );
  }

  function handleRevokeShare(userId: string) {
    revokeShare.mutate({ recipeId, userId });
  }

  function handleCreateLink() {
    createShareLink.mutate({ recipeId });
  }

  function handleRevokeLink(linkId: string) {
    revokeShareLink.mutate({ recipeId, linkId });
  }

  function handleCopyLink(token: string, linkId: string) {
    const url = `${window.location.origin}/recipes/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedLinkId(null), 2000);
  }

  const shares = sharesData?.shares ?? [];
  const shareLinks = sharesData?.shareLinks ?? [];

  // Filter search results to exclude already-shared users
  const sharedUserIds = new Set(shares.map((s) => s.user.id));
  const filteredSearchResults = (searchResults ?? []).filter(
    (u) => !sharedUserIds.has(u.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Recipe</DialogTitle>
        </DialogHeader>

        {/* Visibility selector */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Visibility</p>
          <div className="flex gap-1">
            {VISIBILITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={
                  currentVisibility === option.value ? 'default' : 'outline'
                }
                size="sm"
                className="flex-1"
                onClick={() => handleVisibilityChange(option.value)}
                disabled={updateVisibility.isPending}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs: Users / Link */}
        <Tabs defaultValue="users" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Share with Users</TabsTrigger>
            <TabsTrigger value="link">Share Link</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* User search */}
            <div className="relative">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length >= 1 && (
                <div className="bg-popover absolute top-full right-0 left-0 z-10 mt-1 rounded-md border shadow-md">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-3">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredSearchResults.length === 0 ? (
                    <p className="text-muted-foreground p-3 text-sm">
                      No users found
                    </p>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {filteredSearchResults.map((user) => (
                        <li key={user.id}>
                          <button
                            type="button"
                            className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            onClick={() =>
                              user.username &&
                              handleShareWithUser(user.username)
                            }
                            disabled={shareRecipe.isPending}
                          >
                            <Avatar size="sm">
                              <AvatarImage
                                src={user.image ?? undefined}
                                alt={user.name ?? 'User'}
                              />
                              <AvatarFallback>
                                {getUserInitials(user.name, user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-muted-foreground text-xs">
                                @{user.username}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Shared users list */}
            {shares.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Not shared with anyone yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage
                          src={share.user.image ?? undefined}
                          alt={share.user.name ?? 'User'}
                        />
                        <AvatarFallback>
                          {getUserInitials(
                            share.user.name,
                            share.user.username
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{share.user.name}</p>
                        <p className="text-muted-foreground text-xs">
                          @{share.user.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleRevokeShare(share.user.id)}
                      disabled={revokeShare.isPending}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateLink}
              disabled={createShareLink.isPending}
            >
              {createShareLink.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LinkIcon className="size-4" />
              )}
              Generate Link
            </Button>

            {shareLinks.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No active share links.
              </p>
            ) : (
              <ul className="space-y-2">
                {shareLinks.map((link) => (
                  <li
                    key={link.id}
                    className="bg-muted/50 flex items-center justify-between gap-2 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <LinkIcon className="text-muted-foreground size-4 shrink-0" />
                      <span className="truncate text-xs">
                        .../{link.token.slice(-8)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleCopyLink(link.token, link.id)}
                      >
                        {copiedLinkId === link.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleRevokeLink(link.id)}
                        disabled={revokeShareLink.isPending}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
