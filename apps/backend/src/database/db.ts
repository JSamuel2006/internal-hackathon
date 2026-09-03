import pg from 'pg';
import { env } from '../configuration/environment.js';
import { logger } from '../logging/logger.js';

const { Pool } = pg;

// ─────────────────────────────────────────────────────────────
// Pool configuration — single shared pool for the entire process
// ─────────────────────────────────────────────────────────────
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  // Production-grade pool settings
  max: 10,                    // max connections in pool
  idleTimeoutMillis: 30000,   // close idle clients after 30 s
  connectionTimeoutMillis: 5000, // throw if no connection acquired in 5 s
});

// ─────────────────────────────────────────────────────────────
// Pool event listeners — structured logging for DBA visibility
// ─────────────────────────────────────────────────────────────
pool.on('connect', () => {
  logger.info({ tag: '[DATABASE]', message: 'PostgreSQL client connected from pool' });
});

pool.on('acquire', () => {
  // Only log at debug level to avoid flooding — uncomment if needed
  // logger.debug({ tag: '[DATABASE]', message: 'PostgreSQL client acquired from pool' });
});

pool.on('remove', () => {
  logger.info({ tag: '[DATABASE]', message: 'PostgreSQL client removed from pool (idle timeout)' });
});

pool.on('error', (err: Error) => {
  logger.error({
    tag: '[DATABASE]',
    message: '❌ PostgreSQL pool idle-client error — a background client failed',
    error: err.message,
    stack: err.stack,
  });
});

// ─────────────────────────────────────────────────────────────
// checkDatabaseHealth — lightweight ping for readiness checks
// Returns latency in ms, or throws if connection fails
// ─────────────────────────────────────────────────────────────
export async function checkDatabaseHealth(): Promise<{ latency: number; tablesVerified: boolean }> {
  const t0 = Date.now();
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    const latency = Date.now() - t0;

    // Verify medical_reports table exists
    const tableCheck = await client.query(
      `SELECT to_regclass('public.medical_reports') AS tbl`
    );
    const tablesVerified = tableCheck.rows[0]?.tbl !== null;

    return { latency, tablesVerified };
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// initializeDatabase — called once at startup, THROWS on failure
// so server.ts can detect DB unavailability and abort startup
// ─────────────────────────────────────────────────────────────
export async function initializeDatabase(): Promise<void> {
  logger.info({ tag: '[DATABASE]', message: 'Acquiring PostgreSQL client for schema initialization...' });

  let client: pg.PoolClient;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    throw new Error(`[DATABASE] Cannot connect to PostgreSQL: ${connErr.message}`);
  }

  try {
    logger.info({ tag: '[SCHEMA]', message: 'Verifying medical_reports table schema...' });

    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_reports (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        report_name VARCHAR(255),
        report_type VARCHAR(255),
        hospital_name VARCHAR(255),
        doctor_name VARCHAR(255),
        report_date VARCHAR(255),
        file_name VARCHAR(255),
        file_url VARCHAR(255),
        file_type VARCHAR(255),
        ocr_text TEXT,
        structured_json TEXT,
        gemini_analysis TEXT,
        abnormal_values TEXT,
        health_score INTEGER,
        risk_level VARCHAR(255),
        specialist_recommended VARCHAR(255),
        confidence_score INTEGER,
        status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        bed_occupancy INTEGER DEFAULT 0,
        emergency_queue INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(255) PRIMARY KEY,
        hospital_id VARCHAR(255) REFERENCES hospitals(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        specialty VARCHAR(255),
        availability TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        doctor_id VARCHAR(255) REFERENCES doctors(id) ON DELETE CASCADE,
        hospital_id VARCHAR(255) REFERENCES hospitals(id) ON DELETE CASCADE,
        date VARCHAR(255),
        time VARCHAR(255),
        status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS treatment_plans (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        doctor_id VARCHAR(255) REFERENCES doctors(id) ON DELETE CASCADE,
        clinical_notes TEXT,
        medicines TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS laboratories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lab_orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        lab_id VARCHAR(255) REFERENCES laboratories(id) ON DELETE CASCADE,
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(255),
        result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pharmacies (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS medicine_inventory (
        id VARCHAR(255) PRIMARY KEY,
        pharmacy_id VARCHAR(255) REFERENCES pharmacies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        stock_count INTEGER DEFAULT 0,
        expiry_date VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        doctor_id VARCHAR(255) REFERENCES doctors(id) ON DELETE CASCADE,
        medicines TEXT,
        status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS medicine_dispensing (
        id VARCHAR(255) PRIMARY KEY,
        prescription_id VARCHAR(255) REFERENCES prescriptions(id) ON DELETE CASCADE,
        pharmacy_id VARCHAR(255) REFERENCES pharmacies(id) ON DELETE CASCADE,
        dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS medicine_reminders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        medicine_name VARCHAR(255) NOT NULL,
        time_slot VARCHAR(255) NOT NULL,
        status VARCHAR(255) DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_assistant_history (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        language VARCHAR(50),
        medicine VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assistant_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        language VARCHAR(50) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assistant_messages (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES assistant_sessions(id) ON DELETE CASCADE,
        sender VARCHAR(50) NOT NULL, -- USER or AI
        message TEXT NOT NULL,
        ai_response TEXT,
        patient_context_snapshot TEXT,
        confidence NUMERIC(5,2),
        language VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mother_profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        abha_id VARCHAR(255),
        edd VARCHAR(255),
        pregnancy_risk VARCHAR(50) DEFAULT 'Low',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS child_profiles (
        id VARCHAR(255) PRIMARY KEY,
        mother_id VARCHAR(255) REFERENCES mother_profiles(id) ON DELETE CASCADE,
        abha_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        birth_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pregnancy_records (
        id VARCHAR(255) PRIMARY KEY,
        mother_id VARCHAR(255) REFERENCES mother_profiles(id) ON DELETE CASCADE,
        trimester INTEGER,
        weight NUMERIC(5,2),
        systolic INTEGER,
        diastolic INTEGER,
        symptoms TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vaccination_records (
        id VARCHAR(255) PRIMARY KEY,
        profile_id VARCHAR(255) NOT NULL,
        vaccine_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        due_date VARCHAR(255),
        administered_date VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS growth_records (
        id VARCHAR(255) PRIMARY KEY,
        child_id VARCHAR(255) REFERENCES child_profiles(id) ON DELETE CASCADE,
        height NUMERIC(5,2),
        weight NUMERIC(5,2),
        bmi NUMERIC(5,2),
        percentile INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS milestone_records (
        id VARCHAR(255) PRIMARY KEY,
        child_id VARCHAR(255) REFERENCES child_profiles(id) ON DELETE CASCADE,
        milestone VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_alerts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        hospital_id VARCHAR(255),
        eta VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Dispatched',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scheme_eligibility (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        scheme_name VARCHAR(255) NOT NULL,
        eligible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id VARCHAR(255) PRIMARY KEY,
        owner_user_id VARCHAR(255) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        gender VARCHAR(50),
        date_of_birth VARCHAR(50),
        blood_group VARCHAR(50),
        abha_id VARCHAR(255),
        allergies TEXT,
        chronic_conditions TEXT,
        emergency_contact VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS telemedicine_sessions (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) NOT NULL,
        doctor_id VARCHAR(255),
        appointment_id VARCHAR(255),
        meeting_link TEXT,
        consultation_notes TEXT,
        prescription_reference TEXT,
        session_status VARCHAR(50) DEFAULT 'Waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wearable_health_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        heart_rate INTEGER,
        blood_pressure_systolic INTEGER,
        blood_pressure_diastolic INTEGER,
        spo2 INTEGER,
        glucose INTEGER,
        sleep_hours NUMERIC(4,2),
        calories INTEGER,
        steps INTEGER,
        bmi NUMERIC(5,2),
        device_name VARCHAR(255),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'Normal',
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        role VARCHAR(100),
        module VARCHAR(100),
        action VARCHAR(100),
        entity VARCHAR(100),
        entity_id VARCHAR(255),
        ip_address VARCHAR(100),
        browser VARCHAR(255),
        device VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS offline_sync_queue (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        sync_status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP
      );
    `);

    // ─── EMERGENCY RESPONSE NETWORK TABLES ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        companion_name VARCHAR(255),
        companion_phone VARCHAR(255),
        latitude NUMERIC(10, 7) NOT NULL,
        longitude NUMERIC(10, 7) NOT NULL,
        status VARCHAR(50) DEFAULT 'CREATED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_classifications (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        confidence NUMERIC(4, 3) NOT NULL,
        source VARCHAR(100) NOT NULL,
        summary TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_hospital_alerts (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        hospital_id VARCHAR(255) REFERENCES hospitals(id) ON DELETE CASCADE,
        eta VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ALERTED',
        notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_pharmacy_alerts (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        pharmacy_id VARCHAR(255) REFERENCES pharmacies(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'ALERTED',
        assistance_details TEXT,
        pharmacist_id VARCHAR(255),
        notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP,
        prepared_at TIMESTAMP,
        rejected_at TIMESTAMP,
        escalated_at TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);
    // Phase C: safe column migrations if table already existed without new columns
    for (const col of [
      ['pharmacist_id', 'VARCHAR(255)'],
      ['acknowledged_at', 'TIMESTAMP'],
      ['prepared_at', 'TIMESTAMP'],
      ['rejected_at', 'TIMESTAMP'],
      ['escalated_at', 'TIMESTAMP'],
      ['resolved_at', 'TIMESTAMP'],
    ]) {
      await client.query(`ALTER TABLE emergency_pharmacy_alerts ADD COLUMN IF NOT EXISTS ${col[0]} ${col[1]}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_consents (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        authorized_entity VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        consent_scope TEXT,
        authorized_at TIMESTAMP,
        expires_at TIMESTAMP,
        revoked_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_events (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        description TEXT,
        actor VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Phase B — Emergency Doctor requests & chat messages tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_doctor_requests (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        citizen_user_id VARCHAR(255) NOT NULL,
        doctor_id VARCHAR(255) REFERENCES doctors(id) ON DELETE SET NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'REQUESTED',
        patient_language VARCHAR(50) DEFAULT 'ta',
        doctor_language VARCHAR(50) DEFAULT 'en',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        closed_at TIMESTAMP
      );
    `);

    // Safe column migrations for existing emergency_doctor_requests
    for (const col of [
      ['patient_language', "VARCHAR(50) DEFAULT 'ta'"],
      ['doctor_language', "VARCHAR(50) DEFAULT 'en'"],
    ]) {
      await client.query(`ALTER TABLE emergency_doctor_requests ADD COLUMN IF NOT EXISTS ${col[0]} ${col[1]}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_chat_messages (
        id VARCHAR(255) PRIMARY KEY,
        emergency_id VARCHAR(255) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
        conversation_id VARCHAR(255) REFERENCES emergency_doctor_requests(id) ON DELETE CASCADE,
        sender_user_id VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        original_text TEXT,
        original_language VARCHAR(50),
        translated_text TEXT,
        translated_language VARCHAR(50),
        translations_json TEXT,
        translation_status VARCHAR(50) DEFAULT 'COMPLETED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );
    `);

    // Safe column migrations for existing emergency_chat_messages
    for (const col of [
      ['original_text', 'TEXT'],
      ['original_language', 'VARCHAR(50)'],
      ['translated_text', 'TEXT'],
      ['translated_language', 'VARCHAR(50)'],
      ['translations_json', 'TEXT'],
      ['translation_status', "VARCHAR(50) DEFAULT 'COMPLETED'"],
    ]) {
      await client.query(`ALTER TABLE emergency_chat_messages ADD COLUMN IF NOT EXISTS ${col[0]} ${col[1]}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS screening_records (
        id VARCHAR(255) PRIMARY KEY,
        client_record_id VARCHAR(255) UNIQUE,
        worker_user_id VARCHAR(255) NOT NULL,
        citizen_user_id VARCHAR(255) NOT NULL,
        citizen_name VARCHAR(255) NOT NULL,
        village VARCHAR(255) NOT NULL,
        screening_date TIMESTAMP NOT NULL,
        systolic INTEGER,
        systolic_status VARCHAR(50),
        diastolic INTEGER,
        diastolic_status VARCHAR(50),
        pulse INTEGER,
        pulse_status VARCHAR(50),
        spo2 INTEGER,
        spo2_status VARCHAR(50),
        temperature NUMERIC(4, 1),
        temperature_status VARCHAR(50),
        glucose INTEGER,
        glucose_status VARCHAR(50),
        weight NUMERIC(5, 2),
        weight_status VARCHAR(50),
        height NUMERIC(5, 2),
        height_status VARCHAR(50),
        known_conditions TEXT,
        allergies TEXT,
        current_medicines TEXT,
        symptoms TEXT,
        risk_flags TEXT,
        risk_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure all performance indices exist
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON medical_reports(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_reports_report_type ON medical_reports(report_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_reports_created_at ON medical_reports(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_reports_report_date ON medical_reports(report_date);`);

    // Indices for Emergency tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_sessions_user_id ON emergency_sessions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_sessions_status ON emergency_sessions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_classifications_emergency_id ON emergency_classifications(emergency_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_hospital_alerts_emergency_id ON emergency_hospital_alerts(emergency_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_hospital_alerts_hospital_id ON emergency_hospital_alerts(hospital_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_pharmacy_alerts_emergency_id ON emergency_pharmacy_alerts(emergency_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_pharmacy_alerts_pharmacy_id ON emergency_pharmacy_alerts(pharmacy_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_pharmacy_alerts_status ON emergency_pharmacy_alerts(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_pharmacy_alerts_notified_at ON emergency_pharmacy_alerts(notified_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_consents_emergency_id ON emergency_consents(emergency_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_emergency_events_emergency_id ON emergency_events(emergency_id);`);

    // Indices for Phase B Doctor chat
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edr_emergency_id ON emergency_doctor_requests(emergency_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edr_citizen_user_id ON emergency_doctor_requests(citizen_user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edr_doctor_id ON emergency_doctor_requests(doctor_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edr_status ON emergency_doctor_requests(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ecm_conversation_id ON emergency_chat_messages(conversation_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ecm_created_at ON emergency_chat_messages(created_at);`);

    // Seed SIH Demo Hospital & Doctor
    await client.query(`
      INSERT INTO hospitals (id, name, address) 
      VALUES ('hosp-demo', 'Government General Hospital', 'Pune') 
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;
    `);
    await client.query(`
      INSERT INTO doctors (id, hospital_id, name, specialty, availability) 
      VALUES ('doc-demo', 'hosp-demo', 'Dr. Rajesh Sharma', 'Emergency Medicine', 'AVAILABLE') 
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, specialty = EXCLUDED.specialty, availability = EXCLUDED.availability;
    `);

    logger.info({ tag: '[SCHEMA]', message: '✅ all tables, indices, and seed data verified' });
  } catch (schemaErr: any) {
    // Re-throw so server.ts aborts startup
    throw new Error(`[SCHEMA] Failed to initialize database schema: ${schemaErr.message}`);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// closePool — called during graceful shutdown
// ─────────────────────────────────────────────────────────────
export async function closePool(): Promise<void> {
  logger.info({ tag: '[DATABASE]', message: 'Draining PostgreSQL connection pool...' });
  await pool.end();
  logger.info({ tag: '[DATABASE]', message: '✅ PostgreSQL connection pool closed cleanly' });
}
