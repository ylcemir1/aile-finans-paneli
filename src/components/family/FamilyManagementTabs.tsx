"use client";

import { useState } from "react";
import { FamilyMembers } from "./FamilyMembers";
import { FamilyInvitationsPanel } from "./FamilyInvitationsPanel";
import { FamilyLeaveButton } from "./FamilyLeaveButton";

type TabId = "members" | "invitations" | "settings";

interface FamilyManagementTabsProps {
  members: {
    id: string;
    user_id: string;
    role: "admin" | "member";
    joined_at: string;
    full_name: string;
    can_view_finance: boolean;
    can_create_finance: boolean;
    can_edit_finance: boolean;
    can_delete_finance: boolean;
    can_manage_members: boolean;
    can_manage_invitations: boolean;
    can_assign_permissions: boolean;
  }[];
  invitations: {
    id: string;
    invited_email: string;
    status: "pending" | "accepted" | "rejected" | "canceled" | "expired";
    created_at: string;
    expires_at: string | null;
  }[];
  myRole: "admin" | "member";
  myPermissions: {
    can_manage_members: boolean;
    can_manage_invitations: boolean;
    can_assign_permissions: boolean;
  };
  currentUserId: string;
}

const tabs: { id: TabId; label: string }[] = [
  { id: "members", label: "Uyeler" },
  { id: "invitations", label: "Davetler" },
  { id: "settings", label: "Ayarlar" },
];

export function FamilyManagementTabs({
  members,
  invitations,
  myRole,
  myPermissions,
  currentUserId,
}: FamilyManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("members");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "members" && (
        <FamilyMembers
          members={members}
          myPermissions={{
            can_manage_members: myPermissions.can_manage_members,
            can_assign_permissions: myPermissions.can_assign_permissions,
          }}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === "invitations" && (
        <FamilyInvitationsPanel
          invitations={invitations}
          canManageInvitations={myPermissions.can_manage_invitations}
        />
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Aileden ayrilma veya aileyi silme islemlerini buradan yapabilirsiniz.
          </p>
          <FamilyLeaveButton myRole={myRole} />
        </div>
      )}
    </div>
  );
}
