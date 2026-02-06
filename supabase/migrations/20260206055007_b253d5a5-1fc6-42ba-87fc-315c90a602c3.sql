-- Add 'fechado' status to purchase_order_status enum
ALTER TYPE public.purchase_order_status ADD VALUE IF NOT EXISTS 'fechado';