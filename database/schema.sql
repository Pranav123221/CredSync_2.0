-- CredSync Advanced PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    risk_score INTEGER DEFAULT 0, -- AI calculated risk score (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, PARTIAL, PAID, OVERDUE, DISPUTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    credit_id UUID REFERENCES credits(id),
    amount_paid DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    razorpay_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SUCCESS'
);

-- Indexes for performance
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credits_due_date ON credits(due_date);
CREATE INDEX idx_payments_customer ON payments(customer_id);
