export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      breakages: {
        Row: {
          batch_id: string | null
          cost_per_unit: number
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: Database["public"]["Enums"]["breakage_reason"]
          total_loss: number
        }
        Insert: {
          batch_id?: string | null
          cost_per_unit: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: Database["public"]["Enums"]["breakage_reason"]
          total_loss: number
        }
        Update: {
          batch_id?: string | null
          cost_per_unit?: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: Database["public"]["Enums"]["breakage_reason"]
          total_loss?: number
        }
        Relationships: [
          {
            foreignKeyName: "breakages_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          codigo_balanca: string | null
          created_at: string
          custo_compra: number | null
          fator_conversao: number | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          plu: string
          price: number
          shelf_life: number | null
          supplier_id: string | null
          unit: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          codigo_balanca?: string | null
          created_at?: string
          custo_compra?: number | null
          fator_conversao?: number | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          plu: string
          price?: number
          shelf_life?: number | null
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          codigo_balanca?: string | null
          created_at?: string
          custo_compra?: number | null
          fator_conversao?: number | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          plu?: string
          price?: number
          shelf_life?: number | null
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          id: string
          items_count: number
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          items_count?: number
          total?: number
        }
        Update: {
          created_at?: string
          id?: string
          items_count?: number
          total?: number
        }
        Relationships: []
      }
      stock_batches: {
        Row: {
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          product_id: string
          quantity: number
          received_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id: string
          quantity?: number
          received_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id?: string
          quantity?: number
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          payment_terms: number | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          payment_terms?: number | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          payment_terms?: number | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      breakage_reason:
        | "vencido"
        | "danificado"
        | "furto"
        | "erro_operacional"
        | "outro"
      product_category:
        | "frutas"
        | "verduras"
        | "legumes"
        | "temperos"
        | "outros"
      unit_type: "kg" | "un" | "maco" | "bandeja"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      breakage_reason: [
        "vencido",
        "danificado",
        "furto",
        "erro_operacional",
        "outro",
      ],
      product_category: ["frutas", "verduras", "legumes", "temperos", "outros"],
      unit_type: ["kg", "un", "maco", "bandeja"],
    },
  },
} as const
