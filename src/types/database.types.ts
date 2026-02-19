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
