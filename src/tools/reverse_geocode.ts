import { z } from "zod";
import { AcurisClient } from "../api.js";

export const reverseGeocodeInputSchema = {
  lat: z.number().describe("Latitude (WGS84)."),
  lng: z.number().describe("Longitude (WGS84)."),
  radius_m: z
    .number()
    .int()
    .positive()
    .max(50_000)
    .optional()
    .describe("Search radius in metres around the lat/lng. Default 100 m."),
  country: z
    .string()
    .min(2)
    .max(3)
    .optional()
    .describe(
      "Optional ISO-3 country to restrict the search. Omit to search globally.",
    ),
};

export const reverseGeocodeInput = z.object(reverseGeocodeInputSchema);

export async function runReverseGeocode(
  client: AcurisClient,
  args: z.infer<typeof reverseGeocodeInput>,
) {
  return client.request<unknown>("GET", "/reverse", {
    country: args.country,
    params: {
      latitude: args.lat,
      longitude: args.lng,
      radius_m: args.radius_m ?? 100,
      limit: 1,
      country: args.country?.toLowerCase(),
    },
  });
}

export const reverseGeocodeTool = {
  name: "reverse_geocode",
  title: "Reverse Geocode",
  description:
    "Convert a latitude / longitude pair into the nearest known address. Restrict to a specific country with the optional `country` parameter.",
  inputSchema: reverseGeocodeInputSchema,
};
