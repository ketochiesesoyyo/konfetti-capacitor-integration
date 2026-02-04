/**
 * Hardened admin queries with fallback logic
 * These queries are designed to be resilient across environments
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  captureAdminError, 
  isSchemaError, 
  setSchemaChecks,
  type SchemaCheck 
} from "@/lib/adminDiagnostics";

export interface HostedEvent {
  id: string;
  name: string;
  date: string | null;
  status: string;
  invite_code: string;
  image_url: string | null;
  close_date: string;
  created_at: string;
  event_attendees: { count: number }[];
  contacts: {
    id: string;
    contact_type: string;
    contact_name: string;
    email: string | null;
    phone: string | null;
    company_id: string | null;
    companies: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface Contact {
  id: string;
  contact_type: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source_request_id: string | null;
  company_id: string | null;
  companies: {
    id: string;
    name: string;
  } | null;
  events: { id: string; name: string; date: string | null; status?: string }[];
}

export interface Company {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Check schema compatibility - verifies required columns/tables exist
 */
export const checkSchemaCompatibility = async (): Promise<{
  compatible: boolean;
  checks: SchemaCheck[];
}> => {
  const checks: SchemaCheck[] = [];

  // Check 1: events.contact_id column exists
  try {
    const { error } = await supabase
      .from('events')
      .select('contact_id')
      .limit(1);
    
    if (error) {
      checks.push({
        name: 'events.contact_id',
        passed: false,
        error: error.message,
      });
    } else {
      checks.push({ name: 'events.contact_id', passed: true });
    }
  } catch (e: any) {
    checks.push({
      name: 'events.contact_id',
      passed: false,
      error: e?.message || 'Unknown error',
    });
  }

  // Check 2: contacts table exists
  try {
    const { error } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);
    
    if (error) {
      checks.push({
        name: 'contacts table',
        passed: false,
        error: error.message,
      });
    } else {
      checks.push({ name: 'contacts table', passed: true });
    }
  } catch (e: any) {
    checks.push({
      name: 'contacts table',
      passed: false,
      error: e?.message || 'Unknown error',
    });
  }

  // Check 3: companies table exists
  try {
    const { error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      checks.push({
        name: 'companies table',
        passed: false,
        error: error.message,
      });
    } else {
      checks.push({ name: 'companies table', passed: true });
    }
  } catch (e: any) {
    checks.push({
      name: 'companies table',
      passed: false,
      error: e?.message || 'Unknown error',
    });
  }

  // Check 4: event_attendees with count
  try {
    const { error } = await supabase
      .from('event_attendees')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      checks.push({
        name: 'event_attendees access',
        passed: false,
        error: error.message,
      });
    } else {
      checks.push({ name: 'event_attendees access', passed: true });
    }
  } catch (e: any) {
    checks.push({
      name: 'event_attendees access',
      passed: false,
      error: e?.message || 'Unknown error',
    });
  }

  setSchemaChecks(checks);

  const compatible = checks.every(c => c.passed);
  return { compatible, checks };
};

/**
 * Load hosted events with fallback logic
 * Primary: Use relational join
 * Fallback: Two-step fetch if join fails
 */
export const loadHostedEventsHardened = async (): Promise<{
  data: HostedEvent[];
  error: string | null;
  usedFallback: boolean;
}> => {
  // Try primary query with relational joins
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(count), contacts!contact_id(id, contact_type, contact_name, email, phone, company_id, companies(id, name))')
      .order('date', { ascending: false });

    if (!error && data) {
      return { 
        data: data as HostedEvent[], 
        error: null, 
        usedFallback: false 
      };
    }

    // If error is not schema-related, capture and return
    if (error && !isSchemaError(error)) {
      captureAdminError('loadHostedEvents (primary)', error);
      return { 
        data: [], 
        error: `Error al cargar Eventos (Ref: ${error.code || 'UNKNOWN'})`, 
        usedFallback: false 
      };
    }

    // Schema error - fall through to fallback
    captureAdminError('loadHostedEvents (primary - schema)', error);
  } catch (e) {
    captureAdminError('loadHostedEvents (primary - exception)', e);
  }

  // Fallback: Two-step fetch
  console.log('[Admin] Using fallback query for events');
  
  try {
    // Step 1: Fetch events without joins
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, name, date, status, invite_code, image_url, close_date, created_at, contact_id')
      .order('date', { ascending: false });

    if (eventsError) {
      captureAdminError('loadHostedEvents (fallback-events)', eventsError);
      return { 
        data: [], 
        error: `Error al cargar Eventos (Ref: ${eventsError.code || 'FB1'})`, 
        usedFallback: true 
      };
    }

    // Step 2: Fetch attendee counts
    const eventIds = (eventsData || []).map(e => e.id);
    let attendeeCounts: Record<string, number> = {};
    
    if (eventIds.length > 0) {
      try {
        // Get counts per event
        for (const eventId of eventIds) {
          const { count } = await supabase
            .from('event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          attendeeCounts[eventId] = count || 0;
        }
      } catch (e) {
        console.warn('[Admin] Could not fetch attendee counts:', e);
      }
    }

    // Step 3: Fetch contacts for events
    const contactIds = [...new Set((eventsData || []).map(e => e.contact_id).filter(Boolean))];
    let contactsMap: Record<string, any> = {};
    let companiesMap: Record<string, any> = {};

    if (contactIds.length > 0) {
      try {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, contact_type, contact_name, email, phone, company_id')
          .in('id', contactIds);

        if (contactsData) {
          contactsData.forEach(c => { contactsMap[c.id] = c; });

          // Fetch companies for contacts
          const companyIds = [...new Set(contactsData.map(c => c.company_id).filter(Boolean))];
          if (companyIds.length > 0) {
            const { data: companiesData } = await supabase
              .from('companies')
              .select('id, name')
              .in('id', companyIds as string[]);

            if (companiesData) {
              companiesData.forEach(c => { companiesMap[c.id] = c; });
            }
          }
        }
      } catch (e) {
        console.warn('[Admin] Could not fetch contacts for events:', e);
      }
    }

    // Map everything together
    const mappedEvents: HostedEvent[] = (eventsData || []).map(event => {
      const contact = event.contact_id ? contactsMap[event.contact_id] : null;
      const company = contact?.company_id ? companiesMap[contact.company_id] : null;

      return {
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status,
        invite_code: event.invite_code,
        image_url: event.image_url,
        close_date: event.close_date,
        created_at: event.created_at,
        event_attendees: [{ count: attendeeCounts[event.id] || 0 }],
        contacts: contact ? {
          id: contact.id,
          contact_type: contact.contact_type,
          contact_name: contact.contact_name,
          email: contact.email,
          phone: contact.phone,
          company_id: contact.company_id,
          companies: company,
        } : null,
      };
    });

    return { 
      data: mappedEvents, 
      error: null, 
      usedFallback: true 
    };
  } catch (e: any) {
    captureAdminError('loadHostedEvents (fallback-exception)', e);
    return { 
      data: [], 
      error: `Error al cargar Eventos (Ref: FB-EX)`, 
      usedFallback: true 
    };
  }
};

/**
 * Load contacts with fallback logic
 */
export const loadContactsHardened = async (): Promise<{
  data: Contact[];
  error: string | null;
  usedFallback: boolean;
}> => {
  try {
    // Step 1: Fetch contacts with companies
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*, companies(id, name)')
      .order('created_at', { ascending: false });

    if (contactsError) {
      captureAdminError('loadContacts (contacts)', contactsError);
      
      // If schema error, try without join
      if (isSchemaError(contactsError)) {
        const { data: plainContacts, error: plainError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (plainError) {
          captureAdminError('loadContacts (fallback-plain)', plainError);
          return { 
            data: [], 
            error: `Error al cargar Clientes (Ref: ${plainError.code || 'UNKNOWN'})`, 
            usedFallback: true 
          };
        }

        // Map without companies
        const mappedContacts = (plainContacts || []).map(c => ({
          ...c,
          companies: null,
          events: [],
        }));

        return { 
          data: mappedContacts as Contact[], 
          error: null, 
          usedFallback: true 
        };
      }

      return { 
        data: [], 
        error: `Error al cargar Clientes (Ref: ${contactsError.code || 'UNKNOWN'})`, 
        usedFallback: false 
      };
    }

    // Step 2: Fetch events for contacts
    let eventsData: any[] = [];
    try {
      const { data, error: eventsError } = await supabase
        .from('events')
        .select('id, name, date, status, contact_id')
        .not('contact_id', 'is', null);

      if (!eventsError && data) {
        eventsData = data;
      } else if (eventsError) {
        console.warn('[Admin] Could not fetch contact events:', eventsError);
      }
    } catch (e) {
      console.warn('[Admin] Exception fetching contact events:', e);
    }

    // Map events to their contacts
    const contactsWithEvents = (contactsData || []).map(contact => ({
      ...contact,
      events: eventsData
        .filter(event => event.contact_id === contact.id)
        .map(event => ({ 
          id: event.id, 
          name: event.name, 
          date: event.date, 
          status: event.status 
        }))
    }));

    return { 
      data: contactsWithEvents as Contact[], 
      error: null, 
      usedFallback: false 
    };
  } catch (e: any) {
    captureAdminError('loadContacts (exception)', e);
    return { 
      data: [], 
      error: `Error al cargar Clientes (Ref: EX)`, 
      usedFallback: true 
    };
  }
};

/**
 * Load companies
 */
export const loadCompaniesHardened = async (): Promise<{
  data: Company[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      captureAdminError('loadCompanies', error);
      return { 
        data: [], 
        error: `Error al cargar Empresas (Ref: ${error.code || 'UNKNOWN'})` 
      };
    }

    return { data: (data || []) as Company[], error: null };
  } catch (e: any) {
    captureAdminError('loadCompanies (exception)', e);
    return { data: [], error: `Error al cargar Empresas (Ref: EX)` };
  }
};
