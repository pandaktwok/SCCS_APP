-- SCCS Database Schema
-- Host: 192.168.15.4 | DB: casaos | User: casaos

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., FIA, FMI, Município
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    termo VARCHAR(255) NOT NULL, -- e.g., T 3104
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, termo)
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2),
    file_path VARCHAR(500) NOT NULL, -- Location like /DATA/Files/SCCS/[ANO]/[MES]/[PROJETO]/
    status VARCHAR(50) DEFAULT 'A_PAGAR', -- 'A_PAGAR', 'AGUARDANDO_PIX', 'PAGO'
    pix_receipt_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP
);

-- Insert default user for testing (admin/admin hashed or raw since it's an internal tool, but better hashed in prod)
-- Insert default categories
INSERT INTO categories (name) VALUES ('FIA'), ('FMI'), ('Município') ON CONFLICT DO NOTHING;
