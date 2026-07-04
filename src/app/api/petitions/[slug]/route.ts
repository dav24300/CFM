import { NextRequest } from "next/server";

import { getPetition, signPetitionBySlug } from "@/application/services/petition.service";

import { handleDomainError, jsonData, jsonError, jsonSuccess } from "@/lib/api-response";

import { parseOrBadRequest } from "@/lib/validators";
import { petitionSignSchema } from "@/lib/validators/public-api";



export async function GET(

  _request: NextRequest,

  { params }: { params: Promise<{ slug: string }> }

) {

  const { slug } = await params;

  const petition = await getPetition(slug);

  if (!petition) {

    return jsonError("Non trouvé", 404);

  }

  return jsonData(petition);

}



export async function POST(

  request: NextRequest,

  { params }: { params: Promise<{ slug: string }> }

) {

  try {

    const { slug } = await params;

    const petition = await getPetition(slug);

    if (!petition) {

      return jsonError("Non trouvé", 404);

    }



    const body = await request.json();

    const parsed = parseOrBadRequest(petitionSignSchema, body, "Nom et email obligatoires");

    if (!parsed.ok) return parsed.response;



    await signPetitionBySlug(slug, parsed.data);

    return jsonSuccess();

  } catch (err) {

    return handleDomainError(err);

  }

}

