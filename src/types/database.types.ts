export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          id: string;
          bank_name: string;
          account_name: string;
          balance: number;
          owner_id: string;
          updated_at: string;
          iban: string;
          account_type: string;
          currency: string;
          account_number: string;
          family_id: string | null;
        };
        Insert: {
          id?: string;
          bank_name: string;
          account_name: string;
          balance?: number;
          owner_id: string;
          updated_at?: string;
          iban?: string;
          account_type?: string;
          currency?: string;
          account_number?: string;
          family_id?: string | null;
        };
        Update: {
          id?: string;
          bank_name?: string;
          account_name?: string;
          balance?: number;
          owner_id?: string;
          updated_at?: string;
          iban?: string;
          account_type?: string;
          currency?: string;
          account_number?: string;
          family_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      loans: {
        Row: {
          id: string;
          bank_name: string;
          loan_type: string;
          total_amount: number;
          monthly_payment: number;
          start_date: string;
          end_date: string;
          payer_id: string;
          created_by: string;
          created_at: string;
          interest_rate: number;
          interest_type: string;
          paid_amount: number;
          remaining_balance: number;
          status: string;
          grace_period_months: number;
          statement_day: number | null;
          due_day: number | null;
          notes: string;
          updated_at: string;
          family_id: string | null;
        };
        Insert: {
          id?: string;
          bank_name: string;
          loan_type: string;
          total_amount: number;
          monthly_payment: number;
          start_date: string;
          end_date: string;
          payer_id: string;
          created_by: string;
          created_at?: string;
          interest_rate?: number;
          interest_type?: string;
          paid_amount?: number;
          remaining_balance?: number;
          status?: string;
          grace_period_months?: number;
          statement_day?: number | null;
          due_day?: number | null;
          notes?: string;
          updated_at?: string;
          family_id?: string | null;
        };
        Update: {
          id?: string;
          bank_name?: string;
          loan_type?: string;
          total_amount?: number;
          monthly_payment?: number;
          start_date?: string;
          end_date?: string;
          payer_id?: string;
          created_by?: string;
          created_at?: string;
          interest_rate?: number;
          interest_type?: string;
          paid_amount?: number;
          remaining_balance?: number;
          status?: string;
          grace_period_months?: number;
          statement_day?: number | null;
          due_day?: number | null;
          notes?: string;
          updated_at?: string;
          family_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "loans_payer_id_fkey";
            columns: ["payer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loans_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      installments: {
        Row: {
          id: string;
          loan_id: string;
          due_date: string;
          amount: number;
          is_paid: boolean;
          paid_at: string | null;
          installment_number: number;
        };
        Insert: {
          id?: string;
          loan_id: string;
          due_date: string;
          amount: number;
          is_paid?: boolean;
          paid_at?: string | null;
          installment_number?: number;
        };
        Update: {
          id?: string;
          loan_id?: string;
          due_date?: string;
          amount?: number;
          is_paid?: boolean;
          paid_at?: string | null;
          installment_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "installments_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_cards: {
        Row: {
          id: string;
          card_name: string;
          bank_name: string;
          card_limit: number;
          current_balance: number;
          minimum_payment: number;
          statement_day: number;
          due_day: number;
          status: string;
          notes: string;
          owner_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          family_id: string | null;
        };
        Insert: {
          id?: string;
          card_name: string;
          bank_name: string;
          card_limit: number;
          current_balance?: number;
          minimum_payment?: number;
          statement_day: number;
          due_day: number;
          status?: string;
          notes?: string;
          owner_id: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          family_id?: string | null;
        };
        Update: {
          id?: string;
          card_name?: string;
          bank_name?: string;
          card_limit?: number;
          current_balance?: number;
          minimum_payment?: number;
          statement_day?: number;
          due_day?: number;
          status?: string;
          notes?: string;
          owner_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          family_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credit_cards_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_cards_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      families: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
          can_view_finance: boolean;
          can_create_finance: boolean;
          can_edit_finance: boolean;
          can_delete_finance: boolean;
          can_manage_members: boolean;
          can_manage_invitations: boolean;
          can_assign_permissions: boolean;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
          can_view_finance?: boolean;
          can_create_finance?: boolean;
          can_edit_finance?: boolean;
          can_delete_finance?: boolean;
          can_manage_members?: boolean;
          can_manage_invitations?: boolean;
          can_assign_permissions?: boolean;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          joined_at?: string;
          can_view_finance?: boolean;
          can_create_finance?: boolean;
          can_edit_finance?: boolean;
          can_delete_finance?: boolean;
          can_manage_members?: boolean;
          can_manage_invitations?: boolean;
          can_assign_permissions?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_invitations: {
        Row: {
          id: string;
          family_id: string;
          invited_by: string;
          invited_email: string;
          invited_user_id: string | null;
          status: "pending" | "accepted" | "rejected" | "canceled" | "expired";
          expires_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          canceled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          invited_by: string;
          invited_email: string;
          invited_user_id?: string | null;
          status?: "pending" | "accepted" | "rejected" | "canceled" | "expired";
          expires_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          invited_by?: string;
          invited_email?: string;
          invited_user_id?: string | null;
          status?: "pending" | "accepted" | "rejected" | "canceled" | "expired";
          expires_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_invitations_invited_user_id_fkey";
            columns: ["invited_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_audit_logs: {
        Row: {
          id: string;
          family_id: string;
          actor_user_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          actor_user_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          actor_user_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_audit_logs_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_card_installments: {
        Row: {
          id: string;
          credit_card_id: string;
          merchant_name: string;
          description: string;
          total_amount: number;
          installment_count: number;
          installment_amount: number;
          paid_installments: number;
          start_date: string;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          credit_card_id: string;
          merchant_name: string;
          description?: string;
          total_amount: number;
          installment_count: number;
          installment_amount: number;
          paid_installments?: number;
          start_date: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          credit_card_id?: string;
          merchant_name?: string;
          description?: string;
          total_amount?: number;
          installment_count?: number;
          installment_amount?: number;
          paid_installments?: number;
          start_date?: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_card_installments_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_family_with_admin: {
        Args: {
          family_name: string;
        };
        Returns: string;
      };
      get_my_admin_family_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      get_my_family_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      has_family_permission: {
        Args: {
          p_user_id: string;
          p_family_id: string;
          p_permission: string;
        };
        Returns: boolean;
      };
      add_family_audit_log: {
        Args: {
          p_family_id: string;
          p_actor_user_id: string;
          p_action: string;
          p_target_type?: string;
          p_target_id?: string;
          p_metadata?: Json;
        };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
