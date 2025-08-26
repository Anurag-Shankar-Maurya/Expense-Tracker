/*
  # Create expenses, categories, and budgets tables
  1. New Tables:
     - expenses (id uuid, user_id uuid, amount numeric, date date, description text, category_id uuid, created_at timestamptz)
     - categories (id uuid, user_id uuid, name text, is_default boolean, created_at timestamptz)
     - budgets (id uuid, user_id uuid, category_id uuid, amount numeric, created_at timestamptz)
  2. Security: Enable RLS for all tables, add policies for authenticated users to manage their own data.
  3. Data: Insert default categories.
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  date date NOT NULL DEFAULT now(),
  description text,
  category_id uuid NOT NULL, -- Will be linked to categories table
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);


-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for default categories
  name text UNIQUE NOT NULL,
  is_default boolean DEFAULT FALSE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to view all categories (default and their own)
CREATE POLICY "Users can view all categories" ON categories FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_default = TRUE);
-- Allow authenticated users to insert their own custom categories
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_default = FALSE);
-- Allow authenticated users to update their own custom categories
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_default = FALSE);
-- Allow authenticated users to delete their own custom categories
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_default = FALSE);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);


-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category_id) -- Ensure only one budget per category per user
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets (category_id);


-- Add foreign key constraint from expenses to categories
ALTER TABLE expenses
ADD CONSTRAINT fk_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE RESTRICT; -- Prevent deleting a category if expenses are linked to it


-- Insert default categories if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Food', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transport' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Transport', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Housing' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Housing', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Entertainment', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Utilities' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Utilities', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Income' AND is_default = TRUE) THEN
    INSERT INTO categories (name, is_default) VALUES ('Income', TRUE);
  END IF;
END $$;