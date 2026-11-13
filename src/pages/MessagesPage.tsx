import {
  effectiveAgreementStatusMeta,
  formatDate,
  formatInr,
  resolveEffectiveAgreementStatus,
  statusLabel,
} from "../shared/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { type ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Button, ConfirmModal, EmptyState, ErrorState, Field, Notice, Spinner, StatusPill, TextArea, TextInput } from "../components/ui";
import { api, apiUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ProfileDetailsModal, type BrandDetailView, type CreatorDetailView } from "../components/ProfileDetailsModal";

type Conversation = {
  id: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  campaign: { id: string; title: string; status?: string; endDate?: string };
  creator: CreatorDetailView | null;
  brand: BrandDetailView | null;
  messages: Array<{ content: string; createdAt: string; mediaKey?: string | null; mediaMimeType?: string | null }>;
  collaboration?: {
    id: string;
    status: string;
    agreement?: { id: string; status: string } | null;
    initialPaymentStatus?: string | null;
  } | null;
};

type ConversationDetail = {
  id: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  campaign: {
    id: string;
    title: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    productName?: string;
    productDetails?: string;
    description?: string;
    deliverables?: string;
    requirements?: string;
    instructions?: string;
    performanceTerms?: string;
    estimatedPrice?: number;
  };
  collaboration?: {
    id: string;
    status: string;
    creator: { id: string; name: string; profileImage?: string | null };
    payment?: { id: string; initialStatus: string; amount: number } | null;
    agreement?: {
      id: string;
      status: string;
      agreementData?: Record<string, unknown>;
      brandSignedAt?: string | null;
      creatorSignedAt?: string | null;
      creatorSignatureName?: string | null;
      pdfKey?: string | null;
      signedPdfKey?: string | null;
    } | null;
  } | null;
};

function clock(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  mediaKey?: string | null;
  mediaMimeType?: string | null;
};

function messagePreview(message: {
  content: string;
  mediaKey?: string | null;
  mediaMimeType?: string | null;
}) {
  if (message.mediaKey) {
    if (message.mediaMimeType?.startsWith("video/")) return "Video";
    if (message.mediaMimeType?.startsWith("image/")) return "Photo";
    return "Attachment";
  }
  return message.content;
}

function isDefaultMediaCaption(content: string) {
  return content === "Shared a photo" || content === "Shared a video";
}

export function AgreementStatusBadge({
  agreementStatus,
  collaborationStatus,
  initialPaymentStatus,
  campaignStatus,
  campaignEndDate,
  onClick,
  size = "md",
}: {
  agreementStatus?: string | null;
  collaborationStatus?: string | null;
  initialPaymentStatus?: string | null;
  campaignStatus?: string | null;
  campaignEndDate?: string | Date | null;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const effective = resolveEffectiveAgreementStatus({
    agreementStatus,
    collaborationStatus,
    initialPaymentStatus,
    campaignStatus,
    campaignEndDate,
  });
  const meta = effectiveAgreementStatusMeta(effective);

  const classes =
    size === "sm"
      ? `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${meta.badgeClass}`
      : `inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${meta.badgeClass}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Click to view agreement details"
        className={`${classes} hover:opacity-85 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ink/20`}
      >
        <span className={`inline-block h-2 w-2 rounded-full ${meta.dotClass}`} />
        <span>Agreement: {meta.label}</span>
      </button>
    );
  }

  return (
    <span className={classes}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      <span>{meta.label}</span>
    </span>
  );
}

export function MessagesPage({ base }: { base: string }) {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [sendingMedia, setSendingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  // Agreement modals state
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showAgreementDetailModal, setShowAgreementDetailModal] = useState(false);
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);
  const [agreementNotice, setAgreementNotice] = useState<string | null>(null);
  // Contact profile modal
  const [selectedProfile, setSelectedProfile] = useState<{ type: "BRAND" | "CREATOR"; brand?: BrandDetailView | null; creator?: CreatorDetailView | null } | null>(null);
  const [agreementForm, setAgreementForm] = useState({
    initialPayment: "",
    startDate: "",
    endDate: "",
    deliverables: "",
    contentRequirements: "",
    additionalConditions: "",
  });

  const list = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: Conversation[] }>("/api/conversations"),
  });

  const thread = useQuery({
    queryKey: ["messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: () =>
      api<{
        conversation: ConversationDetail;
        messages: ChatMessage[];
      }>(`/api/conversations/${conversationId}/messages`),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.data?.messages.length]);

  // When opening agreement modal, prefill with campaign details
  function openAgreementModal() {
    if (!thread.data) return;
    const c = thread.data.conversation.campaign;
    setAgreementForm((prev) => ({
      ...prev,
      initialPayment: prev.initialPayment || (c.estimatedPrice ? String(c.estimatedPrice) : "5000"),
      startDate: prev.startDate || (c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
      endDate: prev.endDate || (c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : ""),
      deliverables: prev.deliverables || c.deliverables || "Standard campaign deliverables",
      contentRequirements: prev.contentRequirements || c.requirements || "High-quality content aligned with brand guidelines",
    }));
    setAgreementNotice(null);
    setShowAgreementModal(true);
  }

  async function submitAgreement(e: FormEvent) {
    e.preventDefault();
    if (!thread.data || !conversationId) return;
    setAgreementNotice(null);
    setAgreementSubmitting(true);

    try {
      const conv = thread.data.conversation;
      const initialNum = Number(agreementForm.initialPayment);
      if (!initialNum || initialNum <= 0) {
        throw new Error("Please enter a valid initial payment in rupees");
      }

      // Robust fallback resolution for campaign and creator IDs
      const campaignId = conv.campaignId || conv.campaign?.id;
      const creatorId = conv.creatorId || conv.collaboration?.creator?.id || active?.creator?.id;

      if (!campaignId || !creatorId) {
        throw new Error("Missing campaign or creator details. Please reload the conversation.");
      }

      await api("/api/agreements", {
        method: "POST",
        body: JSON.stringify({
          campaignId,
          creatorId,
          initialPayment: initialNum,
          deliverables: agreementForm.deliverables.trim() || "Standard campaign deliverables",
          contentRequirements: agreementForm.contentRequirements.trim() || "High-quality content aligned with brand guidelines",
          additionalConditions: agreementForm.additionalConditions.trim() || undefined,
          startDate: agreementForm.startDate || undefined,
          endDate: agreementForm.endDate || undefined,
        }),
      });

      // Post notification message in conversation chat
      try {
        await api(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({
            content: `Sent campaign agreement for review and signature.\n- Initial Payment (held in escrow): Rs. ${initialNum.toLocaleString("en-IN")}\n\nPlease review and sign to activate the collaboration!`,
          }),
        });
      } catch {
        // Notification message in chat is auxiliary; ignore failure
      }

      setShowAgreementModal(false);
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setAgreementNotice(err instanceof Error ? err.message : "Failed to create agreement");
    } finally {
      setAgreementSubmitting(false);
    }
  }

  function clearPendingMedia() {
    setPendingMedia(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  }

  function onMediaPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMediaError(null);
    setPendingMedia(file);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(URL.createObjectURL(file));
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversationId) return;

    const text = content.trim();

    if (pendingMedia) {
      setMediaError(null);
      setSendingMedia(true);
      try {
        const form = new FormData();
        form.append("file", pendingMedia);
        if (text) form.append("content", text);
        await api(`/api/conversations/${conversationId}/messages`, { method: "POST", body: form });
        setContent("");
        clearPendingMedia();
        await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err) {
        setMediaError(err instanceof Error ? err.message : "Could not send media");
      } finally {
        setSendingMedia(false);
      }
      return;
    }

    if (!text) return;
    setContent("");
    await api(`/api/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content: text }) });
    await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function confirmDeleteMessage() {
    if (!conversationId || !messageToDelete) return;
    setDeletingId(messageToDelete);
    try {
      await api(`/api/conversations/${conversationId}/messages/${messageToDelete}`, { method: "DELETE" });
      setMessageToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Could not delete message");
    } finally {
      setDeletingId(null);
    }
  }

  const canSend = Boolean(content.trim() || pendingMedia) && !sendingMedia;

  if (list.isLoading) return <Spinner />;
  if (list.isError) return <ErrorState message="Could not load messages." onRetry={() => void list.refetch()} />;

  const active = list.data?.conversations.find((item) => item.id === conversationId);
  const title = user?.role === "BRAND" ? active?.creator?.name : active?.brand?.companyName;
  const image = user?.role === "BRAND" ? active?.creator?.profileImage : active?.brand?.companyLogo;

  const conversation = thread.data?.conversation;
  const collaboration = conversation?.collaboration;
  const agreement = collaboration?.agreement;

  const canCreateAgreement =
    user?.role === "BRAND" &&
    conversation &&
    (!agreement || agreement.status === "DRAFT");

  const CREATOR_ALLOWED_STATUSES = new Set([
    "ACCEPTED",
    "AGREEMENT_PENDING",
    "PAYMENT_PENDING",
    "ACTIVE",
    "CONTENT_SUBMITTED",
    "PAYMENT_REQUESTED",
    "COMPLETED",
  ]);
  const creatorMessagingBlocked =
    user?.role === "CREATOR" &&
    conversation &&
    (!collaboration || !CREATOR_ALLOWED_STATUSES.has(collaboration.status));

  return (
    <div className="grid h-[calc(100vh-9.5rem)] overflow-hidden rounded-[2rem] border border-line bg-white md:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside className={`${conversationId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-line bg-soft/40`}>
        <div className="border-b border-line px-5 py-4">
          <h1 className="text-xl font-medium">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.data?.conversations.length === 0 ? <div className="p-5"><EmptyState title="No messages yet." /></div> : null}
          {list.data?.conversations.map((conv) => {
            const name = user?.role === "BRAND" ? conv.creator?.name : conv.brand?.companyName;
            const photo = user?.role === "BRAND" ? conv.creator?.profileImage : conv.brand?.companyLogo;
            const preview = conv.messages[0];
            const selected = conv.id === conversationId;
            return (
              <Link key={conv.id} to={`${base}/${conv.id}`} className={`flex items-center gap-3 border-b border-line px-4 py-3 ${selected ? "bg-white" : "hover:bg-white/70"}`}>
                <Avatar name={name ?? "?"} image={photo} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{name}</span>
                    {preview ? <span className="shrink-0 text-[11px] text-muted">{clock(preview.createdAt)}</span> : null}
                  </span>
                  <span className="flex items-center justify-between gap-1 text-xs text-muted">
                    <span className="truncate">{conv.campaign.title}</span>
                    <AgreementStatusBadge
                      size="sm"
                      agreementStatus={conv.collaboration?.agreement?.status}
                      collaborationStatus={conv.collaboration?.status}
                      initialPaymentStatus={conv.collaboration?.initialPaymentStatus}
                      campaignStatus={conv.campaign.status}
                      campaignEndDate={conv.campaign.endDate}
                    />
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {preview ? messagePreview(preview) : "No messages yet."}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main chat section */}
      <section className={`${conversationId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
        {!conversationId ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState title="Select a conversation." body="Campaign messages stay in this thread." />
          </div>
        ) : null}
        {conversationId && thread.isLoading ? <Spinner /> : null}
        {conversationId && thread.data ? (
          <>
            {/* Header with actions */}
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                <Link to={base} className="text-sm md:hidden">Back</Link>
                {user?.role === "BRAND" || (user?.role === "CREATOR" && thread.data.messages.some((m) => m.senderId !== user?.id)) ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => {
                      if (user?.role === "BRAND" && active?.creator) {
                        setSelectedProfile({ type: "CREATOR", creator: active.creator });
                      } else if (user?.role === "CREATOR" && active?.brand) {
                        setSelectedProfile({ type: "BRAND", brand: active.brand });
                      }
                    }}
                    title="View profile"
                  >
                    <Avatar name={title ?? "?"} image={image} size="h-10 w-10" shape="square" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:underline">{title}</p>
                        {collaboration ? <StatusPill status={collaboration.status} /> : null}
                      </div>
                      <p className="text-xs text-muted">{thread.data.conversation.campaign.title}</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar name={title ?? "?"} image={image} size="h-10 w-10" shape="square" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{title}</p>
                        {collaboration ? <StatusPill status={collaboration.status} /> : null}
                      </div>
                      <p className="text-xs text-muted">{thread.data.conversation.campaign.title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & Agreement Badge in Header */}
              <div className="flex flex-wrap items-center gap-2">
                <AgreementStatusBadge
                  size="md"
                  agreementStatus={agreement?.status}
                  collaborationStatus={collaboration?.status}
                  initialPaymentStatus={collaboration?.payment?.initialStatus}
                  campaignStatus={thread.data.conversation.campaign.status}
                  campaignEndDate={thread.data.conversation.campaign.endDate}
                  onClick={() => setShowAgreementDetailModal(true)}
                />

                {/* Brand side agreement actions */}
                {user?.role === "BRAND" ? (
                  canCreateAgreement ? (
                    <Button
                      variant="primary"
                      onClick={openAgreementModal}
                      className="text-xs py-1.5 px-3 bg-ink hover:opacity-90"
                    >
                      + Create Agreement
                    </Button>
                  ) : agreement ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={apiUrl(`/api/agreements/${agreement.id}/pdf`)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-ink underline hover:opacity-75"
                      >
                        PDF
                      </a>
                    </div>
                  ) : null
                ) : null}

                {/* Creator side agreement actions */}
                {user?.role === "CREATOR" && agreement ? (
                  agreement.status === "SENT" || agreement.status === "VIEWED" ? (
                    <Link to={`/creator/agreements/${agreement.id}`}>
                      <Button variant="primary" className="text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white">
                        ✍️ Review &amp; Sign
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href={apiUrl(`/api/agreements/${agreement.id}/pdf`)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-ink underline hover:opacity-75"
                      >
                        PDF
                      </a>
                    </div>
                  )
                ) : null}
              </div>
            </header>

            {/* Quick Prompt Banner for Brand if Agreement Pending */}
            {user?.role === "BRAND" && canCreateAgreement ? (
              <div className="flex items-center justify-between gap-3 bg-amber-50/70 border-b border-amber-200/60 px-4 py-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤝</span>
                  <span>
                    <strong>Ready to collaborate?</strong> Set initial payment & view-based milestone bonuses to send the agreement.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openAgreementModal}
                  className="font-medium underline hover:text-amber-950 shrink-0"
                >
                  Create Agreement now →
                </button>
              </div>
            ) : null}

            {/* Quick Prompt Banner for Creator if Agreement Sent */}
            {user?.role === "CREATOR" && agreement && (agreement.status === "SENT" || agreement.status === "VIEWED") ? (
              <div className="flex items-center justify-between gap-3 bg-blue-50/80 border-b border-blue-200/60 px-4 py-2.5 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <span>
                    <strong>Agreement received!</strong> The brand has sent campaign terms for your signature.
                  </span>
                </div>
                <Link
                  to={`/creator/agreements/${agreement.id}`}
                  className="font-semibold underline hover:text-blue-950 shrink-0"
                >
                  Review & Sign →
                </Link>
              </div>
            ) : null}

            {/* Messages Thread */}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,#ececec_1px,transparent_0)] bg-[length:18px_18px] px-4 py-5">
              {thread.data.messages.length === 0 ? <p className="text-center text-sm text-muted">No messages yet.</p> : null}
              {thread.data.messages.map((message) => {
                const mine = message.senderId === user?.id;
                const mediaUrl = message.mediaKey ? apiUrl(`/api/files/${message.mediaKey}`) : null;
                const isVideo = Boolean(message.mediaMimeType?.startsWith("video/"));
                const showCaption = Boolean(message.content && (!message.mediaKey || !isDefaultMediaCaption(message.content)));
                return (
                  <div key={message.id} className={`group flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-white"}`}>
                      {mediaUrl ? (
                        <div className="mb-1 overflow-hidden rounded-xl">
                          {isVideo ? (
                            <video src={mediaUrl} controls className="max-h-64 w-full bg-black/5" preload="metadata" />
                          ) : (
                            <a href={mediaUrl} target="_blank" rel="noreferrer">
                              <img src={mediaUrl} alt="" className="max-h-64 w-full object-cover" />
                            </a>
                          )}
                        </div>
                      ) : null}
                      {showCaption ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
                      <div
                        className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "justify-between text-white/70" : "justify-end text-muted"}`}
                      >
                        {mine ? (
                          <button
                            type="button"
                            disabled={deletingId === message.id}
                            onClick={() => setMessageToDelete(message.id)}
                            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-medium transition hover:bg-white/15 hover:text-white disabled:opacity-40"
                          >
                            <Trash2 size={11} />
                            Delete
                          </button>
                        ) : null}
                        <span>{clock(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Message input — locked for creators whose application is not yet accepted */}
            {creatorMessagingBlocked ? (
              <div className="flex items-center gap-2 border-t border-line bg-soft/60 p-4 text-sm text-muted">
                <span className="text-base">🔒</span>
                <span>Messaging becomes available after your application is accepted.</span>
              </div>
            ) : (
              <div className="border-t border-line">
                {mediaError ? (
                  <p className="px-3 pt-2 text-xs text-rose-600" role="alert">
                    {mediaError}
                  </p>
                ) : null}
                {pendingMedia && pendingPreview ? (
                  <div className="flex items-center gap-3 border-b border-line bg-soft/50 px-3 py-2">
                    {pendingMedia.type.startsWith("video/") ? (
                      <video src={pendingPreview} className="h-14 w-20 rounded-lg border border-line bg-black/5 object-cover" muted />
                    ) : (
                      <img src={pendingPreview} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">{pendingMedia.name}</p>
                      <p className="text-[11px] text-muted">Add a caption (optional), then tap Send</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPendingMedia}
                      className="rounded-full p-1.5 text-muted hover:bg-white hover:text-ink"
                      aria-label="Remove attachment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
                <form className="flex items-center gap-2 p-3" onSubmit={(event) => void send(event)}>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    className="sr-only"
                    onChange={onMediaPicked}
                    disabled={sendingMedia}
                  />
                  <button
                    type="button"
                    disabled={sendingMedia}
                    onClick={() => mediaInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:border-ink hover:text-ink disabled:opacity-40"
                    title="Attach photo or video"
                    aria-label="Attach photo or video"
                  >
                    <ImagePlus size={18} />
                  </button>
                  <input
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={pendingMedia ? "Caption (optional)" : "Write a message"}
                    disabled={sendingMedia}
                    className="h-11 flex-1 rounded-full border border-line px-4 text-sm outline-none transition focus:border-ink disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="flex h-11 min-w-[4.5rem] items-center justify-center rounded-full bg-ink px-5 text-sm text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    {sendingMedia ? <Loader2 size={18} className="animate-spin" /> : "Send"}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* Create Agreement Modal */}
      {showAgreementModal && conversation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-line max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-2xl font-semibold">Create Campaign Agreement</h2>
                <p className="text-sm text-muted mt-0.5">
                  For {active?.creator?.name} · Campaign: {conversation.campaign.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="rounded-full p-2 text-muted hover:bg-soft hover:text-ink text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={(e) => void submitAgreement(e)}>
              <Notice message={agreementNotice} />

              {/* Campaign Validity & Expiry Timeline */}
              <div className="rounded-2xl border border-line bg-soft/30 p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-sm">Campaign Validity &amp; Expiration Dates</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Define campaign valid duration. When the valid end date passes, the campaign will automatically transition to EXPIRED status.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Campaign Start Date">
                    <TextInput
                      type="date"
                      value={agreementForm.startDate}
                      onChange={(e) => setAgreementForm({ ...agreementForm, startDate: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Campaign Valid End Date (Expiry)">
                    <TextInput
                      type="date"
                      value={agreementForm.endDate}
                      onChange={(e) => setAgreementForm({ ...agreementForm, endDate: e.target.value })}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* 1. Initial Payment */}
              <div className="rounded-2xl border border-line bg-soft/30 p-4 space-y-2">
                <Field label="Initial Payment in INR (Held in Escrow)">
                  <TextInput
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={agreementForm.initialPayment}
                    onChange={(e) => setAgreementForm({ ...agreementForm, initialPayment: e.target.value })}
                    required
                  />
                </Field>
                <p className="text-xs text-muted">
                  🔒 Held securely in escrow by ChooseYourCreator. Released only after you approve deliverables. 0% platform commission.
                </p>
              </div>

              {/* 3. Deliverables & Requirements */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Deliverables">
                  <TextArea
                    value={agreementForm.deliverables}
                    onChange={(e) => setAgreementForm({ ...agreementForm, deliverables: e.target.value })}
                    rows={3}
                    required
                  />
                </Field>
                <Field label="Content Requirements">
                  <TextArea
                    value={agreementForm.contentRequirements}
                    onChange={(e) => setAgreementForm({ ...agreementForm, contentRequirements: e.target.value })}
                    rows={3}
                    required
                  />
                </Field>
              </div>

              {/* 4. Additional Conditions */}
              <Field label="Additional Conditions (Optional)">
                <TextArea
                  placeholder="e.g. Content usage rights, exclusivity period, or brand guidelines..."
                  value={agreementForm.additionalConditions}
                  onChange={(e) => setAgreementForm({ ...agreementForm, additionalConditions: e.target.value })}
                  rows={2}
                />
              </Field>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={agreementSubmitting}
                  onClick={() => setShowAgreementModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={agreementSubmitting || !agreementForm.initialPayment}
                >
                  {agreementSubmitting ? "Sending Agreement…" : "Send Agreement for Signature"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Agreement Details Modal */}
      {showAgreementDetailModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium">Agreement Details</h2>
                  <AgreementStatusBadge
                    agreementStatus={agreement?.status}
                    collaborationStatus={collaboration?.status}
                    initialPaymentStatus={collaboration?.payment?.initialStatus}
                    campaignStatus={thread.data?.conversation.campaign.status}
                    campaignEndDate={thread.data?.conversation.campaign.endDate}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {thread.data?.conversation.campaign.title} · {title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementDetailModal(false)}
                className="rounded-full p-1.5 text-muted hover:bg-soft hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* Status explanation */}
              <div className="rounded-2xl border border-line bg-soft/50 p-4">
                <p className="font-medium text-xs tracking-wider uppercase text-muted">Agreement Status Explanation</p>
                <p className="mt-1 text-ink">
                  {(() => {
                    const effective = resolveEffectiveAgreementStatus({
                      agreementStatus: agreement?.status,
                      collaborationStatus: collaboration?.status,
                      initialPaymentStatus: collaboration?.payment?.initialStatus,
                      campaignStatus: thread.data?.conversation.campaign.status,
                      campaignEndDate: thread.data?.conversation.campaign.endDate,
                    });
                    switch (effective) {
                      case "DRAFT":
                        return "Draft: No formal agreement has been issued yet. The brand can set terms and issue an agreement anytime.";
                      case "AWAITING_SIGNATURE":
                        return "Awaiting signature: The brand has issued the collaboration agreement. It is currently waiting for the creator's digital signature.";
                      case "AWAITING_PAYMENT":
                        return "Awaiting payment: The creator has signed the agreement. The brand must now deposit the agreed initial payment into holding to activate the campaign.";
                      case "ACTIVE":
                        return "Active: The agreement is fully active and the initial payment is secured in holding. Deliverables can now be submitted for review.";
                      case "COMPLETED":
                        return "Completed: Deliverables have been approved and held funds released. Collaboration is complete.";
                      case "EXPIRED":
                        return "Expired: The campaign deadline or agreement window has expired.";
                      case "CANCELLED":
                        return "Cancelled: This collaboration or campaign was cancelled.";
                    }
                  })()}
                </p>
              </div>

              {agreement ? (
                <>
                  {/* Agreement Terms */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line p-3">
                      <p className="text-xs font-medium text-muted">Initial Payment (Held)</p>
                      <p className="mt-1 text-base font-semibold">
                        {(agreement.agreementData as Record<string, string> | undefined)?.initialPayment ||
                          (collaboration?.payment ? formatInr(collaboration.payment.amount) : "As specified")}
                      </p>
                      <p className="text-[11px] text-muted">
                        Status: {collaboration?.payment?.initialStatus ? statusLabel(collaboration.payment.initialStatus) : "Pending deposit"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-line p-3">
                      <p className="text-xs font-medium text-muted">Deliverables</p>
                      <p className="mt-1 text-sm font-medium">
                        {(agreement.agreementData as Record<string, string> | undefined)?.deliverables ||
                          thread.data?.conversation.campaign.deliverables ||
                          "Standard deliverables"}
                      </p>
                    </div>
                  </div>

                  {(agreement.agreementData as Record<string, string> | undefined)?.contentRequirements ? (
                    <div className="rounded-2xl border border-line p-3">
                      <p className="text-xs font-medium text-muted">Content Requirements</p>
                      <p className="mt-1 text-xs whitespace-pre-wrap">
                        {String((agreement.agreementData as Record<string, string>).contentRequirements)}
                      </p>
                    </div>
                  ) : null}

                  {(agreement.agreementData as Record<string, string> | undefined)?.performanceTerms ? (
                    <div className="rounded-2xl border border-line p-3">
                      <p className="text-xs font-medium text-muted">Performance Payment Terms</p>
                      <p className="mt-1 text-xs whitespace-pre-wrap">
                        {String((agreement.agreementData as Record<string, string>).performanceTerms)}
                      </p>
                    </div>
                  ) : null}

                  {/* Signatures */}
                  <div className="rounded-2xl border border-line p-3 space-y-1.5 text-xs">
                    <p className="font-medium text-muted">Signatures</p>
                    <div className="flex items-center justify-between">
                      <span>Brand Signature:</span>
                      <span className="font-medium text-ink">
                        {agreement.brandSignedAt ? `Issued & Signed on ${formatDate(agreement.brandSignedAt)}` : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Creator Signature:</span>
                      <span className="font-medium text-ink">
                        {agreement.creatorSignatureName
                          ? `Signed by ${agreement.creatorSignatureName}${agreement.creatorSignedAt ? ` on ${formatDate(agreement.creatorSignedAt)}` : ""}`
                          : "Pending signature"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-muted">
                  <p>No agreement has been drafted yet for this collaboration.</p>
                </div>
              )}

              {/* Modal actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <div>
                  {agreement ? (
                    <a
                      href={apiUrl(`/api/agreements/${agreement.id}/pdf`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium underline text-ink hover:opacity-75"
                    >
                      Download Agreement PDF
                    </a>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setShowAgreementDetailModal(false)}>
                    Close
                  </Button>
                  {user?.role === "BRAND" && canCreateAgreement ? (
                    <Button onClick={() => { setShowAgreementDetailModal(false); openAgreementModal(); }}>
                      + Create Agreement
                    </Button>
                  ) : null}
                  {user?.role === "BRAND" && collaboration?.status === "PAYMENT_PENDING" ? (
                    <Link to="/brand/payments">
                      <Button className="bg-ink text-white">
                        Deposit Payment →
                      </Button>
                    </Link>
                  ) : null}
                  {user?.role === "CREATOR" && agreement && (agreement.status === "SENT" || agreement.status === "VIEWED") ? (
                    <Link to={`/creator/agreements/${agreement.id}`}>
                      <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        ✍️ Review &amp; Sign Agreement
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Contact Profile Modal */}
      {selectedProfile && (
        <ProfileDetailsModal
          type={selectedProfile.type}
          brand={selectedProfile.brand}
          creator={selectedProfile.creator}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      <ConfirmModal
        isOpen={messageToDelete !== null}
        title="Delete message?"
        message="This message will be removed for everyone in this conversation. Photos and videos attached to it will also be deleted. This cannot be undone."
        confirmText="Delete message"
        cancelText="Keep message"
        variant="danger"
        loading={deletingId !== null}
        onCancel={() => {
          if (!deletingId) setMessageToDelete(null);
        }}
        onConfirm={() => void confirmDeleteMessage()}
      />
    </div>
  );
}

