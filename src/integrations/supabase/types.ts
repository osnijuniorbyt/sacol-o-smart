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
      locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_capacity: number | null
          name: string
          temperature_max: number | null
          temperature_min: number | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          name: string
          temperature_max?: number | null
          temperature_min?: number | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          name?: string
          temperature_max?: number | null
          temperature_min?: number | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: []
      }
      packagings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_returnable: boolean
          material: Database["public"]["Enums"]["packaging_material"]
          name: string
          tare_weight: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_returnable?: boolean
          material?: Database["public"]["Enums"]["packaging_material"]
          name: string
          tare_weight?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_returnable?: boolean
          material?: Database["public"]["Enums"]["packaging_material"]
          name?: string
          tare_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          type: Database["public"]["Enums"]["person_type"]
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["person_type"]
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["person_type"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          codigo_balanca: string | null
          created_at: string
          custo_compra: number | null
          fator_conversao: number | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock: number
          name: string
          plu: string
          price: number
          shelf_life: number | null
          supplier_id: string | null
          ultimo_preco_caixa: number | null
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
          image_url?: string | null
          is_active?: boolean
          min_stock?: number
          name: string
          plu: string
          price?: number
          shelf_life?: number | null
          supplier_id?: string | null
          ultimo_preco_caixa?: number | null
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
          image_url?: string | null
          is_active?: boolean
          min_stock?: number
          name?: string
          plu?: string
          price?: number
          shelf_life?: number | null
          supplier_id?: string | null
          ultimo_preco_caixa?: number | null
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
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          estimated_kg: number
          id: string
          order_id: string
          product_id: string
          quantity: number
          quantity_received: number | null
          unit: string
          unit_cost_actual: number | null
          unit_cost_estimated: number | null
        }
        Insert: {
          created_at?: string
          estimated_kg: number
          id?: string
          order_id: string
          product_id: string
          quantity: number
          quantity_received?: number | null
          unit?: string
          unit_cost_actual?: number | null
          unit_cost_estimated?: number | null
        }
        Update: {
          created_at?: string
          estimated_kg?: number
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          quantity_received?: number | null
          unit?: string
          unit_cost_actual?: number | null
          unit_cost_estimated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          edited_at: string | null
          id: string
          notes: string | null
          offline_id: string | null
          received_at: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string | null
          total_estimated: number
          total_received: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          id?: string
          notes?: string | null
          offline_id?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_estimated?: number
          total_received?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          id?: string
          notes?: string | null
          offline_id?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_estimated?: number
          total_received?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_photos: {
        Row: {
          captured_at: string
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          notes: string | null
          order_id: string
          photo_url: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          notes?: string | null
          order_id: string
          photo_url: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiving_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
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
          location_id: string | null
          product_id: string
          quantity: number
          received_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          product_id: string
          quantity?: number
          received_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          product_id?: string
          quantity?: number
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_associations: {
        Row: {
          created_at: string | null
          id: string
          last_purchase_at: string | null
          preco_medio: number | null
          product_id: string
          quantidade_compras: number | null
          supplier_id: string
          total_kg_comprado: number | null
          ultimo_preco: number | null
          ultimo_vasilhame_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_purchase_at?: string | null
          preco_medio?: number | null
          product_id: string
          quantidade_compras?: number | null
          supplier_id: string
          total_kg_comprado?: number | null
          ultimo_preco?: number | null
          ultimo_vasilhame_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_purchase_at?: string | null
          preco_medio?: number | null
          product_id?: string
          quantidade_compras?: number | null
          supplier_id?: string
          total_kg_comprado?: number | null
          ultimo_preco?: number | null
          ultimo_vasilhame_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_associations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_associations_ultimo_vasilhame_id_fkey"
            columns: ["ultimo_vasilhame_id"]
            isOneToOne: false
            referencedRelation: "packagings"
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_main_supplier: {
        Row: {
          product_id: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_supplier_rankings: {
        Row: {
          last_order: string | null
          order_count: number | null
          product_id: string | null
          rank: number | null
          supplier_id: string | null
          supplier_name: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_ranking: {
        Row: {
          category: Database["public"]["Enums"]["product_category"] | null
          last_purchase_at: string | null
          preco_medio: number | null
          product_id: string | null
          product_name: string | null
          quantidade_compras: number | null
          rank: number | null
          supplier_id: string | null
          supplier_name: string | null
          total_kg_comprado: number | null
          ultimo_preco: number | null
          ultimo_vasilhame_id: string | null
          vasilhame_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_associations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_associations_ultimo_vasilhame_id_fkey"
            columns: ["ultimo_vasilhame_id"]
            isOneToOne: false
            referencedRelation: "packagings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_real_cost: {
        Args: {
          p_custo_descarga?: number
          p_order_id: string
          p_valor_frete?: number
        }
        Returns: {
          custo_kg_rateado: number
          custo_real_kg: number
          peso_liquido: number
          preco_kg: number
          product_id: string
          product_name: string
        }[]
      }
      get_critical_stock_products: {
        Args: never
        Returns: {
          current_stock: number
          deficit: number
          min_stock: number
          product_id: string
          product_name: string
        }[]
      }
      get_expiring_batches: {
        Args: { p_days?: number }
        Returns: {
          batch_id: string
          days_until_expiry: number
          expiry_date: string
          product_id: string
          product_name: string
          quantity: number
        }[]
      }
      get_supplier_products: {
        Args: { p_supplier_id: string }
        Returns: {
          category: string
          last_purchase_at: string
          preco_medio: number
          product_id: string
          product_name: string
          quantidade_compras: number
          ultimo_preco: number
          ultimo_vasilhame_id: string
          vasilhame_nome: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      update_supplier_product_packaging: {
        Args: {
          p_packaging_id: string
          p_product_id: string
          p_supplier_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      breakage_reason:
        | "vencido"
        | "danificado"
        | "furto"
        | "erro_operacional"
        | "outro"
      location_type:
        | "box_ceasa"
        | "camara_fria"
        | "pulmao"
        | "deposito"
        | "gondola"
      packaging_material: "plastico" | "madeira" | "papelao" | "isopor"
      person_type: "funcionario" | "cliente" | "motorista"
      product_category:
        | "frutas"
        | "verduras"
        | "legumes"
        | "temperos"
        | "outros"
      purchase_order_status: "rascunho" | "enviado" | "recebido" | "cancelado"
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
      app_role: ["admin", "moderator", "user"],
      breakage_reason: [
        "vencido",
        "danificado",
        "furto",
        "erro_operacional",
        "outro",
      ],
      location_type: [
        "box_ceasa",
        "camara_fria",
        "pulmao",
        "deposito",
        "gondola",
      ],
      packaging_material: ["plastico", "madeira", "papelao", "isopor"],
      person_type: ["funcionario", "cliente", "motorista"],
      product_category: ["frutas", "verduras", "legumes", "temperos", "outros"],
      purchase_order_status: ["rascunho", "enviado", "recebido", "cancelado"],
      unit_type: ["kg", "un", "maco", "bandeja"],
    },
  },
} as const
