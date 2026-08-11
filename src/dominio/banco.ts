export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      atribuicao_eixo: {
        Row: {
          eixo: string
          encontro_id: string
          mentor_id: string
        }
        Insert: {
          eixo: string
          encontro_id: string
          mentor_id: string
        }
        Update: {
          eixo?: string
          encontro_id?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atribuicao_eixo_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicao_eixo_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      edicao: {
        Row: {
          fim: string | null
          id: string
          inicio: string | null
          nome: string
          status: Database["public"]["Enums"]["status_ed"]
        }
        Insert: {
          fim?: string | null
          id?: string
          inicio?: string | null
          nome: string
          status?: Database["public"]["Enums"]["status_ed"]
        }
        Update: {
          fim?: string | null
          id?: string
          inicio?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["status_ed"]
        }
        Relationships: []
      }
      email_autorizado: {
        Row: {
          convidado_por: string | null
          criado_em: string
          edicao_id: string
          email: string
          papel: Database["public"]["Enums"]["papel"]
        }
        Insert: {
          convidado_por?: string | null
          criado_em?: string
          edicao_id: string
          email: string
          papel: Database["public"]["Enums"]["papel"]
        }
        Update: {
          convidado_por?: string | null
          criado_em?: string
          edicao_id?: string
          email?: string
          papel?: Database["public"]["Enums"]["papel"]
        }
        Relationships: [
          {
            foreignKeyName: "email_autorizado_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_autorizado_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "edicao"
            referencedColumns: ["id"]
          },
        ]
      }
      encontro: {
        Row: {
          data: string
          edicao_id: string
          framework: Database["public"]["Enums"]["framework"]
          id: string
          liberado_em: string | null
          numero: number
          status: Database["public"]["Enums"]["status_enc"]
          tema: string
        }
        Insert: {
          data: string
          edicao_id: string
          framework: Database["public"]["Enums"]["framework"]
          id?: string
          liberado_em?: string | null
          numero: number
          status?: Database["public"]["Enums"]["status_enc"]
          tema: string
        }
        Update: {
          data?: string
          edicao_id?: string
          framework?: Database["public"]["Enums"]["framework"]
          id?: string
          liberado_em?: string | null
          numero?: number
          status?: Database["public"]["Enums"]["status_enc"]
          tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontro_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "edicao"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          atualizado_em: string
          criado_em: string
          eixo: string
          encontro_id: string
          id: string
          mentor_id: string
          nao_observado: boolean
          nota: number | null
          observacao_interna: string | null
          participacao_id: string
          ponto: string
          situacao: string
          sugestao: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          eixo: string
          encontro_id: string
          id?: string
          mentor_id: string
          nao_observado?: boolean
          nota?: number | null
          observacao_interna?: string | null
          participacao_id: string
          ponto: string
          situacao: string
          sugestao: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          eixo?: string
          encontro_id?: string
          id?: string
          mentor_id?: string
          nao_observado?: boolean
          nota?: number | null
          observacao_interna?: string | null
          participacao_id?: string
          ponto?: string
          situacao?: string
          sugestao?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_participacao_id_fkey"
            columns: ["participacao_id"]
            isOneToOne: false
            referencedRelation: "participacao"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagem_anonima: {
        Row: {
          encontro_id: string
          id: string
          ordem_aleatoria: number
          texto: string
        }
        Insert: {
          encontro_id: string
          id?: string
          ordem_aleatoria?: number
          texto: string
        }
        Update: {
          encontro_id?: string
          id?: string
          ordem_aleatoria?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagem_anonima_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagem_enviada: {
        Row: {
          encontro_id: string
          participacao_id: string
        }
        Insert: {
          encontro_id: string
          participacao_id: string
        }
        Update: {
          encontro_id?: string
          participacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagem_enviada_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagem_enviada_participacao_id_fkey"
            columns: ["participacao_id"]
            isOneToOne: false
            referencedRelation: "participacao"
            referencedColumns: ["id"]
          },
        ]
      }
      participacao: {
        Row: {
          edicao_id: string
          id: string
          status: Database["public"]["Enums"]["status_part"]
          usuario_id: string
        }
        Insert: {
          edicao_id: string
          id?: string
          status?: Database["public"]["Enums"]["status_part"]
          usuario_id: string
        }
        Update: {
          edicao_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_part"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participacao_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "edicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      presenca: {
        Row: {
          encontro_id: string
          marcado_em: string
          marcado_por: string
          participacao_id: string
          status: Database["public"]["Enums"]["presenca_st"]
        }
        Insert: {
          encontro_id: string
          marcado_em?: string
          marcado_por: string
          participacao_id: string
          status: Database["public"]["Enums"]["presenca_st"]
        }
        Update: {
          encontro_id?: string
          marcado_em?: string
          marcado_por?: string
          participacao_id?: string
          status?: Database["public"]["Enums"]["presenca_st"]
        }
        Relationships: [
          {
            foreignKeyName: "presenca_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenca_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenca_participacao_id_fkey"
            columns: ["participacao_id"]
            isOneToOne: false
            referencedRelation: "participacao"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          avatar_url: string | null
          email: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel"]
        }
        Insert: {
          avatar_url?: string | null
          email: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel"]
        }
        Update: {
          avatar_url?: string | null
          email?: string
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel"]
        }
        Relationships: []
      }
    }
    Views: {
      feedback_visivel: {
        Row: {
          eixo: string | null
          encontro_id: string | null
          id: string | null
          mentor_id: string | null
          participacao_id: string | null
          ponto: string | null
          situacao: string | null
          sugestao: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_participacao_id_fkey"
            columns: ["participacao_id"]
            isOneToOne: false
            referencedRelation: "participacao"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      contar_mensagens_do_encontro: {
        Args: { p_encontro: string }
        Returns: number
      }
      enviar_mensagem_anonima: {
        Args: { p_encontro: string; p_texto: string }
        Returns: undefined
      }
      liberar_encontro: { Args: { p_encontro: string }; Returns: undefined }
      provisionar_acesso: {
        Args: { p_avatar?: string; p_nome: string }
        Returns: Json
      }
    }
    Enums: {
      framework: "oratoria" | "bomba" | "negociacao" | "nenhum"
      papel: "participante" | "mentor"
      presenca_st: "presente" | "ausente" | "justificado"
      status_ed: "ativa" | "encerrada"
      status_enc: "rascunho" | "aberto" | "liberado"
      status_part: "ativo" | "desligado" | "aprovado" | "nao_aprovado"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      framework: ["oratoria", "bomba", "negociacao", "nenhum"],
      papel: ["participante", "mentor"],
      presenca_st: ["presente", "ausente", "justificado"],
      status_ed: ["ativa", "encerrada"],
      status_enc: ["rascunho", "aberto", "liberado"],
      status_part: ["ativo", "desligado", "aprovado", "nao_aprovado"],
    },
  },
} as const

