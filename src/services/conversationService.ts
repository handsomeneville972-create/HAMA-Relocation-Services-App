/**
 * HAMA Conversation & Message Service
 *
 * Queries conversations, participants, and messages from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 *
 * Uses Broadcast for live message delivery (scalable, secure).
 * Uses Presence for online/offline tracking.
 * Uses PostgreSQL for persistent read state (last_read_at).
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, DEFAULT_PAGE_SIZE } from './supabaseService';
import { MOCK_CONVERSATIONS } from '../constants/data';
import type { Conversation, Message, Block, MessageReport, ReportCategory } from '../constants/types';

const MAX_MESSAGES_PER_CONVERSATION = 50;
const MESSAGES_PAGE_SIZE = 30;

// ============================================================
// CONVERSATION QUERIES
// ============================================================

export async function getUserConversations(
  userId: string,
): Promise<{ data: Conversation[] | null; error: string | null }> {
  return executeQuery<Conversation[]>(
    async () => {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      const conversationIds = participantData?.map(d => d.conversation_id) ?? [];

      if (conversationIds.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user:user_id(*))
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })
        .limit(DEFAULT_PAGE_SIZE);

      if (error || !data) {
        return { data: data as unknown as Conversation[] | null, error };
      }

      // Attach the latest message per conversation
      const convIds = (data as unknown as Array<{ id: string }>).map(c => c.id);
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', convIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      const latestByConversation = new Map<string, { text: string; created_at: string }>();
      for (const msg of (latestMessages ?? []) as Array<{ conversation_id: string; text: string; created_at: string }>) {
        if (!latestByConversation.has(msg.conversation_id)) {
          latestByConversation.set(msg.conversation_id, msg);
        }
      }

      // Get unread counts per conversation
      const { data: participantRows } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .in('conversation_id', convIds);

      const unreadMap = new Map<string, number>();
      for (const p of participantRows ?? []) {
        const latest = latestByConversation.get(p.conversation_id);
        if (latest && (!p.last_read_at || new Date(latest.created_at) > new Date(p.last_read_at))) {
          unreadMap.set(p.conversation_id, (unreadMap.get(p.conversation_id) || 0) + 1);
        }
      }

      const enriched = (data as unknown as Array<Record<string, unknown>>).map(c => {
        const latest = latestByConversation.get(c.id as string);
        return {
          ...c,
          last_message: latest?.text ?? '',
          last_message_time: latest?.created_at ?? c.updated_at,
          unread_count: unreadMap.get(c.id as string) || 0,
        };
      });

      return { data: enriched as unknown as Conversation[], error: null };
    },
    MOCK_CONVERSATIONS.filter(c => c.participants.some(p => p.id === userId)),
  );
}

export async function getConversationById(
  conversationId: string,
): Promise<{ data: Conversation | null; error: string | null }> {
  return executeQuery<Conversation>(
    async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user:user_id(*))
        `)
        .eq('id', conversationId)
        .single();

      if (error || !data) {
        return { data: data as unknown as Conversation | null, error };
      }

      const { data: messageRows } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES_PER_CONVERSATION);

      return {
        data: {
          ...(data as object),
          messages: (messageRows ?? []).slice().reverse(),
        } as unknown as Conversation,
        error: null,
      };
    },
    MOCK_CONVERSATIONS.find(c => c.id === conversationId) ?? MOCK_CONVERSATIONS[0],
  );
}

export async function getMessages(
  conversationId: string,
): Promise<{ data: Message[] | null; error: string | null }> {
  return executeQuery<Message[]>(
    async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES_PER_CONVERSATION);
      return { data: (data ?? []).slice().reverse() as Message[] | null, error };
    },
    MOCK_CONVERSATIONS.find(c => c.id === conversationId)?.messages ?? [],
  );
}

/**
 * Paginated message loading. Returns messages older than `before` timestamp.
 */
export async function getMessagesPaginated(
  conversationId: string,
  before?: string,
  limit: number = MESSAGES_PAGE_SIZE,
): Promise<{ data: Message[] | null; error: string | null }> {
  return executeQuery<Message[]>(
    async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      return { data: (data ?? []).slice().reverse() as Message[] | null, error };
    },
    undefined,
  );
}

// ============================================================
// MESSAGE OPERATIONS
// ============================================================

/**
 * Send a message and broadcast it to other participants.
 * Supports text, image, file, property, product, service_provider, location, system types.
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  text: string;
  messageType?: string;
  attachmentUrl?: string;
  replyToId?: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const insertData: Record<string, any> = {
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        text: params.text,
        content: params.text,
        message_type: params.messageType || 'text',
      };

      if (params.attachmentUrl) insertData.attachment_url = params.attachmentUrl;
      if (params.replyToId) insertData.reply_to_id = params.replyToId;

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single();

      if (error) return { data: null, error };

      // Update conversation's last_message_id and updated_at
      await supabase
        .from('conversations')
        .update({
          last_message_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.conversationId);

      // Broadcast the message to other participants
      supabase.channel(`conversation:${params.conversationId}`).send({
        event: 'new_message',
        payload: {
          message_id: data.id,
          sender_id: data.sender_id,
          content: data.text || data.content,
          message_type: data.message_type,
          attachment_url: data.attachment_url,
          created_at: data.created_at,
          reply_to_id: data.reply_to_id,
        },
        type: 'broadcast',
      });

      return { data, error: null };
    },
    null,
  );
}

/**
 * Edit an existing text message.
 */
export async function editMessage(
  messageId: string,
  newText: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: newText,
          text: newText,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) return { data: null, error };

      // Broadcast edit event
      supabase.channel(`conversation:${data.conversation_id}`).send({
        event: 'message_edited',
        payload: {
          message_id: data.id,
          content: data.text,
          edited_at: data.edited_at,
        },
        type: 'broadcast',
      });

      return { data, error: null };
    },
    null,
  );
}

/**
 * Soft-delete a message (sets deleted_at).
 */
export async function deleteMessage(
  messageId: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) return { data: null, error };

      // Broadcast delete event
      supabase.channel(`conversation:${data.conversation_id}`).send({
        event: 'message_deleted',
        payload: { message_id: data.id },
        type: 'broadcast',
      });

      return { data, error: null };
    },
    null,
  );
}

/**
 * Mark conversation as read by updating last_read_at on the participant row.
 * Much more efficient than updating every message row.
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      return { data: null, error };
    },
    null,
  );
}

/**
 * Legacy: Mark messages as read (kept for backward compat).
 * @deprecated Use markConversationAsRead instead.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<{ error: string | null }> {
  return markConversationAsRead(conversationId, userId);
}

// ============================================================
// CONVERSATION CREATION
// ============================================================

export async function createConversation(params: {
  participantIds: string[];
  propertyId?: string;
  productId?: string;
  serviceProviderId?: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const insertData: Record<string, any> = {};
      if (params.propertyId) insertData.property_id = params.propertyId;
      if (params.productId) insertData.product_id = params.productId;
      if (params.serviceProviderId) insertData.service_provider_id = params.serviceProviderId;

      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();

      if (convError) return { data: null, error: convError };

      const participants = params.participantIds.map(userId => ({
        conversation_id: conv.id,
        user_id: userId,
      }));

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      return { data: conv, error: partError };
    },
    null,
  );
}

/**
 * Find an existing conversation between two users, or create a new one.
 * Optionally attaches context (property, product, service provider).
 * Prevents duplicate conversations for the same context.
 */
export async function findOrCreateConversation(
  userId1: string,
  userId2: string,
  context?: {
    propertyId?: string;
    productId?: string;
    serviceProviderId?: string;
  },
): Promise<{ data: { conversationId: string; isNew: boolean } | null; error: string | null }> {
  return executeQuery<{ conversationId: string; isNew: boolean }>(
    async () => {
      // Find conversations where both users are participants
      const { data: userConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId1);

      if (!userConvs || userConvs.length === 0) {
        // No conversations for user1, create new
        const insertData: Record<string, any> = {};
        if (context?.propertyId) insertData.property_id = context.propertyId;
        if (context?.productId) insertData.product_id = context.productId;
        if (context?.serviceProviderId) insertData.service_provider_id = context.serviceProviderId;

        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert(insertData)
          .select()
          .single();

        if (convError) return { data: null, error: convError };

        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: userId1 },
          { conversation_id: conv.id, user_id: userId2 },
        ]);

        return { data: { conversationId: conv.id, isNew: true }, error: null };
      }

      const convIds = userConvs.map(c => c.conversation_id);

      // Check if user2 is also in any of these conversations
      const { data: sharedConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId2)
        .in('conversation_id', convIds);

      if (sharedConvs && sharedConvs.length > 0) {
        const existingConvId = sharedConvs[0].conversation_id;

        // If context provided, check if it matches (prevent duplicate context conversations)
        if (context) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('property_id, product_id, service_provider_id')
            .eq('id', existingConvId)
            .single();

          if (conv) {
            const matchesContext =
              (context.propertyId && conv.property_id === context.propertyId) ||
              (context.productId && conv.product_id === context.productId) ||
              (context.serviceProviderId && conv.service_provider_id === context.serviceProviderId);

            if (matchesContext) {
              return { data: { conversationId: existingConvId, isNew: false }, error: null };
            }
          }
        }

        return { data: { conversationId: existingConvId, isNew: false }, error: null };
      }

      // No shared conversation, create new
      const insertData: Record<string, any> = {};
      if (context?.propertyId) insertData.property_id = context.propertyId;
      if (context?.productId) insertData.product_id = context.productId;
      if (context?.serviceProviderId) insertData.service_provider_id = context.serviceProviderId;

      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();

      if (convError) return { data: null, error: convError };

      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: userId1 },
        { conversation_id: conv.id, user_id: userId2 },
      ]);

      return { data: { conversationId: conv.id, isNew: true }, error: null };
    },
    { conversationId: 'conv1', isNew: false },
  );
}

// ============================================================
// FILE UPLOAD
// ============================================================

/**
 * Upload an attachment to Supabase Storage and return the public URL.
 */
export async function uploadAttachment(
  fileUri: string,
  fileName: string,
  conversationId: string,
  userId: string,
): Promise<{ data: { url: string; path: string } | null; error: string | null }> {
  try {
    // Read file as ArrayBuffer
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();

    const filePath = `${userId}/${conversationId}/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, arrayBuffer, {
        contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      });

    if (error) return { data: null, error: error.message };

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path);

    return { data: { url: urlData.publicUrl, path: data.path }, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message ?? 'Upload failed' };
  }
}

// ============================================================
// BLOCK / UNBLOCK
// ============================================================

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });
      return { data: null, error };
    },
    null,
  );
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);
      return { data: null, error };
    },
    null,
  );
}

export async function isBlocked(
  userId1: string,
  userId2: string,
): Promise<{ data: boolean | null; error: string | null }> {
  return executeQuery<boolean>(
    async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .limit(1);

      return { data: (data ?? []).length > 0 ? true : false, error };
    },
    false,
  );
}

// ============================================================
// REPORTS
// ============================================================

export async function reportMessage(params: {
  reporterId: string;
  reportedUserId: string;
  messageId?: string;
  conversationId?: string;
  category: ReportCategory;
  description?: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('message_reports')
        .insert({
          reporter_id: params.reporterId,
          reported_user_id: params.reportedUserId,
          message_id: params.messageId || null,
          conversation_id: params.conversationId || null,
          category: params.category,
          description: params.description || null,
        })
        .select()
        .single();

      return { data, error };
    },
    null,
  );
}

// ============================================================
// PRESENCE
// ============================================================

export async function getUserPresence(
  userId: string,
): Promise<{ data: { last_seen_at: string; is_online: boolean } | null; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('last_seen_at')
        .eq('user_id', userId)
        .single();

      if (error || !data) return { data: null, error };

      const isOnline = new Date(data.last_seen_at) > new Date(Date.now() - 120_000);
      return { data: { last_seen_at: data.last_seen_at, is_online: isOnline }, error: null };
    },
    null,
  );
}
