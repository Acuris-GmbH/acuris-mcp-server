import { z } from "zod";
import { AcurisClient } from "../api.js";

export const geocodeInputSchema = {
  country: z
    .string()
    .min(2)
    .max(3)
    .describe("ISO 3-letter country code, e.g. `gbr`, `usa`, `deu`."),
  street: z.string().optional(),
  house_number: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  state: z.string().optional(),
};

export const geocodeInput = z.object(geocodeInputSchema);

export async function runGeocode(
  client: AcurisClient,
  args: z.infer<typeof geocodeInput>,
) {
  return client.request<unknown>("GET", "/geocode", {
    country: args.country,
    params: {
      country: args.country.toLowerCase(),
      street: args.street,
      house_number: args.house_number,
      city: args.city,
      postcode: args.postcode,
      state: args.state,
    },
  });
}

export const geocodeTool = {
  name: "geocode",
  title: "Geocode Address",
  description:
    "Convert an address into latitude + longitude. Returns rooftop coordinates where available, falling back to street, postcode, or locality centroid (with `accuracy_type` indicating which).",
  inputSchema: geocodeInputSchema,
};
