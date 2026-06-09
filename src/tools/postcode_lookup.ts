import { z } from "zod";
import { AcurisClient } from "../api.js";

export const postcodeLookupInputSchema = {
  postcode: z
    .string()
    .min(3)
    .describe(
      "A UK postcode in any format (with or without space): `SW1A 2AA`, `M11AD`, `EH1 1YZ`.",
    ),
};

export const postcodeLookupInput = z.object(postcodeLookupInputSchema);

export async function runPostcodeLookup(
  client: AcurisClient,
  args: z.infer<typeof postcodeLookupInput>,
) {
  return client.request<unknown>("POST", "/postcode-lookup", {
    country: "gbr",
    body: { postcode: args.postcode, country: "gbr" },
  });
}

export const postcodeLookupTool = {
  name: "postcode_lookup",
  title: "Lookup UK Postcode",
  description:
    "Given a UK postcode, return every Royal Mail PAF delivery point at that postcode — street, house number, building, organisation, rooftop coordinates, UDPRN, and UPRN.",
  inputSchema: postcodeLookupInputSchema,
};
