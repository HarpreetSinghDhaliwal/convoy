import { supabase } from "@/lib/supabase/client";
import type { ReportReason } from "../types";

export interface FileReportInput {
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  detail?: string;
  tripId?: string;
}

export async function fileReport(input: FileReportInput): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    reported_id: input.reportedId,
    reason: input.reason,
    detail: input.detail ?? null,
    trip_id: input.tripId ?? null,
  });
  if (error) throw error;
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function getBlockedUserIds(blockerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", blockerId);
  if (error) throw error;
  return (data ?? []).map((row) => row.blocked_id as string);
}
