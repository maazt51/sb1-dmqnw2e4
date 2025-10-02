import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const UIPATH_PROCESS_URL = 'https://cloud.uipath.com/dsnperio/DefaultTenant/orchestrator_/t/fa8f4ea1-1074-4190-95f6-b1365d4a735c/MBookingBot1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  returningPatient: boolean;
  gender: string;
  referringDoctor?: string;
  reasonForVisit?: string;
}

interface AppointmentData {
  date: string;
  startTime: string;
  endTime: string;
  slotId: string;
  locationId: string;
  providerId: string;
}

interface LocationData {
  id: string;
  name: string;
}

interface ProviderData {
  id: string;
  name: string;
}

interface BookingPayload {
  patient: PatientData;
  appointment: AppointmentData;
  location: LocationData;
  provider: ProviderData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Get the booking payload from the request
    const bookingPayload: BookingPayload = await req.json();

    // Validate required fields
    if (!bookingPayload.patient.email || !bookingPayload.patient.phone) {
      throw new Error('Missing required patient information');
    }

    // Use the direct access token from the curl command
    const accessToken = 'rt_61F2CD4E53B6D1EAF8D79BF8BC2CBAA0993C4B341EF7130089E27C21C6CED50F-1';

    // Send booking request to UiPath
    const response = await fetch(UIPATH_PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('UiPath process error:', response.status, errorData);
      throw new Error(errorData.message || `Booking failed: ${response.statusText}`);
    }

    const uiPathResponse = await response.json();
    
    // Transform UiPath response to our expected format
    const responseData = {
      success: true,
      processId: uiPathResponse.id,
      jobKey: uiPathResponse.key,
      state: uiPathResponse.state,
      creationTime: uiPathResponse.creationTime,
      organizationUnitId: uiPathResponse.organizationUnitId
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});