# Delivery Zone Implementation

## Overview
The app now validates user addresses against a defined delivery zone polygon. Users can only set addresses within the delivery area.

## Database Structure

### Table: `delivery_zones`
- `id` (UUID): Primary key
- `name` (TEXT): Zone name (e.g., "Main Delivery Area")
- `boundary` (GEOGRAPHY POLYGON): PostGIS polygon defining the delivery area
- `is_active` (BOOLEAN): Whether the zone is currently active
- `created_at`, `updated_at`: Timestamps

### Functions

#### `is_within_delivery_zone(check_lon, check_lat)`
- Checks if a coordinate point falls within any active delivery zone
- Returns: BOOLEAN
- Uses PostGIS `ST_Covers` for efficient geospatial queries

#### `get_delivery_zone_geojson()`
- Returns the active delivery zone as GeoJSON
- Used for displaying the zone boundary on maps
- Returns: JSON

## Client-Side Implementation

### `lib/geospatial.ts`

#### `isWithinDeliveryZone(longitude, latitude)`
- Validates if a location is within the delivery zone
- Called before saving user addresses

#### `getDeliveryZonePolygon()`
- Fetches the delivery zone polygon coordinates
- Returns array of `{latitude, longitude}` for map display

### Address Picker Flow

1. User opens address picker
2. Delivery zone polygon loads and displays on map (orange overlay)
3. User selects location by dragging map
4. On confirm, location is validated against delivery zone
5. If outside zone: Shows error alert
6. If inside zone: Proceeds with address save

## Visual Indicators

- **Map Overlay**: Orange semi-transparent polygon shows delivery area
- **Border**: Solid orange line marks the boundary
- **Error Alert**: Clear message when user selects outside delivery area

## Current Delivery Zone

The polygon covers the Kawit, Cavite area with coordinates defined in the database.

### Updating the Delivery Zone

To update or add new delivery zones:

1. Draw polygon on [geojson.io](https://geojson.io)
2. Copy the polygon coordinates
3. Run migration to insert/update:

```sql
INSERT INTO delivery_zones (name, boundary, is_active)
VALUES (
  'New Zone Name',
  ST_GeographyFromText('POLYGON((lon1 lat1, lon2 lat2, ...))'),
  true
);
```

## Benefits

- **User Experience**: Clear visual feedback on delivery availability
- **Business Logic**: Prevents orders from unserviceable areas
- **Performance**: PostGIS spatial indexes make queries fast
- **Flexibility**: Easy to update delivery zones without code changes
- **Scalability**: Can support multiple zones (e.g., different cities)

## Future Enhancements

- Multiple delivery zones with different fees
- Time-based zone activation (e.g., lunch vs dinner coverage)
- Zone-specific delivery fees
- Admin panel to manage zones visually
