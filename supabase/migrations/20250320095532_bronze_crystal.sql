/*
  # Add atomic booking procedure

  1. New Functions
    - book_appointment: Handles the entire booking process atomically
      - Verifies slot availability
      - Updates slot status
      - Creates booking record
      - Handles race conditions
      - Rolls back on failure

  2. Security
    - Function accessible to public
    - Maintains data integrity through transactions
*/

CREATE OR REPLACE FUNCTION book_appointment(
  p_slot_id uuid,
  p_patient_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot_status text;
  v_booking_id uuid;
BEGIN
  -- Start transaction
  BEGIN
    -- Lock the appointment slot for update
    SELECT status INTO v_slot_status
    FROM appointment_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    -- Check if slot exists and is available
    IF v_slot_status IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Appointment slot not found'
      );
    END IF;

    IF v_slot_status != 'available' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Appointment slot is no longer available'
      );
    END IF;

    -- Update slot status
    UPDATE appointment_slots
    SET status = 'booked'
    WHERE id = p_slot_id;

    -- Create booking record
    INSERT INTO bookings (
      patient_id,
      appointment_slot_id,
      status
    )
    VALUES (
      p_patient_id,
      p_slot_id,
      'confirmed'
    )
    RETURNING id INTO v_booking_id;

    -- Return success response
    RETURN json_build_object(
      'success', true,
      'booking_id', v_booking_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Roll back any changes
    RAISE NOTICE 'Error booking appointment: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;