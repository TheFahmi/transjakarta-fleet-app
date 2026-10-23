export type VehicleStatus = 'IN_TRANSIT_TO' | 'STOPPED_AT' | 'INCOMING_AT' | string;

export interface VehicleAttributes {
  label: string | null;
  current_status: VehicleStatus | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
  bearing: number | null;
  speed: number | null;
  occupancy_status: string | null;
  direction_id: number | null;
  current_stop_sequence: number | null;
  carriages: Array<{ label?: string; occupancy_status?: string; occupancy_percentage?: number }> | null;
  revenue: boolean | null;
}

export interface RouteAttributes {
  long_name: string;
  short_name: string;
  color: string;
  text_color: string;
  description: string;
  type: number;
}

export interface TripAttributes {
  headsign: string;
  name: string;
  direction_id: number;
  block_id: string | null;
  wheelchair_accessible: number;
  bikes_allowed: number;
}

export interface Route {
  id: string;
  type: string;
  attributes: RouteAttributes;
}

export interface Trip {
  id: string;
  type: string;
  attributes: TripAttributes;
}

export interface Vehicle {
  id: string;
  type: string;
  attributes: VehicleAttributes;
  routeId: string | null;
  tripId: string | null;
  stopId: string | null;
  route?: Route | null;
  trip?: Trip | null;
}

export interface VehiclesResult {
  vehicles: Vehicle[];
  totalPages: number;
  totalCountEstimate: number;
  lastOffset: number;
  page: number;
  perPage: number;
}

export interface OptionItem {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
  textColor?: string;
}

export interface PaginatedOptionsResult {
  items: OptionItem[];
  hasMore: boolean;
  nextOffset: number;
  totalPages: number;
}

// Raw JSON:API shapes
export interface JsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: { id: string; type: string } | Array<{ id: string; type: string }> | null }>;
}

export interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  links?: { first?: string; last?: string; next?: string; prev?: string };
  errors?: Array<{ title?: string; detail?: string; status?: string }>;
}
