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
        };
        Insert: {
          id?: string;
          bank_name: string;
          account_name: string;
          balance?: number;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_name?: string;
          account_name?: string;
          balance?: number;
          owner_id?: string;
          updated_at?: string;
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
        };
        Insert: {
          id?: string;
          loan_id: string;
          due_date: string;
          amount: number;
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          loan_id?: string;
          due_date?: string;
          amount?: number;
          is_paid?: boolean;
          paid_at?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
