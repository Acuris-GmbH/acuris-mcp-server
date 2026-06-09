import { z } from "zod";
import { AcurisClient } from "../api.js";

export const validateAddressInputSchema = {
  country: z
    .string()
    .min(2)
    .max(3)
    .describe(
      "ISO 3-letter country code (preferred, e.g. `gbr`, `usa`, `deu`, `fra`). ISO-2 also accepted.",
    ),
  input: z
    .string()
    .optional()
    .describe(
      "Single-line address — paste the whole address as one string, e.g. `10 Downing Street, London, SW1A 2AA`. Provide this OR the fielded inputs below.",
    ),
  street: z.string().optional().describe("Street name (fielded input)."),
  house_number: z.string().optional().describe("House / building number."),
  city: z.string().optional().describe("City / locality."),
  postcode: z.string().optional().describe("Postcode / ZIP."),
  state: z
    .string()
    .optional()
    .describe("State / region — required for USA, CAN, AUS, BRA, MEX."),
};

export const validateAddressInput = z.object(validateAddressInputSchema);

export async function runValidateAddress(
  client: AcurisClient,
  args: z.infer<typeof validateAddressInput>,
) {
  let inputPayload: unknown;
  if (args.input && args.input.trim()) {
    inputPayload = args.input.trim();
  } else {
    inputPayload = {
      street: args.street,
      house_number: args.house_number,
      city: args.city,
      postcode: args.postcode,
      state: args.state,
    };
  }
  return client.request<unknown>("POST", "/validate", {
    country: args.country,
    body: {
      input: inputPayload,
      country: args.country.toLowerCase(),
    },
  });
}

export const validateAddressTool = {
  name: "validate_address",
  title: "Validate Address",
  description:
    "Validate any postal address in 240+ countries against authoritative reference data. Returns standardised address, rooftop coordinates, confidence score (A-F), and UDPRN + UPRN for UK addresses.",
  inputSchema: validateAddressInputSchema,
};
