# GeoJSON Implementation Guide

## What Changed

We've implemented **GeoJSON format with PostGIS** for storing and querying location coordinates.

---

## Database Changes

### PostGIS Extension
- Enabled PostGIS for geospatial queries
- Added spatial indexes for fast distance calculations

### User Table Columns
```sql
address_1_coords GEOGRAPHY(POINT, 4326)  -- GeoJSON Point for address 1
address_2_coords GEOGRAPHY(POINT, 4326)  -- GeoJSON Point for address 2
```

### Helper Function
```sql
get_delivery_distance(user_id, restaurant_lon, restaurant_lat)
-- Returns distance in kilometers
```

---

## GeoJSON Format

### Structure
```json
{
  "type": "Point",
  "coordinates": [120.9025, 14.4444]
}
```

**Important:** Coordinates are `[longitude, latitude]` (reversed from typical lat/lon order!)

---

## Code Changes

### 1. Type Definition (`type.d.ts`)
```typescript
export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface User {
    address_1_coords: GeoJSONPoint | null;
    address_2_coords: GeoJSONPoint | null;
}
```

### 2. Address Picker (`app/address-picker.tsx`)
- Creates GeoJSON Point when user confirms location
- Passes as JSON string via route params

### 3. Edit Profile (`app/(tabs)/edit-profile.tsx`)
- Receives GeoJSON from address picker
- Converts to WKT format for PostGIS: `POINT(lon lat)`
- Saves to database

### 4. Geospatial Helper (`lib/geospatial.ts`)
New utility functions:
- `getDeliveryDistance()` - Calculate distance from restaurant to user
- `calculateDeliveryFee()` - Calculate fee based on distance
- `isWithinDeliveryRadius()` - Check if user is within delivery range
- `RESTAURANT_LOCATION` - Your restaurant coordinates

---

## Usage Examples

### Calculate Delivery Distance
```typescript
import { getDeliveryDistance, RESTAURANT_LOCATION } from '@/lib/geospatial'

const distance = await getDeliveryDistance(
    userId,
    RESTAURANT_LOCATION.longitude,
    RESTAURANT_LOCATION.latitude
)

console.log(`Distance: ${distance} km`)
```

### Calculate Delivery Fee
```typescript
import { calculateDeliveryFee } from '@/lib/geospatial'

const fee = calculateDeliveryFee(3.5) // 3.5 km
console.log(`Delivery fee: ₱${fee}`) // ₱75
```

### Check Delivery Radius
```typescript
import { isWithinDeliveryRadius, RESTAURANT_LOCATION } from '@/lib/geospatial'

const canDeliver = await isWithinDeliveryRadius(
    userId,
    RESTAURANT_LOCATION.longitude,
    RESTAURANT_LOCATION.latitude,
    10 // 10km max
)

if (!canDeliver) {
    Alert.alert('Sorry', 'We don\'t deliver to your area')
}
```

### When User Places Order
```typescript
import { getDeliveryDistance, calculateDeliveryFee, RESTAURANT_LOCATION } from '@/lib/geospatial'

async function placeOrder(userId: string, cartTotal: number) {
    // Get distance
    const distance = await getDeliveryDistance(
        userId,
        RESTAURANT_LOCATION.longitude,
        RESTAURANT_LOCATION.latitude
    )
    
    if (!distance) {
        Alert.alert('Error', 'Could not calculate delivery distance')
        return
    }
    
    // Check if within range
    if (distance > 10) {
        Alert.alert('Sorry', 'We only deliver within 10km')
        return
    }
    
    // Calculate fee
    const deliveryFee = calculateDeliveryFee(distance)
    const totalAmount = cartTotal + deliveryFee
    
    // Create order
    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            total_price: totalAmount,
            delivery_fee: deliveryFee,
            status: 'pending'
        })
    
    console.log(`Order placed! Distance: ${distance}km, Fee: ₱${deliveryFee}`)
}
```

---

## Benefits

✅ **Fast Distance Calculations** - Database does the math using spatial indexes
✅ **Delivery Radius Validation** - Automatically check if user is within range
✅ **Dynamic Delivery Fees** - Calculate based on actual distance
✅ **Scalable** - Works efficiently even with thousands of users
✅ **Standard Format** - GeoJSON is industry standard

---

## Restaurant Location

Update `RESTAURANT_LOCATION` in `lib/geospatial.ts` with your actual coordinates:

```typescript
export const RESTAURANT_LOCATION = {
    longitude: 120.9025,  // ← Update this
    latitude: 14.4444,    // ← Update this
    name: 'Your Restaurant Name',
    address: 'Your Restaurant Address'
}
```

---

## Next Steps

1. Update `RESTAURANT_LOCATION` with your actual coordinates
2. Test the address picker and save functionality
3. Implement delivery fee calculation in checkout
4. Add delivery radius validation when placing orders
5. Consider adding multiple restaurant locations in the future
