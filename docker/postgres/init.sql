-- Create both databases on first start
SELECT 'CREATE DATABASE personal_bills_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'personal_bills_db')\gexec

SELECT 'CREATE DATABASE comparison_pool_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'comparison_pool_db')\gexec
